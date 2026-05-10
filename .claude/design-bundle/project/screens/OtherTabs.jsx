// Redesigned versions of all the OTHER Fretionary tabs (Chords, Scales, CAGED, Progressions, Tools)
// Same Obsidian/Ivory/Studio theme system as the Fretboard redesign.

const NOTES_OT = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const NATURAL_OT = [true,false,true,false,true,true,false,true,false,true,false,true];

// === Shared atoms (reusing the same vocabulary established in RedesignedScreen) ===

function OTSection({ title, children, theme, padded = true }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: theme.textFaint,
        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
        padding: padded ? '0 20px' : 0,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      }}>{title}</div>
      {children}
    </div>
  );
}

function OTChip({ active, dot, children, theme, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 999,
      background: active ? theme.accentSoft : theme.surface,
      border: `1px solid ${active ? theme.accent : 'transparent'}`,
      fontSize: 13, fontWeight: 500, letterSpacing: 0.1,
      color: active ? theme.text : theme.textMuted,
      whiteSpace: 'nowrap', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 7,
      boxShadow: active ? `0 0 0 3px ${theme.accentSoft}` : 'none',
      transition: 'all 180ms ease',
    }}>
      {dot && <div style={{ width: 7, height: 7, borderRadius: 4, background: dot }} />}
      {children}
    </div>
  );
}

