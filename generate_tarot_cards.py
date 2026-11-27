import math
import os
import zlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ART_DIR = os.path.join(BASE_DIR, "assets", "tarot_art")
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
BINS_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")
V2_DIR = os.path.join(BASE_DIR, "assets", "filters_v2")

SIZE = 512
ICON_SIZE = 128
FONT_SERIF = r"C:\Windows\Fonts\timesbd.ttf"
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_ITALIC = r"C:\Windows\Fonts\segoeuiz.ttf"

TAROT_SPECS = {
    "nm_boi_do_hay_den": (
        "tarot_luck.png",
        "Hôm Nay Đỏ Hay Đen",
        "ĐỎ HAY ĐEN?",
        [
            ("ĐỎ RỰC 99%", "Hôm nay làm gì cũng hên!"),
            ("HƠI XUI NHẸ", "Cẩn thận quên ví & trễ giờ"),
            ("LỘC BẤT NGỜ", "Sắp có người bao ăn uống"),
            ("BÌNH AN VÔ SỰ", "Ngày chill, không drama!"),
        ],
    ),
    "nm_boi_duyen_tinh": (
        "tarot_love.png",
        "Đường Tình Duyên",
        "TÌNH DUYÊN",
        [
            ("SẮP CÓ BỒ", "Crush sắp rep tin nhắn đó!"),
            ("ĐÀO HOA NỞ", "Hôm nay thu hút cực mạnh"),
            ("Ế BỀN VỮNG", "Yêu bản thân trước đã nha"),
            ("DUYÊN ĐẾN GẦN", "Người ấy đang ở quanh đây"),
        ],
    ),
    "nm_boi_nay_nen_an_gi": (
        "tarot_food.png",
        "Nay Nên Ăn Gì",
        "NAY ĂN GÌ?",
        [
            ("BÚN ĐẬU MẮM TÔM", "Full topping + trà tắc!"),
            ("TRÀ SỮA FULL", "Ít đá 50% đường nha"),
            ("LẨU NƯỚNG CHILL", "Rủ ngay hội bạn thân đi!"),
            ("PHỞ BÒ / BÚN BÒ", "Nóng hổi vừa thổi vừa ăn"),
        ],
    ),
    "nm_boi_xem_que": (
        "tarot_destiny.png",
        "Xem Quẻ Hôm Nay",
        "QUẺ HÔM NAY",
        [
            ("QUẺ ĐẠI CÁT", "Vạn sự như ý, tiền vô ào ào"),
            ("QUẺ TRUNG CÁT", "Cứ tiến tới, kết quả sẽ đẹp"),
            ("QUẺ QUÝ NHÂN", "Hôm nay có người giúp đỡ"),
            ("QUẺ BÌNH AN", "Chậm lại một nhịp sẽ vui"),
        ],
    ),
}


def get_font(path, size):
    return ImageFont.truetype(path, size)


def fit_font(draw, font_path, text, max_w, max_size, min_size=9):
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


