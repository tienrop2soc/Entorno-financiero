'use strict';
/* Estado de la app, persistencia en localStorage y consultas/agregados. */
const Store = (() => {
  const KEY = 'entorno-financiero:v1';
  const COLLECTIONS = ['accounts', 'categories', 'transactions', 'recurring', 'payrolls', 'goals', 'debts', 'investments', 'quick'];
  const subs = new Set();
  let state = null;

  const DEFAULT_CATEGORIES = [
    // Gastos
    ['c_super', 'Supermercado', 'expense', 'cart'],
    ['c_restaurantes', 'Restaurantes', 'expense', 'utensils'],
    ['c_cafe', 'Cafés y snacks', 'expense', 'coffee'],
    ['c_vivienda', 'Vivienda', 'expense', 'home'],
    ['c_suministros', 'Luz, agua y gas', 'expense', 'zap'],
    ['c_internet', 'Internet y móvil', 'expense', 'wifi'],
    ['c_transporte', 'Transporte', 'expense', 'car'],
    ['c_combustible', 'Combustible', 'expense', 'droplet'],
    ['c_salud', 'Salud y farmacia', 'expense', 'heart'],
    ['c_deporte', 'Deporte', 'expense', 'activity'],
    ['c_ropa', 'Ropa y calzado', 'expense', 'shirt'],
    ['c_ocio', 'Ocio', 'expense', 'film'],
    ['c_suscripciones', 'Suscripciones', 'expense', 'repeat'],
    ['c_educacion', 'Educación', 'expense', 'cap'],
    ['c_viajes', 'Viajes', 'expense', 'globe'],
    ['c_regalos', 'Regalos', 'expense', 'gift'],
    ['c_mascotas', 'Mascotas', 'expense', 'smile'],
    ['c_hogar', 'Hogar y reparaciones', 'expense', 'tool'],
    ['c_seguros', 'Seguros', 'expense', 'shield'],
    ['c_impuestos', 'Impuestos y tasas', 'expense', 'receipt'],
    ['c_cuidado', 'Cuidado personal', 'expense', 'scissors'],
    ['c_tecnologia', 'Tecnología', 'expense', 'monitor'],
    ['c_deudas', 'Deudas y préstamos', 'expense', 'card'],
    ['c_comisiones', 'Comisiones bancarias', 'expense', 'bank'],
    ['c_otros_g', 'Otros gastos', 'expense', 'more'],
    // Ingresos
    ['c_nomina', 'Nómina', 'income', 'briefcase'],
    ['c_freelance', 'Freelance', 'income', 'layers'],
    ['c_ventas', 'Ventas', 'income', 'tag'],
    ['c_inversiones', 'Rendimientos', 'income', 'trendingUp'],
    ['c_alquiler_in', 'Alquileres', 'income', 'home'],
    ['c_regalos_in', 'Regalos recibidos', 'income', 'gift'],
    ['c_reembolsos', 'Reembolsos', 'income', 'rotate'],
    ['c_intereses', 'Intereses', 'income', 'percent'],
    ['c_cobros', 'Cobros de deudas', 'income', 'users'],
    ['c_otros_i', 'Otros ingresos', 'income', 'more'],
  ];

  function defaultState() {
    return {
      version: 1,
      settings: { currency: 'EUR', locale: 'es-ES', theme: 'auto', weekStart: 1, name: '', monthlyBudget: 0 },
      accounts: [
        { id: 'a_banco', name: 'Cuenta principal', type: 'banco', initial: 0 },
        { id: 'a_efectivo', name: 'Cartera', type: 'efectivo', initial: 0, place: 'Lo que llevo encima' },
        { id: 'a_ahorro', name: 'Cuenta ahorro', type: 'ahorro', initial: 0 },
      ],
      categories: DEFAULT_CATEGORIES.map(([id, name, type, ic]) => ({ id, name, type, icon: ic, budget: 0 })),
      transactions: [],
      recurring: [],
      payrolls: [],
      goals: [],
      debts: [],
      investments: [],
      quick: [
        { id: 'q1', label: 'Café', amount: 1.5, categoryId: 'c_cafe', type: 'expense' },
        { id: 'q2', label: 'Menú del día', amount: 12, categoryId: 'c_restaurantes', type: 'expense' },
        { id: 'q3', label: 'Súper', amount: 0, categoryId: 'c_super', type: 'expense' },
        { id: 'q4', label: 'Gasolina', amount: 0, categoryId: 'c_combustible', type: 'expense' },
        { id: 'q5', label: 'Transporte', amount: 0, categoryId: 'c_transporte', type: 'expense' },
      ],
    };
  }

  function migrate(s) {
    const d = defaultState();
    const out = { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
    COLLECTIONS.forEach((k) => { if (!Array.isArray(out[k])) out[k] = d[k]; });
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? migrate(JSON.parse(raw)) : defaultState();
    } catch (e) {
      state = defaultState();
    }
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      if (typeof UI !== 'undefined') UI.toast('No se pudo guardar en este navegador. Exporta una copia desde Ajustes.');
    }
  }
  function commit() {
    persist();
    subs.forEach((f) => f());
  }
  const subscribe = (f) => subs.add(f);

  /* ---------- CRUD genérico ---------- */
  function add(col, item) {
    item.id = item.id || U.uid();
    if (col === 'transactions' && !item.createdAt) item.createdAt = Date.now();
    state[col].push(item);
    commit();
    return item;
  }
  function update(col, id, patch) {
    const it = state[col].find((x) => x.id === id);
    if (it) Object.assign(it, patch);
    commit();
    return it;
  }
  function remove(col, id) {
    const i = state[col].findIndex((x) => x.id === id);
    const removed = i >= 0 ? state[col].splice(i, 1)[0] : null;
    commit();
    return removed;
  }
  const get = (col, id) => state[col].find((x) => x.id === id);
  function batch(fn) {
    fn(state);
    commit();
  }
  function replaceAll(newState) {
    state = migrate(newState);
    commit();
  }
  function reset() {
    state = defaultState();
    commit();
  }

  /* ---------- Consultas ---------- */
  const cat = (id) => state.categories.find((c) => c.id === id) || { id, name: 'Sin categoría', icon: 'tag', type: 'expense', budget: 0 };
  const account = (id) => state.accounts.find((a) => a.id === id);
  const cats = (type) => state.categories.filter((c) => c.type === type);

  function ensureCategory(id, name, type, ic) {
    let c = state.categories.find((x) => x.id === id) || state.categories.find((x) => x.type === type && x.name === name);
    if (!c) {
      c = { id, name, type, icon: ic, budget: 0 };
      state.categories.push(c);
    }
    return c.id;
  }

  const inRange = (t, r) => t.date >= r.start && t.date <= r.end;
  const txIn = (r, type) => state.transactions.filter((t) => inRange(t, r) && (!type || t.type === type));

  function totals(r) {
    let income = 0, expense = 0, count = 0;
    for (const t of state.transactions) {
      if (!inRange(t, r)) continue;
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else continue;
      count++;
    }
    return { income: U.round2(income), expense: U.round2(expense), net: U.round2(income - expense), count };
  }

  function byCategory(r, type) {
    const map = new Map();
    for (const t of state.transactions) {
      if (t.type !== type || !inRange(t, r)) continue;
      const e = map.get(t.categoryId) || { cat: cat(t.categoryId), total: 0, count: 0 };
      e.total += t.amount;
      e.count++;
      map.set(t.categoryId, e);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  /* Totales agrupados por día (clave YYYY-MM-DD) o por mes (clave YYYY-MM). */
  function series(r, unit) {
    const map = {};
    for (const t of state.transactions) {
      if (!inRange(t, r) || (t.type !== 'income' && t.type !== 'expense')) continue;
      const k = unit === 'month' ? t.date.slice(0, 7) : t.date;
      const e = map[k] || (map[k] = { income: 0, expense: 0 });
      e[t.type] += t.amount;
    }
    return map;
  }

  function accountBalance(id) {
    const a = account(id);
    let b = a ? +a.initial || 0 : 0;
    for (const t of state.transactions) {
      if (t.type === 'income' && t.accountId === id) b += t.amount;
      else if (t.type === 'expense' && t.accountId === id) b -= t.amount;
      else if (t.type === 'adjust' && t.accountId === id) b += t.amount;
      else if (t.type === 'transfer') {
        if (t.accountId === id) b -= t.amount;
        if (t.toAccountId === id) b += t.amount;
      }
    }
    return U.round2(b);
  }
  const totalBalance = (filter = () => true) => U.round2(U.sum(state.accounts.filter((a) => !a.archived && filter(a)), (a) => accountBalance(a.id)));
  const isCash = (a) => a.type === 'efectivo';

  const debtPaid = (d) => U.round2(U.sum(d.payments || [], (p) => p.amount));
  const debtLeft = (d) => U.round2(Math.max(0, d.total - debtPaid(d)));
  const goalSaved = (g) => U.round2(U.sum(g.history || [], (h) => h.amount));

  function netWorth() {
    const inv = U.sum(state.investments, (i) => i.value);
    const owe = U.sum(state.debts.filter((d) => d.direction === 'owe'), debtLeft);
    const owed = U.sum(state.debts.filter((d) => d.direction === 'owed'), debtLeft);
    return { accounts: totalBalance(), banks: totalBalance((a) => !isCash(a)), cash: totalBalance(isCash), investments: U.round2(inv), owe: U.round2(owe), owed: U.round2(owed), total: U.round2(totalBalance() + inv + owed - owe) };
  }

  /* Uso de categorías en los últimos 120 días, para ordenarlas en el alta rápida. */
  function categoryUsage(type) {
    const from = U.addDays(U.today(), -120);
    const m = {};
    for (const t of state.transactions) if (t.type === type && t.date >= from) m[t.categoryId] = (m[t.categoryId] || 0) + 1;
    return m;
  }

  /* ---------- Recurrentes ---------- */
  function nextOccurrence(r, from) {
    const n = Math.max(1, +r.interval || 1);
    const anchor = U.parse(r.startDate).getDate();
    switch (r.freq) {
      case 'daily': return U.addDays(from, n);
      case 'weekly': return U.addDays(from, 7 * n);
      case 'yearly': return U.addYears(from, n, anchor);
      case 'monthly':
      default: return U.addMonths(from, n, anchor);
    }
  }
  /* Primera fecha de la serie que cae hoy o después. */
  function firstUpcoming(r) {
    let d = r.startDate;
    const t = U.today();
    let guard = 0;
    while (d < t && guard++ < 5000) d = nextOccurrence(r, d);
    return d;
  }
  function recurringToTx(r, date) {
    return {
      id: U.uid(), createdAt: Date.now(), type: r.type, amount: r.amount, categoryId: r.categoryId,
      accountId: r.accountId, date, note: r.name, recurringId: r.id,
    };
  }
  /* Genera los movimientos de los recurrentes automáticos que ya han vencido. */
  function processRecurring() {
    const t = U.today();
    let created = 0;
    for (const r of state.recurring) {
      if (!r.active || !r.autoAdd || !r.nextDate) continue;
      let guard = 0;
      while (r.nextDate <= t && (!r.endDate || r.nextDate <= r.endDate) && guard++ < 400) {
        state.transactions.push(recurringToTx(r, r.nextDate));
        r.nextDate = nextOccurrence(r, r.nextDate);
        created++;
      }
    }
    if (created) commit();
    return created;
  }
  function registerRecurringNow(id) {
    const r = get('recurring', id);
    if (!r) return;
    state.transactions.push(recurringToTx(r, r.nextDate <= U.today() ? r.nextDate : U.today()));
    r.nextDate = nextOccurrence(r, r.nextDate);
    commit();
  }
  /* Importe mensual equivalente de un recurrente. */
  function monthlyEquivalent(r) {
    const n = Math.max(1, +r.interval || 1);
    const f = { daily: 365 / 12, weekly: 52 / 12, monthly: 1, yearly: 1 / 12 }[r.freq] || 1;
    return (r.amount * f) / n;
  }
  /* Próximas ocurrencias (todas las series activas) en los próximos N días. */
  function upcoming(days = 30) {
    const t = U.today(), end = U.addDays(t, days);
    const out = [];
    for (const r of state.recurring) {
      if (!r.active || !r.nextDate) continue;
      let d = r.nextDate, guard = 0;
      while (d <= end && (!r.endDate || d <= r.endDate) && guard++ < 60) {
        out.push({ r, date: d });
        d = nextOccurrence(r, d);
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  /* Proyección de gasto al cierre del periodo: lo variable se extrapola por días,
     lo recurrente se cuenta una vez y se suman los cargos fijos que faltan. */
  function projectExpense(r, catFilter = null) {
    const t = U.today();
    const ok = (catId) => !catFilter || catFilter(catId);
    const exps = txIn(r, 'expense').filter((x) => ok(x.categoryId));
    const fixed = U.sum(exps.filter((x) => x.recurringId), (x) => x.amount);
    const variable = U.sum(exps.filter((x) => !x.recurringId), (x) => x.amount);
    const elapsed = U.elapsedDays(r), total = U.daysIn(r);
    if (!elapsed) return null;
    let pending = 0;
    for (const rec of state.recurring) {
      if (!rec.active || rec.type !== 'expense' || !rec.nextDate || !ok(rec.categoryId)) continue;
      let d = rec.nextDate, guard = 0;
      while (d <= r.end && (!rec.endDate || d <= rec.endDate) && guard++ < 400) {
        if (d > t && d >= r.start) pending += rec.amount;
        d = nextOccurrence(rec, d);
      }
    }
    return U.round2(fixed + (variable / elapsed) * total + pending);
  }

  /* ---------- Nóminas (crean/actualizan su ingreso asociado) ---------- */
  function savePayroll(p) {
    batch((s) => {
      const catId = ensureCategory('c_nomina', 'Nómina', 'income', 'briefcase');
      let rec = p.id && s.payrolls.find((x) => x.id === p.id);
      if (rec) Object.assign(rec, p);
      else {
        rec = { ...p, id: U.uid() };
        s.payrolls.push(rec);
      }
      const data = {
        type: 'income', amount: rec.net, categoryId: catId, accountId: rec.accountId, date: rec.date,
        note: `${rec.extra ? 'Paga extra' : 'Nómina'}${rec.employer ? ' · ' + rec.employer : ''}`, payrollId: rec.id,
      };
      let tx = rec.transactionId && s.transactions.find((t) => t.id === rec.transactionId);
      if (tx) Object.assign(tx, data);
      else {
        tx = { id: U.uid(), createdAt: Date.now(), ...data };
        s.transactions.push(tx);
        rec.transactionId = tx.id;
      }
    });
  }
  function deletePayroll(id) {
    batch((s) => {
      const p = s.payrolls.find((x) => x.id === id);
      if (!p) return;
      s.transactions = s.transactions.filter((t) => t.id !== p.transactionId && t.payrollId !== id);
      s.payrolls = s.payrolls.filter((x) => x.id !== id);
    });
  }

  /* ---------- Pagos de deudas ---------- */
  function addDebtPayment(debtId, { amount, date, register, accountId, note }) {
    batch((s) => {
      const d = s.debts.find((x) => x.id === debtId);
      if (!d) return;
      const pay = { id: U.uid(), amount, date, note: note || '' };
      if (register) {
        const owe = d.direction === 'owe';
        const catId = owe
          ? ensureCategory('c_deudas', 'Deudas y préstamos', 'expense', 'card')
          : ensureCategory('c_cobros', 'Cobros de deudas', 'income', 'users');
        const tx = {
          id: U.uid(), createdAt: Date.now(), type: owe ? 'expense' : 'income', amount, categoryId: catId,
          accountId, date, note: `${owe ? 'Pago a' : 'Cobro de'} ${d.name}`, debtId: d.id,
        };
        s.transactions.push(tx);
        pay.txId = tx.id;
      }
      d.payments = d.payments || [];
      d.payments.push(pay);
    });
  }
  function deleteDebtPayment(debtId, payId) {
    batch((s) => {
      const d = s.debts.find((x) => x.id === debtId);
      if (!d) return;
      const p = (d.payments || []).find((x) => x.id === payId);
      if (p && p.txId) s.transactions = s.transactions.filter((t) => t.id !== p.txId);
      d.payments = (d.payments || []).filter((x) => x.id !== payId);
    });
  }

  /* Elimina una categoría reasignando sus movimientos a "Otros". */
  function deleteCategory(id) {
    batch((s) => {
      const c = s.categories.find((x) => x.id === id);
      if (!c) return;
      const fallback = c.type === 'expense'
        ? ensureCategory('c_otros_g', 'Otros gastos', 'expense', 'more')
        : ensureCategory('c_otros_i', 'Otros ingresos', 'income', 'more');
      if (fallback === id) return;
      s.transactions.forEach((t) => { if (t.categoryId === id) t.categoryId = fallback; });
      s.recurring.forEach((r) => { if (r.categoryId === id) r.categoryId = fallback; });
      s.quick.forEach((q) => { if (q.categoryId === id) q.categoryId = fallback; });
      s.categories = s.categories.filter((x) => x.id !== id);
    });
  }
  const accountTxCount = (id) => state.transactions.filter((t) => t.accountId === id || t.toAccountId === id).length;

  /* Cambia el saldo de una cuenta sin contar como gasto ni ingreso. */
  function adjustBalance(accountId, delta, { date, note } = {}) {
    delta = U.round2(delta);
    if (!delta) return null;
    return add('transactions', { type: 'adjust', amount: delta, accountId, date: date || U.today(), note: note || '', categoryId: null });
  }

  /* Elimina la cuenta y todos sus movimientos (también nóminas ligadas a ellos). */
  function deleteAccountHard(id) {
    batch((s) => {
      const fallback = (s.accounts.find((a) => a.id !== id && !a.archived) || {}).id;
      const removed = new Set(s.transactions.filter((t) => t.accountId === id || t.toAccountId === id).map((t) => t.id));
      s.transactions = s.transactions.filter((t) => !removed.has(t.id));
      s.payrolls = s.payrolls.filter((p) => !removed.has(p.transactionId));
      s.debts.forEach((d) => (d.payments || []).forEach((p) => { if (removed.has(p.txId)) delete p.txId; }));
      s.recurring.forEach((r) => { if (r.accountId === id) r.accountId = fallback; });
      if (s.settings.lastAccount === id) s.settings.lastAccount = fallback;
      s.accounts = s.accounts.filter((a) => a.id !== id);
    });
  }

  function deleteAccount(id) {
    const used = state.transactions.some((t) => t.accountId === id || t.toAccountId === id);
    if (used) update('accounts', id, { archived: true });
    else remove('accounts', id);
    return used;
  }

  return {
    get state() { return state; },
    load, persist, commit, subscribe, add, update, remove, get, batch, replaceAll, reset, defaultState,
    cat, account, cats, ensureCategory, txIn, totals, byCategory, series, accountBalance, totalBalance,
    debtPaid, debtLeft, goalSaved, netWorth, categoryUsage,
    nextOccurrence, firstUpcoming, projectExpense, processRecurring, registerRecurringNow, monthlyEquivalent, upcoming,
    savePayroll, deletePayroll, addDebtPayment, deleteDebtPayment, deleteCategory, deleteAccount,
    accountTxCount, adjustBalance, deleteAccountHard, isCash,
  };
})();
