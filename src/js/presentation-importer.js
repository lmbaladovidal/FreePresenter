/**
 * ProPresenter AI Studio - Cliente de Importación de Presentaciones (Renderer)
 *
 * Coordina la importación de archivos PowerPoint (.pptx, .ppt, .ppsx, .pps, .pptm, .odp)
 * y documentos PDF (.pdf), rasterizando páginas PDF con pdfjs-dist cuando corresponde
 * (PDF directo o conversión vía LibreOffice).
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export const PRESENTATION_EXTENSIONS = ['pptx', 'ppt', 'pps', 'ppsx', 'pptm', 'potx', 'odp', 'pdf'];

export function isPresentationFileName(name = '') {
  const ext = String(name).split('.').pop().toLowerCase();
  return PRESENTATION_EXTENSIONS.includes(ext);
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function canvasToDataUrl(canvas, type = 'image/jpeg', quality = 0.82) {
  try {
    return canvas.toDataURL(type, quality);
  } catch {
    return '';
  }
}

async function extractPdfPageText(page) {
  try {
    const content = await page.getTextContent();
    const lines = [];
    let currentLine = '';
    let lastY = null;
    for (const item of content.items || []) {
      const str = item.str || '';
      if (!str.trim() && !item.hasEOL) continue;
      const y = Array.isArray(item.transform) ? Math.round(item.transform[5]) : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 6) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = str;
      } else {
        currentLine += (currentLine && !currentLine.endsWith(' ') && !str.startsWith(' ') ? ' ' : '') + str;
      }
      if (item.hasEOL) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = '';
        lastY = null;
      } else {
        lastY = y;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines.join('\n').trim();
  } catch {
    return '';
  }
}

/**
 * Rasteriza un PDF (ArrayBuffer / Uint8Array) en diapositivas PNG de 1920px de ancho.
 * Si `assetId` y `electronAPI.savePresentationSlideImage` están disponibles, guarda cada PNG en disco.
 */
export async function renderPdfSlides(pdfBytes, {
  assetId = null,
  targetWidth = 1920,
  onProgress = () => {},
  shouldCancel = () => false
} = {}) {
  const data = pdfBytes instanceof Uint8Array
    ? pdfBytes
    : new Uint8Array(pdfBytes.buffer ? pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) : pdfBytes);

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  if (!total) {
    throw new Error('El documento PDF no contiene páginas.');
  }

  const slides = [];
  let width = targetWidth;
  let height = Math.round(targetWidth * 9 / 16);

  try {
    for (let i = 1; i <= total; i++) {
      if (shouldCancel()) {
        throw new Error('Importación cancelada por el usuario.');
      }
      onProgress({ stage: 'rendering', message: `Renderizando página ${i} de ${total}...`, current: i, total });

      const page = await pdf.getPage(i);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = targetWidth / Math.max(1, baseViewport.width);
      const viewport = page.getViewport({ scale });

      width = Math.round(viewport.width);
      height = Math.round(viewport.height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      const text = await extractPdfPageText(page);

      let imageUrl = '';
      let thumbUrl = '';

      if (assetId && window.electronAPI?.savePresentationSlideImage) {
        const blob = await canvasToBlob(canvas, 'image/png');
        const arrayBuf = await blob.arrayBuffer();
        const saved = await window.electronAPI.savePresentationSlideImage(assetId, i, arrayBuf);
        if (!saved?.ok) {
          throw new Error(saved?.error || `Error al guardar diapositiva ${i}.`);
        }
        imageUrl = saved.image;
        thumbUrl = saved.thumb || imageUrl;
      } else {
        // Fallback para navegador web sin Electron
        imageUrl = canvasToDataUrl(canvas, 'image/webp', 0.9) || canvasToDataUrl(canvas, 'image/jpeg', 0.9);
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 420;
        thumbCanvas.height = Math.max(1, Math.round(420 * height / width));
        thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        thumbUrl = canvasToDataUrl(thumbCanvas, 'image/jpeg', 0.8);
      }

      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      slides.push({
        index: i,
        image: imageUrl,
        thumb: thumbUrl,
        text,
        notes: '',
        hidden: false
      });
    }
  } finally {
    try { await pdf.destroy(); } catch {}
  }

  return { width, height, slides };
}

/**
 * Importa una presentación desde ruta nativa (Electron) o un objeto File (navegador / drag & drop).
 */
export async function importPresentationSource(source, { onProgress = () => {}, isCancelled = () => false } = {}) {
  const isElectron = Boolean(window.electronAPI?.importPresentationFile);

  // Obtener ruta física si se pasó un File dentro de Electron
  let filePath = typeof source === 'string' ? source : '';
  if (!filePath && source && isElectron && window.electronAPI?.getPathForFile) {
    filePath = window.electronAPI.getPathForFile(source) || '';
  }

  if (isElectron && filePath) {
    const offProgress = window.electronAPI.onPresentationImportProgress
      ? window.electronAPI.onPresentationImportProgress(onProgress)
      : () => {};
    try {
      const res = await window.electronAPI.importPresentationFile(filePath);
      if (!res?.ok) {
        const err = new Error(res?.error || 'No se pudo importar la presentación.');
        err.code = res?.code || 'IMPORT_ERROR';
        throw err;
      }
      if (res.kind === 'pdf') {
        try {
          const rendered = await renderPdfSlides(res.pdfData, {
            assetId: res.assetId,
            onProgress,
            shouldCancel: isCancelled
          });
          return {
            assetId: res.assetId,
            title: res.title,
            sourcePath: res.sourcePath,
            sourceName: res.sourceName,
            engine: res.engine,
            width: rendered.width,
            height: rendered.height,
            slides: rendered.slides
          };
        } catch (err) {
          await window.electronAPI.deletePresentationAssets?.(res.assetId);
          throw err;
        }
      }
      return res;
    } finally {
      offProgress();
    }
  }

  // Modo navegador (sin Electron): soporta archivos PDF directamente
  if (source instanceof File || (source && typeof source.arrayBuffer === 'function')) {
    const name = source.name || 'Presentación.pdf';
    const ext = name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') {
      throw new Error('En modo navegador web solo se pueden importar presentaciones en formato PDF. Usa la aplicación de escritorio para archivos PowerPoint (.pptx / .ppt).');
    }
    onProgress({ stage: 'reading', message: 'Leyendo archivo PDF...' });
    const buf = await source.arrayBuffer();
    const rendered = await renderPdfSlides(new Uint8Array(buf), { onProgress, shouldCancel: isCancelled });
    return {
      assetId: `pres-web-${Date.now().toString(36)}`,
      title: name.replace(/\.[^.]+$/, ''),
      sourcePath: '',
      sourceName: name,
      engine: 'pdf',
      width: rendered.width,
      height: rendered.height,
      slides: rendered.slides
    };
  }

  throw new Error('Selecciona un archivo de presentación válido (.pptx, .ppt, .ppsx, .odp o .pdf).');
}

