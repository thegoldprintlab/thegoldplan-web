import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'

const ROOT = '/home/mozacsuck48/gold-plan-web/dist'
const PORT = 8901

const server = spawn('node', ['/tmp/spa_server.mjs', String(PORT), ROOT], { stdio: 'ignore', detached: true })
server.unref()
await wait(1200)

const browser = await chromium.launch()
const page = await browser.newPage()
let fails = 0
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`)
  if (!cond) fails++
}

try {
  await page.goto(`http://localhost:${PORT}/app?demo=1`, { waitUntil: 'networkidle' })
  check('nav link exists', await page.locator('nav a[href="/app/plan"]').count() === 1)
  await page.goto(`http://localhost:${PORT}/app/plan?demo=1`, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1:has-text("Trading Plan")')
  check('plan page loads', true)

  // demo trades exist, so stats preview should show after generate
  await page.fill('#plan-balance', '1000')
  await page.fill('#plan-target', '20')
  await page.fill('#plan-risk', '1')
  await page.fill('#plan-dd', '10')
  await page.fill('#plan-horizon', '30')
  await page.click('button:has-text("Generate plan")')
  await page.waitForSelector('.plan-result', { timeout: 5000 })
  check('result panel appears', true)

  const verdict = await page.textContent('.plan-result h2')
  check(`verdict shown (${verdict?.trim()})`, !!verdict && verdict.length > 3)

  const pct = await page.textContent('.plan-result .plan-stats-grid .plan-stat-val')
  check(`probability rendered (${pct?.trim()})`, /\d/.test(pct || ''))

  const line = await page.textContent('.plan-sheet-line')
  check('plan sheet line rendered', !!line && line.includes('% risk'))

  // reproducibility in UI: regenerate gives same probability
  const p1 = await page.textContent('.plan-result .plan-stats-grid .plan-stat-val')
  await page.click('button:has-text("Generate plan")')
  await page.waitForTimeout(300)
  const p2 = await page.textContent('.plan-result .plan-stats-grid .plan-stat-val')
  check('deterministic rerun', p1 === p2)
} finally {
  await browser.close()
  process.kill(-server.pid, 'SIGTERM').catch?.(() => {})
  try { process.kill(-server.pid) } catch {}
}
console.log(fails === 0 ? 'ALL CHECKS PASSED' : `${fails} CHECK(S) FAILED`)
process.exit(fails === 0 ? 0 : 1)
