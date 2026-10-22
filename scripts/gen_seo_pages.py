#!/usr/bin/env python3
"""gen_seo_pages.py — jana halaman SEO statik ke public/.

Kenapa statik, bukan React: thegoldplan.my serve index.html kosong (2.5KB) untuk
SEMUA route. Googlebot baca HTML mentah, jadi setiap halaman nampak sama dan tipis.
Fail ni tulis HTML penuh supaya setiap halaman ada <h1>, teks, dan canonical sendiri.

Guna: python3 scripts/gen_seo_pages.py
Tambah halaman: tambah entri dalam PAGES, jalan semula, commit.
"""
from pathlib import Path

SITE = "https://thegoldplan.my"
OUT = Path(__file__).resolve().parent.parent / "public"

CSS = """
:root{--bg:#0d0f14;--fg:#e9ecf1;--dim:#9aa3b2;--line:#232a36;--acc:#c9a227;--card:#141822}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 Inter,system-ui,-apple-system,sans-serif}
a{color:var(--acc)}
.wrap{max-width:720px;margin:0 auto;padding:28px 20px 72px}
nav{display:flex;gap:18px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:34px;font-size:14px}
nav b{margin-right:auto;letter-spacing:.02em}
nav a{color:var(--dim);text-decoration:none}
nav a:hover{color:var(--fg)}
h1{font-size:clamp(1.7rem,4.4vw,2.5rem);line-height:1.18;letter-spacing:-.02em;margin:0 0 18px}
h2{font-size:1.22rem;margin:38px 0 10px;letter-spacing:-.01em}
h3{font-size:1rem;margin:22px 0 6px}
p,li{color:#cdd4e0}
.lead{font-size:1.08rem;color:var(--fg)}
table{width:100%;border-collapse:collapse;margin:18px 0;font-size:.94rem}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--dim);font-weight:600;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em}
code{background:#1b2130;padding:2px 6px;border-radius:4px;font-size:.9em}
.cta{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px;margin:38px 0}
.cta h3{margin-top:0}
.btn{display:inline-block;background:var(--acc);color:#12140f;font-weight:600;padding:11px 20px;border-radius:8px;text-decoration:none;margin:6px 10px 0 0}
.btn.alt{background:transparent;color:var(--fg);border:1px solid var(--line)}
.ans{border-left:2px solid var(--acc);padding:2px 0 2px 16px;margin:14px 0;color:var(--fg)}
footer{border-top:1px solid var(--line);margin-top:56px;padding-top:18px;font-size:13px;color:var(--dim)}
"""

NAV = """<nav><b>The Gold Plan</b><a href="/">Home</a><a href="/pricing">Pricing</a>
<a href="/xauusd-trading-journal">XAUUSD journal</a>
<a href="/mt5-trading-journal-import">MT5 import</a>
<a href="/prop-firm-daily-loss-tracker">Daily loss tracker</a></nav>"""

CTA = """<div class="cta"><h3>See it with your own trades</h3>
<p>The demo opens with four sample accounts and 107 trades — no login, no card.
The live journal is $19/month or $149 once.</p>
<a class="btn" href="/app?demo=1">Open the free demo</a>
<a class="btn alt" href="/pricing">See pricing</a></div>"""


def page(slug, title, desc, h1, body):
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{SITE}/{slug}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE}/{slug}">
<meta property="og:type" content="article">
<meta name="theme-color" content="#0d0f14">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>{CSS}</style>
</head>
<body>
<div class="wrap">
{NAV}
<article>
<h1>{h1}</h1>
{body}
</article>
{CTA}
<footer>The Gold Plan — a XAUUSD trading journal. Not signals, not a broker. We are not
affiliated with any prop firm. <a href="/pricing">Pricing</a> ·
<a href="/app?demo=1">Demo</a> · <a href="/privacy">Privacy</a></footer>
</div>
</body>
</html>
"""
    (OUT / f"{slug}.html").write_text(html, encoding="utf-8")
    return f"{slug}.html"


PAGES = []

# ── 1 ──────────────────────────────────────────────────────────────────────
PAGES.append(("prop-firm-daily-loss-tracker",
 "Prop Firm Daily Loss Tracker for XAUUSD — The Gold Plan",
 "Track your daily loss limit per account while you trade gold. See how close you are "
 "to the rule at 50%, 80% and 100% — before the account is gone.",
 "Prop firm daily loss tracker for gold traders",
 """
