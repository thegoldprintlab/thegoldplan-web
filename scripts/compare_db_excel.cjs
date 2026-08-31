const { Client } = require('pg');
const json = require('/tmp/mt5_final_parsed.json');

// Correct mapping: file "cent" = Cent (223099097), "10k" = Prop 10k, "5k" = Prop 5k
const MAP = { cent: 'Cent', '10k': 'Prop 10k', '5k': 'Prop 5k' };

async function main() {
  const client = new Client({
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.gtblmwijohoetczqngpr',
    password: 'K4Ka4wkAPFLFgAgu',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // DB current per account
  const db = await client.query(
    `SELECT account, COUNT(*)::int n, COALESCE(SUM(profit_loss),0)::float pnl
     FROM public.trades WHERE user_id='35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3'
     GROUP BY account ORDER BY account`
  );
  console.log('DB current:');
  for (const r of db.rows) console.log(`  ${r.account}: ${r.n} trades, ${r.pnl.toFixed(2)}`);

  console.log('\nExcel report (correct mapping):');
  let totalN = 0, totalP = 0;
  for (const [file, account] of Object.entries(MAP)) {
    const deals = json[file].deals;
    const net = deals.reduce((a,d)=>a+Number(d.profit)+Number(d.commission)+Number(d.swap),0);
    console.log(`  ${account} (${file}.xlsx): ${deals.length} trades, ${net.toFixed(2)}`);
    totalN += deals.length;
    totalP += net;
  }
  console.log(`  TOTAL: ${totalN} trades, ${totalP.toFixed(2)}`);

  await client.end();
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
