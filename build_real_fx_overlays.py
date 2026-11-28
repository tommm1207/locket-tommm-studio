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


def downsample_premul(rgba_f, dst_w, dst_h):
    a = np.clip(rgba_f[..., 3:4] / 255.0, 0.0, 1.0)
    pre = np.concatenate([rgba_f[..., :3] * a, rgba_f[..., 3:4]], axis=2)
    down = cv2.resize(pre, (dst_w, dst_h), interpolation=cv2.INTER_AREA)
    da = np.clip(down[..., 3:4] / 255.0, 0.0, 1.0)
    drgb = np.where(da > 1e-4, down[..., :3] / np.maximum(da, 1e-4), 0.0)
    return np.concatenate([np.clip(drgb, 0, 255), np.clip(down[..., 3:4], 0, 255)], axis=2)


def add_luminous_sprite_aura(sprite_layer_f, glow_rgb, sigma=5.5, strength=0.22):
    """Add soft dreamy outer light halo underneath scattered sprites so they blend naturally."""
    a = np.clip(sprite_layer_f[..., 3] / 255.0, 0.0, 1.0)
    blur_a = cv2.GaussianBlur(a, (0, 0), sigma)
    glow_a = np.clip(blur_a * strength, 0.0, 0.28)
    glow = np.zeros_like(sprite_layer_f)
    glow[..., 0] = glow_rgb[0]
    glow[..., 1] = glow_rgb[1]
    glow[..., 2] = glow_rgb[2]
    glow[..., 3] = glow_a * 255.0
    fg_u8 = np.clip(sprite_layer_f, 0, 255).astype(np.uint8)
    alpha_composite_rgba(glow, fg_u8, 0, 0, opacity=1.0)
    return glow


