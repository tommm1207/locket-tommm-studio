// Tommm Private - Per-User Smart Locket Gold Badge (myUid-Only)
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
            var m = String(auth).match(/^Bearer\s+[^.]+\.([^.]+)\.[^.]+$/i);
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
        var isTurningOn = rawBody.indexOf("locket_gold") !== -1 || /"badge"\s*:\s*true/i.test(rawBody);
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
