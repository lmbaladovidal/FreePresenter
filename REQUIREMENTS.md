# 📋 Requisitos del Sistema y Dependencias (Requirements)

Este documento especifica los requisitos de hardware, sistema operativo y dependencias de software necesarias para ejecutar, desarrollar y compilar **ProPresenter AI Studio**.

---

## 💻 1. Requisitos de Hardware

### Requisitos Mínimos
- **Procesador (CPU):** Intel Core i3 / AMD Ryzen 3 (Quad-Core 2.0 GHz o superior)
- **Memoria RAM:** 4 GB RAM
- **Almacenamiento:** 500 MB de espacio libre en disco (para la aplicación y librerías locales)
- **Pantalla:** Resolución mínima 1366 x 768 px
- **Salidas de Video:** 1 salida de video para monitor de control

### Requisitos Recomendados (Para Eventos en Vivo)
- **Procesador (CPU):** Intel Core i5 / AMD Ryzen 5 o superior
- **Memoria RAM:** 8 GB RAM o más
- **Tarjeta Gráfica (GPU):** Gráficos integrados Intel UHD/Iris o GPU dedicada (NVIDIA GTX/RTX, AMD Radeon) con soporte aceleración por hardware.
- **Configuración de Pantallas:** 
  - **Pantalla 1 (Controlador):** Monitor principal del operador (1920x1080)
  - **Pantalla 2 (Audiencia):** Proyector o Pantalla LED (1920x1080 a 60Hz)
  - **Pantalla 3 (Opcional - Escenario):** Monitor Stage Display (1024x768 o superior)

---

## 🐧 2. Sistemas Operativos Soportados

- **Windows:** Windows 10 / Windows 11 (64-bit) — *Compatibilidad nativa completa con ejecutable portable o instalador.*
- **macOS:** macOS 11.0 (Big Sur) o superior (soporte Intel y Apple Silicon via Rosseta/Nativo Electron).
- **Linux:** Ubuntu 20.04+, Debian 11+, Fedora 34+ (64-bit).

---

## 🛠️ 3. Dependencias de Software para Desarrollo

Si deseas compilar la aplicación o modificar el código fuente, necesitas las siguientes herramientas:

| Software | Versión Mínima | Versión Recomendada | Descripción |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` | `v20.x.x LTS` | Entorno de ejecución para JavaScript |
| **npm** | `v9.0.0` | `v10.x.x` | Gestor de paquetes de Node |
| **Git** | `v2.30.0` | `v2.40.0+` | Control de versiones |

---

## 📦 4. Dependencias del Proyecto (`package.json`)

### Dependencias de Desarrollo (DevDependencies)
- **`electron` (`^43.4.1`):** Motor de aplicación de escritorio basado en Chromium y Node.js.
- **`vite` (`^5.0.0`):** Empaquetador web ultrarrápido con reemplazo de módulos en caliente (HMR).
- **`electron-packager` (`^17.1.2`):** Generador de ejecutables portables nativos (`.exe`).
- **`electron-builder` (`^26.0.12`):** Creador de empaquetados e instaladores multi-plataforma.

---

## 🌐 5. Requisitos de Red

- **Conectividad a Internet (Opcional):**
  - Requerida únicamente para la **descarga de Biblias en formato JSON desde URLs externas** (ej: GitHub Raw / APIs públicas) y consultas al copiloto de IA.
- **Modo Offline 100% Funcional:**
  - La aplicación almacena de forma persistente las Biblias importadas, canciones, plantillas y archivos multimedia en `localStorage` y almacenamiento local, funcionando sin conexión a internet durante transmisiones y eventos.
