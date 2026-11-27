// Tommm Private - Auto YouTube / YT Music -> Locket Music Caption
(function () {
    var req = typeof $request !== "undefined" ? $request : null;
    if (!req || !req.url) { $done({}); return; }
    var u = String(req.url);
    var WORKER_BASE = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev";

    function isVidChar(b) {
        return (b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122) || b === 45 || b === 95;
    }

    function extractVideoId() {
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
                    if (bytes[i] === 0x12 && bytes[i + 1] === 0x0b) {
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

    // Mode 1: Sniff YouTube / YouTube Music player request (0ms delay to playback)
    if (u.indexOf("youtubei.googleapis.com/youtubei/v1/player") !== -1) {
        try {
            var vid = extractVideoId();
            if (vid && typeof $httpClient !== "undefined" && typeof $persistentStore !== "undefined") {
                var lastVid = $persistentStore.read("tommm_yt_last_vid") || "";
                var lastTs = Number($persistentStore.read("tommm_yt_last_ts") || "0");
                if (vid !== lastVid || (Date.now() - lastTs) > 120000) {
                    $persistentStore.write(vid, "tommm_yt_last_vid");
                    $persistentStore.write(String(Date.now()), "tommm_yt_last_ts");
                    $httpClient.post({
                        url: WORKER_BASE + "/studio/yt-now-playing",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ videoId: vid })
                    }, function (err, resp, data) {
                        try {
                            if (!err && data) {
                                var parsed = JSON.parse(data);
                                if (parsed && parsed.ok && parsed.track) {
                                    $persistentStore.write(JSON.stringify(parsed.track), "tommm_yt_now_playing");
                                }
                            }
                        } catch (_) {}
                    });
                }
            }
        } catch (_) {}
        $done({});
        return;
    }

    // Mode 2: Inspect native caption:music or inject YouTube track on postMomentV2
    if (u.indexOf("postMomentV2") !== -1) {
        try {
            if (typeof req.body !== "string" || !req.body) { $done({}); return; }
            var bodyObj = JSON.parse(req.body);
            var overlays = bodyObj && bodyObj.data && Array.isArray(bodyObj.data.overlays) ? bodyObj.data.overlays : null;
            if (!overlays) { $done({}); return; }

            var changed = false;
            for (var k = 0; k < overlays.length; k++) {
                var ov = overlays[k];
                if (!ov) continue;
                if (ov.overlay_id === "caption:music" && typeof $httpClient !== "undefined") {
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
                    $httpClient.post({
                        url: WORKER_BASE + "/studio/music-schema-log",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dataKeys: Object.keys(bodyObj.data || {}), overlaySchema: describeVal(ov, 0) })
                    }, function () {});
                }
                if (ov.overlay_id === "caption:yt_now_playing" && typeof $persistentStore !== "undefined") {
                    var rawYt = $persistentStore.read("tommm_yt_now_playing");
                    if (rawYt) {
                        var track = JSON.parse(rawYt);
                        if (track && track.title && (!track.ts || (Date.now() - track.ts) < 2700000)) {
                            var bgCols = Array.isArray(track.colors) && track.colors.length >= 2 ? track.colors.slice(0, 2) : ["#1E1B4B", "#4C1D95"];
                            var displayTxt = track.artist ? (track.title + " - " + track.artist) : track.title;
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
                                    background: { colors: bgCols },
                                    icon: { type: "image", data: track.artworkUrl || "", source: "url" },
                                    payload: musicData,
                                    music: musicData
                                }
                            };
                            changed = true;
                        }
                    }
                }
            }
            if (changed) {
                $done({ body: JSON.stringify(bodyObj) });
                return;
            }
        } catch (_) {}
        $done({});
        return;
    }

    $done({});
})();
