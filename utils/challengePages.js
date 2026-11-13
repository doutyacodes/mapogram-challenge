// Server-only helpers for challenge pages: the tourism / company / brand / celebrity
// maps on /communities. A challenge page is a row in `pages` whose page type has
// category 'challenge_page'; its zones are `districts` (with outlines) and its map
// items are `challenges` (+ `challenge_media` for the picture).
//
// User activity: `user_challenges` (accept / complete + points), `people_data` /
// `people_media` / `people_likes` (the People tab).
import jwt from "jsonwebtoken";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/utils";
import {
  CHALLENGES,
  CHALLENGE_MEDIA,
  DISTRICTS,
  PAGES,
  PAGE_PROFILES,
  PAGE_TYPES,
  PEOPLE_DATA,
  PEOPLE_LIKES,
  PEOPLE_MEDIA,
  USERS,
  USER_CHALLENGES,
} from "@/utils/schema/schema";

export const CHALLENGE_PAGE_TYPE_CATEGORY = "challenge_page";
export const STATE_TOURISM_TYPE = "State Tourism";
export const CHALLENGE_CATEGORIES = ["Challenges", "Places", "Food", "Activity", "Events"];
export const PROGRESS_STATUSES = ["accepted", "in_progress", "completed", "failed"];

/** Signed-in user id from the user_token cookie; null for guests or a bad token. */
export function getUserId(req) {
  const token = req.cookies.get("user_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET)?.id ?? null;
  } catch {
    return null;
  }
}

export const toId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Map category. Rows created before the category column derive it like PageView always did. */
export function challengeCategory(row) {
  if (row.category) return row.category;
  if (row.frequency === "food" || row.exp_type === "breakfast" || row.exp_type === "biriyani") return "Food";
  if (row.frequency === "contest" || row.frequency === "quiz") return "Activity";
  if (row.frequency === "event") return "Events";
  if (row.exp_type === "arts" || row.frequency === "experience") return "Places";
  return "Challenges";
}

/** Header label: "Kerala Tourism" for state maps, "<Type> Page" for the rest. */
export function pageKindLabel(name, typeName) {
  return typeName === STATE_TOURISM_TYPE ? `${name} Tourism` : `${typeName} Page`;
}

const parseJson = (value) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
const toNumber = (value) => (value == null || value === "" ? null : Number(value));

// ---------------------------------------------------------------------------
// Pages

const pageColumns = {
  id: PAGES.id,
  name: PAGES.name,
  username: PAGES.username,
  created_at: PAGES.created_at,
  type: PAGE_TYPES.name,
  bio: PAGE_PROFILES.bio,
  logo: sql`COALESCE(${PAGE_PROFILES.logo_url}, ${PAGE_PROFILES.profile_pic_url})`,
};

const pageQuery = () =>
  db
    .select(pageColumns)
    .from(PAGES)
    .innerJoin(PAGE_TYPES, eq(PAGE_TYPES.id, PAGES.page_type_id))
    .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id));

const toPageMeta = (row) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  kind: row.type,
  kindLabel: pageKindLabel(row.name, row.type),
  tagline: row.bio || null,
  logo: row.logo || null,
});

/** All challenge pages, oldest id first (Kerala, Karnataka, Tamil Nadu, then the rest). */
export async function listChallengePages() {
  const rows = await pageQuery()
    .where(eq(PAGE_TYPES.category, CHALLENGE_PAGE_TYPE_CATEGORY))
    .orderBy(asc(PAGES.id));
  const seen = new Set(); // a page may have more than one profile row
  return rows.filter((r) => !seen.has(r.id) && seen.add(r.id));
}

/** Entries for the Communities switcher (same shape as followed communities). */
export async function listChallengePageCommunities() {
  const pages = await listChallengePages();
  return pages.map((page) => ({
    id: page.id,
    name: page.name,
    description: page.bio,
    image_url: page.logo || null,
    created_at: page.created_at,
    invite_code: null,
    is_open: true,
    followed_at: page.created_at,
    status: "approved",
    community_type_name: page.type === STATE_TOURISM_TYPE ? "State" : page.type,
    role_name: "Member",
    source: "challenge_page",
    kind_label: pageKindLabel(page.name, page.type),
  }));
}

