/**
 * ProPresenter AI Studio - Main Application Controller
 */

import { store } from './state.js';
import { sync } from './broadcast.js';
import { stageManager } from './stage-manager.js';
import { BIBLE_BOOKS, BIBLE_VERSIONS, getAllBibleVersions, getChapterVerses, splitVerseText, fetchAndLoadBibleFromUrl, parseAndAddCustomBible, deleteCustomBible } from './bible-data.js';
import { searchSongsOnline } from './song-search.js';
import { calendarManager } from './calendar-manager.js';
import { MediaCache } from './media-cache.js';
import pkg from '../../package.json';

class ProPresenterApp {
  constructor() {
    this.operatorVideoPreview = document.getElementById('operator-video-preview');
    this.contextTarget = null;

    // State for Scriptures Navigator & Operator Video Crossfade
    this.operatorVideoUrl = "";
    this.operatorActiveMediaLayer = 'A';
    this.selectedBibleVersion = '';
    this.selectedBookId = 'JHN';
    this.selectedChapter = 3;
    this.scriptureQuery = '';
    this.matchedBookSuggestion = null;
    this.isAudienceOpen = false;

    // Track Audience window status for operator audio echo prevention
    sync.onAudiencePresence((isOpen) => {
      this.isAudienceOpen = isOpen;
      this.updateOperatorAudioMute();
    });

    if (window.electronAPI) {
      if (typeof window.electronAPI.onAudienceStatusChanged === 'function') {
        window.electronAPI.onAudienceStatusChanged((isOpen) => {
          this.isAudienceOpen = isOpen;
          this.updateOperatorAudioMute();
        });
      }
      if (typeof window.electronAPI.isAudienceOpen === 'function') {
        window.electronAPI.isAudienceOpen().then(isOpen => {
          this.isAudienceOpen = !!isOpen;
          this.updateOperatorAudioMute();
        }).catch(() => {});
      }
    }

    window.closeAllModals = () => this.closeAllModals();
    this.initDOM();
    this.bindEvents();
    this.initModalBackdropListeners();
    this.initKeyboardShortcuts();
    this.bindContextMenuEvents();

    // Subscribe to state changes and sync displays
    store.subscribe((state, decks) => {
      this.renderUI(state, decks);
      sync.sendUpdate(state);
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
    this.brandBadgeEl = document.getElementById('app-brand-badge') || document.querySelector('.brand-badge');
    if (this.brandBadgeEl && pkg && pkg.version) {
      this.brandBadgeEl.textContent = `PRO v${pkg.version}`;
    }

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
    this.inputShowTemplate = document.getElementById('input-show-template');
    this.inputShowSplitMode = document.getElementById('input-show-split-mode');
    this.inputShowMaxLines = document.getElementById('input-show-max-lines');
    this.wrapperShowMaxLines = document.getElementById('wrapper-show-max-lines');
    this.inputShowText = document.getElementById('input-show-text');
    this.btnSaveShow = document.getElementById('btn-save-show');

    this.modalUploadMedia = document.getElementById('modal-upload-media');
    this.inputMediaName = document.getElementById('input-media-name');
    this.inputMediaUrl = document.getElementById('input-media-url');
    this.selectMediaFolder = document.getElementById('select-media-folder');
    this.inputNewFolderName = document.getElementById('input-new-folder-name');
    this.btnSaveMedia = document.getElementById('btn-save-media');
    this.selectedMediaFilename = document.getElementById('selected-media-filename');

    this.modalCreateFolder = document.getElementById('modal-create-folder');
    this.inputVirtualFolderName = document.getElementById('input-virtual-folder-name');
    this.btnSaveVirtualFolderConfirm = document.getElementById('btn-save-virtual-folder-confirm');
    this.btnCloseCreateFolderModal = document.getElementById('btn-close-create-folder-modal');
    this.btnCancelCreateFolder = document.getElementById('btn-cancel-create-folder');

    this.modalCreateTemplate = document.getElementById('modal-create-template');
    this.inputTemplateName = document.getElementById('input-template-name');
    this.btnSaveTemplateConfirm = document.getElementById('btn-save-template-confirm');
    this.btnCloseCreateTemplateModal = document.getElementById('btn-close-create-template-modal');
    this.btnCancelCreateTemplate = document.getElementById('btn-cancel-create-template');

    // Slide Edit Modal
    this.modalEditSlide = document.getElementById('modal-edit-slide');
    this.inputEditSlideText = document.getElementById('input-edit-slide-text');
    this.lblEditSlideTarget = document.getElementById('lbl-edit-slide-target');
    this.btnSaveEditSlideConfirm = document.getElementById('btn-save-edit-slide-confirm');
    this.btnCloseEditSlideModal = document.getElementById('btn-close-edit-slide-modal');
    this.btnCancelEditSlide = document.getElementById('btn-cancel-edit-slide');
    this.inputEditSlideSection = document.getElementById('input-edit-slide-section');
    this.pendingEditSlideTarget = null;

    // Section Navigation & Picker Elements
    this.deckSectionsNavEl = document.getElementById('deck-sections-nav');
    this.modalSectionPicker = document.getElementById('modal-section-picker');
    this.lblSectionPickerTarget = document.getElementById('lbl-section-picker-target');
    this.inputCustomSectionName = document.getElementById('input-custom-section-name');
    this.btnApplyCustomSection = document.getElementById('btn-apply-custom-section');
    this.wrapperSectionSplitAction = document.getElementById('wrapper-section-split-action');
    this.btnSplitAtSlide = document.getElementById('btn-split-at-slide');
    this.btnCloseSectionPickerModal = document.getElementById('btn-close-section-picker-modal');
    this.btnCancelSectionPicker = document.getElementById('btn-cancel-section-picker');
    this.ctxActionSection = document.getElementById('ctx-action-section');
    this.pendingSectionPickerTarget = null;
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
        } else if (resType === 'calendar') {
          document.getElementById('res-tab-calendar')?.classList.add('active');
          document.getElementById('sub-sidebar-calendar')?.classList.add('active');
          calendarManager.renderCalendarUI();
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

    this.bindCalendarEvents();

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
    const tabManual = document.getElementById('tab-create-manual');
    const tabClipboard = document.getElementById('tab-create-clipboard');
    const tabSearch = document.getElementById('tab-create-search');
    const viewManual = document.getElementById('view-create-manual');
    const viewSearch = document.getElementById('view-create-search');
    const btnPasteClipboard = document.getElementById('btn-paste-clipboard');

    const switchModalMode = (mode) => {
      const setTabStyle = (tab, isActive) => {
        if (!tab) return;
        if (isActive) {
          tab.classList.add('active');
          tab.style.background = 'var(--bg-card)';
          tab.style.color = '#fff';
        } else {
          tab.classList.remove('active');
          tab.style.background = 'transparent';
          tab.style.color = 'var(--text-muted)';
        }
      };

      if (mode === 'manual') {
        setTabStyle(tabManual, true);
        setTabStyle(tabClipboard, false);
        setTabStyle(tabSearch, false);

        if (viewManual) viewManual.style.display = 'block';
        if (viewSearch) viewSearch.style.display = 'none';
      } else if (mode === 'search') {
        setTabStyle(tabSearch, true);
        setTabStyle(tabManual, false);
        setTabStyle(tabClipboard, false);

        if (viewSearch) viewSearch.style.display = 'block';
        if (viewManual) viewManual.style.display = 'none';
        document.getElementById('input-song-search-query')?.focus();
      }
    };

    const pasteFromClipboard = async () => {
      try {
        let clipboardText = "";
        if (navigator.clipboard && navigator.clipboard.readText) {
          clipboardText = await navigator.clipboard.readText();
        }

        if (!clipboardText || !clipboardText.trim()) {
          alert("El portapapeles está vacío o no contiene texto legible.");
          return;
        }

        const trimmed = clipboardText.trim();
        if (this.inputShowText) {
          this.inputShowText.value = trimmed;
        }

        // Sugerir título desde la primera línea si el título está vacío
        if (this.inputShowTitle && !this.inputShowTitle.value.trim()) {
          const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length > 0) {
            let candidate = lines[0];
            candidate = candidate.replace(/^(título|canción|song|title)\s*:\s*/i, '');
            if (candidate.length > 60) {
              candidate = candidate.substring(0, 57) + '...';
            }
            this.inputShowTitle.value = candidate;
          }
        }
      } catch (err) {
        console.warn("No se pudo acceder directamente al portapapeles:", err);
        alert("No se pudo leer automáticamente el portapapeles. Puedes usar Ctrl+V directamente en el área de texto.");
      }
    };

    tabManual?.addEventListener('click', () => switchModalMode('manual'));
    tabSearch?.addEventListener('click', () => switchModalMode('search'));
    tabClipboard?.addEventListener('click', async () => {
      switchModalMode('manual');
      await pasteFromClipboard();
    });
    btnPasteClipboard?.addEventListener('click', pasteFromClipboard);

    // Web Song Search Logic
    const btnSongSearch = document.getElementById('btn-song-search-submit');
    const inputSongQuery = document.getElementById('input-song-search-query');
    const songResultsList = document.getElementById('song-search-results-list');

    let currentSearchResults = [];

    const handleSongSearch = async (e) => {
      if (e) e.preventDefault();
      const q = inputSongQuery?.value.trim();
      if (!q) {
        if (songResultsList) {
          songResultsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">⚠️ Por favor ingresa el título o autor de la canción.</div>`;
        }
        return;
      }

      if (btnSongSearch) {
        btnSongSearch.disabled = true;
        btnSongSearch.textContent = "⌛ Buscando...";
      }
      if (songResultsList) {
        songResultsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">⏳ Buscando letras en la web para "<strong>${q}</strong>"...</div>`;
      }

      try {
        currentSearchResults = await searchSongsOnline(q);
        
        if (currentSearchResults.length === 0) {
          if (songResultsList) {
            songResultsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">❌ No se encontraron canciones. Intenta con otro nombre o artista.</div>`;
          }
        } else {
          if (songResultsList) {
            songResultsList.innerHTML = currentSearchResults.map((song, idx) => `
              <div class="song-search-item" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden; flex: 1;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🎵 ${song.title}</span>
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--text-muted);">
                    <span>👤 <strong>Autor:</strong> ${song.artist}</span>
                    <span>•</span>
                    <span style="color: var(--accent-cyan);">🌐 <strong>Página:</strong> ${song.source}</span>
                  </div>
                </div>
                <button type="button" class="btn-select-song-result" data-song-idx="${idx}" style="background: linear-gradient(135deg, var(--accent-magenta), #db2777); color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 0.73rem; font-weight: 700; cursor: pointer; white-space: nowrap;">
                  📥 Cargar Letra
                </button>
              </div>
            `).join('');

            songResultsList.querySelectorAll('.btn-select-song-result').forEach(btn => {
              btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                const idx = parseInt(btn.getAttribute('data-song-idx'));
                const selectedSong = currentSearchResults[idx];
                if (selectedSong) {
                  if (this.inputShowTitle) this.inputShowTitle.value = selectedSong.title;
                  if (this.inputShowText) this.inputShowText.value = selectedSong.lyrics;
                  if (this.activeFilter && this.activeFilter !== 'all' && this.inputShowCategory) {
                    this.inputShowCategory.value = this.activeFilter;
                  }
                  switchModalMode('manual');
                }
              });
            });
          }
        }
      } catch (err) {
        if (songResultsList) {
          songResultsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444; font-size: 0.8rem;">⚠️ Error al realizar la búsqueda web: ${err.message}</div>`;
        }
      } finally {
        if (btnSongSearch) {
          btnSongSearch.disabled = false;
          btnSongSearch.textContent = "🔍 Buscar";
        }
      }
    };

