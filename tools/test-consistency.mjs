/**
 * One source string, one translation.
 *
 * The same English text rendered in a compact and a comfortable settings row,
 * as a closed select value and as its dropdown option, and as the tail of a
 * reset label must come out identically and must be requested only once.
 * Whitespace variants of one source must collapse to the same request.
 *
 * jsdom is not a dependency of this repository. Run it from a directory that
 * has jsdom installed, or point WHTR_JSDOM at that directory's package.json:
 *
 *   WHTR_JSDOM=C:/path/to/jsdom-project/package.json bun tools/test-consistency.mjs
 *
 * The fixtures and the stub channel live in tools/jsdom-harness.mjs.
 */

import { createRequire } from 'node:module';

const require = createRequire(process.env.WHTR_JSDOM || import.meta.url);
const { JSDOM } = require('jsdom');
const { mount, fixture, defaultTranslate } = await import('./jsdom-harness.mjs');

const env = mount(JSDOM, { html: fixture.sameStrings() });
const { doc } = env;

await env.wait(1600);

const api = env.api();
env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

// ---------------------------------------------------------------------------
// 1. Compact vs comfortable density: one source, one output.
// ---------------------------------------------------------------------------
const compactTitle = doc.getElementById('same-compact-title-text');
const comfortableTitle = doc.getElementById('same-comfortable-title');
const compactDesc = doc.getElementById('same-compact-desc');
const comfortableDesc = doc.getElementById('same-comfortable-desc');

env.check('compact title translated', env.hasCJK(env.text(compactTitle)), env.text(compactTitle));
env.check('comfortable title translated', env.hasCJK(env.text(comfortableTitle)), env.text(comfortableTitle));
env.check(
  'compact and comfortable titles agree',
  env.text(compactTitle) === env.text(comfortableTitle),
  env.text(compactTitle) + ' vs ' + env.text(comfortableTitle)
);
env.check('title requested once', env.requestCount('Keep switcher open') === 1, String(env.requestCount('Keep switcher open')));

env.check('compact description translated', env.hasCJK(env.text(compactDesc)), env.text(compactDesc));
env.check('comfortable description translated', env.hasCJK(env.text(comfortableDesc)), env.text(comfortableDesc));
env.check(
  'compact and comfortable descriptions agree',
  env.text(compactDesc) === env.text(comfortableDesc),
  env.text(compactDesc) + ' vs ' + env.text(comfortableDesc)
);
env.check(
  'description requested once',
  env.requestCount('Ctrl+Alt+Tab keeps the switcher open') === 1,
  String(env.requestCount('Ctrl+Alt+Tab keeps the switcher open'))
);

const sentTexts = env.requests.reduce((all, batch) => all.concat(batch), []);
const rawWhitespace = sentTexts.filter((text) => /\s{2,}|\n/.test(text));
env.check('no request carries raw whitespace', rawWhitespace.length === 0, rawWhitespace.join(' | '));

// ---------------------------------------------------------------------------
// 2. Closed select value vs the same option in its dropdown.
// ---------------------------------------------------------------------------
const compactSelect = doc.getElementById('same-compact-select');
const comfortableSelect = doc.getElementById('same-comfortable-select');
const positionSelect = doc.getElementById('same-position-select');

env.check('compact select value translated', env.hasCJK(env.text(compactSelect)), env.text(compactSelect));
env.check('comfortable select value translated', env.hasCJK(env.text(comfortableSelect)), env.text(comfortableSelect));
env.check(
  'compact and comfortable select values agree',
  env.text(compactSelect) === env.text(comfortableSelect),
  env.text(compactSelect) + ' vs ' + env.text(comfortableSelect)
);
env.check(
  'select value requested once',
  env.requestCount('Where the mouse cursor is') === 1,
  String(env.requestCount('Where the mouse cursor is'))
);

