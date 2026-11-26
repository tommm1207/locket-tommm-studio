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
const deleteHeaderJs = `// Tommm Private - Delete ETag / Cache Headers (RevenueCat & Firebase Remote Config)
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
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_deleteHeader.js'), deleteHeaderJs, 'utf8');

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
var myUid = (urlMatch && urlMatch[1]) || (obj.subscriber && obj.subscriber.original_app_user_id) || "";
if (myUid && typeof $persistentStore !== "undefined") {
    $persistentStore.write(String(myUid), "tommm_my_locket_uid");
}

$done({ body: JSON.stringify(obj) });
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_gold.js'), locketGoldJs, 'utf8');

// =========================================================================
// 3. TÁCH RIÊNG SCRIPT 3: js_tommm_badge.js (Smart Per-User Gold Badge - chỉ gắn đúng UID chủ máy)
// =========================================================================
const locketBadgeJs = `// Tommm Private - Per-User Smart Locket Gold Badge (myUid-Only)
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

function resolveMyUid() {
    var uid = "";
    if (typeof $persistentStore !== "undefined") {
        uid = $persistentStore.read("tommm_my_locket_uid") || "";
    }
    try {
        var hdrs = (typeof $request !== "undefined" && $request && $request.headers) ? $request.headers : null;
        if (hdrs) {
            var auth = hdrs["Authorization"] || hdrs["authorization"] || "";
            var m = String(auth).match(/^Bearer\\s+[^.]+\\.([^.]+)\\.[^.]+$/i);
            if (m && m[1]) {
                var jwt = JSON.parse(decodeBase64Url(m[1]));
                var jwtUid = jwt.user_id || jwt.sub || "";
                if (jwtUid) {
                    uid = String(jwtUid);
                    if (typeof $persistentStore !== "undefined") {
                        $persistentStore.write(uid, "tommm_my_locket_uid");
                    }
                }
            }
        }
    } catch (_) {}
    return uid;
}

var myUid = resolveMyUid();
var reqUrl = (typeof $request !== "undefined" && $request && $request.url) ? String($request.url) : "";

