// The creative library. IDs are permanent: they're how results in tracker.csv
// map back to an image, so never renumber or reuse one. Add new creatives with
// a new date or the next number.
//
// ID format: fret_{YYYYMMDD}_{angle}_{template}_{nn}
//   template A = hero (headline + visual), B = quiz, C = cheat sheet, D = before/after,
//   E = direct response (one promise, one picture, call to action)

import {
  OPEN_STRINGS, NOTES, SCALES, CHORDS, CAGED_ORDER, CAGED_COLORS, CAGED_SHAPE_TIPS,
  POSITION_COLORS, COLORS,
} from '../../src/constants/music';
import { EXAMPLE_PROGRESSIONS, PROGRESSIONS } from '../../src/constants/progressions';
import {
  getCagedFretRange, getScalePositions, getScaleNotes, noteLabel, getChordVoicings,
} from '../../src/utils/theory';
import type { Layout } from './templates';
import {
  PALETTE, fretboardSvg, chordBoxSvg, intervalCards, identifyCard, identifyShape,
  bestVoicing, shortChordName, chordChips, scaleChips, chip, type Shape,
} from './visuals';

export interface Creative {
  id: string;
  angle: string;
  caption: string;
  build: () => Layout;
}

const TAGS = '#guitar #guitartok #guitartheory #guitarlesson';

function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`Content check failed: ${msg}`);
}

const answerFor = (shape: Shape) => {
  const id = identifyShape(shape);
  return id.tags.length ? `${id.name} (${id.tags.join(', ')})` : id.name;
};

const spelled = (root: number, chordKey: string) =>
  CHORDS[chordKey].intervals
    .map(iv => noteLabel((root + iv) % 12, root, 'name', '', chordKey, 'chords'))
    .join(' ');

const progression = (name: string) => {
  const p = EXAMPLE_PROGRESSIONS.find(x => x.name === name);
  if (!p) throw new Error(`No example progression named "${name}"`);
  return p;
};

// Roman numeral of a chord inside a major key: case follows the chord's 3rd.
function numeral(keyRoot: number, root: number, chordKey: string): string {
  const deg = getScaleNotes(keyRoot, 'Major').indexOf(root);
  if (deg < 0) return '♭?';
  const n = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][deg];
  return CHORDS[chordKey].intervals.includes(3) ? n.toLowerCase() : n;
}

/** Every cell in a fret window that belongs to the scale. */
function scaleCells(root: number, scale: string, from: number, to: number) {
  const notes = getScaleNotes(root, scale);
  const cells: { s: number; f: number }[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = from; f <= to; f++) if (notes.includes((OPEN_STRINGS[s] + f) % 12)) cells.push({ s, f });
  }
  return cells;
}

