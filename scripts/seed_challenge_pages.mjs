// One-off migration: moves the Communities challenge pages out of the code and into
// the database (pages -> page_profiles -> districts -> challenges -> challenge_media).
//
//   node scripts/seed_challenge_pages.mjs            # apply
//   node scripts/seed_challenge_pages.mjs --dry-run  # only print what would be inserted
//
// Sources (deleted from the repo after this ran; they stay in git history):
//   * utils/mockCategoryData.js   - Kerala / Karnataka / Tamil Nadu items
//   * utils/staticCommunities.js  - the tourism / company / brand / celebrity pages
//   * public/geojson/<state>.json - district outlines
//
// Safe to re-run: the schema change is applied only when the columns are missing,
// and a page whose id already exists is skipped. The made-up "people" and
// "leaderboard" entries are not copied; those tabs now show real users.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (rel) => import(pathToFileURL(path.join(root, rel)).href);
const dryRun = process.argv.includes("--dry-run");

const { STATIC_DISTRICT_DATA } = await load("utils/mockCategoryData.js");
const { STATE_COMMUNITIES, CHALLENGE_PAGES, CHALLENGE_CATEGORIES, getChallengePageData } = await load("utils/staticCommunities.js");
const { geojsonBounds } = await load("utils/map/geometry.js");
const { db } = await load("utils/index.js");
const conn = db.$client;
const q = async (sql, params) => (await conn.query(sql, params))[0];

const STATE_FILES = { Kerala: "kerala", Karnataka: "karnataka", "Tamil Nadu": "tamil_nadu" };
const stateGeo = {};
const loadState = (file) =>
  (stateGeo[file] ??= JSON.parse(readFileSync(path.join(root, "public", "geojson", `${file}.json`), "utf8")));

// Same mapping PageView uses to derive a category, so /page/<id> groups them identically
const FREQUENCY = { Challenges: "once", Places: "experience", Food: "food", Activity: "contest", Events: "event" };
const PAGE_TYPES = {
  "State Tourism": "State tourism challenge map",
  Tourism: "Tourism challenge page",
  Company: "Company challenge page",
  Brand: "Brand challenge page",
  Celebrity: "Celebrity challenge page",
};

