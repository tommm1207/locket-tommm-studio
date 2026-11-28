// =========================================================================
// Cloudflare Worker 24/7 - Locket Gold PNG Frame, Photobooth & AI Engine
// - 100% Mien phi 0d, chay 24/7 tren Cloudflare Workers (By Tommm)
// - Khung PNG / Photobooth 4 o giu nguyen khuon mat 100% (uu tien so 1)
// - AI Filters chay bang Cloudflare Workers AI (FLUX.2 Klein 4B), 0d, khong can API key ngoai
// - Cac filter khong nhan dien duoc se pass-through ve server Locket
// =========================================================================

import jpeg from "jpeg-js";
import { VERIFIED_QUOTE_BANK } from "./quotes_bank.js";

const SIZE = 512;
const WD_SIZE = 768;
const HD_SIZE = 768;
const GITHUB_FRAMES_BIN_BASE =
  "https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main/assets/frames_bin";

const FRAMES_MANIFEST = {"frame_berry_days":{"is4Cut":true,"windows":[[36,39,244,244],[268,39,477,244],[36,262,244,471],[268,262,477,471]]},"frame_happy_snap":{"is4Cut":true,"windows":[[31,27,246,240],[267,28,482,240],[31,264,247,478],[267,264,482,478]]},"frame_sky_diary":{"is4Cut":true,"windows":[[34,31,244,243],[269,31,479,243],[34,267,244,474],[269,267,479,475]]},"photobooth_4cut":{"is4Cut":true,"windows":[[56,92,247,247],[265,92,456,247],[56,265,247,420],[265,265,456,420]]},"photobooth_cute":{"is4Cut":false,"windows":[[72,72,440,440]]},"pb_holo_4cut":{"is4Cut":true,"windows":[[26,30,245,246],[264,21,491,245],[31,262,246,495],[266,263,490,473]]},"pb_scrapbook_ripped_4cut":{"is4Cut":true,"windows":[[39,44,240,243],[273,43,475,243],[39,271,241,472],[274,272,475,471]]},"pb_ripped_paper_4cut":{"is4Cut":true,"windows":[[30,23,236,235],[273,23,481,234],[33,263,236,479],[276,261,484,479]]},"pb_denim_ripped_2x2":{"is4Cut":true,"windows":[[32,27,241,236],[271,28,480,235],[32,264,245,477],[274,260,483,481]]},"frame_classic_pb":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hello_kitty_pastel_ngot_ngao":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hello_kitty_hong_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_pastel_vien_ren":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hoa_pastel_vien_xanh_xinh":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_spiderred":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_khong_gian_xanh_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_ngoi_sao_hong_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_pastel_so_hai_cau":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_shin_chan":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_anh_hellokitty_v_sao":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_xanh_tay_sao_vang":{"is4Cut":false,"windows":[[0,0,512,512]]},"sinh_nhat_hello_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_y2k_silver_holo":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_denim_ripped":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_film_nostalgia":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_cortis_4cut":{"is4Cut":true,"windows":[[32,41,255,252],[258,41,480,252],[32,256,255,468],[258,256,480,473]]},"pb_cortis_v1":{"is4Cut":true,"windows":[[39,42,252,246],[263,42,474,246],[39,258,252,468],[262,258,474,468]]},"pb_cortis_v2":{"is4Cut":true,"windows":[[49,45,254,232],[258,45,463,233],[49,256,254,446],[258,256,463,446]]},"pb_ech_xanh":{"is4Cut":true,"windows":[[73,94,252,247],[258,94,437,247],[73,256,252,423],[258,256,437,423]]},"pb_galaxy":{"is4Cut":true,"windows":[[34,31,244,243],[269,31,479,243],[34,267,244,474],[269,267,479,475]]},"pb_meo_dang_yeu_4cut":{"is4Cut":true,"windows":[[47,36,254,255],[261,45,465,255],[50,257,251,474],[261,257,466,475]]},"pb_photobooth_hello_kitty":{"is4Cut":true,"windows":[[47,102,255,254],[256,102,464,254],[47,256,255,424],[256,256,464,424]]},"pb_shinchan_4cut":{"is4Cut":true,"windows":[[39,46,250,247],[259,45,471,248],[37,256,252,469],[259,256,473,469]]},"pb_strawberry":{"is4Cut":true,"windows":[[36,39,244,244],[268,39,477,244],[36,262,244,471],[268,262,477,471]]},"pb_supperman_4cut":{"is4Cut":true,"windows":[[39,28,245,248],[268,28,474,248],[39,264,245,478],[267,264,474,478]]},"pb_trung_bac_thao":{"is4Cut":true,"windows":[[70,82,255,256],[263,82,448,256],[70,270,255,450],[263,270,448,450]]},"pb_vien_hello_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_vintage":{"is4Cut":true,"windows":[[31,27,246,240],[267,28,482,240],[31,264,247,478],[267,264,482,478]]},"khung_doraemon_shinchan_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_polaroid_vintage":{"is4Cut":false,"windows":[[34,34,478,412]]},"nm_giang_sinh_len_am":{"is4Cut":false,"windows":[[32,32,480,480]]},"nm_soulmate":{"is4Cut":false,"windows":[[28,28,484,432]]},"nm_love_postcard":{"is4Cut":false,"windows":[[30,30,482,424]]},"nm_giang_sinh_tuan_loc":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_giang_sinh_selfie":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_ho_ho_ho":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_chung_minh_la_ban":{"is4Cut":false,"windows":[[28,28,484,424]]},"nm_son_tung_mtp":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_ronaldo_siuuu":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_phai_luon_tu_te":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_chi_can_mot_vet_xuoc":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_trend_tic_toc":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_ai_cho_xinh_vay":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_tam_cuoi_dang_dang":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_locket_camera":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_spotify_pc":{"is4Cut":false,"windows":[[46,44,466,368]]},"nm_spotify_hong":{"is4Cut":false,"windows":[[46,44,466,368]]},"nm_fuji_film":{"is4Cut":false,"windows":[[44,24,468,488]]},"nm_gay_meter":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_chua_som":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_bang_tin_khan":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_ve_gui_xe":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_vo_hoc_sinh":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_giao_vien_cham_bai":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_nhiem_vu_hom_nay":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_hoa_don_di_choi":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_khong_can_ai_duyet":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_ban_la_gi":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_ong_troi_that_bat_cong":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_yeu_giau_chu_co_phai":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_me_con_em_don_anh_ve":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_meo_meme":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_hai_trai_cay":{"is4Cut":false,"windows":[[24,24,488,440]]},"fx_ca_cute":{"is4Cut":false,"windows":[[0,0,512,512]]},"fx_canh_hoa":{"is4Cut":false,"windows":[[0,0,512,512]]},"fx_sticker_doodle":{"is4Cut":false,"windows":[[0,0,512,512]]},"fx_buom_xinh":{"is4Cut":false,"windows":[[0,0,512,512]]},"fx_bong_bong":{"is4Cut":false,"windows":[[0,0,512,512]]},"fx_cau_vong":{"is4Cut":false,"windows":[[0,0,512,512]]},"fx_sao_lap_lanh":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_boi_do_hay_den":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_boi_duyen_tinh":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_boi_nay_nen_an_gi":{"is4Cut":false,"windows":[[0,0,512,512]]},"nm_boi_xem_que":{"is4Cut":false,"windows":[[0,0,512,512]]}};

const RANDOM_VARIANT_FRAMES = {
  nm_boi_do_hay_den: 4,
  nm_boi_duyen_tinh: 4,
  nm_boi_nay_nen_an_gi: 4,
  nm_boi_xem_que: 4,
};
const LAST_RANDOM_VARIANT = new Map();

const LUT_FILTERS = {
  dazz_cpm35: { rMul: 1.08, gMul: 1.02, bMul: 0.90, contrast: 1.12, brightness: 4, sat: 1.10, fade: 14, vig: 0.22, grain: 10 },
  dazz_classic_u: { rMul: 1.06, gMul: 1.00, bMul: 0.93, contrast: 1.16, brightness: 2, sat: 1.14, fade: 10, vig: 0.25, grain: 8 },
  dazz_fqs: { rMul: 0.98, gMul: 1.05, bMul: 1.02, contrast: 1.10, brightness: 3, sat: 1.08, fade: 12, vig: 0.18, grain: 7 },
  dazz_inst_c: { rMul: 1.07, gMul: 1.03, bMul: 0.95, contrast: 0.96, brightness: 12, sat: 0.92, fade: 24, vig: 0.20, grain: 6 },
  dazz_grd: { rMul: 1.0, gMul: 1.0, bMul: 1.0, contrast: 1.32, brightness: 0, sat: 0.0, fade: 8, vig: 0.28, grain: 14, bw: true },
  lut_iphone_beauty: { rMul: 1.05, gMul: 1.02, bMul: 1.03, contrast: 1.03, brightness: 10, sat: 1.05, fade: 4, vig: 0.06, grain: 0 },
  lut_film_han: { rMul: 1.05, gMul: 1.02, bMul: 1.04, contrast: 0.95, brightness: 12, sat: 0.90, fade: 18, vig: 0.10, grain: 4 },
  lut_trang_sua: { rMul: 1.03, gMul: 1.03, bMul: 1.05, contrast: 0.97, brightness: 16, sat: 0.88, fade: 14, vig: 0.08, grain: 0 },
  lut_kodak_am: { rMul: 1.11, gMul: 1.03, bMul: 0.87, contrast: 1.10, brightness: 5, sat: 1.15, fade: 12, vig: 0.20, grain: 8 },
  lut_fuji_chrome: { rMul: 0.97, gMul: 1.03, bMul: 1.04, contrast: 1.14, brightness: 0, sat: 0.82, fade: 12, vig: 0.18, grain: 6 },
  lut_phim_nhat: { rMul: 0.98, gMul: 1.05, bMul: 1.06, contrast: 0.94, brightness: 14, sat: 0.88, fade: 20, vig: 0.10, grain: 5 },
  lut_vintage: { rMul: 1.12, gMul: 1.01, bMul: 0.84, contrast: 1.06, brightness: 3, sat: 0.78, fade: 22, vig: 0.26, grain: 11 },
  lut_kodak_portra: { rMul: 1.07, gMul: 1.02, bMul: 0.94, contrast: 0.98, brightness: 8, sat: 1.04, fade: 12, vig: 0.12, grain: 5 },
  lut_fuji_superia: { rMul: 0.98, gMul: 1.06, bMul: 1.04, contrast: 1.12, brightness: 4, sat: 1.12, fade: 10, vig: 0.16, grain: 6 },
  lut_kodak_gold: { rMul: 1.12, gMul: 1.05, bMul: 0.86, contrast: 1.08, brightness: 8, sat: 1.14, fade: 14, vig: 0.18, grain: 8 },
  lut_cinestill_800t: { rMul: 0.96, gMul: 1.02, bMul: 1.14, contrast: 1.16, brightness: 2, sat: 1.06, fade: 12, vig: 0.24, grain: 9 },
  lut_hong_dao: { rMul: 1.09, gMul: 1.01, bMul: 1.03, contrast: 0.96, brightness: 14, sat: 1.06, fade: 12, vig: 0.08, grain: 0 },
  lut_matcha: { rMul: 0.97, gMul: 1.06, bMul: 0.97, contrast: 0.94, brightness: 12, sat: 0.92, fade: 16, vig: 0.10, grain: 3 },
  lut_ulzzang_pink: { rMul: 1.08, gMul: 1.00, bMul: 1.05, contrast: 0.97, brightness: 16, sat: 0.96, fade: 14, vig: 0.06, grain: 0 },
  lut_nang_ban_mai: { rMul: 1.10, gMul: 1.04, bMul: 0.90, contrast: 1.04, brightness: 12, sat: 1.10, fade: 10, vig: 0.10, grain: 2 },
  lut_tone_lanh: { rMul: 0.94, gMul: 1.01, bMul: 1.10, contrast: 1.05, brightness: 6, sat: 0.92, fade: 10, vig: 0.12, grain: 2 },
  lut_kem_bo: { rMul: 1.06, gMul: 1.05, bMul: 0.93, contrast: 0.93, brightness: 15, sat: 0.90, fade: 20, vig: 0.08, grain: 3 },
  nm_nau_co_dien: { rMul: 1.12, gMul: 1.02, bMul: 0.82, contrast: 1.08, brightness: 2, sat: 0.72, fade: 22, vig: 0.28, grain: 10 },
  nm_dem_xanh: { rMul: 0.86, gMul: 1.00, bMul: 1.18, contrast: 1.15, brightness: -4, sat: 0.92, fade: 14, vig: 0.30, grain: 8 },
  nm_film_35mm: { rMul: 1.08, gMul: 1.03, bMul: 0.92, contrast: 1.10, brightness: 4, sat: 1.06, fade: 18, vig: 0.22, grain: 12 },
  nm_xam_matte: { rMul: 0.96, gMul: 0.97, bMul: 0.99, contrast: 0.92, brightness: 6, sat: 0.42, fade: 28, vig: 0.16, grain: 7 },
};

const WARP_FILTERS = {
  warp_big_head: true,
  warp_tiny_face: true,
  warp_alien_vline: true,
  warp_hamster: true,
  warp_bug_eyes: true,
  warp_wide_mouth: true,
  warp_chubby: true,
  warp_gigachad: true,
  warp_swirl: true,
  warp_melt: true,
  warp_fisheye: true,
  warp_fisheye_dazz: true,
};

const SPECIAL_FX_IDS = new Set([
  "clock_weekday_overlay",
  "portrait_bokeh",
  "cctv_camera",
  "triple_clone",
  "fx_giot_nuoc",
  "fx_giot_nuoc_ro",
  "fx_mua_roi",
  "fx_tuyet_roi",
]);

const FACE_LOCK_KEEP_BG =
  "Edit input_image_0 keeping the exact same person, identical face, eyes, nose, mouth, natural skin texture, expression, head position, hair, and original background untouched. Candid smartphone photo, matte realistic lighting: ";

const FACE_LOCK_SWAP_BG =
  "Edit input_image_0 keeping the exact same person, identical face shape, eyes, exact eye expression, glasses if worn, nose, lips, natural unretouched skin texture, head angle, and exact head position in frame completely untouched. Raw unedited iPhone front-camera selfie, natural matte lighting, slight realistic phone camera grain, zero airbrushing, zero CGI gloss: ";

const FACE_LOCK_STYLIZED =
  "Preserve the person's recognizable facial features, identity, and expression while cleanly rendering this stylized effect: ";

const CUSTOM_LOOK_LOCK =
  "Edit input_image_0 keeping the exact same person, identical face, eyes, nose, mouth, natural skin texture, expression, and exact head position untouched. Candid smartphone photo, matte natural lighting: ";

const SWAP_BG_AI_IDS = new Set([
  "ai_cong_chua_phong_tro", "ai_hoang_tu_ktx", "ai_di_phu_ho", "ai_ve_que_nuoi_ca",
  "ai_shipper_giao_hang", "stk_shopee_food", "ai_grab_driver", "ai_xanh_sm",
  "ai_bac_si", "ai_tong_tai", "ai_phu_ba", "ai_thieu_gia", "ai_du_thuyen",
  "ai_hau_gai", "ai_hoang_thuong", "ai_idol_kpop", "ai_cosplay_wibu",
  "ai_masterchef", "ai_csgt", "ai_mua_xuan", "ai_mua_he", "ai_mua_thu", "ai_mua_dong",
  "ocean_underwater", "volcano_lava", "jungle_leaf", "wedding", "fireworks", "rain_storm",
  "ufo_alien", "spooky_ghost", "fortnite_llama", "golden_hour", "nm_faker",
]);

const STYLIZED_AI_IDS = new Set([
  "ai_figure_1_7", "ai_action_figure_box", "ai_lego_figure", "ai_cartoon_3d",
  "minecraft", "watercolor_art", "nm_mona_lisa",
]);

const FOREGROUND_SEG_PROMPT =
  "Create a solid pure black-and-white silhouette matte of this exact photo. Paint the ENTIRE main foreground subject (person including ALL dark hair, bangs, head, face, neck, shoulders, hands, and clothing, or main pet/object/dish) as ONE continuous solid pure white (#FFFFFF) shape with ZERO dark holes or missing hair strands inside. Paint ONLY the distant background pure black (#000000). Keep exact pixel alignment with zero cropping or shifting.";

const BG_PRESERVE_HARMONY = {
  fireworks: { rMul: 1.02, gMul: 1.00, bMul: 0.98, brightness: -4 },
  ocean_underwater: { rMul: 0.94, gMul: 1.01, bMul: 1.07, brightness: 0 },
  volcano_lava: { rMul: 1.07, gMul: 0.99, bMul: 0.93, brightness: -2 },
  rain_storm: { rMul: 0.95, gMul: 0.98, bMul: 1.05, brightness: -3 },
  jungle_leaf: { rMul: 0.99, gMul: 1.03, bMul: 0.98, brightness: 1 },
  ufo_alien: { rMul: 0.97, gMul: 1.01, bMul: 1.03, brightness: -2 },
  spooky_ghost: { rMul: 0.96, gMul: 0.99, bMul: 1.04, brightness: -4 },
  fortnite_llama: { rMul: 1.01, gMul: 1.00, bMul: 1.02, brightness: 2 },
  golden_hour: { rMul: 1.08, gMul: 1.02, bMul: 0.90, brightness: 5 },
};

const CUSTOM_AI_IDS = new Set([
  "stk_tai_tho", "stk_mu_ngu_khoc", "stk_jollibee", "stk_nak_ve_than",
  "stk_gojo_satoru", "stk_shopee_food", "fireworks", "harry_potter",
  "minecraft", "fire_flame", "giant_spider", "ocean_underwater",
  "ufo_alien", "sweat_hearts", "volcano_lava", "rain_storm",
  "fortnite_llama", "watercolor_art", "golden_hour", "rose_flower",
  "shrek_ogre", "superhero_cape", "spooky_ghost", "pirate_hat",
  "jungle_leaf", "cute_zombie",
  "ai_cong_chua_phong_tro", "ai_hoang_tu_ktx", "ai_lop_truong", "ai_di_phu_ho", "ai_ve_que_nuoi_ca",
  "ai_figure_1_7", "ai_action_figure_box", "ai_lego_figure", "ai_cartoon_3d", "ai_polaroid_string",
  "ai_shipper_giao_hang", "ai_grab_driver", "ai_xanh_sm", "ai_bac_si",
  "ai_tong_tai", "ai_phu_ba", "ai_thieu_gia", "ai_du_thuyen", "ai_old_money",
  "ai_makeup_idol", "ai_trang_diem_duyen", "ai_doi_kieu_toc", "ai_doi_mau_toc",
  "ai_cosplay_wibu", "ai_hau_gai", "ai_hoang_thuong", "ai_idol_kpop",
  "nm_mona_lisa", "nm_faker",
  "ai_mua_xuan", "ai_mua_he", "ai_mua_thu", "ai_mua_dong", "ai_masterchef", "ai_csgt"
]);

const AI_FILTER_PROMPTS = {
  // 26 Custom AI 3D Hot & extra filters
  stk_tai_tho:
    "Keep the person's exact face, expression, pose, and background from the photo, and realistically place a cute fluffy white and soft pink plush bunny ears headband sitting naturally on top of their head with matching soft lighting and natural shadows. If there are multiple people, put a matching bunny ears headband on each person cleanly.",
  stk_mu_ngu_khoc:
    "Apply the exact cartoon face filter from the second reference image to the person's face in the first photo: 1) A cream-colored pixel-art sleeping hat with thick black outlines and a light cyan pom-pom on the left side. 2) Large thin round black wire-frame glasses over both eyes. 3) Two glossy cyan-blue anime crying streams from the inner corners of both eyes. 4) A tiny black spiral doodle on the nose and two small curved whisker lines on each cheek. Precisely align all elements with the person's facial features while keeping their identity, hairstyle, clothing, pose, and background.",
  stk_jollibee:
    "Change ONLY the person's clothing into a realistic matte cotton Jollibee employee uniform genuinely worn on their body: red short-sleeved polo shirt with yellow shoulder panels, blue-and-yellow striped collar, Jollibee mascot logo on the left chest, small name tag on the right chest, and dark navy waist apron with natural fabric folds and natural ambient shadows.",
  stk_nak_ve_than:
    "Edit the photograph into a realistic real-life cosplay of Nakroth Dimensional Guardian while keeping the person's face, expression, body proportions, pose, framing, and background unchanged. ONLY change: 1) Textured spiky silver-white hair with a center part and shoulder-length side locks. 2) A tailored matte black cropped blazer with white piping, royal-blue and gold accents, and leather gloves with natural real-world lighting.",
  stk_gojo_satoru:
    "Strictly preserve the exact half-body framing, crop, face shape, pose, and background. ONLY replace the hairstyle and outfit with a realistic Satoru Gojo cosplay: natural-textured spiky silver-white hair, a matte black fabric blindfold covering both eyes, and a matte black high-collar Jujutsu jacket with natural fabric folds.",
  stk_shopee_food:
    "Change only the clothing and background. Dress the person in a realistic matte bright orange-red waterproof Vietnamese food-delivery windbreaker jacket with black front zipper and black delivery backpack straps (plain clean fabric with subtle white piping, strictly no text, letters, or logos), wearing a realistic smooth bright orange open-face Vietnamese motorbike half-helmet with black chin strap resting naturally on their head (not a bicycle helmet or hard hat). Softly blurred overcast Saigon street background with natural matching outdoor daylight.",
  fireworks: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Fill ONLY the night sky background behind them with colorful fireworks bursting with warm glowing sparks and natural camera bokeh.",
  harry_potter: "Dress the person in a matte black wool Hogwarts wizard robe with a red-and-gold striped Gryffindor scarf and thin round metal glasses in natural candid lighting.",
  minecraft: "Restyle the background and clothing into blocky 3D Minecraft voxel geometry and pixelated textures while keeping the person's face recognizable.",
  fire_flame: "Surround the background and edges of the frame with warm orange fire flames and rising sparks in realistic night photography lighting.",
  giant_spider: "Add a realistic fuzzy dark spider perched playfully near the person's shoulder with natural shadows.",
  ocean_underwater: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Replace ONLY the background behind them with a serene underwater aquarium interior showing cool blue water caustics and tropical fish in natural ambient lighting.",
  ufo_alien: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Add a subtle metallic UFO saucer hovering in the distant sky behind them in natural outdoor lighting.",
  sweat_hearts: "Float subtle pastel pink and red hearts softly in the air around the person with warm natural ambient lighting.",
  volcano_lava: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Replace ONLY the distant background behind them with glowing volcanic lava streams and warm floating embers.",
  rain_storm: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Replace ONLY the background atmosphere behind them with an overcast realistic rainstorm, falling rain streaks, and natural mist.",
  fortnite_llama: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Add a colorful purple-and-blue loot llama piñata peeking playfully into the background behind them.",
  watercolor_art: "Render the scene as a delicate hand-painted watercolor illustration with soft brush strokes and paper texture while keeping the face recognizable.",
  golden_hour: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Bathe the background behind them in warm late-afternoon golden sunset sunlight and soft natural window bokeh.",
  rose_flower: "Place a single fresh red rose stem held gently in the person's mouth with realistic petals and natural shadows.",
  shrek_ogre: "Add funny green Shrek ogre trumpet ears on both sides of the head with natural lighting while keeping the face recognizable.",
  superhero_cape: "Add a matte blue-and-red superhero suit collar and a red cloth superhero cape over the person's shoulders with realistic fabric folds.",
  spooky_ghost: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Add a subtle translucent white ghostly figure floating playfully in the background behind them.",
  pirate_hat: "Put a weathered dark felt tricorn pirate captain hat with gold trim on the person's head and add pirate coat lapels in natural lighting.",
  jungle_leaf: "Keep the person's exact body position, pose, hair, and original clothes unchanged. Replace ONLY the background behind them with lush green tropical jungle monstera leaves and soft natural filtered daylight.",
  cute_zombie: "Apply playful Halloween zombie face paint with pale greenish tint and chibi stitch marks while keeping the person's features clear.",

  // 35 Official Native Locket AI filters + locket + hom_nay_an_gi
  okay_wig: "Place an oversized funny salon wig comically perched on the person's head with natural hair strands.",
  influencer: "Add subtle natural window eye catchlights and chic sunglasses resting on top of the head in realistic candid indoor lighting, keeping real natural skin texture.",
  looks_maxxing: "Keep real skin pores and natural texture intact without smoothing; add crisp natural side directional light and realistic lens contrast.",
  toothless: "Give the person a playful goofy comedy edit showing a funny gap-tooth smile.",
  bye_brows: "Apply a lighthearted comedy edit cleanly removing the person's eyebrows with natural forehead skin matching their real skin texture.",
  bowling_ball: "Apply a funny comedy edit making the top of the person's head smooth and bald while keeping real skin texture.",
  blonde_bleached: "Change the person's hair color cleanly to natural platinum bleached blonde with subtle dark roots and realistic hair strands.",
  beard: "Add a realistic well-groomed full beard and mustache seamlessly matching the person's hair color and natural texture.",
  bob_cut: "Restyle the person's hair into a neat chin-length straight bob haircut with natural hair volume and texture.",
  buns: "Restyle the person's hair into cute high double space buns on top of the head with natural stray hairs.",
  tatted: "Add realistic black-and-grey fine-line tattoos naturally following skin contours along the neck and visible skin.",
  mohawk: "Restyle the person's hair into a tall edgy punk mohawk down the center of the head with natural hair texture.",
  braces: "Add realistic metallic orthodontic braces cleanly aligned on the person's visible teeth.",
  slimed: "Splash bright green Nickelodeon-style slime dripping playfully over the person's hair and shoulders.",
  princess: "Place a delicate silver tiara crown on the head and add a matte pastel princess dress collar in soft natural daylight.",
  disco_lights: "Illuminate the scene with colorful spinning disco ball reflections and magenta-cyan party ambient light, keeping realistic night grain and real skin.",
  cash_money: "Add crisp US dollar bills fluttering and raining joyfully through the air around the person in natural lighting.",
  happy_birthday: "Put a festive polka-dot birthday party hat on the head and add confetti with warm birthday cake candles in the foreground.",
  cutesy: "Add soft natural rosy blush and tiny pastel star stickers on the cheeks with soft natural daylight, preserving real skin texture.",
  sticker_face: "Place playful colorful vinyl stickers like tiny stars, pastel hearts, and smiley faces neatly on the person's cheeks and nose.",
  flower_crown: "Place a delicate crown woven from fresh white daisies and pastel roses resting naturally on the person's head.",
  love_bug: "Put a cute red plush ladybug antennae headband on the head and float soft pink hearts in the background.",
  wedding: "Dress the person in realistic matte white wedding attire such as a delicate veil collar or crisp tuxedo with natural soft garden bokeh behind.",
  cowboy_cowgirl: "Put a classic worn brown suede cowboy hat on the head and add a patterned western cotton bandana loosely around the neck.",
  giraffe: "Put a cozy plush giraffe hood with cute stuffed horns and spotted giraffe ears over the person's head.",
  clown: "Apply playful colorful clown makeup with a red nose, painted cheeks, and a curly rainbow wig.",
  easter_bunney_cutout: "Place cute pastel plush Easter bunny ears on the head surrounded by soft spring pastel flowers in the background.",
  easter_chick_cutout: "Place a cute fluffy yellow plush Easter chick hat perched playfully on top of the person's head.",
  bearded: "Add a long realistic wizard or lumberjack beard matching the person's natural hair tone.",
  leprechaun: "Put a festive green St. Patrick's Day leprechaun top hat with a gold buckle on the head and float green shamrocks behind.",
  lucky_face: "Add cute green four-leaf clover stickers on the cheeks with warm natural sunlight.",
  sweet_hearts: "Float pastel candy conversation hearts in the air around the person with soft natural warm lighting.",
  elf_cutout: "Put a festive green-and-red Christmas elf hat with cute pointy elf ears and a tiny jingle bell on the head.",
  santa_cutout: "Put a cozy fluffy red-and-white Santa Claus hat on the head with soft falling snow bokeh in the background.",
  frosty: "Wrap a cozy knit wool winter scarf around the neck with softly falling snowflakes and cool overcast winter daylight.",
  locket: "Surround the person with warm golden sunset bokeh and gentle floating light dust, keeping natural candid camera realism.",
  hom_nay_an_gi: "Float playful appetizing miniature icons of Vietnamese street food like pho bowls, banh mi, and iced milk tea in a halo around the background.",

  // 27 New Vietnamese Meme, Trend, Shipper, Luxury & Beauty AI filters
  ai_cong_chua_phong_tro:
    "Dress the person in a matte pastel pink layered tulle princess dress with a delicate tiara while standing inside a realistic lived-in Vietnamese rented dorm room with tiled floor and electric fan under natural indoor lighting.",
  ai_hoang_tu_ktx:
    "Dress the person in a realistic tailored off-white and gold ceremonial prince uniform jacket with fabric sash inside a real lived-in Vietnamese university dorm room with natural indoor lighting.",
  ai_lop_truong:
    "Keep clothing, pose, and background completely unchanged, and humorously place a realistic heavy matte black rubber car tire slung around their neck and shoulders like a collar (funny 'lốp dự phòng' meme) with natural shadows.",
  ai_di_phu_ho:
    "Dress the person in realistic slightly dusty construction worker clothes with a matte yellow safety hard hat, reflective vest, and a trowel at a real sunlit outdoor building site with authentic candid lighting.",
  ai_ve_que_nuoi_ca:
    "Dress the person in traditional matte brown Vietnamese Ba Ba country cotton attire wearing a natural bamboo conical leaf hat Non La beside a peaceful countryside fish pond and banana trees in soft outdoor daylight.",
  ai_figure_1_7:
    "Keep the person's exact face and outfit likeness, transform them into a collectible 1/7 scale PVC anime figure standing on a round acrylic display base on an artist desk with warm studio rim lighting.",
  ai_action_figure_box:
    "Keep the person's exact likeness and outfit, render them as a collectible boxed plastic action figure inside a transparent blister retail packaging box with printed title card and tiny accessories.",
  ai_lego_figure:
    "Keep the person's hair, outfit colors, and vibe recognizable, transform the person and surroundings into yellow LEGO minifigure style with blocky plastic LEGO bricks.",
  ai_cartoon_3d:
    "Keep the person's exact facial features, hair, and outfit recognizable, restyle them cleanly as a charming Pixar/Disney-style high-detail 3D animated movie character with expressive soft lighting.",
  ai_polaroid_string:
    "Frame the person's untouched real photo cleanly inside a realistic printed instant Polaroid photograph hanging from natural twine string with a tiny wooden clothespin over warm ambient room bokeh.",
  ai_shipper_giao_hang:
    "Change only the clothing and background. Dress the person in a realistic matte crimson-red and dark-charcoal Vietnamese express parcel courier windbreaker jacket with front zipper and dark delivery backpack straps (plain clean fabric, strictly no text, letters, or logos anywhere on jacket or helmet), wearing a realistic smooth solid matte red open-face Vietnamese motorbike half-helmet with black chin strap resting naturally on their head (not a construction hard hat or bicycle helmet). Softly blurred overcast Vietnamese city street background with natural outdoor daylight.",
  ai_grab_driver:
    "Change only the clothing and background. Dress the person in a realistic matte emerald-green and black color-blocked motorbike ride-hailing rider windbreaker jacket with front zipper and subtle white reflective stripe (plain fabric, strictly no text, letters, or logos), wearing a realistic smooth emerald-green open-face Vietnamese motorbike half-helmet with black chin strap resting naturally on their head (not a bicycle helmet or hard hat). Softly blurred overcast Vietnamese street with green trees behind in natural outdoor daylight.",
  ai_xanh_sm:
    "Change only the clothing and background. Dress the person in a realistic matte cyan-turquoise motorbike ride-hailing windbreaker jacket with dark-navy collar and front zipper (plain clean fabric, strictly no text, letters, or logos), wearing a realistic smooth solid cyan-turquoise open-face Vietnamese motorbike half-helmet with black chin strap resting naturally on their head (not a vented bicycle helmet). Softly blurred overcast Vietnamese city street background in natural outdoor daylight.",
  ai_bac_si:
    "Change only the clothing and background. Dress the person in a realistic slightly wrinkled matte white cotton doctor lab coat worn over a plain casual shirt with a real matte dark-grey medical stethoscope draped naturally around the neck (no text or name tags), inside a genuine everyday hospital clinic room with softly blurred background and natural muted indoor fluorescent and window light.",
  ai_tong_tai:
    "Dress the person in a tailored matte charcoal black wool suit and understated silk tie standing naturally inside a real high-rise office with soft overcast city window daylight behind them, candid smartphone camera realism.",
  ai_phu_ba:
    "Dress the person in tasteful real-life luxury pearl earrings and a tailored matte cream tweed jacket inside an upscale sunlit cafe/boutique with soft natural window daylight, keeping real skin texture.",
  ai_thieu_gia:
    "Style the person in a matte charcoal cashmere overcoat and understated wristwatch standing casually outdoors by a sleek car at late afternoon golden hour, candid smartphone camera look.",
  ai_du_thuyen:
    "Dress the person in crisp matte white linen summer shirt sitting casually aboard a real sailboat/yacht deck overlooking blue ocean waves in realistic bright outdoor daylight.",
  ai_old_money:
    "Style the person in timeless matte ivory cable-knit cotton sweater draped naturally over the shoulders and beige tailored polo shirt with warm vintage 35mm film color and natural ambient light.",
  ai_makeup_idol:
    "Keep real skin texture and pores clearly visible; apply only subtle natural K-pop peach lip tint and light natural everyday makeup in soft daylight, zero airbrushing.",
  ai_trang_diem_duyen:
    "Keep real skin texture and natural features untouched; apply subtle soft rosy cheek blush, natural wispy lashes, and natural berry lip tint in soft window daylight.",
  ai_doi_kieu_toc:
    "Keep clothing and background completely identical; restyle ONLY their hair into textured layered salon hair with soft wispy curtain bangs and realistic natural strands.",
  ai_doi_mau_toc:
    "Keep clothing and background completely identical; dye ONLY their hair into a natural-textured smoky ash-silver lavender balayage tone with dark natural roots.",
  ai_cosplay_wibu:
    "Dress the person in a realistic fabric Japanese anime academy cosplay uniform jacket with natural matte hair styling inside a real outdoor campus setting.",
  ai_hau_gai:
    "Dress the person in a realistic matte cotton black-and-white Victorian cafe maid apron dress with simple white lace headband inside a warm sunlit cafe.",
  ai_hoang_thuong:
    "Dress the person in a richly woven matte silk golden-yellow embroidered ancient royal emperor robe and traditional crown inside a dimly lit historic palace courtyard with natural ambient light.",
  ai_idol_kpop:
    "Dress the person in a realistic tailored K-pop stage performance jacket with subtle ear-mic under natural warm concert stage spotlights and crowd bokeh, keeping realistic camera grain.",
  nm_mona_lisa:
    "Seamlessly paint the person's exact face, likeness, and expression into Leonardo da Vinci's famous Mona Lisa oil painting, replacing Mona Lisa's face while preserving the iconic dark veil, flowing Renaissance hair, crossed hands, dark Florentine dress, misty mountain landscape background, warm aged oil-painting brushstrokes, and sfumato lighting so it looks like an authentic museum masterpiece.",
  nm_faker:
    "Place the person naturally into the iconic League of Legends T1 Faker 'shhh' esports photo, wearing the official matte black-and-red T1 esports jersey with glasses, holding one index finger gently against their lips in real esports arena lighting with authentic handheld camera grain.",
  ai_mua_xuan:
    "Keep the person's exact body position, pose, hair, glasses if worn, and original clothing completely unchanged. Replace ONLY the background behind them with a softly out-of-focus spring park path with real pale pink cherry blossom branches and a few softly blurred falling petals in gentle overcast morning daylight, letting soft natural ambient light wrap subtly onto hair edges and shoulders so they blend realistically into the scene.",
  ai_mua_he:
    "Keep the person's exact body position, pose, hair, glasses if worn, and original clothing completely unchanged. Replace ONLY the background behind them with a softly out-of-focus sunlit summer coastal boardwalk and calm blue sea horizon under natural afternoon daylight, with subtle realistic warm daylight rim on hair edges and shoulders, muted authentic phone camera colors and natural lens blur, never oversaturated.",
  ai_mua_thu:
    "Keep the person's exact body position, pose, hair, glasses if worn, and original clothing completely unchanged. Replace ONLY the background behind them with a softly out-of-focus quiet autumn tree-lined street with muted amber, rust, and golden-brown maple leaves in soft late-afternoon daylight, with gentle warm ambient light blending naturally onto hair edges and shoulders, earthy authentic smartphone tones.",
  ai_mua_dong:
    "Keep the person's exact body position, pose, hair, glasses if worn, and original clothing completely unchanged. Replace ONLY the background behind them with a softly out-of-focus quiet overcast winter city street with gentle light falling snow and a few tiny soft snowflakes near the hair and shoulders, subtly cooling the ambient light on hair edges and shoulders so they fit naturally in the winter scene.",
  ai_masterchef:
    "Change only the clothing and background. Completely replace the person's top with a realistic matte cotton chef uniform: a clean white double-breasted chef coat with two vertical rows of black buttons, a neat dark charcoal collar trim, and a dark canvas bib apron worn over the chest (plain fabric, strictly no text or logos), plus a realistic moderately sized matte white traditional cylindrical pleated chef hat resting naturally on their head (not a baseball cap), inside a genuine everyday stainless-steel restaurant kitchen with softly blurred background and natural warm indoor kitchen light.",
  ai_csgt:
    "Change only the clothing and background. Dress the person in a realistic matte khaki-tan cotton Vietnamese traffic officer uniform shirt with natural fabric folds and simple gold-trimmed shoulder epaulets (strictly no name tags, text, or gibberish letters) and a neatly proportioned matte khaki-tan peaked uniform cap resting naturally on their head, on a softly blurred overcast tree-lined Vietnamese city street with muted natural daylight.",
};

const MEMORY_IMAGES = new Map();
const FRAME_CACHE = new Map();
const PHOTOBOOTH_SESSIONS = new Map();
let LAST_DEBUG = null;
let LAST_CAPTION_DEBUG = null;
const YT_TRACK_CACHE = new Map();
let LAST_YT_TRACK = null;
let LAST_MUSIC_SCHEMA = null;
let LAST_RC_CAMERA_DEBUG = null;
const VINYL_GIF_CACHE = new Map();
let CAPTION_MODE_OVERRIDE = null;
let UPSTREAM_CAPTION_BLOCKED_UNTIL = 0;
const SKIP_CF_MODELS = new Map(); // modelId -> timestamp until skip (on 404 / unsupported model)
const SKIP_GEMINI_MODELS = new Map(); // modelId -> timestamp until skip (on 503 high demand / 404 / timeout)
function rand01() {
  try {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  } catch (_) {
    return Math.random();
  }
}
const QUOTE_HIST_CACHE_URL = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev/__quotehist__/v1.json";
const RECENT_QUOTE_IDS = [];
function rememberQuoteIds(ids) {
  for (const id of ids) {
    if (!id) continue;
    const idx = RECENT_QUOTE_IDS.indexOf(id);
    if (idx !== -1) RECENT_QUOTE_IDS.splice(idx, 1);
    RECENT_QUOTE_IDS.push(id);
  }
  while (RECENT_QUOTE_IDS.length > 260) RECENT_QUOTE_IDS.shift();
}
const RECENT_LIVE_QUOTES = [];
function rememberLiveQuoteKey(key) {
  if (!key) return;
  const idx = RECENT_LIVE_QUOTES.indexOf(key);
  if (idx !== -1) RECENT_LIVE_QUOTES.splice(idx, 1);
  RECENT_LIVE_QUOTES.push(key);
  while (RECENT_LIVE_QUOTES.length > 200) RECENT_LIVE_QUOTES.shift();
}
async function loadRecentQuoteHistory() {
  try {
    const cache = typeof caches !== "undefined" ? caches.default : null;
    if (!cache) return;
    const hit = await cache.match(new Request(QUOTE_HIST_CACHE_URL));
    if (!hit) return;
    const j = await hit.json();
    if (Array.isArray(j?.ids)) rememberQuoteIds(j.ids);
    if (Array.isArray(j?.liveKeys)) {
      for (const k of j.liveKeys) rememberLiveQuoteKey(k);
    }
  } catch (_) {}
}
async function saveRecentQuoteHistory() {
  try {
    const cache = typeof caches !== "undefined" ? caches.default : null;
    if (!cache) return;
    const payload = JSON.stringify({
      ids: RECENT_QUOTE_IDS.slice(-260),
      liveKeys: RECENT_LIVE_QUOTES.slice(-200),
      ts: Date.now(),
    });
    await cache.put(
      new Request(QUOTE_HIST_CACHE_URL),
      new Response(payload, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=1800",
        },
      })
    );
  } catch (_) {}
}
const LIVE_QUOTE_CACHE = { items: [], fetchedAt: 0, wikiIdx: 0 };
const VI_WIKIQUOTE_TOPICS = [
  "Hạnh phúc", "Cuộc sống", "Tình yêu", "Tình bạn", "Thời gian", "Thành công", "Hy vọng", "Tự do",
  "Tuổi trẻ", "Ước mơ", "Nỗi buồn", "Gia đình", "Âm nhạc", "Mùa thu", "Mưa", "Bình yên",
  "Kiên nhẫn", "Sách", "Học tập", "Tâm hồn", "Cảm xúc", "Nụ cười", "Thiên nhiên", "Trưởng thành",
];
// Theo dõi quota Cloudflare Workers AI (lỗi 4006 = hết 10.000 neurons/ngày).
// Khi đã chạm quota, bỏ qua env.AI trong một khoảng ngắn để fallback thẳng sang Gemini (đỡ tốn thời gian chờ lỗi).
let CF_AI_QUOTA_HIT_UNTIL = 0;

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function corsHeaders(extra = {}) {
  return Object.assign(
    {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
    extra
  );
}

// Lưu ảnh tạm vào CẢ RAM lẫn Cache API. Cache API chia sẻ cross-isolate trong colo -> wsrv.nl
// callback và app tải ảnh KHÔNG bị kẹt vào Durable Object đang bận (nguyên nhân ảnh đen trước đây).
// Cache API key PHẢI là URL http(s) hợp lệ cùng kiểu origin thật, nếu không put/match âm thầm fail.
const CACHE_IMG_PREFIX = "https://locket-tommm-studio.khoinguyennguyen85.workers.dev/__imgcache__/";
const CUSTOM_LOOK_PROMPTS = new Map();
async function putCustomLookPrompt(id, promptText, state = null) {
  if (!id || !promptText) return;
  CUSTOM_LOOK_PROMPTS.set(id, promptText);
  if (state && state.storage) {
    try {
      await state.storage.put("clp:" + id, promptText);
    } catch (_) {}
  }
  try {
    await caches.default.put(
      new Request(CACHE_IMG_PREFIX + "prompt_" + encodeURIComponent(id)),
      new Response(promptText, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=604800" } })
    );
  } catch (_) {}
}
async function getCustomLookPrompt(id, state = null) {
  if (!id) return "";
  const ram = CUSTOM_LOOK_PROMPTS.get(id);
  if (ram) return ram;
  if (state && state.storage) {
    try {
      const stored = await state.storage.get("clp:" + id);
      if (typeof stored === "string" && stored.trim()) {
        const txt = stored.trim();
        CUSTOM_LOOK_PROMPTS.set(id, txt);
        return txt;
      }
    } catch (_) {}
  }
  try {
    const hit = await caches.default.match(new Request(CACHE_IMG_PREFIX + "prompt_" + encodeURIComponent(id)));
    if (hit) {
      const txt = (await hit.text()).trim();
      if (txt) CUSTOM_LOOK_PROMPTS.set(id, txt);
      return txt;
    }
  } catch (_) {}
  return "";
}
async function putImage(id, bytes, mimeType) {
  MEMORY_IMAGES.set(id, { bytes, mimeType, ts: Date.now() });
  try {
    await caches.default.put(
      new Request(CACHE_IMG_PREFIX + encodeURIComponent(id)),
      new Response(bytes, { headers: { "Content-Type": mimeType, "Cache-Control": "public, max-age=300" } })
    );
  } catch (_) {}
}
async function getImage(id) {
  const ram = MEMORY_IMAGES.get(id);
  if (ram) return ram;
  try {
    const hit = await caches.default.match(new Request(CACHE_IMG_PREFIX + encodeURIComponent(id)));
    if (hit) {
      const bytes = new Uint8Array(await hit.arrayBuffer());
      return { bytes, mimeType: hit.headers.get("Content-Type") || "image/jpeg", ts: Date.now() };
    }
  } catch (_) {}
  return null;
}
function cleanupMemory() {
  const now = Date.now();
  for (const [k, v] of MEMORY_IMAGES.entries()) {
    if (now - v.ts > 300000) MEMORY_IMAGES.delete(k);
  }
  for (const [k, v] of PHOTOBOOTH_SESSIONS.entries()) {
    if (now - v.ts > 180000) PHOTOBOOTH_SESSIONS.delete(k);
  }
  if (FRAME_CACHE.size > 16) {
    const firstKey = FRAME_CACHE.keys().next().value;
    if (firstKey) FRAME_CACHE.delete(firstKey);
  }
}

function getPhotoboothUserKey(request, authHeader) {
  try {
    const m = String(authHeader || "").match(/(?:Bearer\s+)?([^.\s]+)\.([^.\s]+)\.([^.\s]+)/i);
    if (m && m[2]) {
      let b64 = m[2].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const jwt = JSON.parse(atob(b64));
      const uid = jwt.user_id || jwt.sub || jwt.uid;
      if (uid) return String(uid);
    }
  } catch (_) {}
  try {
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
    if (ip) return ip.split(",")[0].trim();
  } catch (_) {}
  return "anon";
}

function base64ToUint8Array(base64) {
  const normalized = base64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function inflateZlib(uint8) {
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  writer.write(uint8);
  writer.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

function decodePngToRgb(pngBytes) {
  const dv = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
  let pos = 8;
  let w = 0;
  let h = 0;
  let colorType = 2;
  let palette = null;
  const idatParts = [];
  let idatLen = 0;

  while (pos + 12 <= pngBytes.length) {
    const len = dv.getUint32(pos);
    const t = dv.getUint32(pos + 4);
    if (t === 0x49484452) {
      w = dv.getUint32(pos + 8);
      h = dv.getUint32(pos + 12);
      colorType = pngBytes[pos + 17];
    } else if (t === 0x504c5445) {
      palette = pngBytes.subarray(pos + 8, pos + 8 + len);
    } else if (t === 0x49444154) {
      idatParts.push(pngBytes.subarray(pos + 8, pos + 8 + len));
      idatLen += len;
    } else if (t === 0x49454e44) {
      break;
    }
    pos += 12 + len;
  }

  const idat =
    idatParts.length === 1
      ? idatParts[0]
      : (() => {
          const joined = new Uint8Array(idatLen);
          let off = 0;
          for (const p of idatParts) {
            joined.set(p, off);
            off += p.length;
          }
          return joined;
        })();

  return inflateZlib(idat).then((raw) => {
    const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : 4;
    const stride = w * bpp;
    const rgb = new Uint8Array(w * h * 3);
    let rPos = 0;
    let prevRowStart = -1;

    for (let y = 0; y < h; y++) {
      const f = raw[rPos++];
      const rowStart = rPos;
      if (f === 1) {
        for (let x = bpp; x < stride; x++) {
          raw[rowStart + x] = (raw[rowStart + x] + raw[rowStart + x - bpp]) & 0xff;
        }
      } else if (f === 2 && prevRowStart >= 0) {
        for (let x = 0; x < stride; x++) {
          raw[rowStart + x] = (raw[rowStart + x] + raw[prevRowStart + x]) & 0xff;
        }
      } else if (f === 3) {
        for (let x = 0; x < stride; x++) {
          const a = x >= bpp ? raw[rowStart + x - bpp] : 0;
          const b = prevRowStart >= 0 ? raw[prevRowStart + x] : 0;
          raw[rowStart + x] = (raw[rowStart + x] + ((a + b) >> 1)) & 0xff;
        }
      } else if (f === 4) {
        for (let x = 0; x < stride; x++) {
          const a = x >= bpp ? raw[rowStart + x - bpp] : 0;
          const b = prevRowStart >= 0 ? raw[prevRowStart + x] : 0;
          const c = x >= bpp && prevRowStart >= 0 ? raw[prevRowStart + x - bpp] : 0;
          const p = a + b - c;
          const pa = p > a ? p - a : a - p;
          const pb = p > b ? p - b : b - p;
          const pc = p > c ? p - c : c - p;
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          raw[rowStart + x] = (raw[rowStart + x] + pr) & 0xff;
        }
      }

      let outIdx = y * w * 3;
      if (colorType === 3 && palette) {
        for (let x = 0; x < stride; x++) {
          const pi = raw[rowStart + x] * 3;
          rgb[outIdx++] = palette[pi];
          rgb[outIdx++] = palette[pi + 1];
          rgb[outIdx++] = palette[pi + 2];
        }
      } else {
        for (let x = 0; x < stride; x += bpp) {
          rgb[outIdx++] = raw[rowStart + x];
          rgb[outIdx++] = raw[rowStart + x + 1];
          rgb[outIdx++] = raw[rowStart + x + 2];
        }
      }
      prevRowStart = rowStart;
      rPos += stride;
    }

    return { w, h, rgb };
  });
}

function encodeFastPngRgb(w, h, rgb) {
  const rowBytes = 1 + w * 3;
  const scan = new Uint8Array(h * rowBytes);
  for (let y = 0; y < h; y++) {
    const dstOff = y * rowBytes;
    scan[dstOff] = 0; // filter 0
    scan.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), dstOff + 1);
  }

  const len = scan.length;
  const numBlocks = Math.ceil(len / 65535);
  const zLen = 2 + len + numBlocks * 5 + 4;
  const z = new Uint8Array(zLen);
  z[0] = 0x78;
  z[1] = 0x01;
  let zOff = 2;
  let sOff = 0;
  while (sOff < len) {
    const bLen = Math.min(65535, len - sOff);
    z[zOff++] = sOff + bLen >= len ? 1 : 0;
    z[zOff++] = bLen & 0xff;
    z[zOff++] = (bLen >>> 8) & 0xff;
    const nlen = ~bLen & 0xffff;
    z[zOff++] = nlen & 0xff;
    z[zOff++] = (nlen >>> 8) & 0xff;
    z.set(scan.subarray(sOff, sOff + bLen), zOff);
    zOff += bLen;
    sOff += bLen;
  }

  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < len; ) {
    const end = Math.min(i + 5552, len);
    for (; i < end; i++) {
      s1 += scan[i];
      s2 += s1;
    }
    s1 %= 65521;
    s2 %= 65521;
  }
  const dvZ = new DataView(z.buffer);
  dvZ.setUint32(zOff, ((s2 << 16) | s1) >>> 0);

  const out = new Uint8Array(8 + 25 + 12 + zLen + 12);
  out.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  const dv = new DataView(out.buffer);
  dv.setUint32(8, 13);
  out.set([73, 72, 68, 82], 12);
  dv.setUint32(16, w);
  dv.setUint32(20, h);
  out[24] = 8;
  out[25] = 2;
  dv.setUint32(29, crc32(out.subarray(12, 29)));

  dv.setUint32(33, zLen);
  out.set([73, 68, 65, 84], 37);
  out.set(z, 41);
  dv.setUint32(41 + zLen, crc32(out.subarray(37, 41 + zLen)));

  const iendOff = 45 + zLen;
  dv.setUint32(iendOff, 0);
  out.set([73, 69, 78, 68], iendOff + 4);
  dv.setUint32(iendOff + 8, crc32(out.subarray(iendOff + 4, iendOff + 8)));
  return out;
}

function findFirstStringUrl(obj, depth = 0) {
  if (!obj || depth > 4) return null;
  if (typeof obj === "string" && obj.startsWith("http")) return obj;
  if (typeof obj === "object") {
    for (const k of [
      "imageUrl",
      "image_url",
      "inputImageUrl",
      "input_image_url",
      "photoUrl",
      "photo_url",
      "url",
      "sourceUrl",
      "source_url",
      "downloadUrl",
      "download_url",
    ]) {
      if (typeof obj[k] === "string" && obj[k].startsWith("http")) return obj[k];
    }
    for (const v of Object.values(obj)) {
      const found = findFirstStringUrl(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function getInputImageBytes(dataNode, authHeader) {
  for (const k of ["image", "imageBase64", "image_base64", "base64", "photo", "inputImage", "input_image"]) {
    const val = dataNode?.[k];
    if (typeof val === "string" && val.length > 200 && !val.startsWith("http") && !val.startsWith("gs://")) {
      const clean = val.includes(",") ? val.split(",", 2)[1] : val;
      return { bytes: base64ToUint8Array(clean), sourceUrl: null };
    }
  }

  let imgUrl = findFirstStringUrl(dataNode);
  if (!imgUrl && dataNode && typeof dataNode === "object") {
    for (const [k, v] of Object.entries(dataNode)) {
      if (typeof v === "string" && v.startsWith("gs://")) {
        const m = v.match(/^gs:\/\/([^\/]+)\/(.+)$/);
        if (m) {
          imgUrl = `https://firebasestorage.googleapis.com/v0/b/${m[1]}/o/${encodeURIComponent(m[2])}?alt=media`;
        }
      } else if (typeof v === "string" && (k.includes("path") || k.includes("Path")) && v.length > 5 && !v.startsWith("http")) {
        imgUrl = `https://firebasestorage.googleapis.com/v0/b/locket-filters/o/${encodeURIComponent(v.replace(/^\/+/, ""))}?alt=media`;
      }
    }
  }

  if (imgUrl) {
    try {
      const hdrs = { "User-Agent": "Locket/1.0" };
      if (authHeader) hdrs["Authorization"] = authHeader;
      const r = await fetch(imgUrl, { headers: hdrs });
      if (r.ok) {
        return { bytes: new Uint8Array(await r.arrayBuffer()), sourceUrl: imgUrl };
      }
    } catch (_) {}
  }
  return { bytes: null, sourceUrl: imgUrl };
}

function findFrameInValue(val, depth = 0, exactOnly = false) {
  if (val == null || depth > 3) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (FRAMES_MANIFEST[trimmed]) return trimmed;
    if (!exactOnly) {
      for (const id of Object.keys(FRAMES_MANIFEST)) {
        if (trimmed.includes(id)) return id;
      }
    }
    return null;
  }
  if (Array.isArray(val)) {
    for (const item of val) {
      const found = findFrameInValue(item, depth + 1, exactOnly);
      if (found) return found;
    }
  } else if (typeof val === "object") {
    for (const v of Object.values(val)) {
      const found = findFrameInValue(v, depth + 1, exactOnly);
      if (found) return found;
    }
  }
  return null;
}

function detectFilterId(dataNode, rawBodyText) {
  const candidates = [
    dataNode?.filterId,
    dataNode?.filter_id,
    dataNode?.uid,
    dataNode?.id,
    dataNode?.prompt,
    dataNode?.filterPrompt,
    dataNode?.customPrompt,
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const trimmed = c.trim();
      if (FRAMES_MANIFEST[trimmed]) return trimmed;
    }
  }
  for (const c of candidates) {
    if (typeof c === "string") {
      for (const id of Object.keys(FRAMES_MANIFEST)) {
        if (c.includes(id)) return id;
      }
    }
  }
  const exactNested = findFrameInValue(dataNode, 0, true);
  if (exactNested) return exactNested;
  const partialNested = findFrameInValue(dataNode, 0, false);
  if (partialNested) return partialNested;
  if (rawBodyText) {
    for (const id of Object.keys(FRAMES_MANIFEST)) {
      if (rawBodyText.includes(`"${id}"`) || rawBodyText.includes(id)) return id;
    }
  }
  return null;
}

async function getFrameRgba(filterId) {
  const cached = FRAME_CACHE.get(filterId);
  if (cached) return cached;

  const res = await fetch(`${GITHUB_FRAMES_BIN_BASE}/${encodeURIComponent(filterId)}.bin?v=76`);
  if (!res.ok) throw new Error(`Failed to fetch frame bin for ${filterId}: ${res.status}`);
  const compressed = new Uint8Array(await res.arrayBuffer());
  const rgba = await inflateZlib(compressed);
  if (FRAME_CACHE.size >= 6) {
    const oldest = FRAME_CACHE.keys().next().value;
    if (oldest !== undefined) FRAME_CACHE.delete(oldest);
  }
  FRAME_CACHE.set(filterId, rgba);
  return rgba;
}

function drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, box, canvasSize = SIZE) {
  const [x1, y1, x2, y2] = box;
  const winW = x2 - x1;
  const winH = y2 - y1;
  if (winW <= 0 || winH <= 0 || srcW <= 0 || srcH <= 0) return;

  const scale = Math.max(winW / srcW, winH / srcH);
  const cropW = winW / scale;
  const cropH = winH / scale;
  const offX = (srcW - cropW) * 0.5;
  const offY = (srcH - cropH) * 0.5;
  const invScale = 1 / scale;

  const x0Arr = new Int32Array(winW);
  const x1Arr = new Int32Array(winW);
  const fxArr = new Int32Array(winW);
  const ifxArr = new Int32Array(winW);
  const maxX = srcW - 1;
  for (let dx = 0; dx < winW; dx++) {
    let sx = offX + (dx + 0.5) * invScale - 0.5;
    if (sx < 0) sx = 0;
    else if (sx > maxX) sx = maxX;
    const x0 = sx | 0;
    const x1i = x0 < maxX ? x0 + 1 : maxX;
    const fx = ((sx - x0) * 256) | 0;
    x0Arr[dx] = x0 * 3;
    x1Arr[dx] = x1i * 3;
    fxArr[dx] = fx;
    ifxArr[dx] = 256 - fx;
  }

  const maxY = srcH - 1;
  for (let dy = 0; dy < winH; dy++) {
    let sy = offY + (dy + 0.5) * invScale - 0.5;
    if (sy < 0) sy = 0;
    else if (sy > maxY) sy = maxY;
    const y0 = sy | 0;
    const y1i = y0 < maxY ? y0 + 1 : maxY;
    const fy = ((sy - y0) * 256) | 0;
    const ify = 256 - fy;

    const srcRow0 = y0 * srcW * 3;
    const srcRow1 = y1i * srcW * 3;
    const dstRow = (y1 + dy) * canvasSize * 3;

    for (let dx = 0; dx < winW; dx++) {
      const sx0 = x0Arr[dx];
      const sx1 = x1Arr[dx];
      const fx = fxArr[dx];
      const ifx = ifxArr[dx];
      const i00 = srcRow0 + sx0;
      const i10 = srcRow0 + sx1;
      const i01 = srcRow1 + sx0;
      const i11 = srcRow1 + sx1;
      const di = dstRow + (x1 + dx) * 3;

      canvasRgb[di] = ((srcRgb[i00] * ifx + srcRgb[i10] * fx) * ify + (srcRgb[i01] * ifx + srcRgb[i11] * fx) * fy + 32768) >> 16;
      canvasRgb[di + 1] = ((srcRgb[i00 + 1] * ifx + srcRgb[i10 + 1] * fx) * ify + (srcRgb[i01 + 1] * ifx + srcRgb[i11 + 1] * fx) * fy + 32768) >> 16;
      canvasRgb[di + 2] = ((srcRgb[i00 + 2] * ifx + srcRgb[i10 + 2] * fx) * ify + (srcRgb[i01 + 2] * ifx + srcRgb[i11 + 2] * fx) * fy + 32768) >> 16;
    }
  }
}

function alphaCompositeRgbaOverRgb(canvasRgb, frameRgba, canvasSize = SIZE) {
  const totalPixels = canvasSize * canvasSize;
  for (let p = 0, i3 = 0, i4 = 0; p < totalPixels; p++, i3 += 3, i4 += 4) {
    const a = frameRgba[i4 + 3];
    if (a === 0) continue;
    if (a === 255) {
      canvasRgb[i3] = frameRgba[i4];
      canvasRgb[i3 + 1] = frameRgba[i4 + 1];
      canvasRgb[i3 + 2] = frameRgba[i4 + 2];
    } else {
      const invA = 255 - a;
      canvasRgb[i3] = (frameRgba[i4] * a + canvasRgb[i3] * invA + 128) >> 8;
      canvasRgb[i3 + 1] = (frameRgba[i4 + 1] * a + canvasRgb[i3 + 1] * invA + 128) >> 8;
      canvasRgb[i3 + 2] = (frameRgba[i4 + 2] * a + canvasRgb[i3 + 2] * invA + 128) >> 8;
    }
  }
}

function alphaCompositeRgbaScaledOverRgb(canvasRgb, frameRgba, srcSize = SIZE, dstSize = HD_SIZE) {
  if (srcSize === dstSize) {
    alphaCompositeRgbaOverRgb(canvasRgb, frameRgba, dstSize);
    return;
  }
  const scaleRatio = (srcSize - 1) / Math.max(1, dstSize - 1);
  const maxSrc = srcSize - 1;
  const x0Arr = new Int32Array(dstSize);
  const x1Arr = new Int32Array(dstSize);
  const fxArr = new Int32Array(dstSize);
  const ifxArr = new Int32Array(dstSize);
  for (let x = 0; x < dstSize; x++) {
    const sx = x * scaleRatio;
    const x0 = sx | 0;
    const x1i = x0 < maxSrc ? x0 + 1 : maxSrc;
    const fx = ((sx - x0) * 256) | 0;
    x0Arr[x] = x0;
    x1Arr[x] = x1i;
    fxArr[x] = fx;
    ifxArr[x] = 256 - fx;
  }

  for (let y = 0; y < dstSize; y++) {
    const sy = y * scaleRatio;
    const y0 = sy | 0;
    const y1i = y0 < maxSrc ? y0 + 1 : maxSrc;
    const fy = ((sy - y0) * 256) | 0;
    const ify = 256 - fy;
    const row0 = y0 * srcSize;
    const row1 = y1i * srcSize;
    const dstRow = y * dstSize * 3;

    for (let x = 0; x < dstSize; x++) {
      const fx = fxArr[x];
      const ifx = ifxArr[x];
      const i00 = (row0 + x0Arr[x]) * 4;
      const i10 = (row0 + x1Arr[x]) * 4;
      const i01 = (row1 + x0Arr[x]) * 4;
      const i11 = (row1 + x1Arr[x]) * 4;

      const a00 = frameRgba[i00 + 3];
      const a10 = frameRgba[i10 + 3];
      const a01 = frameRgba[i01 + 3];
      const a11 = frameRgba[i11 + 3];
      if ((a00 | a10 | a01 | a11) === 0) continue;

      const w00 = ifx * ify;
      const w10 = fx * ify;
      const w01 = ifx * fy;
      const w11 = fx * fy;
      const aSum = a00 * w00 + a10 * w10 + a01 * w01 + a11 * w11;
      const a = (aSum + 32768) >> 16;
      if (a <= 0) continue;

      const wa00 = w00 * a00;
      const wa10 = w10 * a10;
      const wa01 = w01 * a01;
      const wa11 = w11 * a11;
      const r = ((frameRgba[i00] * wa00 + frameRgba[i10] * wa10 + frameRgba[i01] * wa01 + frameRgba[i11] * wa11) / aSum) | 0;
      const g = ((frameRgba[i00 + 1] * wa00 + frameRgba[i10 + 1] * wa10 + frameRgba[i01 + 1] * wa01 + frameRgba[i11 + 1] * wa11) / aSum) | 0;
      const b = ((frameRgba[i00 + 2] * wa00 + frameRgba[i10 + 2] * wa10 + frameRgba[i01 + 2] * wa01 + frameRgba[i11 + 2] * wa11) / aSum) | 0;

      const di = dstRow + x * 3;
      if (a >= 255) {
        canvasRgb[di] = r;
        canvasRgb[di + 1] = g;
        canvasRgb[di + 2] = b;
      } else {
        const invA = 255 - a;
        canvasRgb[di] = (r * a + canvasRgb[di] * invA + 128) >> 8;
        canvasRgb[di + 1] = (g * a + canvasRgb[di + 1] * invA + 128) >> 8;
        canvasRgb[di + 2] = (b * a + canvasRgb[di + 2] * invA + 128) >> 8;
      }
    }
  }
}

function firstNonEmptyString(values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function detectLutId(dataNode, rawBodyText) {
  const candidates = [
    dataNode?.filterId,
    dataNode?.filter_id,
    dataNode?.uid,
    dataNode?.id,
    dataNode?.filter?.id,
    dataNode?.filter?.uid,
    dataNode?.prompt,
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (LUT_FILTERS[t]) return t;
    }
  }
  for (const c of candidates) {
    if (typeof c === "string") {
      for (const id of Object.keys(LUT_FILTERS)) {
        if (c.includes(id)) return id;
      }
    }
  }
  if (rawBodyText) {
    for (const id of Object.keys(LUT_FILTERS)) {
      if (rawBodyText.includes('"' + id + '"') || rawBodyText.includes(id)) return id;
    }
  }
  return null;
}

function applyLutToRgb(srcRgb, w, h, lut) {
  const rMul = lut.rMul ?? 1;
  const gMul = lut.gMul ?? 1;
  const bMul = lut.bMul ?? 1;
  const contrast = lut.contrast ?? 1;
  const brightness = lut.brightness ?? 0;
  const sat = lut.sat ?? 1;
  const fade = lut.fade ?? 0;
  const vig = lut.vig ?? 0;
  const grain = lut.grain ?? 0;
  const isBw = !!lut.bw;
  const halfW = w * 0.5;
  const halfH = h * 0.5;
  const invMaxR2 = 1 / (halfW * halfW + halfH * halfH);
  const fadeScale = fade > 0 ? (255 - fade) / 255 : 1;
  let rng = 0x9e3779b9;

  for (let y = 0; y < h; y++) {
    const dy = y - halfH;
    const dy2 = dy * dy;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      let r = srcRgb[i];
      let g = srcRgb[i + 1];
      let b = srcRgb[i + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (isBw) {
        r = g = b = lum;
      } else if (sat !== 1) {
        r = lum + (r - lum) * sat;
        g = lum + (g - lum) * sat;
        b = lum + (b - lum) * sat;
      }

      r = (r * rMul - 128) * contrast + 128 + brightness;
      g = (g * gMul - 128) * contrast + 128 + brightness;
      b = (b * bMul - 128) * contrast + 128 + brightness;

      if (fade > 0) {
        r = fade + r * fadeScale;
        g = fade + g * fadeScale;
        b = fade + b * fadeScale;
      }

      if (vig > 0) {
        const dx = x - halfW;
        const vFactor = 1 - vig * (dx * dx + dy2) * invMaxR2;
        r *= vFactor;
        g *= vFactor;
        b *= vFactor;
      }

      if (grain > 0) {
        rng = (rng ^ (rng << 13)) >>> 0;
        rng = (rng ^ (rng >>> 17)) >>> 0;
        rng = (rng ^ (rng << 5)) >>> 0;
        if (rng === 0) rng = 0x9e3779b9;
        const n = ((rng & 0xff) / 127.5 - 1) * grain;
        r += n;
        g += n;
        b += n;
      }

      srcRgb[i] = r < 0 ? 0 : r > 255 ? 255 : r | 0;
      srcRgb[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g | 0;
      srcRgb[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b | 0;
    }
  }
}

const FONT_5X7 = {
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1e, 0x01, 0x01, 0x0e, 0x01, 0x01, 0x1e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  ":": [0x00, 0x04, 0x04, 0x00, 0x04, 0x04, 0x00],
  "-": [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  ".": [0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x04],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
};

function fillRectRgb(rgb, w, h, x0, y0, x1, y1, color) {
  const sx = Math.max(0, x0 | 0);
  const sy = Math.max(0, y0 | 0);
  const ex = Math.min(w, x1 | 0);
  const ey = Math.min(h, y1 | 0);
  for (let y = sy; y < ey; y++) {
    const row = y * w * 3;
    for (let x = sx; x < ex; x++) {
      const i = row + x * 3;
      rgb[i] = color[0];
      rgb[i + 1] = color[1];
      rgb[i + 2] = color[2];
    }
  }
}

function drawTextRgb(rgb, w, h, text, x, y, scale, fgColor, shadowColor = null) {
  const s = String(text || "").toUpperCase();
  let curX = x | 0;
  const adv = 6 * scale;
  for (let ci = 0; ci < s.length; ci++) {
    const glyph = FONT_5X7[s[ci]] || FONT_5X7[" "];
    for (let r = 0; r < 7; r++) {
      const bits = glyph[r];
      if (!bits) continue;
      for (let c = 0; c < 5; c++) {
        if ((bits >> (4 - c)) & 1) {
          const px = curX + c * scale;
          const py = y + r * scale;
          if (shadowColor) {
            fillRectRgb(rgb, w, h, px + Math.max(1, scale >> 1), py + Math.max(1, scale >> 1), px + scale + Math.max(1, scale >> 1), py + scale + Math.max(1, scale >> 1), shadowColor);
          }
          fillRectRgb(rgb, w, h, px, py, px + scale, py + scale, fgColor);
        }
      }
    }
    curX += adv;
  }
}

function detectSpecialFxId(dataNode, rawBodyText) {
  const candidates = [
    dataNode?.filterId,
    dataNode?.filter_id,
    dataNode?.uid,
    dataNode?.id,
    dataNode?.filter?.id,
    dataNode?.filter?.uid,
    dataNode?.prompt,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && SPECIAL_FX_IDS.has(c.trim())) return c.trim();
  }
  for (const c of candidates) {
    if (typeof c === "string") {
      for (const id of SPECIAL_FX_IDS) {
        if (c.includes(id)) return id;
      }
    }
  }
  if (rawBodyText) {
    for (const id of SPECIAL_FX_IDS) {
      if (rawBodyText.includes(`"${id}"`) || rawBodyText.includes(id)) return id;
    }
  }
  return null;
}

function detectWarpId(dataNode, rawBodyText) {
  const candidates = [
    dataNode?.filterId,
    dataNode?.filter_id,
    dataNode?.uid,
    dataNode?.id,
    dataNode?.filter?.id,
    dataNode?.filter?.uid,
    dataNode?.prompt,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && WARP_FILTERS[c.trim()]) return c.trim();
  }
  for (const c of candidates) {
    if (typeof c === "string") {
      for (const id of Object.keys(WARP_FILTERS)) {
        if (c.includes(id)) return id;
      }
    }
  }
  if (rawBodyText) {
    for (const id of Object.keys(WARP_FILTERS)) {
      if (rawBodyText.includes(`"${id}"`) || rawBodyText.includes(id)) return id;
    }
  }
  return null;
}

function applyWarpToRgb(srcRgb, w, h, warpId) {
  const copy = new Uint8Array(srcRgb);
  const invW = 1 / w;
  const invH = 1 / h;

  const radialWarp = (nx, ny, cx, cy, rad, strength) => {
    const dx = nx - cx;
    const dy = ny - cy;
    const r = Math.hypot(dx, dy);
    if (r >= rad || r < 1e-6) return [nx, ny];
    const k = 1 - r / rad;
    const factor = 1 - strength * k * k;
    return [cx + dx * factor, cy + dy * factor];
  };

  for (let y = 0; y < h; y++) {
    const ny = y * invH;
    const rowOff = y * w * 3;
    for (let x = 0; x < w; x++) {
      const nx = x * invW;
      let sx = nx;
      let sy = ny;
      let gain = 1.0;
      let lensBlackMix = 0.0;

      if (warpId === "warp_big_head") {
        [sx, sy] = radialWarp(nx, ny, 0.5, 0.36, 0.42, 0.55);
      } else if (warpId === "warp_tiny_face") {
        [sx, sy] = radialWarp(nx, ny, 0.5, 0.45, 0.36, -0.55);
      } else if (warpId === "warp_alien_vline") {
        [sx, sy] = radialWarp(nx, ny, 0.38, 0.38, 0.14, 0.55);
        [sx, sy] = radialWarp(sx, sy, 0.62, 0.38, 0.14, 0.55);
        const cdx = sx - 0.5;
        const cdy = sy - 0.58;
        const cr = Math.hypot(cdx, cdy);
        if (cr < 0.28) {
          const k = 1 - cr / 0.28;
          sx += cdx * 0.48 * k * k;
          sy -= cdy * 0.24 * k * k;
        }
      } else if (warpId === "warp_hamster") {
        [sx, sy] = radialWarp(nx, ny, 0.34, 0.56, 0.22, 0.52);
        [sx, sy] = radialWarp(sx, sy, 0.66, 0.56, 0.22, 0.52);
      } else if (warpId === "warp_bug_eyes") {
        [sx, sy] = radialWarp(nx, ny, 0.38, 0.38, 0.15, 0.60);
        [sx, sy] = radialWarp(sx, sy, 0.62, 0.38, 0.15, 0.60);
      } else if (warpId === "warp_wide_mouth") {
        const dx = nx - 0.5;
        const dy = ny - 0.62;
        const r = Math.hypot(dx, dy);
        if (r < 0.26) {
          const k = 1 - r / 0.26;
          sx = 0.5 + dx * (1 - 0.55 * k * k);
          sy = 0.62 + dy * (1 + 0.18 * k * k);
        }
      } else if (warpId === "warp_chubby") {
        const dx = nx - 0.5;
        const dy = ny - 0.50;
        const r = Math.hypot(dx, dy);
        if (r < 0.44) {
          const k = 1 - r / 0.44;
          sx = 0.5 + dx * (1 - 0.48 * k * k);
          sy = 0.50 + dy * (1 - 0.15 * k * k);
        }
      } else if (warpId === "warp_gigachad") {
        [sx, sy] = radialWarp(nx, ny, 0.32, 0.64, 0.20, 0.50);
        [sx, sy] = radialWarp(sx, sy, 0.68, 0.64, 0.20, 0.50);
        [sx, sy] = radialWarp(sx, sy, 0.50, 0.70, 0.18, 0.35);
      } else if (warpId === "warp_swirl") {
        const dx = nx - 0.5;
        const dy = ny - 0.46;
        const r = Math.hypot(dx, dy);
        if (r < 0.45) {
          const k = 1 - r / 0.45;
          const ang = 2.6 * k * k;
          const ca = Math.cos(ang);
          const sa = Math.sin(ang);
          sx = 0.5 + (dx * ca - dy * sa);
          sy = 0.46 + (dx * sa + dy * ca);
        }
      } else if (warpId === "warp_melt") {
        sy = ny - 0.14 * (0.5 + 0.5 * Math.sin(nx * 14)) * Math.max(0, ny - 0.15);
      } else if (warpId === "warp_fisheye") {
        const dx = nx - 0.5;
        const dy = ny - 0.5;
        const r = Math.hypot(dx, dy);
        const u = r / 0.70710678;
        const scale = 0.42 + 0.58 * u * u;
        sx = 0.5 + dx * scale;
        sy = 0.5 + dy * scale;
        gain = 1.06 - 0.24 * u * u;
      } else if (warpId === "warp_fisheye_dazz") {
        const dx = nx - 0.5;
        const dy = ny - 0.5;
        const r = Math.hypot(dx, dy);
        const R_LENS = 0.475;
        if (r >= R_LENS + 0.008) {
          lensBlackMix = 1.0;
        } else {
          if (r > R_LENS - 0.006) {
            lensBlackMix = (r - (R_LENS - 0.006)) / 0.014;
          }
          const t = Math.min(1.0, r / R_LENS);
          const tSrc = 0.55 * ((2 / Math.PI) * Math.asin(t)) + 0.45 * (t * (0.45 + 0.55 * t * t));
          const rSrc = 0.5 * tSrc;
          const ratio = r > 1e-6 ? rSrc / r : 0.6;
          sx = 0.5 + dx * ratio;
          sy = 0.5 + dy * ratio;
          gain = 1.05 - 0.30 * Math.pow(t, 2.4);
        }
      }

      const di = rowOff + x * 3;
      if (lensBlackMix >= 1.0) {
        srcRgb[di] = 10;
        srcRgb[di + 1] = 10;
        srcRgb[di + 2] = 12;
        continue;
      }

      const fx = Math.min(w - 1.001, Math.max(0, sx * (w - 1)));
      const fy = Math.min(h - 1.001, Math.max(0, sy * (h - 1)));
      const x0 = fx | 0;
      const y0 = fy | 0;
      const x1 = x0 + 1;
      const y1 = y0 + 1;
      const tx = fx - x0;
      const ty = fy - y0;
      const itx = 1 - tx;
      const ity = 1 - ty;

      const i00 = (y0 * w + x0) * 3;
      const i10 = (y0 * w + x1) * 3;
      const i01 = (y1 * w + x0) * 3;
      const i11 = (y1 * w + x1) * 3;

      for (let c = 0; c < 3; c++) {
        let v =
          ((copy[i00 + c] * itx + copy[i10 + c] * tx) * ity +
            (copy[i01 + c] * itx + copy[i11 + c] * tx) * ty) *
          gain;
        if (lensBlackMix > 0) {
          const blackC = c === 2 ? 12 : 10;
          v = v * (1 - lensBlackMix) + blackC * lensBlackMix;
        }
        srcRgb[di + c] = v < 0 ? 0 : v > 255 ? 255 : v | 0;
      }
    }
  }
}

function applyCctvOverlay(rgb, w, h) {
  // Authentic desaturated night-vision IR security cam look + subtle vignette & scanlines
  const s = w / 512;
  const halfW = w * 0.5;
  const halfH = h * 0.5;
  const invMaxR2 = 1 / (halfW * halfW + halfH * halfH);
  let rng = 0x517cc1b7;
  for (let y = 0; y < h; y++) {
    const scan = y % 3 === 0 ? 0.90 : 1.0;
    const dy = y - halfH;
    const dy2 = dy * dy;
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      const i = row + x * 3;
      const dx = x - halfW;
      const vig = 1.0 - 0.34 * (dx * dx + dy2) * invMaxR2;
      let lum = 0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2];
      lum = ((lum - 128) * 1.12 + 124) * scan * vig;
      rng = (rng ^ (rng << 13)) >>> 0;
      rng = (rng ^ (rng >>> 17)) >>> 0;
      rng = (rng ^ (rng << 5)) >>> 0;
      const noise = ((rng & 0xff) / 127.5 - 1) * 8.5;
      const base = lum + noise;
      rgb[i] = Math.min(255, Math.max(0, base * 0.84)) | 0;
      rgb[i + 1] = Math.min(255, Math.max(0, base * 0.98)) | 0;
      rgb[i + 2] = Math.min(255, Math.max(0, base * 0.88)) | 0;
    }
  }
  const m = Math.round(14 * s);
  const len = Math.round(46 * s);
  const thk = Math.max(2, Math.round(2.5 * s));
  const brk = [215, 240, 224];
  fillRectRgb(rgb, w, h, m, m, len, m + thk, brk);
  fillRectRgb(rgb, w, h, m, m, m + thk, len, brk);
  fillRectRgb(rgb, w, h, w - len, m, w - m, m + thk, brk);
  fillRectRgb(rgb, w, h, w - m - thk, m, w - m, len, brk);
  fillRectRgb(rgb, w, h, m, h - m - thk, len, h - m, brk);
  fillRectRgb(rgb, w, h, m, h - len, m + thk, h - m, brk);
  fillRectRgb(rgb, w, h, w - len, h - m - thk, w - m, h - m, brk);
  fillRectRgb(rgb, w, h, w - m - thk, h - len, w - m, h - m, brk);
  const dotCx = Math.round(28 * s);
  const dotCy = Math.round(28 * s);
  const dotR = Math.round(7 * s);
  const dotR2 = dotR * dotR;
  for (let y = dotCy - dotR; y <= dotCy + dotR; y++) {
    for (let x = dotCx - dotR; x <= dotCx + dotR; x++) {
      if ((x - dotCx) * (x - dotCx) + (y - dotCy) * (y - dotCy) <= dotR2) {
        const i = (y * w + x) * 3;
        rgb[i] = 228; rgb[i + 1] = 45; rgb[i + 2] = 45;
      }
    }
  }
  const vnNow = new Date(Date.now() + 7 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    vnNow.getUTCFullYear() + "-" + pad(vnNow.getUTCMonth() + 1) + "-" + pad(vnNow.getUTCDate()) +
    " " + pad(vnNow.getUTCHours()) + ":" + pad(vnNow.getUTCMinutes()) + ":" + pad(vnNow.getUTCSeconds());
  const textScale = Math.max(2, Math.round(2 * s));
  drawTextRgb(rgb, w, h, "REC CAM-01", Math.round(44 * s), Math.round(21 * s), textScale, [235, 248, 240], [10, 16, 12]);
  drawTextRgb(rgb, w, h, stamp, Math.round(24 * s), h - Math.round(40 * s), textScale, [235, 248, 240], [10, 16, 12]);
}

function applyClockWeekdayOverlay(rgb, w, h, atlasAlpha = null) {
  const vnNow = new Date(Date.now() + 7 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const timeStr = pad(vnNow.getUTCHours()) + ":" + pad(vnNow.getUTCMinutes());
  const datePart = pad(vnNow.getUTCDate()) + "/" + pad(vnNow.getUTCMonth() + 1);
  const dayIdx = vnNow.getUTCDay();

  // Subtle top dark veil so white Lock-Screen text stays readable on light backgrounds
  const gradH = Math.round(h * 0.34);
  for (let y = 0; y < gradH; y++) {
    const t = 1 - y / gradH;
    const mul = 1 - 0.36 * t * t;
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      const i = row + x * 3;
      rgb[i] = (rgb[i] * mul) | 0;
      rgb[i + 1] = (rgb[i + 1] * mul) | 0;
      rgb[i + 2] = (rgb[i + 2] * mul) | 0;
    }
  }

  if (atlasAlpha && atlasAlpha.length >= 512 * 256) {
    const AW = 512;
    const findSpan = (cx, cy, cw, ch) => {
      let minX = cw, maxX = -1;
      for (let x = 0; x < cw; x++) {
        for (let y = 0; y < ch; y++) {
          if (atlasAlpha[(cy + y) * AW + (cx + x)] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            break;
          }
        }
      }
      if (maxX < minX) return { sx: 0, sw: Math.max(8, cw >> 1) };
      return { sx: minX, sw: maxX - minX + 1 };
    };
    const blitScaledGlyph = (cx, cy, sx, sw, ch, dstX, dstY, scale, col, shOffX, shOffY, shAlpha) => {
      const dw = Math.ceil(sw * scale);
      const dh = Math.ceil(ch * scale);
      const invS = 1 / scale;
      // Soft shadow pass + crisp white foreground pass
      for (let pass = 0; pass < 2; pass++) {
        const ox = pass === 0 ? shOffX : 0;
        const oy = pass === 0 ? shOffY : 0;
        for (let dy = 0; dy < dh; dy++) {
          const ty = Math.round(dstY + dy + oy);
          if (ty < 0 || ty >= h) continue;
          const ayF = dy * invS;
          const ay0 = Math.min(ch - 1, ayF | 0);
          const ay1 = Math.min(ch - 1, ay0 + 1);
          const fy = ayF - ay0;
          const r0 = (cy + ay0) * AW + cx + sx;
          const r1 = (cy + ay1) * AW + cx + sx;
          const dstRow = ty * w * 3;
          for (let dx = 0; dx < dw; dx++) {
            const tx = Math.round(dstX + dx + ox);
            if (tx < 0 || tx >= w) continue;
            const axF = dx * invS;
            const ax0 = Math.min(sw - 1, axF | 0);
            const ax1 = Math.min(sw - 1, ax0 + 1);
            const fx = axF - ax0;
            const a =
              (atlasAlpha[r0 + ax0] * (1 - fx) + atlasAlpha[r0 + ax1] * fx) * (1 - fy) +
              (atlasAlpha[r1 + ax0] * (1 - fx) + atlasAlpha[r1 + ax1] * fx) * fy;
            if (a < 3) continue;
            const i = dstRow + tx * 3;
            if (pass === 0) {
              const sMix = 1 - (a / 255) * shAlpha;
              rgb[i] = (rgb[i] * sMix) | 0;
              rgb[i + 1] = (rgb[i + 1] * sMix) | 0;
              rgb[i + 2] = (rgb[i + 2] * sMix) | 0;
            } else {
              const alpha = a / 255;
              const invA = 1 - alpha;
              rgb[i] = (rgb[i] * invA + col[0] * alpha) | 0;
              rgb[i + 1] = (rgb[i + 1] * invA + col[1] * alpha) | 0;
              rgb[i + 2] = (rgb[i + 2] * invA + col[2] * alpha) | 0;
            }
          }
        }
      }
    };

    const s = w / 768;
    // 1. Small crisp date line: "<WEEKDAY> • DD/MM"
    const wdPos = [[0, 176], [170, 176], [340, 176], [0, 216], [170, 216], [340, 216], [296, 128]][dayIdx];
    const smallChars = "0123456789/•";
    const dateCells = [
      { cx: wdPos[0], cy: wdPos[1], cw: 168, ch: 38, ...findSpan(wdPos[0], wdPos[1], 168, 38) },
      { cx: 11 * 24, cy: 128, cw: 24, ch: 48, ...findSpan(11 * 24, 128, 24, 48), yNudge: -4 },
    ];
    for (const ch of datePart) {
      const idx = smallChars.indexOf(ch);
      if (idx >= 0) dateCells.push({ cx: idx * 24, cy: 128, cw: 24, ch: 48, ...findSpan(idx * 24, 128, 24, 48), yNudge: -6 });
    }
    const dScale = 1.0 * s;
    const dGap = 4 * s;
    let totalDW = 0;
    dateCells.forEach((g, idx) => {
      totalDW += g.sw * dScale + (idx > 0 ? (idx <= 2 ? 10 * s : dGap) : 0);
    });
    let curDX = (w - totalDW) * 0.5;
    const baseDY = 24 * s;
    dateCells.forEach((g, idx) => {
      if (idx > 0) curDX += idx <= 2 ? 10 * s : dGap;
      blitScaledGlyph(g.cx, g.cy, g.sx, g.sw, g.ch, curDX, baseDY + (g.yNudge || 0) * dScale, dScale, [254, 243, 199], 0, 2 * s, 0.55);
      curDX += g.sw * dScale;
    });

    // 2. Large crisp iOS Lock-Screen time "HH:MM"
    const bigChars = "0123456789:/";
    const tScale = 1.08 * s;
    const tGap = 6 * s;
    const timeCells = [];
    let totalTW = 0;
    for (let i = 0; i < timeStr.length; i++) {
      const idx = bigChars.indexOf(timeStr[i]);
      const sp = findSpan(idx * 42, 0, 42, 128);
      timeCells.push({ cx: idx * 42, cy: 0, ch: 128, ...sp });
      totalTW += sp.sw * tScale + (i > 0 ? tGap : 0);
    }
    let curTX = (w - totalTW) * 0.5;
    const baseTY = 60 * s;
    for (let i = 0; i < timeCells.length; i++) {
      const g = timeCells[i];
      blitScaledGlyph(g.cx, g.cy, g.sx, g.sw, g.ch, curTX, baseTY, tScale, [255, 255, 255], 1 * s, 3 * s, 0.58);
      curTX += g.sw * tScale + tGap;
    }
    return;
  }

  // Emergency fallback only if atlas fails to fetch
  const s = w / 512;
  const dayNames = ["CHU NHAT", "THU HAI", "THU BA", "THU TU", "THU NAM", "THU SAU", "THU BAY"];
  const dateStr = dayNames[dayIdx] + " " + datePart;
  const tScale = Math.max(11, Math.round(11 * s));
  const dScale = Math.max(3, Math.round(3 * s));
  const tx = Math.max(16, (w - (timeStr.length * 6 * tScale - tScale)) >> 1);
  drawTextRgb(rgb, w, h, timeStr, tx, Math.round(34 * s), tScale, [255, 255, 255], [15, 23, 42]);
  const dx = Math.max(16, (w - (dateStr.length * 6 * dScale - dScale)) >> 1);
  drawTextRgb(rgb, w, h, dateStr, dx, Math.round(122 * s), dScale, [254, 240, 138], [15, 23, 42]);
}

function applyTripleClone(rgb, w, h) {
  // Subtle chromatic prism split keeping the center subject sharp and vivid
  const copy = new Uint8Array(rgb);
  const shift = Math.round(38 * (w / 768));
  const halfW = w * 0.5;
  const halfH = h * 0.5;
  for (let y = 0; y < h; y++) {
    const row = y * w * 3;
    const dy = (y - halfH) / halfH;
    for (let x = 0; x < w; x++) {
      const dx = (x - halfW) / halfW;
      // Keep eyes/center cleaner, ramp prism echo toward periphery
      const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const mix = 0.14 + 0.18 * dist;
      const lx = Math.max(0, x - shift);
      const rx = Math.min(w - 1, x + shift);
      const i = row + x * 3;
      const li = row + lx * 3;
      const ri = row + rx * 3;
      const rEcho = copy[ri] * 1.05;
      const gEcho = copy[li + 1] * 0.60 + copy[ri + 1] * 0.40;
      const bEcho = copy[li + 2] * 1.08;
      const baseW = 1 - mix * 0.45;
      const sr = copy[i] * baseW + rEcho * mix * 0.52;
      const sg = copy[i + 1] * baseW + gEcho * mix * 0.42;
      const sb = copy[i + 2] * baseW + bEcho * mix * 0.52;
      rgb[i] = sr > 255 ? 255 : sr | 0;
      rgb[i + 1] = sg > 255 ? 255 : sg | 0;
      rgb[i + 2] = sb > 255 ? 255 : sb | 0;
    }
  }
}

function boxBlurRgb(srcRgb, w, h, rad, passes = 1) {
  let cur = new Uint8Array(srcRgb);
  const tmp = new Uint8Array(w * h * 3);
  const out = new Uint8Array(w * h * 3);
  const win = rad * 2 + 1;
  const maxX = w - 1;
  const maxY = h - 1;
  const stride = w * 3;

  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < h; y++) {
      const row = y * stride;
      let sr = cur[row] * (rad + 1), sg = cur[row + 1] * (rad + 1), sb = cur[row + 2] * (rad + 1);
      for (let k = 1; k <= rad; k++) {
        const si = row + Math.min(maxX, k) * 3;
        sr += cur[si]; sg += cur[si + 1]; sb += cur[si + 2];
      }
      for (let x = 0; x < w; x++) {
        const di = row + x * 3;
        tmp[di] = (sr / win) | 0;
        tmp[di + 1] = (sg / win) | 0;
        tmp[di + 2] = (sb / win) | 0;
        const xAdd = x + rad + 1;
        const xSub = x - rad;
        const addIdx = row + (xAdd > maxX ? maxX : xAdd) * 3;
        const subIdx = row + (xSub < 0 ? 0 : xSub) * 3;
        sr += cur[addIdx] - cur[subIdx];
        sg += cur[addIdx + 1] - cur[subIdx + 1];
        sb += cur[addIdx + 2] - cur[subIdx + 2];
      }
    }
    for (let x = 0; x < w; x++) {
      const colOff = x * 3;
      let sr = tmp[colOff] * (rad + 1), sg = tmp[colOff + 1] * (rad + 1), sb = tmp[colOff + 2] * (rad + 1);
      for (let k = 1; k <= rad; k++) {
        const si = (k > maxY ? maxY : k) * stride + colOff;
        sr += tmp[si]; sg += tmp[si + 1]; sb += tmp[si + 2];
      }
      for (let y = 0; y < h; y++) {
        const di = y * stride + colOff;
        out[di] = (sr / win) | 0;
        out[di + 1] = (sg / win) | 0;
        out[di + 2] = (sb / win) | 0;
        const yAdd = y + rad + 1;
        const ySub = y - rad;
        const addIdx = (yAdd > maxY ? maxY : yAdd) * stride + colOff;
        const subIdx = (ySub < 0 ? 0 : ySub) * stride + colOff;
        sr += tmp[addIdx] - tmp[subIdx];
        sg += tmp[addIdx + 1] - tmp[subIdx + 1];
        sb += tmp[addIdx + 2] - tmp[subIdx + 2];
      }
    }
    if (pass + 1 < passes) cur = new Uint8Array(out);
  }
  return out;
}

