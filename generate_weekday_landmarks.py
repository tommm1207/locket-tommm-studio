import json
import math
import os
import urllib.parse
import urllib.request
import zlib
from collections import deque
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
BINS_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")

ICON_SIZE = 256
BIN_SIZE = 768

FONT_IMPACT = r"C:\Windows\Fonts\impact.ttf"
FONT_ZH = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_JA = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_KO = r"C:\Windows\Fonts\malgunbd.ttf"

# 8 landmark icon specs: (filter_id, sample_word, font_path, is_latin, queries)
LANDMARK_ICONS = [
    (
        "weekday_depth_en",
        "MONDAY",
        FONT_IMPACT,
        True,
        ["wiki:Big_Ben", "Big Ben London sky", "Tower Bridge London blue sky"],
    ),
    (
        "weekday_depth_tw",
        "星期一",
        FONT_ZH,
        False,
        ["wiki:Taipei_101", "Taipei 101 skyscraper blue sky"],
    ),
    (
        "weekday_depth_de",
        "MONTAG",
        FONT_IMPACT,
        True,
        ["Fernsehturm Berlin blue sky", "Brandenburg Gate Berlin blue sky"],
    ),
    (
        "weekday_depth_zh",
        "星期一",
        FONT_ZH,
        False,
        ["Oriental Pearl Tower Shanghai blue sky", "Shanghai Oriental Pearl TV Tower"],
    ),
    (
        "weekday_depth_ja",
        "日曜日",
        FONT_JA,
        False,
        ["wiki:Tokyo_Tower", "Tokyo Skytree blue sky", "Tokyo Tower blue sky"],
    ),
    (
        "weekday_depth_ko",
        "일요일",
        FONT_KO,
        False,
        ["wiki:N_Seoul_Tower", "wiki:Gyeongbokgung", "N Seoul Tower daytime"],
    ),
    (
        "weekday_depth_es",
        "DOMINGO",
        FONT_IMPACT,
        True,
        ["wiki:Puerta_de_Alcalá", "wiki:Metropolis_Building,_Madrid", "Plaza Mayor Madrid blue sky"],
    ),
    (
        "weekday_depth_fr",
        "DIMANCHE",
        FONT_IMPACT,
        True,
        ["Tour Eiffel Paris", "Eiffel Tower", "wiki:Eiffel_Tower"],
    ),
]

