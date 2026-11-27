import io
import json
import os
import urllib.parse
import urllib.request
import zlib
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
BINS_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")
V2_DIR = os.path.join(BASE_DIR, "assets", "filters_v2")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "frames_manifest.json")

SIZE = 512
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SERIF = r"C:\Windows\Fonts\timesbd.ttf"
FONT_MONO = r"C:\Windows\Fonts\consolab.ttf"
FONT_HAND = r"C:\Windows\Fonts\segoeuiz.ttf"


def get_font(path, size):
    return ImageFont.truetype(path, size)


def fit_font(draw, font_path, text, max_w, max_size, min_size=11):
    for sz in range(max_size, min_size - 1, -1):
        f = get_font(font_path, sz)
        bbox = draw.textbbox((0, 0), text, font=f)
        if (bbox[2] - bbox[0]) <= max_w:
            return f
    return get_font(font_path, min_size)


def new_canvas():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def punch_window(img, box):
    """Ensure the photo window is 100% transparent so the user's photo shows through."""
    x1, y1, x2, y2 = box
    clear = Image.new("L", (x2 - x1, y2 - y1), 0)
    alpha = img.split()[3]
    alpha.paste(clear, (x1, y1))
    img.putalpha(alpha)


def draw_centered_text(draw, cx, cy, text, font, fill, stroke_fill=None, stroke_w=0):
    draw.text((cx, cy), text, font=font, fill=fill, anchor="mm",
              stroke_fill=stroke_fill, stroke_width=stroke_w)


def draw_frame_border(img, win, bg_color, border_color=None, border_w=4, radius=16):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, SIZE, SIZE], fill=bg_color)
    punch_window(img, win)
    if border_color:
        x1, y1, x2, y2 = win
        d.rounded_rectangle([x1 - 2, y1 - 2, x2 + 2, y2 + 2], radius=radius,
                            outline=border_color, width=border_w)
    return d


# =========================================================================
# Vector Graphic Helpers (ZERO unsupported Unicode glyphs -> ZERO tofu boxes)
# =========================================================================
def draw_verified_badge(d, cx, cy, r=8):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(32, 213, 236, 255))
    d.line([cx - r * 0.45, cy + r * 0.05, cx - r * 0.1, cy + r * 0.42, cx + r * 0.5, cy - r * 0.35],
           fill=(255, 255, 255, 255), width=max(2, int(r * 0.28)))


def draw_heart(d, cx, cy, size=14, fill=(254, 44, 85, 255)):
    r = size * 0.27
    top_y = cy - size * 0.14
    d.ellipse([cx - r * 1.95, top_y - r, cx + r * 0.05, top_y + r], fill=fill)
    d.ellipse([cx - r * 0.05, top_y - r, cx + r * 1.95, top_y + r], fill=fill)
    d.polygon([
        (cx - size * 0.51, top_y + r * 0.25),
        (cx + size * 0.51, top_y + r * 0.25),
        (cx, cy + size * 0.48),
    ], fill=fill)


def draw_play_triangle(d, cx, cy, size=14, fill=(255, 255, 255, 255)):
    r = size * 0.5
    d.polygon([(cx - r * 0.55, cy - r * 0.8), (cx - r * 0.55, cy + r * 0.8), (cx + r * 0.9, cy)], fill=fill)


def draw_snowflake_vec(d, cx, cy, r=10, fill=(255, 255, 255, 230)):
    import math
    for ang_deg in range(0, 180, 60):
        rad = math.radians(ang_deg)
        dx, dy = math.cos(rad) * r, math.sin(rad) * r
        d.line([cx - dx, cy - dy, cx + dx, cy + dy], fill=fill, width=max(2, int(r * 0.2)))


def draw_checkbox(d, x, y, box_sz=18, fill=(34, 197, 94, 255)):
    d.rounded_rectangle([x, y, x + box_sz, y + box_sz], radius=4, fill=fill)
    d.line([x + box_sz * 0.24, y + box_sz * 0.52, x + box_sz * 0.44, y + box_sz * 0.74,
            x + box_sz * 0.78, y + box_sz * 0.28], fill=(255, 255, 255, 255), width=2)


def draw_tiktok_logo(d, cx, cy, r=14):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(15, 15, 20, 255), outline=(255, 255, 255, 200), width=1)
    # Minimal stylized cyan/pink music note
    for ox, oy, col in [(-1, -1, (37, 244, 238, 255)), (1, 1, (254, 44, 85, 255)), (0, 0, (255, 255, 255, 255))]:
        nx, ny = cx + ox, cy + oy
        d.ellipse([nx - r * 0.42, ny + r * 0.05, nx + r * 0.05, ny + r * 0.52], fill=col)
        d.line([nx + r * 0.02, ny + r * 0.25, nx + r * 0.02, ny - r * 0.42], fill=col, width=max(2, int(r * 0.22)))
        d.line([nx + r * 0.02, ny - r * 0.42, nx + r * 0.42, ny - r * 0.22], fill=col, width=max(2, int(r * 0.2)))


def draw_star(d, cx, cy, r=8, fill=(250, 204, 21, 255)):
    import math
    pts = []
    for i in range(10):
        ang = math.radians(-90 + i * 36)
        rad = r if i % 2 == 0 else r * 0.44
        pts.append((cx + math.cos(ang) * rad, cy + math.sin(ang) * rad))
    d.polygon(pts, fill=fill)


# =========================================================================
# Wikimedia Portrait Fetchers (Real photos with clean crop & fallback)
# =========================================================================
PORTRAIT_URLS = {
    "sontung": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Son_Tung_M-TP_1_%282021%29.png/330px-Son_Tung_M-TP_1_%282021%29.png",
    "ronaldo": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg/330px-Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg",
    "faker": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/T1_Faker_Lee_Sang-Hyeok_in_a_2026_Interview.png/330px-T1_Faker_Lee_Sang-Hyeok_in_a_2026_Interview.png",
    "monalisa": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/330px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
}


def resolve_cat_url():
    api = "https://en.wikipedia.org/w/api.php?action=query&titles=Grumpy_Cat|Cat&prop=pageimages&format=json&pithumbsize=256&redirects=1"
    try:
        req = urllib.request.Request(api, headers={"User-Agent": "LocketTommmStudio/1.0"})
        data = json.loads(urllib.request.urlopen(req, timeout=8).read().decode("utf-8"))
        for p in data.get("query", {}).get("pages", {}).values():
            src = (p.get("thumbnail") or {}).get("source")
            if src:
                return src
    except Exception as e:
        print("WARN cat wiki lookup failed:", e)
    return None


