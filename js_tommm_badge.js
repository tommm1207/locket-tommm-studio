// Tommm Private - Per-User Smart Locket Gold Badge (myUid-Only, FetchUserV2 + Self Profile Merge)
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
    try {
        var hdrs = (typeof $request !== "undefined" && $request && $request.headers) ? $request.headers : null;
        if (hdrs) {
            var auth = hdrs["Authorization"] || hdrs["authorization"] || "";
            var m = String(auth).match(/^Bearer\s+[^.]+\.([^.]+)\.[^.]+$/i);
            if (m && m[1]) {
                var jwt = JSON.parse(decodeBase64Url(m[1]));
                var jwtUid = jwt.user_id || jwt.sub || "";
                if (jwtUid) {
                    uid = String(jwtUid);
                    writeStore(uid, "tommm_my_locket_uid");
                }
            }
        }
    } catch (_) {}
    return uid;
}

function pickUserNode(uObj) {
    if (!uObj || typeof uObj !== "object") return null;
    if (uObj.result && typeof uObj.result === "object") {
        if (uObj.result.data && typeof uObj.result.data === "object") return uObj.result.data;
        if (uObj.result.uid || uObj.result.user_id || uObj.result.username || uObj.result.first_name) return uObj.result;
    }
    if (uObj.data && typeof uObj.data === "object") return uObj.data;
    if (uObj.user && typeof uObj.user === "object") return uObj.user;
    if (uObj.uid || uObj.user_id || uObj.username || uObj.first_name) return uObj;
    return null;
}

var myUid = resolveMyUid();
var reqUrl = (typeof $request !== "undefined" && $request && $request.url) ? String($request.url) : "";
var isChangeProfile = reqUrl.indexOf("changeProfileInfo") !== -1;

if (typeof $response === "undefined") {
    // Pass through fetchUser/getUser/getAccountInfo immediately after caching myUid from Authorization JWT!
    if (!isChangeProfile) {
        $done({});
    } else {
        var rawBody = (typeof $request !== "undefined" && $request && $request.body) ? String($request.body) : "";
        if (rawBody.indexOf("badge") === -1) {
            $done({});
        } else {
            var isTurningOff = /"badge"\s*:\s*(null|false|"")/i.test(rawBody);
            var isTurningOn = !isTurningOff && (rawBody.indexOf("locket_gold") !== -1 || /"badge"\s*:\s*(true|"gold")/i.test(rawBody));
            writeStore(isTurningOn ? "ON" : "OFF", "tommm_my_badge_state");
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
    var badgeState = readStore("tommm_my_badge_state") || "ON";
    try {
        var uObj = JSON.parse($response.body);
        var targetNode = pickUserNode(uObj);
        var targetUid = targetNode && (targetNode.uid || targetNode.user_id || targetNode.id);
        var hasPrivateSelfField = !!(targetNode && (targetNode.email || targetNode.phone_number || typeof targetNode.is_temp !== "undefined" || targetNode.fcm_tokens));
        var isMine = false;
        if (targetNode) {
            if (isChangeProfile) isMine = true;
            else if (myUid && targetUid) isMine = String(targetUid) === String(myUid);
            else if (hasPrivateSelfField) {
                isMine = true;
                if (targetUid) writeStore(String(targetUid), "tommm_my_locket_uid");
            }
        }
        if (isMine && targetNode) {
            if (badgeState === "OFF") {
                targetNode.badge = null;
                targetNode.badge_tier = null;
                targetNode.is_gold = false;
            } else {
                targetNode.badge = "locket_gold";
                targetNode.badge_tier = "gold";
                targetNode.is_gold = true;
            }
            writeStore(JSON.stringify(targetNode), "tommm_my_user_profile");
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
