import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:4177'
const out = []

async function log(...a) {
  console.log(...a)
  out.push(a.join(' '))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

// Demi test: laluan /app perlu sesi Supabase. Guna ?demo=1 yang dah sedia ada.
await page.goto(`${BASE}/app?demo=1`, { waitUntil: 'networkidle' })
await log('landing/login url:', page.url())

// Klik nav Simulator
const navLink = page.locator('a.nav-link', { hasText: 'Simulator' })
if (await navLink.count()) {
  await navLink.first().click()
} else {
  await page.goto(`${BASE}/app/sim?demo=1`, { waitUntil: 'networkidle' })
}
await page.waitForTimeout(6000)
await log('url:', page.url())
await log('h1:', (await page.locator('h1').first().textContent())?.trim())
await log('canvas count:', await page.locator('.sim-chart-canvas canvas').count())

// Data-driven checks
const priceTxt = (await page.locator('.sim-price').textContent())?.trim()
await log('price:', priceTxt)
const clock = (await page.locator('.sim-clock').textContent())?.trim()
await log('clock:', clock)

// Play 8x untuk beberapa detik
const btn8 = page.locator('.seg-btn', { hasText: '8×' })
if (await btn8.count()) await btn8.first().click()
const playBtn = page.locator('.sim-toolbar button', { hasText: 'Play' })
await playBtn.first().click()
await page.waitForTimeout(5000)
const clock2 = (await page.locator('.sim-clock').textContent())?.trim()
await log('clock after play:', clock2)
await page.locator('.sim-toolbar button', { hasText: 'Pause' }).first().click()

// Order: set 1 lot, SL 5, TP 10, tekan BUY
await page.fill('#sim-lots', '1')
await page.click('.sim-more')
await page.fill('#sim-sl', '5')
await page.fill('#sim-tp', '10')
await page.click('.sim-btn.buy')
await page.waitForTimeout(400)
await log('open positions rows:', await page.locator('.sim-positions tbody tr').count())
await log('account block:', (await page.locator('.sim-acct').innerText()).replace(/\n/g, ' | '))

// Main laju untuk SL/TP trigger
await page.locator('.seg-btn', { hasText: '16×' }).first().click()
await page.locator('.sim-toolbar button', { hasText: 'Play' }).first().click()
await page.waitForTimeout(9000)
await page.locator('.sim-toolbar button', { hasText: 'Pause' }).first().click()
await page.click('.seg-btn:has-text("History")')
await page.waitForTimeout(300)
const histRows = await page.locator('.sim-positions tbody tr').count()
await log('history rows after play:', histRows)
if (histRows > 0) {
  await log('first history row:', (await page.locator('.sim-positions tbody tr').first().innerText()).replace(/\n/g, ' | '))
}

// Tukar timeframe ke H1
await page.locator('.seg-btn', { hasText: 'H1' }).first().click()
await page.waitForTimeout(1500)
await log('after H1, price:', (await page.locator('.sim-price').textContent())?.trim())

// Screenshot
await page.screenshot({ path: '/tmp/sim-desktop.png', fullPage: false })

// Mobile
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } })
mob.on('pageerror', (e) => errors.push('MOB PAGEERROR: ' + e.message))
await mob.goto(`${BASE}/app/sim?demo=1`, { waitUntil: 'networkidle' })
await mob.waitForTimeout(6000)
await mob.screenshot({ path: '/tmp/sim-mobile.png' })
await log('mobile h1:', (await mob.locator('h1').first().textContent())?.trim())
await log('mobile canvas:', await mob.locator('.sim-chart-canvas canvas').count())

await log('\nERRORS:', errors.length ? JSON.stringify(errors, null, 1) : 'none')
await browser.close()