def fetch_portrait(url):
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "LocketTommmStudio/1.0 (https://tommm1207.github.io)"})
        raw = urllib.request.urlopen(req, timeout=12).read()
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
        return im
    except Exception as e:
        print("WARN portrait fetch failed:", url[:60], e)
        return None


def crop_square_top(im, out_size):
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, min(h - side, int((h - side) * 0.2)))  # bias slightly upward to keep faces centered
    return im.crop((left, top, left + side, top + side)).resize((out_size, out_size), Image.Resampling.LANCZOS)


def draw_avatar_circle(img, portrait_img, cx, cy, r, fallback_color=(254, 44, 85, 255), fallback_letter="?", outline=(225, 230, 238, 255)):
    d = ImageDraw.Draw(img)
    diam = int(r * 2)
    if portrait_img is not None:
        sq = crop_square_top(portrait_img, diam)
        mask = Image.new("L", (diam, diam), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, diam - 1, diam - 1], fill=255)
        img.paste(sq, (int(cx - r), int(cy - r)), mask)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=outline, width=2)
    else:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fallback_color, outline=outline, width=2)
        draw_centered_text(d, cx, cy, fallback_letter, get_font(FONT_BOLD, max(12, int(r * 0.9))), (255, 255, 255, 255))


# =========================================================================
# 36 Crisp RGBA Frames (512x512, Zero Tofu)
# =========================================================================
def make_comment_card(author, verified, comment, likes, handle_color=(254, 44, 85, 255), sub="09-07  Trả lời", portrait=None):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    for y in range(0, 148):
        a = int(128 * (1 - y / 148))
        d.line([0, y, SIZE, y], fill=(0, 0, 0, a))
    cx1, cy1, cx2, cy2 = 24, 20, 488, 134
    d.rounded_rectangle([cx1 + 2, cy1 + 4, cx2 + 2, cy2 + 4], radius=18, fill=(0, 0, 0, 90))
    d.rounded_rectangle([cx1, cy1, cx2, cy2], radius=18, fill=(255, 255, 255, 246))

    draw_avatar_circle(img, portrait, 60, 62, 22, fallback_color=handle_color, fallback_letter=author[:1].upper())
    d = ImageDraw.Draw(img)

    f_auth = fit_font(d, FONT_BOLD, author, cx2 - 92 - 40, 16, 12)
    f_cmt = fit_font(d, FONT_BOLD, comment, cx2 - 92 - 18, 19, 12)
    f_sub = get_font(FONT_REG, 13)
    d.text((92, 32), author, font=f_auth, fill=(85, 85, 95, 255))
    if verified:
        bbox = d.textbbox((92, 32), author, font=f_auth)
        vx = bbox[2] + 14
        vy = int((bbox[1] + bbox[3]) / 2) + 1
        draw_verified_badge(d, vx, vy, r=8)

    d.text((92, 57), comment, font=f_cmt, fill=(20, 20, 25, 255))
    d.text((92, 97), sub, font=f_sub, fill=(130, 130, 140, 255))

    # Vector heart + likes count on right (ZERO tofu!)
    like_bbox = d.textbbox((0, 0), likes, font=get_font(FONT_BOLD, 14))
    like_w = like_bbox[2] - like_bbox[0]
    lx = cx2 - 20 - like_w
    draw_heart(d, lx - 12, 104, size=14, fill=(254, 44, 85, 255))
    d.text((lx, 96), likes, font=get_font(FONT_BOLD, 14), fill=(254, 44, 85, 255))
    return img, [0, 0, SIZE, SIZE]


def make_polaroid_vintage():
    img = new_canvas()
    win = [34, 34, 478, 412]
    d = draw_frame_border(img, win, (245, 236, 216, 255), (210, 195, 168, 255), 3, 6)
    d.rectangle([206, 8, 306, 40], fill=(224, 206, 168, 205), outline=(196, 176, 138, 220))
    draw_centered_text(d, 256, 460, "Polaroid Vintage • 1998", get_font(FONT_HAND, 22), (74, 58, 42, 255))
    return img, win


def make_giang_sinh_len_am():
    img = new_canvas()
    win = [32, 32, 480, 480]
    d = draw_frame_border(img, win, (168, 28, 36, 255), (248, 236, 210, 255), 5, 22)
    for x in range(14, 500, 26):
        draw_snowflake_vec(d, x, 16, r=7, fill=(250, 240, 215, 220))
        draw_snowflake_vec(d, x, 496, r=7, fill=(250, 240, 215, 220))
    d.rounded_rectangle([140, 460, 372, 502], radius=14, fill=(22, 92, 56, 245), outline=(250, 238, 200, 255), width=2)
    draw_snowflake_vec(d, 160, 481, r=7, fill=(255, 245, 220, 255))
    draw_centered_text(d, 256, 481, "GIÁNG SINH LEN ẤM", get_font(FONT_BOLD, 16), (255, 245, 220, 255))
    draw_snowflake_vec(d, 352, 481, r=7, fill=(255, 245, 220, 255))
    return img, win


def make_soulmate():
    img = new_canvas()
    win = [28, 28, 484, 432]
    d = draw_frame_border(img, win, (28, 18, 26, 255), (244, 114, 182, 240), 4, 18)
    draw_heart(d, 134, 468, size=18, fill=(244, 114, 182, 255))
    draw_centered_text(d, 256, 468, "S O U L M A T E", get_font(FONT_SERIF, 24), (251, 207, 232, 255))
    draw_heart(d, 378, 468, size=18, fill=(244, 114, 182, 255))
    draw_centered_text(d, 256, 495, "destined together • 100%", get_font(FONT_REG, 13), (244, 114, 182, 220))
    return img, win


