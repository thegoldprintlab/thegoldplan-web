import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext()
const p = await ctx.newPage()
const all = []
p.on('request', r => all.push(r.url().slice(0,100)))
p.on('requestfailed', r => console.log('FAILED:', r.url().slice(0,100), r.failure()?.errorText))
await p.goto('http://localhost:4173/', { waitUntil:'networkidle' })
await p.waitForTimeout(800)
await p.getByRole('button', { name: 'Accept' }).click()
await p.waitForTimeout(4000)
console.log('--- semua request mengandungi tagmanager/google-analytics ---')
all.filter(u=>/tagmanager|google-analytics|analytics\.google/.test(u)).forEach(u=>console.log('  ',u))
console.log('--- jumlah request ---', all.length)
console.log('--- GA id yang dipakai dalam build ---')
console.log(await p.evaluate(()=> {
  return (window.dataLayer||[]).map(a=>Array.from(a)).filter(a=>a[0]==='config').map(a=>a[1])
}))
await b.close()
