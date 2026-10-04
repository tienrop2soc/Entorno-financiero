'use strict';
/* Gráficos SVG monocromo con tooltip. Se dibujan midiendo el contenedor real. */
const Charts = (() => {
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return m * p;
  }
  /* Barra con esquinas superiores redondeadas, anclada a la base. */
  function barPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  /**
   * Barras agrupadas.
   * data: [{ label, title, values: [n, n] }]
   * series: [{ name }]
   */
  function bars(el, data, series, { height = 220, aria = 'Gráfico de barras' } = {}) {
    if (!el) return;
    const W = Math.max(260, el.clientWidth || 600), H = height;
    const padL = 46, padR = 6, padT = 10, padB = 26;
    const iw = W - padL - padR, ih = H - padT - padB;
    const max = niceMax(Math.max(0, ...data.flatMap((d) => d.values)));
    const slot = iw / Math.max(1, data.length);
    const ns = series.length, gap = 2;
    const groupW = Math.max(2, Math.min(slot * 0.74, ns * 26));
    const bw = Math.max(1.5, (groupW - gap * (ns - 1)) / ns);
    let g = '';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = (max * i) / ticks, y = padT + ih - (ih * i) / ticks;
      g += `<line x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}" class="gridline${i === 0 ? ' base' : ''}"/>`;
      g += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" class="axis">${U.esc(U.short(v))}</text>`;
    }
    const maxLabels = Math.max(1, Math.floor(iw / 38));
    const step = Math.ceil(data.length / maxLabels);
    data.forEach((d, i) => {
      const sx = padL + slot * i;
      const x0 = sx + (slot - groupW) / 2;
      d.values.forEach((v, j) => {
        const h = (ih * v) / max;
        if (h > 0) g += `<path d="${barPath(x0 + j * (bw + gap), padT + ih - h, bw, Math.max(h, 1), 4)}" class="bar s${j}"/>`;
      });
      if (i % step === 0) g += `<text x="${sx + slot / 2}" y="${H - 8}" text-anchor="middle" class="axis">${U.esc(d.label)}</text>`;
      const tip = `<b>${U.esc(d.title || d.label)}</b>` + series.map((s, j) => `<div class="tt-row"><i class="sw s${j}"></i>${U.esc(s.name)}<span>${U.money(d.values[j])}</span></div>`).join('');
      g += `<rect x="${sx}" y="${padT}" width="${slot}" height="${ih}" class="hit" data-tip="${U.esc(tip)}"/>`;
    });
    el.innerHTML = `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${U.esc(aria)}">${g}</svg>`;
  }

  function legend(series) {
    return `<div class="legend">${series.map((s, j) => `<span><i class="sw s${j}"></i>${U.esc(s.name)}</span>`).join('')}</div>`;
  }

  /* Datos ingresos/gastos para el periodo activo, con sub-unidad automática. */
  function periodSeries(type, ref, ws) {
    const r = U.range(type, ref, ws);
    if (type === 'year') {
      const y = r.start.slice(0, 4);
      const m = Store.series(r, 'month');
      return Array.from({ length: 12 }, (_, i) => {
        const k = `${y}-${U.pad(i + 1)}`, e = m[k] || { income: 0, expense: 0 };
        return { label: U.monthName(i, 'short').replace('.', ''), title: `${U.monthName(i)} ${y}`, values: [e.income, e.expense], key: k };
      });
    }
    let start = r.start, n = U.daysIn(r);
    if (type === 'day') { start = U.addDays(ref, -6); n = 7; }
    const m = Store.series({ start, end: U.addDays(start, n - 1) }, 'day');
    return Array.from({ length: n }, (_, i) => {
      const d = U.addDays(start, i), e = m[d] || { income: 0, expense: 0 };
      const label = type === 'month' ? String(U.parse(d).getDate()) : U.weekdayShort(d);
      return { label, title: U.dayLabel(d, true), values: [e.income, e.expense], key: d };
    });
  }

  return { bars, legend, periodSeries, niceMax };
})();
