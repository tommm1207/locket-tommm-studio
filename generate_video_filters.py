import json
import os
import random
import zlib
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(BASE_DIR, "assets", "frames")
BINS_DIR = os.path.join(BASE_DIR, "assets", "frames_bin")
V2_DIR = os.path.join(BASE_DIR, "assets", "filters_v2")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "frames_manifest.json")

SIZE = 512
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SERIF = r"C:\Windows\Fonts\georgiab.ttf"
FONT_MONO = r"C:\Windows\Fonts\consolab.ttf"
FONT_HAND = r"C:\Windows\Fonts\segoeprb.ttf"


def get_font(path, size):
    return ImageFont.truetype(path, size)


def new_canvas():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def punch_window(img, box):
    """Ensure the photo window is 100% transparent so the user's photo shows through."""
    x1, y1, x2, y2 = box
    clear = Image.new("L", (x2 - x1, y2 - y1), 0)
    alpha = img.split()[3]
    alpha.paste(clear, (x1, y1))
    img.putalpha(alpha)


def draw_centered_text(draw, cx, cy, text, font, fill, stroke_fill=None, stroke_w=0):
    draw.text((cx, cy), text, font=font, fill=fill, anchor="mm",
              stroke_fill=stroke_fill, stroke_width=stroke_w)


def draw_frame_border(img, win, bg_color, border_color=None, border_w=4, radius=16):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, SIZE, SIZE], fill=bg_color)
    punch_window(img, win)
    if border_color:
        x1, y1, x2, y2 = win
        d.rounded_rectangle([x1 - 2, y1 - 2, x2 + 2, y2 + 2], radius=radius,
                            outline=border_color, width=border_w)
    return d


def make_comment_card(author, verified, comment, likes, handle_color=(254, 44, 85, 255), sub="09-07  Trả lời"):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # Soft dark top scrim for legibility
    for y in range(0, 148):
        a = int(130 * (1 - y / 148))
        d.line([0, y, SIZE, y], fill=(0, 0, 0, a))
    # White TikTok/social comment card pill at top center
    cx1, cy1, cx2, cy2 = 28, 22, 484, 134
    d.rounded_rectangle([cx1 + 2, cy1 + 4, cx2 + 2, cy2 + 4], radius=18, fill=(0, 0, 0, 90))
    d.rounded_rectangle([cx1, cy1, cx2, cy2], radius=18, fill=(255, 255, 255, 245))
    # Avatar circle
    ax, ay, ar = 58, 56, 20
    d.ellipse([ax - ar, ay - ar, ax + ar, ay + ar], fill=handle_color)
    draw_centered_text(d, ax, ay, author[:1].upper(), get_font(FONT_BOLD, 18), (255, 255, 255, 255))
    # Author + Verified checkmark
    f_auth = get_font(FONT_BOLD, 16)
    f_cmt = get_font(FONT_BOLD, 19)
    f_sub = get_font(FONT_REG, 13)
    d.text((88, 34), author, font=f_auth, fill=(85, 85, 95, 255))
    if verified:
        bbox = d.textbbox((88, 34), author, font=f_auth)
        vx = bbox[2] + 8
        d.ellipse([vx, 37, vx + 15, 52], fill=(32, 213, 236, 255))
        draw_centered_text(d, vx + 7.5, 44.5, "✓", get_font(FONT_BOLD, 11), (255, 255, 255, 255))
    # Comment line (wrapped if needed)
    d.text((88, 57), comment, font=f_cmt, fill=(20, 20, 25, 255))
    # Bottom metadata + heart likes
    d.text((88, 96), sub, font=f_sub, fill=(130, 130, 140, 255))
    d.text((415, 95), f"❤ {likes}", font=get_font(FONT_BOLD, 14), fill=(254, 44, 85, 255))
    return img, [0, 0, SIZE, SIZE]


