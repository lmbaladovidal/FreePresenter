# 🎭 ProPresenter Studio

> **Aplicación de escritorio nativa para transmisión en vivo, proyección en pantalla gigante (Audiencia) y monitor de escenario (Stage Display) con gestor de escrituras, calendario de eventos y control multipantalla.**

![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-43.4.1-47848F?logo=electron&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF?logo=vite&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen)

---

## 🌟 Descripción General

**ProPresenter Studio** es una estación de control multimedia para iglesias, conferencias, transmisiones en vivo y eventos escénicos. Diseñada como una **aplicación de escritorio nativa (.exe / instalador)** basada en **Electron y Vite**, ofrece rendimiento ultrarrápido, gestión multipantalla (Pantalla de Audiencia + Monitor de Escenario para predicadores y músicos), transiciones fluidas en tiempo real (Cut / Fade configurable), gestor de eventos con **Calendario** e importador inteligente de Escrituras capaz de cargar cualquier Biblia vía enlace URL o archivo JSON.

---

## 🚀 Características Principales

- 🖥️ **Control Multipantalla Nativo:**
  - **Ventana de Audiencia (`audience.html`):** Salida a pantalla completa para proyectores, monitores gigantes o señales de video (NDI/OBS).
  - **Monitor de Escenario / Stage Display (`stage.html`):** Vista dedicada para predicadores y músicos con reloj digital, temporizadores regresivos, diapositiva actual y vista previa de la siguiente filmina.

- ⚡ **Motor de Transiciones en Vivo:**
  - Control independiente para **Texto** y **FONDOS de Video / Imagen** (`Cut` instantáneo o `Fade` suave).
  - Deslizador de tiempo de transición ajustable en tiempo real de **100ms a 1000ms**.

- 📅 **Calendario & Gestor de Eventos Integrado:**
  - Pestaña de **Calendar** en el dock inferior para agendar servicios, ensayos de alabanza, reuniones de jóvenes y conferencias.
  - Asignación de fecha, hora, categoría y notas con **proyección directa de anuncios en vivo** a la pantalla de Audiencia.

- 📖 **Navegador Bíblico Avanzado y Carga Dinámica:**
  - Búsqueda en árbol inteligente con **autocompletado instantáneo con tecla `Tab ↹`**.
  - **Importador de Biblias en tiempo real:** Carga cualquier versión de la Biblia pasándole una **URL directa** o un archivo `.json` local.
  - **Manejo inteligente de versículos extensos:** Algoritmo automático de división en varias filminas sin cortar palabras.
  - **Configuración de visualización:** Ajuste de renglones máximos por filmina (*1, 2, 3 o Sin Límite*), tipografías personalizadas e inclusión de cita bíblica al pie (*Libro Cap:Versículo*).

- 🎵 **Librería de Canciones con Buscador Web:**
  - Cuadrícula de diapositivas fluida horizontalmente con etiquetas de sección (*Estrofa 1, Coro, Puente*).
  - Búsqueda de canciones en la web por nombre o autor con importador en 1 clic.
  - Menú contextual con botón derecho y atajo de teclado **`Supr` / `Delete`** para eliminar elementos.

- 📐 **Diseño de Interfaz Simplificado y Pro (Dark Theme):**
  - Dock inferior optimizado con pestañas esenciales (**Shows, Media, Templates, Scripture, Calendar**).
  - **Panel inferior con altura por defecto del 30% de la pantalla (`30vh`)**, redimensionable verticalmente mediante arrastre.

---

## ⌨️ Atajos de Teclado

| Tecla / Combinación | Acción |
| :--- | :--- |
| **`F2`** | Limpiar Texto (Clear Text) |
| **`F3`** | Limpiar Fondo Multimedia (Clear Media) |
| **`F4`** | Limpiar Overlays (Clear Overlays) |
| **`Espacio`** / **`Flecha Derecha`** | Siguiente Diapositiva |
| **`Flecha Izquierda`** | Diapositiva Anterior |
| **`Supr`** / **`Delete`** | Eliminar elemento seleccionado (Canción, Fondo o Biblia) |
| **`Tab ↹`** | Autocompletar sugerencia de libro en buscador bíblico |
| **`Escape`** | Limpiar Todo (Clear All) |

---

## 💻 Requisitos e Instalación

### Prerrequisitos
- **Node.js**: v18.0.0 o superior ([Descargar Node.js](https://nodejs.org/))
- **npm**: v9.0.0 o superior (incluido con Node.js)

### Pasos de Instalación para Desarrollo

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/propresenter-ai-studio.git
   cd propresenter-ai-studio
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Lanzar con Electron nativo:**
   ```bash
   npm run electron:start
   ```

---

## 📦 Compilación y Generación del Ejecutable (.exe)

Para generar la aplicación ejecutable nativa para Windows (`.exe`):

1. **Compilar paquete de producción:**
   ```bash
   npm run package:exe
   ```
2. El archivo ejecutable nativo quedará disponible en la carpeta:
   `release-builds/ProPresenter AI Studio-win32-x64/ProPresenter AI Studio.exe`

---

## 📜 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para obtener más detalles.
