import { sync } from './broadcast.js';
import { MediaCache } from './media-cache.js';

export function parseAndSplitText(rawText, splitMode = 'paragraph', maxLines = 0) {
  if (!rawText || !rawText.trim()) return [];

  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim());

  const groups = paragraphs.map((p, idx) => {
    const textBlock = p.trim();
    let badge = "badge-verse";
    let name = `Estrofa ${idx + 1}`;

    const lower = textBlock.toLowerCase();
    if (lower.startsWith("coro") || lower.includes("chorus")) {
      badge = "badge-chorus";
      name = "Coro";
    } else if (lower.startsWith("puente") || lower.includes("bridge")) {
      badge = "badge-bridge";
      name = "Puente";
    } else if (lower.startsWith("sermon") || lower.includes("puntos")) {
      badge = "badge-sermon";
      name = "Sermón";
    } else if (lower.startsWith("intro")) {
      badge = "badge-intro";
      name = "Intro";
    } else if (lower.startsWith("outro") || lower.includes("final")) {
      badge = "badge-outro";
      name = "Final";
    }

    const rawLines = textBlock.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    let slides = [];

    if (splitMode === 'lines') {
      // 1 renglón por filmina
      slides = rawLines.map((lineText, sIdx) => ({
        id: `slide-${Date.now()}-${idx}-${sIdx}-${Math.random().toString(36).substr(2, 4)}`,
        text: lineText
      }));
    } else if ((splitMode === 'fixed' || maxLines > 0) && maxLines > 0) {
      // Bloques de N renglones por filmina
      let slideCount = 0;
      for (let i = 0; i < rawLines.length; i += maxLines) {
        const chunk = rawLines.slice(i, i + maxLines).join('\n');
        if (chunk) {
          slides.push({
            id: `slide-${Date.now()}-${idx}-${slideCount++}-${Math.random().toString(36).substr(2, 4)}`,
            text: chunk
          });
        }
      }
    } else {
      // Párrafo completo por filmina
      slides = [{
        id: `slide-${Date.now()}-${idx}-0`,
        text: textBlock
      }];
    }

    return {
      name,
      badge,
      slides: slides.length > 0 ? slides : [{ id: `slide-${Date.now()}-${idx}-0`, text: textBlock }]
    };
  });

  return groups;
}

