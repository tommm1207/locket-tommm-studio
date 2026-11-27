import io
import json
import math
import os
import random
import urllib.parse
import urllib.request
import zlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
BINS_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")
V2_DIR = os.path.join(BASE_DIR, "assets", "filters_v2")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "frames_manifest.json")

SIZE = 512
ICON_SIZE = 128
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_ITALIC = r"C:\Windows\Fonts\segoeuiz.ttf"

# Exact mirror of LUT_FILTERS in cloudflare-worker/worker.js
LUT_SPECS = [
    ("dazz_cpm35", "CPM", dict(rMul=1.08, gMul=1.02, bMul=0.90, contrast=1.12, brightness=4, sat=1.10, fade=14, vig=0.22, grain=10)),
    ("dazz_classic_u", "CLU", dict(rMul=1.06, gMul=1.00, bMul=0.93, contrast=1.16, brightness=2, sat=1.14, fade=10, vig=0.25, grain=8)),
    ("dazz_fqs", "FQS", dict(rMul=0.98, gMul=1.05, bMul=1.02, contrast=1.10, brightness=3, sat=1.08, fade=12, vig=0.18, grain=7)),
    ("dazz_inst_c", "INS", dict(rMul=1.07, gMul=1.03, bMul=0.95, contrast=0.96, brightness=12, sat=0.92, fade=24, vig=0.20, grain=6)),
    ("dazz_grd", "B&W", dict(rMul=1.0, gMul=1.0, bMul=1.0, contrast=1.32, brightness=0, sat=0.0, fade=8, vig=0.28, grain=14, bw=True)),
    ("lut_iphone_beauty", "MỊN", dict(rMul=1.05, gMul=1.02, bMul=1.03, contrast=1.03, brightness=10, sat=1.05, fade=4, vig=0.06, grain=0)),
    ("lut_film_han", "HÀN", dict(rMul=1.05, gMul=1.02, bMul=1.04, contrast=0.95, brightness=12, sat=0.90, fade=18, vig=0.10, grain=4)),
    ("lut_trang_sua", "SỮA", dict(rMul=1.03, gMul=1.03, bMul=1.05, contrast=0.97, brightness=16, sat=0.88, fade=14, vig=0.08, grain=0)),
    ("lut_kodak_am", "ẤM", dict(rMul=1.11, gMul=1.03, bMul=0.87, contrast=1.10, brightness=5, sat=1.15, fade=12, vig=0.20, grain=8)),
    ("lut_fuji_chrome", "FJC", dict(rMul=0.97, gMul=1.03, bMul=1.04, contrast=1.14, brightness=0, sat=0.82, fade=12, vig=0.18, grain=6)),
    ("lut_phim_nhat", "NHẬT", dict(rMul=0.98, gMul=1.05, bMul=1.06, contrast=0.94, brightness=14, sat=0.88, fade=20, vig=0.10, grain=5)),
    ("lut_vintage", "VTG", dict(rMul=1.12, gMul=1.01, bMul=0.84, contrast=1.06, brightness=3, sat=0.78, fade=22, vig=0.26, grain=11)),
    ("lut_kodak_portra", "P400", dict(rMul=1.07, gMul=1.02, bMul=0.94, contrast=0.98, brightness=8, sat=1.04, fade=12, vig=0.12, grain=5)),
    ("lut_fuji_superia", "F200", dict(rMul=0.98, gMul=1.06, bMul=1.04, contrast=1.12, brightness=4, sat=1.12, fade=10, vig=0.16, grain=6)),
    ("lut_kodak_gold", "G200", dict(rMul=1.12, gMul=1.05, bMul=0.86, contrast=1.08, brightness=8, sat=1.14, fade=14, vig=0.18, grain=8)),
    ("lut_cinestill_800t", "800T", dict(rMul=0.96, gMul=1.02, bMul=1.14, contrast=1.16, brightness=2, sat=1.06, fade=12, vig=0.24, grain=9)),
    ("lut_hong_dao", "ĐÀO", dict(rMul=1.09, gMul=1.01, bMul=1.03, contrast=0.96, brightness=14, sat=1.06, fade=12, vig=0.08, grain=0)),
    ("lut_matcha", "MTC", dict(rMul=0.97, gMul=1.06, bMul=0.97, contrast=0.94, brightness=12, sat=0.92, fade=16, vig=0.10, grain=3)),
    ("lut_ulzzang_pink", "PNK", dict(rMul=1.08, gMul=1.00, bMul=1.05, contrast=0.97, brightness=16, sat=0.96, fade=14, vig=0.06, grain=0)),
    ("lut_nang_ban_mai", "NẮNG", dict(rMul=1.10, gMul=1.04, bMul=0.90, contrast=1.04, brightness=12, sat=1.10, fade=10, vig=0.10, grain=2)),
    ("lut_tone_lanh", "LẠNH", dict(rMul=0.94, gMul=1.01, bMul=1.10, contrast=1.05, brightness=6, sat=0.92, fade=10, vig=0.12, grain=2)),
    ("lut_kem_bo", "KEM", dict(rMul=1.06, gMul=1.05, bMul=0.93, contrast=0.93, brightness=15, sat=0.90, fade=20, vig=0.08, grain=3)),
    ("nm_nau_co_dien", "NÂU", dict(rMul=1.12, gMul=1.02, bMul=0.82, contrast=1.08, brightness=2, sat=0.72, fade=22, vig=0.28, grain=10)),
    ("nm_dem_xanh", "ĐÊM", dict(rMul=0.86, gMul=1.00, bMul=1.18, contrast=1.15, brightness=-4, sat=0.92, fade=14, vig=0.30, grain=8)),
    ("nm_film_35mm", "35MM", dict(rMul=1.08, gMul=1.03, bMul=0.92, contrast=1.10, brightness=4, sat=1.06, fade=18, vig=0.22, grain=12)),
    ("nm_xam_matte", "XÁM", dict(rMul=0.96, gMul=0.97, bMul=0.99, contrast=0.92, brightness=6, sat=0.42, fade=28, vig=0.16, grain=7)),
]


