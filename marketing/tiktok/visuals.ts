// SVG/HTML visuals for TikTok creatives. Every note, degree and chord name is
// computed with the app's own theory code (src/utils/theory.ts), never typed by
// hand, so a creative can't show a wrong note that the app itself wouldn't.

import {
  NOTES, OPEN_STRINGS, STRING_NAMES, SCALES, CHORDS, COLORS,
  intervalColorBucket, scaleDegreeColorBucket, intervalLongName,
} from '../../src/constants/music';
import {
  getScaleNotes, noteLabel, chordRootName, identifyCustomSelection, getChordVoicings,
} from '../../src/utils/theory';

export const PALETTE = {
  bg: '#0A0A0C',
  panel: '#14141A',
  text: '#F2F1EC',
  muted: 'rgba(242,241,236,0.55)',
  faint: 'rgba(242,241,236,0.30)',
  hair: 'rgba(255,255,255,0.08)',
  accent: '#E0CC58',
  indigo: '#6E60D9',
  orange: '#D77144',
};

type Bucket = 'root' | 'third' | 'fifth' | 'ext' | 'tone';

const DOT: Record<Bucket, { fill: string; text: string }> = {
  root:  { fill: COLORS.root.fill,      text: COLORS.root.text },
  third: { fill: COLORS.third.fill,     text: COLORS.third.text },
  fifth: { fill: COLORS.fifth.fill,     text: COLORS.fifth.text },
  ext:   { fill: COLORS.extension.fill, text: COLORS.extension.text },
  tone:  { fill: COLORS.scaleTone.fill, text: COLORS.scaleTone.text },
};

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter Tight', sans-serif";

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Chord naming ─────────────────────────────────────────────────────────────

const SHORT_SUFFIX: Record<string, string> = {
  'Major': '', 'Minor': 'm', 'Major 7': 'maj7', 'Minor 7': 'm7', 'Dominant 7': '7',
  'Dominant 9': '9', 'Major 9': 'maj9', 'Minor 9': 'm9', 'Sus2': 'sus2', 'Sus4': 'sus4',
  'Add9': 'add9', 'Minor Add9': 'm(add9)', 'Power (5)': '5', 'Half-Dim 7': 'm7♭5',
  'Dim 7': '°7', 'Diminished': '°', 'Major 6': '6', 'Minor 6': 'm6',
  'Dom 7♯9': '7♯9', 'Minor Maj7': 'm(maj7)', 'Minor 11': 'm11', 'Dominant 11': '11',
  'Major 11': 'maj11', 'Dominant 13': '13', 'Major 13': 'maj13', 'Minor 13': 'm13',
};

export function shortChordName(root: number, chordKey: string): string {
  const suffix = SHORT_SUFFIX[chordKey];
  const name = chordRootName(root, chordKey);
  return suffix === undefined ? `${name} ${chordKey}` : `${name}${suffix}`;
}

export function longChordName(root: number, chordKey: string): string {
  return `${chordRootName(root, chordKey)} ${chordKey}`;
}

// ── Shapes ───────────────────────────────────────────────────────────────────

/** Frets from low E to high e; null = muted. */
export type Shape = (number | null)[];

// App string index: 0 = high e … 5 = low E. Shapes are written low → high.
const shapeCells = (shape: Shape) =>
  shape.flatMap((f, i) => (f === null ? [] : [{ s: 5 - i, f }]));

const pcAt = (s: number, f: number) => (OPEN_STRINGS[s] + f) % 12;

export interface Identified {
  name: string;
  roles: string;       // "C (R) · E (3) · B (7) · D (9)"
  tags: string[];      // "no 5", "no root"
  root: number;
  chordKey: string;
}

/** Name a fretted shape the way Identify mode does, with the bass note as the preferred root. */
export function identifyShape(shape: Shape): Identified {
  const cells = shapeCells(shape);
  const bass = pcAt(cells[0].s, cells[0].f);  // lowest sounding string
  const pcs = [...new Set(cells.map(c => pcAt(c.s, c.f)))];
  const id = identifyCustomSelection(pcs, bass);
  if (id.kind !== 'chord') throw new Error(`Shape ${JSON.stringify(shape)} is not a chord (${id.kind})`);
  const roles = id.noteRoles
    .map(r => `${noteLabel(r.note, id.rootIdx, 'name', '', id.chordKey, 'chords')} (${r.symbol})`)
    .join(' · ');
  const tags = [...(id.omitted5 ? ['no 5'] : []), ...(id.omittedRoot ? ['no root'] : [])];
  return { name: longChordName(id.rootIdx, id.chordKey), roles, tags, root: id.rootIdx, chordKey: id.chordKey };
}

