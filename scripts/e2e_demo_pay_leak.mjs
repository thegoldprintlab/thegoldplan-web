// e2e_demo_pay_leak.mjs — sahkan: pelawat DEMO boleh sampai ke Stripe dan bayar
// atas nama akaun palsu 'demo-user'. Hentikan sebelum mendarat.
import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext()
const p = await ctx.newPage()

// 1. Masuk demo (ini yang setiap pelawat dari CTA baru kita lakukan)
await p.goto('https://thegoldplan.my/app?demo=1', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)

// 2. Navigate ke pricing — demo kekal dalam localStorage (gp-demo=1)
await p.goto('https://thegoldplan.my/pricing', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)

const foot = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
console.log('Pricing footer:', /Logged in as|Log in before checkout/i.exec(foot)?.[0] ?? '(tiada)')

let nav = null
p.on('framenavigated', (f) => { if (f === p.mainFrame()) nav = f.url() })
await p.locator('button', { hasText: /start monthly/i }).first().click()
await p.waitForTimeout(3500)

const url = nav || p.url()
console.log('\nURL Stripe:', url.slice(0, 120))
const qs = new URLSearchParams(url.split('?')[1] || '')
console.log('  client_reference_id :', qs.get('client_reference_id'))
console.log('  prefilled_email     :', qs.get('prefilled_email'))
const leaker = qs.get('client_reference_id') === 'demo-user' || /preview\.app/.test(qs.get('prefilled_email') || '')
console.log('\n>>> KEBOCORAN:', leaker ? 'YA — pelawat demo boleh bayar sebagai "demo-user"' : 'tidak')

if (url.includes('stripe.com')) await p.goto('about:blank')
await b.close()