const toInt = (text) => {
  const n = parseInt(String(text ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""));

function districtRow(name, feature) {
  const geometry = feature?.geometry;
  const isArea = geometry && ["Polygon", "MultiPolygon"].includes(geometry.type);
  let lat = null;
  let lng = null;
  if (isArea) {
    const [[minLat, minLng], [maxLat, maxLng]] = geojsonBounds(geometry);
    lat = (minLat + maxLat) / 2;
    lng = (minLng + maxLng) / 2;
  } else if (geometry?.type === "Point") {
    [lng, lat] = geometry.coordinates;
  }
  return { name, geojson: isArea ? geometry : null, lat, lng };
}

function itemRow(item, category) {
  return {
    title: item.title,
    description: item.description || "",
    category,
    frequency: FREQUENCY[category],
    entry_points: toInt(item.entryFee),
    reward_points: toInt(item.prize),
    lat: item.position?.lat ?? null,
    lng: item.position?.lng ?? null,
    logo_url: item.logo || null,
    image: item.image || null,
    details: compact({
      tags: item.tags?.length ? item.tags : undefined,
      price: item.price,
      food_name: item.foodName,
      rating: item.rating,
      duration: item.duration,
      event_date: item.date,
      hours: item.hours,
    }),
  };
}

// Every page as { id, name, username, type, bio, logo, districts: [{ ...district, items: [...] }] }
function buildPages() {
  const pages = [];
  for (const [id, meta] of Object.entries(STATE_COMMUNITIES)) {
    const geo = loadState(STATE_FILES[meta.name]);
    const data = STATIC_DISTRICT_DATA[meta.name] || {};
    pages.push({
      id: Number(id),
      name: meta.name,
      username: `${meta.name.toLowerCase().replace(/\s+/g, "_")}_state`,
      type: "State Tourism",
      bio: `State of ${meta.name}`,
      logo: meta.logo || null,
      districts: geo.features.map((feature) => {
        const name = feature.properties.name || feature.properties.district;
        const cats = data[name] || {};
        return {
          ...districtRow(name, feature),
          items: CHALLENGE_CATEGORIES.flatMap((cat) => (cats[cat] || []).map((item) => itemRow(item, cat))),
        };
      }),
    });
  }
  for (const page of CHALLENGE_PAGES) {
    const data = getChallengePageData(page.id);
    pages.push({
      id: page.id,
      name: page.name,
      username: page.slug.replace(/-/g, "_"),
      type: page.kind,
      bio: page.tagline,
      logo: page.logo || null,
      districts: page.zones.map((zone) => {
        const feature = loadState(zone.state).features.find((f) => f.properties.name === zone.name);
        if (!feature) throw new Error(`${page.name}: district "${zone.name}" not in ${zone.state}.json`);
        const cats = data[zone.name] || {};
        return {
          ...districtRow(zone.name, feature),
          items: CHALLENGE_CATEGORIES.flatMap((cat) => (cats[cat] || []).map((item) => itemRow(item, cat))),
        };
      }),
    });
  }
  return pages;
}

async function ensureSchema() {
  const cols = (await q(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'challenges'"
  )).map((r) => r.COLUMN_NAME);
  const add = [];
  if (!cols.includes("category")) add.push("ADD COLUMN `category` ENUM('Challenges','Places','Food','Activity','Events') NULL DEFAULT NULL AFTER `description`");
  if (!cols.includes("logo_url")) add.push("ADD COLUMN `logo_url` VARCHAR(255) NULL DEFAULT NULL AFTER `category`");
  if (!cols.includes("details")) add.push("ADD COLUMN `details` JSON NULL DEFAULT NULL AFTER `logo_url`");
  if (add.length) {
    console.log(`challenges: adding ${add.length} column(s)`);
    if (!dryRun) await q(`ALTER TABLE challenges ${add.join(", ")}`);
  }

  const typeIds = {};
  for (const [name, description] of Object.entries(PAGE_TYPES)) {
    const [existing] = await q("SELECT id FROM page_types WHERE name = ?", [name]);
    if (existing) {
      typeIds[name] = existing.id;
    } else if (dryRun) {
      typeIds[name] = -1;
      console.log(`page_types: would add "${name}"`);
    } else {
      const res = await q("INSERT INTO page_types (name, description, category) VALUES (?, ?, 'challenge_page')", [name, description]);
      typeIds[name] = res.insertId;
      console.log(`page_types: added "${name}" (#${res.insertId})`);
    }
  }
  return typeIds;
}

async function ownerUserId() {
  if (process.env.SEED_OWNER_USER_ID) return Number(process.env.SEED_OWNER_USER_ID);
  const [row] = await q(
    "SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'super_admin' ORDER BY u.id LIMIT 1"
  );
  if (!row) throw new Error("No super_admin user to own the pages; set SEED_OWNER_USER_ID");
  return row.id;
}

async function insertPage(page, typeId, ownerId) {
  await conn.beginTransaction();
  try {
    await q("INSERT INTO pages (id, user_id, name, username, page_type_id) VALUES (?, ?, ?, ?, ?)", [
      page.id, ownerId, page.name, page.username, typeId,
    ]);
    await q("INSERT INTO page_profiles (page_id, bio, profile_pic_url, logo_url) VALUES (?, ?, ?, ?)", [
      page.id, page.bio, page.logo, page.logo,
    ]);
    await q("INSERT INTO page_admins (page_id, user_id, is_owner) VALUES (?, ?, 1)", [page.id, ownerId]);
    await q("INSERT INTO usernames (username, entity_type, entity_id) VALUES (?, 'page', ?)", [page.username, page.id]);

    let itemCount = 0;
    for (const d of page.districts) {
      const res = await q("INSERT INTO districts (page_id, name, latitude, longitude, geojson) VALUES (?, ?, ?, ?, ?)", [
        page.id, d.name, d.lat, d.lng, d.geojson ? JSON.stringify(d.geojson) : null,
      ]);
      const districtId = res.insertId;
      if (!d.items.length) continue;

      await q(
        `INSERT INTO challenges (district_id, page_id, title, description, category, logo_url, details, frequency,
           entry_points, reward_points, latitude, longitude, is_active, challenge_type) VALUES ?`,
        [d.items.map((it) => [
          districtId, page.id, it.title, it.description, it.category, it.logo_url,
          Object.keys(it.details).length ? JSON.stringify(it.details) : null, it.frequency,
          it.entry_points, it.reward_points, it.lat, it.lng, 1, "unordered",
        ])]
      );
      // A new district has no other challenges, so id order is insertion order
      const ids = await q("SELECT id, title FROM challenges WHERE district_id = ? ORDER BY id", [districtId]);
      if (ids.length !== d.items.length || ids.some((r, i) => r.title !== d.items[i].title)) {
        throw new Error(`${page.name} / ${d.name}: inserted challenges did not read back in order`);
      }
      const media = d.items.map((it, i) => [ids[i].id, "image", it.image, 0]).filter((m) => m[2]);
      if (media.length) {
        await q("INSERT INTO challenge_media (challenge_id, media_type, media_url, display_order) VALUES ?", [media]);
      }
      itemCount += d.items.length;
    }
    await conn.commit();
    return itemCount;
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

const pages = buildPages();
const typeIds = await ensureSchema();
const ownerId = await ownerUserId();
console.log(`owner user #${ownerId}${dryRun ? " (dry run)" : ""}`);

for (const page of pages) {
  const items = page.districts.reduce((n, d) => n + d.items.length, 0);
  const label = `#${page.id} ${page.name} [${page.type}]: ${page.districts.length} districts, ${items} items`;
  const [existing] = await q("SELECT id FROM pages WHERE id = ?", [page.id]);
  if (existing) {
    console.log(`skip ${label} (already in the database)`);
    continue;
  }
  if (dryRun) {
    console.log(`would add ${label}`);
    continue;
  }
  const inserted = await insertPage(page, typeIds[page.type], ownerId);
  console.log(`added ${label} (${inserted} inserted)`);
}

await conn.end();
