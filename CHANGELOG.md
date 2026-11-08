# Changelog

All notable changes to **ProPresenter AI Studio** will be documented in this file.

For detailed release notes in Spanish, please see [NOTAS_DE_VERSION.md](./NOTAS_DE_VERSION.md).

---

## [1.6.0] - 2026-11-08

### Added
- **Full-Screen 3-Column Song & Slide Editor (FreeShow style):**
  - Replaced floating modal dialogs on song edit (`✏️ Editar Canción`, top mode tab `[Edit]`, or context menu) with an immersive full-screen workspace layout:
    - **Left Column:** Vertical thumbnail list of all slides in 16:9 preview cards with numbers, section badges, and quick reorder (`↑`/`↓`), duplicate, delete, and `+ Nueva Filmina` actions.
    - **Center Column:** Interactive 16:9 presentation canvas with FreeShow-style Bounding Box (pink border and 8 resize/drag handles) for direct real-time in-canvas typing (WYSIWYG), section selector, slide navigation, and split-at-cursor tools.
    - **Right Column:** Comprehensive style inspector featuring font family selection (`CMGSans`, `Inter`, `Montserrat`, `Roboto`, `Oswald`, etc.), font size, color swatch & hex picker, formatting toolbar (**B**, *I*, <u>U</u>, <s>S</s>, TT), collapsible accordions for horizontal & vertical alignment, line height, letter spacing, max lines per slide, text outline stroke, drop shadow, and background box styling.
  - Dedicated `Texto Completo` tab with full lyrics editor and live visual diff panel.
  - Keyboard shortcuts: `Escape` to return to Show mode, `Ctrl+S` / `Cmd+S` to save.
- **Custom Overlays / Lower Thirds Shows & Banner Projection:**
  - Full support for creating dedicated Lower Third shows using category `Overlays Stream / Lower Thirds` or section tags `[Overlay]`, projecting banners to Audience and Operator preview monitors simultaneously without replacing the primary text layer.

## [1.5.0] - 2026-11-05

### Added
- **Global Search for Downloaded Songs:** Accent-insensitive, multi-field search (title, category, section tags, lyrics) across shows dock, projects sidebar, and in-modal web search tab featuring a prioritized "📚 Local Library Matches" list.
- **Visual Difference & Editing Control Panel:** Live diff preview panel for song editing (`#song-edit-diff-panel`) and slide card editing (`#slide-edit-diff-preview`) visually identifying kept lines (green) vs. deleted lines (red strikethrough with a 1-click `↩ Restaurar` button).
- **In-Place Song Content Updates:** Direct update of existing decks (`store.updateDeckContent`) without generating duplicate entries.
- **Real-Time Physical Disk Media Folders:** Ability to link and auto-sync physical folders from local disk (`fs.watch` + polling fallback) seamlessly in `#media-folders-list` with real-time file addition and removal.
- **Interactive Media Playback Timeline & Expanded Audience Dock:** Doubled width for audience screen controls dock and manageable media timeline with seek slider, play/pause toggle, restart button, and time formatting.

### Fixed
- **Electron Modal Input & Button Freeze / Unresponsive Modales:** Fixed recurring bug where modal textboxes and buttons stopped responding to mouse clicks by hoisting modal overlays out of the `#app` CSS grid, removing `backdrop-filter: blur` & GPU `enable-zero-copy` compositor conflicts, replacing focus-locking `window.alert()` calls with toast notifications, and ensuring active pointer-events and focus restoration via `ensureModalInteractive`.

## [1.3.4] - 2026-11-04

### Added
- **Media Playback Queue & Auto-Advance on Video End (`enqueueMedia` & `advanceMediaQueue`):** Queue one or multiple media items via `Alt + Click` (or `+Cola` button / right-click context menu). When the queue has items, the currently playing video disables looping (`loop = false`) and automatically transitions to the next queued item upon completion (`ended` event), returning to normal loop mode once the queue is empty.
- **Right-Side Live Queue List Panels (`#media-dock-queue-panel` & `#right-sidebar-queue-box`):** Automatic right-hand queue panel in the Media tab and under the Live Program monitor showing the active media item and upcoming queued items (`#1`, `#2`, ...) with controls to play now (`▶`), skip to next (`⏭️ Pasar`), reorder (`↑`/`↓`), remove individual items (`×`), or clear the queue (`🗑️ Vaciar`).

## [1.3.3] - 2026-10-15

### Added
- **Song & Show Sections Engine (`SECTION_DEFINITIONS` & `parseAndSplitText`):** Automatic recognition of standard section tags (`[Intro]`, `[Verso 1]`, `[Pre-Coro]`, `[Coro]`, `[Puente]`, `[Instrumental]`, `[Final]`, `[Sermón]`) and automatic strip of section headers from displayed lyrics.
- **Top Quick Jump Sections Navigation Bar (`#deck-sections-nav`):** Color-coded and icon-adorned horizontal section buttons dock above the slide grid, allowing instant jump, smooth scroll, pulse focus, and immediate live projection of any song section.
- **Interactive Section Badges & Picker Modal (`#modal-section-picker`):** Interactive pills in slide cards, right-click context menu "🏷️ Asignar Sección", custom renaming, section splitting (`splitGroupAtSlide`), and quick insertion chips in the show creation modal.

## [1.3.2] - 2026-10-12

### Added
- **Full Video Audio Playback & Output Routing:** Removed hardcoded muted attribute from audience and operator preview video layers; enabled Chromium `autoplay-policy: no-user-gesture-required` in Electron for unrestricted audio output.
- **Master Audio Toggle & Volume Controls:** Direct audio toggle buttons (`🔊 Sonido ON` / `🔇 Silenciado`) in Live Program header, media dock header, and transitions panel, plus 0% - 100% volume slider and keyboard shortcut (`M`).
- **Smart Dual-Screen Acoustic Echo Prevention:** Automatic detection of Audience display presence; mutes operator preview monitor when Audience display is active to prevent comb-filter echoes through computer sound devices while playing faithfully when rehearsing solo.

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
