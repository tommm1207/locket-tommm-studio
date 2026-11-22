// =========================================================================
// Cloudflare Worker 24/7 - Locket Gold AI Filter Engine (By Tommm)
// Hỗ trợ:
// 1. Xoay vòng nhiều API Key (GEMINI_API_KEYS lưu bảo mật trong Cloudflare Secrets)
// 2. Model siêu nhanh & tiết kiệm: gemini-3.1-flash-lite-image (tự fallback gemini-3.1-flash-image)
// 3. Hỗ trợ người dùng TỰ TẠO Filter AI mới trực tiếp trong Locket (nhận prompt động)
// 4. Lưu ảnh kết quả tạm trong Cloudflare Cache API (tự động xóa sau 15 phút, bảo mật tuyệt đối!)
// =========================================================================

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

async function getInputImageBase64(dataNode) {
  for (const k of ["image", "imageBase64", "image_base64", "base64", "photo"]) {
    const val = dataNode[k];
    if (typeof val === "string" && val.length > 200 && !val.startsWith("http")) {
      return val.includes(",") ? val.split(",", 2)[1] : val;
    }
  }
  for (const k of ["imageUrl", "image_url", "url", "photoUrl", "photo_url", "inputUrl"]) {
    const val = dataNode[k];
    if (typeof val === "string" && val.startsWith("http")) {
      const r = await fetch(val, { headers: { "User-Agent": "Locket/1.0" } });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        return arrayBufferToBase64(buf);
      }
    }
  }
  return null;
}

async function callGeminiImageEdit(env, imgBase64, promptText) {
  const rawKeys = env.GEMINI_API_KEYS || env.GEMINI_API_KEY || "";
  const keys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;

  const models = [
    env.GEMINI_MODEL || "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
  ];

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[(keyIndex++) % keys.length];
    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const parts = [{ text: promptText }];
      if (imgBase64) {
        parts.unshift({
          inline_data: {
            mime_type: "image/jpeg",
            data: imgBase64,
          },
        });
      }
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
      // Nếu lỗi 429 (hết quota) thì thoát vòng model để nhảy ngay sang API Key tiếp theo!
      if (res.status === 429) break;
    }
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const cache = caches.default;

    // 1. Health check
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/status")) {
      const keysCount = (env.GEMINI_API_KEYS || env.GEMINI_API_KEY || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean).length;
      return new Response(
        JSON.stringify({
          status: "online",
          platform: "Cloudflare Workers 24/7",
          owner: "Tommm",
          model: env.GEMINI_MODEL || "gemini-3.1-flash-lite-image",
          keys_configured: keysCount,
        }),
        { headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
      );
    }

    // 2. Trả ảnh kết quả từ Cloudflare Edge Cache (tự động hết hạn sau 15 phút)
    if (request.method === "GET" && url.pathname.startsWith("/ai-filters/")) {
      const cached = await cache.match(request);
      if (cached) return cached;
      return new Response("Image expired or not found", { status: 404, headers: corsHeaders() });
    }

    // 3. Xử lý tạo ảnh Filter AI (bao gồm cả Filter có sẵn & Filter người dùng TỰ TẠO prompt mới trong Locket!)
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
      const filterId = dataNode.filterId || dataNode.filter_id || dataNode.uid || dataNode.id || "custom_ai";
      const customPrompt =
        dataNode.prompt ||
        dataNode.filterPrompt ||
        dataNode.customPrompt ||
        `Apply a creative, high quality aesthetic photo filter (${filterId}) while strictly preserving the person's identity, pose, and natural lighting.`;

      const imgBase64 = await getInputImageBase64(dataNode);
      const aiResult = await callGeminiImageEdit(env, imgBase64, customPrompt);

      if (!aiResult) {
        return new Response(
          JSON.stringify({
            result: {
              status: 429,
              error: "Gemini API keys exceeded quota or not configured in Cloudflare Secrets (GEMINI_API_KEYS).",
            },
          }),
          { status: 200, headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
        );
      }

      // Lưu ảnh tạm 15 phút vào Cloudflare Edge Cache
      const outId = `tommm_${crypto.randomUUID().slice(0, 12)}.jpg`;
      const outUrl = `${url.origin}/ai-filters/${outId}`;
      const imgResp = new Response(aiResult.bytes, {
        status: 200,
        headers: corsHeaders({
          "Content-Type": aiResult.mimeType,
          "Cache-Control": "public, max-age=900",
        }),
      });
      ctx.waitUntil(cache.put(new Request(outUrl, { method: "GET" }), imgResp));

      const jsonResp = {
        result: {
          outputUrl: outUrl,
          output_url: outUrl,
          url: outUrl,
          imageUrl: outUrl,
          image_url: outUrl,
          status: 200,
          is_gold: true,
          is_locked: false,
          requires_gold: false,
          unlocked: true,
          out_of_credits: false,
          ai_credits: 999999,
          data: { outputUrl: outUrl, url: outUrl, imageUrl: outUrl },
        },
        outputUrl: outUrl,
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
