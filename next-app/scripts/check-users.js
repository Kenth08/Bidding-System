require('dotenv').config();
const { Client } = require('pg');

async function main(){
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const res = await client.query('SELECT email, role, status FROM users ORDER BY created_at DESC LIMIT 10');
    console.log('Recent users:');
    console.table(res.rows);
  }catch(e){
    console.error('DB check failed:', e.message);
    process.exit(1);
  }finally{
    await client.end();
  }
}

main();
