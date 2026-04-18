import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const scanRoots = ["src", "backend/src"];
const criticalFiles = [
  "src/pages/AdminDashboard.tsx",
  "src/pages/Library.tsx",
  "src/pages/CourseDetail.tsx",
  "src/pages/Index.tsx",
  "src/pages/Courses.tsx",
  "src/pages/Community.tsx",
  "src/pages/PostDetail.tsx",
];
const legacyFiles = [
  "src/components/community/LegacyCommunityPage.tsx",
  "src/components/community/LegacyPostDetailPage.tsx",
];
const expectedMarkers = [
  {
    file: "src/integrations/supabase/client.ts",
    marker: "DO NOT USE FOR NEW FLOWS",
  },
  {
    file: "backend/src/routes/compat.routes.js",
    marker: "legacy bridge",
  },
];

const readText = (relativePath) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

const walkFiles = (relativeDir) => {
  const absoluteDir = path.join(projectRoot, relativeDir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(relativePath));
      continue;
    }

    files.push(relativePath);
  }

  return files;
};

const countPattern = (text, pattern) => {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
};

const allFiles = scanRoots.flatMap(walkFiles);
let supabaseRefCount = 0;
let supabaseRefFiles = 0;
let legacySubscriptionRefCount = 0;
let legacySubscriptionRefFiles = 0;
let failures = 0;

for (const relativePath of allFiles) {
  const text = readText(relativePath);
  const supabaseCount = countPattern(text, /supabase\./g);
  const legacyCount = countPattern(text, /monthly_subscriptions|course_subscriptions/g);

  if (supabaseCount > 0) {
    supabaseRefCount += supabaseCount;
    supabaseRefFiles += 1;
  }

  if (legacyCount > 0) {
    legacySubscriptionRefCount += legacyCount;
    legacySubscriptionRefFiles += 1;
  }
}

for (const relativePath of criticalFiles) {
  const text = readText(relativePath);
  if (/from\s+["']@\/integrations\/supabase\/client["']/.test(text) || text.includes('supabase.')) {
    console.error(`FAIL critical flow still uses Supabase directly: ${relativePath}`);
    failures += 1;
  }

  if (/monthly_subscriptions|course_subscriptions/.test(text)) {
    console.error(`FAIL critical flow still references legacy subscription tables: ${relativePath}`);
    failures += 1;
  }
}

for (const relativePath of legacyFiles) {
  const text = readText(relativePath);
  if (!text.includes("DO NOT USE - LEGACY")) {
    console.error(`FAIL legacy freeze marker missing: ${relativePath}`);
    failures += 1;
  }
}

for (const item of expectedMarkers) {
  const text = readText(item.file);
  if (!text.toLowerCase().includes(item.marker.toLowerCase())) {
    console.error(`FAIL transition marker missing in ${item.file}: ${item.marker}`);
    failures += 1;
  }
}

console.log("Transition closure inventory");
console.log(`- Supabase direct references: ${supabaseRefCount} across ${supabaseRefFiles} files`);
console.log(`- Legacy subscription table references: ${legacySubscriptionRefCount} across ${legacySubscriptionRefFiles} files`);
console.log(`- Critical flows checked: ${criticalFiles.length}`);
console.log(`- Legacy freeze files checked: ${legacyFiles.length}`);

if (failures > 0) {
  console.error(`Transition guardrail failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Transition guardrail passed.");
