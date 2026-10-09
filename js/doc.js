/* Render del documento A4: cabecera, datos, tabla de partidas, totales y pie. */

import { money, num, formatDate, number, round2, esc } from "./format.js";
import { brandLogos } from "./defaults.js";

/* ------------------------------------------------------------- cálculos -- */

export function lineTotal(line) {
  const base = number(line.price) * number(line.qty, 1);
  const factor = 1 - number(line.discount) / 100;
  return round2(base * factor);
}

export function totals(quote) {
  const lines = quote.lines || [];
  // Las filas destacadas (p. ej. «TOTAL ESTIMADO») resumen la tabla: su importe
  // no se suma; sólo se comprueba que cuadre con el resto de partidas.
  const summable = lines.filter((line) => !line.highlight);
  const sum = (items) => round2(items.reduce((acc, line) => acc + lineTotal(line), 0));
  const base = sum(summable);
  const vatRate = number(quote.vatRate);
  const vat = round2((base * vatRate) / 100);
  const grand = round2(base + vat);
  const discount = round2(
    summable.reduce(
      (acc, line) => acc + number(line.price) * number(line.qty, 1) - lineTotal(line),
      0,
    ),
  );
  const declared = lines.filter((line) => line.highlight);
  const declaredTotal = declared.length ? sum(declared) : null;
  const mismatch =
    declaredTotal !== null && Math.abs(declaredTotal - base) > 0.01 ? round2(declaredTotal - base) : null;
  return { base, vat, vatRate, grand, discount, declaredTotal, mismatch };
}

const qtyText = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const parsed = number(value, NaN);
  if (!Number.isFinite(parsed)) return String(value);
  return num(parsed, "es-ES", parsed % 1 === 0 ? 2 : 2);
};

/* --------------------------------------------------------------- piezas -- */

function logoFor(settings) {
  const logos = brandLogos();
  if (settings.logoCustom) return settings.logoCustom;
  return settings.theme === "paper" ? logos.ink : logos.white;
}

export function headHTML(settings, quote) {
  const logoSrc = logoFor(settings);
  return `
  <header class="doc-head">
    <div class="doc-head__brand">
      <img class="doc-head__logo" src="${esc(logoSrc)}" alt="${esc(settings.company)}">
      ${settings.tagline ? `<span class="doc-head__tagline">${esc(settings.tagline)}</span>` : ""}
    </div>
    <div class="doc-head__contact">
      <strong>${esc(settings.company)}</strong>
      ${settings.email ? `<div>${esc(settings.email)}</div>` : ""}
      ${settings.website ? `<div>${esc(settings.website)}</div>` : ""}
      ${settings.location ? `<div>${esc(settings.location)}</div>` : ""}
    </div>
  </header>`;
}

export function metaHTML(settings, quote) {
  const hasSubtitle = Boolean(String(quote.subtitle || "").trim());
  return `
  <div class="doc-title-row">
    <div>
      <p class="doc-eyebrow">Presupuesto</p>
      <h1 class="doc-title">${esc(quote.title || "Presupuesto")}</h1>
      ${hasSubtitle ? `<p class="doc-subtitle">${esc(quote.subtitle)}</p>` : ""}
    </div>
    <dl class="doc-meta">
      <div class="doc-meta__row">
        <dt>Nº</dt><dd>${esc(quote.number || "—")}</dd>
      </div>
      <div class="doc-meta__row">
        <dt>Fecha</dt><dd>${esc(formatDate(quote.date, settings.locale))}</dd>
      </div>
    </dl>
  </div>`;
}

export function clientHTML(settings, quote) {
  const client = quote.client || {};
  const contact = [client.taxId && `C.I.F./N.I.F.: ${client.taxId}`, client.phone && `Tel.: ${client.phone}`, client.email && `Email: ${client.email}`]
    .filter(Boolean)
    .join(" · ");

  return `
  <section class="doc-client">
    <div class="client-card">
      <span class="client-card__icon" aria-hidden="true">◆</span>
      <dl>
        <dt>${esc(client.name || "Cliente")}</dt>
        ${client.address ? `<dd>${esc(client.address)}</dd>` : ""}
        ${client.city ? `<dd>${esc(client.city)}</dd>` : ""}
        ${contact ? `<dd>${esc(contact)}</dd>` : ""}
      </dl>
    </div>
    ${
      String(quote.scope || "").trim()
        ? `<p class="doc-scope"><span class="doc-scope__label">Alcance:</span> ${esc(quote.scope)}</p>`
        : ""
    }
  </section>`;
}

export function tableHeadHTML(quote) {
  const showDiscount = quote.showDiscount !== false;
  return `
      <thead>
        <tr>
          <th class="col-num">Nº.</th>
          <th class="col-desc">Descripción</th>
          <th class="col-qty">Cantidad</th>
          <th class="col-price">Precio</th>
          ${showDiscount ? `<th class="col-disc">Dto.</th>` : ""}
          <th class="col-total">Total</th>
        </tr>
      </thead>`;
}

