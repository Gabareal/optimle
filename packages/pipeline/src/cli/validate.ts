/**
 * Validate every committed data file. Runs in CI; needs no solver build.
 *
 * - Word lists match the vendored list files (hashes in every provenance header).
 * - Every tree (the curated openers, plus the Greedy-entropy and Answers-only trees in
 *   artifacts/) passes the core validator: patterns recomputed, groups partition the
 *   Candidates, every Answer once, total equal to its header.
 * - SALET totals 7,920, as does Selby's published tree.
 * - strategies.json counts are exactly what the trees give.
 * - Alternative scores are allowed Guesses, never beat the tree's own Guess, and are
 *   flagged "also optimal" exactly when they tie it.
 * - The Ranked trainer's score files cover every Eligible Game state, one delta per allowed
 *   Guess, with the tree's Guess at 0 and every alternative matching its exact total.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CURATED_OPENERS,
  dataFiles,
  deriveTree,
  eligibleStates,
  patternPath,
  RANKED_OPENER,
  followPatterns,
  guessCounts,
  validateTree,
  type AltsFile,
  type OpenersFile,
  type Provenance,
  type ScoresFile,
  type StrategiesFile,
  type TreeFile,
  type WordListFile,
} from '@wordle/core';
import { ARTIFACTS_DIR, DATA_DIR, PUBLISHED_SALET_TREE } from '../config.js';
import { readJson } from '../io.js';
import { parseSelbyTree } from '../selby-tree.js';
import { loadWordLists } from '../words.js';

const lists = loadWordLists();
const failures: string[] = [];
const fail = (m: string) => {
  failures.push(m);
  console.log(`  ✗ ${m}`);
};
const pass = (m: string) => console.log(`  ✓ ${m}`);
const data = <T>(f: string) => readJson<T>(path.join(DATA_DIR, f));

function checkHeader(name: string, p: Provenance | undefined) {
  if (!p) return fail(`${name}: no provenance header`);
  if (!p.source || !p.generated || !p.title) fail(`${name}: provenance header is missing source, title or date`);
  if (p.wordLists?.answers !== lists.hashes.answers || p.wordLists?.guesses !== lists.hashes.guesses) {
    fail(`${name}: word-list hashes don't match the current lists; regenerate with pnpm data`);
  }
}

console.log('Word lists');
const answers = data<WordListFile>(dataFiles.answers);
const guesses = data<WordListFile>(dataFiles.guesses);
checkHeader('answers.json', answers.provenance);
checkHeader('guesses.json', guesses.provenance);
if (answers.words.join() !== lists.answers.join()) fail('answers.json differs from the Answers list file');
else pass(`answers.json: ${answers.words.length} Answers`);
if (guesses.words.join() !== lists.guesses.join()) fail('guesses.json differs from the Guesses list file');
else pass(`guesses.json: ${guesses.words.length} Guesses`);

function checkTree(name: string, file: TreeFile, allowed: string[]) {
  checkHeader(name, file.provenance);
  if (file.tree[0] !== file.opener) fail(`${name}: opener ${file.opener} but the tree starts with ${file.tree[0]}`);
  const r = validateTree(file.tree, { answers: lists.answers, guesses: allowed, expectedTotal: file.provenance.total });
  if (r.ok) pass(`${name}: ${r.nodes} nodes, ${r.answersSolved} Answers, total ${r.total} (header ${file.provenance.total}), max ${r.maxGuesses}`);
  else for (const e of r.errors) fail(`${name}: ${e}`);
}

console.log('Trees');
for (const opener of CURATED_OPENERS) {
  const f = path.join(DATA_DIR, dataFiles.tree(opener));
  if (!existsSync(f)) {
    fail(`${dataFiles.tree(opener)} is missing`);
    continue;
  }
  checkTree(dataFiles.tree(opener), readJson<TreeFile>(f), lists.guesses);
}
const salet = data<TreeFile>(dataFiles.tree('salet'));
if (salet.provenance.total !== 7920) fail(`SALET totals ${salet.provenance.total}, not the published 7,920`);
else pass('SALET totals 7,920 (3.4212 average), matching the published optimum');
const published = validateTree(parseSelbyTree(readFileSync(PUBLISHED_SALET_TREE, 'utf8')), {
  answers: lists.answers,
  guesses: lists.guesses,
  expectedTotal: 7920,
});
if (published.ok) pass("Selby's published optimaltree.normalmode.txt is valid and totals 7,920");
else for (const e of published.errors) fail(`published tree: ${e}`);

const greedy = readJson<TreeFile>(path.join(ARTIFACTS_DIR, 'tree.greedy-entropy.json'));
const answersOnly = readJson<TreeFile>(path.join(ARTIFACTS_DIR, 'tree.answers-only.json'));
checkTree('artifacts/tree.greedy-entropy.json', greedy, lists.guesses);
checkTree('artifacts/tree.answers-only.json', answersOnly, lists.answers);

console.log('Strategies');
const strategies = data<StrategiesFile>(dataFiles.strategies);
checkHeader('strategies.json', strategies.provenance);
if (strategies.answers.join() !== lists.answers.join()) fail('strategies.json: answers are not aligned with answers.json');
for (const [id, tree] of [
  ['optimal', salet],
  ['greedy', greedy],
  ['answersOnly', answersOnly],
] as const) {
  const s = strategies.strategies[id];
  const c = guessCounts(deriveTree(tree.tree));
  const expected = lists.answers.map((a) => c.get(a));
  const sum = s.counts.reduce((a, b) => a + b, 0);
  if (s.counts.join() !== expected.join()) fail(`strategies.json ${id}: counts differ from its tree`);
  else if (sum !== s.total || s.total !== tree.provenance.total) fail(`strategies.json ${id}: total ${s.total} vs sum ${sum}`);
  else pass(`${s.label} (${s.opener.toUpperCase()}): total ${s.total}, average ${(s.total / lists.answers.length).toFixed(4)}`);
}

console.log('Openers');
const openers = data<OpenersFile>(dataFiles.openers);
checkHeader('openers.json', openers.provenance);
if (openers.entropy.length !== lists.guesses.length) fail('openers.json: entropy is not aligned with guesses.json');
const lb = openers.leaderboard;
if (lb[0]?.[0] !== 'salet' || lb[0]?.[1] !== 7920) fail('openers.json: SALET 7,920 should top the leaderboard');
else if (lb.some(([, t], i) => i > 0 && t < lb[i - 1][1])) fail('openers.json: leaderboard is not sorted');
else pass(`leaderboard of ${lb.length} proven totals, entropy for ${openers.entropy.length} Guesses`);
for (const opener of CURATED_OPENERS) {
  const row = lb.find(([w]) => w === opener);
  const tree = readJson<TreeFile>(path.join(DATA_DIR, dataFiles.tree(opener)));
  if (row && row[1] !== tree.provenance.total) fail(`${opener}: tree total ${tree.provenance.total} but leaderboard says ${row[1]}`);
}

console.log('Alternatives');
const allowed = new Set(lists.guesses);
for (const opener of CURATED_OPENERS) {
  const f = path.join(DATA_DIR, dataFiles.alts(opener));
  if (!existsSync(f)) {
    fail(`${dataFiles.alts(opener)} is missing`);
    continue;
  }
  const alts = readJson<AltsFile>(f);
  checkHeader(dataFiles.alts(opener), alts.provenance);
  const root = deriveTree(readJson<TreeFile>(path.join(DATA_DIR, dataFiles.tree(opener))).tree);
  let bad = 0;
  let n = 0;
  for (const [key, list] of Object.entries(alts.nodes)) {
    const pats = key ? key.split('.') : [];
    const node = followPatterns(root, pats);
    if (node.depth !== pats.length) {
      bad++;
      fail(`${opener} alts: ${key} is not a Game state in the tree`);
      continue;
    }
    n++;
    for (const [g, total, also] of list) {
      if (!allowed.has(g)) fail(`${opener} alts ${key}: ${g} is not an allowed Guess`);
      if (node.parent && total < node.cost) fail(`${opener} alts ${key}: ${g} (${total}) beats the tree (${node.cost})`);
      if ((total === node.cost ? 1 : 0) !== also) fail(`${opener} alts ${key}: ${g} has the wrong "also optimal" flag`);
    }
  }
  if (!bad) pass(`${dataFiles.alts(opener)}: K = ${alts.provenance.k}, ${n} Game states`);
}

console.log('Ranked trainer scores');
{
  const tree = readJson<TreeFile>(path.join(DATA_DIR, dataFiles.tree(RANKED_OPENER)));
  const alts = readJson<AltsFile>(path.join(DATA_DIR, dataFiles.alts(RANKED_OPENER)));
  const index = new Map(lists.guesses.map((g, i) => [g, i]));
  const states = eligibleStates(deriveTree(tree.tree));
  let ok = 0;
  for (const n of states) {
    const key = patternPath(n).join('.');
    const name = dataFiles.scores(RANKED_OPENER, key);
    const f = path.join(DATA_DIR, name);
    if (!existsSync(f)) {
      fail(`${name} is missing`);
      continue;
    }
    const s = readJson<ScoresFile>(f);
    const before = failures.length;
    checkHeader(name, s.provenance);
    if (s.key !== key || s.size !== n.size || s.optimal !== n.cost) fail(`${name}: key, size or optimal total differs from the tree`);
    if (s.deltas.length !== lists.guesses.length) fail(`${name}: ${s.deltas.length} deltas, not one per allowed Guess`);
    else if (s.deltas.some((d) => !Number.isInteger(d) || d < 0 || d > n.size)) fail(`${name}: a delta is outside 0..${n.size}`);
    if (s.deltas[index.get(n.guess)!] !== 0) fail(`${name}: the tree's Guess ${n.guess} is not at delta 0`);
    for (const [g, total] of alts.nodes[key] ?? []) {
      if (s.deltas[index.get(g)!] !== total - n.cost) fail(`${name}: ${g} disagrees with ${dataFiles.alts(RANKED_OPENER)}`);
    }
    if (failures.length === before) ok++;
  }
  if (ok === states.length) pass(`${states.length} score files, one per Eligible Game state, consistent with the tree and alternatives`);
}

if (failures.length) {
  console.log(`\n${failures.length} problem(s).`);
  process.exit(1);
}
console.log('\nAll data valid.');
