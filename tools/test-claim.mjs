/**
 * Claim-rule suite for src/js/engine.js.
 *
 * (a) A compact settings row whose screen-reader description is nested inside
 *     the title host: the title translates, the hidden copy is left out of the
 *     title source entirely (no unit, no request, no placeholder), and the
 *     visible tooltip portal still translates with one shared request.
 * (b) A host whose child was claimed first: the host still swaps its own text
 *     and keeps the claimed child atomic, so neither text is translated twice.
 * (c) Cloned prose never carries the swap marker, and a mixed prose host that
 *     keeps a claimed nested unit does not clone or retranslate it.
 * (d) The running app's compact row beside its comfortable twin: both request
 *     the same two strings once and resolve to the same translations, and a
 *     title that keeps only the hidden copy gets no unit at all.
 *
 * jsdom is not a dependency of this repository. Run it from a directory that
 * has jsdom installed, or point WHTR_JSDOM at that directory's package.json:
 *
 *   WHTR_JSDOM=C:/path/to/jsdom-project/package.json bun tools/test-claim.mjs
 *
 * The fixtures and the stub channel live in tools/jsdom-harness.mjs.
 */

import { createRequire } from 'node:module';

const require = createRequire(process.env.WHTR_JSDOM || import.meta.url);
const { JSDOM } = require('jsdom');
const { mount, fixture, defaultTranslate } = await import('./jsdom-harness.mjs');

const allRequests = (env) => env.requests.reduce((all, batch) => all.concat(batch), []);
const hasBoth = (texts, a, b) =>
  texts.some((text) => text.indexOf(a) !== -1 && text.indexOf(b) !== -1);

// ---------------------------------------------------------------------------
// (a) Compact row: hidden description nested inside the title host.
// ---------------------------------------------------------------------------
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

ariaEnv.check(
  'compact aria title translated',
  ariaEnv.text(ariaTitle) === defaultTranslate('Monitor'),
  ariaEnv.text(ariaTitle)
);
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
ariaEnv.check(
  'the title request does not absorb the hidden copy',
  !hasBoth(ariaSent, 'Monitor', 'Only the windows'),
  ariaSent.join(' | ')
);
ariaEnv.check(
  'hidden aria copy is untouched',
  ariaEnv.text(ariaHidden) === ariaCopy,
  ariaEnv.text(ariaHidden)
);
ariaEnv.check(
  'hidden aria copy claims no unit',
  !ariaHidden.hasAttribute('data-wh-unit') && !ariaHidden.hasAttribute('data-wh-swapped'),
  ariaHidden.outerHTML
);
ariaEnv.check(
  'settings row is never cloned',
  !ariaHost.closest('.windhawk-row').querySelector('[data-wh-clone="1"]')
);
ariaEnv.check(
  'hidden aria copy made no request',
  ariaEnv.requestCount(ariaCopy) === 0,
  String(ariaEnv.requestCount(ariaCopy))
);

const ariaTooltip = fixture.addTooltip(ariaDoc, ariaCopy, 'aria-tooltip');
await ariaEnv.wait(800);
ariaEnv.check('tooltip copy translated', ariaEnv.hasCJK(ariaEnv.text(ariaTooltip)), ariaEnv.text(ariaTooltip));
ariaEnv.check(
  'hidden copy and tooltip share one request',
  ariaEnv.requestCount(ariaCopy) === 1,
  String(ariaEnv.requestCount(ariaCopy))
);
ariaEnv.check(
  'the tooltip does not retranslate the title',
  ariaEnv.text(ariaTitle) === defaultTranslate('Monitor'),
  ariaEnv.text(ariaTitle)
);
ariaEnv.check(
  'hidden aria copy stays untouched after the tooltip',
  ariaEnv.text(ariaHidden) === ariaCopy,
  ariaEnv.text(ariaHidden)
);
const ariaTooltip2 = fixture.addTooltip(ariaDoc, ariaCopy, 'aria-tooltip-2');
await ariaEnv.wait(600);
ariaEnv.check(
  'a second tooltip reuses the same translation',
  ariaEnv.hasCJK(ariaEnv.text(ariaTooltip2)) && ariaEnv.requestCount(ariaCopy) === 1,
  ariaEnv.text(ariaTooltip2) + ' requests=' + ariaEnv.requestCount(ariaCopy)
);
ariaEnv.check('no engine problems logged', ariaEnv.problems.length === 0, ariaEnv.problems.join(' | '));

