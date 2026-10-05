'use strict';
/* Arranque, navegación, acciones globales, import/export y datos de ejemplo. */
const ROUTES = [
  { id: 'resumen', title: 'Resumen', icon: 'grid', group: 'General' },
  { id: 'movimientos', title: 'Movimientos', icon: 'list', group: 'General' },
  { id: 'calendario', title: 'Calendario', icon: 'calendar', group: 'General' },
  { id: 'informes', title: 'Informes', icon: 'bar', group: 'General' },
  { id: 'gastos', title: 'Gastos', icon: 'arrowUpRight', group: 'Dinero' },
  { id: 'ingresos', title: 'Ingresos', icon: 'arrowDownLeft', group: 'Dinero' },
  { id: 'nomina', title: 'Nómina', icon: 'briefcase', group: 'Dinero' },
  { id: 'recurrentes', title: 'Recurrentes', icon: 'repeat', group: 'Dinero' },
  { id: 'presupuestos', title: 'Presupuestos', icon: 'pie', group: 'Planificación' },
  { id: 'ahorro', title: 'Ahorro', icon: 'target', group: 'Planificación' },
  { id: 'deudas', title: 'Deudas', icon: 'users', group: 'Planificación' },
  { id: 'inversiones', title: 'Inversiones', icon: 'trendingUp', group: 'Planificación' },
  { id: 'cuentas', title: 'Cuentas y efectivo', icon: 'wallet', group: 'Planificación' },
  { id: 'ajustes', title: 'Ajustes', icon: 'sliders', group: 'Sistema' },
];
const TABBAR = ['resumen', 'movimientos', '+', 'informes', 'more'];

