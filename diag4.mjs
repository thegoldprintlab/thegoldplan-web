import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext()
const p = await ctx.newPage()
p.on('pageerror', e => console.log('PAGE ERROR:', e.message.slice(0,300)))
await p.goto('http://localhost:4173/', { waitUntil:'domcontentloaded' })
await p.waitForTimeout(2500)
const r = await p.evaluate(() => ({
  gtag: typeof window.gtag,
  dlLen: (window.dataLayer||[]).length,
  dl: JSON.stringify((window.dataLayer||[]).map(a=>Array.from(a))),
  scripts: Array.from(document.querySelectorAll('script[src]')).map(s=>s.src).filter(s=>s.includes('goog')),
}))
console.log(JSON.stringify(r, null, 1))
await b.close()
