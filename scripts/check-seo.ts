import fs from 'fs';
import path from 'path';
import {
  GLOBAL_OG_IMAGE,
  SITE_URL,
  STATIC_INDEXABLE_ROUTES,
} from '../src/lib/seo';
import { BLOG_POSTS } from '../src/content/blog-posts';
import robots from '../src/app/robots';

const ROOT = process.cwd();
const errors: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

// 1. Validate required public brand assets & PNG 1200x630 dimensions
const ogImagePath = path.join(ROOT, 'public', 'og-image.png');
if (!fs.existsSync(ogImagePath)) {
  fail('Missing public/og-image.png');
} else {
  const buf = fs.readFileSync(ogImagePath);
  const pngSig = '89504e470d0a1a0a';
  if (buf.subarray(0, 8).toString('hex') !== pngSig) {
    fail('public/og-image.png does not have a valid PNG header');
  } else {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width !== 1200 || height !== 630) {
      fail(`public/og-image.png must be 1200x630 px (got ${width}x${height})`);
    }
  }
}

for (const asset of [
  'favicon.ico',
  'icon.png',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'logo.png',
]) {
  const full = path.join(ROOT, 'public', asset);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
    fail(`Missing or empty public brand asset: public/${asset}`);
  }
}

// 2. Validate canonical SITE_URL & GLOBAL_OG_IMAGE
if (!SITE_URL.startsWith('http://') && !SITE_URL.startsWith('https://')) {
  fail(`Invalid SITE_URL: ${SITE_URL}`);
}
if (!GLOBAL_OG_IMAGE.endsWith('/og-image.png')) {
  fail(`GLOBAL_OG_IMAGE must resolve to /og-image.png (got ${GLOBAL_OG_IMAGE})`);
}

// 3. Walk src/app for conflicting opengraph-image/twitter-image conventions or uncentralized metadata
function walkAppDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkAppDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const appFiles = walkAppDir(path.join(ROOT, 'src', 'app'));
for (const file of appFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const base = path.basename(file);

  if (/^(opengraph-image|twitter-image)\./i.test(base)) {
    fail(`Conflicting Next.js social image file found: ${rel}`);
  }

  if (base === 'page.tsx' || base === 'layout.tsx' || base === 'not-found.tsx') {
    const content = fs.readFileSync(file, 'utf8');
    if (
      content.includes('export const metadata') ||
      content.includes('export async function generateMetadata') ||
      content.includes('export function generateMetadata')
    ) {
      if (!content.includes('generateSEOMetadata')) {
        fail(`${rel} exports metadata without calling centralized generateSEOMetadata()`);
      }
    }
  }
}

// 4. Verify every static indexable route maps to an existing page.tsx with centralized metadata
function routePathToFile(routePath: string): string {
  if (routePath === '/') {
    return path.join(ROOT, 'src', 'app', 'page.tsx');
  }
  const clean = routePath.replace(/^\/+/, '');
  return path.join(ROOT, 'src', 'app', ...clean.split('/'), 'page.tsx');
}

const seenRoutes = new Set<string>();
for (const entry of STATIC_INDEXABLE_ROUTES) {
  if (seenRoutes.has(entry.path)) {
    fail(`Duplicate static indexable route in sitemap list: ${entry.path}`);
  }
  seenRoutes.add(entry.path);
  const targetPage = routePathToFile(entry.path);
  if (!fs.existsSync(targetPage)) {
    fail(`Static sitemap route ${entry.path} does not have a corresponding file (${targetPage})`);
  } else {
    const source = fs.readFileSync(targetPage, 'utf8');
    if (!source.includes('generateSEOMetadata')) {
      fail(`Indexable page for ${entry.path} is missing generateSEOMetadata()`);
    }
  }
}

// 5. Verify blog slugs are unique and non-empty
const seenSlugs = new Set<string>();
for (const post of BLOG_POSTS) {
  if (!post.slug || seenSlugs.has(post.slug)) {
    fail(`Invalid or duplicate blog post slug: ${post.slug}`);
  }
  seenSlugs.add(post.slug);
}

// 6. Verify robots rules block private paths without blocking / or /og-image.png
const robotsCfg = robots();
const rule = Array.isArray(robotsCfg.rules) ? robotsCfg.rules[0] : robotsCfg.rules;
const disallowed = Array.isArray(rule?.disallow) ? rule.disallow : [rule?.disallow || ''];
for (const requiredDisallow of ['/api/', '/admin', '/dashboard', '/orders', '/claim', '/login', '/signup']) {
  if (!disallowed.includes(requiredDisallow)) {
    fail(`robots.txt missing expected disallow rule: ${requiredDisallow}`);
  }
}
if (disallowed.includes('/og-image.png') || disallowed.includes('/')) {
  fail('robots.txt must not block / or /og-image.png');
}

if (errors.length > 0) {
  console.error('❌ SEO validation failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log(
  `✅ SEO validation passed (${STATIC_INDEXABLE_ROUTES.length} static routes, ${BLOG_POSTS.length} blog guides, OG image 1200x630 at ${GLOBAL_OG_IMAGE}).`
);

