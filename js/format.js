/* Formato de números, moneda y fechas (es-ES por defecto, con alternativa en-US) */

export const CURRENCIES = {
  EUR: { code: "EUR", symbol: "€", label: "Euro (€)" },
  USD: { code: "USD", symbol: "$", label: "Dólar ($)" },
  GBP: { code: "GBP", symbol: "£", label: "Libra (£)" },
};

export function currencyInfo(code) {
  return CURRENCIES[code] || CURRENCIES.EUR;
}

/** 1234.5 -> "1.234,50 €" (es) / "$1,234.50" (en) */
export function money(value, locale = "es-ES", currency = "EUR") {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  const info = currencyInfo(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: info.code,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const num = amount.toFixed(2).replace(".", ",");
    return locale.startsWith("en") ? `${info.symbol}${amount.toFixed(2)}` : `${num} ${info.symbol}`;
  }
}

/** 1234.5 -> "1.234,50" / "1,234.50" */
export function num(value, locale = "es-ES", digits = 2) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return amount.toFixed(digits);
  }
}

/** "2026-09-30" -> "30/09/2026" */
export function formatDate(iso, locale = "es-ES") {
  if (!iso) return "";
  const parts = String(iso).split("-");
  if (parts.length !== 3) return String(iso);
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(date.getTime())) return String(iso);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
}

export function todayISO() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const number = (value, fallback = 0) => {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** Escapa texto para insertarlo como HTML */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
