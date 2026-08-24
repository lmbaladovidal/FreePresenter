# 📌 Historial de Versiones — ProPresenter Studio

Este archivo registra el control de versiones, cambios granulares, mejoras y correcciones aplicadas a **ProPresenter Studio**. Se actualiza continuamente con cada versión publicada.

---

## 📌 Versión Actual: `v1.1.0` (Build 20260824.1)

### 🗓️ Registro de Cambios (Changelog Histórico)

### [1.1.0] - 2026-08-24
#### 🆕 Nuevas Funcionalidades
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
