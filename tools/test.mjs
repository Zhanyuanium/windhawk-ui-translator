/**
 * Test runner for the page engine (src/js/engine.js).
 *
 *   bun tools/test.mjs
 *
 * jsdom is not a dependency of this repository; WHTR_JSDOM points at a
 * package.json that can resolve it. Every case shares the stub channel and the
 * fixtures in tools/jsdom-harness.mjs and runs against the real engine source.
 */

import { createRequire } from 'node:module';

const require = createRequire(process.env.WHTR_JSDOM || import.meta.url);
const { JSDOM } = require('jsdom');
const { mount, fixture, defaultTranslate, TAG, SEP } = await import('./jsdom-harness.mjs');

const allRequests = (env) => env.requests.reduce((all, batch) => all.concat(batch), []);
const exactCount = (texts, value) => texts.filter((text) => text === value).length;
const combines = (texts, a, b) =>
  texts.some((text) => text.indexOf(a) !== -1 && text.indexOf(b) !== -1);
const hasBoth = combines;
const counts = (...envs) => ({
  checks: envs.reduce((n, env) => n + env.checks, 0),
  failures: envs.reduce((n, env) => n + env.failures.length, 0)
});

// The engine's persistent cache key (docs/PROTOCOL.md): the mod stores the
// value under this string, so the page and the tests build it identically.
function hash32(value) {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= value.length;
  return (h >>> 0).toString(16).padStart(8, '0');
}

// The second, independent 32-bit hash; the pair is 64 bits.
function hash32b(value) {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(h, 33) ^ value.charCodeAt(i);
  }
  h ^= value.length;
  return (h >>> 0).toString(16).padStart(8, '0');
}

function hash64(value) {
  return hash32(value) + hash32b(value);
}

// Mirrors the engine's effective glossary: trimmed, `source=target`, deduped by
// lower-cased source, first entry wins.
function glossaryHash(glossary) {
  const entries = [];
  const seen = new Set();
  const add = (src, dst) => {
    const a = String(src == null ? '' : src).trim();
    const b = String(dst == null ? '' : dst).trim();
    if (!a || !b) return;
    const key = a.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push([a, b]);
  };
  if (Array.isArray(glossary)) {
    for (const item of glossary) {
      const line = String(item == null ? '' : item).trim();
      if (!line) continue;
      const at = line.indexOf('=');
      if (at <= 0) continue;
      add(line.slice(0, at), line.slice(at + 1));
    }
  } else if (glossary && typeof glossary === 'object') {
    for (const key of Object.keys(glossary)) add(key, glossary[key]);
  }
  if (!entries.length) return '';
  return hash32(entries.map(([src, dst]) => src + '=' + dst).join('\n'));
}

function cacheKey(provider, model, lang, text, baseUrl, glossary) {
  const base = String(baseUrl == null ? '' : baseUrl).trim().replace(/\/+$/, '');
  return (
    'whtr1|v4|' + provider + '|' + model + '|' + lang + '|' + base + '|' +
    glossaryHash(glossary) + '|' + hash64(text) + '|' + text.length
  );
}

