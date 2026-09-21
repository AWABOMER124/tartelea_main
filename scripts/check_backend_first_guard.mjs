import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');

const legacySupabaseAuthFiles = new Set([
  'src/lib/capacitor/push-notifications.ts',
  'src/pages/SudanAwareness.tsx',
  'src/components/notifications/NotificationBell.tsx',
  'src/components/community/PostReportDialog.tsx',
  'src/components/bookings/ServiceReviewDialog.tsx',
  'src/components/messages/DirectMessages.tsx',
  'src/components/chat/TadabburChat.tsx',
  'src/components/bookings/ServiceBookingDialog.tsx',
  'src/components/community/PostCommentsDialog.tsx',
  'src/components/admin/PinnedContentManagement.tsx',
  'src/components/community/LegacyPostDetailPage.tsx',
  'src/components/workshops/CreateWorkshopDialog.tsx',
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

const violations = [];
for (const file of walk(srcRoot)) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const source = fs.readFileSync(file, 'utf8');

  if (/supabase\.auth\.(getUser|getSession|signIn|signOut|onAuthStateChange)/.test(source)
      && !legacySupabaseAuthFiles.has(rel)) {
    violations.push(`${rel}: introduces direct Supabase auth usage; use the backend auth contract instead.`);
  }
}

if (violations.length) {
  console.error('Backend-first architecture guard failed:\n');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `Backend-first guard passed. ${legacySupabaseAuthFiles.size} known legacy auth files remain allowlisted for migration.`,
);
