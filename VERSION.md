# 📌 Historial de Versiones — ProPresenter Studio

Este archivo registra el control de versiones, cambios granulares, mejoras y correcciones aplicadas a **ProPresenter Studio**. Se actualiza continuamente con cada versión publicada.

---

## 📌 Versión Actual: `v1.1.0` (Build 20260825.4)

### 🗓️ Registro de Cambios (Changelog Histórico)

### [1.1.0] - 2026-08-25
#### 🆕 Nuevas Funcionalidades & Correcciones
- **📜 Corrección Definitiva del Scrollbar en Panel Derecho (Dock Resizing Flex Fix):**
  - Asignado `flex-shrink: 0` a todos los contenedores hijos de `.right-sidebar` y removido `flex: 1; overflow: hidden;` de `.tab-content`.
  - Al incrementar la altura del dock inferior o reducir la resolución del monitor, `.right-sidebar` activa de inmediato su barra de desplazamiento vertical (`overflow-y: auto`), permitiendo navegar el 100% de los elementos (Live Program, Clear All, Transiciones en Vivo y Stage Display) sin que nada quede cortado.
- **📺 Vista Previa del Operador 100% Fiel y Equivalente a la Audiencia:**
  - El monitor de vista previa del operador (`LIVE PROGRAM / AUDIENCE SCREEN`) en la barra derecha ahora escala y proyecta de forma idéntica a la pantalla final de Audiencia.
  - Sincronizados de forma fiel la fuente tipográfica, tamaño, espaciado de letras, interlineado, color de texto, sombras, alineación, **posición vertical Y (top %)**, color y opacidad de caja de fondo, padding, esquinas redondeadas y límite de líneas.
- **🎨 Corrección en Selección de Plantillas (Respeto del Estado de Audiencia):**
  - Al seleccionar o modificar plantillas de texto, la pantalla de Audiencia **conserva rigurosamente su estado actual**. Si la pantalla está limpia o sin texto en vivo (`isTextCleared === true`), permanece totalmente limpia sin forzar proyecciones involuntarias.
  - Los ajustes de plantilla solo re-estilizan el texto proyectado cuando la diapositiva ya está activa en vivo.
- **🎨 Corrección de Carga de Estilos CSS en Producción (`base: './'`):**
  - Añadida la propiedad `base: './'` en `vite.config.js` para asegurar que todos los estilos CSS y scripts JavaScript empaquetados en la build de Electron se vinculen mediante rutas relativas universales (`./assets/...`).
  - Solucionado el problema donde los estilos no se cargaban al abrir la aplicación ejecutable nativa `.exe`.
- **📦 Carga por Lotes de Videos e Imágenes (Batch Upload & Multi-Drag):**
  - Implementado el método `addMediaBatch` en `Store` para importar decenas de archivos multimedia en un único pase ultra rápido.
  - El selector de archivos del modal (`📂 Explorar Archivo...`) y el campo de entrada `<input type="file" multiple>` permiten seleccionar múltiples videos (ej: 10, 20 o 50 archivos MP4/JPG/WebM) a la vez en Windows Explorer y asignarlos en lote a cualquier carpeta virtual (*General*, *Anuncios*, *Alabanza*, etc.).
  - Añadido soporte para **Arrastrar y Soltar (Drag & Drop)** múltiple directamente sobre la pestaña de Medios.
- **🎥 Corrección en Carga de Medios (Sin Proyección Automática Involuntaria):**
  - Al agregar o importar un nuevo archivo de video/imagen a la biblioteca, este ya **no se proyecta automáticamente** a la pantalla de Audiencia.
  - El elemento permanece registrado en la grilla multimedia para que el operador decida cuándo activarlo explícitamente haciendo clic sobre él.
- **🎨 Edición y Sincronización en Tiempo Real de Plantillas de Texto:**
  - Implementado el método `updateActiveTemplateProperties` en `Store` para que cada movimiento de control (tamaño de fuente, alineación, posición Y, kerning, interlineado, color de texto, color y opacidad de fondo de caja, padding y esquinas redondeadas) actualice la diapositiva proyectada en **tiempo real**.
  - Añadidos en la interfaz todos los controles faltantes (alineación, posición vertical Y, color de caja, opacidad, padding y límite de líneas) para una personalización completa y reactiva.
