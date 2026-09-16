/**
 * End-to-end GDPR consent verification in a real browser.
 *
 * Proves the three things that actually matter legally:
 *  1. No _ga cookie is set before the visitor chooses (Consent Mode defaults).
 *  2. Accepting grants analytics_storage and the cookie appears.
 *  3. Declining leaves the visitor cookieless and the choice persists.
 *
 * Run against any URL:
 *   TEST_URL=https://thegoldplan-web.vercel.app/ node tests/e2e/gdpr-consent.mjs
 *
 * Requires playwright (`npm i -D playwright && npx playwright install chromium`).
 */
import { chromium } from 'playwright'

const URL = process.env.TEST_URL || 'http://localhost:4173/'

const results = []
function check(name, pass, extra = '') {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? ` [${extra}]` : ''}`)
}

const browser = await chromium.launch()

// ── Fresh visitor: must NOT get cookies before choosing ──────────────────
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })

  const bannerVisible = await page.locator('.cookie-banner').isVisible().catch(() => false)
  check('banner consent kelihatan pada lawatan pertama', bannerVisible)

  // Give gtag.js time to load and (incorrectly) drop cookies if consent is broken.
  await page.waitForTimeout(2500)

  const cookies = await ctx.cookies()
  const gaCookies = cookies.filter((c) => c.name.startsWith('_ga')).map((c) => c.name)
  check('TIADA cookie _ga sebelum pilih (teras GDPR)', gaCookies.length === 0, gaCookies.join(','))

  const defaultConsent = await page.evaluate(() => {
    const dl = window.dataLayer || []
    // The gtag stub pushes `arguments`, which serialises as an object with
    // numeric keys ('0','1','2') — NOT a real Array. Array.isArray() is false
    // here, which is why this check must be index-based, not array-based.
    const entry = dl.find((e) => e && e[0] === 'consent' && e[1] === 'default')
    return entry && entry[2] ? entry[2].analytics_storage : null
  })
  check('dataLayer: consent default = denied', defaultConsent === 'denied', String(defaultConsent))

  // Only written after a choice is made — absence before that is the point.
  const storedBefore = await page.evaluate(() => localStorage.getItem('gp-consent-v1'))
  check('TIADA pilihan disimpan sebelum user pilih', storedBefore === null, String(storedBefore))

  // ── Accept ─────────────────────────────────────────────────────────────
  await page.locator('.cookie-banner button', { hasText: /accept/i }).first().click()
  await page.waitForTimeout(2500)

  const afterCookies = await ctx.cookies()
  const afterGa = afterCookies.filter((c) => c.name.startsWith('_ga')).map((c) => c.name)
  check('selepas Accept: cookie _ga MULA ditulis', afterGa.length > 0, afterGa.join(','))

  const hidden = await page.locator('.cookie-banner').isVisible().catch(() => false)
  check('banner hilang selepas pilih', !hidden)

  await page.reload({ waitUntil: 'networkidle' })
  const bannerAfterReload = await page.locator('.cookie-banner').isVisible().catch(() => false)
  check('reload: banner kekal tersembunyi (pilihan diingati)', !bannerAfterReload)
  await ctx.close()
}

// ── Decline path ─────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.locator('.cookie-banner button', { hasText: /decline|reject/i }).first().click()
  await page.waitForTimeout(2500)

  const cookies = await ctx.cookies()
  const ga = cookies.filter((c) => c.name.startsWith('_ga'))
  check('selepas Decline: TIADA cookie _ga', ga.length === 0, ga.map((c) => c.name).join(','))

  await page.reload({ waitUntil: 'networkidle' })
  const visible = await page.locator('.cookie-banner').isVisible().catch(() => false)
  check('Decline kekal selepas reload', !visible)
  await ctx.close()
}

// ── Privacy page + withdrawal ────────────────────────────────────────────
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${URL.replace(/\/$/, '')}/privacy`, { waitUntil: 'networkidle' })
  const heading = await page.locator('h1').first().textContent().catch(() => null)
  check('halaman /privacy boleh dicapai', /privacy/i.test(heading || ''), heading || 'tiada')

  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.locator('.cookie-banner button', { hasText: /accept/i }).first().click()
  await page.waitForTimeout(500)
  await page.locator('text=Cookie settings').first().click()
  await page.waitForTimeout(500)
  const reopened = await page.locator('.cookie-banner').isVisible().catch(() => false)
  check('"Cookie settings" buka semula banner (boleh tarik balik)', reopened)
  await ctx.close()
}

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(
  failed.length === 0
    ? '\n>>> SEMUA LULUS — GDPR consent berfungsi'
    : `\n>>> ADA GAGAL: ${failed.map((f) => f.name).join(' | ')}`,
)
process.exit(failed.length === 0 ? 0 : 1)
