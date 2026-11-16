# Chart Simulator (`/app/sim`)

Replay lab: candle XAUUSD M1 sebenar, main bar-by-bar, ada order ticket +
SL/TP + margin. Tiada wang sebenar.

## Data

- Sumber: Dukascopy (XAUUSD, M1, bid) via `dukascopy-node`.
- Julat semasa: **2022-11 → 2026-11**, 1,431,498 bar M1, 49 fail bulanan.
- Storan: `public/sim-data/XAUUSD/YYYY-MM.json.gz` (~300 KB/bulan, 14 MB total).
- Format: `{"symbol","tf","start","bars":"deltaMin,o,h,l,c\n..."}`.
  `deltaMin` = minit sejak `start` → fail kecil, parse laju.
- `manifest.json` senaraikan bulan yang ada.

### Jana semula / tambah bulan baharu

```bash
mkdir -p ~/duka && cd ~/duka && npm i dukascopy-node
npx dukascopy-node -i xauusd -from 2026-11-01 -to 2026-12-01 -t m1 -f csv -dir ./raw
cd ~/gold-plan-web && python3 scripts/build-sim-data.py ~/duka/raw ./public/sim-data/XAUUSD
```

Skrip menulis semula semua bulan + `manifest.json`. Fail lama ditimpa.

## Enjin

| Fail | Peranan |
|---|---|
| `src/sim/data.ts` | muat + unzip + parse fail bulanan (cache dalam memori) |
| `src/sim/aggregate.ts` | M1 → M5/M15/H1/H4, binary search ikut masa |
| `src/sim/engine.ts` | PnL, margin, SL/TP check, margin call |
| `src/sim/sessions.ts` | simpan sesi (localStorage dulu, Supabase kemudian) |
| `src/components/sim/SimChart.tsx` | lightweight-charts + replay reveal |
| `src/pages/Simulator.tsx` | orkestrasi: main, order, TF, simpan |

Model dagangan: 1 lot = 100 oz, leverage lalai 1:500 (boleh tukar 1:50–1:1000
dalam Chart settings → Account), balance mula lalai $10,000 (boleh tukar).
SL dan TP diisi sebagai **jarak harga dalam $** (bukan pip) — XAUUSD quote
dalam dolar, jadi $5 SL = 500 point.

## Kalendar & berita

- `src/components/sim/SimDatePicker.tsx` — butang bulan buka kalendar.
  Hari cuti bank US (`.holiday`) dan hari berita USD (`.news`) ditanda.
  Bulan yang tiada data harga = disabled.
- `src/sim/holidays.ts` — cuti Federal Reserve ikut formula 5 U.S.C. 6103
  (tarikh tetap dianjak ke Isnin/Jumaat; MLK/Washington/Labor/Columbus/
  Thanksgiving ikut nth-weekday).
- `src/sim/news.ts` + dua skrip — 5,761 event USD high-impact
  **2007-01-03 → 2026-11-25**, `public/sim-data/news-usd.json` (~316 KB).

### Dua sumber berita

| Skrip | Liputan | Guna bila |
|---|---|---|
| `scripts/build-news.py` | 2007-01 → 2025-04 (dataset awam) | bootstrap / jana semula dari kosong |
| `scripts/fetch-news-ff.py` | 2025-04 → 2026-11 (scrape Forex Factory) | sambung bulan baharu |

`build-news.py` guna dataset HuggingFace `Ehsanrs2/Forex_Factory_Calendar`
(68 MB CSV, MIT). Dataset tu ada **jam DST salah** untuk sebahagian event
(contoh ISM 2025-04-01 ditulis 13:00 UTC, sepatutnya 14:00) — sebab itu
`fetch-news-ff.py` membuang semula event dataset dalam julat yang ia scrape
dan ganti dengan data FF yang lebih tepat.

```bash
# bootstrap penuh dari dataset awam
curl -L -o /tmp/ff_cache.csv \
  "https://huggingface.co/datasets/Ehsanrs2/Forex_Factory_Calendar/resolve/main/forex_factory_cache.csv"
python3 scripts/build-news.py /tmp/ff_cache.csv public/sim-data/news-usd.json

# tambah / betulkan bulan selepas Apr 2025 (scrape FF, JSON embed dalam HTML)
python3 scripts/fetch-news-ff.py 2025-04 2026-11
```

`fetch-news-ff.py` ambil `dateline` (epoch UTC sebenar) dari JSON yang
Forex Factory embed dalam setiap halaman kalendar — tiada parse HTML, tiada
teka timezone. Ia menggabung (bukan menimpa) dan buang duplikat ikut
`(epoch, judul)` dan `(hari, judul)`. Selamat dijalankan berulang.

Kalau SL dan TP dua-dua kena dalam bar yang sama, SL dianggap kena dahulu
(kaedah konservatif).

## Simpan sesi

1. **localStorage** (`gp-sim-sessions`) — selalu jalan, tiada login perlu.
2. **Supabase** `sim_sessions` + `sim_trades` — table + RLS **sudah dicipta**
   15 Nov 2026 (dijalankan via Management API). RLS per-user disahkan: user
   lain dan anon nampak 0 baris; cascade delete bila user dibuang.

Sesi disimpan bila user login (bukan demo). Flow: insert `sim_sessions` →
insert semua `sim_trades` dengan `session_id` yang sama. Trade disimpan
penuh (entry/exit/SL/TP/open_time/close_time/pnl/reason/seq), bukan
ringkasan sahaja.

## Ujian

```bash
npm run build
npx vite preview --port 4178
node tests/sim-e2e.mjs   # data, replay, SL/TP, save, tukar TF
node tests/sim-smoke.mjs # desktop + mobile render
```

Kedua-dua guna `?demo=1` supaya tak perlu akaun Supabase.

## Challenge mode

Replay tanpa had tak mengajar apa-apa — disiplin hanya diuji oleh had. Challenge
mode meletakkan satu set peraturan gaya prop-firm di atas sesi replay.

| Peraturan | Lalai | Nota |
|---|---|---|
| Profit target | 8% | Peratus dari `startBalance` |
| Max loss | 10% | Kena → challenge gagal, ticket dikunci |
| Daily loss limit | 5% | Kena dalam satu hari UTC → gagal |
| Trades per day | 3 | Kena → **kunci hari itu sahaja**, bukan gagal |
| Min trading days | 0 | Target tak dikira lulus sebelum cukup hari |

Tiga preset: *Prop evaluation*, *Strict discipline*, *One good trade*.

**Fail:** `src/sim/challenge.ts` (logik tulen + localStorage),
`src/components/sim/SimChallengeBar.tsx` (HUD atas carta),
`src/components/sim/SimChallengePanel.tsx` (drawer peraturan).

Prinsip penting:
- Lot dikira semula dari `equity` (balance + floating), jadi posisi yang sedang
  rugi boleh trip had **sebelum** ditutup.
- `breached` (gagal atau cap harian) mematikan butang BUY/SELL — itu tujuan had.
- Cap harian = lock, bukan fail. `capReached` berasingan dari `status`.
- Peraturan disimpan dalam `localStorage` (`gp-sim-challenge`), bukan Supabase —
  challenge adalah alat latihan, bukan rekod akaun.
