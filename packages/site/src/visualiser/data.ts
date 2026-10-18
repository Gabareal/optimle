/**
 * Loading the data files. SALET's tree, both word lists and the Strategy counts load
 * eagerly; other openers' trees and every alternatives file load when first needed.
 */
import { dataFiles, type Alternative, type AltsFile, type OpenersFile, type StrategiesFile, type WordListFile } from '@wordle/core';
import { getJson, loadGuesses, once } from '../shared/load';

export { loadTree, type LoadedTree } from '../shared/load';

export interface Core {
  answers: string[];
  answerSet: Set<string>;
  guesses: string[];
  guessSet: Set<string>;
  strategies: StrategiesFile;
  /** Strategy counts by Answer. */
  counts: Record<keyof StrategiesFile['strategies'], Map<string, number>>;
}

export function loadCore(): Promise<Core> {
  return once('core', async () => {
    const [a, guesses, s] = await Promise.all([
      getJson<WordListFile>(dataFiles.answers),
      loadGuesses(),
      getJson<StrategiesFile>(dataFiles.strategies),
    ]);
    const byAnswer = (counts: number[]) => new Map(s.answers.map((w, i) => [w, counts[i]]));
    return {
      answers: a.words,
      answerSet: new Set(a.words),
      guesses,
      guessSet: new Set(guesses),
      strategies: s,
      counts: {
        optimal: byAnswer(s.strategies.optimal.counts),
        greedy: byAnswer(s.strategies.greedy.counts),
        answersOnly: byAnswer(s.strategies.answersOnly.counts),
      },
    };
  });
}

export interface LoadedAlts {
  k: number;
  nodes: Record<string, Alternative[]>;
}

export function loadAlts(opener: string): Promise<LoadedAlts> {
  return once(`alts:${opener}`, async () => {
    const f = await getJson<AltsFile>(dataFiles.alts(opener));
    return { k: f.provenance.k, nodes: f.nodes };
  });
}

export function loadOpeners(): Promise<OpenersFile> {
  return once('openers', () => getJson<OpenersFile>(dataFiles.openers));
}
