import json
import os
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor

dst = r"D:\Locket_Gold_Tommm"
cfg_path = os.path.join(dst, "data", "merged_camera_filter_config.json")
with open(cfg_path, "r", encoding="utf-8") as f:
    cfg = json.load(f)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

to_download = []
for rf in cfg.get("remote_filters", []):
    fid = rf.get("id") or rf.get("uid")
    url = rf.get("imageUrl") or rf.get("overlayImageUrl") or ""
    if not fid or not url:
        continue
    if fid == "frame_ba_khi" or fid in ("sticker_binh_luan_minh_tue", "cmt_locket"):
        continue
    sub = "ai" if ("/ai/" in url or fid.startswith("stk_") or rf.get("category") is None) else "frames"
    out_file = os.path.join(dst, "assets", sub, f"{fid}.png")
    to_download.append((fid, url, out_file, sub))

def dl_one(item):
    fid, url, out_file, sub = item
    if os.path.exists(out_file) and os.path.getsize(out_file) > 100:
        return (fid, True, os.path.getsize(out_file))
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            data = r.read()
            with open(out_file, "wb") as f:
                f.write(data)
            return (fid, True, len(data))
    except Exception as e:
        return (fid, False, str(e))

print(f"Downloading {len(to_download)} assets in parallel...")
with ThreadPoolExecutor(max_workers=12) as ex:
    results = list(ex.map(dl_one, to_download))

ok = [r for r in results if r[1]]
fail = [r for r in results if not r[1]]
print(f"Downloaded OK: {len(ok)}/{len(to_download)}, Failed: {len(fail)}")
for f in fail:
    print("  FAIL:", f)
