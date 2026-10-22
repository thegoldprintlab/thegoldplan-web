// e2e_signup.mjs — pelawat BARU (context bersih): boleh ke daftar?
import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const p = await ctx.newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)) })
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 140)))

await p.goto('https://thegoldplan.my/app', { waitUntil: 'networkidle', timeout: 45000 })
await p.waitForTimeout(1500)
const txt = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
console.log('URL   :', p.url())
console.log('TEXT  :', txt.slice(0, 300))
console.log('inputs:', await p.locator('input').count(), '| type of first:',
  await p.locator('input').first().getAttribute('type').catch(() => '—'))
const labels = await p.locator('label').allTextContents().catch(() => [])
console.log('labels:', labels.join(' | '))
const btns = await p.locator('button').allTextContents().catch(() => [])
console.log('buttons:', btns.map((s) => s.trim()).filter(Boolean).join(' | '))
// Adakah ada pautan daftar (bukan login)?
const links = await p.locator('a, [role=button], button').allTextContents().catch(() => [])
console.log('semua klik:', links.map((s) => s.trim()).filter(Boolean).join(' | '))
await p.screenshot({ path: '/tmp/shot_signup.png' })
console.log('errors:', errs.slice(0, 5))
await b.close()
