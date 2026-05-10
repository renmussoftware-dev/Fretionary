// Faithful rebuild of the CURRENT Fretionary fretboard screen — for side-by-side comparison.

const C_COLORS = {
  bg: '#0F0F11',
  surface: '#1A1A1F',
  surfaceHigh: '#232329',
  border: '#2E2E38',
  text: '#F0EFE8',
  textMuted: '#888680',
  textFaint: '#4A4A54',
  accent: '#534AB7',
  rootFill: '#E8D44D',
  rootStroke: '#C4A800',
  rootText: '#5C4400',
  third: { fill: '#E24B4A', stroke: '#A32D2D' },
  fifth: { fill: '#1D9E75', stroke: '#0F6E56' },
  ext:   { fill: '#378ADD', stroke: '#185FA5' },
  scale: { fill: '#3A3A46', stroke: '#52525F', text: '#C0BEB8' },
};

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Sample data: G major scale — root=7
const TUNING = [4, 11, 7, 2, 9, 4]; // EBGDAE -> high to low: e B G D A E
const SCALE_NOTES_G_MAJOR = [7, 9, 11, 0, 2, 4, 6]; // G A B C D E F#

function classifyNote(noteIdx, root) {
  if (noteIdx === root) return 'root';
  const intv = (noteIdx - root + 12) % 12;
  if (intv === 4) return 'third';
  if (intv === 7) return 'fifth';
  if (intv === 11) return 'ext';
  return 'scale';
}