function OTHeader({ title, eyebrow, theme, right }) {
  return (
    <div style={{
      background: theme.surface,
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${theme.hairline}`,
      paddingTop: 64, // clear status bar
      paddingBottom: 18,
      padding: '64px 20px 18px 20px',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    }}>
      <div>
        {eyebrow && <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>{eyebrow}</div>}
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

function OTTabBar({ active, theme }) {
  const items = [
    { label: 'Fretboard' }, { label: 'Chords' }, { label: 'Scales' },
    { label: 'CAGED' }, { label: 'Progress.' }, { label: 'Tools' },
  ];
  return (
    <div style={{
      background: theme.surface, backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${theme.hairline}`,
      padding: '8px 8px', display: 'flex',
    }}>
      {items.map((t, i) => {
        const isOn = i === active;
        return (
          <div key={t.label} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 0', borderRadius: 10,
            background: isOn ? theme.surfaceActive : 'transparent',
            color: isOn ? theme.text : theme.textMuted,
          }}>
            <div style={{ width: 18, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 2, background: 'currentColor', borderRadius: 1, opacity: 0.9 }} />
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.2 }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// === Chord box (SVG) for Chords tab ===
function MiniChordBox({ theme, isLight }) {
  // C major chord — frets [-1, 3, 2, 0, 1, 0]
  const W = 220, H = 240;
  const PAD_T = 30, PAD_L = 24, PAD_R = 24;
  const FRETS = 5;
  const STRINGS = 6;
  const innerW = W - PAD_L - PAD_R;
  const fretH = 36;
  const stringSpace = innerW / (STRINGS - 1);
  const dotR = 11;

  const bg = isLight ? 'rgba(20,18,12,0.05)' : 'rgba(255,255,255,0.04)';
  const stroke = isLight ? 'rgba(20,18,12,0.30)' : 'rgba(242,241,236,0.35)';
  const labelColor = theme.textMuted;
  const dotFill = theme.accent;
  const rootFill = 'oklch(82% 0.14 90)';

  // C major: x=mute, frets per string from low E to high e: [x, 3, 2, 0, 1, 0]
  const positions = [
    { s: 0, fret: 'x' },
    { s: 1, fret: 3 },
    { s: 2, fret: 2 },
    { s: 3, fret: 0 },
    { s: 4, fret: 1 },
    { s: 5, fret: 0 },
  ];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Nut */}
      <rect x={PAD_L} y={PAD_T - 4} width={innerW} height={5} rx={1} fill={stroke} />
      {/* Frets */}
      {Array.from({ length: FRETS }, (_, i) => (
        <line key={i} x1={PAD_L} y1={PAD_T + (i + 1) * fretH} x2={PAD_L + innerW} y2={PAD_T + (i + 1) * fretH}
          stroke={stroke} strokeWidth={i === 0 ? 1.5 : 1} opacity={i === 0 ? 1 : 0.4} />
      ))}
      {/* Strings */}
      {Array.from({ length: STRINGS }, (_, s) => (
        <line key={s} x1={PAD_L + s * stringSpace} y1={PAD_T} x2={PAD_L + s * stringSpace} y2={PAD_T + FRETS * fretH}
          stroke={stroke} strokeWidth={0.6 + (5 - s) * 0.2} opacity={0.7} />
      ))}
      {/* Dots */}
      {positions.map(p => {
        const x = PAD_L + p.s * stringSpace;
        if (p.fret === 'x') {
          return <text key={p.s} x={x} y={PAD_T - 12} textAnchor="middle" fontSize={11} fill={labelColor} fontFamily="JetBrains Mono, monospace">×</text>;
        }
        if (p.fret === 0) {
          return <circle key={p.s} cx={x} cy={PAD_T - 10} r={5} fill="none" stroke={stroke} strokeWidth={1.2} />;
        }
        const y = PAD_T + (p.fret - 0.5) * fretH;
        const isRoot = p.s === 1; // root is on A string at fret 3 for C
        return (
          <g key={p.s}>
            <circle cx={x} cy={y} r={dotR} fill={isRoot ? rootFill : dotFill} stroke={isRoot ? 'oklch(70% 0.14 90)' : 'oklch(46% 0.14 285)'} strokeWidth={1} />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={600}
              fill={isRoot ? 'oklch(28% 0.08 90)' : '#fff'} fontFamily="JetBrains Mono, monospace">
              {p.fret}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// === CHORDS TAB ===
function ChordsTabRedesign({ theme, isLight }) {
  const cats = ['All','Triads','Seventh','Extended','Sus'];
  const intervals = [
    { name: 'R', isRoot: true },
    { name: '3', color: 'oklch(64% 0.16 25)' },
    { name: '5', color: 'oklch(62% 0.13 165)' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bgGrad, color: theme.text,
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      letterSpacing: -0.005,
    }}>
      <OTHeader
        eyebrow="Library"
        title="Chords"
        theme={theme}
        right={
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: theme.surface, border: `1px solid ${theme.hairline}`,
            fontSize: 12, fontWeight: 500, color: theme.textMuted,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>♥ <span>Saved</span></div>
        }
      />

      {/* Category chips */}
      <div style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.hairline}`,
        padding: '14px 20px',
        display: 'flex', gap: 6, overflowX: 'auto',
      }}>
        {cats.map((c, i) => (
          <OTChip key={c} active={i === 0} theme={theme}>{c}</OTChip>
        ))}
      </div>

      {/* Chord detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 20px 20px' }}>
        {/* Title + heart */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: theme.textMuted, marginBottom: 4, letterSpacing: 0.3 }}>Major triad</div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1 }}>C Major</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            background: theme.surface, border: `1px solid ${theme.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'oklch(64% 0.16 25)', fontSize: 16,
          }}>♥</div>
        </div>
        <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.55, marginBottom: 24 }}>
          The most fundamental chord — the bedrock of Western music.
        </div>

        {/* Chord box card */}
        <div style={{
          background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: 16, padding: '20px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          marginBottom: 20,
        }}>
          <MiniChordBox theme={theme} isLight={isLight} />
        </div>

        {/* Interval structure */}
        <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          Interval structure
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { name: 'R', sub: 'Root', color: 'oklch(82% 0.14 90)', textColor: 'oklch(28% 0.08 90)' },
            { name: '3', sub: 'Major 3rd', color: 'oklch(64% 0.16 25)', textColor: '#fff' },
            { name: '5', sub: 'Perfect 5th', color: 'oklch(62% 0.13 165)', textColor: '#fff' },
          ].map(i => (
            <div key={i.name} style={{
              flex: 1,
              background: theme.surface, border: `1px solid ${theme.hairline}`,
              borderRadius: 12, padding: '12px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: i.color, color: i.textColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              }}>{i.name}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>{i.sub}</div>
            </div>
          ))}
        </div>

        {/* Often resolves to */}
        <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          Often resolves to
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { to: 'F Major', label: 'IV', why: 'Plagal — soft, restful' },
            { to: 'G Major', label: 'V', why: 'Authentic — strong push' },
            { to: 'A Minor', label: 'vi', why: 'Relative minor swap' },
          ].map(c => (
            <div key={c.to} style={{
              minWidth: 200,
              background: theme.surface, border: `1px solid ${theme.hairline}`,
              borderRadius: 14, padding: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ color: theme.accent, fontSize: 16, fontWeight: 700 }}>→</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.to}</div>
              </div>
              <div style={{
                display: 'inline-block', padding: '3px 8px', borderRadius: 999,
                background: theme.accentSoft, color: theme.text,
                fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                marginBottom: 8, letterSpacing: 0.5,
              }}>{c.label}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.5 }}>{c.why}</div>
            </div>
          ))}
        </div>
      </div>

      <OTTabBar active={1} theme={theme} />
    </div>
  );
}

