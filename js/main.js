/* ==========================================================================
   KREA.TURES · Generador de presupuestos
   Estado, editor, previsualización A4 paginada e impresión.
   ========================================================================== */

import { money, num, esc, formatDate, todayISO, currencyInfo } from "./format.js";
import {
  defaultSettings,
  koniecQuote,
  newLine,
  newQuote,
  STORAGE_KEY,
} from "./defaults.js";
import {
  clientHTML,
  colgroupHTML,
  documentClasses,
  footHTML,
  headHTML,
  metaHTML,
  rowHTML,
  tableHeadClassicHTML,
  tableHeadHTML,
  totals,
  totalsHTML,
  lineTotal,
} from "./doc.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const state = { quote: null, settings: null, pages: 1 };

/* ------------------------------------------------------------ persistencia */

function save() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, quote: state.quote, settings: state.settings }),
    );
  } catch (error) {
    console.warn("No se pudo guardar el presupuesto", error);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeQuote(raw) {
  const base = newQuote();
  const quote = { ...base, ...(raw || {}) };
  quote.client = { ...base.client, ...((raw && raw.client) || {}) };
  quote.lines = Array.isArray(raw?.lines) ? raw.lines.map((line) => newLine(line)) : [];
  if (!quote.lines.length) quote.lines.push(newLine({ name: "Nueva partida", qty: 1, price: 0 }));
  if (!quote.date) quote.date = todayISO();
  return quote;
}

/* ------------------------------------------------------------------ toast */

let toastTimer = 0;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add("is-on"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("is-on");
    setTimeout(() => {
      el.hidden = true;
    }, 250);
  }, 2600);
}

/* ------------------------------------------------------------------ líneas */

function afterChange() {
  save();
  renderEditor();
  syncInputs();
  schedulePreview();
}

function addLine(afterId) {
  const line = newLine({ name: "Nueva partida", qty: 1, price: 0 });
  const lines = state.quote.lines;
  const index = afterId ? lines.findIndex((item) => item.id === afterId) : -1;
  if (index >= 0) lines.splice(index + 1, 0, line);
  else lines.push(line);
  afterChange();
  const input = $(`[data-line-field="name"][data-id="${line.id}"]`);
  if (input) {
    input.focus();
    input.select();
  }
}

function removeLine(id) {
  state.quote.lines = state.quote.lines.filter((line) => line.id !== id);
  if (!state.quote.lines.length) {
    state.quote.lines.push(newLine({ name: "Nueva partida", qty: 1, price: 0 }));
  }
  afterChange();
}

function moveLine(id, delta) {
  const lines = state.quote.lines;
  const index = lines.findIndex((line) => line.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= lines.length) return;
  const [item] = lines.splice(index, 1);
  lines.splice(target, 0, item);
  afterChange();
}

function duplicateLine(id) {
  const lines = state.quote.lines;
  const index = lines.findIndex((line) => line.id === id);
  if (index < 0) return;
  lines.splice(index + 1, 0, newLine({ ...lines[index], id: undefined }));
  afterChange();
}

/* ------------------------------------------------------------------ editor */