<p class="lead">Most prop accounts do not die from a bad strategy. They die at 14:40 on a
Tuesday, three trades deep, when the number on the screen is close enough to the daily
limit that one more entry feels reasonable.</p>

<p>The Gold Plan tracks that number per account, while you are still in the session, and
tells you where you stand against the rule you set.</p>

<h2>What actually gets tracked</h2>
<table>
<tr><th>You set</th><th>It shows</th></tr>
<tr><td>Daily loss limit, per account</td><td>Today's realised P&amp;L against that limit, as a percentage</td></tr>
<tr><td>Starting capital, per account</td><td>ROI per account, not one blended number</td></tr>
<tr><td>Session, setup, emotion per trade</td><td>Which combination is producing your red days</td></tr>
</table>

<h2>The three thresholds</h2>
<p>The kill switch has four states, and they are deliberately blunt:</p>
<table>
<tr><th>State</th><th>Trigger</th><th>What it means</th></tr>
<tr><td>Green</td><td>In profit</td><td>Nothing to do.</td></tr>
<tr><td>Amber</td><td>50% of the daily limit used</td><td>Half your rope is gone. Size down.</td></tr>
<tr><td>Red — walk away</td><td>80% of the limit used</td><td>One normal stop-out ends the account.</td></tr>
<tr><td>Hard stop</td><td>100% of the limit used</td><td>The rule is already broken. Stop trading.</td></tr>
</table>

<div class="ans"><strong>One honest thing:</strong> the kill switch is a warning, not an
execution tool. It never connects to your broker and never closes a position. You are
still the one who stops. Software that pretends otherwise is lying to you about what it
can do.</div>

<h2>Why separate limits per account</h2>
<p>A $5k challenge and a personal account do not share a rulebook, and blending them
hides the one number that matters. If your journal averages a blown $10k challenge with a
funded account that is trading well, you learn nothing and you feel fine. Per-account
tracking is the whole point.</p>

<h2>Setting it up</h2>
<ol>
<li>Add each account under Settings, with its starting capital and its own daily loss limit.</li>
<li>Log trades as you take them — date, account, session, setup, direction, entry, exit, volume, P&amp;L, emotion.</li>
<li>Open the dashboard before your next entry. The kill switch is at the top.</li>
</ol>
<p>If you already have history, import it from an MT5 report instead of typing it in —
<a href="/mt5-trading-journal-import">that process is here</a>.</p>

<h2>What it will not do</h2>
<ul>
<li>It will not pass the challenge for you, and it will not tell you what to trade.</li>
<li>It will not connect to your broker's execution. Import and manual entry only.</li>
<li>It will not replace the firm's own dashboard — always trust their number over mine.</li>
</ul>

<p>If you trade gold on a prop account and you have breached a daily limit before, the
useful question is not "what setup should I use" but "at what point in the session do I
stop". That is a journal question, and it needs a number, per account, today.</p>
""",
))

# ── 2 ──────────────────────────────────────────────────────────────────────
PAGES.append(("mt5-trading-journal-import",
 "Import an MT5 Report Into a Trading Journal — The Gold Plan",
 "Export your MetaTrader 5 history to Excel or HTML, then import it into a journal that "
 "scores your sessions, setups and emotions instead of just listing trades.",
 "Import your MT5 history instead of retyping it",
 """