def get_font(path, size):
    return ImageFont.truetype(path, size)


def fit_font(draw, font_path, text, max_w, max_size, min_size=10):
    for sz in range(max_size, min_size - 1, -1):
        f = get_font(font_path, sz)
        bb = draw.textbbox((0, 0), text, font=f)
        if (bb[2] - bb[0]) <= max_w:
            return f
    return get_font(font_path, min_size)


def draw_centered_text(draw, cx, cy, text, font, fill):
    bb = draw.textbbox((0, 0), text, font=font)
    w = bb[2] - bb[0]
    h = bb[3] - bb[1]
    draw.text((cx - w / 2 - bb[0], cy - h / 2 - bb[1]), text, font=font, fill=fill)


def apply_rounded_square_mask(im, box, radius):
    w, h = im.size
    scale = 4
    big = Image.new("L", (w * scale, h * scale), 0)
    bd = ImageDraw.Draw(big)
    x1, y1, x2, y2 = [v * scale for v in box]
    bd.rounded_rectangle([x1, y1, x2, y2], radius=radius * scale, fill=255)
    mask = big.resize((w, h), Image.Resampling.LANCZOS)
    out = im.copy()
    out.putalpha(mask)
    return out


LOCAL_MODEL_PATH = os.path.join(BASE_DIR, "assets", "preview_model.png")


def fetch_sample_portrait():
    if os.path.exists(LOCAL_MODEL_PATH):
        im = Image.open(LOCAL_MODEL_PATH).convert("RGB")
        return im, f"local:{os.path.basename(LOCAL_MODEL_PATH)}"
    queries = [
        "young woman portrait smiling natural light",
        "woman portrait sunlight outdoor",
        "South Korean actress portrait smiling",
        "wiki:Mona_Lisa",
    ]
    for q in queries:
        if q.startswith("wiki:"):
            title = urllib.parse.quote(q[5:])
            api = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
            try:
                req = urllib.request.Request(api, headers={"User-Agent": "LocketTommmStudio/1.0"})
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                u = (data.get("thumbnail") or {}).get("source") or (data.get("originalimage") or {}).get("source")
                if u:
                    ireq = urllib.request.Request(u, headers={"User-Agent": "LocketTommmStudio/1.0"})
                    with urllib.request.urlopen(ireq, timeout=20) as ir:
                        im = Image.open(io.BytesIO(ir.read())).convert("RGB")
                        return im, q
            except Exception:
                continue
        else:
            api = (
                "https://commons.wikimedia.org/w/api.php?"
                + urllib.parse.urlencode(
                    {
                        "action": "query",
                        "generator": "search",
                        "gsrnamespace": "6",
                        "gsrlimit": "8",
                        "prop": "imageinfo",
                        "iiprop": "url|mime|size",
                        "iiurlwidth": "512",
                        "format": "json",
                        "gsrsearch": q,
                    }
                )
            )
            try:
                req = urllib.request.Request(api, headers={"User-Agent": "LocketTommmStudio/1.0"})
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                pages = sorted((data.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 999))
                for p in pages:
                    infos = p.get("imageinfo") or []
                    if not infos:
                        continue
                    ii = infos[0]
                    if (ii.get("mime") or "").lower() not in ("image/jpeg", "image/png", "image/webp"):
                        continue
                    u = ii.get("thumburl") or ii.get("url")
                    if not u:
                        continue
                    ireq = urllib.request.Request(u, headers={"User-Agent": "LocketTommmStudio/1.0"})
                    with urllib.request.urlopen(ireq, timeout=20) as ir:
                        im = Image.open(io.BytesIO(ir.read())).convert("RGB")
                        if im.width >= 260 and im.height >= 260:
                            return im, q
            except Exception:
                continue
    raise RuntimeError("Failed to fetch sample portrait")


def crop_portrait(im, out_size):
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, min(h - side, int((h - side) * 0.15)))
    return im.crop((left, top, left + side, top + side)).resize((out_size, out_size), Image.Resampling.LANCZOS)


def apply_lut(rgb_im, cfg):
    w, h = rgb_im.size
    src = rgb_im.tobytes()
    out = bytearray(len(src))
    rMul = cfg.get("rMul", 1.0)
    gMul = cfg.get("gMul", 1.0)
    bMul = cfg.get("bMul", 1.0)
    contrast = cfg.get("contrast", 1.0)
    brightness = cfg.get("brightness", 0)
    sat = cfg.get("sat", 1.0)
    fade = cfg.get("fade", 0)
    vig = cfg.get("vig", 0)
    grain = cfg.get("grain", 0)
    is_bw = cfg.get("bw", False)
    half_w, half_h = w * 0.5, h * 0.5
    inv_max_r2 = 1.0 / (half_w * half_w + half_h * half_h)
    fade_scale = (255.0 - fade) / 255.0 if fade > 0 else 1.0
    rng = random.Random(42)

    for y in range(h):
        dy = y - half_h
        dy2 = dy * dy
        row_off = y * w * 3
        for x in range(w):
            i = row_off + x * 3
            r = float(src[i])
            g = float(src[i + 1])
            b = float(src[i + 2])
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if is_bw:
                r = g = b = lum
            elif sat != 1.0:
                r = lum + (r - lum) * sat
                g = lum + (g - lum) * sat
                b = lum + (b - lum) * sat
            r = (r * rMul - 128.0) * contrast + 128.0 + brightness
            g = (g * gMul - 128.0) * contrast + 128.0 + brightness
            b = (b * bMul - 128.0) * contrast + 128.0 + brightness
            if fade > 0:
                r = fade + r * fade_scale
                g = fade + g * fade_scale
                b = fade + b * fade_scale
            if vig > 0:
                dx = x - half_w
                vf = 1.0 - vig * (dx * dx + dy2) * inv_max_r2
                r *= vf
                g *= vf
                b *= vf
            if grain > 0:
                n = (rng.random() * 2.0 - 1.0) * grain
                r += n
                g += n
                b += n
            out[i] = 0 if r < 0 else (255 if r > 255 else int(r))
            out[i + 1] = 0 if g < 0 else (255 if g > 255 else int(g))
            out[i + 2] = 0 if b < 0 else (255 if b > 255 else int(b))
    return Image.frombytes("RGB", (w, h), bytes(out))