/** The most playable voicing the app offers for a chord: open shapes first, then lowest on the neck. */
export function bestVoicing(root: number, chordKey: string): Shape {
  const vs = getChordVoicings(root, chordKey);
  if (vs.length === 0) throw new Error(`No voicing for ${longChordName(root, chordKey)}`);
  const score = (v: { frets: Shape; baseFret: number }) =>
    v.frets.some(f => f === 0) ? 0 : v.baseFret;
  return [...vs].sort((a, b) => score(a) - score(b))[0].frets;
}

// ── Note context: what colour and label a pitch gets ─────────────────────────

interface Context {
  root: number;
  scale?: string;
  chord?: string;
}

function roleOf(ctx: Context, pc: number): { symbol: string; bucket: Bucket } | null {
  if (ctx.chord) {
    const ch = CHORDS[ctx.chord];
    const i = ch.intervals.map(v => v % 12).indexOf((pc - ctx.root + 12) % 12);
    if (i < 0) return null;
    const symbol = ch.intervalNames[i];
    return { symbol, bucket: intervalColorBucket(symbol) };
  }
  if (ctx.scale) {
    const i = getScaleNotes(ctx.root, ctx.scale).indexOf(pc);
    if (i < 0) return null;
    const symbol = SCALES[ctx.scale].degrees[i];
    return { symbol, bucket: scaleDegreeColorBucket(symbol) };
  }
  return null;
}

function nameOf(ctx: Context, pc: number): string {
  if (ctx.chord) return noteLabel(pc, ctx.root, 'name', '', ctx.chord, 'chords');
  if (ctx.scale) return noteLabel(pc, ctx.root, 'name', ctx.scale, '', 'scales');
  return NOTES[pc];
}

// ── Fretboard ────────────────────────────────────────────────────────────────

export type LabelMode = 'name' | 'degree' | 'question' | 'none';

export interface FretboardSpec {
  kind: 'fretboard';
  root: number;
  scale?: string;
  chord?: string;
  frets: [number, number];
  labels: LabelMode;
  /** Only draw these cells (a fretted shape) instead of every scale/chord tone in the window. */
  shape?: Shape;
  /** Explicit cells, for drills that aren't a chord. */
  cells?: { s: number; f: number }[];
  /** One highlighted position; everything outside it dims. */
  band?: { start: number; end: number; color: string };
  /** Labelled bands above the neck (CAGED). Neighbouring shapes share frets, so they alternate between two rows. */
  bands?: { start: number; end: number; color: string; label: string }[];
  /** Mini board for list rows: no string names or fret numbers. */
  bare?: boolean;
  /** Degree symbols drawn in the accent colour; every other non-root tone goes grey. */
  emphasize?: string[];
  /** Single fill for every dot, e.g. quiz shapes where colour would give the answer away. */
  mono?: string;
  width?: number;
  stringGap?: number;
}