// ---------------------------------------------------------------------------
// coverage: names, summaries, settings and closed select values
// ---------------------------------------------------------------------------
async function coverageCase() {
  const env = mount(JSDOM, { html: fixture.all() });
  const { doc } = env;

  await env.wait(1600);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  // Mod names: tile grid, explore tile, table view and details header.
  const tileName = doc.getElementById('tile-name');
  env.check('tile grid name translated', env.hasCJK(env.text(tileName)), env.text(tileName));
  env.check('tile grid name marked swapped', tileName.getAttribute('data-wh-swapped') === '1');

  const exploreName = doc.getElementById('explore-name');
  const exploreDesc = doc.getElementById('explore-desc');
  env.check('explore tile name translated', env.hasCJK(env.text(exploreName)), env.text(exploreName));
  env.check(
    'explore tile name swaps a text node',
    exploreName.childNodes.length === 1 && exploreName.firstChild.nodeType === 3
  );
  env.check('explore tile summary translated', env.hasCJK(env.text(exploreDesc)), env.text(exploreDesc));

  const tableName = doc.getElementById('table-name');
  env.check('table name translated', env.hasCJK(env.text(tableName)), env.text(tableName));
  env.check('table name is still the link', tableName.tagName === 'A' && tableName === doc.getElementById('table-name'));
  env.check('table name keeps its href', tableName.getAttribute('href') === '#better-dialogs');
  env.check(
    'table name swaps a text node, not the link',
    tableName.childNodes.length === 1 && tableName.firstChild.nodeType === 3
  );

  let clicked = 0;
  tableName.addEventListener('click', (event) => {
    clicked++;
    event.preventDefault();
  });
  tableName.dispatchEvent(new env.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  env.check('translated table name stays clickable', clicked === 1, String(clicked));
  env.check('translated table name keeps its unit', tableName.getAttribute('data-wh-swapped') === '1');

  const detailsName = doc.getElementById('details-name');
  env.check('details header name translated', env.hasCJK(env.text(detailsName)), env.text(detailsName));
  env.check(
    'details header name swaps a text node',
    detailsName.childNodes.length === 1 && detailsName.firstChild.nodeType === 3
  );

  const detailsVersion = doc.getElementById('details-version');
  const detailsAuthor = doc.getElementById('details-author');
  const detailsId = doc.getElementById('details-id');
  env.check('details metadata version stays English', env.text(detailsVersion) === 'v1.2.0', env.text(detailsVersion));
  env.check('details metadata author stays English', env.text(detailsAuthor) === 'FireBlade', env.text(detailsAuthor));
  env.check('details metadata line claims no unit', !detailsVersion.hasAttribute('data-wh-unit') && !detailsVersion.hasAttribute('data-wh-swapped'));
  env.check('details id chip stays English', env.text(detailsId) === 'better-dialogs', env.text(detailsId));
  env.check('details id chip claims no unit', !detailsId.hasAttribute('data-wh-unit'));

  // Mod summaries: tile grid, explore tile, table cell and details header.
  const tileDesc = doc.getElementById('tile-desc');
  const tableDesc = doc.getElementById('table-desc');
  const detailsDesc = doc.getElementById('details-desc');
  env.check('tile grid summary translated', env.hasCJK(env.text(tileDesc)), env.text(tileDesc));
  env.check('table description translated', env.hasCJK(env.text(tableDesc)), env.text(tableDesc));
  env.check('details header summary translated', env.hasCJK(env.text(detailsDesc)), env.text(detailsDesc));

  // Compact settings: title in nested spans, inline description, info button.
  const compactTitle = doc.getElementById('compact-title');
  const compactText = doc.getElementById('compact-title-text');
  const compactDesc = doc.getElementById('compact-desc');
  const info = doc.getElementById('compact-info');
  env.check('compact title translated', env.hasCJK(env.text(compactText)), env.text(compactText));
  env.check('compact title host marked swapped', compactTitle.getAttribute('data-wh-swapped') === '1');
  env.check('compact title keeps its nested span', compactText.tagName === 'SPAN' && compactText.isConnected);
  env.check('compact inline description translated', env.hasCJK(env.text(compactDesc)), env.text(compactDesc));
  env.check('compact info button survives', !!info && !!info.querySelector('svg'));
  env.check('compact info button keeps no text', env.text(info) === '', env.text(info));
  env.check('compact info button is not a unit', !info.hasAttribute('data-wh-unit') && !info.hasAttribute('data-wh-swapped'));

  const compactText2 = doc.getElementById('compact-title-text2');
  env.check('second compact title translated', env.hasCJK(env.text(compactText2)), env.text(compactText2));

  // Select values: the closed control's value and placeholder, never inputs.
  const selectValue = doc.getElementById('select-value');
  const selectValue2 = doc.getElementById('select-value2');
  const placeholder = doc.getElementById('select-placeholder');
  const settingInput = doc.getElementById('setting-input');
  const searchInput = doc.getElementById('select-search');

  env.check('select current value translated', env.hasCJK(env.text(selectValue)), env.text(selectValue));
  env.check('select current value keeps its title', selectValue.getAttribute('title') === 'Where the mouse cursor is');
  env.check('second select value translated', env.hasCJK(env.text(selectValue2)), env.text(selectValue2));
  env.check('select placeholder translated', env.hasCJK(env.text(placeholder)), env.text(placeholder));
  env.check('select search input untouched', searchInput.value === '', JSON.stringify(searchInput.value));
  env.check(
    'text input value never translated',
    settingInput.value === 'Where the mouse cursor is',
    JSON.stringify(settingInput.value)
  );

  const unitBefore = selectValue.getAttribute('data-wh-unit');
  const valueTextBefore = env.text(selectValue);
  const requestsBefore = env.requestCount('Where the mouse cursor is');
  fixture.openSelectDropdown(doc, 'Where the mouse cursor is');
  await env.wait(600);
  env.check('select value keeps its unit when the dropdown opens', selectValue.getAttribute('data-wh-unit') === unitBefore, unitBefore + ' -> ' + selectValue.getAttribute('data-wh-unit'));
  env.check('select value is not translated twice', env.text(selectValue) === valueTextBefore, env.text(selectValue));
  env.check(
    'the option reuses the value translation instead of a second request',
    env.requestCount('Where the mouse cursor is') === requestsBefore,
    requestsBefore + ' -> ' + env.requestCount('Where the mouse cursor is')
  );
  const option = doc.querySelector('#select-dropdown .ant-select-item-option-content');
  env.check('dropdown option translated', env.hasCJK(env.text(option)), env.text(option));

  // Scope settings: missing scopeList means both new scopes are on; the old
  // key still drives both when a pre-split payload arrives.
  const base = Object.assign({}, env.settings);

  function withoutNewScopes(payload) {
    const next = Object.assign({}, payload);
    delete next.scopeModName;
    delete next.scopeModSummary;
    return next;
  }

  env.pushSettings(withoutNewScopes(base));
  await env.wait(500);
  env.check('missing scopeList enables names', env.hasCJK(env.text(doc.getElementById('tile-name'))), env.text(doc.getElementById('tile-name')));
  env.check('missing scopeList enables summaries', env.hasCJK(env.text(doc.getElementById('tile-desc'))), env.text(doc.getElementById('tile-desc')));

  const legacyOff = withoutNewScopes(base);
  legacyOff.scopeList = false;
  env.pushSettings(legacyOff);
  await env.wait(500);
  env.check('legacy scopeList false restores names', env.text(doc.getElementById('tile-name')) === 'Better Dialogs', env.text(doc.getElementById('tile-name')));
  env.check('legacy scopeList false restores summaries', env.text(doc.getElementById('tile-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('tile-desc')));
  env.check('legacy scopes leave settings titles translated', env.hasCJK(env.text(doc.getElementById('compact-title-text'))), env.text(doc.getElementById('compact-title-text')));

  env.pushSettings(Object.assign({}, base, { scopeModName: false, scopeModSummary: true }));
  await env.wait(500);
  env.check('name scope off restores names', env.text(doc.getElementById('tile-name')) === 'Better Dialogs', env.text(doc.getElementById('tile-name')));
  env.check('name scope off keeps summaries', env.hasCJK(env.text(doc.getElementById('tile-desc'))), env.text(doc.getElementById('tile-desc')));
  env.check('name scope off restores table name', env.text(doc.getElementById('table-name')) === 'Better Dialogs', env.text(doc.getElementById('table-name')));
  env.check('name scope off restores details name', env.text(doc.getElementById('details-name')) === 'Better Dialogs', env.text(doc.getElementById('details-name')));

  env.pushSettings(Object.assign({}, base, { scopeModName: true, scopeModSummary: false }));
  await env.wait(500);
  env.check('name scope back translates names', env.hasCJK(env.text(doc.getElementById('tile-name'))), env.text(doc.getElementById('tile-name')));
  env.check('summary scope off restores summaries', env.text(doc.getElementById('tile-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('tile-desc')));
  env.check('summary scope off restores table description', env.text(doc.getElementById('table-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('table-desc')));
  env.check('summary scope off restores details summary', env.text(doc.getElementById('details-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('details-desc')));

  env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));
  env.report();
  env.window.close();
  return counts(env);
}

// ---------------------------------------------------------------------------
// modcard: the real explore tile name unit
// ---------------------------------------------------------------------------
async function modCardCase() {
  const env = mount(JSDOM, { html: fixture.modCard() });
  const { doc } = env;

  await env.wait(1600);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  const ribbonName = doc.getElementById('modcard-ribbon-name');
  const plainName = doc.getElementById('modcard-plain-name');
  const ribbonMeta = doc.getElementById('modcard-ribbon-meta');
  const plainMeta = doc.getElementById('modcard-plain-meta');
  const ribbon = doc.getElementById('modcard-ribbon');
  const metaLine = doc.getElementById('modcard-ribbon-meta-line');
  const localIcon = doc.getElementById('modcard-local-icon');
  const ribbonDesc = doc.getElementById('modcard-ribbon-desc');
  const plainDesc = doc.getElementById('modcard-plain-desc');
  const sent = allRequests(env);

  env.check('ribbon tile name translated', env.hasCJK(env.text(ribbonName)), env.text(ribbonName));
  env.check('plain tile name translated', env.hasCJK(env.text(plainName)), env.text(plainName));
  env.check(
    'the ribbon tile name source is exactly the name',
    exactCount(sent, 'Windows 11 Taskbar Styler') === 1,
    sent.join(' | ')
  );
  env.check(
    'the plain tile name source is exactly the name',
    exactCount(sent, 'Better file sizes in Explorer details') === 1,
    sent.join(' | ')
  );
  env.check(
    'the name unit is the Typography, not the meta title',
    ribbonName.getAttribute('data-wh-swapped') === '1' &&
      !ribbonMeta.hasAttribute('data-wh-swapped') &&
      !plainMeta.hasAttribute('data-wh-swapped'),
    ribbonMeta.outerHTML + ' | ' + plainMeta.outerHTML
  );
  env.check(
    'the name unit holds a single text node',
    ribbonName.childNodes.length === 1 && ribbonName.firstChild.nodeType === 3,
    String(ribbonName.childNodes.length)
  );
  env.check('the name unit contains no svg', !ribbonName.querySelector('svg'));
  env.check(
    'no request carries the ribbon text',
    !sent.some((text) => text.indexOf('已安装') !== -1),
    sent.join(' | ')
  );
  env.check(
    'no request carries the metadata author',
    !sent.some((text) => text.indexOf('m417z') !== -1),
    sent.join(' | ')
  );
  env.check(
    'no request carries the metadata line',
    !sent.some((text) => text.indexOf('explorer.exe') !== -1 || text.indexOf('1.2.0') !== -1),
    sent.join(' | ')
  );
  env.check(
    'the ribbon stays untouched',
    env.text(ribbon) === '已安装' &&
      !ribbon.hasAttribute('data-wh-unit') &&
      !ribbon.hasAttribute('data-wh-swapped'),
    ribbon.outerHTML
  );
  env.check(
    'the metadata line stays untouched',
    env.text(metaLine).indexOf('m417z') !== -1 && !metaLine.hasAttribute('data-wh-unit'),
    metaLine.outerHTML
  );
  env.check(
    'the local-mod icon stays untouched',
    !!localIcon.querySelector('svg') && !localIcon.hasAttribute('data-wh-unit'),
    localIcon.outerHTML
  );
  env.check('the ribbon tile summary translated', env.hasCJK(env.text(ribbonDesc)), env.text(ribbonDesc));
  env.check('the plain tile summary translated', env.hasCJK(env.text(plainDesc)), env.text(plainDesc));
  env.check(
    'the summaries are their own requests',
    exactCount(sent, 'Animates the taskbar Dock.') === 1 &&
      exactCount(sent, 'Shows folder sizes in the details pane.') === 1,
    sent.join(' | ')
  );
  env.check(
    'no request combines a name with its summary',
    !combines(sent, 'Windows 11 Taskbar Styler', 'Animates') &&
      !combines(sent, 'Better file sizes', 'Shows folder sizes'),
    sent.join(' | ')
  );

  // The tile name Typography also matches the summary selector; the name scope
  // off must leave it English instead of translating it as a summary.
  env.pushSettings(Object.assign({}, env.settings, { scopeModName: false, scopeModSummary: true }));
  await env.wait(600);
  env.check(
    'name scope off leaves the tile name English',
    env.text(ribbonName) === 'Windows 11 Taskbar Styler',
    env.text(ribbonName)
  );
  env.check(
    'name scope off keeps the tile summary translated',
    env.hasCJK(env.text(ribbonDesc)),
    env.text(ribbonDesc)
  );
  env.pushSettings(Object.assign({}, env.settings, { scopeModName: true }));
  await env.wait(600);
  env.check('name scope back translates the tile name', env.hasCJK(env.text(ribbonName)), env.text(ribbonName));

  env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));
  env.report();
  env.window.close();

  // The details header keeps its own name rule: the bare div translates, the
  // author metadata and the id chip stay English and unclaimed.
  const headerEnv = mount(JSDOM, { html: fixture.detailsHeader() });
  const headerDoc = headerEnv.doc;
  await headerEnv.wait(1600);

  const detailsName = headerDoc.getElementById('details-name');
  const detailsAuthor = headerDoc.getElementById('details-author');
  const detailsId = headerDoc.getElementById('details-id');

  headerEnv.check('details header name translated', headerEnv.hasCJK(headerEnv.text(detailsName)), headerEnv.text(detailsName));
  headerEnv.check(
    'details header name is the bare div',
    detailsName.tagName === 'DIV' && detailsName.getAttribute('data-wh-swapped') === '1',
    detailsName.outerHTML
  );
  headerEnv.check('details author stays English', headerEnv.text(detailsAuthor) === 'FireBlade', headerEnv.text(detailsAuthor));
  headerEnv.check(
    'details author claims no unit',
    !detailsAuthor.hasAttribute('data-wh-unit') && !detailsAuthor.hasAttribute('data-wh-swapped'),
    detailsAuthor.outerHTML
  );
  headerEnv.check('details id chip stays English', headerEnv.text(detailsId) === 'better-dialogs', headerEnv.text(detailsId));
  headerEnv.check('details id chip claims no unit', !detailsId.hasAttribute('data-wh-unit'));
  headerEnv.check('no details engine problems logged', headerEnv.problems.length === 0, headerEnv.problems.join(' | '));
  headerEnv.report();
  headerEnv.window.close();

  return counts(env, headerEnv);
}

// ---------------------------------------------------------------------------
// select: antd 6 closed select hosts
// ---------------------------------------------------------------------------
async function selectCase() {
  const env = mount(JSDOM, { html: fixture.antd6Selects() });
  const { doc } = env;

  await env.wait(1600);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  const realContent = doc.getElementById('real-content');
  const realInput = doc.getElementById('real-input');
  env.check('real select value translated', env.hasCJK(env.text(realContent)), env.text(realContent));
  env.check('real select value host claimed', !!realContent.getAttribute('data-wh-unit'), realContent.getAttribute('data-wh-unit'));
  env.check('real select value host swapped', realContent.getAttribute('data-wh-swapped') === '1');
  env.check(
    'real select value swaps a text node, not the content div',
    realContent.childNodes.length === 2 &&
      realContent.firstChild.nodeType === 3 &&
      env.hasCJK(realContent.firstChild.nodeValue),
    String(realContent.childNodes.length)
  );
  env.check('real select keeps its title', realContent.getAttribute('title') === 'Where the mouse cursor is');
  env.check('real select keeps the search input', realInput && realInput.isConnected && realInput.parentElement === realContent);
  env.check('real select input value untouched', realInput.value === '', JSON.stringify(realInput.value));
  env.check('real select input claims no unit', !realInput.hasAttribute('data-wh-unit') && !realInput.hasAttribute('data-wh-swapped'));

  const nestedContent = doc.getElementById('nested-content');
  const nestedValue = doc.getElementById('nested-value');
  const nestedInput = doc.getElementById('nested-input');
  env.check('nested select value translated', env.hasCJK(env.text(nestedValue)), env.text(nestedValue));
  env.check('nested select value host claimed', !!nestedContent.getAttribute('data-wh-unit'), nestedContent.getAttribute('data-wh-unit'));
  env.check('nested select value keeps its span', nestedValue.tagName === 'SPAN' && nestedValue.isConnected);
  env.check('nested select keeps its title', nestedContent.getAttribute('title') === 'Where the mouse cursor is');
  env.check(
    'nested select input value untouched',
    nestedInput.value === 'Where the mouse cursor is' && nestedInput.getAttribute('value') === 'Where the mouse cursor is',
    JSON.stringify(nestedInput.value)
  );
  env.check('nested select input claims no unit', !nestedInput.hasAttribute('data-wh-unit'));
  env.check('nested value is not a second unit', !nestedValue.hasAttribute('data-wh-unit'));

  const placeholderContent = doc.getElementById('placeholder-content');
  const placeholder = doc.getElementById('real-placeholder');
  const placeholderInput = doc.getElementById('placeholder-input');
  env.check('select placeholder translated', env.hasCJK(env.text(placeholder)), env.text(placeholder));
  env.check('placeholder content host claimed', !!placeholderContent.getAttribute('data-wh-unit'), placeholderContent.getAttribute('data-wh-unit'));
  env.check('placeholder keeps its div', placeholder.tagName === 'DIV' && placeholder.isConnected);
  env.check('placeholder input value untouched', placeholderInput.value === '', JSON.stringify(placeholderInput.value));
  env.check('placeholder input claims no unit', !placeholderInput.hasAttribute('data-wh-unit'));

  const multiItem = doc.getElementById('multi-item');
  const multiItemContent = doc.getElementById('multi-item-content');
  const multiInput = doc.getElementById('multi-input');
  env.check('multiple selection item translated', env.hasCJK(env.text(multiItem)), env.text(multiItem));
  env.check('multiple selection item keeps its span', multiItemContent.tagName === 'SPAN' && multiItemContent.isConnected);
  env.check('multiple selection item keeps its title', multiItem.getAttribute('title') === 'Where the mouse cursor is');
  env.check('multiple input value untouched', multiInput.value === '', JSON.stringify(multiInput.value));
  env.check('multiple input claims no unit', !multiInput.hasAttribute('data-wh-unit'));

  const unitBefore = realContent.getAttribute('data-wh-unit');
  const valueBefore = env.text(realContent);
  const requestsBefore = env.requestCount('Where the mouse cursor is');
  fixture.openSelectDropdown(doc, 'Where the mouse cursor is', 'select-dropdown-real');
  await env.wait(600);
  env.check(
    'closed value keeps its unit when the dropdown opens',
    realContent.getAttribute('data-wh-unit') === unitBefore,
    unitBefore + ' -> ' + realContent.getAttribute('data-wh-unit')
  );
  env.check('closed value is not translated twice', env.text(realContent) === valueBefore, env.text(realContent));
  env.check(
    'the option reuses the value translation instead of a second request',
    env.requestCount('Where the mouse cursor is') === requestsBefore,
    requestsBefore + ' -> ' + env.requestCount('Where the mouse cursor is')
  );
  const option = doc.querySelector('#select-dropdown-real .ant-select-item-option-content');
  env.check('dropdown option translated', env.hasCJK(env.text(option)), env.text(option));

  env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));
  env.check('normal operation logs nothing', env.logs.length === 0, env.logs.join(' | '));
  env.report();
  env.window.close();

  return counts(env);
}

// ---------------------------------------------------------------------------
// title: the settings title unit
// ---------------------------------------------------------------------------
async function titleCase() {
  const env = mount(JSDOM, { html: fixture.compactDensityTwins() });
  const { doc } = env;

  await env.wait(1600);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  const compactTitleText = doc.getElementById('dense-compact-title-text');
  const compactTitleHost = doc.getElementById('dense-compact-title');
  const compactSummary = doc.getElementById('dense-compact-summary');
  const compactHidden = doc.getElementById('dense-compact-desc');
  const comfortableTitle = doc.getElementById('dense-comfortable-title');
  const comfortableDesc = doc.getElementById('dense-comfortable-desc');

  const animationTitleText = doc.getElementById('dense-animation-title-text');
  const animationSummary = doc.getElementById('dense-animation-summary');
  const animationHidden = doc.getElementById('dense-animation-desc');
  const animationComfortableTitle = doc.getElementById('dense-animation-comfortable-title');
  const animationComfortableDesc = doc.getElementById('dense-animation-comfortable-desc');

  const shortcutsTitleText = doc.getElementById('dense-shortcuts-title-text');
  const shortcutsReset = doc.getElementById('dense-shortcuts-reset');
  const shortcutsHidden = doc.getElementById('dense-shortcuts-desc');
  const visibleDesc = doc.getElementById('dense-visible-desc');

  const monitorCopy = "Only the windows on the switcher's monitor";
  const animationCopy = 'How the windows are presented';
  const shortcutsCopy = 'Shortcuts with an animation style of their own, instead of the global one';

  const sent = allRequests(env);

  env.check('compact Monitor title source is exactly Monitor', sent.indexOf('Monitor') !== -1, sent.join(' | '));
  env.check('compact Animation style title source is exactly Animation style', sent.indexOf('Animation style') !== -1, sent.join(' | '));
  env.check('the comfortable Monitor twin shares the same title source', exactCount(sent, 'Monitor') === 1, String(exactCount(sent, 'Monitor')));
  env.check('the comfortable Animation style twin shares the same title source', exactCount(sent, 'Animation style') === 1, String(exactCount(sent, 'Animation style')));
  env.check(
    'no title request carries a placeholder',
    !sent.some(
      (text) =>
        (text.indexOf('Monitor') !== -1 ||
          text.indexOf('Animation style') !== -1 ||
          text.indexOf('Extra shortcuts') !== -1) &&
        text.indexOf('{{') !== -1
    ),
    sent.join(' | ')
  );
  env.check('no request body contains Non-default{{', !sent.some((text) => text.indexOf('Non-default{{') !== -1), sent.join(' | '));
  env.check(
    'no request concatenates a title with its summary',
    !combines(sent, 'Monitor', 'Non-default') &&
      !combines(sent, 'Animation style', 'Non-default') &&
      !combines(sent, 'Extra shortcuts', 'Non-default'),
    sent.join(' | ')
  );
  env.check(
    'no request concatenates a title with its description',
    !combines(sent, 'Monitor', 'Only the windows') &&
      !combines(sent, 'Animation style', 'How the windows') &&
      !combines(sent, 'Extra shortcuts', 'Shortcuts with'),
    sent.join(' | ')
  );
  env.check('every distinct string is requested once', new Set(sent).size === sent.length, sent.join(' | '));

  env.check('the summary is requested as its own string', exactCount(sent, 'Non-default') === 1, String(exactCount(sent, 'Non-default')));
  env.check('the compact summary translated', env.hasCJK(env.text(compactSummary)), env.text(compactSummary));
  env.check('the second compact summary translated', env.hasCJK(env.text(animationSummary)), env.text(animationSummary));
  env.check('the comfortable description is requested as its own string', exactCount(sent, monitorCopy) === 1, String(exactCount(sent, monitorCopy)));
  env.check('the animation description is requested as its own string', exactCount(sent, animationCopy) === 1, String(exactCount(sent, animationCopy)));
  env.check('the comfortable description translated', env.hasCJK(env.text(comfortableDesc)), env.text(comfortableDesc));
  env.check('the animation comfortable description translated', env.hasCJK(env.text(animationComfortableDesc)), env.text(animationComfortableDesc));
  env.check('a visible description element is requested as its own string', exactCount(sent, 'A visible setting description') === 1, String(exactCount(sent, 'A visible setting description')));
  env.check(
    'the visible description element translated',
    env.hasCJK(env.text(visibleDesc)) && visibleDesc.getAttribute('data-wh-unit') !== null,
    visibleDesc.outerHTML
  );
  env.check('the visible description never joins the title', !combines(sent, 'Visible description', 'A visible setting description'), sent.join(' | '));

  env.check('compact Monitor title translated', env.text(compactTitleText) === defaultTranslate('Monitor'), env.text(compactTitleText));
  env.check(
    'compact and comfortable Monitor titles agree',
    env.text(compactTitleText) === env.text(comfortableTitle) && env.hasCJK(env.text(compactTitleText)),
    env.text(compactTitleText) + ' vs ' + env.text(comfortableTitle)
  );
  env.check('compact Animation style title translated', env.text(animationTitleText) === defaultTranslate('Animation style'), env.text(animationTitleText));
  env.check(
    'compact and comfortable Animation style titles agree',
    env.text(animationTitleText) === env.text(animationComfortableTitle) && env.hasCJK(env.text(animationTitleText)),
    env.text(animationTitleText) + ' vs ' + env.text(animationComfortableTitle)
  );
  env.check(
    'the title text element carries no placeholder',
    env.text(compactTitleText).indexOf('{{') === -1 && env.text(animationTitleText).indexOf('{{') === -1,
    env.text(compactTitleText) + ' | ' + env.text(animationTitleText)
  );
  env.check(
    'the compact title is a swap unit without a clone',
    compactTitleHost.getAttribute('data-wh-swapped') === '1' &&
      !compactTitleHost.closest('.windhawk-row').querySelector('[data-wh-clone="1"]'),
    compactTitleHost.outerHTML
  );

  env.check('the Extra shortcuts title source is exactly Extra shortcuts', exactCount(sent, 'Extra shortcuts') === 1, String(exactCount(sent, 'Extra shortcuts')));
  env.check('the Extra shortcuts title translated', env.text(shortcutsTitleText) === defaultTranslate('Extra shortcuts'), env.text(shortcutsTitleText));
  env.check(
    'the reset button is still a nested unit',
    shortcutsReset.getAttribute('data-wh-unit') !== null &&
      shortcutsReset.getAttribute('data-wh-unit') !== doc.getElementById('dense-shortcuts-title').getAttribute('data-wh-unit'),
    shortcutsReset.outerHTML
  );
  env.check('the reset button translated', env.hasCJK(env.text(shortcutsReset)), env.text(shortcutsReset));

  env.check(
    'the hidden Monitor copy is untouched',
    env.text(compactHidden) === monitorCopy &&
      !compactHidden.hasAttribute('data-wh-unit') &&
      !compactHidden.hasAttribute('data-wh-swapped'),
    compactHidden.outerHTML
  );
  env.check(
    'the hidden Animation style copy is untouched',
    env.text(animationHidden) === animationCopy &&
      !animationHidden.hasAttribute('data-wh-unit') &&
      !animationHidden.hasAttribute('data-wh-swapped'),
    animationHidden.outerHTML
  );
  env.check(
    'the hidden Extra shortcuts copy is untouched',
    env.text(shortcutsHidden) === shortcutsCopy &&
      !shortcutsHidden.hasAttribute('data-wh-unit') &&
      !shortcutsHidden.hasAttribute('data-wh-swapped'),
    shortcutsHidden.outerHTML
  );
  env.check('no hidden copy is requested on its own', !sent.some((text) => text === shortcutsCopy), sent.join(' | '));

  const tooltip = fixture.addTooltip(doc, monitorCopy, 'dense-tooltip');
  await env.wait(800);
  env.check('the tooltip copy translated', env.hasCJK(env.text(tooltip)), env.text(tooltip));
  env.check('the tooltip shares the description request', exactCount(sent, monitorCopy) === 1 && env.requestCount(monitorCopy) === 1, String(env.requestCount(monitorCopy)));
  env.check('the title does not absorb the tooltip copy', env.text(compactTitleText) === defaultTranslate('Monitor'), env.text(compactTitleText));

  env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));
  env.report();
  env.window.close();
  return counts(env);
}

// ---------------------------------------------------------------------------
// consistency: one source string, one translation
// ---------------------------------------------------------------------------
async function consistencyCase() {
  const env = mount(JSDOM, { html: fixture.sameStrings() });
  const { doc } = env;

  await env.wait(1600);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  const compactTitle = doc.getElementById('same-compact-title-text');
  const comfortableTitle = doc.getElementById('same-comfortable-title');
  const compactDesc = doc.getElementById('same-compact-desc');
  const comfortableDesc = doc.getElementById('same-comfortable-desc');

  env.check('compact title translated', env.hasCJK(env.text(compactTitle)), env.text(compactTitle));
  env.check('comfortable title translated', env.hasCJK(env.text(comfortableTitle)), env.text(comfortableTitle));
  env.check('compact and comfortable titles agree', env.text(compactTitle) === env.text(comfortableTitle), env.text(compactTitle) + ' vs ' + env.text(comfortableTitle));
  env.check('title requested once', env.requestCount('Keep switcher open') === 1, String(env.requestCount('Keep switcher open')));

  env.check('compact description translated', env.hasCJK(env.text(compactDesc)), env.text(compactDesc));
  env.check('comfortable description translated', env.hasCJK(env.text(comfortableDesc)), env.text(comfortableDesc));
  env.check('compact and comfortable descriptions agree', env.text(compactDesc) === env.text(comfortableDesc), env.text(compactDesc) + ' vs ' + env.text(comfortableDesc));
  env.check('description requested once', env.requestCount('Ctrl+Alt+Tab keeps the switcher open') === 1, String(env.requestCount('Ctrl+Alt+Tab keeps the switcher open')));

  const sentTexts = allRequests(env);
  const rawWhitespace = sentTexts.filter((text) => /\s{2,}|\n/.test(text));
  env.check('no request carries raw whitespace', rawWhitespace.length === 0, rawWhitespace.join(' | '));

  const compactSelect = doc.getElementById('same-compact-select');
  const comfortableSelect = doc.getElementById('same-comfortable-select');
  const positionSelect = doc.getElementById('same-position-select');

  env.check('compact select value translated', env.hasCJK(env.text(compactSelect)), env.text(compactSelect));
  env.check('comfortable select value translated', env.hasCJK(env.text(comfortableSelect)), env.text(comfortableSelect));
  env.check('compact and comfortable select values agree', env.text(compactSelect) === env.text(comfortableSelect), env.text(compactSelect) + ' vs ' + env.text(comfortableSelect));
  env.check('select value requested once', env.requestCount('Where the mouse cursor is') === 1, String(env.requestCount('Where the mouse cursor is')));

  const optionRequestsBefore = env.requestCount('Flip 3D (Vista stack)');
  fixture.openSelectDropdown(doc, 'Flip 3D (Vista stack)', 'same-dropdown');
  await env.wait(600);
  const option = doc.querySelector('#same-dropdown .ant-select-item-option-content');
  env.check('dropdown option translated', env.hasCJK(env.text(option)), env.text(option));
  env.check('select value and its option agree', env.text(option) === env.text(positionSelect), env.text(option) + ' vs ' + env.text(positionSelect));
  env.check(
    'select value and its option share one request',
    env.requestCount('Flip 3D (Vista stack)') === optionRequestsBefore,
    optionRequestsBefore + ' -> ' + env.requestCount('Flip 3D (Vista stack)')
  );

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

  const resetFullWidth = fixture.addResetRow(doc, 'Flip 3D (Vista stack)', 'same-reset-wide', '\uff1a', 'Other shortcut ');
  await env.wait(900);
  env.check(
    'full-width colon reset label composes the same tail',
    env.text(resetFullWidth) === defaultTranslate('Reset to default') + '\uff1a' + tailText,
    env.text(resetFullWidth) + ' vs ' + tailText
  );
  env.check('full-width reset prefix is still requested once', env.requestCount('Reset to default') === 1, String(env.requestCount('Reset to default')));

  const fallbackReset = doc.getElementById('same-fallback-reset');
  env.check('fallback reset translated', env.hasCJK(env.text(fallbackReset)), env.text(fallbackReset));
  env.check('unknown tail falls back to the whole sentence', env.requestCount('Reset to default: Never seen option') === 1, String(env.requestCount('Reset to default: Never seen option')));

  const allSent = allRequests(env);
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
  env.report();
  env.window.close();

  // A compact title whose description host is nested inside it: the title
  // claims its own text, and the hidden copy is an atomic placeholder, never
  // a unit of its own.
  const nested = mount(JSDOM, { html: fixture.compactTitleConflict() });
  await nested.wait(1200);
  nested.check(
    'conflicting compact title translates',
    nested.hasCJK(nested.text(nested.doc.getElementById('conflict-title-text-0'))),
    nested.text(nested.doc.getElementById('conflict-title-text-0'))
  );
  nested.check(
    'the nested screen-reader copy is not a unit',
    !nested.doc.getElementById('conflict-desc-0').hasAttribute('data-wh-unit') &&
      !nested.doc.getElementById('conflict-desc-0').hasAttribute('data-wh-swapped'),
    nested.doc.getElementById('conflict-desc-0').outerHTML
  );
  nested.check(
    'the nested screen-reader copy is not requested on its own',
    nested.requestCount("Only the windows on the switcher's monitor") === 0,
    String(nested.requestCount("Only the windows on the switcher's monitor"))
  );
  nested.check('no nested engine problems logged', nested.problems.length === 0, nested.problems.join(' | '));
  nested.report();
  nested.window.close();

  // Cache keys: built from provider, model, language, endpoint, glossary,
  // the 64-bit text hash and the length of the normalised source, looked up
  // and stored through the channel.
  const cacheEnv = mount(JSDOM, {
    html: fixture.antd6Selects(),
    settings: { cacheEnabled: true },
    translate: (text) => 'NEW:' + text
  });
  const plain = 'Where the mouse cursor is';
  const raw = 'Where the  mouse cursor is';
  const expectedKey = cacheKey('edge', '', 'zh-Hans', plain);

  await cacheEnv.wait(1400);
  const lookedUp = cacheEnv.cacheLookups.slice();
  const cacheValue = cacheEnv.text(cacheEnv.doc.getElementById('real-content'));

  cacheEnv.check('cache: the lookup uses the provider|model|lang|endpoint|glossary|hash key', lookedUp.indexOf(expectedKey) !== -1, lookedUp.join(' | '));
  cacheEnv.check('cache: the translation is stored under that key', cacheEnv.cache.get(expectedKey) === 'NEW:' + plain, String(cacheEnv.cache.get(expectedKey)));
  cacheEnv.check('cache: the stored translation is rendered', cacheValue === 'NEW:' + plain, cacheValue);
  cacheEnv.check(
    'cache: the raw-whitespace key is never looked up',
    lookedUp.every((key) => key !== cacheKey('edge', '', 'zh-Hans', raw)),
    lookedUp.join(' | ')
  );
  cacheEnv.check('cache: no localStorage entries', cacheEnv.window.localStorage.length === 0, String(cacheEnv.window.localStorage.length));
  cacheEnv.check('no cache engine problems logged', cacheEnv.problems.length === 0, cacheEnv.problems.join(' | '));
  cacheEnv.report();
  cacheEnv.window.close();

  return counts(env, nested, cacheEnv);
}

// ---------------------------------------------------------------------------
// claim: claim rules and hidden copies
// ---------------------------------------------------------------------------
async function claimCase() {
  const ariaEnv = mount(JSDOM, { html: fixture.compactAriaTitle() });
  const ariaDoc = ariaEnv.doc;
  await ariaEnv.wait(1400);

  const ariaApi = ariaEnv.api();
  ariaEnv.check('engine up', !!ariaApi && ariaApi.stats().settingsSeen, JSON.stringify(ariaApi && ariaApi.stats()));

  const ariaHost = ariaDoc.getElementById('aria-title');
  const ariaTitle = ariaDoc.getElementById('aria-title-text');
  const ariaHidden = ariaDoc.getElementById('aria-desc');
  const ariaCopy = "Only the windows on the switcher's monitor";
  const ariaSent = allRequests(ariaEnv);

  ariaEnv.check('compact aria title translated', ariaEnv.text(ariaTitle) === defaultTranslate('Monitor'), ariaEnv.text(ariaTitle));
  ariaEnv.check(
    'compact aria title host is a swap unit',
    ariaHost.getAttribute('data-wh-swapped') === '1' && !!ariaHost.getAttribute('data-wh-unit'),
    ariaHost.outerHTML
  );
  ariaEnv.check(
    'the title request carries only the title',
    ariaSent.some((text) => text.replace(/\{\{\d+\}\}/g, '').trim() === 'Monitor') &&
      !ariaSent.some((text) => text.indexOf('Only the windows') !== -1),
    ariaSent.join(' | ')
  );
  ariaEnv.check('the title request does not absorb the hidden copy', !hasBoth(ariaSent, 'Monitor', 'Only the windows'), ariaSent.join(' | '));
  ariaEnv.check('hidden aria copy is untouched', ariaEnv.text(ariaHidden) === ariaCopy, ariaEnv.text(ariaHidden));
  ariaEnv.check(
    'hidden aria copy claims no unit',
    !ariaHidden.hasAttribute('data-wh-unit') && !ariaHidden.hasAttribute('data-wh-swapped'),
    ariaHidden.outerHTML
  );
  ariaEnv.check('settings row is never cloned', !ariaHost.closest('.windhawk-row').querySelector('[data-wh-clone="1"]'));
  ariaEnv.check('hidden aria copy made no request', ariaEnv.requestCount(ariaCopy) === 0, String(ariaEnv.requestCount(ariaCopy)));

  const ariaTooltip = fixture.addTooltip(ariaDoc, ariaCopy, 'aria-tooltip');
  await ariaEnv.wait(800);
  ariaEnv.check('tooltip copy translated', ariaEnv.hasCJK(ariaEnv.text(ariaTooltip)), ariaEnv.text(ariaTooltip));
  ariaEnv.check('hidden copy and tooltip share one request', ariaEnv.requestCount(ariaCopy) === 1, String(ariaEnv.requestCount(ariaCopy)));
  ariaEnv.check('the tooltip does not retranslate the title', ariaEnv.text(ariaTitle) === defaultTranslate('Monitor'), ariaEnv.text(ariaTitle));
  ariaEnv.check('hidden aria copy stays untouched after the tooltip', ariaEnv.text(ariaHidden) === ariaCopy, ariaEnv.text(ariaHidden));

  const ariaTooltip2 = fixture.addTooltip(ariaDoc, ariaCopy, 'aria-tooltip-2');
  await ariaEnv.wait(600);
  ariaEnv.check(
    'a second tooltip reuses the same translation',
    ariaEnv.hasCJK(ariaEnv.text(ariaTooltip2)) && ariaEnv.requestCount(ariaCopy) === 1,
    ariaEnv.text(ariaTooltip2) + ' requests=' + ariaEnv.requestCount(ariaCopy)
  );
  ariaEnv.check('no engine problems logged', ariaEnv.problems.length === 0, ariaEnv.problems.join(' | '));
  ariaEnv.report();
  ariaEnv.window.close();

  const childEnv = mount(JSDOM, { html: fixture.titleWithClaimedChild() });
  const childDoc = childEnv.doc;
  await childEnv.wait(1400);

  const childApi = childEnv.api();
  childEnv.check('engine up', !!childApi && childApi.stats().settingsSeen, JSON.stringify(childApi && childApi.stats()));

  const outerHost = childDoc.getElementById('outer-title');
  const outerChild = childDoc.getElementById('outer-child');
  const childSent = allRequests(childEnv);

  childEnv.check('host own text translated', childEnv.directText(outerHost) === defaultTranslate('Outer title'), childEnv.directText(outerHost));
  childEnv.check('host is a swap unit', outerHost.getAttribute('data-wh-swapped') === '1', outerHost.outerHTML);
  childEnv.check('claimed child translated by its own unit', childEnv.text(outerChild) === defaultTranslate('Child value text'), childEnv.text(outerChild));
  childEnv.check(
    'claimed child keeps its own unit',
    !!outerChild.getAttribute('data-wh-unit') &&
      outerChild.getAttribute('data-wh-unit') !== outerHost.getAttribute('data-wh-unit'),
    outerHost.getAttribute('data-wh-unit') + ' vs ' + outerChild.getAttribute('data-wh-unit')
  );
  childEnv.check('claimed child stays in place', outerChild.parentElement === outerHost.querySelector('.ant-select'), outerChild.parentElement && outerChild.parentElement.outerHTML);
  childEnv.check('own text requested once', childEnv.requestCount('Outer title') === 1, String(childEnv.requestCount('Outer title')));
  childEnv.check('claimed child requested once', childEnv.requestCount('Child value text') === 1, String(childEnv.requestCount('Child value text')));
  childEnv.check('no request combines the host and its child', !hasBoth(childSent, 'Outer title', 'Child value text'), childSent.join(' | '));
  childEnv.check('no engine problems logged', childEnv.problems.length === 0, childEnv.problems.join(' | '));
  childEnv.report();
  childEnv.window.close();

  const proseEnv = mount(JSDOM, { html: fixture.proseAndMixed() });
  const proseDoc = proseEnv.doc;
  await proseEnv.wait(1400);

  const proseApi = proseEnv.api();
  proseEnv.check('engine up', !!proseApi && proseApi.stats().settingsSeen, JSON.stringify(proseApi && proseApi.stats()));

  const prose = proseDoc.getElementById('clone-p');
  const proseClone = prose.previousElementSibling;
  const mixed = proseDoc.getElementById('mixed-li');
  const nested = proseDoc.getElementById('nested-li');
  const nestedClone = nested.previousElementSibling;

  proseEnv.check('readme prose cloned', !!proseClone && proseClone.getAttribute('data-wh-clone') === '1', proseClone && proseClone.outerHTML);
  proseEnv.check('readme prose translated in the clone', proseEnv.hasCJK(proseEnv.text(proseClone)), proseEnv.text(proseClone));
  proseEnv.check('readme host keeps its original', prose.getAttribute('data-wh-orig') === '1');
  proseEnv.check('readme clone is not marked swapped', !!proseClone && !proseClone.hasAttribute('data-wh-swapped'));
  proseEnv.check(
    'no cloned prose is marked swapped',
    Array.from(proseDoc.querySelectorAll('[data-wh-clone="1"]')).every((el) => !el.hasAttribute('data-wh-swapped')),
    proseDoc.querySelectorAll('[data-wh-clone="1"][data-wh-swapped]').length + ' marked'
  );
  proseEnv.check(
    'cloned prose is never a settings row',
    Array.from(proseDoc.querySelectorAll('[data-wh-clone="1"]')).every((el) => !el.closest('.windhawk-row'))
  );
  proseEnv.check('mixed host swaps its own text', proseEnv.directText(mixed) === defaultTranslate('Mixed prose sentence.'), proseEnv.directText(mixed));
  proseEnv.check('mixed host is a swap unit', mixed.getAttribute('data-wh-swapped') === '1');
  proseEnv.check('mixed host is not cloned', !mixed.hasAttribute('data-wh-clone') && !mixed.hasAttribute('data-wh-orig'));
  proseEnv.check('nested item is still cloned', !!nestedClone && nestedClone.getAttribute('data-wh-clone') === '1', nestedClone && nestedClone.outerHTML);
  proseEnv.check('nested item translated', proseEnv.hasCJK(proseEnv.text(nestedClone)), proseEnv.text(nestedClone));
  proseEnv.check('nested item host keeps its original', nested.getAttribute('data-wh-orig') === '1');

  const proseSent = allRequests(proseEnv);
  proseEnv.check('mixed own text requested once', proseEnv.requestCount('Mixed prose sentence.') === 1, String(proseEnv.requestCount('Mixed prose sentence.')));
  proseEnv.check('nested item requested once', proseEnv.requestCount('Nested item.') === 1, String(proseEnv.requestCount('Nested item.')));
  proseEnv.check('no request combines the mixed host and its nested item', !hasBoth(proseSent, 'Mixed prose sentence', 'Nested item'), proseSent.join(' | '));
  proseEnv.check('every distinct normalised string requested once', new Set(proseSent).size === proseSent.length, proseSent.join(' | '));
  proseEnv.check('no engine problems logged', proseEnv.problems.length === 0, proseEnv.problems.join(' | '));
  proseEnv.report();
  proseEnv.window.close();

  const twinEnv = mount(JSDOM, { html: fixture.ariaTitleTwins() });
  const twinDoc = twinEnv.doc;
  await twinEnv.wait(1400);

  const twinApi = twinEnv.api();
  twinEnv.check('engine up', !!twinApi && twinApi.stats().settingsSeen, JSON.stringify(twinApi && twinApi.stats()));

  const twinTitleHost = twinDoc.getElementById('twin-compact-title');
  const twinTitleText = twinDoc.getElementById('twin-compact-title-text');
  const twinAria = twinDoc.getElementById('twin-compact-aria');
  const twinComfortableTitle = twinDoc.getElementById('twin-comfortable-title');
  const twinComfortableDesc = twinDoc.getElementById('twin-comfortable-desc');
  const twinEmptyHost = twinDoc.getElementById('twin-empty-title');
  const twinCopy = 'Which monitor the switcher opens on';
  const twinSent = allRequests(twinEnv);
  const twinDistinct = Array.from(new Set(twinSent));

  twinEnv.check('the compact title source is exactly Monitor', twinSent.some((text) => text === 'Monitor'), twinSent.join(' | '));
  twinEnv.check('no request body carries Monitor{{0}}', !twinSent.some((text) => text.indexOf('Monitor{{') !== -1), twinSent.join(' | '));
  twinEnv.check('the title request carries no description text', !hasBoth(twinSent, 'Monitor', 'Which monitor'), twinSent.join(' | '));
  twinEnv.check(
    'exactly two distinct strings are requested for the pair',
    twinDistinct.length === 2 && twinDistinct.indexOf('Monitor') !== -1 && twinDistinct.indexOf(twinCopy) !== -1,
    twinDistinct.join(' | ')
  );
  twinEnv.check('the title and its comfortable twin share one request', twinEnv.requestCount('Monitor') === 1, String(twinEnv.requestCount('Monitor')));
  twinEnv.check('the comfortable description is requested once', twinEnv.requestCount(twinCopy) === 1, String(twinEnv.requestCount(twinCopy)));
  twinEnv.check(
    'compact title and comfortable title agree',
    twinEnv.text(twinTitleText) === twinEnv.text(twinComfortableTitle) && twinEnv.hasCJK(twinEnv.text(twinTitleText)),
    twinEnv.text(twinTitleText) + ' vs ' + twinEnv.text(twinComfortableTitle)
  );
  twinEnv.check(
    'the hidden aria copy is untouched',
    twinEnv.text(twinAria) === twinCopy && !twinAria.hasAttribute('data-wh-unit') && !twinAria.hasAttribute('data-wh-swapped'),
    twinAria.outerHTML
  );
  twinEnv.check(
    'the compact title is a swap unit without a clone',
    twinTitleHost.getAttribute('data-wh-swapped') === '1' &&
      !twinTitleHost.closest('.windhawk-row').querySelector('[data-wh-clone="1"]'),
    twinTitleHost.outerHTML
  );
  twinEnv.check(
    'a title with only the hidden copy gets no unit',
    !twinEmptyHost.hasAttribute('data-wh-unit') && !twinEmptyHost.hasAttribute('data-wh-swapped'),
    twinEmptyHost.outerHTML
  );
  twinEnv.check('the copy-only title is not requested', !twinSent.some((text) => text.indexOf('Only the windows') !== -1), twinSent.join(' | '));

  const twinTooltip = fixture.addTooltip(twinDoc, twinCopy, 'twin-tooltip');
  await twinEnv.wait(800);
  twinEnv.check(
    'the tooltip and the comfortable description agree',
    twinEnv.text(twinTooltip) === twinEnv.text(twinComfortableDesc) && twinEnv.hasCJK(twinEnv.text(twinTooltip)),
    twinEnv.text(twinTooltip) + ' vs ' + twinEnv.text(twinComfortableDesc)
  );
  twinEnv.check('the tooltip shares the description request', twinEnv.requestCount(twinCopy) === 1, String(twinEnv.requestCount(twinCopy)));
  twinEnv.check('the aria copy stays untouched after the tooltip', twinEnv.text(twinAria) === twinCopy, twinEnv.text(twinAria));
  twinEnv.check('no engine problems logged', twinEnv.problems.length === 0, twinEnv.problems.join(' | '));
  twinEnv.report();
  twinEnv.window.close();

  return counts(ariaEnv, childEnv, proseEnv, twinEnv);
}

// ---------------------------------------------------------------------------
// llm: the OpenAI-compatible provider
// ---------------------------------------------------------------------------
const LLM_SETTINGS = {
  provider: 'llm',
  llmBaseUrl: 'https://llm.local/v1/',
  llmModel: 'test-model',
  llmKeySource: 'credential'
};

function llmPayload(record) {
  let parsed = null;
  try {
    parsed = JSON.parse(record.body);
  } catch (_) {
    parsed = null;
  }
  if (!parsed || !Array.isArray(parsed.messages)) return null;
  const last = parsed.messages[parsed.messages.length - 1];
  let user = null;
  try {
    user = JSON.parse(last && last.content);
  } catch (_) {
    user = null;
  }
  return { body: parsed, user: user };
}

function llmSegments(record) {
  const payload = llmPayload(record);
  return payload && payload.user && Array.isArray(payload.user.segments) ? payload.user.segments : [];
}

function llmReply(record, translations, fenced) {
  const json = JSON.stringify({ translations: translations });
  const content = fenced ? '```json\n' + json + '\n```' : json;
  return {
    status: 200,
    error: 0,
    body: JSON.stringify({ choices: [{ message: { role: 'assistant', content: content } }] })
  };
}

function isLlmRequest(record) {
  return record.url.indexOf('/chat/completions') !== -1;
}

function edgeTexts(record) {
  try {
    const parsed = JSON.parse(record.body);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function capTitle(index, length) {
  let text = 'Cap item ' + index + ' ';
  while (text.length < length) text += 'word ';
  return text.slice(0, length - 1).trim() + '.';
}

function capPage(count, length) {
  let rows = '';
  for (let i = 0; i < count; i++) {
    rows +=
      '<div class="ant-listy-item"><div class="windhawk-row-meta">' +
      '<h4 class="windhawk-row-meta-title" id="cap-name-' + i + '">' + capTitle(i, length) + '</h4>' +
      '</div></div>';
  }
  return '<!doctype html><html lang="en"><head></head><body><div class="ant-listy" id="tile-grid">' + rows + '</div></body></html>';
}

async function llmCase() {
  const mapping = new Map([
    ['Better Dialogs', '甲'],
    ['Improves Windows dialog boxes.', '乙'],
    ['Taskbar Clock', '丙'],
    ['Replaces the tray clock.', '丁']
  ]);
  const glossary = ['mod=模组', 'windhawk = 风鹰'];

  // URL joining, prompt, glossary, fenced JSON and id mapping, in one request.
  const env = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { glossary: glossary }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      const translations = llmSegments(record)
        .map((segment) => ({ id: segment.id, text: mapping.get(segment.text) || '译文' }))
        .reverse();
      return llmReply(record, translations, true);
    }
  });
  await env.wait(1600);

  const requests = env.llmRequests();
  env.check('llm: exactly one chat request for the batch', requests.length === 1, String(requests.length));
  const request = requests[0] || { url: '', fields: [], fieldCount: 0, body: '{}' };
  env.check(
    'llm: base URL ending in /v1 joins without a doubled slash',
    request.url === 'https://llm.local/v1/chat/completions',
    request.url
  );
  // Protocol v2: whtr1, http, id, method, url, body — no header fields at all.
  env.check(
    'llm: the http message carries exactly six fields',
    request.fieldCount === 6 && request.fields.length === 6,
    String(request.fieldCount) + ': ' + JSON.stringify(request.fields.slice(0, 5))
  );
  env.check(
    'llm: the page sends no Authorization or Content-Type',
    request.fields.every(
      (field) =>
        String(field).toLowerCase().indexOf('authorization') === -1 &&
        String(field).toLowerCase().indexOf('content-type') === -1
    ),
    JSON.stringify(request.fields)
  );

  const payload = llmPayload(request) || { body: {}, user: {} };
  const system = payload.body.messages && payload.body.messages[0] ? payload.body.messages[0].content : '';
  env.check('llm: model is the configured one', payload.body.model === 'test-model', JSON.stringify(payload.body.model));
  env.check('llm: temperature is 0', payload.body.temperature === 0, String(payload.body.temperature));
  env.check('llm: system prompt states the placeholder rules', system.indexOf('{{n}}') !== -1 && system.indexOf('<n>...</n>') !== -1, system);
  env.check('llm: system prompt lists the glossary', system.indexOf('Glossary') !== -1 && system.indexOf('mod=模组') !== -1 && system.indexOf('windhawk=风鹰') !== -1, system);
  env.check('llm: system prompt names the target language', system.indexOf('zh-Hans') !== -1, system);
  env.check(
    'llm: user payload carries the glossary object',
    payload.user.glossary && payload.user.glossary.mod === '模组' && payload.user.glossary.windhawk === '风鹰',
    JSON.stringify(payload.user.glossary)
  );
  env.check('llm: user payload names the target language', payload.user.targetLanguage === 'zh-Hans', String(payload.user.targetLanguage));
  env.check(
    'llm: segment ids are 1..n in order',
    JSON.stringify((payload.user.segments || []).map((segment) => segment.id)) === '[1,2,3,4]',
    JSON.stringify(payload.user.segments)
  );

  const name = env.doc.getElementById('tile-name');
  const desc = env.doc.getElementById('tile-desc');
  const name2 = env.doc.getElementById('tile-name2');
  const desc2 = env.doc.getElementById('tile-desc2');
  env.check('llm: id 1 lands on its own unit', env.text(name) === '甲', env.text(name));
  env.check('llm: id 2 lands on its own unit', env.text(desc) === '乙', env.text(desc));
  env.check('llm: id 3 lands on its own unit', env.text(name2) === '丙', env.text(name2));
  env.check('llm: id 4 lands on its own unit', env.text(desc2) === '丁', env.text(desc2));
  env.check('llm: no engine problems', env.problems.length === 0, env.problems.join(' | '));
  env.report();
  env.window.close();

  // One request per distinct string, fan-out to every unit.
  const dedupe = mount(JSDOM, {
    html:
      '<!doctype html><html lang="en"><head></head><body><div class="ant-listy" id="tile-grid">' +
      '<div class="ant-listy-item"><div class="windhawk-row-meta">' +
      '<h4 class="windhawk-row-meta-title" id="dup-name-1">Same title</h4></div></div>' +
      '<div class="ant-listy-item"><div class="windhawk-row-meta">' +
      '<h4 class="windhawk-row-meta-title" id="dup-name-2">Same title</h4></div></div>' +
      '</div></body></html>',
    settings: Object.assign({}, LLM_SETTINGS),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '同' })));
    }
  });
  await dedupe.wait(1400);
  const dedupeRequests = dedupe.llmRequests();
  dedupe.check('llm dedupe: one request for the shared string', dedupeRequests.length === 1, String(dedupeRequests.length));
  dedupe.check(
    'llm dedupe: the request carries one segment',
    dedupeRequests.length === 1 && llmSegments(dedupeRequests[0]).length === 1,
    dedupeRequests.length === 1 ? String(llmSegments(dedupeRequests[0]).length) : '-'
  );
  dedupe.check(
    'llm dedupe: both units receive the translation',
    dedupe.text(dedupe.doc.getElementById('dup-name-1')) === '同' &&
      dedupe.text(dedupe.doc.getElementById('dup-name-2')) === '同',
    dedupe.text(dedupe.doc.getElementById('dup-name-1')) + ' | ' + dedupe.text(dedupe.doc.getElementById('dup-name-2'))
  );
  dedupe.report();
  dedupe.window.close();

  // A base URL without /v1 joins the same way.
  const bare = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { llmBaseUrl: 'https://llm.local/' }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '译' + segment.id })));
    }
  });
  await bare.wait(1400);
  bare.check(
    'llm: a base URL without /v1 joins the path',
    bare.llmRequests().length === 1 && bare.llmRequests()[0].url === 'https://llm.local/chat/completions',
    bare.llmRequests().map((item) => item.url).join(' | ')
  );
  bare.report();
  bare.window.close();

  // An empty model omits the key entirely: the endpoint's default applies.
  const noModel = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { llmModel: '' }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '无' + segment.id })));
    }
  });
  await noModel.wait(1400);
  const noModelRequests = noModel.llmRequests();
  const noModelPayload = noModelRequests.length === 1 ? llmPayload(noModelRequests[0]) : null;
  noModel.check(
    'llm model: an empty model still sends the request',
    noModelRequests.length === 1,
    String(noModelRequests.length)
  );
  noModel.check(
    'llm model: an empty model omits the model key',
    !!noModelPayload && !Object.prototype.hasOwnProperty.call(noModelPayload.body, 'model'),
    JSON.stringify(noModelPayload && noModelPayload.body)
  );
  noModel.check(
    'llm model: the default-model reply still renders',
    noModel.text(noModel.doc.getElementById('tile-name')) === '无1',
    noModel.text(noModel.doc.getElementById('tile-name'))
  );
  noModel.check('llm model: no engine problems', noModel.problems.length === 0, noModel.problems.join(' | '));
  noModel.report();
  noModel.window.close();

  // 12 segments and 6000 characters per LLM request, larger queues split.
  const segmentCap = mount(JSDOM, {
    html: capPage(16, 40),
    settings: Object.assign({}, LLM_SETTINGS, { batchSize: 50, batchChars: 50000 }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '译' + segment.id })));
    }
  });
  await segmentCap.wait(1600);
  const segmentBatches = segmentCap.llmRequests().map((item) => llmSegments(item));
  segmentCap.check(
    'llm cap: no request exceeds 12 segments',
    segmentBatches.every((batch) => batch.length <= 12),
    segmentBatches.map((batch) => batch.length).join(',')
  );
  segmentCap.check(
    'llm cap: a larger queue produces more batches',
    segmentBatches.length === 2 && segmentBatches[0].length === 12 && segmentBatches[1].length === 4,
    segmentBatches.map((batch) => batch.length).join(',')
  );
  segmentCap.report();
  segmentCap.window.close();

  const charCap = mount(JSDOM, {
    html: capPage(14, 600),
    settings: Object.assign({}, LLM_SETTINGS, { batchSize: 50, batchChars: 50000 }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '译' + segment.id })));
    }
  });
  await charCap.wait(1600);
  const charBatches = charCap.llmRequests().map((item) => llmSegments(item));
  charCap.check(
    'llm cap: no request exceeds 6000 characters',
    charBatches.every((batch) => batch.reduce((sum, segment) => sum + segment.text.length, 0) <= 6000),
    charBatches.map((batch) => batch.reduce((sum, segment) => sum + segment.text.length, 0)).join(',')
  );
  charCap.check(
    'llm cap: the character cap splits before the segment cap',
    charBatches.length === 2 && charBatches[0].length === 10 && charBatches[1].length === 4,
    charBatches.map((batch) => batch.length).join(',')
  );
  charCap.report();
  charCap.window.close();

  // Missing ids: the present ids keep the LLM text, the omitted ones fall back
  // to Edge, and the batch is not allowed to shift text between units.
  const missing = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      const segments = llmSegments(record);
      const translations = [];
      for (const segment of segments) {
        if (segment.text === 'Better Dialogs') translations.push({ id: segment.id, text: '甲' });
        if (segment.text === 'Taskbar Clock') translations.push({ id: segment.id, text: '丙' });
      }
      return llmReply(record, translations);
    }
  });
  await missing.wait(1800);
  const missingEdge = missing.httpRequests.filter((item) => !isLlmRequest(item));
  const missingEdgeTexts = missingEdge.reduce((all, item) => all.concat(edgeTexts(item)), []);
  missing.check('llm missing: present ids keep their LLM text', missing.text(missing.doc.getElementById('tile-name')) === '甲', missing.text(missing.doc.getElementById('tile-name')));
  missing.check('llm missing: a later present id keeps its LLM text', missing.text(missing.doc.getElementById('tile-name2')) === '丙', missing.text(missing.doc.getElementById('tile-name2')));
  missing.check(
    'llm missing: omitted ids do not receive another segment text',
    missing.text(missing.doc.getElementById('tile-desc')) !== '甲' && missing.text(missing.doc.getElementById('tile-desc')) !== '乙',
    missing.text(missing.doc.getElementById('tile-desc'))
  );
  missing.check(
    'llm missing: omitted ids fall back to Edge',
    missing.text(missing.doc.getElementById('tile-desc')) === defaultTranslate('Improves Windows dialog boxes.') &&
      missing.text(missing.doc.getElementById('tile-desc2')) === defaultTranslate('Replaces the tray clock.'),
    missing.text(missing.doc.getElementById('tile-desc')) + ' | ' + missing.text(missing.doc.getElementById('tile-desc2'))
  );
  missing.check(
    'llm missing: one Edge request carries the omitted segments',
    missingEdge.length === 1 &&
      missingEdgeTexts.indexOf('Improves Windows dialog boxes.') !== -1 &&
      missingEdgeTexts.indexOf('Replaces the tray clock.') !== -1 &&
      missingEdgeTexts.indexOf('Better Dialogs') === -1,
    missingEdgeTexts.join(' | ')
  );
  missing.check('llm missing: the fallback is logged once', missing.logs.filter((line) => line.indexOf('falling back to Edge') !== -1).length === 1, missing.logs.join(' | '));
  missing.check('llm missing: no engine problems', missing.problems.length === 0, missing.problems.join(' | '));
  missing.report();
  missing.window.close();

  // An empty translations array is a batch failure: Edge takes over and the
  // session never retries the LLM, including for text discovered later.
  const empty = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS),
    respond: (record) => (isLlmRequest(record) ? llmReply(record, []) : null)
  });
  await empty.wait(1800);
  const emptyDoc = empty.doc;
  const late = emptyDoc.createElement('div');
  late.className = 'ant-listy-item';
  late.innerHTML =
    '<div class="windhawk-row-meta"><h4 class="windhawk-row-meta-title" id="late-name">Late setting</h4>' +
    '<div class="windhawk-row-meta-description" id="late-desc">Added after the fallback.</div></div>';
  emptyDoc.getElementById('tile-grid').appendChild(late);
  await empty.wait(900);

  empty.check('llm empty: the batch falls back to Edge', empty.hasCJK(empty.text(emptyDoc.getElementById('tile-name'))) && empty.hasCJK(empty.text(emptyDoc.getElementById('tile-desc'))), empty.text(emptyDoc.getElementById('tile-name')) + ' | ' + empty.text(emptyDoc.getElementById('tile-desc')));
  empty.check('llm empty: no LLM retry after the fallback', empty.llmRequests().length === 1, String(empty.llmRequests().length));
  empty.check('llm empty: later text goes straight to Edge', empty.hasCJK(empty.text(emptyDoc.getElementById('late-name'))) && empty.hasCJK(empty.text(emptyDoc.getElementById('late-desc'))), empty.text(emptyDoc.getElementById('late-name')) + ' | ' + empty.text(emptyDoc.getElementById('late-desc')));
  empty.check('llm empty: fallback is logged once', empty.logs.filter((line) => line.indexOf('falling back to Edge') !== -1).length === 1, empty.logs.join(' | '));
  empty.check('llm empty: no engine problems', empty.problems.length === 0, empty.problems.join(' | '));
  empty.report();
  empty.window.close();

  // A 500 gets exactly one retry, then the batch falls back to Edge.
  const failing = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS),
    respond: (record) => (isLlmRequest(record) ? { status: 500, error: 0, body: 'server error' } : null)
  });
  await failing.wait(2600);
  failing.check('llm 500: exactly one retry', failing.llmRequests().length === 2, String(failing.llmRequests().length));
  failing.check('llm 500: the batch falls back to Edge', failing.hasCJK(failing.text(failing.doc.getElementById('tile-name'))) && failing.hasCJK(failing.text(failing.doc.getElementById('tile-desc'))), failing.text(failing.doc.getElementById('tile-name')) + ' | ' + failing.text(failing.doc.getElementById('tile-desc')));
  failing.check('llm 500: fallback is logged once', failing.logs.filter((line) => line.indexOf('falling back to Edge') !== -1).length === 1, failing.logs.join(' | '));
  failing.check('llm 500: no engine problems', failing.problems.length === 0, failing.problems.join(' | '));
  failing.report();
  failing.window.close();

  // A timeout is retried once too; a successful retry keeps the LLM.
  let timeoutAttempts = 0;
  const slow = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { timeoutMs: 1000 }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      timeoutAttempts++;
      if (timeoutAttempts === 1) return { drop: true };
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '慢' + segment.id })));
    }
  });
  await slow.wait(2800);
  slow.check('llm timeout: the request is retried once', slow.llmRequests().length === 2, String(slow.llmRequests().length));
  slow.check('llm timeout: the retry keeps the LLM', slow.text(slow.doc.getElementById('tile-name')) === '慢1', slow.text(slow.doc.getElementById('tile-name')));
  slow.check(
    'llm timeout: no Edge request after a successful retry',
    slow.httpRequests.every((request) => isLlmRequest(request)),
    slow.httpRequests.map((request) => request.url).join(' | ')
  );
  slow.report();
  slow.window.close();

  // auto resolves to LLM only when a key source is configured.
  const autoNone = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { provider: 'auto', llmKeySource: 'none' })
  });
  await autoNone.wait(1400);
  autoNone.check('llm auto: key source none resolves to Edge', autoNone.api().stats().provider === 'edge', JSON.stringify(autoNone.api().stats()));
  autoNone.check('llm auto: key source none sends no LLM request', autoNone.llmRequests().length === 0, String(autoNone.llmRequests().length));
  autoNone.check('llm auto: Edge still translates', autoNone.hasCJK(autoNone.text(autoNone.doc.getElementById('tile-name'))), autoNone.text(autoNone.doc.getElementById('tile-name')));
  autoNone.report();
  autoNone.window.close();

  const autoKey = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { provider: 'auto', llmKeySource: 'credential' }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '自动' + segment.id })));
    }
  });
  await autoKey.wait(1400);
  autoKey.check('llm auto: a key source resolves to LLM', autoKey.api().stats().provider === 'llm', JSON.stringify(autoKey.api().stats()));
  autoKey.check('llm auto: LLM serves the request', autoKey.llmRequests().length === 1, String(autoKey.llmRequests().length));
  autoKey.check('llm auto: LLM text is rendered', autoKey.text(autoKey.doc.getElementById('tile-name')) === '自动1', autoKey.text(autoKey.doc.getElementById('tile-name')));
  autoKey.report();
  autoKey.window.close();

  // auto picks the LLM with a base URL and a key even when no model is set.
  const autoNoModel = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, {
      provider: 'auto',
      llmKeySource: 'credential',
      llmModel: ''
    }),
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      return llmReply(record, llmSegments(record).map((segment) => ({ id: segment.id, text: '默' + segment.id })));
    }
  });
  await autoNoModel.wait(1400);
  const autoNoModelRequests = autoNoModel.llmRequests();
  const autoNoModelPayload = autoNoModelRequests.length === 1 ? llmPayload(autoNoModelRequests[0]) : null;
  autoNoModel.check(
    'llm auto: a key source without a model resolves to LLM',
    autoNoModel.api().stats().provider === 'llm',
    JSON.stringify(autoNoModel.api().stats())
  );
  autoNoModel.check(
    'llm auto: the model-less request omits the model key',
    !!autoNoModelPayload && !Object.prototype.hasOwnProperty.call(autoNoModelPayload.body, 'model'),
    JSON.stringify(autoNoModelPayload && autoNoModelPayload.body)
  );
  autoNoModel.check(
    'llm auto: the model-less reply renders',
    autoNoModel.text(autoNoModel.doc.getElementById('tile-name')) === '默1',
    autoNoModel.text(autoNoModel.doc.getElementById('tile-name'))
  );
  autoNoModel.report();
  autoNoModel.window.close();

  // google stays a one-line warning and behaves like Edge.
  const google = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { provider: 'google' })
  });
  await google.wait(1400);
  google.check('llm google: resolves to Edge', google.api().stats().provider === 'edge', JSON.stringify(google.api().stats()));
  google.check('llm google: warns once', google.logs.filter((line) => line.indexOf('"google" is not implemented') !== -1).length === 1, google.logs.join(' | '));
  google.check('llm google: Edge translates', google.hasCJK(google.text(google.doc.getElementById('tile-name'))), google.text(google.doc.getElementById('tile-name')));
  google.report();
  google.window.close();

  // Cache keys carry provider and model: Edge text is never reused by the LLM,
  // and a model change is a miss. The mod's store survives settings changes.
  const cacheEnv = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { provider: 'edge', cacheEnabled: true },
    respond: (record) => {
      if (!isLlmRequest(record)) return null;
      const payload = llmPayload(record);
      const model = payload ? payload.body.model : '?';
      return llmReply(
        record,
        llmSegments(record).map((segment) => ({ id: segment.id, text: 'L' + model + ':' + segment.text }))
      );
    }
  });
  const cacheKeys = () => Array.from(cacheEnv.cache.keys());
  await cacheEnv.wait(1400);
  const edgeKeys = cacheKeys().filter((key) => key.indexOf('whtr1|v4|edge|') === 0);
  cacheEnv.check('llm cache: Edge key is written', edgeKeys.length > 0, cacheKeys().join(' | '));

  cacheEnv.pushSettings(
    Object.assign({}, cacheEnv.settings, {
      provider: 'llm',
      llmBaseUrl: 'https://llm.local/v1',
      llmModel: 'model-a',
      llmKeySource: 'credential'
    })
  );
  await cacheEnv.wait(1400);
  const afterA = cacheEnv.text(cacheEnv.doc.getElementById('tile-name'));
  cacheEnv.check('llm cache: Edge text is not reused for the LLM', afterA.indexOf('Lmodel-a:') === 0, afterA);
  cacheEnv.check(
    'llm cache: model-a key is written',
    cacheKeys().some((key) => key.indexOf('whtr1|v4|llm|model-a|') === 0),
    cacheKeys().join(' | ')
  );
  cacheEnv.check(
    'llm cache: Edge key stays separate',
    cacheKeys().some((key) => key.indexOf('whtr1|v4|edge|') === 0),
    cacheKeys().join(' | ')
  );

  cacheEnv.pushSettings(Object.assign({}, cacheEnv.settings, { llmModel: 'model-b' }));
  await cacheEnv.wait(1400);
  const afterB = cacheEnv.text(cacheEnv.doc.getElementById('tile-name'));
  cacheEnv.check('llm cache: a model change misses the cache', afterB.indexOf('Lmodel-b:') === 0, afterB);
  cacheEnv.check(
    'llm cache: model-b key is written',
    cacheKeys().some((key) => key.indexOf('whtr1|v4|llm|model-b|') === 0),
    cacheKeys().join(' | ')
  );
  cacheEnv.check(
    'llm cache: the model-a key is kept',
    cacheKeys().some((key) => key.indexOf('whtr1|v4|llm|model-a|') === 0),
    cacheKeys().join(' | ')
  );
  cacheEnv.check('llm cache: no engine problems', cacheEnv.problems.length === 0, cacheEnv.problems.join(' | '));
  cacheEnv.report();
  cacheEnv.window.close();

  // A failed LLM batch falls back to Edge: the result belongs to the Edge key
  // even though the session asked the LLM. A rebuild in the same session (the
  // provider stays on Edge after the fallback) and a later Edge visit read that
  // key back without another request.
  const fallback = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: Object.assign({}, LLM_SETTINGS, { cacheEnabled: true }),
    respond: (record) => (isLlmRequest(record) ? { status: 500, error: 0, body: 'down' } : null)
  });
  await fallback.waitFor(
    () => {
      const stats = fallback.api() ? fallback.api().stats() : null;
      return !!stats && stats.translated === 4 && fallback.hasCJK(fallback.text(fallback.doc.getElementById('tile-name')));
    },
    5000
  );
  const fallbackPlain = 'Better Dialogs';
  const fallbackEdgeKey = cacheKey('edge', 'test-model', 'zh-Hans', fallbackPlain, LLM_SETTINGS.llmBaseUrl);
  const fallbackKeys = Array.from(fallback.cache.keys());
  fallback.check(
    'llm fallback cache: the Edge result is stored under the Edge key',
    fallback.cache.get(fallbackEdgeKey) === defaultTranslate(fallbackPlain),
    fallbackEdgeKey + ' => ' + fallback.cache.get(fallbackEdgeKey)
  );
  fallback.check(
    'llm fallback cache: every fallback string is an Edge entry',
    fallbackKeys.length === 4 && fallbackKeys.every((item) => item.indexOf('whtr1|v4|edge|') === 0),
    fallbackKeys.join(' | ')
  );
  const fallbackRequests = fallback.httpRequests.length;
  fallback.pushSettings(Object.assign({}, fallback.settings, { scopeChangelog: false }));
  const fallbackRebuilt = await fallback.waitFor(
    () =>
      fallback.api().stats().cacheHits >= 4 &&
      fallback.text(fallback.doc.getElementById('tile-name')) === defaultTranslate(fallbackPlain),
    3000
  );
  fallback.check(
    'llm fallback cache: a rebuild reads the Edge key without another request',
    fallbackRebuilt &&
      fallback.httpRequests.length === fallbackRequests &&
      fallback.text(fallback.doc.getElementById('tile-name')) === defaultTranslate(fallbackPlain),
    fallback.httpRequests.length + ' requests, ' + fallback.text(fallback.doc.getElementById('tile-name'))
  );
  fallback.check('llm fallback cache: no engine problems', fallback.problems.length === 0, fallback.problems.join(' | '));
  fallback.report();
  fallback.window.close();

  const revisit = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: {
      provider: 'edge',
      llmBaseUrl: LLM_SETTINGS.llmBaseUrl,
      llmModel: LLM_SETTINGS.llmModel,
      cacheEnabled: true
    },
    cache: Object.fromEntries(fallback.cache)
  });
  await revisit.wait(1200);
  revisit.check(
    'llm fallback cache: a second visit hits the Edge key',
    revisit.httpRequests.length === 0 &&
      revisit.text(revisit.doc.getElementById('tile-name')) === defaultTranslate(fallbackPlain),
    revisit.httpRequests.length + ' requests, ' + revisit.text(revisit.doc.getElementById('tile-name'))
  );
  revisit.check(
    'llm fallback cache: the second visit counts the hits',
    revisit.api().stats().cacheHits >= 4,
    JSON.stringify(revisit.api().stats())
  );
  revisit.check('llm fallback cache: no engine problems on the second visit', revisit.problems.length === 0, revisit.problems.join(' | '));
  revisit.report();
  revisit.window.close();

  return counts(env, dedupe, bare, noModel, segmentCap, charCap, missing, empty, failing, slow, autoNone, autoKey, autoNoModel, google, cacheEnv, fallback, revisit);
}

