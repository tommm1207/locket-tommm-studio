// Tommm Private - Per-User Smart Locket Gold Badge (myUid-Only, Anti-Poison + Recursive User Node Stamp)
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
            var m = String(auth).match(/(?:Bearer\s+)?([^.\s]+)\.([^.\s]+)\.([^.\s]+)/i);
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
            var isTurningOff = /"(badge|show_badge|badge_enabled|badge_visible)"\s*:\s*(null|false|"")/i.test(rawBody);
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
