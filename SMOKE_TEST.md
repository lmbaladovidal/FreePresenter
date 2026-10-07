# 🧪 Protocolo y Plan de Smoke Test - ProPresenter AI Studio

Este documento define el **Plan de Smoke Test** (Prueba de Humo) para verificar de forma rápida la estabilidad y funcionamiento de los 37 Requerimientos Funcionales (**RF-01 al RF-37**) de **ProPresenter AI Studio**.

---

## ⚡ 1. Ejecución de Pruebas Automatizadas

El proyecto cuenta con un suite de pruebas automatizado que valida la integridad del estado, motor de transiciones, escrituras, live coder 2d y plantillas.

```bash
npm test
```

> **Resultado Esperado:** `📊 RESULTADOS SMOKE TEST: 10/10 PRUEBAS EXITOSAS`

---

## 📋 2. Matriz de Smoke Test Manual (Paso a Paso)

### 🖥️ Módulo 1: Multipantalla y Visualización en Vivo
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-01** | Apertura Ventana Audiencia | Abrir `audience.html` o presionar botón Audiencia. | La ventana secundaria muestra la proyección a pantalla completa sin distorsión. | RF-01 |
| **ST-02** | Pantalla Stage Display | Abrir `stage.html` en el monitor secundario. | Muestra reloj en tiempo real, filmina actual y vista previa de la siguiente. | RF-02, RF-04, RF-05 |
| **ST-03** | Temporizadores regresivos | Activar temporizador de 5 min en el panel Stage. | El reloj regresivo inicia el conteo visible en `stage.html`. | RF-03 |
| **ST-04** | Sincronización Broadcast | Cambiar filmina activa en consola principal. | Las pantallas de Audiencia y Stage actualizan su contenido instantáneamente. | RF-06 |

---

### ⚡ Módulo 2: Motor de Proyección y Transiciones
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-05** | Limpieza por Capas | Presionar `F2` (Texto), `F3` (Fondo), `F4` (Overlay), `Esc` (All). | Cada capa se oculta/muestra de forma independiente según la tecla presionada. | RF-07 |
| **ST-06** | Selección Cut / Fade | Cambiar modo de transición de Texto a `Cut` y Medios a `Fade`. | El texto cambia de inmediato mientras el fondo realiza un fundido suave. | RF-08 |
| **ST-07** | Tiempo de Transición | Ajustar el slider de fade a `800 ms`. | La velocidad del fundido se alarga visiblemente a 800 milisegundos. | RF-09 |
| **ST-08** | Navegación Teclado | Usar tecla `Espacio` y `Flechas Derecha/Izquierda`. | Avanza o retrocede de filmina en el orden correcto. | RF-10 |
| **ST-09** | Proyección Lower Third | Seleccionar un item de Lower Third en el dock. | Aparece el zócalo de texto inferior superpuesto al video. | RF-11 |

---

### 📖 Módulo 3: Escrituras y Navegador Bíblico
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-10** | Navegación 3 Columnas | Seleccionar Libro (ej: Juan) ➔ Cap 3 ➔ Versículo 16. | Carga el texto del versículo seleccionado. | RF-12 |
| **ST-11** | Autocompletado con `Tab` | Escribir `Rom` en el buscador bíblico y presionar `Tab ↹`. | Se autocompleta instantáneamente a `Romanos`. | RF-13 |
| **ST-12** | Importación URL / JSON | Pegar una URL de Biblia en `.json` o subir archivo local. | La nueva versión aparece en la lista de Biblias disponibles. | RF-14, RF-19 |
| **ST-13** | División Versículos | Cargar un versículo largo con la opción "Dividir Extensos" activa. | El versículo se fragmenta en 2 o más filminas fluidas. | RF-15 |
| **ST-14** | Renglones y Cita Pie | Ajustar a "2 Renglones" y activar "Mostrar Cita". | La proyección limita el texto a 2 líneas e incluye la cita en cian itálica al pie. | RF-16, RF-17 |
| **ST-15** | Convertir a Show | Hacer clic en `✨ Convertir a Show` en un capítulo bíblico. | El capítulo completo se guarda como un Show en la biblioteca principal. | RF-18 |

---

