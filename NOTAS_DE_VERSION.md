# 📝 Notas de Versión - ProPresenter AI Studio

Todas las novedades, mejoras y correcciones de errores importantes de **ProPresenter AI Studio** se documentan en este archivo.

---

## 🚀 Versión 1.0.0 (Release Inicial Estable) — *24 de Agosto, 2026*

¡Nos alegra presentar la primera versión pública oficial de **ProPresenter AI Studio**! Esta entrega inicial ofrece una suite completa para control de proyección multimedia en vivo, transmisiones y monitores de escenario.

### ✨ Novedades y Funcionalidades

#### 🖥️ Salidas Multipantalla y Visualización
- **Ventana de Audiencia (`audience.html`):** Transmisión a pantalla completa con soporte para capas de texto, fondos de video loop, imágenes estáticas y banners de tercio inferior (Lower Third).
- **Monitor de Escenario / Stage Display (`stage.html`):** Pantalla dedicada para predicadores y músicos con reloj digital en tiempo real, cronómetros regresivos (5 min, 10 min, Pausa/Reanudar), vista previa de la diapositiva actual y siguiente filmina.

#### ⚡ Transiciones en Vivo en Tiempo Real
- Botones de transición independientes para **Texto** y **Medios** (`Cut` instantáneo vs `Fade` suave).
- Deslizador de tiempo de transición ajustable desde **100 ms hasta 1000 ms** (por defecto 250 ms).

#### 📖 Navegador Bíblico y Carga Dinámica de Biblias
- **Carga de Biblias desde URL / JSON:** Botón `+` en la barra lateral para descargar e importar Biblias en tiempo real pasándole una URL (ej: `https://mrk214.github.io/snapshots/es___spa___spa/DHH94I_vid_52.json`) o seleccionando un archivo `.json` local.
- **Navegación en 3 Columnas:** Selección ágil de **Libros (66) | Capítulos | Versículos**.
- **Búsqueda en Árbol y Autocompletado:** Filtrado de libros en tiempo real con sugerencia e inserción instantánea al presionar **`Tab ↹`**.
- **Ajustes de Escrituras (Dock Inferior Derecho):**
  - Configuración de renglones máximos por filmina (*1, 2, 3 renglones o Sin Límite*).
  - Selector de fuentes tipográficas (*Inter, Outfit, Montserrat, Georgia, Roboto*).
  - División inteligente de versículos largos en filminas continuas respetando puntuaciones.
  - Subtítulo con cita bíblica (*Libro Cap:Versículo - Versión*) en fuente pequeña, itálica y color cian al pie de la filmina en vista previa y Audiencia.
- **Convertidor a Show:** Botón `✨ Convertir a Show` para transformar cualquier capítulo bíblico completo en una presentación permanente en la biblioteca.

#### 🗑️ Gestión de Recursos y Menú Contextual
- Menú contextual con clic derecho en canciones, fondos multimedia y Biblias personalizadas con opción `Eliminar Elemento`.
- Botón directo de papelera (`🗑️`) en la lista de Biblias.
- Atajo de teclado **`Supr` / `Delete`** para eliminar rápidamente el elemento seleccionado.

#### 🎨 Diseño de Interfaz Pro
- Panel de recursos inferior redimensionable verticalmente mediante arrastre (`#bottom-dock-resizer`).
- Disposición horizontal fluida de tarjetas de letras de canciones con etiquetado inferior (*Estrofa 1, Coro, Puente*).
- Organización de fondos de video e imágenes mediante **Carpetas Virtuales** personalizadas.

---

### 🛠️ Correcciones de Errores y Optimización

- **Actualización Instantánea de Ajustes:** Corregido el flujo de eventos para que cualquier cambio en los selectores de escrituras (*Renglones, Fuente, División*) se aplique de inmediato en la filmina en vivo.
- **Estilo Fiel de Cita Bíblica en Audiencia:** Corregidas las reglas CSS de `.slide-scripture-ref` en `audience.html` para asegurar que la referencia bíblica conserve su fuente reducida, itálica y cian sin heredar el tamaño gigante del texto principal.
- **Desplegables Interactivos:** Ajustados los eventos y propiedades de puntero (`user-select: text` y `pointer-events: auto`) en los controles `<select>` para asegurar la apertura fluida de sus listas desplegables.

---

### 📦 Empaquetado
- Soporte de empaquetado nativo para Windows (`win32 x64`) emitiendo un ejecutable portable independiente mediante `npm run package:exe`.
