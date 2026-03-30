const mysql = require('mysql2/promise');

async function fixCenters() {
  const c = await mysql.createConnection({
    host: '68.178.163.247', 
    user:'devuser_mapogram_challenges', 
    database:'devuser_mapogram_challenges', 
    password:'devuser_mapogram_challenges', 
    port: 3306
  });

  try {
    const [rows] = await c.execute('SELECT id, name, geojson FROM districts WHERE page_id=20000');
    console.log(`Fixing ${rows.length} district centers...`);

    for (const dist of rows) {
      if (!dist.geojson) continue;
      
      let geo = typeof dist.geojson === 'string' ? JSON.parse(dist.geojson) : dist.geojson;
      
      // Simple centroid calculation for Polygon/MultiPolygon
      let coords = [];
      if (geo.type === 'Polygon') {
        coords = geo.coordinates[0];
      } else if (geo.type === 'MultiPolygon') {
        coords = geo.coordinates[0][0]; // Take first ring of first polygon
      }

      if (coords.length > 0) {
        let sumLat = 0, sumLng = 0;
        for (const pt of coords) {
          sumLng += pt[0];
          sumLat += pt[1];
        }
        let lat = sumLat / coords.length;
        let lng = sumLng / coords.length;

        console.log(`Updating ${dist.name}: ${lat}, ${lng}`);
        await c.execute(
          'UPDATE districts SET latitude = ?, longitude = ? WHERE id = ?',
          [lat.toFixed(7), lng.toFixed(7), dist.id]
        );
      }
    }
    console.log("CENTERS FIXED.");
  } catch (err) {
    console.error(err);
  } finally {
    c.end();
  }
}

fixCenters();
