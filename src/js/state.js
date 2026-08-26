import { sync } from './broadcast.js';

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

export class Store {
  constructor() {
    // Persistent Decks
    const savedDecks = localStorage.getItem("propresenter_decks");
    this.decks = savedDecks ? JSON.parse(savedDecks) : DEFAULT_DECKS;
    this.activeDeckId = this.decks[0]?.id || "song-1";

    // Persistent Templates
    const savedTemplates = localStorage.getItem("propresenter_templates");
    this.templates = savedTemplates ? JSON.parse(savedTemplates) : DEFAULT_TEMPLATES;
    this.activeTemplateId = localStorage.getItem("propresenter_active_template") || "preset-modern";

    // Persistent Media Library & Folders
    const savedMedia = localStorage.getItem("propresenter_media_library");
    const savedFolders = localStorage.getItem("propresenter_media_folders");

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
      textTransition: localStorage.getItem("propresenter_text_trans") || "fade",
      mediaTransition: localStorage.getItem("propresenter_media_trans") || "fade",
      fadeDuration: parseInt(localStorage.getItem("propresenter_fade_duration") || "250"),

      // Scripture Settings
      scriptureMaxLines: parseInt(localStorage.getItem("propresenter_scripture_maxlines") || "2"),
      scriptureFont: localStorage.getItem("propresenter_scripture_font") || "Inter, sans-serif",
      scriptureSplitLong: localStorage.getItem("propresenter_scripture_split") !== "false",
      scriptureShowRef: localStorage.getItem("propresenter_scripture_show_ref") !== "false",

      // Stage & Timers
      stageMessage: "",
      timerValue: 600,
      timerRunning: false
    };

    this.listeners = [];
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
    localStorage.setItem("propresenter_decks", JSON.stringify(this.decks));
    localStorage.setItem("propresenter_media_library", JSON.stringify(this.state.mediaLibrary));
    localStorage.setItem("propresenter_media_folders", JSON.stringify(this.state.mediaFolders));
    localStorage.setItem("propresenter_templates", JSON.stringify(this.templates));
    localStorage.setItem("propresenter_active_template", this.activeTemplateId);
    localStorage.setItem("propresenter_text_trans", this.state.textTransition);
    localStorage.setItem("propresenter_media_trans", this.state.mediaTransition);
    localStorage.setItem("propresenter_fade_duration", this.state.fadeDuration);

    // Transmit updated state to Audience and Stage displays via Broadcast & IPC
    sync.sendUpdate(this.state);
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

    localStorage.setItem("propresenter_scripture_maxlines", this.state.scriptureMaxLines);
    localStorage.setItem("propresenter_scripture_font", this.state.scriptureFont);
    localStorage.setItem("propresenter_scripture_split", this.state.scriptureSplitLong);
    localStorage.setItem("propresenter_scripture_show_ref", this.state.scriptureShowRef);

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

  setActiveTemplate(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      this.activeTemplateId = templateId;
      this.state.activeTemplate = { ...template };
      this.notify();
    }
  }

  updateActiveTemplateProperties(props) {
    if (!this.state.activeTemplate) return;
    this.state.activeTemplate = { ...this.state.activeTemplate, ...props };
    const idx = this.templates.findIndex(t => t.id === (props.id || this.activeTemplateId));
    if (idx !== -1) {
      this.templates[idx] = { ...this.state.activeTemplate };
    }
    this.notify();
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

  addDeck(deck) {
    this.decks.push(deck);
    this.activeDeckId = deck.id;
    this.notify();
  }

  createNewShow(title, category, rawText) {
    const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim());
    const groups = paragraphs.map((p, idx) => {
      const textBlock = p.trim();
      let badge = "badge-verse";
      let name = `Estrofa ${idx + 1}`;
      
      const lower = textBlock.toLowerCase();
      if (lower.includes("coro") || lower.includes("chorus")) {
        badge = "badge-chorus";
        name = "Coro";
      } else if (lower.includes("puente") || lower.includes("bridge")) {
        badge = "badge-bridge";
        name = "Puente";
      } else if (lower.includes("sermon") || lower.includes("puntos")) {
        badge = "badge-sermon";
        name = "Sermón";
      }

      return {
        name,
        badge,
        slides: [
          {
            id: `slide-${Date.now()}-${idx}`,
            text: textBlock
          }
        ]
      };
    });

    const newDeck = {
      id: "deck-" + Date.now(),
      title: title || "Nuevo Texto de Proyección",
      type: "song",
      category: category || "Alabanza",
      groups: groups.length > 0 ? groups : [
        {
          name: "Diapositiva 1",
          badge: "badge-verse",
          slides: [{ id: `slide-${Date.now()}-0`, text: rawText || "Texto de diapositiva" }]
        }
      ]
    };

    this.addDeck(newDeck);
    return newDeck;
  }

  deleteDeck(deckId) {
    if (this.decks.length <= 1) return;
    this.decks = this.decks.filter(d => d.id !== deckId);
    if (this.activeDeckId === deckId) {
      this.activeDeckId = this.decks[0].id;
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

  addMediaItem(name, url, type = "video/mp4", folder = "General") {
    const targetFolder = folder ? folder.trim() : "General";
    if (targetFolder && !this.state.mediaFolders.includes(targetFolder)) {
      this.state.mediaFolders.push(targetFolder);
    }
    const newItem = {
      id: "media-" + Date.now() + Math.random().toString(36).substr(2, 4),
      name,
      url,
      type,
      folder: targetFolder || "General"
    };
    this.state.mediaLibrary.unshift(newItem);
    this.notify();
  }

  addMediaBatch(items) {
    if (!Array.isArray(items) || items.length === 0) return;
    
    items.forEach((item, index) => {
      const targetFolder = item.folder ? item.folder.trim() : "General";
      if (targetFolder && !this.state.mediaFolders.includes(targetFolder)) {
        this.state.mediaFolders.push(targetFolder);
      }
      const newItem = {
        id: "media-" + Date.now() + "-" + index + "-" + Math.random().toString(36).substr(2, 4),
        name: item.name || "Video sin nombre",
        url: item.url,
        type: item.type || "video/mp4",
        folder: targetFolder || "General"
      };
      this.state.mediaLibrary.unshift(newItem);
    });

    this.notify();
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

    this.state.mediaLibrary = this.state.mediaLibrary.filter(m => m.id !== itemId);
    if (this.state.activeVideoUrl === target.url) {
      this.clearMedia();
    }
    this.notify();
  }

  setActiveVideo(url, name = "") {
    this.state.activeVideoUrl = url;
    this.state.activeVideoName = name;
    this.state.backgroundType = "video";
    this.state.isMediaCleared = false;
    this.notify();
  }
}

export const store = new Store();
