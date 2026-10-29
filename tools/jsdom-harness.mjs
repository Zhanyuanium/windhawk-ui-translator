/**
 * jsdom harness for the page engine (src/js/engine.js).
 *
 * jsdom is not a dependency of this repository; the harness takes the JSDOM
 * class from the caller so it can be used from any directory that has jsdom
 * installed:
 *
 *   import { JSDOM } from 'jsdom';
 *   import { mount, fixture } from '.../tools/jsdom-harness.mjs';
 *   const env = mount(JSDOM, { html: fixture.installedMods() });
 *   await env.wait(1200);
 *   env.check('name translated', env.hasCJK(env.text(env.doc.getElementById('table-name'))));
 *   env.report();
 *
 * The stub channel answers `settings?` with a settings object and every `http`
 * request with a deterministic "every Latin word becomes 文" translation, so
 * tests need no network and no mod.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ENGINE_URL = new URL('../src/js/engine.js', import.meta.url);

export const TAG = 'whtr1';
export const SEP = '\x1f';

export const DEFAULT_SETTINGS = {
  targetLang: 'zh-CN',
  provider: 'edge',
  llmBaseUrl: '',
  llmModel: '',
  llmKeySource: 'none',
  scopeReadme: true,
  scopeSettings: true,
  scopeModName: true,
  scopeModSummary: true,
  scopeChangelog: true,
  hoverDelayMs: 0,
  shortcutToggle: 'Alt+Q',
  gestureToggle: true,
  batchSize: 20,
  batchChars: 10000,
  batchIntervalMs: 0,
  concurrency: 2,
  timeoutMs: 30000,
  cacheEnabled: false,
  cacheTtlDays: 30,
  clearCache: false,
  debug: true
};

export function engineSource() {
  return readFileSync(fileURLToPath(ENGINE_URL), 'utf8');
}

// Deterministic provider: every Latin word becomes 文, placeholders and
// punctuation survive. Enough to see what was reached without a real service.
export function defaultTranslate(text) {
  return String(text).replace(/[A-Za-z]+/g, '\u6587');
}

const page = (body) =>
  '<!doctype html><html lang="en"><head></head><body>' + body + '</body></html>';

export const fixture = {
  /** Tile grid: RowMeta title and description. */
  tileGrid() {
    return page(`
      <div class="ant-listy" id="tile-grid">
        <div class="ant-listy-item">
          <div class="windhawk-row-meta">
            <h4 class="windhawk-row-meta-title" id="tile-name">Better Dialogs</h4>
            <div class="windhawk-row-meta-description" id="tile-desc">Improves Windows dialog boxes.</div>
          </div>
        </div>
        <div class="ant-listy-item">
          <div class="windhawk-row-meta">
            <h4 class="windhawk-row-meta-title" id="tile-name2">Taskbar Clock</h4>
            <div class="windhawk-row-meta-description" id="tile-desc2">Replaces the tray clock.</div>
          </div>
        </div>
      </div>`);
  },

  /** Mods browser table view: name is a styled.a, description an EllipsisText. */
  modsTable() {
    return page(`
      <div data-testid="mods-browser">
        <div class="ant-table-wrapper" data-testid="installed-mods-table">
          <div class="ant-table">
            <div class="ant-table-container">
              <table>
                <thead class="ant-table-thead">
                  <tr>
                    <th class="ant-table-cell"></th>
                    <th class="ant-table-cell">Name</th>
                    <th class="ant-table-cell">Description</th>
                  </tr>
                </thead>
                <tbody class="ant-table-tbody">
                  <tr class="ant-table-row" data-row-key="better-dialogs">
                    <td class="ant-table-cell">
                      <span class="sc-content">
                        <span class="sc-box">
                          <label class="ant-checkbox-wrapper">
                            <span class="ant-checkbox">
                              <input type="checkbox" data-testid="mod-row-select">
                            </span>
                          </label>
                        </span>
                        <span class="sc-items">
                          <a class="sc-link" id="table-name" href="#better-dialogs">Better Dialogs</a>
                          <span class="ant-tag">Update available</span>
                        </span>
                      </span>
                    </td>
                    <td class="ant-table-cell">
                      <span class="ant-typography sc-ellipsis" id="table-desc"
                            title="Improves Windows dialog boxes.">Improves Windows dialog boxes.</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`);
  },

  /** Details header: name div, id chip, icon metadata line, Typography summary. */
  detailsHeader() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card" id="details-card">
          <div class="ant-card-head">
            <div class="ant-card-head-title">
              <div class="ant-card-meta">
                <div class="ant-card-meta-detail">
                  <div class="ant-card-meta-title">
                    <div class="sc-wrap">
                      <div class="sc-firstline">
                        <div id="details-name">Better Dialogs</div>
                        <span class="sc-page-buttons">
                          <button type="button" id="details-page">Page</button>
                        </span>
                        <div class="sc-chip" id="details-id">better-dialogs</div>
                      </div>
                      <div class="sc-metadata">
                        <div class="sc-item">
                          <span class="ant-typography" id="details-version"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>v1.2.0</span>
                        </div>
                        <div class="sc-item">
                          <span class="ant-typography" id="details-author"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>FireBlade</span>
                        </div>
                      </div>
                      <span class="ant-typography sc-desc" id="details-desc">Improves Windows dialog boxes.</span>
                      <div class="sc-buttons">
                        <button type="button" id="details-install">Install</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="ant-card-body">
            <p id="details-body">Header card body prose still translates.</p>
          </div>
        </div>
      </section>`);
  },

  /**
   * Compact settings density: the title lives in a styled-components title
   * wrapper with a SettingTitleText span, the description is a sibling of the
   * title row, and the closed select mirrors antd 6 (value/placeholder in
   * `.ant-select-content` beside the search input).
   */
  compactSettings() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form settings-panel">
            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="monitor">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="compact-title">
                  <span class="sc-title-wrapper">
                    <span class="SettingTitleText-sc-1" id="compact-title-text">Monitor</span>
                    <button type="button" data-testid="mod-setting-description" id="compact-info"
                            aria-label="Description of Monitor"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></button>
                  </span>
                </h4>
                <div class="windhawk-row-meta-description" id="compact-desc">Only the windows on the switcher's monitor</div>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single" id="monitor-select">
                  <div class="ant-select-content ant-select-content-has-value" id="select-value"
                       title="Where the mouse cursor is"><span class="ant-select-content-value">Where the mouse cursor is</span><input id="select-search" class="ant-select-input" role="combobox" aria-autocomplete="list" value=""></div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="shortcut">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="compact-title2">
                  <span class="sc-title-wrapper">
                    <span class="SettingTitleText-sc-2" id="compact-title-text2">Shortcut</span>
                  </span>
                </h4>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-multiple">
                  <div class="ant-select-content">
                    <span class="ant-select-selection-item" id="select-value2"
                          title="Key left of 1 (under Esc)"><span class="ant-select-selection-item-content">Key left of 1 (under Esc)</span></span>
                    <input class="ant-select-input" role="combobox" value="">
                  </div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="search">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="compact-title3">
                  <span class="sc-title-wrapper">
                    <span class="SettingTitleText-sc-3" id="compact-title-text3">Custom text</span>
                  </span>
                </h4>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single">
                  <div class="ant-select-content">
                    <div class="ant-select-placeholder" id="select-placeholder">Choose a window</div>
                    <input class="ant-select-input" role="combobox" value="">
                  </div>
                </div>
                <input id="setting-input" class="ant-input" value="Where the mouse cursor is">
              </div>
            </div>
          </div>
        </div></div>
      </section>`);
  },

  /**
   * antd 6 single select, as Windhawk 2.0.0-alpha.8 renders it (verified against
   * antd 6.6.8 / @rc-component/select 1.10.1 and the app's own cached bundle):
   * there is no `.ant-select-selector`; the closed value is a text node inside
   * `.ant-select-content`, which carries `title` and holds the search
   * `<input role="combobox">` as its last child. The placeholder is a
   * `.ant-select-placeholder` div in the same slot. An option with its own
   * className/style wraps the label in `.ant-select-content-value`.
   */
  antd6Selects() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form">
            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="real">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="real-title">Monitor</h4>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single ant-select-show-arrow">
                  <div class="ant-select-content ant-select-content-has-value" id="real-content"
                       title="Where the mouse cursor is">Where the mouse cursor is<input class="ant-select-input"
                       id="real-input" role="combobox" aria-expanded="false" aria-haspopup="listbox"
                       aria-autocomplete="list" type="text" value=""></div>
                  <div class="ant-select-suffix"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span></div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="nested">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="nested-title">Monitor</h4>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single">
                  <div class="ant-select-content ant-select-content-has-value" id="nested-content"
                       title="Where the mouse cursor is"><span class="ant-select-content-value" id="nested-value">Where the mouse cursor is</span><input class="ant-select-input" id="nested-input" role="combobox" aria-expanded="false" aria-autocomplete="list" type="text" value="Where the mouse cursor is"></div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="placeholder">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="placeholder-title">Monitor</h4>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single">
                  <div class="ant-select-content" id="placeholder-content"><div class="ant-select-placeholder" id="real-placeholder">Choose a monitor</div><input class="ant-select-input" id="placeholder-input" role="combobox" aria-expanded="false" aria-autocomplete="list" type="text" value=""></div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="multi">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="multi-title">Monitor</h4>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-multiple">
                  <div class="ant-select-content">
                    <span class="ant-select-selection-item" id="multi-item" title="Where the mouse cursor is"><span class="ant-select-selection-item-content" id="multi-item-content">Where the mouse cursor is</span></span>
                    <input class="ant-select-input" id="multi-input" role="combobox" value="">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div></div>
      </section>`);
  },

  /**
   * Select hosts that the settings pass must skip, one per rejection reason:
   * already claimed by the description host, denied ancestor (`<pre>`), and no
   * text at all.
   */
  debugSelects() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form">
            <div class="windhawk-row" data-testid="mod-setting">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="debug-title"><span class="SettingTitleText-sc-4">Monitor</span></h4>
                <div data-testid="mod-setting-description-text" id="debug-desc">Only the windows on the switcher's monitor
                  <span class="ant-select ant-select-single"><span class="ant-select-content" id="debug-claimed">Where the mouse cursor is</span></span>
                </div>
              </div>
              <div class="sc-control">
                <pre><span class="ant-select ant-select-single"><span class="ant-select-content" id="debug-denied">Where the mouse cursor is</span></span></pre>
                <span class="ant-select ant-select-single"><span class="ant-select-content" id="debug-empty"></span></span>
              </div>
            </div>
          </div>
        </div></div>
      </section>`);
  },

  /**
   * The same strings on every surface at once: one compact and one comfortable
   * settings row, two closed select values and a reset label whose tail is the
   * option label shown by one of them. The comfortable description carries
   * extra whitespace on purpose: it must normalise to the compact string.
   */
  sameStrings() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form settings-panel">

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="keep-compact">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="same-compact-title">
                  <span class="sc-title-wrapper"><span class="SettingTitleText-sc-5" id="same-compact-title-text">Keep switcher open</span></span>
                </h4>
                <div data-testid="mod-setting-description-text" id="same-compact-desc">Ctrl+Alt+Tab keeps the switcher open</div>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single">
                  <div class="ant-select-content" id="same-compact-select"
                       title="Where the mouse cursor is">Where the mouse cursor is<input class="ant-select-input" role="combobox" value=""></div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="keep-comfortable">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="same-comfortable-title">Keep switcher open</h4>
                <div class="windhawk-row-meta-description" id="same-comfortable-desc">Ctrl+Alt+Tab  keeps
                  the switcher open</div>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single">
                  <div class="ant-select-content" id="same-comfortable-select"
                       title="Where the mouse cursor is">Where the mouse cursor is<input class="ant-select-input" role="combobox" value=""></div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="position">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="same-position-title">Monitor position</h4>
              </div>
              <div class="sc-control">
                <div class="ant-select ant-select-single">
                  <div class="ant-select-content" id="same-position-select"
                       title="Flip 3D (Vista stack)">Flip 3D (Vista stack)<input class="ant-select-input" role="combobox" value=""></div>
                </div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="fallback-reset">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="same-fallback-title">Fallback reset</h4>
              </div>
              <div class="sc-control">
                <button type="button" data-testid="mod-setting-reset" id="same-fallback-reset">Reset to default: Never seen option</button>
              </div>
            </div>

            <div id="late-reset-slot"></div>

          </div>
        </div></div>
      </section>`);
  },

  /**
   * Insert a settings row whose reset button sits inside the title host, the
   * way the compact density nests it. Call after the tail's translation is
   * known so the reset label composes instead of translating the sentence.
   */
  addResetRow(doc, tail, id, sep, titleText) {
    const slot = doc.getElementById('late-reset-slot');
    if (!slot) return null;
    const row = doc.createElement('div');
    row.className = 'windhawk-row';
    row.setAttribute('data-testid', 'mod-setting');
    row.setAttribute('data-setting-key', 'late-reset');
    const meta = doc.createElement('div');
    meta.className = 'windhawk-row-meta';
    const title = doc.createElement('h4');
    title.className = 'windhawk-row-meta-title';
    title.appendChild(doc.createTextNode(titleText || 'Extra shortcut '));
    const button = doc.createElement('button');
    button.type = 'button';
    button.setAttribute('data-testid', 'mod-setting-reset');
    button.id = id || 'late-reset';
    button.textContent = 'Reset to default' + (sep == null ? ': ' : sep) + tail;
    title.appendChild(button);
    meta.appendChild(title);
    row.appendChild(meta);
    slot.appendChild(row);
    return button;
  },

  /**
   * Compact density where the description host sits inside the title host. The
   * title still claims and translates its own text; the hidden copy is
   * excluded from the title source and never a unit. The debug dump must show
   * the title as claimed.
   */
  compactTitleConflict() {
    const rows = [];
    for (let i = 0; i < 8; i++) {
      const key = i === 0 ? 'monitor' : 'setting-' + i;
      const title = i === 0 ? 'Monitor' : 'Setting ' + i;
      const desc = i === 0 ? "Only the windows on the switcher's monitor" : 'Description ' + i;
      rows.push(`
        <div class="windhawk-row" data-testid="mod-setting" data-setting-key="${key}">
          <div class="windhawk-row-meta">
            <h4 class="windhawk-row-meta-title" id="conflict-title-${i}">
              <div class="sc-title-wrapper">
                <span class="SettingTitleText-sc-6" id="conflict-title-text-${i}">${title}</span>
                <div data-testid="mod-setting-description-text" id="conflict-desc-${i}">${desc}</div>
              </div>
            </h4>
          </div>
        </div>`);
    }
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form settings-panel">${rows.join('')}</div>
        </div></div>
      </section>`);
  },

  /**
   * One compact row whose screen-reader description is nested inside the title
   * host, the shape that used to claim the row first and leave the title
   * untranslated. The visible tooltip copy is a separate portal node added by
   * addTooltip() after the first scan.
   */
  compactAriaTitle() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form settings-panel">
            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="monitor">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="aria-title">
                  <span class="sc-title-wrapper">
                    <span class="SettingTitleText-sc-7" id="aria-title-text">Monitor</span>
                    <button type="button" data-testid="mod-setting-description" id="aria-info"
                            aria-label="Description of Monitor"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></button>
                    <div class="sc-hidden" data-testid="mod-setting-description-text" id="aria-desc">Only the windows on the switcher's monitor</div>
                  </span>
                </h4>
              </div>
            </div>
          </div>
        </div></div>
      </section>`);
  },

  /**
   * The compact row from the running app next to its comfortable twin: the
   * title is "Monitor" and the description is "Which monitor the switcher
   * opens on" in the hidden screen-reader copy (compact), in the visible
   * tooltip portal (added after the first scan) and in the comfortable
   * description. Both densities must request the same two strings once and
   * resolve to the same translations. A third row keeps only the hidden copy
   * and must get no title unit at all.
   */
  ariaTitleTwins() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form settings-panel">
            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="monitor-compact">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="twin-compact-title">
                  <span class="sc-title-wrapper">
                    <span class="SettingTitleText-sc-8" id="twin-compact-title-text">Monitor</span>
                    <button type="button" data-testid="mod-setting-description" id="twin-info"
                            aria-label="Description of Monitor"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></button>
                    <div class="sc-hidden" data-testid="mod-setting-description-text" id="twin-compact-aria">Which monitor the switcher opens on</div>
                  </span>
                </h4>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="monitor-comfortable">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="twin-comfortable-title">Monitor</h4>
                <div class="windhawk-row-meta-description" id="twin-comfortable-desc">Which monitor the switcher opens on</div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="aria-only">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="twin-empty-title">
                  <span class="sc-title-wrapper">
                    <button type="button" data-testid="mod-setting-description" id="twin-empty-info"
                            aria-label="Description of the hidden setting"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></button>
                    <div class="sc-hidden" data-testid="mod-setting-description-text" id="twin-empty-aria">Only the windows on the switcher's monitor</div>
                  </span>
                </h4>
              </div>
            </div>
          </div>
        </div></div>
      </section>`);
  },

  /**
   * The real compact title row beside its comfortable twin, in the shape the
   * running app renders: the title text, the collapsed value summary, the ⓘ
   * button and the screen-reader description copy all sit in one title row.
   * Only the title text is the title unit; the summary is its own string, the
   * description copy is excluded from the title and its visible copy is the
   * comfortable description (and a tooltip portal added by addTooltip()).
   * The last row nests a reset button in the title row: the title unit still
   * carries no placeholder, and the button keeps its own nested unit.
   */
  compactDensityTwins() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form settings-panel">

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="monitor-compact">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="dense-compact-title">
                  <span class="SettingTitleWrapper-sc-9">
                    <span class="SettingTitleText-sc-10" id="dense-compact-title-text">Monitor</span>
                    <span data-testid="mod-setting-summary" id="dense-compact-summary">Non-default</span>
                    <button type="button" data-testid="mod-setting-description" id="dense-compact-info"
                            aria-label="Description of Monitor"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></button>
                    <div class="sc-hidden" data-testid="mod-setting-description-text" id="dense-compact-desc">Only the windows on the switcher's monitor</div>
                  </span>
                </h4>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="monitor-comfortable">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="dense-comfortable-title">Monitor</h4>
                <div class="windhawk-row-meta-description" id="dense-comfortable-desc">Only the windows on the switcher's monitor</div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="animation-compact">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="dense-animation-title">
                  <span class="SettingTitleWrapper-sc-11">
                    <span class="SettingTitleText-sc-12" id="dense-animation-title-text">Animation style</span>
                    <span data-testid="mod-setting-summary" id="dense-animation-summary">Non-default</span>
                    <button type="button" data-testid="mod-setting-description" id="dense-animation-info"
                            aria-label="Description of Animation style"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></button>
                    <div class="sc-hidden" data-testid="mod-setting-description-text" id="dense-animation-desc">How the windows are presented</div>
                  </span>
                </h4>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="animation-comfortable">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="dense-animation-comfortable-title">Animation style</h4>
                <div class="windhawk-row-meta-description" id="dense-animation-comfortable-desc">How the windows are presented</div>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="shortcuts-compact">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="dense-shortcuts-title">
                  <span class="SettingTitleWrapper-sc-13">
                    <span class="SettingTitleText-sc-14" id="dense-shortcuts-title-text">Extra shortcuts</span>
                    <button type="button" data-testid="mod-setting-reset" id="dense-shortcuts-reset">Reset to default: Flip 3D (Vista stack)</button>
                    <div class="sc-hidden" data-testid="mod-setting-description-text" id="dense-shortcuts-desc">Shortcuts with an animation style of their own, instead of the global one</div>
                  </span>
                </h4>
              </div>
            </div>

            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="visible-desc">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="dense-visible-title">Visible description</h4>
                <div data-testid="mod-setting-description-text" id="dense-visible-desc">A visible setting description</div>
              </div>
            </div>

          </div>
        </div></div>
      </section>`);
  },

  /**
   * A title host that contains a closed select value claimed before it. The
   * title must still swap its own text and keep the claimed child atomic.
   */
  titleWithClaimedChild() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <div class="ant-form">
            <div class="windhawk-row" data-testid="mod-setting" data-setting-key="outer">
              <div class="windhawk-row-meta">
                <h4 class="windhawk-row-meta-title" id="outer-title">Outer title
                  <span class="ant-select ant-select-single"><span class="ant-select-content" id="outer-child" title="Child value text">Child value text</span></span>
                </h4>
              </div>
            </div>
          </div>
        </div></div>
      </section>`);
  },

  /**
   * Cloned README prose next to a mixed prose host (own sentence plus a nested
   * list) whose nested item is claimed first: the outer host swaps its own text
   * and keeps the nested unit atomic.
   */
  proseAndMixed() {
    return page(`
      <section data-testid="mod-details">
        <div class="ant-card"><div class="ant-card-body">
          <p id="clone-p">Readme prose stays a clone.</p>
          <ul>
            <li id="mixed-li">Mixed prose sentence.
              <ul><li id="nested-li">Nested item.</li></ul>
            </li>
          </ul>
        </div></div>
      </section>`);
  },

  /** Append the visible tooltip portal for a setting description. */
  addTooltip(doc, text, id) {
    const tip = doc.createElement('div');
    tip.className = 'ant-tooltip';
    tip.id = id || 'setting-tooltip';
    const inner = doc.createElement('div');
    inner.className = 'ant-tooltip-inner';
    const copy = doc.createElement('div');
    copy.setAttribute('data-testid', 'mod-setting-description-text');
    copy.textContent = text;
    inner.appendChild(copy);
    tip.appendChild(inner);
    doc.body.appendChild(tip);
    return copy;
  },

  /** A select dropdown opened next to the compact fixture. */
  openSelectDropdown(doc, text, id) {
    const dropdown = doc.createElement('div');
    dropdown.className = 'ant-select-dropdown';
    dropdown.id = id || 'select-dropdown';
    const item = doc.createElement('div');
    item.className = 'ant-select-item ant-select-item-option';
    const content = doc.createElement('div');
    content.className = 'ant-select-item-option-content';
    content.textContent = text;
    item.appendChild(content);
    dropdown.appendChild(item);
    doc.body.appendChild(dropdown);
    return dropdown;
  },

  /** All four surfaces in one page. */
  all() {
    const body = (html) => html.replace(/^[\s\S]*<body>/, '').replace(/<\/body>[\s\S]*$/, '');
    return page(
      body(this.tileGrid()) + body(this.modsTable()) + body(this.detailsHeader()) + body(this.compactSettings())
    );
  }
};

