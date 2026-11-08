# 📋 Requerimientos Funcionales (Functional Requirements) - ProPresenter AI Studio

Este documento especifica todos los **Requerimientos Funcionales (RF)** de **ProPresenter AI Studio**, organizados por módulos operativos de la aplicación.

---

## 🖥️ 1. Módulo de Gestión Multipantalla y Visualización

* **RF-01 | Ventana de Audiencia (Audience Display):** La aplicación debe emitir una señal de salida a pantalla completa (`audience.html`) destinada a proyectores, pantallas LED gigantes o software de transmisión (OBS/NDI), proyectando capas de texto, fondos de video loop e imágenes estáticas.
* **RF-02 | Monitor de Escenario (Stage Display):** La aplicación debe proporcionar una pantalla de retorno independiente (`stage.html`) optimizada para predicadores y músicos.
* **RF-03 | Cronómetros y Temporizadores:** El monitor de escenario debe permitir ejecutar temporizadores regresivos configurables (5 min, 10 min, Pausa/Reanudar) para el control del tiempo en vivo.
* **RF-04 | Reloj en Tiempo Real:** El monitor de escenario debe mostrar un reloj digital actualizado en tiempo real.
* **RF-05 | Vista Previa de Filminas:** El monitor de escenario debe mostrar simultáneamente la diapositiva actual emitida y una vista previa de la siguiente filmina.
* **RF-06 | Sincronización Inter-pantallas:** La aplicación debe sincronizar en tiempo real el estado entre la consola de control y las ventanas secundarias (Audiencia y Escenario) mediante la API *BroadcastChannel*.

---

## ⚡ 2. Motor de Proyección y Transiciones en Vivo

* **RF-07 | Control de Limpieza Independiente por Capas:** La aplicación debe permitir limpiar de forma independiente las capas en vivo mediante botones y atajos de teclado:
  * `F2`: Limpiar Texto (*Clear Text*)
  * `F3`: Limpiar Fondo Multimedia (*Clear Media*)
  * `F4`: Limpiar Overlays (*Clear Overlays*)
  * `Escape`: Limpiar Todo (*Clear All*)
* **RF-08 | Transiciones Configurables por Capa:** La aplicación debe permitir elegir el tipo de transición (`Cut` instantáneo o `Fade` suave) de manera independiente para la capa de **Texto** y la capa de **Medios**.
* **RF-09 | Control de Tiempo de Transición:** La aplicación debe ofrecer un deslizador interactivo para ajustar el tiempo de transición en vivo entre **100 ms y 1000 ms**.
* **RF-10 | Navegación de Diapositivas:** La aplicación debe permitir avanzar o retroceder diapositivas mediante teclas directas (`Espacio`, `Flechas`), clics en la cuadrícula o botones de control.
* **RF-11 | Superposición de Terceros Inferiores (Lower Thirds):** La aplicación debe permitir proyectar overlays de zócalos/titulares sobre fondos de video en vivo.

---

## 📖 3. Gestor Bíblico y Navegador de Escrituras

* **RF-12 | Navegación Estructurada de Biblias:** La aplicación debe permitir la navegación por 3 columnas: **Libros (66) ➔ Capítulos ➔ Versículos**.
* **RF-13 | Buscador Bíblico con Autocompletado:** El buscador de libros debe ofrecer filtrado en tiempo real y autocompletado del nombre del libro seleccionado al presionar la tecla **`Tab ↹`**.
* **RF-14 | Importación Dinámica de Biblias:** La aplicación debe permitir cargar e importar nuevas versiones de la Biblia desde una **URL remota (JSON)** o mediante la subida de un **archivo `.json` local**.
* **RF-15 | División Inteligente de Versículos Extensos:** La aplicación debe fragmentar automáticamente versículos largos en múltiples filminas sin cortar palabras.
* **RF-16 | Control de Renglones por Filmina:** La aplicación debe permitir limitar la cantidad máxima de renglones mostrados por filmina (1, 2, 3 renglones o sin límite).
* **RF-17 | Formato y Subtítulo de Cita Bíblica:** La aplicación debe adjuntar automáticamente la referencia bíblica al pie de la filmina (*ej. Juan 3:16 - RVR1960*) en fuente reducida, itálica y resaltada.
* **RF-18 | Conversión de Capítulo a Show:** La aplicación debe permitir transformar cualquier capítulo bíblico cargado en una presentación permanente guardada en la biblioteca.
* **RF-19 | Gestión de Versiones Guardadas:** La aplicación debe almacenar las versiones importadas y permitir su eliminación desde la lista.

---

## 🎵 4. Biblioteca de Shows, Canciones y Búsqueda Web