const App = {
  route: 'resumen',
  period: { type: 'month', ref: U.today() },
  catFilter: { expense: null, income: null },
  calDay: null,
  anchor: null,
  view: {},

  init() {
    Store.load();
    Store.processRecurring();
    UI.applyTheme();
    UI.initTooltip();
    this.buildNav();
    window.addEventListener('hashchange', () => this.onRoute());
    document.addEventListener('click', (e) => this.onClick(e));
    document.addEventListener('change', (e) => this.onDelegated(e, 'change', 'changes'));
    document.addEventListener('input', (e) => this.onDelegated(e, 'input', 'inputs'));
    document.addEventListener('keydown', (e) => this.onKey(e));
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => UI.applyTheme());
    window.addEventListener('resize', U.debounce(() => this.view.after && this.view.after(), 150));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Store.processRecurring()) UI.toast('Se han registrado cargos recurrentes pendientes');
    });
    Store.subscribe(() => this.render());
    this.onRoute();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  },

  buildNav() {
    const groups = {};
    ROUTES.forEach((r) => { (groups[r.group] = groups[r.group] || []).push(r); });
    UI.$('#sideNav').innerHTML = Object.entries(groups).map(([g, rs]) => `
      <p class="nav-g">${g}</p>
      ${rs.map((r) => `<a class="nav-i" href="#/${r.id}" data-route="${r.id}">${icon(r.icon, 19)}<span>${r.title}</span></a>`).join('')}`).join('');
    UI.$('#tabbar').innerHTML = TABBAR.map((id) => {
      if (id === '+') return `<button class="tab-add" data-action="add" data-type="expense" aria-label="Añadir movimiento">${icon('plus', 26)}</button>`;
      if (id === 'more') return `<button class="tab" data-action="more" data-route="more">${icon('more', 22)}<span>Más</span></button>`;
      const r = ROUTES.find((x) => x.id === id);
      return `<a class="tab" href="#/${r.id}" data-route="${r.id}">${icon(r.icon, 22)}<span>${r.title}</span></a>`;
    }).join('');
  },

  onRoute() {
    const id = location.hash.replace(/^#\/?/, '') || 'resumen';
    const known = ROUTES.some((r) => r.id === id);
    this.route = known ? id : 'resumen';
    UI.closeTop();
    this.render(true);
  },

  render(scrollTop = false) {
    const r = ROUTES.find((x) => x.id === this.route);
    let v;
    try {
      v = Views[this.route]();
    } catch (err) {
      console.error(err);
      v = { html: `<div class="card glass">${H.empty('Algo ha fallado al mostrar esta sección. Tus datos están a salvo.')}</div>` };
    }
    this.view = v;
    UI.$('#view').innerHTML = v.html;
    UI.$('#viewTitle').textContent = r.title;
    document.title = `${r.title} · Entorno Financiero`;
    const inMore = !TABBAR.includes(this.route);
    UI.$$('[data-route]').forEach((a) => a.classList.toggle('on', a.dataset.route === this.route || (a.dataset.route === 'more' && inMore)));
    if (v.after) v.after();
    UI.animateSegs(UI.$('#view'));
    if (scrollTop) window.scrollTo(0, 0);
  },

  setPeriod(type, ref) {
    this.period = { type, ref: ref || this.period.ref };
    this.render();
  },

  globalActions: {
    go: (el) => { App.anchor = el.dataset.anchor || null; location.hash = `#/${el.dataset.route}`; if (App.route === el.dataset.route) App.render(); },
    add: (el) => Forms.tx({ type: el.dataset.type || 'expense' }),
    editTx: (el) => { const t = Store.get('transactions', el.dataset.id); if (t) Forms.tx({ tx: t }); },
    fav: (el) => { const q = Store.get('quick', el.dataset.id); if (q) Forms.quick(q); },
    periodType: (el) => App.setPeriod(el.dataset.value),
    periodPrev: () => App.setPeriod(App.period.type, U.shift(App.period.type, App.period.ref, -1)),
    periodNext: () => App.setPeriod(App.period.type, U.shift(App.period.type, App.period.ref, 1)),
    periodToday: () => App.setPeriod(App.period.type, U.today()),
    filterCat: (el) => {
      const type = el.dataset.type;
      App.catFilter[type] = App.catFilter[type] === el.dataset.id ? null : el.dataset.id;
      const target = type === 'income' ? 'ingresos' : 'gastos';
      if (App.route !== target) location.hash = `#/${target}`;
      else App.render();
    },
    more: () => App.openMore(),
    toggleTheme: () => {
      const cur = Store.state.settings.theme;
      const dark = cur === 'dark' || (cur === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      Store.batch((s) => { s.settings.theme = dark ? 'light' : 'dark'; });
      UI.applyTheme();
    },
    loadDemo: async () => {
      if (Store.state.transactions.length && !(await UI.confirm('Los datos de ejemplo sustituirán a tus datos actuales.', { ok: 'Cargar ejemplo' }))) return;
      Store.replaceAll(Demo.build());
      Store.processRecurring();
      UI.toast('Datos de ejemplo cargados. Bórralos desde Ajustes cuando quieras.');
    },
  },

  onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.closest('.modal-back')) return;
    const name = el.dataset.action;
    const fn = (this.view.actions && this.view.actions[name]) || this.globalActions[name];
    if (fn) {
      e.preventDefault();
      fn(el, e);
    }
  },
  onDelegated(e, attr, key) {
    const el = e.target.closest && e.target.closest(`[data-${attr}]`);
    if (!el || el.closest('.modal-back')) return;
    const fn = this.view[key] && this.view[key][el.dataset[attr]];
    if (fn) fn(el, e);
  },
  onKey(e) {
    if (e.key === 'Escape' && UI.closeTop()) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey || UI.hasModal()) return;
    if (e.key === 'n' || e.key === 'N' || e.key === '+') { e.preventDefault(); Forms.tx({ type: 'expense' }); }
    if (e.key === 'i' || e.key === 'I') { e.preventDefault(); Forms.tx({ type: 'income' }); }
  },

  openMore() {
    UI.modal({
      title: 'Todas las secciones',
      body: `<div class="more-grid">${ROUTES.map((r) => `<a class="more-i ${r.id === App.route ? 'on' : ''}" href="#/${r.id}" data-action="goto" data-route="${r.id}"><span class="cat-ic lg">${icon(r.icon, 22)}</span><span>${r.title}</span></a>`).join('')}</div>
        <button class="btn wide" data-action="theme">${icon('moon', 18)} Cambiar blanco / negro</button>`,
      actions: {
        goto: (el, e, m) => { m.close(); location.hash = `#/${el.dataset.route}`; },
        theme: () => App.globalActions.toggleTheme(),
      },
    });
  },

  /* ---------- Exportar / importar ---------- */
  exportJson() {
    const data = JSON.stringify({ app: 'entorno-financiero', exportedAt: new Date().toISOString(), ...Store.state }, null, 2);
    UI.download(`entorno-financiero-${U.today()}.json`, data, 'application/json');
    UI.toast('Copia de seguridad descargada');
  },
  async importJson(file) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) throw new Error('formato');
      if (!(await UI.confirm(`La copia contiene ${data.transactions.length} movimientos. Sustituirá tus datos actuales.`, { ok: 'Importar', danger: false }))) return;
      delete data.app;
      delete data.exportedAt;
      Store.replaceAll(data);
      Store.processRecurring();
      UI.applyTheme();
      UI.toast('Datos importados correctamente');
    } catch (err) {
      UI.toast('El archivo no es una copia válida de Entorno Financiero.');
    }
  },
  exportCsv(list, name) {
    const q = (s) => `"${String(s == null ? '' : s).replace(/"/g, '""')}"`;
    const typeName = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia', adjust: 'Ajuste de saldo' };
    const rows = [['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Cuenta destino', 'Importe', 'Nota'].map(q).join(';')];
    [...list].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => {
      const amount = (t.type === 'expense' ? -t.amount : t.amount).toFixed(2).replace('.', ',');
      rows.push([t.date, typeName[t.type], t.type === 'transfer' || t.type === 'adjust' ? '' : Store.cat(t.categoryId).name, (Store.account(t.accountId) || {}).name || '', (Store.account(t.toAccountId) || {}).name || '', amount, t.note || ''].map(q).join(';'));
    });
    UI.download(`${name}-${U.today()}.csv`, '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
    UI.toast(`${list.length} movimientos exportados`);
  },
};