function applyPortraitBokeh(rgb, w, h) {
  const rad = Math.max(7, Math.round(7 * (w / 512)));
  const blur = boxBlurRgb(rgb, w, h, rad, 1);
  // Smooth feathered vertical portrait ellipse matte
  const invW = 1 / w;
  const invH = 1 / h;
  for (let y = 0; y < h; y++) {
    const dy = (y * invH - 0.46) / 0.44;
    const dy2 = dy * dy;
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      const dx = (x * invW - 0.5) / 0.33;
      const d = Math.sqrt(dx * dx + dy2);
      const sharpRatio = d <= 0.68 ? 1 : d >= 1.12 ? 0 : 1 - (d - 0.68) / 0.44;
      const i = row + x * 3;
      const invRatio = 1 - sharpRatio;
      rgb[i] = (rgb[i] * sharpRatio + blur[i] * invRatio) | 0;
      rgb[i + 1] = (rgb[i + 1] * sharpRatio + blur[i + 1] * invRatio) | 0;
      rgb[i + 2] = (rgb[i + 2] * sharpRatio + blur[i + 2] * invRatio) | 0;
    }
  }
}

function applyWaterDropletsGlass(rgb, w, h, sharpBg = false) {
  const orig = new Uint8Array(rgb);
  const s = w / 768;
  let blur;
  if (sharpBg) {
    // Crisp photo behind glass with only a whisper of soft condensation haze (fx_giot_nuoc_ro)
    const blur1 = boxBlurRgb(orig, w, h, 1, 1);
    blur = new Uint8Array(w * h * 3);
    for (let i = 0; i < blur.length; i++) {
      blur[i] = (orig[i] * 0.72 + blur1[i] * 0.28) | 0;
    }
  } else {
    const blurRad = Math.max(2, Math.round(4 * s));
    blur = boxBlurRgb(orig, w, h, blurRad, 2);
  }

  const total = w * h;
  const field = new Float32Array(total);
  let rng = (((Date.now() & 0xffff) ^ 0x9e3779b9) >>> 0) || 0x13579bdf;
  const rnd = () => {
    rng = (rng ^ (rng << 13)) >>> 0;
    rng = (rng ^ (rng >>> 17)) >>> 0;
    rng = (rng ^ (rng << 5)) >>> 0;
    if (rng === 0) rng = 0x9e3779b9;
    return rng / 4294967296;
  };

  const splatLobe = (cx, cy, rx, ry, gravityBulge) => {
    const maxR = Math.max(rx, ry * 1.18);
    const x0 = Math.max(0, Math.floor(cx - maxR - 1));
    const x1 = Math.min(w - 1, Math.ceil(cx + maxR + 1));
    const y0 = Math.max(0, Math.floor(cy - ry - 1));
    const y1 = Math.min(h - 1, Math.ceil(cy + ry + 1));
    const invRy = 1 / Math.max(0.5, ry);
    const invRx = 1 / Math.max(0.5, rx);
    for (let y = y0; y <= y1; y++) {
      const yn = (y - cy) * invRy;
      const yn2 = yn * yn;
      if (yn2 >= 1) continue;
      const rxScale = gravityBulge > 0 ? 1 + gravityBulge * yn : 1;
      const effInvRx = invRx / Math.max(0.65, rxScale);
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const xn = (x - cx) * effInvRx;
        const d2 = xn * xn + yn2;
        if (d2 < 1) {
          const val = 1 - d2;
          field[row + x] += val * val;
        }
      }
    }
  };

  // Tier 1: ~220 micro mist beads
  for (let i = 0; i < 220; i++) {
    const r = (2.2 + rnd() * 3.8) * s;
    const asp = 1.0 + rnd() * 0.22;
    splatLobe(rnd() * w, rnd() * h, r, r * asp, 0);
  }
  // Tier 2: ~100 medium organic beads (45% fused with an offset satellite lobe)
  for (let i = 0; i < 100; i++) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const rx = (6.5 + rnd() * 7.0) * s;
    const ry = rx * (1.05 + rnd() * 0.34);
    splatLobe(cx, cy, rx, ry, 0.12);
    if (rnd() < 0.45) {
      const ang = rnd() * Math.PI * 2;
      const dist = rx * (0.42 + rnd() * 0.22);
      const sr = rx * (0.58 + rnd() * 0.26);
      splatLobe(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, sr, sr * (1.02 + rnd() * 0.24), 0.08);
    }
  }
  // Tier 3: ~26 hero teardrops & fused glass clusters
  for (let i = 0; i < 26; i++) {
    const cx = (0.04 + rnd() * 0.92) * w;
    const cy = (0.04 + rnd() * 0.92) * h;
    const rx = (14.0 + rnd() * 10.0) * s;
    const ry = rx * (1.10 + rnd() * 0.32);
    splatLobe(cx, cy, rx, ry, 0.18);
    const lobes = rnd() < 0.45 ? 2 : 1;
    for (let l = 0; l < lobes; l++) {
      const ang = (l === 0 ? -1 : 1) * (0.5 + rnd() * 2.1);
      const dist = rx * (0.45 + rnd() * 0.25);
      const sr = rx * (0.55 + rnd() * 0.28);
      splatLobe(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, sr, sr * (1.06 + rnd() * 0.25), 0.14);
    }
  }

  const T = 0.20;
  const gradGain = 5.0;
  const refractPx = 22.0 * s;
  const shX = Math.max(1, Math.round(2 * s));
  const shY = Math.max(2, Math.round(3 * s));
  const maxW = w - 1.001;
  const maxH = h - 1.001;

  for (let y = 0; y < h; y++) {
    const ym = y > 0 ? y - 1 : 0;
    const yp = y < h - 1 ? y + 1 : h - 1;
    const ySh = y >= shY ? y - shY : 0;
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const idx = row + x;
      const f = field[idx];
      const i3 = idx * 3;
      if (f <= T) {
        const xSh = x >= shX ? x - shX : 0;
        const fSh = field[ySh * w + xSh];
        const mul = fSh > T ? 0.84 : 1.0;
        rgb[i3] = (blur[i3] * mul) | 0;
        rgb[i3 + 1] = (blur[i3 + 1] * mul) | 0;
        rgb[i3 + 2] = (blur[i3 + 2] * mul) | 0;
        continue;
      }

      const xm = x > 0 ? x - 1 : 0;
      const xp = x < w - 1 ? x + 1 : w - 1;
      const gx = (field[row + xp] - field[row + xm]) * gradGain;
      const gy = (field[yp * w + x] - field[ym * w + x]) * gradGain;
      const invLen = 1 / Math.sqrt(gx * gx + gy * gy + 1.0);
      const nx = -gx * invLen;
      const ny = -gy * invLen;
      const nz = invLen;

      let sx = x - nx * refractPx;
      let sy = y - ny * refractPx;
      if (sx < 0) sx = 0;
      else if (sx > maxW) sx = maxW;
      if (sy < 0) sy = 0;
      else if (sy > maxH) sy = maxH;

      const x0 = sx | 0;
      const y0 = sy | 0;
      const fx = sx - x0;
      const fy = sy - y0;
      const ifx = 1 - fx;
      const ify = 1 - fy;
      const i00 = (y0 * w + x0) * 3;
      const i10 = (y0 * w + x0 + 1) * 3;
      const i01 = ((y0 + 1) * w + x0) * 3;
      const i11 = ((y0 + 1) * w + x0 + 1) * 3;

      // Clear water center, crisp dark meniscus strictly on thin outer perimeter
      const edgeBand = f < T + 0.16 ? 1 - (f - T) / 0.16 : 0;
      const slopeRim = Math.max(0, 1 - nz);
      const darkRim = 1 - (0.48 * edgeBand * edgeBand + 0.22 * slopeRim * slopeRim);
      const caustic = Math.max(0, nx * 0.65 + ny * 0.76) * (0.35 + 0.65 * slopeRim);
      const h1 = Math.max(0, -nx * 0.62 - ny * 0.68 + nz * 0.42);
      const spec1 = Math.pow(h1, 20) * 235;
      const h2 = Math.max(0, nx * 0.55 + ny * 0.65 + nz * 0.55);
      const spec2 = Math.pow(h2, 26) * 115;
      const spec = spec1 + spec2;

      const edgeA = f - T < 0.08 ? (f - T) / 0.08 : 1.0;
      const invA = 1 - edgeA;

      for (let c = 0; c < 3; c++) {
        let rc = (orig[i00 + c] * ifx + orig[i10 + c] * fx) * ify + (orig[i01 + c] * ifx + orig[i11 + c] * fx) * fy;
        rc = (rc - 128) * 1.06 + 132;
        let dc = rc * darkRim + 42 * caustic + spec;
        if (dc < 0) dc = 0;
        else if (dc > 255) dc = 255;
        const mixed = blur[i3 + c] * invA + dc * edgeA;
        rgb[i3 + c] = mixed > 255 ? 255 : mixed < 0 ? 0 : mixed | 0;
      }
    }
  }
}