<p class="lead">MetaTrader 5 already stores every trade you have taken. That is a record,
not a journal — it knows your entry, your exit and your P&amp;L, and nothing about why you
pressed the button.</p>

<p>The Gold Plan imports what MT5 has, so the manual part is only the part MT5 cannot
know.</p>

<h2>Export from MT5 first</h2>
<ol>
<li>Open <strong>Toolbox → History</strong> in MetaTrader 5.</li>
<li>Right-click inside the history list → <strong>Report</strong> → choose
<strong>XLSX</strong> (or HTML).</li>
<li>Pick the date range. One account at a time — do not merge accounts into one file.</li>
<li>Save the file. That is the file you upload.</li>
</ol>

<h2>Then import</h2>
<ol>
<li>Open <strong>Import</strong> in the journal.</li>
<li>Select the account the file belongs to. This is the step people skip, and it is the
one that makes per-account statistics wrong.</li>
<li>Upload the file. The parser reads open time, symbol, direction, volume, entry, exit
and profit.</li>
<li>Review the preview before you commit. Duplicates are the usual surprise.</li>
</ol>

<h2>What the import cannot fill in</h2>
<table>
<tr><th>Comes from MT5</th><th>You add afterwards</th></tr>
<tr><td>Open/close time, symbol, direction</td><td>Session label, if you use custom ones</td></tr>
<tr><td>Volume, entry, exit, profit</td><td>Setup name</td></tr>
<tr><td>Ticket, commission, swap</td><td>Emotion before and after the trade</td></tr>
<tr><td>—</td><td>Notes: what you saw, what you ignored</td></tr>
</table>

<p>That second column is the entire reason to keep a journal at all. A file full of
imported rows with empty emotion fields is a spreadsheet with extra steps.</p>

<h2>After the import, look at three things</h2>
<ol>
<li><strong>Session scoreboard.</strong> Gold in the London–NY overlap is a different
instrument from gold in Asia. Your win rate will not be the same, and the gap is usually
bigger than you expect.</li>
<li><strong>Emotion vs net P&amp;L.</strong> Calm days tend to print. Revenge days tend to
donate. If the bar chart shows what you suspect, you now have a number instead of a
feeling.</li>
<li><strong>Best and worst trade.</strong> The worst trade is rarely the biggest loss. It
is usually the one that broke your own size rule.</li>
</ol>

<h2>Does it work with other platforms?</h2>
<p>The parser is built around the MT5 Excel/HTML report, which most MT4-to-MT5 brokers and
prop firms produce. If your broker's export looks different, manual entry and the Quick Log
API both still work — the API exists so an iOS Shortcut can post a trade in one tap.</p>

<p>If you have a year of gold trades sitting in MT5 unexamined, importing them takes about
a minute and answers questions you have been guessing at.</p>
""",
))

# ── 3 ──────────────────────────────────────────────────────────────────────
PAGES.append(("xauusd-trading-journal",
 "XAUUSD Trading Journal — Track Gold Trades, Sessions and Emotions",
 "A trading journal built for one instrument: gold. Per-account daily loss limits, "
 "session and emotion scoreboards, MT5 import, and a share card.",
 "A trading journal built for one instrument, not thirty",
 """
<p class="lead">Gold is not forex with a different ticker. It moves on real yields, on
central-bank headlines, and on a spread that widens exactly when the move starts. A journal
that treats XAUUSD as one row among forty pairs will average away the only patterns that
matter.</p>

<h2>What is different about journaling gold</h2>
<table>
<tr><th>Gold-specific problem</th><th>What the journal gives you</th></tr>
<tr><td>One lot is ~$10 a pip — sizing errors are expensive fast</td><td>Volume and P&amp;L per trade, with average win and average loss</td></tr>
<tr><td>The London–NY overlap is a different market from Asia</td><td>Session scoreboard, so the two are not blended</td></tr>
<tr><td>Revenge trading after a stop-out is the classic death</td><td>Emotion scoreboard against net P&amp;L</td></tr>
<tr><td>Prop rules are daily, not monthly</td><td>Per-account daily loss limit with 50/80/100% warnings</td></tr>
</table>

