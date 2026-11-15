"""Bina kalendar berita USD (high-impact) untuk chart simulator.

Sumber: dataset awam Forex Factory (HuggingFace `Ehsanrs2/Forex_Factory_Calendar`,
2007-01-01 → 2025-04-07, lesen MIT). Dataset tu tamat Apr 2025; replay data
sampai Nov 2026, jadi selepas tarikh tu kalendar kosong — UI beritahu user.

Output: public/sim-data/news-usd.json
  {"built": "...", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD",
   "events": [[epoch, "YYYY-MM-DD", "HH:MM"|null, "judul"], ...]}

Masa disimpan UTC. `null` = event sepanjang hari / tiada masa tepat.
"""

import csv
import json
import sys
from datetime import datetime, timezone

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/ff_cache.csv"
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/sim-data/news-usd.json"

HIGH = {"high impact expected", "high"}
# Buang event yang tak bergerak harga (lelongan, ucapan, cuti).
SKIP = ("holiday", "auction", "speaks", "speech", "vote", "meeting minutes")


def main() -> None:
    events = []
    seen = set()
    with open(SRC, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("Currency") or "").strip().upper() != "USD":
                continue
            if (row.get("Impact") or "").strip().lower() not in HIGH:
                continue
            title = (row.get("Event") or "").strip()
            if not title or any(s in title.lower() for s in SKIP):
                continue
            raw = (row.get("DateTime") or "").strip()
            if not raw:
                continue
            try:
                dt = datetime.fromisoformat(raw)
            except ValueError:
                continue
            utc = dt.astimezone(timezone.utc)
            epoch = int(utc.timestamp())
            day = utc.strftime("%Y-%m-%d")
            # Masa 00:00 UTC selepas tz-shift biasanya event "all day".
            clock = None if (utc.hour == 0 and utc.minute == 0) else utc.strftime("%H:%M")
            key = (epoch, title)
            if key in seen:
                continue
            seen.add(key)
            events.append([epoch, day, clock, title])

    events.sort(key=lambda e: e[0])
    days = sorted({e[1] for e in events})
    payload = {
        "source": "Forex Factory (Ehsanrs2/Forex_Factory_Calendar, MIT)",
        "built": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "currency": "USD",
        "impact": "high",
        "from": days[0] if days else None,
        "to": days[-1] if days else None,
        "count": len(events),
        "events": events,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))
    print(f"{len(events)} USD high-impact events, {days[0]} → {days[-1]}")


if __name__ == "__main__":
    main()