// ---------------------------------------------------------------------------
// cache: the mod owns the store; lookups and stores go through the channel
// ---------------------------------------------------------------------------
async function cacheCase() {
  const plain = 'Better Dialogs';
  const key = cacheKey('edge', '', 'zh-Hans', plain);

  // A hit resolves through the channel: one lookup, no request for the string.
  const hit = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    cache: { [key]: '已缓存' }
  });
  await hit.wait(1400);
  const hitName = hit.doc.getElementById('tile-name');
  hit.check('cache hit: the engine looks the key up', hit.cacheLookups.indexOf(key) !== -1, hit.cacheLookups.join(' | '));
  hit.check('cache hit: the cached text is rendered', hit.text(hitName) === '已缓存', hit.text(hitName));
  hit.check('cache hit: the cached string is never requested', hit.requestCount(plain) === 0, String(hit.requestCount(plain)));
  hit.check('cache hit: the hit is counted', hit.api().stats().cacheHits >= 1, JSON.stringify(hit.api().stats()));
  hit.check('cache hit: no engine problems', hit.problems.length === 0, hit.problems.join(' | '));
  hit.report();
  hit.window.close();

  // A miss resolves through the channel, goes to the provider, and the result
  // is put back without waiting for a reply.
  const miss = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    translate: (text) => 'M:' + text
  });
  await miss.wait(1400);
  miss.check('cache miss: the key is looked up', miss.cacheLookups.indexOf(key) !== -1, miss.cacheLookups.join(' | '));
  miss.check('cache miss: the miss is counted', miss.api().stats().cacheMisses >= 1, JSON.stringify(miss.api().stats()));
  miss.check('cache miss: the provider is asked', miss.requestCount(plain) === 1, String(miss.requestCount(plain)));
  miss.check('cache miss: the result is put back', miss.cache.get(key) === 'M:' + plain, String(miss.cache.get(key)));
  miss.check('cache miss: the result is rendered', miss.text(miss.doc.getElementById('tile-name')) === 'M:' + plain, miss.text(miss.doc.getElementById('tile-name')));
  miss.check('cache miss: every string is stored', miss.cache.size === 4, String(miss.cache.size));
  miss.check(
    'protocol: every http message is exactly six fields',
    miss.httpRequests.every((request) => request.fieldCount === 6 && request.fields.length === 6),
    miss.httpRequests.map((request) => request.fieldCount).join(',')
  );
  miss.check('cache miss: no engine problems', miss.problems.length === 0, miss.problems.join(' | '));
  miss.report();
  miss.window.close();

  // Cache off: no cache traffic at all.
  const off = mount(JSDOM, { html: fixture.tileGrid() });
  await off.wait(1400);
  off.check('cache off: no cache lookups', off.cacheLookups.length === 0, off.cacheLookups.join(' | '));
  off.check('cache off: nothing is stored', off.cache.size === 0, String(off.cache.size));
  off.check('cache off: Edge still translates', off.hasCJK(off.text(off.doc.getElementById('tile-name'))), off.text(off.doc.getElementById('tile-name')));
  off.report();
  off.window.close();

  // clearCache: the mod clears its own store; the page only forgets its
  // in-session map and sends nothing.
  const clear = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    translate: (text) => 'C:' + text
  });
  await clear.wait(1400);
  const lookupsBefore = clear.cacheLookups.length;
  const storeBefore = clear.cache.size;
  clear.pushSettings(Object.assign({}, clear.settings, { clearCache: true }));
  await clear.wait(400);
  clear.check('cache clear: the engine sends no lookup', clear.cacheLookups.length === lookupsBefore, lookupsBefore + ' -> ' + clear.cacheLookups.length);
  clear.check('cache clear: the engine leaves the mod store alone', clear.cache.size === storeBefore, storeBefore + ' -> ' + clear.cache.size);
  clear.check('cache clear: no engine problems', clear.problems.length === 0, clear.problems.join(' | '));
  clear.report();
  clear.window.close();

  // No reply to cache-get: after the 5 s deadline every waiting string is a
  // miss, the provider translates it, and the silence is logged once.
  const silent = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    dropCache: true,
    translate: (text) => 'S:' + text
  });
  await silent.waitFor(() => {
    const stats = silent.api() ? silent.api().stats() : null;
    return !!stats && stats.translated === 4 && silent.text(silent.doc.getElementById('tile-name')) === 'S:' + plain;
  }, 9000);
  const silentName = silent.doc.getElementById('tile-name');
  silent.check(
    'cache timeout: every string was looked up',
    silent.cacheLookups.length === 4,
    String(silent.cacheLookups.length)
  );
  silent.check(
    'cache timeout: the provider translates the string',
    silent.text(silentName) === 'S:' + plain,
    silent.text(silentName)
  );
  silent.check(
    'cache timeout: every lookup is counted as a miss',
    silent.api().stats().cacheMisses === 4,
    JSON.stringify(silent.api().stats())
  );
  silent.check(
    'cache timeout: the silence is logged once',
    silent.logs.filter((line) => line.indexOf('cache is not answering') !== -1).length === 1,
    silent.logs.join(' | ')
  );
  const lateKey = cacheKey('edge', '', 'zh-Hans', plain);
  silent.check(
    'cache timeout: the translation is stored normally',
    silent.cache.get(lateKey) === 'S:' + plain,
    String(silent.cache.get(lateKey))
  );
  const timedOut = silent.cacheRequests.find((item) => item.key === lateKey);
  silent.emitCache('cache-hit', timedOut.id, lateKey, 'LATE');
  await silent.wait(300);
  silent.check(
    'cache timeout: a late reply for nobody is ignored',
    silent.text(silentName) === 'S:' + plain && silent.api().stats().cacheHits === 0,
    silent.text(silentName) + ' hits=' + silent.api().stats().cacheHits
  );
  silent.check('cache timeout: no engine problems', silent.problems.length === 0, silent.problems.join(' | '));
  silent.report();
  silent.window.close();

  // The endpoint and the effective glossary are part of the key, and the text
  // hash is two 32-bit halves (64 bits) plus the length.
  const keyEnv = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: {
      cacheEnabled: true,
      provider: 'llm',
      llmBaseUrl: 'https://llm.one/v1',
      llmModel: 'm',
      llmKeySource: 'credential'
    }
  });
  await keyEnv.wait(1600);
  const baseKey = cacheKey('llm', 'm', 'zh-Hans', plain, 'https://llm.one/v1');
  keyEnv.check(
    'cache key: the endpoint is part of the key',
    keyEnv.cacheLookups.indexOf(baseKey) !== -1,
    keyEnv.cacheLookups.join(' | ')
  );
  keyEnv.check('cache key: the text hash is 64 bits plus the length', /\|[0-9a-f]{16}\|\d+$/.test(baseKey), baseKey);

  keyEnv.pushSettings(Object.assign({}, keyEnv.settings, { llmBaseUrl: 'https://llm.two/v1' }));
  await keyEnv.wait(1600);
  const otherKey = cacheKey('llm', 'm', 'zh-Hans', plain, 'https://llm.two/v1');
  keyEnv.check(
    'cache key: a different base URL changes the key',
    otherKey !== baseKey && keyEnv.cacheLookups.indexOf(otherKey) !== -1,
    baseKey + ' vs ' + otherKey
  );

  keyEnv.pushSettings(Object.assign({}, keyEnv.settings, { glossary: ['mod=模组'] }));
  await keyEnv.wait(1600);
  const glossaryKey = cacheKey('llm', 'm', 'zh-Hans', plain, 'https://llm.two/v1', ['mod=模组']);
  keyEnv.check(
    'cache key: a different glossary changes the key',
    glossaryKey !== otherKey && keyEnv.cacheLookups.indexOf(glossaryKey) !== -1,
    otherKey + ' vs ' + glossaryKey
  );
  keyEnv.check('cache key: no engine problems', keyEnv.problems.length === 0, keyEnv.problems.join(' | '));
  keyEnv.report();
  keyEnv.window.close();

  // A translation containing U+001F survives both cache directions: the
  // provider result is stored whole, and a cache-hit is not truncated.
  const sepText = 'A\x1fB';
  const sepEnv = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    translate: (text) => (text === plain ? sepText : defaultTranslate(text))
  });
  await sepEnv.wait(1400);
  const sepKey = cacheKey('edge', '', 'zh-Hans', plain);
  sepEnv.check(
    'separator: the provider translation keeps U+001F',
    sepEnv.text(sepEnv.doc.getElementById('tile-name')) === sepText,
    JSON.stringify(sepEnv.text(sepEnv.doc.getElementById('tile-name')))
  );
  sepEnv.check(
    'separator: cache-put keeps the whole translation',
    sepEnv.cache.get(sepKey) === sepText,
    JSON.stringify(sepEnv.cache.get(sepKey))
  );
  sepEnv.report();
  sepEnv.window.close();

  const sepHit = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    cache: { [sepKey]: sepText }
  });
  await sepHit.wait(1400);
  sepHit.check(
    'separator: cache-hit keeps the whole translation',
    sepHit.text(sepHit.doc.getElementById('tile-name')) === sepText,
    JSON.stringify(sepHit.text(sepHit.doc.getElementById('tile-name')))
  );
  sepHit.check(
    'separator: the hit is used instead of a request',
    sepHit.requestCount(plain) === 0 && sepHit.api().stats().cacheHits >= 1,
    sepHit.requestCount(plain) + ' requests, ' + JSON.stringify(sepHit.api().stats())
  );
  sepHit.check('separator: no engine problems', sepHit.problems.length === 0, sepHit.problems.join(' | '));
  sepHit.report();
  sepHit.window.close();

  // Request ids: a reply resolves only the lookup that carried its id. A
  // rebuild drops every pending lookup, so an old reply with the right key
  // cannot resolve the new lookup for that key; a mismatched key is ignored
  // even when the id matches.
  const ids = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    dropCache: true,
    translate: (text) => 'R:' + text
  });
  await ids.waitFor(() => ids.cacheRequests.length >= 4, 3000);
  const stale = ids.cacheRequests.find((item) => item.key === key);
  const staleId = stale ? stale.id : '0';
  ids.check('cache id: the lookup carries a request id', !!stale && /^\d+$/.test(String(stale.id)), stale && stale.id);
  ids.check(
    'cache id: cache-get carries exactly tag, kind, id and key',
    ids.cacheRequests.length > 0 && ids.cacheRequests.every((item) => item.raw.split(SEP).length === 4),
    ids.cacheRequests.map((item) => item.raw.split(SEP).length).join(',')
  );

  ids.pushSettings(Object.assign({}, ids.settings, { scopeChangelog: false }));
  const rebuilt = await ids.waitFor(
    () => ids.cacheRequests.some((item) => item.key === key && item.id !== staleId),
    3000
  );
  const fresh = ids.cacheRequests.filter((item) => item.key === key).slice(-1)[0];
  const freshId = fresh ? fresh.id : '1';
  ids.check('cache id: a rebuild sends a new id for the same key', rebuilt && !!fresh, JSON.stringify(ids.cacheRequests));
  const staleHits = ids.api().stats().cacheHits;
  ids.emitCache('cache-hit', staleId, key, 'STALE');
  await ids.wait(200);
  const nameEl = ids.doc.getElementById('tile-name');
  ids.check(
    'cache id: a stale id is ignored even when the key matches',
    ids.text(nameEl) === 'Better Dialogs' && ids.api().stats().cacheHits === staleHits,
    ids.text(nameEl) + ' hits=' + ids.api().stats().cacheHits
  );
  ids.emitCache('cache-hit', freshId, key, 'FRESH');
  await ids.wait(200);
  ids.check('cache id: the current id resolves its own lookup', ids.text(nameEl) === 'FRESH', ids.text(nameEl));

  const descKey = cacheKey('edge', '', 'zh-Hans', 'Improves Windows dialog boxes.');
  const wrong = ids.cacheRequests.filter((item) => item.key === descKey).slice(-1)[0];
  const wrongId = wrong ? wrong.id : '2';
  const wrongHits = ids.api().stats().cacheHits;
  ids.emitCache('cache-hit', wrongId, key, 'WRONG');
  await ids.wait(200);
  const descEl = ids.doc.getElementById('tile-desc');
  ids.check(
    'cache id: the right id with a different key is ignored',
    ids.text(descEl) === 'Improves Windows dialog boxes.' && ids.api().stats().cacheHits === wrongHits,
    ids.text(descEl) + ' hits=' + ids.api().stats().cacheHits
  );
  ids.emitCache('cache-miss', wrongId, descKey);
  await ids.wait(300);
  ids.check(
    'cache id: the matching miss resolves after a mismatched reply',
    ids.text(descEl) === 'R:Improves Windows dialog boxes.',
    ids.text(descEl)
  );
  ids.check('cache id: no engine problems', ids.problems.length === 0, ids.problems.join(' | '));
  ids.report();
  ids.window.close();

  // A cache clear invalidates the store and drops every outstanding lookup; the
  // waiting strings are translated normally, and the old reply resolves nothing.
  const cleared = mount(JSDOM, {
    html: fixture.tileGrid(),
    settings: { cacheEnabled: true },
    dropCache: true,
    translate: (text) => 'C:' + text
  });
  await cleared.waitFor(() => cleared.cacheRequests.length >= 4, 3000);
  const clearedLookup = cleared.cacheRequests.find((item) => item.key === key);
  const clearedId = clearedLookup ? clearedLookup.id : '0';
  cleared.pushSettings(Object.assign({}, cleared.settings, { clearCache: true }));
  const clearedOk = await cleared.waitFor(
    () => cleared.text(cleared.doc.getElementById('tile-name')) === 'C:Better Dialogs',
    3000
  );
  const clearedHits = cleared.api().stats().cacheHits;
  cleared.emitCache('cache-hit', clearedId, key, 'LATE');
  await cleared.wait(200);
  cleared.check(
    'cache clear: waiting strings are translated after the clear',
    clearedOk,
    cleared.text(cleared.doc.getElementById('tile-name'))
  );
  cleared.check(
    'cache clear: a late reply cannot resolve anything',
    cleared.text(cleared.doc.getElementById('tile-name')) === 'C:Better Dialogs' &&
      cleared.api().stats().cacheHits === clearedHits,
    cleared.text(cleared.doc.getElementById('tile-name')) + ' hits=' + cleared.api().stats().cacheHits
  );
  cleared.check('cache clear: no engine problems', cleared.problems.length === 0, cleared.problems.join(' | '));
  cleared.report();
  cleared.window.close();

  return counts(hit, miss, off, clear, silent, keyEnv, sepEnv, sepHit, ids, cleared);
}