export const DEFAULT_DECKS = [
  {
    id: "song-1",
    title: "Cuan Grande Es Él (How Great Thou Art)",
    type: "song",
    category: "Alabanza",
    groups: [
      {
        name: "Estrofa 1",
        badge: "badge-verse",
        slides: [
          { id: "s1-1", text: "Señor mi Dios, al contemplar los cielos,\nel firmamento y las estrellas mil," },
          { id: "s1-2", text: "Al oír tu voz en los potentes truenos,\ny ver el sol en su esplendor brillante." }
        ]
      },
      {
        name: "Coro",
        badge: "badge-chorus",
        slides: [
          { id: "s1-3", text: "¡Mi corazón entona la canción,\nCuán grande es Él! ¡Cuán grande es Él!" },
          { id: "s1-4", text: "¡Mi corazón entona la canción,\nCuán grande es Él! ¡Cuán grande es Él!" }
        ]
      },
      {
        name: "Estrofa 2",
        badge: "badge-verse",
        slides: [
          { id: "s1-5", text: "Al recorrer los montes y los valles,\ny ver las bellas flores al pasar." },
          { id: "s1-6", text: "Al escuchar el canto de las aves,\ny el murmurar del claro manantial." }
        ]
      }
    ]
  },
  {
    id: "song-2",
    title: "Gracia Sublime Es (Amazing Grace)",
    type: "song",
    category: "Adoración",
    groups: [
      {
        name: "Estrofa 1",
        badge: "badge-verse",
        slides: [
          { id: "s2-1", text: "Gracia sublime es, qué dulce sonido\nque salvó a un miserable como yo." },
          { id: "s2-2", text: "Una vez fui perdido, pero ahora fui hallado;\nestaba ciego, pero ahora veo." }
        ]
      },
      {
        name: "Coro",
        badge: "badge-chorus",
        slides: [
          { id: "s2-3", text: "Sublime gracia del Señor,\nque a un pecador salvó." },
          { id: "s2-4", text: "Fui ciego mas hoy veo yo,\nperdido fui mas me halló." }
        ]
      }
    ]
  },
  {
    id: "sermon-1",
    title: "Sermón: Caminando en Esperanza",
    type: "sermon",
    category: "Predicación",
    groups: [
      {
        name: "Título Principal",
        badge: "badge-sermon",
        slides: [
          { id: "s3-1", text: "CAMINANDO EN ESPERANZA\nSerie: Fe en Tiempos de Cambio" }
        ]
      },
      {
        name: "Punto 1: La Promesa",
        badge: "badge-sermon",
        slides: [
          { id: "s3-2", text: "1. La Esperanza no avergüenza\nRomanos 5:5 - El amor de Dios ha sido derramado" },
          { id: "s3-3", text: "«Y la esperanza no avergüenza; porque el amor de Dios ha sido derramado en nuestros corazones»" }
        ]
      }
    ]
  },
  {
    id: "lowerthird-1",
    title: "Overlay Lower Thirds (Terceros Inferiores)",
    type: "lowerthird",
    category: "Overlays Stream",
    groups: [
      {
        name: "Presentadores",
        badge: "badge-lowerthird",
        slides: [
          { id: "lt-1", text: "Pr. Alejandro Morales\nPastor Principal & Conferencista", isLowerThird: true },
          { id: "lt-2", text: "Carolina Herrera\nDirectora de Alabanza", isLowerThird: true }
        ]
      }
    ]
  }
];

export const DEFAULT_TEMPLATES = [
  {
    id: "preset-modern",
    name: "Moderno Centrado",
    category: "Estándar",
    fontFamily: "Inter, sans-serif",
    fontSize: 52,
    letterSpacing: 0,
    lineHeight: 1.25,
    color: "#ffffff",
    textShadow: "0 4px 16px rgba(0,0,0,0.8)",
    textAlign: "center",
    maxLines: 0,
    verticalAlign: "center",
    posY: 50,
    bgColor: "rgba(0, 0, 0, 0.3)",
    padding: 20,
    borderRadius: 8,
    bgImageUrl: ""
  },
  {
    id: "preset-lowerthird",
    name: "Lower Third (Subtítulo Inferior)",
    category: "Transmisión",
    fontFamily: "Outfit, sans-serif",
    fontSize: 36,
    letterSpacing: 1,
    lineHeight: 1.2,
    color: "#ffffff",
    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
    textAlign: "left",
    maxLines: 2,
    verticalAlign: "bottom",
    posY: 80,
    bgColor: "rgba(15, 18, 26, 0.85)",
    padding: 16,
    borderRadius: 8,
    bgImageUrl: ""
  },
  {
    id: "preset-worship",
    name: "Caja Oscura Adoración",
    category: "Adoración",
    fontFamily: "Montserrat, sans-serif",
    fontSize: 48,
    letterSpacing: 2,
    lineHeight: 1.3,
    color: "#f8fafc",
    textShadow: "none",
    textAlign: "center",
    maxLines: 4,
    verticalAlign: "center",
    posY: 50,
    bgColor: "rgba(0, 0, 0, 0.65)",
    padding: 24,
    borderRadius: 12,
    bgImageUrl: ""
  },
  {
    id: "preset-neon",
    name: "Estilo Neón Cyan",
    category: "Jóvenes",
    fontFamily: "Outfit, sans-serif",
    fontSize: 50,
    letterSpacing: 1.5,
    lineHeight: 1.2,
    color: "#38bdf8",
    textShadow: "0 0 20px #0ea5e9, 0 0 40px #0284c7",
    textAlign: "center",
    maxLines: 0,
    verticalAlign: "center",
    posY: 50,
    bgColor: "rgba(13, 15, 21, 0.75)",
    padding: 20,
    borderRadius: 10,
    bgImageUrl: ""
  }
];