def make_love_postcard():
    img = new_canvas()
    win = [30, 30, 482, 424]
    d = draw_frame_border(img, win, (252, 247, 238, 255), (218, 62, 82, 230), 3, 10)
    colors = [(220, 48, 68, 240), (37, 99, 235, 240)]
    for i, x in enumerate(range(0, SIZE, 28)):
        d.rectangle([x, 0, x + 16, 12], fill=colors[i % 2])
        d.rectangle([x, SIZE - 12, x + 16, SIZE], fill=colors[(i + 1) % 2])
    draw_heart(d, 100, 456, size=16, fill=(220, 48, 68, 255))
    draw_centered_text(d, 256, 456, "LOVE POSTCARD • AIR MAIL", get_font(FONT_BOLD, 18), (190, 24, 65, 255))
    draw_heart(d, 412, 456, size=16, fill=(220, 48, 68, 255))
    draw_centered_text(d, 256, 482, "Sending all my heart to you", get_font(FONT_HAND, 15), (71, 85, 105, 255))
    return img, win


def make_giang_sinh_tuan_loc():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([108, 18, 404, 62], radius=20, fill=(136, 44, 24, 228), outline=(251, 191, 36, 255), width=3)
    draw_centered_text(d, 256, 40, "GIÁNG SINH TUẦN LỘC", get_font(FONT_BOLD, 17), (255, 248, 225, 255))
    for sx, sy in [(42, 46), (470, 52), (38, 458), (472, 448), (90, 95), (430, 102)]:
        draw_snowflake_vec(d, sx, sy, r=12, fill=(255, 255, 255, 225))
    return img, [0, 0, SIZE, SIZE]


def make_giang_sinh_selfie():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.line([0, 22, 128, 38, 256, 24, 384, 38, 512, 22], fill=(22, 101, 52, 240), width=4)
    bulbs = [(48, 28, (239, 68, 68, 255)), (118, 38, (250, 204, 21, 255)), (196, 30, (34, 197, 94, 255)),
             (316, 30, (239, 68, 68, 255)), (394, 38, (56, 189, 248, 255)), (464, 28, (250, 204, 21, 255))]
    for bx, by, bc in bulbs:
        d.ellipse([bx - 8, by - 4, bx + 8, by + 12], fill=bc)
    d.rounded_rectangle([120, 446, 392, 492], radius=22, fill=(185, 28, 28, 232), outline=(255, 255, 255, 240), width=2)
    draw_star(d, 142, 469, r=8, fill=(253, 224, 71, 255))
    draw_centered_text(d, 256, 469, "MERRY XMAS SELFIE", get_font(FONT_BOLD, 17), (255, 255, 255, 255))
    draw_star(d, 370, 469, r=8, fill=(253, 224, 71, 255))
    return img, [0, 0, SIZE, SIZE]


def make_ho_ho_ho():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([106, 20, 406, 76], radius=24, fill=(220, 38, 38, 235), outline=(255, 255, 255, 255), width=4)
    draw_snowflake_vec(d, 134, 48, r=10, fill=(255, 255, 255, 240))
    draw_centered_text(d, 256, 48, "HO HO HO!", get_font(FONT_BOLD, 24), (255, 255, 255, 255))
    draw_snowflake_vec(d, 378, 48, r=10, fill=(255, 255, 255, 240))
    d.rounded_rectangle([140, 456, 372, 494], radius=18, fill=(21, 128, 61, 230))
    draw_centered_text(d, 256, 475, "Ngoan Thì Có Quà Nhé!", get_font(FONT_BOLD, 15), (255, 255, 255, 255))
    return img, [0, 0, SIZE, SIZE]


def make_chung_minh_la_ban():
    img = new_canvas()
    win = [28, 28, 484, 424]
    d = draw_frame_border(img, win, (255, 241, 242, 255), (251, 113, 133, 255), 4, 20)
    d.rounded_rectangle([90, 444, 422, 492], radius=20, fill=(244, 63, 94, 255))
    draw_heart(d, 114, 468, size=16, fill=(253, 224, 71, 255))
    draw_centered_text(d, 256, 468, "CHÚNG MÌNH LÀ BẠN THÂN", get_font(FONT_BOLD, 17), (255, 255, 255, 255))
    draw_heart(d, 398, 468, size=16, fill=(253, 224, 71, 255))
    return img, win


def make_locket_camera():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    c = (255, 255, 255, 235)
    for (x, y, dx, dy) in [(26, 26, 36, 36), (486, 26, -36, 36), (26, 486, 36, -36), (486, 486, -36, -36)]:
        d.line([x, y, x + dx, y], fill=c, width=4)
        d.line([x, y, x, y + dy], fill=c, width=4)
    d.line([242, 256, 270, 256], fill=(255, 255, 255, 160), width=2)
    d.line([256, 242, 256, 270], fill=(255, 255, 255, 160), width=2)
    d.ellipse([44, 42, 60, 58], fill=(239, 68, 68, 255))
    d.text((68, 39), "REC  •  LOCKET CAM", font=get_font(FONT_MONO, 16), fill=(255, 255, 255, 245), stroke_fill=(0, 0, 0, 200), stroke_width=2)
    d.text((340, 39), "ISO 400  f/1.8", font=get_font(FONT_MONO, 14), fill=(250, 204, 21, 245), stroke_fill=(0, 0, 0, 200), stroke_width=2)
    d.text((44, 464), "24mm WIDE  [AF-C]", font=get_font(FONT_MONO, 14), fill=c, stroke_fill=(0, 0, 0, 200), stroke_width=2)
    d.text((394, 464), "BAT [III] 100%", font=get_font(FONT_MONO, 14), fill=(74, 222, 128, 255), stroke_fill=(0, 0, 0, 200), stroke_width=2)
    return img, [0, 0, SIZE, SIZE]


