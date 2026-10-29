/*!
 * windhawk-ui-translator - page-side engine (P1)
 *
 * Runs inside the Windhawk 2.0 UI (http://tauri.localhost/), injected by the
 * mod at document-created time and again on navigation completion.
 *
 * Self-contained ES2020 IIFE: no imports, no eval, no network access. Every
 * byte leaves the page through the mod's `whtr1` channel (see docs/PROTOCOL.md).
 *
 * Default view is the translation in place. Pointer over a translated block
 * shows the original; pointer out restores the translation. On touch a tap
 * toggles the original for that block.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0-p1';
  const TAG = 'whtr1';
  const SEP = '\x1f';

  // Attributes we own. data-wh-orig hides React's own node, data-wh-clone
  // marks our clone, data-wh-swapped marks a text-node swap.
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

  const hash32 = (s) => {
    // FNV-1a, 32 bit; collisions are made less likely by appending the length
    // in the cache key.
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= s.length;
    return (h >>> 0).toString(16).padStart(8, '0');
  };

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
      scopeReadme: true,
      scopeSettings: true,
      scopeList: true,
      scopeChangelog: true,
      hoverDelayMs: 120,
      shortcutToggle: 'Alt+Q',
      shortcutMode: 'Alt+W',
      batchSize: 20,
      batchChars: 10000,
      batchIntervalMs: 400,
      concurrency: 4,
      timeoutMs: 30000,
      cacheEnabled: true,
      cacheTtlDays: 30,
      clearCache: false,
      debug: false
    };
  }

  const state = {
    settings: defaultSettings(),
    settingsSeen: false,
    settingsCount: 0,
    connected: false,
    enabled: true,
    showOrigMode: false,
    targetLang: '',
    provider: 'edge',
    providerWarned: false,
    epoch: 0,
    units: new Set(),
    unitByHost: new WeakMap(),
    unitByDisplay: new WeakMap(),
    written: new WeakMap(), // Text node -> value we wrote last
    origText: new WeakMap(), // Text node -> last known React-authored value
    nextUnitId: 1,
    nextRequestId: 1,
    pending: new Map(),
    queue: [],
    inflight: 0,
    flushTimer: 0,
    scanTimer: 0,
    observer: null,
    renderQueue: new Set(),
    renderScheduled: false,
    scanQueue: null,
    scanScheduled: false,
    shortcuts: { toggle: null, mode: null },
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

  function log(msg) {
    if (!state.settings.debug) return;
    send(TAG + SEP + 'log' + SEP + clean(msg).slice(0, 500));
  }

  function problem(msg) {
    // Errors are rare and the protocol wants them in p0.log even when verbose
    // logging is off.
    send(TAG + SEP + 'log' + SEP + ('whtr: ' + clean(msg)).slice(0, 500));
  }

  function send(text) {
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
      mode: state.showOrigMode ? 'original' : 'translation',
      settingsSeen: state.settingsSeen,
      connected: state.connected,
      targetLang: state.targetLang,
      provider: state.provider,
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
        const headers = [];
        const raw = opts && opts.headers;
        if (Array.isArray(raw)) {
          for (const pair of raw) {
            if (Array.isArray(pair) && pair.length >= 2) headers.push([pair[0], pair[1]]);
          }
        } else if (raw && typeof raw === 'object') {
          for (const name of Object.keys(raw)) headers.push([name, raw[name]]);
        }
        const cleanHeaders = [];
        for (const [name, value] of headers) {
          const n = String(name);
          const v = String(value == null ? '' : value);
          if (!n || n.indexOf(SEP) !== -1 || v.indexOf(SEP) !== -1) continue;
          if (cleanHeaders.length >= 32) break;
          cleanHeaders.push([n, v]);
        }
        const body = String(opts && opts.body != null ? opts.body : '');
        const id = state.nextRequestId++;
        const fields = [TAG, 'http', String(id), method, url, String(cleanHeaders.length)];
        for (const pair of cleanHeaders) fields.push(pair[0], pair[1]);
        fields.push(body);

        const ms = clamp(state.settings.timeoutMs, 1000, 120000) || 30000;
        const timer = setTimeout(() => {
          if (!state.pending.has(id)) return;
          state.pending.delete(id);
          state.stats.errors++;
          done({ status: 0, body: '', error: -2 });
        }, ms);

        state.pending.set(id, { resolve: done, timer: timer });
        state.stats.requests++;
        wv.postMessage(fields.join(SEP));
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
        return;
      }
      if (shortcutMatches(state.shortcuts.mode, e)) {
        e.preventDefault();
        toggleMode();
      }
    } catch (err) {
      problem('shortcut: ' + (err && err.message ? err.message : err));
    }
  }

  // ---------------------------------------------------------------------------
  // Scanning
  // ---------------------------------------------------------------------------

  const PROSE_SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th';
  const SETTINGS_SELECTORS = [
    '[data-testid="mod-setting-description-text"]',
    '[data-testid="mod-setting-reset"]',
    '.ant-select-item-option-content',
    '.windhawk-row-meta-title',
    '.windhawk-row-meta-description'
  ];
  const LIST_SELECTORS = ['.windhawk-row-meta-title', '.windhawk-row-meta-description', '.ant-typography'];

  // Elements whose whole subtree is left alone. Everything else is either a
  // structural inline wrapper or an atomic placeholder (see serializeHost).
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
    if (NUMERIC_RE.test(t)) return false;
    return true;
  }

  function scopeEnabled(surface) {
    const s = state.settings;
    if (surface === 'readme') return !!s.scopeReadme;
    if (surface === 'changelog') return !!s.scopeChangelog;
    if (surface === 'settings') return !!s.scopeSettings;
    return !!s.scopeList;
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

  function compactSurface(el) {
    try {
      if (el.closest('[data-testid*="setting"], .ant-select-dropdown, .ant-modal, .ant-drawer, .ant-form')) {
        return 'settings';
      }
      const row = el.closest('.windhawk-row');
      if (
        row &&
        row.querySelector('.ant-select,.ant-switch,.ant-input,.ant-btn,[data-testid="mod-setting-reset"]')
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

  // Block-level content marks a container rather than a label sitting next to
  // an icon. Used by isIconLabelRow below.
  const BLOCK_CONTENT_SEL =
    'address,article,aside,blockquote,div,dl,fieldset,figcaption,figure,footer,' +
    'form,h1,h2,h3,h4,h5,h6,header,hr,li,main,nav,ol,p,pre,section,table,ul';

  // The mod details header (Card.Meta title) packs the mod name, the id chip,
  // the metadata line (version / author / process scope) and the action
  // buttons into one subtree. Only the summary Typography element there is
  // prose; the rest are proper nouns or controls. This rule deliberately wins
  // over every other selector: nothing but .ant-typography in a card head is
  // ever eligible.
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

  // An icon + label row (author, process scope) carries proper nouns that must
  // stay as authored. Only skip when the icon is the element's only non-inline
  // content: a settings description or a summary has no <svg>, so it is never
  // swallowed by this rule.
  function isIconLabelRow(el) {
    let icon = null;
    try {
      icon = el.querySelector('svg');
    } catch (_) {
      return false;
    }
    if (!icon) return false;
    let blocks = [];
    try {
      blocks = Array.from(el.querySelectorAll(BLOCK_CONTENT_SEL));
    } catch (_) {
      blocks = [];
    }
    for (const block of blocks) {
      if ((block.textContent || '').trim()) return false;
    }
    return true;
  }

  function eligibleHost(el) {
    if (!el || el.nodeType !== 1) return false;
    if (isCardHeadHost(el) && !isTypography(el)) return false;
    if (isIconLabelRow(el)) return false;
    return true;
  }

  function scanAll() {
    // The document-created injection may run before <head> exists; retry the
    // stylesheet on every scan until it lands.
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

    // README / changelog prose blocks. React owns these nodes, so they are
    // rendered as a translated clone.
    if (state.settings.scopeReadme || state.settings.scopeChangelog) {
      let bodies = [];
      try {
        bodies = Array.from(document.querySelectorAll('[data-testid="mod-details"] .ant-card-body'));
      } catch (_) {
        bodies = [];
      }
      for (const body of bodies) {
        const surface = classifyProse(body);
        if (!scopeEnabled(surface)) continue;
        let blocks = [];
        try {
          blocks = Array.from(body.querySelectorAll(PROSE_SEL));
        } catch (_) {
          blocks = [];
        }
        for (const block of blocks) {
          if (block.closest('[' + ATTR_CLONE + '="1"]')) continue;
          if (block.closest(DENY_ANCESTOR_SEL)) continue;
          if (!eligibleHost(block)) continue;
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
          if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
          if (el.closest(DENY_ANCESTOR_SEL)) continue;
          if (!eligibleHost(el)) continue;
          if (compactSurface(el) !== 'settings') continue;
          if (!hasText(el)) continue;
          if (!claim(el)) continue;
          candidates.push({ el: el, mode: 'swap', surface: 'settings' });
        }
      }
    }

    // List surfaces: also swap.
    if (state.settings.scopeList) {
      for (const sel of LIST_SELECTORS) {
        let list = [];
        try {
          list = Array.from(document.querySelectorAll(sel));
        } catch (_) {
          list = [];
        }
        for (const el of list) {
          if (el.closest('[' + ATTR_CLONE + '="1"]')) continue;
          if (el.closest(DENY_ANCESTOR_SEL)) continue;
          if (!eligibleHost(el)) continue;
          if (compactSurface(el) !== 'list') continue;
          if (!hasText(el)) continue;
          if (!claim(el)) continue;
          candidates.push({ el: el, mode: 'swap', surface: 'list' });
        }
      }
    }

    state.stats.scannedHosts += candidates.length;
    state.scanQueue = { items: candidates, at: 0, epoch: state.epoch };
    scheduleScanChunk();
  }

  function scheduleScanChunk() {
    if (state.scanScheduled) return;
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
        safe(() => processHost(item.el, item.mode, item.surface), 'scan-host');
      }
      n++;
      const left = deadline && typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 8;
      if (n >= 25 || left < 2) break;
    }
    if (queue.at < queue.items.length) scheduleScanChunk();
    else if (state.scanQueue === queue) state.scanQueue = null;
  }

  function scheduleScan(delay) {
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
  // clone mode:  <n>inner</n>   structural wrapper (cloned on render)
  //              {{n}}           atomic node (code, img, input, unknown tag)
  // swap mode:   {{n}} only; inline wrappers are flattened into text segments.
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

  function serializeHost(host, mode) {
    const refs = [];
    const segs = [];
    let out = '';
    const walk = (node) => {
      let child = node.firstChild;
      while (child) {
        if (child.nodeType === 3) {
          const value = child.nodeValue || '';
          if (mode === 'swap') {
            segs.push({ kind: 'text', node: child, orig: value, out: value });
            state.origText.set(child, value);
          }
          out += value;
        } else if (child.nodeType === 1) {
          const el = child;
          if (!isSkippedElement(el)) {
            if (isAtomicElement(el)) {
              const index = refs.length;
              refs.push(el);
              out += '{{' + index + '}}';
              if (mode === 'swap') segs.push({ kind: 'token', index: index, el: el });
            } else if (STRUCT_TAGS.has(el.tagName)) {
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

  function resetForSource(u, serialized) {
    u.refs = serialized.refs;
    u.segs = serialized.segs;
    u.source = serialized.text;
    u.sourceHash = hash32(serialized.text);
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
    if (!isTranslatable(serialized.text)) {
      u.skip = true;
      u.parts = [];
      return;
    }
    u.skip = false;
    u.parts = splitSerialized(serialized.text, 1000).map((text) => ({
      text: text,
      translated: null,
      state: 0,
      unit: u
    }));
    for (const part of u.parts) enqueuePart(u, part);
  }

  function processHost(el, mode, surface) {
    let u = state.unitByHost.get(el);
    if (!el.isConnected) {
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
      serialized = serializeHost(el, 'swap');
    } else {
      serialized = serializeHost(el, mode);
    }

    const hash = hash32(serialized.text);
    if (u.sourceHash === hash && (u.translatedOk || u.parts.length)) {
      const refsSame = refsEqual(u.refs, serialized.refs);
      u.refs = serialized.refs;
      u.segs = serialized.segs;
      if (mode === 'swap') {
        // React can replace the text nodes with identical text; the old
        // translation is still valid, but the outputs must be remapped.
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
    state.renderQueue.clear();
    if (state.flushTimer) {
      clearTimeout(state.flushTimer);
      state.flushTimer = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Translation queue
  // ---------------------------------------------------------------------------

  function warnProviderOnce() {
    if (state.providerWarned) return;
    state.providerWarned = true;
    log('provider "' + state.provider + '" is not implemented in P1; idle');
  }

  function enqueuePart(u, part) {
    if (!state.enabled) return;
    if (!state.targetLang) {
      part.state = 4;
      return;
    }
    if (state.provider !== 'edge') {
      warnProviderOnce();
      part.state = 4;
      return;
    }
    const cached = cacheGet(part.text);
    if (cached !== undefined) {
      part.translated = cached;
      part.state = 3;
      state.stats.cacheHits++;
      maybeFinishUnit(u);
      return;
    }
    state.stats.cacheMisses++;
    part.state = 1;
    state.queue.push({ u: u, p: part });
    scheduleFlush();
  }

  function scheduleFlush() {
    if (state.flushTimer) return;
    const ms = clamp(state.settings.batchIntervalMs, 0, 10000);
    state.flushTimer = setTimeout(() => {
      state.flushTimer = 0;
      safe(flushQueue, 'flush');
    }, ms);
  }

  function flushQueue() {
    if (!state.enabled || state.provider !== 'edge' || !state.targetLang) return;
    const s = state.settings;
    while (state.queue.length && state.inflight < s.concurrency) {
      const batch = [];
      let chars = 0;
      while (state.queue.length && batch.length < s.batchSize) {
        const entry = state.queue[0];
        if (batch.length && chars + entry.p.text.length > s.batchChars) break;
        state.queue.shift();
        batch.push(entry);
        chars += entry.p.text.length;
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

  async function runBatch(entries, epoch) {
    const parts = entries.map((e) => e.p);
    for (let i = 0; i < parts.length; i += 10) {
      if (!state.enabled || state.epoch !== epoch) return;
      const chunk = parts.slice(i, i + 10);
      const texts = chunk.map((p) => p.text);
      let translated = null;
      try {
        translated = await translateChunk(texts, epoch);
      } catch (e) {
        translated = null;
      }
      if (state.epoch !== epoch) return;
      if (!translated || translated.length !== chunk.length) {
        for (const p of chunk) p.state = 4;
        state.stats.batchesFailed++;
        state.stats.errors++;
        continue;
      }
      for (let j = 0; j < chunk.length; j++) {
        const p = chunk[j];
        p.translated = translated[j];
        p.state = 3;
        state.stats.translations++;
        cacheSet(p.text, translated[j]);
      }
      for (const p of chunk) if (p.unit && p.unit.parts.indexOf(p) !== -1) maybeFinishUnit(p.unit);
    }
  }

  const EDGE_URL =
    'https://edge.microsoft.com/translate/translatetext?from=&to=';

  async function translateChunk(texts, epoch) {
    const url = EDGE_URL + encodeURIComponent(state.targetLang) + '&isEnterpriseClient=false';
    let why = '';
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (!state.enabled || state.epoch !== epoch) return null;
      const res = await httpRequest({
        method: 'POST',
        url: url,
        headers: { 'Content-Type': 'application/json' },
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
    let same = true;
    for (const p of u.parts) {
      if (p.translated !== p.text) {
        same = false;
        break;
      }
    }
    u.noop = same;
    if (u.noop) {
      u.rendered = false;
      return;
    }
    scheduleRender(u);
  }

  // ---------------------------------------------------------------------------
  // Cache (localStorage, keyed by provider|lang|hash, 3 MB LRU)
  // ---------------------------------------------------------------------------

  const CACHE_PREFIX = 'whtr1|';
  const CACHE_LIMIT = 3 * 1024 * 1024;
  const CACHE_TARGET = Math.floor(CACHE_LIMIT * 0.8);
  let cacheIndex = null;
  let cacheTotal = 0;
  let cacheWarned = false;

  function storage() {
    try {
      return window.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  function cacheKey(text) {
    return CACHE_PREFIX + state.provider + '|' + state.targetLang + '|' + hash32(text) + '|' + text.length;
  }

  function cacheTtlMs() {
    const days = clamp(state.settings.cacheTtlDays, 0, 3650);
    return days > 0 ? days * 86400000 : 0;
  }

  function cacheEnsureIndex() {
    if (cacheIndex) return;
    cacheIndex = new Map();
    cacheTotal = 0;
    const ls = storage();
    if (!ls) return;
    const keys = [];
    try {
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (key && key.indexOf(CACHE_PREFIX) === 0) keys.push(key);
      }
    } catch (_) {
      return;
    }
    for (const key of keys) {
      let value = null;
      try {
        value = ls.getItem(key);
      } catch (_) {
        value = null;
      }
      if (value == null) continue;
      let rec = null;
      try {
        rec = JSON.parse(value);
      } catch (_) {
        rec = null;
      }
      if (!rec || typeof rec.t !== 'string' || typeof rec.at !== 'number') {
        try {
          ls.removeItem(key);
        } catch (_) {
          /* ignore */
        }
        continue;
      }
      const bytes = (key.length + value.length) * 2;
      cacheIndex.set(key, { bytes: bytes, at: rec.at, used: rec.used || rec.at });
      cacheTotal += bytes;
    }
  }

  function cacheGet(text) {
    if (!state.settings.cacheEnabled) return undefined;
    const ls = storage();
    if (!ls) return undefined;
    cacheEnsureIndex();
    const key = cacheKey(text);
    let raw = null;
    try {
      raw = ls.getItem(key);
    } catch (_) {
      return undefined;
    }
    if (raw == null) return undefined;
    let rec = null;
    try {
      rec = JSON.parse(raw);
    } catch (_) {
      rec = null;
    }
    if (!rec || typeof rec.t !== 'string' || typeof rec.at !== 'number') {
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      const old = cacheIndex.get(key);
      if (old) {
        cacheTotal -= old.bytes;
        cacheIndex.delete(key);
      }
      return undefined;
    }
    const ttl = cacheTtlMs();
    if (ttl > 0 && Date.now() - rec.at > ttl) {
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      const old = cacheIndex.get(key);
      if (old) {
        cacheTotal -= old.bytes;
        cacheIndex.delete(key);
      }
      return undefined;
    }
    // LRU touch at most once an hour to keep writes rare.
    const used = rec.used || rec.at;
    if (Date.now() - used > 3600000) {
      rec.used = Date.now();
      try {
        ls.setItem(key, JSON.stringify(rec));
      } catch (_) {
        /* ignore */
      }
    }
    const info = cacheIndex.get(key);
    if (info) info.used = Date.now();
    return rec.t;
  }

  function cacheSet(text, translated) {
    if (!state.settings.cacheEnabled) return;
    if (typeof translated !== 'string') return;
    const ls = storage();
    if (!ls) return;
    cacheEnsureIndex();
    const key = cacheKey(text);
    const value = JSON.stringify({ t: translated, at: Date.now(), used: Date.now() });
    try {
      ls.setItem(key, value);
    } catch (e) {
      if (!cacheWarned) {
        cacheWarned = true;
        log('cache write failed: ' + (e && e.message ? e.message : e));
      }
      cacheTrimHard();
      try {
        ls.setItem(key, value);
      } catch (_) {
        return;
      }
    }
    const old = cacheIndex.get(key);
    if (old) cacheTotal -= old.bytes;
    const bytes = (key.length + value.length) * 2;
    cacheIndex.set(key, { bytes: bytes, at: Date.now(), used: Date.now() });
    cacheTotal += bytes;
    if (cacheTotal > CACHE_LIMIT) cacheTrim(CACHE_TARGET);
  }

  function cacheTrim(limit) {
    if (!cacheIndex) return;
    const ls = storage();
    if (!ls) return;
    const ttl = cacheTtlMs();
    const now = Date.now();
    const entries = Array.from(cacheIndex.entries()).sort((a, b) => {
      return (a[1].used || a[1].at) - (b[1].used || b[1].at);
    });
    for (const [key, info] of entries) {
      const expired = ttl > 0 && now - info.at > ttl;
      if (!expired && cacheTotal <= limit) break;
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      cacheIndex.delete(key);
      cacheTotal -= info.bytes;
    }
  }

  function cacheTrimHard() {
    if (!cacheIndex) return;
    const ls = storage();
    if (!ls) return;
    const entries = Array.from(cacheIndex.entries()).sort((a, b) => {
      return (a[1].used || a[1].at) - (b[1].used || b[1].at);
    });
    const target = Math.floor(cacheTotal / 2);
    for (const [key, info] of entries) {
      if (cacheTotal <= target) break;
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
      cacheIndex.delete(key);
      cacheTotal -= info.bytes;
    }
  }

  function cacheClear() {
    const ls = storage();
    cacheIndex = new Map();
    cacheTotal = 0;
    if (!ls) return;
    const keys = [];
    try {
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (key && key.indexOf(CACHE_PREFIX) === 0) keys.push(key);
      }
    } catch (_) {
      return;
    }
    for (const key of keys) {
      try {
        ls.removeItem(key);
      } catch (_) {
        /* ignore */
      }
    }
    log('cache cleared');
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
      if (part.translated == null) continue;
      try {
        clone.appendChild(buildFragment(part.translated, u.refs));
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
    if (segs.length === 1) {
      segs[0].out = edgeSpaces(segs[0].orig, text);
      return;
    }
    let total = 0;
    for (const seg of segs) total += Math.max(1, (seg.orig || '').length);
    const chars = Array.from(text);
    let index = 0;
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      acc += Math.max(1, (seg.orig || '').length);
      let end = i === segs.length - 1 ? chars.length : Math.round((chars.length * acc) / total);
      if (end < index) end = index;
      const piece = chars.slice(index, end).join('');
      index = end;
      seg.out = edgeSpaces(seg.orig, piece);
    }
  }

  function computeSwapOutputs(u) {
    const source = u.parts.map((p) => (p.translated == null ? '' : p.translated)).join('');
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
      // A third value means React re-rendered this node; leave it for the
      // observer and translate the new source instead of fighting React.
      if (node.nodeValue !== seg.orig && node.nodeValue !== seg.out) continue;
      node.nodeValue = want;
      state.written.set(node, want);
    }
  }

  function swapOutputsReady(u) {
    return u.parts.length > 0 && u.parts.every((p) => p.translated != null);
  }

  // ---------------------------------------------------------------------------
  // Rendering: shared
  // ---------------------------------------------------------------------------

  function scheduleRender(u) {
    if (!u) return;
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
    if (state.renderScheduled) return;
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
    return !state.enabled || state.showOrigMode || u.hoverOrig || u.tapOrig;
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
    // Short grace: hiding the clone reveals React's node under the cursor, which
    // must not immediately restart the hover loop.
    const grace = Math.max(120, clamp(state.settings.hoverDelayMs, 0, 2000));
    u.leaveTimer = setTimeout(() => {
      u.leaveTimer = 0;
      safe(() => {
        u.hoverOrig = false;
        applyUnit(u);
      }, 'hover-out');
    }, grace);
  }

  let touchStart = null;

  function onPointerDown(e) {
    if (!state.enabled || e.pointerType !== 'touch') return;
    touchStart = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
  }

  function onPointerUp(e) {
    if (!state.enabled || e.pointerType !== 'touch') return;
    const start = touchStart;
    touchStart = null;
    if (start && start.id === e.pointerId) {
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > 10 || dy > 10 || Date.now() - start.t > 900) return;
    }
    const u = unitFromEvent(e);
    if (!u) return;
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

  function onPointerCancel() {
    touchStart = null;
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
        scheduleScan(150);
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
      log('observer unavailable: ' + (e && e.message ? e.message : e));
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
    if (p === 'auto' || p === 'edge') return 'edge';
    return p;
  }

  function rebuildKeysChanged(prev, next) {
    return (
      prev.targetLang !== next.targetLang ||
      prev.provider !== next.provider ||
      prev.scopeReadme !== next.scopeReadme ||
      prev.scopeSettings !== next.scopeSettings ||
      prev.scopeList !== next.scopeList ||
      prev.scopeChangelog !== next.scopeChangelog
    );
  }

  function applySettings(raw) {
    if (!raw || typeof raw !== 'object') return;
    const prev = state.settings;
    const next = Object.assign(defaultSettings(), prev, raw);
    next.hoverDelayMs = clamp(next.hoverDelayMs, 0, 2000);
    next.batchSize = clamp(next.batchSize, 1, 100);
    next.batchChars = clamp(next.batchChars, 200, 200000);
    next.batchIntervalMs = clamp(next.batchIntervalMs, 0, 10000);
    next.concurrency = clamp(next.concurrency, 1, 8);
    next.timeoutMs = clamp(next.timeoutMs, 1000, 120000);
    next.cacheTtlDays = clamp(next.cacheTtlDays, 0, 3650);
    next.debug = !!next.debug;

    state.settings = next;
    state.settingsSeen = true;
    state.settingsAttempts = 0;

    state.targetLang = resolveTarget(next.targetLang);
    const provider = resolveProvider();
    if (state.provider !== provider) state.providerWarned = false;
    state.provider = provider;
    state.shortcuts.toggle = parseShortcut(next.shortcutToggle);
    state.shortcuts.mode = parseShortcut(next.shortcutMode);

    if (next.clearCache) {
      cacheClear();
      next.clearCache = false;
    }
    if (next.cacheEnabled) cacheEnsureIndex();

    const isFirst = state.settingsCount === 0;
    state.settingsCount++;
    const changed = isFirst || rebuildKeysChanged(prev, next);

    log(
      'settings: lang=' + state.targetLang + ' provider=' + state.provider +
      ' scopes=' + [next.scopeReadme, next.scopeSettings, next.scopeList, next.scopeChangelog].join('') +
      ' debug=' + next.debug
    );

    if (!state.targetLang) problem('no target language resolved; idle');
    if (state.provider !== 'edge') warnProviderOnce();

    if (changed) {
      state.epoch++;
      teardownAll();
      scheduleScan(0);
    } else {
      // Non-structural settings: re-apply hover state (delay may have changed)
      // and let cached, already rendered units stay as they are.
      for (const u of state.units) applyUnit(u, true);
    }
  }

  function setEnabled(on) {
    on = !!on;
    if (state.enabled === on) {
      if (on) scheduleScan(0);
      return;
    }
    state.enabled = on;
    state.epoch++;
    teardownAll();
    if (on) {
      log('enabled');
      scheduleScan(0);
    } else {
      log('disabled');
    }
  }

  function toggleMode() {
    state.showOrigMode = !state.showOrigMode;
    for (const u of state.units) {
      if (!state.showOrigMode) u.tapOrig = false;
      applyUnit(u, true);
    }
    log('mode: ' + (state.showOrigMode ? 'original' : 'translation'));
  }

  function onMessage(e) {
    try {
      const data = e && e.data;
      if (typeof data !== 'string' || data.indexOf(TAG + SEP) !== 0) return;
      if (data.indexOf(TAG + SEP + 'http' + SEP) === 0) {
        const parts = data.split(SEP, 6);
        onHttpReply(parts);
        return;
      }
      if (data.indexOf(TAG + SEP + 'settings' + SEP) === 0) {
        const parts = data.split(SEP, 3);
        let json = null;
        try {
          json = JSON.parse(parts[2]);
        } catch (_) {
          json = null;
        }
        if (json && typeof json === 'object') applySettings(json);
      }
    } catch (err) {
      problem('message: ' + (err && err.message ? err.message : err));
    }
  }

  function requestSettings() {
    state.settingsAttempts++;
    send(TAG + SEP + 'settings?');
    if (!state.settingsSeen && state.settingsAttempts < 3) {
      setTimeout(() => {
        if (!state.settingsSeen) safe(requestSettings, 'settings-retry');
      }, 1500 * state.settingsAttempts);
    }
  }

  function connect() {
    const wv = CHANNEL();
    if (!wv) return false;
    if (!state.connected) {
      try {
        wv.addEventListener('message', (e) => safe(() => onMessage(e), 'message'));
        state.connected = true;
      } catch (e) {
        problem('message listener: ' + (e && e.message ? e.message : e));
        return false;
      }
      log('engine ' + VERSION + ' connected; href=' + location.href);
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

  function installInputHandlers() {
    try {
      document.addEventListener('pointerover', (e) => safe(() => onPointerOver(e), 'pointerover'), true);
      document.addEventListener('pointerout', (e) => safe(() => onPointerOut(e), 'pointerout'), true);
      document.addEventListener('pointerdown', (e) => safe(() => onPointerDown(e), 'pointerdown'), true);
      document.addEventListener('pointerup', (e) => safe(() => onPointerUp(e), 'pointerup'), true);
      document.addEventListener('pointercancel', () => safe(onPointerCancel, 'pointercancel'), true);
      window.addEventListener('keydown', (e) => safe(() => onKeyDown(e), 'keydown'));
      window.addEventListener('load', () => {
        safe(() => {
          if (state.settingsSeen) scheduleScan(200);
        }, 'load');
      });
    } catch (e) {
      problem('listeners: ' + (e && e.message ? e.message : e));
    }
  }

  function revivify() {
    if (!state.connected) connect();
    if (!state.settingsSeen) requestSettings();
    if (state.enabled && state.settingsSeen) scheduleScan(0);
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  try {
    if (window.__WHTR__ && window.__WHTR__.__engine) {
      // The mod runs the document-created script and the navigation-completed
      // script; the second injection must not build a second engine.
      try {
        window.__WHTR__.__engine.revive();
      } catch (_) {
        /* ignore */
      }
      return;
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
      if (connect()) return;
      if (Date.now() < deadline) setTimeout(() => safe(boot, 'boot'), 50);
    };
    boot();

    window.__WHTR__ = {
      __engine: { revive: revivify },
      version: VERSION,
      enable: () => safe(() => setEnabled(true), 'api.enable'),
      disable: () => safe(() => setEnabled(false), 'api.disable'),
      stats: () => safe(snapshot, 'api.stats') || {},
      rescan: () => safe(() => scheduleScan(0), 'api.rescan')
    };
    log('engine armed ' + VERSION);
  } catch (e) {
    try {
      problem('boot: ' + (e && e.message ? e.message : e));
    } catch (_) {
      /* ignore */
    }
  }
})();
