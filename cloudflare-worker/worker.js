// =========================================================================
// Cloudflare Worker 24/7 - Locket Gold PNG Frame, Photobooth & AI Engine
// - 100% Mien phi 0d, chay 24/7 tren Cloudflare Workers (By Tommm)
// - Khung PNG / Photobooth 4 o giu nguyen khuon mat 100% (uu tien so 1)
// - AI Filters chay bang Cloudflare Workers AI (FLUX.2 Klein 4B), 0d, khong can API key ngoai
// - Cac filter khong nhan dien duoc se pass-through ve server Locket
// =========================================================================

import jpeg from "jpeg-js";

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
};

const FACE_LOCK =
  "Edit this photo while keeping the person's exact face, eyes, nose, mouth, skin tone, hair, expression, pose, and background completely identical. Only apply the requested edit cleanly: ";

const CUSTOM_AI_IDS = new Set([
  "stk_tai_tho", "stk_mu_ngu_khoc", "stk_jollibee", "stk_nak_ve_than",
  "stk_gojo_satoru", "stk_shopee_food", "fireworks", "harry_potter",
  "minecraft", "fire_flame", "giant_spider", "ocean_underwater",
  "ufo_alien", "sweat_hearts", "volcano_lava", "rain_storm",
  "fortnite_llama", "watercolor_art", "golden_hour", "rose_flower",
  "shrek_ogre", "superhero_cape", "spooky_ghost", "pirate_hat",
  "jungle_leaf", "cute_zombie"
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
};

const MEMORY_IMAGES = new Map();
const FRAME_CACHE = new Map();
const PHOTOBOOTH_SESSIONS = new Map();
let LAST_DEBUG = null;
let LAST_CAPTION_DEBUG = null;
let LAST_ANY_REQUEST = null;
let LAST_DECODE_ERR = null;
let LAST_CAPTION_RAW = null; // ghi MỌI request tới worker (debug: xem iPhone có gọi không)
let REQUEST_LOG = []; // vài request gần nhất
// Theo dõi quota Cloudflare Workers AI (lỗi 4006 = hết 10.000 neurons/ngày).
// Khi đã chạm quota, bỏ qua env.AI trong một khoảng ngắn để fallback thẳng sang Gemini (đỡ tốn thời gian chờ lỗi).
let CF_AI_QUOTA_HIT_UNTIL = 0;
let LAST_FALLBACK_DEBUG = null;

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
  const rawUserPrompt = firstNonEmptyString([
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
  const d = await getSourceRgb(imgBytes, sourceUrl, authHeader);
  if (!d) {
    LAST_DECODE_ERR = "decode_fail (src=" + (sourceUrl ? "y" : "n") + " img=" + (imgBytes ? imgBytes.length : 0) + ")";
  }
  return d;
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

// Gọi Gemini generateContent cho CAPTION (text, có kèm ảnh nếu có). Trả chuỗi text hoặc null.
async function geminiGenerateCaption(env, systemPrompt, userText, imgBytes, imgMime, key) {
  if (!key) return { text: null, err: "no_gemini_key" };
  const model = (env && env.GEMINI_TEXT_MODEL) || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const parts = [{ text: userText }];
  if (imgBytes && imgBytes.length > 0) {
    parts.push({ inline_data: { mime_type: imgMime || "image/jpeg", data: uint8ToBase64(imgBytes) } });
  }
  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 120 },
  };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      if (r.status === 429 || r.status === 403) benchKey(key); // hết quota key này -> cho nghỉ
      return { text: null, err: `gemini_http_${r.status}: ${(await r.text()).slice(0, 160)}` };
    }
    const j = await r.json();
    const cand = j && j.candidates && j.candidates[0];
    const txtParts = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts : [];
    let txt = txtParts.map((p) => (typeof p.text === "string" ? p.text : "")).join(" ").trim();
    txt = txt.replace(/^["'“”]+|["'“”]+$/g, "").split(/\r?\n/)[0].trim();
    if (txt && txt.length >= 3) return { text: txt.slice(0, 120), err: null };
    return { text: null, err: "gemini_empty" };
  } catch (e) {
    return { text: null, err: String(e && e.message || e) };
  }
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

// Groq (rất nhanh, free tier rộng). Mặc định openai/gpt-oss-120b (đã kiểm chứng viết tiếng Việt tốt).
async function groqGenerateCaption(env, systemPrompt, userText, imgBytes, imgMime, key) {
  const model = (env && env.GROQ_MODEL) || "openai/gpt-oss-120b";
  // Model gpt-oss là reasoning -> đặt reasoning_effort thấp để "nghĩ" ngắn, trả caption nhanh & không rỗng.
  const extra = /gpt-oss/i.test(model) ? { reasoning_effort: "low" } : {};
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

async function generateCaptionWithVision(env, captionType, imgBytes, sourceUrl, origin, tempId) {
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

  const systemPrompt = isQuote
    ? "Bạn là người viết caption tiếng Việt tinh tế cho ảnh Locket. Dựa vào nội dung bức ảnh, hãy viết ĐÚNG 1 câu trích dẫn ngắn gọn (6-14 chữ), sâu lắng hoặc dễ thương bằng tiếng Việt, KHÔNG dùng ngoặc kép, KHÔNG giải thích thêm."
    : "Bạn là biên tập viên bản tin LNN LIVE hài hước trên Locket. Hãy nhìn kỹ bức ảnh và viết ĐÚNG 1 dòng tiêu đề tin nóng tiếng Việt thật hài hước, bắt trend Gen Z (tối đa 11 chữ, VIẾT HOA TOÀN BỘ, bắt đầu bằng 'TIN NÓNG: ' hoặc 'KHẨN CẤP: '). Không giải thích thêm.";
  const userTextPrompt = isQuote
    ? "Nhìn ảnh và viết 1 câu trích dẫn tiếng Việt ngắn phù hợp với ảnh này."
    : "Nhìn ảnh và viết 1 dòng tin nóng LNN LIVE hài hước bằng tiếng Việt.";

  let lastErr = null;
  let prep = null;
  try {
    prep = await prepareAiInputImage(imgBytes, sourceUrl, origin, tempId);
  } catch (_) {}
  const prepBytes = prep && prep.bytes && prep.bytes.length > 0 ? prep.bytes : null;
  const prepMime = prep ? prep.mimeType : "image/jpeg";

  // Chuỗi fallback caption miễn phí, mỗi provider XOAY NHIỀU KEY: NVIDIA -> Groq -> Gemini -> caption tĩnh.
  const tryFreeFallback = async (reasonTag) => {
    // 1) NVIDIA NIM (vision)
    for (const k of availableKeys("nvidia", env && env.NVIDIA_API_KEY)) {
      const nv = await nvidiaGenerateCaption(env, systemPrompt, userTextPrompt, prepBytes, prepMime, k);
      if (nv.text) return { text: nv.text, source: "nvidia:" + ((env && env.NVIDIA_MODEL) || "meta/llama-3.2-11b-vision-instruct"), aiErr: reasonTag || null };
    }
    // 2) Groq (rất nhanh, free rộng)
    for (const k of availableKeys("groq", env && env.GROQ_API_KEY)) {
      const gq = await groqGenerateCaption(env, systemPrompt, userTextPrompt, prepBytes, prepMime, k);
      if (gq.text) return { text: gq.text, source: "groq:" + ((env && env.GROQ_MODEL) || "llama-3.3-70b-versatile"), aiErr: reasonTag || null };
    }
    // 3) Google Gemini text
    for (const k of availableKeys("gemini", env && env.GEMINI_API_KEY)) {
      const g = await geminiGenerateCaption(env, systemPrompt, userTextPrompt, prepBytes, prepMime, k);
      if (g.text) return { text: g.text, source: "gemini:" + ((env && env.GEMINI_TEXT_MODEL) || "gemini-flash-latest"), aiErr: reasonTag || null };
    }
    // 4) Caption tĩnh vui (luôn trả được chữ, không bao giờ để trống)
    return { text: fallbackText, source: "fallback_" + (reasonTag || "err"), aiErr: reasonTag || null };
  };
  const tryGemini = tryFreeFallback; // giữ tên cũ cho các lời gọi phía dưới

  // Nếu Cloudflare AI vừa chạm quota (4006) hoặc không có binding -> đi thẳng Gemini.
  if (!env || !env.AI || cfAiQuotaActive()) {
    return await tryGemini(!env || !env.AI ? "no_cf_ai" : "cf_quota_cooldown");
  }

  try {
    const userContent = [];
    if (prepBytes) {
      userContent.push({ type: "image_url", image_url: { url: `data:${prepMime};base64,${uint8ToBase64(prepBytes)}` } });
    }
    userContent.push({ type: "text", text: userTextPrompt });

    const payload = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 80,
      temperature: 0.75,
    };

    for (const modelId of ["@cf/mistralai/mistral-small-3.1-24b-instruct", "@cf/meta/llama-3.2-11b-vision-instruct"]) {
      try {
        let resp = await env.AI.run(modelId, payload);
        let txt = String(resp?.response || resp?.result?.response || "").trim();
        txt = txt.replace(/^["'“”]+|["'“”]+$/g, "").split(/\r?\n/)[0].trim();
        if (txt && txt.length >= 4) {
          return { text: txt.slice(0, 100), source: modelId, aiErr: null };
        }
      } catch (mErr) {
        const msg = String(mErr?.message || mErr);
        lastErr = msg;
        // Hết quota Cloudflare -> ghi nhận & fallback Gemini ngay, không thử model CF khác nữa.
        if (isQuotaOrCapacityError(mErr)) {
          markCfAiQuotaHit();
          return await tryGemini("cf_quota_4006");
        }
        if (modelId.includes("llama-3.2") && /agree|license|5016/i.test(msg)) {
          try {
            await env.AI.run(modelId, { prompt: "agree" });
            const retry = await env.AI.run(modelId, payload);
            let txt = String(retry?.response || retry?.result?.response || "").trim();
            txt = txt.replace(/^["'“”]+|["'“”]+$/g, "").split(/\r?\n/)[0].trim();
            if (txt && txt.length >= 4) {
              return { text: txt.slice(0, 100), source: modelId, aiErr: null };
            }
          } catch (rErr) {
            lastErr = String(rErr?.message || rErr);
            if (isQuotaOrCapacityError(rErr)) {
              markCfAiQuotaHit();
              return await tryGemini("cf_quota_4006");
            }
          }
        }
      }
    }
  } catch (outerErr) {
    lastErr = String(outerErr?.message || outerErr);
    if (isQuotaOrCapacityError(outerErr)) markCfAiQuotaHit();
  }
  // Cloudflare AI trả rỗng/lỗi khác -> thử Gemini trước khi dùng fallback tĩnh.
  return await tryGemini(lastErr ? "cf_err" : "cf_empty");
}

async function handleStudioRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  cleanupMemory();
  const url = new URL(request.url);

  // DEBUG: ghi mọi request (trừ chính /status và /ai-filters ảnh) để biết iPhone gọi gì.
  if (url.pathname !== "/status" && url.pathname !== "/" && !url.pathname.startsWith("/ai-filters/")) {
    const entry = {
      method: request.method,
      path: url.pathname,
      origHost: request.headers.get("X-Locket-Orig-Host") || null,
      hasAuth: !!(request.headers.get("Authorization") || request.headers.get("authorization")),
      ua: (request.headers.get("User-Agent") || "").slice(0, 40),
      ts: new Date().toISOString(),
    };
    LAST_ANY_REQUEST = entry;
    REQUEST_LOG.unshift(entry);
    if (REQUEST_LOG.length > 10) REQUEST_LOG.pop();
  }

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
        gemini_text_model: (env && env.GEMINI_TEXT_MODEL) || "gemini-flash-latest",
        keys_benched: KEY_COOLDOWN.size,
        cf_ai_quota_hit: cfAiQuotaActive(),
        cf_ai_quota_cooldown_until: CF_AI_QUOTA_HIT_UNTIL ? new Date(CF_AI_QUOTA_HIT_UNTIL).toISOString() : null,
        ai_prompts_loaded: Object.keys(AI_FILTER_PROMPTS).length,
        luts_loaded: Object.keys(LUT_FILTERS).length,
        frames_loaded: Object.keys(FRAMES_MANIFEST).length,
        cached_frames_in_ram: FRAME_CACHE.size,
        cached_images_in_ram: MEMORY_IMAGES.size,
        last_debug: LAST_DEBUG,
        last_caption_debug: LAST_CAPTION_DEBUG,
        last_fallback_debug: LAST_FALLBACK_DEBUG,
        last_any_request: LAST_ANY_REQUEST,
        last_decode_err: LAST_DECODE_ERR,
        last_caption_raw: LAST_CAPTION_RAW,
        request_log: REQUEST_LOG,
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

  // 2.5 Handle Locket /generateCaption (LNN LIVE Tin nong & Trich dan)
  if (request.method === "POST" && url.pathname.includes("generateCaption")) {
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
    try {
      const upRes = await fetch(upstreamUrl, { method: "POST", headers: fwdHeaders, body: rawBodyText });
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
    } catch (e) {
      upText = String(e?.message || e);
    }

    // DEBUG: ghi nguyên văn response_format + prompt mà Locket 2.74.0 gửi (để dựng đúng cấu trúc trả về).
    LAST_CAPTION_RAW = {
      prompt: typeof dataNode?.prompt === "string" ? dataNode.prompt.slice(0, 600) : null,
      response_format: dataNode?.response_format ? JSON.stringify(dataNode.response_format).slice(0, 800) : null,
      model: dataNode?.model || null,
      allKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
      upErr: upText.slice(0, 300),
      ts: new Date().toISOString(),
    };

    const tempId = crypto.randomUUID().slice(0, 12);
    const { bytes: imgBytes, sourceUrl } = await getInputImageBytes(dataNode, authHeader);
    const gen = await generateCaptionWithVision(env, captionType, imgBytes, sourceUrl, url.origin, tempId);
    const cleanText = gen.text;
    if (gen.source && (gen.source.startsWith("gemini") || gen.source.startsWith("fallback"))) {
      LAST_FALLBACK_DEBUG = { kind: "caption", source: gen.source, reason: gen.aiErr || null, ts: new Date().toISOString() };
    }

    const rfSchema = dataNode?.response_format?.json_schema?.schema?.properties || dataNode?.response_format?.properties || null;
    const rfKeys = rfSchema && typeof rfSchema === "object" ? Object.keys(rfSchema) : [];
    // Bao phủ MỌI tên field caption mà các phiên bản Locket có thể đọc.
    const customData = {
      caption: cleanText,
      text: cleanText,
      headline: cleanText,
      title: cleanText,
      quote: cleanText,
      body: cleanText,
      message: cleanText,
      response: cleanText,
      reply: cleanText,
      output: cleanText,
      result: cleanText,
      generated_text: cleanText,
      generatedText: cleanText,
      completion: cleanText,
      author: "",
      content: cleanText,
    };
    for (const k of rfKeys) {
      if (!(k in customData)) customData[k] = cleanText;
    }

    LAST_CAPTION_DEBUG = {
      mode: "ai_vision_caption",
      source: gen.source,
      aiErr: gen.aiErr || null,
      captionType,
      reqKeys: dataNode && typeof dataNode === "object" ? Object.keys(dataNode) : [],
      rfKeys,
      promptPreview: typeof dataNode?.prompt === "string" ? dataNode.prompt.slice(0, 120) : "",
      got_input: !!(imgBytes || sourceUrl),
      upStatus,
      upErrPreview: upText.slice(0, 220),
      generated: cleanText,
      ts: new Date().toISOString(),
    };

    const payload = Object.assign({}, customData, {
      result: Object.assign({}, customData, { data: customData, status: 200 }),
      data: customData,
      status: 200,
      success: true,
      // Format OpenAI chat (model "gpt-5.4") — một số client đọc choices[].message.content.
      choices: [{ index: 0, message: { role: "assistant", content: cleanText }, finish_reason: "stop" }],
    });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
    });
  }

  // 3. Handle Locket generateFilteredImage / generateFilter / applyFilter
  if (
    request.method === "POST" &&
    (url.pathname.includes("generateFilteredImage") ||
      url.pathname.includes("generateFilter") ||
      url.pathname.includes("applyFilter"))
  ) {
    const rawBodyText = await request.text();
    let bodyObj = {};
    try {
      bodyObj = JSON.parse(rawBodyText || "{}");
    } catch (_) {}

    const dataNode = bodyObj && typeof bodyObj.data === "object" ? bodyObj.data : bodyObj;
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";

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
        const [preparedInput, refImg] = await Promise.all([
          prepareAiInputImage(imgBytes, sourceUrl, url.origin, tempId, authHeader),
          REF_IMAGE_AI_IDS.has(aiReq.filterId)
            ? fetch(`https://tommm1207.github.io/locket-tommm-studio/assets/ai/${encodeURIComponent(aiReq.filterId)}.png`)
                .then(async r => (r.ok ? { bytes: new Uint8Array(await r.arrayBuffer()), mimeType: "image/png" } : null))
                .catch(() => null)
            : Promise.resolve(null),
        ]);

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
            aiOut = await runFluxPooled(env, aiReq.prompt, preparedInput, refImg, ai3dModel, null, ai3dOpts);
            usedModel = (aiOut.via && aiOut.via !== "binding" ? aiOut.via + " " : "") + aiOut.aiModel;
          } catch (err) {
            cfErr = String(err?.message || err);
          }
        }
        // Fallback cuối: provider ảnh ngoài (NVIDIA img2img / Gemini) nếu mọi account Cloudflare đều hết.
        if ((!aiOut || !aiOut.bytes) && preparedInput && preparedInput.bytes) {
          const fb = await fallbackEditImage(env, aiReq.prompt, preparedInput.bytes, preparedInput.mimeType);
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