### 🎵 Módulo 4: Shows, Canciones y Búsqueda Web
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-16** | Edición de Show | Crear/Editar una canción y asignar categorías (ej: Alabanza). | El Show guarda el contenido y muestra los badges de categoría. | RF-20, RF-21 |
| **ST-17** | Badges de Sección | Dividir canción en `Estrofa 1`, `Coro`, `Puente`. | Aparecen las etiquetas de color (*badge-verse*, *badge-chorus*). | RF-22 |
| **ST-18** | Buscador Web | Buscar "Cuan Grande Es Dios" en la pestaña de búsqueda web. | Muestra los resultados de letras y permite importarla en 1 clic. | RF-23 |
| **ST-19** | Eliminar con `Supr` | Seleccionar una canción y presionar `Supr` / `Delete`. | Solicita confirmación y elimina la canción de la biblioteca. | RF-24 |

---

### 🖼️ Módulo 5: Galería Multimedia y Live Coder
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-20** | Cambio de Fondo | Hacer clic en una tarjeta de video en la pestaña Media. | El fondo de la pantalla Audiencia cambia inmediatamente al nuevo video loop. | RF-25 |
| **ST-21** | Carpetas Virtuales | Crear una carpeta virtual y asignar archivos a ella. | Los videos se filtran correctamente según la carpeta seleccionada. | RF-26 |
| **ST-22** | Subida de Medios | Arrastrar o seleccionar una nueva imagen o video desde el disco. | El archivo se incorpora a la galería multimedia. | RF-27 |
| **ST-23** | Live Coder Canvas 2D | Abrir el panel Live Coder y compilar un fondo en código JS. | Renderiza el lienzo interactivo animado en tiempo real. | RF-28 |

---

### 🎨 Módulo 6: Editor de Plantillas y Estilos Visuales
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-24** | Presets de Plantilla | Cambiar entre *Moderno*, *Lower Third*, *Adoración* y *Neón*. | El diseño de las letras proyectadas cambia dinámicamente. | RF-29 |
| **ST-25** | Edición de Fuente/Color| Modificar tamaño de letra, tipografía y sombras en el editor. | Aplica los cambios visuales en vivo en la pantalla de Audiencia. | RF-30 |
| **ST-26** | Caja de Fondo | Ajustar el color de caja semitransparente (`bgColor`) y padding. | El contenedor detrás del texto adopta los bordes y transparencia elegida. | RF-31 |

---

### 📅 Módulo 7: Calendario y Anuncios de Eventos
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-27** | Agendar Evento | Crear un evento "Servicio Dominical" con fecha y hora. | El evento se posiciona en el día correspondiente en la vista mensual. | RF-32, RF-33 |
| **ST-28** | Proyectar Anuncio | Presionar el botón `Proyectar Anuncio` en una tarjeta de evento. | Emite la placa del aviso en la pantalla de Audiencia. | RF-34 |

---

### 🤖 Módulo 8 & ⚙️ Módulo 9: AI Copilot & Persistencia Offline
| ID | Caso de Prueba | Pasos de Verificación | Resultado Esperado | Cobertura RF |
| :--- | :--- | :--- | :--- | :--- |
| **ST-29** | Asistente IA | Solicitar asistencia en el panel de Copiloto. | Proporciona respuestas o bosquejos para el operador. | RF-35 |
| **ST-30** | Prueba 100% Offline | Desconectar Wi-Fi / Red y operar la aplicación. | Todas las canciones, biblias guardadas, plantillas y videos locales proyectan perfectamente. | RF-36 |
| **ST-31** | Resizer Dock Inferior | Arrastrar verticalmente la barra superior del panel inferior. | El dock inferior se redimensiona en altura fluidamente. | RF-37 |

---

## 🎯 Criterios de Aprobación (Pass Criteria)

1. **Cero Crashes / Errores de Consola:** No deben existir excepciones no capturadas al realizar cambios de filminas o pantallas.
2. **Pruebas Automatizadas 100% Verdes:** Ejecutar `npm test` exitosamente antes de cada compilación ejecutable `.exe`.
3. **Latencia < 50ms:** La respuesta al cambiar filminas entre la consola y la pantalla Audiencia/Stage debe ser imperceptible en eventos en vivo.
