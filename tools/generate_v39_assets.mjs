import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = "D:\\Locket_Gold_Tommm";
const ANIM_DIR = path.join(ROOT, "assets", "captions_anim");
const ICONS_DIR = path.join(ROOT, "assets", "filters_v2");

fs.mkdirSync(ANIM_DIR, { recursive: true });
fs.mkdirSync(ICONS_DIR, { recursive: true });

// =========================================================================
// 1. CRC32 + PNG Encoder (128x128 RGBA)
// =========================================================================
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function encodePngRgba(w, h, rgba) {
  const rowLen = 1 + w * 4;
  const raw = Buffer.allocUnsafe(h * rowLen);
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0;
    rgba.copy(raw, y * rowLen + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const makeChunk = (typeStr, dataBuf) => {
    const typeBuf = Buffer.from(typeStr, "ascii");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(dataBuf.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, dataBuf])), 0);
    return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
  };
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", idat),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

// =========================================================================
// 2. GIF89a Multi-Frame Looping Encoder (LZW)
// =========================================================================
function lzwEncode(indices, minCodeSize = 8) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  let maxTable = 1 << codeSize;
  let dict = new Map();
  const resetDict = () => {
    dict = new Map();
    for (let i = 0; i < clearCode; i++) dict.set(String(i), i);
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
    maxTable = 1 << codeSize;
  };
  resetDict();

  const outBytes = [];
  let bitBuf = 0;
  let bitCount = 0;
  const emit = (code) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      outBytes.push(bitBuf & 0xff);
      bitBuf >>>= 8;
      bitCount -= 8;
    }
  };

  emit(clearCode);
  let prefix = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const next = prefix + "," + k;
    if (dict.has(next)) {
      prefix = next;
    } else {
      emit(dict.get(prefix));
      if (nextCode < 4096) {
        dict.set(next, nextCode++);
        if (nextCode > maxTable && codeSize < 12) {
          codeSize++;
          maxTable = 1 << codeSize;
        }
      } else {
        emit(clearCode);
        resetDict();
      }
      prefix = String(k);
    }
  }
  emit(dict.get(prefix));
  emit(eoiCode);
  if (bitCount > 0) outBytes.push(bitBuf & 0xff);

  // Split into <=255-byte sub-blocks
  const blocks = [minCodeSize];
  for (let i = 0; i < outBytes.length; i += 255) {
    const chunk = outBytes.slice(i, i + 255);
    blocks.push(chunk.length, ...chunk);
  }
  blocks.push(0); // block terminator
  return Buffer.from(blocks);
}

function encodeGif89a(w, h, palette256, framesIndices, delayCs = 9) {
  const parts = [];
  // Header + Logical Screen Descriptor (global color table: 256 colors -> packed 0xF7)
  const lsd = Buffer.alloc(13);
  lsd.write("GIF89a", 0, "ascii");
  lsd.writeUInt16LE(w, 6);
  lsd.writeUInt16LE(h, 8);
  lsd[10] = 0xf7; // 1 (GCT) | 111 (8-bit) | 0 | 111 (256 colors)
  lsd[11] = 0;
  lsd[12] = 0;
  parts.push(lsd);

  // Global Color Table (768 bytes)
  const gct = Buffer.alloc(768);
  for (let i = 0; i < 256; i++) {
    const c = palette256[i] || [0, 0, 0];
    gct[i * 3] = c[0];
    gct[i * 3 + 1] = c[1];
    gct[i * 3 + 2] = c[2];
  }
  parts.push(gct);

  // NETSCAPE2.0 infinite loop Application Extension
  parts.push(
    Buffer.from([
      0x21, 0xff, 0x0b,
      ...Buffer.from("NETSCAPE2.0", "ascii"),
      0x03, 0x01, 0x00, 0x00, 0x00,
    ])
  );

  for (const frameIdx of framesIndices) {
    // Graphic Control Extension (delay in 1/100 sec)
    const gce = Buffer.alloc(8);
    gce[0] = 0x21;
    gce[1] = 0xf9;
    gce[2] = 0x04;
    gce[3] = 0x00;
    gce.writeUInt16LE(delayCs, 4);
    gce[6] = 0x00;
    gce[7] = 0x00;
    parts.push(gce);

    // Image Descriptor
    const imgDesc = Buffer.alloc(10);
    imgDesc[0] = 0x2c;
    imgDesc.writeUInt16LE(0, 1);
    imgDesc.writeUInt16LE(0, 3);
    imgDesc.writeUInt16LE(w, 5);
    imgDesc.writeUInt16LE(h, 7);
    imgDesc[9] = 0x00;
    parts.push(imgDesc);

    parts.push(lzwEncode(frameIdx, 8));
  }

  parts.push(Buffer.from([0x3b])); // Trailer
  return Buffer.concat(parts);
}