export function fretboardSvg(spec: FretboardSpec): string {
  const W = spec.width ?? 880;
  const SG = spec.stringGap ?? 60;
  const [start, end] = spec.frets;
  const open = start === 0;
  const first = Math.max(start, 1);
  const n = end - first + 1;

  const GUTTER = spec.bare ? SG * 0.2 : SG * 0.62;  // string names
  const OPEN_W = open ? SG * 1.1 : 0;     // open-string column left of the nut
  const TOP = spec.bands ? SG * 1.75 : SG * 0.55;
  const BOTTOM = spec.bare ? SG * 0.55 : SG * 0.8;  // fret numbers
  const cellW = (W - GUTTER - OPEN_W - SG * 0.2) / n;
  const boardTop = TOP;
  const boardH = SG * 5;
  const H = TOP + boardH + BOTTOM;
  const R = Math.min(SG * 0.42, cellW * 0.38);

  const x0 = GUTTER + OPEN_W;             // nut / first fret wire
  const fx = (f: number) => (f === 0 ? GUTTER + OPEN_W / 2 : x0 + (f - first + 0.5) * cellW);
  const sy = (s: number) => boardTop + s * SG;

  const ctx: Context = { root: spec.root, scale: spec.scale, chord: spec.chord };
  const p: string[] = [];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);

  // Board surface
  p.push(`<rect x="${x0 - (open ? 0 : 6)}" y="${boardTop - SG * 0.45}" width="${W - x0 - SG * 0.1}" height="${boardH + SG * 0.9}" rx="${SG * 0.25}" fill="${PALETTE.panel}"/>`);

  // Bands (position highlight / CAGED)
  const bandRect = (b: { start: number; end: number }) => {
    const a = Math.max(b.start, first), z = Math.min(b.end, end);
    return { x: x0 + (a - first) * cellW, w: (z - a + 1) * cellW };
  };
  if (spec.band) {
    const { x, w } = bandRect(spec.band);
    p.push(`<rect x="${x}" y="${boardTop - SG * 0.45}" width="${w}" height="${boardH + SG * 0.9}" rx="${SG * 0.2}" fill="${spec.band.color}" fill-opacity="0.16" stroke="${spec.band.color}" stroke-opacity="0.7" stroke-width="2"/>`);
  }
  [...(spec.bands ?? [])].sort((a, b) => a.start - b.start).forEach((b, i) => {
    const { x, w } = bandRect(b);
    const y = TOP - SG * (i % 2 === 0 ? 1.55 : 1.02);
    p.push(`<rect x="${x + 3}" y="${y}" width="${w - 6}" height="${SG * 0.42}" rx="${SG * 0.12}" fill="${b.color}"/>`);
    p.push(`<text x="${x + w / 2}" y="${y + SG * 0.31}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="${SG * 0.3}" fill="${PALETTE.bg}">${esc(b.label)}</text>`);
  });

  // Inlays
  for (let f = first; f <= end; f++) {
    const cx = fx(f), fill = 'rgba(255,255,255,0.07)';
    if (f % 12 === 0) {
      p.push(`<circle cx="${cx}" cy="${sy(1.5)}" r="${SG * 0.11}" fill="${fill}"/><circle cx="${cx}" cy="${sy(3.5)}" r="${SG * 0.11}" fill="${fill}"/>`);
    } else if ([3, 5, 7, 9].includes(f % 12)) {
      p.push(`<circle cx="${cx}" cy="${sy(2.5)}" r="${SG * 0.11}" fill="${fill}"/>`);
    }
  }

  // Fret wires + nut
  for (let f = first; f <= end; f++) {
    const x = x0 + (f - first + 1) * cellW;
    p.push(`<line x1="${x}" y1="${boardTop - SG * 0.3}" x2="${x}" y2="${boardTop + boardH - SG * 0.7}" stroke="rgba(255,255,255,0.13)" stroke-width="2.5"/>`);
  }
  if (open) {
    p.push(`<rect x="${x0 - 5}" y="${boardTop - SG * 0.3}" width="10" height="${boardH - SG * 0.4}" rx="3" fill="#CFCBC0"/>`);
  } else {
    p.push(`<line x1="${x0}" y1="${boardTop - SG * 0.3}" x2="${x0}" y2="${boardTop + boardH - SG * 0.7}" stroke="rgba(255,255,255,0.13)" stroke-width="2.5"/>`);
  }

  // Strings + names
  for (let s = 0; s < 6; s++) {
    const y = sy(s);
    p.push(`<line x1="${open ? GUTTER + OPEN_W * 0.15 : x0}" y1="${y}" x2="${W - SG * 0.1}" y2="${y}" stroke="rgba(242,241,236,0.30)" stroke-width="${(1.2 + s * 0.5).toFixed(1)}"/>`);
    if (!spec.bare) p.push(`<text x="${GUTTER * 0.4}" y="${y + SG * 0.12}" text-anchor="middle" font-family="${MONO}" font-size="${SG * 0.3}" fill="${PALETTE.faint}">${STRING_NAMES[s]}</text>`);
  }

  // Fret numbers
  for (let f = first; f <= end && !spec.bare; f++) {
    if (!([3, 5, 7, 9].includes(f % 12) || f % 12 === 0 || f === first || f === end)) continue;
    p.push(`<text x="${fx(f)}" y="${H - SG * 0.18}" text-anchor="middle" font-family="${MONO}" font-size="${SG * 0.3}" fill="${PALETTE.faint}">${f}</text>`);
  }

  // Which cells get a dot
  let cells: { s: number; f: number }[];
  if (spec.shape) cells = shapeCells(spec.shape);
  else if (spec.cells) cells = spec.cells;
  else {
    cells = [];
    for (let s = 0; s < 6; s++) {
      for (let f = start; f <= end; f++) if (roleOf(ctx, pcAt(s, f))) cells.push({ s, f });
    }
  }

  for (const { s, f } of cells) {
    const pc = pcAt(s, f);
    const role = roleOf(ctx, pc);
    let { fill, text } = DOT[role?.bucket ?? 'tone'];
    let r = R;
    if (spec.emphasize && role && role.bucket !== 'root') {
      if (spec.emphasize.includes(role.symbol)) {
        fill = PALETTE.orange; text = '#fff'; r = R * 1.08;
      } else {
        ({ fill, text } = DOT.tone);
      }
    }
    if (spec.mono) { fill = spec.mono; text = '#fff'; }
    const dim = spec.band && (f < spec.band.start || f > spec.band.end);
    const cx = fx(f), cy = sy(s);
    p.push(`<g opacity="${dim ? 0.2 : 1}">`);
    if (spec.emphasize?.includes(role?.symbol ?? '') && !spec.mono) {
      p.push(`<circle cx="${cx}" cy="${cy}" r="${r + SG * 0.1}" fill="none" stroke="${PALETTE.orange}" stroke-opacity="0.45" stroke-width="3"/>`);
    }
    p.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>`);
    const label =
      spec.labels === 'name' ? nameOf(ctx, pc)
      : spec.labels === 'degree' ? role?.symbol ?? ''
      : spec.labels === 'question' ? '?'
      : '';
    if (label) {
      const fs = r * (label.length > 2 ? 0.62 : label.length > 1 ? 0.78 : 0.9);
      p.push(`<text x="${cx}" y="${cy + fs * 0.36}" text-anchor="middle" font-family="${MONO}" font-weight="600" font-size="${fs.toFixed(1)}" fill="${text}">${esc(label)}</text>`);
    }
    p.push('</g>');
  }

  p.push('</svg>');
  return p.join('');
}

// ── Chord box (vertical chart) ───────────────────────────────────────────────

export interface ChordBoxSpec {
  kind: 'chordbox';
  shape: Shape;
  /** Interval context for colour + labels; omit for a quiz (mono dots, no labels). */
  root?: number;
  chord?: string;
  labels: 'interval' | 'name' | 'none';
  width?: number;
  caption?: string;
}

export function chordBoxSvg(spec: ChordBoxSpec): string {
  const W = spec.width ?? 460;
  const pressed = spec.shape.filter((f): f is number => f !== null && f > 0);
  const maxF = pressed.length ? Math.max(...pressed) : 1;
  const minF = pressed.length ? Math.min(...pressed) : 1;
  const base = maxF <= 4 ? 1 : minF;
  const rows = Math.max(4, maxF - base + 1);

  const SX = W / 6.9;                     // string spacing; room on the right for the "7fr" label
  const FY = SX * 1.18;                   // fret spacing
  const LEFT = SX * 0.45;
  const TOP = SX * 0.9 + (spec.caption ? SX * 0.9 : 0);
  const H = TOP + FY * rows + SX * 0.6;
  const R = SX * 0.36;
  const ctx: Context = { root: spec.root ?? 0, chord: spec.chord };

  const p: string[] = [];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  if (spec.caption) {
    p.push(`<text x="${LEFT + SX * 2.5}" y="${SX * 0.75}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="${SX * 0.62}" fill="${PALETTE.text}">${esc(spec.caption)}</text>`);
  }
  // Frets
  for (let r = 0; r <= rows; r++) {
    const y = TOP + r * FY;
    const nut = r === 0 && base === 1;
    p.push(`<line x1="${LEFT}" y1="${y}" x2="${LEFT + SX * 5}" y2="${y}" stroke="${nut ? '#CFCBC0' : 'rgba(255,255,255,0.18)'}" stroke-width="${nut ? SX * 0.14 : 2.5}" stroke-linecap="round"/>`);
  }
  if (base > 1) {
    p.push(`<text x="${LEFT + SX * 5.55}" y="${TOP + FY * 0.5 + SX * 0.1}" text-anchor="start" font-family="${MONO}" font-size="${SX * 0.3}" fill="${PALETTE.muted}">${base}fr</text>`);
  }
  // Strings (low E on the left)
  for (let i = 0; i < 6; i++) {
    p.push(`<line x1="${LEFT + i * SX}" y1="${TOP}" x2="${LEFT + i * SX}" y2="${TOP + rows * FY}" stroke="rgba(242,241,236,0.34)" stroke-width="${(1.2 + (5 - i) * 0.45).toFixed(1)}"/>`);
  }
  // Markers + dots
  spec.shape.forEach((f, i) => {
    const x = LEFT + i * SX;
    const my = TOP - SX * 0.42;
    if (f === null) {
      const d = SX * 0.15;
      p.push(`<path d="M${x - d} ${my - d}L${x + d} ${my + d}M${x - d} ${my + d}L${x + d} ${my - d}" stroke="${PALETTE.muted}" stroke-width="3" stroke-linecap="round"/>`);
      return;
    }
    if (f === 0) {
      p.push(`<circle cx="${x}" cy="${my}" r="${SX * 0.15}" fill="none" stroke="${PALETTE.muted}" stroke-width="3"/>`);
      return;
    }
    const s = 5 - i;
    const pc = pcAt(s, f);
    const role = spec.chord ? roleOf(ctx, pc) : null;
    const { fill, text } = spec.chord ? DOT[role?.bucket ?? 'tone'] : { fill: PALETTE.indigo, text: '#fff' };
    const cy = TOP + (f - base + 0.5) * FY;
    p.push(`<circle cx="${x}" cy="${cy}" r="${R}" fill="${fill}" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>`);
    const label = spec.labels === 'interval' ? role?.symbol ?? '' : spec.labels === 'name' ? nameOf(ctx, pc) : '';
    if (label) {
      const fs = R * (label.length > 2 ? 0.66 : label.length > 1 ? 0.8 : 0.95);
      p.push(`<text x="${x}" y="${cy + fs * 0.36}" text-anchor="middle" font-family="${MONO}" font-weight="600" font-size="${fs.toFixed(1)}" fill="${text}">${esc(label)}</text>`);
    }
  });
  p.push('</svg>');
  return p.join('');
}