const ariaFailures = ariaEnv.report();
ariaEnv.window.close();

// ---------------------------------------------------------------------------
// (b) Host with one claimed child and its own text.
// ---------------------------------------------------------------------------
const childEnv = mount(JSDOM, { html: fixture.titleWithClaimedChild() });
const childDoc = childEnv.doc;
await childEnv.wait(1400);

const childApi = childEnv.api();
childEnv.check('engine up', !!childApi && childApi.stats().settingsSeen, JSON.stringify(childApi && childApi.stats()));

const outerHost = childDoc.getElementById('outer-title');
const outerChild = childDoc.getElementById('outer-child');
const childSent = allRequests(childEnv);

childEnv.check(
  'host own text translated',
  childEnv.directText(outerHost) === defaultTranslate('Outer title'),
  childEnv.directText(outerHost)
);
childEnv.check(
  'host is a swap unit',
  outerHost.getAttribute('data-wh-swapped') === '1',
  outerHost.outerHTML
);
childEnv.check(
  'claimed child translated by its own unit',
  childEnv.text(outerChild) === defaultTranslate('Child value text'),
  childEnv.text(outerChild)
);
childEnv.check(
  'claimed child keeps its own unit',
  !!outerChild.getAttribute('data-wh-unit') &&
    outerChild.getAttribute('data-wh-unit') !== outerHost.getAttribute('data-wh-unit'),
  outerHost.getAttribute('data-wh-unit') + ' vs ' + outerChild.getAttribute('data-wh-unit')
);
childEnv.check(
  'claimed child stays in place',
  outerChild.parentElement === outerHost.querySelector('.ant-select'),
  outerChild.parentElement && outerChild.parentElement.outerHTML
);
childEnv.check(
  'own text requested once',
  childEnv.requestCount('Outer title') === 1,
  String(childEnv.requestCount('Outer title'))
);
childEnv.check(
  'claimed child requested once',
  childEnv.requestCount('Child value text') === 1,
  String(childEnv.requestCount('Child value text'))
);
childEnv.check(
  'no request combines the host and its child',
  !hasBoth(childSent, 'Outer title', 'Child value text'),
  childSent.join(' | ')
);
childEnv.check('no engine problems logged', childEnv.problems.length === 0, childEnv.problems.join(' | '));

const childFailures = childEnv.report();
childEnv.window.close();

// ---------------------------------------------------------------------------
// (c) Cloned prose is not swapped, and a mixed host does not clone or
//     retranslate its claimed nested unit.
// ---------------------------------------------------------------------------
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

proseEnv.check(
  'readme prose cloned',
  !!proseClone && proseClone.getAttribute('data-wh-clone') === '1',
  proseClone && proseClone.outerHTML
);
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
proseEnv.check(
  'mixed host swaps its own text',
  proseEnv.directText(mixed) === defaultTranslate('Mixed prose sentence.'),
  proseEnv.directText(mixed)
);
proseEnv.check('mixed host is a swap unit', mixed.getAttribute('data-wh-swapped') === '1');
proseEnv.check(
  'mixed host is not cloned',
  !mixed.hasAttribute('data-wh-clone') && !mixed.hasAttribute('data-wh-orig')
);
proseEnv.check(
  'nested item is still cloned',
  !!nestedClone && nestedClone.getAttribute('data-wh-clone') === '1',
  nestedClone && nestedClone.outerHTML
);
proseEnv.check('nested item translated', proseEnv.hasCJK(proseEnv.text(nestedClone)), proseEnv.text(nestedClone));
proseEnv.check('nested item host keeps its original', nested.getAttribute('data-wh-orig') === '1');

