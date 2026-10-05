'use strict';
/* Entorno Financiero · Cuentas (bancos y efectivo) con gastos e ingresos, e Inversiones. */

/* ---------------- Iconos ---------------- */
const ICONS = {
  bank: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16" cy="14" r="1"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chev: '<polyline points="9 18 15 12 9 6"/>',
  chevL: '<polyline points="15 18 9 12 15 6"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  edit: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  swap: '<polyline points="16 3 20 7 16 11"/><line x1="20" y1="7" x2="4" y2="7"/><polyline points="8 21 4 17 8 13"/><line x1="4" y1="17" x2="20" y2="17"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  arrowOut: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
  arrowIn: '<line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>',
  // Categorías
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2"/><path d="M6 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  film: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
  bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
};
const icon = (n, s = 20) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.more}</svg>`;

/* Categorías fijas, pensadas para apuntar rápido. */
const CATS = {
  expense: [
    ['super', 'Supermercado', 'cart'], ['comida', 'Comer fuera', 'utensils'], ['casa', 'Casa', 'home'],
    ['facturas', 'Facturas', 'zap'], ['transporte', 'Transporte', 'car'], ['ocio', 'Ocio', 'film'],
    ['compras', 'Compras', 'bag'], ['salud', 'Salud', 'heart'], ['suscripciones', 'Suscripciones', 'repeat'],
    ['otros', 'Otros', 'more'],
  ],
  income: [
    ['nomina', 'Nómina', 'briefcase'], ['bizum', 'Bizum / transferencia', 'phone'], ['ventas', 'Ventas', 'tag'],
    ['regalo', 'Regalo', 'gift'], ['intereses', 'Intereses', 'percent'], ['otros_i', 'Otros', 'more'],
  ],
};
const catInfo = (type, key) => {
  const c = (CATS[type] || []).find((x) => x[0] === key) || (CATS[type] || CATS.expense).slice(-1)[0];
  return { key: c[0], name: c[1], icon: c[2] };
};

/* ---------------- Utilidades ---------------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (arr, f) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dateStr(new Date());
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return dateStr(new Date(y, m - 1, d + n)); };
const monthStart = () => today().slice(0, 8) + '01';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function dayLabel(s) {
  if (s === today()) return 'Hoy';
  if (s === addDays(today(), -1)) return 'Ayer';
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return cap(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: y === new Date().getFullYear() ? undefined : 'numeric' }).format(dt));
}
const monthName = () => cap(new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date()));
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

/* ---------------- Datos ----------------
   Cada cuenta guarda su saldo actual. Cada movimiento (gasto, ingreso, traspaso
   o ajuste) actualiza ese saldo al guardarse y lo revierte al borrarse. */
const OLD_CAT_MAP = {
  c_super: 'super', c_restaurantes: 'comida', c_cafe: 'comida', c_vivienda: 'casa', c_hogar: 'casa', c_suministros: 'facturas',
  c_internet: 'facturas', c_seguros: 'facturas', c_impuestos: 'facturas', c_transporte: 'transporte', c_combustible: 'transporte',
  c_ocio: 'ocio', c_viajes: 'ocio', c_ropa: 'compras', c_tecnologia: 'compras', c_regalos: 'compras', c_salud: 'salud',
  c_deporte: 'salud', c_cuidado: 'salud', c_suscripciones: 'suscripciones',
  c_nomina: 'nomina', c_freelance: 'nomina', c_ventas: 'ventas', c_regalos_in: 'regalo', c_intereses: 'intereses',
  c_inversiones: 'intereses', c_reembolsos: 'bizum', c_cobros: 'bizum',
};
const Store = {
  KEY: 'entorno-financiero:simple:v1',
  OLD_KEY: 'entorno-financiero:v1',
  state: null,
  defaults: () => ({ version: 3, settings: { currency: 'EUR', theme: 'auto' }, accounts: [], investments: [], movements: [] }),

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        this.state = this.clean(JSON.parse(raw));
        if ((this.state.version || 0) < 3) this.upgradeFromV2();
      } else this.state = this.fromOldVersion() || this.defaults();
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
      movements: Array.isArray(s.movements) ? s.movements : [],
    };
  },
  oldData() {
    try { return JSON.parse(localStorage.getItem(this.OLD_KEY) || 'null'); } catch (e) { return null; }
  },
  /* Historial de la versión completa como movimientos (sin tocar saldos). */
  oldMovements(old, accountIds) {
    return (old.transactions || []).filter((t) => accountIds.has(t.accountId) && ['income', 'expense', 'transfer', 'adjust'].includes(t.type) && (t.type !== 'transfer' || accountIds.has(t.toAccountId)))
      .map((t) => ({
        id: t.id || uid(), type: t.type, amount: t.amount, accountId: t.accountId, toAccountId: t.toAccountId || null,
        cat: t.type === 'expense' ? OLD_CAT_MAP[t.categoryId] || 'otros' : t.type === 'income' ? OLD_CAT_MAP[t.categoryId] || 'otros_i' : null,
        note: t.note || '', date: t.date, createdAt: t.createdAt || 0,
      }));
  },
  upgradeFromV2() {
    const old = this.oldData();
    if (old && !this.state.movements.length) this.state.movements = this.oldMovements(old, new Set(this.state.accounts.map((a) => a.id)));
    this.state.version = 3;
    this.persist();
  },
  fromOldVersion() {
    const old = this.oldData();
    if (!old) return null;
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
    s.accounts = (old.accounts || []).filter((a) => !a.archived).map((a) => ({ id: a.id, name: a.name, type: a.type === 'efectivo' ? 'efectivo' : 'banco', balance: balance(a.id, a.initial) }));
    s.investments = (old.investments || []).map((i) => ({ id: i.id, name: i.name, kind: i.kind || 'Otro', invested: +i.invested || 0, value: +i.value || 0, updated: i.updated || today() }));
    s.movements = this.oldMovements(old, new Set(s.accounts.map((a) => a.id)));
    this.state = s;
    this.persist();
    return s;
  },
  persist() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch (e) { toast('No se pudo guardar. Exporta una copia desde Ajustes.'); }
  },
  save() {
    this.persist();
    App.render();
  },
  account(id) { return this.state.accounts.find((a) => a.id === id); },
  upsert(col, item) {
    const list = this.state[col];
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = { ...list[i], ...item };
    else list.push({ ...item, id: item.id || uid() });
    this.save();
    return i >= 0 ? list[i] : list[list.length - 1];
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

  /* ---- Movimientos ---- */
  apply(m, sign) {
    const a = this.account(m.accountId), b = m.toAccountId && this.account(m.toAccountId);
    const v = m.amount * sign;
    if (m.type === 'expense' && a) a.balance = round2(a.balance - v);
    else if (m.type === 'income' && a) a.balance = round2(a.balance + v);
    else if (m.type === 'adjust' && a) a.balance = round2(a.balance + v);
    else if (m.type === 'transfer') {
      if (a) a.balance = round2(a.balance - v);
      if (b) b.balance = round2(b.balance + v);
    }
  },
  addMovement(m) {
    const mov = { id: uid(), createdAt: Date.now(), ...m };
    this.apply(mov, 1);
    this.state.movements.push(mov);
    this.save();
    return mov;
  },
  updateMovement(id, data) {
    const m = this.state.movements.find((x) => x.id === id);
    if (!m) return;
    this.apply(m, -1);
    Object.assign(m, data);
    this.apply(m, 1);
    this.save();
  },
  removeMovement(id) {
    const i = this.state.movements.findIndex((x) => x.id === id);
    if (i < 0) return null;
    const m = this.state.movements[i];
    this.apply(m, -1);
    this.state.movements.splice(i, 1);
    this.save();
    return { removed: m, index: i };
  },
  restoreMovement({ removed, index }) {
    this.apply(removed, 1);
    this.state.movements.splice(index, 0, removed);
    this.save();
  },
  /* Quitar cuenta con sus movimientos (se puede deshacer). */
  removeAccount(id) {
    const ai = this.state.accounts.findIndex((a) => a.id === id);
    if (ai < 0) return null;
    const account = this.state.accounts[ai];
    const movs = this.state.movements.filter((m) => m.accountId === id || m.toAccountId === id);
    this.state.accounts.splice(ai, 1);
    this.state.movements = this.state.movements.filter((m) => !movs.includes(m));
    this.save();
    return { account, index: ai, movs };
  },
  restoreAccount({ account, index, movs }) {
    this.state.accounts.splice(index, 0, account);
    this.state.movements.push(...movs);
    this.save();
  },
  movementsOf(id) {
    return this.state.movements.filter((m) => m.accountId === id || m.toAccountId === id);
  },
  /* Ingresos y gastos (sin traspasos ni ajustes) desde una fecha, opcionalmente de una cuenta. */
  flow(from, accountId) {
    let income = 0, expense = 0;
    for (const m of this.state.movements) {
      if (m.date < from || (accountId && m.accountId !== accountId)) continue;
      if (m.type === 'income') income += m.amount;
      else if (m.type === 'expense') expense += m.amount;
    }
    return { income: round2(income), expense: round2(expense), net: round2(income - expense) };
  },
  expenseByCat(from) {
    const map = {};
    for (const m of this.state.movements) if (m.type === 'expense' && m.date >= from) map[m.cat] = (map[m.cat] || 0) + m.amount;
    return Object.entries(map).map(([k, v]) => ({ cat: catInfo('expense', k), total: round2(v) })).sort((a, b) => b.total - a.total);
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
      api.onClose && api.onClose();
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
    m.onClose = () => { if (!done) resolve(false); };
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
document.addEventListener('change', (e) => {
  const r = e.target.closest && e.target.closest('.seg input[type=radio]');
  if (r) r.closest('.seg').querySelector('.seg-thumb').style.setProperty('--i', r.dataset.index);
});
const field = (label, control, hint = '') => `<label class="field"><span class="field-l">${label}</span>${control}${hint ? `<span class="field-h">${hint}</span>` : ''}</label>`;
const moneyIn = (name, value, attrs = '') => `<div class="money-in"><input class="input" type="text" inputmode="decimal" name="${name}" value="${esc(inputAmount(value))}" placeholder="0,00" autocomplete="off" ${attrs}><span>${esc(symbol())}</span></div>`;
const formData = (f) => Object.fromEntries(new FormData(f).entries());
const accIcon = (a) => (a && a.type === 'efectivo' ? 'cash' : 'bank');
const accLabel = (a) => (a ? `${a.name}${a.type === 'efectivo' ? ' · efectivo' : ''}` : 'Cuenta eliminada');
const accOptions = (selected) => Store.state.accounts.map((a) => `<option value="${a.id}" ${a.id === selected ? 'selected' : ''}>${esc(accLabel(a))}</option>`).join('');

/* ---------------- Formularios ---------------- */
function editAccount(acc = {}) {
  const editing = !!acc.id;
  const type = acc.type || 'banco';
  sheet({
    title: editing ? `Editar ${acc.name}` : type === 'efectivo' ? 'Nuevo efectivo' : 'Nueva cuenta',
    body: `<form autocomplete="off">
      ${seg('type', [{ value: 'banco', label: 'Banco' }, { value: 'efectivo', label: 'Efectivo' }], type)}
      ${field('Nombre', `<input class="input" name="name" value="${esc(acc.name || '')}" placeholder="${type === 'efectivo' ? 'p. ej. Casa, Cartera, Casa de mis padres' : 'p. ej. BBVA, ING, Revolut'}" maxlength="40" ${editing ? '' : 'autofocus'} required>`)}
      ${field(editing ? 'Saldo actual' : 'Cuánto hay ahora', moneyIn('balance', acc.balance), editing ? 'Si lo cambias, la diferencia se apunta como «Ajuste de saldo». No cuenta como gasto ni ingreso.' : 'Después apunta aquí tus gastos e ingresos y el saldo se actualiza solo.')}
      <button type="submit" hidden></button>
    </form>`,
    footer: `${editing ? `<button class="btn btn-ghost" data-act="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-act="save">${icon('check', 18)} Guardar</button>`,
    actions: {
      save: (a, m) => {
        const f = formData(m.$('form'));
        const balance = round2(parseAmount(f.balance));
        const name = f.name.trim();
        if (!name) return toast('Pon un nombre.');
        if (!editing) {
          const created = Store.upsert('accounts', { name, type: f.type, balance: isFinite(balance) ? balance : 0 });
          toast(`${name} añadida`);
          m.close();
          location.hash = `#/cuenta/${created.id}`;
          return;
        }
        Store.state.accounts.find((x) => x.id === acc.id).name = name;
        Store.state.accounts.find((x) => x.id === acc.id).type = f.type;
        const current = Store.account(acc.id).balance;
        if (isFinite(balance) && round2(balance - current) !== 0) {
          const mv = Store.addMovement({ type: 'adjust', amount: round2(balance - current), accountId: acc.id, date: today(), note: 'Ajuste de saldo' });
          toast(`${name}: ${money(balance)}`, 'Deshacer', () => { const r = Store.removeMovement(mv.id); return r; });
        } else {
          Store.save();
          toast('Cambios guardados');
        }
        m.close();
      },
      del: async (a, m) => {
        const n = Store.movementsOf(acc.id).length;
        if (!(await confirmBox(`Se quitará «${acc.name}»${n ? ` con sus ${n} movimientos` : ''} y su saldo dejará de contar.`))) return;
        const r = Store.removeAccount(acc.id);
        m.close();
        location.hash = '#/cuentas';
        toast(`${acc.name} eliminada`, 'Deshacer', () => Store.restoreAccount(r));
      },
    },
  });
}

