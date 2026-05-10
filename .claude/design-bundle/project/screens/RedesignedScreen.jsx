// REDESIGN: Premium, clean, modern Fretionary fretboard screen.
//
// Key moves vs current:
// 1) BACKGROUND: True near-black with subtle warm tint, layered translucent surfaces
//    (glass) instead of stacked filled panels with hard 1px borders.
// 2) TYPE: Inter for UI + JetBrains Mono for note labels & numerics — gives the
//    instrument-precision feeling. Tabular numerals on fret numbers.
// 3) NOTE COLORS: Same identity but rebalanced in oklch — uniform chroma so root,
//    3rd, 5th, ext sit in harmony rather than fighting each other. Root stays
//    yellow but warmer/softer; saturations all dropped ~15%.
// 4) FRETBOARD: Hairline strings with subtle string-thickness gradient, stronger
//    visual separation between in-position notes (full opacity, drop shadow) vs
//    out-of-position (smaller, dimmed). Soft gradient on the position highlight
//    instead of flat fill+border.
// 5) PILLS: Replaced bordered pills with surface-only chips. Active state uses
//    layered fill + subtle inner highlight + accent ring rather than solid color.
// 6) ROOT NOTE PICKER: Becomes a sticky horizontal piano-like keyboard so naturals
//    vs sharps are visually distinct (huge usability win for guitarists).
// 7) MODE TABS: Becomes a single segmented control with a sliding indicator pill
//    that has a subtle gradient and shadow.
// 8) INFO PANEL: Becomes one consolidated card with 3 columns, monospace values,
//    and proper typographic hierarchy. Description shown as a quiet caption.
// 9) TAB BAR: Larger icons, proper SF-symbol-style line weight, active state uses
//    a subtle pill background instead of just tinted color.
// 10) SPACING: 4pt grid throughout. More generous padding everywhere — premium
//     designs earn space.

const NOTES12 = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const NATURAL = [true,false,true,false,true,true,false,true,false,true,false,true];

const TUNING = [4, 11, 7, 2, 9, 4]; // high to low: e B G D A E
const SCALE_NOTES_G_MAJOR = [7, 9, 11, 0, 2, 4, 6];
const ROOT = 7; // G

// Theme presets (driven by Tweaks)
const THEMES = {
  // Direction A: "Obsidian" — true dark, warm-tinted, indigo accent (recommended)
  obsidian: {
    name: 'Obsidian',
    bg: '#0A0A0C',
    bgGrad: 'radial-gradient(120% 80% at 50% 0%, #16161B 0%, #0A0A0C 60%)',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHigh: 'rgba(255,255,255,0.06)',
    surfaceActive: 'rgba(255,255,255,0.09)',
    hairline: 'rgba(255,255,255,0.06)',
    hairlineStrong: 'rgba(255,255,255,0.10)',
    text: '#F2F1EC',
    textMuted: 'rgba(242,241,236,0.55)',
    textFaint: 'rgba(242,241,236,0.30)',
    accent: 'oklch(62% 0.16 285)',
    accentSoft: 'oklch(62% 0.16 285 / 0.18)',
    accentGlow: 'oklch(62% 0.16 285 / 0.35)',
    fbBg: 'linear-gradient(180deg, #14141A 0%, #0E0E13 100%)',
    fretBoardWood: false,
  },
  // Direction B: "Ivory" — light mode, paper feel, indigo accent
  ivory: {
    name: 'Ivory',
    bg: '#F7F6F1',
    bgGrad: 'radial-gradient(120% 80% at 50% 0%, #FFFFFF 0%, #F2F0E9 100%)',
    surface: 'rgba(20,18,12,0.03)',
    surfaceHigh: 'rgba(20,18,12,0.05)',
    surfaceActive: 'rgba(20,18,12,0.08)',
    hairline: 'rgba(20,18,12,0.08)',
    hairlineStrong: 'rgba(20,18,12,0.14)',
    text: '#1A1814',
    textMuted: 'rgba(26,24,20,0.55)',
    textFaint: 'rgba(26,24,20,0.30)',
    accent: 'oklch(50% 0.14 285)',
    accentSoft: 'oklch(50% 0.14 285 / 0.12)',
    accentGlow: 'oklch(50% 0.14 285 / 0.25)',
    fbBg: 'linear-gradient(180deg, #ECEAE2 0%, #E2DFD5 100%)',
    fretBoardWood: false,
  },
  // Direction C: "Studio" — deep navy/teal, more colorful, warm accent
  studio: {
    name: 'Studio',
    bg: '#0B1418',
    bgGrad: 'radial-gradient(120% 80% at 50% 0%, #142028 0%, #0B1418 60%)',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHigh: 'rgba(255,255,255,0.06)',
    surfaceActive: 'rgba(255,255,255,0.09)',
    hairline: 'rgba(255,255,255,0.07)',
    hairlineStrong: 'rgba(255,255,255,0.12)',
    text: '#EDF2F4',
    textMuted: 'rgba(237,242,244,0.55)',
    textFaint: 'rgba(237,242,244,0.30)',
    accent: 'oklch(72% 0.14 65)', // warm amber
    accentSoft: 'oklch(72% 0.14 65 / 0.18)',
    accentGlow: 'oklch(72% 0.14 65 / 0.35)',
    fbBg: 'linear-gradient(180deg, #2A1A12 0%, #1A0F09 100%)',
    fretBoardWood: true,
  },
};

