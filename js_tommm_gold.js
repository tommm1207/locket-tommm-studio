// Tommm Private - Locket Gold VIP + Filter Pack (RevenueCat)
// Tự động ghi nhớ đúng ngày người dùng kích hoạt lần đầu bằng $persistentStore!
var obj = JSON.parse($response.body || "{}");
var STORE_KEY = "tommm_locket_gold_first_date";
var PURCHASE_DATE = "";
if (typeof $persistentStore !== "undefined") {
    PURCHASE_DATE = $persistentStore.read(STORE_KEY) || "";
    if (!PURCHASE_DATE) {
        PURCHASE_DATE = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
        $persistentStore.write(PURCHASE_DATE, STORE_KEY);
    }
} else {
    PURCHASE_DATE = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
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
var urlMatch = reqUrl.match(/\/subscribers\/([^/?#]+)/i);
var myUid = (urlMatch && urlMatch[1]) || (obj.subscriber && obj.subscriber.original_app_user_id) || "";
if (myUid && typeof $persistentStore !== "undefined") {
    $persistentStore.write(String(myUid), "tommm_my_locket_uid");
}

$done({ body: JSON.stringify(obj) });
