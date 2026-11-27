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


def fetch_sample_portrait():
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


def fx_ca_cute():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # Dreamy purple-pink outer vignette glow leaving center face crisp
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rectangle([0, 0, SIZE, SIZE], fill=(168, 85, 247, 130))
    gd.ellipse([54, 54, SIZE - 54, SIZE - 54], fill=(0, 0, 0, 0))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=30))
    img = Image.alpha_composite(img, glow)

    d = ImageDraw.Draw(img)
    # Border cute fishes & sea friends
    draw_cute_fish(d, 96, 82, 1.15, (251, 146, 60, 248), (254, 240, 138, 248))
    draw_cute_fish(d, 404, 88, 1.25, (250, 204, 21, 248), (120, 53, 15, 230), flip=True)
    draw_pufferfish(d, 444, 188, 0.92)
    draw_cute_fish(d, 74, 206, 0.95, (196, 181, 253, 248), (129, 140, 248, 245))
    draw_cute_fish(d, 86, 304, 0.85, (167, 243, 208, 248), (52, 211, 153, 245))
    draw_cute_fish(d, 442, 344, 1.10, (253, 186, 116, 248), (239, 68, 68, 240), flip=True)
    draw_pufferfish(d, 174, 444, 0.88)
    draw_cute_shark(d, 86, 412, 1.08)
    draw_cute_fish(d, 424, 446, 0.95, (244, 114, 182, 248), (251, 207, 232, 245), flip=True)
    # Tiny cheek/floating bubbles & hearts
    for bx, by, br in [(142, 54, 8), (336, 48, 7), (464, 128, 9), (42, 150, 7), (162, 290, 6), (366, 258, 6), (312, 456, 8), (48, 348, 7)]:
        draw_soap_bubble(d, bx, by, br, (186, 230, 253))
    for hx, hy in [(254, 44), (110, 148), (398, 298), (256, 474)]:
        draw_heart(d, hx, hy, 14, (244, 114, 182, 235), (30, 41, 59, 190))
    return img


def fx_mua_roi():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    mist = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    md = ImageDraw.Draw(mist)
    md.rectangle([0, 0, SIZE, 88], fill=(30, 58, 138, 72))
    md.rectangle([0, 400, SIZE, SIZE], fill=(56, 189, 248, 75))
    mist = mist.filter(ImageFilter.GaussianBlur(radius=28))
    img = Image.alpha_composite(img, mist)

    d = ImageDraw.Draw(img)
    rng = random.Random(101)
    for _ in range(95):
        x = rng.randint(10, SIZE + 40)
        y = rng.randint(-30, SIZE - 20)
        length = rng.randint(24, 62)
        alpha = rng.randint(75, 195)
        w = rng.choice([1, 2, 2])
        d.line([x, y, x - int(length * 0.28), y + length], fill=(224, 242, 254, alpha), width=w)
    for dx, dy, dr in [(46, 54, 9), (462, 76, 10), (38, 434, 11), (456, 444, 12), (424, 286, 8)]:
        draw_water_drop(d, dx, dy, dr)
    return img


def fx_giot_nuoc():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    drops = [
        (56, 52, 18), (128, 38, 11), (398, 44, 16), (458, 74, 22),
        (36, 152, 14), (82, 188, 9), (468, 168, 15), (422, 206, 10),
        (44, 294, 20), (88, 344, 12), (462, 314, 19), (424, 372, 11),
        (68, 446, 22), (164, 466, 14), (344, 468, 15), (448, 452, 21),
        (252, 34, 12), (260, 474, 11),
    ]
    for cx, cy, r in drops:
        draw_water_drop(d, cx, cy, r)
    return img


