const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const dataDir = path.join(baseDir, 'data');

// Dùng GitHub Pages cho module & assets mà iPhone tải (ổn định/nhanh hơn ở VN so với raw.githubusercontent).
// LƯU Ý: Pages build lại sau mỗi push (chậm vài phút) — chờ Pages cập nhật rồi mới refresh trên iPhone.
const ghRawBase = 'https://tommm1207.github.io/locket-tommm-studio';

const dvRc = JSON.parse(fs.readFileSync(path.join(dataDir, 'duyvinh_rc_output.json'), 'utf8')).entries;
const vpsRc = JSON.parse(fs.readFileSync(path.join(dataDir, 'vps_firebase.json'), 'utf8')).entries;

// =========================================================================
// 1. TÁCH RIÊNG SCRIPT 1: deleteHeader.js (Nhẹ < 1KB - Chống lỗi 304 cache)
// =========================================================================
const deleteHeaderJs = `// Tommm Private - ETag & Compression Stripper (Force full fresh JSON on RevenueCat & Firebase RC)
if (typeof $request === "undefined" || !$request || !$request.headers) {
    $done({});
} else {
    const headersToStrip = new Set([
        "x-revenuecat-etag",
        "if-none-match",
        "if-modified-since",
        "x-goog-if-none-match",
        "etag",
        "accept-encoding"
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
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_deleteHeader.js'), deleteHeaderJs, 'utf8');

// =========================================================================
// 1b. TÁCH RIÊNG SCRIPT 1b: js_tommm_yt_music.js (Tự động bắt nhạc YouTube / YT Music -> Music Caption)
// =========================================================================
const ytMusicJs = `// Tommm Private - Auto YouTube / YT Music -> Locket Music Caption (v55)
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
        cut = cut.replace(/[\\s(\\[\\-–•,|/]+$/, "").trim();
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
                var m = req.body.match(/"videoId"\\s*:\\s*"([A-Za-z0-9_-]{11})"/);
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

    var isPlaybackUrl = /^https?:\\/\\/(s|www|music|m)\\.youtube\\.com\\/api\\/stats\\/(playback|watchtime|qoe)/i.test(u);
    var isPlayerUrl = /(youtubei\\.googleapis\\.com|music\\.youtube\\.com)\\/youtubei\\/v1\\/(player|get_watch)/i.test(u);

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
    if (/\\/(?:postMoment\\w*|createMoment\\w*)/i.test(u)) {
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
                        body: JSON.stringify({ urlPath: u.replace(/\\?.*$/, "").split("/").slice(-1)[0], matched: true, replacedWith: replacedWith })
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
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_yt_music.js'), ytMusicJs, 'utf8');

// =========================================================================
// 2. TÁCH RIÊNG SCRIPT 2: locket_gold.js (Nhẹ < 3KB - Kích hoạt Locket Gold & FilterPack)
// Chuẩn 100% cấu trúc RevenueCat đã kiểm chứng trên Locket iOS!
// =========================================================================
const locketGoldJs = `// Tommm Private - Locket Gold VIP + Filter Pack (RevenueCat)
// Tự động ghi nhớ đúng ngày người dùng kích hoạt lần đầu bằng $persistentStore!
var obj = JSON.parse($response.body || "{}");
var STORE_KEY = "tommm_locket_gold_first_date";
var PURCHASE_DATE = "";
if (typeof $persistentStore !== "undefined") {
    PURCHASE_DATE = $persistentStore.read(STORE_KEY) || "";
    if (!PURCHASE_DATE) {
        PURCHASE_DATE = new Date().toISOString().replace(/\\.\\d{3}Z$/, "Z");
        $persistentStore.write(PURCHASE_DATE, STORE_KEY);
    }
} else {
    PURCHASE_DATE = new Date().toISOString().replace(/\\.\\d{3}Z$/, "Z");
}
var FAR_FUTURE = "9999-12-07T10:10:14Z";

function makeSub(displayName, amount, currency) {
    return {
        "auto_resume_date": null,
        "display_name": displayName,
        "is_sandbox": true,
        "ownership_type": "PURCHASED",
        "billing_issues_detected_at": null,
        "management_url": "https://apps.apple.com/account/subscriptions",
        "period_type": "normal",
        "price": { "amount": amount, "currency": currency },
        "expires_date": FAR_FUTURE,
        "grace_period_expires_date": null,
        "refunded_at": null,
        "unsubscribe_detected_at": null,
        "original_purchase_date": PURCHASE_DATE,
        "purchase_date": PURCHASE_DATE,
        "store": "app_store",
        "store_transaction_id": "2000001108724193"
    };
}

function makeEnt(prodId) {
    return {
        "grace_period_expires_date": null,
        "purchase_date": PURCHASE_DATE,
        "product_identifier": prodId,
        "expires_date": FAR_FUTURE
    };
}

obj.Attention = "Chào mừng Tommm đến với Locket Gold!";
obj.subscriber = obj.subscriber || {};
obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
obj.subscriber.entitlements = obj.subscriber.entitlements || {};

var goldProduct = "locket_1600_1y";
obj.subscriber.subscriptions[goldProduct] = makeSub(goldProduct, 399000, "VND");
obj.subscriber.entitlements["Gold"] = makeEnt(goldProduct);

var pack20Product = "com.locket.Locket.FilterPack_20Photos_500";
obj.subscriber.subscriptions[pack20Product] = makeSub(pack20Product, 0, "VND");
obj.subscriber.entitlements["effect_pack_20"] = makeEnt(pack20Product);

var reqUrl = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";
var urlMatch = reqUrl.match(/\\/subscribers\\/([^/?#]+)/i);
var rawRcUid = (urlMatch && urlMatch[1]) || (obj.subscriber && obj.subscriber.original_app_user_id) || "";
var decodedRcUid = "";
try { decodedRcUid = decodeURIComponent(String(rawRcUid)); } catch (_) { decodedRcUid = String(rawRcUid); }
if (decodedRcUid && decodedRcUid.indexOf("RCAnonymousID") === -1 && typeof $persistentStore !== "undefined") {
    $persistentStore.write(decodedRcUid, "tommm_my_locket_uid");
}

$done({ body: JSON.stringify(obj) });
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_gold.js'), locketGoldJs, 'utf8');

// =========================================================================
// 3. TÁCH RIÊNG SCRIPT 3: js_tommm_badge.js (Smart Per-User Gold Badge - chỉ gắn đúng UID chủ máy)
// =========================================================================
const locketBadgeJs = `// Tommm Private - Per-User Smart Locket Gold Badge (myUid-Only, Anti-Poison + Recursive User Node Stamp)
function decodeBase64Url(str) {
    var b64 = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    if (typeof atob === "function") {
        return atob(b64);
    }
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var out = "";
    for (var i = 0; i < b64.length; i += 4) {
        var e1 = chars.indexOf(b64.charAt(i));
        var e2 = chars.indexOf(b64.charAt(i + 1));
        var e3 = chars.indexOf(b64.charAt(i + 2));
        var e4 = chars.indexOf(b64.charAt(i + 3));
        var c1 = (e1 << 2) | (e2 >> 4);
        var c2 = ((e2 & 15) << 4) | (e3 >> 2);
        var c3 = ((e3 & 3) << 6) | e4;
        out += String.fromCharCode(c1);
        if (e3 !== 64 && e3 !== -1) out += String.fromCharCode(c2);
        if (e4 !== 64 && e4 !== -1) out += String.fromCharCode(c3);
    }
    return out;
}

function readStore(key) {
    try { return (typeof $persistentStore !== "undefined" ? $persistentStore.read(key) : "") || ""; } catch (_) { return ""; }
}

function writeStore(val, key) {
    try { if (typeof $persistentStore !== "undefined") $persistentStore.write(String(val), key); } catch (_) {}
}

function resolveMyUid() {
    var uid = readStore("tommm_my_locket_uid");
    if (uid && uid.indexOf("RCAnonymousID") !== -1) uid = "";
    try {
        var hdrs = (typeof $request !== "undefined" && $request && $request.headers) ? $request.headers : null;
        if (hdrs) {
            var auth = hdrs["Authorization"] || hdrs["authorization"] || hdrs["X-Firebase-Auth"] || hdrs["x-firebase-auth"] || "";
            var m = String(auth).match(/(?:Bearer\\s+)?([^.\\s]+)\\.([^.\\s]+)\\.([^.\\s]+)/i);
            if (m && m[2]) {
                var jwt = JSON.parse(decodeBase64Url(m[2]));
                var jwtUid = jwt.user_id || jwt.sub || jwt.uid || "";
                if (jwtUid) {
                    uid = String(jwtUid);
                    writeStore(uid, "tommm_my_locket_uid");
                }
            }
        }
    } catch (_) {}
    return uid;
}

function isUserLikeNode(node) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return false;
    return !!(node.uid || node.user_id || node.user_uid || node.username || node.first_name || typeof node.badge !== "undefined" || node.profile_picture_url);
}

function hasPrivateSelfFields(node) {
    return !!(node && (node.email || node.phone_number || typeof node.is_temp !== "undefined" || node.fcm_tokens));
}

function stampBadgesRecursive(node, myUid, isTurnedOff, isChangeProfile, state, depth) {
    if (!node || typeof node !== "object" || depth > 7) return;
    if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) {
            stampBadgesRecursive(node[i], myUid, isTurnedOff, isChangeProfile, state, depth + 1);
        }
        return;
    }
    if (isUserLikeNode(node)) {
        var nodeUid = node.uid || node.user_id || node.user_uid || node.id || "";
        var isMine = false;
        if (isChangeProfile && (node.username || node.first_name || nodeUid || typeof node.badge !== "undefined")) {
            isMine = true;
        } else if (myUid && nodeUid && String(nodeUid) === String(myUid)) {
            isMine = true;
        } else if (hasPrivateSelfFields(node)) {
            isMine = true;
            if (nodeUid && !myUid) {
                myUid = String(nodeUid);
                writeStore(myUid, "tommm_my_locket_uid");
            }
        }
        if (isMine) {
            if (isTurnedOff) {
                node.badge = null;
                node.badge_tier = null;
                node.is_gold = false;
                node.has_gold = false;
                node.subscription_tier = null;
            } else {
                node.badge = "locket_gold";
                node.badge_tier = "gold";
                node.is_gold = true;
                node.has_gold = true;
                node.subscription_tier = "gold";
            }
            if (node.uid || node.first_name || node.username) {
                writeStore(JSON.stringify(node), "tommm_my_user_profile");
            }
            state.changed = true;
        }
    }
    for (var k in node) {
        if (Object.prototype.hasOwnProperty.call(node, k)) {
            var child = node[k];
            if (child && typeof child === "object") {
                stampBadgesRecursive(child, myUid, isTurnedOff, isChangeProfile, state, depth + 1);
            }
        }
    }
}

var myUid = resolveMyUid();
var reqUrl = (typeof $request !== "undefined" && $request && $request.url) ? String($request.url) : "";
var isChangeProfile = reqUrl.indexOf("changeProfileInfo") !== -1;

if (typeof $response === "undefined") {
    if (!isChangeProfile) {
        $done({});
    } else {
        var rawBody = (typeof $request !== "undefined" && $request && $request.body) ? String($request.body) : "";
        if (rawBody.indexOf("badge") === -1) {
            $done({});
        } else {
            var isTurningOff = /"(badge|show_badge|badge_enabled|badge_visible)"\\s*:\\s*(null|false|"")/i.test(rawBody);
            var isTurningOn = !isTurningOff;
            writeStore(isTurningOn ? "ON" : "OFF", "tommm_my_badge_state_v2");
            var badgeVal = isTurningOn ? "locket_gold" : null;
            var tierVal = isTurningOn ? "gold" : null;
            var cachedProfile = {};
            try { cachedProfile = JSON.parse(readStore("tommm_my_user_profile") || "{}") || {}; } catch (_) { cachedProfile = {}; }
            var mergedProfile = Object.assign({}, cachedProfile, {
                "uid": cachedProfile.uid || myUid || undefined,
                "badge": badgeVal,
                "badge_tier": tierVal,
                "is_gold": isTurningOn,
                "success": true
            });
            $done({
                response: {
                    status: 200,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                    body: JSON.stringify({
                        "data": mergedProfile,
                        "result": Object.assign({
                            "status": 200,
                            "badge": badgeVal,
                            "badge_tier": tierVal,
                            "is_gold": isTurningOn,
                            "success": true,
                            "data": mergedProfile
                        }, mergedProfile)
                    })
                }
            });
        }
    }
} else if ($response && $response.body) {
    var badgeState = readStore("tommm_my_badge_state_v2") || "ON";
    var isTurnedOff = badgeState === "OFF";
    try {
        var uObj = JSON.parse($response.body);
        var state = { changed: false };
        stampBadgesRecursive(uObj, myUid, isTurnedOff, isChangeProfile, state, 0);
        if (state.changed) {
            $done({ body: JSON.stringify(uObj) });
        } else {
            $done({});
        }
    } catch (_) {
        $done({});
    }
} else {
    $done({});
}
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_badge.js'), locketBadgeJs, 'utf8');

// =========================================================================
// 4. TÁCH RIÊNG SCRIPT 4: js_tommm_rc.js (Firebase Remote Config - 360+ Captions, Thứ Ngày Đa Ngôn Ngữ, Video 60s, Rollcall & Filter)
// =========================================================================
const dvOverlays = JSON.parse(dvRc.overlay_items);
const vpsOverlays = JSON.parse(vpsRc.overlay_items);

