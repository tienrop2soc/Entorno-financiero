'use strict';
/* Entorno Financiero · versión simple: Cuentas (bancos y efectivo) e Inversiones. */

/* ---------------- Iconos ---------------- */
const ICONS = {
  bank: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16" cy="14" r="1"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chev: '<polyline points="9 18 15 12 9 6"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
};
const icon = (n, s = 20) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------------- Utilidades ---------------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (arr, f) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fmtCache = {};
function money(n) {
  const c = Store.state.settings.currency;
  if (!fmtCache[c]) fmtCache[c] = new Intl.NumberFormat('es-ES', { style: 'currency', currency: c, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return fmtCache[c].format(n || 0);
}
const pct = (n) => (isFinite(n) ? `${n > 0 ? '+' : ''}${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(n * 100)} %` : '—');
const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money(Math.abs(n))}`;
/* Acepta "12,50", "12.50", "1.234,56", "1,234.56" y negativos. */
function parseAmount(v) {
  let s = String(v || '').trim().replace(/\s|€|\$|£/g, '');
  if (!s) return NaN;
  const hasC = s.includes(','), hasD = s.includes('.');
  if (hasC && hasD) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (hasC) s = s.replace(/\./g, '').replace(',', '.');
  else if (hasD && /^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : NaN;
}
const symbol = () => (new Intl.NumberFormat('es-ES', { style: 'currency', currency: Store.state.settings.currency }).formatToParts(0).find((p) => p.type === 'currency') || {}).value || '€';
const inputAmount = (n) => (n || n === 0 ? String(round2(+n)).replace('.', ',') : '');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- Datos ---------------- */
const Store = {
  KEY: 'entorno-financiero:simple:v1',
  OLD_KEY: 'entorno-financiero:v1',
  state: null,
  defaults: () => ({ version: 2, settings: { currency: 'EUR', theme: 'auto' }, accounts: [], investments: [] }),

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.state = this.clean(JSON.parse(raw));
      else this.state = this.fromOldVersion() || this.defaults();
    } catch (e) {
      this.state = this.defaults();
    }
  },
  clean(s) {
    const d = this.defaults();
    return {
      ...d, ...s,
      settings: { ...d.settings, ...(s.settings || {}) },
      accounts: Array.isArray(s.accounts) ? s.accounts : [],
      investments: Array.isArray(s.investments) ? s.investments : [],
    };
  },
  /* Si existían datos de la versión completa, se traen los saldos actuales y las inversiones. */
  fromOldVersion() {
    const raw = localStorage.getItem(this.OLD_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw);
    const txs = Array.isArray(old.transactions) ? old.transactions : [];
    const balance = (id, initial) => {
      let b = +initial || 0;
      for (const t of txs) {
        if (t.type === 'income' && t.accountId === id) b += t.amount;
        else if (t.type === 'expense' && t.accountId === id) b -= t.amount;
        else if (t.type === 'adjust' && t.accountId === id) b += t.amount;
        else if (t.type === 'transfer') {
          if (t.accountId === id) b -= t.amount;
          if (t.toAccountId === id) b += t.amount;
        }
      }
      return round2(b);
    };
    const s = this.defaults();
    s.settings.currency = (old.settings && old.settings.currency) || 'EUR';
    s.settings.theme = (old.settings && old.settings.theme) || 'auto';
    s.accounts = (old.accounts || []).filter((a) => !a.archived).map((a) => ({
      id: a.id, name: a.name, type: a.type === 'efectivo' ? 'efectivo' : 'banco', balance: balance(a.id, a.initial), note: a.place || '',
    }));
    s.investments = (old.investments || []).map((i) => ({ id: i.id, name: i.name, kind: i.kind || 'Otro', invested: +i.invested || 0, value: +i.value || 0, note: i.note || '', updated: i.updated || today() }));
    this.state = s;
    this.save();
    return s;
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch (e) { toast('No se pudo guardar. Exporta una copia desde Ajustes.'); }
    App.render();
  },
  upsert(col, item) {
    const list = this.state[col];
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = { ...list[i], ...item };
    else list.push({ ...item, id: item.id || uid() });
    this.save();
  },
  remove(col, id) {
    const list = this.state[col];
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const [removed] = list.splice(i, 1);
    this.save();
    return { removed, index: i };
  },
  restore(col, { removed, index }) {
    this.state[col].splice(index, 0, removed);
    this.save();
  },
  totals() {
    const s = this.state;
    const banks = round2(sum(s.accounts.filter((a) => a.type !== 'efectivo'), (a) => a.balance));
    const cash = round2(sum(s.accounts.filter((a) => a.type === 'efectivo'), (a) => a.balance));
    const value = round2(sum(s.investments, (i) => i.value));
    const invested = round2(sum(s.investments, (i) => i.invested));
    return { banks, cash, money: round2(banks + cash), value, invested, gain: round2(value - invested), total: round2(banks + cash + value) };
  },
};

/* ---------------- Interfaz: hoja, aviso, confirmación ---------------- */
const stack = [];
function sheet({ title, body, footer = '', onMount, actions = {} }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal glass" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="grabber" aria-hidden="true"></div>
      <header class="modal-h"><h2>${esc(title)}</h2><button class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="modal-b">${body}</div>
      ${footer ? `<footer class="modal-f">${footer}</footer>` : ''}
    </div>`;
  const el = $('.modal', back);
  const api = {
    el, $: (s) => $(s, el),
    close() {
      if (api.closed) return;
      api.closed = true;
      back.classList.add('out');
      stack.splice(stack.indexOf(api), 1);
      setTimeout(() => back.remove(), 220);
      if (!stack.length) document.body.classList.remove('modal-open');
    },
  };
  back.addEventListener('click', (e) => {
    if (e.target === back) return api.close();
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'close') return api.close();
    if (actions[a.dataset.act]) { e.preventDefault(); actions[a.dataset.act](a, api); }
  });
  el.addEventListener('submit', (e) => { e.preventDefault(); actions.save && actions.save(null, api); });
  $('#modalRoot').appendChild(back);
  document.body.classList.add('modal-open');
  stack.push(api);
  onMount && onMount(api);
  requestAnimationFrame(() => { const f = $('[autofocus]', el); if (f && matchMedia('(hover: hover)').matches) f.focus(); });
  return api;
}
function confirmBox(message, okLabel = 'Eliminar') {
  return new Promise((resolve) => {
    let done = false;
    const m = sheet({
      title: '¿Seguro?',
      body: `<p class="muted">${esc(message)}</p>`,
      footer: `<button class="btn" data-act="close">Cancelar</button><button class="btn btn-primary" data-act="ok">${esc(okLabel)}</button>`,
      actions: { ok: (a, api) => { done = true; resolve(true); api.close(); } },
    });
    const close = m.close;
    m.close = () => { close(); if (!done) resolve(false); };
  });
}
function toast(msg, action, onAction) {
  const t = document.createElement('div');
  t.className = 'toast glass';
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="toast-btn">${esc(action)}</button>` : ''}`;
  $('#toastRoot').appendChild(t);
  const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 250); };
  const timer = setTimeout(kill, 4000);
  if (action) $('button', t).addEventListener('click', () => { clearTimeout(timer); onAction(); kill(); });
}
const seg = (name, options, value) => {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return `<div class="seg" style="--n:${options.length}" role="radiogroup">
    <span class="seg-thumb" style="--i:${idx}"></span>
    ${options.map((o, i) => `<label class="seg-btn"><input type="radio" name="${name}" value="${esc(o.value)}" data-index="${i}" ${i === idx ? 'checked' : ''}><span>${o.label}</span></label>`).join('')}
  </div>`;
};
/* Mueve la píldora del control segmentado al cambiar de opción. */
document.addEventListener('change', (e) => {
  const r = e.target.closest && e.target.closest('.seg input[type=radio]');
  if (r) r.closest('.seg').querySelector('.seg-thumb').style.setProperty('--i', r.dataset.index);
});
const field = (label, control, hint = '') => `<label class="field"><span class="field-l">${label}</span>${control}${hint ? `<span class="field-h">${hint}</span>` : ''}</label>`;
const moneyIn = (name, value, attrs = '') => `<div class="money-in"><input class="input" type="text" inputmode="decimal" name="${name}" value="${esc(inputAmount(value))}" placeholder="0,00" autocomplete="off" ${attrs}><span>${esc(symbol())}</span></div>`;
const formData = (f) => Object.fromEntries(new FormData(f).entries());