if (typeof $response === "undefined") {
    var rawBody = (typeof $request !== "undefined" && $request && $request.body) ? String($request.body) : "";
    if (rawBody.indexOf("badge") === -1) {
        $done({});
    } else {
        var isTurningOn = rawBody.indexOf("locket_gold") !== -1 || /"badge"\\s*:\\s*true/i.test(rawBody);
        if (typeof $persistentStore !== "undefined") {
            $persistentStore.write(isTurningOn ? "ON" : "OFF", "tommm_my_badge_state");
        }
        var badgeVal = isTurningOn ? "locket_gold" : null;
        var tierVal = isTurningOn ? "gold" : null;
        $done({
            response: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                    "data": { "badge": badgeVal, "badge_tier": tierVal, "is_gold": true, "success": true },
                    "result": {
                        "badge": badgeVal,
                        "badge_tier": tierVal,
                        "is_gold": true,
                        "success": true,
                        "data": { "badge": badgeVal, "is_gold": true }
                    }
                })
            }
        });
    }
} else if ($response && $response.body) {
    var badgeState = (typeof $persistentStore !== "undefined" ? $persistentStore.read("tommm_my_badge_state") : "") || "ON";
    if (badgeState === "OFF") {
        $done({});
    } else {
        try {
            var uObj = JSON.parse($response.body);
            var targetNode = (uObj.result && uObj.result.data) ? uObj.result.data : uObj.data;
            var targetUid = targetNode && (targetNode.uid || targetNode.user_id || targetNode.id);
            var isChangeProfile = reqUrl.indexOf("changeProfileInfo") !== -1;
            if (targetNode && ((myUid && targetUid && String(targetUid) === String(myUid)) || isChangeProfile)) {
                targetNode.badge = "locket_gold";
                targetNode.is_gold = true;
                $done({ body: JSON.stringify(uObj) });
            } else {
                $done({});
            }
        } catch (_) {
            $done({});
        }
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
const customExtraSections = [animatedCaptionsSection].concat(cloudArchiveSection).concat([weekdayCaptionsSection]).concat(
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

const baseRcEntries = Object.assign({}, dvRc);
delete baseRcEntries["settings_instagram_url"];
delete baseRcEntries["settings_tiktok_url"];
delete baseRcEntries["widget_frame_event"];
// Giữ nguyên các key giao diện hiện đại của Locket mới (tránh bị snapshot cũ làm giao diện kì cục)
delete baseRcEntries["overlay_navigator_enabled"];
delete baseRcEntries["overlays_v2_config"];
delete baseRcEntries["streak_config"];
delete baseRcEntries["journal_settings"];
delete baseRcEntries["journal_activity_bar_enabled"];
delete baseRcEntries["invite_link_preview_variant"];
delete baseRcEntries["friend_limit_geo_override"];

delete baseRcEntries["camera"];
delete baseRcEntries["camera_roll"];
delete baseRcEntries["camera_config"];
delete baseRcEntries["live_photos"];
delete baseRcEntries["moment_upload_queue_persistence_v2"];

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
    if (baseRcEntries[dk] !== undefined) {
        defaultOnlyRcEntries[dk] = baseRcEntries[dk];
        delete baseRcEntries[dk];
    }
}

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
baseRcEntries["quality_mbps"] = "0.6";
baseRcEntries["qualityMbps"] = "0.6";
baseRcEntries["camera_quality_mbps"] = "0.6";
baseRcEntries["camera_roll_quality_mbps"] = "0.6";
baseRcEntries["video_quality_mbps"] = "0.6";
baseRcEntries["video_bitrate"] = "600000";
baseRcEntries["bitrate"] = "600000";
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

const singleFrameIds = Object.keys(framesManifest).filter(id => !photoboothIds.includes(id));

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
    { id: "group_locket_tools", title: { en: "✨ Tính Năng Locket Hot", vi: "✨ Tính Năng Locket Hot" }, filter_ids: ["clock_weekday_overlay", "portrait_bokeh", "cctv_camera", "triple_clone", "weekday_depth"] },
    { id: "group_hot_ai_3d", title: { en: "Hiệu Ứng AI 3D Hot 🔥", vi: "Hiệu Ứng AI 3D Hot 🔥" }, filter_ids: aiHotIds },
    { id: "group_meme_ai", title: { en: "😂 Meme Giải Trí", vi: "😂 Meme Giải Trí" }, filter_ids: ["ai_cong_chua_phong_tro", "ai_hoang_tu_ktx", "ai_lop_truong", "ai_di_phu_ho", "ai_ve_que_nuoi_ca"] },
    { id: "group_trend_ai", title: { en: "🔥 Trend Hot Mạng Xã Hội", vi: "🔥 Trend Hot Mạng Xã Hội" }, filter_ids: ["ai_figure_1_7", "ai_action_figure_box", "ai_lego_figure", "ai_cartoon_3d", "ai_polaroid_string"] },
    { id: "group_job_ai", title: { en: "🛵 Nghề Nghiệp & Shipper", vi: "🛵 Nghề Nghiệp & Shipper" }, filter_ids: ["ai_shipper_giao_hang", "stk_shopee_food", "ai_grab_driver", "ai_xanh_sm", "ai_bac_si"] },
    { id: "group_luxury_ai", title: { en: "👑 Tổng Tài & Phú Bà", vi: "👑 Tổng Tài & Phú Bà" }, filter_ids: ["ai_tong_tai", "ai_phu_ba", "ai_thieu_gia", "ai_du_thuyen", "ai_old_money"] },
    { id: "group_beauty_ai", title: { en: "💖 Xinh Lung Linh & Hóa Trang", vi: "💖 Xinh Lung Linh & Hóa Trang" }, filter_ids: ["ai_makeup_idol", "ai_trang_diem_duyen", "ai_doi_kieu_toc", "ai_doi_mau_toc", "ai_cosplay_wibu", "ai_hau_gai", "ai_hoang_thuong", "ai_idol_kpop"] },
    { id: "group_warp_fun", title: { en: "🤪 Hiệu Ứng Méo Mặt & Hài Hước", vi: "🤪 Hiệu Ứng Méo Mặt & Hài Hước" }, filter_ids: ["warp_big_head", "warp_tiny_face", "warp_alien_vline", "warp_hamster", "warp_bug_eyes", "warp_wide_mouth", "warp_chubby", "warp_gigachad", "warp_swirl", "warp_melt"] },
    { id: "group_retro_lut", title: { en: "📷 Máy Ảnh Retro & Màu Film", vi: "📷 Máy Ảnh Retro & Màu Film" }, filter_ids: ["dazz_cpm35", "dazz_classic_u", "dazz_fqs", "dazz_inst_c", "dazz_grd", "lut_kodak_portra", "lut_fuji_superia", "lut_kodak_gold", "lut_cinestill_800t", "lut_kodak_am", "lut_fuji_chrome", "lut_vintage"] },
    { id: "group_beauty_lut", title: { en: "🌸 Làm Đẹp & Tone Da", vi: "🌸 Làm Đẹp & Tone Da" }, filter_ids: ["lut_iphone_beauty", "lut_film_han", "lut_trang_sua", "lut_phim_nhat", "lut_hong_dao", "lut_matcha", "lut_ulzzang_pink", "lut_nang_ban_mai", "lut_tone_lanh", "lut_kem_bo"] },
    { id: "group_photobooth", title: { en: "Khung & Photobooth 📸", vi: "Khung & Photobooth 📸" }, filter_ids: photoboothIds },
    { id: "group_frames", title: { en: "Khung Viền & Hot Trend 🖼️", vi: "Khung Viền & Hot Trend 🖼️" }, filter_ids: ["weekday_depth", "weekday_depth_en", "weekday_depth_tw", "weekday_depth_de"].concat(singleFrameIds) }
];
const frameOnlyIds = photoboothIds.concat(singleFrameIds);
const customFrameIds = [
    "clock_weekday_overlay", "portrait_bokeh", "cctv_camera", "triple_clone",
    "weekday_depth", "weekday_depth_en", "weekday_depth_tw", "weekday_depth_de",
    "dazz_cpm35", "lut_iphone_beauty", "warp_big_head", "ai_cong_chua_phong_tro"
].concat(aiHotIds.slice(0, 4), photoboothIds.slice(0, 4));

const customRemoteFilters = frameOnlyIds.map(id => {
    const src = filterMetaById.get(id) || {};
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
    "camera_roll", "camera_roll_video", "camera_roll_video_30s", "camera_roll_video_upload",
    "photo_library_video", "can_upload_30s_video", "can_record_30s_video",
    "video", "video_30s", "video_60s", "longer_video", "longer_video_30s", "extended_video_30s",
    "camera_timer", "self_timer", "timer", "countdown_timer",
    "digicam", "retro_camera", "retro_cameras", "film_camera", "film_cameras",
    "camera_lenses", "lenses", "camera_modes", "dazz_cam", "vintage_camera",
    "camera_zoom", "zoom",
    "camera_filter_sheet", "camera_filters", "camera_filter", "filter", "filters",
    "photo_filters", "ai_filters", "ar_filters", "face_filters",
    "camera_filter_button", "custom_filters", "create_filter",
    "holiday_effects", "holiday_filters", "camera_theme",
    "long_captions", "remove_ads", "profile_badge", "unlimited_friends"
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
var obj = {};
try { obj = JSON.parse($response.body || "{}"); } catch (_) { obj = {}; }
if (!obj || typeof obj !== "object") obj = {};
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

// 2b. MERGE feature_gates: GIỮ NGUYÊN toàn bộ gate native mà server Locket 2.74.0 trả về,
// ÉP BẬT các gate Gold + tự động mở khóa mọi gate có tên liên quan timer/dazz/retro/film/lens/video/zoom.
var TOMMM_FORCE_GATES = ${JSON.stringify(TOMMM_FORCE_GATES)};
var liveGates = {};
try { liveGates = JSON.parse(obj.entries["feature_gates"] || "{}"); } catch (_) { liveGates = {}; }
if (!liveGates || typeof liveGates !== "object") liveGates = {};
for (var gk in liveGates) {
    if (Object.prototype.hasOwnProperty.call(liveGates, gk) && /timer|dazz|digi|retro|film|lens|camera_mode|camera_roll|video|zoom|countdown/i.test(gk)) {
        var gv = liveGates[gk];
        if (gv === "disabled" || gv === "off" || gv === false) liveGates[gk] = "enabled";
    }
}
for (var fgi = 0; fgi < TOMMM_FORCE_GATES.length; fgi++) {
    liveGates[TOMMM_FORCE_GATES[fgi]] = "enabled";
}
obj.entries["feature_gates"] = JSON.stringify(liveGates);

// Tự động bật các key top-level nếu server trả false/disabled cho timer/dazz/retro/film/lens
for (var ek in obj.entries) {
    if (Object.prototype.hasOwnProperty.call(obj.entries, ek) && /timer|dazz|digi|retro|film|lens|camera_mode|countdown/i.test(ek)) {
        if (obj.entries[ek] === "false") obj.entries[ek] = "true";
        else if (obj.entries[ek] === "disabled") obj.entries[ek] = "enabled";
    }
}

// Điền default-only cho các key hạ tầng upload/storage nếu server chưa trả
var TOMMM_DEFAULTS = ${JSON.stringify(defaultOnlyRcEntries)};
for (var dk in TOMMM_DEFAULTS) {
    if (Object.prototype.hasOwnProperty.call(TOMMM_DEFAULTS, dk) && typeof obj.entries[dk] === "undefined") {
        obj.entries[dk] = TOMMM_DEFAULTS[dk];
    }
}

var TOMMM_ENTRIES = ${JSON.stringify(baseRcEntries)};
Object.assign(obj.entries, TOMMM_ENTRIES);

// JSON-merge camera, camera_config, camera_roll, live_photos (giữ lại key native của server, chỉ bổ sung/cập nhật chuẩn)
try {
    var camObj = {};
    try { camObj = JSON.parse(obj.entries["camera"] || "{}"); } catch (_) { camObj = {}; }
    if (!camObj || typeof camObj !== "object") camObj = {};
    Object.assign(camObj, {
        gold_max_duration: 45,
        max_duration: 45,
        ultra_wide: true,
        telephoto: true,
        flash_button: true,
        volume_button: true,
        srgb: true,
        lanczos: true,
        quality_mbps: 0.6,
        timer_enabled: true,
        self_timer_enabled: true,
        timer: true,
        digicam: true,
        retro_cameras: true,
        camera_lenses: true
    });
    obj.entries["camera"] = JSON.stringify(camObj);
} catch (_) {}

try {
    var camCfgObj = {};
    try { camCfgObj = JSON.parse(obj.entries["camera_config"] || "{}"); } catch (_) { camCfgObj = {}; }
    if (!camCfgObj || typeof camCfgObj !== "object") camCfgObj = {};
    Object.assign(camCfgObj, {
        gold_max_duration: 45,
        goldMaxDuration: 45,
        max_duration: 45,
        maxDuration: 45,
        ultra_wide: true,
        ultraWide: true,
        volume_button: true,
        volumeButton: true,
        flash_button: true,
        telephoto: true,
        lanczos: true,
        quality_mbps: 0.7,
        qualityMbps: 0.7,
        timer_enabled: true,
        self_timer_enabled: true,
        digicam: true
    });
    obj.entries["camera_config"] = JSON.stringify(camCfgObj);
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
        quality_mbps: 0.6
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
        viewing: true,
        catch_up: true,
        widget_playback: true,
        widget_looping_mode: "unseen"
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
        "caption:standard", "caption:poll", "caption:color_palette", "caption:review",
        "caption:quote", "caption:breaking_news", "caption:music", "caption:location",
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
    var rawItems = EXTRA_SECTIONS[i].items || [];
    var cleanItems = [];
    for (var j = 0; j < rawItems.length; j++) {
        var it = rawItems[j];
        if (it && it.overlay_id && !seenOverlayIds[it.overlay_id]) {
            seenOverlayIds[it.overlay_id] = true;
            cleanItems.push(it);
        }
    }
    if (cleanItems.length > 0) {
        mergedOverlays.push({ section: EXTRA_SECTIONS[i].section, items: cleanItems });
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
    pushCustomFilter(sp[0], sp[1], sp[2], sp[3], FBASE + sp[0] + ".png", is4 ? "square.grid.2x2" : "photo.on.rectangle", is4 ? "📸" : "🖼️");
}
for (var cv = 0; cv < CUSTOM_V2_SPECS.length; cv++) {
    var vp = CUSTOM_V2_SPECS[cv];
    pushCustomFilter(vp[0], vp[1], vp[2], vp[3], F2BASE + vp[0] + ".png?v=2", vp[4], vp[5]);
}
pushCustomFilter("weekday_depth", "Thứ Sau Chủ Thể (VI)", "#243B53", "#FFFFFF", FBASE + "weekday_depth.png", "calendar", "🇻🇳");
pushCustomFilter("weekday_depth_en", "Day Depth (EN)", "#1E3A8A", "#60A5FA", FBASE + "weekday_depth_en.png", "calendar", "🇬🇧");
pushCustomFilter("weekday_depth_tw", "星期景深 (TW)", "#7C2D12", "#FB923C", FBASE + "weekday_depth_tw.png", "calendar", "🇹🇼");
pushCustomFilter("weekday_depth_de", "Wochentag (DE)", "#78350F", "#FBBF24", FBASE + "weekday_depth_de.png", "calendar", "🇩🇪");

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

$done({ body: JSON.stringify(obj) });
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
update-url = ${ghRawBase}/Locket_Tommm_Cloud.conf

[Rule]
DOMAIN-SUFFIX,sentry.io,REJECT
DOMAIN-SUFFIX,crashlytics.com,REJECT
DOMAIN-SUFFIX,amplitude.com,REJECT
DOMAIN-SUFFIX,appsflyersdk.com,REJECT
AND,((DOMAIN,firebaseremoteconfig.googleapis.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN-SUFFIX,googlevideo.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,youtubei.googleapis.com),(PROTOCOL,UDP)),REJECT

[Header Rewrite]
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del x-revenuecat-etag
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del X-RevenueCat-ETag
http-request ^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/user-customization-service\\/v1\\/customize$ header-del if-none-match

[URL Rewrite]
^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|generateFilter|applyFilter|generateCaption|ai-filters)(.*) 'https://locket-tommm-studio.khoinguyennguyen85.workers.dev/$2$3' header
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
tommm_gold = type=http-response, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/[^/]+$), script-path=${ghRawBase}/js_tommm_gold.js?v=40, requires-body=true, max-size=-1, timeout=60
tommm_del_header = type=http-request, pattern=^https:\\/\\/(api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers)|firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a), script-path=${ghRawBase}/js_tommm_deleteHeader.js?v=40, timeout=60
tommm_rc = type=http-response, pattern=^https:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a\\/.+, script-path=${ghRawBase}/js_tommm_rc.js?v=40, requires-body=true, max-size=-1, timeout=60
tommm_ai_route = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|generateFilter|applyFilter|generateCaption|ai-filters), script-path=${ghRawBase}/js_tommm_ai_route.js?v=40, timeout=60
tommm_badge_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/changeProfileInfo, script-path=${ghRawBase}/js_tommm_badge.js?v=40, requires-body=true, max-size=131072, timeout=60
tommm_badge_res = type=http-response, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(changeProfileInfo|fetchUser), script-path=${ghRawBase}/js_tommm_badge.js?v=40, requires-body=true, max-size=131072, timeout=60

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
hostname = %APPEND%, *.googlevideo.com, youtubei.googleapis.com, www.youtube.com, s.youtube.com, -redirector*.googlevideo.com, premium*.truecaller.com, sub.store, api.revenuecat.com, firebaseremoteconfig.googleapis.com, api.rc-backup.com, us-central1-locket-4252a.cloudfunctions.net, api.locketcamera.com, buy.itunes.apple.com, spclient.wg.spotify.com, *spclient.spotify.com, api-mobile.soundcloud.com, api.picsart.com, us-central1-alight-creative.cloudfunctions.net, api-sub.meitu.com, photos.adobe.io, ap*.intsig.net, api-account.kinemasters.com, api.mr.pixocial.com, newbeee-api.beautyplus.com, user-snow-api.snow.me, h5.xiuxiu.meitu.com, api.xiuxiu.meitu.com
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

