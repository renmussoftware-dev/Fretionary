import { NOTES, OPEN_STRINGS, STRING_NAMES } from '../constants/music';

// ── Custom fretboard maps (the "Maps" builder in Tools) ─────────────────────
// A map is a hand-placed set of colored dots at specific string/fret
// positions — unlike the Identify tab, which works in pitch classes and
// lights every octave of a note, a map marks exactly the positions the user
// tapped. That's what "show somebody something specific on the fretboard"
// needs: a lick, a fingering, a voicing region.
//
// STRING INDEX CONVENTION: dot.s indexes OPEN_STRINGS, so s=0 is the HIGH e
// and s=5 the low E — the same convention as Fretboard.tsx and the opposite
// of voicings.ts (whose templates are low-E-first). The two conventions
// drifting silently is exactly what broke the CAGED spans, so if you touch
// this file, keep every consumer on OPEN_STRINGS order.

// horizontal = nut on the left, strings run across (the app's fretboard).
// vertical = nut on top, strings run down — classic printed chord-chart
// orientation, low E on the LEFT (chart convention, not screen convention).
export type MapOrientation = 'horizontal' | 'vertical';

export interface MapDot {
  s: number;              // string index, 0 = high e (OPEN_STRINGS order)
  f: number;              // absolute fret, 0 = open
  color: string;          // dot fill, hex
  label?: string;         // shown on the dot; omitted → note name at render
}

export interface FretMap {
  id: string;
  name: string;
  dots: MapDot[];
  fretStart: number;      // inclusive window
  fretEnd: number;
  showLabels: boolean;
  // Absent on maps saved before orientation existed → horizontal.
  orientation?: MapOrientation;
  createdAt: number;
  updatedAt: number;
}

// Brush palette. First four mirror the app's interval colors (root yellow /
// third red / fifth green / extension blue) so seeded maps read like the
// rest of the app; the rest are extra brushes for freeform diagrams.
export const MAP_PALETTE = [
  '#E8D44D', // yellow (root)
  '#E24B4A', // red (3rd)
  '#1D9E75', // green (5th)
  '#378ADD', // blue (extension)
  '#8B5CF6', // purple
  '#E88A2E', // orange
  '#6B7280', // gray
  '#E8E6E1', // bone
] as const;

// ── Geometry ────────────────────────────────────────────────────────────────
// One object drives both the SVG drawing and the builder's tap targets, so
// hits can't drift from the picture. cell() accepts fractional s/f — the
// inlay markers sit between strings (s=1.5, 2.5, 3.5).

const H = {
  L: 34,     // left gutter (string names)
  T: 14,     // top padding
  B: 26,     // bottom strip (fret numbers)
  FW: 56,    // fret cell width
  OW: 40,    // open-note column width (only when the window starts at 0)
  SH: 34,    // string spacing
  NUT: 6,    // nut width
  R: 12,     // right padding
};

const V = {
  T: 30,     // top strip (string names)
  L: 30,     // left gutter (fret numbers)
  R: 12,     // right padding
  B: 14,     // bottom padding
  SW: 36,    // string spacing (horizontal, across)
  FH: 44,    // fret cell height
  OH: 34,    // open-note row height (only when the window starts at 0)
  NUT: 6,    // nut height
};

const DOT_R = 13;

export interface DiagramGeometry {
  width: number;
  height: number;
  // Center of the cell for (s, f) in SVG coordinates. Fractional s/f OK.
  cell: (s: number, f: number) => { x: number; y: number };
  // Inverse: point → cell, or null outside the grid. Used by the tap handler.
  cellForPoint: (x: number, y: number) => { s: number; f: number } | null;
  frets: number[]; // the fret columns/rows this window renders, in order
}