def draw_snow_connecting_accents(theme, bokeh_col, accent_cols, seed):
    """Render 2x-supersampled dreamy soft pastel bokeh orbs + delicate Snow/Meitu hand-drawn accents."""
    S = OUT_SIZE * 2  # 1536x1536
    rng = np.random.default_rng(seed)

    # 1. Soft dreamy out-of-focus pastel bokeh orbs
    bokeh = np.zeros((S, S, 4), dtype=np.float32)
    n_bokeh = 22 if theme in ("bong_bong", "sao_lap_lanh") else 16
    for k in range(n_bokeh):
        bx = int(rng.uniform(40, S - 40))
        by = int(rng.uniform(40, S - 40))
        br = int(rng.uniform(36, 108))
        tmp = np.zeros((S, S), dtype=np.float32)
        cv2.circle(tmp, (bx, by), br, 1.0, thickness=-1, lineType=cv2.LINE_AA)
        cv2.circle(tmp, (bx, by), max(4, br - 4), 1.35, thickness=4, lineType=cv2.LINE_AA)
        tmp = cv2.GaussianBlur(tmp, (0, 0), max(4.0, br * 0.18))
        alpha_orb = float(rng.uniform(0.08, 0.14))
        c = bokeh_col if k % 2 == 0 else accent_cols[k % len(accent_cols)]
        orb_a = np.clip(tmp * alpha_orb, 0.0, 0.18)
        cur_a = bokeh[..., 3] / 255.0
        new_a = orb_a + cur_a * (1.0 - orb_a)
        for ch_i, val in enumerate(c):
            bokeh[..., ch_i] = np.where(new_a > 1e-5, (val * orb_a + bokeh[..., ch_i] * cur_a * (1.0 - orb_a)) / np.maximum(new_a, 1e-5), 0.0)
        bokeh[..., 3] = new_a * 255.0

    # 2. Delicate anti-aliased Snow/Meitu hand-drawn connecting strokes
    acc = np.zeros((S, S, 4), dtype=np.float32)

    def blend_stroke(mask_1ch, col_rgb, alpha_mul):
        sa = np.clip(mask_1ch * alpha_mul, 0.0, 0.65)
        da = acc[..., 3] / 255.0
        oa = sa + da * (1.0 - sa)
        for ch_i, val in enumerate(col_rgb):
            acc[..., ch_i] = np.where(oa > 1e-5, (val * sa + acc[..., ch_i] * da * (1.0 - sa)) / np.maximum(oa, 1e-5), 0.0)
        acc[..., 3] = oa * 255.0

    def draw_mini_cross(cx, cy, r, col_rgb, op=0.48):
        m = np.zeros((S, S), dtype=np.float32)
        cv2.line(m, (int(cx - r), int(cy)), (int(cx + r), int(cy)), 1.0, 3, cv2.LINE_AA)
        cv2.line(m, (int(cx), int(cy - r)), (int(cx), int(cy + r)), 1.0, 3, cv2.LINE_AA)
        cv2.circle(m, (int(cx), int(cy)), max(2, int(r * 0.25)), 1.0, -1, cv2.LINE_AA)
        blend_stroke(m, col_rgb, op)

    def draw_curve(cx, cy, radius, ang_start, ang_span, col_rgb, dashed=False, op=0.42):
        m = np.zeros((S, S), dtype=np.float32)
        steps = 12 if dashed else 28
        pts_c = []
        for s_i in range(steps + 1):
            t = s_i / steps
            a = math.radians(ang_start + t * ang_span)
            px = cx + math.cos(a) * radius
            py = cy + math.sin(a) * radius * 0.62
            pts_c.append((px, py))
        if dashed:
            for j in range(0, len(pts_c), 2):
                px, py = pts_c[j]
                dr = 4 if j % 4 == 0 else 3
                cv2.circle(m, (int(px), int(py)), dr, 1.0, -1, cv2.LINE_AA)
        else:
            for j in range(len(pts_c) - 1):
                cv2.line(m, (int(pts_c[j][0]), int(pts_c[j][1])), (int(pts_c[j + 1][0]), int(pts_c[j + 1][1])), 1.0, 3, cv2.LINE_AA)
        blend_stroke(m, col_rgb, op)

    if theme == "ca_cute":
        # Wispy water-ripple waves + 3-dot rising bubble trails
        for k in range(12):
            cx, cy = rng.uniform(110, S - 110), rng.uniform(110, S - 110)
            c = accent_cols[k % len(accent_cols)]
            if k % 2 == 0:
                m = np.zeros((S, S), dtype=np.float32)
                p0 = [(int(cx - 28 + j * 8), int(cy + math.sin(j * 0.9) * 7)) for j in range(8)]
                for j in range(len(p0) - 1):
                    cv2.line(m, p0[j], p0[j + 1], 1.0, 3, cv2.LINE_AA)
                blend_stroke(m, c, 0.40)
            else:
                m = np.zeros((S, S), dtype=np.float32)
                for j, r_d in enumerate((5, 3, 2)):
                    cv2.circle(m, (int(cx + j * 5), int(cy - j * 14)), r_d, 1.0, 2 if j == 0 else -1, cv2.LINE_AA)
                blend_stroke(m, (224, 247, 255), 0.45)

    elif theme == "buom_xinh":
        # Dotted flutter trails + delicate pastel 4-pt sparkle crosses
        for k in range(14):
            cx, cy = rng.uniform(120, S - 120), rng.uniform(120, S - 120)
            c = accent_cols[k % len(accent_cols)]
            if k % 2 == 0:
                draw_curve(cx, cy, rng.uniform(46, 78), rng.uniform(0, 360), rng.uniform(55, 85), c, dashed=True, op=0.44)
            else:
                draw_mini_cross(cx, cy, rng.uniform(10, 16), (255, 250, 240), op=0.46)

    elif theme == "canh_hoa":
        # Delicate blush breeze swirls + soft cherry pollen dots
        for k in range(14):
            cx, cy = rng.uniform(110, S - 110), rng.uniform(110, S - 110)
            c = accent_cols[k % len(accent_cols)]
            if k % 2 == 0:
                draw_curve(cx, cy, rng.uniform(52, 86), rng.uniform(0, 360), rng.uniform(50, 80), c, dashed=False, op=0.34)
            else:
                m = np.zeros((S, S), dtype=np.float32)
                for j in range(3):
                    cv2.circle(m, (int(cx + rng.uniform(-16, 16)), int(cy + rng.uniform(-16, 16))), 3, 1.0, -1, cv2.LINE_AA)
                blend_stroke(m, (255, 228, 238), 0.46)

    elif theme == "sticker_doodle":
        # Korean Purikura hand-drawn micro hearts, mini crosses, squiggles & confetti
        for k in range(16):
            cx, cy = rng.uniform(110, S - 110), rng.uniform(110, S - 110)
            c = accent_cols[k % len(accent_cols)]
            mode = k % 3
            if mode == 0:
                draw_mini_cross(cx, cy, rng.uniform(10, 16), c, op=0.48)
            elif mode == 1:
                m = np.zeros((S, S), dtype=np.float32)
                p0 = [(int(cx - 24 + j * 8), int(cy + math.sin(j * 1.1) * 7)) for j in range(7)]
                for j in range(len(p0) - 1):
                    cv2.line(m, p0[j], p0[j + 1], 1.0, 3, cv2.LINE_AA)
                blend_stroke(m, c, 0.42)
            else:
                m = np.zeros((S, S), dtype=np.float32)
                # Tiny open kawaii heart
                pts_h = []
                for t_i in range(25):
                    t = 2 * math.pi * t_i / 24
                    hx = cx + 16 * (math.sin(t) ** 3) * 0.75
                    hy = cy - (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) * 0.75
                    pts_h.append((int(hx), int(hy)))
                for j in range(len(pts_h) - 1):
                    cv2.line(m, pts_h[j], pts_h[j + 1], 1.0, 3, cv2.LINE_AA)
                blend_stroke(m, (255, 195, 215), 0.46)

    elif theme == "bong_bong":
        # Crisp delicate white/cyan sparkle crosses connecting bubbles
        for k in range(14):
            cx, cy = rng.uniform(100, S - 100), rng.uniform(100, S - 100)
            draw_mini_cross(cx, cy, rng.uniform(9, 16), (245, 252, 255), op=0.46)

    elif theme == "cau_vong":
        # Wispy pastel shimmer arcs + tiny cream sparkle stars
        for k in range(14):
            cx, cy = rng.uniform(110, S - 110), rng.uniform(110, S - 110)
            c = accent_cols[k % len(accent_cols)]
            if k % 2 == 0:
                draw_curve(cx, cy, rng.uniform(50, 82), rng.uniform(0, 360), rng.uniform(45, 75), c, dashed=True, op=0.42)
            else:
                draw_mini_cross(cx, cy, rng.uniform(10, 16), (255, 248, 224), op=0.48)

    elif theme == "sao_lap_lanh":
        # Connecting diagonal champagne-gold fairy dust dots & hairline crosses
        for k in range(16):
            cx, cy = rng.uniform(90, S - 90), rng.uniform(90, S - 90)
            if k % 2 == 0:
                draw_mini_cross(cx, cy, rng.uniform(9, 15), (255, 250, 226), op=0.50)
            else:
                m = np.zeros((S, S), dtype=np.float32)
                for j in range(3):
                    cv2.circle(m, (int(cx + j * 14), int(cy - j * 9)), 3 - (j % 2), 1.0, -1, cv2.LINE_AA)
                blend_stroke(m, (255, 240, 200), 0.45)

    # Composite acc over bokeh, then downsample premultiplied 2x -> 1x (768x768)
    alpha_composite_rgba(bokeh, np.clip(acc, 0, 255).astype(np.uint8), 0, 0, opacity=1.0)
    return downsample_premul(bokeh, OUT_SIZE, OUT_SIZE)


