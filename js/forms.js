'use strict';
/* Formularios en modal: alta rápida de movimientos y editores de cada sección. */
const Forms = (() => {
  const S = () => Store.state;

  /* ---------- Alta / edición de movimiento (el flujo más usado) ---------- */
  function tx(opts = {}) {
    const editing = opts.tx || null;
    if (editing && editing.payrollId && Store.get('payrolls', editing.payrollId)) return payroll(Store.get('payrolls', editing.payrollId));
    if (editing && editing.type === 'adjust') { const acc = Store.account(editing.accountId); if (acc) return adjust(acc, editing); }
    const accs = UI.accountOptions();
    const st = {
      type: editing ? editing.type : opts.type || 'expense',
      categoryId: editing ? editing.categoryId : opts.categoryId || null,
      date: editing ? editing.date : opts.date || U.today(),
    };
    const lastAcc = S().settings.lastAccount && Store.account(S().settings.lastAccount) ? S().settings.lastAccount : (accs[0] || {}).value;

    const fromAcc = opts.accountId && Store.account(opts.accountId) ? opts.accountId : lastAcc;
    function sortedCats(type) {
      const usage = Store.categoryUsage(type);
      return [...Store.cats(type)].sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0));
    }
    function catGrid() {
      if (st.type === 'transfer') {
        return `<div class="grid2">
          ${UI.field('Desde', UI.select('accountId', accs, editing ? editing.accountId : fromAcc))}
          ${UI.field('Hacia', UI.select('toAccountId', accs, editing ? editing.toAccountId : (accs.find((x) => x.value !== fromAcc) || accs[0] || {}).value))}
        </div>`;
      }
      const list = sortedCats(st.type);
      if (!st.categoryId || !list.some((c) => c.id === st.categoryId)) st.categoryId = list.length ? list[0].id : null;
      return `<div class="chips" role="radiogroup" aria-label="Categoría">${list.map((c) => `
        <button type="button" class="chip ${c.id === st.categoryId ? 'on' : ''}" data-action="pickCat" data-id="${c.id}" role="radio" aria-checked="${c.id === st.categoryId}">
          ${icon(c.icon, 16)}<span>${U.esc(c.name)}</span>
        </button>`).join('')}
        <button type="button" class="chip ghost" data-action="newCat">${icon('plus', 16)}<span>Nueva</span></button>
      </div>`;
    }
    function dateChips() {
      const t = U.today(), y = U.addDays(t, -1);
      return `<div class="date-row">
        <button type="button" class="chip sm ${st.date === t ? 'on' : ''}" data-action="pickDate" data-date="${t}">Hoy</button>
        <button type="button" class="chip sm ${st.date === y ? 'on' : ''}" data-action="pickDate" data-date="${y}">Ayer</button>
        <input class="input date-in" type="date" name="date" value="${st.date}" required>
      </div>`;
    }
    const typeOpts = [{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }, { value: 'transfer', label: 'Transferencia' }];
    const body = `
      <form class="tx-form" autocomplete="off">
        ${UI.seg('txType', typeOpts, st.type, 'txType')}
        <label class="amount-big">
          <span class="amount-sign">${st.type === 'income' ? '+' : st.type === 'expense' ? '−' : ''}</span>
          <input type="text" inputmode="decimal" name="amount" placeholder="0,00" value="${U.esc(U.inputAmount(editing ? editing.amount : opts.amount || ''))}" aria-label="Importe" autofocus required>
          <span class="amount-cur">${U.esc(U.symbol())}</span>
        </label>
        <div class="cat-zone">${catGrid()}</div>
        ${UI.field('Fecha', dateChips())}
        <div class="grid2 acc-row" ${st.type === 'transfer' ? 'hidden' : ''}>
          ${UI.field('Cuenta', UI.select('accountIdMain', accs, editing ? editing.accountId : fromAcc))}
          ${UI.field('Nota', UI.input('note', { value: editing ? editing.note || '' : opts.note || '', placeholder: 'Opcional' }))}
        </div>
        <div class="note-transfer" ${st.type === 'transfer' ? '' : 'hidden'}>${UI.field('Nota', UI.input('noteT', { value: editing ? editing.note || '' : '', placeholder: 'Opcional' }))}</div>
        <button type="submit" hidden></button>
      </form>`;
    const footer = editing
      ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button><button class="btn" data-action="dup">${icon('copy', 18)} Duplicar</button><button class="btn btn-primary" data-action="save">Guardar</button>`
      : `<button class="btn" data-action="saveMore">Guardar y otro</button><button class="btn btn-primary" data-action="save">${icon('check', 18)} Guardar</button>`;

    function read(m) {
      const f = m.$('form');
      const d = UI.formData(f);
      const amount = U.round2(U.parseAmount(d.amount));
      if (!(amount > 0)) {
        UI.toast('Introduce un importe mayor que 0.');
        m.$('[name=amount]').focus();
        return null;
      }
      const t = { type: st.type, amount, date: d.date || st.date };
      if (st.type === 'transfer') {
        if (d.accountId === d.toAccountId) { UI.toast('Elige dos cuentas distintas.'); return null; }
        Object.assign(t, { accountId: d.accountId, toAccountId: d.toAccountId, note: d.noteT || '', categoryId: null });
      } else {
        if (!st.categoryId) { UI.toast('Elige una categoría.'); return null; }
        Object.assign(t, { accountId: d.accountIdMain, categoryId: st.categoryId, note: d.note || '', toAccountId: null });
      }
      return t;
    }
    function save(m, more) {
      const t = read(m);
      if (!t) return;
      S().settings.lastAccount = t.accountId;
      if (editing) {
        Store.update('transactions', editing.id, t);
        UI.toast('Movimiento actualizado');
        m.close();
        return;
      }
      const created = Store.add('transactions', t);
      UI.toast(`${t.type === 'expense' ? 'Gasto' : t.type === 'income' ? 'Ingreso' : 'Transferencia'} de ${U.money(t.amount)} guardado`, {
        action: 'Deshacer', onAction: () => Store.remove('transactions', created.id),
      });
      if (more) {
        const a = m.$('[name=amount]');
        a.value = '';
        m.$('[name=note]').value = '';
        a.focus();
      } else m.close();
    }

    UI.modal({
      title: editing ? 'Editar movimiento' : 'Nuevo movimiento',
      body, footer, size: 'modal-tx',
      onMount: (m) => {
        UI.animateSegs(m.el);
        m.$('[name=amount]').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); save(m, false); } });
        m.$('[name=date]').addEventListener('change', (e) => { st.date = e.target.value; refreshDate(m); });
      },
      actions: {
        txType: (b, e, m) => {
          UI.segSelect(b);
          st.type = b.dataset.value;
          st.categoryId = editing && editing.type === st.type ? editing.categoryId : null;
          m.$('.cat-zone').innerHTML = catGrid();
          m.$('.amount-sign').textContent = st.type === 'income' ? '+' : st.type === 'expense' ? '−' : '';
          m.$('.acc-row').hidden = st.type === 'transfer';
          m.$('.note-transfer').hidden = st.type !== 'transfer';
        },
        pickCat: (b, e, m) => {
          st.categoryId = b.dataset.id;
          m.$$('.chips .chip').forEach((c) => { const on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
        },
        newCat: (b, e, m) => category({ type: st.type }, (c) => { st.categoryId = c.id; m.$('.cat-zone').innerHTML = catGrid(); }),
        pickDate: (b, e, m) => { st.date = b.dataset.date; m.$('[name=date]').value = st.date; refreshDate(m); },
        save: (b, e, m) => save(m, false),
        saveMore: (b, e, m) => save(m, true),
        submit: (f, e, m) => save(m, false),
        dup: (b, e, m) => {
          const t = read(m);
          if (!t) return;
          Store.add('transactions', { ...t, date: U.today() });
          UI.toast('Duplicado con fecha de hoy');
          m.close();
        },
        del: async (b, e, m) => {
          if (!(await UI.confirm('Se eliminará este movimiento.', { ok: 'Eliminar' }))) return;
          const removed = Store.remove('transactions', editing.id);
          m.close();
          UI.toast('Movimiento eliminado', { action: 'Deshacer', onAction: () => Store.add('transactions', removed) });
        },
      },
    });
    function refreshDate(m) {
      const t = U.today(), y = U.addDays(t, -1);
      m.$$('.date-row .chip').forEach((c) => c.classList.toggle('on', c.dataset.date === st.date && (st.date === t || st.date === y)));
    }
  }

  /* Acceso rápido: con importe → guarda al instante; sin importe → abre el alta con la categoría elegida. */
  function quick(q) {
    if (q.amount > 0) {
      const acc = S().settings.lastAccount && Store.account(S().settings.lastAccount) ? S().settings.lastAccount : (UI.accountOptions()[0] || {}).value;
      const created = Store.add('transactions', { type: q.type || 'expense', amount: q.amount, categoryId: q.categoryId, accountId: acc, date: U.today(), note: q.label });
      UI.toast(`${q.label}: ${U.money(q.amount)} añadido`, { action: 'Deshacer', onAction: () => Store.remove('transactions', created.id) });
    } else {
      tx({ type: q.type || 'expense', categoryId: q.categoryId, note: q.label });
    }
  }

  /* ---------- Categoría ---------- */
  function category(c = {}, onSaved) {
    const editing = !!c.id;
    const body = `<form>
      ${UI.field('Nombre', UI.input('name', { value: c.name || '', placeholder: 'p. ej. Gimnasio', attrs: 'required autofocus maxlength="40"' }))}
      <div class="grid2">
        ${UI.field('Tipo', UI.select('type', [{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }], c.type || 'expense', editing ? 'disabled' : ''))}
        ${UI.field('Presupuesto mensual', UI.moneyInput('budget', c.budget || ''), 'Solo para gastos. Vacío = sin límite.')}
      </div>
      ${UI.field('Icono', UI.iconPicker('icon', c.icon || 'tag'))}
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: editing ? 'Editar categoría' : 'Nueva categoría', body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">Guardar</button>`,
      actions: {
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: async (b, e, m) => {
          if (!(await UI.confirm('Sus movimientos pasarán a "Otros".', { ok: 'Eliminar categoría' }))) return;
          Store.deleteCategory(c.id);
          m.close();
        },
      },
    });
    function submit(m) {
      const d = UI.formData(m.$('form'));
      if (!d.name) return UI.toast('Pon un nombre.');
      const data = { name: d.name, icon: d.icon || 'tag', budget: U.round2(U.parseAmount(d.budget)) || 0 };
      let saved;
      if (editing) saved = Store.update('categories', c.id, data);
      else saved = Store.add('categories', { ...data, type: d.type || c.type || 'expense' });
      m.close();
      onSaved && onSaved(saved);
    }
  }

  /* ---------- Nómina ---------- */
  function payroll(p = null, preset = null) {
    const src = p || preset || {};
    const editing = !!(p && p.id);
    const accs = UI.accountOptions();
    const body = `<form class="payroll-form">
      <div class="grid2">
        ${UI.field('Fecha de cobro', UI.input('date', { type: 'date', value: src.date || U.today(), attrs: 'required' }))}
        ${UI.field('Empresa', UI.input('employer', { value: src.employer || '', placeholder: 'Opcional' }))}
      </div>
      ${UI.field('Salario bruto', UI.moneyInput('gross', src.gross, 'autofocus data-calc'))}
      <div class="grid3">
        ${UI.field('IRPF', UI.moneyInput('irpf', src.irpf, 'data-calc'))}
        ${UI.field('Seg. Social', UI.moneyInput('ss', src.ss, 'data-calc'))}
        ${UI.field('Otras deducciones', UI.moneyInput('other', src.other, 'data-calc'))}
      </div>
      <div class="net-box">
        <div><span class="muted">Líquido a percibir</span><span class="pct-info muted"></span></div>
        ${UI.moneyInput('net', src.net)}
      </div>
      <p class="field-h">El neto se calcula solo (bruto − deducciones). Puedes escribirlo a mano si tu nómina incluye otros conceptos.</p>
      <div class="grid2">
        ${UI.field('Cuenta de cobro', UI.select('accountId', accs, src.accountId || (accs[0] || {}).value))}
        ${UI.field('Nota', UI.input('note', { value: src.note || '', placeholder: 'Opcional' }))}
      </div>
      ${UI.check('extra', 'Es una paga extra', !!src.extra)}
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: editing ? 'Editar nómina' : 'Nueva nómina', body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">${icon('check', 18)} Guardar nómina</button>`,
      onMount: (m) => {
        let netTouched = editing;
        const val = (n) => U.parseAmount(m.$(`[name=${n}]`).value) || 0;
        const recalc = () => {
          const g = val('gross'), ded = val('irpf') + val('ss') + val('other');
          if (!netTouched && g) m.$('[name=net]').value = U.inputAmount(U.round2(g - ded));
          m.$('.pct-info').textContent = g ? `IRPF ${U.pct(val('irpf') / g, 1)} · Deducciones ${U.pct(ded / g, 1)}` : '';
        };
        m.$$('[data-calc]').forEach((i) => i.addEventListener('input', recalc));
        m.$('[name=net]').addEventListener('input', () => { netTouched = true; });
        recalc();
      },
      actions: {
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: async (b, e, m) => {
          if (!(await UI.confirm('Se eliminará la nómina y su ingreso asociado.', { ok: 'Eliminar' }))) return;
          Store.deletePayroll(p.id);
          m.close();
        },
      },
    });
    function submit(m) {
      const d = UI.formData(m.$('form'));
      const num = (k) => U.round2(U.parseAmount(d[k])) || 0;
      const rec = { date: d.date, employer: d.employer, gross: num('gross'), irpf: num('irpf'), ss: num('ss'), other: num('other'), net: num('net'), accountId: d.accountId, note: d.note, extra: !!d.extra };
      if (!rec.net && rec.gross) rec.net = U.round2(rec.gross - rec.irpf - rec.ss - rec.other);
      if (!(rec.net > 0)) return UI.toast('Indica el bruto o el neto de la nómina.');
      if (editing) rec.id = p.id;
      Store.savePayroll(rec);
      UI.toast(editing ? 'Nómina actualizada' : `Nómina de ${U.money(rec.net)} registrada como ingreso`);
      m.close();
    }
  }

  function payrollCalculator() {
    const body = `<form class="calc-form">
      ${UI.field('Salario bruto anual', UI.moneyInput('gross', 30000, 'autofocus'))}
      <div class="grid3">
        ${UI.field('Nº de pagas', UI.select('pays', [{ value: 12, label: '12 pagas' }, { value: 14, label: '14 pagas' }], 14))}
        ${UI.field('IRPF (%)', UI.input('irpf', { value: '15', attrs: 'inputmode="decimal"' }))}
        ${UI.field('Seg. Social (%)', UI.input('ss', { value: '6,5', attrs: 'inputmode="decimal"' }))}
      </div>
      <div class="calc-out"></div>
      <p class="field-h">Estimación orientativa. Tu porcentaje real de IRPF aparece en tu nómina; la cotización del trabajador ronda el 6,5 %.</p>
    </form>`;
    UI.modal({
      title: 'Calculadora de nómina', body,
      onMount: (m) => {
        const run = () => {
          const d = UI.formData(m.$('form'));
          const g = U.parseAmount(d.gross) || 0, pays = +d.pays || 14;
          const irpf = (U.parseAmount(d.irpf) || 0) / 100, ss = (U.parseAmount(d.ss) || 0) / 100;
          const ssY = g * ss, irpfY = g * irpf, net = g - ssY - irpfY;
          m.$('.calc-out').innerHTML = `
            <div class="kv"><span>Neto anual</span><b class="tnum">${U.money(net)}</b></div>
            <div class="kv"><span>Neto por paga (${pays})</span><b class="tnum">${U.money(net / pays)}</b></div>
            <div class="kv"><span>Neto mensual prorrateado</span><b class="tnum">${U.money(net / 12)}</b></div>
            <div class="kv"><span>IRPF anual</span><span class="tnum">${U.money(irpfY)}</span></div>
            <div class="kv"><span>Seguridad Social anual</span><span class="tnum">${U.money(ssY)}</span></div>
            <div class="kv"><span>Bruto mensual (${pays} pagas)</span><span class="tnum">${U.money(g / pays)}</span></div>`;
        };
        m.$('form').addEventListener('input', run);
        m.$('form').addEventListener('change', run);
        run();
      },
    });
  }

  /* ---------- Recurrente ---------- */
  function recurring(r = {}) {
    const editing = !!r.id;
    const st = { type: r.type || 'expense' };
    const accs = UI.accountOptions();
    const catSelect = () => UI.field('Categoría', UI.select('categoryId', UI.categoryOptions(st.type), r.categoryId));
    const body = `<form>
      ${UI.seg('recType', [{ value: 'expense', label: 'Gasto fijo' }, { value: 'income', label: 'Ingreso fijo' }], st.type, 'recType')}
      ${UI.field('Concepto', UI.input('name', { value: r.name || '', placeholder: 'p. ej. Alquiler, Netflix, Gimnasio', attrs: 'required autofocus' }))}
      <div class="grid2">
        ${UI.field('Importe', UI.moneyInput('amount', r.amount))}
        <div class="cat-sel">${catSelect()}</div>
      </div>
      <div class="grid2">
        ${UI.field('Frecuencia', UI.select('freq', [{ value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }, { value: 'yearly', label: 'Anual' }, { value: 'daily', label: 'Diaria' }], r.freq || 'monthly'))}
        ${UI.field('Cada', UI.input('interval', { type: 'number', value: r.interval || 1, attrs: 'min="1" max="36"' }), 'p. ej. cada 3 meses')}
      </div>
      <div class="grid2">
        ${UI.field(editing ? 'Próximo cargo' : 'Primer cargo', UI.input('startDate', { type: 'date', value: editing ? r.nextDate : U.today(), attrs: 'required' }))}
        ${UI.field('Hasta (opcional)', UI.input('endDate', { type: 'date', value: r.endDate || '' }))}
      </div>
      ${UI.field('Cuenta', UI.select('accountId', accs, r.accountId || (accs[0] || {}).value))}
      ${UI.check('autoAdd', 'Registrar automáticamente cada vez que venza', r.autoAdd !== false)}
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: editing ? 'Editar recurrente' : 'Nuevo gasto o ingreso fijo', body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">Guardar</button>`,
      onMount: (m) => UI.animateSegs(m.el),
      actions: {
        recType: (b, e, m) => { UI.segSelect(b); st.type = b.dataset.value; m.$('.cat-sel').innerHTML = catSelect(); },
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: async (b, e, m) => {
          if (!(await UI.confirm('Se eliminará el recurrente. Los movimientos ya registrados se conservan.', { ok: 'Eliminar' }))) return;
          Store.remove('recurring', r.id);
          m.close();
        },
      },
    });
    function submit(m) {
      const d = UI.formData(m.$('form'));
      const amount = U.round2(U.parseAmount(d.amount));
      if (!d.name) return UI.toast('Pon un concepto.');
      if (!(amount > 0)) return UI.toast('Introduce un importe.');
      const data = {
        type: st.type, name: d.name, amount, categoryId: d.categoryId, accountId: d.accountId, freq: d.freq,
        interval: Math.max(1, parseInt(d.interval, 10) || 1), endDate: d.endDate || '', autoAdd: !!d.autoAdd,
      };
      if (editing) {
        Store.update('recurring', r.id, { ...data, nextDate: d.startDate, startDate: r.startDate || d.startDate });
      } else {
        Store.add('recurring', { ...data, startDate: d.startDate, nextDate: d.startDate, active: true });
      }
      const n = Store.processRecurring();
      UI.toast(n ? `Guardado. ${n} movimiento(s) registrados.` : 'Recurrente guardado');
      m.close();
    }
  }

  /* ---------- Meta de ahorro ---------- */
  function goal(g = {}) {
    const editing = !!g.id;
    const body = `<form>
      ${UI.field('Nombre de la meta', UI.input('name', { value: g.name || '', placeholder: 'p. ej. Fondo de emergencia, Viaje, Coche', attrs: 'required autofocus' }))}
      <div class="grid2">
        ${UI.field('Objetivo', UI.moneyInput('target', g.target))}
        ${editing ? UI.field('Fecha límite', UI.input('deadline', { type: 'date', value: g.deadline || '' })) : UI.field('Ya ahorrado', UI.moneyInput('initial', ''))}
      </div>
      ${editing ? '' : UI.field('Fecha límite (opcional)', UI.input('deadline', { type: 'date', value: '' }))}
      ${UI.field('Icono', UI.iconPicker('icon', g.icon || 'target'))}
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: editing ? 'Editar meta' : 'Nueva meta de ahorro', body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">Guardar</button>`,
      actions: {
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: async (b, e, m) => {
          if (!(await UI.confirm('Se eliminará la meta y su historial.', { ok: 'Eliminar' }))) return;
          Store.remove('goals', g.id);
          m.close();
        },
      },
    });
    function submit(m) {
      const d = UI.formData(m.$('form'));
      const target = U.round2(U.parseAmount(d.target));
      if (!d.name || !(target > 0)) return UI.toast('Indica nombre y objetivo.');
      if (editing) Store.update('goals', g.id, { name: d.name, target, deadline: d.deadline || '', icon: d.icon || 'target' });
      else {
        const init = U.round2(U.parseAmount(d.initial)) || 0;
        Store.add('goals', { name: d.name, target, deadline: d.deadline || '', icon: d.icon || 'target', createdAt: U.today(), history: init ? [{ id: U.uid(), date: U.today(), amount: init, note: 'Saldo inicial' }] : [] });
      }
      m.close();
    }
  }
  function goalMove(g) {
    const body = `<form>
      ${UI.seg('goalDir', [{ value: 'in', label: 'Aportar' }, { value: 'out', label: 'Retirar' }], 'in', 'goalDir')}
      ${UI.field('Importe', UI.moneyInput('amount', '', 'autofocus'))}
      ${UI.field('Fecha', UI.input('date', { type: 'date', value: U.today() }))}
      ${UI.field('Nota', UI.input('note', { placeholder: 'Opcional' }))}
      <button type="submit" hidden></button>
    </form>`;
    let dir = 'in';
    UI.modal({
      title: g.name, body,
      footer: `<button class="btn btn-primary" data-action="save">Guardar</button>`,
      onMount: (m) => UI.animateSegs(m.el),
      actions: {
        goalDir: (b) => { UI.segSelect(b); dir = b.dataset.value; },
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
      },
    });
    function submit(m) {
      const d = UI.formData(m.$('form'));
      const a = U.round2(U.parseAmount(d.amount));
      if (!(a > 0)) return UI.toast('Introduce un importe.');
      Store.batch((s) => {
        const goalRec = s.goals.find((x) => x.id === g.id);
        goalRec.history = goalRec.history || [];
        goalRec.history.push({ id: U.uid(), date: d.date || U.today(), amount: dir === 'in' ? a : -a, note: d.note || '' });
      });
      UI.toast(dir === 'in' ? `+${U.money(a)} a "${g.name}"` : `−${U.money(a)} de "${g.name}"`);
      m.close();
    }
  }

  /* ---------- Deudas ---------- */
  function debt(d = {}) {
    const editing = !!d.id;
    const st = { direction: d.direction || 'owe' };
    const body = `<form>
      ${UI.seg('debtDir', [{ value: 'owe', label: 'Yo debo' }, { value: 'owed', label: 'Me deben' }], st.direction, 'debtDir')}
      ${UI.field('Persona o entidad', UI.input('name', { value: d.name || '', placeholder: 'p. ej. Banco, Préstamo coche, Ana', attrs: 'required autofocus' }))}
      <div class="grid2">
        ${UI.field('Importe total', UI.moneyInput('total', d.total))}
        ${UI.field('Vencimiento (opcional)', UI.input('dueDate', { type: 'date', value: d.dueDate || '' }))}
      </div>
      <div class="grid2">
        ${UI.field('Interés anual % (opcional)', UI.input('rate', { value: d.rate ? String(d.rate).replace('.', ',') : '', attrs: 'inputmode="decimal"' }))}
        ${UI.field('Cuota mensual (opcional)', UI.moneyInput('installment', d.installment))}
      </div>
      ${UI.field('Nota', UI.input('note', { value: d.note || '', placeholder: 'Opcional' }))}
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: editing ? 'Editar deuda' : 'Nueva deuda o préstamo', body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">Guardar</button>`,
      onMount: (m) => UI.animateSegs(m.el),
      actions: {
        debtDir: (b) => { UI.segSelect(b); st.direction = b.dataset.value; },
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: async (b, e, m) => {
          if (!(await UI.confirm('Se eliminará la deuda. Los movimientos de pagos ya registrados se conservan.', { ok: 'Eliminar' }))) return;
          Store.remove('debts', d.id);
          m.close();
        },
      },
    });
    function submit(m) {
      const f = UI.formData(m.$('form'));
      const total = U.round2(U.parseAmount(f.total));
      if (!f.name || !(total > 0)) return UI.toast('Indica nombre e importe.');
      const data = { direction: st.direction, name: f.name, total, dueDate: f.dueDate || '', rate: U.parseAmount(f.rate) || 0, installment: U.round2(U.parseAmount(f.installment)) || 0, note: f.note || '' };
      if (editing) Store.update('debts', d.id, data);
      else Store.add('debts', { ...data, payments: [], createdAt: U.today() });
      m.close();
    }
  }
  function debtPayment(d) {
    const left = Store.debtLeft(d);
    const owe = d.direction === 'owe';
    const accs = UI.accountOptions();
    const body = `<form>
      <p class="muted">Pendiente: <b class="tnum">${U.money(left)}</b></p>
      ${UI.field('Importe', UI.moneyInput('amount', d.installment && d.installment < left ? d.installment : left, 'autofocus'))}
      <div class="grid2">
        ${UI.field('Fecha', UI.input('date', { type: 'date', value: U.today() }))}
        ${UI.field('Cuenta', UI.select('accountId', accs, (accs[0] || {}).value))}
      </div>
      ${UI.check('register', owe ? 'Registrar también como gasto' : 'Registrar también como ingreso', true)}
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: owe ? `Pagar a ${d.name}` : `Cobro de ${d.name}`, body,
      footer: `<button class="btn btn-primary" data-action="save">Registrar ${owe ? 'pago' : 'cobro'}</button>`,
      actions: { save: (b, e, m) => submit(m), submit: (f, e, m) => submit(m) },
    });
    function submit(m) {
      const f = UI.formData(m.$('form'));
      const amount = U.round2(U.parseAmount(f.amount));
      if (!(amount > 0)) return UI.toast('Introduce un importe.');
      Store.addDebtPayment(d.id, { amount, date: f.date || U.today(), register: !!f.register, accountId: f.accountId });
      UI.toast(`${owe ? 'Pago' : 'Cobro'} de ${U.money(amount)} registrado`);
      m.close();
    }
  }

  /* ---------- Inversiones ---------- */
  function investment(i = {}) {
    const editing = !!i.id;
    const kinds = ['Acciones', 'Fondos indexados', 'ETF', 'Criptomonedas', 'Plan de pensiones', 'Depósito', 'Inmuebles', 'Otro'];
    const body = `<form>
      ${UI.field('Nombre', UI.input('name', { value: i.name || '', placeholder: 'p. ej. MSCI World, Bitcoin', attrs: 'required autofocus' }))}
      ${UI.field('Tipo', UI.select('kind', kinds.map((k) => ({ value: k, label: k })), i.kind || 'Fondos indexados'))}
      <div class="grid2">
        ${UI.field('Capital invertido', UI.moneyInput('invested', i.invested))}
        ${UI.field('Valor actual', UI.moneyInput('value', i.value))}
      </div>
      ${UI.field('Nota', UI.input('note', { value: i.note || '', placeholder: 'Broker, ISIN…' }))}
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: editing ? 'Editar inversión' : 'Nueva inversión', body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">Guardar</button>`,
      actions: {
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: async (b, e, m) => {
          if (!(await UI.confirm('Se eliminará esta inversión.', { ok: 'Eliminar' }))) return;
          Store.remove('investments', i.id);
          m.close();
        },
      },
    });
    function submit(m) {
      const f = UI.formData(m.$('form'));
      const invested = U.round2(U.parseAmount(f.invested)) || 0;
      let value = U.round2(U.parseAmount(f.value));
      if (!isFinite(value)) value = invested;
      if (!f.name) return UI.toast('Pon un nombre.');
      const data = { name: f.name, kind: f.kind, invested, value, note: f.note || '', updated: U.today() };
      if (editing) Store.update('investments', i.id, data);
      else Store.add('investments', data);
      m.close();
    }
  }

  /* ---------- Cuentas bancarias y efectivo ---------- */
  const ACCOUNT_ICON_CHOICES = ['bank', 'card', 'wallet', 'home', 'mapPin', 'target', 'briefcase', 'package', 'shield', 'layers', 'dollar', 'globe', 'star', 'user'];
  const DEFAULT_ACCOUNT_ICON = { banco: 'bank', efectivo: 'home', tarjeta: 'card', ahorro: 'target', otra: 'layers' };

  function account(a = {}) {
    const editing = !!a.id;
    const cash = (a.type || 'banco') === 'efectivo';
    const balance = editing ? Store.accountBalance(a.id) : a.initial || '';
    const types = [{ value: 'banco', label: 'Cuenta bancaria' }, { value: 'efectivo', label: 'Efectivo en un lugar' }, { value: 'ahorro', label: 'Cuenta de ahorro' }, { value: 'tarjeta', label: 'Tarjeta' }, { value: 'otra', label: 'Otra' }];
    const texts = (isCash) => isCash
      ? { name: 'Nombre del lugar', ph: 'p. ej. Casa, Casa de la playa, Cartera, Caja fuerte', place: 'Dónde está exactamente', placePh: 'p. ej. Cajón del dormitorio' }
      : { name: 'Nombre de la cuenta', ph: 'p. ej. BBVA nómina, Revolut, ING ahorro', place: 'Nota', placePh: 'p. ej. IBAN terminado en 1234' };
    const t0 = texts(cash);
    const body = `<form>
      ${UI.field('Tipo', UI.select('type', types, a.type || 'banco', 'data-acc-type'))}
      <label class="field"><span class="field-l" data-l="name">${t0.name}</span>${UI.input('name', { value: a.name || '', placeholder: t0.ph, attrs: 'required autofocus maxlength="40"' })}</label>
      ${UI.field(editing ? 'Saldo actual' : 'Cuánto hay ahora', UI.moneyInput('balance', balance), editing ? 'Si lo cambias se guarda como ajuste de saldo: cambia tu patrimonio pero no cuenta como gasto ni ingreso.' : 'Se suma a tu patrimonio desde hoy. Puede ser negativo, por ejemplo en una tarjeta.')}
      <label class="field"><span class="field-l" data-l="place">${t0.place}</span>${UI.input('place', { value: a.place || '', placeholder: t0.placePh, attrs: 'maxlength="60"' })}</label>
      ${UI.field('Icono', UI.iconPicker('icon', a.icon || DEFAULT_ACCOUNT_ICON[a.type || 'banco'], ACCOUNT_ICON_CHOICES))}
      <button type="submit" hidden></button>
    </form>`;
    const footer = !editing
      ? `<button class="btn btn-primary" data-action="save">${icon('check', 18)} Añadir</button>`
      : a.archived
        ? `<button class="btn btn-danger-ghost" data-action="remove">${icon('trash', 18)} Eliminar</button><button class="btn" data-action="restore">${icon('rotate', 18)} Restaurar</button><button class="btn btn-primary" data-action="save">Guardar</button>`
        : `<button class="btn btn-danger-ghost" data-action="remove">${icon('trash', 18)} Quitar</button><button class="btn btn-primary" data-action="save">Guardar</button>`;
    UI.modal({
      title: editing ? (cash ? 'Editar efectivo' : 'Editar cuenta') : (cash ? 'Nuevo lugar con efectivo' : 'Nueva cuenta'),
      body, footer,
      onMount: (m) => {
        m.$('[data-acc-type]').addEventListener('change', (e) => {
          const t = texts(e.target.value === 'efectivo');
          m.$('[data-l=name]').textContent = t.name;
          m.$('[name=name]').placeholder = t.ph;
          m.$('[data-l=place]').textContent = t.place;
          m.$('[name=place]').placeholder = t.placePh;
          if (!editing) {
            const r = m.$(`.icon-picker input[value="${DEFAULT_ACCOUNT_ICON[e.target.value]}"]`);
            if (r) r.checked = true;
          }
        });
      },
      actions: {
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        remove: (b, e, m) => removeAccount(a, () => m.close()),
        restore: (b, e, m) => { Store.update('accounts', a.id, { archived: false }); UI.toast(`${a.name} vuelve a contar en tu patrimonio`); m.close(); },
      },
    });
    function submit(m) {
      const f = UI.formData(m.$('form'));
      if (!f.name) return UI.toast('Pon un nombre.');
      const target = U.round2(U.parseAmount(f.balance)) || 0;
      const data = { name: f.name, type: f.type, place: f.place || '', icon: f.icon || DEFAULT_ACCOUNT_ICON[f.type] };
      if (editing) {
        Store.update('accounts', a.id, data);
        const delta = U.round2(target - Store.accountBalance(a.id));
        if (delta) {
          const tx = Store.adjustBalance(a.id, delta, { note: 'Ajuste de saldo' });
          UI.toast(`Saldo de ${data.name}: ${U.money(target)}`, { action: 'Deshacer', onAction: () => Store.remove('transactions', tx.id) });
        } else UI.toast('Cambios guardados');
      } else {
        Store.add('accounts', { ...data, initial: target });
        UI.toast(`${data.name} añadida con ${U.money(target)}`);
      }
      m.close();
    }
  }

  /* Ajustar el saldo de una cuenta: fijar el total, añadir o retirar dinero. */
  function adjust(a, tx = null) {
    const editing = !!tx;
    const current = Store.accountBalance(a.id);
    let mode = editing ? (tx.amount >= 0 ? 'add' : 'sub') : 'set';
    const opts = editing
      ? [{ value: 'add', label: 'Añadir' }, { value: 'sub', label: 'Retirar' }]
      : [{ value: 'set', label: 'Fijar saldo' }, { value: 'add', label: 'Añadir' }, { value: 'sub', label: 'Retirar' }];
    const labelFor = (md) => (md === 'set' ? 'Saldo real ahora' : md === 'add' ? 'Importe que añades' : 'Importe que retiras');
    const body = `<form>
      ${UI.seg('adjMode', opts, mode, 'adjMode')}
      <label class="field"><span class="field-l" data-l="amt">${labelFor(mode)}</span>${UI.moneyInput('amount', editing ? Math.abs(tx.amount) : mode === 'set' ? current : '', 'autofocus')}</label>
      <div class="adj-preview"></div>
      <div class="grid2">
        ${UI.field('Fecha', UI.input('date', { type: 'date', value: editing ? tx.date : U.today() }))}
        ${UI.field('Motivo', UI.input('note', { value: editing ? tx.note || '' : '', placeholder: 'p. ej. Recuento, regalo, cuadre' }))}
      </div>
      <p class="field-h">Los ajustes cambian tu patrimonio, pero no cuentan como gasto ni como ingreso en tus estadísticas. Para apuntar una compra usa «Añadir movimiento».</p>
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: `${editing ? 'Editar ajuste' : 'Ajustar saldo'} · ${a.name}`, body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">${icon('check', 18)} Guardar</button>`,
      onMount: (m) => {
        UI.animateSegs(m.el);
        m.$('[name=amount]').addEventListener('input', () => preview(m));
        preview(m);
      },
      actions: {
        adjMode: (b, e, m) => {
          UI.segSelect(b);
          const prev = mode;
          mode = b.dataset.value;
          m.$('[data-l=amt]').textContent = labelFor(mode);
          const inp = m.$('[name=amount]');
          if (mode === 'set') inp.value = U.inputAmount(current);
          else if (prev === 'set') inp.value = '';
          inp.focus();
          preview(m);
        },
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: async (b, e, m) => {
          if (!(await UI.confirm('Se eliminará este ajuste y el saldo volverá a como estaba.', { ok: 'Eliminar' }))) return;
          const removed = Store.remove('transactions', tx.id);
          m.close();
          UI.toast('Ajuste eliminado', { action: 'Deshacer', onAction: () => Store.add('transactions', removed) });
        },
      },
    });
    function delta(m) {
      const v = U.parseAmount(m.$('[name=amount]').value);
      if (!isFinite(v)) return NaN;
      const base = editing ? current - tx.amount : current;
      if (mode === 'set') return U.round2(v - base);
      return U.round2(mode === 'add' ? Math.abs(v) : -Math.abs(v));
    }
    function preview(m) {
      const d = delta(m);
      const base = editing ? current - tx.amount : current;
      m.$('.adj-preview').innerHTML = isFinite(d)
        ? `<div class="kv"><span>Antes</span><span class="tnum">${U.money(base)}</span></div>
           <div class="kv"><span>Cambio</span><span class="tnum">${d > 0 ? '+' : d < 0 ? '−' : ''}${U.money(Math.abs(d))}</span></div>
           <div class="kv"><span>Después</span><b class="tnum">${U.money(base + d)}</b></div>`
        : `<div class="kv"><span>Saldo actual</span><b class="tnum">${U.money(base)}</b></div>`;
    }
    function submit(m) {
      const d = delta(m);
      if (!isFinite(d)) return UI.toast('Introduce un importe.');
      const f = UI.formData(m.$('form'));
      if (editing) {
        if (!d) return UI.toast('El importe no puede ser 0. Usa Eliminar para quitar el ajuste.');
        Store.update('transactions', tx.id, { amount: d, date: f.date || tx.date, note: f.note || '' });
        UI.toast('Ajuste actualizado');
        return m.close();
      }
      if (!d) return UI.toast('El saldo no cambia.');
      const created = Store.adjustBalance(a.id, d, { date: f.date, note: f.note || (mode === 'set' ? 'Ajuste de saldo' : mode === 'add' ? 'Dinero añadido' : 'Dinero retirado') });
      UI.toast(`${a.name}: ${U.money(Store.accountBalance(a.id))}`, { action: 'Deshacer', onAction: () => Store.remove('transactions', created.id) });
      m.close();
    }
  }

  /* Quitar una cuenta: sin movimientos se borra; con movimientos se elige archivar o borrar todo. */
  async function removeAccount(a, done) {
    const others = Store.state.accounts.filter((x) => x.id !== a.id && !x.archived);
    if (!others.length) return UI.toast('Necesitas al menos otra cuenta activa antes de quitar esta.');
    const n = Store.accountTxCount(a.id);
    const bal = Store.accountBalance(a.id);
    if (!n) {
      if (!(await UI.confirm(`Se eliminará «${a.name}»${bal ? ` y su saldo de ${U.money(bal)} dejará de contar en tu patrimonio` : ''}.`, { ok: 'Eliminar' }))) return;
      Store.remove('accounts', a.id);
      UI.toast(`${a.name} eliminada`);
      return done && done();
    }
    UI.modal({
      title: `Quitar «${a.name}»`, size: 'sm',
      body: `<p class="muted">Tiene <b>${n}</b> movimientos y un saldo de <b class="tnum">${U.money(bal)}</b>.</p>
        <div class="choice-list">
          ${a.archived ? '' : `<button class="choice" data-action="archive"><b>${icon('package', 18)} Archivar</b><span>Desaparece de tus cuentas y del patrimonio. Tus estadísticas y el historial se conservan. Puedes restaurarla cuando quieras.</span></button>`}
          <button class="choice" data-action="hard"><b>${icon('trash', 18)} Eliminar con sus movimientos</b><span>Borra la cuenta y sus ${n} movimientos. Tus totales de gastos e ingresos cambiarán. No se puede deshacer.</span></button>
        </div>`,
      actions: {
        archive: (b, e, m) => {
          Store.update('accounts', a.id, { archived: true });
          UI.toast(`${a.name} archivada`, { action: 'Deshacer', onAction: () => Store.update('accounts', a.id, { archived: false }) });
          m.close();
          done && done();
        },
        hard: async (b, e, m) => {
          if (!(await UI.confirm(`Se borrarán «${a.name}» y sus ${n} movimientos para siempre.`, { ok: 'Eliminar todo' }))) return;
          Store.deleteAccountHard(a.id);
          UI.toast(`${a.name} eliminada`);
          m.close();
          done && done();
        },
      },
    });
  }

  /* ---------- Acceso rápido (favorito) ---------- */
  function quickEdit(q = {}) {
    const editing = !!q.id;
    const st = { type: q.type || 'expense' };
    const catSelect = () => UI.field('Categoría', UI.select('categoryId', UI.categoryOptions(st.type), q.categoryId));
    const body = `<form>
      ${UI.seg('qType', [{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }], st.type, 'qType')}
      ${UI.field('Nombre del botón', UI.input('label', { value: q.label || '', placeholder: 'p. ej. Café, Parking, Bizum', attrs: 'required autofocus maxlength="24"' }))}
      <div class="grid2">
        ${UI.field('Importe fijo', UI.moneyInput('amount', q.amount || ''), 'Vacío = te pregunta el importe')}
        <div class="cat-sel">${catSelect()}</div>
      </div>
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: editing ? 'Editar acceso rápido' : 'Nuevo acceso rápido', body,
      footer: `${editing ? `<button class="btn btn-danger-ghost" data-action="del">${icon('trash', 18)} Eliminar</button>` : ''}<button class="btn btn-primary" data-action="save">Guardar</button>`,
      onMount: (m) => UI.animateSegs(m.el),
      actions: {
        qType: (b, e, m) => { UI.segSelect(b); st.type = b.dataset.value; m.$('.cat-sel').innerHTML = catSelect(); },
        save: (b, e, m) => submit(m),
        submit: (f, e, m) => submit(m),
        del: (b, e, m) => { Store.remove('quick', q.id); m.close(); },
      },
    });
    function submit(m) {
      const f = UI.formData(m.$('form'));
      if (!f.label) return UI.toast('Pon un nombre.');
      const data = { label: f.label, amount: U.round2(U.parseAmount(f.amount)) || 0, categoryId: f.categoryId, type: st.type };
      if (editing) Store.update('quick', q.id, data);
      else Store.add('quick', data);
      m.close();
    }
  }

  /* ---------- Presupuestos ---------- */
  function budgets() {
    const list = Store.cats('expense');
    const body = `<form class="budget-form">
      ${UI.field('Presupuesto mensual total', UI.moneyInput('__total', S().settings.monthlyBudget || ''), 'Opcional. Si lo dejas vacío se usa la suma de las categorías.')}
      <div class="budget-list">${list.map((c) => `
        <label class="budget-item"><span class="cat-ic">${icon(c.icon, 16)}</span><span class="b-name">${U.esc(c.name)}</span>${UI.moneyInput('b_' + c.id, c.budget || '')}</label>`).join('')}
      </div>
      <button type="submit" hidden></button>
    </form>`;
    UI.modal({
      title: 'Asignar presupuestos', body, size: 'lg',
      footer: `<button class="btn btn-primary" data-action="save">Guardar presupuestos</button>`,
      actions: { save: (b, e, m) => submit(m), submit: (f, e, m) => submit(m) },
    });
    function submit(m) {
      const f = UI.formData(m.$('form'));
      Store.batch((s) => {
        s.settings.monthlyBudget = U.round2(U.parseAmount(f.__total)) || 0;
        s.categories.forEach((c) => { if (c.type === 'expense') c.budget = U.round2(U.parseAmount(f['b_' + c.id])) || 0; });
      });
      UI.toast('Presupuestos guardados');
      m.close();
    }
  }

  return { tx, quick, category, payroll, payrollCalculator, recurring, goal, goalMove, debt, debtPayment, investment, account, adjust, removeAccount, quickEdit, budgets };
})();
