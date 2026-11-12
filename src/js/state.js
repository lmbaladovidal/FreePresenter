import { sync } from './broadcast.js';
import { MediaCache } from './media-cache.js';

export const SECTION_DEFINITIONS = [
  { id: 'intro', name: 'Intro', badge: 'badge-intro', icon: 'music', regex: /^\s*\[?(?:intro|introducci[oó]n)\]?:?\s*$/i },
  { id: 'verse', name: 'Verso', badge: 'badge-verse', icon: 'book-open', regex: /^\s*\[?(?:verso|estrofa|vers[ií]culo)\s*(\d*)\]?:?\s*$/i },
  { id: 'prechorus', name: 'Pre-Coro', badge: 'badge-prechorus', icon: 'zap', regex: /^\s*\[?(?:pre-?coro|pre-?chorus)\]?:?\s*$/i },
  { id: 'chorus', name: 'Coro', badge: 'badge-chorus', icon: 'flame', regex: /^\s*\[?(?:coro|chorus)\s*(\d*)\]?:?\s*$/i },
  { id: 'bridge', name: 'Puente', badge: 'badge-bridge', icon: 'git-commit', regex: /^\s*\[?(?:puente|bridge)\s*(\d*)\]?:?\s*$/i },
  { id: 'instrumental', name: 'Instrumental', badge: 'badge-instrumental', icon: 'headphones', regex: /^\s*\[?(?:instrumental|solo)\s*(\d*)\]?:?\s*$/i },
  { id: 'outro', name: 'Final', badge: 'badge-outro', icon: 'flag', regex: /^\s*\[?(?:outro|final|coda)\]?:?\s*$/i },
  { id: 'sermon', name: 'Sermón', badge: 'badge-sermon', icon: 'message-square', regex: /^\s*\[?(?:serm[oó]n|puntos)\]?:?\s*$/i },
  { id: 'lowerthird', name: 'Overlay', badge: 'badge-lowerthird', icon: 'user', regex: /^\s*\[?(?:lower-?third|overlay|tercero|z[oó]calo)\]?:?\s*$/i }
];

