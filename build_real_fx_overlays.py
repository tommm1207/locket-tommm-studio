"""Build ALL 7 native 768x768 0-AI Kawaii Snow/Meitu-style full-frame RGBA overlays + .bin:
  - fx_ca_cute: pastel goldfish, smiling baby whale, pink jellyfish & water bubbles
  - fx_buom_xinh: pastel watercolor kawaii butterflies & soft shimmer dots
  - fx_canh_hoa: pastel watercolor sakura flowers & swirling petals in light DoF layers
  - fx_sticker_doodle: Korean pastel crayon doodles (hearts, daisies, ribbons, clouds, cherries)
  - fx_bong_bong: 4x-supersampled kawaii anime pastel translucent soap bubbles + sparkle glints
  - fx_cau_vong: pastel macaron rainbows, smiling suns, rainbow hearts & rain clouds
  - fx_sao_lap_lanh: kawaii pastel stars, crescent moons & glowing 4-pt kirakira sparkles

All 7 scatter evenly and airily across the ENTIRE 768x768 frame (NO hollow center hole, 0-AI, zero black fringes).
Outputs assets/frames/{fid}.png, assets/frames_bin/{fid}.bin, updates data/frames_manifest.json,
and renders scratch/kawaii_local_check.jpg (portrait + pure black canvas comparison).
"""

import json
import math
import os
import zlib

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(ROOT, "assets", "frames")
BINS_DIR = os.path.join(ROOT, "assets", "frames_bin")
MANIFEST_PATH = os.path.join(ROOT, "data", "frames_manifest.json")

SCRATCH = r"C:\Users\khoin\.gemini\antigravity\brain\d0194f46-5055-4c7d-9ec1-78a4855f4dae\scratch"
ARTIFACTS = r"C:\Users\khoin\.gemini\antigravity\brain\d0194f46-5055-4c7d-9ec1-78a4855f4dae"
ATLAS_NATURE = os.path.join(ARTIFACTS, "kawaii_pastel_sprite_sheet_1795833977405.jpg")
ATLAS_DOODLE = os.path.join(ARTIFACTS, "kawaii_doodle_sprite_sheet_v2_1795834033931.jpg")