# 5 new language .bin overlay specs (Sunday=0 .. Saturday=6, matching getVietnamWeekdayIndex)
NEW_WEEKDAY_BINS = {
    "weekday_zh": (FONT_ZH, False, ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]),
    "weekday_ja": (FONT_JA, False, ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"]),
    "weekday_ko": (FONT_KO, False, ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]),
    "weekday_es": (FONT_IMPACT, True, ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"]),
    "weekday_fr": (FONT_IMPACT, True, ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"]),
}


def fetch_wikimedia_photo(queries):
    import io
    for q in queries:
        if q.startswith("wiki:"):
            title = urllib.parse.quote(q[5:])
            api = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
            req = urllib.request.Request(api, headers={"User-Agent": "LocketTommmStudio/1.0"})
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                u = (data.get("thumbnail") or {}).get("source") or (data.get("originalimage") or {}).get("source")
                if u:
                    ireq = urllib.request.Request(u, headers={"User-Agent": "LocketTommmStudio/1.0"})
                    with urllib.request.urlopen(ireq, timeout=20) as ir:
                        im = Image.open(io.BytesIO(ir.read())).convert("RGB")
                        if im.width >= 200 and im.height >= 200:
                            return im, q
            except Exception:
                pass
            continue
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
                    "iiurlwidth": "640",
                    "format": "json",
                    "gsrsearch": q,
                }
            )
        )
        req = urllib.request.Request(api, headers={"User-Agent": "LocketTommmStudio/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception:
            continue
        pages = list((data.get("query") or {}).get("pages", {}).values())
        pages.sort(key=lambda p: p.get("index", 999))
        for page in pages:
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            ii = infos[0]
            mime = (ii.get("mime") or "").lower()
            if mime not in ("image/jpeg", "image/png", "image/webp"):
                continue
            url = ii.get("thumburl") or ii.get("url")
            if not url:
                continue
            try:
                ireq = urllib.request.Request(url, headers={"User-Agent": "LocketTommmStudio/1.0"})
                with urllib.request.urlopen(ireq, timeout=20) as ir:
                    import io

                    im = Image.open(io.BytesIO(ir.read())).convert("RGB")
                    if im.width >= 200 and im.height >= 200:
                        return im, q
            except Exception:
                continue
    return None, None


def cover_crop(im, size, top_bias=0.14):
    w, h = im.size
    scale = max(size / w, size / h)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - size) // 2
    top = int((nh - size) * top_bias)
    top = max(0, min(nh - size, top))
    return resized.crop((left, top, left + size, top + size))


def compute_landmark_fg_mask(rgb_im):
    """Flood-fill connected sky from top corners so spire/building stays in front of text."""
    w, h = rgb_im.size
    px = rgb_im.load()

    # Sample top-left and top-right sky patches
    seeds = []
    for sx in (6, 18, w - 19, w - 7):
        for sy in (4, 12):
            seeds.append(px[sx, sy])
    sr = sum(c[0] for c in seeds) / len(seeds)
    sg = sum(c[1] for c in seeds) / len(seeds)
    sb = sum(c[2] for c in seeds) / len(seeds)

    def is_sky_like(x, y):
        r, g, b = px[x, y]
        dist = math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2)
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        chroma = max(r, g, b) - min(r, g, b)
        # Sky or white clouds connected to top edge stay behind text
        return dist < 68 or (b >= r - 8 and lum > 125 and chroma < 120) or (lum > 185 and chroma < 38)

    sky = [[False] * w for _ in range(h)]
    q = deque()
    max_sky_y = int(h * 0.68)
    for x in range(w):
        if is_sky_like(x, 0):
            sky[0][x] = True
            q.append((x, 0))
    for y in range(0, int(h * 0.45)):
        for x in (0, w - 1):
            if not sky[y][x] and is_sky_like(x, y):
                sky[y][x] = True
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        cr, cg, cb = px[cx, cy]
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < w and 0 <= ny < max_sky_y and not sky[ny][nx]:
                nr, ng, nb = px[nx, ny]
                step_d = math.sqrt((nr - cr) ** 2 + (ng - cg) ** 2 + (nb - cb) ** 2)
                if step_d < 34 and is_sky_like(nx, ny):
                    sky[ny][nx] = True
                    q.append((nx, ny))

    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            mp[x, y] = 0 if sky[y][x] else 255
    return mask.filter(ImageFilter.GaussianBlur(radius=0.7))


