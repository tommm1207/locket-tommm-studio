"""Generate 63 distinct, easy-to-recognize 128x128 PNG filter icons in assets/filters_v2."""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"D:\Locket_Gold_Tommm")
ICON_DIR = ROOT / "assets" / "filters_v2"
ICON_DIR.mkdir(parents=True, exist_ok=True)

FONT_BOLD = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 34)
FONT_SMALL = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 26)
FONT_XS = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 21)
FONT_EMOJI = ImageFont.truetype(r"C:\Windows\Fonts\seguiemj.ttf", 118)
FONT_EMOJI_SM = ImageFont.truetype(r"C:\Windows\Fonts\seguiemj.ttf", 64)


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp_rgb(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def make_circle_base(c0_hex, c1_hex, size=256):
    c0 = hex_to_rgb(c0_hex)
    c1 = hex_to_rgb(c1_hex)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    cx = cy = (size - 1) / 2.0
    outer_r = size * 0.475
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy)
            if d <= outer_r + 1.5:
                t = (x / size) * 0.4 + (y / size) * 0.6
                col = lerp_rgb(c0, c1, t)
                # Subtle top-left specular highlight
                hi = max(0.0, 1.0 - math.hypot(x - size * 0.34, y - size * 0.28) / (size * 0.55)) * 0.22
                col = tuple(min(255, int(ch + 255 * hi)) for ch in col)
                alpha = 255 if d <= outer_r - 1.0 else int(max(0, min(255, (outer_r + 1.5 - d) * 102)))
                px[x, y] = (*col, alpha)
    draw = ImageDraw.Draw(img)
    draw.ellipse(
        [cx - outer_r + 5, cy - outer_r + 5, cx + outer_r - 5, cy + outer_r - 5],
        outline=(255, 255, 255, 130),
        width=5,
    )
    return img


def draw_centered_text(draw, text, cx, cy, font, fill=(255, 255, 255, 255), shadow=(0, 0, 0, 160), embedded_color=False):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2.0 - bbox[0]
    ty = cy - th / 2.0 - bbox[1]
    if embedded_color:
        draw.text((tx, ty), text, font=font, embedded_color=True)
    else:
        if shadow:
            draw.text((tx + 2, ty + 2), text, font=font, fill=shadow)
        draw.text((tx, ty), text, font=font, fill=fill)


def draw_pill_label(draw, text, cx=128, cy=205, bg=(15, 23, 42, 200), fg=(255, 255, 255, 255)):
    if len(text) >= 10:
        f = FONT_XS
    elif len(text) > 5:
        f = FONT_SMALL
    else:
        f = FONT_BOLD
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 14, 7
    draw.rounded_rectangle(
        [cx - tw / 2 - pad_x, cy - th / 2 - pad_y, cx + tw / 2 + pad_x, cy + th / 2 + pad_y],
        radius=16,
        fill=bg,
        outline=(255, 255, 255, 110),
        width=2,
    )
    draw_centered_text(draw, text, cx, cy, f, fill=fg, shadow=None)


def paste_centered_emoji(img, emoji, cx, cy, font):
    tmp = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text((80, 80), emoji, font=font, embedded_color=True)
    bbox = tmp.getbbox()
    if not bbox:
        return
    crop = tmp.crop(bbox)
    ox = int(cx - crop.width / 2)
    oy = int(cy - crop.height / 2)
    img.alpha_composite(crop, (ox, oy))


def draw_emoji_icon(c0, c1, emoji, badge=None, sub_emoji=None):
    img = make_circle_base(c0, c1)
    cy = 108 if badge else 128
    paste_centered_emoji(img, emoji, 128, cy, FONT_EMOJI)
    if sub_emoji:
        paste_centered_emoji(img, sub_emoji, 178, 162, FONT_EMOJI_SM)
    if badge:
        d = ImageDraw.Draw(img)
        draw_pill_label(d, badge, cx=128, cy=204)
    return img