/**
 * Mount a page and the engine in jsdom.
 *
 * @param {typeof import('jsdom').JSDOM} JSDOM
 * @param {{html: string, settings?: object, translate?: (text: string) => string}} options
 */
export function mount(JSDOM, options) {
  const html = options && options.html ? options.html : fixture.all();
  const translate = (options && options.translate) || defaultTranslate;
  const settings = Object.assign({}, DEFAULT_SETTINGS, (options && options.settings) || {});

  const dom = new JSDOM(html, {
    url: 'https://dev.local/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;
  const doc = window.document;

  const listeners = [];
  const requests = [];
  const logs = [];
  const problems = [];
  const emit = (data) => {
    for (const fn of listeners) fn({ data: data });
  };

  window.chrome = {
    webview: {
      addEventListener(type, fn) {
        if (type === 'message') listeners.push(fn);
      },
      removeEventListener() {},
      postMessage(msg) {
        if (msg === TAG + SEP + 'settings?') {
          setTimeout(() => {
            emit(TAG + SEP + 'settings' + SEP + JSON.stringify(settings));
          }, 5);
          return;
        }
        if (msg.indexOf(TAG + SEP + 'http' + SEP) !== 0) {
          if (msg.indexOf(TAG + SEP + 'log' + SEP) === 0) {
            const line = msg.slice((TAG + SEP + 'log' + SEP).length);
            logs.push(line);
            if (line.indexOf('whtr:') === 0) problems.push(line);
          }
          return;
        }
        const fields = msg.split(SEP);
        const id = fields[2];
        const count = Number(fields[5]);
        let input = [];
        try {
          input = JSON.parse(fields[6 + count * 2]);
        } catch (_) {
          input = [];
        }
        requests.push(input.slice());
        setTimeout(() => {
          const translated = input.map((text) => translate(text));
          emit(
            TAG + SEP + 'http' + SEP + id + SEP + '200' + SEP + '0' + SEP +
            JSON.stringify(translated.map((text) => ({ translations: [{ text: text }] })))
          );
        }, 2);
      }
    }
  };

  window.eval(engineSource());

  const env = {
    dom: dom,
    window: window,
    doc: doc,
    settings: settings,
    requests: requests,
    logs: logs,
    problems: problems,
    api() {
      return window.__WHTR__;
    },
    /** Send one settings payload exactly as given (old protocol included). */
    pushSettings(payload) {
      for (const key of Object.keys(settings)) delete settings[key];
      Object.assign(settings, payload);
      emit(TAG + SEP + 'settings' + SEP + JSON.stringify(settings));
    },
    wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    async waitFor(predicate, timeoutMs) {
      const deadline = Date.now() + (timeoutMs || 4000);
      while (Date.now() < deadline) {
        let ok = false;
        try {
          ok = !!predicate();
        } catch (_) {
          ok = false;
        }
        if (ok) return true;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      return false;
    },
    text(el) {
      return el ? el.textContent.trim() : '';
    },
    directText(el) {
      if (!el) return '';
      return Array.from(el.childNodes)
        .filter((node) => node.nodeType === 3)
        .map((node) => node.nodeValue)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
    },
    hasCJK(value) {
      return /[\u4e00-\u9fff]/.test(String(value || ''));
    },
    isLatin(value) {
      return /[A-Za-z]/.test(String(value || '')) && !/[\u4e00-\u9fff]/.test(String(value || ''));
    },
    requestCount(text) {
      let n = 0;
      for (const batch of requests) if (batch.indexOf(text) !== -1) n++;
      return n;
    },
    failures: [],
    check(name, ok, detail) {
      if (ok) {
        console.log('PASS ' + name);
      } else {
        const line = name + (detail === undefined ? '' : ': ' + detail);
        env.failures.push(line);
        console.log('FAIL ' + line);
      }
    },
    report() {
      console.log('');
      console.log('stats ' + JSON.stringify(env.api() ? env.api().stats() : {}));
      if (env.failures.length) {
        console.log(env.failures.length + ' failure(s)');
        return env.failures.length;
      }
      console.log('all checks passed');
      return 0;
    }
  };

  return env;
}
