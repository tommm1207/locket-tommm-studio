const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const dataDir = path.join(baseDir, 'data');

const ghRawBase = 'https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main';

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

$done({ body: JSON.stringify(obj) });
`;
fs.writeFileSync(path.join(baseDir, 'js_tommm_gold.js'), locketGoldJs, 'utf8');

// =========================================================================
// 3. TÁCH RIÊNG SCRIPT 3: locket_badge.js (Nhẹ < 1KB - Bật Huy hiệu Gold)
// =========================================================================
const locketBadgeJs = `// Tommm Private - Enable Locket Gold Badge
if (typeof $response !== "undefined" && $response && $response.body) {
    try {
        let uObj = JSON.parse($response.body);
        if (uObj.result && uObj.result.data) {
            uObj.result.data.badge = "locket_gold";
            uObj.result.data.is_gold = true;
        }
        if (uObj.data) {
            uObj.data.badge = "locket_gold";
            uObj.data.is_gold = true;
        }
        $done({ body: JSON.stringify(uObj) });
    } catch (_) {
        $done({});
    }
} else {
    $done({
        response: {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                "data": { "badge": "locket_gold", "badge_tier": "gold", "is_gold": true, "success": true },
                "result": { "badge": "locket_gold", "badge_tier": "gold", "is_gold": true, "success": true, "data": { "badge": "locket_gold", "is_gold": true } }
            })
        }
    });
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
const customExtraSections = cloudArchiveSection.concat([weekdayCaptionsSection]).concat(
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

baseRcEntries["camera"] = JSON.stringify({ "gold_max_duration": 60, "max_duration": 60, "ultra_wide": true, "volume_button": true, "flash_button": true, "telephoto": true, "srgb": true, "lanczos": true, "quality_mbps": 0.6 });
baseRcEntries["camera_roll"] = JSON.stringify({ "gold_max_duration": 60, "video_max_duration": 60, "max_duration": 60, "trim_max_duration": 60, "camera_roll_max_duration": 60, "quality_mbps": 0.6, "flash_button": true });
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

const photoboothIds = [
    "photobooth_4cut", "photobooth_cute", "frame_berry_days", "frame_happy_snap", "frame_sky_diary",
    "pb_holo_4cut", "pb_scrapbook_ripped_4cut", "pb_ripped_paper_4cut", "pb_denim_ripped_2x2",
    "pb_cortis_4cut", "pb_cortis_v1", "pb_cortis_v2", "pb_ech_xanh", "pb_galaxy",
    "pb_meo_dang_yeu_4cut", "pb_photobooth_hello_kitty", "pb_shinchan_4cut", "pb_strawberry",
    "pb_supperman_4cut", "pb_trung_bac_thao", "pb_vien_hello_kitty", "pb_vintage"
].filter(id => framesManifest[id]);

const singleFrameIds = Object.keys(framesManifest).filter(id => !photoboothIds.includes(id));

const customFrameGroups = [
    { id: "group_photobooth", title: { en: "Khung & Photobooth 📸", vi: "Khung & Photobooth 📸" }, filter_ids: photoboothIds },
    { id: "group_frames", title: { en: "Khung Viền & Hot Trend 🖼️", vi: "Khung Viền & Hot Trend 🖼️" }, filter_ids: singleFrameIds }
];
const customFrameIds = photoboothIds.concat(singleFrameIds);

const customRemoteFilters = customFrameIds.map(id => {
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

// Fallback Filter config chỉ gồm các Filter chính chủ của Locket (phòng khi Firebase trả NO_CHANGE nên không có liveFilterCfg)
const nativeGroups = (dvFilterCfg.sheet_filters || []).filter(g => !["group_hot_ai_3d", "group_photobooth", "group_frames"].includes(g.id));
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

// Không ghi đè cứng overlay_items & camera_filter_config để giữ nguyên 100% Caption ngày lễ mới nhất & Filter chính chủ của Locket!
delete baseRcEntries["overlay_items"];
delete baseRcEntries["camera_filter_config"];
try {
    const fg = JSON.parse(baseRcEntries["feature_gates"] || "{}");
    fg.camera_filter_sheet = "enabled";
    fg.camera_filters = "enabled";
    fg.ai_filters = "enabled";
    fg.camera_filter_button = "enabled";
    fg.custom_filters = "enabled";
    baseRcEntries["feature_gates"] = JSON.stringify(fg);
} catch (_) {}
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

// 1. Lưu lại overlay_items và camera_filter_config CHÍNH CHỦ mới nhất từ server Locket (và cache vào $persistentStore phòng khi Firebase trả NO_CHANGE)
var liveOverlayItems = [];
try {
    if (obj.entries["overlay_items"]) {
        liveOverlayItems = JSON.parse(obj.entries["overlay_items"]);
        if (typeof $persistentStore !== "undefined" && Array.isArray(liveOverlayItems) && liveOverlayItems.length > 0) {
            $persistentStore.write(obj.entries["overlay_items"], "tommm_live_overlays");
        }
    } else if (typeof $persistentStore !== "undefined") {
        var cachedOverlays = $persistentStore.read("tommm_live_overlays");
        if (cachedOverlays) liveOverlayItems = JSON.parse(cachedOverlays);
    }
} catch (_) { liveOverlayItems = []; }

var liveFilterCfg = null;
try {
    if (obj.entries["camera_filter_config"]) {
        liveFilterCfg = JSON.parse(obj.entries["camera_filter_config"]);
        if (typeof $persistentStore !== "undefined" && liveFilterCfg && typeof liveFilterCfg === "object") {
            $persistentStore.write(obj.entries["camera_filter_config"], "tommm_live_filter_cfg");
        }
    } else if (typeof $persistentStore !== "undefined") {
        var cachedFilter = $persistentStore.read("tommm_live_filter_cfg");
        if (cachedFilter) liveFilterCfg = JSON.parse(cachedFilter);
    }
} catch (_) { liveFilterCfg = null; }

// 2. Áp dụng toàn bộ cấu hình Locket Gold (Video dài, Rollcall Strip, Tắt quảng cáo, Popup chào mừng Tommm)
var TOMMM_ENTRIES = ${JSON.stringify(baseRcEntries)};
Object.assign(obj.entries, TOMMM_ENTRIES);

// 3. Tự động lưu vĩnh viễn mọi Caption mới chính chủ của Locket (lễ/sự kiện) vào $persistentStore để hết mùa cũng không bị mất!
var EXTRA_SECTIONS = ${JSON.stringify(customExtraSections)};
var mergedOverlays = Array.isArray(liveOverlayItems) && liveOverlayItems.length > 0 ? liveOverlayItems.slice() : ${JSON.stringify(dvOverlays.slice(0, 1))};
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
            if (!archivedIds[cur.overlay_id] && archivedItems.length < 250) {
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

// 4. Luôn bật nút AI / Filter CHÍNH CHỦ của Locket + Gộp nhóm Khung Viền & Photobooth 4 ô (giữ nguyên mặt 100%, chạy Cloudflare 0đ)
var CUSTOM_FRAME_GROUPS = ${JSON.stringify(customFrameGroups)};
var CUSTOM_FRAME_IDS = ${JSON.stringify(customFrameIds)};
var CUSTOM_REMOTE_FILTERS = ${JSON.stringify(customRemoteFilters)};

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
AND,((DOMAIN-SUFFIX,googlevideo.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,youtubei.googleapis.com),(PROTOCOL,UDP)),REJECT

[Header Rewrite]
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del x-revenuecat-etag
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del X-RevenueCat-ETag
http-request ^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/user-customization-service\\/v1\\/customize$ header-del if-none-match

[URL Rewrite]
^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|applyFilter|createOverlay|ai-filters)(.*) 'https://locket-tommm-studio.khoinguyennguyen85.workers.dev/$2$3' header
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
tommm_gold = type=http-response, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/[^/]+$), script-path=${ghRawBase}/js_tommm_gold.js, requires-body=true, max-size=-1, timeout=60
tommm_del_header = type=http-request, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers), script-path=${ghRawBase}/js_tommm_deleteHeader.js, timeout=60
tommm_rc = type=http-response, pattern=^https:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a\\/.+, script-path=${ghRawBase}/js_tommm_rc.js?v=18, requires-body=true, max-size=-1, timeout=60, script-update-interval=0
tommm_ai_route = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|applyFilter|createOverlay|ai-filters), script-path=${ghRawBase}/js_tommm_ai_route.js?v=18, timeout=60, script-update-interval=0
tommm_badge_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/changeProfileInfo, script-path=${ghRawBase}/js_tommm_badge.js, timeout=60
tommm_badge_res = type=http-response, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(changeProfileInfo|fetchUser), script-path=${ghRawBase}/js_tommm_badge.js, requires-body=true, max-size=-1, timeout=60

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
AND,((DOMAIN-SUFFIX,googlevideo.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,youtubei.googleapis.com),(PROTOCOL,UDP)),REJECT

