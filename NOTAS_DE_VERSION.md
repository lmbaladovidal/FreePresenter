# 📝 Notas de Versión - ProPresenter AI Studio

Todas las novedades, mejoras y correcciones de errores importantes de **ProPresenter AI Studio** se documentan en este archivo.

---

## 🚀 Versión 1.3.0 (División Automática de Filminas, Importación desde Portapapeles, Zoom Grid y Paridad 1:1 en Monitor de Audiencia) — *10 de Octubre, 2026*

Esta versión introduce la división inteligente de canciones por reglas de renglones y plantillas, división automática del texto excedente en nuevas tarjetas de filmina, importación directa desde el portapapeles en la creación de shows, proyección fluida de medios en carpetas virtuales, control deslizante de zoom para tarjetas de filmina y paridad 100% fiel 1:1 entre el monitor del operador y la pantalla de audiencia (`audience.html`).

### ✨ Novedades y Funcionalidades

#### ✂️ División Inteligente de Canciones y Re-división por Plantillas
- **Reglas de División Flexible:** Soporte para dividir letras de canciones por saltos de línea, número límite de renglones (`maxLines`) o párrafos.
- **Botón de Re-dividir Filminas (`btn-reflow-deck`):** Permite re-organizar dinámicamente cualquier canción activa especificando el número máximo de líneas por filmina.
- **División Automática por Excedente:** Al asignar o editar una plantilla con restricción `maxLines > 0`, el sistema corta automáticamente el texto excedente y genera nuevas filminas consecutivas preservando el orden.

#### 📋 Carga de Canciones desde Portapapeles & Selección de Plantilla
- **Creación Asistida de Presentaciones:** El modal de creación de canciones permite seleccionar la plantilla gráfica inicial antes de guardar.
- **Pegado Rápido (`btn-paste-clipboard`):** Permite pegar contenido directamente desde el portapapeles del sistema operativo con un solo clic.

#### 🖼️ Proyección de Medios en Carpetas Virtuales
- **Carga y Arrastre (Drag & Drop):** Las imágenes y videos agregados a las carpetas virtuales generan miniaturas en tiempo real y se proyectan limpiamente tanto a la pantalla de audiencia (`audience.html`) como al monitor del operador.

#### 🔍 Zoom Dinámico de Tarjetas de Filmina (`.slide-card`)
- **Control Deslizante de Zoom:** Ubicado en la barra superior de las filminas (`input-slide-card-size`), permite ajustar dinámicamente el tamaño de las tarjetas entre `140px` y `380px`.

#### 🖥️ Paridad Fiel 1:1 en Monitor de Audiencia (`.monitor-screen`)
- **Container Queries CSS (`cqw`):** Se actualizó el monitor del programa en vivo (`.monitor-screen`) con `container-type: inline-size; padding: 0;`.
- **Escalado idéntico a `audience.html`:** Las letras en el monitor del operador escalan sus fuentes, espaciados, saltos de línea, distribución y posiciones verticales de forma 100% proporcional e idéntica a la señal proyectada en vivo.

---

## 🚀 Versión 1.2.0 (Menú Contextual Dinámico, Gestión de Modales & QA Suite) — *7 de Octubre, 2026*

Esta versión introduce un menú contextual inteligente para componentes, corrige la gestión e interacción de ventanas emergentes, agrega la suite automatizada de Smoke Test y resuelve la compatibilidad en ejecutables `.exe`.

### ✨ Novedades y Funcionalidades

#### 🖱️ Menú Contextual Dinámico para Componentes (Clic Derecho)
- **Acciones Rápidas por Componente:** El menú contextual detecta automáticamente el elemento seleccionado al hacer clic derecho y adapta sus opciones:
  - **Canciones / Shows:** Proyectar Ahora (`▶️`), Editar Contenido (`✏️`), Duplicar Show (`📋`) y Eliminar (`🗑️`).
  - **Galería Multimedia:** Transmitir en Vivo (`🎬`), Cambiar Carpeta Virtual (`📁`) y Eliminar Recurso (`🗑️`).
  - **Biblias Importadas:** Activar Biblia (`📖`) y Eliminar Biblia Personalizada (`🗑️`).
  - **Filminas / Diapositivas:** Proyectar Filmina en Vivo (`▶️`), Copiar Texto al Portapapeles (`📋`) y Limpiar Capa (`F2`).
  - **Eventos de Calendario:** Proyectar Anuncio en Vivo (`📢`) y Eliminar Evento (`🗑️`).
- **Función Duplicar Show:** Nuevo método `duplicateDeck()` en el motor de estado para clonar canciones o guiones con 1 solo clic.

#### 🪟 Gestión Robusta de Modales y Ventanas Emergentes
- **Exclusión Mutua de Modales (`closeAllModals()`):** Al abrir una nueva ventana emergente se descartan e inhabilitan automáticamente modales y menús previos, evitando bloqueos de interfaz.
- **Cierre por Clic en Backdrop:** Hacer clic fuera de la tarjeta modal (en el área oscura traslúcida) descarte el modal inmediatamente.
- **Interacción Tecla `Escape`:** Si hay un modal abierto, presionar `Escape` cierra la ventana emergente limpiamente sin interferir en la señal proyectada en vivo.
- **Z-Index y Pointer-Events Optimizados:** Configurado `pointer-events: none` cuando las capas están cerradas y `pointer-events: auto` al abrirse con `z-index: 10000`, evitando bloqueos fantasmas de clics.

#### 📄 Documentación Técnica y Suite de Smoke Test Automatizado
- **`REQUERIMIENTOS_FUNCIONALES.md`:** Especificación detallada de los 37 Requerimientos Funcionales (**RF-01 al RF-37**) estructurados por módulos operativos.
- **`SMOKE_TEST.md`:** Protocolo completo de pruebas de humo para control de calidad manual en eventos.
- **`tests/smoke-test.mjs`:** Suite de pruebas de humo automatizadas en Node.js ejecutable mediante `npm test` (**10/10 pruebas pasadas en 100%**).

---

### 🛠️ Correcciones de Errores y Compatibilidad

- **Ejecutables `.exe` Nativos de Windows:** Resuelto el fallo `ReferenceError: require is not defined in ES module scope` ajustando la declaración en `package.json` para permitir la ejecución nativa de Electron (`main.js` y `preload.js`) conservando la arquitectura de ES Modules en Vite (`src/js/*.js`) y CLI (`tests/*.mjs`).
- **Sincronización IPC de Electron:** Protegidas las invocaciones a `window.electronAPI` con `typeof window !== 'undefined'` para ejecuciones seguras en entornos de pruebas.

---

## 🚀 Versión 1.1.0 — *25 de Agosto, 2026*

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
