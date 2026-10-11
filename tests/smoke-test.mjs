/**
 * ProPresenter AI Studio - Smoke Test Suite
 * Test Runner automatizado para verificación de Requerimientos Funcionales (RF-01 al RF-37)
 */

import { assert } from 'node:console';

// 1. Mocking Browser Globals (localStorage, BroadcastChannel, alert)
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new LocalStorageMock();
globalThis.alert = (msg) => console.log(`[ALERT MOCK]: ${msg}`);
globalThis.BroadcastChannel = class {
  constructor(name) {
    this.name = name;
  }
  postMessage(data) {}
  close() {}
};

// 2. Importing Project Modules
import { Store, DEFAULT_DECKS, DEFAULT_TEMPLATES, parseAndSplitText } from '../src/js/state.js';
import { LiveCoderEngine } from '../src/js/live-coder.js';

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASSED: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

console.log('====================================================');
console.log('🧪 INICIANDO SMOKE TEST - PROPRESENTER AI STUDIO');
console.log('====================================================\n');

// ----------------------------------------------------
// SUITE 1: Estado Inicial & Multipantalla (RF-01 al RF-06)
// ----------------------------------------------------
console.log('▶️ Grupo 1: Estado Inicial y Multipantalla (RF-01 a RF-06)');
test('RF-01/02/06: Inicialización del Store y datos por defecto', () => {
  const store = new Store();
  if (!store.state) throw new Error('El estado no fue inicializado.');
  if (!store.decks || store.decks.length === 0) throw new Error('No existen Decks por defecto.');
  if (!store.templates || store.templates.length === 0) throw new Error('No existen Plantillas por defecto.');
});

test('RF-03/04/05: Estado inicial de Stage Display y Timers', () => {
  const store = new Store();
  if (typeof store.state.timerValue !== 'number') throw new Error('TimerValue invalido');
  if (typeof store.state.timerRunning !== 'boolean') throw new Error('TimerRunning invalido');
});

// ----------------------------------------------------
// SUITE 2: Motor de Proyección y Transiciones (RF-07 al RF-11)
// ----------------------------------------------------
console.log('\n▶️ Grupo 2: Motor de Proyección y Transiciones en Vivo (RF-07 a RF-11)');
test('RF-07: Control de Limpieza por Capas (Clear Switches)', () => {
  const store = new Store();
  
  store.clearText();
  if (store.state.isTextCleared !== true) throw new Error('clearText no activó isTextCleared');
  
  store.clearMedia();
  if (store.state.isMediaCleared !== true) throw new Error('clearMedia no activó isMediaCleared');
  
  store.clearOverlays();
  if (store.state.isOverlayCleared !== true) throw new Error('clearOverlays no activó isOverlayCleared');

  store.clearAll();
  if (!store.state.isTextCleared || !store.state.isMediaCleared || !store.state.isOverlayCleared) {
    throw new Error('clearAll no limpió todas las capas');
  }
});

test('RF-08/09: Modos de Transición (Cut/Fade) y Tiempo de Duración', () => {
  const store = new Store();
  
  store.setTextTransition('cut');
  if (store.state.textTransition !== 'cut') throw new Error('Falló el cambio de transición de texto a cut');

  store.setMediaTransition('fade');
  if (store.state.mediaTransition !== 'fade') throw new Error('Falló el cambio de transición de medio a fade');

  store.setFadeDuration(500);
  if (store.state.fadeDuration !== 500) throw new Error('Falló el ajuste del tiempo de fade a 500ms');
});

test('RF-10: Navegación de Diapositivas en el Deck', () => {
  const store = new Store();
  store.setActiveDeck(DEFAULT_DECKS[0].id);
  
  store.setLiveSlide(0, 0);
  if (store.state.liveSlideIndex !== 0) throw new Error('No se estableció la primera filmina correctamente');
  if (!store.state.liveText.includes('Señor mi Dios')) throw new Error('El texto de la primera filmina es incorrecto');
  if (store.state.isTextCleared) throw new Error('La filmina debió reactivar la capa de texto');
});

test('RF-11: Superposición de Terceros Inferiores (Lower Thirds)', () => {
  const store = new Store();
  const lowerThirdDeck = DEFAULT_DECKS.find(d => d.type === 'lowerthird');
  if (!lowerThirdDeck) throw new Error('No se encontró el deck de Lower Thirds por defecto');

  store.setActiveDeck(lowerThirdDeck.id);
  store.setLiveSlide(0, 0);

  if (!store.state.isLowerThirdActive) throw new Error('Lower Third no se activó correctamente');
  if (!store.state.lowerThirdText.includes('Morales')) throw new Error('Texto de Lower Third invalido');
});