* **RF-20 | Gestión de Presentaciones (Shows):** La aplicación debe permitir crear, guardar, editar y organizar letras de canciones y guiones de sermones.
* **RF-21 | Clasificación por Categorías:** Las presentaciones deben poder clasificarse por categorías (*Alabanza, Adoración, Predicación, Overlays Stream*).
* **RF-22 | Estructura en Grupos/Secciones:** Las letras deben poder dividirse en secciones (*Estrofa 1, Coro, Puente, Solo, etc.*) con insignias visuales (badges).
* **RF-23 | Buscador Web de Canciones Integrado:** La aplicación debe permitir buscar letras de canciones en la web por nombre o autor e importarlas a la biblioteca en 1 clic.
* **RF-24 | Eliminar Elementos:** La aplicación debe permitir eliminar canciones o elementos seleccionados mediante menú contextual (clic derecho) o la tecla **`Supr` / `Delete`**.

---

## 🖼️ 5. Galería Multimedia y Generador Dinámico

* **RF-25 | Galería de Fondos:** La aplicación debe permitir almacenar y previsualizar fondos de video (`.mp4`) e imágenes estáticas.
* **RF-26 | Carpetas Virtuales:** La aplicación debe permitir organizar los archivos multimedia en carpetas virtuales personalizadas.
* **RF-27 | Subida de Medios:** La aplicación debe permitir agregar nuevos videos o imágenes desde el disco local o URLs.
* **RF-28 | Live Coder / Fondos Generativos Canvas 2D:** La aplicación debe incluir un motor de renderizado de Canvas 2D capaz de compilar y ejecutar código JavaScript en vivo para generar fondos animados interactivos.

---

## 🎨 6. Editor de Plantillas y Diseños Visuales (Templates)

* **RF-29 | Presets Predefinidos:** La aplicación debe incluir plantillas predefinidas (*Moderno Centrado, Lower Third, Caja Oscura Adoración, Neón Cyan*).
* **RF-30 | Edición Tipográfica y Estilos:** La aplicación debe permitir ajustar en tiempo real: tipografía, tamaño de fuente, alineación, interlineado, espaciado de letras, sombras de texto, padding, color de texto y bordes redondeados.
* **RF-31 | Estilo de Contenedor:** La aplicación debe permitir configurar cajas de fondo semitransparentes detrás del texto para mejorar la legibilidad sobre videos claros.

---

## 📅 7. Calendario y Gestor de Eventos

* **RF-32 | Programación de Servicios y Ensayos:** La aplicación debe proporcionar un calendario con vista mensual para agendar servicios, ensayos de alabanza, reuniones y conferencias.
* **RF-33 | Registro de Detalles de Evento:** Cada evento debe registrar título, fecha, hora, categoría y notas descriptivas.
* **RF-34 | Proyección Directa de Anuncios:** La aplicación debe permitir proyectar directamente en la pantalla de Audiencia los avisos y anuncios agendados en el calendario.

---

## 🤖 8. Copiloto de Inteligencia Artificial (AI Copilot)

* **RF-35 | Asistencia al Operador por IA:** La aplicación debe integrar un módulo de copiloto inteligente para asistir en la creación rápida de diapositivas, generación de bosquejos de sermones o corrección de letras.

---

## ⚙️ 9. Persistencia Local e Interfaz de Usuario

* **RF-36 | Funcionamiento 100% Offline:** Todas las funciones de proyección, bibliotecas, plantillas y Biblias deben funcionar sin conexión a internet a través de almacenamiento local (`localStorage`).
* **RF-37 | Interfaz Pro con Panel Inferior Redimensionable:** El dock inferior (*Shows, Media, Templates, Scripture, Calendar*) debe permitir ajustar su altura mediante arrastre de barra vertical (*resizer*).

---

## ✂️ 10. División Inteligente de Filminas y Control de Plantillas

* **RF-38 | División Inteligente de Canciones y Reflow:** La aplicación debe permitir dividir letras de presentaciones por saltos de línea, número de renglones (`maxLines`) o párrafos, ofreciendo una herramienta de re-división interactiva (*Reflow Deck*) para la canción activa.
* **RF-39 | División Automática por Excedente de Plantilla:** Al asignar o modificar una plantilla gráfica con restricción de líneas (`maxLines > 0`), la aplicación debe dividir automáticamente las filminas cuyo texto supere ese límite en nuevas tarjetas consecutivas sin cortar palabras.
* **RF-40 | Carga desde Portapapeles y Asignación de Plantilla:** Al crear una nueva presentación, la aplicación debe permitir seleccionar la plantilla gráfica inicial y pegar directamente el texto almacenado en el portapapeles con un solo clic.

---

## 🎛️ 11. Ergonomía del Operador, Zoom y Paridad Multipantalla