const proseSent = allRequests(proseEnv);
proseEnv.check(
  'mixed own text requested once',
  proseEnv.requestCount('Mixed prose sentence.') === 1,
  String(proseEnv.requestCount('Mixed prose sentence.'))
);
proseEnv.check(
  'nested item requested once',
  proseEnv.requestCount('Nested item.') === 1,
  String(proseEnv.requestCount('Nested item.'))
);
proseEnv.check(
  'no request combines the mixed host and its nested item',
  !hasBoth(proseSent, 'Mixed prose sentence', 'Nested item'),
  proseSent.join(' | ')
);
proseEnv.check(
  'every distinct normalised string requested once',
  new Set(proseSent).size === proseSent.length,
  proseSent.join(' | ')
);
proseEnv.check('no engine problems logged', proseEnv.problems.length === 0, proseEnv.problems.join(' | '));

const proseFailures = proseEnv.report();
proseEnv.window.close();

// ---------------------------------------------------------------------------
// (d) The running app's compact row and its comfortable twin.
// ---------------------------------------------------------------------------
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

twinEnv.check(
  'the compact title source is exactly Monitor',
  twinSent.some((text) => text === 'Monitor'),
  twinSent.join(' | ')
);
twinEnv.check(
  'no request body carries Monitor{{0}}',
  !twinSent.some((text) => text.indexOf('Monitor{{') !== -1),
  twinSent.join(' | ')
);
twinEnv.check(
  'the title request carries no description text',
  !hasBoth(twinSent, 'Monitor', 'Which monitor'),
  twinSent.join(' | ')
);
twinEnv.check(
  'exactly two distinct strings are requested for the pair',
  twinDistinct.length === 2 &&
    twinDistinct.indexOf('Monitor') !== -1 &&
    twinDistinct.indexOf(twinCopy) !== -1,
  twinDistinct.join(' | ')
);
twinEnv.check(
  'the title and its comfortable twin share one request',
  twinEnv.requestCount('Monitor') === 1,
  String(twinEnv.requestCount('Monitor'))
);
twinEnv.check(
  'the comfortable description is requested once',
  twinEnv.requestCount(twinCopy) === 1,
  String(twinEnv.requestCount(twinCopy))
);
twinEnv.check(
  'compact title and comfortable title agree',
  twinEnv.text(twinTitleText) === twinEnv.text(twinComfortableTitle) &&
    twinEnv.hasCJK(twinEnv.text(twinTitleText)),
  twinEnv.text(twinTitleText) + ' vs ' + twinEnv.text(twinComfortableTitle)
);
twinEnv.check(
  'the hidden aria copy is untouched',
  twinEnv.text(twinAria) === twinCopy &&
    !twinAria.hasAttribute('data-wh-unit') &&
    !twinAria.hasAttribute('data-wh-swapped'),
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
twinEnv.check(
  'the copy-only title is not requested',
  !twinSent.some((text) => text.indexOf('Only the windows') !== -1),
  twinSent.join(' | ')
);

const twinTooltip = fixture.addTooltip(twinDoc, twinCopy, 'twin-tooltip');
await twinEnv.wait(800);
twinEnv.check(
  'the tooltip and the comfortable description agree',
  twinEnv.text(twinTooltip) === twinEnv.text(twinComfortableDesc) &&
    twinEnv.hasCJK(twinEnv.text(twinTooltip)),
  twinEnv.text(twinTooltip) + ' vs ' + twinEnv.text(twinComfortableDesc)
);
twinEnv.check(
  'the tooltip shares the description request',
  twinEnv.requestCount(twinCopy) === 1,
  String(twinEnv.requestCount(twinCopy))
);
twinEnv.check(
  'the aria copy stays untouched after the tooltip',
  twinEnv.text(twinAria) === twinCopy,
  twinEnv.text(twinAria)
);
twinEnv.check('no engine problems logged', twinEnv.problems.length === 0, twinEnv.problems.join(' | '));

const twinFailures = twinEnv.report();
twinEnv.window.close();

process.exit(ariaFailures + childFailures + proseFailures + twinFailures ? 1 : 0);
