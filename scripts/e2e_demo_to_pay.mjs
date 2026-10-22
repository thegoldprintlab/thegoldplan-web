// e2e_demo_to_pay.mjs — dari DEMO, tekan bayar: URL checkout apa yang keluar?
import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext()
const p = await ctx.newPage()

await p.goto('https://thegoldplan.my/app?demo=1', { waitUntil: 'networkidle' })
await p.waitForTimeout(1000)

// Pergi pricing ikut laluan sebenar pelawat demo
await p.goto('https://thegoldplan.my/pricing', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const t = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
console.log('pricing text (potongan):', t.slice(0, 260))
const btns = await p.locator('button').allTextContents()
console.log('buttons:', btns.map((s) => s.trim()).filter(Boolean).join(' | '))

// Tangkap URL navigasi bila tekan butang beli
let navUrl = null
p.on('framenavigated', (f) => { if (f === p.mainFrame()) navUrl = f.url() })

const buy = p.locator('button', { hasText: /start monthly|get lifetime/i }).first()
if (await buy.count()) {
  await buy.click().catch(() => {})
  await p.waitForTimeout(3500)
  console.log('\nURL selepas tekan beli:', navUrl || p.url())
  const u = navUrl || p.url()
  // Jangan teruskan ke Stripe — cuma periksa parameter yang dibawa
  const qs = u.includes('?') ? u.split('?')[1] : ''
  console.log('query params:', qs.slice(0, 300))
  console.log('bawa client_reference_id?:', /client_reference_id/.test(qs))
  const m = qs.match(/client_reference_id=([^&]+)/)
  if (m) console.log('  nilai:', decodeURIComponent(m[1]))
  const pref = qs.match(/prefilled_email=([^&]+)/)
  if (pref) console.log('  prefilled_email:', decodeURIComponent(pref[1]))
} else {
  console.log('TIADA butang beli dijumpai')
}
// Hentikan sebelum mendarat di Stripe
if ((navUrl || '').includes('stripe.com')) {
  await p.goto('about:blank')
  console.log('\n(berhenti sebelum Stripe — tiada bayaran dibuat)')
}
await b.close()