/* ---------------- Formularios ---------------- */
function editAccount(acc = {}) {
  const editing = !!acc.id;
  const type = acc.type || 'banco';
  sheet({
    title: editing ? acc.name : type === 'efectivo' ? 'Nuevo efectivo' : 'Nueva cuenta',
    body: `<form autocomplete="off">
      ${seg('type', [{ value: 'banco', label: 'Banco' }, { value: 'efectivo', label: 'Efectivo' }], type)}
      <label class="amount-big"><input type="text" inputmode="decimal" name="balance" placeholder="0,00" value="${esc(inputAmount(acc.balance))}" aria-label="Saldo" ${editing ? 'autofocus' : ''}><span class="amount-cur">${esc(symbol())}</span></label>
      <p class="amount-hint muted">${editing ? 'Escribe el saldo real que tienes ahora' : 'Cuánto dinero hay'}</p>
      ${field('Nombre', `<input class="input" name="name" value="${esc(acc.name || '')}" placeholder="${type === 'efectivo' ? 'p. ej. Casa, Cartera, Casa de mis padres' : 'p. ej. BBVA, ING, Revolut'}" maxlength="40" ${editing ? '' : 'autofocus'} required>`)}
      <button type="submit" hidden></button>
    </form>`,
    footer: `${editing ? `<button class="btn btn-ghost" data-act="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-act="save">${icon('check', 18)} Guardar</button>`,
    actions: {
      save: (a, m) => {
        const f = formData(m.$('form'));
        const balance = round2(parseAmount(f.balance));
        if (!f.name.trim()) return toast('Pon un nombre.');
        if (!isFinite(balance)) return toast('Escribe el saldo.');
        Store.upsert('accounts', { id: acc.id, name: f.name.trim(), type: f.type, balance, updated: today() });
        toast(editing ? `${f.name.trim()}: ${money(balance)}` : `${f.name.trim()} añadida`);
        m.close();
      },
      del: async (a, m) => {
        if (!(await confirmBox(`Se quitará «${acc.name}» y su saldo dejará de contar.`))) return;
        const r = Store.remove('accounts', acc.id);
        m.close();
        toast(`${acc.name} eliminada`, 'Deshacer', () => Store.restore('accounts', r));
      },
    },
  });
}