const tommmExclusiveSection = {
    section: "👑 Tommm VIP Exclusive ✨",
    items: [
        { overlay_id: "caption:custom_tommm01", source: "remote", caption: { type: "static_content", text: "Welcome to Tommm's Locket ✨", max_lines: 1, text_color: "#0F172A", icon: { type: "emoji", data: "👑" }, background: { colors: ["#FDE047", "#F59E0B"] } } },
        { overlay_id: "caption:custom_tommm02", source: "remote", caption: { type: "static_content", text: "Tommm Gold Edition 💛", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "⚡" }, background: { colors: ["#1E3A8A", "#3B82F6"] } } },
        { overlay_id: "caption:custom_tommm03", source: "remote", caption: { type: "static_content", text: "Tommm đang rất chill 🎧", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🌙" }, background: { colors: ["#311042", "#8B5CF6"] } } },
        { overlay_id: "caption:custom_tommm04", source: "remote", caption: { type: "static_content", text: "KTX Vibe with Tommm 🏢", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "☕" }, background: { colors: ["#0F766E", "#14B8A6"] } } },
        { overlay_id: "caption:custom_tommm05", source: "remote", caption: { type: "static_content", text: "Gửi ngàn yêu thương từ Tommm 💌", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "💖" }, background: { colors: ["#EC4899", "#F43F5E"] } } },
        { overlay_id: "caption:custom_tommm06", source: "remote", caption: { type: "static_content", text: "Đẹp trai chuẩn Tommm 😎", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🔥" }, background: { colors: ["#EA580C", "#FACC15"] } } },
        { overlay_id: "caption:custom_tommm07", source: "remote", caption: { type: "static_content", text: "100% Private • By Tommm 🛡️", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🔒" }, background: { colors: ["#0F172A", "#334155"] } } }
    ]
};

const weekdayCaptionsSection = {
    section: "📅 Thứ Ngày Đa Ngôn Ngữ (VI • EN • ZH • TW • DE)",
    items: [
        { overlay_id: "caption:custom_dayvi2", source: "remote", caption: { type: "static_content", text: "THỨ HAI", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi3", source: "remote", caption: { type: "static_content", text: "THỨ BA", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi4", source: "remote", caption: { type: "static_content", text: "THỨ TƯ", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi5", source: "remote", caption: { type: "static_content", text: "THỨ NĂM", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi6", source: "remote", caption: { type: "static_content", text: "THỨ SÁU", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi7", source: "remote", caption: { type: "static_content", text: "THỨ BẢY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi8", source: "remote", caption: { type: "static_content", text: "CHỦ NHẬT", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#991B1B", "#DC2626"] } } },
        { overlay_id: "caption:custom_dayen2", source: "remote", caption: { type: "static_content", text: "MONDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen3", source: "remote", caption: { type: "static_content", text: "TUESDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen4", source: "remote", caption: { type: "static_content", text: "WEDNESDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen5", source: "remote", caption: { type: "static_content", text: "THURSDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen6", source: "remote", caption: { type: "static_content", text: "FRIDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen7", source: "remote", caption: { type: "static_content", text: "SATURDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen8", source: "remote", caption: { type: "static_content", text: "SUNDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#BE123C", "#F43F5E"] } } },
        { overlay_id: "caption:custom_dayzh2", source: "remote", caption: { type: "static_content", text: "星期一 • 禮拜一", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh3", source: "remote", caption: { type: "static_content", text: "星期二 • 禮拜二", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh4", source: "remote", caption: { type: "static_content", text: "星期三 • 禮拜三", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh5", source: "remote", caption: { type: "static_content", text: "星期四 • 禮拜四", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh6", source: "remote", caption: { type: "static_content", text: "星期五 • 禮拜五", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh7", source: "remote", caption: { type: "static_content", text: "星期六 • 禮拜六", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh8", source: "remote", caption: { type: "static_content", text: "星期日 • 禮拜天", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#991B1B", "#EF4444"] } } },
        { overlay_id: "caption:custom_dayde2", source: "remote", caption: { type: "static_content", text: "MONTAG", max_lines: 1, text_color: "#0F172A", icon: { type: "emoji", data: "🇩🇪" }, background: { colors: ["#FACC15", "#F59E0B"] } } },
        { overlay_id: "caption:custom_dayde3", source: "remote", caption: { type: "static_content", text: "DIENSTAG", max_lines: 1, text_color: "#0F172A", icon: { type: "emoji", data: "🇩🇪" }, background: { colors: ["#FACC15", "#F59E0B"] } } },
        { overlay_id: "caption:custom_dayde4", source: "remote", caption: { type: "static_content", text: "MITTWOCH", max_lines: 1, text_color: "#0F172A", icon: { type: "emoji", data: "🇩🇪" }, background: { colors: ["#FACC15", "#F59E0B"] } } },
        { overlay_id: "caption:custom_dayde5", source: "remote", caption: { type: "static_content", text: "DONNERSTAG", max_lines: 1, text_color: "#0F172A", icon: { type: "emoji", data: "🇩🇪" }, background: { colors: ["#FACC15", "#F59E0B"] } } },
        { overlay_id: "caption:custom_dayde6", source: "remote", caption: { type: "static_content", text: "FREITAG", max_lines: 1, text_color: "#0F172A", icon: { type: "emoji", data: "🇩🇪" }, background: { colors: ["#FACC15", "#F59E0B"] } } },
        { overlay_id: "caption:custom_dayde7", source: "remote", caption: { type: "static_content", text: "SAMSTAG", max_lines: 1, text_color: "#0F172A", icon: { type: "emoji", data: "🇩🇪" }, background: { colors: ["#FACC15", "#F59E0B"] } } },
        { overlay_id: "caption:custom_dayde8", source: "remote", caption: { type: "static_content", text: "SONNTAG", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇩🇪" }, background: { colors: ["#B91C1C", "#F59E0B"] } } }
    ]
};

const existingTexts = new Set();
for (const sec of dvOverlays) {
    if (sec.section.includes("Duy Vinh")) sec.section = "🎨 Decorative VIP ✨";
    for (const item of (sec.items || [])) {
        if (item.caption && item.caption.text) {
            item.caption.text = item.caption.text.replace(/duyvinh09|duyvinh\.09|duyvinh|tommm09|tommm1207/gi, "Tommm");
            existingTexts.add(item.caption.text.trim().toLowerCase());
        }
        if (item.overlay_id) existingTexts.add(item.overlay_id);
    }
}
for (const sec of vpsOverlays) {
    if (sec.section === "General" || sec.section === "Decorative") continue;
    const uniqueItems = [];
    for (const item of (sec.items || [])) {
        const txt = (item.caption && item.caption.text) ? item.caption.text.trim().toLowerCase() : "";
        if (txt && !existingTexts.has(txt) && !existingTexts.has(item.overlay_id)) {
            uniqueItems.push(item);
            existingTexts.add(txt);
            existingTexts.add(item.overlay_id);
        }
    }
    if (uniqueItems.length > 0) dvOverlays.push({ section: "🎨 " + sec.section, items: uniqueItems });
}
// Bỏ mục Tommm VIP Exclusive, chỉ giữ mục Thứ Ngày Đa Ngôn Ngữ + toàn bộ bộ Caption sạch (đã đổi sang tommm1207)
// Tách riêng các bộ Caption thêm (custom sections) để MERGE thông minh với các Caption ngày lễ mới chính chủ của Locket!
let cloudArchivedItems = [];
const cloudArchivePath = path.join(dataDir, 'archived_official_captions.json');
if (fs.existsSync(cloudArchivePath)) {
    try {
        const parsed = JSON.parse(fs.readFileSync(cloudArchivePath, 'utf8'));
        if (Array.isArray(parsed)) cloudArchivedItems = parsed;
    } catch (_) {}
}
const cloudArchiveSection = cloudArchivedItems.length > 0
    ? [{ section: "✨ Kho Caption Lễ Locket (Cloud)", items: cloudArchivedItems }]
    : [];
const ANIM_BASE = `${ghRawBase}/assets/captions_anim`;
const animatedCaptionsSection = {
    section: "✨ Caption Động (Animated) ❄️",
    items: [
        { overlay_id: "caption:anim_xinchao_muadong", source: "remote", caption: { type: "static_content", text: "Xin Chào Mùa Đông", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "❄️" }, background: { colors: ["#0F3D7A", "#2E90FA"], image: { type: "image", data: `${ANIM_BASE}/snow_blue.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_emy_muadong", source: "remote", caption: { type: "static_content", text: "Em Yêu Mùa Đông", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "⛄" }, background: { colors: ["#0F3D7A", "#2E90FA"], image: { type: "image", data: `${ANIM_BASE}/snow_blue.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_dong_nho_anh", source: "remote", caption: { type: "static_content", text: "Đông Nhớ Anh", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🩵" }, background: { colors: ["#0F3D7A", "#2E90FA"], image: { type: "image", data: `${ANIM_BASE}/snow_blue.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_lanh_ve_lo", source: "remote", caption: { type: "static_content", text: "Lạnh Vê Lờ", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🥶" }, background: { colors: ["#0F3D7A", "#2E90FA"], image: { type: "image", data: `${ANIM_BASE}/snow_blue.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_lanh_the_nho", source: "remote", caption: { type: "static_content", text: "Lạnh Thế Nhờ", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🧣" }, background: { colors: ["#0F3D7A", "#2E90FA"], image: { type: "image", data: `${ANIM_BASE}/snow_blue.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_dong_nho_em", source: "remote", caption: { type: "static_content", text: "Đông Nhớ Em", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "✨" }, background: { colors: ["#2A1459", "#7C3AED"], image: { type: "image", data: `${ANIM_BASE}/snow_purple.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_mua_nhan_ma", source: "remote", caption: { type: "static_content", text: "Mùa Nhãn Mã", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🪄" }, background: { colors: ["#2A1459", "#7C3AED"], image: { type: "image", data: `${ANIM_BASE}/snow_purple.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_yeuthuong_dongday", source: "remote", caption: { type: "static_content", text: "Yêu thương đong đầy", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "💗" }, background: { colors: ["#9D174D", "#F472B6"], image: { type: "image", data: `${ANIM_BASE}/heart_pink.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_day_qua_yeu", source: "remote", caption: { type: "static_content", text: "Đây Quá Yêu", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "💘" }, background: { colors: ["#9D174D", "#F472B6"], image: { type: "image", data: `${ANIM_BASE}/heart_pink.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_tinh_yeu_la_gi", source: "remote", caption: { type: "static_content", text: "Tình yêu là gì", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🖤" }, background: { colors: ["#9D174D", "#F472B6"], image: { type: "image", data: `${ANIM_BASE}/heart_pink.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_top1_locket", source: "remote", caption: { type: "static_content", text: "Top 1 Locket", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🎄" }, background: { colors: ["#7F1D1D", "#EF4444"], image: { type: "image", data: `${ANIM_BASE}/sparkle_red.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_duong_de_tho", source: "remote", caption: { type: "static_content", text: "Đường Dễ Thở", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🎀" }, background: { colors: ["#7F1D1D", "#EF4444"], image: { type: "image", data: `${ANIM_BASE}/sparkle_red.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_xa_kho_tinh", source: "remote", caption: { type: "static_content", text: "Xa Khó Tính", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🌶️" }, background: { colors: ["#7F1D1D", "#EF4444"], image: { type: "image", data: `${ANIM_BASE}/sparkle_red.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_tommm_gold_vip", source: "remote", caption: { type: "static_content", text: "Tommm Gold VIP", max_lines: 1, text_color: "#FEF08A", icon: { type: "emoji", data: "👑" }, background: { colors: ["#291C06", "#B45309"], image: { type: "image", data: `${ANIM_BASE}/gold_shimmer.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_dem_khong_ngu", source: "remote", caption: { type: "static_content", text: "Đêm Không Ngủ", max_lines: 1, text_color: "#22D3EE", icon: { type: "emoji", data: "🎧" }, background: { colors: ["#0F172A", "#6D28D9"], image: { type: "image", data: `${ANIM_BASE}/neon_cyber.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_xuan_ve_roi", source: "remote", caption: { type: "static_content", text: "Xuân Về Rồi", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🌸" }, background: { colors: ["#831843", "#F9A8D4"], image: { type: "image", data: `${ANIM_BASE}/sakura_fall.gif`, source: "url" } } } },
        { overlay_id: "caption:anim_quay_het_minh", source: "remote", caption: { type: "static_content", text: "Quẩy Hết Mình", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🎆" }, background: { colors: ["#090D26", "#312E81"], image: { type: "image", data: `${ANIM_BASE}/fireworks_night.gif`, source: "url" } } } },
    ],
};
const musicCaptionsSection = {
    section: "🎵 Phát Nhạc & Mood 🎧",
    items: [
        { overlay_id: "caption:music_vinyl_chill", source: "remote", caption: { type: "static_content", text: "Đĩa than quay chill", max_lines: 1, text_color: "#FEF08A", icon: { type: "image", data: `${ANIM_BASE}/vinyl_disc_icon.gif`, source: "url" }, background: { colors: ["#0E0C12", "#4A3219"], image: { type: "image", data: `${ANIM_BASE}/music_vinyl_gold.gif`, source: "url" } } } },
        { overlay_id: "caption:music_vinyl_late_night", source: "remote", caption: { type: "static_content", text: "Nhạc khuya tâm trạng", max_lines: 1, text_color: "#FFE4E6", icon: { type: "image", data: `${ANIM_BASE}/vinyl_disc_icon.gif`, source: "url" }, background: { colors: ["#2D0A1B", "#9D174D"], image: { type: "image", data: `${ANIM_BASE}/music_vinyl_rose.gif`, source: "url" } } } },
        { overlay_id: "caption:music_vinyl_mood", source: "remote", caption: { type: "static_content", text: "Thả trôi theo giai điệu", max_lines: 1, text_color: "#FFFFFF", icon: { type: "sf_symbol", data: "music.note" }, background: { colors: ["#0E0C12", "#4A3219"], image: { type: "image", data: `${ANIM_BASE}/music_vinyl_gold.gif`, source: "url" } } } },
        { overlay_id: "caption:music_now_playing", source: "remote", caption: { type: "static_content", text: "Đang nghe nhạc", max_lines: 1, text_color: "#FFFFFF", icon: { type: "sf_symbol", data: "music.note" }, background: { colors: ["#0A1F14", "#14532D"], image: { type: "image", data: `${ANIM_BASE}/music_spotify_eq.gif`, source: "url" } } } },
        { overlay_id: "caption:music_chill_vibes", source: "remote", caption: { type: "static_content", text: "Now Playing • Chill", max_lines: 1, text_color: "#86EFAC", icon: { type: "emoji", data: "🎧" }, background: { colors: ["#0A1F14", "#14532D"], image: { type: "image", data: `${ANIM_BASE}/music_spotify_eq.gif`, source: "url" } } } },
        { overlay_id: "caption:music_replay_all_day", source: "remote", caption: { type: "static_content", text: "Replay bài này cả ngày", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🔁" }, background: { colors: ["#0A1F14", "#14532D"], image: { type: "image", data: `${ANIM_BASE}/music_spotify_eq.gif`, source: "url" } } } },
        { overlay_id: "caption:music_het_buon", source: "remote", caption: { type: "static_content", text: "Nhạc lên là hết buồn", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "✨" }, background: { colors: ["#4C0519", "#BE123C"], image: { type: "image", data: `${ANIM_BASE}/music_apple_pink.gif`, source: "url" } } } },
        { overlay_id: "caption:music_gu_dinh_cao", source: "remote", caption: { type: "static_content", text: "Gu âm nhạc đỉnh cao", max_lines: 1, text_color: "#FFE4E6", icon: { type: "emoji", data: "🔥" }, background: { colors: ["#4C0519", "#BE123C"], image: { type: "image", data: `${ANIM_BASE}/music_apple_pink.gif`, source: "url" } } } },
        { overlay_id: "caption:music_gui_bai_hat", source: "remote", caption: { type: "static_content", text: "Gửi bạn một bài hát", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "💌" }, background: { colors: ["#4C0519", "#BE123C"], image: { type: "image", data: `${ANIM_BASE}/music_apple_pink.gif`, source: "url" } } } },
        { overlay_id: "caption:music_lofi_khuya", source: "remote", caption: { type: "static_content", text: "Lofi đêm khuya", max_lines: 1, text_color: "#E0E7FF", icon: { type: "emoji", data: "🌙" }, background: { colors: ["#1E1B4B", "#5B21B6"], image: { type: "image", data: `${ANIM_BASE}/music_lofi_violet.gif`, source: "url" } } } },
        { overlay_id: "caption:music_vibe_hom_nay", source: "remote", caption: { type: "static_content", text: "Vibe hôm nay", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🎶" }, background: { colors: ["#1E1B4B", "#5B21B6"], image: { type: "image", data: `${ANIM_BASE}/music_lofi_violet.gif`, source: "url" } } } },
        { overlay_id: "caption:music_doi_em", source: "remote", caption: { type: "static_content", text: "Một chút nhạc cho đời êm", max_lines: 1, text_color: "#C4B5FD", icon: { type: "emoji", data: "🎹" }, background: { colors: ["#1E1B4B", "#5B21B6"], image: { type: "image", data: `${ANIM_BASE}/music_lofi_violet.gif`, source: "url" } } } },
        { overlay_id: "caption:music_bat_nhac_chill", source: "remote", caption: { type: "static_content", text: "Bật nhạc lên chill thôi", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "📻" }, background: { colors: ["#0A1F14", "#14532D"], image: { type: "image", data: `${ANIM_BASE}/music_spotify_eq.gif`, source: "url" } } } },
    ],
};
const customExtraSections = [musicCaptionsSection, animatedCaptionsSection].concat(cloudArchiveSection).concat([weekdayCaptionsSection]).concat(
    dvOverlays.filter(s => !s.section.includes("General") && !s.section.includes("Decorative by Locket"))
);

// Use DuyVinh's proven compact camera_filter_config structure, pointing images to Tommm's GitHub!
const dvFilterCfg = JSON.parse(dvRc.camera_filter_config);
const removeIds = new Set(["sticker_binh_luan_minh_tue", "cmt_locket"]);
dvFilterCfg.remote_filters = (dvFilterCfg.remote_filters || []).filter(rf => !removeIds.has(rf.id)).map(rf => {
    const isAi = fs.existsSync(path.join(baseDir, 'assets', 'ai', `${rf.id}.png`));
    const sub = isAi ? 'ai' : 'frames';
    const cloudUrl = `${ghRawBase}/assets/${sub}/${rf.id}.png`;
    rf.imageUrl = cloudUrl;
    rf.iconUrl = cloudUrl;
    rf.overlayImageUrl = cloudUrl;
    rf.overlayImageURL = cloudUrl;
    if (rf.icon) {
        rf.icon.url = cloudUrl;
        rf.icon.iconUrl = cloudUrl;
        rf.icon.remoteImage = cloudUrl;
    }
    return rf;
});
dvFilterCfg.picker_filters = (dvFilterCfg.picker_filters || []).filter(id => !removeIds.has(id));
for (const sec of (dvFilterCfg.sheet_filters || [])) {
    sec.filter_ids = (sec.filter_ids || []).filter(id => !removeIds.has(id));
}

// Move infrastructure/upload keys to default-only map so live server upload pipeline is never overwritten blindly
const defaultOnlyRcEntries = {};
for (const dk of [
    "upload_main",
    "cdn_domain_replacements",
    "cdn_domain_replacements_video",
    "storage_bucket",
    "storage_bucket_video",
    "camera_filter_storage_bucket",
    "firestore_refresh_v2",
    "firestore_refresh_v3",
]) {
    if (dvRc[dk] !== undefined) {
        defaultOnlyRcEntries[dk] = dvRc[dk];
    }
}
defaultOnlyRcEntries["overlay_navigator_enabled"] = "true";
defaultOnlyRcEntries["overlays_v2_config"] = JSON.stringify({ suggestions_enabled: true });
defaultOnlyRcEntries["journal_activity_bar_enabled"] = "true";
defaultOnlyRcEntries["streak_config"] = JSON.stringify({ minimum_recovery_count: 0, minimum_display_count: 0 });
defaultOnlyRcEntries["camera_microphone_enabled"] = "true";
defaultOnlyRcEntries["microphone_enabled"] = "true";
defaultOnlyRcEntries["video_sound_enabled"] = "true";
defaultOnlyRcEntries["zoom_enabled"] = "true";

// Surgical baseRcEntries: ONLY overwrite verified Gold, Ads-removal, Telemetry, Paywall, Cache & Badge keys —
// never clobber Locket 2.74.0's live Camera UI / Navigation / A-B flags!
const baseRcEntries = {};
for (const gk of [
    "upsell_features", "paywall_presentation_config", "android_subscribe_gold_button_enabled",
    "profile_badge_visible", "lunar_new_year_app_icon_enabled", "star_sign_caption_image_url",
    "history_ads_mode", "history_ads_prefetch_count", "history_ads_prefetch_immediate",
    "history_ads_prefetch_reroute", "history_ads_dynamic_insertion", "history_ads_refresh_prefetch_on_foreground",
    "history_ads_floor_price", "history_ads_floor_price_att", "history_ad_log_displayed_on_background",
    "history_ads_debug_menu", "history_ads_nimbus_interceptors", "history_ads_nimbus_formats",
    "sentry_sample_rate", "sentry_network_tracing", "sentry_performance_tracking",
    "sentry_trace_sample_rate", "sentry_profiles_sample_rate",
    "max_friends_count", "friend_limit_mode", "soft_friend_limit_threshold_count",
    "show_friend_limit_on_cam", "signup_max_friends_count", "celebrity_inbox_limit",
    "celebrity_inbox_enabled", "celebrity_vip_qr_redemption_enabled",
    "moment_views_enabled", "moment_views_v2", "record_moment_views", "notify_moment_views",
    "captions_enabled", "music_caption_enabled", "music_caption_song_preview_enabled",
    "link_caption_link_enabled", "rollcall_enabled", "rollcall_profile_button",
    "camera_filter_fetch_cache_max_age_seconds"
]) {
    if (dvRc[gk] !== undefined) baseRcEntries[gk] = dvRc[gk];
}
baseRcEntries["profile_badge_visible"] = "true";
baseRcEntries["beta_features_enabled"] = "true";
baseRcEntries["flag_27"] = "0";
baseRcEntries["zoom_enabled"] = "true";
baseRcEntries["camera_microphone_enabled"] = "true";
baseRcEntries["microphone_enabled"] = "true";
baseRcEntries["overlay_navigator_enabled"] = "true";
baseRcEntries["overlays_v2_config"] = JSON.stringify({
    suggestions_enabled: true,
    logging_enabled: false,
    remember_suggestions: false,
    fetch_from_server: false
});
baseRcEntries["captions_enabled"] = "true";
baseRcEntries["music_caption_enabled"] = "true";
baseRcEntries["music_caption_song_preview_enabled"] = "true";
baseRcEntries["video_sound_enabled"] = "true";
baseRcEntries["audio_session_deactivation_enabled"] = "true";
baseRcEntries["fetch_users_from_cloud_function"] = "true";
baseRcEntries["user_cache_max_age_sec"] = "172800";
baseRcEntries["friends_cache_max_age_sec"] = "2592000";
baseRcEntries["camera_filter_fetch_cache_max_age_seconds"] = "2592000";
baseRcEntries["refresh_interval"] = "0";

// Video 45s & Clean Camera Roll Video RC keys (camera, camera_roll, camera_config, live_photos được JSON-merge runtime).
baseRcEntries["longer_camera_roll_videos_enabled"] = "true";
baseRcEntries["camera_roll_preview_enabled"] = "true";
baseRcEntries["camera_roll_video_enabled"] = "true";
baseRcEntries["camera_roll_video_upload_enabled"] = "true";
baseRcEntries["internal_camera_roll_video_upload_enabled"] = "true";
baseRcEntries["can_record_long_video"] = "true";
baseRcEntries["camera_roll_video_max_duration"] = "45";
baseRcEntries["camera_roll_max_duration"] = "45";
baseRcEntries["camera_roll_duration"] = "45";
baseRcEntries["video_max_duration"] = "45";
baseRcEntries["max_video_duration"] = "45";
baseRcEntries["video_duration"] = "45";
baseRcEntries["video_length_seconds"] = "45";
baseRcEntries["max_video_length"] = "45";
baseRcEntries["max_video_length_seconds"] = "45";
baseRcEntries["longer_video_max_duration"] = "45";
baseRcEntries["trim_max_duration"] = "45";
baseRcEntries["video_trim_max_duration"] = "45";
baseRcEntries["gold_max_duration"] = "45";
baseRcEntries["quality_mbps"] = "0.42";
baseRcEntries["qualityMbps"] = "0.42";
baseRcEntries["camera_quality_mbps"] = "0.5";
baseRcEntries["camera_roll_quality_mbps"] = "0.42";
baseRcEntries["video_quality_mbps"] = "0.42";
baseRcEntries["video_bitrate"] = "420000";
baseRcEntries["bitrate"] = "420000";
baseRcEntries["upload_main_image_quality"] = "0.6";
baseRcEntries["upload_thumbnail_image_quality"] = "0.8";
baseRcEntries["rollcall_share_templates"] = JSON.stringify({ "templates": ["bold", "pop_off", "stacking", "full_screen", "shadow_box", "collage", "pop_collage"], "random_order": false });
baseRcEntries["time_travel_rewind_v2_share_templates"] = JSON.stringify({ "templates": ["rounded_square", "grid_collage", "cutout_collage", "rounded_square_bold", "wall_calendar"], "random_order": false });
baseRcEntries["feature_discovery_popup_config"] = JSON.stringify({
    "tag": "LOCKET GOLD",
    "tag_gradient": true,
    "tag_style": "gold_gradient",
    "title": "✨Tommm✨",
    "feature_set": [{
        "title": "Trải nghiệm Locket Gold nào! 💛",
        "body": "Đã mở khoá thành công Locket Gold! Hãy lưu giữ khoảnh khắc đáng nhớ và tận hưởng các tính năng cao cấp nhé!",
        "imageURL": "https://tommm1207.github.io/locket-tommm-studio/assets/welcome_icon.png"
    }],
    "primary_button_title": "Bắt đầu ngay",
    "campaign": "locket_gold_welcome_by_tommm_v15",
    "start_at": "2020-01-01T00:00:00",
    "end_at": "2099-12-31T23:59:59",
    "use_local_time_zone": true
});
// Build clean PNG Frame & 4-Cut Photobooth filter definitions (handled by Tommm Cloudflare Worker, 100% original face)
const framesManifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'frames_manifest.json'), 'utf8'));
const mergedFilterCfg = JSON.parse(fs.readFileSync(path.join(dataDir, 'merged_camera_filter_config.json'), 'utf8'));
const filterMetaById = new Map();
for (const rf of (dvFilterCfg.remote_filters || [])) {
    const id = rf.id || rf.uid;
    if (id && !removeIds.has(id)) filterMetaById.set(id, rf);
}
for (const rf of (mergedFilterCfg.remote_filters || [])) {
    const id = rf.id || rf.uid;
    if (id && !removeIds.has(id) && !filterMetaById.has(id)) filterMetaById.set(id, rf);
}

const aiHotIds = [
    "stk_tai_tho", "stk_mu_ngu_khoc", "stk_jollibee", "stk_nak_ve_than",
    "stk_gojo_satoru", "stk_shopee_food", "fireworks", "harry_potter",
    "minecraft", "fire_flame", "giant_spider", "ocean_underwater",
    "ufo_alien", "sweat_hearts", "volcano_lava", "rain_storm",
    "fortnite_llama", "watercolor_art", "golden_hour"
];
const extraAiIds = [
    "rose_flower", "shrek_ogre", "superhero_cape", "spooky_ghost",
    "pirate_hat", "jungle_leaf", "cute_zombie"
];
const allCustomAiIds = aiHotIds.concat(extraAiIds);

const compactAiFilters = allCustomAiIds.map(id => {
    const src = filterMetaById.get(id) || {};
    const colors = Array.isArray(src.colors) && src.colors.length >= 2 ? src.colors : ["#EC4899", "#F59E0B"];
    const emoji = (src.icon && src.icon.emoji) || "✨";
    return [id, src.name || id, colors[0], colors[1], emoji];
});

const compactLutFilters = [];
const lutIds = [];

const photoboothIds = [
    "photobooth_4cut", "photobooth_cute", "frame_berry_days", "frame_happy_snap", "frame_sky_diary",
    "pb_holo_4cut", "pb_scrapbook_ripped_4cut", "pb_ripped_paper_4cut", "pb_denim_ripped_2x2",
    "pb_cortis_4cut", "pb_cortis_v1", "pb_cortis_v2", "pb_ech_xanh", "pb_galaxy",
    "pb_meo_dang_yeu_4cut", "pb_photobooth_hello_kitty", "pb_shinchan_4cut", "pb_strawberry",
    "pb_supperman_4cut", "pb_trung_bac_thao", "pb_vien_hello_kitty", "pb_vintage"
].filter(id => framesManifest[id]);

const singleFrameIds = Object.keys(framesManifest).filter(id => !photoboothIds.includes(id) && !id.startsWith("nm_") && !id.startsWith("fx_"));

const nmFrameMeta = {
    nm_polaroid_vintage: { name: "Polaroid Vintage", colors: ["#F5ECD8", "#9A7B56"], emoji: "📸", sfSymbol: "photo.on.rectangle" },
    nm_giang_sinh_len_am: { name: "Giáng Sinh Len Ấm", colors: ["#A81C24", "#F8ECD2"], emoji: "🧶", sfSymbol: "snowflake" },
    nm_soulmate: { name: "Soulmate", colors: ["#1C121A", "#F472B6"], emoji: "💞", sfSymbol: "heart.fill" },
    nm_love_postcard: { name: "Love Postcard", colors: ["#DC3044", "#2563EB"], emoji: "💌", sfSymbol: "envelope.fill" },
    nm_giang_sinh_tuan_loc: { name: "Giáng Sinh Tuần Lộc", colors: ["#882C18", "#FBBF24"], emoji: "🦌", sfSymbol: "sparkles" },
    nm_giang_sinh_selfie: { name: "Giáng Sinh Selfie", colors: ["#B91C1C", "#22C55E"], emoji: "🎄", sfSymbol: "camera.fill" },
    nm_ho_ho_ho: { name: "Ho Ho Ho!", colors: ["#DC2626", "#15803D"], emoji: "🎅", sfSymbol: "gift.fill" },
    nm_chung_minh_la_ban: { name: "Chúng Mình Là Bạn", colors: ["#F43F5E", "#FFF1F2"], emoji: "🤝", sfSymbol: "person.2.fill" },
    nm_son_tung_mtp: { name: "Sơn Tùng MTP", colors: ["#FE2C55", "#20D5EC"], emoji: "💬", sfSymbol: "text.bubble.fill" },
    nm_ronaldo_siuuu: { name: "Ronaldo SIUUU", colors: ["#DC2626", "#F59E0B"], emoji: "⚽", sfSymbol: "text.bubble.fill" },
    nm_phai_luon_tu_te: { name: "Phải Luôn Tử Tế", colors: ["#10B981", "#A7F3D0"], emoji: "🌿", sfSymbol: "text.bubble.fill" },
    nm_chi_can_mot_vet_xuoc: { name: "Chỉ Cần Một Vết Xước", colors: ["#F59E0B", "#1F2937"], emoji: "⚡", sfSymbol: "text.bubble.fill" },
    nm_trend_tic_toc: { name: "Trend Tíc Tóc", colors: ["#0EA5E9", "#FE2C55"], emoji: "🎵", sfSymbol: "text.bubble.fill" },
    nm_ai_cho_xinh_vay: { name: "Ai Cho Xinh Vậy", colors: ["#EC4899", "#FBCFE8"], emoji: "💖", sfSymbol: "text.bubble.fill" },
    nm_tam_cuoi_dang_dang: { name: "Tấm Cuối Đáng Đăng", colors: ["#7C3AED", "#C4B5FD"], emoji: "✨", sfSymbol: "text.bubble.fill" },
    nm_locket_camera: { name: "Locket Camera", colors: ["#111827", "#EF4444"], emoji: "📷", sfSymbol: "viewfinder" },
    nm_spotify_pc: { name: "Spotify PC", colors: ["#121212", "#1ED760"], emoji: "🎧", sfSymbol: "music.note" },
    nm_spotify_hong: { name: "Spotify Hồng", colors: ["#FDE2EE", "#EC4899"], emoji: "💗", sfSymbol: "music.note" },
    nm_fuji_film: { name: "Fuji Film", colors: ["#101212", "#22C55E"], emoji: "🎞️", sfSymbol: "film" },
    nm_gay_meter: { name: "Gay Meter Random", colors: ["#EC4899", "#3B82F6"], emoji: "🌈", sfSymbol: "sparkles" },
    nm_chua_som: { name: "Chưa Sớm", colors: ["#0F172A", "#6366F1"], emoji: "🌙", sfSymbol: "moon.stars.fill" },
    nm_bang_tin_khan: { name: "Bảng Tin Khẩn", colors: ["#DC2626", "#FACC15"], emoji: "🚨", sfSymbol: "tv.fill" },
    nm_ve_gui_xe: { name: "Vé Gửi Xe", colors: ["#FEF08A", "#E11D48"], emoji: "🎫", sfSymbol: "ticket.fill" },
    nm_vo_hoc_sinh: { name: "Vở Học Sinh", colors: ["#FEFCE8", "#1E3A8A"], emoji: "📒", sfSymbol: "book.fill" },
    nm_giao_vien_cham_bai: { name: "Giáo Viên Chấm Bài", colors: ["#FFFFFF", "#DC2626"], emoji: "✍️", sfSymbol: "pencil" },
    nm_nhiem_vu_hom_nay: { name: "Nhiệm Vụ Hôm Nay", colors: ["#1D4ED8", "#38BDF8"], emoji: "⚔️", sfSymbol: "checkmark.seal.fill" },
    nm_hoa_don_di_choi: { name: "Hóa Đơn Đi Chơi", colors: ["#F8FAFC", "#DC2626"], emoji: "🧾", sfSymbol: "doc.text.fill" },
    nm_khong_can_ai_duyet: { name: "Không Cần Ai Duyệt", colors: ["#1E293B", "#38BDF8"], emoji: "😎", sfSymbol: "quote.bubble.fill" },
    nm_ban_la_gi: { name: "Bạn Là Gì?", colors: ["#9D174D", "#F9A8D4"], emoji: "✨", sfSymbol: "quote.bubble.fill" },
    nm_ong_troi_that_bat_cong: { name: "Ông Trời Thật Bất Công", colors: ["#581C87", "#C084FC"], emoji: "🌩️", sfSymbol: "quote.bubble.fill" },
    nm_yeu_giau_chu_co_phai: { name: "Yêu Giấu Chứ Có Phải...", colors: ["#BE123C", "#FDA4AF"], emoji: "💗", sfSymbol: "quote.bubble.fill" },
    nm_me_con_em_don_anh_ve: { name: "Mẹ Con Em Đón Anh Về", colors: ["#B45309", "#FDE047"], emoji: "🚗", sfSymbol: "quote.bubble.fill" },
    nm_meo_meme: { name: "Mèo Meme", colors: ["#B45309", "#FEF08A"], emoji: "🐱", sfSymbol: "face.smiling" },
    nm_hai_trai_cay: { name: "Hái Trái Cây", colors: ["#FEF9C3", "#16A34A"], emoji: "🍓", sfSymbol: "leaf.fill" },
    fx_ca_cute: { name: "Cá Cute", colors: ["#A855F7", "#F472B6"], emoji: "🐠", sfSymbol: "sparkles" },
    fx_mua_roi: { name: "Mưa Rơi", colors: ["#1E3A8A", "#38BDF8"], emoji: "🌧️", sfSymbol: "cloud.rain.fill" },
    fx_giot_nuoc: { name: "Giọt Nước", colors: ["#0369A1", "#BAE6FD"], emoji: "💧", sfSymbol: "drop.fill" },
    fx_bong_bong: { name: "Bong Bóng", colors: ["#4C1D95", "#F472B6"], emoji: "🫧", sfSymbol: "bubbles.and.sparkles.fill" },
    fx_canh_hoa: { name: "Cánh Hoa", colors: ["#9D174D", "#FBCFE8"], emoji: "🌸", sfSymbol: "sparkles" },
    fx_tuyet_roi: { name: "Tuyết Rơi", colors: ["#1E3A8A", "#E0F2FE"], emoji: "❄️", sfSymbol: "snowflake" },
    fx_sticker_doodle: { name: "Sticker Mặt", colors: ["#BE185D", "#FDE047"], emoji: "✨", sfSymbol: "face.smiling" },
    fx_cau_vong: { name: "Cầu Vồng", colors: ["#6D28D9", "#FACC15"], emoji: "🌈", sfSymbol: "rainbow" },
    fx_buom_xinh: { name: "Bướm Xinh", colors: ["#4338CA", "#F9A8D4"], emoji: "🦋", sfSymbol: "sparkles" },
    fx_sao_lap_lanh: { name: "Lấp Lánh", colors: ["#B45309", "#FEF08A"], emoji: "🌟", sfSymbol: "sparkle" },
    nm_boi_do_hay_den: { name: "Hôm Nay Đỏ Hay Đen?", colors: ["#450A0A", "#FACC15"], emoji: "🎴", sfSymbol: "sparkles" },
    nm_boi_duyen_tinh: { name: "Đường Tình Duyên", colors: ["#831843", "#F9A8D4"], emoji: "💘", sfSymbol: "heart.fill" },
    nm_boi_nay_nen_an_gi: { name: "Nay Nên Ăn Gì?", colors: ["#78350F", "#FBBF24"], emoji: "🍜", sfSymbol: "fork.knife" },
    nm_boi_xem_que: { name: "Xem Quẻ Hôm Nay", colors: ["#2E1065", "#C084FC"], emoji: "🔮", sfSymbol: "moon.stars.fill" }
};
const nmFrameIds = Object.keys(nmFrameMeta);

const v2FilterSpecs = [
    // Tính Năng Locket (Special FX)
    ["clock_weekday_overlay", "Giờ & Thứ Trên Ảnh", "#1E3A8A", "#38BDF8", "clock.fill", "🕒"],
    ["portrait_bokeh", "Xóa Phông Chân Dung", "#7C2D12", "#F59E0B", "camera.aperture", "📸"],
    ["cctv_camera", "Camera An Ninh CCTV", "#064E3B", "#10B981", "video.fill", "📹"],
    ["triple_clone", "Phân Thân 3 Bóng", "#4C1D95", "#EC4899", "sparkles", "👥"],
    // Meme Giải Trí (AI)
    ["ai_cong_chua_phong_tro", "Công Chúa Phòng Trọ", "#BE185D", "#F9A8D4", "crown.fill", "👸"],
    ["ai_hoang_tu_ktx", "Hoàng Tử KTX", "#1D4ED8", "#60A5FA", "crown.fill", "🤴"],
    ["ai_lop_truong", "Lốp Trưởng", "#0F766E", "#2DD4BF", "circle.circle.fill", "🛞"],
    ["ai_di_phu_ho", "Đi Phụ Hồ", "#B45309", "#FBBF24", "hammer.fill", "🧱"],
    ["ai_ve_que_nuoi_ca", "Về Quê Nuôi Cá", "#15803D", "#4ADE80", "leaf.fill", "🐟"],
    // Trend Hot Mạng Xã Hội (AI)
    ["ai_figure_1_7", "Mô Hình Figure 1/7", "#EA580C", "#FDBA74", "cube.fill", "🗿"],
    ["ai_action_figure_box", "Hộp Action Figure", "#0284C7", "#38BDF8", "shippingbox.fill", "📦"],
    ["ai_lego_figure", "Nhân Vật LEGO", "#D97706", "#FDE047", "square.grid.2x2", "🧱"],
    ["ai_cartoon_3d", "Hoạt Hình 3D", "#7E22CE", "#C084FC", "sparkles", "🎨"],
    ["ai_polaroid_string", "Polaroid Treo Dây", "#9A3412", "#FB923C", "photo.on.rectangle", "🖼️"],
    // Nghề Nghiệp & Shipper (AI)
    ["ai_shipper_giao_hang", "Shipper Giao Hàng", "#DC2626", "#FB923C", "box.truck.fill", "🛵"],
    ["ai_grab_driver", "Tài Xế Grab", "#15803D", "#22C55E", "car.fill", "🏍️"],
    ["ai_xanh_sm", "Tài Xế Xanh SM", "#0E7490", "#22D3EE", "bolt.car.fill", "🚕"],
    ["ai_bac_si", "Bác Sĩ Tận Tâm", "#0369A1", "#7DD3FC", "cross.case.fill", "🩺"],
    // Tổng Tài & Phú Bà (AI)
    ["ai_tong_tai", "Tổng Tài Bá Đạo", "#111827", "#4B5563", "briefcase.fill", "💼"],
    ["ai_phu_ba", "Phú Bà Sang Chảnh", "#78350F", "#F59E0B", "diamond.fill", "💎"],
    ["ai_thieu_gia", "Thiếu Gia Sành Điệu", "#991B1B", "#EF4444", "star.fill", "🕶️"],
    ["ai_du_thuyen", "Du Thuyền Triệu Đô", "#1E40AF", "#38BDF8", "sailboat.fill", "🛥️"],
    ["ai_old_money", "Phong Cách Old Money", "#57534E", "#D6D3D1", "crown.fill", "🥂"],
    // Xinh Lung Linh & Hóa Trang (AI)
    ["ai_makeup_idol", "Makeup Idol Hàn Quốc", "#DB2777", "#F472B6", "sparkles", "💄"],
    ["ai_trang_diem_duyen", "Trang Điểm Douyin", "#9F1239", "#FB7185", "sparkles", "🌸"],
    ["ai_doi_kieu_toc", "Thay Đổi Kiểu Tóc", "#7C3AED", "#A78BFA", "scissors", "💇"],
    ["ai_doi_mau_toc", "Thay Đổi Màu Tóc", "#0D9488", "#5EEAD4", "paintpalette.fill", "🎨"],
    ["ai_cosplay_wibu", "Cosplay Wibu", "#4338CA", "#818CF8", "wand.and.stars", "🎭"],
    ["ai_hau_gai", "Trang Phục Hầu Gái", "#1E293B", "#F43F5E", "heart.fill", "🎀"],
    ["ai_hoang_thuong", "Hoàng Thượng", "#B45309", "#FDE047", "crown.fill", "🐉"],
    ["ai_idol_kpop", "Idol KPOP", "#9333EA", "#F472B6", "music.note", "🎤"],
    ["ai_mua_xuan", "Mùa Xuân", "#EC4899", "#FBCFE8", "sparkles", "🌸"],
    ["ai_mua_he", "Mùa Hè", "#0284C7", "#7DD3FC", "sun.max.fill", "☀️"],
    ["ai_mua_thu", "Mùa Thu", "#EA580C", "#FDBA74", "leaf.fill", "🍁"],
    ["ai_mua_dong", "Mùa Đông", "#1D4ED8", "#DBEAFE", "snowflake", "❄️"],
    ["ai_masterchef", "MasterChef", "#334155", "#F8FAFC", "flame.fill", "👨‍🍳"],
    ["ai_csgt", "CSGT", "#CA8A04", "#FEF08A", "shield.fill", "👮"],
    ["nm_faker", "Faker", "#111115", "#DC2626", "crown.fill", "🏆"],
    ["nm_mona_lisa", "Mona Lisa", "#926622", "#FACC15", "photo.artframe", "🖼️"],
    // Hiệu Ứng Méo Mặt & Hài Hước (0-AI)
    ["warp_big_head", "Đầu To Khổng Lồ", "#2563EB", "#60A5FA", "face.smiling", "🤯"],
    ["warp_tiny_face", "Mặt Nhỏ Tí Hon", "#7C3AED", "#C084FC", "face.smiling", "🤏"],
    ["warp_alien_vline", "Mặt Dài V-Line Alien", "#059669", "#34D399", "sparkles", "👽"],
    ["warp_hamster", "Má Phính Hamster", "#D97706", "#FBBF24", "face.smiling", "🐹"],
    ["warp_bug_eyes", "Mắt Trố Cá Vàng", "#DC2626", "#F87171", "eye.fill", "👀"],
    ["warp_wide_mouth", "Miệng Rộng Ngoác", "#DB2777", "#F472B6", "mouth.fill", "👄"],
    ["warp_chubby", "Mặt Phệ Béo Ú", "#EA580C", "#FDBA74", "face.smiling", "🐷"],
    ["warp_gigachad", "Mặt Vuông GigaChad", "#334155", "#94A3B8", "square.fill", "🗿"],
    ["warp_swirl", "Mặt Xoắn Ốc", "#4F46E5", "#38BDF8", "tornado", "🌀"],
    ["warp_melt", "Mặt Tan Chảy", "#0D9488", "#A3E635", "drop.fill", "🫠"],
    ["warp_fisheye", "Mắt Cá 0.5x (Fisheye)", "#0369A1", "#38BDF8", "camera.aperture", "🐟"],
    ["warp_fisheye_dazz", "Dazz Fisheye Tròn", "#1E1B4B", "#EC4899", "circle.circle.fill", "👁️"],
    // Máy Ảnh Dazz Cam & Màu Film (0-AI LUT)
    ["dazz_cpm35", "Dazz CPM35", "#92400E", "#F59E0B", "camera.fill", "📷"],
    ["dazz_classic_u", "Dazz Classic U", "#1F2937", "#6B7280", "camera.fill", "📸"],
    ["dazz_fqs", "Dazz FQS", "#065F46", "#34D399", "camera.fill", "🎞️"],
    ["dazz_inst_c", "Dazz Inst C", "#9D174D", "#F472B6", "camera.fill", "🕹️"],
    ["dazz_grd", "Dazz GRD Đen Trắng", "#111827", "#D1D5DB", "camera.fill", "🖤"],
    ["lut_kodak_portra", "Kodak Portra 400", "#B45309", "#FDE68A", "camera.filters", "🎞️"],
    ["lut_fuji_superia", "Fuji Superia 200", "#047857", "#6EE7B7", "camera.filters", "📷"],
    ["lut_kodak_gold", "Kodak Gold 200", "#CA8A04", "#FEF08A", "camera.filters", "✨"],
    ["lut_cinestill_800t", "Cinestill 800T", "#1E3A8A", "#F43F5E", "camera.filters", "🌃"],
    ["lut_kodak_am", "Kodak Ấm Áp", "#9A3412", "#FDBA74", "camera.filters", "🌅"],
    ["lut_fuji_chrome", "Fuji Chrome", "#0F766E", "#99F6E4", "camera.filters", "🏞️"],
    ["lut_vintage", "Vintage Cổ Điển", "#78350F", "#D6D3D1", "camera.filters", "🕰️"],
    ["nm_nau_co_dien", "Nâu Cổ Điển", "#78441E", "#D69E5C", "camera.filters", "🤎"],
    ["nm_dem_xanh", "Đêm Xanh", "#0F172A", "#2563EB", "moon.stars.fill", "🌃"],
    ["nm_film_35mm", "Film 35mm", "#B45309", "#FBBF24", "film", "🎞️"],
    ["nm_xam_matte", "Xám Matte", "#334155", "#94A3B8", "camera.filters", "🖤"],
    // Làm Đẹp & Tone Da (0-AI LUT)
    ["lut_iphone_beauty", "Sáng Mịn Tự Nhiên", "#0284C7", "#BAE6FD", "sparkles", "✨"],
    ["lut_film_han", "Film Hàn Quốc", "#BE185D", "#FBCFE8", "sparkles", "🎀"],
    ["lut_trang_sua", "Trắng Sữa Mịn", "#9333EA", "#E9D5FF", "sparkles", "🥛"],
    ["lut_phim_nhat", "Fuji Nhật Bản", "#0F766E", "#CCFBF1", "sparkles", "🌸"],
    ["lut_hong_dao", "Hồng Đào Sữa", "#E11D48", "#FECDD3", "sparkles", "🍑"],
    ["lut_matcha", "Matcha Trong Trẻo", "#16A34A", "#BBF7D0", "sparkles", "🍵"],
    ["lut_ulzzang_pink", "Hồng Phấn Ulzzang", "#EC4899", "#FCE7F3", "sparkles", "🌷"],
    ["lut_nang_ban_mai", "Nắng Ban Mai", "#EA580C", "#FEF3C7", "sun.max.fill", "☀️"],
    ["lut_tone_lanh", "Tone Lạnh Chảnh Sả", "#2563EB", "#DBEAFE", "snowflake", "❄️"],
    ["lut_kem_bo", "Kem Bơ Creamy", "#D97706", "#FEF9C3", "sparkles", "🧁"],
];

const customFrameGroups = [
    { id: "group_weekday_depth", title: { en: "📅 Thứ Ngày & Giờ", vi: "📅 Thứ Ngày & Giờ" }, filter_ids: ["clock_weekday_overlay", "weekday_depth", "weekday_depth_en", "weekday_depth_zh", "weekday_depth_tw", "weekday_depth_ja", "weekday_depth_ko", "weekday_depth_es", "weekday_depth_fr", "weekday_depth_de"] },
    { id: "group_fx_stickers", title: { en: "🫧 Sticker & Thời Tiết Trước Mặt", vi: "🫧 Sticker & Thời Tiết Trước Mặt" }, filter_ids: ["fx_ca_cute", "fx_mua_roi", "fx_giot_nuoc", "fx_bong_bong", "fx_canh_hoa", "fx_tuyet_roi", "fx_sticker_doodle", "fx_cau_vong", "fx_buom_xinh", "fx_sao_lap_lanh"] },
    { id: "group_ai_seasons", title: { en: "🍂 AI Bốn Mùa", vi: "🍂 AI Bốn Mùa" }, filter_ids: ["ai_mua_xuan", "ai_mua_he", "ai_mua_thu", "ai_mua_dong"] },
    { id: "group_hot_ai_3d", title: { en: "Hiệu Ứng AI 3D Hot 🔥", vi: "Hiệu Ứng AI 3D Hot 🔥" }, filter_ids: aiHotIds },
    { id: "group_meme_ai", title: { en: "😂 Meme Giải Trí", vi: "😂 Meme Giải Trí" }, filter_ids: ["ai_cong_chua_phong_tro", "ai_hoang_tu_ktx", "ai_lop_truong", "ai_di_phu_ho", "ai_ve_que_nuoi_ca"] },
    { id: "group_trend_ai", title: { en: "🔥 Trend Hot Mạng Xã Hội", vi: "🔥 Trend Hot Mạng Xã Hội" }, filter_ids: ["ai_figure_1_7", "ai_action_figure_box", "ai_lego_figure", "ai_cartoon_3d", "ai_polaroid_string"] },
    { id: "group_job_ai", title: { en: "🛵 Nghề Nghiệp & Shipper", vi: "🛵 Nghề Nghiệp & Shipper" }, filter_ids: ["ai_shipper_giao_hang", "stk_shopee_food", "ai_grab_driver", "ai_xanh_sm", "ai_bac_si", "ai_masterchef", "ai_csgt"] },
    { id: "group_boi_toan", title: { en: "🔮 Bói Toán & Quẻ Hôm Nay", vi: "🔮 Bói Toán & Quẻ Hôm Nay" }, filter_ids: ["nm_boi_do_hay_den", "nm_boi_duyen_tinh", "nm_boi_nay_nen_an_gi", "nm_boi_xem_que"] },
    { id: "group_luxury_ai", title: { en: "👑 Tổng Tài & Phú Bà", vi: "👑 Tổng Tài & Phú Bà" }, filter_ids: ["ai_tong_tai", "ai_phu_ba", "ai_thieu_gia", "ai_du_thuyen", "ai_old_money"] },
    { id: "group_beauty_ai", title: { en: "💖 Xinh Lung Linh & Hóa Trang", vi: "💖 Xinh Lung Linh & Hóa Trang" }, filter_ids: ["ai_makeup_idol", "ai_trang_diem_duyen", "ai_doi_kieu_toc", "ai_doi_mau_toc", "ai_cosplay_wibu", "ai_hau_gai", "ai_hoang_thuong", "ai_idol_kpop"] },
    { id: "group_warp_fun", title: { en: "🤪 Hiệu Ứng Méo Mặt & Mắt Cá", vi: "🤪 Hiệu Ứng Méo Mặt & Mắt Cá" }, filter_ids: ["triple_clone", "warp_fisheye", "warp_fisheye_dazz", "warp_big_head", "warp_tiny_face", "warp_alien_vline", "warp_hamster", "warp_bug_eyes", "warp_wide_mouth", "warp_chubby", "warp_gigachad", "warp_swirl", "warp_melt"] },
    { id: "group_retro_lut", title: { en: "📷 Máy Ảnh Retro & Màu Film", vi: "📷 Máy Ảnh Retro & Màu Film" }, filter_ids: ["cctv_camera", "nm_nau_co_dien", "nm_dem_xanh", "nm_film_35mm", "nm_xam_matte", "dazz_cpm35", "dazz_classic_u", "dazz_fqs", "dazz_inst_c", "dazz_grd", "warp_fisheye_dazz", "warp_fisheye", "lut_kodak_portra", "lut_fuji_superia", "lut_kodak_gold", "lut_cinestill_800t", "lut_kodak_am", "lut_fuji_chrome", "lut_vintage"] },
    { id: "group_beauty_lut", title: { en: "🌸 Làm Đẹp & Tone Da", vi: "🌸 Làm Đẹp & Tone Da" }, filter_ids: ["portrait_bokeh", "lut_iphone_beauty", "lut_film_han", "lut_trang_sua", "lut_phim_nhat", "lut_hong_dao", "lut_matcha", "lut_ulzzang_pink", "lut_nang_ban_mai", "lut_tone_lanh", "lut_kem_bo"] },
    { id: "group_nm_cdm", title: { en: "💬 Cư Dân Mạng Nói Gì", vi: "💬 Cư Dân Mạng Nói Gì" }, filter_ids: ["nm_son_tung_mtp", "nm_ronaldo_siuuu", "nm_phai_luon_tu_te", "nm_chi_can_mot_vet_xuoc", "nm_trend_tic_toc", "nm_ai_cho_xinh_vay", "nm_tam_cuoi_dang_dang"] },
    { id: "group_nm_khung_hot", title: { en: "🖼️ Khung Viền Hot Trend", vi: "🖼️ Khung Viền Hot Trend" }, filter_ids: ["nm_locket_camera", "nm_spotify_pc", "nm_spotify_hong", "nm_fuji_film", "nm_polaroid_vintage", "nm_soulmate", "nm_love_postcard"] },
    { id: "group_nm_trend_hot", title: { en: "🔥 Trend Hot", vi: "🔥 Trend Hot" }, filter_ids: ["nm_gay_meter", "nm_chua_som", "nm_bang_tin_khan", "nm_ve_gui_xe", "nm_vo_hoc_sinh", "nm_giao_vien_cham_bai", "nm_nhiem_vu_hom_nay", "nm_hoa_don_di_choi"] },
    { id: "group_nm_tam_trang", title: { en: "😏 Tâm Trạng & Cà Khịa", vi: "😏 Tâm Trạng & Cà Khịa" }, filter_ids: ["nm_khong_can_ai_duyet", "nm_ban_la_gi", "nm_ong_troi_that_bat_cong", "nm_yeu_giau_chu_co_phai", "nm_me_con_em_don_anh_ve"] },
    { id: "group_nm_rap_xiec", title: { en: "🤡 Rạp Xiếc Trung Ương", vi: "🤡 Rạp Xiếc Trung Ương" }, filter_ids: ["nm_meo_meme", "nm_faker", "nm_hai_trai_cay", "nm_mona_lisa"] },
    { id: "group_nm_boba", title: { en: "🎄 Giáng Sinh & Bộ Ba Bá Đạo", vi: "🎄 Giáng Sinh & Bộ Ba Bá Đạo" }, filter_ids: ["nm_giang_sinh_len_am", "nm_giang_sinh_tuan_loc", "nm_giang_sinh_selfie", "nm_ho_ho_ho", "nm_chung_minh_la_ban"] },
    { id: "group_photobooth", title: { en: "Khung & Photobooth 📸", vi: "Khung & Photobooth 📸" }, filter_ids: photoboothIds },
    { id: "group_frames", title: { en: "Khung Viền & Hot Trend 🖼️", vi: "Khung Viền & Hot Trend 🖼️" }, filter_ids: singleFrameIds }
];
const frameOnlyIds = photoboothIds.concat(singleFrameIds, nmFrameIds);
const customFrameIds = [
    "nm_son_tung_mtp", "nm_spotify_pc", "nm_polaroid_vintage", "nm_bang_tin_khan",
    "clock_weekday_overlay", "portrait_bokeh", "cctv_camera", "triple_clone",
    "warp_fisheye", "warp_fisheye_dazz",
    "weekday_depth", "weekday_depth_en", "weekday_depth_zh", "weekday_depth_tw", "weekday_depth_ja", "weekday_depth_ko", "weekday_depth_es", "weekday_depth_fr", "weekday_depth_de",
    "dazz_cpm35", "lut_iphone_beauty", "warp_big_head", "ai_cong_chua_phong_tro"
].concat(aiHotIds.slice(0, 4), photoboothIds.slice(0, 4));

const customRemoteFilters = frameOnlyIds.map(id => {
    const src = filterMetaById.get(id) || nmFrameMeta[id] || {};
    const cloudUrl = `${ghRawBase}/assets/frames/${id}.png`;
    const is4Cut = !!(framesManifest[id] && framesManifest[id].is4Cut);
    return {
        uid: id,
        id: id,
        name: src.name || id,
        prompt: id,
        style: src.style || "cutout",
        type: "normal",
        filterType: src.filterType || "normal",
        overlay: true,
        imageUrl: cloudUrl,
        iconUrl: cloudUrl,
        overlayImageUrl: cloudUrl,
        overlayImageURL: cloudUrl,
        tintColor: src.tintColor || (is4Cut ? "#FFD6E0" : "#93C5FD"),
        colors: Array.isArray(src.colors) && src.colors.length ? src.colors : (is4Cut ? ["#FFD6E0", "#FFE4EC"] : ["#60A5FA", "#F472B6"]),
        captureButtonColors: Array.isArray(src.captureButtonColors) && src.captureButtonColors.length ? src.captureButtonColors : (is4Cut ? ["#FFD6E0", "#FFE4EC"] : ["#60A5FA", "#F472B6"]),
        icon: {
            url: cloudUrl,
            iconUrl: cloudUrl,
            remoteImage: cloudUrl,
            sfSymbol: (src.icon && src.icon.sfSymbol) || (is4Cut ? "square.grid.2x2" : "photo.on.rectangle"),
            symbol: (src.icon && src.icon.symbol) || (is4Cut ? "square.grid.2x2" : "photo.on.rectangle"),
            emoji: (src.icon && src.icon.emoji) || (is4Cut ? "📸" : "🖼️")
        },
        outputUrl: null,
        productUrl: null,
        textColor: src.textColor || "#FFFFFF",
        referenceImages: []
    };
});
const compactFrames = customRemoteFilters.map(rf => [
    rf.id,
    rf.name,
    rf.colors[0],
    rf.colors[1],
    framesManifest[rf.id].is4Cut ? 1 : 0
]);
const knownBaseIds = [];
for (const s of dvOverlays.slice(0, 3)) {
    for (const it of (s.items || [])) {
        if (it && it.overlay_id && !knownBaseIds.includes(it.overlay_id)) knownBaseIds.push(it.overlay_id);
    }
}
for (const extraId of ["caption:locket_count", "caption:be_mine", "caption:happy_weekend"]) {
    if (!knownBaseIds.includes(extraId)) knownBaseIds.push(extraId);
}

// Fallback Filter config chỉ gồm các Filter chính chủ của Locket (phòng khi Firebase trả NO_CHANGE nên không có liveFilterCfg)
const nativeGroups = (dvFilterCfg.sheet_filters || []).filter(g => !["group_hot_ai_3d", "group_dazz_lut", "group_photobooth", "group_frames"].includes(g.id));
const nativeIds = [];
for (const g of nativeGroups) {
    for (const id of (g.filter_ids || [])) {
        if (!nativeIds.includes(id)) nativeIds.push(id);
    }
}
const fallbackFilterCfg = {
    allows_custom_filters: true,
    show_filter_button: true,
    sheet_enabled: true,
    open_sheet_immediately: true,
    sheet_filters: nativeGroups,
    filter_groups: dvFilterCfg.filter_groups || [],
    picker_filters: nativeIds,
    remote_filters: []
};

// Không ghi đè cứng overlay_items, camera_filter_config & feature_gates để giữ nguyên 100%
// Caption ngày lễ mới nhất, Filter chính chủ, VÀ TOÀN BỘ feature_gates native của Locket 2.74.0.
// (feature_gates được MERGE động trong runtime script phía dưới — KHÔNG ghi đè bằng snapshot cũ,
//  nếu không sẽ nuốt mất các gate mới như camera_roll_video / photo_library_video / Dazz Cam.)
delete baseRcEntries["overlay_items"];
delete baseRcEntries["camera_filter_config"];
delete baseRcEntries["feature_gates"];
delete baseRcEntries["feature_gates_override"];
// Danh sách gate Gold cần ÉP BẬT, merge lên trên feature_gates LIVE của server (không xoá gate nào).
// Chỉ gồm các gate THẬT mà binary Locket 2.74.0 đọc (đã đối chiếu RC gốc) — bỏ các tên bịa.
const TOMMM_FORCE_GATES = [
    "app_icon_picker", "camera_roll", "camera_roll_video", "camera_roll_video_30s", "camera_roll_video_upload",
    "photo_library_video", "can_upload_30s_video", "can_record_30s_video",
    "video", "video_30s", "video_60s", "longer_video", "longer_video_30s", "extended_video_30s",
    "camera_timer", "self_timer", "timer", "countdown_timer",
    "cameras", "camera_picker", "camera_switcher", "camera_selector", "camera_effects", "camera_fx",
    "vintage_cameras", "digital_cameras", "instant_cameras", "special_cameras", "locket_cameras", "retro_cam",
    "capture_modes", "capture_styles", "live_camera_filters",
    "point_and_shoot", "disposable", "vhs", "noir", "fisheye", "daydream", "bubblegum", "lofi", "atlas_35mm", "home_movie",
    "digicam", "retro_camera", "retro_cameras", "film_camera", "film_cameras",
    "camera_lenses", "lenses", "camera_modes", "dazz_cam", "vintage_camera",
    "camera_presets", "presets", "camera_luts", "luts", "lut", "camera_styles",
    "analog_camera", "disposable_camera", "film_presets", "live_filters", "realtime_filters",
    "camera_lut_picker", "lut_picker", "color_filters",
    "camera_zoom", "zoom",
    "camera_filter_sheet", "camera_filters", "camera_filter", "filter", "filters",
    "photo_filters", "ai_filters", "ar_filters", "face_filters",
    "camera_filter_button", "custom_filters", "create_filter",
    "holiday_effects", "holiday_filters", "camera_theme",
    "locket_views", "long_captions", "remove_ads", "priority_support",
    "custom_widget_frames", "streak_recovery", "streak_reminders",
    "profile_badge", "gold_badge", "locket_gold_badge", "user_badge", "badge", "unlimited_friends"
];
baseRcEntries["overlay_dynamic_captions"] = JSON.stringify([
    "standard", "poll", "color_palette", "review", "quote", "breaking_news",
    "music", "location", "weather", "time", "streak", "star_sign",
    "party_time", "locket_count", "good_morning", "goodnight", "ootd", "miss_you",
    "custom", "halloween_2026"
]);
baseRcEntries["show_filter_button"] = "true";
baseRcEntries["camera_filters_enabled"] = "true";
baseRcEntries["ai_filters_enabled"] = "true";
baseRcEntries["camera_filter_button_enabled"] = "true";
baseRcEntries["allows_custom_filters"] = "true";

const locketRcJs = `// Tommm1207 Private - Firebase Remote Config (Tự động giữ Caption ngày lễ mới & Filter chính chủ Locket + Gộp bộ Caption mở rộng)
(function() {
var RC_VER = "64";
var rcFinished = false;
function finishOnce(res) {
    if (rcFinished) return;
    rcFinished = true;
    try { $done(res || {}); } catch (_) {}
}
function writeRcStore(v, k) {
    try { if (typeof $persistentStore !== "undefined") $persistentStore.write(String(v), k); } catch (_) {}
}
var obj = {};
try { obj = JSON.parse($response.body || "{}"); } catch (_) { obj = {}; }
if (!obj || typeof obj !== "object") obj = {};
var rawState = String(obj.state || "");
var hasLiveEntries = !!(obj.entries && typeof obj.entries === "object" && Object.keys(obj.entries).length > 10);

// CRITICAL GOLDEN RULE: Never wipe Remote Config on NO_CHANGE or empty entries!
if (!hasLiveEntries || rawState === "NO_CHANGE") {
    finishOnce({});
    return;
}
obj.state = "UPDATE";
obj.entries = obj.entries || {};

// 1. Lưu lại overlay_items và camera_filter_config CHÍNH CHỦ mới nhất từ server Locket (không ghi cache thừa vào $persistentStore)
var liveOverlayItems = [];
try {
    if (obj.entries["overlay_items"]) liveOverlayItems = JSON.parse(obj.entries["overlay_items"]);
} catch (_) { liveOverlayItems = []; }

var liveFilterCfg = null;
try {
    if (obj.entries["camera_filter_config"]) liveFilterCfg = JSON.parse(obj.entries["camera_filter_config"]);
} catch (_) { liveFilterCfg = null; }

// 2. Áp dụng toàn bộ cấu hình Locket Gold (Video 45s, Rollcall Strip, Tắt quảng cáo, Popup chào mừng Tommm)
try {
    var liveStreak = JSON.parse(obj.entries["streak_config"] || "{}");
    liveStreak.minimum_recovery_count = 0;
    liveStreak.minimum_display_count = 0;
    obj.entries["streak_config"] = JSON.stringify(liveStreak);
} catch (_) {}

// 2b. MERGE feature_gates: GIỮ NGUYÊN toàn bộ gate native mà server Locket trả về,
// tự động bật các gate dương tính (timer/zoom/preset/lut/dazz/retro/lens) + ép bật TOMMM_FORCE_GATES.
var TOMMM_FORCE_GATES = ${JSON.stringify(TOMMM_FORCE_GATES)};
var liveGates = {};
try { liveGates = JSON.parse(obj.entries["feature_gates"] || "{}"); } catch (_) { liveGates = {}; }
if (!liveGates || typeof liveGates !== "object") liveGates = {};
for (var gk in liveGates) {
    if (Object.prototype.hasOwnProperty.call(liveGates, gk) && !/disable|legacy|hide|kill|block|deprecat|suppress|ads|ad_|sentry|debug|log|limit|upsell|paywall|require|lock/i.test(gk) && /camera|timer|zoom|countdown|dazz|digi|retro|film|lens|preset|lut|color_filter|live_filter|analog|vintage|disposable|instant|vhs|fisheye|capture_mode|capture_style|shader|point_and_shoot|daydream|bubblegum|lofi|noir/i.test(gk)) {
        var gv = liveGates[gk];
        if (gv === "disabled" || gv === "off" || gv === false) liveGates[gk] = "enabled";
    }
}
for (var fgi = 0; fgi < TOMMM_FORCE_GATES.length; fgi++) {
    liveGates[TOMMM_FORCE_GATES[fgi]] = "enabled";
}
obj.entries["feature_gates"] = JSON.stringify(liveGates);

// Tự động bật các key dương tính top-level nếu server trả false/disabled cho camera/timer/zoom/preset/lut/dazz/retro/lens
for (var ek in obj.entries) {
    if (Object.prototype.hasOwnProperty.call(obj.entries, ek) && !/disable|legacy|hide|kill|block|deprecat|suppress|ads|ad_|sentry|debug|log|limit|upsell|paywall|require|lock/i.test(ek) && /camera|timer|zoom|countdown|dazz|digi|retro|film|lens|preset|lut|color_filter|live_filter|analog|vintage|disposable|instant|vhs|fisheye|capture_mode|capture_style|shader|point_and_shoot|daydream|bubblegum|lofi|noir/i.test(ek)) {
        if (obj.entries[ek] === "false") obj.entries[ek] = "true";
        else if (obj.entries[ek] === "disabled") obj.entries[ek] = "enabled";
    }
}

// Điền default-only cho các key hạ tầng upload/storage/mic/zoom nếu server chưa trả
var TOMMM_DEFAULTS = ${JSON.stringify(defaultOnlyRcEntries)};
for (var dk in TOMMM_DEFAULTS) {
    if (Object.prototype.hasOwnProperty.call(TOMMM_DEFAULTS, dk) && typeof obj.entries[dk] === "undefined") {
        obj.entries[dk] = TOMMM_DEFAULTS[dk];
    }
}

var TOMMM_ENTRIES = ${JSON.stringify(baseRcEntries)};
Object.assign(obj.entries, TOMMM_ENTRIES);

// JSON-merge camera (chỉ giữ các key Codable đã kiểm chứng trên Locket để iOS không từ chối giải mã camera JSON)
try {
    var camObj = {};
    try { camObj = JSON.parse(obj.entries["camera"] || "{}"); } catch (_) { camObj = {}; }
    if (!camObj || typeof camObj !== "object" || Array.isArray(camObj)) camObj = {};
    Object.assign(camObj, {
        gold_max_duration: 45,
        max_duration: 45,
        ultra_wide: true,
        telephoto: true,
        flash_button: true,
        volume_button: true,
        srgb: true,
        lanczos: true,
        quality_mbps: 0.5
    });
    obj.entries["camera"] = JSON.stringify(camObj);
} catch (_) {}

try {
    if (typeof obj.entries["camera_config"] === "string") {
        var camCfgObj = JSON.parse(obj.entries["camera_config"]);
        if (camCfgObj && typeof camCfgObj === "object" && !Array.isArray(camCfgObj)) {
            camCfgObj.gold_max_duration = 45;
            camCfgObj.max_duration = 45;
            obj.entries["camera_config"] = JSON.stringify(camCfgObj);
        }
    }
} catch (_) {}

try {
    var crObj = {};
    try { crObj = JSON.parse(obj.entries["camera_roll"] || "{}"); } catch (_) { crObj = {}; }
    if (!crObj || typeof crObj !== "object") crObj = {};
    delete crObj["goldMaxDuration"];
    delete crObj["videoMaxDuration"];
    delete crObj["maxDuration"];
    delete crObj["cameraRollMaxDuration"];
    delete crObj["qualityMbps"];
    delete crObj["flash_button"];
    Object.assign(crObj, {
        gold_max_duration: 45,
        max_duration: 45,
        video_max_duration: 45,
        quality_mbps: 0.42
    });
    obj.entries["camera_roll"] = JSON.stringify(crObj);
} catch (_) {}

try {
    var lpObj = {};
    try { lpObj = JSON.parse(obj.entries["live_photos"] || "{}"); } catch (_) { lpObj = {}; }
    if (!lpObj || typeof lpObj !== "object") lpObj = {};
    Object.assign(lpObj, {
        capture: true,
        video: true,
        viewing: true
    });
    obj.entries["live_photos"] = JSON.stringify(lpObj);
} catch (_) {}

// 3. Tự động lưu vĩnh viễn mọi Caption LỄ/SỰ KIỆN mới chính chủ của Locket (chỉ ghi $persistentStore khi thật sự có ID mới!)
var EXTRA_SECTIONS = ${JSON.stringify(customExtraSections)};
var BASE_FALLBACK_OVERLAYS = ${JSON.stringify(dvOverlays.slice(0, 1))};
var knownStaticIds = {};
var baseKnownList = ${JSON.stringify(knownBaseIds)};
for (var bk = 0; bk < baseKnownList.length; bk++) knownStaticIds[baseKnownList[bk]] = true;
for (var fb = 0; fb < BASE_FALLBACK_OVERLAYS.length; fb++) {
    var fbItems = BASE_FALLBACK_OVERLAYS[fb].items || [];
    for (var fi = 0; fi < fbItems.length; fi++) {
        if (fbItems[fi] && fbItems[fi].overlay_id) knownStaticIds[fbItems[fi].overlay_id] = true;
    }
}
for (var es = 0; es < EXTRA_SECTIONS.length; es++) {
    var esItems = EXTRA_SECTIONS[es].items || [];
    for (var ei = 0; ei < esItems.length; ei++) {
        if (esItems[ei] && esItems[ei].overlay_id) knownStaticIds[esItems[ei].overlay_id] = true;
    }
}

var mergedOverlays = Array.isArray(liveOverlayItems) && liveOverlayItems.length > 0 ? liveOverlayItems.slice() : BASE_FALLBACK_OVERLAYS.slice();
if (mergedOverlays.length > 0 && mergedOverlays[0]) {
    var liveGen = Array.isArray(mergedOverlays[0].items) ? mergedOverlays[0].items : [];
    var genById = {};
    for (var gi = 0; gi < liveGen.length; gi++) {
        if (liveGen[gi] && liveGen[gi].overlay_id) genById[liveGen[gi].overlay_id] = liveGen[gi];
    }
    var reqGen = [
        "caption:standard", "caption:music", "caption:poll", "caption:color_palette", "caption:review",
        "caption:quote", "caption:breaking_news", "caption:location",
        "caption:weather", "caption:time", "caption:streak", "caption:star_sign"
    ];
    var rebuiltGen = [];
    var usedGen = {};
    for (var ri = 0; ri < reqGen.length; ri++) {
        var gid = reqGen[ri];
        var cType = gid.slice(8);
        var exItem = genById[gid];
        rebuiltGen.push(exItem
            ? Object.assign({}, exItem, { sort_order: ri })
            : { overlay_id: gid, source: "local", caption: { type: cType }, sort_order: ri });
        usedGen[gid] = true;
    }
    for (var li = 0; li < liveGen.length; li++) {
        var lit = liveGen[li];
        if (lit && lit.overlay_id && !usedGen[lit.overlay_id]) {
            rebuiltGen.push(lit);
            usedGen[lit.overlay_id] = true;
        }
    }
    mergedOverlays[0] = Object.assign({}, mergedOverlays[0], { items: rebuiltGen });
}
var seenOverlayIds = {};
var archivedItems = [];
try {
    if (typeof $persistentStore !== "undefined") {
        var rawArch = $persistentStore.read("tommm_saved_official_captions");
        if (rawArch) archivedItems = JSON.parse(rawArch);
        if (!Array.isArray(archivedItems)) archivedItems = [];
    }
} catch (_) { archivedItems = []; }

var archivedIds = {};
for (var k = 0; k < archivedItems.length; k++) {
    if (archivedItems[k] && archivedItems[k].overlay_id) archivedIds[archivedItems[k].overlay_id] = true;
}

var archiveChanged = false;
for (var a = 0; a < mergedOverlays.length; a++) {
    var secItems = mergedOverlays[a].items || [];
    for (var b = 0; b < secItems.length; b++) {
        var cur = secItems[b];
        if (cur && cur.overlay_id) {
            seenOverlayIds[cur.overlay_id] = true;
            if (!knownStaticIds[cur.overlay_id] && !archivedIds[cur.overlay_id] && archivedItems.length < 250) {
                archivedIds[cur.overlay_id] = true;
                archivedItems.push(cur);
                archiveChanged = true;
            }
        }
    }
}
if (archiveChanged && typeof $persistentStore !== "undefined") {
    try { $persistentStore.write(JSON.stringify(archivedItems), "tommm_saved_official_captions"); } catch (_) {}
}

// Khôi phục lại các Caption chính chủ đã lưu từ các dịp trước (nếu Locket vừa gỡ khỏi server)
var restoredItems = [];
for (var r = 0; r < archivedItems.length; r++) {
    var ar = archivedItems[r];
    if (ar && ar.overlay_id && !seenOverlayIds[ar.overlay_id]) {
        seenOverlayIds[ar.overlay_id] = true;
        restoredItems.push(ar);
    }
}
if (restoredItems.length > 0) {
    mergedOverlays.push({ section: "⭐ Đã Lưu Tự Động (Locket)", items: restoredItems });
}

for (var i = 0; i < EXTRA_SECTIONS.length; i++) {
    var secObj = EXTRA_SECTIONS[i];
    var rawItems = secObj.items || [];
    var isMusicSec = !!(secObj.section && secObj.section.indexOf("Phát Nhạc") !== -1);
    if (isMusicSec) {
        var formatRcTrackLabel = function(t, a, maxLen) {
            var ts = String(t || "").trim();
            var as = String(a || "").trim();
            var comb = ts;
            if (as && ts.indexOf(" - ") === -1 && ts.indexOf(" – ") === -1 && ts.toLowerCase().indexOf(as.toLowerCase()) === -1) {
                comb = ts + " - " + as;
            }
            if (comb.length <= maxLen) return comb;
            var cut = comb.slice(0, maxLen - 1);
            var sp = cut.lastIndexOf(" ");
            if (sp >= Math.floor(maxLen * 0.55)) cut = cut.slice(0, sp);
            return cut.replace(/[\\s(\\[\\-–•,|/]+$/, "").trim() + "…";
        };
        var ytLabel = "YouTube • Tự gắn bài đang nghe";
        var ytVinylLabel = "Đĩa than • Tự gắn bài đang nghe";
        var ytColors = ["#991B1B", "#DC2626"];
        var VINYL_ICON_DEF = "https://tommm1207.github.io/locket-tommm-studio/assets/captions_anim/vinyl_disc_icon.gif";
        var ytIcon = { type: "image", data: VINYL_ICON_DEF, source: "url" };
        var hasActiveYt = false;
        try {
            if (typeof $persistentStore !== "undefined") {
                var rawYt = $persistentStore.read("tommm_yt_now_playing");
                if (rawYt) {
                    var yt = JSON.parse(rawYt);
                    if (yt && yt.title && (!yt.ts || (Date.now() - yt.ts) < 2700000)) {
                        hasActiveYt = true;
                        ytLabel = formatRcTrackLabel(yt.title, yt.artist, 28);
                        ytVinylLabel = ytLabel;
                        if (Array.isArray(yt.colors) && yt.colors.length >= 2) ytColors = yt.colors.slice(0, 2);
                        if (yt.artworkUrl) ytIcon = { type: "image", data: yt.artworkUrl, source: "url" };
                    }
                }
            }
        } catch (_) {}
        var c0Hex = String(ytColors[0] || "#991B1B").replace(/[^0-9a-fA-F]/g, "") || "991B1B";
        var c1Hex = String(ytColors[1] || "#DC2626").replace(/[^0-9a-fA-F]/g, "") || "DC2626";
        var ytWaveBg = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev/studio/vinyl-bg.gif?c0=" + c0Hex + "&c1=" + c1Hex + "&mode=wave&v=2";
        var ytPeekBg = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev/studio/vinyl-bg.gif?c0=" + c0Hex + "&c1=" + c1Hex + "&mode=peek&v=2";
        rawItems = [
            {
                overlay_id: "caption:yt_vinyl_spin",
                source: "remote",
                caption: {
                    type: "static_content",
                    text: hasActiveYt ? ytVinylLabel : "Đĩa than • Tự gắn bài đang nghe",
                    max_lines: 1,
                    text_color: "#FFFFFF",
                    icon: { type: "image", data: VINYL_ICON_DEF, source: "url" },
                    background: {
                        colors: ytColors,
                        image: { type: "image", data: ytWaveBg, source: "url" }
                    }
                }
            },
            {
                overlay_id: "caption:yt_now_playing",
                source: "remote",
                caption: {
                    type: "static_content",
                    text: ytLabel,
                    max_lines: 1,
                    text_color: "#FFFFFF",
                    icon: ytIcon,
                    background: {
                        colors: ytColors,
                        image: { type: "image", data: ytPeekBg, source: "url" }
                    }
                }
            }
        ].concat(rawItems);
    }
    var cleanItems = [];
    for (var j = 0; j < rawItems.length; j++) {
        var it = rawItems[j];
        if (it && it.overlay_id && !seenOverlayIds[it.overlay_id]) {
            seenOverlayIds[it.overlay_id] = true;
            cleanItems.push(it);
        }
    }
    if (cleanItems.length > 0) {
        if (isMusicSec && mergedOverlays.length >= 1) {
            mergedOverlays.splice(1, 0, { section: secObj.section, items: cleanItems });
        } else {
            mergedOverlays.push({ section: secObj.section, items: cleanItems });
        }
    }
}
obj.entries["overlay_items"] = JSON.stringify(mergedOverlays);

// 4. Luôn bật nút AI / Filter CHÍNH CHỦ của Locket + AI 3D Hot (FLUX.2) + Dazz Cam & LUT (0ms) + Khung Viền & Photobooth 4 ô
var ASSETS_BASE = "https://tommm1207.github.io/locket-tommm-studio/assets/";
var ABASE = ASSETS_BASE + "ai/";
var FBASE = ASSETS_BASE + "frames/";
var F2BASE = ASSETS_BASE + "filters_v2/";
var CUSTOM_FRAME_GROUPS = ${JSON.stringify(customFrameGroups)};
var CUSTOM_FRAME_IDS = ${JSON.stringify(customFrameIds)};
var CUSTOM_AI_SPECS = ${JSON.stringify(compactAiFilters)};
var CUSTOM_LUT_SPECS = ${JSON.stringify(compactLutFilters)};
var CUSTOM_FRAME_SPECS = ${JSON.stringify(compactFrames)};
var CUSTOM_V2_SPECS = ${JSON.stringify(v2FilterSpecs)};
var CUSTOM_REMOTE_FILTERS = [];
function pushCustomFilter(id, name, c0, c1, fUrl, sfSym, emoji) {
    CUSTOM_REMOTE_FILTERS.push({
        uid: id,
        id: id,
        name: name,
        prompt: id,
        style: "cutout",
        type: "normal",
        filterType: "normal",
        overlay: true,
        imageUrl: fUrl,
        iconUrl: fUrl,
        overlayImageUrl: fUrl,
        overlayImageURL: fUrl,
        tintColor: c0,
        colors: [c0, c1],
        captureButtonColors: [c0, c1],
        icon: {
            url: fUrl,
            iconUrl: fUrl,
            remoteImage: fUrl,
            sfSymbol: sfSym,
            symbol: sfSym,
            emoji: emoji
        },
        outputUrl: null,
        productUrl: null,
        textColor: "#FFFFFF",
        referenceImages: []
    });
}
for (var ca = 0; ca < CUSTOM_AI_SPECS.length; ca++) {
    var ap = CUSTOM_AI_SPECS[ca];
    pushCustomFilter(ap[0], ap[1], ap[2], ap[3], ABASE + ap[0] + ".png", "sparkles", ap[4]);
}
for (var cl = 0; cl < CUSTOM_LUT_SPECS.length; cl++) {
    var lp = CUSTOM_LUT_SPECS[cl];
    pushCustomFilter(lp[0], lp[1], lp[2], lp[3], ASSETS_BASE + lp[5], "camera.filters", lp[4]);
}
for (var cf = 0; cf < CUSTOM_FRAME_SPECS.length; cf++) {
    var sp = CUSTOM_FRAME_SPECS[cf];
    var is4 = sp[4] === 1;
    var cfIconUrl = (sp[0].indexOf("nm_") === 0 || sp[0].indexOf("fx_") === 0) ? (F2BASE + sp[0] + ".png?v=10") : (FBASE + sp[0] + ".png");
    pushCustomFilter(sp[0], sp[1], sp[2], sp[3], cfIconUrl, is4 ? "square.grid.2x2" : "photo.on.rectangle", is4 ? "📸" : "🖼️");
}
for (var cv = 0; cv < CUSTOM_V2_SPECS.length; cv++) {
    var vp = CUSTOM_V2_SPECS[cv];
    pushCustomFilter(vp[0], vp[1], vp[2], vp[3], F2BASE + vp[0] + ".png?v=10", vp[4], vp[5]);
}
pushCustomFilter("weekday_depth", "Thứ Sau Chủ Thể (VI)", "#243B53", "#FFFFFF", FBASE + "weekday_depth.png", "calendar", "🇻🇳");
pushCustomFilter("weekday_depth_en", "Day Depth (EN)", "#1E3A8A", "#60A5FA", FBASE + "weekday_depth_en.png?v=4", "calendar", "🇬🇧");
pushCustomFilter("weekday_depth_zh", "星期景深 (CN)", "#991B1B", "#F87171", FBASE + "weekday_depth_zh.png?v=4", "calendar", "🇨🇳");
pushCustomFilter("weekday_depth_tw", "星期景深 (TW)", "#7C2D12", "#FB923C", FBASE + "weekday_depth_tw.png?v=5", "calendar", "🇹🇼");
pushCustomFilter("weekday_depth_ja", "曜日深度 (JP)", "#9F1239", "#FDA4AF", FBASE + "weekday_depth_ja.png?v=5", "calendar", "🇯🇵");
pushCustomFilter("weekday_depth_ko", "요일 깊이 (KR)", "#1D4ED8", "#93C5FD", FBASE + "weekday_depth_ko.png?v=5", "calendar", "🇰🇷");
pushCustomFilter("weekday_depth_es", "Día Depth (ES)", "#B45309", "#FCD34D", FBASE + "weekday_depth_es.png?v=4", "calendar", "🇪🇸");
pushCustomFilter("weekday_depth_fr", "Jour Depth (FR)", "#1E40AF", "#BFDBFE", FBASE + "weekday_depth_fr.png?v=4", "calendar", "🇫🇷");
pushCustomFilter("weekday_depth_de", "Wochentag (DE)", "#78350F", "#FBBF24", FBASE + "weekday_depth_de.png?v=4", "calendar", "🇩🇪");

var activeFilterCfg = (liveFilterCfg && typeof liveFilterCfg === "object") ? JSON.parse(JSON.stringify(liveFilterCfg)) : ${JSON.stringify(fallbackFilterCfg)};
activeFilterCfg.allows_custom_filters = true;
activeFilterCfg.show_filter_button = true;
activeFilterCfg.sheet_enabled = true;
if (typeof activeFilterCfg.open_sheet_immediately === "undefined") activeFilterCfg.open_sheet_immediately = true;

var existingSheets = Array.isArray(activeFilterCfg.sheet_filters) ? activeFilterCfg.sheet_filters : [];
var seenGroupIds = {};
for (var g = 0; g < CUSTOM_FRAME_GROUPS.length; g++) {
    seenGroupIds[CUSTOM_FRAME_GROUPS[g].id] = true;
}
var mergedSheets = CUSTOM_FRAME_GROUPS.slice();
for (var sg = 0; sg < existingSheets.length; sg++) {
    var grp = existingSheets[sg];
    if (grp && !seenGroupIds[grp.id]) {
        if (grp.id) seenGroupIds[grp.id] = true;
        mergedSheets.push(grp);
    }
}
activeFilterCfg.sheet_filters = mergedSheets;

var existingPickers = Array.isArray(activeFilterCfg.picker_filters) ? activeFilterCfg.picker_filters : [];
var seenPickers = {};
var mergedPickers = [];
var combinedPickers = CUSTOM_FRAME_IDS.concat(existingPickers);
for (var p = 0; p < combinedPickers.length; p++) {
    var pid = combinedPickers[p];
    if (pid && !seenPickers[pid]) {
        seenPickers[pid] = true;
        mergedPickers.push(pid);
    }
}
activeFilterCfg.picker_filters = mergedPickers;

var existingRemote = Array.isArray(activeFilterCfg.remote_filters) ? activeFilterCfg.remote_filters : [];
var seenRemoteIds = {};
var mergedRemote = [];
var combinedRemote = CUSTOM_REMOTE_FILTERS.concat(existingRemote);
for (var rfIdx = 0; rfIdx < combinedRemote.length; rfIdx++) {
    var rfItem = combinedRemote[rfIdx];
    var rfId = rfItem && (rfItem.id || rfItem.uid);
    if (rfId && !seenRemoteIds[rfId]) {
        seenRemoteIds[rfId] = true;
        mergedRemote.push(rfItem);
    }
}
activeFilterCfg.remote_filters = mergedRemote;
// Chèn đầy đủ filter custom của Tommm (AI 3D, khung viền, weekday_depth, photobooth) vào camera_filter_config.
obj.entries["camera_filter_config"] = JSON.stringify(activeFilterCfg);

writeRcStore(RC_VER, "tommm_rc_applied_ver");
finishOnce({ body: JSON.stringify(obj) });
})();
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_rc.js'), locketRcJs, 'utf8');

// =========================================================================
// 5. BUILD CLEAN Locket_Tommm_Cloud.conf (SỬ DỤNG 4 SCRIPT TÁCH RIÊNG - CHUẨN 100% ALL_IN_ONE)
// =========================================================================
const allInOnePath = path.join(dataDir, 'All_In_One.db');
const hasAllInOne = fs.existsSync(allInOnePath);
const allInOneExisting = hasAllInOne ? fs.readFileSync(allInOnePath, 'utf8') : '';
const caPassMatch = allInOneExisting.match(/ca-passphrase\s*=\s*(.+)/);
const caP12Match = allInOneExisting.match(/ca-p12\s*=\s*(.+)/);
const caPassphrase = caPassMatch ? caPassMatch[1].trim() : 'ha3p1Jdy';
const caP12 = caP12Match ? caP12Match[1].trim() : '';

function makeConf(includeP12) {
    return `#!name=Locket Gold Tommm Cloud 24/7
#!desc=Locket Gold Độc Lập 100% của Tommm (360+ Captions, Thứ Ngày Đa Ngôn Ngữ, Video 60s, Rollcall Strip & All Apps)
[General]
bypass-system = true
skip-proxy = *.local, *.crashlytics.com
tun-excluded-routes = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12
dns-server = 1.1.1.1, 8.8.8.8, 223.5.5.5
fallback-dns-server = 8.8.4.4, 1.0.0.1
update-url = ${ghRawBase}/Locket_Tommm_Cloud.conf

[Rule]
DOMAIN-SUFFIX,sentry.io,REJECT
DOMAIN-SUFFIX,crashlytics.com,REJECT
DOMAIN-SUFFIX,amplitude.com,REJECT
DOMAIN-SUFFIX,appsflyersdk.com,REJECT
AND,((DOMAIN,firebaseremoteconfig.googleapis.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN-SUFFIX,googlevideo.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,youtubei.googleapis.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,music.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,s.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,www.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,m.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,api.locketcamera.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,us-central1-locket-4252a.cloudfunctions.net),(PROTOCOL,UDP)),REJECT

[Header Rewrite]
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del x-revenuecat-etag
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del X-RevenueCat-ETag
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del If-None-Match
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del if-none-match
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del Accept-Encoding
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del accept-encoding
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del If-None-Match
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del if-none-match
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del Accept-Encoding
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del accept-encoding
http-request ^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/user-customization-service\\/v1\\/customize$ header-del if-none-match

[URL Rewrite]
^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*(generateFilteredImage|generateFilter|applyFilter|createFilter|createCustomFilter|generateCustomFilter|createCameraFilter|createAiFilter|generateAiFilter|createUserFilter|saveFilter|saveCustomFilter|createLook|generateLook|customFilter|customFilters|userFilters|validateFilter|checkFilter|generateCaption|ai-filters)(.*) 'https://locket-tommm-studio.khoinguyennguyen85.workers.dev/$2$3' header
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!(dclk_video_ads|videoplayback\\?)).+&oad _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/api\\/stats\\/ads _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/(pagead|ptracking) _ reject-200
^https?:\\/\\/s\\.youtube\\.com\\/api\\/stats\\/qoe\\?adcontext _ reject-200
(^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!dclk_video_ads).+?)&ctier=L(&.+?),ctier,(.+) $1$2$3 302

[Map Local]
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/initplayback.+&oad 'data-type=text data="" status-code=200'

[Script]
# =====================================================================
# 1. LOCKET GOLD TOMMM CLOUD 24/7 (CHUẨN 100% FIREBASE REMOTE CONFIG SDK iOS)
# =====================================================================
tommm_gold = type=http-response, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/[^/]+$), script-path=${ghRawBase}/js_tommm_gold.js?v=64, requires-body=true, max-size=-1, timeout=60
tommm_del_header = type=http-request, pattern=^https:\\/\\/(api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers)|firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a), script-path=${ghRawBase}/js_tommm_deleteHeader.js?v=64, timeout=60
tommm_rc = type=http-response, pattern=^https:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a\\/.+, script-path=${ghRawBase}/js_tommm_rc.js?v=64, requires-body=true, max-size=-1, timeout=60
tommm_ai_route = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*(generateFilteredImage|generateFilter|applyFilter|createFilter|createCustomFilter|generateCustomFilter|createCameraFilter|createAiFilter|generateAiFilter|createUserFilter|saveFilter|saveCustomFilter|createLook|generateLook|customFilter|customFilters|userFilters|validateFilter|checkFilter|generateCaption|ai-filters), script-path=${ghRawBase}/js_tommm_ai_route.js?v=64, timeout=60
tommm_yt_music_post = type=http-request, pattern=^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*(postMoment|createMoment), script-path=${ghRawBase}/js_tommm_yt_music.js?v=64, requires-body=true, max-size=524288, timeout=10
tommm_uid_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters|postMoment|createMoment|changeProfileInfo)).+, script-path=${ghRawBase}/js_tommm_badge.js?v=64, timeout=60
tommm_badge_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*changeProfileInfo, script-path=${ghRawBase}/js_tommm_badge.js?v=64, requires-body=true, max-size=131072, timeout=60
tommm_badge_res = type=http-response, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+, script-path=${ghRawBase}/js_tommm_badge.js?v=64, requires-body=true, max-size=1048576, timeout=60
tommm_yt_playback = type=http-request, pattern=^https?:\\/\\/(s|www|music|m)\\.youtube\\.com\\/api\\/stats\\/(playback|watchtime|qoe), script-path=${ghRawBase}/js_tommm_yt_music.js?v=64, requires-body=false, timeout=5
tommm_yt_music_sniffer = type=http-request, pattern=^https?:\\/\\/(youtubei\\.googleapis\\.com|music\\.youtube\\.com)\\/youtubei\\/v1\\/(player|get_watch), script-path=${ghRawBase}/js_tommm_yt_music.js?v=64, requires-body=true, binary-body-mode=true, max-size=65536, timeout=5

# =====================================================================
# 2. CÁC TIỆN ÍCH PREMIUM KHÁC (CHẠY TỪ GITHUB CỦA TOMMM 100%)
# =====================================================================
youtube.request = type=http-request,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/youtubei\\/v1\\/(browse|next|player|reel\\/reel_watch_sequence|get_watch),requires-body=1,max-size=-1,binary-body-mode=1,engine=jsc,script-path=${ghRawBase}/js_other/youtube.response.js
youtube.response = type=http-response,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/(youtubei\\/v1\\/(browse|next|player|search|reel\\/reel_watch_sequence|guide|account\\/get_setting|get_watch))(\\?(.*))?$,requires-body=1,max-size=-1,binary-body-mode=1,engine={{{script}}},script-path=${ghRawBase}/js_other/youtube.response.js,argument="{\\"lyricLang\\":\\"vi\\",\\"captionLang\\":\\"vi\\",\\"blockUpload\\":true,\\"blockImmersive\\":true,\\"debug\\":false}"
spotify-json = type=http-request,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/(artistview\\/v1\\/artist|album-entity-view\\/v2\\/album)\\/,requires-body=0,script-path=${ghRawBase}/js_other/spotify-json.js
spotify-proto = type=http-response,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/(bootstrap\\/v1\\/bootstrap|user-customization-service\\/v1\\/customize)$,requires-body=1,binary-body-mode=1,max-size=0,script-path=${ghRawBase}/js_other/spotify-proto.js,script-update-interval=0
SoundCloudGo+ = type=http-response,pattern=https://api-mobile.soundcloud.com/configuration/ios,requires-body=1,script-path=${ghRawBase}/js_other/SoundCloudGoPlus.js
AlightMotion = type=http-response,script-path=${ghRawBase}/js_other/AlightMotion.js,pattern=^https:\\/\\/us-central1-alight-creative\\.cloudfunctions\\.net\\/getAccountStatusAndLicenses,max-size=131072,requires-body=true,timeout=10,enable=true
PicsArt = type=http-request,pattern=^https:\\/\\/api\\.picsart\\.com\\/gw-v2\\/shop\\/subscription\\/apple\\/purchases,script-path=${ghRawBase}/js_other/PicsArt.js,requires-body=true,timeout=60
PicsArtStorages = type=http-response,pattern=^https:\\/\\/api\\.picsart\\.com\\/gw-v2\\/cloud-storage\\/v1\\/me\\/storages,script-path=${ghRawBase}/js_other/PicsArtStorages.js,requires-body=1,max-size=0
Wink = type=http-response,pattern=^https:\\/\\/api-sub\\.meitu\\.com\\/v2\\/user\\/vip_info_by_group\\.json,requires-body=1,script-path=${ghRawBase}/js_other/WinkVipCrack.js
Truecaller = type=http-response,pattern=^https:\\/\\/premium-[^.]+\.truecaller\.com\\/v\\d+\\/(subscriptions\\/status|products\\/apple)(\\?.*)?$,requires-body=1,max-size=0,script-path=${ghRawBase}/js_other/TrueCaller.js
Lightroom = type=http-response,pattern=^https:\\/\\/photos\\.adobe\\.io\\/v\\d\\/accounts,requires-body=1,max-size=0,script-path=${ghRawBase}/js_other/lightroom.js,script-update-interval=-1
Kinemaster = type=http-response,pattern=^https:\\/\\/api-account\\.kinemasters\\.com\\/v\\d\\/user\\/subscribe$,requires-body=1,max-size=0,script-path=${ghRawBase}/js_other/Kinemaster.js
Camscanner = requires-body=1,script-path=${ghRawBase}/js_other/camScanner.js,type=http-response,pattern=https:\\/\\/(api|api-cs.*)\\.intsig\\.net\\/purchase\\/cs\\/query_property\\?
BeautyPlus = type=http-response, pattern=https:\\/\\/(api\\.mr\\.pixocial\\.com\\/v1\\/manual_unlock|newbeee-api\\.beautyplus\\.com\\/api\\/v1\\/asset\\/balance), script-path=${ghRawBase}/js_other/BeautyPlus.js, requires-body=true, max-size=-1, timeout=60
iTunes = type=http-response, pattern=^https?:\\/\\/buy\\.itunes\\.apple\\.com\\/verifyReceipt$, script-path=${ghRawBase}/js_other/iTunes.js, requires-body=true, max-size=-1, timeout=60
Snow = type=http-response, pattern=^https?:\\/\\/user-snow-api\\.snow\\.me\\/v\\d\\/purchase\\/subscription\\/subscriber\\/status, script-path=${ghRawBase}/js_other/Snow.js, requires-body=true, max-size=-1, timeout=60
Meitu = type=http-response,pattern=^https?:\\/\\/(h5|api)\\.xiuxiu\\.meitu\\.com\\/v\\d\\/(h\\d\\/vip|vip|user)\\/,requires-body=1,script-path=${ghRawBase}/js_other/MeiTuXiuXiu.js

[MITM]
${includeP12 ? `ca-passphrase = ${caPassphrase}\nca-p12 = ${caP12}\n` : ''}enable = true
hostname = %APPEND%, *.googlevideo.com, youtubei.googleapis.com, music.youtube.com, m.youtube.com, www.youtube.com, s.youtube.com, -redirector*.googlevideo.com, premium*.truecaller.com, sub.store, api.revenuecat.com, firebaseremoteconfig.googleapis.com, api.rc-backup.com, us-central1-locket-4252a.cloudfunctions.net, api.locketcamera.com, buy.itunes.apple.com, spclient.wg.spotify.com, *spclient.spotify.com, api-mobile.soundcloud.com, api.picsart.com, us-central1-alight-creative.cloudfunctions.net, api-sub.meitu.com, photos.adobe.io, ap*.intsig.net, api-account.kinemasters.com, api.mr.pixocial.com, newbeee-api.beautyplus.com, user-snow-api.snow.me, h5.xiuxiu.meitu.com, api.xiuxiu.meitu.com
`;
}

fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Cloud.conf'), makeConf(false), 'utf8');
if (hasAllInOne && caP12) {
    fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Private.conf'), makeConf(true), 'utf8');
}

// Also generate Shadowrocket Module (.sgmodule) so users NEVER lose their CA certificate when updating!
const sgModuleContent = `#!name=Locket Gold • ✨Tommm✨ (Cloud 24/7)
#!desc=Mở khóa Locket Gold VIP, 360+ Captions tự cập nhật ngày lễ, Thứ Ngày Đa Ngôn Ngữ, Rollcall Strip & All Apps — By ✨Tommm✨
#!system=ios

[Rule]
DOMAIN-SUFFIX,sentry.io,REJECT
DOMAIN-SUFFIX,crashlytics.com,REJECT
DOMAIN-SUFFIX,amplitude.com,REJECT
DOMAIN-SUFFIX,appsflyersdk.com,REJECT
AND,((DOMAIN,firebaseremoteconfig.googleapis.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN-SUFFIX,googlevideo.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,youtubei.googleapis.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,music.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,s.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,www.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,m.youtube.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,api.locketcamera.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,us-central1-locket-4252a.cloudfunctions.net),(PROTOCOL,UDP)),REJECT

[Header Rewrite]
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del x-revenuecat-etag
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del X-RevenueCat-ETag
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del If-None-Match
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del if-none-match
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del Accept-Encoding
http-request ^https?:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a header-del accept-encoding
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del If-None-Match
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del if-none-match
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del Accept-Encoding
http-request ^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+ header-del accept-encoding
http-request ^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/user-customization-service\\/v1\\/customize$ header-del if-none-match

[URL Rewrite]
^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*(generateFilteredImage|generateFilter|applyFilter|createFilter|createCustomFilter|generateCustomFilter|createCameraFilter|createAiFilter|generateAiFilter|createUserFilter|saveFilter|saveCustomFilter|createLook|generateLook|customFilter|customFilters|userFilters|validateFilter|checkFilter|generateCaption|ai-filters)(.*) 'https://locket-tommm-studio.khoinguyennguyen85.workers.dev/$2$3' header
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!(dclk_video_ads|videoplayback\\?)).+&oad _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/api\\/stats\\/ads _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/(pagead|ptracking) _ reject-200
^https?:\\/\\/s\\.youtube\\.com\\/api\\/stats\\/qoe\\?adcontext _ reject-200
(^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!dclk_video_ads).+?)&ctier=L(&.+?),ctier,(.+) $1$2$3 302

[Map Local]
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/initplayback.+&oad 'data-type=text data="" status-code=200'

[Script]
tommm_gold = type=http-response, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/[^/]+$), script-path=${ghRawBase}/js_tommm_gold.js?v=64, requires-body=true, max-size=-1, timeout=60
tommm_del_header = type=http-request, pattern=^https:\\/\\/(api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers)|firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a), script-path=${ghRawBase}/js_tommm_deleteHeader.js?v=64, timeout=60
tommm_rc = type=http-response, pattern=^https:\\/\\/(firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a\\/.+), script-path=${ghRawBase}/js_tommm_rc.js?v=64, requires-body=true, max-size=-1, timeout=60
tommm_ai_route = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*(generateFilteredImage|generateFilter|applyFilter|createFilter|createCustomFilter|generateCustomFilter|createCameraFilter|createAiFilter|generateAiFilter|createUserFilter|saveFilter|saveCustomFilter|createLook|generateLook|customFilter|customFilters|userFilters|validateFilter|checkFilter|generateCaption|ai-filters), script-path=${ghRawBase}/js_tommm_ai_route.js?v=64, timeout=60
tommm_yt_music_post = type=http-request, pattern=^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*(postMoment|createMoment), script-path=${ghRawBase}/js_tommm_yt_music.js?v=64, requires-body=true, max-size=524288, timeout=10
tommm_uid_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters|postMoment|createMoment|changeProfileInfo)).+, script-path=${ghRawBase}/js_tommm_badge.js?v=64, timeout=60
tommm_badge_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/.*changeProfileInfo, script-path=${ghRawBase}/js_tommm_badge.js?v=64, requires-body=true, max-size=131072, timeout=60
tommm_badge_res = type=http-response, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(?!(generateFilteredImage|generateFilter|applyFilter|createFilter|generateCaption|ai-filters)).+, script-path=${ghRawBase}/js_tommm_badge.js?v=64, requires-body=true, max-size=1048576, timeout=60
tommm_yt_playback = type=http-request, pattern=^https?:\\/\\/(s|www|music|m)\\.youtube\\.com\\/api\\/stats\\/(playback|watchtime|qoe), script-path=${ghRawBase}/js_tommm_yt_music.js?v=64, requires-body=false, timeout=5
tommm_yt_music_sniffer = type=http-request, pattern=^https?:\\/\\/(youtubei\\.googleapis\\.com|music\\.youtube\\.com)\\/youtubei\\/v1\\/(player|get_watch), script-path=${ghRawBase}/js_tommm_yt_music.js?v=64, requires-body=true, binary-body-mode=true, max-size=65536, timeout=5

[MITM]
hostname = %APPEND%, *.googlevideo.com, youtubei.googleapis.com, music.youtube.com, m.youtube.com, www.youtube.com, s.youtube.com, -redirector*.googlevideo.com, api.revenuecat.com, firebaseremoteconfig.googleapis.com, api.rc-backup.com, us-central1-locket-4252a.cloudfunctions.net, api.locketcamera.com
`;
fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Cloud.sgmodule'), sgModuleContent, 'utf8');

console.log("Built 4 modular scripts:");
for (const fn of ['js_tommm_deleteHeader.js', 'js_tommm_gold.js', 'js_tommm_badge.js', 'js_tommm_rc.js', 'Locket_Tommm_Cloud.conf']) {
    console.log(" ", fn, "->", fs.statSync(path.join(baseDir, fn)).size, "bytes");
}