// Color helpers
function hexToRgb(hex) {
  const s = hex.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function lerpColor(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

// =========================================================================
// 3. Build 8 Animated GIF Caption Backgrounds (240x64, 12 frames, 90ms)
// =========================================================================
function buildAnimGifSpec(name, c1Hex, c2Hex, c3Hex, drawParticleFn) {
  const W = 180;
  const H = 48;
  const FRAMES = 10;
  const c1 = hexToRgb(c1Hex);
  const c2 = hexToRgb(c2Hex);
  const c3 = hexToRgb(c3Hex);

  // Palette (64-step gradient + 32-step highlight -> fast crisp LZW < 35KB)
  const palette = [];
  for (let i = 0; i < 192; i++) {
    const q = Math.floor(i / 6) * 6;
    palette.push(lerpColor(c1, c2, q / 191));
  }
  for (let i = 0; i < 64; i++) {
    const q = Math.floor(i / 4) * 4;
    palette.push(lerpColor(c3, [255, 255, 255], q / 63));
  }

  const frames = [];
  for (let f = 0; f < FRAMES; f++) {
    const idx = new Uint8Array(W * H);
    const phase = f / FRAMES;
    // Clean banded gradient base (compresses tightly in GIF LZW)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const g = (x / W) * 0.72 + (y / H) * 0.28;
        const gi = Math.max(0, Math.min(191, Math.round(g * 31) * 6));
        idx[y * W + x] = gi;
      }
    }

    const blendGlow = (px, py, radius, strength) => {
      const rInt = Math.ceil(radius);
      const x0 = Math.max(0, Math.floor(px - rInt));
      const x1 = Math.min(W - 1, Math.ceil(px + rInt));
      const y0 = Math.max(0, Math.floor(py - rInt));
      const y1 = Math.min(H - 1, Math.ceil(py + rInt));
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const dist = Math.hypot(xx - px, yy - py);
          if (dist <= radius) {
            const v = Math.pow(1 - dist / radius, 1.35) * strength;
            const target = Math.min(255, Math.max(192, Math.round(192 + v * 63)));
            if (target > idx[yy * W + xx]) idx[yy * W + xx] = target;
          }
        }
      }
    };

    const drawStar = (cx, cy, r, strength) => {
      for (let d = -r; d <= r; d++) {
        const a = strength * (1 - Math.abs(d) / (r + 1));
        const px = Math.round(cx + d);
        const py = Math.round(cy);
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const val = Math.min(255, Math.round(192 + a * 63));
          if (val > idx[py * W + px]) idx[py * W + px] = val;
        }
        const qx = Math.round(cx);
        const qy = Math.round(cy + d);
        if (qx >= 0 && qx < W && qy >= 0 && qy < H) {
          const val = Math.min(255, Math.round(192 + a * 63));
          if (val > idx[qy * W + qx]) idx[qy * W + qx] = val;
        }
      }
      blendGlow(cx, cy, Math.max(2, r * 0.65), strength);
    };

    drawParticleFn({ W, H, f, FRAMES, phase, idx, blendGlow, drawStar });
    frames.push(idx);
  }

  const gifBuf = encodeGif89a(W, H, palette, frames, 9);
  const outPath = path.join(ANIM_DIR, name);
  fs.writeFileSync(outPath, gifBuf);
  return { name, bytes: gifBuf.length };
}