const KINDS = ['Acciones', 'Fondos', 'ETF', 'Cripto', 'Pensiones', 'Depósito', 'Otro'];
function editInvestment(inv = {}) {
  const editing = !!inv.id;
  sheet({
    title: editing ? inv.name : 'Nueva inversión',
    body: `<form autocomplete="off">
      ${field('Nombre', `<input class="input" name="name" value="${esc(inv.name || '')}" placeholder="p. ej. MSCI World, Bitcoin, Apple" maxlength="40" ${editing ? '' : 'autofocus'} required>`)}
      <div class="field"><span class="field-l">Tipo</span><div class="chips">${KINDS.map((k) => `<label class="chip"><input type="radio" name="kind" value="${k}" ${(inv.kind || 'Fondos') === k ? 'checked' : ''}><span>${k}</span></label>`).join('')}</div></div>
      <div class="grid2">
        ${field('Dinero invertido', moneyIn('invested', inv.invested))}
        ${field('Valor actual', moneyIn('value', inv.value, editing ? 'autofocus' : ''), 'Vacío = igual a lo invertido')}
      </div>
      <div class="gain-preview"></div>
      <button type="submit" hidden></button>
    </form>`,
    footer: `${editing ? `<button class="btn btn-ghost" data-act="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-act="save">${icon('check', 18)} Guardar</button>`,
    onMount: (m) => {
      const upd = () => {
        const a = parseAmount(m.$('[name=invested]').value) || 0;
        const vRaw = parseAmount(m.$('[name=value]').value);
        const v = isFinite(vRaw) ? vRaw : a;
        m.$('.gain-preview').innerHTML = a || v ? `<span class="muted">Ganancia</span><b class="tnum">${signed(v - a)} <span class="muted">${a ? pct((v - a) / a) : ''}</span></b>` : '';
      };
      m.el.addEventListener('input', upd);
      upd();
    },
    actions: {
      save: (a, m) => {
        const f = formData(m.$('form'));
        const invested = round2(parseAmount(f.invested)) || 0;
        const vRaw = round2(parseAmount(f.value));
        if (!f.name.trim()) return toast('Pon un nombre.');
        Store.upsert('investments', { id: inv.id, name: f.name.trim(), kind: f.kind || 'Otro', invested, value: isFinite(vRaw) ? vRaw : invested, updated: today() });
        toast(editing ? 'Inversión actualizada' : `${f.name.trim()} añadida`);
        m.close();
      },
      del: async (a, m) => {
        if (!(await confirmBox(`Se eliminará «${inv.name}».`))) return;
        const r = Store.remove('investments', inv.id);
        m.close();
        toast(`${inv.name} eliminada`, 'Deshacer', () => Store.restore('investments', r));
      },
    },
  });
}