function CurrentFretboard() {
  const TOTAL_FRETS = 15;
  const STR_COUNT = 6;
  const LEFT_PAD = 28;
  const TOP_PAD = 24;
  const FRET_W = 52;
  const STR_H = 34;
  const NUT_W = 6;
  const DOT_R = 13;
  const SVG_W = LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W + 16;
  const SVG_H = TOP_PAD + (STR_COUNT - 1) * STR_H + 36;
  const INLAY_FRETS = [3, 5, 7, 9, 12, 15];
  const root = 7;

  const fretX = (f) => f === 0 ? LEFT_PAD + NUT_W / 2 : LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
  const strY = (s) => TOP_PAD + s * STR_H;

  const stringNames = ['e','B','G','D','A','E'];

  const dots = [];
  for (let s = 0; s < STR_COUNT; s++) {
    for (let f = 0; f <= TOTAL_FRETS; f++) {
      const ni = (TUNING[s] + f) % 12;
      if (!SCALE_NOTES_G_MAJOR.includes(ni)) continue;
      const cls = classifyNote(ni, root);
      let fill, stroke, textColor;
      if (cls === 'root') { fill = C_COLORS.rootFill; stroke = C_COLORS.rootStroke; textColor = C_COLORS.rootText; }
      else if (cls === 'third') { fill = C_COLORS.third.fill; stroke = C_COLORS.third.stroke; textColor = '#fff'; }
      else if (cls === 'fifth') { fill = C_COLORS.fifth.fill; stroke = C_COLORS.fifth.stroke; textColor = '#fff'; }
      else if (cls === 'ext') { fill = C_COLORS.ext.fill; stroke = C_COLORS.ext.stroke; textColor = '#fff'; }
      else { fill = C_COLORS.scale.fill; stroke = C_COLORS.scale.stroke; textColor = C_COLORS.scale.text; }
      dots.push({ x: fretX(f), y: strY(s), label: NOTES[ni], fill, stroke, textColor });
    }
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
        {INLAY_FRETS.map(f => {
          const x = LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
          if (f === 12) return (
            <g key={f}>
              <circle cx={x} cy={strY(1.5)} r={4} fill="#252528" />
              <circle cx={x} cy={strY(3.5)} r={4} fill="#252528" />
            </g>
          );
          return <circle key={f} cx={x} cy={strY(2.5)} r={4} fill="#252528" />;
        })}
        {Array.from({ length: STR_COUNT }, (_, s) => (
          <g key={s}>
            <line x1={LEFT_PAD} y1={strY(s)} x2={LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W} y2={strY(s)}
              stroke="#3A3A46" strokeWidth={0.6 + (s / STR_COUNT) * 2} />
            <text x={LEFT_PAD - 6} y={strY(s) + 4} textAnchor="middle" fontSize={10} fill={C_COLORS.textMuted} fontWeight="500">
              {stringNames[s]}
            </text>
          </g>
        ))}
        <rect x={LEFT_PAD} y={strY(0) - 10} width={NUT_W} height={(STR_COUNT - 1) * STR_H + 20} rx={3} fill="#888680" />
        {Array.from({ length: TOTAL_FRETS }, (_, i) => i + 1).map(f => (
          <line key={f} x1={LEFT_PAD + NUT_W + f * FRET_W} y1={strY(0) - 8}
            x2={LEFT_PAD + NUT_W + f * FRET_W} y2={strY(5) + 8} stroke="#2E2E38" strokeWidth={1} />
        ))}
        {[1,3,5,7,9,12,15].map(f => (
          <text key={f} x={LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2} y={SVG_H - 4}
            textAnchor="middle" fontSize={9} fill={C_COLORS.textFaint}>{f}</text>
        ))}
        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={DOT_R} fill={d.fill} stroke={d.stroke} strokeWidth={1.5} />
            <text x={d.x} y={d.y + 4} textAnchor="middle" fontSize={9} fontWeight="600" fill={d.textColor}>
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CurrentScreen() {
  const SCALES = ['Major','Minor','Dorian','Phrygian','Lydian','Mixolydian','Locrian','Pentatonic Major','Pentatonic Minor','Blues','Harmonic Minor','Melodic Minor','Whole Tone','Diminished'];
  const POSITIONS = ['All','Pos 1','Pos 2','Pos 3','Pos 4','Pos 5'];
  const LABELS = ['Note','Degree','Interval','None'];
  const POS_COLORS = ['#534AB7','#D85A30','#1D9E75','#378ADD','#BA7517'];

  return (
    <div style={{ width: '100%', height: '100%', background: C_COLORS.bg, color: C_COLORS.text, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 54 }}>
      {/* TopBar */}
      <div style={{ background: C_COLORS.surface, borderBottom: `1px solid ${C_COLORS.border}`, paddingTop: 8, paddingBottom: 12, gap: 8, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 16px', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', background: C_COLORS.bg, borderRadius: 10, padding: 3, border: `1px solid ${C_COLORS.border}` }}>
            {['Scales','Chords','CAGED'].map((m, i) => (
              <div key={m} style={{ flex: 1, padding: '7px 0', textAlign: 'center', borderRadius: 6, background: i === 0 ? C_COLORS.surfaceHigh : 'transparent', fontSize: 13, fontWeight: 500, color: i === 0 ? C_COLORS.text : C_COLORS.textMuted }}>
                {m}
              </div>
            ))}
          </div>
          <div style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C_COLORS.border}`, background: C_COLORS.bg, fontSize: 11, color: C_COLORS.textMuted }}>
            Standard ▾
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${C_COLORS.border}`, background: C_COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E24B4A', fontSize: 14, fontWeight: 700 }}>♥</div>
        </div>
        <div style={{ display: 'flex', padding: '0 16px', gap: 6, overflowX: 'auto' }}>
          {NOTES.map((n, i) => (
            <div key={n} style={{ padding: '5px 10px', borderRadius: 999, border: `1px solid ${i === 7 ? '#C4A800' : C_COLORS.border}`, background: i === 7 ? '#E8D44D' : C_COLORS.bg, fontSize: 12, fontWeight: 500, color: i === 7 ? '#5C4400' : C_COLORS.textMuted, whiteSpace: 'nowrap' }}>
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Fretboard */}
      <div style={{ background: C_COLORS.surface, borderBottom: `1px solid ${C_COLORS.border}`, padding: '12px 0' }}>
        <CurrentFretboard />
      </div>

      {/* Controls */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C_COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4, padding: '0 16px' }}>Scale</div>
          <div style={{ display: 'flex', gap: 6, padding: '0 16px', overflowX: 'auto' }}>
            {SCALES.map((s, i) => (
              <div key={s} style={{ padding: '7px 12px', borderRadius: 999, border: `1px solid ${i === 0 ? C_COLORS.accent : C_COLORS.border}`, background: i === 0 ? C_COLORS.accent : C_COLORS.surface, fontSize: 13, fontWeight: 500, color: i === 0 ? '#fff' : C_COLORS.textMuted, whiteSpace: 'nowrap' }}>{s}</div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C_COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4, padding: '0 16px' }}>Position</div>
          <div style={{ display: 'flex', gap: 6, padding: '0 16px', overflowX: 'auto' }}>
            {POSITIONS.map((p, i) => (
              <div key={p} style={{ padding: '7px 12px', borderRadius: 999, border: `1px solid ${C_COLORS.border}`, background: C_COLORS.surface, fontSize: 13, fontWeight: 500, color: C_COLORS.textMuted, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <div style={{ width: 6, height: 6, borderRadius: 3, background: POS_COLORS[i - 1] }} />}
                {p}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C_COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4, padding: '0 16px' }}>Note labels</div>
          <div style={{ display: 'flex', gap: 6, padding: '0 16px' }}>
            {LABELS.map((l, i) => (
              <div key={l} style={{ padding: '7px 12px', borderRadius: 999, border: `1px solid ${i === 0 ? C_COLORS.accent : C_COLORS.border}`, background: i === 0 ? C_COLORS.accent : C_COLORS.surface, fontSize: 13, fontWeight: 500, color: i === 0 ? '#fff' : C_COLORS.textMuted }}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      {/* InfoPanel */}
      <div style={{ background: C_COLORS.surface, borderTop: `1px solid ${C_COLORS.border}`, padding: '12px 0' }}>
        <div style={{ display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto' }}>
          {[['Notes','G  ·  A  ·  B  ·  C  ·  D  ·  E  ·  F#'],['Formula','W W H W W W H'],['Degrees','1  2  3  4  5  6  7']].map(([label, val]) => (
            <div key={label} style={{ background: C_COLORS.surfaceHigh, borderRadius: 10, padding: '8px 12px', minWidth: 120, border: `1px solid ${C_COLORS.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: C_COLORS.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: C_COLORS.text, whiteSpace: 'nowrap' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C_COLORS.surface, borderTop: `1px solid ${C_COLORS.border}`, paddingTop: 6, paddingBottom: 6, display: 'flex' }}>
        {['Fretboard','Chords','Scales','CAGED','Progressions','Tools'].map((t, i) => (
          <div key={t} style={{ flex: 1, textAlign: 'center', color: i === 0 ? C_COLORS.accent : C_COLORS.textMuted }}>
            <div style={{ height: 16, marginBottom: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: 18, height: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ height: 1.5, background: i === 0 ? C_COLORS.accent : C_COLORS.textMuted, borderRadius: 1 }} />
                <div style={{ height: 1.5, background: i === 0 ? C_COLORS.accent : C_COLORS.textMuted, borderRadius: 1 }} />
                <div style={{ height: 1.5, background: i === 0 ? C_COLORS.accent : C_COLORS.textMuted, borderRadius: 1 }} />
              </div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 600 }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.CurrentScreen = CurrentScreen;
