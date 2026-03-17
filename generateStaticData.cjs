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
  return Math.random() > 0.5 ? 'Free' : '20 points';
}

function getRandomRating() {
  return (Math.random() * 1.5 + 3.5).toFixed(1);
}

const challengeImages = [
  'https://images.unsplash.com/photo-1618477461853-cf6ed80fbea5?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800'
];

const placeImages = [
  'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1588693959606-a8fa2390b1e4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1572551532888-ca28ba89f282?auto=format&fit=crop&q=80&w=800'
];

const foodImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800'
];

const activityImages = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800'
];

const eventImages = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800'
];
function getRandomPrice() {
  return '₹' + (Math.floor(Math.random() * 400) + 100);
}

states.forEach(state => {
  const geojsonFile = path.join(__dirname, 'public/geojson', state.file);
  const data = JSON.parse(fs.readFileSync(geojsonFile, 'utf8'));
  
  STATIC_DISTRICT_DATA[state.name] = {};
  
  data.features.forEach((feature, idx) => {
    const distName = feature.properties.name || feature.properties.district;
    if (!distName) return;
    
    const getFakePeople = (type, title) => {
      const users = [
        { name: 'Arjun K.', avatar: 'https://i.pravatar.cc/150?u=arjun', date: '2 hours ago', likes: 24, comments: 5 },
        { name: 'Sneha M.', avatar: 'https://i.pravatar.cc/150?u=sneha', date: '5 hours ago', likes: 18, comments: 2 },
        { name: 'Rahul V.', avatar: 'https://i.pravatar.cc/150?u=rahul', date: 'Yesterday', likes: 42, comments: 12 },
        { name: 'Anjali S.', avatar: 'https://i.pravatar.cc/150?u=anjali', date: '2 days ago', likes: 31, comments: 8 },
        { name: 'Kiran P.', avatar: 'https://i.pravatar.cc/150?u=kiran', date: '3 days ago', likes: 15, comments: 3 },
        { name: 'Meera R.', avatar: 'https://i.pravatar.cc/150?u=meera', date: '4 days ago', likes: 56, comments: 15 }
      ];
      return users.map(u => ({
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

    const getFoodItems = () => {
      const dishes = [
        { name: 'Biryani', type: 'Biryani Specials', image: foodImages[0] },
        { name: 'Mandi & Arabian', type: 'Arabian Delights', image: foodImages[1] },
        { name: 'Seafood', type: 'Fresh Catch', image: foodImages[2] },
        { name: 'Appam & Chicken Perattu', type: 'Traditional', image: foodImages[0] },
        { name: 'Puttum Beefum', type: 'Local Favorites', image: foodImages[1] },
        { name: 'Kizhi Parotta', type: 'Local Favorites', image: foodImages[2] }
      ];
      
      const hotels = [
        { name: 'The Ghats Restaurant', logo: 'https://t3.ftcdn.net/jpg/03/07/94/80/360_F_307948085_v9L7m3i9C9XU8B3C3lQ0J9u9U1N3S7sE.jpg' },
        { name: 'Paragon Restaurant', logo: 'https://cdn-icons-png.flaticon.com/512/854/854866.png' },
        { name: 'Empire Hotel', logo: 'https://cdn-icons-png.flaticon.com/512/2907/2907253.png' },
        { name: 'Grand Hyatt', logo: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png' },
        { name: 'Kochi Kitchen', logo: 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png' }
      ];

      return dishes.map((dish, dishIdx) => {
        const hotel = hotels[dishIdx % hotels.length];
        return {
          id: 'f_' + distName + '_' + dishIdx,
          title: hotel.name, // Establishment name on map/stack
          foodName: dish.name, // Dish name for modal title
          category: 'Food',
          tags: [dish.type],
          logo: hotel.logo,
          image: dish.image,
          description: `Experience the best ${dish.name} at ${hotel.name}. Our specialty ${dish.name} is prepared with authentic secret spices and tradition.`,
          price: getRandomPrice(),
          distance: (Math.random() * 5 + 1).toFixed(2) + ' km',
          people: getFakePeople('Food', hotel.name),
          leaderboard: getFakeLeaderboard(),
          lat: feature.geometry.coordinates[1] + (Math.random() - 0.5) * 0.05,
          lng: feature.geometry.coordinates[0] + (Math.random() - 0.5) * 0.05
        };
      });
    };

    const challenges = [
      {
        id: 'c_' + distName + '_1',
        title: 'Clean ' + distName + ' Streets',
        description: 'Help keep the central streets of ' + distName + ' free of plastic waste.',
        points: getRandomPoints(),
        logo: 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png', 
        image: challengeImages[0],
        tags: ['Environment'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Challenge', 'Clean ' + distName + ' Streets'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'c_' + distName + '_2',
        title: 'Plant Trees in ' + distName,
        description: 'Contribute to the green cover around ' + distName + ' local parks.',
        points: getRandomPoints(),
        logo: 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png',
        image: challengeImages[1],
        tags: ['Environment'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Challenge', 'Plant Trees in ' + distName),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'c_' + distName + '_3',
        title: 'Report Potholes in ' + distName,
        description: 'Help authorities identify bad road conditions in ' + distName + '.',
        points: getRandomPoints(),
        logo: 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png',
        image: challengeImages[2],
        tags: ['Infrastructure'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Challenge', 'Report Potholes in ' + distName),
        leaderboard: getFakeLeaderboard()
      }
    ];

    const places = [
      {
        id: 'p_' + distName + '_1',
        title: distName + ' Heritage Museum',
        description: 'Explore the rich history and artifacts from the ' + distName + ' region.',
        distance: '1.2 km',
        points: getRandomPoints(),
        rating: getRandomRating(),
        logo: 'https://cdn-icons-png.flaticon.com/512/854/854866.png',
        image: placeImages[0],
        tags: ['Culture', 'History'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Place', distName + ' Heritage Museum'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'p_' + distName + '_2',
        title: distName + ' Botanical Gardens',
        description: 'Enjoy a quiet stroll through lush greenery in the heart of ' + distName + '.',
        distance: '3.4 km',
        points: getRandomPoints(),
        image: placeImages[1],
        tags: ['Nature', 'Park'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Place', distName + ' Botanical Gardens'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'p_' + distName + '_3',
        title: distName + ' Viewpoint',
        description: 'Catch breath-taking panoramic views of ' + distName + ' and surrounding landscapes.',
        distance: '8.5 km',
        points: getRandomPoints(),
        image: placeImages[2],
        tags: ['Nature', 'Sightseeing'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Place', distName + ' Viewpoint'),
        leaderboard: getFakeLeaderboard()
      }
    ];

    if (distName === 'Kottayam') {
      for (let i = 4; i <= 8; i++) {
        const title = distName + ' Historical Site ' + i;
        places.push({
          id: 'p_' + distName + '_' + i,
          title: title,
          description: 'A beautiful historical site located in the heart of ' + distName + '.',
          distance: (i * 2.1).toFixed(1) + ' km',
          points: getRandomPoints(),
          image: placeImages[i % 3],
          tags: ['History', 'Sightseeing'],
          entryFee: getRandomEntryFee(),
          prize: '100 Points',
          people: getFakePeople('Place', title),
          leaderboard: getFakeLeaderboard()
        });
      }
    }
    const dishes = [
      { name: 'Biryani', type: 'Biryani Specials', image: foodImages[0] },
      { name: 'Mandi & Arabian', type: 'Arabian Delights', image: foodImages[1] },
      { name: 'Seafood', type: 'Fresh Catch', image: foodImages[2] },
      { name: 'Appam & Chicken Perattu', type: 'Traditional', image: foodImages[0] },
      { name: 'Puttum Beefum', type: 'Local Favorites', image: foodImages[1] }
    ];
    
    const hList = [
      { name: 'The Ghats Restaurant', logo: 'https://t3.ftcdn.net/jpg/03/07/94/80/360_F_307948085_v9L7m3i9C9XU8B3C3lQ0J9u9U1N3S7sE.jpg' },
      { name: 'Paragon Restaurant', logo: 'https://cdn-icons-png.flaticon.com/512/854/854866.png' },
      { name: 'Empire Hotel', logo: 'https://cdn-icons-png.flaticon.com/512/2907/2907253.png' },
      { name: 'Grand Hyatt', logo: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png' },
      { name: 'Kochi Kitchen', logo: 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png' }
    ];

    const food = dishes.map((dish, dishIdx) => {
      const hotel = hList[dishIdx % hList.length];
      return {
        id: 'f_' + distName + '_' + dishIdx,
        title: hotel.name, // Establishment name on map/stack
        foodName: dish.name, // Dish name for modal title
        category: 'Food',
        tags: [dish.type],
        logo: hotel.logo,
        image: dish.image,
        description: `Experience the best ${dish.name} at ${hotel.name}. Our specialty ${dish.name} is prepared with authentic secret spices and tradition.`,
        price: getRandomPrice(),
        distance: (Math.random() * 5 + 1).toFixed(2) + ' km',
        points: getRandomPoints(),
        rating: getRandomRating(),
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Food', hotel.name),
        leaderboard: getFakeLeaderboard(),
        lat: feature.geometry.coordinates[1] + (Math.random() - 0.5) * 0.05,
        lng: feature.geometry.coordinates[0] + (Math.random() - 0.5) * 0.05
      };
    });

    if (distName === 'Kottayam') {
      const kHotelNames = ['Kottayam Delicacy', 'Pepper Grove', 'Backwater Bites', 'Rubber Valley Inn', 'Meenachil Kitchen'];
      const kDishNames = ['Fish Curry', 'Beef Roast', 'Karimeen Pollichathu', 'Appam & Stew', 'Kappa & Meen'];
      
      for (let i = 8; i <= 14; i++) {
        const hotelName = kHotelNames[i % kHotelNames.length] + ' ' + i;
        const dishName = kDishNames[i % kDishNames.length];
        food.push({
          id: 'f_' + distName + '_' + i,
          title: hotelName,
          foodName: dishName,
          category: 'Food',
          tags: ['Local Specialties'],
          logo: 'https://cdn-icons-png.flaticon.com/512/10433/10433048.png',
          image: foodImages[i % 3],
          description: `Authentic local ${dishName} at ${hotelName}. A must-try experience in Kottayam.`,
          price: getRandomPrice(),
          distance: (Math.random() * 5 + 1).toFixed(2) + ' km',
          points: getRandomPoints(),
          rating: getRandomRating(),
          entryFee: getRandomEntryFee(),
          prize: '100 Points',
          people: getFakePeople('Food', hotelName),
          leaderboard: getFakeLeaderboard(),
          lat: feature.geometry.coordinates[1] + (Math.random() - 0.5) * 0.05,
          lng: feature.geometry.coordinates[0] + (Math.random() - 0.5) * 0.05
        });
      }
    }

    const activities = [
      {
        id: 'a_' + distName + '_1',
        title: 'Morning Yoga at ' + distName + ' Park',
        description: 'Gentle yoga session suitable for all levels to start your day fresh.',
        duration: '1 hour',
        points: getRandomPoints(),
        image: activityImages[0],
        tags: ['Yoga', 'Wellbeing'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Activity', 'Morning Yoga at ' + distName + ' Park'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'a_' + distName + '_2',
        title: distName + ' Cycling Tour',
        description: 'Explore the scenic routes and hidden gems of ' + distName + ' on two wheels.',
        duration: '3 hours',
        points: getRandomPoints(),
        image: activityImages[1],
        tags: ['Cycling', 'Adventure'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Activity', distName + ' Cycling Tour'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'a_' + distName + '_3',
        title: distName + ' Backwaters Kayaking',
        description: 'Paddle through the peaceful channels and experience ' + distName + ' from the water.',
        duration: '2 hours',
        points: getRandomPoints(),
        image: activityImages[2],
        tags: ['Kayaking', 'Water Sports'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Activity', distName + ' Backwaters Kayaking'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'a_' + distName + '_4',
        title: distName + ' Football Turf',
        description: 'High-quality artificial turf for 5-a-side and 7-a-side football matches.',
        duration: '1 hour',
        points: getRandomPoints(),
        image: activityImages[0],
        tags: ['Football', 'Sports'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Activity', distName + ' Football Turf'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'a_' + distName + '_5',
        title: distName + ' Cricket Academy',
        description: 'Net practice and local matches for cricket enthusiasts.',
        duration: '2 hours',
        points: getRandomPoints(),
        image: activityImages[1],
        tags: ['Cricket', 'Sports'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Activity', distName + ' Cricket Academy'),
        leaderboard: getFakeLeaderboard()
      }
    ];

    if (distName === 'Kottayam') {
      for (let i = 6; i <= 10; i++) {
        const title = distName + ' Adventure Activity ' + i;
        activities.push({
          id: 'a_' + distName + '_' + i,
          title: title,
          description: 'Thrilling ' + distName + ' activity for adventure seekers.',
          duration: i + ' hours',
          points: getRandomPoints(),
          image: activityImages[i % 3],
          tags: ['Adventure', 'Outdoor'],
          entryFee: getRandomEntryFee(),
          prize: '100 Points',
          people: getFakePeople('Activity', title),
          leaderboard: getFakeLeaderboard()
        });
      }
    }

    const events = [
      {
        id: 'e_' + distName + '_1',
        title: distName + ' Cultural Fest',
        description: 'A grand celebration showing traditional dance, music, and art of ' + state.name + '.',
        date: 'Next Saturday',
        points: getRandomPoints(),
        image: eventImages[0],
        tags: ['Music', 'Culture'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Event', distName + ' Cultural Fest'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'e_' + distName + '_2',
        title: distName + ' Tech Meetup',
        description: 'Networking event for developers and tech enthusiasts in ' + distName + '.',
        date: 'Coming Friday',
        points: getRandomPoints(),
        image: eventImages[1],
        tags: ['Tech', 'Networking'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Event', distName + ' Tech Meetup'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'e_' + distName + '_3',
        title: distName + ' Sunday Market',
        description: 'Buy fresh local produce and handmade crafts from ' + distName + ' artisans.',
        date: 'Every Sunday',
        points: getRandomPoints(),
        image: eventImages[2],
        tags: ['Market', 'Shopping'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Event', distName + ' Sunday Market'),
        leaderboard: getFakeLeaderboard()
      },
      {
        id: 'e_' + distName + '_4',
        title: distName + ' Art Gallery Opening',
        description: 'Exhibition featuring local artists and contemporary artworks.',
        date: 'Next month',
        points: getRandomPoints(),
        image: eventImages[0],
        tags: ['Art', 'Gallery'],
        entryFee: getRandomEntryFee(),
        prize: '100 Points',
        people: getFakePeople('Event', distName + ' Art Gallery Opening'),
        leaderboard: getFakeLeaderboard()
      }
    ];

    if (distName === 'Kottayam') {
      for (let i = 5; i <= 9; i++) {
        const title = distName + ' Special Event ' + i;
        events.push({
          id: 'e_' + distName + '_' + i,
          title: title,
          description: 'An exciting community event happening in ' + distName + '.',
          date: 'TBA',
          points: getRandomPoints(),
          image: eventImages[i % 3],
          tags: ['Community', 'Social'],
          entryFee: getRandomEntryFee(),
          prize: '100 Points',
          people: getFakePeople('Event', title),
          leaderboard: getFakeLeaderboard()
        });
      }
    }

    STATIC_DISTRICT_DATA[state.name][distName] = {
      'Challenges': challenges,
      'Places': places,
      'Food': food,
      'Activity': activities,
      'Events': events
    };
  });
});

const fileContent = "// Auto-generated mock static data for districts\n" +
"export const STATIC_DISTRICT_DATA = " + JSON.stringify(STATIC_DISTRICT_DATA, null, 2) + ";\n";

fs.writeFileSync(path.join(__dirname, 'utils/mockCategoryData.js'), fileContent);
console.log('Successfully generated utils/mockCategoryData.js');
