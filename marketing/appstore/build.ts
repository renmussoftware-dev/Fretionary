// Renders the App Store product page creative assets to marketing/appstore/out/
// with headless Chrome or Edge:
//
//   header-3840x1646.png   Product page header (21:9). Apple's art-safe area is
//                          the centred 1646×661 box, so the copy lives there and
//                          the neck bleeds out to the edges for wider crops.
//   search-3840x2560.png   Search results (3:2).
//
//   npx sucrase-node marketing/appstore/build.ts
//
// Notes come from the app's own theory code via the TikTok fretboard renderer.
// Needs internet for the Google Fonts (Inter Tight, JetBrains Mono).

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { PALETTE, fretboardSvg } from '../tiktok/visuals';

const ROOT = path.resolve(__dirname);
const OUT = path.join(ROOT, 'out');
const BUILD = path.join(ROOT, '.build');

interface Asset { name: string; w: number; h: number; body: string; css: string }

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

function screenshot(browser: string, htmlFile: string, pngFile: string, w: number, h: number): Promise<void> {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fret-appstore-'));
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=10000',
    '--default-background-color=0A0A0CFF',
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

const page = (a: Asset) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800&family=JetBrains+Mono:wght@400;500;600&display=block" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${a.w}px; height: ${a.h}px; overflow: hidden; background: ${PALETTE.bg}; color: ${PALETTE.text}; }
body { position: relative; font-family: 'Inter Tight', sans-serif; -webkit-font-smoothing: antialiased; }
.headline { font-weight: 800; letter-spacing: -0.045em; line-height: 0.95; }
.accent { color: ${PALETTE.accent}; }
.mono { font-family: 'JetBrains Mono', monospace; }
${a.css}
</style>
</head>
<body>${a.body}</body>
</html>`;

// C major across the whole neck, coloured by degree like the app.
const neck = (width: number, stringGap: number, frets: [number, number]) =>
  fretboardSvg({ kind: 'fretboard', root: 0, scale: 'Major', frets, labels: 'name', width, stringGap });

const HEADER: Asset = {
  name: 'header-3840x1646',
  w: 3840, h: 1646,
  css: `
.neck { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.neck svg { display: block; }
/* Darken the centre so the copy reads; the neck stays bright toward the edges. */
.shade { position: absolute; inset: 0;
  background:
    radial-gradient(1500px 820px at 50% 50%, rgba(10,10,12,1) 0%, rgba(10,10,12,1) 52%, rgba(10,10,12,0.55) 80%, rgba(10,10,12,0.1) 100%),
    linear-gradient(180deg, rgba(10,10,12,0.55), rgba(10,10,12,0) 22%, rgba(10,10,12,0) 78%, rgba(10,10,12,0.55)); }
/* Apple's art-safe area: 1646×661, centred. */
.safe { position: absolute; left: 1097px; top: 493px; width: 1646px; height: 661px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.headline { font-size: 200px; }
.sub { font-size: 50px; color: ${PALETTE.muted}; margin-top: 44px; letter-spacing: 0.02em; }
`,
  body: `
<div class="neck">${neck(4300, 236, [0, 15])}</div>
<div class="shade"></div>
<div class="safe">
  <div class="headline">Unlock the<br><span class="accent">full neck.</span></div>
  <div class="sub mono">Every note · scale · chord</div>
</div>`,
};

const SEARCH: Asset = {
  name: 'search-3840x2560',
  w: 3840, h: 2560,
  css: `
body::before { content: ''; position: absolute; inset: 0;
  background: radial-gradient(2400px 1500px at 82% 0%, rgba(110,96,217,0.16), transparent 70%); }
.wrap { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 120px; }
.headline { font-size: 300px; text-align: center; }
.neck svg { display: block; }
.chips { display: flex; gap: 40px; }
.chip { font-size: 64px; font-weight: 500; padding: 30px 64px; border-radius: 999px;
  background: ${PALETTE.panel}; border: 2px solid ${PALETTE.hair}; color: ${PALETTE.text}; }
`,
  body: `
<div class="wrap">
  <div class="headline">Learn the fretboard.<br><span class="accent">Finally.</span></div>
  <div class="neck">${neck(3300, 160, [0, 12])}</div>
  <div class="chips mono"><span class="chip">Notes</span><span class="chip">Scales</span><span class="chip">Chords</span><span class="chip">Drills</span></div>
</div>`,
};

async function main() {
  const browser = findBrowser();
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  for (const a of [HEADER, SEARCH]) {
    const html = path.join(BUILD, `${a.name}.html`);
    fs.writeFileSync(html, page(a));
    await screenshot(browser, html, path.join(OUT, `${a.name}.png`), a.w, a.h);
    console.log(`✓ ${a.name}.png`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
