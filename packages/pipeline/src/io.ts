import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Provenance } from '@wordle/core';
import type { WordLists } from './words.js';

export function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

/** Compact JSON, with the provenance header on its own first line so it reads in a pager. */
export function writeData<T extends { provenance: Provenance }>(file: string, value: T): void {
  mkdirSync(path.dirname(file), { recursive: true });
  const { provenance, ...rest } = value;
  const body = Object.entries(rest)
    .map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`)
    .join(',\n');
  writeFileSync(file, `{"provenance":${JSON.stringify(provenance)},\n${body}}\n`);
  console.log(`  wrote ${path.relative(process.cwd(), file)}`);
}

export function provenance(lists: WordLists, fields: Omit<Provenance, 'wordLists' | 'generated'>): Provenance {
  return { ...fields, wordLists: lists.hashes, generated: new Date().toISOString().slice(0, 10) };
}
