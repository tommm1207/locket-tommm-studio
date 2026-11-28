import json
import math
import os
import zlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(ROOT, "assets", "frames")
BINS_DIR = os.path.join(ROOT, "assets", "frames_bin")
V2_ICONS_DIR = os.path.join(ROOT, "assets", "filters_v2")
MANIFEST_PATH = os.path.join(ROOT, "data", "frames_manifest.json")

SIZE = 512
SS = 2  # 2x supersampling -> 1024x1024 then LANCZOS downsample to 512x512
W = SIZE * SS
CUTOUT_BOX = [32, 42, 480, 386]  # 1x coordinates stored in frames_manifest.json


def load_font(size, bold=True):
    candidates = (
        [r"C:\Windows\Fonts\segoeuib.ttf", r"C:\Windows\Fonts\arialbd.ttf"]
        if bold
        else [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"]
    )
    for fp in candidates:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_sparkle(draw, cx, cy, outer_r, color, glow_img=None, glow_color=None):
    """Draw a sharp 4-point blink-blink diamond star with optional soft glow."""
    inner_r = max(2, outer_r * 0.24)
    pts = []
    for i in range(8):
        ang = i * (math.pi / 4.0) - math.pi / 2.0
        r = outer_r if i % 2 == 0 else inner_r
        pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
    if glow_img is not None and glow_color is not None:
        gdraw = ImageDraw.Draw(glow_img)
        gr = outer_r * 0.85
        gdraw.ellipse((cx - gr, cy - gr, cx + gr, cy + gr), fill=glow_color)
    draw.polygon(pts, fill=color)
    core_r = max(1.5, outer_r * 0.16)
    draw.ellipse((cx - core_r, cy - core_r, cx + core_r, cy + core_r), fill=(255, 255, 255, 255))


def build_vinyl_disc_patch(radius, label_palette, sheen_tint):
    """Render a supersampled 2D glossy vinyl LP disc RGBA patch with concentric micro-grooves."""
    pad = 24
    dim = (radius + pad) * 2
    cx = cy = dim // 2
    patch = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    px = patch.load()

    r_outer = float(radius)
    r_rim_in = radius * 0.945
    r_label = radius * 0.355
    r_ring = radius * 0.125
    r_hole = radius * 0.055

    l_dark, l_mid, l_hi, accent = label_palette
    st_r, st_g, st_b = sheen_tint

    for y in range(dim):
        dy = y - cy
        dy2 = dy * dy
        for x in range(dim):
            dx = x - cx
            d2 = dx * dx + dy2
            if d2 > (r_outer + 2.0) ** 2:
                continue
            r = math.sqrt(d2)

            # Anti-aliased outer edge
            edge_alpha = max(0.0, min(1.0, (r_outer + 0.8 - r) / 1.4))
            if edge_alpha <= 0.0:
                continue

            # Center spindle hole is translucent dark / cutout feel
            if r < r_hole:
                a_hole = int(235 * edge_alpha)
                px[x, y] = (14, 14, 18, a_hole)
                continue

            ang = math.atan2(dy, dx)
            # Anisotropic specular studio reflection bands across vinyl grooves (~38deg & ~218deg)
            spec1 = max(0.0, math.cos(2.0 * (ang - 0.68))) ** 3.6
            spec2 = max(0.0, math.cos(2.0 * (ang - 0.68 + 0.42))) ** 8.0 * 0.45
            spec = min(1.0, spec1 + spec2)

            if r < r_ring:
                # Metallic brushed spindle collar
                metal = 155 + int(85 * spec)
                px[x, y] = (metal, metal, min(255, metal + 6), int(255 * edge_alpha))
            elif r < r_label:
                # Record center label gradient + subtle concentric ring
                t = (r - r_ring) / max(1.0, r_label - r_ring)
                base_r = l_dark[0] * (1.0 - t) + l_mid[0] * t
                base_g = l_dark[1] * (1.0 - t) + l_mid[1] * t
                base_b = l_dark[2] * (1.0 - t) + l_mid[2] * t
                if abs(r - r_label * 0.82) < 1.8:
                    base_r, base_g, base_b = accent
                elif abs(r - r_label * 0.48) < 1.2:
                    base_r, base_g, base_b = l_hi
                lit = 0.88 + 0.26 * spec
                px[x, y] = (
                    max(0, min(255, int(base_r * lit))),
                    max(0, min(255, int(base_g * lit))),
                    max(0, min(255, int(base_b * lit))),
                    int(255 * edge_alpha),
                )
            elif r < r_label + 2.5:
                # Dark groove border around label
                px[x, y] = (8, 8, 12, int(255 * edge_alpha))
            elif r >= r_rim_in:
                # Glossy beveled outer rim
                rim_t = (r - r_rim_in) / max(1.0, r_outer - r_rim_in)
                sheen = 18 + int(62 * spec) + int(24 * math.sin(rim_t * math.pi))
                px[x, y] = (
                    min(255, sheen + int(st_r * spec * 0.25)),
                    min(255, sheen + int(st_g * spec * 0.25)),
                    min(255, sheen + int(st_b * spec * 0.25)),
                    int(255 * edge_alpha),
                )
            else:
                # Concentric PVC micro-grooves + silent track gaps + sheen
                groove = 0.5 + 0.5 * math.sin(r * 1.15)
                track_gap = 0.72 if (abs(r - radius * 0.68) < 2.2 or abs(r - radius * 0.50) < 1.8) else 1.0
                base = 12.0 + groove * 10.0 * track_gap
                glow = spec * (58.0 + 34.0 * groove) * track_gap
                rr = max(0, min(255, int(base + glow * (0.68 + 0.32 * st_r / 255.0))))
                gg = max(0, min(255, int(base + glow * (0.68 + 0.32 * st_g / 255.0))))
                bb = max(0, min(255, int(base + glow * (0.68 + 0.32 * st_b / 255.0))))
                px[x, y] = (rr, gg, bb, int(255 * edge_alpha))

    # Crisp label markings on center label (well clear of spindle collar)
    ldraw = ImageDraw.Draw(patch)
    f_lbl = load_font(int(radius * 0.115), bold=True)
    text_y = cy - int(radius * 0.275)
    w_txt = ldraw.textlength("SIDE A", font=f_lbl)
    ldraw.text((cx - w_txt / 2, text_y), "SIDE A", font=f_lbl, fill=l_hi + (250,))
    f_sub = load_font(int(radius * 0.095), bold=True)
    w_sub = ldraw.textlength("33⅓ RPM", font=f_sub)
    ldraw.text((cx - w_sub / 2, cy + int(radius * 0.165)), "33⅓ RPM", font=f_sub, fill=l_hi + (235,))
    return patch


def draw_tonearm(canvas, pivot_xy, elbow_xy, stylus_xy, arm_color, accent_color):
    """Draw brushed metallic turntable tonearm with shadow, gimbal pivot, and stylus headshell."""
    px0, py0 = pivot_xy
    ex, ey = elbow_xy
    sx, sy = stylus_xy

    # Shadow layer
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(sh)
    off = 6 * SS
    sdraw.ellipse((px0 - 15 * SS + off, py0 - 15 * SS + off, px0 + 15 * SS + off, py0 + 15 * SS + off), fill=(0, 0, 0, 120))
    sdraw.line([(px0 + off, py0 + off), (ex + off, ey + off), (sx + off, sy + off)], fill=(0, 0, 0, 115), width=5 * SS, joint="curve")
    sh = sh.filter(ImageFilter.GaussianBlur(radius=4 * SS))
    canvas.alpha_composite(sh)

    draw = ImageDraw.Draw(canvas)
    # Gimbal base
    draw.ellipse((px0 - 14 * SS, py0 - 14 * SS, px0 + 14 * SS, py0 + 14 * SS), fill=(36, 36, 42, 255), outline=accent_color, width=2 * SS)
    draw.ellipse((px0 - 8 * SS, py0 - 8 * SS, px0 + 8 * SS, py0 + 8 * SS), fill=arm_color)
    draw.ellipse((px0 - 3 * SS, py0 - 3 * SS, px0 + 3 * SS, py0 + 3 * SS), fill=(255, 255, 255, 220))

    # Counterweight behind pivot
    ang_back = math.atan2(py0 - ey, px0 - ex)
    cx_w = px0 + math.cos(ang_back) * 14 * SS
    cy_w = py0 + math.sin(ang_back) * 14 * SS
    draw.line([(px0, py0), (cx_w, cy_w)], fill=arm_color, width=6 * SS)
    draw.ellipse((cx_w - 6 * SS, cy_w - 6 * SS, cx_w + 6 * SS, cy_w + 6 * SS), fill=(72, 72, 82, 255), outline=accent_color, width=int(1.5 * SS))

    # Main arm + specular highlight
    draw.line([(px0, py0), (ex, ey), (sx, sy)], fill=arm_color, width=4 * SS, joint="curve")
    draw.line([(px0 - 1, py0 - 1), (ex - 1, ey - 1), (sx - 1, sy - 1)], fill=(255, 255, 255, 165), width=max(2, SS))

    # Headshell cartridge
    ang_head = math.atan2(sy - ey, sx - ex)
    hx2 = sx + math.cos(ang_head) * 11 * SS
    hy2 = sy + math.sin(ang_head) * 11 * SS
    draw.line([(sx, sy), (hx2, hy2)], fill=(26, 26, 32, 255), width=8 * SS)
    draw.line([(sx, sy), (hx2, hy2)], fill=accent_color, width=3 * SS)


def render_vinyl_frame(cfg):
    # Background gradient layer (2x)
    bg = Image.new("RGBA", (W, W), cfg["bg_top"] + (255,))
    bg_px = bg.load()
    t_r, t_g, t_b = cfg["bg_top"]
    b_r, b_g, b_b = cfg["bg_bot"]
    for y in range(W):
        ty = y / float(W - 1)
        row_r = int(t_r + (b_r - t_r) * ty)
        row_g = int(t_g + (b_g - t_g) * ty)
        row_b = int(t_b + (b_b - t_b) * ty)
        for x in range(W):
            # Subtle warm/violet radial corner glow
            dx = (x - W * 0.82) / (W * 0.65)
            dy = (y - W * 0.78) / (W * 0.65)
            rad = max(0.0, 1.0 - math.sqrt(dx * dx + dy * dy)) ** 2
            gr, gg, gb = cfg["ambient_glow"]
            bg_px[x, y] = (
                min(255, int(row_r + gr * rad * 0.22)),
                min(255, int(row_g + gg * rad * 0.22)),
                min(255, int(row_b + gb * rad * 0.22)),
                255,
            )

    # Punch rounded transparent photo window matching CUTOUT_BOX
    x1, y1, x2, y2 = [v * SS for v in CUTOUT_BOX]
    rad_px = 22 * SS

    alpha_mask = Image.new("L", (W, W), 255)
    am_draw = ImageDraw.Draw(alpha_mask)
    am_draw.rounded_rectangle((x1, y1, x2, y2), radius=rad_px, fill=0)
    bg.putalpha(alpha_mask)

    draw = ImageDraw.Draw(bg)

    # Subtle inset glow border around cutout
    draw.rounded_rectangle((x1 - 2, y1 - 2, x2 + 2, y2 + 2), radius=rad_px + 2, outline=cfg["frame_border"], width=2 * SS)

    # Top bar LED dots + Title
    dot_colors = cfg["dots"]
    for idx, dc in enumerate(dot_colors):
        dx = (38 + idx * 17) * SS
        dy = 21 * SS
        draw.ellipse((dx - 5 * SS, dy - 5 * SS, dx + 5 * SS, dy + 5 * SS), fill=dc + (255,))
    f_hdr = load_font(14 * SS, bold=True)
    draw.text((92 * SS, 12 * SS), cfg["header_text"], font=f_hdr, fill=cfg["header_color"] + (245,))

    # Bottom turntable console card
    dx1, dy1, dx2, dy2 = 24 * SS, 396 * SS, 488 * SS, 496 * SS
    draw.rounded_rectangle((dx1, dy1, dx2, dy2), radius=20 * SS, fill=cfg["deck_bg"], outline=cfg["deck_border"], width=max(2, int(1.5 * SS)))

    # Left side text & EQ visualizer on deck (leaving clear space on right for large vinyl disc)
    f_title = load_font(19 * SS, bold=True)
    f_sub = load_font(12 * SS, bold=False)
    draw.text((40 * SS, 408 * SS), cfg["deck_title"], font=f_title, fill=cfg["title_color"] + (255,))
    draw.text((40 * SS, 434 * SS), cfg["deck_sub"], font=f_sub, fill=cfg["sub_color"] + (235,))

    # Equalizer bars + speed badge
    eq_heights = [9, 17, 13, 21, 15, 24, 18, 11, 20, 14, 22, 12, 16, 10]
    for i, h in enumerate(eq_heights):
        bx = (40 + i * 9) * SS
        by2 = 480 * SS
        by1 = (480 - h) * SS
        c = cfg["eq_hi"] if i % 3 == 1 else cfg["eq_lo"]
        draw.rounded_rectangle((bx, by1, bx + 5 * SS, by2), radius=2 * SS, fill=c + (245,))

    # RPM pill
    draw.rounded_rectangle((176 * SS, 460 * SS, 250 * SS, 481 * SS), radius=10 * SS, fill=cfg["pill_bg"], outline=cfg["pill_border"], width=SS)
    f_pill = load_font(11 * SS, bold=True)
    draw.text((186 * SS, 463 * SS), "33⅓ RPM", font=f_pill, fill=cfg["pill_text"] + (255,))

    # Large Vinyl Disc drop shadow + glossy grooved disc overlapping bottom-right corner cleanly
    vcx, vcy = 414 * SS, 392 * SS
    v_rad = 87 * SS

    v_shadow = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    vs_draw = ImageDraw.Draw(v_shadow)
    vs_draw.ellipse((vcx - v_rad + 6 * SS, vcy - v_rad + 8 * SS, vcx + v_rad + 6 * SS, vcy + v_rad + 8 * SS), fill=(0, 0, 0, 165))
    v_shadow = v_shadow.filter(ImageFilter.GaussianBlur(radius=7 * SS))
    bg.alpha_composite(v_shadow)

    disc_patch = build_vinyl_disc_patch(v_rad, cfg["label_palette"], cfg["sheen_tint"])
    bg.alpha_composite(disc_patch, (vcx - disc_patch.width // 2, vcy - disc_patch.height // 2))

    # Metallic Turntable Tonearm anchored at top-right of deck/cutout edge
    draw_tonearm(
        bg,
        pivot_xy=(478 * SS, 290 * SS),
        elbow_xy=(469 * SS, 342 * SS),
        stylus_xy=(432 * SS, 362 * SS),
        arm_color=cfg["arm_color"],
        accent_color=cfg["arm_accent"],
    )

    # Blink-blink stars & soft glints layer (around frame corners and around vinyl rim, never blocking center face)
    glow_layer = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sp_layer = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sp_draw = ImageDraw.Draw(sp_layer)
    for (sx, sy, sr, sc) in cfg["sparkles"]:
        draw_sparkle(sp_draw, sx * SS, sy * SS, sr * SS, sc, glow_img=glow_layer, glow_color=cfg["sparkle_glow"])
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=6 * SS))
    bg.alpha_composite(glow_layer)
    bg.alpha_composite(sp_layer)

    return bg.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def render_picker_icon(frame_img, cfg):
    """Build crisp 128x128 RGBA picker icon matching existing assets/filters_v2 thumbnails."""
    icon = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)
    # Rounded card background
    draw.rounded_rectangle((6, 6, 250, 250), radius=46, fill=cfg["bg_top"] + (255,), outline=cfg["frame_border"], width=6)
    # White miniature cutout area at top
    draw.rounded_rectangle((28, 26, 228, 162), radius=24, fill=(248, 248, 252, 255))
    # Mini vinyl disc overlapping bottom-right of icon cutout
    mini_disc = build_vinyl_disc_patch(48, cfg["label_palette"], cfg["sheen_tint"])
    icon.alpha_composite(mini_disc, (186 - mini_disc.width // 2, 146 - mini_disc.height // 2))
    # Sparkles on icon (high-contrast accent color over light preview square)
    draw_sparkle(draw, 54, 48, 13, cfg["eq_hi"] + (255,))
    draw_sparkle(draw, 198, 44, 11, cfg["eq_hi"] + (255,))
    # Label pill at bottom
    draw.rounded_rectangle((24, 178, 232, 232), radius=22, fill=(14, 14, 18, 240))
    f_lbl = load_font(22, bold=True)
    tw = draw.textlength(cfg["icon_label"], font=f_lbl)
    draw.text((128 - tw / 2, 191), cfg["icon_label"], font=f_lbl, fill=cfg["title_color"] + (255,))
    return icon.resize((128, 128), Image.Resampling.LANCZOS)


CONFIGS = {
    "nm_dia_than_classic": {
        "bg_top": (18, 17, 21),
        "bg_bot": (34, 28, 24),
        "ambient_glow": (245, 196, 81),
        "frame_border": (235, 190, 92, 220),
        "dots": [(239, 68, 68), (245, 158, 11), (34, 197, 94)],
        "header_text": "NOW SPINNING  •  VINYL 33⅓",
        "header_color": (248, 216, 132),
        "deck_bg": (24, 22, 24, 246),
        "deck_border": (212, 175, 55, 150),
        "deck_title": "Đĩa Than Classic",
        "deck_sub": "Analog Stereo • Blink Gold",
        "title_color": (253, 230, 138),
        "sub_color": (214, 211, 209),
        "eq_hi": (251, 191, 36),
        "eq_lo": (217, 119, 6),
        "pill_bg": (45, 36, 22, 255),
        "pill_border": (245, 196, 81, 200),
        "pill_text": (254, 240, 138),
        "label_palette": ((146, 64, 14), (217, 119, 6), (254, 243, 199), (120, 53, 15)),
        "sheen_tint": (255, 220, 145),
        "arm_color": (218, 214, 204, 255),
        "arm_accent": (245, 196, 81, 255),
        "sparkle_glow": (253, 224, 71, 135),
        "sparkles": [
            (48, 56, 12, (254, 240, 138, 255)),
            (66, 48, 6, (255, 255, 255, 235)),
            (458, 56, 13, (254, 240, 138, 255)),
            (442, 72, 6, (255, 255, 255, 220)),
            (318, 20, 7, (254, 240, 138, 230)),
            (486, 148, 8, (254, 240, 138, 220)),
            (22, 220, 7, (254, 240, 138, 210)),
            (334, 332, 11, (254, 240, 138, 255)),
            (486, 326, 9, (255, 255, 255, 240)),
            (338, 466, 10, (254, 240, 138, 255)),
            (476, 466, 8, (255, 255, 255, 230)),
        ],
        "icon_label": "Đĩa Than Gold",
    },
    "nm_dia_than_hong": {
        "bg_top": (42, 20, 61),
        "bg_bot": (118, 34, 92),
        "ambient_glow": (244, 114, 182),
        "frame_border": (249, 168, 212, 235),
        "dots": [(244, 114, 182), (192, 132, 252), (125, 211, 252)],
        "header_text": "CHILL VIBES  •  BLINK VINYL",
        "header_color": (253, 218, 236),
        "deck_bg": (56, 23, 71, 235),
        "deck_border": (244, 114, 182, 175),
        "deck_title": "Đĩa Than Chill",
        "deck_sub": "Twilight Mix • Blink Pink",
        "title_color": (252, 231, 243),
        "sub_color": (233, 213, 255),
        "eq_hi": (244, 114, 182),
        "eq_lo": (192, 132, 252),
        "pill_bg": (88, 28, 135, 240),
        "pill_border": (249, 168, 212, 215),
        "pill_text": (252, 231, 243),
        "label_palette": ((157, 23, 77), (236, 72, 153), (252, 231, 243), (192, 132, 252)),
        "sheen_tint": (244, 164, 238),
        "arm_color": (245, 215, 232, 255),
        "arm_accent": (244, 114, 182, 255),
        "sparkle_glow": (249, 168, 212, 145),
        "sparkles": [
            (48, 56, 13, (255, 235, 250, 255)),
            (68, 49, 7, (233, 213, 255, 240)),
            (458, 58, 14, (255, 235, 250, 255)),
            (440, 74, 7, (249, 168, 212, 235)),
            (322, 20, 8, (249, 168, 212, 240)),
            (486, 148, 8, (255, 235, 250, 230)),
            (22, 220, 7, (249, 168, 212, 220)),
            (332, 332, 12, (255, 235, 250, 255)),
            (486, 326, 10, (249, 168, 212, 245)),
            (338, 466, 11, (255, 235, 250, 255)),
            (476, 466, 9, (233, 213, 255, 235)),
        ],
        "icon_label": "Đĩa Than Chill",
    },
}


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    os.makedirs(V2_ICONS_DIR, exist_ok=True)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    rendered = {}
    for fid, cfg in CONFIGS.items():
        frame_img = render_vinyl_frame(cfg)
        png_path = os.path.join(FRAMES_DIR, f"{fid}.png")
        frame_img.save(png_path, "PNG", optimize=True)

        raw_rgba = frame_img.convert("RGBA").tobytes()
        bin_path = os.path.join(BINS_DIR, f"{fid}.bin")
        with open(bin_path, "wb") as bf:
            bf.write(zlib.compress(raw_rgba, 9))

        icon_img = render_picker_icon(frame_img, cfg)
        icon_path = os.path.join(V2_ICONS_DIR, f"{fid}.png")
        icon_img.save(icon_path, "PNG", optimize=True)

        manifest[fid] = {"is4Cut": False, "windows": [CUTOUT_BOX]}
        rendered[fid] = frame_img
        print(f"Generated {fid}: png={os.path.getsize(png_path)}B, bin={os.path.getsize(bin_path)}B, icon={os.path.getsize(icon_path)}B")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"), ensure_ascii=False)

    # Render side-by-side preview composite with a simulated portrait backdrop
    sample = Image.new("RGBA", (SIZE * 2 + 24, SIZE), (24, 24, 28, 255))
    backdrop = Image.new("RGBA", (SIZE, SIZE), (48, 56, 72, 255))
    bdraw = ImageDraw.Draw(backdrop)
    for y in range(SIZE):
        c = int(42 + 65 * (y / SIZE))
        bdraw.line([(0, y), (SIZE, y)], fill=(c + 12, c + 18, c + 36, 255))
    bdraw.ellipse((196, 130, 316, 250), fill=(228, 188, 162, 255))
    bdraw.pieslice((156, 248, 356, 440), 180, 360, fill=(38, 42, 54, 255))

    for i, fid in enumerate(CONFIGS.keys()):
        comp = backdrop.copy()
        comp.alpha_composite(rendered[fid])
        sample.paste(comp, (i * (SIZE + 24), 0))

    scratch_dir = r"C:\Users\khoin\.gemini\antigravity\brain\d0194f46-5055-4c7d-9ec1-78a4855f4dae\scratch"
    os.makedirs(scratch_dir, exist_ok=True)
    preview_path = os.path.join(scratch_dir, "preview_vinyl_frames.png")
    sample.save(preview_path, "PNG")
    print("Preview saved:", preview_path)


if __name__ == "__main__":
    main()
