'use strict';
/* Utilidades: fechas (siempre en formato local YYYY-MM-DD), periodos, formato y parseo. */
const U = (() => {
  const pad = (n) => String(n).padStart(2, '0');
  const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const today = () => toStr(new Date());
  const addDays = (s, n) => {
    const d = parse(s);
    d.setDate(d.getDate() + n);
    return toStr(d);
  };
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  /* Suma meses manteniendo el día "ancla" (p. ej. día 31 → último día del mes). */
  const addMonths = (s, n, anchorDay) => {
    const d = parse(s);
    const day = anchorDay || d.getDate();
    const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
    t.setDate(Math.min(day, daysInMonth(t.getFullYear(), t.getMonth())));
    return toStr(t);
  };
  const addYears = (s, n, anchorDay) => addMonths(s, 12 * n, anchorDay);
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

  const weekStartOf = (s, ws = 1) => {
    const d = parse(s);
    const diff = (d.getDay() - ws + 7) % 7;
    d.setDate(d.getDate() - diff);
    return toStr(d);
  };

  function range(type, ref, ws = 1) {
    const d = parse(ref);
    switch (type) {
      case 'day': return { start: ref, end: ref };
      case 'week': {
        const s = weekStartOf(ref, ws);
        return { start: s, end: addDays(s, 6) };
      }
      case 'month':
        return {
          start: toStr(new Date(d.getFullYear(), d.getMonth(), 1)),
          end: toStr(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
        };
      case 'year':
      default:
        return { start: `${d.getFullYear()}-01-01`, end: `${d.getFullYear()}-12-31` };
    }
  }
  const shift = (type, ref, n) =>
    type === 'day' ? addDays(ref, n)
      : type === 'week' ? addDays(ref, 7 * n)
        : type === 'month' ? addMonths(ref, n)
          : addYears(ref, n);
  const daysIn = (r) => diffDays(r.start, r.end) + 1;
  /* Días transcurridos del periodo hasta hoy (para medias y proyecciones). */
  function elapsedDays(r) {
    const t = today();
    if (t < r.start) return 0;
    if (t > r.end) return daysIn(r);
    return diffDays(r.start, t) + 1;
  }

  const locale = () => (typeof Store !== 'undefined' && Store.state && Store.state.settings.locale) || 'es-ES';
  const fmtCache = {};
  function fmt(key, opts) {
    const k = locale() + key;
    if (!fmtCache[k]) fmtCache[k] = new Intl.DateTimeFormat(locale(), opts);
    return fmtCache[k];
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function dayLabel(s, long = false) {
    const t = today();
    if (s === t) return 'Hoy';
    if (s === addDays(t, -1)) return 'Ayer';
    if (s === addDays(t, 1)) return 'Mañana';
    const d = parse(s);
    const sameYear = d.getFullYear() === new Date().getFullYear();
    const opts = long
      ? { weekday: 'long', day: 'numeric', month: 'long', year: sameYear ? undefined : 'numeric' }
      : { weekday: 'short', day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' };
    return cap(fmt('d' + long + sameYear, opts).format(d));
  }
  const shortDate = (s) => fmt('sd', { day: 'numeric', month: 'short' }).format(parse(s));
  const fullDate = (s) => fmt('fd', { day: 'numeric', month: 'short', year: 'numeric' }).format(parse(s));
  const monthName = (m, style = 'long') => cap(fmt('m' + style, { month: style }).format(new Date(2020, m, 1)));
  const weekdayShort = (s) => cap(fmt('wd', { weekday: 'short' }).format(parse(s))).replace('.', '');

  function periodLabel(type, ref, ws = 1) {
    const d = parse(ref);
    if (type === 'day') return dayLabel(ref, true);
    if (type === 'week') {
      const r = range('week', ref, ws);
      const a = parse(r.start), b = parse(r.end);
      const left = a.getMonth() === b.getMonth() ? a.getDate() : shortDate(r.start);
      return `${left} – ${shortDate(r.end)} ${b.getFullYear()}`;
    }
    if (type === 'month') return `${monthName(d.getMonth())} ${d.getFullYear()}`;
    return String(d.getFullYear());
  }

  const currency = () => (typeof Store !== 'undefined' && Store.state && Store.state.settings.currency) || 'EUR';
  const numCache = {};
  function nf(key, opts) {
    const k = locale() + currency() + key;
    if (!numCache[k]) numCache[k] = new Intl.NumberFormat(locale(), opts);
    return numCache[k];
  }
  const money = (n, dec = 2) => nf('m' + dec, { style: 'currency', currency: currency(), minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n || 0);
  const money0 = (n) => (Math.abs(n) >= 1000 ? money(n, 0) : money(n));
  /* Formato compacto para ejes: 1,2 mil, 15 mil… */
  const short = (n) => nf('s', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
  const num = (n, dec = 0) => nf('n' + dec, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n || 0);
  const pct = (n, dec = 0) => (isFinite(n) ? `${num(n * 100, dec)} %` : '—');
  const symbol = () => {
    const p = nf('sym', { style: 'currency', currency: currency() }).formatToParts(0).find((x) => x.type === 'currency');
    return p ? p.value : currency();
  };

  /* Acepta "12,50", "12.50", "1.234,56", "1,234.56". */
  function parseAmount(v) {
    if (typeof v === 'number') return v;
    let s = String(v || '').trim().replace(/\s|€|\$|£/g, '');
    if (!s) return NaN;
    const hasC = s.includes(','), hasD = s.includes('.');
    if (hasC && hasD) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (hasC) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (hasD && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');
    }
    const n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  /* Muestra un importe en un input con coma decimal. */
  const inputAmount = (n) => (n || n === 0) && n !== '' ? String(round2(+n)).replace('.', ',') : '';

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };
  const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  return {
    pad, toStr, parse, today, addDays, addMonths, addYears, diffDays, daysInMonth, weekStartOf,
    range, shift, daysIn, elapsedDays, dayLabel, shortDate, fullDate, monthName, weekdayShort, periodLabel,
    money, money0, short, num, pct, symbol, parseAmount, round2, inputAmount, uid, esc, debounce, sum, clamp, cap,
  };
})();
