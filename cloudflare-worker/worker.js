// =========================================================================
// Cloudflare Worker 24/7 - Locket Gold PNG Frame & 4-Cut Photobooth Engine
// - 100% Mien phi 0d, chay 24/7 tren Cloudflare Workers (By Tommm)
// - Giu nguyen khuon mat 100% bang ghep khung PNG / Photobooth 4 o (khong AI bien dang)
// - Cac filter chinh chu khac cua Locket duoc pass-through thang ve server Locket
// =========================================================================

const SIZE = 512;
const GITHUB_FRAMES_BIN_BASE =
  "https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main/assets/frames_bin";

const FRAMES_MANIFEST = {"frame_berry_days":{"is4Cut":true,"windows":[[36,39,244,244],[268,39,477,244],[36,262,244,471],[268,262,477,471]]},"frame_happy_snap":{"is4Cut":true,"windows":[[31,27,246,240],[267,28,482,240],[31,264,247,478],[267,264,482,478]]},"frame_sky_diary":{"is4Cut":true,"windows":[[34,31,244,243],[269,31,479,243],[34,267,244,474],[269,267,479,475]]},"photobooth_4cut":{"is4Cut":true,"windows":[[56,92,247,247],[265,92,456,247],[56,265,247,420],[265,265,456,420]]},"photobooth_cute":{"is4Cut":false,"windows":[[72,72,440,440]]},"pb_holo_4cut":{"is4Cut":true,"windows":[[26,30,245,246],[264,21,491,245],[31,262,246,495],[266,263,490,473]]},"pb_scrapbook_ripped_4cut":{"is4Cut":true,"windows":[[39,44,240,243],[273,43,475,243],[39,271,241,472],[274,272,475,471]]},"pb_ripped_paper_4cut":{"is4Cut":true,"windows":[[30,23,236,235],[273,23,481,234],[33,263,236,479],[276,261,484,479]]},"pb_denim_ripped_2x2":{"is4Cut":true,"windows":[[32,27,241,236],[271,28,480,235],[32,264,245,477],[274,260,483,481]]},"frame_classic_pb":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hello_kitty_pastel_ngot_ngao":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hello_kitty_hong_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_pastel_vien_ren":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hoa_pastel_vien_xanh_xinh":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_spiderred":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_khong_gian_xanh_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_ngoi_sao_hong_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_pastel_so_hai_cau":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_shin_chan":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_anh_hellokitty_v_sao":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_xanh_tay_sao_vang":{"is4Cut":false,"windows":[[0,0,512,512]]},"sinh_nhat_hello_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_y2k_silver_holo":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_denim_ripped":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_film_nostalgia":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_cortis_4cut":{"is4Cut":true,"windows":[[32,41,255,252],[258,41,480,252],[32,256,255,468],[258,256,480,473]]},"pb_cortis_v1":{"is4Cut":true,"windows":[[39,42,252,246],[263,42,474,246],[39,258,252,468],[262,258,474,468]]},"pb_cortis_v2":{"is4Cut":true,"windows":[[49,45,254,232],[258,45,463,233],[49,256,254,446],[258,256,463,446]]},"pb_ech_xanh":{"is4Cut":true,"windows":[[73,94,252,247],[258,94,437,247],[73,256,252,423],[258,256,437,423]]},"pb_galaxy":{"is4Cut":true,"windows":[[34,31,244,243],[269,31,479,243],[34,267,244,474],[269,267,479,475]]},"pb_meo_dang_yeu_4cut":{"is4Cut":true,"windows":[[47,36,254,255],[261,45,465,255],[50,257,251,474],[261,257,466,475]]},"pb_photobooth_hello_kitty":{"is4Cut":true,"windows":[[47,102,255,254],[256,102,464,254],[47,256,255,424],[256,256,464,424]]},"pb_shinchan_4cut":{"is4Cut":true,"windows":[[39,46,250,247],[259,45,471,248],[37,256,252,469],[259,256,473,469]]},"pb_strawberry":{"is4Cut":true,"windows":[[36,39,244,244],[268,39,477,244],[36,262,244,471],[268,262,477,471]]},"pb_supperman_4cut":{"is4Cut":true,"windows":[[39,28,245,248],[268,28,474,248],[39,264,245,478],[267,264,474,478]]},"pb_trung_bac_thao":{"is4Cut":true,"windows":[[70,82,255,256],[263,82,448,256],[70,270,255,450],[263,270,448,450]]},"pb_vien_hello_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_vintage":{"is4Cut":true,"windows":[[31,27,246,240],[267,28,482,240],[31,264,247,478],[267,264,482,478]]},"khung_doraemon_shinchan_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]}};

