export interface Progression {
  name: string;
  numerals: string[];       // e.g. ['I', 'IV', 'V', 'I']
  degrees: number[];        // semitone offsets from root: 0,5,7,0
  chordTypes: string[];     // keys into CHORDS: 'Major','Minor', etc
  genre: string;
  description: string;
}

export const PROGRESSIONS: Progression[] = [
  // ── Pop / Rock ──────────────────────────────────────────
  {
    name: 'I – V – vi – IV',
    numerals: ['I', 'V', 'vi', 'IV'],
    degrees: [0, 7, 9, 5],
    chordTypes: ['Major', 'Major', 'Minor', 'Major'],
    genre: 'Pop',
    description: 'The "4-chord song". Used in hundreds of pop hits.',
  },
  {
    name: 'I – IV – V',
    numerals: ['I', 'IV', 'V'],
    degrees: [0, 5, 7],
    chordTypes: ['Major', 'Major', 'Major'],
    genre: 'Rock',
    description: 'The backbone of rock and blues. Simple and powerful.',
  },
  {
    name: 'I – IV – vi – V',
    numerals: ['I', 'IV', 'vi', 'V'],
    degrees: [0, 5, 9, 7],
    chordTypes: ['Major', 'Major', 'Minor', 'Major'],
    genre: 'Pop',
    description: 'Bright and uplifting. Common in pop anthems.',
  },
  {
    name: 'vi – IV – I – V',
    numerals: ['vi', 'IV', 'I', 'V'],
    degrees: [9, 5, 0, 7],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Pop',
    description: 'Same chords as I–V–vi–IV, starting on minor. Melancholic.',
  },
  {
    name: 'I – vi – IV – V',
    numerals: ['I', 'vi', 'IV', 'V'],
    degrees: [0, 9, 5, 7],
    chordTypes: ['Major', 'Minor', 'Major', 'Major'],
    genre: 'Pop',
    description: 'The "50s progression". Doo-wop and classic pop.',
  },
  {
    name: 'I – iii – IV – V',
    numerals: ['I', 'iii', 'IV', 'V'],
    degrees: [0, 4, 5, 7],
    chordTypes: ['Major', 'Minor', 'Major', 'Major'],
    genre: 'Pop',
    description: 'Smooth descending feel. Used in many ballads.',
  },
  // ── Blues ────────────────────────────────────────────────
  {
    name: '12-Bar Blues',
    numerals: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'],
    degrees: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
    chordTypes: ['Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7'],
    genre: 'Blues',
    description: 'The foundation of blues. 12 bars, all dominant 7ths.',
  },
  {
    name: '8-Bar Blues',
    numerals: ['I', 'V', 'IV', 'IV', 'I', 'V', 'I', 'V'],
    degrees: [0, 7, 5, 5, 0, 7, 0, 7],
    chordTypes: ['Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7'],
    genre: 'Blues',
    description: 'Shorter blues form. More movement, less repetition.',
  },
  {
    name: 'Minor Blues',
    numerals: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i', 'V', 'iv', 'i', 'V'],
    degrees: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
    chordTypes: ['Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Dominant 7', 'Minor 7', 'Minor 7', 'Dominant 7'],
    genre: 'Blues',
    description: 'Darker, moodier blues. Common in minor keys.',
  },
  // ── Jazz ─────────────────────────────────────────────────
  {
    name: 'ii – V – I',
    numerals: ['ii', 'V', 'I'],
    degrees: [2, 7, 0],
    chordTypes: ['Minor 7', 'Dominant 7', 'Major 7'],
    genre: 'Jazz',
    description: 'The most important jazz progression. Foundation of bebop.',
  },
  {
    name: 'ii – V – I – VI',
    numerals: ['ii', 'V', 'I', 'VI'],
    degrees: [2, 7, 0, 9],
    chordTypes: ['Minor 7', 'Dominant 7', 'Major 7', 'Dominant 7'],
    genre: 'Jazz',
    description: 'ii–V–I with a turnaround. Cycles back to the top.',
  },
  {
    name: 'I – VI – ii – V',
    numerals: ['I', 'VI', 'ii', 'V'],
    degrees: [0, 9, 2, 7],
    chordTypes: ['Major 7', 'Dominant 7', 'Minor 7', 'Dominant 7'],
    genre: 'Jazz',
    description: 'Jazz turnaround. Smooth chord movement.',
  },
  {
    name: 'I – IV – iii – VI',
    numerals: ['I', 'IV', 'iii', 'VI'],
    degrees: [0, 5, 4, 9],
    chordTypes: ['Major 7', 'Major 7', 'Minor 7', 'Dominant 7'],
    genre: 'Jazz',
    description: 'Chromatic descending bass motion. Lush jazz sound.',
  },
  // ── Minor / Dark ─────────────────────────────────────────
  {
    name: 'i – VII – VI – VII',
    numerals: ['i', 'VII', 'VI', 'VII'],
    degrees: [0, 10, 8, 10],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Rock',
    description: 'Natural minor descending. Dark and dramatic.',
  },
  {
    name: 'i – iv – VII – III',
    numerals: ['i', 'iv', 'VII', 'III'],
    degrees: [0, 5, 10, 3],
    chordTypes: ['Minor', 'Minor', 'Major', 'Major'],
    genre: 'Rock',
    description: 'Minor key rock progression. Anthemic and driving.',
  },
  {
    name: 'i – VI – III – VII',
    numerals: ['i', 'VI', 'III', 'VII'],
    degrees: [0, 8, 3, 10],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Pop',
    description: 'Minor pop/rock staple. Used in many modern songs.',
  },
  {
    name: 'i – v – VI – VII',
    numerals: ['i', 'v', 'VI', 'VII'],
    degrees: [0, 7, 8, 10],
    chordTypes: ['Minor', 'Minor', 'Major', 'Major'],
    genre: 'Rock',
    description: 'All-minor feel with lift. Metal and hard rock.',
  },
  // ── Folk / Country ───────────────────────────────────────
  {
    name: 'I – IV – I – V',
    numerals: ['I', 'IV', 'I', 'V'],
    degrees: [0, 5, 0, 7],
    chordTypes: ['Major', 'Major', 'Major', 'Major'],
    genre: 'Country',
    description: 'Classic country/folk. Simple, singable, timeless.',
  },
  {
    name: 'I – II – IV – I',
    numerals: ['I', 'II', 'IV', 'I'],
    degrees: [0, 2, 5, 0],
    chordTypes: ['Major', 'Major', 'Major', 'Major'],
    genre: 'Folk',
    description: 'Non-diatonic II chord gives an open, folk feel.',
  },
  // ── R&B / Soul ───────────────────────────────────────────
  {
    name: 'I – iii – vi – ii',
    numerals: ['I', 'iii', 'vi', 'ii'],
    degrees: [0, 4, 9, 2],
    chordTypes: ['Major 7', 'Minor 7', 'Minor 7', 'Minor 7'],
    genre: 'R&B',
    description: 'All-minor feel in a major key. Smooth R&B.',
  },
  {
    name: 'ii – I – ii – V',
    numerals: ['ii', 'I', 'ii', 'V'],
    degrees: [2, 0, 2, 7],
    chordTypes: ['Minor 7', 'Major 7', 'Minor 7', 'Dominant 9'],
    genre: 'R&B',
    description: 'Neo-soul groove progression. Floating, lush.',
  },
  // ── Shoegaze / Dream pop ─────────────────────────────────
  {
    name: 'I(add9) – V – vi – IVmaj7',
    numerals: ['I', 'V', 'vi', 'IV'],
    degrees: [0, 7, 9, 5],
    chordTypes: ['Add9', 'Major', 'Minor', 'Major 7'],
    genre: 'Shoegaze',
    description: 'Pop bones with add9 + maj7 colors — the dream-pop palette.',
  },
  {
    name: 'Isus2 – V – IV – Isus2',
    numerals: ['Isus2', 'V', 'IV', 'Isus2'],
    degrees: [0, 7, 5, 0],
    chordTypes: ['Sus2', 'Major', 'Major', 'Sus2'],
    genre: 'Shoegaze',
    description: 'Sus2 droning over the changes. Cocteau Twins, Slowdive.',
  },
  {
    name: 'i – ♭VII – IV',
    numerals: ['i', '♭VII', 'IV'],
    degrees: [0, 10, 5],
    chordTypes: ['Minor', 'Major', 'Major'],
    genre: 'Shoegaze',
    description: 'Modal descent with bright IV resolution. Slowdive territory.',
  },
  {
    name: 'Imaj7 – iii7 – V – Imaj7',
    numerals: ['Imaj7', 'iii7', 'V', 'Imaj7'],
    degrees: [0, 4, 7, 0],
    chordTypes: ['Major 7', 'Minor 7', 'Major', 'Major 7'],
    genre: 'Shoegaze',
    description: 'Lush parallel motion in maj7/min7. Wall-of-sound texture.',
  },
  // ── Punk ─────────────────────────────────────────────────
  {
    name: 'I – V – IV (power)',
    numerals: ['I', 'V', 'IV'],
    degrees: [0, 7, 5],
    chordTypes: ['Power (5)', 'Power (5)', 'Power (5)'],
    genre: 'Punk',
    description: 'Three power chords. Half the Ramones catalog runs on this.',
  },
  {
    name: 'I – IV – V – IV (power)',
    numerals: ['I', 'IV', 'V', 'IV'],
    degrees: [0, 5, 7, 5],
    chordTypes: ['Power (5)', 'Power (5)', 'Power (5)', 'Power (5)'],
    genre: 'Punk',
    description: 'Driving four-chord punk. Green Day, Bad Religion.',
  },
  {
    name: 'vi – IV – I – V (power)',
    numerals: ['vi', 'IV', 'I', 'V'],
    degrees: [9, 5, 0, 7],
    chordTypes: ['Power (5)', 'Power (5)', 'Power (5)', 'Power (5)'],
    genre: 'Punk',
    description: 'Pop-punk anthem progression. Blink-182, Sum 41.',
  },
  // ── Metal ────────────────────────────────────────────────
  {
    name: 'i – ♭II – ♭III – ♭II',
    numerals: ['i', '♭II', '♭III', '♭II'],
    degrees: [0, 1, 3, 1],
    chordTypes: ['Power (5)', 'Power (5)', 'Power (5)', 'Power (5)'],
    genre: 'Metal',
    description: 'Phrygian dominance — classic metal/flamenco tension.',
  },
  {
    name: 'i – ♭VI – ♭VII',
    numerals: ['i', '♭VI', '♭VII'],
    degrees: [0, 8, 10],
    chordTypes: ['Power (5)', 'Power (5)', 'Power (5)'],
    genre: 'Metal',
    description: 'Galloping NWOBHM riff. Iron Maiden, Judas Priest.',
  },
  {
    name: 'i – iv – ♭VI – V',
    numerals: ['i', 'iv', '♭VI', 'V'],
    degrees: [0, 5, 8, 7],
    chordTypes: ['Power (5)', 'Power (5)', 'Power (5)', 'Power (5)'],
    genre: 'Metal',
    description: 'Harmonic-minor metal. Dramatic V → i resolution.',
  },
  // ── Indie / Alternative ──────────────────────────────────
  {
    name: 'vi – I – V – IV',
    numerals: ['vi', 'I', 'V', 'IV'],
    degrees: [9, 0, 7, 5],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Indie',
    description: 'Open-position indie strummer. Death Cab, The Strokes.',
  },
  {
    name: 'ii7 – IV – V – I',
    numerals: ['ii7', 'IV', 'V', 'I'],
    degrees: [2, 5, 7, 0],
    chordTypes: ['Minor 7', 'Major', 'Major', 'Major'],
    genre: 'Indie',
    description: 'Sub-dominant-heavy lift. Modern indie tonality.',
  },
  {
    name: 'I – iii – IV – iv',
    numerals: ['I', 'iii', 'IV', 'iv'],
    degrees: [0, 4, 5, 5],
    chordTypes: ['Major', 'Minor', 'Major', 'Minor'],
    genre: 'Indie',
    description: 'Major IV → minor iv switch. Wistful indie staple (Beatles, Radiohead).',
  },

  // ── Jazz Standards ─────────────────────────────────────
  {
    name: 'Rhythm Changes (A)',
    numerals: ['Imaj7', 'vim7', 'iim7', 'V7', 'Imaj7', 'I7', 'IVmaj7', 'ivm'],
    degrees: [0, 9, 2, 7, 0, 0, 5, 5],
    chordTypes: ['Major 7', 'Minor 7', 'Minor 7', 'Dominant 7', 'Major 7', 'Dominant 7', 'Major 7', 'Minor'],
    genre: 'Jazz',
    description: 'Gershwin’s "I Got Rhythm" A section. Backbone of bebop — hundreds of tunes borrow this.',
  },
  {
    name: 'Autumn Leaves (A)',
    numerals: ['iim7', 'V7', 'Imaj7', 'IVmaj7', 'viiø7', 'III7', 'vim', 'vim'],
    degrees: [2, 7, 0, 5, 11, 4, 9, 9],
    chordTypes: ['Minor 7', 'Dominant 7', 'Major 7', 'Major 7', 'Half-Dim 7', 'Dominant 7', 'Minor', 'Minor'],
    genre: 'Jazz',
    description: 'The iconic autumn ballad. ii–V–I into the relative minor — the ii-V-I workhorse in a real setting.',
  },
  {
    name: 'Coltrane Changes',
    numerals: ['Imaj7', '♭III7', '♭VImaj7', 'VII7', 'IIImaj7'],
    degrees: [0, 3, 8, 11, 4],
    chordTypes: ['Major 7', 'Dominant 7', 'Major 7', 'Dominant 7', 'Major 7'],
    genre: 'Jazz',
    description: 'The Giant Steps cycle in major thirds. Once you can play this, you can play anything.',
  },
  {
    name: 'Bebop Blues',
    numerals: ['I7', 'IV7', 'I7', 'I7', 'IV7', '♯iv°7', 'I7', 'VI7', 'ii7', 'V7', 'I7', 'V7'],
    degrees: [0, 5, 0, 0, 5, 6, 0, 9, 2, 7, 0, 7],
    chordTypes: ['Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dim 7', 'Dominant 7', 'Dominant 7', 'Minor 7', 'Dominant 7', 'Dominant 7', 'Dominant 7'],
    genre: 'Jazz',
    description: 'The 12-bar blues with jazz substitutions — diminished passing chord, ii-V turnaround.',
  },

  // ── Latin / Bossa Nova ─────────────────────────────────
  {
    name: 'Bossa ii–V–I',
    numerals: ['iim7', 'V7', 'Imaj7', 'VImaj7'],
    degrees: [2, 7, 0, 9],
    chordTypes: ['Minor 7', 'Dominant 7', 'Major 7', 'Major 7'],
    genre: 'Latin',
    description: 'Smooth bossa turnaround with a chromatic VImaj7 twist. Jobim-flavored.',
  },
  {
    name: 'Girl from Ipanema (A)',
    numerals: ['Imaj7', 'II7', 'iim7', 'V7'],
    degrees: [0, 2, 2, 7],
    chordTypes: ['Major 7', 'Dominant 7', 'Minor 7', 'Dominant 7'],
    genre: 'Latin',
    description: 'Jobim’s signature secondary-dominant into ii-V. The bossa nova sound.',
  },
  {
    name: 'Latin Vamp',
    numerals: ['iim7', 'V9'],
    degrees: [2, 7],
    chordTypes: ['Minor 7', 'Dominant 9'],
    genre: 'Latin',
    description: 'Two-chord samba/salsa base. Loop endlessly for improv over a Latin groove.',
  },

  // ── R&B / Neo-Soul ─────────────────────────────────────
  {
    name: 'Neo-Soul Vamp',
    numerals: ['im9', 'IV13'],
    degrees: [0, 5],
    chordTypes: ['Minor 9', 'Dominant 13'],
    genre: 'R&B',
    description: 'Dorian modal groove. D’Angelo, Erykah Badu, contemporary neo-soul.',
  },
  {
    name: 'D’Angelo Turnaround',
    numerals: ['Imaj9', 'iim9', 'V13', 'Imaj9'],
    degrees: [0, 2, 7, 0],
    chordTypes: ['Major 9', 'Minor 9', 'Dominant 13', 'Major 9'],
    genre: 'R&B',
    description: 'Lush extended chords for slow modern soul. All the color, no rush.',
  },
  {
    name: 'R&B Ballad',
    numerals: ['Imaj7', 'vim7', 'iim7', 'V13'],
    degrees: [0, 9, 2, 7],
    chordTypes: ['Major 7', 'Minor 7', 'Minor 7', 'Dominant 13'],
    genre: 'R&B',
    description: 'The classic slow-jam foundation. I–vi–ii–V with 7th-chord colors throughout.',
  },
  {
    name: 'Slow Jam Vamp',
    numerals: ['Imaj7', 'iiim7', 'vim7', 'V7'],
    degrees: [0, 4, 9, 7],
    chordTypes: ['Major 7', 'Minor 7', 'Minor 7', 'Dominant 7'],
    genre: 'R&B',
    description: 'Descending-fifth movement. Quiet-storm ballad feel.',
  },

  // ── Motown ─────────────────────────────────────────────
  {
    name: 'Motown Circle',
    numerals: ['I', 'vi', 'ii', 'V'],
    degrees: [0, 9, 2, 7],
    chordTypes: ['Major', 'Minor', 'Minor', 'Major'],
    genre: 'Motown',
    description: 'The 60s R&B backbone. My Girl, Stand By Me, and half the Motown catalog.',
  },

  // ── Country ─────────────────────────────────────────────
  {
    name: 'Honky-Tonk Two-Chord',
    numerals: ['I', 'V', 'I', 'V'],
    degrees: [0, 7, 0, 7],
    chordTypes: ['Major', 'Major', 'Major', 'Major'],
    genre: 'Country',
    description: 'Dance-hall dominant swagger. Two chords, all the twang.',
  },
  {
    name: 'Country Ballad',
    numerals: ['I', 'IV', 'V', 'IV', 'I'],
    degrees: [0, 5, 7, 5, 0],
    chordTypes: ['Major', 'Major', 'Major', 'Major', 'Major'],
    genre: 'Country',
    description: 'Nashville call-and-response. IV–V–IV before landing home on I.',
  },

  // ── Gospel ─────────────────────────────────────────────
  {
    name: 'Gospel Plagal (Amen)',
    numerals: ['IVmaj7', 'Imaj7'],
    degrees: [5, 0],
    chordTypes: ['Major 7', 'Major 7'],
    genre: 'Gospel',
    description: 'The plagal cadence — the "Amen" of Sunday-morning church music.',
  },
  {
    name: 'Gospel Turnaround',
    numerals: ['I', 'III7', 'vi', 'IV'],
    degrees: [0, 4, 9, 5],
    chordTypes: ['Major', 'Dominant 7', 'Minor', 'Major'],
    genre: 'Gospel',
    description: 'Secondary dominant (III7 = V of vi) for the uplifting "Yes Lord" moment.',
  },

  // ── Classical / Baroque ────────────────────────────────
  {
    name: 'Pachelbel Canon',
    numerals: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    degrees: [0, 7, 9, 4, 5, 0, 5, 7],
    chordTypes: ['Major', 'Major', 'Minor', 'Minor', 'Major', 'Major', 'Major', 'Major'],
    genre: 'Classical',
    description: 'The most-covered progression in pop history. From baroque canon to modern rock ballad.',
  },
  {
    name: 'Andalusian Cadence',
    numerals: ['i', '♭VII', '♭VI', 'V'],
    degrees: [0, 10, 8, 7],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Classical',
    description: 'Spanish/flamenco descent. Dramatic, cinematic, unmistakable.',
  },
  {
    name: 'Circle of Fifths',
    numerals: ['I', 'IV', 'vii°', 'iii', 'vi', 'ii', 'V', 'I'],
    degrees: [0, 5, 11, 4, 9, 2, 7, 0],
    chordTypes: ['Major', 'Major', 'Diminished', 'Minor', 'Minor', 'Minor', 'Major', 'Major'],
    genre: 'Classical',
    description: 'Full diatonic cycle through every chord in the key. Baroque exercise, jazz standard.',
  },

  // ── Modal / Folk / Celtic ──────────────────────────────
  {
    name: 'Dorian Vamp',
    numerals: ['i', 'IV'],
    degrees: [0, 5],
    chordTypes: ['Minor', 'Major'],
    genre: 'Folk',
    description: 'Celtic minor with a brightening major IV. Two chords, endless mood.',
  },
  {
    name: 'Aeolian Descent',
    numerals: ['i', '♭VII', '♭VI'],
    degrees: [0, 10, 8],
    chordTypes: ['Minor', 'Major', 'Major'],
    genre: 'Folk',
    description: 'Natural minor descent. Gothic folk, medieval feel.',
  },
  {
    name: 'Phrygian Spanish',
    numerals: ['i', '♭II'],
    degrees: [0, 1],
    chordTypes: ['Minor', 'Major'],
    genre: 'Folk',
    description: 'Flamenco base. Half-step tension — dark, exotic, Andalusian.',
  },

  // ── Reggae ─────────────────────────────────────────────
  {
    name: 'Reggae One-Drop',
    numerals: ['I', 'IV', 'I', 'V'],
    degrees: [0, 5, 0, 7],
    chordTypes: ['Major', 'Major', 'Major', 'Major'],
    genre: 'Reggae',
    description: 'Marley skank rhythm base. Feels different from the rock I-IV-V — all in the swing.',
  },
  {
    name: 'Reggae Roots Minor',
    numerals: ['i', '♭VII'],
    degrees: [0, 10],
    chordTypes: ['Minor', 'Major'],
    genre: 'Reggae',
    description: 'Two-chord minor vamp. Redemption Song energy — protest, sway, resolve.',
  },

  // ── Emo / Post-hardcore / Punk ─────────────────────────
  {
    name: 'Emo Anthem',
    numerals: ['I(add9)', 'iii', 'IV', 'iv'],
    degrees: [0, 4, 5, 5],
    chordTypes: ['Add9', 'Minor', 'Major', 'Minor'],
    genre: 'Indie',
    description: 'Borrowed minor iv for the heartbreak turn. Add9 opening softens the punch.',
  },
  {
    name: 'Post-hardcore Descent',
    numerals: ['i', '♭VI', '♭VII', 'IV'],
    degrees: [0, 8, 10, 5],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Metal',
    description: 'Aggressive minor drop with a borrowed major IV pop. Drop-tuned aggression.',
  },
  {
    name: 'I – V – vi – IV (power)',
    numerals: ['I', 'V', 'vi', 'IV'],
    degrees: [0, 7, 9, 5],
    chordTypes: ['Power (5)', 'Power (5)', 'Power (5)', 'Power (5)'],
    genre: 'Punk',
    description: 'Power-chord variant of the "4-chord song". Every pop-punk band, forever.',
  },

  // ── Modern Pop / Hip-hop ───────────────────────────────
  {
    name: 'Trap Cinematic',
    numerals: ['i', '♭III', '♭VI', '♭VII'],
    degrees: [0, 3, 8, 10],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Pop',
    description: 'Dark minor cinematic loop. Modern trap and cinematic hip-hop.',
  },
  {
    name: 'Lo-fi Hip Hop',
    numerals: ['Imaj7', 'vim7', 'iiim7', 'IVmaj7'],
    degrees: [0, 9, 4, 5],
    chordTypes: ['Major 7', 'Minor 7', 'Minor 7', 'Major 7'],
    genre: 'R&B',
    description: 'Chill jazz-pop loop for study beats. Nujabes, J Dilla territory.',
  },
  {
    name: 'Pop with 7ths',
    numerals: ['I', 'V', 'vim7', 'iiim7'],
    degrees: [0, 7, 9, 4],
    chordTypes: ['Major', 'Major', 'Minor 7', 'Minor 7'],
    genre: 'Pop',
    description: 'Jazzy substitution on the "4-chord song" — minor 7ths on the vi and iii add sophistication.',
  },
];