const optionRequestsBefore = env.requestCount('Flip 3D (Vista stack)');
fixture.openSelectDropdown(doc, 'Flip 3D (Vista stack)', 'same-dropdown');
await env.wait(600);
const option = doc.querySelector('#same-dropdown .ant-select-item-option-content');
env.check('dropdown option translated', env.hasCJK(env.text(option)), env.text(option));
env.check(
  'select value and its option agree',
  env.text(option) === env.text(positionSelect),
  env.text(option) + ' vs ' + env.text(positionSelect)
);
env.check(
  'select value and its option share one request',
  env.requestCount('Flip 3D (Vista stack)') === optionRequestsBefore,
  optionRequestsBefore + ' -> ' + env.requestCount('Flip 3D (Vista stack)')
);

// ---------------------------------------------------------------------------
// 3. Reset label: the tail is the option label, composed, never re-translated.
// ---------------------------------------------------------------------------
const reset = fixture.addResetRow(doc, 'Flip 3D (Vista stack)', 'same-reset');
await env.wait(900);
const tailText = env.text(positionSelect);
env.check(
  'reset label composes the cached tail',
  env.text(reset) === defaultTranslate('Reset to default') + ': ' + tailText,
  env.text(reset) + ' vs ' + tailText
);
env.check('reset label tail equals the option translation', env.text(reset).endsWith(tailText), env.text(reset));
env.check('reset prefix requested once', env.requestCount('Reset to default') === 1, String(env.requestCount('Reset to default')));
env.check(
  'reset label is not requested as a whole sentence',
  env.requestCount('Reset to default: Flip 3D (Vista stack)') === 0,
  String(env.requestCount('Reset to default: Flip 3D (Vista stack)'))
);

// The full-width colon is the same separator rule and reuses the same prefix.
const resetFullWidth = fixture.addResetRow(doc, 'Flip 3D (Vista stack)', 'same-reset-wide', '\uff1a', 'Other shortcut ');
await env.wait(900);
env.check(
  'full-width colon reset label composes the same tail',
  env.text(resetFullWidth) === defaultTranslate('Reset to default') + '\uff1a' + tailText,
  env.text(resetFullWidth) + ' vs ' + tailText
);
env.check(
  'full-width reset prefix is still requested once',
  env.requestCount('Reset to default') === 1,
  String(env.requestCount('Reset to default'))
);

// ---------------------------------------------------------------------------
// 4. Unknown tail: the whole sentence is translated, once.
// ---------------------------------------------------------------------------
const fallbackReset = doc.getElementById('same-fallback-reset');
env.check('fallback reset translated', env.hasCJK(env.text(fallbackReset)), env.text(fallbackReset));
env.check(
  'unknown tail falls back to the whole sentence',
  env.requestCount('Reset to default: Never seen option') === 1,
  String(env.requestCount('Reset to default: Never seen option'))
);

// ---------------------------------------------------------------------------
// 5. Across every surface: one request per distinct normalised string.
// ---------------------------------------------------------------------------
const allSent = env.requests.reduce((all, batch) => all.concat(batch), []);
const seen = new Set();
const duplicates = [];
for (const text of allSent) {
  if (seen.has(text)) duplicates.push(text);
  seen.add(text);
}
env.check('every distinct normalised string requested once', duplicates.length === 0, duplicates.join(' | '));
const lateRawWhitespace = allSent.filter((text) => /\s{2,}|\n/.test(text));
env.check('no late request carries raw whitespace', lateRawWhitespace.length === 0, lateRawWhitespace.join(' | '));

env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));

const failures = env.report();
env.window.close();

// ---------------------------------------------------------------------------
// 6. Debug diagnosis: a compact title whose description host is nested inside
//    it is claimed by the title itself now. The dump must report the title as
//    claimed with no nested claimant, show its skeleton, and stay within six
//    lines per scan. The hidden screen-reader copy is an atomic placeholder,
//    not a unit of its own.
// ---------------------------------------------------------------------------
const debugEnv = mount(JSDOM, { html: fixture.compactTitleConflict(), settings: { debug: true } });
await debugEnv.wait(1200);
const debugLog = debugEnv.logs.join('\n');
const debugRow = debugLog.split('\n').filter((line) => line.indexOf('row ') === 0).slice(0, 1).join('');

