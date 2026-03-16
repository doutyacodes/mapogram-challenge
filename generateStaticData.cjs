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

states.forEach(state => {
  const geojsonFile = path.join(__dirname, 'public/geojson', state.file);
  const data = JSON.parse(fs.readFileSync(geojsonFile, 'utf8'));
  
  STATIC_DISTRICT_DATA[state.name] = {};
  
  data.features.forEach((feature, idx) => {
    const distName = feature.properties.name || feature.properties.district;
    if (!distName) return;
    
    STATIC_DISTRICT_DATA[state.name][distName] = {
      'Challenges': [
        {
          id: 'c_' + distName + '_1',
          title: 'Clean ' + distName + ' Streets',
          description: 'Help keep the central streets of ' + distName + ' free of plastic waste.',
          points: getRandomPoints(),
          image: challengeImages[0],
          tags: ['Environment']
        },
        {
          id: 'c_' + distName + '_2',
          title: 'Plant Trees in ' + distName,
          description: 'Contribute to the green cover around ' + distName + ' local parks.',
          points: getRandomPoints(),
          image: challengeImages[1],
          tags: ['Environment']
        },
        {
          id: 'c_' + distName + '_3',
          title: 'Report Potholes in ' + distName,
          description: 'Help authorities identify bad road conditions in ' + distName + '.',
          points: getRandomPoints(),
          image: challengeImages[2],
          tags: ['Infrastructure']
        }
      ],
      'Places': [
        {
          id: 'p_' + distName + '_1',
          title: distName + ' Heritage Museum',
          description: 'Explore the rich history and artifacts from the ' + distName + ' region.',
          distance: '1.2 km',
          points: getRandomPoints(),
          image: placeImages[0],
          tags: ['Culture', 'History']
        },
        {
          id: 'p_' + distName + '_2',
          title: distName + ' Botanical Gardens',
          description: 'Enjoy a quiet stroll through lush greenery in the heart of ' + distName + '.',
          distance: '3.4 km',
          points: getRandomPoints(),
          image: placeImages[1],
          tags: ['Nature', 'Park']
        },
        {
          id: 'p_' + distName + '_3',
          title: distName + ' Viewpoint',
          description: 'Catch breath-taking panoramic views of ' + distName + ' and surrounding landscapes.',
          distance: '8.5 km',
          points: getRandomPoints(),
          image: placeImages[2],
          tags: ['Nature', 'Sightseeing']
        }
      ],
      'Food': [
        {
          id: 'f_' + distName + '_1',
          title: distName + ' Biryani Palace',
          description: 'Famous for its aromatic Hyderabadi and Malabar Biryani with traditional spices.',
          hours: '12:00 PM - 11:00 PM',
          points: getRandomPoints(),
          rating: getRandomRating(),
          image: foodImages[0],
          hotels: [distName + ' Heritage Hotel', 'Grand ' + distName + ' Residency'],
          tags: ['Biryani', 'South Indian']
        },
        {
          id: 'f_' + distName + '_2',
          title: 'The ' + distName + ' Grand Hotel',
          description: 'Premium dining experience featuring multicuisine delicacies and local favorites.',
          hours: '07:00 AM - 11:00 PM',
          points: getRandomPoints(),
          rating: getRandomRating(),
          image: foodImages[1],
          hotels: ['Hotel ' + distName + ' International', distName + ' Garden Inn'],
          tags: ['Mandi', 'Arabian', 'North Indian']
        },
        {
          id: 'f_' + distName + '_3',
          title: distName + ' Seafood Special',
          description: 'Fresh catch of the day served in traditional coastal style recipes.',
          hours: '11:00 AM - 10:00 PM',
          points: getRandomPoints(),
          rating: getRandomRating(),
          image: foodImages[2],
          hotels: ['Coastal Breeze Resort', distName + ' Sands Hotel'],
          tags: ['Seafood', 'Coastal']
        }
      ],
      'Activity': [
        {
          id: 'a_' + distName + '_1',
          title: 'Morning Yoga at ' + distName + ' Park',
          description: 'Gentle yoga session suitable for all levels to start your day fresh.',
          duration: '1 hour',
          points: getRandomPoints(),
          image: activityImages[0],
          tags: ['Yoga', 'Wellbeing']
        },
        {
          id: 'a_' + distName + '_2',
          title: distName + ' Cycling Tour',
          description: 'Explore the scenic routes and hidden gems of ' + distName + ' on two wheels.',
          duration: '3 hours',
          points: getRandomPoints(),
          image: activityImages[1],
          tags: ['Cycling', 'Adventure']
        },
        {
          id: 'a_' + distName + '_3',
          title: distName + ' Backwaters Kayaking',
          description: 'Paddle through the peaceful channels and experience ' + distName + ' from the water.',
          duration: '2 hours',
          points: getRandomPoints(),
          image: activityImages[2],
          tags: ['Kayaking', 'Water Sports']
        },
        {
          id: 'a_' + distName + '_4',
          title: distName + ' Football Turf',
          description: 'High-quality artificial turf for 5-a-side and 7-a-side football matches.',
          duration: '1 hour',
          points: getRandomPoints(),
          image: activityImages[0],
          tags: ['Football', 'Sports']
        },
        {
          id: 'a_' + distName + '_5',
          title: distName + ' Cricket Academy',
          description: 'Net practice and local matches for cricket enthusiasts.',
          duration: '2 hours',
          points: getRandomPoints(),
          image: activityImages[1],
          tags: ['Cricket', 'Sports']
        }
      ],
      'Events': [
        {
          id: 'e_' + distName + '_1',
          title: distName + ' Cultural Fest',
          description: 'A grand celebration showing traditional dance, music, and art of ' + state.name + '.',
          date: 'Next Saturday',
          points: getRandomPoints(),
          image: eventImages[0],
          tags: ['Music', 'Culture']
        },
        {
          id: 'e_' + distName + '_2',
          title: distName + ' Tech Meetup',
          description: 'Networking event for developers and tech enthusiasts in ' + distName + '.',
          date: 'Coming Friday',
          points: getRandomPoints(),
          image: eventImages[1],
          tags: ['Tech', 'Networking']
        },
        {
          id: 'e_' + distName + '_3',
          title: distName + ' Sunday Market',
          description: 'Buy fresh local produce and handmade crafts from ' + distName + ' artisans.',
          date: 'Every Sunday',
          points: getRandomPoints(),
          image: eventImages[2],
          tags: ['Market', 'Shopping']
        },
        {
          id: 'e_' + distName + '_4',
          title: distName + ' Art Gallery Opening',
          description: 'Exhibition featuring local artists and contemporary artworks.',
          date: 'Next month',
          points: getRandomPoints(),
          image: eventImages[0],
          tags: ['Art', 'Gallery']
        }
      ]
    };
  });
});

const fileContent = "// Auto-generated mock static data for districts\n" +
"export const STATIC_DISTRICT_DATA = " + JSON.stringify(STATIC_DISTRICT_DATA, null, 2) + ";\n";

fs.writeFileSync(path.join(__dirname, 'utils/mockCategoryData.js'), fileContent);
console.log('Successfully generated utils/mockCategoryData.js');
