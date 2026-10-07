# Changelog

All notable changes to **ProPresenter AI Studio** will be documented in this file.

For detailed release notes in Spanish, please see [NOTAS_DE_VERSION.md](./NOTAS_DE_VERSION.md).

---

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