def draw_warp_icon(kind, c0, c1):
    img = make_circle_base(c0, c1)
    d = ImageDraw.Draw(img)
    skin = (255, 224, 178, 255)
    stroke = (45, 25, 15, 245)
    eye_w = (255, 255, 255, 255)

    if kind == "warp_big_head":
        # Tiny body + giant head
        d.rounded_rectangle([96, 174, 160, 218], radius=16, fill=(59, 130, 246, 255), outline=stroke, width=4)
        d.ellipse([54, 42, 202, 184], fill=skin, outline=stroke, width=6)
        d.ellipse([90, 96, 108, 114], fill=stroke)
        d.ellipse([148, 96, 166, 114], fill=stroke)
        d.arc([102, 126, 154, 156], 15, 165, fill=stroke, width=6)
    elif kind == "warp_tiny_face":
        # Huge head + tiny squished center features
        d.ellipse([48, 46, 208, 206], fill=skin, outline=stroke, width=6)
        d.ellipse([114, 118, 122, 126], fill=stroke)
        d.ellipse([134, 118, 142, 126], fill=stroke)
        d.arc([118, 130, 138, 142], 10, 170, fill=stroke, width=4)
    elif kind == "warp_alien_vline":
        # Long V-line chin + glowing big almond eyes
        d.polygon([(64, 88), (82, 48), (174, 48), (192, 88), (168, 160), (128, 212), (88, 160)], fill=(163, 230, 53, 255), outline=stroke, width=6)
        d.ellipse([78, 92, 118, 132], fill=(15, 23, 42, 255))
        d.ellipse([138, 92, 178, 132], fill=(15, 23, 42, 255))
        d.ellipse([86, 100, 98, 112], fill=eye_w)
        d.ellipse([146, 100, 158, 112], fill=eye_w)
        d.line([(118, 172), (138, 172)], fill=stroke, width=5)
    elif kind == "warp_hamster":
        # Puffed rosy hamster cheeks
        d.ellipse([60, 54, 196, 186], fill=skin, outline=stroke, width=6)
        d.ellipse([42, 118, 110, 186], fill=(255, 205, 160, 255), outline=stroke, width=5)
        d.ellipse([146, 118, 214, 186], fill=(255, 205, 160, 255), outline=stroke, width=5)
        d.ellipse([54, 134, 92, 172], fill=(251, 113, 133, 145))
        d.ellipse([164, 134, 202, 172], fill=(251, 113, 133, 145))
        d.ellipse([96, 86, 112, 102], fill=stroke)
        d.ellipse([144, 86, 160, 102], fill=stroke)
        d.arc([114, 128, 142, 148], 10, 170, fill=stroke, width=5)
    elif kind == "warp_bug_eyes":
        # Two giant popping eyes
        d.ellipse([62, 56, 194, 198], fill=skin, outline=stroke, width=6)
        d.ellipse([60, 74, 126, 140], fill=eye_w, outline=stroke, width=6)
        d.ellipse([130, 74, 196, 140], fill=eye_w, outline=stroke, width=6)
        d.ellipse([82, 96, 106, 120], fill=stroke)
        d.ellipse([150, 96, 174, 120], fill=stroke)
        d.ellipse([88, 100, 96, 108], fill=eye_w)
        d.ellipse([156, 100, 164, 108], fill=eye_w)
        d.arc([108, 152, 148, 176], 10, 170, fill=stroke, width=5)
    elif kind == "warp_wide_mouth":
        # Huge wide laughing mouth
        d.ellipse([58, 48, 198, 200], fill=skin, outline=stroke, width=6)
        d.ellipse([90, 82, 108, 100], fill=stroke)
        d.ellipse([148, 82, 166, 100], fill=stroke)
        d.rounded_rectangle([68, 116, 188, 182], radius=28, fill=(225, 29, 72, 255), outline=stroke, width=6)
        d.rectangle([84, 119, 172, 138], fill=eye_w)
    elif kind == "warp_chubby":
        # Wide round chubby cheeks
        d.ellipse([40, 62, 216, 198], fill=skin, outline=stroke, width=6)
        d.ellipse([62, 128, 98, 160], fill=(244, 63, 94, 130))
        d.ellipse([158, 128, 194, 160], fill=(244, 63, 94, 130))
        d.ellipse([92, 98, 110, 116], fill=stroke)
        d.ellipse([146, 98, 164, 116], fill=stroke)
        d.arc([106, 132, 150, 162], 15, 165, fill=stroke, width=6)
    elif kind == "warp_gigachad":
        # Ultra square chiseled GigaChad jaw
        d.polygon([(70, 52), (186, 52), (194, 148), (176, 198), (128, 206), (80, 198), (62, 148)], fill=skin, outline=stroke, width=6)
        d.line([(86, 86), (118, 92)], fill=stroke, width=7)
        d.line([(170, 86), (138, 92)], fill=stroke, width=7)
        d.ellipse([94, 98, 110, 110], fill=stroke)
        d.ellipse([146, 98, 162, 110], fill=stroke)
        d.line([(106, 156), (150, 156)], fill=stroke, width=6)
    elif kind == "warp_swirl":
        # Spiral vortex over face
        d.ellipse([54, 54, 202, 202], fill=skin, outline=stroke, width=6)
        pts = []
        for a in range(0, 900, 12):
            rad = a / 900.0 * 62.0
            th = math.radians(a)
            pts.append((128 + math.cos(th) * rad, 128 + math.sin(th) * rad))
        d.line(pts, fill=(59, 130, 246, 255), width=7)
    elif kind == "warp_melt":
        # Melting dripping face
        d.pieslice([58, 48, 198, 174], 180, 360, fill=skin, outline=stroke, width=6)
        d.rounded_rectangle([58, 108, 86, 198], radius=14, fill=skin, outline=stroke, width=5)
        d.rounded_rectangle([88, 110, 118, 182], radius=14, fill=skin, outline=stroke, width=5)
        d.rounded_rectangle([120, 110, 152, 208], radius=15, fill=skin, outline=stroke, width=5)
        d.rounded_rectangle([154, 108, 198, 188], radius=14, fill=skin, outline=stroke, width=5)
        d.ellipse([90, 88, 108, 108], fill=stroke)
        d.ellipse([146, 94, 164, 114], fill=stroke)
    return img


