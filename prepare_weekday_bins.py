import os
import zlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
OUT_BIN_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")
SIZE = 512

LANG_CONFIGS = [
    {
        "prefix": "weekday",
        "font_path": "C:/Windows/Fonts/bahnschrift.ttf",
        "variation": b"Bold Condensed",
        "stroke": 4,
        "v_stretch": 1.48,
        "labels": ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"],
    },
    {
        "prefix": "weekday_en",
        "font_path": "C:/Windows/Fonts/bahnschrift.ttf",
        "variation": b"Bold Condensed",
        "stroke": 4,
        "v_stretch": 1.48,
        "labels": ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
        "icon_name": "weekday_depth_en.png",
        "icon_title": "MONDAY",
        "icon_sub": "EN • DEPTH",
        "icon_bg": ((30, 58, 138), (37, 99, 235)),
    },
    {
        "prefix": "weekday_tw",
        "font_path": "C:/Windows/Fonts/msjhbd.ttc",
        "variation": None,
        "stroke": 3,
        "v_stretch": 1.32,
        "labels": ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        "icon_name": "weekday_depth_tw.png",
        "icon_title": "星期一",
        "icon_sub": "TW • 景深",
        "icon_bg": ((124, 45, 18), (234, 88, 12)),
    },
    {
        "prefix": "weekday_de",
        "font_path": "C:/Windows/Fonts/bahnschrift.ttf",
        "variation": b"Bold Condensed",
        "stroke": 4,
        "v_stretch": 1.48,
        "labels": ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"],
        "icon_name": "weekday_depth_de.png",
        "icon_title": "MONTAG",
        "icon_sub": "DE • TIEFE",
        "icon_bg": ((120, 53, 15), (217, 119, 6)),
    },
]


def render_weekday_rgba(text: str, font_path: str, variation, stroke: int, v_stretch: float) -> Image.Image:
    """Render tall condensed bold white weekday text for depth compositing."""
    font = ImageFont.truetype(font_path, 160)
    if variation:
        try:
            font.set_variation_by_name(variation)
        except Exception:
            pass

    tmp = Image.new("RGBA", (1500, 440), (0, 0, 0, 0))
    dt = ImageDraw.Draw(tmp)
    dt.text((40, 80), text, font=font, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(255, 255, 255, 255))
    bbox = tmp.getbbox()
    if not bbox:
        raise RuntimeError(f"Empty glyph bbox for {text}")
    cropped = tmp.crop(bbox)

    cw, ch = cropped.size
    target_w = int(SIZE * 0.90)
    scale_x = target_w / cw
    new_w = target_w
    new_h = min(int(SIZE * 0.50), int(ch * scale_x * v_stretch))
    stretched = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    x = (SIZE - new_w) // 2
    y = int(SIZE * 0.14)

    shadow_alpha = stretched.split()[3].point(lambda a: int(a * 0.34))
    shadow = Image.new("RGBA", stretched.size, (0, 0, 0, 255))
    shadow.putalpha(shadow_alpha)
    shadow_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow_layer.paste(shadow, (x, y + 4))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=6))

    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas.paste(stretched, (x, y), stretched)
    return canvas


def build_lang_icon(cfg: dict):
    """Build a crisp 256x256 gradient card preview icon for non-VN weekday depth filters."""
    sz = 256
    c0, c1 = cfg["icon_bg"]
    im = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    for y in range(sz):
        t = y / (sz - 1)
        r = int(c0[0] + (c1[0] - c0[0]) * t)
        g = int(c0[1] + (c1[1] - c0[1]) * t)
        b = int(c0[2] + (c1[2] - c0[2]) * t)
        draw.line([(0, y), (sz, y)], fill=(r, g, b, 255))

    # Rounded mask
    mask = Image.new("L", (sz, sz), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sz - 1, sz - 1], radius=48, fill=255)
    im.putalpha(mask)

    font = ImageFont.truetype(cfg["font_path"], 64)
    if cfg["variation"]:
        try:
            font.set_variation_by_name(cfg["variation"])
        except Exception:
            pass
    tmp = Image.new("RGBA", (600, 200), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((20, 20), cfg["icon_title"], font=font, fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(255, 255, 255, 255))
    bb = tmp.getbbox()
    word = tmp.crop(bb)
    ww, wh = word.size
    tw = int(sz * 0.84)
    th = min(int(sz * 0.44), int(wh * (tw / ww) * 1.25))
    word = word.resize((tw, th), Image.Resampling.LANCZOS)
    im.paste(word, ((sz - tw) // 2, int(sz * 0.24)), word)

    sub_font = ImageFont.truetype("C:/Windows/Fonts/msjhbd.ttc", 22)
    sb = ImageDraw.Draw(im).textbbox((0, 0), cfg["icon_sub"], font=sub_font)
    sw = sb[2] - sb[0]
    ImageDraw.Draw(im).text(((sz - sw) // 2, int(sz * 0.72)), cfg["icon_sub"], font=sub_font, fill=(255, 255, 255, 230))

    out_path = os.path.join(FRAMES_DIR, cfg["icon_name"])
    im.save(out_path, format="PNG", optimize=True)
    print(f"Generated icon {cfg['icon_name']} -> {os.path.getsize(out_path)} bytes")


def main():
    os.makedirs(OUT_BIN_DIR, exist_ok=True)
    icon_path = os.path.join(FRAMES_DIR, "weekday_depth.png")
    if os.path.isfile(icon_path):
        im_icon = Image.open(icon_path).convert("RGBA").resize((256, 256), Image.Resampling.LANCZOS)
        im_icon.save(icon_path, format="PNG", optimize=True)

    for cfg in LANG_CONFIGS:
        if "icon_name" in cfg:
            build_lang_icon(cfg)
        for idx, label in enumerate(cfg["labels"]):
            im = render_weekday_rgba(label, cfg["font_path"], cfg["variation"], cfg["stroke"], cfg["v_stretch"])
            comp = zlib.compress(im.tobytes(), level=9)
            out_bin = os.path.join(OUT_BIN_DIR, f"{cfg['prefix']}_{idx}.bin")
            with open(out_bin, "wb") as f:
                f.write(comp)
            if idx == 1 and cfg["prefix"] in ("weekday_en", "weekday_tw", "weekday_de"):
                bg = Image.new("RGBA", (SIZE, SIZE), (55, 65, 81, 255))
                Image.alpha_composite(bg, im).save(os.path.join(OUT_BIN_DIR, f"_preview_{cfg['prefix']}_1.png"))
        print(f"Built 7 bins for {cfg['prefix']}")


if __name__ == "__main__":
    main()
