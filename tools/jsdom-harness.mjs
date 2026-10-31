/**
 * jsdom harness for the page engine (src/js/engine.js).
 *
 * jsdom is not a dependency of this repository; the harness takes the JSDOM
 * class from the caller so it can be used from any directory that has jsdom
 * installed:
 *
 *   import { JSDOM } from 'jsdom';
 *   import { mount, fixture } from '.../tools/jsdom-harness.mjs';
 *   const env = mount(JSDOM, { html: fixture.modsTable() });
 *   await env.wait(1200);
 *   env.check('name translated', env.hasCJK(env.text(env.doc.getElementById('table-name'))));
 *   env.report();
 *
 * The stub channel answers `settings?` with a settings object, `cache-get` from
 * an in-memory store (fed by `cache-put`, echoing the request id in its reply),
 * and every `http` request with a deterministic "every Latin word becomes 文"
 * translation, so tests need no network and no mod. It can also emit `teardown`
 * and records anything the page sends afterwards.
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
  glossary: [],
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
  clearCache: false
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

// Protocol fields: every field but the last is separator-free, so split the
// leading fields with indexOf and leave the remainder (which may contain
// separators) as the last field.
const splitFields = (text, count) => {
  const out = [];
  let at = 0;
  for (let i = 0; i < count - 1; i++) {
    const next = text.indexOf(SEP, at);
    if (next === -1) {
      if (at < text.length || out.length) out.push(text.slice(at));
      return out;
    }
    out.push(text.slice(at, next));
    at = next + 1;
  }
  out.push(text.slice(at));
  return out;
};

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

  /** Explore page tile: Card.Meta title and description. */
  exploreTile() {
    return page(`
      <div class="ant-listy" id="explore-grid">
        <div class="ant-card ant-listy-item" id="explore-card">
          <div class="ant-card-body">
            <div class="ant-card-meta">
              <div class="ant-card-meta-detail">
                <div class="ant-card-meta-title" id="explore-name">Better Dialogs</div>
                <div class="ant-card-meta-description" id="explore-desc">Improves Windows dialog boxes.</div>
              </div>
            </div>
          </div>
        </div>
      </div>`);
  },

  /**
   * Explore tile in the real ModCard shape: the Card.Meta title holds a
   * mod-card-title box with the name Typography, the status ribbon and an
   * optional local-mod icon, followed by the metadata line (version, author,
   * process scope, each with an icon). Only the Typography is the name.
   */
  modCard() {
    return page(`
      <div class="ant-listy" id="modcard-grid">
        <div class="ant-card ant-listy-item" id="modcard-ribbon-card">
          <div class="ant-card-body">
            <div class="ant-card-meta">
              <div class="ant-card-meta-detail">
                <div class="ant-card-meta-title" id="modcard-ribbon-meta">
                  <div class="sc-mod-card-title" data-testid="mod-card-title">
                    <span class="ant-typography sc-ellipsis" id="modcard-ribbon-name"
                          title="Windows 11 Taskbar Styler">Windows 11 Taskbar Styler</span>
                    <div class="ant-ribbon-wrapper"><div class="ant-ribbon ant-ribbon-placement-end" id="modcard-ribbon">已安装</div></div>
                    <span class="anticon sc-local-icon" id="modcard-local-icon" aria-label="Local mod"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>
                  </div>
                  <div class="ModMetadataLine-sc-abc" id="modcard-ribbon-meta-line">
                    <span class="sc-meta-item"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>1.2.0</span>
                    <span class="sc-meta-item"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>m417z</span>
                    <span class="sc-meta-item"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>explorer.exe</span>
                  </div>
                </div>
                <div class="ant-card-meta-description" id="modcard-ribbon-desc">Animates the taskbar Dock.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ant-card ant-listy-item" id="modcard-plain-card">
          <div class="ant-card-body">
            <div class="ant-card-meta">
              <div class="ant-card-meta-detail">
                <div class="ant-card-meta-title" id="modcard-plain-meta">
                  <div class="sc-mod-card-title" data-testid="mod-card-title">
                    <span class="ant-typography sc-ellipsis" id="modcard-plain-name"
                          title="Better file sizes in Explorer details">Better file sizes in Explorer details</span>
                  </div>
                  <div class="ModMetadataLine-sc-def" id="modcard-plain-meta-line">
                    <span class="sc-meta-item"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>1.0.0</span>
                    <span class="sc-meta-item"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>m417z</span>
                    <span class="sc-meta-item"><span class="anticon"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></span>explorer.exe</span>
                  </div>
                </div>
                <div class="ant-card-meta-description" id="modcard-plain-desc">Shows folder sizes in the details pane.</div>
              </div>
            </div>
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
   * excluded from the title source and never a unit.
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

  /** All surfaces in one page. */
  all() {
    const body = (html) => html.replace(/^[\s\S]*<body>/, '').replace(/<\/body>[\s\S]*$/, '');
    return page(
      body(this.tileGrid()) + body(this.exploreTile()) + body(this.modsTable()) +
      body(this.detailsHeader()) + body(this.compactSettings())
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
  const respond = options && options.respond;
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
  const httpRequests = [];
  const logs = [];
  const problems = [];
  // The mod's cache store: `cache-get` reads it, `cache-put` writes it.
  const cache = new Map();
  // Keys the page looked up, in order; `cacheRequests` keeps the id and key.
  const cacheLookups = [];
  const cacheRequests = [];
  // Messages the engine sent after `teardown`; must stay empty.
  const postTeardown = [];
  let tornDown = false;
  const seedCache = options && options.cache;
  if (seedCache) {
    if (typeof seedCache.forEach === 'function') seedCache.forEach((value, key) => cache.set(key, value));
    else for (const key of Object.keys(seedCache)) cache.set(key, seedCache[key]);
  }
  const emit = (data) => {
    for (const fn of listeners) fn({ data: data });
  };

  // The text segments a request carries, whether it is an Edge array or an
  // OpenAI-compatible chat body.
  const bodyTexts = (body) => {
    let parsed = null;
    try {
      parsed = JSON.parse(body);
    } catch (_) {
      parsed = null;
    }
    if (Array.isArray(parsed)) return parsed.slice();
    if (parsed && Array.isArray(parsed.messages)) {
      const last = parsed.messages[parsed.messages.length - 1];
      let payload = null;
      try {
        payload = JSON.parse(last && last.content);
      } catch (_) {
        payload = null;
      }
      if (payload && Array.isArray(payload.segments)) return payload.segments.map((item) => item.text);
    }
    return [];
  };

  const defaultReply = (record) => {
    let parsed = null;
    try {
      parsed = JSON.parse(record.body);
    } catch (_) {
      parsed = null;
    }
    if (Array.isArray(parsed)) {
      return {
        status: 200,
        error: 0,
        body: JSON.stringify(parsed.map((text) => ({ translations: [{ text: translate(text) }] })))
      };
    }
    if (parsed && Array.isArray(parsed.messages)) {
      const texts = bodyTexts(record.body);
      const out = {
        translations: texts.map((text, index) => ({ id: index + 1, text: translate(text) }))
      };
      return {
        status: 200,
        error: 0,
        body: JSON.stringify({
          choices: [{ message: { role: 'assistant', content: JSON.stringify(out) } }]
        })
      };
    }
    return { status: 200, error: 0, body: '[]' };
  };

  window.chrome = {
    webview: {
      addEventListener(type, fn) {
        if (type === 'message') listeners.push(fn);
      },
      removeEventListener(type, fn) {
        if (type !== 'message') return;
        const at = listeners.indexOf(fn);
        if (at !== -1) listeners.splice(at, 1);
      },
      postMessage(msg) {
        if (tornDown) {
          postTeardown.push(msg);
          return;
        }
        if (msg === TAG + SEP + 'settings?') {
          setTimeout(() => {
            if (tornDown) return;
            emit(TAG + SEP + 'settings' + SEP + JSON.stringify(settings));
          }, 5);
          return;
        }
        if (msg.indexOf(TAG + SEP + 'cache-get' + SEP) === 0) {
          // Protocol v2: tag, kind, request id, key. The reply echoes the id so
          // a late answer cannot resolve a newer lookup for the same key.
          const fields = splitFields(msg, 4);
          const id = fields[2];
          const key = fields[3];
          cacheLookups.push(key);
          cacheRequests.push({ id: id, key: key, raw: msg });
          // `dropCache` simulates a mod that never answers the lookup; the test
          // may then emit a reply (or a stale one) itself.
          if (options && options.dropCache) return;
          // Answer through the channel, as the mod does: the lookup is async.
          setTimeout(() => {
            if (tornDown) return;
            if (cache.has(key)) emit(TAG + SEP + 'cache-hit' + SEP + id + SEP + key + SEP + cache.get(key));
            else emit(TAG + SEP + 'cache-miss' + SEP + id + SEP + key);
          }, 2);
          return;
        }
        if (msg.indexOf(TAG + SEP + 'cache-put' + SEP) === 0) {
          // No reply: the mod stores it and the page moves on.
          const rest = msg.slice((TAG + SEP + 'cache-put' + SEP).length);
          const at = rest.indexOf(SEP);
          const key = at === -1 ? rest : rest.slice(0, at);
          const text = at === -1 ? '' : rest.slice(at + 1);
          cache.set(key, text);
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
        // Protocol v2: exactly six fields, no headers; the body is the last one
        // and may itself contain separators.
        const fields = splitFields(msg, 6);
        const id = fields[2];
        const body = fields[5] == null ? '' : fields[5];
        const record = {
          id: id,
          method: fields[3],
          url: fields[4],
          body: body,
          fields: fields,
          fieldCount: msg.split(SEP).length
        };
        httpRequests.push(record);
        requests.push(bodyTexts(body));
        setTimeout(() => {
          if (tornDown) return;
          let reply = null;
          try {
            reply = respond ? respond(record) : null;
          } catch (_) {
            reply = null;
          }
          if (!reply) reply = defaultReply(record);
          if (reply.drop) return;
          emit(
            TAG + SEP + 'http' + SEP + id + SEP +
            String(reply.status == null ? 0 : reply.status) + SEP +
            String(reply.error == null ? 0 : reply.error) + SEP +
            String(reply.body == null ? '' : reply.body)
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
    httpRequests: httpRequests,
    logs: logs,
    problems: problems,
    // The mod-side cache store and the keys the page looked up.
    cache: cache,
    cacheLookups: cacheLookups,
    // Full `cache-get` records: { id, key } in the order the page sent them.
    cacheRequests: cacheRequests,
    // Anything the engine sent after `teardown`; must stay empty.
    postTeardown: postTeardown,
    api() {
      return window.__WHTR__;
    },
    /** Inject a raw protocol message, as the mod would. */
    emit(data) {
      emit(data);
    },
    /**
     * Emit a cache reply as the mod would. `id` and `key` are the ones the page
     * sent (or deliberately stale ones); a hit carries `text`.
     */
    emitCache(kind, id, key, text) {
      if (kind === 'cache-hit') {
        emit(TAG + SEP + 'cache-hit' + SEP + String(id) + SEP + key + SEP + (text == null ? '' : text));
      } else {
        emit(TAG + SEP + 'cache-miss' + SEP + String(id) + SEP + key);
      }
    },
    /**
     * Inject the engine again in the same document, as a mod re-inject would
     * after a teardown. Replies are enabled again for the new session.
     */
    reinject() {
      tornDown = false;
      window.eval(engineSource());
    },
    /** Emit the mod's `teardown` message; nothing may be sent afterwards. */
    teardown() {
      tornDown = true;
      emit(TAG + SEP + 'teardown');
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
    llmRequests() {
      return httpRequests.filter((request) => request.url.indexOf('/chat/completions') !== -1);
    },
    checks: 0,
    failures: [],
    check(name, ok, detail) {
      env.checks++;
      if (ok) {
        console.log('PASS ' + name);
      } else {
        const line = name + (detail === undefined ? '' : ': ' + detail);
        env.failures.push(line);
        console.log('FAIL ' + line);
      }
    },
    report() {
      console.log('stats ' + JSON.stringify(env.api() ? env.api().stats() : {}));
      return env.failures.length;
    }
  };

  return env;
}
