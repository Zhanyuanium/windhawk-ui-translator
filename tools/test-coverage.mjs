/**
 * Coverage suite for the mod-name / mod-summary / compact-settings / select
 * value rules in src/js/engine.js.
 *
 * jsdom is not a dependency of this repository. Run it from a directory that
 * has jsdom installed, or point WHTR_JSDOM at that directory's package.json:
 *
 *   WHTR_JSDOM=C:/path/to/jsdom-project/package.json bun tools/test-coverage.mjs
 *
 * The fixtures and the stub channel live in tools/jsdom-harness.mjs.
 */

import { createRequire } from 'node:module';

const require = createRequire(process.env.WHTR_JSDOM || import.meta.url);
const { JSDOM } = require('jsdom');
const { mount, fixture } = await import('./jsdom-harness.mjs');

const env = mount(JSDOM, { html: fixture.all() });
const { doc } = env;

await env.wait(1600);

const api = env.api();
env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

// ---------------------------------------------------------------------------
// 1. Mod names: tile grid, table view and details header follow one rule.
// ---------------------------------------------------------------------------
const tileName = doc.getElementById('tile-name');
env.check('tile grid name translated', env.hasCJK(env.text(tileName)), env.text(tileName));
env.check('tile grid name marked swapped', tileName.getAttribute('data-wh-swapped') === '1');

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

// ---------------------------------------------------------------------------
// 2. Mod summaries: tile grid, table description cell and details header.
// ---------------------------------------------------------------------------
const tileDesc = doc.getElementById('tile-desc');
const tableDesc = doc.getElementById('table-desc');
const detailsDesc = doc.getElementById('details-desc');
env.check('tile grid summary translated', env.hasCJK(env.text(tileDesc)), env.text(tileDesc));
env.check('table description translated', env.hasCJK(env.text(tableDesc)), env.text(tableDesc));
env.check('details header summary translated', env.hasCJK(env.text(detailsDesc)), env.text(detailsDesc));

// ---------------------------------------------------------------------------
// 3. Compact settings: title in nested spans, inline description, info button.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 4. Select values: the closed control's value and placeholder, never inputs.
// ---------------------------------------------------------------------------
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

// Opening the dropdown must not translate the closed value a second time.
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

// ---------------------------------------------------------------------------
// 5. Scope settings: missing scopeList means both new scopes are on; the old
//    key still drives both when a pre-split payload arrives.
// ---------------------------------------------------------------------------
const base = Object.assign({}, env.settings);

function withoutNewScopes(payload) {
  const next = Object.assign({}, payload);
  delete next.scopeModName;
  delete next.scopeModSummary;
  return next;
}

// Missing scopeList and missing new keys: both true.
env.pushSettings(withoutNewScopes(base));
await env.wait(500);
env.check('missing scopeList enables names', env.hasCJK(env.text(doc.getElementById('tile-name'))), env.text(doc.getElementById('tile-name')));
env.check('missing scopeList enables summaries', env.hasCJK(env.text(doc.getElementById('tile-desc'))), env.text(doc.getElementById('tile-desc')));

// Legacy scopeList:false: both off.
const legacyOff = withoutNewScopes(base);
legacyOff.scopeList = false;
env.pushSettings(legacyOff);
await env.wait(500);
env.check('legacy scopeList false restores names', env.text(doc.getElementById('tile-name')) === 'Better Dialogs', env.text(doc.getElementById('tile-name')));
env.check('legacy scopeList false restores summaries', env.text(doc.getElementById('tile-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('tile-desc')));
env.check('legacy scopes leave settings titles translated', env.hasCJK(env.text(doc.getElementById('compact-title-text'))), env.text(doc.getElementById('compact-title-text')));

// Names off, summaries on.
env.pushSettings(Object.assign({}, base, { scopeModName: false, scopeModSummary: true }));
await env.wait(500);
env.check('name scope off restores names', env.text(doc.getElementById('tile-name')) === 'Better Dialogs', env.text(doc.getElementById('tile-name')));
env.check('name scope off keeps summaries', env.hasCJK(env.text(doc.getElementById('tile-desc'))), env.text(doc.getElementById('tile-desc')));
env.check('name scope off restores table name', env.text(doc.getElementById('table-name')) === 'Better Dialogs', env.text(doc.getElementById('table-name')));
env.check('name scope off restores details name', env.text(doc.getElementById('details-name')) === 'Better Dialogs', env.text(doc.getElementById('details-name')));

// Names on, summaries off.
env.pushSettings(Object.assign({}, base, { scopeModName: true, scopeModSummary: false }));
await env.wait(500);
env.check('name scope back translates names', env.hasCJK(env.text(doc.getElementById('tile-name'))), env.text(doc.getElementById('tile-name')));
env.check('summary scope off restores summaries', env.text(doc.getElementById('tile-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('tile-desc')));
env.check('summary scope off restores table description', env.text(doc.getElementById('table-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('table-desc')));
env.check('summary scope off restores details summary', env.text(doc.getElementById('details-desc')) === 'Improves Windows dialog boxes.', env.text(doc.getElementById('details-desc')));

env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));

const failures = env.report();
env.window.close();
process.exit(failures ? 1 : 0);
