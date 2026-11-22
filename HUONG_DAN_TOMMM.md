# 👑 Locket Gold • Tommm Private Cloud Studio (24/7)

Hệ thống kích hoạt và tùy biến **Locket Gold VIP** độc lập 100% thuộc quyền sở hữu của **Tommm** (`tommm1207`).
- **Thư mục dự án trên máy tính:** `D:\Locket_Gold_Tommm`
- **Máy chủ Cloud 24/7 (GitHub & jsDelivr CDN):** `https://github.com/tommm1207/locket-tommm-studio`
- **Bảo mật tuyệt đối:** Không qua bất kỳ máy chủ VPS trung gian nào của bên thứ 3, không lộ ảnh chụp hay Token đăng nhập, chặn toàn bộ hệ thống theo dõi ngầm (`Sentry`, `Crashlytics`, `Amplitude`, `AppsFlyer`).

---

## 🔗 1. Các Đường Link Cloud 24/7 Của Riêng Bạn

Bạn có thể sử dụng các đường link dưới đây ở bất kỳ đâu (Wi-Fi nhà, Wi-Fi KTX, 4G/5G) mà **không cần bật máy tính**:

| Thành phần | Đường dẫn Cloud 24/7 | Công dụng |
| :--- | :--- | :--- |
| **1. File Config Shadowrocket** | `https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main/Locket_Tommm_Cloud.conf` | Dán vào mục **Thêm cấu hình (+)** trong Shadowrocket để nạp toàn bộ hệ thống. |
| **2. Script Locket Gold Core** | `https://cdn.jsdelivr.net/gh/tommm1207/locket-tommm-studio@main/Locket_Tommm_Private.js` | Script lõi tự động mở khóa Locket Gold, 350+ Captions, Filter, Photobooth & Rollcall. |
| **3. Hồ sơ DNS Giữ Gold (Shield)** | `https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main/Locket_Tommm_DNS.mobileconfig` | Mở bằng **Safari** trên iPhone để cài DNS chặn thu hồi Gold khi tắt VPN Shadowrocket. |

---

## 📱 2. Hướng Dẫn Cài Đặt & Kích Hoạt Trên iPhone

### Bước 1: Nạp cấu hình vào Shadowrocket
1. Mở ứng dụng **Shadowrocket** trên iPhone → chuyển sang tab **Cấu hình (Config)**.
2. Bấm dấu **`+`** ở góc trên bên phải → Dán link Config Cloud của bạn vào:
   ```text
   https://raw.githubusercontent.com/tommm1207/locket-tommm-studio/main/Locket_Tommm_Cloud.conf
   ```
   *(Hoặc chọn trực tiếp file **`Locket_Tommm_Private.conf`** đã có sẵn trong mục **Tệp Cục bộ** trên máy của bạn).*
3. Chạm vào tên cấu hình để dấu tích màu xanh **`✓`** hiện lên.

### Bước 2: Kiểm tra Giải mã HTTPS (MITM)
*(Nếu bạn dùng file `Locket_Tommm_Private.conf` có sẵn trong Tệp Cục bộ thì đã được nhúng sẵn chứng chỉ, có thể bỏ qua bước này. Nếu tải mới từ link `Locket_Tommm_Cloud.conf` thì kiểm tra như sau)*:
1. Bấm vào chữ **`(i)`** màu xanh bên phải file cấu hình → chọn **Giải mã HTTPS (HTTPS Decryption)**.
2. Đảm bảo công tắc **Giải mã HTTPS** đang **BẬT**. (Nếu máy hỏi chứng chỉ thì chọn chứng chỉ CA đã tin cậy sẵn trên máy của bạn).

### Bước 3: Kích hoạt Locket Gold & Nạp Tính Năng
1. **Tạm tắt DNS chặn thu hồi (nếu đang bật):**
   - Vào **Cài đặt iPhone > Cài đặt chung > Quản lý VPN, DNS & Thiết bị > mục DNS** → Chọn **Tự động (Automatic)**.
   - *Lý do:* Khi đang bật DNS chặn thu hồi, iPhone sẽ chặn kết nối tới `api.revenuecat.com` nên Shadowrocket không bơm gói Gold mới vào được.
