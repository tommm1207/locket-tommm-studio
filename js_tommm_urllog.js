// Tommm DEBUG - log URL Locket về worker qua REWRITE (http-request $httpClient không chạy trên SR).
// Rewrite request về worker /urllog?orig=<url>, worker ghi lại rồi PROXY ngược về server gốc.
var WH = "locket-tommm-studio.khoinguyennguyen85.workers.dev";
var u = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";
if (u) {
    var newUrl = "https://" + WH + "/urllog?orig=" + encodeURIComponent(u);
    var headers = Object.assign({}, ($request && $request.headers) || {});
    var om = u.match(/^https?:\/\/([^/]+)/i);
    delete headers["Host"]; delete headers["host"];
    headers["Host"] = WH;
    headers["X-Locket-Orig-Host"] = om ? om[1] : "api.locketcamera.com";
    $done({ url: newUrl, headers: headers });
} else { $done({}); }
