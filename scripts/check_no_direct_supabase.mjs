import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const allowed = new Set([
  "src/integrations/supabase/client.ts",
  "src/integrations/supabase/types.ts",
]);

const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;

    const rel = path.relative(root, full).replaceAll("\\", "/");
    if (allowed.has(rel)) continue;

    const source = fs.readFileSync(full, "utf8");
    const directPatterns = [
      /from\s+["']@\/integrations\/supabase\/client["']/,
      /import\s+["']@\/integrations\/supabase\/client["']/,
      /\bsupabase\.auth\./,
      /\bsupabase\.from\s*\(/,
      /\bsupabase\.storage\./,
      /\bsupabase\.functions\./,
    ];

    if (directPatterns.some((pattern) => pattern.test(source))) {
      violations.push(rel);
    }
  }
}

walk(srcRoot);

if (violations.length) {
  console.error("Direct Supabase client access is forbidden outside the integration adapter:");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log("No direct Supabase client access found in application source.");