// ---------------------------------------------------------------------------
// teardown: the mod is unloading; restore everything and go silent
// ---------------------------------------------------------------------------
async function teardownCase() {
  const env = mount(JSDOM, { html: fixture.all() });
  await env.wait(1800);
  const { doc } = env;

  const name = doc.getElementById('tile-name');
  const titleText = doc.getElementById('compact-title-text');
  const prose = doc.getElementById('details-body');
  const clone = prose ? prose.previousElementSibling : null;
  const requestsBefore = env.httpRequests.length;
  const api = env.api();

  env.check('teardown: the page is translated first', env.hasCJK(env.text(name)), env.text(name));
  env.check(
    'teardown: a prose clone is present first',
    !!clone && clone.getAttribute('data-wh-clone') === '1',
    clone && clone.outerHTML
  );

  env.teardown();
  // The disable path runs synchronously inside the message handler.
  env.check('teardown: the swapped name is restored', env.text(name) === 'Better Dialogs', env.text(name));
  env.check('teardown: the settings title is restored', env.text(titleText) === 'Monitor', env.text(titleText));
  env.check('teardown: the clone is removed', !doc.querySelector('[data-wh-clone="1"]'));
  env.check('teardown: the original prose is visible again', prose.getAttribute('data-wh-orig') === null, prose.outerHTML);
  env.check(
    'teardown: no unit marks remain',
    doc.querySelectorAll('[data-wh-unit],[data-wh-swapped],[data-wh-orig]').length === 0,
    String(doc.querySelectorAll('[data-wh-unit],[data-wh-swapped],[data-wh-orig]').length)
  );
  env.check('teardown: the engine reports disabled', api.stats().enabled === false, JSON.stringify(api.stats()));
  env.check('teardown: the public handle is removed', env.api() === undefined, String(env.api()));
  env.check('teardown: the injected style is removed', !doc.getElementById('whtr-style'));
  env.check('teardown: nothing is sent', env.postTeardown.length === 0, env.postTeardown.join(' | '));

  // The observer is disconnected: a late host is left alone and asks for nothing.
  const late = doc.createElement('h4');
  late.className = 'windhawk-row-meta-title';
  late.id = 'late-name';
  late.textContent = 'Late title';
  doc.getElementById('tile-grid').appendChild(late);
  await env.wait(700);
  env.check('teardown: the observer is disconnected', env.text(late) === 'Late title', env.text(late));
  env.check(
    'teardown: no request after a late mutation',
    env.httpRequests.length === requestsBefore,
    requestsBefore + ' -> ' + env.httpRequests.length
  );

  // Input handlers are gone: a shortcut or a tap changes nothing.
  shortcut(env);
  touch(env, 'pointerdown', 1);
  touch(env, 'pointerup', 1);
  await env.wait(300);
  env.check(
    'teardown: the shortcut does nothing',
    env.text(name) === 'Better Dialogs' && api.stats().enabled === false,
    env.text(name)
  );

  // The message listener is gone: a late settings push must not revive anything.
  env.pushSettings(Object.assign({}, env.settings, { targetLang: 'ja' }));
  await env.wait(300);
  env.check(
    'teardown: a settings push does not revive the engine',
    api.stats().enabled === false && env.text(name) === 'Better Dialogs',
    env.text(name)
  );
  env.check('teardown: nothing is sent after teardown', env.postTeardown.length === 0, env.postTeardown.join(' | '));

  // A new injection in the same document must replace the dead handle and
  // translate again, even when the dead engine's __WHTR__ was left behind.
  env.window.__WHTR__ = api;
  env.reinject();
  await env.waitFor(
    () => {
      const revived = env.api();
      return !!revived && revived !== api && revived.stats().translated > 0 && env.hasCJK(env.text(name));
    },
    4000
  );
  const revived = env.api();
  env.check(
    'teardown: a fresh injection replaces the dead engine',
    !!revived && revived !== api && revived.__engine.alive() === true,
    String(revived && revived.version)
  );
  env.check('teardown: a fresh injection translates again', env.hasCJK(env.text(name)), env.text(name));
  env.check('teardown: the fresh injection reinstalls its style', !!doc.getElementById('whtr-style'));
  env.check('teardown: the dead handle stays disabled', api.stats().enabled === false, JSON.stringify(api.stats()));
  env.check('teardown: no engine problems after re-injection', env.problems.length === 0, env.problems.join(' | '));
  env.report();
  env.window.close();
  return counts(env);
}