def make_polaroid_vintage():
    img = new_canvas()
    win = [34, 34, 478, 412]
    d = draw_frame_border(img, win, (245, 236, 216, 255), (210, 195, 168, 255), 3, 6)
    # Vintage tape at top
    d.rectangle([206, 8, 306, 40], fill=(224, 206, 168, 205), outline=(196, 176, 138, 220))
    draw_centered_text(d, 256, 460, "Polaroid Vintage • 1998", get_font(FONT_HAND, 22), (74, 58, 42, 255))
    return img, win


def make_giang_sinh_len_am():
    img = new_canvas()
    win = [32, 32, 480, 480]
    d = draw_frame_border(img, win, (168, 28, 36, 255), (248, 236, 210, 255), 5, 22)
    # Knitted stitch chevrons along border
    for x in range(12, 500, 24):
        d.text((x, 6), "*", font=get_font(FONT_BOLD, 20), fill=(250, 240, 215, 220))
        d.text((x, 484), "*", font=get_font(FONT_BOLD, 20), fill=(250, 240, 215, 220))
    d.rounded_rectangle([146, 462, 366, 502], radius=14, fill=(22, 92, 56, 245), outline=(250, 238, 200, 255), width=2)
    draw_centered_text(d, 256, 482, "❄ GIÁNG SINH LEN ẤM ❄", get_font(FONT_BOLD, 16), (255, 245, 220, 255))
    return img, win


def make_soulmate():
    img = new_canvas()
    win = [28, 28, 484, 432]
    d = draw_frame_border(img, win, (28, 18, 26, 255), (244, 114, 182, 240), 4, 18)
    draw_centered_text(d, 256, 468, "♥  S O U L M A T E  ♥", get_font(FONT_SERIF, 24), (251, 207, 232, 255))
    draw_centered_text(d, 256, 494, "destined together • 100%", get_font(FONT_REG, 13), (244, 114, 182, 220))
    return img, win


def make_love_postcard():
    img = new_canvas()
    win = [30, 30, 482, 424]
    d = draw_frame_border(img, win, (252, 247, 238, 255), (218, 62, 82, 230), 3, 10)
    # Airmail red/blue edge stripes
    colors = [(220, 48, 68, 240), (37, 99, 235, 240)]
    for i, x in enumerate(range(0, SIZE, 28)):
        d.rectangle([x, 0, x + 16, 12], fill=colors[i % 2])
        d.rectangle([x, SIZE - 12, x + 16, SIZE], fill=colors[(i + 1) % 2])
    draw_centered_text(d, 256, 456, "💌 LOVE POSTCARD • AIR MAIL 💌", get_font(FONT_BOLD, 19), (190, 24, 65, 255))
    draw_centered_text(d, 256, 482, "Sending all my heart to you", get_font(FONT_HAND, 15), (71, 85, 105, 255))
    return img, win


def make_giang_sinh_tuan_loc():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # Festive top badge & snowflakes + reindeer antlers silhouette
    d.rounded_rectangle([110, 18, 402, 62], radius=20, fill=(136, 44, 24, 225), outline=(251, 191, 36, 255), width=3)
    draw_centered_text(d, 256, 40, "🦌 GIÁNG SINH TUẦN LỘC 🎄", get_font(FONT_BOLD, 17), (255, 248, 225, 255))
    for sx, sy in [(42, 46), (470, 52), (38, 458), (472, 448), (90, 95), (430, 102)]:
        draw_centered_text(d, sx, sy, "❄", get_font(FONT_BOLD, 24), (255, 255, 255, 220))
    return img, [0, 0, SIZE, SIZE]


