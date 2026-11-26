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
const GITHUB_FRAMES_BIN_BASE =
  "https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main/assets/frames_bin";

const FRAMES_MANIFEST = {"frame_berry_days":{"is4Cut":true,"windows":[[36,39,244,244],[268,39,477,244],[36,262,244,471],[268,262,477,471]]},"frame_happy_snap":{"is4Cut":true,"windows":[[31,27,246,240],[267,28,482,240],[31,264,247,478],[267,264,482,478]]},"frame_sky_diary":{"is4Cut":true,"windows":[[34,31,244,243],[269,31,479,243],[34,267,244,474],[269,267,479,475]]},"photobooth_4cut":{"is4Cut":true,"windows":[[56,92,247,247],[265,92,456,247],[56,265,247,420],[265,265,456,420]]},"photobooth_cute":{"is4Cut":false,"windows":[[72,72,440,440]]},"pb_holo_4cut":{"is4Cut":true,"windows":[[26,30,245,246],[264,21,491,245],[31,262,246,495],[266,263,490,473]]},"pb_scrapbook_ripped_4cut":{"is4Cut":true,"windows":[[39,44,240,243],[273,43,475,243],[39,271,241,472],[274,272,475,471]]},"pb_ripped_paper_4cut":{"is4Cut":true,"windows":[[30,23,236,235],[273,23,481,234],[33,263,236,479],[276,261,484,479]]},"pb_denim_ripped_2x2":{"is4Cut":true,"windows":[[32,27,241,236],[271,28,480,235],[32,264,245,477],[274,260,483,481]]},"frame_classic_pb":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hello_kitty_pastel_ngot_ngao":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hello_kitty_hong_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_pastel_vien_ren":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_hoa_pastel_vien_xanh_xinh":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_spiderred":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_khong_gian_xanh_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_ngoi_sao_hong_pastel":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_pastel_so_hai_cau":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_shin_chan":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_anh_hellokitty_v_sao":{"is4Cut":false,"windows":[[0,0,512,512]]},"khung_xanh_tay_sao_vang":{"is4Cut":false,"windows":[[0,0,512,512]]},"sinh_nhat_hello_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_y2k_silver_holo":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_denim_ripped":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_single_film_nostalgia":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_cortis_4cut":{"is4Cut":true,"windows":[[32,41,255,252],[258,41,480,252],[32,256,255,468],[258,256,480,473]]},"pb_cortis_v1":{"is4Cut":true,"windows":[[39,42,252,246],[263,42,474,246],[39,258,252,468],[262,258,474,468]]},"pb_cortis_v2":{"is4Cut":true,"windows":[[49,45,254,232],[258,45,463,233],[49,256,254,446],[258,256,463,446]]},"pb_ech_xanh":{"is4Cut":true,"windows":[[73,94,252,247],[258,94,437,247],[73,256,252,423],[258,256,437,423]]},"pb_galaxy":{"is4Cut":true,"windows":[[34,31,244,243],[269,31,479,243],[34,267,244,474],[269,267,479,475]]},"pb_meo_dang_yeu_4cut":{"is4Cut":true,"windows":[[47,36,254,255],[261,45,465,255],[50,257,251,474],[261,257,466,475]]},"pb_photobooth_hello_kitty":{"is4Cut":true,"windows":[[47,102,255,254],[256,102,464,254],[47,256,255,424],[256,256,464,424]]},"pb_shinchan_4cut":{"is4Cut":true,"windows":[[39,46,250,247],[259,45,471,248],[37,256,252,469],[259,256,473,469]]},"pb_strawberry":{"is4Cut":true,"windows":[[36,39,244,244],[268,39,477,244],[36,262,244,471],[268,262,477,471]]},"pb_supperman_4cut":{"is4Cut":true,"windows":[[39,28,245,248],[268,28,474,248],[39,264,245,478],[267,264,474,478]]},"pb_trung_bac_thao":{"is4Cut":true,"windows":[[70,82,255,256],[263,82,448,256],[70,270,255,450],[263,270,448,450]]},"pb_vien_hello_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]},"pb_vintage":{"is4Cut":true,"windows":[[31,27,246,240],[267,28,482,240],[31,264,247,478],[267,264,482,478]]},"khung_doraemon_shinchan_kitty":{"is4Cut":false,"windows":[[0,0,512,512]]}};

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
]);

const FACE_LOCK =
  "Edit this photo while keeping the person's exact face, eyes, nose, mouth, skin tone, hair, expression, pose, and background completely identical. Only apply the requested edit cleanly: ";

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
  "ai_cosplay_wibu", "ai_hau_gai", "ai_hoang_thuong", "ai_idol_kpop"
]);