// ---------------------------------------------------------------------------
// gesture: two-finger double tap and shortcut enable/disable cycles
// ---------------------------------------------------------------------------
function touch(env, type, id, x, y) {
  const event = new env.window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerType: { value: 'touch' },
    pointerId: { value: id },
    clientX: { value: x == null ? 10 : x },
    clientY: { value: y == null ? 10 : y }
  });
  env.doc.body.dispatchEvent(event);
}

function twoFingerTap(env, first, second) {
  touch(env, 'pointerdown', first);
  touch(env, 'pointerdown', second);
  touch(env, 'pointerup', first);
  touch(env, 'pointerup', second);
}

function shortcut(env) {
  env.window.dispatchEvent(
    new env.window.KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', altKey: true, bubbles: true })
  );
}

async function gestureCase() {
  const html = fixture.tileGrid();
  const env = mount(JSDOM, { html });
  await env.wait(1400);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  const name = env.doc.getElementById('tile-name');
  const desc = env.doc.getElementById('tile-desc');
  env.check('translation starts enabled', api.stats().enabled === true);
  env.check('tile translated before the cycle', env.hasCJK(env.text(name)), env.text(name));

  // Gesture off, gesture on.
  twoFingerTap(env, 1, 2);
  twoFingerTap(env, 3, 4);
  env.check('gesture disables translation', api.stats().enabled === false, JSON.stringify(api.stats()));
  env.check('gesture disable restores the original text', env.text(name) === 'Better Dialogs', env.text(name));
  env.check('gesture disable drops the units', api.stats().units === 0, String(api.stats().units));

  twoFingerTap(env, 5, 6);
  twoFingerTap(env, 7, 8);
  await env.waitFor(() => api.stats().enabled && env.hasCJK(env.text(name)) && api.stats().translated === 4, 4000);
  env.check('gesture re-enables translation', api.stats().enabled === true, JSON.stringify(api.stats()));
  env.check('gesture enable translates the tiles again', env.hasCJK(env.text(name)) && env.hasCJK(env.text(desc)), env.text(name) + ' | ' + env.text(desc));

  // The disable -> enable cycle must match a fresh load exactly.
  const fresh = mount(JSDOM, { html });
  await fresh.wait(1400);
  const cycleStats = api.stats();
  const freshStats = fresh.api().stats();
  env.check(
    'disable/enable leaves the same unit count as a fresh load',
    cycleStats.units === freshStats.units && cycleStats.translated === freshStats.translated,
    JSON.stringify({ cycle: cycleStats.units + '/' + cycleStats.translated, fresh: freshStats.units + '/' + freshStats.translated })
  );
  const ids = ['tile-name', 'tile-desc', 'tile-name2', 'tile-desc2'];
  const sameText = ids.every((id) => env.text(env.doc.getElementById(id)) === fresh.text(fresh.doc.getElementById(id)));
  env.check('disable/enable leaves the same translations as a fresh load', sameText, ids.map((id) => env.text(env.doc.getElementById(id))).join(' | '));
  env.check('no engine problems after the cycle', env.problems.length === 0, env.problems.join(' | '));

  // Shortcut off, shortcut on.
  shortcut(env);
  await env.wait(200);
  env.check('shortcut disables translation', api.stats().enabled === false, JSON.stringify(api.stats()));
  shortcut(env);
  await env.waitFor(() => api.stats().enabled && api.stats().translated === 4 && env.hasCJK(env.text(name)), 4000);
  env.check('shortcut re-enables translation', api.stats().enabled === true && env.hasCJK(env.text(name)), env.text(name));

  // Gesture off -> shortcut on.
  twoFingerTap(env, 20, 21);
  twoFingerTap(env, 22, 23);
  env.check('gesture off before the shortcut', api.stats().enabled === false, JSON.stringify(api.stats()));
  shortcut(env);
  await env.waitFor(() => api.stats().enabled && api.stats().translated === 4 && env.hasCJK(env.text(name)), 4000);
  env.check('shortcut recovers from a gesture disable', api.stats().enabled === true && env.hasCJK(env.text(name)), env.text(name));

  // Shortcut off -> gesture on.
  shortcut(env);
  await env.wait(200);
  env.check('shortcut off before the gesture', api.stats().enabled === false, JSON.stringify(api.stats()));
  twoFingerTap(env, 30, 31);
  twoFingerTap(env, 32, 33);
  await env.waitFor(() => api.stats().enabled && api.stats().translated === 4 && env.hasCJK(env.text(name)), 4000);
  env.check('gesture recovers from a shortcut disable', api.stats().enabled === true && env.hasCJK(env.text(name)), env.text(name));

  // A pointer left down across a cycle must not be paired with the next one.
  shortcut(env);
  await env.wait(200);
  touch(env, 'pointerdown', 90);
  shortcut(env);
  await env.waitFor(() => api.stats().enabled && api.stats().translated === 4 && env.hasCJK(env.text(name)), 4000);
  env.check('a stale pointer does not block the shortcut', api.stats().enabled === true, JSON.stringify(api.stats()));
  twoFingerTap(env, 40, 41);
  twoFingerTap(env, 42, 43);
  env.check('a stale pointer between cycles does not block the gesture off', api.stats().enabled === false, JSON.stringify(api.stats()));
  twoFingerTap(env, 44, 45);
  twoFingerTap(env, 46, 47);
  await env.waitFor(() => api.stats().enabled && api.stats().translated === 4 && env.hasCJK(env.text(name)), 4000);
  env.check('a stale pointer between cycles does not block the gesture on', api.stats().enabled === true && env.hasCJK(env.text(name)), env.text(name));

  env.report();
  env.window.close();
  fresh.window.close();

  // Enable must recover when the settings have not arrived yet: the request is
  // re-sent and the first payload scans normally.
  const early = mount(JSDOM, { html });
  early.api().enable();
  early.api().disable();
  early.api().enable();
  await early.wait(1400);
  early.check(
    'enable before settings recovers when the payload arrives',
    early.api().stats().enabled === true &&
      early.api().stats().translated === 4 &&
      early.hasCJK(early.text(early.doc.getElementById('tile-name'))),
    JSON.stringify(early.api().stats())
  );
  early.check('no engine problems before settings', early.problems.length === 0, early.problems.join(' | '));
  early.report();
  early.window.close();

  return counts(env, fresh, early);
}

