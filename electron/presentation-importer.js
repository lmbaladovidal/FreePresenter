/**
 * ProPresenter AI Studio - Importador de Presentaciones (Proceso Principal)
 *
 * Convierte presentaciones (PPTX, PPT, PPS, PPSX, PPTM, ODP) en imágenes PNG por diapositiva
 * para poder proyectarlas desde la Salida de Audiencia con transiciones Cut / Fade.
 *
 * Motores de conversión (en orden de prioridad):
 *   1. Microsoft PowerPoint (automatización COM vía PowerShell) -> máxima fidelidad + texto y notas del orador.
 *   2. LibreOffice (headless) -> convierte a PDF; el renderer rasteriza el PDF con pdf.js.
 *   3. Archivos PDF -> se envían directamente al renderer para rasterizarlos con pdf.js.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

const OFFICE_EXTENSIONS = ['pptx', 'ppt', 'pps', 'ppsx', 'pptm', 'potx', 'odp'];
const PDF_EXTENSIONS = ['pdf'];
const SUPPORTED_EXTENSIONS = [...OFFICE_EXTENSIONS, ...PDF_EXTENSIONS];
const ASSET_ID_REGEX = /^pres-[a-z0-9-]{4,64}$/i;
const IMPORT_TIMEOUT_MS = 15 * 60 * 1000;

// Script PowerShell (solo ASCII) que automatiza PowerPoint por COM sin mostrar ventanas.
// Los parámetros llegan por variables de entorno para soportar rutas con acentos/espacios.
const POWERPOINT_EXPORT_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$inputPath = $env:PPAI_INPUT
$outDir = $env:PPAI_OUTDIR
$targetWidth = [int]$env:PPAI_WIDTH
$resultPath = Join-Path $outDir 'manifest.json'
$cancelPath = Join-Path $outDir 'cancel.flag'
$exitCode = 0

function Write-Result($obj) {
  $json = $obj | ConvertTo-Json -Depth 6 -Compress
  [System.IO.File]::WriteAllText($resultPath, $json, (New-Object System.Text.UTF8Encoding($false)))
}

$ppt = $null
$pres = $null
$startedByUs = $true
try {
  $running = Get-Process -Name POWERPNT -ErrorAction SilentlyContinue
  if ($running) { $startedByUs = $false }
  try {
    $ppt = New-Object -ComObject PowerPoint.Application
  } catch {
    Write-Result @{ ok = $false; code = 'NO_POWERPOINT'; error = $_.Exception.Message }
    $exitCode = 3
  }

  if ($ppt) {
    # Open(FileName, ReadOnly=msoTrue, Untitled=msoFalse, WithWindow=msoFalse)
    $pres = $ppt.Presentations.Open($inputPath, -1, 0, 0)
    $sw = [double]$pres.PageSetup.SlideWidth
    $sh = [double]$pres.PageSetup.SlideHeight
    $w = $targetWidth
    $h = [int][Math]::Round($w * $sh / $sw)
    $count = $pres.Slides.Count
    $slides = New-Object System.Collections.ArrayList
    $cancelled = $false

    for ($i = 1; $i -le $count; $i++) {
      if (Test-Path $cancelPath) { $cancelled = $true; break }
      $slide = $pres.Slides.Item($i)
      $fileName = 'slide-{0:D3}.png' -f $i
      $slide.Export((Join-Path $outDir $fileName), 'PNG', $w, $h)

      $texts = New-Object System.Collections.ArrayList
      foreach ($shape in $slide.Shapes) {
        try {
          if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
            [void]$texts.Add([string]$shape.TextFrame.TextRange.Text)
          }
        } catch {}
      }

      $notes = ''
      try {
        if ($slide.HasNotesPage) {
          foreach ($ns in $slide.NotesPage.Shapes) {
            try {
              if ($ns.PlaceholderFormat.Type -eq 2 -and $ns.HasTextFrame) {
                $notes = [string]$ns.TextFrame.TextRange.Text
              }
            } catch {}
          }
        }
      } catch {}

      $hidden = $false
      try { $hidden = ($slide.SlideShowTransition.Hidden -ne 0) } catch {}

      [void]$slides.Add(@{ index = $i; file = $fileName; text = ($texts -join [string][char]10); notes = $notes; hidden = $hidden })
      [Console]::Out.WriteLine("PROGRESS $i $count")
      [Console]::Out.Flush()
    }

    if ($cancelled) {
      Write-Result @{ ok = $false; code = 'CANCELLED'; error = 'Importacion cancelada por el usuario.' }
      $exitCode = 4
    } else {
      Write-Result @{ ok = $true; engine = 'powerpoint'; width = $w; height = $h; slides = $slides.ToArray() }
    }
  }
} catch {
  Write-Result @{ ok = $false; code = 'EXPORT_FAILED'; error = $_.Exception.Message }
  $exitCode = 2
} finally {
  if ($pres) {
    try { $pres.Close() } catch {}
    try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) } catch {}
  }
  if ($ppt) {
    try { if ($startedByUs -and $ppt.Presentations.Count -eq 0) { $ppt.Quit() } } catch {}
    try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) } catch {}
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
exit $exitCode
`;

class PresentationImportError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function getExtension(filePath) {
  return path.extname(filePath || '').replace('.', '').toLowerCase();
}

function isSupportedPresentation(filePath) {
  return SUPPORTED_EXTENSIONS.includes(getExtension(filePath));
}

function isValidAssetId(assetId) {
  return typeof assetId === 'string' && ASSET_ID_REGEX.test(assetId);
}

function createAssetId() {
  return `pres-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toFileUrl(filePath) {
  return pathToFileURL(filePath).href;
}

/** Normaliza los saltos de línea de PowerPoint (\r = párrafo, \v = salto manual). */
function normalizeOfficeText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u000b/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findLibreOffice() {
  const candidates = [];
  if (process.platform === 'win32') {
    const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
    roots.forEach(root => candidates.push(path.join(root, 'LibreOffice', 'program', 'soffice.exe')));
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/LibreOffice.app/Contents/MacOS/soffice');
  } else {
    candidates.push('/usr/bin/soffice', '/usr/local/bin/soffice', '/usr/bin/libreoffice', '/snap/bin/libreoffice');
  }
  return candidates.find(p => {
    try { return fs.existsSync(p); } catch { return false; }
  }) || null;
}

