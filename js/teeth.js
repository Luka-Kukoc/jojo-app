/* Tooth data: all 32 permanent teeth, with Universal and FDI numbering.
   Position (pos) counts from the midline: 1 = central incisor ... 8 = third molar. */

const TOOTH_TYPES = [
  null,
  { key: 'central', name: 'Central Incisor',  group: 'incisors' },
  { key: 'lateral', name: 'Lateral Incisor',  group: 'incisors' },
  { key: 'canine',  name: 'Canine',           group: 'canines' },
  { key: 'pm1',     name: 'First Premolar',   group: 'premolars' },
  { key: 'pm2',     name: 'Second Premolar',  group: 'premolars' },
  { key: 'm1',      name: 'First Molar',      group: 'molars' },
  { key: 'm2',      name: 'Second Molar',     group: 'molars' },
  { key: 'm3',      name: 'Third Molar',      group: 'molars' },
];

const QUADRANTS = [
  { fdi: 1, arch: 'upper', side: 'right', universal: p => 9 - p },
  { fdi: 2, arch: 'upper', side: 'left',  universal: p => 8 + p },
  { fdi: 3, arch: 'lower', side: 'left',  universal: p => 25 - p },
  { fdi: 4, arch: 'lower', side: 'right', universal: p => 24 + p },
];

/* Short identification notes shown after each answer (buccal / labial view). */
const TOOTH_NOTES = {
  upper: {
    1: 'Widest anterior crown, shovel shaped. Single conical root. Distoincisal angle is more rounded than the mesial one.',
    2: 'Smaller and narrower than the central, with rounded incisal corners. Root often curves distally near the apex.',
    3: 'Longest root of any tooth. Pointed cusp with the mesial slope shorter than the distal slope.',
    4: 'Sharp buccal cusp, mesial slope longer than the distal. Usually two roots (buccal and palatal) with a furcation.',
    5: 'Rounder, more symmetrical buccal cusp than the first premolar. Almost always a single root.',
    6: 'Largest upper tooth. Three well separated roots: mesiobuccal, distobuccal and a wide palatal root.',
    7: 'Slightly smaller than the first molar. Roots are closer together and lean distally.',
    8: 'Smallest molar, irregular crown. Roots short, fused and often curved distally.',
  },
  lower: {
    1: 'Smallest tooth in the mouth. Very narrow, symmetrical crown with a flat, narrow root.',
    2: 'Slightly wider than the lower central and a little asymmetrical: the distal incisal edge slopes downward.',
    3: 'Narrower and longer crown than the upper canine. Long single root, less pronounced cusp.',
    4: 'Large pointed buccal cusp with a tiny lingual cusp; the crown tilts lingually. Single root.',
    5: 'Rounder, more bulbous crown than the first premolar. Single root.',
    6: 'Largest lower tooth: five cusps (three visible from the buccal side). Two widely spread roots, mesial and distal.',
    7: 'Four cusps with a single buccal groove. Two roots, closer together and more parallel than the first molar.',
    8: 'Small bulbous crown. Roots short and fused, usually curved distally.',
  },
};

const TEETH = [];
for (const q of QUADRANTS) {
  for (let pos = 1; pos <= 8; pos++) {
    const type = TOOTH_TYPES[pos];
    TEETH.push({
      id: q.fdi * 10 + pos,          // FDI number is used as the stable id
      fdi: q.fdi * 10 + pos,
      universal: q.universal(pos),
      arch: q.arch,
      side: q.side,
      pos,
      type: type.key,
      typeName: type.name,
      group: type.group,
      note: TOOTH_NOTES[q.arch][pos],
    });
  }
}

const TOOTH_BY_ID = Object.fromEntries(TEETH.map(t => [t.id, t]));

function toothNumber(tooth, notation) {
  return notation === 'fdi' ? tooth.fdi : tooth.universal;
}

function toothLabel(tooth, notation) {
  const side = tooth.side === 'left' ? 'L' : 'R';
  const arch = tooth.arch === 'upper' ? 'Upper' : 'Lower';
  return `${toothNumber(tooth, notation)} - (${side}) ${arch} ${tooth.typeName}`;
}

function toothFullName(tooth) {
  const arch = tooth.arch === 'upper' ? 'Upper' : 'Lower';
  const side = tooth.side === 'left' ? 'Left' : 'Right';
  return `${arch} ${side} ${tooth.typeName}`;
}