// ---------------------------------------------------------------------------
// updates: the aggregated update wizard and its changelog dialog
// ---------------------------------------------------------------------------
async function updateSurfacesCase() {
  const env = mount(JSDOM, { html: fixture.updateSurfaces() });
  const { doc } = env;
  await env.wait(1500);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  const tableName = doc.getElementById('table-name');
  const detailsChangelog = doc.getElementById('details-changelog-p');
  const detailsClone = detailsChangelog.previousElementSibling;
  env.check('installed name translated before the modal', env.hasCJK(env.text(tableName)), env.text(tableName));
  env.check(
    'details changelog line translated before the modal',
    !!detailsClone && detailsClone.getAttribute('data-wh-clone') === '1' && env.hasCJK(env.text(detailsClone)),
    detailsClone && detailsClone.outerHTML
  );
  env.check('the installed name was requested once', env.requestCount('Better Dialogs') === 1, String(env.requestCount('Better Dialogs')));
  env.check('the details changelog line was requested once', env.requestCount('Faster startup') === 1, String(env.requestCount('Faster startup')));

  const baseUnits = api.stats().units;
  const baseClones = doc.querySelectorAll('[data-wh-clone="1"]').length;

  // Open the aggregated update wizard: a portal added after the first scan.
  fixture.openUpdateWizard(doc);
  await env.wait(1000);

  const modalName = doc.getElementById('update-name-better');
  const modalName2 = doc.getElementById('update-name-taskbar');
  const updateRow = doc.querySelector('[data-testid="mod-update-row"]');
  const updateButton = doc.getElementById('update-changelog-better');
  const wizardTitle = doc.querySelector('[data-testid="mod-updates-modal"] .ant-modal-title');
  const headerTexts = Array.from(doc.querySelectorAll('[data-testid="mod-updates-modal"] [role="columnheader"]')).map((el) => env.text(el));

  env.check('update table name translated under the name scope', env.hasCJK(env.text(modalName)), env.text(modalName));
  env.check(
    'update table name swaps a text node, not the div',
    modalName.tagName === 'DIV' && modalName.childNodes.length === 1 && modalName.firstChild.nodeType === 3,
    modalName.outerHTML
  );
  env.check('update table name is a swap unit', modalName.getAttribute('data-wh-swapped') === '1', modalName.outerHTML);
  env.check('the second update table name is translated', env.hasCJK(env.text(modalName2)), env.text(modalName2));
  env.check('the update row is never cloned', !updateRow.querySelector('[data-wh-clone="1"]'), updateRow.outerHTML.slice(0, 300));
  env.check('the update row keeps its checkbox', !!updateRow.querySelector('input[data-testid="mod-update-include"]'));
  env.check(
    'the update row keeps its button and label',
    updateButton.tagName === 'BUTTON' && env.text(updateButton) === 'Changelog',
    updateButton.outerHTML
  );
  env.check(
    'the changelog button claims no unit and is not swapped',
    !updateButton.hasAttribute('data-wh-unit') && !updateButton.hasAttribute('data-wh-swapped'),
    updateButton.outerHTML
  );
  env.check('installed version stays verbatim', env.text(doc.getElementById('update-installed-better')) === '1.0.0', env.text(doc.getElementById('update-installed-better')));
  env.check('new version stays verbatim', env.text(doc.getElementById('update-new-better')) === '1.1', env.text(doc.getElementById('update-new-better')));
  env.check(
    'the update wizard title is app text, not translated',
    env.text(wizardTitle) === 'Update mods' && !wizardTitle.hasAttribute('data-wh-unit'),
    env.text(wizardTitle)
  );
  env.check(
    'the update table headers are app text, not translated',
    headerTexts.indexOf('Mod') !== -1 && headerTexts.indexOf('Installed') !== -1 && headerTexts.indexOf('New') !== -1,
    headerTexts.join(' | ')
  );
  env.check(
    'the update table name reuses the installed translation',
    env.requestCount('Better Dialogs') === 1,
    String(env.requestCount('Better Dialogs'))
  );
  env.check('the second table name was requested once', env.requestCount('Taskbar Clock') === 1, String(env.requestCount('Taskbar Clock')));
  env.check(
    'the changelog button issued no request',
    !allRequests(env).some((text) => text.indexOf('Changelog') !== -1),
    allRequests(env).join(' | ')
  );

  // Open the changelog dialog: the markdown body is a separate portal surface.
  fixture.openChangelogDialog(doc);
  await env.wait(1200);

  const dialogTitle = doc.getElementById('update-dialog-title');
  const heading = doc.getElementById('changelog-heading');
  const heading2 = doc.getElementById('changelog-heading2');
  const heading2Clone = heading2.previousElementSibling;
  const changelogP = doc.getElementById('changelog-p');
  const changelogPClone = changelogP.previousElementSibling;
  const changelogLi = doc.getElementById('changelog-li');
  const changelogLiClone = changelogLi.previousElementSibling;
  const changelogOld = doc.getElementById('changelog-old');
  const changelogOldClone = changelogOld.previousElementSibling;
  const changelogContent = doc.querySelector('[data-testid="mod-update-changelog-content"]');
  const changesDiff = doc.getElementById('changes-diff');
  const openUnits = api.stats().units;

  env.check(
    'the changelog dialog title uses the name scope',
    env.hasCJK(env.text(dialogTitle)) && env.requestCount('Better Dialogs') === 1,
    env.text(dialogTitle) + ' requests=' + env.requestCount('Better Dialogs')
  );
  env.check('version/date heading is untouched', env.text(heading) === '2.1.1 (Oct 30, 2026)', env.text(heading));
  env.check(
    'the pure version/date heading gets no clone and no request',
    (!heading.previousElementSibling || heading.previousElementSibling.getAttribute('data-wh-clone') !== '1') &&
      env.requestCount('2.1.1 (Oct 30, 2026)') === 0,
    heading.outerHTML
  );
  env.check(
    'the version/date heading with prose is translated',
    !!heading2Clone && heading2Clone.getAttribute('data-wh-clone') === '1' && env.hasCJK(env.text(heading2Clone)),
    heading2Clone && heading2Clone.outerHTML
  );
  env.check(
    'the translated heading keeps the version and date',
    !!heading2Clone &&
      env.text(heading2Clone).indexOf('2.1.1') !== -1 &&
      env.text(heading2Clone).indexOf('Oct 30, 2026') !== -1,
    heading2Clone && env.text(heading2Clone)
  );
  env.check(
    'the date link survives inside the translated heading',
    !!heading2Clone &&
      !!heading2Clone.querySelector('a') &&
      env.text(heading2Clone.querySelector('a')) === 'Oct 30, 2026' &&
      heading2Clone.querySelector('a').getAttribute('href') ===
        'https://github.com/ramensoftware/windhawk-mods/blob/main/mods/better-dialogs.wh.cpp',
    heading2Clone && heading2Clone.outerHTML
  );
  env.check(
    'the heading request carries the version and date as placeholders',
    allRequests(env).some(
      (text) =>
        text.indexOf('Performance improvements') !== -1 &&
        text.indexOf('{{0}}') !== -1 &&
        text.indexOf('<1>{{2}}</1>') !== -1
    ),
    allRequests(env).join(' | ')
  );
  env.check(
    'version and date tokens are never sent to the provider',
    !allRequests(env).some((text) => text.indexOf('Oct 30, 2026') !== -1 || text.indexOf('2.1.1') !== -1),
    allRequests(env).join(' | ')
  );
  env.check(
    'changelog paragraph cloned and translated',
    !!changelogPClone && changelogPClone.getAttribute('data-wh-clone') === '1' && env.hasCJK(env.text(changelogPClone)),
    changelogPClone && changelogPClone.outerHTML
  );
  env.check(
    'inline code survives in the paragraph clone',
    !!changelogPClone && !!changelogPClone.querySelector('code') && changelogPClone.querySelector('code').textContent === 'Taskbar',
    changelogPClone && changelogPClone.outerHTML
  );
  env.check(
    'changelog list item cloned and translated',
    !!changelogLiClone && changelogLiClone.getAttribute('data-wh-clone') === '1' && env.hasCJK(env.text(changelogLiClone)),
    changelogLiClone && changelogLiClone.outerHTML
  );
  env.check(
    'older entries markdown cloned and translated',
    !!changelogOldClone && changelogOldClone.getAttribute('data-wh-clone') === '1' && env.hasCJK(env.text(changelogOldClone)),
    changelogOldClone && changelogOldClone.outerHTML
  );
  env.check(
    'a changelog line already seen on the details page is not requested again',
    env.requestCount('Faster startup') === 1,
    String(env.requestCount('Faster startup'))
  );
  env.check(
    'the changelog body was requested once',
    env.requestCount('This release fixes {{0}} issues.') === 1,
    String(env.requestCount('This release fixes {{0}} issues.'))
  );
  env.check(
    'the changes diff tab is not translated',
    env.text(changesDiff) === 'Old source line' && !changesDiff.hasAttribute('data-wh-unit'),
    changesDiff.outerHTML
  );
  env.check(
    'each changelog prose block is cloned exactly once',
    changelogContent.querySelectorAll('[data-wh-clone="1"]').length === 5 &&
      changelogContent.querySelectorAll('[data-wh-orig="1"]').length === 5,
    changelogContent.querySelectorAll('[data-wh-clone="1"]').length + ' clones, ' +
      changelogContent.querySelectorAll('[data-wh-orig="1"]').length + ' hosts'
  );

  // Close both portals: their units must be dropped, not left behind.
  const removedName = modalName;
  fixture.closeChangelogDialog(doc);
  fixture.closeUpdateWizard(doc);
  await env.wait(1000);

  env.check('closing the modals drops their units', api.stats().units === baseUnits, baseUnits + ' -> ' + api.stats().units);
  env.check(
    'closing the modals leaves no clones behind',
    doc.querySelectorAll('[data-wh-clone="1"]').length === baseClones,
    baseClones + ' -> ' + doc.querySelectorAll('[data-wh-clone="1"]').length
  );
  env.check(
    'a removed name host is unmarked',
    !removedName.isConnected &&
      !removedName.hasAttribute('data-wh-unit') &&
      !removedName.hasAttribute('data-wh-swapped'),
    removedName.outerHTML
  );
  env.check('no changelog content remains in the document', !doc.querySelector('[data-testid="mod-update-changelog-content"]'));

  // The single-mod run modal is reached from the changelog dialog, but it must
  // translate on its own: both the wizard and the dialog are closed here.
  env.check(
    'the run modal opens with the wizard and dialog closed',
    !doc.querySelector('[data-testid="mod-updates-modal"]') &&
      !doc.querySelector('[data-testid="mod-update-details-modal"]')
  );
  const runBaseUnits = api.stats().units;
  const runBaseClones = doc.querySelectorAll('[data-wh-clone="1"]').length;
  fixture.openUpdateRunModal(doc, 'Better Dialogs', 'running');
  await env.wait(900);

  const runModal = doc.querySelector('[data-testid="mod-update-run-modal"]');
  const runTitle = doc.getElementById('update-run-title');
  env.check(
    'the run modal title is translated with the wizard and dialog closed',
    !!runTitle && env.hasCJK(env.text(runTitle)),
    runTitle && env.text(runTitle)
  );
  env.check(
    'the run modal title carries a swap unit',
    !!runTitle &&
      runTitle.getAttribute('data-wh-swapped') === '1' &&
      runTitle.hasAttribute('data-wh-unit'),
    runTitle && runTitle.outerHTML
  );
  env.check(
    'opening the run modal adds exactly one unit',
    api.stats().units === runBaseUnits + 1,
    runBaseUnits + ' -> ' + api.stats().units
  );
  env.check(
    'a name is never cloned: the run modal adds no clone',
    doc.querySelectorAll('[data-wh-clone="1"]').length === runBaseClones,
    runBaseClones + ' -> ' + doc.querySelectorAll('[data-wh-clone="1"]').length
  );
  env.check(
    'the run modal title reuses the known translation, no second request',
    env.requestCount('Better Dialogs') === 1,
    String(env.requestCount('Better Dialogs'))
  );

  // React flips the run state on the same wrapper; the title must stay.
  runModal.setAttribute('data-status', 'updated');
  await env.wait(300);
  env.check(
    'the run modal title stays translated when the run finishes',
    env.hasCJK(env.text(runTitle)) && runTitle.getAttribute('data-wh-swapped') === '1',
    runTitle && runTitle.outerHTML
  );
  env.check(
    'finishing the run issues no request',
    env.requestCount('Better Dialogs') === 1,
    String(env.requestCount('Better Dialogs'))
  );

  // React may replace the title's text node on a re-render.
  runTitle.textContent = 'Better Dialogs';
  await env.wait(900);
  env.check(
    'a rebuilt title text node is translated again',
    env.hasCJK(env.text(runTitle)) && runTitle.getAttribute('data-wh-swapped') === '1',
    runTitle && runTitle.outerHTML
  );
  env.check(
    'a rebuilt title keeps the same single unit',
    api.stats().units === runBaseUnits + 1,
    runBaseUnits + ' -> ' + api.stats().units
  );
  env.check(
    'a rebuilt title issues no request',
    env.requestCount('Better Dialogs') === 1,
    String(env.requestCount('Better Dialogs'))
  );

  fixture.closeUpdateRunModal(doc);
  await env.wait(900);
  env.check('closing the run modal removes its title', !doc.getElementById('update-run-title'));
  env.check(
    'closing the run modal drops its unit',
    api.stats().units === runBaseUnits,
    runBaseUnits + ' -> ' + api.stats().units
  );
  env.check(
    'the retained run title element is unmarked',
    !runTitle.hasAttribute('data-wh-unit') && !runTitle.hasAttribute('data-wh-swapped'),
    runTitle.outerHTML
  );
  env.check(
    'closing the run modal leaves no clone behind',
    doc.querySelectorAll('[data-wh-clone="1"]').length === runBaseClones,
    runBaseClones + ' -> ' + doc.querySelectorAll('[data-wh-clone="1"]').length
  );
  env.check('no engine problems after the run modal', env.problems.length === 0, env.problems.join(' | '));

  // Reopen both portals: the same strings come from the session registry.
  fixture.openUpdateWizard(doc);
  await env.wait(900);
  fixture.openChangelogDialog(doc);
  await env.wait(1200);

  const reopenedContent = doc.querySelector('[data-testid="mod-update-changelog-content"]');
  const reopenedHeading2 = doc.getElementById('changelog-heading2');
  env.check(
    'reopening translates the update table name again',
    env.hasCJK(env.text(doc.getElementById('update-name-better'))),
    env.text(doc.getElementById('update-name-better'))
  );
  env.check(
    'reopening translates the changelog again',
    !!reopenedHeading2.previousElementSibling && env.hasCJK(env.text(reopenedHeading2.previousElementSibling)),
    reopenedHeading2.previousElementSibling && env.text(reopenedHeading2.previousElementSibling)
  );
  env.check(
    'reopening reuses the name translation',
    env.requestCount('Better Dialogs') === 1,
    String(env.requestCount('Better Dialogs'))
  );
  env.check(
    'reopening reuses the changelog translation',
    env.requestCount('This release fixes {{0}} issues.') === 1,
    String(env.requestCount('This release fixes {{0}} issues.'))
  );
  env.check(
    'reopening restores the same unit count',
    api.stats().units === openUnits,
    openUnits + ' -> ' + api.stats().units
  );
  env.check(
    'reopening does not duplicate changelog clones',
    reopenedContent.querySelectorAll('[data-wh-clone="1"]').length === 5,
    String(reopenedContent.querySelectorAll('[data-wh-clone="1"]').length)
  );
  env.check(
    'reopening keeps the version/date heading intact',
    env.text(doc.getElementById('changelog-heading')) === '2.1.1 (Oct 30, 2026)',
    env.text(doc.getElementById('changelog-heading'))
  );
  env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));
  env.report();
  env.window.close();

  // Both scopes off: the new surfaces stay English and issue no requests.
  const offEnv = mount(JSDOM, {
    html: fixture.updateSurfaces(),
    settings: { scopeModName: false, scopeChangelog: false }
  });
  await offEnv.wait(1400);
  fixture.openUpdateWizard(offEnv.doc);
  fixture.openChangelogDialog(offEnv.doc);
  await offEnv.wait(1200);

  offEnv.check(
    'name scope off leaves the update table names English',
    offEnv.text(offEnv.doc.getElementById('update-name-better')) === 'Better Dialogs' &&
      offEnv.text(offEnv.doc.getElementById('update-name-taskbar')) === 'Taskbar Clock',
    offEnv.text(offEnv.doc.getElementById('update-name-better')) + ' / ' + offEnv.text(offEnv.doc.getElementById('update-name-taskbar'))
  );
  offEnv.check(
    'changelog scope off leaves the dialog markdown English',
    offEnv.text(offEnv.doc.getElementById('changelog-p')) === 'This release fixes Taskbar issues.' &&
      !offEnv.doc.querySelector('[data-testid="mod-update-changelog-content"] [data-wh-clone="1"]'),
    offEnv.text(offEnv.doc.getElementById('changelog-p'))
  );
  offEnv.check(
    'both scopes off issue no requests for the new surfaces',
    offEnv.requestCount('Better Dialogs') === 0 &&
      offEnv.requestCount('Taskbar Clock') === 0 &&
      offEnv.requestCount('This release fixes {{0}} issues.') === 0,
    allRequests(offEnv).join(' | ')
  );
  offEnv.check('no engine problems with both scopes off', offEnv.problems.length === 0, offEnv.problems.join(' | '));
  offEnv.report();
  offEnv.window.close();

  return counts(env, offEnv);
}