const AI_FILTER_PROMPTS = {
  // 26 Custom AI 3D Hot & extra filters
  stk_tai_tho:
    "Keep the person's exact face, expression, pose, and background from the photo, and realistically place a cute fluffy white and soft pink plush bunny ears headband sitting naturally on top of their head with matching soft lighting and natural shadows. If there are multiple people, put a matching bunny ears headband on each person cleanly.",
  stk_mu_ngu_khoc:
    "Apply the exact cartoon face filter from the second reference image to the person's face in the first photo: 1) A cream-colored pixel-art sleeping hat with thick black outlines and a light cyan pom-pom on the left side. 2) Large thin round black wire-frame glasses over both eyes. 3) Two glossy cyan-blue anime crying streams from the inner corners of both eyes. 4) A tiny black spiral doodle on the nose and two small curved whisker lines on each cheek. Precisely align all elements with the person's facial features while keeping their identity, hairstyle, clothing, pose, and background.",
  stk_jollibee:
    "Edit the first photograph while keeping the exact same person, face, hairstyle, pose, hands, and background unchanged. Change ONLY the person's clothing into a realistic Jollibee employee uniform genuinely worn on their body: bright red short-sleeved polo shirt with yellow shoulder panels, blue-and-yellow striped collar, Jollibee mascot logo on the left chest, small name tag on the right chest, and dark navy waist apron. Natural fabric folds and shadows; no cartoon or sticker outline.",
  stk_nak_ve_than:
    "Edit the photograph into a photorealistic real-life cosplay of Nakroth Dimensional Guardian while keeping the person's exact face, expression, body proportions, pose, framing, and background unchanged. ONLY change: 1) Voluminous spiky silver-white hair with a center part and two long shoulder-length side locks. 2) A tailored black cropped blazer with white piping, royal-blue and gold armor accents, and leather gloves. Real hair strands and real fabric; not anime or CGI.",
  stk_gojo_satoru:
    "Edit the photograph while strictly preserving the exact half-body framing, crop, face shape, pose, and background. ONLY replace the hairstyle and outfit with a realistic Satoru Gojo cosplay: spiky silver-white hair, a sleek black fabric blindfold covering both eyes, and a black high-collar Jujutsu uniform jacket with natural fabric folds.",
  stk_shopee_food:
    "Edit the photograph while keeping the exact same person, face, expression, pose, and background unchanged. Dress the person in an authentic bright orange ShopeeFood delivery rider jacket with white logo on the left chest, front zipper, natural fabric folds, and an orange ShopeeFood motorcycle helmet with white branding. Ultra-photorealistic photo, not pasted or cartoon.",
  fireworks: "Fill the night sky background behind the person with vibrant colorful fireworks bursting with warm glowing sparks and bokeh.",
  harry_potter: "Dress the person in a classic black Hogwarts wizard robe with a red-and-gold striped Gryffindor scarf and thin round metal glasses.",
  minecraft: "Restyle the background and clothing into blocky 3D Minecraft voxel geometry and pixelated textures while keeping the person's face recognizable.",
  fire_flame: "Surround the background and edges of the frame with dramatic glowing orange fire flames and rising golden sparks illuminated naturally on the clothing.",
  giant_spider: "Add a realistic fuzzy dark spider perched playfully near the person's shoulder with natural shadows.",
  ocean_underwater: "Transform the scene into a serene underwater aquarium with cool blue water caustics, rising air bubbles, and small colorful tropical fish swimming in the background.",
  ufo_alien: "Place a subtle glowing metallic UFO saucer hovering in the distant sky behind the person with soft beam light.",
  sweat_hearts: "Float glossy pastel pink and red 3D hearts softly in the air around the person with dreamy romantic lighting.",
  volcano_lava: "Replace the distant background with glowing molten volcanic lava streams and warm floating orange embers.",
  rain_storm: "Add a moody cinematic rainstorm atmosphere with falling rain streaks, subtle water droplets, soft mist, and distant lightning in the background sky.",
  fortnite_llama: "Add a colorful purple-and-blue Fortnite loot llama piñata peeking playfully into the background behind the person.",
  watercolor_art: "Render the scene as a delicate hand-painted watercolor illustration with soft brush strokes and paper texture while keeping the face recognizable.",
  golden_hour: "Bathe the scene in warm golden hour sunset sunlight rays, soft lens flare, and flattering warm golden rim lighting.",
  rose_flower: "Place a single fresh red rose stem held gently in the person's mouth with realistic petals and shadows.",
  shrek_ogre: "Add funny green Shrek ogre trumpet ears on both sides of the head with a playful green fairytale ogre vibe while keeping the face recognizable.",
  superhero_cape: "Add a classic blue-and-red superhero suit collar and a flowing red superhero cape over the person's shoulders.",
  spooky_ghost: "Add a cute translucent white ghostly figure floating playfully in the background behind the person.",
  pirate_hat: "Put a weathered dark tricorn pirate captain hat with gold trim on the person's head and add subtle pirate coat lapels.",
  jungle_leaf: "Frame the background with lush green tropical jungle monstera leaves and warm dappled forest sunlight.",
  cute_zombie: "Apply playful Halloween zombie face paint with pale greenish skin tint and cute chibi stitch marks while keeping the person's features clear.",

  // 35 Official Native Locket AI filters + locket + hom_nay_an_gi
  okay_wig: "Place an oversized glossy funny salon wig comically perched on the person's head with realistic hair strands.",
  influencer: "Add glamorous studio ring-light eye catchlights, trendy chic sunglasses resting on top of the head, and clean luxury lifestyle studio lighting.",
  looks_maxxing: "Enhance the portrait with crisp high-fashion studio sculpting light, subtle chiseled jawline shadow, and glossy magazine editorial clarity.",
  toothless: "Give the person a playful goofy comedy edit showing a funny gap-tooth smile.",
  bye_brows: "Apply a lighthearted comedy edit cleanly removing the person's eyebrows with smooth natural forehead skin.",
  bowling_ball: "Apply a funny comedy edit making the top of the person's head completely smooth, bald, and glossy like a polished bowling ball.",
  blonde_bleached: "Change the person's hair color cleanly to bright platinum bleached blonde with natural roots and lighting.",
  beard: "Add a realistic thick well-groomed full beard and mustache seamlessly matching the person's hair color.",
  bob_cut: "Restyle the person's hair into a sleek chin-length straight bob haircut with natural volume.",
  buns: "Restyle the person's hair into cute high double space buns on top of the head.",
  tatted: "Add realistic black-and-grey fine-line aesthetic tattoos gently along the neck and visible skin.",
  mohawk: "Restyle the person's hair into a tall edgy punk mohawk down the center of the head.",
  braces: "Add realistic metallic orthodontic braces cleanly aligned on the person's visible teeth.",
  slimed: "Splash bright neon green glossy Nickelodeon-style slime dripping playfully over the person's hair and shoulders.",
  princess: "Place a sparkling crystal silver tiara crown on the head and add a pastel fairytale princess dress collar with gentle sparkles.",
  disco_lights: "Illuminate the scene with colorful spinning disco ball light reflections and vibrant neon magenta and cyan party beams.",
  cash_money: "Add crisp US dollar bills fluttering and raining joyfully through the air around the person.",
  happy_birthday: "Put a festive colorful polka-dot birthday party hat on the head and add floating confetti with warm glowing birthday cake candles in the foreground.",
  cutesy: "Add soft kawaii pastel pink blush, tiny sparkling star stickers on the cheeks, and a dreamy soft glow.",
  sticker_face: "Place playful colorful vinyl stickers like tiny stars, pastel hearts, and smiley faces neatly on the person's cheeks and nose.",
  flower_crown: "Place a delicate crown woven from fresh white daisies and pastel roses resting naturally on the person's head.",
  love_bug: "Put a cute red plush ladybug antennae headband on the head and float soft pink hearts in the background.",
  wedding: "Dress the person in elegant white wedding attire such as a delicate veil collar or crisp tuxedo with romantic floral bokeh behind.",
  cowboy_cowgirl: "Put a classic brown suede cowboy hat on the head and add a patterned western bandana loosely around the neck.",
  giraffe: "Put a funny cozy plush giraffe hood with cute stuffed horns and spotted giraffe ears over the person's head.",
  clown: "Apply playful colorful clown makeup with a shiny red nose, painted cheeks, and a curly rainbow wig.",
  easter_bunney_cutout: "Place cute pastel plush Easter bunny ears on the head surrounded by soft spring pastel flowers in the background.",
  easter_chick_cutout: "Place a cute fluffy yellow plush Easter chick hat perched playfully on top of the person's head.",
  bearded: "Add a long majestic wizard or lumberjack beard matching the person's natural hair tone.",
  leprechaun: "Put a festive green St. Patrick's Day leprechaun top hat with a gold buckle on the head and float green shamrocks behind.",
  lucky_face: "Add cute sparkling green four-leaf clover stickers on the cheeks with warm golden lucky shimmer in the air.",
  sweet_hearts: "Float pastel candy conversation hearts in the air around the person with soft pink romantic studio lighting.",
  elf_cutout: "Put a festive green-and-red Christmas elf hat with cute pointy elf ears and a golden jingle bell on the head.",
  santa_cutout: "Put a cozy fluffy red-and-white Santa Claus hat on the head with soft falling snow bokeh in the background.",
  frosty: "Wrap a cozy winter knit scarf around the neck with soft falling snowflakes and crisp frosty winter wonderland lighting.",
  locket: "Surround the person with a mystical golden starlight aura, floating warm sparkles, and magical twilight glow.",
  hom_nay_an_gi: "Float playful appetizing miniature icons of Vietnamese street food like pho bowls, banh mi, and iced milk tea in a halo around the background.",

  // 27 New Vietnamese Meme, Trend, Shipper, Luxury & Beauty AI filters
  ai_cong_chua_phong_tro:
    "Keep the person's exact face, identity, and expression, dress them in an extravagant sparkling pastel pink fairytale princess gown with a crystal tiara while standing inside a cozy humble Vietnamese rented dorm room with tiled floor and electric fan.",
  ai_hoang_tu_ktx:
    "Keep the person's exact face and pose, dress them in an ornate royal white-and-gold European prince uniform jacket with ceremonial sash inside a lively Vietnamese university dorm room.",
  ai_lop_truong:
    "Keep the person's exact face, expression, clothing, pose, and background, and humorously place a large realistic heavy black rubber car tire slung around their neck and shoulders like a collar (funny 'lốp dự phòng' spare-tire meme) with natural shadows.",
  ai_di_phu_ho:
    "Keep the person's exact face and identity, dress them in realistic dusty construction worker clothes with a bright yellow safety hard hat, reflective vest, and a trowel at a sunny building site.",
  ai_ve_que_nuoi_ca:
    "Keep the person's exact face and smile, dress them in traditional rustic Vietnamese brown Ba Ba country attire wearing a conical leaf hat Non La beside a peaceful green countryside fish pond and banana trees.",
  ai_figure_1_7:
    "Keep the person's exact face and outfit likeness, transform them into a glossy collectible 1/7 scale PVC anime figure standing on a sleek round acrylic display base on an artist desk with warm studio rim lighting.",
  ai_action_figure_box:
    "Keep the person's exact likeness and outfit, render them as a collectible boxed plastic action figure inside a transparent blister retail packaging box with printed title card and tiny accessories.",
  ai_lego_figure:
    "Keep the person's hair, outfit colors, and vibe recognizable, transform the person and surroundings into glossy yellow LEGO minifigure style with blocky plastic LEGO bricks.",
  ai_cartoon_3d:
    "Keep the person's exact facial features, hair, and outfit recognizable, restyle them cleanly as a charming Pixar/Disney-style high-detail 3D animated movie character with expressive soft studio lighting.",
  ai_polaroid_string:
    "Frame the person's photo cleanly inside a charming physical instant Polaroid photograph hanging from natural twine string with a tiny wooden clothespin over warm fairy-light bokeh.",
  ai_shipper_giao_hang:
    "Keep the person's exact face, expression, and background, dress them in an authentic bright red-and-orange express delivery courier jacket with matching delivery helmet and parcel bag.",
  ai_grab_driver:
    "Keep the person's exact face, expression, and background, dress them in an authentic emerald green GrabBike rider jacket and matching green Grab motorcycle helmet with crisp natural folds.",
  ai_xanh_sm:
    "Keep the person's exact face, expression, and background, dress them in an authentic bright cyan-turquoise Xanh SM electric taxi/bike rider jacket with matching cyan helmet.",
  ai_bac_si:
    "Keep the person's exact face and expression, dress them in a crisp clean white doctor lab coat with a realistic medical stethoscope draped naturally around the neck in a bright modern clinic.",
  ai_tong_tai:
    "Keep the person's exact face and identity, dress them in a razor-sharp tailored charcoal black billionaire CEO three-piece suit and silk tie standing inside a sleek glass penthouse office overlooking the city skyline.",
  ai_phu_ba:
    "Keep the person's exact face and identity, dress them in glamorous wealthy heiress luxury pearl jewelry, designer silk blazer, and sunglasses in an upscale sunlit luxury boutique setting.",
  ai_thieu_gia:
    "Keep the person's exact face and identity, style them in a sharp luxury young heir cashmere coat and designer watch leaning casually near a sleek glossy sports car at golden hour.",
  ai_du_thuyen:
    "Keep the person's exact face and identity, dress them in crisp white linen summer resort wear sitting aboard a luxury white yacht deck overlooking sparkling turquoise ocean waves.",
  ai_old_money:
    "Keep the person's exact face and identity, style them in timeless old-money ivory cable-knit sweater draped over the shoulders and beige tailored polo shirt with warm film aesthetic.",
  ai_makeup_idol:
    "Keep the person's exact facial structure and identity, apply clean luminous K-pop idol glass-skin makeup with soft shimmer eyelids, peach gradient lips, and flattering softbox beauty light.",
  ai_trang_diem_duyen:
    "Keep the person's exact facial features and identity, apply trendy Douyin Chinese beauty makeup with wispy doll eyelashes, sparkly lower-lash shimmer, rosy blush, and glossy berry lips.",
  ai_doi_kieu_toc:
    "Keep the person's exact face, clothing, and background completely identical, restyle ONLY their hair into voluminous trendy layered salon hair with wispy curtain bangs and glossy natural texture.",
  ai_doi_mau_toc:
    "Keep the person's exact face, clothing, and background completely identical, dye ONLY their hair into a fashionable smoky ash-silver lavender balayage tone with natural roots and shine.",
  ai_cosplay_wibu:
    "Keep the person's exact face and pose, dress them in a highly detailed realistic Japanese anime academy cosplay uniform with vibrant stylized wig and dramatic studio backlight.",
  ai_hau_gai:
    "Keep the person's exact face and sweet expression, dress them in a cute classic black-and-white frilly Victorian cafe maid outfit with neat white lace headband inside a warm aesthetic cafe.",
  ai_hoang_thuong:
    "Keep the person's exact face and proud expression, dress them in an ornate imperial golden dragon embroidered ancient royal emperor robe and gilded crown inside a grand palace hall.",
  ai_idol_kpop:
    "Keep the person's exact face and charisma, dress them in a flashy sparkling K-pop concert stage outfit with wireless ear-mic under dramatic magenta-and-blue arena spotlights and lightsticks.",
};

