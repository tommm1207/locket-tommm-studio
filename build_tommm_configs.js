const fs = require('fs');
const path = require('path');

const baseDir = 'D:\\Locket_Gold_Tommm';
const dataDir = path.join(baseDir, 'data');
const serverBase = 'http://192.168.50.72:8899';

const allInOneExisting = fs.readFileSync(path.join(dataDir, 'All_In_One.db'), 'utf8');
const caPassMatch = allInOneExisting.match(/ca-passphrase\s*=\s*(.+)/);
const caP12Match = allInOneExisting.match(/ca-p12\s*=\s*(.+)/);
const caPassphrase = caPassMatch ? caPassMatch[1].trim() : 'ha3p1Jdy';
const caP12 = caP12Match ? caP12Match[1].trim() : '';

// 1. Create Locket_Tommm_Private.conf (100% Independent - Zero 163.223.9.98 VPS, Zero third-party servers for Locket!)
const tommmConf = `#!name=Locket Gold Tommm Private (100% Self-Hosted & Clean)
#!desc=Hệ thống Locket Gold Độc Lập của Tommm - Không qua VPS lạ, 330+ Captions, Photobooth & Filter
[General]
bypass-system = true
skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 127.0.0.1, localhost, *.local, *.crashlytics.com
tun-excluded-routes = 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.0.2.0/24, 192.88.99.0/24, 192.168.0.0/16, 198.18.0.0/15, 198.51.100.0/24, 203.0.113.0/24, 224.0.0.0/4, 255.255.255.255/32
dns-server = 1.1.1.1, 8.8.8.8, system
ipv6 = false
skip-cert-verify = true
update-url = ${serverBase}/Locket_Tommm_Private.conf

[Rule]
# Chặn hoàn toàn các dịch vụ thu thập dữ liệu / báo cáo lỗi của Locket để tàng hình 100%
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
# Chặn quảng cáo Google Video & YouTube Ads
^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!(dclk_video_ads|videoplayback\\?)).+&oad _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/api\\/stats\\/ads _ reject-200
^https?:\\/\\/(www|s)\\.youtube\\.com\\/(pagead|ptracking) _ reject-200
^https?:\\/\\/s\\.youtube\\.com\\/api\\/stats\\/qoe\\?adcontext _ reject-200
(^https?:\\/\\/[\\w-]+\\.googlevideo\\.com\\/(?!dclk_video_ads).+?)&ctier=L(&.+?),ctier,(.+) $1$2$3 302

[Header Rewrite]
# Chống cache 304 Not Modified để luôn kích hoạt Gold, Filter & 330+ Captions ngay trên iPhone của Tommm
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
# 1. HỆ THỐNG LOCKET GOLD ĐỘC LẬP CỦA TOMMM (CHẠY TỪ D:\\Locket_Gold_Tommm)
# =====================================================================
tommm_strip_rc = type=http-request,pattern=^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.*,requires-body=0,max-size=1048576,script-path=${serverBase}/Locket_Tommm_Private.js,timeout=60
tommm_strip_fb = type=http-request,pattern=^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/.*,requires-body=0,max-size=1048576,script-path=${serverBase}/Locket_Tommm_Private.js,timeout=60
tommm_cf = type=http-request,pattern=^https?:\\/\\/us-central1-locket-4252a\\.cloudfunctions\\.net\\/(generateFilteredImage|getFilters|createFilter|applyFilter|createOverlay|ai-filters).*,requires-body=0,max-size=1048576,script-path=${serverBase}/Locket_Tommm_Private.js,timeout=60
tommm_RC_Gold = type=http-response,pattern=^https?:\\/\\/(api|rc-backup)\\.revenuecat\\.com\\/.*,requires-body=1,max-size=-1,script-path=${serverBase}/Locket_Tommm_Private.js,timeout=60
tommm_Firebase = type=http-response,pattern=^https?:\\/\\/.*firebaseremoteconfig.*\\.googleapis\\.com\\/.*,requires-body=1,max-size=-1,script-path=${serverBase}/Locket_Tommm_Private.js,timeout=60

# =====================================================================
# 2. CÁC TIỆN ÍCH PREMIUM KHÁC (YOUTUBE, SPOTIFY, SOUNDCLOUD, PICSART, LIGHTROOM...)
# =====================================================================
youtube.request = type=http-request,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/youtubei\\/v1\\/(browse|next|player|reel\\/reel_watch_sequence|get_watch),requires-body=1,max-size=-1,binary-body-mode=1,engine=jsc,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/youtube.response.js
youtube.response = type=http-response,pattern=^https:\\/\\/youtubei\\.googleapis\\.com\\/(youtubei\\/v1\\/(browse|next|player|search|reel\\/reel_watch_sequence|guide|account\\/get_setting|get_watch))(\\?(.*))?$,requires-body=1,max-size=-1,binary-body-mode=1,engine={{{script}}},script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/youtube.response.js,argument="{\\"lyricLang\\":\\"vi\\",\\"captionLang\\":\\"vi\\",\\"blockUpload\\":true,\\"blockImmersive\\":true,\\"debug\\":false}"
spotify-json = type=http-request,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/(artistview\\/v1\\/artist|album-entity-view\\/v2\\/album)\\/,requires-body=0,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/spotify-json.js
spotify-proto = type=http-response,pattern=^https:\\/\\/(spclient\\.wg\\.spotify\\.com|.*-spclient\\.spotify\\.com(:443)?)\\/(bootstrap\\/v1\\/bootstrap|user-customization-service\\/v1\\/customize)$,requires-body=1,binary-body-mode=1,max-size=0,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/spotify-proto.js,script-update-interval=0
SoundCloudGo+ = type=http-response,pattern=https://api-mobile.soundcloud.com/configuration/ios,requires-body=1,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/SoundCloudGoPlus.js
AlightMotion = type=http-response,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/AlightMotion.js,pattern=^https:\\/\\/us-central1-alight-creative\\.cloudfunctions\\.net\\/getAccountStatusAndLicenses,max-size=131072,requires-body=true,timeout=10,enable=true
PicsArt = type=http-request,pattern=^https:\\/\\/api\\.picsart\\.com\\/gw-v2\\/shop\\/subscription\\/apple\\/purchases,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/PicsArt.js,requires-body=true,timeout=60
PicsArtStorages = type=http-response,pattern=^https:\\/\\/api\\.picsart\\.com\\/gw-v2\\/cloud-storage\\/v1\\/me\\/storages,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/PicsArtStorages.js,requires-body=1,max-size=0
Wink = type=http-response,pattern=^https:\\/\\/api-sub\\.meitu\\.com\\/v2\\/user\\/vip_info_by_group\\.json,requires-body=1,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/WinkVipCrack.js
Truecaller = type=http-response,pattern=^https:\\/\\/premium-[^.]+\.truecaller\.com\\/v\\d+\\/(subscriptions\\/status|products\\/apple)(\\?.*)?$,requires-body=1,max-size=0,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/TrueCaller.js
Lightroom = type=http-response,pattern=^https:\\/\\/photos\\.adobe\\.io\\/v\\d\\/accounts,requires-body=1,max-size=0,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/lightroom.js,script-update-interval=-1
Kinemaster = type=http-response,pattern=^https:\\/\\/api-account\\.kinemasters\\.com\\/v\\d\\/user\\/subscribe$,requires-body=1,max-size=0,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/Kinemaster.js
Camscanner = requires-body=1,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/camScanner.js,type=http-response,pattern=https:\\/\\/(api|api-cs.*)\\.intsig\\.net\\/purchase\\/cs\\/query_property\\?
BeautyPlus = type=http-response, pattern=https:\\/\\/(api\\.mr\\.pixocial\\.com\\/v1\\/manual_unlock|newbeee-api\\.beautyplus\\.com\\/api\\/v1\\/asset\\/balance), script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/BeautyPlus.js, requires-body=true, max-size=-1, timeout=60
iTunes = type=http-response, pattern=^https?:\\/\\/buy\\.itunes\\.apple\\.com\\/verifyReceipt$, script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/iTunes.js, requires-body=true, max-size=-1, timeout=60
Snow = type=http-response, pattern=^https?:\\/\\/user-snow-api\\.snow\\.me\\/v\\d\\/purchase\\/subscription\\/subscriber\\/status, script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/Snow.js, requires-body=true, max-size=-1, timeout=60
Meitu = type=http-response,pattern=^https?:\\/\\/(h5|api)\\.xiuxiu\\.meitu\\.com\\/v\\d\\/(h\\d\\/vip|vip|user)\\/,requires-body=1,script-path=https://cdn.jsdelivr.net/gh/dinhduyvinh09/AppPre@refs/heads/main/js/MeiTuXiuXiu.js

[MITM]
ca-passphrase = ${caPassphrase}
ca-p12 = ${caP12}
enable = true
skip-server-cert-verify = true
hostname = %APPEND%, *.googlevideo.com, youtubei.googleapis.com, www.youtube.com, s.youtube.com, -redirector*.googlevideo.com, premium*.truecaller.com, sub.store, api.revenuecat.com, *.revenuecat.com, rc-backup.revenuecat.com, api.rc-backup.com, firebaseremoteconfig.googleapis.com, *.firebaseremoteconfig.googleapis.com, firebaseremoteconfigrealtime.googleapis.com, *.firebaseremoteconfigrealtime.googleapis.com, us-central1-locket-4252a.cloudfunctions.net, 192.168.50.72, buy.itunes.apple.com, spclient.wg.spotify.com, *spclient.spotify.com, api-mobile.soundcloud.com, api.picsart.com, us-central1-alight-creative.cloudfunctions.net, api-sub.meitu.com, photos.adobe.io, ap*.intsig.net, api-account.kinemasters.com, api.mr.pixocial.com, newbeee-api.beautyplus.com, user-snow-api.snow.me, h5.xiuxiu.meitu.com, api.xiuxiu.meitu.com
`;

fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_Private.conf'), tommmConf, 'utf8');
console.log("Created Locket_Tommm_Private.conf, size:", fs.statSync(path.join(baseDir, 'Locket_Tommm_Private.conf')).size);

// 2. Create Locket_Tommm_DNS.mobileconfig (Clean iOS DNS Profile to block RevenueCat revocation & Telemetry when VPN is off, using official Null/Block sinkhole ONLY for telemetry/revocation domains so normal browsing & banking apps never touch any third-party DNS!)
const tommmMobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key>
                <string>HTTPS</string>
                <key>ServerAddresses</key>
                <array>
                    <string>0.0.0.0</string>
                </array>
                <key>ServerURL</key>
                <string>https://0.0.0.0/dns-query</string>
                <key>SupplementalMatchDomains</key>
                <array>
                    <string>api.revenuecat.com</string>
                    <string>rc-backup.revenuecat.com</string>
                    <string>api.rc-backup.com</string>
                    <string>api2.amplitude.com</string>
                    <string>appsflyersdk.com</string>
                    <string>ingest.sentry.io</string>
                </array>
            </dict>
            <key>OnDemandRules</key>
            <array>
                <dict>
                    <key>Action</key>
                    <string>Connect</string>
                </dict>
            </array>
            <key>PayloadDescription</key>
            <string>Chặn thu hồi Locket Gold khi tắt Shadowrocket - 100% Private (Không qua DNS trung gian)</string>
            <key>PayloadDisplayName</key>
            <string>Tommm Locket Gold Shield</string>
            <key>PayloadIdentifier</key>
            <string>com.tommm.locketgold.dns</string>
            <key>PayloadOrganization</key>
            <string>Tommm Private Studio</string>
            <key>PayloadType</key>
            <string>com.apple.dnsSettings.managed</string>
            <key>PayloadUUID</key>
            <string>88A1B2C3-D4E5-4F60-9A11-TOMMM8888881</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Hồ sơ giữ Locket Gold vĩnh viễn của riêng Tommm (Chặn thu hồi cục bộ, không gửi DNS cho bất kỳ ai, không lag app ngân hàng).</string>
    <key>PayloadDisplayName</key>
    <string>Locket Gold • Tommm Shield 🛡️</string>
    <key>PayloadIdentifier</key>
    <string>com.tommm.locketgold.profile</string>
    <key>PayloadOrganization</key>
    <string>Tommm</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>88A1B2C3-D4E5-4F60-9A11-TOMMM8888882</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
`;

fs.writeFileSync(path.join(baseDir, 'Locket_Tommm_DNS.mobileconfig'), tommmMobileConfig, 'utf8');
console.log("Created Locket_Tommm_DNS.mobileconfig");

// 3. Create 1-click startup file Start_Tommm_Server.bat
const batContent = `@echo off
title Locket Gold Private Studio - Tommm
echo ============================================================
echo   LOCKET GOLD PRIVATE STUDIO - OWNER: TOMMM
echo   Project Folder: D:\\Locket_Gold_Tommm
echo ============================================================
cd /d D:\\Locket_Gold_Tommm
python tommm_server.py
pause
`;
fs.writeFileSync(path.join(baseDir, 'Start_Tommm_Server.bat'), batContent, 'utf8');
