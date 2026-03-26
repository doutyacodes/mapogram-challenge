const mysql = require('mysql2/promise');

async function run() {
  console.log("-> Starting Database Unification and Precise GeoJSON injection...");
  
  const connection = await mysql.createConnection({
    host: "68.178.163.247",
    user: "devuser_mapogram_challenges",
    database: "devuser_mapogram_challenges",
    password: "devuser_mapogram_challenges",
    port: "3306",
  });

  try {
    // 1. Structural Unification commands (from final_state_unification.sql)
    console.log("-> Running structural unification (mapping districts and challenges to States)...");
    
    // We execute these manually to ensure sequence execution
    const q1 = `INSERT IGNORE INTO \`pages\` (\`id\`, \`user_id\`, \`name\`, \`username\`, \`page_type_id\`, \`created_at\`) VALUES 
      (10000, 1, 'Kerala', 'kerala_tourism', NULL, NOW()),
      (20000, 1, 'Karnataka', 'karnataka_tourism', NULL, NOW()),
      (30000, 1, 'Tamil Nadu', 'tamil_nadu_tourism', NULL, NOW()),
      (40000, 1, 'Andhra Pradesh', 'andhra_tourism', NULL, NOW()),
      (50000, 1, 'Telangana', 'telangana_tourism', NULL, NOW());`;
    await connection.execute(q1);

    const qs = [
      `UPDATE \`districts\` SET \`page_id\` = 10000 WHERE \`id\` BETWEEN 10001 AND 10014;`,
      `UPDATE \`districts\` SET \`page_id\` = 20000 WHERE \`id\` BETWEEN 10015 AND 10044;`,
      `UPDATE \`districts\` SET \`page_id\` = 40000 WHERE \`id\` BETWEEN 10045 AND 10057;`,
      `UPDATE \`districts\` SET \`page_id\` = 50000 WHERE \`id\` BETWEEN 10058 AND 10088;`,
      `UPDATE \`districts\` SET \`page_id\` = 30000 WHERE \`id\` = 10089;`,
      `UPDATE \`districts\` SET \`page_id\` = 10000 WHERE \`page_id\` NOT IN (10000, 20000, 30000, 40000, 50000);`,
      `UPDATE \`challenges\` c JOIN \`districts\` d ON c.district_id = d.id SET c.page_id = d.page_id;`,
      `UPDATE \`rewards\` r JOIN \`challenges\` c ON r.challenge_id = c.id SET r.page_id = c.page_id;`,
      `UPDATE \`stores\` s JOIN \`challenge_stores\` cs ON s.id = cs.store_id JOIN \`challenges\` c ON cs.challenge_id = c.id SET s.page_id = c.page_id;`,
      `DELETE FROM \`pages\` WHERE \`id\` > 10000 AND \`id\` NOT IN (10000, 20000, 30000, 40000, 50000);`,
      `DELETE FROM \`page_geofences\` WHERE \`page_id\` > 10000 AND \`page_id\` NOT IN (10000, 20000, 30000, 40000, 50000);`
    ];

    for (const q of qs) {
      await connection.execute(q);
    }
    console.log("-> Unification queries completed natively!");

    // 2. Fetch and Inject PRECISE Kerala GeoJSON
    console.log("-> Fetching ultra-precise Kerala District Boundaries from Github...");
    
    const response = await fetch("https://raw.githubusercontent.com/geohacker/kerala/master/geojsons/district.geojson");
    if (!response.ok) {
        throw new Error("Failed to download GeoJSON shapefile.");
    }
    
    const geojsonData = await response.json();
    let updatedCount = 0;

    for (const feature of geojsonData.features) {
      let districtName = feature.properties.DISTRICT;
      
      // Update the precise shape recursively
      const [res] = await connection.execute(
        `UPDATE \`districts\` SET \`geojson\` = ? WHERE \`name\` = ? OR (\`name\` = 'Kochi' AND ? = 'Ernakulam')`,
        [JSON.stringify(feature.geometry), districtName, districtName]
      );
      
      if (res.affectedRows > 0) {
        updatedCount++;
      }
    }

    console.log(`-> Successfully injected ${updatedCount} precise high-res borders into the districts table!`);

  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await connection.end();
    console.log("-> Done.");
  }
}

run();
