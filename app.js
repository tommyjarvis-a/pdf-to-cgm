/* PDF to CGM CAD Vector Workbench (ISO/IEC 8632-3 Binary & 8632-4 Clear Text) */
(function () {
  "use strict";

  if (window.pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
  }

  // --- Simplex/CAD Single-Stroke Vector Font for Text-to-Path ---
  // Coordinates in [0..10] x [0..14] cell, baseline at y=0, cap-height y=10
  const STROKE_GLYPHS = {
    "A": [[[0,0],[5,10],[10,0]],[[2,4],[8,4]]],
    "B": [[[1,0],[1,10],[7,10],[9,8.5],[9,6.5],[7,5],[1,5]],[[7,5],[9.5,3.5],[9.5,1.5],[7,0],[1,0]]],
    "C": [[[9,8],[7,10],[3,10],[1,8],[1,2],[3,0],[7,0],[9,2]]],
    "D": [[[1,0],[1,10],[6,10],[9,7.5],[9,2.5],[6,0],[1,0]]],
    "E": [[[9,10],[1,10],[1,0],[9,0]],[[1,5],[7,5]]],
    "F": [[[9,10],[1,10],[1,0]],[[1,5],[7,5]]],
    "G": [[[9,8],[7,10],[3,10],[1,8],[1,2],[3,0],[8,0],[9,2],[9,4.5],[5.5,4.5]]],
    "H": [[[1,0],[1,10]],[[9,0],[9,10]],[[1,5],[9,5]]],
    "I": [[[2,10],[8,10]],[[5,0],[5,10]],[[2,0],[8,0]]],
    "J": [[[8,10],[8,2],[6,0],[3,0],[1,2]]],
    "K": [[[1,0],[1,10]],[[9,10],[1,4.5]],[[3.5,6.2],[9,0]]],
    "L": [[[1,10],[1,0],[9,0]]],
    "M": [[[1,0],[1,10],[5,3],[9,10],[9,0]]],
    "N": [[[1,0],[1,10],[9,0],[9,10]]],
    "O": [[[3,10],[7,10],[9,8],[9,2],[7,0],[3,0],[1,2],[1,8],[3,10]]],
    "P": [[[1,0],[1,10],[7,10],[9,8.5],[9,6],[7,4.5],[1,4.5]]],
    "Q": [[[3,10],[7,10],[9,8],[9,2],[7,0],[3,0],[1,2],[1,8],[3,10]],[[6,3],[10,-1]]],
    "R": [[[1,0],[1,10],[7,10],[9,8.5],[9,6],[7,4.5],[1,4.5]],[[5.5,4.5],[9,0]]],
    "S": [[[9,8.5],[7,10],[3,10],[1,8.5],[1,6.5],[3,5.2],[7,4.8],[9,3.5],[9,1.5],[7,0],[3,0],[1,1.5]]],
    "T": [[[0.5,10],[9.5,10]],[[5,0],[5,10]]],
    "U": [[[1,10],[1,2],[3,0],[7,0],[9,2],[9,10]]],
    "V": [[[1,10],[5,0],[9,10]]],
    "W": [[[0.5,10],[2.8,0],[5,7],[7.2,0],[9.5,10]]],
    "X": [[[1,10],[9,0]],[[9,10],[1,0]]],
    "Y": [[[1,10],[5,5],[9,10]],[[5,5],[5,0]]],
    "Z": [[[1,10],[9,10],[1,0],[9,0]]],
    "0": [[[3,10],[7,10],[9,8],[9,2],[7,0],[3,0],[1,2],[1,8],[3,10]],[[2,2],[8,8]]],
    "1": [[[2.5,8],[5,10],[5,0]],[[2,0],[8,0]]],
    "2": [[[1,8],[3,10],[7,10],[9,8],[9,6],[1,0],[9,0]]],
    "3": [[[1,8.5],[3,10],[7,10],[9,8.5],[9,6.5],[6,5],[9,3.5],[9,1.5],[7,0],[3,0],[1,1.5]]],
    "4": [[[7,0],[7,10],[1,3.5],[9.5,3.5]]],
    "5": [[[9,10],[1.5,10],[1,5.5],[6.5,5.5],[9,4],[9,1.5],[6.5,0],[2.5,0],[1,1.5]]],
    "6": [[[8.5,8.5],[6.5,10],[3,10],[1,7.5],[1,2],[3,0],[7,0],[9,2],[9,4.5],[7,6],[3,6],[1,4]]],
    "7": [[[1,10],[9,10],[4,0]]],
    "8": [[[3,5],[1,6.5],[1,8.5],[3,10],[7,10],[9,8.5],[9,6.5],[7,5],[3,5],[1,3.5],[1,1.5],[3,0],[7,0],[9,1.5],[9,3.5],[7,5]]],
    "9": [[[9,6],[7,4],[3,4],[1,6],[1,8],[3,10],[7,10],[9,8],[9,2.5],[6.5,0],[2.5,0],[1,1.5]]],
    ".": [[[4.5,0],[5.5,0],[5.5,1],[4.5,1],[4.5,0]]],
    ",": [[[5.5,1.5],[4.5,1.5],[5,0.5],[4,-1.2]]],
    ":": [[[4.5,6.5],[5.5,6.5],[5.5,7.5],[4.5,7.5],[4.5,6.5]],[[4.5,1],[5.5,1],[5.5,2],[4.5,2],[4.5,1]]],
    "-": [[[2,5],[8,5]]],
    "+": [[[5,2],[5,8]],[[2,5],[8,5]]],
    "/": [[[1.5,0],[8.5,10]]],
    "(": [[[6.5,11],[4,8],[4,2],[6.5,-1]]],
    ")": [[[3.5,11],[6,8],[6,2],[3.5,-1]]],
    "|": [[[5,-1],[5,11]]],
    "&": [[[9,0],[2,7.5],[2,9],[4,10],[6,9],[6,7.5],[1,3.5],[1,1.5],[3,0],[6.5,0],[9,3.5]]],
    "=": [[[2,6.5],[8,6.5]],[[2,3.5],[8,3.5]]]
  };

  function textToStrokePolylines(str, x, y, fontSizePt, colorRgb) {
    const out = [];
    const scale = Math.max(2, fontSizePt) / 10.0;
    const adv = 7.4 * scale;
    let curX = x;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === " ") {
        curX += adv * 0.75;
        continue;
      }
      const upper = ch.toUpperCase();
      const isLower = ch >= "a" && ch <= "z";
      const glyph = STROKE_GLYPHS[upper] || STROKE_GLYPHS["-"];
      const sx = scale * (isLower ? 0.82 : 0.78);
      const sy = scale * (isLower ? 0.72 : 1.0);
      for (const stroke of glyph) {
        const pts = stroke.map(([gx, gy]) => [curX + gx * sx, y + gy * sy]);
        out.push({
          type: "polyline",
          points: pts,
          color: colorRgb,
          lineWidth: Math.max(0.45, fontSizePt * 0.085),
          dashType: 1,
          isTextStroke: true
        });
      }
      curX += adv * (isLower ? 0.86 : 1.0);
    }
    return out;
  }

  // --- Geometry & Matrix Utilities ---
  function multiplyMatrix(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];
  }

  function applyMatrix(m, x, y) {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }

  function flattenCubicBezier(p0, p1, p2, p3, tolPt, outPts) {
    function subdiv(x0, y0, x1, y1, x2, y2, x3, y3, depth) {
      const dx = x3 - x0, dy = y3 - y0;
      const d2 = Math.abs((x1 - x3) * dy - (y1 - y3) * dx);
      const d3 = Math.abs((x2 - x3) * dy - (y2 - y3) * dx);
      if ((d2 + d3) * (d2 + d3) <= tolPt * tolPt * (dx * dx + dy * dy) || depth > 8) {
        outPts.push([x3, y3]);
        return;
      }
      const x01 = (x0 + x1) * 0.5, y01 = (y0 + y1) * 0.5;
      const x12 = (x1 + x2) * 0.5, y12 = (y1 + y2) * 0.5;
      const x23 = (x2 + x3) * 0.5, y23 = (y2 + y3) * 0.5;
      const x012 = (x01 + x12) * 0.5, y012 = (y01 + y12) * 0.5;
      const x123 = (x12 + x23) * 0.5, y123 = (y12 + y23) * 0.5;
      const x0123 = (x012 + x123) * 0.5, y0123 = (y012 + y123) * 0.5;
      subdiv(x0, y0, x01, y01, x012, y012, x0123, y0123, depth + 1);
      subdiv(x0123, y0123, x123, y123, x23, y23, x3, y3, depth + 1);
    }
    subdiv(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], 0);
  }

  function classifyDash(dashArr) {
    if (!dashArr || !dashArr.length) return 1; // Solid
    if (dashArr.length >= 4) return 4; // Dash-dot (centerline)
    if (dashArr[0] <= 2.5) return 3; // Dotted
    return 2; // Dashed
  }

  function normalizeColor(args, monochrome) {
    if (monochrome) return [20, 28, 42];
    if (!args) return [20, 28, 42];
    // PDF.js 3.x passes Uint8ClampedArray [r,g,b] in 0..255 or floats 0..1
    let r = args[0], g = args[1], b = args[2];
    if (r === undefined && args[0] && typeof args[0] === "object") {
      r = args[0][0]; g = args[0][1]; b = args[0][2];
    }
    if (r <= 1 && g <= 1 && b <= 1 && (r % 1 !== 0 || g % 1 !== 0 || b % 1 !== 0 || (r === 1 && g === 1 && b === 1))) {
      // Wait: if all are <=1, check if [1,1,1] in 0..255 or 0..1. In PDF.js 3.11, [255,255,255] is passed for white!
      if (r <= 1 && g <= 1 && b <= 1 && (r < 1 || g < 1 || b < 1)) {
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
      }
    }
    return [
      Math.max(0, Math.min(255, Math.round(r || 0))),
      Math.max(0, Math.min(255, Math.round(g || 0))),
      Math.max(0, Math.min(255, Math.round(b || 0)))
    ];
  }

  // --- Extract Vector Primitives, Text, and Optional Raster from a PDF.js Page ---
  async function extractPageScene(page, options, rasterCanvas) {
    const vp = page.getViewport({ scale: 1.0 });
    const widthPt = vp.width;
    const heightPt = vp.height;
    const widthMm = widthPt * (25.4 / 72.0);
    const heightMm = heightPt * (25.4 / 72.0);
    const tolPt = (options.toleranceMm || 0.08) * (72.0 / 25.4);
    const OPS = pdfjsLib.OPS;

    const primitives = [];

    if (options.mode === "raster" && rasterCanvas) {
      // Downsample canvas to compact CGM CELLARRAY (e.g. 240x170 RGB grid) so CGM stays fast and standard-compliant
      const nx = 220;
      const ny = Math.max(80, Math.round((heightPt / widthPt) * nx));
      const tmp = document.createElement("canvas");
      tmp.width = nx;
      tmp.height = ny;
      const tctx = tmp.getContext("2d");
      tctx.fillStyle = "#ffffff";
      tctx.fillRect(0, 0, nx, ny);
      tctx.drawImage(rasterCanvas, 0, 0, nx, ny);
      const imgData = tctx.getImageData(0, 0, nx, ny).data;
      const rgbCells = new Uint8Array(nx * ny * 3);
      for (let row = 0; row < ny; row++) {
        // CGM coordinates have Y=0 at bottom, whereas canvas has Y=0 at top
        const srcRow = ny - 1 - row;
        for (let col = 0; col < nx; col++) {
          const si = (srcRow * nx + col) * 4;
          const di = (row * nx + col) * 3;
          rgbCells[di] = imgData[si];
          rgbCells[di + 1] = imgData[si + 1];
          rgbCells[di + 2] = imgData[si + 2];
        }
      }
      primitives.push({
        type: "cellarray",
        x0: 0, y0: 0,
        x1: widthPt, y1: heightPt,
        nx, ny,
        rgb: rgbCells
      });
      return { widthPt, heightPt, widthMm, heightMm, primitives };
    }

    const opList = await page.getOperatorList();
    let state = {
      ctm: [1, 0, 0, 1, 0, 0],
      strokeColor: [20, 35, 60],
      fillColor: [235, 242, 250],
      lineWidth: 1.0,
      dash: []
    };
    const stack = [];
    let pendingSubpaths = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === OPS.save) {
        stack.push({
          ctm: state.ctm.slice(),
          strokeColor: state.strokeColor.slice(),
          fillColor: state.fillColor.slice(),
          lineWidth: state.lineWidth,
          dash: state.dash.slice()
        });
      } else if (fn === OPS.restore) {
        if (stack.length) state = stack.pop();
      } else if (fn === OPS.transform) {
        state.ctm = multiplyMatrix(state.ctm, args);
      } else if (fn === OPS.setLineWidth) {
        state.lineWidth = Math.max(0.25, Number(args[0]) || 1.0);
      } else if (fn === OPS.setDash) {
        state.dash = Array.isArray(args[0]) ? args[0].slice() : [];
      } else if (fn === OPS.setStrokeRGBColor) {
        state.strokeColor = normalizeColor(args[0] !== undefined && typeof args[0] === "object" ? args[0] : args, options.monochrome);
      } else if (fn === OPS.setFillRGBColor) {
        state.fillColor = normalizeColor(args[0] !== undefined && typeof args[0] === "object" ? args[0] : args, options.monochrome);
      } else if (fn === OPS.setStrokeGray) {
        const g = Math.round((Number(args[0]) || 0) * 255);
        state.strokeColor = options.monochrome ? [20, 28, 42] : [g, g, g];
      } else if (fn === OPS.setFillGray) {
        const g = Math.round((Number(args[0]) || 0) * 255);
        state.fillColor = [g, g, g];
      } else if (fn === OPS.constructPath) {
        pendingSubpaths = [];
        const ops = args[0] || [];
        const coords = args[1] || [];
        let ci = 0;
        let cur = null;

        for (let oi = 0; oi < ops.length; oi++) {
          const op = ops[oi];
          if (op === OPS.moveTo) {
            const p = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
            cur = { points: [p], beziers: [], hasLines: false, closed: false };
            pendingSubpaths.push(cur);
          } else if (op === OPS.lineTo) {
            const p = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
            if (!cur) {
              cur = { points: [p], beziers: [], hasLines: false, closed: false };
              pendingSubpaths.push(cur);
            } else {
              cur.points.push(p);
              cur.hasLines = true;
            }
          } else if (op === OPS.curveTo || op === OPS.curveTo2 || op === OPS.curveTo3) {
            let p1, p2, p3;
            const p0 = cur && cur.points.length ? cur.points[cur.points.length - 1] : [0, 0];
            if (op === OPS.curveTo) {
              p1 = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
              p2 = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
              p3 = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
            } else if (op === OPS.curveTo2) {
              p1 = p0;
              p2 = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
              p3 = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
            } else {
              p1 = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
              p3 = applyMatrix(state.ctm, coords[ci++], coords[ci++]);
              p2 = p3;
            }
            if (!cur) {
              cur = { points: [p0], beziers: [], closed: false };
              pendingSubpaths.push(cur);
            }
            cur.beziers.push([p0, p1, p2, p3]);
            flattenCubicBezier(p0, p1, p2, p3, tolPt, cur.points);
          } else if (op === OPS.closePath) {
            if (cur && cur.points.length > 1) {
              cur.closed = true;
              const first = cur.points[0];
              const last = cur.points[cur.points.length - 1];
              if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 0.01) {
                cur.points.push([first[0], first[1]]);
              }
            }
          } else if (op === OPS.rectangle) {
            const rx = coords[ci++], ry = coords[ci++], rw = coords[ci++], rh = coords[ci++];
            const p0 = applyMatrix(state.ctm, rx, ry);
            const p1 = applyMatrix(state.ctm, rx + rw, ry);
            const p2 = applyMatrix(state.ctm, rx + rw, ry + rh);
            const p3 = applyMatrix(state.ctm, rx, ry + rh);
            pendingSubpaths.push({
              points: [p0, p1, p2, p3, [p0[0], p0[1]]],
              beziers: [],
              closed: true
            });
            cur = null;
          }
        }
      } else if (
        fn === OPS.stroke || fn === OPS.closeStroke ||
        fn === OPS.fill || fn === OPS.eoFill ||
        fn === OPS.fillStroke || fn === OPS.eoFillStroke ||
        fn === OPS.closeFillStroke || fn === OPS.closeEOFillStroke
      ) {
        const doFill = (
          fn === OPS.fill || fn === OPS.eoFill ||
          fn === OPS.fillStroke || fn === OPS.eoFillStroke ||
          fn === OPS.closeFillStroke || fn === OPS.closeEOFillStroke
        );
        const doStroke = (
          fn === OPS.stroke || fn === OPS.closeStroke ||
          fn === OPS.fillStroke || fn === OPS.eoFillStroke ||
          fn === OPS.closeFillStroke || fn === OPS.closeEOFillStroke
        );
        const forceClose = (
          fn === OPS.closeStroke || fn === OPS.closeFillStroke || fn === OPS.closeEOFillStroke
        );
        const dashType = classifyDash(state.dash);

        for (const sp of pendingSubpaths) {
          if (sp.points.length < 2) continue;
          if (forceClose && !sp.closed) {
            const first = sp.points[0];
            const last = sp.points[sp.points.length - 1];
            if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 0.01) {
              sp.points.push([first[0], first[1]]);
            }
            sp.closed = true;
          }

          if (doFill && sp.points.length >= 3) {
            primitives.push({
              type: "polygon",
              points: sp.points.slice(),
              fillColor: state.fillColor.slice(),
              edgeVisible: doStroke,
              edgeColor: state.strokeColor.slice(),
              edgeWidth: state.lineWidth,
              edgeType: dashType
            });
          } else if (doStroke) {
            if (options.profile === "webcgm_v3" && sp.beziers.length > 0 && !sp.hasLines) {
              primitives.push({
                type: "polybezier",
                beziers: sp.beziers.slice(),
                points: sp.points.slice(),
                color: state.strokeColor.slice(),
                lineWidth: state.lineWidth,
                dashType
              });
            } else {
              primitives.push({
                type: "polyline",
                points: sp.points.slice(),
                color: state.strokeColor.slice(),
                lineWidth: state.lineWidth,
                dashType
              });
            }
          }
        }
        pendingSubpaths = [];
      } else if (fn === OPS.endPath) {
        pendingSubpaths = [];
      }
    }

    // Extract Text Content
    const tc = await page.getTextContent();
    let textRunCount = 0;
    for (const item of tc.items) {
      const str = (item.str || "").trim();
      if (!str) continue;
      textRunCount++;
      const tr = item.transform || [10, 0, 0, 10, 0, 0];
      const fontSize = Math.max(4, Math.hypot(tr[0], tr[1]) || item.height || 9);
      const tx = tr[4];
      const ty = tr[5];
      const textColor = options.monochrome ? [20, 28, 42] : [20, 42, 78];

      if (options.textMode === "stroke") {
        const strokes = textToStrokePolylines(str, tx, ty, fontSize, textColor);
        for (const s of strokes) primitives.push(s);
      } else {
        primitives.push({
          type: "text",
          str,
          x: tx,
          y: ty,
          fontSize,
          color: textColor
        });
      }
    }

    return { widthPt, heightPt, widthMm, heightMm, primitives, textRunCount };
  }

  // --- ISO/IEC 8632-3 Binary CGM Encoder ---
  function encodeBinaryCGM(scenes, options) {
    const chunks = [];
    const trace = [];
    const scaleVdcPerPt = 10; // 10 VDC units per PDF point (~0.0353 mm precision, fits 16-bit signed int up to 3276 pt)

    function toVdc(pt) {
      return Math.max(-32760, Math.min(32760, Math.round(pt * scaleVdcPerPt)));
    }

    function emitCommand(cls, id, paramBytes, traceLine) {
      if (traceLine && trace.length < 350) trace.push(traceLine);
      const len = paramBytes.length;
      if (len < 31) {
        const hdr = ((cls & 0x0F) << 12) | ((id & 0x7F) << 5) | (len & 0x1F);
        const pad = (len % 2 === 1) ? 1 : 0;
        const buf = new Uint8Array(2 + len + pad);
        buf[0] = (hdr >> 8) & 0xFF;
        buf[1] = hdr & 0xFF;
        buf.set(paramBytes, 2);
        chunks.push(buf);
      } else {
        // Long-form command header (5-bit length = 31) + 16-bit partition word(s)
        const hdr = ((cls & 0x0F) << 12) | ((id & 0x7F) << 5) | 31;
        chunks.push(new Uint8Array([(hdr >> 8) & 0xFF, hdr & 0xFF]));
        let offset = 0;
        while (offset < len) {
          const partLen = Math.min(32760, len - offset);
          const more = (offset + partLen < len) ? 0x8000 : 0x0000;
          const pword = more | (partLen & 0x7FFF);
          const pad = (partLen % 2 === 1) ? 1 : 0;
          const pbuf = new Uint8Array(2 + partLen + pad);
          pbuf[0] = (pword >> 8) & 0xFF;
          pbuf[1] = pword & 0xFF;
          pbuf.set(paramBytes.subarray(offset, offset + partLen), 2);
          chunks.push(pbuf);
          offset += partLen;
        }
      }
    }

    function strBytes(s) {
      const clean = String(s || "").replace(/[^\x20-\x7E]/g, "?");
      const n = Math.min(254, clean.length);
      const b = new Uint8Array(1 + n);
      b[0] = n;
      for (let i = 0; i < n; i++) b[1 + i] = clean.charCodeAt(i);
      return b;
    }

    function i16Bytes(vals) {
      const b = new Uint8Array(vals.length * 2);
      const dv = new DataView(b.buffer);
      for (let i = 0; i < vals.length; i++) dv.setInt16(i * 2, vals[i], false);
      return b;
    }

    const mfVer = options.profile === "webcgm_v3" ? 3 : 1;
    // BEGIN METAFILE (Class 0, ID 1)
    emitCommand(0, 1, strBytes(options.title || "CAD_DRAWING"), `BEGMF '${options.title || "CAD_DRAWING"}';`);
    // METAFILE VERSION (Class 1, ID 1)
    emitCommand(1, 1, i16Bytes([mfVer]), `MFVERSION ${mfVer};`);
    // METAFILE DESCRIPTION (Class 1, ID 2)
    emitCommand(1, 2, strBytes("ISO/IEC 8632 CGM - PDF-to-CGM CAD Workbench"), `MFDESC 'ISO/IEC 8632 CGM - PDF-to-CGM CAD Workbench';`);
    // VDC TYPE (Class 1, ID 3): 0 = Integer VDC
    emitCommand(1, 3, i16Bytes([0]), `VDCTYPE INTEGER;`);
    // INTEGER PRECISION (Class 1, ID 4): 16-bit
    emitCommand(1, 4, i16Bytes([16]), `INTEGERPREC 16;`);
    // INDEX PRECISION (Class 1, ID 6): 16-bit
    emitCommand(1, 6, i16Bytes([16]), `INDEXPREC 16;`);
    // COLOR PRECISION (Class 1, ID 7): 8-bit per channel
    emitCommand(1, 7, i16Bytes([8]), `COLRPREC 8;`);
    // COLOR VALUE EXTENT (Class 1, ID 10): RGB (0,0,0) to (255,255,255)
    emitCommand(1, 10, new Uint8Array([0, 0, 0, 255, 255, 255]), `COLRVALUEEXT 0 0 0, 255 255 255;`);
    // METAFILE ELEMENT LIST (Class 1, ID 11): 1 shorthand (-1, 1) Drawing-Plus-Control
    emitCommand(1, 11, i16Bytes([1, -1, 1]), `MFELEMLIST 'DRAWINGPLUS';`);
    // FONT LIST (Class 1, ID 13): Helvetica
    emitCommand(1, 13, strBytes("Helvetica"), `FONTLIST 'Helvetica';`);

    let stats = { polylines: 0, polygons: 0, beziers: 0, texts: 0, vertices: 0 };

    scenes.forEach((scene, idx) => {
      const picName = `PAGE_${idx + 1}`;
      const vdcW = toVdc(scene.widthPt);
      const vdcH = toVdc(scene.heightPt);
      stats.texts += scene.textRunCount || 0;

      // BEGIN PICTURE (Class 0, ID 3)
      emitCommand(0, 3, strBytes(picName), `BEGPIC '${picName}';`);
      // COLOR SELECTION MODE (Class 2, ID 2): 1 = Direct RGB
      emitCommand(2, 2, i16Bytes([1]), `  COLRMODE DIRECT;`);
      // LINE WIDTH SPECIFICATION MODE (Class 2, ID 3): 0 = Absolute VDC
      emitCommand(2, 3, i16Bytes([0]), `  LINEWIDTHMODE ABS;`);
      // EDGE WIDTH SPECIFICATION MODE (Class 2, ID 5): 0 = Absolute VDC
      emitCommand(2, 5, i16Bytes([0]), `  EDGEWIDTHMODE ABS;`);
      // VDC EXTENT (Class 2, ID 6): (0,0) to (vdcW, vdcH)
      emitCommand(2, 6, i16Bytes([0, 0, vdcW, vdcH]), `  VDCEXT (0,0) (${vdcW},${vdcH});`);
      // BACKGROUND COLOR (Class 2, ID 7): (255,255,255)
      emitCommand(2, 7, new Uint8Array([255, 255, 255]), `  BACKCOLR 255 255 255;`);
      // BEGIN PICTURE BODY (Class 0, ID 4)
      emitCommand(0, 4, new Uint8Array(0), `BEGPICBODY;`);

      let curLineColor = "";
      let curLineWidth = -1;
      let curLineType = -1;

      for (const p of scene.primitives) {
        if (p.type === "polyline") {
          const cKey = p.color.join(",");
          if (cKey !== curLineColor) {
            emitCommand(5, 4, new Uint8Array(p.color), `  LINECOLR ${p.color.join(" ")};`);
            curLineColor = cKey;
          }
          const lw = Math.max(1, toVdc(p.lineWidth));
          if (lw !== curLineWidth) {
            emitCommand(5, 3, i16Bytes([lw]), `  LINEWIDTH ${lw};`);
            curLineWidth = lw;
          }
          const lt = p.dashType || 1;
          if (lt !== curLineType) {
            emitCommand(5, 2, i16Bytes([lt]), `  LINETYPE ${lt};`);
            curLineType = lt;
          }
          const coords = [];
          for (const pt of p.points) {
            coords.push(toVdc(pt[0]), toVdc(pt[1]));
          }
          stats.polylines++;
          stats.vertices += p.points.length;
          emitCommand(4, 1, i16Bytes(coords), `  LINE (${coords[0]},${coords[1]}) ... [${p.points.length} pts];`);
        } else if (p.type === "polygon") {
          // INTERIOR STYLE (Class 5, ID 22): 1 = Solid
          emitCommand(5, 22, i16Bytes([1]), `  INTSTYLE SOLID;`);
          // FILL COLOR (Class 5, ID 23)
          emitCommand(5, 23, new Uint8Array(p.fillColor), `  FILLCOLR ${p.fillColor.join(" ")};`);
          // EDGE VISIBILITY (Class 5, ID 30)
          emitCommand(5, 30, i16Bytes([p.edgeVisible ? 1 : 0]), `  EDGEVIS ${p.edgeVisible ? "ON" : "OFF"};`);
          if (p.edgeVisible) {
            emitCommand(5, 29, new Uint8Array(p.edgeColor), `  EDGECOLR ${p.edgeColor.join(" ")};`);
            emitCommand(5, 28, i16Bytes([Math.max(1, toVdc(p.edgeWidth))]), `  EDGEWIDTH ${Math.max(1, toVdc(p.edgeWidth))};`);
            emitCommand(5, 27, i16Bytes([p.edgeType || 1]), `  EDGETYPE ${p.edgeType || 1};`);
          }
          const coords = [];
          for (const pt of p.points) {
            coords.push(toVdc(pt[0]), toVdc(pt[1]));
          }
          stats.polygons++;
          stats.vertices += p.points.length;
          emitCommand(4, 7, i16Bytes(coords), `  POLYGON (${coords[0]},${coords[1]}) ... [${p.points.length} pts];`);
        } else if (p.type === "polybezier") {
          const cKey = p.color.join(",");
          if (cKey !== curLineColor) {
            emitCommand(5, 4, new Uint8Array(p.color), `  LINECOLR ${p.color.join(" ")};`);
            curLineColor = cKey;
          }
          const lw = Math.max(1, toVdc(p.lineWidth));
          if (lw !== curLineWidth) {
            emitCommand(5, 3, i16Bytes([lw]), `  LINEWIDTH ${lw};`);
            curLineWidth = lw;
          }
          // POLYBEZIER (Class 4, ID 26): continuity indicator 2 (continuous: 3n+1 points)
          const coords = [2];
          coords.push(toVdc(p.beziers[0][0][0]), toVdc(p.beziers[0][0][1]));
          for (const seg of p.beziers) {
            coords.push(
              toVdc(seg[1][0]), toVdc(seg[1][1]),
              toVdc(seg[2][0]), toVdc(seg[2][1]),
              toVdc(seg[3][0]), toVdc(seg[3][1])
            );
          }
          stats.beziers += p.beziers.length;
          stats.vertices += 1 + p.beziers.length * 3;
          emitCommand(4, 26, i16Bytes(coords), `  POLYBEZIER 2 (${coords[1]},${coords[2]}) ... [${p.beziers.length} segs];`);
        } else if (p.type === "text") {
          // TEXT COLOR (Class 5, ID 14)
          emitCommand(5, 14, new Uint8Array(p.color), `  TEXTCOLR ${p.color.join(" ")};`);
          // CHARACTER HEIGHT (Class 5, ID 15)
          const ch = Math.max(10, toVdc(p.fontSize * 0.85));
          emitCommand(5, 15, i16Bytes([ch]), `  CHARHEIGHT ${ch};`);
          // TEXT (Class 4, ID 4): point(x,y) + enum(1=final) + string
          const sb = strBytes(p.str);
          const tb = new Uint8Array(6 + sb.length);
          const dv = new DataView(tb.buffer);
          dv.setInt16(0, toVdc(p.x), false);
          dv.setInt16(2, toVdc(p.y), false);
          dv.setInt16(4, 1, false); // Final flag
          tb.set(sb, 6);
          emitCommand(4, 4, tb, `  TEXT (${toVdc(p.x)},${toVdc(p.y)}) FINAL '${p.str.replace(/'/g, "")}';`);
        } else if (p.type === "cellarray") {
          // CELL ARRAY (Class 4, ID 9): P(x0,y0), Q(x1,y1), R(x1,y0), nx, ny, localColorPrec=8, mode=1 (packed), rgb bytes
          const hdr16 = i16Bytes([
            toVdc(p.x0), toVdc(p.y0),
            toVdc(p.x1), toVdc(p.y1),
            toVdc(p.x1), toVdc(p.y0),
            p.nx, p.ny,
            8, 1
          ]);
          const pay = new Uint8Array(hdr16.length + p.rgb.length);
          pay.set(hdr16, 0);
          pay.set(p.rgb, hdr16.length);
          stats.vertices += 4;
          emitCommand(4, 9, pay, `  CELLARRAY (0,0) (${vdcW},${vdcH}) ${p.nx}x${p.ny} DIRECT RGB;`);
        }
      }

      // END PICTURE (Class 0, ID 5)
      emitCommand(0, 5, new Uint8Array(0), `ENDPIC;`);
    });

    // END METAFILE (Class 0, ID 2)
    emitCommand(0, 2, new Uint8Array(0), `ENDMF;`);

    let totalLen = 0;
    for (const c of chunks) totalLen += c.length;
    const out = new Uint8Array(totalLen);
    let pos = 0;
    for (const c of chunks) {
      out.set(c, pos);
      pos += c.length;
    }
    return { bytes: out, trace, stats };
  }

  // --- ISO/IEC 8632-4 Clear Text CGM Encoder ---
  function encodeClearTextCGM(scenes, options) {
    const scaleVdcPerPt = 10;
    const toVdc = (pt) => Math.round(pt * scaleVdcPerPt);
    const lines = [];
    const mfVer = options.profile === "webcgm_v3" ? 3 : 1;

    lines.push(`BEGMF '${options.title || "CAD_DRAWING"}';`);
    lines.push(`  MFVERSION ${mfVer};`);
    lines.push(`  MFDESC 'ISO/IEC 8632-4 Clear Text CGM - PDF-to-CGM CAD Workbench';`);
    lines.push(`  VDCTYPE INTEGER;`);
    lines.push(`  INTEGERPREC -32768, 32767;`);
    lines.push(`  COLRPREC 255;`);
    lines.push(`  COLRVALUEEXT 0 0 0, 255 255 255;`);
    lines.push(`  MFELEMLIST 'DRAWINGPLUS';`);
    lines.push(`  FONTLIST 'Helvetica';`);

    scenes.forEach((scene, idx) => {
      const vdcW = toVdc(scene.widthPt);
      const vdcH = toVdc(scene.heightPt);
      lines.push(`BEGPIC 'PAGE_${idx + 1}';`);
      lines.push(`  COLRMODE DIRECT;`);
      lines.push(`  LINEWIDTHMODE ABS;`);
      lines.push(`  EDGEWIDTHMODE ABS;`);
      lines.push(`  VDCEXT (0,0) (${vdcW},${vdcH});`);
      lines.push(`  BACKCOLR 255 255 255;`);
      lines.push(`BEGPICBODY;`);

      for (const p of scene.primitives) {
        if (p.type === "polyline") {
          lines.push(`  LINECOLR ${p.color.join(" ")};`);
          lines.push(`  LINEWIDTH ${Math.max(1, toVdc(p.lineWidth))};`);
          lines.push(`  LINETYPE ${p.dashType || 1};`);
          const pts = p.points.map(pt => `(${toVdc(pt[0])},${toVdc(pt[1])})`).join(" ");
          lines.push(`  LINE ${pts};`);
        } else if (p.type === "polygon") {
          lines.push(`  INTSTYLE SOLID;`);
          lines.push(`  FILLCOLR ${p.fillColor.join(" ")};`);
          lines.push(`  EDGEVIS ${p.edgeVisible ? "ON" : "OFF"};`);
          if (p.edgeVisible) {
            lines.push(`  EDGECOLR ${p.edgeColor.join(" ")};`);
            lines.push(`  EDGEWIDTH ${Math.max(1, toVdc(p.edgeWidth))};`);
          }
          const pts = p.points.map(pt => `(${toVdc(pt[0])},${toVdc(pt[1])})`).join(" ");
          lines.push(`  POLYGON ${pts};`);
        } else if (p.type === "polybezier") {
          lines.push(`  LINECOLR ${p.color.join(" ")};`);
          lines.push(`  LINEWIDTH ${Math.max(1, toVdc(p.lineWidth))};`);
          const pts = [`(${toVdc(p.beziers[0][0][0])},${toVdc(p.beziers[0][0][1])})`];
          for (const seg of p.beziers) {
            pts.push(
              `(${toVdc(seg[1][0])},${toVdc(seg[1][1])})`,
              `(${toVdc(seg[2][0])},${toVdc(seg[2][1])})`,
              `(${toVdc(seg[3][0])},${toVdc(seg[3][1])})`
            );
          }
          lines.push(`  POLYBEZIER 2 ${pts.join(" ")};`);
        } else if (p.type === "text") {
          lines.push(`  TEXTCOLR ${p.color.join(" ")};`);
          lines.push(`  CHARHEIGHT ${Math.max(10, toVdc(p.fontSize * 0.85))};`);
          const safe = p.str.replace(/'/g, "''");
          lines.push(`  TEXT (${toVdc(p.x)},${toVdc(p.y)}) FINAL '${safe}';`);
        }
      }
      lines.push(`ENDPIC;`);
    });

    lines.push(`ENDMF;`);
    const text = lines.join("\n") + "\n";
    return new TextEncoder().encode(text);
  }

  // --- Independent Round-Trip Binary CGM Parser & Validator ---
  function decodeAndValidateBinaryCGM(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let pos = 0;
    let hasBegMf = false, hasEndMf = false;
    const pictures = [];
    let curPic = null;
    let state = {
      lineColor: [20, 35, 60],
      lineWidth: 10,
      lineType: 1,
      fillColor: [235, 242, 250],
      edgeVisible: true,
      edgeColor: [20, 35, 60],
      edgeWidth: 10,
      edgeType: 1,
      textColor: [20, 42, 78],
      charHeight: 90
    };

    while (pos + 2 <= bytes.length) {
      const hdr = dv.getUint16(pos, false);
      pos += 2;
      const cls = (hdr >> 12) & 0x0F;
      const id = (hdr >> 5) & 0x7F;
      const shortLen = hdr & 0x1F;

      let paramBytes;
      if (shortLen < 31) {
        paramBytes = bytes.subarray(pos, pos + shortLen);
        pos += shortLen + (shortLen % 2);
      } else {
        const chunks = [];
        let total = 0;
        while (pos + 2 <= bytes.length) {
          const pword = dv.getUint16(pos, false);
          pos += 2;
          const more = (pword & 0x8000) !== 0;
          const plen = pword & 0x7FFF;
          chunks.push(bytes.subarray(pos, pos + plen));
          total += plen;
          pos += plen + (plen % 2);
          if (!more) break;
        }
        paramBytes = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
          paramBytes.set(c, off);
          off += c.length;
        }
      }

      const pdv = new DataView(paramBytes.buffer, paramBytes.byteOffset, paramBytes.byteLength);

      if (cls === 0 && id === 1) hasBegMf = true;
      else if (cls === 0 && id === 2) hasEndMf = true;
      else if (cls === 0 && id === 3) {
        curPic = { vdcExtent: [0, 0, 8419, 5953], elements: [] };
        pictures.push(curPic);
      } else if (cls === 2 && id === 6 && curPic && paramBytes.length >= 8) {
        curPic.vdcExtent = [
          pdv.getInt16(0, false), pdv.getInt16(2, false),
          pdv.getInt16(4, false), pdv.getInt16(6, false)
        ];
      } else if (cls === 5 && id === 2 && paramBytes.length >= 2) {
        state.lineType = pdv.getInt16(0, false);
      } else if (cls === 5 && id === 3 && paramBytes.length >= 2) {
        state.lineWidth = pdv.getInt16(0, false);
      } else if (cls === 5 && id === 4 && paramBytes.length >= 3) {
        state.lineColor = [paramBytes[0], paramBytes[1], paramBytes[2]];
      } else if (cls === 5 && id === 14 && paramBytes.length >= 3) {
        state.textColor = [paramBytes[0], paramBytes[1], paramBytes[2]];
      } else if (cls === 5 && id === 15 && paramBytes.length >= 2) {
        state.charHeight = pdv.getInt16(0, false);
      } else if (cls === 5 && id === 23 && paramBytes.length >= 3) {
        state.fillColor = [paramBytes[0], paramBytes[1], paramBytes[2]];
      } else if (cls === 5 && id === 27 && paramBytes.length >= 2) {
        state.edgeType = pdv.getInt16(0, false);
      } else if (cls === 5 && id === 28 && paramBytes.length >= 2) {
        state.edgeWidth = pdv.getInt16(0, false);
      } else if (cls === 5 && id === 29 && paramBytes.length >= 3) {
        state.edgeColor = [paramBytes[0], paramBytes[1], paramBytes[2]];
      } else if (cls === 5 && id === 30 && paramBytes.length >= 2) {
        state.edgeVisible = pdv.getInt16(0, false) !== 0;
      } else if (cls === 4 && id === 1 && curPic) {
        // POLYLINE
        const pts = [];
        for (let i = 0; i + 3 < paramBytes.length; i += 4) {
          pts.push([pdv.getInt16(i, false), pdv.getInt16(i + 2, false)]);
        }
        curPic.elements.push({
          type: "polyline",
          points: pts,
          color: state.lineColor.slice(),
          lineWidth: state.lineWidth,
          lineType: state.lineType
        });
      } else if (cls === 4 && id === 7 && curPic) {
        // POLYGON
        const pts = [];
        for (let i = 0; i + 3 < paramBytes.length; i += 4) {
          pts.push([pdv.getInt16(i, false), pdv.getInt16(i + 2, false)]);
        }
        curPic.elements.push({
          type: "polygon",
          points: pts,
          fillColor: state.fillColor.slice(),
          edgeVisible: state.edgeVisible,
          edgeColor: state.edgeColor.slice(),
          edgeWidth: state.edgeWidth,
          edgeType: state.edgeType
        });
      } else if (cls === 4 && id === 26 && curPic && paramBytes.length >= 18) {
        // POLYBEZIER
        const pts = [];
        for (let i = 2; i + 3 < paramBytes.length; i += 4) {
          pts.push([pdv.getInt16(i, false), pdv.getInt16(i + 2, false)]);
        }
        curPic.elements.push({
          type: "polybezier",
          points: pts,
          color: state.lineColor.slice(),
          lineWidth: state.lineWidth
        });
      } else if (cls === 4 && id === 4 && curPic && paramBytes.length >= 7) {
        // TEXT
        const tx = pdv.getInt16(0, false);
        const ty = pdv.getInt16(2, false);
        const slen = paramBytes[6];
        let str = "";
        for (let i = 0; i < slen && 7 + i < paramBytes.length; i++) {
          str += String.fromCharCode(paramBytes[7 + i]);
        }
        curPic.elements.push({
          type: "text",
          x: tx,
          y: ty,
          str,
          charHeight: state.charHeight,
          color: state.textColor.slice()
        });
      } else if (cls === 4 && id === 9 && curPic && paramBytes.length >= 20) {
        // CELL ARRAY
        const x0 = pdv.getInt16(0, false), y0 = pdv.getInt16(2, false);
        const x1 = pdv.getInt16(4, false), y1 = pdv.getInt16(6, false);
        const nx = pdv.getInt16(12, false), ny = pdv.getInt16(14, false);
        const rgb = paramBytes.subarray(20);
        curPic.elements.push({ type: "cellarray", x0, y0, x1, y1, nx, ny, rgb });
      }
    }

    return {
      valid: hasBegMf && hasEndMf && pictures.length > 0 && pos === bytes.length,
      pictures
    };
  }

  // --- Render Decoded CGM Picture onto Right-Hand Preview Canvas ---
  function renderDecodedCGM(canvas, pic, opts) {
    const [vx0, vy0, vx1, vy1] = pic.vdcExtent;
    const vw = Math.max(1, vx1 - vx0);
    const vh = Math.max(1, vy1 - vy0);
    const ctx = canvas.getContext("2d");
    const cw = canvas.width;
    const ch = canvas.height;
    const sx = cw / vw;
    const sy = ch / vh;

    ctx.save();
    ctx.fillStyle = opts.blueprint ? "#071120" : "#ffffff";
    ctx.fillRect(0, 0, cw, ch);

    if (opts.blueprint) {
      ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < cw; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      }
      for (let y = 0; y < ch; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
      }
    }

    function mapPt(p) {
      return [(p[0] - vx0) * sx, ch - (p[1] - vy0) * sy];
    }

    function cssColor(rgb, isFill) {
      if (opts.blueprint) {
        const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        if (isFill && lum > 220) return "rgba(14, 165, 233, 0.10)";
        if (rgb[0] > 160 && rgb[1] < 80) return "#fb7185";
        if (rgb[1] > 110 && rgb[2] > 140 && rgb[0] < 30) return "#22d3ee";
        return "#e2f1ff";
      }
      return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    }

    function applyDash(lt) {
      if (lt === 2) ctx.setLineDash([5, 3]);
      else if (lt === 3) ctx.setLineDash([2, 2]);
      else if (lt === 4) ctx.setLineDash([12, 3, 2, 3]);
      else ctx.setLineDash([]);
    }

    for (const el of pic.elements) {
      if (el.type === "cellarray") {
        const tmp = document.createElement("canvas");
        tmp.width = el.nx;
        tmp.height = el.ny;
        const tctx = tmp.getContext("2d");
        const idata = tctx.createImageData(el.nx, el.ny);
        for (let r = 0; r < el.ny; r++) {
          const dstRow = el.ny - 1 - r;
          for (let c = 0; c < el.nx; c++) {
            const si = (r * el.nx + c) * 3;
            const di = (dstRow * el.nx + c) * 4;
            idata.data[di] = el.rgb[si] || 255;
            idata.data[di + 1] = el.rgb[si + 1] || 255;
            idata.data[di + 2] = el.rgb[si + 2] || 255;
            idata.data[di + 3] = 255;
          }
        }
        tctx.putImageData(idata, 0, 0);
        ctx.drawImage(tmp, 0, 0, cw, ch);
      } else if (el.type === "polygon" && el.points.length >= 3) {
        ctx.beginPath();
        const p0 = mapPt(el.points[0]);
        ctx.moveTo(p0[0], p0[1]);
        for (let i = 1; i < el.points.length; i++) {
          const pi = mapPt(el.points[i]);
          ctx.lineTo(pi[0], pi[1]);
        }
        ctx.closePath();
        ctx.fillStyle = cssColor(el.fillColor, true);
        ctx.fill();
        if (el.edgeVisible) {
          applyDash(el.edgeType);
          ctx.strokeStyle = cssColor(el.edgeColor, false);
          ctx.lineWidth = Math.max(0.7, el.edgeWidth * sx);
          ctx.stroke();
        }
      } else if (el.type === "polyline" && el.points.length >= 2) {
        applyDash(el.lineType);
        ctx.beginPath();
        const p0 = mapPt(el.points[0]);
        ctx.moveTo(p0[0], p0[1]);
        for (let i = 1; i < el.points.length; i++) {
          const pi = mapPt(el.points[i]);
          ctx.lineTo(pi[0], pi[1]);
        }
        ctx.strokeStyle = cssColor(el.color, false);
        ctx.lineWidth = Math.max(0.65, el.lineWidth * sx);
        ctx.stroke();

        if (opts.showNodes) {
          ctx.fillStyle = "#22d3ee";
          for (let i = 0; i < el.points.length; i++) {
            const pi = mapPt(el.points[i]);
            ctx.fillRect(pi[0] - 1.5, pi[1] - 1.5, 3, 3);
          }
        }
      } else if (el.type === "polybezier" && el.points.length >= 4) {
        ctx.setLineDash([]);
        ctx.beginPath();
        const p0 = mapPt(el.points[0]);
        ctx.moveTo(p0[0], p0[1]);
        for (let i = 1; i + 2 < el.points.length; i += 3) {
          const c1 = mapPt(el.points[i]);
          const c2 = mapPt(el.points[i + 1]);
          const p3 = mapPt(el.points[i + 2]);
          ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p3[0], p3[1]);
        }
        ctx.strokeStyle = cssColor(el.color, false);
        ctx.lineWidth = Math.max(0.65, el.lineWidth * sx);
        ctx.stroke();
      } else if (el.type === "text") {
        ctx.setLineDash([]);
        const pt = mapPt([el.x, el.y]);
        const pxSize = Math.max(7, el.charHeight * sy * 1.12);
        ctx.font = `600 ${pxSize.toFixed(1)}px "Inter", Helvetica, Arial, sans-serif`;
        ctx.fillStyle = cssColor(el.color, false);
        ctx.fillText(el.str, pt[0], pt[1]);
      }
    }
    ctx.restore();
  }

  // --- Hex Dump Formatter ---
  function formatHexDump(bytes, maxBytes) {
    const limit = Math.min(bytes.length, maxBytes || 768);
    const lines = [];
    for (let i = 0; i < limit; i += 16) {
      const hex = [];
      let ascii = "";
      for (let j = 0; j < 16; j++) {
        if (i + j < limit) {
          const b = bytes[i + j];
          hex.push(b.toString(16).padStart(2, "0").toUpperCase());
          ascii += (b >= 32 && b <= 126) ? String.fromCharCode(b) : ".";
        } else {
          hex.push("  ");
          ascii += " ";
        }
      }
      lines.push(`${i.toString(16).padStart(6, "0").toUpperCase()}  ${hex.slice(0,8).join(" ")}  ${hex.slice(8).join(" ")}  |${ascii}|`);
    }
    if (bytes.length > limit) {
      lines.push(`... (${(bytes.length - limit).toLocaleString()} additional bytes in binary .cgm stream)`);
    }
    return lines.join("\n");
  }

  // --- UI State & Wiring ---
  const state = {
    pdfDoc: null,
    fileName: "sample-cad-drawing.pdf",
    currentPage: 1,
    numPages: 1,
    lastBinaryBytes: null,
    lastClearTextBytes: null,
    lastTrace: [],
    lastStats: null,
    lastScene: null,
    activeTab: "commands"
  };

  const els = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    fileNameLabel: document.getElementById("fileNameLabel"),
    fileMetaLabel: document.getElementById("fileMetaLabel"),
    selProfile: document.getElementById("selProfile"),
    selMode: document.getElementById("selMode"),
    selTextMode: document.getElementById("selTextMode"),
    selScope: document.getElementById("selScope"),
    selTolerance: document.getElementById("selTolerance"),
    statusBadge: document.getElementById("statusBadge"),
    statBytes: document.getElementById("statBytes"),
    statLines: document.getElementById("statLines"),
    statPolys: document.getElementById("statPolys"),
    statBeziers: document.getElementById("statBeziers"),
    statTexts: document.getElementById("statTexts"),
    statVerts: document.getElementById("statVerts"),
    statExtent: document.getElementById("statExtent"),
    btnPrevPage: document.getElementById("btnPrevPage"),
    btnNextPage: document.getElementById("btnNextPage"),
    pageIndicator: document.getElementById("pageIndicator"),
    pdfCanvas: document.getElementById("pdfCanvas"),
    cgmCanvas: document.getElementById("cgmCanvas"),
    pdfDimLabel: document.getElementById("pdfDimLabel"),
    pdfCoordBadge: document.getElementById("pdfCoordBadge"),
    cgmCoordBadge: document.getElementById("cgmCoordBadge"),
    chkBlueprint: document.getElementById("chkBlueprint"),
    chkNodes: document.getElementById("chkNodes"),
    inspectorContent: document.getElementById("inspectorContent"),
    btnLoadSample: document.getElementById("btnLoadSample"),
    btnDownloadBinary: document.getElementById("btnDownloadBinary"),
    btnDownloadText: document.getElementById("btnDownloadText")
  };

  function getOptions() {
    const [tolStr, colStr] = (els.selTolerance.value || "0.08_color").split("_");
    return {
      profile: els.selProfile.value,
      mode: els.selMode.value,
      textMode: els.selTextMode.value,
      scope: els.selScope.value,
      toleranceMm: parseFloat(tolStr) || 0.08,
      monochrome: colStr === "mono",
      title: state.fileName.replace(/\.pdf$/i, "")
    };
  }

  let renderBusy = false;
  let renderQueued = false;
  async function processCurrentPDF() {
    if (!state.pdfDoc) return;
    if (renderBusy) {
      renderQueued = true;
      return;
    }
    renderBusy = true;
    try {
      await _processCurrentPDFImpl();
    } finally {
      renderBusy = false;
      if (renderQueued) {
        renderQueued = false;
        await processCurrentPDF();
      }
    }
  }
  async function _processCurrentPDFImpl() {
    if (!state.pdfDoc) return;
    const opts = getOptions();
    const page = await state.pdfDoc.getPage(state.currentPage);
    const vp = page.getViewport({ scale: 1.5 });
    els.pdfCanvas.width = Math.round(vp.width);
    els.pdfCanvas.height = Math.round(vp.height);
    els.cgmCanvas.width = Math.round(vp.width);
    els.cgmCanvas.height = Math.round(vp.height);

    const pctx = els.pdfCanvas.getContext("2d");
    pctx.fillStyle = "#ffffff";
    pctx.fillRect(0, 0, els.pdfCanvas.width, els.pdfCanvas.height);
    await page.render({ canvasContext: pctx, viewport: vp }).promise;

    const scenes = [];
    if (opts.scope === "all" && state.numPages > 1) {
      for (let p = 1; p <= state.numPages; p++) {
        const pg = (p === state.currentPage) ? page : await state.pdfDoc.getPage(p);
        const sc = await extractPageScene(pg, opts, els.pdfCanvas);
        scenes.push(sc);
        if (p === state.currentPage) state.lastScene = sc;
      }
    } else {
      const sc = await extractPageScene(page, opts, els.pdfCanvas);
      scenes.push(sc);
      state.lastScene = sc;
    }

    const binResult = encodeBinaryCGM(scenes, opts);
    const txtBytes = encodeClearTextCGM(scenes, opts);
    const decoded = decodeAndValidateBinaryCGM(binResult.bytes);

    state.lastBinaryBytes = binResult.bytes;
    state.lastClearTextBytes = txtBytes;
    state.lastTrace = binResult.trace;
    state.lastStats = binResult.stats;

    const activePicIndex = (opts.scope === "all") ? (state.currentPage - 1) : 0;
    const activePic = decoded.pictures[activePicIndex] || decoded.pictures[0];
    if (activePic) {
      renderDecodedCGM(els.cgmCanvas, activePic, {
        blueprint: els.chkBlueprint.checked,
        showNodes: els.chkNodes.checked
      });
    }

    // Update Telemetry UI
    const sc = state.lastScene;
    els.pdfDimLabel.textContent = `${sc.widthPt.toFixed(1)} × ${sc.heightPt.toFixed(1)} pt (${sc.widthMm.toFixed(1)} × ${sc.heightMm.toFixed(1)} mm)`;
    const activeBytes = (opts.profile === "cleartext") ? txtBytes : binResult.bytes;
    els.statBytes.textContent = `${(activeBytes.length / 1024).toFixed(1)} KB (${activeBytes.length.toLocaleString()} B)`;
    els.statLines.textContent = binResult.stats.polylines.toLocaleString();
    els.statPolys.textContent = binResult.stats.polygons.toLocaleString();
    els.statBeziers.textContent = binResult.stats.beziers.toLocaleString();
    els.statTexts.textContent = binResult.stats.texts.toLocaleString();
    els.statVerts.textContent = binResult.stats.vertices.toLocaleString();
    els.statExtent.textContent = `${Math.round(sc.widthPt * 10)} × ${Math.round(sc.heightPt * 10)} VDC`;
    els.pageIndicator.textContent = `Page ${state.currentPage} / ${state.numPages}`;
    els.btnPrevPage.disabled = state.currentPage <= 1;
    els.btnNextPage.disabled = state.currentPage >= state.numPages;

    if (decoded.valid) {
      els.statusBadge.textContent = `● ISO 8632 VALIDATED (${decoded.pictures.length} PIC)`;
      els.statusBadge.className = "pill pill-ok";
    } else {
      els.statusBadge.textContent = `▲ CHECK ENCODING`;
    }

    updateInspector();
  }

  function updateInspector() {
    if (!state.lastBinaryBytes) return;
    if (state.activeTab === "commands") {
      els.inspectorContent.textContent = state.lastTrace.join("\n");
    } else if (state.activeTab === "hex") {
      els.inspectorContent.textContent = formatHexDump(state.lastBinaryBytes, 1024);
    } else {
      els.inspectorContent.textContent = [
        "ISO/IEC 8632 CGM CAD & Technical Illustration Compatibility Summary:",
        "  • Siemens NX (File → Import → CGM): Select 'Siemens NX / CAD (Binary v1 Polylines)' + 'Text-to-Path (CAD Vector Outlines)'.",
        "    This flattens cubic Beziers and text glyphs into 16-bit Integer VDC POLYLINE & POLYGON primitives for 100% geometric fidelity.",
        "  • Arbortext IsoDraw / CorelDESIGNER / S1000D IETM: Select 'WebCGM 2.0 / S1000D (Binary v3 Bezier)' + 'Native CGM TEXT'.",
        "  • Human Inspection / Legacy Plotters: Select 'ISO 8632-4 Clear Text (ASCII)' or click 'Download Clear-Text (.cgm)'.",
        "  • Complex Shaded / Scanned PDFs: Switch Geometry Mode to 'Full Page Raster (CELLARRAY Bitmap)'."
      ].join("\n");
    }
  }

  async function loadPdfBytes(uint8, name) {
    state.fileName = name || "document.pdf";
    els.fileNameLabel.textContent = state.fileName;
    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
    state.pdfDoc = doc;
    state.numPages = doc.numPages;
    state.currentPage = 1;
    els.fileMetaLabel.textContent = `${doc.numPages} page${doc.numPages > 1 ? "s" : ""} · ${(uint8.length / 1024).toFixed(1)} KB PDF loaded`;
    await processCurrentPDF();
  }

  function triggerDownload(bytes, suffix, mime) {
    const base = state.fileName.replace(/\.pdf$/i, "") || "drawing";
    const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}${suffix}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 500);
  }

  // Event Listeners
  els.dropzone.addEventListener("click", () => els.fileInput.click());
  els.dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    els.dropzone.classList.add("dragover");
  });
  els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragover"));
  els.dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("dragover");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      const buf = await file.arrayBuffer();
      await loadPdfBytes(new Uint8Array(buf), file.name);
    }
  });
  els.fileInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const buf = await file.arrayBuffer();
      await loadPdfBytes(new Uint8Array(buf), file.name);
    }
  });

  [els.selProfile, els.selMode, els.selTextMode, els.selScope, els.selTolerance, els.chkBlueprint, els.chkNodes].forEach(el => {
    el.addEventListener("change", () => processCurrentPDF());
  });

  els.btnPrevPage.addEventListener("click", () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      processCurrentPDF();
    }
  });
  els.btnNextPage.addEventListener("click", () => {
    if (state.currentPage < state.numPages) {
      state.currentPage++;
      processCurrentPDF();
    }
  });

  els.btnLoadSample.addEventListener("click", () => {
    if (window.SAMPLE_PDF_B64) {
      const raw = Uint8Array.from(atob(window.SAMPLE_PDF_B64), c => c.charCodeAt(0));
      loadPdfBytes(raw, "sample-cad-drawing.pdf");
    }
  });

  els.btnDownloadBinary.addEventListener("click", () => {
    if (!state.lastBinaryBytes) return;
    const opts = getOptions();
    if (opts.profile === "cleartext") {
      triggerDownload(state.lastClearTextBytes, ".cgm", "model/cgm");
    } else {
      triggerDownload(state.lastBinaryBytes, ".cgm", "model/cgm");
    }
  });

  els.btnDownloadText.addEventListener("click", () => {
    if (!state.lastClearTextBytes) return;
    triggerDownload(state.lastClearTextBytes, "-cleartext.cgm", "text/plain");
  });

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeTab = btn.dataset.tab;
      updateInspector();
    });
  });

  // Coordinate hover readouts
  function bindCoordReadout(canvas, badge, isVdc) {
    canvas.addEventListener("mousemove", (e) => {
      if (!state.lastScene) return;
      const rect = canvas.getBoundingClientRect();
      const rx = (e.clientX - rect.left) / Math.max(1, rect.width);
      const ry = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
      if (isVdc) {
        const vx = Math.round(rx * state.lastScene.widthPt * 10);
        const vy = Math.round(ry * state.lastScene.heightPt * 10);
        badge.textContent = `VDC: (${vx}, ${vy})`;
      } else {
        const mx = (rx * state.lastScene.widthMm).toFixed(1);
        const my = (ry * state.lastScene.heightMm).toFixed(1);
        badge.textContent = `Cursor: ${mx}, ${my} mm`;
      }
    });
  }
  bindCoordReadout(els.pdfCanvas, els.pdfCoordBadge, false);
  bindCoordReadout(els.cgmCanvas, els.cgmCoordBadge, true);

  // Auto-load built-in sample CAD drawing on startup
  window.addEventListener("DOMContentLoaded", () => {
    if (window.SAMPLE_PDF_B64) {
      const raw = Uint8Array.from(atob(window.SAMPLE_PDF_B64), c => c.charCodeAt(0));
      loadPdfBytes(raw, "sample-cad-drawing.pdf");
    }
  });
})();