* **RF-41 | Control Deslizante de Zoom en Tarjetas de Filmina (Slide Grid Zoom):** La aplicación debe ofrecer un control deslizante continuo (rango `140px` a `380px`) en el dock de filminas para personalizar el tamaño visual de las tarjetas.
* **RF-42 | Vista Previa 100% Fiel 1:1 en Monitor de Programa (`.monitor-screen`):** La vista previa del programa en vivo en la consola del operador debe escalar su tipografía, tamaño de fuente, interlineado, sombras, distribución de saltos de línea y posición vertical (`posY`) mediante CSS Container Queries (`cqw`), garantizando paridad 1:1 idéntica a la señal emitida en la ventana de Audiencia (`audience.html`).
* **RF-43 | Menú Contextual Dinámico para Componentes:** La aplicación debe mostrar un menú desplegable contextual inteligente al hacer clic derecho sobre canciones, archivos multimedia, biblias, filminas y eventos, permitiendo acciones de Proyectar, Editar, Duplicar, Copiar y Eliminar.
* **RF-44 | Inyección Dinámica de Versión del Sistema:** La aplicación debe leer automáticamente la versión declarada en `package.json` e inyectarla dinámicamente en la insignia del encabezado principal (`PRO vX.Y.Z`).

---

## 💾 12. Motor de Persistencia Multimedia y Caché de Miniaturas

* **RF-45 | Persistencia de Medios vía IndexedDB (`media-cache.js`):** La aplicación debe almacenar archivos multimedia y miniaturas binarias en una base de datos local IndexedDB (`FreePresenterMediaDB`), superando el límite de 5MB de `localStorage` y restaurando automáticamente los recursos tras reiniciar la aplicación.
* **RF-46 | Generación y Caché de Miniaturas Visuales para Medios:** La aplicación debe capturar fotogramas estáticos ligeros JPEG (320x180 px) mediante Canvas al importar videos o imágenes, renderizando miniaturas estáticas optimizadas en la cuadrícula de medios con etiquetas identificadoras (`🎬 VIDEO` / `🖼️ IMG`).

---

## 🔊 13. Motor de Audio de Medios en Vivo y Control de Salida Sonora

* **RF-47 | Reproducción Sonora de Videos:** La aplicación debe reproducir el audio de los videos proyectados a través de la pantalla de Audiencia (`audience.html`) y a través de la consola del operador (cuando la ventana de audiencia no esté abierta para evitar eco acústico), garantizando salida sonora sincronizada sin bloqueos por políticas de autoplay.
* **RF-48 | Conmutador de Sonido y Control de Volumen (Mute / Unmute & Volume):** La aplicación debe proporcionar botones accesibles en la cabecera del monitor en vivo (`LIVE PROGRAM`), en el panel de transiciones y en el dock de medios para habilitar o silenciar el sonido de los videos en tiempo real, con soporte para atajo de teclado (`M`) y deslizador de volumen master (0% - 100%).

---

## 🏷️ 14. Motor de Secciones de Canciones / Shows y Barra de Salto Rápido

* **RF-49 | Detección Inteligente y Marcado de Secciones de Canción:** La aplicación debe reconocer automáticamente etiquetas de sección (`[Intro]`, `[Verso 1]`, `[Pre-Coro]`, `[Coro]`, `[Puente]`, `[Instrumental]`, `[Final]`, `[Sermón]`) tanto al importar o pegar letras como al crearlas manualmente, eliminando automáticamente los encabezados de los textos proyectados en pantalla y permitiendo asignar o reasignar secciones dinámicamente mediante chips rápidos, menú contextual o selector en la tarjeta de filmina.
* **RF-50 | Barra Superior de Navegación y Salto Rápido a Secciones:** La aplicación debe renderizar una barra horizontal interactiva (`#deck-sections-nav`) ubicada directamente arriba de la cuadrícula de filminas, mostrando botones codificados por color con el nombre y conteo de diapositivas de cada sección; al presionar cualquier botón de sección, el sistema debe realizar un scroll suave hacia dicha sección, resaltar la tarjeta con un destello animado y proyectar de inmediato su primera diapositiva en vivo.

---

## ⏭️ 15. Cola de Reproducción Multimedia y Transición Automática al Finalizar