def wrap_two_lines(draw, text, font, max_w):
    bb = draw.textbbox((0, 0), text, font=font)
    if (bb[2] - bb[0]) <= max_w:
        return [text]
    words = text.split()
    best = [text]
    for i in range(1, len(words)):
        l1 = " ".join(words[:i])
        l2 = " ".join(words[i:])
        w1 = draw.textbbox((0, 0), l1, font=font)[2]
        w2 = draw.textbbox((0, 0), l2, font=font)[2]
        if w1 <= max_w and w2 <= max_w:
            return [l1, l2]
    mid = max(1, len(words) // 2)
    best = [" ".join(words[:mid]), " ".join(words[mid:])]
    return best


def build_tarot_card(art_im, title, subtitle):
    cw, ch = 152, 228
    card = art_im.convert("RGBA")
    # Cover crop art to (cw, ch)
    aw, ah = card.size
    sc = max(cw / aw, ch / ah)
    card = card.resize((int(round(aw * sc)), int(round(ah * sc))), Image.Resampling.LANCZOS)
    left = (card.width - cw) // 2
    top = int((card.height - ch) * 0.35)
    card = card.crop((left, top, left + cw, top + ch))

    # Bottom gradient scrim inside lower ~38% for high contrast typography
    scrim = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    start_y = int(ch * 0.56)
    for y in range(start_y, ch):
        t = (y - start_y) / max(1, ch - 1 - start_y)
        alpha = int(230 * (t ** 0.72))
        sd.line([0, y, cw, y], fill=(10, 8, 16, alpha))
    card = Image.alpha_composite(card, scrim)

    d = ImageDraw.Draw(card)
    # Subtle antique gold divider line above fortune caption
    d.line([20, ch - 78, cw - 20, ch - 78], fill=(217, 178, 92, 185), width=1)

    f_title = fit_font(d, FONT_SERIF, title, cw - 20, 15, 10)
    draw_centered_text(d, cw / 2, ch - 60, title, f_title, (250, 214, 118, 255))

    f_sub = fit_font(d, FONT_ITALIC, subtitle, cw - 18, 12, 9)
    lines = wrap_two_lines(d, subtitle, f_sub, cw - 18)
    if len(lines) == 1:
        draw_centered_text(d, cw / 2, ch - 33, lines[0], f_sub, (248, 244, 232, 245))
    else:
        f_sub2 = fit_font(d, FONT_ITALIC, lines[0], cw - 18, 11, 8)
        f_sub3 = fit_font(d, FONT_ITALIC, lines[1], cw - 18, 11, 8)
        # Pick smaller of both for balanced look
        sz = min(f_sub2.size, f_sub3.size)
        f_pair = get_font(FONT_ITALIC, sz)
        draw_centered_text(d, cw / 2, ch - 38, lines[0], f_pair, (248, 244, 232, 245))
        draw_centered_text(d, cw / 2, ch - 23, lines[1], f_pair, (248, 244, 232, 245))

    # Crisp antique gold border + rounded corners
    d.rounded_rectangle([1, 1, cw - 2, ch - 2], radius=14, outline=(228, 189, 98, 245), width=2)
    card = apply_rounded_square_mask(card, [0, 0, cw - 1, ch - 1], radius=14)
    return card


def compose_overlay(art_im, header_label, title, subtitle):
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    # Subtle editorial corner text top-left (no opaque pill box!)
    f_hdr = get_font(FONT_SERIF, 14)
    hdr_txt = f"TAROT  •  {header_label}"
    d.text((23, 21), hdr_txt, font=f_hdr, fill=(0, 0, 0, 145))
    d.text((22, 20), hdr_txt, font=f_hdr, fill=(248, 224, 152, 235))

    # Build card & drop shadow, rotate slightly -4 deg, place in bottom-right leaving 85% clear
    card = build_tarot_card(art_im, title, subtitle)
    cw, ch = card.size
    pad = 28
    holder = Image.new("RGBA", (cw + pad * 2, ch + pad * 2), (0, 0, 0, 0))
    sh = Image.new("RGBA", (cw + pad * 2, ch + pad * 2), (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh)
    sh_draw.rounded_rectangle([pad + 4, pad + 7, pad + cw + 4, pad + ch + 7], radius=14, fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=9))
    holder = Image.alpha_composite(holder, sh)
    holder.alpha_composite(card, (pad, pad))
    tilted = holder.rotate(4, resample=Image.Resampling.BICUBIC, expand=True)

    px = SIZE - tilted.width + 6
    py = SIZE - tilted.height + 6
    canvas.alpha_composite(tilted, (px, py))
    return canvas


def build_tarot_icon(art_im, icon_label):
    im = art_im.convert("RGBA")
    w, h = im.size
    sc = max(ICON_SIZE / w, ICON_SIZE / h)
    im = im.resize((int(round(w * sc)), int(round(h * sc))), Image.Resampling.LANCZOS)
    left = (im.width - ICON_SIZE) // 2
    top = int((im.height - ICON_SIZE) * 0.3)
    im = im.crop((left, top, left + ICON_SIZE, top + ICON_SIZE))

    d = ImageDraw.Draw(im)
    d.rounded_rectangle([8, 92, 120, 117], radius=9, fill=(12, 10, 18, 208), outline=(228, 189, 98, 220), width=1)
    draw_centered_text(d, 64, 104, icon_label, fit_font(d, FONT_BOLD, icon_label, 102, 12, 9), (253, 230, 138, 255))
    d.rounded_rectangle([2, 2, 126, 126], radius=24, outline=(255, 255, 255, 210), width=3)
    return apply_rounded_square_mask(im, [2, 2, 126, 126], radius=24)


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    os.makedirs(V2_DIR, exist_ok=True)

    count_bins = 0
    for fid, (art_name, icon_label, hdr_label, outcomes) in TAROT_SPECS.items():
        art_path = os.path.join(ART_DIR, art_name)
        if not os.path.exists(art_path):
            raise FileNotFoundError(f"Missing tarot artwork: {art_path}")
        art_im = Image.open(art_path).convert("RGB")

        for idx, (title, sub) in enumerate(outcomes):
            ov = compose_overlay(art_im, hdr_label, title, sub).convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
            bin_path = os.path.join(BINS_DIR, f"{fid}_{idx}.bin")
            with open(bin_path, "wb") as bf:
                bf.write(zlib.compress(ov.tobytes(), level=9))
            count_bins += 1
            if idx == 0:
                ov.save(os.path.join(FRAMES_DIR, f"{fid}.png"), "PNG")
                with open(os.path.join(BINS_DIR, f"{fid}.bin"), "wb") as bf0:
                    bf0.write(zlib.compress(ov.tobytes(), level=9))

        icon_im = build_tarot_icon(art_im, icon_label)
        icon_im.save(os.path.join(V2_DIR, f"{fid}.png"), "PNG")

    print(f"Generated {len(TAROT_SPECS)} Tarot PNG frames, {count_bins} random-draw .bin variants, and {len(TAROT_SPECS)} v2 Tarot icons.")


if __name__ == "__main__":
    main()
