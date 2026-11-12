# 📖 Manual de Usuario — FreePresenter AI / ProPresenter Studio

> **Versión del Software:** `v2.0.0`  
> **Propósito:** Guía integral de operación para operadores de medios, técnicos de sonido/video, pastores y líderes de alabanza en cultos, congresos y transmisiones en vivo.

---

## 📑 Tabla de Contenidos

1. [Introducción y Arquitectura de Pantallas](#1-introducción-y-arquitectura-de-pantallas)
2. [Recorrido Visual de la Interfaz](#2-recorrido-visual-de-la-interfaz)
3. [Gestión y Carga de Canciones y Shows](#3-gestión-y-carga-de-canciones-y-shows)
4. [Uso de Etiquetas y Secciones](#4-uso-de-etiquetas-y-secciones)
5. [Sistema de Plantillas (Templates) y Asignación de Estilos](#5-sistema-de-plantillas-templates-y-asignación-de-estilos)
6. [Operación en Vivo y Controles de Proyección](#6-operación-en-vivo-y-controles-de-proyección)
7. [Galería Multimedia, Fondos y Cola de Reproducción](#7-galería-multimedia-fondos-y-cola-de-reproducción)
8. [Módulo Bíblico (Scripture)](#8-módulo-bíblico-scripture)
9. [Presentaciones PowerPoint / PDF y Calendario](#9-presentaciones-powerpoint--pdf-y-calendario)
10. [Editor en Pantalla Completa (Full-Screen Editor)](#10-editor-en-pantalla-completa-full-screen-editor)
11. [Tabla de Atajos de Teclado](#11-tabla-de-atajos-de-teclado)
12. [Preguntas Frecuentes y Solución de Problemas](#12-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. Introducción y Arquitectura de Pantallas

**FreePresenter AI** funciona con un modelo de **triple pantalla sincronizada en tiempo real** mediante canales IPC y Web Broadcast de ultra baja latencia:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CONSOLA DEL OPERADOR                            │
│  (Pantalla Principal: Control de Shows, Medios, Plantillas y Letras)    │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌──────────────────────────────┐        ┌────────────────────────────────┐
│     PANTALLA DE AUDIENCIA    │        │       MONITOR DE ESCENARIO     │
│       (`audience.html`)      │        │        (`stage.html`)          │
│ • Proyector / TV Principal   │        │ • Pantalla para Músicos/Pastor │
│ • Salida limpia para OBS/NDI │        │ • Reloj, Timer, Diapositiva    │
│ • Texto + Fondos dinámicos   │        │   actual y siguiente filmina   │
└──────────────────────────────┘        └────────────────────────────────┘
```

1. **Pantalla Principal (Operador):** Donde se administran los proyectos, canciones, búsquedas y órdenes del servicio.
2. **Pantalla de Audiencia (`audience.html`):** Ventana limpia sin marcos destinada a los proyectores del auditorio o tarjetas capturadoras de streaming.
3. **Monitor de Escenario / Stage Display (`stage.html`):** Ventana con texto en alto contraste, reloj en tiempo real, cuenta regresiva del predicador y aviso de la diapositiva que viene.

> [!TIP]
> Puedes abrir o relanzar las pantallas de salida en cualquier momento desde los botones superiores **`Audiencia`** y **`Stage`** situados en la esquina superior derecha del encabezado.

---

## 2. Recorrido Visual de la Interfaz

La pantalla principal está dividida en cuatro áreas estratégicas:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. BARRA SUPERIOR: Menú, Modo (Show/Edit/Stage) y Lanzadores de Pantalla  │
├──────────────┬──────────────────────────────────────────────┬──────────────┤
│ 2. PROYECTO  │ 3. ÁREA CENTRAL (DECK ACTIVO)                │ 4. OPERADOR  │
│    (Sidebar  │ • Banner con Título y Navegación             │ • Monitor    │
│    Izquierdo)│ • Barra de Secciones (Coro, Estrofa...)      │   Audiencia  │
│              │ • Cuadrícula de Diapositivas (16:9)          │ • Transporte │
│              │                                              │ • Clear All  │
│              │                                              │ • Transición │
│              │                                              │ • Stage Mon. │
├──────────────┴──────────────────────────────────────────────┴──────────────┤
│ 5. DOCK DE RECURSOS (Shows | Media | Templates | Scripture | Calendar)     │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Panel Izquierdo (Proyecto del Día):** Muestra el orden de las canciones y elementos que se usarán en el servicio actual.
- **Centro (Lienzo de Diapositivas):** Visualiza todas las filminas de la canción seleccionada con su fondo y estilo real.
- **Panel Derecho (Control de Emisión):** Previsualización en vivo de lo que ve el público, botones de emergencia (*Clear All, Clear Text, Clear Media*), controles de transiciones y monitor de confianza.
- **Dock Inferior (Biblioteca General):** Acceso rápido a toda la base de datos de canciones, biblioteca de videos/imágenes, editor de plantillas, buscador de Biblias y agenda.

---

## 3. Gestión y Carga de Canciones y Shows

Existen tres métodos para incorporar canciones al software:

### Método A: Creación Manual con División Automática
1. En el dock inferior, haz clic en la pestaña **`Shows`**.
2. Presiona el botón rosa **`+ Nuevo Texto / Canción`**.
3. Completa los campos:
   - **Título:** Nombre de la canción (ej. *Cuan Grande Es Él*).
   - **Categoría:** Selecciona *Alabanza*, *Adoración*, *Sermón*, *Avisos* u *Overlays Stream*.
   - **Plantilla Inicial:** Elige la plantilla visual con la que nacerá la canción.
   - **Modo de División:**
     - *Por Párrafo:* Cada salto de párrafo doble genera una filmina.
     - *Por Líneas:* Cada línea de texto genera una diapositiva individual.
     - *Fijo por N renglones:* Define un límite estricto (ej. 2 o 4 renglones por diapositiva).
4. Pega la letra completa en el cuadro de texto y pulsa **`Guardar Show`**.

### Método B: Búsqueda Web de Canciones en 1 Clic
1. En el modal de creación de show, haz clic en la pestaña **`Buscar en la Web`**.
2. Escribe el nombre de la canción o parte de la letra.
3. El buscador listará:
   - Coincidencias en tu biblioteca local (si ya la tienes descargada).
   - Resultados en línea extraídos de bases de alabanza cristiana.
4. Haz clic en **`Importar Letra`**. La letra se limpiará automáticamente, detectará sus secciones y estará lista para guardar.

### Método C: Agregar Canciones al Proyecto del Día
- En la cuadrícula de canciones del dock inferior, cada tarjeta tiene un botón **`+ Proyecto`**.
- Al pulsarlo, la canción se ancla en el panel lateral izquierdo (**PROJECTS**).
- Puedes quitarla del proyecto en cualquier momento tocando la cruz **`×`** en el sidebar (la canción seguirá existiendo en tu biblioteca general).

---

## 4. Uso de Etiquetas y Secciones

FreePresenter AI incluye un analizador inteligente de estructura musical. Al pegar la letra de una canción, el sistema identifica automáticamente los bloques mediante corchetes o dos puntos:

### Etiquetas Reconocidas Automáticamente

| Etiqueta en la Letra | Sección Resultante | Color del Badge | Icono |
| :--- | :--- | :--- | :--- |
| `[Intro]` o `Intro:` | Introducción instrumental | Azul Celeste (`badge-intro`) | 🎵 Nota |
| `[Estrofa 1]`, `[Verso 1]` | Estrofas o versos principales | Azul Real (`badge-verse`) | 📖 Libro |
| `[Pre-Coro]` o `Pre-coro:` | Preparación al coro | Rosa Fuerte (`badge-prechorus`) | ⚡ Rayo |
| `[Coro]` o `Chorus:` | Estribillo principal | Violeta Neón (`badge-chorus`) | 🔥 Fuego |
| `[Puente]` o `Bridge:` | Clímax o puente de la canción | Ámbar / Dorado (`badge-bridge`) | 🔗 Enlace |
| `[Instrumental]` o `Solo:` | Solo musical | Turquesa (`badge-instrumental`) | 🎧 Auricular |
| `[Final]`, `[Outro]` o `Coda:` | Cierre de la canción | Rojo Carmín (`badge-outro`) | 🚩 Bandera |
| `[Sermón]` o `Puntos:` | Notas del predicador | Verde Esmeralda (`badge-sermon`) | 💬 Mensaje |
| `[Overlay]` o `LowerThird:` | Zócalo inferior para nombres | Fucsia Oscuro (`badge-lowerthird`) | 👤 Persona |

### Barra de Navegación Rápida por Secciones
En la parte superior de la cuadrícula de filminas encontrarás una botonera con todas las secciones de la canción:

![Barra de Secciones](file:///f:/Proyectos/propresenter-ai-studio/src/css/style.css#L428-L530)

- Si el líder de alabanza decide repetir el coro de forma espontánea, no tienes que buscar la filmina: simplemente **haz clic en el botón `Coro`** de la barra de secciones y saltarás inmediatamente a esa estrofa.
- La sección que se encuentra actualmente proyectándose en vivo parpadea con un punto rojo indicador `●` (**En Vivo**).

---

## 5. Sistema de Plantillas (Templates) y Asignación de Estilos

Las plantillas definen la tipografía, tamaño de letra, colores, bordes, sombras, alineación y cajas de fondo de las diapositivas.

### Asignación Rápida con 1 Clic (¡Nueva función v2.0!)
Si tienes un show cargado en pantalla y deseas cambiarle el diseño rápidamente:
1. Haz clic en la canción en el panel izquierdo o en el dock inferior para que sea el **show activo**.
2. En el dock inferior, dirígete a la pestaña **`Templates`**.
3. **Haz clic sobre la plantilla que deseas aplicar** en la lista lateral izquierda.
4. **Listo:** El show activo adoptará inmediatamente el estilo de esa plantilla (y si la plantilla define un límite de renglones, ajustará sus filminas automáticamente).
5. **Aislamiento total:** Ninguna otra canción de tu biblioteca se verá afectada; el cambio se aplica únicamente al show seleccionado.

### Otras Formas de Asignar Plantillas
- **Al crear un Show:** Desde el menú desplegable *Plantilla* del modal de creación.
- **Desde el Editor en Pantalla Completa:** En la columna derecha (Inspector), en la sección *Plantilla de la Canción*.

### Crear y Editar Plantillas
En la pestaña **`Templates`** del dock inferior puedes:
- Modificar en tiempo real la tipografía (`Inter`, `Montserrat`, `CMGSans`, `Outfit`, `Roboto`, etc.).
- Variar tamaño, interlineado y separación de caracteres con previsualización en vivo.
- Configurar cajas traslúcidas (`bgColor`) detrás del texto para garantizar legibilidad sobre fondos claros.
- Crear nuevas plantillas con el botón **`+ Nueva Plantilla`**.

---

## 6. Operación en Vivo y Controles de Proyección

### Cómo Proyectar una Diapositiva
1. Haz clic sobre cualquier filmina en la cuadrícula central.
2. La filmina se rodeará de un **borde rojo brillante** con el badge `EN VIVO`.
3. Inmediatamente el texto aparecerá en la pantalla de Audiencia y en el monitor del operador.

### Navegación Durante el Servicio
- **Avanzar:** Presiona la tecla **`Espacio`**, **`Enter`** o **`Flecha Derecha`**.
- **Retroceder:** Presiona la tecla **`Flecha Izquierda`**.
- **Salto libre:** Haz clic con el ratón directamente sobre la filmina deseada.

### Botones de Emergencia (Master Clear)
Ubicados en la consola derecha del operador:
- **`CLEAR ALL` (`Escape`):** Apaga instantáneamente el texto, los fondos multimedia y los zócalos inferiores. La pantalla de audiencia queda en negro absoluto.
- **`Text (F2)`:** Oculta solo la letra de la canción, manteniendo el video de fondo en reproducción (ideal para momentos de oración o solos instrumentales).
- **`Media (F3)`:** Apaga el fondo de video o imagen, manteniendo el texto visible.
- **`Overlays (F4)`:** Oculta zócalos o tercios inferiores de nombres.

### Panel de Transiciones
Permite definir cómo entra y sale el contenido:
- **Texto:** Alterna entre `Cut` (corte directo instantáneo) y `Fade` (desvanecimiento suave).
- **Medios:** Alterna entre corte o disolución de video.
- **Tiempo (ms):** Deslizador que gradúa la velocidad del fundido (desde `100ms` hasta `1000ms`, predeterminado `250ms`).
- **Control de Audio:** Botón para silenciar/activar el sonido de los videos y slider de volumen general.

---

## 7. Galería Multimedia, Fondos y Cola de Reproducción

Haz clic en la pestaña **`Media`** en el dock inferior para gestionar videos e imágenes de fondo.

### Cargar Contenido
- **Arrastrar y Soltar:** Arrastra archivos de video (`.mp4`, `.webm`, `.mov`) o imágenes (`.jpg`, `.png`) directamente a la zona punteada (*Dropzone*).
- **Vincular Carpeta de Disco en Tiempo Real:** Pulsa el botón `+ Carpeta Física` para seleccionar una carpeta de tu disco duro. Cualquier video que pegues en esa carpeta de Windows aparecerá automáticamente en FreePresenter sin necesidad de volver a importarlo.

### Proyección de Medios
- **Clic simple:** Proyecta el video o imagen de fondo inmediatamente en bucle infinito (`Loop`).

### Cola de Reproducción Continua (Playlist Automática)
Si vas a pasar varios videos de anuncios o testimonios uno tras otro:
1. Mantén presionada la tecla **`Alt` y haz clic** en los videos que deseas encolar (o pulsa el botón `+Cola` de la tarjeta).
2. Los videos recibirán badges numéricos (`#1`, `#2`, `#3`).
3. El video activo desactivará su repetición en bucle y, al terminar su reproducción de forma natural, **pasará automáticamente al siguiente video en cola** con transición suave.

---

## 8. Módulo Bíblico (Scripture)

En el dock inferior, selecciona la pestaña **`Scripture`**:

### Búsqueda Rápida de Pasajes
1. En la caja de búsqueda escribe el libro, capítulo y versículo (ej. `Juan 3:16`, `Salmos 23` o `Gen 1`).
2. **Atajo `Tab ↹`:** Al escribir `G-e-n`, presiona `Tab` para que el sistema complete automáticamente `Génesis`.
3. Presiona `Enter` para buscar.

### Navegación por Columnas (3-Col View)
Si prefieres explorar visualmente:
- **Columna 1:** Selecciona el Libro de la Biblia.
- **Columna 2:** Elige el Capítulo.
- **Columna 3:** Visualiza todos los versículos listados.

### Proyección de Versículos
- **Doble clic o clic en versículo:** Proyecta el texto bíblico al instante en la pantalla de Audiencia.
- **Ajustes Bíblicos:** En el panel lateral derecho de la pestaña bíblica puedes configurar:
  - Máximo de renglones por filmina (para versículos largos).
  - Incluir referencia automática al pie (*ej. Juan 3:16 RVR1960*).
  - Selector de versión bíblica (Reina Valera 1960, NVI, etc.).
- **Importar Nuevas Biblias:** Puedes añadir traducciones adicionales pegando un enlace URL o cargando un archivo JSON bíblico con el botón `+ Cargar Biblia`.

---

## 9. Presentaciones PowerPoint / PDF y Calendario

### Importar Presentaciones de PowerPoint y PDF
FreePresenter AI te permite proyectar presentaciones sin necesidad de tener Microsoft Office instalado:
1. En el dock de Shows, presiona el botón naranja **`📊 Importar PPT / PDF`**.
2. Selecciona tu archivo (`.pptx`, `.ppt`, `.ppsx`, `.odp` o `.pdf`).
3. Elige el modo de importación:
   - **Presentación Visual (Recomendado):** Convierte cada lámina en una filmina de alta fidelidad 16:9 preservando las fuentes, fotos y diagramas originales.
   - **Extraer Texto:** Convierte el contenido de la presentación en diapositivas editables adaptadas a tus plantillas de alabanza.

### Calendario de Eventos y Anuncios
En la pestaña **`Calendar`**:
- Agenda cultos dominicales, reuniones de oración, discipulados y vigilias.
- Selecciona cualquier evento y haz clic en **`Proyectar Anuncio`** para lanzar una placa visual en la pantalla de audiencia con la fecha, hora y notas del evento.

---

## 10. Editor en Pantalla Completa (Full-Screen Editor)

Para diseñar o retocar una canción a fondo, pulsa el botón **`Editar Canción`** en el banner central o presiona la pestaña superior **`Edit`**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SUB-HEADER: TÍTULO Y GUARDAR                      │
├─────────────────┬──────────────────────────────────┬───────────────────┤
│ FILMINAS (Izq)  │ LIENZO 16:9 (Centro)             │ INSPECTOR (Der)   │
│ • Miniaturas    │ • Bounding Box con 8 handles     │ • Fuente y Tamaño │
│ • Reordenar ↑/↓ │ • Edición directa haciendo clic  │ • Color y Sombras │
│ • Duplicar      │ • División en cursor (✂️)        │ • Cajas de Fondo  │
│ • + Nueva filmina│ • Pestaña "Texto Completo" (Diff)│ • Alineación H/V  │
└─────────────────┴──────────────────────────────────┴───────────────────┘
```

- **Edición Directa (WYSIWYG):** Haz clic sobre el texto dentro del recuadro del lienzo central y escribe directamente.
- **Bounding Box Interactivo:** Arrastra los bordes y esquinas para definir el área donde debe confinarse el texto.
- **División de Filmina en el Cursor (`✂️`):** Coloca el cursor en la mitad de una estrofa y pulsa `Dividir`; el texto posterior pasará a una nueva filmina automáticamente.
- **Comparador Visual de Cambios (Diff):** En la pestaña *Texto Completo*, el sistema te mostrará en verde lo que se conserva y en rojo tachado lo que se borra, evitando pérdidas accidentales de estrofas.
- **Salir:** Presiona `Escape` o el botón `Cerrar Editor` para regresar a la vista de proyección.

---

## 11. Tabla de Atajos de Teclado

Memorizar estos atajos agilizará notablemente tu operación durante los servicios:

| Tecla / Combinación | Función en Proyección | Función en Edición / Búsqueda |
| :--- | :--- | :--- |
| **`Espacio`** / **`→`** | Siguiente diapositiva | — |
| **`←`** | Diapositiva anterior | — |
| **`F2`** | Limpiar / Restaurar Texto | — |
| **`F3`** | Limpiar / Restaurar Fondo Multimedia | — |
| **`F4`** | Limpiar / Restaurar Overlays (Zócalos) | — |
| **`Escape`** | **CLEAR ALL** (Apagón de emergencia) | Salir del Editor / Cerrar Modales |
| **`Supr` / `Delete`** | Eliminar canción, video o Biblia seleccionada | Borrar filmina en el editor |
| **`Tab ↹`** | — | Autocompletar libro en buscador bíblico |
| **`Ctrl + S`** | — | Guardar cambios en el Editor |
| **`Alt + Clic`** | Agregar video a la cola de reproducción | — |

---

## 12. Preguntas Frecuentes y Solución de Problemas

### ❓ La pantalla de Audiencia no se abre o quedó minimizada
**Solución:** Haz clic en el botón **`Audiencia`** en la esquina superior derecha del menú principal. Si tienes un segundo monitor o proyector conectado en modo extendido en Windows (`Windows + P` ➔ *Extender*), la ventana se posicionará automáticamente en el proyector.

### ❓ El video se reproduce pero no se escucha el audio
**Solución:** Revisa el panel derecho en la sección *TRANSICIONES EN VIVO*. Comprueba que el botón de audio indique `AUDIO: ON` y que el deslizador de volumen esté al 100%.

### ❓ Le cambié la plantilla a una canción pero sigue viéndose con letra pequeña
**Solución:** Con la canción seleccionada en pantalla, ve a la pestaña **`Templates`** en el dock inferior y haz clic sobre la plantilla que deseas aplicar. Si la canción tenía estilos locales personalizados aplicados desde el editor, este clic unificará y limpiará los estilos residuales aplicando la plantilla seleccionada.

### ❓ ¿Cómo proyectar un fondo negro sin texto rápidamente?
**Solución:** Pulsa la tecla **`F2`** para limpiar el texto y **`F3`** para limpiar el video, o pulsa **`Escape`** para un borrado maestro total.

---

*Manual elaborado para **FreePresenter AI Studio v2.0.0** — Sistema de Producción Multimedia para Iglesias y Eventos.*

