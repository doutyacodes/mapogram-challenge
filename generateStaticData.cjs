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
        },
        {
          id: 'c_' + distName + '_2',
          title: 'Plant Trees in ' + distName,
          description: 'Contribute to the green cover around ' + distName + ' local parks.',
          points: getRandomPoints(),
          image: challengeImages[1],
        },
        {
          id: 'c_' + distName + '_3',
          title: 'Report Potholes in ' + distName,
          description: 'Help authorities identify bad road conditions in ' + distName + '.',
          points: getRandomPoints(),
          image: challengeImages[2],
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
        },
        {
          id: 'p_' + distName + '_2',
          title: distName + ' Botanical Gardens',
          description: 'Enjoy a quiet stroll through lush greenery in the heart of ' + distName + '.',
          distance: '3.4 km',
          points: getRandomPoints(),
          image: placeImages[1],
        },
        {
          id: 'p_' + distName + '_3',
          title: distName + ' Viewpoint',
          description: 'Catch breath-taking panoramic views of ' + distName + ' and surrounding landscapes.',
          distance: '8.5 km',
          points: getRandomPoints(),
          image: placeImages[2],
        }
      ],
      'Food': [
        {
          id: 'f_' + distName + '_1',
          title: distName + ' Spice Kitchen',
          description: 'Authentic local cuisine known for highly flavorful curries in ' + distName + '.',
          hours: '11:00 AM - 10:30 PM',
          points: getRandomPoints(),
          rating: getRandomRating(),
          image: foodImages[0],
        },
        {
          id: 'f_' + distName + '_2',
          title: 'The ' + distName + ' Diner',
          description: 'Classic vegetarian thalis bridging traditional and modern fare in ' + distName + '.',
          hours: '08:00 AM - 10:00 PM',
          points: getRandomPoints(),
          rating: getRandomRating(),
          image: foodImages[1],
        },
        {
          id: 'f_' + distName + '_3',
          title: distName + ' Midnight Cravings',
          description: 'Your go-to late night fast food spot in central ' + distName + '.',
          hours: '06:00 PM - 03:00 AM',
          points: getRandomPoints(),
          rating: getRandomRating(),
          image: foodImages[2],
        }
      ]
    };
  });
});

const fileContent = "// Auto-generated mock static data for districts\n" +
"export const STATIC_DISTRICT_DATA = " + JSON.stringify(STATIC_DISTRICT_DATA, null, 2) + ";\n";

fs.writeFileSync(path.join(__dirname, 'utils/mockCategoryData.js'), fileContent);
console.log('Successfully generated utils/mockCategoryData.js');