const animResults = [
  buildAnimGifSpec("snow_blue.gif", "#0F3D7A", "#2E90FA", "#BAE6FD", ({ W, H, phase, blendGlow, drawStar }) => {
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 37 + 15) % W) + Math.sin(phase * Math.PI * 2 + i) * 5;
      const sy = ((i * 19 + phase * H * (1 + (i % 2))) % H);
      if (i % 3 === 0) drawStar(sx, sy, 4, 0.95);
      else blendGlow(sx, sy, 2.5 + (i % 2), 0.85);
    }
  }),
  buildAnimGifSpec("snow_purple.gif", "#2A1459", "#7C3AED", "#E9D5FF", ({ W, H, phase, blendGlow, drawStar }) => {
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 41 + 10) % W) + Math.cos(phase * Math.PI * 2 + i) * 6;
      const sy = ((i * 23 + phase * H) % H);
      if (i % 2 === 0) drawStar(sx, sy, 4, 0.95);
      else blendGlow(sx, sy, 3.0, 0.8);
    }
  }),
  buildAnimGifSpec("heart_pink.gif", "#9D174D", "#F472B6", "#FBCFE8", ({ W, H, phase, blendGlow, drawStar }) => {
    for (let i = 0; i < 12; i++) {
      const hx = ((i * 43 + 18) % (W - 16)) + 8;
      const hy = H - (((i * 29 + phase * H) % (H + 10)) - 5);
      const pulse = 0.75 + 0.25 * Math.sin(phase * Math.PI * 2 + i);
      blendGlow(hx - 2.2, hy - 1.5, 3.2, pulse);
      blendGlow(hx + 2.2, hy - 1.5, 3.2, pulse);
      blendGlow(hx, hy + 1.5, 3.4, pulse);
      if (i % 3 === 0) drawStar((hx + 12) % W, (hy + 14) % H, 3, 0.9);
    }
  }),
  buildAnimGifSpec("sparkle_red.gif", "#7F1D1D", "#EF4444", "#FDE047", ({ W, H, phase, drawStar, blendGlow }) => {
    for (let i = 0; i < 16; i++) {
      const sx = (i * 31 + 14) % W;
      const sy = (i * 17 + 9) % H;
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(phase * Math.PI * 2 + i * 0.9));
      drawStar(sx, sy, Math.round(2 + tw * 3), tw);
      if (i % 4 === 0) blendGlow(sx, sy, 5, tw * 0.7);
    }
  }),
  buildAnimGifSpec("gold_shimmer.gif", "#291C06", "#B45309", "#FEF08A", ({ W, H, phase, idx, drawStar }) => {
    // Sweeping shimmer band
    const bandCenter = phase * (W + 80) - 40;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const d = Math.abs(x - y * 0.9 - bandCenter);
        if (d < 22) {
          const v = (1 - d / 22) * 0.85;
          const val = Math.min(255, Math.round(192 + v * 63));
          if (val > idx[y * W + x]) idx[y * W + x] = val;
        }
      }
    }
    for (let i = 0; i < 10; i++) {
      const sx = (i * 47 + 20) % W;
      const sy = (i * 19 + 11) % H;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(phase * Math.PI * 2 + i));
      drawStar(sx, sy, 4, tw);
    }
  }),
  buildAnimGifSpec("neon_cyber.gif", "#0F172A", "#6D28D9", "#22D3EE", ({ W, H, phase, idx, drawStar, blendGlow }) => {
    for (let x = 0; x < W; x++) {
      const wy = H * 0.5 + Math.sin(x * 0.06 + phase * Math.PI * 2) * 16;
      blendGlow(x, wy, 4.5, 0.85);
      const wy2 = H * 0.5 + Math.cos(x * 0.05 - phase * Math.PI * 2) * 14;
      blendGlow(x, wy2, 3.0, 0.65);
    }
    for (let i = 0; i < 8; i++) {
      drawStar((i * 53 + 12) % W, (i * 21 + 8) % H, 3, 0.9);
    }
  }),
  buildAnimGifSpec("sakura_fall.gif", "#831843", "#F9A8D4", "#FFF1F2", ({ W, H, phase, blendGlow, drawStar }) => {
    for (let i = 0; i < 16; i++) {
      const sx = (i * 39 + phase * 60 + Math.sin(phase * Math.PI * 2 + i) * 8) % W;
      const sy = (i * 23 + phase * H) % H;
      blendGlow(sx, sy, 3.2, 0.92);
      blendGlow(sx + 2, sy + 1, 2.2, 0.8);
      if (i % 4 === 0) drawStar(sx, sy, 3, 0.85);
    }
  }),
  buildAnimGifSpec("fireworks_night.gif", "#090D26", "#312E81", "#F472B6", ({ W, H, phase, drawStar, blendGlow }) => {
    const bursts = [
      { cx: 52, cy: 24, off: 0.0 },
      { cx: 125, cy: 36, off: 0.33 },
      { cx: 192, cy: 22, off: 0.66 },
    ];
    for (const b of bursts) {
      const local = (phase + b.off) % 1;
      const rad = 4 + local * 18;
      const alpha = Math.max(0.15, 1 - local * 0.85);
      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * Math.PI * 2;
        const px = b.cx + Math.cos(ang) * rad;
        const py = b.cy + Math.sin(ang) * rad * 0.85;
        blendGlow(px, py, 2.6, alpha);
      }
      drawStar(b.cx, b.cy, 4, alpha);
    }
  }),
];

