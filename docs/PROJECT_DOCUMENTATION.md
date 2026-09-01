# ◈ The Gold Plan — Dokumentasi Penuh

> Trading journal web app untuk XAUUSD. Dari Google Sheets → web app → live di Vercel.
> Last updated: 2026-08-30 (v3 — account filter, manual volume/profit, pagination fix, token discipline)

---

## 1. Gambaran Keseluruhan

**Apa dia:** App jurnal dagangan XAUUSD (emas) — log trade, dashboard analytics, disiplin tracking (Kill Switch), share card ala Spotify Wrapped, dan Quick Log API untuk iOS Shortcuts.

**Kenapa dibina:** Migrate Google Sheets trading log bos ke web app end-to-end, percuma (free tier), code di GitHub, database di Supabase, hosting di Vercel.

---

## 2. Link & Akses

| Perkara | Nilai |
|---|---|
| **Live URL** | https://thegoldplan-web.vercel.app |
| **GitHub repo** | https://github.com/thegoldprintlab/thegoldplan-web |
| **Login app** | `arfasyrf@gmail.com` / `test123` |
| **Vercel project** | `thegoldplan-web` (org `thegoldprintlab1`) |
| **Supabase project** | ref `gtblmwijohoetczqngpr` |

> Credentials penuh (DB password, GitHub token, API keys) ada dalam fail LOCAL:
> `docs/SECRETS_LOCAL.md` (gitignored — JANGAN commit ke GitHub).

---

## 3. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Router | react-router-dom v6 |
| Charts | Recharts 2 |
| Backend/database | Supabase (Postgres + Auth + Row Level Security) |
| Hosting | Vercel (auto-deploy dari GitHub) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |

---

## 4. Struktur Repo

```
gold-plan-web/
├── src/
│   ├── App.tsx              # Router + Shell (auth gate)
│   ├── main.tsx             # ReactDOM entry
│   ├── index.css            # SEMUA styling (design tokens + components)
│   ├── components/
│   │   ├── Auth.tsx         # Login/signup form
│   │   ├── Nav.tsx          # Top nav (Dashboard/Trading Log/Input Form/Settings)
│   │   ├── KillSwitch.tsx   # Jurulatih Akaun (per-account daily loss)
│   │   └── ShareCard.tsx    # Spotify Wrapped card + PNG download
│   ├── context/
│   │   ├── AuthContext.tsx  # Supabase auth session
│   │   └── DataContext.tsx  # Trades + settings state
│   ├── lib/
│   │   ├── api.ts           # Supabase CRUD + compute pips/pnl/volatility
│   │   ├── stats.ts         # groupStats, scoreboard, ROI, fmt helpers
│   │   ├── supabase.ts      # createClient + config check
│   │   └── types.ts         # Trade, Settings, DashboardStats, dll
│   └── pages/
│       ├── Dashboard.tsx    # Stats + charts + scoreboards
│       ├── InputForm.tsx    # Form log trade
│       ├── TradingLog.tsx   # Table semua trade + filter + delete
│       └── Settings.tsx     # Config + capital + daily loss + Quick Log API
├── supabase/
│   ├── schema.sql           # CREATE TABLE trades + settings + RLS
│   ├── ready_to_run.sql     # Schema + seed (user ID hardcoded)
│   └── seed_trades.sql      # Seed 151 trades (data lama)
├── scripts/                 # Import + dump + verify (lihat §8)
├── .github/workflows/deploy.yml  # GitHub Pages (LEGACY — dah ganti Vercel)
├── vite.config.ts           # base path dari VITE_BASE_PATH
├── .env.local               # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (gitignored)
└── package.json
```

---

## 5. Database (Supabase)

### 5.1 Tables

**`public.trades`** — satu baris = satu trade:

| Column | Type | Nota |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| created_at | timestamptz default now() | |
| user_id | uuid FK auth.users | on delete cascade |
| trade_date | date | |
| account | text | "Cent" / "Prop 5k" / "Prop 10k" |
| session | text | Australia/Tokyo/London/New York |
| setup | text | "Others" (import) atau pilihan user |
| direction | text | BUY / SELL |
| entry_price | numeric(12,2) | |
| exit_price | numeric(12,2) | |
| pips | numeric(12,1) | |
| volume | numeric(12,2) | Lots (null untuk trade import lama) |
| profit_loss | numeric(12,2) | NET (profit + commission + swap) — untuk trade manual = nilai yang user taip |
| emotion | text | |
| notes | text | |
| volatility | text | "High Volatility" / "Normal" |

**`public.settings`** — satu baris per user:

