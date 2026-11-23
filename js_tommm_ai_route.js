// Tommm Private - Route ONLY PNG Frame & Photobooth filters to Tommm's 24/7 Cloudflare Worker!
// Official Locket native filters go straight to Locket's servers untouched.
// Locket uploads (postMomentV2) NEVER pass through here.
const WORKER_HOST = "locket-tommm-studio.khoinguyennguyen85.workers.dev";
const WORKER_BASE = "https://" + WORKER_HOST;

const FRAME_RE = /"(?:frame_berry_days|frame_happy_snap|frame_sky_diary|photobooth_4cut|photobooth_cute|pb_holo_4cut|pb_scrapbook_ripped_4cut|pb_ripped_paper_4cut|pb_denim_ripped_2x2|frame_classic_pb|khung_hello_kitty_pastel_ngot_ngao|khung_hello_kitty_hong_pastel|khung_pastel_vien_ren|khung_hoa_pastel_vien_xanh_xinh|khung_spiderred|khung_khong_gian_xanh_pastel|khung_ngoi_sao_hong_pastel|khung_pastel_so_hai_cau|khung_shin_chan|khung_anh_hellokitty_v_sao|khung_xanh_tay_sao_vang|sinh_nhat_hello_kitty|pb_single_y2k_silver_holo|pb_single_denim_ripped|pb_single_film_nostalgia|pb_cortis_4cut|pb_cortis_v1|pb_cortis_v2|pb_ech_xanh|pb_galaxy|pb_meo_dang_yeu_4cut|pb_photobooth_hello_kitty|pb_shinchan_4cut|pb_strawberry|pb_supperman_4cut|pb_trung_bac_thao|pb_vien_hello_kitty|pb_vintage|khung_doraemon_shinchan_kitty)"/;

const url = (typeof $request !== "undefined" && $request && $request.url) ? $request.url : "";
const body = (typeof $request !== "undefined" && $request && $request.body) ? String($request.body) : "";

if (url && body && FRAME_RE.test(body)) {
    const newUrl = url.replace(/https?:\/\/(us-central1-locket-4252a\.cloudfunctions\.net|api\.locketcamera\.com)/i, WORKER_BASE);
    let headers = Object.assign({}, ($request && $request.headers) || {});
    delete headers["Host"];
    delete headers["host"];
    headers["Host"] = WORKER_HOST;
    $done({ url: newUrl, headers: headers });
} else {
    $done({});
}