function makeFxRng(seedBase) {
  let rng = (((Date.now() & 0xffff) ^ seedBase) >>> 0) || 0x13579bdf;
  return () => {
    rng = (rng ^ (rng << 13)) >>> 0;
    rng = (rng ^ (rng >>> 17)) >>> 0;
    rng = (rng ^ (rng << 5)) >>> 0;
    if (rng === 0) rng = 0x9e3779b9;
    return rng / 4294967296;
  };
}

function screenPixel(rgb, i3, sr, sg, sb) {
  const r0 = rgb[i3], g0 = rgb[i3 + 1], b0 = rgb[i3 + 2];
  rgb[i3] = (255 - (((255 - r0) * (255 - Math.min(255, sr))) / 255)) | 0;
  rgb[i3 + 1] = (255 - (((255 - g0) * (255 - Math.min(255, sg))) / 255)) | 0;
  rgb[i3 + 2] = (255 - (((255 - b0) * (255 - Math.min(255, sb))) / 255)) | 0;
}

function applyRainOverlayGlass(rgb, w, h) {
  const s = w / 768;
  const total = w * h;
  // Cool overcast cinema rain mood so rain streaks read clearly even on bright walls/shirts
  for (let p = 0, i = 0; p < total; p++, i += 3) {
    let r = (rgb[i] * 0.80 - 128) * 1.08 + 128;
    let g = (rgb[i + 1] * 0.85 - 128) * 1.08 + 128;
    let b = (rgb[i + 2] * 0.94 - 128) * 1.08 + 128;
    rgb[i] = r < 0 ? 0 : r > 255 ? 255 : r | 0;
    rgb[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g | 0;
    rgb[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b | 0;
  }

  const rnd = makeFxRng(0x51a7b3c9);
  const ang = -0.26; // ~ -15 deg tilt
  const ux = Math.sin(ang);
  const uy = Math.cos(ang);
  const vx = uy;
  const vy = -ux;

  // ~195 multi-depth motion-blurred rainfall streaks with subtle refractive edge
  for (let k = 0; k < 195; k++) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const depth = rnd();
    const halfLen = (16 + depth * 40) * s;
    const halfW = (0.85 + (1 - depth) * 1.25) * s;
    const peakA = 0.28 + depth * 0.42;
    const boxR = Math.ceil(halfLen + halfW * 1.8 + 2);
    const x0 = Math.max(0, Math.floor(cx - boxR));
    const x1 = Math.min(w - 1, Math.ceil(cx + boxR));
    const y0 = Math.max(0, Math.floor(cy - boxR));
    const y1 = Math.min(h - 1, Math.ceil(cy + boxR));
    const invHalfLen = 1 / halfLen;
    const invHalfW = 1 / halfW;

    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const along = dx * ux + dy * uy;
        if (Math.abs(along) >= halfLen) continue;
        const signedPerp = dx * vx + dy * vy;
        const perp = Math.abs(signedPerp);
        const tA = 1 - Math.abs(along) * invHalfLen;
        if (signedPerp > halfW * 0.45 && signedPerp < halfW * 1.65) {
          const edgeT = 1 - (signedPerp - halfW * 0.45) / (halfW * 1.20);
          const m = 1 - 0.18 * tA * edgeT;
          const idx = (row + x) * 3;
          rgb[idx] = (rgb[idx] * m) | 0;
          rgb[idx + 1] = (rgb[idx + 1] * m) | 0;
          rgb[idx + 2] = (rgb[idx + 2] * m) | 0;
        }
        if (perp >= halfW) continue;
        const tW = 1 - perp * invHalfW;
        const a = peakA * tA * (tW * tW);
        if (a > 0.01) {
          screenPixel(rgb, (row + x) * 3, 232 * a, 244 * a, 255 * a);
        }
      }
    }
  }

  // ~35 tiny subtle water micro-beads near outer lens border
  for (let k = 0; k < 35; k++) {
    let bx = rnd() * w;
    let by = rnd() * h;
    if (bx > w * 0.24 && bx < w * 0.76 && by > h * 0.20 && by < h * 0.80) {
      bx = rnd() < 0.5 ? rnd() * w * 0.20 : w * (0.80 + rnd() * 0.20);
    }
    const r = (2.2 + rnd() * 3.2) * s;
    const x0 = Math.max(0, Math.floor(bx - r - 1));
    const x1 = Math.min(w - 1, Math.ceil(bx + r + 1));
    const y0 = Math.max(0, Math.floor(by - r - 1));
    const y1 = Math.min(h - 1, Math.ceil(by + r + 1));
    const invR = 1 / r;
    for (let y = y0; y <= y1; y++) {
      const ny = (y - by) * invR;
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const nx = (x - bx) * invR;
        const d2 = nx * nx + ny * ny;
        if (d2 >= 1) continue;
        const rim = d2 > 0.65 ? (1 - d2) / 0.35 : 0.25;
        const hl = Math.max(0, -nx * 0.6 - ny * 0.7);
        const lum = 190 * (hl * hl * 0.6 + rim * 0.25);
        screenPixel(rgb, (row + x) * 3, lum, lum * 1.03, lum * 1.08);
      }
    }
  }
}

const FX_ATMOSPHERE_MOODS = {
  fx_ca_cute: { rMul: 0.96, gMul: 1.02, bMul: 1.07, lift: 5, bloom: 0.18, glowRgb: [165, 235, 255], glAlpha: 0.14 },
  fx_buom_xinh: { rMul: 1.03, gMul: 1.02, bMul: 0.99, lift: 6, bloom: 0.20, glowRgb: [255, 224, 235], glAlpha: 0.14 },
  fx_canh_hoa: { rMul: 1.05, gMul: 0.99, bMul: 1.02, lift: 7, bloom: 0.22, glowRgb: [255, 212, 230], glAlpha: 0.16 },
  fx_sticker_doodle: { rMul: 1.03, gMul: 1.01, bMul: 1.02, lift: 6, bloom: 0.16, glowRgb: [255, 228, 240], glAlpha: 0.13 },
  fx_bong_bong: { rMul: 1.01, gMul: 1.02, bMul: 1.05, lift: 5, bloom: 0.22, glowRgb: [205, 238, 255], glAlpha: 0.15 },
  fx_cau_vong: { rMul: 1.04, gMul: 1.02, bMul: 0.98, lift: 6, bloom: 0.20, glowRgb: [255, 228, 195], glAlpha: 0.14 },
  fx_sao_lap_lanh: { rMul: 1.01, gMul: 1.00, bMul: 1.05, lift: 4, bloom: 0.23, glowRgb: [255, 236, 200], glAlpha: 0.14 },
};

function applyKawaiiAtmosphere(rgb, w, h, filterId) {
  const mood = FX_ATMOSPHERE_MOODS[filterId];
  if (!mood) return;
  const total = w * h;
  let lumSum = 0;
  let lumCnt = 0;
  for (let p = 0; p < total; p += 17) {
    const i = p * 3;
    lumSum += 0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2];
    lumCnt++;
  }
  const avgLum = lumCnt > 0 ? lumSum / lumCnt : 128;
  // Dark-scene guard: keeps pitch-black photos rich dark instead of milky washed-out grey
  const sceneScale = Math.min(1.0, Math.max(0.24, (avgLum - 8) / 80));
  const lift = mood.lift * sceneScale;

  // Precompute integer LUTs for crisp pastel film color grading (zero per-pixel floats)
  const rLut = new Uint8Array(256);
  const gLut = new Uint8Array(256);
  const bLut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    const rr = v * mood.rMul + lift;
    const gg = v * mood.gMul + lift;
    const bb = v * mood.bMul + lift;
    rLut[v] = rr < 0 ? 0 : rr > 255 ? 255 : rr | 0;
    gLut[v] = gg < 0 ? 0 : gg > 255 ? 255 : gg | 0;
    bLut[v] = bb < 0 ? 0 : bb > 255 ? 255 : bb | 0;
  }

  // Compute low-frequency Pro-Mist bloom + corner glow + prism ribbon at 1/4 res (192x192 -> >10x faster CPU)
  const sw = Math.max(16, w >> 2);
  const sh = Math.max(16, h >> 2);
  const small = new Uint8Array(sw * sh * 3);
  for (let sy = 0; sy < sh; sy++) {
    const y0 = Math.min(h - 1, sy << 2);
    const rowSrc = y0 * w * 3;
    const rowDst = sy * sw * 3;
    for (let sx = 0; sx < sw; sx++) {
      const si = rowSrc + (Math.min(w - 1, sx << 2) * 3);
      const di = rowDst + sx * 3;
      small[di] = rgb[si];
      small[di + 1] = rgb[si + 1];
      small[di + 2] = rgb[si + 2];
    }
  }
  const blurred = boxBlurRgb(small, sw, sh, Math.max(2, Math.round(4 * (w / 768))), 2);

  // Add corner glow + soft prism flare directly onto the 192x192 screen-light buffer
  const invSw = 1 / sw;
  const invSh = 1 / sh;
  const bloomAmt = mood.bloom;
  const glScale = mood.glAlpha * sceneScale;
  const [gr, gg, gb] = mood.glowRgb;
  const hasPrism = !!mood.prism;

  for (let sy = 0; sy < sh; sy++) {
    const ny = sy * invSh;
    const row = sy * sw * 3;
    for (let sx = 0; sx < sw; sx++) {
      const nx = sx * invSw;
      const i = row + sx * 3;
      let lr = blurred[i] > 72 ? (blurred[i] - 72) * bloomAmt : 0;
      let lg = blurred[i + 1] > 72 ? (blurred[i + 1] - 72) * bloomAmt : 0;
      let lb = blurred[i + 2] > 72 ? (blurred[i + 2] - 72) * bloomAmt : 0;

      const c2 = (nx * nx + ny * ny) * 1.15;
      const ct = c2 < 1 ? 1 - c2 : 0;
      const cornerEnv = ct * ct * ct * glScale;
      lr += gr * cornerEnv;
      lg += gg * cornerEnv;
      lb += gb * cornerEnv;

      if (hasPrism) {
        const u = nx * 0.72 + ny * 0.69;
        const v = (nx - 0.14) * 0.69 - (ny - 0.11) * 0.72;
        const u2 = (u - 0.25) / 0.22;
        const v2 = v / 0.72;
        const ub = u2 * u2 < 1 ? 1 - u2 * u2 : 0;
        const vb = v2 * v2 < 1 ? 1 - v2 * v2 : 0;
        const beamEnv = ub * ub * vb * vb;
        if (beamEnv > 0.01) {
          const pStr = 0.19 * sceneScale * beamEnv;
          const d1 = (u - 0.15) / 0.095; const p1 = d1 * d1 < 1 ? (1 - d1 * d1) * (1 - d1 * d1) : 0;
          const d2 = (u - 0.21) / 0.095; const p2 = d2 * d2 < 1 ? (1 - d2 * d2) * (1 - d2 * d2) : 0;
          const d3 = (u - 0.27) / 0.095; const p3 = d3 * d3 < 1 ? (1 - d3 * d3) * (1 - d3 * d3) : 0;
          const d4 = (u - 0.33) / 0.095; const p4 = d4 * d4 < 1 ? (1 - d4 * d4) * (1 - d4 * d4) : 0;
          lr += 255 * pStr * (p1 * 1.0 + p2 * 1.0 + p3 * 0.72 + p4 * 0.65);
          lg += 255 * pStr * (p1 * 0.56 + p2 * 0.85 + p3 * 0.96 + p4 * 0.82);
          lb += 255 * pStr * (p1 * 0.60 + p2 * 0.50 + p3 * 0.90 + p4 * 1.00);
        }
      }

      blurred[i] = lr > 255 ? 255 : lr | 0;
      blurred[i + 1] = lg > 255 ? 255 : lg | 0;
      blurred[i + 2] = lb > 255 ? 255 : lb | 0;
    }
  }

  // Bilinearly sample smooth 192x192 glow map and integer-screen blend across 768x768
  const maxSx = sw - 1;
  const maxSy = sh - 1;
  for (let y = 0; y < h; y++) {
    const fsy = y * 0.25;
    const sy0 = fsy | 0;
    const sy1 = sy0 < maxSy ? sy0 + 1 : maxSy;
    const fy = ((fsy - sy0) * 256) | 0;
    const ify = 256 - fy;
    const r0 = sy0 * sw * 3;
    const r1 = sy1 * sw * 3;
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      const fsx = x * 0.25;
      const sx0 = fsx | 0;
      const sx1 = sx0 < maxSx ? sx0 + 1 : maxSx;
      const fx = ((fsx - sx0) * 256) | 0;
      const ifx = 256 - fx;
      const w00 = ifx * ify, w10 = fx * ify, w01 = ifx * fy, w11 = fx * fy;
      const b00 = r0 + sx0 * 3, b10 = r0 + sx1 * 3, b01 = r1 + sx0 * 3, b11 = r1 + sx1 * 3;

      const i = row + x * 3;
      const r = rLut[rgb[i]];
      const g = gLut[rgb[i + 1]];
      const b = bLut[rgb[i + 2]];

      const sr = (blurred[b00] * w00 + blurred[b10] * w10 + blurred[b01] * w01 + blurred[b11] * w11) >> 16;
      const sg = (blurred[b00 + 1] * w00 + blurred[b10 + 1] * w10 + blurred[b01 + 1] * w01 + blurred[b11 + 1] * w11) >> 16;
      const sb = (blurred[b00 + 2] * w00 + blurred[b10 + 2] * w10 + blurred[b01 + 2] * w01 + blurred[b11 + 2] * w11) >> 16;

      rgb[i] = 255 - (((255 - r) * (255 - sr)) / 255) | 0;
      rgb[i + 1] = 255 - (((255 - g) * (255 - sg)) / 255) | 0;
      rgb[i + 2] = 255 - (((255 - b) * (255 - sb)) / 255) | 0;
    }
  }
}

