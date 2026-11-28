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
        return WORKER_BASE + "/studio/vinyl-bg.gif?c0=" + c0 + "&c1=" + c1 + "&mode=" + m + "&v=4";
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
    var isSpotifyUrl = /^https?:\/\/(spclient\.wg\.spotify\.com|[a-z0-9-]+-spclient\.spotify\.com(?::443)?)\/.*(color-lyrics|canvaz|connect-state|metadata\/4\/track|spotify(?::|%3a)track(?::|%3a)|\/track\/)/i.test(u);
    var amMatch = u.match(/^https?:\/\/amp-api\.music\.apple\.com\/v1\/catalog\/([a-z]{2})\/songs(?:\/(\d+)|\?(?:.*&)?ids=(\d+)(?:&|$))/i);

    function isAlnumChar(b) {
        return (b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122);
    }

    function extractSpotifyId() {
        var mu = u.match(/(?:spotify(?::|%3A)track(?::|%3A)|\/track\/)([A-Za-z0-9]{22})/i);
        if (mu && mu[1]) return mu[1];
        try {
            if (typeof req.body === "string" && req.body.length > 0) {
                var mbCur = req.body.match(/"(?:currently_playing_item|track)"[^{}]{0,40}\{[^}]{0,280}spotify(?::|%3A)track(?::|%3A)([A-Za-z0-9]{22})/i);
                if (mbCur && mbCur[1]) return mbCur[1];
                var mb = req.body.match(/(?:spotify(?::|%3A)track(?::|%3A)|\/track\/)([A-Za-z0-9]{22})/i);
                if (mb && mb[1]) return mb[1];
            }
        } catch (_) {}
        try {
            var rawSp = req.bodyBytes;
            if (rawSp && rawSp.byteLength >= 36) {
                var bytes = new Uint8Array(rawSp);
                var pfx = "spotify:track:";
                for (var i = 0; i <= bytes.length - 36; i++) {
                    var okPfx = true;
                    for (var p = 0; p < 14; p++) {
                        if (bytes[i + p] !== pfx.charCodeAt(p)) { okPfx = false; break; }
                    }
                    if (!okPfx) continue;
                    var spId = "";
                    var okId = true;
                    for (var k = 0; k < 22; k++) {
                        var ch = bytes[i + 14 + k];
                        if (!isAlnumChar(ch)) { okId = false; break; }
                        spId += String.fromCharCode(ch);
                    }
                    if (okId) return spId;
                }
            }
        } catch (_) {}
        return "";
    }

    function simpleNorm(s) {
        return String(s || "")
            .toLowerCase()
            .replace(/[^a-z0-9\u00c0-\u1ef9]+/g, " ")
            .replace(/^\s+|\s+$/g, "");
    }

    function titleTokenMatch(qTitle, candTitle) {
        var q = simpleNorm(qTitle);
        var c = simpleNorm(candTitle);
        if (!q || !c) return true;
        if (c.indexOf(q) !== -1 || q.indexOf(c) !== -1) return true;
        var words = q.split(/\s+/);
        for (var i = 0; i < words.length; i++) {
            if (words[i].length >= 2 && c.indexOf(words[i]) !== -1) return true;
        }
        return false;
    }

    function enrichTrackOnDevice(track, doneCb, maxWaitMs) {
        if (!track || !track.title || typeof $httpClient === "undefined") {
            doneCb(track);
            return;
        }
        var hasAppleUrl = !!(track.appleMusicUrl && String(track.appleMusicUrl).indexOf("music.apple.com") !== -1);
        var hasItunesPreview = !!(track.previewUrl && String(track.previewUrl).indexOf("itunes.apple.com") !== -1);
        var hasAppleId = !!(track.appleMusicId);
        if (hasAppleUrl && hasItunesPreview && hasAppleId) {
            doneCb(track);
            return;
        }
        var completed = false;
        var finishEnrich = function () {
            if (completed) return;
            completed = true;
            if (eTimer && typeof clearTimeout !== "undefined") clearTimeout(eTimer);
            try {
                if (typeof $persistentStore !== "undefined") {
                    $persistentStore.write(JSON.stringify(track), "tommm_yt_now_playing");
                }
            } catch (_) {}
            doneCb(track);
        };
        var eTimer = typeof setTimeout !== "undefined" ? setTimeout(finishEnrich, maxWaitMs || 2400) : null;
        var qBase = track.title + (track.artist && track.artist !== "YouTube" ? (" " + track.artist) : "");
        var uaHdrs = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "application/json"
        };
        var tryCountry = function (cc, onMiss) {
            $httpClient.get({
                url: "https://itunes.apple.com/search?term=" + encodeURIComponent(qBase) + "&country=" + cc + "&media=music&entity=song&limit=5",
                headers: uaHdrs
            }, function (err, resp, body) {
                var matched = false;
                try {
                    if (!err && body) {
                        var j = JSON.parse(body);
                        var res = (j && j.results) || [];
                        for (var i = 0; i < res.length; i++) {
                            var h = res[i];
                            if (h && titleTokenMatch(track.title, h.trackName) && (h.previewUrl || h.trackViewUrl)) {
                                if (h.previewUrl) track.previewUrl = h.previewUrl;
                                if (h.artworkUrl100) {
                                    track.artworkUrl = String(h.artworkUrl100).replace("100x100bb", "600x600bb");
                                }
                                if (h.trackViewUrl) track.appleMusicUrl = h.trackViewUrl;
                                if (h.trackId) track.appleMusicId = String(h.trackId);
                                matched = true;
                                break;
                            }
                        }
                    }
                } catch (_) {}
                if (!matched && onMiss) onMiss();
                else finishEnrich();
            });
        };
        tryCountry("VN", function () {
            tryCountry("US", null);
        });
    }

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
                    if (ex && ex.videoId === vid && ex.title && ex.schemaVer === 5 && ex.appleMusicId && ex.appleMusicUrl && ex.appleMusicUrl.indexOf("music.apple.com") !== -1 && (Date.now() - Number(ex.ts || 0)) < 300000) {
                        finishOnce({});
                        return;
                    }
                } catch (_) {}
            }
            var timer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 4500) : null;
            $httpClient.post({
                url: WORKER_BASE + "/studio/yt-now-playing",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: vid })
            }, function (err, resp, data) {
                var savedTrack = null;
                try {
                    if (!err && data) {
                        var parsed = JSON.parse(data);
                        if (parsed && parsed.ok && parsed.track && parsed.track.title) {
                            savedTrack = parsed.track;
                            $persistentStore.write(JSON.stringify(savedTrack), "tommm_yt_now_playing");
                            try { console.log("[TommmYT] Saved: " + savedTrack.title + " - " + (savedTrack.artist || "")); } catch (_) {}
                        }
                    }
                } catch (_) {}
                if (savedTrack) {
                    enrichTrackOnDevice(savedTrack, function () {
                        if (timer && typeof clearTimeout !== "undefined") clearTimeout(timer);
                        finishOnce({});
                    }, 2400);
                } else {
                    if (timer && typeof clearTimeout !== "undefined") clearTimeout(timer);
                    finishOnce({});
                }
            });
            return;
        } catch (_) {
            finishOnce({});
            return;
        }
    }

    // Mode 1B: Sniff Spotify playback requests (*spclient.spotify.com) -> /studio/yt-now-playing
    if (isSpotifyUrl) {
        try {
            var spId = extractSpotifyId();
            if (!spId || typeof $httpClient === "undefined" || typeof $persistentStore === "undefined") {
                finishOnce({});
                return;
            }
            var rawExSp = $persistentStore.read("tommm_yt_now_playing");
            if (rawExSp) {
                try {
                    var exSp = JSON.parse(rawExSp);
                    if (exSp && exSp.spotifyId === spId && exSp.title && exSp.schemaVer === 5 && exSp.appleMusicId && exSp.appleMusicUrl && exSp.appleMusicUrl.indexOf("music.apple.com") !== -1 && (Date.now() - Number(exSp.ts || 0)) < 300000) {
                        finishOnce({});
                        return;
                    }
                } catch (_) {}
            }
            var spTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 4500) : null;
            $httpClient.post({
                url: WORKER_BASE + "/studio/yt-now-playing",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ spotifyId: spId })
            }, function (err, resp, data) {
                var savedSp = null;
                try {
                    if (!err && data) {
                        var parsed = JSON.parse(data);
                        if (parsed && parsed.ok && parsed.track && parsed.track.title) {
                            savedSp = parsed.track;
                            $persistentStore.write(JSON.stringify(savedSp), "tommm_yt_now_playing");
                            try { console.log("[TommmSP] Saved: " + savedSp.title + " - " + (savedSp.artist || "")); } catch (_) {}
                        }
                    }
                } catch (_) {}
                if (savedSp) {
                    enrichTrackOnDevice(savedSp, function () {
                        if (spTimer && typeof clearTimeout !== "undefined") clearTimeout(spTimer);
                        finishOnce({});
                    }, 2400);
                } else {
                    if (spTimer && typeof clearTimeout !== "undefined") clearTimeout(spTimer);
                    finishOnce({});
                }
            });
            return;
        } catch (_) {
            finishOnce({});
            return;
        }
    }

    // Mode 1C: Sniff Apple Music catalog single-song requests (amp-api.music.apple.com) -> /studio/yt-now-playing
    if (amMatch) {
        try {
            var amCountry = String(amMatch[1] || "vn").toLowerCase();
            var amId = String(amMatch[2] || amMatch[3] || "").trim();
            if (!amId || typeof $httpClient === "undefined" || typeof $persistentStore === "undefined") {
                finishOnce({});
                return;
            }
            var rawExAm = $persistentStore.read("tommm_yt_now_playing");
            if (rawExAm) {
                try {
                    var exAm = JSON.parse(rawExAm);
                    if (exAm && exAm.appleMusicId === amId && exAm.title && exAm.schemaVer === 5 && exAm.appleMusicUrl && exAm.appleMusicUrl.indexOf("music.apple.com") !== -1 && (Date.now() - Number(exAm.ts || 0)) < 300000) {
                        finishOnce({});
                        return;
                    }
                } catch (_) {}
            }
            var amTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 4500) : null;
            $httpClient.post({
                url: WORKER_BASE + "/studio/yt-now-playing",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appleId: amId, country: amCountry })
            }, function (err, resp, data) {
                var savedAm = null;
                try {
                    if (!err && data) {
                        var parsed = JSON.parse(data);
                        if (parsed && parsed.ok && parsed.track && parsed.track.title) {
                            savedAm = parsed.track;
                            $persistentStore.write(JSON.stringify(savedAm), "tommm_yt_now_playing");
                            try { console.log("[TommmAM] Saved: " + savedAm.title + " - " + (savedAm.artist || "")); } catch (_) {}
                        }
                    }
                } catch (_) {}
                if (savedAm) {
                    enrichTrackOnDevice(savedAm, function () {
                        if (amTimer && typeof clearTimeout !== "undefined") clearTimeout(amTimer);
                        finishOnce({});
                    }, 2400);
                } else {
                    if (amTimer && typeof clearTimeout !== "undefined") clearTimeout(amTimer);
                    finishOnce({});
                }
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

    function applyNativeMusicOverlay(ov, track, bgCols) {
        var songTitle = String(track.title || "YouTube Music").trim();
        var songArtist = String(track.artist || "YouTube").trim();
        var fullLabel = (songArtist && songArtist !== "YouTube" && songTitle.toLowerCase().indexOf(songArtist.toLowerCase()) === -1)
            ? (songTitle + " " + songArtist)
            : songTitle;
        var prevMax = ov && ov.data && ov.data.max_lines;
        var maxLinesVal = (prevMax && typeof prevMax === "object")
            ? prevMax
            : { "@type": "type.googleapis.com/google.protobuf.Int64Value", "value": "1" };
        ov.overlay_id = "caption:music";
        ov.alt_text = fullLabel;
        var payloadObj = {
            song_title: songTitle,
            artist: songArtist,
            preview_url: track.previewUrl || "",
            isrc: track.isrc || ""
        };
        if (track.appleMusicUrl && String(track.appleMusicUrl).indexOf("music.apple.com") !== -1) {
            payloadObj.apple_music_url = track.appleMusicUrl;
        }
        if (track.appleMusicId) {
            payloadObj.apple_music_id = String(track.appleMusicId);
        }
        ov.data = {
            type: "music",
            text: fullLabel,
            text_color: "#FFFFFFE6",
            max_lines: maxLinesVal,
            background: {
                material_blur: "regular",
                colors: Array.isArray(bgCols) && bgCols.length >= 2 ? bgCols.slice(0, 2) : ["#1E1B4B", "#4C1D95"]
            },
            icon: {
                type: "image",
                data: track.artworkUrl || VINYL_ICON_URL,
                source: "url"
            },
            payload: payloadObj
        };
        return formatTrackLabel(songTitle, songArtist, 72);
    }

    // Mode 2 & Mode 3: postMoment / createMoment (http-response logger OR http-request overlay mutator)
    if (/\/(?:postMoment\w*|createMoment\w*)/i.test(u)) {
        if (typeof $response !== "undefined" && $response && typeof $response.body === "string") {
            try {
                var resObj = JSON.parse($response.body || "{}");
                var resOverlayLists = [];
                findOverlaysArrays(resObj, resOverlayLists, 0);
                var captured = [];
                for (var rl = 0; rl < resOverlayLists.length; rl++) {
                    var rList = resOverlayLists[rl];
                    for (var rk = 0; rk < rList.length; rk++) {
                        var ro = rList[rk];
                        if (!ro || !ro.overlay_id) continue;
                        if (ro.overlay_id === "caption:music" || ro.overlay_id.indexOf("yt_") !== -1) {
                            var rd = ro.data || {};
                            var rp = rd.payload || {};
                            captured.push({
                                overlay_id: ro.overlay_id,
                                data_type: rd.type || "",
                                data_keys: Object.keys(rd),
                                text: rd.text || "",
                                payload_keys: Object.keys(rp),
                                apple_music_url: rp.apple_music_url || "",
                                apple_music_id: rp.apple_music_id || "",
                                spotify_url: rp.spotify_url || "",
                                isrc: rp.isrc || "",
                                has_preview: !!rp.preview_url
                            });
                        }
                    }
                }
                if (captured.length > 0 && typeof $httpClient !== "undefined") {
                    var resTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 250) : null;
                    $httpClient.post({
                        url: WORKER_BASE + "/studio/music-schema-log",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            phase: "postMoment_res",
                            urlPath: u.replace(/\?.*$/, "").split("/").slice(-1)[0],
                            status: $response.status || 0,
                            returnedOverlays: captured
                        })
                    }, function () {
                        if (resTimer && typeof clearTimeout !== "undefined") clearTimeout(resTimer);
                        finishOnce({});
                    });
                    return;
                }
            } catch (_) {}
            finishOnce({});
            return;
        }
        try {
            if (typeof req.body !== "string" || !req.body) { finishOnce({}); return; }
            var bodyObj = JSON.parse(req.body);
            var overlayLists = [];
            findOverlaysArrays(bodyObj, overlayLists, 0);
            if (overlayLists.length === 0) { finishOnce({}); return; }

            var changed = false;
            var replacedWith = "";
            var hasNativeMusicLog = false;
            var pendingUpgradeOvs = [];
            var cachedTrackForUpgrade = null;
            var mutatedOvRef = null;
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
                                if (!isVinylIconMode) {
                                    var needsUpgrade = !!((track.videoId || track.spotifyId || track.appleMusicId) && typeof $httpClient !== "undefined" && (track.schemaVer !== 5 || !track.appleMusicId || !track.appleMusicUrl || track.appleMusicUrl.indexOf("music.apple.com") === -1 || !track.previewUrl));
                                    if (needsUpgrade) {
                                        cachedTrackForUpgrade = track;
                                        pendingUpgradeOvs.push(ov);
                                    } else {
                                        replacedWith = applyNativeMusicOverlay(ov, track, bgCols);
                                        mutatedOvRef = ov;
                                        changed = true;
                                    }
                                } else {
                                    var displayTxt = formatTrackLabel(track.title, track.artist, 72);
                                    var chosenBg = vinylBgUrl(bgCols, "wave");
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
                                    ov.data.icon = { type: "image", data: VINYL_ICON_URL, source: "url" };
                                    replacedWith = displayTxt;
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
            var buildDonePayload = function (updatedBody) {
                var resObj = { body: updatedBody };
                if (req && req.headers && typeof req.headers === "object") {
                    var cleanHdrs = Object.assign({}, req.headers);
                    delete cleanHdrs["Content-Length"];
                    delete cleanHdrs["content-length"];
                    resObj.headers = cleanHdrs;
                }
                return resObj;
            };
            var finalizeBody = function () {
                var updatedBody = JSON.stringify(bodyObj);
                var doneRes = buildDonePayload(updatedBody);
                if (typeof $httpClient !== "undefined") {
                    var swapTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce(doneRes); }, 250) : null;
                    var logData = {
                        urlPath: u.replace(/\?.*$/, "").split("/").slice(-1)[0],
                        matched: true,
                        replacedWith: replacedWith,
                        overlayId: mutatedOvRef ? mutatedOvRef.overlay_id : "",
                        dataType: mutatedOvRef && mutatedOvRef.data ? mutatedOvRef.data.type : "",
                        hasPreview: !!(mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.preview_url),
                        appleMusicUrl: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.apple_music_url) || "",
                        appleMusicId: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.apple_music_id) || "",
                        hasSpotify: !!(mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.spotify_url),
                        isrc: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.isrc) || ""
                    };
                    $httpClient.post({
                        url: WORKER_BASE + "/studio/music-schema-log",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(logData)
                    }, function () {
                        if (swapTimer && typeof clearTimeout !== "undefined") clearTimeout(swapTimer);
                        finishOnce(doneRes);
                    });
                    return;
                }
                finishOnce(doneRes);
            };
            if (pendingUpgradeOvs.length > 0 && cachedTrackForUpgrade) {
                var upgDone = false;
                var finishUpgrade = function (useTrack) {
                    if (upgDone) return;
                    upgDone = true;
                    var uCols = Array.isArray(useTrack.colors) && useTrack.colors.length >= 2 ? useTrack.colors.slice(0, 2) : ["#1E1B4B", "#4C1D95"];
                    for (var pi = 0; pi < pendingUpgradeOvs.length; pi++) {
                        replacedWith = applyNativeMusicOverlay(pendingUpgradeOvs[pi], useTrack, uCols);
                        mutatedOvRef = pendingUpgradeOvs[pi];
                    }
                    changed = true;
                    finalizeBody();
                };
                var enrichAndFinish = function (baseTrack) {
                    enrichTrackOnDevice(baseTrack, function (enriched) {
                        finishUpgrade(enriched || baseTrack);
                    }, 1500);
                };
                if (cachedTrackForUpgrade.schemaVer === 5 && cachedTrackForUpgrade.appleMusicId && cachedTrackForUpgrade.previewUrl && cachedTrackForUpgrade.appleMusicUrl && cachedTrackForUpgrade.appleMusicUrl.indexOf("music.apple.com") !== -1) {
                    finishUpgrade(cachedTrackForUpgrade);
                    return;
                }
                var upgTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { enrichAndFinish(cachedTrackForUpgrade); }, 1800) : null;
                $httpClient.post({
                    url: WORKER_BASE + "/studio/yt-now-playing",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        videoId: cachedTrackForUpgrade.videoId || "",
                        spotifyId: cachedTrackForUpgrade.spotifyId || "",
                        appleId: cachedTrackForUpgrade.appleMusicId || "",
                        title: cachedTrackForUpgrade.title || "",
                        artist: cachedTrackForUpgrade.artist || ""
                    })
                }, function (err, resp, data) {
                    var picked = cachedTrackForUpgrade;
                    try {
                        if (!err && data) {
                            var parsed = JSON.parse(data);
                            if (parsed && parsed.ok && parsed.track && parsed.track.title) {
                                picked = parsed.track;
                                $persistentStore.write(JSON.stringify(picked), "tommm_yt_now_playing");
                            }
                        }
                    } catch (_) {}
                    if (upgTimer && typeof clearTimeout !== "undefined") clearTimeout(upgTimer);
                    enrichAndFinish(picked);
                });
                return;
            }
            if (changed) {
                finalizeBody();
                return;
            }
            if (hasNativeMusicLog) return;
        } catch (_) {}
        finishOnce({});
        return;
    }

    finishOnce({});
})();