<h2>The four scoreboards</h2>
<ul>
<li><strong>Setup</strong> — which of your named setups actually pays.</li>
<li><strong>Session</strong> — Asia, London, overlap, New York. Where your edge lives.</li>
<li><strong>Account</strong> — ROI per account, including prop vs personal separately.</li>
<li><strong>Emotion</strong> — calm, hesitant, FOMO, revenge, and what each one costs.</li>
</ul>

<h2>Numbers on the dashboard</h2>
<p>Total net P&amp;L, win rate, profit factor, trades won/lost, average win, average loss,
best trade, worst trade, and a daily equity curve. All of it filters by account, because
"all accounts" is a comforting view that hides a blown challenge.</p>

<h2>How I use it</h2>
<p>I trade gold on a prop account and on my own. Before the London open I look at one
number: how much of today's limit is left. After the session I log the trades I took and,
more usefully, note the ones I wanted to take and did not. Over 1,517 logged trades across
three accounts, the pattern that cost the most was never a bad entry — it was the second
and third entry after a loss.</p>

<p>You do not have to take my word for any of that. The demo is the app with sample data,
open, no login: <a href="/app?demo=1">try it here</a>.</p>

<h2>Who this is not for</h2>
<ul>
<li>If you want signals, this is not that.</li>
<li>If you want an EA that trades for you, this is not that either.</li>
<li>If you trade twelve instruments and want one blended report, a general journal will
serve you better than a gold-specific one.</li>
</ul>

<p>If you trade one instrument, seriously, the journal should be shaped like that
instrument.</p>
""",
))

# ── 4 ──────────────────────────────────────────────────────────────────────
PAGES.append(("trading-journal-vs-excel",
 "Trading Journal vs Excel — What a Spreadsheet Cannot Do",
 "Excel is free and flexible. It also does not warn you at 80% of your daily loss limit "
 "while you are still in the trade. Here is the honest comparison.",
 "Trading journal vs Excel: where the spreadsheet actually fails",
 """
<p class="lead">If your spreadsheet is already keeping you disciplined, keep it. This page
is not going to pretend a paid journal beats a free file for everyone.</p>

<p>It is going to be specific about the four things a spreadsheet does not do, and let you
decide whether any of them cost you money.</p>

<h2>1. A spreadsheet cannot warn you during the session</h2>
<p>A sheet tells you what happened. By the time you open it, the third trade is already
filled. The one job a journal can do that a sheet cannot is interrupt you at 80% of your
daily limit — the moment before the account-ending trade, not the evening after it.</p>

<h2>2. A spreadsheet cannot score by emotion</h2>
<p>You can add an "emotion" column in Excel in about ten seconds. What you cannot do
cheaply is the pivot that answers: what is my net P&amp;L when the emotion is
<em>revenge</em> compared with <em>calm</em>, and is that gap bigger than my entire
monthly profit? That pivot is the product.</p>

<h2>3. A spreadsheet cannot import an MT5 report</h2>
<p>Exporting MT5 to Excel and then hand-mapping the columns into your own sheet works
exactly once. After that, the format drifts, a column moves, and you stop doing it. Import
is the difference between a journal you keep and a journal you abandon in week three.</p>

<h2>4. A spreadsheet does not survive a phone</h2>
<p>Most gold trades are logged on a phone, minutes after the fact, not at a desk. Excel on
a phone is a pinch-and-zoom exercise. The Quick Log API exists because one tap on a
Shortcut beats opening a spreadsheet.</p>

<h2>Where Excel genuinely wins</h2>
<table>
<tr><th>Excel wins when</th><th>A journal wins when</th></tr>
<tr><td>You want a custom metric nobody has thought of</td><td>You want the standard metrics without building them</td></tr>
<tr><td>You never trade without a desk in front of you</td><td>You trade from a phone</td></tr>
<tr><td>Budget is zero and always will be</td><td>$19/month is less than one bad lot on gold</td></tr>
<tr><td>You have one account</td><td>You have a prop account and a personal one</td></tr>
</table>

