#!/usr/bin/env bun
/**
 * Regenerates the embedded engine block in mods/windhawk-ui-translator.wh.cpp
 * from src/js/engine.js.
 *
 * The C++ side must contain exactly one raw string literal:
 *
 *     static constexpr wchar_t kEngineJs[] = LR"WHTR_JS(
 *     ...generated...
 *     )WHTR_JS";
 *
 * The script refuses to write anything when the delimiters are missing or
 * ambiguous, and prints the marker lines it expects instead.
 *
 * Usage:
 *   bun tools/build.ts             write the mod source
 *   bun tools/build.ts --dry-run   report sizes only
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const START = 'R"WHTR_JS(';
const END = ')WHTR_JS"';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsPath = join(root, 'src', 'js', 'engine.js');
const cppPath = join(root, 'mods', 'windhawk-ui-translator.wh.cpp');
const dryRun = process.argv.includes('--dry-run');

const EXPECTED = `    <declaration> = LR"WHTR_JS(
    ...content generated from src/js/engine.js...
    )WHTR_JS";

(The C++ variable name is up to the mod source; only the two delimiters matter.)`;

function fail(lines: string[]): never {
  console.error('');
  for (const line of lines) console.error(line);
  console.error('');
  process.exit(1);
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let at = 0;
  for (;;) {
    const found = haystack.indexOf(needle, at);
    if (found === -1) break;
    count++;
    at = found + needle.length;
  }
  return count;
}

let js: string;
let cpp: string;
try {
  js = readFileSync(jsPath, 'utf8');
  cpp = readFileSync(cppPath, 'utf8');
} catch (error) {
  fail([
    `build: cannot read inputs: ${error instanceof Error ? error.message : String(error)}`,
    `  engine: ${relative(root, jsPath)}`,
    `  mod:    ${relative(root, cppPath)}`,
  ]);
}

const starts = countOccurrences(cpp, START);
const ends = countOccurrences(cpp, END);

if (starts === 0 || ends === 0) {
  fail([
    `build: refusing to run: the engine block markers were not found.`,
    `  expected exactly one opening ${JSON.stringify(START)} and one closing ${JSON.stringify(END)}`,
    `  found ${starts} opening marker(s), ${ends} closing marker(s) in ${relative(root, cppPath)}`,
    '',
    'The mod source must contain:',
    EXPECTED,
  ]);
}

if (starts !== 1 || ends !== 1) {
  fail([
    `build: refusing to run: the engine block markers are ambiguous.`,
    `  found ${starts} opening marker(s) and ${ends} closing marker(s) in ${relative(root, cppPath)}`,
    `  expected exactly one of each.`,
    '',
    'The mod source must contain:',
    EXPECTED,
  ]);
}

if (countOccurrences(js, END) !== 0) {
  fail([
    `build: refusing to run: src/js/engine.js contains the closing delimiter ${JSON.stringify(END)}.`,
    'The raw string literal cannot hold it; rename the delimiter in both files.',
  ]);
}

const openAt = cpp.indexOf(START);
const openEnd = openAt + START.length;
const closeAt = cpp.indexOf(END, openEnd);

if (closeAt === -1) {
  fail([
    'build: refusing to run: the closing marker appears before the opening marker.',
    '',
    'The mod source must contain:',
    EXPECTED,
  ]);
}

const beforeBody = cpp.slice(openEnd, closeAt);
const normalized = js.replace(/\r\n/g, '\n');
const body = '\n' + (normalized.endsWith('\n') ? normalized : normalized + '\n');
const next = cpp.slice(0, openEnd) + body + cpp.slice(closeAt);

const utf8 = (value: string) => Buffer.byteLength(value, 'utf8');
const beforeSize = utf8(cpp);
const afterSize = utf8(next);
const engineSize = utf8(normalized);
const blockBefore = utf8(beforeBody);
const blockAfter = utf8(body);
const delta = afterSize - beforeSize;
const sign = delta >= 0 ? '+' : '';

console.log(`engine:     ${relative(root, jsPath)} (${engineSize} bytes)`);
console.log(`mod source: ${relative(root, cppPath)}`);
console.log(`  before: ${beforeSize} bytes`);
console.log(`  after:  ${afterSize} bytes (${sign}${delta})`);
console.log(`  block:  ${blockBefore} -> ${blockAfter} bytes`);

if (next === cpp) {
  console.log('  unchanged; nothing to write.');
  process.exit(0);
}

if (dryRun) {
  console.log('  dry run; nothing written.');
  process.exit(0);
}

try {
  writeFileSync(cppPath, next, 'utf8');
} catch (error) {
  fail([`build: write failed: ${error instanceof Error ? error.message : String(error)}`]);
}

console.log('  written.');
