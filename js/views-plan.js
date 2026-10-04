'use strict';
/* Vistas de planificación: Nómina, Recurrentes, Presupuestos, Ahorro, Deudas, Inversiones, Cuentas y Ajustes. */
const ACCOUNT_ICONS = { banco: 'bank', efectivo: 'wallet', tarjeta: 'card', ahorro: 'target', otra: 'layers' };
const ACCOUNT_TYPES = { banco: 'Cuenta bancaria', efectivo: 'Efectivo', tarjeta: 'Tarjeta', ahorro: 'Ahorro', otra: 'Otra' };

(() => {
  const S = () => Store.state;
  const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${U.money(Math.abs(n))}`;
  const byId = (col, el) => Store.get(col, el.closest('[data-id]').dataset.id);

  /* ================= NÓMINA ================= */
  Views.nomina = () => {
    const year = U.parse(App.period.ref).getFullYear();
    const list = S().payrolls.filter((p) => p.date.startsWith(String(year))).sort((a, b) => b.date.localeCompare(a.date));
    const all = [...S().payrolls].sort((a, b) => b.date.localeCompare(a.date));
    const sumK = (k) => U.sum(list, (p) => p[k]);
    const gross = sumK('gross'), net = sumK('net'), irpf = sumK('irpf'), ss = sumK('ss'), other = sumK('other');
    const regular = list.filter((p) => !p.extra);
    const last = all[0];
    const series = [{ name: 'Bruto' }, { name: 'Neto' }];
    const html = `
      <div class="period">
        <div class="period-nav glass-pill">
          <button class="icon-btn" data-action="yPrev" aria-label="Año anterior">${icon('chevL')}</button>
          <button class="period-label" data-action="yToday">${year}</button>
          <button class="icon-btn" data-action="yNext" aria-label="Año siguiente">${icon('chevR')}</button>
        </div>
        <div class="period-actions">
          <button class="btn" data-action="calc">${icon('calc', 18)} Calculadora</button>
          ${last ? `<button class="btn" data-action="repeat">${icon('copy', 18)} Repetir última</button>` : ''}
          <button class="btn btn-primary" data-action="newPayroll">${icon('plus', 18)} Añadir nómina</button>
        </div>
      </div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Neto cobrado', U.money(net), `<span class="delta muted">${list.length} nóminas</span>`)}</div>
        <div class="card glass">${H.stat('Bruto', U.money(gross), `<span class="delta muted">${gross ? `${U.pct(net / gross, 1)} llega a tu bolsillo` : '—'}</span>`)}</div>
        <div class="card glass">${H.stat('IRPF retenido', U.money(irpf), `<span class="delta muted">Retención media ${gross ? U.pct(irpf / gross, 1) : '—'}</span>`)}</div>
        <div class="card glass">${H.stat('Seguridad Social', U.money(ss), `<span class="delta muted">${other ? `Otras: ${U.money(other)}` : gross ? U.pct(ss / gross, 2) + ' del bruto' : '—'}</span>`)}</div>
      </section>
      <section class="grid g-main">
        <div class="card glass">
          ${H.sectionHead(`Nóminas ${year}`, Charts.legend(series))}
          <div class="chart-box" data-chart="payroll"></div>
        </div>
        <div class="card glass">
          ${H.sectionHead('Medias')}
          <div class="kvs">
            <div class="kv"><span>Neto medio por nómina</span><b class="tnum">${U.money(regular.length ? U.sum(regular, (p) => p.net) / regular.length : 0)}</b></div>
            <div class="kv"><span>Neto medio mensual (con extras)</span><span class="tnum">${U.money(net / Math.max(1, new Set(list.map((p) => p.date.slice(0, 7))).size))}</span></div>
            <div class="kv"><span>Bruto medio por nómina</span><span class="tnum">${U.money(regular.length ? U.sum(regular, (p) => p.gross) / regular.length : 0)}</span></div>
            <div class="kv"><span>Pagas extra</span><span class="tnum">${list.length - regular.length}</span></div>
            <div class="kv"><span>Total deducciones</span><span class="tnum">${U.money(irpf + ss + other)}</span></div>
          </div>
          <p class="field-h">Cada nómina se registra automáticamente como ingreso en la categoría Nómina.</p>
        </div>
      </section>
      <section class="card glass">
        ${H.sectionHead('Historial')}
        ${list.length ? `<div class="table-wrap"><table class="table clickable">
          <thead><tr><th>Fecha</th><th>Empresa</th><th class="num">Bruto</th><th class="num">IRPF</th><th class="num">S. Social</th><th class="num">Otras</th><th class="num">Neto</th></tr></thead>
          <tbody>${list.map((p) => `<tr data-action="editPayroll" data-id="${p.id}"><td>${U.esc(U.fullDate(p.date))}${p.extra ? ' <span class="badge">Extra</span>' : ''}</td><td>${U.esc(p.employer || '—')}</td><td class="num">${U.money(p.gross)}</td><td class="num">${U.money(p.irpf)}</td><td class="num">${U.money(p.ss)}</td><td class="num">${U.money(p.other)}</td><td class="num"><b>${U.money(p.net)}</b></td></tr>`).join('')}</tbody>
        </table></div>` : H.empty(`No hay nóminas en ${year}. Registra bruto, retenciones y neto; el neto se suma a tus ingresos.`, `<button class="btn btn-primary" data-action="newPayroll">${icon('plus', 18)} Añadir nómina</button>`)}
      </section>`;
    return {
      html,
      after: () => {
        const data = Array.from({ length: 12 }, (_, i) => {
          const k = `${year}-${U.pad(i + 1)}`;
          const ps = list.filter((p) => p.date.startsWith(k));
          return { label: U.monthName(i, 'short').replace('.', ''), title: `${U.monthName(i)} ${year}`, values: [U.sum(ps, (p) => p.gross), U.sum(ps, (p) => p.net)] };
        });
        Charts.bars(UI.$('[data-chart="payroll"]'), data, series, { aria: 'Bruto y neto por mes' });
      },
      actions: {
        yPrev: () => { App.period.ref = U.addYears(App.period.ref, -1); App.render(); },
        yNext: () => { App.period.ref = U.addYears(App.period.ref, 1); App.render(); },
        yToday: () => { App.period.ref = U.today(); App.render(); },
        newPayroll: () => Forms.payroll(),
        calc: () => Forms.payrollCalculator(),
        repeat: () => {
          const { id, transactionId, ...rest } = last;
          Forms.payroll(null, { ...rest, date: U.addMonths(last.date, 1), extra: false });
        },
        editPayroll: (el) => Forms.payroll(byId('payrolls', el)),
      },
    };
  };

  /* ================= RECURRENTES ================= */
  Views.recurrentes = () => {
    const rec = S().recurring;
    const active = rec.filter((r) => r.active);
    const monthlyExp = U.sum(active.filter((r) => r.type === 'expense'), Store.monthlyEquivalent);
    const monthlyInc = U.sum(active.filter((r) => r.type === 'income'), Store.monthlyEquivalent);
    const up = Store.upcoming(30);
    const card = (r) => {
      const c = Store.cat(r.categoryId);
      const due = r.nextDate && r.nextDate <= U.today();
      return `<div class="rec glass-inner ${r.active ? '' : 'paused'}" data-id="${r.id}">
        <span class="cat-ic lg">${icon(c.icon, 20)}</span>
        <div class="rec-main">
          <b>${U.esc(r.name)}</b>
          <small>${H.freqLabel(r)} · ${U.esc(c.name)} · ${r.active ? `Próximo: ${U.esc(U.dayLabel(r.nextDate))}` : 'En pausa'}${r.autoAdd ? '' : ' · Manual'}</small>
        </div>
        <div class="rec-amt"><b class="tnum">${r.type === 'income' ? '+' : '−'}${U.money(r.amount)}</b><small class="tnum">${U.money(Store.monthlyEquivalent(r))}/mes</small></div>
        <div class="rec-actions">
          ${r.active ? `<button class="icon-btn" data-action="recNow" title="${due ? 'Registrar el cargo pendiente' : 'Registrar ahora'}" aria-label="Registrar ahora">${icon('check', 18)}</button>` : ''}
          <button class="icon-btn" data-action="recToggle" title="${r.active ? 'Pausar' : 'Reanudar'}" aria-label="${r.active ? 'Pausar' : 'Reanudar'}">${icon(r.active ? 'pause' : 'play', 18)}</button>
          <button class="icon-btn" data-action="recEdit" aria-label="Editar">${icon('edit', 18)}</button>
        </div>
      </div>`;
    };
    const html = `
      <div class="period"><div class="muted">Alquiler, suscripciones, seguros, sueldo… se registran solos cuando vencen.</div>
        <div class="period-actions"><button class="btn btn-primary" data-action="recNew">${icon('plus', 18)} Nuevo recurrente</button></div></div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Gastos fijos / mes', U.money(monthlyExp), `<span class="delta muted">${U.money(monthlyExp * 12)} al año</span>`)}</div>
        <div class="card glass">${H.stat('Ingresos fijos / mes', U.money(monthlyInc), `<span class="delta muted">${U.money(monthlyInc * 12)} al año</span>`)}</div>
        <div class="card glass">${H.stat('Margen fijo / mes', signed(monthlyInc - monthlyExp), `<span class="delta muted">Lo que queda tras fijos</span>`)}</div>
        <div class="card glass">${H.stat('Próximos 30 días', U.money(U.sum(up.filter((u) => u.r.type === 'expense'), (u) => u.r.amount)), `<span class="delta muted">${up.length} cargos previstos</span>`)}</div>
      </section>
      <section class="grid g-main">
        <div class="card glass">
          ${H.sectionHead('Gastos fijos')}
          ${rec.filter((r) => r.type === 'expense').map(card).join('') || `<p class="muted small">Sin gastos fijos. Añade alquiler, luz, Netflix, gimnasio…</p>`}
          ${H.sectionHead('Ingresos fijos')}
          ${rec.filter((r) => r.type === 'income').map(card).join('') || `<p class="muted small">Sin ingresos fijos.</p>`}
        </div>
        <div class="card glass">
          ${H.sectionHead('Calendario de cargos')}
          ${up.length ? `<div class="mini-list">${up.map((u) => `<div class="mini"><span class="mini-date">${U.esc(U.shortDate(u.date))}</span><span class="mini-main"><b>${U.esc(u.r.name)}</b><small>${U.esc(U.dayLabel(u.date))}</small></span><span class="tnum">${u.r.type === 'income' ? '+' : '−'}${U.money(u.r.amount)}</span></div>`).join('')}</div>` : `<p class="muted small">Nada previsto en los próximos 30 días.</p>`}
        </div>
      </section>`;
    return {
      html,
      actions: {
        recNew: () => Forms.recurring(),
        recEdit: (el) => Forms.recurring(byId('recurring', el)),
        recToggle: (el) => {
          const r = byId('recurring', el);
          const patch = { active: !r.active };
          if (!r.active) patch.nextDate = Store.firstUpcoming({ ...r, startDate: r.nextDate || r.startDate });
          Store.update('recurring', r.id, patch);
        },
        recNow: (el) => {
          const r = byId('recurring', el);
          Store.registerRecurringNow(r.id);
          UI.toast(`${r.name}: ${U.money(r.amount)} registrado`);
        },
      },
    };
  };

  /* ================= PRESUPUESTOS ================= */
  Views.presupuestos = () => {
    const ref = App.period.ref;
    const d0 = U.parse(ref);
    const r = U.range('month', ref);
    const spent = {};
    Store.txIn(r, 'expense').forEach((t) => { spent[t.categoryId] = (spent[t.categoryId] || 0) + t.amount; });
    const cats = Store.cats('expense');
    const withB = cats.filter((c) => c.budget > 0).map((c) => ({ c, s: spent[c.id] || 0 })).sort((a, b) => b.s / b.c.budget - a.s / a.c.budget);
    const noB = cats.filter((c) => !(c.budget > 0) && spent[c.id]).map((c) => ({ c, s: spent[c.id] })).sort((a, b) => b.s - a.s);
    const globalBudget = S().settings.monthlyBudget || 0;
    const budgeted = new Set(cats.filter((c) => c.budget > 0).map((c) => c.id));
    const inScope = (catId) => globalBudget > 0 || budgeted.has(catId);
    const totalSpent = U.sum(Object.entries(spent).filter(([id]) => inScope(id)), ([, v]) => v);
    const budget = globalBudget || U.sum(cats, (c) => c.budget || 0);
    const daysLeft = Math.max(0, U.diffDays(U.today() < r.start ? r.start : U.today(), r.end) + (U.today() <= r.end ? 1 : 0));
    const left = budget - totalSpent;
    const isCurrent = U.today() >= r.start && U.today() <= r.end;
    const projected = isCurrent ? Store.projectExpense(r, inScope) : totalSpent;

    const row = ({ c, s }) => {
      const ratio = c.budget ? s / c.budget : 0;
      return `<button class="budget-row" data-action="editCat" data-id="${c.id}">
        <span class="cat-ic">${icon(c.icon, 17)}</span>
        <span class="b-main">
          <span class="cat-top"><span class="cat-name">${U.esc(c.name)}</span><span class="tnum">${U.money(s)}${c.budget ? ` <span class="muted">/ ${U.money(c.budget)}</span>` : ''}</span></span>
          ${c.budget ? H.progress(ratio, { over: s > c.budget }) : ''}
          ${c.budget ? `<span class="b-sub">${s > c.budget ? `Excedido en ${U.money(s - c.budget)}` : `Quedan ${U.money(c.budget - s)}`} · ${U.pct(ratio)}</span>` : ''}
        </span>
      </button>`;
    };
    const html = `
      <div class="period">
        <div class="period-nav glass-pill">
          <button class="icon-btn" data-action="mPrev" aria-label="Mes anterior">${icon('chevL')}</button>
          <button class="period-label" data-action="mToday">${U.monthName(d0.getMonth())} ${d0.getFullYear()}</button>
          <button class="icon-btn" data-action="mNext" aria-label="Mes siguiente">${icon('chevR')}</button>
        </div>
        <div class="period-actions"><button class="btn btn-primary" data-action="editBudgets">${icon('sliders', 18)} Asignar presupuestos</button></div>
      </div>
      ${budget ? `
      <section class="card glass budget-hero">
        <div class="bh-top">
          <div>${H.stat(globalBudget ? 'Gastado este mes' : 'Gastado en categorías con presupuesto', U.money(totalSpent), `<span class="delta muted">de ${U.money(budget)} presupuestados</span>`)}</div>
          <div class="bh-right">${H.stat(left >= 0 ? 'Disponible' : 'Excedido', U.money(Math.abs(left)), isCurrent && left > 0 && daysLeft ? `<span class="delta muted">${U.money(left / daysLeft)} al día durante ${daysLeft} días</span>` : '')}</div>
        </div>
        ${H.progress(totalSpent / budget, { over: totalSpent > budget })}
        ${isCurrent ? `<p class="muted small">A este ritmo cerrarás el mes en <b class="tnum">${U.money(projected)}</b> (${projected > budget ? 'por encima' : 'por debajo'} del presupuesto).</p>` : ''}
      </section>` : `
      <section class="card glass">${H.empty('Aún no tienes presupuestos. Asigna un límite mensual por categoría y verás cuánto te queda cada día.', `<button class="btn btn-primary" data-action="editBudgets">${icon('sliders', 18)} Asignar presupuestos</button>`)}</section>`}
      <section class="grid g-2">
        <div class="card glass">${H.sectionHead('Con presupuesto')}${withB.length ? withB.map(row).join('') : `<p class="muted small">Ninguna categoría tiene límite todavía.</p>`}</div>
        <div class="card glass">${H.sectionHead('Sin presupuesto')}${noB.length ? noB.map(row).join('') : `<p class="muted small">Todo el gasto del mes está presupuestado.</p>`}</div>
      </section>`;
    return {
      html,
      actions: {
        mPrev: () => { App.period.ref = U.addMonths(ref, -1); App.render(); },
        mNext: () => { App.period.ref = U.addMonths(ref, 1); App.render(); },
        mToday: () => { App.period.ref = U.today(); App.render(); },
        editBudgets: () => Forms.budgets(),
        editCat: (el) => Forms.category(Store.cat(el.dataset.id)),
      },
    };
  };

  /* ================= AHORRO (METAS) ================= */
  Views.ahorro = () => {
    const goals = S().goals;
    const saved = U.sum(goals, Store.goalSaved);
    const target = U.sum(goals, (g) => g.target);
    const r = U.range('month', U.today());
    const tot = Store.totals(r);
    const year = Store.totals(U.range('year', U.today()));
    const card = (g) => {
      const s = Store.goalSaved(g), ratio = g.target ? s / g.target : 0;
      const left = Math.max(0, g.target - s);
      let perMonth = '';
      if (g.deadline && left > 0) {
        const months = Math.max(1, (U.parse(g.deadline).getFullYear() - new Date().getFullYear()) * 12 + U.parse(g.deadline).getMonth() - new Date().getMonth());
        perMonth = `${U.money(left / months)} / mes hasta ${U.fullDate(g.deadline)}`;
      }
      const hist = [...(g.history || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
      return `<div class="goal card glass" data-id="${g.id}">
        <div class="goal-top">
          ${H.ring(ratio, 72)}
          <div class="goal-main">
            <span class="goal-name">${icon(g.icon || 'target', 16)} ${U.esc(g.name)}</span>
            <b class="tnum goal-v">${U.money(s)}</b>
            <small class="muted tnum">de ${U.money(g.target)}${left > 0 ? ` · faltan ${U.money(left)}` : ' · ¡Conseguido!'}</small>
            ${perMonth ? `<small class="muted">${perMonth}</small>` : ''}
          </div>
        </div>
        ${hist.length ? `<div class="goal-hist">${hist.map((h) => `<div class="kv"><span>${U.esc(U.shortDate(h.date))}${h.note ? ' · ' + U.esc(h.note) : ''}</span><span class="tnum">${signed(h.amount)}</span></div>`).join('')}</div>` : ''}
        <div class="goal-actions">
          <button class="btn btn-primary btn-sm" data-action="goalMove">${icon('plus', 16)} Aportar</button>
          <button class="btn btn-sm" data-action="goalEdit">${icon('edit', 16)} Editar</button>
        </div>
      </div>`;
    };
    const html = `
      <div class="period"><div class="muted">Define metas y registra lo que vas apartando.</div>
        <div class="period-actions"><button class="btn btn-primary" data-action="goalNew">${icon('plus', 18)} Nueva meta</button></div></div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Ahorrado en metas', U.money(saved), `<span class="delta muted">${target ? U.pct(saved / target) + ' del total' : '—'}</span>`)}</div>
        <div class="card glass">${H.stat('Objetivo total', U.money(target))}</div>
        <div class="card glass">${H.stat('Ahorro este mes', signed(tot.net), `<span class="delta muted">Tasa ${U.pct(tot.income ? tot.net / tot.income : NaN)}</span>`)}</div>
        <div class="card glass">${H.stat('Ahorro este año', signed(year.net), `<span class="delta muted">Tasa ${U.pct(year.income ? year.net / year.income : NaN)}</span>`)}</div>
      </section>
      ${goals.length ? `<section class="grid g-3">${goals.map(card).join('')}</section>`
        : `<section class="card glass">${H.empty('Crea tu primera meta: fondo de emergencia, viaje, entrada de un piso…', `<button class="btn btn-primary" data-action="goalNew">${icon('plus', 18)} Nueva meta</button>`)}</section>`}`;
    return {
      html,
      actions: {
        goalNew: () => Forms.goal(),
        goalEdit: (el) => Forms.goal(byId('goals', el)),
        goalMove: (el) => Forms.goalMove(byId('goals', el)),
      },
    };
  };

  /* ================= DEUDAS ================= */
  Views.deudas = () => {
    const debts = S().debts;
    const owe = debts.filter((d) => d.direction === 'owe'), owed = debts.filter((d) => d.direction === 'owed');
    const card = (d) => {
      const paid = Store.debtPaid(d), left = Store.debtLeft(d), ratio = d.total ? paid / d.total : 0;
      const months = d.installment > 0 && left > 0 ? Math.ceil(left / d.installment) : 0;
      const pays = [...(d.payments || [])].sort((a, b) => b.date.localeCompare(a.date));
      return `<div class="debt glass-inner" data-id="${d.id}">
        <div class="debt-top">
          <span class="cat-ic lg">${icon(d.direction === 'owe' ? 'card' : 'users', 20)}</span>
          <div class="debt-main"><b>${U.esc(d.name)}</b><small class="muted">${d.dueDate ? `Vence ${U.esc(U.fullDate(d.dueDate))}` : 'Sin vencimiento'}${d.rate ? ` · ${U.num(d.rate, 2)} % TAE` : ''}${months ? ` · ${months} cuotas restantes` : ''}</small></div>
          <div class="rec-amt"><b class="tnum">${U.money(left)}</b><small class="tnum muted">de ${U.money(d.total)}</small></div>
        </div>
        ${H.progress(ratio)}
        ${pays.length ? `<details class="pays"><summary>${pays.length} ${d.direction === 'owe' ? 'pagos' : 'cobros'} · ${U.money(paid)}</summary>${pays.map((p) => `<div class="kv"><span>${U.esc(U.fullDate(p.date))}${p.txId ? ' · registrado' : ''}</span><span class="tnum">${U.money(p.amount)} <button class="icon-btn xs" data-action="delPay" data-pay="${p.id}" aria-label="Eliminar pago">${icon('x', 14)}</button></span></div>`).join('')}</details>` : ''}
        <div class="goal-actions">
          ${left > 0 ? `<button class="btn btn-primary btn-sm" data-action="debtPay">${icon('check', 16)} ${d.direction === 'owe' ? 'Registrar pago' : 'Registrar cobro'}</button>` : `<span class="badge">Saldada</span>`}
          <button class="btn btn-sm" data-action="debtEdit">${icon('edit', 16)} Editar</button>
        </div>
      </div>`;
    };
    const oweLeft = U.sum(owe, Store.debtLeft), owedLeft = U.sum(owed, Store.debtLeft);
    const monthly = U.sum(owe.filter((d) => Store.debtLeft(d) > 0), (d) => d.installment || 0);
    const html = `
      <div class="period"><div class="muted">Préstamos, hipoteca, tarjetas y lo que te deben otros.</div>
        <div class="period-actions"><button class="btn btn-primary" data-action="debtNew">${icon('plus', 18)} Nueva deuda</button></div></div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Debo', U.money(oweLeft), `<span class="delta muted">${owe.length} deudas</span>`)}</div>
        <div class="card glass">${H.stat('Me deben', U.money(owedLeft), `<span class="delta muted">${owed.length} pendientes</span>`)}</div>
        <div class="card glass">${H.stat('Saldo neto', signed(owedLeft - oweLeft))}</div>
        <div class="card glass">${H.stat('Cuotas mensuales', U.money(monthly))}</div>
      </section>
      <section class="grid g-2">
        <div class="card glass">${H.sectionHead('Yo debo')}${owe.length ? owe.map(card).join('') : `<p class="muted small">Sin deudas registradas.</p>`}</div>
        <div class="card glass">${H.sectionHead('Me deben')}${owed.length ? owed.map(card).join('') : `<p class="muted small">Nadie te debe nada.</p>`}</div>
      </section>`;
    return {
      html,
      actions: {
        debtNew: () => Forms.debt(),
        debtEdit: (el) => Forms.debt(byId('debts', el)),
        debtPay: (el) => Forms.debtPayment(byId('debts', el)),
        delPay: async (el) => {
          const d = byId('debts', el);
          if (!(await UI.confirm('Se eliminará este pago y su movimiento asociado.', { ok: 'Eliminar' }))) return;
          Store.deleteDebtPayment(d.id, el.dataset.pay);
        },
      },
    };
  };

  /* ================= INVERSIONES ================= */
  Views.inversiones = () => {
    const inv = S().investments;
    const invested = U.sum(inv, (i) => i.invested), value = U.sum(inv, (i) => i.value);
    const pl = value - invested;
    const byKind = {};
    inv.forEach((i) => { byKind[i.kind] = (byKind[i.kind] || 0) + i.value; });
    const kinds = Object.entries(byKind).sort((a, b) => b[1] - a[1]);
    const html = `
      <div class="period"><div class="muted">Actualiza el valor de tus inversiones cuando quieras para ver la rentabilidad.</div>
        <div class="period-actions"><button class="btn btn-primary" data-action="invNew">${icon('plus', 18)} Nueva inversión</button></div></div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Valor actual', U.money(value))}</div>
        <div class="card glass">${H.stat('Capital invertido', U.money(invested))}</div>
        <div class="card glass">${H.stat('Ganancia / pérdida', signed(pl))}</div>
        <div class="card glass">${H.stat('Rentabilidad', invested ? `${pl >= 0 ? '+' : ''}${U.pct(pl / invested, 2)}` : '—')}</div>
      </section>
      <section class="grid g-main">
        <div class="card glass">
          ${H.sectionHead('Cartera')}
          ${inv.length ? `<div class="table-wrap"><table class="table clickable">
            <thead><tr><th>Nombre</th><th>Tipo</th><th class="num">Invertido</th><th class="num">Valor</th><th class="num">+/−</th><th class="num">%</th></tr></thead>
            <tbody>${inv.map((i) => { const d = i.value - i.invested; return `<tr data-action="invEdit" data-id="${i.id}"><td><b>${U.esc(i.name)}</b><br><small class="muted">Act. ${U.esc(U.fullDate(i.updated || U.today()))}</small></td><td>${U.esc(i.kind)}</td><td class="num">${U.money(i.invested)}</td><td class="num">${U.money(i.value)}</td><td class="num">${signed(d)}</td><td class="num">${i.invested ? U.pct(d / i.invested, 1) : '—'}</td></tr>`; }).join('')}</tbody>
          </table></div>` : H.empty('Añade acciones, fondos, cripto, planes de pensiones o depósitos.', `<button class="btn btn-primary" data-action="invNew">${icon('plus', 18)} Nueva inversión</button>`)}
        </div>
        <div class="card glass">
          ${H.sectionHead('Distribución')}
          ${kinds.length ? `<div class="cat-bars">${kinds.map(([k, v]) => `<div class="cat-row static"><span class="cat-main"><span class="cat-top"><span class="cat-name">${U.esc(k)}</span><span class="tnum">${U.money(v)}</span></span><span class="bar"><i style="width:${(v / (kinds[0][1] || 1)) * 100}%"></i></span></span><span class="cat-pct tnum">${U.pct(v / (value || 1))}</span></div>`).join('')}</div>` : `<p class="muted small">Sin datos.</p>`}
        </div>
      </section>`;
    return {
      html,
      actions: {
        invNew: () => Forms.investment(),
        invEdit: (el) => Forms.investment(byId('investments', el)),
      },
    };
  };

  /* ================= CUENTAS ================= */
  Views.cuentas = () => {
    const accs = S().accounts;
    const nw = Store.netWorth();
    const monthR = U.range('month', U.today());
    const card = (a) => {
      const bal = Store.accountBalance(a.id);
      const mov = S().transactions.filter((t) => (t.accountId === a.id || t.toAccountId === a.id) && t.date >= monthR.start && t.date <= monthR.end);
      const inM = U.sum(mov, (t) => (t.type === 'income' || (t.type === 'transfer' && t.toAccountId === a.id) ? t.amount : 0));
      const outM = U.sum(mov, (t) => (t.type === 'expense' || (t.type === 'transfer' && t.accountId === a.id) ? t.amount : 0));
      return `<div class="acc card glass ${a.archived ? 'paused' : ''}" data-id="${a.id}">
        <div class="acc-top"><span class="cat-ic lg">${icon(ACCOUNT_ICONS[a.type] || 'wallet', 20)}</span><div><b>${U.esc(a.name)}</b><small class="muted">${ACCOUNT_TYPES[a.type] || 'Cuenta'}${a.archived ? ' · Archivada' : ''}</small></div>
          <button class="icon-btn" data-action="accEdit" aria-label="Editar cuenta">${icon('edit', 18)}</button></div>
        <b class="acc-bal tnum">${U.money(bal)}</b>
        <div class="kv small"><span>Este mes</span><span class="tnum">+${U.money(inM)} · −${U.money(outM)}</span></div>
      </div>`;
    };
    const html = `
      <div class="period"><div class="muted">El saldo se calcula con el saldo inicial y todos tus movimientos.</div>
        <div class="period-actions">
          <button class="btn" data-action="add" data-type="transfer">${icon('swap', 18)} Transferir</button>
          <button class="btn btn-primary" data-action="accNew">${icon('plus', 18)} Nueva cuenta</button>
        </div></div>
      <section class="grid g-4">
        <div class="card glass">${H.stat('Saldo en cuentas', U.money(nw.accounts))}</div>
        <div class="card glass">${H.stat('Inversiones', U.money(nw.investments))}</div>
        <div class="card glass">${H.stat('Deudas netas', signed(nw.owed - nw.owe))}</div>
        <div class="card glass">${H.stat('Patrimonio neto', U.money(nw.total))}</div>
      </section>
      <section class="grid g-3">${accs.filter((a) => !a.archived).map(card).join('')}</section>
      ${accs.some((a) => a.archived) ? `<p class="label-row">Archivadas</p><section class="grid g-3">${accs.filter((a) => a.archived).map(card).join('')}</section>` : ''}`;
    return {
      html,
      actions: {
        accNew: () => Forms.account(),
        accEdit: (el) => Forms.account(byId('accounts', el)),
      },
    };
  };

  /* ================= AJUSTES ================= */
  let catTab = 'expense';
  Views.ajustes = () => {
    const s = S();
    const currencies = [['EUR', 'Euro (€)'], ['USD', 'Dólar estadounidense ($)'], ['GBP', 'Libra esterlina (£)'], ['MXN', 'Peso mexicano'], ['ARS', 'Peso argentino'], ['COP', 'Peso colombiano'], ['CLP', 'Peso chileno'], ['PEN', 'Sol peruano'], ['CHF', 'Franco suizo']];
    const html = `
      <section class="grid g-2">
        <div class="card glass">
          ${H.sectionHead('Preferencias')}
          <form class="settings-form" data-form="settings">
            ${UI.field('Tu nombre', UI.input('name', { value: s.settings.name, placeholder: 'Para el saludo', attrs: 'data-change="setName"' }))}
            <div class="grid2">
              ${UI.field('Moneda', UI.select('currency', currencies.map(([v, l]) => ({ value: v, label: l })), s.settings.currency, 'data-change="setCurrency"'))}
              ${UI.field('La semana empieza en', UI.select('weekStart', [{ value: 1, label: 'Lunes' }, { value: 0, label: 'Domingo' }], s.settings.weekStart, 'data-change="setWeek"'))}
            </div>
            ${UI.field('Apariencia', UI.seg('theme', [{ value: 'auto', label: 'Automático' }, { value: 'light', label: 'Blanco' }, { value: 'dark', label: 'Negro' }], s.settings.theme, 'setTheme'))}
          </form>
        </div>
        <div class="card glass" id="quick">
          ${H.sectionHead('Accesos rápidos', `<button class="btn btn-sm" data-action="quickNew">${icon('plus', 16)} Añadir</button>`)}
          <p class="muted small">Botones de un toque en el Resumen. Con importe fijo se guardan al instante.</p>
          <div class="mini-list">${s.quick.map((q) => `<button class="mini btn-row" data-action="quickEdit" data-id="${q.id}"><span class="cat-ic">${icon(Store.cat(q.categoryId).icon, 16)}</span><span class="mini-main"><b>${U.esc(q.label)}</b><small>${U.esc(Store.cat(q.categoryId).name)}</small></span><span class="tnum">${q.amount ? U.money(q.amount) : 'Variable'}</span></button>`).join('') || '<p class="muted small">Sin accesos rápidos.</p>'}</div>
        </div>
      </section>
      <section class="card glass">
        ${H.sectionHead('Categorías', `<button class="btn btn-sm" data-action="catNew">${icon('plus', 16)} Nueva</button>`)}
        ${UI.seg('catTab', [{ value: 'expense', label: `Gastos (${Store.cats('expense').length})` }, { value: 'income', label: `Ingresos (${Store.cats('income').length})` }], catTab, 'catTab')}
        <div class="cat-grid">${Store.cats(catTab).map((c) => `<button class="cat-tile" data-action="catEdit" data-id="${c.id}"><span class="cat-ic">${icon(c.icon, 18)}</span><span class="ct-txt"><span>${U.esc(c.name)}</span>${c.budget ? `<small class="tnum">${U.money0(c.budget)}/mes</small>` : ''}</span></button>`).join('')}</div>
      </section>
      <section class="grid g-2">
        <div class="card glass">
          ${H.sectionHead('Tus datos')}
          <p class="muted small">Todo se guarda solo en este dispositivo y navegador. Exporta una copia de seguridad de vez en cuando o para pasar tus datos a otro dispositivo.</p>
          <div class="btn-col">
            <button class="btn" data-action="exportJson">${icon('download', 18)} Exportar copia de seguridad</button>
            <button class="btn" data-action="importJson">${icon('upload', 18)} Importar copia de seguridad</button>
            <button class="btn" data-action="exportAllCsv">${icon('file', 18)} Exportar movimientos (CSV/Excel)</button>
            <input type="file" accept="application/json,.json" id="importFile" hidden>
          </div>
        </div>
        <div class="card glass">
          ${H.sectionHead('Zona avanzada')}
          <div class="kvs">
            <div class="kv"><span>Movimientos guardados</span><b class="tnum">${s.transactions.length}</b></div>
            <div class="kv"><span>Nóminas</span><span class="tnum">${s.payrolls.length}</span></div>
            <div class="kv"><span>Recurrentes</span><span class="tnum">${s.recurring.length}</span></div>
          </div>
          <div class="btn-col">
            <button class="btn" data-action="loadDemo">${icon('layers', 18)} Cargar datos de ejemplo</button>
            <button class="btn btn-danger-ghost" data-action="resetAll">${icon('trash', 18)} Borrar todos los datos</button>
          </div>
          <p class="muted small">Atajos: <kbd>N</kbd> nuevo gasto · <kbd>I</kbd> nuevo ingreso · <kbd>Esc</kbd> cerrar.</p>
        </div>
      </section>`;
    return {
      html,
      after: () => {
        const f = UI.$('#importFile');
        if (f) f.addEventListener('change', (e) => App.importJson(e.target.files[0]));
        if (App.anchor) { const a = UI.$('#' + App.anchor); App.anchor = null; if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      },
      actions: {
        setTheme: (el) => { Store.batch((st) => { st.settings.theme = el.dataset.value; }); UI.applyTheme(); },
        catTab: (el) => { catTab = el.dataset.value; App.render(); },
        catNew: () => Forms.category({ type: catTab }),
        catEdit: (el) => Forms.category(Store.cat(el.dataset.id)),
        quickNew: () => Forms.quickEdit(),
        quickEdit: (el) => Forms.quickEdit(Store.get('quick', el.dataset.id)),
        exportJson: () => App.exportJson(),
        importJson: () => UI.$('#importFile').click(),
        exportAllCsv: () => App.exportCsv(S().transactions, 'movimientos'),
        resetAll: async () => {
          if (!(await UI.confirm('Se borrarán todos tus movimientos, nóminas, metas y ajustes de este dispositivo. Exporta antes una copia si la necesitas.', { ok: 'Borrar todo' }))) return;
          Store.reset();
          UI.applyTheme();
          UI.toast('Datos borrados');
        },
      },
      changes: {
        setName: (el) => Store.batch((st) => { st.settings.name = el.value.trim(); }),
        setCurrency: (el) => Store.batch((st) => { st.settings.currency = el.value; }),
        setWeek: (el) => Store.batch((st) => { st.settings.weekStart = +el.value; }),
      },
    };
  };
})();