/** Page header data plus its districts as a GeoJSON FeatureCollection; null if not a challenge page. */
export async function getChallengePage(pageId) {
  const [row] = await pageQuery()
    .where(and(eq(PAGES.id, pageId), eq(PAGE_TYPES.category, CHALLENGE_PAGE_TYPE_CATEGORY)))
    .limit(1);
  if (!row) return null;

  const districts = await db
    .select({ id: DISTRICTS.id, name: DISTRICTS.name, geojson: DISTRICTS.geojson })
    .from(DISTRICTS)
    .where(eq(DISTRICTS.page_id, pageId))
    .orderBy(asc(DISTRICTS.id));

  const features = districts
    .map((d) => ({ district: d, geometry: parseJson(d.geojson) }))
    .filter(({ geometry }) => geometry && ["Polygon", "MultiPolygon"].includes(geometry.type))
    .map(({ district, geometry }) => ({
      type: "Feature",
      properties: { name: district.name, district_id: district.id },
      geometry,
    }));

  return { page: toPageMeta(row), geofence: { type: "FeatureCollection", features } };
}

// ---------------------------------------------------------------------------
// Items

const itemColumns = {
  id: CHALLENGES.id,
  page_id: CHALLENGES.page_id,
  district_id: CHALLENGES.district_id,
  title: CHALLENGES.title,
  description: CHALLENGES.description,
  category: CHALLENGES.category,
  frequency: CHALLENGES.frequency,
  exp_type: CHALLENGES.exp_type,
  logo_url: CHALLENGES.logo_url,
  details: CHALLENGES.details,
  entry_points: CHALLENGES.entry_points,
  reward_points: CHALLENGES.reward_points,
  participants_count: CHALLENGES.participants_count,
  latitude: CHALLENGES.latitude,
  longitude: CHALLENGES.longitude,
  radius_meters: CHALLENGES.radius_meters,
  district_name: DISTRICTS.name,
  district_lat: DISTRICTS.latitude,
  district_lng: DISTRICTS.longitude,
};

/** The card/detail shape CommunityView renders. latitude/longitude are the real location. */
function toItem(row, image) {
  const details = parseJson(row.details) || {};
  const entry = row.entry_points || 0;
  return {
    id: row.id,
    page_id: row.page_id,
    district_id: row.district_id,
    district: row.district_name || null,
    title: row.title,
    description: row.description,
    category: challengeCategory(row),
    tags: Array.isArray(details.tags) ? details.tags : [],
    logo: row.logo_url || null,
    image: image || null,
    entry_points: entry,
    reward_points: row.reward_points || 0,
    entryFee: entry > 0 ? `${entry} points` : "Free",
    prize: `${row.reward_points || 0} Points`,
    price: details.price || null,
    foodName: details.food_name || null,
    rating: details.rating || null,
    duration: details.duration || null,
    date: details.event_date || null,
    hours: details.hours || null,
    participants: row.participants_count || 0,
    radius_meters: row.radius_meters || null,
    latitude: toNumber(row.latitude) ?? toNumber(row.district_lat),
    longitude: toNumber(row.longitude) ?? toNumber(row.district_lng),
  };
}

async function firstImages(challengeIds) {
  if (!challengeIds.length) return new Map();
  const media = await db
    .select({ challenge_id: CHALLENGE_MEDIA.challenge_id, url: CHALLENGE_MEDIA.media_url })
    .from(CHALLENGE_MEDIA)
    .where(and(inArray(CHALLENGE_MEDIA.challenge_id, challengeIds), eq(CHALLENGE_MEDIA.media_type, "image")))
    .orderBy(asc(CHALLENGE_MEDIA.display_order), asc(CHALLENGE_MEDIA.id));
  const images = new Map();
  for (const m of media) if (!images.has(m.challenge_id)) images.set(m.challenge_id, m.url);
  return images;
}

async function loadItems(where) {
  const rows = await db
    .select(itemColumns)
    .from(CHALLENGES)
    .leftJoin(DISTRICTS, eq(DISTRICTS.id, CHALLENGES.district_id))
    .where(where)
    .orderBy(asc(CHALLENGES.id));
  const images = await firstImages(rows.map((r) => r.id));
  return rows.map((r) => toItem(r, images.get(r.id)));
}

/** Active items of one district grouped by category: { Challenges: [...], Places: [...], ... } */
export async function getDistrictItems(pageId, districtId) {
  const items = await loadItems(
    and(eq(CHALLENGES.page_id, pageId), eq(CHALLENGES.district_id, districtId), eq(CHALLENGES.is_active, true))
  );
  const grouped = Object.fromEntries(CHALLENGE_CATEGORIES.map((c) => [c, []]));
  for (const item of items) (grouped[item.category] ||= []).push(item);
  return grouped;
}

