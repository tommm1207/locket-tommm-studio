// =========================================================================
// Cloudflare Worker 24/7 - Locket Gold AI Filter Engine (By Tommm)
// - 100% MIỄN PHÍ 24/7 bằng Cloudflare Workers AI (img2img + flux-1-schnell)
// - Lưu ảnh tạm bằng In-Memory Map (hoạt động 100% trên *.workers.dev, không bị 404 như caches.default!)
// - Tự động dọn ảnh khỏi RAM sau 5 phút -> bảo mật tuyệt đối!
// =========================================================================

const MEMORY_IMAGES = new Map();
let LAST_PAYLOAD_KEYS = null;
let keyIndex = 0;

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

function cleanupMemoryImages() {
  const now = Date.now();
  for (const [k, v] of MEMORY_IMAGES.entries()) {
    if (now - v.ts > 300000) MEMORY_IMAGES.delete(k);
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function findFirstStringUrl(obj, depth = 0) {
  if (!obj || depth > 4) return null;
  if (typeof obj === "string" && obj.startsWith("http")) return obj;
  if (typeof obj === "object") {
    for (const k of [
      "imageUrl", "image_url", "inputImageUrl", "input_image_url",
      "photoUrl", "photo_url", "url", "sourceUrl", "source_url", "downloadUrl", "download_url"
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
  // 1. Base64 in payload
  for (const k of ["image", "imageBase64", "image_base64", "base64", "photo", "inputImage", "input_image"]) {
    const val = dataNode?.[k];
    if (typeof val === "string" && val.length > 200 && !val.startsWith("http") && !val.startsWith("gs://")) {
      const clean = val.includes(",") ? val.split(",", 2)[1] : val;
      return base64ToUint8Array(clean);
    }
  }
  // 2. HTTP URL or gs:// bucket path in payload
  let imgUrl = findFirstStringUrl(dataNode);
  if (!imgUrl && dataNode && typeof dataNode === "object") {
    for (const [k, v] of Object.entries(dataNode)) {
      if (typeof v === "string" && v.startsWith("gs://")) {
        const m = v.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (m) imgUrl = `https://firebasestorage.googleapis.com/v0/b/${m[1]}/o/${encodeURIComponent(m[2])}?alt=media`;
      } else if (typeof v === "string" && (k.includes("path") || k.includes("Path")) && v.length > 5 && !v.startsWith("http")) {
        imgUrl = `https://firebasestorage.googleapis.com/v0/b/locket-filters/o/${encodeURIComponent(v.replace(/^\/+/, ""))}?alt=media`;
      }
    }
  }
  if (imgUrl) {
    try {
      const hdrs = { "User-Agent": "Locket/1.0" };
      if (authHeader) hdrs["Authorization"] = authHeader;
      const r = await fetch(imgUrl, {
        headers: hdrs,
        cf: { image: { width: 512, height: 512, fit: "cover", quality: 75, format: "jpeg" } },
      });
      if (r.ok) {
        return new Uint8Array(await r.arrayBuffer());
      }
    } catch (_) {}
  }
  return null;
}

async function callGeminiImageEdit(env, imgBytes, promptText) {
  const rawKeys = env.GEMINI_API_KEYS || env.GEMINI_API_KEY || "";
  const keys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;

  const imgBase64 = imgBytes ? arrayBufferToBase64(imgBytes.buffer) : null;
  const models = [env.GEMINI_MODEL || "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"];

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[(keyIndex++) % keys.length];
    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const parts = [{ text: promptText }];
      if (imgBase64) parts.unshift({ inline_data: { mime_type: "image/jpeg", data: imgBase64 } });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const outParts = json?.candidates?.[0]?.content?.parts || [];
        for (const p of outParts) {
          const inline = p.inlineData || p.inline_data;
          if (inline && inline.data) {
            return {
              bytes: base64ToUint8Array(inline.data),
              mimeType: inline.mimeType || inline.mime_type || "image/jpeg",
            };
          }
        }
      }
      if (res.status === 429) break;
    }
  }
  return null;
}

async function callCloudflareFreeAI(env, imgBytes, promptText) {
  if (!env.AI) return null;
  try {
    // Only pass imgBytes to img2img if <= 180KB to avoid Worker memory limit on free tier
    if (imgBytes && imgBytes.length > 0 && imgBytes.length <= 180000) {
      const res = await env.AI.run("@cf/runwayml/stable-diffusion-v1-5-img2img", {
        prompt: promptText,
        image: Array.from(imgBytes),
        strength: 0.4,
        guidance: 7.5,
        num_steps: 10,
      });
      if (res instanceof ReadableStream) {
        const buf = await new Response(res).arrayBuffer();
        return { bytes: new Uint8Array(buf), mimeType: "image/png" };
      }
      if (res instanceof Uint8Array || res instanceof ArrayBuffer) {
        return { bytes: new Uint8Array(res), mimeType: "image/png" };
      }
    }
  } catch (e) {
    console.log("img2img fallback to flux:", e);
  }
  try {
    const fluxRes = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: promptText,
      steps: 4,
    });
    if (fluxRes && fluxRes.image) {
      return { bytes: base64ToUint8Array(fluxRes.image), mimeType: "image/jpeg" };
    }
  } catch (e) {
    console.log("flux error:", e);
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    cleanupMemoryImages();
    const url = new URL(request.url);

    // 1. Status endpoint
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/status")) {
      return new Response(
        JSON.stringify({
          status: "online",
          platform: "Cloudflare Workers 24/7 (Free Workers AI)",
          owner: "Tommm",
          cached_images_in_ram: MEMORY_IMAGES.size,
          last_payload_keys: LAST_PAYLOAD_KEYS,
        }),
        { headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
      );
    }

    // 2. Serve generated image from RAM (works 100% on *.workers.dev!)
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
      let bodyObj = {};
      try {
        bodyObj = await request.json();
      } catch (_) {}

      const dataNode = bodyObj && typeof bodyObj.data === "object" ? bodyObj.data : bodyObj;
      const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
      const imgBytes = await getInputImageBytes(dataNode, authHeader);
      LAST_PAYLOAD_KEYS = {
        keys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
        got_input_image: !!(imgBytes && imgBytes.length > 0),
        input_bytes: imgBytes ? imgBytes.length : 0,
      };
      const filterId = dataNode.filterId || dataNode.filter_id || dataNode.uid || dataNode.id || "custom_ai";
      const customPrompt =
        dataNode.prompt ||
        dataNode.filterPrompt ||
        dataNode.customPrompt ||
        `Apply a creative aesthetic filter (${filterId}) to the photo while preserving the person's face and natural lighting.`;

      let aiResult = await callGeminiImageEdit(env, imgBytes, customPrompt);
      if (!aiResult) {
        aiResult = await callCloudflareFreeAI(env, imgBytes, customPrompt);
      }

      if (!aiResult) {
        return new Response(
          JSON.stringify({ result: { status: 503, error: "AI engine temporarily unavailable" } }),
          { status: 200, headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
        );
      }

      const outId = `tommm_${crypto.randomUUID().slice(0, 12)}.jpg`;
      MEMORY_IMAGES.set(outId, {
        bytes: aiResult.bytes,
        mimeType: aiResult.mimeType,
        ts: Date.now(),
      });

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
  },
};