OUT_SIZE = 768


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / max(1e-6, edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def unpremultiply_and_bleed(rgb_f, alpha, bg_rgb, min_alpha_div=0.35, bleed_iters=4):
    """Strip dark backdrop color bleed from semi-transparent boundaries cleanly."""
    a = np.clip(alpha, 0.0, 1.0)[..., None]
    bg = np.asarray(bg_rgb, dtype=np.float32).reshape(1, 1, 3)
    fg = (rgb_f - (1.0 - a) * bg) / np.maximum(a, min_alpha_div)
    fg = np.clip(fg, 0.0, 255.0)

    solid = alpha >= 0.84
    out = fg.copy()
    filled = solid.copy()
    cur = out.copy()
    kernel = np.ones((3, 3), np.float32)
    for _ in range(bleed_iters):
        cnt = cv2.filter2D(filled.astype(np.float32), -1, kernel, borderType=cv2.BORDER_REPLICATE)
        nbr_sum = cv2.filter2D(cur * filled[..., None].astype(np.float32), -1, kernel, borderType=cv2.BORDER_REPLICATE)
        need = (~filled) & (cnt > 0.5) & (alpha > 0.004)
        if not np.any(need):
            break
        avg = nbr_sum / np.maximum(cnt[..., None], 1.0)
        cur[need] = avg[need]
        filled[need] = True

    blend_w = np.clip((0.68 - alpha) / 0.68, 0.0, 1.0)[..., None]
    out = fg * (1.0 - blend_w) + cur * blend_w
    return np.clip(out, 0.0, 255.0)


def alpha_composite_rgba(dst_f, src_rgba_u8, x, y, opacity=1.0):
    """Straight-alpha composite src RGBA onto straight dst float32 RGBA cleanly."""
    sh, sw = src_rgba_u8.shape[:2]
    dh, dw = dst_f.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(dw, x + sw), min(dh, y + sh)
    if x1 <= x0 or y1 <= y0:
        return
    sx0, sy0 = x0 - x, y0 - y
    sx1, sy1 = sx0 + (x1 - x0), sy0 + (y1 - y0)

    patch = src_rgba_u8[sy0:sy1, sx0:sx1].astype(np.float32)
    sa = (patch[..., 3:4] / 255.0) * opacity
    srgb = patch[..., :3]

    da = dst_f[y0:y1, x0:x1, 3:4] / 255.0
    drgb = dst_f[y0:y1, x0:x1, :3]

    out_a = sa + da * (1.0 - sa)
    num = srgb * sa + drgb * da * (1.0 - sa)
    out_rgb = np.where(out_a > 1e-5, num / np.maximum(out_a, 1e-5), 0.0)

    dst_f[y0:y1, x0:x1, :3] = np.clip(out_rgb, 0.0, 255.0)
    dst_f[y0:y1, x0:x1, 3:4] = np.clip(out_a * 255.0, 0.0, 255.0)


def place_sprite(canvas_f, sprite_u8, cx, cy, target_max_dim, angle_deg=0.0, flip_x=False, dof_blur=0.0, opacity=1.0):
    sp = sprite_u8
    if flip_x:
        sp = np.ascontiguousarray(sp[:, ::-1, :])
    h, w = sp.shape[:2]
    scale = target_max_dim / max(h, w)
    nw, nh = max(4, int(round(w * scale))), max(4, int(round(h * scale)))
    interp = cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC

    f = sp.astype(np.float32)
    a = f[..., 3:4] / 255.0
    premul = np.concatenate([f[..., :3] * a, f[..., 3:4]], axis=2)
    premul_r = cv2.resize(premul, (nw, nh), interpolation=interp)

    if abs(angle_deg) > 0.2:
        M = cv2.getRotationMatrix2D((nw * 0.5, nh * 0.5), angle_deg, 1.0)
        cos_a, sin_a = abs(M[0, 0]), abs(M[0, 1])
        bw = int(math.ceil(nh * sin_a + nw * cos_a)) + 4
        bh = int(math.ceil(nh * cos_a + nw * sin_a)) + 4
        M[0, 2] += (bw - nw) * 0.5
        M[1, 2] += (bh - nh) * 0.5
        premul_r = cv2.warpAffine(premul_r, M, (bw, bh), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

    if dof_blur > 0.1:
        pad = int(math.ceil(dof_blur * 3))
        premul_r = cv2.copyMakeBorder(premul_r, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
        premul_r = cv2.GaussianBlur(premul_r, (0, 0), dof_blur)

    out_a = np.clip(premul_r[..., 3:4] / 255.0, 0.0, 1.0)
    out_rgb = np.where(out_a > 1e-4, premul_r[..., :3] / np.maximum(out_a, 1e-4), 0.0)
    final_u8 = np.concatenate([np.clip(out_rgb, 0, 255), np.clip(premul_r[..., 3:4], 0, 255)], axis=2).astype(np.uint8)

    fh, fw = final_u8.shape[:2]
    alpha_composite_rgba(canvas_f, final_u8, int(round(cx - fw * 0.5)), int(round(cy - fh * 0.5)), opacity=opacity)


def extract_row_sprites(img_path, y0_frac, y1_frac, min_gap=22, label=""):
    """Slice one horizontal row band on pure #000000 backdrop and extract intact RGBA sprites.
    Uses border flood-fill inside each column slice so dark kawaii eyes/smiles stay 100% opaque,
    while exterior dark background is cleanly un-premultiplied (zero dark fringe on white photos).
    """
    bgr = cv2.imread(img_path, cv2.IMREAD_COLOR)
    rgb_full = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    H, W = rgb_full.shape[:2]
    y0, y1 = int(round(y0_frac * H)), int(round(y1_frac * H))
    band = rgb_full[y0:y1]
    bh, bw = band.shape[:2]

    max_ch = np.max(band, axis=2)
    col_active = np.max(max_ch, axis=0) > 22.0

    # Find horizontal intervals with small gap merging so multi-part doodles (sun+rays, raincloud+drops, 3-sparkle) stay whole
    segs = []
    in_seg = False
    sx = 0
    gap = 0
    for x in range(bw):
        if col_active[x]:
            if not in_seg:
                sx = x
                in_seg = True
            gap = 0
        else:
            if in_seg:
                gap += 1
                if gap > min_gap:
                    ex = x - gap + 1
                    if ex - sx >= 28:
                        segs.append((sx, ex))
                    in_seg = False
    if in_seg and bw - sx >= 28:
        segs.append((sx, bw))

    sprites = []
    for x0, x1 in segs:
        pad_x = 6
        cx0, cx1 = max(0, x0 - pad_x), min(bw, x1 + pad_x)
        cell_rgb = band[:, cx0:cx1]
        c_max = np.max(cell_rgb, axis=2)
        rows = np.where(np.max(c_max, axis=1) > 18.0)[0]
        if len(rows) == 0:
            continue
        ry0, ry1 = max(0, int(rows.min()) - 6), min(bh, int(rows.max()) + 7)
        patch = cell_rgb[ry0:ry1]
        ph, pw = patch.shape[:2]
        p_max = np.max(patch, axis=2)

        # Flood-fill exterior black pixels from patch border (keeps internal dark eyes/smiles enclosed & solid!)
        bg_cand = (p_max < 20.0).astype(np.uint8)
        ff = bg_cand.copy()
        mask_ff = np.zeros((ph + 2, pw + 2), np.uint8)
        for bx in range(pw):
            if ff[0, bx] == 1:
                cv2.floodFill(ff, mask_ff, (bx, 0), 2)
            if ff[ph - 1, bx] == 1:
                cv2.floodFill(ff, mask_ff, (bx, ph - 1), 2)
        for by in range(ph):
            if ff[by, 0] == 1:
                cv2.floodFill(ff, mask_ff, (0, by), 2)
            if ff[by, pw - 1] == 1:
                cv2.floodFill(ff, mask_ff, (pw - 1, by), 2)
        ext_bg = (ff == 2)
        enclosed_interior = ~ext_bg & (p_max < 20.0)

        alpha = np.where(ext_bg, 0.0, smoothstep(8.0, 38.0, p_max))
        # Dilate 1px around enclosed interior eyes/mouths to keep them crisp opaque
        enclosed_dil = cv2.dilate(enclosed_interior.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        alpha = np.where(enclosed_dil, 1.0, alpha)
        alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.45)

        fg_clean = unpremultiply_and_bleed(patch, alpha, [0.0, 0.0, 0.0], min_alpha_div=0.38, bleed_iters=4)
        rgba = np.concatenate([fg_clean, (np.clip(alpha, 0, 1) * 255.0)[..., None]], axis=2).astype(np.uint8)
        ys, xs = np.where(rgba[..., 3] > 6)
        if len(ys):
            rgba = rgba[max(0, ys.min() - 2):min(ph, ys.max() + 3), max(0, xs.min() - 2):min(pw, xs.max() + 3)]
            sprites.append(rgba)

    print(f"Extracted {len(sprites)} kawaii sprites from {label}")
    return sprites


def generate_jittered_positions(cols, rows, margin, seed, keep_prob=0.90, min_dist=72.0):
    rng = np.random.default_rng(seed)
    cw = (OUT_SIZE - 2 * margin) / cols
    ch = (OUT_SIZE - 2 * margin) / rows
    pts = []
    cells = [(c, r) for r in range(rows) for c in range(cols)]
    rng.shuffle(cells)
    for c, r in cells:
        if rng.random() > keep_prob:
            continue
        cx = margin + (c + 0.5 + (rng.random() - 0.5) * 0.62) * cw
        cy = margin + (r + 0.5 + (rng.random() - 0.5) * 0.62) * ch
        if all((cx - px) ** 2 + (cy - py) ** 2 >= min_dist ** 2 for px, py in pts):
            pts.append((float(cx), float(cy)))
    return pts, rng


def make_pastel_bubble_sprite(diam_px, hue_shift=0.0):
    """Render 4x-supersampled anime/kawaii pastel iridescent translucent bubble sprite."""
    ss = 4
    S = diam_px * ss
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    nx = (xx - S * 0.5) / (S * 0.46)
    ny = (yy - S * 0.5) / (S * 0.46)
    r2 = nx * nx + ny * ny
    r = np.sqrt(np.maximum(0.0, r2))
    nz = np.sqrt(np.maximum(0.01, 1.0 - np.minimum(1.0, r2)))

    inside = 1.0 - smoothstep(0.96, 1.005, r)
    ang = np.arctan2(ny, nx) + hue_shift

    # Soft pastel iridescent thin-film sheen (concentrated near rim, airy translucent interior)
    fresnel = np.power(np.clip(r, 0, 1), 3.4) * (0.60 + 0.40 * np.sin(ang * 2.0 + hue_shift))
    p_r = 185 + 70 * np.cos(ang * 1.1 + r * 3.0)
    p_g = 190 + 65 * np.cos(ang * 1.1 + r * 3.0 + 2.094)
    p_b = 205 + 50 * np.cos(ang * 1.1 + r * 3.0 + 4.188)

    # Outer soft pastel rim outline + crisp anime inner white highlight arc + opposite catchlight
    rim_ring = np.exp(-((r - 0.935) / 0.045) ** 2)
    arc1 = np.power(np.clip(-nx * 0.60 - ny * 0.72 + nz * 0.35, 0, 1), 22.0)
    arc2 = np.power(np.clip(nx * 0.52 + ny * 0.66 + nz * 0.54, 0, 1), 30.0)
    tiny_dot = np.exp(-(((nx + 0.52) ** 2 + (ny + 0.52) ** 2) / 0.009))

    # Alpha: delicate clear interior (0.10) + vivid pastel rim (0.58) + bright white specular highlights (0.92)
    spec_val = np.clip(arc1 * 0.88 + arc2 * 0.35 + tiny_dot * 0.90, 0.0, 1.0)
    alpha = inside * np.clip(0.08 + 0.44 * fresnel + 0.38 * rim_ring + 0.88 * spec_val, 0.0, 0.96)

    # Blend RGB between translucent pastel tint and pure creamy specular white
    rgb_r = np.clip(p_r * (1.0 - spec_val) + 255.0 * spec_val, 0, 255)
    rgb_g = np.clip(p_g * (1.0 - spec_val) + 255.0 * spec_val, 0, 255)
    rgb_b = np.clip(p_b * (1.0 - spec_val) + 255.0 * spec_val, 0, 255)

    rgba_ss = np.stack([rgb_r, rgb_g, rgb_b, alpha * 255.0], axis=2).astype(np.float32)
    premul = np.concatenate([rgba_ss[..., :3] * (rgba_ss[..., 3:4] / 255.0), rgba_ss[..., 3:4]], axis=2)
    down = cv2.resize(premul, (diam_px, diam_px), interpolation=cv2.INTER_AREA)
    da = np.clip(down[..., 3:4] / 255.0, 0.0, 1.0)
    drgb = np.where(da > 1e-4, down[..., :3] / np.maximum(da, 1e-4), 0.0)
    return np.concatenate([np.clip(drgb, 0, 255), np.clip(down[..., 3:4], 0, 255)], axis=2).astype(np.uint8)


def make_sparkle_4pt_sprite(diam_px, col_rgb=(255, 244, 210), halo_rgb=(255, 215, 232)):
    """Render 4x-supersampled soft pastel glowing kawaii 4-point kirakira star."""
    ss = 4
    S = diam_px * ss
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    nx = np.abs(xx - S * 0.5) / (S * 0.44)
    ny = np.abs(yy - S * 0.5) / (S * 0.44)
    r = np.sqrt(nx * nx + ny * ny)
    # 4-point concave diamond star curve (superformula / L_0.45)
    star_d = np.power(nx + 1e-5, 0.46) + np.power(ny + 1e-5, 0.46)
    star_body = 1.0 - smoothstep(0.88, 1.02, star_d)
    soft_halo = np.exp(-r * r * 3.8) * 0.36
    alpha = np.clip(star_body * 0.94 + soft_halo, 0.0, 0.96)
    w_core = np.clip(star_body, 0.0, 1.0)[..., None]
    col = np.asarray(col_rgb, dtype=np.float32).reshape(1, 1, 3)
    hcol = np.asarray(halo_rgb, dtype=np.float32).reshape(1, 1, 3)
    rgb = col * w_core + hcol * (1.0 - w_core)

    rgba_ss = np.concatenate([rgb, (alpha * 255.0)[..., None]], axis=2).astype(np.float32)
    premul = np.concatenate([rgba_ss[..., :3] * (rgba_ss[..., 3:4] / 255.0), rgba_ss[..., 3:4]], axis=2)
    down = cv2.resize(premul, (diam_px, diam_px), interpolation=cv2.INTER_AREA)
    da = np.clip(down[..., 3:4] / 255.0, 0.0, 1.0)
    drgb = np.where(da > 1e-4, down[..., :3] / np.maximum(da, 1e-4), 0.0)
    return np.concatenate([np.clip(drgb, 0, 255), np.clip(down[..., 3:4], 0, 255)], axis=2).astype(np.uint8)


def make_pastel_dot_sprite(diam_px, col_rgb):
    ss = 4
    S = diam_px * ss
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    nx = (xx - S * 0.5) / (S * 0.42)
    ny = (yy - S * 0.5) / (S * 0.42)
    r = np.sqrt(nx * nx + ny * ny)
    a = np.clip((1.0 - smoothstep(0.45, 1.0, r)) * 0.82, 0.0, 0.85)
    rgba = np.zeros((diam_px, diam_px, 4), dtype=np.uint8)
    a_d = cv2.resize(a, (diam_px, diam_px), interpolation=cv2.INTER_AREA)
    rgba[..., 0] = col_rgb[0]
    rgba[..., 1] = col_rgb[1]
    rgba[..., 2] = col_rgb[2]
    rgba[..., 3] = np.clip(a_d * 255.0, 0, 255).astype(np.uint8)
    return rgba


def build_all_7_kawaii():
    # Atlas 1: Nature (Sea critters Row 1, Butterflies Row 2, Sakura Row 3)
    sea = extract_row_sprites(ATLAS_NATURE, 0.00, 0.34, min_gap=20, label="Atlas1-Sea")
    butterflies = extract_row_sprites(ATLAS_NATURE, 0.34, 0.67, min_gap=20, label="Atlas1-Butterflies")
    sakura = extract_row_sprites(ATLAS_NATURE, 0.67, 1.00, min_gap=20, label="Atlas1-Sakura")

    # Atlas 2: Doodles & Sky (Doodles Row 1, Rainbows Row 2, Sparkles Row 3)
    doodles = extract_row_sprites(ATLAS_DOODLE, 0.00, 0.34, min_gap=8, label="Atlas2-Doodles")
    rainbows = extract_row_sprites(ATLAS_DOODLE, 0.34, 0.67, min_gap=8, label="Atlas2-Rainbows")
    sparkles = extract_row_sprites(ATLAS_DOODLE, 0.67, 1.00, min_gap=10, label="Atlas2-Sparkles")

    # 1. fx_ca_cute: Dainty pastel goldfish/whales/jellyfish + mini water bubbles scattered evenly full-frame
    c_fish = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(6, 5, margin=42, seed=101, keep_prob=0.92, min_dist=96)
    for i, (cx, cy) in enumerate(pts):
        sp = sea[i % len(sea)]
        sz = float(rng.uniform(46, 68))
        ang = float(rng.uniform(-20, 20))
        flp = bool(rng.integers(0, 2))
        place_sprite(c_fish, sp, cx, cy, sz, angle_deg=ang, flip_x=flp, opacity=0.90)
    bubble_tiny = make_pastel_bubble_sprite(26, 0.4)
    b_pts, b_rng = generate_jittered_positions(5, 5, margin=28, seed=102, keep_prob=0.72, min_dist=84)
    for cx, cy in b_pts:
        place_sprite(c_fish, bubble_tiny, cx, cy, float(b_rng.uniform(14, 24)), opacity=0.82)

    # 2. fx_buom_xinh: Dainty pastel watercolor butterflies + soft fairy shimmer dots evenly full-frame
    c_bfly = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(6, 5, margin=42, seed=201, keep_prob=0.92, min_dist=94)
    for i, (cx, cy) in enumerate(pts):
        sp = butterflies[i % len(butterflies)]
        sz = float(rng.uniform(46, 68))
        ang = float(rng.uniform(-34, 34))
        flp = bool(rng.integers(0, 2))
        place_sprite(c_bfly, sp, cx, cy, sz, angle_deg=ang, flip_x=flp, opacity=0.91)
    dot_cols = [(191, 219, 254), (251, 207, 232), (221, 214, 254), (254, 240, 138)]
    d_pts, d_rng = generate_jittered_positions(6, 6, margin=24, seed=202, keep_prob=0.68, min_dist=70)
    for i, (cx, cy) in enumerate(d_pts):
        place_sprite(c_bfly, make_pastel_dot_sprite(16, dot_cols[i % len(dot_cols)]), cx, cy, float(d_rng.uniform(8, 14)), opacity=0.75)

    # 3. fx_canh_hoa: Dainty hand-painted sakura flowers & swirling blush-pink petals full-frame
    c_sakura = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(6, 6, margin=36, seed=301, keep_prob=0.94, min_dist=82)
    # Weight 65% swirling petals (indices 2,3,4), 35% full blooms (indices 0,1)
    weights = [0, 1, 2, 3, 4, 2, 3, 4]
    for i, (cx, cy) in enumerate(pts):
        sp_idx = weights[i % len(weights)]
        sp = sakura[sp_idx % len(sakura)]
        is_flower = sp_idx < 2
        sz = float(rng.uniform(44, 62) if is_flower else rng.uniform(34, 52))
        ang = float(rng.uniform(-24, 24) if is_flower else rng.uniform(-180, 180))
        blur = 1.6 if (not is_flower and i % 9 == 0) else 0.0
        if blur > 0:
            sz *= 1.25
        place_sprite(c_sakura, sp, cx, cy, sz, angle_deg=ang, dof_blur=blur, opacity=0.88)

    # 4. fx_sticker_doodle: Korean pastel hand-drawn crayon doodles scattered evenly full-frame
    c_doodle = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    doodle_pool = doodles + ([sparkles[0], sparkles[1]] if len(sparkles) >= 2 else [])
    pts, rng = generate_jittered_positions(6, 5, margin=42, seed=401, keep_prob=0.92, min_dist=92)
    for i, (cx, cy) in enumerate(pts):
        sp = doodle_pool[i % len(doodle_pool)]
        sz = float(rng.uniform(40, 62))
        ang = float(rng.uniform(-22, 22))
        flp = bool(rng.integers(0, 2)) if (i % len(doodle_pool) in (3, 4)) else False
        place_sprite(c_doodle, sp, cx, cy, sz, angle_deg=ang, flip_x=flp, opacity=0.92)

    # 5. fx_bong_bong: Kawaii anime pastel translucent soap bubbles scattered evenly full-frame
    c_bubble = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    bubble_variants = [make_pastel_bubble_sprite(88, h) for h in (0.0, 1.4, 2.8, 4.3)]
    mini_star = make_sparkle_4pt_sprite(32, (255, 255, 255), (224, 242, 254))
    pts, rng = generate_jittered_positions(6, 6, margin=36, seed=501, keep_prob=0.94, min_dist=84)
    for i, (cx, cy) in enumerate(pts):
        sp = bubble_variants[i % len(bubble_variants)]
        sz = float(rng.uniform(34, 78) if i % 4 != 0 else rng.uniform(22, 34))
        ang = float(rng.uniform(-18, 18))
        place_sprite(c_bubble, sp, cx, cy, sz, angle_deg=ang, opacity=0.90)
        if sz > 54 and i % 3 == 0:
            place_sprite(c_bubble, mini_star, cx - sz * 0.28, cy - sz * 0.28, sz * 0.26, opacity=0.92)

    # 6. fx_cau_vong: Pastel macaron rainbows, smiling suns, rainbow hearts & rain clouds full-frame
    c_rainbow = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(5, 5, margin=48, seed=601, keep_prob=0.94, min_dist=104)
    for i, (cx, cy) in enumerate(pts):
        sp = rainbows[i % len(rainbows)]
        # Make wide rainbow arc slightly larger so clouds at ends stay crisp
        sz = float(rng.uniform(54, 76) if (i % len(rainbows) == 0) else rng.uniform(44, 62))
        ang = float(rng.uniform(-16, 16))
        place_sprite(c_rainbow, sp, cx, cy, sz, angle_deg=ang, opacity=0.90)
    r_dots, r_rng = generate_jittered_positions(6, 5, margin=26, seed=602, keep_prob=0.65, min_dist=74)
    r_cols = [(254, 205, 211), (254, 240, 138), (167, 243, 208), (186, 230, 253), (221, 214, 254)]
    for i, (cx, cy) in enumerate(r_dots):
        place_sprite(c_rainbow, make_pastel_dot_sprite(16, r_cols[i % len(r_cols)]), cx, cy, float(r_rng.uniform(8, 13)), opacity=0.80)

    # 7. fx_sao_lap_lanh: Kawaii pastel stars, crescent moons & bright glowing 4-pt kirakira sparkles full-frame
    c_sparkle = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(6, 6, margin=36, seed=701, keep_prob=0.94, min_dist=80)
    for i, (cx, cy) in enumerate(pts):
        sp = sparkles[i % len(sparkles)]
        sz = float(rng.uniform(36, 58))
        ang = float(rng.uniform(-22, 22))
        place_sprite(c_sparkle, sp, cx, cy, sz, angle_deg=ang, opacity=0.92)
    kira_gold = make_sparkle_4pt_sprite(44, (255, 250, 220), (254, 215, 170))
    kira_pink = make_sparkle_4pt_sprite(44, (255, 245, 252), (251, 207, 232))
    k_pts, k_rng = generate_jittered_positions(6, 6, margin=24, seed=702, keep_prob=0.76, min_dist=64)
    for i, (cx, cy) in enumerate(k_pts):
        # Avoid sitting directly on top of a big sprite if too close
        if any((cx - px) ** 2 + (cy - py) ** 2 < 34 ** 2 for px, py in pts):
            continue
        sp = kira_gold if i % 2 == 0 else kira_pink
        place_sprite(c_sparkle, sp, cx, cy, float(k_rng.uniform(16, 28)), angle_deg=float(k_rng.uniform(-12, 12)), opacity=0.90)

    return [
        ("fx_ca_cute", np.clip(c_fish, 0, 255).astype(np.uint8)),
        ("fx_buom_xinh", np.clip(c_bfly, 0, 255).astype(np.uint8)),
        ("fx_canh_hoa", np.clip(c_sakura, 0, 255).astype(np.uint8)),
        ("fx_sticker_doodle", np.clip(c_doodle, 0, 255).astype(np.uint8)),
        ("fx_bong_bong", np.clip(c_bubble, 0, 255).astype(np.uint8)),
        ("fx_cau_vong", np.clip(c_rainbow, 0, 255).astype(np.uint8)),
        ("fx_sao_lap_lanh", np.clip(c_sparkle, 0, 255).astype(np.uint8)),
    ]


def save_overlay(fid, rgba_u8):
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    png_path = os.path.join(FRAMES_DIR, f"{fid}.png")
    bin_path = os.path.join(BINS_DIR, f"{fid}.bin")
    Image.fromarray(rgba_u8).save(png_path, "PNG")
    with open(bin_path, "wb") as bf:
        bf.write(zlib.compress(rgba_u8.tobytes(), level=9))
    print(f"Saved {fid}: {rgba_u8.shape[:2]} png={os.path.getsize(png_path)}B bin={os.path.getsize(bin_path)}B")


def build_local_check(overlays):
    portrait = Image.open(os.path.join(ROOT, "assets", "preview_model.png")).convert("RGB")
    pw, ph = portrait.size
    m = min(pw, ph)
    p_sq = portrait.crop(((pw - m) // 2, (ph - m) // 2, (pw + m) // 2, (ph + m) // 2)).resize((384, 384), Image.Resampling.LANCZOS).convert("RGBA")
    dark_sq = Image.new("RGBA", (384, 384), (10, 10, 13, 255))

    sheet = Image.new("RGB", (384 * len(overlays), 384 * 2 + 40), (20, 20, 26))
    draw = ImageDraw.Draw(sheet)
    for idx, (fid, rgba_u8) in enumerate(overlays):
        ov_im = Image.fromarray(rgba_u8).resize((384, 384), Image.Resampling.LANCZOS)
        c1 = Image.alpha_composite(p_sq.copy(), ov_im).convert("RGB")
        c2 = Image.alpha_composite(dark_sq.copy(), ov_im).convert("RGB")
        sheet.paste(c1, (idx * 384, 0))
        sheet.paste(c2, (idx * 384, 384))
        draw.text((idx * 384 + 12, 778), fid, fill=(245, 245, 250))

    out = os.path.join(SCRATCH, "kawaii_local_check.jpg")
    sheet.save(out, "JPEG", quality=93)
    print("Saved local verification sheet:", out)


def main():
    overlays = build_all_7_kawaii()
    for fid, rgba_u8 in overlays:
        save_overlay(fid, rgba_u8)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as mf:
        manifest = json.load(mf)
    for fid, _ in overlays:
        manifest[fid] = {"is4Cut": False, "windows": [[0, 0, 512, 512]]}
    with open(MANIFEST_PATH, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, separators=(",", ":"))
    print("Updated data/frames_manifest.json -> total frames:", len(manifest))

    build_local_check(overlays)


if __name__ == "__main__":
    main()
