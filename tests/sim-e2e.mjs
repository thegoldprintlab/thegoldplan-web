import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:4178'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(`${BASE}/app/sim?demo=1`, { waitUntil: 'networkidle' })
await page.waitForTimeout(5000)

// 1) Data disahkan dimuatkan
const h1 = (await page.locator('h1').first().textContent())?.trim()
const sub = (await page.locator('.page-head p').first().textContent())?.trim()
console.log('h1:', h1)
console.log('sub:', sub)

// 2) replay 16x, buy, tunggu SL/TP
await page.locator('.seg-btn', { hasText: '16×' }).first().click()
await page.fill('#sim-lots', '0.2')
await page.click('.sim-more')
await page.fill('#sim-sl', '6')
await page.fill('#sim-tp', '9')
await page.locator('.sim-btn.buy').click()
await page.locator('.sim-toolbar button', { hasText: 'Play' }).first().click()
await page.waitForTimeout(12000)
const stillPlaying = await page.locator('.sim-toolbar button', { hasText: 'Pause' }).count()
if (stillPlaying) await page.locator('.sim-toolbar button', { hasText: 'Pause' }).first().click()

await page.locator('.seg-btn', { hasText: 'History' }).first().click()
const rows = await page.locator('.sim-positions tbody tr').count()
console.log('history rows:', rows)
for (let i = 0; i < Math.min(rows, 3); i++) {
  console.log('  ', (await page.locator('.sim-positions tbody tr').nth(i).innerText()).replace(/\n/g, ' | '))
}

// 3) save session (localStorage path)
await page.locator('button', { hasText: 'Save session' }).first().click()
await page.waitForTimeout(900)
console.log('savedMsg:', (await page.locator('.sim-alert').first().textContent())?.trim())
const ls = await page.evaluate(() => JSON.parse(localStorage.getItem('gp-sim-sessions') || '[]').length)
console.log('localStorage sessions:', ls)
const savedPanel = await page.locator('.sim-saved').count()
console.log('saved panel visible:', savedPanel > 0)
if (savedPanel) {
  await page.locator('.sim-saved > summary').click()
  console.log('saved row:', (await page.locator('.sim-saved tbody tr').first().innerText()).replace(/\n/g, ' | '))
}

// 4) tukar TF kekal kedudukan
for (const tf of ['M1', 'M5', 'H1', 'H4', 'M15']) {
  await page.locator('.seg-btn', { hasText: new RegExp(`^${tf}$`) }).first().click()
  await page.waitForTimeout(700)
  const p = (await page.locator('.sim-price').textContent())?.trim()
  const cl = (await page.locator('.sim-clock').textContent())?.trim()
  console.log(`TF ${tf} -> price ${p} clock ${cl}`)
}

// 5) reset & random month
await page.locator('button', { hasText: 'Random month' }).first().click()
await page.waitForTimeout(3500)
console.log('after random month:', (await page.locator('.sim-clock').textContent())?.trim(), (await page.locator('.sim-price').textContent())?.trim())

await page.screenshot({ path: '/tmp/sim-final.png' })
console.log('\nERRORS:', errors.length ? JSON.stringify(errors.slice(0, 4)) : 'none')
await browser.close()