def draw_film_canister(c0, c1, label, accent_hex, body_hex):
    img = make_circle_base(c0, c1)
    d = ImageDraw.Draw(img)
    acc = hex_to_rgb(accent_hex)
    body = hex_to_rgb(body_hex)
    # 35mm film roll canister silhouette
    d.rounded_rectangle([72, 60, 184, 188], radius=16, fill=(*body, 255), outline=(255, 255, 255, 220), width=4)
    # Top cap + spool tip
    d.rounded_rectangle([66, 48, 190, 72], radius=8, fill=(30, 41, 59, 255), outline=(255, 255, 255, 200), width=3)
    d.rounded_rectangle([112, 34, 144, 52], radius=5, fill=(148, 163, 184, 255), outline=(255, 255, 255, 200), width=3)
    # Film leader tongue sticking out right
    d.polygon([(184, 88), (212, 88), (212, 130), (198, 146), (184, 146)], fill=(68, 42, 26, 255), outline=(255, 255, 255, 190), width=3)
    # Accent stripe across canister
    d.rectangle([76, 96, 180, 152], fill=(*acc, 255))
    draw_centered_text(d, label, 128, 124, FONT_SMALL if len(label) > 4 else FONT_BOLD, fill=(255, 255, 255, 255), shadow=(0, 0, 0, 180))
    return img


def draw_retro_camera(c0, c1, body_hex, top_hex, label):
    img = make_circle_base(c0, c1)
    d = ImageDraw.Draw(img)
    body = hex_to_rgb(body_hex)
    top = hex_to_rgb(top_hex)
    # Compact camera body
    d.rounded_rectangle([42, 66, 214, 174], radius=24, fill=(*body, 255), outline=(255, 255, 255, 230), width=4)
    d.rounded_rectangle([46, 66, 210, 96], radius=16, fill=(*top, 255))
    # Shutter button + viewfinder
    d.rounded_rectangle([168, 52, 194, 68], radius=5, fill=(239, 68, 68, 255), outline=(255, 255, 255, 220), width=2)
    d.rounded_rectangle([60, 74, 86, 90], radius=4, fill=(250, 204, 21, 255))
    # Big glossy camera lens
    d.ellipse([82, 82, 174, 174], fill=(15, 23, 42, 255), outline=(226, 232, 240, 255), width=6)
    d.ellipse([100, 100, 156, 156], fill=(30, 58, 138, 255), outline=(96, 165, 250, 230), width=3)
    d.ellipse([110, 108, 126, 124], fill=(255, 255, 255, 210))
    draw_pill_label(d, label, cx=128, cy=204)
    return img