<div class="ans"><strong>Fair comparison:</strong> $19/month is roughly two pips on a
single gold lot. If the journal stops one extra lot mistake per month, it has paid for
itself. If it does not, cancel — monthly is cancel-anytime from Account &amp; Billing.</div>

<h2>The test that settles it</h2>
<p>Open the demo, which is the app with four sample accounts and 107 trades, and look at
the emotion chart. If it tells you something your spreadsheet has never told you, the
$19 is easy. If it does not, you have lost four minutes.</p>
""",
))

# ── 5 ──────────────────────────────────────────────────────────────────────
PAGES.append(("trading-journal-emotions",
 "Logging Emotion Per Trade — The Part Most Journals Skip",
 "The emotion column is the one field nobody fills in and the one that explains your red "
 "days. Here is how to log it in a way that produces a usable answer.",
 "The emotion column nobody fills in, and why it is the one that pays",
 """
<p class="lead">Almost every trading journal template has an emotion field. Almost nobody
fills it in, because "how did you feel" is a bad question. It produces a word, and a word
does not aggregate.</p>

<h2>Ask a narrower question</h2>
<p>Instead of "how do you feel", pick from a fixed short list. Fixed options are what make
the scoreboard possible:</p>
<table>
<tr><th>Label</th><th>The trade it usually produces</th></tr>
<tr><td>Calm</td><td>Setup was there, size was normal, stop was honoured.</td></tr>
<tr><td>Hesitant</td><td>Entry was late, size was small, the move happened without you.</td></tr>
<tr><td>FOMO</td><td>Entry was after the move, stop was wide or absent.</td></tr>
<tr><td>Revenge</td><td>Entry came within minutes of a loss, size was larger.</td></tr>
<tr><td>Tired</td><td>Entry in a session you do not normally trade.</td></tr>
</table>

<p>Five labels is enough. Twenty labels is a taxonomy nobody maintains.</p>

<h2>What the chart actually tells you</h2>
<p>Once trades carry a label, one comparison becomes possible: net P&amp;L per label. In
most journals the result is lopsided in a way the trader already suspected but never
priced. Revenge trades are rarely the most numerous. They are almost always the most
expensive per trade.</p>

<p>That single number does something a rule cannot: it makes the cost of the next revenge
entry concrete. "I should not do this" is a feeling. "This label has cost me $840 this
quarter" is a fact.</p>

<h2>Two fields, not one</h2>
<p>Emotion before the entry and emotion after the exit are different things, and they
diverge in the trades that matter. Calm going in, angry coming out is a normal stop-out.
Angry going in, calm coming out is the one that ends accounts.</p>

<h2>How to start without changing your process</h2>
<ol>
<li>Tag the last thirty trades you already have, from memory. Memory is fine for a month.</li>
<li>Look at the net P&amp;L per label. Do not fix anything yet.</li>
<li>For two weeks, tag every new trade at entry. One tap, chosen from the fixed list.</li>
<li>Compare the two periods. If the expensive label has not shrunk, the tagging is not
doing the work — the rule is missing.</li>
</ol>

<h2>The honest limit</h2>
<p>Emotion tags are self-reported and they are not science. Nobody is measuring your
cortisol. What they are is a cheap proxy that turns a vague pattern into a number you can
compare month to month, and that is enough to change behaviour.</p>

<p>If you want to see how the scoreboard looks before committing, the
<a href="/app?demo=1">demo</a> is the full app with sample data and no login.</p>
""",
))


if __name__ == "__main__":
    made = [page(*p) for p in PAGES]
    print(f"{len(made)} halaman ditulis ke {OUT}:")
    for m in made:
        print("  ", m)