const CHECK_ICON = `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="${COLORS.fifth.fill}"/><path d="M16 29l8 8 16-17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CROSS_ICON = `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="${COLORS.third.fill}"/><path d="M19 19l18 18M37 19L19 37" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`;

// The "what you already know" half of a before/after: one flat grey, no labels.
const BEFORE_GREY = '#55555F';

const D = '20260916';
const D2 = '20260918';  // plateau batch: speaks to the stuck intermediate player

// Direct-response ads. No "free" (hard paywall) and no timed outcome promises.
const CTA = 'Get it on iOS & Android';
const ALL_CELLS = (from: number, to: number) =>
  [0, 1, 2, 3, 4, 5].flatMap(s => Array.from({ length: to - from + 1 }, (_, i) => ({ s, f: from + i })));

export const CREATIVES: Creative[] = [
  // ── Identify mode ──────────────────────────────────────────────────────────
  {
    id: `fret_${D}_identify_A_01`,
    angle: 'identify',
    caption: `Found a shape you love but no idea what it's called? Identify mode names it. ${TAGS} #jazzguitar`,
    build: () => {
      const shape: Shape = [null, 3, 2, 4, 3, null];
      const id = identifyShape(shape);
      check(id.name === 'C Major 9' && id.tags.includes('no 5'), `identify_A_01 got ${id.name}`);
      return {
        template: 'A',
        eyebrow: 'Identify mode',
        headline: 'What is this',
        accent: 'chord?',
        sub: "Tap the notes you're fretting. Fretionary names it, even no-5 shells and rootless voicings.",
        visual:
          fretboardSvg({ kind: 'fretboard', root: id.root, chord: id.chordKey, frets: [0, 5], labels: 'name', shape, stringGap: 58 })
          + identifyCard(id),
      };
    },
  },
  {
    id: `fret_${D}_identify_A_02`,
    angle: 'identify',
    caption: `That dark, cinematic chord you stumbled into has a name. ${TAGS}`,
    build: () => {
      const shape: Shape = [null, 0, 2, 1, 1, 0];
      const id = identifyShape(shape);
      check(id.name === 'A Minor Maj7', `identify_A_02 got ${id.name}`);
      return {
        template: 'A',
        eyebrow: 'Identify mode',
        headline: 'You found it',
        accent: 'by accident.',
        sub: "Now learn what it's called. Identify turns any shape into a chord name and its intervals.",
        visual:
          fretboardSvg({ kind: 'fretboard', root: id.root, chord: id.chordKey, frets: [0, 4], labels: 'name', shape, stringGap: 58 })
          + identifyCard(id),
      };
    },
  },
  {
    id: `fret_${D}_identify_B_01`,
    angle: 'identify',
    caption: `Name this chord 👇 Answer's upside down. ${TAGS} #guitarquiz`,
    build: () => {
      const shape: Shape = [0, 7, 6, 7, 8, null];
      const answer = answerFor(shape);
      check(answer.startsWith('E Dom 7♯9'), `identify_B_01 got ${answer}`);
      return {
        template: 'B', eyebrow: 'Guitar quiz · Hard', headline: 'Name this', accent: 'chord.',
        visual: chordBoxSvg({ kind: 'chordbox', shape, labels: 'none', width: 620 }),
        hint: 'Answer is upside down', answer,
      };
    },
  },
  {
    id: `fret_${D}_identify_B_02`,
    angle: 'identify',
    caption: `Name this chord 👇 Answer's upside down. ${TAGS} #guitarquiz`,
    build: () => {
      const shape: Shape = [8, null, 9, 9, 8, null];
      const answer = answerFor(shape);
      check(answer === 'C Major 7', `identify_B_02 got ${answer}`);
      return {
        template: 'B', eyebrow: 'Guitar quiz · Medium', headline: 'Name this', accent: 'chord.',
        visual: chordBoxSvg({ kind: 'chordbox', shape, labels: 'none', width: 620 }),
        hint: 'Answer is upside down', answer,
      };
    },
  },
  {
    id: `fret_${D}_identify_B_03`,
    angle: 'identify',
    caption: `Easy one. Name this chord 👇 ${TAGS} #guitarquiz #beginnerguitar`,
    build: () => {
      const shape: Shape = [null, null, 0, 2, 1, 1];
      const answer = answerFor(shape);
      check(answer === 'D Minor 7', `identify_B_03 got ${answer}`);
      return {
        template: 'B', eyebrow: 'Guitar quiz · Easy', headline: 'Name this', accent: 'chord.',
        visual: chordBoxSvg({ kind: 'chordbox', shape, labels: 'none', width: 620 }),
        hint: 'Answer is upside down', answer,
      };
    },
  },

  // ── CAGED ──────────────────────────────────────────────────────────────────
  {
    id: `fret_${D}_caged_A_01`,
    angle: 'caged',
    caption: `The CAGED system is just five chord shapes that tile the whole neck. Here they are in G. ${TAGS} #cagedsystem`,
    build: () => ({
      template: 'A',
      eyebrow: 'CAGED system',
      headline: 'Five shapes.',
      accent: 'One neck.',
      sub: 'See exactly where C, A, G, E and D sit for your key, and how they connect.',
      visual: fretboardSvg({
        kind: 'fretboard', root: 7, chord: 'Major', frets: [0, 13], labels: 'degree', stringGap: 64,
        bands: CAGED_ORDER.map(s => ({ ...getCagedFretRange(7, s), color: CAGED_COLORS[s].fill, label: s })),
      }),
    }),
  },
  {
    id: `fret_${D}_caged_B_01`,
    angle: 'caged',
    caption: `Which CAGED shape is this? 👇 ${TAGS} #cagedsystem #guitarquiz`,
    build: () => {
      const v = getChordVoicings(0, 'Major').find(x => x.label.startsWith('A shape'));
      check(!!v, 'C major has an A-shape voicing');
      const shape = v!.frets;
      return {
        template: 'B', eyebrow: 'CAGED quiz', headline: 'Which shape', accent: 'is this?',
        visual: fretboardSvg({ kind: 'fretboard', root: 0, chord: 'Major', frets: [1, 7], labels: 'none', shape, mono: PALETTE.indigo, stringGap: 80 }),
        hint: 'Answer is upside down',
        answer: `A shape · C major at fret ${v!.rootFret}`,
      };
    },
  },
  {
    id: `fret_${D}_caged_C_01`,
    angle: 'caged',
    caption: `Save this: the CAGED map for G major, low to high. ${TAGS} #cagedsystem`,
    build: () => ({
      template: 'C',
      eyebrow: 'Save this · CAGED',
      headline: 'The CAGED map',
      accent: 'in G major.',
      rows: CAGED_ORDER
        .map(s => ({ s, ...getCagedFretRange(7, s) }))
        .sort((a, b) => a.start - b.start)
        .map(r => ({
          lead: `<span style="color:${CAGED_COLORS[r.s].fill}">${r.s}</span>`,
          title: `${r.s} shape · frets ${r.start}–${r.end}`,
          detail: CAGED_SHAPE_TIPS[r.s][0],
        })),
    }),
  },

  // ── Scale positions ────────────────────────────────────────────────────────
  {
    id: `fret_${D}_positions_A_01`,
    angle: 'positions',
    caption: `Pentatonic box 1 is a great start and a terrible place to live. ${TAGS} #pentatonic #guitarsolo`,
    build: () => {
      const pos = getScalePositions(9);
      check(pos.length === 5, `A has ${pos.length} positions`);
      const box = pos.find(p => p.start > 5) ?? pos[1];
      return {
        template: 'A',
        eyebrow: 'Position highlighting',
        headline: 'Stuck in',
        accent: 'box 1?',
        sub: 'Lock to any of the 5 pentatonic positions. Everything outside your box dims.',
        visual: fretboardSvg({
          kind: 'fretboard', root: 9, scale: 'Pentatonic Minor', frets: [3, 15], labels: 'degree', stringGap: 66,
          band: { ...box, color: POSITION_COLORS[1].fill },
        }),
      };
    },
  },
  {
    id: `fret_${D}_positions_C_01`,
    angle: 'positions',
    caption: `Save this: all 5 A minor pentatonic positions. Learn one a week. ${TAGS} #pentatonic`,
    build: () => ({
      template: 'C',
      eyebrow: 'Save this · A minor pentatonic',
      headline: 'All 5 positions.',
      // Positions are anchored to the CAGED shapes, so name each one by its shape
      // rather than a number (players disagree on which box is "box 1").
      rows: getScalePositions(9).map(p => {
        const shape = CAGED_ORDER.find(s => getCagedFretRange(9, s).start === p.start);
        check(!!shape, `position at fret ${p.start} maps to a CAGED shape`);
        return {
          lead: `<span style="color:${CAGED_COLORS[shape!].fill}">${shape}</span>`,
          title: `Frets ${p.start}–${p.end}`,
          detail: `${shape} shape`,
          right: fretboardSvg({ kind: 'fretboard', root: 9, scale: 'Pentatonic Minor', frets: [p.start, p.end], labels: 'none', bare: true, width: 470, stringGap: 25 }),
        };
      }),
    }),
  },

  // ── Chord anatomy ──────────────────────────────────────────────────────────
  {
    id: `fret_${D}_anatomy_A_01`,
    angle: 'anatomy',
    caption: `A maj9 is just five notes. Here's what each one is doing. ${TAGS} #jazzguitar #neosoul`,
    build: () => ({
      template: 'A',
      eyebrow: 'Chord library',
      headline: "What's inside",
      accent: 'a maj9?',
      sub: '42 chord types, each broken down by interval, with shapes you can actually play.',
      visual:
        intervalCards(0, 'Major 9')
        + chordBoxSvg({ kind: 'chordbox', shape: bestVoicing(0, 'Major 9'), root: 0, chord: 'Major 9', labels: 'interval', width: 400, caption: 'Cmaj9' }),
    }),
  },
  {
    id: `fret_${D}_anatomy_C_01`,
    angle: 'anatomy',
    caption: `Save this: every seventh chord is one note away from another. ${TAGS} #jazzguitar`,
    build: () => ({
      template: 'C',
      eyebrow: 'Save this · Chord formulas',
      headline: 'Seventh chords,',
      accent: 'decoded.',
      rows: ['Major 7', 'Dominant 7', 'Minor 7', 'Minor Maj7', 'Half-Dim 7', 'Dim 7'].map(k => ({
        title: shortChordName(0, k),
        detail: `${spelled(0, k)} · ${CHORDS[k].description}`,
        right: `<div class="chips">${chordChips(k, 58)}</div>`,
      })),
    }),
  },
  {
    id: `fret_${D}_anatomy_C_02`,
    angle: 'anatomy',
    caption: `Save this: what the numbers in 9, 11 and 13 chords actually mean. ${TAGS} #jazzguitar #rnb`,
    build: () => ({
      template: 'C',
      eyebrow: 'Save this · Chord formulas',
      headline: 'Extended chords,',
      accent: 'decoded.',
      rows: ['Add9', 'Major 9', 'Minor 9', 'Dominant 9', 'Minor 11', 'Dominant 13'].map(k => ({
        title: shortChordName(0, k),
        detail: spelled(0, k),
        right: `<div class="chips">${chordChips(k, 50)}</div>`,
      })),
    }),
  },

  // ── Modes ──────────────────────────────────────────────────────────────────
  {
    id: `fret_${D}_modes_A_01`,
    angle: 'modes',
    caption: `Lydian sounds dreamy because of one note: the ♯4. ${TAGS} #modes #lydian`,
    build: () => {
      check(SCALES['Lydian'].degrees.includes('♯4'), 'Lydian has ♯4');
      return {
        template: 'A',
        eyebrow: 'Modes',
        headline: 'The dreamy sound',
        accent: 'is one note.',
        sub: "Lydian is a major scale with a raised 4th. Here's the ♯4 in C Lydian.",
        visual: fretboardSvg({ kind: 'fretboard', root: 0, scale: 'Lydian', frets: [7, 12], labels: 'degree', emphasize: ['♯4'], stringGap: 76 }),
      };
    },
  },
  {
    id: `fret_${D}_modes_A_02`,
    angle: 'modes',
    caption: `That Spanish / metal sound is Phrygian, and it's all in the ♭2. ${TAGS} #modes #metalguitar`,
    build: () => {
      check(SCALES['Phrygian'].degrees.includes('♭2'), 'Phrygian has ♭2');
      return {
        template: 'A',
        eyebrow: 'Modes',
        headline: 'That Spanish sound?',
        accent: "It's the ♭2.",
        sub: 'Phrygian is natural minor with a flat 2nd. E Phrygian, open position.',
        visual: fretboardSvg({ kind: 'fretboard', root: 4, scale: 'Phrygian', frets: [0, 5], labels: 'degree', emphasize: ['♭2'], stringGap: 76 }),
      };
    },
  },
  {
    id: `fret_${D}_modes_C_01`,
    angle: 'modes',
    caption: `Save this: the 7 modes from brightest to darkest, and the one note that makes each one. ${TAGS} #modes`,
    build: () => {
      const modes: [string, string, string, string[]][] = [
        ['Lydian',        'Lydian',     'Major, but ♯4. Dreamy.',        ['♯4']],
        ['Major',         'Ionian',     'The major scale. Home.',         []],
        ['Mixolydian',    'Mixolydian', 'Major, but ♭7. Bluesy rock.',    ['♭7']],
        ['Dorian',        'Dorian',     'Minor, but natural 6. Funk.',    ['6']],
        ['Natural Minor', 'Aeolian',    'The natural minor scale.',       []],
        ['Phrygian',      'Phrygian',   'Minor, but ♭2. Spanish, metal.', ['♭2']],
        ['Locrian',       'Locrian',    '♭2 and ♭5. The darkest.',        ['♭2', '♭5']],
      ];
      for (const [key, , , sig] of modes) {
        for (const d of sig) check(SCALES[key].degrees.includes(d), `${key} has ${d}`);
      }
      return {
        template: 'C',
        eyebrow: 'Save this · Modes',
        headline: '7 modes,',
        accent: 'bright to dark.',
        rows: modes.map(([key, name, detail, sig]) => ({
          title: name,
          detail,
          right: `<div class="chips">${scaleChips(key, 46, sig)}</div>`,
        })),
      };
    },
  },

  // ── Note spelling ──────────────────────────────────────────────────────────
  {
    id: `fret_${D}_spelling_A_01`,
    angle: 'spelling',
    caption: `C Dorian has an E♭ in it, not a D#. Fretionary spells every note the way it's written. ${TAGS} #musictheory`,
    build: () => {
      const names = getScaleNotes(0, 'Dorian').map(pc => noteLabel(pc, 0, 'name', 'Dorian', '', 'scales'));
      check(names.includes('E♭') && names.includes('B♭'), `C Dorian spelled ${names.join(' ')}`);
      return {
        template: 'A',
        eyebrow: 'Proper note spelling',
        headline: "It's E♭,",
        accent: 'not D#.',
        sub: `C Dorian: ${names.join(' ')}. Every scale and chord spelled the way a musician writes it.`,
        visual: fretboardSvg({ kind: 'fretboard', root: 0, scale: 'Dorian', frets: [0, 5], labels: 'name', emphasize: ['♭3', '♭7'], stringGap: 72 }),
      };
    },
  },

  // ── Progressions ───────────────────────────────────────────────────────────
  {
    id: `fret_${D}_progressions_C_01`,
    angle: 'progressions',
    caption: `Steal this shoegaze progression. Dmaj7, Bm7, F#m7, Gmaj7. Drown it in reverb. ${TAGS} #shoegaze`,
    build: () => {
      const p = progression('Dreamy descent');
      check(p.key === 'D major', 'Dreamy descent is in D major');
      return {
        template: 'C',
        eyebrow: `${p.genre} · Key of ${p.key}`,
        headline: 'Steal this',
        accent: 'progression.',
        sub: p.description,
        rows: p.chords.map(c => ({
          lead: `<span style="font-size:44px;color:${PALETTE.muted}">${numeral(2, c.root, c.chordType)}</span>`,
          title: shortChordName(c.root, c.chordType),
          detail: spelled(c.root, c.chordType),
          right: chordBoxSvg({ kind: 'chordbox', shape: bestVoicing(c.root, c.chordType), root: c.root, chord: c.chordType, labels: 'none', width: 190 }),
        })),
      };
    },
  },
  {
    id: `fret_${D}_progressions_A_01`,
    angle: 'progressions',
    caption: `Neo-soul in a few chords. Play them slow and let them ring. ${TAGS} #neosoul #rnbguitar`,
    build: () => {
      const p = progression('Neo-soul groove');
      const chords = p.chords;
      check(chords.length === 4, `Neo-soul groove has ${chords.length} chords`);
      // Fmaj7–Em7–Dm7–G9 is IV–iii–ii–V9 in C. Derive the numerals in C and require every chord to fit.
      check(p.key === 'C major', `Neo-soul groove key is ${p.key}`);
      const numerals = chords.map(c => numeral(0, c.root, c.chordType));
      check(numerals.join(' ') === 'IV iii ii V', `Neo-soul numerals in C: ${numerals.join(' ')}`);
      return {
        template: 'A',
        eyebrow: `${p.genre} · Key of C major`,
        headline: 'Neo-soul',
        accent: `in ${chords.length} chords.`,
        sub: `IVmaj7 → iii7 → ii7 → V9. D’Angelo, Erykah Badu territory. Hear it played in Fretionary.`,
        visual: `<div class="grid">${chords.map(c =>
          chordBoxSvg({ kind: 'chordbox', shape: bestVoicing(c.root, c.chordType), root: c.root, chord: c.chordType, labels: 'interval', width: 330, caption: shortChordName(c.root, c.chordType) }),
        ).join('')}</div>`,
      };
    },
  },

  // ── Practice drills ────────────────────────────────────────────────────────
  {
    id: `fret_${D}_practice_B_01`,
    angle: 'practice',
    caption: `10 seconds. Name every note on the 5th fret 👇 ${TAGS} #guitarquiz #fretboard`,
    build: () => {
      const answer = [5, 4, 3, 2, 1, 0].map(s => NOTES[(OPEN_STRINGS[s] + 5) % 12]).join(' ');
      check(answer === 'A D G C E A', `fret 5 is ${answer}`);
      return {
        template: 'B', eyebrow: 'Fretboard drill · 10 seconds', headline: 'Name every note', accent: 'on fret 5.',
        visual: fretboardSvg({
          kind: 'fretboard', root: 0, frets: [3, 7], labels: 'question', mono: PALETTE.indigo, stringGap: 80,
          cells: [0, 1, 2, 3, 4, 5].map(s => ({ s, f: 5 })),
        }),
        hint: 'Low E → high e, upside down',
        answer,
      };
    },
  },
  {
    id: `fret_${D}_practice_A_01`,
    angle: 'practice',
    caption: `Stop counting up from the open string. Drill the neck until you just know it. ${TAGS} #fretboard`,
    build: () => ({
      template: 'A',
      eyebrow: 'Practice drills',
      headline: 'Know the neck',
      accent: 'without counting.',
      sub: 'Name the Note, Find the Note, String Drill. Quick rounds that build real fretboard memory.',
      visual:
        fretboardSvg({ kind: 'fretboard', root: 0, frets: [0, 12], labels: 'question', mono: PALETTE.indigo, stringGap: 60, cells: [{ s: 2, f: 9 }] })
        + `<div class="pills">${NOTES.map(n => `<div class="pill">${n}</div>`).join('')}</div>`,
    }),
  },

  // ── The intermediate plateau ───────────────────────────────────────────────
  // For players who've been at it for years: open chords, one pentatonic box,
  // no map of the neck and no theory. Lead with the problem, then show the fix.
  {
    id: `fret_${D2}_plateau_D_01`,
    angle: 'plateau',
    caption: `Most players learn one pentatonic box and stay there for years. The rest of the neck was there the whole time. ${TAGS} #pentatonic #guitarsolo`,
    build: () => {
      const box = scaleCells(9, 'Pentatonic Minor', 5, 8);
      check(box.length === 12, `A minor pentatonic box at fret 5 has ${box.length} notes`);
      return {
        template: 'D',
        eyebrow: 'The intermediate plateau',
        headline: 'Played for years?',
        accent: 'Still in one box?',
        before: {
          label: 'What you play',
          visual: fretboardSvg({ kind: 'fretboard', root: 9, scale: 'Pentatonic Minor', frets: [0, 15], labels: 'none', cells: box, mono: BEFORE_GREY, width: 920, stringGap: 46 }),
        },
        after: {
          label: "What's actually there",
          visual: fretboardSvg({ kind: 'fretboard', root: 9, scale: 'Pentatonic Minor', frets: [0, 15], labels: 'degree', width: 920, stringGap: 46 }),
        },
      };
    },
  },
  {
    id: `fret_${D2}_plateau_D_02`,
    angle: 'plateau',
    caption: `You learned one G chord years ago. There are four more places to play it, and they all connect. ${TAGS} #cagedsystem`,
    build: () => {
      const openG: Shape = [3, 2, 0, 0, 0, 3];
      check(identifyShape(openG).name === 'G Major', 'open G shape is G major');
      return {
        template: 'D',
        eyebrow: 'Fretboard knowledge',
        headline: 'You know G',
        accent: 'in one place.',
        before: {
          label: 'The G you learned',
          visual: fretboardSvg({ kind: 'fretboard', root: 7, chord: 'Major', frets: [0, 15], labels: 'none', shape: openG, mono: BEFORE_GREY, width: 920, stringGap: 46 }),
        },
        after: {
          label: "It's in five",
          visual: fretboardSvg({
            kind: 'fretboard', root: 7, chord: 'Major', frets: [0, 15], labels: 'degree', width: 920, stringGap: 46,
            bands: CAGED_ORDER.map(s => ({ ...getCagedFretRange(7, s), color: CAGED_COLORS[s].fill, label: s })),
          }),
        },
      };
    },
  },
  {
    id: `fret_${D2}_plateau_C_01`,
    angle: 'plateau',
    caption: `If three of these hit home, you're not bad at guitar. You're missing a map. ${TAGS} #guitarplayer`,
    build: () => {
      check(Object.keys(SCALES).length === 14, `app has ${Object.keys(SCALES).length} scales`);
      return {
        template: 'C',
        eyebrow: 'Sound familiar?',
        headline: 'Stuck at',
        accent: 'intermediate?',
        rows: [
          { lead: CHECK_ICON, title: 'You know your open chords', detail: 'G, C, D, Em, Am. The campfire set.' },
          { lead: CHECK_ICON, title: "You've got a pentatonic box", detail: 'And you live in it.' },
          { lead: CROSS_ICON, title: "Can't name notes on the neck", detail: 'Fix: Name the Note drills, three levels.' },
          { lead: CROSS_ICON, title: 'Theory never clicked', detail: 'Fix: every chord broken down by interval.' },
          { lead: CROSS_ICON, title: 'Same licks every solo', detail: 'Fix: 5 positions of 14 scales, any key.' },
        ],
      };
    },
  },
  {
    id: `fret_${D2}_theory_A_01`,
    angle: 'theory',
    caption: `You don't need to read music to understand theory. You need to see it. ${TAGS} #musictheory`,
    build: () => {
      const legendItem = (swatch: string, label: string) => `<div class="legend-item">${swatch}<span>${label}</span></div>`;
      const tone = `<span class="chip" style="width:52px;height:52px;background:${COLORS.scaleTone.fill};color:${COLORS.scaleTone.text};font-size:22px">2</span>`;
      return {
        template: 'A',
        eyebrow: 'Music theory, made visual',
        headline: 'Theory without',
        accent: 'the sheet music.',
        sub: 'Every note colour-coded by the job it does. You see the pattern instead of reading it.',
        visual:
          fretboardSvg({ kind: 'fretboard', root: 7, scale: 'Major', frets: [0, 12], labels: 'degree', width: 920, stringGap: 60 })
          + `<div class="legend">${[
            legendItem(chip('R', 52), 'Root'), legendItem(chip('3', 52), '3rd'), legendItem(chip('5', 52), '5th'),
            legendItem(chip('7', 52), '7th'), legendItem(tone, 'Passing tones'),
          ].join('')}</div>`,
      };
    },
  },
  {
    id: `fret_${D2}_songs_A_01`,
    angle: 'songs',
    caption: `G, D, Em, C. You've played these a thousand times. Here's why they work together. ${TAGS} #songwriting`,
    build: () => {
      const chords: [number, string][] = [[7, 'Major'], [2, 'Major'], [4, 'Minor'], [0, 'Major']];
      const numerals = chords.map(([r, k]) => numeral(7, r, k));
      check(numerals.join(' ') === 'I V vi IV', `G D Em C in G is ${numerals.join(' ')}`);
      return {
        template: 'A',
        eyebrow: 'Why songs work',
        headline: 'Why do so many',
        accent: 'songs sound alike?',
        sub: 'I–V–vi–IV. Four chords behind a mountain of pop songs. See why they fit, in any key.',
        visual: `<div class="grid">${chords.map(([r, k], i) =>
          chordBoxSvg({ kind: 'chordbox', shape: bestVoicing(r, k), root: r, chord: k, labels: 'interval', width: 330, caption: `${numerals[i]} · ${shortChordName(r, k)}` }),
        ).join('')}</div>`,
      };
    },
  },

  // ── Direct response ────────────────────────────────────────────────────────
  {
    id: `fret_${D2}_direct_E_01`,
    angle: 'direct',
    caption: `Every note on the neck, mapped. Fretionary is on iOS and Android. ${TAGS} #fretboard`,
    build: () => ({
      template: 'E',
      headline: 'Learn the fretboard.',
      accent: 'Finally.',
      visual: fretboardSvg({ kind: 'fretboard', root: 0, scale: 'Major', frets: [0, 12], labels: 'name', cells: ALL_CELLS(0, 12), width: 920, stringGap: 62 }),
      bullets: ['Every note on the neck', 'Every scale and chord, in any key', 'Quick drills that make it stick'],
      cta: CTA,
    }),
  },
  {
    id: `fret_${D2}_direct_E_02`,
    angle: 'direct',
    caption: `Most players can't fill this in. Can you? 👇 Fretionary teaches it one string at a time. ${TAGS} #fretboard`,
    build: () => ({
      template: 'E',
      headline: 'Can you fill in',
      accent: 'this fretboard?',
      sub: "Most players can't. Fretionary teaches you, one string at a time.",
      visual: fretboardSvg({
        kind: 'fretboard', root: 0, frets: [0, 12], labels: 'question', mono: PALETTE.indigo, width: 920, stringGap: 70,
        cells: [{ s: 5, f: 5 }, { s: 3, f: 7 }, { s: 1, f: 3 }, { s: 4, f: 10 }, { s: 2, f: 9 }],
      }),
      cta: CTA,
    }),
  },
  {
    id: `fret_${D2}_direct_E_03`,
    angle: 'direct',
    caption: `Every scale, every chord, every key, on the neck in front of you. ${TAGS} #guitartheory`,
    build: () => {
      check(Object.keys(SCALES).length === 14, 'app has 14 scales');
      check(Object.keys(CHORDS).length === 42, 'app has 42 chord types');
      check(PROGRESSIONS.length === 64, 'app has 64 progressions');
      return {
        template: 'E',
        headline: 'Every scale. Every chord.',
        accent: 'Every key.',
        visual: fretboardSvg({ kind: 'fretboard', root: 7, scale: 'Major', frets: [0, 12], labels: 'degree', width: 920, stringGap: 62 }),
        bullets: ['14 scales and modes', '42 chord types, playable shapes', '64 progressions with real audio'],
        cta: CTA,
      };
    },
  },
  {
    id: `fret_${D2}_direct_E_04`,
    angle: 'direct',
    caption: `The fretboard dictionary. Look up any scale or chord and see exactly where it lives on the neck. ${TAGS}`,
    build: () => ({
      template: 'E',
      headline: 'Look it up.',
      accent: 'See it on the neck.',
      sub: 'The fretboard dictionary. Pick any scale or chord and see where it lives, colour-coded.',
      visual: fretboardSvg({ kind: 'fretboard', root: 9, scale: 'Pentatonic Minor', frets: [0, 12], labels: 'name', width: 920, stringGap: 66 }),
      cta: CTA,
    }),
  },
];
