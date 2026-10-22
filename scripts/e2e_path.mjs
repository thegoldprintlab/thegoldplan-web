// e2e_path.mjs — laluan: demo → adakah pelawat nampak jalan untuk bayar?
import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const p = await ctx.newPage()

console.log('--- A. Dari landing, klik "Try demo" ---')
await p.goto('https://thegoldplan.my/', { waitUntil: 'networkidle' })
await p.locator('a', { hasText: 'Try demo' }).first().click()
await p.waitForLoadState('networkidle')
await p.waitForTimeout(1200)
console.log('URL:', p.url())

const demoLinks = await p.locator('a').evaluateAll((as) =>
  as.map((a) => `${(a.textContent || '').trim().slice(0, 26)} → ${a.getAttribute('href')}`))
console.log('PAUTAN dalam demo:')
demoLinks.forEach((l) => console.log('   ', l))

const demoBtns = await p.locator('button').allTextContents()
console.log('BUTANG:', demoBtns.map((s) => s.trim()).filter(Boolean).join(' | '))

// Adakah perkataan harga/bayar muncul dalam demo?
const t = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
console.log('sebut harga/$:', /pricing|\$19|\$149|upgrade|subscribe|billing/i.test(t))
console.log('banner demo?:', /demo/i.test(t))

console.log('\n--- B. Sign-up form ---')
await p.goto('https://thegoldplan.my/app', { waitUntil: 'networkidle' })
await p.locator('button', { hasText: 'Sign up' }).first().click()
await p.waitForTimeout(1000)
console.log('inputs:', await p.locator('input').count())
console.log('labels:', (await p.locator('label').allTextContents()).join(' | '))
console.log('buttons:', (await p.locator('button').allTextContents()).map((s) => s.trim()).filter(Boolean).join(' | '))
console.log('kata kunci:', /confirm|verify|password|strength|required/i.test(await p.locator('body').innerText()))
await p.screenshot({ path: '/tmp/shot_demo.png' })
await b.close()
console.log('\nDONE')
