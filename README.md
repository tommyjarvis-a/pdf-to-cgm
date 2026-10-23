# PDF to CGM CAD Vector Workbench (`ISO/IEC 8632`)

A 100% client-side browser tool for converting PDF engineering drawings and technical illustrations into **ISO/IEC 8632 Computer Graphics Metafile (`.cgm`)** files.

- **Live Web App:** https://tommyjarvis-a.github.io/pdf-to-cgm/
- **Repository:** https://github.com/tommyjarvis-a/pdf-to-cgm

## Features

- **ISO/IEC 8632-3 Binary CGM (`nx_v1`)** — 16-bit Integer VDC binary metafile (`POLYLINE`, `POLYGON`, `TEXT`, `CELLARRAY`) tuned for CAD import (`Siemens NX`, `CorelDESIGNER`, `ViewCompanion`, `LibreOffice`).
- **WebCGM 2.0 / S1000D (`webcgm_v3`)** — Version 3 binary CGM with native cubic `POLYBEZIER` curves (`Class 4, ID 26`).
- **ISO/IEC 8632-4 Clear-Text CGM (`cleartext`)** — Human-readable ASCII CGM commands (`BEGMF`, `VDCEXT`, `LINE`, `POLYGON`, `POLYBEZIER`, `TEXT`, `ENDMF`).
- **Text-to-Path CAD Outlines** — Converts PDF text runs into single-stroke CAD vector polylines so drawings import with zero missing-font issues, or preserves editable CGM `TEXT` elements.
- **Full-Page Raster Fallback (`CELLARRAY`)** — Optional bitmap conversion for scanned or complex shaded PDFs.
- **Live Round-Trip Decoder & Inspector** — Decodes the generated `.cgm` byte stream back onto a side-by-side comparison canvas alongside the source PDF page, with an interactive command trace and binary hex dump.