| Column | Type | Nota |
|---|---|---|
| id | uuid PK | |
| user_id | uuid unique FK auth.users | |
| setups | text[] | |
| sessions | text[] | |
| emotions | text[] | |
| accounts | text[] | |
| max_daily_loss | numeric(12,2) default 100 | Limit global |
| account_capitals | jsonb | account → starting capital ($) |
| account_daily_loss_limits | jsonb | account → daily loss limit ($) |
| updated_at | timestamptz | |

### 5.2 Row Level Security (RLS)

Setiap table ada policy: user hanya boleh select/insert/update/delete row **sendiri** (`auth.uid() = user_id`).

### 5.3 Cara Connect ke DB (PENTING)

| Kaedah | Detail |
|---|---|
| **Direct host** | `db.gtblmwijohoetczqngpr.supabase.co:5432` — ⚠️ sekarang **IPv6-only**, mesin ini takde route IPv6 → GAGAL (ENETUNREACH) |
| **Pooler (guna ini)** | `aws-0-ap-northeast-2.pooler.supabase.com:6543` (transaction mode), user `postgres.gtblmwijohoetczqngpr`, database `postgres`, ssl on |
| **Supabase API** | URL `https://gtblmwijohoetczqngpr.supabase.co` + anon key (dalam `.env.local`) |

Pooler region **ap-northeast-2 (Tokyo)**. Kalau host pooler lain bagi "tenant not found", guna ap-northeast-2.

---

## 6. Features

### 6.1 Auth
- Email + password (Supabase Auth)
- Gate: kalau `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` takde → tunjuk "App is not connected to Supabase yet"

### 6.2 Dashboard
- **Account filter** (dropdown atas): All Accounts / Cent / Prop 5k / Prop 10k — SEMUA stat, chart, kill switch & share card ikut akaun yang dipilih
- **Stat cards**: Total Net P&L, Win Rate, Profit Factor, Trades (W/L), Avg Win, Avg Loss, Best Trade, Worst Trade
- **Daily Equity Growth** (line chart, Recharts)
- **Emotion vs Net P&L** (bar chart)
- **4 Scoreboards**: Setup, Session, Account Performance (dengan ROI = net ÷ starting capital), Emotion
- **Kill Switch** (lihat 6.6)
- **Share Card** (lihat 6.7)
- Nota: scoreboard "Account Performance" cuma muncul bila pilih **All Accounts**

### 6.3 Input Form
- Date, Account, Session, Trading Setup, Direction (BUY/SELL), Entry/Exit price, **Volume (lots)**, **Profit / Loss ($)**, Emotion, Notes
- **Volume & Profit = MANUAL input** (bukan auto-kira). Pips auto-kira dari entry/exit, tapi profit ikut apa yang user taip
- Live calc: Pips + volatility badge (Blood Zone: High Volatility masa London-NY overlap 12:00–16:00 UTC)

### 6.4 Trading Log
- Filter by account, table penuh, delete trade (dengan confirm)
- Lajur: Date, Account, Session, Setup, Dir, Entry, Exit, **Volume**, Pips, P&L, Emotion, Volatility, Notes

### 6.5 Settings
- Setups / Sessions / Emotions / Accounts (satu per line)
- **Starting Capital per Account** ($) → untuk ROI
- **Daily Loss Limit per Account** ($) → kosong = guna Max Daily Loss global
- **Quick Log API**: endpoint + token + contoh JSON body

### 6.6 Kill Switch (Jurulatih Akaun)
- Pantau P&L hari ini **per akaun** berasingan
- Level: ✅ profit → 🟡 50% limit → 🔴 80% limit (WALK AWAY) → ⛔ limit hit
- Guna limit per-account kalau set, kalau tak fallback ke `max_daily_loss`

### 6.7 Share Card
- Spotify Wrapped style, 4:5 card
- Toggle **$ Money ↔ % Percent**
- Download PNG (1080×1350, watermark "◈ The Gold Plan")

### 6.8 Quick Log API (iOS Shortcuts)
- DB function `api_log_trade` (RPC)
- POST JSON `{token, entry, exit, direction}` ke `/rest/v1/rpc/api_log_trade`
- Header: `apikey` (anon key) + `Authorization: Bearer <anon key>` + `Content-Type: application/json`

---

## 7. Data (3 Akaun) — Final Numbers

Diimport dari **MT5 Trade History Report** (bukan screenshot). 100% exact.

