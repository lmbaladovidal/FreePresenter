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
// SUITE 8: Control de Audio de Videos y Salida Sonora (RF-47 y RF-48)
// ----------------------------------------------------
console.log('\n▶️ Grupo 8: Control de Audio de Videos y Salida Sonora (RF-47 y RF-48)');
test('RF-47/48: Conmutador de Audio (Mute/Unmute), Volumen y Persistencia', () => {
  const store = new Store();
  // Estado inicial: sonido habilitado por defecto (no silenciado) y volumen 1.0
  if (store.state.isMediaAudioMuted !== false) throw new Error('El audio debe estar habilitado por defecto');
  if (store.state.mediaAudioVolume !== 1.0) throw new Error('El volumen por defecto debe ser 1.0');

  // Conmutar a silenciado
  const isEnabled = store.toggleMediaAudio();
  if (isEnabled !== false) throw new Error('toggleMediaAudio debe retornar false al silenciar');
  if (store.state.isMediaAudioMuted !== true) throw new Error('isMediaAudioMuted debe ser true tras silenciar');
  if (globalThis.localStorage.getItem('propresenter_media_audio_muted') !== 'true') throw new Error('propresenter_media_audio_muted no se guardó en localStorage');

  // Ajustar volumen
  store.setMediaAudioVolume(0.65);
  if (store.state.mediaAudioVolume !== 0.65) throw new Error('El volumen no se actualizó');
  if (globalThis.localStorage.getItem('propresenter_media_audio_volume') !== '0.65') throw new Error('El volumen no se guardó en localStorage');

  // Reconmutar a sonido activo
  store.setMediaAudioMuted(false);
  if (store.state.isMediaAudioMuted !== false) throw new Error('isMediaAudioMuted no se restableció a false');
});

// ----------------------------------------------------
// SUITE 9: Motor de Secciones de Canciones & Navegación (RF-49 y RF-50)
// ----------------------------------------------------
console.log('\n▶️ Grupo 9: Motor de Secciones de Canciones & Navegación (RF-49 y RF-50)');
test('RF-49: Detección inteligente de etiquetas de sección y limpieza de lyrics', () => {
  const songWithTags = `[Intro]
Piano y guitarras

[Verso 1]
Señor mi Dios al contemplar los cielos
El firmamento y las estrellas mil

[Coro]
Mi corazón entona la canción
Cuan grande es Él

[Puente]
Y cuando pienso que en la cruz murió
Por mí pecador

[Final]
Grande es tu fidelidad`;

  const groups = parseAndSplitText(songWithTags, 'paragraph', 0);
  if (groups.length !== 5) throw new Error(`Se esperaban 5 grupos/secciones, se obtuvieron ${groups.length}`);

  // Verificar Intro
  if (groups[0].name !== 'Intro' || groups[0].badge !== 'badge-intro') throw new Error('Intro no detectado correctamente');
  if (groups[0].slides[0].text !== 'Piano y guitarras') throw new Error('El encabezado [Intro] no fue extraído del texto de la filmina');

  // Verificar Verso 1
  if (groups[1].name !== 'Verso 1' || groups[1].badge !== 'badge-verse') throw new Error('Verso 1 no detectado');
  if (groups[1].slides[0].text.includes('[Verso 1]')) throw new Error('[Verso 1] aún presente en el slide');

  // Verificar Coro
  if (groups[2].name !== 'Coro' || groups[2].badge !== 'badge-chorus') throw new Error('Coro no detectado');

  // Verificar Puente
  if (groups[3].name !== 'Puente' || groups[3].badge !== 'badge-bridge') throw new Error('Puente no detectado');

  // Verificar Final/Outro
  if (groups[4].name !== 'Final' || groups[4].badge !== 'badge-outro') throw new Error('Final no detectado');
});

test('RF-49/50: Marcado dinámico, asignación de secciones y salto a sección', () => {
  const store = new Store();
  const testDeck = store.createNewShow("Canción Secciones Test", "Alabanza", "Estrofa inicial 1\nEstrofa inicial 2\n\nSegunda parte 1\nSegunda parte 2");

  if (!testDeck || testDeck.groups.length !== 2) throw new Error('No se crearon los grupos base');

  // Modificar sección del grupo 1 a Coro
  store.setGroupSection(testDeck.id, 1, 'Coro Principal', 'badge-chorus');
  if (testDeck.groups[1].name !== 'Coro Principal' || testDeck.groups[1].badge !== 'badge-chorus') {
    throw new Error('setGroupSection no actualizó el nombre o badge');
  }

  // Dividir grupo 0 en filmina 1 para crear una sección de Puente si tiene más de 1 filmina
  // (creamos un grupo con 2 filminas para probar splitGroupAtSlide)
  testDeck.groups[0].slides.push({ id: 'test-split-slide', text: 'Slide para dividir' });
  store.splitGroupAtSlide(testDeck.id, 0, 1, 'Puente Especial', 'badge-bridge');
  if (testDeck.groups.length !== 3) throw new Error('splitGroupAtSlide no creó el nuevo grupo');
  if (testDeck.groups[1].name !== 'Puente Especial') throw new Error('El grupo dividido no tiene el nombre correcto');

  // Salto y activación de filmina en sección
  store.setLiveSlide(1, 0);
  if (store.state.liveGroupIndex !== 1 || store.state.liveSlideIndex !== 0) {
    throw new Error('No se activó la filmina en vivo de la sección seleccionada');
  }
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
