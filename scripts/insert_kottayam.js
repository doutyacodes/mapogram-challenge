const mysql = require('mysql2/promise');

const data = [
  // PLACES
  { title: "Kumarakom Bird Sanctuary", desc: "A paradise for bird watchers, situated on the banks of Vembanad Lake.", cat: "Places", lat: 9.6267, lng: 76.4258 },
  { title: "Vembanad Lake", desc: "The longest lake in India, perfect for houseboat tourism and scenic views.", cat: "Places", lat: 9.6105, lng: 76.3884 },
  { title: "Marmala Waterfall", desc: "A serene hidden waterfall surrounded by lush green rubber estates.", cat: "Places", lat: 9.6918, lng: 76.8483 },
  { title: "Thirunakkara Mahadeva Temple", desc: "Famous Shiva temple built in Kerala architectural style dating back 500 years.", cat: "Places", lat: 9.5843, lng: 76.5192 },
  { title: "Vaikom Mahadeva Temple", desc: "One of the most revered Shiva shrines in South India with a rich history.", cat: "Places", lat: 9.7483, lng: 76.3980 },
  { title: "Pathiramanal Island", desc: "A beautiful island acting as a haven for hundreds of rare migratory birds.", cat: "Places", lat: 9.6186, lng: 76.3880 },
  { title: "Illikkal Kallu", desc: "A monolithic rock structure rising 3400 ft above sea level offering breathtaking views.", cat: "Places", lat: 9.7225, lng: 76.9015 },
  { title: "Ettumanoor Mahadeva Temple", desc: "Known for its exquisite murals and the Ezharaponnana festival.", cat: "Places", lat: 9.6732, lng: 76.5594 },
  { title: "Elaveezhapoonchira", desc: "A valley where leaves never fall, spectacular during the monsoon.", cat: "Places", lat: 9.8164, lng: 76.8190 },
  { title: "Bay Island Driftwood Museum", desc: "A unique museum displaying root sculptures found in the Bay of Bengal.", cat: "Places", lat: 9.6231, lng: 76.4385 },

  // FOOD
  { title: "Karimeen Pollichathu", desc: "Authentic Pearl Spot fish marinated with spices and baked in banana leaves.", cat: "Food", lat: 9.6210, lng: 76.4210 },
  { title: "Kallappam & Meen Curry", desc: "Traditional Kerala toddy-fermented appam with spicy red fish curry.", cat: "Food", lat: 9.5820, lng: 76.5200 },
  { title: "Kuttanad Beef Roast", desc: "Fiery beef roast prepared with roasted coconut slices at a local toddy shop.", cat: "Food", lat: 9.4800, lng: 76.4600 },
  { title: "Houseboat Duck Mappas", desc: "Delicious duck cooked in rich coconut milk gravy on a backwater cruise.", cat: "Food", lat: 9.6120, lng: 76.3850 },
  { title: "Puttu and Kadala Curry", desc: "The ultimate Kerala breakfast: steamed rice cake with black chickpea curry.", cat: "Food", lat: 9.5850, lng: 76.5100 },
  { title: "Kottayam Style Chicken Stew", desc: "Mild and creamy chicken stew cooked with coconut milk and whole spices.", cat: "Food", lat: 9.5900, lng: 76.5200 },
  { title: "Kappa and Meen Vattichathu", desc: "Boiled tapioca served with super spicy red fish curry, a local staple.", cat: "Food", lat: 9.5780, lng: 76.5150 },
  { title: "Authentic Kerala Sadya", desc: "A magnificent vegetarian feast served on a banana leaf with 20+ items.", cat: "Food", lat: 9.5810, lng: 76.5230 },
  { title: "Chatti Choru", desc: "Mixed rice with curries, fish fry, and beef roast served in a clay pot.", cat: "Food", lat: 9.5750, lng: 76.5300 },
  { title: "Pothichoru", desc: "Nostalgic lunch packed in a wilted banana leaf with rice and curries.", cat: "Food", lat: 9.5720, lng: 76.5280 },

  // EVENTS
  { title: "Vaikom Ashtami Festival", desc: "A legendary twelve-day temple festival showcasing grand elephant processions.", cat: "Events", lat: 9.7480, lng: 76.3980 },
  { title: "Kumarakom Boat Race", desc: "The thrilling Sree Narayana Jayanthi Boat Race in the backwaters.", cat: "Events", lat: 9.6100, lng: 76.4200 },
  { title: "Thirunakkara Arattu", desc: "A magnificent 10-day cultural festival featuring Kathakali performances.", cat: "Events", lat: 9.5840, lng: 76.5190 },
  { title: "Erumeli Petta Thullal", desc: "A vibrant ritualistic mass dance linked to the Sabarimala pilgrimage.", cat: "Events", lat: 9.4440, lng: 76.8650 },
  { title: "Ettumanoor Ezharaponnana", desc: "The grand procession featuring the legendary seven-and-a-half golden elephants.", cat: "Events", lat: 9.6730, lng: 76.5590 },
  { title: "Kottayam Food Festival", desc: "Annual culinary fest celebrating central Kerala's distinct cuisine.", cat: "Events", lat: 9.5800, lng: 76.5200 },
  { title: "CMS College Cultural Fest", desc: "One of the state's oldest colleges hosting a vibrant youth festival.", cat: "Events", lat: 9.5910, lng: 76.5210 },
  { title: "International Book Fair", desc: "Kottayam's celebration of literature, honoring its title as the City of Letters.", cat: "Events", lat: 9.5850, lng: 76.5250 },
  { title: "Monsoon Tourism Carnival", desc: "A lively celebration of the romantic Kerala monsoon season.", cat: "Events", lat: 9.6200, lng: 76.4300 },
  { title: "Kottayam Art Biennale", desc: "A localized showcase of contemporary art and traditional murals.", cat: "Events", lat: 9.5700, lng: 76.5100 },

  // ACTIVITY
  { title: "Vembanad Houseboat Cruise", desc: "Sail gracefully through the tranquil backwaters on a traditional Kettuvallam.", cat: "Activity", lat: 9.6100, lng: 76.4000 },
  { title: "Illikkal Kallu Monsoon Trek", desc: "A daring hike to the half-rock mountain peak amidst thick fog.", cat: "Activity", lat: 9.7220, lng: 76.9010 },
  { title: "Pathiramanal Birding Trek", desc: "Walk through the small island to spot rare Siberian migratory birds.", cat: "Activity", lat: 9.6180, lng: 76.3880 },
  { title: "Kumarakom Canoe Ride", desc: "Navigate the narrow, intimate backwater canals interacting with local life.", cat: "Activity", lat: 9.6250, lng: 76.4200 },
  { title: "Meenachil River Rafting", desc: "An exciting bamboo raft ride downstream the famous Meenachil river.", cat: "Activity", lat: 9.5900, lng: 76.5100 },
  { title: "Vagamon Pine Forest Walk", desc: "A serene stroll through the towering artificial pine forests.", cat: "Activity", lat: 9.6800, lng: 76.9000 },
  { title: "Marmala Waterfall Dip", desc: "A refreshing swim in the crystal clear cold waters of Marmala.", cat: "Activity", lat: 9.6910, lng: 76.8480 },
  { title: "Kottayam Heritage Walk", desc: "A guided walking tour tracking the city's rich Syrian Christian heritage.", cat: "Activity", lat: 9.5800, lng: 76.5200 },
  { title: "Paddy Field Photography", desc: "An early morning photography excursion through Endless Kuttanad green fields.", cat: "Activity", lat: 9.5500, lng: 76.4500 },
  { title: "Toddy Tapping Experience", desc: "Watch local experts climb coconut trees and extract fresh sweet toddy.", cat: "Activity", lat: 9.5100, lng: 76.4000 },

  // CHALLENGES
  { title: "Capture 5 Unique Bird Species", desc: "Photograph 5 unique migratory species at the Kumarakom sanctuary.", cat: "Challenges", lat: 9.6260, lng: 76.4250 },
  { title: "Illikkal Kallu Summit Challenge", desc: "Trek to the very top and capture a video of the Western Ghats panorama.", cat: "Challenges", lat: 9.7220, lng: 76.9010 },
  { title: "The Toddy Shop Spice Challenge", desc: "Eat a full serving of super spicy Kuttanad Duck Roast without drinking water!", cat: "Challenges", lat: 9.5500, lng: 76.5000 },
  { title: "Temple Architecture Hunt", desc: "Find and photograph the oldest mural painting inside Thirunakkara Temple.", cat: "Challenges", lat: 9.5840, lng: 76.5190 },
  { title: "5km Endurance Kayaking", desc: "Complete the designated 5km kayaking circuit in the backwaters in under 1 hour.", cat: "Challenges", lat: 9.6250, lng: 76.4200 },
  { title: "Driftwood Identification", desc: "Successfully identify and name 3 unique root sculptures at the Bay Island museum.", cat: "Challenges", lat: 9.6230, lng: 76.4380 },
  { title: "Perfect Sunset Shot", desc: "Capture the perfect golden hour reflection on the waters of Vembanad Lake.", cat: "Challenges", lat: 9.6100, lng: 76.3880 },
  { title: "The Big Kerala Sadya Challenge", desc: "Finish a traditional 28-item Sadya entirely by yourself. Clean leaf required!", cat: "Challenges", lat: 9.5810, lng: 76.5230 },
  { title: "Elaveezhapoonchira Peak Ascent", desc: "Reach the viewpoint valley without using any motorized transport for the last 2km.", cat: "Challenges", lat: 9.8160, lng: 76.8190 },
  { title: "Market Negotiation", desc: "Buy three different local spices from Kottayam market keeping it under 200 Rs.", cat: "Challenges", lat: 9.5820, lng: 76.5220 }
];