// === SCALES TAB ===
function ScalesTabRedesign({ theme, isLight }) {
  const cats = ['All','Major','Minor','Pentatonic','Modes','Other'];
  const scaleNotes = [
    { note: 'C', deg: '1', cls: 'root' },
    { note: 'D', deg: '2', cls: 'scale' },
    { note: 'E', deg: '3', cls: 'third' },
    { note: 'F', deg: '4', cls: 'scale' },
    { note: 'G', deg: '5', cls: 'fifth' },
    { note: 'A', deg: '6', cls: 'scale' },
    { note: 'B', deg: '7', cls: 'ext' },
  ];
  const colorFor = (cls) => {
    if (cls === 'root') return { fill: 'oklch(82% 0.14 90)', text: 'oklch(28% 0.08 90)' };
    if (cls === 'third') return { fill: 'oklch(64% 0.16 25)', text: '#fff' };
    if (cls === 'fifth') return { fill: 'oklch(62% 0.13 165)', text: '#fff' };
    if (cls === 'ext') return { fill: 'oklch(62% 0.13 245)', text: '#fff' };
    return { fill: theme.surface, text: theme.text };
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bgGrad, color: theme.text,
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      letterSpacing: -0.005,
    }}>
      <OTHeader eyebrow="Reference" title="Scales" theme={theme}
        right={
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: theme.surface, border: `1px solid ${theme.hairline}`,
            fontSize: 12, fontWeight: 500, color: theme.textMuted,
          }}>♥ Saved</div>
        }
      />

      <div style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.hairline}`,
        padding: '14px 20px',
        display: 'flex', gap: 6, overflowX: 'auto',
      }}>
        {cats.map((c, i) => (
          <OTChip key={c} active={i === 0} theme={theme}>{c}</OTChip>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 20px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: theme.textMuted, marginBottom: 4, letterSpacing: 0.3 }}>Diatonic mode</div>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, lineHeight: 1, marginBottom: 8 }}>C Major</div>
        <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.55, marginBottom: 28 }}>
          The brightest, happiest mode — the foundation that all others bend away from.
        </div>

        {/* Notes grid — color-coded by degree role */}
        <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          Notes
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {scaleNotes.map(n => {
            const c = colorFor(n.cls);
            const isPlain = n.cls === 'scale';
            return (
              <div key={n.note} style={{
                width: 46, height: 56, borderRadius: 12,
                background: isPlain ? theme.surface : c.fill,
                border: isPlain ? `1px solid ${theme.hairline}` : `1px solid transparent`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2,
              }}>
                <div style={{
                  fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  color: isPlain ? theme.text : c.text,
                }}>{n.note}</div>
                <div style={{
                  fontSize: 9, fontWeight: 600,
                  color: isPlain ? theme.textMuted : c.text, opacity: isPlain ? 1 : 0.7,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>{n.deg}</div>
              </div>
            );
          })}
        </div>

        {/* Formula box */}
        <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          Interval formula
        </div>
        <div style={{
          background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: 14, padding: '16px 18px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {['W','W','H','W','W','W','H'].map((s, i) => (
              <div key={i} style={{
                flex: 1, height: 32, borderRadius: 8,
                background: s === 'H' ? theme.accentSoft : theme.surfaceHigh,
                border: `1px solid ${s === 'H' ? theme.accent : theme.hairline}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
                color: theme.text,
              }}>{s}</div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: theme.textFaint, fontFamily: 'JetBrains Mono, monospace' }}>
            W = whole step · H = half step
          </div>
        </div>

        {/* Degrees */}
        <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          Roman degrees
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['I','ii','iii','IV','V','vi','vii°'].map(d => (
            <div key={d} style={{
              flex: 1, padding: '8px 0', borderRadius: 10,
              background: theme.surface, border: `1px solid ${theme.hairline}`,
              textAlign: 'center', fontSize: 13, fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace', color: theme.text,
            }}>{d}</div>
          ))}
        </div>
      </div>

      <OTTabBar active={2} theme={theme} />
    </div>
  );
}