function lineEditorHTML(line, index) {
  const id = esc(line.id);
  return `
  <article class="line" data-line="${id}" draggable="true">
    <div class="line__head">
      <span class="line__num">${index + 1}</span>
      <span class="line__name">${line.highlight ? "Fila de total" : "Partida"}</span>
      <span class="line__total">${money(lineTotal(line), state.settings.locale, state.settings.currency)}</span>
      <span class="line__tools">
        <button class="btn btn--icon" type="button" data-action="up" data-id="${id}" title="Subir" aria-label="Subir partida">↑</button>
        <button class="btn btn--icon" type="button" data-action="down" data-id="${id}" title="Bajar" aria-label="Bajar partida">↓</button>
        <button class="btn btn--icon" type="button" data-action="duplicate" data-id="${id}" title="Duplicar" aria-label="Duplicar partida">⧉</button>
        <button class="btn btn--icon btn--danger" type="button" data-action="remove" data-id="${id}" title="Eliminar" aria-label="Eliminar partida">✕</button>
      </span>
    </div>
    <div class="grid">
      <label class="field field--full">
        <span class="label">Concepto</span>
        <input type="text" data-line-field="name" data-id="${id}" value="${esc(line.name)}">
      </label>
      <label class="field field--full">
        <span class="label">Detalle</span>
        <textarea data-line-field="detail" data-id="${id}" rows="2">${esc(line.detail)}</textarea>
      </label>
      <label class="field field--full">
        <span class="label">Cantidad detallada (una por línea)</span>
        <textarea data-line-field="qtyDetail" data-id="${id}" rows="2" placeholder="Pared x 4&#10;Suelo x 1">${esc(line.qtyDetail)}</textarea>
      </label>
    </div>
    <div class="line__grid">
      <label class="field">
        <span class="label">Cantidad</span>
        <input type="text" inputmode="decimal" data-line-field="qty" data-id="${id}" value="${esc(line.qty)}">
      </label>
      <label class="field">
        <span class="label">Precio</span>
        <input type="number" step="0.01" inputmode="decimal" data-line-field="price" data-id="${id}" value="${esc(line.price)}">
      </label>
      <label class="field">
        <span class="label">Dto. %</span>
        <input type="number" step="1" inputmode="decimal" data-line-field="discount" data-id="${id}" value="${esc(line.discount)}">
      </label>
      <label class="field">
        <span class="label">Fila de total</span>
        <span class="inline-check">
          <input type="checkbox" data-line-field="highlight" data-id="${id}" ${line.highlight ? "checked" : ""}>
          <span>Sí</span>
        </span>
      </label>
    </div>
  </article>`;
}

function renderEditor() {
  const quote = state.quote;
  $("#lines").innerHTML = quote.lines.length
    ? quote.lines.map(lineEditorHTML).join("")
    : `<p class="empty">Sin partidas. Añade la primera con «Añadir partida».</p>`;
  updateSummary();
  $$("[data-template]").forEach((button) => {
    button.classList.toggle("btn--primary", button.dataset.template === (quote.template || "modern"));
  });
  $$("[data-flag]").forEach((input) => {
    input.checked = Boolean(quote[input.dataset.flag]);
  });
}

function updateSummary() {
  const sum = totals(state.quote);
  const code = state.settings.currency;
  let text =
    `Base ${money(sum.base, state.settings.locale, code)} · ` +
    `IVA ${num(sum.vatRate, state.settings.locale, 0)} % ${money(sum.vat, state.settings.locale, code)} · ` +
    `Total ${money(sum.grand, state.settings.locale, code)}`;
  if (sum.mismatch !== null) {
    text += ` · la fila de total difiere en ${money(sum.mismatch, state.settings.locale, code)}`;
  }
  $("#summary").textContent = text;
}

function updateLineTotal(id) {
  const card = $(`[data-line="${id}"]`);
  const line = state.quote.lines.find((item) => item.id === id);
  if (!card || !line) return;
  const target = $(".line__total", card);
  if (target) target.textContent = money(lineTotal(line), state.settings.locale, state.settings.currency);
}

/** Vuelca el estado en los campos de la ficha (los que no se repintan por línea) */
function syncInputs() {
  const quote = state.quote;
  const settings = state.settings;
  const map = {
    title: quote.title,
    number: quote.number,
    subtitle: quote.subtitle,
    date: quote.date,
    vatRate: quote.vatRate,
    scope: quote.scope,
    notes: quote.notes,
    perUnitLabel: quote.perUnitLabel,
    perUnitQty: quote.perUnitQty,
    "client.name": quote.client.name,
    "client.address": quote.client.address,
    "client.city": quote.client.city,
    "client.taxId": quote.client.taxId,
    "client.phone": quote.client.phone,
    "client.email": quote.client.email,
    "settings.company": settings.company,
    "settings.tagline": settings.tagline,
    "settings.email": settings.email,
    "settings.website": settings.website,
    "settings.location": settings.location,
    "settings.accent": settings.accent,
    "settings.locale": settings.locale,
    "settings.currency": settings.currency,
  };

  $$("[data-quote-field]").forEach((input) => {
    const value = map[input.dataset.quoteField];
    if (value === undefined) return;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value ?? "";
  });

  const favicon = $("#themeColor");
  if (favicon) favicon.content = settings.accent || "#e62434";
}

