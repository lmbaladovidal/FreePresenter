/**
 * ProPresenter AI Studio - Main Application Controller
 */

import { store } from './state.js';
import { sync } from './broadcast.js';
import { aiCopilot } from './ai-copilot.js';
import { stageManager } from './stage-manager.js';

class ProPresenterApp {
  constructor() {
    this.operatorVideoPreview = document.getElementById('operator-video-preview');
    this.initDOM();
    this.bindEvents();
    this.initKeyboardShortcuts();

    // Subscribe to state changes and sync displays
    store.subscribe((state, decks) => {
      this.renderUI(state, decks);
      sync.sendUpdate(state);
    });

    // Initial view render
    store.notify();

    // Start real-time clock for operator stage preview
    setInterval(() => {
      const clockEl = document.getElementById('stage-clock');
      if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();
    }, 1000);
  }

  initDOM() {
    this.deckListEl = document.getElementById('deck-list');
    this.slideGroupsWrapper = document.getElementById('slide-groups-wrapper');
    this.activeDeckTitle = document.getElementById('active-deck-title');
    this.activeDeckCategory = document.getElementById('active-deck-category');
    
    this.liveTextEl = document.getElementById('operator-live-text');
    this.stageCurrentEl = document.getElementById('stage-current-preview');
    this.stageNextEl = document.getElementById('stage-next-preview');
    this.stageTimerEl = document.getElementById('stage-timer');
    this.mediaGridEl = document.getElementById('media-grid');
    this.videoFileInput = document.getElementById('input-video-file');
    this.dropzone = document.getElementById('dropzone-video');
  }

