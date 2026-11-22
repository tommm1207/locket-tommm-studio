// Tommm Private - Enable Locket Gold Badge
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
