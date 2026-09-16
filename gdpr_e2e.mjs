/**
 * End-to-end GDPR consent verification in a real browser.
 *
 * Proves the three things that actually matter legally:
 *  1. No _ga cookie is set before the visitor chooses (Consent Mode default denied).
 *  2. Clicking Accept grants analytics_storage and cookies start flowing.
 *  3. Clicking Decline keeps cookies off across a reload.
 *
 * Run: node /tmp/gdpr_e2e.mjs
 */
import { chromium } from 'playwright'

const URL = process.env.TEST_URL || 'http://localhost:4173/'
let pass = true
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' ' + extra : ''}`)
  if (!cond) pass = false
}

const cookieNames = (ctx) => ctx.cookies().then((cs) => cs.map((c) => c.name))

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()

// ── 1. Fresh visit: banner visible, no analytics cookie ─────────────────
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const bannerVisible = await page.locator('.cookie-banner').isVisible().catch(() => false)
check('banner consent kelihatan pada lawatan pertama', bannerVisible)

const before = await cookieNames(ctx)
const gaBefore = before.filter((n) => n.startsWith('_ga'))
check('TIADA cookie _ga sebelum pilih (teras GDPR)', gaBefore.length === 0, `[${before.join(',')}]`)

// consent default must be denied in the dataLayer
const defaultDenied = await page.evaluate(() => {
  const dl = window.dataLayer || []
  const d = dl.find((a) => a && a[0] === 'consent' && a[1] === 'default')
  return d ? d[2]?.analytics_storage : null
})
check('dataLayer: consent default = denied', defaultDenied === 'denied', `[${defaultDenied}]`)

// ── 2. Accept → cookies appear ──────────────────────────────────────────
await page.getByRole('button', { name: 'Accept' }).click()
await page.waitForTimeout(1500)

const stored = await page.evaluate(() => localStorage.getItem('gp-consent-v1'))
check('pilihan disimpan dalam localStorage', !!stored, stored ? '' : '(kosong)')

const afterAccept = await cookieNames(ctx)
const gaAfter = afterAccept.filter((n) => n.startsWith('_ga'))
check('selepas Accept: cookie _ga MULA ditulis', gaAfter.length > 0, `[${gaAfter.join(',')}]`)

const bannerGone = await page.locator('.cookie-banner').isVisible().catch(() => false)
check('banner hilang selepas pilih', !bannerGone)

// ── 3. Reload → choice persists, banner stays hidden ────────────────────
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const bannerAfterReload = await page.locator('.cookie-banner').isVisible().catch(() => false)
check('reload: banner kekal tersembunyi (pilihan diingati)', !bannerAfterReload)

// ── 4. Decline path in a clean context ──────────────────────────────────
const ctx2 = await browser.newContext()
const page2 = await ctx2.newPage()
await page2.goto(URL, { waitUntil: 'networkidle' })
await page2.waitForTimeout(1200)
await page2.getByRole('button', { name: 'Decline' }).click()
await page2.waitForTimeout(1500)

const decCookies = (await ctx2.cookies()).map((c) => c.name).filter((n) => n.startsWith('_ga'))
check('selepas Decline: TIADA cookie _ga', decCookies.length === 0, `[${decCookies.join(',')}]`)

await page2.reload({ waitUntil: 'networkidle' })
await page2.waitForTimeout(1000)
const decAfter = (await ctx2.cookies()).map((c) => c.name).filter((n) => n.startsWith('_ga'))
check('Decline kekal selepas reload', decAfter.length === 0)

// ── 5. /privacy reachable + Cookie settings reopens banner ──────────────
await page2.goto(URL + 'privacy', { waitUntil: 'networkidle' })
const hasPrivacy = await page2.locator('h1', { hasText: 'Privacy Policy' }).count()
check('halaman /privacy boleh dicapai', hasPrivacy > 0)

// Cookie settings is in the landing footer — go home and click it
await page2.goto(URL, { waitUntil: 'networkidle' })
await page2.waitForTimeout(800)
await page2.getByRole('button', { name: 'Cookie settings' }).click()
await page2.waitForTimeout(500)
const reopened = await page2.locator('.cookie-banner').isVisible().catch(() => false)
check('"Cookie settings" buka semula banner (boleh tarik balik)', reopened)

await browser.close()
console.log(pass ? '\n>>> SEMUA LULUS — GDPR consent berfungsi' : '\n>>> ADA GAGAL')
process.exit(pass ? 0 : 1)