// =========================================================================
// 4. Build 63 Crisp 128x128 PNG Filter Icons
// =========================================================================
function renderIconPng(spec) {
  const S = 128;
  const rgba = Buffer.alloc(S * S * 4);
  const c0 = hexToRgb(spec.c0);
  const c1 = hexToRgb(spec.c1);
  const fg = [255, 255, 255];

  const setPx = (x, y, col, a = 255) => {
    if (x < 0 || x >= S || y < 0 || y >= S) return;
    const i = (y * S + x) * 4;
    if (a >= 255) {
      rgba[i] = col[0]; rgba[i + 1] = col[1]; rgba[i + 2] = col[2]; rgba[i + 3] = 255;
    } else {
      const t = a / 255;
      rgba[i] = Math.round(rgba[i] * (1 - t) + col[0] * t);
      rgba[i + 1] = Math.round(rgba[i + 1] * (1 - t) + col[1] * t);
      rgba[i + 2] = Math.round(rgba[i + 2] * (1 - t) + col[2] * t);
      rgba[i + 3] = Math.min(255, rgba[i + 3] + a);
    }
  };

  // Gradient rounded-circle icon base + glossy border ring
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x - 63.5;
      const dy = y - 63.5;
      const dist = Math.hypot(dx, dy);
      if (dist > 61) continue;
      const t = (x / S) * 0.45 + (y / S) * 0.55;
      const base = lerpColor(c0, c1, t);
      const edgeAlpha = dist > 59 ? Math.round((61 - dist) * 127) : 255;
      setPx(x, y, base, edgeAlpha);
      if (dist >= 54 && dist <= 58.5) {
        setPx(x, y, fg, 95);
      }
      // Subtle top gloss
      if (dy < -10 && dist < 52) {
        const gloss = Math.max(0, (1 - Math.abs(dy + 34) / 24)) * 38;
        setPx(x, y, fg, Math.round(gloss));
      }
    }
  }

  const drawCircle = (cx, cy, r, col = fg, a = 240) => {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) <= r) setPx(x, y, col, a);
      }
    }
  };
  const drawRing = (cx, cy, rIn, rOut, col = fg, a = 245) => {
    for (let y = Math.floor(cy - rOut); y <= Math.ceil(cy + rOut); y++) {
      for (let x = Math.floor(cx - rOut); x <= Math.ceil(cx + rOut); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= rIn && d <= rOut) setPx(x, y, col, a);
      }
    }
  };
  const drawRect = (x0, y0, x1, y1, col = fg, a = 235) => {
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) setPx(x, y, col, a);
    }
  };

  // Distinct crisp emblem per icon kind
  if (spec.kind === "ai") {
    // 4-point sparkle + mini sparkle
    for (let y = 26; y <= 102; y++) {
      for (let x = 26; x <= 102; x++) {
        const dx = Math.abs(x - 64);
        const dy = Math.abs(y - 64);
        const d = Math.pow(dx / 30, 0.55) + Math.pow(dy / 30, 0.55);
        if (d <= 1.0) setPx(x, y, fg, 245);
      }
    }
    drawCircle(92, 36, 5, fg, 230);
  } else if (spec.kind === "cam") {
    // Camera silhouette + lens ring
    drawRect(28, 42, 100, 90, fg, 235);
    drawRect(44, 34, 72, 42, fg, 235);
    drawCircle(64, 66, 17, c1, 255);
    drawRing(64, 66, 11, 14, fg, 250);
    drawCircle(90, 50, 4, hexToRgb("#FDE047"), 255);
  } else if (spec.kind === "beauty") {
    // Glossy beauty drop / twin stars + ring
    drawRing(64, 64, 24, 28, fg, 220);
    for (let y = 38; y <= 90; y++) {
      for (let x = 38; x <= 90; x++) {
        const dx = Math.abs(x - 64);
        const dy = Math.abs(y - 64);
        if (Math.pow(dx / 22, 0.55) + Math.pow(dy / 22, 0.55) <= 1.0) setPx(x, y, fg, 245);
      }
    }
    drawCircle(42, 44, 4, fg, 210);
    drawCircle(86, 84, 4, fg, 210);
  } else if (spec.kind === "warp") {
    // Comedy wavy smiley face
    drawRing(64, 64, 26, 31, fg, 245);
    drawCircle(52, 55, 6, fg, 245);
    drawCircle(76, 55, 6, fg, 245);
    for (let x = 46; x <= 82; x++) {
      const y = 76 + Math.sin((x - 46) * 0.28) * 5;
      drawCircle(x, y, 2.5, fg, 245);
    }
  } else if (spec.kind === "tool") {
    // Viewfinder crosshairs + clock/aperture ring
    drawRing(64, 64, 22, 27, fg, 245);
    drawRect(62, 30, 66, 46, fg, 245);
    drawRect(62, 82, 66, 98, fg, 245);
    drawRect(30, 62, 46, 66, fg, 245);
    drawRect(82, 62, 98, 66, fg, 245);
    drawCircle(64, 64, 7, hexToRgb("#EF4444"), 255);
  }

  const outPath = path.join(ICONS_DIR, `${spec.id}.png`);
  fs.writeFileSync(outPath, encodePngRgba(S, S, rgba));
  return spec.id;
}

