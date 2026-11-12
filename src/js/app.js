/**
 * ProPresenter AI Studio - Main Application Controller
 */

import { store, DEFAULT_TEMPLATES, parseAndSplitText } from './state.js';
import { sync } from './broadcast.js';
import { stageManager } from './stage-manager.js';
import { BIBLE_BOOKS, BIBLE_VERSIONS, getAllBibleVersions, getChapterVerses, splitVerseText, fetchAndLoadBibleFromUrl, parseAndAddCustomBible, deleteCustomBible } from './bible-data.js';
import { searchSongsOnline } from './song-search.js';
import { calendarManager } from './calendar-manager.js';
import { MediaCache } from './media-cache.js';
import { importPresentationSource, isPresentationFileName } from './presentation-importer.js';
import { initIcons, iconSvg, getSectionIconSvg, getCategoryIconSvg } from './icons.js';
import pkg from '../../package.json';

class ProPresenterApp {
  constructor() {
    this.operatorVideoPreview = document.getElementById('operator-video-preview');
    this.contextTarget = null;

    // State for Scriptures Navigator & Operator Video Crossfade
    this.operatorVideoUrl = "";
    this.operatorMediaPlayId = 0;
    this.operatorActiveMediaLayer = 'A';
    this.lastQueueAdvanceTime = 0;
    this.selectedBibleVersion = '';
    this.selectedBookId = 'JHN';
    this.selectedChapter = 3;
    this.scriptureQuery = '';
    this.matchedBookSuggestion = null;
    this.isAudienceOpen = false;
    this.projectSearchQuery = '';
    this.editingDeckId = null;
    this.originalEditLines = [];
    this.originalSlideEditLines = [];

    // Track Audience window status for operator audio echo prevention
    sync.onAudiencePresence((isOpen) => {
      this.isAudienceOpen = isOpen;
      this.updateOperatorAudioMute();
    });

    // Listen for Audience window reporting video playback completion for queue auto-advance
    sync.onMediaEnded(() => {
      this.handleActiveVideoEnded();
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
    this.initPhysicalFoldersSync();

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
    initIcons();
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
    this.selectedMediaFolder = "General";

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
        const mode = tab.getAttribute('data-mode');
        if (mode === 'edit') {
          if (store.activeDeckId) {
            this.openFullScreenSongEditor(store.activeDeckId);
          } else {
            this.showToast("Selecciona una canción para editar en pantalla completa.", "warn");
          }
        } else if (mode === 'show') {
          this.closeFullScreenSongEditor();
        }
      });
    });

    document.getElementById('btn-edit-active-deck')?.addEventListener('click', () => {
      if (store.activeDeckId) {
        this.openFullScreenSongEditor(store.activeDeckId);
      }
    });

    // Inicializar listeners del editor de pantalla completa desde el arranque
    this.initFullScreenEditorEvents();

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

    // 2b. Media Playback Queue Controls, Timeline Scrubbing & Video Ended Listeners
    this.isScrubbingTimeline = false;
    const opVidA = document.getElementById('operator-video-preview-a');
    const opVidB = document.getElementById('operator-video-preview-b');
    opVidA?.addEventListener('ended', () => {
      if (opVidA.style.opacity === '1') this.handleActiveVideoEnded();
    });
    opVidB?.addEventListener('ended', () => {
      if (opVidB.style.opacity === '1') this.handleActiveVideoEnded();
    });

    const timelineEvents = ['timeupdate', 'loadedmetadata', 'durationchange', 'play', 'pause', 'seeked'];
    timelineEvents.forEach(evtName => {
      opVidA?.addEventListener(evtName, () => {
        if (this.getActiveOperatorVideo() === opVidA) this.updateMediaTimelineUI();
      });
      opVidB?.addEventListener(evtName, () => {
        if (this.getActiveOperatorVideo() === opVidB) this.updateMediaTimelineUI();
      });
    });

    const timelineSlider = document.getElementById('input-media-timeline');
    const btnTimelinePlayPause = document.getElementById('btn-timeline-play-pause');
    const btnTimelineRestart = document.getElementById('btn-timeline-restart');

    if (timelineSlider) {
      const startScrub = () => { this.isScrubbingTimeline = true; };
      const endScrub = () => {
        if (!this.isScrubbingTimeline) return;
        this.isScrubbingTimeline = false;
        const activeVid = this.getActiveOperatorVideo();
        if (activeVid && activeVid.duration && isFinite(activeVid.duration)) {
          const ratio = Math.max(0, Math.min(1, parseFloat(timelineSlider.value) / 1000));
          const targetTime = ratio * activeVid.duration;
          try { activeVid.currentTime = targetTime; } catch (e) {}
          store.seekActiveMedia(targetTime);
        }
        this.updateMediaTimelineUI();
      };

      timelineSlider.addEventListener('mousedown', startScrub);
      timelineSlider.addEventListener('touchstart', startScrub, { passive: true });
      timelineSlider.addEventListener('mouseup', endScrub);
      timelineSlider.addEventListener('touchend', endScrub);
      timelineSlider.addEventListener('change', endScrub);

      let seekRafId = null;
      let lastBroadcastSeekTs = 0;

      timelineSlider.addEventListener('input', () => {
        this.isScrubbingTimeline = true;
        const activeVid = this.getActiveOperatorVideo();
        const ratio = Math.max(0, Math.min(1, parseFloat(timelineSlider.value) / 1000));
        timelineSlider.style.setProperty('--timeline-progress', `${(ratio * 100).toFixed(1)}%`);

        if (activeVid && activeVid.duration && isFinite(activeVid.duration)) {
          const targetTime = ratio * activeVid.duration;
          const curEl = document.getElementById('lbl-timeline-current');
          const remEl = document.getElementById('lbl-timeline-remaining');
          if (curEl) curEl.textContent = this.formatMediaTime(targetTime);
          if (remEl) remEl.textContent = `-${this.formatMediaTime(Math.max(0, activeVid.duration - targetTime))}`;

          if (seekRafId) cancelAnimationFrame(seekRafId);
          seekRafId = requestAnimationFrame(() => {
            try { activeVid.currentTime = targetTime; } catch (e) {}
            const now = performance.now();
            if (now - lastBroadcastSeekTs > 80) {
              lastBroadcastSeekTs = now;
              store.seekActiveMedia(targetTime);
            }
          });
        }
      });
    }

    btnTimelinePlayPause?.addEventListener('click', () => {
      const activeVid = this.getActiveOperatorVideo();
      if (!activeVid || store.state.isMediaCleared || !store.state.activeVideoUrl) return;
      const shouldPause = !activeVid.paused;
      if (shouldPause) {
        activeVid.pause();
      } else {
        activeVid.play().catch(() => {});
      }
      store.setMediaPaused(shouldPause);
      this.updateMediaTimelineUI();
    });

    btnTimelineRestart?.addEventListener('click', () => {
      const activeVid = this.getActiveOperatorVideo();
      if (!activeVid || store.state.isMediaCleared || !store.state.activeVideoUrl) return;
      try {
        activeVid.currentTime = 0;
        activeVid.play().catch(() => {});
      } catch (e) {}
      store.restartActiveMedia();
      this.updateMediaTimelineUI();
    });

    document.getElementById('btn-dock-queue-next')?.addEventListener('click', () => store.advanceMediaQueue());
    document.getElementById('btn-sidebar-queue-next')?.addEventListener('click', () => store.advanceMediaQueue());
    document.getElementById('btn-dock-queue-clear')?.addEventListener('click', () => store.clearMediaQueue());
    document.getElementById('btn-sidebar-queue-clear')?.addEventListener('click', () => store.clearMediaQueue());

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

    // 5. Live Search Input in Resource Dock, Shows Header & Projects Sidebar (Accent-insensitive + Lyrics)
    const showsLocalSearchInput = document.getElementById('input-shows-local-search');
    const btnClearShowsSearch = document.getElementById('btn-clear-shows-search');
    const projectSearchInput = document.getElementById('input-project-search');
    const btnClearProjectSearch = document.getElementById('btn-clear-project-search');

    const applyShowsAndMediaSearch = (rawVal, sourceEl) => {
      this.searchQuery = (rawVal || '').trim();
      if (this.dockSearchInput && sourceEl !== this.dockSearchInput) {
        this.dockSearchInput.value = rawVal || '';
      }
      if (showsLocalSearchInput && sourceEl !== showsLocalSearchInput) {
        showsLocalSearchInput.value = rawVal || '';
      }
      if (btnClearShowsSearch) {
        btnClearShowsSearch.style.display = this.searchQuery ? 'inline-flex' : 'none';
      }
      this.lastShowsCacheKey = null;
      this.lastMediaGridCacheKey = null;
      this.renderShowsDock(store.state, store.decks);
      this.renderMediaDock(store.state);
    };

    this.dockSearchInput?.addEventListener('input', (e) => {
      applyShowsAndMediaSearch(e.target.value, this.dockSearchInput);
    });

    showsLocalSearchInput?.addEventListener('input', (e) => {
      applyShowsAndMediaSearch(e.target.value, showsLocalSearchInput);
    });

    btnClearShowsSearch?.addEventListener('click', () => {
      applyShowsAndMediaSearch('', null);
      showsLocalSearchInput?.focus();
    });

    const applyProjectSidebarSearch = (rawVal) => {
      this.projectSearchQuery = (rawVal || '').trim();
      if (btnClearProjectSearch) {
        btnClearProjectSearch.style.display = this.projectSearchQuery ? 'inline-flex' : 'none';
      }
      this.renderUI(store.state, store.decks);
    };

    projectSearchInput?.addEventListener('input', (e) => {
      applyProjectSidebarSearch(e.target.value);
    });

    btnClearProjectSearch?.addEventListener('click', () => {
      if (projectSearchInput) projectSearchInput.value = '';
      applyProjectSidebarSearch('');
      projectSearchInput?.focus();
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
        this.ensureModalInteractive(this.modalCreateShow, this.editingDeckId ? this.inputShowText : this.inputShowTitle);
      } else if (mode === 'search') {
        setTabStyle(tabSearch, true);
        setTabStyle(tabManual, false);
        setTabStyle(tabClipboard, false);

        if (viewSearch) viewSearch.style.display = 'block';
        if (viewManual) viewManual.style.display = 'none';
        this.ensureModalInteractive(this.modalCreateShow, document.getElementById('input-song-search-query'));
      }
    };
    this.switchCreateModalMode = switchModalMode;

    const pasteFromClipboard = async () => {
      try {
        let clipboardText = "";
        if (navigator.clipboard && navigator.clipboard.readText) {
          clipboardText = await navigator.clipboard.readText();
        }

        if (!clipboardText || !clipboardText.trim()) {
          this.showToast("El portapapeles está vacío o no contiene texto legible.", "warn");
          this.ensureModalInteractive(this.modalCreateShow, this.inputShowText);
          return;
        }

        const trimmed = clipboardText.trim();
        if (this.inputShowText) {
          this.inputShowText.value = trimmed;
          this.renderSongEditDiff();
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
        this.ensureModalInteractive(this.modalCreateShow, this.inputShowText);
      } catch (err) {
        console.warn("No se pudo acceder directamente al portapapeles:", err);
        this.showToast("Puedes pegar directamente con Ctrl+V en el cuadro de letra.", "info");
        this.ensureModalInteractive(this.modalCreateShow, this.inputShowText);
      }
    };

    tabManual?.addEventListener('click', () => switchModalMode('manual'));
    tabSearch?.addEventListener('click', () => switchModalMode('search'));
    tabClipboard?.addEventListener('click', async () => {
      switchModalMode('manual');
      await pasteFromClipboard();
    });
    btnPasteClipboard?.addEventListener('click', pasteFromClipboard);

    this.inputShowText?.addEventListener('input', () => {
      this.renderSongEditDiff();
    });

    // Local + Web Song Search Logic
    const btnSongSearch = document.getElementById('btn-song-search-submit');
    const inputSongQuery = document.getElementById('input-song-search-query');
    const songResultsList = document.getElementById('song-search-results-list');

    let currentSearchResults = [];

    const renderCombinedSongResults = (localMatches, webResults, q, isLoadingWeb = false) => {
      if (!songResultsList) return;
      let html = '';

      if (localMatches.length > 0) {
        html += `<div style="font-size: 0.72rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 2px; display: flex; align-items: center; gap: 5px;">${iconSvg('book-open', { size: 13, color: '#34d399' })} En tu Biblioteca Local (${localMatches.length} descargada${localMatches.length === 1 ? '' : 's'})</div>`;
        html += localMatches.map(deck => `
          <div class="song-search-item" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden; flex: 1;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 5px;">${iconSvg('music', { size: 13, color: '#34d399' })} ${deck.title}</span>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--text-muted);">
                <span style="color: #6ee7b7; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">${iconSvg('check', { size: 12, color: '#6ee7b7' })} Ya descargada</span>
                <span>•</span>
                <span style="display: inline-flex; align-items: center; gap: 3px;">${iconSvg('folder', { size: 12 })} ${deck.category || 'Alabanza'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button type="button" class="btn-project-local-song" data-deck-id="${deck.id}" style="background: #059669; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 0.73rem; font-weight: 700; cursor: pointer; white-space: nowrap;">
                ${iconSvg('play', { size: 12 })} Proyectar
              </button>
              <button type="button" class="btn-edit-local-song" data-deck-id="${deck.id}" style="background: rgba(56, 189, 248, 0.16); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.4); padding: 5px 10px; border-radius: 4px; font-size: 0.73rem; font-weight: 700; cursor: pointer; white-space: nowrap;">
                ${iconSvg('pencil', { size: 12 })} Editar
              </button>
            </div>
          </div>
        `).join('');
      }

      if (isLoadingWeb) {
        html += `<div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">⏳ Buscando más resultados en la web para "<strong>${q}</strong>"...</div>`;
      } else if (webResults.length > 0) {
        html += `<div style="font-size: 0.72rem; font-weight: 800; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 0.04em; padding: 6px 2px 2px 2px; display: flex; align-items: center; gap: 5px;">${iconSvg('globe', { size: 13, color: 'var(--accent-cyan)' })} Resultados Online (${webResults.length})</div>`;
        html += webResults.map((song, idx) => `
          <div class="song-search-item" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden; flex: 1;">
              <span style="font-size: 0.85rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 5px;">${iconSvg('music', { size: 13, color: 'var(--accent-pink)' })} ${song.title}</span>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--text-muted);">
                <span style="display: inline-flex; align-items: center; gap: 4px;">${iconSvg('user', { size: 12 })} <strong>Autor:</strong> ${song.artist}</span>
                <span>•</span>
                <span style="color: var(--accent-cyan); display: inline-flex; align-items: center; gap: 4px;">${iconSvg('globe', { size: 12 })} <strong>Página:</strong> ${song.source}</span>
              </div>
            </div>
            <button type="button" class="btn-select-song-result" data-song-idx="${idx}" style="background: linear-gradient(135deg, var(--accent-magenta), #db2777); color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 0.73rem; font-weight: 700; cursor: pointer; white-space: nowrap;">
              ${iconSvg('download', { size: 12 })} Cargar Letra
            </button>
          </div>
        `).join('');
      } else if (localMatches.length === 0) {
        html = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px;">${iconSvg('x-circle', { size: 15, color: '#ef4444' })} No se encontraron canciones locales ni online para "${q}".</div>`;
      }

      songResultsList.innerHTML = html;

      songResultsList.querySelectorAll('.btn-project-local-song').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const deckId = btn.getAttribute('data-deck-id');
          if (deckId) {
            store.setActiveDeck(deckId);
            closeModalShow();
          }
        });
      });

      songResultsList.querySelectorAll('.btn-edit-local-song').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const deckId = btn.getAttribute('data-deck-id');
          if (deckId) {
            this.openEditDeckModal(deckId);
          }
        });
      });

      songResultsList.querySelectorAll('.btn-select-song-result').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const idx = parseInt(btn.getAttribute('data-song-idx'));
          const selectedSong = currentSearchResults[idx];
          if (selectedSong) {
            this.editingDeckId = null;
            this.originalEditLines = selectedSong.lyrics.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (this.inputShowTitle) this.inputShowTitle.value = selectedSong.title;
            if (this.inputShowText) this.inputShowText.value = selectedSong.lyrics;
            if (this.activeFilter && this.activeFilter !== 'all' && this.inputShowCategory) {
              this.inputShowCategory.value = this.activeFilter;
            }
            switchModalMode('manual');
            this.renderSongEditDiff();
          }
        });
      });
    };

    const handleSongSearch = async (e) => {
      if (e) e.preventDefault();
      const q = inputSongQuery?.value.trim();
      if (!q) {
        if (songResultsList) {
          songResultsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px;">${iconSvg('alert-triangle', { size: 14, color: 'var(--accent-gold)' })} Por favor ingresa el título, letra o autor de la canción.</div>`;
        }
        return;
      }

      const localMatches = (store.decks || []).filter(deck => this.deckMatchesQuery(deck, q));

      if (btnSongSearch) {
        btnSongSearch.disabled = true;
        btnSongSearch.textContent = "⌛ Buscando...";
      }
      renderCombinedSongResults(localMatches, [], q, true);

      try {
        currentSearchResults = await searchSongsOnline(q);
        renderCombinedSongResults(localMatches, currentSearchResults, q, false);
      } catch (err) {
        renderCombinedSongResults(localMatches, [], q, false);
      } finally {
        if (btnSongSearch) {
          btnSongSearch.disabled = false;
          btnSongSearch.innerHTML = `${iconSvg('search', { size: 13 })} Buscar`;
        }
      }
    };

    btnSongSearch?.addEventListener('click', handleSongSearch);
    inputSongQuery?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSongSearch(e);
    });
    inputSongQuery?.addEventListener('input', () => {
      const q = inputSongQuery.value.trim();
      if (!q) return;
      const localMatches = (store.decks || []).filter(deck => this.deckMatchesQuery(deck, q));
      if (localMatches.length > 0) {
        renderCombinedSongResults(localMatches, currentSearchResults, q, false);
      }
    });

    const openModalShow = () => {
      this.closeAllModals();
      this.editingDeckId = null;
      this.originalEditLines = [];
      const headerTitleEl = document.getElementById('modal-show-header-title');
      if (headerTitleEl) headerTitleEl.innerHTML = `${iconSvg('music', { size: 16, color: 'var(--accent-pink)' })} Agregar Nueva Canción o Presentación`;
      if (this.btnSaveShow) this.btnSaveShow.innerHTML = `${iconSvg('save', { size: 13 })} Guardar y Proyectar`;
      if (this.inputShowTitle) this.inputShowTitle.value = "";
      if (this.inputShowText) this.inputShowText.value = "";
      this.renderSongEditDiff();

      if (this.modalCreateShow) {
        this.modalCreateShow.classList.add('open');
        switchModalMode('manual');

        // Poblar plantillas de estilo dinámicamente
        if (this.inputShowTemplate) {
          const templates = store.templates || [];
          this.inputShowTemplate.innerHTML = templates.map(t => 
            `<option value="${t.id}" ${t.id === store.activeTemplateId ? 'selected' : ''}>${t.name}${t.maxLines > 0 ? ` (Máx. ${t.maxLines} renglones)` : ''}</option>`
          ).join('');

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

        this.ensureModalInteractive(this.modalCreateShow, this.inputShowTitle);
      }
    };

    const closeModalShow = () => {
      if (this.modalCreateShow) {
        this.modalCreateShow.classList.remove('open');
        this.editingDeckId = null;
        this.originalEditLines = [];
        if (this.inputShowTitle) this.inputShowTitle.value = "";
        if (this.inputShowText) this.inputShowText.value = "";
        this.renderSongEditDiff();
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
        this.showToast("Por favor ingresa un título y el texto del show/canción.", "warn");
        this.ensureModalInteractive(this.modalCreateShow, !title ? this.inputShowTitle : this.inputShowText);
        return;
      }

      if (this.editingDeckId) {
        store.updateDeckContent(this.editingDeckId, title, category, text, {
          templateId,
          splitMode,
          maxLines
        });
        this.showToast(`Canción "${title}" actualizada correctamente.`, "success");
      } else {
        store.createNewShow(title, category, text, {
          templateId,
          splitMode,
          maxLines
        });
        this.showToast(`Canción "${title}" guardada y proyectada.`, "success");
      }
      closeModalShow();
    });

    // Handlers para el Modal de Re-división de Filminas (Reflow Deck)
    const openModalReflow = () => {
      this.closeAllModals();
      const modalReflow = document.getElementById('modal-reflow-deck');
      if (modalReflow) {
        modalReflow.classList.add('open');
        this.ensureModalInteractive(modalReflow, document.getElementById('input-reflow-lines'));
      }
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

    // 7b. Importador de Presentaciones (PPTX / PPT / PPSX / ODP / PDF)
    this.initPresentationImportEvents();

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
        this.ensureModalInteractive(this.modalUploadMedia, this.inputMediaName);
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

      this.showToast("Por favor selecciona uno o más archivos de video/imagen o ingresa una URL.", "warn");
      this.ensureModalInteractive(this.modalUploadMedia, this.inputMediaUrl);
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
        this.ensureModalInteractive(this.modalCreateFolder, this.inputVirtualFolderName);
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
        this.showToast(`Carpeta virtual "${folderName}" creada.`, "success");
      } else {
        this.showToast("Por favor ingresa un nombre para la carpeta virtual.", "warn");
        this.ensureModalInteractive(this.modalCreateFolder, this.inputVirtualFolderName);
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

    // Physical Folder Linking Handlers (Real-Time Disk Sync)
    document.getElementById('btn-add-physical-folder')?.addEventListener('click', () => {
      this.handleAddPhysicalFolder();
    });
    document.getElementById('btn-link-physical-folder-modal')?.addEventListener('click', () => {
      closeModalFolder();
      this.handleAddPhysicalFolder();
    });
    const physFallbackInput = document.getElementById('input-physical-folder-fallback');
    physFallbackInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const firstPath = files[0].webkitRelativePath || '';
      const folderName = firstPath.split('/')[0] || 'Carpeta Local';
      const folderKey = `local-dir://${folderName}`;
      const processed = await this.processMediaFiles(files, folderName);
      store.addPhysicalMediaFolder(folderKey, folderName, processed);
      this.selectedMediaFolder = `phys:${folderKey}`;
      physFallbackInput.value = '';
    });

    // 8.b. Slide Edit Modal Listeners
    const closeModalEditSlide = () => {
      if (this.modalEditSlide) this.modalEditSlide.classList.remove('open');
      this.pendingEditSlideTarget = null;
      this.originalSlideEditLines = [];
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
    this.inputEditSlideText?.addEventListener('input', () => {
      this.renderSlideEditDiff();
    });

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
        this.renderSongEditDiff();
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
    if (duplicateLabel) duplicateLabel.textContent = 'Duplicar Elemento';

    if (target.type === 'project-item') {
      if (primaryLabel) primaryLabel.textContent = 'Proyectar / Activar';
      if (secondaryLabel) secondaryLabel.textContent = 'Editar Contenido';
      if (duplicateLabel) duplicateLabel.textContent = 'Quitar del Proyecto';
      if (duplicateEl) duplicateEl.style.display = 'flex';
      if (deleteLabel) deleteLabel.textContent = `Eliminar de Biblioteca (${target.name || ''})`;
    } else if (target.type === 'deck') {
      const isInProject = store.projectDeckIds.includes(target.id);
      if (primaryLabel) primaryLabel.textContent = 'Proyectar / Activar';
      if (secondaryLabel) secondaryLabel.textContent = 'Editar Contenido';
      if (duplicateLabel) duplicateLabel.textContent = isInProject ? 'Quitar del Proyecto' : 'Agregar al Proyecto';
      if (duplicateEl) duplicateEl.style.display = 'flex';
      if (deleteLabel) deleteLabel.textContent = `Eliminar de Biblioteca (${target.name || ''})`;
    } else if (target.type === 'media') {
      if (primaryLabel) primaryLabel.textContent = 'Transmitir en Vivo';
      if (secondaryLabel) secondaryLabel.textContent = 'Cambiar Carpeta';
      if (duplicateEl) duplicateEl.style.display = 'none';
    } else if (target.type === 'bible') {
      if (primaryLabel) primaryLabel.textContent = 'Activar Biblia';
      if (secondaryEl) secondaryEl.style.display = 'none';
      if (duplicateEl) duplicateEl.style.display = 'none';
    } else if (target.type === 'slide') {
      if (primaryLabel) primaryLabel.textContent = 'Proyectar Filmina';
      if (secondaryLabel) secondaryLabel.textContent = 'Editar Diapositiva';
      if (duplicateLabel) duplicateLabel.textContent = 'Duplicar Diapositiva';
      if (duplicateEl) duplicateEl.style.display = 'flex';
      if (deleteLabel) deleteLabel.textContent = `Eliminar ${target.name || 'Diapositiva'}`;
    } else if (target.type === 'event') {
      if (primaryLabel) primaryLabel.textContent = 'Proyectar Anuncio';
      if (secondaryEl) secondaryEl.style.display = 'none';
      if (duplicateEl) duplicateEl.style.display = 'none';
    }

    const sectionEl = document.getElementById('ctx-action-section');
    if (sectionEl) sectionEl.style.display = target.type === 'slide' ? 'flex' : 'none';

    const queueMediaEl = document.getElementById('ctx-action-queue-media');
    if (queueMediaEl) queueMediaEl.style.display = target.type === 'media' ? 'flex' : 'none';

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
        this.openEditDeckModal(target.id);
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

    document.getElementById('ctx-action-queue-media')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = this.contextTarget;
      this.hideContextMenu();
      if (!target || target.type !== 'media') return;
      store.enqueueMedia(target.id || target);
    });
  }

  handleActiveVideoEnded() {
    const now = Date.now();
    if (this.lastQueueAdvanceTime && (now - this.lastQueueAdvanceTime < 750)) {
      return;
    }
    if (Array.isArray(store.state.mediaQueue) && store.state.mediaQueue.length > 0) {
      this.lastQueueAdvanceTime = now;
      store.advanceMediaQueue();
    }
  }

  getActiveOperatorVideo() {
    const bgA = document.getElementById('operator-video-preview-a');
    const bgB = document.getElementById('operator-video-preview-b');
    const candidate = this.operatorActiveMediaLayer === 'A' ? bgA : bgB;
    if (candidate && candidate.style.display !== 'none' && candidate.src) {
      return candidate;
    }
    if (bgA && bgA.style.opacity === '1' && bgA.style.display !== 'none') return bgA;
    if (bgB && bgB.style.opacity === '1' && bgB.style.display !== 'none') return bgB;
    return candidate || bgA;
  }

  formatMediaTime(seconds) {
    if (typeof seconds !== 'number' || !isFinite(seconds) || seconds < 0) return '00:00';
    const totalSec = Math.floor(seconds);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateMediaTimelineUI(state = store.state) {
    const panel = document.getElementById('media-timeline-panel');
    if (!panel) return;

    const iconEl = document.getElementById('lbl-timeline-media-icon');
    const nameEl = document.getElementById('lbl-timeline-media-name');
    const modeBadgeEl = document.getElementById('lbl-timeline-mode-badge');
    const remEl = document.getElementById('lbl-timeline-remaining');
    const curEl = document.getElementById('lbl-timeline-current');
    const durEl = document.getElementById('lbl-timeline-duration');
    const sliderEl = document.getElementById('input-media-timeline');
    const btnPlayPause = document.getElementById('btn-timeline-play-pause');
    const iconPlayPause = document.getElementById('icon-timeline-play-pause');
    const btnRestart = document.getElementById('btn-timeline-restart');

    const isCleared = !!state.isMediaCleared || !state.activeVideoUrl;
    const isImage = !isCleared && (
      (state.activeVideoType && state.activeVideoType.startsWith('image/')) ||
      (state.activeVideoIsImage && !state.activeVideoType?.startsWith('video/')) ||
      !!(state.activeVideoUrl && (state.activeVideoUrl.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i) || state.activeVideoUrl.startsWith('data:image/')))
    );

    panel.classList.toggle('is-cleared', isCleared);
    panel.classList.toggle('is-static-image', isImage);

    const activeLibItem = state.mediaLibrary?.find(m => m.url === state.activeVideoUrl);
    const activeTitle = state.activeVideoName || activeLibItem?.name || state.activeVideoTitle || 'Fondo Multimedia';

    if (isCleared) {
      if (iconEl) iconEl.textContent = '⬛';
      if (nameEl) nameEl.textContent = 'Sin medio activo (Fondo Limpio)';
      if (modeBadgeEl) {
        modeBadgeEl.textContent = 'LIMPIO';
        modeBadgeEl.className = 'media-timeline-mode-badge';
      }
      if (curEl) curEl.textContent = '00:00';
      if (durEl) durEl.textContent = '00:00';
      if (remEl) remEl.textContent = '-00:00';
      if (sliderEl) {
        sliderEl.value = '0';
        sliderEl.disabled = true;
        sliderEl.style.setProperty('--timeline-progress', '0%');
      }
      if (btnPlayPause) btnPlayPause.disabled = true;
      if (btnRestart) btnRestart.disabled = true;
      if (iconPlayPause) iconPlayPause.innerHTML = iconSvg('play', { size: 13 });
      return;
    }

    if (isImage) {
      if (iconEl) iconEl.innerHTML = iconSvg('image', { size: 14 });
      if (nameEl) nameEl.textContent = activeTitle;
      if (modeBadgeEl) {
        modeBadgeEl.innerHTML = `${iconSvg('image', { size: 11, className: 'lucide-icon' })} IMAGEN FIJA`;
        modeBadgeEl.className = 'media-timeline-mode-badge';
      }
      if (curEl) curEl.textContent = '--:--';
      if (durEl) durEl.textContent = '--:--';
      if (remEl) remEl.textContent = 'FIJO';
      if (sliderEl) {
        sliderEl.value = '1000';
        sliderEl.disabled = true;
        sliderEl.style.setProperty('--timeline-progress', '100%');
      }
      if (btnPlayPause) btnPlayPause.disabled = true;
      if (btnRestart) btnRestart.disabled = true;
      if (iconPlayPause) iconPlayPause.innerHTML = iconSvg('pause', { size: 13 });
      return;
    }

    // Active Video
    const activeVid = this.getActiveOperatorVideo();
    const queueLen = Array.isArray(state.mediaQueue) ? state.mediaQueue.length : 0;
    const isPaused = activeVid ? activeVid.paused : !!state.isMediaPaused;

    if (iconEl) iconEl.innerHTML = iconSvg('film', { size: 14 });
    if (nameEl) nameEl.textContent = activeTitle;

    if (modeBadgeEl) {
      if (isPaused) {
        modeBadgeEl.innerHTML = `${iconSvg('pause', { size: 11, className: 'lucide-icon' })} EN PAUSA`;
        modeBadgeEl.className = 'media-timeline-mode-badge paused-mode';
      } else if (queueLen > 0) {
        modeBadgeEl.innerHTML = `${iconSvg('skip-forward', { size: 11, className: 'lucide-icon' })} COLA (${queueLen})`;
        modeBadgeEl.className = 'media-timeline-mode-badge queue-mode';
      } else {
        modeBadgeEl.innerHTML = `${iconSvg('repeat', { size: 11, className: 'lucide-icon' })} LOOP`;
        modeBadgeEl.className = 'media-timeline-mode-badge';
      }
    }

    if (btnPlayPause) btnPlayPause.disabled = false;
    if (btnRestart) btnRestart.disabled = false;
    if (iconPlayPause) iconPlayPause.innerHTML = isPaused ? iconSvg('play', { size: 13 }) : iconSvg('pause', { size: 13 });

    const duration = (activeVid && isFinite(activeVid.duration) && activeVid.duration > 0) ? activeVid.duration : 0;
    const currentTime = (activeVid && isFinite(activeVid.currentTime) && activeVid.currentTime >= 0) ? activeVid.currentTime : 0;
    const remaining = Math.max(0, duration - currentTime);

    if (durEl) durEl.textContent = this.formatMediaTime(duration);
    if (!this.isScrubbingTimeline) {
      if (curEl) curEl.textContent = this.formatMediaTime(currentTime);
      if (remEl) remEl.textContent = `-${this.formatMediaTime(remaining)}`;
      if (sliderEl) {
        sliderEl.disabled = duration <= 0;
        const permille = duration > 0 ? Math.min(1000, Math.round((currentTime / duration) * 1000)) : 0;
        sliderEl.value = String(permille);
        sliderEl.style.setProperty('--timeline-progress', `${(permille / 10).toFixed(1)}%`);
      }
    }
  }

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  normalizeSearchText(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  deckMatchesQuery(deck, query) {
    if (!query) return true;
    if (!deck) return false;
    const normQuery = this.normalizeSearchText(query);
    if (!normQuery) return true;

    const terms = normQuery.split(/\s+/).filter(Boolean);
    const groups = deck.groups || [];
    const rawSnapshot = `${deck.title}|${deck.category || deck.type}|${groups.length}|${groups[0]?.slides?.[0]?.text || ''}|${groups[groups.length - 1]?.slides?.slice(-1)?.[0]?.text || ''}`;

    if (deck._searchSnapshot !== rawSnapshot || !deck._searchIndex) {
      const titleNorm = this.normalizeSearchText(deck.title);
      const catNorm = this.normalizeSearchText(deck.category || deck.type);
      const lyricsNorm = this.normalizeSearchText(
        groups
          .map(g => `${g.name || ''} ${(g.slides || []).map(s => (s.text || '').replace(/<[^>]+>/g, ' ')).join(' ')}`)
          .join(' ')
      );
      deck._searchSnapshot = rawSnapshot;
      deck._searchIndex = `${titleNorm} ${catNorm} ${lyricsNorm}`;
    }

    return terms.every(term => deck._searchIndex.includes(term));
  }

  initPresentationImportEvents() {
    this.selectedPresentationSource = null;
    this.isImportingPresentation = false;
    this.presentationImportCancelled = false;

    const modal = document.getElementById('modal-import-presentation');
    const dropzone = document.getElementById('presentation-dropzone');
    const fileInput = document.getElementById('input-presentation-file-fallback');
    const lblFile = document.getElementById('lbl-presentation-selected-file');
    const lblPath = document.getElementById('lbl-presentation-selected-path');
    const inputTitle = document.getElementById('input-presentation-title');
    const selectCat = document.getElementById('input-presentation-category');
    const selectMode = document.getElementById('input-presentation-mode');
    const chkHidden = document.getElementById('check-presentation-include-hidden');
    const progressBox = document.getElementById('presentation-import-progress-box');
    const lblProgressMsg = document.getElementById('lbl-presentation-progress-msg');
    const lblProgressPct = document.getElementById('lbl-presentation-progress-pct');
    const barProgressFill = document.getElementById('bar-presentation-progress-fill');
    const btnConfirm = document.getElementById('btn-confirm-import-presentation');
    const btnCancel = document.getElementById('btn-cancel-import-presentation');
    const btnClose = document.getElementById('btn-close-import-presentation');
    const badgePpt = document.getElementById('badge-engine-ppt');

    const updateProgressUI = ({ message = 'Convirtiendo...', current = 0, total = 0 } = {}) => {
      if (progressBox) progressBox.style.display = 'flex';
      if (lblProgressMsg) lblProgressMsg.textContent = message;
      const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 20;
      if (lblProgressPct) lblProgressPct.textContent = total > 0 ? `${pct}% (${current}/${total})` : '...';
      if (barProgressFill) barProgressFill.style.width = `${Math.max(8, pct)}%`;
    };

    const resetModalForm = () => {
      this.selectedPresentationSource = null;
      this.presentationImportCancelled = false;
      if (fileInput) fileInput.value = '';
      if (lblFile) lblFile.textContent = 'Haz clic para elegir tu archivo .PPTX / .PPT / .PDF o arrástralo aquí';
      if (lblPath) lblPath.textContent = 'Soporta diseños personalizados, tipografías incrustadas, gráficos e imágenes';
      if (inputTitle) inputTitle.value = '';
      if (progressBox) progressBox.style.display = 'none';
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = `${iconSvg('presentation', { size: 13 })} Importar y Cargar`;
      }
    };

    const setSelectedSource = (source, displayName = '', displayPath = '') => {
      this.selectedPresentationSource = source;
      const cleanTitle = String(displayName || '').replace(/\.[^.]+$/, '');
      if (lblFile) lblFile.innerHTML = `${iconSvg('file-text', { size: 13 })} ${displayName || 'Archivo seleccionado'}`;
      if (lblPath) lblPath.textContent = displayPath || 'Listo para importar';
      if (inputTitle && !inputTitle.value.trim() && cleanTitle) {
        inputTitle.value = cleanTitle;
      }
    };

    const refreshEnginesBadge = async () => {
      if (!badgePpt) return;
      if (window.electronAPI?.getPresentationEngines) {
        try {
          const engines = await window.electronAPI.getPresentationEngines();
          if (engines?.powerpoint) {
            badgePpt.textContent = 'PowerPoint Nativo: Listo ✓';
            badgePpt.style.background = 'rgba(16, 185, 129, 0.18)';
            badgePpt.style.color = '#34d399';
          } else if (engines?.libreoffice) {
            badgePpt.textContent = 'LibreOffice: Listo ✓';
            badgePpt.style.background = 'rgba(56, 189, 248, 0.18)';
            badgePpt.style.color = '#38bdf8';
          } else {
            badgePpt.textContent = 'PPTX: requiere PowerPoint o LibreOffice (PDF activo)';
            badgePpt.style.background = 'rgba(245, 158, 11, 0.18)';
            badgePpt.style.color = '#fbbf24';
          }
        } catch {
          badgePpt.textContent = 'Modo Escritorio';
        }
      } else {
        badgePpt.textContent = 'Modo Web (Importación directa de PDF)';
      }
    };

    const openImportModal = (preselectedFile = null) => {
      if (this.isImportingPresentation) return;
      this.closeAllModals();
      resetModalForm();
      if (modal) {
        modal.classList.add('open');
        refreshEnginesBadge();
        if (preselectedFile) {
          if (typeof preselectedFile === 'string') {
            const name = preselectedFile.split(/[\\/]/).pop();
            setSelectedSource(preselectedFile, name, preselectedFile);
          } else if (preselectedFile instanceof File) {
            const nativePath = window.electronAPI?.getPathForFile?.(preselectedFile) || '';
            setSelectedSource(nativePath || preselectedFile, preselectedFile.name, nativePath || `${(preselectedFile.size / 1024 / 1024).toFixed(2)} MB`);
          }
        }
        this.ensureModalInteractive(modal, inputTitle);
      }
    };
    this.openImportPresentationModal = openImportModal;

    const closeImportModal = async () => {
      if (this.isImportingPresentation) {
        this.presentationImportCancelled = true;
        await window.electronAPI?.cancelPresentationImport?.();
        this.isImportingPresentation = false;
      }
      if (modal) modal.classList.remove('open');
      resetModalForm();
    };

    document.getElementById('btn-open-import-presentation')?.addEventListener('click', () => openImportModal());
    document.getElementById('btn-import-presentation-header')?.addEventListener('click', () => openImportModal());
    btnClose?.addEventListener('click', closeImportModal);
    btnCancel?.addEventListener('click', closeImportModal);

    dropzone?.addEventListener('click', async () => {
      if (this.isImportingPresentation) return;
      if (window.electronAPI?.selectPresentationFile) {
        const picked = await window.electronAPI.selectPresentationFile();
        if (picked?.filePath) {
          setSelectedSource(picked.filePath, picked.name, picked.filePath);
        }
      } else {
        fileInput?.click();
      }
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const nativePath = window.electronAPI?.getPathForFile?.(file) || '';
      setSelectedSource(nativePath || file, file.name, nativePath || `${(file.size / 1024 / 1024).toFixed(2)} MB`);
    });

    ['dragenter', 'dragover'].forEach(evtName => {
      dropzone?.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.style.borderColor = '#38bdf8';
        dropzone.style.background = 'rgba(56, 189, 248, 0.12)';
      });
    });
    ['dragleave', 'drop'].forEach(evtName => {
      dropzone?.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.style.borderColor = 'rgba(245, 158, 11, 0.55)';
        dropzone.style.background = 'rgba(245, 158, 11, 0.06)';
      });
    });
    dropzone?.addEventListener('drop', (e) => {
      if (this.isImportingPresentation) return;
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!isPresentationFileName(file.name)) {
        this.showToast('Formato no válido. Arrastra un archivo .pptx, .ppt, .ppsx, .odp o .pdf.', 'warn');
        return;
      }
      const nativePath = window.electronAPI?.getPathForFile?.(file) || '';
      setSelectedSource(nativePath || file, file.name, nativePath || `${(file.size / 1024 / 1024).toFixed(2)} MB`);
    });

    // Permitir arrastrar y soltar un archivo .pptx / .pdf sobre cualquier parte de la ventana
    window.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    });
    window.addEventListener('drop', (e) => {
      if (modal?.classList.contains('open')) return;
      const file = e.dataTransfer?.files?.[0];
      if (file && isPresentationFileName(file.name)) {
        e.preventDefault();
        openImportModal(file);
      }
    });

    btnConfirm?.addEventListener('click', async () => {
      if (this.isImportingPresentation) return;
      if (!this.selectedPresentationSource) {
        this.showToast('Selecciona primero un archivo de presentación (.pptx, .ppt o .pdf).', 'warn');
        return;
      }

      this.isImportingPresentation = true;
      this.presentationImportCancelled = false;
      btnConfirm.disabled = true;
      btnConfirm.textContent = '⏳ Convirtiendo...';
      updateProgressUI({ message: 'Iniciando conversión de diapositivas...', current: 0, total: 0 });

      try {
        const imported = await importPresentationSource(this.selectedPresentationSource, {
          onProgress: (p) => updateProgressUI(p),
          isCancelled: () => this.presentationImportCancelled
        });

        const deck = store.createPresentationDeck(imported, {
          title: inputTitle?.value?.trim() || imported.title,
          category: selectCat?.value || 'Presentación',
          mode: selectMode?.value || 'slides',
          includeHidden: Boolean(chkHidden?.checked)
        });

        this.isImportingPresentation = false;
        if (modal) modal.classList.remove('open');
        resetModalForm();

        // Proyectar inmediatamente la primera diapositiva de la presentación
        store.setLiveSlide(0, 0);
        const slideTotal = deck.groups.reduce((acc, g) => acc + g.slides.length, 0);
        this.showToast(`Presentación "${deck.title}" importada (${slideTotal} diapositivas listas para proyectar).`, 'success');
      } catch (err) {
        this.isImportingPresentation = false;
        if (progressBox) progressBox.style.display = 'none';
        if (btnConfirm) {
          btnConfirm.disabled = false;
          btnConfirm.innerHTML = `${iconSvg('presentation', { size: 13 })} Importar y Cargar`;
        }
        if (err?.code !== 'CANCELLED') {
          this.showToast(`${err?.message || 'No se pudo importar la presentación.'}`, 'warn');
        }
      }
    });
  }

  openEditDeckModal(deckId) {
    const deck = store.decks.find(d => d.id === deckId);
    if (deck && deck.type === 'presentation') {
      store.setActiveDeck(deck.id);
      this.showToast('Las presentaciones visuales conservan su diseño original. Haz doble clic en cualquier diapositiva para editar sus notas o texto.', 'info');
      return;
    }
    this.openFullScreenSongEditor(deckId);
  }

  // =========================================================================
  // VISTA DE PANTALLA COMPLETA: EDITOR DE CANCIÓN Y DIAPOSITIVAS (ESTILO FREESHOW)
  // =========================================================================
  openFullScreenSongEditor(deckId, groupIndex = 0, slideIndex = 0) {
    const deck = store.decks.find(d => d.id === deckId) || store.activeDeck || store.decks[0];
    if (!deck) return;

    this.closeAllModals();
    store.setActiveDeck(deck.id);

    // Garantizar que la canción tenga al menos un grupo y una filmina
    if (!Array.isArray(deck.groups) || deck.groups.length === 0) {
      deck.groups = [{
        name: 'Verso 1',
        badge: 'badge-verse',
        slides: [{ id: `slide-${Date.now()}`, text: '' }]
      }];
    } else if (!Array.isArray(deck.groups[0].slides) || deck.groups[0].slides.length === 0) {
      deck.groups[0].slides = [{ id: `slide-${Date.now()}`, text: '' }];
    }

    this.currentEditorDeckId = deck.id;
    const validGIdx = Math.max(0, Math.min(groupIndex, deck.groups.length - 1));
    const maxSIdx = Math.max(0, (deck.groups[validGIdx]?.slides?.length || 1) - 1);
    this.currentEditorGroupIndex = validGIdx;
    this.currentEditorSlideIndex = Math.max(0, Math.min(slideIndex, maxSIdx));
    this.currentEditorSubTab = 'canvas';
    this.currentEditorScope = 'all';
    this.currentEditorZoom = 100;

    // Asegurar que la sub-pestaña Lienzo esté activa al abrir
    document.querySelectorAll('#view-full-editor .editor-sub-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-ed-tab') === 'canvas');
    });
    const canvasMode = document.getElementById('editor-view-canvas-mode');
    const lyricsMode = document.getElementById('editor-view-lyrics-mode');
    if (canvasMode) canvasMode.style.display = 'flex';
    if (lyricsMode) lyricsMode.style.display = 'none';

    // 1. Activar Vista de Pantalla Completa
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.add('edit-mode-active');

    // 2. Sincronizar Pestañas de Modo Superior
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.mode-tab[data-mode="edit"]')?.classList.add('active');

    // 3. Inicializar Listeners de Eventos del Editor antes o junto al renderizado
    this.initFullScreenEditorEvents();

    // 4. Renderizar Componentes del Editor
    this.renderEditorHeader(deck);
    this.renderEditorSlidesList(deck);
    this.renderEditorCenterCanvas(deck);
    this.populateEditorInspector(deck);
  }

  closeFullScreenSongEditor() {
    this.saveCurrentEditorCanvasText();
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('edit-mode-active');

    // Restaurar Pestaña Show activa
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.mode-tab[data-mode="show"]')?.classList.add('active');

    if (this.currentEditorDeckId) {
      store.setActiveDeck(this.currentEditorDeckId);
    }
    this.renderUI(store.state, store.decks);
  }

  selectEditorSlide(groupIndex, slideIndex) {
    this.saveCurrentEditorCanvasText();
    const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
    if (!deck) return;

    const gIdx = Math.max(0, Math.min(groupIndex, (deck.groups?.length || 1) - 1));
    const maxSlide = (deck.groups[gIdx]?.slides?.length || 1) - 1;
    const sIdx = Math.max(0, Math.min(slideIndex, maxSlide));

    this.currentEditorGroupIndex = gIdx;
    this.currentEditorSlideIndex = sIdx;

    this.renderEditorSlidesList(deck);
    this.renderEditorCenterCanvas(deck);
    this.populateEditorInspector(deck);
  }

  saveCurrentEditorCanvasText() {
    if (!this.currentEditorDeckId) return;
    const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
    if (!deck) return;

    if (this.currentEditorSubTab === 'lyrics') {
      const textarea = document.getElementById('editor-lyrics-textarea');
      if (textarea) {
        store.updateDeckContent(deck.id, deck.title, deck.category, textarea.value);
      }
    } else {
      const textbox = document.getElementById('editor-canvas-textbox');
      if (textbox && deck.groups && deck.groups[this.currentEditorGroupIndex]?.slides[this.currentEditorSlideIndex]) {
        const text = textbox.innerText.trim();
        store.updateSlideText(deck.id, this.currentEditorGroupIndex, this.currentEditorSlideIndex, text);
      }
    }
  }

  renderEditorHeader(deck) {
    const titleEl = document.getElementById('editor-deck-title');
    const catEl = document.getElementById('editor-deck-category');
    const totalSlides = (deck.groups || []).reduce((acc, g) => acc + (g.slides?.length || 0), 0);

    if (titleEl) {
      titleEl.innerText = deck.title || "Canción Sin Título";
      titleEl.onblur = () => {
        deck.title = titleEl.innerText.trim() || "Canción";
        store.notify();
      };
    }
    if (catEl) {
      catEl.textContent = `${deck.category || 'Alabanza'} • ${totalSlides} Diapositiva${totalSlides === 1 ? '' : 's'}`;
    }
  }

  getSlideEffectiveStyle(deck, slide = null) {
    const safeDeck = deck || {};
    const tpl = (store.templates || []).find(t => t.id === safeDeck.templateId)
      || (store.templates || []).find(t => t.id === store.activeTemplateId)
      || (store.templates || [])[0]
      || (typeof DEFAULT_TEMPLATES !== 'undefined' && DEFAULT_TEMPLATES[0])
      || {};
    const deckStyle = safeDeck.style || {};
    const slideStyle = (slide && slide.style) ? slide.style : {};

    const shadowEnable = slideStyle.shadowEnable !== undefined ? slideStyle.shadowEnable : (deckStyle.shadowEnable !== undefined ? deckStyle.shadowEnable : true);
    const shadowColor = slideStyle.shadowColor || deckStyle.shadowColor || 'rgba(0,0,0,0.9)';
    const shadowBlur = slideStyle.shadowBlur !== undefined ? slideStyle.shadowBlur : (deckStyle.shadowBlur !== undefined ? deckStyle.shadowBlur : 14);
    const shadowOffsetY = slideStyle.shadowOffsetY !== undefined ? slideStyle.shadowOffsetY : (deckStyle.shadowOffsetY !== undefined ? deckStyle.shadowOffsetY : 4);

    const outlineEnable = slideStyle.outlineEnable !== undefined ? slideStyle.outlineEnable : (deckStyle.outlineEnable !== undefined ? deckStyle.outlineEnable : false);
    const outlineColor = slideStyle.outlineColor || deckStyle.outlineColor || '#000000';
    const outlineWidth = slideStyle.outlineWidth !== undefined ? slideStyle.outlineWidth : (deckStyle.outlineWidth !== undefined ? deckStyle.outlineWidth : 2);

    const bgBoxEnable = slideStyle.bgBoxEnable !== undefined ? slideStyle.bgBoxEnable : (deckStyle.bgBoxEnable !== undefined ? deckStyle.bgBoxEnable : false);
    const bgBoxColor = slideStyle.bgBoxColor || deckStyle.bgBoxColor || '#000000';
    const bgBoxOpacity = slideStyle.bgBoxOpacity !== undefined ? slideStyle.bgBoxOpacity : (deckStyle.bgBoxOpacity !== undefined ? deckStyle.bgBoxOpacity : 40);
    const bgBoxPadding = slideStyle.bgBoxPadding !== undefined ? slideStyle.bgBoxPadding : (deckStyle.bgBoxPadding !== undefined ? deckStyle.bgBoxPadding : 20);
    const bgBoxRadius = slideStyle.bgBoxRadius !== undefined ? slideStyle.bgBoxRadius : (deckStyle.bgBoxRadius !== undefined ? deckStyle.bgBoxRadius : 8);

    let bgColor = tpl.bgColor || 'transparent';
    let padding = tpl.padding || 16;
    let borderRadius = tpl.borderRadius || 6;

    if (slideStyle.bgBoxEnable !== undefined || deckStyle.bgBoxEnable !== undefined) {
      if (bgBoxEnable) {
        const hex = bgBoxColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        const a = bgBoxOpacity / 100;
        bgColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        padding = bgBoxPadding;
        borderRadius = bgBoxRadius;
      } else {
        bgColor = 'transparent';
        padding = 0;
        borderRadius = 0;
      }
    }

    const verticalAlign = slideStyle.verticalAlign || deckStyle.verticalAlign || tpl.verticalAlign || 'center';
    let posY = tpl.posY !== undefined ? tpl.posY : 50;
    if (verticalAlign === 'top') posY = 22;
    else if (verticalAlign === 'bottom') posY = 82;
    else if (verticalAlign === 'center') posY = 50;

    return {
      fontFamily: slideStyle.fontFamily || deckStyle.fontFamily || tpl.fontFamily || 'Inter, sans-serif',
      fontSize: slideStyle.fontSize || deckStyle.fontSize || tpl.fontSize || 56,
      autoSize: slideStyle.autoSize || deckStyle.autoSize || 'none',
      color: slideStyle.color || deckStyle.color || tpl.color || '#ffffff',
      fontWeight: slideStyle.fontWeight || deckStyle.fontWeight || tpl.fontWeight || '700',
      fontStyle: slideStyle.fontStyle || deckStyle.fontStyle || tpl.fontStyle || 'normal',
      textDecoration: slideStyle.textDecoration || deckStyle.textDecoration || tpl.textDecoration || 'none',
      textTransform: slideStyle.textTransform || deckStyle.textTransform || tpl.textTransform || 'none',
      textAlign: slideStyle.textAlign || deckStyle.textAlign || tpl.textAlign || 'center',
      verticalAlign,
      posY,
      lineHeight: slideStyle.lineHeight || deckStyle.lineHeight || tpl.lineHeight || 1.25,
      letterSpacing: slideStyle.letterSpacing !== undefined ? slideStyle.letterSpacing : (deckStyle.letterSpacing !== undefined ? deckStyle.letterSpacing : (tpl.letterSpacing || 0)),
      outlineEnable,
      outlineColor,
      outlineWidth,
      webkitTextStroke: outlineEnable ? `${outlineWidth}px ${outlineColor}` : 'none',
      shadowEnable,
      shadowColor,
      shadowBlur,
      shadowOffsetY,
      textShadow: shadowEnable ? `0 ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}` : 'none',
      bgBoxEnable,
      bgBoxColor,
      bgBoxOpacity,
      bgBoxPadding,
      bgBoxRadius,
      bgColor,
      padding,
      borderRadius,
      maxLines: slideStyle.maxLines !== undefined ? slideStyle.maxLines : (deckStyle.maxLines !== undefined ? deckStyle.maxLines : (tpl.maxLines || 0))
    };
  }

  buildEditorThumbInlineStyle(slideStyle) {
    return `font-family: ${slideStyle.fontFamily || 'Inter, sans-serif'}; font-size: calc(${slideStyle.fontSize || 52} * 0.0521cqw); letter-spacing: calc(${slideStyle.letterSpacing || 0} * 0.0521cqw); line-height: ${slideStyle.lineHeight || 1.25}; color: ${slideStyle.color || '#ffffff'}; font-weight: ${slideStyle.fontWeight || '700'}; font-style: ${slideStyle.fontStyle || 'normal'}; text-decoration: ${slideStyle.textDecoration || 'none'}; text-transform: ${slideStyle.textTransform || 'none'}; text-align: ${slideStyle.textAlign || 'center'}; text-shadow: ${slideStyle.textShadow || 'none'}; -webkit-text-stroke: ${slideStyle.webkitTextStroke || 'none'}; background-color: ${slideStyle.bgColor || 'transparent'}; padding: calc(${slideStyle.padding || 16} * 0.025cqw) calc(${slideStyle.padding || 16} * 0.045cqw); border-radius: calc(${slideStyle.borderRadius || 6} * 0.04cqw); box-sizing: border-box; white-space: pre-wrap; word-break: normal; overflow-wrap: normal; ${slideStyle.maxLines > 0 ? `display: -webkit-box; -webkit-line-clamp: ${slideStyle.maxLines}; -webkit-box-orient: vertical; overflow: hidden;` : 'display: inline-block;'}`;
  }

  updateEditorSlidesListStylesInPlace(deck) {
    const listEl = document.getElementById('editor-slides-list');
    if (!listEl || !deck) return false;
    const cards = listEl.querySelectorAll('.editor-slide-thumb-card');
    const totalSlides = (deck.groups || []).reduce((acc, g) => acc + (g.slides?.length || 0), 0);
    if (cards.length !== totalSlides) return false;

    cards.forEach(card => {
      const gIdx = parseInt(card.getAttribute('data-gidx'));
      const sIdx = parseInt(card.getAttribute('data-sidx'));
      const slide = deck.groups?.[gIdx]?.slides?.[sIdx];
      if (!slide) return;
      const slideStyle = this.getSlideEffectiveStyle(deck, slide);
      const wrapperEl = card.querySelector('.editor-slide-thumb-text-wrapper');
      const textEl = card.querySelector('.editor-slide-thumb-text');
      if (wrapperEl) {
        wrapperEl.style.top = `${slideStyle.posY !== undefined ? slideStyle.posY : 50}%`;
        wrapperEl.style.textAlign = slideStyle.textAlign || 'center';
      }
      if (textEl) {
        textEl.setAttribute('style', this.buildEditorThumbInlineStyle(slideStyle));
      }
    });
    return true;
  }

  renderEditorSlidesList(deck) {
    const listEl = document.getElementById('editor-slides-list');
    const countEl = document.getElementById('editor-slides-count');
    if (!listEl) return;

    const groups = deck.groups || [];
    let globalSlideNum = 1;
    let html = '';

    groups.forEach((group, gIdx) => {
      const slides = group.slides || [];
      slides.forEach((slide, sIdx) => {
        const isCurrent = gIdx === this.currentEditorGroupIndex && sIdx === this.currentEditorSlideIndex;
        const textPreview = (slide.text || '').replace(/<[^>]*>/g, '');
        const badgeClass = group.badge || 'badge-verse';
        const sectionName = group.name || `Estrofa ${gIdx + 1}`;
        const slideStyle = this.getSlideEffectiveStyle(deck, slide);

        html += `
          <div class="editor-slide-thumb-card ${isCurrent ? 'active' : ''}" data-gidx="${gIdx}" data-sidx="${sIdx}">
            <div class="editor-slide-thumb-header">
              <div class="editor-slide-thumb-meta">
                <span class="editor-slide-num-badge">${globalSlideNum++}</span>
                <span class="editor-slide-section-badge ${badgeClass}">${this.escapeHtml(sectionName)}</span>
              </div>
              <div class="editor-slide-thumb-actions">
                <button type="button" class="btn-slide-thumb-action btn-move-slide-up" data-gidx="${gIdx}" data-sidx="${sIdx}" title="Subir">${iconSvg('arrow-up', { size: 11 })}</button>
                <button type="button" class="btn-slide-thumb-action btn-move-slide-down" data-gidx="${gIdx}" data-sidx="${sIdx}" title="Bajar">${iconSvg('arrow-down', { size: 11 })}</button>
                <button type="button" class="btn-slide-thumb-action btn-dup-slide-card" data-gidx="${gIdx}" data-sidx="${sIdx}" title="Duplicar">${iconSvg('copy', { size: 11 })}</button>
                <button type="button" class="btn-slide-thumb-action btn-del-slide-card" data-gidx="${gIdx}" data-sidx="${sIdx}" title="Eliminar">${iconSvg('x', { size: 11 })}</button>
              </div>
            </div>
            <div class="editor-slide-thumb-preview-box">
              <div class="editor-slide-thumb-text-wrapper" style="position: absolute; left: 5%; right: 5%; top: ${slideStyle.posY !== undefined ? slideStyle.posY : 50}%; transform: translateY(-50%); text-align: ${slideStyle.textAlign || 'center'}; pointer-events: none; z-index: 2;">
                <div class="editor-slide-thumb-text" style="${this.buildEditorThumbInlineStyle(slideStyle)}">${textPreview ? this.escapeHtml(textPreview).replace(/\n/g, '<br/>') : '<em style="opacity:0.4;">[Vacía]</em>'}</div>
              </div>
            </div>
          </div>
        `;
      });
    });

    listEl.innerHTML = html;
    if (countEl) countEl.textContent = String(globalSlideNum - 1);

    // Selección al hacer clic en tarjeta
    listEl.querySelectorAll('.editor-slide-thumb-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-slide-thumb-action')) return;
        const gIdx = parseInt(card.getAttribute('data-gidx'));
        const sIdx = parseInt(card.getAttribute('data-sidx'));
        this.selectEditorSlide(gIdx, sIdx);
      });
    });

    // Botones de acción en miniatura
    listEl.querySelectorAll('.btn-move-slide-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gIdx = parseInt(btn.getAttribute('data-gidx'));
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        store.moveSlide(deck.id, gIdx, sIdx, 'up');
        this.renderEditorSlidesList(deck);
      });
    });

    listEl.querySelectorAll('.btn-move-slide-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gIdx = parseInt(btn.getAttribute('data-gidx'));
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        store.moveSlide(deck.id, gIdx, sIdx, 'down');
        this.renderEditorSlidesList(deck);
      });
    });

    listEl.querySelectorAll('.btn-dup-slide-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gIdx = parseInt(btn.getAttribute('data-gidx'));
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        store.duplicateSlide(deck.id, gIdx, sIdx);
        this.renderEditorSlidesList(deck);
      });
    });

    listEl.querySelectorAll('.btn-del-slide-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gIdx = parseInt(btn.getAttribute('data-gidx'));
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        store.deleteSlide(deck.id, gIdx, sIdx);
        this.selectEditorSlide(0, 0);
      });
    });
  }

  renderEditorCenterCanvas(deck) {
    if (!deck) return;
    const gIdx = this.currentEditorGroupIndex;
    const sIdx = this.currentEditorSlideIndex;
    const group = deck.groups[gIdx] || deck.groups[0];
    if (!group) return;
    const slide = group.slides[sIdx] || group.slides[0];
    if (!slide) return;

    // 1. Etiqueta de navegación
    const totalSlides = deck.groups.reduce((acc, g) => acc + (g.slides?.length || 0), 0);
    let currentGlobalNum = 1;
    for (let i = 0; i < gIdx; i++) currentGlobalNum += deck.groups[i].slides.length;
    currentGlobalNum += sIdx;

    const posLabel = document.getElementById('label-editor-slide-pos');
    if (posLabel) posLabel.textContent = `Filmina ${currentGlobalNum} de ${totalSlides}`;

    // 2. Sección actual
    const secSelect = document.getElementById('select-editor-current-section');
    const secNameInput = document.getElementById('input-editor-section-name');
    if (secSelect) {
      let matched = Array.from(secSelect.options).find(o => o.value.startsWith(group.badge || 'badge-verse'));
      if (matched) secSelect.value = matched.value;
    }
    if (secNameInput) {
      secNameInput.value = group.name || '';
    }

    // 3. Fondo opcional de lienzo
    const bgEl = document.getElementById('editor-canvas-bg');
    if (bgEl) {
      if (store.state.activeVideoUrl && store.state.activeVideoIsImage) {
        bgEl.style.backgroundImage = `url("${store.state.activeVideoUrl}")`;
      } else {
        bgEl.style.backgroundImage = 'none';
      }
    }

    // 4. Textbox y Bounding Box (FreeShow)
    const textbox = document.getElementById('editor-canvas-textbox');
    const boundingBox = document.getElementById('editor-bounding-box');
    const style = this.getSlideEffectiveStyle(deck, slide);

    if (textbox) {
      if (document.activeElement !== textbox) {
        textbox.innerText = slide.text || '';
      }
      let effectiveFontSize = Number(style.fontSize) || 56;
      const charCount = (slide.text || '').length;
      const lineCount = (slide.text || '').split('\n').length;
      if (style.autoSize === 'shrink' && (charCount > 110 || lineCount > 4)) {
        effectiveFontSize = Math.max(22, Math.round(effectiveFontSize * Math.min(110 / charCount, 4 / lineCount)));
      } else if (style.autoSize === 'fit') {
        if (charCount > 0 && charCount < 40 && lineCount <= 2) {
          effectiveFontSize = Math.min(110, Math.round(effectiveFontSize * 1.25));
        } else if (charCount > 100 || lineCount > 4) {
          effectiveFontSize = Math.max(22, Math.round(effectiveFontSize * 0.78));
        }
      }

      const basePadding = style.padding !== undefined ? style.padding : 16;
      const baseRadius = style.borderRadius !== undefined ? style.borderRadius : 6;

      textbox.style.fontFamily = style.fontFamily;
      textbox.style.fontSize = `calc(${effectiveFontSize} * 0.0521cqw)`;
      textbox.style.color = style.color;
      textbox.style.fontWeight = style.fontWeight;
      textbox.style.fontStyle = style.fontStyle;
      textbox.style.textDecoration = style.textDecoration;
      textbox.style.textTransform = style.textTransform;
      textbox.style.textAlign = style.textAlign;
      textbox.style.lineHeight = String(style.lineHeight);
      textbox.style.letterSpacing = `calc(${style.letterSpacing || 0} * 0.0521cqw)`;
      textbox.style.backgroundColor = style.bgColor || 'transparent';
      textbox.style.padding = `calc(${basePadding} * 0.025cqw) calc(${basePadding} * 0.045cqw)`;
      textbox.style.borderRadius = `calc(${baseRadius} * 0.04cqw)`;

      // Sombra
      if (style.shadowEnable) {
        textbox.style.textShadow = `0 ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}`;
      } else {
        textbox.style.textShadow = 'none';
      }

      // Contorno
      if (style.outlineEnable) {
        textbox.style.webkitTextStroke = `${style.outlineWidth}px ${style.outlineColor}`;
      } else {
        textbox.style.webkitTextStroke = 'none';
      }

      // Caja contenedora (Bounding Box al 90% del ancho de pantalla: left 5%, right 5%)
      if (boundingBox) {
        boundingBox.style.left = '5%';
        boundingBox.style.right = '5%';
        boundingBox.style.padding = '0';
        boundingBox.style.backgroundColor = 'transparent';
        boundingBox.style.borderRadius = '4px';
        boundingBox.style.top = `${style.posY !== undefined ? style.posY : 50}%`;
        boundingBox.style.bottom = 'auto';
        boundingBox.style.transform = 'translateY(-50%)';
      }
    }
  }

  populateEditorInspector(deck) {
    if (!deck) return;
    const group = deck.groups[this.currentEditorGroupIndex] || deck.groups[0];
    const slide = group?.slides[this.currentEditorSlideIndex] || group?.slides[0];
    const style = this.getSlideEffectiveStyle(deck, slide);

    // Tipografía
    const fontSelect = document.getElementById('ed-font-family');
    if (fontSelect) fontSelect.value = style.fontFamily;

    const colorInput = document.getElementById('ed-font-color');
    const colorHex = document.getElementById('ed-font-color-hex');
    if (colorInput) colorInput.value = style.color.startsWith('#') ? style.color : '#ffffff';
    if (colorHex) colorHex.textContent = colorInput ? colorInput.value.toUpperCase() : '#FFF';

    const sizeNum = document.getElementById('ed-font-size-num');
    const sizeRange = document.getElementById('ed-font-size-range');
    if (sizeNum) sizeNum.value = style.fontSize;
    if (sizeRange) sizeRange.value = style.fontSize;

    const autoSizeSelect = document.getElementById('ed-auto-size');
    if (autoSizeSelect) autoSizeSelect.value = style.autoSize || 'none';

    // Botones de Formato
    document.getElementById('ed-btn-bold')?.classList.toggle('active', style.fontWeight === '700' || style.fontWeight === 'bold');
    document.getElementById('ed-btn-italic')?.classList.toggle('active', style.fontStyle === 'italic');
    document.getElementById('ed-btn-underline')?.classList.toggle('active', style.textDecoration === 'underline');
    document.getElementById('ed-btn-strike')?.classList.toggle('active', style.textDecoration === 'line-through');
    document.getElementById('ed-btn-uppercase')?.classList.toggle('active', style.textTransform === 'uppercase');

    // Alineación Horizontal
    document.querySelectorAll('.ed-align-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-align') === style.textAlign);
    });

    // Posición Vertical
    document.querySelectorAll('.ed-valign-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-valign') === style.verticalAlign);
    });

    // Párrafos y Espaciado
    const lhSelect = document.getElementById('ed-line-height');
    if (lhSelect) lhSelect.value = String(style.lineHeight);

    const lsInput = document.getElementById('ed-letter-spacing');
    if (lsInput) lsInput.value = style.letterSpacing;

    const mlSelect = document.getElementById('ed-max-lines');
    if (mlSelect) mlSelect.value = String(style.maxLines || 0);

    // Contorno
    const outCheck = document.getElementById('ed-outline-enable');
    const outColor = document.getElementById('ed-outline-color');
    const outWidth = document.getElementById('ed-outline-width');
    const valOutWidth = document.getElementById('val-ed-outline-width');
    if (outCheck) outCheck.checked = !!style.outlineEnable;
    if (outColor) outColor.value = style.outlineColor || '#000000';
    if (outWidth) outWidth.value = style.outlineWidth || 2;
    if (valOutWidth) valOutWidth.textContent = `${style.outlineWidth || 2}px`;

    // Sombra
    const shCheck = document.getElementById('ed-shadow-enable');
    const shColor = document.getElementById('ed-shadow-color');
    const shBlur = document.getElementById('ed-shadow-blur');
    const valShBlur = document.getElementById('val-ed-shadow-blur');
    const shOffY = document.getElementById('ed-shadow-offset-y');
    const valShOffY = document.getElementById('val-ed-shadow-offset-y');
    if (shCheck) shCheck.checked = !!style.shadowEnable;
    if (shColor) shColor.value = style.shadowColor.startsWith('#') ? style.shadowColor : '#000000';
    if (shBlur) shBlur.value = style.shadowBlur !== undefined ? style.shadowBlur : 14;
    if (valShBlur) valShBlur.textContent = `${style.shadowBlur || 14}px`;
    if (shOffY) shOffY.value = style.shadowOffsetY !== undefined ? style.shadowOffsetY : 4;
    if (valShOffY) valShOffY.textContent = `${style.shadowOffsetY || 4}px`;

    // Caja de Fondo
    const bgCheck = document.getElementById('ed-bgbox-enable');
    const bgColor = document.getElementById('ed-bgbox-color');
    const bgOpacity = document.getElementById('ed-bgbox-opacity');
    const valBgOpacity = document.getElementById('val-ed-bgbox-opacity');
    const bgPadding = document.getElementById('ed-bgbox-padding');
    const valBgPadding = document.getElementById('val-ed-bgbox-padding');
    const bgRadius = document.getElementById('ed-bgbox-radius');
    const valBgRadius = document.getElementById('val-ed-bgbox-radius');
    if (bgCheck) bgCheck.checked = !!style.bgBoxEnable;
    if (bgColor) bgColor.value = style.bgBoxColor.startsWith('#') ? style.bgBoxColor : '#000000';
    if (bgOpacity) bgOpacity.value = style.bgBoxOpacity || 40;
    if (valBgOpacity) valBgOpacity.textContent = `${style.bgBoxOpacity || 40}%`;
    if (bgPadding) bgPadding.value = style.bgBoxPadding || 20;
    if (valBgPadding) valBgPadding.textContent = `${style.bgBoxPadding || 20}px`;
    if (bgRadius) bgRadius.value = style.bgBoxRadius || 8;
    if (valBgRadius) valBgRadius.textContent = `${style.bgBoxRadius || 8}px`;

    // Plantillas
    const tplSelect = document.getElementById('ed-deck-template');
    if (tplSelect) {
      tplSelect.innerHTML = (store.templates || []).map(t =>
        `<option value="${t.id}" ${t.id === (deck.templateId || store.activeTemplateId) ? 'selected' : ''}>${t.name}</option>`
      ).join('');
    }

    // Categoría
    const catSelect = document.getElementById('ed-deck-category-select');
    if (catSelect) catSelect.value = deck.category || 'Alabanza';
  }

  applyEditorInspectorChanges() {
    if (!this.currentEditorDeckId) return;
    const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
    if (!deck) return;

    const group = deck.groups[this.currentEditorGroupIndex];
    const slide = group?.slides[this.currentEditorSlideIndex];
    if (!slide) return;

    const scope = document.querySelector('input[name="ed-scope"]:checked')?.value || 'all';
    this.currentEditorScope = scope;

    // Recolectar valores actuales
    const fontFamily = document.getElementById('ed-font-family')?.value || 'Inter, sans-serif';
    const color = document.getElementById('ed-font-color')?.value || '#ffffff';
    const fontSize = parseInt(document.getElementById('ed-font-size-num')?.value || 56);
    const autoSize = document.getElementById('ed-auto-size')?.value || 'none';
    const fontWeight = document.getElementById('ed-btn-bold')?.classList.contains('active') ? '700' : '400';
    const fontStyle = document.getElementById('ed-btn-italic')?.classList.contains('active') ? 'italic' : 'normal';
    const textDecoration = document.getElementById('ed-btn-underline')?.classList.contains('active')
      ? 'underline'
      : (document.getElementById('ed-btn-strike')?.classList.contains('active') ? 'line-through' : 'none');
    const textTransform = document.getElementById('ed-btn-uppercase')?.classList.contains('active') ? 'uppercase' : 'none';

    const activeAlignBtn = document.querySelector('.ed-align-btn.active');
    const textAlign = activeAlignBtn ? activeAlignBtn.getAttribute('data-align') : 'center';

    const activeValignBtn = document.querySelector('.ed-valign-btn.active');
    const verticalAlign = activeValignBtn ? activeValignBtn.getAttribute('data-valign') : 'center';

    const lineHeight = parseFloat(document.getElementById('ed-line-height')?.value || 1.25);
    const letterSpacing = parseFloat(document.getElementById('ed-letter-spacing')?.value || 0);
    const maxLines = parseInt(document.getElementById('ed-max-lines')?.value || 0);

    const outlineEnable = !!document.getElementById('ed-outline-enable')?.checked;
    const outlineColor = document.getElementById('ed-outline-color')?.value || '#000000';
    const outlineWidth = parseInt(document.getElementById('ed-outline-width')?.value || 2);

    const shadowEnable = !!document.getElementById('ed-shadow-enable')?.checked;
    const shadowColor = document.getElementById('ed-shadow-color')?.value || 'rgba(0,0,0,0.9)';
    const shadowBlur = parseInt(document.getElementById('ed-shadow-blur')?.value || 14);
    const shadowOffsetY = parseInt(document.getElementById('ed-shadow-offset-y')?.value || 4);

    const bgBoxEnable = !!document.getElementById('ed-bgbox-enable')?.checked;
    const bgBoxColor = document.getElementById('ed-bgbox-color')?.value || '#000000';
    const bgBoxOpacity = parseInt(document.getElementById('ed-bgbox-opacity')?.value || 40);
    const bgBoxPadding = parseInt(document.getElementById('ed-bgbox-padding')?.value || 20);
    const bgBoxRadius = parseInt(document.getElementById('ed-bgbox-radius')?.value || 8);

    const updatedStyle = {
      fontFamily,
      color,
      fontSize,
      autoSize,
      fontWeight,
      fontStyle,
      textDecoration,
      textTransform,
      textAlign,
      verticalAlign,
      lineHeight,
      letterSpacing,
      maxLines,
      outlineEnable,
      outlineColor,
      outlineWidth,
      shadowEnable,
      shadowColor,
      shadowBlur,
      shadowOffsetY,
      bgBoxEnable,
      bgBoxColor,
      bgBoxOpacity,
      bgBoxPadding,
      bgBoxRadius
    };

    if (scope === 'all') {
      store.updateDeckStyle(deck.id, updatedStyle);
    } else {
      slide.style = { ...(slide.style || {}), ...updatedStyle };
      if (store.state.liveSlideId === slide.id) {
        store.state.activeTemplate = store.buildEffectiveTemplateForSlide(deck, slide);
      }
      store.notify();
    }

    // Actualizar hex y labels
    const colorHex = document.getElementById('ed-font-color-hex');
    if (colorHex) colorHex.textContent = color.toUpperCase();
    const valOut = document.getElementById('val-ed-outline-width');
    if (valOut) valOut.textContent = `${outlineWidth}px`;
    const valBlur = document.getElementById('val-ed-shadow-blur');
    if (valBlur) valBlur.textContent = `${shadowBlur}px`;
    const valOffY = document.getElementById('val-ed-shadow-offset-y');
    if (valOffY) valOffY.textContent = `${shadowOffsetY}px`;
    const valBgOp = document.getElementById('val-ed-bgbox-opacity');
    if (valBgOp) valBgOp.textContent = `${bgBoxOpacity}%`;
    const valBgPad = document.getElementById('val-ed-bgbox-padding');
    if (valBgPad) valBgPad.textContent = `${bgBoxPadding}px`;
    const valBgRad = document.getElementById('val-ed-bgbox-radius');
    if (valBgRad) valBgRad.textContent = `${bgBoxRadius}px`;

    // Re-renderizar lienzo y actualizar estilos de miniaturas in-place
    this.renderEditorCenterCanvas(deck);
    if (!this.updateEditorSlidesListStylesInPlace(deck)) {
      this.renderEditorSlidesList(deck);
    }
  }

  renderEditorLyricsDiff() {
    const diffContainer = document.getElementById('editor-lyrics-diff');
    const textarea = document.getElementById('editor-lyrics-textarea');
    if (!diffContainer || !textarea) return;

    const currentText = textarea.value || '';
    const currentLines = currentText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const original = this.originalEditLines || [];

    if (original.length === 0) {
      diffContainer.innerHTML = currentLines.map(l =>
        `<div style="color: #4ade80; padding: 2px 0;">+ ${this.escapeHtml(l)}</div>`
      ).join('');
      return;
    }

    const currentSet = new Set(currentLines);
    const origSet = new Set(original);

    let html = '';
    currentLines.forEach(l => {
      if (origSet.has(l)) {
        html += `<div style="color: #94a3b8; padding: 2px 0;">  ${this.escapeHtml(l)}</div>`;
      } else {
        html += `<div style="color: #4ade80; font-weight: 700; background: rgba(74, 222, 128, 0.1); padding: 2px 6px; border-radius: 3px;">+ ${this.escapeHtml(l)} (NUEVA)</div>`;
      }
    });

    original.forEach(l => {
      if (!currentSet.has(l)) {
        html += `<div style="color: #f87171; text-decoration: line-through; background: rgba(239, 68, 68, 0.12); padding: 2px 6px; border-radius: 3px;">- ${this.escapeHtml(l)} (SE BORRA)</div>`;
      }
    });

    diffContainer.innerHTML = html;
  }

  initFullScreenEditorEvents() {
    if (this.fullScreenEditorInitialized) return;
    this.fullScreenEditorInitialized = true;

    // 1. Escritura directa en Lienzo (WYSIWYG en vivo)
    const textbox = document.getElementById('editor-canvas-textbox');
    textbox?.addEventListener('input', () => {
      const text = textbox.innerText;
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (deck && deck.groups && deck.groups[this.currentEditorGroupIndex]?.slides[this.currentEditorSlideIndex]) {
        deck.groups[this.currentEditorGroupIndex].slides[this.currentEditorSlideIndex].text = text;
        const activeThumb = document.querySelector(`.editor-slide-thumb-card[data-gidx="${this.currentEditorGroupIndex}"][data-sidx="${this.currentEditorSlideIndex}"] .editor-slide-thumb-text`);
        if (activeThumb) {
          activeThumb.innerHTML = text ? this.escapeHtml(text).replace(/\n/g, '<br/>') : '<em style="opacity:0.4;">[Vacía]</em>';
        }

        if (store.state.liveSlideId === deck.groups[this.currentEditorGroupIndex].slides[this.currentEditorSlideIndex].id) {
          store.state.liveText = text;
          store.notify();
        }
      }
    });

    // 2. Guardar y Salir
    const saveAndClose = () => {
      this.closeFullScreenSongEditor();
      this.showToast("Cambios guardados exitosamente.", "success");
    };

    document.getElementById('btn-editor-save')?.addEventListener('click', saveAndClose);
    document.getElementById('btn-editor-quick-save')?.addEventListener('click', saveAndClose);
    document.getElementById('btn-editor-close')?.addEventListener('click', () => {
      this.closeFullScreenSongEditor();
    });

    // 3. Sub-Pestañas del Editor (Lienzo vs Texto Completo)
    document.querySelectorAll('#view-full-editor .editor-sub-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('#view-full-editor .editor-sub-tab').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const tab = tabBtn.getAttribute('data-ed-tab');
        this.currentEditorSubTab = tab;

        const canvasMode = document.getElementById('editor-view-canvas-mode');
        const lyricsMode = document.getElementById('editor-view-lyrics-mode');
        const deck = store.decks.find(d => d.id === this.currentEditorDeckId);

        if (tab === 'lyrics') {
          if (canvasMode) canvasMode.style.display = 'none';
          if (lyricsMode) lyricsMode.style.display = 'block';

          // Cargar texto completo
          const textarea = document.getElementById('editor-lyrics-textarea');
          if (textarea && deck) {
            const fullText = (deck.groups || [])
              .map(g => `${g.name}:\n` + (g.slides || []).map(s => (s.text || '').replace(/<br\s*\/?>/gi, '\n')).join('\n\n'))
              .join('\n\n');
            textarea.value = fullText;
            this.originalEditLines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            this.renderEditorLyricsDiff();
          }
        } else {
          if (canvasMode) canvasMode.style.display = 'flex';
          if (lyricsMode) lyricsMode.style.display = 'none';
          if (deck) {
            this.renderEditorSlidesList(deck);
            this.renderEditorCenterCanvas(deck);
          }
        }
      });
    });

    // Letras textarea input
    document.getElementById('editor-lyrics-textarea')?.addEventListener('input', (e) => {
      this.renderEditorLyricsDiff();
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (deck) {
        const parsedGroups = parseAndSplitText(e.target.value || '');
        if (parsedGroups && parsedGroups.length > 0) {
          deck.groups = parsedGroups;
          this.renderEditorHeader(deck);
          this.renderEditorSlidesList(deck);
        }
      }
    });

    // 4. Navegación entre filminas
    document.getElementById('btn-editor-prev-slide')?.addEventListener('click', () => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (!deck) return;
      if (this.currentEditorSlideIndex > 0) {
        this.selectEditorSlide(this.currentEditorGroupIndex, this.currentEditorSlideIndex - 1);
      } else if (this.currentEditorGroupIndex > 0) {
        const prevGroup = deck.groups[this.currentEditorGroupIndex - 1];
        this.selectEditorSlide(this.currentEditorGroupIndex - 1, (prevGroup.slides?.length || 1) - 1);
      }
    });

    document.getElementById('btn-editor-next-slide')?.addEventListener('click', () => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (!deck) return;
      const curGroup = deck.groups[this.currentEditorGroupIndex];
      if (this.currentEditorSlideIndex < (curGroup.slides?.length || 1) - 1) {
        this.selectEditorSlide(this.currentEditorGroupIndex, this.currentEditorSlideIndex + 1);
      } else if (this.currentEditorGroupIndex < (deck.groups?.length || 1) - 1) {
        this.selectEditorSlide(this.currentEditorGroupIndex + 1, 0);
      }
    });

    // 5. Botones de acción de filmina
    const handleAddSlide = () => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (!deck) return;
      const res = store.addSlideToDeck(deck.id, this.currentEditorGroupIndex, "Nueva diapositiva");
      if (res) {
        this.selectEditorSlide(res.groupIndex, res.slideIndex);
      }
    };
    document.getElementById('btn-editor-add-slide')?.addEventListener('click', handleAddSlide);
    document.getElementById('btn-editor-add-slide-top')?.addEventListener('click', handleAddSlide);

    document.getElementById('btn-editor-dup-slide')?.addEventListener('click', () => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (!deck) return;
      store.duplicateSlide(deck.id, this.currentEditorGroupIndex, this.currentEditorSlideIndex);
      this.selectEditorSlide(this.currentEditorGroupIndex, this.currentEditorSlideIndex + 1);
    });

    document.getElementById('btn-editor-del-slide')?.addEventListener('click', () => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (!deck) return;
      store.deleteSlide(deck.id, this.currentEditorGroupIndex, this.currentEditorSlideIndex);
      this.selectEditorSlide(0, 0);
    });

    document.getElementById('btn-editor-split-slide')?.addEventListener('click', () => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (!deck) return;
      const group = deck.groups[this.currentEditorGroupIndex];
      const slide = group?.slides[this.currentEditorSlideIndex];
      if (!slide || !slide.text) return;

      const lines = slide.text.split('\n');
      if (lines.length <= 1) {
        this.showToast("La diapositiva contiene una sola línea, no es necesario dividir.", "info");
        return;
      }
      const mid = Math.ceil(lines.length / 2);
      const text1 = lines.slice(0, mid).join('\n');
      const text2 = lines.slice(mid).join('\n');

      slide.text = text1;
      group.slides.splice(this.currentEditorSlideIndex + 1, 0, {
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: text2,
        isLowerThird: slide.isLowerThird || false
      });
      store.notify();
      this.selectEditorSlide(this.currentEditorGroupIndex, this.currentEditorSlideIndex + 1);
    });

    // 6. Cambio de sección de filmina
    document.getElementById('select-editor-current-section')?.addEventListener('change', (e) => {
      const val = e.target.value;
      const [badge, defaultName] = val.split('|');
      const nameInput = document.getElementById('input-editor-section-name');
      const name = nameInput?.value.trim() || defaultName;
      store.setGroupSection(this.currentEditorDeckId, this.currentEditorGroupIndex, name, badge);
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (deck) {
        this.renderEditorSlidesList(deck);
      }
    });

    document.getElementById('input-editor-section-name')?.addEventListener('blur', (e) => {
      const name = e.target.value.trim();
      if (!name) return;
      const secSelect = document.getElementById('select-editor-current-section');
      const badge = secSelect ? secSelect.value.split('|')[0] : 'badge-verse';
      store.setGroupSection(this.currentEditorDeckId, this.currentEditorGroupIndex, name, badge);
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (deck) {
        this.renderEditorSlidesList(deck);
      }
    });

    // 7. Inspector de Estilos: inputs y sliders
    const inspectorInputs = [
      'ed-font-family', 'ed-font-color', 'ed-font-size-num', 'ed-font-size-range', 'ed-auto-size',
      'ed-line-height', 'ed-letter-spacing', 'ed-max-lines',
      'ed-outline-enable', 'ed-outline-color', 'ed-outline-width',
      'ed-shadow-enable', 'ed-shadow-color', 'ed-shadow-blur', 'ed-shadow-offset-y',
      'ed-bgbox-enable', 'ed-bgbox-color', 'ed-bgbox-opacity', 'ed-bgbox-padding', 'ed-bgbox-radius'
    ];

    inspectorInputs.forEach(id => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => {
        // Sincronizar font size num y range
        if (id === 'ed-font-size-range') {
          const num = document.getElementById('ed-font-size-num');
          if (num) num.value = el.value;
        } else if (id === 'ed-font-size-num') {
          const range = document.getElementById('ed-font-size-range');
          if (range) range.value = el.value;
        }
        this.applyEditorInspectorChanges();
      });
      el?.addEventListener('change', () => this.applyEditorInspectorChanges());
    });

    // Radios de alcance (Toda la Canción vs Solo esta Filmina)
    document.querySelectorAll('input[name="ed-scope"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.currentEditorScope = radio.value;
        const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
        if (deck) this.populateEditorInspector(deck);
      });
    });

    // Botones de formato rápido (Negrita, Cursiva, Subrayado, Tachado, Mayúsculas)
    ['ed-btn-bold', 'ed-btn-italic', 'ed-btn-underline', 'ed-btn-strike', 'ed-btn-uppercase'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        if (id === 'ed-btn-underline' && !btn.classList.contains('active')) {
          document.getElementById('ed-btn-strike')?.classList.remove('active');
        } else if (id === 'ed-btn-strike' && !btn.classList.contains('active')) {
          document.getElementById('ed-btn-underline')?.classList.remove('active');
        }
        btn.classList.toggle('active');
        this.applyEditorInspectorChanges();
      });
    });

    // Botones de Re-dividir / Reflow de Filminas
    const handleEditorReflow = () => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (!deck) return;
      const maxLinesSelect = document.getElementById('ed-max-lines');
      let maxLines = parseInt(maxLinesSelect?.value || 0);
      if (!maxLines || maxLines <= 0) {
        maxLines = 4;
        if (maxLinesSelect) maxLinesSelect.value = '4';
      }
      store.reflowDeckSlides(deck.id, maxLines);
      this.selectEditorSlide(0, 0);
      this.renderEditorHeader(deck);
      this.showToast(`Filminas re-divididas a máximo ${maxLines} líneas por diapositiva.`, "success");
    };
    document.getElementById('btn-editor-reflow')?.addEventListener('click', handleEditorReflow);
    document.getElementById('btn-ed-apply-reflow')?.addEventListener('click', handleEditorReflow);

    // Controles de Zoom del Lienzo Central
    const applyCanvasZoom = (zoomPct) => {
      this.currentEditorZoom = Math.max(50, Math.min(150, zoomPct));
      const viewport = document.getElementById('editor-canvas-viewport');
      const zoomLabel = document.getElementById('label-editor-canvas-zoom');
      if (viewport) {
        viewport.style.transform = `scale(${this.currentEditorZoom / 100})`;
        viewport.style.transformOrigin = 'center center';
      }
      if (zoomLabel) {
        zoomLabel.textContent = `${this.currentEditorZoom}%`;
      }
    };
    document.getElementById('btn-editor-zoom-out')?.addEventListener('click', () => {
      applyCanvasZoom((this.currentEditorZoom || 100) - 10);
    });
    document.getElementById('btn-editor-zoom-in')?.addEventListener('click', () => {
      applyCanvasZoom((this.currentEditorZoom || 100) + 10);
    });
    document.getElementById('btn-editor-zoom-fit')?.addEventListener('click', () => {
      applyCanvasZoom(100);
    });

    // Botones de alineación horizontal
    document.querySelectorAll('.ed-align-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ed-align-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.applyEditorInspectorChanges();
      });
    });

    // Botones de alineación vertical
    document.querySelectorAll('.ed-valign-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ed-valign-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.applyEditorInspectorChanges();
      });
    });

    // Pestañas del Inspector (Textbox vs Diapositiva)
    document.querySelectorAll('.editor-insp-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.editor-insp-tab').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const tab = tabBtn.getAttribute('data-insp-tab');
        document.querySelectorAll('.insp-panel').forEach(p => p.classList.remove('active'));
        if (tab === 'textbox') {
          document.getElementById('insp-panel-textbox')?.classList.add('active');
        } else {
          document.getElementById('insp-panel-item')?.classList.add('active');
        }
      });
    });

    // Acordeones colapsables
    document.querySelectorAll('.insp-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.insp-accordion')?.classList.toggle('open');
      });
    });

    // Aplicar plantilla preset
    document.getElementById('btn-ed-apply-template')?.addEventListener('click', () => {
      const tplId = document.getElementById('ed-deck-template')?.value;
      const tpl = store.templates.find(t => t.id === tplId);
      if (tpl && this.currentEditorDeckId) {
        const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
        if (deck) {
          deck.templateId = tpl.id;
          deck.style = { ...(deck.style || {}), ...tpl };
          store.notify();
          this.renderEditorCenterCanvas(deck);
          this.renderEditorSlidesList(deck);
          this.populateEditorInspector(deck);
          this.showToast(`Plantilla "${tpl.name}" aplicada a la canción.`, "success");
        }
      }
    });

    // Categoría de la canción
    document.getElementById('ed-deck-category-select')?.addEventListener('change', (e) => {
      const deck = store.decks.find(d => d.id === this.currentEditorDeckId);
      if (deck) {
        deck.category = e.target.value;
        store.notify();
        this.renderEditorHeader(deck);
      }
    });

    // Slider de zoom de miniaturas
    document.getElementById('input-editor-thumb-size')?.addEventListener('input', (e) => {
      const val = e.target.value;
      const listEl = document.getElementById('editor-slides-list');
      if (listEl) {
        listEl.style.setProperty('--thumb-size', `${val}px`);
      }
    });

    // Atajos de teclado en el editor
    document.addEventListener('keydown', (e) => {
      const appEl = document.getElementById('app');
      if (!appEl || !appEl.classList.contains('edit-mode-active')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeFullScreenSongEditor();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        this.saveCurrentEditorCanvasText();
        this.showToast("Cambios guardados correctamente.", "success");
      }
    });
  }

  renderSongEditDiff() {
    const diffPanel = document.getElementById('song-edit-diff-panel');
    const diffList = document.getElementById('song-edit-diff-list');
    const badgeKept = document.getElementById('badge-diff-kept');
    const badgeDeleted = document.getElementById('badge-diff-deleted');

    if (!diffPanel || !diffList) return;

    const rawText = this.inputShowText?.value || '';
    const currentLinesWithMeta = rawText
      .split(/\r?\n/)
      .map((line, rawIdx) => ({ text: line.trim(), rawIdx }))
      .filter(item => item.text.length > 0);

    const baseline = (Array.isArray(this.originalEditLines) && this.originalEditLines.length > 0)
      ? this.originalEditLines
      : currentLinesWithMeta.map(item => item.text);

    if (currentLinesWithMeta.length === 0 && baseline.length === 0) {
      diffPanel.style.display = 'none';
      diffList.innerHTML = '';
      return;
    }

    diffPanel.style.display = 'flex';

    // Count remaining occurrences from current lines to detect which baseline lines were deleted
    const remainingPool = [...currentLinesWithMeta.map(i => i.text)];
    const diffItems = [];
    let keptCount = 0;
    let deletedCount = 0;

    if (Array.isArray(this.originalEditLines) && this.originalEditLines.length > 0) {
      // Show current lines + any deleted original lines in order
      const usedCurrentIndices = new Set();
      this.originalEditLines.forEach((origLine) => {
        const matchIdx = currentLinesWithMeta.findIndex((c, idx) => !usedCurrentIndices.has(idx) && c.text === origLine);
        if (matchIdx !== -1) {
          usedCurrentIndices.add(matchIdx);
          keptCount++;
          diffItems.push({
            status: 'kept',
            text: origLine,
            rawIdx: currentLinesWithMeta[matchIdx].rawIdx
          });
        } else {
          deletedCount++;
          diffItems.push({
            status: 'deleted',
            text: origLine
          });
        }
      });

      // Also include newly added lines
      currentLinesWithMeta.forEach((c, idx) => {
        if (!usedCurrentIndices.has(idx)) {
          keptCount++;
          diffItems.push({
            status: 'kept',
            isNew: true,
            text: c.text,
            rawIdx: c.rawIdx
          });
        }
      });
    } else {
      // Creating a new song: establish baseline on first non-empty paste/edit or show active lines with delete button
      currentLinesWithMeta.forEach(c => {
        keptCount++;
        diffItems.push({
          status: 'kept',
          text: c.text,
          rawIdx: c.rawIdx
        });
      });
    }

    if (badgeKept) badgeKept.textContent = `✓ ${keptCount} se conservan`;
    if (badgeDeleted) badgeDeleted.innerHTML = `${iconSvg('trash-2', { size: 11 })} ${deletedCount} se borran`;

    diffList.innerHTML = diffItems.map((item, idx) => {
      const safeText = item.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (item.status === 'deleted') {
        return `
          <div class="diff-line-item deleted">
            <span class="diff-status-tag">SE BORRA</span>
            <span class="diff-line-text" title="${safeText}">${safeText}</span>
            <button type="button" class="btn-restore-line" data-restore-idx="${idx}" title="Restaurar esta línea al texto">↩ Restaurar</button>
          </div>
        `;
      }
      return `
        <div class="diff-line-item kept">
          <span class="diff-status-tag">${item.isNew ? 'NUEVO' : 'QUEDA'}</span>
          <span class="diff-line-text" title="${safeText}">${safeText}</span>
          <button type="button" class="btn-delete-line" data-raw-line-idx="${item.rawIdx}" title="Borrar esta línea de la canción">${iconSvg('trash-2', { size: 11 })} Borrar</button>
        </div>
      `;
    }).join('');

    diffList.querySelectorAll('.btn-delete-line').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const rawIdx = parseInt(btn.getAttribute('data-raw-line-idx'));
        if (isNaN(rawIdx) || !this.inputShowText) return;
        if (!this.originalEditLines || this.originalEditLines.length === 0) {
          this.originalEditLines = this.inputShowText.value
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(Boolean);
        }
        const allLines = this.inputShowText.value.split(/\r?\n/);
        allLines.splice(rawIdx, 1);
        this.inputShowText.value = allLines.join('\n');
        this.renderSongEditDiff();
      });
    });

    diffList.querySelectorAll('.btn-restore-line').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemIdx = parseInt(btn.getAttribute('data-restore-idx'));
        const item = diffItems[itemIdx];
        if (!item || !this.inputShowText) return;
        const cur = this.inputShowText.value.trim();
        this.inputShowText.value = cur ? `${cur}\n${item.text}` : item.text;
        this.renderSongEditDiff();
      });
    });
  }

  renderSlideEditDiff() {
    const previewEl = document.getElementById('slide-edit-diff-preview');
    if (!previewEl || !this.inputEditSlideText) return;

    const currentLines = this.inputEditSlideText.value
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    const origLines = Array.isArray(this.originalSlideEditLines) ? this.originalSlideEditLines : [];

    if (origLines.length === 0 && currentLines.length === 0) {
      previewEl.style.display = 'none';
      return;
    }

    previewEl.style.display = 'flex';
    const used = new Set();
    const rows = [];

    origLines.forEach(orig => {
      const mIdx = currentLines.findIndex((c, idx) => !used.has(idx) && c === orig);
      if (mIdx !== -1) {
        used.add(mIdx);
        rows.push({ status: 'kept', text: orig });
      } else {
        rows.push({ status: 'deleted', text: orig });
      }
    });

    currentLines.forEach((c, idx) => {
      if (!used.has(idx)) {
        rows.push({ status: 'kept', isNew: true, text: c });
      }
    });

    previewEl.innerHTML = rows.map(r => {
      const safe = r.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (r.status === 'deleted') {
        return `<div class="diff-line-item deleted"><span class="diff-status-tag">SE BORRA</span><span class="diff-line-text">${safe}</span></div>`;
      }
      return `<div class="diff-line-item kept"><span class="diff-status-tag">${r.isNew ? 'NUEVO' : 'QUEDA'}</span><span class="diff-line-text">${safe}</span></div>`;
    }).join('');
  }

  async initPhysicalFoldersSync() {
    if (!window.electronAPI) return;

    if (window.electronAPI.onPhysicalFolderUpdated) {
      window.electronAPI.onPhysicalFolderUpdated((payload) => {
        const folderPath = payload?.path || payload?.folderPath;
        const folderName = payload?.name || payload?.folderName;
        if (folderPath) {
          store.syncPhysicalFolderItems(folderPath, folderName, payload.files || []);
        }
      });
    }

    const savedFolders = store.state.physicalMediaFolders || [];
    if (savedFolders.length > 0 && window.electronAPI.syncPhysicalFolders) {
      try {
        const paths = savedFolders.map(f => f.path).filter(p => p && !p.startsWith('local-dir://'));
        if (paths.length > 0) {
          const synced = await window.electronAPI.syncPhysicalFolders(paths);
          const syncedList = Array.isArray(synced) ? synced : Object.values(synced || {});
          syncedList.forEach(folderData => {
            const fPath = folderData?.path || folderData?.folderPath;
            const fName = folderData?.name || folderData?.folderName;
            if (fPath) {
              store.syncPhysicalFolderItems(fPath, fName, folderData.files || []);
            }
          });
        }
      } catch (err) {
        console.warn("Error al sincronizar carpetas físicas al iniciar:", err);
      }
    }
  }

  async handleAddPhysicalFolder() {
    if (window.electronAPI && window.electronAPI.selectPhysicalFolder) {
      try {
        const res = await window.electronAPI.selectPhysicalFolder();
        const folderPath = res?.path || res?.folderPath;
        const folderName = res?.name || res?.folderName;
        if (folderPath) {
          store.addPhysicalMediaFolder(folderPath, folderName, res.files || []);
          this.selectedMediaFolder = `phys:${folderPath}`;
          const mediaTabBtn = document.querySelector('.res-tab[data-res="media"]');
          if (mediaTabBtn && !mediaTabBtn.classList.contains('active')) {
            mediaTabBtn.click();
          }
          this.showToast(`Carpeta física "${folderName}" vinculada en tiempo real.`, "success");
        }
      } catch (err) {
        console.warn("Error al vincular carpeta física:", err);
      }
    } else {
      document.getElementById('input-physical-folder-fallback')?.click();
    }
  }

  showToast(message, type = 'info') {
    if (!message) return;
    const container = document.getElementById('app-toast-container');
    if (!container) return;

    // Quitar emojis iniciales si los hubiera
    const cleanMsg = String(message).replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2700}-\u{27BF}\s]+/u, '').trim();

    let iconName = 'info';
    let iconColor = 'var(--accent-blue)';
    if (type === 'warn' || type === 'error') {
      iconName = 'alert-triangle';
      iconColor = 'var(--accent-gold)';
    } else if (type === 'success') {
      iconName = 'check-circle-2';
      iconColor = 'var(--accent-green)';
    }

    const toast = document.createElement('div');
    toast.className = `app-toast ${type === 'warn' ? 'toast-warn' : (type === 'success' ? 'toast-success' : '')}`;
    toast.style.display = 'inline-flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.innerHTML = `${iconSvg(iconName, { size: 16, color: iconColor })} <span>${cleanMsg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  ensureModalInteractive(modalEl, focusTargetEl = null) {
    // Clear any residual drag/resizer lock on body
    if (document.body) {
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.body.style.cursor = '';
    }

    // Restore OS/Electron webContents focus if stolen by secondary window or native dialog
    try {
      if (window.electronAPI && typeof window.electronAPI.focusMainWindow === 'function') {
        window.electronAPI.focusMainWindow();
      }
      window.focus();
    } catch (e) {}

    if (modalEl) {
      modalEl.style.pointerEvents = 'auto';
      const card = modalEl.querySelector('.modal-card');
      if (card) card.style.pointerEvents = 'auto';
    }

    if (focusTargetEl) {
      requestAnimationFrame(() => {
        try {
          focusTargetEl.disabled = false;
          focusTargetEl.readOnly = false;
          focusTargetEl.focus();
        } catch (e) {}
        setTimeout(() => {
          try {
            if (document.activeElement !== focusTargetEl && modalEl?.classList.contains('open')) {
              focusTargetEl.focus();
            }
          } catch (e) {}
        }, 45);
      });
    }
  }

  openEditSlideModal(target) {
    if (!target) return;
    this.pendingEditSlideTarget = target;
    const modal = document.getElementById('modal-edit-slide');
    const lblTarget = document.getElementById('lbl-edit-slide-target');
    const inputArea = document.getElementById('input-edit-slide-text');
    const inputSec = document.getElementById('input-edit-slide-section');

    const cleanSlideText = (target.text || '').replace(/<br\s*\/?>/gi, '\n');
    this.originalSlideEditLines = cleanSlideText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (lblTarget) lblTarget.textContent = target.name || 'Diapositiva';
    if (inputArea) inputArea.value = cleanSlideText;
    this.renderSlideEditDiff();

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

    if (modal) {
      modal.classList.add('open');
      this.ensureModalInteractive(modal, inputArea);
    }
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
      this.ensureModalInteractive(this.modalSectionPicker, this.inputCustomSectionName);
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

      const card = modal.querySelector('.modal-card');
      if (card) {
        card.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        card.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          const interactiveEl = e.target.closest('input, textarea, select');
          if (interactiveEl && !interactiveEl.disabled) {
            try {
              if (window.electronAPI && typeof window.electronAPI.focusMainWindow === 'function') {
                window.electronAPI.focusMainWindow();
              }
            } catch (err) {}
            setTimeout(() => {
              if (document.activeElement !== interactiveEl) {
                try { interactiveEl.focus(); } catch (err) {}
              }
            }, 0);
          }
        });
      }
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
    try {
      window.electronAPI?.focusMainWindow?.();
      window.focus();
    } catch (e) {}
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const openModal = document.querySelector('.modal-overlay.open');
      if (openModal) {
        if (e.code === 'Escape' || e.key === 'Escape') {
          e.preventDefault();
          this.closeAllModals();
        }
        return;
      }

      // Ignore keybindings if user is typing in input or editor
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        if (e.code === 'Escape' || e.key === 'Escape') {
          e.preventDefault();
          document.activeElement?.blur?.();
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
      { id: 'Alabanza', name: 'Alabanza', icon: 'music' },
      { id: 'Adoración', name: 'Adoración', icon: 'heart' },
      { id: 'Sermón', name: 'Sermones', icon: 'mic' },
      { id: 'Lectura', name: 'Escrituras / Lectura', icon: 'book-open' },
      { id: 'Anuncio', name: 'Anuncios / Avisos', icon: 'megaphone' },
      { id: 'Overlays Stream', name: 'Overlays Stream', icon: 'user' }
    ];

    const categoriesMap = new Map();
    defaultCategories.forEach(c => categoriesMap.set(c.id.toLowerCase(), c));

    decks.forEach(d => {
      const catName = d.category || d.type || 'General';
      const catKey = catName.toLowerCase();
      if (!categoriesMap.has(catKey)) {
        categoriesMap.set(catKey, { id: catName, name: catName, icon: 'file-text' });
      }
    });

    const categoryItems = Array.from(categoriesMap.values());
    const countsByCat = categoryItems.map(cat => {
      const targetLower = cat.id.toLowerCase();
      let count = 0;
      for (let i = 0; i < decks.length; i++) {
        const cLower = (decks[i].category || decks[i].type || '').toLowerCase();
        if (cLower.includes(targetLower) || targetLower.includes(cLower)) count++;
      }
      return count;
    });

    const catsKey = `${this.activeFilter}|${decks.length}|${categoryItems.map((c, idx) => `${c.id}:${countsByCat[idx]}`).join(',')}`;
    if (this._lastShowsCategoriesKey === catsKey) return;
    this._lastShowsCategoriesKey = catsKey;

    listEl.innerHTML = `
      <div class="filter-item ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
        <span class="filter-item-label"><span class="dot-indicator"></span> <span>Todos los Shows</span></span>
        <span class="count">${decks.length}</span>
      </div>
      ${categoryItems.map((cat, idx) => {
        const count = countsByCat[idx];
        const isActive = this.activeFilter.toLowerCase() === cat.id.toLowerCase();
        return `
          <div class="filter-item ${isActive ? 'active' : ''}" data-filter="${cat.id}">
            <span class="filter-item-label">${iconSvg(cat.icon, { size: 13, className: 'lucide-icon icon-cyan' })} <span>${cat.name}</span></span>
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

    const hasSearch = Boolean(this.searchQuery && this.searchQuery.trim().length > 0);

    const filteredDecks = decks.filter(deck => {
      const matchesSearch = !hasSearch || this.deckMatchesQuery(deck, this.searchQuery);

      let matchesFilter = true;
      if (!hasSearch && this.activeFilter && this.activeFilter !== 'all') {
        const catLower = this.normalizeSearchText(deck.category || deck.type || '');
        const filterLower = this.normalizeSearchText(this.activeFilter);
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

    const showsCacheKey = JSON.stringify(filteredDecks.map(d => d.id + d.title + d.category + (d.groups?.length || 0))) + '|' + this.searchQuery + '|' + this.activeFilter;

    if (this.lastShowsCacheKey !== showsCacheKey) {
      this.lastShowsCacheKey = showsCacheKey;

      if (filteredDecks.length === 0) {
        this.showsGridEl.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.78rem;">
            No se encontraron canciones o textos para "${this.searchQuery}".
          </div>
        `;
      } else {
        this.showsGridEl.innerHTML = filteredDecks.map(deck => {
          const isActive = deck.id === store.activeDeckId;
          const isInProject = store.projectDeckIds.includes(deck.id);
          const slideCount = deck.groups.reduce((acc, g) => acc + g.slides.length, 0);
          const firstSlide = deck.groups[0]?.slides[0] || {};
          const isPresentation = deck.type === 'presentation' || Boolean(firstSlide.image);
          const snippetText = firstSlide.text || (isPresentation ? `${iconSvg('presentation', { size: 12 })} Presentación visual (${deck.sourceName || 'PPT/PDF'})` : "Sin texto");
          const thumbPreview = isPresentation && (firstSlide.thumb || firstSlide.image)
            ? `<div style="height: 62px; margin-bottom: 6px; border-radius: 5px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;"><img src="${firstSlide.thumb || firstSlide.image}" style="width: 100%; height: 100%; object-fit: contain;" alt="" /></div>`
            : '';

          return `
            <div class="show-dock-card ${isActive ? 'active-dock-show' : ''}" data-deck-id="${deck.id}">
              <div class="show-card-top">
                <span class="show-card-title" title="${deck.title}">${isPresentation ? iconSvg('presentation', { size: 13, className: 'lucide-icon icon-gold' }) + ' ' : ''}${deck.title}</span>
                <span class="show-card-badge">${deck.category || 'General'}</span>
              </div>
              ${thumbPreview}
              <div class="show-card-snippet">${snippetText}</div>
              <div class="show-card-footer">
                <span class="show-card-slide-count">${slideCount} ${slideCount === 1 ? 'diapositiva' : 'diap.'}</span>
                <div class="show-card-actions">
                  ${!isPresentation ? `<button class="btn-edit-show-card" data-edit-id="${deck.id}" title="Editar canción (ver qué se borra y qué queda)">${iconSvg('pencil', { size: 11 })} <span>Editar</span></button>` : ''}
                  <button class="btn-toggle-project-show ${isInProject ? 'in-project' : ''}" data-project-id="${deck.id}" title="${isInProject ? 'Quitar del proyecto' : 'Agregar al proyecto'}">
                    ${isInProject ? `${iconSvg('check', { size: 11 })} <span>Proyecto</span>` : `${iconSvg('plus', { size: 11 })} <span>Proyecto</span>`}
                  </button>
                  <button class="btn-delete-show" data-delete-id="${deck.id}" title="Eliminar de la biblioteca base">${iconSvg('trash-2', { size: 12 })}</button>
                </div>
              </div>
            </div>
          `;
        }).join('');

        this.showsGridEl.querySelectorAll('.show-dock-card').forEach(card => {
          const id = card.getAttribute('data-deck-id');
          const deckObj = decks.find(d => d.id === id);
          card.addEventListener('click', (e) => {
            if (
              e.target.closest('.btn-delete-show') ||
              e.target.closest('.btn-toggle-project-show') ||
              e.target.closest('.btn-edit-show-card')
            ) return;
            store.setActiveDeck(id);
          });
          card.addEventListener('contextmenu', (e) => {
            if (deckObj) this.showContextMenu(e, { type: 'deck', id: deckObj.id, name: deckObj.title });
          });
        });

        this.showsGridEl.querySelectorAll('.btn-edit-show-card').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-edit-id');
            if (id) this.openEditDeckModal(id);
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

    // 1. Render Virtual & Physical Folders in the exact same Sub-sidebar list (sin "Todos los Medios")
    const folders = state.mediaFolders || ["General"];
    const physicalFolders = state.physicalMediaFolders || [];
    const defaultFolder = folders[0] || (physicalFolders[0] ? `phys:${physicalFolders[0].path}` : "General");
    if (!this.selectedMediaFolder || this.selectedMediaFolder === 'all') {
      this.selectedMediaFolder = defaultFolder;
    } else if (this.selectedMediaFolder.startsWith('phys:')) {
      const physPath = this.selectedMediaFolder.slice(5);
      if (!physicalFolders.some(pf => pf.path === physPath)) {
        this.selectedMediaFolder = defaultFolder;
      }
    } else if (!folders.includes(this.selectedMediaFolder)) {
      this.selectedMediaFolder = defaultFolder;
    }

    const allCount = state.mediaLibrary.length;
    const physCountsKey = physicalFolders.map(pf => {
      const c = state.mediaLibrary.filter(m => m.physicalFolderPath === pf.path).length;
      return `${pf.path}:${c}`;
    }).join(',');
    const folderCacheKey = JSON.stringify(folders) + '|' + physCountsKey + '|' + allCount + '|' + this.selectedMediaFolder;

    if (this.lastFolderCacheKey !== folderCacheKey) {
      this.lastFolderCacheKey = folderCacheKey;
      this.mediaFoldersListEl.innerHTML = `
        ${folders.map(folder => {
          const count = state.mediaLibrary.filter(m => m.folder === folder && !m.isPhysicalFolderItem).length;
          const isActive = this.selectedMediaFolder === folder;
          const isGeneral = folder === 'General';
          return `
            <div class="folder-item ${isActive ? 'active' : ''}" data-folder-name="${folder}" title="Carpeta Virtual: ${folder}">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">${iconSvg('folder', { size: 13, className: 'lucide-icon icon-cyan' })} ${folder}</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="count">${count}</span>
                ${!isGeneral ? `<button class="btn-delete-folder" data-folder="${folder}" title="Eliminar carpeta virtual" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; display: inline-flex; align-items: center; opacity: 0.6; transition: opacity 0.2s;">${iconSvg('trash-2', { size: 13, color: '#ef4444' })}</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
        ${physicalFolders.map(phys => {
          const folderKey = `phys:${phys.path}`;
          const count = state.mediaLibrary.filter(m => m.physicalFolderPath === phys.path).length;
          const isActive = this.selectedMediaFolder === folderKey;
          return `
            <div class="folder-item physical-folder ${isActive ? 'active' : ''}" data-folder-name="${folderKey}" title="Carpeta Física en Tiempo Real: ${phys.path}">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">${iconSvg('hard-drive', { size: 13, className: 'lucide-icon icon-green' })} ${phys.name}</span>
              <div style="display: flex; align-items: center; gap: 5px;">
                <span class="phys-live-badge" title="Sincronizada en tiempo real con el disco">LIVE</span>
                <span class="count">${count}</span>
                <button class="btn-delete-phys-folder" data-phys-path="${phys.path}" data-phys-name="${phys.name}" title="Desvincular carpeta física de la lista" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; display: inline-flex; align-items: center; opacity: 0.7; transition: opacity 0.2s;">${iconSvg('trash-2', { size: 13, color: '#ef4444' })}</button>
              </div>
            </div>
          `;
        }).join('')}
      `;

      this.mediaFoldersListEl.querySelectorAll('.folder-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-folder') || e.target.closest('.btn-delete-phys-folder')) return;
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
              this.selectedMediaFolder = 'General';
            }
            store.deleteMediaFolder(folderToDelete);
          }
        });
      });

      this.mediaFoldersListEl.querySelectorAll('.btn-delete-phys-folder').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const physPath = btn.getAttribute('data-phys-path');
          const physName = btn.getAttribute('data-phys-name');
          if (confirm(`¿Deseas desvincular la carpeta física "${physName}" de la biblioteca? (Los archivos en tu disco duro no se borrarán).`)) {
            if (this.selectedMediaFolder === `phys:${physPath}`) {
              this.selectedMediaFolder = 'General';
            }
            if (window.electronAPI && window.electronAPI.unwatchPhysicalFolder) {
              try {
                await window.electronAPI.unwatchPhysicalFolder(physPath);
              } catch (err) {}
            }
            store.removePhysicalMediaFolder(physPath);
          }
        });
      });
    }

    // Update Dock Header Info
    const mediaInfo = document.getElementById('dock-media-info');
    let selectedFolderLabel = 'General';
    if (this.selectedMediaFolder) {
      if (this.selectedMediaFolder.startsWith('phys:')) {
        const physPath = this.selectedMediaFolder.slice(5);
        const foundPhys = physicalFolders.find(p => p.path === physPath);
        selectedFolderLabel = foundPhys ? `${foundPhys.name} (En vivo)` : physPath;
      } else {
        selectedFolderLabel = this.selectedMediaFolder;
      }
    }
    if (mediaInfo) {
      mediaInfo.textContent = `Carpeta: ${selectedFolderLabel}`;
    }

    // 2. Filter media library by selected folder (virtual or physical) & search query
    const normMediaQuery = this.normalizeSearchText(this.searchQuery);
    const filteredMedia = state.mediaLibrary.filter(item => {
      let matchesFolder = false;
      if (this.selectedMediaFolder && this.selectedMediaFolder.startsWith('phys:')) {
        const targetPhysPath = this.selectedMediaFolder.slice(5);
        matchesFolder = item.physicalFolderPath === targetPhysPath;
      } else {
        matchesFolder = item.folder === this.selectedMediaFolder && !item.isPhysicalFolderItem;
      }

      const matchesSearch = !normMediaQuery ||
        this.normalizeSearchText(item.name).includes(normMediaQuery) ||
        this.normalizeSearchText(item.folder || '').includes(normMediaQuery);
      return matchesFolder && matchesSearch;
    });

    const mediaQueue = Array.isArray(state.mediaQueue) ? state.mediaQueue : [];
    const queueKeyPart = mediaQueue.map(q => q.queueId + q.id + q.url).join(',');
    const mediaGridCacheKey = JSON.stringify(filteredMedia.map(m => m.id + m.name + m.url + m.folder + (m.thumbnail ? 'thumb' : 'none'))) + '|' + this.selectedMediaFolder + '|' + this.searchQuery + '|' + queueKeyPart;

    if (this.lastMediaGridCacheKey !== mediaGridCacheKey) {
      this.lastMediaGridCacheKey = mediaGridCacheKey;

      if (this.mediaIntersectionObserver) {
        this.mediaIntersectionObserver.disconnect();
      }

      if (filteredMedia.length === 0) {
        this.mediaGridEl.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.78rem;">
            No hay videos o imágenes en la carpeta "${selectedFolderLabel}".
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
            ? `<span class="video-card-type-badge img-badge">${iconSvg('image', { size: 11, className: 'lucide-icon' })} IMG</span>`
            : `<span class="video-card-type-badge vid-badge">${iconSvg('film', { size: 11, className: 'lucide-icon' })} VIDEO</span>`;

          // Find positions of this item in the active mediaQueue
          const queuePositions = [];
          mediaQueue.forEach((qItem, qIdx) => {
            if ((item.id && qItem.id === item.id) || qItem.url === item.url) {
              queuePositions.push(`#${qIdx + 1}`);
            }
          });
          const isQueued = queuePositions.length > 0;
          const queueBadgeHTML = isQueued
            ? `<span class="video-card-queue-badge" title="En cola de reproducción (${queuePositions.join(', ')})">${iconSvg('skip-forward', { size: 11, className: 'lucide-icon' })} ${queuePositions.join(', ')}</span>`
            : '';

          return `
            <div class="video-card ${isActive ? 'active-video' : ''} ${isQueued ? 'queued-video' : ''}" data-media-id="${item.id}" data-video-url="${item.url}" data-video-name="${item.name}" data-video-type="${item.type || ''}" title="Clic: Proyectar ahora • Alt + Clic: Agregar a la cola de reproducción">
              <div class="video-card-top-bar">
                <div style="display: flex; align-items: center; gap: 4px; overflow: hidden;">
                  <span class="video-folder-tag">${item.folder || 'General'}</span>
                  ${typeBadge}
                  ${queueBadgeHTML}
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <button type="button" class="btn-queue-media-card" data-queue-media-id="${item.id}" title="Sumar a la cola (Alt + Click)">+Cola</button>
                  <button class="btn-delete-media" data-media-id="${item.id}" title="Eliminar este elemento">&times;</button>
                </div>
              </div>
              ${mediaTag}
              <div class="video-card-overlay">
                <div class="video-card-title" title="${item.name}">${item.name}</div>
              </div>
            </div>
          `;
        }).join('');

        // Disparar generación o recuperación de miniaturas en segundo plano con cola de concurrencia limitada
        filteredMedia.forEach(item => {
          if (!item.thumbnail && item.url) {
            MediaCache.getThumbnail(item.id).then(cached => {
              if (cached) {
                store.updateMediaItemThumbnail(item.id, cached);
              } else {
                MediaCache.enqueueThumbnailGeneration(item.id, item.url, item.type).then(newThumb => {
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

        // Bind media click, Alt+Click queue, delete click, mouseenter/mouseleave hover play
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

          const mediaId = card.getAttribute('data-media-id') || card.querySelector('.btn-delete-media')?.getAttribute('data-media-id');
          const mediaItem = state.mediaLibrary.find(m => m.id === mediaId);
          card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-media') || e.target.closest('.btn-queue-media-card')) return;
            const url = card.getAttribute('data-video-url');
            const name = card.getAttribute('data-video-name');
            const type = card.getAttribute('data-video-type') || (mediaItem ? mediaItem.type : '');
            if (e.altKey) {
              e.preventDefault();
              e.stopPropagation();
              store.enqueueMedia(mediaItem || { id: mediaId, name, url, type });
              return;
            }
            store.setActiveVideo(url, name, type);
          });
          card.addEventListener('contextmenu', (e) => {
            if (mediaItem) {
              this.showContextMenu(e, { type: 'media', id: mediaItem.id, name: mediaItem.name, url: mediaItem.url });
            }
          });
        });

        this.mediaGridEl.querySelectorAll('.btn-queue-media-card').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-queue-media-id');
            store.enqueueMedia(id);
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

    // 4. Render Right-Side Media Queue Panels
    this.renderMediaQueuePanels(state);
  }

  renderMediaQueuePanels(state) {
    const queue = Array.isArray(state.mediaQueue) ? state.mediaQueue : [];
    const dockPanel = document.getElementById('media-dock-queue-panel');
    const sidebarBox = document.getElementById('right-sidebar-queue-box');

    if (queue.length === 0) {
      if (dockPanel) dockPanel.style.display = 'none';
      if (sidebarBox) sidebarBox.style.display = 'none';
      return;
    }

    if (dockPanel) dockPanel.style.display = 'flex';
    if (sidebarBox) sidebarBox.style.display = 'flex';

    const dockCountEl = document.getElementById('dock-queue-count');
    const sidebarCountEl = document.getElementById('sidebar-queue-count');
    if (dockCountEl) dockCountEl.textContent = String(queue.length);
    if (sidebarCountEl) sidebarCountEl.textContent = String(queue.length);

    const activeMediaObj = state.mediaLibrary?.find(m => m.url === state.activeVideoUrl);
    const currentPlayingName = (!state.isMediaCleared && state.activeVideoUrl)
      ? (state.activeVideoName || activeMediaObj?.name || state.activeVideoTitle || 'Video Activo')
      : 'Sin reproducción activa';

    const nextItemName = queue[0]?.name || '#1';
    const currentBannerHTML = `${iconSvg('film', { size: 13, className: 'lucide-icon icon-cyan' })} En curso: <strong title="${currentPlayingName}">${currentPlayingName}</strong> <span>(Al finalizar ➔ ${nextItemName})</span>`;

    const dockCurrentBanner = document.getElementById('dock-queue-current-info');
    const sidebarCurrentBanner = document.getElementById('sidebar-queue-current-info');
    if (dockCurrentBanner) dockCurrentBanner.innerHTML = currentBannerHTML;
    if (sidebarCurrentBanner) sidebarCurrentBanner.innerHTML = currentBannerHTML;

    const buildQueueItemsHTML = () => queue.map((item, idx) => {
      const libMatch = state.mediaLibrary?.find(m => (item.id && m.id === item.id) || m.url === item.url);
      const thumb = item.thumbnail || libMatch?.thumbnail || '';
      const isImg = (item.type && item.type.startsWith('image/')) || (item.url && item.url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i));
      const thumbEl = thumb
        ? `<img class="media-queue-thumb" src="${thumb}" alt="${item.name}" />`
        : (isImg
            ? `<img class="media-queue-thumb" src="${item.url}" alt="${item.name}" />`
            : `<div class="media-queue-thumb" style="display:flex;align-items:center;justify-content:center;">${iconSvg('film', { size: 14, className: 'lucide-icon icon-cyan' })}</div>`);

      const statusLabel = idx === 0 ? `${iconSvg('zap', { size: 11, className: 'lucide-icon icon-gold' })} Siguiente al terminar actual` : `En espera (Posición #${idx + 1})`;

      return `
        <div class="media-queue-item" data-queue-id="${item.queueId}" data-queue-idx="${idx}">
          <span class="media-queue-order-badge">#${idx + 1}</span>
          ${thumbEl}
          <div class="media-queue-info">
            <span class="media-queue-name" title="${item.name}">${item.name}</span>
            <span class="media-queue-sub">${statusLabel} • ${item.folder || 'General'}</span>
          </div>
          <div class="media-queue-item-controls">
            <button type="button" class="btn-queue-item-ctrl play-now" data-q-action="play" data-q-id="${item.queueId}" title="Reproducir ahora mismo">${iconSvg('play', { size: 11 })}</button>
            ${idx > 0 ? `<button type="button" class="btn-queue-item-ctrl" data-q-action="up" data-q-idx="${idx}" title="Subir posición">${iconSvg('arrow-up', { size: 11 })}</button>` : ''}
            ${idx < queue.length - 1 ? `<button type="button" class="btn-queue-item-ctrl" data-q-action="down" data-q-idx="${idx}" title="Bajar posición">${iconSvg('arrow-down', { size: 11 })}</button>` : ''}
            <button type="button" class="btn-queue-item-ctrl remove-item" data-q-action="remove" data-q-id="${item.queueId}" title="Quitar de la cola">${iconSvg('x', { size: 11 })}</button>
          </div>
        </div>
      `;
    }).join('');

    const itemsHTML = buildQueueItemsHTML();
    const dockListEl = document.getElementById('dock-media-queue-list');
    const sidebarListEl = document.getElementById('sidebar-media-queue-list');

    [dockListEl, sidebarListEl].forEach(listContainer => {
      if (!listContainer) return;
      listContainer.innerHTML = itemsHTML;

      listContainer.querySelectorAll('.btn-queue-item-ctrl').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-q-action');
          const qId = btn.getAttribute('data-q-id');
          const qIdx = parseInt(btn.getAttribute('data-q-idx'));

          if (action === 'play' && qId) {
            store.playQueueItemNow(qId);
          } else if (action === 'remove' && qId) {
            store.removeFromMediaQueue(qId);
          } else if (action === 'up' && !isNaN(qIdx)) {
            store.moveMediaQueueItem(qIdx, qIdx - 1);
          } else if (action === 'down' && !isNaN(qIdx)) {
            store.moveMediaQueueItem(qIdx, qIdx + 1);
          }
        });
      });
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
          <span class="filter-item-label">${iconSvg('file-text', { size: 13, className: 'lucide-icon icon-pink' })} <span>${tpl.name}</span></span>
          <div style="display: flex; gap: 4px; align-items: center;">
            ${isActive ? '<span class="count" style="color: var(--accent-cyan); font-weight:700;">ACTIVO</span>' : ''}
            <button class="btn-delete-media btn-delete-tpl" data-delete-tpl-id="${tpl.id}" title="Eliminar plantilla">${iconSvg('x', { size: 11 })}</button>
          </div>
        </div>
      `;
    }).join('');

    sidebarEl.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-tpl')) return;
        const id = item.getAttribute('data-tpl-id');
        store.setActiveTemplate(id);
        if (store.activeDeckId) {
          store.setDeckTemplate(store.activeDeckId, id);
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
        this.ensureModalInteractive(this.modalCreateTemplate, this.inputTemplateName);
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
        this.showToast(`Plantilla "${tplName}" creada.`, "success");
      } else {
        this.showToast("Por favor ingresa un nombre para la plantilla.", "warn");
        this.ensureModalInteractive(this.modalCreateTemplate, this.inputTemplateName);
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
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; display: inline-flex; align-items: center; gap: 4px;">${iconSvg('book-open', { size: 13, className: 'lucide-icon icon-blue' })} ${ver.name}</span>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span class="count">${ver.tag}</span>
            <button class="btn-delete-bible" data-bible-id="${ver.id}" data-bible-name="${ver.name.replace(/"/g, '&quot;')}" title="Eliminar Biblia" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 2px 4px; border-radius: 4px; display: inline-flex; align-items: center;">${iconSvg('trash-2', { size: 13, color: '#ef4444' })}</button>
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
    if (activeRefTagEl) activeRefTagEl.innerHTML = this.selectedBibleVersion ? `${iconSvg('book-open', { size: 13, className: 'lucide-icon icon-blue' })} ${activeRefText} (${this.selectedBibleVersion})` : `${iconSvg('book-open', { size: 13, className: 'lucide-icon icon-muted' })} Ninguna Biblia Seleccionada`;

    const verses = getChapterVerses(this.selectedBookId, this.selectedChapter, this.selectedBibleVersion);

    if (verses.length === 0) {
      versesListEl.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.82rem; width: 100%;">
          <div style="margin-bottom: 8px;">${iconSvg('book-open', { size: 36, className: 'lucide-icon icon-muted' })}</div>
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
        this.ensureModalInteractive(modalEvt, inputTitle);
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
        this.showToast("Por favor ingresa un título para el evento.", "warn");
        this.ensureModalInteractive(modalEvt, inputTitle);
        return;
      }

      calendarManager.addEvent(title, date, time, category, notes);
      closeModalEvt();
      this.showToast(`Evento "${title}" guardado en el calendario.`, "success");
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
      if (modal) {
        modal.classList.add('open');
        this.ensureModalInteractive(modal, inputUrl);
      }
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
            statusEl.innerHTML = `${iconSvg('x-circle', { size: 13, color: '#ef4444' })} Error: El archivo no es un JSON válido.`;
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
          this.showToast("Por favor ingresa una URL o selecciona un archivo JSON de Biblia.", "warn");
          this.ensureModalInteractive(modal, inputUrl);
          return;
        }

        if (newBible) {
          this.selectedBibleVersion = newBible.id;
          this.renderScriptureSubSidebar();
          this.renderScripture3ColView();
          closeModal();
          this.showToast(`Biblia "${newBible.name}" cargada y seleccionada exitosamente.`, "success");
        }
      } catch (err) {
        if (statusEl) {
          statusEl.innerHTML = `${iconSvg('x-circle', { size: 13, color: '#ef4444' })} ${err.message}`;
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
    store.state.liveSlideImage = "";
    store.state.liveSlideNotes = "";
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
      this.showToast(`Se ha creado el show "${title}" con ${passageBlocks.length} diapositivas adaptadas.`, "success");
    });
  }

  renderUI(state, decks) {
    // 1. Sidebar Project Decks (con búsqueda instantánea en toda la biblioteca descargada)
    const hasProjSearch = Boolean(this.projectSearchQuery && this.projectSearchQuery.trim().length > 0);
    const baseSidebarDecks = hasProjSearch ? decks : store.projectDecks;
    const filteredSidebarDecks = hasProjSearch
      ? baseSidebarDecks.filter(deck => this.deckMatchesQuery(deck, this.projectSearchQuery))
      : baseSidebarDecks;

    const projectBadge = document.querySelector('.project-count-badge');
    if (projectBadge) projectBadge.textContent = filteredSidebarDecks.length;

    const projectSidebarKey = `${this.projectSearchQuery || ''}|${store.activeDeckId || ''}|${store.projectDeckIds.join(',')}|${filteredSidebarDecks.map(d => `${d.id}:${d.title}:${d.category || d.type}`).join('|')}`;
    if (this._lastProjectSidebarKey !== projectSidebarKey) {
      this._lastProjectSidebarKey = projectSidebarKey;
      if (filteredSidebarDecks.length === 0 && hasProjSearch) {
        this.deckListEl.innerHTML = `
          <div style="padding: 12px 8px; text-align: center; color: var(--text-muted); font-size: 0.73rem;">
            Sin coincidencias para "${this.projectSearchQuery}"
          </div>
        `;
      } else {
        this.deckListEl.innerHTML = filteredSidebarDecks.map(deck => {
          const isInProject = store.projectDeckIds.includes(deck.id);
          return `
            <div class="deck-item ${deck.id === store.activeDeckId ? 'active' : ''}" data-deck-id="${deck.id}">
              <span class="deck-item-title" title="${deck.title}">${deck.title}</span>
              <div class="deck-item-actions">
                <span class="deck-item-tag">${deck.category || deck.type}</span>
                <button class="btn-edit-project-item" data-edit-id="${deck.id}" title="Editar canción">${iconSvg('pencil', { size: 12 })}</button>
                ${isInProject ? `<button class="btn-remove-project-item" data-remove-id="${deck.id}" title="Quitar del proyecto (mantener en biblioteca)">${iconSvg('x', { size: 12 })}</button>` : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      this.deckListEl.querySelectorAll('.deck-item').forEach(el => {
        const id = el.getAttribute('data-deck-id');
        const deckObj = decks.find(d => d.id === id);
        el.addEventListener('click', (e) => {
          if (e.target.closest('.btn-remove-project-item') || e.target.closest('.btn-edit-project-item')) return;
          store.setActiveDeck(id);
        });
        el.addEventListener('contextmenu', (e) => {
          if (deckObj) this.showContextMenu(e, { type: 'project-item', id: deckObj.id, name: deckObj.title });
        });
      });

      this.deckListEl.querySelectorAll('.btn-edit-project-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-edit-id');
          if (id) this.openEditDeckModal(id);
        });
      });

      this.deckListEl.querySelectorAll('.btn-remove-project-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-remove-id');
          store.removeFromProject(id);
        });
      });
    }

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
        const sectionsNavKey = `${activeDeck.id}|${!state.isTextCleared ? state.liveGroupIndex : -1}|${(activeDeck.groups || []).map(g => `${g.name}:${g.badge}:${g.slides?.length || 0}`).join('|')}`;
        if (this._lastSectionsNavKey !== sectionsNavKey) {
          this._lastSectionsNavKey = sectionsNavKey;
          if (!activeDeck.groups || activeDeck.groups.length === 0) {
            sectionsNavEl.innerHTML = `<span class="section-nav-empty">Sin secciones definidas en esta canción</span>`;
          } else {
            const liveGIdx = state.liveGroupIndex;
            const sectionButtonsHTML = activeDeck.groups.map((group, gIdx) => {
              const isGroupLive = liveGIdx === gIdx && !state.isTextCleared;
              const badgeClass = group.badge || 'badge-verse';
              const slideCount = group.slides?.length || 1;

              const sectionSvg = getSectionIconSvg(badgeClass, { size: 12 });

              return `
                <button type="button" class="btn-section-nav ${badgeClass} ${isGroupLive ? 'active-live-section' : ''}" data-gidx="${gIdx}" title="Saltar a ${group.name} (${slideCount} filminas)">
                  <span class="section-icon">${sectionSvg}</span>
                  <span class="section-title">${group.name}</span>
                  <span class="section-count">${slideCount}</span>
                  ${isGroupLive ? '<span class="section-live-dot" title="En Vivo">●</span>' : ''}
                </button>
              `;
            }).join('');

            sectionsNavEl.innerHTML = `
              <span class="section-nav-label">
                ${iconSvg('list', { size: 12 })}
                <span>SECCIONES:</span>
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
      }

      const activeMediaUrlForKey = (!state.isMediaCleared && state.activeVideoUrl) ? state.activeVideoUrl : '';
      const activeMediaItemForKey = activeMediaUrlForKey ? state.mediaLibrary?.find(m => m.url === activeMediaUrlForKey) : null;
      const slideCardsStructuralKey = JSON.stringify({
        deckId: activeDeck.id,
        templateId: activeDeck.templateId,
        activeTplId: store.activeTemplateId,
        deckStyle: activeDeck.style,
        mediaUrl: activeMediaUrlForKey,
        mediaThumb: activeMediaItemForKey?.thumbnail ? '1' : '0',
        groups: activeDeck.groups.map(g => ({
          name: g.name,
          badge: g.badge,
          slides: g.slides.map(s => ({ id: s.id, text: s.text, image: s.image, notes: s.notes, style: s.style, isLt: s.isLowerThird }))
        }))
      });

      const btnEditDeck = document.getElementById('btn-edit-active-deck');
      const btnReflowDeck = document.getElementById('btn-reflow-deck');
      const isPresDeck = activeDeck.type === 'presentation';
      if (btnEditDeck) btnEditDeck.style.display = isPresDeck ? 'none' : '';
      if (btnReflowDeck) btnReflowDeck.style.display = isPresDeck ? 'none' : '';

      if (this.lastSlideCardsStructuralKey === slideCardsStructuralKey && this.slideGroupsWrapper.querySelector('.slide-cards-grid')) {
        // Fast-path: actualizar únicamente la clase .active-live sin destruir el DOM ni los decodificadores <video>
        this.slideGroupsWrapper.querySelectorAll('.slide-card').forEach(card => {
          const gIdx = parseInt(card.getAttribute('data-gidx'));
          const sIdx = parseInt(card.getAttribute('data-sidx'));
          const group = activeDeck.groups[gIdx];
          const slide = group?.slides?.[sIdx];
          if (!slide) return;
          const isLtSlide = slide.isLowerThird || (group.badge === 'badge-lowerthird');
          const isLive = isLtSlide
            ? (state.isLowerThirdActive && !state.isOverlayCleared && state.lowerThirdText === (slide.text.split('\n')[0] || ''))
            : (state.liveSlideId === slide.id && !state.isTextCleared);
          card.classList.toggle('active-live', isLive);
        });
      } else {
        this.lastSlideCardsStructuralKey = slideCardsStructuralKey;
        let globalIndex = 1;
        const allCardsHTML = activeDeck.groups.flatMap((group, gIdx) => {
          return group.slides.map((slide, sIdx) => {
            const isLtSlide = slide.isLowerThird || (group.badge === 'badge-lowerthird');
            const isLive = isLtSlide
              ? (state.isLowerThirdActive && !state.isOverlayCleared && state.lowerThirdText === (slide.text.split('\n')[0] || ''))
              : (state.liveSlideId === slide.id && !state.isTextCleared);
            const cardIdx = globalIndex++;
            const tpl = this.getSlideEffectiveStyle(activeDeck, slide);

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
              `font-weight: ${tpl.fontWeight || '700'}`,
              `font-style: ${tpl.fontStyle || 'normal'}`,
              `text-decoration: ${tpl.textDecoration || 'none'}`,
              `text-transform: ${tpl.textTransform || 'none'}`,
              `-webkit-text-stroke: ${tpl.webkitTextStroke || 'none'}`,
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
            const activeMediaItem = activeMediaUrl ? state.mediaLibrary?.find(m => m.url === activeMediaUrl) : null;
            const activeMediaThumb = activeMediaItem?.thumbnail || '';
            const isImg = (state.activeVideoType && state.activeVideoType.startsWith('image/')) || (state.activeVideoIsImage && !state.activeVideoType?.startsWith('video/')) || (activeMediaUrl && !activeMediaUrl.startsWith('blob:') && !!activeMediaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i));
            const slideImgSrc = slide.thumb || slide.image || '';

            if (slideImgSrc) {
              const notesIndicator = slide.notes
                ? `<span title="Notas del orador: ${this.escapeHtml(slide.notes)}" style="position: absolute; bottom: 26px; right: 6px; background: rgba(15, 23, 42, 0.85); color: #fde68a; border: 1px solid rgba(251, 191, 36, 0.45); border-radius: 4px; font-size: 0.62rem; font-weight: 700; padding: 1px 5px; z-index: 3; display: inline-flex; align-items: center; gap: 3px;">${iconSvg('file-text', { size: 10 })} Notas</span>`
                : '';
              return `
                <div class="slide-card ${isLive ? 'active-live' : ''}" data-gidx="${gIdx}" data-sidx="${sIdx}" style="background: #000;">
                  <img src="${slideImgSrc}" alt="Diapositiva ${cardIdx}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1; pointer-events: none;" />
                  <span class="slide-card-index">${cardIdx}</span>
                  <span class="slide-card-live-badge">EN VIVO</span>
                  ${notesIndicator}
                  <div class="slide-card-footer-line">
                    <span class="badge ${group.badge} slide-card-section-badge" data-gidx="${gIdx}" data-sidx="${sIdx}" title="Diapositiva ${cardIdx}">
                      Diapositiva ${cardIdx}
                    </span>
                  </div>
                </div>
              `;
            }

            let cardBgHTML = '';
            if (activeMediaUrl) {
              if (isImg || activeMediaThumb) {
                cardBgHTML = `<img src="${activeMediaThumb || activeMediaUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55; z-index: 0; pointer-events: none;" />`;
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
      const hasQueue = Array.isArray(state.mediaQueue) && state.mediaQueue.length > 0;
      const shouldLoop = !hasQueue;

      bgA.muted = shouldOperatorMute;
      bgB.muted = shouldOperatorMute;
      bgA.volume = operatorVolume;
      bgB.volume = operatorVolume;
      bgA.loop = shouldLoop;
      bgB.loop = shouldLoop;

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
        if (this.operatorVideoUrl) {
          this.operatorVideoUrl = "";
          this.operatorMediaPlayId = 0;
          if (this._operatorClearVramTimeout) clearTimeout(this._operatorClearVramTimeout);
          this._operatorClearVramTimeout = setTimeout(() => {
            if (store.state.isMediaCleared || !store.state.activeVideoUrl) {
              bgA.removeAttribute('src');
              bgB.removeAttribute('src');
              try { bgA.load(); bgB.load(); } catch (e) {}
            }
          }, (mediaMode === 'cut' ? 0 : dur) + 60);
        }
      } else if (this.operatorVideoUrl !== state.activeVideoUrl || (state.activeMediaPlayId && this.operatorMediaPlayId !== state.activeMediaPlayId)) {
        if (this._operatorClearVramTimeout) {
          clearTimeout(this._operatorClearVramTimeout);
          this._operatorClearVramTimeout = null;
        }
        this.operatorVideoUrl = state.activeVideoUrl;
        this.operatorMediaPlayId = state.activeMediaPlayId || 0;

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
          incomingMedia.video.loop = shouldLoop;
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

    // Update Interactive Media Timeline UI
    this.updateMediaTimelineUI(state);


    // 5. Presentation Slide Image + Text & Stage Previews (Escalado equivalente e idéntico a la pantalla de Audiencia)
    const targetSlideImage = (!state.isTextCleared && state.liveSlideImage) ? state.liveSlideImage : "";
    const operatorSlideImgEl = document.getElementById('operator-slide-img-preview');
    if (operatorSlideImgEl) {
      operatorSlideImgEl.style.transition = state.textTransition === 'cut' ? 'opacity 0s' : `opacity ${dur}ms ease-in-out`;
      if (targetSlideImage) {
        if (operatorSlideImgEl.getAttribute('src') !== targetSlideImage) {
          operatorSlideImgEl.src = targetSlideImage;
        }
        operatorSlideImgEl.style.display = 'block';
        operatorSlideImgEl.style.opacity = '1';
      } else {
        operatorSlideImgEl.style.opacity = '0';
        operatorSlideImgEl.style.display = 'none';
      }
    }

    const targetText = (state.isTextCleared || targetSlideImage || !state.liveText) ? "" : state.liveText;
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
      this.liveTextEl.style.fontWeight = tpl.fontWeight || '700';
      this.liveTextEl.style.fontStyle = tpl.fontStyle || 'normal';
      this.liveTextEl.style.textDecoration = tpl.textDecoration || 'none';
      this.liveTextEl.style.textTransform = tpl.textTransform || 'none';
      this.liveTextEl.style.webkitTextStroke = tpl.webkitTextStroke || (tpl.outlineEnable ? `${tpl.outlineWidth || 2}px ${tpl.outlineColor || '#000'}` : 'none');
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

    // 5.b. Operator Monitor Lower Third Overlay Synchronization
    const opLtBanner = document.getElementById('operator-lower-third-banner');
    const opLtTitle = document.getElementById('operator-lower-third-title');
    const opLtSub = document.getElementById('operator-lower-third-subtitle');
    if (opLtBanner) {
      if (!state.isOverlayCleared && state.isLowerThirdActive) {
        if (opLtTitle) opLtTitle.textContent = state.lowerThirdText || "";
        if (opLtSub) opLtSub.textContent = state.lowerThirdSubtext || "";
        opLtBanner.style.transform = 'translateX(0)';
        opLtBanner.style.opacity = '1';
      } else {
        opLtBanner.style.transform = 'translateX(-120%)';
        opLtBanner.style.opacity = '0';
      }
    }

    const liveStageSummary = state.isTextCleared
      ? "TEXTO LIMPIO"
      : (state.liveSlideNotes || state.liveText || (state.liveSlideImage ? "Diapositiva en proyección" : "--"));
    this.stageCurrentEl.textContent = liveStageSummary;
    this.stageNextEl.textContent = "SIGUIENTE: " + (state.nextText || "--");
    this.stageTimerEl.textContent = stageManager.constructor.formatTime(state.timerValue);
    if (this.btnTimerToggle) {
      this.btnTimerToggle.innerHTML = state.timerRunning
        ? `${iconSvg('pause', { size: 12 })} <span>Pausar</span>`
        : `${iconSvg('play', { size: 12 })} <span>Iniciar</span>`;
      this.btnTimerToggle.classList.toggle('active', !!state.timerRunning);
    }

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
      if (soundIcon) soundIcon.innerHTML = isAudioMuted ? iconSvg('volume-x', { size: 14 }) : iconSvg('volume-2', { size: 14 });
      if (soundText) soundText.textContent = isAudioMuted ? 'Silenciado' : 'Sonido ON';
    }

    const btnAudioPill = document.getElementById('btn-audio-mute-toggle');
    const audioPillIcon = document.getElementById('audio-pill-icon');
    const audioPillText = document.getElementById('audio-pill-text');
    if (btnAudioPill) {
      btnAudioPill.classList.toggle('muted', isAudioMuted);
      if (audioPillIcon) audioPillIcon.innerHTML = isAudioMuted ? iconSvg('volume-x', { size: 14 }) : iconSvg('volume-2', { size: 14 });
      if (audioPillText) audioPillText.textContent = isAudioMuted ? 'MUTE' : 'ON';
    }

    const btnDockAudio = document.getElementById('btn-dock-audio-toggle');
    const dockAudioIcon = document.getElementById('dock-audio-icon');
    const dockAudioText = document.getElementById('dock-audio-text');
    if (btnDockAudio) {
      btnDockAudio.classList.toggle('muted', isAudioMuted);
      if (dockAudioIcon) dockAudioIcon.innerHTML = isAudioMuted ? iconSvg('volume-x', { size: 14 }) : iconSvg('volume-2', { size: 14 });
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
    const statusBgLayer = document.getElementById('status-bg-layer');
    if (statusBgLayer) {
      const qLen = Array.isArray(state.mediaQueue) ? state.mediaQueue.length : 0;
      if (state.isMediaCleared || !state.activeVideoUrl) {
        statusBgLayer.textContent = "LIMPIO";
        statusBgLayer.style.color = "var(--text-muted)";
      } else if (qLen > 0) {
        statusBgLayer.textContent = `COLA ACTIVA (${qLen} en espera)`;
        statusBgLayer.style.color = "#fbbf24";
      } else {
        statusBgLayer.textContent = "VIDEO LOOP";
        statusBgLayer.style.color = "var(--accent-cyan)";
      }
    }
    if (!state.isTextCleared && (state.liveText || state.liveSlideImage)) {
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