const getStorageItem = (key) => (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
const setStorageItem = (key, val) => (typeof localStorage !== 'undefined' ? localStorage.setItem(key, val) : null);

export class Store {
  constructor() {
    // Persistent Decks & Project Items
    const savedDecks = getStorageItem("propresenter_decks");
    this.decks = savedDecks ? JSON.parse(savedDecks) : DEFAULT_DECKS;

    const savedProjectIds = getStorageItem("propresenter_project_deck_ids");
    this.projectDeckIds = savedProjectIds ? JSON.parse(savedProjectIds) : this.decks.map(d => d.id);
    this.activeDeckId = this.projectDeckIds[0] || this.decks[0]?.id || "song-1";

    // Persistent Templates
    const savedTemplates = getStorageItem("propresenter_templates");
    this.templates = savedTemplates ? JSON.parse(savedTemplates) : DEFAULT_TEMPLATES;
    this.activeTemplateId = getStorageItem("propresenter_active_template") || "preset-modern";

    // Persistent Media Library & Folders
    const savedMedia = getStorageItem("propresenter_media_library");
    const savedFolders = getStorageItem("propresenter_media_folders");

    this.state = {
      // Proyección Live
      activeVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",
      activeVideoTitle: "Space Motion Background",
      liveText: "",
      liveSlideId: null,
      liveGroupIndex: null,
      liveSlideIndex: null,
      nextText: "",
      
      // Master Clear Switches
      isTextCleared: false,
      isMediaCleared: false,
      isOverlayCleared: false,

      // Active Template Object
      activeTemplate: this.templates.find(t => t.id === this.activeTemplateId) || this.templates[0],

      // Media Virtual Folders
      mediaFolders: savedFolders ? JSON.parse(savedFolders) : ["General", "Anuncios", "Rápidos", "Estribos"],
      mediaLibrary: savedMedia ? JSON.parse(savedMedia) : [
        {
          id: "default-bg-1",
          name: "Space Stars Motion",
          url: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",
          type: "video/mp4",
          folder: "Rápidos"
        },
        {
          id: "default-bg-2",
          name: "Golden Particles Loop",
          url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-particles-in-the-dark-42998-large.mp4",
          type: "video/mp4",
          folder: "Estribos"
        }
      ],
      
      // Lower Third / Overlay
      lowerThirdText: "",
      lowerThirdSubtext: "",
      isLowerThirdActive: false,
      
      // Transitions Settings (cut | fade)
      textTransition: getStorageItem("propresenter_text_trans") || "fade",
      mediaTransition: getStorageItem("propresenter_media_trans") || "fade",
      fadeDuration: parseInt(getStorageItem("propresenter_fade_duration") || "250"),

      // Audio Settings for Video Playback
      isMediaAudioMuted: getStorageItem("propresenter_media_audio_muted") === "true",
      mediaAudioVolume: getStorageItem("propresenter_media_audio_volume") !== null ? parseFloat(getStorageItem("propresenter_media_audio_volume")) : 1.0,

      // Scripture Settings
      scriptureMaxLines: parseInt(getStorageItem("propresenter_scripture_maxlines") || "2"),
      scriptureFont: getStorageItem("propresenter_scripture_font") || "Inter, sans-serif",
      scriptureSplitLong: getStorageItem("propresenter_scripture_split") !== "false",
      scriptureShowRef: getStorageItem("propresenter_scripture_show_ref") !== "false",

      // Stage & Timers
      stageMessage: "",
      timerValue: 600,
      timerRunning: false
    };

    this.listeners = [];

    // Auto-hidratar miniaturas y restaurar blobs persistentes desde IndexedDB
    if (typeof window !== 'undefined' && Array.isArray(this.state.mediaLibrary)) {
      this.state.mediaLibrary.forEach(item => {
        if (!item.thumbnail && item.id) {
          MediaCache.getThumbnail(item.id).then(t => {
            if (t) {
              item.thumbnail = t;
              this.notify();
            }
          }).catch(() => {});
        }
        if (item.url && item.url.startsWith('blob:')) {
          if (item.filePath) {
            item.url = 'file:///' + item.filePath.replace(/\\/g, '/');
          } else {
            MediaCache.getBlob(item.id).then(blob => {
              if (blob) {
                item.url = URL.createObjectURL(blob);
                this.notify();
              }
            }).catch(() => {});
          }
        }
      });
    }

    // Provider for new windows requesting current state on launch
    sync.setStateProvider(() => this.state);
  }

  get activeDeck() {
    return this.decks.find(d => d.id === this.activeDeckId) || this.decks[0];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state, this.decks));
    setStorageItem("propresenter_decks", JSON.stringify(this.decks));
    setStorageItem("propresenter_media_library", JSON.stringify(this.state.mediaLibrary));
    setStorageItem("propresenter_media_folders", JSON.stringify(this.state.mediaFolders));
    setStorageItem("propresenter_templates", JSON.stringify(this.templates));
    setStorageItem("propresenter_active_template", this.activeTemplateId);
    setStorageItem("propresenter_text_trans", this.state.textTransition);
    setStorageItem("propresenter_media_trans", this.state.mediaTransition);
    setStorageItem("propresenter_fade_duration", this.state.fadeDuration);
    setStorageItem("propresenter_media_audio_muted", String(this.state.isMediaAudioMuted));
    setStorageItem("propresenter_media_audio_volume", String(this.state.mediaAudioVolume));

    // Transmit updated state to Audience and Stage displays via Broadcast & IPC
    sync.sendUpdate(this.state);
  }

  toggleMediaAudio() {
    this.state.isMediaAudioMuted = !this.state.isMediaAudioMuted;
    setStorageItem("propresenter_media_audio_muted", String(this.state.isMediaAudioMuted));
    this.notify();
    return !this.state.isMediaAudioMuted;
  }

  setMediaAudioMuted(muted) {
    this.state.isMediaAudioMuted = !!muted;
    setStorageItem("propresenter_media_audio_muted", String(this.state.isMediaAudioMuted));
    this.notify();
  }

  setMediaAudioVolume(volume) {
    const clamped = Math.max(0, Math.min(1, parseFloat(volume) || 0));
    this.state.mediaAudioVolume = clamped;
    setStorageItem("propresenter_media_audio_volume", String(clamped));
    this.notify();
  }

  setTextTransition(mode) {
    this.state.textTransition = mode;
    this.notify();
  }

  setMediaTransition(mode) {
    this.state.mediaTransition = mode;
    this.notify();
  }

  setFadeDuration(duration) {
    this.state.fadeDuration = parseInt(duration) || 250;
    this.notify();
  }

  setScriptureSettings(settings) {
    if (settings.maxLines !== undefined) this.state.scriptureMaxLines = settings.maxLines;
    if (settings.font !== undefined) this.state.scriptureFont = settings.font;
    if (settings.splitLong !== undefined) this.state.scriptureSplitLong = settings.splitLong;
    if (settings.showRef !== undefined) this.state.scriptureShowRef = settings.showRef;

    setStorageItem("propresenter_scripture_maxlines", this.state.scriptureMaxLines);
    setStorageItem("propresenter_scripture_font", this.state.scriptureFont);
    setStorageItem("propresenter_scripture_split", this.state.scriptureSplitLong);
    setStorageItem("propresenter_scripture_show_ref", this.state.scriptureShowRef);

    this.notify();
  }

  setActiveDeck(deckId) {
    this.activeDeckId = deckId;
    const deck = this.activeDeck;
    if (deck && deck.templateId) {
      const tpl = this.templates.find(t => t.id === deck.templateId);
      if (tpl) {
        this.activeTemplateId = tpl.id;
        this.state.activeTemplate = tpl;
      }
    }
    this.notify();
  }

  setActiveTemplate(templateId, autoReflow = true) {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      this.activeTemplateId = templateId;
      this.state.activeTemplate = { ...template };
      setStorageItem("propresenter_active_template", templateId);
      
      // Si la plantilla especifica un máximo de renglones (> 0) y autoReflow es activo,
      // re-dividimos automáticamente las filminas excedentes de la presentación activa.
      if (autoReflow && template.maxLines && template.maxLines > 0 && this.activeDeckId) {
        this.reflowDeckSlides(this.activeDeckId, template.maxLines);
      } else {
        this.notify();
      }
    }
  }

  updateActiveTemplateProperties(props) {
    if (!this.state.activeTemplate) return;
    const oldMaxLines = this.state.activeTemplate.maxLines;
    this.state.activeTemplate = { ...this.state.activeTemplate, ...props };
    const idx = this.templates.findIndex(t => t.id === (props.id || this.activeTemplateId));
    if (idx !== -1) {
      this.templates[idx] = { ...this.state.activeTemplate };
    }
    setStorageItem("propresenter_templates", JSON.stringify(this.templates));

    // Si cambió maxLines a un valor > 0, re-dividir filminas excedentes del deck activo
    if (props.maxLines !== undefined && props.maxLines > 0 && props.maxLines !== oldMaxLines && this.activeDeckId) {
      this.reflowDeckSlides(this.activeDeckId, props.maxLines);
    } else {
      this.notify();
    }
  }

  saveTemplate(templateData) {
    const existingIndex = this.templates.findIndex(t => t.id === templateData.id);
    if (existingIndex >= 0) {
      this.templates[existingIndex] = { ...this.templates[existingIndex], ...templateData };
    } else {
      this.templates.push(templateData);
    }
    this.activeTemplateId = templateData.id;
    this.state.activeTemplate = templateData;
    this.notify();
  }

  deleteTemplate(templateId) {
    if (this.templates.length <= 1) {
      alert("Debes conservar al menos una plantilla en la biblioteca.");
      return;
    }
    this.templates = this.templates.filter(t => t.id !== templateId);
    if (this.activeTemplateId === templateId) {
      this.activeTemplateId = this.templates[0].id;
      this.state.activeTemplate = this.templates[0];
    }
    this.notify();
  }

  setLiveSlide(groupIndex, slideIndex) {
    const deck = this.activeDeck;
    if (!deck || !deck.groups[groupIndex]) return;

    const group = deck.groups[groupIndex];
    const slide = group.slides[slideIndex];
    if (!slide) return;

    if (slide.isLowerThird) {
      const parts = slide.text.split("\n");
      this.state.lowerThirdText = parts[0] || "";
      this.state.lowerThirdSubtext = parts[1] || "";
      this.state.isLowerThirdActive = true;
      this.state.isOverlayCleared = false;
    } else {
      this.state.liveText = slide.text;
      this.state.liveSlideId = slide.id;
      this.state.liveGroupIndex = groupIndex;
      this.state.liveSlideIndex = slideIndex;
      this.state.isTextCleared = false;

      let nextText = "";
      if (slideIndex + 1 < group.slides.length) {
        nextText = group.slides[slideIndex + 1].text;
      } else if (groupIndex + 1 < deck.groups.length) {
        nextText = deck.groups[groupIndex + 1].slides[0]?.text || "";
      }
      this.state.nextText = nextText;
    }

    this.notify();
  }

  // Master Clear Functions
  clearAll() {
    this.state.isTextCleared = true;
    this.state.isMediaCleared = true;
    this.state.isOverlayCleared = true;
    this.state.liveSlideId = null;
    this.state.isLowerThirdActive = false;
    this.notify();
  }

  clearText() {
    this.state.isTextCleared = true;
    this.state.liveSlideId = null;
    this.notify();
  }

  clearMedia() {
    this.state.isMediaCleared = true;
    this.notify();
  }

  clearOverlays() {
    this.state.isOverlayCleared = true;
    this.state.isLowerThirdActive = false;
    this.notify();
  }

  nextSlide() {
    if (this.state.liveGroupIndex === null || this.state.liveSlideIndex === null) {
      this.setLiveSlide(0, 0);
      return;
    }

    const deck = this.activeDeck;
    let gIdx = this.state.liveGroupIndex;
    let sIdx = this.state.liveSlideIndex + 1;

    if (sIdx < deck.groups[gIdx].slides.length) {
      this.setLiveSlide(gIdx, sIdx);
    } else if (gIdx + 1 < deck.groups.length) {
      this.setLiveSlide(gIdx + 1, 0);
    }
  }

  prevSlide() {
    if (this.state.liveGroupIndex === null || this.state.liveSlideIndex === null) return;

    const deck = this.activeDeck;
    let gIdx = this.state.liveGroupIndex;
    let sIdx = this.state.liveSlideIndex - 1;

    if (sIdx >= 0) {
      this.setLiveSlide(gIdx, sIdx);
    } else if (gIdx - 1 >= 0) {
      const prevGroup = deck.groups[gIdx - 1];
      this.setLiveSlide(gIdx - 1, prevGroup.slides.length - 1);
    }
  }

  get projectDecks() {
    const list = [];
    if (Array.isArray(this.projectDeckIds)) {
      this.projectDeckIds.forEach(id => {
        const d = this.decks.find(deck => deck.id === id);
        if (d) list.push(d);
      });
    }
    return list.length > 0 ? list : this.decks;
  }

  addToProject(deckId) {
    if (!this.projectDeckIds.includes(deckId)) {
      this.projectDeckIds.push(deckId);
      setStorageItem("propresenter_project_deck_ids", JSON.stringify(this.projectDeckIds));
      this.notify();
    }
  }

  removeFromProject(deckId) {
    if (this.projectDeckIds.length <= 1) {
      alert("El proyecto debe conservar al menos un elemento.");
      return;
    }
    this.projectDeckIds = this.projectDeckIds.filter(id => id !== deckId);
    setStorageItem("propresenter_project_deck_ids", JSON.stringify(this.projectDeckIds));
    if (this.activeDeckId === deckId) {
      this.activeDeckId = this.projectDeckIds[0] || this.decks[0]?.id;
    }
    this.notify();
  }

  addDeck(deck) {
    this.decks.push(deck);
    if (!this.projectDeckIds.includes(deck.id)) {
      this.projectDeckIds.push(deck.id);
      setStorageItem("propresenter_project_deck_ids", JSON.stringify(this.projectDeckIds));
    }
    setStorageItem("propresenter_decks", JSON.stringify(this.decks));
    this.activeDeckId = deck.id;
    this.notify();
  }

  reflowDeckSlides(deckId, maxLines) {
    const targetMax = parseInt(maxLines);
    if (!targetMax || targetMax <= 0) return;
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) return;

    let modified = false;
    deck.groups.forEach((group, gIdx) => {
      const newSlides = [];
      group.slides.forEach((slide, sIdx) => {
        const lines = slide.text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > targetMax) {
          modified = true;
          for (let i = 0; i < lines.length; i += targetMax) {
            const chunkLines = lines.slice(i, i + targetMax);
            newSlides.push({
              id: `slide-${Date.now()}-${gIdx}-${sIdx}-${i / targetMax}`,
              text: chunkLines.join('\n'),
              isLowerThird: slide.isLowerThird || false
            });
          }
        } else {
          newSlides.push(slide);
        }
      });
      group.slides = newSlides;
    });

    if (modified) {
      setStorageItem("propresenter_decks", JSON.stringify(this.decks));
      this.notify();
    }
  }

  createNewShow(title, category, rawText, options = {}) {
    const opts = typeof options === 'object' && options !== null ? options : {};
    const splitMode = opts.splitMode || 'paragraph';
    let maxLines = parseInt(opts.maxLines) || 0;
    const targetTemplateId = opts.templateId || this.activeTemplateId;
    const targetTemplate = this.templates.find(t => t.id === targetTemplateId);

    if (maxLines <= 0 && targetTemplate && targetTemplate.maxLines > 0) {
      maxLines = targetTemplate.maxLines;
    }

    const groups = parseAndSplitText(rawText, splitMode, maxLines);

    const newDeck = {
      id: "deck-" + Date.now(),
      title: title || "Nuevo Texto de Proyección",
      type: "song",
      category: category || "Alabanza",
      templateId: targetTemplateId,
      groups: groups.length > 0 ? groups : [
        {
          name: "Diapositiva 1",
          badge: "badge-verse",
          slides: [{ id: `slide-${Date.now()}-0`, text: rawText || "Texto de diapositiva" }]
        }
      ]
    };

    this.addDeck(newDeck);
    if (targetTemplateId) {
      this.setActiveTemplate(targetTemplateId, false);
    }
    return newDeck;
  }

  duplicateDeck(deckId) {
    const source = this.decks.find(d => d.id === deckId);
    if (!source) return;

    const duplicated = JSON.parse(JSON.stringify(source));
    duplicated.id = "deck-" + Date.now() + Math.random().toString(36).substr(2, 4);
    duplicated.title = `${source.title} (Copia)`;
    
    duplicated.groups.forEach((group, gIdx) => {
      group.slides.forEach((slide, sIdx) => {
        slide.id = `slide-${Date.now()}-${gIdx}-${sIdx}`;
      });
    });

    this.decks.unshift(duplicated);
    this.projectDeckIds.unshift(duplicated.id);
    setStorageItem("propresenter_decks", JSON.stringify(this.decks));
    setStorageItem("propresenter_project_deck_ids", JSON.stringify(this.projectDeckIds));
    this.activeDeckId = duplicated.id;
    this.notify();
    return duplicated;
  }

  updateSlideText(deckId, groupIndex, slideIndex, newText, isTemporary = false) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck || !deck.groups[groupIndex] || !deck.groups[groupIndex].slides[slideIndex]) return;

    const slide = deck.groups[groupIndex].slides[slideIndex];

    if (isTemporary) {
      this.state.liveText = newText;
      this.state.liveSlideId = slide.id;
      this.state.liveGroupIndex = groupIndex;
      this.state.liveSlideIndex = slideIndex;
      this.state.isTextCleared = false;
    } else {
      slide.text = newText;
      if (this.state.liveSlideId === slide.id) {
        this.state.liveText = newText;
      }
    }
    this.notify();
  }

  duplicateSlide(deckId, groupIndex, slideIndex) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck || !deck.groups[groupIndex] || !deck.groups[groupIndex].slides[slideIndex]) return;

    const group = deck.groups[groupIndex];
    const sourceSlide = group.slides[slideIndex];
    const duplicatedSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: sourceSlide.text,
      isLowerThird: sourceSlide.isLowerThird || false
    };

    group.slides.splice(slideIndex + 1, 0, duplicatedSlide);
    this.notify();
    return duplicatedSlide;
  }

  deleteSlide(deckId, groupIndex, slideIndex) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck || !deck.groups[groupIndex] || !deck.groups[groupIndex].slides[slideIndex]) return;

    const totalSlides = deck.groups.reduce((acc, g) => acc + g.slides.length, 0);
    if (totalSlides <= 1) {
      alert("Debes conservar al menos una diapositiva en la presentación.");
      return;
    }

    const group = deck.groups[groupIndex];
    const deletedSlide = group.slides[slideIndex];
    group.slides.splice(slideIndex, 1);

    if (group.slides.length === 0 && deck.groups.length > 1) {
      deck.groups.splice(groupIndex, 1);
    }

    if (this.state.liveSlideId === deletedSlide.id) {
      this.clearText();
    }
    this.notify();
  }

  deleteDeck(deckId) {
    if (this.decks.length <= 1) return;
    this.decks = this.decks.filter(d => d.id !== deckId);
    this.projectDeckIds = this.projectDeckIds.filter(id => id !== deckId);
    setStorageItem("propresenter_decks", JSON.stringify(this.decks));
    setStorageItem("propresenter_project_deck_ids", JSON.stringify(this.projectDeckIds));
    if (this.activeDeckId === deckId) {
      this.activeDeckId = this.projectDeckIds[0] || this.decks[0]?.id;
    }
    this.notify();
  }

  // Virtual Media Folders & Items Management
  addMediaFolder(folderName) {
    const trimmed = folderName.trim();
    if (!trimmed || this.state.mediaFolders.includes(trimmed)) return;
    this.state.mediaFolders.push(trimmed);
    this.notify();
  }

  deleteMediaFolder(folderName) {
    if (folderName === "General") return;
    this.state.mediaFolders = this.state.mediaFolders.filter(f => f !== folderName);
    this.state.mediaLibrary.forEach(item => {
      if (item.folder === folderName) item.folder = "General";
    });
    this.notify();
  }

  addMediaItem(name, url, type = "video/mp4", folder = "General", thumbnail = "", filePath = "") {
    const targetFolder = folder ? folder.trim() : "General";
    if (targetFolder && !this.state.mediaFolders.includes(targetFolder)) {
      this.state.mediaFolders.push(targetFolder);
    }
    const newItem = {
      id: "media-" + Date.now() + Math.random().toString(36).substr(2, 4),
      name,
      url,
      filePath: filePath || "",
      type,
      folder: targetFolder || "General",
      thumbnail: thumbnail || ""
    };
    this.state.mediaLibrary.unshift(newItem);
    this.notify();
    return newItem;
  }

  addMediaBatch(items) {
    if (!Array.isArray(items) || items.length === 0) return [];
    
    const added = [];
    items.forEach((item, index) => {
      const targetFolder = item.folder ? item.folder.trim() : "General";
      if (targetFolder && !this.state.mediaFolders.includes(targetFolder)) {
        this.state.mediaFolders.push(targetFolder);
      }
      const newItem = {
        id: item.id || ("media-" + Date.now() + "-" + index + "-" + Math.random().toString(36).substr(2, 4)),
        name: item.name || "Medio sin nombre",
        url: item.url,
        filePath: item.filePath || "",
        type: item.type || "video/mp4",
        folder: targetFolder || "General",
        thumbnail: item.thumbnail || ""
      };
      this.state.mediaLibrary.unshift(newItem);
      added.push(newItem);
    });

    this.notify();
    return added;
  }

  updateMediaItemThumbnail(itemId, thumbnail) {
    const target = this.state.mediaLibrary.find(m => m.id === itemId);
    if (target && thumbnail) {
      target.thumbnail = thumbnail;
      setStorageItem("propresenter_media_library", JSON.stringify(this.state.mediaLibrary));
      this.notify();
    }
  }

  deleteMediaItem(itemId) {
    const target = this.state.mediaLibrary.find(m => m.id === itemId);
    if (!target) return;

    if (target.url && target.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(target.url);
      } catch (e) {
        console.warn("Failed to revoke Blob URL:", e);
      }
    }

    try {
      MediaCache.deleteMedia(itemId);
    } catch (e) {}

    this.state.mediaLibrary = this.state.mediaLibrary.filter(m => m.id !== itemId);
    if (this.state.activeVideoUrl === target.url) {
      this.clearMedia();
    }
    this.notify();
  }

  setActiveVideo(url, name = "", type = "") {
    this.state.activeVideoUrl = url;
    this.state.activeVideoName = name;
    this.state.activeVideoType = type;
    const isImage = (type && type.startsWith('image/')) || (url && url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i));
    this.state.activeVideoIsImage = !!isImage;
    this.state.backgroundType = isImage ? "image" : "video";
    this.state.isMediaCleared = false;
    this.notify();
  }
}

export const store = new Store();