export const GENRES = ['All', 'Pop', 'Rock', 'Blues', 'Jazz', 'Latin', 'Country', 'Folk', 'R&B', 'Motown', 'Gospel', 'Classical', 'Reggae', 'Shoegaze', 'Indie', 'Punk', 'Metal'];

// ── EXAMPLES ────────────────────────────────────────────────────────────────
// Concrete-chord progressions in fixed keys, designed as inspiration for users
// to spark their own custom progressions. Style references (no copyrighted
// song names) help anchor the vibe.

export interface ExampleChord {
  root: number;       // 0-11 absolute note class (C=0, C#=1, ... B=11)
  chordType: string;  // key into CHORDS
}

export interface ExampleProgression {
  name: string;
  description: string;
  genre: string;
  key: string;        // human-readable, e.g. "D major" — shown in UI
  chords: ExampleChord[];
}

export const EXAMPLE_PROGRESSIONS: ExampleProgression[] = [

  // ── Shoegaze ─────────────────────────────────────────────
  {
    name: 'Dreamy descent',
    description: 'Stepwise minor-7 walk with a maj7 lift. Slowdive territory.',
    genre: 'Shoegaze',
    key: 'D major',
    chords: [
      { root: 2,  chordType: 'Major 7' }, // Dmaj7
      { root: 11, chordType: 'Minor 7' }, // Bm7
      { root: 6,  chordType: 'Minor 7' }, // F#m7
      { root: 7,  chordType: 'Major 7' }, // Gmaj7
    ],
  },
  {
    name: 'Suspended drone',
    description: 'Sus2 chords keep the high strings ringing across the changes — Cocteau Twins.',
    genre: 'Shoegaze',
    key: 'A major',
    chords: [
      { root: 9,  chordType: 'Sus2' },  // Asus2
      { root: 4,  chordType: 'Major' }, // E
      { root: 11, chordType: 'Minor' }, // Bm
      { root: 9,  chordType: 'Sus2' },  // Asus2
    ],
  },
  {
    name: 'Wall of sound',
    description: 'Tritone leap from Imaj7 to a colorful min7. My Bloody Valentine palette.',
    genre: 'Shoegaze',
    key: 'C major',
    chords: [
      { root: 0,  chordType: 'Major 7' },     // Cmaj7
      { root: 6,  chordType: 'Minor 7' },     // F#m7
      { root: 4,  chordType: 'Minor 7' },     // Em7
      { root: 9,  chordType: 'Minor Add9' },  // Am(add9)
    ],
  },
  {
    name: 'Modal float',
    description: 'Mixolydian ♭VII descent. Beach House drift.',
    genre: 'Shoegaze',
    key: 'G major',
    chords: [
      { root: 7, chordType: 'Major 7' },  // Gmaj7
      { root: 5, chordType: 'Major' },    // F (♭VII)
      { root: 0, chordType: 'Major' },    // C (IV)
      { root: 7, chordType: 'Major 7' },  // Gmaj7
    ],
  },

  // ── Indie ────────────────────────────────────────────────
  {
    name: 'Open strummer',
    description: 'Classic open-position indie — Death Cab, The Strokes.',
    genre: 'Indie',
    key: 'G major',
    chords: [
      { root: 7, chordType: 'Major' }, // G
      { root: 2, chordType: 'Major' }, // D
      { root: 4, chordType: 'Minor' }, // Em
      { root: 0, chordType: 'Major' }, // C
    ],
  },
  {
    name: 'Quiet melancholy',
    description: 'Vi root with diatonic walk-up. The National vibe.',
    genre: 'Indie',
    key: 'A minor',
    chords: [
      { root: 9, chordType: 'Minor 7' }, // Am7
      { root: 5, chordType: 'Major' },   // F
      { root: 0, chordType: 'Major' },   // C
      { root: 7, chordType: 'Major' },   // G
    ],
  },

  // ── Pop ──────────────────────────────────────────────────
  {
    name: 'Pop ballad',
    description: 'vi–IV–I–V — the most-used progression in modern pop.',
    genre: 'Pop',
    key: 'A minor / C major',
    chords: [
      { root: 9, chordType: 'Minor' }, // Am
      { root: 5, chordType: 'Major' }, // F
      { root: 0, chordType: 'Major' }, // C
      { root: 7, chordType: 'Major' }, // G
    ],
  },
  {
    name: '50s doo-wop',
    description: 'I–vi–IV–V. The bedrock of 50s pop and standards.',
    genre: 'Pop',
    key: 'C major',
    chords: [
      { root: 0, chordType: 'Major' }, // C
      { root: 9, chordType: 'Minor' }, // Am
      { root: 5, chordType: 'Major' }, // F
      { root: 7, chordType: 'Major' }, // G
    ],
  },

  // ── Rock ─────────────────────────────────────────────────
  {
    name: 'Classic rock anthem',
    description: 'I–♭VII–IV — Mixolydian rock staple. Free Bird, Sweet Home Alabama.',
    genre: 'Rock',
    key: 'D major',
    chords: [
      { root: 2,  chordType: 'Major' }, // D
      { root: 0,  chordType: 'Major' }, // C  (♭VII)
      { root: 7,  chordType: 'Major' }, // G
      { root: 2,  chordType: 'Major' }, // D
    ],
  },

  // ── Punk ─────────────────────────────────────────────────
  {
    name: 'Three-chord rocker',
    description: 'E A B power chords. Ramones speed-strum.',
    genre: 'Punk',
    key: 'E major',
    chords: [
      { root: 4,  chordType: 'Power (5)' }, // E5
      { root: 9,  chordType: 'Power (5)' }, // A5
      { root: 11, chordType: 'Power (5)' }, // B5
    ],
  },
  {
    name: 'Pop-punk anthem',
    description: 'vi–IV–I–V power chords. Blink-182, Sum 41 chorus.',
    genre: 'Punk',
    key: 'G major',
    chords: [
      { root: 4, chordType: 'Power (5)' }, // Em5
      { root: 0, chordType: 'Power (5)' }, // C5
      { root: 7, chordType: 'Power (5)' }, // G5
      { root: 2, chordType: 'Power (5)' }, // D5
    ],
  },

  // ── Metal ────────────────────────────────────────────────
  {
    name: 'Phrygian intro',
    description: 'i–♭II chromatic move — classic metal/flamenco tension.',
    genre: 'Metal',
    key: 'E minor',
    chords: [
      { root: 4, chordType: 'Power (5)' }, // E5
      { root: 5, chordType: 'Power (5)' }, // F5  (♭II)
      { root: 7, chordType: 'Power (5)' }, // G5
      { root: 5, chordType: 'Power (5)' }, // F5
    ],
  },
  {
    name: 'NWOBHM gallop',
    description: 'i–♭VI–♭VII — Iron Maiden, Judas Priest darkness.',
    genre: 'Metal',
    key: 'E minor',
    chords: [
      { root: 4,  chordType: 'Power (5)' }, // E5
      { root: 0,  chordType: 'Power (5)' }, // C5  (♭VI)
      { root: 2,  chordType: 'Power (5)' }, // D5  (♭VII)
      { root: 4,  chordType: 'Power (5)' }, // E5
    ],
  },

  // ── Jazz ─────────────────────────────────────────────────
  {
    name: 'Bossa drift',
    description: 'Imaj7 floating with diatonic 7ths. Jobim-style bossa.',
    genre: 'Jazz',
    key: 'C major',
    chords: [
      { root: 0, chordType: 'Major 7' }, // Cmaj7
      { root: 2, chordType: 'Minor 7' }, // Dm7
      { root: 4, chordType: 'Minor 7' }, // Em7
      { root: 2, chordType: 'Minor 7' }, // Dm7
    ],
  },
  {
    name: 'Bebop turnaround',
    description: 'I–VI–ii–V. Smooth chord cycle that loops back to I.',
    genre: 'Jazz',
    key: 'C major',
    chords: [
      { root: 0, chordType: 'Major 7' },    // Cmaj7
      { root: 9, chordType: 'Dominant 7' }, // A7
      { root: 2, chordType: 'Minor 7' },    // Dm7
      { root: 7, chordType: 'Dominant 7' }, // G7
    ],
  },

  // ── R&B ──────────────────────────────────────────────────
  {
    name: 'Neo-soul groove',
    description: 'Maj7 root → diatonic descent → V9 lift. D’Angelo, Erykah Badu.',
    genre: 'R&B',
    key: 'F major',
    chords: [
      { root: 5, chordType: 'Major 7' },    // Fmaj7
      { root: 4, chordType: 'Minor 7' },    // Em7
      { root: 2, chordType: 'Minor 7' },    // Dm7
      { root: 7, chordType: 'Dominant 9' }, // G9
    ],
  },

  // ── Blues ────────────────────────────────────────────────
  {
    name: 'Slow blues',
    description: 'I7–IV7–I7–V7. The 12-bar slow burn.',
    genre: 'Blues',
    key: 'A major',
    chords: [
      { root: 9, chordType: 'Dominant 7' }, // A7
      { root: 2, chordType: 'Dominant 7' }, // D7
      { root: 9, chordType: 'Dominant 7' }, // A7
      { root: 4, chordType: 'Dominant 7' }, // E7
    ],
  },

  // ── Folk ─────────────────────────────────────────────────
  {
    name: 'Campfire folk',
    description: 'Open-position D, G, A — every singer-songwriter’s starter set.',
    genre: 'Folk',
    key: 'D major',
    chords: [
      { root: 2, chordType: 'Major' }, // D
      { root: 7, chordType: 'Major' }, // G
      { root: 9, chordType: 'Major' }, // A
      { root: 2, chordType: 'Major' }, // D
    ],
  },
];