def make_giang_sinh_selfie():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # String lights at top
    d.line([0, 22, 128, 38, 256, 24, 384, 38, 512, 22], fill=(22, 101, 52, 240), width=4)
    bulbs = [(48, 28, (239, 68, 68, 255)), (118, 38, (250, 204, 21, 255)), (196, 30, (34, 197, 94, 255)),
             (316, 30, (239, 68, 68, 255)), (394, 38, (56, 189, 248, 255)), (464, 28, (250, 204, 21, 255))]
    for bx, by, bc in bulbs:
        d.ellipse([bx - 8, by - 4, bx + 8, by + 12], fill=bc)
    d.rounded_rectangle([128, 446, 384, 492], radius=22, fill=(185, 28, 28, 230), outline=(255, 255, 255, 240), width=2)
    draw_centered_text(d, 256, 469, "✨ MERRY XMAS SELFIE ✨", get_font(FONT_BOLD, 17), (255, 255, 255, 255))
    return img, [0, 0, SIZE, SIZE]


def make_ho_ho_ho():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([96, 20, 416, 76], radius=24, fill=(220, 38, 38, 235), outline=(255, 255, 255, 255), width=4)
    draw_centered_text(d, 256, 48, "🎅 HO HO HO! 🎁", get_font(FONT_BOLD, 24), (255, 255, 255, 255))
    d.rounded_rectangle([146, 456, 366, 494], radius=18, fill=(21, 128, 61, 225))
    draw_centered_text(d, 256, 475, "Ngoan Thì Có Quà Nhé!", get_font(FONT_BOLD, 15), (255, 255, 255, 255))
    return img, [0, 0, SIZE, SIZE]


def make_chung_minh_la_ban():
    img = new_canvas()
    win = [28, 28, 484, 424]
    d = draw_frame_border(img, win, (255, 241, 242, 255), (251, 113, 133, 255), 4, 20)
    d.rounded_rectangle([96, 444, 416, 492], radius=20, fill=(244, 63, 94, 255))
    draw_centered_text(d, 256, 468, "💛 CHÚNG MÌNH LÀ BẠN THÂN 💛", get_font(FONT_BOLD, 17), (255, 255, 255, 255))
    return img, win


def make_locket_camera():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    c = (255, 255, 255, 235)
    # Viewfinder corner brackets
    for (x, y, dx, dy) in [(26, 26, 36, 36), (486, 26, -36, 36), (26, 486, 36, -36), (486, 486, -36, -36)]:
        d.line([x, y, x + dx, y], fill=c, width=4)
        d.line([x, y, x, y + dy], fill=c, width=4)
    # Center focus reticle
    d.line([242, 256, 270, 256], fill=(255, 255, 255, 160), width=2)
    d.line([256, 242, 256, 270], fill=(255, 255, 255, 160), width=2)
    # REC + Camera telemetry
    d.ellipse([44, 42, 60, 58], fill=(239, 68, 68, 255))
    d.text((68, 39), "REC  •  LOCKET CAM", font=get_font(FONT_MONO, 16), fill=(255, 255, 255, 245), stroke_fill=(0, 0, 0, 200), stroke_width=2)
    d.text((340, 39), "ISO 400  f/1.8", font=get_font(FONT_MONO, 14), fill=(250, 204, 21, 245), stroke_fill=(0, 0, 0, 200), stroke_width=2)
    d.text((44, 464), "24mm WIDE  [AF-C]", font=get_font(FONT_MONO, 14), fill=c, stroke_fill=(0, 0, 0, 200), stroke_width=2)
    d.text((374, 464), "BAT [■■■] 100%", font=get_font(FONT_MONO, 14), fill=(74, 222, 128, 255), stroke_fill=(0, 0, 0, 200), stroke_width=2)
    return img, [0, 0, SIZE, SIZE]