def add_dreamy_pastel_frame(canvas_f, tint_rgb):
    """Add soft whisper-thin Snow/Meitu pastel edge mist + rounded hairline inner border & corner glints."""
    S = OUT_SIZE * 2
    yy, xx = np.mgrid[0:OUT_SIZE, 0:OUT_SIZE].astype(np.float32)
    edge_d = np.minimum(np.minimum(xx, OUT_SIZE - 1 - xx), np.minimum(yy, OUT_SIZE - 1 - yy))
    # Soft pastel mist fading smoothly inward over ~34px (max alpha ~0.14 right at border)
    mist_a = np.clip((34.0 - edge_d) / 34.0, 0.0, 1.0)
    mist_a = (mist_a * mist_a) * 0.14
    mist = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    mist[..., 0] = tint_rgb[0]
    mist[..., 1] = tint_rgb[1]
    mist[..., 2] = tint_rgb[2]
    mist[..., 3] = mist_a * 255.0

    # Composite mist softly underneath/with existing canvas
    alpha_composite_rgba(mist, np.clip(canvas_f, 0, 255).astype(np.uint8), 0, 0, opacity=1.0)

    # 2x supersampled delicate rounded hairline inner border (inset 14px -> 28px at 2x)
    b = np.zeros((S, S), dtype=np.float32)
    ins, rad = 28, 64
    pts = [
        (ins + rad, ins), (S - ins - rad, ins),
        (S - ins, ins + rad), (S - ins, S - ins - rad),
        (S - ins - rad, S - ins), (ins + rad, S - ins),
        (ins, S - ins - rad), (ins, ins + rad),
    ]
    cv2.line(b, pts[0], pts[1], 1.0, 3, cv2.LINE_AA)
    cv2.line(b, pts[2], pts[3], 1.0, 3, cv2.LINE_AA)
    cv2.line(b, pts[4], pts[5], 1.0, 3, cv2.LINE_AA)
    cv2.line(b, pts[6], pts[7], 1.0, 3, cv2.LINE_AA)
    cv2.ellipse(b, (ins + rad, ins + rad), (rad, rad), 0, 180, 270, 1.0, 3, cv2.LINE_AA)
    cv2.ellipse(b, (S - ins - rad, ins + rad), (rad, rad), 0, 270, 360, 1.0, 3, cv2.LINE_AA)
    cv2.ellipse(b, (S - ins - rad, S - ins - rad), (rad, rad), 0, 0, 90, 1.0, 3, cv2.LINE_AA)
    cv2.ellipse(b, (ins + rad, S - ins - rad), (rad, rad), 0, 90, 180, 1.0, 3, cv2.LINE_AA)
    # 4 dainty corner sparkle dots just inside corners
    for cx, cy in [(ins + 24, ins + 24), (S - ins - 24, ins + 24), (ins + 24, S - ins - 24), (S - ins - 24, S - ins - 24)]:
        cv2.circle(b, (cx, cy), 4, 1.0, -1, cv2.LINE_AA)

    border_rgba = np.zeros((S, S, 4), dtype=np.float32)
    border_rgba[..., 0] = 255.0
    border_rgba[..., 1] = 252.0
    border_rgba[..., 2] = 254.0
    border_rgba[..., 3] = np.clip(b * 0.28 * 255.0, 0.0, 255.0)
    border_down = downsample_premul(border_rgba, OUT_SIZE, OUT_SIZE)
    alpha_composite_rgba(mist, border_down.astype(np.uint8), 0, 0, opacity=1.0)
    return mist