def draw_tool_icon(fid):
    if fid == "clock_weekday_overlay":
        img = make_circle_base("#1E3A8A", "#38BDF8")
        d = ImageDraw.Draw(img)
        draw_centered_text(d, "09:41", 128, 104, ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 66), fill=(255, 255, 255, 255))
        draw_pill_label(d, "THỨ 6", cx=128, cy=178, bg=(15, 23, 42, 215), fg=(254, 240, 138, 255))
        return img
    if fid == "portrait_bokeh":
        img = make_circle_base("#4C1D95", "#F59E0B")
        d = ImageDraw.Draw(img)
        # Soft bokeh circles
        for bx, by, br in [(64, 72, 24), (192, 80, 20), (54, 156, 18), (198, 156, 26)]:
            d.ellipse([bx - br, by - br, bx + br, by + br], fill=(255, 255, 255, 85), outline=(255, 255, 255, 190), width=3)
        # Sharp crisp foreground portrait silhouette
        d.ellipse([98, 66, 158, 126], fill=(255, 255, 255, 250))
        d.pieslice([74, 132, 182, 224], 180, 360, fill=(255, 255, 255, 250))
        draw_pill_label(d, "XÓA PHÔNG", cx=128, cy=204)
        return img
    if fid == "cctv_camera":
        img = make_circle_base("#022C22", "#10B981")
        d = ImageDraw.Draw(img)
        # Reticle corners + green CCTV cam + red REC badge
        for x0, y0, x1, y1 in [(44, 48, 72, 54), (44, 48, 50, 76), (184, 48, 212, 54), (206, 48, 212, 76),
                               (44, 202, 72, 208), (44, 180, 50, 208), (184, 202, 212, 208), (206, 180, 212, 208)]:
            d.rectangle([x0, y0, x1, y1], fill=(167, 243, 208, 235))
        d.rounded_rectangle([62, 86, 168, 146], radius=14, fill=(236, 253, 245, 245))
        d.polygon([(168, 98), (198, 86), (198, 146), (168, 134)], fill=(209, 250, 229, 245))
        d.ellipse([72, 56, 94, 78], fill=(239, 68, 68, 255))
        d.text((100, 50), "REC", font=FONT_SMALL, fill=(254, 202, 202, 255))
        draw_pill_label(d, "CCTV", cx=128, cy=196)
        return img
    # triple_clone
    img = make_circle_base("#3B0764", "#EC4899")
    d = ImageDraw.Draw(img)
    for ox, col in [(-38, (34, 211, 238, 195)), (38, (244, 114, 182, 195)), (0, (255, 255, 255, 250))]:
        d.ellipse([104 + ox, 66, 152 + ox, 114], fill=col)
        d.pieslice([84 + ox, 118, 172 + ox, 198], 180, 360, fill=col)
    draw_pill_label(d, "3 BÓNG", cx=128, cy=204)
    return img


def draw_beauty_icon(fid):
    specs = {
        "lut_iphone_beauty": ("#0284C7", "#BAE6FD", "✨", "MỊN DA", None),
        "lut_film_han": ("#BE185D", "#FBCFE8", "🎀", "HÀN", None),
        "lut_trang_sua": ("#7C3AED", "#E9D5FF", "🥛", "TRẮNG", None),
        "lut_phim_nhat": ("#0F766E", "#CCFBF1", "🌸", "NHẬT", None),
        "lut_hong_dao": ("#E11D48", "#FECDD3", "🍑", "ĐÀO", None),
        "lut_matcha": ("#15803D", "#BBF7D0", "🍵", "MATCHA", None),
        "lut_ulzzang_pink": ("#EC4899", "#FCE7F3", "🌷", "HỒNG", None),
        "lut_nang_ban_mai": ("#EA580C", "#FEF3C7", "☀️", "NẮNG", None),
        "lut_tone_lanh": ("#2563EB", "#DBEAFE", "❄️", "LẠNH", None),
        "lut_kem_bo": ("#D97706", "#FEF9C3", "🧁", "KEM BƠ", None),
    }
    c0, c1, em, lbl, sub = specs[fid]
    return draw_emoji_icon(c0, c1, em, badge=lbl, sub_emoji=sub)