// === CAGED TAB ===
function CagedTabRedesign({ theme, isLight }) {
  const SHAPES = [
    { letter: 'C', color: 'oklch(60% 0.16 285)' },
    { letter: 'A', color: 'oklch(64% 0.16 35)' },
    { letter: 'G', color: 'oklch(60% 0.13 165)' },
    { letter: 'E', color: 'oklch(60% 0.13 245)', active: true },
    { letter: 'D', color: 'oklch(68% 0.13 70)' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bgGrad, color: theme.text,
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      letterSpacing: -0.005,
    }}>
      <OTHeader eyebrow="System" title="CAGED" theme={theme} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 20px 20px' }}>
        <div style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
          Five repeating shapes — C, A, G, E, D — that map the entire neck. Each shape connects to the next; the cycle never stops.
        </div>

        {/* Shape selector — tall pills with letter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {SHAPES.map(s => {
            const active = s.active;
            return (
              <div key={s.letter} style={{
                flex: 1, aspectRatio: '1 / 1.2',
                borderRadius: 16,
                background: active ? s.color : theme.surface,
                border: active ? '1px solid transparent' : `1px solid ${theme.hairline}`,
                boxShadow: active ? `0 8px 20px ${s.color}40` : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4,
                position: 'relative',
              }}>
                {!active && <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 8, height: 8, borderRadius: 4, background: s.color,
                }} />}
                <div style={{
                  fontSize: 28, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: active ? '#fff' : theme.text,
                  letterSpacing: -1,
                }}>{s.letter}</div>
                <div style={{
                  fontSize: 9, fontWeight: 600,
                  color: active ? 'rgba(255,255,255,0.8)' : theme.textMuted,
                  letterSpacing: 1, textTransform: 'uppercase',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>shape</div>
              </div>
            );
          })}
        </div>

        {/* Shape detail card */}
        <div style={{
          background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: 16, padding: 18, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'oklch(60% 0.13 245)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
            }}>E</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>E shape</div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>Caret fret · 7</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Root on low E AND high e strings',
              'Most common barre chord shape',
              'Foundation of rock guitar',
              'Connects to D shape above it',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 8,
                  background: theme.accentSoft, color: theme.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.55 }}>{tip}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: theme.accentSoft, border: `1px solid ${theme.accent}`,
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>View on fretboard</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Highlight E shape in C key</div>
          </div>
          <div style={{ color: theme.accent, fontSize: 18 }}>→</div>
        </div>
      </div>

      <OTTabBar active={3} theme={theme} />
    </div>
  );
}

// === PROGRESSIONS TAB ===
function ProgressionsTabRedesign({ theme, isLight }) {
  const tabs = ['Common','Diatonic','Custom'];
  const progs = [
    { name: 'I–V–vi–IV', genre: 'Pop', desc: 'The "axis of awesome" — used in countless hits' },
    { name: 'ii–V–I', genre: 'Jazz', desc: 'The most fundamental jazz cadence' },
    { name: 'I–IV–V', genre: 'Blues', desc: 'Three-chord backbone of rock & blues' },
    { name: 'vi–IV–I–V', genre: 'Pop', desc: 'Minor opening, reaches resolution' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bgGrad, color: theme.text,
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      letterSpacing: -0.005,
    }}>
      <OTHeader eyebrow="Builder" title="Progressions" theme={theme} />

      {/* Sub-mode segmented */}
      <div style={{
        background: theme.surface, borderBottom: `1px solid ${theme.hairline}`,
        padding: '14px 20px',
      }}>
        <div style={{
          position: 'relative', display: 'flex',
          background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: 12, padding: 3,
        }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3, left: 3,
            width: 'calc(33.33% - 2px)',
            background: theme.surfaceActive, borderRadius: 9,
            boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 2px 6px rgba(0,0,0,0.25)',
          }} />
          {tabs.map((t, i) => (
            <div key={t} style={{
              flex: 1, position: 'relative', padding: '8px 0', textAlign: 'center',
              fontSize: 13, fontWeight: 600,
              color: i === 0 ? theme.text : theme.textMuted,
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
          Now playing
        </div>

        {/* Active progression card */}
        <div style={{
          background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: 18, padding: 18, marginBottom: 24,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: -0.5 }}>I–V–vi–IV</div>
            <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>Key of C · 90 BPM</div>
          </div>
          {/* Chord boxes */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { numeral: 'I', name: 'C', active: true },
              { numeral: 'V', name: 'G' },
              { numeral: 'vi', name: 'Am' },
              { numeral: 'IV', name: 'F' },
            ].map((c, i) => (
              <div key={i} style={{
                flex: 1, padding: '14px 0',
                background: c.active ? theme.accentSoft : theme.surfaceHigh,
                border: c.active ? `1px solid ${theme.accent}` : `1px solid ${theme.hairline}`,
                borderRadius: 12, textAlign: 'center',
                boxShadow: c.active ? `0 0 0 3px ${theme.accentSoft}` : 'none',
              }}>
                <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4, fontWeight: 600 }}>{c.numeral}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{c.name}</div>
              </div>
            ))}
          </div>
          {/* Transport */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: theme.surfaceHigh, border: `1px solid ${theme.hairline}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.textMuted, fontSize: 14,
            }}>⏮</div>
            <div style={{
              width: 48, height: 48, borderRadius: 999,
              background: theme.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18, fontWeight: 700,
              boxShadow: `0 4px 14px ${theme.accentGlow}`,
            }}>▶</div>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: theme.surfaceHigh, border: `1px solid ${theme.hairline}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.textMuted, fontSize: 14,
            }}>⏭</div>
          </div>
        </div>

        {/* Library */}
        <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
          Library
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {progs.map((p, i) => (
            <div key={i} style={{
              background: theme.surface, border: `1px solid ${theme.hairline}`,
              borderRadius: 12, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                padding: '3px 8px', borderRadius: 6,
                background: theme.surfaceHigh, color: theme.textMuted,
                fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
              }}>{p.genre}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>{p.desc}</div>
              </div>
              <div style={{ color: theme.textFaint, fontSize: 16 }}>›</div>
            </div>
          ))}
        </div>
      </div>

      <OTTabBar active={4} theme={theme} />
    </div>
  );
}