def make_spotify(theme="dark"):
    img = new_canvas()
    win = [46, 44, 466, 368]
    if theme == "dark":
        bg = (18, 18, 18, 255)
        card = (32, 32, 36, 255)
        accent = (30, 215, 96, 255)
        fg = (255, 255, 255, 255)
        sub = (179, 179, 179, 255)
        title = "LOCKET VIBES • PLAYLIST"
        song = "ilysm (feat. you)"
    else:
        bg = (253, 226, 238, 255)
        card = (251, 207, 232, 255)
        accent = (236, 72, 153, 255)
        fg = (80, 15, 48, 255)
        sub = (157, 23, 77, 255)
        title = "SPOTIFY HỒNG • LOVELY MIX"
        song = "crush on you"
    d = draw_frame_border(img, win, bg, accent, 3, 14)
    for i, col in enumerate([(239, 68, 68, 255), (250, 204, 21, 255), (34, 197, 94, 255)]):
        d.ellipse([22 + i * 20, 14, 34 + i * 20, 26], fill=col)
    d.text((100, 12), title, font=get_font(FONT_BOLD, 14), fill=sub)
    d.rounded_rectangle([24, 380, 488, 496], radius=16, fill=card)
    d.text((42, 392), song, font=get_font(FONT_BOLD, 20), fill=fg)
    if theme == "pink":
        draw_heart(d, 196, 404, size=16, fill=accent)
    d.text((42, 420), "Now Playing • Locket Radio", font=get_font(FONT_REG, 14), fill=sub)
    d.rounded_rectangle([42, 452, 400, 458], radius=3, fill=(120, 120, 130, 130))
    d.rounded_rectangle([42, 452, 290, 458], radius=3, fill=accent)
    d.ellipse([284, 449, 296, 461], fill=fg)
    d.text((42, 466), "1:27", font=get_font(FONT_MONO, 12), fill=sub)
    d.text((370, 466), "2:07", font=get_font(FONT_MONO, 12), fill=sub)
    d.ellipse([424, 404, 474, 454], fill=accent)
    draw_play_triangle(d, 450, 429, size=20, fill=(255, 255, 255, 255) if theme == "pink" else (18, 18, 18, 255))
    return img, win


def make_fuji_film():
    img = new_canvas()
    win = [44, 24, 468, 488]
    d = draw_frame_border(img, win, (16, 18, 18, 255), (34, 197, 94, 230), 2, 4)
    for y in range(18, SIZE - 20, 40):
        d.rounded_rectangle([10, y, 30, y + 22], radius=4, fill=(245, 245, 245, 230))
        d.rounded_rectangle([482, y, 502, y + 22], radius=4, fill=(245, 245, 245, 230))
    d.text((54, 4), "FUJIFILM SUPERIA 400   •   27 EXP   •   FRAME 24A", font=get_font(FONT_MONO, 13), fill=(74, 222, 128, 255))
    d.text((320, 492), "'26 11 27  10:40", font=get_font(FONT_MONO, 14), fill=(251, 146, 60, 255))
    return img, win


def make_gay_meter():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([44, 376, 468, 488], radius=20, fill=(20, 20, 28, 235), outline=(255, 255, 255, 225), width=2)
    draw_centered_text(d, 256, 404, "GAY METER RANDOM", get_font(FONT_BOLD, 18), (255, 255, 255, 255))
    cols = [(239, 68, 68, 255), (249, 115, 22, 255), (250, 204, 21, 255), (34, 197, 94, 255), (59, 130, 246, 255), (168, 85, 247, 255)]
    bw = 380 // len(cols)
    for i, c in enumerate(cols):
        d.rectangle([66 + i * bw, 428, 66 + (i + 1) * bw, 448], fill=c)
    draw_centered_text(d, 256, 468, "KẾT QUẢ: 100% CHÍNH HIỆU", get_font(FONT_BOLD, 15), (253, 224, 71, 255))
    return img, [0, 0, SIZE, SIZE]


def make_chua_som():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([64, 386, 448, 482], radius=24, fill=(15, 23, 42, 232), outline=(99, 102, 241, 255), width=3)
    # Vector crescent moon
    d.ellipse([104, 406, 128, 430], fill=(253, 224, 71, 255))
    d.ellipse([112, 404, 134, 426], fill=(15, 23, 42, 255))
    draw_centered_text(d, 266, 418, "CHƯA SỚM ĐÂU!", get_font(FONT_BOLD, 22), (165, 180, 252, 255))
    draw_centered_text(d, 256, 454, "Giờ này còn thức làm gì vậy bro?", get_font(FONT_REG, 15), (226, 232, 240, 255))
    return img, [0, 0, SIZE, SIZE]


def make_bang_tin_khan():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([24, 24, 134, 58], radius=8, fill=(220, 38, 38, 245))
    d.ellipse([34, 35, 44, 45], fill=(255, 255, 255, 255))
    draw_centered_text(d, 86, 41, "TRỰC TIẾP", get_font(FONT_BOLD, 14), (255, 255, 255, 255))
    d.rectangle([0, 396, SIZE, 434], fill=(220, 38, 38, 245))
    d.rectangle([0, 434, SIZE, 492], fill=(250, 204, 21, 245))
    draw_centered_text(d, 256, 415, "BẢNG TIN KHẨN CẤP 24H", get_font(FONT_BOLD, 19), (255, 255, 255, 255))
    sub_b = "Phát hiện một người quá xinh đẹp đang lướt Locket!"
    draw_centered_text(d, 256, 462, sub_b, fit_font(d, FONT_BOLD, sub_b, 480, 16, 12), (17, 24, 39, 255))
    return img, [0, 0, SIZE, SIZE]


def make_ve_gui_xe():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([40, 366, 472, 492], radius=10, fill=(254, 240, 138, 244), outline=(225, 29, 72, 245), width=3)
    draw_centered_text(d, 256, 392, "VÉ TRÔNG GIỮ XE  •  SỐ 0079", get_font(FONT_BOLD, 18), (190, 18, 60, 255))
    d.line([58, 414, 454, 414], fill=(225, 29, 72, 180), width=2)
    t_ve = "Biển số: TRÁI TIM BẠN   |   Giá: 5.000đ"
    t_luu = "Lưu ý: Mất vé đền bằng nụ cười"
    draw_centered_text(d, 256, 438, t_ve, fit_font(d, FONT_BOLD, t_ve, 400, 15, 11), (30, 41, 59, 255))
    draw_centered_text(d, 248, 468, t_luu, fit_font(d, FONT_REG, t_luu, 380, 14, 11), (88, 28, 135, 255))
    draw_heart(d, 364, 468, size=14, fill=(225, 29, 72, 255))
    return img, [0, 0, SIZE, SIZE]


