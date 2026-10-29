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
   * Compact settings density: the title lives in nested spans, the description
   * is inline after the info button, and the closed select mirrors antd 6
   * (value/placeholder in `.ant-select-content` beside the search input).
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
                    <span class="sc-title-text" id="compact-title-text">Monitor</span>
                    <button type="button" data-testid="mod-setting-description" id="compact-info"
                            aria-label="Description of Monitor"><svg viewBox="0 0 16 16"><path d="M0 0h16v16z"/></svg></button>
                    <span class="sc-hidden" id="compact-desc">Only the windows on the switcher's monitor</span>
                  </span>
                </h4>
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
                    <span class="sc-title-text" id="compact-title-text2">Shortcut</span>
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
                    <span class="sc-title-text" id="compact-title-text3">Custom text</span>
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
                <h4 class="windhawk-row-meta-title" id="debug-title"><span class="sc-title-text">Monitor</span></h4>
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
