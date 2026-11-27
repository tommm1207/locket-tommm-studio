// Tommm Private - Auto YouTube / YT Music -> Locket Music Caption (v55)
(function () {
    var req = typeof $request !== "undefined" ? $request : null;
    if (!req || !req.url) { $done({}); return; }
    var u = String(req.url);
    var WORKER_BASE = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev";
    var VINYL_ICON_URL = "https://tommm1207.github.io/locket-tommm-studio/assets/captions_anim/vinyl_disc_icon.gif";
    var finished = false;

    function vinylBgUrl(cols, mode) {
        var c0 = String((cols && cols[0]) || "#1E1B4B").replace(/[^0-9a-fA-F]/g, "") || "1E1B4B";
        var c1 = String((cols && cols[1]) || "#4C1D95").replace(/[^0-9a-fA-F]/g, "") || "4C1D95";
        var m = mode === "wave" ? "wave" : "peek";
        return WORKER_BASE + "/studio/vinyl-bg.gif?c0=" + c0 + "&c1=" + c1 + "&mode=" + m + "&v=2";
    }

    function formatTrackLabel(title, artist, maxLen) {
        var t = String(title || "").trim();
        var a = String(artist || "").trim();
        var combined = t;
        if (a && t.indexOf(" - ") === -1 && t.indexOf(" – ") === -1 && t.toLowerCase().indexOf(a.toLowerCase()) === -1) {
            combined = t + " - " + a;
        }
        if (combined.length <= maxLen) return combined;
        var cut = combined.slice(0, maxLen - 1);
        var lastSp = cut.lastIndexOf(" ");
        if (lastSp >= Math.floor(maxLen * 0.55)) cut = cut.slice(0, lastSp);
        cut = cut.replace(/[\s(\[\-–•,|/]+$/, "").trim();
        return cut + "…";
    }

    function finishOnce(res) {
        if (finished) return;
        finished = true;
        try { $done(res || {}); } catch (_) {}
    }

    function isVidChar(b) {
        return (b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122) || b === 45 || b === 95;
    }

    function extractDocIdFromUrl(urlStr) {
        try {
            var m = String(urlStr || "").match(/[?&](?:docid|v)=([A-Za-z0-9_-]{11})(?:&|$|#)/);
            if (m && m[1]) return m[1];
        } catch (_) {}
        return "";
    }

    function extractVideoId() {
        var fromUrl = extractDocIdFromUrl(u);
        if (fromUrl) return fromUrl;
        try {
            if (typeof req.body === "string" && req.body.length > 0) {
                var m = req.body.match(/"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"/);
                if (m && m[1]) return m[1];
            }
        } catch (_) {}
        try {
            var raw = req.bodyBytes;
            if (raw && raw.byteLength >= 13) {
                var bytes = new Uint8Array(raw);
                for (var i = 0; i <= bytes.length - 13; i++) {
                    if ((bytes[i] === 0x12 || bytes[i] === 0x0a) && bytes[i + 1] === 0x0b) {
                        var ok = true;
                        var s = "";
                        for (var j = 0; j < 11; j++) {
                            var c = bytes[i + 2 + j];
                            if (!isVidChar(c)) { ok = false; break; }
                            s += String.fromCharCode(c);
                        }
                        if (ok) return s;
                    }
                }
            }
        } catch (_) {}
        return "";
    }

    var isPlaybackUrl = /^https?:\/\/(s|www|music|m)\.youtube\.com\/api\/stats\/(playback|watchtime|qoe)/i.test(u);
    var isPlayerUrl = /(youtubei\.googleapis\.com|music\.youtube\.com)\/youtubei\/v1\/(player|get_watch)/i.test(u);

    // Mode 1: Sniff YouTube / YouTube Music playback & player requests (await HTTP callback before $done)
    if (isPlaybackUrl || isPlayerUrl) {
        try {
            if (isPlaybackUrl && /[?&](?:adcontext|adformat|ad_cpn)=/i.test(u)) {
                finishOnce({});
                return;
            }
            var vid = extractVideoId();
            if (!vid || typeof $httpClient === "undefined" || typeof $persistentStore === "undefined") {
                finishOnce({});
                return;
            }
            var rawExisting = $persistentStore.read("tommm_yt_now_playing");
            if (rawExisting) {
                try {
                    var ex = JSON.parse(rawExisting);
                    if (ex && ex.videoId === vid && ex.title && (Date.now() - Number(ex.ts || 0)) < 300000) {
                        finishOnce({});
                        return;
                    }
                } catch (_) {}
            }
            var timer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 2800) : null;
            $httpClient.post({
                url: WORKER_BASE + "/studio/yt-now-playing",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: vid })
            }, function (err, resp, data) {
                try {
                    if (!err && data) {
                        var parsed = JSON.parse(data);
                        if (parsed && parsed.ok && parsed.track && parsed.track.title) {
                            $persistentStore.write(JSON.stringify(parsed.track), "tommm_yt_now_playing");
                            try { console.log("[TommmYT] Saved: " + parsed.track.title + " - " + (parsed.track.artist || "")); } catch (_) {}
                        }
                    }
                } catch (_) {}
                if (timer && typeof clearTimeout !== "undefined") clearTimeout(timer);
                finishOnce({});
            });
            return;
        } catch (_) {
            finishOnce({});
            return;
        }
    }

    function findOverlaysArrays(node, out, depth) {
        if (!node || typeof node !== "object" || depth > 5) return;
        if (Array.isArray(node.overlays)) out.push(node.overlays);
        var keys = Object.keys(node);
        for (var i = 0; i < keys.length; i++) {
            var v = node[keys[i]];
            if (v && typeof v === "object" && !Array.isArray(v)) findOverlaysArrays(v, out, depth + 1);
        }
    }

    // Mode 2: Inspect native caption:music or swap live YouTube track in-place on postMoment / createMoment
    if (/\/(?:postMoment\w*|createMoment\w*)/i.test(u)) {
        try {
            if (typeof req.body !== "string" || !req.body) { finishOnce({}); return; }
            var bodyObj = JSON.parse(req.body);
            var overlayLists = [];
            findOverlaysArrays(bodyObj, overlayLists, 0);
            if (overlayLists.length === 0) { finishOnce({}); return; }

            var changed = false;
            var replacedWith = "";
            var hasNativeMusicLog = false;
            for (var li = 0; li < overlayLists.length; li++) {
                var overlays = overlayLists[li];
                for (var k = 0; k < overlays.length; k++) {
                    var ov = overlays[k];
                    if (!ov) continue;
                    if (ov.overlay_id === "caption:music" && typeof $httpClient !== "undefined") {
                        hasNativeMusicLog = true;
                        var describeVal = function (v, d) {
                            if (d > 4 || v == null) return v === null ? "null" : typeof v;
                            if (Array.isArray(v)) return v.length ? [describeVal(v[0], d + 1)] : [];
                            if (typeof v === "object") {
                                var out = {};
                                var ks = Object.keys(v);
                                for (var x = 0; x < ks.length; x++) out[ks[x]] = describeVal(v[ks[x]], d + 1);
                                return out;
                            }
                            return typeof v;
                        };
                        var logTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 800) : null;
                        $httpClient.post({
                            url: WORKER_BASE + "/studio/music-schema-log",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ dataKeys: Object.keys(bodyObj.data || {}), overlaySchema: describeVal(ov, 0) })
                        }, function () {
                            if (logTimer && typeof clearTimeout !== "undefined") clearTimeout(logTimer);
                            finishOnce({});
                        });
                    }
                    var isYtOv = (ov.overlay_id === "caption:yt_now_playing" || ov.overlay_id === "caption:yt_vinyl_spin" || (ov.overlay_id && ov.overlay_id.indexOf("yt_now_playing") !== -1));
                    if (isYtOv && typeof $persistentStore !== "undefined") {
                        var isVinylIconMode = ov.overlay_id === "caption:yt_vinyl_spin";
                        var rawYt = $persistentStore.read("tommm_yt_now_playing");
                        if (rawYt) {
                            var track = JSON.parse(rawYt);
                            if (track && track.title && (!track.ts || (Date.now() - track.ts) < 2700000)) {
                                var bgCols = Array.isArray(track.colors) && track.colors.length >= 2 ? track.colors.slice(0, 2) : ["#1E1B4B", "#4C1D95"];
                                var displayTxt = formatTrackLabel(track.title, track.artist, 28);
                                var chosenIcon = isVinylIconMode ? VINYL_ICON_URL : (track.artworkUrl || VINYL_ICON_URL);
                                var chosenBg = vinylBgUrl(bgCols, isVinylIconMode ? "wave" : "peek");
                                ov.alt_text = displayTxt;
                                ov.data = ov.data || {};
                                if (!ov.data.type) ov.data.type = "static_content";
                                ov.data.text = displayTxt;
                                ov.data.text_color = "#FFFFFF";
                                ov.data.max_lines = 1;
                                ov.data.background = Object.assign({}, ov.data.background || {}, {
                                    colors: bgCols,
                                    image: { type: "image", data: chosenBg, source: "url" }
                                });
                                ov.data.icon = { type: "image", data: chosenIcon, source: "url" };
                                replacedWith = displayTxt;
                                try { console.log("[TommmYT] Swapped postMoment -> " + displayTxt); } catch (_) {}
                                changed = true;
                            }
                        }
                    }
                }
            }
            if (changed) {
                var updatedBody = JSON.stringify(bodyObj);
                if (typeof $httpClient !== "undefined") {
                    var swapTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({ body: updatedBody }); }, 250) : null;
                    $httpClient.post({
                        url: WORKER_BASE + "/studio/music-schema-log",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ urlPath: u.replace(/\?.*$/, "").split("/").slice(-1)[0], matched: true, replacedWith: replacedWith })
                    }, function () {
                        if (swapTimer && typeof clearTimeout !== "undefined") clearTimeout(swapTimer);
                        finishOnce({ body: updatedBody });
                    });
                    return;
                }
                finishOnce({ body: updatedBody });
                return;
            }
            if (hasNativeMusicLog) return;
        } catch (_) {}
        finishOnce({});
        return;
    }

    finishOnce({});
})();