def make_spotify(theme="dark"):
    img = new_canvas()
    win = [46, 44, 466, 368]
    if theme == "dark":
        bg = (18, 18, 18, 255)
        card = (32, 32, 36, 255)
        accent = (30, 215, 96, 255)
        fg = (255, 255, 255, 255)
        sub = (179, 179, 179, 255)
        title = "LOCKET VIBES • PLAYLIST"
        song = "ilysm (feat. you)"
    else:
        bg = (253, 226, 238, 255)
        card = (251, 207, 232, 255)
        accent = (236, 72, 153, 255)
        fg = (80, 15, 48, 255)
        sub = (157, 23, 77, 255)
        title = "SPOTIFY HỒNG • LOVELY MIX"
        song = "crush on you ♥"
    d = draw_frame_border(img, win, bg, accent, 3, 14)
    # Top mac/PC bar dots
    for i, col in enumerate([(239, 68, 68, 255), (250, 204, 21, 255), (34, 197, 94, 255)]):
        d.ellipse([22 + i * 20, 14, 34 + i * 20, 26], fill=col)
    d.text((100, 12), title, font=get_font(FONT_BOLD, 14), fill=sub)
    # Bottom Spotify player bar
    d.rounded_rectangle([24, 380, 488, 496], radius=16, fill=card)
    d.text((42, 392), song, font=get_font(FONT_BOLD, 20), fill=fg)
    d.text((42, 420), "Now Playing • Locket Radio", font=get_font(FONT_REG, 14), fill=sub)
    # Progress bar
    d.rounded_rectangle([42, 452, 400, 458], radius=3, fill=(120, 120, 130, 130))
    d.rounded_rectangle([42, 452, 290, 458], radius=3, fill=accent)
    d.ellipse([284, 449, 296, 461], fill=fg)
    d.text((42, 466), "1:27", font=get_font(FONT_MONO, 12), fill=sub)
    d.text((370, 466), "2:07", font=get_font(FONT_MONO, 12), fill=sub)
    # Play/Pause circle button
    d.ellipse([424, 404, 474, 454], fill=accent)
    draw_centered_text(d, 450, 429, "▶", get_font(FONT_BOLD, 20), (255, 255, 255, 255) if theme == "pink" else (18, 18, 18, 255))
    return img, win


def make_fuji_film():
    img = new_canvas()
    win = [44, 24, 468, 488]
    d = draw_frame_border(img, win, (16, 18, 18, 255), (34, 197, 94, 230), 2, 4)
    # Film sprocket holes on left and right
    for y in range(18, SIZE - 20, 40):
        d.rounded_rectangle([10, y, 30, y + 22], radius=4, fill=(245, 245, 245, 230))
        d.rounded_rectangle([482, y, 502, y + 22], radius=4, fill=(245, 245, 245, 230))
    d.text((54, 4), "FUJIFILM SUPERIA 400   •   27 EXP   •   FRAME 24A", font=get_font(FONT_MONO, 13), fill=(74, 222, 128, 255))
    d.text((320, 492), "'26 11 27  10:40", font=get_font(FONT_MONO, 14), fill=(251, 146, 60, 255))
    return img, win


def make_overlay_card_bottom(title_bg, title_fg, title_text, body_bg, lines, accent=(255, 255, 255, 255)):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    x1, y1, x2, y2 = 34, 356, 478, 490
    d.rounded_rectangle([x1 + 2, y1 + 4, x2 + 2, y2 + 4], radius=16, fill=(0, 0, 0, 100))
    d.rounded_rectangle([x1, y1, x2, y2], radius=16, fill=body_bg, outline=accent, width=2)
    d.rounded_rectangle([x1, y1, x2, y1 + 38], radius=14, fill=title_bg)
    d.rectangle([x1, y1 + 20, x2, y1 + 38], fill=title_bg)
    draw_centered_text(d, 256, y1 + 19, title_text, get_font(FONT_BOLD, 16), title_fg)
    cy = y1 + 58
    for txt, col, sz in lines:
        draw_centered_text(d, 256, cy, txt, get_font(FONT_BOLD, sz), col)
        cy += sz + 12
    return img, [0, 0, SIZE, SIZE]