/* ---------- Datos de ejemplo (6 meses) para probar la app ---------- */
const Demo = {
  build() {
    const s = Store.defaultState();
    s.settings.name = '';
    s.accounts[0].initial = 2400;
    s.accounts[1].initial = 120;
    s.accounts[2].initial = 6000;
    s.accounts[1].icon = 'wallet';
    s.accounts.push({ id: 'a_casa', name: 'Casa', type: 'efectivo', initial: 450, place: 'Cajón del dormitorio', icon: 'home' });
    s.accounts.push({ id: 'a_pueblo', name: 'Casa del pueblo', type: 'efectivo', initial: 200, place: 'Caja fuerte', icon: 'mapPin' });
    s.accounts.push({ id: 'a_revolut', name: 'Revolut', type: 'banco', initial: 180, place: 'Viajes y compras online', icon: 'card' });
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const between = (a, b) => U.round2(a + rnd() * (b - a));
    const tx = (date, type, amount, categoryId, note = '', accountId = 'a_banco') => s.transactions.push({ id: U.uid() + s.transactions.length, createdAt: Date.now(), date, type, amount: U.round2(amount), categoryId, accountId, note });
    const today = U.today();
    const start = U.addMonths(U.range('month', today).start, -5);
    for (let d = start; d <= today; d = U.addDays(d, 1)) {
      const day = U.parse(d).getDate(), wd = U.parse(d).getDay();
      if (rnd() < 0.55) tx(d, 'expense', between(1.2, 3.8), 'c_cafe', rnd() < 0.5 ? 'Café' : '', rnd() < 0.4 ? 'a_efectivo' : 'a_banco');
      if (wd === 1 || wd === 4 || (wd === 6 && rnd() < 0.7)) tx(d, 'expense', between(15, 68), 'c_super', ['Mercadona', 'Lidl', 'Carrefour', 'Dia'][Math.floor(rnd() * 4)]);
      if (wd >= 1 && wd <= 5 && rnd() < 0.25) tx(d, 'expense', between(10, 15), 'c_restaurantes', 'Menú del día');
      if ((wd === 5 || wd === 6) && rnd() < 0.45) tx(d, 'expense', between(18, 55), rnd() < 0.6 ? 'c_restaurantes' : 'c_ocio', rnd() < 0.5 ? 'Cena' : 'Plan de finde');
      if (rnd() < 0.09) tx(d, 'expense', between(45, 70), 'c_combustible', 'Gasolina');
      if (rnd() < 0.12) tx(d, 'expense', between(1.5, 12), 'c_transporte', 'Metro / bus');
      if (rnd() < 0.04) tx(d, 'expense', between(25, 120), 'c_ropa', 'Ropa');
      if (rnd() < 0.03) tx(d, 'expense', between(8, 40), 'c_salud', 'Farmacia');
      if (rnd() < 0.02) tx(d, 'expense', between(15, 60), 'c_regalos', 'Regalo');
      if (rnd() < 0.02) tx(d, 'expense', between(20, 250), 'c_tecnologia', 'Tecnología');
      if (rnd() < 0.015) tx(d, 'income', between(30, 200), 'c_ventas', 'Venta Wallapop');
      if (rnd() < 0.02) tx(d, 'income', between(15, 60), 'c_reembolsos', 'Bizum amigos');
      if (day === 3) tx(d, 'expense', between(55, 95), 'c_suministros', 'Luz');
      if (day === 12) tx(d, 'expense', between(25, 40), 'c_suministros', 'Agua');
      if (day === 20 && rnd() < 0.5) tx(d, 'income', between(150, 450), 'c_freelance', 'Proyecto freelance');
    }
    // Recurrentes (generan sus movimientos al arrancar)
    const rec = (name, type, amount, categoryId, day, freq = 'monthly') => {
      const first = U.addMonths(start, 0, day);
      s.recurring.push({ id: U.uid() + name.length, name, type, amount, categoryId, accountId: 'a_banco', freq, interval: 1, startDate: first, nextDate: first, endDate: '', autoAdd: true, active: true });
    };
    rec('Alquiler', 'expense', 650, 'c_vivienda', 1);
    rec('Fibra y móvil', 'expense', 45, 'c_internet', 5);
    rec('Netflix', 'expense', 13.99, 'c_suscripciones', 8);
    rec('Spotify', 'expense', 11.99, 'c_suscripciones', 15);
    rec('Gimnasio', 'expense', 39.9, 'c_deporte', 2);
    rec('Seguro coche', 'expense', 38, 'c_seguros', 10);
    // Nóminas
    for (let i = 5; i >= 0; i--) {
      const date = U.addMonths(U.range('month', today).start, -i, 28);
      if (date > today) continue;
      s.payrolls.push({ id: 'p' + i, date, employer: 'Empresa S.L.', gross: 2850, irpf: 470, ss: 185.25, other: 0, net: 2194.75, accountId: 'a_banco', note: '', extra: false });
    }
    const juneExtra = `${U.parse(today).getFullYear()}-06-30`;
    if (juneExtra >= start && juneExtra <= today) s.payrolls.push({ id: 'pextra', date: juneExtra, employer: 'Empresa S.L.', gross: 2850, irpf: 510, ss: 0, other: 0, net: 2340, accountId: 'a_banco', note: '', extra: true });
    s.payrolls.forEach((p) => {
      const t = { id: 'tx' + p.id, createdAt: Date.now(), type: 'income', amount: p.net, categoryId: 'c_nomina', accountId: 'a_banco', date: p.date, note: `${p.extra ? 'Paga extra' : 'Nómina'} · ${p.employer}`, payrollId: p.id };
      s.transactions.push(t);
      p.transactionId = t.id;
    });
    // Transferencia mensual al ahorro
    for (let i = 5; i >= 0; i--) {
      const date = U.addMonths(U.range('month', today).start, -i, 29);
      if (date <= today) s.transactions.push({ id: 'tr' + i, createdAt: Date.now(), type: 'transfer', amount: 300, accountId: 'a_banco', toAccountId: 'a_ahorro', date, note: 'Ahorro mensual' });
    }
    // Ajuste de saldo de ejemplo (recuento del efectivo de casa)
    s.transactions.push({ id: 'adj1', createdAt: Date.now(), type: 'adjust', amount: -35, accountId: 'a_casa', date: U.addDays(today, -6), note: 'Recuento de efectivo', categoryId: null });
    // Presupuestos
    const budgets = { c_super: 320, c_restaurantes: 180, c_cafe: 45, c_ocio: 120, c_combustible: 110, c_ropa: 80, c_transporte: 40 };
    s.categories.forEach((c) => { if (budgets[c.id]) c.budget = budgets[c.id]; });
    // Metas, deudas, inversiones
    s.goals.push({ id: 'g1', name: 'Fondo de emergencia', target: 9000, deadline: U.addMonths(today, 10), icon: 'shield', createdAt: start, history: [{ id: 'h1', date: start, amount: 4200, note: 'Saldo inicial' }, { id: 'h2', date: U.addMonths(start, 2), amount: 600, note: '' }, { id: 'h3', date: U.addMonths(start, 4), amount: 500, note: '' }] });
    s.goals.push({ id: 'g2', name: 'Viaje a Japón', target: 3500, deadline: U.addMonths(today, 8), icon: 'globe', createdAt: start, history: [{ id: 'h4', date: U.addMonths(start, 1), amount: 900, note: '' }, { id: 'h5', date: U.addMonths(start, 3), amount: 400, note: '' }] });
    s.goals.push({ id: 'g3', name: 'Portátil nuevo', target: 1400, deadline: '', icon: 'monitor', createdAt: start, history: [{ id: 'h6', date: U.addMonths(start, 2), amount: 1050, note: '' }] });
    s.debts.push({ id: 'd1', direction: 'owe', name: 'Préstamo coche', total: 9000, dueDate: U.addYears(today, 3), rate: 6.5, installment: 210, note: '', createdAt: start, payments: [{ id: 'dp1', date: U.addMonths(start, 1), amount: 2100 }, { id: 'dp2', date: U.addMonths(start, 3), amount: 420 }] });
    s.debts.push({ id: 'd2', direction: 'owed', name: 'Carlos (cena cumpleaños)', total: 60, dueDate: '', rate: 0, installment: 0, note: '', createdAt: start, payments: [] });
    s.investments.push({ id: 'i1', name: 'Fondo indexado MSCI World', kind: 'Fondos indexados', invested: 5200, value: 5890.4, note: '', updated: today });
    s.investments.push({ id: 'i2', name: 'Bitcoin', kind: 'Criptomonedas', invested: 800, value: 1012.35, note: '', updated: today });
    s.investments.push({ id: 'i3', name: 'Plan de pensiones', kind: 'Plan de pensiones', invested: 3000, value: 3185, note: '', updated: today });
    return s;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
