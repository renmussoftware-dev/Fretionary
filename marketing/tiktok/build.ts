// Renders every creative in creatives.ts to marketing/tiktok/out/{id}.png
// (1080×1920) with headless Chrome or Edge, writes a contact sheet at
// out/index.html, and appends any new IDs to tracker.csv. Existing tracker
// rows are never touched, so your stats are safe.
//
//   npx sucrase-node marketing/tiktok/build.ts            render everything
//   npx sucrase-node marketing/tiktok/build.ts identify   only IDs containing "identify"
//
// Needs internet for the Google Fonts (Inter Tight, JetBrains Mono).

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { CREATIVES, type Creative } from './creatives';
import { renderHtml } from './templates';

const ROOT = path.resolve(__dirname);
const OUT = path.join(ROOT, 'out');
const BUILD = path.join(ROOT, '.build');
const TRACKER = path.join(ROOT, 'tracker.csv');
const ICON = pathToFileURL(path.resolve(ROOT, '../../assets/icon.png')).href;
const ID_RE = /^fret_\d{8}_[a-z]+_([ABCDE])_\d{2}$/;
const CONCURRENCY = 4;

const TRACKER_COLUMNS = [
  'id', 'angle', 'template', 'headline', 'caption', 'posted_date',
  'views', 'likes', 'comments', 'shares', 'saves', 'profile_visits', 'notes',
];

function findBrowser(): string {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ];
  const found = candidates.find(p => p && fs.existsSync(p));
  if (!found) throw new Error('No Chrome or Edge found. Set CHROME_PATH.');
  return found;
}

function screenshot(browser: string, htmlFile: string, pngFile: string): Promise<void> {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fret-tiktok-'));
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--force-device-scale-factor=1', '--window-size=1080,1920', '--virtual-time-budget=10000',
    `--user-data-dir=${profile}`, `--screenshot=${pngFile}`, pathToFileURL(htmlFile).href,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(browser, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', d => { stderr += d; });
    child.on('close', code => {
      fs.rmSync(profile, { recursive: true, force: true });
      if (code === 0 && fs.existsSync(pngFile)) resolve();
      else reject(new Error(`Render failed for ${path.basename(pngFile)} (exit ${code})\n${stderr}`));
    });
  });
}

function validate(creatives: Creative[]): void {
  const seen = new Set<string>();
  for (const c of creatives) {
    const m = ID_RE.exec(c.id);
    if (!m) throw new Error(`Bad ID format: ${c.id}`);
    if (seen.has(c.id)) throw new Error(`Duplicate ID: ${c.id}`);
    if (!c.id.includes(`_${c.angle}_`)) throw new Error(`ID ${c.id} doesn't match angle ${c.angle}`);
    seen.add(c.id);
  }
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function updateTracker(rows: { c: Creative; template: string; headline: string }[]): number {
  let existing = new Set<string>();
  let text = '';
  if (fs.existsSync(TRACKER)) {
    text = fs.readFileSync(TRACKER, 'utf8');
    existing = new Set(text.split(/\r?\n/).slice(1).map(l => l.split(',')[0]).filter(Boolean));
  } else {
    text = TRACKER_COLUMNS.join(',') + '\n';
  }
  const fresh = rows.filter(r => !existing.has(r.c.id));
  if (text.length && !text.endsWith('\n')) text += '\n';
  for (const r of fresh) {
    const cells = [r.c.id, r.c.angle, r.template, r.headline, r.c.caption, '', '', '', '', '', '', '', ''];
    text += cells.map(csvCell).join(',') + '\n';
  }
  fs.writeFileSync(TRACKER, text);
  return fresh.length;
}

function contactSheet(rows: { c: Creative; headline: string }[]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Fretionary TikTok creatives</title>
<style>
body { margin: 0; padding: 32px; background: #0A0A0C; color: #F2F1EC; font: 14px/1.4 system-ui, sans-serif; }
h1 { font-size: 22px; margin: 0 0 24px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 28px; }
figure { margin: 0; }
img { width: 100%; border-radius: 12px; display: block; border: 1px solid rgba(255,255,255,0.08); }
figcaption { margin-top: 8px; }
code { font-size: 12px; color: #E0CC58; word-break: break-all; }
p { margin: 6px 0 0; color: rgba(242,241,236,0.6); font-size: 13px; }
</style></head><body>
<h1>Fretionary TikTok creatives · ${rows.length}</h1>
<div class="grid">
${rows.map(r => `<figure><a href="${r.c.id}.png"><img src="${r.c.id}.png" loading="lazy"></a>
<figcaption><code>${r.c.id}</code><p>${esc(r.c.caption)}</p></figcaption></figure>`).join('\n')}
</div></body></html>`;
}

async function main(): Promise<void> {
  validate(CREATIVES);
  const filter = process.argv[2];
  const selected = filter ? CREATIVES.filter(c => c.id.includes(filter)) : CREATIVES;
  if (selected.length === 0) throw new Error(`No creatives match "${filter}"`);

  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  const browser = findBrowser();

  // Build every layout first so a failed content check stops the run before any rendering.
  const built = selected.map(c => {
    const layout = c.build();
    if (!c.id.includes(`_${layout.template}_`)) throw new Error(`ID ${c.id} doesn't match template ${layout.template}`);
    const html = path.join(BUILD, `${c.id}.html`);
    fs.writeFileSync(html, renderHtml(layout, ICON));
    const headline = [layout.headline, layout.accent].filter(Boolean).join(' ');
    return { c, template: layout.template, headline, html, png: path.join(OUT, `${c.id}.png`) };
  });

  let next = 0;
  const worker = async () => {
    while (next < built.length) {
      const b = built[next++];
      await screenshot(browser, b.html, b.png);
      console.log(`✓ ${b.c.id}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const all = CREATIVES.map(c => built.find(b => b.c.id === c.id)
    ?? { c, template: c.id.match(ID_RE)![1], headline: '' });
  fs.writeFileSync(path.join(OUT, 'index.html'), contactSheet(all.filter(r => fs.existsSync(path.join(OUT, `${r.c.id}.png`)))));
  const added = updateTracker(built);

  console.log(`\nRendered ${built.length} → ${OUT}`);
  console.log(`Contact sheet: ${path.join(OUT, 'index.html')}`);
  console.log(`tracker.csv: ${added} new row(s)`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