def draw_ai_icon(fid):
    specs = {
        # Meme
        "ai_cong_chua_phong_tro": ("#BE185D", "#F9A8D4", "👸", "CÔNG CHÚA", "👑"),
        "ai_hoang_tu_ktx": ("#1D4ED8", "#60A5FA", "🤴", "HOÀNG TỬ", "👑"),
        "ai_lop_truong": ("#0F766E", "#2DD4BF", "🛞", "LỐP TRƯỞNG", None),
        "ai_di_phu_ho": ("#B45309", "#FBBF24", "👷", "PHỤ HỒ", "🧱"),
        "ai_ve_que_nuoi_ca": ("#15803D", "#4ADE80", "🐟", "NUÔI CÁ", "🌾"),
        # Trend
        "ai_figure_1_7": ("#EA580C", "#FDBA74", "🗿", "FIG 1/7", "✨"),
        "ai_action_figure_box": ("#0284C7", "#38BDF8", "📦", "HỘP FIG", "🧸"),
        "ai_lego_figure": ("#B91C1C", "#FDE047", "🧱", "LEGO", "🟡"),
        "ai_cartoon_3d": ("#7E22CE", "#C084FC", "🧚", "3D PIXAR", None),
        "ai_polaroid_string": ("#9A3412", "#FB923C", "🖼️", "POLAROID", "📎"),
        # Shipper & Job
        "ai_shipper_giao_hang": ("#DC2626", "#FB923C", "🛵", "SHIPPER", "📦"),
        "ai_grab_driver": ("#15803D", "#22C55E", "🏍️", "GRAB", "💚"),
        "ai_xanh_sm": ("#0E7490", "#22D3EE", "🚕", "XANH SM", "⚡"),
        "ai_bac_si": ("#0369A1", "#7DD3FC", "🩺", "BÁC SĨ", "🥼"),
        # Luxury
        "ai_tong_tai": ("#111827", "#4B5563", "💼", "TỔNG TÀI", "👔"),
        "ai_phu_ba": ("#78350F", "#F59E0B", "💎", "PHÚ BÀ", "👜"),
        "ai_thieu_gia": ("#991B1B", "#EF4444", "🏎️", "THIẾU GIA", "🕶️"),
        "ai_du_thuyen": ("#1E40AF", "#38BDF8", "🛥️", "DU THUYỀN", None),
        "ai_old_money": ("#57534E", "#D6D3D1", "🥂", "OLD MONEY", "⌚"),
        # Beauty & Costume AI
        "ai_makeup_idol": ("#DB2777", "#F472B6", "💄", "MAKEUP", "💋"),
        "ai_trang_diem_duyen": ("#9F1239", "#FB7185", "🌺", "DOUYIN", "✨"),
        "ai_doi_kieu_toc": ("#7C3AED", "#A78BFA", "💇", "KIỂU TÓC", "✂️"),
        "ai_doi_mau_toc": ("#0D9488", "#5EEAD4", "🎨", "MÀU TÓC", "🦄"),
        "ai_cosplay_wibu": ("#4338CA", "#818CF8", "🎭", "WIBU", "⚔️"),
        "ai_hau_gai": ("#1E293B", "#F43F5E", "🎀", "HẦU GÁI", "🖤"),
        "ai_hoang_thuong": ("#B45309", "#FDE047", "🐉", "HOÀNG THƯỢNG", "👑"),
        "ai_idol_kpop": ("#9333EA", "#F472B6", "🎤", "KPOP", "💜"),
    }
    c0, c1, em, lbl, sub = specs[fid]
    return draw_emoji_icon(c0, c1, em, badge=lbl, sub_emoji=sub)


