// Tommm Private - Route Filter requests to Tommm's 24/7 Cloudflare Worker with proper Host header!
// Official native filters are passed through by the Worker to origHost; postMomentV2 NEVER goes through here.
const WORKER_HOST = "locket-tommm-studio.khoinguyennguyen85.workers.dev";
const WORKER_BASE = "https://" + WORKER_HOST;
const url = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";

const ROUTE_RE = /(generateFilteredImage|generateFilter|applyFilter|createFilter|createCustomFilter|generateCustomFilter|createLook|generateLook|generateCaption|ai-filters)/i;

if (url && ROUTE_RE.test(url)) {
    const origMatch = url.match(/^https?:\/\/([^/]+)/i);
    const origHost = origMatch ? origMatch[1] : "api.locketcamera.com";
    const newUrl = url.replace(/https?:\/\/(us-central1-locket-4252a\.cloudfunctions\.net|api\.locketcamera\.com)(?=\/.*(?:generateFilteredImage|generateFilter|applyFilter|createFilter|createCustomFilter|generateCustomFilter|createLook|generateLook|generateCaption|ai-filters))/i, WORKER_BASE);
    let headers = Object.assign({}, ($request && $request.headers) || {});
    delete headers["Host"];
    delete headers["host"];
    headers["Host"] = WORKER_HOST;
    headers["X-Locket-Orig-Host"] = origHost;
    $done({ url: newUrl, headers: headers });
} else {
    $done({});
}