/* -------------------------------------------------------- previsualización */

function pageShell(quote, settings) {
  const sheet = document.createElement("article");
  sheet.className = documentClasses(quote);
  if (settings.accent) sheet.style.setProperty("--doc-red", settings.accent);
  sheet.innerHTML = `<div class="sheet__inner"></div>`;
  const page = document.createElement("div");
  page.className = "page";
  page.appendChild(sheet);
  return { page, sheet, inner: $(".sheet__inner", sheet) };
}

function tableMarkup(quote) {
  return `
    <table class="doc-table">
      ${quote.template === "classic" ? tableHeadClassicHTML() : tableHeadHTML(quote)}
      ${colgroupHTML(quote)}
      <tbody></tbody>
    </table>`;
}

function cssLength(element, property) {
  const raw = getComputedStyle(element).getPropertyValue(property).trim();
  const value = parseFloat(raw) || 0;
  return raw.endsWith("mm") ? (value * 96) / 25.4 : value;
}

/** Alto que ocupa el contenido dentro de una hoja. */
function contentHeight(sheet) {
  const inner = $(".sheet__inner", sheet);
  if (!inner) return 0;
  // offsetHeight sí refleja el desbordamiento del contenido (offsetTop no).
  return (
    inner.offsetHeight +
    cssLength(sheet, "padding-top") +
    cssLength(sheet, "padding-bottom") +
    cssLength(sheet, "border-top-width") +
    cssLength(sheet, "border-bottom-width")
  );
}

/**
 * Hueco que hay que reservar para el pie. En pantalla el pie va posicionado de
 * forma absoluta (no consume flujo), así que su altura se calcula aparte.
 */
function footReserve(sheet) {
  const foot = $(".doc-foot", sheet);
  if (!foot) return 0;
  return foot.offsetHeight + 14;
}

function overflows(page, sheet) {
  if (!sheet) return false;
  const pageHeight = sheet.offsetHeight || (297 * 96) / 25.4;
  return contentHeight(sheet) + footReserve(sheet) > pageHeight + 1;
}

/**
 * Compone las hojas necesarias midiendo el desbordamiento real.
 * Fase 1: se llenan hojas de arriba abajo. Fase 2: reequilibrio para que
 * ninguna hoja quede recortada por el pie ni se quede casi vacía.
 */