[Header Rewrite]
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del x-revenuecat-etag
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del X-RevenueCat-ETag
http-request ^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/user-customization-service\\/v1\\/customize$ header-del if-none-match

[URL Rewrite]
^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|generateFilter|applyFilter|generateCaption|ai-filters)(.*) 'https://locket-tommm-studio.khoinguyennguyen85.workers.dev/$2$3' header
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!(dclk_video_ads|videoplayback\\?)).+&oad _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/api\\/stats\\/ads _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/(pagead|ptracking) _ reject-200
^https?:\\/\\/s\\.youtube\\.com\\/api\\/stats\\/qoe\\?adcontext _ reject-200
(^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!dclk_video_ads).+?)&ctier=L(&.+?),ctier,(.+) $1$2$3 302

[Map Local]
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/initplayback.+&oad 'data-type=text data="" status-code=200'

[Script]
tommm_gold = type=http-response, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/[^/]+$), script-path=${ghRawBase}/js_tommm_gold.js?v=40, requires-body=true, max-size=-1, timeout=60
tommm_del_header = type=http-request, pattern=^https:\\/\\/(api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers)|firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a), script-path=${ghRawBase}/js_tommm_deleteHeader.js?v=40, timeout=60
tommm_rc = type=http-response, pattern=^https:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a\\/.+, script-path=${ghRawBase}/js_tommm_rc.js?v=40, requires-body=true, max-size=-1, timeout=60
tommm_ai_route = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|generateFilter|applyFilter|generateCaption|ai-filters), script-path=${ghRawBase}/js_tommm_ai_route.js?v=40, timeout=60
tommm_badge_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/changeProfileInfo, script-path=${ghRawBase}/js_tommm_badge.js?v=40, requires-body=true, max-size=131072, timeout=60
tommm_badge_res = type=http-response, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(changeProfileInfo|fetchUser), script-path=${ghRawBase}/js_tommm_badge.js?v=40, requires-body=true, max-size=131072, timeout=60

[MITM]
hostname = %APPEND%, *.googlevideo.com, youtubei.googleapis.com, www.youtube.com, s.youtube.com, -redirector*.googlevideo.com, api.revenuecat.com, firebaseremoteconfig.googleapis.com, api.rc-backup.com, us-central1-locket-4252a.cloudfunctions.net, api.locketcamera.com
`;
fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Cloud.sgmodule'), sgModuleContent, 'utf8');

console.log("Built 4 modular scripts:");
for (const fn of ['js_tommm_deleteHeader.js', 'js_tommm_gold.js', 'js_tommm_badge.js', 'js_tommm_rc.js', 'Locket_Tommm_Cloud.conf']) {
    console.log(" ", fn, "->", fs.statSync(path.join(baseDir, fn)).size, "bytes");
}