function settings() {
  const s = Store.state.settings;
  sheet({
    title: 'Ajustes',
    body: `<form>
      ${field('Apariencia', seg('theme', [{ value: 'auto', label: 'Automático' }, { value: 'light', label: 'Blanco' }, { value: 'dark', label: 'Negro' }], s.theme))}
      ${field('Moneda', `<select class="input" name="currency">${[['EUR', 'Euro (€)'], ['USD', 'Dólar ($)'], ['GBP', 'Libra (£)'], ['MXN', 'Peso mexicano'], ['CHF', 'Franco suizo']].map(([v, l]) => `<option value="${v}" ${v === s.currency ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
      <p class="field-h">Tus datos se guardan solo en este dispositivo. Haz una copia de vez en cuando.</p>
      <div class="btn-col">
        <button type="button" class="btn" data-act="export">${icon('download', 18)} Exportar copia de seguridad</button>
        <button type="button" class="btn" data-act="import">${icon('upload', 18)} Importar copia de seguridad</button>
        <button type="button" class="btn btn-ghost" data-act="reset">${icon('trash', 18)} Borrar todos los datos</button>
      </div>
      <input type="file" accept="application/json,.json" hidden>
    </form>`,
    onMount: (m) => {
      m.el.addEventListener('change', (e) => {
        if (e.target.name === 'theme') { s.theme = e.target.value; Store.save(); applyTheme(); }
        if (e.target.name === 'currency') { s.currency = e.target.value; Store.save(); }
        if (e.target.type === 'file') importJson(e.target.files[0], m);
      });
    },
    actions: {
      export: () => {
        const blob = new Blob([JSON.stringify({ app: 'entorno-financiero-simple', exportedAt: new Date().toISOString(), ...Store.state }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `entorno-financiero-${today()}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        toast('Copia descargada');
      },
      import: (a, m) => m.$('input[type=file]').click(),
      reset: async (a, m) => {
        if (!(await confirmBox('Se borrarán todas tus cuentas, efectivo e inversiones de este dispositivo.', 'Borrar todo'))) return;
        Store.state = Store.defaults();
        Store.save();
        applyTheme();
        m.close();
        toast('Datos borrados');
      },
    },
  });
}
async function importJson(file, m) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.investments)) throw new Error('formato');
    if (!(await confirmBox('La copia sustituirá tus datos actuales.', 'Importar'))) return;
    if (Array.isArray(data.transactions)) {
      // Copia de la versión completa: se convierte a saldos.
      localStorage.setItem(Store.OLD_KEY, JSON.stringify(data));
      Store.state = Store.fromOldVersion();
    } else {
      delete data.app; delete data.exportedAt;
      Store.state = Store.clean(data);
      Store.save();
    }
    applyTheme();
    m.close();
    toast('Datos importados');
  } catch (e) {
    toast('Ese archivo no es una copia válida.');
  }
}

function applyTheme() {
  const t = Store.state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]').content = dark ? '#000000' : '#efeff1';
}

/* ---------------- Páginas ---------------- */
const PAGES = {
  cuentas: { title: 'Cuentas', icon: 'wallet' },
  inversiones: { title: 'Inversiones', icon: 'trend' },
};

function row({ id, ic, name, sub, value, extra = '' }) {
  return `<button class="row" data-act="edit" data-id="${id}">
    <span class="row-ic">${icon(ic, 19)}</span>
    <span class="row-main"><b>${esc(name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
    <span class="row-val"><b class="tnum">${value}</b>${extra}</span>
    <span class="row-chev">${icon('chev', 16)}</span>
  </button>`;
}

function pageCuentas() {
  const s = Store.state, t = Store.totals();
  const group = (type, title, ic, total, addLabel) => {
    const list = s.accounts.filter((a) => (type === 'efectivo' ? a.type === 'efectivo' : a.type !== 'efectivo'));
    return `<section class="card glass">
      <div class="card-h"><h2>${icon(ic, 18)} ${title}</h2><b class="tnum">${money(total)}</b></div>
      ${list.length ? `<div class="rows">${list.map((a) => row({ id: a.id, ic, name: a.name, value: money(a.balance) })).join('')}</div>`
        : `<p class="empty muted">${type === 'efectivo' ? 'Añade el dinero que tienes en casa, en la cartera o en otros sitios.' : 'Añade tus cuentas del banco con su saldo actual.'}</p>`}
      <button class="add-btn" data-act="new" data-type="${type}">${icon('plus', 18)} ${addLabel}</button>
    </section>`;
  };
  return `
    <section class="hero glass">
      <span class="hero-l">Dinero en cuentas y efectivo</span>
      <b class="hero-v tnum">${money(t.money)}</b>
      <div class="hero-split"><span>Bancos <b class="tnum">${money(t.banks)}</b></span><span>Efectivo <b class="tnum">${money(t.cash)}</b></span></div>
      <span class="hero-foot">Patrimonio total con inversiones: <b class="tnum">${money(t.total)}</b></span>
    </section>
    ${group('banco', 'Bancos', 'bank', t.banks, 'Añadir cuenta')}
    ${group('efectivo', 'Efectivo', 'cash', t.cash, 'Añadir efectivo')}
    <p class="tip muted">Toca una cuenta para cambiar su saldo.</p>`;
}

function pageInversiones() {
  const s = Store.state, t = Store.totals();
  const ret = t.invested ? t.gain / t.invested : NaN;
  return `
    <section class="hero glass">
      <span class="hero-l">Valor de tus inversiones</span>
      <b class="hero-v tnum">${money(t.value)}</b>
      <div class="hero-split"><span>Invertido <b class="tnum">${money(t.invested)}</b></span><span>Ganancia <b class="tnum">${signed(t.gain)}</b> <span class="muted">${pct(ret)}</span></span></div>
      <span class="hero-foot">Patrimonio total con cuentas y efectivo: <b class="tnum">${money(t.total)}</b></span>
    </section>
    <section class="card glass">
      <div class="card-h"><h2>${icon('trend', 18)} Mis inversiones</h2><span class="muted small">${s.investments.length}</span></div>
      ${s.investments.length ? `<div class="rows">${s.investments.map((i) => {
        const g = i.value - i.invested;
        return row({ id: i.id, ic: 'trend', name: i.name, sub: i.kind, value: money(i.value), extra: `<small class="tnum">${signed(g)}${i.invested ? ` · ${pct(g / i.invested)}` : ''}</small>` });
      }).join('')}</div>` : `<p class="empty muted">Añade acciones, fondos, cripto o cualquier inversión con lo que pusiste y lo que vale hoy.</p>`}
      <button class="add-btn" data-act="new">${icon('plus', 18)} Añadir inversión</button>
    </section>
    <p class="tip muted">Toca una inversión para actualizar su valor.</p>`;
}

/* ---------------- App ---------------- */
const App = {
  page: 'cuentas',
  init() {
    Store.load();
    applyTheme();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    $('#tabbar').innerHTML = Object.entries(PAGES).map(([id, p]) => `<a class="tab" href="#/${id}" data-page="${id}">${icon(p.icon, 21)}<span>${p.title}</span></a>`).join('');
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a || a.closest('.modal-back')) return;
      const act = a.dataset.act;
      if (act === 'settings') return settings();
      const isInv = this.page === 'inversiones';
      if (act === 'new') return isInv ? editInvestment() : editAccount({ type: a.dataset.type });
      if (act === 'edit') {
        const item = Store.state[isInv ? 'investments' : 'accounts'].find((x) => x.id === a.dataset.id);
        if (item) return isInv ? editInvestment(item) : editAccount(item);
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close(); });
    this.route();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  },
  route() {
    const id = location.hash.replace(/^#\/?/, '');
    this.page = PAGES[id] ? id : 'cuentas';
    this.render();
    window.scrollTo(0, 0);
  },
  render() {
    if (!Store.state) return;
    $('#view').innerHTML = this.page === 'inversiones' ? pageInversiones() : pageCuentas();
    document.title = `${PAGES[this.page].title} · Entorno Financiero`;
    $$('#tabbar .tab').forEach((t) => t.classList.toggle('on', t.dataset.page === this.page));
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