function compose(quote, settings, host) {
  const pages = [];

  const addPage = () => {
    const shell = pageShell(quote, settings);
    host.appendChild(shell.page);
    shell.inner.insertAdjacentHTML("beforeend", headHTML(settings, quote));
    shell.inner.insertAdjacentHTML("beforeend", metaHTML(settings, quote));
    shell.inner.insertAdjacentHTML("beforeend", clientHTML(settings, quote));
    const tableHost = document.createElement("div");
    tableHost.className = "doc-table-host";
    tableHost.innerHTML = tableMarkup(quote);
    shell.inner.appendChild(tableHost);
    const item = { ...shell, tbody: $("tbody", tableHost) };
    pages.push(item);
    return item;
  };

  let active = addPage();

  const appendRow = (row) => {
    active.tbody.appendChild(row);
    if (overflows(active.page, active.sheet) && active.tbody.children.length > 1) {
      row.remove();
      active = addPage();
      active.tbody.appendChild(row);
    }
  };

  (quote.lines || []).forEach((line, index) => {
    const holder = document.createElement("tbody");
    holder.innerHTML = rowHTML(line, index, quote, settings);
    appendRow(holder.firstElementChild);
  });

  active.inner.insertAdjacentHTML("beforeend", totalsHTML(settings, quote));

  // Los totales, si no caben, pasan a una hoja nueva.
  if (overflows(active.page, active.sheet)) {
    const totalsNode = $(".doc-bottom", active.inner);
    if (totalsNode) {
      const next = addPage();
      next.tbody.closest(".doc-table-host")?.remove();
      next.inner.appendChild(totalsNode);
      active = next;
    }
  }

  // Reequilibrio (de la última hoja hacia atrás): ninguna hoja puede superar su
  // alto útil. Si sobra contenido, pasa a la hoja siguiente; si se trata de los
  // totales, se les crea una hoja nueva.
  for (let i = pages.length - 1; i >= 0; i -= 1) {
    const item = pages[i];
    let guard = 0;
    while (overflows(item.page, item.sheet) && guard < 500) {
      guard += 1;
      const bodies = Array.from(item.page.querySelectorAll(".doc-table tbody")).filter(
        (body) => body.children.length > 0,
      );
      const lastBody = bodies[bodies.length - 1];
      const rowCandidate = lastBody ? lastBody.lastElementChild : null;
      const totalsNode = item.page.querySelector(".doc-bottom");
      const candidate = rowCandidate || totalsNode;
      if (!candidate) break;

      const next = pages[i + 1] || addPage();
      if (candidate === totalsNode) next.inner.appendChild(totalsNode);
      else next.tbody.appendChild(candidate);
    }
  }

  // Compactado (de delante hacia atrás): si una hoja admite más contenido, se
  // le pasa la primera fila de la hoja siguiente para no dejar huecos.
  for (let i = 0; i < pages.length - 1; i += 1) {
    const item = pages[i];
    let guard = 0;
    while (guard < 500) {
      guard += 1;
      const next = pages[i + 1];
      const nextBodies = Array.from(next.page.querySelectorAll(".doc-table tbody")).filter(
        (body) => body.children.length > 0,
      );
      const firstRow = nextBodies[0] ? nextBodies[0].firstElementChild : null;
      if (!firstRow) break;
      item.tbody.appendChild(firstRow);
      if (overflows(item.page, item.sheet)) {
        nextBodies[0].insertBefore(firstRow, nextBodies[0].firstElementChild);
        break;
      }
    }
  }

  // Una cabecera de tabla sin filas no debe contar como contenido.
  pages.forEach((item) => {
    const tableHost = $(".doc-table-host", item.inner);
    if (tableHost && !tableHost.querySelector("tbody tr")) tableHost.remove();
  });

  // Si el reequilibrio ha dejado una hoja final que sólo contiene los totales,
  // se intenta devolverlos a la hoja anterior para no gastar un folio en vano.
  if (pages.length > 1) {
    const last = pages[pages.length - 1];
    const previous = pages[pages.length - 2];
    const totals = last.page.querySelector(".doc-bottom");
    const onlyTotals = totals && !last.page.querySelector(".doc-table tbody tr");
    if (onlyTotals) {
      previous.inner.appendChild(totals);
      if (overflows(previous.page, previous.sheet)) {
        last.inner.appendChild(totals);
      } else {
        last.page.remove();
        pages.pop();
      }
    }
  }

  // Hojas de continuación sin nada: fuera.
  for (let i = pages.length - 1; i > 0; i -= 1) {
    const item = pages[i];
    if (!item.tbody.querySelector("tr") && !item.inner.querySelector(".doc-bottom")) {
      item.page.remove();
      pages.splice(i, 1);
    }
  }
  pages.forEach((item) => {
    const tableHost = $(".doc-table-host", item.inner);
    if (tableHost && !tableHost.querySelector("tbody tr")) tableHost.remove();
  });

  pages.forEach((item, index) => {
    if (!$(".doc-foot", item.inner)) {
      item.inner.insertAdjacentHTML("beforeend", footHTML(settings, index + 1, pages.length));
    }
  });

  return pages;
}

function fitPages() {
  const container = $("#pages");
  const first = $(".sheet", container);
  if (!first) return;
  const sheetWidth = first.offsetWidth || (210 * 96) / 25.4;
  const available = Math.max(240, container.clientWidth - 2);
  const scale = Math.min(1, available / sheetWidth);
  container.style.setProperty("--doc-scale", String(scale));
  $$(".page", container).forEach((page) => {
    const sheet = $(".sheet", page);
    const height = sheet.offsetHeight * scale;
    if (height > 0) page.style.height = `${Math.round(height)}px`;
  });
}

