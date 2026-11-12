// Static (no-database) challenge communities shown in the Communities map.
//
//  * 999991–999993: state tourism (Kerala, Karnataka, Tamil Nadu); their items live
//    in utils/mockCategoryData.js (STATIC_DISTRICT_DATA).
//  * 999994–999997: challenge pages (tourism, company, brand, celebrity). Their
//    zones are real districts; boundaries are in public/geojson/pages/<slug>.json
//    (built by scripts/build_challenge_page_geojson.js) and their items are
//    generated below from small templates.
//
// The page names are fictional demo entities. Rename them here (name, tagline,
// templates) — nothing else needs to change.

// Category ids used by the map buttons, markers and cards in CommunityView
export const CHALLENGE_CATEGORIES = ["Challenges", "Places", "Food", "Activity", "Events"];

export const STATE_COMMUNITIES = {
  999991: { name: "Kerala", geojson: "/geojson/kerala.json", kindLabel: "Kerala Tourism", logo: "https://www.keralatourism.org/images/logo/logo.png" },
  999992: { name: "Karnataka", geojson: "/geojson/karnataka.json", kindLabel: "Karnataka Tourism", logo: null },
  999993: { name: "Tamil Nadu", geojson: "/geojson/tamil_nadu.json", kindLabel: "Tamil Nadu Tourism", logo: null },
};

const IMAGES = {
  Challenges: [
    "https://images.unsplash.com/photo-1618477461853-cf6ed80fbea5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1596464716127-f2a829d4de30?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800",
  ],
  Places: [
    "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1588693959606-a8fa2390b1e4?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1572551532888-ca28ba89f282?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=800",
  ],
  Food: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1626777553735-48b47ca90695?auto=format&fit=crop&q=80&w=800",
  ],
  Activity: [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=800",
  ],
  Events: [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=800",
  ],
};

const LOGOS = {
  Challenges: "https://cdn-icons-png.flaticon.com/512/10433/10433048.png",
  Places: "https://cdn-icons-png.flaticon.com/512/854/854866.png",
  Food: "https://cdn-icons-png.flaticon.com/512/10433/10433048.png",
  Activity: "https://cdn-icons-png.flaticon.com/512/3652/3652191.png",
  Events: "https://cdn-icons-png.flaticon.com/512/2907/2907253.png",
};

const ID_PREFIX = { Challenges: "c_", Places: "p_", Food: "f_", Activity: "a_", Events: "e_" };

const PEOPLE = [
  { name: "Arjun K.", avatar: "https://i.pravatar.cc/150?u=arjun" },
  { name: "Sneha M.", avatar: "https://i.pravatar.cc/150?u=sneha" },
  { name: "Rahul V.", avatar: "https://i.pravatar.cc/150?u=rahul" },
  { name: "Meera R.", avatar: "https://i.pravatar.cc/150?u=meera" },
  { name: "Anjali S.", avatar: "https://i.pravatar.cc/150?u=anjali" },
];
const CERTIFICATE = "https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&q=80&w=200";

