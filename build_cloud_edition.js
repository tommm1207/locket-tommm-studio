const fs = require('fs');
const path = require('path');

const baseDir = 'D:\\Locket_Gold_Tommm';
const dataDir = path.join(baseDir, 'data');

const ghCdnBase = 'https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main';
const ghRawBase = 'https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main';

const dvRc = JSON.parse(fs.readFileSync(path.join(dataDir, 'duyvinh_rc_output.json'), 'utf8')).entries;
const vpsRc = JSON.parse(fs.readFileSync(path.join(dataDir, 'vps_firebase.json'), 'utf8')).entries;

// 1. Build Tommm's exclusive Caption sets + Weekday Multi-language + 324 merged captions
const dvOverlays = JSON.parse(dvRc.overlay_items);
const vpsOverlays = JSON.parse(vpsRc.overlay_items);

const tommmExclusiveSection = {
    section: "👑 Tommm VIP Exclusive ✨",
    items: [
        {
            overlay_id: "caption:custom_tommm01",
            source: "remote",
            caption: {
                type: "static_content",
                text: "Welcome to Tommm's Locket ✨",
                max_lines: 1,
                text_color: "#0F172A",
                icon: { type: "emoji", data: "👑" },
                background: { colors: ["#FDE047", "#F59E0B"] }
            }
        },
        {
            overlay_id: "caption:custom_tommm02",
            source: "remote",
            caption: {
                type: "static_content",
                text: "Tommm Gold Edition 💛",
                max_lines: 1,
                text_color: "#FFFFFF",
                icon: { type: "emoji", data: "⚡" },
                background: { colors: ["#1E3A8A", "#3B82F6"] }
            }
        },
        {
            overlay_id: "caption:custom_tommm03",
            source: "remote",
            caption: {
                type: "static_content",
                text: "Tommm đang rất chill 🎧",
                max_lines: 1,
                text_color: "#FFFFFF",
                icon: { type: "emoji", data: "🌙" },
                background: { colors: ["#311042", "#8B5CF6"] }
            }
        },
        {
            overlay_id: "caption:custom_tommm04",
            source: "remote",
            caption: {
                type: "static_content",
                text: "KTX Vibe with Tommm 🏢",
                max_lines: 1,
                text_color: "#FFFFFF",
                icon: { type: "emoji", data: "☕" },
                background: { colors: ["#0F766E", "#14B8A6"] }
            }
        },
        {
            overlay_id: "caption:custom_tommm05",
            source: "remote",
            caption: {
                type: "static_content",
                text: "Gửi ngàn yêu thương từ Tommm 💌",
                max_lines: 1,
                text_color: "#FFFFFF",
                icon: { type: "emoji", data: "💖" },
                background: { colors: ["#EC4899", "#F43F5E"] }
            }
        },
        {
            overlay_id: "caption:custom_tommm06",
            source: "remote",
            caption: {
                type: "static_content",
                text: "Đẹp trai chuẩn Tommm 😎",
                max_lines: 1,
                text_color: "#FFFFFF",
                icon: { type: "emoji", data: "🔥" },
                background: { colors: ["#EA580C", "#FACC15"] }
            }
        },
        {
            overlay_id: "caption:custom_tommm07",
            source: "remote",
            caption: {
                type: "static_content",
                text: "100% Private • By Tommm 🛡️",
                max_lines: 1,
                text_color: "#FFFFFF",
                icon: { type: "emoji", data: "🔒" },
                background: { colors: ["#0F172A", "#334155"] }
            }
        }
    ]
};

