/**
 * Feedback patterns: the green/yellow/grey colouring a Guess gets against an Answer.
 *
 * A pattern is written as five letters, G (green), Y (yellow) or B (grey, "black"),
 * the same notation Selby's solver uses, e.g. "BYBBG". There are 3^5 = 243 of them.
 */

export type Colour = 'G' | 'Y' | 'B';
/** Five of G, Y, B, one per letter of the Guess. */
export type Pattern = string;

export const SOLVED: Pattern = 'GGGGG';
export const PATTERN_COUNT = 243;

/**
 * The Feedback pattern for `guess` against `answer` (both 5 lowercase letters).
 *
 * Repeated letters follow the game's rules: greens are taken first, then each
 * remaining guess letter, left to right, is yellow only while the answer still has
 * an unmatched copy of that letter. So guessing SPEED against ABIDE gives one yellow
 * E and one grey E.
 */
export function feedback(guess: string, answer: string): Pattern {
  return decodePattern(feedbackCode(guess, answer));
}

/**
 * The same as `feedback`, as a number in 0..242: letter i contributes
 * colour × 3^i with B = 0, Y = 1, G = 2. GGGGG is 242.
 */
// Scratch buffers, reused because the pipeline calls this ~30 million times.
const unmatched = new Int8Array(26);
const colours = new Int8Array(5);

export function feedbackCode(guess: string, answer: string): number {
  unmatched.fill(0);
  colours.fill(0);
  for (let i = 0; i < 5; i++) {
    const a = answer.charCodeAt(i) - 97;
    if (guess.charCodeAt(i) - 97 === a) colours[i] = 2;
    else unmatched[a]++;
  }
  for (let i = 0; i < 5; i++) {
    if (colours[i] === 2) continue;
    const g = guess.charCodeAt(i) - 97;
    if (unmatched[g] > 0) {
      colours[i] = 1;
      unmatched[g]--;
    }
  }
  return colours[0] + 3 * colours[1] + 9 * colours[2] + 27 * colours[3] + 81 * colours[4];
}

const LETTERS: Colour[] = ['B', 'Y', 'G'];
export const SOLVED_CODE = 242;

export function decodePattern(code: number): Pattern {
  let s = '';
  for (let i = 0; i < 5; i++) {
    s += LETTERS[code % 3];
    code = Math.floor(code / 3);
  }
  return s;
}

export function encodePattern(p: Pattern): number {
  let code = 0;
  for (let i = 4; i >= 0; i--) code = code * 3 + LETTERS.indexOf(p[i] as Colour);
  return code;
}

export function isPattern(s: string): boolean {
  return /^[GYB]{5}$/.test(s);
}

const COLOUR_NAME: Record<Colour, string> = { G: 'green', Y: 'yellow', B: 'grey' };

export function colourName(c: Colour): string {
  return COLOUR_NAME[c];
}

/** Screen-reader text for a pattern, e.g. "yellow, grey, grey, grey, grey". */
export function patternLabel(p: Pattern): string {
  return [...p].map((c) => COLOUR_NAME[c as Colour]).join(', ');
}
