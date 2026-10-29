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
const { mount, fixture, defaultTranslate } = await import('./jsdom-harness.mjs');

const allRequests = (env) => env.requests.reduce((all, batch) => all.concat(batch), []);
const exactCount = (texts, value) => texts.filter((text) => text === value).length;
const combines = (texts, a, b) =>
  texts.some((text) => text.indexOf(a) !== -1 && text.indexOf(b) !== -1);
const hasBoth = combines;
const counts = (...envs) => ({
  checks: envs.reduce((n, env) => n + env.checks, 0),
  failures: envs.reduce((n, env) => n + env.failures.length, 0)
});

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
  env.report();
  env.window.close();

  // Debug diagnostic: rejected select hosts report why, and stay silent when
  // debug is off.
  const debugEnv = mount(JSDOM, { html: fixture.debugSelects(), settings: { debug: true } });
  await debugEnv.wait(1200);
  const debugLog = debugEnv.logs.join('\n');
  debugEnv.check('debug logs already-claimed select host', debugLog.indexOf('select host rejected (already claimed)') !== -1);
  debugEnv.check('debug logs denied-ancestor select host', debugLog.indexOf('select host rejected (denied ancestor)') !== -1);
  debugEnv.check('debug logs no-text select host', debugLog.indexOf('select host rejected (no direct text)') !== -1);
  debugEnv.report();
  debugEnv.window.close();

  const quietEnv = mount(JSDOM, { html: fixture.antd6Selects(), settings: { debug: false } });
  await quietEnv.wait(1200);
  const quietLog = quietEnv.logs.join('\n');
  quietEnv.check('debug off logs nothing', quietEnv.logs.length === 0, quietLog.slice(0, 200));
  quietEnv.check('debug off still translates the select', quietEnv.hasCJK(quietEnv.text(quietEnv.doc.getElementById('real-content'))), quietEnv.text(quietEnv.doc.getElementById('real-content')));
  quietEnv.report();
  quietEnv.window.close();

  return counts(env, debugEnv, quietEnv);
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

  // Debug diagnosis: a compact title whose description host is nested inside
  // it is claimed by the title itself now. The dump must report the title as
  // claimed with no nested claimant, show its skeleton, and stay within six
  // lines per scan. The hidden copy is an atomic placeholder, not a unit.
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
  debugEnv.check('debug dump shows the title host skeleton', /skeleton=h4\.windhawk-row-meta-title/.test(debugLog), debugRow);
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
  debugEnv.report();
  debugEnv.window.close();

  // Cache version: a v1 entry is purged rather than reused, and v2 keys are
  // built from the normalised string.
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
  const v1Keys = cacheKeys.filter((key) => key.indexOf('whtr1|') === 0 && key.indexOf('whtr1|v3|') !== 0);
  const v3Keys = cacheKeys.filter((key) => key.indexOf('whtr1|v3|') === 0);
  const cacheValue = cacheEnv.text(cacheEnv.doc.getElementById('real-content'));

  cacheEnv.check('v1 cache entries are purged', v1Keys.length === 0, v1Keys.join(' | '));
  cacheEnv.check('v3 cache entries are written', v3Keys.length > 0, String(v3Keys.length));
  cacheEnv.check('v1 translation is not reused', cacheValue.indexOf('OLD-V1') === -1, cacheValue);
  cacheEnv.check(
    'normalised key is the one written',
    v3Keys.some((key) => key === 'whtr1|v3|edge||zh-Hans|' + hash32(plain) + '|' + plain.length),
    v3Keys.join(' | ')
  );
  cacheEnv.check(
    'raw-whitespace key is not written',
    v3Keys.every((key) => key !== 'whtr1|v3|edge||zh-Hans|' + hash32(raw) + '|' + raw.length),
    v3Keys.join(' | ')
  );
  cacheEnv.report();
  cacheEnv.window.close();

  return counts(env, debugEnv, cacheEnv);
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
  const request = requests[0] || { url: '', headers: [], body: '{}' };
  env.check(
    'llm: base URL ending in /v1 joins without a doubled slash',
    request.url === 'https://llm.local/v1/chat/completions',
    request.url
  );
  env.check(
    'llm: the page never adds Authorization',
    request.headers.every((pair) => String(pair[0]).toLowerCase() !== 'authorization'),
    JSON.stringify(request.headers)
  );
  env.check(
    'llm: request carries JSON content type',
    request.headers.some((pair) => String(pair[0]).toLowerCase() === 'content-type' && pair[1] === 'application/json'),
    JSON.stringify(request.headers)
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
  // and a model change is a miss.
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
  const cacheKeys = () => {
    const ls = cacheEnv.window.localStorage;
    const out = [];
    for (let i = 0; i < ls.length; i++) out.push(ls.key(i));
    return out;
  };
  await cacheEnv.wait(1400);
  const edgeKeys = cacheKeys().filter((key) => key.indexOf('whtr1|v3|edge|') === 0);
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
    cacheKeys().some((key) => key.indexOf('whtr1|v3|llm|model-a|') === 0),
    cacheKeys().join(' | ')
  );
  cacheEnv.check(
    'llm cache: Edge key stays separate',
    cacheKeys().some((key) => key.indexOf('whtr1|v3|edge|') === 0),
    cacheKeys().join(' | ')
  );

  cacheEnv.pushSettings(Object.assign({}, cacheEnv.settings, { llmModel: 'model-b' }));
  await cacheEnv.wait(1400);
  const afterB = cacheEnv.text(cacheEnv.doc.getElementById('tile-name'));
  cacheEnv.check('llm cache: a model change misses the cache', afterB.indexOf('Lmodel-b:') === 0, afterB);
  cacheEnv.check(
    'llm cache: model-b key is written',
    cacheKeys().some((key) => key.indexOf('whtr1|v3|llm|model-b|') === 0),
    cacheKeys().join(' | ')
  );
  cacheEnv.check(
    'llm cache: the model-a key is kept',
    cacheKeys().some((key) => key.indexOf('whtr1|v3|llm|model-a|') === 0),
    cacheKeys().join(' | ')
  );
  cacheEnv.check('llm cache: no engine problems', cacheEnv.problems.length === 0, cacheEnv.problems.join(' | '));
  cacheEnv.report();
  cacheEnv.window.close();

  return counts(env, dedupe, bare, segmentCap, charCap, missing, empty, failing, slow, autoNone, autoKey, google, cacheEnv);
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
// Runner
// ---------------------------------------------------------------------------
const CASES = [
  ['coverage: names, summaries, settings and select values', coverageCase],
  ['modcard: the real explore tile name unit', modCardCase],
  ['select: antd 6 closed select hosts', selectCase],
  ['title: settings title units', titleCase],
  ['consistency: one source, one translation', consistencyCase],
  ['llm: OpenAI-compatible provider', llmCase],
  ['claim: claim rules and hidden copies', claimCase],
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
