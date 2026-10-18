import { describe, expect, it } from 'vitest';
import { decodePattern, encodePattern, feedback, feedbackCode, patternLabel, SOLVED_CODE } from '../src/index.js';

describe('feedback', () => {
  it('scores all green and all grey', () => {
    expect(feedback('crane', 'crane')).toBe('GGGGG');
    expect(feedback('crane', 'moist')).toBe('BBBBB');
    expect(feedbackCode('crane', 'crane')).toBe(SOLVED_CODE);
  });

  it('marks misplaced letters yellow', () => {
    expect(feedback('salet', 'least')).toBe('YYYYG');
    expect(feedback('trace', 'crate')).toBe('YGGYG');
  });

  describe('repeated letters', () => {
    it('gives only as many yellows as the Answer has copies', () => {
      // SPEED has two Es, ABIDE one: the first E is yellow, the second grey.
      expect(feedback('speed', 'abide')).toBe('BBYBY');
    });

    it('lets a green claim the letter before an earlier yellow can', () => {
      // GEESE against CRANE: the last E is green, so the other Es are grey.
      expect(feedback('geese', 'crane')).toBe('BBBBG');
      // EERIE against THERE: the final E is green, one E is left for the first E.
      expect(feedback('eerie', 'there')).toBe('YBYBG');
    });

    it('handles a repeated letter in both words', () => {
      // LOLLY against ALLOT: the middle L is green, one more L is yellow, the last L grey.
      expect(feedback('lolly', 'allot')).toBe('YYGBB');
      expect(feedback('allot', 'lolly')).toBe('BYGYB');
    });

    it('handles repeats in the Answer only', () => {
      expect(feedback('pleat', 'apple')).toBe('YYYYB');
      expect(feedback('hello', 'llama')).toBe('BBYYB');
    });

    it('scores triple letters', () => {
      expect(feedback('eerie', 'eerie')).toBe('GGGGG');
      // EMCEE against GEESE: last E green, two Es left over for the other two.
      expect(feedback('emcee', 'geese')).toBe('YBBYG');
    });
  });

  it('round-trips every pattern code', () => {
    for (let c = 0; c < 243; c++) expect(encodePattern(decodePattern(c))).toBe(c);
    expect(decodePattern(0)).toBe('BBBBB');
    expect(decodePattern(242)).toBe('GGGGG');
  });

  it('labels patterns for screen readers', () => {
    expect(patternLabel('YBBBG')).toBe('yellow, grey, grey, grey, green');
  });
});
