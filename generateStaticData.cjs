const fs = require('fs');
const path = require('path');

const states = [
  { file: 'kerala.json', name: 'Kerala' },
  { file: 'karnataka.json', name: 'Karnataka' },
  { file: 'tamil_nadu.json', name: 'Tamil Nadu' }
];

const STATIC_DISTRICT_DATA = {};

function getRandomPoints() {
  return Math.floor(Math.random() * 500) + 10;
}

function getRandomEntryFee() {
  const fees = ['Free', 'Free', 'Free', '20 points', '50 points', '10 points'];
  return fees[Math.floor(Math.random() * fees.length)];
}

function getRandomRating() {
  return (Math.random() * 1.5 + 3.5).toFixed(1);
}

function getRandomPrice() {
  return '₹' + (Math.floor(Math.random() * 600) + 150);
}

const challengeImages = [
  'https://images.unsplash.com/photo-1618477461853-cf6ed80fbea5?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1596464716127-f2a829d4de30?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800'
];

const placeImages = [
  'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1588693959606-a8fa2390b1e4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1572551532888-ca28ba89f282?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=800'
];

const foodImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1626777553735-48b47ca90695?auto=format&fit=crop&q=80&w=800'
];

const activityImages = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=800'
];

const eventImages = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=800'
];

const hotelNames = ['The Ghatis Restaurant', 'Empire Hotel', 'Grand Hyatt', 'Marriott', 'Paragon', 'Sea Shell Resort', 'Royal Palm', 'Spice Route', 'Kerala Kitchen', 'Southern Spice'];
const dishNames = ['Biryani', 'Mandi', 'Appam & Beef', 'Dosa', 'Seafood Platter', 'Kappa & Meen', 'Parotta & Chicken', 'Sadhya', 'Fish Curry', 'Fried Rice'];

const landmarkNames = ['Museum', 'Old Church', 'Ancient Temple', 'Hill View Point', 'Botanical Garden', 'Waterfall', 'Fort', 'Lighthouse', 'Heritage Walk', 'Craft Village'];

const activityNames = ['Morning Yoga', 'Cycling Tour', 'Backwater Kayaking', 'Football Match', 'Cricket Nets', 'Jungle Trek', 'Bird Watching', 'Cooking Class', 'Spice Walk'];

const eventNames = ['Cultural Fest', 'Food Festival', 'Music Night', 'Tech Meetup', 'Market Fair', 'Film Screening', 'Art Exhibition', 'Traditional Dance'];

const getFakePeople = (type, title) => {
  const userPresets = [
    { name: 'Arjun K.', avatar: 'https://i.pravatar.cc/150?u=arjun', date: '2 hours ago', likes: 24, comments: 5 },
    { name: 'Sneha M.', avatar: 'https://i.pravatar.cc/150?u=sneha', date: '5 hours ago', likes: 18, comments: 2 },
    { name: 'Rahul V.', avatar: 'https://i.pravatar.cc/150?u=rahul', date: 'Yesterday', likes: 42, comments: 12 },
    { name: 'Anjali S.', avatar: 'https://i.pravatar.cc/150?u=anjali', date: '2 days ago', likes: 31, comments: 8 },
    { name: 'Kiran P.', avatar: 'https://i.pravatar.cc/150?u=kiran', date: '3 days ago', likes: 15, comments: 3 },
    { name: 'Meera R.', avatar: 'https://i.pravatar.cc/150?u=meera', date: '4 days ago', likes: 56, comments: 15 }
  ];
  return userPresets.map(u => ({
    ...u,
    certification: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&q=80&w=200',
    description: `completed the ${title}`
  }));
};

const getFakeLeaderboard = () => {
  return [
    { rank: 1, name: 'Rahul V.', points: 1250, avatar: 'https://i.pravatar.cc/150?u=rahul' },
    { rank: 2, name: 'Meera R.', points: 1100, avatar: 'https://i.pravatar.cc/150?u=meera' },
    { rank: 3, name: 'Anjali S.', points: 950, avatar: 'https://i.pravatar.cc/150?u=anjali' },
    { rank: 4, name: 'Arjun K.', points: 880, avatar: 'https://i.pravatar.cc/150?u=arjun' },
    { rank: 5, name: 'Sneha M.', points: 720, avatar: 'https://i.pravatar.cc/150?u=sneha' }
  ];
};

