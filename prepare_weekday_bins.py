import os
import zlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
OUT_BIN_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")
SIZE = 512

WEEKDAYS = [
    (0, "CHỦ NHẬT"),
    (1, "THỨ HAI"),
    (2, "THỨ BA"),
    (3, "THỨ TƯ"),
    (4, "THỨ NĂM"),
    (5, "THỨ SÁU"),
    (6, "THỨ BẢY"),
]


def render_weekday_rgba(text: str) -> Image.Image:
    """Render tall condensed bold white Vietnamese weekday text for depth compositing."""
    font_path = "C:/Windows/Fonts/bahnschrift.ttf"
    font = ImageFont.truetype(font_path, 160)
    try:
        font.set_variation_by_name(b"Bold Condensed")
    except Exception:
        pass

    # Render onto a wider temporary canvas first, then stretch slightly vertically
    # to match Locket's tall condensed poster headline aesthetic
    tmp = Image.new("RGBA", (1400, 420), (0, 0, 0, 0))
    dt = ImageDraw.Draw(tmp)
    dt.text((40, 80), text, font=font, fill=(255, 255, 255, 255), stroke_width=4, stroke_fill=(255, 255, 255, 255))
    bbox = tmp.getbbox()
    if not bbox:
        raise RuntimeError(f"Empty glyph bbox for {text}")
    cropped = tmp.crop(bbox)

    cw, ch = cropped.size
    target_w = int(SIZE * 0.90)
    scale_x = target_w / cw
    new_w = target_w
    new_h = min(int(SIZE * 0.50), int(ch * scale_x * 1.48))
    stretched = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    x = (SIZE - new_w) // 2
    y = int(SIZE * 0.14)

    # Subtle soft drop shadow for legibility against bright skies/walls
    shadow_alpha = stretched.split()[3].point(lambda a: int(a * 0.34))
    shadow = Image.new("RGBA", stretched.size, (0, 0, 0, 255))
    shadow.putalpha(shadow_alpha)
    shadow_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow_layer.paste(shadow, (x, y + 4))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=6))

    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas.paste(stretched, (x, y), stretched)
    return canvas


def main():
    os.makedirs(OUT_BIN_DIR, exist_ok=True)
    icon_path = os.path.join(FRAMES_DIR, "weekday_depth.png")
    if os.path.isfile(icon_path):
        im_icon = Image.open(icon_path).convert("RGBA").resize((256, 256), Image.Resampling.LANCZOS)
        im_icon.save(icon_path, format="PNG", optimize=True)
        print(f"Optimized {icon_path} -> {os.path.getsize(icon_path)} bytes")

    for idx, label in WEEKDAYS:
        im = render_weekday_rgba(label)
        raw = im.tobytes()
        comp = zlib.compress(raw, level=9)
        out_bin = os.path.join(OUT_BIN_DIR, f"weekday_{idx}.bin")
        with open(out_bin, "wb") as f:
            f.write(comp)
        if idx in (0, 4):
            bg = Image.new("RGBA", (SIZE, SIZE), (55, 65, 81, 255))
            preview = Image.alpha_composite(bg, im)
            preview.save(os.path.join(BASE_DIR, "assets", "frames_bin", f"_preview_weekday_{idx}.png"))
        print(f"weekday_{idx}.bin ({label}) -> {len(comp)} bytes")


if __name__ == "__main__":
    main()
