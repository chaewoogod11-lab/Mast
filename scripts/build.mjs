import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, lstatSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { updateResourcesPage } from './render-resources.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const pages = ['index.html', 'about.html', 'teams.html', 'resources.html'];
const sources = [...pages, 'styles.css', 'about.css', 'teams.css', 'resources.css', 'script.js', 'CNAME'];
updateResourcesPage();
const assets = new Set();
for (const file of sources) {
  const source = readFileSync(resolve(root, file), 'utf8');
  for (const pattern of [/src=["'](assets\/[^"']+)["']/g, /url\(["'](assets\/[^"']+)["']\)/g, /url\((assets\/[^)]+)\)/g]) {
    for (const match of source.matchAll(pattern)) assets.add(match[1]);
  }
}
for (const asset of assets) {
  if (!/^assets\/[^/]+\.(?:png|jpe?g|svg|webp)$/i.test(asset) || /pknic|Gong cha\.jpg|Tim\.jpg|Choi Hyunjung\.png|Young Jae Lee\.png|Ted, Seo\.png|mast-thinking-process-study-session-1-p23\.png|strategy-test-and-learn-loop-study-session-1-p18-redacted\.png/i.test(asset)) throw new Error(`Unapproved public asset: ${asset}`);
  if (!existsSync(resolve(root, asset))) throw new Error(`Missing asset: ${asset}`);
}
// Verify approved curriculum derivatives, including the flattened redaction.
const visualManifest = JSON.parse(readFileSync(resolve(root, 'content/resource-visuals.json'), 'utf8'));
for (const visual of visualManifest) {
  if (!assets.has(visual.asset)) continue;
  if (!['Public-safe', 'Public-safe after redaction'].includes(visual.status)) throw new Error(`Visual approval missing: ${visual.asset}`);
  const digest = createHash('sha256').update(readFileSync(resolve(root, visual.asset))).digest('hex');
  if (digest !== visual.sha256) throw new Error(`Approved visual has changed: ${visual.asset}`);
}
// Only this known, non-symlink build directory may be replaced.
const output = resolve(root, 'dist');
if (relative(root, output) !== 'dist' || !output.startsWith(root + sep)) throw new Error('Unsafe output path');
if (existsSync(output) && lstatSync(output).isSymbolicLink()) throw new Error('Build output cannot be a symlink');
rmSync(output, { recursive: true, force: true });
mkdirSync(resolve(output, 'assets'), { recursive: true });
for (const file of [...sources, ...assets]) copyFileSync(resolve(root, file), resolve(output, file));
writeFileSync(resolve(output, '.nojekyll'), '');
console.log(`Built ${pages.length} pages and ${assets.size} referenced assets in dist/. CNAME preserved.`);
