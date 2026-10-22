// e2e_pay_path.mjs — dalam demo, berapa klik untuk jumpa jalan bayar?
import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const p = await ctx.newPage()

await p.goto('https://thegoldplan.my/app?demo=1', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
console.log('URL demo:', p.url())
const body = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
console.log('ada "Preview"/"Demo" banner?:', /preview|demo/i.test(body))
console.log('nav:', (await p.locator('nav a, header a, aside a').allTextContents()).join(' | '))

// Pergi Account
await p.goto('https://thegoldplan.my/app/account', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const acc = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
console.log('\n--- ACCOUNT (demo) ---')
console.log(acc.slice(0, 600))
console.log('\nada harga/bayar?:', /\$19|\$149|upgrade|subscribe|billing|pricing/i.test(acc))
console.log('button:', (await p.locator('button').allTextContents()).map((s) => s.trim()).filter(Boolean).join(' | '))
console.log('links :', (await p.locator('a').evaluateAll((as) => as.map((a) => `${(a.textContent||'').trim().slice(0,22)}→${a.getAttribute('href')}`))).join(' | '))
await p.screenshot({ path: '/tmp/shot_account.png', fullPage: true })
await b.close()