// ── Interval chips / cards ───────────────────────────────────────────────────

export function chip(symbol: string, size = 64, emphasize = false): string {
  const bucket = intervalColorBucket(symbol === '1' ? 'R' : symbol);
  const { fill, text } = emphasize ? { fill: PALETTE.orange, text: '#fff' } : DOT[bucket];
  const fs = size * (symbol.length > 2 ? 0.34 : symbol.length > 1 ? 0.4 : 0.46);
  return `<span class="chip" style="width:${size}px;height:${size}px;background:${fill};color:${text};font-size:${fs}px">${esc(symbol)}</span>`;
}

/** Chips for a scale, with the grey passing tones the app uses. */
export function scaleChips(scaleKey: string, size = 60, emphasize: string[] = []): string {
  return SCALES[scaleKey].degrees.map(d => {
    if (emphasize.includes(d)) return chip(d, size, true);
    const b = scaleDegreeColorBucket(d);
    if (b !== 'tone') return chip(d === '1' ? 'R' : d, size);
    const fs = size * (d.length > 1 ? 0.4 : 0.46);
    return `<span class="chip" style="width:${size}px;height:${size}px;background:${DOT.tone.fill};color:${DOT.tone.text};font-size:${fs}px">${esc(d)}</span>`;
  }).join('');
}

export function chordChips(chordKey: string, size = 60): string {
  return CHORDS[chordKey].intervalNames.map(s => chip(s, size)).join('');
}

/** The app's interval-structure cards: coloured symbol, spelled note, long name. */
export function intervalCards(root: number, chordKey: string): string {
  const ch = CHORDS[chordKey];
  return `<div class="cards">${ch.intervals.map((iv, i) => {
    const sym = ch.intervalNames[i];
    const note = noteLabel((root + iv) % 12, root, 'name', '', chordKey, 'chords');
    return `<div class="card">${chip(sym, 92)}<div class="card-note">${esc(note)}</div><div class="card-name">${esc(intervalLongName(sym))}</div></div>`;
  }).join('')}</div>`;
}

export function identifyCard(id: Identified): string {
  return `<div class="id-card">
    <div class="id-eyebrow">This is</div>
    <div class="id-name">${esc(id.name)}${id.tags.map(t => `<span class="id-tag">${esc(t)}</span>`).join('')}</div>
    <div class="id-roles">${esc(id.roles)}</div>
  </div>`;
}
