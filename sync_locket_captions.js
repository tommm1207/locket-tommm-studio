const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ID = 'locket-4252a';
const API_KEY = (process.env.LOCKET_FIREBASE_API_KEY || '').trim();
const APP_ID = (process.env.LOCKET_FIREBASE_APP_ID || '').trim();

if (!API_KEY || !APP_ID) {
    console.error('Missing LOCKET_FIREBASE_API_KEY or LOCKET_FIREBASE_APP_ID environment variables.');
    process.exit(1);
}

async function main() {
    // 1. Create an anonymous Firebase Installation to obtain auth token
    const instRes = await fetch(
        `https://firebaseinstallations.googleapis.com/v1/projects/${PROJECT_ID}/installations?key=${encodeURIComponent(API_KEY)}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Ios-Bundle-Identifier': 'com.locket.Locket'
            },
            body: JSON.stringify({
                appId: APP_ID,
                authVersion: 'FIS_v2',
                sdkVersion: 'a:18.0.0'
            })
        }
    );
    if (!instRes.ok) {
        throw new Error(`Firebase Installations failed (${instRes.status}): ${await instRes.text()}`);
    }
    const instData = await instRes.json();
    const fid = instData.fid;
    const authToken = instData.authToken && instData.authToken.token;
    if (!fid || !authToken) {
        throw new Error('Firebase Installations response missing fid or authToken');
    }

    // 2. Fetch live Firebase Remote Config
    const rcRes = await fetch(
        `https://firebaseremoteconfig.googleapis.com/v1/projects/${PROJECT_ID}/namespaces/firebase:fetch?key=${encodeURIComponent(API_KEY)}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-firebase-installations-auth': authToken,
                'X-Ios-Bundle-Identifier': 'com.locket.Locket'
            },
            body: JSON.stringify({
                appId: APP_ID,
                appInstanceId: fid,
                appInstanceIdToken: authToken,
                countryCode: 'VN',
                languageCode: 'vi-VN',
                platformVersion: '18.0',
                timeZone: 'Asia/Ho_Chi_Minh'
            })
        }
    );
    if (!rcRes.ok) {
        throw new Error(`Firebase Remote Config fetch failed (${rcRes.status}): ${await rcRes.text()}`);
    }
    const rcData = await rcRes.json();
    const entries = rcData.entries || {};
    if (!entries.overlay_items) {
        console.log('No overlay_items returned from Firebase Remote Config.');
        return;
    }

    const liveSections = JSON.parse(entries.overlay_items);
    const dataDir = path.join(__dirname, 'data');
    const archivePath = path.join(dataDir, 'archived_official_captions.json');

    let archived = [];
    if (fs.existsSync(archivePath)) {
        try {
            archived = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
            if (!Array.isArray(archived)) archived = [];
        } catch (_) {
            archived = [];
        }
    }

    // Collect already-known overlay_ids (existing archive + bundled static captions)
    const knownIds = new Set(archived.map(i => i && i.overlay_id).filter(Boolean));
    for (const srcFile of ['duyvinh_rc_output.json', 'vps_firebase.json']) {
        const p = path.join(dataDir, srcFile);
        if (!fs.existsSync(p)) continue;
        try {
            const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
            const ov = JSON.parse((raw.entries || raw).overlay_items || '[]');
            for (const sec of ov) {
                for (const item of (sec.items || [])) {
                    if (item && item.overlay_id) knownIds.add(item.overlay_id);
                }
            }
        } catch (_) {}
    }

    let addedCount = 0;
    for (const sec of liveSections) {
        for (const item of (sec.items || [])) {
            if (!item || !item.overlay_id) continue;
            if (!knownIds.has(item.overlay_id)) {
                knownIds.add(item.overlay_id);
                archived.push(item);
                addedCount++;
                console.log(' + Archived new Locket caption:', item.overlay_id, item.caption && item.caption.text ? `(${item.caption.text})` : '');
            }
        }
    }

    if (addedCount > 0) {
        fs.writeFileSync(archivePath, JSON.stringify(archived, null, 2) + '\n', 'utf8');
        console.log(`Saved ${addedCount} new caption(s). Rebuilding Cloud Edition...`);
        execSync('node build_cloud_edition.js', { cwd: __dirname, stdio: 'inherit' });
    } else {
        console.log('All live Locket captions are already archived. No changes needed.');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
