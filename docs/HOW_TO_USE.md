# ◈ The Gold Plan — How To Use (User Guide)

> The smart trading journal for **XAUUSD (Gold)** traders — built to keep you disciplined, track every trade, and protect your account from blowing up.

---

## 1. What is The Gold Plan?

The Gold Plan is a **web-based trading journal** for gold traders. It replaces messy spreadsheets and gives you:

- ✅ One-click trade logging (manual volume & profit — no auto-guessing)
- ✅ Live dashboard: win rate, profit factor, equity curve, emotion analysis
- ✅ **Kill Switch** — daily loss limit per account (prop-firm discipline)
- ✅ **Share Card** — a Spotify-Wrapped-style summary you can post on social media
- ✅ **Quick Log API** — log trades straight from your phone (iOS Shortcuts)
- ✅ Multi-account support (personal + multiple prop firm accounts)

---

## 2. Getting Started

1. Go to **https://thegoldplan-web.vercel.app**
2. **Log in** with your email & password (or sign up).
3. You land on the **Dashboard** — your trading command center.

> 💡 Works on any device: phone, tablet, or desktop. No app install needed.

---

## 3. Logging a Trade (Input Form)

Tap **Input Form** in the top menu.

| Field | What to enter |
|---|---|
| **Date** | The date of the trade |
| **Account** | Which account (Cent / Prop 5k / Prop 10k) |
| **Session** | Tokyo / London / New York / Australia |
| **Trading Setup** | Your strategy (SNR Breakout, SND Rejection, etc.) |
| **Direction** | BUY or SELL |
| **Entry Price** | The price you entered at |
| **Exit Price** | The price you exited at |
| **Volume (lots)** | Your lot size (e.g. `0.30`) |
| **Profit / Loss ($)** | Your actual P&L in dollars (e.g. `200` or `-85`). **This is manual — type what you actually made.** |
| **Emotion** | How you felt (Calm, FOMO, Revenge, Hesitant) |
| **Notes** | Your trade thesis, TradingView link, what went right/wrong |

Then tap **Submit**.

> ⚠️ **Important:** Profit/Loss is **manual input** — the app never guesses your P&L. Pips are auto-calculated from entry/exit, but your profit is exactly what you type.

---

## 4. Dashboard — Your Command Center

At the top, pick an **Account filter** (All / Cent / Prop 5k / Prop 10k). Everything below follows that selection.

### Stat Cards
- **Total Net P&L** — your bottom line
- **Win Rate** — wins ÷ total trades
- **Profit Factor** — gross profit ÷ gross loss (>1.5 is great)
- **Trades (W/L)** — how many trades, wins vs losses
- **Avg Win / Avg Loss** — your risk-reward picture
- **Best / Worst Trade** — your extremes

### Charts
- **Daily Equity Growth** — your account curve over time
- **Emotion vs Net P&L** — see how your psychology affects your money

### Scoreboards
- **Setup** — which strategy makes you money (and which doesn't)
- **Session** — which session you trade best
- **Account Performance** — ROI per account (vs starting capital)
- **Emotion** — your emotional state vs results

---

## 5. Kill Switch (Jurulatih Akaun) — Your Discipline Guard

This is **the most important feature**. It tracks today's P&L **per account** and tells you when to stop.

| Level | Meaning |
|---|---|
| 🟢 **Profit** | Green — you're up today |
| 🟡 **50% of limit** | Warning — slow down |
| 🔴 **80% of limit** | WALK AWAY — stop opening new trades |
| ⛔ **Limit hit** | BLOWN — you must stop. Log off. |

> 💡 Set your **daily loss limit per account** in Settings. This mirrors prop-firm rules (e.g. 5% daily drawdown = fail). The Kill Switch keeps you funded.

---

## 6. Trading Log

Tap **Trading Log** to see every trade in a table:

- Filter by **account**
- See date, session, setup, direction, entry/exit, volume, pips, P&L, emotion, volatility
- **Delete** a trade (trash icon → confirm)

---

## 7. Share Card — Show Off Your Results

On the Dashboard, scroll to the **Share Card**:

1. Toggle **$ Money** or **% Percent**
2. Tap **Download PNG** (1080×1350, watermarked "◈ The Gold Plan")
3. Post it on X/Twitter, Instagram, Telegram, TikTok

> 🔥 This is your viral growth engine — every card you post is free marketing.

---

## 8. Settings

In **Settings** you configure everything:

- **Setups / Sessions / Emotions / Accounts** — one per line
- **Starting Capital per Account** — for ROI calculation
- **Daily Loss Limit per Account** — for the Kill Switch
- **Quick Log API** — endpoint + token for iOS Shortcuts

---

## 9. Quick Log API (Power Users)

Log a trade from your phone in 2 taps using **iOS Shortcuts**:

```
POST https://gtblmwijohoetczqngpr.supabase.co/rest/v1/rpc/api_log_trade
Headers:
  apikey: <your anon key>
  Authorization: Bearer <your anon key>
  Content-Type: application/json
Body:
  { "token": "<your token>", "entry": 2325.50, "exit": 2330.50, "direction": "BUY" }
```

Create a Shortcut → "Get Contents of URL" → paste this. Now logging a trade is instant.

---

## 10. Best Practices

1. **Log every trade the same day** — no memory guessing
2. **Be honest with P&L** — the journal only helps if it's true
3. **Set your daily loss limit** — and obey the Kill Switch
4. **Tag your emotion** — your psychology is half the game
5. **Review weekly** — sort the Dashboard by Setup & Session, cut what loses
6. **Post your Share Card** — accountability + it grows your following

---

## FAQ

**Q: Is it free?**
A: Yes, current version is free. Premium features (more accounts, advanced analytics) coming soon.

**Q: Does it connect to MT5 automatically?**
A: No auto-sync yet. You log trades manually or import from your MT5 report. Auto-sync is on the roadmap.

**Q: Can I track multiple prop firm accounts?**
A: Yes — add all your accounts in Settings, each with its own capital and daily loss limit.

**Q: My profit shows wrong?**
A: Profit is **manual** — make sure you typed the right value in the Input Form.

---

*The Gold Plan — trade with a plan, protect your capital, grow with discipline.* ◈
