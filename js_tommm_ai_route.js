// Tommm Private - Forward AI Filter requests to Tommm's 24/7 Cloudflare Workers AI with proper Host header!
// Lệnh đăng ảnh thật (postMomentV2) KHÔNG BAO GIỜ đi qua đây mà đi thẳng lên server chính chủ của Locket để bảo mật 100%!
const WORKER_HOST = "locket-tommm-studio.khoinguyennguyen85.workers.dev";
const WORKER_BASE = "https://" + WORKER_HOST;
const url = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";

if (url && (url.includes("generateFilteredImage") || url.includes("applyFilter") || url.includes("createOverlay") || url.includes("ai-filters"))) {
    const newUrl = url.replace(/https?:\/\/(us-central1-locket-4252a\.cloudfunctions\.net|api\.locketcamera\.com)/i, WORKER_BASE);
    let headers = Object.assign({}, ($request && $request.headers) || {});
    delete headers["Host"];
    delete headers["host"];
    headers["Host"] = WORKER_HOST;
    $done({ url: newUrl, headers: headers });
} else {
    $done({});
}