// ---------------------------------------------------------------------------
// Progress (accept / complete / points)

/** What the user accepted and completed on a page, and the points they earned there. */
export async function getUserProgress(userId, pageId) {
  const rows = await db
    .select({
      challenge_id: USER_CHALLENGES.challenge_id,
      status: USER_CHALLENGES.status,
      points: USER_CHALLENGES.reward_points_earned,
      started: USER_CHALLENGES.start_date,
    })
    .from(USER_CHALLENGES)
    .innerJoin(CHALLENGES, eq(CHALLENGES.id, USER_CHALLENGES.challenge_id))
    .where(and(eq(USER_CHALLENGES.user_id, userId), eq(CHALLENGES.page_id, pageId)))
    .orderBy(asc(USER_CHALLENGES.start_date), asc(USER_CHALLENGES.id));

  const completedIds = rows.filter((r) => r.status === "completed").map((r) => r.challenge_id);
  const acceptedIds = rows.filter((r) => r.status === "accepted" || r.status === "in_progress").map((r) => r.challenge_id);
  const totalPoints = rows.filter((r) => r.status === "completed").reduce((sum, r) => sum + (r.points || 0), 0);

  let accepted = [];
  if (acceptedIds.length) {
    const items = await loadItems(inArray(CHALLENGES.id, acceptedIds));
    const byId = new Map(items.map((i) => [i.id, i]));
    accepted = acceptedIds.map((id) => byId.get(id)).filter(Boolean);
  }
  return { accepted, completedIds, totalPoints };
}

/**
 * Accept / complete a challenge for a user. Completing awards the challenge's reward
 * points once and adds the user to the People tab (with an optional proof image).
 * A completed challenge is never downgraded.
 */
export async function recordProgress(userId, challengeId, status, mediaUrl = null) {
  const [challenge] = await db
    .select({ id: CHALLENGES.id, reward_points: CHALLENGES.reward_points, is_active: CHALLENGES.is_active })
    .from(CHALLENGES)
    .where(eq(CHALLENGES.id, challengeId))
    .limit(1);
  if (!challenge) return { error: "Challenge not found", code: 404 };

  const [existing] = await db
    .select()
    .from(USER_CHALLENGES)
    .where(and(eq(USER_CHALLENGES.user_id, userId), eq(USER_CHALLENGES.challenge_id, challengeId)))
    .orderBy(asc(USER_CHALLENGES.id))
    .limit(1);

  if (existing?.status === "completed") {
    return { status: "completed", pointsEarned: 0, alreadyCompleted: true };
  }
  if (!challenge.is_active) return { error: "This challenge is no longer active", code: 409 };

  const completing = status === "completed";
  const pointsEarned = completing ? challenge.reward_points || 0 : 0;
  const values = {
    status,
    is_accepted: true,
    end_date: completing ? new Date() : null,
    reward_points_earned: pointsEarned,
  };

  if (existing) {
    await db.update(USER_CHALLENGES).set(values).where(eq(USER_CHALLENGES.id, existing.id));
  } else {
    await db.insert(USER_CHALLENGES).values({ user_id: userId, challenge_id: challengeId, ...values });
    await db
      .update(CHALLENGES)
      .set({ participants_count: sql`COALESCE(${CHALLENGES.participants_count}, 0) + 1` })
      .where(eq(CHALLENGES.id, challengeId));
  }

  if (completing) {
    const [person] = await db
      .select({ id: PEOPLE_DATA.id })
      .from(PEOPLE_DATA)
      .where(and(eq(PEOPLE_DATA.challenge_id, challengeId), eq(PEOPLE_DATA.user_id, userId)))
      .limit(1);
    let peopleId = person?.id;
    if (!peopleId) {
      const [res] = await db.insert(PEOPLE_DATA).values({ challenge_id: challengeId, user_id: userId });
      peopleId = res.insertId;
    }
    if (mediaUrl) {
      await db.insert(PEOPLE_MEDIA).values({ people_data_id: peopleId, media_url: mediaUrl, media_type: "image" });
    }
  }

  return { status, pointsEarned };
}

// ---------------------------------------------------------------------------
// People & leaderboard

const avatarSql = sql`(SELECT up.profile_pic_url FROM user_profiles up WHERE up.user_id = ${USERS.id} AND up.profile_pic_url IS NOT NULL LIMIT 1)`;

