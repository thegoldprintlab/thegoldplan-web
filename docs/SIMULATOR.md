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
- `src/sim/news.ts` + `scripts/build-news.py` — 5,323 event USD high-impact
  **2007-01-03 → 2025-04-03** dari dataset Forex Factory
  (`Ehsanrs2/Forex_Factory_Calendar`, MIT). Output
  `public/sim-data/news-usd.json` (~292 KB).

### Jana semula kalendar berita

```bash
# muat turun dataset penuh sekali (68 MB CSV, 2007-01-01 → 2025-04-07)
curl -L -o /tmp/ff_cache.csv \
  "https://huggingface.co/datasets/Ehsanrs2/Forex_Factory_Calendar/resolve/main/forex_factory_cache.csv"
cd ~/gold-plan-web && python3 scripts/build-news.py /tmp/ff_cache.csv public/sim-data/news-usd.json
```

⚠️ Dataset tamat Apr 2025. Replay selepas tarikh itu tetap jalan, cuma tiada
tanda berita — UI papar julat liputan dalam Chart settings.

Kalau SL dan TP dua-dua kena dalam bar yang sama, SL dianggap kena dahulu
(kaedah konservatif).

## Simpan sesi

1. **localStorage** (`gp-sim-sessions`) — selalu jalan, tiada login perlu.
2. **Supabase** `sim_sessions` + `sim_trades` — perlu jalankan
   `supabase/simulator.sql` di SQL Editor. RLS per-user.

⚠️ Setakat 14 Nov 2026 table Supabase **belum dicipta**: password DB dalam
`DATABASE_URL` rosak (`28P01`) — isu sama yang tercatat dalam STATUS
(23 Okt). Simpanan localStorage tetap berfungsi.

## Ujian

```bash
npm run build
npx vite preview --port 4178
node tests/sim-e2e.mjs   # data, replay, SL/TP, save, tukar TF
node tests/sim-smoke.mjs # desktop + mobile render
```

Kedua-dua guna `?demo=1` supaya tak perlu akaun Supabase.