def fx_bong_bong():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bubbles = [
        (68, 72, 32, (125, 211, 252)), (140, 46, 16, (244, 114, 182)), (386, 52, 22, (196, 181, 253)),
        (446, 98, 34, (125, 211, 252)), (44, 194, 22, (244, 114, 182)), (464, 226, 20, (167, 243, 208)),
        (58, 342, 28, (196, 181, 253)), (448, 348, 30, (244, 114, 182)), (88, 446, 36, (125, 211, 252)),
        (194, 468, 18, (244, 114, 182)), (334, 462, 20, (167, 243, 208)), (432, 448, 34, (196, 181, 253)),
        (104, 134, 10, (255, 255, 255)), (402, 142, 12, (255, 255, 255)), (396, 404, 11, (255, 255, 255)),
    ]
    for cx, cy, r, tint in bubbles:
        draw_soap_bubble(d, cx, cy, r, tint)
    return img


def fx_canh_hoa():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rng = random.Random(202)
    # 5-petal blossoms in corners
    for bx, by, r in [(54, 54, 16), (456, 62, 18), (58, 452, 18), (452, 448, 16)]:
        for k in range(5):
            a = k * 2 * math.pi / 5.0
            px, py = bx + math.cos(a) * r, by + math.sin(a) * r
            d.ellipse([px - r * 0.55, py - r * 0.55, px + r * 0.55, py + r * 0.55], fill=(251, 207, 232, 235), outline=(244, 114, 182, 210))
        d.ellipse([bx - 5, by - 5, bx + 5, by + 5], fill=(253, 224, 71, 245))
    # Floating petals around outer zone
    spots = [(134, 44), (242, 34), (356, 48), (44, 152), (464, 164), (48, 286), (468, 294), (94, 376), (414, 376), (176, 466), (296, 474), (384, 460), (112, 110), (404, 118)]
    for px, py in spots:
        ang = rng.uniform(0, math.pi * 2)
        pr = rng.uniform(10, 16)
        c = rng.choice([(251, 207, 232, 230), (249, 168, 212, 225), (253, 242, 248, 235)])
        pts = [
            (px + math.cos(ang) * pr, py + math.sin(ang) * pr),
            (px + math.cos(ang + 1.2) * pr * 0.65, py + math.sin(ang + 1.2) * pr * 0.65),
            (px - math.cos(ang) * pr * 0.85, py - math.sin(ang) * pr * 0.85),
            (px + math.cos(ang - 1.2) * pr * 0.65, py + math.sin(ang - 1.2) * pr * 0.65),
        ]
        d.polygon(pts, fill=c, outline=(244, 114, 182, 190))
    return img


def fx_tuyet_roi():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    bokeh = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bokeh)
    rng = random.Random(303)
    for _ in range(36):
        x, y = rng.randint(15, SIZE - 15), rng.randint(15, SIZE - 15)
        if 140 < x < 372 and 125 < y < 375:
            continue
        r = rng.randint(5, 16)
        bd.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, rng.randint(95, 185)))
    bokeh = bokeh.filter(ImageFilter.GaussianBlur(radius=3))
    img = Image.alpha_composite(img, bokeh)

    d = ImageDraw.Draw(img)
    for fx, fy, fr in [(56, 62, 18), (154, 42, 12), (374, 48, 14), (456, 84, 19), (42, 212, 15), (468, 238, 14), (62, 384, 17), (444, 396, 18), (168, 466, 13), (344, 462, 15)]:
        draw_snowflake(d, fx, fy, fr, (255, 255, 255, 235), width=2)
    return img