const ICON_SPECS = [
  // Tools / Special FX (4)
  { id: "clock_weekday_overlay", c0: "#1E3A8A", c1: "#38BDF8", kind: "tool" },
  { id: "portrait_bokeh", c0: "#7C2D12", c1: "#F59E0B", kind: "tool" },
  { id: "cctv_camera", c0: "#064E3B", c1: "#10B981", kind: "tool" },
  { id: "triple_clone", c0: "#4C1D95", c1: "#EC4899", kind: "tool" },

  // Meme AI (5)
  { id: "ai_cong_chua_phong_tro", c0: "#BE185D", c1: "#F9A8D4", kind: "ai" },
  { id: "ai_hoang_tu_ktx", c0: "#1D4ED8", c1: "#60A5FA", kind: "ai" },
  { id: "ai_lop_truong", c0: "#0F766E", c1: "#2DD4BF", kind: "ai" },
  { id: "ai_di_phu_ho", c0: "#B45309", c1: "#FBBF24", kind: "ai" },
  { id: "ai_ve_que_nuoi_ca", c0: "#15803D", c1: "#4ADE80", kind: "ai" },

  // Trend Hot AI (5)
  { id: "ai_figure_1_7", c0: "#EA580C", c1: "#FDBA74", kind: "ai" },
  { id: "ai_action_figure_box", c0: "#0284C7", c1: "#38BDF8", kind: "ai" },
  { id: "ai_lego_figure", c0: "#D97706", c1: "#FDE047", kind: "ai" },
  { id: "ai_cartoon_3d", c0: "#7E22CE", c1: "#C084FC", kind: "ai" },
  { id: "ai_polaroid_string", c0: "#9A3412", c1: "#FB923C", kind: "ai" },

  // Shipper & Job AI (4)
  { id: "ai_shipper_giao_hang", c0: "#DC2626", c1: "#FB923C", kind: "ai" },
  { id: "ai_grab_driver", c0: "#15803D", c1: "#22C55E", kind: "ai" },
  { id: "ai_xanh_sm", c0: "#0E7490", c1: "#22D3EE", kind: "ai" },
  { id: "ai_bac_si", c0: "#0369A1", c1: "#7DD3FC", kind: "ai" },

  // Luxury AI (5)
  { id: "ai_tong_tai", c0: "#111827", c1: "#4B5563", kind: "ai" },
  { id: "ai_phu_ba", c0: "#78350F", c1: "#F59E0B", kind: "ai" },
  { id: "ai_thieu_gia", c0: "#991B1B", c1: "#EF4444", kind: "ai" },
  { id: "ai_du_thuyen", c0: "#1E40AF", c1: "#38BDF8", kind: "ai" },
  { id: "ai_old_money", c0: "#57534E", c1: "#D6D3D1", kind: "ai" },

  // Beauty & Costume AI (8)
  { id: "ai_makeup_idol", c0: "#DB2777", c1: "#F472B6", kind: "ai" },
  { id: "ai_trang_diem_duyen", c0: "#9F1239", c1: "#FB7185", kind: "ai" },
  { id: "ai_doi_kieu_toc", c0: "#7C3AED", c1: "#A78BFA", kind: "ai" },
  { id: "ai_doi_mau_toc", c0: "#0D9488", c1: "#5EEAD4", kind: "ai" },
  { id: "ai_cosplay_wibu", c0: "#4338CA", c1: "#818CF8", kind: "ai" },
  { id: "ai_hau_gai", c0: "#1E293B", c1: "#F43F5E", kind: "ai" },
  { id: "ai_hoang_thuong", c0: "#B45309", c1: "#FDE047", kind: "ai" },
  { id: "ai_idol_kpop", c0: "#9333EA", c1: "#F472B6", kind: "ai" },

  // Warp Comedy (10)
  { id: "warp_big_head", c0: "#2563EB", c1: "#60A5FA", kind: "warp" },
  { id: "warp_tiny_face", c0: "#7C3AED", c1: "#C084FC", kind: "warp" },
  { id: "warp_alien_vline", c0: "#059669", c1: "#34D399", kind: "warp" },
  { id: "warp_hamster", c0: "#D97706", c1: "#FBBF24", kind: "warp" },
  { id: "warp_bug_eyes", c0: "#DC2626", c1: "#F87171", kind: "warp" },
  { id: "warp_wide_mouth", c0: "#DB2777", c1: "#F472B6", kind: "warp" },
  { id: "warp_chubby", c0: "#EA580C", c1: "#FDBA74", kind: "warp" },
  { id: "warp_gigachad", c0: "#334155", c1: "#94A3B8", kind: "warp" },
  { id: "warp_swirl", c0: "#4F46E5", c1: "#38BDF8", kind: "warp" },
  { id: "warp_melt", c0: "#0D9488", c1: "#A3E635", kind: "warp" },

  // Retro & Film LUTs (12)
  { id: "dazz_cpm35", c0: "#92400E", c1: "#F59E0B", kind: "cam" },
  { id: "dazz_classic_u", c0: "#1F2937", c1: "#6B7280", kind: "cam" },
  { id: "dazz_fqs", c0: "#065F46", c1: "#34D399", kind: "cam" },
  { id: "dazz_inst_c", c0: "#9D174D", c1: "#F472B6", kind: "cam" },
  { id: "dazz_grd", c0: "#111827", c1: "#D1D5DB", kind: "cam" },
  { id: "lut_kodak_portra", c0: "#B45309", c1: "#FDE68A", kind: "cam" },
  { id: "lut_fuji_superia", c0: "#047857", c1: "#6EE7B7", kind: "cam" },
  { id: "lut_kodak_gold", c0: "#CA8A04", c1: "#FEF08A", kind: "cam" },
  { id: "lut_cinestill_800t", c0: "#1E3A8A", c1: "#F43F5E", kind: "cam" },
  { id: "lut_kodak_am", c0: "#9A3412", c1: "#FDBA74", kind: "cam" },
  { id: "lut_fuji_chrome", c0: "#0F766E", c1: "#99F6E4", kind: "cam" },
  { id: "lut_vintage", c0: "#78350F", c1: "#D6D3D1", kind: "cam" },

  // Beauty & Skin Tone LUTs (10)
  { id: "lut_iphone_beauty", c0: "#0284C7", c1: "#BAE6FD", kind: "beauty" },
  { id: "lut_film_han", c0: "#BE185D", c1: "#FBCFE8", kind: "beauty" },
  { id: "lut_trang_sua", c0: "#9333EA", c1: "#E9D5FF", kind: "beauty" },
  { id: "lut_phim_nhat", c0: "#0F766E", c1: "#CCFBF1", kind: "beauty" },
  { id: "lut_hong_dao", c0: "#E11D48", c1: "#FECDD3", kind: "beauty" },
  { id: "lut_matcha", c0: "#16A34A", c1: "#BBF7D0", kind: "beauty" },
  { id: "lut_ulzzang_pink", c0: "#EC4899", c1: "#FCE7F3", kind: "beauty" },
  { id: "lut_nang_ban_mai", c0: "#EA580C", c1: "#FEF3C7", kind: "beauty" },
  { id: "lut_tone_lanh", c0: "#2563EB", c1: "#DBEAFE", kind: "beauty" },
  { id: "lut_kem_bo", c0: "#D97706", c1: "#FEF9C3", kind: "beauty" },
];

for (const spec of ICON_SPECS) renderIconPng(spec);

console.log(`Generated ${animResults.length} animated GIFs:`, animResults);
console.log(`Generated ${ICON_SPECS.length} crisp PNG filter icons in ${ICONS_DIR}`);
