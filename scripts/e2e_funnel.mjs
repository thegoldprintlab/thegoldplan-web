// e2e_funnel.mjs — uji laluan pelawat di site LIVE.
// Tujuan: sahkan /app?demo=1 benar-benar buka, dan borang daftar wujud & boleh diisi.
// Tidak cipta akaun sebenar — berhenti sebelum submit signup.
import { chromium } from 'playwright'

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const p = await ctx.newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 160)))
p.on('requestfailed', (r) => errs.push('REQFAIL: ' + r.url().slice(0, 90)))

async function check(label, url) {
  errs.length = 0
  const t0 = Date.now()
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => errs.push('NAV: ' + e.message.slice(0, 80)))
  const ms = Date.now() - t0
  const h1 = await p.locator('h1').first().textContent().catch(() => null)
  const bodyTxt = (await p.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ')
  const btns = await p.locator('button, a[role=button]').allTextContents().catch(() => [])
  console.log(`\n=== ${label}  (${ms}ms)  ${url}`)
  console.log('  h1      :', (h1 || '—').trim().slice(0, 90))
  console.log('  words   :', bodyTxt.split(' ').length)
  console.log('  buttons :', btns.map((s) => s.trim()).filter(Boolean).slice(0, 8).join(' | '))
  console.log('  errors  :', errs.length ? errs.slice(0, 3) : 'none')
  return bodyTxt
}

// 1. Halaman SEO baru — adakah CTA demo betul-betul boleh ditekan?
await check('SEO landing', 'https://thegoldplan.my/prop-firm-daily-loss-tracker')
await p.locator('a.btn', { hasText: 'Open the free demo' }).first().click()
await p.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
console.log('  → selepas klik CTA, URL:', p.url())
const afterCta = await p.locator('body').innerText().catch(() => '')
console.log('  → app render?', afterCta.replace(/\s+/g, ' ').slice(0, 140))

// 2. Demo terus
const demo = await check('Demo', 'https://thegoldplan.my/app?demo=1')
console.log('  → ada angka/stat?', /\$|\d+%|Win rate|Profit factor/i.test(demo))

// 3. Skrin daftar
await check('App (gate)', 'https://thegoldplan.my/app')
await p.screenshot({ path: '/tmp/shot_app.png', fullPage: false })

await b.close()
console.log('\nDONE')
