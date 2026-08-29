#!/usr/bin/env python3
"""
One-shot migration for The Gold Plan cent-account data.

Steps:
  1. Delete ALL existing trades (they were wrongly labelled "Personal").
  2. Re-insert batch 1 (08.25, .extract/) as account "Cent".
  3. Insert batch 2 (08.26-08.28, .extract_cent/) as account "Cent".
  4. Update settings.accounts: rename "Personal" -> "Cent".
  5. Verify counts by account/date + total P&L.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_env():
    env = {}
    with open(os.path.join(ROOT, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


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


def build_rows_batch1():
    """Reuse import_mt5.py logic via subprocess-free inline copy."""
    import math
    EXTRACT = os.path.join(ROOT, ".extract")
    FIELDS = ("open_time", "type", "open_price", "close_time", "close_price", "profit")

    def session_for(ot):
        try:
            hh = int(ot.split(" ")[1].split(":")[0])
        except Exception:
            return "New York (NY)"
        if 21 <= hh or hh < 3:
            return "Australia (Aus)"
        if 3 <= hh < 8:
            return "Tokyo (Tok)"
        if 8 <= hh < 13:
            return "London (Lon)"
        return "New York (NY)"

    def key(r):
        return tuple(r.get(f) for f in FIELDS)

    rows = []
    for fn in sorted(os.listdir(EXTRACT)):
        if not fn.endswith(".json"):
            continue
        for r in json.load(open(os.path.join(EXTRACT, fn))):
            r = dict(r); r["_file"] = fn; rows.append(r)
    per_img_file = {}
    for r in rows:
        img = r.get("image", "?"); fn = r.get("_file", "?")
        k = key(r)
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
        k = key(r)
        n = emitted.get(k, 0)
        if n < global_max[k]:
            uniq.append(r); emitted[k] = n + 1

    out = []
    for r in uniq:
        typ = str(r["type"]).lower()
        entry = float(r["open_price"]); exit_ = float(r["close_price"])
        ot = str(r.get("open_time", ""))
        mm, dd = ot.split(" ")[0].split(".")
        out.append({
            "trade_date": f"2026-{int(mm):02d}-{int(dd):02d}",
            "account": "Cent", "session": session_for(ot), "setup": "Others",
            "direction": "BUY" if typ == "buy" else "SELL",
            "entry_price": entry, "exit_price": exit_,
            "pips": round(((exit_-entry) if typ=="buy" else (entry-exit_))*10, 1),
            "profit_loss": float(r["profit"]), "emotion": "", "notes": "",
            "volatility": "Normal",
        })
    return out


def build_rows_batch2():
    import math
    EXTRACT = os.path.join(ROOT, ".extract_cent")

    def session_for(ot):
        try:
            hh = int(ot.split(" ")[1].split(":")[0])
        except Exception:
            return "New York (NY)"
        if 21 <= hh or hh < 3:
            return "Australia (Aus)"
        if 3 <= hh < 8:
            return "Tokyo (Tok)"
        if 8 <= hh < 13:
            return "London (Lon)"
        return "New York (NY)"

    def key(r):
        return (str(r.get("open_time")), str(r.get("type")).lower(),
                float(r.get("volume")), float(r["open_price"]),
                str(r.get("close_time")), float(r["close_price"]))

    def cprofit(r):
        o = float(r["open_price"]); c = float(r["close_price"]); v = float(r["volume"])
        diff = (c-o) if str(r["type"]).lower() == "buy" else (o-c)
        return round(diff*v*100, 2)

    rows = []
    for fn in sorted(os.listdir(EXTRACT)):
        if not fn.endswith(".json"):
            continue
        for r in json.load(open(os.path.join(EXTRACT, fn))):
            r = dict(r); r["_file"] = fn; rows.append(r)
    per_img_file = {}
    for r in rows:
        img = r.get("image", "?"); fn = r.get("_file", "?")
        k = key(r)
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
        k = key(r)
        n = emitted.get(k, 0)
        if n < global_max[k]:
            rr = dict(r); rr["profit"] = cprofit(r); uniq.append(rr); emitted[k] = n + 1

    out = []
    for r in uniq:
        typ = str(r["type"]).lower()
        entry = float(r["open_price"]); exit_ = float(r["close_price"])
        ot = str(r.get("open_time", ""))
        mm, dd = ot.split(" ")[0].split(".")
        out.append({
            "trade_date": f"2026-{int(mm):02d}-{int(dd):02d}",
            "account": "Cent", "session": session_for(ot), "setup": "Others",
            "direction": "BUY" if typ == "buy" else "SELL",
            "entry_price": entry, "exit_price": exit_,
            "pips": round(((exit_-entry) if typ=="buy" else (entry-exit_))*10, 1),
            "profit_loss": float(r["profit"]), "emotion": "", "notes": "",
            "volatility": "Normal",
        })
    return out


def main():
    env = load_env()
    URL = env["VITE_SUPABASE_URL"].rstrip("/")
    ANON = env["VITE_SUPABASE_ANON_KEY"]

    st, txt, _ = req("POST", "/auth/v1/token?grant_type=password",
                     {"email": "arfasyrf@gmail.com", "password": "test123"}, url=URL, anon=ANON)
    if st >= 300:
        print("AUTH FAIL", st, txt[:300]); sys.exit(1)
    tok = json.loads(txt)["access_token"]
    uid = json.loads(txt)["user"]["id"]

    # --- 1. delete existing ---
    st, txt, _ = req("GET", f"/rest/v1/trades?user_id=eq.{uid}&select=id", token=tok, url=URL, anon=ANON)
    ids = [r["id"] for r in json.loads(txt)]
    print(f"[delete] existing trades: {len(ids)}")
    if ids:
        st, txt, _ = req("DELETE", f"/rest/v1/trades?user_id=eq.{uid}",
                         token=tok, extra={"Prefer": "return=minimal"}, url=URL, anon=ANON)
        print(f"[delete] status={st} resp={txt[:120]}")

    rows1 = build_rows_batch1()
    rows2 = build_rows_batch2()
    print(f"[build] batch1(08.25)={len(rows1)}  batch2(08.26-28)={len(rows2)}")
    all_rows = rows1 + rows2

    ok = fail = 0
    for r in all_rows:
        body = {"user_id": uid, **r}
        st, txt, _ = req("POST", "/rest/v1/trades", body=body, token=tok,
                         extra={"Prefer": "return=minimal"}, url=URL, anon=ANON)
        if st == 201:
            ok += 1
        else:
            fail += 1
            if fail <= 5:
                print("INSERT FAIL", st, txt[:200], r["trade_date"], r["entry_price"])
    print(f"[insert] ok={ok} fail={fail}")

    # --- 4. update settings accounts ---
    st, txt, _ = req("GET", f"/rest/v1/settings?user_id=eq.{uid}&select=accounts,account_capitals", token=tok, url=URL, anon=ANON)
    cur = json.loads(txt)
    if cur:
        accounts = cur[0]["accounts"]
        caps = cur[0]["account_capitals"] or {}
        if "Personal" in accounts:
            accounts = [("Cent" if a == "Personal" else a) for a in accounts]
        if "Personal" in caps:
            caps["Cent"] = caps.pop("Personal")
        st, txt, _ = req("PATCH", f"/rest/v1/settings?user_id=eq.{uid}",
                         body={"accounts": accounts, "account_capitals": caps},
                         token=tok, extra={"Prefer": "return=minimal"}, url=URL, anon=ANON)
        print(f"[settings] PATCH status={st} resp={txt[:120]}")
        print("[settings] accounts ->", accounts)

    # --- 5. verify ---
    st, txt, _ = req("GET", f"/rest/v1/trades?user_id=eq.{uid}&select=account,trade_date,profit_loss&order=trade_date.desc",
                     token=tok, url=URL, anon=ANON)
    rows = json.loads(txt)
    print("\n=== VERIFY ===")
    print("DB total trades:", len(rows))
    print("by account:", dict(Counter(r["account"] for r in rows)))
    print("by date:", dict(Counter(str(r["trade_date"]) for r in rows)))
    tot = sum(float(r["profit_loss"]) for r in rows)
    print(f"total P&L (all): {tot:+.2f}")
    by_acc_pnl = {}
    for r in rows:
        by_acc_pnl[r["account"]] = by_acc_pnl.get(r["account"], 0) + float(r["profit_loss"])
    print("P&L by account:", {k: round(v,2) for k,v in by_acc_pnl.items()})


if __name__ == "__main__":
    main()