| Akaun | MT5 Account | Broker | Trades | Net P&L |
|---|---|---|---|---|
| **Cent** | 223099097 | HF Markets (real) | 1182 | **-$2,281.32** |
| **Prop 5k** | 20235972 | FundingPips (demo) | 144 | **-$69.04** |
| **Prop 10k** | 20517154 | FundingPips (demo) | 191 | **+$37.06** |
| **TOTAL** | | | **1517** | **-$2,313.30** |

**Nota:**
- Cent = akaun real, XAUUSDc, zero commission & swap → profit = net
- Prop 5k & Prop 10k = ada commission → net = profit + commission + swap
- Date coverage: Cent 08-17 s/d 08-28; Prop 5k 06-30 s/d 08-28; Prop 10k 08-06 s/d 08-26
- **IMPORTANT (mapping fail Drive):** `cent.xlsx` = akaun Cent (bukan 5k!), `10k.xlsx` = Prop 10k, `5k.xlsx` = Prop 5k. Jangan terbalik masa download — semak saiz fail: cent.xlsx ~637KB, 10k.xlsx ~122KB, 5k.xlsx ~98KB

---

## 8. Scripts (Import & Verify)

| Script | Fungsi |
|---|---|
| `scripts/import_cent_full.cjs` | Import Cent (1182 trade) dari `5k.xlsx` report — delete lama + bulk insert |
| `scripts/reimport_5k_10k_net.cjs` | Import Prop 5k + Prop 10k dengan net = profit+comm+swap |
| `scripts/import_5k_10k.cjs` | Import Prop 5k + Prop 10k (versi awal) |
| `scripts/add_volume_column.cjs` | Migration: tambah column `volume` numeric(12,2) |
| `scripts/compare_db_excel.cjs` | Banding DB vs Excel report per akaun |
| `scripts/dump_db.py` | Dump semua trades via Supabase API (guna `order=trade_date.desc,id.desc`) |
| `scripts/import_mt5.py` | LEGACY — import dari screenshot (jangan guna lagi) |
| `scripts/import_mt5_cent.py` | LEGACY — import Cent dari screenshot |
| `scripts/migrate_cent.py` | LEGACY — migration Cent |
| `scripts/check_settings.cjs` | Baca settings row |
| `scripts/verify_cent.cjs` | Verify Cent (per-date sum vs report) |

**Sumber report Excel** (Google Drive):
https://drive.google.com/drive/folders/14DQt4L6SgColU3maMA7oufzhPJf8jYzR

File: `cent.xlsx`, `10k.xlsx`, `5k.xlsx` (download guna `/tmp/mt5_*.xlsx`).

---

## 9. Deployment (Vercel)

### 9.1 Flow
1. Push ke `main` di GitHub
2. Vercel auto-detect → build `npm run build` → deploy production
3. URL: `https://thegoldplan-web.vercel.app`

### 9.2 Env Vars (Vercel)
| Name | Type | Nota |
|---|---|---|
| `VITE_SUPABASE_URL` | Config | Production |
| `VITE_SUPABASE_ANON_KEY` | Config | Production |

⚠️ **PENTING**: Vercel block env `VITE_*` yang nampak macam credential. Mesti add guna:
```bash
printf '%s' "$VALUE" | vercel env add VITE_SUPABASE_ANON_KEY production --type config
```

### 9.3 CLI Commands
```bash
vercel login          # device code flow (login guna GitHub)
vercel link --yes --project thegoldplan-web
vercel --prod --yes   # deploy production
vercel ls             # list deployments
vercel project ls     # list projects
vercel project rm journal  # (dah buat — delete projek lama "journal")
```

---

## 10. Git Push Method

Repo guna HTTPS. Token dalam session history (jangan commit). Cara push tanpa dedah token dalam command:

```bash
# tulis token ke /tmp/gh_push_token (satu baris)
# tulis askpass script:
#   #!/bin/sh
#   case "$1" in
#     *[Uu]sername*) echo "thegoldprintlab" ;;
#     *) cat /tmp/gh_push_token ;;
#   esac
chmod +x /tmp/gh_askpass.sh
cd ~/gold-plan-web
GIT_ASKPASS=/tmp/gh_askpass.sh git push origin main
rm -f /tmp/gh_push_token /tmp/gh_askpass.sh
```

Git commit author: `Jarbi <jarbi@users.noreply.github.com>`.

---

## 11. Sejarah Import Data (Chronology)