def make_gay_meter():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([44, 376, 468, 488], radius=20, fill=(20, 20, 28, 230), outline=(255, 255, 255, 220), width=2)
    draw_centered_text(d, 256, 404, "🌈 GAY METER RANDOM 🌈", get_font(FONT_BOLD, 18), (255, 255, 255, 255))
    # Rainbow bar
    cols = [(239, 68, 68, 255), (249, 115, 22, 255), (250, 204, 21, 255), (34, 197, 94, 255), (59, 130, 246, 255), (168, 85, 247, 255)]
    bw = 380 // len(cols)
    for i, c in enumerate(cols):
        d.rectangle([66 + i * bw, 428, 66 + (i + 1) * bw, 448], fill=c)
    draw_centered_text(d, 256, 468, "KẾT QUẢ: 100% CHÍNH HIỆU ✨", get_font(FONT_BOLD, 15), (253, 224, 71, 255))
    return img, [0, 0, SIZE, SIZE]


def make_chua_som():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([64, 386, 448, 482], radius=24, fill=(15, 23, 42, 230), outline=(99, 102, 241, 255), width=3)
    draw_centered_text(d, 256, 418, "🌙 CHƯA SỚM ĐÂU!", get_font(FONT_BOLD, 22), (165, 180, 252, 255))
    draw_centered_text(d, 256, 454, "Giờ này còn thức làm gì vậy bro?", get_font(FONT_REG, 15), (226, 232, 240, 255))
    return img, [0, 0, SIZE, SIZE]


def make_bang_tin_khan():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # LIVE badge top-left
    d.rounded_rectangle([24, 24, 134, 58], radius=8, fill=(220, 38, 38, 245))
    draw_centered_text(d, 79, 41, "● TRỰC TIẾP", get_font(FONT_BOLD, 14), (255, 255, 255, 255))
    # TV lower third
    d.rectangle([0, 396, SIZE, 434], fill=(220, 38, 38, 245))
    d.rectangle([0, 434, SIZE, 492], fill=(250, 204, 21, 245))
    draw_centered_text(d, 256, 415, "🚨 BẢNG TIN KHẨN CẤP 24H 🚨", get_font(FONT_BOLD, 19), (255, 255, 255, 255))
    draw_centered_text(d, 256, 462, "Phát hiện một người quá xinh đẹp đang lướt Locket!", get_font(FONT_BOLD, 16), (17, 24, 39, 255))
    return img, [0, 0, SIZE, SIZE]


def make_ve_gui_xe():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([40, 366, 472, 492], radius=10, fill=(254, 240, 138, 242), outline=(225, 29, 72, 245), width=3)
    draw_centered_text(d, 256, 392, "🎫 VÉ TRÔNG GIỮ XE  •  SỐ 0079", get_font(FONT_BOLD, 18), (190, 18, 60, 255))
    d.line([58, 414, 454, 414], fill=(225, 29, 72, 180), width=2)
    draw_centered_text(d, 256, 438, "Biển số: TRÁI TIM BẠN   |   Giá: 5.000đ", get_font(FONT_BOLD, 15), (30, 41, 59, 255))
    draw_centered_text(d, 256, 468, "Lưu ý: Mất vé đền bằng nụ cười ♥", get_font(FONT_REG, 14), (88, 28, 135, 255))
    return img, [0, 0, SIZE, SIZE]


def make_vo_hoc_sinh():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # Notebook lined header banner + margin line
    d.rectangle([0, 0, SIZE, 88], fill=(254, 252, 243, 240))
    d.line([0, 88, SIZE, 88], fill=(239, 68, 68, 230), width=3)
    d.line([62, 0, 62, 88], fill=(239, 68, 68, 200), width=2)
    for ly in [28, 56]:
        d.line([0, ly, SIZE, ly], fill=(147, 197, 253, 180), width=1)
    d.text((76, 12), "VỞ HỌC SINH  •  Tiến Bộ Mỗi Ngày", font=get_font(FONT_BOLD, 17), fill=(30, 58, 138, 255))
    d.text((76, 40), "Họ & Tên: ..............................   Lớp: 12A1", font=get_font(FONT_HAND, 15), fill=(37, 99, 235, 255))
    return img, [0, 0, SIZE, SIZE]