function isPowerPointRegistered() {
  if (process.platform !== 'win32') return Promise.resolve(false);
  return new Promise(resolve => {
    const child = spawn('reg', ['query', 'HKCR\\PowerPoint.Application\\CLSID'], { windowsHide: true });
    child.on('error', () => resolve(false));
    child.on('close', code => resolve(code === 0));
  });
}

class PresentationImporter {
  /**
   * @param {object} options
   * @param {string} options.assetsRoot Carpeta raíz donde se guardan las diapositivas exportadas.
   * @param {(src: string, dest: string) => Promise<boolean>|boolean} [options.makeThumbnail] Generador opcional de miniaturas.
   * @param {number} [options.width] Ancho de exportación en píxeles (por defecto 1920).
   */
  constructor({ assetsRoot, makeThumbnail = null, width = 1920 } = {}) {
    if (!assetsRoot) throw new Error('assetsRoot es obligatorio');
    this.assetsRoot = assetsRoot;
    this.makeThumbnail = makeThumbnail;
    this.width = width;
    this.activeJob = null;
  }

  getAssetDir(assetId) {
    if (!isValidAssetId(assetId)) throw new PresentationImportError('INVALID_ASSET', 'Identificador de presentación inválido.');
    return path.join(this.assetsRoot, assetId);
  }

  async getEngines() {
    return {
      powerpoint: await isPowerPointRegistered(),
      libreoffice: !!findLibreOffice(),
      pdf: true
    };
  }

  isBusy() {
    return !!this.activeJob;
  }

  /**
   * Importa una presentación. Devuelve:
   *  - { kind: 'images', ... slides[] } cuando la conversión a imágenes se completó en el proceso principal.
   *  - { kind: 'pdf', pdfData } cuando el renderer debe rasterizar un PDF con pdf.js.
   */
  async importFile(filePath, { onProgress = () => {} } = {}) {
    if (this.activeJob) {
      throw new PresentationImportError('BUSY', 'Ya hay una importación en curso. Espera a que termine o cancélala.');
    }
    if (!filePath || !fs.existsSync(filePath)) {
      throw new PresentationImportError('NOT_FOUND', 'No se encontró el archivo seleccionado.');
    }
    const ext = getExtension(filePath);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new PresentationImportError('UNSUPPORTED', `Formato .${ext} no soportado. Usa PPTX, PPT, PPSX, ODP o PDF.`);
    }

    const assetId = createAssetId();
    const outDir = this.getAssetDir(assetId);
    await fs.promises.mkdir(outDir, { recursive: true });

