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


def make_vinyl_pill_gif(filename, bg_top, bg_bot, label_c1, label_c2, accent_col):
    vw, vh = W * 2, H * 2  # 400x96 -> 200x48 via Lanczos
    v_frames = 12
    cx, cy, r_disc = 352, vh // 2, 40
    bars_x = [14 + i * 11 for i in range(25)]
    phases = [i * 0.6 for i in range(25)]
    frames = []

    for f_idx in range(v_frames):
        theta = 2.0 * math.pi * f_idx / v_frames
        im = Image.new("RGB", (vw, vh), bg_top)
        px = im.load()

        for x in range(vw):
            tx = x / (vw - 1)
            row_col = lerp_rgb(bg_top, bg_bot, tx)
            for y in range(vh):
                px[x, y] = row_col

        d = ImageDraw.Draw(im)
        # Subtle micro equalizer bars along bottom-left so text stays legible
        for bx, ph in zip(bars_x, phases):
            wave = 0.5 + 0.5 * math.sin(theta + ph)
            bar_h = int(4 + wave * 8)
            col = lerp_rgb(bg_bot, accent_col, 0.35 + 0.45 * wave)
            d.rounded_rectangle([bx, vh - 4 - bar_h, bx + 5, vh - 4], radius=2, fill=col)

        # Render smooth anti-aliased spinning LP vinyl record on right side
        for x in range(cx - r_disc - 2, min(vw, cx + r_disc + 3)):
            dx = x - cx
            for y in range(max(0, cy - r_disc - 2), min(vh, cy + r_disc + 3)):
                dy = y - cy
                r = math.hypot(dx, dy)
                if r > r_disc + 1.2:
                    continue
                angle = math.atan2(dy, dx)
                if r <= 4.2:
                    col = (24, 24, 28)
                elif r <= 15.0:
                    rot_notch = math.cos(angle - theta)
                    t_lbl = 0.5 + 0.5 * math.sin(angle - theta)
                    col = lerp_rgb(label_c1, label_c2, t_lbl)
                    if rot_notch > 0.72 and r > 7.0:
                        col = accent_col
                else:
                    groove = 0.5 + 0.5 * math.sin(r * 1.45)
                    sheen = max(0.0, math.cos(2.0 * (angle - theta + 0.6))) ** 3
                    base_v = 11 + int(groove * 14) + int(sheen * 135)
                    col = (min(250, base_v), min(250, base_v), min(255, int(base_v * 1.03)))
                    if r > r_disc - 2.0:
                        col = lerp_rgb(col, (190, 195, 210), 0.35)

                if r > r_disc - 0.5:
                    alpha = max(0.0, min(1.0, (r_disc + 1.0 - r) / 1.5))
                    bg_rgb = px[x, y]
                    col = lerp_rgb(bg_rgb, col, alpha)
                px[x, y] = col

        small = im.resize((200, H), Image.Resampling.LANCZOS)
        frames.append(small.convert("P", palette=Image.ADAPTIVE, colors=64))

    out_path = os.path.join(OUT_DIR, filename)
    frames[0].save(
        out_path,
        save_all=True,
        append_images=frames[1:],
        duration=80,
        loop=0,
        optimize=True,
    )
    check = Image.open(out_path)
    kb = os.path.getsize(out_path) / 1024.0
    print(f"Saved {filename}: size={check.size}, n_frames={getattr(check, 'n_frames', 1)}, bytes={kb:.1f} KB")


def make_vinyl_icon_gif(filename):
    sz = 64
    v_frames = 12
    cx = cy = sz / 2.0 - 0.5
    r_disc = 28.5
    frames = []

    for f_idx in range(v_frames):
        theta = 2.0 * math.pi * f_idx / v_frames
        im = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
        px = im.load()
        for x in range(sz):
            dx = x - cx
            for y in range(sz):
                dy = y - cy
                r = math.hypot(dx, dy)
                if r > r_disc + 0.8:
                    continue
                angle = math.atan2(dy, dx)
                if r <= 3.0:
                    rgb = (245, 245, 245)
                elif r <= 10.5:
                    rot_notch = math.cos(angle - theta)
                    t_lbl = 0.5 + 0.5 * math.sin(angle - theta)
                    rgb = lerp_rgb((217, 119, 6), (225, 29, 72), t_lbl)
                    if rot_notch > 0.65 and r > 5.0:
                        rgb = (254, 240, 138)
                else:
                    groove = 0.5 + 0.5 * math.sin(r * 1.9)
                    sheen = max(0.0, math.cos(2.0 * (angle - theta + 0.5))) ** 3
                    v = 14 + int(groove * 18) + int(sheen * 155)
                    rgb = (min(252, v), min(252, v), min(255, int(v * 1.03)))
                alpha = 255 if r <= r_disc - 0.6 else int(max(0, min(255, (r_disc + 0.8 - r) / 1.4 * 255)))
                px[x, y] = (rgb[0], rgb[1], rgb[2], alpha)

        alpha_band = im.getchannel("A")
        p_im = im.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=63)
        mask = alpha_band.point(lambda a: 255 if a < 96 else 0)
        p_im.paste(63, mask)
        p_im.info["transparency"] = 63
        frames.append(p_im)

    out_path = os.path.join(OUT_DIR, filename)
    frames[0].save(
        out_path,
        save_all=True,
        append_images=frames[1:],
        duration=80,
        loop=0,
        disposal=2,
        transparency=63,
    )
    check = Image.open(out_path)
    kb = os.path.getsize(out_path) / 1024.0
    print(f"Saved {filename}: size={check.size}, n_frames={getattr(check, 'n_frames', 1)}, bytes={kb:.1f} KB")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for args in THEMES:
        make_equalizer_gif(*args)
    make_vinyl_pill_gif(
        "music_vinyl_gold.gif",
        (14, 12, 18),
        (74, 50, 25),
        (250, 204, 21),
        (180, 83, 9),
        (254, 240, 138),
    )
    make_vinyl_pill_gif(
        "music_vinyl_rose.gif",
        (45, 10, 27),
        (157, 23, 77),
        (249, 168, 212),
        (244, 63, 94),
        (255, 228, 230),
    )
    make_vinyl_icon_gif("vinyl_disc_icon.gif")


if __name__ == "__main__":
    main()
