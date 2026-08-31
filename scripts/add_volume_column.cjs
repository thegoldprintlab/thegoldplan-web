const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.gtblmwijohoetczqngpr',
    password: 'K4Ka4wkAPFLFgAgu',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  console.log('connected');

  const r = await client.query(
    `ALTER TABLE public.trades
     ADD COLUMN IF NOT EXISTS volume numeric(12,2)`
  );
  console.log('column volume ready');

  const v = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema='public' AND table_name='trades' ORDER BY ordinal_position`
  );
  console.log('columns:', v.rows.map(x => x.column_name).join(', '));

  await client.end();
  console.log('done');
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
