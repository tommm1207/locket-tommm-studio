import math
import os
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, "assets", "captions_anim")
W, H = 180, 48
FRAMES = 10
DURATION = 90

THEMES = [
    (
        "music_spotify_eq.gif",
        (10, 31, 20),
        (20, 83, 45),
        (30, 215, 96),
        (134, 239, 172),
    ),
    (
        "music_apple_pink.gif",
        (76, 5, 25),
        (190, 18, 60),
        (253, 164, 175),
        (255, 228, 230),
    ),
    (
        "music_lofi_violet.gif",
        (30, 27, 75),
        (91, 33, 182),
        (56, 189, 248),
        (196, 181, 253),
    ),
]


def lerp_rgb(c1, c2, t):
    return (
        int(c1[0] * (1 - t) + c2[0] * t),
        int(c1[1] * (1 - t) + c2[1] * t),
        int(c1[2] * (1 - t) + c2[2] * t),
    )


def make_equalizer_gif(filename, bg_top, bg_bot, bar_col, spark_col):
    frames = []
    # Smooth 240ms/cycle spectrum equalizer bars across left & right balanced margins
    bars_x = [8 + i * 7 for i in range(24)]
    phases = [i * 0.55 for i in range(24)]
    sparkles = [(28, 12), (68, 9), (112, 13), (154, 10)]

    for f_idx in range(FRAMES):
        t_loop = 2.0 * math.pi * f_idx / FRAMES
        im = Image.new("RGB", (W, H), bg_top)
        d = ImageDraw.Draw(im)

        for y in range(H):
            row_col = lerp_rgb(bg_top, bg_bot, y / (H - 1))
            d.line([0, y, W - 1, y], fill=row_col)

        # Bouncing audio equalizer bars along the bottom
        for bx, ph in zip(bars_x, phases):
            wave = 0.5 + 0.5 * math.sin(t_loop + ph)
            bar_h = int(4 + wave * 12)
            col = lerp_rgb(bar_col, spark_col, wave * 0.6)
            d.rounded_rectangle([bx, H - 3 - bar_h, bx + 4, H - 3], radius=2, fill=col)

        # Subtle floating ambient sparkles in upper sky
        for idx, (sx, sy) in enumerate(sparkles):
            pulse = 0.5 + 0.5 * math.sin(t_loop + idx * 1.4)
            dy = int(round(math.sin(t_loop + idx) * 2))
            scol = lerp_rgb(bg_bot, spark_col, 0.35 + 0.65 * pulse)
            r = 1 if pulse < 0.6 else 2
            d.ellipse([sx - r, sy + dy - r, sx + r, sy + dy + r], fill=scol)

        frames.append(im.convert("P", palette=Image.ADAPTIVE, colors=64))

    out_path = os.path.join(OUT_DIR, filename)
    frames[0].save(
        out_path,
        save_all=True,
        append_images=frames[1:],
        duration=DURATION,
        loop=0,
        optimize=True,
    )
    check = Image.open(out_path)
    kb = os.path.getsize(out_path) / 1024.0
    print(f"Saved {filename}: size={check.size}, n_frames={getattr(check, 'n_frames', 1)}, bytes={kb:.1f} KB")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for args in THEMES:
        make_equalizer_gif(*args)


if __name__ == "__main__":
    main()