2. Mở **Shadowrocket** → Gạt **BẬT** kết nối VPN ở tab **Nhà (Home)**.
3. Vuốt đóng hẳn ứng dụng **Locket** khỏi thanh đa nhiệm, sau đó mở lại **Locket**:
   - Locket sẽ hiện bảng chào mừng **`LOCKET GOLD • TOMMM — Chào mừng Tommm đến với Locket Gold ✨`**.
   - Đầy đủ huy hiệu Gold, quay/tải video 60s từ thư viện, 14 danh mục Caption (350+ Captions), Filter & Photobooth sẽ được nạp vào máy.
4. **Sau khi đã lên Gold & nạp đủ Caption/Filter:**
   - Nếu bạn muốn **tắt VPN Shadowrocket** cho đỡ tốn pin mà vẫn giữ nguyên Locket Gold: Vào lại **Cài đặt > Cài đặt chung > Quản lý VPN, DNS & Thiết bị > DNS** và chọn **`Locket Gold • Tommm Shield 🛡️`** (hoặc `Locket Gold DNS`).
   - Khi nào muốn cập nhật Caption/Filter mới từ Cloud, chỉ cần chuyển DNS về *Tự động* và bật lại VPN Shadowrocket.

---

## 📅 3. Hướng Dẫn Dùng Tính Năng "Lưu Ảnh Kèm Thứ 3D (`THỨ HAI`)" & Strip Photobooth Đa Ngôn Ngữ

Hệ thống đã mở khóa sẵn toàn bộ 7 mẫu **Rollcall Share Templates** (`bold`, `pop_off`, `stacking`, `full_screen`, `shadow_box`, `collage`, `pop_collage`) và 5 mẫu **Time-Travel Rewind Templates** (`rounded_square`, `grid_collage`, `cutout_collage`, `rounded_square_bold`, `wall_calendar`).

### Cách 1: Dùng hiệu ứng chữ Thứ 3D in đậm chìm sau vật thể (`pop_off` / `bold`) & Strip Photobooth
1. Mở **Locket** → Kéo xuống xem lịch sử ảnh của bạn hoặc mục **Rollcall / Kỷ niệm tuần**.
2. Chọn bức ảnh bạn muốn lưu → bấm nút **Chia sẻ (Share) / Lưu**.
3. Lướt qua các mẫu Template:
   - Mẫu **`pop_off` / `bold`**: Tự động tách nền chủ thể (tô phở, tòa nhà, chân dung...) và chèn chữ **THỨ HAI / MONDAY / 星期一 / MONTAG** khổng lồ nằm chìm phía sau chủ thể.
   - Mẫu **`stacking` / `collage`**: Ghép các ảnh trong tuần thành dải **Strip Photobooth** dọc hoặc lưới.
4. **Cách đổi ngôn ngữ chữ Thứ 3D (Việt / Anh / Trung / Đài / Đức) chỉ trong 2 giây:**
   - Vào **Cài đặt iPhone (Settings) > Ứng dụng (Apps) > Locket > Ngôn ngữ (Language)**.
   - Chọn ngôn ngữ bạn muốn hiển thị trên ảnh:
     - 🇻🇳 **Tiếng Việt:** `THỨ HAI`, `THỨ BA`, `THỨ TƯ`, `THỨ NĂM`, `THỨ SÁU`, `THỨ BẢY`, `CHỦ NHẬT`
     - 🇬🇧 **English:** `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`
     - 🇨🇳 **简体中文 (Tiếng Trung):** `星期一`, `星期二`, `星期三`, `星期四`, `星期五`, `星期六`, `星期日`
     - 🇹🇼 **繁體中文 (Tiếng Đài):** `星期一`, `星期二`, `星期三`, `星期四`, `星期五`, `星期六`, `星期日`
     - 🇩🇪 **Deutsch (Tiếng Đức):** `MONTAG`, `DIENSTAG`, `MITTWOCH`, `DONNERSTAG`, `FREITAG`, `SAMSTAG`, `SONNTAG`

