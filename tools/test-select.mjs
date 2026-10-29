/**
 * Suite for the closed select hosts in src/js/engine.js, against the antd 6
 * structure Windhawk 2.0.0-alpha.8 actually renders (verified from the app's
 * cached bundle and antd 6.6.8 / @rc-component/select 1.10.1):
 *
 *   .ant-select.ant-select-single
 *     .ant-select-content[title]        <- value text node, placeholder div
 *       input.ant-select-input[role=combobox]
 *
 * plus the multiple/tags `.ant-select-selection-item` shape and the
 * `.ant-select-content-value` wrapper antd uses for styled options.
 *
 * jsdom is not a dependency of this repository. Run it from a directory that
 * has jsdom installed, or point WHTR_JSDOM at that directory's package.json:
 *
 *   WHTR_JSDOM=C:/path/to/jsdom-project/package.json bun tools/test-select.mjs
 */

import { createRequire } from 'node:module';

const require = createRequire(process.env.WHTR_JSDOM || import.meta.url);
const { JSDOM } = require('jsdom');
const { mount, fixture } = await import('./jsdom-harness.mjs');

const env = mount(JSDOM, { html: fixture.antd6Selects() });
const { doc } = env;

await env.wait(1600);

const api = env.api();
env.check('engine up', !!api && api.stats().settingsSeen, JSON.stringify(api && api.stats()));

// ---------------------------------------------------------------------------
// 1. antd 6 single select: value as a direct text node in .ant-select-content.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 2. Label one level deeper: .ant-select-content-value wrapper with a title.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 3. Placeholder: .ant-select-placeholder div inside the same content slot.
// ---------------------------------------------------------------------------
const placeholderContent = doc.getElementById('placeholder-content');
const placeholder = doc.getElementById('real-placeholder');
const placeholderInput = doc.getElementById('placeholder-input');
env.check('select placeholder translated', env.hasCJK(env.text(placeholder)), env.text(placeholder));
env.check('placeholder content host claimed', !!placeholderContent.getAttribute('data-wh-unit'), placeholderContent.getAttribute('data-wh-unit'));
env.check('placeholder keeps its div', placeholder.tagName === 'DIV' && placeholder.isConnected);
env.check('placeholder input value untouched', placeholderInput.value === '', JSON.stringify(placeholderInput.value));
env.check('placeholder input claims no unit', !placeholderInput.hasAttribute('data-wh-unit'));

// ---------------------------------------------------------------------------
// 4. Multiple/tags shape: .ant-select-selection-item with an inner span.
// ---------------------------------------------------------------------------
const multiItem = doc.getElementById('multi-item');
const multiItemContent = doc.getElementById('multi-item-content');
const multiInput = doc.getElementById('multi-input');
env.check('multiple selection item translated', env.hasCJK(env.text(multiItem)), env.text(multiItem));
env.check('multiple selection item keeps its span', multiItemContent.tagName === 'SPAN' && multiItemContent.isConnected);
env.check('multiple selection item keeps its title', multiItem.getAttribute('title') === 'Where the mouse cursor is');
env.check('multiple input value untouched', multiInput.value === '', JSON.stringify(multiInput.value));
env.check('multiple input claims no unit', !multiInput.hasAttribute('data-wh-unit'));

// ---------------------------------------------------------------------------
// 5. Opening the dropdown must not translate the closed value a second time.
// ---------------------------------------------------------------------------
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
  'same string requested once for the value and once for the option',
  env.requestCount('Where the mouse cursor is') === requestsBefore + 1,
  requestsBefore + ' -> ' + env.requestCount('Where the mouse cursor is')
);
const option = doc.querySelector('#select-dropdown-real .ant-select-item-option-content');
env.check('dropdown option translated', env.hasCJK(env.text(option)), env.text(option));

env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));

const failures = env.report();
env.window.close();

// ---------------------------------------------------------------------------
// 6. Debug diagnostic: rejected select hosts report why, and stay silent when
//    debug is off.
// ---------------------------------------------------------------------------
const debugEnv = mount(JSDOM, { html: fixture.debugSelects(), settings: { debug: true } });
await debugEnv.wait(1200);
const debugLog = debugEnv.logs.join('\n');
debugEnv.check('debug logs already-claimed select host', debugLog.indexOf('select host rejected (already claimed)') !== -1);
debugEnv.check('debug logs denied-ancestor select host', debugLog.indexOf('select host rejected (denied ancestor)') !== -1);
debugEnv.check('debug logs no-text select host', debugLog.indexOf('select host rejected (no direct text)') !== -1);
const debugFailures = debugEnv.report();
debugEnv.window.close();

const quietEnv = mount(JSDOM, { html: fixture.antd6Selects(), settings: { debug: false } });
await quietEnv.wait(1200);
const quietLog = quietEnv.logs.join('\n');
quietEnv.check('debug off logs nothing', quietEnv.logs.length === 0, quietLog.slice(0, 200));
quietEnv.check('debug off still translates the select', quietEnv.hasCJK(quietEnv.text(quietEnv.doc.getElementById('real-content'))), quietEnv.text(quietEnv.doc.getElementById('real-content')));
const quietFailures = quietEnv.report();
quietEnv.window.close();

process.exit(failures + debugFailures + quietFailures ? 1 : 0);