function applySoapBubblesOptical(rgb, w, h) {
  const orig = new Uint8Array(rgb);
  const s = w / 768;
  const rnd = makeFxRng(0xb0bb1e55);
  // Organic asymmetric diagonal drift across corners & edges (no stiff ring)
  const specs = [
    [0.88, 0.13, 72], [0.11, 0.86, 68], // 2 large soft close-to-lens bubbles at corners
    [0.14, 0.16, 40], [0.74, 0.21, 34], [0.85, 0.44, 44],
    [0.10, 0.56, 36], [0.76, 0.84, 42],
    [0.26, 0.11, 18], [0.64, 0.09, 15], [0.92, 0.68, 22], // delicate small & micro bubbles
    [0.19, 0.34, 14], [0.81, 0.64, 17], [0.27, 0.91, 20],
    [0.61, 0.90, 14], [0.07, 0.30, 12],
  ];
  const maxW = w - 1.001;
  const maxH = h - 1.001;

  for (let idx = 0; idx < specs.length; idx++) {
    const cx = (specs[idx][0] + (rnd() - 0.5) * 0.03) * w;
    const cy = (specs[idx][1] + (rnd() - 0.5) * 0.03) * h;
    const rad = specs[idx][2] * (0.92 + rnd() * 0.16) * s;
    const phase = rnd() * 6.283;
    const isLargeFG = idx < 2;
    const refract = Math.min(8 * s, rad * 0.16);
    const x0 = Math.max(0, Math.floor(cx - rad - 2));
    const x1 = Math.min(w - 1, Math.ceil(cx + rad + 2));
    const y0 = Math.max(0, Math.floor(cy - rad - 2));
    const y1 = Math.min(h - 1, Math.ceil(cy + rad + 2));
    const invR = 1 / rad;

    for (let y = y0; y <= y1; y++) {
      const ny = (y - cy) * invR;
      const ny2 = ny * ny;
      if (ny2 >= 1) continue;
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) * invR;
        const r2 = nx * nx + ny2;
        if (r2 >= 1) continue;
        const r = Math.sqrt(r2);
        const nz = Math.sqrt(Math.max(0.01, 1 - r2));

        // Mild spherical lens refraction near outer soap shell
        const pull = r * r * refract;
        let sx = x - nx * pull;
        let sy = y - ny * pull;
        if (sx < 0) sx = 0; else if (sx > maxW) sx = maxW;
        if (sy < 0) sy = 0; else if (sy > maxH) sy = maxH;
        const sx0 = sx | 0, sy0 = sy | 0;
        const fx = sx - sx0, fy = sy - sy0;
        const i00 = (sy0 * w + sx0) * 3;
        const i10 = (sy0 * w + sx0 + 1) * 3;
        const i01 = ((sy0 + 1) * w + sx0) * 3;
        const i11 = ((sy0 + 1) * w + sx0 + 1) * 3;

        const softOuter = isLargeFG ? 0.88 : 0.94;
        const edgeSoft = r > softOuter ? Math.pow((1 - r) / (1 - softOuter), 1.35) : 1.0;
        const ang = Math.atan2(ny, nx);

        // Pearlescent thin-film Fresnel concentrated tightly along outer membrane (crystal-clear center)
        const fresnel = Math.pow(r, 5.5) * (0.55 + 0.45 * Math.sin(ang * 2.0 + phase));
        const shift = ang * 1.15 + r * 3.8 + phase;
        const rawR = 135 + 120 * Math.cos(shift);
        const rawG = 135 + 120 * Math.cos(shift + 2.094);
        const rawB = 135 + 120 * Math.cos(shift + 4.188);
        // Desaturated pearlescent pastel reflection (42% thin-film + 58% soft sky white)
        const ir = rawR * 0.42 + 245 * 0.58;
        const ig = rawG * 0.42 + 249 * 0.58;
        const ib = rawB * 0.42 + 255 * 0.58;

        // Curved sky-window arc highlight + secondary tiny catchlight + membrane rim glint
        const h1 = Math.max(0, -nx * 0.60 - ny * 0.70 + nz * 0.39);
        const h2 = Math.max(0, nx * 0.52 + ny * 0.64 + nz * 0.56);
        const rimGlow = Math.exp(-Math.pow((r - 0.955) / 0.032, 2)) * 68;
        const spec = (Math.pow(h1, 24) * 215 + Math.pow(h2, 32) * 95 + rimGlow) * edgeSoft * (isLargeFG ? 0.86 : 1.0);

        const filmA = (0.015 + 0.44 * fresnel) * edgeSoft * (isLargeFG ? 0.86 : 1.0);
        // Subtle soap-film edge absorption so glass bubble contours stay visible on bright white walls
        const rimShade = 1.0 - 0.11 * Math.exp(-Math.pow((r - 0.91) / 0.06, 2)) * edgeSoft;
        const refractMix = 0.54 * edgeSoft;
        const i3 = (row + x) * 3;

        for (let c = 0; c < 3; c++) {
          const rc =
            (orig[i00 + c] * (1 - fx) + orig[i10 + c] * fx) * (1 - fy) +
            (orig[i01 + c] * (1 - fx) + orig[i11 + c] * fx) * fy;
          const base = (rgb[i3 + c] * (1 - refractMix) + rc * refractMix) * rimShade;
          const irCol = c === 0 ? ir : c === 1 ? ig : ib;
          const screened = 255 - ((255 - base) * (255 - Math.min(255, irCol * filmA + spec))) / 255;
          rgb[i3 + c] = screened > 255 ? 255 : screened | 0;
        }
      }
    }
  }
}

function applyBokehSnowfall(rgb, w, h) {
  const s = w / 768;
  const total = w * h;
  // Cool winter daylight balance with subtle highlight roll-off so white snow shows clearly on bright walls
  for (let p = 0, i = 0; p < total; p++, i += 3) {
    let r = rgb[i] * 0.90;
    let g = rgb[i + 1] * 0.94;
    let b = rgb[i + 2] * 1.01 + 2;
    if (r > 205) r = 205 + (r - 205) * 0.56;
    if (g > 205) g = 205 + (g - 205) * 0.56;
    if (b > 210) b = 210 + (b - 210) * 0.60;
    rgb[i] = r > 255 ? 255 : r | 0;
    rgb[i + 1] = g > 255 ? 255 : g | 0;
    rgb[i + 2] = b > 255 ? 255 : b | 0;
  }
  const rnd = makeFxRng(0x5000f411);

  // Zero-Math.pow fast round bokeh & snow disc splat
  const splatFlake = (cx, cy, rx, ry, alpha, isBokeh) => {
    const maxR = Math.max(rx, ry);
    const x0 = Math.max(0, Math.floor(cx - maxR - 1));
    const x1 = Math.min(w - 1, Math.ceil(cx + maxR + 1));
    const y0 = Math.max(0, Math.floor(cy - maxR - 1));
    const y1 = Math.min(h - 1, Math.ceil(cy + maxR + 1));
    const invRx = 1 / rx;
    const invRy = 1 / ry;
    for (let y = y0; y <= y1; y++) {
      const ny = (y - cy) * invRy;
      const ny2 = ny * ny;
      if (ny2 >= 1) continue;
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) * invRx;
        const d2 = nx * nx + ny2;
        if (d2 >= 1) continue;
        const t = 1 - d2;
        const f = isBokeh ? t * (0.45 + 0.55 * t) : t * t;
        const a = alpha * f;
        screenPixel(rgb, (row + x) * 3, 248 * a, 251 * a, 255 * a);
      }
    }
  };

  // Ultra-fast 3-axis folded-symmetry soft-blurred 6-point snowflake crystal
  const splatCrystal = (cx, cy, rad, rot, alpha) => {
    const axes = [];
    for (let k = 0; k < 3; k++) {
      const a = rot + k * 1.04719755;
      axes.push(Math.cos(a), Math.sin(a));
    }
    const u0 = axes[0], v0 = axes[1];
    const u1 = axes[2], v1 = axes[3];
    const u2 = axes[4], v2 = axes[5];
    const brPos = rad * 0.52;
    const brEndX = brPos + rad * 0.21;
    const brEndY = rad * 0.30;
    const brDx = brEndX - brPos;
    const brLen2 = brDx * brDx + brEndY * brEndY;
    const invBrLen2 = 1 / Math.max(1e-4, brLen2);

    const blurW = 2.4 * s;
    const invBlurW2 = 1 / (blurW * blurW);
    const pad = rad + blurW + 1;
    const pad2 = pad * pad;
    const x0 = Math.max(0, Math.floor(cx - pad));
    const x1 = Math.min(w - 1, Math.ceil(cx + pad));
    const y0 = Math.max(0, Math.floor(cy - pad));
    const y1 = Math.min(h - 1, Math.ceil(cy + pad));

    const axisDist2 = (dx, dy, ux, uy) => {
      const ap = Math.abs(dx * ux + dy * uy);
      const perp = Math.abs(-dx * uy + dy * ux);
      // Distance to main stem clamped at rad
      const stemOvershoot = ap > rad ? ap - rad : 0;
      let best = stemOvershoot * stemOvershoot + perp * perp;
      // Distance to folded symmetric V-branch segment (brPos,0)->(brEndX,brEndY)
      if (ap > brPos * 0.55) {
        let t = ((ap - brPos) * brDx + perp * brEndY) * invBrLen2;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        const bx = ap - (brPos + brDx * t);
        const by = perp - brEndY * t;
        const d2b = bx * bx + by * by;
        if (d2b < best) best = d2b;
      }
      return best;
    };

    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      const dy2 = dy * dy;
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        if (dx * dx + dy2 > pad2) continue;
        let d2 = axisDist2(dx, dy, u0, v0);
        const d2_1 = axisDist2(dx, dy, u1, v1);
        if (d2_1 < d2) d2 = d2_1;
        const d2_2 = axisDist2(dx, dy, u2, v2);
        if (d2_2 < d2) d2 = d2_2;

        const q = d2 * invBlurW2;
        if (q >= 1) continue;
        const g = (1 - q) * (1 - q);
        const a = alpha * g;
        screenPixel(rgb, (row + x) * 3, 248 * a, 252 * a, 255 * a);
      }
    }
  };

  // Layer 1: ~24 large soft out-of-focus foreground bokeh discs
  for (let k = 0; k < 24; k++) {
    const cx = (0.04 + rnd() * 0.92) * w;
    const cy = (0.04 + rnd() * 0.92) * h;
    const r = (13 + rnd() * 15) * s;
    splatFlake(cx, cy, r, r * (0.94 + rnd() * 0.14), 0.24 + rnd() * 0.16, true);
  }
  // Layer 2: ~95 mid-ground soft round snowballs
  for (let k = 0; k < 95; k++) {
    const r = (3.8 + rnd() * 4.2) * s;
    splatFlake(rnd() * w, rnd() * h, r, r * (0.88 + rnd() * 0.24), 0.54 + rnd() * 0.28, false);
  }
  // Layer 3: ~28 tiny softly-blurred 6-point snowflake crystals
  for (let k = 0; k < 28; k++) {
    const rad = (7.5 + rnd() * 8.5) * s;
    splatCrystal((0.05 + rnd() * 0.90) * w, (0.05 + rnd() * 0.90) * h, rad, rnd() * Math.PI, 0.46 + rnd() * 0.28);
  }
  // Layer 4: ~200 fine crisp snow grains
  for (let k = 0; k < 200; k++) {
    const r = (1.5 + rnd() * 1.6) * s;
    splatFlake(rnd() * w, rnd() * h, r, r * (0.9 + rnd() * 0.2), 0.40 + rnd() * 0.30, false);
  }
}

function applyPrismRainbowLeak(rgb, w, h) {
  // Authentic sunlit crystal-prism pastel rainbow flare confined softly to upper-left corner
  const invW = 1 / w;
  const invH = 1 / h;
  for (let y = 0; y < h; y++) {
    const ny = y * invH;
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      const nx = x * invW;
      const u = nx * 0.72 + ny * 0.69;
      const v = (nx - 0.15) * 0.69 - (ny - 0.12) * 0.72;
      const beamEnv = Math.exp(-Math.pow((u - 0.28) / 0.155, 2)) * Math.exp(-Math.pow(v / 0.52, 2));
      const entryBloom = Math.exp(-((nx * nx + ny * ny) / 0.16)) * 0.34;

      // Faint secondary warm optical lens-flare bokeh orb diagonally along sun axis
      const odx = nx - 0.38;
      const ody = ny - 0.27;
      const orbR = Math.sqrt(odx * odx + ody * ody) / 0.072;
      const orbGlow = orbR < 1.25 ? Math.exp(-orbR * orbR * 2.2) * (0.055 + 0.04 * Math.exp(-Math.pow((orbR - 0.85) / 0.15, 2))) : 0;

      if (beamEnv < 0.01 && entryBloom < 0.008 && orbGlow < 0.005) continue;

      // Pastel spectral bands (coral-rose -> warm peach -> pale mint -> airy sky-blue -> soft lavender)
      const g1 = Math.exp(-Math.pow((u - 0.165) / 0.056, 2));
      const g2 = Math.exp(-Math.pow((u - 0.222) / 0.056, 2));
      const g3 = Math.exp(-Math.pow((u - 0.280) / 0.054, 2));
      const g4 = Math.exp(-Math.pow((u - 0.338) / 0.056, 2));
      const g5 = Math.exp(-Math.pow((u - 0.394) / 0.054, 2));

      const rBand = g1 * 1.00 + g2 * 1.00 + g3 * 0.68 + g4 * 0.56 + g5 * 0.78 + 0.18;
      const gBand = g1 * 0.50 + g2 * 0.80 + g3 * 0.96 + g4 * 0.84 + g5 * 0.62 + 0.16;
      const bBand = g1 * 0.56 + g2 * 0.46 + g3 * 0.88 + g4 * 1.00 + g5 * 1.00 + 0.15;

      const strength = 0.42 * beamEnv;
      const lr = 255 * Math.min(1, rBand * strength + entryBloom * 1.00 + orbGlow * 1.00);
      const lg = 255 * Math.min(1, gBand * strength + entryBloom * 0.85 + orbGlow * 0.82);
      const lb = 255 * Math.min(1, bBand * strength + entryBloom * 0.66 + orbGlow * 0.68);
      const idx = row + x * 3;
      // Subtle headroom only inside intense prism band so pastel colors still glow on bright cream walls
      if (beamEnv > 0.05) {
        const hm = 1.0 - 0.13 * beamEnv;
        rgb[idx] = (rgb[idx] * hm) | 0;
        rgb[idx + 1] = (rgb[idx + 1] * hm) | 0;
        rgb[idx + 2] = (rgb[idx + 2] * hm) | 0;
      }
      screenPixel(rgb, idx, lr, lg, lb);
    }
  }
}

function applyKiraSparkleLens(rgb, w, h) {
  // Razor-thin KiraKira+ diffraction needle filter preserving skin & shadow brightness
  const s = w / 768;
  const total = w * h;
  // Softly roll off ONLY very bright background highlights (>205) so crisp star needles remain visible on bright walls
  for (let p = 0, i = 0; p < total; p++, i += 3) {
    const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
    if (r > 205 || g > 205 || b > 205) {
      if (r > 205) rgb[i] = (205 + (r - 205) * 0.56) | 0;
      if (g > 205) rgb[i + 1] = (205 + (g - 205) * 0.56) | 0;
      if (b > 205) rgb[i + 2] = (205 + (b - 205) * 0.56) | 0;
    }
  }

  const cells = 16;
  const cw = w / cells;
  const ch = h / cells;
  const candidates = [];
  const step = Math.max(2, Math.round(3 * s));

  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      let bestScore = -1, bestLum = 0, bestX = 0, bestY = 0;
      const sx0 = Math.max(step, Math.floor(cx * cw));
      const sx1 = Math.min(w - 1 - step, Math.floor((cx + 1) * cw));
      const sy0 = Math.max(step, Math.floor(cy * ch));
      const sy1 = Math.min(h - 1 - step, Math.floor((cy + 1) * ch));
      for (let y = sy0; y < sy1; y += 3) {
        const row = y * w * 3;
        const rowU = (y - step) * w * 3;
        const rowD = (y + step) * w * 3;
        for (let x = sx0; x < sx1; x += 3) {
          const i = row + x * 3;
          const lum = 0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2];
          if (lum < 110) continue;
          const iR = row + (x + step) * 3;
          const iL = row + (x - step) * 3;
          const iU = rowU + x * 3;
          const iD = rowD + x * 3;
          const lumR = 0.299 * rgb[iR] + 0.587 * rgb[iR + 1] + 0.114 * rgb[iR + 2];
          const lumL = 0.299 * rgb[iL] + 0.587 * rgb[iL + 1] + 0.114 * rgb[iL + 2];
          const lumU = 0.299 * rgb[iU] + 0.587 * rgb[iU + 1] + 0.114 * rgb[iU + 2];
          const lumD = 0.299 * rgb[iD] + 0.587 * rgb[iD + 1] + 0.114 * rgb[iD + 2];
          const contrast = Math.max(
            Math.abs(lum - lumR),
            Math.abs(lum - lumD),
            Math.max(0, lum - 0.25 * (lumR + lumL + lumU + lumD)) * 1.5
          );
          const score = contrast * (0.45 + 0.55 * (lum / 255));
          if (score > bestScore) { bestScore = score; bestLum = lum; bestX = x; bestY = y; }
        }
      }
      if (bestScore > 10 && bestLum > 115) {
        candidates.push({ x: bestX, y: bestY, lum: bestLum, score: bestScore });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const rnd = makeFxRng(0x9a1c1e55);
  const glints = [];
  if (candidates.length >= 4) {
    // Normal lit photo: up to 4 hero diamond glints (well spaced) + up to 12 crisp micro-twinkles
    const heroDist2 = (86 * s) * (86 * s);
    for (const c of candidates) {
      let ok = true;
      for (const p of glints) {
        const dx = c.x - p.x, dy = c.y - p.y;
        if (dx * dx + dy * dy < heroDist2) { ok = false; break; }
      }
      if (ok) {
        glints.push({ x: c.x, y: c.y, inten: Math.min(1.0, 0.80 + (c.lum - 115) / 280), hero: true });
        if (glints.length >= 4) break;
      }
    }
    const minDist2 = (52 * s) * (52 * s);
    for (const c of candidates) {
      let ok = true;
      for (const p of glints) {
        const dx = c.x - p.x, dy = c.y - p.y;
        if (dx * dx + dy * dy < minDist2) { ok = false; break; }
      }
      if (ok) {
        glints.push({ x: c.x, y: c.y, inten: Math.min(0.95, 0.65 + (c.lum - 115) / 340), hero: false });
        if (glints.length >= 16) break;
      }
    }
  } else {
    // Dark/black frame fallback: delicate starry micro-twinkles + 3 refined diamond glints
    glints.push({ x: 0.16 * w, y: 0.20 * h, inten: 0.88, hero: true });
    glints.push({ x: 0.84 * w, y: 0.22 * h, inten: 0.82, hero: true });
    glints.push({ x: 0.76 * w, y: 0.78 * h, inten: 0.78, hero: true });
    for (let k = 0; k < 14; k++) {
      glints.push({
        x: (0.08 + rnd() * 0.84) * w,
        y: (0.08 + rnd() * 0.84) * h,
        inten: 0.55 + rnd() * 0.38,
        hero: false,
      });
    }
  }

  for (let idx = 0; idx < glints.length; idx++) {
    const g = glints[idx];
    const cx = g.x;
    const cy = g.y;
    const isHero = g.hero;
    const armLen = (isHero ? (38 + (idx % 2) * 10) : (12 + rnd() * 10)) * s * g.inten;
    const ang0 = isHero ? (idx % 2 === 0 ? 0.7854 : 0.0) : (rnd() * 1.57);
    const cA = Math.cos(ang0), sA = Math.sin(ang0);
    const cB = Math.cos(ang0 + 0.7854), sB = Math.sin(ang0 + 0.7854);
    const box = Math.ceil(armLen + 6 * s);
    const x0 = Math.max(0, Math.floor(cx - box));
    const x1 = Math.min(w - 1, Math.ceil(cx + box));
    const y0 = Math.max(0, Math.floor(cy - box));
    const y1 = Math.min(h - 1, Math.ceil(cy + box));
    const thick = (isHero ? 0.96 : 0.70) * s;
    const coreR = (isHero ? 3.8 : 2.3) * s;
    const haloR = (isHero ? 15.0 : 8.0) * s;

    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > armLen) continue;
        const u = Math.abs(dx * cA + dy * sA);
        const v = Math.abs(-dx * sA + dy * cA);
        const ray1 = Math.exp(-v / thick) * Math.pow(Math.max(0, 1 - u / armLen), 1.65);
        const ray2 = Math.exp(-u / thick) * Math.pow(Math.max(0, 1 - v / armLen), 1.65);

        let sec = 0;
        if (isHero) {
          const u2 = Math.abs(dx * cB + dy * sB);
          const v2 = Math.abs(-dx * sB + dy * cB);
          const subLen = armLen * 0.48;
          sec = (Math.exp(-v2 / (thick * 0.85)) * Math.pow(Math.max(0, 1 - u2 / subLen), 2.1)
               + Math.exp(-u2 / (thick * 0.85)) * Math.pow(Math.max(0, 1 - v2 / subLen), 2.1)) * 0.28;
        }

        const core = Math.exp(-(r * r) / (coreR * coreR));
        const halo = Math.exp(-(r * r) / (haloR * haloR)) * (isHero ? 0.22 : 0.14);
        const pow = g.inten * Math.min(1, core * 0.98 + (ray1 + ray2) * 0.96 + sec + halo);
        if (pow < 0.012) continue;

        const tip = Math.min(1, r / armLen);
        const sr = 255 * pow;
        const sg = 250 * pow * (1.0 - 0.04 * tip);
        const sb = 236 * pow * (1.0 - 0.06 * tip + 0.12 * Math.sin(r * 0.25));
        screenPixel(rgb, (row + x) * 3, sr, sg, sb);
      }
    }
  }
}