* **RF-51 | Encolado Rápido con `Alt + Click` y Transición Automática al Finalizar Video:** Si bien los videos se reproducen en bucle (`loop`) por defecto, el operador debe poder agregar uno o más elementos multimedia a una cola de reproducción haciendo `Alt + Click` sobre cualquier tarjeta de medio (o mediante el botón `+Cola` / menú contextual). Mientras existan elementos en la cola, el video en curso desactiva su bucle infinito y, al finalizar su reproducción (`ended`), transiciona automáticamente al siguiente elemento marcado en la cola. Una vez alcanzado el último elemento y vaciada la cola, la reproducción retoma el modo loop automático.
* **RF-52 | Panel Lateral Derecho de Cola de Reproducción Siguiente:** Cuando exista una cola activa (`mediaQueue.length > 0`), debe desplegarse automáticamente una lista a la derecha (tanto en la pestaña `Media` junto a la grilla como debajo del monitor en vivo en la barra lateral derecha) mostrando el elemento en curso y el orden de los elementos que siguen (`#1`, `#2`, etc.), permitiendo saltar inmediatamente a cualquiera (`▶`), avanzar al siguiente (`⏭️ Pasar`), reordenar (`↑`/`↓`), quitar elementos individuales (`×`) o vaciar la cola (`🗑️ Vaciar`).
* **RF-53 | Línea de Tiempo Manejable y Dock de Audiencia Ampliado:** El dock de controles de la pantalla de audiencia debe contar con el doble de ancho para evitar que los controles queden apretados y proveer una línea de tiempo manejable (seek slider, play/pause, reinicio y visualización de tiempo restante/total) para el medio en reproducción.

---

## 🔍 16. Búsqueda de Canciones Descargadas, Control de Edición Visual y Carpetas Físicas

* **RF-54 | Búsqueda Global de Canciones Descargadas y Actualización in-place:** La aplicación debe permitir buscar canciones descargadas con coincidencia insensible a mayúsculas y acentos a través de título, categoría, secciones y letras completas en todos los buscadores (dock, barra lateral de proyecto y pestaña de búsqueda web mostrando coincidencias locales prioritarias). La edición de canciones debe realizarse in-place sobre la misma canción sin duplicarla.
* **RF-55 | Control de Edición con Comparador Visual (Qué Queda y Qué se Borra):** Al editar canciones o filminas individuales, la interfaz debe ofrecer selección de texto de alto contraste y un comparador visual en vivo que distinga claramente las líneas conservadas (verde / `QUEDA`) de las líneas eliminadas (rojo tachado / `SE BORRA`) con opción de restaurarlas con un clic (`↩ Restaurar`).
* **RF-56 | Sincronización en Tiempo Real de Carpetas Físicas de Disco:** La biblioteca multimedia debe permitir vincular carpetas físicas de la PC (mediante diálogo nativo o drag & drop) mostrándolas en la misma lista junto a las carpetas virtuales, monitoreando automáticamente cambios en vivo en el disco para agregar o retirar medios sin intervención manual.
* **RF-57 | Estabilidad e Interactividad Permanente de Modales:** Las ventanas modales (creación de canción, edición, medios, biblias, eventos) deben mantenerse inmunes a bloqueos de foco, pérdidas de hit-testing por aceleración de video o congelamientos por diálogos nativos, garantizando que los cuadros de texto y botones respondan instantáneamente al clic.
* **RF-58 | Creación y Proyección de Overlays / Lower Thirds Personalizados:** La aplicación debe permitir crear libremente shows de tipo Lower Thirds seleccionando la categoría `Overlays Stream / Lower Thirds` o insertando etiquetas `[Overlay]`, asignando automáticamente la insignia `badge-lowerthird` y configurando el flag `isLowerThird = true` en sus diapositivas. Al proyectar una de estas diapositivas, debe emitirse la placa de zócalo inferior superpuesta tanto en la pantalla de Audiencia como en la vista previa del operador (`#operator-lower-third-banner`) sin limpiar ni sustituir la capa de texto principal.

---

## 🖥️ 17. Editor de Canción y Diapositivas en Pantalla Completa (Estilo FreeShow)

* **RF-59 | Editor de Canción Completa en 3 Columnas sin Modales:** Al editar una canción completa (`✏️ Editar Canción`, pestaña `[Edit]` o menú contextual), la aplicación no debe abrir una ventana modal flotante, sino transicionar a una vista de pantalla completa de 3 columnas:
  1. **Columna Izquierda (Filminas):** Lista vertical de todas las diapositivas de la canción en miniaturas 16:9 con numeración, badge de sección, botón `+ Nueva Filmina` y acciones de reordenamiento (`↑`/`↓`), duplicación y eliminación.
  2. **Columna Central (Lienzo / Canvas):** Lienzo 16:9 interactivo con recuadro Bounding Box (borde magenta y 8 handles de redimensionamiento estilo FreeShow) para edición directa de texto en tiempo real (WYSIWYG), selector de sección, barra de navegación y herramientas de división de filmina en cursor.
  3. **Columna Derecha (Inspector de Estilos):** Panel de opciones de diseño con selector de familia tipográfica (`CMGSans`, `Inter`, `Montserrat`, etc.), tamaño de fuente (input + slider), color de texto y hex swatch, barra de formato (**B**, *I*, <u>U</u>, <s>S</s>, TT), alineación horizontal y vertical, interlineado, espaciado entre letras, renglones máximos (`maxLines`), contorno de texto (`outline`), sombra (`shadow`), caja de fondo semitransparente (`bgColor`) y selector de ámbito (aplicar a toda la canción o a la diapositiva actual).





