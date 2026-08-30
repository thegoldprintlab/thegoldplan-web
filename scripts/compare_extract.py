#!/usr/bin/env python3
"""
Compare freshly extracted MT5 deals (52 screenshots) against the DB dump.
Determines whether iPad + iPhone datasets match each other and the DB.
"""
import json, os, glob
from collections import Counter

ROOT = "/home/mozacsuck48/gold-plan-web"
RAW = os.path.join(ROOT, ".extract_new", "raw")
DB = os.path.join(ROOT, ".extract_new", "db_dump.json")

def computed_profit(r):
    o = float(r["open_price"]); c = float(r["close_price"]); v = float(r["volume"])
    diff = (c - o) if str(r.get("type","")).lower() == "buy" else (o - c)
    return round(diff * v * 100, 2)

def key_of(r):
    return (
        str(r.get("open_time","")),
        str(r.get("type","")).lower(),
        round(float(r.get("volume",0)), 3),
        round(float(r.get("open_price",0)), 3),
        str(r.get("close_time","")),
        round(float(r.get("close_price",0)), 3),
    )

def load_parts():
    rows = []
    files = sorted(glob.glob(os.path.join(RAW, "part_*.json")))
    for f in files:
        try:
            data = json.load(open(f))
        except Exception as e:
            print("ERR loading", f, e)
            continue
        for r in data:
            r = dict(r)
            r["_file"] = os.path.basename(f)
            rows.append(r)
    return rows, files

def dedupe(rows):
    # cross-image dedupe: same key appearing in multiple images = same trade
    keycount = Counter()
    for r in rows:
        keycount[key_of(r)] += 1
    uniq = []
    seen = Counter()
    for r in rows:
        k = key_of(r)
        if seen[k] < keycount[k]:
            uniq.append(r)
            seen[k] += 1
    return uniq

def main():
    rows, files = load_parts()
    print(f"part files: {len(files)}")
    print(f"raw rows: {len(rows)}")

    # split by device (ipad/iphone based on filename)
    ipad = [r for r in rows if "ipad" in r["_file"]]
    iphone = [r for r in rows if "iphone" in r["_file"]]
    print(f"ipad raw: {len(ipad)}, iphone raw: {len(iphone)}")

    ipad_u = dedupe(ipad)
    iphone_u = dedupe(iphone)
    all_u = dedupe(rows)
    print(f"ipad uniq: {len(ipad_u)}, iphone uniq: {len(iphone_u)}, all uniq: {len(all_u)}")

    # date distribution
    def dates(rows):
        c = Counter()
        for r in rows:
            t = str(r.get("open_time",""))
            if "." in t:
                mm, dd = t.split(" ")[0].split(".")[:2]
                c[f"2026-{int(mm):02d}-{int(dd):02d}"] += 1
        return dict(sorted(c.items()))
    print("ipad dates:", dates(ipad_u))
    print("iphone dates:", dates(iphone_u))
    print("all dates:", dates(all_u))

    # net pnl computed
    for label, rs in [("ipad", ipad_u), ("iphone", iphone_u), ("all", all_u)]:
        total = round(sum(computed_profit(r) for r in rs), 2)
        shown = round(sum(float(r.get("profit") or 0) for r in rs), 2)
        print(f"{label}: computed={total:+.2f} shown_sum={shown:+.2f}")

    # compare with DB
    db = json.load(open(DB))
    db_trades = db["trades"]
    print(f"\nDB trades: {len(db_trades)}")
    db_dates = dict(sorted(Counter(r["trade_date"] for r in db_trades).items()))
    print("DB dates:", db_dates)
    db_net = round(sum(float(r["profit_loss"]) for r in db_trades), 2)
    print(f"DB net: {db_net:+.2f}")

    # save for later
    out = {"ipad": ipad_u, "iphone": iphone_u, "all": all_u}
    with open(os.path.join(ROOT, ".extract_new", "merged.json"), "w") as f:
        json.dump(out, f, default=str)

if __name__ == "__main__":
    main()
