/**
 * ProPresenter AI Studio - Main Application Controller
 */

import { store } from './state.js';
import { sync } from './broadcast.js';
import { aiCopilot } from './ai-copilot.js';
import { stageManager } from './stage-manager.js';
import { BIBLE_BOOKS, BIBLE_VERSIONS, getAllBibleVersions, getChapterVerses, splitVerseText, fetchAndLoadBibleFromUrl, parseAndAddCustomBible, deleteCustomBible } from './bible-data.js';

class ProPresenterApp {
  constructor() {
    this.operatorVideoPreview = document.getElementById('operator-video-preview');
    this.contextTarget = null;

    // State for Scriptures Navigator
    this.selectedBibleVersion = '';
    this.selectedBookId = 'JHN';
    this.selectedChapter = 3;
    this.scriptureQuery = '';
    this.matchedBookSuggestion = null;

    this.initDOM();
    this.bindEvents();
    this.initKeyboardShortcuts();

    // Subscribe to state changes and sync displays
    store.subscribe((state, decks) => {
      this.renderUI(state, decks);
      sync.sendUpdate(state);
    });

    // Dismiss custom context menu on outside click or scroll
    document.addEventListener('click', () => this.hideContextMenu());
    document.addEventListener('scroll', () => this.hideContextMenu(), true);
    document.getElementById('ctx-item-delete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.contextTarget) {
        this.executeDeleteTarget(this.contextTarget);
      }
    });

    // Initial view render
    store.notify();

    // Start real-time clock for operator stage preview & FreeShow bottom dock
    setInterval(() => {
      const now = new Date();
      const clockEl = document.getElementById('stage-clock');
      if (clockEl) clockEl.textContent = now.toLocaleTimeString();

      const dockClockEl = document.getElementById('dock-digital-clock');
      const dockDateEl = document.getElementById('dock-digital-date');

      if (dockClockEl) {
        const hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = String(hours % 12 || 12).padStart(2, '0');
        dockClockEl.innerHTML = `${formattedHours}:${minutes}:<span style="font-size:1.3rem">${seconds}</span> <span class="ampm">${ampm}</span>`;
      }

      if (dockDateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dockDateEl.textContent = now.toLocaleDateString('en-US', options);
      }
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

    // Shows Dock & Search Elements
    this.showsGridEl = document.getElementById('shows-grid');
    this.dockSearchInput = document.getElementById('dock-search-input');
    this.searchQuery = "";
    this.activeFilter = "all";

    // Virtual Media Elements
    this.mediaFoldersListEl = document.getElementById('media-folders-list');
    this.selectedMediaFolder = "all";

    // Modals
    this.modalCreateShow = document.getElementById('modal-create-show');
    this.inputShowTitle = document.getElementById('input-show-title');
    this.inputShowCategory = document.getElementById('input-show-category');
    this.inputShowText = document.getElementById('input-show-text');
    this.btnSaveShow = document.getElementById('btn-save-show');

    this.modalUploadMedia = document.getElementById('modal-upload-media');
    this.inputMediaName = document.getElementById('input-media-name');
    this.inputMediaUrl = document.getElementById('input-media-url');
    this.selectMediaFolder = document.getElementById('select-media-folder');
    this.inputNewFolderName = document.getElementById('input-new-folder-name');
    this.btnSaveMedia = document.getElementById('btn-save-media');
    this.selectedMediaFilename = document.getElementById('selected-media-filename');
  }

  bindEvents() {
    // 1. Output Launchers & Mode Switching
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode');
        console.log(`Modo de vista cambiado a: ${mode}`);
      });
    });

    document.getElementById('btn-open-audience')?.addEventListener('click', () => {
      if (window.electronAPI && window.electronAPI.openAudienceWindow) {
        window.electronAPI.openAudienceWindow();
      } else {
        window.open('audience.html', 'ProPresenterAudience', 'width=1280,height=720,menubar=no,toolbar=no');
      }
    });

    document.getElementById('btn-open-stage')?.addEventListener('click', () => {
      if (window.electronAPI && window.electronAPI.openStageWindow) {
        window.electronAPI.openStageWindow();
      } else {
        window.open('stage.html', 'ProPresenterStage', 'width=1024,height=600,menubar=no,toolbar=no');
      }
    });

    // 2. Master Clear Bar
    document.getElementById('btn-clear-all')?.addEventListener('click', () => store.clearAll());
    document.getElementById('btn-clear-text')?.addEventListener('click', () => store.clearText());
    document.getElementById('btn-clear-media')?.addEventListener('click', () => store.clearMedia());
    document.getElementById('btn-clear-overlays')?.addEventListener('click', () => store.clearOverlays());

    // 3. Load Bible Modal Events
    this.bindLoadBibleModalEvents();

    // 3. Navigation Controls
    document.getElementById('btn-next-slide')?.addEventListener('click', () => store.nextSlide());
    document.getElementById('btn-prev-slide')?.addEventListener('click', () => store.prevSlide());
    document.getElementById('btn-quick-next')?.addEventListener('click', () => store.nextSlide());
    document.getElementById('btn-quick-prev')?.addEventListener('click', () => store.prevSlide());

    // 4. Resource Dock Tabs Switching (Sincroniza Contenido y Sub-sidebar Izquierdo)
    document.querySelectorAll('.res-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.res-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const resType = tab.getAttribute('data-res');
        document.querySelectorAll('.res-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.sub-sidebar-content').forEach(s => s.classList.remove('active'));

        if (resType === 'shows') {
          document.getElementById('res-tab-shows')?.classList.add('active');
          document.getElementById('sub-sidebar-shows')?.classList.add('active');
        } else if (resType === 'media') {
          document.getElementById('res-tab-media')?.classList.add('active');
          document.getElementById('sub-sidebar-media')?.classList.add('active');
        } else if (resType === 'templates') {
          document.getElementById('res-tab-templates')?.classList.add('active');
          document.getElementById('sub-sidebar-templates')?.classList.add('active');
          this.populateTemplateForm(store.state.activeTemplate);
        } else if (resType === 'scripture') {
          document.getElementById('res-tab-scripture')?.classList.add('active');
          document.getElementById('sub-sidebar-scripture')?.classList.add('active');
          this.renderScriptureSubSidebar();
          this.renderScripture3ColView();
        } else {
          const generic = document.getElementById('res-tab-generic');
          const placeholder = document.getElementById('generic-tab-placeholder');
          if (generic && placeholder) {
            placeholder.textContent = `Pestaña [${resType.toUpperCase()}] lista. Selecciona o carga activos para esta categoría.`;
            generic.classList.add('active');
          }
          document.getElementById('sub-sidebar-generic')?.classList.add('active');
        }
      });
    });

    this.bindScriptureEvents();
    this.initDockResizer();

    // 5. Live Search Input in Resource Dock
    this.dockSearchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderShowsDock(store.state, store.decks);
      this.renderMediaDock(store.state);
    });

    // 6. Sub-sidebar Filter Click
    document.querySelectorAll('.filter-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.activeFilter = item.getAttribute('data-filter') || 'all';
        this.renderShowsDock(store.state, store.decks);
      });
    });

    // 7. New Show Modal Handlers
    const openModalShow = () => {
      if (this.modalCreateShow) {
        this.modalCreateShow.classList.add('open');
        this.inputShowTitle?.focus();
      }
    };

    const closeModalShow = () => {
      if (this.modalCreateShow) {
        this.modalCreateShow.classList.remove('open');
        if (this.inputShowTitle) this.inputShowTitle.value = "";
        if (this.inputShowText) this.inputShowText.value = "";
      }
    };

    document.getElementById('btn-open-create-modal')?.addEventListener('click', openModalShow);
    document.getElementById('btn-add-deck-manual')?.addEventListener('click', openModalShow);
    document.getElementById('btn-close-modal')?.addEventListener('click', closeModalShow);
    document.getElementById('btn-cancel-show')?.addEventListener('click', closeModalShow);

    this.btnSaveShow?.addEventListener('click', () => {
      const title = this.inputShowTitle.value.trim();
      const category = this.inputShowCategory.value;
      const text = this.inputShowText.value.trim();

      if (!title || !text) {
        alert("Por favor ingresa un título y el texto del show/canción.");
        return;
      }

      store.createNewShow(title, category, text);
      closeModalShow();
    });

    // 8. Upload Media Modal Handlers (Cargar Video asignando carpeta virtual)
    const openModalMedia = () => {
      if (this.modalUploadMedia) {
        // Populate folder select dropdown options
        if (this.selectMediaFolder) {
          this.selectMediaFolder.innerHTML = store.state.mediaFolders.map(f => 
            `<option value="${f}">${f}</option>`
          ).join('');
        }
        this.modalUploadMedia.classList.add('open');
        this.inputMediaName?.focus();
      }
    };

    const closeModalMedia = () => {
      if (this.modalUploadMedia) {
        this.modalUploadMedia.classList.remove('open');
        if (this.inputMediaName) this.inputMediaName.value = "";
        if (this.inputMediaUrl) this.inputMediaUrl.value = "";
        if (this.inputNewFolderName) this.inputNewFolderName.value = "";
        if (this.selectedMediaFilename) this.selectedMediaFilename.textContent = "Ningún archivo seleccionado";
      }
    };

    document.getElementById('btn-open-media-modal')?.addEventListener('click', openModalMedia);
    document.getElementById('btn-close-media-modal')?.addEventListener('click', closeModalMedia);
    document.getElementById('btn-cancel-media')?.addEventListener('click', closeModalMedia);

    // File Browser button inside Upload Modal (Soporte Nativo Electron)
    document.getElementById('btn-select-media-file')?.addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.selectMediaFiles) {
        const files = await window.electronAPI.selectMediaFiles();
        if (files && files.length > 0) {
          const first = files[0];
          if (this.inputMediaName) this.inputMediaName.value = first.name;
          if (this.inputMediaUrl) this.inputMediaUrl.value = first.url;
          if (this.selectedMediaFilename) this.selectedMediaFilename.textContent = `Archivo: ${first.name}`;
        }
      } else {
        this.videoFileInput?.click();
      }
    });

    this.videoFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        if (this.inputMediaName && !this.inputMediaName.value) {
          this.inputMediaName.value = file.name;
        }
        if (this.inputMediaUrl) {
          this.inputMediaUrl.value = objectUrl;
        }
        if (this.selectedMediaFilename) {
          this.selectedMediaFilename.textContent = `Archivo: ${file.name}`;
        }
      }
    });

    this.btnSaveMedia?.addEventListener('click', () => {
      const name = this.inputMediaName.value.trim();
      let url = this.inputMediaUrl.value.trim();
      const newFolder = this.inputNewFolderName.value.trim();
      let folder = newFolder || this.selectMediaFolder.value || "General";

      if (!name) {
        alert("Por favor ingresa un nombre para el fondo/video.");
        return;
      }

      if (!url) {
        url = "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4";
      }

      store.addMediaItem(name, url, "video/mp4", folder);
      closeModalMedia();
    });

    // Add Virtual Folder quick button (+)
    document.getElementById('btn-add-virtual-folder')?.addEventListener('click', () => {
      const folderName = prompt("Ingresa el nombre de la nueva carpeta virtual (ej: Anuncios, Rápidos, Estribos):");
      if (folderName) {
        store.addMediaFolder(folderName);
      }
    });

    // 9. Panel Tabs Switching
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    // 10. AI Copilot Submission
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

    // 11. Stage Timer Quick Controls
    document.getElementById('btn-timer-10m')?.addEventListener('click', () => stageManager.startTimer(600));
    document.getElementById('btn-timer-5m')?.addEventListener('click', () => stageManager.startTimer(300));
    document.getElementById('btn-timer-toggle')?.addEventListener('click', () => {
      if (store.state.timerRunning) {
        stageManager.pauseTimer();
      } else {
        stageManager.resumeTimer();
      }
    });

    // 12. Template Editor Control Events
    this.bindTemplateEvents();

    // 13. Transition Controls (Cut vs Fade + Dynamic Duration 100ms-1000ms)
    document.querySelectorAll('.btn-trans-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-trans-type');
        const mode = btn.getAttribute('data-mode');
        if (type === 'text') {
          store.setTextTransition(mode);
        } else if (type === 'media') {
          store.setMediaTransition(mode);
        }
      });
    });

    const fadeDurInput = document.getElementById('input-fade-duration');
    fadeDurInput?.addEventListener('input', () => {
      const val = parseInt(fadeDurInput.value);
      const badge = document.getElementById('val-fade-duration');
      if (badge) badge.textContent = val + 'ms';
      store.setFadeDuration(val);
    });
  }

  handleLoadedVideoFiles(files) {
    files.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      store.addMediaItem(file.name, objectUrl, file.type, "General");
    });
  }

  showContextMenu(e, target) {
    e.preventDefault();
    e.stopPropagation();
    this.contextTarget = target;

    const labelEl = document.getElementById('ctx-item-label');
    if (labelEl) {
      labelEl.textContent = `Eliminar "${target.name}"`;
    }

    const menu = document.getElementById('custom-context-menu');
    if (!menu) return;

    menu.style.display = 'block';

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const menuWidth = menu.offsetWidth || 180;
    const menuHeight = menu.offsetHeight || 45;

    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuWidth > winWidth) posX = winWidth - menuWidth - 10;
    if (posY + menuHeight > winHeight) posY = winHeight - menuHeight - 10;

    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';
  }

  hideContextMenu() {
    const menu = document.getElementById('custom-context-menu');
    if (menu) menu.style.display = 'none';
  }

  executeDeleteTarget(target) {
    if (!target) return;
    this.hideContextMenu();

    if (target.type === 'deck') {
      if (confirm(`¿Estás seguro de que deseas eliminar la canción/lectura "${target.name}"?`)) {
        store.deleteDeck(target.id);
        this.contextTarget = null;
      }
    } else if (target.type === 'media') {
      if (confirm(`¿Estás seguro de que deseas eliminar el recurso multimedia "${target.name}"?`)) {
        store.deleteMediaItem(target.id);
        this.contextTarget = null;
      }
    } else if (target.type === 'bible') {
      if (confirm(`¿Estás seguro de que deseas eliminar la Biblia "${target.name}"?`)) {
        deleteCustomBible(target.id);
        if (this.selectedBibleVersion === target.id) {
          this.selectedBibleVersion = 'RVR1960';
        }
        this.renderScriptureSubSidebar();
        this.renderScripture3ColView();
        this.contextTarget = null;
      }
    }
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore keybindings if user is typing in input or editor or modal
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Delete' || e.key === 'Supr' || e.code === 'Delete') {
        e.preventDefault();
        if (this.contextTarget) {
          this.executeDeleteTarget(this.contextTarget);
        } else {
          const versions = getAllBibleVersions();
          const activeVer = versions.find(v => v.id === this.selectedBibleVersion);
          if (activeVer && activeVer.isCustom) {
            this.executeDeleteTarget({ type: 'bible', id: activeVer.id, name: activeVer.name });
          } else if (store.activeDeck) {
            this.executeDeleteTarget({ type: 'deck', id: store.activeDeck.id, name: store.activeDeck.title });
          }
        }
      } else if (e.code === 'F2' || e.key === 'F2') {
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

  initDockResizer() {
    const resizer = document.getElementById('bottom-dock-resizer');
    const appEl = document.getElementById('app');
    if (!resizer || !appEl) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 250;

    const onMouseDown = (e) => {
      isDragging = true;
      startY = e.clientY;

      const currentVarVal = getComputedStyle(appEl).getPropertyValue('--bottom-dock-height');
      startHeight = parseInt(currentVarVal) || 250;

      resizer.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const windowHeight = window.innerHeight;
      const minHeight = 120;
      const maxHeight = Math.floor(windowHeight * 0.75);

      let newHeight = startHeight + deltaY;
      if (newHeight < minHeight) newHeight = minHeight;
      if (newHeight > maxHeight) newHeight = maxHeight;

      appEl.style.setProperty('--bottom-dock-height', `${newHeight}px`);
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      resizer.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);
  }

  renderShowsCategories(decks) {
    const listEl = document.getElementById('shows-categories-list');
    if (!listEl) return;

    const defaultCategories = [
      { id: 'Alabanza', name: 'Alabanza', icon: '🎵' },
      { id: 'Adoración', name: 'Adoración', icon: '❤️' },
      { id: 'Sermón', name: 'Sermones', icon: '🗣️' },
      { id: 'Lectura', name: 'Escrituras / Lectura', icon: '📖' },
      { id: 'Anuncio', name: 'Anuncios / Avisos', icon: '📢' },
      { id: 'Overlays Stream', name: 'Overlays Stream', icon: '👤' }
    ];

    const categoriesMap = new Map();
    defaultCategories.forEach(c => categoriesMap.set(c.id.toLowerCase(), c));

    decks.forEach(d => {
      const catName = d.category || d.type || 'General';
      const catKey = catName.toLowerCase();
      if (!categoriesMap.has(catKey)) {
        categoriesMap.set(catKey, { id: catName, name: catName, icon: '📄' });
      }
    });

    const categoryItems = Array.from(categoriesMap.values());

    listEl.innerHTML = `
      <div class="filter-item ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
        <span class="dot-indicator"></span>
        <span>Todos los Shows</span>
        <span class="count">${decks.length}</span>
      </div>
      ${categoryItems.map(cat => {
        const count = decks.filter(d => {
          const cLower = (d.category || d.type || '').toLowerCase();
          const targetLower = cat.id.toLowerCase();
          return cLower.includes(targetLower) || targetLower.includes(cLower);
        }).length;
        const isActive = this.activeFilter.toLowerCase() === cat.id.toLowerCase();
        return `
          <div class="filter-item ${isActive ? 'active' : ''}" data-filter="${cat.id}">
            <span>${cat.icon} ${cat.name}</span>
            <span class="count">${count}</span>
          </div>
        `;
      }).join('')}
    `;

    listEl.querySelectorAll('.filter-item').forEach(item => {
      item.addEventListener('click', () => {
        this.activeFilter = item.getAttribute('data-filter') || 'all';
        this.renderShowsCategories(decks);
        this.renderShowsDock(store.state, decks);
      });
    });
  }

  renderShowsDock(state, decks) {
    if (!this.showsGridEl) return;

    const filteredDecks = decks.filter(deck => {
      const matchesSearch = !this.searchQuery || 
        deck.title.toLowerCase().includes(this.searchQuery) ||
        (deck.category && deck.category.toLowerCase().includes(this.searchQuery));

      let matchesFilter = true;
      if (this.activeFilter && this.activeFilter !== 'all') {
        const catLower = (deck.category || deck.type || '').toLowerCase();
        const filterLower = this.activeFilter.toLowerCase();
        matchesFilter = catLower.includes(filterLower) || filterLower.includes(catLower);
      }

      return matchesSearch && matchesFilter;
    });

    const badgeCount = document.getElementById('badge-shows-count');
    const dockInfo = document.getElementById('dock-shows-info');
    const projectBadge = document.querySelector('.project-count-badge');

    if (badgeCount) badgeCount.textContent = decks.length;
    if (projectBadge) projectBadge.textContent = decks.length;
    if (dockInfo) dockInfo.textContent = `${filteredDecks.length} de ${decks.length} textos`;

    if (filteredDecks.length === 0) {
      this.showsGridEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.78rem;">
          No se encontraron resultados para "${this.searchQuery}".
        </div>
      `;
      return;
    }

    this.showsGridEl.innerHTML = filteredDecks.map(deck => {
      const isActive = deck.id === store.activeDeckId;
      const slideCount = deck.groups.reduce((acc, g) => acc + g.slides.length, 0);
      const snippetText = deck.groups[0]?.slides[0]?.text || "Sin texto";

      return `
        <div class="show-dock-card ${isActive ? 'active-dock-show' : ''}" data-deck-id="${deck.id}">
          <div class="show-card-top">
            <span class="show-card-title" title="${deck.title}">${deck.title}</span>
            <span class="show-card-badge">${deck.category || 'General'}</span>
          </div>
          <div class="show-card-snippet">${snippetText}</div>
          <div class="show-card-footer">
            <span>${slideCount} Diapositivas</span>
            <button class="btn-delete-show" data-delete-id="${deck.id}" title="Eliminar este show">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    this.showsGridEl.querySelectorAll('.show-dock-card').forEach(card => {
      const id = card.getAttribute('data-deck-id');
      const deckObj = decks.find(d => d.id === id);
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-show')) return;
        store.setActiveDeck(id);
      });
      card.addEventListener('contextmenu', (e) => {
        if (deckObj) this.showContextMenu(e, { type: 'deck', id: deckObj.id, name: deckObj.title });
      });
    });

    this.showsGridEl.querySelectorAll('.btn-delete-show').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (confirm("¿Deseas eliminar este texto/show de la biblioteca?")) {
          store.deleteDeck(id);
        }
      });
    });
  }

  renderMediaDock(state) {
    if (!this.mediaGridEl || !this.mediaFoldersListEl) return;

    // 1. Render Virtual Folders list in Sub-sidebar
    const folders = state.mediaFolders || ["General"];
    const allCount = state.mediaLibrary.length;

    this.mediaFoldersListEl.innerHTML = `
      <div class="folder-item ${this.selectedMediaFolder === 'all' ? 'active' : ''}" data-folder-name="all">
        <span>📁 Todos los Medios</span>
        <span class="count">${allCount}</span>
      </div>
      ${folders.map(folder => {
        const count = state.mediaLibrary.filter(m => m.folder === folder).length;
        const isActive = this.selectedMediaFolder === folder;
        return `
          <div class="folder-item ${isActive ? 'active' : ''}" data-folder-name="${folder}">
            <span>📁 ${folder}</span>
            <span class="count">${count}</span>
          </div>
        `;
      }).join('')}
    `;

    this.mediaFoldersListEl.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectedMediaFolder = item.getAttribute('data-folder-name');
        this.renderMediaDock(state);
      });
    });

    // Update Dock Header Info
    const mediaInfo = document.getElementById('dock-media-info');
    if (mediaInfo) {
      mediaInfo.textContent = `Carpeta: ${this.selectedMediaFolder === 'all' ? 'Todas' : this.selectedMediaFolder}`;
    }

    // 2. Filter media library by selected virtual folder & search query
    const filteredMedia = state.mediaLibrary.filter(item => {
      const matchesFolder = this.selectedMediaFolder === 'all' || item.folder === this.selectedMediaFolder;
      const matchesSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery) ||
        (item.folder && item.folder.toLowerCase().includes(this.searchQuery));
      return matchesFolder && matchesSearch;
    });

    if (filteredMedia.length === 0) {
      this.mediaGridEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.78rem;">
          No hay videos o imágenes en la carpeta "${this.selectedMediaFolder === 'all' ? 'Todas' : this.selectedMediaFolder}".
        </div>
      `;
      return;
    }

    this.mediaGridEl.innerHTML = filteredMedia.map(item => {
      const isActive = state.activeVideoUrl === item.url && !state.isMediaCleared;
      return `
        <div class="video-card ${isActive ? 'active-video' : ''}" data-video-url="${item.url}" data-video-name="${item.name}">
          <div class="video-card-top-bar">
            <span class="video-folder-tag">${item.folder || 'General'}</span>
            <button class="btn-delete-media" data-media-id="${item.id}" title="Eliminar este video">&times;</button>
          </div>
          <video src="${item.url}" muted preload="metadata"></video>
          <div class="video-card-overlay">
            <div class="video-card-title">${item.name}</div>
          </div>
        </div>
      `;
    }).join('');

    // Bind video click (proyectar fondo) & delete click & contextmenu
    this.mediaGridEl.querySelectorAll('.video-card').forEach(card => {
      const mediaId = card.querySelector('.btn-delete-media')?.getAttribute('data-media-id');
      const mediaItem = state.mediaLibrary.find(m => m.id === mediaId);
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-media')) return;
        const url = card.getAttribute('data-video-url');
        const name = card.getAttribute('data-video-name');
        store.setActiveVideo(url, name);
      });
      card.addEventListener('contextmenu', (e) => {
        if (mediaItem) {
          this.showContextMenu(e, { type: 'media', id: mediaItem.id, name: mediaItem.name });
        }
      });
    });

    this.mediaGridEl.querySelectorAll('.btn-delete-media').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-media-id');
        if (confirm("¿Deseas eliminar este video/medio de la biblioteca?")) {
          store.deleteMediaItem(id);
        }
      });
    });
  }

  renderTemplatesSidebar(state) {
    const sidebarEl = document.getElementById('template-list-sidebar');
    if (!sidebarEl) return;

    const templates = store.templates || [];
    sidebarEl.innerHTML = templates.map(tpl => {
      const isActive = tpl.id === store.activeTemplateId;
      return `
        <div class="folder-item ${isActive ? 'active' : ''}" data-tpl-id="${tpl.id}">
          <span>📄 ${tpl.name}</span>
          <div style="display: flex; gap: 4px; align-items: center;">
            ${isActive ? '<span class="count" style="color: var(--accent-cyan); font-weight:700;">ACTIVO</span>' : ''}
            <button class="btn-delete-media btn-delete-tpl" data-delete-tpl-id="${tpl.id}" title="Eliminar plantilla" style="width:16px;height:16px;font-size:0.65rem;">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    sidebarEl.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-tpl')) return;
        const id = item.getAttribute('data-tpl-id');
        store.setActiveTemplate(id);
        if (store.activeDeck) {
          store.activeDeck.templateId = id;
        }
        if (store.state.liveGroupIndex !== null && store.state.liveSlideIndex !== null) {
          store.setLiveSlide(store.state.liveGroupIndex, store.state.liveSlideIndex);
        } else {
          store.notify();
        }
        this.populateTemplateForm(store.state.activeTemplate);
      });
    });

    sidebarEl.querySelectorAll('.btn-delete-tpl').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-tpl-id');
        if (confirm("¿Deseas eliminar esta plantilla de la biblioteca?")) {
          store.deleteTemplate(id);
          this.populateTemplateForm(store.state.activeTemplate);
        }
      });
    });
  }

  populateTemplateForm(tpl) {
    if (!tpl) return;
    const nameEl = document.getElementById('input-tpl-name');
    const fontEl = document.getElementById('select-tpl-font');
    const sizeEl = document.getElementById('input-tpl-size');
    const valSizeEl = document.getElementById('val-tpl-size');
    const kerningEl = document.getElementById('input-tpl-kerning');
    const valKerningEl = document.getElementById('val-tpl-kerning');
    const leadingEl = document.getElementById('input-tpl-leading');
    const valLeadingEl = document.getElementById('val-tpl-leading');
    const colorEl = document.getElementById('input-tpl-color');
    const alignEl = document.getElementById('select-tpl-align');
    const maxlinesEl = document.getElementById('select-tpl-maxlines');
    const posyEl = document.getElementById('input-tpl-posy');
    const valPosyEl = document.getElementById('val-tpl-posy');
    const bgHexEl = document.getElementById('input-tpl-bgcolor-hex');
    const bgOpacityEl = document.getElementById('input-tpl-bgopacity');
    const valOpacityEl = document.getElementById('val-tpl-bgopacity');
    const paddingEl = document.getElementById('input-tpl-padding');
    const valPaddingEl = document.getElementById('val-tpl-padding');
    const radiusEl = document.getElementById('input-tpl-radius');
    const valRadiusEl = document.getElementById('val-tpl-radius');
    const bgImageEl = document.getElementById('input-tpl-bgimage');

    if (nameEl) nameEl.value = tpl.name || "";
    if (fontEl) fontEl.value = tpl.fontFamily || "Inter, sans-serif";
    if (sizeEl) sizeEl.value = tpl.fontSize || 52;
    if (valSizeEl) valSizeEl.textContent = (tpl.fontSize || 52) + "px";
    if (kerningEl) kerningEl.value = tpl.letterSpacing || 0;
    if (valKerningEl) valKerningEl.textContent = (tpl.letterSpacing || 0) + "px";
    if (leadingEl) leadingEl.value = tpl.lineHeight || 1.25;
    if (valLeadingEl) valLeadingEl.textContent = tpl.lineHeight || 1.25;
    if (colorEl) colorEl.value = tpl.color || "#ffffff";
    if (alignEl) alignEl.value = tpl.textAlign || "center";
    if (maxlinesEl) maxlinesEl.value = tpl.maxLines !== undefined ? tpl.maxLines : 0;
    if (posyEl) posyEl.value = tpl.posY || 50;
    if (valPosyEl) valPosyEl.textContent = (tpl.posY || 50) + "%";
    
    if (paddingEl) paddingEl.value = tpl.padding || 20;
    if (valPaddingEl) valPaddingEl.textContent = (tpl.padding || 20) + "px";
    if (radiusEl) radiusEl.value = tpl.borderRadius || 8;
    if (valRadiusEl) valRadiusEl.textContent = (tpl.borderRadius || 8) + "px";
    if (bgImageEl) bgImageEl.value = tpl.bgImageUrl || "";

    this.updateTemplateLivePreview();
  }

  updateTemplateLivePreview() {
    const textPreview = document.getElementById('template-preview-text');
    const textWrapper = document.getElementById('template-preview-text-wrapper');
    if (!textPreview || !textWrapper) return;

    const font = document.getElementById('select-tpl-font')?.value || 'Inter, sans-serif';
    const size = document.getElementById('input-tpl-size')?.value || 52;
    const kerning = document.getElementById('input-tpl-kerning')?.value || 0;
    const leading = document.getElementById('input-tpl-leading')?.value || 1.25;
    const color = document.getElementById('input-tpl-color')?.value || '#ffffff';
    const align = document.getElementById('select-tpl-align')?.value || 'center';
    const maxlines = parseInt(document.getElementById('select-tpl-maxlines')?.value || 0);
    const posy = document.getElementById('input-tpl-posy')?.value || 50;
    const bgHex = document.getElementById('input-tpl-bgcolor-hex')?.value || '#000000';
    const bgOpacity = parseFloat(document.getElementById('input-tpl-bgopacity')?.value || 0.5);
    const padding = document.getElementById('input-tpl-padding')?.value || 20;
    const radius = document.getElementById('input-tpl-radius')?.value || 8;

    const r = parseInt(bgHex.slice(1, 3), 16) || 0;
    const g = parseInt(bgHex.slice(3, 5), 16) || 0;
    const b = parseInt(bgHex.slice(5, 7), 16) || 0;
    const rgbaBg = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;

    textWrapper.style.top = posy + '%';
    
    textPreview.style.fontFamily = font;
    textPreview.style.fontSize = (size * 0.45) + 'px';
    textPreview.style.letterSpacing = kerning + 'px';
    textPreview.style.lineHeight = leading;
    textPreview.style.color = color;
    textPreview.style.textAlign = align;
    textPreview.style.backgroundColor = rgbaBg;
    textPreview.style.padding = (padding * 0.5) + 'px';
    textPreview.style.borderRadius = (radius * 0.5) + 'px';

    if (maxlines > 0) {
      textPreview.style.display = '-webkit-box';
      textPreview.style['-webkit-line-clamp'] = maxlines;
      textPreview.style['-webkit-box-orient'] = 'vertical';
      textPreview.style.overflow = 'hidden';
    } else {
      textPreview.style.display = 'block';
      textPreview.style.overflow = 'visible';
    }
  }

  bindTemplateEvents() {
    const inputs = [
      'input-tpl-name', 'select-tpl-font', 'input-tpl-size', 'input-tpl-kerning',
      'input-tpl-leading', 'input-tpl-color', 'select-tpl-align', 'select-tpl-maxlines',
      'input-tpl-posy', 'input-tpl-bgcolor-hex', 'input-tpl-bgopacity', 'input-tpl-padding',
      'input-tpl-radius', 'input-tpl-bgimage'
    ];

    inputs.forEach(id => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => {
        if (id === 'input-tpl-size') document.getElementById('val-tpl-size').textContent = el.value + 'px';
        if (id === 'input-tpl-kerning') document.getElementById('val-tpl-kerning').textContent = el.value + 'px';
        if (id === 'input-tpl-leading') document.getElementById('val-tpl-leading').textContent = el.value;
        if (id === 'input-tpl-posy') document.getElementById('val-tpl-posy').textContent = el.value + '%';
        if (id === 'input-tpl-bgopacity') document.getElementById('val-tpl-bgopacity').textContent = Math.round(el.value * 100) + '%';
        if (id === 'input-tpl-padding') document.getElementById('val-tpl-padding').textContent = el.value + 'px';
        if (id === 'input-tpl-radius') document.getElementById('val-tpl-radius').textContent = el.value + 'px';

        this.updateTemplateLivePreview();
      });
    });

    const applyCurrentTemplate = () => {
      const name = document.getElementById('input-tpl-name')?.value.trim() || 'Plantilla Personalizada';
      const font = document.getElementById('select-tpl-font')?.value;
      const size = parseInt(document.getElementById('input-tpl-size')?.value || 52);
      const kerning = parseFloat(document.getElementById('input-tpl-kerning')?.value || 0);
      const leading = parseFloat(document.getElementById('input-tpl-leading')?.value || 1.25);
      const color = document.getElementById('input-tpl-color')?.value;
      const align = document.getElementById('select-tpl-align')?.value;
      const maxlines = parseInt(document.getElementById('select-tpl-maxlines')?.value || 0);
      const posy = parseInt(document.getElementById('input-tpl-posy')?.value || 50);
      const bgHex = document.getElementById('input-tpl-bgcolor-hex')?.value || '#000000';
      const bgOpacity = parseFloat(document.getElementById('input-tpl-bgopacity')?.value || 0.5);
      const padding = parseInt(document.getElementById('input-tpl-padding')?.value || 20);
      const radius = parseInt(document.getElementById('input-tpl-radius')?.value || 8);
      const bgImage = document.getElementById('input-tpl-bgimage')?.value.trim() || "";

      const r = parseInt(bgHex.slice(1, 3), 16) || 0;
      const g = parseInt(bgHex.slice(3, 5), 16) || 0;
      const b = parseInt(bgHex.slice(5, 7), 16) || 0;
      const rgbaBg = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;

      const tplObj = {
        id: store.activeTemplateId || 'tpl-' + Date.now(),
        name,
        fontFamily: font,
        fontSize: size,
        letterSpacing: kerning,
        lineHeight: leading,
        color,
        textAlign: align,
        maxLines: maxlines,
        posY: posy,
        bgColor: rgbaBg,
        padding,
        borderRadius: radius,
        bgImageUrl: bgImage
      };

      // 1. Save and set active template
      store.saveTemplate(tplObj);

      // 2. Assign template to active deck/scripture
      const activeDeck = store.activeDeck;
      if (activeDeck) {
        activeDeck.templateId = tplObj.id;
      }

      // 3. Immediately re-render live projected slide on Audience screen
      if (store.state.liveGroupIndex !== null && store.state.liveSlideIndex !== null) {
        store.setLiveSlide(store.state.liveGroupIndex, store.state.liveSlideIndex);
      } else {
        store.notify();
      }

      const activeTitle = activeDeck ? activeDeck.title : 'Texto Actual';
      alert(`✨ Plantilla '${name}' aplicada exitosamente a "${activeTitle}" y proyectada en vivo.`);
    };

    document.getElementById('btn-save-tpl')?.addEventListener('click', applyCurrentTemplate);
    document.getElementById('btn-apply-tpl')?.addEventListener('click', applyCurrentTemplate);

    document.getElementById('btn-create-template')?.addEventListener('click', () => {
      const tplName = prompt("Ingresa el nombre para la nueva plantilla:");
      if (tplName) {
        const newId = 'tpl-' + Date.now();
        const newTpl = {
          id: newId,
          name: tplName,
          fontFamily: 'Inter, sans-serif',
          fontSize: 52,
          letterSpacing: 0,
          lineHeight: 1.25,
          color: '#ffffff',
          textAlign: 'center',
          maxLines: 0,
          posY: 50,
          bgColor: 'rgba(0, 0, 0, 0.4)',
          padding: 20,
          borderRadius: 8,
          bgImageUrl: ''
        };
        store.saveTemplate(newTpl);
        this.populateTemplateForm(newTpl);
      }
    });
  }

  renderScriptureSubSidebar() {
    const listEl = document.getElementById('scripture-bibles-list');
    if (!listEl) return;

    const versions = getAllBibleVersions();

    if (versions.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 12px; font-size: 0.72rem; color: var(--text-muted); text-align: center; border: 1px dashed var(--border-color); border-radius: 6px; margin-top: 6px;">
          No hay Biblias cargadas.<br/><br/>
          Haz clic en <strong style="color: var(--accent-magenta); font-size: 1.1rem;">"+"</strong> para cargar una Biblia desde URL o JSON.
        </div>
      `;
      return;
    }

    if (!this.selectedBibleVersion || !versions.some(v => v.id === this.selectedBibleVersion)) {
      this.selectedBibleVersion = versions[0].id;
    }

    listEl.innerHTML = versions.map(ver => {
      const isActive = ver.id === this.selectedBibleVersion;
      return `
        <div class="folder-item ${isActive ? 'active' : ''}" data-bible-id="${ver.id}">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">📖 ${ver.name}</span>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span class="count">${ver.tag}</span>
            <button class="btn-delete-bible" data-bible-id="${ver.id}" data-bible-name="${ver.name.replace(/"/g, '&quot;')}" title="Eliminar Biblia" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.72rem; padding: 2px 4px; border-radius: 4px;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.folder-item').forEach(item => {
      const verId = item.getAttribute('data-bible-id');
      const verObj = versions.find(v => v.id === verId);

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-bible') || e.target.closest('.btn-delete-bible')) return;
        this.selectedBibleVersion = verId;
        this.renderScriptureSubSidebar();
        this.renderScripture3ColView();
        if (this.activeVerseData) this.projectActiveVerse();
      });

      if (verObj) {
        item.addEventListener('contextmenu', (e) => {
          this.showContextMenu(e, { type: 'bible', id: verObj.id, name: verObj.name });
        });
      }
    });

    listEl.querySelectorAll('.btn-delete-bible').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bId = btn.getAttribute('data-bible-id');
        const bName = btn.getAttribute('data-bible-name');
        this.executeDeleteTarget({ type: 'bible', id: bId, name: bName });
      });
    });
  }

  renderScripture3ColView() {
    const booksListEl = document.getElementById('scripture-books-list');
    const chaptersListEl = document.getElementById('scripture-chapters-list');
    const versesListEl = document.getElementById('scripture-verses-list');
    const countBooksEl = document.getElementById('count-scripture-books');
    const labelBookEl = document.getElementById('label-scripture-book');
    const labelChapterRefEl = document.getElementById('label-scripture-chapter-ref');
    const activeRefTagEl = document.getElementById('scripture-active-ref');
    const autocompleteHintEl = document.getElementById('scripture-autocomplete-hint');

    if (!booksListEl || !chaptersListEl || !versesListEl) return;

    const normQuery = (this.scriptureQuery || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. Filter Books
    let matchedBooks = BIBLE_BOOKS;
    this.matchedBookSuggestion = null;

    if (normQuery) {
      matchedBooks = BIBLE_BOOKS.filter(b => {
        const normName = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normName.includes(normQuery);
      });

      // Find prefix match for Tab autocomplete
      const prefixMatch = BIBLE_BOOKS.find(b => {
        const normName = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normName.startsWith(normQuery);
      });

      if (prefixMatch) {
        this.matchedBookSuggestion = prefixMatch;
        if (autocompleteHintEl) {
          autocompleteHintEl.textContent = `Tab ↹ ${prefixMatch.name}`;
          autocompleteHintEl.style.display = 'block';
        }
      } else if (autocompleteHintEl) {
        autocompleteHintEl.style.display = 'none';
      }
    } else if (autocompleteHintEl) {
      autocompleteHintEl.style.display = 'none';
    }

    if (countBooksEl) countBooksEl.textContent = matchedBooks.length;

    // Render Books Column
    booksListEl.innerHTML = matchedBooks.map(book => {
      const isActive = book.id === this.selectedBookId;
      const isMatch = normQuery && book.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normQuery);
      return `
        <div class="scripture-book-item ${isActive ? 'active' : ''} ${isMatch ? 'match-search' : ''}" data-book-id="${book.id}">
          <span>${book.name}</span>
          <span style="font-size:0.65rem; opacity:0.7;">${book.chapters} cap</span>
        </div>
      `;
    }).join('');

    booksListEl.querySelectorAll('.scripture-book-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectedBookId = item.getAttribute('data-book-id');
        this.selectedChapter = 1;
        this.renderScripture3ColView();
      });
    });

    // 2. Selected Book & Chapters Column
    const activeBookObj = BIBLE_BOOKS.find(b => b.id === this.selectedBookId) || BIBLE_BOOKS[0];
    if (labelBookEl) labelBookEl.textContent = activeBookObj.name;

    if (this.selectedChapter > activeBookObj.chapters) {
      this.selectedChapter = 1;
    }

    const chapterCount = activeBookObj.chapters;
    const chaptersArray = Array.from({ length: chapterCount }, (_, i) => i + 1);

    chaptersListEl.innerHTML = chaptersArray.map(chapNum => {
      const isActive = chapNum === this.selectedChapter;
      return `
        <button class="scripture-chapter-btn ${isActive ? 'active' : ''}" data-chap-num="${chapNum}">
          ${chapNum}
        </button>
      `;
    }).join('');

    chaptersListEl.querySelectorAll('.scripture-chapter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedChapter = parseInt(btn.getAttribute('data-chap-num'));
        this.renderScripture3ColView();
      });
    });

    // 3. Verses Column
    const activeRefText = `${activeBookObj.name} ${this.selectedChapter}`;
    if (labelChapterRefEl) labelChapterRefEl.textContent = activeRefText;
    if (activeRefTagEl) activeRefTagEl.textContent = this.selectedBibleVersion ? `📖 ${activeRefText} (${this.selectedBibleVersion})` : '📖 Ninguna Biblia Seleccionada';

    const verses = getChapterVerses(this.selectedBookId, this.selectedChapter, this.selectedBibleVersion);

    if (verses.length === 0) {
      versesListEl.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.82rem; width: 100%;">
          <div style="font-size: 2rem; margin-bottom: 8px;">📖</div>
          No hay pasajes disponibles en esta vista.<br/><br/>
          Por favor presiona el botón <strong style="color: var(--accent-magenta); font-size: 1rem;">"+"</strong> en el panel lateral izquierdo para cargar una Biblia en formato JSON.
        </div>
      `;
      return;
    }

    versesListEl.innerHTML = verses.map(v => `
      <div class="scripture-verse-item" data-verse-num="${v.number}" data-verse-text="${v.text.replace(/"/g, '&quot;')}">
        <span class="scripture-verse-num">${v.number}</span>
        <span class="scripture-verse-text">${v.text}</span>
      </div>
    `).join('');

    // Bind verse click (Project verse live with smart splitting & ref subscript)
    versesListEl.querySelectorAll('.scripture-verse-item').forEach(item => {
      item.addEventListener('click', () => {
        const vNum = item.getAttribute('data-verse-num');
        const vText = item.getAttribute('data-verse-text');
        const fullTitle = `${activeBookObj.name} ${this.selectedChapter}:${vNum} (${this.selectedBibleVersion})`;

        this.activeVerseData = { vNum, vText, fullTitle };
        this.projectActiveVerse();
      });
    });
  }

  bindLoadBibleModalEvents() {
    const modal = document.getElementById('modal-load-bible');
    const btnOpen = document.getElementById('btn-open-load-bible-modal');
    const btnClose = document.getElementById('btn-close-load-bible-modal');
    const btnCancel = document.getElementById('btn-cancel-load-bible');
    const btnSubmit = document.getElementById('btn-submit-load-bible');
    const btnSelectFile = document.getElementById('btn-select-bible-file');
    const inputFile = document.getElementById('input-bible-file');
    const inputUrl = document.getElementById('input-bible-url');
    const statusEl = document.getElementById('bible-load-status');
    const fileLabel = document.getElementById('label-selected-bible-file');

    let loadedFileJSON = null;

    const openModal = () => {
      if (modal) modal.classList.add('open');
      if (statusEl) statusEl.style.display = 'none';
      loadedFileJSON = null;
      if (fileLabel) fileLabel.textContent = 'Ningún archivo seleccionado';
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('open');
      loadedFileJSON = null;
    };

    btnOpen?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);
    btnCancel?.addEventListener('click', closeModal);

    btnSelectFile?.addEventListener('click', () => inputFile?.click());

    inputFile?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (fileLabel) fileLabel.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          loadedFileJSON = JSON.parse(event.target.result);
          if (statusEl) {
            statusEl.textContent = `✓ Archivo '${file.name}' listo para cargar.`;
            statusEl.style.color = '#34d399';
            statusEl.style.display = 'block';
          }
        } catch (err) {
          if (statusEl) {
            statusEl.textContent = `❌ Error: El archivo no es un JSON válido.`;
            statusEl.style.color = '#f87171';
            statusEl.style.display = 'block';
          }
        }
      };
      reader.readAsText(file);
    });

    btnSubmit?.addEventListener('click', async () => {
      const url = inputUrl?.value.trim();

      if (statusEl) {
        statusEl.textContent = '⏳ Descargando y procesando estructura de la Biblia...';
        statusEl.style.color = '#38bdf8';
        statusEl.style.display = 'block';
      }

      try {
        let newBible = null;
        if (loadedFileJSON) {
          newBible = parseAndAddCustomBible(loadedFileJSON, fileLabel?.textContent || 'Archivo Local');
        } else if (url) {
          newBible = await fetchAndLoadBibleFromUrl(url);
        } else {
          alert("Por favor ingresa una URL o selecciona un archivo JSON de Biblia.");
          return;
        }

        if (newBible) {
          this.selectedBibleVersion = newBible.id;
          this.renderScriptureSubSidebar();
          this.renderScripture3ColView();
          closeModal();
          alert(`✨ Biblia "${newBible.name}" cargada y seleccionada exitosamente.`);
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = `❌ ${err.message}`;
          statusEl.style.color = '#f87171';
          statusEl.style.display = 'block';
        }
      }
    });
  }

  projectActiveVerse() {
    if (!this.activeVerseData) return;
    const { vText, fullTitle } = this.activeVerseData;
    const maxLines = store.state.scriptureMaxLines;
    const splitLong = store.state.scriptureSplitLong;
    const showRef = store.state.scriptureShowRef;

    const chunks = splitLong ? splitVerseText(vText, maxLines) : [vText];
    const firstChunk = chunks[0];
    const refLine = showRef ? `\n<span class="slide-scripture-ref">${fullTitle}</span>` : '';

    store.state.liveText = `${firstChunk}${refLine}`;
    store.state.isTextCleared = false;
    store.notify();
  }

  populateScriptureSettingsForm() {
    const selMaxLines = document.getElementById('select-scripture-maxlines');
    const selFont = document.getElementById('select-scripture-font');
    const selSplit = document.getElementById('select-scripture-split');
    const chkShowRef = document.getElementById('check-scripture-show-ref');

    if (selMaxLines) selMaxLines.value = String(store.state.scriptureMaxLines);
    if (selFont) selFont.value = store.state.scriptureFont;
    if (selSplit) selSplit.value = String(store.state.scriptureSplitLong);
    if (chkShowRef) chkShowRef.checked = store.state.scriptureShowRef;
  }

  bindScriptureEvents() {
    const searchInput = document.getElementById('input-scripture-search');

    searchInput?.addEventListener('input', () => {
      this.scriptureQuery = searchInput.value;

      // Smart direct reference parsing (e.g. "Juan 3:16" or "Salmos 23")
      const refRegex = /^([1-3]?\s*[a-zA-záéíóúÁÉÍÓÚ]+)\s*(\d+)?(?::(\d+))?$/i;
      const match = this.scriptureQuery.trim().match(refRegex);

      if (match) {
        const rawBookName = match[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchedBook = BIBLE_BOOKS.find(b => {
          const bNorm = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return bNorm.startsWith(rawBookName) || bNorm.includes(rawBookName);
        });

        if (matchedBook) {
          this.selectedBookId = matchedBook.id;
          if (match[2]) {
            const chap = parseInt(match[2]);
            if (chap >= 1 && chap <= matchedBook.chapters) {
              this.selectedChapter = chap;
            }
          }
        }
      }

      this.renderScripture3ColView();
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (this.matchedBookSuggestion) {
          e.preventDefault();
          this.scriptureQuery = this.matchedBookSuggestion.name;
          searchInput.value = this.matchedBookSuggestion.name;
          this.selectedBookId = this.matchedBookSuggestion.id;
          this.selectedChapter = 1;
          this.renderScripture3ColView();
        }
      }
    });

    // Dock Scripture Settings Form Handlers (Real-time Instant Updating)
    document.getElementById('select-scripture-maxlines')?.addEventListener('change', (e) => {
      store.setScriptureSettings({ maxLines: parseInt(e.target.value) });
      this.projectActiveVerse();
      this.renderScripture3ColView();
    });

    document.getElementById('select-scripture-font')?.addEventListener('change', (e) => {
      store.setScriptureSettings({ font: e.target.value });
      this.projectActiveVerse();
      this.renderScripture3ColView();
    });

    document.getElementById('select-scripture-split')?.addEventListener('change', (e) => {
      store.setScriptureSettings({ splitLong: e.target.value === 'true' });
      this.projectActiveVerse();
      this.renderScripture3ColView();
    });

    document.getElementById('check-scripture-show-ref')?.addEventListener('change', (e) => {
      store.setScriptureSettings({ showRef: e.target.checked });
      this.projectActiveVerse();
      this.renderScripture3ColView();
    });

    // Convert current scripture passage to permanent show deck with smart verse splitting & subscript ref
    document.getElementById('btn-convert-scripture-to-show')?.addEventListener('click', () => {
      const activeBookObj = BIBLE_BOOKS.find(b => b.id === this.selectedBookId) || BIBLE_BOOKS[0];
      const verses = getChapterVerses(this.selectedBookId, this.selectedChapter, this.selectedBibleVersion);
      const title = `${activeBookObj.name} ${this.selectedChapter} (${this.selectedBibleVersion})`;
      const maxLines = store.state.scriptureMaxLines;
      const splitLong = store.state.scriptureSplitLong;
      const showRef = store.state.scriptureShowRef;

      const passageBlocks = [];
      verses.forEach(v => {
        const fullRef = `${activeBookObj.name} ${this.selectedChapter}:${v.number} (${this.selectedBibleVersion})`;
        const chunks = splitLong ? splitVerseText(v.text, maxLines) : [v.text];

        chunks.forEach((chunk, cIdx) => {
          const refPart = showRef ? `\n<span class="slide-scripture-ref">${fullRef}${chunks.length > 1 ? ` (${cIdx + 1}/${chunks.length})` : ''}</span>` : '';
          passageBlocks.push(`${v.number}. ${chunk}${refPart}`);
        });
      });

      const rawPassageText = passageBlocks.join('\n\n');
      store.createNewShow(title, "Lectura", rawPassageText);
      alert(`✨ Se ha creado el show "${title}" con ${passageBlocks.length} diapositivas adaptadas.`);
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
      const id = el.getAttribute('data-deck-id');
      const deckObj = decks.find(d => d.id === id);
      el.addEventListener('click', () => {
        store.setActiveDeck(id);
      });
      el.addEventListener('contextmenu', (e) => {
        if (deckObj) this.showContextMenu(e, { type: 'deck', id: deckObj.id, name: deckObj.title });
      });
    });

    // 2. Render Shows, Media, Templates & Scripture Dock
    this.renderShowsCategories(decks);
    this.renderShowsDock(state, decks);
    this.renderMediaDock(state);
    this.renderTemplatesSidebar(state);
    this.renderScriptureSubSidebar();
    this.renderScripture3ColView();
    this.populateScriptureSettingsForm();

    // 3. Active Deck & Slide Cards
    const activeDeck = store.activeDeck;
    if (activeDeck) {
      this.activeDeckTitle.textContent = activeDeck.title;
      this.activeDeckCategory.textContent = `${activeDeck.category || activeDeck.type} • ${activeDeck.groups.length} Secciones`;

      let globalIndex = 1;
      const allCardsHTML = activeDeck.groups.flatMap((group, gIdx) => {
        return group.slides.map((slide, sIdx) => {
          const isLive = state.liveSlideId === slide.id && !state.isTextCleared;
          const cardIdx = globalIndex++;
          const tpl = state.activeTemplate;
          const tplStyles = tpl ? `font-family:${tpl.fontFamily}; letter-spacing:${tpl.letterSpacing}px; line-height:${tpl.lineHeight}; color:${tpl.color}; background-color:${tpl.bgColor || 'transparent'}; border-radius:${tpl.borderRadius || 4}px; padding: 4px 6px;` : '';

          return `
            <div class="slide-card ${isLive ? 'active-live' : ''}" data-gidx="${gIdx}" data-sidx="${sIdx}">
              <span class="slide-card-index">${cardIdx}</span>
              <span class="slide-card-live-badge">EN VIVO</span>
              <div class="slide-card-text" style="${tplStyles}">${slide.text.replace(/\n/g, '<br/>')}</div>
              <div class="slide-card-footer-line">
                <span class="badge ${group.badge}">${group.name}</span>
              </div>
            </div>
          `;
        });
      }).join('');

      this.slideGroupsWrapper.innerHTML = `
        <div class="slide-cards-grid">
          ${allCardsHTML}
        </div>
      `;

      this.slideGroupsWrapper.querySelectorAll('.slide-card').forEach(card => {
        card.addEventListener('click', () => {
          const gIdx = parseInt(card.getAttribute('data-gidx'));
          const sIdx = parseInt(card.getAttribute('data-sidx'));
          store.setLiveSlide(gIdx, sIdx);
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
    const targetText = (state.isTextCleared || !state.liveText) ? "" : state.liveText;

    if (!targetText) {
      this.liveTextEl.textContent = "-- Sin Texto Proyectado --";
      this.liveTextEl.style.opacity = "0.5";
      this.liveTextEl.style.backgroundColor = "transparent";
      this.liveTextEl.style.padding = "0px";
      this.operatorLiveTextContent = "";
    } else if (targetText !== this.operatorLiveTextContent) {
      const formattedHTML = targetText.replace(/\n/g, '<br/>');

      if (state.textTransition === 'fade' && this.operatorLiveTextContent && this.liveTextEl.textContent !== "-- Sin Texto Proyectado --") {
        this.liveTextEl.style.opacity = '0';
        if (this.operatorFadeTimeout) clearTimeout(this.operatorFadeTimeout);
        this.operatorFadeTimeout = setTimeout(() => {
          this.liveTextEl.innerHTML = formattedHTML;
          this.liveTextEl.style.opacity = '1';
        }, 120);
      } else {
        if (this.operatorFadeTimeout) clearTimeout(this.operatorFadeTimeout);
        this.liveTextEl.innerHTML = formattedHTML;
        this.liveTextEl.style.opacity = '1';
      }
      this.operatorLiveTextContent = targetText;
    }

    if (targetText && state.activeTemplate) {
      const tpl = state.activeTemplate;
      this.liveTextEl.style.fontFamily = tpl.fontFamily || 'Inter, sans-serif';
      this.liveTextEl.style.fontSize = Math.max(12, Math.round((tpl.fontSize || 52) * 0.3)) + 'px';
      this.liveTextEl.style.letterSpacing = (tpl.letterSpacing || 0) + 'px';
      this.liveTextEl.style.lineHeight = tpl.lineHeight || 1.25;
      this.liveTextEl.style.color = tpl.color || '#ffffff';
      this.liveTextEl.style.textShadow = tpl.textShadow || '0 2px 8px rgba(0,0,0,0.8)';
      this.liveTextEl.style.textAlign = tpl.textAlign || 'center';
      this.liveTextEl.style.backgroundColor = tpl.bgColor || 'transparent';
      this.liveTextEl.style.padding = Math.round((tpl.padding || 10) * 0.4) + 'px';
      this.liveTextEl.style.borderRadius = Math.round((tpl.borderRadius || 8) * 0.5) + 'px';

      if (tpl.maxLines && tpl.maxLines > 0) {
        this.liveTextEl.style.display = '-webkit-box';
        this.liveTextEl.style['-webkit-line-clamp'] = tpl.maxLines;
        this.liveTextEl.style['-webkit-box-orient'] = 'vertical';
        this.liveTextEl.style.overflow = 'hidden';
      } else {
        this.liveTextEl.style.display = 'block';
        this.liveTextEl.style.overflow = 'visible';
      }
    }

    this.stageCurrentEl.textContent = state.isTextCleared ? "TEXTO LIMPIO" : (state.liveText || "--");
    this.stageNextEl.textContent = "SIGUIENTE: " + (state.nextText || "--");
    this.stageTimerEl.textContent = stageManager.constructor.formatTime(state.timerValue);

    // Update transition toggle buttons & slider active state
    document.querySelectorAll('.btn-trans-toggle').forEach(btn => {
      const type = btn.getAttribute('data-trans-type');
      const mode = btn.getAttribute('data-mode');
      if (type === 'text') {
        btn.classList.toggle('active', state.textTransition === mode);
      } else if (type === 'media') {
        btn.classList.toggle('active', state.mediaTransition === mode);
      }
    });

    const fadeDurInput = document.getElementById('input-fade-duration');
    const fadeDurBadge = document.getElementById('val-fade-duration');
    if (fadeDurInput && document.activeElement !== fadeDurInput) {
      fadeDurInput.value = state.fadeDuration || 250;
    }
    if (fadeDurBadge) {
      fadeDurBadge.textContent = (state.fadeDuration || 250) + 'ms';
    }

    // Apply live transition timing CSS to operator live preview
    const dur = state.fadeDuration || 250;
    if (this.liveTextEl) {
      this.liveTextEl.style.transition = state.textTransition === 'cut' ? 'opacity 0s, transform 0s' : `opacity ${dur}ms ease-in-out, transform ${dur}ms ease-in-out`;
    }
    if (this.operatorVideoPreview) {
      this.operatorVideoPreview.style.transition = state.mediaTransition === 'cut' ? 'opacity 0s' : `opacity ${dur}ms ease-in-out`;
    }

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
