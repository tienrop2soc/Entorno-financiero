'use strict';
/* Componentes de interfaz: modales, avisos, tooltips, tema y piezas HTML reutilizables. */
const UI = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const stack = [];

  /* ---------- Modal / hoja inferior ---------- */
  function modal({ title, body = '', footer = '', actions = {}, onClose, size = '', onMount }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <div class="modal glass ${size}" role="dialog" aria-modal="true" aria-label="${U.esc(title)}">
        <div class="grabber" aria-hidden="true"></div>
        <header class="modal-h">
          <h2>${U.esc(title)}</h2>
          <button class="icon-btn" data-action="close" aria-label="Cerrar">${icon('x')}</button>
        </header>
        <div class="modal-b">${body}</div>
        ${footer ? `<footer class="modal-f">${footer}</footer>` : ''}
      </div>`;
    const el = $('.modal', back);
    const api = {
      el, back,
      $: (s) => $(s, el),
      $$: (s) => $$(s, el),
      close() {
        if (api.closed) return;
        api.closed = true;
        back.classList.add('out');
        const i = stack.indexOf(api);
        if (i >= 0) stack.splice(i, 1);
        setTimeout(() => back.remove(), 220);
        if (!stack.length) document.body.classList.remove('modal-open');
        onClose && onClose();
      },
      setBody(html) { $('.modal-b', el).innerHTML = html; },
    };
    back.addEventListener('click', (e) => {
      if (e.target === back) return api.close();
      const a = e.target.closest('[data-action]');
      if (!a || !el.contains(a)) return;
      const name = a.dataset.action;
      if (name === 'close') return api.close();
      if (actions[name]) {
        e.preventDefault();
        actions[name](a, e, api);
      }
    });
    el.addEventListener('submit', (e) => {
      e.preventDefault();
      if (actions.submit) actions.submit(e.target, e, api);
    });
    $('#modalRoot').appendChild(back);
    document.body.classList.add('modal-open');
    stack.push(api);
    onMount && onMount(api);
    requestAnimationFrame(() => {
      const f = $('[autofocus]', el);
      if (f && window.matchMedia('(hover: hover)').matches) f.focus();
    });
    return api;
  }
  const closeTop = () => { if (stack.length) { stack[stack.length - 1].close(); return true; } return false; };
  const hasModal = () => stack.length > 0;

  function confirm(message, { title = '¿Seguro?', ok = 'Confirmar', danger = true } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const m = modal({
        title,
        size: 'sm',
        body: `<p class="muted">${U.esc(message)}</p>`,
        footer: `<button class="btn" data-action="close">Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="ok">${U.esc(ok)}</button>`,
        actions: { ok: (a, e, api) => { done = true; resolve(true); api.close(); } },
        onClose: () => { if (!done) resolve(false); },
      });
      return m;
    });
  }

  /* ---------- Avisos ---------- */
  function toast(msg, { action, onAction, ms = 3800 } = {}) {
    const root = $('#toastRoot');
    const t = document.createElement('div');
    t.className = 'toast glass';
    t.innerHTML = `<span>${U.esc(msg)}</span>${action ? `<button class="toast-btn">${U.esc(action)}</button>` : ''}`;
    root.appendChild(t);
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 250); };
    const timer = setTimeout(kill, ms);
    if (action) t.querySelector('button').addEventListener('click', () => { clearTimeout(timer); onAction && onAction(); kill(); });
  }

  /* ---------- Tooltip para gráficos ---------- */
  function initTooltip() {
    const tip = document.createElement('div');
    tip.className = 'tooltip glass';
    tip.setAttribute('role', 'status');
    document.body.appendChild(tip);
    let current = null;
    const place = (e) => {
      const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
      let x = e.clientX + pad, y = e.clientY - h - pad;
      if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
      if (y < 8) y = e.clientY + pad;
      tip.style.transform = `translate(${Math.max(8, x)}px, ${y}px)`;
    };
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (!el) return;
      current = el;
      tip.innerHTML = el.dataset.tip;
      tip.classList.add('on');
      place(e);
    });
    document.addEventListener('pointermove', (e) => { if (current) place(e); });
    document.addEventListener('pointerout', (e) => {
      if (current && (!e.relatedTarget || !current.contains(e.relatedTarget))) {
        current = null;
        tip.classList.remove('on');
      }
    });
    window.addEventListener('scroll', () => { current = null; tip.classList.remove('on'); }, { passive: true });
  }

  /* ---------- Tema ---------- */
  function applyTheme() {
    const t = Store.state.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.content = dark ? '#000000' : '#efeff1';
  }

  /* ---------- Control segmentado con "píldora" deslizante ---------- */
  const segMemory = {};
  function seg(key, options, value, action, attrs = '') {
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    const from = segMemory[key] != null ? segMemory[key] : idx;
    segMemory[key] = idx;
    return `<div class="seg" style="--n:${options.length}" role="tablist" ${attrs}>
      <span class="seg-thumb" style="--i:${from}" data-to="${idx}"></span>
      ${options.map((o, i) => `<button type="button" role="tab" aria-selected="${i === idx}" class="seg-btn ${i === idx ? 'on' : ''}" data-action="${action}" data-value="${U.esc(o.value)}" data-index="${i}">${o.label}</button>`).join('')}
    </div>`;
  }
  function animateSegs(root = document) {
    $$('.seg-thumb[data-to]', root).forEach((t) => {
      void t.offsetWidth;
      t.style.setProperty('--i', t.dataset.to);
    });
  }
  /* Para controles segmentados que no se re-renderizan (dentro de modales). */
  function segSelect(btn) {
    const s = btn.closest('.seg');
    $$('.seg-btn', s).forEach((b) => { b.classList.toggle('on', b === btn); b.setAttribute('aria-selected', b === btn); });
    $('.seg-thumb', s).style.setProperty('--i', btn.dataset.index);
  }

  /* ---------- Formularios ---------- */
  function formData(form) {
    const o = {};
    new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; });
    $$('input[type=checkbox]', form).forEach((c) => { if (c.name) o[c.name] = c.checked; });
    return o;
  }
  const field = (label, control, hint = '') => `<label class="field"><span class="field-l">${label}</span>${control}${hint ? `<span class="field-h">${hint}</span>` : ''}</label>`;
  const input = (name, { type = 'text', value = '', placeholder = '', attrs = '' } = {}) =>
    `<input class="input" type="${type}" name="${name}" value="${U.esc(value)}" placeholder="${U.esc(placeholder)}" ${attrs}>`;
  const moneyInput = (name, value, attrs = '') =>
    `<div class="money-in"><input class="input" type="text" inputmode="decimal" name="${name}" value="${U.esc(U.inputAmount(value))}" placeholder="0,00" autocomplete="off" ${attrs}><span>${U.esc(U.symbol())}</span></div>`;
  const select = (name, options, value, attrs = '') =>
    `<div class="select"><select class="input" name="${name}" ${attrs}>${options.map((o) => `<option value="${U.esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${U.esc(o.label)}</option>`).join('')}</select>${icon('chevD', 16)}</div>`;
  const check = (name, label, checked) =>
    `<label class="check"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span class="switch" aria-hidden="true"></span><span>${label}</span></label>`;
  const accountOptions = (includeArchived = false) =>
    Store.state.accounts.filter((a) => includeArchived || !a.archived).map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = (type) => Store.cats(type).map((c) => ({ value: c.id, label: c.name }));

  function iconPicker(name, value) {
    return `<div class="icon-picker" role="radiogroup">${PICKABLE_ICONS.map((ic) => `
      <label class="ip-item"><input type="radio" name="${name}" value="${ic}" ${ic === value ? 'checked' : ''}><span>${icon(ic, 20)}</span></label>`).join('')}</div>`;
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  return {
    $, $$, modal, closeTop, hasModal, confirm, toast, initTooltip, applyTheme, seg, animateSegs, segSelect,
    formData, field, input, moneyInput, select, check, accountOptions, categoryOptions, iconPicker, download,
  };
})();

/* Piezas HTML compartidas por las vistas. */
const H = {
  txTitle(t) {
    if (t.type === 'transfer') return t.note || 'Transferencia';
    return t.note || Store.cat(t.categoryId).name;
  },
  txRow(t, { showDate = false } = {}) {
    const isT = t.type === 'transfer';
    const c = isT ? { name: 'Transferencia', icon: 'swap' } : Store.cat(t.categoryId);
    const acc = Store.account(t.accountId);
    const parts = isT
      ? [`${acc ? acc.name : '—'} → ${(Store.account(t.toAccountId) || {}).name || '—'}`]
      : [t.note ? c.name : '', acc ? acc.name : ''];
    if (showDate) parts.unshift(U.dayLabel(t.date));
    if (t.recurringId) parts.push('Recurrente');
    const sub = parts.filter(Boolean).join(' · ');
    const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '';
    return `<button class="tx" data-action="editTx" data-id="${t.id}">
      <span class="tx-ic">${icon(c.icon, 18)}</span>
      <span class="tx-main"><span class="tx-title">${U.esc(H.txTitle(t))}</span><span class="tx-sub">${U.esc(sub)}</span></span>
      <span class="tx-amt ${t.type}">${sign}${U.money(t.amount)}</span>
    </button>`;
  },
  txGroups(txs, { limitDays = 0 } = {}) {
    if (!txs.length) return '';
    const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
    const groups = [];
    for (const t of sorted) {
      let g = groups[groups.length - 1];
      if (!g || g.date !== t.date) groups.push((g = { date: t.date, items: [] }));
      g.items.push(t);
    }
    const shown = limitDays ? groups.slice(0, limitDays) : groups;
    return shown.map((g) => {
      const net = U.sum(g.items, (t) => (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0));
      return `<section class="day-group">
        <div class="day-h"><span>${U.esc(U.dayLabel(g.date, true))}</span><span class="tnum">${net > 0 ? '+' : net < 0 ? '−' : ''}${U.money(Math.abs(net))}</span></div>
        <div class="tx-list">${g.items.map((t) => H.txRow(t)).join('')}</div>
      </section>`;
    }).join('');
  },
  empty(text, cta = '') {
    return `<div class="empty"><div class="empty-ic">${icon('layers', 26)}</div><p>${text}</p>${cta}</div>`;
  },
  catBars(list, total, { limit = 0, type = 'expense' } = {}) {
    if (!list.length) return H.empty(type === 'expense' ? 'Sin gastos en este periodo.' : 'Sin ingresos en este periodo.');
    const max = list[0].total || 1;
    const items = limit ? list.slice(0, limit) : list;
    return `<div class="cat-bars">${items.map((e) => `
      <button class="cat-row" data-action="filterCat" data-id="${e.cat.id}" data-type="${type}" data-tip="${U.esc(`<b>${U.esc(e.cat.name)}</b><br>${U.money(e.total)} · ${e.count} mov. · ${U.pct(e.total / (total || 1), 1)}`)}">
        <span class="cat-ic">${icon(e.cat.icon, 17)}</span>
        <span class="cat-main">
          <span class="cat-top"><span class="cat-name">${U.esc(e.cat.name)}</span><span class="tnum">${U.money(e.total)}</span></span>
          <span class="bar"><i style="width:${Math.max(2, (e.total / max) * 100)}%"></i></span>
        </span>
        <span class="cat-pct tnum">${U.pct(e.total / (total || 1))}</span>
      </button>`).join('')}</div>`;
  },
  periodControl(extra = '') {
    const p = App.period;
    const ws = Store.state.settings.weekStart;
    return `<div class="period">
      ${UI.seg('period', [
        { value: 'day', label: 'Día' }, { value: 'week', label: 'Semana' },
        { value: 'month', label: 'Mes' }, { value: 'year', label: 'Año' },
      ], p.type, 'periodType')}
      <div class="period-nav glass-pill">
        <button class="icon-btn" data-action="periodPrev" aria-label="Periodo anterior">${icon('chevL')}</button>
        <button class="period-label" data-action="periodToday" title="Volver al periodo actual">${U.esc(U.periodLabel(p.type, p.ref, ws))}</button>
        <button class="icon-btn" data-action="periodNext" aria-label="Periodo siguiente">${icon('chevR')}</button>
      </div>
      ${extra}
    </div>`;
  },
  delta(cur, prev, { invert = false } = {}) {
    if (!prev) return `<span class="delta muted">Sin datos previos</span>`;
    const d = (cur - prev) / Math.abs(prev);
    const up = d > 0.0005, down = d < -0.0005;
    const good = invert ? down : up;
    return `<span class="delta ${good ? 'good' : up || down ? 'bad' : ''}">${icon(up ? 'trendingUp' : down ? 'trendingDown' : 'minus', 14)} ${up ? '+' : ''}${U.pct(d)} vs. anterior</span>`;
  },
  progress(ratio, { over = false } = {}) {
    return `<div class="progress ${over ? 'over' : ''}"><i style="width:${U.clamp(ratio, 0, 1) * 100}%"></i></div>`;
  },
  ring(ratio, size = 64) {
    const r = (size - 8) / 2, c = 2 * Math.PI * r, v = U.clamp(ratio, 0, 1);
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="50%" dy=".35em" text-anchor="middle">${Math.round(v * 100)}%</text>
    </svg>`;
  },
  sectionHead(title, actionsHtml = '') {
    return `<div class="card-h"><h3>${title}</h3><div class="card-actions">${actionsHtml}</div></div>`;
  },
  stat(label, value, extra = '', cls = '') {
    return `<div class="stat ${cls}"><span class="stat-l">${label}</span><span class="stat-v tnum">${value}</span>${extra}</div>`;
  },
  freqLabel(r) {
    const n = Math.max(1, +r.interval || 1);
    const map = { daily: ['Diario', 'días'], weekly: ['Semanal', 'semanas'], monthly: ['Mensual', 'meses'], yearly: ['Anual', 'años'] };
    const [one, many] = map[r.freq] || map.monthly;
    return n === 1 ? one : `Cada ${n} ${many}`;
  },
};
