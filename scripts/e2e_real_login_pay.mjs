// e2e_real_login_pay.mjs — pelanggan SEBENAR mesti masih boleh bayar.
// Akaun ujian wujud (arfasyrf@gmail.com). Tidak membuat bayaran.
import { chromium } from 'playwright'
const EMAIL = process.env.TEST_EMAIL
const PASS = process.env.TEST_PASS
if (!EMAIL || !PASS) { console.log('SKIP: TEST_EMAIL/TEST_PASS tak diset'); process.exit(0) }

const b = await chromium.launch()
const ctx = await b.newContext()
const p = await ctx.newPage()
await p.goto('https://thegoldplan.my/app', { waitUntil: 'networkidle' })
await p.locator('input[type=email]').fill(EMAIL)
await p.locator('input[type=password]').fill(PASS)
await p.locator('button', { hasText: /^log in$/i }).click()
await p.waitForTimeout(4000)
console.log('selepas login URL:', p.url())
const nav = (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 120)
console.log('skrin:', nav)

await p.goto('https://thegoldplan.my/pricing', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const foot = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
console.log('footer:', /Logged in as[^.]*/i.exec(foot)?.[0] ?? '(tiada)')

let url = null
p.on('framenavigated', (f) => { if (f === p.mainFrame()) url = f.url() })
await p.locator('button', { hasText: /start monthly/i }).first().click()
await p.waitForTimeout(3500)
const u = url || p.url()
const qs = new URLSearchParams(u.split('?')[1] || '')
console.log('\nStripe URL:', u.slice(0, 100))
console.log('  client_reference_id:', qs.get('client_reference_id'))
console.log('  prefilled_email    :', qs.get('prefilled_email'))
console.log('  >>> pelanggan sebenar boleh checkout:',
  qs.get('client_reference_id') && qs.get('client_reference_id') !== 'demo-user' ? 'YA' : 'TIDAK')
if (u.includes('stripe.com')) await p.goto('about:blank')
await b.close()