def build_all_7_kawaii():
    # Atlas 1: Nature (Sea critters Row 1, Butterflies Row 2, Sakura Row 3)
    sea = extract_row_sprites(ATLAS_NATURE, 0.00, 0.34, min_gap=20, label="Atlas1-Sea")
    butterflies = extract_row_sprites(ATLAS_NATURE, 0.34, 0.67, min_gap=20, label="Atlas1-Butterflies")
    sakura = extract_row_sprites(ATLAS_NATURE, 0.67, 1.00, min_gap=20, label="Atlas1-Sakura")

    # Atlas 2: Doodles & Sky (Doodles Row 1, Rainbows Row 2, Sparkles Row 3)
    doodles = extract_row_sprites(ATLAS_DOODLE, 0.00, 0.34, min_gap=8, label="Atlas2-Doodles")
    rainbows = extract_row_sprites(ATLAS_DOODLE, 0.34, 0.67, min_gap=8, label="Atlas2-Rainbows")
    sparkles = extract_row_sprites(ATLAS_DOODLE, 0.67, 1.00, min_gap=10, label="Atlas2-Sparkles")

    def finalize_layer(theme, sprite_f, bokeh_col, accent_cols, glow_rgb, frame_tint, seed):
        bg = draw_snow_connecting_accents(theme, bokeh_col, accent_cols, seed)
        sp_glow = add_luminous_sprite_aura(sprite_f, glow_rgb, sigma=5.5, strength=0.22)
        alpha_composite_rgba(bg, np.clip(sp_glow, 0, 255).astype(np.uint8), 0, 0, opacity=1.0)
        return add_dreamy_pastel_frame(bg, frame_tint)

    # 1. fx_ca_cute: Dainty pastel goldfish/whales/jellyfish + mini water bubbles + aqua waves/bokeh
    c_fish = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(8, 7, margin=28, seed=101, keep_prob=0.92, min_dist=68)
    for i, (cx, cy) in enumerate(pts):
        sp = sea[i % len(sea)]
        sz = float(rng.uniform(38, 58))
        ang = float(rng.uniform(-20, 20))
        flp = bool(rng.integers(0, 2))
        place_sprite(c_fish, sp, cx, cy, sz, angle_deg=ang, flip_x=flp, opacity=0.68)
    bubble_tiny = make_pastel_bubble_sprite(26, 0.4)
    b_pts, b_rng = generate_jittered_positions(7, 7, margin=22, seed=102, keep_prob=0.72, min_dist=56)
    for cx, cy in b_pts:
        place_sprite(c_fish, bubble_tiny, cx, cy, float(b_rng.uniform(13, 22)), opacity=0.58)
    f_fish = finalize_layer("ca_cute", c_fish, (186, 230, 253), [(165, 243, 252), (254, 215, 226), (224, 242, 254)], (215, 245, 255), (186, 230, 253), 103)

    # 2. fx_buom_xinh: Dainty pastel watercolor butterflies + dotted flight trails/bokeh
    c_bfly = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(8, 7, margin=28, seed=201, keep_prob=0.92, min_dist=68)
    for i, (cx, cy) in enumerate(pts):
        sp = butterflies[i % len(butterflies)]
        sz = float(rng.uniform(38, 58))
        ang = float(rng.uniform(-34, 34))
        flp = bool(rng.integers(0, 2))
        place_sprite(c_bfly, sp, cx, cy, sz, angle_deg=ang, flip_x=flp, opacity=0.68)
    dot_cols = [(191, 219, 254), (251, 207, 232), (221, 214, 254), (254, 240, 138)]
    d_pts, d_rng = generate_jittered_positions(8, 7, margin=20, seed=202, keep_prob=0.70, min_dist=52)
    for i, (cx, cy) in enumerate(d_pts):
        place_sprite(c_bfly, make_pastel_dot_sprite(16, dot_cols[i % len(dot_cols)]), cx, cy, float(d_rng.uniform(7, 13)), opacity=0.55)
    f_bfly = finalize_layer("buom_xinh", c_bfly, (221, 214, 254), [(251, 207, 232), (191, 219, 254), (254, 240, 180)], (250, 232, 255), (233, 213, 255), 203)

    # 3. fx_canh_hoa: Dainty hand-painted sakura flowers & swirling petals + blush breeze/bokeh
    c_sakura = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(8, 8, margin=26, seed=301, keep_prob=0.94, min_dist=60)
    weights = [0, 1, 2, 3, 4, 2, 3, 4]
    for i, (cx, cy) in enumerate(pts):
        sp_idx = weights[i % len(weights)]
        sp = sakura[sp_idx % len(sakura)]
        is_flower = sp_idx < 2
        sz = float(rng.uniform(36, 52) if is_flower else rng.uniform(28, 44))
        ang = float(rng.uniform(-24, 24) if is_flower else rng.uniform(-180, 180))
        blur = 1.6 if (not is_flower and i % 9 == 0) else 0.0
        if blur > 0:
            sz *= 1.25
        place_sprite(c_sakura, sp, cx, cy, sz, angle_deg=ang, dof_blur=blur, opacity=0.66)
    f_sakura = finalize_layer("canh_hoa", c_sakura, (251, 207, 232), [(254, 205, 211), (255, 228, 238)], (255, 222, 235), (251, 207, 232), 303)

    # 4. fx_sticker_doodle: Korean pastel doodles + Purikura mini hearts/crosses/squiggles
    c_doodle = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    doodle_pool = doodles + ([sparkles[0], sparkles[1]] if len(sparkles) >= 2 else [])
    pts, rng = generate_jittered_positions(8, 7, margin=28, seed=401, keep_prob=0.92, min_dist=66)
    for i, (cx, cy) in enumerate(pts):
        sp = doodle_pool[i % len(doodle_pool)]
        sz = float(rng.uniform(34, 54))
        ang = float(rng.uniform(-22, 22))
        flp = bool(rng.integers(0, 2)) if (i % len(doodle_pool) in (3, 4)) else False
        place_sprite(c_doodle, sp, cx, cy, sz, angle_deg=ang, flip_x=flp, opacity=0.68)
    f_doodle = finalize_layer("sticker_doodle", c_doodle, (254, 215, 226), [(251, 207, 232), (186, 230, 253), (254, 240, 175)], (255, 235, 245), (253, 210, 228), 403)

    # 5. fx_bong_bong: Kawaii anime pastel translucent soap bubbles + background bokeh/sparkles
    c_bubble = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    bubble_variants = [make_pastel_bubble_sprite(88, h) for h in (0.0, 1.4, 2.8, 4.3)]
    mini_star = make_sparkle_4pt_sprite(32, (255, 255, 255), (224, 242, 254))
    pts, rng = generate_jittered_positions(8, 8, margin=26, seed=501, keep_prob=0.94, min_dist=60)
    for i, (cx, cy) in enumerate(pts):
        sp = bubble_variants[i % len(bubble_variants)]
        sz = float(rng.uniform(30, 70) if i % 4 != 0 else rng.uniform(22, 32))
        ang = float(rng.uniform(-18, 18))
        place_sprite(c_bubble, sp, cx, cy, sz, angle_deg=ang, opacity=0.68)
        if sz > 48 and i % 3 == 0:
            place_sprite(c_bubble, mini_star, cx - sz * 0.28, cy - sz * 0.28, sz * 0.26, opacity=0.66)
    f_bubble = finalize_layer("bong_bong", c_bubble, (207, 235, 255), [(224, 242, 254), (245, 208, 254)], (228, 244, 255), (205, 232, 255), 503)

    # 6. fx_cau_vong: Pastel macaron rainbows, smiling suns + warm bokeh & shimmer arcs
    c_rainbow = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(7, 7, margin=30, seed=601, keep_prob=0.94, min_dist=74)
    for i, (cx, cy) in enumerate(pts):
        sp = rainbows[i % len(rainbows)]
        sz = float(rng.uniform(46, 66) if (i % len(rainbows) == 0) else rng.uniform(36, 54))
        ang = float(rng.uniform(-16, 16))
        place_sprite(c_rainbow, sp, cx, cy, sz, angle_deg=ang, opacity=0.68)
    r_dots, r_rng = generate_jittered_positions(7, 7, margin=22, seed=602, keep_prob=0.72, min_dist=54)
    r_cols = [(254, 205, 211), (254, 240, 138), (167, 243, 208), (186, 230, 253), (221, 214, 254)]
    for i, (cx, cy) in enumerate(r_dots):
        place_sprite(c_rainbow, make_pastel_dot_sprite(16, r_cols[i % len(r_cols)]), cx, cy, float(r_rng.uniform(7, 12)), opacity=0.58)
    f_rainbow = finalize_layer("cau_vong", c_rainbow, (254, 230, 190), r_cols, (255, 245, 220), (254, 224, 200), 603)

    # 7. fx_sao_lap_lanh: Kawaii pastel stars, crescent moons + fairy-dust sparkles & bokeh
    c_sparkle = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    pts, rng = generate_jittered_positions(8, 8, margin=24, seed=701, keep_prob=0.94, min_dist=58)
    for i, (cx, cy) in enumerate(pts):
        sp = sparkles[i % len(sparkles)]
        sz = float(rng.uniform(30, 50))
        ang = float(rng.uniform(-22, 22))
        place_sprite(c_sparkle, sp, cx, cy, sz, angle_deg=ang, opacity=0.70)
    kira_gold = make_sparkle_4pt_sprite(44, (255, 250, 220), (254, 215, 170))
    kira_pink = make_sparkle_4pt_sprite(44, (255, 245, 252), (251, 207, 232))
    k_pts, k_rng = generate_jittered_positions(8, 8, margin=20, seed=702, keep_prob=0.78, min_dist=48)
    for i, (cx, cy) in enumerate(k_pts):
        if any((cx - px) ** 2 + (cy - py) ** 2 < 28 ** 2 for px, py in pts):
            continue
        sp = kira_gold if i % 2 == 0 else kira_pink
        place_sprite(c_sparkle, sp, cx, cy, float(k_rng.uniform(14, 24)), angle_deg=float(k_rng.uniform(-12, 12)), opacity=0.66)
    f_sparkle = finalize_layer("sao_lap_lanh", c_sparkle, (254, 240, 195), [(251, 207, 232), (221, 214, 254), (255, 248, 215)], (255, 246, 214), (250, 232, 210), 703)

    return [
        ("fx_ca_cute", np.clip(f_fish, 0, 255).astype(np.uint8)),
        ("fx_buom_xinh", np.clip(f_bfly, 0, 255).astype(np.uint8)),
        ("fx_canh_hoa", np.clip(f_sakura, 0, 255).astype(np.uint8)),
        ("fx_sticker_doodle", np.clip(f_doodle, 0, 255).astype(np.uint8)),
        ("fx_bong_bong", np.clip(f_bubble, 0, 255).astype(np.uint8)),
        ("fx_cau_vong", np.clip(f_rainbow, 0, 255).astype(np.uint8)),
        ("fx_sao_lap_lanh", np.clip(f_sparkle, 0, 255).astype(np.uint8)),
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