function normalizeAsciiPunct(str) {
  return String(str || "")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizePromptForFlux(text, aggressive = false) {
  let out = normalizeAsciiPunct(text);
  out = out
    .replace(/\b(superman|spider-?man|batman|iron\s*man|ultraman|power\s*rangers|avengers|deadpool|wolverine|joker|pikachu|doraemon|naruto|goku)\b/gi, "heroic blue and red outfit")
    .replace(/\b(skin-?tight|skintight|tight-?fitting|tight|tights|spandex|bodysuit|latex|catsuit|fitted|form-?fitting)\b/gi, "matte casual fabric")
    .replace(/\bsuperhero\s+costume\b/gi, "heroic royal-blue jacket and red cloth cape outfit")
    .replace(/\bsuperhero\b/gi, "heroic")
    .replace(/\bcostume\b/gi, "themed outfit")
    .replace(/\s+/g, " ")
    .trim();
  if (aggressive) {
    out = out
      .replace(/\b(police|officer|traffic|uniform|helmet|shopee|grab|logo|badge|brand|suit|armor|weapon|gun|sword|knife|blood|gore|mask|sexy|lingerie|bikini|nude|naked)\b/gi, (m) => {
        if (/helmet/i.test(m)) return "riding cap";
        if (/police|officer/i.test(m)) return "attendant";
        if (/suit|armor/i.test(m)) return "outerwear jacket";
        if (/mask/i.test(m)) return "accessory";
        if (/logo|badge|brand/i.test(m)) return "clean trim";
        return "casual jacket";
      })
      .replace(/\s+/g, " ")
      .trim() + " Everyday safe candid smartphone portrait.";
  }
  return out;
}

async function translateCustomLookPromptToEn(env, rawText) {
  const clean = String(rawText || "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (!clean) return "";
  const sys =
    "You are an expert photo-editing prompt engineer for FLUX.2 image-to-image editing. Convert the user's request (in Vietnamese with or without accents, or English) into ONE concrete English image-editing prompt (35-65 words) for an authentic candid smartphone photo. Rules: 1) Always start with: 'Keep the exact same person, face shape, eyes, nose, lips, skin tone, natural skin texture, and expression from input_image_0 completely untouched.' 2) Describe exact clothing, accessories, hairstyle, makeup, props, or background using loose matte realistic streetwear/outerwear and natural ambient lighting (NEVER use tight, fitted, tights, spandex, bodysuit, superhero, costume, plastic, airbrushed, CGI, glossy, or 'ultra-photorealistic' words; do NOT cover the face with a mask/helmet unless explicitly requested). 3) NEVER use trademarked/copyrighted character or brand names (such as Superman, Spider-Man, Batman, Iron Man, Pikachu, Doraemon) — instead describe loose outerwear colors generically without emblems (e.g. for 'siêu nhân' use 'a matte royal-blue bomber jacket with yellow trim and a red cloth cape draped over the shoulders'). 4) Keep the original background and pose unless asked to change them. Output ONLY plain ASCII English text.";
  for (const k of availableKeys("groq", env && env.GROQ_API_KEY)) {
    try {
      const model = (env && env.GROQ_MODEL) || "openai/gpt-oss-120b";
      const bodyObj = { model, messages: [{ role: "system", content: sys }, { role: "user", content: clean }], temperature: 0.25 };
      if (/gpt-oss/i.test(model)) { bodyObj.reasoning_effort = "low"; bodyObj.max_completion_tokens = 420; }
      else bodyObj.max_tokens = 160;
      const r = await fetch(`${(env && env.GROQ_BASE_URL) || "https://api.groq.com/openai/v1"}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
        body: JSON.stringify(bodyObj),
        signal: AbortSignal.timeout(4000),
      });
      if (!r.ok) { if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(k); continue; }
      const j = await r.json();
      const out = normalizeAsciiPunct(String(j?.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/gi, ""));
      if (out && out.length >= 12 && !/[^\x00-\x7F]/.test(out)) return sanitizePromptForFlux(out, false);
    } catch (_) {}
  }
  if (env && env.NVIDIA_API_KEY) {
    try {
      const nv = await nvidiaTextWriter(env, sys, clean, 160, 0.25);
      const out = normalizeAsciiPunct(String(nv?.text || "").replace(/<think>[\s\S]*?<\/think>/gi, ""));
      if (out && out.length >= 12 && !/[^\x00-\x7F]/.test(out)) return sanitizePromptForFlux(out, false);
    } catch (_) {}
  }
  for (const k of availableKeys("gemini", env && env.GEMINI_API_KEY)) {
    const g = await geminiGenerateCaption(env, sys, clean, null, null, k, 160, true, 0.25);
    const out = normalizeAsciiPunct(g?.text || "");
    if (out && out.length >= 12) return sanitizePromptForFlux(out, false);
  }
  if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
    try {
      const res = await runCfTextChatPooled(env, [{ role: "system", content: sys }, { role: "user", content: clean }], 160, 0.25);
      const out = normalizeAsciiPunct(res?.text || "");
      if (out && out.length >= 12) return sanitizePromptForFlux(out, false);
    } catch (_) {}
  }
  return sanitizePromptForFlux(clean, false);
}

function detectAiRequest(dataNode, rawBodyText) {
  let rawFilterId = firstNonEmptyString([
    dataNode?.filterId,
    dataNode?.filter_id,
    dataNode?.camera_filter_id,
    dataNode?.cameraFilterId,
    dataNode?.look_id,
    dataNode?.lookId,
    dataNode?.uid,
    dataNode?.id,
    dataNode?.filter?.id,
    dataNode?.filter?.uid,
    dataNode?.effectId,
    dataNode?.effect_id,
  ]);
  const ui = dataNode?.user_input || dataNode?.userInput;
  const rawUserPrompt = firstNonEmptyString([
    typeof ui === "string" ? ui : "",
    ui?.prompt,
    ui?.text,
    ui?.description,
    ui?.look,
    dataNode?.customPrompt,
    dataNode?.custom_prompt,
    dataNode?.prompt,
    dataNode?.filterPrompt,
    dataNode?.filter_prompt,
    dataNode?.filter?.prompt,
    dataNode?.filter?.custom_prompt,
    dataNode?.filter?.user_input,
    dataNode?.filter?.name,
    dataNode?.filter?.title,
    dataNode?.text,
    dataNode?.description,
  ]);

  if (!rawFilterId && rawBodyText) {
    for (const id of Object.keys(AI_FILTER_PROMPTS)) {
      if (rawBodyText.includes('"' + id + '"')) {
        rawFilterId = id;
        break;
      }
    }
  }

  const faceLockForId = (fid) =>
    STYLIZED_AI_IDS.has(fid)
      ? FACE_LOCK_STYLIZED
      : SWAP_BG_AI_IDS.has(fid)
      ? FACE_LOCK_SWAP_BG
      : FACE_LOCK_KEEP_BG;

  if (rawFilterId && AI_FILTER_PROMPTS[rawFilterId]) {
    return { filterId: rawFilterId, prompt: faceLockForId(rawFilterId) + AI_FILTER_PROMPTS[rawFilterId], source: "catalog" };
  }
  if (rawUserPrompt && AI_FILTER_PROMPTS[rawUserPrompt]) {
    return { filterId: rawUserPrompt, prompt: faceLockForId(rawUserPrompt) + AI_FILTER_PROMPTS[rawUserPrompt], source: "catalog_prompt_id" };
  }
  if (rawUserPrompt) {
    return {
      filterId: rawFilterId || "custom_prompt",
      rawUserPrompt: rawUserPrompt.slice(0, 500),
      prompt: FACE_LOCK_KEEP_BG + "Apply this natural candid camera edit: " + rawUserPrompt.slice(0, 500),
      source: "custom_prompt",
    };
  }
  if (rawFilterId) {
    return {
      filterId: rawFilterId,
      prompt: FACE_LOCK_KEEP_BG + 'Apply a natural candid "' + rawFilterId.replace(/[_-]+/g, " ") + '" camera filter effect.',
      source: "dynamic_filter_id",
    };
  }
  return null;
}

function sniffImageFormat(bytes) {
  if (bytes && bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mimeType: "image/png", ext: "png" };
  }
  if (bytes && bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return { mimeType: "image/jpeg", ext: "jpg" };
  }
  if (
    bytes &&
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mimeType: "image/webp", ext: "webp" };
  }
  return { mimeType: "image/jpeg", ext: "jpg" };
}

// Decode ảnh (JPEG qua jpeg-js, PNG qua decodePngToRgb) -> { w, h, rgb } ở KÍCH THƯỚC GỐC.
// Thay thế weserv.nl (đã chặn Cloudflare Worker). Không gọi service ngoài -> chạy ổn định 24/7.
async function decodeImageBytesToRgb(bytes) {
  if (!bytes || bytes.length < 4) return null;
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    try { return await decodePngToRgb(bytes); } catch (_) { return null; }
  }
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    try {
      const raw = jpeg.decode(bytes, { useTArray: true, maxMemoryUsageInMB: 512 });
      if (!raw || !raw.data) return null;
      const { width: w, height: h, data } = raw;
      const rgb = new Uint8Array(w * h * 3);
      for (let p = 0, i4 = 0, i3 = 0; p < w * h; p++, i4 += 4, i3 += 3) {
        rgb[i3] = data[i4]; rgb[i3 + 1] = data[i4 + 1]; rgb[i3 + 2] = data[i4 + 2];
      }
      return { w, h, rgb };
    } catch (_) { return null; }
  }
  // WEBP hoặc khác: thử cf.image chuyển sang jpeg rồi decode (cf.image nhận được qua Response wrap).
  return null;
}

// Lấy RGB ở kích thước GỐC từ bytes hoặc URL (fetch về rồi decode). Không dùng weserv.
async function getSourceRgb(imgBytes, sourceUrl, authHeader) {
  if (imgBytes && imgBytes.length > 0) {
    const d = await decodeImageBytesToRgb(imgBytes);
    if (d) return d;
  }
  if (sourceUrl && sourceUrl.startsWith("http")) {
    try {
      const hdrs = { "User-Agent": "Locket/1.0" };
      if (authHeader) hdrs["Authorization"] = authHeader;
      const r = await fetch(sourceUrl, { headers: hdrs });
      if (r.ok) {
        const b = new Uint8Array(await r.arrayBuffer());
        const d = await decodeImageBytesToRgb(b);
        if (d) return d;
      }
    } catch (_) {}
  }
  return null;
}

// Decode ảnh đầu vào -> { w, h, rgb } ở KÍCH THƯỚC GỐC (drawCoverRgb sẽ scale khi composite).
// Dùng jpeg-js/decodePngToRgb trong worker (KHÔNG weserv.nl, đã bị chặn Cloudflare).
async function decodeInputToRgb512(imgBytes, sourceUrl, origin, tempId, targetSize = SIZE, authHeader = "") {
  return await getSourceRgb(imgBytes, sourceUrl, authHeader);
}

// Chuẩn bị ảnh cho AI (FLUX/segmentation): JPEG đã nén ~768px. Encode từ RGB bằng cf.image hoặc jpeg-js.
async function prepareAiInputImage(imgBytes, sourceUrl, origin, tempId, authHeader = "") {
  // Nếu đã là JPEG hợp lệ (<1.5MB) thì dùng thẳng — FLUX nhận trực tiếp.
  if (imgBytes && imgBytes.length > 0 && imgBytes[0] === 0xff && imgBytes[1] === 0xd8 && imgBytes.length < 1500000) {
    return { bytes: imgBytes, mimeType: "image/jpeg" };
  }
  // Decode -> RGB rồi encode JPEG 768 bằng jpeg-js (chắc chắn, không service ngoài).
  const d = await getSourceRgb(imgBytes, sourceUrl, authHeader);
  if (d && d.rgb) {
    // scale về 1024x1024 cover bằng drawCoverRgb (bilinear)
    const aiSize = 1024;
    const out = new Uint8Array(aiSize * aiSize * 3);
    drawCoverRgb(out, d.rgb, d.w, d.h, [0, 0, aiSize, aiSize], aiSize);
    try {
      const rgba = new Uint8Array(aiSize * aiSize * 4);
      for (let p = 0, i3 = 0, i4 = 0; p < aiSize * aiSize; p++, i3 += 3, i4 += 4) {
        rgba[i4] = out[i3]; rgba[i4 + 1] = out[i3 + 1]; rgba[i4 + 2] = out[i3 + 2]; rgba[i4 + 3] = 255;
      }
      const enc = jpeg.encode({ data: rgba, width: aiSize, height: aiSize }, 93);
      return { bytes: new Uint8Array(enc.data), mimeType: "image/jpeg" };
    } catch (_) {}
  }
  // Fallback: ảnh gốc nếu có
  if (imgBytes && imgBytes.length > 0) {
    return { bytes: imgBytes, mimeType: sniffImageFormat(imgBytes).mimeType };
  }
  return null;
}

const REF_IMAGE_AI_IDS = new Set(["stk_mu_ngu_khoc", "stk_tai_tho"]);

async function runCloudflareFluxEdit(env, promptText, inputImg, refImg, modelOverride = null, sizeOverride = null, opts = null) {
  const aiModel = modelOverride || (env && env.AI_MODEL) || "@cf/black-forest-labs/flux-2-klein-4b";
  const outSize = sizeOverride || parseInt((env && env.AI_OUTPUT_SIZE) || "768", 10) || 768;

  const form = buildFluxForm(promptText, outSize, inputImg, refImg, opts);
  const formResp = new Response(form);
  let aiResp;
  try {
    aiResp = await env.AI.run(aiModel, {
      multipart: {
        body: formResp.body,
        contentType: formResp.headers.get("content-type"),
      },
    });
  } catch (runErr) {
    // Hết quota 4006 -> đánh dấu để các request sau fallback thẳng sang Gemini.
    if (isQuotaOrCapacityError(runErr)) markCfAiQuotaHit();
    throw runErr;
  }

  let bytes = null;
  if (typeof aiResp?.image === "string") {
    bytes = base64ToUint8Array(aiResp.image);
  } else if (typeof aiResp?.result?.image === "string") {
    bytes = base64ToUint8Array(aiResp.result.image);
  } else if (aiResp instanceof Uint8Array) {
    bytes = aiResp;
  } else if (aiResp instanceof ArrayBuffer) {
    bytes = new Uint8Array(aiResp);
  } else if (aiResp && typeof aiResp.getReader === "function") {
    bytes = new Uint8Array(await new Response(aiResp).arrayBuffer());
  } else {
    throw new Error("Unexpected Workers AI response: " + JSON.stringify(aiResp).slice(0, 200));
  }

  return { bytes, ...sniffImageFormat(bytes), aiModel, outSize };
}

// Xây FormData cho FLUX (prompt + size + steps + input image + ref image). Dùng chung binding & REST.
function buildFluxForm(promptText, outSize, inputImg, refImg, opts = null) {
  const form = new FormData();
  if (opts && opts.steps) form.append("steps", String(opts.steps));
  // strength thấp = GIỮ ảnh gốc (mặt + góc) nhiều hơn, chỉ thêm trang phục/hiệu ứng. Cao = vẽ lại nhiều.
  if (opts && opts.strength != null) form.append("strength", String(opts.strength));
  if (opts && opts.guidance != null) form.append("guidance", String(opts.guidance));
  form.append("prompt", promptText);
  form.append("width", String(outSize));
  form.append("height", String(outSize));
  if (inputImg && inputImg.bytes && inputImg.bytes.length > 0) {
    const ext = inputImg.mimeType === "image/png" ? "input.png" : "input.jpg";
    form.append("input_image_0", new Blob([inputImg.bytes], { type: inputImg.mimeType }), ext);
  }
  if (refImg && refImg.bytes && refImg.bytes.length > 0) {
    const rExt = refImg.mimeType === "image/png" ? "ref.png" : "ref.jpg";
    form.append("input_image_1", new Blob([refImg.bytes], { type: refImg.mimeType }), rExt);
  }
  return form;
}

// Gọi FLUX qua REST API trên 1 tài khoản Cloudflare KHÁC (acct:token), đã verify chạy multipart.
// Trả { bytes, mimeType, aiModel, outSize } hoặc ném lỗi (để pool thử account kế tiếp).
async function cfRestFluxRun(acct, token, aiModel, promptText, inputImg, refImg, outSize, opts = null) {
  const form = buildFluxForm(promptText, outSize, inputImg, refImg, opts);
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${aiModel}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await r.json();
    if (j && j.success && j.result && typeof j.result.image === "string") {
      const bytes = base64ToUint8Array(j.result.image);
      return { bytes, ...sniffImageFormat(bytes), aiModel, outSize };
    }
    const errMsg = (j && j.errors && j.errors[0] && j.errors[0].message) || "cf_rest_no_image";
    const code = j && j.errors && j.errors[0] && j.errors[0].code;
    const e = new Error(errMsg);
    e.cfCode = code;
    throw e;
  }
  // Nhị phân (ảnh trực tiếp)
  const buf = new Uint8Array(await r.arrayBuffer());
  if (r.ok && buf.length > 500) return { bytes: buf, ...sniffImageFormat(buf), aiModel, outSize };
  throw new Error(`cf_rest_http_${r.status}`);
}

// Parse danh sách tài khoản Cloudflare phụ từ secret CF_AI_ACCOUNTS: "acct:token" cách nhau phẩy/xuống dòng.
function parseCfAccounts(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf(":");
      if (i < 0) return null;
      return { acct: pair.slice(0, i), token: pair.slice(i + 1) };
    })
    .filter((x) => x && x.acct && x.token);
}

// Chạy FLUX với CHIẾN LƯỢC POOL: binding account chính trước; nếu 4006/lỗi -> xoay vòng các
// tài khoản Cloudflare phụ qua REST (mỗi account +10k neurons/ngày, cùng model, cùng chất lượng).
// Trả { bytes, mimeType, aiModel, outSize, via } hoặc ném lỗi nếu TẤT CẢ đều fail.
async function runFluxPooled(env, promptText, inputImg, refImg, modelOverride = null, sizeOverride = null, opts = null) {
  const aiModel = modelOverride || (env && env.AI_MODEL) || "@cf/black-forest-labs/flux-2-klein-4b";
  const outSize = sizeOverride || parseInt((env && env.AI_OUTPUT_SIZE) || "768", 10) || 768;
  let lastErr = null;

  // 1) Account chính qua binding (nếu còn quota)
  if (env && env.AI && !cfAiQuotaActive()) {
    try {
      const out = await runCloudflareFluxEdit(env, promptText, inputImg, refImg, aiModel, outSize, opts);
      return { ...out, via: "binding" };
    } catch (e) {
      lastErr = e;
      // runCloudflareFluxEdit đã markCfAiQuotaHit nếu 4006
    }
  }

  // 2) Xoay vòng tài khoản phụ qua REST. "cfpool" là tên pool để round-robin & cooldown theo token.
  const accounts = parseCfAccounts(env && env.CF_AI_ACCOUNTS);
  if (accounts.length > 0) {
    // Xoay điểm bắt đầu để trải tải; bỏ qua token đang cooldown (đã 4006).
    const start = (KEY_CURSOR.get("cfpool") || 0) % accounts.length;
    KEY_CURSOR.set("cfpool", start + 1);
    const ordered = accounts.slice(start).concat(accounts.slice(0, start));
    const fresh = ordered.filter((a) => keyAvailable(a.token));
    const tryList = fresh.length > 0 ? fresh : ordered;
    const maxTries = opts && opts.maxPoolTries ? opts.maxPoolTries : tryList.length;
    for (const a of tryList.slice(0, maxTries)) {
      try {
        const out = await cfRestFluxRun(a.acct, a.token, aiModel, promptText, inputImg, refImg, outSize, opts);
        return { ...out, via: "cf_rest:" + a.acct.slice(0, 8) };
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || e || "");
        if (e.cfCode === 3030 || /flagged|choose another prompt|no such model|not found/i.test(msg)) {
          throw e;
        }
        if (isQuotaOrCapacityError(e)) {
          benchKey(a.token);
        } else {
          benchKey(a.token, 5);
        }
      }
    }
  }

  throw lastErr || new Error("no_flux_backend");
}

function isCaptionRefusal(txt) {
  const low = String(txt || "").trim().toLowerCase();
  if (!low || low.length < 4) return true;
  return /xin l[ỗo]i|kh[ôo]ng th[ểe]|t[ôo]i l[àa] (m[ộo]t )?(tr[ợo] l[ýy]|ai|m[ôo] h[ìi]nh)|m[ôo] t[ảa] (b[ứu]c )?[ảa]nh|cannot|i'?m sorry|as an ai|describe the image|unable to|no image/i.test(low);
}

async function cfRestVisionChat(acct, token, modelId, messages, maxTokens = 256, temperature = 0.75) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, max_tokens: maxTokens, temperature }),
    signal: AbortSignal.timeout(7000),
  });
  let j = null;
  try {
    j = await r.json();
  } catch (_) {}
  if (r.ok && j && j.success !== false) {
    const rawVal = j?.result?.response ?? j?.result?.choices?.[0]?.message?.content ?? "";
    const text = (typeof rawVal === "string" ? rawVal : JSON.stringify(rawVal))
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim();
    return text;
  }
  const errMsg = (j && j.errors && j.errors[0] && j.errors[0].message) || `cf_vision_http_${r.status}`;
  const e = new Error(errMsg);
  e.httpStatus = r.status;
  e.cfCode = j?.errors?.[0]?.code;
  throw e;
}

function normalizeMessagesForCfVision(messages) {
  if (!Array.isArray(messages)) return [];
  const sysTexts = [];
  const rest = [];
  for (const m of messages) {
    if (!m) continue;
    if (m.role === "system") {
      if (typeof m.content === "string" && m.content.trim()) sysTexts.push(m.content.trim());
    } else {
      rest.push(m);
    }
  }
  const sysPrefix = sysTexts.join("\n").trim();
  if (!sysPrefix) return rest;

  const out = [];
  let merged = false;
  for (const m of rest) {
    if (!merged && m.role === "user") {
      merged = true;
      if (typeof m.content === "string") {
        out.push({ role: "user", content: `${sysPrefix}\n\n${m.content}` });
      } else if (Array.isArray(m.content)) {
        let patched = false;
        const nextParts = m.content.map((p) => {
          if (!patched && p && p.type === "text") {
            patched = true;
            return { type: "text", text: `${sysPrefix}\n\n${p.text || ""}` };
          }
          return p;
        });
        if (!patched) nextParts.unshift({ type: "text", text: sysPrefix });
        out.push({ role: "user", content: nextParts });
      } else {
        out.push(m);
      }
    } else {
      out.push(m);
    }
  }
  return out;
}

async function runVisionChatPooled(env, messages, maxTokens = 256, temperature = 0.75, models = null) {
  const modelList =
    Array.isArray(models) && models.length > 0
      ? models
      : ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
  const normMsgs = normalizeMessagesForCfVision(messages);
  let lastErr = null;
  const accounts = parseCfAccounts(env && env.CF_AI_ACCOUNTS);

  for (const modelId of modelList) {
    if ((SKIP_CF_MODELS.get(modelId) || 0) > Date.now()) continue;
    const shortModel = modelId.split("/").pop();

    // 1) Main binding
    if (env && env.AI && !cfAiQuotaActive()) {
      try {
        const r = await env.AI.run(modelId, { messages: normMsgs, max_tokens: maxTokens, temperature });
        const rawVal = r?.response ?? r?.result?.response ?? r?.choices?.[0]?.message?.content ?? "";
        const text = (typeof rawVal === "string" ? rawVal : JSON.stringify(rawVal))
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .trim();
        if (text && !isCaptionRefusal(text)) {
          return { text, source: "cf_binding:" + shortModel, err: null };
        }
      } catch (e) {
        lastErr = String(e?.message || e);
        if (isQuotaOrCapacityError(e)) markCfAiQuotaHit();
        else if (/no such model|not found|does not exist|invalid/i.test(lastErr)) {
          SKIP_CF_MODELS.set(modelId, Date.now() + 30 * 60 * 1000);
          continue;
        }
      }
    }

    // 2) 18-account CF REST pool
    if (accounts.length > 0) {
      const start = (KEY_CURSOR.get("cfvision") || 0) % accounts.length;
      KEY_CURSOR.set("cfvision", start + 1);
      const ordered = accounts.slice(start).concat(accounts.slice(0, start));
      const fresh = ordered.filter((a) => keyAvailable(a.token));
      const tryList = (fresh.length > 0 ? fresh : ordered).slice(0, 4);
      for (const a of tryList) {
        try {
          const text = await cfRestVisionChat(a.acct, a.token, modelId, normMsgs, maxTokens, temperature);
          if (text && !isCaptionRefusal(text)) {
            return { text, source: "cf_rest:" + a.acct.slice(0, 8) + ":" + shortModel, err: null };
          }
        } catch (e) {
          lastErr = String(e?.message || e);
          if (isQuotaOrCapacityError(e) || e.httpStatus === 429) {
            benchKey(a.token);
          } else {
            if (
              e.httpStatus === 400 ||
              e.httpStatus === 404 ||
              /no such model|not found|does not exist|invalid/i.test(lastErr)
            ) {
              SKIP_CF_MODELS.set(modelId, Date.now() + 30 * 60 * 1000);
            }
            break;
          }
        }
      }
    }
  }

  return { text: null, source: null, err: lastErr };
}

async function runCfTextChatPooled(env, messages, maxTokens = 120, temperature = 0.75) {
  return runVisionChatPooled(env, messages, maxTokens, temperature, [
    "@cf/meta/llama-4-scout-17b-16e-instruct",
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
  ]);
}

async function describeImageWithVision(env, prepBytes, prepMime) {
  if (!prepBytes || prepBytes.length === 0) return { desc: "", source: null };
  const obsSys =
    "You are a precise visual observer. Describe the photo factually in 2 concise English sentences: who or what is visible, clothing/accessories, facial expression, action, key objects, setting/background, and lighting/mood. Be specific and accurate. No speculation or filler.";
  const obsUser = "Describe this photo factually in 2 short sentences.";
  const userContent = [
    { type: "image_url", image_url: { url: `data:${prepMime || "image/jpeg"};base64,${uint8ToBase64(prepBytes)}` } },
    { type: "text", text: obsUser },
  ];

  // 1) Cloudflare Vision pool (18 accounts + main binding)
  if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
    const res = await runVisionChatPooled(
      env,
      [
        { role: "system", content: obsSys },
        { role: "user", content: userContent },
      ],
      95,
      0.2,
      ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"]
    );
    const clean = String(res.text || "").replace(/\s+/g, " ").trim();
    if (clean && !isCaptionRefusal(clean)) {
      return { desc: clean.slice(0, 320), source: res.source || "cf_vision" };
    }
  }

  // 2) NVIDIA NIM Vision fallback
  for (const k of availableKeys("nvidia", env && env.NVIDIA_API_KEY)) {
    try {
      const nvModel = (env && env.NVIDIA_MODEL) || "meta/llama-3.2-11b-vision-instruct";
      const base = (env && env.NVIDIA_BASE_URL) || "https://integrate.api.nvidia.com/v1";
      const r = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
        body: JSON.stringify({
          model: nvModel,
          messages: [
            { role: "system", content: obsSys },
            { role: "user", content: userContent },
          ],
          max_tokens: 95,
          temperature: 0.2,
        }),
      });
      if (!r.ok) {
        if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(k);
        continue;
      }
      const j = await r.json();
      const txt = String(j?.choices?.[0]?.message?.content || "").replace(/\s+/g, " ").trim();
      if (txt && !isCaptionRefusal(txt)) {
        return { desc: txt.slice(0, 320), source: "nvidia:" + nvModel };
      }
    } catch (_) {}
  }

  // 3) Gemini Vision fallback
  for (const k of availableKeys("gemini", env && env.GEMINI_API_KEY)) {
    const g = await geminiGenerateCaption(env, obsSys, obsUser, prepBytes, prepMime, k, 95, true);
    const clean = String(g.text || "").replace(/\s+/g, " ").trim();
    if (clean && !isCaptionRefusal(clean)) {
      return { desc: clean.slice(0, 320), source: "gemini:" + (g.model || (env && env.GEMINI_TEXT_MODEL) || "gemini-4-hydrogen") };
    }
  }

  return { desc: "", source: null };
}

function buildLocketFilterResponse(outUrl) {
  const jsonResp = {
    result: {
      outputUrl: outUrl,
      output_url: outUrl,
      url: outUrl,
      imageUrl: outUrl,
      image_url: outUrl,
      filteredImageUrl: outUrl,
      filtered_image_url: outUrl,
      status: 200,
      is_gold: true,
      is_locked: false,
      requires_gold: false,
      unlocked: true,
      out_of_credits: false,
      ai_credits: 999999,
      data: {
        outputUrl: outUrl,
        output_url: outUrl,
        url: outUrl,
        imageUrl: outUrl,
        image_url: outUrl,
        filteredImageUrl: outUrl,
        filtered_image_url: outUrl,
      },
    },
    outputUrl: outUrl,
    output_url: outUrl,
    url: outUrl,
    imageUrl: outUrl,
    status: 200,
  };
  return new Response(JSON.stringify(jsonResp), {
    status: 200,
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
  });
}

async function encodeCanvasToImage(canvasRgb, origin, tempId, canvasSize = SIZE) {
  // Encode RGB -> JPEG bằng jpeg-js (không weserv, không BMP round-trip). Nhỏ & nhanh.
  let finalBytes = null;
  let mimeType = "image/jpeg";
  let ext = "jpg";
  try {
    const rgba = new Uint8Array(canvasSize * canvasSize * 4);
    for (let p = 0, i3 = 0, i4 = 0; p < canvasSize * canvasSize; p++, i3 += 3, i4 += 4) {
      rgba[i4] = canvasRgb[i3]; rgba[i4 + 1] = canvasRgb[i3 + 1]; rgba[i4 + 2] = canvasRgb[i3 + 2]; rgba[i4 + 3] = 255;
    }
    const enc = jpeg.encode({ data: rgba, width: canvasSize, height: canvasSize }, 95);
    if (enc && enc.data && enc.data.length > 1000) finalBytes = new Uint8Array(enc.data);
  } catch (_) {}

  if (!finalBytes) {
    finalBytes = encodeFastPngRgb(canvasSize, canvasSize, canvasRgb);
    mimeType = "image/png";
    ext = "png";
  }

  return { bytes: finalBytes, mimeType, ext };
}

const WEEKDAY_DEPTH_PREFIX = {
  weekday_depth: "weekday",
  weekday_depth_en: "weekday_en",
  weekday_depth_zh: "weekday_zh",
  weekday_depth_tw: "weekday_tw",
  weekday_depth_ja: "weekday_ja",
  weekday_depth_ko: "weekday_ko",
  weekday_depth_es: "weekday_es",
  weekday_depth_fr: "weekday_fr",
  weekday_depth_de: "weekday_de",
};

function detectSpecialFilterId(dataNode, rawBodyText) {
  const candidates = [
    dataNode?.filterId,
    dataNode?.filter_id,
    dataNode?.uid,
    dataNode?.id,
    dataNode?.filter?.id,
    dataNode?.filter?.uid,
    dataNode?.prompt,
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (WEEKDAY_DEPTH_PREFIX[t]) return t;
    }
  }
  if (rawBodyText) {
    for (const id of Object.keys(WEEKDAY_DEPTH_PREFIX)) {
      if (rawBodyText.includes(`"${id}"`)) return id;
    }
  }
  return null;
}

function getVietnamWeekdayIndex() {
  return new Date(Date.now() + 7 * 3600 * 1000).getUTCDay();
}

function buildSmoothedForegroundMask(maskRgb, fillHoles = true) {
  const total = SIZE * SIZE;
  const lum = new Uint8Array(total);
  for (let p = 0, i3 = 0; p < total; p++, i3 += 3) {
    lum[p] = ((maskRgb[i3] * 77 + maskRgb[i3 + 1] * 150 + maskRgb[i3 + 2] * 29) >> 8) & 0xff;
  }
  if (fillHoles) {
    // Separable dilation barrier (r=4) so hairline cracks cannot leak exterior background inside
    const radB = 4;
    const tmpB = new Uint8Array(total);
    const barrier = new Uint8Array(total);
    for (let y = 0; y < SIZE; y++) {
      const row = y * SIZE;
      for (let x = 0; x < SIZE; x++) {
        const x0 = x > radB ? x - radB : 0;
        const x1 = x + radB < SIZE ? x + radB : SIZE - 1;
        let mx = 0;
        for (let xx = x0; xx <= x1; xx++) {
          const v = lum[row + xx];
          if (v > mx) mx = v;
        }
        tmpB[row + x] = mx;
      }
    }
    for (let y = 0; y < SIZE; y++) {
      const y0 = y > radB ? y - radB : 0;
      const y1 = y + radB < SIZE ? y + radB : SIZE - 1;
      for (let x = 0; x < SIZE; x++) {
        let mx = 0;
        for (let yy = y0; yy <= y1; yy++) {
          const v = tmpB[yy * SIZE + x];
          if (v > mx) mx = v;
        }
        barrier[y * SIZE + x] = mx;
      }
    }
    // Exterior-border BFS flood-fill: fill enclosed holes inside foreground (e.g. face/eyes/bangs) to 255
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;
    const pushIfBg = (idx) => {
      if (!visited[idx] && barrier[idx] < 115) {
        visited[idx] = 1;
        queue[tail++] = idx;
      }
    };
    for (let x = 0; x < SIZE; x++) pushIfBg(x);
    for (let y = 0; y < SIZE; y++) {
      pushIfBg(y * SIZE);
      pushIfBg(y * SIZE + (SIZE - 1));
    }
    const cornerW = Math.floor(SIZE * 0.12);
    const lastRow = (SIZE - 1) * SIZE;
    for (let x = 0; x < cornerW; x++) pushIfBg(lastRow + x);
    for (let x = SIZE - cornerW; x < SIZE; x++) pushIfBg(lastRow + x);

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % SIZE;
      const y = (idx / SIZE) | 0;
      if (x > 0) pushIfBg(idx - 1);
      if (x < SIZE - 1) pushIfBg(idx + 1);
      if (y > 0) pushIfBg(idx - SIZE);
      if (y < SIZE - 1) pushIfBg(idx + SIZE);
    }
    for (let p = 0; p < total; p++) {
      if (!visited[p]) lum[p] = 255;
    }
  }
  const alpha = new Uint8Array(total);
  let fgPixels = 0;
  for (let y = 0; y < SIZE; y++) {
    const y0 = y > 0 ? y - 1 : 0;
    const y1 = y < SIZE - 1 ? y + 1 : SIZE - 1;
    for (let x = 0; x < SIZE; x++) {
      const x0 = x > 0 ? x - 1 : 0;
      const x1 = x < SIZE - 1 ? x + 1 : SIZE - 1;
      let sum = 0;
      let cnt = 0;
      for (let yy = y0; yy <= y1; yy++) {
        const row = yy * SIZE;
        for (let xx = x0; xx <= x1; xx++) {
          sum += lum[row + xx];
          cnt++;
        }
      }
      const avg = sum / cnt;
      let a = 0;
      if (avg >= 170) a = 255;
      else if (avg > 90) a = (((avg - 90) * 255) / 80) | 0;
      alpha[y * SIZE + x] = a;
      if (a >= 128) fgPixels++;
    }
  }
  return { alpha, fgRatio: fgPixels / total };
}

function compositeForegroundWithAlpha(fgRgb, bgCanvasRgb, maskAlpha, maskSize = SIZE, dstSize = WD_SIZE, soften = false) {
  let srcAlpha = maskAlpha;
  if (soften) {
    const soft = new Uint8Array(maskSize * maskSize);
    for (let y = 0; y < maskSize; y++) {
      const y0 = y > 0 ? y - 1 : 0;
      const y1 = y < maskSize - 1 ? y + 1 : maskSize - 1;
      for (let x = 0; x < maskSize; x++) {
        const x0 = x > 0 ? x - 1 : 0;
        const x1 = x < maskSize - 1 ? x + 1 : maskSize - 1;
        let sum = 0;
        let cnt = 0;
        for (let yy = y0; yy <= y1; yy++) {
          const row = yy * maskSize;
          for (let xx = x0; xx <= x1; xx++) {
            sum += maskAlpha[row + xx];
            cnt++;
          }
        }
        soft[y * maskSize + x] = (sum / cnt) | 0;
      }
    }
    srcAlpha = soft;
  }
  const scaleM = (maskSize - 1) / (dstSize - 1);
  for (let y = 0; y < dstSize; y++) {
    const myF = y * scaleM;
    const my0 = myF | 0;
    const my1 = my0 < maskSize - 1 ? my0 + 1 : maskSize - 1;
    const fy = myF - my0;
    const row0 = my0 * maskSize;
    const row1 = my1 * maskSize;
    for (let x = 0; x < dstSize; x++) {
      const mxF = x * scaleM;
      const mx0 = mxF | 0;
      const mx1 = mx0 < maskSize - 1 ? mx0 + 1 : maskSize - 1;
      const fx = mxF - mx0;
      const a00 = srcAlpha[row0 + mx0];
      const a10 = srcAlpha[row0 + mx1];
      const a01 = srcAlpha[row1 + mx0];
      const a11 = srcAlpha[row1 + mx1];
      const a = ((a00 * (1 - fx) + a10 * fx) * (1 - fy) + (a01 * (1 - fx) + a11 * fx) * fy + 0.5) | 0;
      if (a === 0) continue;
      const i3 = (y * dstSize + x) * 3;
      if (a >= 255) {
        bgCanvasRgb[i3] = fgRgb[i3];
        bgCanvasRgb[i3 + 1] = fgRgb[i3 + 1];
        bgCanvasRgb[i3 + 2] = fgRgb[i3 + 2];
      } else {
        const invA = 255 - a;
        bgCanvasRgb[i3] = (fgRgb[i3] * a + bgCanvasRgb[i3] * invA + 128) >> 8;
        bgCanvasRgb[i3 + 1] = (fgRgb[i3 + 1] * a + bgCanvasRgb[i3 + 1] * invA + 128) >> 8;
        bgCanvasRgb[i3 + 2] = (fgRgb[i3 + 2] * a + bgCanvasRgb[i3 + 2] * invA + 128) >> 8;
      }
    }
  }
}

async function runForegroundSegMask(env, preparedMaskInput, origin, tempId) {
  if (!preparedMaskInput || !preparedMaskInput.bytes) return null;
  let maskOut = null;
  let segModelUsed = null;
  if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
    try {
      const seg = await runFluxPooled(env, FOREGROUND_SEG_PROMPT, preparedMaskInput, null, null, SIZE);
      if (seg && seg.bytes) { maskOut = seg; segModelUsed = seg.via; }
    } catch (_) {}
  }
  if (!maskOut || !maskOut.bytes) {
    const fb = await fallbackEditImage(env, FOREGROUND_SEG_PROMPT, preparedMaskInput.bytes, preparedMaskInput.mimeType);
    if (fb && fb.bytes) { maskOut = fb; segModelUsed = fb.model; }
  }
  if (!maskOut || !maskOut.bytes) return { segModelUsed, alpha: null, fgRatio: 0 };
  const decodedMask = await decodeInputToRgb512(maskOut.bytes, null, origin, `msk_${tempId}`, SIZE);
  if (decodedMask?.rgb && decodedMask.w === SIZE && decodedMask.h === SIZE) {
    const { alpha, fgRatio } = buildSmoothedForegroundMask(decodedMask.rgb, true);
    return { segModelUsed, alpha, fgRatio: Number(fgRatio.toFixed(3)) };
  }
  return { segModelUsed, alpha: null, fgRatio: 0 };
}

function uint8ToBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// =========================================================================
// FALLBACK MIỄN PHÍ KHI CLOUDFLARE WORKERS AI HẾT QUOTA (lỗi 4006 - 10.000 neurons/ngày)
// - Dùng Google Gemini API (GEMINI_API_KEY lưu qua `wrangler secret`, KHÔNG hardcode vào git)
// - Caption: gemini-*-flash (text + vision). Tách nền/sửa ảnh: model image (vd gemini-*-flash-image)
// =========================================================================

// Nhận diện lỗi hết quota / giới hạn của Cloudflare Workers AI để chủ động fallback.
function isQuotaOrCapacityError(err) {
  const msg = String((err && (err.message || err.toString())) || err || "").toLowerCase();
  return (
    msg.includes("4006") ||
    msg.includes("daily free allocation") ||
    msg.includes("used up") ||
    msg.includes("out of neurons") ||
    msg.includes("capacity temporarily exceeded") ||
    msg.includes("3040") || // account-level rate limit
    (msg.includes("quota") && msg.includes("exceed")) ||
    msg.includes("too many requests") ||
    msg.includes("429")
  );
}

function cfAiQuotaActive() {
  return Date.now() < CF_AI_QUOTA_HIT_UNTIL;
}

function markCfAiQuotaHit() {
  // Nghỉ 20 phút rồi thử lại Cloudflare AI (quota reset ~07:00 nhưng vẫn thử định kỳ phòng khi tạm thời).
  CF_AI_QUOTA_HIT_UNTIL = Date.now() + 20 * 60 * 1000;
}

// -------------------------------------------------------------------------
// HỒ KEY XOAY VÒNG (multi-key rotation) — mỗi secret có thể chứa NHIỀU key
// (phân tách bằng dấu phẩy / xuống dòng / khoảng trắng). Khi 1 key hết quota/429,
// key đó bị "ngồi ghế dự bị" (cooldown) và worker tự nhảy sang key kế tiếp.
// Nhờ bạn có nhiều Gmail -> nhiều key -> nhân quota lên nhiều lần, chia sẻ bạn bè thoải mái.
// -------------------------------------------------------------------------
const KEY_COOLDOWN = new Map(); // key -> timestamp hết cooldown
const KEY_CURSOR = new Map();   // tên provider -> chỉ số round-robin

function parseKeyList(raw) {
  if (!raw) return [];
  return String(raw).split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}

function benchKey(key, mins = 20) {
  if (key) KEY_COOLDOWN.set(key, Date.now() + mins * 60 * 1000);
}

function keyAvailable(key) {
  return (KEY_COOLDOWN.get(key) || 0) < Date.now();
}

// Trả danh sách key KHẢ DỤNG của provider, sắp theo round-robin để trải đều tải.
// Nếu tất cả đang cooldown thì vẫn trả hết (thử lại còn hơn bỏ cuộc).
function availableKeys(providerName, raw) {
  const all = parseKeyList(raw);
  if (all.length <= 1) return all;
  const start = (KEY_CURSOR.get(providerName) || 0) % all.length;
  KEY_CURSOR.set(providerName, start + 1);
  const rotated = all.slice(start).concat(all.slice(0, start));
  const fresh = rotated.filter(keyAvailable);
  return fresh.length > 0 ? fresh : rotated;
}

// Gọi Gemini generateContent cho CAPTION (text, có kèm ảnh nếu có). Smart cascade: gemini-4-hydrogen -> 3.5-flash-lite -> 3.1-flash-lite -> flash-lite-latest.
async function geminiGenerateCaption(env, systemPrompt, userText, imgBytes, imgMime, key, maxTokens = 120, rawMode = false, temperature = 0.8) {
  if (!key) return { text: null, model: null, err: "no_gemini_key" };
  const defaultModels = ["gemini-4-hydrogen", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"];
  const envModel = env && env.GEMINI_TEXT_MODEL ? String(env.GEMINI_TEXT_MODEL).trim() : "";
  const models = envModel ? [envModel, ...defaultModels.filter((m) => m !== envModel)] : defaultModels;

  const parts = [{ text: userText }];
  if (imgBytes && imgBytes.length > 0) {
    parts.push({ inline_data: { mime_type: imgMime || "image/jpeg", data: uint8ToBase64(imgBytes) } });
  }
  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts }],
    generationConfig: { temperature, maxOutputTokens: Math.max(maxTokens, 160) },
  };

  let lastErr = null;
  for (const model of models) {
    if ((SKIP_GEMINI_MODELS.get(model) || 0) > Date.now()) continue;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(model === "gemini-4-hydrogen" ? 2800 : 6000),
      });
      if (!r.ok) {
        lastErr = `gemini_http_${r.status}: ${(await r.text()).slice(0, 160)}`;
        if (r.status === 429 || r.status === 403) {
          benchKey(key, 20);
          return { text: null, model, err: lastErr };
        }
        if (r.status === 404) {
          SKIP_GEMINI_MODELS.set(model, Date.now() + 30 * 60 * 1000);
          continue;
        }
        if (r.status === 503) {
          SKIP_GEMINI_MODELS.set(model, Date.now() + 3 * 60 * 1000);
          continue;
        }
        continue;
      }
      const j = await r.json();
      const cand = j && j.candidates && j.candidates[0];
      const txtParts = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts : [];
      let txt = txtParts.map((p) => (typeof p.text === "string" ? p.text : "")).join(" ").trim();
      if (rawMode) {
        if (txt) return { text: txt, model, err: null };
        lastErr = "gemini_empty";
        continue;
      }
      txt = txt.replace(/^["'“”]+|["'“”]+$/g, "").split(/\r?\n/)[0].trim();
      if (txt && txt.length >= 3) return { text: txt.slice(0, 120), model, err: null };
      lastErr = "gemini_empty";
    } catch (e) {
      lastErr = String((e && e.message) || e);
      SKIP_GEMINI_MODELS.set(model, Date.now() + 2 * 60 * 1000);
    }
  }
  return { text: null, model: null, err: lastErr || "gemini_unavailable" };
}

// Gọi 1 endpoint CHAT tương thích OpenAI cho CAPTION (dùng chung cho NVIDIA NIM & Groq).
// withImage=true thì gửi ảnh kiểu OpenAI image_url (model vision mới nhận); false thì text thuần.
async function openAiChatCaption({ base, key, model, provider, systemPrompt, userText, imgBytes, imgMime, withImage, extra }) {
  if (!key) return { text: null, err: `no_${provider}_key` };
  let userMsg = userText;
  if (withImage && imgBytes && imgBytes.length > 0) {
    userMsg = [
      { type: "text", text: userText },
      { type: "image_url", image_url: { url: `data:${imgMime || "image/jpeg"};base64,${uint8ToBase64(imgBytes)}` } },
    ];
  }
  const payload = Object.assign({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg },
    ],
    // Model reasoning (gpt-oss...) tiêu tốn token để "nghĩ" -> nới max_tokens để content không rỗng.
    max_tokens: 256,
    temperature: 0.85,
  }, extra || {});
  if (extra && extra.max_completion_tokens) delete payload.max_tokens;
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(key); // hết quota/credit -> nghỉ
      return { text: null, err: `${provider}_http_${r.status}: ${(await r.text()).slice(0, 160)}` };
    }
    const j = await r.json();
    const msg = j?.choices?.[0]?.message || {};
    // Lấy content; nếu rỗng (model reasoning) thì thử các field phụ.
    let txt = String(msg.content || msg.reasoning_content || "").trim();
    // Bỏ phần <think>...</think> nếu model nhét vào content.
    txt = txt.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    // Lấy dòng có nội dung thật (ưu tiên dòng chứa TIN NÓNG/KHẨN CẤP, nếu không thì dòng cuối không rỗng).
    const lines = txt.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    let pick = lines.find((l) => /tin nóng|khẩn cấp|trực tiếp/i.test(l)) || lines[lines.length - 1] || "";
    pick = pick.replace(/^["'“”*]+|["'“”*]+$/g, "").trim();
    if (pick && pick.length >= 3) return { text: pick.slice(0, 120), err: null };
    return { text: null, err: `${provider}_empty` };
  } catch (e) {
    return { text: null, err: String(e && e.message || e) };
  }
}

// NVIDIA NIM (nhiều model free credits, có vision). Model đổi qua env NVIDIA_MODEL.
async function nvidiaGenerateCaption(env, systemPrompt, userText, imgBytes, imgMime, key) {
  return openAiChatCaption({
    base: (env && env.NVIDIA_BASE_URL) || "https://integrate.api.nvidia.com/v1",
    key,
    model: (env && env.NVIDIA_MODEL) || "meta/llama-3.2-11b-vision-instruct",
    provider: "nvidia",
    systemPrompt, userText, imgBytes, imgMime,
    withImage: true,
  });
}

// NVIDIA NIM text writer (mặc định meta/llama-3.3-70b-instruct — 70B viết tiếng Việt hài hước & tự nhiên hơn hẳn)
async function nvidiaTextWriter(env, systemPrompt, userText, maxTokens = 140, temperature = 0.85) {
  const model = (env && env.NVIDIA_TEXT_MODEL) || "meta/llama-3.3-70b-instruct";
  const base = (env && env.NVIDIA_BASE_URL) || "https://integrate.api.nvidia.com/v1";
  let lastErr = null;
  for (const k of availableKeys("nvidia", env && env.NVIDIA_API_KEY)) {
    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userText },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) {
        if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(k);
        lastErr = `nvidia_http_${r.status}`;
        continue;
      }
      const j = await r.json();
      const txt = String(j?.choices?.[0]?.message?.content || "").trim();
      if (txt) return { text: txt, source: "nvidia:" + model, err: null };
      lastErr = "nvidia_empty";
    } catch (e) {
      lastErr = String(e?.message || e);
    }
  }
  return { text: null, source: null, err: lastErr };
}

// Groq (rất nhanh, free tier rộng). Mặc định openai/gpt-oss-120b (đã kiểm chứng viết tiếng Việt tốt).
async function groqGenerateCaption(env, systemPrompt, userText, imgBytes, imgMime, key) {
  const model = (env && env.GROQ_MODEL) || "openai/gpt-oss-120b";
  // Model gpt-oss là reasoning -> đặt reasoning_effort thấp để "nghĩ" ngắn, trả caption nhanh & không rỗng.
  const extra = /gpt-oss/i.test(model)
    ? { reasoning_effort: "low", max_completion_tokens: 320, temperature: 0.8 }
    : { max_tokens: 180, temperature: 0.8 };
  return openAiChatCaption({
    base: (env && env.GROQ_BASE_URL) || "https://api.groq.com/openai/v1",
    key,
    model,
    provider: "groq",
    systemPrompt, userText, imgBytes, imgMime,
    withImage: /vision|llava|scout|maverick|vl/i.test(model), // chỉ gửi ảnh nếu model hỗ trợ
    extra,
  });
}

// ===== PROVIDER ẢNH DỰ PHÒNG (tách nền weekday_depth + AI 3D) khi Cloudflare FLUX hết quota =====

// Gemini image (model Nano Banana) — LƯU Ý: thường là bản TRẢ PHÍ, free tier không chạy.
// Giữ lại như một lựa chọn, chỉ dùng khi có key; nhận key tham số để xoay vòng.
async function geminiEditImage(env, promptText, imgBytes, imgMime, key) {
  if (!key) return null;
  const model = (env && env.GEMINI_IMAGE_MODEL) || "gemini-flash-image-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const parts = [{ text: promptText }];
  if (imgBytes && imgBytes.length > 0) {
    parts.push({ inline_data: { mime_type: imgMime || "image/jpeg", data: uint8ToBase64(imgBytes) } });
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
    });
    if (!r.ok) { if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(key); return null; }
    const j = await r.json();
    const outParts = j?.candidates?.[0]?.content?.parts || [];
    for (const p of outParts) {
      const inl = p.inline_data || p.inlineData;
      if (inl && inl.data) { const bytes = base64ToUint8Array(inl.data); return { bytes, ...sniffImageFormat(bytes) }; }
    }
    return null;
  } catch (_) {
    return null;
  }
}

// NVIDIA NIM image EDITING (img2img, giữ mặt) qua endpoint hosted genai.
// Host ảnh của NVIDIA là ai.api.nvidia.com/v1/genai/{model} (khác endpoint chat integrate.*).
// CHỈ chạy khi đặt env NVIDIA_IMAGE_MODEL (vd black-forest-labs/flux.2-klein-4b) — tắt mặc định
// vì cấu trúc truyền ảnh img2img cần test với key thật trước khi tin dùng. Trả {bytes,mimeType} hoặc null.
// Upload 1 ảnh lên NVCF asset store, trả assetId (uuid) hoặc null.
// NVIDIA genai i2i BẮT BUỘC tham chiếu ảnh qua asset_id — không nhận base64/URL inline.
async function nvcfUploadAsset(key, imgBytes, mime) {
  const base = "https://api.nvcf.nvidia.com/v2/nvcf/assets";
  try {
    const a = await fetch(base, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ contentType: mime || "image/jpeg", description: "locket-input" }),
    });
    if (!a.ok) return null;
    const aj = await a.json();
    if (!aj.uploadUrl || !aj.assetId) return null;
    const put = await fetch(aj.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mime || "image/jpeg", "x-amz-meta-nvcf-asset-description": "locket-input" },
      body: imgBytes,
    });
    if (!put.ok) return null;
    return aj.assetId;
  } catch (_) {
    return null;
  }
}

// NVIDIA NIM FLUX image (ai.api.nvidia.com/v1/genai/{model}). Verified qua test thật:
// - t2i (không ảnh): body {prompt, steps, width, height} -> 200, {artifacts:[{base64}]}.
// - i2i (có ảnh): PHẢI upload asset trước rồi image="data:<mime>;asset_id,<id>" + header NVCF-INPUT-ASSET-REFERENCES.
// - flux.2-klein-4b: steps<=4, KHÔNG field "mode". flux-3-image-klein: cần mode "t2i"/"i2i".
// Đặt NVIDIA_IMAGE_MODE="flux3" nếu model họ flux-3 (thêm mode). Mặc định schema flux.2 (steps<=4).
async function nvidiaEditImage(env, promptText, imgBytes, imgMime, key) {
  const model = env && env.NVIDIA_IMAGE_MODEL;
  if (!model || !key) return null;
  const base = (env && env.NVIDIA_IMAGE_BASE_URL) || "https://ai.api.nvidia.com/v1/genai";
  const isFlux3 = /flux3|flux-3/i.test((env && env.NVIDIA_IMAGE_MODE) || model);
  const maxSteps = isFlux3 ? 30 : 4;
  const out = parseInt((env && env.AI_OUTPUT_SIZE) || "768", 10) || 768;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${key}`, Accept: "application/json" };
  const body = { prompt: String(promptText).slice(0, 1800), steps: maxSteps, width: out, height: out };

  // img2img: upload asset trước
  if (imgBytes && imgBytes.length > 0) {
    const mime = imgMime || "image/jpeg";
    const assetId = await nvcfUploadAsset(key, imgBytes, mime);
    if (assetId) {
      body.image = `data:${mime};asset_id,${assetId}`;
      headers["NVCF-INPUT-ASSET-REFERENCES"] = assetId;
      if (isFlux3) body.mode = "i2i";
    } else {
      // Không upload được asset -> không làm i2i được; bỏ (để nơi gọi suy giảm duyên dáng).
      return null;
    }
  } else if (isFlux3) {
    body.mode = "t2i";
  }

  try {
    const r = await fetch(`${base}/${model}`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!r.ok) { if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(key); return null; }
    const j = await r.json();
    const art = j?.artifacts?.[0];
    const data = (art && art.base64) || j?.image || j?.data?.[0]?.b64_json;
    if (data) { const bytes = base64ToUint8Array(data); return { bytes, ...sniffImageFormat(bytes) }; }
    return null;
  } catch (_) {
    return null;
  }
}

// Thử lần lượt các provider ảnh dự phòng (NVIDIA img2img -> Gemini image), mỗi provider xoay nhiều key.
// Trả { bytes, mimeType, model } hoặc null. Dùng chung cho tách nền mask & AI 3D filter.
async function fallbackEditImage(env, promptText, imgBytes, imgMime) {
  // 1) NVIDIA NIM (chỉ khi đã bật NVIDIA_IMAGE_MODEL)
  if (env && env.NVIDIA_IMAGE_MODEL) {
    for (const k of availableKeys("nvidia_img", env.NVIDIA_API_KEY)) {
      const out = await nvidiaEditImage(env, promptText, imgBytes, imgMime, k);
      if (out && out.bytes) return { ...out, model: "nvidia:" + env.NVIDIA_IMAGE_MODEL };
    }
  }
  // 2) Gemini image (nếu có key — thường trả phí)
  for (const k of availableKeys("gemini_img", env && env.GEMINI_API_KEY)) {
    const out = await geminiEditImage(env, promptText, imgBytes, imgMime, k);
    if (out && out.bytes) return { ...out, model: "gemini:" + ((env && env.GEMINI_IMAGE_MODEL) || "gemini-flash-image-latest") };
  }
  return null;
}

// Chuẩn hóa schema Locket (số dạng {value, @type} của protobuf) về JSON schema thường.
function normalizeSchema(node) {
  if (node == null || typeof node !== "object") return node;
  if (node["@type"] && node.value !== undefined) return node.value; // {value, @type} -> value
  if (Array.isArray(node)) return node.map(normalizeSchema);
  const out = {};
  for (const k of Object.keys(node)) out[k] = normalizeSchema(node[k]);
  return out;
}

function buildQuoteBankCatalog(visionDesc = "") {
  const tokens = String(visionDesc || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  const halfRecent = RECENT_QUOTE_IDS.slice(Math.floor(RECENT_QUOTE_IDS.length / 2));
  const lines = [];
  for (const [cat, list] of Object.entries(VERIFIED_QUOTE_BANK)) {
    let fresh = list.filter((q) => !RECENT_QUOTE_IDS.includes(q.id));
    if (fresh.length < 25) {
      const relaxed = list.filter((q) => !halfRecent.includes(q.id));
      fresh = relaxed.length >= 20 ? relaxed : list;
    }
    const pool = shuffleInPlace([...fresh]);
    const scored = pool.map((q) => {
      const hay = `${q.tags} ${q.attribution}`.toLowerCase();
      let hits = 0;
      for (const t of tokens) {
        if (hay.includes(t)) hits++;
      }
      return { q, score: hits * 1.1 + rand01() * 6.0 };
    });
    scored.sort((a, b) => b.score - a.score);
    const splitAt = Math.max(12, Math.floor(scored.length * 0.4));
    const topBand = shuffleInPlace(scored.slice(0, splitAt)).slice(0, 12);
    const restBand = shuffleInPlace(scored.slice(splitAt)).slice(0, 12);
    const picked = shuffleInPlace([...topBand, ...restBand]).map((x) => `${x.q.id}(${x.q.tags})`);
    lines.push(`${cat}: ${picked.join("; ")}`);
  }
  return lines.join("\n");
}

function pickVerifiedQuotesFromMap(idMap, seedText = "", catsOverride = null, skipRemember = false) {
  const cats =
    Array.isArray(catsOverride) && catsOverride.length > 0
      ? [...catsOverride]
      : ["pop_music", "greek_philosophy", "famous_modern_figures", "film_and_tv", "athlete"];
  const pairs = [];
  const usedAttrs = new Set();
  const recentSet = new Set(RECENT_QUOTE_IDS);
  const halfRecentSet = new Set(RECENT_QUOTE_IDS.slice(Math.floor(RECENT_QUOTE_IDS.length / 2)));
  let matchedCount = 0;

  for (const cat of cats) {
    const list = VERIFIED_QUOTE_BANK[cat] || VERIFIED_QUOTE_BANK.pop_music;
    const reqId = idMap && typeof idMap[cat] === "string" ? idMap[cat].trim() : "";
    let item = list.find((it) => it.id === reqId);
    const attrLow = item ? String(item.attribution || "").toLowerCase().trim() : "";
    if (item && !recentSet.has(item.id) && !usedAttrs.has(attrLow)) {
      matchedCount++;
    } else {
      let fresh = list.filter((it) => !recentSet.has(it.id) && !usedAttrs.has(String(it.attribution || "").toLowerCase().trim()));
      if (fresh.length === 0) {
        fresh = list.filter((it) => !halfRecentSet.has(it.id) && !usedAttrs.has(String(it.attribution || "").toLowerCase().trim()));
      }
      if (fresh.length === 0) {
        fresh = list.filter((it) => !recentSet.has(it.id));
      }
      const pool = fresh.length > 0 ? fresh : list;
      item = pool[Math.floor(rand01() * pool.length)];
    }
    usedAttrs.add(String(item.attribution || "").toLowerCase().trim());
    pairs.push({
      id: item.id,
      entry: {
        quote: item.quote,
        category: cat,
        attribution: item.attribution,
      },
    });
  }

  shuffleInPlace(pairs);
  const selectedIds = pairs.map((p) => p.id);
  const quotes = pairs.map((p) => p.entry);
  if (!skipRemember) rememberQuoteIds(selectedIds);
  return { data: { quotes }, matchedCount, selectedIds };
}

function cleanWikiText(s) {
  return String(s || "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/''+/g, "")
    .replace(/\s+/g, " ")
    .replace(/^["'“”*:\-\s]+|["'“”*\s]+$/g, "")
    .trim();
}

function parseViWikiquoteWikitext(wt) {
  const lines = String(wt || "").split(/\r?\n/);
  const items = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const qMatch = lines[i].match(/^\*([^*\n].*)/);
    if (!qMatch) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j >= lines.length) continue;
    const aMatch = lines[j].match(/^\*\*([^*\n].*)/);
    if (!aMatch) continue;
    const quote = cleanWikiText(qMatch[1]);
    const author = cleanWikiText(aMatch[1]);
    if (
      quote.length >= 16 &&
      quote.length <= 135 &&
      author.length >= 2 &&
      author.length <= 45 &&
      !/http|\[\[|thiếu nguồn|chưa rõ/i.test(quote + " " + author) &&
      !/[\u4e00-\u9fff]/.test(quote)
    ) {
      items.push({
        key: "wk:" + author + ":" + quote.slice(0, 32),
        text: quote,
        author,
        lang: "vi",
        src: "vi_wikiquote",
      });
    }
    i = j;
  }
  return items;
}

async function fetchExternalRealQuotesBatch() {
  const djSkip = Math.floor(Math.random() * 1410);
  const topic = VI_WIKIQUOTE_TOPICS[Math.floor(Math.random() * VI_WIKIQUOTE_TOPICS.length)];

  const djPromise = (async () => {
    const r = await fetch(`https://dummyjson.com/quotes?limit=40&skip=${djSkip}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return [];
    const j = await r.json();
    const list = Array.isArray(j?.quotes) ? j.quotes : [];
    const out = [];
    for (const q of list) {
      const text = String(q?.quote || "").replace(/\s+/g, " ").trim();
      const author = String(q?.author || "").replace(/\s+/g, " ").trim();
      if (
        text.length >= 20 &&
        text.length <= 145 &&
        author.length >= 2 &&
        !/unknown|anonymous/i.test(author)
      ) {
        out.push({ key: "dj:" + q.id, text, author, lang: "en", src: "dummyjson" });
      }
    }
    return out;
  })();

  const zqPromise = (async () => {
    const r = await fetch("https://zenquotes.io/api/quotes", {
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return [];
    const list = await r.json();
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const x of list) {
      const text = String(x?.q || "").replace(/\s+/g, " ").trim();
      const author = String(x?.a || "").replace(/\s+/g, " ").trim();
      if (
        text.length >= 20 &&
        text.length <= 145 &&
        author.length >= 2 &&
        !/zenquotes|unknown|anonymous/i.test(text + " " + author)
      ) {
        out.push({ key: "zq:" + author + ":" + text.slice(0, 32), text, author, lang: "en", src: "zenquotes" });
      }
    }
    return out;
  })();

  const wkPromise = (async () => {
    const u = `https://vi.wikiquote.org/w/api.php?action=parse&page=${encodeURIComponent(topic)}&prop=wikitext&format=json`;
    const r = await fetch(u, {
      headers: { "User-Agent": "LocketTommmStudio/1.0 (https://locket-tommm-studio.khoinguyennguyen85.workers.dev)" },
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return [];
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("json")) return [];
    const j = await r.json();
    const wt = j?.parse?.wikitext?.["*"] || "";
    return shuffleInPlace(parseViWikiquoteWikitext(wt)).slice(0, 20);
  })();

  const results = await Promise.allSettled([djPromise, zqPromise, wkPromise]);
  const incoming = [];
  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      incoming.push(...res.value);
    }
  }
  if (incoming.length > 0) {
    const seen = new Set();
    const merged = [];
    for (const item of [...incoming, ...LIVE_QUOTE_CACHE.items]) {
      if (!item || !item.key || seen.has(item.key)) continue;
      seen.add(item.key);
      merged.push(item);
      if (merged.length >= 300) break;
    }
    LIVE_QUOTE_CACHE.items = merged;
    LIVE_QUOTE_CACHE.fetchedAt = Date.now();
  }
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand01() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function getLiveRealQuoteCandidates(count = 16) {
  let unused = LIVE_QUOTE_CACHE.items.filter((it) => !RECENT_LIVE_QUOTES.includes(it.key));
  if (unused.length < 18 || Date.now() - LIVE_QUOTE_CACHE.fetchedAt > 15 * 60 * 1000) {
    await fetchExternalRealQuotesBatch();
    unused = LIVE_QUOTE_CACHE.items.filter((it) => !RECENT_LIVE_QUOTES.includes(it.key));
  }
  const pool = unused.length > 0 ? unused : LIVE_QUOTE_CACHE.items;
  if (pool.length === 0) return [];

  const viPool = shuffleInPlace(pool.filter((it) => it.lang === "vi"));
  const enPool = shuffleInPlace(pool.filter((it) => it.lang === "en"));
  const selected = [];
  for (const item of viPool.slice(0, 6)) selected.push(item);
  for (const item of enPool) {
    if (selected.length >= count) break;
    selected.push(item);
  }
  if (selected.length < count) {
    for (const item of viPool.slice(6)) {
      if (selected.length >= count) break;
      selected.push(item);
    }
  }
  return shuffleInPlace(selected);
}

async function fetchAndPickLiveRealQuotes(env, visionDesc) {
  if (!visionDesc) return { quotes: [], via: null };
  const candidates = await getLiveRealQuoteCandidates(16);
  if (candidates.length === 0) return { quotes: [], via: null };

  const numbered = candidates
    .map((c, i) => `${i}: [${c.lang.toUpperCase()}] "${c.text}" — ${c.author}`)
    .join("\n");
  const sys =
    'Bạn là người tuyển chọn và dịch trích dẫn có thật sang tiếng Việt. Từ danh sách CÁC CÂU TRÍCH DẪN CÓ THẬT dưới đây, hãy chọn ĐÚNG 2 câu có chỉ số `idx` khác nhau phù hợp nhất với bức ảnh.\n' +
    "- Tuyệt đối KHÔNG bịa câu mới, KHÔNG bịa tên tác giả.\n" +
    "- Nếu câu được đánh dấu [EN], hãy dịch sát nghĩa sang tiếng Việt thật tự nhiên, mượt mà, giàu chất thơ (đúng chính tả 100%, không dịch cứng word-by-word, không pha chữ Hán).\n" +
    "- Nếu câu được đánh dấu [VI], giữ nguyên văn tiếng Việt gốc.\n" +
    'Chỉ trả về duy nhất 1 JSON hợp lệ: {"picks":[{"idx":2,"vi":"..."},{"idx":9,"vi":"..."}]}. Không thêm chữ nào khác.';
  const usr = `Mô tả bức ảnh: ${visionDesc}\n\nDanh sách trích dẫn thật:\n${numbered}`;

  const parseLivePicks = (rawText) => {
    if (!rawText) return [];
    let txt = String(rawText).trim().replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
    const a = txt.indexOf("{");
    const b = txt.lastIndexOf("}");
    if (a >= 0 && b > a) txt = txt.slice(a, b + 1);
    let j = null;
    try {
      j = JSON.parse(txt);
    } catch (_) {
      return [];
    }
    const picks = Array.isArray(j?.picks) ? j.picks : [];
    const seenIdx = new Set();
    const out = [];
    for (const p of picks) {
      if (out.length >= 2) break;
      const idx = Number(p?.idx);
      if (!Number.isInteger(idx) || idx < 0 || idx >= candidates.length || seenIdx.has(idx)) continue;
      const cand = candidates[idx];
      let finalQuote = "";
      if (cand.lang === "vi") {
        finalQuote = cand.text;
      } else {
        const cleaned = String(p?.vi || "")
          .replace(/[\r\n]+/g, " ")
          .replace(/^["'“”*]+|["'“”*]+$/g, "")
          .trim();
        const hasViDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleaned);
        if (
          cleaned.length >= 12 &&
          cleaned.length <= 150 &&
          !isCaptionRefusal(cleaned) &&
          !/[\u4e00-\u9fff]/.test(cleaned) &&
          hasViDiacritics
        ) {
          finalQuote = cleaned;
        }
      }
      if (!finalQuote) continue;
      seenIdx.add(idx);
      rememberLiveQuoteKey(cand.key);
      out.push({ quote: finalQuote, attribution: cand.author, src: cand.src });
    }
    return out;
  };

  // 1) Gemini smart cascade (3 keys)
  for (const k of availableKeys("gemini", env && env.GEMINI_API_KEY)) {
    const g = await geminiGenerateCaption(env, sys, usr, null, null, k, 320, true, 0.75);
    const quotes = parseLivePicks(g.text);
    if (quotes.length >= 1) {
      return { quotes, via: g.model || "gemini" };
    }
  }

  // 2) Fallback CF 18-pool Llama 4 Scout
  if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
    try {
      const res = await runCfTextChatPooled(
        env,
        [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
        260,
        0.75
      );
      const quotes = parseLivePicks(res?.text);
      if (quotes.length >= 1) {
        return { quotes, via: "cf" };
      }
    } catch (_) {}
  }

  return { quotes: [], via: null };
}

function mergeHybridQuotes(pickedObj, liveObj, seedText = "") {
  const baseQuotes = Array.isArray(pickedObj?.data?.quotes) ? pickedObj.data.quotes : [];
  const baseIds = Array.isArray(pickedObj?.selectedIds) ? pickedObj.selectedIds : [];
  const liveQuotes = Array.isArray(liveObj) ? liveObj : Array.isArray(liveObj?.quotes) ? liveObj.quotes : [];
  const liveVia = !Array.isArray(liveObj) && liveObj?.via ? liveObj.via : "";
  if (liveQuotes.length === 0 || baseQuotes.length < 5) {
    rememberQuoteIds(baseIds);
    return { data: { quotes: shuffleInPlace([...baseQuotes]) }, liveCount: 0, liveVia: "" };
  }
  const slotIndices = shuffleInPlace([0, 1, 2, 3, 4]);
  const candidateSlots = slotIndices.slice(0, 2);
  const keptAttrs = new Set(
    baseQuotes
      .filter((_, idx) => !candidateSlots.includes(idx))
      .map((q) => String(q.attribution || "").toLowerCase().trim())
  );
  const filteredLive = liveQuotes.filter((lq) => {
    const a = String(lq.attribution || "").toLowerCase().trim();
    if (!a || keptAttrs.has(a)) return false;
    keptAttrs.add(a);
    return true;
  });
  if (filteredLive.length === 0) {
    rememberQuoteIds(baseIds);
    return { data: { quotes: shuffleInPlace([...baseQuotes]) }, liveCount: 0, liveVia: "" };
  }
  const replaceSlots = new Set(candidateSlots.slice(0, filteredLive.length));
  const merged = baseQuotes.map((item) => ({ ...item }));
  let fIdx = 0;
  for (const slot of replaceSlots) {
    if (slot < merged.length && filteredLive[fIdx]) {
      merged[slot].quote = filteredLive[fIdx].quote;
      merged[slot].attribution = filteredLive[fIdx].attribution;
      fIdx++;
    }
  }
  const keptIds = baseIds.filter((_, idx) => !replaceSlots.has(idx));
  rememberQuoteIds(keptIds);
  return { data: { quotes: shuffleInPlace(merged) }, liveCount: fIdx, liveVia };
}

// Sinh JSON ĐÚNG response_format schema mà Locket 2.74.0 yêu cầu (quote 5 câu hybrid: 3 bank thật + 2 danh ngôn thật kéo live).
async function generateStructuredCaption(env, appPrompt, rawSchema, imgBytes, sourceUrl, origin, tempId, captionType) {
  const schema = rawSchema ? normalizeSchema(rawSchema) : null;
  const isQuote = /quote/i.test(appPrompt + " " + captionType) || !!(schema && schema.properties && schema.properties.quotes);

  // 1) Chuẩn bị ảnh (cho model vision)
  let prep = null;
  try { prep = await prepareAiInputImage(imgBytes, sourceUrl, origin, tempId); } catch (_) {}
  const prepBytes = prep && prep.bytes ? prep.bytes : null;
  const prepMime = prep ? prep.mimeType : "image/jpeg";

  const tryParse = (txt) => {
    if (!txt) return null;
    let s = String(txt).trim().replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
    const a = s.indexOf("{"); const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    try { return JSON.parse(s); } catch (_) { return null; }
  };

  // Nhánh QUOTE: Hybrid Mode = 3 câu từ kho 570+ câu thật + 2 câu danh ngôn thật kéo live từ DummyJSON/ZenQuotes/Wikiquote
  if (schema && schema.properties && schema.properties.quotes) {
    await loadRecentQuoteHistory();
    const enumCats = schema.properties.quotes.items?.properties?.category?.enum;
    const cats = Array.isArray(enumCats) && enumCats.length > 0 ? enumCats : Object.keys(VERIFIED_QUOTE_BANK);
    const avoidNote = RECENT_QUOTE_IDS.length > 0 ? `\nNever pick any already-excluded ID.` : "";
    const buildPickPrompt = (descForRank) =>
      "Look closely at this photo (subject, clothing, objects, food, setting, expression, mood). " +
      "Pick a FRESH, varied matching quote ID for EACH of the 5 categories from the catalog below. " +
      'Reply with ONLY a valid JSON object mapping each category name to one ID from that category, e.g. {"pop_music":"<id>","greek_philosophy":"<id>","famous_modern_figures":"<id>","film_and_tv":"<id>","athlete":"<id>"}. No extra text.' +
      avoidNote +
      "\n\n" +
      buildQuoteBankCatalog(descForRank);
    const pickPromptDirect = buildPickPrompt("");
    const userContentPick = prepBytes
      ? [
          { type: "text", text: pickPromptDirect },
          { type: "image_url", image_url: { url: `data:${prepMime};base64,${uint8ToBase64(prepBytes)}` } },
        ]
      : pickPromptDirect;

    // 1) Vision mô tả ảnh (~1.4s)
    const vision = await describeImageWithVision(env, prepBytes, prepMime);
    const pickPromptRanked = buildPickPrompt(vision.desc || "");
    const descMsg = `Photo description: ${vision.desc || "A candid everyday photo."}\n\n${pickPromptRanked}`;

    const pickBankIds = async () => {
      // (a) Groq fast JSON ID picker
      for (const k of availableKeys("groq", env && env.GROQ_API_KEY)) {
        try {
          const model = (env && env.GROQ_MODEL) || "openai/gpt-oss-120b";
          const bodyObj = {
            model,
            messages: [{ role: "user", content: descMsg }],
            temperature: 0.85,
          };
          if (/gpt-oss/i.test(model)) {
            bodyObj.reasoning_effort = "low";
            bodyObj.max_completion_tokens = 320;
          } else {
            bodyObj.max_tokens = 140;
          }
          const r = await fetch(`${(env && env.GROQ_BASE_URL) || "https://api.groq.com/openai/v1"}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
            body: JSON.stringify(bodyObj),
          });
          if (!r.ok) { if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(k); continue; }
          const j = await r.json();
          const parsedMap = tryParse(j?.choices?.[0]?.message?.content);
          if (parsedMap && typeof parsedMap === "object") {
            const picked = pickVerifiedQuotesFromMap(parsedMap, tempId, cats, true);
            if (picked.matchedCount >= 2) {
              return { picked, source: (vision.source ? vision.source + "+" : "") + "groq:" + model + "_bank" };
            }
          }
        } catch (_) {}
      }

      // (b) Gemini cascade fallback for bank ID picking
      for (const k of availableKeys("gemini", env && env.GEMINI_API_KEY)) {
        const g = await geminiGenerateCaption(
          env,
          "Return only JSON mapping category names to quote IDs.",
          vision.desc ? descMsg : pickPromptRanked,
          vision.desc ? null : prepBytes,
          vision.desc ? null : prepMime,
          k,
          220,
          true,
          0.85
        );
        const parsedMap = tryParse(g.text);
        if (parsedMap && typeof parsedMap === "object") {
          const picked = pickVerifiedQuotesFromMap(parsedMap, tempId, cats, true);
          if (picked.matchedCount >= 2) {
            return { picked, source: (vision.source ? vision.source + "+" : "") + "gemini:" + (g.model || "gemini") + "_bank" };
          }
        }
      }

      // (c) CF Vision Pool fallback
      if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
        const res = await runVisionChatPooled(env, [{ role: "user", content: userContentPick }], 200, 0.85);
        const parsedMap = tryParse(res.text);
        if (parsedMap && typeof parsedMap === "object") {
          const picked = pickVerifiedQuotesFromMap(parsedMap, tempId, cats, true);
          if (picked.matchedCount >= 2) {
            return { picked, source: res.source || "cf_vision_bank" };
          }
        }
      }

      // (d) NVIDIA NIM Vision fallback
      for (const k of availableKeys("nvidia", env && env.NVIDIA_API_KEY)) {
        try {
          const nvModel = (env && env.NVIDIA_MODEL) || "meta/llama-3.2-11b-vision-instruct";
          const base = (env && env.NVIDIA_BASE_URL) || "https://integrate.api.nvidia.com/v1";
          const r = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
            body: JSON.stringify({ model: nvModel, messages: [{ role: "user", content: userContentPick }], max_tokens: 140, temperature: 0.85 }),
          });
          if (!r.ok) { if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(k); continue; }
          const j = await r.json();
          const parsedMap = tryParse(j?.choices?.[0]?.message?.content);
          if (parsedMap && typeof parsedMap === "object") {
            const picked = pickVerifiedQuotesFromMap(parsedMap, tempId, cats, true);
            if (picked.matchedCount >= 2) {
              return { picked, source: "nvidia:" + nvModel + "_bank" };
            }
          }
        } catch (_) {}
      }

      // (e) Varied real fallback từ VERIFIED_QUOTE_BANK
      const fbPicked = pickVerifiedQuotesFromMap({}, tempId + String(Date.now()), cats, true);
      return { picked: fbPicked, source: "verified_bank_fallback" };
    };

    // 2) Chạy song song: [chọn bank IDs || kéo & dịch 2 câu danh ngôn thật live]
    const [bankRes, liveRes] = await Promise.all([
      pickBankIds(),
      fetchAndPickLiveRealQuotes(env, vision.desc || ""),
    ]);

    const merged = mergeHybridQuotes(bankRes.picked, liveRes, tempId);
    await saveRecentQuoteHistory();
    const liveSuffix = merged.liveCount > 0 ? `+live_real_${merged.liveCount}${merged.liveVia ? "_" + merged.liveVia : ""}` : "";
    return {
      data: merged.data,
      source: bankRes.source + liveSuffix,
      err: null,
    };
  }

  // Nhánh schema khác (dự phòng nếu app gửi schema mới ngoài quote)
  const schemaStr = schema ? JSON.stringify(schema).slice(0, 1500) : "";
  const sys =
    "You are a Locket caption generator. Look at the photo and follow the user's instruction. " +
    "You MUST reply with ONLY a single valid JSON object (no markdown, no code fence, no extra text) " +
    (schema ? "that strictly matches this JSON schema: " + schemaStr + ". " : "") +
    "Return pure JSON only.";
  const userText = (appPrompt || "Write a caption for this photo.").slice(0, 1200);
  const userContentWithImg = prepBytes
    ? [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: `data:${prepMime};base64,${uint8ToBase64(prepBytes)}` } },
      ]
    : userText;

  if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
    const res = await runVisionChatPooled(
      env,
      [
        { role: "system", content: sys },
        { role: "user", content: userContentWithImg },
      ],
      480,
      0.5
    );
    let obj = tryParse(res.text);
    if (obj && typeof obj === "object") {
      obj = sanitizeToSchema(obj, schema);
      if (!isCaptionRefusal(JSON.stringify(obj))) {
        return { data: obj, source: res.source || "cf_vision", err: null };
      }
    }
  }

  const single = await generateCaptionWithVision(env, captionType, imgBytes, sourceUrl, origin, tempId + "f", appPrompt);
  const data = ensureValidQuoteOptions(buildFallbackStructured(schema, single.text, isQuote), schema);
  return { data, source: "fallback_" + (single.source || "static"), err: single.aiErr || null };
}

// Dựng object JSON hợp lệ theo schema khi AI không trả JSON. Điền caption vào các field string.
// Làm sạch object cho KHỚP CHÍNH XÁC schema (OpenAI structured output strict, additionalProperties:false).
// Bỏ field thừa, ép enum, cắt/đệm mảng đúng minItems/maxItems, điền field thiếu.
function sanitizeToSchema(obj, schema) {
  if (!schema || typeof schema !== "object") return obj;
  const type = schema.type;
  const props = schema.properties;
  if (type === "object" && props) {
    const out = {};
    for (const key of Object.keys(props)) {
      const ps = props[key];
      let v = obj ? obj[key] : undefined;
      if (v === undefined) {
        // field thiếu: thử lấy từ obj key tương tự, else để trình gọi điền fallback
        if (ps.type === "array") v = [];
        else if (ps.enum) v = ps.enum[0];
        else v = typeof obj === "string" ? obj : "";
      }
      out[key] = sanitizeToSchema(v, ps);
    }
    return out; // CHỈ giữ field trong schema -> không có additionalProperties
  }
  if (type === "array" && schema.items) {
    let arr = Array.isArray(obj) ? obj : [];
    const min = Number(schema.minItems) || 0;
    const max = Number(schema.maxItems) || (arr.length || min) || 5;
    arr = arr.map((it) => sanitizeToSchema(it, schema.items));
    // đệm cho đủ min
    while (arr.length < min && arr.length < (max || min)) arr.push(sanitizeToSchema({}, schema.items));
    if (max && arr.length > max) arr = arr.slice(0, max);
    return arr;
  }
  if (schema.enum && Array.isArray(schema.enum)) {
    if (schema.enum.includes(obj)) return obj;
    // tìm enum gần nhất hoặc lấy phần tử đầu
    const lower = String(obj || "").toLowerCase();
    const match = schema.enum.find((e) => String(e).toLowerCase() === lower);
    return match || schema.enum[0];
  }
  if (type === "string") return typeof obj === "string" ? obj : (obj == null ? "" : String(obj));
  if (type === "number" || type === "integer") return typeof obj === "number" ? obj : Number(obj) || 0;
  if (type === "boolean") return !!obj;
  return obj;
}

function ensureValidQuoteOptions(obj, schema) {
  if (!schema || !schema.properties || !schema.properties.quotes || !Array.isArray(obj?.quotes)) {
    return obj;
  }
  const defaultCats = ["pop_music", "greek_philosophy", "famous_modern_figures", "film_and_tv", "athlete"];
  const enumCats = schema.properties.quotes.items?.properties?.category?.enum;
  const cats = Array.isArray(enumCats) && enumCats.length > 0 ? enumCats : defaultCats;
  const fallbackByCat = {
    pop_music: { quote: "Shake it off, shake it off.", category: "pop_music", attribution: "Taylor Swift" },
    greek_philosophy: { quote: "Happiness depends upon ourselves.", category: "greek_philosophy", attribution: "Aristotle" },
    famous_modern_figures: { quote: "Stay hungry, stay foolish.", category: "famous_modern_figures", attribution: "Steve Jobs" },
    film_and_tv: { quote: "Life is like a box of chocolates. You never know what you're gonna get.", category: "film_and_tv", attribution: "Forrest Gump" },
    athlete: { quote: "Float like a butterfly, sting like a bee.", category: "athlete", attribution: "Muhammad Ali" },
  };

  const rawItems = obj.quotes
    .map((it) => ({
      quote: String(it?.quote || "").trim().slice(0, 140),
      category: String(it?.category || "").trim(),
      attribution: String(it?.attribution || "").trim().slice(0, 80),
    }))
    .filter((it) => it.quote.length >= 3 && !isCaptionRefusal(it.quote) && !/[\u4e00-\u9fff]/.test(it.quote));

  const usedIndices = new Set();
  const finalQuotes = [];

  for (const cat of cats) {
    let pickIdx = rawItems.findIndex((it, idx) => !usedIndices.has(idx) && it.category === cat);
    if (pickIdx < 0) {
      pickIdx = rawItems.findIndex((it, idx) => !usedIndices.has(idx) && !cats.includes(it.category));
    }
    if (pickIdx < 0) {
      pickIdx = rawItems.findIndex((_, idx) => !usedIndices.has(idx));
    }
    const fb = fallbackByCat[cat] || { quote: "Giữ trọn khoảnh khắc này.", category: cat, attribution: "Khuyết danh" };
    if (pickIdx >= 0) {
      usedIndices.add(pickIdx);
      const picked = rawItems[pickIdx];
      finalQuotes.push({
        quote: picked.quote,
        category: cat,
        attribution: picked.attribution || fb.attribution,
      });
    } else {
      finalQuotes.push({
        quote: fb.quote,
        category: cat,
        attribution: fb.attribution,
      });
    }
  }

  return { quotes: finalQuotes };
}

function buildFallbackStructured(schema, text, isQuote) {
  const quotesVi = [
    { quote: text || "Mỗi khoảnh khắc là một câu chuyện chưa kể.", category: "famous_modern_figures", attribution: "Khuyết danh" },
    { quote: "Sống chậm lại để thấy đời đáng yêu hơn.", category: "pop_music", attribution: "Vô danh" },
    { quote: "Hạnh phúc là hành trình, không phải đích đến.", category: "greek_philosophy", attribution: "Aristotle" },
    { quote: "Giữ lấy khoảnh khắc này, vì nó không trở lại.", category: "film_and_tv", attribution: "Khuyết danh" },
    { quote: "Cứ bước đi, ánh sáng ở cuối con đường.", category: "athlete", attribution: "Vô danh" },
  ];
  if (!schema || typeof schema !== "object") {
    return isQuote ? { quotes: quotesVi } : { headline: text, caption: text, text };
  }
  const props = schema.properties || {};
  // Nếu schema có mảng "quotes" (hoặc mảng bất kỳ) -> điền mảng
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (p && p.type === "array") {
      const n = Number(p.minItems || p.maxItems || 5) || 5;
      const itemProps = (p.items && p.items.properties) || {};
      const arr = [];
      for (let i = 0; i < n; i++) {
        const base = quotesVi[i % quotesVi.length];
        const item = {};
        for (const ik of Object.keys(itemProps)) {
          const ip = itemProps[ik];
          if (/quote|text|caption|headline|line/i.test(ik)) item[ik] = i === 0 ? (text || base.quote) : base.quote;
          else if (/categor/i.test(ik)) item[ik] = (ip.enum && ip.enum[0]) || base.category;
          else if (/attribut|author|source/i.test(ik)) item[ik] = base.attribution;
          else item[ik] = (ip.enum && ip.enum[0]) || base.quote;
        }
        if (Object.keys(itemProps).length === 0) item.value = base.quote;
        arr.push(item);
      }
      const out = {}; out[key] = arr;
      // điền các field top-level string khác nếu có
      for (const k2 of Object.keys(props)) if (props[k2].type === "string") out[k2] = text;
      return out;
    }
  }
  // Schema toàn string -> điền caption vào mọi field
  const out = {};
  for (const key of Object.keys(props)) out[key] = text;
  if (Object.keys(out).length === 0) out.caption = text;
  return out;
}

async function generateCaptionWithVision(env, captionType, imgBytes, sourceUrl, origin, tempId, appPrompt = "") {
  const isQuote = String(captionType || "").toLowerCase().includes("quote");
  const fallbackNews = [
    "TIN NÓNG: PHÁT HIỆN SINH VẬT LƯỜI BIẾNG ĐANG ONLINE",
    "TIN KHẨN: BẮT GẶP GƯƠNG MẶT ĐÁNG YÊU QUÁ MỨC QUY ĐỊNH",
    "TRỰC TIẾP: TÌNH HÌNH RẤT ỔN NHƯNG HƠI BUỒN NGỦ",
    "NÓNG 24H: XUẤT HIỆN NHÂN VẬT CHÍNH ĐANG CHILL HẾT NẤC",
  ];
  const fallbackQuotes = [
    "Bình yên đôi khi chỉ là một tấm ảnh chụp vội.",
    "Hôm nay trời đẹp, lòng cũng nhẹ tênh.",
    "Sống chậm lại một nhịp để giữ trọn khoảnh khắc này.",
    "Không cần hoàn hảo, chỉ cần là chính mình.",
  ];
  const fallbackList = isQuote ? fallbackQuotes : fallbackNews;
  const fallbackText = fallbackList[Math.floor(Math.random() * fallbackList.length)];

  const cleanSingleLine = (raw) => {
    let txt = String(raw || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const lines = txt.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    let pick = isQuote
      ? lines[0] || ""
      : lines.find((l) => /tin nóng|khẩn cấp|trực tiếp|nóng 24h|breaking/i.test(l)) || lines[lines.length - 1] || "";
    pick = pick
      .replace(/^\s*(?:[-*]|\*\*|tiêu đề\s*:|headline\s*:)\s*/i, "")
      .replace(/^["'“”*]+|["'“”*]+$/g, "")
      .trim();
    if (!pick || isCaptionRefusal(pick) || /[\u4e00-\u9fff]/.test(pick)) return "";
    if (!isQuote) pick = pick.toUpperCase();
    return pick.slice(0, 110);
  };

  const systemPrompt = isQuote
    ? "Bạn là người viết caption tiếng Việt tinh tế, tự nhiên 100% đúng ngữ pháp. Dựa vào bức ảnh, viết ĐÚNG 1 câu ngắn gọn (6-14 từ), có cảm xúc và sát nội dung ảnh. Không ngoặc kép, không giải thích, không pha chữ Hán."
    : "Bạn là biên tập viên bản tin LNN LIVE của Locket, viết tiêu đề tin nóng tiếng Việt cực tự nhiên, duyên dáng, hài hước kiểu Gen Z (tuyệt đối đúng ngữ pháp tiếng Việt, không dịch cứng, không ghép từ vô nghĩa, không pha chữ Hán). Nhìn kỹ bức ảnh và viết ĐÚNG 1 dòng tiêu đề tin nóng ngắn gọn (6 đến 12 từ), VIẾT HOA TOÀN BỘ, bám sát chi tiết thật trong ảnh, bắt đầu bằng 'TIN NÓNG: ' hoặc 'KHẨN CẤP: ' hoặc 'TRỰC TIẾP: '. Không ngoặc kép, không giải thích. Ví dụ chuẩn:\nTIN NÓNG: PHÁT HIỆN NHÂN VIÊN JOLLIBEE CƯỜI TƯƠI GÂY THƯƠNG NHỚ\nKHẨN CẤP: MỘT ĐĨA ĐỒ ĂN NGON SẮP BỊ XỬ ĐẸP TRONG 5 PHÚT\nTRỰC TIẾP: SINH VIÊN THỨC KHUYA CHẠY DEADLINE NHƯNG VẪN RẤT YÊU ĐỜI\nTIN NÓNG: GIAO DIỆN HÔM NAY XINH QUÁ MỨC QUY ĐỊNH";
  const baseUserPrompt = isQuote
    ? "Nhìn ảnh và viết 1 câu trích dẫn/caption tiếng Việt ngắn gọn, tự nhiên, sát nội dung bức ảnh này."
    : "Nhìn ảnh và viết ĐÚNG 1 dòng tiêu đề tin nóng LNN LIVE tiếng Việt hài hước, đúng chính tả, sát nội dung bức ảnh này.";
  const userTextPrompt = appPrompt
    ? `${baseUserPrompt}\nNgữ cảnh bổ sung: ${String(appPrompt).slice(0, 200)}`
    : baseUserPrompt;

  let lastErr = null;
  let prep = null;
  try {
    prep = await prepareAiInputImage(imgBytes, sourceUrl, origin, tempId);
  } catch (_) {}
  const prepBytes = prep && prep.bytes && prep.bytes.length > 0 ? prep.bytes : null;
  const prepMime = prep ? prep.mimeType : "image/jpeg";

  // 1) Fast 2-stage trên CF 18-pool (Priority #1 cho LNN LIVE): Vision Observer (llama-4-scout ~1.4s) -> Llama 4 Scout viết tiếng Việt (~0.8s)
  if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
    const vision = await describeImageWithVision(env, prepBytes, prepMime);
    if (vision.desc) {
      const cfTextRes = await runCfTextChatPooled(
        env,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Mô tả bức ảnh: ${vision.desc}\n\n${baseUserPrompt}` },
        ],
        120,
        0.75
      );
      const cleanedCfText = cleanSingleLine(cfTextRes.text);
      if (cleanedCfText) {
        return { text: cleanedCfText, source: (vision.source ? vision.source + "+" : "") + (cfTextRes.source || "cf_text"), aiErr: null };
      }
      if (cfTextRes.err) lastErr = cfTextRes.err;
    }

    // Fallback 1b) Direct CF Vision (Llama 4 Scout -> Mistral 3.1)
    const userContent = [];
    if (prepBytes) {
      userContent.push({ type: "image_url", image_url: { url: `data:${prepMime};base64,${uint8ToBase64(prepBytes)}` } });
    }
    userContent.push({ type: "text", text: userTextPrompt });
    const cfRes = await runVisionChatPooled(
      env,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      100,
      0.75,
      ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"]
    );
    const cleaned = cleanSingleLine(cfRes.text);
    if (cleaned) {
      return { text: cleaned, source: cfRes.source || "cf_vision", aiErr: null };
    }
    if (cfRes.err) lastErr = cfRes.err;
  }

  // 2) Google Gemini (vision fallback — 3 keys, smart cascade)
  for (const k of availableKeys("gemini", env && env.GEMINI_API_KEY)) {
    const g = await geminiGenerateCaption(env, systemPrompt, userTextPrompt, prepBytes, prepMime, k);
    const cleaned = cleanSingleLine(g.text);
    if (cleaned) {
      return { text: cleaned, source: "gemini:" + (g.model || (env && env.GEMINI_TEXT_MODEL) || "gemini-4-hydrogen"), aiErr: lastErr };
    }
    if (g.err) lastErr = g.err;
  }

  // 3) NVIDIA NIM (vision)
  for (const k of availableKeys("nvidia", env && env.NVIDIA_API_KEY)) {
    const nv = await nvidiaGenerateCaption(env, systemPrompt, userTextPrompt, prepBytes, prepMime, k);
    const cleaned = cleanSingleLine(nv.text);
    if (cleaned) {
      return { text: cleaned, source: "nvidia:" + ((env && env.NVIDIA_MODEL) || "meta/llama-3.2-11b-vision-instruct"), aiErr: lastErr };
    }
    if (nv.err) lastErr = nv.err;
  }

  // 4) Groq (last resort trước fallback tĩnh)
  for (const k of availableKeys("groq", env && env.GROQ_API_KEY)) {
    const gq = await groqGenerateCaption(env, systemPrompt, userTextPrompt, prepBytes, prepMime, k);
    const cleaned = cleanSingleLine(gq.text);
    if (cleaned) {
      return { text: cleaned, source: "groq:" + ((env && env.GROQ_MODEL) || "openai/gpt-oss-120b"), aiErr: lastErr };
    }
    if (gq.err) lastErr = gq.err;
  }

  // 5) Caption tĩnh vui (luôn trả được chữ, không bao giờ để trống)
  return { text: fallbackText, source: "fallback_" + (lastErr ? "err" : "static"), aiErr: lastErr };
}

async function handleStudioRequest(request, env, state = null) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  cleanupMemory();
  const url = new URL(request.url);

  // 1. Status endpoint
  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/status")) {
    return new Response(
      JSON.stringify({
        status: "online",
        platform: "Cloudflare Workers 24/7 (PNG Frame, Photobooth, LUT & FLUX.2 AI Engine)",
        owner: "Tommm",
        ai_model: (env && env.AI_MODEL) || "@cf/black-forest-labs/flux-2-klein-4b",
        ai_binding_ready: !!(env && env.AI),
        // Pool ảnh FLUX: số tài khoản Cloudflare phụ (REST) để xoay vòng khi account chính 4006.
        cf_image_pool_accounts: parseCfAccounts(env && env.CF_AI_ACCOUNTS).length,
        // Caption fallback (text): đếm số key của mỗi provider (nhiều key = xoay vòng được).
        caption_fallback_keys: {
          nvidia: parseKeyList(env && env.NVIDIA_API_KEY).length,
          groq: parseKeyList(env && env.GROQ_API_KEY).length,
          gemini: parseKeyList(env && env.GEMINI_API_KEY).length,
        },
        // Image fallback (tách nền / AI 3D): NVIDIA img2img chỉ bật khi đặt NVIDIA_IMAGE_MODEL.
        image_fallback: {
          nvidia_image_model: (env && env.NVIDIA_IMAGE_MODEL) || null,
          nvidia_keys: parseKeyList(env && env.NVIDIA_API_KEY).length,
          gemini_image_keys: parseKeyList(env && env.GEMINI_API_KEY).length,
        },
        nvidia_model: (env && env.NVIDIA_MODEL) || "meta/llama-3.2-11b-vision-instruct",
        groq_model: (env && env.GROQ_MODEL) || "llama-3.3-70b-versatile",
        gemini_text_model: ((env && env.GEMINI_TEXT_MODEL) || "gemini-4-hydrogen") + " (fallback: gemini-3.5-flash-lite, gemini-3.1-flash-lite)",
        keys_benched: KEY_COOLDOWN.size,
        cf_ai_quota_hit: cfAiQuotaActive(),
        cf_ai_quota_cooldown_until: CF_AI_QUOTA_HIT_UNTIL ? new Date(CF_AI_QUOTA_HIT_UNTIL).toISOString() : null,
        ai_prompts_loaded: Object.keys(AI_FILTER_PROMPTS).length,
        luts_loaded: Object.keys(LUT_FILTERS).length,
        warps_loaded: Object.keys(WARP_FILTERS).length,
        special_fx_loaded: SPECIAL_FX_IDS.size,
        frames_loaded: Object.keys(FRAMES_MANIFEST).length,
        quote_bank_total: Object.values(VERIFIED_QUOTE_BANK).reduce((s, a) => s + a.length, 0),
        live_quote_cache_size: LIVE_QUOTE_CACHE.items.length,
        cached_frames_in_ram: FRAME_CACHE.size,
        cached_images_in_ram: MEMORY_IMAGES.size,
        caption_response_mode: CAPTION_MODE_OVERRIDE || (env && env.CAPTION_RESPONSE_MODE) || "smart_locket",
        last_debug: LAST_DEBUG,
        last_caption_debug: LAST_CAPTION_DEBUG,
      }),
      { headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
    );
  }

  // 1.5 Runtime switcher cho response format của /generateCaption (test nhanh không cần redeploy)
  if (request.method === "GET" && url.pathname === "/caption-mode") {
    const allowed = [
      "smart_locket",
      "quote_caption_obj",
      "quote_pure_parsed",
      "quote_caption_str",
      "result_data_caption_only",
      "data_object_full",
      "data_parsed",
      "data_string",
    ];
    const m = (url.searchParams.get("m") || "").trim();
    if (m === "reset" || m === "default") {
      CAPTION_MODE_OVERRIDE = null;
    } else if (allowed.includes(m)) {
      CAPTION_MODE_OVERRIDE = m;
    }
    return new Response(
      JSON.stringify({
        ok: true,
        caption_response_mode: CAPTION_MODE_OVERRIDE || (env && env.CAPTION_RESPONSE_MODE) || "smart_locket",
        allowed,
      }),
      { headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
    );
  }

  // 2. Serve temporary / generated images (RAM -> Cache API). Cũng phục vụ ở top-level (ngoài DO).
  if (request.method === "GET" && url.pathname.startsWith("/ai-filters/")) {
    const id = url.pathname.slice("/ai-filters/".length);
    const item = await getImage(id);
    if (item) {
      return new Response(item.bytes, {
        status: 200,
        headers: corsHeaders({
          "Content-Type": item.mimeType,
          "Cache-Control": "public, max-age=300",
        }),
      });
    }
    return new Response("Image expired", { status: 404, headers: corsHeaders() });
  }

function rgbToHex(r, g, b) {
  const h = (n) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function smartTitleCase(str) {
  const letters = str.match(/\p{L}/gu) || [];
  if (letters.length === 0) return str;
  const upperCount = letters.filter((ch) => ch === ch.toUpperCase() && ch !== ch.toLowerCase()).length;
  if (upperCount / letters.length <= 0.7) return str;
  return str.toLowerCase().replace(/(^|[\s(\[\-–\/])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

function cleanYoutubeTitle(title, author) {
  let t = String(title || "")
    .replace(/[\(\[]\s*(official\s*(music\s*)?video|official\s*mv|official\s*audio|lyric\s*video|lyrics?|mv|audio|hd|4k|live|visualizer|full\s*version)[^\)\]]*[\)\]]/gi, " ")
    .replace(/\s*\|\s*(official\s*(music\s*)?video|official\s*mv|mv|lyrics?|audio|#?shorts).*$/i, "")
    .replace(/#shorts\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parenEnd = t.indexOf(")");
  if (parenEnd >= 11 && t.length - parenEnd > 8) {
    t = t.slice(0, parenEnd + 1).trim();
  }
  t = smartTitleCase(t);
  const a = smartTitleCase(String(author || "").replace(/\s*-\s*Topic$/i, "").replace(/Official$/i, "").trim());
  return { cleanTitle: t, cleanAuthor: a };
}

function extractDominantColorsFromJpeg(bytes) {
  const fallback = ["#1E1B4B", "#4C1D95"];
  try {
    const dec = jpeg.decode(bytes, { useTArray: true });
    if (!dec || !dec.data || !dec.data.length) return fallback;
    const d = dec.data;
    let sumR = 0, sumG = 0, sumB = 0, wSum = 0;
    for (let i = 0; i < d.length; i += 64) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx < 24 || mn > 236) continue;
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      const w = 0.5 + sat * 4.5;
      sumR += r * w;
      sumG += g * w;
      sumB += b * w;
      wSum += w;
    }
    if (wSum <= 0) return fallback;
    let r = sumR / wSum, g = sumG / wSum, b = sumB / wSum;
    // Keep brightness safe for crisp white overlay text
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 145) {
      const k = 145 / lum;
      r *= k; g *= k; b *= k;
    }
    const c1 = rgbToHex(r, g, b);
    const c2 = rgbToHex(r * 0.52, g * 0.52, b * 0.58);
    return [c1, c2];
  } catch (_) {
    return fallback;
  }
}

function foldNorm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleMatchesTrack(queryTitle, candTitle) {
  const q = foldNorm(queryTitle);
  const c = foldNorm(candTitle);
  if (!q || !c) return true;
  if (c.includes(q) || q.includes(c)) return true;
  const qWords = q.split(/\s+/).filter((w) => w.length >= 2);
  if (qWords.length === 0) return true;
  const cSet = new Set(c.split(/\s+/));
  let matched = 0;
  for (const w of qWords) {
    if (cSet.has(w)) matched++;
  }
  return matched >= Math.max(1, Math.ceil(qWords.length * 0.5));
}

async function resolveSpotifyTrackUrl(title, artist, env = null) {
  const qTitle = String(title || "").trim();
  const qArtist = String(artist || "").trim();
  if (!qTitle) return { spotifyUrl: "", spotifyThumb: "" };
  const queries = [];
  if (qArtist && qArtist !== "YouTube") queries.push(`site:open.spotify.com/track ${qTitle} ${qArtist}`);
  queries.push(`site:open.spotify.com/track ${qTitle}`);
  const hdrs = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Accept": "text/html,application/xhtml+xml",
  };
  const extractSpotifyIds = (txt) => {
    let decoded = String(txt || "");
    try { decoded = decodeURIComponent(decoded); } catch (_) {}
    const ids = [];
    const re = /open\.spotify\.com(?:\/intl-[a-z-]+)?\/track\/([A-Za-z0-9]{22})/gi;
    let m;
    while ((m = re.exec(decoded)) !== null && ids.length < 3) {
      if (!ids.includes(m[1])) ids.push(m[1]);
    }
    return ids;
  };
  const verifySpotifyIds = async (ids) => {
    if (!ids || ids.length === 0) return null;
    const verified = await Promise.all(
      ids.map(async (tid) => {
        const spUrl = `https://open.spotify.com/track/${tid}`;
        try {
          const oRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spUrl)}`, {
            headers: { "User-Agent": hdrs["User-Agent"] },
            signal: AbortSignal.timeout(2200),
          });
          if (!oRes.ok) return null;
          const oJson = await oRes.json().catch(() => null);
          return oJson && oJson.title
            ? { tid, spotifyUrl: spUrl, spTitle: String(oJson.title), spotifyThumb: String(oJson.thumbnail_url || "") }
            : null;
        } catch (_) {
          return null;
        }
      })
    );
    const valid = verified.filter(Boolean);
    const exact = valid.find((v) => titleMatchesTrack(qTitle, v.spTitle)) || valid[0];
    if (exact) return { spotifyUrl: exact.spotifyUrl, spotifyThumb: exact.spotifyThumb };
    return null;
  };

  for (const dq of queries) {
    const endpoints = [
      `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(dq)}`,
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(dq)}`,
    ];
    for (const ddgUrl of endpoints) {
      try {
        const res = await fetch(ddgUrl, { headers: hdrs, signal: AbortSignal.timeout(2600) });
        if (!res.ok) continue;
        const ids = extractSpotifyIds(await res.text());
        if (ids.length === 0) continue;
        const hit = await verifySpotifyIds(ids);
        if (hit) return hit;
        return { spotifyUrl: `https://open.spotify.com/track/${ids[0]}`, spotifyThumb: "" };
      } catch (_) {}
    }
  }

  // Fallback: Gemini Google Search Grounding (verified via open.spotify.com/oembed)
  if (env && env.GEMINI_API_KEY) {
    const gKeys = availableKeys("gemini", env.GEMINI_API_KEY).slice(0, 2);
    const gModels = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
    const promptQ = `Find the official Spotify track URL (https://open.spotify.com/track/...) for the song "${qTitle}"${qArtist && qArtist !== "YouTube" ? ` by "${qArtist}"` : ""}. Reply ONLY with the URL.`;
    for (const gk of gKeys) {
      for (const gm of gModels) {
        try {
          const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gm)}:generateContent?key=${encodeURIComponent(gk)}`;
          const r = await fetch(gUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tools: [{ google_search: {} }],
              contents: [{ role: "user", parts: [{ text: promptQ }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 120 },
            }),
            signal: AbortSignal.timeout(3800),
          });
          if (!r.ok) {
            if (r.status === 429 || r.status === 403) { benchKey(gk); break; }
            continue;
          }
          const gj = await r.json().catch(() => null);
          const cand = gj?.candidates?.[0];
          const partTxt = (cand?.content?.parts || []).map((p) => p?.text || "").join(" ");
          const metaTxt = JSON.stringify(cand?.groundingMetadata || {});
          const ids = extractSpotifyIds(partTxt + " " + metaTxt);
          if (ids.length > 0) {
            const hit = await verifySpotifyIds(ids);
            if (hit) return hit;
            return { spotifyUrl: `https://open.spotify.com/track/${ids[0]}`, spotifyThumb: "" };
          }
          break;
        } catch (_) {}
      }
    }
  }
  return { spotifyUrl: "", spotifyThumb: "" };
}

async function resolveSpotifyIdMetadata(spotifyId) {
  const id = String(spotifyId || "").trim();
  if (!id) return null;
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${id}`)}&format=json`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const oe = await res.json();
    const author = String(oe?.author_name || "").trim();
    return {
      title: String(oe?.title || "").trim(),
      artist: author && !/^spotify$/i.test(author) ? author : "",
      artworkUrl: String(oe?.thumbnail_url || "").trim(),
    };
  } catch (_) {
    return null;
  }
}

async function resolveAppleIdMetadata(appleId, country = "vn") {
  const id = String(appleId || "").trim();
  if (!/^\d+$/.test(id)) return null;
  const cc = /^[a-zA-Z]{2}$/.test(String(country || "")) ? String(country).toLowerCase() : "vn";
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${encodeURIComponent(cc)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const hit = Array.isArray(j?.results) ? j.results[0] : null;
    return hit && hit.trackName ? hit : null;
  } catch (_) {
    return null;
  }
}

async function resolveYoutubeTrack(videoId, manualQuery = "", env = null, extra = null) {
  const spId = String(extra?.spotifyId || "").trim();
  const amId = String(extra?.appleId || extra?.appleMusicId || "").trim();
  const amCountry = String(extra?.country || "vn").trim();
  const cacheKey = videoId || (spId ? "sp:" + spId : (amId ? "am:" + amId : ("q:" + foldNorm(manualQuery))));
  const cached = cacheKey ? YT_TRACK_CACHE.get(cacheKey) : null;
  if (cached && cached.schemaVer === 5 && Date.now() - cached.ts < 3600000) {
    LAST_YT_TRACK = { ...cached, ts: Date.now() };
    return LAST_YT_TRACK;
  }
  let ytTitle = String(extra?.title || manualQuery || "").trim();
  let ytAuthor = String(extra?.artist || "").trim();
  let thumbUrl = String(extra?.artworkUrl || "").trim() || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");
  let appleMeta = null;
  if (videoId) {
    try {
      const oeRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`, {
        signal: AbortSignal.timeout(3500),
      });
      if (oeRes.ok) {
        const oe = await oeRes.json();
        ytTitle = String(oe?.title || "").trim() || ytTitle;
        ytAuthor = String(oe?.author_name || "").trim() || ytAuthor;
        if (oe?.thumbnail_url) thumbUrl = oe.thumbnail_url;
      }
    } catch (_) {}
  } else if (amId) {
    appleMeta = await resolveAppleIdMetadata(amId, amCountry);
    if (appleMeta) {
      ytTitle = String(appleMeta.trackName || "").trim() || ytTitle;
      ytAuthor = String(appleMeta.artistName || "").trim() || ytAuthor;
      if (appleMeta.artworkUrl100) thumbUrl = String(appleMeta.artworkUrl100).replace("100x100bb", "600x600bb");
    }
  } else if (spId) {
    const spMeta = await resolveSpotifyIdMetadata(spId);
    if (spMeta) {
      if (!ytTitle && spMeta.title) ytTitle = spMeta.title;
      if (!ytAuthor && spMeta.artist) ytAuthor = spMeta.artist;
      if (!thumbUrl && spMeta.artworkUrl) thumbUrl = spMeta.artworkUrl;
    }
  }

  const { cleanTitle, cleanAuthor } = cleanYoutubeTitle(ytTitle, ytAuthor);
  let titleQueryForMatch = cleanTitle;
  const dashSplit = cleanTitle.split(/\s*[-–|]\s*/).filter(Boolean);
  if (dashSplit.length >= 2) {
    titleQueryForMatch = dashSplit.reduce((a, b) => (a.length >= b.length ? a : b));
  }
  const terms = [];
  if (cleanTitle) {
    if (cleanAuthor && !cleanTitle.toLowerCase().includes(cleanAuthor.toLowerCase())) {
      terms.push(`${cleanTitle} ${cleanAuthor}`);
    }
    terms.push(cleanTitle);
    if (dashSplit.length >= 2) terms.push(`${dashSplit[0]} ${dashSplit[1]}`);
  } else if (cleanAuthor) {
    terms.push(cleanAuthor);
  }

  let itunesHit = null;
  let deezerHit = null;
  const searchHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/json",
  };
  for (const term of terms) {
    try {
      const [itVnRes, dzRes] = await Promise.all([
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=VN&media=music&entity=song&limit=5`, { headers: searchHeaders, signal: AbortSignal.timeout(3200) }).catch(() => null),
        fetch(`https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=5`, { headers: searchHeaders, signal: AbortSignal.timeout(3200) }).catch(() => null),
      ]);
      const pickItunes = (itJson) => {
        const list = (itJson?.results || []).filter((x) => x && (titleMatchesTrack(cleanTitle, x.trackName) || titleMatchesTrack(titleQueryForMatch, x.trackName)));
        return list.find((x) => x.previewUrl) || list[0] || null;
      };
      if (itVnRes && itVnRes.ok) {
        itunesHit = pickItunes(await itVnRes.json().catch(() => null));
      }
      if (!itunesHit) {
        const itUsRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=US&media=music&entity=song&limit=5`, { headers: searchHeaders, signal: AbortSignal.timeout(3000) }).catch(() => null);
        if (itUsRes && itUsRes.ok) {
          itunesHit = pickItunes(await itUsRes.json().catch(() => null));
        }
      }
      if (dzRes && dzRes.ok && !deezerHit) {
        const dzJson = await dzRes.json().catch(() => null);
        const dzList = (dzJson?.data || []).filter((x) => x && (titleMatchesTrack(cleanTitle, x.title_short || x.title) || titleMatchesTrack(titleQueryForMatch, x.title_short || x.title)));
        deezerHit = dzList.find((x) => x.preview) || dzList[0] || (dzJson?.data || [])[0] || null;
      }
      if (itunesHit && deezerHit) break;
    } catch (_) {}
  }

  let title = (itunesHit?.trackName || deezerHit?.title_short || deezerHit?.title || cleanTitle || "YouTube Music").trim();
  let artist = (itunesHit?.artistName || deezerHit?.artist?.name || cleanAuthor || "YouTube").trim();
  if (!itunesHit && !deezerHit) {
    const dashMatch = title.match(/^(.+?)\s+[-–]\s+(.+)$/);
    if (dashMatch && dashMatch[1].length >= 2 && dashMatch[2].length >= 2) {
      title = dashMatch[1].trim();
      artist = dashMatch[2].trim();
    }
  }

  const dzDetail = deezerHit?.id
    ? await fetch(`https://api.deezer.com/track/${deezerHit.id}`, { headers: searchHeaders, signal: AbortSignal.timeout(2500) })
        .then((r) => (r.ok ? r.json().catch(() => null) : null))
        .catch(() => null)
    : null;

  let isrc = String(dzDetail?.isrc || "").trim();
  if (!isrc && title) {
    try {
      const mbQ = artist && artist !== "YouTube" ? `${title} ${artist}` : title;
      const mbRes = await fetch(`https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(mbQ)}&fmt=json&limit=2&inc=isrcs`, {
        headers: { "User-Agent": "LocketTommmStudio/1.0 (https://github.com/tommm1207)" },
        signal: AbortSignal.timeout(2200),
      });
      if (mbRes.ok) {
        const mbJson = await mbRes.json().catch(() => null);
        const isrcs = mbJson?.recordings?.[0]?.isrcs;
        if (Array.isArray(isrcs) && isrcs[0]) isrc = String(isrcs[0]).trim();
      }
    } catch (_) {}
  }

  const effItunes = appleMeta || itunesHit;
  const deezerId = deezerHit?.id ? String(deezerHit.id) : "";
  const itunesArt = (effItunes?.artworkUrl100 || "").replace("100x100bb", "600x600bb");
  const artworkUrl = String(extra?.artworkUrl || "").trim() || itunesArt || dzDetail?.album?.cover_big || deezerHit?.album?.cover_big || deezerHit?.album?.cover_medium || thumbUrl;
  const permanentDzPreview = deezerId ? `https://locket-tommm-studio.khoinguyennguyen85.workers.dev/studio/preview.mp3?dz=${deezerId}` : "";
  const previewUrl = String(extra?.previewUrl || "").trim() || effItunes?.previewUrl || permanentDzPreview || dzDetail?.preview || deezerHit?.preview || "";
  const appleMusicUrl = String(extra?.appleMusicUrl || "").trim() || effItunes?.trackViewUrl || "";
  const appleMusicId = String(extra?.appleMusicId || effItunes?.trackId || amId || "").trim();
  const spotifyUrl = "";
  const finalTitle = String(appleMeta?.trackName || extra?.title || "").trim() || title;
  const finalArtist = String(appleMeta?.artistName || extra?.artist || "").trim() || artist;
  const songId = appleMusicId || (deezerId || (videoId || spId || "query"));

  let colors = ["#1E1B4B", "#4C1D95"];
  if (artworkUrl) {
    try {
      const imgRes = await fetch(artworkUrl, { headers: searchHeaders, signal: AbortSignal.timeout(3000) });
      if (imgRes.ok) {
        const buf = new Uint8Array(await imgRes.arrayBuffer());
        colors = extractDominantColorsFromJpeg(buf);
      }
    } catch (_) {}
  }

  const resolvedSource = spId
    ? (effItunes ? "spotify+itunes" : (deezerHit ? "spotify+deezer" : "spotify"))
    : (amId
      ? "apple_music+itunes"
      : (effItunes ? "youtube+itunes" : (deezerHit ? "youtube+deezer" : "youtube_oembed")));

  const track = {
    schemaVer: 5,
    videoId: videoId || "",
    spotifyId: spId || "",
    songId,
    appleMusicId,
    deezerId,
    title: finalTitle,
    artist: finalArtist,
    artworkUrl,
    previewUrl,
    spotifyUrl,
    appleMusicUrl,
    isrc,
    colors,
    source: resolvedSource,
    ts: Date.now(),
  };
  if (cacheKey) {
    if (YT_TRACK_CACHE.size > 50) {
      const firstKey = YT_TRACK_CACHE.keys().next().value;
      if (firstKey) YT_TRACK_CACHE.delete(firstKey);
    }
    YT_TRACK_CACHE.set(cacheKey, track);
  }
  LAST_YT_TRACK = track;
  return track;
}

function parseHexRgb(hexStr, fallback) {
  const clean = String(hexStr || "").replace(/[^0-9a-fA-F]/g, "");
  if (clean.length !== 6) return fallback;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function mixRgb(a, b, t) {
  return [
    Math.max(0, Math.min(255, Math.round(a[0] * (1 - t) + b[0] * t))),
    Math.max(0, Math.min(255, Math.round(a[1] * (1 - t) + b[1] * t))),
    Math.max(0, Math.min(255, Math.round(a[2] * (1 - t) + b[2] * t))),
  ];
}

function renderDynamicVinylGif(hex0, hex1, rawMode) {
  const mode = rawMode === "wave" ? "wave" : "peek";
  const c0Hex = /^[0-9a-fA-F]{6}$/.test(String(hex0 || "")) ? String(hex0).toUpperCase() : "1E1B4B";
  const c1Hex = /^[0-9a-fA-F]{6}$/.test(String(hex1 || "")) ? String(hex1).toUpperCase() : "4C1D95";
  const cacheKey = `${c0Hex}_${c1Hex}_${mode}`;
  if (VINYL_GIF_CACHE.has(cacheKey)) return VINYL_GIF_CACHE.get(cacheKey);

  const rawC0 = parseHexRgb(c0Hex, [30, 27, 75]);
  const rawC1 = parseHexRgb(c1Hex, [76, 29, 149]);
  // Keep background deep enough so white caption text stays high-contrast
  const bgA = mixRgb(rawC0, [10, 10, 14], 0.34);
  const bgB = mixRgb(rawC1, [16, 16, 22], 0.28);

  const palette = [];
  // 0..11: 12 smooth gradient shades
  for (let i = 0; i < 12; i++) palette.push(mixRgb(bgA, bgB, i / 11));
  // 12..21: 10 crisp dark-to-silver specular vinyl LP shades so spinning grooves pop visibly
  palette.push(
    [10, 10, 14],
    [18, 19, 24],
    [28, 30, 38],
    [42, 45, 56],
    [60, 64, 78],
    [84, 89, 106],
    [114, 120, 140],
    [148, 154, 174],
    [184, 190, 208],
    [218, 224, 238]
  );
  // 22..27: 6 center-label & rotating-notch shades derived from song colors + gold accent + crisp white dot
  const lblLight = mixRgb(rawC1, [255, 236, 188], 0.45);
  palette.push(
    mixRgb(rawC0, [24, 24, 28], 0.12),
    mixRgb(rawC0, rawC1, 0.5),
    mixRgb(rawC1, [24, 24, 28], 0.08),
    lblLight,
    [232, 192, 68],
    [248, 250, 255]
  );
  // 28..31: 4 bright equalizer bar & soft sparkle tints (distinct against dark gradient, softer than #FFFFFF text)
  const eqBase = mixRgb(rawC1, [255, 255, 255], 0.56);
  palette.push(
    mixRgb(bgB, eqBase, 0.50),
    mixRgb(bgB, eqBase, 0.72),
    mixRgb(eqBase, [255, 255, 255], 0.30),
    mixRgb(eqBase, [255, 255, 255], 0.65)
  );

  const W = 200;
  const H = 48;
  const FRAMES = 12;
  const CX = 178;
  const CY = 24;
  const R_DISC = 23.0;
  const out = [];

  const pushU16 = (v) => { out.push(v & 0xff, (v >> 8) & 0xff); };
  const pushStr = (s) => { for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i)); };

  // GIF89a Header + Logical Screen Descriptor (32 colors => packed=0xF4, size bits = 4)
  pushStr("GIF89a");
  pushU16(W);
  pushU16(H);
  out.push(0xF4, 0x00, 0x00);
  for (let i = 0; i < 32; i++) {
    const c = palette[i];
    out.push(c[0], c[1], c[2]);
  }
  // Netscape 2.0 infinite loop extension
  out.push(0x21, 0xFF, 0x0B);
  pushStr("NETSCAPE2.0");
  out.push(0x03, 0x01, 0x00, 0x00, 0x00);

  function encodeLzw(indices) {
    const minCodeSize = 5;
    const clearCode = 32;
    const eoiCode = 33;
    let codeSize = 6;
    let nextCode = 34;
    let dict = new Map();
    const bytes = [];
    let bitBuf = 0;
    let bitCount = 0;

    const emit = (code, bits) => {
      bitBuf |= (code & ((1 << bits) - 1)) << bitCount;
      bitCount += bits;
      while (bitCount >= 8) {
        bytes.push(bitBuf & 0xff);
        bitBuf >>= 8;
        bitCount -= 8;
      }
    };

    emit(clearCode, codeSize);
    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      const key = (prefix << 6) | k;
      const hit = dict.get(key);
      if (hit !== undefined) {
        prefix = hit;
      } else {
        emit(prefix, codeSize);
        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
        } else {
          emit(clearCode, codeSize);
          dict = new Map();
          nextCode = 34;
          codeSize = 6;
        }
        prefix = k;
      }
    }
    emit(prefix, codeSize);
    emit(eoiCode, codeSize);
    if (bitCount > 0) bytes.push(bitBuf & 0xff);

    out.push(minCodeSize);
    for (let i = 0; i < bytes.length; i += 255) {
      const chunkLen = Math.min(255, bytes.length - i);
      out.push(chunkLen);
      for (let j = 0; j < chunkLen; j++) out.push(bytes[i + j]);
    }
    out.push(0x00);
  }

  const pixels = new Uint8Array(W * H);
  const sparkPoints = [[34, 8], [88, 10], [142, 7], [178, 11]];
  for (let f = 0; f < FRAMES; f++) {
    const theta = (2 * Math.PI * f) / FRAMES;
    // Graphic Control Extension (80ms = delay 8 * 10ms)
    out.push(0x21, 0xF9, 0x04, 0x04);
    pushU16(8);
    out.push(0x00, 0x00);
    // Image Descriptor
    out.push(0x2C);
    pushU16(0);
    pushU16(0);
    pushU16(W);
    pushU16(H);
    out.push(0x00);

    const eqLimitX = mode === "wave" ? 192 : 150;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        // Base gradient index
        const gx = Math.min(11, Math.max(0, Math.round((x / (W - 1)) * 9 + (y / (H - 1)) * 2)));
        let idx = gx;

        // Multi-harmonic equalizer bars (6..20px tall) rising from bottom edge
        if (x >= 8 && x < eqLimitX && y >= H - 22 && y < H - 2) {
          const mod = (x - 8) % 5;
          if (mod < 3) {
            const barId = Math.floor((x - 8) / 5);
            const w1 = Math.sin(theta + barId * 0.72);
            const w2 = Math.sin(2 * theta - barId * 1.15);
            const w3 = Math.cos(theta + barId * 2.1);
            const wave = Math.max(0, Math.min(1, 0.5 + 0.30 * w1 + 0.14 * w2 + 0.06 * w3));
            const barH = 6 + Math.round(wave * 14);
            const topY = H - 2 - barH;
            if (y >= topY) {
              const distFromTop = y - topY;
              idx = distFromTop < 3 ? 31 : (distFromTop < 7 ? 30 : (distFromTop < 12 ? 29 : 28));
            }
          }
        }

        if (mode === "wave") {
          for (let sp = 0; sp < sparkPoints.length; sp++) {
            const sy = sparkPoints[sp][1] + Math.round(Math.sin(theta + sp * 1.3));
            if (x === sparkPoints[sp][0] && y === sy) {
              const pulse = 0.5 + 0.5 * Math.cos(theta + sp * 1.5);
              idx = pulse > 0.5 ? 30 : 29;
            }
          }
        } else {
          // Crisp glowing vinyl LP disc spinning visibly on the right side
          const dx = x - CX;
          const dy = y - CY;
          const r = Math.hypot(dx, dy);
          if (r <= R_DISC) {
            const angle = Math.atan2(dy, dx);
            if (r <= 2.4) {
              idx = 12;
            } else if (r <= 8.5) {
              const rotNotch = Math.cos(angle - theta);
              const tLbl = 0.5 + 0.5 * Math.sin(angle - theta);
              if (rotNotch > 0.55 && r > 3.2) {
                idx = rotNotch > 0.80 ? 27 : 26;
              } else {
                idx = 22 + Math.min(3, Math.floor(tLbl * 3.99));
              }
            } else {
              const groove = 0.5 + 0.5 * Math.sin(r * 1.95);
              const c = Math.max(0, Math.cos(2 * (angle - theta + 0.55)));
              const sheen = c * c * c;
              let tone = 0.22 * groove + 0.78 * sheen;
              if (r > R_DISC - 1.3) tone = Math.max(tone, 0.70);
              idx = 12 + Math.min(9, Math.max(0, Math.floor(tone * 9.99)));
            }
          }
        }
        pixels[y * W + x] = idx;
      }
    }
    encodeLzw(pixels);
  }
  out.push(0x3B);

  const buf = new Uint8Array(out);
  if (VINYL_GIF_CACHE.size >= 30) {
    const first = VINYL_GIF_CACHE.keys().next().value;
    if (first) VINYL_GIF_CACHE.delete(first);
  }
  VINYL_GIF_CACHE.set(cacheKey, buf);
  return buf;
}

  // 2.35 YouTube / YT Music -> Locket Music Caption Auto Sync + Schema Inspector
  if (url.pathname === "/studio/yt-now-playing") {
    if (request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, track: LAST_YT_TRACK }), {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
    if (request.method === "POST") {
      const b = await request.json().catch(() => ({}));
      const vid = String(b?.videoId || b?.video_id || "").trim();
      const q = String(b?.query || b?.q || "").trim();
      const spId = String(b?.spotifyId || b?.spotify_id || "").trim();
      const amId = String(b?.appleId || b?.apple_id || b?.appleMusicId || "").trim();
      const validVid = /^[A-Za-z0-9_-]{11}$/.test(vid) ? vid : "";
      if (!validVid && !q && !spId && !amId) {
        return new Response(JSON.stringify({ ok: false, error: "invalid_video_id" }), {
          status: 400,
          headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
        });
      }
      const track = await resolveYoutubeTrack(validVid, q, env, {
        spotifyId: spId,
        appleId: amId,
        country: String(b?.country || "vn").trim(),
        title: String(b?.title || "").trim(),
        artist: String(b?.artist || "").trim(),
        previewUrl: String(b?.previewUrl || b?.preview_url || "").trim(),
        appleMusicUrl: String(b?.appleMusicUrl || b?.apple_music_url || "").trim(),
        appleMusicId: String(b?.appleMusicId || amId || "").trim(),
        artworkUrl: String(b?.artworkUrl || b?.artwork_url || "").trim(),
      });
      return new Response(JSON.stringify({ ok: true, track }), {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
  }

  if (url.pathname === "/studio/vinyl-bg.gif" && request.method === "GET") {
    const c0 = url.searchParams.get("c0") || "1E1B4B";
    const c1 = url.searchParams.get("c1") || "4C1D95";
    const mode = url.searchParams.get("mode") || "peek";
    const gifBytes = renderDynamicVinylGif(c0, c1, mode);
    return new Response(gifBytes, {
      status: 200,
      headers: corsHeaders({
        "Content-Type": "image/gif",
        "Cache-Control": "public, max-age=86400",
      }),
    });
  }

  if (url.pathname === "/studio/preview.mp3" && request.method === "GET") {
    const dz = (url.searchParams.get("dz") || "").replace(/\D/g, "");
    if (!dz) {
      return new Response("missing dz", { status: 400, headers: corsHeaders() });
    }
    try {
      const dr = await fetch(`https://api.deezer.com/track/${dz}`, {
        headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)", Accept: "application/json" },
        signal: AbortSignal.timeout(3500),
      });
      if (dr.ok) {
        const dj = await dr.json().catch(() => null);
        if (dj && typeof dj.preview === "string" && dj.preview.startsWith("http")) {
          return new Response(null, {
            status: 302,
            headers: corsHeaders({
              Location: dj.preview,
              "Cache-Control": "no-store",
            }),
          });
        }
      }
    } catch (_) {}
    return new Response("preview not found", { status: 404, headers: corsHeaders() });
  }

  if (url.pathname === "/studio/music-schema-log") {
    if (request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, schema: LAST_MUSIC_SCHEMA }), {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
    if (request.method === "POST") {
      const b = await request.json().catch(() => ({}));
      LAST_MUSIC_SCHEMA = { schema: b, ts: new Date().toISOString() };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
  }

  if (url.pathname === "/studio/rc-camera-debug") {
    if (request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, debug: LAST_RC_CAMERA_DEBUG }), {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
    if (request.method === "POST") {
      const b = await request.json().catch(() => ({}));
      LAST_RC_CAMERA_DEBUG = { snapshot: b, ts: new Date().toISOString() };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
  }

  // 2.4 ENDPOINT RIÊNG cho APP CỦA BẠN (không qua Locket, không eligibility).
  // POST /studio/caption  -> AI nhìn ảnh sinh caption THẬT, trả JSON gọn: {ok, type, text, source}.
  // Nhận ảnh qua: multipart field "image" (file) HOẶC JSON {image_base64:"...", type:"breaking_news|quote"}.
  // Dùng CHÍNH generateCaptionWithVision (CF vision -> NVIDIA -> Groq -> Gemini -> tĩnh).
  if (request.method === "POST" && url.pathname === "/studio/caption") {
    let imgBytes = null;
    let captionType = url.searchParams.get("type") || "breaking_news";
    const ct = (request.headers.get("Content-Type") || "").toLowerCase();
    try {
      if (ct.includes("multipart/form-data")) {
        const form = await request.formData();
        const t = form.get("type");
        if (typeof t === "string" && t) captionType = t;
        const file = form.get("image") || form.get("photo") || form.get("file");
        if (file && typeof file.arrayBuffer === "function") {
          imgBytes = new Uint8Array(await file.arrayBuffer());
        }
      } else {
        const b = await request.json().catch(() => ({}));
        if (b && typeof b.type === "string" && b.type) captionType = b.type;
        let b64 = b && (b.image_base64 || b.imageBase64 || b.image || b.base64);
        if (typeof b64 === "string" && b64.length > 100) {
          const comma = b64.indexOf(",");
          if (b64.startsWith("data:") && comma > -1) b64 = b64.slice(comma + 1);
          imgBytes = base64ToUint8Array(b64);
        }
      }
    } catch (_) {}

    if (!imgBytes || imgBytes.length < 50) {
      return new Response(JSON.stringify({ ok: false, error: "no_image", hint: "Gửi field 'image' (file) hoặc JSON {image_base64}" }), {
        status: 400,
        headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }

    const tempId = crypto.randomUUID().slice(0, 12);
    const isQ = String(captionType).toLowerCase().includes("quote");
    const result = await generateCaptionWithVision(env, captionType, imgBytes, null, url.origin, tempId);
    // Lọc câu "từ chối" của model -> thay bằng caption vui (app không bao giờ hiện 'xin lỗi, tôi là AI...').
    let outText = result.text;
    let outSource = result.source;
    if (isCaptionRefusal(outText)) {
      const fbNews = ["TIN NÓNG: PHÁT HIỆN NHÂN VẬT CHÍNH ĐANG CHILL HẾT NẤC", "KHẨN CẤP: GƯƠNG MẶT ĐÁNG YÊU VƯỢT MỨC CHO PHÉP", "TIN NÓNG: MỘT NGÀY ĐẸP TRỜI VỪA ĐƯỢC GHI LẠI"];
      const fbQuote = ["Bình yên đôi khi chỉ là một tấm ảnh chụp vội.", "Sống chậm lại một nhịp để giữ trọn khoảnh khắc này.", "Hôm nay trời đẹp, lòng cũng nhẹ tênh."];
      const list = isQ ? fbQuote : fbNews;
      outText = list[Math.floor(Math.random() * list.length)];
      outSource = "fallback_refusal";
    }
    return new Response(JSON.stringify({
      ok: true,
      type: isQ ? "quote" : "breaking_news",
      text: outText,
      source: outSource,
    }), {
      status: 200,
      headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
    });
  }

  // 2.5 Handle Locket /generateCaption (LNN LIVE Tin nong & Trich dan)
  if (request.method === "POST" && url.pathname.includes("generateCaption")) {
    const t0 = Date.now();
    const rawBodyText = await request.text();
    let bodyObj = {};
    try {
      bodyObj = JSON.parse(rawBodyText || "{}");
    } catch (_) {}
    const dataNode = bodyObj && typeof bodyObj.data === "object" ? bodyObj.data : bodyObj;
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const origHost = request.headers.get("X-Locket-Orig-Host") || "api.locketcamera.com";
    const upstreamUrl = `https://${origHost}${url.pathname}${url.search}`;
    const fwdHeaders = new Headers();
    for (const [k, v] of request.headers.entries()) {
      const kl = k.toLowerCase();
      if (kl === "host" || kl === "content-length" || kl === "x-locket-orig-host" || kl.startsWith("cf-")) continue;
      fwdHeaders.set(k, v);
    }

    const captionType = firstNonEmptyString([
      dataNode?.caption_type,
      dataNode?.captionType,
      dataNode?.type,
      dataNode?.overlay_type,
      dataNode?.overlayType,
      dataNode?.overlay_id,
      dataNode?.overlayId,
      dataNode?.style,
      dataNode?.analytics?.caption_type,
      dataNode?.analytics?.overlay_id,
      typeof dataNode?.prompt === "string" && /quote|trích dẫn/i.test(dataNode.prompt) ? "quote" : "",
      typeof dataNode?.prompt === "string" && /news|breaking|headline|tin nóng/i.test(dataNode.prompt) ? "breaking_news" : "",
    ]);

    let upStatus = 0;
    let upText = "";
    if (Date.now() >= UPSTREAM_CAPTION_BLOCKED_UNTIL) {
      try {
        // Forward lên server gốc với timeout NGẮN (800ms) — nếu account có quyền thì passthrough thật;
        // nếu chậm/401 (thường gặp) thì cache block 30' để các request sau bỏ qua ngay, giảm độ trễ.
        const upRes = await fetch(upstreamUrl, { method: "POST", headers: fwdHeaders, body: rawBodyText, signal: AbortSignal.timeout(800) });
        upStatus = upRes.status;
        upText = await upRes.text();
        let parsedUp = null;
        try { parsedUp = JSON.parse(upText); } catch (_) {}
        const upResult = parsedUp?.result || parsedUp || {};
        const hasErrors =
          !upRes.ok ||
          !parsedUp ||
          !!upResult.error ||
          !!parsedUp.error ||
          (Array.isArray(upResult.errors) && upResult.errors.length > 0) ||
          (Array.isArray(parsedUp.errors) && parsedUp.errors.length > 0) ||
          (typeof upResult.status === "number" && upResult.status >= 400) ||
          /requires_gold|permission-denied|unauthenticated/i.test(upText);
        if (!hasErrors) {
          LAST_CAPTION_DEBUG = {
            mode: "official_passthrough",
            captionType,
            reqKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
            upStatus,
            upKeys: Object.keys(upResult.data || upResult || {}),
            ts: new Date().toISOString(),
          };
          return new Response(upText, {
            status: upRes.status,
            headers: corsHeaders({
              "Content-Type": upRes.headers.get("Content-Type") || "application/json; charset=utf-8",
            }),
          });
        }
        UPSTREAM_CAPTION_BLOCKED_UNTIL = Date.now() + 30 * 60 * 1000;
      } catch (e) {
        upText = String(e?.message || e);
        UPSTREAM_CAPTION_BLOCKED_UNTIL = Date.now() + 30 * 60 * 1000;
      }
    } else {
      upText = "skipped_cached_block";
    }

    const tempId = crypto.randomUUID().slice(0, 12);
    const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);

    // Locket 2.74.0 gửi response_format (JSON schema CỤ THỂ cho quote) hoặc null (cho breaking_news) + prompt.
    const appPrompt = typeof dataNode?.prompt === "string" ? dataNode.prompt : "";
    const rf = dataNode?.response_format || null;
    const rfSchema = rf?.schema || rf?.json_schema?.schema || rf || null;
    const hasSchema = !!(rfSchema && typeof rfSchema === "object" && Object.keys(rfSchema).length > 0);

    let sd;
    let outStr;
    let usedSource;
    let usedErr;
    if (hasSchema) {
      const structured = await generateStructuredCaption(env, appPrompt, rfSchema, imgBytes, sourceUrl, url.origin, tempId, captionType);
      sd = structured.data;
      outStr = JSON.stringify(sd);
      usedSource = structured.source;
      usedErr = structured.err;
    } else {
      const plain = await generateCaptionWithVision(env, captionType || "breaking_news", imgBytes, sourceUrl, url.origin, tempId, appPrompt);
      outStr = plain.text;
      sd = { caption: outStr, text: outStr, headline: outStr };
      usedSource = plain.source;
      usedErr = plain.aiErr;
    }

    const mode = CAPTION_MODE_OVERRIDE || (env && env.CAPTION_RESPONSE_MODE) || "smart_locket";
    const reqModel = (dataNode && dataNode.model) || "gpt-5.4";

    LAST_CAPTION_DEBUG = {
      mode: hasSchema ? "structured_caption" : "plain_caption",
      responseMode: mode,
      source: usedSource,
      aiErr: usedErr || null,
      captionType,
      hasSchema,
      schemaTop: rfSchema && rfSchema.properties ? Object.keys(rfSchema.properties) : [],
      rfFull: rf ? JSON.stringify(rf).slice(0, 1200) : null,
      reqKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
      reqModel,
      promptPreview: appPrompt.slice(0, 160),
      got_input: !!(imgBytes || sourceUrl),
      input_bytes: imgBytes ? imgBytes.length : 0,
      upStatus,
      upBody: upText.slice(0, 300),
      ms: Date.now() - t0,
      generated: outStr.slice(0, 1200),
      ts: new Date().toISOString(),
    };

    let finalBody;
    if (!hasSchema && (mode === "smart_locket" || mode.startsWith("quote_") || mode === "result_data_caption_only")) {
      // Định dạng ĐÃ XÁC NHẬN CHẠY THẬT cho LNN LIVE trên Locket 2.74.0
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: { caption: outStr },
        },
      });
    } else if (hasSchema && mode === "smart_locket") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: Object.assign({}, sd, {
            caption: outStr,
            structured_output: sd,
            structured_caption: sd,
            parsed: sd,
            response: sd,
          }),
        },
      });
    } else if (hasSchema && mode === "quote_caption_obj") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: Object.assign({ caption: sd }, sd),
        },
      });
    } else if (hasSchema && mode === "quote_pure_parsed") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: sd,
        },
      });
    } else if (mode === "quote_caption_str" || mode === "result_data_caption_only") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: { caption: outStr },
        },
      });
    } else if (mode === "bare") {
      finalBody = outStr;
    } else if (mode === "result_openai_resp") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          id: "resp_" + tempId,
          object: "response",
          status_text: "completed",
          model: reqModel,
          output_text: outStr,
          output: [{
            id: "msg_" + tempId,
            type: "message",
            status: "completed",
            role: "assistant",
            content: [{ type: "output_text", text: outStr, annotations: [] }],
          }],
        },
      });
    } else if (mode === "result_data_caption_only") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: { caption: outStr },
        },
      });
    } else if (mode === "data_object_full") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: Object.assign({}, hasSchema ? sd : {}, {
            caption: outStr,
            text: outStr,
            output_text: outStr,
            outputText: outStr,
            generated_caption: outStr,
            generatedCaption: outStr,
            headline: outStr,
            title: outStr,
            response: outStr,
            content: outStr,
            raw_text: outStr,
            captions: [outStr],
            choices: [{ index: 0, message: { role: "assistant", content: outStr, refusal: null }, finish_reason: "stop" }],
          }),
        },
      });
    } else if (mode === "data_openai_resp") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: {
            id: "resp_" + tempId,
            object: "response",
            status: "completed",
            model: reqModel,
            output_text: outStr,
            output: [{
              id: "msg_" + tempId,
              type: "message",
              status: "completed",
              role: "assistant",
              content: [{ type: "output_text", text: outStr, annotations: [] }],
            }],
          },
        },
      });
    } else if (mode === "data_parsed") {
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: hasSchema ? sd : { caption: outStr, text: outStr, headline: outStr },
        },
      });
    } else {
      // data_string
      finalBody = JSON.stringify({
        result: {
          status: 200,
          data: outStr,
          caption: outStr,
          text: outStr,
          output_text: outStr,
          generated_caption: outStr,
          content: outStr,
        },
      });
    }

    return new Response(finalBody, {
      status: 200,
      headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
    });
  }

  // 3. Handle Locket generateFilteredImage / generateFilter / applyFilter / createFilter (Tạo diện mạo)
  if (
    request.method === "POST" &&
    /(generateFilteredImage|generateFilter|applyFilter|createFilter|createCustomFilter|generateCustomFilter|createCameraFilter|createAiFilter|generateAiFilter|createUserFilter|saveFilter|saveCustomFilter|createLook|generateLook|customFilter|customFilters|userFilters|validateFilter|checkFilter)/i.test(
      url.pathname
    )
  ) {
    const rawBodyText = await request.text();
    let bodyObj = {};
    try {
      bodyObj = JSON.parse(rawBodyText || "{}");
    } catch (_) {}

    const dataNode = bodyObj && typeof bodyObj.data === "object" ? bodyObj.data : bodyObj;
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";

    // Nếu Locket gọi createFilter/createCustomFilter (Tạo diện mạo):
    // Thử forward lên server gốc Locket trước (nếu thành công trả nguyên phản hồi thật!),
    // nếu server gốc từ chối (requires_gold/403/401/error) mới tạo template custom trên Worker và lưu chi tiết vào LAST_DEBUG.
    const isCreateMeta = /(createFilter|createCustomFilter|createCameraFilter|createAiFilter|createUserFilter|saveFilter|saveCustomFilter|createLook|customFilter|customFilters|userFilters|validateFilter|checkFilter)/i.test(
      url.pathname
    );
    if (isCreateMeta) {
      const { bytes: peekImg, sourceUrl: peekUrl } = await getInputImageBytes(dataNode, authHeader);
      if (!peekImg && !peekUrl) {
        const ui = dataNode?.user_input || dataNode?.userInput || {};
        const rawPrompt = firstNonEmptyString([
          typeof ui === "string" ? ui : "",
          ui?.prompt,
          ui?.text,
          ui?.description,
          ui?.look,
          ui?.custom_prompt,
          ui?.customPrompt,
          dataNode?.customPrompt,
          dataNode?.custom_prompt,
          dataNode?.prompt,
          dataNode?.description,
          dataNode?.text,
        ]) || "Custom AI Look";
        const origHostMeta = request.headers.get("X-Locket-Orig-Host") || "api.locketcamera.com";
        const upUrlMeta = `https://${origHostMeta}${url.pathname}${url.search}`;
        const fwdMetaHdrs = new Headers();
        for (const [k, v] of request.headers.entries()) {
          const kl = k.toLowerCase();
          if (kl === "host" || kl === "content-length" || kl === "x-locket-orig-host" || kl.startsWith("cf-")) continue;
          fwdMetaHdrs.set(k, v);
        }
        let upStatus = 0;
        let upKeys = [];
        let upErrSnippet = "";
        try {
          const upRes = await fetch(upUrlMeta, { method: "POST", headers: fwdMetaHdrs, body: rawBodyText, signal: AbortSignal.timeout(4500) });
          upStatus = upRes.status;
          const upTxt = await upRes.text();
          let upJson = null;
          try { upJson = JSON.parse(upTxt); } catch (_) {}
          const upNode = upJson?.result?.data || upJson?.result || upJson?.data || upJson || {};
          if (upNode && typeof upNode === "object") upKeys = Object.keys(upNode);
          const blocked = !upRes.ok || !upJson || !!upJson.error || !!upJson.result?.error || (typeof upJson.result?.status === "number" && upJson.result.status >= 400) || /requires_gold|permission-denied|unauthenticated|error/i.test(upTxt);
          if (!blocked) {
            const upIds = [
              upNode?.id, upNode?.uid, upNode?.filter_id, upNode?.filterId,
              upJson?.result?.filter?.id, upJson?.result?.filter?.uid, upJson?.id, upJson?.uid,
            ].filter((v) => typeof v === "string" && v.trim());
            for (const cid of [...new Set(upIds)]) {
              await putCustomLookPrompt(cid.trim(), rawPrompt, state);
            }
            LAST_DEBUG = {
              mode: "create_filter_upstream_ok",
              path: url.pathname,
              upStatus,
              upKeys,
              savedIds: [...new Set(upIds)],
              reqKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
              uiKeys: ui && typeof ui === "object" ? Object.keys(ui) : typeof ui,
              ts: new Date().toISOString(),
            };
            return new Response(upTxt, {
              status: upRes.status,
              headers: corsHeaders({ "Content-Type": upRes.headers.get("Content-Type") || "application/json; charset=utf-8" }),
            });
          }
          upErrSnippet = upTxt.slice(0, 220);
        } catch (e) {
          upErrSnippet = String(e?.message || e).slice(0, 140);
        }

        const newId = "custom_" + crypto.randomUUID().slice(0, 8);
        const nowIso = new Date().toISOString();
        const name = firstNonEmptyString([dataNode?.name, dataNode?.title, ui?.name, ui?.title]) || rawPrompt.slice(0, 28);
        const iconImg = "https://tommm1207.github.io/locket-tommm-studio/assets/filters_v2/ai_cartoon_3d.png?v=2";
        const styleVal = (typeof dataNode?.style === "string" && dataNode.style) ? dataNode.style : "cutout";
        const filterObj = {
          uid: newId,
          id: newId,
          filter_id: newId,
          filterId: newId,
          name,
          category: "Tạo diện mạo ✨",
          prompt: rawPrompt,
          custom_prompt: rawPrompt,
          user_input: rawPrompt,
          style: styleVal,
          type: "normal",
          filter_type: styleVal,
          filterType: styleVal,
          status: "ready",
          created_at: nowIso,
          createdAt: nowIso,
          updated_at: nowIso,
          updatedAt: nowIso,
          overlay: true,
          image_url: iconImg,
          imageUrl: iconImg,
          icon_url: iconImg,
          iconUrl: iconImg,
          overlay_image_url: iconImg,
          overlayImageUrl: iconImg,
          overlayImageURL: iconImg,
          tint_color: "#F59E0B",
          tintColor: "#F59E0B",
          text_color: "#FFFFFF",
          textColor: "#FFFFFF",
          colors: ["#F59E0B", "#EC4899"],
          capture_button_colors: ["#F59E0B", "#EC4899"],
          captureButtonColors: ["#F59E0B", "#EC4899"],
          icon: {
            url: iconImg,
            iconUrl: iconImg,
            icon_url: iconImg,
            remoteImage: iconImg,
            remote_image: iconImg,
            sfSymbol: "sparkles",
            sf_symbol: "sparkles",
            symbol: "sparkles",
            emoji: "✨",
          },
          output_url: null,
          outputUrl: null,
          product_url: null,
          productUrl: null,
          reference_images: [],
          referenceImages: [],
          requires_gold: false,
          requiresGold: false,
          is_gold: false,
          isGold: false,
          unlocked: true,
          is_unlocked: true,
          isUnlocked: true,
          free: true,
          allowsTryFilter: true,
          allows_try_filter: true,
          tryButtonEnabled: true,
          try_button_enabled: true,
        };
        await putCustomLookPrompt(newId, rawPrompt, state);
        LAST_DEBUG = {
          mode: "create_filter_meta_fallback",
          path: url.pathname,
          upStatus,
          upErrSnippet,
          reqKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
          uiKeys: ui && typeof ui === "object" ? Object.keys(ui) : typeof ui,
          styleVal: String(dataNode?.style || "").slice(0, 40),
          rawReqSnippet: rawBodyText.slice(0, 300),
          filterId: newId,
          ts: nowIso,
        };
        return new Response(
          JSON.stringify({
            result: { status: 200, success: true, data: filterObj, filter: filterObj },
          }),
          { status: 200, headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
        );
      }
    }

    // Priority 0: AI Subject-Mask + Crisp 768x768 Weekday Depth Composite (VI / EN / TW / DE)
    const specialId = detectSpecialFilterId(dataNode, rawBodyText);
    if (specialId && WEEKDAY_DEPTH_PREFIX[specialId]) {
      const t0 = Date.now();
      const tempId = crypto.randomUUID().slice(0, 12);
      const vnDay = getVietnamWeekdayIndex();
      const binPrefix = WEEKDAY_DEPTH_PREFIX[specialId];
      const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);

      const [decodedUser, weekdayRgba, preparedMaskInput] = await Promise.all([
        decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, WD_SIZE, authHeader),
        getFrameRgba(`${binPrefix}_${vnDay}`),
        prepareAiInputImage(imgBytes, sourceUrl, url.origin, `seg_${tempId}`, authHeader),
      ]);

      const baseRgb = new Uint8Array(WD_SIZE * WD_SIZE * 3);
      if (decodedUser?.rgb) {
        drawCoverRgb(baseRgb, decodedUser.rgb, decodedUser.w, decodedUser.h, [0, 0, WD_SIZE, WD_SIZE], WD_SIZE);
      } else {
        baseRgb.fill(28);
      }

      const canvasRgb = new Uint8Array(baseRgb);
      alphaCompositeRgbaOverRgb(canvasRgb, weekdayRgba, WD_SIZE);

      let maskApplied = false;
      let fgRatio = 0;
      let segModelUsed = null;
      const segRes = await runForegroundSegMask(env, preparedMaskInput, url.origin, tempId);
      if (segRes) {
        segModelUsed = segRes.segModelUsed;
        fgRatio = segRes.fgRatio;
        if (segRes.alpha && segRes.fgRatio > 0.02 && segRes.fgRatio < 0.94) {
          compositeForegroundWithAlpha(baseRgb, canvasRgb, segRes.alpha, SIZE, WD_SIZE, false);
          maskApplied = true;
        }
      }

      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId, WD_SIZE);
      const outId = `tommm_wd_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: specialId,
        binPrefix,
        vnDay,
        segModelUsed,
        maskApplied,
        fgRatio,
        got_input: !!imgBytes,
        input_bytes: imgBytes ? imgBytes.length : 0,
        src_url: sourceUrl ? sourceUrl.slice(0, 80) : null,
        decoded_user: !!(decodedUser && decodedUser.rgb),
        decoded_wh: decodedUser ? `${decodedUser.w}x${decodedUser.h}` : null,
        prepared_mask: !!(preparedMaskInput && preparedMaskInput.bytes),
        out_mime: encoded.mimeType,
        out_bytes: encoded.bytes.length,
        ms: Date.now() - t0,
        ts: new Date().toISOString(),
      };

      return buildLocketFilterResponse(`${url.origin}/ai-filters/${outId}`);
    }

    // Priority 0.5: Special Instant 0-Neuron Worker FX (Clock+Weekday, Portrait Bokeh, CCTV Night Vision, Triple Clone)
    const specialFxId = detectSpecialFxId(dataNode, rawBodyText);
    if (specialFxId && SPECIAL_FX_IDS.has(specialFxId)) {
      const t0 = Date.now();
      const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
      const tempId = crypto.randomUUID().slice(0, 12);
      const [decodedUser, clockAtlas] = await Promise.all([
        decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, HD_SIZE, authHeader),
        specialFxId === "clock_weekday_overlay" ? getFrameRgba("clock_font_atlas").catch(() => null) : Promise.resolve(null),
      ]);

      const srcRgb = decodedUser?.rgb || new Uint8Array(HD_SIZE * HD_SIZE * 3).fill(28);
      const srcW = decodedUser?.w || HD_SIZE;
      const srcH = decodedUser?.h || HD_SIZE;
      const canvasRgb = new Uint8Array(HD_SIZE * HD_SIZE * 3);
      drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, [0, 0, HD_SIZE, HD_SIZE], HD_SIZE);

      if (specialFxId === "cctv_camera") applyCctvOverlay(canvasRgb, HD_SIZE, HD_SIZE);
      else if (specialFxId === "clock_weekday_overlay") applyClockWeekdayOverlay(canvasRgb, HD_SIZE, HD_SIZE, clockAtlas);
      else if (specialFxId === "triple_clone") applyTripleClone(canvasRgb, HD_SIZE, HD_SIZE);
      else if (specialFxId === "portrait_bokeh") applyPortraitBokeh(canvasRgb, HD_SIZE, HD_SIZE);
      else if (specialFxId === "fx_giot_nuoc") applyWaterDropletsGlass(canvasRgb, HD_SIZE, HD_SIZE, false);
      else if (specialFxId === "fx_giot_nuoc_ro") applyWaterDropletsGlass(canvasRgb, HD_SIZE, HD_SIZE, true);
      else if (specialFxId === "fx_mua_roi") applyRainOverlayGlass(canvasRgb, HD_SIZE, HD_SIZE);
      else if (specialFxId === "fx_tuyet_roi") applyBokehSnowfall(canvasRgb, HD_SIZE, HD_SIZE);

      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId, HD_SIZE);
      const outId = `tommm_fx_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "special_fx",
        filterId: specialFxId,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
        out_size: HD_SIZE,
        out_mime: encoded.mimeType,
        out_bytes: encoded.bytes.length,
        ms: Date.now() - t0,
        ts: new Date().toISOString(),
      };

      return buildLocketFilterResponse(`${url.origin}/ai-filters/${outId}`);
    }

    const filterId = detectFilterId(dataNode, rawBodyText);

    // Priority 1: Pixel-exact PNG Frames & 4-Cut Photobooth (100% original face)
    if (filterId && FRAMES_MANIFEST[filterId]) {
      const t0 = Date.now();
      const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
      const tempId = crypto.randomUUID().slice(0, 12);

      let frameKey = filterId;
      const randTotal = RANDOM_VARIANT_FRAMES[filterId] || 0;
      if (randTotal > 1) {
        const prevIdx = LAST_RANDOM_VARIANT.get(filterId);
        let idx = Math.floor(Math.random() * randTotal);
        if (idx === prevIdx) idx = (idx + 1 + Math.floor(Math.random() * (randTotal - 1))) % randTotal;
        LAST_RANDOM_VARIANT.set(filterId, idx);
        frameKey = `${filterId}_${idx}`;
      }

      const [decodedUser, frameRgba] = await Promise.all([
        decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, HD_SIZE, authHeader),
        getFrameRgba(frameKey).catch(() => getFrameRgba(filterId)),
      ]);

      const srcRgb = decodedUser?.rgb || new Uint8Array(HD_SIZE * HD_SIZE * 3).fill(28);
      const srcW = decodedUser?.w || HD_SIZE;
      const srcH = decodedUser?.h || HD_SIZE;

      const manifest = FRAMES_MANIFEST[filterId];
      const canvasRgb = new Uint8Array(HD_SIZE * HD_SIZE * 3);
      const scaleBox = (b) => [
        Math.round((b[0] * HD_SIZE) / SIZE),
        Math.round((b[1] * HD_SIZE) / SIZE),
        Math.round((b[2] * HD_SIZE) / SIZE),
        Math.round((b[3] * HD_SIZE) / SIZE),
      ];
      let pbDebug = null;

      if (manifest.is4Cut) {
        // Multi-shot stateful 4-Cut Photobooth (giống Video 3: chụp từng kiểu 1 -> 2 -> 3 -> 4 rồi tự reset)
        const windows = manifest.windows || [];
        const userKey = getPhotoboothUserKey(request, authHeader);
        const sessKey = `${userKey}:${filterId}`;
        const existing = PHOTOBOOTH_SESSIONS.get(sessKey);
        const sess = (existing && Date.now() - existing.ts < 180000)
          ? existing
          : { shots: [], ts: Date.now() };
        sess.shots.push({ rgb: new Uint8Array(srcRgb), w: srcW, h: srcH });
        sess.ts = Date.now();
        const shotNum = sess.shots.length;

        // Nền pastel trung tính cho các ô chưa chụp
        for (let p = 0; p < canvasRgb.length; p += 3) {
          canvasRgb[p] = 242;
          canvasRgb[p + 1] = 238;
          canvasRgb[p + 2] = 245;
        }
        for (let idx = 0; idx < windows.length; idx++) {
          if (idx < sess.shots.length) {
            const shot = sess.shots[idx];
            drawCoverRgb(canvasRgb, shot.rgb, shot.w, shot.h, scaleBox(windows[idx]), HD_SIZE);
          }
        }
        if (shotNum >= windows.length) {
          PHOTOBOOTH_SESSIONS.delete(sessKey);
        } else {
          PHOTOBOOTH_SESSIONS.set(sessKey, sess);
        }
        pbDebug = { mode: "multi_shot", shot: shotNum, total: windows.length, completed: shotNum >= windows.length };
      } else {
        const box = (manifest.windows && manifest.windows[0]) || [0, 0, SIZE, SIZE];
        drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, scaleBox(box), HD_SIZE);
      }

      const frameSrcSize = Math.round(Math.sqrt(frameRgba.length / 4)) || SIZE;
      if (FX_ATMOSPHERE_MOODS[filterId]) applyKawaiiAtmosphere(canvasRgb, HD_SIZE, HD_SIZE, filterId);
      alphaCompositeRgbaScaledOverRgb(canvasRgb, frameRgba, frameSrcSize, HD_SIZE);
      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId, HD_SIZE);

      const outId = `tommm_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "png_frame",
        filterId,
        is4Cut: manifest.is4Cut,
        photobooth: pbDebug,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
        out_size: HD_SIZE,
        out_mime: encoded.mimeType,
        out_bytes: encoded.bytes.length,
        ms: Date.now() - t0,
        ts: new Date().toISOString(),
      };

      return buildLocketFilterResponse(`${url.origin}/ai-filters/${outId}`);
    }

    // Priority 1.5: Instant 0-Neuron Dazz Cam & Film LUT Color Grading (100% original face)
    const lutId = detectLutId(dataNode, rawBodyText);
    if (lutId && LUT_FILTERS[lutId]) {
      const t0 = Date.now();
      const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
      const tempId = crypto.randomUUID().slice(0, 12);
      const decodedUser = await decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, HD_SIZE, authHeader);

      const srcRgb = decodedUser?.rgb || new Uint8Array(HD_SIZE * HD_SIZE * 3).fill(28);
      const srcW = decodedUser?.w || HD_SIZE;
      const srcH = decodedUser?.h || HD_SIZE;
      const canvasRgb = new Uint8Array(HD_SIZE * HD_SIZE * 3);
      drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, [0, 0, HD_SIZE, HD_SIZE], HD_SIZE);
      applyLutToRgb(canvasRgb, HD_SIZE, HD_SIZE, LUT_FILTERS[lutId]);

      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId, HD_SIZE);
      const outId = `tommm_lut_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "lut_filter",
        filterId: lutId,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
        out_size: HD_SIZE,
        out_mime: encoded.mimeType,
        out_bytes: encoded.bytes.length,
        ms: Date.now() - t0,
        ts: new Date().toISOString(),
      };

      return buildLocketFilterResponse(`${url.origin}/ai-filters/${outId}`);
    }

    // Priority 1.6: Instant 0-Neuron Comedy Face Warp Filters (Méo mặt & Hài hước)
    const warpId = detectWarpId(dataNode, rawBodyText);
    if (warpId && WARP_FILTERS[warpId]) {
      const t0 = Date.now();
      const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
      const tempId = crypto.randomUUID().slice(0, 12);
      const decodedUser = await decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, HD_SIZE, authHeader);

      const srcRgb = decodedUser?.rgb || new Uint8Array(HD_SIZE * HD_SIZE * 3).fill(28);
      const srcW = decodedUser?.w || HD_SIZE;
      const srcH = decodedUser?.h || HD_SIZE;
      const canvasRgb = new Uint8Array(HD_SIZE * HD_SIZE * 3);
      drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, [0, 0, HD_SIZE, HD_SIZE], HD_SIZE);
      applyWarpToRgb(canvasRgb, HD_SIZE, HD_SIZE, warpId);

      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId, HD_SIZE);
      const outId = `tommm_warp_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "warp_filter",
        filterId: warpId,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
        out_size: HD_SIZE,
        out_mime: encoded.mimeType,
        out_bytes: encoded.bytes.length,
        ms: Date.now() - t0,
        ts: new Date().toISOString(),
      };

      return buildLocketFilterResponse(`${url.origin}/ai-filters/${outId}`);
    }

    // Priority 2: Official Locket AI filters -> pass through to Locket server FIRST (real official AI),
    // and fall back to Cloudflare FLUX.2 only for custom AI filters or if Locket server rejects (403/gold/credits)
    const aiReq = detectAiRequest(dataNode, rawBodyText);
    if (aiReq && aiReq.source === "dynamic_filter_id" && aiReq.filterId) {
      const savedPrompt = await getCustomLookPrompt(aiReq.filterId, state);
      if (savedPrompt) {
        aiReq.source = "custom_prompt";
        aiReq.rawUserPrompt = savedPrompt;
      }
    }
    const isCustomAi = !!(
      aiReq &&
      (CUSTOM_AI_IDS.has(aiReq.filterId) || aiReq.source === "custom_prompt" || String(aiReq.filterId || "").startsWith("custom_"))
    );
    const origHost = request.headers.get("X-Locket-Orig-Host") || "api.locketcamera.com";
    const upstreamUrl = `https://${origHost}${url.pathname}${url.search}`;
    const fwdHeaders = new Headers();
    for (const [k, v] of request.headers.entries()) {
      const kl = k.toLowerCase();
      if (kl === "host" || kl === "content-length" || kl === "x-locket-orig-host" || kl.startsWith("cf-")) continue;
      fwdHeaders.set(k, v);
    }

    if (!isCustomAi) {
      try {
        const upRes = await fetch(upstreamUrl, {
          method: "POST",
          headers: fwdHeaders,
          body: rawBodyText,
        });
        const upText = await upRes.text();
        const looksBlocked =
          !upRes.ok ||
          /requires_gold|out_of_credits|permission-denied|unauthenticated|"error"\s*:/i.test(upText);
        if (!looksBlocked && upText.includes("http")) {
          LAST_DEBUG = {
            mode: "official_passthrough",
            filterId: aiReq?.filterId || filterId || "unknown",
            origHost,
            status: upRes.status,
            ts: new Date().toISOString(),
          };
          return new Response(upText, {
            status: upRes.status,
            headers: corsHeaders({
              "Content-Type": upRes.headers.get("Content-Type") || "application/json; charset=utf-8",
            }),
          });
        }
      } catch (_) {}
    }

    // Priority 3: Cloudflare Workers AI (FLUX.2 Klein 9B / 4B) cho Custom AI 3D Hot / Custom Prompt,
    // kèm FALLBACK provider ảnh ngoài (NVIDIA img2img / Gemini) khi Cloudflare hết quota 4006.
    if (aiReq && env && (env.AI || env.CF_AI_ACCOUNTS || env.NVIDIA_IMAGE_MODEL || env.GEMINI_API_KEY)) {
      const t0 = Date.now();
      try {
        const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
        const tempId = crypto.randomUUID().slice(0, 12);
        const [preparedInput, refImg, translatedCustomEn] = await Promise.all([
          prepareAiInputImage(imgBytes, sourceUrl, url.origin, tempId, authHeader),
          REF_IMAGE_AI_IDS.has(aiReq.filterId)
            ? fetch(`https://tommm1207.github.io/locket-tommm-studio/assets/ai/${encodeURIComponent(aiReq.filterId)}.png`)
                .then(async r => (r.ok ? { bytes: new Uint8Array(await r.arrayBuffer()), mimeType: "image/png" } : null))
                .catch(() => null)
            : Promise.resolve(null),
          aiReq.source === "custom_prompt" && aiReq.rawUserPrompt
            ? translateCustomLookPromptToEn(env, aiReq.rawUserPrompt).catch(() => aiReq.rawUserPrompt)
            : Promise.resolve(null),
        ]);
        const rawEffectivePrompt = translatedCustomEn
          ? (/keep the exact same person/i.test(translatedCustomEn) ? translatedCustomEn : CUSTOM_LOOK_LOCK + translatedCustomEn)
          : (aiReq.source === "custom_prompt" && aiReq.rawUserPrompt ? CUSTOM_LOOK_LOCK + aiReq.rawUserPrompt : aiReq.prompt);
        const effectivePrompt = sanitizePromptForFlux(rawEffectivePrompt, false);

        let aiOut = null;
        let usedModel = null;
        let cfErr = null;
        const bgPreserveHarmony = BG_PRESERVE_HARMONY[aiReq.filterId] || null;
        if (bgPreserveHarmony && preparedInput && preparedInput.bytes) {
          const ai3dModel = (env && env.AI_3D_MODEL) || null;
          const ai3dOpts = (env && (env.AI_3D_STEPS || env.AI_3D_STRENGTH))
            ? { steps: env.AI_3D_STEPS ? parseInt(env.AI_3D_STEPS, 10) : undefined,
                strength: env.AI_3D_STRENGTH ? parseFloat(env.AI_3D_STRENGTH) : undefined }
            : null;
          const runBgAi = async () => {
            if (env.AI || env.CF_AI_ACCOUNTS) {
              try {
                const res = await runFluxPooled(env, effectivePrompt, preparedInput, null, ai3dModel, WD_SIZE, ai3dOpts);
                if (res && res.bytes) return res;
              } catch (err) {
                cfErr = (cfErr ? cfErr + " | " : "") + String(err?.message || err);
              }
            }
            const fb = await fallbackEditImage(env, effectivePrompt, preparedInput.bytes, preparedInput.mimeType);
            return fb && fb.bytes ? fb : null;
          };
          const [decodedUser, bgAiOut, segRes] = await Promise.all([
            decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, WD_SIZE, authHeader),
            runBgAi(),
            runForegroundSegMask(env, preparedInput, url.origin, tempId),
          ]);
          if (bgAiOut && bgAiOut.bytes) {
            aiOut = bgAiOut;
            usedModel = (bgAiOut.via && bgAiOut.via !== "binding" ? bgAiOut.via + " " : "") + (bgAiOut.aiModel || bgAiOut.model || "flux");
            if (decodedUser?.rgb && segRes?.alpha && segRes.fgRatio > 0.04 && segRes.fgRatio < 0.90) {
              const decodedAi = await decodeInputToRgb512(bgAiOut.bytes, null, url.origin, `sbg_${tempId}`, WD_SIZE);
              if (decodedAi?.rgb) {
                const origRgb = new Uint8Array(WD_SIZE * WD_SIZE * 3);
                drawCoverRgb(origRgb, decodedUser.rgb, decodedUser.w, decodedUser.h, [0, 0, WD_SIZE, WD_SIZE], WD_SIZE);
                applyLutToRgb(origRgb, WD_SIZE, WD_SIZE, bgPreserveHarmony);

                const canvasRgb = new Uint8Array(WD_SIZE * WD_SIZE * 3);
                drawCoverRgb(canvasRgb, decodedAi.rgb, decodedAi.w, decodedAi.h, [0, 0, WD_SIZE, WD_SIZE], WD_SIZE);
                compositeForegroundWithAlpha(origRgb, canvasRgb, segRes.alpha, SIZE, WD_SIZE, true);

                const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId, WD_SIZE);
                const outId = `tommm_ai_${tempId}.${encoded.ext}`;
                await putImage(outId, encoded.bytes, encoded.mimeType);
                LAST_DEBUG = {
                  mode: "ai_bg_preserve_face_lock",
                  aiModel: usedModel,
                  segModelUsed: segRes.segModelUsed,
                  maskApplied: true,
                  fgRatio: segRes.fgRatio,
                  filterId: aiReq.filterId,
                  source: aiReq.source,
                  promptPreview: effectivePrompt.slice(0, 220),
                  got_input: !!imgBytes,
                  input_bytes: preparedInput?.bytes?.length || 0,
                  out_mime: encoded.mimeType,
                  out_bytes: encoded.bytes.length,
                  ms: Date.now() - t0,
                  error: null,
                  ts: new Date().toISOString(),
                };
                return buildLocketFilterResponse(`${url.origin}/ai-filters/${outId}`);
              }
            }
          }
        }

        // FLUX với POOL: Tạo diện mạo (custom_prompt) chạy FLUX.2-klein-4B KHÔNG ép strength — cấu hình
        // GIỮ MẶT/GÓC tốt (đã xác nhận chạy ổn). 9B mạnh hơn nhưng vẽ lại cả MẶT -> lệch mặt, nên bỏ.
        // Muốn thử model/strength khác: đặt env AI_3D_MODEL / AI_3D_STRENGTH / AI_3D_STEPS.
        if (!aiOut && (env.AI || env.CF_AI_ACCOUNTS)) {
          const ai3dModel = (env && env.AI_3D_MODEL) || null;
          const ai3dOpts = (env && (env.AI_3D_STEPS || env.AI_3D_STRENGTH))
            ? { steps: env.AI_3D_STEPS ? parseInt(env.AI_3D_STEPS, 10) : undefined,
                strength: env.AI_3D_STRENGTH ? parseFloat(env.AI_3D_STRENGTH) : undefined }
            : null;
          if (!aiOut || !aiOut.bytes) {
            try {
              aiOut = await runFluxPooled(env, effectivePrompt, preparedInput, refImg, ai3dModel, null, ai3dOpts);
              usedModel = (aiOut.via && aiOut.via !== "binding" ? aiOut.via + " " : "") + aiOut.aiModel;
            } catch (err) {
              const errMsg = String(err?.message || err);
              cfErr = (cfErr ? cfErr + " | " : "") + errMsg;
              if (err?.cfCode === 3030 || /flagged|choose another prompt/i.test(errMsg)) {
                const retryPrompt = sanitizePromptForFlux(effectivePrompt, true);
                try {
                  aiOut = await runFluxPooled(env, retryPrompt, preparedInput, null, ai3dModel, null, ai3dOpts);
                  usedModel = (aiOut.via && aiOut.via !== "binding" ? aiOut.via + " " : "") + aiOut.aiModel;
                } catch (retryErr) {
                  const rMsg = String(retryErr?.message || retryErr);
                  cfErr += " | retry1: " + rMsg;
                  if (retryErr?.cfCode === 3030 || /flagged|choose another prompt/i.test(rMsg)) {
                    const isHeroLike = /cape|royal-blue|heroic|si[eê]u\s*nh[aâ]n/i.test(effectivePrompt + " " + (aiReq?.rawUserPrompt || ""));
                    const ultraSafePrompt = isHeroLike
                      ? "Edit input_image_0 keeping the exact same person, identical face, eyes, expression, hair, and background completely untouched. Dress them in stylish casual matte themed outerwear with a colorful cloth cape and jacket accents matching the requested theme. Raw candid everyday smartphone portrait."
                      : "Edit input_image_0 keeping the exact same person, identical face, eyes, expression, hair, and background completely untouched. Dress them in stylish casual matte themed outerwear and accessories matching the requested look. Raw candid everyday smartphone portrait.";
                    try {
                      aiOut = await runFluxPooled(env, ultraSafePrompt, preparedInput, null, ai3dModel, null, ai3dOpts);
                      usedModel = (aiOut.via && aiOut.via !== "binding" ? aiOut.via + " " : "") + aiOut.aiModel;
                    } catch (retry2Err) {
                      cfErr += " | retry2: " + String(retry2Err?.message || retry2Err);
                    }
                  }
                }
              }
            }
          }
        }
        // Fallback cuối: provider ảnh ngoài (NVIDIA img2img / Gemini) nếu mọi account Cloudflare đều hết.
        if ((!aiOut || !aiOut.bytes) && preparedInput && preparedInput.bytes) {
          const fb = await fallbackEditImage(env, effectivePrompt, preparedInput.bytes, preparedInput.mimeType);
          if (fb && fb.bytes) { aiOut = fb; usedModel = fb.model; }
        }

        if (aiOut && aiOut.bytes) {
          const outId = `tommm_ai_${tempId}.${aiOut.ext}`;
          await putImage(outId, aiOut.bytes, aiOut.mimeType);
          LAST_DEBUG = {
            mode: usedModel && usedModel.startsWith("gemini") ? "ai_gemini_fallback" : (isCustomAi ? "ai_flux_custom" : "ai_flux_fallback"),
            aiModel: usedModel,
            cfErr,
            filterId: aiReq.filterId,
            source: aiReq.source,
            promptPreview: effectivePrompt.slice(0, 220),
            got_input: !!imgBytes,
            input_bytes: preparedInput?.bytes?.length || 0,
            out_mime: aiOut.mimeType,
            out_bytes: aiOut.bytes.length,
            ms: Date.now() - t0,
            error: null,
            ts: new Date().toISOString(),
          };
          return buildLocketFilterResponse(`${url.origin}/ai-filters/${outId}`);
        }
        LAST_DEBUG = {
          mode: "ai_error",
          filterId: aiReq.filterId,
          promptPreview: effectivePrompt.slice(0, 220),
          cfErr,
          error: cfErr || "no_image_from_cf_or_gemini",
          ms: Date.now() - t0,
          ts: new Date().toISOString(),
        };
      } catch (err) {
        LAST_DEBUG = {
          mode: "ai_error",
          filterId: aiReq.filterId,
          error: String(err?.message || err),
          ms: Date.now() - t0,
          ts: new Date().toISOString(),
        };
      }
    }

    // Priority 4: Raw pass-through fallback
    return fetch(upstreamUrl, {
      method: "POST",
      headers: fwdHeaders,
      body: rawBodyText,
    });
  }

  return new Response(JSON.stringify({ result: { status: 200, success: true }, status: 200 }), {
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
  });
}

export class StudioRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    return handleStudioRequest(request, this.env, this.state);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Ảnh TẠM cho wsrv callback (raw_/ai_raw_/bmp_) phục vụ ở TOP-LEVEL từ Cache API, KHÔNG vào DO.
    // Lý do: khi filter đang chạy TRONG DO và await wsrv.nl resize, wsrv gọi ngược lại worker để lấy
    // ảnh này; nếu đi vào DO (xử lý tuần tự) nó kẹt sau filter -> timeout -> ảnh gốc không decode ->
    // ẢNH ĐEN. Phục vụ ở top-level (isolate khác) nên không kẹt. Ảnh KẾT QUẢ (tommm_*) vẫn vào DO.
    if (env && env.STUDIO) {
      const id = env.STUDIO.idFromName("tommm-global-studio");
      return env.STUDIO.get(id).fetch(request);
    }
    return handleStudioRequest(request, env);
  },
};