def build_lut_preview_icons(portrait_128):
    for lut_id, badge, cfg in LUT_SPECS:
        graded = apply_lut(portrait_128, cfg).convert("RGBA")
        d = ImageDraw.Draw(graded)
        # Small subtle badge bottom-right + tiny clean label pill so real graded face clearly visible
        f = fit_font(d, FONT_BOLD, badge, 44, 11, 8)
        d.rounded_rectangle([70, 96, 120, 118], radius=9, fill=(12, 14, 18, 195), outline=(255, 255, 255, 190), width=1)
        draw_centered_text(d, 95, 107, badge, f, (255, 255, 255, 255))
        d.rounded_rectangle([2, 2, 126, 126], radius=24, outline=(255, 255, 255, 210), width=3)
        graded = apply_rounded_square_mask(graded, [2, 2, 126, 126], radius=24)
        graded.save(os.path.join(V2_DIR, f"{lut_id}.png"), "PNG")


# =========================================================================
# Vector Sticker & Weather Helpers (512x512 RGBA Overlays)
# =========================================================================
def draw_heart(draw, cx, cy, sz, fill, outline=None):
    pts = []
    for k in range(36):
        t = 2 * math.pi * k / 36
        hx = 16 * (math.sin(t) ** 3)
        hy = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + hx * sz / 32.0, cy + hy * sz / 32.0))
    draw.polygon(pts, fill=fill, outline=outline)


def draw_4pt_star(draw, cx, cy, r_outer, r_inner, fill):
    pts = []
    for i in range(8):
        ang = i * math.pi / 4.0
        r = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
    draw.polygon(pts, fill=fill)


def draw_5pt_star(draw, cx, cy, r_outer, fill, outline=None):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5.0
        r = r_outer if i % 2 == 0 else r_outer * 0.44
        pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
    draw.polygon(pts, fill=fill, outline=outline)


def draw_snowflake(draw, cx, cy, r, fill, width=2):
    for i in range(3):
        a = i * math.pi / 3.0
        dx, dy = math.cos(a) * r, math.sin(a) * r
        draw.line([cx - dx, cy - dy, cx + dx, cy + dy], fill=fill, width=width)
    for k in range(6):
        a = k * math.pi / 3.0
        bx, by = cx + math.cos(a) * (r * 0.56), cy + math.sin(a) * (r * 0.56)
        for sign in (-0.55, 0.55):
            draw.line([bx, by, bx + math.cos(a + sign) * (r * 0.34), by + math.sin(a + sign) * (r * 0.34)], fill=fill, width=max(1, width - 1))


def draw_cute_fish(draw, cx, cy, scale, body_col, stripe_col, flip=False):
    s = -1 if flip else 1
    ink = (30, 41, 59, 245)
    rx, ry = 32 * scale, 21 * scale
    # Tail fin
    tail = [
        (cx - s * (rx * 0.85), cy),
        (cx - s * (rx * 1.48), cy - ry * 0.72),
        (cx - s * (rx * 1.32), cy),
        (cx - s * (rx * 1.48), cy + ry * 0.72),
    ]
    draw.polygon(tail, fill=stripe_col, outline=ink)
    # Top fin
    draw.polygon([(cx - s * 4 * scale, cy - ry * 0.8), (cx - s * 14 * scale, cy - ry * 1.45), (cx + s * 10 * scale, cy - ry * 0.85)], fill=stripe_col, outline=ink)
    # Body oval
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=body_col, outline=ink, width=max(2, int(2.5 * scale)))
    # Cute stripe
    draw.arc([cx - rx * 0.35, cy - ry * 0.9, cx + rx * 0.15, cy + ry * 0.9], start=250 if not flip else 70, end=110 if not flip else 290, fill=stripe_col, width=max(2, int(4 * scale)))
    # Eye + blush + smile
    ex = cx + s * rx * 0.42
    ey = cy - ry * 0.16
    er = max(2, int(3.5 * scale))
    draw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(15, 23, 42, 255))
    draw.ellipse([ex - er * 0.35, ey - er * 0.5, ex + er * 0.2, ey], fill=(255, 255, 255, 255))
    bx = cx + s * rx * 0.25
    by = cy + ry * 0.22
    draw.ellipse([bx - 4 * scale, by - 2.5 * scale, bx + 4 * scale, by + 2.5 * scale], fill=(251, 113, 133, 180))
    sm_x = cx + s * rx * 0.48
    draw.arc([sm_x - 6 * scale, cy + ry * 0.12, sm_x + 6 * scale, cy + ry * 0.45], start=10, end=165, fill=ink, width=max(1, int(2 * scale)))


