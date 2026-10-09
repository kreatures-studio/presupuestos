/* Presupuesto de ejemplo: adaptación del presupuesto "Koniec" (decorado de aula
   para producción 3D) a la maqueta visual de KREA.TURES. */

import { LOGO_WHITE, LOGO_INK } from "./brand.js";
import { todayISO } from "./format.js";

export const STORAGE_KEY = "kreatures.presupuestos.v1";

/** Logotipos incluidos; si el usuario sube el suyo se guarda en logoCustom. */
export function brandLogos() {
  return { white: LOGO_WHITE, ink: LOGO_INK };
}

export function defaultSettings() {
  return {
    company: "Kreatures Studio",
    tagline: "Behind your project",
    email: "hello@kreatures.studio",
    website: "kreatures-studio.github.io/website",
    location: "España · Worldwide",
    locale: "es-ES",
    currency: "EUR",
    theme: "ink", // documento en blanco con logotipo en tinta
    accent: "#e62434",
    logoCustom: "",
  };
}

export function newQuote() {
  return {
    id: cryptoId(),
    title: "Presupuesto 1 · Primera entrega",
    number: "2026/001",
    subtitle: "",
    date: todayISO(),
    template: "modern",
    showDiscount: true,
    showUnitPrice: true,
    client: {
      name: "Nombre del cliente",
      address: "Dirección",
      city: "Ciudad",
      taxId: "—",
      phone: "—",
      email: "—",
    },
    scope: "",
    lines: [],
    vatRate: 21,
    notes: "Presupuesto válido durante 30 días.\nForma de pago: 50 % al inicio, 50 % a la entrega.",
    perUnitLabel: "",
    perUnitQty: 0,
  };
}

export function newLine(values = {}) {
  return {
    id: cryptoId(),
    name: values.name ?? "Nueva partida",
    detail: values.detail ?? "",
    qtyDetail: values.qtyDetail ?? "",
    qty: values.qty ?? 1,
    price: values.price ?? 0,
    discount: values.discount ?? 0,
    highlight: values.highlight ?? false,
  };
}

function cryptoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Presupuesto del ejemplo "Koniec" — decorado completo de aula, 2 artistas. */
export function koniecQuote() {
  return {
    ...newQuote(),
    title: "Desglose de trabajos y estimación económica",
    number: "2026/014",
    subtitle: "Decorado de aula · 2 artistas",
    template: "modern",
    showDiscount: false,
    showUnitPrice: false,
    client: {
      name: "Koniec",
      address: "Producción · Decorado de aula",
      city: "—",
      taxId: "—",
      phone: "—",
      email: "—",
    },
    scope:
      "Decorado completo de aula 3D listo para producción, realizado por 2 artistas. " +
      "Incluye lookdev y setup de assets, arquitectura, mobiliario principal, pizarra y decoración " +
      "mural y atrezzo escolar disperso. Base de 70 horas a 40,00 €/h.",
    lines: [
      newLine({
        name: "1. Lookdev & Setup. Integración y calidad.",
        detail:
          "Importación de los assets, comprobación de UVs, conexión y configuración de los nodos de material PBR estilizado en el archivo .blend entregado por la productora, comprobación de respuesta bajo la luz, empaquetado y entrega final.",
        qty: 1,
        price: 545,
      }),
      newLine({
        name: "2. Arquitectura",
        detail: "Texturizado de superficies estructurales en 4K: paredes, techo, suelo de cemento/tierra desgastada, puerta de madera y ventana.",
        qtyDetail: "Pared x 4\nSuelo x 1\nTecho x 1\nPuertas x 1\nVentanas x 1",
        qty: 1,
        price: 560,
      }),
      newLine({
        name: "3. Mobiliario principal de aula",
        detail:
          "• Armario metálico (detalle de óxido y desgaste).\n• Mesa de profesora.\n• Pupitre escolar (1 smart material con seed randomizable para la madera + handpaint de detalles para las 20 uds).\n• Silla escolar (igual que con los pupitres).\n• Perchero de pared.",
        qtyDetail: "Armario x 1\nMesa profe x 1\nPupitre x 20\nSillas x 20\nPercheros pared x 1",
        qty: 1,
        price: 1270,
      }),
      newLine({
        name: "4. Pizarra y decoración mural",
        detail:
          "• Pizarra con restos de tiza borrada, borrador y set de tizas.\n• Mapa de pared.\n• Adornos de tablero (manos y mesa de profesora).\n• Dibujos infantiles de pared.",
        qtyDetail: "Pizarra x 1\nBorrador x 1\nTizas x 4\nMapa de pared x 1\nAdorno tablero pared x 1\nAdorno tablero mesa profe x 1\nDibujos pared x 11",
        qty: 1,
        price: 700,
      }),
      newLine({
        name: "5. Atrezzo escolar y scatter",
        detail:
          "Props de aula: libros escolares, bloques de construcción de madera, lapiceros, lápices (smart material reutilizable cambiando color) y adorno colgante de techo.",
        qtyDetail: "Libros x 6\nLapicero x 1\nLápices x 1\nAdorno colgante x 2",
        qty: 1,
        price: 325,
      }),
      newLine({
        name: "TOTAL ESTIMADO",
        detail: "Decorado completo listo para producción (2 artistas).",
        qty: "",
        price: 3400,
        highlight: true,
      }),
    ],
    vatRate: 21,
    notes:
      "Base imponible: 70 horas a 40,00 €/h.\nDecorado completo listo para producción con 2 artistas.\nPresupuesto válido durante 30 días.",
    perUnitLabel: "70 horas a 40,00 €/h",
    perUnitQty: 0,
  };
}
