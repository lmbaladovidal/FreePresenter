/**
 * ProPresenter AI Studio - AI Copilot Engine
 * Provides intelligent generation for lyric slide decks, sermon outlines, lower-thirds and shaders.
 */

import { store } from './state.js';

export class AICopilot {
  constructor() {
    this.isProcessing = false;
  }

  async generateFromPrompt(promptText) {
    this.isProcessing = true;
    const lowerPrompt = promptText.toLowerCase();

    // Simulate AI inference delay for realism
    await new Promise(r => setTimeout(r, 600));

    if (lowerPrompt.includes("canto") || lowerPrompt.includes("cancion") || lowerPrompt.includes("alabanza") || lowerPrompt.includes("gracia") || lowerPrompt.includes("dios")) {
      return this.generateSongDeck(promptText);
    } else if (lowerPrompt.includes("shader") || lowerPrompt.includes("fondo") || lowerPrompt.includes("animado") || lowerPrompt.includes("efecto")) {
      return this.generateShaderScript(promptText);
    } else if (lowerPrompt.includes("lower third") || lowerPrompt.includes("tercero") || lowerPrompt.includes("overlay") || lowerPrompt.includes("pastor") || lowerPrompt.includes("invitado")) {
      return this.generateLowerThird(promptText);
    } else {
      return this.generateSermonDeck(promptText);
    }
  }

  generateSongDeck(promptText) {
    const titleMatch = promptText.match(/(?:canto|cancion|alabanza|para)\s+["']?([^"'\n,]+)["']?/i);
    const title = titleMatch ? titleMatch[1].trim() : "Nuevo Canto de Alabanza";

    const newDeck = {
      id: "ai-deck-" + Date.now(),
      title: title.toUpperCase(),
      type: "song",
      category: "Generado por IA",
      groups: [
        {
          name: "Estrofa 1",
          badge: "badge-verse",
          slides: [
            { id: `ai-${Date.now()}-1`, text: `Tu amor me alcanzó en la oscuridad,\nLlenaste mi vida de tu gran paz.` },
            { id: `ai-${Date.now()}-2`, text: `Hoy canto a tu nombre con libertad,\nJesús, mi Rey, mi salvador.` }
          ]
        },
        {
          name: "Coro",
          badge: "badge-chorus",
          slides: [
            { id: `ai-${Date.now()}-3`, text: `¡Digno eres Tú, Rey de gloria!\nReinas con poder por la eternidad.` },
            { id: `ai-${Date.now()}-4`, text: `Toda la tierra proclamará:\n¡Sólo Tú eres Santo, Dios!` }
          ]
        },
        {
          name: "Puente",
          badge: "badge-bridge",
          slides: [
            { id: `ai-${Date.now()}-5`, text: `Santo, Santo, Dios Todopoderoso.\nCantan los ángeles, cantamos hoy.` }
          ]
        }
      ]
    };

    store.addDeck(newDeck);
    return {
      type: "deck",
      message: `✨ Canción "${newDeck.title}" generada y agregada a tu biblioteca con Estrofas, Coro y Puente.`
    };
  }

  generateSermonDeck(promptText) {
    const title = promptText.length > 30 ? promptText.substring(0, 30) + "..." : promptText;

    const newDeck = {
      id: "ai-sermon-" + Date.now(),
      title: "Sermón: " + title,
      type: "sermon",
      category: "Generado por IA",
      groups: [
        {
          name: "Título del Sermón",
          badge: "badge-sermon",
          slides: [
            { id: `ai-s1`, text: `${title.toUpperCase()}\nReflexión y Enseñanza en Vivo` }
          ]
        },
        {
          name: "Punto 1",
          badge: "badge-sermon",
          slides: [
            { id: `ai-s2`, text: `1. El Fundamento Firme\n«Edificados sobre el fundamento de la fe»` }
          ]
        },
        {
          name: "Punto 2",
          badge: "badge-sermon",
          slides: [
            { id: `ai-s3`, text: `2. Aplicación Práctica\nTransformando nuestro caminar diario` }
          ]
        }
      ]
    };

    store.addDeck(newDeck);
    return {
      type: "deck",
      message: `✨ Presentación de sermón "${newDeck.title}" creada con puntos clave.`
    };
  }

  generateLowerThird(promptText) {
    const lines = promptText.split("\n").filter(l => l.trim().length > 0);
    const mainTitle = lines[0] || "Invitado Especial";
    const subTitle = lines[1] || "Ministerio de Transmisión";

    const newDeck = {
      id: "ai-lt-" + Date.now(),
      title: "Lower Third: " + mainTitle,
      type: "lowerthird",
      category: "Overlays IA",
      groups: [
        {
          name: "Lower Third IA",
          badge: "badge-lowerthird",
          slides: [
            { id: `ai-lt-${Date.now()}`, text: `${mainTitle}\n${subTitle}`, isLowerThird: true }
          ]
        }
      ]
    };

    store.addDeck(newDeck);
    return {
      type: "lowerthird",
      message: `✨ Lower Third para "${mainTitle}" creado y listo para proyectar en OBS/Audiencia.`
    };
  }

  generateShaderScript(promptText) {
    let customCode = "";
    if (promptText.toLowerCase().includes("fuego") || promptText.toLowerCase().includes("rojo")) {
      customCode = `// AI Generated Fire Glow Shader Script
function renderBackground(ctx, width, height, time) {
  ctx.fillStyle = '#080202';
  ctx.fillRect(0, 0, width, height);

  const numFlames = 50;
  for (let i = 0; i < numFlames; i++) {
    const x = (width * i / numFlames) + Math.sin(time * 0.002 + i) * 20;
    const y = height - (Math.sin(time * 0.003 + i * 0.5) * 150 + (i * 4) % height);
    const size = 10 + Math.sin(time * 0.005 + i) * 12;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';
    ctx.fill();
  }
}`;
    } else {
      customCode = `// AI Generated Cosmic Wave Shader Script
function renderBackground(ctx, width, height, time) {
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, width, height);

  const waves = 4;
  for (let w = 0; w < waves; w++) {
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x <= width; x += 20) {
      const y = height / 2 + Math.sin(x * 0.005 + time * 0.0015 + w) * (60 + w * 20);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.fillStyle = w % 2 === 0 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(6, 182, 212, 0.15)';
    ctx.fill();
  }
}`;
    }

    store.setCustomCode(customCode);
    return {
      type: "code",
      message: `🎨 Script de fondo animado por IA actualizado y aplicado al canvas de Salida.`
    };
  }
}

export const aiCopilot = new AICopilot();
