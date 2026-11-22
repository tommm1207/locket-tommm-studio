import os
import io
import json
import time
import uuid
import base64
import hashlib
import urllib.request
import ssl
from http.server import HTTPServer, BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont, ImageOps

BASE_DIR = r"D:\Locket_Gold_Tommm"
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Memory store for 4-cut Photobooth sessions per user/filter
PHOTOBOOTH_SESSIONS = {}

# Load filter definitions
FILTER_CFG_PATH = os.path.join(DATA_DIR, "merged_camera_filter_config.json")
FILTER_MAP = {}
if os.path.exists(FILTER_CFG_PATH):
    with open(FILTER_CFG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
        for rf in cfg.get("remote_filters", []):
            fid = rf.get("id") or rf.get("uid")
            if fid:
                FILTER_MAP[fid] = rf

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

def fetch_image_from_payload(data_node):
    """Extract input photo from Locket generateFilteredImage request payload."""
    # Check base64 fields first
    for k in ("image", "imageBase64", "image_base64", "base64", "photo", "data"):
        val = data_node.get(k)
        if isinstance(val, str) and len(val) > 200 and not val.startswith("http"):
            try:
                if "," in val:
                    val = val.split(",", 1)[1]
                raw = base64.b64decode(val)
                return Image.open(io.BytesIO(raw)).convert("RGBA")
            except Exception:
                pass
    # Check URL fields
    for k in ("imageUrl", "image_url", "url", "photoUrl", "photo_url", "inputUrl", "input_url"):
        val = data_node.get(k)
        if isinstance(val, str) and val.startswith("http"):
            try:
                req = urllib.request.Request(val, headers={"User-Agent": "Locket/1.0"})
                with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as r:
                    return Image.open(io.BytesIO(r.read())).convert("RGBA")
            except Exception:
                pass
    return None

def apply_frame_or_photobooth(user_img, filter_id):
    """Apply 4-cut Photobooth or 1-cut Frame / Sticker locally on Tommm's PC!"""
    W, H = 1024, 1024
    if user_img is None:
        user_img = Image.new("RGBA", (W, H), (30, 41, 59, 255))
    else:
        user_img = ImageOps.fit(user_img, (W, H), Image.Resampling.LANCZOS)

    # Locate local PNG frame/sticker
    frame_path = os.path.join(ASSETS_DIR, "frames", f"{filter_id}.png")
    ai_path = os.path.join(ASSETS_DIR, "ai", f"{filter_id}.png")
    overlay_path = frame_path if os.path.exists(frame_path) else (ai_path if os.path.exists(ai_path) else None)

    is_4cut = ("4cut" in filter_id or "2x2" in filter_id or filter_id in (
        "pb_cortis_v1", "pb_cortis_v2", "pb_ech_xanh", "pb_galaxy",
        "pb_photobooth_hello_kitty", "pb_strawberry", "pb_trung_bac_thao",
        "pb_vien_hello_kitty", "pb_vintage", "photobooth_cute",
        "frame_berry_days", "frame_happy_snap", "frame_sky_diary", "frame_classic_pb"
    )) and ("single" not in filter_id)

    if is_4cut:
        sess = PHOTOBOOTH_SESSIONS.get(filter_id, {"photos": [], "ts": 0})
        if time.time() - sess["ts"] > 180 or len(sess["photos"]) >= 4:
            sess = {"photos": [], "ts": time.time()}
        sess["photos"].append(user_img)
        sess["ts"] = time.time()
        PHOTOBOOTH_SESSIONS[filter_id] = sess

        canvas = Image.new("RGBA", (W, H), (20, 24, 33, 255))
        # 2x2 grid slots
        slots = [
            (48, 48, 492, 492),
            (532, 48, 976, 492),
            (48, 532, 492, 976),
            (532, 532, 976, 976),
        ]
        for idx, (x1, y1, x2, y2) in enumerate(slots):
            sw, sh = x2 - x1, y2 - y1
            if idx < len(sess["photos"]):
                tile = ImageOps.fit(sess["photos"][idx], (sw, sh), Image.Resampling.LANCZOS)
                canvas.paste(tile, (x1, y1))
            else:
                # Draw waiting slot
                draw = ImageDraw.Draw(canvas)
                draw.rounded_rectangle([x1, y1, x2, y2], radius=28, fill=(30, 35, 48, 255))
                draw.text(((x1 + x2) // 2, (y1 + y2) // 2), f"Ảnh {idx + 1}/4\nChụp tiếp...", fill=(148, 163, 184, 255), anchor="mm", align="center")

        if overlay_path:
            try:
                ov = Image.open(overlay_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
                canvas = Image.alpha_composite(canvas, ov)
            except Exception:
                pass
        return canvas.convert("RGB")

    # 1-Cut Frame or Sticker Overlay
    canvas = user_img.copy()
    if overlay_path:
        try:
            ov = Image.open(overlay_path).convert("RGBA")
            # If it's a frame, full-screen composite; if it's an AI sticker icon without Gemini key, overlay cleanly or use frame
            ov = ov.resize((W, H), Image.Resampling.LANCZOS)
            canvas = Image.alpha_composite(canvas, ov)
        except Exception:
            pass
    return canvas.convert("RGB")

class TommmLocketHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[Tommm-Server] {self.address_string()} - {fmt % args}")

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/" or path == "/status":
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "online",
                "owner": "Tommm",
                "server": "Locket Gold Private Studio (100% Self-Hosted on D:\\Locket_Gold_Tommm)",
                "filters_loaded": len(FILTER_MAP)
            }, ensure_ascii=False).encode("utf-8"))
            return

        # Serve local files: /Locket_Tommm_Private.js, /Locket_Tommm_Private.conf, /assets/..., /ai-filters/...
        local_file = None
        if path == "/Locket_Tommm_Private.js":
            local_file = os.path.join(BASE_DIR, "Locket_Tommm_Private.js")
        elif path == "/Locket_Tommm_Private.conf":
            local_file = os.path.join(BASE_DIR, "Locket_Tommm_Private.conf")
        elif path == "/Locket_Tommm_DNS.mobileconfig":
            local_file = os.path.join(BASE_DIR, "Locket_Tommm_DNS.mobileconfig")
        elif path.startswith("/assets/"):
            rel = path[len("/assets/"):].replace("/", os.sep)
            local_file = os.path.join(ASSETS_DIR, rel)
        elif path.startswith("/ai-filters/"):
            rel = path[len("/ai-filters/"):].replace("/", os.sep)
            local_file = os.path.join(OUTPUT_DIR, rel)

        if local_file and os.path.isfile(local_file):
            self.send_response(200)
            self._send_cors()
            if local_file.endswith(".js"):
                ct = "application/javascript; charset=utf-8"
            elif local_file.endswith(".conf"):
                ct = "text/plain; charset=utf-8"
            elif local_file.endswith(".mobileconfig"):
                ct = "application/x-apple-aspen-config"
            elif local_file.endswith(".png"):
                ct = "image/png"
            else:
                ct = "image/jpeg"
            self.send_header("Content-Type", ct)
            with open(local_file, "rb") as f:
                data = f.read()
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        self.send_response(404)
        self._send_cors()
        self.end_headers()

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body_obj = json.loads(raw_body.decode("utf-8", errors="ignore") or "{}")
        except Exception:
            body_obj = {}

        data_node = body_obj.get("data") if isinstance(body_obj.get("data"), dict) else body_obj

        if "getFilters" in path or "createFilter" in path:
            filter_ids = list(FILTER_MAP.keys())
            res = {
                "result": {"data": {"filters": filter_ids}, "status": 200},
                "data": {"filters": filter_ids},
                "status": 200
            }
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        if "generateFilteredImage" in path or "applyFilter" in path or "createOverlay" in path:
            filter_id = (
                data_node.get("filterId")
                or data_node.get("filter_id")
                or data_node.get("uid")
                or data_node.get("id")
                or "pb_cortis_4cut"
            )
            user_img = fetch_image_from_payload(data_node)
            out_img = apply_frame_or_photobooth(user_img, filter_id)
            out_name = f"tommm_{uuid.uuid4().hex[:10]}_{filter_id}.jpg"
            out_path = os.path.join(OUTPUT_DIR, out_name)
            out_img.save(out_path, "JPEG", quality=95)

            host_hdr = self.headers.get("Host") or "192.168.50.72:8899"
            scheme = "http"
            out_url = f"{scheme}://{host_hdr}/ai-filters/{out_name}"

            res = {
                "result": {
                    "outputUrl": out_url,
                    "output_url": out_url,
                    "url": out_url,
                    "imageUrl": out_url,
                    "image_url": out_url,
                    "status": 200,
                    "is_gold": True,
                    "is_locked": False,
                    "requires_gold": False,
                    "unlocked": True,
                    "out_of_credits": False,
                    "ai_credits": 999999,
                    "remaining_credits": 999999,
                    "data": {
                        "outputUrl": out_url,
                        "output_url": out_url,
                        "url": out_url,
                        "imageUrl": out_url,
                        "image_url": out_url
                    }
                },
                "outputUrl": out_url,
                "url": out_url,
                "imageUrl": out_url,
                "status": 200
            }
            out_bytes = json.dumps(res).encode("utf-8")
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(out_bytes)))
            self.end_headers()
            self.wfile.write(out_bytes)
            return

        # Default fallback
        self.send_response(200)
        self._send_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(b'{"result":{"status":200,"success":true},"status":200}')

if __name__ == "__main__":
    port = 8899
    print(f"============================================================")
    print(f"  LOCKET GOLD PRIVATE STUDIO - OWNER: TOMMM")
    print(f"  Listening on http://0.0.0.0:{port} (LAN: http://192.168.50.72:{port})")
    print(f"============================================================")
    server = HTTPServer(("0.0.0.0", port), TommmLocketHandler)
    server.serve_forever()
