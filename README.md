# K-Pulse — Hệ thống quản lý KPI (DAEKHON VINA)

Ứng dụng theo dõi KPI theo mô hình MBO/BSC: phân rã chỉ tiêu từ Công ty → Phòng ban →
Cá nhân, nhập số liệu thực tế, theo dõi ngưỡng RAG, lập báo cáo và gửi nhắc việc.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Recharts

---

## Bắt đầu

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị
npm run dev
```

Mở http://localhost:3000

### Biến môi trường bắt buộc

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Khi dùng cloud | Bỏ trống → app chạy chế độ offline |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khi dùng cloud | |
| `SUPABASE_SERVICE_ROLE_KEY` | Khuyến nghị mạnh | Chỉ dùng ở server; cần để giấu hash mật khẩu khỏi trình duyệt |
| `AUTH_SECRET` | **Có** (production) | Khoá ký cookie phiên. Đổi khoá = đăng xuất toàn bộ |
| `CRON_SECRET` | Có, nếu bật cron | Bảo vệ endpoint gửi email hàng tháng |
| `RESEND_API_KEY` | Khi gửi email | |

Xem `.env.example` để biết đầy đủ.

### Thiết lập Supabase

Chạy [`supabase/schema.sql`](supabase/schema.sql) trong SQL Editor của Supabase.
Script này thêm cột `password_hash`, tạo bảng `notifications` / `app_settings`, và
thu hồi quyền đọc `password_hash` của role `anon`.

---

## Xác thực

- Mật khẩu băm bằng **scrypt** (`node:crypto`), lưu dạng `scrypt$<salt>$<hash>`.
  Trình duyệt không bao giờ nhận được hash.
- Phiên đăng nhập là **cookie httpOnly ký HMAC-SHA256**, hạn 7 ngày.
- [`src/proxy.ts`](src/proxy.ts) chặn `/dashboard/*` và `/api/*` ở phía server.
  (Next.js 16 đổi tên quy ước `middleware` thành `proxy`.)
- Tài khoản chưa có mật khẩu sẽ được yêu cầu **tạo mật khẩu ở lần đăng nhập đầu**,
  không bị khoá.
- Chỉ Admin mới đặt lại được mật khẩu của người khác (trong Users → Edit).
  Không có luồng "quên mật khẩu" tự phục vụ.

---

## Lưu trữ dữ liệu

| Môi trường | Nguồn sự thật |
|---|---|
| Có cấu hình Supabase | Supabase. Tệp cục bộ không ghi đè dữ liệu cloud |
| Không có Supabase (dev) | `data.json` ở thư mục gốc |
| Vercel / serverless | Chỉ Supabase — hệ thống tệp là chỉ đọc |

`data.json` và `notifications.json` nằm trong `.gitignore`; đây là dữ liệu chạy thật,
không phải một phần mã nguồn.

---

## Câu lệnh

```bash
npm run dev     # máy chủ phát triển
npm run build   # build production
npm run start   # chạy bản đã build
npm run lint    # ESLint
npx tsc --noEmit  # kiểm tra kiểu
```

---

## Cấu trúc thư mục

```
src/
  app/
    api/auth/        đăng nhập, phiên, đổi mật khẩu
    api/notifications/  thông báo trong app + email
    api/storage/     ảnh chụp JSON cục bộ (chỉ khi dev)
    dashboard/       các trang trong hệ thống
    login/
  components/        thành phần giao diện theo miền
  context/KPIContext.tsx   state toàn cục + đồng bộ
  lib/               session, mật khẩu, truy cập dữ liệu, xuất file, ảnh
  proxy.ts           bảo vệ route phía server
supabase/schema.sql  thiết lập cơ sở dữ liệu
```

---

## Việc còn lại

- KPIContext vẫn đọc/ghi Supabase trực tiếp từ trình duyệt bằng anon key.
  Muốn bật RLS chặt (deploy công khai) thì phải đưa các truy vấn này về Route Handler
  dùng service-role key. Chi tiết trong phần 4 của `supabase/schema.sql`.
- Chưa có bộ kiểm thử tự động.
