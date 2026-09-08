#!/usr/bin/env python3
"""Import Cent 2026-09-08 afternoon (11:29–15:39) from 5 Telegram screenshots.

PnL COMPUTED 2dp: (close-open)*volume*100 buy, (open-close)*volume*100 sell.
Idempotent: DELETE only Cent rows on 2026-09-08 whose entry is in this batch
(morning 03:15–06:31 stays). Then INSERT.
"""
import json, os, sys, urllib.error, urllib.request
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, ".extract_cent_sep08pm", "_all_uniq.json")
ACCOUNT = "Cent"
USER_EMAIL = "arfasyrf@gmail.com"
USER_PASS = "test123"


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
    return "New York (NY)"


def compute_pips(typ, entry, exit_):
    raw = (exit_ - entry) if typ == "buy" else (entry - exit_)
    return round(raw * 10, 1)


def req(method, path, body=None, token=None, extra=None, url=None, anon=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"apikey": anon, "Content-Type": "application/json"}
    if token:
        h["Authorization"] = "Bearer " + token
    if extra:
        h.update(extra)
    rq = urllib.request.Request(url + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(rq) as resp:
            return resp.status, resp.read().decode(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(), dict(e.headers)


def build_rows(uniq):
    out = []
    for r in uniq:
        typ = str(r["type"]).lower()
        entry = float(r["open_price"])
        exit_ = float(r["close_price"])
        out.append({
            "trade_date": r["trade_date"],
            "account": ACCOUNT,
            "session": session_for(r["open_time"]),
            "setup": "Others",
            "direction": "BUY" if typ == "buy" else "SELL",
            "entry_price": entry,
            "exit_price": exit_,
            "volume": float(r["volume"]),
            "pips": compute_pips(typ, entry, exit_),
            "profit_loss": round(float(r["profit"]), 2),
            "emotion": "",
            "notes": "",
            "volatility": "Normal",
        })
    return out


def fetch_all(token, uid, url, anon):
    all_rows, offset, limit = [], 0, 1000
    while True:
        q = (
            f"/rest/v1/trades?user_id=eq.{uid}&account=eq.Cent"
            f"&select=id,trade_date,direction,entry_price,exit_price,volume,profit_loss"
            f"&order=trade_date.asc,id.asc&limit={limit}&offset={offset}"
        )
        st, txt, _ = req("GET", q, token=token, url=url, anon=anon)
        if st >= 300:
            raise SystemExit(f"FETCH FAIL {st} {txt[:300]}")
        rows = json.loads(txt)
        all_rows.extend(rows)
        if len(rows) < limit:
            break
        offset += limit
    return all_rows


def main():
    commit = "--commit" in sys.argv
    uniq = json.load(open(SRC))
    ins = build_rows(uniq)
    print(f"[build] uniq={len(uniq)} insert={len(ins)}")
    print("dates:", dict(sorted(Counter(i["trade_date"] for i in ins).items())))
    print("sessions:", dict(Counter(i["session"] for i in ins)))
    print("volumes:", dict(sorted(Counter(i["volume"] for i in ins).items())))
    total = sum(i["profit_loss"] for i in ins)
    print(f"total P&L (2dp): {total:+.2f}")
    print("sample first 4:")
    for i in ins[:4]:
        print(f"  {i['trade_date']} {i['direction']:4s} {i['entry_price']}->{i['exit_price']} pnl={i['profit_loss']:+.2f}")
    print("sample last 4:")
    for i in ins[-4:]:
        print(f"  {i['trade_date']} {i['direction']:4s} {i['entry_price']}->{i['exit_price']} pnl={i['profit_loss']:+.2f}")
    entries = {round(i["entry_price"], 2) for i in ins}
    if not commit:
        print(f"... {len(ins)} total. Use --commit.")
        return

    env = load_env()
    URL = env["VITE_SUPABASE_URL"].rstrip("/")
    ANON = env["VITE_SUPABASE_ANON_KEY"]
    st, txt, _ = req("POST", "/auth/v1/token?grant_type=password",
                     {"email": USER_EMAIL, "password": USER_PASS}, url=URL, anon=ANON)
    if st >= 300:
        print("AUTH FAIL", st, txt[:300]); sys.exit(1)
    tok = json.loads(txt)["access_token"]
    uid = json.loads(txt)["user"]["id"]

    before = fetch_all(tok, uid, URL, ANON)
    print(f"[db] Cent before: {len(before)} net={round(sum(float(r['profit_loss']) for r in before), 2)}")
    day = [r for r in before if r["trade_date"] == "2026-09-08"]
    to_del = [r for r in day if round(float(r["entry_price"]), 2) in entries]
    print(f"[delete] 09-08 total={len(day)} matching-entry={len(to_del)} keep={len(day)-len(to_del)}")
    for r in to_del:
        st, txt, _ = req("DELETE", f"/rest/v1/trades?id=eq.{r['id']}&user_id=eq.{uid}",
                         token=tok, extra={"Prefer": "return=minimal"}, url=URL, anon=ANON)
        if st >= 300:
            print("DELETE FAIL", st, txt[:200]); sys.exit(1)

    ok = fail = 0
    for i in ins:
        body = {"user_id": uid, **i}
        st, txt, _ = req("POST", "/rest/v1/trades", body=body, token=tok,
                         extra={"Prefer": "return=minimal"}, url=URL, anon=ANON)
        if st == 201:
            ok += 1
        else:
            fail += 1
            if fail <= 5:
                print("INSERT FAIL", st, txt[:200], i["entry_price"])
    print(f"INSERT DONE: ok={ok} fail={fail}")
    if fail:
        sys.exit(1)
    after = fetch_all(tok, uid, URL, ANON)
    print(f"[db] Cent after: {len(after)} net={round(sum(float(r['profit_loss']) for r in after), 2)}")
    d8 = [r for r in after if r["trade_date"] == "2026-09-08"]
    print(f"09-08: {len(d8)} net={round(sum(float(r['profit_loss']) for r in d8), 2)}")


if __name__ == "__main__":
    main()
