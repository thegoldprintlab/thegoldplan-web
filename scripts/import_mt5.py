#!/usr/bin/env python3
"""
Import MT5 screenshot trade rows into The Gold Plan Supabase DB.

Steps:
  1. Merge part_0_known.json + part_a/b/c/d.json (vision extraction outputs).
  2. Cross-image dedupe: when the SAME trade row (open_time, type, open_price,
     close_time, close_price, profit) appears in multiple screenshots (scroll
     overlap), keep the max multiplicity seen in any single image.
  3. Classify session from open_time (server time shown in MT5).
  4. Compute pips = round(diff * 10, 1)   (XAUUSD: 0.10 price = 1 pip)
     profit_loss = REAL profit from screenshot (truthful).
     trade_date = 2026-08-25 (MT5 shows "08.25").
  5. Insert all rows (account "Personal", emotion "", notes "") via Supabase REST.

Usage:
  python3 scripts/import_mt5.py --dry-run   # print what WOULD be inserted
  python3 scripts/import_mt5.py --commit    # actually insert
"""
import json
import os
import sys
import urllib.request
import urllib.error
import math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTRACT_DIR = os.path.join(ROOT, ".extract")

FIELDS = ("open_time", "type", "open_price", "close_time", "close_price", "profit")

def load_env():
    env = {}
    with open(os.path.join(ROOT, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

def session_for(open_time: str) -> str:
    """open_time like '08.25 13:00' (broker server time)."""
    try:
        hh = int(open_time.split(" ")[1].split(":")[0])
    except Exception:
        return "London (Lon)"
    if 21 <= hh or hh < 3:
        return "Australia (Aus)"
    if 3 <= hh < 8:
        return "Tokyo (Tok)"
    if 8 <= hh < 13:
        return "London (Lon)"
    if 13 <= hh < 17:
        return "New York (NY)"
    return "New York (NY)"

def js_round(x):
    """Match JS Math.round (half away from zero for .5, and toward +inf for negatives...).
    JS Math.round(-7.6) = -8 ; python round(-7.6) = -8 as well for x.5 only differs.
    We replicate JS: floor(x + 0.5)."""
    return math.floor(x + 0.5)

def compute_pips(typ, entry, exit_):
    raw = (exit_ - entry) if typ == "buy" else (entry - exit_)
    # App/seed convention: XAUUSD 1 pip = 0.1 price → pips = price_diff * 10.
    # (1.70 move = 17 pips, $10/pip = $170)
    return round(raw * 10, 1)

def key_of(r):
    return tuple(r.get(f) for f in FIELDS)

def load_rows():
    files = [f for f in os.listdir(EXTRACT_DIR) if f.endswith(".json")]
    files.sort()
    merged = []
    for fn in files:
        with open(os.path.join(EXTRACT_DIR, fn)) as f:
            arr = json.load(f)
        for r in arr:
            r = dict(r)
            r["_file"] = fn
            merged.append(r)
    return merged

def dedupe_cross_image(rows):
    """A trade row may appear in multiple screenshots (scroll overlap) and a
    single screenshot may be extracted more than once into different files.
    True multiplicity of a distinct trade = max over files of count(key in that
    file)."""
    per_img_file = {}
    for r in rows:
        img = r.get("image", "?")
        fn = r.get("_file", "?")
        k = key_of(r)
        per_img_file.setdefault(img, {})
        per_img_file[img].setdefault(fn, {})
        per_img_file[img][fn][k] = per_img_file[img][fn].get(k, 0) + 1
    global_max = {}
    for img, files in per_img_file.items():
        for fn, counts in files.items():
            for k, c in counts.items():
                if c > global_max.get(k, 0):
                    global_max[k] = c
    out = []
    emitted = {}
    for r in rows:
        k = key_of(r)
        n = emitted.get(k, 0)
        if n < global_max[k]:
            out.append(r)
            emitted[k] = n + 1
    return out

def build_insert_rows(rows, account="Personal"):
    out = []
    for r in rows:
        typ = str(r.get("type", "")).lower()
        entry = float(r["open_price"])
        exit_ = float(r["close_price"])
        profit = float(r["profit"])
        ot = str(r.get("open_time", ""))
        # date from open_time '08.25' -> 2026-08-25
        md = ot.split(" ")[0]  # '08.25'
        mm, dd = md.split(".")
        trade_date = f"2026-{int(mm):02d}-{int(dd):02d}"
        out.append({
            "trade_date": trade_date,
            "account": account,
            "session": session_for(ot),
            "setup": "Others",
            "direction": "BUY" if typ == "buy" else "SELL",
            "entry_price": entry,
            "exit_price": exit_,
            "pips": compute_pips(typ, entry, exit_),
            "profit_loss": profit,
            "emotion": "",
            "notes": "",
            "open_time": ot,
            "type": typ,
            "close_time": r.get("close_time", ""),
            "image": r.get("image", ""),
        })
    return out

def req(method, path, body=None, token=None, extra=None, url=None, anon=None):
    u = url + path
    data = json.dumps(body).encode() if body is not None else None
    h = {"apikey": anon, "Content-Type": "application/json"}
    if token:
        h["Authorization"] = "Bearer " + token
    if extra:
        h.update(extra)
    rq = urllib.request.Request(u, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(rq) as resp:
            return resp.status, resp.read().decode(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), dict(e.headers)

def main():
    commit = "--commit" in sys.argv
    dry = "--dry-run" in sys.argv or not commit

    # optional: --account "Cent" (default Personal)
    account = "Personal"
    for a in sys.argv[1:]:
        if a.startswith("--account="):
            account = a.split("=", 1)[1]
        elif a == "--account" and sys.argv.index(a) + 1 < len(sys.argv):
            account = sys.argv[sys.argv.index(a) + 1]

    env = load_env()
    URL = env["VITE_SUPABASE_URL"].rstrip("/")
    ANON = env["VITE_SUPABASE_ANON_KEY"]

    rows = load_rows()
    print(f"[merge] raw rows loaded: {len(rows)}")
    uniq = dedupe_cross_image(rows)
    print(f"[merge] after cross-image dedupe: {len(uniq)}")

    ins = build_insert_rows(uniq, account=account)
    print(f"[build] insert rows: {len(ins)}")

    # summary by session & type
    from collections import Counter
    by_session = Counter(i["session"] for i in ins)
    by_type = Counter(i["direction"] for i in ins)
    total_pnl = sum(i["profit_loss"] for i in ins)
    print("sessions:", dict(by_session))
    print("directions:", dict(by_type))
    print(f"total real P&L: {total_pnl:.2f}")

    if dry:
        print("\n--- DRY RUN (first 15 rows) ---")
        for i in ins[:15]:
            print(f"{i['open_time']} -> {i['close_time']} {i['direction']} {i['entry_price']}->{i['exit_price']} pips={i['pips']} pnl={i['profit_loss']} session={i['session']} [{i['image']}]")
        print(f"... and {max(0, len(ins)-15)} more")
        print("\nUse --commit to insert.")
        return

    # auth
    st, txt, _ = req("POST", "/auth/v1/token?grant_type=password",
                     {"email": "arfasyrf@gmail.com", "password": "test123"},
                     url=URL, anon=ANON)
    if st >= 300:
        print("AUTH FAIL", st, txt[:300]); sys.exit(1)
    tok = json.loads(txt)["access_token"]
    uid = json.loads(txt)["user"]["id"]

    ok = fail = 0
    for i in ins:
        body = {
            "user_id": uid,
            "trade_date": i["trade_date"],
            "account": i["account"],
            "session": i["session"],
            "setup": i["setup"],
            "direction": i["direction"],
            "entry_price": i["entry_price"],
            "exit_price": i["exit_price"],
            "pips": i["pips"],
            "profit_loss": i["profit_loss"],
            "emotion": i["emotion"],
            "notes": i["notes"],
            "volatility": "Normal",
        }
        st, txt, _ = req("POST", "/rest/v1/trades", body=body, token=tok,
                         extra={"Prefer": "return=minimal"}, url=URL, anon=ANON)
        if st == 201:
            ok += 1
        else:
            fail += 1
            if fail <= 5:
                print("INSERT FAIL", st, txt[:200], "row:", i["open_time"], i["entry_price"])
    print(f"\nINSERT DONE: ok={ok} fail={fail}")

    # verify
    st, txt, hdrs = req("GET", f"/rest/v1/trades?user_id=eq.{uid}&select=id",
                        token=tok, extra={"Prefer": "count=exact"}, url=URL, anon=ANON)
    print("DB total trades now:", hdrs.get("content-range"))

if __name__ == "__main__":
    main()