def fx_sticker_doodle():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ink = (30, 41, 59, 235)
    # 5-pt yellow stars
    for sx, sy, sr in [(64, 64, 22), (446, 72, 24), (72, 434, 20), (448, 436, 22)]:
        draw_5pt_star(d, sx, sy, sr, (253, 224, 71, 245), ink)
    # Pastel hearts near cheeks & edges
    for hx, hy, hs, hc in [(116, 142, 20, (244, 114, 182, 245)), (396, 146, 20, (251, 113, 133, 245)), (52, 268, 18, (196, 181, 253, 245)), (458, 272, 18, (125, 211, 252, 245))]:
        draw_heart(d, hx, hy, hs, hc, ink)
    # Smiling white doodle cloud top-center
    d.ellipse([214, 26, 256, 62], fill=(255, 255, 255, 245), outline=ink, width=2)
    d.ellipse([238, 18, 286, 60], fill=(255, 255, 255, 245), outline=ink, width=2)
    d.ellipse([264, 26, 302, 62], fill=(255, 255, 255, 245), outline=ink, width=2)
    d.rectangle([228, 42, 288, 62], fill=(255, 255, 255, 245))
    d.ellipse([246, 38, 251, 43], fill=ink)
    d.ellipse([265, 38, 270, 43], fill=ink)
    d.arc([252, 42, 264, 52], start=10, end=170, fill=ink, width=2)
    # Pink ribbon bow bottom-center
    d.polygon([(256, 464), (222, 444), (222, 484)], fill=(244, 114, 182, 248), outline=ink)
    d.polygon([(256, 464), (290, 444), (290, 484)], fill=(244, 114, 182, 248), outline=ink)
    d.ellipse([246, 454, 266, 474], fill=(249, 168, 212, 252), outline=ink, width=2)
    # KiraKira sparkles
    for kx, ky in [(164, 52), (356, 46), (144, 456), (368, 456)]:
        draw_4pt_star(d, kx, ky, 14, 4, (255, 255, 255, 245))
    return img


def fx_cau_vong():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cols = [
        (255, 85, 85, 68), (255, 165, 60, 66), (255, 235, 75, 64),
        (95, 235, 145, 60), (75, 195, 255, 64), (175, 115, 255, 68),
    ]
    for idx, col in enumerate(cols):
        off = -130 + idx * 54
        d.line([(0, 220 + off), (SIZE, 40 + off)], fill=col, width=48)
    img = img.filter(ImageFilter.GaussianBlur(radius=22))
    sd = ImageDraw.Draw(img)
    for sx, sy, sr in [(74, 88, 16), (434, 84, 18), (94, 418, 15), (424, 412, 16)]:
        draw_4pt_star(sd, sx, sy, sr, sr * 0.28, (255, 255, 255, 220))
    return img


def fx_buom_xinh():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    specs = [
        (78, 78, 1.05, (147, 197, 253, 235), (191, 219, 254, 235), 24),
        (434, 84, 1.15, (249, 168, 212, 235), (251, 207, 232, 235), -22),
        (56, 266, 0.85, (196, 181, 253, 235), (221, 214, 254, 235), 14),
        (448, 294, 0.90, (125, 211, 252, 235), (186, 230, 253, 235), -16),
        (94, 434, 0.95, (244, 114, 182, 235), (251, 207, 232, 235), -18),
        (418, 434, 1.00, (167, 139, 250, 235), (221, 214, 254, 235), 20),
    ]
    for cx, cy, s, c1, c2, rot in specs:
        b = draw_butterfly(None, cx, cy, s, c1, c2, rot)
        img.alpha_composite(b, (cx - 60, cy - 60))
    d = ImageDraw.Draw(img)
    for sx, sy in [(142, 54), (366, 54), (144, 456), (366, 454)]:
        draw_4pt_star(d, sx, sy, 12, 3.5, (255, 255, 255, 235))
    return img