[Header Rewrite]
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del x-revenuecat-etag
http-request ^https?:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/?(.*?)*$) header-del X-RevenueCat-ETag
http-request ^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/user-customization-service\\/v1\\/customize$ header-del if-none-match

[URL Rewrite]
^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|applyFilter|createOverlay|ai-filters)(.*) 'https://locket-tommm-studio.khoinguyennguyen85.workers.dev/$2$3' header
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!(dclk_video_ads|videoplayback\\?)).+&oad _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/api\\/stats\\/ads _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/(pagead|ptracking) _ reject-200
^https?:\\/\\/s\\.youtube\\.com\\/api\\/stats\\/qoe\\?adcontext _ reject-200
(^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!dclk_video_ads).+?)&ctier=L(&.+?),ctier,(.+) $1$2$3 302

[Map Local]
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/initplayback.+&oad 'data-type=text data="" status-code=200'

[Script]
tommm_gold = type=http-response, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts$|subscribers\\/[^/]+$), script-path=${ghRawBase}/js_tommm_gold.js, requires-body=true, max-size=-1, timeout=60
tommm_del_header = type=http-request, pattern=^https:\\/\\/api\\.revenuecat\\.com\\/.+\\/(receipts|subscribers), script-path=${ghRawBase}/js_tommm_deleteHeader.js, timeout=60
tommm_rc = type=http-response, pattern=^https:\\/\\/firebaseremoteconfig\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a\\/.+, script-path=${ghRawBase}/js_tommm_rc.js?v=18, requires-body=true, max-size=-1, timeout=60, script-update-interval=0
tommm_ai_route = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(generateFilteredImage|applyFilter|createOverlay|ai-filters), script-path=${ghRawBase}/js_tommm_ai_route.js?v=18, timeout=60, script-update-interval=0
tommm_badge_req = type=http-request, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/changeProfileInfo, script-path=${ghRawBase}/js_tommm_badge.js, timeout=60
tommm_badge_res = type=http-response, pattern=^https:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(changeProfileInfo|fetchUser), script-path=${ghRawBase}/js_tommm_badge.js, requires-body=true, max-size=-1, timeout=60

[MITM]
hostname = %APPEND%, *.googlevideo.com, youtubei.googleapis.com, www.youtube.com, s.youtube.com, -redirector*.googlevideo.com, api.revenuecat.com, firebaseremoteconfig.googleapis.com, api.rc-backup.com, us-central1-locket-4252a.cloudfunctions.net, api.locketcamera.com
`;
fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Cloud.sgmodule'), sgModuleContent, 'utf8');

console.log("Built 4 modular scripts:");
for (const fn of ['js_tommm_deleteHeader.js', 'js_tommm_gold.js', 'js_tommm_badge.js', 'js_tommm_rc.js', 'Locket_Tommm_Cloud.conf']) {
    console.log(" ", fn, "->", fs.statSync(path.join(baseDir, fn)).size, "bytes");
}