- **⚡ Optimización Anti-Parpadeo (Memoización DOM en Grilla Multimedia):**
  - Implementación de claves de caché para el renderizado del dock de medios y shows (`renderMediaDock` y `renderShowsDock`).
  - Previene que los nodos `<video>` de las miniaturas se destruyan y recarguen cada segundo con los tics del reloj o temporizadores, eliminando los parpadeos por completo y ofreciendo máxima fluidez visual.
- **📜 Scrollbar en Panel Derecho (Navegación Fluida al Redimensionar Dock):**
  - Añadido soporte para desplazamiento vertical automático (`overflow-y: auto`) con barra de desplazamiento oscura personalizada en el panel derecho (`.right-sidebar`).
  - Al aumentar la altura del dock inferior o en pantallas de menor resolución, el operador puede desplazarse verticalmente y acceder a todos los controles (Live Program, Clear All, Transiciones y Stage Display).
- **🎥 Transición de Fade Fluida para Medios (Crossfade de Doble Capa):**
  - Implementación de un motor de reproducción multimedia de doble capa (`bg-video-a` / `bg-video-b`) para eliminar los cortes bruscos al cambiar entre fondos de video o imágenes.
  - Sincronización precisa de las transiciones `Cut` vs `Fade` y el control deslizante de duración (100ms - 1000ms) tanto en la Salida de Audiencia como en la vista previa del operador.
- **🏷️ Preselección Automática de Categoría Activa al Crear/Importar Shows:**
  - Si el usuario está ubicado dentro de una categoría específica (ej: *Rápidos*, *Adoración*, *Alabanza*, *Sermón*), al pulsar el botón `+` o importar una canción de la web, esa categoría se selecciona automáticamente por defecto en el formulario.
- **📅 Calendario Mensual Estilo FreeShow (7 Columnas):**
  - Implementación de la vista mensual completa de 7 columnas (`Sunday` a `Saturday`) con numeración lateral de semana (`#`).
  - Resaltado automático del día actual en círculo magenta brillante (`var(--accent-pink)`).
  - Píldora de navegación inferior flotante (`<`, `>`, `🏠 Hoy`, `Agosto 2026`) y botón `+ New event`.
  - Agendamiento de eventos con fecha, hora, categoría y notas.
  - Botón de proyección rápida `📢` para transmitir anuncios de eventos a la pantalla de Audiencia.
- **🎵 Buscador Web de Canciones y Letras:**
  - Pestañas de modo en modal de agregación: `✍️ Crear desde Cero` vs `🔍 Buscar en la Web`.
  - Consulta en tiempo real de letras desde APIs web abiertas y catálogo interno de alabanzas.
  - Resultados con nombre, autor/artista y portal web de origen (`letras.com`, `musixmatch.com`, `genius.com`, `lrclib.net`).
  - Importación en 1 clic (`📥 Cargar Letra`) con división automática en estrofas.
- **📐 Dock Inferior al 30% por Defecto (`30vh`):**
  - Ajuste de altura inicial a `30vh` y eliminación del botón rosa flotante que se superponía detrás de las pestañas.
  - Fijación de altura de tarjetas de shows (`height: 145px;`).

#### 🧹 Limpieza y Simplificación
- **Remoción de IA Copilot:** Eliminadas todas las dependencias y pestañas de generación IA.
- **Remoción de Biblias por Defecto:** Eliminación de biblias mock hardcodeadas. La lista ahora es 100% personalizada e impulsada por cargas del usuario via URL/JSON.
- **Pestañas del Dock Optimizadas:** Se removieron las pestañas `Audio`, `Overlays` y `Functions`, dejando únicamente las 5 activas: `Shows`, `Media`, `Templates`, `Scripture` y `Calendar`.

---

### [1.0.0] - 2026-08-22
#### 🚀 Lanzamiento Inicial
- **Control Multipantalla Nativo:** Salida de Audiencia (`audience.html`) y Monitor de Escenario Stage Display (`stage.html`).
- **Motor de Transiciones en Vivo:** Control independiente Cut vs Fade (slider 100ms - 1000ms).
- **Navegador Bíblico de 3 Columnas:** Libros, Capítulos y Versículos con autocompletado instantáneo `Tab ↹`.
- **Cargador Dinámico de Biblias:** Importador via URL directa o archivo JSON local.
- **Organización Multimedia:** Carpetas virtuales personalizadas para fondos de video e imágenes.
- **Empaquetado Nativo Windows:** Script de construcción ejecutable portable `.exe` mediante `npm run package:exe`.
