// Builds public/geojson/pages/<slug>.json for each challenge page in
// utils/staticCommunities.js by copying its zone districts out of the state files.
// Run after changing a page's zones:  node scripts/build_challenge_page_geojson.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { CHALLENGE_PAGES } = await import(pathToFileURL(path.join(root, "utils", "staticCommunities.js")).href);

const stateCache = {};
const loadState = (state) =>
  (stateCache[state] ??= JSON.parse(readFileSync(path.join(root, "public", "geojson", `${state}.json`), "utf8")));

const outDir = path.join(root, "public", "geojson", "pages");
mkdirSync(outDir, { recursive: true });

for (const page of CHALLENGE_PAGES) {
  const features = page.zones.map((zone) => {
    const feature = loadState(zone.state).features.find((f) => f.properties?.name === zone.name);
    if (!feature) throw new Error(`${page.slug}: district "${zone.name}" not found in ${zone.state}.json`);
    if (!["Polygon", "MultiPolygon"].includes(feature.geometry?.type)) {
      throw new Error(`${page.slug}: "${zone.name}" has no polygon boundary (${feature.geometry?.type})`);
    }
    return { type: "Feature", properties: { name: zone.name, state: feature.properties.state }, geometry: feature.geometry };
  });
  const file = path.join(outDir, `${page.slug}.json`);
  writeFileSync(file, JSON.stringify({ type: "FeatureCollection", features }));
  console.log(`${page.slug}.json: ${features.length} zones`);
}