debugEnv.check(
  'debug dump names the row and its setting key',
  /row 0 testid=mod-setting key=monitor /.test(debugLog),
  debugLog.split('\n').filter((line) => line.indexOf('row ') === 0).slice(0, 2).join(' | ')
);
debugEnv.check('debug dump reports the title host as claimed', /key=monitor .* claimed=true/.test(debugRow), debugRow);
debugEnv.check('debug dump names no nested claimant', debugRow.indexOf('claimedBy=') === -1, debugRow);
debugEnv.check(
  'debug dump shows the title host skeleton',
  /skeleton=h4\.windhawk-row-meta-title/.test(debugLog),
  debugRow
);
debugEnv.check('debug dump is capped at six rows per scan', !/row 6 /.test(debugLog));
debugEnv.check(
  'conflicting compact title now translates',
  debugEnv.hasCJK(debugEnv.text(debugEnv.doc.getElementById('conflict-title-text-0'))),
  debugEnv.text(debugEnv.doc.getElementById('conflict-title-text-0'))
);
debugEnv.check(
  'the nested screen-reader copy is not a unit',
  !debugEnv.doc.getElementById('conflict-desc-0').hasAttribute('data-wh-unit') &&
    !debugEnv.doc.getElementById('conflict-desc-0').hasAttribute('data-wh-swapped'),
  debugEnv.doc.getElementById('conflict-desc-0').outerHTML
);
debugEnv.check(
  'the nested screen-reader copy is not requested on its own',
  debugEnv.requestCount("Only the windows on the switcher's monitor") === 0,
  String(debugEnv.requestCount("Only the windows on the switcher's monitor"))
);

const debugFailures = debugEnv.report();
debugEnv.window.close();

// ---------------------------------------------------------------------------
// 7. Cache version: a v1 entry is purged rather than reused, and v2 keys are
//    built from the normalised string.
// ---------------------------------------------------------------------------
function hash32(value) {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= value.length;
  return (h >>> 0).toString(16).padStart(8, '0');
}

const cacheEnv = mount(JSDOM, {
  html: fixture.antd6Selects(),
  settings: { cacheEnabled: true },
  translate: (text) => 'NEW:' + text
});
const ls = cacheEnv.window.localStorage;
const plain = 'Where the mouse cursor is';
const raw = 'Where the  mouse cursor is';
const v1Key = 'whtr1|edge|zh-Hans|' + hash32(plain) + '|' + plain.length;
ls.setItem(v1Key, JSON.stringify({ t: 'OLD-V1', at: Date.now(), used: Date.now() }));

await cacheEnv.wait(1400);
const cacheKeys = [];
for (let i = 0; i < ls.length; i++) cacheKeys.push(ls.key(i));
const v1Keys = cacheKeys.filter((key) => key.indexOf('whtr1|') === 0 && key.indexOf('whtr1|v2|') !== 0);
const v2Keys = cacheKeys.filter((key) => key.indexOf('whtr1|v2|') === 0);
const cacheValue = cacheEnv.text(cacheEnv.doc.getElementById('real-content'));

cacheEnv.check('v1 cache entries are purged', v1Keys.length === 0, v1Keys.join(' | '));
cacheEnv.check('v2 cache entries are written', v2Keys.length > 0, String(v2Keys.length));
cacheEnv.check('v1 translation is not reused', cacheValue.indexOf('OLD-V1') === -1, cacheValue);
cacheEnv.check(
  'normalised key is the one written',
  v2Keys.some((key) => key === 'whtr1|v2|edge|zh-Hans|' + hash32(plain) + '|' + plain.length),
  v2Keys.join(' | ')
);
cacheEnv.check(
  'raw-whitespace key is not written',
  v2Keys.every((key) => key !== 'whtr1|v2|edge|zh-Hans|' + hash32(raw) + '|' + raw.length),
  v2Keys.join(' | ')
);

const cacheFailures = cacheEnv.report();
cacheEnv.window.close();

process.exit(failures + debugFailures + cacheFailures ? 1 : 0);
