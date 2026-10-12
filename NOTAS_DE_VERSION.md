# 📝 Notas de Versión - ProPresenter AI Studio

Todas las novedades, mejoras y correcciones de errores importantes de **ProPresenter AI Studio** se documentan en este archivo.

---

## 🚀 Versión 1.3.2 (Reproducción de Audio en Videos, Conmutador Mute/Unmute y Control de Volumen) — *12 de Octubre, 2026*

Esta versión habilita la salida sonora completa en la reproducción de videos, incorporando botones de control interactivo para silenciar o habilitar el sonido (`Mute/Unmute`), un control deslizante de volumen master, atajo de teclado dedicado (`M`) y un sistema inteligente de prevención de eco acústico multipantalla.

### ✨ Novedades y Funcionalidades

#### 🔊 Reproducción de Audio en Videos en Vivo
- **Salida Sonora Activa:** Se eliminó la propiedad `muted` forzada en las capas de video de la ventana de Audiencia (`audience.html`), permitiendo que el audio de los videos de fondo o presentaciones multimedia se proyecte con fidelidad sonora a los sistemas de sonido y transmisión (OBS / NDI).
- **Compatibilidad Autoplay en Electron:** Incorporado el flag `--autoplay-policy=no-user-gesture-required` en el proceso principal de Electron, garantizando que los videos arranquen con sonido de inmediato sin ser bloqueados por políticas de Chromium.

#### 🎛️ Botón Maestro de Sonido (Mute / Unmute) y Control de Volumen
- **Botón en Cabecera de Live Program:** Ubicado junto al indicador de audiencia, muestra el estado en vivo (`🔊 Sonido ON` en verde vs `🔇 Silenciado` en rojo) para conmutar el sonido con 1 clic.
- **Control en Panel de Transiciones:** Añadida fila de `AUDIO:` con botón toggle y deslizador interactivo de volumen (`0% - 100%`).
- **Control en Biblioteca Multimedia:** Botón sincronizado en la barra de herramientas del dock de medios (`res-tab-media`).
- **Atajo de Teclado Rápido (`M`):** Permite silenciar o reactivar el sonido instantáneamente sin necesidad de usar el mouse.
- **Persistencia en LocalStorage:** La preferencia sonora y el nivel de volumen se guardan automáticamente entre reinicios.

#### 🎧 Prevención Inteligente de Eco Acústico Dual
- **Detección Automática de Pantalla de Audiencia:** Al proyectar en una pantalla secundaria (`audience.html`), el monitor del operador se silencia automáticamente para evitar doble reproducción o eco por retraso de fase en los altavoces de la computadora.
- **Modo Ensayo Autónomo:** Si la ventana de audiencia no está abierta, el monitor del operador reproduce el audio para permitir previsualizar y ensayar videos directamente.

---

## 🚀 Versión 1.3.1 (Persistencia de Medios, Caché de Miniaturas vía IndexedDB y Corrección de Visualización) — *11 de Octubre, 2026*


Esta versión introduce el nuevo motor de persistencia y caché multimedia (`media-cache.js`), resolviendo la pérdida de miniaturas tras reiniciar la aplicación y corrigiendo la visualización de videos locales en la consola del operador y la ventana de audiencia.

### ✨ Novedades y Funcionalidades

#### 🖼️ Motor de Persistencia y Caché de Miniaturas vía IndexedDB (`media-cache.js`)
- **Base de Datos IndexedDB Dedicada (`FreePresenterMediaDB`):** Permite almacenar miniaturas y archivos binarios sin restricciones de tamaño y sin saturar la cuota de 5MB de `localStorage`.
- **Extracción Automática de Fotogramas (Canvas 320x180):** Al cargar o arrastrar cualquier video o imagen, un proceso en segundo plano captura un fotograma representativo y genera una miniatura ultraligera JPEG (~10-15 KB).
- **Rendimiento Ultrarrápido (< 1ms):** La cuadrícula de medios del dock (`media-grid`) ahora renderiza miniaturas estáticas cacheadas (`.video-card-thumb`), eliminando el consumo excesivo de memoria GPU y decodificadores de hardware.
- **Auto-hidratación al Iniciar:** Al abrir la aplicación, las miniaturas e identificadores de medios se restauran instantáneamente desde IndexedDB, garantizando que los medios nunca desaparezcan al cerrar y volver a abrir la sesión.

#### 📁 Rutas Permanentes en Entornos de Escritorio Electron
- **Integración con `webUtils.getPathForFile`:** Se incorporó el método nativo en `preload.js` para capturar la ruta absoluta en disco (`file:///...`) al soltar o cargar medios locales en Windows.
- **Rutas no caducables:** Se erradicó la dependencia exclusiva de URLs `blob:` efímeras que morían al cerrar el proceso de Electron.

#### 🩹 Corrección Crítica en Clasificación de Medios (Solución de Imagen Rota)
- **Eliminación de Falso Positivo `url.startsWith('blob:')`:** Se corrigió la función `isMediaImage` en `app.js` y `audience.html` para evitar que los videos en formato blob fueran tratados erróneamente como imágenes e insertados en etiquetas `<img>`.
- **Reproducción Fluida de Video:** Los videos locales se proyectan de forma correcta y limpia en reproductores `<video>` tanto en el monitor en vivo (`.monitor-screen`) como en la pantalla de audiencia (`audience.html`).

#### 🏷️ Insignias Visuales de Tipo de Medio
- **Etiquetas de Identificación (`.video-card-type-badge`):** Cada tarjeta en la biblioteca de medios incluye ahora un distintivo visible en su cabecera (`🎬 VIDEO` o `🖼️ IMG`) junto a su carpeta virtual.

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