def draw_cute_shark(draw, cx, cy, scale):
    ink = (30, 41, 59, 255)
    body = (125, 211, 252, 252)
    belly = (240, 249, 255, 252)
    # Dorsal fin & tail
    draw.polygon([(cx - 10 * scale, cy - 20 * scale), (cx - 26 * scale, cy - 52 * scale), (cx + 10 * scale, cy - 22 * scale)], fill=(56, 189, 248, 252), outline=ink)
    draw.polygon([(cx - 38 * scale, cy + 4 * scale), (cx - 68 * scale, cy - 22 * scale), (cx - 56 * scale, cy + 2 * scale), (cx - 66 * scale, cy + 26 * scale)], fill=(56, 189, 248, 252), outline=ink)
    draw.ellipse([cx - 44 * scale, cy - 26 * scale, cx + 48 * scale, cy + 28 * scale], fill=body, outline=ink, width=3)
    draw.chord([cx - 36 * scale, cy - 4 * scale, cx + 45 * scale, cy + 26 * scale], start=0, end=180, fill=belly)
    # Cute face
    draw.ellipse([cx + 18 * scale, cy - 11 * scale, cx + 26 * scale, cy - 3 * scale], fill=ink)
    draw.ellipse([cx + 20 * scale, cy - 10 * scale, cx + 23 * scale, cy - 7 * scale], fill=(255, 255, 255, 255))
    draw.ellipse([cx + 10 * scale, cy + 1 * scale, cx + 20 * scale, cy + 7 * scale], fill=(251, 113, 133, 180))
    draw.arc([cx + 16 * scale, cy + 3 * scale, cx + 38 * scale, cy + 18 * scale], start=10, end=170, fill=ink, width=2)


def draw_pufferfish(draw, cx, cy, scale):
    ink = (30, 41, 59, 250)
    r = 28 * scale
    for k in range(12):
        a = k * math.pi / 6.0
        px = cx + math.cos(a) * (r + 8 * scale)
        py = cy + math.sin(a) * (r + 8 * scale)
        p1 = (cx + math.cos(a - 0.16) * r, cy + math.sin(a - 0.16) * r)
        p2 = (cx + math.cos(a + 0.16) * r, cy + math.sin(a + 0.16) * r)
        draw.polygon([p1, (px, py), p2], fill=(167, 243, 208, 245), outline=ink)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(134, 239, 172, 252), outline=ink, width=2)
    draw.ellipse([cx - 12 * scale, cy - 6 * scale, cx - 5 * scale, cy + 1 * scale], fill=ink)
    draw.ellipse([cx + 5 * scale, cy - 6 * scale, cx + 12 * scale, cy + 1 * scale], fill=ink)
    draw.ellipse([cx - 15 * scale, cy + 4 * scale, cx - 7 * scale, cy + 9 * scale], fill=(251, 113, 133, 185))
    draw.ellipse([cx + 7 * scale, cy + 4 * scale, cx + 15 * scale, cy + 9 * scale], fill=(251, 113, 133, 185))
    draw.ellipse([cx - 3 * scale, cy + 4 * scale, cx + 3 * scale, cy + 10 * scale], outline=ink, width=2)


def draw_water_drop(draw, cx, cy, r):
    draw.ellipse([cx - r + 2, cy - r + 3, cx + r + 2, cy + r + 4], fill=(15, 35, 65, 95))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(224, 242, 254, 105), outline=(255, 255, 255, 205), width=2)
    draw.arc([cx - r * 0.72, cy - r * 0.72, cx + r * 0.72, cy + r * 0.72], start=25, end=140, fill=(255, 255, 255, 190), width=max(1, int(r * 0.14)))
    sr = max(2, int(r * 0.22))
    draw.ellipse([cx - r * 0.48 - sr, cy - r * 0.48 - sr, cx - r * 0.48 + sr, cy - r * 0.48 + sr], fill=(255, 255, 255, 245))


def draw_soap_bubble(draw, cx, cy, r, tint):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(tint[0], tint[1], tint[2], 32), outline=(tint[0], tint[1], tint[2], 195), width=2)
    draw.arc([cx - r + 2, cy - r + 2, cx + r - 2, cy + r - 2], start=190, end=275, fill=(255, 255, 255, 225), width=max(2, int(r * 0.1)))
    draw.arc([cx - r + 4, cy - r + 4, cx + r - 4, cy + r - 4], start=10, end=65, fill=(244, 114, 182, 165), width=max(1, int(r * 0.08)))


def draw_butterfly(draw, cx, cy, s, c1, c2, rot_deg=0):
    tmp = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    mx, my = 60, 60
    ink = (45, 35, 65, 220)
    # Upper wings
    td.polygon([(mx, my), (mx - 34 * s, my - 28 * s), (mx - 40 * s, my - 4 * s), (mx - 10 * s, my + 4 * s)], fill=c1, outline=ink)
    td.polygon([(mx, my), (mx + 34 * s, my - 28 * s), (mx + 40 * s, my - 4 * s), (mx + 10 * s, my + 4 * s)], fill=c1, outline=ink)
    # Lower wings
    td.polygon([(mx, my + 2 * s), (mx - 26 * s, my + 6 * s), (mx - 22 * s, my + 28 * s), (mx - 3 * s, my + 16 * s)], fill=c2, outline=ink)
    td.polygon([(mx, my + 2 * s), (mx + 26 * s, my + 6 * s), (mx + 22 * s, my + 28 * s), (mx + 3 * s, my + 16 * s)], fill=c2, outline=ink)
    # Body + antennae
    td.rounded_rectangle([mx - 2.5 * s, my - 12 * s, mx + 2.5 * s, my + 18 * s], radius=2, fill=ink)
    td.line([mx - 1, my - 11 * s, mx - 9 * s, my - 24 * s], fill=ink, width=2)
    td.line([mx + 1, my - 11 * s, mx + 9 * s, my - 24 * s], fill=ink, width=2)
    if rot_deg:
        tmp = tmp.rotate(rot_deg, resample=Image.Resampling.BICUBIC)
    return tmp