def fx_sao_lap_lanh():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    stars = [
        (68, 66, 26, (255, 255, 255, 250)), (158, 46, 16, (253, 224, 71, 245)),
        (366, 44, 18, (255, 255, 255, 250)), (448, 76, 28, (251, 207, 232, 248)),
        (46, 198, 20, (253, 224, 71, 245)), (466, 212, 22, (255, 255, 255, 250)),
        (58, 356, 24, (251, 207, 232, 248)), (452, 368, 22, (253, 224, 71, 245)),
        (92, 448, 26, (255, 255, 255, 250)), (254, 474, 16, (253, 224, 71, 245)),
        (424, 446, 26, (255, 255, 255, 250)), (122, 122, 13, (255, 255, 255, 235)),
        (394, 128, 13, (253, 224, 71, 235)), (118, 392, 14, (251, 207, 232, 235)),
    ]
    for sx, sy, sr, col in stars:
        hd.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(col[0], col[1], col[2], 95))
    halo = halo.filter(ImageFilter.GaussianBlur(radius=10))
    img = Image.alpha_composite(img, halo)
    d = ImageDraw.Draw(img)
    for sx, sy, sr, col in stars:
        draw_4pt_star(d, sx, sy, sr, max(3, sr * 0.24), col)
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

    # Part B: 10 foreground sticker & weather/water overlays
    fx_specs = [
        ("fx_ca_cute", "Cá Cute", fx_ca_cute, (88, 28, 135, 205)),
        ("fx_mua_roi", "Mưa Rơi", fx_mua_roi, (15, 23, 42, 205)),
        ("fx_giot_nuoc", "Giọt Nước", fx_giot_nuoc, (3, 105, 161, 205)),
        ("fx_bong_bong", "Bong Bóng", fx_bong_bong, (76, 29, 149, 205)),
        ("fx_canh_hoa", "Cánh Hoa", fx_canh_hoa, (157, 23, 77, 205)),
        ("fx_tuyet_roi", "Tuyết Rơi", fx_tuyet_roi, (30, 58, 138, 205)),
        ("fx_sticker_doodle", "Sticker Mặt", fx_sticker_doodle, (190, 24, 93, 205)),
        ("fx_cau_vong", "Cầu Vồng", fx_cau_vong, (109, 40, 217, 205)),
        ("fx_buom_xinh", "Bướm Xinh", fx_buom_xinh, (67, 56, 202, 205)),
        ("fx_sao_lap_lanh", "Lấp Lánh", fx_sao_lap_lanh, (180, 83, 9, 205)),
    ]
    for fid, label, fn, pill_bg in fx_specs:
        ov = fn().convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        ov.save(os.path.join(FRAMES_DIR, f"{fid}.png"), "PNG")
        with open(os.path.join(BINS_DIR, f"{fid}.bin"), "wb") as bf:
            bf.write(zlib.compress(ov.tobytes(), level=9))
        save_icon_with_overlay(os.path.join(V2_DIR, f"{fid}.png"), portrait_128, ov, label, pill_bg=pill_bg)
        manifest[fid] = {"is4Cut": False, "windows": [[0, 0, SIZE, SIZE]]}

    # Part C: 4 Bói Toán tarot overlay frames
    boi_specs = [
        ("nm_boi_do_hay_den", "Đỏ Hay Đen", "HÔM NAY ĐỎ HAY ĐEN?", "Quẻ: ĐỎ RỰC — MAY MẮN 99%", (69, 10, 10, 236), (250, 204, 21, 255), (253, 224, 71, 255)),
        ("nm_boi_duyen_tinh", "Đường Tình Duyên", "ĐƯỜNG TÌNH DUYÊN", "Sắp có người thương nhắn tin rồi đó!", (131, 24, 67, 236), (249, 168, 212, 255), (254, 240, 138, 255)),
        ("nm_boi_nay_nen_an_gi", "Nay Nên Ăn Gì", "NAY NÊN ĂN GÌ?", "Gợi ý: Trà sữa + Bún đậu mắm tôm!", (120, 53, 15, 236), (251, 191, 36, 255), (253, 224, 71, 255)),
        ("nm_boi_xem_que", "Xem Quẻ Hôm Nay", "XEM QUẺ HÔM NAY", "QUẺ ĐẠI CÁT • VẠN SỰ NHƯ Ý", (46, 16, 101, 236), (192, 132, 252, 255), (253, 224, 71, 255)),
    ]
    for fid, label, title, sub, bg_col, border_col, tag_col in boi_specs:
        ov = make_boi_card(title, sub, bg_col, border_col, tag_col, label)
        ov.save(os.path.join(FRAMES_DIR, f"{fid}.png"), "PNG")
        with open(os.path.join(BINS_DIR, f"{fid}.bin"), "wb") as bf:
            bf.write(zlib.compress(ov.tobytes(), level=9))
        save_icon_with_overlay(os.path.join(V2_DIR, f"{fid}.png"), portrait_128, ov, label, pill_bg=bg_col)
        manifest[fid] = {"is4Cut": False, "windows": [[0, 0, SIZE, SIZE]]}

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

    print(f"Generated 14 overlay frames + 14 .bin + 6 AI icons. Total manifest frames: {len(manifest)}")


if __name__ == "__main__":
    main()