function renderPreview() {
  const container = $("#pages");
  const quote = state.quote;

  // Medición a escala 1 en un host fuera de pantalla.
  const host = document.createElement("div");
  host.className = "pages";
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;width:210mm;visibility:hidden;pointer-events:none;";
  host.style.setProperty("--doc-scale", "1");
  document.body.appendChild(host);

  let pages = [];
  try {
    pages = compose(quote, state.settings, host);
  } catch (error) {
    console.error("No se pudo componer el documento", error);
  }

  container.innerHTML = "";
  pages.forEach((item) => {
    item.sheet.style.transform = "";
    container.appendChild(item.page);
  });
  host.remove();

  state.pages = pages.length;
  $("#pageCount").textContent = `${pages.length} ${pages.length === 1 ? "página" : "páginas"}`;
  $("#docTitlePreview").textContent = quote.title || "Presupuesto";
  requestAnimationFrame(() => requestAnimationFrame(fitPages));
}

/** Evita recomponer el documento en cada pulsación de tecla. */
let previewTimer = 0;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 130);
}

/* --------------------------------------------------------------- acciones */

function download(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(value) {
  return (
    String(value || "presupuesto")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "presupuesto"
  );
}

function snapshot() {
  return { version: 1, quote: state.quote, settings: state.settings };
}

function exportJSON() {
  download(
    `${slug(state.quote.number || state.quote.title)}.json`,
    JSON.stringify(snapshot(), null, 2),
  );
  toast("Presupuesto exportado como JSON");
}

function importJSON(text) {
  try {
    const parsed = JSON.parse(text);
    const raw = parsed.quote || parsed;
    if (!raw || !Array.isArray(raw.lines)) throw new Error("no se encontraron partidas");
    state.quote = normalizeQuote(raw);
    if (parsed.settings) state.settings = { ...defaultSettings(), ...parsed.settings };
    save();
    renderEditor();
    syncInputs();
    renderPreview();
    toast("Presupuesto importado");
    return true;
  } catch (error) {
    toast(`No se pudo importar: ${error.message}`);
    return false;
  }
}

function setTemplate(template) {
  state.quote.template = template;
  save();
  renderEditor();
  renderPreview();
}

/* ----------------------------------------------------------------- eventos */

function bindEditor() {
  const editor = $("#editor");

  editor.addEventListener("input", (event) => {
    const target = event.target;

    if (target.matches("[data-line-field]")) {
      const line = state.quote.lines.find((item) => item.id === target.dataset.id);
      if (!line) return;
      const key = target.dataset.lineField;
      line[key] = target.type === "checkbox" ? target.checked : target.value;
      save();
      if (key === "price" || key === "qty" || key === "discount") {
        updateLineTotal(line.id);
        updateSummary();
      }
      schedulePreview();
      return;
    }

    if (target.matches("[data-quote-field]")) {
      const key = target.dataset.quoteField;
      const value = target.type === "checkbox" ? target.checked : target.value;
      if (key.startsWith("settings.")) state.settings[key.slice(9)] = value;
      else if (key.startsWith("client.")) state.quote.client[key.slice(7)] = value;
      else state.quote[key] = value;
      save();
      schedulePreview();
      if (key === "vatRate") updateSummary();
      return;
    }

    if (target.matches("[data-flag]")) {
      state.quote[target.dataset.flag] = target.checked;
      save();
      schedulePreview();
    }
  });

  editor.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-flag]")) {
      state.quote[target.dataset.flag] = target.checked;
      renderEditor();
      save();
      schedulePreview();
      return;
    }
    if (
      target.matches(
        "[data-quote-field='settings.locale'], [data-quote-field='settings.currency']",
      )
    ) {
      save();
      schedulePreview();
    }
  });

  editor.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "up") moveLine(id, -1);
    else if (action === "down") moveLine(id, 1);
    else if (action === "remove") removeLine(id);
    else if (action === "duplicate") duplicateLine(id);
  });

  // Reordenar arrastrando
  let draggedId = null;
  editor.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-line]");
    if (!card) return;
    draggedId = card.dataset.line;
    event.dataTransfer.effectAllowed = "move";
    try {
      event.dataTransfer.setData("text/plain", draggedId);
    } catch {
      /* navegadores sin dataTransfer completo */
    }
  });

  editor.addEventListener("dragover", (event) => {
    const card = event.target.closest("[data-line]");
    if (!card || !draggedId || card.dataset.line === draggedId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  editor.addEventListener("drop", (event) => {
    const card = event.target.closest("[data-line]");
    if (!card || !draggedId || card.dataset.line === draggedId) return;
    event.preventDefault();
    const lines = state.quote.lines;
    const from = lines.findIndex((line) => line.id === draggedId);
    const to = lines.findIndex((line) => line.id === card.dataset.line);
    draggedId = null;
    if (from < 0 || to < 0) return;
    const [item] = lines.splice(from, 1);
    lines.splice(to, 0, item);
    afterChange();
  });
}

function bindToolbar() {
  $("#print").addEventListener("click", () => window.print());
  $("#addLine").addEventListener("click", () => addLine());

  $("#newDoc").addEventListener("click", () => {
    if (!confirm("¿Empezar un presupuesto nuevo en blanco? Se perderá el actual.")) return;
    state.quote = normalizeQuote(newQuote());
    save();
    renderEditor();
    syncInputs();
    renderPreview();
    toast("Presupuesto nuevo");
  });

  $("#loadKoniec").addEventListener("click", () => {
    const keepSettings = state.settings;
    state.quote = normalizeQuote(koniecQuote());
    state.settings = keepSettings;
    save();
    renderEditor();
    syncInputs();
    renderPreview();
    toast("Ejemplo «Koniec» cargado");
  });

  $$("[data-template]").forEach((button) => {
    button.addEventListener("click", () => setTemplate(button.dataset.template));
  });

  $("#export").addEventListener("click", exportJSON);

  $("#import").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importJSON(await file.text());
    event.target.value = "";
  });

  $("#openJson").addEventListener("click", () => {
    $("#jsonText").value = JSON.stringify(snapshot(), null, 2);
    $("#jsonModal").hidden = false;
  });
  $("#closeJson").addEventListener("click", () => {
    $("#jsonModal").hidden = true;
  });
  $("#applyJson").addEventListener("click", () => {
    if (importJSON($("#jsonText").value)) $("#jsonModal").hidden = true;
  });
  $("#jsonModal").addEventListener("click", (event) => {
    if (event.target === $("#jsonModal")) $("#jsonModal").hidden = true;
  });

  $("#logoFile").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 400 * 1024) {
      toast("Logotipo demasiado grande (máximo 400 KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.settings.logoCustom = String(reader.result);
      save();
      renderPreview();
      toast("Logotipo actualizado");
    };
    reader.readAsDataURL(file);
  });

  $("#logoReset").addEventListener("click", () => {
    state.settings.logoCustom = "";
    save();
    renderPreview();
    toast("Logotipo original restaurado");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#jsonModal").hidden) $("#jsonModal").hidden = true;
  });

  window.addEventListener("resize", fitPages);
  window.addEventListener("beforeprint", () => {
    const container = $("#pages");
    container.style.setProperty("--doc-scale", "1");
    $$(".page", container).forEach((page) => {
      page.style.height = "";
    });
  });
  window.addEventListener("afterprint", () => {
    requestAnimationFrame(fitPages);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(fitPages));
  }
}

/* --------------------------------------------------------------- arranque */

function boot() {
  const stored = load();
  state.settings = { ...defaultSettings(), ...((stored && stored.settings) || {}) };
  state.quote = normalizeQuote(stored?.quote || koniecQuote());

  $("#today").textContent = formatDate(todayISO(), state.settings.locale);
  bindToolbar();
  bindEditor();
  renderEditor();
  syncInputs();
  renderPreview();

  const info = currencyInfo(state.settings.currency);
  document.title = `Presupuesto ${state.quote.number || ""} · ${state.settings.company || "KREA.TURES"}`.trim();
  console.info(`KREA.TURES presupuestos listo (${info.code})`);
}

document.addEventListener("DOMContentLoaded", boot);
