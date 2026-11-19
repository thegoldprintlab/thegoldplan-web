// E2E: simulator refresh mesti sambung sesi lepas, bukan mula baru.
import { chromium } from 'playwright'

const BASE = 'http://localhost:8900'
const results = []
const check = (name, ok, extra = '') =>
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' :: ' + extra : ''}`)

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('pageerror', (e) => results.push('PAGEERROR: ' + e.message))

// 1. Buka demo app, pergi ke Simulator, tunggu data bulan dimuat.
await page.goto(`${BASE}/app?demo=1`, { waitUntil: 'domcontentloaded' })
await page.click('a:has-text("Simulator"), button:has-text("Simulator")', { timeout: 10000 })
await page.waitForFunction(() => {
  const raw = localStorage.getItem('gp-sim-live')
  if (!raw) return false
  try { return JSON.parse(raw).cursor > 0 } catch { return false }
}, null, { timeout: 30000 })
const saved1 = await page.evaluate(() => JSON.parse(localStorage.getItem('gp-sim-live')))
check('autosave written after load', !!saved1, `month=${saved1.month} cursor=${saved1.cursor} tf=${saved1.tf} bal=${saved1.balance}`)

// 2. Majukan cursor dengan butang play beberapa saat.
await page.click('button:has-text("Play")').catch(async () => {
  // fallback: cari aria-label play
  await page.click('[aria-label*="lay" i]').catch(() => results.push('NOTE: play button not found by text'))
})
await page.waitForTimeout(2500)
const saved2 = await page.evaluate(() => JSON.parse(localStorage.getItem('gp-sim-live')))
check('cursor advances while playing', saved2.cursor > saved1.cursor, `${saved1.cursor} -> ${saved2.cursor}`)

// 3. Buka posisi kalau boleh (-ticket) — cuba klik BUY.
let opened = false
try {
  await page.click('button:has-text("BUY"), button:has-text("Buy")', { timeout: 3000 })
  opened = true
  await page.waitForTimeout(500)
} catch { results.push('NOTE: BUY button not found (skip position test)') }

const saved3 = await page.evaluate(() => JSON.parse(localStorage.getItem('gp-sim-live')))
if (opened) check('open position persisted', saved3.positions.length > 0, `${saved3.positions.length} posisi`)

// 4. RELOAD — inilah puncak aduan: sebelum ni mula baru.
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => {
  const raw = localStorage.getItem('gp-sim-live')
  if (!raw) return false
  try { return JSON.parse(raw).cursor > 0 } catch { return false }
}, null, { timeout: 20000 })

// Selepas reload, sesi yang dipulihkan MESTI bulan yang sama & cursor >= saved3.
const after = await page.evaluate(() => JSON.parse(localStorage.getItem('gp-sim-live')))
check('same month after reload (resume, not random)', after.month === saved3.month, `${saved3.month} -> ${after.month}`)
check('cursor not reset to start', after.cursor >= saved3.cursor, `${saved3.cursor} -> ${after.cursor}`)
check('balance restored', Math.abs(after.balance - saved3.balance) < 0.01, `${saved3.balance} -> ${after.balance}`)
if (opened) check('positions restored after reload', after.positions.length === saved3.positions.length, `${after.positions.length}`)

console.log(results.join('\n'))
await browser.close()
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0)
