/**
 * ProPresenter AI Studio - Media Cache & Thumbnail Engine
 * Maneja el almacenamiento persistente de miniaturas y blobs multimedia mediante IndexedDB.
 */

const DB_NAME = 'FreePresenterMediaDB';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return resolve(null);
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('thumbnails')) {
          db.createObjectStore('thumbnails', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (err) => {
        console.warn('Error abriendo IndexedDB para MediaCache:', err);
        resolve(null);
      };
    });
  }
  return dbPromise;
}

export class MediaCache {
  /**
   * Guarda una miniatura en IndexedDB
   */
  static async saveThumbnail(id, dataUrl) {
    if (!id || !dataUrl) return;
    try {
      const db = await getDB();
      if (!db) return;
      const tx = db.transaction('thumbnails', 'readwrite');
      tx.objectStore('thumbnails').put({ id, dataUrl, updatedAt: Date.now() });
    } catch (e) {
      console.warn('Error guardando miniatura en IndexedDB:', e);
    }
  }

  /**
   * Obtiene una miniatura desde IndexedDB
   */
  static async getThumbnail(id) {
    if (!id) return null;
    try {
      const db = await getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction('thumbnails', 'readonly');
        const req = tx.objectStore('thumbnails').get(id);
        req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Guarda un archivo Blob completo en IndexedDB (para persistencia en modo web sin file:///)
   */
  static async saveBlob(id, fileOrBlob, name = '', type = '') {
    if (!id || !fileOrBlob) return;
    try {
      const db = await getDB();
      if (!db) return;
      const tx = db.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').put({
        id,
        blob: fileOrBlob,
        name: name || fileOrBlob.name || '',
        type: type || fileOrBlob.type || '',
        updatedAt: Date.now()
      });
    } catch (e) {
      console.warn('Error guardando blob en IndexedDB:', e);
    }
  }

  /**
   * Obtiene un archivo Blob desde IndexedDB
   */
  static async getBlob(id) {
    if (!id) return null;
    try {
      const db = await getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction('blobs', 'readonly');
        const req = tx.objectStore('blobs').get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Elimina miniatura y blob de IndexedDB
   */
  static async deleteMedia(id) {
    if (!id) return;
    try {
      const db = await getDB();
      if (!db) return;
      const tx1 = db.transaction('thumbnails', 'readwrite');
      tx1.objectStore('thumbnails').delete(id);
      const tx2 = db.transaction('blobs', 'readwrite');
      tx2.objectStore('blobs').delete(id);
    } catch (e) {}
  }

  /**
   * Genera una miniatura ligera JPEG (320x180) a partir de una imagen o video
   */
  static generateThumbnail(fileOrUrl, type = '') {
    return new Promise((resolve) => {
      let url = '';
      let isTemporaryUrl = false;

      if (typeof fileOrUrl === 'string') {
        url = fileOrUrl;
      } else if (fileOrUrl instanceof Blob || fileOrUrl instanceof File) {
        url = URL.createObjectURL(fileOrUrl);
        isTemporaryUrl = true;
      } else {
        return resolve(null);
      }

      const isImg = (type && type.startsWith('image/')) || (url && url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i));

      if (isImg) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let finished = false;

        const cleanup = () => {
          if (!finished) {
            finished = true;
            if (isTemporaryUrl) URL.revokeObjectURL(url);
          }
        };

        const timer = setTimeout(() => {
          cleanup();
          resolve(null);
        }, 4000);

        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 320, 180);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            cleanup();
            resolve(dataUrl);
          } catch (err) {
            cleanup();
            resolve(null);
          }
        };

        img.onerror = () => {
          clearTimeout(timer);
          cleanup();
          resolve(null);
        };

        img.src = url;
      } else {
        // Video Thumbnail Generation
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';

        let finished = false;
        const cleanup = () => {
          if (!finished) {
            finished = true;
            video.pause();
            video.removeAttribute('src');
            video.load();
            if (isTemporaryUrl) URL.revokeObjectURL(url);
          }
        };

        const timer = setTimeout(() => {
          cleanup();
          resolve(null);
        }, 6000);

        const captureFrame = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 320, 180);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            clearTimeout(timer);
            cleanup();
            resolve(dataUrl);
          } catch (e) {
            clearTimeout(timer);
            cleanup();
            resolve(null);
          }
        };

        video.onloadeddata = () => {
          try {
            // Seek a 0.5s o al 10% del video para evitar capturar un cuadro negro inicial
            const seekTime = video.duration && video.duration > 1.5 ? Math.min(1.0, video.duration * 0.1) : 0.2;
            video.currentTime = seekTime;
          } catch (e) {
            captureFrame();
          }
        };

        video.onseeked = () => {
          captureFrame();
        };

        video.onerror = () => {
          clearTimeout(timer);
          cleanup();
          resolve(null);
        };

        video.src = url;
      }
    });
  }
}