def draw_sakura_petal_img(w_sz, col_inner, col_outer, rot_deg, blur_r=0):
    s = 2
    n = 96 * s
    tmp = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    cx, cy = n * 0.5, n * 0.5
    pts = []
    steps = 36
    rx, ry = 13 * s, 21 * s
    for k in range(steps):
        t = (k / steps) * 2.0 * math.pi
        # Authentic notched cherry blossom petal silhouette
        notch = 1.0 - 0.24 * math.exp(-((math.sin(t) - 1.0) ** 2) * 18.0) if math.sin(t) > 0.6 else 1.0
        px = math.sin(t) * rx * (0.65 + 0.35 * (1.0 - math.cos(t)))
        py = -math.cos(t) * ry * notch
        pts.append((cx + px, cy + py))
    td.polygon(pts, fill=col_outer)
    # Soft lighter inner gradient lobe (no black outline)
    inner_pts = [(cx + (px - cx) * 0.62, cy + (py - cy) * 0.62 + 3 * s) for (px, py) in pts]
    td.polygon(inner_pts, fill=col_inner)
    tmp = tmp.resize((96, 96), Image.Resampling.LANCZOS)
    if rot_deg:
        tmp = tmp.rotate(rot_deg, resample=Image.Resampling.BICUBIC)
    if blur_r > 0:
        tmp = tmp.filter(ImageFilter.GaussianBlur(radius=blur_r))
    if w_sz != 96:
        tmp = tmp.resize((w_sz, w_sz), Image.Resampling.LANCZOS)
    return tmp


def draw_luminous_butterfly(scale, c_wing, c_glow, rot_deg=0, blur_r=0.8):
    n = 160
    glow = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    body = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    mx, my = n * 0.5, n * 0.5

    def wing_poly(side, upper=True):
        pts = []
        steps = 20
        for i in range(steps + 1):
            t = i / steps
            ang = t * math.pi
            if upper:
                r = (14 + 34 * math.sin(ang) ** 0.75 + 10 * math.sin(ang * 2)) * scale
                a = -0.85 + t * 1.95
            else:
                r = (10 + 24 * math.sin(ang) ** 0.8) * scale
                a = 0.65 + t * 1.85
            dx = math.cos(a) * r * side
            dy = math.sin(a) * r * (0.92 if upper else 1.05) - (8 * scale if upper else -4 * scale)
            pts.append((mx + dx, my + dy))
        return pts

    gd = ImageDraw.Draw(glow)
    bd = ImageDraw.Draw(body)
    for side in (-1, 1):
        uw = wing_poly(side, True)
        lw = wing_poly(side, False)
        gd.polygon(uw, fill=c_glow)
        gd.polygon(lw, fill=c_glow)
        bd.polygon(uw, fill=c_wing)
        bd.polygon(lw, fill=(c_wing[0], c_wing[1], c_wing[2], max(90, c_wing[3] - 35)))
        # Delicate translucent highlight shimmer inside wing (zero black outline)
        hi = [(mx + (px - mx) * 0.58, my + (py - my) * 0.58) for (px, py) in uw]
        bd.polygon(hi, fill=(255, 255, 255, 95))

    glow = glow.filter(ImageFilter.GaussianBlur(radius=7))
    # Subtle soft body
    bd.ellipse([mx - 2.2 * scale, my - 13 * scale, mx + 2.2 * scale, my + 16 * scale], fill=(255, 255, 255, 195))
    out = Image.alpha_composite(glow, body)
    if blur_r > 0:
        out = out.filter(ImageFilter.GaussianBlur(radius=blur_r))
    if rot_deg:
        out = out.rotate(rot_deg, resample=Image.Resampling.BICUBIC)
    return out


def draw_koi_silhouette(scale, c_main, c_fin, rot_deg=0):
    n = 160
    tmp = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    mx, my = n * 0.5, n * 0.5
    # Flowing koi body curve (zero black outlines)
    pts = []
    segs = 28
    for i in range(segs + 1):
        t = i / segs
        x = (t - 0.45) * 76 * scale
        half_w = math.sin(t * math.pi) ** 0.72 * 13.5 * scale * (1.15 - 0.35 * t)
        bend = math.sin(t * 3.4) * 5.5 * scale
        pts.append((mx + x, my + bend - half_w))
    for i in range(segs, -1, -1):
        t = i / segs
        x = (t - 0.45) * 76 * scale
        half_w = math.sin(t * math.pi) ** 0.72 * 13.5 * scale * (1.15 - 0.35 * t)
        bend = math.sin(t * 3.4) * 5.5 * scale
        pts.append((mx + x, my + bend + half_w))
    # Flowing translucent tail fin
    tx = mx - 0.45 * 76 * scale
    td.polygon([(tx + 4 * scale, my), (tx - 24 * scale, my - 16 * scale), (tx - 15 * scale, my), (tx - 24 * scale, my + 14 * scale)], fill=c_fin)
    # Soft side fins
    td.polygon([(mx + 4 * scale, my - 8 * scale), (mx - 12 * scale, my - 24 * scale), (mx - 4 * scale, my - 6 * scale)], fill=c_fin)
    td.polygon([(mx + 4 * scale, my + 8 * scale), (mx - 10 * scale, my + 24 * scale), (mx - 4 * scale, my + 6 * scale)], fill=c_fin)
    td.polygon(pts, fill=c_main)
    # Delicate pearlescent highlight along back
    td.ellipse([mx + 6 * scale, my - 4 * scale, mx + 24 * scale, my + 4 * scale], fill=(255, 255, 255, 110))
    tmp = tmp.filter(ImageFilter.GaussianBlur(radius=1.1))
    if rot_deg:
        tmp = tmp.rotate(rot_deg, resample=Image.Resampling.BICUBIC)
    return tmp


