// Generates apps/web/lib/permission-map.json from the API controllers.
// Maps every GET route to the permission its @RequirePermissions decorator demands,
// so the web client can skip requests the current JWT can never pass.
// Re-run after adding/changing controller routes: node scripts/generate-permission-map.js
const fs = require("fs");
const path = require("path");

const MODULES_DIR = path.resolve(__dirname, "../apps/api/src/modules");
const OUT_FILE = path.resolve(__dirname, "../apps/web/lib/permission-map.json");

const entries = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".controller.ts")) parse(full);
  }
}

function parse(file) {
  const src = fs.readFileSync(file, "utf8");
  const ctrlMatch = src.match(/@Controller\((?:"([^"]*)")?\)/);
  if (!ctrlMatch) return;
  const prefix = ctrlMatch[1] || "";

  // Scan decorator blocks: @Get("x") ... optionally @RequirePermissions("m.a") / @Public()
  const re = /@Get\((?:"([^"]*)")?\)([\s\S]*?)(?=\n\s*(?:@Get|@Post|@Patch|@Delete|@Put|\}\s*$))/g;
  let m;
  while ((m = re.exec(src))) {
    const sub = m[1] || "";
    const block = m[2] || "";
    if (/@Public\(\)/.test(block)) continue;
    const perm = block.match(/@RequirePermissions\("([^"]+)"/);
    if (!perm) continue;
    const route = "/" + [prefix, sub].filter(Boolean).join("/");
    // Convert Nest path params to a regex segment
    const pattern = "^" + route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:([A-Za-z0-9_]+)/g, "[^/]+") + "$";
    entries.push({ pattern, permission: perm[1] });
  }
}

walk(MODULES_DIR);
entries.sort((a, b) => a.pattern.localeCompare(b.pattern));
fs.writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2) + "\n");
console.log(`Wrote ${entries.length} GET-route permission entries to ${OUT_FILE}`);