    btnSongSearch?.addEventListener('click', handleSongSearch);
    inputSongQuery?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSongSearch(e);
    });

    const openModalShow = () => {
      this.closeAllModals();
      if (this.modalCreateShow) {
        this.modalCreateShow.classList.add('open');
        switchModalMode('manual');

        // Poblar plantillas de estilo dinámicamente
        if (this.inputShowTemplate) {
          const templates = store.templates || [];
          this.inputShowTemplate.innerHTML = templates.map(t => 
            `<option value="${t.id}" ${t.id === store.activeTemplateId ? 'selected' : ''}>${t.name}${t.maxLines > 0 ? ` (Máx. ${t.maxLines} renglones)` : ''}</option>`
          ).join('');

          // Cuando cambia el template, actualizar visualmente maxLines por defecto si aplica
          const updateDefaultMaxLines = () => {
            const selectedTplId = this.inputShowTemplate.value;
            const tpl = templates.find(t => t.id === selectedTplId);
            if (tpl && tpl.maxLines > 0 && this.inputShowMaxLines) {
              this.inputShowMaxLines.value = String(tpl.maxLines);
            }
          };
          this.inputShowTemplate.onchange = updateDefaultMaxLines;
        }

        // Auto-seleccionar la categoría activa actual
        if (this.activeFilter && this.activeFilter !== 'all' && this.inputShowCategory) {
          const filterCategory = this.activeFilter;
          const options = Array.from(this.inputShowCategory.options);
          let matchedOption = options.find(opt => 
            opt.value.toLowerCase() === filterCategory.toLowerCase()
          );

          if (matchedOption) {
            this.inputShowCategory.value = matchedOption.value;
          } else {
            const newOpt = document.createElement('option');
            newOpt.value = filterCategory;
            newOpt.textContent = filterCategory;
            this.inputShowCategory.appendChild(newOpt);
            this.inputShowCategory.value = filterCategory;
          }
        }

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
    document.getElementById('btn-add-deck-header')?.addEventListener('click', openModalShow);
    document.getElementById('btn-close-modal')?.addEventListener('click', closeModalShow);
    document.getElementById('btn-cancel-show')?.addEventListener('click', closeModalShow);

    this.btnSaveShow?.addEventListener('click', () => {
      const title = this.inputShowTitle.value.trim();
      const category = this.inputShowCategory.value;
      const text = this.inputShowText.value.trim();
      const templateId = this.inputShowTemplate?.value || store.activeTemplateId;
      const splitMode = this.inputShowSplitMode?.value || 'paragraph';
      const maxLines = parseInt(this.inputShowMaxLines?.value || 0);

      if (!title || !text) {
        alert("Por favor ingresa un título y el texto del show/canción.");
        return;
      }

      store.createNewShow(title, category, text, {
        templateId,
        splitMode,
        maxLines
      });
      closeModalShow();
    });

    // Handlers para el Modal de Re-división de Filminas (Reflow Deck)
    const openModalReflow = () => {
      this.closeAllModals();
      const modalReflow = document.getElementById('modal-reflow-deck');
      if (modalReflow) modalReflow.classList.add('open');
    };

    const closeModalReflow = () => {
      const modalReflow = document.getElementById('modal-reflow-deck');
      if (modalReflow) modalReflow.classList.remove('open');
    };

    document.getElementById('btn-reflow-deck')?.addEventListener('click', openModalReflow);
    document.getElementById('btn-close-reflow-modal')?.addEventListener('click', closeModalReflow);
    document.getElementById('btn-cancel-reflow')?.addEventListener('click', closeModalReflow);
    document.getElementById('btn-confirm-reflow')?.addEventListener('click', () => {
      const inputReflow = document.getElementById('input-reflow-lines');
      const lines = parseInt(inputReflow?.value || 2);
      if (store.activeDeckId) {
        store.reflowDeckSlides(store.activeDeckId, lines);
      }
      closeModalReflow();
    });

    // Control de Tamaño / Zoom de Slide-Cards en el Banner del Grid
    const inputCardSize = document.getElementById('input-slide-card-size');
    const valCardSize = document.getElementById('val-slide-card-size');

    const applySlideCardSize = (sizeVal) => {
      const size = parseInt(sizeVal);
      if (isNaN(size)) return;
      if (valCardSize) valCardSize.textContent = `${size}px`;
      
      const gridContainer = document.querySelector('.slide-grid-container');
      const gridWrapper = document.querySelector('.slide-cards-grid');
      if (gridContainer) gridContainer.style.setProperty('--slide-card-min-width', `${size}px`);
      if (gridWrapper) gridWrapper.style.setProperty('--slide-card-min-width', `${size}px`);
      
      try {
        localStorage.setItem('propresenter_slide_card_size', String(size));
      } catch(e) {}
    };

    if (inputCardSize) {
      inputCardSize.addEventListener('input', (e) => applySlideCardSize(e.target.value));
      inputCardSize.addEventListener('change', (e) => applySlideCardSize(e.target.value));

      const savedCardSize = (typeof localStorage !== 'undefined' && localStorage.getItem('propresenter_slide_card_size')) || '220';
      inputCardSize.value = savedCardSize;
      applySlideCardSize(savedCardSize);
    }

    // 8. Upload Media Modal Handlers (Cargar Video asignando carpeta virtual)
    const openModalMedia = () => {
      this.closeAllModals();
      this.pendingBatchFiles = [];
      if (this.inputMediaName) this.inputMediaName.value = "";
      if (this.inputMediaUrl) this.inputMediaUrl.value = "";
      if (this.inputNewFolderName) this.inputNewFolderName.value = "";
      if (this.selectedMediaFilename) this.selectedMediaFilename.textContent = "Ningún archivo seleccionado";

      if (this.selectMediaFolder) {
        const folders = store.state.mediaFolders || ["General"];
        this.selectMediaFolder.innerHTML = folders.map(f => `<option value="${f}">${f}</option>`).join('');
        if (this.selectedMediaFolder && this.selectedMediaFolder !== 'all') {
          this.selectMediaFolder.value = this.selectedMediaFolder;
        }
      }

      if (this.modalUploadMedia) {
        this.modalUploadMedia.classList.add('open');
        this.inputMediaName?.focus();
      }
    };

    const closeModalMedia = () => {
      this.pendingBatchFiles = [];
      if (this.modalUploadMedia) {
        this.modalUploadMedia.classList.remove('open');
      }
    };

    document.getElementById('btn-open-media-modal')?.addEventListener('click', openModalMedia);
    document.getElementById('btn-close-media-modal')?.addEventListener('click', closeModalMedia);
    document.getElementById('btn-cancel-media')?.addEventListener('click', closeModalMedia);

    // File Browser button inside Upload Modal (Soporte Nativo Electron + Multi-archivo)
    document.getElementById('btn-select-media-file')?.addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.selectMediaFiles) {
        const files = await window.electronAPI.selectMediaFiles();
        if (files && files.length > 0) {
          this.pendingBatchFiles = await Promise.all(files.map(async f => {
            const fileName = typeof f === 'string' ? f.split(/[\\/]/).pop() : (f.name || 'Medio');
            const fileUrl = typeof f === 'string' ? f : f.url;
            const filePath = f.filePath || (typeof f === 'string' ? f : '');
            const isImg = !!fileName.match(/\.(jpeg|jpg|png|gif|webp|svg|bmp)$/i);
            const mediaType = isImg ? 'image/png' : 'video/mp4';
            const id = "media-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);

            let thumb = null;
            try {
              thumb = await MediaCache.generateThumbnail(fileUrl, mediaType);
              if (thumb) await MediaCache.saveThumbnail(id, thumb);
            } catch (err) {}

            return {
              id,
              name: fileName,
              url: fileUrl,
              filePath,
              type: mediaType,
              thumbnail: thumb || ''
            };
          }));

          if (this.selectedMediaFilename) {
            this.selectedMediaFilename.textContent = `${this.pendingBatchFiles.length} archivo(s) seleccionado(s)`;
          }
          if (this.inputMediaName && this.pendingBatchFiles.length === 1) {
            this.inputMediaName.value = this.pendingBatchFiles[0].name;
          }
        }
      } else {
        this.videoFileInput?.click();
      }
    });

    this.videoFileInput?.addEventListener('change', async (e) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        this.pendingBatchFiles = await this.processMediaFiles(selectedFiles, this.selectMediaFolder?.value || "General");

        if (this.selectedMediaFilename) {
          const namesSnippet = selectedFiles.map(f => f.name).slice(0, 2).join(', ');
          const extraCount = selectedFiles.length > 2 ? ` (+${selectedFiles.length - 2} más)` : '';
          this.selectedMediaFilename.textContent = `${selectedFiles.length} archivo(s): ${namesSnippet}${extraCount}`;
        }

        if (this.inputMediaName) {
          this.inputMediaName.value = selectedFiles.length === 1 ? selectedFiles[0].name : `Lote de ${selectedFiles.length} medios`;
        }
      }
    });

    this.btnSaveMedia?.addEventListener('click', () => {
      const customName = this.inputMediaName.value.trim();
      let customUrl = this.inputMediaUrl.value.trim();
      const newFolder = this.inputNewFolderName.value.trim();
      let folder = newFolder || this.selectMediaFolder.value || "General";

      if (this.pendingBatchFiles && this.pendingBatchFiles.length > 0) {
        const batchToSave = this.pendingBatchFiles.map((item) => ({
          ...item,
          name: this.pendingBatchFiles.length === 1 && customName ? customName : item.name,
          folder: folder
        }));
        store.addMediaBatch(batchToSave);
        this.pendingBatchFiles = null;
        closeModalMedia();
        return;
      }

      if (customUrl) {
        const isImg = !!customUrl.match(/\.(jpeg|jpg|png|gif|webp|svg|bmp)($|\?)/i);
        const mediaType = isImg ? "image/png" : "video/mp4";
        const id = "media-" + Date.now();
        const newItem = store.addMediaItem(customName || "Medio sin nombre", customUrl, mediaType, folder);
        MediaCache.generateThumbnail(customUrl, mediaType).then(thumb => {
          if (thumb) {
            MediaCache.saveThumbnail(newItem.id, thumb);
            store.updateMediaItemThumbnail(newItem.id, thumb);
          }
        }).catch(() => {});
        closeModalMedia();
        return;
      }

      alert("Por favor selecciona uno o más archivos de video/imagen o ingresa una URL.");
    });

    // Drag & Drop Directo sobre la biblioteca de Medios para carga por lotes (imágenes y videos)
    const mediaDropTargets = [
      document.getElementById('res-tab-media'),
      document.getElementById('media-grid'),
      document.querySelector('.resource-body'),
      document.querySelector('.bottom-resource-dock')
    ].filter(Boolean);

    mediaDropTargets.forEach(targetEl => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        targetEl.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      targetEl.addEventListener('drop', async (e) => {
        const rawFiles = Array.from(e.dataTransfer.files || []);
        const files = rawFiles.filter(f => 
          f.type.startsWith('video/') || 
          f.type.startsWith('image/') || 
          f.name.match(/\.(jpeg|jpg|png|gif|webp|svg|mp4|webm|mov|mkv|avi)$/i)
        );

        if (files.length > 0) {
          const targetFolder = this.selectedMediaFolder && this.selectedMediaFolder !== 'all' ? this.selectedMediaFolder : 'General';
          const batchItems = await this.processMediaFiles(files, targetFolder);

          store.addMediaBatch(batchItems);

          // Cambiar a la pestaña de Medios en el dock si no está activa
          const mediaTabBtn = document.querySelector('.res-tab[data-res="media"]');
          if (mediaTabBtn && !mediaTabBtn.classList.contains('active')) {
            mediaTabBtn.click();
          }

          // Si se soltó 1 solo archivo, proyectarlo automáticamente
          if (batchItems.length === 1) {
            store.setActiveVideo(batchItems[0].url, batchItems[0].name, batchItems[0].type);
          }
        }
      });
    });

    // Add Virtual Folder quick button (+) & Modal Handlers
    const openModalFolder = () => {
      this.closeAllModals();
      if (this.inputVirtualFolderName) this.inputVirtualFolderName.value = "";
      if (this.modalCreateFolder) {
        this.modalCreateFolder.classList.add('open');
        this.inputVirtualFolderName?.focus();
      }
    };

    const closeModalFolder = () => {
      if (this.modalCreateFolder) {
        this.modalCreateFolder.classList.remove('open');
      }
    };

    const saveVirtualFolder = () => {
      const folderName = this.inputVirtualFolderName ? this.inputVirtualFolderName.value.trim() : "";
      if (folderName) {
        store.addMediaFolder(folderName);
        this.selectedMediaFolder = folderName;
        closeModalFolder();
      } else {
        alert("Por favor ingresa un nombre para la carpeta virtual.");
      }
    };

    document.getElementById('btn-add-virtual-folder')?.addEventListener('click', openModalFolder);
    this.btnCloseCreateFolderModal?.addEventListener('click', closeModalFolder);
    this.btnCancelCreateFolder?.addEventListener('click', closeModalFolder);
    this.btnSaveVirtualFolderConfirm?.addEventListener('click', saveVirtualFolder);
    this.inputVirtualFolderName?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveVirtualFolder();
      }
    });

    // 8.b. Slide Edit Modal Listeners
    const closeModalEditSlide = () => {
      if (this.modalEditSlide) this.modalEditSlide.classList.remove('open');
      this.pendingEditSlideTarget = null;
    };

    const saveEditSlide = () => {
      const text = this.inputEditSlideText?.value;
      const isTemp = document.querySelector('input[name="edit-slide-scope"]:checked')?.value === 'temp';
      if (this.pendingEditSlideTarget && text !== undefined) {
        const { deckId, groupIndex, slideIndex } = this.pendingEditSlideTarget;
        store.updateSlideText(deckId, groupIndex, slideIndex, text, isTemp);

        if (!isTemp && this.inputEditSlideSection) {
          const parts = this.inputEditSlideSection.value.split('|');
          const badge = parts[0];
          const name = parts[1];
          if (badge && name) {
            store.setGroupSection(deckId, groupIndex, name, badge);
          }
        }
      }
      closeModalEditSlide();
    };

    this.btnCloseEditSlideModal?.addEventListener('click', closeModalEditSlide);
    this.btnCancelEditSlide?.addEventListener('click', closeModalEditSlide);
    this.btnSaveEditSlideConfirm?.addEventListener('click', saveEditSlide);

    // 8.c. Section Quick Chips in Create Show Modal
    document.querySelectorAll('.btn-chip-section').forEach(chip => {
      chip.addEventListener('click', () => {
        const secTag = chip.getAttribute('data-sec');
        if (!secTag || !this.inputShowText) return;

        const curVal = this.inputShowText.value;
        const start = this.inputShowText.selectionStart || curVal.length;
        const end = this.inputShowText.selectionEnd || curVal.length;

        const prefix = (start > 0 && curVal[start - 1] !== '\n') ? '\n\n' : '';
        const insertText = `${prefix}${secTag}\n`;
        this.inputShowText.value = curVal.substring(0, start) + insertText + curVal.substring(end);
        this.inputShowText.focus();
        const nextPos = start + insertText.length;
        this.inputShowText.setSelectionRange(nextPos, nextPos);
      });
    });

    // 8.d. Section Picker Modal Listeners
    document.querySelectorAll('.btn-picker-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const badge = btn.getAttribute('data-badge');
        const name = btn.getAttribute('data-name');
        if (this.pendingSectionPickerTarget && badge && name) {
          const { deckId, groupIndex } = this.pendingSectionPickerTarget;
          store.setGroupSection(deckId, groupIndex, name, badge);
        }
        this.closeSectionPickerModal();
      });
    });

    this.btnApplyCustomSection?.addEventListener('click', () => {
      const customName = this.inputCustomSectionName?.value?.trim();
      if (this.pendingSectionPickerTarget && customName) {
        const { deckId, groupIndex, currentBadge } = this.pendingSectionPickerTarget;
        store.setGroupSection(deckId, groupIndex, customName, currentBadge || 'badge-custom');
      }
      this.closeSectionPickerModal();
    });

    this.inputCustomSectionName?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.btnApplyCustomSection?.click();
      }
    });

    this.btnSplitAtSlide?.addEventListener('click', () => {
      if (this.pendingSectionPickerTarget) {
        const { deckId, groupIndex, slideIndex } = this.pendingSectionPickerTarget;
        store.splitGroupAtSlide(deckId, groupIndex, slideIndex, 'Coro', 'badge-chorus');
      }
      this.closeSectionPickerModal();
    });

    this.btnCloseSectionPickerModal?.addEventListener('click', () => this.closeSectionPickerModal());
    this.btnCancelSectionPicker?.addEventListener('click', () => this.closeSectionPickerModal());

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

    // 14. Audio Controls (Toggle Mute and Volume Adjustment)
    document.getElementById('btn-toggle-video-sound')?.addEventListener('click', () => {
      store.toggleMediaAudio();
      this.updateOperatorAudioMute();
    });
    document.getElementById('btn-audio-mute-toggle')?.addEventListener('click', () => {
      store.toggleMediaAudio();
      this.updateOperatorAudioMute();
    });
    document.getElementById('btn-dock-audio-toggle')?.addEventListener('click', () => {
      store.toggleMediaAudio();
      this.updateOperatorAudioMute();
    });

    const videoVolInput = document.getElementById('input-video-volume');
    videoVolInput?.addEventListener('input', () => {
      const val = parseInt(videoVolInput.value);
      const badge = document.getElementById('val-video-volume');
      if (badge) badge.textContent = val + '%';
      store.setMediaAudioVolume(val / 100);
      this.updateOperatorAudioMute();
    });
  }

  updateOperatorAudioMute() {
    const bgA = document.getElementById('operator-video-preview-a');
    const bgB = document.getElementById('operator-video-preview-b');
    const shouldMute = this.isAudienceOpen || !!store.state.isMediaAudioMuted;
    const vol = typeof store.state.mediaAudioVolume === 'number' ? store.state.mediaAudioVolume : 1.0;

    if (bgA) {
      bgA.muted = shouldMute;
      bgA.volume = vol;
    }
    if (bgB) {
      bgB.muted = shouldMute;
      bgB.volume = vol;
    }
  }


  async processMediaFiles(files, folder = 'General') {
    if (!files || files.length === 0) return [];
    const targetFolder = folder && folder !== 'all' ? folder : 'General';

    const processedItems = await Promise.all(files.map(async (f) => {
      const isImg = f.type ? f.type.startsWith('image/') : !!f.name.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i);
      const mediaType = f.type || (isImg ? 'image/png' : 'video/mp4');

      let filePath = '';
      if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
        try { filePath = window.electronAPI.getPathForFile(f); } catch (e) {}
      }
      if (!filePath && f.path) {
        filePath = f.path;
      }

      const id = "media-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
      let mediaUrl = filePath ? ('file:///' + filePath.replace(/\\/g, '/')) : URL.createObjectURL(f);

      // Si estamos en modo navegador web puro (sin filePath), persistir en IndexedDB
      if (!filePath && (f instanceof Blob || f instanceof File)) {
        await MediaCache.saveBlob(id, f, f.name, mediaType);
      }

      // Generar miniatura inmediatamente en segundo plano
      let thumb = null;
      try {
        thumb = await MediaCache.generateThumbnail(f, mediaType);
        if (thumb) {
          await MediaCache.saveThumbnail(id, thumb);
        }
      } catch (err) {
        console.warn('Error generando miniatura:', err);
      }

      return {
        id,
        name: f.name,
        url: mediaUrl,
        filePath,
        type: mediaType,
        folder: targetFolder,
        thumbnail: thumb || ''
      };
    }));

    return processedItems;
  }

  async handleLoadedVideoFiles(files) {
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;
    const targetFolder = this.selectedMediaFolder && this.selectedMediaFolder !== 'all' ? this.selectedMediaFolder : 'General';
    const batchItems = await this.processMediaFiles(fileList, targetFolder);
    store.addMediaBatch(batchItems);
  }

  showContextMenu(e, target) {
    e.preventDefault();
    e.stopPropagation();
    this.contextTarget = target;

    const titleEl = document.getElementById('ctx-header-title');
    const primaryEl = document.getElementById('ctx-action-primary');
    const primaryLabel = document.getElementById('ctx-action-primary-label');
    const secondaryEl = document.getElementById('ctx-action-secondary');
    const secondaryLabel = document.getElementById('ctx-action-secondary-label');
    const duplicateEl = document.getElementById('ctx-action-duplicate');
    const duplicateLabel = document.getElementById('ctx-action-duplicate-label');
    const deleteLabel = document.getElementById('ctx-item-label');

    if (titleEl) titleEl.textContent = target.name || 'Componente';
    if (deleteLabel) deleteLabel.textContent = `Eliminar ${target.name || ''}`;

    // Reset default visibility
    if (primaryEl) primaryEl.style.display = 'flex';
    if (secondaryEl) secondaryEl.style.display = 'flex';
    if (duplicateEl) duplicateEl.style.display = 'flex';
    if (duplicateLabel) duplicateLabel.textContent = '📋 Duplicar Elemento';

    if (target.type === 'project-item') {
      if (primaryLabel) primaryLabel.textContent = '▶️ Proyectar / Activar';
      if (secondaryLabel) secondaryLabel.textContent = '✏️ Editar Contenido';
      if (duplicateLabel) duplicateLabel.textContent = '➖ Quitar del Proyecto';
      if (duplicateEl) duplicateEl.style.display = 'flex';
      if (deleteLabel) deleteLabel.textContent = `Eliminar de Biblioteca (${target.name || ''})`;
    } else if (target.type === 'deck') {
      const isInProject = store.projectDeckIds.includes(target.id);
      if (primaryLabel) primaryLabel.textContent = '▶️ Proyectar / Activar';
      if (secondaryLabel) secondaryLabel.textContent = '✏️ Editar Contenido';
      if (duplicateLabel) duplicateLabel.textContent = isInProject ? '➖ Quitar del Proyecto' : '➕ Agregar al Proyecto';
      if (duplicateEl) duplicateEl.style.display = 'flex';
      if (deleteLabel) deleteLabel.textContent = `Eliminar de Biblioteca (${target.name || ''})`;
    } else if (target.type === 'media') {
      if (primaryLabel) primaryLabel.textContent = '🎬 Transmitir en Vivo';
      if (secondaryLabel) secondaryLabel.textContent = '📁 Cambiar Carpeta';
      if (duplicateEl) duplicateEl.style.display = 'none';
    } else if (target.type === 'bible') {
      if (primaryLabel) primaryLabel.textContent = '📖 Activar Biblia';
      if (secondaryLabel) secondaryLabel.style.display = 'none';
      if (duplicateEl) duplicateEl.style.display = 'none';
    } else if (target.type === 'slide') {
      if (primaryLabel) primaryLabel.textContent = '▶️ Proyectar Filmina';
      if (secondaryLabel) secondaryLabel.textContent = '✏️ Editar Diapositiva';
      if (duplicateLabel) duplicateLabel.textContent = '📋 Duplicar Diapositiva';
      if (duplicateEl) duplicateEl.style.display = 'flex';
      if (deleteLabel) deleteLabel.textContent = `Eliminar ${target.name || 'Diapositiva'}`;
    } else if (target.type === 'event') {
      if (primaryLabel) primaryLabel.textContent = '📢 Proyectar Anuncio';
      if (secondaryEl) secondaryEl.style.display = 'none';
      if (duplicateEl) duplicateEl.style.display = 'none';
    }

    const sectionEl = document.getElementById('ctx-action-section');
    if (sectionEl) sectionEl.style.display = target.type === 'slide' ? 'flex' : 'none';

    const menu = document.getElementById('custom-context-menu');
    if (!menu) return;

    menu.style.display = 'block';

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const menuWidth = menu.offsetWidth || 190;
    const menuHeight = menu.offsetHeight || 150;

    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuWidth > winWidth) posX = winWidth - menuWidth - 10;
    if (posY + menuHeight > winHeight) posY = winHeight - menuHeight - 10;

    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';
  }

  bindContextMenuEvents() {
    document.addEventListener('click', () => this.hideContextMenu());
    document.addEventListener('scroll', () => this.hideContextMenu(), true);

    document.getElementById('ctx-action-primary')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = this.contextTarget;
      this.hideContextMenu();
      if (!target) return;

      if (target.type === 'deck' || target.type === 'project-item') {
        store.setActiveDeck(target.id);
      } else if (target.type === 'media') {
        store.setActiveVideo(target.url, target.name);
      } else if (target.type === 'bible') {
        this.selectedBibleVersion = target.id;
        this.renderScriptureSubSidebar();
        this.renderScripture3ColView();
      } else if (target.type === 'slide') {
        store.setLiveSlide(target.groupIndex, target.slideIndex);
      } else if (target.type === 'event' && target.eventObj) {
        calendarManager.projectEventAnnouncement(target.eventObj);
      }
    });

    document.getElementById('ctx-action-secondary')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = this.contextTarget;
      this.hideContextMenu();
      if (!target) return;

      if (target.type === 'deck' || target.type === 'project-item') {
        const deck = store.decks.find(d => d.id === target.id);
        if (deck) {
          if (this.inputShowTitle) this.inputShowTitle.value = deck.title;
          if (this.inputShowCategory) this.inputShowCategory.value = deck.category || 'Alabanza';
          const fullText = deck.groups.map(g => `${g.name}:\n` + g.slides.map(s => s.text).join('\n')).join('\n\n');
          if (this.inputShowText) this.inputShowText.value = fullText;
          if (this.modalCreateShow) this.modalCreateShow.classList.add('open');
        }
      } else if (target.type === 'media') {
        document.getElementById('btn-open-media-modal')?.click();
      } else if (target.type === 'slide') {
        this.openEditSlideModal(target);
      }
    });

    document.getElementById('ctx-action-duplicate')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = this.contextTarget;
      this.hideContextMenu();
      if (!target) return;
      if (target.type === 'project-item') {
        store.removeFromProject(target.id);
      } else if (target.type === 'deck') {
        if (store.projectDeckIds.includes(target.id)) {
          store.removeFromProject(target.id);
        } else {
          store.addToProject(target.id);
        }
      } else if (target.type === 'slide') {
        store.duplicateSlide(target.deckId, target.groupIndex, target.slideIndex);
      }
    });

    document.getElementById('ctx-item-delete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.contextTarget) {
        this.executeDeleteTarget(this.contextTarget);
      }
    });

    document.getElementById('ctx-action-section')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = this.contextTarget;
      this.hideContextMenu();
      if (!target || target.type !== 'slide') return;
      const activeDeck = store.decks.find(d => d.id === target.deckId) || store.activeDeck;
      const groupObj = activeDeck?.groups[target.groupIndex];
      this.openSectionPickerModal({
        deckId: target.deckId,
        groupIndex: target.groupIndex,
        slideIndex: target.slideIndex,
        currentName: groupObj?.name || 'Sección',
        currentBadge: groupObj?.badge || 'badge-verse',
        canSplit: (groupObj?.slides?.length || 0) > 1 && target.slideIndex > 0
      });
    });
  }

  openEditSlideModal(target) {
    if (!target) return;
    this.pendingEditSlideTarget = target;
    const modal = document.getElementById('modal-edit-slide');
    const lblTarget = document.getElementById('lbl-edit-slide-target');
    const inputArea = document.getElementById('input-edit-slide-text');
    const inputSec = document.getElementById('input-edit-slide-section');

    if (lblTarget) lblTarget.textContent = target.name || 'Diapositiva';
    if (inputArea) inputArea.value = (target.text || '').replace(/<br\s*\/?>/gi, '\n');

    if (inputSec) {
      const activeDeck = store.decks.find(d => d.id === target.deckId) || store.activeDeck;
      const group = activeDeck?.groups[target.groupIndex];
      if (group) {
        const matchingOpt = Array.from(inputSec.options).find(opt => opt.value.startsWith(group.badge) || opt.value.endsWith(`|${group.name}`));
        if (matchingOpt) {
          inputSec.value = matchingOpt.value;
        } else {
          inputSec.value = "badge-verse|Verso";
        }
      }
    }

    const radioBase = document.querySelector('input[name="edit-slide-scope"][value="base"]');
    if (radioBase) radioBase.checked = true;

    if (modal) modal.classList.add('open');
  }

  openSectionPickerModal(target) {
    if (!target) return;
    this.pendingSectionPickerTarget = target;

    if (this.lblSectionPickerTarget) {
      this.lblSectionPickerTarget.textContent = `Filmina #${target.slideIndex + 1} • Sección actual: "${target.currentName || 'Estrofa'}"`;
    }

    if (this.inputCustomSectionName) {
      this.inputCustomSectionName.value = target.currentName || '';
    }

    if (this.wrapperSectionSplitAction) {
      this.wrapperSectionSplitAction.style.display = target.canSplit ? 'block' : 'none';
    }

    if (this.modalSectionPicker) {
      this.modalSectionPicker.classList.add('open');
    }
  }

  closeSectionPickerModal() {
    if (this.modalSectionPicker) {
      this.modalSectionPicker.classList.remove('open');
    }
    this.pendingSectionPickerTarget = null;
  }

  navigateToSection(groupIndex, focusOnly = false) {
    const activeDeck = store.activeDeck;
    if (!activeDeck || !activeDeck.groups[groupIndex]) return;

    const targetCard = this.slideGroupsWrapper?.querySelector(`.slide-card[data-gidx="${groupIndex}"][data-sidx="0"]`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      targetCard.classList.remove('section-target-highlight');
      void targetCard.offsetWidth; // trigger reflow
      targetCard.classList.add('section-target-highlight');
      setTimeout(() => targetCard.classList.remove('section-target-highlight'), 1200);
    }

    if (!focusOnly) {
      store.setLiveSlide(groupIndex, 0);
    }
  }

  closeAllModals() {
    this.hideContextMenu();
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('open');
    });
  }

  initModalBackdropListeners() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });
  }

  hideContextMenu() {
    const menu = document.getElementById('custom-context-menu');
    if (menu) menu.style.display = 'none';
    this.contextTarget = null;
  }

  executeDeleteTarget(target) {
    if (!target) return;
    this.hideContextMenu();

    if (target.type === 'slide') {
      if (confirm(`¿Estás seguro de que deseas eliminar la diapositiva "${target.name}"?`)) {
        store.deleteSlide(target.deckId, target.groupIndex, target.slideIndex);
        this.contextTarget = null;
      }
    } else if (target.type === 'deck' || target.type === 'project-item') {
      if (confirm(`¿Estás seguro de que deseas eliminar la canción/lectura "${target.name}" permanentemente de la biblioteca base?`)) {
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
      // Ignore keybindings if user is typing in input or editor or modal, but allow Escape to close modal
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.code === 'Escape' || e.key === 'Escape') {
          e.preventDefault();
          this.closeAllModals();
        }
        return;
      }

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
      } else if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        store.toggleMediaAudio();
        this.updateOperatorAudioMute();
      } else if (e.code === 'Escape' || e.key === 'Escape') {
        e.preventDefault();
        const openModal = document.querySelector('.modal-overlay.open');
        if (openModal) {
          this.closeAllModals();
        } else {
          store.clearAll();
        }
      }

    });
  }

  initDockResizer() {
    const resizer = document.getElementById('bottom-dock-resizer');
    const appEl = document.getElementById('app');
    if (!resizer || !appEl) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = Math.floor(window.innerHeight * 0.3);

    const onMouseDown = (e) => {
      isDragging = true;
      startY = e.clientY;

      const currentVarVal = getComputedStyle(appEl).getPropertyValue('--bottom-dock-height');
      startHeight = parseInt(currentVarVal) || Math.floor(window.innerHeight * 0.3);

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

    const showsCacheKey = JSON.stringify(filteredDecks.map(d => d.id + d.title + d.category)) + '|' + this.searchQuery + '|' + this.activeFilter;

    if (this.lastShowsCacheKey !== showsCacheKey) {
      this.lastShowsCacheKey = showsCacheKey;

      if (filteredDecks.length === 0) {
        this.showsGridEl.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.78rem;">
            No se encontraron resultados para "${this.searchQuery}".
          </div>
        `;
      } else {
        this.showsGridEl.innerHTML = filteredDecks.map(deck => {
          const isActive = deck.id === store.activeDeckId;
          const isInProject = store.projectDeckIds.includes(deck.id);
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
                <div style="display: flex; gap: 4px; align-items: center;">
                  <button class="btn-toggle-project-show ${isInProject ? 'in-project' : ''}" data-project-id="${deck.id}" title="${isInProject ? 'Quitar del proyecto' : 'Agregar al proyecto'}">
                    ${isInProject ? '✓ Proyecto' : '+ Proyecto'}
                  </button>
                  <button class="btn-delete-show" data-delete-id="${deck.id}" title="Eliminar de la biblioteca base">&times;</button>
                </div>
              </div>
            </div>
          `;
        }).join('');

        this.showsGridEl.querySelectorAll('.show-dock-card').forEach(card => {
          const id = card.getAttribute('data-deck-id');
          const deckObj = decks.find(d => d.id === id);
          card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete-show') || e.target.classList.contains('btn-toggle-project-show')) return;
            store.setActiveDeck(id);
          });
          card.addEventListener('contextmenu', (e) => {
            if (deckObj) this.showContextMenu(e, { type: 'deck', id: deckObj.id, name: deckObj.title });
          });
        });

        this.showsGridEl.querySelectorAll('.btn-toggle-project-show').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-project-id');
            if (store.projectDeckIds.includes(id)) {
              store.removeFromProject(id);
            } else {
              store.addToProject(id);
            }
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
    }

    // Fast CSS active class toggle without DOM destruction
    this.showsGridEl.querySelectorAll('.show-dock-card').forEach(card => {
      const id = card.getAttribute('data-deck-id');
      card.classList.toggle('active-dock-show', id === store.activeDeckId);
    });
  }

  renderMediaDock(state) {
    if (!this.mediaGridEl || !this.mediaFoldersListEl) return;

    // 1. Render Virtual Folders list in Sub-sidebar (Memoized)
    const folders = state.mediaFolders || ["General"];
    const allCount = state.mediaLibrary.length;
    const folderCacheKey = JSON.stringify(folders) + '|' + allCount + '|' + this.selectedMediaFolder;

    if (this.lastFolderCacheKey !== folderCacheKey) {
      this.lastFolderCacheKey = folderCacheKey;
      this.mediaFoldersListEl.innerHTML = `
        <div class="folder-item ${this.selectedMediaFolder === 'all' ? 'active' : ''}" data-folder-name="all">
          <span>📁 Todos los Medios</span>
          <span class="count">${allCount}</span>
        </div>
        ${folders.map(folder => {
          const count = state.mediaLibrary.filter(m => m.folder === folder).length;
          const isActive = this.selectedMediaFolder === folder;
          const isGeneral = folder === 'General';
          return `
            <div class="folder-item ${isActive ? 'active' : ''}" data-folder-name="${folder}">
              <span>📁 ${folder}</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="count">${count}</span>
                ${!isGeneral ? `<button class="btn-delete-folder" data-folder="${folder}" title="Eliminar carpeta" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; font-size: 0.8rem; opacity: 0.6; transition: opacity 0.2s;">🗑️</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      `;

      this.mediaFoldersListEl.querySelectorAll('.folder-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-folder')) return;
          this.selectedMediaFolder = item.getAttribute('data-folder-name');
          this.renderMediaDock(state);
        });
      });

      this.mediaFoldersListEl.querySelectorAll('.btn-delete-folder').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const folderToDelete = btn.getAttribute('data-folder');
          if (confirm(`¿Estás seguro de eliminar la carpeta virtual "${folderToDelete}"? Los medios asignados pasarán a la carpeta General.`)) {
            if (this.selectedMediaFolder === folderToDelete) {
              this.selectedMediaFolder = 'all';
            }
            store.deleteMediaFolder(folderToDelete);
          }
        });
      });
    }

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

    const mediaGridCacheKey = JSON.stringify(filteredMedia.map(m => m.id + m.name + m.url + m.folder + (m.thumbnail ? 'thumb' : 'none'))) + '|' + this.selectedMediaFolder + '|' + this.searchQuery;

    if (this.lastMediaGridCacheKey !== mediaGridCacheKey) {
      this.lastMediaGridCacheKey = mediaGridCacheKey;

      if (this.mediaIntersectionObserver) {
        this.mediaIntersectionObserver.disconnect();
      }

      if (filteredMedia.length === 0) {
        this.mediaGridEl.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.78rem;">
            No hay videos o imágenes en la carpeta "${this.selectedMediaFolder === 'all' ? 'Todas' : this.selectedMediaFolder}".
          </div>
        `;
      } else {
        this.mediaGridEl.innerHTML = filteredMedia.map(item => {
          const isActive = state.activeVideoUrl === item.url && !state.isMediaCleared;
          const isImg = (item.type && item.type.startsWith('image/')) || (item.url && item.url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i));
          
          const thumbSrc = item.thumbnail || (isImg ? item.url : '');
          const mediaTag = thumbSrc
            ? `<img class="video-card-thumb" src="${thumbSrc}" alt="${item.name}" loading="lazy" />`
            : (isImg 
                ? `<img class="video-card-thumb" data-src="${item.url}" alt="${item.name}" />`
                : `<video data-src="${item.url}" muted preload="metadata" playsinline></video>`);

          const typeBadge = isImg 
            ? `<span class="video-card-type-badge img-badge">🖼️ IMG</span>`
            : `<span class="video-card-type-badge vid-badge">🎬 VIDEO</span>`;

          return `
            <div class="video-card ${isActive ? 'active-video' : ''}" data-video-url="${item.url}" data-video-name="${item.name}" data-video-type="${item.type || ''}">
              <div class="video-card-top-bar">
                <span class="video-folder-tag">${item.folder || 'General'}</span>
                ${typeBadge}
                <button class="btn-delete-media" data-media-id="${item.id}" title="Eliminar este elemento">&times;</button>
              </div>
              ${mediaTag}
              <div class="video-card-overlay">
                <div class="video-card-title" title="${item.name}">${item.name}</div>
              </div>
            </div>
          `;
        }).join('');

        // Disparar generación o recuperación de miniaturas en segundo plano para items sin miniatura
        filteredMedia.forEach(item => {
          if (!item.thumbnail && item.url) {
            MediaCache.getThumbnail(item.id).then(cached => {
              if (cached) {
                store.updateMediaItemThumbnail(item.id, cached);
              } else {
                MediaCache.generateThumbnail(item.url, item.type).then(newThumb => {
                  if (newThumb) {
                    MediaCache.saveThumbnail(item.id, newThumb);
                    store.updateMediaItemThumbnail(item.id, newThumb);
                  }
                }).catch(() => {});
              }
            }).catch(() => {});
          }
        });

        // Setup IntersectionObserver for Lazy Media Loading in Grid
        this.mediaIntersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            const img = entry.target.querySelector('img');
            if (entry.isIntersecting) {
              if (video && !video.src && video.dataset.src) {
                video.src = video.dataset.src;
                video.preload = "metadata";
              }
              if (img && !img.src && img.dataset.src) {
                img.src = img.dataset.src;
              }
            } else {
              if (video && !video.paused) {
                video.pause();
              }
            }
          });
        }, { root: this.mediaGridEl.parentElement, rootMargin: '150px' });

        // Bind media click, delete click, mouseenter/mouseleave hover play
        this.mediaGridEl.querySelectorAll('.video-card').forEach(card => {
          const video = card.querySelector('video');
          this.mediaIntersectionObserver.observe(card);

          if (video) {
            card.addEventListener('mouseenter', () => {
              if (video.src) {
                video.play().catch(() => {});
              }
            });
            card.addEventListener('mouseleave', () => {
              video.pause();
              try { video.currentTime = 0; } catch(e){}
            });
          }

          const mediaId = card.querySelector('.btn-delete-media')?.getAttribute('data-media-id');
          const mediaItem = state.mediaLibrary.find(m => m.id === mediaId);
          card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete-media')) return;
            const url = card.getAttribute('data-video-url');
            const name = card.getAttribute('data-video-name');
            const type = card.getAttribute('data-video-type') || (mediaItem ? mediaItem.type : '');
            store.setActiveVideo(url, name, type);
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
    }

    // 3. Fast CSS active class update without DOM destruction
    this.mediaGridEl.querySelectorAll('.video-card').forEach(card => {
      const url = card.getAttribute('data-video-url');
      const isActive = state.activeVideoUrl === url && !state.isMediaCleared;
      card.classList.toggle('active-video', isActive);
    });
  }

  renderTemplatesSidebar(state) {
    const sidebarEl = document.getElementById('template-list-sidebar');
    if (!sidebarEl) return;

    const templates = store.templates || [];
    const tplCacheKey = JSON.stringify(templates.map(t => t.id + t.name)) + '|' + store.activeTemplateId;
    if (this.lastTemplatesCacheKey === tplCacheKey) return;
    this.lastTemplatesCacheKey = tplCacheKey;
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

  getCurrentTemplateFormObject() {
    const name = document.getElementById('input-tpl-name')?.value.trim() || 'Plantilla Personalizada';
    const font = document.getElementById('select-tpl-font')?.value || 'Inter, sans-serif';
    const size = parseInt(document.getElementById('input-tpl-size')?.value || 52);
    const kerning = parseFloat(document.getElementById('input-tpl-kerning')?.value || 0);
    const leading = parseFloat(document.getElementById('input-tpl-leading')?.value || 1.25);
    const color = document.getElementById('input-tpl-color')?.value || '#ffffff';
    const align = document.getElementById('select-tpl-align')?.value || 'center';
    const maxlines = parseInt(document.getElementById('select-tpl-maxlines')?.value || 0);
    const posy = parseInt(document.getElementById('input-tpl-posy')?.value || 50);
    const bgHex = document.getElementById('input-tpl-bgcolor-hex')?.value || '#000000';
    const bgOpacity = parseFloat(document.getElementById('input-tpl-bgopacity')?.value || 0.4);
    const padding = parseInt(document.getElementById('input-tpl-padding')?.value || 20);
    const radius = parseInt(document.getElementById('input-tpl-radius')?.value || 8);
    const bgImage = document.getElementById('input-tpl-bgimage')?.value.trim() || "";

    const r = parseInt(bgHex.slice(1, 3), 16) || 0;
    const g = parseInt(bgHex.slice(3, 5), 16) || 0;
    const b = parseInt(bgHex.slice(5, 7), 16) || 0;
    const rgbaBg = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;

    return {
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
    if (posyEl) posyEl.value = tpl.posY !== undefined ? tpl.posY : 50;
    if (valPosyEl) valPosyEl.textContent = (tpl.posY !== undefined ? tpl.posY : 50) + "%";

    // Extraer Hex y Opacidad desde rgba si existe
    let hexBg = "#000000";
    let alphaBg = 0.4;
    if (tpl.bgColor) {
      const rgbaMatch = tpl.bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
        hexBg = `#${r}${g}${b}`;
        alphaBg = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
      }
    }

    if (bgHexEl) bgHexEl.value = hexBg;
    if (bgOpacityEl) bgOpacityEl.value = alphaBg;
    if (valOpacityEl) valOpacityEl.textContent = Math.round(alphaBg * 100) + "%";
    
    if (paddingEl) paddingEl.value = tpl.padding !== undefined ? tpl.padding : 20;
    if (valPaddingEl) valPaddingEl.textContent = (tpl.padding !== undefined ? tpl.padding : 20) + "px";
    if (radiusEl) radiusEl.value = tpl.borderRadius !== undefined ? tpl.borderRadius : 8;
    if (valRadiusEl) valRadiusEl.textContent = (tpl.borderRadius !== undefined ? tpl.borderRadius : 8) + "px";
    if (bgImageEl) bgImageEl.value = tpl.bgImageUrl || "";

    this.updateTemplateLivePreview();
  }

  updateTemplateLivePreview() {
    const textPreview = document.getElementById('template-preview-text');
    const textWrapper = document.getElementById('template-preview-text-wrapper');
    if (!textPreview || !textWrapper) return;

    const tpl = this.getCurrentTemplateFormObject();

    textWrapper.style.top = tpl.posY + '%';
    
    textPreview.style.fontFamily = tpl.fontFamily;
    textPreview.style.fontSize = Math.round(tpl.fontSize * 0.45) + 'px';
    textPreview.style.letterSpacing = tpl.letterSpacing + 'px';
    textPreview.style.lineHeight = tpl.lineHeight;
    textPreview.style.color = tpl.color;
    textPreview.style.textAlign = tpl.textAlign;
    textPreview.style.backgroundColor = tpl.bgColor;
    textPreview.style.padding = Math.round(tpl.padding * 0.5) + 'px';
    textPreview.style.borderRadius = Math.round(tpl.borderRadius * 0.5) + 'px';

    if (tpl.maxLines > 0) {
      textPreview.style.display = '-webkit-box';
      textPreview.style['-webkit-line-clamp'] = tpl.maxLines;
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
      const handleInput = () => {
        if (id === 'input-tpl-size') document.getElementById('val-tpl-size').textContent = el.value + 'px';
        if (id === 'input-tpl-kerning') document.getElementById('val-tpl-kerning').textContent = el.value + 'px';
        if (id === 'input-tpl-leading') document.getElementById('val-tpl-leading').textContent = el.value;
        if (id === 'input-tpl-posy') document.getElementById('val-tpl-posy').textContent = el.value + '%';
        if (id === 'input-tpl-bgopacity') document.getElementById('val-tpl-bgopacity').textContent = Math.round(el.value * 100) + '%';
        if (id === 'input-tpl-padding') document.getElementById('val-tpl-padding').textContent = el.value + 'px';
        if (id === 'input-tpl-radius') document.getElementById('val-tpl-radius').textContent = el.value + 'px';

        this.updateTemplateLivePreview();

        // INSTANT REAL-TIME UPDATE TO ACTIVE SLIDE & AUDIENCE DISPLAY
        const updatedTpl = this.getCurrentTemplateFormObject();
        store.updateActiveTemplateProperties(updatedTpl);
      };

      el?.addEventListener('input', handleInput);
      el?.addEventListener('change', handleInput);
    });

    const applyCurrentTemplate = () => {
      const tplObj = this.getCurrentTemplateFormObject();
      store.saveTemplate(tplObj);
      const activeDeck = store.activeDeck;
      if (activeDeck) {
        activeDeck.templateId = tplObj.id;
      }
      this.renderTemplatesSidebar(store.state);
    };

    document.getElementById('btn-save-tpl')?.addEventListener('click', applyCurrentTemplate);

    // Modal Create Template
    const openModalTemplate = () => {
      this.closeAllModals();
      if (this.inputTemplateName) this.inputTemplateName.value = "";
      if (this.modalCreateTemplate) {
        this.modalCreateTemplate.classList.add('open');
        this.inputTemplateName?.focus();
      }
    };

    const closeModalTemplate = () => {
      if (this.modalCreateTemplate) {
        this.modalCreateTemplate.classList.remove('open');
      }
    };

    const saveNewTemplate = () => {
      const tplName = this.inputTemplateName ? this.inputTemplateName.value.trim() : "";
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
        closeModalTemplate();
      } else {
        alert("Por favor ingresa un nombre para la plantilla.");
      }
    };

    document.getElementById('btn-create-template')?.addEventListener('click', openModalTemplate);
    this.btnCloseCreateTemplateModal?.addEventListener('click', closeModalTemplate);
    this.btnCancelCreateTemplate?.addEventListener('click', closeModalTemplate);
    this.btnSaveTemplateConfirm?.addEventListener('click', saveNewTemplate);
    this.inputTemplateName?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveNewTemplate();
      }
    });
  }

  renderScriptureSubSidebar() {
    const listEl = document.getElementById('scripture-bibles-list');
    if (!listEl) return;

    const versions = getAllBibleVersions();
    const verCacheKey = JSON.stringify(versions.map(v => v.id + v.name)) + '|' + this.selectedBibleVersion;
    if (this.lastBibleSidebarCacheKey === verCacheKey) return;
    this.lastBibleSidebarCacheKey = verCacheKey;

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

    const scriptureCacheKey = `${this.selectedBookId}|${this.selectedChapter}|${this.selectedBibleVersion}|${this.scriptureQuery}`;
    if (this.lastScriptureCacheKey === scriptureCacheKey) return;
    this.lastScriptureCacheKey = scriptureCacheKey;

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

  bindCalendarEvents() {
    const modalEvt = document.getElementById('modal-create-event');
    const inputTitle = document.getElementById('input-event-title');
    const inputDate = document.getElementById('input-event-date');
    const inputTime = document.getElementById('input-event-time');
    const selectCat = document.getElementById('input-event-category');
    const inputNotes = document.getElementById('input-event-notes');

    const openModalEvt = () => {
      this.closeAllModals();
      if (modalEvt) {
        modalEvt.classList.add('open');
        const todayStr = new Date().toISOString().split('T')[0];
        if (inputDate && !inputDate.value) inputDate.value = todayStr;
        if (inputTime && !inputTime.value) inputTime.value = "19:00";
        inputTitle?.focus();
      }
    };

    const closeModalEvt = () => {
      if (modalEvt) {
        modalEvt.classList.remove('open');
        if (inputTitle) inputTitle.value = "";
        if (inputNotes) inputNotes.value = "";
      }
    };

    document.getElementById('btn-open-create-event-modal')?.addEventListener('click', openModalEvt);
    document.getElementById('btn-create-event-dock')?.addEventListener('click', openModalEvt);
    document.getElementById('btn-close-event-modal')?.addEventListener('click', closeModalEvt);
    document.getElementById('btn-cancel-event')?.addEventListener('click', closeModalEvt);

    document.getElementById('btn-save-event')?.addEventListener('click', () => {
      const title = inputTitle?.value.trim();
      const date = inputDate?.value;
      const time = inputTime?.value;
      const category = selectCat?.value;
      const notes = inputNotes?.value.trim();

      if (!title) {
        alert("Por favor ingresa un título para el evento.");
        return;
      }

      calendarManager.addEvent(title, date, time, category, notes);
      closeModalEvt();
    });

    document.getElementById('btn-cal-prev-month')?.addEventListener('click', () => calendarManager.changeMonth(-1));
    document.getElementById('btn-cal-next-month')?.addEventListener('click', () => calendarManager.changeMonth(1));
    document.getElementById('btn-cal-today')?.addEventListener('click', () => calendarManager.setToday());

    document.querySelectorAll('#calendar-categories-list .filter-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('#calendar-categories-list .filter-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const filterVal = item.getAttribute('data-cal-filter');
        calendarManager.setFilter(filterVal);
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
      this.closeAllModals();
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

    if (selMaxLines && document.activeElement !== selMaxLines && selMaxLines.value !== String(store.state.scriptureMaxLines)) {
      selMaxLines.value = String(store.state.scriptureMaxLines);
    }
    if (selFont && document.activeElement !== selFont && selFont.value !== store.state.scriptureFont) {
      selFont.value = store.state.scriptureFont;
    }
    if (selSplit && document.activeElement !== selSplit && selSplit.value !== String(store.state.scriptureSplitLong)) {
      selSplit.value = String(store.state.scriptureSplitLong);
    }
    if (chkShowRef && document.activeElement !== chkShowRef && chkShowRef.checked !== store.state.scriptureShowRef) {
      chkShowRef.checked = store.state.scriptureShowRef;
    }
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
    // 1. Sidebar Project Decks
    const projectDecks = store.projectDecks;
    const projectBadge = document.querySelector('.project-count-badge');
    if (projectBadge) projectBadge.textContent = projectDecks.length;

    this.deckListEl.innerHTML = projectDecks.map(deck => `
      <div class="deck-item ${deck.id === store.activeDeckId ? 'active' : ''}" data-deck-id="${deck.id}">
        <span class="deck-item-title" style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${deck.title}</span>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span class="deck-item-tag">${deck.category || deck.type}</span>
          <button class="btn-remove-project-item" data-remove-id="${deck.id}" title="Quitar del proyecto (mantener en biblioteca)">&times;</button>
        </div>
      </div>
    `).join('');

    this.deckListEl.querySelectorAll('.deck-item').forEach(el => {
      const id = el.getAttribute('data-deck-id');
      const deckObj = decks.find(d => d.id === id);
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-project-item')) return;
        store.setActiveDeck(id);
      });
      el.addEventListener('contextmenu', (e) => {
        if (deckObj) this.showContextMenu(e, { type: 'project-item', id: deckObj.id, name: deckObj.title });
      });
    });

    this.deckListEl.querySelectorAll('.btn-remove-project-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-remove-id');
        store.removeFromProject(id);
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

    // 3. Active Deck, Sections Navigation Bar & Slide Cards
    const activeDeck = store.activeDeck;
    if (activeDeck) {
      this.activeDeckTitle.textContent = activeDeck.title;
      this.activeDeckCategory.textContent = `${activeDeck.category || activeDeck.type} • ${activeDeck.groups.length} Secciones`;

      // Render Deck Sections Quick Navigation Bar
      const sectionsNavEl = document.getElementById('deck-sections-nav');
      if (sectionsNavEl) {
        if (!activeDeck.groups || activeDeck.groups.length === 0) {
          sectionsNavEl.innerHTML = `<span class="section-nav-empty">Sin secciones definidas en esta canción</span>`;
        } else {
          const liveGIdx = state.liveGroupIndex;
          const sectionButtonsHTML = activeDeck.groups.map((group, gIdx) => {
            const isGroupLive = liveGIdx === gIdx && !state.isTextCleared;
            const badgeClass = group.badge || 'badge-verse';
            const slideCount = group.slides?.length || 1;

            let icon = '📖';
            if (badgeClass.includes('intro')) icon = '🎵';
            else if (badgeClass.includes('prechorus')) icon = '⚡';
            else if (badgeClass.includes('chorus')) icon = '🔥';
            else if (badgeClass.includes('bridge')) icon = '🌉';
            else if (badgeClass.includes('instrumental')) icon = '🎸';
            else if (badgeClass.includes('outro')) icon = '🏁';
            else if (badgeClass.includes('sermon')) icon = '💬';

            return `
              <button type="button" class="btn-section-nav ${badgeClass} ${isGroupLive ? 'active-live-section' : ''}" data-gidx="${gIdx}" title="Saltar a ${group.name} (${slideCount} filminas)">
                <span class="section-icon">${icon}</span>
                <span class="section-title">${group.name}</span>
                <span class="section-count">${slideCount}</span>
                ${isGroupLive ? '<span class="section-live-dot" title="En Vivo">●</span>' : ''}
              </button>
            `;
          }).join('');

          sectionsNavEl.innerHTML = `
            <span class="section-nav-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
              SECCIONES:
            </span>
            <div class="section-nav-buttons-track">
              ${sectionButtonsHTML}
            </div>
          `;

          sectionsNavEl.querySelectorAll('.btn-section-nav').forEach(btn => {
            btn.addEventListener('click', () => {
              const gIdx = parseInt(btn.getAttribute('data-gidx'));
              this.navigateToSection(gIdx);
            });
          });
        }
      }

      let globalIndex = 1;
      const allCardsHTML = activeDeck.groups.flatMap((group, gIdx) => {
        return group.slides.map((slide, sIdx) => {
          const isLive = state.liveSlideId === slide.id && !state.isTextCleared;
          const cardIdx = globalIndex++;
          const tpl = state.activeTemplate || {};

          const posY = tpl.posY !== undefined ? tpl.posY : 50;
          const textAlign = tpl.textAlign || 'center';
          const baseFontSize = tpl.fontSize || 52;
          const baseLetterSpacing = tpl.letterSpacing || 0;
          const basePadding = tpl.padding || 16;
          const baseRadius = tpl.borderRadius || 6;
          const maxLines = tpl.maxLines || 0;

          const tplStyles = [
            `font-family: ${tpl.fontFamily || 'Inter, sans-serif'}`,
            `font-size: calc(${baseFontSize} * 0.0521cqw)`,
            `font-weight: 700`,
            `letter-spacing: calc(${baseLetterSpacing} * 0.0521cqw)`,
            `line-height: ${tpl.lineHeight || 1.25}`,
            `color: ${tpl.color || '#ffffff'}`,
            `text-align: ${textAlign}`,
            `text-shadow: ${tpl.textShadow || '0 0.3cqw 1cqw rgba(0,0,0,0.9)'}`,
            `background-color: ${tpl.bgColor || 'transparent'}`,
            `padding: calc(${basePadding} * 0.025cqw) calc(${basePadding} * 0.045cqw)`,
            `border-radius: calc(${baseRadius} * 0.04cqw)`,
            `box-sizing: border-box`,
            `white-space: pre-wrap`,
            `word-break: normal`,
            `overflow-wrap: normal`,
            maxLines > 0 ? `display: -webkit-box; -webkit-line-clamp: ${maxLines}; -webkit-box-orient: vertical; overflow: hidden;` : 'display: inline-block;'
          ].join('; ');

          const activeMediaUrl = (!state.isMediaCleared && state.activeVideoUrl) ? state.activeVideoUrl : '';
          const isImg = (state.activeVideoType && state.activeVideoType.startsWith('image/')) || (state.activeVideoIsImage && !state.activeVideoType?.startsWith('video/')) || (activeMediaUrl && !activeMediaUrl.startsWith('blob:') && !!activeMediaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i));
          
          let cardBgHTML = '';
          if (activeMediaUrl) {
            if (isImg) {
              cardBgHTML = `<img src="${activeMediaUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55; z-index: 0; pointer-events: none;" />`;
            } else {
              cardBgHTML = `<video src="${activeMediaUrl}" muted preload="metadata" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55; z-index: 0; pointer-events: none;"></video>`;
            }
          } else {
            cardBgHTML = `<div style="position: absolute; inset: 0; background: radial-gradient(circle at center, #1e293b 0%, #090d16 100%); z-index: 0; pointer-events: none;"></div>`;
          }

          return `
            <div class="slide-card ${isLive ? 'active-live' : ''}" data-gidx="${gIdx}" data-sidx="${sIdx}">
              ${cardBgHTML}
              <span class="slide-card-index">${cardIdx}</span>
              <span class="slide-card-live-badge">EN VIVO</span>
              <div class="slide-card-text-wrapper" style="position: absolute; left: 5%; right: 5%; top: ${posY}%; transform: translateY(-50%); text-align: ${textAlign}; pointer-events: none; z-index: 2;">
                <div class="slide-card-text" style="${tplStyles}">${slide.text.replace(/\n/g, '<br/>')}</div>
              </div>
              <div class="slide-card-footer-line">
                <span class="badge ${group.badge} slide-card-section-badge" data-gidx="${gIdx}" data-sidx="${sIdx}" title="Clic para cambiar o asignar sección">
                  ${group.name} ▾
                </span>
              </div>
            </div>
          `;
        });
      }).join('');

      const savedCardSize = (typeof localStorage !== 'undefined' && localStorage.getItem('propresenter_slide_card_size')) || '220';
      this.slideGroupsWrapper.innerHTML = `
        <div class="slide-cards-grid" style="--slide-card-min-width: ${savedCardSize}px;">
          ${allCardsHTML}
        </div>
      `;

      this.slideGroupsWrapper.querySelectorAll('.slide-card').forEach(card => {
        const gIdx = parseInt(card.getAttribute('data-gidx'));
        const sIdx = parseInt(card.getAttribute('data-sidx'));
        const groupObj = activeDeck.groups[gIdx];
        const slideObj = groupObj?.slides[sIdx];

        card.addEventListener('click', () => {
          store.setLiveSlide(gIdx, sIdx);
        });

        card.querySelector('.slide-card-section-badge')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openSectionPickerModal({
            deckId: activeDeck.id,
            groupIndex: gIdx,
            slideIndex: sIdx,
            currentName: groupObj.name,
            currentBadge: groupObj.badge,
            canSplit: (groupObj.slides?.length || 0) > 1 && sIdx > 0
          });
        });

        card.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          if (slideObj) {
            this.openEditSlideModal({
              type: 'slide',
              deckId: activeDeck.id,
              groupIndex: gIdx,
              slideIndex: sIdx,
              text: slideObj.text,
              name: `${groupObj.name || 'Filmina'} #${sIdx + 1}`
            });
          }
        });

        card.addEventListener('contextmenu', (e) => {
          if (slideObj) {
            this.showContextMenu(e, {
              type: 'slide',
              deckId: activeDeck.id,
              groupIndex: gIdx,
              slideIndex: sIdx,
              text: slideObj.text,
              name: `${groupObj.name || 'Filmina'} #${sIdx + 1}`
            });
          }
        });
      });
    }

    // Sync transition toggle buttons active state
    document.querySelectorAll('.btn-trans-toggle[data-trans-type="text"]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === state.textTransition);
    });
    document.querySelectorAll('.btn-trans-toggle[data-trans-type="media"]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === state.mediaTransition);
    });

    // 4. Operator Live Video Preview (Dual Layer Crossfade)
    const dur = state.fadeDuration || 250;
    const mediaMode = state.mediaTransition || 'fade';
    const bgA = document.getElementById('operator-video-preview-a');
    const bgB = document.getElementById('operator-video-preview-b');
    const imgA = document.getElementById('operator-img-preview-a');
    const imgB = document.getElementById('operator-img-preview-b');

    function isMediaImage(url, type = "") {
      if (type && type.startsWith('image/')) return true;
      if (type && type.startsWith('video/')) return false;
      if (!url) return false;
      return !!url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i) || url.startsWith('data:image/');
    }

    if (bgA && bgB) {
      const shouldOperatorMute = this.isAudienceOpen || !!state.isMediaAudioMuted;
      const operatorVolume = typeof state.mediaAudioVolume === 'number' ? state.mediaAudioVolume : 1.0;

      bgA.muted = shouldOperatorMute;
      bgB.muted = shouldOperatorMute;
      bgA.volume = operatorVolume;
      bgB.volume = operatorVolume;

      if (state.isMediaCleared || !state.activeVideoUrl) {
        if (mediaMode === 'cut') {
          bgA.style.transition = 'opacity 0s';
          bgB.style.transition = 'opacity 0s';
          if (imgA) imgA.style.transition = 'opacity 0s';
          if (imgB) imgB.style.transition = 'opacity 0s';
        } else {
          bgA.style.transition = `opacity ${dur}ms ease-in-out`;
          bgB.style.transition = `opacity ${dur}ms ease-in-out`;
          if (imgA) imgA.style.transition = `opacity ${dur}ms ease-in-out`;
          if (imgB) imgB.style.transition = `opacity ${dur}ms ease-in-out`;
        }
        bgA.style.opacity = '0';
        bgB.style.opacity = '0';
        if (imgA) imgA.style.opacity = '0';
        if (imgB) imgB.style.opacity = '0';
        bgA.pause();
        bgB.pause();
        this.operatorVideoUrl = "";
      } else if (this.operatorVideoUrl !== state.activeVideoUrl) {
        this.operatorVideoUrl = state.activeVideoUrl;

        const isImage = (state.activeVideoType && state.activeVideoType.startsWith('image/')) || (state.activeVideoIsImage && !state.activeVideoType?.startsWith('video/')) || isMediaImage(state.activeVideoUrl, state.activeVideoType);
        const incomingMedia = this.operatorActiveMediaLayer === 'A' ? { video: bgB, img: imgB } : { video: bgA, img: imgA };
        const outgoingMedia = this.operatorActiveMediaLayer === 'A' ? { video: bgA, img: imgA } : { video: bgB, img: imgB };
        this.operatorActiveMediaLayer = this.operatorActiveMediaLayer === 'A' ? 'B' : 'A';

        const incomingEl = (isImage && incomingMedia.img) ? incomingMedia.img : incomingMedia.video;
        const outgoingEl = (outgoingMedia.video && outgoingMedia.video.style.opacity > 0) ? outgoingMedia.video : outgoingMedia.img;

        if (isImage && incomingMedia.img) {
          incomingMedia.img.src = state.activeVideoUrl;
          incomingMedia.img.style.display = 'block';
          if (incomingMedia.video) {
            incomingMedia.video.style.display = 'none';
            incomingMedia.video.pause();
          }
        } else if (incomingMedia.video) {
          incomingMedia.video.src = state.activeVideoUrl;
          incomingMedia.video.currentTime = 0;
          incomingMedia.video.muted = shouldOperatorMute;
          incomingMedia.video.volume = operatorVolume;
          incomingMedia.video.style.display = 'block';
          if (incomingMedia.img) incomingMedia.img.style.display = 'none';
        }

        if (this.operatorMediaFadeTimeout) {
          clearTimeout(this.operatorMediaFadeTimeout);
        }

        const performOperatorFade = () => {
          if (mediaMode === 'cut') {
            if (incomingEl) incomingEl.style.transition = 'opacity 0s';
            if (outgoingEl) outgoingEl.style.transition = 'opacity 0s';
            if (outgoingMedia.video) outgoingMedia.video.pause();
          } else {
            if (incomingEl) incomingEl.style.transition = `opacity ${dur}ms ease-in-out`;
            if (outgoingEl) outgoingEl.style.transition = `opacity ${dur}ms ease-in-out`;
            this.operatorMediaFadeTimeout = setTimeout(() => {
              if (outgoingMedia.video) outgoingMedia.video.pause();
            }, dur + 50);
          }
          if (incomingEl) incomingEl.style.opacity = '1';
          if (outgoingEl) outgoingEl.style.opacity = '0';
        };

        if (isImage) {
          performOperatorFade();
        } else if (incomingMedia.video) {
          const playPromise = incomingMedia.video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => performOperatorFade())
              .catch(() => {
                incomingMedia.video.muted = true;
                incomingMedia.video.play()
                  .then(() => performOperatorFade())
                  .catch(() => performOperatorFade());
              });
          } else {
            performOperatorFade();
          }
        }
      }
    }


    // 5. Text & Stage Previews (Escalado equivalente e idéntico a la pantalla de Audiencia)
    const targetText = (state.isTextCleared || !state.liveText) ? "" : state.liveText;
    const operatorTextWrapper = document.getElementById('operator-live-text-wrapper');

    if (!targetText) {
      if (operatorTextWrapper) operatorTextWrapper.style.display = 'none';
      if (this.liveTextEl) {
        this.liveTextEl.style.opacity = "0";
        this.liveTextEl.innerHTML = "";
      }
      this.operatorLiveTextContent = "";
    } else {
      if (operatorTextWrapper) operatorTextWrapper.style.display = 'block';
      const formattedHTML = targetText.replace(/\n/g, '<br/>');

      if (state.textTransition === 'fade' && this.operatorLiveTextContent && this.liveTextEl.style.opacity === '1') {
        this.liveTextEl.style.opacity = '0';
        if (this.operatorFadeTimeout) clearTimeout(this.operatorFadeTimeout);
        this.operatorFadeTimeout = setTimeout(() => {
          this.liveTextEl.innerHTML = formattedHTML;
          this.liveTextEl.style.opacity = '1';
        }, Math.round(dur * 0.48));
      } else {
        if (this.operatorFadeTimeout) clearTimeout(this.operatorFadeTimeout);
        this.liveTextEl.innerHTML = formattedHTML;
        this.liveTextEl.style.opacity = '1';
      }
      this.operatorLiveTextContent = targetText;
    }

    if (targetText && state.activeTemplate && this.liveTextEl) {
      const tpl = state.activeTemplate;

      if (operatorTextWrapper) {
        operatorTextWrapper.style.position = 'absolute';
        operatorTextWrapper.style.left = '5%';
        operatorTextWrapper.style.right = '5%';
        operatorTextWrapper.style.top = (tpl.posY !== undefined ? tpl.posY : 50) + '%';
        operatorTextWrapper.style.transform = 'translateY(-50%)';
      }

      const baseFontSize = tpl.fontSize || 52;
      const baseLetterSpacing = tpl.letterSpacing || 0;
      const basePadding = tpl.padding || 0;
      const baseRadius = tpl.borderRadius || 0;

      this.liveTextEl.style.fontFamily = tpl.fontFamily || 'Inter, sans-serif';
      this.liveTextEl.style.fontSize = `calc(${baseFontSize} * 0.0521cqw)`;
      this.liveTextEl.style.fontWeight = '700';
      this.liveTextEl.style.letterSpacing = `calc(${baseLetterSpacing} * 0.0521cqw)`;
      this.liveTextEl.style.lineHeight = tpl.lineHeight || 1.25;
      this.liveTextEl.style.color = tpl.color || '#ffffff';
      this.liveTextEl.style.textShadow = tpl.textShadow || '0 0.3cqw 1cqw rgba(0,0,0,0.9)';
      this.liveTextEl.style.textAlign = tpl.textAlign || 'center';
      this.liveTextEl.style.backgroundColor = tpl.bgColor || 'transparent';
      this.liveTextEl.style.padding = `calc(${basePadding} * 0.025cqw) calc(${basePadding} * 0.045cqw)`;
      this.liveTextEl.style.borderRadius = `calc(${baseRadius} * 0.04cqw)`;
      this.liveTextEl.style.whiteSpace = 'pre-wrap';
      this.liveTextEl.style.wordBreak = 'normal';
      this.liveTextEl.style.overflowWrap = 'normal';

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

    // Video audio UI synchronization
    const isAudioMuted = !!state.isMediaAudioMuted;
    const audioVol = Math.round((typeof state.mediaAudioVolume === 'number' ? state.mediaAudioVolume : 1.0) * 100);

    const btnToggleSound = document.getElementById('btn-toggle-video-sound');
    const soundIcon = document.getElementById('monitor-sound-icon');
    const soundText = document.getElementById('monitor-sound-text');
    if (btnToggleSound) {
      btnToggleSound.classList.toggle('muted', isAudioMuted);
      btnToggleSound.classList.toggle('active', !isAudioMuted);
      if (soundIcon) soundIcon.textContent = isAudioMuted ? '🔇' : '🔊';
      if (soundText) soundText.textContent = isAudioMuted ? 'Silenciado' : 'Sonido ON';
    }

    const btnAudioPill = document.getElementById('btn-audio-mute-toggle');
    const audioPillIcon = document.getElementById('audio-pill-icon');
    const audioPillText = document.getElementById('audio-pill-text');
    if (btnAudioPill) {
      btnAudioPill.classList.toggle('muted', isAudioMuted);
      if (audioPillIcon) audioPillIcon.textContent = isAudioMuted ? '🔇' : '🔊';
      if (audioPillText) audioPillText.textContent = isAudioMuted ? 'MUTE' : 'ON';
    }

    const btnDockAudio = document.getElementById('btn-dock-audio-toggle');
    const dockAudioIcon = document.getElementById('dock-audio-icon');
    const dockAudioText = document.getElementById('dock-audio-text');
    if (btnDockAudio) {
      btnDockAudio.classList.toggle('muted', isAudioMuted);
      if (dockAudioIcon) dockAudioIcon.textContent = isAudioMuted ? '🔇' : '🔊';
      if (dockAudioText) dockAudioText.textContent = isAudioMuted ? 'Audio: Mute' : 'Audio: ON';
    }

    const videoVolInput = document.getElementById('input-video-volume');
    const videoVolBadge = document.getElementById('val-video-volume');
    if (videoVolInput && document.activeElement !== videoVolInput) {
      videoVolInput.value = audioVol;
    }
    if (videoVolBadge) {
      videoVolBadge.textContent = `${audioVol}%`;
    }

    // Apply live transition timing CSS to operator live preview
    if (this.liveTextEl) {
      this.liveTextEl.style.transition = state.textTransition === 'cut' ? 'opacity 0s, transform 0s' : `opacity ${dur}ms ease-in-out, transform ${dur}ms ease-in-out`;
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
