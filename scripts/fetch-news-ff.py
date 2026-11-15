"""Tambah event USD high-impact ke kalendar simulator dengan scrape Forex Factory.

Dataset awam (HuggingFace `Ehsanrs2/Forex_Factory_Calendar`) tamat 2025-04-03.
Skrip ni scrape halaman kalendar Forex Factory bulan demi bulan untuk tutup
lubang selepas tarikh tu, kemudian gabung dengan JSON sedia ada.

Setiap halaman kalendar embed JSON penuh event (termasuk `dateline` = epoch UTC
sebenar), jadi tiada perlu parse HTML.

Guna:
  python3 scripts/fetch-news-ff.py 2025-04 2026-11
  python3 scripts/fetch-news-ff.py 2025-04 2026-11 --out public/sim-data/news-usd.json

Skrip ni MENGGABUNG: event yang dah ada (kunci epoch+judul) tak diduplikasi.
Selamat dijalankan berulang; bulan yang dah lengkap akan di-skip kalau
`--skip-covered` diberi.
"""

import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone

UA = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0 Safari/537.36"
    )
}
MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

# Buang event yang tak menggerakkan harga (sama seperti build-news.py).
SKIP = ("holiday", "auction", "speaks", "speech", "vote", "meeting minutes")

_DEC = json.JSONDecoder()


def fetch_month(year: int, month: int) -> list[dict]:
    """Ambil semua event satu bulan dari Forex Factory."""
    param = f"{MONTHS[month - 1]}.{year}"
    url = f"https://www.forexfactory.com/calendar?month={param}"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45) as r:
        html = r.read().decode(errors="replace")

    events: list[dict] = []
    pos = 0
    while True:
        i = html.find('[{"id":', pos)
        if i < 0:
            break
        try:
            arr, end = _DEC.raw_decode(html[i:])
            if isinstance(arr, list) and arr and isinstance(arr[0], dict) and "impactName" in arr[0]:
                events.extend(arr)
                pos = i + end
                continue
        except ValueError:
            pass
        pos = i + 7

    if not events:
        raise RuntimeError(f"{param}: tiada event dijumpai dalam HTML")
    return events


def to_rows(events: list[dict]) -> list[list]:
    """Tapis USD high-impact → [epoch, 'YYYY-MM-DD', 'HH:MM'|None, judul]."""
    rows = []
    for e in events:
        if (e.get("currency") or "").upper() != "USD":
            continue
        if (e.get("impactName") or "").lower() != "high":
            continue
        title = (e.get("name") or "").strip()
        if not title or any(s in title.lower() for s in SKIP):
            continue
        ts = e.get("dateline")
        if not isinstance(ts, int) or ts <= 0:
            continue
        dt = datetime.fromtimestamp(ts, timezone.utc)
        clock = None if (dt.hour == 0 and dt.minute == 0) else dt.strftime("%H:%M")
        rows.append([ts, dt.strftime("%Y-%m-%d"), clock, title])
    return rows


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = "public/sim-data/news-usd.json"
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
        args = [a for a in args if a != out]
    if len(args) < 2:
        print(__doc__)
        raise SystemExit(1)

    start = datetime.strptime(args[0], "%Y-%m").replace(tzinfo=timezone.utc)
    end = datetime.strptime(args[1], "%Y-%m").replace(tzinfo=timezone.utc)

    try:
        payload = json.load(open(out, encoding="utf-8"))
    except FileNotFoundError:
        payload = {"source": "", "events": []}

    # Buang event dataset lama dalam julat yang akan di-scrape. Dataset awam tu
    # ada jam DST salah (contoh ISM 2025-04-01 ditulis 13:00 UTC, sepatutnya
    # 14:00) — scrape FF lebih tepat, jadi FF menang dalam julat ni.
    cutoff = start.strftime("%Y-%m-%d")
    before = len(payload["events"])
    payload["events"] = [e for e in payload["events"] if e[1] < cutoff]
    dropped = before - len(payload["events"])
    if dropped:
        print(f"Buang {dropped} event dataset lama mulai {cutoff} (ganti dengan scrape FF)")

    existing = {(e[0], e[3]) for e in payload["events"]}
    seen_day_title: set[tuple[str, str]] = set()
    added = 0

    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        try:
            raw = fetch_month(y, m)
            rows = to_rows(raw)
        except Exception as exc:  # rangkaian / halaman berubah
            print(f"  {y}-{m:02d} GAGAL: {type(exc).__name__}: {exc}")
            y, m = (y + 1, 1) if m == 12 else (y, m + 1)
            time.sleep(2.0)
            continue

        new = []
        for r in rows:
            key = (r[0], r[3])
            dt_key = (r[1], r[3])
            if key in existing or dt_key in seen_day_title:
                continue  # FF kadang ulang event sama (pra-tonton + semula)
            existing.add(key)
            seen_day_title.add(dt_key)
            new.append(r)

        payload["events"].extend(new)
        added += len(new)
        span = f"{rows[0][1]} → {rows[-1][1]}" if rows else "kosong"
        print(f"  {y}-{m:02d}: {len(raw)} event, {len(rows)} USD high, +{len(new)} baharu ({span})")

        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
        time.sleep(1.2)  # sopan pada server

    payload["events"].sort(key=lambda e: e[0])
    days = sorted({e[1] for e in payload["events"]})
    payload["built"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    payload["from"] = days[0] if days else None
    payload["to"] = days[-1] if days else None
    payload["count"] = len(payload["events"])
    payload.setdefault("currency", "USD")
    payload.setdefault("impact", "high")
    payload["source"] = (
        "Forex Factory — dataset awam 2007-01→2025-04 (HuggingFace Ehsanrs2) "
        "+ scrape bulanan scripts/fetch-news-ff.py"
    )

    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))

    print(
        f"\n{before} → {payload['count']} event (+{added}), "
        f"{payload['from']} → {payload['to']}"
    )


if __name__ == "__main__":
    main()