1. **Awal**: Google Sheets → 151 trades (Jun 2026) dianalisis
2. **Build app** → Supabase schema + seed
3. **Screenshot era**: extract MT5 history dari screenshot (26+26 screenshot iPad/iPhone) → DB jadi 707 trade (Cent sahaja, 08-25 s/d 08-28)
4. **Masalah**: rekod lari dari MT5 (sebab 5 hari awal 08-17 s/d 08-24 tak pernah di-import)
5. **Fix**: bos share full MT5 Trade History Report (3 akaun) di Google Drive
6. **Final import**: 1517 trade (Cent 1182 + Prop 5k 144 + Prop 10k 191) — match MT5 exact

**Punca lari dulu (penting):**
- Screenshot MT5 mobile Deals tab cuma tunjuk **close time**, bukan open time
- Screenshot termerge antara halaman scroll → ada baris yang tertinggal/duplikat
- Full report Excel adalah **gold standard** — guna report, bukan screenshot
- **Punca "data tak sama" dalam app**: Supabase/PostgREST default cap 1000 row per request. App ada 1517 trade tapi cuma fetch 1000. Dah fix dengan pagination loop dalam `fetchTrades()` (§6.4)

---

## 12. Fix Log (CSS & Bug)

| Tarikh | Fix | Detail |
|---|---|---|
| 08-30 | Responsive sizing | `.stat-grid` auto-fill→auto-fit (card penuh), table min-width, nav mobile wrap, body overflow-x hidden |
| 08-30 | iOS date input overflow | `-webkit-appearance:none` + `min-width:0` + `max-width:100%` untuk `input[type=date]` |
| 08-30 | Per-account daily loss | Column `account_daily_loss_limits` jsonb + UI Settings + KillSwitch per-account |
| 08-30 | Supabase env Vercel | Re-add `VITE_*` guna `--type config` |
| 08-30 | **Trades pagination** | Supabase cap 1000 row → `fetchTrades()` loop `range()` sehingga habis (fix "data tak sama") |
| 08-30 | **Dashboard account filter** | Dropdown pilih akaun — semua stat/chart/kill switch/share card ikut pilihan |
| 08-30 | **Input Form manual volume+profit** | Buang auto-calc profit (`pips×10` salah). Tambah field Volume (lots) + Profit/Loss ($) manual + column `volume` DB |

---

## 13. Troubleshooting

| Masalah | Solution |
|---|---|
| DB connect ENETUNREACH (IPv6) | Guna pooler `aws-0-ap-northeast-2.pooler.supabase.com:6543` |
| "tenant/user not found" dari pooler | Region salah — guna ap-northeast-2 |
| Vercel env `VITE_` kena block | Add guna `--type config` |
| dump_db.py net tak betul | Pastikan `order=trade_date.desc,id.desc` (stable pagination) |
| IPC timeout Python MT5 API | Version mismatch terminal (build 6140) vs API (6147) — guna report Excel instead |
| "App is not connected to Supabase" | Env var `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` tak masuk build → check Vercel env + redeploy |
| Dashboard cuma tunjuk 1000 trade | Dah fix (pagination). Kalau jadi balik, check `fetchTrades()` guna `range()` loop |
| Profit lari bila log trade | Jangan auto-kira profit. Guna field manual Profit/Loss ($) dalam Input Form |

---

## 13b. Token Discipline (PENTING — jangan repeat)

Bos pernah komplen: **150M token burn dalam 12 jam**. Punca & peraturan untuk elak:

| Punca burn | Peraturan |
|---|---|
| Fan-out 6 subagent untuk vision extract 52 screenshot | ❌ Jangan fan-out subagent untuk vision. Guna **MT5 Excel report** sebagai sumber (100% exact, murah) |
| `vision_analyze` pada imej besar (iPhone 1170×2532) | ❌ Elak vision untuk extract data. Kalau perlu, crop dulu ke region kecil |
| `session_search` return output persisted besar | ✅ Baca fail spillover guna `read_file`, jangan re-run search |
| Session dumps + delegation logs menimbun | ✅ Clean old `~/.hermes/sessions/req-*.json` + delegation logs selepas kerja siap |
| Re-read fail penuh berulang kali | ✅ Baca sekali, simpan ke variable, patch ikut keperluan |

**Golden rule:** Untuk data MT5, sentiasa guna Excel report dari Google Drive (§8). Screenshot hanya untuk rujukan visual, bukan sumber data.

---

## 14. Design Tokens (CSS)

- Canvas `#010102`, surface `#0f1011`→`#191a1b`
- Primary lavender `#5e6ad2`
- Green `#27a644` (profit), Red `#d64545` (loss)
- Radius: 4/6/8/12/16px
- Font: Inter (body), JetBrains Mono (nombor)

---

*Dokumen ini dijana 2026-08-30. Rujuk `docs/SECRETS_LOCAL.md` untuk credentials (local sahaja).*