  bindEvents() {
    // 1. Output Launchers
    document.getElementById('btn-open-audience')?.addEventListener('click', () => {
      window.open('audience.html', 'ProPresenterAudience', 'width=1280,height=720,menubar=no,toolbar=no');
    });

    document.getElementById('btn-open-stage')?.addEventListener('click', () => {
      window.open('stage.html', 'ProPresenterStage', 'width=1024,height=600,menubar=no,toolbar=no');
    });

    // 2. Master Clear Bar
    document.getElementById('btn-clear-all')?.addEventListener('click', () => store.clearAll());
    document.getElementById('btn-clear-text')?.addEventListener('click', () => store.clearText());
    document.getElementById('btn-clear-media')?.addEventListener('click', () => store.clearMedia());
    document.getElementById('btn-clear-overlays')?.addEventListener('click', () => store.clearOverlays());

    // 3. Navigation Controls
    document.getElementById('btn-next-slide')?.addEventListener('click', () => store.nextSlide());
    document.getElementById('btn-prev-slide')?.addEventListener('click', () => store.prevSlide());

    // 4. Panel Tabs Switching
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    // 5. Video File Explorer & Drag/Drop from Computer
    const btnBrowse = document.getElementById('btn-browse-videos');
    btnBrowse?.addEventListener('click', () => {
      this.videoFileInput?.click();
    });

    this.videoFileInput?.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleLoadedVideoFiles(files);
    });

    // Drag & Drop Handling
    if (this.dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          this.dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          this.dropzone.classList.remove('dragover');
        });
      });

      this.dropzone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
        if (files.length > 0) {
          this.handleLoadedVideoFiles(files);
        }
      });
    }

    // 6. AI Copilot Submission
    const btnAiSubmit = document.getElementById('btn-ai-submit');
    const aiInput = document.getElementById('ai-input');
    const aiLog = document.getElementById('ai-log');

    const handleAiSubmit = async () => {
      const prompt = aiInput.value.trim();
      if (!prompt) return;

      btnAiSubmit.disabled = true;
      btnAiSubmit.textContent = "✨ Procesando con IA...";
      if (aiLog) aiLog.textContent = "⏳ Analizando estructura y generando contenido...";

      const res = await aiCopilot.generateFromPrompt(prompt);
      
      btnAiSubmit.disabled = false;
      btnAiSubmit.innerHTML = "<span>✨ Generar con IA</span>";
      if (aiLog) aiLog.textContent = res.message;
      aiInput.value = "";
    };

    btnAiSubmit?.addEventListener('click', handleAiSubmit);

    document.querySelectorAll('.chip-preset').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-preset');
        if (aiInput) aiInput.value = text;
        handleAiSubmit();
      });
    });

    // 7. Stage Timer Quick Controls
    document.getElementById('btn-timer-10m')?.addEventListener('click', () => stageManager.startTimer(600));
    document.getElementById('btn-timer-5m')?.addEventListener('click', () => stageManager.startTimer(300));
    document.getElementById('btn-timer-toggle')?.addEventListener('click', () => {
      if (store.state.timerRunning) {
        stageManager.pauseTimer();
      } else {
        stageManager.resumeTimer();
      }
    });
  }

  handleLoadedVideoFiles(files) {
    files.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      store.addMediaItem(file.name, objectUrl, file.type);
    });
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore keybindings if user is typing in input or editor
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'F2' || e.key === 'F2') {
        e.preventDefault();
        store.clearText();
      } else if (e.code === 'F3' || e.key === 'F3') {
        e.preventDefault();
        store.clearMedia();
      } else if (e.code === 'F4' || e.key === 'F4') {
        e.preventDefault();
        store.clearOverlays();
      } else if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        store.nextSlide();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        store.prevSlide();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        store.clearAll();
      }
    });
  }

  renderUI(state, decks) {
    // 1. Sidebar Library Decks
    this.deckListEl.innerHTML = decks.map(deck => `
      <div class="deck-item ${deck.id === store.activeDeckId ? 'active' : ''}" data-deck-id="${deck.id}">
        <span>${deck.title}</span>
        <span class="deck-item-tag">${deck.category || deck.type}</span>
      </div>
    `).join('');

    this.deckListEl.querySelectorAll('.deck-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-deck-id');
        store.setActiveDeck(id);
      });
    });

    // 2. Active Deck & Slide Cards
    const activeDeck = store.activeDeck;
    this.activeDeckTitle.textContent = activeDeck.title;
    this.activeDeckCategory.textContent = `${activeDeck.category || activeDeck.type} • ${activeDeck.groups.length} Secciones`;

    let globalIndex = 1;
    this.slideGroupsWrapper.innerHTML = activeDeck.groups.map((group, gIdx) => `
      <div class="slide-group">
        <div class="slide-group-header">
          <span class="badge ${group.badge}">${group.name}</span>
        </div>
        <div class="slide-cards">
          ${group.slides.map((slide, sIdx) => {
            const isLive = state.liveSlideId === slide.id && !state.isTextCleared;
            const cardIdx = globalIndex++;
            return `
              <div class="slide-card ${isLive ? 'active-live' : ''}" data-gidx="${gIdx}" data-sidx="${sIdx}">
                <span class="slide-card-index">${cardIdx}</span>
                <span class="slide-card-live-badge">EN VIVO</span>
                <div class="slide-card-text">${slide.text.replace(/\n/g, '<br/>')}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    this.slideGroupsWrapper.querySelectorAll('.slide-card').forEach(card => {
      card.addEventListener('click', () => {
        const gIdx = parseInt(card.getAttribute('data-gidx'));
        const sIdx = parseInt(card.getAttribute('data-sidx'));
        store.setLiveSlide(gIdx, sIdx);
      });
    });

    // 3. Render Media Library Video Cards Grid
    if (this.mediaGridEl) {
      this.mediaGridEl.innerHTML = state.mediaLibrary.map(item => {
        const isActive = state.activeVideoUrl === item.url && !state.isMediaCleared;
        return `
          <div class="video-card ${isActive ? 'active-video' : ''}" data-video-url="${item.url}" data-video-name="${item.name}">
            <video src="${item.url}" muted preload="metadata"></video>
            <div class="video-card-overlay">
              <div class="video-card-title">${item.name}</div>
            </div>
          </div>
        `;
      }).join('');

      this.mediaGridEl.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
          const url = card.getAttribute('data-video-url');
          const name = card.getAttribute('data-video-name');
          store.setActiveVideo(url, name);
        });
      });
    }

    // 4. Operator Live Video Preview
    if (this.operatorVideoPreview) {
      if (state.isMediaCleared || !state.activeVideoUrl) {
        this.operatorVideoPreview.style.display = 'none';
        this.operatorVideoPreview.pause();
      } else {
        this.operatorVideoPreview.style.display = 'block';
        if (this.operatorVideoPreview.src !== state.activeVideoUrl) {
          this.operatorVideoPreview.src = state.activeVideoUrl;
          this.operatorVideoPreview.play().catch(e => console.log("Muted preview autoplay", e));
        }
      }
    }

    // 5. Text & Stage Previews
    if (state.isTextCleared || !state.liveText) {
      this.liveTextEl.textContent = "-- Sin Texto Proyectado --";
      this.liveTextEl.style.opacity = "0.5";
    } else {
      this.liveTextEl.textContent = state.liveText;
      this.liveTextEl.style.opacity = "1";
    }

    this.stageCurrentEl.textContent = state.isTextCleared ? "TEXTO LIMPIO" : (state.liveText || "--");
    this.stageNextEl.textContent = "SIGUIENTE: " + (state.nextText || "--");
    this.stageTimerEl.textContent = stageManager.constructor.formatTime(state.timerValue);

    // Status bar updates
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    if (!state.isTextCleared && state.liveText) {
      statusDot?.classList.add('live');
      if (statusText) statusText.textContent = "PROYECTANDO EN VIVO • Sincronización OK";
    } else {
      statusDot?.classList.remove('live');
      if (statusText) statusText.textContent = "Consola lista • Esperando diapositiva";
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ProPresenterApp();
});
