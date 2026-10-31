/*!
 * windhawk-ui-translator - page-side engine (P2)
 *
 * Runs inside the Windhawk 2.0 UI, injected at document-created time and again
 * on navigation completion. Self-contained ES2020 IIFE: no imports, no eval,
 * no network access; every byte leaves the page through the mod's `whtr1`
 * channel (see docs/PROTOCOL.md). Translation renders in place; pointer over a
 * block shows the original, and on touch a tap toggles that block.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0-p2';
  const TAG = 'whtr1';
  const SEP = '\x1f';

  // Attributes we own: the hidden React node, our clone and a text-node swap.
  const ATTR_ORIG = 'data-wh-orig';
  const ATTR_CLONE = 'data-wh-clone';
  const ATTR_SWAPPED = 'data-wh-swapped';
  const ATTR_UNIT = 'data-wh-unit';

  // ---------------------------------------------------------------------------
  // Tiny helpers
  // ---------------------------------------------------------------------------

  const safe = (fn, where) => {
    try {
      return fn();
    } catch (e) {
      try {
        problem(where + ': ' + (e && e.message ? e.message : e));
      } catch (_) {
        /* nothing else we can do */
      }
      return undefined;
    }
  };

  const clamp = (n, lo, hi) => {
    n = Number(n);
    if (!isFinite(n)) return lo;
    return Math.min(hi, Math.max(lo, n));
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const clean = (s) => String(s == null ? '' : s).replace(/\x1f/g, ' ');

  // Cache keys, provider requests and in-flight keys all use this normalised
  // form; the DOM keeps its own whitespace for restoring the original.
  const normalizeSource = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

  // Protocol fields: every field but the last is separator-free, so split the
  // leading fields with indexOf and leave the remainder (which may contain
  // separators) as the last field.
  const splitFields = (s, count) => {
    const out = [];
    let at = 0;
    for (let i = 0; i < count - 1; i++) {
      const next = s.indexOf(SEP, at);
      if (next === -1) {
        if (at < s.length || out.length) out.push(s.slice(at));
        return out;
      }
      out.push(s.slice(at, next));
      at = next + 1;
    }
    out.push(s.slice(at));
    return out;
  };

  const hash32 = (s) => {
    // FNV-1a, 32 bit; used for in-session source identity.
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= s.length;
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  const hash32b = (s) => {
    // djb2-xor, 32 bit; independent of hash32, so the pair is 64 bits.
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h, 33) ^ s.charCodeAt(i);
    }
    h ^= s.length;
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  const hash64 = (s) => hash32(s) + hash32b(s);

  const idle = (fn) => {
    if (typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(fn, { timeout: 500 });
    }
    return setTimeout(() => fn({ timeRemaining: () => 8, didTimeout: true }), 16);
  };

  const CHANNEL = () => {
    try {
      return (window.chrome && window.chrome.webview) || null;
    } catch (_) {
      return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Settings, state, diagnostics
  // ---------------------------------------------------------------------------

  function defaultSettings() {
    return {
      targetLang: 'auto',
      provider: 'auto',
      llmBaseUrl: '',
      llmModel: '',
      llmKeySource: 'none',
      glossary: [],
      scopeReadme: true,
      scopeSettings: true,
      scopeModName: true,
      scopeModSummary: true,
      scopeChangelog: true,
      hoverDelayMs: 120,
      shortcutToggle: 'Alt+Q',
      gestureToggle: true,
      batchSize: 20,
      batchChars: 10000,
      batchIntervalMs: 400,
      concurrency: 4,
      timeoutMs: 30000,
      cacheEnabled: true,
      cacheTtlDays: 30,
      clearCache: false
    };
  }

  const state = {
    settings: defaultSettings(),
    settingsSeen: false,
    settingsCount: 0,
    connected: false,
    enabled: true,
    // Set by `teardown`: the mod is unloading, so nothing may be sent to it.
    dead: false,
    targetLang: '',
    provider: 'edge',
    // Set once an LLM batch failed: the rest of the session stays on Edge.
    llmFallback: false,
    llmWarned: false,
    googleWarned: false,
    epoch: 0,
    units: new Set(),
    unitByHost: new WeakMap(),
    unitByDisplay: new WeakMap(),
    // Host -> (slot + text -> Text). A protected changelog token is rendered
    // through the ordinary placeholder refs; keeping the text nodes stable
    // means a rescan does not look like a changed unit.
    literalRefs: new WeakMap(),
    written: new WeakMap(), // Text node -> value we wrote last
    origText: new WeakMap(), // Text node -> last known React-authored value
    nextUnitId: 1,
    nextRequestId: 1,
    pending: new Map(),
    // Request id -> { id, key, entry, timer } whose `cache-get` reply is still
    // outstanding. Matching on the id as well as the key keeps a late reply
    // from resolving a newer lookup for the same string. The deadline turns a
    // silent mod into a normal miss.
    cacheLookups: new Map(),
    // Keys with an outstanding lookup; a second string with the same key is
    // translated normally instead of sharing an ambiguous request.
    cacheLookupKeys: new Set(),
    // One warning per session when the cache stops answering.
    cacheWarned: false,
    // Normalised source -> shared translation entry, so a distinct string is
    // requested once per epoch.
    textEntries: new Map(),
    queue: [],
    inflight: 0,
    flushTimer: 0,
    scanTimer: 0,
    settingsTimer: 0,
    observer: null,
    messageListener: null,
    renderQueue: new Set(),
    renderScheduled: false,
    scanQueue: null,
    scanScheduled: false,
    shortcuts: { toggle: null },
    settingsAttempts: 0,
    stats: {
      scans: 0,
      scannedHosts: 0,
      requests: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      batches: 0,
      batchesFailed: 0,
      translations: 0,
      startedAt: Date.now()
    }
  };

  // The object exposed as window.__WHTR__; teardown deletes it so a later
  // injection in the same document can build a fresh engine.
  let publicApi = null;

  function log(msg) {
    send(TAG + SEP + 'log' + SEP + clean(msg).slice(0, 500));
  }

  function problem(msg) {
    log('whtr: ' + clean(msg));
  }

  function send(text) {
    if (state.dead) return false;
    const wv = CHANNEL();
    if (!wv) return false;
    try {
      wv.postMessage(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  function snapshot() {
    let translated = 0;
    let rendered = 0;
    for (const u of state.units) {
      if (u.translatedOk) translated++;
      if (u.rendered) rendered++;
    }
    return {
      version: VERSION,
      enabled: state.enabled,
      settingsSeen: state.settingsSeen,
      connected: state.connected,
      targetLang: state.targetLang,
      provider: state.provider,
      activeProvider: activeProvider(),
      llmFallback: state.llmFallback,
      units: state.units.size,
      translated: translated,
      rendered: rendered,
      queued: state.queue.length,
      inflight: state.inflight,
      requests: state.stats.requests,
      errors: state.stats.errors,
      scans: state.stats.scans,
      scannedHosts: state.stats.scannedHosts,
      cacheHits: state.stats.cacheHits,
      cacheMisses: state.stats.cacheMisses,
      uptimeMs: Date.now() - state.stats.startedAt
    };
  }

  // ---------------------------------------------------------------------------
  // HTTP through the mod
  // ---------------------------------------------------------------------------

  function httpRequest(opts) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      try {
        if (state.dead) {
          done({ status: 0, body: '', error: -1 });
          return;
        }
        const wv = CHANNEL();
        if (!wv) {
          done({ status: 0, body: '', error: -1 });
          return;
        }
        const method = String((opts && opts.method) || 'GET').toUpperCase();
        const url = String((opts && opts.url) || '');
        if (!url) {
          done({ status: 0, body: '', error: -1 });
          return;
        }
        const body = String(opts && opts.body != null ? opts.body : '');
        const id = state.nextRequestId++;

        const ms = clamp(state.settings.timeoutMs, 1000, 120000) || 30000;
        const timer = setTimeout(() => {
          if (!state.pending.has(id)) return;
          state.pending.delete(id);
          state.stats.errors++;
          done({ status: 0, body: '', error: -2 });
        }, ms);

        state.pending.set(id, { resolve: done, timer: timer });
        state.stats.requests++;
        // Protocol v2: no headers. The mod sets Content-Type and, for the LLM
        // host only, Authorization (docs/PROTOCOL.md).
        wv.postMessage([TAG, 'http', String(id), method, url, body].join(SEP));
      } catch (e) {
        state.stats.errors++;
        done({ status: 0, body: '', error: -3 });
      }
    });
  }

  function onHttpReply(parts) {
    // parts: [tag, 'http', id, status, error, body]
    const id = Number(parts[2]);
    const entry = state.pending.get(id);
    if (!entry) return;
    state.pending.delete(id);
    try {
      clearTimeout(entry.timer);
    } catch (_) {
      /* ignore */
    }
    const status = Number(parts[3]);
    const error = Number(parts[4]);
    const body = parts[5] == null ? '' : parts[5];
    entry.resolve({
      status: isFinite(status) ? status : 0,
      error: isFinite(error) ? error : -1,
      body: body
    });
  }

  // ---------------------------------------------------------------------------
  // Shortcuts
  // ---------------------------------------------------------------------------

  const NAMED_CODES = {
    space: 'Space',
    escape: 'Escape',
    esc: 'Escape',
    enter: 'Enter',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
    insert: 'Insert',
    home: 'Home',
    end: 'End',
    pageup: 'PageUp',
    pagedown: 'PageDown',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
    '`': 'Backquote',
    '-': 'Minus',
    '=': 'Equal',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    ';': 'Semicolon',
    "'": 'Quote',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash'
  };

  function parseShortcut(text) {
    const s = String(text == null ? '' : text).trim();
    if (!s) return null;
    const want = { ctrl: false, alt: false, shift: false, meta: false };
    const codes = new Set();
    for (const raw of s.split('+')) {
      const token = raw.trim();
      if (!token) continue;
      const low = token.toLowerCase();
      if (low === 'ctrl' || low === 'control') {
        want.ctrl = true;
        continue;
      }
      if (low === 'alt' || low === 'option') {
        want.alt = true;
        continue;
      }
      if (low === 'shift') {
        want.shift = true;
        continue;
      }
      if (low === 'meta' || low === 'win' || low === 'cmd' || low === 'command') {
        want.meta = true;
        continue;
      }
      if (/^f([1-9]|1[0-9]|2[0-4])$/.test(low)) {
        codes.add('F' + low.slice(1));
      } else if (/^[a-z]$/.test(low)) {
        codes.add('Key' + low.toUpperCase());
      } else if (/^[0-9]$/.test(low)) {
        codes.add('Digit' + low);
      } else if (NAMED_CODES[low]) {
        codes.add(NAMED_CODES[low]);
      } else if (low.length > 1) {
        codes.add(token);
      }
    }
    if (!codes.size) return null;
    return { want: want, codes: codes };
  }

  function shortcutMatches(combo, e) {
    if (!combo) return false;
    if (!!e.ctrlKey !== combo.want.ctrl) return false;
    if (!!e.altKey !== combo.want.alt) return false;
    if (!!e.shiftKey !== combo.want.shift) return false;
    if (!!e.metaKey !== combo.want.meta) return false;
    return combo.codes.has(e.code);
  }

  function isTypingTarget(target) {
    if (!target || target.nodeType !== 1) return false;
    try {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return true;
      if (target.isContentEditable) return true;
      if (target.closest('.cm-editor, .monaco-editor, [contenteditable], [role="textbox"]')) return true;
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  function onKeyDown(e) {
    if (!e || e.repeat) return;
    if (isTypingTarget(e.target)) return;
    try {
      if (isTypingTarget(document.activeElement)) return;
    } catch (_) {
      /* ignore */
    }
    try {
      if (shortcutMatches(state.shortcuts.toggle, e)) {
        e.preventDefault();
        setEnabled(!state.enabled);
      }
    } catch (err) {
      problem('shortcut: ' + (err && err.message ? err.message : err));
    }
  }

  // ---------------------------------------------------------------------------
  // Scanning
  // ---------------------------------------------------------------------------

  const PROSE_SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th';
  // Block-level elements that make a prose host "mixed": it owns text and also
  // wraps other blocks, which are translated as their own units.
  const BLOCK_TAGS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DETAILS', 'DIV', 'DL',
    'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2',
    'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P',
    'PRE', 'SECTION', 'SUMMARY', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH',
    'THEAD', 'TR', 'UL'
  ]);
  // Closed select hosts. antd 6 renders a single select's value as a text node
  // in `.ant-select-content` (which also carries `title` and the search input);
  // `.ant-select-selection-item` remains for antd 5 and multiple/tags mode.
  const SELECT_HOST_SELECTORS = [
    '.ant-select-single .ant-select-content',
    '.ant-select-content-value',
    '.ant-select-placeholder',
    '.ant-select-selection-item',
    '.ant-select-selection-placeholder'
  ];
  // A setting description. Inside the compact title row it belongs to the
  // tooltip, not the title unit; the visible portal copy translates normally.
  const DESC_TEXT_SEL = '[data-testid="mod-setting-description-text"]';
  // The collapsed current-value summary ("Non-default"): a string of its own.
  const SUMMARY_TEXT_SEL = '[data-testid="mod-setting-summary"]';
  const TITLE_SEL = '.windhawk-row-meta-title';
  // styled-components keeps the component name as the class prefix, so a
  // substring match survives the generated suffix.
  const TITLE_TEXT_SEL = '[class*="SettingTitleText"]';
  const SETTINGS_SELECTORS = [
    DESC_TEXT_SEL,
    // Claimed before the title host so a summary nested in the title row stays
    // its own unit.
    SUMMARY_TEXT_SEL,
    '.ant-select-item-option-content',
    // Only the text of a closed control's value/placeholder is swapped; the
    // search input stays atomic.
    ...SELECT_HOST_SELECTORS,
    // Claimed before the title host so a copy nested in the title row is its
    // own unit; the title reads only the title text.
    '.windhawk-row-meta-description',
    '.windhawk-row-meta-title',
    '[data-testid="mod-setting-reset"]'
  ];
  // Mod names: installed-list row title, tile Card.Meta title and the details
  // header's name div. On a tile only the Typography inside the mod-card-title
  // box is the name; the ribbon, local-mod icon and metadata line are siblings.
  const NAME_LIST_SELECTORS = ['.windhawk-row-meta-title', '.ant-card-meta-title'];
  const MOD_CARD_TITLE_SEL = '[data-testid="mod-card-title"]';
  // Never part of a name unit: an icon, the status ribbon, a metadata line.
  const NAME_IMPURE_SEL =
    'svg,[class*="ant-ribbon"],[class*="MetadataLine"],[data-testid*="metadata"]';
  // Mod summaries: tile/table descriptions and the details header Typography.
  const SUMMARY_LIST_SELECTORS = [
    '.windhawk-row-meta-description',
    '.ant-card-meta-description',
    '.ant-typography'
  ];
  const MODS_TABLE_SEL = '[data-testid="installed-mods-table"]';
  const ROW_SELECT_SEL = '[data-testid="mod-row-select"]';
  // The aggregated update wizard and the changelog dialog it opens. Both are
  // antd modals portaled to the document root, so they are scanned as their own
  // surfaces rather than through the details page. The wizard table is a CSS
  // grid with ARIA roles, not an antd table: the mod name is the first div in
  // the second cell of a `mod-update-row`; the last cell holds the button. The
  // dialog title repeats the mod name; the changelog body is the only prose
  // container (the sibling "changes" tab is a diff view, not markdown).
  const UPDATE_WIZARD_SEL = '[data-testid="mod-updates-modal"]';
  const UPDATE_DETAILS_MODAL_SEL = '[data-testid="mod-update-details-modal"]';
  // The single-mod run: its antd title is the mod name while the install runs
  // and after it ends, so it is a name host like the dialog's title.
  const UPDATE_RUN_MODAL_SEL = '[data-testid="mod-update-run-modal"]';
  const UPDATE_ROW_SEL = '[data-testid="mod-update-row"]';
  const UPDATE_CHANGELOG_SEL = '[data-testid="mod-update-changelog-content"]';

  // Subtrees left alone; everything else is an inline wrapper or an atomic
  // placeholder (see serializeHost).
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'BASE', 'TITLE']);
  const ATOMIC_TAGS = new Set([
    'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'IMG', 'BR', 'HR', 'SVG', 'MATH',
    'VIDEO', 'AUDIO', 'CANVAS', 'IFRAME', 'OBJECT', 'EMBED', 'BUTTON',
    'WBR', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'PROGRESS', 'METER',
    'COLGROUP', 'COL'
  ]);
  const STRUCT_TAGS = new Set([
    'A', 'SPAN', 'EM', 'STRONG', 'B', 'I', 'U', 'MARK', 'SMALL', 'SUP',
    'SUB', 'ABBR', 'DEL', 'INS', 'Q', 'CITE', 'TIME', 'BDI', 'BDO', 'FONT',
    'LABEL', 'RUBY', 'RT', 'RP', 'S'
  ]);
  const DENY_ANCESTOR_SEL =
    'script,style,noscript,template,textarea,input,select,option,code,pre,kbd,' +
    '.cm-editor,.monaco-editor,[contenteditable],[translate="no"]';

  const CJK_RE = /[\u2e80-\u2eff\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;
  const URL_RE = /^https?:\/\/\S+$/i;
  const EMAIL_RE = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/;
  const WINPATH_RE = /^[a-z]:\\\S*$/i;
  const UNIXPATH_RE = /^(?:\.{0,2}\/|\/)[\w./\\-]*$/;
  const VERSION_RE = /^v?\d+(?:\.\d+){1,3}(?:[-+][\w.]+)?$/i;
  const NUMERIC_RE = /^[\d\s.,:;%+\-()[\]{}]+$/;
  const LETTER_RE = /\p{L}/u;
  // Dates written the way changelog headings write them: "Oct 30, 2026",
  // "30 October 2026", "2026-10-30". A standalone date is not prose.
  const MONTH_SRC =
    '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|' +
    'Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const DATE_SRC =
    '(?:' + MONTH_SRC + '\\s+\\d{1,2},?\\s+\\d{4}|' +
    '\\d{1,2}\\s+' + MONTH_SRC + '\\s+\\d{4}|' +
    '\\d{4}-\\d{2}-\\d{2})';
  const DATE_RE = new RegExp('^' + DATE_SRC + '$', 'i');
  // A changelog heading carries a version and a date beside its prose. These
  // tokens are lifted out of the source as placeholders so a provider cannot
  // reword or reorder them (see protectPieces).
  const PROTECT_RE = new RegExp(
    '\\b(?:' + DATE_SRC + ')\\b|\\bv?\\d+(?:\\.\\d+){1,3}(?:[-+][\\w.]+)?\\b',
    'gi'
  );

  function isTranslatable(src) {
    if (typeof src !== 'string') return false;
    const t = src.replace(/\s+/g, ' ').trim();
    if (t.length < 2) return false;
    if (CJK_RE.test(t)) return false;
    if (!LETTER_RE.test(t)) return false;
    if (URL_RE.test(t)) return false;
    if (EMAIL_RE.test(t)) return false;
    if (WINPATH_RE.test(t)) return false;
    if (UNIXPATH_RE.test(t)) return false;
    if (VERSION_RE.test(t)) return false;
    if (DATE_RE.test(t)) return false;
    if (NUMERIC_RE.test(t)) return false;
    return true;
  }

  function scopeEnabled(surface) {
    const s = state.settings;
    if (surface === 'readme') return !!s.scopeReadme;
    if (surface === 'changelog') return !!s.scopeChangelog;
    if (surface === 'settings') return !!s.scopeSettings;
    if (surface === 'name') return !!s.scopeModName;
    if (surface === 'summary') return !!s.scopeModSummary;
    return !!s.scopeModSummary;
  }

  function classifyProse(body) {
    let node = body;
    for (let i = 0; node && i < 14; i++, node = node.parentElement) {
      let testid = '';
      try {
        testid = node.getAttribute('data-testid') || '';
      } catch (_) {
        testid = '';
      }
      if (/changelog|changes|version-history|release-notes/i.test(testid)) return 'changelog';
    }
    const card = body.closest ? body.closest('.ant-card') : null;
    const head = card ? card.querySelector('.ant-card-head-title, .ant-card-head') : null;
    if (head && /changelog|what'?s new|change ?log|history|\u66f4\u65b0|\u53d8\u66f4|\u5386\u53f2/i.test(head.textContent || '')) {
      return 'changelog';
    }
    const pane = body.closest ? body.closest('[role="tabpanel"]') : null;
    if (pane) {
      const labelled = pane.getAttribute('aria-labelledby');
      const tab = labelled ? document.getElementById(labelled) : null;
      if (tab && /changelog|changes|history|\u66f4\u65b0|\u53d8\u66f4|\u5386\u53f2/i.test(tab.textContent || '')) return 'changelog';
    }
    return 'readme';
  }

  function isUpdateModalHost(el) {
    try {
      return !!el.closest(
        UPDATE_WIZARD_SEL + ',' + UPDATE_DETAILS_MODAL_SEL + ',' + UPDATE_RUN_MODAL_SEL
      );
    } catch (_) {
      return false;
    }
  }

  function compactSurface(el) {
    try {
      // The update wizard is a list surface even though it is an antd modal:
      // its table cells hold mod names and the dialog header repeats the name.
      if (isUpdateModalHost(el)) return 'list';
      if (el.closest('[data-testid*="setting"], .ant-select-dropdown, .ant-modal, .ant-drawer, .ant-form')) {
        return 'settings';
      }
      const row = el.closest('.windhawk-row');
      if (
        row &&
        row.querySelector(
          '.ant-select,.ant-switch,.ant-input,.ant-btn,[data-testid="mod-setting-reset"],' +
          '[data-testid="mod-setting-description"],[data-testid="mod-setting-description-text"]'
        )
      ) {
        return 'settings';
      }
    } catch (_) {
      /* ignore */
    }
    return 'list';
  }

  function hasText(el) {
    try {
      return (el.textContent || '').trim().length >= 2;
    } catch (_) {
      return false;
    }
  }

  function settingsRejectReason(el) {
    try {
      if (el.closest('[' + ATTR_CLONE + '="1"]')) return 'inside our clone';
      if (el.closest(DENY_ANCESTOR_SEL)) return 'denied ancestor';
    } catch (_) {
      return 'unreadable';
    }
    if (!eligibleHost(el)) return 'card head';
    if (compactSurface(el) !== 'settings') return 'not a settings surface';
    // Inline wrappers are flattened by the serializer; only a host with no text
    // at all is skipped.
    if (!hasText(el)) return hasDirectText(el) ? 'no text' : 'no direct text';
    return '';
  }

  // The details header packs the mod name, id chip, metadata line and buttons
  // into one subtree. Only its summary Typography is prose, so the card-head
  // rule wins over every other selector.
  function isCardHeadHost(el) {
    try {
      return !!el.closest('.ant-card-head');
    } catch (_) {
      return false;
    }
  }

  function isTypography(el) {
    try {
      return !!el.matches('.ant-typography');
    } catch (_) {
      return false;
    }
  }

  // Metadata rows are Typography too but carry an icon and are proper nouns.
  // Only inside the card head does that disqualify a host.
  function hasSvgIcon(el) {
    try {
      return !!el.querySelector('svg');
    } catch (_) {
      return false;
    }
  }

  // A name unit is name text only: no icon, no status ribbon, no metadata line
  // text. Checked when a host is resolved and again before a unit is made.
  function nameHostClean(el) {
    if (!el || el.nodeType !== 1) return false;
    try {
      if (el.matches(NAME_IMPURE_SEL)) return false;
      if (el.closest('[class*="MetadataLine"],[data-testid*="metadata"]')) return false;
      if (el.querySelector(NAME_IMPURE_SEL)) return false;
    } catch (_) {
      return false;
    }
    return true;
  }

  // The details header's name is the first bare div in the meta title that owns
  // text directly; the metadata items hold theirs in icon-bearing spans.
  function headerNameHost(meta) {
    let divs = [];
    try {
      divs = Array.from(meta.querySelectorAll('div'));
    } catch (_) {
      divs = [];
    }
    for (const el of divs) {
      if (el.closest('.ant-typography')) continue;
      if (!hasDirectText(el)) continue;
      if (!hasText(el)) continue;
      if (!nameHostClean(el)) continue;
      return el;
    }
    return null;
  }

  // A tile's Card.Meta title: the name is the EllipsisText Typography inside
  // the mod-card-title box. The ribbon, local-mod icon and metadata line sit
  // beside it and must never join the unit.
  function tileNameHost(meta) {
    let box = null;
    try {
      box = meta.querySelector(MOD_CARD_TITLE_SEL);
    } catch (_) {
      box = null;
    }
    let typo = null;
    try {
      typo = (box || meta).querySelector('.ant-typography');
    } catch (_) {
      typo = null;
    }
    if (typo && typo !== meta && nameHostClean(typo)) return typo;
    // The older shape puts the name straight in the meta title; use it only
    // when it carries nothing but the name.
    if (!box && nameHostClean(meta)) return meta;
    return null;
  }

  // One resolver for every name surface: installed-list row title, tile name,
  // details header name.
  function resolveNameHost(el) {
    if (!el || el.nodeType !== 1) return null;
    try {
      if (el.matches('.windhawk-row-meta-title')) return nameHostClean(el) ? el : null;
      if (el.matches('.ant-card-meta-title')) {
        if (el.closest('.ant-card-head') || el.closest('[data-testid="mod-details"]')) {
          return headerNameHost(el);
        }
        return tileNameHost(el);
      }
    } catch (_) {
      return null;
    }
    return nameHostClean(el) ? el : null;
  }

  function detailsNameHosts() {
    const out = [];
    let metas = [];
    try {
      metas = Array.from(
        document.querySelectorAll(
          '.ant-card-head .ant-card-meta-title, [data-testid="mod-details"] .ant-card-meta-title'
        )
      );
    } catch (_) {
      return out;
    }
    for (const meta of metas) {
      const el = resolveNameHost(meta);
      if (el) out.push(el);
    }
    return out;
  }

  // The update wizard's table names and the changelog dialog title. The name is
  // the first div in the row's second cell (a failed source adds a note after
  // it); the dialog title is antd's `.ant-modal-title`. Both are swap hosts.
  function updateNameHosts() {
    const out = [];
    let rows = [];
    try {
      rows = Array.from(document.querySelectorAll(UPDATE_ROW_SEL));
    } catch (_) {
      rows = [];
    }
    for (const row of rows) {
      const cell = row.children && row.children[1];
      const name = cell && cell.firstElementChild;
      if (!name || name.tagName !== 'DIV') continue;
      if (!nameHostClean(name) || !hasText(name)) continue;
      out.push(name);
    }
    try {
      for (const modal of document.querySelectorAll(
        UPDATE_DETAILS_MODAL_SEL + ',' + UPDATE_RUN_MODAL_SEL
      )) {
        const title = modal.querySelector('.ant-modal-title');
        if (title && nameHostClean(title) && hasText(title)) out.push(title);
      }
    } catch (_) {
      /* ignore */
    }
    return out;
  }

  // Every name surface: tile/explore titles, table name link, details name div.
  // Settings titles share the row-title class and are kept out by compactSurface.
  function nameHosts() {
    const out = [];
    const add = (el) => {
      if (el && out.indexOf(el) === -1) out.push(el);
    };
    try {
      for (const a of document.querySelectorAll(MODS_TABLE_SEL + ' tbody a')) add(resolveNameHost(a));
    } catch (_) {
      /* ignore */
    }
    try {
      for (const box of document.querySelectorAll(ROW_SELECT_SEL)) {
        const cell = box.closest('td');
        if (cell) add(resolveNameHost(cell.querySelector('a')));
      }
    } catch (_) {
      /* ignore */
    }
    for (const sel of NAME_LIST_SELECTORS) {
      try {
        for (const el of document.querySelectorAll(sel)) {
          // A title inside a card head is header metadata, not a mod name.
          if (el.closest('.ant-card-head')) continue;
          add(resolveNameHost(el));
        }
      } catch (_) {
        /* ignore */
      }
    }
    for (const el of detailsNameHosts()) add(el);
    for (const el of updateNameHosts()) add(el);
    return out;
  }

  function summaryHosts() {
    const out = [];
    for (const sel of SUMMARY_LIST_SELECTORS) {
      try {
        for (const el of document.querySelectorAll(sel)) {
          // A tile's name Typography is never a summary, even with the name
          // scope off.
          if (sel === '.ant-typography' && el.closest(MOD_CARD_TITLE_SEL)) continue;
          if (out.indexOf(el) === -1) out.push(el);
        }
      } catch (_) {
        /* ignore */
      }
    }
    return out;
  }

  function eligibleHost(el, kind) {
    if (!el || el.nodeType !== 1) return false;
    if (!isCardHeadHost(el)) return true;
    if (kind === 'name') return !isTypography(el) && !hasSvgIcon(el);
    return isTypography(el) && !hasSvgIcon(el);
  }

  function hasDirectText(el) {
    try {
      for (let n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3 && /\S/.test(n.nodeValue || '')) return true;
      }
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  function hasBlockChild(el, atomic, skipAria) {
    try {
      for (let n = el.firstElementChild; n; n = n.nextElementSibling) {
        // A claimed descendant or the excluded screen-reader copy is a
        // placeholder, not a block that makes this wrapper a container.
        if (atomic && atomic.has(n)) continue;
        if (isAriaCopy(n, skipAria)) continue;
        if (BLOCK_TAGS.has(n.tagName)) return true;
      }
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  // Own sentence plus nested blocks: cloning would duplicate the nested items.
  function isMixedProseHost(el) {
    return hasDirectText(el) && hasBlockChild(el);
  }

  // Collect the prose blocks of one container. The details page uses it for
  // README/changelog card bodies; the update wizard's changelog dialog uses it
  // for `mod-update-changelog-content`, which is already known to be changelog
  // prose (the sibling "changes" tab is a diff view and is never scanned).
  function collectProseCandidates(body, surface, claim, claimSwap, candidates) {
    if (!scopeEnabled(surface)) return;
    let blocks = [];
    try {
      blocks = Array.from(body.querySelectorAll(PROSE_SEL));
    } catch (_) {
      blocks = [];
    }
    const mixed = [];
    for (const block of blocks) {
      if (block.closest('[' + ATTR_CLONE + '="1"]')) continue;
      if (block.closest(DENY_ANCESTOR_SEL)) continue;
      // A settings row inside the card body belongs to the swap pass, never a clone.
      if (
        block.closest('.windhawk-row') ||
        block.matches('.windhawk-row-meta-title, .windhawk-row-meta-description')
      ) {
        continue;
      }
      if (!eligibleHost(block)) continue;
      // Own sentence plus nested blocks: swap only the host's own text.
      if (isMixedProseHost(block)) {
        mixed.push(block);
        continue;
      }
      // Keep only the innermost block so a <li><p> pair is not rendered twice.
      try {
        if (block.querySelector(PROSE_SEL)) continue;
      } catch (_) {
        /* ignore */
      }
      if (!hasText(block)) continue;
      if (!claim(block)) continue;
      candidates.push({ el: block, mode: 'clone', surface: surface });
    }
    // Deepest first: each keeps the nested blocks as atomic placeholders.
    for (let i = mixed.length - 1; i >= 0; i--) {
      const block = mixed[i];
      if (!hasText(block)) continue;
      const atomic = claimSwap(block);
      if (!atomic) continue;
      candidates.push({ el: block, mode: 'swap', surface: surface, atomic: atomic });
    }
  }

  function scanAll() {
    if (state.dead) return;
    // The document-created injection may run before <head> exists.
    installCss();
    if (!state.enabled || !state.settingsSeen) return;
    state.stats.scans++;
    pruneUnits();

    const claimed = [];
    const candidates = [];
    const claim = (el) => {
      for (const host of claimed) {
        if (host === el) return false;
        if (host.contains(el) || el.contains(host)) return false;
      }
      claimed.push(el);
      return true;
    };
    // A swap host may contain units claimed before it (deepest first); those
    // stay atomic placeholders and are never translated twice.
    const claimSwap = (el) => {
      for (const host of claimed) {
        if (host === el || host.contains(el)) return null;
      }
      const atomic = [];
      for (const host of claimed) {
        if (el.contains(host)) atomic.push(host);
      }
      claimed.push(el);
      return atomic;
    };
    // A control nested in a claimed host (the reset button) gets its own unit.
    const claimInner = (el) => {
      for (const host of claimed) {
        if (host === el) return false;
        if (el.contains(host)) return false;
      }
      claimed.push(el);
      return true;
    };

    // README / changelog prose: React owns the nodes, so render a translated clone.
    if (state.settings.scopeReadme || state.settings.scopeChangelog) {
      let bodies = [];
      try {
        bodies = Array.from(document.querySelectorAll('[data-testid="mod-details"] .ant-card-body'));
      } catch (_) {
        bodies = [];
      }
      for (const body of bodies) {
        collectProseCandidates(body, classifyProse(body), claim, claimSwap, candidates);
      }
    }

    // The update wizard's changelog dialog lives in a portal outside the details
    // page. Its container is explicit, so the surface is forced to changelog and
    // the sibling "changes" diff tab is left alone.
    if (scopeEnabled('changelog')) {
      let contents = [];
      try {
        contents = Array.from(document.querySelectorAll(UPDATE_CHANGELOG_SEL));
      } catch (_) {
        contents = [];
      }
      for (const content of contents) {
        collectProseCandidates(content, 'changelog', claim, claimSwap, candidates);
      }
    }

    // Settings surfaces: text-node swap, never a clone.
    if (state.settings.scopeSettings) {
      for (const sel of SETTINGS_SELECTORS) {
        let list = [];
        try {
          list = Array.from(document.querySelectorAll(sel));
        } catch (_) {
          list = [];
        }
        for (const el of list) {
          // A hidden copy nested in a title is never its own unit; the visible
          // tooltip portal outside the title is claimed like any description.
          if (sel === DESC_TEXT_SEL && el.closest(TITLE_SEL)) continue;
          const reason = settingsRejectReason(el);
          if (reason) continue;
          // A title with no text but the excluded copy gets no unit.
          if (isTitleHost(el) && !isTranslatable(normalizeSource(titleHostText(el, claimed)))) continue;
          const atomic = claimSwap(el);
          if (!atomic) continue;
          candidates.push({ el: el, mode: 'swap', surface: 'settings', atomic: atomic });
        }
      }
      // The reset button is an atomic token in the title's source; give its
      // label a nested unit so it translates too.
      let resets = [];
      try {
        resets = Array.from(document.querySelectorAll('[data-testid="mod-setting-reset"]'));
      } catch (_) {
        resets = [];
      }
      for (const el of resets) {
        if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
        if (el.closest(DENY_ANCESTOR_SEL)) continue;
        if (!eligibleHost(el)) continue;
        if (compactSurface(el) !== 'settings') continue;
        if (!hasText(el)) continue;
        if (!claimInner(el)) continue;
        candidates.push({ el: el, mode: 'swap', surface: 'settings' });
      }
    }

    // Mod names: swap mode keeps the link/div and replaces only its text node.
    if (scopeEnabled('name')) {
      for (const el of nameHosts()) {
        if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
        if (el.closest(DENY_ANCESTOR_SEL)) continue;
        if (!eligibleHost(el, 'name')) continue;
        if (compactSurface(el) !== 'list') continue;
        if (!hasText(el)) continue;
        const atomic = claimSwap(el);
        if (!atomic) continue;
        candidates.push({ el: el, mode: 'swap', surface: 'name', atomic: atomic });
      }
    }

    // Mod summaries: same swap rule.
    if (scopeEnabled('summary')) {
      for (const el of summaryHosts()) {
        if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
        if (el.closest(DENY_ANCESTOR_SEL)) continue;
        if (!eligibleHost(el, 'summary')) continue;
        if (compactSurface(el) !== 'list') continue;
        if (!hasText(el)) continue;
        const atomic = claimSwap(el);
        if (!atomic) continue;
        candidates.push({ el: el, mode: 'swap', surface: 'summary', atomic: atomic });
      }
    }

    state.stats.scannedHosts += candidates.length;
    state.scanQueue = { items: candidates, at: 0, epoch: state.epoch };
    scheduleScanChunk();
  }

  function scheduleScanChunk() {
    if (state.scanScheduled || state.dead) return;
    state.scanScheduled = true;
    idle((deadline) => {
      state.scanScheduled = false;
      safe(() => runScanChunk(deadline), 'scan-chunk');
    });
  }

  function runScanChunk(deadline) {
    if (!state.enabled) {
      state.scanQueue = null;
      return;
    }
    const queue = state.scanQueue;
    if (!queue) return;
    if (queue.epoch !== state.epoch) {
      state.scanQueue = null;
      return;
    }
    let n = 0;
    while (queue.at < queue.items.length) {
      const item = queue.items[queue.at++];
      if (item && item.el && item.el.isConnected) {
        safe(() => processHost(item.el, item.mode, item.surface, item.atomic), 'scan-host');
      }
      n++;
      const left = deadline && typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 8;
      if (n >= 25 || left < 2) break;
    }
    if (queue.at < queue.items.length) scheduleScanChunk();
    else if (state.scanQueue === queue) state.scanQueue = null;
  }

  function scheduleScan(delay) {
    if (state.dead) return;
    if (state.scanTimer) clearTimeout(state.scanTimer);
    state.scanTimer = setTimeout(() => {
      state.scanTimer = 0;
      safe(scanAll, 'scan');
    }, Math.max(0, delay || 0));
  }

  function pruneUnits() {
    for (const u of Array.from(state.units)) {
      if (!u.el || !u.el.isConnected) dropUnit(u);
    }
  }

  // ---------------------------------------------------------------------------
  // Serialization: text with placeholders
  //
  // clone mode: <n>inner</n> structural wrapper, {{n}} atomic node
  // swap mode:  {{n}} only; inline wrappers are flattened into text
  // ---------------------------------------------------------------------------

  function isSkippedElement(el) {
    if (!el || el.nodeType !== 1) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.matches('.cm-editor, .monaco-editor, [contenteditable], [translate="no"]')) return true;
    return false;
  }

  function isAtomicElement(el) {
    if (ATOMIC_TAGS.has(el.tagName)) return true;
    if (el.matches('.cm-editor, .monaco-editor, [contenteditable], [translate="no"]')) return true;
    return false;
  }

  // Swap mode treats inline wrappers as text flow (a title span, a select's
  // value span); clone mode keeps structural markup.
  function isInlineWrapper(el, mode, atomic, skipAria) {
    if (STRUCT_TAGS.has(el.tagName)) return true;
    if (mode !== 'swap') return false;
    if (!BLOCK_TAGS.has(el.tagName)) return true;
    // A bare div used as a label line is still part of the text flow.
    return el.tagName === 'DIV' && !hasBlockChild(el, atomic, skipAria);
  }

  // A setting title host: only its title text is the unit.
  function isTitleHost(el) {
    try {
      return !!el.matches(TITLE_SEL);
    } catch (_) {
      return false;
    }
  }

  // The hidden description copy duplicates the tooltip; inside a title it is
  // dropped from the source entirely, not even emitted as a placeholder.
  function isAriaCopy(el, hostIsTitle) {
    try {
      if (!el.matches(DESC_TEXT_SEL)) return false;
      return hostIsTitle || !!el.closest(TITLE_SEL);
    } catch (_) {
      return false;
    }
  }

  // The title text span inside the row; the closest-title check keeps a nested
  // row's title from being taken for this row's.
  function titleTextHost(host) {
    try {
      const el = host.querySelector(TITLE_TEXT_SEL);
      if (el && el !== host && el.closest(TITLE_SEL) === host && !isTitleExtra(el)) return el;
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  // Row content that shares the title row but never joins the title text.
  function isTitleExtra(el) {
    try {
      return !!el.closest(SUMMARY_TEXT_SEL) || !!el.closest('[data-testid="mod-setting-reset"]');
    } catch (_) {
      return false;
    }
  }

  // Walk the title text span, or the host's direct text when there is none.
  // Claimed descendants are skipped: they never become a placeholder here.
  function walkTitleText(root, directOnly, onText, atomic) {
    const atomics = atomic && atomic.length ? new Set(atomic) : null;
    const visit = (node) => {
      for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3) {
          onText(child, child.nodeValue || '');
          continue;
        }
        if (child.nodeType !== 1) continue;
        if (directOnly) continue;
        if (atomics && atomics.has(child)) continue;
        if (isSkippedElement(child)) continue;
        if (isAtomicElement(child)) continue;
        if (isAriaCopy(child, true)) continue;
        if (isTitleExtra(child)) continue;
        visit(child);
      }
    };
    visit(root);
  }

  function titleHostText(host, atomic) {
    const target = titleTextHost(host);
    let text = '';
    walkTitleText(target || host, !target, (node, value) => {
      text += value;
    }, atomic);
    return text;
  }

  // Title units are text only: no refs, no placeholders.
  function serializeTitleHost(host, atomic) {
    const target = titleTextHost(host);
    const segs = [];
    let text = '';
    walkTitleText(target || host, !target, (node, value) => {
      segs.push({ kind: 'text', node: node, orig: value, out: value });
      state.origText.set(node, value);
      text += value;
    }, atomic);
    return { text: text, refs: [], segs: segs };
  }

  // Split a text run around version/date tokens. Only used for changelog
  // headings: the tokens become ordinary `{{n}}` placeholders whose ref is a
  // text node, so a provider never sees or rewrites them.
  function protectPieces(text) {
    const pieces = [];
    let last = 0;
    let m;
    PROTECT_RE.lastIndex = 0;
    while ((m = PROTECT_RE.exec(text))) {
      if (m.index > last) pieces.push({ text: text.slice(last, m.index), token: false });
      pieces.push({ text: m[0], token: true });
      last = PROTECT_RE.lastIndex;
    }
    if (last < text.length) pieces.push({ text: text.slice(last), token: false });
    return pieces;
  }

  // Stable text-node refs for protected tokens: the same host, slot and text
  // reuse the same node, so refsEqual() does not force a rebuild on every scan.
  function literalRef(host, text, slot) {
    let map = state.literalRefs.get(host);
    if (!map) {
      map = new Map();
      state.literalRefs.set(host, map);
    }
    const key = slot + '\u0000' + text;
    let node = map.get(key);
    if (!node) {
      node = document.createTextNode(text);
      map.set(key, node);
    }
    return node;
  }

  // `atomic` descendants are emitted as placeholders and never walked;
  // `skipAria` drops the hidden description copy without a placeholder.
  // `protect` lifts version/date tokens out of a changelog heading's text.
  function serializeHost(host, mode, atomic, skipAria, protect) {
    const atomics = atomic && atomic.length ? new Set(atomic) : null;
    const refs = [];
    const segs = [];
    let out = '';
    let protectSlot = 0;
    const walk = (node) => {
      let child = node.firstChild;
      while (child) {
        if (child.nodeType === 3) {
          const value = child.nodeValue || '';
          if (mode === 'swap') {
            segs.push({ kind: 'text', node: child, orig: value, out: value });
            state.origText.set(child, value);
          }
          if (protect && mode === 'clone') {
            for (const piece of protectPieces(value)) {
              if (!piece.token) {
                out += piece.text;
                continue;
              }
              const index = refs.length;
              refs.push(literalRef(host, piece.text, protectSlot++));
              out += '{{' + index + '}}';
            }
          } else {
            out += value;
          }
        } else if (child.nodeType === 1) {
          const el = child;
          if (!isSkippedElement(el) && !isAriaCopy(el, skipAria)) {
            if ((atomics && atomics.has(el)) || isAtomicElement(el)) {
              const index = refs.length;
              refs.push(el);
              out += '{{' + index + '}}';
              if (mode === 'swap') segs.push({ kind: 'token', index: index, el: el });
            } else if (isInlineWrapper(el, mode, atomics, skipAria)) {
              if (mode === 'clone') {
                const index = refs.length;
                refs.push(el);
                out += '<' + index + '>';
                walk(el);
                out += '</' + index + '>';
              } else {
                walk(el);
              }
            } else {
              const index = refs.length;
              refs.push(el);
              out += '{{' + index + '}}';
              if (mode === 'swap') segs.push({ kind: 'token', index: index, el: el });
            }
          }
        }
        child = child.nextSibling;
      }
    };
    walk(host);
    return { text: out, refs: refs, segs: segs };
  }

  function splitSerialized(src, limit) {
    if (src.length <= limit) return [src];
    const cuts = [];
    let depth = 0;
    for (let i = 0; i < src.length; ) {
      const c = src[i];
      if (c === '{' && src[i + 1] === '{') {
        const end = src.indexOf('}}', i + 2);
        if (end !== -1) {
          i = end + 2;
          continue;
        }
      }
      if (c === '<') {
        const m = /^<(\/?)(\d+)>/.exec(src.slice(i, i + 12));
        if (m) {
          depth += m[1] ? -1 : 1;
          i += m[0].length;
          continue;
        }
      }
      if (depth <= 0) {
        const boundary =
          c === '.' || c === '!' || c === '?' || c === ';' ||
          c === '\u3002' || c === '\uff01' || c === '\uff1f' || c === '\uff1b' ||
          c === '\n';
        if (boundary && /[\s"'\u201d\u2019)\]]/.test(src[i + 1] || ' ')) cuts.push(i + 1);
      }
      i++;
    }
    if (!cuts.length) return [src];

    const parts = [];
    let start = 0;
    let k = 0;
    while (src.length - start > limit) {
      let chosen = -1;
      while (k < cuts.length && cuts[k] <= start) k++;
      for (let j = k; j < cuts.length; j++) {
        if (cuts[j] - start > limit) break;
        chosen = cuts[j];
      }
      if (chosen <= start) {
        if (k < cuts.length) chosen = cuts[k];
        else break;
      }
      if (chosen <= start) break;
      parts.push(src.slice(start, chosen));
      start = chosen;
    }
    if (start < src.length) parts.push(src.slice(start));
    return parts.filter((p) => p.length > 0);
  }

  // ---------------------------------------------------------------------------
  // Units
  // ---------------------------------------------------------------------------

  function makeUnit(el, mode, surface) {
    const u = {
      id: state.nextUnitId++,
      el: el,
      mode: mode,
      surface: surface,
      source: '',
      sourceHash: '',
      leadTokens: '',
      trailTokens: '',
      refs: [],
      segs: [],
      parts: [],
      translatedOk: false,
      noop: false,
      rendered: false,
      skip: false,
      clone: null,
      hoverOrig: false,
      tapOrig: false,
      hoverTimer: 0,
      leaveTimer: 0,
      appliedShowOrig: null
    };
    state.unitByHost.set(el, u);
    state.units.add(u);
    return u;
  }

  function restoreSwapText(u) {
    if (!u || !u.segs) return;
    for (const seg of u.segs) {
      if (seg.kind !== 'text') continue;
      const node = seg.node;
      if (!node || !node.isConnected) continue;
      const orig = state.origText.has(node) ? state.origText.get(node) : seg.orig;
      // Only undo our own translation; never overwrite text React just wrote.
      if (seg.out !== orig && node.nodeValue === seg.out) {
        node.nodeValue = orig;
        state.written.set(node, orig);
      }
    }
  }

  function swapChanged(u) {
    if (!u.segs || !u.segs.length) return true;
    for (const seg of u.segs) {
      if (seg.kind !== 'text') continue;
      if (!seg.node || !seg.node.isConnected) return true;
      const value = seg.node.nodeValue;
      if (value !== seg.orig && value !== seg.out) return true;
    }
    return false;
  }

  // A closed select renders its value with the search input as an edge token
  // ("Where the mouse cursor is{{0}}"), the dropdown option without it. Both
  // must share one source and translation, so edge tokens are split off and
  // re-attached around the output; their DOM nodes never move.
  function splitEdgeTokens(text) {
    let lead = '';
    let trail = '';
    let rest = text;
    const head = /^(?:\{\{\d+\}\})+/.exec(rest);
    if (head) {
      lead = head[0];
      rest = rest.slice(lead.length);
    }
    const tail = /(?:\{\{\d+\}\})+$/.exec(rest);
    if (tail) {
      trail = tail[0];
      rest = rest.slice(0, rest.length - trail.length);
    }
    return { text: normalizeSource(rest), lead: lead, trail: trail };
  }

  // "<prefix>: <tail>" whose tail is an option label with a known translation:
  // reuse that translation instead of wording the sentence differently.
  const RESET_LABEL_RE = /^([^:：]{1,80}?)([:：][ ]?)(\S(?:[\s\S]*\S)?)$/;

  function resetLabelParts(u, source) {
    if (u.surface !== 'settings') return null;
    const m = RESET_LABEL_RE.exec(source);
    if (!m) return null;
    const prefix = m[1].trim();
    const sep = m[2];
    const tail = m[3].trim();
    if (!prefix || !tail) return null;
    if (!isTranslatable(prefix)) return null;
    // Only compose when the tail is already translated; otherwise translate the
    // whole sentence as one piece.
    const tailTranslated = lookupTranslation(tail);
    if (tailTranslated === undefined) return null;
    return [
      {
        text: prefix,
        translated: null,
        state: 0,
        unit: u,
        sep: sep,
        tail: tail,
        tailTranslated: tailTranslated
      }
    ];
  }

  function buildParts(u, source) {
    const reset = resetLabelParts(u, source);
    if (reset) return reset;
    return splitSerialized(source, 1000).map((text) => ({
      text: text,
      translated: null,
      state: 0,
      unit: u
    }));
  }

  function resetForSource(u, serialized) {
    // Downstream keys use the normalised source; the DOM keeps its whitespace.
    const source = normalizeSource(serialized.text);
    const edge = u.mode === 'swap' ? splitEdgeTokens(source) : { text: source, lead: '', trail: '' };
    u.refs = serialized.refs;
    u.segs = serialized.segs;
    u.source = source;
    u.sourceHash = hash32(source);
    u.leadTokens = edge.lead;
    u.trailTokens = edge.trail;
    u.translatedOk = false;
    u.noop = false;
    u.rendered = false;
    u.appliedShowOrig = null;
    u.hoverOrig = false;
    u.tapOrig = false;
    if (u.hoverTimer) {
      clearTimeout(u.hoverTimer);
      u.hoverTimer = 0;
    }
    if (u.leaveTimer) {
      clearTimeout(u.leaveTimer);
      u.leaveTimer = 0;
    }
    if (u.clone) {
      try {
        u.clone.remove();
      } catch (_) {
        /* ignore */
      }
      u.clone = null;
    }
    try {
      u.el.removeAttribute(ATTR_ORIG);
      u.el.removeAttribute(ATTR_SWAPPED);
      u.el.setAttribute(ATTR_UNIT, String(u.id));
    } catch (_) {
      /* ignore */
    }
    // u.source keeps the edge tokens for the no-op comparison; requests do not.
    if (!isTranslatable(edge.text)) {
      u.skip = true;
      u.parts = [];
      return;
    }
    u.skip = false;
    u.parts = buildParts(u, edge.text);
    for (const part of u.parts) enqueuePart(u, part);
  }

  function processHost(el, mode, surface, atomic) {
    const atomics = atomic || [];
    // A settings title is a unit of its title text only; the rest of the row is
    // other units or excluded.
    const titleUnit = surface === 'settings' && isTitleHost(el);
    let u = state.unitByHost.get(el);
    if (!el.isConnected) {
      if (u) dropUnit(u);
      return;
    }
    // A name unit is name text only; refuse an icon, ribbon or metadata host
    // even if a caller ever hands one over.
    if (surface === 'name' && !nameHostClean(el)) {
      if (u) dropUnit(u);
      return;
    }
    // A title stripped down to the hidden copy keeps no unit.
    if (titleUnit && !isTranslatable(normalizeSource(titleHostText(el, atomics)))) {
      if (u) dropUnit(u);
      return;
    }
    // A hidden copy moved inside a title is no longer a unit.
    if (isAriaCopy(el, false)) {
      if (u) dropUnit(u);
      return;
    }
    if (!u) {
      u = makeUnit(el, mode, surface);
    } else {
      u.surface = surface;
    }

    if (u.mode !== mode) {
      if (u.mode === 'swap') restoreSwapText(u);
      if (u.clone) {
        try {
          u.clone.remove();
        } catch (_) {
          /* ignore */
        }
        u.clone = null;
      }
      u.rendered = false;
      try {
        u.el.removeAttribute(ATTR_ORIG);
      } catch (_) {
        /* ignore */
      }
    }
    u.mode = mode;

    let serialized = null;
    if (mode === 'swap' && u.segs && u.segs.length) {
      if (!swapChanged(u)) {
        ensureUnitRendered(u, true);
        return;
      }
      restoreSwapText(u);
      serialized = titleUnit ? serializeTitleHost(el, atomics) : serializeHost(el, 'swap', atomics, false, false);
    } else {
      // Version/date tokens in a changelog heading stay verbatim even when the
      // heading also carries prose that must be translated.
      const protect = mode === 'clone' && surface === 'changelog' && /^H[1-6]$/.test(el.tagName);
      serialized = titleUnit ? serializeTitleHost(el, atomics) : serializeHost(el, mode, atomics, false, protect);
    }

    const hash = hash32(normalizeSource(serialized.text));
    if (u.sourceHash === hash && (u.translatedOk || u.parts.length)) {
      const refsSame = refsEqual(u.refs, serialized.refs);
      u.refs = serialized.refs;
      u.segs = serialized.segs;
      if (mode === 'swap') {
        // React replaced the text nodes with identical text: remap the outputs.
        if (u.translatedOk && !u.noop && u.parts.length) {
          computeSwapOutputs(u);
          u.rendered = true;
          state.unitByDisplay.set(el, u);
        }
        ensureUnitRendered(u, true);
        return;
      }
      if (!refsSame && u.rendered) {
        if (u.clone) {
          try {
            u.clone.remove();
          } catch (_) {
            /* ignore */
          }
          u.clone = null;
        }
        u.rendered = false;
        try {
          u.el.removeAttribute(ATTR_ORIG);
        } catch (_) {
          /* ignore */
        }
        scheduleRender(u);
      } else {
        ensureUnitRendered(u, true);
      }
      return;
    }

    resetForSource(u, serialized);
  }

  function refsEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function dropUnit(u) {
    if (!u) return;
    if (u.hoverTimer) clearTimeout(u.hoverTimer);
    if (u.leaveTimer) clearTimeout(u.leaveTimer);
    u.hoverTimer = 0;
    u.leaveTimer = 0;
    try {
      if (u.mode === 'swap') restoreSwapText(u);
      if (u.clone) u.clone.remove();
      if (u.el) {
        u.el.removeAttribute(ATTR_ORIG);
        u.el.removeAttribute(ATTR_SWAPPED);
        u.el.removeAttribute(ATTR_UNIT);
      }
    } catch (_) {
      /* ignore */
    }
    if (u.clone) state.unitByDisplay.delete(u.clone);
    u.clone = null;
    if (u.el) {
      state.unitByHost.delete(u.el);
      state.unitByDisplay.delete(u.el);
    }
    state.units.delete(u);
    state.renderQueue.delete(u);
  }

  function teardownAll() {
    for (const u of Array.from(state.units)) dropUnit(u);
    state.queue.length = 0;
    // The dedupe map is keyed by language/provider, so a rebuild must not reuse it.
    state.textEntries.clear();
    clearCacheLookups();
    state.renderQueue.clear();
    if (state.flushTimer) {
      clearTimeout(state.flushTimer);
      state.flushTimer = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Translation queue
  // ---------------------------------------------------------------------------

  // The provider actually serving requests right now. A failed LLM session
  // falls back to Edge and never retries the LLM until the page reloads.
  function activeProvider() {
    return state.provider === 'llm' && !state.llmFallback ? 'llm' : 'edge';
  }

  function llmConfigured() {
    const s = state.settings;
    // The model is optional: the endpoint's default applies when it is empty.
    return !!String(s.llmBaseUrl || '').trim();
  }

  // Settings JSON has no glossary key yet; read it when a build adds one.
  // Entries are `source=target` strings (also accept an object map).
  function glossaryEntries() {
    const raw = state.settings.glossary;
    const out = [];
    const seen = new Set();
    const add = (src, dst) => {
      const a = String(src == null ? '' : src).trim();
      const b = String(dst == null ? '' : dst).trim();
      if (!a || !b) return;
      const key = a.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push([a, b]);
    };
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const line = String(item == null ? '' : item).trim();
        if (!line) continue;
        const at = line.indexOf('=');
        if (at <= 0) continue;
        add(line.slice(0, at), line.slice(at + 1));
      }
    } else if (raw && typeof raw === 'object') {
      for (const key of Object.keys(raw)) add(key, raw[key]);
    }
    return out;
  }

  function glossarySignature(settings) {
    const raw = settings && settings.glossary;
    if (!Array.isArray(raw)) return raw && typeof raw === 'object' ? JSON.stringify(raw) : '';
    return raw.map((item) => String(item == null ? '' : item).trim()).filter(Boolean).join('\u0001');
  }

  function glossaryObject(entries) {
    const out = {};
    for (const [src, dst] of entries) out[src] = dst;
    return out;
  }

  function buildLlmSystemPrompt(entries) {
    const lines = [
      'You are a translation API. Translate every input segment into ' +
        (state.targetLang || 'the target language') + '.',
      'Return one raw JSON object and nothing else: {"translations":[{"id":<n>,"text":"<translation>"}]}',
      'No prose, no explanations, no markdown and no code fences.',
      'Keep every placeholder exactly as given: {{n}} atomic tokens and <n>...</n> structural tags ' +
        '(also written <n>…</n>). Never translate, rename, drop, duplicate or reorder them.',
      'Translate only human-readable text. Never translate code, identifiers, URLs, version numbers, ' +
        'or text that is already in the target language.',
      'Keep the id, count and order of the input segments.'
    ];
    if (entries.length) {
      lines.push('Glossary (mandatory, takes priority over any other wording; apply every glossary entry):');
      for (const [src, dst] of entries) lines.push('- ' + src + '=' + dst);
    }
    return lines.join('\n');
  }

  function llmUrl() {
    const base = String(state.settings.llmBaseUrl || '').trim().replace(/\/+$/, '');
    if (!base) return '';
    return base + '/chat/completions';
  }

  function buildLlmBody(entries) {
    const glossary = glossaryEntries();
    const user = {
      targetLanguage: state.targetLang,
      segments: entries.map((entry, index) => ({ id: index + 1, text: entry.text }))
    };
    if (glossary.length) user.glossary = glossaryObject(glossary);
    const body = {
      temperature: 0,
      messages: [
        { role: 'system', content: buildLlmSystemPrompt(glossary) },
        { role: 'user', content: JSON.stringify(user) }
      ]
    };
    // An empty model omits the key entirely so the endpoint's default applies.
    const model = String(state.settings.llmModel || '').trim();
    if (model) body.model = model;
    return JSON.stringify(body);
  }

  function warnLlmOnce(why) {
    if (state.llmWarned) return;
    state.llmWarned = true;
    log(
      'llm: ' + why + '; falling back to Edge (Edge fallback)' +
      (state.llmFallback ? ' for this session' : ' for these segments')
    );
  }

  function disableLlm(why) {
    state.llmFallback = true;
    warnLlmOnce(why);
  }

  // A part's output, composing the cached tail for a reset label.
  function partOutput(p) {
    if (!p || p.translated == null) return null;
    if (p.tailTranslated != null) return p.translated + p.sep + p.tailTranslated;
    return p.translated;
  }

  // The unit's rendered text including edge tokens, for the no-op comparison.
  function unitOutput(u) {
    if (!u || !u.parts) return '';
    return (u.leadTokens || '') + u.parts.map((p) => partOutput(p) || '').join('') + (u.trailTokens || '');
  }

  // A string already known this session; used so a reset label never disagrees
  // with the option label. The mod's store is only reachable asynchronously, so
  // a reset label composes from this session's completed entries.
  function lookupTranslation(text) {
    const entry = state.textEntries.get(text);
    if (entry && entry.state === 3 && typeof entry.translated === 'string') return entry.translated;
    return undefined;
  }

  function attachPart(entry, u, part) {
    part.entry = entry;
    if (entry.state === 3) {
      // Already translated: fan the result out, no request and no bookkeeping.
      part.translated = entry.translated;
      part.state = 3;
      maybeFinishUnit(u);
      return;
    }
    if (entry.state === 4) {
      part.state = 4;
      return;
    }
    entry.parts.push(part);
    part.state = entry.state === 0 ? 0 : 1;
  }

  function enqueuePart(u, part) {
    if (!state.enabled || state.dead) return;
    if (!state.targetLang) {
      part.state = 4;
      return;
    }
    const provider = activeProvider();
    const text = part.text;
    const existing = state.textEntries.get(text);
    if (existing) {
      // The same normalised string as another unit: share its request and result.
      attachPart(existing, u, part);
      return;
    }
    // state 0: waiting for the mod's cache reply; 1: queued/in flight.
    const entry = { text: text, state: 0, translated: null, parts: [], provider: provider };
    state.textEntries.set(text, entry);
    attachPart(entry, u, part);
    if (state.settings.cacheEnabled) requestCached(entry);
    else queueEntry(entry);
  }

  function queueEntry(entry) {
    if (state.dead || entry.state !== 0) return;
    entry.state = 1;
    for (const p of entry.parts) p.state = 1;
    state.queue.push(entry);
    scheduleFlush();
  }

  function scheduleFlush() {
    if (state.flushTimer || state.dead) return;
    const ms = clamp(state.settings.batchIntervalMs, 0, 10000);
    state.flushTimer = setTimeout(() => {
      state.flushTimer = 0;
      safe(flushQueue, 'flush');
    }, ms);
  }

  function flushQueue() {
    if (state.dead || !state.enabled || !state.targetLang) return;
    const s = state.settings;
    // The LLM protocol is capped harder than Edge: 12 segments / 6000 chars.
    const llm = activeProvider() === 'llm';
    const maxSegments = llm ? Math.min(s.batchSize, LLM_MAX_SEGMENTS) : s.batchSize;
    const maxChars = llm ? Math.min(s.batchChars, LLM_MAX_CHARS) : s.batchChars;
    while (state.queue.length && state.inflight < s.concurrency) {
      const batch = [];
      let chars = 0;
      while (state.queue.length && batch.length < maxSegments) {
        // The queue holds distinct normalised strings only.
        const entry = state.queue[0];
        if (batch.length && chars + entry.text.length > maxChars) break;
        state.queue.shift();
        batch.push(entry);
        chars += entry.text.length;
      }
      if (!batch.length) break;
      state.inflight++;
      state.stats.batches++;
      const epoch = state.epoch;
      runBatch(batch, epoch)
        .catch((e) => problem('batch: ' + (e && e.message ? e.message : e)))
        .finally(() => {
          state.inflight--;
          safe(flushQueue, 'flush-next');
        });
    }
    if (state.queue.length) scheduleFlush();
  }

  // Fan a finished translation out to every part that still belongs to a live
  // unit. Used for both a cache hit and a provider reply.
  function completeEntry(entry, translated, provider) {
    entry.translated = translated;
    entry.state = 3;
    entry.provider = provider || activeProvider();
    const units = new Set();
    const live = [];
    for (const p of entry.parts) {
      p.translated = translated;
      p.state = 3;
      // A part whose unit was dropped or re-sourced is dead: release it.
      if (p.unit && p.unit.parts && p.unit.parts.indexOf(p) !== -1) {
        live.push(p);
        units.add(p.unit);
      }
    }
    entry.parts = live;
    for (const u of units) maybeFinishUnit(u);
  }

  function finishEntry(entry, translated, provider) {
    const produced = provider || activeProvider();
    completeEntry(entry, translated, produced);
    // Store under the provider that actually produced the text: an Edge result
    // from an LLM fallback is an Edge cache entry, never an LLM one.
    cacheSet(entry.text, translated, produced);
    state.stats.translations++;
  }

  function failEntry(entry) {
    entry.state = 4;
    for (const p of entry.parts) p.state = 4;
    entry.parts = [];
    // Forget the failed string so a later unit may retry it.
    if (state.textEntries.get(entry.text) === entry) state.textEntries.delete(entry.text);
  }

  async function runBatch(entries, epoch) {
    const provider = activeProvider();
    const chunkSize = provider === 'llm' ? LLM_MAX_SEGMENTS : 10;
    for (let i = 0; i < entries.length; i += chunkSize) {
      if (!state.enabled || state.epoch !== epoch) return;
      const chunk = entries.slice(i, i + chunkSize);
      if (provider === 'llm' && !state.llmFallback) {
        const result = await translateLlmBatch(chunk, epoch);
        if (!result) return; // disabled or epoch changed
        if (result.texts && result.texts.length === chunk.length) {
          const missing = [];
          for (let j = 0; j < chunk.length; j++) {
            if (result.texts[j] != null) finishEntry(chunk[j], result.texts[j], 'llm');
            else missing.push(chunk[j]);
          }
          if (missing.length) {
            // Valid ids keep their LLM text; the omitted ones go to Edge.
            warnLlmOnce('reply omitted ' + missing.length + ' segment(s)');
            await runEdgeEntries(missing, epoch);
          }
          continue;
        }
        // Network error, non-2xx, unparseable reply or no id matched: this
        // batch goes to Edge and the rest of the session stays there.
        disableLlm(result.why || 'request failed');
        state.stats.batchesFailed++;
        state.stats.errors++;
        await runEdgeEntries(chunk, epoch);
        continue;
      }
      await runEdgeEntries(chunk, epoch);
    }
  }

  async function runEdgeEntries(entries, epoch) {
    if (!entries.length) return;
    const texts = entries.map((e) => e.text);
    let translated = null;
    try {
      translated = await translateEdgeChunk(texts, epoch);
    } catch (_) {
      translated = null;
    }
    if (state.epoch !== epoch) return;
    if (!translated || translated.length !== entries.length) {
      for (const e of entries) failEntry(e);
      state.stats.batchesFailed++;
      state.stats.errors++;
      return;
    }
    for (let j = 0; j < entries.length; j++) finishEntry(entries[j], translated[j], 'edge');
  }

  const EDGE_URL =
    'https://edge.microsoft.com/translate/translatetext?from=&to=';
  const LLM_MAX_SEGMENTS = 12;
  const LLM_MAX_CHARS = 6000;

  async function translateEdgeChunk(texts, epoch) {
    const url = EDGE_URL + encodeURIComponent(state.targetLang) + '&isEnterpriseClient=false';
    let why = '';
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (!state.enabled || state.epoch !== epoch) return null;
      const res = await httpRequest({
        method: 'POST',
        url: url,
        body: JSON.stringify(texts)
      });
      if (!state.enabled || state.epoch !== epoch) return null;
      if (res.error === 0 && res.status === 200) {
        const parsed = parseEdgeResponse(res.body, texts.length);
        if (parsed) return parsed;
        why = 'malformed response';
        problem('edge: malformed response');
        break;
      }
      why = 'status=' + res.status + ' error=' + res.error;
      const retryable =
        res.error !== 0 || res.status === 429 || (res.status >= 500 && res.status <= 599);
      if (!retryable) break;
      if (attempt < 2) await sleep(400 * Math.pow(2, attempt) + Math.random() * 200);
    }
    problem('edge failed: ' + why);
    return null;
  }

  async function translateLlmBatch(entries, epoch) {
    const url = llmUrl();
    if (!url) return { why: 'no LLM endpoint configured', texts: null };
    const body = buildLlmBody(entries);
    let why = '';
    for (let attempt = 0; attempt <= 1; attempt++) {
      if (!state.enabled || state.epoch !== epoch) return null;
      if (state.llmFallback) return { why: 'fallback active', texts: null };
      // No headers here: the page never sees the key; the mod sets
      // Content-Type and Authorization for the llmBaseUrl host
      // (docs/PROTOCOL.md).
      const res = await httpRequest({
        method: 'POST',
        url: url,
        body: body
      });
      if (!state.enabled || state.epoch !== epoch) return null;
      if (res.error === 0 && res.status >= 200 && res.status < 300) {
        const map = parseLlmReply(res.body, entries.length);
        if (map && map.size) {
          const texts = entries.map((entry, index) => (map.has(index + 1) ? map.get(index + 1) : null));
          return { why: '', texts: texts };
        }
        why = map ? 'reply had no usable translations' : 'unparseable reply';
        break;
      }
      why = 'status=' + res.status + ' error=' + res.error;
      // -2 is the page-side timeout; 12002 is ERROR_WINHTTP_TIMEOUT from the
      // mod. Other transport errors fall back without a retry.
      const retryable =
        res.error === -2 || res.error === 12002 ||
        res.status === 429 || (res.status >= 500 && res.status <= 599);
      if (!retryable || attempt >= 1) break;
      await sleep(400 + Math.random() * 200);
    }
    return { why: why, texts: null };
  }

  // The chat reply's message content may be fenced or surrounded by prose;
  // only the first `{` through the last `}` is the JSON object.
  function llmContent(outer) {
    if (!outer || typeof outer !== 'object') return null;
    // Some OpenAI-compatible proxies answer with the object itself.
    if (Array.isArray(outer.translations)) return JSON.stringify(outer);
    const choice = Array.isArray(outer.choices) ? outer.choices[0] : null;
    const message = choice && choice.message ? choice.message : null;
    if (!message) return null;
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      let out = '';
      for (const part of message.content) if (part && typeof part.text === 'string') out += part.text;
      return out;
    }
    return null;
  }

  function parseLlmReply(body, count) {
    let outer = null;
    try {
      outer = JSON.parse(body);
    } catch (_) {
      outer = null;
    }
    // Prefer the chat envelope's message content; a proxy may also answer with
    // the JSON object or a fenced block as the raw body.
    let content = outer ? llmContent(outer) : null;
    if (content == null) content = String(body == null ? '' : body);
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first === -1 || last <= first) return null;
    let data = null;
    try {
      data = JSON.parse(content.slice(first, last + 1));
    } catch (_) {
      return null;
    }
    if (!data || !Array.isArray(data.translations)) return null;
    const map = new Map();
    for (const item of data.translations) {
      if (!item) continue;
      const id = Number(item.id);
      if (!isFinite(id) || id < 1 || id > count) continue;
      if (typeof item.text !== 'string' || !item.text.trim()) continue;
      if (!map.has(id)) map.set(id, item.text);
    }
    return map;
  }

  function parseEdgeResponse(body, count) {
    let data;
    try {
      data = JSON.parse(body);
    } catch (_) {
      return null;
    }
    if (!Array.isArray(data) || data.length < count) return null;
    const out = [];
    for (let i = 0; i < count; i++) {
      const item = data[i];
      const first = item && Array.isArray(item.translations) ? item.translations[0] : null;
      if (!first || typeof first.text !== 'string') return null;
      out.push(first.text);
    }
    return out;
  }

  function maybeFinishUnit(u) {
    if (!u || !u.parts || !u.parts.length) return;
    for (const p of u.parts) if (p.state !== 3) return;
    u.translatedOk = true;
    u.noop = unitOutput(u) === u.source;
    if (u.noop) {
      u.rendered = false;
      return;
    }
    scheduleRender(u);
  }

  // ---------------------------------------------------------------------------
  // Cache (the mod owns the store; the page only looks keys up and stores)
  //
  // Key format:
  //   whtr1|v4|<provider>|<model>|<lang>|<baseUrl>|<glossaryHash>|<hash64>|<length>
  // The endpoint and the effective glossary are part of the identity, so
  // changing either cannot serve a translation produced under the old config.
  // A lookup is one `cache-get` carrying a per-page request id and resolves on
  // a `cache-hit` / `cache-miss` that echoes both that id and the key; a store
  // is one `cache-put` that is never awaited.
  // ---------------------------------------------------------------------------

  const CACHE_VERSION = 'v4';
  const CACHE_PREFIX = 'whtr1|' + CACHE_VERSION + '|';
  const CACHE_LOOKUP_TIMEOUT_MS = 5000;

  // The endpoint is part of the key: two LLM hosts may answer differently.
  function cacheBaseUrl() {
    return String(state.settings.llmBaseUrl || '').trim().replace(/\/+$/, '');
  }

  // A stable fingerprint of the effective glossary, normalised and deduped the
  // same way the prompt builds it.
  function cacheGlossaryHash() {
    const entries = glossaryEntries();
    if (!entries.length) return '';
    return hash32(entries.map(([src, dst]) => src + '=' + dst).join('\n'));
  }

  function cacheKey(text, provider) {
    const p = provider || activeProvider();
    return (
      CACHE_PREFIX + p + '|' + String(state.settings.llmModel || '').trim() + '|' + state.targetLang + '|' +
      cacheBaseUrl() + '|' + cacheGlossaryHash() + '|' + hash64(text) + '|' + text.length
    );
  }

  // Fire-and-forget: the mod owns the store, the page keeps only this session's
  // registry. No reply is expected.
  function cacheSet(text, translated, provider) {
    if (!state.settings.cacheEnabled || state.dead) return;
    if (typeof translated !== 'string') return;
    send(TAG + SEP + 'cache-put' + SEP + cacheKey(text, provider) + SEP + translated);
  }

  function warnCacheOnce() {
    if (state.cacheWarned) return;
    state.cacheWarned = true;
    log(
      'cache: no reply within ' + CACHE_LOOKUP_TIMEOUT_MS / 1000 +
      ' s; the cache is not answering, translating without it'
    );
  }

  // Remove one pending lookup and stop its deadline. Both the id and the key
  // must match: a reply for an id nobody is waiting for, or one whose key
  // disagrees with the record, returns null and is ignored.
  function forgetLookup(id, key) {
    const pending = state.cacheLookups.get(id);
    if (!pending || pending.key !== key) return null;
    state.cacheLookups.delete(id);
    state.cacheLookupKeys.delete(pending.key);
    try {
      clearTimeout(pending.timer);
    } catch (_) {
      /* ignore */
    }
    return pending.entry;
  }

  // Drop every outstanding lookup. With `retry`, entries still waiting are
  // counted as misses and translated normally (a cache clear invalidated the
  // store); otherwise their units are being torn down and nothing is queued.
  function clearCacheLookups(retry) {
    const pendingList = Array.from(state.cacheLookups.values());
    state.cacheLookups.clear();
    state.cacheLookupKeys.clear();
    for (const pending of pendingList) {
      try {
        clearTimeout(pending.timer);
      } catch (_) {
        /* ignore */
      }
      if (retry && !state.dead && pending.entry.state === 0) {
        state.stats.cacheMisses++;
        queueEntry(pending.entry);
      }
    }
  }

  function requestCached(entry) {
    // No channel (or a dead engine): skip the cache and translate normally.
    if (state.dead || !CHANNEL()) {
      queueEntry(entry);
      return;
    }
    const key = cacheKey(entry.text, entry.provider);
    if (state.cacheLookupKeys.has(key)) {
      // A hash collision on a key that is already being looked up: do not
      // overwrite the pending record, just translate this string normally.
      queueEntry(entry);
      return;
    }
    // The id is monotonic for the page and shared with http requests, so no
    // reply can ever be mistaken for a later lookup.
    const id = state.nextRequestId++;
    const timer = setTimeout(() => {
      const pending = state.cacheLookups.get(id);
      if (!pending || pending.entry !== entry) return;
      forgetLookup(id, key);
      if (state.dead || entry.state !== 0) return;
      warnCacheOnce();
      state.stats.cacheMisses++;
      queueEntry(entry);
    }, CACHE_LOOKUP_TIMEOUT_MS);
    state.cacheLookups.set(id, { id: id, key: key, entry: entry, timer: timer });
    state.cacheLookupKeys.add(key);
    if (!send(TAG + SEP + 'cache-get' + SEP + String(id) + SEP + key)) {
      // The channel vanished between the check and the send: no reply will
      // ever come, so translate now.
      forgetLookup(id, key);
      queueEntry(entry);
    }
  }

  function onCacheHit(parts) {
    // parts: [tag, 'cache-hit', requestId, key, text]
    const entry = forgetLookup(Number(parts[2]), parts[3]);
    if (!entry || entry.state !== 0) return;
    state.stats.cacheHits++;
    completeEntry(entry, parts[4] == null ? '' : parts[4], entry.provider);
  }

  function onCacheMiss(parts) {
    // parts: [tag, 'cache-miss', requestId, key]
    const entry = forgetLookup(Number(parts[2]), parts[3]);
    if (!entry || entry.state !== 0) return;
    state.stats.cacheMisses++;
    queueEntry(entry);
  }

  // The engine forgets its in-session map; the mod clears its own store when it
  // applies the clearCache setting. Outstanding lookups were answered from the
  // old store, so they are dropped and their strings translated normally.
  function cacheClear() {
    clearCacheLookups(true);
    for (const [text, entry] of Array.from(state.textEntries)) {
      if (entry.state === 3) state.textEntries.delete(text);
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering: clone mode
  // ---------------------------------------------------------------------------

  function sanitizeClone(el) {
    try {
      if (el.removeAttribute) {
        el.removeAttribute('id');
        el.removeAttribute('data-testid');
        el.removeAttribute(ATTR_UNIT);
        el.removeAttribute(ATTR_CLONE);
        el.removeAttribute(ATTR_ORIG);
        el.removeAttribute(ATTR_SWAPPED);
      }
      let all = [];
      try {
        all = el.querySelectorAll('[id], [data-testid]');
      } catch (_) {
        all = [];
      }
      for (const node of all) {
        node.removeAttribute('id');
        node.removeAttribute('data-testid');
      }
    } catch (_) {
      /* ignore */
    }
  }

  function cloneForDisplay(el) {
    const copy = el.cloneNode(true);
    sanitizeClone(copy);
    return copy;
  }

  function cloneShell(el) {
    const copy = el.cloneNode(false);
    sanitizeClone(copy);
    return copy;
  }

  function buildFragment(src, refs) {
    const frag = document.createDocumentFragment();
    const stack = [{ node: frag, index: -1 }];
    const used = new Set();
    let buf = '';
    let last = 0;
    const flush = () => {
      if (!buf) return;
      const top = stack[stack.length - 1];
      try {
        top.node.appendChild(document.createTextNode(buf));
      } catch (_) {
        /* ignore */
      }
      buf = '';
    };
    const re = /\{\{(\d+)\}\}|<(\/?)(\d+)>/g;
    let m;
    while ((m = re.exec(src))) {
      buf += src.slice(last, m.index);
      last = re.lastIndex;
      if (m[1] !== undefined) {
        const index = Number(m[1]);
        const el = refs[index];
        if (el && !used.has(index)) {
          used.add(index);
          flush();
          try {
            stack[stack.length - 1].node.appendChild(cloneForDisplay(el));
          } catch (_) {
            /* ignore */
          }
        }
        // Unknown / repeated placeholders are dropped, as agreed.
      } else if (m[2] === '/') {
        const index = Number(m[3]);
        let k = stack.length - 1;
        while (k > 0 && stack[k].index !== index) k--;
        if (k > 0) {
          flush();
          stack.length = k;
        }
      } else {
        const index = Number(m[3]);
        const el = refs[index];
        flush();
        if (el && !used.has(index) && stack.length < 200) {
          used.add(index);
          const shell = cloneShell(el);
          try {
            stack[stack.length - 1].node.appendChild(shell);
          } catch (_) {
            /* ignore */
          }
          stack.push({ node: shell, index: index });
        } else {
          // Transparent frame: interior text still lands in the current parent.
          stack.push({ node: stack[stack.length - 1].node, index: -2 });
        }
      }
    }
    buf += src.slice(last);
    flush();
    return frag;
  }

  function buildClone(u) {
    const clone = cloneShell(u.el);
    clone.setAttribute(ATTR_CLONE, '1');
    clone.setAttribute(ATTR_UNIT, String(u.id));
    for (const part of u.parts) {
      const text = partOutput(part);
      if (text == null) continue;
      try {
        clone.appendChild(buildFragment(text, u.refs));
      } catch (e) {
        problem('build clone: ' + (e && e.message ? e.message : e));
      }
    }
    return clone;
  }

  function ensureCloneAttached(u) {
    if (!u.clone) return false;
    const parent = u.el.parentNode;
    if (!parent) return false;
    if (u.clone.parentNode !== parent || u.clone.nextSibling !== u.el) {
      try {
        parent.insertBefore(u.clone, u.el);
      } catch (_) {
        return false;
      }
    }
    state.unitByDisplay.set(u.clone, u);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Rendering: swap mode
  // ---------------------------------------------------------------------------

  function edgeSpaces(original, text) {
    if (!text) return '';
    const lead = /^\s/.test(original);
    const trail = /\s$/.test(original);
    let out = text.trim();
    if (!out) return '';
    if (lead && !/^\s/.test(out)) out = ' ' + out;
    if (trail && !/\s$/.test(out)) out = out + ' ';
    return out;
  }

  function distribute(text, segs) {
    if (!segs || !segs.length) return;
    if (!text) {
      for (const seg of segs) seg.out = '';
      return;
    }
    // Whitespace-only nodes must not receive part of the translation.
    let targets = segs.filter((seg) => /[^\s]/.test(seg.orig || ''));
    if (!targets.length) targets = segs;
    for (const seg of segs) if (targets.indexOf(seg) === -1) seg.out = seg.orig;
    if (targets.length === 1) {
      targets[0].out = edgeSpaces(targets[0].orig, text);
      return;
    }
    let total = 0;
    for (const seg of targets) total += Math.max(1, (seg.orig || '').length);
    const chars = Array.from(text);
    let index = 0;
    let acc = 0;
    for (let i = 0; i < targets.length; i++) {
      const seg = targets[i];
      acc += Math.max(1, (seg.orig || '').length);
      let end = i === targets.length - 1 ? chars.length : Math.round((chars.length * acc) / total);
      if (end < index) end = index;
      const piece = chars.slice(index, end).join('');
      index = end;
      seg.out = edgeSpaces(seg.orig, piece);
    }
  }

  function computeSwapOutputs(u) {
    const source =
      (u.leadTokens || '') + u.parts.map((p) => partOutput(p) || '').join('') + (u.trailTokens || '');
    const groups = [[]];
    for (const seg of u.segs) {
      if (seg.kind === 'token') groups.push([]);
      else groups[groups.length - 1].push(seg);
    }

    const chunks = [];
    let current = '';
    let tokenCount = 0;
    const used = new Set();
    const re = /\{\{(\d+)\}\}/g;
    let last = 0;
    let m;
    while ((m = re.exec(source))) {
      current += source.slice(last, m.index);
      last = re.lastIndex;
      const index = Number(m[1]);
      if (u.refs[index] && !used.has(index)) {
        used.add(index);
        chunks.push(current);
        current = '';
        tokenCount++;
      }
      // A token we cannot restore is dropped from the text stream.
    }
    current += source.slice(last);
    chunks.push(current);

    if (tokenCount === 0) {
      // The translation lost every placeholder: spread it over the whole host.
      const all = [];
      for (const group of groups) for (const seg of group) all.push(seg);
      distribute(chunks[0] || '', all);
      return;
    }

    for (let g = 0; g < groups.length; g++) {
      let text = g < chunks.length ? chunks[g] : '';
      if (g === groups.length - 1 && chunks.length > groups.length) {
        text += chunks.slice(groups.length).join('');
      }
      distribute(text, groups[g]);
    }
  }

  function applySwapText(u) {
    for (const seg of u.segs) {
      if (seg.kind !== 'text') continue;
      const node = seg.node;
      if (!node || !node.isConnected) continue;
      const want = seg.out == null ? seg.orig : seg.out;
      if (node.nodeValue === want) continue;
      // A third value means React re-rendered the node; let the observer rescan.
      if (node.nodeValue !== seg.orig && node.nodeValue !== seg.out) continue;
      node.nodeValue = want;
      state.written.set(node, want);
    }
  }

  function swapOutputsReady(u) {
    return u.parts.length > 0 && u.parts.every((p) => partOutput(p) != null);
  }

  // ---------------------------------------------------------------------------
  // Rendering: shared
  // ---------------------------------------------------------------------------

  function scheduleRender(u) {
    if (!u || state.dead) return;
    state.renderQueue.add(u);
    if (state.renderScheduled) return;
    state.renderScheduled = true;
    idle(() => {
      state.renderScheduled = false;
      safe(runRenderChunk, 'render-chunk');
    });
  }

  function runRenderChunk(deadline) {
    let n = 0;
    for (const u of Array.from(state.renderQueue)) {
      state.renderQueue.delete(u);
      if (u.el && u.el.isConnected) safe(() => renderUnit(u), 'render-unit');
      n++;
      const left = deadline && typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 8;
      if (n >= 30 || left < 2) break;
    }
    if (state.renderQueue.size) scheduleRenderIdle();
  }

  function scheduleRenderIdle() {
    if (state.renderScheduled || state.dead) return;
    state.renderScheduled = true;
    idle(() => {
      state.renderScheduled = false;
      safe(runRenderChunk, 'render-chunk2');
    });
  }

  function renderUnit(u) {
    if (!state.enabled || !u || !u.el || !u.el.isConnected) return;
    if (!u.translatedOk || u.noop || u.skip) return;
    if (u.mode === 'clone') {
      if (!u.clone) {
        u.clone = buildClone(u);
        state.unitByDisplay.set(u.clone, u);
        state.unitByDisplay.set(u.el, u);
      }
      if (!ensureCloneAttached(u)) return;
      u.rendered = true;
      applyUnit(u, true);
      return;
    }
    if (!swapOutputsReady(u)) return;
    if (swapChanged(u)) {
      // React rewrote the host while the request was in flight; rescan instead.
      scheduleScan(120);
      return;
    }
    computeSwapOutputs(u);
    u.rendered = true;
    state.unitByDisplay.set(u.el, u);
    applyUnit(u, true);
  }

  function ensureUnitRendered(u, force) {
    if (!u || !u.el || !u.el.isConnected) return;
    if (u.mode === 'clone') {
      if (u.rendered && u.clone && u.clone.isConnected) {
        ensureCloneAttached(u);
        applyUnit(u, !!force);
      } else if (u.translatedOk && !u.noop) {
        scheduleRender(u);
      }
      return;
    }
    if (u.rendered) applyUnit(u, !!force);
  }

  function effectiveShowOrig(u) {
    return !state.enabled || u.hoverOrig || u.tapOrig;
  }

  function applyUnit(u, force) {
    if (!u || !u.el || !u.el.isConnected) return;
    const showOrig = effectiveShowOrig(u);
    if (!force && u.appliedShowOrig === showOrig) return;
    u.appliedShowOrig = showOrig;

    if (u.mode === 'clone') {
      if (!u.clone) return;
      try {
        u.clone.style.display = showOrig ? 'none' : '';
        if (showOrig) u.el.removeAttribute(ATTR_ORIG);
        else u.el.setAttribute(ATTR_ORIG, '1');
      } catch (_) {
        /* ignore */
      }
      return;
    }

    if (!u.rendered) return;
    if (showOrig) {
      for (const seg of u.segs) {
        if (seg.kind !== 'text') continue;
        const node = seg.node;
        if (!node || !node.isConnected) continue;
        const orig = state.origText.has(node) ? state.origText.get(node) : seg.orig;
        if (node.nodeValue === seg.out && node.nodeValue !== orig) {
          node.nodeValue = orig;
          state.written.set(node, orig);
        }
      }
      try {
        u.el.removeAttribute(ATTR_SWAPPED);
      } catch (_) {
        /* ignore */
      }
    } else {
      if (swapChanged(u)) {
        scheduleScan(120);
        return;
      }
      applySwapText(u);
      try {
        u.el.setAttribute(ATTR_SWAPPED, '1');
      } catch (_) {
        /* ignore */
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pointer / touch interaction (delegated, one listener each)
  // ---------------------------------------------------------------------------

  function unitFromEvent(e) {
    let node = e && e.target;
    if (!node || node.nodeType !== 1) {
      node = node && node.parentElement ? node.parentElement : null;
    }
    while (node) {
      const u = state.unitByDisplay.get(node);
      if (u) return u;
      node = node.parentElement;
    }
    return null;
  }

  function withinUnit(u, node) {
    if (!u || !node || node.nodeType !== 1) return false;
    try {
      if (u.el && u.el.contains(node)) return true;
      if (u.clone && u.clone.contains(node)) return true;
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  function onPointerOver(e) {
    if (!state.enabled) return;
    if (e.pointerType === 'touch') return;
    const u = unitFromEvent(e);
    if (!u) return;
    if (withinUnit(u, e.relatedTarget)) return;
    if (u.leaveTimer) {
      clearTimeout(u.leaveTimer);
      u.leaveTimer = 0;
    }
    if (u.hoverTimer) clearTimeout(u.hoverTimer);
    const delay = clamp(state.settings.hoverDelayMs, 0, 2000);
    if (delay <= 0) {
      u.hoverOrig = true;
      applyUnit(u);
      return;
    }
    u.hoverTimer = setTimeout(() => {
      u.hoverTimer = 0;
      safe(() => {
        u.hoverOrig = true;
        applyUnit(u);
      }, 'hover');
    }, delay);
  }

  function onPointerOut(e) {
    if (!state.enabled) return;
    if (e.pointerType === 'touch') return;
    const u = unitFromEvent(e);
    if (!u) return;
    if (withinUnit(u, e.relatedTarget)) return;
    if (u.hoverTimer) {
      clearTimeout(u.hoverTimer);
      u.hoverTimer = 0;
    }
    if (!u.hoverOrig) return;
    if (u.leaveTimer) clearTimeout(u.leaveTimer);
    // Short grace: hiding the clone must not immediately restart the hover loop.
    const grace = Math.max(120, clamp(state.settings.hoverDelayMs, 0, 2000));
    u.leaveTimer = setTimeout(() => {
      u.leaveTimer = 0;
      safe(() => {
        u.hoverOrig = false;
        applyUnit(u);
      }, 'hover-out');
    }, grace);
  }

  // ---------------------------------------------------------------------------
  // Touch: per-block single tap and the two-finger double tap.
  //
  // The single tap is deferred briefly so a second finger can cancel it. Two
  // pointers down and both lifted, twice within 400 ms, toggles translation
  // globally like the keyboard shortcut. Each pointer may wander at most 30 px.
  // ---------------------------------------------------------------------------

  const GESTURE_WINDOW_MS = 400;
  const GESTURE_SLOP_PX = 30;
  const TAP_SLOP_PX = 10;
  const SINGLE_TAP_DELAY_MS = 160;

  let touchStart = null;
  let pendingTapTimer = 0;
  const touchPointers = new Map(); // pointerId -> { x, y, at, moved, tapMoved }
  let twoFingerTap = null; // { ids: [id, id], at, ok }
  let lastTwoFingerTapAt = 0;

  function cancelPendingTap() {
    if (!pendingTapTimer) return;
    clearTimeout(pendingTapTimer);
    pendingTapTimer = 0;
  }

  function toggleTapOrig(u) {
    if (!state.enabled || !u || !u.el || !u.el.isConnected) return;
    u.tapOrig = !u.tapOrig;
    if (u.hoverTimer) {
      clearTimeout(u.hoverTimer);
      u.hoverTimer = 0;
    }
    u.hoverOrig = false;
    if (u.leaveTimer) {
      clearTimeout(u.leaveTimer);
      u.leaveTimer = 0;
    }
    applyUnit(u, true);
  }

  function queueSingleTap(u) {
    cancelPendingTap();
    pendingTapTimer = setTimeout(() => {
      pendingTapTimer = 0;
      safe(() => toggleTapOrig(u), 'tap');
    }, SINGLE_TAP_DELAY_MS);
  }

  function pointerDistance(start, e) {
    const dx = Number(e.clientX) - start.x;
    const dy = Number(e.clientY) - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onPointerDown(e) {
    if (e.pointerType !== 'touch') return;
    // Gesture tracking runs whether or not translation is enabled; only the
    // per-block tap is gated on it. Any new touch cancels a queued tap.
    cancelPendingTap();
    if (isTypingTarget(e.target)) return;
    const now = Date.now();
    touchPointers.set(e.pointerId, {
      x: Number(e.clientX),
      y: Number(e.clientY),
      at: now,
      moved: false,
      tapMoved: false
    });
    if (touchPointers.size === 1) {
      touchStart = { x: Number(e.clientX), y: Number(e.clientY), t: now, id: e.pointerId };
      twoFingerTap = null;
      return;
    }
    // A second finger cancels the block tap the first one may have queued.
    touchStart = null;
    if (touchPointers.size === 2) {
      let at = now;
      for (const p of touchPointers.values()) at = Math.min(at, p.at);
      twoFingerTap = { ids: Array.from(touchPointers.keys()), at: at, ok: true };
    } else if (twoFingerTap) {
      twoFingerTap.ok = false;
    }
  }

  function onPointerMove(e) {
    if (e.pointerType !== 'touch') return;
    const start = touchPointers.get(e.pointerId);
    if (!start) return;
    const dist = pointerDistance(start, e);
    if (dist > TAP_SLOP_PX) start.tapMoved = true;
    if (start.moved || dist <= GESTURE_SLOP_PX) return;
    start.moved = true;
    if (twoFingerTap && twoFingerTap.ids.indexOf(e.pointerId) !== -1) twoFingerTap.ok = false;
  }

  function onPointerUp(e) {
    if (e.pointerType !== 'touch') return;
    const start = touchPointers.get(e.pointerId);

    if (!start) {
      // Synthetic pointerup without a matching pointerdown: still a tap.
      if (isTypingTarget(e.target)) return;
      if (!state.enabled) return;
      const u = unitFromEvent(e);
      if (u) queueSingleTap(u);
      return;
    }

    touchPointers.delete(e.pointerId);
    const now = Date.now();
    const dist = pointerDistance(start, e);
    const moved = start.moved || dist > GESTURE_SLOP_PX;
    const tapMoved = start.tapMoved || dist > TAP_SLOP_PX;
    if (twoFingerTap && twoFingerTap.ids.indexOf(e.pointerId) !== -1 && moved) twoFingerTap.ok = false;

    if (twoFingerTap) {
      // A two-finger attempt never taps a single block.
      if (touchPointers.size === 0) {
        const tap = twoFingerTap;
        twoFingerTap = null;
        const ok = tap.ok && now - tap.at <= GESTURE_WINDOW_MS;
        if (!ok) return;
        const on = !!state.settings.gestureToggle;
        if (on && lastTwoFingerTapAt && now - lastTwoFingerTapAt <= GESTURE_WINDOW_MS) {
          lastTwoFingerTapAt = 0;
          setEnabled(!state.enabled);
        } else if (on) {
          lastTwoFingerTapAt = now;
        }
      }
      return;
    }

    if (touchPointers.size > 0) return; // another finger is still down
    if (touchStart && touchStart.id === e.pointerId) {
      const elapsed = now - touchStart.t;
      touchStart = null;
      if (tapMoved || elapsed > 900) return;
    } else {
      touchStart = null;
    }
    if (!state.enabled) return;
    const u = unitFromEvent(e);
    if (u) queueSingleTap(u);
  }

  function onPointerCancel(e) {
    const id = e && e.pointerId;
    if (id == null) touchPointers.clear();
    else touchPointers.delete(id);
    touchStart = null;
    if (touchPointers.size === 0) twoFingerTap = null;
    else if (twoFingerTap) twoFingerTap.ok = false;
    cancelPendingTap();
  }

  // Called on every enable/disable: a pointer or half-finished gesture from
  // before the switch must not be paired with the next one.
  function resetPointerState() {
    touchPointers.clear();
    touchStart = null;
    twoFingerTap = null;
    lastTwoFingerTapAt = 0;
    cancelPendingTap();
  }

  // ---------------------------------------------------------------------------
  // Mutation observer
  // ---------------------------------------------------------------------------

  function isOurNode(node) {
    if (!node) return false;
    if (node.nodeType === 1) {
      try {
        return !!node.closest('[' + ATTR_CLONE + '="1"]');
      } catch (_) {
        return false;
      }
    }
    if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (!parent) return false;
      try {
        return !!parent.closest('[' + ATTR_CLONE + '="1"]');
      } catch (_) {
        return false;
      }
    }
    return false;
  }

  function isOurMutation(record) {
    if (record.type === 'characterData') {
      const target = record.target;
      return state.written.get(target) === target.nodeValue;
    }
    const nodes = [];
    try {
      for (const n of record.addedNodes) nodes.push(n);
      for (const n of record.removedNodes) nodes.push(n);
    } catch (_) {
      return false;
    }
    if (!nodes.length) return true;
    for (const node of nodes) if (!isOurNode(node)) return false;
    return true;
  }

  function onMutations(records) {
    if (!state.enabled || !state.settingsSeen) return;
    for (const record of records) {
      if (!isOurMutation(record)) {
        // A settings tab can mount in one React commit; scan on the next task.
        scheduleScan(0);
        return;
      }
    }
  }

  function startObserver() {
    if (state.observer || typeof MutationObserver !== 'function') return;
    try {
      const target = document.documentElement || document;
      const observer = new MutationObserver((records) => {
        safe(() => onMutations(records), 'observer');
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true });
      state.observer = observer;
    } catch (e) {
      problem('observer unavailable: ' + (e && e.message ? e.message : e));
    }
  }

  // ---------------------------------------------------------------------------
  // Settings and lifecycle
  // ---------------------------------------------------------------------------

  function normalizeLang(raw) {
    let lang = String(raw == null ? '' : raw).trim().replace(/_/g, '-');
    if (!lang) return '';
    const low = lang.toLowerCase();
    if (low === 'zh' || low.indexOf('zh-') === 0) {
      return /hant|tw|hk|mo/.test(low) ? 'zh-Hant' : 'zh-Hans';
    }
    return low.split('-')[0];
  }

  function resolveTarget(raw) {
    if (raw && String(raw).toLowerCase() !== 'auto') return normalizeLang(raw);
    let lang = '';
    try {
      lang = document.documentElement ? document.documentElement.lang : '';
    } catch (_) {
      lang = '';
    }
    if (!lang) {
      try {
        lang = navigator.language || '';
      } catch (_) {
        lang = '';
      }
    }
    return normalizeLang(lang);
  }

  function resolveProvider() {
    const p = String(state.settings.provider || 'auto').toLowerCase();
    if (p === 'google') {
      if (!state.googleWarned) {
        state.googleWarned = true;
        log('provider "google" is not implemented; using Edge');
      }
      return 'edge';
    }
    if (p === 'llm') return 'llm';
    if (p === 'auto') {
      const keySource = String(state.settings.llmKeySource || 'none').toLowerCase();
      return keySource !== 'none' && llmConfigured() ? 'llm' : 'edge';
    }
    return 'edge';
  }

  function rebuildKeysChanged(prev, next) {
    return (
      prev.targetLang !== next.targetLang ||
      prev.provider !== next.provider ||
      prev.llmBaseUrl !== next.llmBaseUrl ||
      prev.llmModel !== next.llmModel ||
      prev.llmKeySource !== next.llmKeySource ||
      glossarySignature(prev) !== glossarySignature(next) ||
      prev.scopeReadme !== next.scopeReadme ||
      prev.scopeSettings !== next.scopeSettings ||
      prev.scopeModName !== next.scopeModName ||
      prev.scopeModSummary !== next.scopeModSummary ||
      prev.scopeChangelog !== next.scopeChangelog
    );
  }

  // The first protocol revision had a single `scopeList`; a payload without the
  // split keys keeps its choice, and no key at all means both are on.
  function applyScopeSettings(raw, next) {
    const has = (key) => Object.prototype.hasOwnProperty.call(raw, key);
    const legacy = has('scopeList') ? !!raw.scopeList : undefined;
    const fallback = legacy === undefined ? true : legacy;
    if (!has('scopeModName')) next.scopeModName = fallback;
    if (!has('scopeModSummary')) next.scopeModSummary = fallback;
    next.scopeModName = next.scopeModName !== false;
    next.scopeModSummary = next.scopeModSummary !== false;
    delete next.scopeList;
  }

  function applySettings(raw) {
    if (!raw || typeof raw !== 'object') return;
    const prev = state.settings;
    const next = Object.assign(defaultSettings(), prev, raw);
    applyScopeSettings(raw, next);
    next.hoverDelayMs = clamp(next.hoverDelayMs, 0, 2000);
    next.batchSize = clamp(next.batchSize, 1, 100);
    next.batchChars = clamp(next.batchChars, 200, 200000);
    next.batchIntervalMs = clamp(next.batchIntervalMs, 0, 10000);
    next.concurrency = clamp(next.concurrency, 1, 8);
    next.timeoutMs = clamp(next.timeoutMs, 1000, 120000);
    next.cacheTtlDays = clamp(next.cacheTtlDays, 0, 3650);
    next.gestureToggle = next.gestureToggle !== false;
    if (!next.gestureToggle) lastTwoFingerTapAt = 0;

    state.settings = next;
    state.settingsSeen = true;
    state.settingsAttempts = 0;

    state.targetLang = resolveTarget(next.targetLang);
    const prevProvider = state.provider;
    const provider = resolveProvider();
    if (prevProvider !== provider) {
      // A new provider choice is a fresh start; a previous LLM failure must not
      // pin this configuration to Edge.
      state.llmFallback = false;
      state.llmWarned = false;
    }
    state.provider = provider;
    state.shortcuts.toggle = parseShortcut(next.shortcutToggle);

    if (next.clearCache) {
      // The mod clears its own store; the page forgets this session's map.
      cacheClear();
      next.clearCache = false;
    }

    const isFirst = state.settingsCount === 0;
    state.settingsCount++;
    const changed = isFirst || prevProvider !== provider || rebuildKeysChanged(prev, next);

    if (!state.targetLang) problem('no target language resolved; idle');

    if (changed) {
      state.epoch++;
      teardownAll();
      scheduleScan(0);
    } else {
      // Re-apply hover state (delay may have changed); rendered units stay as they are.
      for (const u of state.units) applyUnit(u, true);
    }
  }

  function setEnabled(on) {
    if (state.dead) return;
    on = !!on;
    resetPointerState();
    if (state.enabled === on) {
      if (on) {
        if (!state.settingsSeen) requestSettings();
        else scheduleScan(0);
      }
      return;
    }
    state.enabled = on;
    state.epoch++;
    teardownAll();
    if (on) {
      // Recovery from any state: without settings there is nothing to scan.
      if (!state.settingsSeen) {
        if (!state.connected) connect();
        requestSettings();
      } else {
        scheduleScan(0);
      }
    }
  }

  function onMessage(e) {
    if (state.dead) return;
    try {
      const data = e && e.data;
      if (typeof data !== 'string' || data.indexOf(TAG + SEP) !== 0) return;
      if (data === TAG + SEP + 'teardown') {
        teardown();
        return;
      }
      if (data.indexOf(TAG + SEP + 'http' + SEP) === 0) {
        onHttpReply(splitFields(data, 6));
        return;
      }
      if (data.indexOf(TAG + SEP + 'settings' + SEP) === 0) {
        const parts = splitFields(data, 3);
        let json = null;
        try {
          json = JSON.parse(parts[2]);
        } catch (_) {
          json = null;
        }
        if (json && typeof json === 'object') applySettings(json);
        return;
      }
      if (data.indexOf(TAG + SEP + 'cache-hit' + SEP) === 0) {
        onCacheHit(splitFields(data, 5));
        return;
      }
      if (data.indexOf(TAG + SEP + 'cache-miss' + SEP) === 0) {
        onCacheMiss(splitFields(data, 4));
      }
    } catch (err) {
      problem('message: ' + (err && err.message ? err.message : err));
    }
  }

  function requestSettings() {
    if (state.dead) return;
    state.settingsAttempts++;
    send(TAG + SEP + 'settings?');
    if (!state.settingsSeen && state.settingsAttempts < 3) {
      state.settingsTimer = setTimeout(() => {
        state.settingsTimer = 0;
        if (!state.settingsSeen) safe(requestSettings, 'settings-retry');
      }, 1500 * state.settingsAttempts);
    }
  }

  function connect() {
    if (state.dead) return false;
    const wv = CHANNEL();
    if (!wv) return false;
    if (!state.connected) {
      try {
        const listener = (e) => safe(() => onMessage(e), 'message');
        wv.addEventListener('message', listener);
        state.messageListener = listener;
        state.connected = true;
      } catch (e) {
        problem('message listener: ' + (e && e.message ? e.message : e));
        return false;
      }
      requestSettings();
      scheduleScan(250);
    }
    return true;
  }

  function installCss() {
    try {
      if (document.getElementById('whtr-style')) return;
      const style = document.createElement('style');
      style.id = 'whtr-style';
      style.textContent =
        '[' + ATTR_ORIG + '="1"]{display:none !important}' +
        '[' + ATTR_CLONE + '="1"]{box-shadow:inset 2px 0 0 rgba(99,150,255,.35)}';
      const parent = document.head || document.documentElement;
      if (parent) parent.appendChild(style);
    } catch (_) {
      /* CSP should allow inline styles, but stay quiet if not */
    }
  }

  const inputHandlers = [];

  function listen(target, type, fn, options) {
    const wrapped = (e) => safe(() => fn(e), type);
    try {
      target.addEventListener(type, wrapped, options);
      inputHandlers.push([target, type, wrapped, options]);
    } catch (e) {
      problem('listeners: ' + (e && e.message ? e.message : e));
    }
  }

  function removeInputHandlers() {
    for (const [target, type, fn, options] of inputHandlers) {
      try {
        target.removeEventListener(type, fn, options);
      } catch (_) {
        /* ignore */
      }
    }
    inputHandlers.length = 0;
  }

  function installInputHandlers() {
    listen(document, 'pointerover', onPointerOver, true);
    listen(document, 'pointerout', onPointerOut, true);
    listen(document, 'pointerdown', onPointerDown, true);
    listen(document, 'pointermove', onPointerMove, true);
    listen(document, 'pointerup', onPointerUp, true);
    listen(document, 'pointercancel', onPointerCancel, true);
    listen(window, 'keydown', onKeyDown, false);
    listen(window, 'load', () => {
      if (state.settingsSeen) scheduleScan(200);
    }, false);
  }

  function detachChannel() {
    const wv = CHANNEL();
    if (!wv || !state.messageListener) return;
    try {
      wv.removeEventListener('message', state.messageListener);
    } catch (_) {
      /* ignore */
    }
    state.messageListener = null;
  }

  // `teardown`: the mod is unloading. Run the disable path synchronously and
  // never talk to the mod again. No reply.
  function teardown() {
    if (state.dead) return;
    state.dead = true;
    state.enabled = false;
    state.epoch++;
    try {
      if (state.observer) state.observer.disconnect();
    } catch (_) {
      /* ignore */
    }
    state.observer = null;
    detachChannel();
    removeInputHandlers();
    resetPointerState();
    state.scanQueue = null;
    state.scanScheduled = false;
    state.renderScheduled = false;
    if (state.scanTimer) {
      clearTimeout(state.scanTimer);
      state.scanTimer = 0;
    }
    if (state.settingsTimer) {
      clearTimeout(state.settingsTimer);
      state.settingsTimer = 0;
    }
    for (const entry of Array.from(state.pending.values())) {
      try {
        clearTimeout(entry.timer);
      } catch (_) {
        /* ignore */
      }
      try {
        entry.resolve({ status: 0, body: '', error: -1 });
      } catch (_) {
        /* ignore */
      }
    }
    state.pending.clear();
    clearCacheLookups();
    teardownAll();
    try {
      const style = document.getElementById('whtr-style');
      if (style && style.parentNode) style.parentNode.removeChild(style);
    } catch (_) {
      /* ignore */
    }
    // A later injection in the same document must build a fresh engine, not
    // revive this dead one.
    try {
      if (window.__WHTR__ === publicApi) delete window.__WHTR__;
    } catch (_) {
      try {
        window.__WHTR__ = undefined;
      } catch (_) {
        /* ignore */
      }
    }
  }

  function revivify() {
    if (state.dead) return;
    if (!state.connected) connect();
    if (!state.settingsSeen) requestSettings();
    if (state.enabled && state.settingsSeen) scheduleScan(0);
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  try {
    const prev = window.__WHTR__;
    const engine = prev && prev.__engine;
    if (engine && typeof engine.revive === 'function') {
      // A leftover handle from a dead engine is replaced; only a live engine
      // makes this the navigation-completed re-injection.
      let alive = true;
      if (typeof engine.alive === 'function') {
        try {
          alive = !!engine.alive();
        } catch (_) {
          alive = false;
        }
      }
      if (alive) {
        try {
          engine.revive();
        } catch (_) {
          /* ignore */
        }
        return;
      }
    }
  } catch (_) {
    /* ignore */
  }

  try {
    installCss();
    startObserver();
    installInputHandlers();

    const deadline = Date.now() + 5000;
    const boot = () => {
      if (state.dead) return;
      if (connect()) return;
      if (Date.now() < deadline) setTimeout(() => safe(boot, 'boot'), 50);
    };
    boot();

    publicApi = {
      __engine: { revive: revivify, alive: () => !state.dead },
      version: VERSION,
      enable: () => safe(() => setEnabled(true), 'api.enable'),
      disable: () => safe(() => setEnabled(false), 'api.disable'),
      stats: () => safe(snapshot, 'api.stats') || {},
      rescan: () => safe(() => scheduleScan(0), 'api.rescan')
    };
    window.__WHTR__ = publicApi;
  } catch (e) {
    try {
      problem('boot: ' + (e && e.message ? e.message : e));
    } catch (_) {
      /* ignore */
    }
  }
})();
