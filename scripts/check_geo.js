const mysql = require('mysql2/promise');

async function checkGeo() {
  const c = await mysql.createConnection({
    host: '68.178.163.247', 
    user:'devuser_mapogram_challenges', 
    database:'devuser_mapogram_challenges', 
    password:'devuser_mapogram_challenges', 
    port: 3306
  });

  try {
    const [rows] = await c.execute(`SELECT name, JSON_TYPE(geojson) as g_type, SUBSTRING(geojson, 1, 500) as g_start FROM districts WHERE id=10101`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    c.end();
  }
}

checkGeo();