/* Alta o edición de gasto, ingreso o traspaso. */
function movementForm({ type = 'expense', accountId, mov } = {}) {
  if (!Store.state.accounts.length) {
    toast('Primero añade una cuenta o un lugar con efectivo.');
    return editAccount();
  }
  if (mov && mov.type === 'adjust') return adjustInfo(mov);
  const editing = !!mov;
  let t = editing ? mov.type : type;
  const accs = Store.state.accounts;
  const lastAcc = Store.state.settings.lastAccount;
  const defAcc = (editing && mov.accountId) || (accountId && Store.account(accountId) && accountId) || (lastAcc && Store.account(lastAcc) && lastAcc) || accs[0].id;
  const defTo = (editing && mov.toAccountId) || (accs.find((a) => a.id !== defAcc) || accs[0]).id;
  let selectedCat = editing ? mov.cat : null;

  const catChips = () => {
    if (t === 'transfer') {
      return `<div class="grid2">
        ${field('Sale de', `<select class="input" name="accountId">${accOptions(defAcc)}</select>`)}
        ${field('Entra en', `<select class="input" name="toAccountId">${accOptions(defTo)}</select>`)}
      </div>`;
    }
    const list = CATS[t];
    if (!list.some((c) => c[0] === selectedCat)) selectedCat = list[0][0];
    return `<div class="field"><span class="field-l">Categoría</span><div class="chips">${list.map(([k, n, ic]) => `<label class="chip"><input type="radio" name="cat" value="${k}" ${k === selectedCat ? 'checked' : ''}><span>${icon(ic, 16)}${n}</span></label>`).join('')}</div></div>
      ${field(t === 'expense' ? 'Pagado desde' : 'Cobrado en', `<select class="input" name="accountId">${accOptions(defAcc)}</select>`)}`;
  };
  const sign = () => (t === 'expense' ? '−' : t === 'income' ? '+' : '');
  const dateRow = (d) => `<div class="date-row">
      <label class="chip"><input type="radio" name="dq" value="${today()}" ${d === today() ? 'checked' : ''}><span>Hoy</span></label>
      <label class="chip"><input type="radio" name="dq" value="${addDays(today(), -1)}" ${d === addDays(today(), -1) ? 'checked' : ''}><span>Ayer</span></label>
      <input class="input" type="date" name="date" value="${d}" max="${addDays(today(), 366)}" required>
    </div>`;
  const titles = { expense: 'Nuevo gasto', income: 'Nuevo ingreso', transfer: 'Mover dinero' };

  sheet({
    title: editing ? 'Editar movimiento' : titles[t],
    body: `<form autocomplete="off">
      ${seg('mtype', [{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }, { value: 'transfer', label: 'Mover' }], t)}
      <label class="amount-big"><span class="amount-sign">${sign()}</span><input type="text" inputmode="decimal" name="amount" placeholder="0,00" value="${esc(inputAmount(editing ? mov.amount : ''))}" aria-label="Importe" autofocus><span class="amount-cur">${esc(symbol())}</span></label>
      <div class="cat-zone">${catChips()}</div>
      ${field('Fecha', dateRow(editing ? mov.date : today()))}
      ${field('Nota', `<input class="input" name="note" value="${esc(editing ? mov.note || '' : '')}" placeholder="Opcional, p. ej. Mercadona, cena con amigos" maxlength="60">`)}
      <button type="submit" hidden></button>
    </form>`,
    footer: `${editing ? `<button class="btn btn-ghost" data-act="del">${icon('trash', 18)} Eliminar</button>` : `<button class="btn" data-act="more">Guardar y otro</button>`}<button class="btn btn-primary" data-act="save">${icon('check', 18)} Guardar</button>`,
    onMount: (m) => {
      m.el.addEventListener('change', (e) => {
        if (e.target.name === 'mtype') {
          const cat = m.$('[name=cat]:checked');
          if (cat) selectedCat = cat.value;
          t = e.target.value;
          m.$('.cat-zone').innerHTML = catChips();
          m.$('.amount-sign').textContent = sign();
          if (!editing) m.$('.modal-h h2').textContent = titles[t];
        }
        if (e.target.name === 'dq') m.$('[name=date]').value = e.target.value;
        if (e.target.name === 'date') $$('[name=dq]', m.el).forEach((r) => { r.checked = r.value === e.target.value; });
      });
    },
    actions: {
      save: (a, m) => submit(m, false),
      more: (a, m) => submit(m, true),
      del: async (a, m) => {
        if (!(await confirmBox('Se eliminará este movimiento y el saldo volverá a como estaba.'))) return;
        const r = Store.removeMovement(mov.id);
        m.close();
        toast('Movimiento eliminado', 'Deshacer', () => Store.restoreMovement(r));
      },
    },
  });

  function submit(m, again) {
    const f = formData(m.$('form'));
    const amount = round2(parseAmount(f.amount));
    if (!(amount > 0)) { toast('Escribe un importe mayor que 0.'); m.$('[name=amount]').focus(); return; }
    if (t === 'transfer' && f.accountId === f.toAccountId) return toast('Elige dos cuentas distintas.');
    const data = {
      type: t, amount, accountId: f.accountId, toAccountId: t === 'transfer' ? f.toAccountId : null,
      cat: t === 'transfer' ? null : f.cat, note: (f.note || '').trim(), date: f.date || today(),
    };
    Store.state.settings.lastAccount = data.accountId;
    if (editing) {
      Store.updateMovement(mov.id, data);
      toast('Movimiento actualizado');
      return m.close();
    }
    const created = Store.addMovement(data);
    const what = t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Traspaso';
    toast(`${what} de ${money(amount)} guardado`, 'Deshacer', () => Store.removeMovement(created.id));
    if (again) {
      m.$('[name=amount]').value = '';
      m.$('[name=note]').value = '';
      m.$('[name=amount]').focus();
    } else m.close();
  }
}

