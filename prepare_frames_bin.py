import json
import os
import zlib
from collections import deque
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
OUT_BIN_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")
MANIFEST_PATH = os.path.join(DATA_DIR, "frames_manifest.json")

SIZE = 512
HALF = SIZE // 2

# Explicit classification overrides where decorative borders or cutout gaps fool heuristic checks
FORCE_4CUT = {
    "frame_berry_days",
    "frame_happy_snap",
    "frame_sky_diary",
    "photobooth_4cut",
    "pb_holo_4cut",
    "pb_scrapbook_ripped_4cut",
    "pb_ripped_paper_4cut",
    "pb_denim_ripped_2x2",
    "pb_cortis_4cut",
    "pb_cortis_v1",
    "pb_cortis_v2",
    "pb_ech_xanh",
    "pb_galaxy",
    "pb_meo_dang_yeu_4cut",
    "pb_photobooth_hello_kitty",
    "pb_shinchan_4cut",
    "pb_strawberry",
    "pb_supperman_4cut",
    "pb_trung_bac_thao",
    "pb_vintage",
}

FORCE_1CUT = {
    "photobooth_cute",
    "frame_classic_pb",
    "pb_vien_hello_kitty",
    "khung_doraemon_shinchan_kitty",
    "pb_single_y2k_silver_holo",
    "pb_single_denim_ripped",
    "pb_single_film_nostalgia",
}


def largest_inner_transparent_box(alpha_img, qx1, qy1, qx2, qy2):
    """Find bounding box of largest transparent component strictly inside quadrant, ignoring outer edge margins if possible."""
    w = qx2 - qx1
    h = qy2 - qy1
    px = alpha_img.load()
    visited = [[False] * w for _ in range(h)]
    best_count = 0
    best_box = None

    for sy in range(h):
        for sx in range(w):
            if not visited[sy][sx] and px[qx1 + sx, qy1 + sy] < 128:
                q = deque([(sx, sy)])
                visited[sy][sx] = True
                minx = maxx = sx
                miny = maxy = sy
                count = 0
                touches_outer_corner = False
                while q:
                    cx, cy = q.popleft()
                    count += 1
                    gx, gy = qx1 + cx, qy1 + cy
                    if (gx == 0 or gx == SIZE - 1) and (gy == 0 or gy == SIZE - 1):
                        touches_outer_corner = True
                    if cx < minx: minx = cx
                    if cx > maxx: maxx = cx
                    if cy < miny: miny = cy
                    if cy > maxy: maxy = cy
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and px[qx1 + nx, qy1 + ny] < 128:
                            visited[ny][nx] = True
                            q.append((nx, ny))
                # Ignore small transparent artifacts or corner background outside rounded card
                if count > best_count and not (touches_outer_corner and count < (w * h * 0.25)):
                    best_count = count
                    best_box = [qx1 + minx, qy1 + miny, qx1 + maxx + 1, qy1 + maxy + 1]

    if not best_box or best_count < 400:
        return [qx1, qy1, qx2, qy2]
    # Add 2px bleed under the frame edge so anti-aliased frame borders never leave a 1px seam
    return [
        max(qx1, best_box[0] - 2),
        max(qy1, best_box[1] - 2),
        min(qx2, best_box[2] + 2),
        min(qy2, best_box[3] + 2),
    ]


def detect_windows(im_512, fid):
    alpha = im_512.split()[3]
    if fid in FORCE_4CUT:
        quads = [(0, 0, HALF, HALF), (HALF, 0, SIZE, HALF), (0, HALF, HALF, SIZE), (HALF, HALF, SIZE, SIZE)]
        windows = [largest_inner_transparent_box(alpha, qx1, qy1, qx2, qy2) for (qx1, qy1, qx2, qy2) in quads]
        return True, windows

    if fid == "photobooth_cute":
        return False, [[72, 72, 440, 440]]

    if fid in FORCE_1CUT or fid.startswith("khung_"):
        return False, [[0, 0, SIZE, SIZE]]

    # Fallback heuristic for unknown IDs
    px = alpha.load()
    v_opaque = sum(1 for y in range(80, 432) for x in range(252, 260) if px[x, y] > 200) / (352 * 8)
    h_opaque = sum(1 for y in range(252, 260) for x in range(80, 432) if px[x, y] > 200) / (352 * 8)
    if v_opaque > 0.6 and h_opaque > 0.6:
        quads = [(0, 0, HALF, HALF), (HALF, 0, SIZE, HALF), (0, HALF, HALF, SIZE), (HALF, HALF, SIZE, SIZE)]
        return True, [largest_inner_transparent_box(alpha, qx1, qy1, qx2, qy2) for (qx1, qy1, qx2, qy2) in quads]
    return False, [[0, 0, SIZE, SIZE]]


def main():
    os.makedirs(OUT_BIN_DIR, exist_ok=True)
    with open(os.path.join(DATA_DIR, "duyvinh_rc_output.json"), "r", encoding="utf-8") as f:
        dv_cfg = json.loads(json.load(f)["entries"]["camera_filter_config"])

    exclude = {"sticker_binh_luan_minh_tue", "cmt_locket"}
    frame_ids = []
    for g in dv_cfg.get("sheet_filters", []):
        if g.get("id") in ("group_photobooth", "group_frames"):
            for fid in g.get("filter_ids", []):
                if fid not in exclude and fid not in frame_ids:
                    frame_ids.append(fid)

    extra_ids = [
        "pb_cortis_4cut", "pb_cortis_v1", "pb_cortis_v2", "pb_ech_xanh",
        "pb_galaxy", "pb_meo_dang_yeu_4cut", "pb_photobooth_hello_kitty",
        "pb_shinchan_4cut", "pb_strawberry", "pb_supperman_4cut",
        "pb_trung_bac_thao", "pb_vien_hello_kitty", "pb_vintage",
        "khung_doraemon_shinchan_kitty",
    ]
    for fid in extra_ids:
        if fid not in frame_ids:
            frame_ids.append(fid)

    manifest = {}
    for fid in frame_ids:
        src_path = os.path.join(FRAMES_DIR, f"{fid}.png")
        if not os.path.isfile(src_path):
            print(f"MISSING PNG: {src_path}")
            continue
        im = Image.open(src_path).convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        is_4cut, windows = detect_windows(im, fid)
        compressed = zlib.compress(im.tobytes(), level=9)
        with open(os.path.join(OUT_BIN_DIR, f"{fid}.bin"), "wb") as bf:
            bf.write(compressed)
        manifest[fid] = {"is4Cut": is_4cut, "windows": windows}
        print(f"{fid:36s} -> {'4-CUT' if is_4cut else '1-CUT'} windows={windows} bin={len(compressed)}B")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, separators=(",", ":"))
    print(f"\nGenerated {len(manifest)} binary frames in assets/frames_bin and {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
