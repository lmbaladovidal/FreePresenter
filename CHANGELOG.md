# Changelog

All notable changes to **ProPresenter AI Studio** will be documented in this file.

For detailed release notes in Spanish, please see [NOTAS_DE_VERSION.md](./NOTAS_DE_VERSION.md).

---

## [1.3.1] - 2026-10-11

### Added
- **IndexedDB Persistent Media Cache Engine (`media-cache.js`):** Unlimited and unthrottled storage for media thumbnails and blobs in IndexedDB (`FreePresenterMediaDB`), preventing `localStorage` 5MB quota overflow.
- **Automated Video & Image Snapshot Extraction:** Real-time generation of lightweight 320x180 JPEG thumbnails (~10-15KB) via Canvas for instant (< 1ms) rendering in the media dock.
- **Electron Permanent Media Paths:** Integrated `webUtils.getPathForFile` in `preload.js` to capture permanent `file:///` URLs on dragged/loaded local files.
- **Media Type Badges on Dock Cards:** Visual tags (`🎬 VIDEO` / `🖼️ IMG`) and folder indicators on cards in the media library.

### Fixed
- **Broken Image Error on Projected Video Blobs:** Resolved issue where `url.startsWith('blob:')` incorrectly caused video blobs to be handled as images in `app.js` and `audience.html`.
- **Vanishing Media & Thumbnails on Restart:** Fixed missing media and broken links after closing/reopening the app by hydrating permanent file paths and IndexedDB blobs and thumbnails on startup.

## [1.3.0] - 2026-10-10

### Added
- **Song Slide Splitting & Reflow Engine:** Support for splitting presentations by line count, line breaks, and paragraph rules. Built-in slide reflow modal (`btn-reflow-deck`) with line count selector.
- **Automatic Overflow Splitting on Template Assignment:** Dynamically splits slides into multiple new slide cards when assigning/editing templates with `maxLines > 0`.
- **Clipboard Import & Template Selection on Presentation Creation:** Option to choose active template and paste content directly from system clipboard when creating new shows.
- **Virtual Folder Media Rendering:** Real-time thumbnail preview and audience screen output projection for video and image files dropped/uploaded to virtual folders.
- **Dynamic Slide Cards Zoom Control:** Range slider in slide grid dock (`input-slide-card-size`) for dynamic sizing from 140px to 380px.
- **100% Faithful 1:1 Operator Preview Monitor (`.monitor-screen`):** CSS Container Queries (`container-type: inline-size; container-name: monitorscreen; padding: 0;`) and responsive `cqw` scaling for font size, letter-spacing, padding, line wrapping, and Y position to match `audience.html` identically.

## [1.2.0] - 2026-10-07

### Added
- **Dynamic Component Context Menu:** Contextual right-click menu with Project, Edit, Duplicate, Copy Text, and Delete actions for Shows, Media, Bibles, Slides, and Events.
- **Modal Overlay System Fixes:** `closeAllModals()` mutual exclusion, backdrop click dismissal, `Escape` key integration, and `z-index: 10000` pointer-events safety.
- **System Functional Requirements Spec:** Complete specification of 37 functional requirements in `REQUERIMIENTOS_FUNCIONALES.md`.
- **Automated Smoke Test Suite:** Automated Node CLI runner (`npm test`) with 10/10 test coverage and QA protocol in `SMOKE_TEST.md`.

### Fixed
- **Electron Executable Build Fix:** Resolved `ReferenceError: require is not defined in ES module scope` in Windows `.exe` installer builds by removing `"type": "module"` from `package.json` while maintaining ESM for Vite and `.mjs` CLI tests.

---

## [1.0.0] - 2026-08-24

### Added
- **Multi-Monitor Display Outputs:** Dedicated Audience Screen (`audience.html`) and Stage Display Monitor (`stage.html`) for preachers and musicians with live clock, countdown timers, current slide, and next slide preview.
- **Live Transition Engine:** Independent Cut & Smooth Fade (100ms - 1000ms duration slider) for text and media.
- **Dynamic Scripture Navigator & JSON Importer:** 3-column view, real-time tree search with instant `Tab ↹` completion, long verse auto-splitting, customizable fonts, and subscript biblical citation.
- **Custom Bible Loading:** Load any Bible from a URL or local `.json` file with full local persistence.
- **Custom Bible Deletion:** Right-click context menu, trash button, and `Delete`/`Supr` key shortcut for custom Bibles, songs, and media.
- **Pro Dark Theme Interface:** Vertical draggable bottom dock resizer, horizontal fluid slide card grids with footer section badges, and virtual media folders.
- **Native Windows Build Script:** Single-command packaging for `.exe` application via `npm run package:exe`.