export function colgroupHTML(quote) {
  return quote.template === "classic"
    ? `<colgroup><col style="width:26%"><col style="width:46%"><col style="width:14%"><col style="width:14%"></colgroup>`
    : `<colgroup>
        <col class="col-num"><col class="col-desc"><col class="col-qty"><col class="col-price">
        ${quote.showDiscount !== false ? `<col class="col-disc">` : ""}
        <col class="col-total">
      </colgroup>`;
}

export function tableHeadClassicHTML() {
  return `
      <thead>
        <tr>
          <th class="col-partida">Partida</th>
          <th class="col-desc">Detalle</th>
          <th class="col-qty">Cantidad</th>
          <th class="col-total">Importe</th>
        </tr>
      </thead>`;
}

export function rowHTML(line, index, quote, settings) {
  const classic = quote.template === "classic";
  const classes = line.highlight ? ' class="is-highlight"' : "";
  const detail = String(line.detail || "").trim();
  const qtyDetail = String(line.qtyDetail || "").trim();

  if (classic) {
    return `
        <tr${classes} data-line-row="${esc(line.id)}">
          <td class="col-partida"><span class="line-name">${esc(line.name)}</span></td>
          <td class="col-desc">${detail ? `<span class="line-detail">${esc(detail)}</span>` : ""}</td>
          <td class="col-qty">${qtyDetail ? `<span class="line-qty-detail">${esc(qtyDetail)}</span>` : esc(qtyText(line.qty))}</td>
          <td class="col-total">${money(lineTotal(line), settings.locale, settings.currency)}</td>
        </tr>`;
  }

  return `
        <tr${classes} data-line-row="${esc(line.id)}">
          <td class="col-num">${index + 1}.</td>
          <td class="col-desc">
            <span class="line-name">${esc(line.name)}</span>
            ${detail ? `<span class="line-detail">${esc(detail)}</span>` : ""}
            ${qtyDetail ? `<span class="line-qty-detail">${esc(qtyDetail)}</span>` : ""}
          </td>
          <td class="col-qty">${esc(qtyText(line.qty))}</td>
          <td class="col-price">${money(number(line.price), settings.locale, settings.currency)}</td>
          ${
            quote.showDiscount !== false
              ? `<td class="col-disc">${num(number(line.discount), settings.locale, 0)}%</td>`
              : ""
          }
          <td class="col-total">${money(lineTotal(line), settings.locale, settings.currency)}</td>
        </tr>`;
}

export function totalsHTML(settings, quote) {
  const sum = totals(quote);
  const money$ = (value) => money(value, settings.locale, settings.currency);

  return `
  <section class="doc-bottom">
    <div class="doc-notes">
      ${
        String(quote.notes || "").trim()
          ? `<p class="doc-notes__label">Observaciones</p>${String(quote.notes)
              .split("\n")
              .filter((line) => line.trim())
              .map((line) => `<p>${esc(line)}</p>`)
              .join("")}`
          : ""
      }
    </div>
    <div class="doc-totals">
      <div class="doc-totals__grand">
        <span>Total:</span>
        <strong>${money$(sum.grand)}</strong>
      </div>
      <dl>
        ${
          sum.discount > 0
            ? `<div class="doc-totals__row"><dt>Descuentos</dt><dd>−${money$(sum.discount)}</dd></div>`
            : ""
        }
        <div class="doc-totals__row"><dt>Base imponible</dt><dd>${money$(sum.base)}</dd></div>
        <div class="doc-totals__row"><dt>Total I.V.A. (${num(sum.vatRate, settings.locale, 0)} %)</dt><dd>${money$(sum.vat)}</dd></div>
        <div class="doc-totals__row doc-totals__row--strong"><dt>Total presupuesto</dt><dd>${money$(sum.grand)}</dd></div>
      </dl>
      ${
        quote.perUnitLabel
          ? `<p class="doc-perunit">${esc(quote.perUnitLabel)}</p>`
          : quote.perUnitQty > 0
            ? `<p class="doc-perunit">≈ ${money$(sum.grand / number(quote.perUnitQty, 1))} por unidad (${num(number(quote.perUnitQty), settings.locale, 0)})</p>`
            : ""
      }
    </div>
  </section>`;
}

export function footHTML(settings, pageNumber, pageCount) {
  return `
  <footer class="doc-foot">
    <div>
      <div>${esc(settings.company)}${settings.location ? ` · ${esc(settings.location)}` : ""}</div>
      ${settings.website ? `<div>${esc(settings.website)}</div>` : ""}
    </div>
    <div class="doc-foot__page">Página: ${pageNumber} / ${pageCount}</div>
  </footer>`;
}

/** Cuerpo de la tabla (filas) para una página */
export function rowsHTML(quote, settings, fromIndex = 0) {
  return (quote.lines || [])
    .map((line, index) => ({ line, index }))
    .filter(({ index }) => index >= fromIndex)
    .map(({ line, index }) => rowHTML(line, index, quote, settings))
    .join("");
}

export function documentClasses(quote) {
  const classes = ["sheet", "doc"];
  if (quote.template === "classic") classes.push("doc--classic");
  return classes.join(" ");
}

/** Numeración de las partidas tal y como las ve el usuario */
export function numberedLines(quote) {
  return (quote.lines || []).map((line, index) => ({ line, index, total: lineTotal(line) }));
}