const MEMORY_IMAGES = new Map();
const FRAME_CACHE = new Map();
const PHOTOBOOTH_SESSIONS = new Map();
let LAST_DEBUG = null;

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

function corsHeaders(extra = {}) {
  return Object.assign(
    {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
    extra
  );
}

function cleanupMemory() {
  const now = Date.now();
  for (const [k, v] of MEMORY_IMAGES.entries()) {
    if (now - v.ts > 300000) MEMORY_IMAGES.delete(k);
  }
  for (const [k, v] of PHOTOBOOTH_SESSIONS.entries()) {
    if (now - v.ts > 180000) PHOTOBOOTH_SESSIONS.delete(k);
  }
  if (FRAME_CACHE.size > 16) {
    const firstKey = FRAME_CACHE.keys().next().value;
    if (firstKey) FRAME_CACHE.delete(firstKey);
  }
}

function base64ToUint8Array(base64) {
  const normalized = base64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function inflateZlib(uint8) {
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  writer.write(uint8);
  writer.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

function decodePngToRgb(pngBytes) {
  const dv = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
  let pos = 8;
  let w = 0;
  let h = 0;
  let colorType = 2;
  let palette = null;
  const idatParts = [];
  let idatLen = 0;

  while (pos + 12 <= pngBytes.length) {
    const len = dv.getUint32(pos);
    const t = dv.getUint32(pos + 4);
    if (t === 0x49484452) {
      w = dv.getUint32(pos + 8);
      h = dv.getUint32(pos + 12);
      colorType = pngBytes[pos + 17];
    } else if (t === 0x504c5445) {
      palette = pngBytes.subarray(pos + 8, pos + 8 + len);
    } else if (t === 0x49444154) {
      idatParts.push(pngBytes.subarray(pos + 8, pos + 8 + len));
      idatLen += len;
    } else if (t === 0x49454e44) {
      break;
    }
    pos += 12 + len;
  }

  const idat =
    idatParts.length === 1
      ? idatParts[0]
      : (() => {
          const joined = new Uint8Array(idatLen);
          let off = 0;
          for (const p of idatParts) {
            joined.set(p, off);
            off += p.length;
          }
          return joined;
        })();

  return inflateZlib(idat).then((raw) => {
    const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : 4;
    const stride = w * bpp;
    const rgb = new Uint8Array(w * h * 3);
    let rPos = 0;
    let prevRowStart = -1;

    for (let y = 0; y < h; y++) {
      const f = raw[rPos++];
      const rowStart = rPos;
      if (f === 1) {
        for (let x = bpp; x < stride; x++) {
          raw[rowStart + x] = (raw[rowStart + x] + raw[rowStart + x - bpp]) & 0xff;
        }
      } else if (f === 2 && prevRowStart >= 0) {
        for (let x = 0; x < stride; x++) {
          raw[rowStart + x] = (raw[rowStart + x] + raw[prevRowStart + x]) & 0xff;
        }
      } else if (f === 3) {
        for (let x = 0; x < stride; x++) {
          const a = x >= bpp ? raw[rowStart + x - bpp] : 0;
          const b = prevRowStart >= 0 ? raw[prevRowStart + x] : 0;
          raw[rowStart + x] = (raw[rowStart + x] + ((a + b) >> 1)) & 0xff;
        }
      } else if (f === 4) {
        for (let x = 0; x < stride; x++) {
          const a = x >= bpp ? raw[rowStart + x - bpp] : 0;
          const b = prevRowStart >= 0 ? raw[prevRowStart + x] : 0;
          const c = x >= bpp && prevRowStart >= 0 ? raw[prevRowStart + x - bpp] : 0;
          const p = a + b - c;
          const pa = p > a ? p - a : a - p;
          const pb = p > b ? p - b : b - p;
          const pc = p > c ? p - c : c - p;
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          raw[rowStart + x] = (raw[rowStart + x] + pr) & 0xff;
        }
      }

      let outIdx = y * w * 3;
      if (colorType === 3 && palette) {
        for (let x = 0; x < stride; x++) {
          const pi = raw[rowStart + x] * 3;
          rgb[outIdx++] = palette[pi];
          rgb[outIdx++] = palette[pi + 1];
          rgb[outIdx++] = palette[pi + 2];
        }
      } else {
        for (let x = 0; x < stride; x += bpp) {
          rgb[outIdx++] = raw[rowStart + x];
          rgb[outIdx++] = raw[rowStart + x + 1];
          rgb[outIdx++] = raw[rowStart + x + 2];
        }
      }
      prevRowStart = rowStart;
      rPos += stride;
    }

    return { w, h, rgb };
  });
}

function encodeBmpRgb24(w, h, rgb) {
  const rowStride = (w * 3 + 3) & ~3;
  const pixelBytes = rowStride * h;
  const totalSize = 54 + pixelBytes;
  const bmp = new Uint8Array(totalSize);
  const dv = new DataView(bmp.buffer);

  // BITMAPFILEHEADER
  bmp[0] = 0x42; // B
  bmp[1] = 0x4d; // M
  dv.setUint32(2, totalSize, true);
  dv.setUint32(10, 54, true);

  // BITMAPINFOHEADER
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, h, true); // positive height => bottom-up BGR rows
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 24, true);
  dv.setUint32(34, pixelBytes, true);
  dv.setUint32(38, 2835, true);
  dv.setUint32(42, 2835, true);

  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 3;
    const dstRow = 54 + y * rowStride;
    for (let x = 0; x < w; x++) {
      const si = srcRow + x * 3;
      const di = dstRow + x * 3;
      bmp[di] = rgb[si + 2];     // B
      bmp[di + 1] = rgb[si + 1]; // G
      bmp[di + 2] = rgb[si];     // R
    }
  }
  return bmp;
}