// ----------------------------------------------------
// SUITE 3: Módulo de Escrituras y Biblias (RF-12 al RF-19)
// ----------------------------------------------------
console.log('\n▶️ Grupo 3: Gestor Bíblico y Navegador de Escrituras (RF-12 a RF-19)');
test('RF-16/17: Configuración de Parámetros Bíblicos (Líneas, Font, Ref)', () => {
  const store = new Store();
  
  store.setScriptureSettings({
    maxLines: 3,
    font: 'Georgia, serif',
    splitLong: true,
    showRef: true
  });

  if (store.state.scriptureMaxLines !== 3) throw new Error('maxLines no coincide');
  if (store.state.scriptureFont !== 'Georgia, serif') throw new Error('font no coincide');
  if (store.state.scriptureSplitLong !== true) throw new Error('splitLong no coincide');
  if (store.state.scriptureShowRef !== true) throw new Error('showRef no coincide');
});

// ----------------------------------------------------
// SUITE 4: Galería Multimedia & Live Coder 2D (RF-25 al RF-28)
// ----------------------------------------------------
console.log('\n▶️ Grupo 4: Galería Multimedia y Live Coder Canvas 2D (RF-25 a RF-28)');
test('RF-28: Compilación de Código JS en Motor Live Coder Canvas 2D', () => {
  const dummyCanvas = { width: 800, height: 600, getContext: () => ({ save: () => {}, restore: () => {} }) };
  const engine = new LiveCoderEngine(dummyCanvas);

  const validCode = `
    function renderBackground(ctx, width, height, time) {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, width, height);
    }
  `;

  const result = engine.compileCode(validCode);
  if (!result.success) throw new Error(`Error en código sintácticamente correcto: ${result.error}`);

  const invalidCode = `function invalidFunction() {}`;
  const invalidResult = engine.compileCode(invalidCode);
  if (invalidResult.success) throw new Error('El motor debió fallar al no encontrar renderBackground');
});

// ----------------------------------------------------
// SUITE 5: Editor de Plantillas (RF-29 al RF-31)
// ----------------------------------------------------
console.log('\n▶️ Grupo 5: Editor de Plantillas y Diseños (RF-29 a RF-31)');
test('RF-29/30/31: Gestión y Actualización de Plantilla Activa', () => {
  const store = new Store();
  const firstTpl = DEFAULT_TEMPLATES[0];

  store.setActiveTemplate(firstTpl.id);
  if (store.activeTemplateId !== firstTpl.id) throw new Error('No se estableció la plantilla activa');

  store.updateActiveTemplateProperties({ fontSize: 64, color: '#00ff00' });
  if (store.state.activeTemplate.fontSize !== 64) throw new Error('fontSize no se actualizó');
  if (store.state.activeTemplate.color !== '#00ff00') throw new Error('color no se actualizó');
});

// ----------------------------------------------------
// SUITE 6: Persistencia Local (RF-36)
// ----------------------------------------------------
console.log('\n▶️ Grupo 6: Persistencia Local y Almacenamiento (RF-36)');
test('RF-36: Guardado en LocalStorage tras notificar cambios', () => {
  const store = new Store();
  store.setFadeDuration(750);

  const savedDuration = globalThis.localStorage.getItem('propresenter_fade_duration');
  if (savedDuration !== '750') throw new Error('La duración de fade no se guardó en localStorage');
});

// ----------------------------------------------------
// SUITE 7: División de Filminas, Excedente y Versión Dinámica (RF-38 al RF-44)
// ----------------------------------------------------
console.log('\n▶️ Grupo 7: División Inteligente, Excedente y Versión (RF-38 a RF-44)');
test('RF-38/39: División inteligente de canciones por maxLines y excedente', () => {
  const store = new Store();
  const rawText = "Línea 1\nLínea 2\nLínea 3\nLínea 4";
  const slides = parseAndSplitText(rawText, 'fixed', 2);
  if (slides.length !== 1 || slides[0].slides.length !== 2) throw new Error('Se esperaban 2 filminas fragmentadas');
  if (slides[0].slides[0].text !== "Línea 1\nLínea 2") throw new Error('Contenido de la primera filmina incorrecto');
  if (slides[0].slides[1].text !== "Línea 3\nLínea 4") throw new Error('Contenido de la segunda filmina incorrecto');
});

test('RF-40: Creación de Show asignando plantilla e importando texto', () => {
  const store = new Store();
  const newDeck = store.createNewShow("Canción Test", "Alabanza", "Línea A\nLínea B", { templateId: "preset-modern", splitMode: "paragraph" });
  if (!newDeck || newDeck.title !== "Canción Test") throw new Error('No se creó el show correctamente');
});

// ----------------------------------------------------
// RESUMEN FINAL
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`📊 RESULTADOS SMOKE TEST: ${passedTests}/${totalTests} PRUEBAS EXITOSAS`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