// ---------------------------------------------------------------------------
// detached: a reply that lands while its host is out of the document
// ---------------------------------------------------------------------------

// Emit an Edge reply for a request the test held back: one translation per
// text, in request order.
function emitEdgeReply(env, record, texts) {
  const body = JSON.stringify(texts.map((text) => ({ translations: [{ text: text }] })));
  env.emit(TAG + SEP + 'http' + SEP + record.id + SEP + '200' + SEP + '0' + SEP + body);
}

// Yield to the reply's promise chain without running a timer, so the host can
// stay out of the document while completeEntry processes its reply.
async function drainMicrotasks(turns) {
  for (let i = 0; i < (turns || 40); i++) await Promise.resolve();
}

// A cold name is requested, its modal is removed before the reply is delivered,
// the reply is processed while the title is detached, and the same element is
// put back. The next scan must re-serialize the title and consume the completed
// translation from the session registry: translated, no second request, no
// error. A multi-part unit (a long title with an inline span, split into two
// source parts) must be invalidated as a whole the same way.
async function detachedReplyCase() {
  let holdNext = false;
  const held = [];
  const env = mount(JSDOM, {
    html: fixture.updateSurfaces(),
    respond: (record) => {
      if (!holdNext) return null;
      holdNext = false;
      held.push(record);
      return { drop: true };
    }
  });
  const { doc } = env;
  await env.wait(1400);

  const api = env.api();
  env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

  // Single part: the run modal title is the only new name on screen.
  holdNext = true;
  fixture.openUpdateRunModal(doc, 'Cold Run Name', 'running');
  const slot = doc.getElementById('update-run-slot');
  const root = doc.getElementById('update-run-root');
  const title = doc.getElementById('update-run-title');
  const requested = await env.waitFor(() => held.length === 1, 3000);
  env.check('detached reply: the cold name is requested', requested, JSON.stringify(allRequests(env)));
  const record = held[0] || { id: '0' };
  const replyTexts = edgeTexts(record).map(defaultTranslate);

  // Remove the modal, then deliver and process the reply while it is away.
  root.remove();
  env.check('detached reply: the title is out of the document', !title.isConnected);
  emitEdgeReply(env, record, replyTexts);
  await drainMicrotasks(40);
  env.check(
    'detached reply: the reply is processed while the host is away',
    !title.isConnected && !env.hasCJK(env.text(title)),
    title.isConnected + ': ' + env.text(title)
  );

  // React mounts the same element again; the scan must render from the registry.
  slot.appendChild(root);
  const rendered = await env.waitFor(
    () => title.isConnected && env.hasCJK(env.text(title)) && title.getAttribute('data-wh-swapped') === '1',
    3000
  );
  env.check('detached reply: the reattached name is translated', rendered, env.text(title));
  env.check('detached reply: the reattached name keeps its unit', !!title.getAttribute('data-wh-unit'), title.outerHTML);
  env.check(
    'detached reply: the reattached name reuses the reply without a request',
    env.requestCount('Cold Run Name') === 1,
    String(env.requestCount('Cold Run Name'))
  );

  // Multi-part: a title long enough to split into two source parts, with an
  // inline span in the second half.
  const longA = 'Cold multipart opening sentence. '.repeat(25);
  const longB = 'Cold multipart closing sentence. '.repeat(25);
  held.length = 0;
  holdNext = true;
  fixture.openUpdateRunModal(doc, longA + '<span>' + longB + '</span>', 'running');
  const multiRoot = doc.getElementById('update-run-root');
  const multiTitle = doc.getElementById('update-run-title');
  const multiRequested = await env.waitFor(() => held.length === 1, 3000);
  const multiRecord = held[0] || { id: '0' };
  const multiParts = edgeTexts(multiRecord);
  env.check(
    'detached reply: the multi-part title is split into parts',
    multiRequested && multiParts.length >= 2,
    String(multiParts.length)
  );
  const multiReplyTexts = multiParts.map(defaultTranslate);

  multiRoot.remove();
  env.check(
    'detached reply: the multi-part title is out of the document',
    !multiTitle.isConnected && !!multiTitle.querySelector('span')
  );
  emitEdgeReply(env, multiRecord, multiReplyTexts);
  await drainMicrotasks(40);
  env.check(
    'detached reply: the multi-part reply is processed while the host is away',
    !multiTitle.isConnected && !env.hasCJK(env.text(multiTitle)),
    env.text(multiTitle)
  );

  slot.appendChild(multiRoot);
  const multiRendered = await env.waitFor(
    () =>
      multiTitle.isConnected &&
      env.hasCJK(env.text(multiTitle)) &&
      multiTitle.getAttribute('data-wh-swapped') === '1',
    3000
  );
  env.check('detached reply: the reattached multi-part title is translated', multiRendered, env.text(multiTitle));
  env.check(
    'detached reply: the multi-part title keeps its inline span',
    !!multiTitle.querySelector('span') && env.hasCJK(env.text(multiTitle.querySelector('span'))),
    multiTitle.innerHTML.slice(0, 200)
  );
  env.check(
    'detached reply: every multi-part piece reuses the reply without a request',
    multiParts.every((text) => env.requestCount(text) === 1),
    multiParts.map((text) => env.requestCount(text)).join(',')
  );
  env.check('detached reply: no engine problems', env.problems.length === 0, env.problems.join(' | '));
  env.report();
  env.window.close();

  return counts(env);
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
const CASES = [
  ['coverage: names, summaries, settings and select values', coverageCase],
  ['modcard: the real explore tile name unit', modCardCase],
  ['select: antd 6 closed select hosts', selectCase],
  ['title: settings title units', titleCase],
  ['consistency: one source, one translation', consistencyCase],
  ['llm: OpenAI-compatible provider', llmCase],
  ['cache: mod-owned cache through the channel', cacheCase],
  ['teardown: restore and silence', teardownCase],
  ['claim: claim rules and hidden copies', claimCase],
  ['updates: update wizard and changelog dialog', updateSurfacesCase],
  ['detached: a reply that lands while its host is out of the document', detachedReplyCase],
  ['gesture: two-finger double tap and shortcut cycles', gestureCase]
];

const totals = { checks: 0, failures: 0 };

for (const [name, run] of CASES) {
  console.log('\n== ' + name + ' ==');
  const result = await run();
  totals.checks += result.checks;
  totals.failures += result.failures;
  console.log('-- ' + name + ': ' + (result.checks - result.failures) + '/' + result.checks + ' checks passed');
}

const passed = totals.checks - totals.failures;
console.log('\n' + totals.checks + ' checks, ' + passed + ' passed, ' + totals.failures + ' failed');
process.exit(totals.failures ? 1 : 0);