function encodeFastPngRgb(w, h, rgb) {
  const rowBytes = 1 + w * 3;
  const scan = new Uint8Array(h * rowBytes);
  for (let y = 0; y < h; y++) {
    const dstOff = y * rowBytes;
    scan[dstOff] = 0; // filter 0
    scan.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), dstOff + 1);
  }

  const len = scan.length;
  const numBlocks = Math.ceil(len / 65535);
  const zLen = 2 + len + numBlocks * 5 + 4;
  const z = new Uint8Array(zLen);
  z[0] = 0x78;
  z[1] = 0x01;
  let zOff = 2;
  let sOff = 0;
  while (sOff < len) {
    const bLen = Math.min(65535, len - sOff);
    z[zOff++] = sOff + bLen >= len ? 1 : 0;
    z[zOff++] = bLen & 0xff;
    z[zOff++] = (bLen >>> 8) & 0xff;
    const nlen = ~bLen & 0xffff;
    z[zOff++] = nlen & 0xff;
    z[zOff++] = (nlen >>> 8) & 0xff;
    z.set(scan.subarray(sOff, sOff + bLen), zOff);
    zOff += bLen;
    sOff += bLen;
  }

  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < len; ) {
    const end = Math.min(i + 5552, len);
    for (; i < end; i++) {
      s1 += scan[i];
      s2 += s1;
    }
    s1 %= 65521;
    s2 %= 65521;
  }
  const dvZ = new DataView(z.buffer);
  dvZ.setUint32(zOff, ((s2 << 16) | s1) >>> 0);

  const out = new Uint8Array(8 + 25 + 12 + zLen + 12);
  out.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  const dv = new DataView(out.buffer);
  dv.setUint32(8, 13);
  out.set([73, 72, 68, 82], 12);
  dv.setUint32(16, w);
  dv.setUint32(20, h);
  out[24] = 8;
  out[25] = 2;
  dv.setUint32(29, crc32(out.subarray(12, 29)));

  dv.setUint32(33, zLen);
  out.set([73, 68, 65, 84], 37);
  out.set(z, 41);
  dv.setUint32(41 + zLen, crc32(out.subarray(37, 41 + zLen)));

  const iendOff = 45 + zLen;
  dv.setUint32(iendOff, 0);
  out.set([73, 69, 78, 68], iendOff + 4);
  dv.setUint32(iendOff + 8, crc32(out.subarray(iendOff + 4, iendOff + 8)));
  return out;
}

