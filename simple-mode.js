/*
 * simple-mode.js — "Simple mode" add-on for pdf-to-cgm (PDF → CGM CAD Vector Workbench).
 *
 * Integration (index.html only, no other edits):
 *   <link rel="stylesheet" href="affordance.css" />       (in <head>, after the inline <style>; both modes)
 *   <link rel="stylesheet" href="simple-mode.css" />      (in <head>, after the inline <style>)
 *   <script src="simple-mode.js"></script>                (after the app.js <script>)
 *
 * Design rules:
 *  - Advanced mode == the original UI. Simple mode is body.sm-simple + add-on chrome (class prefix "sm-").
 *  - Every Simple control PROXIES to the original control at the moment it is used:
 *      buttons  -> original.click()
 *      selects  -> original.value = v + 'change'          (app.js listens to 'change')
 *      width    -> original.value = v + 'input' / 'change' (app.js listens to both, same as typing)
 *      checkbox -> original.checked = !checked + 'change'
 *    app.js (an IIFE with no public API) stays the single source of truth and is never patched.
 *  - Originals are found by id first, then by structural selector, then by label / button text, so a
 *    renamed id does not silently break a proxy.
 *  - The stats chips and the inspector are MOVED into the Info sheet (listeners intact) and restored to
 *    their exact original positions via placeholder comments when switching back to Advanced.
 *  - Add-on markup never uses the class "tab" or data-tab: app.js binds document.querySelectorAll(".tab").
 */
