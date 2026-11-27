"""Build 4 native 768x768 0-AI photographic RGBA overlays + binary .bin assets:
  - fx_ca_cute: studio-isolated koi goldfish (chroma-green spill-suppressed, zero halo)
  - fx_buom_xinh: real Wikimedia macro butterflies with 3D perspective flutter (zero white halo)
  - fx_canh_hoa: 4x-supersampled 3D curved translucent sakura petals in 3 DoF layers
  - fx_sticker_doodle: 3D puffy Korean Y2K glossy vinyl die-cut stickers (white border, zero halo)
Outputs assets/frames/{fid}.png, assets/frames_bin/{fid}.bin, updates data/frames_manifest.json,
and renders scratch/local_overlays_check.jpg (portrait + pure black canvas comparison).
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
KOI_SHEET = os.path.join(ARTIFACTS, "sheet_koi_v2_1795809318430.jpg")
STICKER_SHEET = os.path.join(ARTIFACTS, "sheet_stickers_1795809307514.jpg")
BUTTERFLY_DIR = os.path.join(SCRATCH, "butterflies")

OUT_SIZE = 768


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / max(1e-6, edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def unpremultiply_and_bleed(rgb_f, alpha, bg_rgb, min_alpha_div=0.22, bleed_iters=5):
    """Strip background color bleed from semi-transparent boundaries and extend interior RGB."""
    a = np.clip(alpha, 0.0, 1.0)[..., None]
    bg = np.asarray(bg_rgb, dtype=np.float32).reshape(1, 1, 3)
    fg = (rgb_f - (1.0 - a) * bg) / np.maximum(a, min_alpha_div)
    fg = np.clip(fg, 0.0, 255.0)

    # Inward RGB bleed from solid core (>0.82) into hairline/soft edge pixels so alpha fringe never carries bg hue
    solid = alpha >= 0.82
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

    # For very faint edge pixels (<0.65), mix toward bled interior foreground color
    blend_w = np.clip((0.68 - alpha) / 0.68, 0.0, 1.0)[..., None]
    out = fg * (1.0 - blend_w) + cur * blend_w
    return np.clip(out, 0.0, 255.0)


def alpha_composite_rgba(dst_f, src_rgba_u8, x, y):
    """Straight-alpha composite src RGBA onto premul/straight dst float32 RGBA cleanly."""
    sh, sw = src_rgba_u8.shape[:2]
    dh, dw = dst_f.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(dw, x + sw), min(dh, y + sh)
    if x1 <= x0 or y1 <= y0:
        return
    sx0, sy0 = x0 - x, y0 - y
    sx1, sy1 = sx0 + (x1 - x0), sy0 + (y1 - y0)

    patch = src_rgba_u8[sy0:sy1, sx0:sx1].astype(np.float32)
    sa = patch[..., 3:4] / 255.0
    srgb = patch[..., :3]

    da = dst_f[y0:y1, x0:x1, 3:4] / 255.0
    drgb = dst_f[y0:y1, x0:x1, :3]

    out_a = sa + da * (1.0 - sa)
    num = srgb * sa + drgb * da * (1.0 - sa)
    out_rgb = np.where(out_a > 1e-5, num / np.maximum(out_a, 1e-5), 0.0)

    dst_f[y0:y1, x0:x1, :3] = np.clip(out_rgb, 0.0, 255.0)
    dst_f[y0:y1, x0:x1, 3:4] = np.clip(out_a * 255.0, 0.0, 255.0)


def add_drop_shadow(rgba_u8, offset=(0, 4), blur_sigma=4.0, opacity=0.22):
    """Return expanded RGBA uint8 sprite with soft realistic neutral ambient shadow behind it."""
    pad = int(math.ceil(blur_sigma * 3)) + max(abs(offset[0]), abs(offset[1])) + 2
    h, w = rgba_u8.shape[:2]
    cw, ch = w + 2 * pad, h + 2 * pad
    sh_alpha = np.zeros((ch, cw), dtype=np.float32)
    sh_alpha[pad + offset[1]:pad + offset[1] + h, pad + offset[0]:pad + offset[0] + w] = rgba_u8[..., 3].astype(np.float32) / 255.0
    sh_alpha = cv2.GaussianBlur(sh_alpha, (0, 0), blur_sigma) * opacity
    canvas = np.zeros((ch, cw, 4), dtype=np.float32)
    canvas[..., :3] = 10.0  # dark neutral shadow RGB
    canvas[..., 3] = sh_alpha * 255.0
    alpha_composite_rgba(canvas, rgba_u8, pad, pad)
    return np.clip(canvas, 0, 255).astype(np.uint8)


def place_sprite(canvas_f, sprite_u8, cx, cy, target_max_dim, angle_deg=0.0, flip_x=False, dof_blur=0.0, shadow=None):
    sp = sprite_u8
    if flip_x:
        sp = np.ascontiguousarray(sp[:, ::-1, :])
    h, w = sp.shape[:2]
    scale = target_max_dim / max(h, w)
    nw, nh = max(4, int(round(w * scale))), max(4, int(round(h * scale)))
    interp = cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC
    # Resize RGB and A via premultiplied channels to avoid dark/white fringe during bilinear/bicubic resize
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

    if shadow is not None:
        off, sig, op = shadow
        final_u8 = add_drop_shadow(final_u8, offset=off, blur_sigma=sig, opacity=op)

    fh, fw = final_u8.shape[:2]
    alpha_composite_rgba(canvas_f, final_u8, int(round(cx - fw * 0.5)), int(round(cy - fh * 0.5)))


# -------------------------------------------------------------------------
# 1. KOI GOLDFISH (fx_ca_cute)
# -------------------------------------------------------------------------
def extract_koi_sprites():
    bgr = cv2.imread(KOI_SHEET, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    h, w = rgb.shape[:2]

    # Sample green backdrop from 4 corners
    corners = np.concatenate([
        rgb[:24, :24].reshape(-1, 3),
        rgb[:24, -24:].reshape(-1, 3),
        rgb[-24:, :24].reshape(-1, 3),
        rgb[-24:, -24:].reshape(-1, 3),
    ], axis=0)
    bg_rgb = np.median(corners, axis=0)

    # Compute green-screen key: distance in Lab + green excess over max(R, B)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    bg_lab = cv2.cvtColor(np.uint8([[bg_rgb[::-1]]]), cv2.COLOR_BGR2LAB).astype(np.float32).reshape(1, 1, 3)
    de = np.linalg.norm(lab - bg_lab, axis=2)

    g_exc = rgb[..., 1] - 0.5 * (rgb[..., 0] + rgb[..., 2])
    bg_exc = float(bg_rgb[1] - 0.5 * (bg_rgb[0] + bg_rgb[2]))

    # Ratio of pixel greenness vs pure chroma green
    fg_raw = smoothstep(14.0, 44.0, de)
    # Sheer translucent white/cream fins still show green tint underneath; preserve partial alpha via green-ratio drop
    chroma_ratio = np.clip((g_exc - 6.0) / max(10.0, bg_exc - 6.0), 0.0, 1.0)
    alpha = np.maximum(fg_raw, (1.0 - chroma_ratio) * smoothstep(6.0, 22.0, de))

    # Suppress any green backdrop near connected exterior
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    pure_green = (hsv[..., 0] >= 48) & (hsv[..., 0] <= 88) & (hsv[..., 1] >= 70) & (g_exc > bg_exc * 0.68)
    alpha[pure_green & (de < 22.0)] = 0.0
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.7)

    # Green spill suppression across entire sheet BEFORE extracting sprites
    spill_mask = g_exc > 4.0
    spill_cap = np.maximum(rgb[..., 0], rgb[..., 2]) * 0.55 + np.minimum(rgb[..., 0], rgb[..., 2]) * 0.45 + 3.0
    rgb_despill = rgb.copy()
    rgb_despill[..., 1] = np.where(spill_mask, np.minimum(rgb[..., 1], spill_cap), rgb[..., 1])

    fg_clean = unpremultiply_and_bleed(rgb_despill, alpha, [float(bg_rgb[0]), float(np.minimum(bg_rgb[1], 120.0)), float(bg_rgb[2])], min_alpha_div=0.25, bleed_iters=4)
    # Final green-spill clamp on sheer translucent fin pixels so zero green can appear on black screen
    a_safe = np.clip(alpha, 0.0, 1.0)
    sheer = a_safe < 0.85
    cap2 = 0.52 * fg_clean[..., 0] + 0.48 * fg_clean[..., 2] + 4.0
    fg_clean[..., 1] = np.where(sheer & (fg_clean[..., 1] > cap2), cap2, fg_clean[..., 1])

    # Component split
    comp_mask = (alpha > 0.14).astype(np.uint8)
    comp_mask = cv2.morphologyEx(comp_mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    num_l, labels, stats, _ = cv2.connectedComponentsWithStats(comp_mask, connectivity=8)

    sprites = []
    rgba_full = np.concatenate([fg_clean, (a_safe * 255.0)[..., None]], axis=2).astype(np.uint8)
    for lid in range(1, num_l):
        area = stats[lid, cv2.CC_STAT_AREA]
        if area < 4000:
            continue
        x, y, bw, bh = stats[lid, cv2.CC_STAT_LEFT], stats[lid, cv2.CC_STAT_TOP], stats[lid, cv2.CC_STAT_WIDTH], stats[lid, cv2.CC_STAT_HEIGHT]
        pad = 12
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(w, x + bw + pad), min(h, y + bh + pad)
        sp = rgba_full[y0:y1, x0:x1].copy()
        sp_mask = cv2.dilate((labels[y0:y1, x0:x1] == lid).astype(np.uint8), np.ones((7, 7), np.uint8))
        sp[..., 3] = np.where(sp_mask > 0, sp[..., 3], 0)
        sprites.append((x + bw * 0.5, y + bh * 0.5, sp))
    # Sort top-left to bottom-right cleanly
    sprites.sort(key=lambda t: (round(t[1] / 350), t[0]))
    print(f"Extracted {len(sprites)} koi sprites")
    return [s[2] for s in sprites]


def build_fx_ca_cute():
    koi = extract_koi_sprites()
    canvas = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    # 5 koi swimming gracefully around lower corners and outer margins (center [175..595, 140..560] clear!)
    # koi order: 0=calico_topL, 1=orange_topM, 2=white_calico_topR, 3=orange_botL, 4=calico_botR
    placements = [
        (0, 118, 638, 210, -24, False, 0.0, ((2, 5), 5.0, 0.14)),
        (1, 650, 620, 222, 32, False, 1.0, ((2, 5), 5.0, 0.16)),
        (2, 672, 230, 165, -28, True, 0.0, ((2, 4), 4.0, 0.12)),
        (3, 345, 688, 166, -54, False, 0.0, ((2, 4), 4.0, 0.12)),
        (4, 96, 295, 160, 138, False, 0.0, ((2, 4), 4.0, 0.12)),
    ]
    for idx, cx, cy, sz, ang, flp, blur, sh in placements:
        if idx < len(koi):
            place_sprite(canvas, koi[idx], cx, cy, sz, angle_deg=ang, flip_x=flp, dof_blur=blur, shadow=sh)
    return np.clip(canvas, 0, 255).astype(np.uint8)


# -------------------------------------------------------------------------
# 2. MACRO BUTTERFLIES (fx_buom_xinh)
# -------------------------------------------------------------------------
def tilt_3d_butterfly(rgba_u8, pitch_deg=18.0, yaw_deg=16.0):
    """Apply subtle realistic 3D mid-flight perspective tilt so butterflies don't look museum-flat."""
    h, w = rgba_u8.shape[:2]
    pad = max(h, w) // 4
    f = rgba_u8.astype(np.float32)
    a = f[..., 3:4] / 255.0
    premul = np.concatenate([f[..., :3] * a, f[..., 3:4]], axis=2)
    premul = cv2.copyMakeBorder(premul, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
    ch, cw = premul.shape[:2]

    fov = cw * 2.2
    rx, ry = math.radians(pitch_deg), math.radians(yaw_deg)
    Rx = np.array([[1, 0, 0], [0, math.cos(rx), -math.sin(rx)], [0, math.sin(rx), math.cos(rx)]])
    Ry = np.array([[math.cos(ry), 0, math.sin(ry)], [0, 1, 0], [-math.sin(ry), 0, math.cos(ry)]])
    R = Ry @ Rx

    pts_3d = np.float32([[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0]])
    rot = pts_3d @ R.T
    proj = np.zeros((4, 2), dtype=np.float32)
    for i in range(4):
        z = fov + rot[i, 2]
        proj[i, 0] = cw / 2 + rot[i, 0] * fov / z
        proj[i, 1] = ch / 2 + rot[i, 1] * fov / z

    src_pts = np.float32([[pad, pad], [pad + w, pad], [pad + w, pad + h], [pad, pad + h]])
    M = cv2.getPerspectiveTransform(src_pts, proj)
    warped = cv2.warpPerspective(premul, M, (cw, ch), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

    oa = np.clip(warped[..., 3:4] / 255.0, 0.0, 1.0)
    orgb = np.where(oa > 1e-4, warped[..., :3] / np.maximum(oa, 1e-4), 0.0)
    out = np.concatenate([np.clip(orgb, 0, 255), np.clip(warped[..., 3:4], 0, 255)], axis=2).astype(np.uint8)
    ys, xs = np.where(out[..., 3] > 6)
    if len(ys):
        return out[max(0, ys.min() - 4):min(ch, ys.max() + 5), max(0, xs.min() - 4):min(cw, xs.max() + 5)]
    return out


def extract_butterfly(fname, soft_pink_shift=False):
    path = os.path.join(BUTTERFLY_DIR, fname)
    if fname.endswith(".png"):
        im = Image.open(path).convert("RGBA")
        arr = np.array(im, dtype=np.float32)
        alpha = arr[..., 3] / 255.0
        rgb_clean = unpremultiply_and_bleed(arr[..., :3], alpha, [255.0, 255.0, 255.0], min_alpha_div=0.35, bleed_iters=5)
        out = np.concatenate([rgb_clean, (alpha * 255.0)[..., None]], axis=2).astype(np.uint8)
    else:
        bgr = cv2.imread(path, cv2.IMREAD_COLOR)
        h, w = bgr.shape[:2]
        # Mask out the tiny bottom-right "1 cm" scale bar if present before extracting largest connected component
        bgr[int(h * 0.84):, int(w * 0.80):] = bgr[10, 10]
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)

        corners = np.concatenate([
            rgb[:20, :20].reshape(-1, 3),
            rgb[:20, -20:].reshape(-1, 3),
            rgb[-20:, :20].reshape(-1, 3),
        ], axis=0)
        bg_rgb = np.median(corners, axis=0)
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        bg_lab = cv2.cvtColor(np.uint8([[bg_rgb[::-1]]]), cv2.COLOR_BGR2LAB).astype(np.float32).reshape(1, 1, 3)
        de = np.linalg.norm(lab - bg_lab, axis=2)

        # Flood-fill connected background starting from all 4 image corners
        bg_cand = (de < 15.0).astype(np.uint8)
        ff = bg_cand.copy()
        mask_ff = np.zeros((h + 2, w + 2), np.uint8)
        for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
            if ff[sy, sx] == 1:
                cv2.floodFill(ff, mask_ff, (sx, sy), 2)
        ext_bg = (ff == 2)

        # Keep largest connected foreground component (and delicate antennae pixels near it)
        fg_bin = (~ext_bg).astype(np.uint8)
        fg_close = cv2.morphologyEx(fg_bin, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        num_l, labels, stats, _ = cv2.connectedComponentsWithStats(fg_close, connectivity=8)
        best_id = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])) if num_l > 1 else 0
        main_fg = (labels == best_id) if best_id > 0 else fg_bin.astype(bool)

        # Feather alpha cleanly inside main_fg using Euclidean distance & de
        alpha = np.where(main_fg, smoothstep(8.0, 26.0, de), 0.0)
        # Ensure opaque wing interiors (especially pale spots near borders) stay solid
        interior = cv2.erode(main_fg.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
        alpha = np.where(interior, np.maximum(alpha, 0.96), alpha)
        alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.65)

        rgb_clean = unpremultiply_and_bleed(rgb, alpha, bg_rgb, min_alpha_div=0.35, bleed_iters=6)
        if soft_pink_shift:
            # Subtle delicate blush-sakura tone for soft dreamy wing harmony
            hsv_f = cv2.cvtColor(rgb_clean.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
            hsv_f[..., 0] = (hsv_f[..., 0] + 158.0) % 180.0
            hsv_f[..., 1] = np.clip(hsv_f[..., 1] * 0.44, 0, 255)
            hsv_f[..., 2] = np.clip(hsv_f[..., 2] * 1.12 + 18.0, 0, 255)
            rgb_clean = cv2.cvtColor(hsv_f.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)

        out = np.concatenate([rgb_clean, (np.clip(alpha, 0, 1) * 255.0)[..., None]], axis=2).astype(np.uint8)

    ys, xs = np.where(out[..., 3] > 6)
    out = out[max(0, ys.min() - 6):min(out.shape[0], ys.max() + 7), max(0, xs.min() - 6):min(out.shape[1], xs.max() + 7)]
    return out


def build_fx_buom_xinh():
    monarch = tilt_3d_butterfly(extract_butterfly("monarch.png"), 20, -24)
    morpho_sky = tilt_3d_butterfly(extract_butterfly("morpho_didius.jpg"), 24, 22)
    morpho_teal = tilt_3d_butterfly(extract_butterfly("morpho_menelaus.jpg"), 16, -28)
    ulysses = tilt_3d_butterfly(extract_butterfly("ulysses.jpg"), 26, 18)
    blush = tilt_3d_butterfly(extract_butterfly("cymothoe.jpg", soft_pink_shift=True), 22, 26)

    canvas = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    # 6 real 3D-tilted butterflies fluttering cleanly around outer edges (center wide open)
    placements = [
        (morpho_sky, 118, 128, 150, -22, False, 0.0, ((3, 6), 4.5, 0.20)),
        (monarch, 654, 152, 134, 18, True, 0.0, ((3, 6), 4.5, 0.20)),
        (blush, 682, 435, 112, -32, False, 0.0, ((2, 5), 4.0, 0.16)),
        (ulysses, 98, 465, 118, 28, False, 0.0, ((2, 5), 4.0, 0.16)),
        (morpho_teal, 636, 676, 178, -16, False, 1.5, ((3, 7), 6.0, 0.18)),  # foreground close DoF flutter
        (monarch, 135, 686, 120, -34, False, 0.0, ((2, 5), 4.0, 0.16)),
    ]
    for sp, cx, cy, sz, ang, flp, blur, sh in placements:
        place_sprite(canvas, sp, cx, cy, sz, angle_deg=ang, flip_x=flp, dof_blur=blur, shadow=sh)
    return np.clip(canvas, 0, 255).astype(np.uint8)


# -------------------------------------------------------------------------
# 3. 3D CURLED TRANSLUCENT SAKURA PETALS (fx_canh_hoa)
# -------------------------------------------------------------------------
def render_sakura_petal_sprite(variant=0, base_px=180):
    """Render 4x supersampled organic 3D curved translucent cherry-blossom petal with ZERO dark outline."""
    ss = 4
    w_s = base_px * ss
    h_s = int(base_px * 1.25) * ss
    yy, xx = np.mgrid[0:h_s, 0:w_s].astype(np.float32)
    # Normalized coordinates [-1..1]
    u = (xx - w_s * 0.5) / (w_s * 0.40)
    v = (yy - h_s * 0.52) / (h_s * 0.42)  # -1 = base claw, +1 = notched tip

    # Organic petal curve asymmetry
    rng = np.random.default_rng(100 + variant * 37)
    bend = (rng.random() - 0.5) * 0.18
    u_bent = u - bend * (v * v - 0.4)

    # Half-width envelope along v: narrow base claw -> round full mid-body -> gentle heart-notched tip
    t_len = np.clip((v + 1.0) * 0.5, 0.0, 1.0)
    env = np.sin(np.pi * np.power(t_len, 0.68)) * (0.62 + 0.36 * t_len)
    # Heart-shaped apical cleft notch around u=0, v > 0.68
    notch = 0.24 * np.exp(-((u_bent / 0.19) ** 2)) * np.clip((v - 0.55) / 0.45, 0.0, 1.0)
    v_eff = v + notch
    t_eff = np.clip((v_eff + 1.0) * 0.5, 0.0, 1.0)
    # Normalized radial distance to petal boundary (<= 1 inside)
    dist_u = np.abs(u_bent) / np.maximum(env, 0.02)
    dist_v = np.abs(v_eff)
    edge_metric = np.maximum(dist_u, np.clip((dist_v - 0.85) / 0.15 + 1.0 - 0.12 * (1 - dist_u ** 2), dist_v, 2.0))
    # Smooth teardrop signed field
    sdf = np.sqrt((u_bent / np.maximum(env, 0.02)) ** 2 + np.maximum(0.0, np.abs(v_eff) - 0.08) ** 6)
    alpha = 1.0 - smoothstep(0.955, 1.015, sdf)
    alpha *= smoothstep(-1.02, -0.92, v_eff) * (1.0 - smoothstep(0.94, 1.02, v_eff))

    # 3D saddle cup curvature & soft lighting
    z = 0.24 * (u_bent ** 2) - 0.15 * (v ** 2) + 0.05 * np.sin(u_bent * 3.1 + variant)
    dz_du = np.gradient(z, axis=1) * 14.0
    dz_dv = np.gradient(z, axis=0) * 14.0
    nz = 1.0 / np.sqrt(dz_du ** 2 + dz_dv ** 2 + 1.0)
    nx, ny = -dz_du * nz, -dz_dv * nz
    # Soft diffuse light from upper-left + subsurface glow
    light = np.clip(-0.42 * nx - 0.48 * ny + 0.77 * nz, 0.0, 1.0)
    shade = 0.80 + 0.24 * light

    # Translucent sakura pink color gradient (deeper rose claw -> delicate pale blush body -> creamy edge)
    r_col = np.clip((242.0 + 13.0 * t_eff) * shade, 0, 255)
    g_col = np.clip((162.0 + 68.0 * t_eff + 18.0 * np.clip(dist_u, 0, 1)) * shade, 0, 255)
    b_col = np.clip((188.0 + 48.0 * t_eff + 14.0 * np.clip(dist_u, 0, 1)) * shade, 0, 255)

    # Subtle fine petal veins radiating gently from base
    vein = np.exp(-((u_bent * 12.0 - np.round(u_bent * 12.0)) ** 2) / 0.07) * np.exp(-((t_eff - 0.35) ** 2) / 0.18) * 0.06
    r_col -= 12.0 * vein
    g_col -= 26.0 * vein
    b_col -= 18.0 * vein

    # Slight delicate translucency (natural thin blossom ~86-94% opaque in body, silky edge)
    a_full = np.clip(alpha * (0.86 + 0.08 * (1.0 - t_eff)), 0.0, 1.0)

    rgba_ss = np.stack([
        np.clip(r_col, 0, 255),
        np.clip(g_col, 0, 255),
        np.clip(b_col, 0, 255),
        a_full * 255.0,
    ], axis=2).astype(np.float32)

    # Downsample premultiplied 4x -> straight RGBA cleanly
    premul = np.concatenate([rgba_ss[..., :3] * (rgba_ss[..., 3:4] / 255.0), rgba_ss[..., 3:4]], axis=2)
    down = cv2.resize(premul, (w_s // ss, h_s // ss), interpolation=cv2.INTER_AREA)
    da = np.clip(down[..., 3:4] / 255.0, 0.0, 1.0)
    drgb = np.where(da > 1e-4, down[..., :3] / np.maximum(da, 1e-4), 0.0)
    out = np.concatenate([np.clip(drgb, 0, 255), np.clip(down[..., 3:4], 0, 255)], axis=2).astype(np.uint8)
    ys, xs = np.where(out[..., 3] > 3)
    return out[max(0, ys.min() - 2):ys.max() + 3, max(0, xs.min() - 2):xs.max() + 3]


def build_fx_canh_hoa():
    petals = [render_sakura_petal_sprite(i, 160) for i in range(6)]
    canvas = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)

    # 3 photographic depth-of-field layers around outer ring (center face 100% open)
    # Back layer: 5 small distant softly blurred petals
    distant = [
        (0, 195, 118, 36, 42, 1.6),
        (1, 595, 108, 34, -35, 1.6),
        (2, 688, 355, 32, 78, 1.8),
        (3, 86, 395, 34, -68, 1.6),
        (4, 248, 692, 36, 118, 1.8),
    ]
    for idx, cx, cy, sz, ang, blur in distant:
        place_sprite(canvas, petals[idx], cx, cy, sz, angle_deg=ang, dof_blur=blur)

    # Mid layer: 8 crisp tumbling medium petals
    mid = [
        (5, 86, 116, 60, -28, 0.0),
        (2, 668, 134, 58, 34, 0.0),
        (0, 56, 260, 52, 65, 0.0),
        (4, 712, 265, 54, -52, 0.0),
        (1, 688, 535, 58, 48, 0.0),
        (3, 72, 548, 56, -42, 0.0),
        (5, 530, 702, 50, -110, 0.0),
        (0, 160, 688, 54, 24, 0.0),
    ]
    for idx, cx, cy, sz, ang, blur in mid:
        place_sprite(canvas, petals[idx], cx, cy, sz, angle_deg=ang, dof_blur=blur)

    # Foreground near-lens bokeh layer: 3 large blurred petals peeking softly at corners
    fg = [
        (1, 38, 44, 112, 138, 4.0),
        (3, 730, 662, 116, -34, 4.2),
        (4, 46, 718, 104, 52, 3.8),
    ]
    for idx, cx, cy, sz, ang, blur in fg:
        place_sprite(canvas, petals[idx], cx, cy, sz, angle_deg=ang, dof_blur=blur)

    return np.clip(canvas, 0, 255).astype(np.uint8)


# -------------------------------------------------------------------------
# 4. 3D PUFFY KOREAN / Y2K DIE-CUT VINYL STICKERS (fx_sticker_doodle)
# -------------------------------------------------------------------------
def extract_sticker_sprites():
    bgr = cv2.imread(STICKER_SHEET, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    h, w = rgb.shape[:2]

    max_ch = np.max(rgb, axis=2)
    # Background flood-fill from pure black corners
    bg_cand = (max_ch < 26).astype(np.uint8)
    ff = bg_cand.copy()
    mask_ff = np.zeros((h + 2, w + 2), np.uint8)
    for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if ff[sy, sx] == 1:
            cv2.floodFill(ff, mask_ff, (sx, sy), 2)
    ext_bg = (ff == 2)

    alpha = np.where(ext_bg, 0.0, smoothstep(10.0, 44.0, max_ch))
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 0.55)
    fg_clean = unpremultiply_and_bleed(rgb, alpha, [0.0, 0.0, 0.0], min_alpha_div=0.35, bleed_iters=4)
    rgba_full = np.concatenate([fg_clean, (np.clip(alpha, 0, 1) * 255.0)[..., None]], axis=2).astype(np.uint8)

    comp = (alpha > 0.15).astype(np.uint8)
    num_l, labels, stats, _ = cv2.connectedComponentsWithStats(comp, connectivity=8)
    sprites = []
    for lid in range(1, num_l):
        if stats[lid, cv2.CC_STAT_AREA] < 3500:
            continue
        x, y, bw, bh = stats[lid, cv2.CC_STAT_LEFT], stats[lid, cv2.CC_STAT_TOP], stats[lid, cv2.CC_STAT_WIDTH], stats[lid, cv2.CC_STAT_HEIGHT]
        pad = 8
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(w, x + bw + pad), min(h, y + bh + pad)
        sp = rgba_full[y0:y1, x0:x1].copy()
        sp_m = cv2.dilate((labels[y0:y1, x0:x1] == lid).astype(np.uint8), np.ones((5, 5), np.uint8))
        sp[..., 3] = np.where(sp_m > 0, sp[..., 3], 0)
        sprites.append((x + bw * 0.5, y + bh * 0.5, sp))

    # Row-major order:
    # 0: pink bow, 1: pink heart, 2: chrome 4pt star, 3: cherries (red leaf - skip),
    # 4: blue cloud+gold star, 5: lavender butterfly bow, 6: pearl bow, 7: holo crescent moon
    sprites.sort(key=lambda t: (round(t[1] / 300), t[0]))
    print(f"Extracted {len(sprites)} sticker sprites")
    return [s[2] for s in sprites]


def build_fx_sticker_doodle():
    stickers = extract_sticker_sprites()
    canvas = np.zeros((OUT_SIZE, OUT_SIZE, 4), dtype=np.float32)
    # Keep 6 cohesive pastel-pink/chrome/dreamy Y2K puffy vinyl stickers cleanly around outer edges
    placements = [
        (0, 108, 108, 128, -14),  # pink satin ribbon bow (top-left)
        (2, 672, 112, 118, 16),   # liquid-chrome 4-pt star (top-right)
        (4, 98, 418, 112, -10),   # baby-blue puffy cloud+gold star (mid-left)
        (7, 676, 405, 110, 18),   # holographic silver crescent moon (mid-right)
        (1, 116, 656, 122, -12),  # pearlescent pink 3D heart (bottom-left)
        (5, 652, 656, 126, 14),   # lavender butterfly bow (bottom-right)
    ]
    sh = ((0, 4), 4.5, 0.24)
    for idx, cx, cy, sz, ang in placements:
        if idx < len(stickers):
            place_sprite(canvas, stickers[idx], cx, cy, sz, angle_deg=ang, shadow=sh)
    return np.clip(canvas, 0, 255).astype(np.uint8)


def save_overlay(fid, rgba_u8):
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    png_path = os.path.join(FRAMES_DIR, f"{fid}.png")
    bin_path = os.path.join(BINS_DIR, f"{fid}.bin")
    Image.fromarray(rgba_u8, mode="RGBA").save(png_path, "PNG")
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
        ov_im = Image.fromarray(rgba_u8, mode="RGBA").resize((384, 384), Image.Resampling.LANCZOS)
        c1 = Image.alpha_composite(p_sq.copy(), ov_im).convert("RGB")
        c2 = Image.alpha_composite(dark_sq.copy(), ov_im).convert("RGB")
        sheet.paste(c1, (idx * 384, 0))
        sheet.paste(c2, (idx * 384, 384))
        draw.text((idx * 384 + 12, 778), fid, fill=(245, 245, 250))

    out = os.path.join(SCRATCH, "local_overlays_check.jpg")
    sheet.save(out, "JPEG", quality=93)
    print("Saved local verification sheet:", out)


def main():
    overlays = [
        ("fx_ca_cute", build_fx_ca_cute()),
        ("fx_buom_xinh", build_fx_buom_xinh()),
        ("fx_canh_hoa", build_fx_canh_hoa()),
        ("fx_sticker_doodle", build_fx_sticker_doodle()),
    ]
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