async function insertData() {
  const c = await mysql.createConnection({
    host: '68.178.163.247', 
    user:'devuser_mapogram_challenges', 
    database:'devuser_mapogram_challenges', 
    password:'devuser_mapogram_challenges', 
    port: 3306
  });

  try {
    for (const item of data) {
      // 1. Insert into challenges
      const [res] = await c.execute(
        `INSERT INTO challenges (title, description, category, latitude, longitude, address, district_id, page_id, is_active, entry_points, reward_points, radius_meters)
         VALUES (?, ?, ?, ?, ?, ?, 10008, 10000, 1, 0, 50, 30)`,
        [item.title, item.desc, item.cat, item.lat, item.lng, 'Kottayam, Kerala']
      );
      
      const insertId = res.insertId;

      // 2. Map Media generic placeholder based on cat
      let imageUrl = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=600";
      if(item.cat === 'Food') imageUrl = "https://images.unsplash.com/photo-1626074964648-8df09dd55416?auto=format&fit=crop&w=600&q=80";
      if(item.cat === 'Events') imageUrl = "https://images.unsplash.com/photo-1533174000273-e116ad1febee?auto=format&fit=crop&w=600&q=80";
      if(item.cat === 'Challenges') imageUrl = "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80";

      await c.execute(
        `INSERT INTO challenge_media (challenge_id, media_type, media_url, created_at) VALUES (?, 'image', ?, NOW())`,
        [insertId, imageUrl]
      );
    }
    console.log("SUCCESSFULLY INSERTED 50 RECORDS FOR KOTTAYAM");
  } catch (err) {
    console.error(err);
  } finally {
    c.end();
  }
}

insertData();