// Each template: [title, description, tags, extra fields]. "{zone}" and "{spot}" are filled per zone.
export const CHALLENGE_PAGES = [
  {
    id: 999994,
    slug: "western-ghats-trails",
    kind: "Tourism",
    name: "Western Ghats Trails",
    tagline: "Hill-country tourism across Kerala, Karnataka and Tamil Nadu",
    zones: [
      { name: "Wayanad", state: "kerala", spot: "Chembra Peak" },
      { name: "Idukki", state: "kerala", spot: "Munnar" },
      { name: "Kodagu", state: "karnataka", spot: "Abbey Falls" },
      { name: "Chikkamagaluru", state: "karnataka", spot: "Mullayanagiri" },
      { name: "Nilgiris", state: "tamil_nadu", spot: "Ooty" },
      { name: "Dindigul", state: "tamil_nadu", spot: "Kodaikanal" },
    ],
    templates: {
      Challenges: [
        ["{spot} Summit Trek", "Reach the top of {spot} and check in at the summit marker. Finish within a day to earn the trekker badge.", ["Trekking", "Adventure"]],
        ["Plastic-Free {zone}", "Collect litter along a marked trail in {zone} and drop it at a partner collection point.", ["Environment", "Volunteering"]],
      ],
      Places: [
        ["{spot} Viewpoint", "The best sunrise view in {zone}. Check in from the viewing deck.", ["Nature", "Sightseeing"], { hours: "6:00 AM – 6:00 PM" }],
        ["{zone} Spice Plantation", "Guided walk through a working spice and tea estate.", ["Heritage", "Nature"], { hours: "9:00 AM – 5:00 PM" }],
      ],
      Food: [
        ["{zone} Hill Kitchen", "Home-style hill cuisine cooked over firewood.", ["Local Cuisine"], { foodName: "Bamboo Rice Meals" }],
        ["Estate Tea Room", "Fresh estate tea with homemade snacks.", ["Café"], { foodName: "Cardamom Tea & Banana Fritters" }],
      ],
      Activity: [
        ["{zone} Jungle Safari", "Early-morning safari with a forest department guide.", ["Wildlife"], { duration: "3 hours" }],
        ["Waterfall Rappelling", "Beginner rappelling session with certified instructors.", ["Adventure"], { duration: "2 hours" }],
      ],
      Events: [
        ["{zone} Monsoon Festival", "Music, local crafts and food stalls celebrating the monsoon.", ["Festival", "Culture"], { date: "Every August" }],
        ["Night Sky Camp", "Stargazing camp with telescopes and a guided talk.", ["Camping"], { date: "New moon weekends" }],
      ],
    },
  },
  {
    id: 999995,
    slug: "nimbus-technologies",
    kind: "Company",
    name: "Nimbus Technologies",
    tagline: "Campus challenges for employees and visitors",
    zones: [
      { name: "Thiruvananthapuram", state: "kerala", spot: "Technopark Campus" },
      { name: "Ernakulam", state: "kerala", spot: "Infopark Campus" },
      { name: "Bengaluru Urban", state: "karnataka", spot: "Whitefield HQ" },
      { name: "Chennai", state: "tamil_nadu", spot: "OMR Campus" },
      { name: "Coimbatore", state: "tamil_nadu", spot: "Tidel Park Office" },
    ],
    templates: {
      Challenges: [
        ["{spot} 10K Steps Week", "Walk 10,000 steps a day for a week. Steps are tracked with the pedometer task.", ["Wellness", "Team"]],
        ["{zone} Code Sprint", "Ship a small open-source fix during the 48-hour sprint and submit the link.", ["Engineering", "Hackathon"]],
      ],
      Places: [
        ["{spot}", "Check in at the {zone} office reception to unlock campus challenges.", ["Office"], { hours: "Mon–Fri, 9:00 AM – 7:00 PM" }],
        ["{zone} Innovation Lab", "Prototype lab with demo stations open to visitors.", ["Innovation"], { hours: "Mon–Fri, 10:00 AM – 5:00 PM" }],
      ],
      Food: [
        ["{zone} Campus Café", "Employee café with a daily healthy-bowl special.", ["Café"], { foodName: "Millet Power Bowl" }],
        ["Friday Food Court", "Partner food trucks every Friday evening.", ["Food Court"], { foodName: "Kothu Parotta" }],
      ],
      Activity: [
        ["{zone} Cricket League", "Inter-team box cricket league. Register your team of six.", ["Sports", "Team"], { duration: "Weekends, 6 weeks" }],
        ["Lunch-Hour Yoga", "Guided yoga session in the campus garden.", ["Wellness"], { duration: "45 minutes" }],
      ],
      Events: [
        ["{zone} Hiring Day", "Walk-in interviews for engineering and design roles.", ["Careers"], { date: "First Saturday of the month" }],
        ["Tech Talk Thursdays", "Talks by Nimbus engineers, open to students.", ["Learning"], { date: "Every Thursday, 5:00 PM" }],
      ],
    },
  },
  {
    id: 999996,
    slug: "brewline-coffee",
    kind: "Brand",
    name: "Brewline Coffee",
    tagline: "Coffee trail challenges across Brewline outlets",
    zones: [
      { name: "Ernakulam", state: "kerala", spot: "Marine Drive" },
      { name: "Kozhikode", state: "kerala", spot: "Beach Road" },
      { name: "Thrissur", state: "kerala", spot: "Swaraj Round" },
      { name: "Dakshina Kannada", state: "karnataka", spot: "Mangaluru" },
      { name: "Bengaluru Urban", state: "karnataka", spot: "Indiranagar" },
      { name: "Madurai", state: "tamil_nadu", spot: "Anna Nagar" },
    ],
    templates: {
      Challenges: [
        ["{zone} Coffee Passport", "Collect a stamp at three Brewline outlets in {zone} to earn a free brew.", ["Loyalty", "Trail"]],
        ["Latte Art Duel", "Pour your best latte art at the {spot} outlet and upload the photo.", ["Barista", "Creative"]],
      ],
      Places: [
        ["Brewline {spot}", "Flagship outlet with the full single-origin menu.", ["Store"], { hours: "7:00 AM – 11:00 PM" }],
        ["{zone} Roastery", "Watch beans roasted in small batches.", ["Roastery"], { hours: "10:00 AM – 6:00 PM" }],
      ],
      Food: [
        ["Signature Filter Coffee", "Brewline's house filter coffee, brewed in brass.", ["Coffee"], { foodName: "Brass Filter Coffee" }],
        ["Cold Brew Bar", "Slow-steeped cold brew with seasonal flavours.", ["Coffee"], { foodName: "Jaggery Cold Brew" }],
      ],
      Activity: [
        ["Home Brewing Workshop", "Learn pour-over and French press brewing at home.", ["Workshop"], { duration: "90 minutes" }],
        ["{zone} Cupping Session", "Taste and score four single-origin coffees.", ["Tasting"], { duration: "1 hour" }],
      ],
      Events: [
        ["New Blend Launch – {zone}", "Be the first to taste Brewline's new monsoon blend.", ["Launch"], { date: "Launch week" }],
        ["Open Mic Night", "Music and poetry at the {spot} outlet.", ["Music", "Community"], { date: "Every Saturday, 7:00 PM" }],
      ],
    },
  },
  {
    id: 999997,
    slug: "arjun-varma",
    kind: "Celebrity",
    name: "Arjun Varma",
    tagline: "Fan challenges with actor Arjun Varma",
    zones: [
      { name: "Thiruvananthapuram", state: "kerala", spot: "Kovalam Beach" },
      { name: "Ernakulam", state: "kerala", spot: "Fort Kochi" },
      { name: "Thrissur", state: "kerala", spot: "Vadakkunnathan Ground" },
      { name: "Chennai", state: "tamil_nadu", spot: "Marina Beach" },
      { name: "Bengaluru Urban", state: "karnataka", spot: "Cubbon Park" },
    ],
    templates: {
      Challenges: [
        ["#ArjunDanceChallenge – {zone}", "Recreate the hook step from Arjun's latest song at {spot} and upload your video.", ["Dance", "Fan"]],
        ["Fan Quiz: {zone} Edition", "Answer ten questions about Arjun's films. Top scorers win signed posters.", ["Quiz", "Fan"]],
      ],
      Places: [
        ["{spot} Shooting Spot", "Location of a famous scene from Arjun's films. Check in to unlock behind-the-scenes clips.", ["Film Location"], { hours: "Open all day" }],
        ["{zone} Fan Club House", "Official fan club meeting point with memorabilia.", ["Fan Club"], { hours: "4:00 PM – 9:00 PM" }],
      ],
      Food: [
        ["Arjun's Favourite Eatery", "The restaurant Arjun visits whenever he shoots in {zone}.", ["Local Cuisine"], { foodName: "Karimeen Pollichathu" }],
        ["Set Tea Stall", "The tea stall the film crew swears by.", ["Snacks"], { foodName: "Masala Chai & Pazhampori" }],
      ],
      Activity: [
        ["Fan Run with Arjun", "5K charity run with the fan club; finishers get a medal.", ["Fitness", "Charity"], { duration: "Morning, 5K" }],
        ["Movie Marathon", "Back-to-back screening of Arjun's classics.", ["Cinema"], { duration: "6 hours" }],
      ],
      Events: [
        ["Meet & Greet – {zone}", "Limited passes for a meet-and-greet session.", ["Fan Meet"], { date: "Announced weekly" }],
        ["Premiere Night", "Red-carpet premiere screening for top challengers.", ["Premiere"], { date: "Release week" }],
      ],
    },
  },
];