def make_vo_hoc_sinh():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, SIZE, 88], fill=(254, 252, 243, 242))
    d.line([0, 88, SIZE, 88], fill=(239, 68, 68, 230), width=3)
    d.line([62, 0, 62, 88], fill=(239, 68, 68, 200), width=2)
    for ly in [28, 56]:
        d.line([0, ly, SIZE, ly], fill=(147, 197, 253, 180), width=1)
    t1 = "VỞ HỌC SINH  •  Tiến Bộ Mỗi Ngày"
    t2 = "Họ & Tên: ..............................   Lớp: 12A1"
    d.text((76, 12), t1, font=fit_font(d, FONT_BOLD, t1, 420, 17, 12), fill=(30, 58, 138, 255))
    d.text((76, 40), t2, font=fit_font(d, FONT_HAND, t2, 420, 15, 11), fill=(37, 99, 235, 255))
    return img, [0, 0, SIZE, SIZE]


def make_giao_vien_cham_bai():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([240, 22, 488, 142], radius=16, fill=(255, 255, 255, 236), outline=(220, 38, 38, 245), width=4)
    draw_centered_text(d, 364, 58, "10 / 10", get_font(FONT_SERIF, 32), (220, 38, 38, 255))
    draw_centered_text(d, 364, 96, "GIÁO VIÊN CHẤM BÀI", get_font(FONT_BOLD, 13), (185, 28, 28, 255))
    draw_centered_text(d, 356, 120, "Lời phê: Đẹp xuất sắc!", get_font(FONT_HAND, 14), (220, 38, 38, 255))
    draw_star(d, 464, 120, r=8, fill=(220, 38, 38, 255))
    return img, [0, 0, SIZE, SIZE]


def make_nhiem_vu_hom_nay():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    x1, y1, x2, y2 = 34, 356, 478, 490
    d.rounded_rectangle([x1 + 2, y1 + 4, x2 + 2, y2 + 4], radius=16, fill=(0, 0, 0, 100))
    d.rounded_rectangle([x1, y1, x2, y2], radius=16, fill=(15, 23, 42, 235), outline=(56, 189, 248, 255), width=2)
    d.rounded_rectangle([x1, y1, x2, y1 + 38], radius=14, fill=(29, 78, 216, 255))
    d.rectangle([x1, y1 + 20, x2, y1 + 38], fill=(29, 78, 216, 255))
    draw_centered_text(d, 256, y1 + 19, "NHIỆM VỤ HÔM NAY", get_font(FONT_BOLD, 16), (255, 255, 255, 255))
    draw_checkbox(d, 72, y1 + 50, box_sz=18)
    t_n1 = "Cười thật tươi (Hoàn thành)"
    t_n2 = "Đăng 1 tấm Locket xinh xỉu (+999 EXP)"
    d.text((100, y1 + 49), t_n1, font=fit_font(d, FONT_BOLD, t_n1, 360, 16, 12), fill=(74, 222, 128, 255))
    draw_checkbox(d, 72, y1 + 82, box_sz=18)
    d.text((100, y1 + 81), t_n2, font=fit_font(d, FONT_BOLD, t_n2, 360, 15, 11), fill=(250, 204, 21, 255))
    return img, [0, 0, SIZE, SIZE]


def make_hoa_don_di_choi():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([54, 344, 458, 494], radius=8, fill=(250, 250, 249, 244), outline=(100, 116, 139, 220), width=2)
    draw_centered_text(d, 256, 368, "HÓA ĐƠN ĐI CHƠI", get_font(FONT_MONO, 18), (15, 23, 42, 255))
    d.text((74, 390), "----------------------------------------", font=fit_font(d, FONT_MONO, "----------------------------------------", 364, 14, 10), fill=(100, 116, 139, 255))
    l1 = "1x Trà Sữa + Nói Xấu Thiên Hạ   FREE"
    l2 = "1x Kỷ Niệm Vui Quá Trời   PRICELESS"
    l3 = "TỔNG CỘNG: HẾT TIỀN VỀ NHÀ :("
    d.text((72, 410), l1, font=fit_font(d, FONT_MONO, l1, 368, 14, 11), fill=(30, 41, 59, 255))
    d.text((72, 434), l2, font=fit_font(d, FONT_MONO, l2, 368, 14, 11), fill=(30, 41, 59, 255))
    d.text((72, 460), l3, font=fit_font(d, FONT_MONO, l3, 368, 15, 11), fill=(220, 38, 38, 255))
    return img, [0, 0, SIZE, SIZE]


def make_mood_banner(top_text, sub_text, bg_col, border_col):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([32, 386, 480, 486], radius=22, fill=bg_col, outline=border_col, width=3)
    draw_centered_text(d, 256, 422, top_text, fit_font(d, FONT_BOLD, top_text, 420, 18, 12), (255, 255, 255, 255))
    draw_centered_text(d, 256, 458, sub_text, fit_font(d, FONT_REG, sub_text, 424, 14, 11), (253, 224, 71, 255))
    return img, [0, 0, SIZE, SIZE]


def make_meo_meme(cat_portrait=None):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([36, 390, 476, 486], radius=24, fill=(180, 83, 9, 236), outline=(254, 240, 138, 255), width=3)
    draw_avatar_circle(img, cat_portrait, 84, 438, 32, fallback_color=(217, 119, 6, 255), fallback_letter="M", outline=(254, 240, 138, 255))
    d = ImageDraw.Draw(img)
    t_cat = "RẠP XIẾC TRUNG ƯƠNG • MÈO MEME"
    s_cat = "Meo meo... nhìn gì mà nhìn dữ vậy?"
    d.text((128, 412), t_cat, font=fit_font(d, FONT_BOLD, t_cat, 332, 16, 12), fill=(255, 255, 255, 255))
    d.text((128, 444), s_cat, font=fit_font(d, FONT_HAND, s_cat, 332, 15, 11), fill=(254, 240, 138, 255))
    return img, [0, 0, SIZE, SIZE]


def make_faker(faker_portrait=None):
    img = new_canvas()
    win = [20, 20, 492, 438]
    d = draw_frame_border(img, win, (17, 17, 21, 255), (220, 38, 38, 255), 5, 14)
    d.rectangle([20, 444, 492, 496], fill=(153, 27, 27, 255))
    draw_avatar_circle(img, faker_portrait, 56, 470, 22, fallback_color=(185, 28, 28, 255), fallback_letter="F", outline=(253, 224, 71, 255))
    d = ImageDraw.Draw(img)
    draw_centered_text(d, 274, 470, "SHHH... FAKER • T1 MVP", get_font(FONT_BOLD, 20), (253, 224, 71, 255))
    return img, win