export function parseAndSplitText(rawText, splitMode = 'paragraph', maxLines = 0) {
  if (!rawText || !rawText.trim()) return [];

  const paragraphs = rawText.split(/(?:\r?\n\s*){2,}|(?:\r?\n\s*-{3,}\s*\r?\n)/).filter(p => p.trim());

  const groups = paragraphs.map((p, idx) => {
    let textBlock = p.trim();
    let badge = "badge-verse";
    let name = `Estrofa ${idx + 1}`;

    let rawLines = textBlock.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length === 0) return null;

    // 1. Check if first line is an explicit section tag like [Coro], [Verso 2], Coro:, etc.
    const firstLine = rawLines[0];
    let matchedDef = null;

    for (const def of SECTION_DEFINITIONS) {
      if (def.regex.test(firstLine)) {
        matchedDef = def;
        break;
      }
    }

    if (matchedDef) {
      badge = matchedDef.badge;
      const cleanName = firstLine.replace(/[\[\]:]/g, '').trim();
      name = cleanName || matchedDef.name;

      if (rawLines.length > 1) {
        rawLines.shift();
        textBlock = rawLines.join('\n');
      }
    } else {
      // 2. Check if first line starts with an inline prefix e.g. "Coro: Al contemplar..."
      const colonMatch = firstLine.match(/^(?:\[?(intro|verso\s*\d*|estrofa\s*\d*|pre-?coro|coro|chorus|puente|bridge|instrumental|outro|final|serm[oó]n)\]?)\s*:\s*(.+)$/i);
      if (colonMatch) {
        const secTag = colonMatch[1].toLowerCase();
        const remainingFirstLine = colonMatch[2].trim();
        for (const def of SECTION_DEFINITIONS) {
          if (def.regex.test(secTag)) {
            matchedDef = def;
            badge = def.badge;
            name = colonMatch[1].trim();
            rawLines[0] = remainingFirstLine;
            textBlock = rawLines.join('\n');
            break;
          }
        }
      }
    }

    // 3. Fallback heuristic keyword detection if not yet matched
    if (!matchedDef) {
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
      } else if (lower.startsWith("overlay") || lower.startsWith("lowerthird") || lower.startsWith("zocalo")) {
        badge = "badge-lowerthird";
        name = "Overlay";
      }
    }

    const isLowerThirdBadge = badge === "badge-lowerthird";
    let slides = [];

    if (splitMode === 'lines') {
      // 1 renglón por filmina
      slides = rawLines.map((lineText, sIdx) => ({
        id: `slide-${Date.now()}-${idx}-${sIdx}-${Math.random().toString(36).substr(2, 4)}`,
        text: lineText,
        isLowerThird: isLowerThirdBadge
      }));
    } else if ((splitMode === 'fixed' || maxLines > 0) && maxLines > 0) {
      // Bloques de N renglones por filmina
      let slideCount = 0;
      for (let i = 0; i < rawLines.length; i += maxLines) {
        const chunk = rawLines.slice(i, i + maxLines).join('\n');
        if (chunk) {
          slides.push({
            id: `slide-${Date.now()}-${idx}-${slideCount++}-${Math.random().toString(36).substr(2, 4)}`,
            text: chunk,
            isLowerThird: isLowerThirdBadge
          });
        }
      }
    } else {
      // Párrafo completo por filmina
      slides = [{
        id: `slide-${Date.now()}-${idx}-0`,
        text: textBlock,
        isLowerThird: isLowerThirdBadge
      }];
    }

    return {
      name,
      badge,
      slides: slides.length > 0 ? slides : [{ id: `slide-${Date.now()}-${idx}-0`, text: textBlock, isLowerThird: isLowerThirdBadge }]
    };
  }).filter(Boolean);

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
    this.decks = savedDecks ? JSON.parse(savedDecks) : JSON.parse(JSON.stringify(DEFAULT_DECKS));

    const savedProjectIds = getStorageItem("propresenter_project_deck_ids");
    this.projectDeckIds = savedProjectIds ? JSON.parse(savedProjectIds) : this.decks.map(d => d.id);
    this.activeDeckId = this.projectDeckIds[0] || this.decks[0]?.id || "song-1";

    // Persistent Templates
    const savedTemplates = getStorageItem("propresenter_templates");
    this.templates = savedTemplates ? JSON.parse(savedTemplates) : JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
    this.activeTemplateId = getStorageItem("propresenter_active_template") || "preset-modern";

    // Persistent Media Library & Folders
    const savedMedia = getStorageItem("propresenter_media_library");
    const savedFolders = getStorageItem("propresenter_media_folders");
    const savedPhysicalFolders = getStorageItem("propresenter_physical_media_folders");
    const savedMediaQueue = getStorageItem("propresenter_media_queue");

    this.state = {
      // Proyección Live
      activeVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",
      activeVideoTitle: "Space Motion Background",
      activeVideoName: "Space Stars Motion",
      activeMediaPlayId: 1,
      liveText: "",
      liveSlideImage: "",
      liveSlideNotes: "",
      liveDeckId: null,
      liveSlideId: null,
      liveGroupIndex: null,
      liveSlideIndex: null,
      nextText: "",
      nextSlideImage: "",

      // Master Clear Switches
      isTextCleared: false,
      isMediaCleared: false,
      isOverlayCleared: false,

      // Active Template Object
      activeTemplate: this.templates.find(t => t.id === this.activeTemplateId) || this.templates[0],

      // Media Virtual & Physical Folders
      mediaFolders: savedFolders ? JSON.parse(savedFolders) : ["General", "Anuncios", "Rápidos", "Estribos"],
      physicalMediaFolders: savedPhysicalFolders ? JSON.parse(savedPhysicalFolders) : [],
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
      mediaQueue: savedMediaQueue ? JSON.parse(savedMediaQueue) : [],

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
      isMediaPaused: false,
      mediaPlaybackCommand: null,

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
          }).catch(() => { });
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
            }).catch(() => { });
          }
        }
      });
    }

    // Provider for new windows requesting current state on launch
    sync.setStateProvider(() => this.getProjectionPayload());
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

  getProjectionPayload() {
    const { mediaLibrary, mediaFolders, physicalMediaFolders, ...projectionState } = this.state;
    return projectionState;
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state, this.decks));

    // Persistir en localStorage sin duplicar miniaturas Base64 pesadas (que viven en IndexedDB)
    const lightMediaLib = Array.isArray(this.state.mediaLibrary)
      ? this.state.mediaLibrary.map(({ thumbnail, ...rest }) => rest)
      : [];

    setStorageItem("propresenter_decks", JSON.stringify(this.decks));
    setStorageItem("propresenter_media_library", JSON.stringify(lightMediaLib));
    setStorageItem("propresenter_media_folders", JSON.stringify(this.state.mediaFolders));
    setStorageItem("propresenter_physical_media_folders", JSON.stringify(this.state.physicalMediaFolders || []));
    setStorageItem("propresenter_media_queue", JSON.stringify(this.state.mediaQueue || []));
    setStorageItem("propresenter_templates", JSON.stringify(this.templates));
    setStorageItem("propresenter_active_template", this.activeTemplateId);
    setStorageItem("propresenter_text_trans", this.state.textTransition);
    setStorageItem("propresenter_media_trans", this.state.mediaTransition);
    setStorageItem("propresenter_fade_duration", this.state.fadeDuration);
    setStorageItem("propresenter_media_audio_muted", String(this.state.isMediaAudioMuted));
    setStorageItem("propresenter_media_audio_volume", String(this.state.mediaAudioVolume));

    // Transmit lightweight projection state to Audience and Stage displays via Broadcast & IPC
    sync.sendUpdate(this.getProjectionPayload());
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

  buildEffectiveTemplateForSlide(deck, slide = null) {
    const baseTpl = (deck && deck.templateId && this.templates.find(t => t.id === deck.templateId))
      || this.templates.find(t => t.id === this.activeTemplateId)
      || this.templates[0]
      || DEFAULT_TEMPLATES[0]
      || {};
    const deckStyle = (deck && deck.style) ? deck.style : {};
    const slideStyle = (slide && slide.style) ? slide.style : {};
    const merged = { ...baseTpl, ...deckStyle, ...slideStyle };

    const shadowEnable = merged.shadowEnable !== undefined ? merged.shadowEnable : true;
    const shadowColor = merged.shadowColor || 'rgba(0,0,0,0.9)';
    const shadowBlur = merged.shadowBlur !== undefined ? merged.shadowBlur : 14;
    const shadowOffsetY = merged.shadowOffsetY !== undefined ? merged.shadowOffsetY : 4;
    merged.textShadow = shadowEnable ? `0 ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}` : 'none';

    if (merged.bgBoxEnable !== undefined) {
      if (merged.bgBoxEnable) {
        const hex = (merged.bgBoxColor || '#000000').replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        const a = (merged.bgBoxOpacity !== undefined ? merged.bgBoxOpacity : 40) / 100;
        merged.bgColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        merged.padding = merged.bgBoxPadding !== undefined ? merged.bgBoxPadding : 20;
        merged.borderRadius = merged.bgBoxRadius !== undefined ? merged.bgBoxRadius : 8;
      } else {
        merged.bgColor = 'transparent';
        merged.padding = 0;
        merged.borderRadius = 0;
      }
    }

    if (merged.verticalAlign === 'top') merged.posY = 22;
    else if (merged.verticalAlign === 'bottom') merged.posY = 82;
    else if (merged.verticalAlign === 'center') merged.posY = 50;

    merged.webkitTextStroke = merged.outlineEnable
      ? `${merged.outlineWidth || 2}px ${merged.outlineColor || '#000000'}`
      : 'none';

    return merged;
  }

  setActiveDeck(deckId) {
    this.activeDeckId = deckId;
    // Importante: seleccionar otra canción en el proyecto o biblioteca NO debe alterar
    // el estilo (activeTemplate) de la diapositiva que ya se encuentra proyectándose en vivo.
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
      const slideLabel = slide.text || (slide.image ? `${deck.title} — Diapositiva ${slideIndex + 1}` : "");
      this.state.liveText = slide.image ? (slide.text || slideLabel) : slide.text;
      this.state.liveSlideImage = slide.image || "";
      this.state.liveSlideNotes = slide.notes || "";
      this.state.liveDeckId = deck.id;
      this.state.liveSlideId = slide.id;
      this.state.liveGroupIndex = groupIndex;
      this.state.liveSlideIndex = slideIndex;
      this.state.isTextCleared = false;
      this.state.activeTemplate = this.buildEffectiveTemplateForSlide(deck, slide);

      let nextSlideObj = null;
      if (slideIndex + 1 < group.slides.length) {
        nextSlideObj = group.slides[slideIndex + 1];
      } else if (groupIndex + 1 < deck.groups.length) {
        nextSlideObj = deck.groups[groupIndex + 1].slides[0] || null;
      }
      this.state.nextText = nextSlideObj
        ? (nextSlideObj.text || (nextSlideObj.image ? `Diapositiva siguiente` : ""))
        : "";
      this.state.nextSlideImage = nextSlideObj?.image || "";
    }

    this.notify();
  }

  // Master Clear Functions
  clearAll() {
    this.state.isTextCleared = true;
    this.state.isMediaCleared = true;
    this.state.isOverlayCleared = true;
    this.state.liveSlideId = null;
    this.state.liveSlideImage = "";
    this.state.liveSlideNotes = "";
    this.state.nextSlideImage = "";
    this.state.isLowerThirdActive = false;
    this.state.isMediaPaused = false;
    this.notify();
  }

  clearText() {
    this.state.isTextCleared = true;
    this.state.liveSlideId = null;
    this.state.liveSlideImage = "";
    this.state.liveSlideNotes = "";
    this.state.nextSlideImage = "";
    this.notify();
  }

  clearMedia() {
    this.state.isMediaCleared = true;
    this.state.isMediaPaused = false;
    this.notify();
  }

  clearOverlays() {
    this.state.isOverlayCleared = true;
    this.state.isLowerThirdActive = false;
    this.notify();
  }

  clearLowerThird() {
    this.clearOverlays();
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

    const isOverlayCategory = (category || "").toLowerCase().includes("overlay") || (category || "").toLowerCase().includes("lowerthird");
    const isOverlayType = isOverlayCategory || groups.some(g => g.badge === "badge-lowerthird");

    const newDeck = {
      id: "deck-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      title: title || (isOverlayType ? "Nuevo Overlay Lower Third" : "Nuevo Texto de Proyección"),
      type: isOverlayType ? "lowerthird" : "song",
      category: category || (isOverlayType ? "Overlays Stream" : "Alabanza"),
      templateId: targetTemplateId || (isOverlayType ? "preset-lowerthird" : this.activeTemplateId),
      groups: groups.length > 0 ? groups : [
        {
          name: isOverlayType ? "Presentador" : "Diapositiva 1",
          badge: isOverlayType ? "badge-lowerthird" : "badge-verse",
          slides: [{ id: `slide-${Date.now()}-0`, text: rawText || (isOverlayType ? "Nombre del Presentador\nCargo o Función" : "Texto de diapositiva"), isLowerThird: isOverlayType }]
        }
      ]
    };

    if (isOverlayCategory) {
      newDeck.groups.forEach(g => {
        if (!g.badge || g.badge === "badge-verse") g.badge = "badge-lowerthird";
        g.slides.forEach(s => s.isLowerThird = true);
      });
    }

    this.addDeck(newDeck);
    if (targetTemplateId) {
      this.setActiveTemplate(targetTemplateId, false);
    }
    return newDeck;
  }

  /**
   * Crea un deck a partir de una presentación importada (PPTX / PPT / PPSX / ODP / PDF).
   * - mode === 'slides' (por defecto): proyecta cada diapositiva tal cual con su diseño original.
   * - mode === 'text': extrae el texto de cada diapositiva como filminas editables con plantilla.
   */
  createPresentationDeck(payload = {}, options = {}) {
    const mode = options.mode === 'text' ? 'text' : 'slides';
    const includeHidden = Boolean(options.includeHidden);
    const category = options.category || 'Presentación';
    const title = (options.title || payload.title || 'Presentación Importada').trim();
    const rawSlides = Array.isArray(payload.slides) ? payload.slides : [];
    const visibleSlides = includeHidden ? rawSlides : rawSlides.filter(s => !s.hidden);
    const slidesSource = visibleSlides.length > 0 ? visibleSlides : rawSlides;

    if (mode === 'text') {
      const blocks = slidesSource
        .map((s, idx) => (s.text || '').trim() || `Diapositiva ${idx + 1}`)
        .filter(Boolean);
      if (payload.assetId && typeof window !== 'undefined' && window.electronAPI?.deletePresentationAssets) {
        window.electronAPI.deletePresentationAssets(payload.assetId).catch(() => { });
      }
      return this.createNewShow(title, category, blocks.join('\n\n'), {
        templateId: options.templateId || this.activeTemplateId,
        splitMode: 'paragraph',
        maxLines: options.maxLines || 0
      });
    }

    const now = Date.now();
    const deckSlides = slidesSource.map((s, idx) => ({
      id: `slide-${now}-${idx}`,
      text: (s.text || '').trim(),
      notes: (s.notes || '').trim(),
      image: s.image || '',
      thumb: s.thumb || s.image || '',
      slideNumber: s.index || (idx + 1)
    }));

    const newDeck = {
      id: `pres-deck-${now}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      type: 'presentation',
      category,
      assetId: payload.assetId || null,
      sourcePath: payload.sourcePath || '',
      sourceName: payload.sourceName || '',
      engine: payload.engine || 'powerpoint',
      aspectWidth: payload.width || 1920,
      aspectHeight: payload.height || 1080,
      groups: [
        {
          name: 'Diapositivas',
          badge: 'badge-sermon',
          slides: deckSlides.length > 0 ? deckSlides : [
            { id: `slide-${now}-0`, text: title, image: '', thumb: '' }
          ]
        }
      ]
    };

    this.addDeck(newDeck);
    return newDeck;
  }

  updateDeckContent(deckId, title, category, rawText, options = {}) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) return null;

    const opts = typeof options === 'object' && options !== null ? options : {};
    const splitMode = opts.splitMode || 'paragraph';
    let maxLines = parseInt(opts.maxLines) || 0;
    const targetTemplateId = opts.templateId || deck.templateId || this.activeTemplateId;
    const targetTemplate = this.templates.find(t => t.id === targetTemplateId);

    if (maxLines <= 0 && targetTemplate && targetTemplate.maxLines > 0) {
      maxLines = targetTemplate.maxLines;
    }

    const groups = parseAndSplitText(rawText, splitMode, maxLines);
    const isOverlayCategory = (category || "").toLowerCase().includes("overlay") || (category || "").toLowerCase().includes("lowerthird");
    const isOverlayType = isOverlayCategory || groups.some(g => g.badge === "badge-lowerthird");

    deck.title = title || deck.title;
    deck.category = category || deck.category || "Alabanza";
    deck.type = isOverlayType ? "lowerthird" : (deck.type === "lowerthird" ? "lowerthird" : "song");
    deck.templateId = targetTemplateId;
    deck.groups = groups.length > 0 ? groups : [
      {
        name: isOverlayType ? "Presentador" : "Diapositiva 1",
        badge: isOverlayType ? "badge-lowerthird" : "badge-verse",
        slides: [{ id: `slide-${Date.now()}-0`, text: rawText || "Texto de diapositiva", isLowerThird: isOverlayType }]
      }
    ];

    if (isOverlayCategory) {
      deck.groups.forEach(g => {
        if (!g.badge || g.badge === "badge-verse") g.badge = "badge-lowerthird";
        g.slides.forEach(s => s.isLowerThird = true);
      });
    }

    setStorageItem("propresenter_decks", JSON.stringify(this.decks));
    if (this.activeDeckId === deck.id && !this.state.isTextCleared && this.state.liveGroupIndex !== null) {
      const gIdx = Math.min(this.state.liveGroupIndex, deck.groups.length - 1);
      const sIdx = Math.min(this.state.liveSlideIndex || 0, deck.groups[gIdx].slides.length - 1);
      this.setLiveSlide(gIdx, sIdx);
    } else {
      this.notify();
    }
    return deck;
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

  setGroupSection(deckId, groupIndex, sectionName, sectionBadge) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck || !deck.groups[groupIndex]) return;

    deck.groups[groupIndex].name = sectionName;
    if (sectionBadge) {
      deck.groups[groupIndex].badge = sectionBadge;
      const isLt = sectionBadge === "badge-lowerthird";
      deck.groups[groupIndex].slides.forEach(s => s.isLowerThird = isLt);
      if (isLt && deck.type !== "lowerthird") {
        deck.type = "lowerthird";
      }
    }
    this.notify();
  }

  splitGroupAtSlide(deckId, groupIndex, slideIndex, newSectionName = 'Coro', newSectionBadge = 'badge-chorus') {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck || !deck.groups[groupIndex]) return;

    const group = deck.groups[groupIndex];
    if (slideIndex <= 0 || slideIndex >= group.slides.length) return;

    const remainingSlides = group.slides.splice(slideIndex);
    const isLt = newSectionBadge === "badge-lowerthird";
    remainingSlides.forEach(s => s.isLowerThird = isLt);

    const newGroup = {
      name: newSectionName,
      badge: newSectionBadge,
      slides: remainingSlides
    };

    deck.groups.splice(groupIndex + 1, 0, newGroup);
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

  addSlideToDeck(deckId, groupIndex = null, text = "Nueva filmina", isLowerThird = false) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) return null;

    if (!Array.isArray(deck.groups) || deck.groups.length === 0) {
      deck.groups = [{
        name: isLowerThird ? "Presentador" : "Estrofa 1",
        badge: isLowerThird ? "badge-lowerthird" : "badge-verse",
        slides: []
      }];
    }

    let targetGIdx = typeof groupIndex === 'number' && groupIndex >= 0 && groupIndex < deck.groups.length
      ? groupIndex
      : deck.groups.length - 1;

    const group = deck.groups[targetGIdx];
    const newSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: text || "Texto de diapositiva",
      isLowerThird: !!isLowerThird || group.badge === "badge-lowerthird" || deck.type === "lowerthird"
    };

    group.slides.push(newSlide);
    this.notify();
    return { groupIndex: targetGIdx, slideIndex: group.slides.length - 1, slide: newSlide };
  }

  moveSlide(deckId, fromGroupIndex, fromSlideIndex, direction) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck || !deck.groups[fromGroupIndex] || !deck.groups[fromGroupIndex].slides[fromSlideIndex]) return false;

    const currentGroup = deck.groups[fromGroupIndex];
    const [slide] = currentGroup.slides.splice(fromSlideIndex, 1);

    if (direction === 'up') {
      if (fromSlideIndex > 0) {
        currentGroup.slides.splice(fromSlideIndex - 1, 0, slide);
      } else if (fromGroupIndex > 0) {
        const prevGroup = deck.groups[fromGroupIndex - 1];
        prevGroup.slides.push(slide);
      } else {
        currentGroup.slides.unshift(slide);
      }
    } else if (direction === 'down') {
      if (fromSlideIndex < currentGroup.slides.length) {
        currentGroup.slides.splice(fromSlideIndex + 1, 0, slide);
      } else if (fromGroupIndex < deck.groups.length - 1) {
        const nextGroup = deck.groups[fromGroupIndex + 1];
        nextGroup.slides.unshift(slide);
      } else {
        currentGroup.slides.push(slide);
      }
    }

    this.notify();
    return true;
  }

  updateDeckStyle(deckId, styleUpdates) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck || typeof styleUpdates !== 'object') return;

    deck.style = { ...(deck.style || {}), ...styleUpdates };
    // Limpiar overrides individuales de las claves actualizadas cuando se aplica a toda la canción
    const updatedKeys = Object.keys(styleUpdates);
    if (Array.isArray(deck.groups)) {
      deck.groups.forEach(group => {
        (group.slides || []).forEach(slide => {
          if (slide && slide.style) {
            updatedKeys.forEach(k => {
              delete slide.style[k];
            });
          }
        });
      });
    }
    if (deck.id === this.state.liveDeckId) {
      const activeGroup = deck.groups?.[this.state.liveGroupIndex] || deck.groups?.[0];
      const activeSlide = activeGroup?.slides?.[this.state.liveSlideIndex] || null;
      this.state.activeTemplate = this.buildEffectiveTemplateForSlide(deck, activeSlide);
    }
    this.notify();
    return deck.style;
  }

  setDeckTemplate(deckId, templateId) {
    const deck = this.decks.find(d => d.id === deckId);
    const template = this.templates.find(t => t.id === templateId);
    if (!deck || !template) return false;

    deck.templateId = templateId;
    // Asignar el estilo base de la plantilla al deck y limpiar estilos locales residuales
    deck.style = { ...template };
    if (Array.isArray(deck.groups)) {
      deck.groups.forEach(group => {
        (group.slides || []).forEach(slide => {
          if (slide && slide.style) {
            slide.style = {};
          }
        });
      });
    }

    // Si la plantilla define límite de renglones, re-dividir las filminas de este show si excede
    if (template.maxLines && template.maxLines > 0) {
      const targetMax = parseInt(template.maxLines);
      let modified = false;
      deck.groups.forEach((group, gIdx) => {
        const newSlides = [];
        group.slides.forEach((slide, sIdx) => {
          const lines = (slide.text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
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
    }

    // Si este show está proyectándose actualmente en vivo, actualizar el activeTemplate proyectado
    if (deck.id === this.state.liveDeckId) {
      const activeGroup = deck.groups?.[this.state.liveGroupIndex] || deck.groups?.[0];
      const activeSlide = activeGroup?.slides?.[this.state.liveSlideIndex] || null;
      this.state.activeTemplate = this.buildEffectiveTemplateForSlide(deck, activeSlide);
    }

    this.notify();
    return true;
  }

  deleteDeck(deckId) {
    if (this.decks.length <= 1) return;
    const target = this.decks.find(d => d.id === deckId);
    this.decks = this.decks.filter(d => d.id !== deckId);
    this.projectDeckIds = this.projectDeckIds.filter(id => id !== deckId);
    setStorageItem("propresenter_decks", JSON.stringify(this.decks));
    setStorageItem("propresenter_project_deck_ids", JSON.stringify(this.projectDeckIds));
    if (this.activeDeckId === deckId) {
      this.activeDeckId = this.projectDeckIds[0] || this.decks[0]?.id;
    }
    if (this.state.liveDeckId === deckId) {
      this.clearText();
    }
    if (target?.assetId && !this.decks.some(d => d.assetId === target.assetId)) {
      if (typeof window !== 'undefined' && window.electronAPI?.deletePresentationAssets) {
        window.electronAPI.deletePresentationAssets(target.assetId).catch(() => { });
      }
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

  // Physical Disk Folders Management (Real-Time Sync)
  addPhysicalMediaFolder(folderPath, folderName = "", files = []) {
    if (!folderPath || typeof folderPath !== "string") return null;
    const normalizedPath = folderPath.trim();
    if (!Array.isArray(this.state.physicalMediaFolders)) {
      this.state.physicalMediaFolders = [];
    }

    const derivedName = folderName ? folderName.trim() : (normalizedPath.split(/[\\/]/).filter(Boolean).pop() || normalizedPath);
    let existing = this.state.physicalMediaFolders.find(f => f.path === normalizedPath);
    if (!existing) {
      existing = {
        path: normalizedPath,
        name: derivedName,
        isPhysical: true,
        addedAt: Date.now()
      };
      this.state.physicalMediaFolders.push(existing);
    } else {
      existing.name = derivedName;
    }

    this.syncPhysicalFolderItems(normalizedPath, derivedName, files);
    return existing;
  }

  syncPhysicalFolderItems(folderPath, folderName = "", files = []) {
    if (!folderPath) return;
    const normalizedPath = folderPath.trim();
    const derivedName = folderName ? folderName.trim() : (normalizedPath.split(/[\\/]/).filter(Boolean).pop() || normalizedPath);
    const folderTag = `phys:${normalizedPath}`;

    if (!Array.isArray(this.state.physicalMediaFolders)) {
      this.state.physicalMediaFolders = [];
    }
    const physRecord = this.state.physicalMediaFolders.find(f => f.path === normalizedPath);
    if (physRecord) {
      physRecord.name = derivedName;
    }

    const incomingFiles = Array.isArray(files) ? files : [];
    const incomingUrlSet = new Set(incomingFiles.map(f => f.url || (`file:///${(f.filePath || '').replace(/\\/g, '/')}`)));
    const incomingPathSet = new Set(incomingFiles.map(f => f.filePath).filter(Boolean));

    // Map existing items from this physical folder by url or filePath to preserve IDs and generated thumbnails
    const existingByPathOrUrl = new Map();
    this.state.mediaLibrary.forEach(item => {
      if (item.physicalFolder === normalizedPath || item.physicalFolderPath === normalizedPath || item.folder === folderTag) {
        if (item.filePath) existingByPathOrUrl.set(item.filePath, item);
        if (item.url) existingByPathOrUrl.set(item.url, item);
      }
    });

    // Remove items from this physical folder that were deleted on disk
    this.state.mediaLibrary = this.state.mediaLibrary.filter(item => {
      const belongsToFolder = item.physicalFolder === normalizedPath || item.physicalFolderPath === normalizedPath || item.folder === folderTag;
      if (!belongsToFolder) return true;
      const stillExists = (item.filePath && incomingPathSet.has(item.filePath)) || (item.url && incomingUrlSet.has(item.url));
      if (!stillExists && Array.isArray(this.state.mediaQueue)) {
        this.state.mediaQueue = this.state.mediaQueue.filter(q => q.id !== item.id && q.url !== item.url);
      }
      return stillExists;
    });

    // Add any new files added on disk
    incomingFiles.forEach((f, idx) => {
      const fileUrl = f.url || (f.filePath ? `file:///${f.filePath.replace(/\\/g, '/')}` : '');
      const existingItem = (f.filePath && existingByPathOrUrl.get(f.filePath)) || (fileUrl && existingByPathOrUrl.get(fileUrl));
      if (!existingItem && fileUrl) {
        const isImg = (f.type && f.type.startsWith('image/')) || !!(f.name && f.name.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i));
        this.state.mediaLibrary.push({
          id: "phys-media-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substr(2, 4),
          name: f.name || fileUrl.split('/').pop() || "Medio de Disco",
          url: fileUrl,
          filePath: f.filePath || "",
          type: f.type || (isImg ? "image/png" : "video/mp4"),
          folder: derivedName,
          folderDisplayName: derivedName,
          physicalFolder: normalizedPath,
          physicalFolderPath: normalizedPath,
          isPhysicalFolderItem: true,
          thumbnail: f.thumbnail || ""
        });
      } else if (existingItem) {
        existingItem.folder = derivedName;
        existingItem.folderDisplayName = derivedName;
        existingItem.physicalFolder = normalizedPath;
        existingItem.physicalFolderPath = normalizedPath;
        existingItem.isPhysicalFolderItem = true;
      }
    });

    this.notify();
  }

  removePhysicalMediaFolder(folderPath) {
    if (!folderPath) return;
    const normalizedPath = folderPath.trim();
    const folderTag = `phys:${normalizedPath}`;
    if (Array.isArray(this.state.physicalMediaFolders)) {
      this.state.physicalMediaFolders = this.state.physicalMediaFolders.filter(f => f.path !== normalizedPath);
    }
    this.state.mediaLibrary.forEach(item => {
      const belongsToFolder = item.physicalFolder === normalizedPath ||
        item.physicalFolderPath === normalizedPath ||
        item.folder === folderTag;
      if (belongsToFolder && typeof item.url === 'string' && item.url.startsWith('blob:')) {
        try { URL.revokeObjectURL(item.url); } catch (e) { }
      }
    });
    this.state.mediaLibrary = this.state.mediaLibrary.filter(item =>
      item.physicalFolder !== normalizedPath &&
      item.physicalFolderPath !== normalizedPath &&
      item.folder !== folderTag
    );
    if (Array.isArray(this.state.mediaQueue)) {
      this.state.mediaQueue = this.state.mediaQueue.filter(q =>
        q.folder !== folderTag &&
        q.physicalFolder !== normalizedPath &&
        q.physicalFolderPath !== normalizedPath
      );
    }
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
    if (target && thumbnail && target.thumbnail !== thumbnail) {
      target.thumbnail = thumbnail;
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
    } catch (e) { }

    this.state.mediaLibrary = this.state.mediaLibrary.filter(m => m.id !== itemId);
    if (Array.isArray(this.state.mediaQueue)) {
      this.state.mediaQueue = this.state.mediaQueue.filter(q => q.id !== itemId && q.url !== target.url);
    }
    if (this.state.activeVideoUrl === target.url) {
      this.clearMedia();
    }
    this.notify();
  }

  setActiveVideo(url, name = "", type = "") {
    this.state.activeVideoUrl = url;
    this.state.activeVideoName = name || this.state.mediaLibrary.find(m => m.url === url)?.name || "Fondo Multimedia";
    this.state.activeVideoTitle = this.state.activeVideoName;
    this.state.activeVideoType = type;
    this.state.activeMediaPlayId = (this.state.activeMediaPlayId || 0) + 1;
    const isImage = (type && type.startsWith('image/')) || (url && url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i));
    this.state.activeVideoIsImage = !!isImage;
    this.state.backgroundType = isImage ? "image" : "video";
    this.state.isMediaCleared = false;
    this.state.isMediaPaused = false;
    this.state.mediaPlaybackCommand = null;
    this.notify();
  }

  // Media Playback Timeline & Transport Control (Play / Pause / Seek / Restart)
  setMediaPaused(paused) {
    this.state.isMediaPaused = !!paused;
    const cmd = {
      id: "cmd-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      action: this.state.isMediaPaused ? "pause" : "play",
      timestamp: Date.now()
    };
    this.state.mediaPlaybackCommand = cmd;
    sync.sendMediaCommand(cmd);
    this.notify();
    return this.state.isMediaPaused;
  }

  toggleMediaPause() {
    return this.setMediaPaused(!this.state.isMediaPaused);
  }

  seekActiveMedia(timeSeconds) {
    const targetTime = Math.max(0, Number(timeSeconds) || 0);
    const cmd = {
      id: "cmd-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      action: "seek",
      time: targetTime,
      timestamp: Date.now()
    };
    this.state.mediaPlaybackCommand = cmd;
    sync.sendMediaCommand(cmd);
    this.notify();
    return targetTime;
  }

  restartActiveMedia() {
    this.state.isMediaPaused = false;
    const cmd = {
      id: "cmd-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      action: "restart",
      time: 0,
      timestamp: Date.now()
    };
    this.state.mediaPlaybackCommand = cmd;
    sync.sendMediaCommand(cmd);
    this.notify();
  }

  // Media Playback Queue Management (Alt+Click / Auto-advance on video end)
  enqueueMedia(itemOrId) {
    if (!Array.isArray(this.state.mediaQueue)) {
      this.state.mediaQueue = [];
    }

    let source = null;
    if (typeof itemOrId === "string") {
      source = this.state.mediaLibrary.find(m => m.id === itemOrId || m.url === itemOrId);
    } else if (itemOrId && typeof itemOrId === "object") {
      source = this.state.mediaLibrary.find(m => (itemOrId.id && m.id === itemOrId.id) || (itemOrId.url && m.url === itemOrId.url)) || itemOrId;
    }

    if (!source || !source.url) return null;

    const queueEntry = {
      queueId: "q-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      id: source.id || "",
      name: source.name || "Elemento Multimedia",
      url: source.url,
      type: source.type || "video/mp4",
      folder: source.folder || "General",
      thumbnail: source.thumbnail || ""
    };

    this.state.mediaQueue.push(queueEntry);
    this.notify();
    return queueEntry;
  }

  removeFromMediaQueue(queueIdOrIndex) {
    if (!Array.isArray(this.state.mediaQueue)) return;
    if (typeof queueIdOrIndex === "number") {
      if (queueIdOrIndex >= 0 && queueIdOrIndex < this.state.mediaQueue.length) {
        this.state.mediaQueue.splice(queueIdOrIndex, 1);
      }
    } else {
      this.state.mediaQueue = this.state.mediaQueue.filter(q => q.queueId !== queueIdOrIndex);
    }
    this.notify();
  }

  moveMediaQueueItem(fromIndex, toIndex) {
    if (!Array.isArray(this.state.mediaQueue)) return;
    if (
      fromIndex < 0 ||
      fromIndex >= this.state.mediaQueue.length ||
      toIndex < 0 ||
      toIndex >= this.state.mediaQueue.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const [moved] = this.state.mediaQueue.splice(fromIndex, 1);
    this.state.mediaQueue.splice(toIndex, 0, moved);
    this.notify();
  }

  clearMediaQueue() {
    this.state.mediaQueue = [];
    this.notify();
  }

  advanceMediaQueue() {
    if (!Array.isArray(this.state.mediaQueue) || this.state.mediaQueue.length === 0) {
      return null;
    }
    const nextItem = this.state.mediaQueue.shift();
    if (!nextItem) return null;
    this.setActiveVideo(nextItem.url, nextItem.name, nextItem.type);
    return nextItem;
  }

  playQueueItemNow(queueId) {
    if (!Array.isArray(this.state.mediaQueue) || this.state.mediaQueue.length === 0) return null;
    const idx = this.state.mediaQueue.findIndex(q => q.queueId === queueId);
    if (idx === -1) return null;
    const [targetItem] = this.state.mediaQueue.splice(idx, 1);
    this.setActiveVideo(targetItem.url, targetItem.name, targetItem.type);
    return targetItem;
  }
}

export const store = new Store();
