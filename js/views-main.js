'use strict';
/* Vistas principales: Resumen, Movimientos, Gastos, Ingresos, Calendario e Informes. */
const Views = {};

(() => {
  const S = () => Store.state;
  const ws = () => S().settings.weekStart;
  const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${U.money(Math.abs(n))}`;

  function greeting() {
    const h = new Date().getHours();
    const g = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
    const n = S().settings.name;
    return n ? `${g}, ${U.esc(n)}` : g;
  }

  /* Indicadores derivados de un periodo: medias, proyección, extremos. */
  function insights(r, type) {
    const tot = Store.totals(r);
    const elapsed = U.elapsedDays(r) || U.daysIn(r);
    const total = U.daysIn(r);
    const exps = Store.txIn(r, 'expense');
    const biggest = exps.reduce((a, t) => (!a || t.amount > a.amount ? t : a), null);
    const byDay = {};
    exps.forEach((t) => { byDay[t.date] = (byDay[t.date] || 0) + t.amount; });
    const topDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    const includesToday = U.today() >= r.start && U.today() <= r.end;
    return {
      tot, elapsed, total, biggest, topDay, includesToday,
      avgExpense: tot.expense / elapsed,
      avgIncome: tot.income / elapsed,
      projection: includesToday && type !== 'day' ? Store.projectExpense(r) : null,
    };
  }

  /* ================= RESUMEN ================= */
  Views.resumen = () => {
    const s = S(), p = App.period, t = U.today();
    const r = U.range(p.type, p.ref, ws());
    const prevR = U.range(p.type, U.shift(p.type, p.ref, -1), ws());
    const cur = Store.totals(r), prev = Store.totals(prevR);
    const ins = insights(r, p.type);
    const rate = cur.income ? cur.net / cur.income : NaN;
    const cats = Store.byCategory(r, 'expense');
    const recent = [...s.transactions].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 7);
    const up = Store.upcoming(21).slice(0, 5);
    const nw = Store.netWorth();
    const series = [{ name: 'Ingresos' }, { name: 'Gastos' }];

    const snaps = [['Hoy', 'day'], ['Semana', 'week'], ['Mes', 'month'], ['Año', 'year']].map(([label, type]) => {
      const tt = Store.totals(U.range(type, t, ws()));
      return `<button class="snap glass ${p.type === type && U.range(type, p.ref, ws()).start === U.range(type, t, ws()).start ? 'active' : ''}" data-action="snap" data-type="${type}">
        <span class="snap-l">${label}</span>
        <span class="snap-v tnum">${tt.expense ? '−' : ''}${U.money0(tt.expense)}</span>
        <span class="snap-s tnum"><span>+${U.money0(tt.income)}</span><span>${signed(tt.net)}</span></span>
      </button>`;
    }).join('');

    const html = `
      <section class="hello">
        <div>
          <p class="eyebrow">${U.esc(U.cap(new Intl.DateTimeFormat(s.settings.locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())))}</p>
          <h2 class="hello-t">${greeting()}</h2>
        </div>
        <div class="hello-nw glass-pill" data-tip="${U.esc(`<b>Patrimonio neto</b><div class='tt-row'>Cuentas<span>${U.money(nw.accounts)}</span></div><div class='tt-row'>Inversiones<span>${U.money(nw.investments)}</span></div><div class='tt-row'>Me deben<span>${U.money(nw.owed)}</span></div><div class='tt-row'>Debo<span>−${U.money(nw.owe)}</span></div>`)}">
          <span class="muted">Patrimonio</span><b class="tnum">${U.money(nw.total)}</b>
        </div>
      </section>

      <p class="label-row">Gastos de un vistazo <span class="muted">· ingresos y balance debajo</span></p>
      <section class="snaps">${snaps}</section>

      ${H.periodControl()}

      <section class="grid g-4">
        <div class="card glass">${H.stat('Ingresos', U.money(cur.income), H.delta(cur.income, prev.income))}</div>
        <div class="card glass">${H.stat('Gastos', U.money(cur.expense), H.delta(cur.expense, prev.expense, { invert: true }))}</div>
        <div class="card glass">${H.stat('Balance', signed(cur.net), H.delta(cur.net, prev.net))}</div>
        <div class="card glass">${H.stat('Tasa de ahorro', U.pct(rate), `<span class="delta muted">${cur.count} movimientos</span>`)}</div>
      </section>

      <section class="grid g-main">
        <div class="card glass">
          ${H.sectionHead('Evolución', Charts.legend(series))}
          <div class="chart-box" data-chart="main"></div>
        </div>
        <div class="card glass">
          ${H.sectionHead('Gastos por categoría', `<button class="link" data-action="go" data-route="gastos">Ver todo</button>`)}
          ${H.catBars(cats, cur.expense, { limit: 6 })}
        </div>
      </section>

      <section class="card glass quick-card">
        ${H.sectionHead('Añadir rápido', `<button class="link" data-action="go" data-route="ajustes" data-anchor="quick">Editar</button>`)}
        <div class="quick-row">
          ${s.quick.map((q) => `<button class="qbtn" data-action="fav" data-id="${q.id}">
            <span class="q-ic">${icon(Store.cat(q.categoryId).icon, 18)}</span>
            <span class="q-l">${U.esc(q.label)}</span>
            <span class="q-a tnum">${q.amount ? U.money(q.amount) : 'Importe…'}</span>
          </button>`).join('')}
          <button class="qbtn ghost" data-action="add" data-type="expense"><span class="q-ic">${icon('minus', 18)}</span><span class="q-l">Gasto</span><span class="q-a">Otro</span></button>
          <button class="qbtn ghost" data-action="add" data-type="income"><span class="q-ic">${icon('plus', 18)}</span><span class="q-l">Ingreso</span><span class="q-a">Otro</span></button>
        </div>
      </section>

      <section class="grid g-main">
        <div class="card glass">
          ${H.sectionHead('Últimos movimientos', `<button class="link" data-action="go" data-route="movimientos">Ver todos</button>`)}
          ${recent.length ? `<div class="tx-list">${recent.map((x) => H.txRow(x, { showDate: true })).join('')}</div>`
            : H.empty('Aún no hay movimientos. Pulsa <b>+</b> para añadir tu primer gasto o ingreso.', `<button class="btn" data-action="loadDemo">Ver con datos de ejemplo</button>`)}
        </div>
        <div class="stack">
          <div class="card glass">
            ${H.sectionHead('Análisis del periodo')}
            <div class="kvs">
              <div class="kv"><span>Gasto medio diario</span><b class="tnum">${U.money(ins.avgExpense)}</b></div>
              <div class="kv"><span>Ingreso medio diario</span><span class="tnum">${U.money(ins.avgIncome)}</span></div>
              ${ins.projection != null ? `<div class="kv"><span>Proyección de gasto al cierre</span><span class="tnum">${U.money(ins.projection)}</span></div>` : ''}
              <div class="kv"><span>Mayor gasto</span><span class="tnum">${ins.biggest ? `${U.esc(H.txTitle(ins.biggest))} · ${U.money(ins.biggest.amount)}` : '—'}</span></div>
              ${p.type !== 'day' ? `<div class="kv"><span>Día de más gasto</span><span class="tnum">${ins.topDay ? `${U.esc(U.dayLabel(ins.topDay[0]))} · ${U.money(ins.topDay[1])}` : '—'}</span></div>` : ''}
              <div class="kv"><span>Categoría principal</span><span>${cats[0] ? U.esc(cats[0].cat.name) : '—'}</span></div>
            </div>
          </div>
          <div class="card glass">
            ${H.sectionHead('Próximos cargos', `<button class="link" data-action="go" data-route="recurrentes">Gestionar</button>`)}
            ${up.length ? `<div class="mini-list">${up.map((u) => `<div class="mini"><span class="cat-ic">${icon(Store.cat(u.r.categoryId).icon, 16)}</span><span class="mini-main"><b>${U.esc(u.r.name)}</b><small>${U.esc(U.dayLabel(u.date))}</small></span><span class="tnum">${u.r.type === 'income' ? '+' : '−'}${U.money(u.r.amount)}</span></div>`).join('')}</div>`
              : `<p class="muted small">Sin cargos fijos próximos. Añade alquiler, suscripciones o tu sueldo en <button class="link" data-action="go" data-route="recurrentes">Recurrentes</button>.</p>`}
          </div>
          <div class="card glass">
            ${H.sectionHead('Cuentas', `<button class="link" data-action="go" data-route="cuentas">Ver</button>`)}
            <div class="mini-list">${s.accounts.filter((a) => !a.archived).map((a) => `<div class="mini"><span class="cat-ic">${icon(ACCOUNT_ICONS[a.type] || 'wallet', 16)}</span><span class="mini-main"><b>${U.esc(a.name)}</b></span><span class="tnum">${U.money(Store.accountBalance(a.id))}</span></div>`).join('')}</div>
          </div>
        </div>
      </section>`;

    return {
      html,
      after: () => Charts.bars(UI.$('[data-chart="main"]'), Charts.periodSeries(p.type, p.ref, ws()), series, { aria: 'Ingresos y gastos del periodo' }),
      actions: {
        snap: (el) => { App.setPeriod(el.dataset.type, U.today()); },
      },
    };
  };

  /* ================= GASTOS / INGRESOS ================= */
  function flowView(type) {
    const p = App.period;
    const r = U.range(p.type, p.ref, ws());
    const prevR = U.range(p.type, U.shift(p.type, p.ref, -1), ws());
    const isExp = type === 'expense';
    const all = Store.txIn(r, type);
    const total = U.sum(all, (t) => t.amount);
    const prevTotal = U.sum(Store.txIn(prevR, type), (t) => t.amount);
    const cats = Store.byCategory(r, type);
    const filter = App.catFilter[type];
    const list = filter ? all.filter((t) => t.categoryId === filter) : all;
    const ins = insights(r, p.type);
    const biggest = all.reduce((a, t) => (!a || t.amount > a.amount ? t : a), null);
    const avg = total / (ins.elapsed || 1);
    const label = isExp ? 'gasto' : 'ingreso';
    const seriesDef = [{ name: isExp ? 'Gastos' : 'Ingresos' }];

    let budgetCard = '';
    if (isExp && p.type === 'month') {
      const budget = S().settings.monthlyBudget || U.sum(Store.cats('expense'), (c) => c.budget || 0);
      if (budget) budgetCard = `<div class="card glass">${H.stat('Presupuesto del mes', `${U.pct(total / budget)}`, `${H.progress(total / budget, { over: total > budget })}<span class="delta muted">${U.money(total)} de ${U.money(budget)}</span>`)}</div>`;
    }

    const html = `
      ${H.periodControl(`<button class="btn btn-primary" data-action="add" data-type="${type}">${icon('plus', 18)} Añadir ${label}</button>`)}
      <section class="grid g-4">
        <div class="card glass">${H.stat(`Total ${isExp ? 'gastado' : 'ingresado'}`, U.money(total), H.delta(total, prevTotal, { invert: isExp }))}</div>
        <div class="card glass">${H.stat('Media diaria', U.money(avg), `<span class="delta muted">${p.type === 'year' ? `${U.money(total / 12)} / mes` : `${U.money(avg * 7)} / semana`}</span>`)}</div>
        <div class="card glass">${H.stat(`Mayor ${label}`, biggest ? U.money(biggest.amount) : '—', `<span class="delta muted ellip">${biggest ? U.esc(H.txTitle(biggest)) : 'Sin datos'}</span>`)}</div>
        ${budgetCard || `<div class="card glass">${H.stat('Movimientos', String(all.length), `<span class="delta muted">${all.length ? U.money(total / all.length) + ' de media' : '—'}</span>`)}</div>`}
      </section>
      <section class="grid g-main">
        <div class="card glass">
          ${H.sectionHead(isExp ? 'Gasto en el tiempo' : 'Ingresos en el tiempo')}
          <div class="chart-box" data-chart="flow"></div>
        </div>
        <div class="card glass">
          ${H.sectionHead('Por categoría', filter ? `<button class="link" data-action="clearCat" data-type="${type}">Quitar filtro</button>` : '<span class="muted small">Pulsa para filtrar</span>')}
          ${H.catBars(cats, total, { type })}
        </div>
      </section>
      <section class="card glass">
        ${H.sectionHead(filter ? `${U.esc(Store.cat(filter).name)} · ${U.money(U.sum(list, (t) => t.amount))}` : `Todos los ${isExp ? 'gastos' : 'ingresos'}`)}
        ${list.length ? H.txGroups(list) : H.empty(`No hay ${isExp ? 'gastos' : 'ingresos'} en este periodo.`, `<button class="btn" data-action="add" data-type="${type}">${icon('plus', 18)} Añadir ${label}</button>`)}
      </section>`;
    return {
      html,
      after: () => {
        const data = Charts.periodSeries(p.type, p.ref, ws()).map((d) => ({ ...d, values: [isExp ? d.values[1] : d.values[0]] }));
        Charts.bars(UI.$('[data-chart="flow"]'), data, seriesDef, { aria: seriesDef[0].name });
      },
      actions: {
        clearCat: (el) => { App.catFilter[el.dataset.type] = null; App.render(); },
      },
    };
  }
  Views.gastos = () => flowView('expense');
  Views.ingresos = () => flowView('income');

  /* ================= MOVIMIENTOS ================= */
  const movFilter = { q: '', type: 'all', cat: '', acc: '', all: false, limit: 300 };
  function movFiltered() {
    const p = App.period;
    const r = U.range(p.type, p.ref, ws());
    const q = movFilter.q.toLowerCase();
    return S().transactions.filter((t) => {
      if (!movFilter.all && (t.date < r.start || t.date > r.end)) return false;
      if (movFilter.type !== 'all' && t.type !== movFilter.type) return false;
      if (movFilter.cat && t.categoryId !== movFilter.cat) return false;
      if (movFilter.acc && t.accountId !== movFilter.acc && t.toAccountId !== movFilter.acc) return false;
      if (q) {
        const hay = `${t.note || ''} ${t.type === 'transfer' ? 'transferencia' : Store.cat(t.categoryId).name} ${(Store.account(t.accountId) || {}).name || ''} ${String(t.amount).replace('.', ',')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }
  function movListHtml() {
    const list = movFiltered();
    const inc = U.sum(list.filter((t) => t.type === 'income'), (t) => t.amount);
    const exp = U.sum(list.filter((t) => t.type === 'expense'), (t) => t.amount);
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    const shown = sorted.slice(0, movFilter.limit);
    return {
      summary: `<span><b>${list.length}</b> movimientos</span><span>Ingresos <b class="tnum">${U.money(inc)}</b></span><span>Gastos <b class="tnum">${U.money(exp)}</b></span><span>Balance <b class="tnum">${signed(inc - exp)}</b></span>`,
      list: list.length
        ? H.txGroups(shown) + (sorted.length > shown.length ? `<div class="center"><button class="btn" data-action="movMore">Mostrar más (${sorted.length - shown.length})</button></div>` : '')
        : H.empty('No hay movimientos con estos filtros.'),
    };
  }
  function refreshMov() {
    const { summary, list } = movListHtml();
    const a = UI.$('#movSummary'), b = UI.$('#movList');
    if (a) a.innerHTML = summary;
    if (b) b.innerHTML = list;
  }
  Views.movimientos = () => {
    const { summary, list } = movListHtml();
    const catOpts = [{ value: '', label: 'Todas las categorías' }, ...Store.cats('expense').map((c) => ({ value: c.id, label: `Gasto · ${c.name}` })), ...Store.cats('income').map((c) => ({ value: c.id, label: `Ingreso · ${c.name}` }))];
    const accOpts = [{ value: '', label: 'Todas las cuentas' }, ...UI.accountOptions(true)];
    const html = `
      ${movFilter.all ? `<div class="period"><div class="glass-pill all-pill">${icon('clock', 16)} Todo el historial</div><button class="btn" data-action="movAll">Filtrar por periodo</button></div>`
        : H.periodControl(`<button class="btn" data-action="movAll">Ver todo</button>`)}
      <section class="card glass filters">
        <label class="search">${icon('search', 18)}<input class="input" type="search" placeholder="Buscar por nota, categoría, cuenta o importe" value="${U.esc(movFilter.q)}" data-input="movSearch" aria-label="Buscar"></label>
        <div class="filter-row">
          ${UI.seg('movType', [{ value: 'all', label: 'Todos' }, { value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Ingresos' }, { value: 'transfer', label: 'Transf.' }], movFilter.type, 'movType')}
          ${UI.select('movCat', catOpts, movFilter.cat, 'data-change="movCat" aria-label="Categoría"')}
          ${UI.select('movAcc', accOpts, movFilter.acc, 'data-change="movAcc" aria-label="Cuenta"')}
          <button class="btn" data-action="exportCsv">${icon('download', 18)} CSV</button>
        </div>
        <div class="mov-summary" id="movSummary">${summary}</div>
      </section>
      <section class="card glass" id="movList">${list}</section>`;
    return {
      html,
      actions: {
        movType: (el) => { movFilter.type = el.dataset.value; App.render(); },
        movAll: () => { movFilter.all = !movFilter.all; App.render(); },
        movMore: () => { movFilter.limit += 300; refreshMov(); },
        exportCsv: () => App.exportCsv(movFiltered(), 'movimientos'),
      },
      inputs: { movSearch: (el) => { movFilter.q = el.value; movFilter.limit = 300; refreshMov(); } },
      changes: {
        movCat: (el) => { movFilter.cat = el.value; refreshMov(); },
        movAcc: (el) => { movFilter.acc = el.value; refreshMov(); },
      },
    };
  };

  /* ================= CALENDARIO ================= */
  Views.calendario = () => {
    const ref = App.period.ref;
    const d0 = U.parse(ref);
    const r = U.range('month', ref);
    const m = Store.series(r, 'day');
    const t = U.today();
    if (!App.calDay || App.calDay < r.start || App.calDay > r.end) App.calDay = t >= r.start && t <= r.end ? t : r.start;
    const max = Math.max(1, ...Object.values(m).map((e) => e.expense));
    const startOffset = (U.parse(r.start).getDay() - ws() + 7) % 7;
    const nDays = U.daysIn(r);
    const heads = Array.from({ length: 7 }, (_, i) => U.weekdayShort(U.addDays('2024-01-07', ws() + i)));
    const tot = Store.totals(r);
    const elapsed = U.elapsedDays(r);
    let noSpend = 0;
    for (let i = 0; i < elapsed; i++) if (!(m[U.addDays(r.start, i)] || {}).expense) noSpend++;

    let cells = '';
    for (let i = 0; i < startOffset; i++) cells += '<span class="cal-cell pad"></span>';
    for (let i = 0; i < nDays; i++) {
      const d = U.addDays(r.start, i);
      const e = m[d] || { income: 0, expense: 0 };
      const k = e.expense ? Math.sqrt(e.expense / max) : 0;
      const lvl = e.expense ? Math.max(1, Math.ceil(k * 5)) : 0;
      cells += `<button class="cal-cell lvl${lvl} ${d === t ? 'today' : ''} ${d === App.calDay ? 'sel' : ''} ${d > t ? 'future' : ''}" data-action="calDay" data-date="${d}"
        data-tip="${U.esc(`<b>${U.esc(U.dayLabel(d, true))}</b><div class='tt-row'>Gastos<span>${U.money(e.expense)}</span></div><div class='tt-row'>Ingresos<span>${U.money(e.income)}</span></div>`)}">
        <span class="cal-n">${i + 1}</span>
        ${e.expense ? `<span class="cal-v tnum">−${U.short(e.expense)}</span>` : ''}
        ${e.income ? `<span class="cal-dot" aria-label="Con ingresos"></span>` : ''}
      </button>`;
    }
    const dayTx = Store.txIn({ start: App.calDay, end: App.calDay });
    const dt = Store.totals({ start: App.calDay, end: App.calDay });
    const html = `
      <div class="period">
        <div class="period-nav glass-pill">
          <button class="icon-btn" data-action="calPrev" aria-label="Mes anterior">${icon('chevL')}</button>
          <button class="period-label" data-action="calToday">${U.monthName(d0.getMonth())} ${d0.getFullYear()}</button>
          <button class="icon-btn" data-action="calNext" aria-label="Mes siguiente">${icon('chevR')}</button>
        </div>
      </div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Gastos del mes', U.money(tot.expense))}</div>
        <div class="card glass">${H.stat('Ingresos del mes', U.money(tot.income))}</div>
        <div class="card glass">${H.stat('Media diaria', U.money(tot.expense / (elapsed || nDays)))}</div>
        <div class="card glass">${H.stat('Días sin gastar', String(noSpend), `<span class="delta muted">de ${elapsed || nDays} días</span>`)}</div>
      </section>
      <section class="grid g-main">
        <div class="card glass">
          ${H.sectionHead('Mapa de gasto diario', `<div class="legend"><span><i class="sw lvl1"></i>Menos</span><span><i class="sw lvl5"></i>Más</span><span><i class="cal-dot static"></i>Ingreso</span></div>`)}
          <div class="cal-grid">${heads.map((h) => `<span class="cal-h">${h}</span>`).join('')}${cells}</div>
        </div>
        <div class="card glass">
          ${H.sectionHead(U.esc(U.dayLabel(App.calDay, true)), `<button class="btn btn-sm" data-action="addOnDay">${icon('plus', 16)} Añadir</button>`)}
          <div class="kvs"><div class="kv"><span>Gastos</span><b class="tnum">${U.money(dt.expense)}</b></div><div class="kv"><span>Ingresos</span><span class="tnum">${U.money(dt.income)}</span></div></div>
          ${dayTx.length ? `<div class="tx-list">${dayTx.map((x) => H.txRow(x)).join('')}</div>` : `<p class="muted small">Sin movimientos este día.</p>`}
        </div>
      </section>`;
    return {
      html,
      actions: {
        calDay: (el) => { App.calDay = el.dataset.date; App.render(); },
        calPrev: () => { App.period.ref = U.addMonths(ref, -1); App.calDay = null; App.render(); },
        calNext: () => { App.period.ref = U.addMonths(ref, 1); App.calDay = null; App.render(); },
        calToday: () => { App.period.ref = U.today(); App.calDay = null; App.render(); },
        addOnDay: () => Forms.tx({ date: App.calDay }),
      },
    };
  };

  /* ================= INFORMES ================= */
  Views.informes = () => {
    const year = U.parse(App.period.ref).getFullYear();
    const r = { start: `${year}-01-01`, end: `${year}-12-31` };
    const tot = Store.totals(r);
    const elapsed = U.elapsedDays(r) || U.daysIn(r);
    const months = Store.series(r, 'month');
    const monthsElapsed = Math.max(1, Math.min(12, year < new Date().getFullYear() ? 12 : year > new Date().getFullYear() ? 12 : new Date().getMonth() + 1));
    let acc = 0;
    const rows = Array.from({ length: 12 }, (_, i) => {
      const k = `${year}-${U.pad(i + 1)}`, e = months[k] || { income: 0, expense: 0 };
      const net = e.income - e.expense;
      acc += net;
      return { i, k, ...e, net, acc, rate: e.income ? net / e.income : NaN };
    });
    const expCats = Store.byCategory(r, 'expense'), incCats = Store.byCategory(r, 'income');
    const series = [{ name: 'Ingresos' }, { name: 'Gastos' }];
    const catTable = (list, total) => list.length ? `<div class="table-wrap"><table class="table">
      <thead><tr><th>Categoría</th><th class="num">Total</th><th class="num">%</th><th class="num">Media/mes</th></tr></thead>
      <tbody>${list.map((e) => `<tr><td><span class="td-cat">${icon(e.cat.icon, 15)} ${U.esc(e.cat.name)}</span></td><td class="num">${U.money(e.total)}</td><td class="num">${U.pct(e.total / (total || 1), 1)}</td><td class="num">${U.money(e.total / monthsElapsed)}</td></tr>`).join('')}</tbody>
    </table></div>` : `<p class="muted small">Sin datos.</p>`;

    const html = `
      <div class="period">
        <div class="period-nav glass-pill">
          <button class="icon-btn" data-action="yPrev" aria-label="Año anterior">${icon('chevL')}</button>
          <button class="period-label" data-action="yToday">${year}</button>
          <button class="icon-btn" data-action="yNext" aria-label="Año siguiente">${icon('chevR')}</button>
        </div>
        <div class="period-actions">
          <button class="btn" data-action="yCsv">${icon('download', 18)} CSV del año</button>
          <button class="btn" data-action="print">${icon('file', 18)} Imprimir</button>
        </div>
      </div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Ingresos del año', U.money(tot.income))}</div>
        <div class="card glass">${H.stat('Gastos del año', U.money(tot.expense))}</div>
        <div class="card glass">${H.stat('Ahorro', signed(tot.net))}</div>
        <div class="card glass">${H.stat('Tasa de ahorro', U.pct(tot.income ? tot.net / tot.income : NaN))}</div>
      </section>
      <section class="card glass">
        ${H.sectionHead('Medias del año', `<span class="muted small">Sobre ${elapsed} días transcurridos</span>`)}
        <div class="table-wrap"><table class="table">
          <thead><tr><th></th><th class="num">Diario</th><th class="num">Semanal</th><th class="num">Mensual</th><th class="num">Anual (proyección)</th></tr></thead>
          <tbody>
            ${[['Gastos', tot.expense], ['Ingresos', tot.income], ['Balance', tot.net]].map(([l, v]) => {
              const d = v / elapsed;
              return `<tr><td>${l}</td><td class="num">${U.money(d)}</td><td class="num">${U.money(d * 7)}</td><td class="num">${U.money(d * 365 / 12)}</td><td class="num">${U.money(d * U.daysIn(r))}</td></tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </section>
      <section class="card glass">
        ${H.sectionHead('Mes a mes', Charts.legend(series))}
        <div class="chart-box" data-chart="year"></div>
        <div class="table-wrap"><table class="table clickable">
          <thead><tr><th>Mes</th><th class="num">Ingresos</th><th class="num">Gastos</th><th class="num">Balance</th><th class="num">Ahorro</th><th class="num">Acumulado</th></tr></thead>
          <tbody>${rows.map((x) => `<tr data-action="openMonth" data-month="${x.k}"><td>${U.monthName(x.i)}</td><td class="num">${U.money(x.income)}</td><td class="num">${U.money(x.expense)}</td><td class="num">${signed(x.net)}</td><td class="num">${U.pct(x.rate)}</td><td class="num">${signed(x.acc)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td>Total</td><td class="num">${U.money(tot.income)}</td><td class="num">${U.money(tot.expense)}</td><td class="num">${signed(tot.net)}</td><td class="num">${U.pct(tot.income ? tot.net / tot.income : NaN)}</td><td></td></tr></tfoot>
        </table></div>
      </section>
      <section class="grid g-2">
        <div class="card glass">${H.sectionHead('Gastos por categoría')}${catTable(expCats, tot.expense)}</div>
        <div class="card glass">${H.sectionHead('Ingresos por categoría')}${catTable(incCats, tot.income)}</div>
      </section>`;
    return {
      html,
      after: () => Charts.bars(UI.$('[data-chart="year"]'), Charts.periodSeries('year', `${year}-01-01`, ws()), series, { aria: `Ingresos y gastos por mes de ${year}` }),
      actions: {
        yPrev: () => { App.period.ref = U.addYears(App.period.ref, -1); App.render(); },
        yNext: () => { App.period.ref = U.addYears(App.period.ref, 1); App.render(); },
        yToday: () => { App.period.ref = U.today(); App.render(); },
        yCsv: () => App.exportCsv(Store.txIn(r), `movimientos-${year}`),
        print: () => window.print(),
        openMonth: (el) => { App.period = { type: 'month', ref: `${el.dataset.month}-01` }; location.hash = '#/resumen'; },
      },
    };
  };
})();
