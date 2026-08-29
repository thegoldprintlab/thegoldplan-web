#!/usr/bin/env python3
"""
Import MT5 cent-account (XAUUSDc) trade rows into The Gold Plan Supabase DB.

Batch 2: iPhone screenshots 08.26-08.28 (26 images, .extract_cent/*.json).

Rules (same as earlier import):
  - Cross-image dedupe on price-based key (open_time,type,volume,open_price,
    close_time,close_price); profit is COMPUTED from formula (fixes OCR drift):
        profit = (close-open)*volume*100 for buy, (open-close)*volume*100 for sell
  - session from open_time (broker server time)
  - pips = diff*10 (XAUUSD 1 pip = 0.10)
  - account = "Cent", setup = "Others", emotion/notes empty, volatility Normal
"""
import json
import os
import sys
import math
import urllib.request
import urllib.error
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTRACT_DIR = os.path.join(ROOT, ".extract_cent")
ACCOUNT = "Cent"


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
    try:
        hh = int(open_time.split(" ")[1].split(":")[0])
    except Exception:
        return "New York (NY)"
    if 21 <= hh or hh < 3:
        return "Australia (Aus)"
    if 3 <= hh < 8:
        return "Tokyo (Tok)"
    if 8 <= hh < 13:
        return "London (Lon)"
    if 13 <= hh < 17:
        return "New York (NY)"
    return "New York (NY)"


def computed_profit(r):
    o = float(r["open_price"])
    c = float(r["close_price"])
    v = float(r["volume"])
    diff = (c - o) if str(r["type"]).lower() == "buy" else (o - c)
    return round(diff * v * 100, 2)


def compute_pips(typ, entry, exit_):
    raw = (exit_ - entry) if typ == "buy" else (entry - exit_)
    return round(raw * 10, 1)


def key_of(r):
    return (str(r.get("open_time")), str(r.get("type")).lower(),
            float(r.get("volume")), float(r["open_price"]),
            str(r.get("close_time")), float(r["close_price"]))


def load_uniq():
    rows = []
    for fn in sorted(os.listdir(EXTRACT_DIR)):
        if not fn.endswith(".json"):
            continue
        for r in json.load(open(os.path.join(EXTRACT_DIR, fn))):
            r = dict(r)
            r["_file"] = fn
            rows.append(r)
    # cross-image dedupe (max multiplicity per image)
    per_img_file = {}
    for r in rows:
        img = r.get("image", "?")
        fn = r.get("_file", "?")
        k = key_of(r)
        per_img_file.setdefault(img, {}).setdefault(fn, {})
        per_img_file[img][fn][k] = per_img_file[img][fn].get(k, 0) + 1
    global_max = {}
    for img, files in per_img_file.items():
        for fn, cnt in files.items():
            for k, c in cnt.items():
                global_max[k] = max(global_max.get(k, 0), c)
    emitted = {}
    uniq = []
    for r in rows:
        k = key_of(r)
        n = emitted.get(k, 0)
        if n < global_max[k]:
            rr = dict(r)
            rr["profit"] = computed_profit(r)
            uniq.append(rr)
            emitted[k] = n + 1
    return uniq


def build_rows(uniq):
    out = []
    for r in uniq:
        typ = str(r["type"]).lower()
        entry = float(r["open_price"])
        exit_ = float(r["close_price"])
        ot = str(r.get("open_time", ""))
        md = ot.split(" ")[0]
        mm, dd = md.split(".")
        trade_date = f"2026-{int(mm):02d}-{int(dd):02d}"
        out.append({
            "trade_date": trade_date,
            "account": ACCOUNT,
            "session": session_for(ot),
            "setup": "Others",
            "direction": "BUY" if typ == "buy" else "SELL",
            "entry_price": entry,
            "exit_price": exit_,
            "pips": compute_pips(typ, entry, exit_),
            "profit_loss": r["profit"],
            "emotion": "",
            "notes": "",
            "volatility": "Normal",
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
    env = load_env()
    URL = env["VITE_SUPABASE_URL"].rstrip("/")
    ANON = env["VITE_SUPABASE_ANON_KEY"]

    uniq = load_uniq()
    ins = build_rows(uniq)
    print(f"[merge] raw={len([1 for _ in __import__('os').listdir(EXTRACT_DIR) if _.endswith('.json')])} files, uniq trades={len(uniq)}")
    print("[build] insert rows:", len(ins))

    by_date = Counter(i["trade_date"] for i in ins)
    by_sess = Counter(i["session"] for i in ins)
    by_dir = Counter(i["direction"] for i in ins)
    total = sum(i["profit_loss"] for i in ins)
    print("dates:", dict(sorted(by_date.items())))
    print("sessions:", dict(by_sess))
    print("directions:", dict(by_dir))
    print(f"total P&L (computed): {total:+.2f}")

    if not commit:
        print("\n--- DRY RUN (first 12) ---")
        for i in ins[:12]:
            print(f"{i['trade_date']} {i['session']:16s} {i['direction']} {i['entry_price']}->{i['exit_price']} pips={i['pips']:>7} pnl={i['profit_loss']:>8} [{i['account']}]")
        print(f"... {len(ins)-12} more. Use --commit.")
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
            "volatility": i["volatility"],
        }
        st, txt, _ = req("POST", "/rest/v1/trades", body=body, token=tok,
                         extra={"Prefer": "return=minimal"}, url=URL, anon=ANON)
        if st == 201:
            ok += 1
        else:
            fail += 1
            if fail <= 5:
                print("INSERT FAIL", st, txt[:200], i["trade_date"], i["entry_price"])
    print(f"\nINSERT DONE: ok={ok} fail={fail}")

    # verify counts per account
    st, txt, hdrs = req("GET", f"/rest/v1/trades?user_id=eq.{uid}&select=account,trade_date&order=trade_date.desc", token=tok, url=URL, anon=ANON)
    rows = json.loads(txt)
    print("DB total trades:", len(rows))
    print("by account:", dict(Counter(r["account"] for r in rows)))


if __name__ == "__main__":
    main()
