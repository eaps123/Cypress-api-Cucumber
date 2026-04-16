// Helpers compartilhados entre excelUtils.js e excelPMTapi.js

/**
 * parseDDMMYYYY - parses "dd/MM/yyyy" -> Date or null
 */
function parseDDMMYYYY(s) {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]), month = Number(m[2]) - 1, year = Number(m[3]);
  const d = new Date(year, month, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * excelSerialToDate - convert Excel serial (number) to JS Date (UTC)
 * uses epoch 1899-12-30 and accounts for Excel leap-year bug by treating serial >= 60
 */
function excelSerialToDate(serial) {
  if (typeof serial !== 'number' || Number.isNaN(serial)) return null;
  // Excel considers 1900 as leap year bug: dates >= 60 are offset by 1
  const offset = serial >= 60 ? serial - 1 : serial;
  const epoch = Date.UTC(1899, 11, 30); // 1899-12-30
  const ms = Math.round(offset * 24 * 60 * 60 * 1000);
  const d = new Date(epoch + ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * toDateOnly - normalize various inputs to a Date at local 00:00 (or null)
 * accepts Date, "dd/MM/yyyy", ISO strings, numeric Excel serials and JS timestamps
 */
function toDateOnly(value) {
  if (value == null || value === '') return null;

  // Date instance
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const d = value;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // String: try dd/MM/yyyy then ISO
  if (typeof value === 'string') {
    const d1 = parseDDMMYYYY(value);
    if (d1) return new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const iso = new Date(value);
    if (!Number.isNaN(iso.getTime())) return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());
    return null;
  }

  // Number: try excel serial -> date, or JS timestamp
  if (typeof value === 'number' && !Number.isNaN(value)) {
    // if large (e.g. > 1e11) probably timestamp ms; if small (< 300000) treat as excel serial
    if (Math.abs(value) > 1e11) { // likely JS timestamp ms
      const t = new Date(value);
      if (!Number.isNaN(t.getTime())) return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    } else {
      const ex = excelSerialToDate(value);
      if (ex) return new Date(ex.getFullYear(), ex.getMonth(), ex.getDate());
    }
  }

  // fallback: try Date constructor
  try {
    const maybe = new Date(value);
    if (!Number.isNaN(maybe.getTime())) return new Date(maybe.getFullYear(), maybe.getMonth(), maybe.getDate());
  } catch (e) {
    /* ignore */
  }
  return null;
}

/**
 * formatDateToDDMMYYYY - Date -> "dd/MM/yyyy" or empty string
 */
function formatDateToDDMMYYYY(d) {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * normalizeNumberString - "1.234,56" -> Number
 */
function normalizeNumberString(s) {
  if (typeof s !== 'string') return NaN;
  return Number(s.replace(/\./g, '').replace(',', '.').replace('%', ''));
}

/**
 * normalizeValue - generic normalizer for cell values/strings used by both modules
 * - trims strings
 * - converts BR number formatted strings to Number when detected
 */
function normalizeValue(v) {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') {
    const s = v.trim();
    // Common BR number styles: "1.234,56" or "1234,56" or "1234"
    if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(s) || /^-?\d+(,\d+)?$/.test(s)) {
      const n = normalizeNumberString(s);
      return Number.isNaN(n) ? s : n;
    }
    return s;
  }
  return v;
}

module.exports = {
  parseDDMMYYYY,
  toDateOnly,
  formatDateToDDMMYYYY,
  normalizeNumberString,
  normalizeValue,
  // exported for tests/diagnostics
  _internal: { excelSerialToDate },
}