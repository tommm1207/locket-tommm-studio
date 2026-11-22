// Tommm Private - Delete ETag / Cache Headers (RevenueCat & Firebase Remote Config)
if (typeof $request === "undefined" || !$request || !$request.headers) {
    $done({});
} else {
    const headersToStrip = new Set([
        "x-revenuecat-etag",
        "if-none-match",
        "if-modified-since",
        "x-goog-if-none-match",
        "etag"
    ]);
    let modifiedHeaders = Object.assign({}, $request.headers);
    for (let key in modifiedHeaders) {
        if (headersToStrip.has(key.toLowerCase())) {
            modifiedHeaders[key] = undefined;
            delete modifiedHeaders[key];
        }
    }
    $done({ headers: modifiedHeaders });
}
