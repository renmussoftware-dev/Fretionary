// Four layouts, all 1080×1920 (9:16). Content stays inside .safe, clear of
// TikTok's top tabs, right-hand action rail and bottom caption overlay.
// Anything that overflows its box gets a red outline in the render, so copy
// that's too long is obvious in the contact sheet.

import { PALETTE } from './visuals';

export interface Row {
  lead?: string;     // HTML: a big letter/number or a chip
  title: string;
  detail?: string;
  right?: string;    // HTML: chips or a mini visual
}

export type Layout =
  | { template: 'A'; eyebrow: string; headline: string; accent: string; sub: string; visual: string }
  | { template: 'B'; eyebrow: string; headline: string; accent: string; visual: string; hint: string; answer: string }
  | { template: 'C'; eyebrow: string; headline: string; accent?: string; sub?: string; rows: Row[]; stacked?: boolean }
  | { template: 'D'; eyebrow: string; headline: string; accent: string; before: Panel; after: Panel }
  | { template: 'E'; headline: string; accent: string; sub?: string; visual: string; bullets?: string[]; cta: string };

/** One half of a before/after comparison. */
export interface Panel {
  label: string;
  visual: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = `
:root {
  --bg: ${PALETTE.bg}; --panel: ${PALETTE.panel}; --text: ${PALETTE.text};
  --muted: ${PALETTE.muted}; --faint: ${PALETTE.faint}; --hair: ${PALETTE.hair};
  --accent: ${PALETTE.accent};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: var(--bg); color: var(--text); }
body { position: relative; font-family: 'Inter Tight', sans-serif; -webkit-font-smoothing: antialiased; }
body::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(900px 700px at 85% 8%, rgba(110,96,217,0.10), transparent 70%);
}

/* TikTok chrome: tabs above y≈160, action rail right of x≈940 (y 800–1500),
   caption + sound bar below y≈1600. */
.safe { position: absolute; top: 170px; left: 80px; right: 80px; bottom: 320px;
        display: flex; flex-direction: column; overflow: hidden; }
.copy { max-width: 900px; }

.eyebrow { font: 500 28px/1.2 'JetBrains Mono', monospace; letter-spacing: 0.12em;
           text-transform: uppercase; color: var(--muted); margin-bottom: 26px; }
.headline { font-weight: 800; font-size: 112px; line-height: 0.95; letter-spacing: -0.045em; }
.headline .accent { display: block; color: var(--accent); }
.sub { font: 400 34px/1.42 'JetBrains Mono', monospace; color: var(--muted); margin-top: 30px; }

.visual { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 36px; }

.lockup { display: flex; align-items: center; gap: 24px; flex: none; margin-top: 20px; }
.lockup img { width: 80px; height: 80px; border-radius: 19px; }
.lockup .name { font-weight: 800; font-size: 48px; line-height: 1.1; letter-spacing: -0.03em; }
.lockup .tag { font: 400 24px/1.3 'JetBrains Mono', monospace; color: var(--muted); margin-top: 4px; }

.chip { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px;
        font-family: 'JetBrains Mono', monospace; font-weight: 600; flex: none; }
.chips { display: flex; gap: 10px; flex-wrap: nowrap; }

/* Interval cards */
.cards { display: flex; gap: 18px; justify-content: center; }
.card { display: flex; flex-direction: column; align-items: center; width: 164px; padding: 26px 0 22px;
        background: var(--panel); border: 1px solid var(--hair); border-radius: 26px; }
.card-note { font: 600 40px/1 'JetBrains Mono', monospace; margin-top: 18px; }
.card-name { font: 400 22px/1.2 'JetBrains Mono', monospace; color: var(--muted); margin-top: 10px; text-align: center; }

/* Identify result */
.id-card { width: 840px; padding: 34px 40px; background: var(--panel); border: 1px solid var(--hair); border-radius: 30px; }
.id-eyebrow { font: 500 24px/1 'JetBrains Mono', monospace; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
.id-name { font-weight: 800; font-size: 64px; letter-spacing: -0.03em; margin-top: 14px; display: flex; align-items: center; gap: 18px; }
.id-tag { font: 500 24px/1 'JetBrains Mono', monospace; color: var(--accent); border: 1.5px solid var(--accent);
          border-radius: 999px; padding: 8px 14px; letter-spacing: 0; }
.id-roles { font: 400 29px/1.4 'JetBrains Mono', monospace; color: var(--muted); margin-top: 14px; }

/* Note pills (practice drills) */
.pills { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; width: 840px; }
.pill { font: 500 32px/1 'JetBrains Mono', monospace; text-align: center; padding: 20px 0;
        background: var(--panel); border: 1px solid var(--hair); border-radius: 999px; }

/* Chord grid (progressions) */
.grid { display: grid; grid-template-columns: repeat(2, auto); gap: 8px 56px; }

/* Before / after */
.compare { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: 34px; }
.panel-label { font: 500 27px/1.2 'JetBrains Mono', monospace; letter-spacing: 0.1em; text-transform: uppercase;
               color: var(--muted); margin-bottom: 10px; }
.panel.after .panel-label { color: var(--accent); }

/* Direct response: one promise, one picture, one call to action */
.direct .headline { font-size: 128px; }
.bullets { display: flex; flex-direction: column; gap: 18px; width: 900px; }
.bullet { display: flex; align-items: center; gap: 20px; font-weight: 800; font-size: 42px; letter-spacing: -0.02em; }
/* Button sits left, above the logo: TikTok's sound disc and action rail cover the bottom right. */
.cta-row { display: flex; flex-direction: column; align-items: flex-start; gap: 22px; flex: none; margin-top: 24px; }
.cta-row .lockup { margin-top: 0; }
.cta { flex: none; background: var(--accent); color: #1E1A06; font-weight: 800; font-size: 36px; letter-spacing: -0.01em;
       padding: 26px 40px; border-radius: 999px; white-space: nowrap; }

/* Colour legend */
.legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px 30px; width: 900px; }
.legend-item { display: flex; align-items: center; gap: 12px; font: 500 28px/1 'JetBrains Mono', monospace; }

/* Quiz */
.quiz-foot { display: flex; flex-direction: column; align-items: center; gap: 18px; flex: none; }
.hint { font: 500 28px/1 'JetBrains Mono', monospace; color: var(--muted); letter-spacing: 0.04em; }
.answer { font: 600 34px/1.2 'JetBrains Mono', monospace; color: var(--faint); transform: rotate(180deg); }

/* Cheat sheet */
.sheet .headline { font-size: 96px; }
.rows { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: 14px; margin-top: 30px; }
.row { display: flex; align-items: center; gap: 24px; background: var(--panel); border: 1px solid var(--hair);
       border-radius: 24px; padding: 16px 24px; }
.row .lead { flex: none; width: 88px; display: flex; justify-content: center;
             font-weight: 800; font-size: 62px; letter-spacing: -0.03em; }
.row .main { flex: 1 1 auto; min-width: 0; }
.row .title { font-weight: 800; font-size: 40px; letter-spacing: -0.02em; white-space: nowrap; }
.row .detail { font: 400 27px/1.3 'JetBrains Mono', monospace; color: var(--muted); margin-top: 6px; }
.row .right { flex: none; }
.rows.stacked .row { flex-direction: column; align-items: stretch; gap: 10px; padding: 16px 22px 8px; }
.rows.stacked .row .head { display: flex; align-items: baseline; gap: 18px; }
.rows.stacked .row .title { font-size: 34px; }
.rows.stacked .row .detail { margin-top: 0; }
`;

const FIT_CHECK = `
const flag = el => { el.style.outline = '8px solid #ff2a2a'; el.style.outlineOffset = '-8px'; };
document.fonts.ready.then(() => {
  // Text: only sideways overflow counts (tight line-heights always "overflow" vertically).
  for (const el of document.querySelectorAll('.fit')) {
    if (el.scrollWidth > el.clientWidth + 4) flag(el);
  }
  // Containers: content taller than the space it was given.
  for (const el of document.querySelectorAll('.safe, .visual, .rows, .compare')) {
    if (el.scrollHeight > el.clientHeight + 4) flag(el);
  }
});`;

function lockup(iconUrl: string): string {
  return `<footer class="lockup">
    <img src="${iconUrl}" alt="">
    <div><div class="name">Fretionary</div><div class="tag">The fretboard dictionary</div></div>
  </footer>`;
}

function body(layout: Layout, iconUrl: string): string {
  switch (layout.template) {
    case 'A':
      return `<main class="safe">
        <div class="copy">
          <div class="eyebrow fit">${esc(layout.eyebrow)}</div>
          <h1 class="headline fit">${esc(layout.headline)}<span class="accent">${esc(layout.accent)}</span></h1>
          <p class="sub fit">${esc(layout.sub)}</p>
        </div>
        <div class="visual">${layout.visual}</div>
        ${lockup(iconUrl)}
      </main>`;
    case 'B':
      return `<main class="safe">
        <div class="copy">
          <div class="eyebrow fit">${esc(layout.eyebrow)}</div>
          <h1 class="headline fit">${esc(layout.headline)}<span class="accent">${esc(layout.accent)}</span></h1>
        </div>
        <div class="visual">${layout.visual}</div>
        <div class="quiz-foot">
          <div class="hint">${esc(layout.hint)}</div>
          <div class="answer">${esc(layout.answer)}</div>
        </div>
        ${lockup(iconUrl)}
      </main>`;
    case 'C':
      return `<main class="safe sheet">
        <div class="copy">
          <div class="eyebrow fit">${esc(layout.eyebrow)}</div>
          <h1 class="headline fit">${esc(layout.headline)}${layout.accent ? `<span class="accent">${esc(layout.accent)}</span>` : ''}</h1>
          ${layout.sub ? `<p class="sub fit">${esc(layout.sub)}</p>` : ''}
        </div>
        <div class="rows${layout.stacked ? ' stacked' : ''}">
          ${layout.rows.map(r => layout.stacked
            ? `<div class="row"><div class="head"><div class="title">${esc(r.title)}</div>${r.detail ? `<div class="detail">${esc(r.detail)}</div>` : ''}</div>${r.right ?? ''}</div>`
            : `<div class="row">
                ${r.lead ? `<div class="lead">${r.lead}</div>` : ''}
                <div class="main"><div class="title fit">${esc(r.title)}</div>${r.detail ? `<div class="detail">${esc(r.detail)}</div>` : ''}</div>
                ${r.right ? `<div class="right">${r.right}</div>` : ''}
              </div>`).join('')}
        </div>
        ${lockup(iconUrl)}
      </main>`;
    case 'D':
      return `<main class="safe">
        <div class="copy">
          <div class="eyebrow fit">${esc(layout.eyebrow)}</div>
          <h1 class="headline fit">${esc(layout.headline)}<span class="accent">${esc(layout.accent)}</span></h1>
        </div>
        <div class="compare">
          <div class="panel before"><div class="panel-label">${esc(layout.before.label)}</div>${layout.before.visual}</div>
          <div class="panel after"><div class="panel-label">${esc(layout.after.label)}</div>${layout.after.visual}</div>
        </div>
        ${lockup(iconUrl)}
      </main>`;
    case 'E':
      return `<main class="safe direct">
        <div class="copy">
          <h1 class="headline fit">${esc(layout.headline)}<span class="accent">${esc(layout.accent)}</span></h1>
          ${layout.sub ? `<p class="sub fit">${esc(layout.sub)}</p>` : ''}
        </div>
        <div class="visual">
          ${layout.visual}
          ${layout.bullets ? `<div class="bullets">${layout.bullets.map(b => `<div class="bullet fit">${BULLET_ICON}<span>${esc(b)}</span></div>`).join('')}</div>` : ''}
        </div>
        <div class="cta-row"><div class="cta">${esc(layout.cta)}</div>${lockup(iconUrl)}</div>
      </main>`;
  }
}

const BULLET_ICON = `<svg width="44" height="44" viewBox="0 0 44 44" style="flex:none"><circle cx="22" cy="22" r="21" fill="${PALETTE.accent}"/><path d="M12.5 22.5l6.5 6.5 12.5-13" fill="none" stroke="#1E1A06" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function renderHtml(layout: Layout, iconUrl: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800&family=JetBrains+Mono:wght@400;500;600&display=block" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${body(layout, iconUrl)}
<script>${FIT_CHECK}</script>
</body>
</html>`;
}
