import os
import io
import json
import time
import uuid
import base64
import itertools
import urllib.request
import ssl
from http.server import HTTPServer, BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageOps

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Hỗ trợ 1 key (GEMINI_API_KEY) hoặc xoay vòng nhiều key (GEMINI_API_KEYS=key1,key2,key3)
RAW_KEYS = os.environ.get("GEMINI_API_KEYS") or os.environ.get("GEMINI_API_KEY") or ""
API_KEYS = [k.strip() for k in RAW_KEYS.split(",") if k.strip() and "PASTE_YOUR" not in k]
KEY_CYCLE = itertools.cycle(API_KEYS) if API_KEYS else None
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-image")

PHOTOBOOTH_SESSIONS = {}
FILTER_MAP = {}

cfg_path = os.path.join(DATA_DIR, "merged_camera_filter_config.json")
if os.path.exists(cfg_path):
    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
        for rf in cfg.get("remote_filters", []):
            fid = rf.get("id") or rf.get("uid")
            if fid:
                FILTER_MAP[fid] = rf

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def fetch_image_from_payload(data_node):
    for k in ("image", "imageBase64", "image_base64", "base64", "photo", "data"):
        val = data_node.get(k)
        if isinstance(val, str) and len(val) > 200 and not val.startswith("http"):
            try:
                if "," in val:
                    val = val.split(",", 1)[1]
                return Image.open(io.BytesIO(base64.b64decode(val))).convert("RGBA")
            except Exception:
                pass
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


def run_gemini_ai_filter(user_img, prompt_text):
    """Chạy biến đổi ảnh AI bằng Google Gemini API (xoay vòng API Key an toàn)."""
    if not HAS_GENAI or not KEY_CYCLE:
        return None
    for _ in range(len(API_KEYS)):
        api_key = next(KEY_CYCLE)
        try:
            client = genai.Client(api_key=api_key)
            buf = io.BytesIO()
            user_img.convert("RGB").save(buf, format="JPEG", quality=90)
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"),
                    prompt_text
                ],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"]
                )
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    return Image.open(io.BytesIO(part.inline_data.data)).convert("RGB")
        except Exception as e:
            print(f"[Gemini AI Error]: {e}")
            continue
    return None


def apply_filter(user_img, filter_id, user_key="default"):
    W, H = 1024, 1024
    if user_img is None:
        user_img = Image.new("RGBA", (W, H), (30, 41, 59, 255))
    else:
        user_img = ImageOps.fit(user_img, (W, H), Image.Resampling.LANCZOS)

    rf = FILTER_MAP.get(filter_id, {})
    prompt = rf.get("prompt", "")

    # 1. Nếu là AI Filter có prompt mô tả chi tiết -> chạy Gemini AI!
    is_ai_filter = filter_id.startswith("stk_") or (len(prompt) > 40 and not filter_id.startswith("pb_") and not filter_id.startswith("khung_") and not filter_id.startswith("frame_"))
    if is_ai_filter and prompt:
        ai_out = run_gemini_ai_filter(user_img, prompt)
        if ai_out is not None:
            return ai_out

    # 2. Nếu là Photobooth 4-Cut (miễn phí 100%, không tốn API Key!)
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
        sess_key = f"{user_key}:{filter_id}"
        sess = PHOTOBOOTH_SESSIONS.get(sess_key, {"photos": [], "ts": 0})
        if time.time() - sess["ts"] > 180 or len(sess["photos"]) >= 4:
            sess = {"photos": [], "ts": time.time()}
        sess["photos"].append(user_img)
        sess["ts"] = time.time()
        PHOTOBOOTH_SESSIONS[sess_key] = sess

        canvas = Image.new("RGBA", (W, H), (20, 24, 33, 255))
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
                draw = ImageDraw.Draw(canvas)
                draw.rounded_rectangle([x1, y1, x2, y2], radius=28, fill=(30, 35, 48, 255))
                draw.text(((x1 + x2) // 2, (y1 + y2) // 2), f"{idx + 1}/4", fill=(148, 163, 184, 255), anchor="mm")

        if overlay_path:
            try:
                ov = Image.open(overlay_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
                canvas = Image.alpha_composite(canvas, ov)
            except Exception:
                pass
        return canvas.convert("RGB")

    # 3. Khung viền 1 ô (miễn phí 100%, không tốn API Key!)
    canvas = user_img.copy()
    if overlay_path:
        try:
            ov = Image.open(overlay_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
            canvas = Image.alpha_composite(canvas, ov)
        except Exception:
            pass
    return canvas.convert("RGB")


def cleanup_old_outputs():
    """Tự động dọn ảnh tạm quá 15 phút để bảo vệ quyền riêng tư tuyệt đối & không đầy ổ cứng."""
    now = time.time()
    try:
        for fn in os.listdir(OUTPUT_DIR):
            p = os.path.join(OUTPUT_DIR, fn)
            if os.path.isfile(p) and now - os.path.getmtime(p) > 900:
                os.remove(p)
    except Exception:
        pass


class TommmAIServerHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[Tommm-AI] {self.address_string()} - {fmt % args}")

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/health", "/status"):
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "online",
                "owner": "Tommm",
                "ai_keys_configured": len(API_KEYS),
                "filters_loaded": len(FILTER_MAP)
            }).encode("utf-8"))
            return

        if path.startswith("/ai-filters/"):
            fname = os.path.basename(path[len("/ai-filters/"):])
            fpath = os.path.join(OUTPUT_DIR, fname)
            if os.path.isfile(fpath):
                with open(fpath, "rb") as f:
                    data = f.read()
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return

        self.send_response(404)
        self._cors()
        self.end_headers()

    def do_POST(self):
        cleanup_old_outputs()
        path = self.path.split("?", 1)[0]
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body_obj = json.loads(raw_body.decode("utf-8", errors="ignore") or "{}")
        except Exception:
            body_obj = {}

        data_node = body_obj.get("data") if isinstance(body_obj.get("data"), dict) else body_obj

        if "generateFilteredImage" in path or "applyFilter" in path or "createOverlay" in path:
            filter_id = (
                data_node.get("filterId")
                or data_node.get("filter_id")
                or data_node.get("uid")
                or data_node.get("id")
                or "pb_cortis_4cut"
            )
            user_key = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
            user_img = fetch_image_from_payload(data_node)
            out_img = apply_filter(user_img, filter_id, user_key=user_key)
            out_name = f"tommm_{uuid.uuid4().hex[:10]}_{filter_id}.jpg"
            out_img.save(os.path.join(OUTPUT_DIR, out_name), "JPEG", quality=92)

            host = self.headers.get("X-Forwarded-Host") or self.headers.get("Host") or "localhost:8899"
            proto = self.headers.get("X-Forwarded-Proto") or ("https" if "onrender.com" in host else "http")
            out_url = f"{proto}://{host}/ai-filters/{out_name}"

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
                    "data": {"outputUrl": out_url, "url": out_url, "imageUrl": out_url}
                },
                "outputUrl": out_url,
                "url": out_url,
                "imageUrl": out_url,
                "status": 200
            }
            payload = json.dumps(res).encode("utf-8")
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(b'{"result":{"status":200,"success":true},"status":200}')


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8899"))
    print(f"Tommm AI & Photobooth Server running on port {port} (AI keys loaded: {len(API_KEYS)}, Filters: {len(FILTER_MAP)})")
    HTTPServer(("0.0.0.0", port), TommmAIServerHandler).serve_forever()
