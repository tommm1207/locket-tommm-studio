// Tommm Private - Forward AI Filter requests (generateFilteredImage / createOverlay / applyFilter) to Tommm's 24/7 Cloudflare Workers AI!
// Lệnh đăng ảnh thật (postMomentV2) KHÔNG BAO GIỜ đi qua đây mà đi thẳng lên server chính chủ của Locket để bảo mật 100%!
const WORKER_BASE = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev";
const url = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";

if (url && (url.includes("generateFilteredImage") || url.includes("applyFilter") || url.includes("createOverlay") || url.includes("ai-filters"))) {
    const newUrl = url.replace(/https?:\/\/us-central1-locket-4252a\.cloudfunctions\.net/i, WORKER_BASE);
    $done({ url: newUrl });
} else {
    $done({});
}
