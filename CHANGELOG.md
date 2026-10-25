# Changelog

## 1.4.0 — 2026-10-25

### Added
- **Simple mode UI by Designer** (`simple-mode.js`, `simple-mode.css`, `affordance.css`): a
  streamlined default interface with one Download CGM button, a status dot, and settings in a
  menu. The full workbench is still available under **Advanced** (`?ui=advanced`, remembered
  per browser). Designer's files ship unmodified. Thanks to Designer for the UI work.

### Fixed
- **Hybrid geometry mode now differs from Vector.** Embedded raster images, image masks, and
  smooth shadings (`sh`) were silently dropped. In Hybrid mode each such region now becomes a
  CELLARRAY at its own position and in paint order, sampled from a ~150 dpi PDF.js render of the
  page (clipped to the active clip rectangle, at most 512 cells per side, even column count).
  Vectors and text are unchanged.
- **Clear-text output now includes CELLARRAY.** Raster and Hybrid cell arrays used to be missing
  from ISO 8632-4 output, so clear-text raster files had no picture content.
- **CGM preview:** cell arrays are drawn at their own rectangle, and black cells (value 0) no
  longer render as white.
- **Primary download label matches the encoding.** With the *ISO 8632-4 Clear Text* profile the
  button now reads "Download Clear-Text .CGM" instead of "Download Binary .CGM". File contents
  are unchanged.
- **Status badge:** before any conversion it shows a neutral "○ NO OUTPUT YET" instead of a
  green "VALIDATED". "▲ CHECK ENCODING" is now amber (`pill-warn`) instead of green.
- **CAD Import Compatibility Notes** referred to a non-existent "Text-to-Path" option. They now
  name the real Text Handling options and include a Hybrid tip.
- **Target Width** typing is debounced (350 ms). Committing a value converts at once, and the
  same value never converts twice, so one edit triggers one conversion.

### Changed
- Cache-bust `app.js`, `simple-mode.js`, `simple-mode.css`, and `affordance.css` with `?v=1.4.0`.
- For unchanged settings, output is byte-identical to 1.3.0, with two exceptions: clear-text
  output in Full Page Raster mode, and Hybrid output for PDFs that contain images or shadings.
