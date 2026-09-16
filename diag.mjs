import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext()
const p = await ctx.newPage()
const reqs = []
p.on('request', r => { if (r.url().includes('google')) reqs.push(r.url().slice(0,90)) })
p.on('console', m => { if (m.text().includes('err') || m.type()==='error') console.log('CONSOLE ERR:', m.text().slice(0,160)) })

await p.goto('http://localhost:4173/', { waitUntil:'networkidle' })
await p.waitForTimeout(1000)
await p.getByRole('button', { name: 'Accept' }).click()
await p.waitForTimeout(3000)

console.log('--- google requests ---')
reqs.forEach(r => console.log('  ', r))
console.log('--- gtag exists? ---', await p.evaluate(()=> typeof window.gtag))
console.log('--- dataLayer dump ---')
console.log(JSON.stringify(await p.evaluate(()=> (window.dataLayer||[]).map(a=>Array.from(a))), null, 1).slice(0,1200))
console.log('--- cookies ---', (await ctx.cookies()).map(c=>c.name).join(',') || '(none)')
await b.close()