### Cách 2: Chọn trực tiếp trong Menu Caption khi vừa chụp ảnh
Ngay trên màn hình Camera của Locket, khi bạn chụp ảnh xong và bấm vào nút chọn **Caption**, kéo xuống danh mục thứ 3:
- **`👑 Tommm VIP Exclusive ✨`**: Bộ Caption cá nhân hóa độc quyền của riêng Tommm.
- **`📅 Thứ Ngày Đa Ngôn Ngữ (VI • EN • ZH • TW • DE)`**: Có sẵn 28 thẻ Thứ trong tuần bằng cả **Tiếng Việt, Tiếng Anh, Tiếng Trung/Đài (`星期 • 禮拜`) và Tiếng Đức** để bạn gắn trực tiếp lên ảnh mà không cần đổi ngôn ngữ máy.

---

## 🛠️ 4. Hướng Dẫn Tự Chỉnh Sửa & Cập Nhật Lên Cloud (Dành Cho Tommm)

Toàn bộ mã nguồn dự án của bạn nằm tại ổ D: **`D:\Locket_Gold_Tommm`**.

### Cấu trúc thư mục `D:\Locket_Gold_Tommm`:
- [build_cloud_edition.js](file:///D:/Locket_Gold_Tommm/build_cloud_edition.js): File trình tạo cấu hình Cloud chính. Bạn muốn sửa lời chào, thêm Caption mới hay thêm Filter mới chỉ cần sửa trong file này.
- [Locket_Tommm_Private.js](file:///D:/Locket_Gold_Tommm/Locket_Tommm_Private.js): File Script tổng hợp được sinh ra tự động từ `build_cloud_edition.js`.
- [Locket_Tommm_Cloud.conf](file:///D:/Locket_Gold_Tommm/Locket_Tommm_Cloud.conf): File Config Shadowrocket trên Cloud GitHub.
- [Locket_Tommm_Private.conf](file:///D:/Locket_Gold_Tommm/Locket_Tommm_Private.conf): File Config Shadowrocket lưu cục bộ trên máy (có nhúng sẵn khóa chứng chỉ CA riêng của iPhone bạn).
- [Locket_Tommm_DNS.mobileconfig](file:///D:/Locket_Gold_Tommm/Locket_Tommm_DNS.mobileconfig): Hồ sơ DNS chặn thu hồi Locket Gold sạch 100%.
- [tommm_server.py](file:///D:/Locket_Gold_Tommm/tommm_server.py) & [Start_Tommm_Server.bat](file:///D:/Locket_Gold_Tommm/Start_Tommm_Server.bat): Server Python cục bộ (chỉ dùng khi bạn muốn test ghép khung Photobooth 4 ô ngay trên máy tính tại nhà).
- `assets/frames/` & `assets/ai/`: Kho 78 khung ảnh PNG Photobooth & Filter chất lượng cao.
- `js_other/`: Kho 16 script mở khóa các ứng dụng khác (YouTube Premium, Spotify, SoundCloud Go+, PicsArt, Lightroom, Alight Motion, CamScanner, Wink, Truecaller, Snow, Meitu...).

### Quy trình 3 lệnh để cập nhật thay đổi lên Cloud 24/7:
Mỗi khi bạn sửa nội dung trong `D:\Locket_Gold_Tommm\build_cloud_edition.js`, hãy mở Terminal (PowerShell) tại thư mục `D:\Locket_Gold_Tommm` và chạy:

```powershell
# 1. Đóng gói lại file Locket_Tommm_Private.js và Config
node build_cloud_edition.js

# 2. Đẩy bản cập nhật lên GitHub Cloud của bạn
git add Locket_Tommm_Private.js Locket_Tommm_Cloud.conf build_cloud_edition.js
git commit -m "Update Tommm Locket Gold Studio"
git push origin main

# 3. Xóa cache CDN để iPhone nhận bản mới ngay lập tức (không cần chờ cache)
Invoke-WebRequest -Uri "https://purge.jsdelivr.net/gh/tommm1207/locket-tommm-studio@main/Locket_Tommm_Private.js" -UseBasicParsing
```
