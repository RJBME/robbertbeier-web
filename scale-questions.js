// ML 1.04 — Connecting Scale Factors to Scaled Copies
// 7th grade math practice. Rebuilt from the Amplify study guide.
//
// scale factor = new length ÷ original length
//
// Each problem draws two shapes (original + scaled copy) with labeled sides.
// The student types the answer (fraction like 5/2 OR decimal like 2.5 both count).
//
// Schema:
//   original / scaled: { kind, w, h }  — kind is rect | robot | balloon | truck | triangle
//                                         w = width label, h = height label
//   ratioPairs: valid [newLength, originalLength] pairs for the ratio boxes (both dimensions)
//   sf: the scale factor as a number (used to check the typed answer, any equal form counts)
//   sfText: how to show the correct answer in feedback
//   explanation: worked-out reasoning
//
// To edit: change the numbers right here. No build step, no dependencies.

// Worked example shown first (read-only, like "Shawn's" modeled review).
const modeledExample = {
  original: { kind: 'rect', w: 2, h: 4 },
  scaled:   { kind: 'rect', w: 5, h: 10 },
  ratioPairs: [[5, 2], [10, 4]],
  sf: 2.5, sfText: '5/2  (same as 2.5)',
  explanation: 'new length ÷ original length = 5/2 or 10/4. Both equal 5/2, so the scale factor is 5/2 (which is 2.5).'
};

// Graded practice problems (in study-guide order).
const scaleProblems = [
  {
    id: 'p1', section: 'Guided Practice',
    original: { kind: 'robot', w: 5, h: 8 },
    scaled:   { kind: 'robot', w: 15, h: 24 },
    ratioPairs: [[15, 5], [24, 8]],
    sf: 3, sfText: '3',
    explanation: '15 ÷ 5 = 3, and 24 ÷ 8 = 3. The scale factor is 3.'
  },
  {
    id: 'p2', section: 'Guided Practice',
    original: { kind: 'robot', w: 8, h: 12 },
    scaled:   { kind: 'robot', w: 2, h: 3 },
    ratioPairs: [[2, 8], [3, 12]],
    sf: 0.25, sfText: '1/4  (same as 0.25)',
    explanation: '2 ÷ 8 = 1/4, and 3 ÷ 12 = 1/4. The copy is smaller, so the scale factor is 1/4.'
  },
  {
    id: 'p3', section: 'Guided Practice',
    original: { kind: 'balloon', w: 9, h: 15 },
    scaled:   { kind: 'balloon', w: 18, h: 30 },
    ratioPairs: [[18, 9], [30, 15]],
    sf: 2, sfText: '2',
    explanation: '18 ÷ 9 = 2, and 30 ÷ 15 = 2. The scale factor is 2.'
  },
  {
    id: 'p4', section: 'Guided Practice',
    original: { kind: 'balloon', w: 18, h: 30 },
    scaled:   { kind: 'balloon', w: 9, h: 15 },
    ratioPairs: [[9, 18], [15, 30]],
    sf: 0.5, sfText: '1/2  (same as 0.5)',
    explanation: '9 ÷ 18 = 1/2, and 15 ÷ 30 = 1/2. The copy is smaller, so the scale factor is 1/2.'
  },
  {
    id: 'p5', section: 'Guided Practice',
    original: { kind: 'truck', w: 4, h: 3 },
    scaled:   { kind: 'truck', w: 10, h: 7.5 },
    ratioPairs: [[10, 4], [7.5, 3]],
    sf: 2.5, sfText: '5/2  (same as 2.5)',
    explanation: '10 ÷ 4 = 2.5, and 7.5 ÷ 3 = 2.5. The scale factor is 5/2, which is 2.5.'
  },
  {
    id: 'p6', section: 'Check',
    original: { kind: 'triangle', w: 15, h: 20 },
    scaled:   { kind: 'triangle', w: 9, h: 12 },
    ratioPairs: [[9, 15], [12, 20]],
    sf: 0.6, sfText: '3/5  (same as 0.6)',
    explanation: '9 ÷ 15 = 3/5, and 12 ÷ 20 = 3/5. The scale factor is 3/5 (which is 0.6).'
  }
];
