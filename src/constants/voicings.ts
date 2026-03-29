// Curated chord voicing templates — all shapes verified against music theory
// frets[0]=low E, frets[5]=high e | null=muted | values=offsets from rootFret
// Negative offsets are valid (some strings need frets below the root string fret)

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
    { frets:[0,2,2,1,0,0],       rootString:0, label:'E shape',  position:'low'  },
    { frets:[null,0,2,2,2,0],    rootString:1, label:'A shape',  position:'mid'  },
    { frets:[null,null,0,2,3,2], rootString:2, label:'D shape',  position:'high' },
  ],

  // R b3 5
  'Minor': [
    { frets:[0,2,2,0,0,0],       rootString:0, label:'Em shape', position:'low'  },
    { frets:[null,0,2,2,1,0],    rootString:1, label:'Am shape', position:'mid'  },
    { frets:[null,null,0,2,3,1], rootString:2, label:'Dm shape', position:'high' },
  ],

  // R b3 b5
  'Diminished': [
    { frets:[null,0,1,2,1,null], rootString:1, label:'Dim (A root)', position:'mid' },
  ],

  // R 3 #5
  'Augmented': [
    { frets:[null,0,3,2,2,null], rootString:1, label:'Aug (A root)', position:'mid'  },
    { frets:[null,null,0,3,3,2], rootString:2, label:'Aug (D root)', position:'high' },
  ],

  // R 2 5
  'Sus2': [
    { frets:[null,0,2,2,0,0],      rootString:1, label:'Sus2 (A root)', position:'mid'  },
    { frets:[null,null,0,2,3,0],   rootString:2, label:'Sus2 (D root)', position:'high' },
  ],

  // R 4 5
  'Sus4': [
    { frets:[null,0,2,2,3,0],      rootString:1, label:'Sus4 (A root)', position:'mid'  },
    { frets:[null,null,0,2,3,3],   rootString:2, label:'Sus4 (D root)', position:'high' },
  ],

  // R 5
  'Power (5)': [
    { frets:[0,2,2,null,null,null],    rootString:0, label:'Power (E root)', position:'low' },
    { frets:[null,0,2,2,null,null],    rootString:1, label:'Power (A root)', position:'mid' },
  ],

  // ── Seventh Chords ────────────────────────────────────────────────────────

  // R 3 5 b7
  'Dominant 7': [
    { frets:[0,2,0,1,0,0],       rootString:0, label:'E7 shape',  position:'low'  },
    { frets:[null,0,2,0,2,0],    rootString:1, label:'A7 shape',  position:'mid'  },
    { frets:[null,null,0,2,1,2], rootString:2, label:'Jazz dom7', position:'high' },
  ],

  // R 3 5 M7
  'Major 7': [
    { frets:[0,null,1,1,0,0],       rootString:0, label:'Emaj7 shape',   position:'low'  },
    { frets:[null,0,2,1,2,null],    rootString:1, label:'Jazz maj7',     position:'mid'  },
    { frets:[null,null,0,2,2,2],    rootString:2, label:'Jazz maj7 (D)', position:'high' },
  ],

  // R b3 5 b7
  'Minor 7': [
    { frets:[0,2,0,0,0,0],       rootString:0, label:'Em7 shape',     position:'low'  },
    { frets:[null,0,2,0,1,0],    rootString:1, label:'Am7 shape',     position:'mid'  },
    { frets:[null,null,0,2,1,1], rootString:2, label:'Jazz min7 (D)', position:'high' },
  ],

  // R b3 5 M7
  'Minor Maj7': [
    { frets:[null,0,2,1,1,0],    rootString:1, label:'mMaj7 (A root)', position:'mid'  },
    { frets:[null,null,0,2,2,1], rootString:2, label:'mMaj7 (D root)', position:'high' },
  ],

  // R b3 b5 bb7 — verified: E=bb7, A=R, D=b5, G=R(dup), B=b3
  'Dim 7': [
    { frets:[2,0,1,2,1,null], rootString:1, label:'Dim7 (A root)', position:'mid' },
  ],

  // R b3 b5 b7 — verified X-rf-rf+1-rf-rf+1-x
  'Half-Dim 7': [
    { frets:[null,0,1,0,1,null],    rootString:1, label:'ø7 (A root)', position:'mid'  },
    { frets:[null,null,0,1,1,1],    rootString:2, label:'ø7 (D root)', position:'high' },
  ],

  // R 3 #5 b7 — verified X-rf-rf+3-rf-rf+2-x
  'Aug 7': [
    { frets:[null,0,3,0,2,null], rootString:1, label:'Aug7 (A root)', position:'mid' },
  ],

  // ── Sixth Chords ──────────────────────────────────────────────────────────

  // R 3 5 6 — verified X35555
  'Major 6': [
    { frets:[null,0,2,2,2,2], rootString:1, label:'Maj6 (A root)', position:'mid' },
  ],

  // R b3 5 6 — X31213: A=R, D=b3(-2), G=6(-1), B=R(-2), e=5
  'Minor 6': [
    { frets:[null,0,-2,-1,-2,0],  rootString:1, label:'Min6 (A root)', position:'mid'  },
    { frets:[null,null,0,2,0,1],  rootString:2, label:'Min6 (D root)', position:'high' },
  ],

  // ── Extended Chords ───────────────────────────────────────────────────────

  // R 3 b7 9 (5th omitted — standard jazz practice)
  // verified X32330 with negative offset on D
  'Dominant 9': [
    { frets:[null,0,-1,0,0,-3], rootString:1, label:'Dom9 (A root)', position:'mid' },
  ],

  // R 3 5 M7 9 — verified X32433
  'Major 9': [
    { frets:[null,0,-1,1,0,0], rootString:1, label:'Maj9 (A root)', position:'mid' },
  ],

  // R b3 5 b7 9 — verified X31333
  'Minor 9': [
    { frets:[null,0,-2,0,0,null], rootString:1, label:'Min9 (A root)', position:'mid' },
  ],

  // R 3 5 9 (no 7th) — verified X32033
  'Add9': [
    { frets:[null,0,-1,-3,0,0], rootString:1, label:'Add9 (A root)', position:'mid' },
  ],

  // R 5 b7 9 11 (3rd omitted) — verified X33333
  'Dominant 11': [
    { frets:[null,0,0,0,0,0], rootString:1, label:'Dom11 (A root)', position:'mid' },
  ],

  // R 5 M7 9 11 (3rd omitted) — verified X33433
  'Major 11': [
    { frets:[null,0,0,1,0,0], rootString:1, label:'Maj11 (A root)', position:'mid' },
  ],

  // R b3 5 b7 9 11 — verified X33343
  'Minor 11': [
    { frets:[null,0,0,0,1,0], rootString:1, label:'Min11 (A root)', position:'mid' },
  ],

  // R 3 5 b7 13 (9th omitted) — verified X35355
  'Dominant 13': [
    { frets:[null,0,2,0,2,2], rootString:1, label:'Dom13 (A root)', position:'mid' },
  ],

  // R 3 5 M7 13 (9th omitted) — verified X35455
  'Major 13': [
    { frets:[null,0,2,1,2,2], rootString:1, label:'Maj13 (A root)', position:'mid' },
  ],

  // R b3 5 b7 13 — A=R, D=5(+2), G=b7(0), B=b3(+1), e=13(+2)
  'Minor 13': [
    { frets:[null,0,2,0,1,2], rootString:1, label:'Min13 (A root)', position:'mid' },
  ],
};
