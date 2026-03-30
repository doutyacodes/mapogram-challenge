const mysql = require('mysql2/promise');

async function checkID() {
  const c = await mysql.createConnection({
    host: '68.178.163.247', 
    user:'devuser_mapogram_challenges', 
    database:'devuser_mapogram_challenges', 
    password:'devuser_mapogram_challenges', 
    port: 3306
  });

  try {
    const [rows] = await c.execute(`SELECT id, name FROM districts WHERE page_id=20000 AND name = 'Kanyakumari'`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    c.end();
  }
}

checkID();