const MEMORY_IMAGES = new Map();
const FRAME_CACHE = new Map();
const PHOTOBOOTH_SESSIONS = new Map();
let LAST_DEBUG = null;
let LAST_CAPTION_DEBUG = null;
let CAPTION_MODE_OVERRIDE = null;
let UPSTREAM_CAPTION_BLOCKED_UNTIL = 0;
const SKIP_CF_MODELS = new Map(); // modelId -> timestamp until skip (on 404 / unsupported model)
const SKIP_GEMINI_MODELS = new Map(); // modelId -> timestamp until skip (on 503 high demand / 404 / timeout)
const RECENT_QUOTE_IDS = [];
const CUSTOM_CREATED_FILTERS = [];
function rememberQuoteIds(ids) {
  for (const id of ids) {
    if (!id) continue;
    RECENT_QUOTE_IDS.push(id);
  }
  while (RECENT_QUOTE_IDS.length > 40) RECENT_QUOTE_IDS.shift();
}
const RECENT_LIVE_QUOTES = [];
function rememberLiveQuoteKey(key) {
  if (!key) return;
  if (!RECENT_LIVE_QUOTES.includes(key)) RECENT_LIVE_QUOTES.push(key);
  while (RECENT_LIVE_QUOTES.length > 80) RECENT_LIVE_QUOTES.shift();
}
const LIVE_QUOTE_CACHE = { items: [], fetchedAt: 0, wikiIdx: 0 };
const VI_WIKIQUOTE_TOPICS = ["Hạnh phúc", "Cuộc sống", "Tình yêu", "Tình bạn", "Thời gian", "Thành công", "Hy vọng", "Tự do"];
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
async function delImage(id) {
  MEMORY_IMAGES.delete(id);
  try {
    await caches.default.delete(new Request(CACHE_IMG_PREFIX + encodeURIComponent(id)));
  } catch (_) {}
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

function encodeBmpRgb24(w, h, rgb) {
  const rowStride = (w * 3 + 3) & ~3;
  const pixelBytes = rowStride * h;
  const totalSize = 54 + pixelBytes;
  const bmp = new Uint8Array(totalSize);
  const dv = new DataView(bmp.buffer);

  // BITMAPFILEHEADER
  bmp[0] = 0x42; // B
  bmp[1] = 0x4d; // M
  dv.setUint32(2, totalSize, true);
  dv.setUint32(10, 54, true);

  // BITMAPINFOHEADER
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, h, true); // positive height => bottom-up BGR rows
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 24, true);
  dv.setUint32(34, pixelBytes, true);
  dv.setUint32(38, 2835, true);
  dv.setUint32(42, 2835, true);

  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 3;
    const dstRow = 54 + y * rowStride;
    for (let x = 0; x < w; x++) {
      const si = srcRow + x * 3;
      const di = dstRow + x * 3;
      bmp[di] = rgb[si + 2];     // B
      bmp[di + 1] = rgb[si + 1]; // G
      bmp[di + 2] = rgb[si];     // R
    }
  }
  return bmp;
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

  const res = await fetch(`${GITHUB_FRAMES_BIN_BASE}/${encodeURIComponent(filterId)}.bin`);
  if (!res.ok) throw new Error(`Failed to fetch frame bin for ${filterId}: ${res.status}`);
  const compressed = new Uint8Array(await res.arrayBuffer());
  const rgba = await inflateZlib(compressed);
  FRAME_CACHE.set(filterId, rgba);
  return rgba;
}

function drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, box, canvasSize = SIZE) {
  const [x1, y1, x2, y2] = box;
  const winW = x2 - x1;
  const winH = y2 - y1;
  if (winW <= 0 || winH <= 0) return;

  const scale = Math.max(winW / srcW, winH / srcH);
  const cropW = winW / scale;
  const cropH = winH / scale;
  const offX = (srcW - cropW) * 0.5;
  const offY = (srcH - cropH) * 0.5;
  const invScale = 1 / scale;

  for (let dy = 0; dy < winH; dy++) {
    const sy = Math.min(srcH - 1, Math.max(0, (offY + dy * invScale) | 0));
    const dstRowOff = (y1 + dy) * canvasSize * 3;
    const srcRowOff = sy * srcW * 3;
    for (let dx = 0; dx < winW; dx++) {
      const sx = Math.min(srcW - 1, Math.max(0, (offX + dx * invScale) | 0));
      const di = dstRowOff + (x1 + dx) * 3;
      const si = srcRowOff + sx * 3;
      canvasRgb[di] = srcRgb[si];
      canvasRgb[di + 1] = srcRgb[si + 1];
      canvasRgb[di + 2] = srcRgb[si + 2];
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
  let rng = 0x517cc1b7;
  for (let y = 0; y < h; y++) {
    const scan = y % 3 === 0 ? 0.78 : 1.0;
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      const i = row + x * 3;
      const lum = (0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2]) * scan;
      rng = (rng ^ (rng << 13)) >>> 0;
      rng = (rng ^ (rng >>> 17)) >>> 0;
      rng = (rng ^ (rng << 5)) >>> 0;
      const noise = ((rng & 0xff) / 127.5 - 1) * 14;
      const r = Math.min(255, Math.max(0, lum * 0.45 + noise * 0.5));
      const g = Math.min(255, Math.max(0, lum * 1.15 + noise));
      const b = Math.min(255, Math.max(0, lum * 0.55 + noise * 0.5));
      rgb[i] = r | 0;
      rgb[i + 1] = g | 0;
      rgb[i + 2] = b | 0;
    }
  }
  // Corner viewfinder brackets
  const brk = [180, 255, 200];
  fillRectRgb(rgb, w, h, 14, 14, 46, 17, brk);
  fillRectRgb(rgb, w, h, 14, 14, 17, 46, brk);
  fillRectRgb(rgb, w, h, w - 46, 14, w - 14, 17, brk);
  fillRectRgb(rgb, w, h, w - 17, 14, w - 14, 46, brk);
  fillRectRgb(rgb, w, h, 14, h - 17, 46, h - 14, brk);
  fillRectRgb(rgb, w, h, 14, h - 46, 17, h - 14, brk);
  fillRectRgb(rgb, w, h, w - 46, h - 17, w - 14, h - 14, brk);
  fillRectRgb(rgb, w, h, w - 17, h - 46, w - 14, h - 14, brk);
  // Red REC dot
  for (let y = 20; y <= 36; y++) {
    for (let x = 20; x <= 36; x++) {
      if ((x - 28) * (x - 28) + (y - 28) * (y - 28) <= 64) {
        const i = (y * w + x) * 3;
        rgb[i] = 245; rgb[i + 1] = 35; rgb[i + 2] = 35;
      }
    }
  }
  const vnNow = new Date(Date.now() + 7 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    vnNow.getUTCFullYear() + "-" + pad(vnNow.getUTCMonth() + 1) + "-" + pad(vnNow.getUTCDate()) +
    " " + pad(vnNow.getUTCHours()) + ":" + pad(vnNow.getUTCMinutes()) + ":" + pad(vnNow.getUTCSeconds());
  drawTextRgb(rgb, w, h, "REC CAM-01", 44, 21, 2, [220, 255, 225], [8, 25, 12]);
  drawTextRgb(rgb, w, h, stamp, 24, h - 42, 2, [220, 255, 225], [8, 25, 12]);
}

function applyClockWeekdayOverlay(rgb, w, h) {
  const vnNow = new Date(Date.now() + 7 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const timeStr = pad(vnNow.getUTCHours()) + ":" + pad(vnNow.getUTCMinutes());
  const dayNames = ["CHU NHAT", "THU HAI", "THU BA", "THU TU", "THU NAM", "THU SAU", "THU BAY"];
  const dateStr = dayNames[vnNow.getUTCDay()] + " " + pad(vnNow.getUTCDate()) + "/" + pad(vnNow.getUTCMonth() + 1);
  // 5 chars * 6 * 11 - 11 = ~319px wide -> centered near top
  const tx = Math.max(16, ((w - (timeStr.length * 6 * 11 - 11)) >> 1));
  drawTextRgb(rgb, w, h, timeStr, tx, 34, 11, [255, 255, 255], [15, 23, 42]);
  const dx = Math.max(16, ((w - (dateStr.length * 6 * 3 - 3)) >> 1));
  drawTextRgb(rgb, w, h, dateStr, dx, 122, 3, [254, 240, 138], [15, 23, 42]);
}

function applyTripleClone(rgb, w, h) {
  const copy = new Uint8Array(rgb);
  const shift = 54;
  for (let y = 0; y < h; y++) {
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      const lx = Math.max(0, x - shift);
      const rx = Math.min(w - 1, x + shift);
      const i = row + x * 3;
      const li = row + lx * 3;
      const ri = row + rx * 3;
      const r = copy[i] * 0.58 + copy[li] * 0.16 + copy[ri] * 0.26;
      const g = copy[i + 1] * 0.58 + copy[li + 1] * 0.24 + copy[ri + 1] * 0.14;
      const b = copy[i + 2] * 0.58 + copy[li + 2] * 0.26 + copy[ri + 2] * 0.24;
      rgb[i] = r > 255 ? 255 : r | 0;
      rgb[i + 1] = g > 255 ? 255 : g | 0;
      rgb[i + 2] = b > 255 ? 255 : b | 0;
    }
  }
}

function applyPortraitBokeh(rgb, w, h) {
  // Fast separable 2-pass blur radius 7 (horizontal -> vertical)
  const tmp = new Uint8Array(w * h * 3);
  const blur = new Uint8Array(w * h * 3);
  const rad = 7;
  const win = rad * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 3;
    for (let x = 0; x < w; x++) {
      let sr = 0, sg = 0, sb = 0;
      for (let k = -rad; k <= rad; k++) {
        const xx = x + k < 0 ? 0 : x + k >= w ? w - 1 : x + k;
        const si = row + xx * 3;
        sr += rgb[si]; sg += rgb[si + 1]; sb += rgb[si + 2];
      }
      const di = row + x * 3;
      tmp[di] = (sr / win) | 0;
      tmp[di + 1] = (sg / win) | 0;
      tmp[di + 2] = (sb / win) | 0;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sr = 0, sg = 0, sb = 0;
      for (let k = -rad; k <= rad; k++) {
        const yy = y + k < 0 ? 0 : y + k >= h ? h - 1 : y + k;
        const si = (yy * w + x) * 3;
        sr += tmp[si]; sg += tmp[si + 1]; sb += tmp[si + 2];
      }
      const di = (y * w + x) * 3;
      blur[di] = (sr / win) | 0;
      blur[di + 1] = (sg / win) | 0;
      blur[di + 2] = (sb / win) | 0;
    }
  }
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

async function translateCustomLookPromptToEn(env, rawText) {
  const clean = String(rawText || "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (!clean) return "";
  if (!/[^\x00-\x7F]/.test(clean)) return clean;
  const sys =
    "Translate this user photo-editing request (often in Vietnamese) into concise, vivid, photorealistic English image-editing instructions (under 45 words). Describe exact clothing, accessories, hairstyle, makeup, expression, or mood to add/change. Output ONLY the English edit instruction, no quotes or commentary.";
  for (const k of availableKeys("groq", env && env.GROQ_API_KEY)) {
    try {
      const model = (env && env.GROQ_MODEL) || "openai/gpt-oss-120b";
      const bodyObj = { model, messages: [{ role: "system", content: sys }, { role: "user", content: clean }], temperature: 0.2 };
      if (/gpt-oss/i.test(model)) { bodyObj.reasoning_effort = "low"; bodyObj.max_completion_tokens = 140; }
      else bodyObj.max_tokens = 90;
      const r = await fetch(`${(env && env.GROQ_BASE_URL) || "https://api.groq.com/openai/v1"}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
        body: JSON.stringify(bodyObj),
        signal: AbortSignal.timeout(2500),
      });
      if (!r.ok) { if (r.status === 429 || r.status === 402 || r.status === 403) benchKey(k); continue; }
      const j = await r.json();
      const out = String(j?.choices?.[0]?.message?.content || "").replace(/[\r\n]+/g, " ").trim();
      if (out && out.length >= 4 && !/[^\x00-\x7F]/.test(out)) return out;
    } catch (_) {}
  }
  for (const k of availableKeys("gemini", env && env.GEMINI_API_KEY)) {
    const g = await geminiGenerateCaption(env, sys, clean, null, null, k, 90, true, 0.2);
    const out = String(g?.text || "").replace(/[\r\n]+/g, " ").trim();
    if (out && out.length >= 4) return out;
  }
  if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
    try {
      const res = await runCfTextChatPooled(env, [{ role: "system", content: sys }, { role: "user", content: clean }], 90, 0.2);
      const out = String(res?.text || "").replace(/[\r\n]+/g, " ").trim();
      if (out && out.length >= 4) return out;
    } catch (_) {}
  }
  return clean;
}

function detectAiRequest(dataNode, rawBodyText) {
  let rawFilterId = firstNonEmptyString([
    dataNode?.filterId,
    dataNode?.filter_id,
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

  if (rawFilterId && AI_FILTER_PROMPTS[rawFilterId]) {
    return { filterId: rawFilterId, prompt: FACE_LOCK + AI_FILTER_PROMPTS[rawFilterId], source: "catalog" };
  }
  if (rawUserPrompt && AI_FILTER_PROMPTS[rawUserPrompt]) {
    return { filterId: rawUserPrompt, prompt: FACE_LOCK + AI_FILTER_PROMPTS[rawUserPrompt], source: "catalog_prompt_id" };
  }
  if (rawUserPrompt) {
    return {
      filterId: rawFilterId || "custom_prompt",
      rawUserPrompt: rawUserPrompt.slice(0, 500),
      prompt: FACE_LOCK + "Apply this natural photorealistic edit: " + rawUserPrompt.slice(0, 500),
      source: "custom_prompt",
    };
  }
  if (rawFilterId) {
    return {
      filterId: rawFilterId,
      prompt: FACE_LOCK + 'Apply a natural photorealistic "' + rawFilterId.replace(/[_-]+/g, " ") + '" camera filter effect.',
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

async function fetchBytesViaWsrv(targetUrl, query, minBytes = 200) {
  try {
    const res = await fetch(`https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}&${query}`);
    if (res.ok) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > minBytes) return new Uint8Array(ab);
    }
  } catch (_) {}
  return null;
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
    // scale về 768x768 cover bằng drawCoverRgb
    const out = new Uint8Array(768 * 768 * 3);
    drawCoverRgb(out, d.rgb, d.w, d.h, [0, 0, 768, 768], 768);
    try {
      const rgba = new Uint8Array(768 * 768 * 4);
      for (let p = 0, i3 = 0, i4 = 0; p < 768 * 768; p++, i3 += 3, i4 += 4) {
        rgba[i4] = out[i3]; rgba[i4 + 1] = out[i3 + 1]; rgba[i4 + 2] = out[i3 + 2]; rgba[i4 + 3] = 255;
      }
      const enc = jpeg.encode({ data: rgba, width: 768, height: 768 }, 90);
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
    for (const a of tryList) {
      try {
        const out = await cfRestFluxRun(a.acct, a.token, aiModel, promptText, inputImg, refImg, outSize, opts);
        return { ...out, via: "cf_rest:" + a.acct.slice(0, 8) };
      } catch (e) {
        lastErr = e;
        // 4006 hoặc rate limit -> cho token này nghỉ 20', thử account kế tiếp.
        if (isQuotaOrCapacityError(e) || e.cfCode === 3030) {
          // 3030 = output flagged (safety) -> KHÔNG phải hết quota, đừng bench; chỉ bỏ qua ảnh này.
          if (isQuotaOrCapacityError(e)) benchKey(a.token);
        } else {
          benchKey(a.token, 5); // lỗi lạ -> nghỉ ngắn
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
    const enc = jpeg.encode({ data: rgba, width: canvasSize, height: canvasSize }, 92);
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
  weekday_depth_tw: "weekday_tw",
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

function buildSmoothedForegroundMask(maskRgb) {
  const total = SIZE * SIZE;
  const lum = new Uint8Array(total);
  for (let p = 0, i3 = 0; p < total; p++, i3 += 3) {
    lum[p] = ((maskRgb[i3] * 77 + maskRgb[i3 + 1] * 150 + maskRgb[i3 + 2] * 29) >> 8) & 0xff;
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
  const lines = [];
  for (const [cat, list] of Object.entries(VERIFIED_QUOTE_BANK)) {
    const fresh = list.filter((q) => !RECENT_QUOTE_IDS.includes(q.id));
    const pool = shuffleInPlace([...(fresh.length >= 10 ? fresh : list)]);
    const ranked = pool.map((q) => {
      const hay = `${q.tags} ${q.attribution}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (hay.includes(t)) score += 2;
      }
      return { q, score: score + Math.random() * 2.4 };
    });
    ranked.sort((a, b) => b.score - a.score);
    const picked = shuffleInPlace(ranked.slice(0, 20)).map((x) => `${x.q.id}(${x.q.tags})`);
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
  let matchedCount = 0;

  for (const cat of cats) {
    const list = VERIFIED_QUOTE_BANK[cat] || VERIFIED_QUOTE_BANK.pop_music;
    const reqId = idMap && typeof idMap[cat] === "string" ? idMap[cat].trim() : "";
    let item = list.find((it) => it.id === reqId);
    if (item) {
      matchedCount++;
    } else {
      const fresh = list.filter((it) => !RECENT_QUOTE_IDS.includes(it.id));
      const pool = fresh.length > 0 ? fresh : list;
      item = pool[Math.floor(Math.random() * pool.length)];
    }
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
      if (merged.length >= 160) break;
    }
    LIVE_QUOTE_CACHE.items = merged;
    LIVE_QUOTE_CACHE.fetchedAt = Date.now();
  }
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
    const g = await geminiGenerateCaption(env, sys, usr, null, null, k, 320, true, 0.3);
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
        0.3
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

  // Nhánh QUOTE: Hybrid Mode = 3 câu từ kho 200 câu thật + 2 câu danh ngôn thật kéo live từ DummyJSON/ZenQuotes/Wikiquote
  if (schema && schema.properties && schema.properties.quotes) {
    const enumCats = schema.properties.quotes.items?.properties?.category?.enum;
    const cats = Array.isArray(enumCats) && enumCats.length > 0 ? enumCats : Object.keys(VERIFIED_QUOTE_BANK);
    const avoidNote = RECENT_QUOTE_IDS.length > 0 ? `\nAvoid recently used IDs if possible: ${RECENT_QUOTE_IDS.join(",")}` : "";
    const buildPickPrompt = (descForRank) =>
      "Look closely at this photo (subject, clothing, objects, food, setting, expression, mood). " +
      "Pick the SINGLE best-matching quote ID for EACH of the 5 categories from the catalog below. " +
      'Reply with ONLY a valid JSON object mapping each category name to one ID from that category, e.g. {"pop_music":"pm_7","greek_philosophy":"gp_4","famous_modern_figures":"fm_6","film_and_tv":"ft_20","athlete":"at_6"}. No extra text.' +
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
            temperature: 0.35,
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
          0.3
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
        const res = await runVisionChatPooled(env, [{ role: "user", content: userContentPick }], 200, 0.35);
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
            body: JSON.stringify({ model: nvModel, messages: [{ role: "user", content: userContentPick }], max_tokens: 140, temperature: 0.35 }),
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

async function handleStudioRequest(request, env) {
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

  // 2.9 Handle Locket getFilters / fetchFilters / getCustomFilters (merge custom filters created via Tạo diện mạo)
  if (
    (request.method === "GET" || request.method === "POST") &&
    /(getFilters|fetchFilters|getCustomFilters|fetchCustomFilters|getCameraFilters|listFilters)/i.test(url.pathname)
  ) {
    const rawBodyText = request.method === "POST" ? await request.text() : "";
    const origHost = request.headers.get("X-Locket-Orig-Host") || "api.locketcamera.com";
    const upstreamUrl = `https://${origHost}${url.pathname}${url.search}`;
    const fwdHeaders = new Headers();
    for (const [k, v] of request.headers.entries()) {
      const kl = k.toLowerCase();
      if (kl === "host" || kl === "content-length" || kl === "x-locket-orig-host" || kl.startsWith("cf-")) continue;
      fwdHeaders.set(k, v);
    }
    let upFilters = [];
    let upStatus = 0;
    try {
      const upRes = await fetch(upstreamUrl, {
        method: request.method,
        headers: fwdHeaders,
        body: request.method === "POST" ? rawBodyText : undefined,
        signal: AbortSignal.timeout(4000),
      });
      upStatus = upRes.status;
      const upTxt = await upRes.text();
      let upJson = null;
      try { upJson = JSON.parse(upTxt); } catch (_) {}
      const list = upJson?.result?.data?.filters || upJson?.result?.filters || upJson?.data?.filters || upJson?.filters || [];
      if (Array.isArray(list)) upFilters = list;
    } catch (_) {}
    const merged = [...CUSTOM_CREATED_FILTERS, ...upFilters];
    LAST_DEBUG = {
      mode: "get_filters",
      path: url.pathname,
      upStatus,
      customCount: CUSTOM_CREATED_FILTERS.length,
      upCount: upFilters.length,
      ts: new Date().toISOString(),
    };
    return new Response(
      JSON.stringify({
        data: { filters: merged, custom_filters: CUSTOM_CREATED_FILTERS },
        result: { status: 200, success: true, data: { filters: merged, custom_filters: CUSTOM_CREATED_FILTERS } },
      }),
      { status: 200, headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }) }
    );
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
            LAST_DEBUG = {
              mode: "create_filter_upstream_ok",
              path: url.pathname,
              upStatus,
              upKeys,
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
        const name = firstNonEmptyString([dataNode?.name, dataNode?.title, ui?.name, ui?.title]) || rawPrompt.slice(0, 28);
        const iconImg = "https://tommm1207.github.io/locket-tommm-studio/assets/filters_v2/ai_cartoon_3d.png?v=2";
        const filterObj = {
          uid: newId,
          id: newId,
          filter_id: newId,
          filterId: newId,
          name,
          category: "Tạo diện mạo ✨",
          prompt: rawPrompt,
          custom_prompt: rawPrompt,
          style: dataNode?.style || "cutout",
          type: "normal",
          filterType: "normal",
          overlay: true,
          imageUrl: iconImg,
          iconUrl: iconImg,
          overlayImageUrl: iconImg,
          overlayImageURL: iconImg,
          tintColor: "#F59E0B",
          colors: ["#F59E0B", "#EC4899"],
          captureButtonColors: ["#F59E0B", "#EC4899"],
          icon: {
            url: iconImg,
            iconUrl: iconImg,
            remoteImage: iconImg,
            sfSymbol: "sparkles",
            symbol: "sparkles",
            emoji: "✨",
          },
          outputUrl: null,
          productUrl: null,
          textColor: "#FFFFFF",
          referenceImages: [],
          is_custom: true,
          isCustom: true,
          status: "ready",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
        CUSTOM_CREATED_FILTERS.unshift(filterObj);
        while (CUSTOM_CREATED_FILTERS.length > 30) CUSTOM_CREATED_FILTERS.pop();
        LAST_DEBUG = {
          mode: "create_filter_meta_fallback",
          path: url.pathname,
          upStatus,
          upErrSnippet,
          reqKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
          uiKeys: ui && typeof ui === "object" ? Object.keys(ui) : typeof ui,
          styleType: typeof dataNode?.style,
          filterId: newId,
          ts: new Date().toISOString(),
        };
        return new Response(
          JSON.stringify({
            data: filterObj,
            filter: filterObj,
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
      if (preparedMaskInput && preparedMaskInput.bytes) {
        const segPrompt =
          "Create a pure black-and-white binary foreground segmentation matte of this exact image. Fill the entire main foreground subject (person, face, hair, hands, clothing, bag, food dish/bowl, pet, or prominent foreground object/tower) in solid pure white (#FFFFFF) and fill the entire background behind it in solid pure black (#000000). Keep exact pixel alignment with zero cropping or shifting. Pure white subject on pure black background only.";
        let maskOut = null;
        // FLUX tách nền: binding account chính -> xoay vòng ~N tài khoản Cloudflare phụ (REST) khi 4006.
        if (env && (env.AI || env.CF_AI_ACCOUNTS)) {
          try {
            const seg = await runFluxPooled(env, segPrompt, preparedMaskInput, null, null, SIZE);
            if (seg && seg.bytes) { maskOut = seg; segModelUsed = seg.via; }
          } catch (_) {}
        }
        // Fallback cuối: provider ảnh ngoài (NVIDIA img2img / Gemini) nếu mọi account Cloudflare đều hết.
        if (!maskOut || !maskOut.bytes) {
          const fb = await fallbackEditImage(env, segPrompt, preparedMaskInput.bytes, preparedMaskInput.mimeType);
          if (fb && fb.bytes) { maskOut = fb; segModelUsed = fb.model; }
        }
        if (maskOut && maskOut.bytes) {
          const decodedMask = await decodeInputToRgb512(maskOut.bytes, null, url.origin, `msk_${tempId}`, SIZE);
          if (decodedMask?.rgb && decodedMask.w === SIZE && decodedMask.h === SIZE) {
            const { alpha, fgRatio: ratio } = buildSmoothedForegroundMask(decodedMask.rgb);
            fgRatio = Number(ratio.toFixed(3));
            if (ratio > 0.02 && ratio < 0.94) {
              const scaleM = (SIZE - 1) / (WD_SIZE - 1);
              for (let y = 0; y < WD_SIZE; y++) {
                const myF = y * scaleM;
                const my0 = myF | 0;
                const my1 = my0 < SIZE - 1 ? my0 + 1 : SIZE - 1;
                const fy = myF - my0;
                const row0 = my0 * SIZE;
                const row1 = my1 * SIZE;
                for (let x = 0; x < WD_SIZE; x++) {
                  const mxF = x * scaleM;
                  const mx0 = mxF | 0;
                  const mx1 = mx0 < SIZE - 1 ? mx0 + 1 : SIZE - 1;
                  const fx = mxF - mx0;
                  const a00 = alpha[row0 + mx0];
                  const a10 = alpha[row0 + mx1];
                  const a01 = alpha[row1 + mx0];
                  const a11 = alpha[row1 + mx1];
                  const a = ((a00 * (1 - fx) + a10 * fx) * (1 - fy) + (a01 * (1 - fx) + a11 * fx) * fy + 0.5) | 0;
                  if (a === 0) continue;
                  const i3 = (y * WD_SIZE + x) * 3;
                  if (a >= 255) {
                    canvasRgb[i3] = baseRgb[i3];
                    canvasRgb[i3 + 1] = baseRgb[i3 + 1];
                    canvasRgb[i3 + 2] = baseRgb[i3 + 2];
                  } else {
                    const invA = 255 - a;
                    canvasRgb[i3] = (baseRgb[i3] * a + canvasRgb[i3] * invA + 128) >> 8;
                    canvasRgb[i3 + 1] = (baseRgb[i3 + 1] * a + canvasRgb[i3 + 1] * invA + 128) >> 8;
                    canvasRgb[i3 + 2] = (baseRgb[i3 + 2] * a + canvasRgb[i3 + 2] * invA + 128) >> 8;
                  }
                }
              }
              maskApplied = true;
            }
          }
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
      const decodedUser = await decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, SIZE, authHeader);

      const srcRgb = decodedUser?.rgb || new Uint8Array(SIZE * SIZE * 3).fill(28);
      const srcW = decodedUser?.w || SIZE;
      const srcH = decodedUser?.h || SIZE;
      const canvasRgb = new Uint8Array(SIZE * SIZE * 3);
      drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, [0, 0, SIZE, SIZE]);

      if (specialFxId === "cctv_camera") applyCctvOverlay(canvasRgb, SIZE, SIZE);
      else if (specialFxId === "clock_weekday_overlay") applyClockWeekdayOverlay(canvasRgb, SIZE, SIZE);
      else if (specialFxId === "triple_clone") applyTripleClone(canvasRgb, SIZE, SIZE);
      else if (specialFxId === "portrait_bokeh") applyPortraitBokeh(canvasRgb, SIZE, SIZE);

      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId);
      const outId = `tommm_fx_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "special_fx",
        filterId: specialFxId,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
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
      const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
      const tempId = crypto.randomUUID().slice(0, 12);

      const [decodedUser, frameRgba] = await Promise.all([
        decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, SIZE, authHeader),
        getFrameRgba(filterId),
      ]);

      const srcRgb = decodedUser?.rgb || new Uint8Array(SIZE * SIZE * 3).fill(28);
      const srcW = decodedUser?.w || SIZE;
      const srcH = decodedUser?.h || SIZE;

      const manifest = FRAMES_MANIFEST[filterId];
      const canvasRgb = new Uint8Array(SIZE * SIZE * 3);

      if (manifest.is4Cut) {
        const userToken = authHeader.slice(-24) || dataNode?.userId || request.headers.get("CF-Connecting-IP") || "anon";
        const sessKey = `${userToken}_${filterId}`;
        let sess = PHOTOBOOTH_SESSIONS.get(sessKey);
        if (!sess || Date.now() - sess.ts > 180000 || sess.photos.length >= 4) {
          sess = { photos: [], ts: Date.now() };
        }
        sess.photos.push({ rgb: srcRgb, w: srcW, h: srcH });
        sess.ts = Date.now();
        PHOTOBOOTH_SESSIONS.set(sessKey, sess);

        const windows = manifest.windows || [];
        for (let idx = 0; idx < windows.length; idx++) {
          const photo = sess.photos[idx] || sess.photos[sess.photos.length - 1];
          drawCoverRgb(canvasRgb, photo.rgb, photo.w, photo.h, windows[idx]);
        }
      } else {
        const box = (manifest.windows && manifest.windows[0]) || [0, 0, SIZE, SIZE];
        drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, box);
      }

      alphaCompositeRgbaOverRgb(canvasRgb, frameRgba);
      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId);

      const outId = `tommm_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "png_frame",
        filterId,
        is4Cut: manifest.is4Cut,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
        out_mime: encoded.mimeType,
        out_bytes: encoded.bytes.length,
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
      const decodedUser = await decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, SIZE, authHeader);

      const srcRgb = decodedUser?.rgb || new Uint8Array(SIZE * SIZE * 3).fill(28);
      const srcW = decodedUser?.w || SIZE;
      const srcH = decodedUser?.h || SIZE;
      const canvasRgb = new Uint8Array(SIZE * SIZE * 3);
      drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, [0, 0, SIZE, SIZE]);
      applyLutToRgb(canvasRgb, SIZE, SIZE, LUT_FILTERS[lutId]);

      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId);
      const outId = `tommm_lut_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "lut_filter",
        filterId: lutId,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
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
      const decodedUser = await decodeInputToRgb512(imgBytes, sourceUrl, url.origin, tempId, SIZE, authHeader);

      const srcRgb = decodedUser?.rgb || new Uint8Array(SIZE * SIZE * 3).fill(28);
      const srcW = decodedUser?.w || SIZE;
      const srcH = decodedUser?.h || SIZE;
      const canvasRgb = new Uint8Array(SIZE * SIZE * 3);
      drawCoverRgb(canvasRgb, srcRgb, srcW, srcH, [0, 0, SIZE, SIZE]);
      applyWarpToRgb(canvasRgb, SIZE, SIZE, warpId);

      const encoded = await encodeCanvasToImage(canvasRgb, url.origin, tempId);
      const outId = `tommm_warp_${tempId}.${encoded.ext}`;
      await putImage(outId, encoded.bytes, encoded.mimeType);

      LAST_DEBUG = {
        mode: "warp_filter",
        filterId: warpId,
        got_input: !!imgBytes,
        decoded_user: !!decodedUser,
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
    const isCustomAi = !!(
      aiReq &&
      (CUSTOM_AI_IDS.has(aiReq.filterId) || aiReq.source === "custom_prompt")
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

    // Priority 3: Cloudflare Workers AI (FLUX.2 Klein 4B) cho Custom AI 3D Hot / Custom Prompt,
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
        const effectivePrompt = translatedCustomEn
          ? FACE_LOCK + "Apply this natural photorealistic edit: " + translatedCustomEn
          : aiReq.prompt;

        let aiOut = null;
        let usedModel = null;
        let cfErr = null;
        // FLUX với POOL: binding account chính -> xoay vòng tài khoản Cloudflare phụ (REST) khi 4006.
        if (env.AI || env.CF_AI_ACCOUNTS) {
          try {
            // Filter AI 3D: dùng ĐÚNG cấu hình "trưa nay" đã chạy tốt (giữ mặt+góc, chỉ thêm 3D):
            // flux-2-klein-4b mặc định, KHÔNG ép strength/steps (để model tự quyết -> bám ảnh gốc).
            // Chỉ đổi qua env nếu muốn thử model khác.
            const ai3dModel = (env && env.AI_3D_MODEL) || null; // null -> dùng AI_MODEL (4B)
            const ai3dOpts = (env && (env.AI_3D_STEPS || env.AI_3D_STRENGTH))
              ? { steps: env.AI_3D_STEPS ? parseInt(env.AI_3D_STEPS, 10) : undefined,
                  strength: env.AI_3D_STRENGTH ? parseFloat(env.AI_3D_STRENGTH) : undefined }
              : null;
            aiOut = await runFluxPooled(env, effectivePrompt, preparedInput, refImg, ai3dModel, null, ai3dOpts);
            usedModel = (aiOut.via && aiOut.via !== "binding" ? aiOut.via + " " : "") + aiOut.aiModel;
          } catch (err) {
            cfErr = String(err?.message || err);
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
    return handleStudioRequest(request, this.env);
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