// Note colors — rebalanced in oklch for harmony, same identity
const NOTE_COLORS = {
  root:  { fill: 'oklch(82% 0.14 90)',  stroke: 'oklch(70% 0.14 90)',  text: 'oklch(28% 0.08 90)' },
  third: { fill: 'oklch(64% 0.16 25)',  stroke: 'oklch(48% 0.16 25)',  text: '#fff' },
  fifth: { fill: 'oklch(62% 0.13 165)', stroke: 'oklch(46% 0.13 165)', text: '#fff' },
  ext:   { fill: 'oklch(62% 0.13 245)', stroke: 'oklch(46% 0.13 245)', text: '#fff' },
  scale: { fill: 'rgba(255,255,255,0.10)', stroke: 'rgba(255,255,255,0.18)', text: 'rgba(242,241,236,0.65)' },
};
const NOTE_COLORS_LIGHT = {
  root:  { fill: 'oklch(78% 0.14 90)',  stroke: 'oklch(60% 0.14 90)',  text: 'oklch(28% 0.08 90)' },
  third: { fill: 'oklch(60% 0.16 25)',  stroke: 'oklch(45% 0.16 25)',  text: '#fff' },
  fifth: { fill: 'oklch(58% 0.13 165)', stroke: 'oklch(42% 0.13 165)', text: '#fff' },
  ext:   { fill: 'oklch(56% 0.13 245)', stroke: 'oklch(42% 0.13 245)', text: '#fff' },
  scale: { fill: 'rgba(20,18,12,0.06)', stroke: 'rgba(20,18,12,0.15)', text: 'rgba(26,24,20,0.55)' },
};

function classifyNote(noteIdx, root) {
  if (noteIdx === root) return 'root';
  const intv = (noteIdx - root + 12) % 12;
  if (intv === 4) return 'third';
  if (intv === 7) return 'fifth';
  if (intv === 11) return 'ext';
  return 'scale';
}

