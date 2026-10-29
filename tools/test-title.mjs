/**
 * Settings title unit suite for src/js/engine.js.
 *
 * The running app's compact density puts the title text, the collapsed value
 * summary, the ⓘ button and the screen-reader description copy in one title
 * row. Only the title text may become the title unit:
 *
 *   - the source is exactly "Monitor" / "Animation style", identical to the
 *     comfortable twin's plain-string title;
 *   - the summary ("Non-default") and the description are requested as their
 *     own strings;
 *   - no title request carries a placeholder, a summary or description text;
 *   - the hidden screen-reader copy stays out of every request.
 *
 * jsdom is not a dependency of this repository. Run it from a directory that
 * has jsdom installed, or point WHTR_JSDOM at that directory's package.json:
 *
 *   WHTR_JSDOM=C:/path/to/jsdom-project/package.json bun tools/test-title.mjs
 *
 * The fixtures and the stub channel live in tools/jsdom-harness.mjs.
 */

import { createRequire } from 'node:module';

const require = createRequire(process.env.WHTR_JSDOM || import.meta.url);
const { JSDOM } = require('jsdom');
const { mount, fixture, defaultTranslate } = await import('./jsdom-harness.mjs');

const allRequests = (env) => env.requests.reduce((all, batch) => all.concat(batch), []);
const exactCount = (texts, value) => texts.filter((text) => text === value).length;
const combines = (texts, a, b) => texts.some((text) => text.indexOf(a) !== -1 && text.indexOf(b) !== -1);

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

// ---------------------------------------------------------------------------
// 1. The title unit is only the title text, in both densities.
// ---------------------------------------------------------------------------
env.check(
  'compact Monitor title source is exactly Monitor',
  sent.indexOf('Monitor') !== -1,
  sent.join(' | ')
);
env.check(
  'compact Animation style title source is exactly Animation style',
  sent.indexOf('Animation style') !== -1,
  sent.join(' | ')
);
env.check(
  'the comfortable Monitor twin shares the same title source',
  exactCount(sent, 'Monitor') === 1,
  String(exactCount(sent, 'Monitor'))
);
env.check(
  'the comfortable Animation style twin shares the same title source',
  exactCount(sent, 'Animation style') === 1,
  String(exactCount(sent, 'Animation style'))
);
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
env.check(
  'no request body contains Non-default{{',
  !sent.some((text) => text.indexOf('Non-default{{') !== -1),
  sent.join(' | ')
);
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
env.check(
  'every distinct string is requested once',
  new Set(sent).size === sent.length,
  sent.join(' | ')
);

// ---------------------------------------------------------------------------
// 2. The summary and the description are their own strings.
// ---------------------------------------------------------------------------
env.check(
  'the summary is requested as its own string',
  exactCount(sent, 'Non-default') === 1,
  String(exactCount(sent, 'Non-default'))
);
env.check('the compact summary translated', env.hasCJK(env.text(compactSummary)), env.text(compactSummary));
env.check('the second compact summary translated', env.hasCJK(env.text(animationSummary)), env.text(animationSummary));
env.check(
  'the comfortable description is requested as its own string',
  exactCount(sent, monitorCopy) === 1,
  String(exactCount(sent, monitorCopy))
);
env.check(
  'the animation description is requested as its own string',
  exactCount(sent, animationCopy) === 1,
  String(exactCount(sent, animationCopy))
);
env.check('the comfortable description translated', env.hasCJK(env.text(comfortableDesc)), env.text(comfortableDesc));
env.check(
  'the animation comfortable description translated',
  env.hasCJK(env.text(animationComfortableDesc)),
  env.text(animationComfortableDesc)
);
env.check(
  'a visible description element is requested as its own string',
  exactCount(sent, 'A visible setting description') === 1,
  String(exactCount(sent, 'A visible setting description'))
);
env.check(
  'the visible description element translated',
  env.hasCJK(env.text(visibleDesc)) &&
    visibleDesc.getAttribute('data-wh-unit') !== null,
  visibleDesc.outerHTML
);
env.check(
  'the visible description never joins the title',
  !combines(sent, 'Visible description', 'A visible setting description'),
  sent.join(' | ')
);

// ---------------------------------------------------------------------------
// 3. Both densities render the same title.
// ---------------------------------------------------------------------------
env.check(
  'compact Monitor title translated',
  env.text(compactTitleText) === defaultTranslate('Monitor'),
  env.text(compactTitleText)
);
env.check(
  'compact and comfortable Monitor titles agree',
  env.text(compactTitleText) === env.text(comfortableTitle) && env.hasCJK(env.text(compactTitleText)),
  env.text(compactTitleText) + ' vs ' + env.text(comfortableTitle)
);
env.check(
  'compact Animation style title translated',
  env.text(animationTitleText) === defaultTranslate('Animation style'),
  env.text(animationTitleText)
);
env.check(
  'compact and comfortable Animation style titles agree',
  env.text(animationTitleText) === env.text(animationComfortableTitle) &&
    env.hasCJK(env.text(animationTitleText)),
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

// ---------------------------------------------------------------------------
// 4. The reset button keeps its nested unit and the title stays text-only.
// ---------------------------------------------------------------------------
env.check(
  'the Extra shortcuts title source is exactly Extra shortcuts',
  exactCount(sent, 'Extra shortcuts') === 1,
  String(exactCount(sent, 'Extra shortcuts'))
);
env.check(
  'the Extra shortcuts title translated',
  env.text(shortcutsTitleText) === defaultTranslate('Extra shortcuts'),
  env.text(shortcutsTitleText)
);
env.check(
  'the reset button is still a nested unit',
  shortcutsReset.getAttribute('data-wh-unit') !== null &&
    shortcutsReset.getAttribute('data-wh-unit') !==
      doc.getElementById('dense-shortcuts-title').getAttribute('data-wh-unit'),
  shortcutsReset.outerHTML
);
env.check('the reset button translated', env.hasCJK(env.text(shortcutsReset)), env.text(shortcutsReset));

// ---------------------------------------------------------------------------
// 5. The hidden screen-reader copy is untouched and never a unit.
// ---------------------------------------------------------------------------
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
env.check(
  'no hidden copy is requested on its own',
  !sent.some((text) => text === shortcutsCopy),
  sent.join(' | ')
);

// The visible tooltip portal is outside the title and shares the description
// translation instead of requesting the string again.
const tooltip = fixture.addTooltip(doc, monitorCopy, 'dense-tooltip');
await env.wait(800);
env.check('the tooltip copy translated', env.hasCJK(env.text(tooltip)), env.text(tooltip));
env.check(
  'the tooltip shares the description request',
  exactCount(sent, monitorCopy) === 1 && env.requestCount(monitorCopy) === 1,
  String(env.requestCount(monitorCopy))
);
env.check(
  'the title does not absorb the tooltip copy',
  env.text(compactTitleText) === defaultTranslate('Monitor'),
  env.text(compactTitleText)
);

env.check('no engine problems logged', env.problems.length === 0, env.problems.join(' | '));

const failures = env.report();
env.window.close();
process.exit(failures ? 1 : 0);
