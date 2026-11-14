#!/usr/bin/env python3
"""
Tukar export Dukascopy (CSV M1) -> fail replay per-bulan (JSON gzip).

Output: public/sim-data/XAUUSD/YYYY-MM.json.gz
Format dalaman (ringkas, pantas parse):
  {"symbol":"XAUUSD","tf":1,"start":<epoch_saat bar pertama>,
   "bars":"<deltaMin>,<o>,<h>,<l>,<c>\n..."}
deltaMin = minit sejak `start`. Harga 2 desimal.

Guna:
  python3 scripts/build-sim-data.py ~/.hermes/cache/scratch/duka/raw ./public/sim-data/XAUUSD
"""
import csv
import glob
import gzip
import json
import os
import sys
from collections import defaultdict

SYMBOL = "XAUUSD"


def load_csv(path):
    """CSV dukascopy-node: timestamp(ms),open,high,low,close,volume"""
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            try:
                ts = int(row["timestamp"]) // 1000
                o = float(row["open"])
                h = float(row["high"])
                l = float(row["low"])
                c = float(row["close"])
            except (KeyError, ValueError):
                continue
            if h < l or o <= 0:
                continue
            rows.append((ts, o, h, l, c))
    return rows


def main():
    raw_dir = sys.argv[1] if len(sys.argv) > 1 else "raw"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else "public/sim-data/XAUUSD"
    os.makedirs(out_dir, exist_ok=True)

    per_month = defaultdict(list)
    files = sorted(glob.glob(os.path.join(raw_dir, "*.csv")))
    if not files:
        sys.exit("Tiada CSV dalam " + raw_dir)
    total = 0
    for path in files:
        rows = load_csv(path)
        total += len(rows)
        for ts, o, h, l, c in rows:
            import datetime as dt

            d = dt.datetime.fromtimestamp(ts, dt.timezone.utc)
            per_month[f"{d.year:04d}-{d.month:02d}"].append((ts, o, h, l, c))
        print(f"  {os.path.basename(path)}: {len(rows):,} bar")

    grand = 0
    for month in sorted(per_month):
        rows = sorted(set(per_month[month]))
        if not rows:
            continue
        start = rows[0][0]
        lines = []
        prev = start
        for ts, o, h, l, c in rows:
            mins = (ts - start) // 60
            if mins < prev - start and mins < 0:
                continue
            lines.append(f"{mins},{o:.2f},{h:.2f},{l:.2f},{c:.2f}")
            prev = ts
        payload = {
            "symbol": SYMBOL,
            "tf": 1,
            "start": start,
            "bars": "\n".join(lines),
        }
        out = os.path.join(out_dir, f"{month}.json.gz")
        raw = json.dumps(payload, separators=(",", ":")).encode()
        with gzip.open(out, "wb", compresslevel=9) as f:
            f.write(raw)
        grand += len(lines)
        print(f"  {month}: {len(lines):,} bar -> {os.path.getsize(out)/1024:.0f} KB")

    # manifest
    months = sorted(per_month)
    manifest = {
        "symbol": SYMBOL,
        "tf": 1,
        "months": months,
        "from": months[0],
        "to": months[-1],
        "bars": grand,
    }
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nJUMLAH: {grand:,} bar M1, {len(months)} bulan, {months[0]} .. {months[-1]}")


if __name__ == "__main__":
    main()