export function diagramGeometry(
  fretStart: number,
  fretEnd: number,
  orientation: MapOrientation = 'horizontal',
): DiagramGeometry {
  const openCol = fretStart === 0;
  const firstFret = openCol ? 1 : fretStart;
  const frets: number[] = [];
  if (openCol) frets.push(0);
  for (let f = firstFret; f <= fretEnd; f++) frets.push(f);
  const nFrets = fretEnd - firstFret + 1;

  if (orientation === 'horizontal') {
    const gridLeft = H.L + (openCol ? H.OW + H.NUT : 0);
    const width = gridLeft + nFrets * H.FW + H.R;
    const height = H.T + 5 * H.SH + H.B;

    const cell = (s: number, f: number) => ({
      x: f === 0 ? H.L + H.OW / 2 : gridLeft + (f - firstFret) * H.FW + H.FW / 2,
      y: H.T + s * H.SH,
    });
    const cellForPoint = (x: number, y: number) => {
      const s = Math.round((y - H.T) / H.SH);
      if (s < 0 || s > 5) return null;
      if (openCol && x >= H.L && x < H.L + H.OW) return { s, f: 0 };
      if (x >= gridLeft && x < gridLeft + nFrets * H.FW) {
        return { s, f: firstFret + Math.floor((x - gridLeft) / H.FW) };
      }
      return null;
    };
    return { width, height, cell, cellForPoint, frets };
  }

  // Vertical: low E leftmost (chord-chart convention), so x runs by (5 - s).
  const gridTop = V.T + (openCol ? V.OH + V.NUT : 0);
  const width = V.L + 5 * V.SW + V.R;
  const height = gridTop + nFrets * V.FH + V.B;

  const cell = (s: number, f: number) => ({
    x: V.L + (5 - s) * V.SW,
    y: f === 0 ? V.T + V.OH / 2 : gridTop + (f - firstFret) * V.FH + V.FH / 2,
  });
  const cellForPoint = (x: number, y: number) => {
    const s = 5 - Math.round((x - V.L) / V.SW);
    if (s < 0 || s > 5) return null;
    if (openCol && y >= V.T && y < V.T + V.OH) return { s, f: 0 };
    if (y >= gridTop && y < gridTop + nFrets * V.FH) {
      return { s, f: firstFret + Math.floor((y - gridTop) / V.FH) };
    }
    return null;
  };
  return { width, height, cell, cellForPoint, frets };
}

// ── Rendering ───────────────────────────────────────────────────────────────

export type DiagramTheme = 'dark' | 'light';

// Dark mirrors the app's fretboard; light is for PDF export (print on white).
const THEMES = {
  dark: {
    bg: 'none',
    string: '#3A3A46', fret: '#2E2E38', nut: '#888680',
    inlay: '#252528', text: '#888680', fretNum: '#4A4A54',
  },
  light: {
    bg: '#FFFFFF',
    string: '#B9B4AC', fret: '#D8D4CC', nut: '#4A453E',
    inlay: '#EDEAE4', text: '#6B675F', fretNum: '#A09A90',
  },
};

const INLAY_SINGLE = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const INLAY_DOUBLE = new Set([12, 24]);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Dark text on light dots, white on dark dots — the same dot hex is used in
// both themes, so contrast comes from the dot itself, not the theme.
function labelColorOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? '#26221B' : '#FFFFFF';
}

export function dotDefaultLabel(dot: MapDot): string {
  return NOTES[(OPEN_STRINGS[dot.s] + dot.f) % 12];
}

/**
 * Render a map to an SVG string. The same function backs the on-screen
 * builder preview (via SvgXml, dark theme) and the PDF export (light theme
 * embedded in printed HTML) — one renderer means the export is exactly what
 * the user saw, minus the color inversion for paper.
 *
 * Both orientations draw labels upright — the vertical layout is its own
 * geometry, not a rotation, so nothing ends up sideways.
 */
