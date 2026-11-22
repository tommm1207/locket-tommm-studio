# 🤖 AI Filter & Photobooth Self-Hosted Server (BYOK — Bring Your Own Key)

Thư mục này dành cho bạn (hoặc bất kỳ ai sử dụng repo này) muốn tự chạy **Server xử lý Filter AI 3D & Photobooth 4-Cut** riêng 24/7 bằng **API Key cá nhân miễn phí**, đảm bảo:
- **100% Bảo mật:** Ảnh chỉ đi qua server riêng của bạn, không qua VPS bên thứ 3.
- **Không chia sẻ / không hết lượt dùng chung:** Mỗi người tự tạo 1 `GEMINI_API_KEY` miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey) và dán vào biến môi trường của chính mình.

## 🚀 Cách tự chạy (Local hoặc Deploy miễn phí 24/7 trên Render / Railway)

1. Copy file `.env.example` thành `.env` và điền `GEMINI_API_KEY` của riêng bạn vào.
2. Nếu deploy lên **Render.com (Free Tier)**:
   - Kết nối repo GitHub này → Chọn Root Directory: `ai-server`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python server.py`
   - Vào mục **Environment Variables** → Thêm `GEMINI_API_KEY = <Key của riêng bạn>`
3. Sau khi có domain riêng (ví dụ `https://your-locket-ai.onrender.com`), bạn chỉ cần thêm rule chuyển tiếp `generateFilteredImage` trong Shadowrocket về domain riêng đó của bạn!