def make_hai_trai_cay():
    img = new_canvas()
    win = [24, 24, 488, 440]
    d = draw_frame_border(img, win, (254, 249, 195, 255), (22, 163, 74, 255), 5, 20)
    d.rounded_rectangle([88, 448, 424, 494], radius=18, fill=(22, 163, 74, 255))
    draw_centered_text(d, 256, 471, "HÁI TRÁI CÂY CHILL CHILL", get_font(FONT_BOLD, 17), (255, 255, 255, 255))
    return img, win


def make_mona_lisa(mona_portrait=None):
    img = new_canvas()
    win = [48, 48, 464, 424]
    d = draw_frame_border(img, win, (146, 102, 34, 255), (250, 204, 21, 255), 8, 6)
    d.rectangle([16, 16, 496, 496], outline=(217, 166, 62, 255), width=6)
    d.rounded_rectangle([114, 444, 404, 490], radius=8, fill=(217, 166, 62, 255), outline=(92, 60, 12, 255), width=2)
    draw_avatar_circle(img, mona_portrait, 140, 467, 18, fallback_color=(120, 80, 20, 255), fallback_letter="M", outline=(92, 60, 12, 255))
    d = ImageDraw.Draw(img)
    draw_centered_text(d, 276, 467, "MONA LISA • LOUVRE 1503", get_font(FONT_SERIF, 15), (45, 28, 6, 255))
    return img, win


# =========================================================================
# 36 Dedicated 128x128 Preview Icons (Realistic UI/Character Icons)
# =========================================================================
def save_v2_icon_card(out_path, bg1, bg2, title, sub="", badge=None, portrait=None, verified=False, extra_fn=None):
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 255))
    d = ImageDraw.Draw(im)
    for y in range(128):
        t = y / 127.0
        r = int(bg1[0] * (1 - t) + bg2[0] * t)
        g = int(bg1[1] * (1 - t) + bg2[1] * t)
        b = int(bg1[2] * (1 - t) + bg2[2] * t)
        d.line([0, y, 128, y], fill=(r, g, b, 255))

    if portrait is not None:
        sq = crop_square_top(portrait, 84)
        mask = Image.new("L", (84, 84), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, 83, 83], fill=255)
        im.paste(sq, (22, 8), mask)
        d.ellipse([22, 8, 106, 92], outline=(255, 255, 255, 225), width=3)
        if verified:
            draw_verified_badge(d, 96, 80, r=10)
    elif extra_fn:
        extra_fn(im, d)

    if badge:
        d.rounded_rectangle([14, 14, 114, 42], radius=10, fill=(255, 255, 255, 45), outline=(255, 255, 255, 160), width=1)
        draw_centered_text(d, 64, 28, badge, get_font(FONT_BOLD, 12), (255, 255, 255, 255))

    # Bottom caption pill
    d.rounded_rectangle([8, 94, 120, 120], radius=8, fill=(0, 0, 0, 165))
    draw_centered_text(d, 64, 107, title, get_font(FONT_BOLD, 12), (255, 255, 255, 255))
    d.rounded_rectangle([2, 2, 126, 126], radius=24, outline=(255, 255, 255, 160), width=3)
    im.save(out_path, "PNG")


def icon_comment_card(out_path, bg1, bg2, title, bubble_text, portrait=None, verified=True):
    def _extra(im, d):
        d.rounded_rectangle([12, 20, 116, 82], radius=14, fill=(255, 255, 255, 240))
        d.text((20, 56), bubble_text, font=get_font(FONT_BOLD, 12), fill=(25, 25, 30, 255))
    if portrait is not None:
        save_v2_icon_card(out_path, bg1, bg2, title, portrait=portrait, verified=verified)
    else:
        save_v2_icon_card(out_path, bg1, bg2, title, extra_fn=_extra)