function adjustInfo(mov) {
  const a = Store.account(mov.accountId);
  sheet({
    title: 'Ajuste de saldo',
    body: `<div class="kvs">
      <div class="kv"><span>Cuenta</span><b>${esc(accLabel(a))}</b></div>
      <div class="kv"><span>Cambio</span><b class="tnum">${signed(mov.amount)}</b></div>
      <div class="kv"><span>Fecha</span><span>${esc(dayLabel(mov.date))}</span></div>
    </div>
    <p class="field-h">Se creó al cambiar el saldo a mano. No cuenta como gasto ni ingreso. Si lo eliminas, el saldo vuelve a como estaba.</p>`,
    footer: `<button class="btn btn-ghost" data-act="del">${icon('trash', 18)} Eliminar</button><button class="btn btn-primary" data-act="close">Cerrar</button>`,
    actions: {
      del: (b, m) => {
        const r = Store.removeMovement(mov.id);
        m.close();
        toast('Ajuste eliminado', 'Deshacer', () => Store.restoreMovement(r));
      },
    },
  });
}

/* Menú del botón central. */
function addMenu(accountId) {
  sheet({
    title: '¿Qué quieres apuntar?',
    body: `<div class="menu">
      <button class="menu-i" data-act="go" data-type="expense"><span class="menu-ic">${icon('arrowOut', 22)}</span><span><b>Gasto</b><small>Una compra, una factura, una cena…</small></span>${icon('chev', 18)}</button>
      <button class="menu-i" data-act="go" data-type="income"><span class="menu-ic">${icon('arrowIn', 22)}</span><span><b>Ingreso</b><small>Nómina, un Bizum, una venta…</small></span>${icon('chev', 18)}</button>
      <button class="menu-i" data-act="go" data-type="transfer"><span class="menu-ic">${icon('swap', 22)}</span><span><b>Mover dinero</b><small>Del banco a casa, entre cuentas…</small></span>${icon('chev', 18)}</button>
      <button class="menu-i" data-act="inv"><span class="menu-ic">${icon('trend', 22)}</span><span><b>Inversión</b><small>Añadir una inversión nueva</small></span>${icon('chev', 18)}</button>
    </div>`,
    actions: {
      go: (b, m) => { m.close(); movementForm({ type: b.dataset.type, accountId }); },
      inv: (b, m) => { m.close(); location.hash = '#/inversiones'; editInvestment(); },
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
        if (!(await confirmBox('Se borrarán todas tus cuentas, movimientos e inversiones de este dispositivo.', 'Borrar todo'))) return;
        Store.state = Store.defaults();
        Store.save();
        applyTheme();
        m.close();
        location.hash = '#/cuentas';
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
      localStorage.setItem(Store.OLD_KEY, JSON.stringify(data));
      Store.state = Store.fromOldVersion();
    } else {
      delete data.app; delete data.exportedAt;
      Store.state = Store.clean(data);
      Store.state.version = 3;
    }
    Store.save();
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

/* ---------------- Piezas de las páginas ---------------- */
function row({ act = 'edit', id, ic, name, sub, value, extra = '' }) {
  return `<button class="row" data-act="${act}" data-id="${id}">
    <span class="row-ic">${icon(ic, 19)}</span>
    <span class="row-main"><b>${esc(name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
    <span class="row-val"><b class="tnum">${value}</b>${extra}</span>
    <span class="row-chev">${icon('chev', 16)}</span>
  </button>`;
}
/* Fila de movimiento vista desde una cuenta (o desde todas si no se indica). */
function movRow(m, fromAccountId) {
  let ic, title, sub, amount;
  const a = Store.account(m.accountId), b = Store.account(m.toAccountId);
  if (m.type === 'transfer') {
    ic = 'swap';
    title = m.note || 'Traspaso';
    sub = `${a ? a.name : '—'} → ${b ? b.name : '—'}`;
    amount = fromAccountId ? (m.toAccountId === fromAccountId ? m.amount : -m.amount) : 0;
  } else if (m.type === 'adjust') {
    ic = 'sliders';
    title = m.note || 'Ajuste de saldo';
    sub = fromAccountId ? 'Ajuste de saldo' : accLabel(a);
    amount = m.amount;
  } else {
    const c = catInfo(m.type, m.cat);
    ic = c.icon;
    title = m.note || c.name;
    sub = [m.note ? c.name : '', fromAccountId ? '' : a ? a.name : ''].filter(Boolean).join(' · ');
    amount = m.type === 'income' ? m.amount : -m.amount;
  }
  const val = m.type === 'transfer' && !fromAccountId ? money(m.amount) : signed(amount);
  return `<button class="row mov" data-act="mov" data-id="${m.id}">
    <span class="row-ic">${icon(ic, 18)}</span>
    <span class="row-main"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
    <span class="row-val"><b class="tnum ${amount > 0 ? 'pos' : ''}">${val}</b></span>
  </button>`;
}
function movGroups(list, fromAccountId) {
  const sorted = [...list].sort((x, y) => y.date.localeCompare(x.date) || (y.createdAt || 0) - (x.createdAt || 0));
  const groups = [];
  for (const m of sorted) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== m.date) groups.push((g = { date: m.date, items: [] }));
    g.items.push(m);
  }
  return groups.map((g) => `<div class="day"><div class="day-h">${esc(dayLabel(g.date))}</div><div class="rows">${g.items.map((m) => movRow(m, fromAccountId)).join('')}</div></div>`).join('');
}
const quickActions = (accountId = '') => `<div class="quick">
    <button class="qa" data-act="add" data-type="expense" data-acc="${accountId}"><span class="qa-ic">${icon('minus', 20)}</span>Gasto</button>
    <button class="qa" data-act="add" data-type="income" data-acc="${accountId}"><span class="qa-ic">${icon('plus', 20)}</span>Ingreso</button>
    <button class="qa" data-act="add" data-type="transfer" data-acc="${accountId}"><span class="qa-ic">${icon('swap', 20)}</span>Mover</button>
  </div>`;

/* ---------------- Páginas ---------------- */
function pageCuentas() {
  const s = Store.state, t = Store.totals();
  const ms = monthStart();
  const flow = Store.flow(ms);
  const cats = Store.expenseByCat(ms).slice(0, 4);
  const maxCat = cats.length ? cats[0].total : 1;
  const recent = [...s.movements].sort((x, y) => y.date.localeCompare(x.date) || (y.createdAt || 0) - (x.createdAt || 0)).slice(0, 6);

  const group = (type, title, ic, total, addLabel) => {
    const list = s.accounts.filter((a) => (type === 'efectivo' ? a.type === 'efectivo' : a.type !== 'efectivo'));
    return `<section class="card glass">
      <div class="card-h"><h2>${icon(ic, 18)} ${title}</h2><b class="tnum">${money(total)}</b></div>
      ${list.length ? `<div class="rows">${list.map((a) => {
        const f = Store.flow(ms, a.id);
        const sub = f.income || f.expense ? `${monthName()}: ${f.income ? '+' + money(f.income) : ''}${f.income && f.expense ? ' · ' : ''}${f.expense ? '−' + money(f.expense) : ''}` : 'Sin movimientos este mes';
        return row({ act: 'open', id: a.id, ic, name: a.name, sub, value: money(a.balance) });
      }).join('')}</div>`
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
    ${s.accounts.length ? quickActions() : ''}
    <section class="card glass">
      <div class="card-h"><h2>${monthName()}</h2><span class="muted small">Este mes</span></div>
      <div class="stats3">
        <div><span>Ingresos</span><b class="tnum">${money(flow.income)}</b></div>
        <div><span>Gastos</span><b class="tnum">${money(flow.expense)}</b></div>
        <div><span>Balance</span><b class="tnum">${signed(flow.net)}</b></div>
      </div>
      ${cats.length ? `<div class="cat-bars">${cats.map((c) => `<div class="cat-row"><span class="cat-ic">${icon(c.cat.icon, 16)}</span><span class="cat-main"><span class="cat-top"><span>${esc(c.cat.name)}</span><b class="tnum">${money(c.total)}</b></span><span class="bar"><i style="width:${Math.max(3, (c.total / maxCat) * 100)}%"></i></span></span></div>`).join('')}</div>`
        : `<p class="empty muted">Cuando apuntes gastos verás aquí en qué se te va el dinero.</p>`}
    </section>
    ${group('banco', 'Bancos', 'bank', t.banks, 'Añadir cuenta')}
    ${group('efectivo', 'Efectivo', 'cash', t.cash, 'Añadir efectivo')}
    ${recent.length ? `<section class="card glass"><div class="card-h"><h2>Últimos movimientos</h2></div>${movGroups(recent)}</section>` : ''}`;
}

function pageCuenta(id) {
  const a = Store.account(id);
  if (!a) return `<section class="card glass"><p class="empty muted">Esta cuenta ya no existe.</p><a class="add-btn" href="#/cuentas">Volver a cuentas</a></section>`;
  const ms = monthStart();
  const f = Store.flow(ms, id);
  const list = Store.movementsOf(id);
  return `
    <div class="crumbs">
      <a class="back glass-pill" href="#/cuentas">${icon('chevL', 18)} Cuentas</a>
      <button class="back glass-pill" data-act="editAcc" data-id="${a.id}">${icon('edit', 16)} Editar</button>
    </div>
    <section class="hero glass">
      <span class="hero-l acc-title">${icon(accIcon(a), 18)} ${esc(a.name)} <span class="muted">· ${a.type === 'efectivo' ? 'Efectivo' : 'Banco'}</span></span>
      <b class="hero-v tnum">${money(a.balance)}</b>
      <div class="hero-split"><span>Ingresos en ${monthName().toLowerCase()} <b class="tnum">${money(f.income)}</b></span><span>Gastos <b class="tnum">${money(f.expense)}</b></span></div>
    </section>
    ${quickActions(a.id)}
    <section class="card glass">
      <div class="card-h"><h2>Movimientos</h2><span class="muted small">${list.length}</span></div>
      ${list.length ? movGroups(list, a.id) : `<p class="empty muted">Todavía no hay movimientos. Usa los botones de arriba para apuntar un gasto o un ingreso en ${esc(a.name)}.</p>`}
    </section>`;
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
  accountId: null,
  init() {
    Store.load();
    applyTheme();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    $('#tabbar').innerHTML = `
      <a class="tab" href="#/cuentas" data-page="cuentas">${icon('wallet', 21)}<span>Cuentas</span></a>
      <button class="tab-add" data-act="menu" aria-label="Apuntar gasto o ingreso">${icon('plus', 26)}</button>
      <a class="tab" href="#/inversiones" data-page="inversiones">${icon('trend', 21)}<span>Inversiones</span></a>`;
    window.addEventListener('hashchange', () => this.route());
    document.addEventListener('click', (e) => this.onClick(e));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && stack.length) return stack[stack.length - 1].close();
      const tag = (e.target.tagName || '').toLowerCase();
      if (stack.length || ['input', 'select', 'textarea'].includes(tag) || e.metaKey || e.ctrlKey) return;
      if (e.key === 'n' || e.key === 'N') movementForm({ type: 'expense', accountId: this.accountId });
      if (e.key === 'i' || e.key === 'I') movementForm({ type: 'income', accountId: this.accountId });
    });
    this.route();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  },
  onClick(e) {
    const a = e.target.closest('[data-act]');
    if (!a || a.closest('.modal-back')) return;
    const act = a.dataset.act, id = a.dataset.id;
    if (act === 'settings') return settings();
    if (act === 'menu') return addMenu(this.accountId);
    if (act === 'add') return movementForm({ type: a.dataset.type, accountId: a.dataset.acc || this.accountId });
    if (act === 'open') { location.hash = `#/cuenta/${id}`; return; }
    if (act === 'editAcc') return editAccount(Store.account(id));
    if (act === 'mov') { const m = Store.state.movements.find((x) => x.id === id); if (m) movementForm({ mov: m }); return; }
    if (this.page === 'inversiones') {
      if (act === 'new') return editInvestment();
      if (act === 'edit') { const inv = Store.state.investments.find((x) => x.id === id); if (inv) editInvestment(inv); }
      return;
    }
    if (act === 'new') return editAccount({ type: a.dataset.type });
  },
  route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [p, id] = h.split('/');
    this.accountId = p === 'cuenta' && id ? id : null;
    this.page = p === 'inversiones' ? 'inversiones' : this.accountId ? 'cuenta' : 'cuentas';
    this.render();
    window.scrollTo(0, 0);
  },
  render() {
    if (!Store.state) return;
    const v = $('#view');
    v.innerHTML = this.page === 'inversiones' ? pageInversiones() : this.page === 'cuenta' ? pageCuenta(this.accountId) : pageCuentas();
    const acc = this.accountId && Store.account(this.accountId);
    document.title = `${this.page === 'inversiones' ? 'Inversiones' : acc ? acc.name : 'Cuentas'} · Entorno Financiero`;
    $$('#tabbar .tab').forEach((t) => t.classList.toggle('on', t.dataset.page === (this.page === 'inversiones' ? 'inversiones' : 'cuentas')));
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