function PremiumFretboard({ theme, isLight }) {
  const TOTAL_FRETS = 15;
  const STR_COUNT = 6;
  const LEFT_PAD = 30;
  const TOP_PAD = 28;
  const FRET_W = 56;
  const STR_H = 36;
  const NUT_W = 8;
  const DOT_R = 14;
  const SVG_W = LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W + 18;
  const SVG_H = TOP_PAD + (STR_COUNT - 1) * STR_H + 40;
  const INLAY_FRETS = [3, 5, 7, 9, 12, 15];
  const stringNames = ['e','B','G','D','A','E'];
  const colors = isLight ? NOTE_COLORS_LIGHT : NOTE_COLORS;

  // Active position: position 1 covers frets ~2-5 for G major (illustrative)
  const positionStart = 2;
  const positionEnd = 6;

  const fretX = (f) => f === 0 ? LEFT_PAD + NUT_W / 2 : LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
  const strY = (s) => TOP_PAD + s * STR_H;

  const inlayColor = isLight ? 'rgba(20,18,12,0.10)' : 'rgba(255,255,255,0.06)';
  const fretColor = isLight ? 'rgba(20,18,12,0.10)' : 'rgba(255,255,255,0.08)';
  const fretColorHL = isLight ? 'rgba(20,18,12,0.18)' : 'rgba(255,255,255,0.16)';
  const stringColor = isLight ? 'rgba(20,18,12,0.55)' : 'rgba(242,241,236,0.55)';
  const nutColor = isLight ? 'rgba(20,18,12,0.85)' : '#D9D6CC';

  const dots = [];
  for (let s = 0; s < STR_COUNT; s++) {
    for (let f = 0; f <= TOTAL_FRETS; f++) {
      const ni = (TUNING[s] + f) % 12;
      if (!SCALE_NOTES_G_MAJOR.includes(ni)) continue;
      const cls = classifyNote(ni, ROOT);
      const inPos = f >= positionStart && f <= positionEnd;
      const c = colors[cls];
      dots.push({
        x: fretX(f), y: strY(s), label: NOTES12[ni],
        fill: c.fill, stroke: c.stroke, textColor: c.text,
        opacity: inPos ? 1 : 0.32,
        scale: inPos ? 1 : 0.86,
        cls,
      });
    }
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', padding: '4px 0' }}>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="posHL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.20" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id="rootGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.root.fill} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colors.root.fill} stopOpacity="0" />
          </radialGradient>
          <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Position highlight — soft gradient, no harsh border */}
        {(() => {
          const x1 = LEFT_PAD + NUT_W + positionStart * FRET_W - FRET_W;
          const x2 = LEFT_PAD + NUT_W + (positionEnd + 1) * FRET_W - FRET_W;
          return (
            <g>
              <rect x={x1} y={strY(0) - 16} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 32}
                rx={10} fill="url(#posHL)" />
              <rect x={x1} y={strY(0) - 16} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 32}
                rx={10} fill="none" stroke={theme.accent} strokeOpacity="0.35" strokeWidth={1} />
            </g>
          );
        })()}

        {/* Inlay dots */}
        {INLAY_FRETS.map(f => {
          const x = LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
          if (f === 12) return (
            <g key={f}>
              <circle cx={x} cy={strY(1.5)} r={3.5} fill={inlayColor} />
              <circle cx={x} cy={strY(3.5)} r={3.5} fill={inlayColor} />
            </g>
          );
          return <circle key={f} cx={x} cy={strY(2.5)} r={3.5} fill={inlayColor} />;
        })}

        {/* Frets */}
        {Array.from({ length: TOTAL_FRETS }, (_, i) => i + 1).map(f => (
          <line key={f} x1={LEFT_PAD + NUT_W + f * FRET_W} y1={strY(0) - 10}
            x2={LEFT_PAD + NUT_W + f * FRET_W} y2={strY(5) + 10}
            stroke={f === 12 ? fretColorHL : fretColor} strokeWidth={1} />
        ))}

        {/* Strings — hairline with thickness gradient */}
        {Array.from({ length: STR_COUNT }, (_, s) => (
          <g key={s}>
            <line x1={LEFT_PAD} y1={strY(s)} x2={LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W} y2={strY(s)}
              stroke={stringColor} strokeWidth={0.5 + (s / STR_COUNT) * 1.4} strokeOpacity={0.7} />
            <text x={LEFT_PAD - 10} y={strY(s) + 4} textAnchor="middle"
              fontSize={10} fill={isLight ? 'rgba(26,24,20,0.40)' : 'rgba(242,241,236,0.40)'}
              fontWeight="500" fontFamily="JetBrains Mono, ui-monospace, monospace">
              {stringNames[s]}
            </text>
          </g>
        ))}

        {/* Nut — refined */}
        <rect x={LEFT_PAD} y={strY(0) - 12} width={NUT_W} height={(STR_COUNT - 1) * STR_H + 24}
          rx={2} fill={nutColor} opacity={0.85} />

        {/* Fret numbers — monospace, tabular */}
        {[1,3,5,7,9,12,15].map(f => (
          <text key={f} x={LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2} y={SVG_H - 6}
            textAnchor="middle" fontSize={9} fill={theme.textFaint}
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {f}
          </text>
        ))}

        {/* Note dots */}
        {dots.map((d, i) => (
          <g key={i} opacity={d.opacity}>
            {d.cls === 'root' && d.opacity === 1 && (
              <circle cx={d.x} cy={d.y} r={DOT_R + 6} fill="url(#rootGlow)" />
            )}
            <circle cx={d.x} cy={d.y} r={DOT_R * d.scale}
              fill={d.fill} stroke={d.stroke} strokeWidth={1}
              filter={d.opacity === 1 ? 'url(#dotShadow)' : undefined} />
            <text x={d.x} y={d.y + 3.5} textAnchor="middle"
              fontSize={9} fontWeight="600" fill={d.textColor}
              fontFamily="JetBrains Mono, ui-monospace, monospace">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Sliding segmented control
function SegmentedControl({ options, value, onChange, theme }) {
  const idx = options.findIndex(o => o.value === value);
  return (
    <div style={{
      position: 'relative',
      flex: 1,
      display: 'flex',
      background: theme.surface,
      border: `1px solid ${theme.hairline}`,
      borderRadius: 12,
      padding: 3,
    }}>
      <div style={{
        position: 'absolute',
        top: 3, bottom: 3,
        left: `calc(${(idx / options.length) * 100}% + 3px)`,
        width: `calc(${100 / options.length}% - 6px)`,
        background: theme.surfaceActive,
        borderRadius: 9,
        boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, 0 2px 6px rgba(0,0,0,0.25)`,
        transition: 'left 220ms cubic-bezier(0.32, 0.72, 0, 1)',
      }} />
      {options.map(o => (
        <div key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1,
            position: 'relative',
            padding: '8px 0',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.1,
            color: o.value === value ? theme.text : theme.textMuted,
            cursor: 'pointer',
            transition: 'color 180ms ease',
          }}>
          {o.label}
        </div>
      ))}
    </div>
  );
}

// Piano-key style root picker
function RootPicker({ value, onChange, theme, isLight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, padding: '0 16px', height: 56, justifyContent: 'center' }}>
      {NOTES12.map((n, i) => {
        const active = i === value;
        const isNat = NATURAL[i];
        return (
          <div key={n} onClick={() => onChange(i)}
            style={{
              width: isNat ? 32 : 22,
              height: isNat ? 48 : 32,
              marginLeft: isNat && i > 0 && !NATURAL[i - 1] ? -6 : (isNat ? 2 : -6),
              marginRight: isNat && i < 11 && !NATURAL[i + 1] ? -6 : 0,
              background: active
                ? (isNat ? theme.accent : theme.accent)
                : (isNat
                    ? (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.92)')
                    : (isLight ? '#1A1814' : '#0A0A0C')),
              color: active ? '#fff' : (isNat ? '#1A1814' : (isLight ? '#FFFFFF' : 'rgba(242,241,236,0.85)')),
              borderRadius: '0 0 4px 4px',
              border: active
                ? `1px solid ${theme.accent}`
                : (isNat ? `1px solid ${isLight ? 'rgba(20,18,12,0.18)' : 'rgba(0,0,0,0.6)'}` : '1px solid #000'),
              boxShadow: active
                ? `0 0 0 3px ${theme.accentSoft}, 0 4px 12px ${theme.accentGlow}`
                : (isNat ? '0 1px 0 rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.5)'),
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 4,
              cursor: 'pointer',
              position: 'relative',
              zIndex: isNat ? 1 : 2,
              transition: 'all 180ms ease',
            }}>
            {n.replace('♯','#')}
          </div>
        );
      })}
    </div>
  );
}

// Chip pill — surface-only, no hard border
function Chip({ active, locked, dot, children, onClick, theme }) {
  return (
    <div onClick={onClick} style={{
      padding: '8px 14px',
      borderRadius: 999,
      background: active ? theme.accentSoft : theme.surface,
      border: `1px solid ${active ? theme.accent : 'transparent'}`,
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: 0.1,
      color: active ? theme.text : theme.textMuted,
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      opacity: locked ? 0.5 : 1,
      transition: 'all 180ms ease',
      boxShadow: active ? `0 0 0 3px ${theme.accentSoft}` : 'none',
    }}>
      {dot && <div style={{ width: 7, height: 7, borderRadius: 4, background: dot }} />}
      {locked && <span style={{ fontSize: 10, opacity: 0.7 }}>◇</span>}
      {children}
    </div>
  );
}

function SectionLabel({ children, theme }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 600,
      color: theme.textFaint,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 10,
      padding: '0 20px',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    }}>
      {children}
    </div>
  );
}

function RedesignedScreen({ tweaks }) {
  const themeKey = tweaks.theme || 'obsidian';
  const theme = THEMES[themeKey];
  const isLight = themeKey === 'ivory';
  const [mode, setMode] = React.useState('scales');
  const [root, setRoot] = React.useState(7);
  const [scale, setScale] = React.useState('Major');
  const [position, setPosition] = React.useState('1');
  const [labelMode, setLabelMode] = React.useState('Note');

  const SCALES = ['Major','Minor','Dorian','Phrygian','Lydian','Mixolydian','Locrian','Pentatonic Maj','Pentatonic Min','Blues','Harmonic Min','Melodic Min','Whole Tone','Diminished'];
  const POS_COLORS = ['oklch(60% 0.16 285)','oklch(64% 0.16 35)','oklch(60% 0.13 165)','oklch(60% 0.13 245)','oklch(68% 0.13 70)'];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bgGrad,
      color: theme.text,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      letterSpacing: -0.005,
      paddingTop: 54,
    }}>
      {/* HEADER — minimal, glass */}
      <div style={{
        background: theme.surface,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.hairline}`,
        paddingTop: 10, paddingBottom: 14,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: theme.textMuted, letterSpacing: 0.4, marginBottom: 1 }}>Fretboard</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>
              {NOTES12[root].replace('♯','♯')} {scale}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: theme.surface,
              border: `1px solid ${theme.hairline}`,
              fontSize: 11, fontWeight: 600, color: theme.textMuted,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: 'oklch(70% 0.13 145)' }} />
              EADGBE
            </div>
            <div style={{
              width: 32, height: 32,
              borderRadius: 999,
              background: theme.surface,
              border: `1px solid ${theme.hairline}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'oklch(64% 0.16 25)',
              fontSize: 14,
            }}>♥</div>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ padding: '0 20px' }}>
          <SegmentedControl
            options={[
              { label: 'Scales', value: 'scales' },
              { label: 'Chords', value: 'chords' },
              { label: 'CAGED', value: 'caged' },
            ]}
            value={mode}
            onChange={setMode}
            theme={theme}
          />
        </div>
      </div>

      {/* FRETBOARD — featured */}
      <div style={{
        background: theme.fbBg,
        borderBottom: `1px solid ${theme.hairline}`,
        padding: '20px 0 16px 0',
        position: 'relative',
      }}>
        <PremiumFretboard theme={theme} isLight={isLight} />
      </div>

      {/* CONTROLS */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 20, paddingBottom: 20 }}>

        {/* Root note — piano keys */}
        <SectionLabel theme={theme}>Root</SectionLabel>
        <RootPicker value={root} onChange={setRoot} theme={theme} isLight={isLight} />

        {/* Scale */}
        <div style={{ marginTop: 24 }}>
          <SectionLabel theme={theme}>Scale</SectionLabel>
          <div style={{ display: 'flex', gap: 6, padding: '0 20px', overflowX: 'auto' }}>
            {SCALES.map((s, i) => (
              <Chip key={s} active={s === scale} locked={i > 8} theme={theme} onClick={() => setScale(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>

        {/* Position */}
        <div style={{ marginTop: 24 }}>
          <SectionLabel theme={theme}>Position</SectionLabel>
          <div style={{ display: 'flex', gap: 6, padding: '0 20px', overflowX: 'auto' }}>
            <Chip active={position === 'all'} theme={theme} onClick={() => setPosition('all')}>All</Chip>
            {[1,2,3,4,5].map(i => (
              <Chip key={i} active={position === String(i)} dot={POS_COLORS[i - 1]} theme={theme} onClick={() => setPosition(String(i))}>
                Pos {i}
              </Chip>
            ))}
          </div>
        </div>

        {/* Note labels */}
        <div style={{ marginTop: 24 }}>
          <SectionLabel theme={theme}>Note labels</SectionLabel>
          <div style={{ display: 'flex', gap: 6, padding: '0 20px' }}>
            {['Note','Degree','Interval','None'].map(l => (
              <Chip key={l} active={l === labelMode} theme={theme} onClick={() => setLabelMode(l)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>

      </div>

      {/* INFO PANEL — single consolidated card */}
      <div style={{
        background: theme.surface,
        borderTop: `1px solid ${theme.hairline}`,
        padding: '14px 20px 16px 20px',
      }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Notes', value: 'G  A  B  C  D  E  F♯', mono: true },
            { label: 'Formula', value: 'W W H W W W H', mono: true },
            { label: 'Degrees', value: '1 2 3 4 5 6 7', mono: true },
          ].map((card, i) => (
            <div key={card.label} style={{
              flex: card.label === 'Notes' ? 1.6 : 1,
              padding: i === 0 ? '0 14px 0 0' : '0 14px',
              borderLeft: i > 0 ? `1px solid ${theme.hairline}` : 'none',
            }}>
              <div style={{
                fontSize: 9, fontWeight: 600, color: theme.textFaint,
                letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4,
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              }}>{card.label}</div>
              <div style={{
                fontSize: 13, fontWeight: 500, color: theme.text,
                fontFamily: card.mono ? 'JetBrains Mono, ui-monospace, monospace' : 'Inter',
                letterSpacing: 0.4,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TAB BAR — refined icons */}
      <div style={{
        background: theme.surface,
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${theme.hairline}`,
        padding: '8px 8px 8px 8px',
        display: 'flex',
      }}>
        {[
          { label: 'Fretboard', icon: 'fb' },
          { label: 'Chords', icon: 'chord' },
          { label: 'Scales', icon: 'scale' },
          { label: 'CAGED', icon: 'caged' },
          { label: 'Progress.', icon: 'prog' },
          { label: 'Tools', icon: 'tools' },
        ].map((t, i) => {
          const active = i === 0;
          return (
            <div key={t.label} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 0',
              borderRadius: 10,
              background: active ? theme.surfaceActive : 'transparent',
              color: active ? theme.text : theme.textMuted,
              transition: 'all 180ms ease',
            }}>
              <TabIcon kind={t.icon} active={active} theme={theme} />
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.2 }}>{t.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabIcon({ kind, active, theme }) {
  const stroke = active ? theme.accent : theme.textMuted;
  const sw = 1.6;
  if (kind === 'fb') return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
      <line x1="2" y1="3" x2="18" y2="3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1="2" y1="8" x2="18" y2="8" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1="2" y1="13" x2="18" y2="13" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <circle cx="7" cy="3" r="1.6" fill={stroke} />
      <circle cx="13" cy="8" r="1.6" fill={stroke} />
    </svg>
  );
  if (kind === 'chord') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="3" stroke={stroke} strokeWidth={sw} />
      <line x1="5" y1="7" x2="13" y2="7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1="5" y1="11" x2="13" y2="11" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <circle cx="8" cy="7" r="1.4" fill={stroke} />
      <circle cx="11" cy="11" r="1.4" fill={stroke} />
    </svg>
  );
  if (kind === 'scale') return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
      <path d="M2 13 L5 9 L8 11 L11 5 L14 7 L18 3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (kind === 'caged') return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <circle cx="3" cy="7" r="2" fill={stroke} opacity="0.5" />
      <circle cx="7.5" cy="7" r="2" fill={stroke} opacity="0.65" />
      <circle cx="12" cy="7" r="2" fill={stroke} opacity="0.8" />
      <circle cx="16.5" cy="7" r="2" fill={stroke} />
    </svg>
  );
  if (kind === 'prog') return (
    <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <rect x="1" y="9" width="3" height="6" rx="1" fill={stroke} />
      <rect x="6" y="5" width="3" height="10" rx="1" fill={stroke} />
      <rect x="11" y="7" width="3" height="8" rx="1" fill={stroke} />
      <rect x="16" y="2" width="0" height="0" />
      <line x1="2" y1="3" x2="14" y2="3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" opacity="0.5" />
    </svg>
  );
  if (kind === 'tools') return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <line x1="4" y1="2" x2="4" y2="9" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1="12" y1="2" x2="12" y2="9" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <path d="M3 9 L13 9" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1="8" y1="9" x2="8" y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
  return null;
}

window.RedesignedScreen = RedesignedScreen;
window.THEMES = THEMES;
