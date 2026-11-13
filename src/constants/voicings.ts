// Curated chord voicing templates — every shape is machine-checked against the
// chord's interval formula (no foreign notes, root in the bass, the defining
// tones present, playable span).
// frets[0]=low E, frets[5]=high e | null=muted | values=offsets from rootFret
// Negative offsets are valid (some strings need frets below the root string
// fret). getChordVoicings slides a shape up an octave when it would otherwise
// fall below the nut, so every template yields a voicing for every root.
//
// Interval each string produces, per root string (o = the string's offset):
//   E root:  E=o    A=5+o  D=10+o  G=3+o   B=7+o  e=o
//   A root:  E=7+o  A=o    D=5+o   G=10+o  B=2+o  e=7+o
//   D root:                D=o     G=5+o   B=9+o  e=2+o

export interface VoicingTemplate {
  frets: (number | null)[];
  rootString: number; // 0=lowE 1=A 2=D 3=G
  label: string;
  position: 'open' | 'low' | 'mid' | 'high';
}

export const VOICING_TEMPLATES: Record<string, VoicingTemplate[]> = {

  // ── Triads ────────────────────────────────────────────────────────────────

  // R 3 5
  'Major': [
    { frets:[0,2,2,1,0,0],          rootString:0, label:'E shape',  position:'low'  },
    { frets:[null,0,2,2,2,0],       rootString:1, label:'A shape',  position:'mid'  },
    { frets:[null,null,0,2,3,2],    rootString:2, label:'D shape',  position:'high' },
    // C-shape barre — open-C transposed (x32010 at C).
    { frets:[null,0,-1,-3,-2,-3],   rootString:1, label:'C shape',  position:'mid'  },
    // G-shape barre — open-G transposed (320003 at G). Wide stretch.
    { frets:[0,-1,-3,-3,-3,0],      rootString:0, label:'G shape',  position:'low'  },
  ],

  // R b3 5
  'Minor': [
    { frets:[0,2,2,0,0,0],       rootString:0, label:'Em shape', position:'low'  },
    { frets:[null,0,2,2,1,0],    rootString:1, label:'Am shape', position:'mid'  },
    { frets:[null,null,0,2,3,1], rootString:2, label:'Dm shape', position:'high' },
    // The two CAGED minor shapes with no clean open chord — Cm x31013 and
    // Gm 310033 at their home roots. Barre-style only; they complete the
    // minor loop so the CAGED tab can draw all five reference grips.
    { frets:[null,0,-2,-3,-2,0], rootString:1, label:'Cm shape', position:'mid'  },
    { frets:[0,-2,-3,-3,0,0],    rootString:0, label:'Gm shape', position:'low'  },
  ],

  // R b3 b5
  'Diminished': [
    { frets:[0,1,2,0,null,null],    rootString:0, label:'Dim (E root)', position:'low'  }, // R ♭5 R ♭3
    { frets:[null,0,1,2,1,null],    rootString:1, label:'Dim (A root)', position:'mid'  }, // R ♭5 R ♭3
    { frets:[null,null,0,1,3,1],    rootString:2, label:'Dim (D root)', position:'high' }, // R ♭5 R ♭3
  ],

  // R 3 #5
  'Augmented': [
    { frets:[0,3,2,1,1,0],          rootString:0, label:'Aug (E root)', position:'low'  }, // R ♯5 R 3 ♯5 R
    { frets:[null,0,3,2,2,null],    rootString:1, label:'Aug (A root)', position:'mid'  },
    { frets:[null,null,0,3,3,2],    rootString:2, label:'Aug (D root)', position:'high' },
  ],

  // R 2 5
  'Sus2': [
    { frets:[null,0,2,2,0,0],      rootString:1, label:'Sus2 (A root)', position:'mid'  },
    { frets:[null,null,0,2,3,0],   rootString:2, label:'Sus2 (D root)', position:'high' },
  ],

  // R 4 5
  'Sus4': [
    { frets:[0,2,2,2,0,0],         rootString:0, label:'Sus4 (E root)', position:'low'  }, // R 5 R 4 5 R
    { frets:[null,0,2,2,3,0],      rootString:1, label:'Sus4 (A root)', position:'mid'  },
    { frets:[null,null,0,2,3,3],   rootString:2, label:'Sus4 (D root)', position:'high' },
  ],

  // R 5
  'Power (5)': [
    { frets:[0,2,2,null,null,null],    rootString:0, label:'Power (E root)', position:'low'  },
    { frets:[null,0,2,2,null,null],    rootString:1, label:'Power (A root)', position:'mid'  },
    { frets:[null,null,0,2,3,null],    rootString:2, label:'Power (D root)', position:'high' },
  ],

  // ── Seventh Chords ────────────────────────────────────────────────────────

  // R 4 5 b7 — sus4 with a dominant 7. Funk + modal jazz favorite.
  'Dom 7sus4': [
    { frets:[0,2,0,2,0,0],       rootString:0, label:'E shape',  position:'low'  }, // R 5 ♭7 4 5 R
    { frets:[null,0,2,0,3,0],    rootString:1, label:'A shape',  position:'mid'  }, // R 5 ♭7 4 5
    { frets:[null,null,0,2,1,3], rootString:2, label:'D shape',  position:'high' }, // R 5 ♭7 4
  ],

  // R 3 5 b7
  'Dominant 7': [
    { frets:[0,2,0,1,0,0],          rootString:0, label:'E7 shape',  position:'low'  },
    { frets:[null,0,2,0,2,0],       rootString:1, label:'A7 shape',  position:'mid'  },
    { frets:[null,null,0,2,1,2],    rootString:2, label:'Jazz dom7', position:'high' },
    { frets:[null,0,-1,0,-2,null],  rootString:1, label:'C7 shape',  position:'mid'  }, // R 3 ♭7 R
  ],

  // R 3 5 M7
  'Major 7': [
    { frets:[0,null,1,1,0,0],       rootString:0, label:'Emaj7 shape',   position:'low'  },
    { frets:[null,0,2,1,2,null],    rootString:1, label:'Jazz maj7',     position:'mid'  },
    { frets:[null,null,0,2,2,2],    rootString:2, label:'Jazz maj7 (D)', position:'high' },
    { frets:[null,0,-1,-3,-3,-3],   rootString:1, label:'Cmaj7 shape',   position:'mid'  }, // R 3 5 7 3
  ],

  // R b3 5 b7
  'Minor 7': [
    { frets:[0,2,0,0,0,0],          rootString:0, label:'Em7 shape',     position:'low'  },
    { frets:[null,0,2,0,1,0],       rootString:1, label:'Am7 shape',     position:'mid'  },
    { frets:[null,null,0,2,1,1],    rootString:2, label:'Jazz min7 (D)', position:'high' },
    { frets:[0,null,0,0,0,null],    rootString:0, label:'Jazz min7 (E)', position:'low'  }, // R ♭7 ♭3 5
  ],

  // R b3 5 M7
  'Minor Maj7': [
    { frets:[0,2,1,0,0,0],       rootString:0, label:'mMaj7 (E root)', position:'low'  }, // R 5 7 ♭3 5 R
    { frets:[null,0,2,1,1,0],    rootString:1, label:'mMaj7 (A root)', position:'mid'  },
    { frets:[null,null,0,2,2,1], rootString:2, label:'mMaj7 (D root)', position:'high' },
  ],

  // R b3 b5 bb7
  'Dim 7': [
    { frets:[0,null,-1,0,-1,null],  rootString:0, label:'Dim7 (E root)', position:'low'  }, // R ♭♭7 ♭3 ♭5
    { frets:[null,0,1,-1,1,null],   rootString:1, label:'Dim7 (A root)', position:'mid'  }, // R ♭5 ♭♭7 ♭3
    { frets:[null,null,0,1,0,1],    rootString:2, label:'Dim7 (D root)', position:'high' }, // R ♭5 ♭♭7 ♭3
  ],

  // R b3 b5 b7
  'Half-Dim 7': [
    { frets:[0,null,0,0,-1,null],   rootString:0, label:'ø7 (E root)', position:'low'  }, // R ♭7 ♭3 ♭5
    { frets:[null,0,1,0,1,null],    rootString:1, label:'ø7 (A root)', position:'mid'  },
    { frets:[null,null,0,1,1,1],    rootString:2, label:'ø7 (D root)', position:'high' },
  ],

  // R 3 #5 b7
  'Aug 7': [
    { frets:[0,null,0,1,1,null],    rootString:0, label:'Aug7 (E root)', position:'low'  }, // R ♭7 3 ♯5
    { frets:[null,0,3,0,2,null],    rootString:1, label:'Aug7 (A root)', position:'mid'  },
    { frets:[null,null,0,3,1,2],    rootString:2, label:'Aug7 (D root)', position:'high' }, // R ♯5 ♭7 3
  ],

  // ── Sixth Chords ──────────────────────────────────────────────────────────

  // R 3 5 6
  'Major 6': [
    { frets:[0,null,-1,1,0,null],   rootString:0, label:'Maj6 (E root)', position:'low'  }, // R 6 3 5
    { frets:[null,0,2,2,2,2],       rootString:1, label:'Maj6 (A root)', position:'mid'  }, // R 5 R 3 6
    { frets:[null,null,0,2,0,2],    rootString:2, label:'Maj6 (D root)', position:'high' }, // R 5 6 3
  ],

  // R b3 5 6
  'Minor 6': [
    { frets:[0,null,-1,0,0,null],   rootString:0, label:'Min6 (E root)', position:'low'  }, // R 6 ♭3 5
    { frets:[null,0,-2,-1,-2,0],    rootString:1, label:'Min6 (A root)', position:'mid'  }, // R ♭3 6 R 5
    { frets:[null,0,2,2,1,2],       rootString:1, label:'Am6 shape',     position:'mid'  }, // R 5 R ♭3 6
    { frets:[null,null,0,2,0,1],    rootString:2, label:'Min6 (D root)', position:'high' },
  ],

  // ── Extended Chords ───────────────────────────────────────────────────────

  // R 3 5 b7 9
  'Dominant 9': [
    { frets:[null,0,-1,0,0,0],      rootString:1, label:'Dom9 (A root)', position:'mid' }, // R 3 ♭7 9 5
    { frets:[0,2,0,1,0,2],          rootString:0, label:'E9 shape',      position:'low' }, // R 5 ♭7 3 5 9
    { frets:[0,-1,0,-1,null,null],  rootString:0, label:'Dom9 (E root)', position:'low' }, // R 3 ♭7 9
  ],

  // R 3 5 M7 9
  'Major 9': [
    { frets:[null,0,-1,1,0,null],   rootString:1, label:'Maj9 (A root)', position:'mid' }, // R 3 7 9
    { frets:[0,-1,1,-1,null,null],  rootString:0, label:'Maj9 (E root)', position:'low' }, // R 3 7 9
  ],

  // R b3 5 b7 9
  'Minor 9': [
    { frets:[null,0,-2,0,0,null],   rootString:1, label:'Min9 (A root)', position:'mid' }, // R ♭3 ♭7 9
    { frets:[0,2,0,0,0,2],          rootString:0, label:'Min9 (E root)', position:'low' }, // R 5 ♭7 ♭3 5 9
  ],

  // R 3 5 9 (no 7th)
  'Add9': [
    { frets:[null,0,-1,-3,0,0],     rootString:1, label:'Add9 (A root)', position:'mid'  }, // R 3 5 9 5
    { frets:[0,-1,-3,-1,null,null], rootString:0, label:'Add9 (E root)', position:'low'  }, // R 3 5 9
    { frets:[null,null,0,-1,-2,0],  rootString:2, label:'Add9 (D root)', position:'high' }, // R 3 5 9
  ],

  // R 3 5 b7 9 11 — the 3rd is omitted (it clashes with the 11th)
  'Dominant 11': [
    { frets:[null,0,0,0,0,0],       rootString:1, label:'Dom11 (A root)', position:'mid'  }, // R 11 ♭7 9 5
    { frets:[0,null,0,-1,-2,null],  rootString:0, label:'Dom11 (E root)', position:'low'  }, // R ♭7 9 11
    { frets:[null,null,0,0,1,0],    rootString:2, label:'Dom11 (D root)', position:'high' }, // R 11 ♭7 9
  ],

  // R 3 5 M7 9 11 — 3rd omitted
  'Major 11': [
    { frets:[null,0,0,1,0,0],       rootString:1, label:'Maj11 (A root)', position:'mid'  }, // R 11 7 9 5
    { frets:[0,null,1,-1,-2,null],  rootString:0, label:'Maj11 (E root)', position:'low'  }, // R 7 9 11
    { frets:[null,null,0,0,2,0],    rootString:2, label:'Maj11 (D root)', position:'high' }, // R 11 7 9
  ],

  // R b3 5 b7 9 11
  'Minor 11': [
    { frets:[null,0,0,0,1,0],       rootString:1, label:'Min11 (A root)', position:'mid'  }, // R 11 ♭7 ♭3 5
    { frets:[0,null,0,0,-2,null],   rootString:0, label:'Min11 (E root)', position:'low'  }, // R ♭7 ♭3 11
    { frets:[null,null,0,0,1,1],    rootString:2, label:'Min11 (D root)', position:'high' }, // R 11 ♭7 ♭3
  ],

  // R 3 5 b7 (9 11) 13
  'Dominant 13': [
    { frets:[null,0,2,0,2,2],       rootString:1, label:'Dom13 (A root)', position:'mid' }, // R 5 ♭7 3 13
    { frets:[0,null,0,1,2,null],    rootString:0, label:'Dom13 (E root)', position:'low' }, // R ♭7 3 13
    { frets:[null,0,-1,0,0,2],      rootString:1, label:'Dom13 with 9',   position:'mid' }, // R 3 ♭7 9 13
  ],

  // R 3 5 M7 (9 11) 13
  'Major 13': [
    { frets:[null,0,2,1,2,2],       rootString:1, label:'Maj13 (A root)', position:'mid' }, // R 5 7 3 13
    { frets:[0,null,1,1,2,null],    rootString:0, label:'Maj13 (E root)', position:'low' }, // R 7 3 13
  ],

  // R b3 5 b7 (9 11) 13
  'Minor 13': [
    { frets:[null,0,2,0,1,2],       rootString:1, label:'Min13 (A root)', position:'mid' }, // R 5 ♭7 ♭3 13
    { frets:[0,null,0,0,2,null],    rootString:0, label:'Min13 (E root)', position:'low' }, // R ♭7 ♭3 13
  ],

  // R b3 5 9 — minor triad + 9th
  'Minor Add9': [
    { frets:[null,0,-2,-3,0,null],  rootString:1, label:'mAdd9 (A root)', position:'mid'  }, // R ♭3 5 9
    { frets:[0,-2,-3,-1,null,null], rootString:0, label:'mAdd9 (E root)', position:'low'  }, // R ♭3 5 9
    { frets:[null,null,0,-2,-2,0],  rootString:2, label:'mAdd9 (D root)', position:'high' }, // R ♭3 5 9
  ],

  // R 3 5 11 — major triad + 11th
  'Add11': [
    { frets:[0,0,2,1,0,0],          rootString:0, label:'Add11 (E root)', position:'low'  }, // R 11 R 3 5 R
    { frets:[null,0,0,2,2,0],       rootString:1, label:'Add11 (A root)', position:'mid'  }, // R 11 R 3 5
    { frets:[null,null,0,0,3,2],    rootString:2, label:'Add11 (D root)', position:'high' }, // R 11 R 3
  ],

  // R 3 5 6 9 — no 7th
  '6/9': [
    { frets:[null,0,-1,-1,0,0],     rootString:1, label:'6/9 (A root)', position:'mid'  }, // R 3 6 9 5
    { frets:[0,-1,-1,-1,0,0],       rootString:0, label:'6/9 (E root)', position:'low'  }, // R 3 6 9 5 R
    { frets:[null,null,0,-1,0,0],   rootString:2, label:'6/9 (D root)', position:'high' }, // R 3 6 9
  ],

  // R b3 5 6 9
  'Minor 6/9': [
    { frets:[null,0,-2,-1,0,0],     rootString:1, label:'m6/9 (A root)', position:'mid'  }, // R ♭3 6 9 5
    { frets:[0,-2,-1,-1,0,0],       rootString:0, label:'m6/9 (E root)', position:'low'  }, // R ♭3 6 9 5 R
    { frets:[null,null,0,-2,0,0],   rootString:2, label:'m6/9 (D root)', position:'high' }, // R ♭3 6 9
  ],

  // R 3 b5 b7
  'Dom 7♭5': [
    { frets:[0,null,0,1,-1,null],   rootString:0, label:'7b5 (E root)', position:'low'  }, // R ♭7 3 ♭5
    { frets:[null,0,1,0,2,null],    rootString:1, label:'7b5 (A root)', position:'mid'  }, // R ♭5 ♭7 3
    { frets:[null,null,0,1,1,2],    rootString:2, label:'7b5 (D root)', position:'high' }, // R ♭5 ♭7 3
  ],

  // R 3 5 b7 b9
  'Dom 7♭9': [
    { frets:[null,0,-1,0,-1,null],  rootString:1, label:'7b9 (A root)', position:'mid'  }, // R 3 ♭7 ♭9
    { frets:[0,2,0,1,0,1],          rootString:0, label:'7b9 (E root)', position:'low'  }, // R 5 ♭7 3 5 ♭9
    { frets:[null,null,0,-1,1,-1],  rootString:2, label:'7b9 (D root)', position:'high' }, // R 3 ♭7 ♭9
  ],

  // R 3 5 b7 #9 — Hendrix chord
  'Dom 7♯9': [
    { frets:[null,0,-1,0,1,null],   rootString:1, label:'7#9 (A root)', position:'mid'  }, // R 3 ♭7 ♯9
    { frets:[0,2,0,1,0,3],          rootString:0, label:'7#9 (E root)', position:'low'  }, // R 5 ♭7 3 5 ♯9
    { frets:[null,null,0,-1,1,1],   rootString:2, label:'7#9 (D root)', position:'high' }, // R 3 ♭7 ♯9
  ],

  // R 3 5 b7 #11 — the natural 5th sits a semitone under the ♯11, so the
  // standard grips drop it.
  'Dom 7♯11': [
    { frets:[0,null,0,1,-1,null],   rootString:0, label:'7#11 (E root)', position:'low'  }, // R ♭7 3 ♯11
    { frets:[null,0,1,0,2,null],    rootString:1, label:'7#11 (A root)', position:'mid'  }, // R ♯11 ♭7 3
    { frets:[null,null,0,1,1,2],    rootString:2, label:'7#11 (D root)', position:'high' }, // R ♯11 ♭7 3
  ],

  // R 3 5 7 #11 — Lydian chord
  'Maj7♯11': [
    { frets:[0,null,1,1,-1,null],   rootString:0, label:'Maj7#11 (E root)',  position:'low'  }, // R 7 3 ♯11
    { frets:[null,0,1,1,2,null],    rootString:1, label:'Maj7#11 (A root)',  position:'mid'  }, // R ♯11 7 3
    { frets:[null,null,0,1,2,2],    rootString:2, label:'Maj7#11 (D root)',  position:'high' }, // R ♯11 7 3
    { frets:[null,0,-1,-3,-3,-1],   rootString:1, label:'Maj7#11 (C shape)', position:'mid'  }, // R 3 5 7 ♯11
    { frets:[null,null,0,-1,-3,-3], rootString:2, label:'Maj7#11 (F shape)', position:'high' }, // R 3 ♯11 7
  ],

  // ── Suspended sevenths and Lydian colours ─────────────────────────────────

  // R 2 5 b7
  '7sus2': [
    { frets:[0,null,0,-1,0,null],   rootString:0, label:'7sus2 (E root)', position:'low'  }, // R ♭7 2 5
    { frets:[null,0,2,0,0,0],       rootString:1, label:'7sus2 (A root)', position:'mid'  }, // R 5 ♭7 2 5
    { frets:[null,null,0,2,1,0],    rootString:2, label:'7sus2 (D root)', position:'high' }, // R 5 ♭7 2
  ],

  // R 2 5 7
  'Maj7sus2': [
    { frets:[0,-3,-3,-3,0,-1],      rootString:0, label:'Maj7sus2 (E root)', position:'low'  }, // R 2 5 R 5 7
    { frets:[null,0,2,1,0,0],       rootString:1, label:'Maj7sus2 (A root)', position:'mid'  }, // R 5 7 2 5
    { frets:[null,null,0,2,2,0],    rootString:2, label:'Maj7sus2 (D root)', position:'high' }, // R 5 7 2
  ],

  // R 4 5 7
  'Maj7sus4': [
    { frets:[0,0,1,2,0,0],          rootString:0, label:'Maj7sus4 (E root)', position:'low'  }, // R 4 7 4 5 R
    { frets:[null,0,2,1,3,0],       rootString:1, label:'Maj7sus4 (A root)', position:'mid'  }, // R 5 7 4 5
    { frets:[null,null,0,2,2,3],    rootString:2, label:'Maj7sus4 (D root)', position:'high' }, // R 5 7 4
  ],

  // R 4 5 b7 9 — the A-root shape is the straight five-string barre players
  // already know as "sus9"; every string lands on a chord tone at the same fret.
  '9sus4': [
    { frets:[null,0,0,0,0,0],       rootString:1, label:'9sus4 (A root)', position:'mid'  }, // R 4 ♭7 9 5
    { frets:[0,null,0,-1,-2,null],  rootString:0, label:'9sus4 (E root)', position:'low'  }, // R ♭7 9 4
    { frets:[null,null,0,0,1,0],    rootString:2, label:'9sus4 (D root)', position:'high' }, // R 4 ♭7 9
  ],

  // R 3 #5 7
  'Maj7♯5': [
    { frets:[0,-1,1,1,1,-1],        rootString:0, label:'Maj7#5 (E root)', position:'low'  }, // R 3 7 3 ♯5 7
    { frets:[null,0,-1,-2,-3,-3],   rootString:1, label:'Maj7#5 (A root)', position:'mid'  }, // R 3 ♯5 7 3
    { frets:[null,null,0,3,2,2],    rootString:2, label:'Maj7#5 (D root)', position:'high' }, // R ♯5 7 3
  ],

  // R 3 5 7 9 #11 — six notes, six strings, and the ♯11 wants room, so both
  // shapes drop the 5th. Standard practice: the ♯11 is the colour tone and a
  // natural 5th a semitone below it just muddies the voicing.
  'Maj9♯11': [
    { frets:[0,-1,1,-1,-1,-1],  rootString:0, label:'Maj9#11 (E root)', position:'low' }, // R 3 7 9 ♯11 7
    { frets:[null,0,-1,1,0,-1], rootString:1, label:'Maj9#11 (A root)', position:'mid' }, // R 3 7 9 ♯11
  ],
};

