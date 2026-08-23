/**
 * ProPresenter AI Studio - State Management Store
 */

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

class Store {
  constructor() {
    this.decks = JSON.parse(localStorage.getItem("propresenter_decks")) || DEFAULT_DECKS;
    this.activeDeckId = this.decks[0].id;
    
    // ProPresenter Independent Layer State
    this.state = {
      liveText: "",
      liveSlideId: null,
      liveGroupIndex: null,
      liveSlideIndex: null,
      nextText: "",
      
      // Layer controls
      isTextCleared: false,
      isMediaCleared: false,
      isOverlayCleared: false,
      
      // Video Background Layer
      backgroundType: "gradient", // "video" | "gradient" | "black"
      activeVideoUrl: null,
      activeVideoName: "",
      mediaLibrary: [
        {
          id: "default-bg-1",
          name: "Cosmic Blue Loop",
          url: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4",
          type: "video/mp4"
        },
        {
          id: "default-bg-2",
          name: "Golden Particles Loop",
          url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-particles-in-the-dark-42998-large.mp4",
          type: "video/mp4"
        }
      ],
      
      // Lower Third / Overlay
      lowerThirdText: "",
      lowerThirdSubtext: "",
      isLowerThirdActive: false,
      
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
  }

  setActiveDeck(deckId) {
    this.activeDeckId = deckId;
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

  // Media & Video Management
  addMediaItem(name, url, type = "video/mp4") {
    const newItem = {
      id: "media-" + Date.now(),
      name,
      url,
      type
    };
    this.state.mediaLibrary.unshift(newItem);
    this.setActiveVideo(url, name);
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