def render_stretched_word(text, font_path, target_w, stretch_y=1.35):
    tmp = Image.new("RGBA", (1200, 500), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    best_font = ImageFont.truetype(font_path, 48)
    for sz in range(280, 28, -4):
        f = ImageFont.truetype(font_path, sz)
        bb = d.textbbox((0, 0), text, font=f)
        if (bb[2] - bb[0]) <= target_w:
            best_font = f
            break
    bb = d.textbbox((40, 40), text, font=best_font)
    tw = max(1, bb[2] - bb[0] + 16)
    th = max(1, bb[3] - bb[1] + 20)
    layer = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ox = 8 - (bb[0] - 40)
    oy = 8 - (bb[1] - 40)
    ld.text((ox + 2, oy + 4), text, font=best_font, fill=(0, 0, 0, 115))
    ld.text((ox, oy), text, font=best_font, fill=(255, 255, 255, 255))
    if abs(stretch_y - 1.0) > 0.01:
        new_h = max(1, int(round(th * stretch_y)))
        layer = layer.resize((tw, new_h), Image.Resampling.LANCZOS)
    return layer


def make_landmark_icon(fid, word, font_path, is_latin, photo):
    base = cover_crop(photo, ICON_SIZE, top_bias=0.14)
    fg_mask = compute_landmark_fg_mask(base)

    canvas = base.convert("RGBA")
    word_im = render_stretched_word(word, font_path, target_w=228, stretch_y=1.32 if is_latin else 1.12)
    if word_im.height > 120:
        scale = 120 / word_im.height
        word_im = word_im.resize((max(1, int(word_im.width * scale)), 120), Image.Resampling.LANCZOS)

    wx = (ICON_SIZE - word_im.width) // 2
    wy = 28 + max(0, (112 - word_im.height) // 2)
    canvas.alpha_composite(word_im, (wx, wy))

    # Re-composite foreground landmark spire/building on top of the white text for true depth effect
    fg_rgba = base.convert("RGBA")
    fg_rgba.putalpha(fg_mask)
    canvas = Image.alpha_composite(canvas, fg_rgba)

    # Rounded square alpha mask matching weekday_depth.png (256x256, radius ~48)
    round_alpha = Image.new("L", (ICON_SIZE, ICON_SIZE), 0)
    ImageDraw.Draw(round_alpha).rounded_rectangle([0, 0, ICON_SIZE - 1, ICON_SIZE - 1], radius=48, fill=255)
    canvas.putalpha(round_alpha)

    out_png = os.path.join(FRAMES_DIR, f"{fid}.png")
    canvas.save(out_png, "PNG")
    return out_png


def detect_reference_bin_center_y():
    ref_path = os.path.join(BINS_DIR, "weekday_en_1.bin")
    if not os.path.exists(ref_path):
        return 190
    raw = zlib.decompress(open(ref_path, "rb").read())
    im = Image.frombytes("RGBA", (BIN_SIZE, BIN_SIZE), raw)
    bb = im.getbbox()
    if bb:
        return (bb[1] + bb[3]) // 2
    return 190


def generate_weekday_bin(prefix, day_idx, word, font_path, is_latin, ref_cy):
    canvas = Image.new("RGBA", (BIN_SIZE, BIN_SIZE), (0, 0, 0, 0))
    word_im = render_stretched_word(word, font_path, target_w=680, stretch_y=1.32 if is_latin else 1.08)
    if word_im.height > 230:
        s = 230 / word_im.height
        word_im = word_im.resize((max(1, int(word_im.width * s)), 230), Image.Resampling.LANCZOS)
    wx = (BIN_SIZE - word_im.width) // 2
    wy = max(24, min(BIN_SIZE - word_im.height - 24, ref_cy - word_im.height // 2))
    canvas.alpha_composite(word_im, (wx, wy))
    out_bin = os.path.join(BINS_DIR, f"{prefix}_{day_idx}.bin")
    with open(out_bin, "wb") as bf:
        bf.write(zlib.compress(canvas.tobytes(), level=9))


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)

    fetched = {}
    for fid, word, font_path, is_latin, queries in LANDMARK_ICONS:
        im, used_q = fetch_wikimedia_photo(queries)
        if im is None:
            raise RuntimeError(f"Failed to fetch Wikimedia landmark photo for {fid} ({queries})")
        make_landmark_icon(fid, word, font_path, is_latin, im)
        fetched[fid] = f"{im.size} ({used_q})"

    print("Landmark icons fetched & built (8/8):")
    for k, v in fetched.items():
        print(f"  {k}: {v}")

    ref_cy = detect_reference_bin_center_y()
    bin_count = 0
    for prefix, (font_path, is_latin, words) in NEW_WEEKDAY_BINS.items():
        for idx, word in enumerate(words):
            generate_weekday_bin(prefix, idx, word, font_path, is_latin, ref_cy)
            bin_count += 1
    print(f"Generated {bin_count} weekday .bin overlays (ref_cy={ref_cy}).")


if __name__ == "__main__":
    main()