def main():
    rendered = {}

    for fid in ["clock_weekday_overlay", "portrait_bokeh", "cctv_camera", "triple_clone"]:
        rendered[fid] = draw_tool_icon(fid)

    for fid in [
        "ai_cong_chua_phong_tro", "ai_hoang_tu_ktx", "ai_lop_truong", "ai_di_phu_ho", "ai_ve_que_nuoi_ca",
        "ai_figure_1_7", "ai_action_figure_box", "ai_lego_figure", "ai_cartoon_3d", "ai_polaroid_string",
        "ai_shipper_giao_hang", "ai_grab_driver", "ai_xanh_sm", "ai_bac_si",
        "ai_tong_tai", "ai_phu_ba", "ai_thieu_gia", "ai_du_thuyen", "ai_old_money",
        "ai_makeup_idol", "ai_trang_diem_duyen", "ai_doi_kieu_toc", "ai_doi_mau_toc",
        "ai_cosplay_wibu", "ai_hau_gai", "ai_hoang_thuong", "ai_idol_kpop",
    ]:
        rendered[fid] = draw_ai_icon(fid)

    warp_colors = {
        "warp_big_head": ("#1D4ED8", "#60A5FA"),
        "warp_tiny_face": ("#6D28D9", "#C084FC"),
        "warp_alien_vline": ("#047857", "#34D399"),
        "warp_hamster": ("#B45309", "#FBBF24"),
        "warp_bug_eyes": ("#B91C1C", "#F87171"),
        "warp_wide_mouth": ("#BE185D", "#F472B6"),
        "warp_chubby": ("#C2410C", "#FDBA74"),
        "warp_gigachad": ("#1E293B", "#64748B"),
        "warp_swirl": ("#4338CA", "#38BDF8"),
        "warp_melt": ("#0F766E", "#A3E635"),
    }
    for fid, (c0, c1) in warp_colors.items():
        rendered[fid] = draw_warp_icon(fid, c0, c1)

    film_specs = {
        "dazz_cpm35": ("cam", "#78350F", "#F59E0B", "#1F2937", "#F59E0B", "CPM35"),
        "dazz_classic_u": ("cam", "#111827", "#4B5563", "#0F172A", "#94A3B8", "CLSU"),
        "dazz_fqs": ("cam", "#064E3B", "#34D399", "#065F46", "#F97316", "FQS"),
        "dazz_inst_c": ("cam", "#9D174D", "#F472B6", "#FCE7F3", "#EC4899", "INST"),
        "dazz_grd": ("cam", "#090D16", "#64748B", "#111827", "#E2E8F0", "GRD"),
        "lut_kodak_portra": ("roll", "#92400E", "#FBBF24", "#DC2626", "#FDE047", "400"),
        "lut_fuji_superia": ("roll", "#065F46", "#34D399", "#15803D", "#A7F3D0", "FJ200"),
        "lut_kodak_gold": ("roll", "#B45309", "#FDE047", "#D97706", "#FEF08A", "GOLD"),
        "lut_cinestill_800t": ("roll", "#1E3A8A", "#F43F5E", "#E11D48", "#0F172A", "800T"),
        "lut_kodak_am": ("roll", "#7C2D12", "#FB923C", "#EA580C", "#FDBA74", "WARM"),
        "lut_fuji_chrome": ("roll", "#115E59", "#2DD4BF", "#0D9488", "#99F6E4", "PROV"),
        "lut_vintage": ("roll", "#451A03", "#B45309", "#78350F", "#FDE68A", "1998"),
    }
    for fid, (kind, c0, c1, acc, body, lbl) in film_specs.items():
        if kind == "cam":
            rendered[fid] = draw_retro_camera(c0, c1, acc, body, lbl)
        else:
            rendered[fid] = draw_film_canister(c0, c1, lbl, acc, body)

    for fid in [
        "lut_iphone_beauty", "lut_film_han", "lut_trang_sua", "lut_phim_nhat", "lut_hong_dao",
        "lut_matcha", "lut_ulzzang_pink", "lut_nang_ban_mai", "lut_tone_lanh", "lut_kem_bo",
    ]:
        rendered[fid] = draw_beauty_icon(fid)

    # Downsample crisp 256 -> 128 LANCZOS and save
    for fid, im in rendered.items():
        out = im.resize((128, 128), Image.Resampling.LANCZOS)
        out.save(ICON_DIR / f"{fid}.png", optimize=True)

    # Also build a preview contact sheet in conversation scratch dir
    cols = 9
    rows = math.ceil(len(rendered) / cols)
    sheet = Image.new("RGBA", (cols * 140, rows * 168), (24, 24, 28, 255))
    sd = ImageDraw.Draw(sheet)
    lbl_font = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 12)
    for idx, (fid, im) in enumerate(rendered.items()):
        r_i, c_i = divmod(idx, cols)
        x0, y0 = c_i * 140 + 6, r_i * 168 + 6
        sheet.alpha_composite(im.resize((128, 128), Image.Resampling.LANCZOS), (x0, y0))
        sd.text((x0 + 2, y0 + 132), fid[:18], font=lbl_font, fill=(220, 220, 225, 255))

    scratch_dir = Path(r"C:\Users\khoin\.gemini\antigravity\brain\d0194f46-5055-4c7d-9ec1-78a4855f4dae\scratch")
    scratch_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(scratch_dir / "v39_icons_sheet.png")
    print(f"Generated {len(rendered)} distinct 128x128 PNG icons in {ICON_DIR}")


if __name__ == "__main__":
    main()
