#!/usr/bin/env python3
"""Import Prop 5k MT5 history screenshot 2026-09-04 15:31 → 2026-09-07 15:35.

Source: 1 Telegram iPhone screenshot (last History page + footer).
Gross PnL COMPUTED: (close-open)*volume*100 for buy, (open-close)*volume*100 for sell.
Commission from FundingPips volume table: -5 * lot (0.01→-0.05, 0.03→-0.15, 0.05→-0.25).
profit_loss = gross + commission.

Idempotent: DELETE Prop 5k rows with trade_date >= 2026-09-04, then INSERT.
DB already had Prop 5k through 2026-09-03 (1 trade); screenshot starts 09.04 15:31.

Footer on this page: Deposit 5 000.00, Balance 4 901.68 → all-time −98.32.
This page is last-page only (16 rows). After insert, remaining gap vs footer is
scroll-gap / earlier 09-04 pages not in this screenshot.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, ".extract_5k_sep08", "_all_uniq.json")
ACCOUNT = "Prop 5k"
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


def build_rows(uniq):
    out = []
    for r in uniq:
        typ = str(r["type"]).lower()
        entry = float(r["open_price"])
        exit_ = float(r["close_price"])
        vol = float(r["volume"])
        ot = str(r["open_time"])
        out.append({
            "trade_date": r["trade_date"],
            "account": ACCOUNT,
            "session": session_for(ot),
            "setup": "Others",
            "direction": "BUY" if typ == "buy" else "SELL",
            "entry_price": entry,
            "exit_price": exit_,
            "volume": vol,
            "pips": compute_pips(typ, entry, exit_),
            "profit_loss": float(r["profit"]),
            "emotion": "",
            "notes": "",
            "volatility": "Normal",
        })
    return out


def fetch_all(token, uid, url, anon):
    all_rows = []
    offset = 0
    limit = 1000
    while True:
        q = (
            f"/rest/v1/trades?user_id=eq.{uid}&account=eq.Prop%205k"
            f"&select=id,trade_date,direction,entry_price,exit_price,volume,profit_loss,session"
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
    print("directions:", dict(Counter(i["direction"] for i in ins)))
    print("volumes:", dict(sorted(Counter(i["volume"] for i in ins).items())))
    total = sum(i["profit_loss"] for i in ins)
    print(f"total P&L (gross+comm): {total:+.2f}")
    print(f"  gross={sum(float(r['gross']) for r in uniq):+.2f} comm={sum(float(r['commission']) for r in uniq):+.2f}")
    by_date = Counter()
    pnl_date = {}
    for i in ins:
        by_date[i["trade_date"]] += 1
        pnl_date[i["trade_date"]] = pnl_date.get(i["trade_date"], 0.0) + i["profit_loss"]
    for d in sorted(by_date):
        print(f"  {d}: {by_date[d]} trades, {pnl_date[d]:+.2f}")
    print("footer Balance 4901.68 − Deposit 5000 = −98.32 (all-time)")

    if not commit:
        print("\n--- DRY RUN (all) ---")
        for i in ins:
            print(
                f"{i['trade_date']} {i['session']:16s} {i['direction']:4s} "
                f"v={i['volume']} {i['entry_price']}->{i['exit_price']} "
                f"pips={i['pips']:>7} pnl={i['profit_loss']:>8}"
            )
        print(f"... {len(ins)} total. Use --commit.")
        return

    env = load_env()
    URL = env["VITE_SUPABASE_URL"].rstrip("/")
    ANON = env["VITE_SUPABASE_ANON_KEY"]

    st, txt, _ = req(
        "POST", "/auth/v1/token?grant_type=password",
        {"email": USER_EMAIL, "password": USER_PASS},
        url=URL, anon=ANON,
    )
    if st >= 300:
        print("AUTH FAIL", st, txt[:300])
        sys.exit(1)
    tok = json.loads(txt)["access_token"]
    uid = json.loads(txt)["user"]["id"]

    before = fetch_all(tok, uid, URL, ANON)
    print(f"[db] Prop 5k before: {len(before)} net={round(sum(float(r['profit_loss']) for r in before), 2)}")

    ge04 = [r for r in before if r["trade_date"] >= "2026-09-04"]
    print(f"[delete] >=09-04={len(ge04)}")
    for r in ge04:
        st, txt, _ = req(
            "DELETE", f"/rest/v1/trades?id=eq.{r['id']}&user_id=eq.{uid}",
            token=tok, extra={"Prefer": "return=minimal"}, url=URL, anon=ANON,
        )
        if st >= 300:
            print("DELETE FAIL", st, txt[:200], r["id"])
            sys.exit(1)

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
            "volume": i["volume"],
            "pips": i["pips"],
            "profit_loss": i["profit_loss"],
            "emotion": i["emotion"],
            "notes": i["notes"],
            "volatility": i["volatility"],
        }
        st, txt, _ = req(
            "POST", "/rest/v1/trades", body=body, token=tok,
            extra={"Prefer": "return=minimal"}, url=URL, anon=ANON,
        )
        if st == 201:
            ok += 1
        else:
            fail += 1
            if fail <= 5:
                print("INSERT FAIL", st, txt[:200], i["trade_date"], i["entry_price"])
    print(f"\nINSERT DONE: ok={ok} fail={fail}")
    if fail:
        sys.exit(1)

    after = fetch_all(tok, uid, URL, ANON)
    net = round(sum(float(r["profit_loss"]) for r in after), 2)
    print(f"[db] Prop 5k after: {len(after)} net={net}")
    by = Counter(r["trade_date"] for r in after)
    print("dates last 10:", dict(sorted(by.items())[-10:]))
    recent = [r for r in after if r["trade_date"] >= "2026-09-04"]
    print(f">=09-04: {len(recent)} net={round(sum(float(r['profit_loss']) for r in recent), 2)}")
    print(f"vs footer all-time −98.32: gap={round(-98.32 - net, 2)}")


if __name__ == "__main__":
    main()
