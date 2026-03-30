const mysql = require('mysql2/promise');

async function checkChallenges() {
  const c = await mysql.createConnection({
    host: '68.178.163.247', 
    user:'devuser_mapogram_challenges', 
    database:'devuser_mapogram_challenges', 
    password:'devuser_mapogram_challenges', 
    port: 3306
  });

  try {
    const [rows] = await c.execute(`SELECT id, title, district_id FROM challenges WHERE page_id=20000 LIMIT 5`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    c.end();
  }
}

checkChallenges();