// === TOOLS TAB ===
function ToolsTabRedesign({ theme, isLight }) {
  const tools = ['Guide','Practice','Metronome'];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bgGrad, color: theme.text,
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      letterSpacing: -0.005,
    }}>
      <OTHeader eyebrow="Workshop" title="Tools" theme={theme} />

      {/* Tabs */}
      <div style={{
        background: theme.surface, borderBottom: `1px solid ${theme.hairline}`,
        padding: '14px 20px',
        display: 'flex', gap: 6,
      }}>
        {tools.map((t, i) => (
          <OTChip key={t} active={i === 2} theme={theme}>{t}</OTChip>
        ))}
      </div>

      {/* Metronome content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* BPM display */}
        <div style={{
          width: '100%',
          background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: 24, padding: '32px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
            Tempo
          </div>
          <div style={{
            fontSize: 88, fontWeight: 700, lineHeight: 1, letterSpacing: -3,
            fontFamily: 'JetBrains Mono, monospace',
            fontVariantNumeric: 'tabular-nums',
            background: `linear-gradient(180deg, ${theme.text} 0%, ${theme.textMuted} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>120</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, letterSpacing: 0.5, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>BPM</div>

          {/* Beat indicator */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {[1,2,3,4].map(b => (
              <div key={b} style={{
                width: 14, height: 14, borderRadius: 7,
                background: b === 1 ? theme.accent : theme.surfaceHigh,
                border: b === 1 ? `1px solid transparent` : `1px solid ${theme.hairline}`,
                boxShadow: b === 1 ? `0 0 12px ${theme.accentGlow}` : 'none',
              }} />
            ))}
          </div>
        </div>

        {/* Tempo slider */}
        <div style={{
          width: '100%',
          background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: 16, padding: '18px',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textFaint, fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
            <span>40</span><span>240</span>
          </div>
          <div style={{ position: 'relative', height: 6, background: theme.surfaceHigh, borderRadius: 3 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: theme.accent, borderRadius: 3 }} />
            <div style={{
              position: 'absolute', top: -7, left: 'calc(40% - 10px)',
              width: 20, height: 20, borderRadius: 10,
              background: theme.text, boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
            }} />
          </div>
        </div>

        {/* Time sig + tap tempo row */}
        <div style={{ width: '100%', display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{
            flex: 1,
            background: theme.surface, border: `1px solid ${theme.hairline}`,
            borderRadius: 14, padding: '12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: theme.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Time signature</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>4/4</div>
          </div>
          <div style={{
            flex: 1,
            background: theme.accentSoft, border: `1px solid ${theme.accent}`,
            borderRadius: 14, padding: '12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: theme.text, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Tap</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>tempo</div>
          </div>
        </div>

        {/* Play button */}
        <div style={{
          width: 88, height: 88, borderRadius: 999,
          background: theme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 32,
          boxShadow: `0 12px 32px ${theme.accentGlow}, 0 0 0 6px ${theme.accentSoft}`,
        }}>▶</div>
      </div>

      <OTTabBar active={5} theme={theme} />
    </div>
  );
}

window.ChordsTabRedesign = ChordsTabRedesign;
window.ScalesTabRedesign = ScalesTabRedesign;
window.CagedTabRedesign = CagedTabRedesign;
window.ProgressionsTabRedesign = ProgressionsTabRedesign;
window.ToolsTabRedesign = ToolsTabRedesign;
