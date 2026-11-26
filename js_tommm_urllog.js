// Tommm DEBUG - log mọi URL Locket gọi về worker để tìm endpoint eligibility LNN
try {
    var u = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";
    if (u && typeof $httpClient !== "undefined") {
        $httpClient.post({
            url: "https://locket-tommm-studio.khoinguyennguyen85.workers.dev/urllog",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ u: u.slice(0, 200), m: (typeof $request !== "undefined" && $request.method) || "?" })
        }, function(e, r, b) {});
    }
} catch (_) {}
$done({});
