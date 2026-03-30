const mysql = require('mysql2/promise');

async function checkCoords() {
  const c = await mysql.createConnection({
    host: '68.178.163.247', 
    user:'devuser_mapogram_challenges', 
    database:'devuser_mapogram_challenges', 
    password:'devuser_mapogram_challenges', 
    port: 3306
  });

  try {
    const [rows] = await c.execute(`
      SELECT name, latitude, longitude 
      FROM districts 
      WHERE page_id=20000 
      AND (name = 'Madurai' OR name = 'Virudhunagar' OR name = 'Kanyakumari')
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    c.end();
  }
}

checkCoords();