    const job = { assetId, outDir, child: null, cancelled: false };
    this.activeJob = job;
    const title = path.basename(filePath, path.extname(filePath));
    const base = { assetId, title, sourcePath: filePath, sourceName: path.basename(filePath) };

    try {
      if (PDF_EXTENSIONS.includes(ext)) {
        onProgress({ stage: 'reading', message: 'Leyendo PDF...' });
        const pdfData = await fs.promises.readFile(filePath);
        return { ...base, kind: 'pdf', engine: 'pdf', pdfData };
      }

      let powerPointError = null;
      if (process.platform === 'win32') {
        try {
          onProgress({ stage: 'converting', message: 'Abriendo presentación con PowerPoint...', current: 0, total: 0 });
          const result = await this.exportWithPowerPoint(job, filePath, onProgress);
          return { ...base, kind: 'images', ...result };
        } catch (err) {
          if (job.cancelled || err.code === 'CANCELLED') throw err;
          powerPointError = err;
          console.warn('[PresentationImporter] PowerPoint no disponible o falló:', err.message);
        }
      }

      const soffice = findLibreOffice();
      if (soffice) {
        onProgress({ stage: 'converting', message: 'Convirtiendo con LibreOffice...' });
        const pdfPath = await this.convertWithLibreOffice(job, soffice, filePath);
        const pdfData = await fs.promises.readFile(pdfPath);
        fs.promises.unlink(pdfPath).catch(() => {});
        return { ...base, kind: 'pdf', engine: 'libreoffice', pdfData };
      }

      const detail = powerPointError && powerPointError.code !== 'NO_POWERPOINT'
        ? ` Detalle de PowerPoint: ${powerPointError.message}`
        : '';
      throw new PresentationImportError(
        'NO_ENGINE',
        `No se pudo convertir la presentación. Instala Microsoft PowerPoint o LibreOffice, o exporta el archivo como PDF e impórtalo.${detail}`
      );
    } catch (err) {
      await this.deleteAssets(assetId).catch(() => {});
      throw err;
    } finally {
      this.activeJob = null;
    }
  }

  exportWithPowerPoint(job, filePath, onProgress) {
    return new Promise((resolve, reject) => {
      const encoded = Buffer.from(POWERPOINT_EXPORT_SCRIPT, 'utf16le').toString('base64');
      const child = spawn('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded
      ], {
        windowsHide: true,
        env: {
          ...process.env,
          PPAI_INPUT: path.resolve(filePath),
          PPAI_OUTDIR: job.outDir,
          PPAI_WIDTH: String(this.width)
        }
      });
      job.child = child;

      let stderr = '';
      let stdoutBuffer = '';
      const timeout = setTimeout(() => {
        try { child.kill(); } catch (e) { }
        reject(new PresentationImportError('TIMEOUT', 'La conversión con PowerPoint tardó demasiado y fue cancelada.'));
      }, IMPORT_TIMEOUT_MS);

      child.stdout.on('data', chunk => {
        stdoutBuffer += chunk.toString();
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop();
        lines.forEach(line => {
          const match = line.match(/^PROGRESS (\d+) (\d+)/);
          if (match) {
            const current = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            onProgress({ stage: 'converting', message: `Exportando diapositiva ${current} de ${total}...`, current, total });
          }
        });
      });
      child.stderr.on('data', chunk => { stderr += chunk.toString(); });

      child.on('error', err => {
        clearTimeout(timeout);
        reject(new PresentationImportError('NO_POWERPOINT', `No se pudo iniciar PowerShell: ${err.message}`));
      });

      child.on('close', async () => {
        clearTimeout(timeout);
        job.child = null;
        if (job.cancelled) {
          reject(new PresentationImportError('CANCELLED', 'Importación cancelada.'));
          return;
        }
        try {
          const manifestRaw = await fs.promises.readFile(path.join(job.outDir, 'manifest.json'), 'utf8');
          const manifest = JSON.parse(manifestRaw.replace(/^\uFEFF/, ''));
          if (!manifest.ok) {
            reject(new PresentationImportError(manifest.code || 'EXPORT_FAILED', manifest.error || 'PowerPoint no pudo exportar la presentación.'));
            return;
          }
          const rawSlides = Array.isArray(manifest.slides) ? manifest.slides : (manifest.slides ? [manifest.slides] : []);
          if (rawSlides.length === 0) {
            reject(new PresentationImportError('EMPTY', 'La presentación no contiene diapositivas.'));
            return;
          }
          onProgress({ stage: 'thumbnails', message: 'Generando miniaturas...' });
          const slides = [];
          for (const s of rawSlides) {
            const imagePath = path.join(job.outDir, s.file);
            const thumbUrl = await this.createThumbnail(imagePath);
            slides.push({
              index: s.index,
              image: toFileUrl(imagePath),
              thumb: thumbUrl,
              text: normalizeOfficeText(s.text),
              notes: normalizeOfficeText(s.notes),
              hidden: !!s.hidden
            });
          }
          resolve({ engine: 'powerpoint', width: manifest.width, height: manifest.height, slides });
        } catch (err) {
          const detail = stderr.trim().split(/\r?\n/).slice(-3).join(' ');
          reject(new PresentationImportError('EXPORT_FAILED', `PowerPoint no generó resultados. ${detail || err.message}`));
        }
      });
    });
  }

  convertWithLibreOffice(job, sofficePath, filePath) {
    return new Promise((resolve, reject) => {
      const profileDir = path.join(os.tmpdir(), 'ppai-lo-profile');
      const child = spawn(sofficePath, [
        `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
        '--headless', '--norestore', '--convert-to', 'pdf', '--outdir', job.outDir, path.resolve(filePath)
      ], { windowsHide: true });
      job.child = child;

      let stderr = '';
      child.stderr.on('data', chunk => { stderr += chunk.toString(); });
      const timeout = setTimeout(() => {
        try { child.kill(); } catch (e) { }
        reject(new PresentationImportError('TIMEOUT', 'La conversión con LibreOffice tardó demasiado.'));
      }, IMPORT_TIMEOUT_MS);

      child.on('error', err => {
        clearTimeout(timeout);
        reject(new PresentationImportError('NO_ENGINE', `No se pudo iniciar LibreOffice: ${err.message}`));
      });
      child.on('close', () => {
        clearTimeout(timeout);
        job.child = null;
        if (job.cancelled) {
          reject(new PresentationImportError('CANCELLED', 'Importación cancelada.'));
          return;
        }
        const pdfPath = path.join(job.outDir, `${path.basename(filePath, path.extname(filePath))}.pdf`);
        if (fs.existsSync(pdfPath)) {
          resolve(pdfPath);
        } else {
          reject(new PresentationImportError('EXPORT_FAILED', `LibreOffice no pudo convertir el archivo. ${stderr.trim()}`));
        }
      });
    });
  }

  async createThumbnail(imagePath) {
    if (typeof this.makeThumbnail !== 'function') return '';
    const thumbPath = imagePath.replace(/\.png$/i, '-thumb.jpg');
    try {
      const ok = await this.makeThumbnail(imagePath, thumbPath);
      return ok ? toFileUrl(thumbPath) : '';
    } catch (e) {
      return '';
    }
  }

  /** Guarda una diapositiva rasterizada en el renderer (flujo PDF) y devuelve sus URLs. */
  async saveSlideImage(assetId, index, data) {
    const outDir = this.getAssetDir(assetId);
    const slideIndex = parseInt(index, 10);
    if (!Number.isInteger(slideIndex) || slideIndex < 1 || slideIndex > 5000) {
      throw new PresentationImportError('INVALID_INDEX', 'Índice de diapositiva inválido.');
    }
    await fs.promises.mkdir(outDir, { recursive: true });
    const imagePath = path.join(outDir, `slide-${String(slideIndex).padStart(3, '0')}.png`);
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
    await fs.promises.writeFile(imagePath, buffer);
    const thumb = await this.createThumbnail(imagePath);
    return { image: toFileUrl(imagePath), thumb };
  }

  cancel() {
    const job = this.activeJob;
    if (!job) return false;
    job.cancelled = true;
    try { fs.writeFileSync(path.join(job.outDir, 'cancel.flag'), '1'); } catch (e) { }
    // PowerPoint se cierra limpiamente al detectar cancel.flag; LibreOffice se detiene directamente.
    if (job.child && !String(job.child.spawnfile || '').toLowerCase().includes('powershell')) {
      try { job.child.kill(); } catch (e) { }
    }
    return true;
  }

  async deleteAssets(assetId) {
    if (!isValidAssetId(assetId)) return false;
    const dir = this.getAssetDir(assetId);
    await fs.promises.rm(dir, { recursive: true, force: true });
    return true;
  }
}

module.exports = {
  PresentationImporter,
  PresentationImportError,
  SUPPORTED_EXTENSIONS,
  OFFICE_EXTENSIONS,
  isSupportedPresentation,
  isValidAssetId,
  normalizeOfficeText
};
