// Tommm Private - Smart ETag Stripper (Always strip RevenueCat; strip Firebase RC only until v48 live snapshot is applied)
if (typeof $request === "undefined" || !$request || !$request.headers) {
    $done({});
} else {
    var reqUrl = String($request.url || "");
    var isFirebaseRc = reqUrl.indexOf("firebaseremoteconfig.googleapis.com") !== -1;
    var appliedVer = "";
    try {
        if (typeof $persistentStore !== "undefined") {
            appliedVer = $persistentStore.read("tommm_rc_applied_ver") || "";
        }
    } catch (_) {}
    if (isFirebaseRc && appliedVer === "48") {
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
}