def make_giao_vien_cham_bai():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([240, 22, 488, 142], radius=16, fill=(255, 255, 255, 230), outline=(220, 38, 38, 245), width=4)
    draw_centered_text(d, 364, 58, "10 / 10", get_font(FONT_SERIF, 32), (220, 38, 38, 255))
    draw_centered_text(d, 364, 96, "GIÁO VIÊN CHẤM BÀI", get_font(FONT_BOLD, 13), (185, 28, 28, 255))
    draw_centered_text(d, 364, 120, "Lời phê: Đẹp xuất sắc! ★", get_font(FONT_HAND, 14), (220, 38, 38, 255))
    return img, [0, 0, SIZE, SIZE]


def make_nhiem_vu_hom_nay():
    return make_overlay_card_bottom(
        (29, 78, 216, 255), (255, 255, 255, 255), "⚔️ NHIỆM VỤ HÔM NAY",
        (15, 23, 42, 232),
        [
            ("☑ Cười thật tươi (Hoàn thành)", (74, 222, 128, 255), 16),
            ("☑ Đăng 1 tấm Locket xinh xỉu (+999 EXP)", (250, 204, 21, 255), 15),
        ],
        accent=(56, 189, 248, 255),
    )


def make_hoa_don_di_choi():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([54, 344, 458, 494], radius=8, fill=(250, 250, 249, 242), outline=(100, 116, 139, 220), width=2)
    draw_centered_text(d, 256, 368, "🧾 HÓA ĐƠN ĐI CHƠI", get_font(FONT_MONO, 18), (15, 23, 42, 255))
    d.text((74, 390), "----------------------------------------", font=get_font(FONT_MONO, 14), fill=(100, 116, 139, 255))
    d.text((78, 410), "1x Trà Sữa + Nói Xấu Thiên Hạ    FREE", font=get_font(FONT_MONO, 14), fill=(30, 41, 59, 255))
    d.text((78, 434), "1x Kỷ Niệm Vui Quá Trời        PRICELESS", font=get_font(FONT_MONO, 14), fill=(30, 41, 59, 255))
    d.text((78, 460), "TỔNG CỘNG: HẾT TIỀN VỀ NHÀ 😭", font=get_font(FONT_MONO, 15), fill=(220, 38, 38, 255))
    return img, [0, 0, SIZE, SIZE]


def make_mood_banner(top_text, sub_text, bg_col, border_col):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([32, 386, 480, 486], radius=22, fill=bg_col, outline=border_col, width=3)
    draw_centered_text(d, 256, 422, top_text, get_font(FONT_BOLD, 19), (255, 255, 255, 255))
    draw_centered_text(d, 256, 458, sub_text, get_font(FONT_REG, 14), (253, 224, 71, 255))
    return img, [0, 0, SIZE, SIZE]


def make_meo_meme():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([42, 392, 470, 484], radius=22, fill=(180, 83, 9, 232), outline=(254, 240, 138, 255), width=3)
    draw_centered_text(d, 256, 424, "🐱 RẠP XIẾC TRUNG ƯƠNG • MÈO MEME", get_font(FONT_BOLD, 17), (255, 255, 255, 255))
    draw_centered_text(d, 256, 456, "Meo meo... nhìn gì mà nhìn dữ vậy?", get_font(FONT_HAND, 15), (254, 240, 138, 255))
    return img, [0, 0, SIZE, SIZE]


def make_faker():
    img = new_canvas()
    win = [20, 20, 492, 438]
    d = draw_frame_border(img, win, (17, 17, 21, 255), (220, 38, 38, 255), 5, 14)
    d.rectangle([20, 444, 492, 496], fill=(153, 27, 27, 255))
    draw_centered_text(d, 256, 470, "🤫 SHHH... FAKER • T1 MVP 🏆", get_font(FONT_BOLD, 20), (253, 224, 71, 255))
    return img, win