def fx_ca_cute():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # Subtle aqua-teal ambient water caustics strictly near corners (zero opaque purple wash!)
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-90, -90, 220, 220], fill=(56, 189, 248, 52))
    gd.ellipse([SIZE - 220, -80, SIZE + 80, 220], fill=(45, 212, 191, 46))
    gd.ellipse([-80, SIZE - 220, 220, SIZE + 90], fill=(14, 165, 233, 52))
    gd.ellipse([SIZE - 230, SIZE - 230, SIZE + 80, SIZE + 80], fill=(56, 189, 248, 46))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=38))
    img = Image.alpha_composite(img, glow)

    specs = [
        (86, 84, 0.92, (251, 146, 60, 195), (254, 215, 170, 130), -28),
        (420, 92, 0.96, (249, 115, 22, 185), (254, 240, 138, 125), 148),
        (72, 316, 0.78, (253, 186, 116, 185), (255, 237, 213, 125), 22),
        (434, 344, 0.88, (251, 113, 133, 185), (254, 205, 211, 125), -145),
        (114, 444, 0.84, (245, 158, 11, 185), (254, 243, 199, 120), 16),
        (398, 444, 0.76, (251, 146, 60, 175), (255, 237, 213, 115), 164),
    ]
    for cx, cy, sc, cm, cf, rot in specs:
        koi = draw_koi_silhouette(sc, cm, cf, rot)
        img.alpha_composite(koi, (cx - 80, cy - 80))

    d = ImageDraw.Draw(img)
    rng = random.Random(77)
    for bx, by, br in [(148, 52, 6), (344, 56, 5), (464, 158, 7), (44, 194, 6), (458, 254, 5), (56, 408, 7), (318, 468, 6), (206, 464, 5)]:
        d.ellipse([bx - br, by - br, bx + br, by + br], outline=(224, 242, 254, 155), width=1)
        d.ellipse([bx - br * 0.45, by - br * 0.45, bx, by], fill=(255, 255, 255, 185))
    return img