/** People who completed the challenge (newest first) and the page's top scorers. */
export async function getChallengeActivity(challengeId, viewerId) {
  const [challenge] = await db
    .select({ id: CHALLENGES.id, page_id: CHALLENGES.page_id, title: CHALLENGES.title })
    .from(CHALLENGES)
    .where(eq(CHALLENGES.id, challengeId))
    .limit(1);
  if (!challenge) return null;

  const people = await db
    .select({
      id: PEOPLE_DATA.id,
      user_id: PEOPLE_DATA.user_id,
      likes: PEOPLE_DATA.like_count,
      created_at: PEOPLE_DATA.created_at,
      name: USERS.name,
      username: USERS.username,
      avatar: avatarSql,
      media: sql`(SELECT pm.media_url FROM people_media pm WHERE pm.people_data_id = ${PEOPLE_DATA.id} ORDER BY pm.id DESC LIMIT 1)`,
      caption: sql`(SELECT pm.caption FROM people_media pm WHERE pm.people_data_id = ${PEOPLE_DATA.id} ORDER BY pm.id DESC LIMIT 1)`,
      liked: viewerId
        ? sql`EXISTS (SELECT 1 FROM people_likes pl WHERE pl.people_data_id = ${PEOPLE_DATA.id} AND pl.user_id = ${viewerId})`
        : sql`0`,
    })
    .from(PEOPLE_DATA)
    .innerJoin(USERS, eq(USERS.id, PEOPLE_DATA.user_id))
    .where(eq(PEOPLE_DATA.challenge_id, challengeId))
    .orderBy(desc(PEOPLE_DATA.created_at), desc(PEOPLE_DATA.id))
    .limit(30);

  const pointsSql = sql`SUM(${USER_CHALLENGES.reward_points_earned})`;
  const leaders = await db
    .select({
      user_id: USER_CHALLENGES.user_id,
      name: USERS.name,
      username: USERS.username,
      avatar: avatarSql,
      points: pointsSql,
    })
    .from(USER_CHALLENGES)
    .innerJoin(CHALLENGES, eq(CHALLENGES.id, USER_CHALLENGES.challenge_id))
    .innerJoin(USERS, eq(USERS.id, USER_CHALLENGES.user_id))
    .where(and(eq(CHALLENGES.page_id, challenge.page_id), eq(USER_CHALLENGES.status, "completed")))
    .groupBy(USER_CHALLENGES.user_id, USERS.id, USERS.name, USERS.username)
    .orderBy(desc(pointsSql))
    .limit(10);

  return {
    people: people.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name || p.username,
      username: p.username,
      avatar: p.avatar || null,
      date: p.created_at,
      likes: p.likes || 0,
      liked: Boolean(Number(p.liked)),
      certification: p.media || null,
      caption: p.caption || null,
      description: `completed ${challenge.title}`,
      isMe: viewerId != null && p.user_id === viewerId,
    })),
    leaderboard: leaders.map((l, i) => ({
      rank: i + 1,
      user_id: l.user_id,
      name: l.name || l.username,
      avatar: l.avatar || null,
      points: Number(l.points) || 0,
      isMe: viewerId != null && l.user_id === viewerId,
    })),
  };
}

/** Like / unlike a People entry. Returns the new state, or null if the entry is gone. */
export async function togglePeopleLike(peopleId, userId) {
  const [entry] = await db.select({ id: PEOPLE_DATA.id }).from(PEOPLE_DATA).where(eq(PEOPLE_DATA.id, peopleId)).limit(1);
  if (!entry) return null;

  const [like] = await db
    .select({ id: PEOPLE_LIKES.id })
    .from(PEOPLE_LIKES)
    .where(and(eq(PEOPLE_LIKES.people_data_id, peopleId), eq(PEOPLE_LIKES.user_id, userId)))
    .limit(1);

  if (like) {
    await db.delete(PEOPLE_LIKES).where(eq(PEOPLE_LIKES.id, like.id));
  } else {
    await db.insert(PEOPLE_LIKES).values({ people_data_id: peopleId, user_id: userId });
  }
  // Recount instead of +/-1 so the stored count can't drift
  const [{ n }] = await db
    .select({ n: sql`COUNT(*)` })
    .from(PEOPLE_LIKES)
    .where(eq(PEOPLE_LIKES.people_data_id, peopleId));
  const likes = Number(n) || 0;
  await db.update(PEOPLE_DATA).set({ like_count: likes }).where(eq(PEOPLE_DATA.id, peopleId));
  return { liked: !like, likes };
}