def make_hai_trai_cay():
    img = new_canvas()
    win = [24, 24, 488, 440]
    d = draw_frame_border(img, win, (254, 249, 195, 255), (22, 163, 74, 255), 5, 20)
    d.rounded_rectangle([88, 448, 424, 494], radius=18, fill=(22, 163, 74, 255))
    draw_centered_text(d, 256, 471, "🍓 HÁI TRÁI CÂY CHILL CHILL 🍊", get_font(FONT_BOLD, 17), (255, 255, 255, 255))
    return img, win


def make_mona_lisa():
    img = new_canvas()
    win = [48, 48, 464, 424]
    d = draw_frame_border(img, win, (146, 102, 34, 255), (250, 204, 21, 255), 8, 6)
    d.rectangle([16, 16, 496, 496], outline=(217, 166, 62, 255), width=6)
    d.rounded_rectangle([120, 444, 392, 490], radius=8, fill=(217, 166, 62, 255), outline=(92, 60, 12, 255), width=2)
    draw_centered_text(d, 256, 467, "MONA LISA • LOUVRE 1503", get_font(FONT_SERIF, 16), (45, 28, 6, 255))
    return img, win


def make_lut_icon(out_path, c1, c2, emoji_text, badge_text):
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 255))
    d = ImageDraw.Draw(im)
    for y in range(128):
        t = y / 127.0
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        d.line([0, y, 128, y], fill=(r, g, b, 255))
    d.rounded_rectangle([4, 4, 124, 124], radius=28, outline=(255, 255, 255, 190), width=4)
    draw_centered_text(d, 64, 48, badge_text, get_font(FONT_BOLD, 28), (255, 255, 255, 255))
    draw_centered_text(d, 64, 92, emoji_text, get_font(FONT_BOLD, 16), (255, 248, 220, 240))
    im.save(out_path, "PNG")


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    os.makedirs(V2_DIR, exist_ok=True)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as mf:
        manifest = json.load(mf)

    specs = {
        "nm_polaroid_vintage": make_polaroid_vintage,
        "nm_giang_sinh_len_am": make_giang_sinh_len_am,
        "nm_soulmate": make_soulmate,
        "nm_love_postcard": make_love_postcard,
        "nm_giang_sinh_tuan_loc": make_giang_sinh_tuan_loc,
        "nm_giang_sinh_selfie": make_giang_sinh_selfie,
        "nm_ho_ho_ho": make_ho_ho_ho,
        "nm_chung_minh_la_ban": make_chung_minh_la_ban,
        "nm_son_tung_mtp": lambda: make_comment_card("Sơn Tùng M-TP", True, "Flop quá thì cứ ghi tên anh vào", "23.6K"),
        "nm_ronaldo_siuuu": lambda: make_comment_card("Cristiano Ronaldo", True, "SIUUUUU! Đỉnh quá bro ơi!", "999K", (220, 38, 38, 255)),
        "nm_phai_luon_tu_te": lambda: make_comment_card("Cư Dân Mạng", False, "Phải luôn tử tế với nhau nhé!", "42.5K", (16, 185, 129, 255)),
        "nm_chi_can_mot_vet_xuoc": lambda: make_comment_card("Cư Dân Mạng", False, "Chỉ cần một vết xước thôi là tới chuyện", "18.2K", (245, 158, 11, 255)),
        "nm_trend_tic_toc": lambda: make_comment_card("Tíc Tóc Trending", True, "Lên xu hướng rồi, thả tim lẹ nào!", "128K", (14, 165, 233, 255)),
        "nm_ai_cho_xinh_vay": lambda: make_comment_card("Cư Dân Mạng", False, "Ủa ai cho xinh đẹp quá vậy trời??", "56.4K", (236, 72, 153, 255)),
        "nm_tam_cuoi_dang_dang": lambda: make_comment_card("Cư Dân Mạng", False, "Chụp 100 tấm được đúng tấm cuối đáng đăng", "31.9K", (124, 58, 237, 255)),
        "nm_locket_camera": make_locket_camera,
        "nm_spotify_pc": lambda: make_spotify("dark"),
        "nm_spotify_hong": lambda: make_spotify("pink"),
        "nm_fuji_film": make_fuji_film,
        "nm_gay_meter": make_gay_meter,
        "nm_chua_som": make_chua_som,
        "nm_bang_tin_khan": make_bang_tin_khan,
        "nm_ve_gui_xe": make_ve_gui_xe,
        "nm_vo_hoc_sinh": make_vo_hoc_sinh,
        "nm_giao_vien_cham_bai": make_giao_vien_cham_bai,
        "nm_nhiem_vu_hom_nay": make_nhiem_vu_hom_nay,
        "nm_hoa_don_di_choi": make_hoa_don_di_choi,
        "nm_khong_can_ai_duyet": lambda: make_mood_banner("KHÔNG CẦN AI DUYỆT 😎", "Thích thì đăng, ai nói gì kệ họ!", (30, 41, 59, 230), (56, 189, 248, 255)),
        "nm_ban_la_gi": lambda: make_mood_banner("BẠN LÀ GÌ? ✨", "Mà sao vừa bước qua đã làm tim rung động?", (157, 23, 77, 230), (249, 168, 212, 255)),
        "nm_ong_troi_that_bat_cong": lambda: make_mood_banner("ÔNG TRỜI THẬT BẤT CÔNG 🌩️", "Sao lại chia đều nhan sắc hết cho một người vậy?", (88, 28, 135, 230), (192, 132, 252, 255)),
        "nm_yeu_giau_chu_co_phai": lambda: make_mood_banner("YÊU GIẤU CHỨ CÓ PHẢI GIẤU YÊU ĐÂU 💗", "Thương âm thầm mà sao mặt cứ lộ hết trơn", (190, 18, 60, 230), (253, 164, 175, 255)),
        "nm_me_con_em_don_anh_ve": lambda: make_mood_banner("MẸ CON EM ĐÓN ANH VỀ 🚗💨", "Đi đâu cũng nhớ lối về với mẹ con em nhé!", (180, 83, 9, 232), (253, 224, 71, 255)),
        "nm_meo_meme": make_meo_meme,
        "nm_faker": make_faker,
        "nm_hai_trai_cay": make_hai_trai_cay,
        "nm_mona_lisa": make_mona_lisa,
    }

    for fid, fn in specs.items():
        img, win = fn()
        img_rgb = img.convert("RGBA").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        png_path = os.path.join(FRAMES_DIR, f"{fid}.png")
        bin_path = os.path.join(BINS_DIR, f"{fid}.bin")
        img_rgb.save(png_path, "PNG")
        with open(bin_path, "wb") as bf:
            bf.write(zlib.compress(img_rgb.tobytes(), level=9))
        is_4cut = False
        manifest[fid] = {"is4Cut": is_4cut, "windows": [win]}

    with open(MANIFEST_PATH, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, separators=(",", ":"))

    # 4 LUT icons in assets/filters_v2/
    make_lut_icon(os.path.join(V2_DIR, "nm_nau_co_dien.png"), (120, 68, 30), (214, 158, 92), "Nâu Cổ Điển", "LUT")
    make_lut_icon(os.path.join(V2_DIR, "nm_dem_xanh.png"), (15, 23, 42), (37, 99, 235), "Đêm Xanh", "NIT")
    make_lut_icon(os.path.join(V2_DIR, "nm_film_35mm.png"), (180, 83, 9), (251, 191, 36), "Film 35mm", "35MM")
    make_lut_icon(os.path.join(V2_DIR, "nm_xam_matte.png"), (51, 65, 85), (148, 163, 184), "Xám Matte", "B&M")

    print(f"Generated {len(specs)} NM frames + 4 LUT icons. Total manifest frames: {len(manifest)}")


if __name__ == "__main__":
    main()
