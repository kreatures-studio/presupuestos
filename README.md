# Presupuestos · KREA.TURES

Herramienta web **HTML + CSS + JavaScript** (sin dependencias ni compilación) para crear los
presupuestos del estudio: se edita a la izquierda, se ve el documento A4 en tiempo real a la
derecha y se guarda como PDF con el diálogo de impresión del navegador.

Lista para publicar en **GitHub Pages**.

---

## Qué incluye

- **Editor** de documento, cliente, partidas y observaciones, con arrastrar y soltar para
  reordenar, duplicar y eliminar partidas.
- **Previsualización A4 real** (210 × 297 mm) con paginación automática: cuando el contenido
  no cabe, el JS reparte las filas en varias hojas y repite la cabecera de tabla.
- **Dos plantillas**:
  - *Moderna*: réplica de la maqueta del presupuesto **PrintMyEscape** (banda de marca,
    alcance destacado, tabla de partidas, total grande y desglose de IVA).
  - *Clásica*: tabla con bordes tipo **Koniec** (partida / detalle / cantidad / importe).
- **Cálculo automático** de base imponible, IVA y total, con descuento por línea opcional y
  fila de total estimado que se contrasta con la suma real de las partidas.
- **Formatos** español (`1.234,56 €`) o inglés (`€1,234.56`), con EUR / USD / GBP.
- **Persistencia** en `localStorage`, más exportar/importar JSON y edición directa del JSON.
- **Logotipo**: usa el de KREA.TURES incrustado (viene de
  <https://kreatures-studio.github.io/website/images/logo.png>) o sube el tuyo.
- **Color de acento** configurable, por defecto `#E62434`.

## Cómo se usa

1. Abre `index.html` (en GitHub Pages o en local).
2. Ajusta **Documento**, **Cliente** y **Partidas**.
3. Pulsa **Imprimir / PDF** y elige «Guardar como PDF» en el diálogo del navegador.
   - En Chrome/Edge: márgenes **Ninguno** o **Predeterminado** y **Gráficos de fondo**
     activados para que salgan la banda de marca y los colores.
4. El botón **Ejemplo Koniec** carga el presupuesto de referencia adaptado a la maqueta.

## Estructura

```
index.html            # interfaz (editor + previsualización)
styles/app.css        # estilos de la aplicación
styles/doc.css        # estilos del documento A4 (pantalla e impresión)
js/main.js            # estado, editor, paginación e impresión
js/doc.js             # plantillas HTML del documento y cálculos
js/format.js          # moneda, números y fechas
js/defaults.js        # ajustes por defecto y presupuesto de ejemplo (Koniec)
js/brand.js           # logotipos KREA.TURES incrustados (data URI)
assets/favicon.svg    # icono de la pestaña
assets/img/mark.svg   # marca de la barra superior
```

El proyecto no tiene dependencias ni paso de compilación: son módulos ES nativos que el
navegador carga directamente. La única petición externa es la de las tipografías
(Bebas Neue y Poppins), con alternativas del sistema si no hay red.

## Publicar en GitHub Pages

```bash
git add .
git commit -m "Herramienta de presupuestos"
git push origin main
```

Después, en GitHub: **Settings → Pages → Source: Deploy from a branch**, rama `main` y
carpeta `/ (root)`. La web quedará en `https://kreatures-studio.github.io/presupuestos/`.
El archivo `.nojekyll` evita que Jekyll procese el sitio.

## Personalización

- **Logotipo propio**: súbelo desde *Emisor y estilo → Logotipo propio*. Se guarda en el
  navegador, no en el repositorio.
- **Logotipo permanente**: sustituye las tres constantes de `js/brand.js` por rutas a tus
  archivos (por ejemplo `export const LOGO_INK = "assets/img/logo.svg";`).
- **Marca del documento**: cambia colores y medidas en las variables `--doc-*` de
  `styles/doc.css` (por ejemplo `--doc-pad`, `--doc-red` o `--doc-ink`).
- **Contenido de ejemplo**: edita `koniecQuote()` en `js/defaults.js`.

## Notas de impresión

- `@page { size: A4; margin: 0 }` y los márgenes los aporta el `padding` de la hoja, para que
  las columnas de la tabla se mantengan exactamente igual que en pantalla.
- Si el presupuesto ocupa varias hojas, cada una repite la cabecera de marca y la cabecera de
  la tabla. La numeración («Página: n / m») se ve en pantalla; en el PDF la añade el navegador
  si activas «Encabezados y pies de página» en el diálogo de impresión.
- Los totales nunca se quedan colgando: si no caben en la última hoja con partidas, pasan a
  una hoja nueva.

## Referencias

- `PresupuestoPrintmyescape1.pdf` — maqueta visual de referencia (plantilla *Moderna*).
- `Presupuesto Koniec.pdf` — contenido de referencia adaptado en el ejemplo *Koniec*.
  Ambos PDF son material de trabajo, no forman parte de la web publicada.
