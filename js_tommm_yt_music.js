// Tommm Private - Auto YouTube / YT Music -> Locket Music Caption (v55)
(function () {
    var req = typeof $request !== "undefined" ? $request : null;
    if (!req || !req.url) { $done({}); return; }
    var u = String(req.url);
    var WORKER_BASE = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev";
    var VINYL_ICON_URL = "https://tommm1207.github.io/locket-tommm-studio/assets/captions_anim/vinyl_disc_icon.gif";
    var finished = false;

    function vinylBgUrl(cols) {
        var c0 = String((cols && cols[0]) || "#1E1B4B").replace(/[^0-9a-fA-F]/g, "") || "1E1B4B";
        var c1 = String((cols && cols[1]) || "#4C1D95").replace(/[^0-9a-fA-F]/g, "") || "4C1D95";
        return WORKER_BASE + "/studio/vinyl-bg.gif?c0=" + c0 + "&c1=" + c1 + "&v=1";
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

    var isPlaybackUrl = /^https?:\/\/(s|www|music)\.youtube\.com\/api\/stats\/(playback|watchtime)/i.test(u);
    var isPlayerUrl = /(youtubei\.googleapis\.com|music\.youtube\.com)\/youtubei\/v1\/(player|get_watch)/i.test(u);

    // Mode 1: Sniff YouTube / YouTube Music playback & player requests (await HTTP callback before $done)
    if (isPlaybackUrl || isPlayerUrl) {
        try {
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

    // Mode 2: Inspect native caption:music or inject YouTube track on postMomentV2
    if (u.indexOf("postMomentV2") !== -1) {
        try {
            if (typeof req.body !== "string" || !req.body) { finishOnce({}); return; }
            var bodyObj = JSON.parse(req.body);
            var overlays = bodyObj && bodyObj.data && Array.isArray(bodyObj.data.overlays) ? bodyObj.data.overlays : null;
            if (!overlays) { finishOnce({}); return; }

            var changed = false;
            var hasNativeMusicLog = false;
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
                            var displayTxt = track.artist ? (track.title + " - " + track.artist) : track.title;
                            var chosenIcon = isVinylIconMode ? VINYL_ICON_URL : (track.artworkUrl || VINYL_ICON_URL);
                            var musicData = {
                                song_title: track.title,
                                artist: track.artist || "YouTube Music",
                                preview_url: track.previewUrl || "",
                                image_url: track.artworkUrl || "",
                                artwork_url: track.artworkUrl || "",
                                apple_music_url: track.appleMusicUrl || "",
                                isrc: "",
                                platform: "apple_music"
                            };
                            overlays[k] = {
                                overlay_id: "caption:music",
                                overlay_type: "caption",
                                alt_text: displayTxt,
                                data: {
                                    type: "music",
                                    text: displayTxt,
                                    text_color: "#FFFFFF",
                                    max_lines: 1,
                                    background: {
                                        colors: bgCols,
                                        image: { type: "image", data: vinylBgUrl(bgCols), source: "url" }
                                    },
                                    icon: { type: "image", data: chosenIcon, source: "url" },
                                    payload: musicData,
                                    music: musicData
                                }
                            };
                            try { console.log("[TommmYT] Injected: " + displayTxt); } catch (_) {}
                            changed = true;
                        }
                    }
                }
            }
            if (changed) {
                finishOnce({ body: JSON.stringify(bodyObj) });
                return;
            }
            if (hasNativeMusicLog) return;
        } catch (_) {}
        finishOnce({});
        return;
    }

    finishOnce({});
})();
