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
        return WORKER_BASE + "/studio/vinyl-bg.gif?c0=" + c0 + "&c1=" + c1 + "&mode=" + m + "&v=5";
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
    var isSpotifyUrl = /^https?:\/\/(spclient\.wg\.spotify\.com|[a-z0-9-]+-spclient\.spotify\.com(?::443)?)\/.*(color-lyrics|canvaz|metadata\/4\/track|spotify(?::|%3a)track(?::|%3a)|\/track\/)/i.test(u);
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
        var out = String(s || "");
        try { out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (_) {}
        return out
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase()
            .replace(/[^a-z0-9\uac00-\ud7a3\u4e00-\u9fff\u3040-\u30ff\uff00-\uffef]+/g, " ")
            .replace(/^\s+|\s+$/g, "");
    }

    function compactNormEs5(s) {
        return simpleNorm(s).replace(/\s+/g, "");
    }

    var NOISE_WORDS_MAP = {
        remix:1, mix:1, edit:1, version:1, ver:1, live:1, cover:1, official:1, mv:1,
        audio:1, video:1, lyrics:1, lyric:1, feat:1, ft:1, prod:1, dj:1, vinahouse:1,
        lofi:1, sped:1, up:1, slowed:1, reverb:1, acoustic:1, karaoke:1, instrumental:1,
        media:1, music:1, channel:1, records:1, entertainment:1, studio:1, ost:1,
        tik:1, tok:1, tiktok:1, mashup:1, medley:1, extended:1, radio:1, full:1, hd:1, "4k":1
    };

    function stripBracketsEs5(s) {
        return String(s || "")
            .replace(/\([^)]*\)/g, " ")
            .replace(/\[[^\]]*\]/g, " ")
            .replace(/【[^】]*】/g, " ")
            .replace(/\s+/g, " ")
            .replace(/^\s+|\s+$/g, "");
    }

    function isNoisyChannelEs5(s) {
        return /\b(media|music|channel|official|tv|records|ent|entertainment|studio|remix|dj|audio|lyrics?|vpop|nhac|youtube|topic)\b/i.test(simpleNorm(s));
    }

    function extractBracketTermsEs5(s) {
        var raw = String(s || "");
        var ms = raw.match(/[([【][^)\]】]+[)\]】]/g) || [];
        var out = [];
        for (var i = 0; i < ms.length; i++) {
            var inner = ms[i].replace(/^[([【]|[)\]】]$/g, "").replace(/^\s+|\s+$/g, "");
            if (!inner || !/[a-zA-Z]/.test(inner)) continue;
            var ws = simpleNorm(inner).split(/\s+/);
            var cleanWs = [];
            for (var j = 0; j < ws.length; j++) {
                if (ws[j] && !NOISE_WORDS_MAP[ws[j]]) cleanWs.push(ws[j]);
            }
            if (cleanWs.length > 0 && out.indexOf(inner) === -1) out.push(inner);
        }
        return out;
    }

    function filterNoiseWordsEs5(normStr) {
        var arr = String(normStr || "").split(/\s+/);
        var out = [];
        for (var i = 0; i < arr.length; i++) {
            var w = arr[i];
            if (w.length >= 2 && !NOISE_WORDS_MAP[w]) out.push(w);
        }
        return out;
    }

    function splitArtistPartsEs5(s) {
        var raw = String(s || "").split(/\s*(?:,|&|\/|·|;|\b(?:ft\.?|feat\.?|featuring|with|vs\.?|x)\b)\s*/i);
        var out = [];
        for (var i = 0; i < raw.length; i++) {
            var p = raw[i].replace(/^\s+|\s+$/g, "");
            if (p && compactNormEs5(p).length >= 2 && simpleNorm(p) !== "youtube") out.push(p);
        }
        return out;
    }

    function artistMatchEs5(expectedArtist, candArtist) {
        if (!expectedArtist || !candArtist) return false;
        var expParts = splitArtistPartsEs5(expectedArtist);
        var candParts = splitArtistPartsEs5(candArtist);
        if (expParts.length === 0 || candParts.length === 0) return false;
        for (var ei = 0; ei < expParts.length; ei++) {
            var epC = compactNormEs5(expParts[ei]);
            if (epC.length < 2) continue;
            var epWords = filterNoiseWordsEs5(simpleNorm(expParts[ei]));
            for (var ci = 0; ci < candParts.length; ci++) {
                var cpC = compactNormEs5(candParts[ci]);
                if (cpC.length < 2) continue;
                if (epC === cpC) return true;
                if ((epC.length >= 4 && cpC.indexOf(epC) !== -1) || (cpC.length >= 4 && epC.indexOf(cpC) !== -1)) return true;
                var cpWords = filterNoiseWordsEs5(simpleNorm(candParts[ci]));
                if (epWords.length === 1 && cpWords.length === 1 && epWords[0] === cpWords[0] && epWords[0].length >= 2) {
                    return true;
                }
                if (epWords.length >= 2 && cpWords.length >= 2) {
                    var cMap = {};
                    for (var wi = 0; wi < cpWords.length; wi++) cMap[cpWords[wi]] = true;
                    var shared = 0;
                    for (var wj = 0; wj < epWords.length; wj++) {
                        var ew = epWords[wj];
                        if ((ew.length >= 3 || (/[\uac00-\ud7a3\u4e00-\u9fff\u3040-\u30ff]/.test(ew) && ew.length >= 2)) && cMap[ew]) shared++;
                    }
                    if (shared >= 2 || shared >= Math.min(epWords.length, cpWords.length)) return true;
                }
            }
        }
        return false;
    }

    function titleTokenMatch(qTitle, candTitle) {
        var qCore = simpleNorm(stripBracketsEs5(qTitle) || qTitle);
        var cCore = simpleNorm(stripBracketsEs5(candTitle) || candTitle);
        if (!qCore || !cCore) return false;
        if (qCore.length >= 4 && (cCore === qCore || cCore.indexOf(qCore) !== -1 || (cCore.length >= 4 && qCore.indexOf(cCore) !== -1 && cCore.length >= Math.ceil(qCore.length * 0.65)))) {
            return true;
        }
        var qWords = filterNoiseWordsEs5(qCore);
        if (qWords.length === 0) qWords = simpleNorm(qTitle).split(/\s+/);
        var cWords = filterNoiseWordsEs5(cCore);
        if (cWords.length === 0) cWords = simpleNorm(candTitle).split(/\s+/);
        var cMap = {};
        for (var ci = 0; ci < cWords.length; ci++) {
            if (cWords[ci].length >= 2) cMap[cWords[ci]] = true;
        }
        var validQ = 0;
        var matched = 0;
        for (var qi = 0; qi < qWords.length; qi++) {
            var qw = qWords[qi];
            if (qw.length < 2) continue;
            validQ++;
            if (cMap[qw]) matched++;
        }
        if (validQ === 0) return false;
        return matched >= Math.ceil(validQ * 0.65) && (validQ < 2 || matched >= 2);
    }

    function pickBestItunesHit(resList, track, extraTitles) {
        if (!Array.isArray(resList) || resList.length === 0) return null;
        var hasReliableArtist = !!(track.artist && track.artist !== "YouTube" && !isNoisyChannelEs5(track.artist) && !track.isRemix);
        var qTitle = String((track.isRemix && track.searchTitle) ? track.searchTitle : (track.title || ""));
        var qTitleNorm = simpleNorm(stripBracketsEs5(qTitle) || qTitle);
        var qLower = qTitle.toLowerCase();
        var best = null;
        var bestScore = -1;
        for (var i = 0; i < resList.length; i++) {
            var h = resList[i];
            if (!h || !h.trackName || (!h.previewUrl && !h.trackViewUrl)) continue;
            var titleOk = titleTokenMatch(qTitle, h.trackName);
            var viaBracket = false;
            if (!titleOk && Array.isArray(extraTitles)) {
                for (var bi = 0; bi < extraTitles.length; bi++) {
                    if (titleTokenMatch(extraTitles[bi], h.trackName)) {
                        titleOk = true;
                        viaBracket = true;
                        break;
                    }
                }
            }
            if (!titleOk) continue;
            var artistOk = hasReliableArtist ? artistMatchEs5(track.artist, h.artistName || "") : false;
            if (hasReliableArtist && !artistOk) continue;
            var cNorm = simpleNorm(stripBracketsEs5(h.trackName) || h.trackName);
            var score = (cNorm && qTitleNorm && cNorm === qTitleNorm) ? 50 : (viaBracket ? 35 : 40);
            if (artistOk) score += 100;
            if (h.previewUrl) score += 15;
            var cLower = String(h.trackName || "").toLowerCase();
            var cArtLower = String(h.artistName || "").toLowerCase();
            if (track.isRemix && !/\b(remix|karaoke|instrumental|piano|cover|live|vinahouse|lofi|sped\s*up|slowed)\b/i.test(cLower) && !/\b(remix|dj)\b/i.test(cArtLower)) {
                score += 20;
            }
            if (/\b(karaoke|instrumental|piano|lullaby|8-?bit|ringtone|tribute|cover)\b/i.test(cLower) && !/\b(karaoke|instrumental|piano|lullaby|8-?bit|ringtone|tribute|cover)\b/i.test(qLower)) {
                score -= 40;
            }
            if (/\blive\b/i.test(cLower) && !/\blive\b/i.test(qLower)) {
                score -= 15;
            }
            if (score > bestScore) {
                bestScore = score;
                best = h;
            }
        }
        return bestScore > 0 ? best : null;
    }

    function saveTrackStores(tr) {
        if (!tr || !tr.title || typeof $persistentStore === "undefined") return;
        try {
            if (!tr.ts) tr.ts = Date.now();
            var serialized = JSON.stringify(tr);
            // tommm_yt_now_playing = LATEST (bài mới nhất bất kể nguồn, giữ tên cũ cho tương thích ngược).
            $persistentStore.write(serialized, "tommm_yt_now_playing");
            // Tách KEY RIÊNG theo đúng nguồn -> 3 ô nhạc (Spotify / YouTube / Apple Music) không đè chéo nhau.
            var isSp = !!(tr.platform === "spotify" || tr.spotifyId);
            var isYt = !!(tr.platform === "youtube" || tr.videoId);
            if (isSp) {
                $persistentStore.write(serialized, "tommm_sp_now_playing");
            } else if (isYt) {
                $persistentStore.write(serialized, "tommm_yt_only");
            } else {
                $persistentStore.write(serialized, "tommm_am_only");
            }
        } catch (_) {}
    }

    function enrichTrackOnDevice(track, doneCb, maxWaitMs) {
        if (!track || !track.title || typeof $httpClient === "undefined") {
            doneCb(track);
            return;
        }
        var isSpotify = !!(track.platform === "spotify" || track.spotifyId);
        var hasAppleUrl = !!(track.appleMusicUrl && String(track.appleMusicUrl).indexOf("music.apple.com") !== -1);
        var hasItunesPreview = !!(track.previewUrl && String(track.previewUrl).indexOf("itunes.apple.com") !== -1);
        var hasAppleIcon = !!(track.artworkUrl && String(track.artworkUrl).indexOf("mzstatic.com") !== -1);
        var hasAppleId = !!(track.appleMusicId || (track.appleMusicUrl && /[?&]i=\d+|\/song\/\d+/.test(track.appleMusicUrl)));
        var hasValidPreview = !!(track.previewUrl && (
            String(track.previewUrl).indexOf("p.scdn.co") !== -1 ||
            String(track.previewUrl).indexOf("itunes.apple.com") !== -1 ||
            String(track.previewUrl).indexOf("/studio/preview.mp3") !== -1
        ));
        if (isSpotify) {
            if (hasValidPreview && (track.spotifyUrl || track.spotifyId) && track.title !== "YouTube Music") {
                doneCb(track);
                return;
            }
        } else {
            if (hasAppleUrl && hasItunesPreview && hasAppleIcon && hasAppleId && track.title !== "YouTube Music") {
                doneCb(track);
                return;
            }
        }
        var completed = false;
        var finishEnrich = function () {
            if (completed) return;
            completed = true;
            if (eTimer && typeof clearTimeout !== "undefined") clearTimeout(eTimer);
            saveTrackStores(track);
            doneCb(track);
        };
        var eTimer = typeof setTimeout !== "undefined" ? setTimeout(finishEnrich, maxWaitMs || 2400) : null;
        var lookupTitle = (track.isRemix && track.searchTitle) ? track.searchTitle : track.title;
        var coreTitle = stripBracketsEs5(lookupTitle) || lookupTitle;
        var bracketTerms = extractBracketTermsEs5(lookupTitle);
        var hasReliableArt = !!(track.artist && track.artist !== "YouTube" && !isNoisyChannelEs5(track.artist) && !track.isRemix);
        var qList = [];
        var pushQ = function (s) {
            var val = String(s || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
            if (val && qList.indexOf(val) === -1) qList.push(val);
        };
        if (track.isRemix) {
            pushQ(coreTitle);
            if (track.artist && track.artist !== "YouTube" && !isNoisyChannelEs5(track.artist) && !/\b(remix|dj)\b/i.test(track.artist)) {
                pushQ(coreTitle + " " + track.artist);
            }
        } else {
            if (hasReliableArt) {
                pushQ(coreTitle + " " + track.artist);
                for (var bi = 0; bi < bracketTerms.length; bi++) {
                    pushQ(bracketTerms[bi] + " " + track.artist);
                }
            }
            if (/\bremix\b/i.test(lookupTitle)) {
                pushQ(coreTitle + " Remix");
            }
            pushQ(coreTitle);
            for (var bj = 0; bj < bracketTerms.length; bj++) {
                pushQ(bracketTerms[bj]);
            }
        }
        var usFallbackQ = qList[0] || coreTitle;
        var uaHdrs = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "application/json"
        };
        var applyItunesHit = function (h) {
            if (!h) return false;
            if (h.previewUrl) track.previewUrl = h.previewUrl;
            if (h.artworkUrl100 && (!isSpotify || !track.artworkUrl || track.artworkUrl.indexOf("ytimg.com") !== -1)) {
                track.artworkUrl = String(h.artworkUrl100).replace("100x100bb", "600x600bb");
            }
            if (h.trackViewUrl) track.appleMusicUrl = h.trackViewUrl;
            if (h.trackId) track.appleMusicId = String(h.trackId);
            return true;
        };
        var runQueryList = function (cc, idx, onAllMiss) {
            if (idx >= qList.length) {
                if (onAllMiss) onAllMiss();
                else finishEnrich();
                return;
            }
            $httpClient.get({
                url: "https://itunes.apple.com/search?term=" + encodeURIComponent(qList[idx]) + "&country=" + cc + "&media=music&entity=song&limit=10",
                headers: uaHdrs
            }, function (err, resp, body) {
                var matched = false;
                try {
                    if (!err && body) {
                        var j = JSON.parse(body);
                        var hit = pickBestItunesHit((j && j.results) || [], track, bracketTerms);
                        if (hit) matched = applyItunesHit(hit);
                    }
                } catch (_) {}
                if (matched) finishEnrich();
                else runQueryList(cc, idx + 1, onAllMiss);
            });
        };
        var searchUsFallback = function () {
            $httpClient.get({
                url: "https://itunes.apple.com/search?term=" + encodeURIComponent(usFallbackQ) + "&country=US&media=music&entity=song&limit=10",
                headers: uaHdrs
            }, function (uErr, uResp, uBody) {
                try {
                    if (!uErr && uBody) {
                        var uj = JSON.parse(uBody);
                        var uHit = pickBestItunesHit((uj && uj.results) || [], track, bracketTerms);
                        if (uHit) applyItunesHit(uHit);
                    }
                } catch (_) {}
                finishEnrich();
            });
        };
        if (track.appleMusicId && !isSpotify) {
            $httpClient.get({
                url: "https://itunes.apple.com/lookup?id=" + encodeURIComponent(String(track.appleMusicId)) + "&country=VN",
                headers: uaHdrs
            }, function (err, resp, body) {
                var hitOk = false;
                try {
                    if (!err && body) {
                        var jl = JSON.parse(body);
                        var hl = jl && jl.results && jl.results[0];
                        if (hl && hl.trackName) {
                            if (hl.trackName && track.title === "YouTube Music") track.title = hl.trackName;
                            if (hl.artistName && (!track.artist || track.artist === "YouTube")) track.artist = hl.artistName;
                            if (hl.previewUrl) track.previewUrl = hl.previewUrl;
                            if (hl.artworkUrl100) track.artworkUrl = String(hl.artworkUrl100).replace("100x100bb", "600x600bb");
                            if (hl.trackViewUrl) track.appleMusicUrl = hl.trackViewUrl;
                            if (hl.trackId) track.appleMusicId = String(hl.trackId);
                            hitOk = !!(track.previewUrl && track.appleMusicUrl);
                        }
                    }
                } catch (_) {}
                if (hitOk) finishEnrich();
                else runQueryList("VN", 0, searchUsFallback);
            });
        } else {
            runQueryList("VN", 0, searchUsFallback);
        }
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
            var rawExisting = $persistentStore.read("tommm_yt_only") || $persistentStore.read("tommm_yt_now_playing");
            if (rawExisting) {
                try {
                    var ex = JSON.parse(rawExisting);
                    if (ex && ex.videoId === vid && ex.title && ex.schemaVer === 11 && ex.appleMusicUrl && ex.appleMusicUrl.indexOf("music.apple.com") !== -1 && (Date.now() - Number(ex.ts || 0)) < 300000) {
                        ex.ts = Date.now();
                        saveTrackStores(ex);
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
                            saveTrackStores(savedTrack);
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
            var rawExSp = $persistentStore.read("tommm_sp_now_playing") || $persistentStore.read("tommm_yt_now_playing");
            if (rawExSp) {
                try {
                    var exSp = JSON.parse(rawExSp);
                    if (exSp && exSp.spotifyId === spId && exSp.title && exSp.schemaVer === 11 && exSp.spotifyUrl && exSp.previewUrl && (Date.now() - Number(exSp.ts || 0)) < 300000) {
                        exSp.ts = Date.now();
                        saveTrackStores(exSp);
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
                            saveTrackStores(savedSp);
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
            var rawExAm = $persistentStore.read("tommm_am_only") || $persistentStore.read("tommm_yt_now_playing");
            if (rawExAm) {
                try {
                    var exAm = JSON.parse(rawExAm);
                    if (exAm && exAm.appleMusicId === amId && exAm.title && exAm.schemaVer === 11 && exAm.appleMusicUrl && exAm.appleMusicUrl.indexOf("music.apple.com") !== -1 && (Date.now() - Number(exAm.ts || 0)) < 300000) {
                        exAm.ts = Date.now();
                        saveTrackStores(exAm);
                        finishOnce({});
                        return;
                    }
                } catch (_) {}
            }
            var amTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 4500) : null;
            var sendAmToWorker = function (preMeta) {
                var bodyObj = { appleId: amId, country: amCountry };
                if (preMeta) {
                    if (preMeta.title) bodyObj.title = preMeta.title;
                    if (preMeta.artist) bodyObj.artist = preMeta.artist;
                    if (preMeta.previewUrl) bodyObj.previewUrl = preMeta.previewUrl;
                    if (preMeta.appleMusicUrl) bodyObj.appleMusicUrl = preMeta.appleMusicUrl;
                    if (preMeta.artworkUrl) bodyObj.artworkUrl = preMeta.artworkUrl;
                    bodyObj.appleMusicId = amId;
                }
                $httpClient.post({
                    url: WORKER_BASE + "/studio/yt-now-playing",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bodyObj)
                }, function (err, resp, data) {
                    var savedAm = null;
                    try {
                        if (!err && data) {
                            var parsed = JSON.parse(data);
                            if (parsed && parsed.ok && parsed.track && parsed.track.title) {
                                savedAm = parsed.track;
                                saveTrackStores(savedAm);
                                try { console.log("[TommmAM] Saved: " + savedAm.title + " - " + (savedAm.artist || "")); } catch (_) {}
                            }
                        }
                    } catch (_) {}
                    if (savedAm) {
                        enrichTrackOnDevice(savedAm, function () {
                            if (amTimer && typeof clearTimeout !== "undefined") clearTimeout(amTimer);
                            finishOnce({});
                        }, 2000);
                    } else {
                        if (amTimer && typeof clearTimeout !== "undefined") clearTimeout(amTimer);
                        finishOnce({});
                    }
                });
            };
            $httpClient.get({
                url: "https://itunes.apple.com/lookup?id=" + encodeURIComponent(amId) + "&country=" + encodeURIComponent(amCountry),
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                    "Accept": "application/json"
                }
            }, function (lErr, lResp, lBody) {
                var pre = null;
                try {
                    if (!lErr && lBody) {
                        var jl = JSON.parse(lBody);
                        var hl = jl && jl.results && jl.results[0];
                        if (hl && hl.trackName) {
                            pre = {
                                title: hl.trackName,
                                artist: hl.artistName || "",
                                previewUrl: hl.previewUrl || "",
                                appleMusicUrl: hl.trackViewUrl || "",
                                artworkUrl: hl.artworkUrl100 ? String(hl.artworkUrl100).replace("100x100bb", "600x600bb") : ""
                            };
                        }
                    }
                } catch (_) {}
                sendAmToWorker(pre);
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

    function isLocketSafeStaticUrl(uStr) {
        return /^https:\/\/(?:public\.locketcamera\.com|storage\.googleapis\.com|firebasestorage\.googleapis\.com)\//i.test(String(uStr || ""));
    }

    function isLocketSafeIconUrl(uStr) {
        if (isLocketSafeStaticUrl(uStr)) return true;
        return /^https:\/\/(?:i\.scdn\.co|mosaic\.scdn\.co|is\d+-ssl\.mzstatic\.com|i\.ytimg\.com|img\.youtube\.com|lh3\.googleusercontent\.com|yt3\.ggpht\.com)\//i.test(String(uStr || ""));
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
        // GUARD: caption:music RỖNG (không preview, không spotify/apple url) sẽ bị Locket server DROP
        // (overlayCount:0 -> mất sạch caption). Khi tìm bài thất bại -> giữ overlay dạng text hợp lệ
        // (caption:music_text đơn giản, nền màu bìa) để KHÔNG mất chữ bài hát người dùng gõ.
        var hasPreview = !!(track.previewUrl && String(track.previewUrl).indexOf("http") === 0);
        var isSpotifyReady = !!((track.platform === "spotify" || track.spotifyId) && (track.spotifyUrl || track.spotifyId));
        var hasAmUrl = !!(track.appleMusicUrl && String(track.appleMusicUrl).indexOf("music.apple.com") !== -1);
        if (!hasPreview && !isSpotifyReady && !hasAmUrl) {
            // Không đủ dữ liệu nhạc native -> fallback text, giữ overlay_id gốc để server chấp nhận
            ov.alt_text = fullLabel;
            ov.data = ov.data || {};
            if (!ov.data.type || ov.data.type === "music") ov.data.type = "static_content";
            ov.data.text = fullLabel;
            ov.data.text_color = "#FFFFFF";
            ov.data.max_lines = maxLinesVal;
            ov.data.background = {
                colors: Array.isArray(bgCols) && bgCols.length >= 2 ? bgCols.slice(0, 2) : ["#991B1B", "#DC2626"],
                image: { type: "image", data: "star_sign_background", source: "local" }
            };
            ov.data.icon = isLocketSafeIconUrl(track.artworkUrl)
                ? { type: "image", data: track.artworkUrl, source: "url" }
                : { type: "emoji", data: "🎵" };
            if (ov.data.payload) delete ov.data.payload;
            return formatTrackLabel(songTitle, songArtist, 72);
        }
        ov.overlay_id = "caption:music";
        ov.alt_text = fullLabel;
        var isSpotifyTrack = !!(track.platform === "spotify" || track.spotifyId);
        var payloadObj = {
            song_title: songTitle,
            artist: songArtist,
            preview_url: track.previewUrl || "",
            isrc: track.isrc || ""
        };
        if (isSpotifyTrack) {
            payloadObj.spotify_url = track.spotifyUrl || ("https://open.spotify.com/track/" + track.spotifyId);
        } else {
            if (track.appleMusicUrl && String(track.appleMusicUrl).indexOf("music.apple.com") !== -1) {
                payloadObj.apple_music_url = track.appleMusicUrl;
            }
            var amIdVal = String(track.appleMusicId || "").trim();
            if (!amIdVal && track.appleMusicUrl) {
                var amIdM = String(track.appleMusicUrl).match(/[?&]i=(\d+)|\/song\/(\d+)/);
                if (amIdM) amIdVal = amIdM[1] || amIdM[2] || "";
            }
            if (amIdVal) {
                payloadObj.apple_music_id = amIdVal;
            }
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
            icon: track.artworkUrl
                ? { type: "image", data: track.artworkUrl, source: "url" }
                : { type: "sf_symbol", data: "music.note" },
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
                var overlayIds = [];
                for (var rl = 0; rl < resOverlayLists.length; rl++) {
                    var rList = resOverlayLists[rl];
                    for (var rk = 0; rk < rList.length; rk++) {
                        var ro = rList[rk];
                        if (!ro || !ro.overlay_id) continue;
                        overlayIds.push(ro.overlay_id);
                        if (ro.overlay_id === "caption:music" || ro.overlay_id.indexOf("yt_") !== -1 || ro.overlay_id.indexOf("sp_") !== -1) {
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
                                has_preview: !!rp.preview_url,
                                bg_keys: rd.background ? Object.keys(rd.background) : [],
                                has_bg_image: !!(rd.background && rd.background.image)
                            });
                        }
                    }
                }
                if (typeof $httpClient !== "undefined") {
                    var resTimer = typeof setTimeout !== "undefined" ? setTimeout(function () { finishOnce({}); }, 250) : null;
                    $httpClient.post({
                        url: WORKER_BASE + "/studio/music-schema-log",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            phase: "postMoment_res",
                            urlPath: u.replace(/\?.*$/, "").split("/").slice(-1)[0],
                            status: $response.status || 0,
                            overlayCount: overlayIds.length,
                            overlayIds: overlayIds,
                            returnedOverlays: captured,
                            bodyPreview: captured.length === 0 ? String($response.body || "").slice(0, 320) : ""
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
            var sanitizedStatic = false;
            for (var li = 0; li < overlayLists.length; li++) {
                var overlays = overlayLists[li];
                for (var k = 0; k < overlays.length; k++) {
                    var ov = overlays[k];
                    if (!ov) continue;
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
                    if (ov.overlay_id === "caption:music" && typeof $httpClient !== "undefined") {
                        hasNativeMusicLog = true;
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
                    var isVinylIconMode = ov.overlay_id === "caption:yt_vinyl_spin";
                    var isSpOv = ov.overlay_id === "caption:sp_now_playing";
                    var isYtAmOv = ov.overlay_id === "caption:yt_now_playing" || (ov.overlay_id && ov.overlay_id.indexOf("yt_now_playing") !== -1);
                    var isYtOv = isVinylIconMode || isSpOv || isYtAmOv;
                    if (isYtOv && typeof $persistentStore !== "undefined") {
                        var rawYt = null;
                        // So ts giữa 2 key, lấy raw của bài MỚI NHẤT (không trộn nguồn khác).
                        var pickNewerRaw = function (keyA, keyB) {
                            var rA = $persistentStore.read(keyA);
                            var rB = $persistentStore.read(keyB);
                            if (!rA) return rB || null;
                            if (!rB) return rA || null;
                            var tsA = 0, tsB = 0;
                            try { tsA = Number(JSON.parse(rA).ts || 0); } catch (_) {}
                            try { tsB = Number(JSON.parse(rB).ts || 0); } catch (_) {}
                            return tsA >= tsB ? rA : rB;
                        };
                        if (isVinylIconMode) {
                            // Đĩa than = bài mới nhất bất kể nguồn (key latest giữ tên cũ).
                            rawYt = $persistentStore.read("tommm_yt_now_playing");
                        } else if (isSpOv) {
                            // Ô Spotify CHỈ đọc store Spotify (không để YouTube/AM lọt vào).
                            rawYt = $persistentStore.read("tommm_sp_now_playing");
                        } else {
                            // Ô YT / Apple Music: so ts giữa yt_only và am_only, KHÔNG đụng Spotify.
                            rawYt = pickNewerRaw("tommm_yt_only", "tommm_am_only");
                            if (!rawYt) {
                                // Fallback tương thích ngược: latest nếu không phải Spotify.
                                var fbLatest = $persistentStore.read("tommm_yt_now_playing");
                                if (fbLatest) {
                                    try {
                                        var fbObj = JSON.parse(fbLatest);
                                        if (fbObj && !(fbObj.platform === "spotify" || fbObj.spotifyId)) rawYt = fbLatest;
                                    } catch (_) {}
                                }
                            }
                        }
                        if (rawYt) {
                            var track = JSON.parse(rawYt);
                            if (track && track.title && (!track.ts || (Date.now() - track.ts) < 2700000)) {
                                var bgCols = Array.isArray(track.colors) && track.colors.length >= 2 ? track.colors.slice(0, 2) : ["#1E1B4B", "#4C1D95"];
                                if (!isVinylIconMode) {
                                    var isSpUp = !!(track.platform === "spotify" || track.spotifyId);
                                    var hasAmReady = !!(track.appleMusicUrl && track.appleMusicUrl.indexOf("music.apple.com") !== -1 && (track.appleMusicId || /[?&]i=\d+|\/song\/\d+/.test(track.appleMusicUrl)) && track.artworkUrl && String(track.artworkUrl).indexOf("mzstatic.com") !== -1);
                                    var needsUpgrade = !!((track.videoId || track.spotifyId || track.appleMusicId) && typeof $httpClient !== "undefined" && (track.schemaVer !== 11 || !track.previewUrl || (isSpUp ? !track.spotifyUrl : !hasAmReady)));
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
                                    var prevVinylMax = ov && ov.data && ov.data.max_lines;
                                    ov.alt_text = displayTxt;
                                    ov.data = ov.data || {};
                                    if (!ov.data.type) ov.data.type = "static_content";
                                    ov.data.text = displayTxt;
                                    ov.data.text_color = "#FFFFFF";
                                    ov.data.max_lines = (prevVinylMax && typeof prevVinylMax === "object")
                                        ? prevVinylMax
                                        : { "@type": "type.googleapis.com/google.protobuf.Int64Value", "value": "1" };
                                    ov.data.background = {
                                        colors: bgCols,
                                        image: { type: "image", data: "star_sign_background", source: "local" }
                                    };
                                    ov.data.icon = isLocketSafeIconUrl(track.artworkUrl)
                                        ? { type: "image", data: track.artworkUrl, source: "url" }
                                        : { type: "emoji", data: "🎵" };
                                    replacedWith = displayTxt;
                                    mutatedOvRef = ov;
                                    changed = true;
                                }
                            }
                        }
                    }
                    if (ov.overlay_id !== "caption:music" && ov.data && ov.data.type !== "music") {
                        var didSanitizeThis = false;
                        if (ov.data.background && ov.data.background.image && ov.data.background.image.source === "url" && !isLocketSafeStaticUrl(ov.data.background.image.data)) {
                            var isWinterStatic = /muadong|dong_nho|lanh_|snow/i.test(String(ov.overlay_id || "") + " " + String(ov.data.text || ""));
                            ov.data.background.image = {
                                type: "image",
                                data: isWinterStatic ? "cloud_cover" : "star_sign_background",
                                source: "local"
                            };
                            didSanitizeThis = true;
                        }
                        if (ov.data.icon && ov.data.icon.type === "image" && ov.data.icon.source === "url" && !isLocketSafeIconUrl(ov.data.icon.data)) {
                            ov.data.icon = { type: "emoji", data: (ov.overlay_id && (ov.overlay_id.indexOf("music") !== -1 || ov.overlay_id.indexOf("vinyl") !== -1)) ? "🎵" : "✨" };
                            didSanitizeThis = true;
                        }
                        if (didSanitizeThis) {
                            changed = true;
                            sanitizedStatic = true;
                            if (!mutatedOvRef) {
                                mutatedOvRef = ov;
                                replacedWith = String(ov.data.text || ov.overlay_id || "sanitized_static");
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
                    var extractHost = function (uStr) {
                        var hm = String(uStr || "").match(/^https?:\/\/([^\/?#]+)/i);
                        return hm ? hm[1] : "";
                    };
                    var logData = {
                        urlPath: u.replace(/\?.*$/, "").split("/").slice(-1)[0],
                        matched: true,
                        replacedWith: replacedWith,
                        overlayId: mutatedOvRef ? mutatedOvRef.overlay_id : "",
                        dataType: mutatedOvRef && mutatedOvRef.data ? mutatedOvRef.data.type : "",
                        hasPreview: !!(mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.preview_url),
                        appleMusicUrl: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.apple_music_url) || "",
                        appleMusicId: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.apple_music_id) || "",
                        spotifyUrl: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.spotify_url) || "",
                        hasSpotify: !!(mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.spotify_url),
                        platform: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.spotify_url) ? "spotify" : "apple_music",
                        iconHost: extractHost(mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.icon && mutatedOvRef.data.icon.data),
                        previewHost: extractHost(mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.preview_url),
                        isrc: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.payload && mutatedOvRef.data.payload.isrc) || "",
                        sanitizedStatic: !!sanitizedStatic,
                        hasBgImage: !!(mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.background && mutatedOvRef.data.background.image),
                        iconType: (mutatedOvRef && mutatedOvRef.data && mutatedOvRef.data.icon && mutatedOvRef.data.icon.type) || ""
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
                var isSpCached = !!(cachedTrackForUpgrade.platform === "spotify" || cachedTrackForUpgrade.spotifyId);
                var hasAmCachedReady = !!(cachedTrackForUpgrade.appleMusicUrl && cachedTrackForUpgrade.appleMusicUrl.indexOf("music.apple.com") !== -1 && (cachedTrackForUpgrade.appleMusicId || /[?&]i=\d+|\/song\/\d+/.test(cachedTrackForUpgrade.appleMusicUrl)) && cachedTrackForUpgrade.artworkUrl && String(cachedTrackForUpgrade.artworkUrl).indexOf("mzstatic.com") !== -1);
                if (cachedTrackForUpgrade.schemaVer === 11 && cachedTrackForUpgrade.previewUrl && (isSpCached ? cachedTrackForUpgrade.spotifyUrl : hasAmCachedReady)) {
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
                                saveTrackStores(picked);
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