function findFirstStringUrl(obj, depth = 0) {
  if (!obj || depth > 4) return null;
  if (typeof obj === "string" && obj.startsWith("http")) return obj;
  if (typeof obj === "object") {
    for (const k of [
      "imageUrl",
      "image_url",
      "inputImageUrl",
      "input_image_url",
      "photoUrl",
      "photo_url",
      "url",
      "sourceUrl",
      "source_url",
      "downloadUrl",
      "download_url",
    ]) {
      if (typeof obj[k] === "string" && obj[k].startsWith("http")) return obj[k];
    }
    for (const v of Object.values(obj)) {
      const found = findFirstStringUrl(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function getInputImageBytes(dataNode, authHeader) {
  for (const k of ["image", "imageBase64", "image_base64", "base64", "photo", "inputImage", "input_image"]) {
    const val = dataNode?.[k];
    if (typeof val === "string" && val.length > 200 && !val.startsWith("http") && !val.startsWith("gs://")) {
      const clean = val.includes(",") ? val.split(",", 2)[1] : val;
      return { bytes: base64ToUint8Array(clean), sourceUrl: null };
    }
  }

  let imgUrl = findFirstStringUrl(dataNode);
  if (!imgUrl && dataNode && typeof dataNode === "object") {
    for (const [k, v] of Object.entries(dataNode)) {
      if (typeof v === "string" && v.startsWith("gs://")) {
        const m = v.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (m) {
          imgUrl = `https://firebasestorage.googleapis.com/v0/b/${m[1]}/o/${encodeURIComponent(m[2])}?alt=media`;
        }
      } else if (typeof v === "string" && (k.includes("path") || k.includes("Path")) && v.length > 5 && !v.startsWith("http")) {
        imgUrl = `https://firebasestorage.googleapis.com/v0/b/locket-filters/o/${encodeURIComponent(v.replace(/^\/+/, ""))}?alt=media`;
      }
    }
  }

  if (imgUrl) {
    try {
      const hdrs = { "User-Agent": "Locket/1.0" };
      if (authHeader) hdrs["Authorization"] = authHeader;
      const r = await fetch(imgUrl, { headers: hdrs });
      if (r.ok) {
        return { bytes: new Uint8Array(await r.arrayBuffer()), sourceUrl: imgUrl };
      }
    } catch (_) {}
  }
  return { bytes: null, sourceUrl: imgUrl };
}

function findFrameInValue(val, depth = 0, exactOnly = false) {
  if (val == null || depth > 3) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (FRAMES_MANIFEST[trimmed]) return trimmed;
    if (!exactOnly) {
      for (const id of Object.keys(FRAMES_MANIFEST)) {
        if (trimmed.includes(id)) return id;
      }
    }
    return null;
  }
  if (Array.isArray(val)) {
    for (const item of val) {
      const found = findFrameInValue(item, depth + 1, exactOnly);
      if (found) return found;
    }
  } else if (typeof val === "object") {
    for (const v of Object.values(val)) {
      const found = findFrameInValue(v, depth + 1, exactOnly);
      if (found) return found;
    }
  }
  return null;
}

function detectFilterId(dataNode, rawBodyText) {
  const candidates = [
    dataNode?.filterId,
    dataNode?.filter_id,
    dataNode?.uid,
    dataNode?.id,
    dataNode?.prompt,
    dataNode?.filterPrompt,
    dataNode?.customPrompt,
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const trimmed = c.trim();
      if (FRAMES_MANIFEST[trimmed]) return trimmed;
    }
  }
  for (const c of candidates) {
    if (typeof c === "string") {
      for (const id of Object.keys(FRAMES_MANIFEST)) {
        if (c.includes(id)) return id;
      }
    }
  }
  const exactNested = findFrameInValue(dataNode, 0, true);
  if (exactNested) return exactNested;
  const partialNested = findFrameInValue(dataNode, 0, false);
  if (partialNested) return partialNested;
  if (rawBodyText) {
    for (const id of Object.keys(FRAMES_MANIFEST)) {
      if (rawBodyText.includes(`"${id}"`) || rawBodyText.includes(id)) return id;
    }
  }
  return null;
}

async function getFrameRgba(filterId) {
  const cached = FRAME_CACHE.get(filterId);
  if (cached) return cached;

  const res = await fetch(`${GITHUB_FRAMES_BIN_BASE}/${encodeURIComponent(filterId)}.bin`);
  if (!res.ok) throw new Error(`Failed to fetch frame bin for ${filterId}: ${res.status}`);
  const compressed = new Uint8Array(await res.arrayBuffer());
  const rgba = await inflateZlib(compressed);
  FRAME_CACHE.set(filterId, rgba);
  return rgba;
}

function drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, box) {
  const [x1, y1, x2, y2] = box;
  const winW = x2 - x1;
  const winH = y2 - y1;
  if (winW <= 0 || winH <= 0) return;

  const scale = Math.max(winW / srcW, winH / srcH);
  const cropW = winW / scale;
  const cropH = winH / scale;
  const offX = (srcW - cropW) * 0.5;
  const offY = (srcH - cropH) * 0.5;
  const invScale = 1 / scale;

  for (let dy = 0; dy < winH; dy++) {
    const sy = Math.min(srcH - 1, Math.max(0, (offY + dy * invScale) | 0));
    const dstRowOff = (y1 + dy) * SIZE * 3;
    const srcRowOff = sy * srcW * 3;
    for (let dx = 0; dx < winW; dx++) {
      const sx = Math.min(srcW - 1, Math.max(0, (offX + dx * invScale) | 0));
      const di = dstRowOff + (x1 + dx) * 3;
      const si = srcRowOff + sx * 3;
      canvasRgb[di] = srcRgb[si];
      canvasRgb[di + 1] = srcRgb[si + 1];
      canvasRgb[di + 2] = srcRgb[si + 2];
    }
  }
}

function alphaCompositeRgbaOverRgb(canvasRgb, frameRgba) {
  const totalPixels = SIZE * SIZE;
  for (let p = 0, i3 = 0, i4 = 0; p < totalPixels; p++, i3 += 3, i4 += 4) {
    const a = frameRgba[i4 + 3];
    if (a === 0) continue;
    if (a === 255) {
      canvasRgb[i3] = frameRgba[i4];
      canvasRgb[i3 + 1] = frameRgba[i4 + 1];
      canvasRgb[i3 + 2] = frameRgba[i4 + 2];
    } else {
      const invA = 255 - a;
      canvasRgb[i3] = (frameRgba[i4] * a + canvasRgb[i3] * invA + 128) >> 8;
      canvasRgb[i3 + 1] = (frameRgba[i4 + 1] * a + canvasRgb[i3 + 1] * invA + 128) >> 8;
      canvasRgb[i3 + 2] = (frameRgba[i4 + 2] * a + canvasRgb[i3 + 2] * invA + 128) >> 8;
    }
  }
}

async function decodeInputToRgb512(imgBytes, sourceUrl, origin, tempId) {
  let pngBytes = null;

  // Prefer fetching via temp MEMORY_IMAGES URL first (per plan), falling back cleanly
  if (imgBytes && imgBytes.length > 0) {
    const rawKey = `raw_${tempId}.jpg`;
    MEMORY_IMAGES.set(rawKey, { bytes: imgBytes, mimeType: "image/jpeg", ts: Date.now() });
    const rawUrl = `${origin}/ai-filters/${rawKey}`;
    try {
      const wRes = await fetch(
        `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=512&h=512&fit=cover&output=png&af=false`
      );
      if (wRes.ok) {
        const ab = await wRes.arrayBuffer();
        if (ab.byteLength > 200) pngBytes = new Uint8Array(ab);
      }
    } catch (_) {
    } finally {
      MEMORY_IMAGES.delete(rawKey);
    }
  }

  // Secondary fallback: if sourceUrl is directly accessible to wsrv.nl
  if (!pngBytes && sourceUrl && sourceUrl.startsWith("http")) {
    try {
      const wRes2 = await fetch(
        `https://wsrv.nl/?url=${encodeURIComponent(sourceUrl)}&w=512&h=512&fit=cover&output=png&af=false`
      );
      if (wRes2.ok) {
        const ab2 = await wRes2.arrayBuffer();
        if (ab2.byteLength > 200) pngBytes = new Uint8Array(ab2);
      }
    } catch (_) {}
  }

  if (pngBytes) {
    return decodePngToRgb(pngBytes);
  }
  return null;
}

async function encodeCanvasToImage(canvasRgb, origin, tempId) {
  const bmpBytes = encodeBmpRgb24(SIZE, SIZE, canvasRgb);
  const bmpKey = `bmp_${tempId}.bmp`;
  MEMORY_IMAGES.set(bmpKey, { bytes: bmpBytes, mimeType: "image/bmp", ts: Date.now() });
  const bmpUrl = `${origin}/ai-filters/${bmpKey}`;

  let finalBytes = null;
  let mimeType = "image/jpeg";
  let ext = "jpg";

  try {
    const jRes = await fetch(`https://wsrv.nl/?url=${encodeURIComponent(bmpUrl)}&output=jpg&q=92`);
    if (jRes.ok) {
      const ab = await jRes.arrayBuffer();
      const candidate = new Uint8Array(ab);
      if (candidate.length > 1000 && candidate[0] === 0xff && candidate[1] === 0xd8) {
        finalBytes = candidate;
      }
    }
  } catch (_) {
  } finally {
    MEMORY_IMAGES.delete(bmpKey);
  }

  if (!finalBytes) {
    finalBytes = encodeFastPngRgb(SIZE, SIZE, canvasRgb);
    mimeType = "image/png";
    ext = "png";
  }

  return { bytes: finalBytes, mimeType, ext };
}

async function handleStudioRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

    cleanupMemory();
    const url = new URL(request.url);

    // 1. Status endpoint
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/status")) {
      return new Response(
        JSON.stringify({
          status: "online",
          platform: "Cloudflare Workers 24/7 (PNG Frame & Photobooth Engine)",
          owner: "Tommm",
          frames_loaded: Object.keys(FRAMES_MANIFEST).length,
          cached_frames_in_ram: FRAME_CACHE.size,
          cached_images_in_ram: MEMORY_IMAGES.size,
          last_debug: LAST_DEBUG,
        }),
        { headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
      );
    }

    // 2. Serve temporary / generated images from RAM
    if (request.method === "GET" && url.pathname.startsWith("/ai-filters/")) {
      const id = url.pathname.slice("/ai-filters/".length);
      const item = MEMORY_IMAGES.get(id);
      if (item) {
        return new Response(item.bytes, {
          status: 200,
          headers: corsHeaders({
            "Content-Type": item.mimeType,
            "Cache-Control": "public, max-age=300",
          }),
        });
      }
      return new Response("Image expired", { status: 404, headers: corsHeaders() });
    }

    // 3. Handle Locket generateFilteredImage / applyFilter / createOverlay
    if (
      request.method === "POST" &&
      (url.pathname.includes("generateFilteredImage") ||
        url.pathname.includes("applyFilter") ||
        url.pathname.includes("createOverlay"))
    ) {
      const rawBodyText = await request.text();
      let bodyObj = {};
      try {
        bodyObj = JSON.parse(rawBodyText || "{}");
      } catch (_) {}

      const dataNode = bodyObj && typeof bodyObj.data === "object" ? bodyObj.data : bodyObj;
      const filterId = detectFilterId(dataNode, rawBodyText);

      // Pass-through official native Locket filters straight to Locket's servers
      if (!filterId || !FRAMES_MANIFEST[filterId]) {
        const origHost = request.headers.get("X-Locket-Orig-Host") || "api.locketcamera.com";
        LAST_DEBUG = {
          mode: "passthrough",
          pathname: url.pathname,
          origHost,
          dataKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
          preview: rawBodyText.slice(0, 300),
          ts: new Date().toISOString(),
        };
        const upstreamUrl = `https://${origHost}${url.pathname}${url.search}`;
        const fwdHeaders = new Headers();
        for (const [k, v] of request.headers.entries()) {
          const kl = k.toLowerCase();
          if (kl === "host" || kl === "content-length" || kl === "x-locket-orig-host" || kl.startsWith("cf-")) continue;
          fwdHeaders.set(k, v);
        }
        return fetch(upstreamUrl, {
          method: "POST",
          headers: fwdHeaders,
          body: rawBodyText,
        });
      }

      const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
      const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
      const tempId = crypto.randomUUID().slice(0, 12);

      const [decodedUser, frameRgba] = await Promise.all([
        decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId),
        getFrameRgba(filterId),
      ]);

      const srcRgb = decodedUser?.rgb || new Uint8Array(SIZE * SIZE * 3).fill(28);
      const srcW = decodedUser?.w || SIZE;
      const srcH = decodedUser?.h || SIZE;

      const manifest = FRAMES_MANIFEST[filterId];
      const canvasRgb = new Uint8Array(SIZE * SIZE * 3);

      if (manifest.is4Cut) {
        const userToken = authHeader.slice(-24) || dataNode?.userId || request.headers.get("CF-Connecting-IP") || "anon";
        const sessKey = `${userToken}_${filterId}`;
        let sess = PHOTOBOOTH_SESSIONS.get(sessKey);
        if (!sess || Date.now() - sess.ts > 180000 || sess.photos.length >= 4) {
          sess = { photos: [], ts: Date.now() };
        }
        sess.photos.push({ rgb: srcRgb, w: srcW, h: srcH });
        sess.ts = Date.now();
        PHOTOBOOTH_SESSIONS.set(sessKey, sess);

        const windows = manifest.windows || [];
        for (let idx = 0; idx < windows.length; idx++) {
          const photo = sess.photos[idx] || sess.photos[sess.photos.length - 1];
          drawCoverRgb(canvasRgb, photo.rgb, photo.w, photo.h, windows[idx]);
        }
      } else {
        const box = (manifest.windows && manifest.windows[0]) || [0, 0, SIZE, SIZE];
        drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, box);
      }

      alphaCompositeRgbaOverRgb(canvasRgb, frameRgba);
      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId);

      const outId = `tommm_${tempId}.${encoded.ext}`;
      MEMORY_IMAGES.set(outId, {
        bytes: encoded.bytes,
        mimeType: encoded.mimeType,
        ts: Date.now(),
      });

      LAST_DEBUG = {
        filterId,
        is4Cut: manifest.is4Cut,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
        out_mime: encoded.mimeType,
        out_bytes: encoded.bytes.length,
        ts: new Date().toISOString(),
      };

      const outUrl = `${url.origin}/ai-filters/${outId}`;
      const jsonResp = {
        result: {
          outputUrl: outUrl,
          output_url: outUrl,
          url: outUrl,
          imageUrl: outUrl,
          image_url: outUrl,
          filteredImageUrl: outUrl,
          filtered_image_url: outUrl,
          status: 200,
          is_gold: true,
          is_locked: false,
          requires_gold: false,
          unlocked: true,
          out_of_credits: false,
          ai_credits: 999999,
          data: {
            outputUrl: outUrl,
            output_url: outUrl,
            url: outUrl,
            imageUrl: outUrl,
            image_url: outUrl,
            filteredImageUrl: outUrl,
            filtered_image_url: outUrl,
          },
        },
        outputUrl: outUrl,
        output_url: outUrl,
        url: outUrl,
        imageUrl: outUrl,
        status: 200,
      };
      return new Response(JSON.stringify(jsonResp), {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }

  return new Response(JSON.stringify({ result: { status: 200, success: true }, status: 200 }), {
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
  });
}

export class StudioRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    return handleStudioRequest(request, this.env);
  }
}

export default {
  async fetch(request, env, ctx) {
    if (env && env.STUDIO) {
      const id = env.STUDIO.idFromName("tommm-global-studio");
      return env.STUDIO.get(id).fetch(request);
    }
    return handleStudioRequest(request, env);
  },
};