// Open-position chords that only exist at one root — they lean on open
// strings, so they can't be slid up the neck like the templates above.
// Absolute frets, low E first. Keyed by chord, then by root note name.
export const OPEN_VOICINGS: Record<string, Record<string, (number | null)[][]>> = {
  'Augmented':   { 'C': [[null,3,2,1,1,0]] },
  'Sus2':        { 'C': [[null,3,0,0,3,3]], 'E': [[0,2,4,4,0,0]], 'F': [[null,null,3,0,1,1]], 'G': [[3,0,0,2,3,3]] },
  'Sus4':        { 'C': [[null,3,3,0,1,1]], 'G': [[3,null,0,0,1,3]] },
  'Dom 7sus4':   { 'G': [[3,3,0,0,1,1]] },
  'Dominant 7':  { 'C': [[null,3,2,3,1,0]], 'G': [[3,2,0,0,0,1]], 'B': [[null,2,1,2,0,2]] },
  'Major 7':     { 'E': [[0,2,1,1,0,0]], 'F': [[null,null,3,2,1,0]], 'G': [[3,2,0,0,0,2]], 'A': [[null,0,2,1,2,0]] },
  'Minor 7':     { 'E': [[0,2,2,0,3,0]], 'B': [[null,2,0,2,0,2]] },
  'Major 6':     { 'C': [[null,3,2,2,1,0]], 'E': [[0,2,2,1,2,0]], 'G': [[3,2,0,0,0,0]] },
  'Minor 6':     { 'E': [[0,2,2,0,2,0]] },
  'Dominant 9':  { 'C': [[null,3,2,3,3,0]], 'G': [[3,0,0,2,0,1]], 'A': [[null,0,2,4,2,3]] },
  'Major 9':     { 'C': [[null,3,2,4,3,0]] },
  'Minor 9':     { 'B': [[null,2,0,2,2,2]] },
  'Add9':        { 'C': [[null,3,2,0,3,0]], 'E': [[0,2,4,1,0,0]], 'G': [[3,2,0,2,0,3]], 'A': [[null,0,2,4,2,0]] },
  'Minor Add9':  { 'E': [[0,2,4,0,0,0]], 'A': [[null,0,2,4,1,0]] },
  'Add11':       { 'C': [[null,3,2,0,1,1]], 'G': [[3,2,0,0,1,3]] },
  'Dominant 13': { 'E': [[0,2,0,1,2,0]] },
  '6/9':         { 'E': [[0,2,2,1,2,2]], 'A': [[null,0,2,4,2,2]] },
};