states.forEach(state => {
  const geojsonFile = path.join(__dirname, 'public/geojson', state.file);
  const data = JSON.parse(fs.readFileSync(geojsonFile, 'utf8'));
  
  STATIC_DISTRICT_DATA[state.name] = {};
  
  data.features.forEach((feature, fIndex) => {
    const properties = feature.properties || {};
    const distName = properties.name || properties.district || properties.DISTRICT;
    if (!distName) {
      console.log(`Skipping feature ${fIndex} in ${state.name} (no name)`);
      return;
    }
    
    // console.log(`Processing ${state.name} -> ${distName}...`);
    
    // Robust bounds calculation
    let coords = [];
    if (feature.geometry.type === 'Polygon') {
      coords = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'MultiPolygon') {
      // Flatten all polygons to find absolute bounds
      feature.geometry.coordinates.forEach(poly => {
        coords.push(...poly[0]);
      });
    } else {
      console.log(`Unsupported geometry type ${feature.geometry.type} for ${distName}`);
      return;
    }

    if (!coords || coords.length === 0) {
      console.log(`No coordinates found for ${distName}`);
      return;
    }

    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      center: {
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
        lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
      }
    };

    const generateItems = (category, count) => {
      return Array.from({ length: count }).map((_, i) => {
        let title = '';
        let description = '';
        let tags = [];
        let logo = '';
        let image = '';
        let extra = {};

        switch(category) {
          case 'Challenges':
            title = `Protect ${distName} ${landmarkNames[i % landmarkNames.length]}`;
            description = `Join the community effort to preserve and maintain the ${title}. Participate and earn rewards.`;
            tags = ['Environment', 'Heritage'];
            image = challengeImages[i % challengeImages.length];
            logo = 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png';
            break;
          case 'Places':
            title = `${distName} ${landmarkNames[i % landmarkNames.length]}`;
            description = `A must-visit landmark in ${distName}. Discover its unique architecture and history.`;
            tags = ['Nature', 'Sightseeing'];
            image = placeImages[i % placeImages.length];
            logo = 'https://cdn-icons-png.flaticon.com/512/854/854866.png';
            extra = { distance: (Math.random() * 8 + 1).toFixed(1) + ' km', rating: getRandomRating() };
            break;
          case 'Food':
            const hotel = hotelNames[i % hotelNames.length] + ' ' + (i + 1);
            const dish = dishNames[i % dishNames.length];
            title = hotel;
            description = `Experience the legendary ${dish} of ${distName} at ${hotel}. Prepared with authentic spices.`;
            tags = ['Local Cuisine', 'Food'];
            image = foodImages[i % foodImages.length];
            logo = 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png';
            extra = { foodName: dish, price: getRandomPrice(), rating: getRandomRating(), distance: (Math.random() * 5 + 0.5).toFixed(1) + ' km' };
            break;
          case 'Activity':
            title = `${distName} ${activityNames[i % activityNames.length]}`;
            description = `Join this exciting activity in ${distName}. Perfect for solo or group adventurers.`;
            tags = ['Adventure', 'Outdoor'];
            image = activityImages[i % activityImages.length];
            logo = 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png';
            extra = { duration: (i % 3 + 1) + ' hours' };
            break;
          case 'Events':
            title = `${distName} ${eventNames[i % eventNames.length]}`;
            description = `An upcoming community event in ${distName}. Don't miss this opportunity to connect.`;
            tags = ['Social', 'Community'];
            image = eventImages[i % eventImages.length];
            logo = 'https://cdn-icons-png.flaticon.com/512/2907/2907253.png';
            extra = { date: ['This Sunday', 'Next Week', '25th Oct', 'Coming Friday'][i % 4] };
            break;
        }

        const itemTitle = title;
        return {
          id: `static-${category.toLowerCase()}-${distName}-${i}`,
          title: itemTitle,
          description,
          category,
          tags,
          logo,
          image,
          points: getRandomPoints(),
          entryFee: getRandomEntryFee(),
          prize: '100 Points',
          people: getFakePeople(category, itemTitle),
          leaderboard: getFakeLeaderboard(),
          position: {
            lat: bounds.center.lat + (Math.random() - 0.5) * (bounds.maxLat - bounds.minLat) * 0.7,
            lng: bounds.center.lng + (Math.random() - 0.5) * (bounds.maxLng - bounds.minLng) * 0.7
          },
          ...extra
        };
      });
    };

    const count = distName === 'Kottayam' ? 20 : 10;
    
    STATIC_DISTRICT_DATA[state.name][distName] = {
      'Challenges': generateItems('Challenges', count),
      'Places': generateItems('Places', count),
      'Food': generateItems('Food', count),
      'Activity': generateItems('Activity', count),
      'Events': generateItems('Events', count)
    };
  });
});

const fileContent = "// Auto-generated mock static data for districts\n" +
"export const STATIC_DISTRICT_DATA = " + JSON.stringify(STATIC_DISTRICT_DATA, null, 2) + ";\n";

fs.writeFileSync(path.join(__dirname, 'utils/mockCategoryData.js'), fileContent);
console.log('Successfully generated utils/mockCategoryData.js with high density data');
