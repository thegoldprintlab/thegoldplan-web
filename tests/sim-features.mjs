import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:4186'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1500, height: 980 } })
const errs = []
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message))

await p.goto(`${BASE}/app/sim?demo=1`, { waitUntil: 'networkidle' })
await p.waitForTimeout(5000)
const acc = p.locator('button', { hasText: 'Accept' })
if (await acc.count()) await acc.first().click()

// English check
const body = await p.locator('.sim').innerText()
const malay = ['Sesi', 'Balik', 'Tiada', 'Belum', 'Memuatkan', 'Bulan', 'Sembunyi', 'jarak harga', 'ditutup']
console.log('Malay leftovers:', malay.filter((w) => body.includes(w)))

// open settings
await p.locator('button', { hasText: 'Chart settings' }).click()
await p.waitForTimeout(400)
console.log('panel open:', await p.locator('.sim-settings').count())

// enable every indicator
for (const label of ['SMA', 'EMA', 'Bollinger Bands', 'RSI', 'Prev day high / low']) {
  const row = p.locator('.sim-toggle', { hasText: label })
  if (await row.count()) await row.first().click()
}
await p.waitForTimeout(1500)
console.log('active indicators:', (await p.locator('.sim-chart-active-ind').textContent())?.trim())

// panel tutup sebelum klik carta (ia overlay)
await p.locator('.sim-settings-head button').click()
await p.waitForTimeout(300)

// chart type bars
await p.locator('button', { hasText: 'Chart settings' }).click()
await p.waitForTimeout(300)
await p.locator('.seg-btn', { hasText: 'Bars' }).first().click()
await p.waitForTimeout(900)
console.log('after Bars, canvas:', await p.locator('.sim-chart-canvas canvas').count())

// drawing tool: horizontal line
await p.locator('.sim-tool').nth(1).click()   // hray
await p.waitForTimeout(300)
await p.locator('.sim-settings-head button').click()
await p.waitForTimeout(300)
const stage = p.locator('.sim-chart-overlay')
const box = await stage.boundingBox()
await p.mouse.click(box.x + 300, box.y + 160)
await p.waitForTimeout(400)
// trend line needs two clicks
await p.locator('button', { hasText: 'Chart settings' }).click()
await p.waitForTimeout(300)
await p.locator('.sim-tool').nth(3).click()
await p.waitForTimeout(200)
await p.locator('.sim-settings-head button').click()
await p.waitForTimeout(300)
await p.mouse.click(box.x + 340, box.y + 200)
await p.waitForTimeout(200)
await p.mouse.click(box.x + 520, box.y + 120)
await p.waitForTimeout(400)
await p.screenshot({ path: '/tmp/sim-ind.png' })

// verify objects persisted in panel text
await p.locator('button', { hasText: 'Chart settings' }).click()
await p.waitForTimeout(300)
console.log('objects note:', (await p.locator('.sim-note').last().textContent())?.trim())

// replay + order to ensure engine still fine
await p.locator('button', { hasText: 'Chart settings' }).click()
await p.waitForTimeout(300)
await p.locator('.sim-tool').first().click()  // cursor
await p.locator('.seg-btn', { hasText: 'Candles' }).first().click()
await p.locator('.sim-settings-head button').click()
await p.waitForTimeout(400)

await p.locator('.seg-btn', { hasText: 'Candles' }).first().click().catch(()=>{})
await p.waitForTimeout(600)
await p.locator('.sim-btn.buy').click()
await p.locator('.seg-btn', { hasText: '16×' }).first().click()
await p.locator('.sim-toolbar button', { hasText: 'Play' }).first().click()
await p.waitForTimeout(9000)
if (await p.locator('.sim-toolbar button', { hasText: 'Pause' }).count())
  await p.locator('.sim-toolbar button', { hasText: 'Pause' }).first().click()
await p.locator('.seg-btn', { hasText: 'History' }).first().click()
console.log('history rows:', await p.locator('.sim-positions tbody tr').count())

console.log('ERRORS:', errs.length ? JSON.stringify(errs.slice(0, 4)) : 'none')
await b.close()