def fx_canh_hoa():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    rng = random.Random(202)
    # Soft out-of-focus foreground petals around outer frame + crisper drifting mid-ground petals
    outer_spots = [
        (46, 56, 86, 32, 3.0), (456, 64, 92, -38, 3.0), (54, 444, 90, 142, 3.2), (452, 440, 88, -124, 3.0),
        (164, 36, 68, 18, 1.4), (356, 42, 72, -24, 1.4), (42, 224, 74, 74, 1.8), (468, 236, 70, -82, 1.8),
        (124, 114, 54, 44, 0.5), (394, 118, 52, -48, 0.5), (104, 366, 56, 115, 0.6), (408, 368, 54, -112, 0.6),
        (182, 470, 66, 15, 1.2), (336, 468, 68, -22, 1.2), (258, 28, 52, 52, 1.0), (264, 482, 56, -54, 1.0),
    ]
    palettes = [
        ((255, 241, 246, 215), (251, 207, 232, 195)),
        ((255, 245, 248, 205), (249, 168, 212, 185)),
        ((254, 242, 248, 215), (244, 182, 216, 190)),
    ]
    for idx, (px, py, sz, rot, br) in enumerate(outer_spots):
        ci, co = palettes[idx % len(palettes)]
        ptl = draw_sakura_petal_img(sz, ci, co, rot + rng.randint(-12, 12), blur_r=br)
        img.alpha_composite(ptl, (px - sz // 2, py - sz // 2))
    return img


def make_diecut_sticker(draw_shape_fn, size=110):
    pad = 16
    full = size + pad * 2
    art = Image.new("RGBA", (full, full), (0, 0, 0, 0))
    draw_shape_fn(ImageDraw.Draw(art), full * 0.5, full * 0.5)
    # Crisp white vinyl die-cut border from dilated alpha
    a = art.split()[3]
    halo = a.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(0.8))
    white_cut = Image.new("RGBA", (full, full), (255, 255, 255, 250))
    white_cut.putalpha(halo)
    shadow = Image.new("RGBA", (full, full), (15, 23, 42, 85))
    shadow.putalpha(halo.point(lambda v: int(v * 0.35)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3.5))
    out = Image.new("RGBA", (full, full), (0, 0, 0, 0))
    out.alpha_composite(shadow, (0, 3))
    out.alpha_composite(white_cut, (0, 0))
    out.alpha_composite(art, (0, 0))
    return out


def fx_sticker_doodle():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    def shape_heart(col):
        def _fn(d, cx, cy):
            r = 21
            d.ellipse([cx - r, cy - r * 0.85, cx + 2, cy + r * 0.25], fill=col)
            d.ellipse([cx - 2, cy - r * 0.85, cx + r, cy + r * 0.25], fill=col)
            d.polygon([(cx - r * 0.96, cy - r * 0.15), (cx + r * 0.96, cy - r * 0.15), (cx, cy + r * 1.12)], fill=col)
            d.ellipse([cx - r * 0.55, cy - r * 0.55, cx - r * 0.12, cy - r * 0.18], fill=(255, 255, 255, 130))
        return _fn

    def shape_bow(d, cx, cy):
        pink = (244, 114, 182, 255)
        light = (251, 207, 232, 255)
        d.polygon([(cx, cy), (cx - 28, cy - 17), (cx - 30, cy + 17)], fill=pink)
        d.polygon([(cx, cy), (cx + 28, cy - 17), (cx + 30, cy + 17)], fill=pink)
        d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=light)

    def shape_star(col):
        def _fn(d, cx, cy):
            pts = []
            for k in range(10):
                ang = -math.pi / 2 + k * math.pi / 5
                rad = 24 if k % 2 == 0 else 11
                pts.append((cx + math.cos(ang) * rad, cy + math.sin(ang) * rad))
            d.polygon(pts, fill=col)
            d.ellipse([cx - 7, cy - 9, cx + 2, cy - 1], fill=(255, 255, 255, 120))
        return _fn

    def shape_sparkle(col):
        def _fn(d, cx, cy):
            draw_4pt_star(d, cx, cy, 24, 6.5, col)
        return _fn

    stickers = [
        (68, 72, make_diecut_sticker(shape_star((253, 224, 71, 255)), 92).rotate(14, resample=Image.Resampling.BICUBIC)),
        (444, 76, make_diecut_sticker(shape_heart((251, 113, 133, 255)), 92).rotate(-14, resample=Image.Resampling.BICUBIC)),
        (78, 434, make_diecut_sticker(shape_heart((196, 181, 253, 255)), 88).rotate(-16, resample=Image.Resampling.BICUBIC)),
        (438, 432, make_diecut_sticker(shape_star((125, 211, 252, 255)), 92).rotate(-12, resample=Image.Resampling.BICUBIC)),
        (256, 464, make_diecut_sticker(shape_bow, 96)),
        (54, 248, make_diecut_sticker(shape_sparkle((251, 191, 36, 255)), 80)),
        (456, 256, make_diecut_sticker(shape_sparkle((244, 114, 182, 255)), 80)),
    ]
    for cx, cy, st in stickers:
        img.alpha_composite(st, (cx - st.width // 2, cy - st.height // 2))
    return img


def fx_buom_xinh():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    specs = [
        (82, 84, 0.92, (125, 211, 252, 185), (56, 189, 248, 75), 24, 0.9),
        (430, 88, 0.98, (249, 168, 212, 185), (244, 114, 182, 75), -22, 0.9),
        (64, 266, 0.78, (196, 181, 253, 180), (167, 139, 250, 70), 16, 1.1),
        (446, 288, 0.84, (147, 197, 253, 180), (96, 165, 250, 70), -18, 1.1),
        (96, 430, 0.90, (253, 186, 116, 175), (251, 146, 60, 68), -16, 1.0),
        (416, 432, 0.92, (196, 181, 253, 180), (167, 139, 250, 70), 20, 1.0),
    ]
    for cx, cy, s, c_w, c_g, rot, br in specs:
        b = draw_luminous_butterfly(s, c_w, c_g, rot, br)
        img.alpha_composite(b, (cx - b.width // 2, cy - b.height // 2))
    return img


def make_boi_card(title, sub, bg_col, border_col, tag_col, pill_label):
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Ornate tarot corner ticks
    c = (border_col[0], border_col[1], border_col[2], 215)
    for (x, y, dx, dy) in [(22, 22, 42, 42), (490, 22, -42, 42), (22, 490, 42, -42), (490, 490, -42, -42)]:
        d.line([x, y, x + dx, y], fill=c, width=4)
        d.line([x, y, x, y + dy], fill=c, width=4)
    draw_4pt_star(d, 256, 36, 14, 4, border_col)
    # Bottom tarot result card
    d.rounded_rectangle([32, 376, 480, 486], radius=22, fill=bg_col, outline=border_col, width=3)
    draw_centered_text(d, 256, 412, title, fit_font(d, FONT_BOLD, title, 418, 20, 13), tag_col)
    draw_centered_text(d, 256, 452, sub, fit_font(d, FONT_ITALIC, sub, 420, 16, 11), (255, 255, 255, 255))
    return img


def save_icon_with_overlay(out_path, portrait_128, overlay_512, pill_text, pill_bg=(15, 23, 42, 195)):
    base = portrait_128.convert("RGBA")
    ov = overlay_512.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)
    base = Image.alpha_composite(base, ov)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([12, 93, 116, 117], radius=9, fill=pill_bg, outline=(255, 255, 255, 175), width=1)
    draw_centered_text(d, 64, 105, pill_text, fit_font(d, FONT_BOLD, pill_text, 94, 12, 9), (255, 255, 255, 255))
    d.rounded_rectangle([2, 2, 126, 126], radius=24, outline=(255, 255, 255, 210), width=3)
    base = apply_rounded_square_mask(base, [2, 2, 126, 126], radius=24)
    base.save(out_path, "PNG")


def save_ai_icon(out_path, portrait_128, tint_rgb, label):
    # Subtle seasonal/theme color grade on sample portrait + clean bottom caption pill
    arr = bytearray(portrait_128.tobytes())
    tr, tg, tb = tint_rgb
    for i in range(0, len(arr), 3):
        arr[i] = min(255, int(arr[i] * 0.78 + tr * 0.22))
        arr[i + 1] = min(255, int(arr[i + 1] * 0.78 + tg * 0.22))
        arr[i + 2] = min(255, int(arr[i + 2] * 0.78 + tb * 0.22))
    im = Image.frombytes("RGB", (ICON_SIZE, ICON_SIZE), bytes(arr)).convert("RGBA")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([10, 93, 118, 117], radius=9, fill=(15, 23, 42, 200), outline=(255, 255, 255, 175), width=1)
    draw_centered_text(d, 64, 105, label, fit_font(d, FONT_BOLD, label, 98, 12, 9), (255, 255, 255, 255))
    d.rounded_rectangle([2, 2, 126, 126], radius=24, outline=(255, 255, 255, 210), width=3)
    im = apply_rounded_square_mask(im, [2, 2, 126, 126], radius=24)
    im.save(out_path, "PNG")


def build_clock_font_atlas():
    W, H = 512, 256
    atlas = Image.new("L", (W, H), 0)
    font_semi = r"C:\Windows\Fonts\seguisb.ttf"
    if not os.path.exists(font_semi):
        font_semi = FONT_BOLD

    def render_cell(ch, font_path, fsize, cw, ch_h, align_bottom_pad=10):
        sc = 2
        f = ImageFont.truetype(font_path, fsize * sc)
        # Measure reference '0' so baseline stays locked across all digits/punctuation
        big = Image.new("L", (cw * sc, ch_h * sc), 0)
        bd = ImageDraw.Draw(big)
        ref_bb = bd.textbbox((0, 0), "0", font=f)
        g_bb = bd.textbbox((0, 0), ch, font=f)
        gw = g_bb[2] - g_bb[0]
        x = (cw * sc - gw) // 2 - g_bb[0]
        y = (ch_h * sc - align_bottom_pad * sc) - ref_bb[3]
        bd.text((x, y), ch, font=f, fill=255)
        return big.resize((cw, ch_h), Image.Resampling.LANCZOS)

    # Row 0: large iOS Lock-Screen time glyphs '0'-'9', ':', '/' (42x128 each)
    for idx, ch in enumerate("0123456789:/"):
        cell = render_cell(ch, FONT_BOLD, 98, 42, 128, align_bottom_pad=22)
        atlas.paste(cell, (idx * 42, 0))

    # Row 1: small date glyphs '0'-'9', '/', '•' (24x48 each)
    for idx, ch in enumerate("0123456789/•"):
        cell = render_cell(ch, font_semi, 27, 24, 48, align_bottom_pad=10)
        atlas.paste(cell, (idx * 24, 128))

    # Weekday labels (168x38 each)
    weekdays = ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"]
    positions = [
        (0, 176), (170, 176), (340, 176),
        (0, 216), (170, 216), (340, 216),
        (296, 128),
    ]
    for wtxt, (px, py) in zip(weekdays, positions):
        cell = render_cell(wtxt, font_semi, 24, 168, 38, align_bottom_pad=8)
        atlas.paste(cell, (px, py))

    out_path = os.path.join(BINS_DIR, "clock_font_atlas.bin")
    with open(out_path, "wb") as bf:
        bf.write(zlib.compress(atlas.tobytes(), level=9))
    print(f"Generated clock_font_atlas.bin ({os.path.getsize(out_path)} bytes)")


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    os.makedirs(V2_DIR, exist_ok=True)

    portrait_raw, used_q = fetch_sample_portrait()
    print(f"Fetched sample portrait: {portrait_raw.size} via {used_q}")
    portrait_128 = crop_portrait(portrait_raw, ICON_SIZE)

    # Part A: 26 real color-preview LUT icons
    build_lut_preview_icons(portrait_128)
    print(f"Generated {len(LUT_SPECS)} real-color LUT preview icons in assets/filters_v2/")

    with open(MANIFEST_PATH, "r", encoding="utf-8") as mf:
        manifest = json.load(mf)

    # Part B: Decorative overlay frames (fx_ca_cute, fx_buom_xinh, fx_canh_hoa, fx_sticker_doodle)
    # are owned by build_real_fx_overlays.py (native 768x768 photographic sprites), and the 6 weather/optical
    # shaders live in worker.js — keep fx_specs empty so PIL never overwrites them.
    fx_specs = []
    for old_shader_fx in ("fx_giot_nuoc", "fx_mua_roi", "fx_bong_bong", "fx_tuyet_roi", "fx_cau_vong", "fx_sao_lap_lanh"):
        manifest.pop(old_shader_fx, None)
    for fid, label, fn, pill_bg in fx_specs:
        ov = fn().convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        ov.save(os.path.join(FRAMES_DIR, f"{fid}.png"), "PNG")
        with open(os.path.join(BINS_DIR, f"{fid}.bin"), "wb") as bf:
            bf.write(zlib.compress(ov.tobytes(), level=9))
        save_icon_with_overlay(os.path.join(V2_DIR, f"{fid}.png"), portrait_128, ov, label, pill_bg=pill_bg)
        manifest[fid] = {"is4Cut": False, "windows": [[0, 0, SIZE, SIZE]]}

    # Part C: 4 Bói Toán tarot overlay frames (owned & generated by generate_tarot_cards.py; never overwrite!)
    # Check generate_tarot_cards.py for the ornate vintage Tarot designs and their 16 random .bin variants.

    with open(MANIFEST_PATH, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, separators=(",", ":"))

    # Part D: 6 new AI preview icons
    ai_specs = [
        ("ai_mua_xuan", (255, 195, 220), "AI Mùa Xuân"),
        ("ai_mua_he", (90, 200, 255), "AI Mùa Hè"),
        ("ai_mua_thu", (245, 155, 75), "AI Mùa Thu"),
        ("ai_mua_dong", (165, 210, 255), "AI Mùa Đông"),
        ("ai_masterchef", (255, 240, 215), "MasterChef"),
        ("ai_csgt", (235, 195, 75), "CSGT"),
    ]
    for fid, tint, label in ai_specs:
        save_ai_icon(os.path.join(V2_DIR, f"{fid}.png"), portrait_128, tint, label)

    build_clock_font_atlas()
    print(f"Generated {len(fx_specs)} overlay frames + .bin + 6 AI icons. Total manifest frames: {len(manifest)}")


if __name__ == "__main__":
    main()