export function renderDiagramSvg(map: FretMap, theme: DiagramTheme): string {
  const t = THEMES[theme];
  const vertical = map.orientation === 'vertical';
  const g = diagramGeometry(map.fretStart, map.fretEnd, map.orientation ?? 'horizontal');
  const openCol = map.fretStart === 0;
  const firstFret = openCol ? 1 : map.fretStart;
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}">`);
  if (t.bg !== 'none') parts.push(`<rect width="${g.width}" height="${g.height}" fill="${t.bg}"/>`);

  // Inlays behind everything else — between the middle strings.
  for (const f of g.frets) {
    if (f === 0) continue;
    if (INLAY_DOUBLE.has(f)) {
      const a = g.cell(1.5, f), b = g.cell(3.5, f);
      parts.push(`<circle cx="${a.x}" cy="${a.y}" r="4" fill="${t.inlay}"/>`);
      parts.push(`<circle cx="${b.x}" cy="${b.y}" r="4" fill="${t.inlay}"/>`);
    } else if (INLAY_SINGLE.has(f)) {
      const c = g.cell(2.5, f);
      parts.push(`<circle cx="${c.x}" cy="${c.y}" r="4" fill="${t.inlay}"/>`);
    }
  }

  // Strings + their name labels. Gauge grows toward the low E in both
  // orientations (s=5 is thickest).
  const gridNear = g.cell(0, firstFret); // first fretted cell, high-e corner
  for (let s = 0; s < 6; s++) {
    const w = (0.8 + s * 0.35).toFixed(2);
    if (vertical) {
      const x = g.cell(s, firstFret).x;
      const y1 = openCol ? V.T + V.OH : V.T;
      parts.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${g.height - V.B}" stroke="${t.string}" stroke-width="${w}"/>`);
      parts.push(`<text x="${x}" y="${V.T - 10}" text-anchor="middle" font-size="11" font-family="Menlo, monospace" fill="${t.text}">${STRING_NAMES[s]}</text>`);
    } else {
      const y = g.cell(s, firstFret).y;
      const x1 = H.L + (openCol ? H.OW : 0);
      parts.push(`<line x1="${x1}" y1="${y}" x2="${g.width - H.R}" y2="${y}" stroke="${t.string}" stroke-width="${w}"/>`);
      parts.push(`<text x="${H.L - 10}" y="${y + 4}" text-anchor="middle" font-size="11" font-family="Menlo, monospace" fill="${t.text}">${STRING_NAMES[s]}</text>`);
    }
  }

  // Nut (only when the window includes the open position) + fret wires.
  const lowX = g.cell(5, firstFret).x, highX = g.cell(0, firstFret).x;
  if (vertical) {
    const left = Math.min(lowX, highX) - 9, span = Math.abs(highX - lowX) + 18;
    if (openCol) {
      parts.push(`<rect x="${left}" y="${V.T + V.OH}" width="${span}" height="${V.NUT}" rx="2" fill="${t.nut}"/>`);
    }
    for (let f = firstFret; f <= map.fretEnd; f++) {
      const y = g.cell(0, f).y + V.FH / 2;
      parts.push(`<line x1="${left}" y1="${y}" x2="${left + span}" y2="${y}" stroke="${t.fret}" stroke-width="1.5"/>`);
    }
  } else {
    const top = gridNear.y - 9, span = 5 * H.SH + 18;
    if (openCol) {
      parts.push(`<rect x="${H.L + H.OW}" y="${top}" width="${H.NUT}" height="${span}" rx="2" fill="${t.nut}"/>`);
    }
    for (let f = firstFret; f <= map.fretEnd; f++) {
      const x = g.cell(0, f).x + H.FW / 2;
      parts.push(`<line x1="${x}" y1="${top + 2}" x2="${x}" y2="${top + span - 2}" stroke="${t.fret}" stroke-width="1.5"/>`);
    }
  }

  // Fret numbers at marker frets + window edges — below the board when
  // horizontal, down the left edge when vertical.
  for (const f of g.frets) {
    if (f === 0 || !(INLAY_SINGLE.has(f) || INLAY_DOUBLE.has(f) || f === firstFret || f === map.fretEnd)) continue;
    if (vertical) {
      parts.push(`<text x="${V.L - 14}" y="${g.cell(0, f).y + 3.5}" text-anchor="middle" font-size="10" font-family="Menlo, monospace" fill="${t.fretNum}">${f}</text>`);
    } else {
      parts.push(`<text x="${g.cell(0, f).x}" y="${g.height - 8}" text-anchor="middle" font-size="10" font-family="Menlo, monospace" fill="${t.fretNum}">${f}</text>`);
    }
  }

  // Dots — drawn last, on top.
  for (const dot of map.dots) {
    if (dot.f < map.fretStart || dot.f > map.fretEnd) continue;
    const { x, y } = g.cell(dot.s, dot.f);
    parts.push(`<circle cx="${x}" cy="${y}" r="${DOT_R}" fill="${dot.color}" stroke="${labelColorOn(dot.color) === '#FFFFFF' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}" stroke-width="1"/>`);
    if (map.showLabels) {
      const label = dot.label ?? dotDefaultLabel(dot);
      parts.push(`<text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="${label.length > 2 ? 8 : 10}" font-weight="600" font-family="-apple-system, Helvetica, sans-serif" fill="${labelColorOn(dot.color)}">${esc(label)}</text>`);
    }
  }

  parts.push('</svg>');
  return parts.join('');
}

// Demo map for the non-Pro preview: an A minor pentatonic box 1 fragment
// with a highlighted root — a real render of the feature, not a mockup.
export function demoMap(): FretMap {
  const dots: MapDot[] = [];
  const box: [number, number[]][] = [
    [0, [5, 8]], [1, [5, 8]], [2, [5, 7]], [3, [5, 7]], [4, [5, 7]], [5, [5, 8]],
  ];
  for (const [s, frets] of box) {
    for (const f of frets) {
      const pc = (OPEN_STRINGS[s] + f) % 12;
      dots.push({ s, f, color: pc === 9 ? '#E8D44D' : '#378ADD' });
    }
  }
  return {
    id: 'demo', name: 'Am pentatonic · box 1', dots,
    fretStart: 4, fretEnd: 9, showLabels: true, createdAt: 0, updatedAt: 0,
  };
}