(function () {
  'use strict';
  if (window.PDF2CGMSimpleMode) return;

  const STORE_KEY = 'pdf-to-cgm.uiMode';
  const MODES = ['simple', 'advanced'];
  const ADDON = '.sm-pop, .sm-pill, .sm-sheet, .sm-topbar, .sm-dialog, .sm-modeswitch, .sm-dropveil';
  const PHONE = '(max-width: 720px)';

  // ------------------------------------------------------------------ robust lookup of original controls
  // Each entry: CSS selectors (first match outside add-on chrome wins), /regex/ = button whose text matches,
  // 'label:Text' = the form control belonging to the label whose text starts with Text.
  const CTRL = {
    fileInput: ['#fileInput', '.dropzone input[type="file"]', 'input[type="file"][accept*="pdf"]', 'input[type="file"]'],
    dropzone: ['#dropzone', '.dropzone', '.drop-strip [class*="drop"]'],
    loadSample: ['#btnLoadSample', /load sample/i],
    dlBinary: ['#btnDownloadBinary', '.top-actions .btn-primary', /download binary/i],
    dlText: ['#btnDownloadText', /clear-?text/i],
    prev: ['#btnPrevPage', '.page-nav button:first-of-type', /prev/i],
    next: ['#btnNextPage', '.page-nav button:last-of-type', /next/i],
    pageInd: ['#pageIndicator', '.page-nav span'],
    status: ['#statusBadge', '.stat-pills .pill-ok', '.stat-pills .pill:first-child'],
    statBytes: ['#statBytes'],
    fileName: ['#fileNameLabel', '.dz-title'],
    fileMeta: ['#fileMetaLabel', '.dz-hint'],
    pdfDim: ['#pdfDimLabel'],
    aspect: ['#lblTargetAspect'],
    blueprint: ['#chkBlueprint', 'label:Blueprint'],
    nodes: ['#chkNodes', 'label:Show Vertices', 'label:Vertices'],
    statPills: ['.stat-pills', '#statBytes'],
    inspector: ['section.inspector', '.inspector', '#inspectorContent'],
    profile: ['#selProfile', 'label:CGM Profile', 'label:Profile'],
    mode: ['#selMode', 'label:Geometry'],
    textMode: ['#selTextMode', 'label:Text Handling', 'label:Text'],
    scope: ['#selScope', 'label:Page Scope', 'label:Scope'],
    tolerance: ['#selTolerance', 'label:Curve Tolerance', 'label:Tolerance'],
    width: ['#inpTargetWidth', 'label:Target Width', '.options-bar input[type="number"]']
  };
  // true for original app nodes, including originals that are currently moved into the Info sheet
  const outside = (el) => !!el && (!el.closest(ADDON) || moved.some((m) => m.node.contains(el)));
  function controlOfLabel(lab) {
    if (lab.control) return lab.control;
    const inner = lab.querySelector('input, select, textarea');
    if (inner) return inner;
    const grp = lab.parentElement;
    return grp ? grp.querySelector('input, select, textarea') : null;
  }
  function find(key) {
    for (const s of CTRL[key] || []) {
      let el = null;
      if (s instanceof RegExp) {
        el = [...document.querySelectorAll('button')].find((b) => outside(b) && s.test(b.textContent));
      } else if (s.startsWith('label:')) {
        const want = s.slice(6).toLowerCase();
        const lab = [...document.querySelectorAll('label')].find((l) => outside(l) && l.textContent.trim().toLowerCase().startsWith(want));
        el = lab ? controlOfLabel(lab) : null;
      } else {
        el = [...document.querySelectorAll(s)].find(outside) || null;
      }
      if (el) {
        // structural fallbacks for containers that were looked up through a child
        if (key === 'statPills' && el.id === 'statBytes') el = el.closest('.stat-pills, div') || el;
        if (key === 'inspector' && el.id === 'inspectorContent') el = el.closest('section') || el;
        return el;
      }
    }
    return null;
  }
  const txt = (key) => { const el = find(key); return el ? (el.textContent || '').trim() : ''; };

  // ------------------------------------------------------------------ plain-language settings
  // Labels are plain language; every option keeps the ORIGINAL option text, with a plain hint underneath.
  const SETTINGS = [
    { key: 'profile', label: 'Output format', group: 'main', hints: {
      nx_v1: 'Best for Siemens NX and most CAD tools. Curves become polylines.',
      webcgm_v3: 'Keeps true Bézier curves. For WebCGM / S1000D viewers.',
      cleartext: 'Readable text CGM. Download CGM then saves this text format.' } },
    { key: 'scope', label: 'Pages', group: 'main', hints: {
      current: 'Only the page shown in the preview.',
      all: 'Every page, one CGM picture per page.' } },
    { key: 'mode', label: 'Convert drawing as', group: 'main', hints: {
      vector: 'Sharp lines and text that stay editable in CAD.',
      hybrid: 'Vectors and text, plus images and gradients as bitmaps in place. Bigger files.',
      raster: 'One bitmap of the whole page (not editable). For scans and shaded art.' } },
    { key: 'textMode', label: 'Text', group: 'more', hints: {
      auto: 'Keep each text once; skip it where it is already drawn as lines.',
      none: 'Leave the PDF text layer out.',
      stroke: 'Draw text as line strokes, so it looks the same in every CAD tool.',
      native: 'Keep text as editable CGM TEXT.' } },
    { key: 'tolerance', label: 'Curve detail & colour', group: 'more', hints: {
      '0.08_color': 'Fine curves, full colour (default).',
      '0.03_color': 'Finest curves, larger file.',
      '0.25_color': 'Coarser curves, smallest file.',
      '0.08_mono': 'Fine curves, all lines in one dark colour.' } }
  ];
  const PROFILE_SHORT = { nx_v1: 'Binary CGM v1', webcgm_v3: 'Binary CGM v3', cleartext: 'Clear-text CGM' };
  const VIEWS = [['split', 'Side by side', 'PDF + CGM'], ['cgm', 'CGM output only', ''], ['pdf', 'Source PDF only', '']];
  const ZOOMS = [['fit', 'Fit page', '', 'Fit'], ['width', 'Fit width', '', 'Width'], ['actual', 'Actual pixels', '100%', '100%']];

  // ------------------------------------------------------------------ tiny DOM helper
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    if (props) {
      for (const k of Object.keys(props)) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else if (k in n && typeof v !== 'string') n[k] = v;
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : String(kid));
    return n;
  }
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  const visible = (el) => !el.disabled && el.getClientRects().length > 0;
  const observe = (el, fn, opts) => {
    if (!el) return;
    new MutationObserver(fn).observe(el, opts || { attributes: true, childList: true, characterData: true, subtree: true });
  };
  const click = (key) => { const o = find(key); if (o && !o.disabled) o.click(); return !!o; };

  // ------------------------------------------------------------------ mode resolution
  function readStored() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } }
  function store(m) { try { localStorage.setItem(STORE_KEY, m); } catch (e) { /* private mode */ } }
  function initialMode() {
    let q = null;
    try { q = new URLSearchParams(location.search).get('ui'); } catch (e) { /* ignore */ }
    if (MODES.includes(q)) return q;
    const s = readStored();
    return MODES.includes(s) ? s : 'simple';   // everyone starts in Simple
  }

  // ------------------------------------------------------------------ state
  let mode = null;
  let built = false;
  const ui = {};
  const moved = [];          // [{ node, ph }]
  let openPop = null;        // { trigger, pop, onOpen, align }
  let openDialog = null;
  let view = null;           // 'split' | 'cgm' | 'pdf'   (Simple-only presentation)
  let zoom = 'fit';          // 'fit' | 'width' | 'actual' (Simple-only presentation)

  // ------------------------------------------------------------------ node relocation (exact restore)
  function moveInto(node, target) {
    if (!node || !target || node.parentNode === target) return;
    const ph = document.createComment('sm-placeholder');
    node.parentNode.insertBefore(ph, node);
    target.appendChild(node);
    moved.push({ node, ph });
  }
  function restoreAll() {
    while (moved.length) {
      const { node, ph } = moved.pop();
      if (ph.parentNode) { ph.parentNode.insertBefore(node, ph); ph.remove(); }
    }
  }

  // ------------------------------------------------------------------ popovers, focus trap, arrow keys
  function tabbables(root) {
    return [...root.querySelectorAll('button, select, input, summary, a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((el) => visible(el) && !el.closest('[hidden]') && el.tabIndex >= 0 &&
        !(el.closest('details:not([open])') && !el.matches('details > summary')));
  }
  // Arrow-key roving set: menu items only (never selects / inputs, so an arrow can't change a setting)
  function rovers(root) {
    return [...root.querySelectorAll('.sm-mi')].filter((el) => visible(el) && !(el.closest('details:not([open])') && el.tagName !== 'SUMMARY'));
  }
  function trapTab(ev, root) {
    const f = tabbables(root);
    if (!f.length) { ev.preventDefault(); return; }
    const a = document.activeElement, out = !root.contains(a) || a === root;
    if (ev.shiftKey && (out || a === f[0])) { ev.preventDefault(); f[f.length - 1].focus(); }
    else if (!ev.shiftKey && (out || a === f[f.length - 1])) { ev.preventDefault(); f[0].focus(); }
  }
  function bindPopover(trigger, pop, opts) {
    const entry = Object.assign({ trigger, pop, align: 'left', onOpen: null }, opts || {});
    trigger.setAttribute('aria-haspopup', pop.getAttribute('role') === 'menu' ? 'menu' : 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', pop.id);
    trigger.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (openPop && openPop.pop === pop) closePop(false); else openPopover(entry);
    });
    trigger.addEventListener('keydown', (ev) => {
      if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !(openPop && openPop.pop === pop)) {
        ev.preventDefault();
        openPopover(entry, ev.key === 'ArrowUp' ? 'last' : 'first');
      }
    });
    pop.addEventListener('keydown', (ev) => popKeys(ev, pop));
    // Safari (macOS) never focuses a clicked button, so pressing a menu item moves focus to <body>
    // and fires focusout before the click lands. Ignore focus loss while a pointer is down in the popover.
    let ptrInside = false;
    pop.addEventListener('pointerdown', () => { ptrInside = true; }, true);
    document.addEventListener('pointerup', () => { if (ptrInside) setTimeout(() => { ptrInside = false; }, 0); }, true);
    document.addEventListener('pointercancel', () => { ptrInside = false; }, true);
    pop.addEventListener('focusout', () => {
      setTimeout(() => {
        if (ptrInside) return;
        if (openPop && openPop.pop === pop && !pop.contains(document.activeElement) &&
            document.activeElement !== trigger && document.hasFocus()) closePop(false);
      }, 0);
    });
    return entry;
  }
  function openPopover(entry, focusWhich) {
    closePop(false);
    if (entry.onOpen) entry.onOpen();
    entry.pop.hidden = false;
    entry.trigger.setAttribute('aria-expanded', 'true');
    openPop = entry;
    positionPop(entry);
    const r = rovers(entry.pop);
    const f = r.length ? r : tabbables(entry.pop);
    const checked = entry.pop.querySelector('.sm-mi[role="menuitemradio"][aria-checked="true"]');
    const target = focusWhich === 'last' ? f[f.length - 1] : (checked && entry.pop.getAttribute('role') === 'menu' ? checked : f[0]);
    if (target) target.focus({ preventScroll: true });
  }
  function positionPop(entry) {
    const { trigger, pop, align } = entry;
    pop.style.maxHeight = '';
    pop.style.left = '0px'; pop.style.top = '0px';
    const r = trigger.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = align === 'right' ? r.right - pw : (align === 'center' ? r.left + r.width / 2 - pw / 2 : r.left);
    left = Math.max(8, Math.min(left, vw - pw - 8));
    let top = r.bottom + 6;
    if (top + ph > vh - 8) {
      if (r.top - ph - 6 >= 8) top = r.top - ph - 6;                       // flip above (pill menus)
      else if (vh - r.bottom > r.top) pop.style.maxHeight = Math.max(160, vh - top - 8) + 'px';
      else { top = 8; pop.style.maxHeight = Math.max(160, r.top - 14) + 'px'; }
    }
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }
  function closePop(returnFocus) {
    if (!openPop) return;
    const { trigger, pop } = openPop;
    openPop = null;
    pop.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus({ preventScroll: true });
  }
  function popKeys(ev, root) {
    const t = ev.target, k = ev.key;
    if (k === 'Tab') { trapTab(ev, root); return; }
    if (t.tagName === 'SELECT') {
      // A closed select must never change from the keyboard by accident. Explicit open only:
      // Space / Alt+Down (native) or Enter (showPicker). Arrows rove to menu items instead.
      if (ev.altKey && (k === 'ArrowDown' || k === 'ArrowUp')) return;
      if (k === 'Enter') { ev.preventDefault(); try { t.showPicker(); } catch (e) { /* older browsers */ } return; }
      if (k === 'PageUp' || k === 'PageDown' || k === 'ArrowLeft' || k === 'ArrowRight' ||
          (k.length === 1 && k !== ' ' && !ev.ctrlKey && !ev.metaKey)) { ev.preventDefault(); return; }
    }
    if (t.tagName === 'INPUT') {
      // number field: Up/Down would step the value -> they rove instead; PageUp/PageDown swallowed;
      // Left/Right/Home/End keep moving the caret inside the field.
      if (k === 'PageUp' || k === 'PageDown') { ev.preventDefault(); return; }
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Home' || k === 'End') return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(k)) return;
    ev.preventDefault();             // arrows only ever move focus inside a menu
    const items = rovers(root);
    if (!items.length) return;
    const i = items.indexOf(t);
    let next;
    if (k === 'Home') next = items[0];
    else if (k === 'End') next = items[items.length - 1];
    else if (i >= 0) next = items[(i + (k === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
    else if (k === 'ArrowDown') next = items.find((it) => t.compareDocumentPosition(it) & Node.DOCUMENT_POSITION_FOLLOWING) || items[0];
    else next = items.slice().reverse().find((it) => t.compareDocumentPosition(it) & Node.DOCUMENT_POSITION_PRECEDING) || items[items.length - 1];
    next.focus();
  }
  function menuItem(label, opts) {
    const o = opts || {};
    const b = h('button', { type: 'button', class: 'sm-mi' + (o.cls ? ' ' + o.cls : ''), role: o.role || 'menuitem', title: o.title || null },
      o.check != null ? h('span', { class: 'sm-mi-check', 'aria-hidden': 'true' }) : null,
      h('span', { class: 'sm-mi-label', text: label }),
      o.ext ? h('span', { class: 'sm-mi-ext', text: o.ext }) : null);
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (b.disabled) return;
      if (!o.keepOpen) closePop(true);
      if (o.action) o.action();
    });
    return b;
  }
  function setChecked(item, on) {
    item.setAttribute('aria-checked', on ? 'true' : 'false');
    const c = item.querySelector('.sm-mi-check');
    if (c) c.textContent = on ? '✓' : '';
  }

  // ------------------------------------------------------------------ Info side sheet
  function makeSheet(id, title, side, extraCls) {
    const titleId = id + 'Title';
    const close = h('button', { type: 'button', class: 'btn btn-sm sm-close', 'aria-label': 'Close ' + title, text: '×' });
    const body = h('div', { class: 'sm-sheet-b' });
    const sheet = h('section', {
      id, class: `sm-sheet sm-sheet--${side} ${extraCls || ''}`, role: 'dialog', 'aria-modal': 'false',
      'aria-labelledby': titleId, tabindex: '-1', hidden: true
    }, h('div', { class: 'sm-sheet-h' }, h('h2', { id: titleId, text: title }), close), body);
    close.addEventListener('click', () => toggleSheet(sheet, false, true));
    sheet.addEventListener('keydown', (ev) => { if (ev.key === 'Tab') trapTab(ev, sheet); });
    return { sheet, body };
  }
  function toggleSheet(sheet, show, returnFocus) {
    const on = show == null ? sheet.hidden : !!show;
    if (on) closePop(false);
    sheet.hidden = !on;
    const btn = ui.btnInfo;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.classList.toggle('sm-sheet-open', on);
    if (on) { syncSheetTop(); sheet.focus({ preventScroll: true }); }
    else if (returnFocus) btn.focus({ preventScroll: true });
  }
  function syncSheetTop() {
    if (!ui.topbar || !ui.infoSheet) return;
    ui.infoSheet.style.setProperty('--sm-top', Math.round(ui.topbar.getBoundingClientRect().bottom) + 'px');
  }

  // ------------------------------------------------------------------ build all add-on chrome (once)
  function detectVersion() {
    const s = [...document.scripts].map((x) => x.getAttribute('src') || '').find((src) => /app\.js\?[^#]*\bv=/.test(src));
    const m = s && s.match(/\bv=([\w.\-]+)/);
    if (m) return 'v' + m[1];
    const t = (document.querySelector('.brand-title') || {}).textContent || document.title;
    const m2 = t.match(/v\d+(?:\.\d+)+/);
    return m2 ? m2[0] : '';
  }
  function build() {
    if (built) return;
    built = true;

    // ---------- mode switch (Simple top bar, or floating in Advanced)
    ui.btnSimple = h('button', { type: 'button', 'aria-pressed': 'false', text: 'Simple', title: 'Simple mode: preview + essentials' });
    ui.btnAdvanced = h('button', { type: 'button', 'aria-pressed': 'false', text: 'Advanced', title: 'Advanced mode: full workbench' });
    ui.btnSimple.addEventListener('click', () => setMode('simple', true));
    ui.btnAdvanced.addEventListener('click', () => setMode('advanced', true));
    ui.modeSwitch = h('div', { class: 'sm-modeswitch', role: 'group', 'aria-label': 'Interface mode' }, ui.btnSimple, ui.btnAdvanced);
    ui.modeSwitch.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
        ev.preventDefault();
        (document.activeElement === ui.btnSimple ? ui.btnAdvanced : ui.btnSimple).focus();
      }
    });

    // ---------- top bar: brand + version | file + status | switch, Open PDF…, ⋯, Download CGM ▾
    const version = detectVersion();
    ui.docName = h('span', { class: 'sm-doc-name' });
    ui.status = h('span', { class: 'sm-status', role: 'status', 'aria-live': 'polite' },
      h('span', { class: 'sm-dot', 'aria-hidden': 'true' }), h('span', { class: 'sm-status-t' }));

    ui.btnOpen = h('button', { type: 'button', class: 'btn sm-btn-open', title: 'Open a PDF drawing (or drop it anywhere)' },
      h('span', null, 'Open PDF…'));
    ui.btnOpen.addEventListener('click', () => {
      const fi = find('fileInput');
      if (fi) fi.click(); else click('dropzone');
    });

    ui.btnMore = h('button', { type: 'button', class: 'btn sm-iconbtn', 'aria-label': 'More actions', title: 'More actions', text: '⋯' });
    ui.menuMore = h('div', { id: 'smMenuMore', class: 'sm-pop', role: 'menu', 'aria-label': 'More actions', hidden: true },
      menuItem('Load sample drawing', { ext: '2-page ASME', title: (find('loadSample') || {}).title || null, action: () => click('loadSample') }),
      menuItem('Which settings for my CAD tool?', { action: () => showAbout() }));

    ui.btnDlMain = h('button', { type: 'button', class: 'btn btn-primary sm-dl-main' }, h('span', { class: 'sm-dl-ico', 'aria-hidden': 'true', text: '⬇' }), ' Download CGM');
    ui.btnDlMain.addEventListener('click', () => click('dlBinary'));
    ui.btnDlCaret = h('button', { type: 'button', class: 'btn btn-primary sm-dl-caret', 'aria-label': 'Other downloads and conversion settings', title: 'Other downloads & conversion settings' },
      h('span', { class: 'sm-caret', 'aria-hidden': 'true', text: '▼' }));

    // Download menu: outputs + conversion settings
    ui.dlItemMain = menuItem('CGM', { ext: '.cgm', action: () => click('dlBinary') });
    ui.dlItemMain.dataset.smOut = 'main';
    ui.dlItemText = menuItem('Clear-text CGM (ASCII)', { ext: '-cleartext.cgm', title: (find('dlText') || {}).title || null, action: () => click('dlText') });
    ui.dlItemText.dataset.smOut = 'text';
    ui.settingCtl = {};
    const field = (s) => {
      const sel = h('select', { id: 'sm_' + s.key, 'aria-describedby': 'sm_' + s.key + '_orig sm_' + s.key + '_hint' });
      const orig = h('span', { class: 'sm-orig', id: 'sm_' + s.key + '_orig' });
      const hint = h('span', { class: 'sm-hint', id: 'sm_' + s.key + '_hint' });
      sel.addEventListener('change', () => {
        const o = find(s.key);
        if (o && o.value !== sel.value) { o.value = sel.value; fire(o, 'change'); }
        syncSettings();
      });
      ui.settingCtl[s.key] = { sel, orig, hint, def: s };
      return h('label', { class: 'sm-field' }, h('span', { class: 'sm-field-l' }, h('span', { text: s.label }), orig), sel, hint);
    };
    // Target width (number): same events as typing into the original (input on each edit, change on commit)
    ui.width = h('input', { type: 'number', id: 'sm_width', min: '50', max: '100000', step: '50', placeholder: 'Auto (1:1)', inputmode: 'numeric', 'aria-describedby': 'sm_width_orig sm_width_hint' });
    ui.widthAspect = h('span', { class: 'sm-aspect', 'aria-live': 'polite' });
    const pushWidth = (type) => {
      const o = find('width');
      if (!o) return;
      if (o.value !== ui.width.value) o.value = ui.width.value;
      fire(o, type);
    };
    ui.width.addEventListener('input', () => pushWidth('input'));
    ui.width.addEventListener('change', () => pushWidth('change'));
    ui.widthReset = h('button', { type: 'button', class: 'btn btn-sm sm-width-auto', text: 'Auto', title: 'Clear the width: 1:1 source size' });
    ui.widthReset.addEventListener('click', () => { ui.width.value = ''; pushWidth('input'); pushWidth('change'); });
    // whole field is the label (big hit area); the Auto button inside stays its own target
    const widthField = h('label', { class: 'sm-field', for: 'sm_width' },
      h('span', { class: 'sm-field-l' }, h('span', { text: 'Output width (px)' }), h('span', { class: 'sm-orig', id: 'sm_width_orig', text: 'Target Width (px)' })),
      h('div', { class: 'sm-width-row' }, ui.width, ui.widthReset),
      h('span', { class: 'sm-hint', id: 'sm_width_hint' }, 'Empty = Auto (1:1). Height follows the page shape ', ui.widthAspect));
    ui.moreSettings = h('details', { class: 'sm-more' },
      h('summary', { class: 'sm-mi sm-more-sum' }, h('span', { class: 'sm-mi-label', text: 'More settings' }), h('span', { class: 'sm-mi-ext', text: 'text, curves, width' })),
      h('div', { class: 'sm-more-b' }, SETTINGS.filter((s) => s.group === 'more').map(field), widthField));
    ui.moreSettings.addEventListener('toggle', () => { if (openPop && openPop.pop === ui.menuDl) positionPop(openPop); });
    ui.menuDl = h('div', { id: 'smMenuDl', class: 'sm-pop sm-pop--dl', role: 'dialog', 'aria-label': 'Download and conversion settings', hidden: true },
      h('div', { class: 'sm-pop-h', text: 'Download' }),
      h('div', { role: 'group', 'aria-label': 'Downloads' }, ui.dlItemMain, ui.dlItemText),
      h('hr', { class: 'sm-sep' }),
      h('div', { class: 'sm-pop-h', text: 'Conversion settings' }),
      h('div', { role: 'group', 'aria-label': 'Conversion settings' }, SETTINGS.filter((s) => s.group === 'main').map(field)),
      ui.moreSettings);

    ui.topbar = h('header', { class: 'sm-topbar', 'aria-label': 'Simple mode toolbar' },
      h('div', { class: 'sm-brand' },
        h('div', { class: 'brand-badge', 'aria-hidden': 'true', text: 'CGM' }),
        h('div', { class: 'sm-brand-title' }, 'PDF → CGM', version ? h('span', { class: 'sm-brand-ver', text: version }) : null)),
      h('div', { class: 'sm-doc' }, ui.docName, ui.status),
      h('div', { class: 'sm-actions' },
        h('span', { class: 'sm-switch-slot' }),
        ui.btnOpen, ui.btnMore,
        h('div', { class: 'sm-split', role: 'group', 'aria-label': 'Download' }, ui.btnDlMain, ui.btnDlCaret)));
    ui.switchSlot = ui.topbar.querySelector('.sm-switch-slot');
    document.body.insertBefore(ui.topbar, document.body.firstChild);

    // ---------- floating preview pill: ◀ Page ▾ ▶ | View ▾ | Zoom ▾ | Info
    ui.btnPrev = h('button', { type: 'button', class: 'btn btn-sm sm-pill-icon', 'aria-label': 'Previous page', title: 'Previous page', text: '◀' });
    ui.btnNext = h('button', { type: 'button', class: 'btn btn-sm sm-pill-icon', 'aria-label': 'Next page', title: 'Next page', text: '▶' });
    ui.btnPrev.addEventListener('click', () => click('prev'));
    ui.btnNext.addEventListener('click', () => click('next'));
    ui.btnPage = h('button', { type: 'button', class: 'btn btn-sm', title: 'Go to page' },
      ui.pageLabel = h('span', { class: 'sm-pill-v', text: '1 / 1' }), h('span', { class: 'sm-caret', 'aria-hidden': 'true', text: '▼' }));
    ui.menuPage = h('div', { id: 'smMenuPage', class: 'sm-pop', role: 'menu', 'aria-label': 'Page', hidden: true });
    ui.btnView = h('button', { type: 'button', class: 'btn btn-sm' }, 'View', h('span', { class: 'sm-caret', 'aria-hidden': 'true', text: '▼' }));
    ui.viewItems = VIEWS.map(([k, label, ext]) => {
      const it = menuItem(label, { role: 'menuitemradio', check: true, ext, keepOpen: true, action: () => setView(k) });
      it.dataset.smView = k;
      return it;
    });
    const chkItem = (key, label, ext) => {
      const it = menuItem(label, { role: 'menuitemcheckbox', check: true, ext, keepOpen: true, cls: 'sm-mi--box',
        action: () => { const o = find(key); if (o) { o.checked = !o.checked; fire(o, 'change'); } syncView(); } });
      it.dataset.smChk = key;
      return it;
    };
    ui.chkItems = [chkItem('blueprint', 'Blueprint Dark', 'CGM preview'), chkItem('nodes', 'Show Vertices', 'CGM preview')];
    ui.menuView = h('div', { id: 'smMenuView', class: 'sm-pop', role: 'menu', 'aria-label': 'View', hidden: true },
      h('div', { class: 'sm-pop-h', text: 'Show' }), h('div', { role: 'group', 'aria-label': 'Panes' }, ui.viewItems),
      h('hr', { class: 'sm-sep' }), h('div', { class: 'sm-pop-h', text: 'CGM preview' }),
      h('div', { role: 'group', 'aria-label': 'CGM preview options' }, ui.chkItems));
    ui.btnZoom = h('button', { type: 'button', class: 'btn btn-sm' }, h('span', { class: 'sm-pill-k', text: 'Zoom' }), ui.zoomLabel = h('span', { class: 'sm-pill-v' }), h('span', { class: 'sm-caret', 'aria-hidden': 'true', text: '▼' }));
    ui.zoomItems = ZOOMS.map(([k, label, ext]) => {
      const it = menuItem(label, { role: 'menuitemradio', check: true, ext: ext || null, action: () => setZoom(k) });
      it.dataset.smZoom = k;
      return it;
    });
    ui.menuZoom = h('div', { id: 'smMenuZoom', class: 'sm-pop', role: 'menu', 'aria-label': 'Zoom', hidden: true }, ui.zoomItems);
    ui.btnInfo = h('button', { type: 'button', class: 'btn btn-sm', 'aria-expanded': 'false', 'aria-pressed': 'false', 'aria-controls': 'smSheetInfo', title: 'Status, counts, document details and CGM inspector', text: 'Info' });
    ui.btnInfo.addEventListener('click', () => toggleSheet(ui.infoSheet));
    ui.pill = h('div', { class: 'sm-pill', role: 'toolbar', 'aria-label': 'Preview' },
      h('div', { class: 'sm-pill-grp', role: 'group', 'aria-label': 'Page' }, ui.btnPrev, ui.btnPage, ui.btnNext),
      h('span', { class: 'sm-pill-sep', 'aria-hidden': 'true' }),
      ui.btnView, ui.btnZoom,
      h('span', { class: 'sm-pill-sep', 'aria-hidden': 'true' }),
      ui.btnInfo);
    ui.pill.addEventListener('keydown', (ev) => {       // toolbar: Left/Right move between pill buttons
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      const b = [...ui.pill.querySelectorAll('button')].filter(visible);
      const i = b.indexOf(document.activeElement);
      if (i < 0) return;
      ev.preventDefault();
      b[(i + (ev.key === 'ArrowRight' ? 1 : -1) + b.length) % b.length].focus();
    });

    // ---------- drop veil (whole window in Simple)
    ui.dropVeil = h('div', { class: 'sm-dropveil', hidden: true, 'aria-hidden': 'true' },
      h('div', null, 'Drop to open', h('small', { text: 'PDF drawing (.pdf)' })));

    // ---------- Info sheet
    const info = makeSheet('smSheetInfo', 'Info', 'right', 'sm-sheet--info');
    ui.infoSheet = info.sheet;
    const sec = (title, open, extra) => {
      const body = h('div', { class: 'sm-sec-b' });
      const det = h('details', { class: 'sm-sec', open: !!open }, h('summary', null, h('span', { text: title }), extra || null), body);
      info.body.append(det);
      return body;
    };
    ui.secStatusChip = h('span', { class: 'sm-status sm-status--chip' }, h('span', { class: 'sm-dot', 'aria-hidden': 'true' }), h('span', { class: 'sm-status-t' }));
    ui.secStats = sec('Conversion status & counts', true, ui.secStatusChip);
    ui.docList = h('dl', { class: 'sm-dl' });
    sec('Document', true).append(ui.docList);
    ui.secInspector = sec('CGM inspector', false);

    // ---------- About / which settings dialog (names match the Simple labels and original option text)
    const optText = (key, val) => { const o = find(key); const op = o && [...o.options].find((x) => x.value === val); return op ? op.text : val; };
    const sub = document.querySelector('.brand-sub');
    const row = (dt, ...dd) => [h('dt', { text: dt }), h('dd', null, ...dd)];
    const q = (s) => h('q', { text: s });
    ui.about = h('div', { id: 'smAbout', class: 'sm-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'smAboutTitle', tabindex: '-1', hidden: true },
      h('div', { class: 'sm-sheet-h' }, h('h2', { id: 'smAboutTitle', text: 'Which settings for my CAD tool?' }),
        h('button', { type: 'button', class: 'btn btn-sm sm-close', 'aria-label': 'Close', text: '×', onclick: () => hideAbout() })),
      h('p', { class: 'sm-dialog-p' }, 'All settings are under ', h('b', { text: 'Download CGM ▼' }), '. Text and curve detail are inside ', h('b', { text: 'More settings' }), '.'),
      h('dl', null,
        row('Siemens NX', 'Output format ', q(optText('profile', 'nx_v1')), ' + Text ', q(optText('textMode', 'stroke')), '.'),
        row('Arbortext, S1000D', 'Output format ', q(optText('profile', 'webcgm_v3')), ' + Text ', q(optText('textMode', 'native')), '.'),
        row('Readable text', 'Download CGM ▼ → ', q('Clear-text CGM (ASCII)'), ', or Output format ', q(optText('profile', 'cleartext')), '.'),
        row('Scans, shading', 'Convert drawing as ', q(optText('mode', 'raster')), '.'),
        row('All pages', 'Pages ', q(optText('scope', 'all')), ' (one CGM picture per page).'),
        sub ? row('Standards', sub.textContent.trim()) : null));
    ui.about.addEventListener('keydown', (ev) => { if (ev.key === 'Tab') trapTab(ev, ui.about); });

    document.body.append(ui.pill, ui.dropVeil, ui.menuMore, ui.menuDl, ui.menuPage, ui.menuView, ui.menuZoom, ui.infoSheet, ui.about);

    // ---------- popover wiring
    bindPopover(ui.btnMore, ui.menuMore, { align: 'right' });
    bindPopover(ui.btnDlCaret, ui.menuDl, { align: 'right', onOpen: syncSettings });
    bindPopover(ui.btnPage, ui.menuPage, { align: 'center', onOpen: buildPageMenu });
    bindPopover(ui.btnView, ui.menuView, { align: 'center', onOpen: syncView });
    bindPopover(ui.btnZoom, ui.menuZoom, { align: 'center', onOpen: syncZoom });

    // ---------- live mirrors of original state (read-only)
    observe(find('fileName'), syncDoc);
    observe(find('fileMeta'), syncDoc);
    observe(find('pdfDim'), syncDoc);
    observe(find('aspect'), syncSettings);
    observe(find('status'), syncStatus);
    observe(find('statBytes'), syncStatus);
    observe(find('pageInd'), syncPage);
    for (const k of ['prev', 'next']) observe(find(k), syncPage, { attributes: true, attributeFilter: ['disabled'] });
    // original settings changed in Advanced (or by app.js): keep the Simple copies in step
    document.addEventListener('change', (ev) => { if (outside(ev.target)) { syncSettings(); syncView(); } }, true);
    document.addEventListener('input', (ev) => { if (outside(ev.target)) syncSettings(); }, true);

    // ---------- global keyboard / pointer handling
    document.addEventListener('pointerdown', (ev) => {
      if (openPop && !openPop.pop.contains(ev.target) && !openPop.trigger.contains(ev.target)) closePop(false);
      if (openDialog && !openDialog.contains(ev.target) && !ui.menuMore.contains(ev.target)) hideAbout();
    }, true);
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      if (openDialog) { ev.preventDefault(); hideAbout(); return; }
      if (openPop) { ev.preventDefault(); closePop(true); return; }
      if (mode === 'simple' && !ui.infoSheet.hidden) { ev.preventDefault(); toggleSheet(ui.infoSheet, false, true); }
    });
    window.addEventListener('resize', () => {
      if (openPop) positionPop(openPop);
      syncSheetTop();
      placeFloatingSwitch();
    });

    // ---------- whole-window drag & drop (Simple only) -> the original #fileInput 'change' handler
    let depth = 0;
    const hasFiles = (ev) => ev.dataTransfer && [...(ev.dataTransfer.types || [])].includes('Files');
    const veil = (on) => { ui.dropVeil.hidden = !on; };
    window.addEventListener('dragenter', (ev) => { if (mode === 'simple' && hasFiles(ev)) { depth++; veil(true); } });
    window.addEventListener('dragover', (ev) => {
      if (mode !== 'simple' || !hasFiles(ev)) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy';
      veil(true);
    });
    window.addEventListener('dragleave', () => { if (mode === 'simple') { depth = Math.max(0, depth - 1); if (!depth) veil(false); } });
    window.addEventListener('drop', (ev) => {
      if (mode !== 'simple') return;
      depth = 0; veil(false);
      if (!hasFiles(ev)) return;
      ev.preventDefault();
      forwardFiles(ev.dataTransfer.files);
    });

    view = window.matchMedia(PHONE).matches ? 'cgm' : 'split';
    syncDoc(); syncStatus(); syncPage(); syncSettings(); syncView(); syncZoom();
  }

  function forwardFiles(files) {
    if (!files || !files.length) return;
    const input = find('fileInput');
    try {
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      input.files = dt.files;
      fire(input, 'change');
    } catch (e) {
      const dz = find('dropzone');
      if (!dz) return;
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    }
  }

  // ------------------------------------------------------------------ pages
  function curPage() {
    const m = txt('pageInd').match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { page: +m[1], total: +m[2] } : { page: 1, total: 1 };
  }
  function waitFor(cond, ms) {
    return new Promise((res) => {
      const t0 = Date.now();
      (function tick() { if (cond() || Date.now() - t0 > ms) res(); else setTimeout(tick, 40); })();
    });
  }
  // Only Prev / Next exist in app.js, so "go to page N" steps through them, waiting for each render.
  async function goToPage(n) {
    for (let guard = 0; guard < 2000; guard++) {
      const cur = curPage();
      if (cur.page === n || n < 1 || n > cur.total) return;
      const b = find(cur.page < n ? 'next' : 'prev');
      if (!b || b.disabled) return;
      b.click();
      await waitFor(() => curPage().page !== cur.page, 8000);
      if (curPage().page === cur.page) return;   // render did not advance: stop
    }
  }
  function buildPageMenu() {
    const { page, total } = curPage();
    ui.menuPage.textContent = '';
    const shown = Math.min(total, 200);
    for (let i = 1; i <= shown; i++) {
      const it = menuItem('Page ' + i, { role: 'menuitemradio', check: true, action: () => goToPage(i) });
      setChecked(it, i === page);
      ui.menuPage.append(it);
    }
  }
  function syncPage() {
    if (!ui.pageLabel) return;
    const { page, total } = curPage();
    ui.pageLabel.textContent = `${page} / ${total}`;
    ui.btnPage.setAttribute('aria-label', `Page ${page} of ${total}`);
    const p = find('prev'), n = find('next');
    ui.btnPrev.disabled = !p || !!p.disabled;
    ui.btnNext.disabled = !n || !!n.disabled;
    ui.btnPage.disabled = total < 2;
    syncDoc();
  }

  // ------------------------------------------------------------------ sync helpers (read originals)
  function syncDoc() {
    if (!ui.docName) return;
    const name = txt('fileName');
    ui.docName.textContent = name;
    ui.docName.title = [name, txt('fileMeta')].filter(Boolean).join('\n');
    const { page, total } = curPage();
    const rows = [['File', name], ['Details', txt('fileMeta')], ['Page', `${page} of ${total}`], ['Page size', txt('pdfDim')]];
    ui.docList.textContent = '';
    for (const [k, v] of rows) if (v) ui.docList.append(h('dt', { text: k }), h('dd', { text: v }));
  }
  function syncStatus() {
    const b = find('status');
    if (!b || !ui.status) return;
    const t = (b.textContent || '').trim();
    const noOutput = /^[—-]?$/.test(txt('statBytes'));
    let tone, short, m;
    if (/CHECK/i.test(t)) { tone = 'warn'; short = 'Check encoding'; }
    else if (noOutput) { tone = ''; short = 'No output yet'; }
    else if (/VALID/i.test(t)) {
      tone = 'ok';
      m = t.match(/\((\d+)\s*PIC/i);
      short = 'Valid CGM' + (m ? ` · ${m[1]} picture${m[1] === '1' ? '' : 's'}` : '');
    } else { tone = ''; short = t.replace(/^[●▲■]\s*/, '').slice(0, 30); }
    for (const s of [ui.status, ui.secStatusChip]) {
      s.dataset.tone = tone;
      s.querySelector('.sm-status-t').textContent = short;
      s.title = t + (noOutput ? '' : ' · ' + txt('statBytes'));
    }
  }
  function syncSettings() {
    if (!ui.settingCtl) return;
    for (const key of Object.keys(ui.settingCtl)) {
      const { sel, orig, hint, def } = ui.settingCtl[key];
      const o = find(key);
      if (!o) { sel.closest('.sm-field').hidden = true; continue; }
      const sig = [...o.options].map((op) => op.value + '\u0001' + op.text).join('\u0002');
      if (sel.dataset.sig !== sig) {
        sel.textContent = '';
        for (const op of o.options) sel.append(h('option', { value: op.value, text: op.text }));
        sel.dataset.sig = sig;
      }
      if (sel.value !== o.value) sel.value = o.value;
      sel.disabled = !!o.disabled;
      const lab = (o.labels && o.labels[0]) || null;
      orig.textContent = lab ? lab.textContent.trim() : '';
      hint.textContent = def.hints[o.value] || '';
    }
    const w = find('width');
    if (w) {
      if (document.activeElement !== ui.width && ui.width.value !== w.value) ui.width.value = w.value;
      ui.widthAspect.textContent = txt('aspect');
    }
    // main download follows the Output format (app.js: cleartext profile => the main button saves clear text)
    const p = find('profile');
    const pv = p ? p.value : 'nx_v1';
    const short = PROFILE_SHORT[pv] || 'CGM';
    const optT = p && p.selectedOptions[0] ? p.selectedOptions[0].text : '';
    ui.btnDlMain.title = `Download ${short} (.cgm)${optT ? ' — ' + optT : ''}`;
    ui.dlItemMain.querySelector('.sm-mi-label').textContent = short + ' (Output format)';
    const ob = find('dlBinary'), ot = find('dlText');
    ui.btnDlMain.disabled = !ob || !!ob.disabled;
    ui.dlItemMain.disabled = !ob || !!ob.disabled;
    ui.dlItemText.disabled = !ot || !!ot.disabled;
  }
  function syncView() {
    if (!ui.viewItems) return;
    for (const it of ui.viewItems) setChecked(it, it.dataset.smView === view);
    for (const it of ui.chkItems) {
      const o = find(it.dataset.smChk);
      it.hidden = !o;
      if (o) { setChecked(it, !!o.checked); it.disabled = !!o.disabled; }
    }
    if (mode === 'simple') document.body.dataset.smView = view;
  }
  function setView(v) {
    view = v;
    syncView();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }
  function syncZoom() {
    if (!ui.zoomItems) return;
    for (const it of ui.zoomItems) setChecked(it, it.dataset.smZoom === zoom);
    const z = ZOOMS.find((x) => x[0] === zoom);
    ui.zoomLabel.textContent = z ? z[3] : '';
    if (mode === 'simple') document.body.dataset.smZoom = zoom;
  }
  function setZoom(z) { zoom = z; syncZoom(); }

  // ------------------------------------------------------------------ About dialog
  function showAbout() {
    closePop(false);
    ui.about.hidden = false;
    openDialog = ui.about;
    const c = ui.about.querySelector('.sm-close');
    if (c) c.focus();
  }
  function hideAbout() {
    if (!openDialog) return;
    ui.about.hidden = true;
    openDialog = null;
    if (mode === 'simple') ui.btnMore.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ Advanced: float the switch in free top-bar space
  function placeFloatingSwitch() {
    if (mode !== 'advanced' || !ui.modeSwitch) return;
    const sw = ui.modeSwitch;
    sw.classList.remove('sm-modeswitch--corner');
    sw.style.left = ''; sw.style.top = '';
    const brand = document.querySelector('.topbar .brand'), acts = document.querySelector('.topbar .top-actions');
    if (!brand || !acts) { sw.classList.add('sm-modeswitch--corner'); return; }
    const b = brand.getBoundingClientRect(), a = acts.getBoundingClientRect();
    const w = sw.offsetWidth, hgt = sw.offsetHeight;
    const sameRow = a.top < b.bottom && b.top < a.bottom;
    const gap = a.left - b.right;
    if (sameRow && gap >= w + 32) {
      sw.style.left = Math.round(b.right + (gap - w) / 2) + 'px';
      sw.style.top = Math.round(Math.max(b.top, a.top) + (Math.min(b.bottom, a.bottom) - Math.max(b.top, a.top) - hgt) / 2 + window.scrollY) + 'px';
    } else {
      sw.classList.add('sm-modeswitch--corner');
    }
  }

  // ------------------------------------------------------------------ mode switching
  function setMode(next, persist) {
    if (!MODES.includes(next)) return;
    if (persist) store(next);
    build();
    const hadFocus = ui.modeSwitch.contains(document.activeElement);
    if (next === mode) return;
    mode = next;
    closePop(false);
    hideAbout();
    ui.btnSimple.setAttribute('aria-pressed', String(next === 'simple'));
    ui.btnAdvanced.setAttribute('aria-pressed', String(next === 'advanced'));

    if (next === 'simple') {
      document.body.classList.add('sm-simple');
      ui.modeSwitch.classList.remove('sm-modeswitch--float', 'sm-modeswitch--corner');
      ui.modeSwitch.style.left = ''; ui.modeSwitch.style.top = '';
      ui.switchSlot.appendChild(ui.modeSwitch);
      moveInto(find('statPills'), ui.secStats);
      moveInto(find('inspector'), ui.secInspector);
      syncDoc(); syncStatus(); syncPage(); syncSettings(); syncView(); syncZoom(); syncSheetTop();
    } else {
      toggleSheet(ui.infoSheet, false, false);
      ui.dropVeil.hidden = true;
      restoreAll();
      document.body.classList.remove('sm-simple', 'sm-sheet-open');
      delete document.body.dataset.smView;
      delete document.body.dataset.smZoom;
      if (!document.body.getAttribute('class')) document.body.removeAttribute('class');
      ui.modeSwitch.classList.add('sm-modeswitch--float');
      document.body.appendChild(ui.modeSwitch);
      placeFloatingSwitch();
    }
    if (hadFocus) (next === 'simple' ? ui.btnSimple : ui.btnAdvanced).focus({ preventScroll: true });
    requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')); placeFloatingSwitch(); });
    document.dispatchEvent(new CustomEvent('pdf2cgm:uimode', { detail: { mode: next } }));
  }

  function init() {
    if (!document.body || !(find('dlBinary') || find('fileInput'))) return;   // not the pdf-to-cgm page
    setMode(initialMode(), false);
  }

  window.PDF2CGMSimpleMode = {
    get mode() { return mode; },
    setMode: (m) => setMode(m, true),
    toggle: () => setMode(mode === 'simple' ? 'advanced' : 'simple', true),
    goToPage: (n) => goToPage(n),
    storageKey: STORE_KEY
  };

  // Loaded after app.js at the end of <body>: the markup exists, so apply the mode now (no flash of
  // the Advanced UI). Simple controls look originals up at use time, so app.js init order is irrelevant.
  if (document.readyState === 'loading' && !document.getElementById('btnDownloadBinary')) document.addEventListener('DOMContentLoaded', init);
  else init();
})();
