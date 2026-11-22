// Tommm Private - Locket Gold VIP + Filter Pack (RevenueCat)
var obj = JSON.parse($response.body || "{}");
var PURCHASE_DATE = "2026-11-23T00:00:00Z";
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