// Small deterministic hash so generated points/ratings stay stable between renders.
function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function buildItem(page, zone, category, template, index) {
  const [titleTemplate, descriptionTemplate, tags, extra = {}] = template;
  const fill = (s) => s.replaceAll("{zone}", zone.name).replaceAll("{spot}", zone.spot);
  const title = fill(titleTemplate);
  const seed = hash(`${page.slug}:${zone.name}:${category}:${index}`);
  const points = 150 + (seed % 450);
  const images = IMAGES[category];

  const people = [0, 1, 2].map((k) => {
    const person = PEOPLE[(seed + k) % PEOPLE.length];
    return {
      ...person,
      date: `${(k + 1) * 2} hours ago`,
      likes: 5 + ((seed >> (k + 2)) % 40),
      comments: (seed >> (k + 4)) % 10,
      certification: CERTIFICATE,
      description: `completed ${title}`,
    };
  });

  const leaderboard = PEOPLE.map((person, k) => ({
    rank: k + 1,
    name: person.name,
    avatar: person.avatar,
    points: 1300 - k * 120 - (seed % 50),
  }));

  return {
    id: `${ID_PREFIX[category]}${page.slug}-${zone.name.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    title,
    description: fill(descriptionTemplate),
    category,
    tags,
    logo: LOGOS[category],
    image: images[seed % images.length],
    points,
    entryFee: category === "Challenges" ? `${10 + (seed % 5) * 10} points` : "Free",
    prize: `${Math.round(points / 2)} Points`,
    people,
    leaderboard,
    rating: (3.8 + (seed % 12) / 10).toFixed(1),
    distance: `${(1 + (seed % 90) / 10).toFixed(1)} km`,
    ...(category === "Food" ? { price: `₹${120 + (seed % 380)}` } : {}),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, typeof v === "string" ? fill(v) : v])),
  };
}

const pageDataCache = new Map();

/** { [zoneName]: { Challenges: [...], Places: [...], ... } } for a challenge page, or null. */
export function getChallengePageData(communityId) {
  const id = Number(communityId);
  if (pageDataCache.has(id)) return pageDataCache.get(id);
  const page = CHALLENGE_PAGES.find((p) => p.id === id);
  if (!page) return null;

  const data = {};
  for (const zone of page.zones) {
    data[zone.name] = {};
    for (const category of CHALLENGE_CATEGORIES) {
      data[zone.name][category] = (page.templates[category] || []).map((template, index) =>
        buildItem(page, zone, category, template, index)
      );
    }
  }
  pageDataCache.set(id, data);
  return data;
}

/** Map/header details for any static community (states and challenge pages), or null. */
export function getStaticCommunityMeta(communityId) {
  const id = Number(communityId);
  if (STATE_COMMUNITIES[id]) return { id, ...STATE_COMMUNITIES[id], kind: "Tourism" };
  const page = CHALLENGE_PAGES.find((p) => p.id === id);
  if (!page) return null;
  return {
    id,
    name: page.name,
    kind: page.kind,
    kindLabel: `${page.kind} Page`,
    tagline: page.tagline,
    logo: page.logo || null,
    geojson: `/geojson/pages/${page.slug}.json`,
  };
}

/** Community list entries for the challenge pages (same shape as the state entries). */
export function getChallengePageCommunities() {
  const now = new Date().toISOString();
  return CHALLENGE_PAGES.map((page) => ({
    id: page.id,
    name: page.name,
    description: page.tagline,
    image_url: page.logo || null,
    created_at: now,
    invite_code: null,
    is_open: true,
    followed_at: now,
    status: "approved",
    community_type_name: page.kind,
    role_name: "Member",
    source: "static",
  }));
}
