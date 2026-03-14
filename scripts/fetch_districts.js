const fs = require('fs');
const path = require('path');

const KERALA_DISTRICTS = [
  "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", 
  "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
];

const KARNATAKA_DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", 
  "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", 
  "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", 
  "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", "Vijayanagara"
];

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", 
  "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", 
  "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", 
  "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", 
  "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchDistrictGeojson(stateName, districtName) {
  const url = `https://nominatim.openstreetmap.org/search?state=${encodeURIComponent(stateName)}&county=${encodeURIComponent(districtName)}&country=India&format=json&polygon_geojson=1&limit=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "MapogramTest/1.0" } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data && data.length > 0 && data[0].geojson) {
      console.log(`Successfully fetched ${districtName}, ${stateName}`);
      return {
        type: "Feature",
        properties: { name: districtName, state: stateName },
        geometry: data[0].geojson
      };
    }
    console.warn(`No geojson found for ${districtName}, ${stateName}`);
    return null;
  } catch (err) {
    console.error(`Error fetching ${districtName}: ${err.message}`);
    return null;
  }
}

async function fetchAll(stateName, districtsList, filename) {
  console.log(`Starting fetching for ${stateName}...`);
  const features = [];
  for (const dist of districtsList) {
    const feature = await fetchDistrictGeojson(stateName, dist);
    if (feature) features.push(feature);
    await delay(1200); // Nominatim requirement: max 1 request per second
  }
  
  const featureCollection = {
    type: "FeatureCollection",
    features: features
  };

  const dir = path.join(__dirname, '../public/geojson');
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(featureCollection));
  console.log(`Saved ${features.length} districts for ${stateName} to ${filename}`);
}

async function run() {
  await fetchAll("Kerala", KERALA_DISTRICTS, "kerala.json");
  await fetchAll("Karnataka", KARNATAKA_DISTRICTS, "karnataka.json");
  await fetchAll("Tamil Nadu", TAMIL_NADU_DISTRICTS, "tamil_nadu.json");
}

run();