const weekdayCaptionsSection = {
    section: "📅 Thứ Ngày Đa Ngôn Ngữ (VI • EN • ZH • TW • DE)",
    items: [
        // Tiếng Việt
        { overlay_id: "caption:custom_dayvi2", source: "remote", caption: { type: "static_content", text: "THỨ HAI", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi3", source: "remote", caption: { type: "static_content", text: "THỨ BA", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi4", source: "remote", caption: { type: "static_content", text: "THỨ TƯ", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi5", source: "remote", caption: { type: "static_content", text: "THỨ NĂM", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi6", source: "remote", caption: { type: "static_content", text: "THỨ SÁU", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi7", source: "remote", caption: { type: "static_content", text: "THỨ BẢY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#0F172A", "#334155"] } } },
        { overlay_id: "caption:custom_dayvi8", source: "remote", caption: { type: "static_content", text: "CHỦ NHẬT", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇻🇳" }, background: { colors: ["#991B1B", "#DC2626"] } } },
        // English
        { overlay_id: "caption:custom_dayen2", source: "remote", caption: { type: "static_content", text: "MONDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen3", source: "remote", caption: { type: "static_content", text: "TUESDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen4", source: "remote", caption: { type: "static_content", text: "WEDNESDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen5", source: "remote", caption: { type: "static_content", text: "THURSDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen6", source: "remote", caption: { type: "static_content", text: "FRIDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen7", source: "remote", caption: { type: "static_content", text: "SATURDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#1E3A8A", "#2563EB"] } } },
        { overlay_id: "caption:custom_dayen8", source: "remote", caption: { type: "static_content", text: "SUNDAY", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇬🇧" }, background: { colors: ["#BE123C", "#F43F5E"] } } },
        // Tiếng Trung / Đài Loan (星期 / 禮拜)
        { overlay_id: "caption:custom_dayzh2", source: "remote", caption: { type: "static_content", text: "星期一 • 禮拜一", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh3", source: "remote", caption: { type: "static_content", text: "星期二 • 禮拜二", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh4", source: "remote", caption: { type: "static_content", text: "星期三 • 禮拜三", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh5", source: "remote", caption: { type: "static_content", text: "星期四 • 禮拜四", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh6", source: "remote", caption: { type: "static_content", text: "星期五 • 禮拜五", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh7", source: "remote", caption: { type: "static_content", text: "星期六 • 禮拜六", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#7C2D12", "#EA580C"] } } },
        { overlay_id: "caption:custom_dayzh8", source: "remote", caption: { type: "static_content", text: "星期日 • 禮拜天", max_lines: 1, text_color: "#FFFFFF", icon: { type: "emoji", data: "🇹🇼" }, background: { colors: ["#991B1B", "#EF4444"] } } },
        // Tiếng Đức (Deutsch)
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
    if (sec.section.includes("Duy Vinh")) {
        sec.section = "🎨 Decorative VIP ✨";
    }
    for (const item of (sec.items || [])) {
        if (item.caption && item.caption.text) {
            item.caption.text = item.caption.text.replace(/duyvinh/gi, "Tommm");
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
    if (uniqueItems.length > 0) {
        dvOverlays.push({
            section: "🎨 " + sec.section,
            items: uniqueItems
        });
    }
}

dvOverlays.splice(1, 0, tommmExclusiveSection, weekdayCaptionsSection);

// 2. Build Camera Filter Config (ONLY standard Locket iOS schema keys: NO duplicate remoteFilters/filters/sheetFilters/pickerFilters and compact prompts so camera_filter_config is < 65KB and never crashes Firebase Remote Config SDK!)
const mergedFilterCfg = JSON.parse(fs.readFileSync(path.join(dataDir, 'merged_camera_filter_config.json'), 'utf8'));
const removeIds = new Set(["frame_ba_khi", "sticker_binh_luan_minh_tue", "cmt_locket", "frame_tommm_gold"]);

const cleanRemoteFilters = [];
for (const rf of (mergedFilterCfg.remote_filters || [])) {
    const fid = rf.id || rf.uid;
    if (!fid || removeIds.has(fid)) continue;
    const isAi = fs.existsSync(path.join(baseDir, 'assets', 'ai', `${fid}.png`));
    const sub = isAi ? 'ai' : 'frames';
    const cloudUrl = `${ghCdnBase}/assets/${sub}/${fid}.png`;
    cleanRemoteFilters.push({
        uid: fid,
        id: fid,
        name: rf.name,
        category: rf.category || (isAi ? "AI 3D Hot 🔥" : "Photobooth 📸"),
        prompt: fid,
        style: rf.style || "cutout",
        type: rf.type || "normal",
        filterType: rf.filterType || "normal",
        overlay: true,
        imageUrl: cloudUrl,
        iconUrl: cloudUrl,
        overlayImageUrl: cloudUrl,
        overlayImageURL: cloudUrl,
        tintColor: rf.tintColor || "#F59E0B",
        colors: rf.colors || ["#FDE047", "#F59E0B"],
        captureButtonColors: rf.captureButtonColors || ["#FDE047", "#F59E0B"],
        icon: {
            url: cloudUrl,
            iconUrl: cloudUrl,
            remoteImage: cloudUrl,
            sfSymbol: (rf.icon && rf.icon.sfSymbol) ? rf.icon.sfSymbol : "sparkles",
            emoji: (rf.icon && rf.icon.emoji) ? rf.icon.emoji : ""
        },
        productUrl: null,
        textColor: "#FFFFFF",
        referenceImages: []
    });
}

const cleanSheetFilters = [];
for (const sec of (mergedFilterCfg.sheet_filters || [])) {
    const fids = (sec.filter_ids || []).filter(id => !removeIds.has(id));
    if (fids.length > 0) {
        cleanSheetFilters.push({
            title: sec.title,
            filter_ids: fids
        });
    }
}

const cleanCameraFilterConfig = {
    allows_custom_filters: true,
    show_filter_button: true,
    sheet_enabled: true,
    open_sheet_immediately: true,
    sheet_filters: cleanSheetFilters,
    filter_groups: mergedFilterCfg.filter_groups || [],
    picker_filters: (mergedFilterCfg.picker_filters || []).filter(id => !removeIds.has(id)),
    remote_filters: cleanRemoteFilters
};

// 3. Build Base Remote Config Entries starting from 100% of DuyVinh's 182 proven working entries!
const baseRcEntries = Object.assign({}, dvRc);
delete baseRcEntries["settings_instagram_url"];
delete baseRcEntries["settings_tiktok_url"];
delete baseRcEntries["widget_frame_event"];

baseRcEntries["camera"] = JSON.stringify({
    "gold_max_duration": 60,
    "max_duration": 60,
    "ultra_wide": true,
    "volume_button": true,
    "flash_button": true,
    "telephoto": true,
    "srgb": true,
    "lanczos": true,
    "quality_mbps": 0.6
});
baseRcEntries["camera_roll"] = JSON.stringify({
    "gold_max_duration": 60,
    "video_max_duration": 60,
    "max_duration": 60,
    "trim_max_duration": 60,
    "camera_roll_max_duration": 60,
    "quality_mbps": 0.6,
    "flash_button": true
});

baseRcEntries["rollcall_share_templates"] = JSON.stringify({"templates":["bold","pop_off","stacking","full_screen","shadow_box","collage","pop_collage"],"random_order":false});
baseRcEntries["time_travel_rewind_v2_share_templates"] = JSON.stringify({"templates":["rounded_square","grid_collage","cutout_collage","rounded_square_bold","wall_calendar"],"random_order":false});
baseRcEntries["rollcall_memories_streaks_enabled"] = "true";
baseRcEntries["rollcall_profile_memories_enabled"] = "true";
baseRcEntries["rollcall_profile_memories_config"] = JSON.stringify({"useBadgeFetchMode":true,"sharePreviews":true,"currentWeekPlaceholder":true,"historyRefreshTTLSeconds":0});

baseRcEntries["feature_discovery_popup_config"] = JSON.stringify({
    "tag": "LOCKET GOLD • TOMMM",
    "tag_gradient": true,
    "tag_style": "gold_gradient",
    "title": "Chào mừng Tommm đến với Locket Gold ✨",
    "feature_set": [{
        "title": "Welcome back, Tommm",
        "body": "Đã kích hoạt đầy đủ Locket Gold, 360+ Captions, Thứ Ngày Đa Ngôn Ngữ, Video 60s & Photobooth."
    }],
    "primary_button_title": "Tiếp tục",
    "campaign": "locket_gold_welcome_tommm_v3",
    "start_at": "2020-01-01T00:00:00",
    "end_at": "2099-12-31T23:59:59",
    "use_local_time_zone": true
});

const dynCaptions = ["standard","poll","color_palette","review","music","location","weather","time","streak","star_sign","party_time","locket_count","good_morning","goodnight","ootd","miss_you","custom","halloween_2026"];
baseRcEntries["overlay_dynamic_captions"] = JSON.stringify(dynCaptions);
baseRcEntries["camera_filter_config"] = JSON.stringify(cleanCameraFilterConfig);
baseRcEntries["overlay_items"] = JSON.stringify(dvOverlays);

const fullEntitlementList = [
    "Gold", "gold", "locket_gold", "locket_gold_annual", "premium", "Premium",
    "pro", "Pro", "camera_filters", "camera_filter", "filters", "filter",
    "ai_filters", "ai_filter", "photobooth", "holiday_effects", "holiday_filters",
    "custom_filters", "effect_pack_20", "vip"
];

const jsContent = `// =========================================================================
// Locket_Tommm_Private.js - Hệ thống Locket Gold Cloud 24/7 của Tommm
// Chủ sở hữu: Tommm (GitHub Cloud: tommm1207/locket-tommm-studio)
// =========================================================================

(function() {
    const hasResponse = typeof $response !== "undefined" && $response !== null;
    const hasRequest = typeof $request !== "undefined" && $request !== null;
    const url = (hasRequest && $request.url) ? $request.url : (hasResponse && $response.url ? $response.url : "");

    const BASE_RC_ENTRIES = ${JSON.stringify(baseRcEntries)};
    const PICKER_FILTERS = ${JSON.stringify(cleanCameraFilterConfig.picker_filters)};

    // 0. Mở khóa Huy hiệu Locket Gold (changeProfileInfo) ngay từ chiều Request
    if (!hasResponse && url.includes("changeProfileInfo")) {
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
        return;
    }

    // =========================================================================
    // 1. CHIỀU RESPONSE (Xử lý ngay trên iPhone của Tommm 24/7)
    // =========================================================================
    if (hasResponse) {
        let body = $response.body;

        // 1.0 Mở khóa Huy hiệu Locket Gold khi Locket gọi changeProfileInfo / fetchUserV2
        if (url.includes("changeProfileInfo") || url.includes("fetchUser")) {
            try {
                let uObj = JSON.parse(body || "{}");
                if (!uObj || typeof uObj !== "object") uObj = {};
                if (!uObj.result) uObj.result = { status: 200, data: {} };
                if (!uObj.result.data) uObj.result.data = {};
                uObj.result.data.badge = "locket_gold";
                uObj.result.data.badge_tier = "gold";
                uObj.result.data.is_gold = true;
                if (uObj.data && typeof uObj.data === "object") {
                    uObj.data.badge = "locket_gold";
                    uObj.data.badge_tier = "gold";
                    uObj.data.is_gold = true;
                }
                $done({ body: JSON.stringify(uObj) });
                return;
            } catch (_) {
                $done({});
                return;
            }
        }

        // 1.1 Mở khóa phản hồi Filter / Photobooth
        if (url.includes("generateFilteredImage") || url.includes("createOverlay") || url.includes("generateFilter") || url.includes("applyFilter")) {
            try {
                let resObj = JSON.parse(body || "{}");
                delete resObj.error;
                delete resObj.errors;
                if (resObj.result) {
                    delete resObj.result.error;
                    delete resObj.result.errors;
                }
                $done({ body: JSON.stringify(resObj) });
                return;
            } catch (_) {
                $done({});
                return;
            }
        }

        // 1.2 Mở khóa toàn diện RevenueCat Gold VIP (Dùng ngày hôm nay 2026-11-23 cho ngày lên Gold!)
        if (url.includes("revenuecat.com") || url.includes("rc-backup.com")) {
            try {
                const allEntNames = ${JSON.stringify(fullEntitlementList)};

                if (url.includes("/offerings")) {
                    let offObj = {};
                    try { offObj = JSON.parse(body || "{}"); } catch (_) { offObj = {}; }
                    offObj.current_offering_id = "default";
                    offObj.offerings = [{
                        "description": "Locket Gold Tommm VIP",
                        "identifier": "default",
                        "packages": [
                            { "identifier": "$rc_annual", "platform_product_identifier": "locket_1600_1y" },
                            { "identifier": "$rc_monthly", "platform_product_identifier": "locket_3600_1y" }
                        ]
                    }];
                    $done({ body: JSON.stringify(offObj) });
                    return;
                }

                if (url.includes("product_entitlement_mapping")) {
                    $done({
                        body: JSON.stringify({
                            "product_entitlement_mapping": {
                                "locket_1600_1y": { "product_identifier": "locket_1600_1y", "entitlements": allEntNames },
                                "locket_3600_1y": { "product_identifier": "locket_3600_1y", "entitlements": allEntNames },
                                "locket_gold_annual": { "product_identifier": "locket_gold_annual", "entitlements": allEntNames },
                                "com.locket.Locket.FilterPack_20Photos_500": { "product_identifier": "com.locket.Locket.FilterPack_20Photos_500", "entitlements": allEntNames }
                            }
                        })
                    });
                    return;
                }

                let obj = JSON.parse(body || "{}");
                const purchaseDate = "2026-11-23T00:00:00Z";
                const expiresDate = "9999-12-07T10:10:14Z";

                const makeEnt = (prodId) => ({
                    "grace_period_expires_date": null,
                    "purchase_date": purchaseDate,
                    "product_identifier": prodId,
                    "expires_date": expiresDate
                });

                const makeSub = (prodId, amt) => ({
                    "auto_resume_date": null,
                    "display_name": prodId,
                    "is_sandbox": true,
                    "ownership_type": "PURCHASED",
                    "billing_issues_detected_at": null,
                    "management_url": "https://apps.apple.com/account/subscriptions",
                    "period_type": "normal",
                    "price": { "amount": amt, "currency": "VND" },
                    "expires_date": expiresDate,
                    "grace_period_expires_date": null,
                    "refunded_at": null,
                    "unsubscribe_detected_at": null,
                    "original_purchase_date": purchaseDate,
                    "purchase_date": purchaseDate,
                    "store": "app_store",
                    "store_transaction_id": "2000001108724193"
                });

                obj.subscriber = obj.subscriber || {};
                obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
                obj.subscriber.entitlements = obj.subscriber.entitlements || {};

                for (const ename of allEntNames) {
                    obj.subscriber.entitlements[ename] = makeEnt(ename === "effect_pack_20" ? "com.locket.Locket.FilterPack_20Photos_500" : "locket_1600_1y");
                }
                obj.subscriber.subscriptions["locket_1600_1y"] = makeSub("locket_1600_1y", 399000);
                obj.subscriber.subscriptions["locket_3600_1y"] = makeSub("locket_3600_1y", 399000);
                obj.subscriber.subscriptions["com.locket.Locket.FilterPack_20Photos_500"] = makeSub("com.locket.Locket.FilterPack_20Photos_500", 0);

                $done({ body: JSON.stringify(obj) });
                return;
            } catch (e) {
                $done({});
                return;
            }
        }

        // 1.3 Mở khóa Firebase Remote Config (Chuẩn 100% $done({ body }) như Locket_Unlocked.js!)
        if (url.includes("firebaseremoteconfig")) {
            try {
                let obj = JSON.parse(body || "{}");
                obj.state = "UPDATE";
                obj.entries = obj.entries || {};
                Object.assign(obj.entries, BASE_RC_ENTRIES);
                $done({ body: JSON.stringify(obj) });
                return;
            } catch (e) {
                $done({});
                return;
            }
        }

        $done({});
        return;
    }

    // =========================================================================
    // 2. CHIỀU REQUEST (Xóa Cache ETag & Xử lý getFilters)
    // =========================================================================
    const reqUrl = (hasRequest && $request.url) ? $request.url : "";
    if (reqUrl.includes("revenuecat.com") || reqUrl.includes("rc-backup.com") || reqUrl.includes("firebaseremoteconfig")) {
        const headersToStrip = new Set(["x-revenuecat-etag", "if-none-match", "if-modified-since", "x-goog-if-none-match", "etag"]);
        let modifiedHeaders = Object.assign({}, ($request && $request.headers) || {});
        for (let key in modifiedHeaders) {
            if (headersToStrip.has(key.toLowerCase())) {
                modifiedHeaders[key] = undefined;
                delete modifiedHeaders[key];
            }
        }
        $done({ headers: modifiedHeaders });
        return;
    }

    if (reqUrl.includes("getFilters") || reqUrl.includes("createFilter")) {
        $done({
            response: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({
                    "result": { "data": { "filters": PICKER_FILTERS }, "status": 200 },
                    "data": { "filters": PICKER_FILTERS },
                    "status": 200
                })
            }
        });
        return;
    }

    $done({});
})();
`;

fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Private.js'), jsContent, 'utf8');

const allInOneExisting = fs.readFileSync(path.join(dataDir, 'All_In_One.db'), 'utf8');
const caPassMatch = allInOneExisting.match(/ca-passphrase\s*=\s*(.+)/);
const caP12Match = allInOneExisting.match(/ca-p12\s*=\s*(.+)/);
const caPassphrase = caPassMatch ? caPassMatch[1].trim() : 'ha3p1Jdy';
const caP12 = caP12Match ? caP12Match[1].trim() : '';

function makeConf(includeP12) {
    return `#!name=Locket Gold Tommm Cloud 24/7 (100% Owned by Tommm)
#!desc=Hệ thống Locket Gold Cloud 24/7 của Tommm - Không cần bật PC, 360+ Captions, Thứ Ngày Đa Ngôn Ngữ, Video 60s
[General]
bypass-system = true
skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 127.0.0.1, localhost, *.local, *.crashlytics.com
tun-excluded-routes = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.0.2.0/24, 192.88.99.0/24, 192.168.0.0/16, 198.18.0.0/15, 198.51.100.0/24, 203.0.113.0/24, 224.0.0.0/4, 255.255.255.255/32
dns-server = 1.1.1.1, 8.8.8.8, system
ipv6 = false
skip-cert-verify = true
update-url = ${ghRawBase}/Locket_Tommm_Cloud.conf

[Rule]
DOMAIN-SUFFIX,sentry.io,REJECT
DOMAIN-SUFFIX,crashlytics.com,REJECT
DOMAIN-SUFFIX,amplitude.com,REJECT
DOMAIN-SUFFIX,appsflyersdk.com,REJECT
AND,((DOMAIN-SUFFIX,googlevideo.com),(PROTOCOL,UDP)),REJECT
AND,((DOMAIN,youtubei.googleapis.com),(PROTOCOL,UDP)),REJECT
DOMAIN-SUFFIX,revenuecat.com,DIRECT
DOMAIN-SUFFIX,rc-backup.com,DIRECT
DOMAIN-SUFFIX,googleapis.com,DIRECT
DOMAIN-SUFFIX,cloudfunctions.net,DIRECT
DOMAIN-SUFFIX,locketcamera.com,DIRECT
FINAL,DIRECT

[URL Rewrite]
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!(dclk_video_ads|videoplayback\\?)).+&oad _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/api\\/stats\\/ads _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/(pagead|ptracking) _ reject-200
^https?:\\/\\/s\\.youtube\\.com\\/api\\/stats\\/qoe\\?adcontext _ reject-200
(^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!dclk_video_ads).+?)&ctier=L(&.+?),ctier,(.+) $1$2$3 302

[Header Rewrite]
http-request ^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.* header-del x-revenuecat-etag
http-request ^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.* header-del X-RevenueCat-ETag
http-request ^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.* header-del If-None-Match
http-request ^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.* header-del If-Modified-Since
http-request ^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/.* header-del If-None-Match
http-request ^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/.* header-del If-Modified-Since
http-request ^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/.* header-del ETag
http-request ^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/.* header-del x-goog-if-none-match
http-request ^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/user-customization-service\\/v1\\/customize$ header-del if-none-match

[Map Local]
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/initplayback.+&oad 'data-type=text data="" status-code=200'

[Script]
# =====================================================================
# 1. HỆ THỐNG LOCKET GOLD CLOUD 24/7 CỦA TOMMM (GITHUB: tommm1207/locket-tommm-studio)
# =====================================================================
tommm_strip_rc = type=http-request,pattern=^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.+\\/(receipts|subscribers),script-path=${ghCdnBase}/Locket_Tommm_Private.js,timeout=60
tommm_strip_fb = type=http-request,pattern=^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/.*,script-path=${ghCdnBase}/Locket_Tommm_Private.js,timeout=60
tommm_cf = type=http-request,pattern=^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(getFilters|createFilter|changeProfileInfo).*,script-path=${ghCdnBase}/Locket_Tommm_Private.js,timeout=60
tommm_badge_res = type=http-response,pattern=^https?:\\/\\/(us-central1-locket-4252a\\.cloudfunctions\\.net|api\\.locketcamera\\.com)\\/(changeProfileInfo|fetchUser).*,requires-body=true,max-size=-1,script-path=${ghCdnBase}/Locket_Tommm_Private.js,timeout=60
tommm_RC_Gold = type=http-response,pattern=^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.+,requires-body=true,max-size=-1,script-path=${ghCdnBase}/Locket_Tommm_Private.js,timeout=60
tommm_Firebase = type=http-response,pattern=^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/v1\\/projects\\/locket-4252a\\/.+,requires-body=true,max-size=-1,script-path=${ghCdnBase}/Locket_Tommm_Private.js,timeout=60

# =====================================================================
# 2. CÁC TIỆN ÍCH PREMIUM KHÁC (CHẠY TỪ GITHUB CỦA TOMMM 100%)
# =====================================================================
youtube.request = type=http-request,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/youtubei\\/v1\\/(browse|next|player|reel\\/reel_watch_sequence|get_watch),requires-body=1,max-size=-1,binary-body-mode=1,engine=jsc,script-path=${ghCdnBase}/js_other/youtube.response.js
youtube.response = type=http-response,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/(youtubei\\/v1\\/(browse|next|player|search|reel\\/reel_watch_sequence|guide|account\\/get_setting|get_watch))(\\?(.*))?$,requires-body=1,max-size=-1,binary-body-mode=1,engine={{{script}}},script-path=${ghCdnBase}/js_other/youtube.response.js,argument="{\\"lyricLang\\":\\"vi\\",\\"captionLang\\":\\"vi\\",\\"blockUpload\\":true,\\"blockImmersive\\":true,\\"debug\\":false}"
spotify-json = type=http-request,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/(artistview\\/v1\\/artist|album-entity-view\\/v2\\/album)\\/,requires-body=0,script-path=${ghCdnBase}/js_other/spotify-json.js
spotify-proto = type=http-response,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/(bootstrap\\/v1\\/bootstrap|user-customization-service\\/v1\\/customize)$,requires-body=1,binary-body-mode=1,max-size=0,script-path=${ghCdnBase}/js_other/spotify-proto.js,script-update-interval=0
SoundCloudGo+ = type=http-response,pattern=https://api-mobile.soundcloud.com/configuration/ios,requires-body=1,script-path=${ghCdnBase}/js_other/SoundCloudGoPlus.js
AlightMotion = type=http-response,script-path=${ghCdnBase}/js_other/AlightMotion.js,pattern=^https:\\/\\/us-central1-alight-creative\\.cloudfunctions\\.net\\/getAccountStatusAndLicenses,max-size=131072,requires-body=true,timeout=10,enable=true
PicsArt = type=http-request,pattern=^https:\\/\\/api\\.picsart\\.com\\/gw-v2\\/shop\\/subscription\\/apple\\/purchases,script-path=${ghCdnBase}/js_other/PicsArt.js,requires-body=true,timeout=60
PicsArtStorages = type=http-response,pattern=^https:\\/\\/api\\.picsart\\.com\\/gw-v2\\/cloud-storage\\/v1\\/me\\/storages,script-path=${ghCdnBase}/js_other/PicsArtStorages.js,requires-body=1,max-size=0
Wink = type=http-response,pattern=^https:\\/\\/api-sub\\.meitu\\.com\\/v2\\/user\\/vip_info_by_group\\.json,requires-body=1,script-path=${ghCdnBase}/js_other/WinkVipCrack.js
Truecaller = type=http-response,pattern=^https:\\/\\/premium-[^.]+\.truecaller\.com\\/v\\d+\\/(subscriptions\\/status|products\\/apple)(\\?.*)?$,requires-body=1,max-size=0,script-path=${ghCdnBase}/js_other/TrueCaller.js
Lightroom = type=http-response,pattern=^https:\\/\\/photos\\.adobe\\.io\\/v\\d\\/accounts,requires-body=1,max-size=0,script-path=${ghCdnBase}/js_other/lightroom.js,script-update-interval=-1
Kinemaster = type=http-response,pattern=^https:\\/\\/api-account\\.kinemasters\\.com\\/v\\d\\/user\\/subscribe$,requires-body=1,max-size=0,script-path=${ghCdnBase}/js_other/Kinemaster.js
Camscanner = requires-body=1,script-path=${ghCdnBase}/js_other/camScanner.js,type=http-response,pattern=https:\\/\\/(api|api-cs.*)\\.intsig\\.net\\/purchase\\/cs\\/query_property\\?
BeautyPlus = type=http-response, pattern=https:\\/\\/(api\\.mr\\.pixocial\\.com\\/v1\\/manual_unlock|newbeee-api\\.beautyplus\\.com\\/api\\/v1\\/asset\\/balance), script-path=${ghCdnBase}/js_other/BeautyPlus.js, requires-body=true, max-size=-1, timeout=60
iTunes = type=http-response, pattern=^https?:\\/\\/buy\\.itunes\\.apple\\.com\\/verifyReceipt$, script-path=${ghCdnBase}/js_other/iTunes.js, requires-body=true, max-size=-1, timeout=60
Snow = type=http-response, pattern=^https?:\\/\\/user-snow-api\\.snow\\.me\\/v\\d\\/purchase\\/subscription\\/subscriber\\/status, script-path=${ghCdnBase}/js_other/Snow.js, requires-body=true, max-size=-1, timeout=60
Meitu = type=http-response,pattern=^https?:\\/\\/(h5|api)\\.xiuxiu\\.meitu\\.com\\/v\\d\\/(h\\d\\/vip|vip|user)\\/,requires-body=1,script-path=${ghCdnBase}/js_other/MeiTuXiuXiu.js

[MITM]
${includeP12 ? `ca-passphrase = ${caPassphrase}\nca-p12 = ${caP12}\n` : ''}enable = true
skip-server-cert-verify = true
hostname = %APPEND%, *.googlevideo.com, youtubei.googleapis.com, www.youtube.com, s.youtube.com, -redirector*.googlevideo.com, premium*.truecaller.com, sub.store, api.revenuecat.com, *.revenuecat.com, rc-backup.revenuecat.com, api.rc-backup.com, firebaseremoteconfig.googleapis.com, *.firebaseremoteconfig.googleapis.com, firebaseremoteconfigrealtime.googleapis.com, *.firebaseremoteconfigrealtime.googleapis.com, us-central1-locket-4252a.cloudfunctions.net, api.locketcamera.com, buy.itunes.apple.com, spclient.wg.spotify.com, *spclient.spotify.com, api-mobile.soundcloud.com, api.picsart.com, us-central1-alight-creative.cloudfunctions.net, api-sub.meitu.com, photos.adobe.io, ap*.intsig.net, api-account.kinemasters.com, api.mr.pixocial.com, newbeee-api.beautyplus.com, user-snow-api.snow.me, h5.xiuxiu.meitu.com, api.xiuxiu.meitu.com
`;
}

fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Cloud.conf'), makeConf(false), 'utf8');
fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Private.conf'), makeConf(true), 'utf8');
console.log("Successfully rebuilt compact Cloud 24/7 edition!");