def make_lut_icon(out_path, c1, c2, emoji_text, badge_text):
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 255))
    d = ImageDraw.Draw(im)
    for y in range(128):
        t = y / 127.0
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        d.line([0, y, 128, y], fill=(r, g, b, 255))
    d.rounded_rectangle([4, 4, 124, 124], radius=28, outline=(255, 255, 255, 190), width=4)
    draw_centered_text(d, 64, 48, badge_text, get_font(FONT_BOLD, 28), (255, 255, 255, 255))
    draw_centered_text(d, 64, 92, emoji_text, get_font(FONT_BOLD, 16), (255, 248, 220, 240))
    im.save(out_path, "PNG")


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    os.makedirs(V2_DIR, exist_ok=True)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as mf:
        manifest = json.load(mf)

    print("Downloading real Wikimedia portraits...")
    cat_url = resolve_cat_url()
    portraits = {
        "sontung": fetch_portrait(PORTRAIT_URLS["sontung"]),
        "ronaldo": fetch_portrait(PORTRAIT_URLS["ronaldo"]),
        "faker": fetch_portrait(PORTRAIT_URLS["faker"]),
        "monalisa": fetch_portrait(PORTRAIT_URLS["monalisa"]),
        "cat": fetch_portrait(cat_url),
    }
    print("Portrait status:", {k: (v.size if v else "MISSING") for k, v in portraits.items()})

    specs = {
        "nm_polaroid_vintage": make_polaroid_vintage,
        "nm_giang_sinh_len_am": make_giang_sinh_len_am,
        "nm_soulmate": make_soulmate,
        "nm_love_postcard": make_love_postcard,
        "nm_giang_sinh_tuan_loc": make_giang_sinh_tuan_loc,
        "nm_giang_sinh_selfie": make_giang_sinh_selfie,
        "nm_ho_ho_ho": make_ho_ho_ho,
        "nm_chung_minh_la_ban": make_chung_minh_la_ban,
        "nm_son_tung_mtp": lambda: make_comment_card("Sơn Tùng M-TP", True, "Flop quá thì cứ ghi tên anh vào", "23.6K", portrait=portraits["sontung"]),
        "nm_ronaldo_siuuu": lambda: make_comment_card("Cristiano Ronaldo", True, "SIUUUUU! Đỉnh quá bro ơi!", "999K", (220, 38, 38, 255), portrait=portraits["ronaldo"]),
        "nm_phai_luon_tu_te": lambda: make_comment_card("Cư Dân Mạng", False, "Phải luôn tử tế với nhau nhé!", "42.5K", (16, 185, 129, 255)),
        "nm_chi_can_mot_vet_xuoc": lambda: make_comment_card("Cư Dân Mạng", False, "Chỉ cần một vết xước thôi là tới chuyện", "18.2K", (245, 158, 11, 255)),
        "nm_trend_tic_toc": lambda: make_comment_card("Tíc Tóc Trending", True, "Lên xu hướng rồi, thả tim lẹ nào!", "128K", (14, 165, 233, 255)),
        "nm_ai_cho_xinh_vay": lambda: make_comment_card("Cư Dân Mạng", False, "Ủa ai cho xinh đẹp quá vậy trời??", "56.4K", (236, 72, 153, 255)),
        "nm_tam_cuoi_dang_dang": lambda: make_comment_card("Cư Dân Mạng", False, "Chụp 100 tấm được đúng tấm cuối đáng đăng", "31.9K", (124, 58, 237, 255)),
        "nm_locket_camera": make_locket_camera,
        "nm_spotify_pc": lambda: make_spotify("dark"),
        "nm_spotify_hong": lambda: make_spotify("pink"),
        "nm_fuji_film": make_fuji_film,
        "nm_gay_meter": make_gay_meter,
        "nm_chua_som": make_chua_som,
        "nm_bang_tin_khan": make_bang_tin_khan,
        "nm_ve_gui_xe": make_ve_gui_xe,
        "nm_vo_hoc_sinh": make_vo_hoc_sinh,
        "nm_giao_vien_cham_bai": make_giao_vien_cham_bai,
        "nm_nhiem_vu_hom_nay": make_nhiem_vu_hom_nay,
        "nm_hoa_don_di_choi": make_hoa_don_di_choi,
        "nm_khong_can_ai_duyet": lambda: make_mood_banner("KHÔNG CẦN AI DUYỆT", "Thích thì đăng, ai nói gì kệ họ!", (30, 41, 59, 232), (56, 189, 248, 255)),
        "nm_ban_la_gi": lambda: make_mood_banner("BẠN LÀ GÌ?", "Mà sao vừa bước qua đã làm tim rung động?", (157, 23, 77, 232), (249, 168, 212, 255)),
        "nm_ong_troi_that_bat_cong": lambda: make_mood_banner("ÔNG TRỜI THẬT BẤT CÔNG", "Sao lại chia đều nhan sắc hết cho một người vậy?", (88, 28, 135, 232), (192, 132, 252, 255)),
        "nm_yeu_giau_chu_co_phai": lambda: make_mood_banner("YÊU GIẤU CHỨ CÓ PHẢI GIẤU YÊU ĐÂU", "Thương âm thầm mà sao mặt cứ lộ hết trơn", (190, 18, 60, 232), (253, 164, 175, 255)),
        "nm_me_con_em_don_anh_ve": lambda: make_mood_banner("MẸ CON EM ĐÓN ANH VỀ", "Đi đâu cũng nhớ lối về với mẹ con em nhé!", (180, 83, 9, 236), (253, 224, 71, 255)),
        "nm_meo_meme": lambda: make_meo_meme(portraits["cat"]),
        "nm_hai_trai_cay": make_hai_trai_cay,
    }

    manifest.pop("nm_faker", None)
    manifest.pop("nm_mona_lisa", None)

    for fid, fn in specs.items():
        img, win = fn()
        img_rgb = img.convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        png_path = os.path.join(FRAMES_DIR, f"{fid}.png")
        bin_path = os.path.join(BINS_DIR, f"{fid}.bin")
        img_rgb.save(png_path, "PNG")
        with open(bin_path, "wb") as bf:
            bf.write(zlib.compress(img_rgb.tobytes(), level=9))
        manifest[fid] = {"is4Cut": False, "windows": [win]}

    with open(MANIFEST_PATH, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, separators=(",", ":"))

    # Generate crisp 128x128 preview icons in assets/filters_v2/ for ALL 36 nm_ frames!
    icon_comment_card(os.path.join(V2_DIR, "nm_son_tung_mtp.png"), (225, 29, 72), (17, 24, 39), "Sơn Tùng MTP", "Flop quá thì...", portrait=portraits["sontung"])
    icon_comment_card(os.path.join(V2_DIR, "nm_ronaldo_siuuu.png"), (185, 28, 28), (245, 158, 11), "Ronaldo SIUUU", "SIUUUUU!", portrait=portraits["ronaldo"])
    save_v2_icon_card(os.path.join(V2_DIR, "nm_faker.png"), (153, 27, 27), (17, 17, 21), "Faker • T1", portrait=portraits["faker"])
    save_v2_icon_card(os.path.join(V2_DIR, "nm_mona_lisa.png"), (146, 102, 34), (69, 44, 12), "Mona Lisa", portrait=portraits["monalisa"])
    save_v2_icon_card(os.path.join(V2_DIR, "nm_meo_meme.png"), (217, 119, 6), (120, 53, 15), "Mèo Meme", portrait=portraits["cat"])

    def _draw_tiktok_icon(im, d):
        draw_tiktok_logo(d, 64, 48, 28)

    def _draw_comment_bubble_icon(im, d):
        d.rounded_rectangle([14, 20, 114, 78], radius=14, fill=(255, 255, 255, 235))
        d.circle((34, 42), 10, fill=(244, 63, 94, 255)) if hasattr(d, "circle") else d.ellipse([24, 32, 44, 52], fill=(244, 63, 94, 255))
        d.line([52, 38, 102, 38], fill=(100, 116, 139, 255), width=4)
        d.line([52, 54, 94, 54], fill=(15, 23, 42, 255), width=5)

    def _draw_spotify_icon(accent):
        def _fn(im, d):
            d.rounded_rectangle([16, 18, 112, 86], radius=12, fill=(255, 255, 255, 28), outline=accent, width=2)
            d.ellipse([44, 28, 84, 68], fill=accent)
            draw_play_triangle(d, 65, 48, size=18, fill=(255, 255, 255, 255))
        return _fn

    def _draw_rainbow_icon(im, d):
        cols = [(239, 68, 68, 255), (249, 115, 22, 255), (250, 204, 21, 255), (34, 197, 94, 255), (59, 130, 246, 255), (168, 85, 247, 255)]
        for i, c in enumerate(cols):
            d.rectangle([16 + i * 16, 28, 32 + i * 16, 74], fill=c)

    def _draw_heart_icon(im, d):
        draw_heart(d, 64, 48, size=52, fill=(251, 113, 133, 255))

    def _draw_snow_icon(im, d):
        draw_snowflake_vec(d, 64, 48, r=24, fill=(255, 255, 255, 245))

    save_v2_icon_card(os.path.join(V2_DIR, "nm_phai_luon_tu_te.png"), (16, 185, 129), (6, 95, 70), "Luôn Tử Tế", extra_fn=_draw_comment_bubble_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_chi_can_mot_vet_xuoc.png"), (245, 158, 11), (120, 53, 15), "Một Vết Xước", extra_fn=_draw_comment_bubble_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_trend_tic_toc.png"), (15, 23, 42), (30, 41, 59), "Trend Tíc Tóc", extra_fn=_draw_tiktok_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_ai_cho_xinh_vay.png"), (236, 72, 153), (157, 23, 77), "Ai Cho Xinh?", extra_fn=_draw_heart_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_tam_cuoi_dang_dang.png"), (124, 58, 237), (76, 29, 149), "Tấm Cuối", extra_fn=_draw_comment_bubble_icon)

    save_v2_icon_card(os.path.join(V2_DIR, "nm_spotify_pc.png"), (18, 18, 18), (30, 41, 35), "Spotify PC", extra_fn=_draw_spotify_icon((30, 215, 96, 255)))
    save_v2_icon_card(os.path.join(V2_DIR, "nm_spotify_hong.png"), (244, 114, 182), (190, 24, 93), "Spotify Hồng", extra_fn=_draw_spotify_icon((255, 255, 255, 235)))
    save_v2_icon_card(os.path.join(V2_DIR, "nm_locket_camera.png"), (31, 41, 55), (17, 24, 39), "Locket Cam", badge="REC • 4K")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_fuji_film.png"), (16, 24, 18), (22, 101, 52), "Fuji Film", badge="400 EXP")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_polaroid_vintage.png"), (214, 196, 165), (154, 123, 86), "Polaroid '98", badge="INSTANT")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_soulmate.png"), (49, 18, 38), (157, 23, 77), "Soulmate", extra_fn=_draw_heart_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_love_postcard.png"), (220, 38, 38), (37, 99, 235), "Postcard", extra_fn=_draw_heart_icon)

    save_v2_icon_card(os.path.join(V2_DIR, "nm_giang_sinh_len_am.png"), (168, 28, 36), (22, 101, 52), "Len Ấm", extra_fn=_draw_snow_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_giang_sinh_tuan_loc.png"), (136, 44, 24), (180, 83, 9), "Tuần Lộc", extra_fn=_draw_snow_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_giang_sinh_selfie.png"), (185, 28, 28), (127, 29, 29), "Xmas Selfie", badge="MERRY")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_ho_ho_ho.png"), (220, 38, 38), (21, 128, 61), "Ho Ho Ho!", badge="SANTA")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_chung_minh_la_ban.png"), (244, 63, 94), (190, 18, 60), "Bạn Thân", extra_fn=_draw_heart_icon)

    save_v2_icon_card(os.path.join(V2_DIR, "nm_gay_meter.png"), (30, 41, 59), (15, 23, 42), "Gay Meter", extra_fn=_draw_rainbow_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_chua_som.png"), (30, 27, 75), (15, 23, 42), "Chưa Sớm", badge="02:00 AM")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_bang_tin_khan.png"), (220, 38, 38), (202, 138, 4), "Bảng Tin Khẩn", badge="TRỰC TIẾP")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_ve_gui_xe.png"), (217, 119, 6), (225, 29, 72), "Vé Gửi Xe", badge="SỐ 0079")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_vo_hoc_sinh.png"), (37, 99, 235), (30, 58, 138), "Vở Học Sinh", badge="12A1")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_giao_vien_cham_bai.png"), (220, 38, 38), (153, 27, 27), "Chấm Bài", badge="10 / 10")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_nhiem_vu_hom_nay.png"), (29, 78, 216), (15, 23, 42), "Nhiệm Vụ", badge="+999 EXP")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_hoa_don_di_choi.png"), (71, 85, 105), (30, 41, 59), "Hóa Đơn", badge="TOTAL: 0đ")

    save_v2_icon_card(os.path.join(V2_DIR, "nm_khong_can_ai_duyet.png"), (30, 41, 59), (14, 165, 233), "Ko Cần Duyệt", badge="MOOD")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_ban_la_gi.png"), (157, 23, 77), (236, 72, 153), "Bạn Là Gì?", extra_fn=_draw_heart_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_ong_troi_that_bat_cong.png"), (88, 28, 135), (126, 34, 206), "Ông Trời...", badge="BẤT CÔNG")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_yeu_giau_chu_co_phai.png"), (190, 18, 60), (244, 63, 94), "Yêu Giấu", extra_fn=_draw_heart_icon)
    save_v2_icon_card(os.path.join(V2_DIR, "nm_me_con_em_don_anh_ve.png"), (180, 83, 9), (217, 119, 6), "Đón Anh Về", badge="VỀ THÔI")
    save_v2_icon_card(os.path.join(V2_DIR, "nm_hai_trai_cay.png"), (22, 163, 74), (202, 138, 4), "Hái Trái Cây", badge="CHILL")

    # 4 LUT icons in assets/filters_v2/
    make_lut_icon(os.path.join(V2_DIR, "nm_nau_co_dien.png"), (120, 68, 30), (214, 158, 92), "Nâu Cổ Điển", "LUT")
    make_lut_icon(os.path.join(V2_DIR, "nm_dem_xanh.png"), (15, 23, 42), (37, 99, 235), "Đêm Xanh", "NIT")
    make_lut_icon(os.path.join(V2_DIR, "nm_film_35mm.png"), (180, 83, 9), (251, 191, 36), "Film 35mm", "35MM")
    make_lut_icon(os.path.join(V2_DIR, "nm_xam_matte.png"), (51, 65, 85), (148, 163, 184), "Xám Matte", "B&M")

    print(f"Generated {len(specs)} NM frames + 40 v2 icons (zero tofu). Total manifest frames: {len(manifest)}")


if __name__ == "__main__":
    main()
