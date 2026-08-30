# YGOPRODeck Cloudflare Worker Proxy

Worker proxy trung gian cho [YGOPRODeck API](https://ygoprodeck.com/api-guide/) phục vụ ứng dụng web tĩnh (như GitHub Pages), giải quyết vấn đề CORS, bảo vệ upstream với Rate Limit và tối ưu tốc độ bằng Caching.

---

## Tính năng

- **`/images`**: Proxy tải ảnh thẻ Yu-Gi-Oh! từ YGOPRODeck, thêm header CORS để browser có thể render và tải ảnh dạng Blob mà không bị lỗi tainted canvas / CORS.
- **`/search`**: Proxy endpoint tìm kiếm thẻ (`https://ygoprodeck.com/api/search/cards.php`), chuyển tiếp toàn bộ query parameters (`name`, `num`, `offset`, `sort`, v.v.) kèm header CORS.
- **Rate Limiting**: Thuật toán Token Bucket giới hạn tối đa **20 requests/giây** (per-isolate), bảo vệ upstream không bị quá tải hoặc block IP.
- **Bảo mật**: Chỉ cho phép proxy ảnh từ các domain hợp lệ (`images.ygoprodeck.com`, `ygoprodeck.com`, `db.ygoprodeck.com`).
- **Edge Caching**: 
  - Ảnh: Cache 24 giờ (`public, max-age=86400`).
  - Kết quả tìm kiếm: Cache 5 phút (`public, max-age=300`).
- **Chi phí**: Hoàn toàn miễn phí trên Cloudflare Free Tier (hỗ trợ tới **100,000 requests/ngày**).

---

## Yêu cầu chuẩn bị

1. Đã cài đặt **Node.js** (phiên bản 18+).
2. Tài khoản **Cloudflare** (đăng ký miễn phí tại [cloudflare.com](https://cloudflare.com)).

---

## Hướng dẫn cài đặt & Deploy

### 1. Cài đặt dependencies

Mở terminal tại thư mục gốc của project hoặc chuyển vào `cf-worker`:

```bash
cd cf-worker
npm install
```

---

### 2. Chạy thử nghiệm ở môi trường Local

Khởi chạy máy chủ phát triển cục bộ với Wrangler:

```bash
npm run dev
```

Worker sẽ lắng nghe tại `http://localhost:8787`. Bạn có thể kiểm tra:
- Health check: `http://localhost:8787/`
- Test search: `http://localhost:8787/search?name=Dark%20Magician&num=5`
- Test image: `http://localhost:8787/images?url=https%3A%2F%2Fimages.ygoprodeck.com%2Fimages%2Fcards%2F46986414.jpg`

---

### 3. Đăng nhập Cloudflare CLI

Chạy lệnh sau để xác thực tài khoản Cloudflare của bạn trên máy tính:

```bash
npx wrangler login
```

Trình duyệt sẽ mở ra trang ủy quyền của Cloudflare. Nhấn **Allow** để hoàn tất xác thực.

---

### 4. Cấu hình & Deploy lên Cloudflare

1. Cấu hình file `cf-worker/wrangler.toml`:
   ```toml
   name = "yugioh-image-proxy"
   main = "src/index.js"
   compatibility_date = "2024-09-23"
   compatibility_flags = ["nodejs_compat"]

   [vars]
   # Cấu hình CORS Whitelist:
   # - "*" : Cho phép mọi domain truy cập
   # - Hoặc điền danh sách domain cụ thể phân tách bằng dấu phẩy:
   ALLOWED_ORIGINS = "https://nqtpopcorn.github.io,http://localhost:5173,http://localhost:4173"
   ```

2. Tiến hành deploy:
   ```bash
   npm run deploy
   ```
   *(hoặc chạy `npx wrangler deploy`)*

3. Sau khi deploy thành công, terminal sẽ in ra URL của worker, ví dụ:
   ```
   Published yugioh-image-proxy (1.52 sec)
     https://yugioh-image-proxy.<your-subdomain>.workers.dev
   ```

---

### 5. Cấu hình biến môi trường cho Ứng dụng Web

Quay trở lại thư mục gốc của project `yugioh-tools`, mở file `.env` (nếu chưa có thì copy từ `.env.example`):

```bash
# CORS proxy để fetch ảnh từ YGOPRODeck (production)
VITE_YGOPRO_IMAGE_PROXY_URL="https://yugioh-image-proxy.<your-subdomain>.workers.dev/images?url={url}"

# CORS proxy cho YGOPRODeck card search API (production)
VITE_YGOPRO_SEARCH_PROXY="https://yugioh-image-proxy.<your-subdomain>.workers.dev/search"

# Base URL của YGOPRODeck card info API (production)
VITE_YGOPRO_API_BASE="https://db.ygoprodeck.com/api/v7/cardinfo.php"
```

> **Lưu ý**: Thay thế `<your-subdomain>` bằng subdomain thực tế của bạn trên Cloudflare Workers.

Sau đó, tiến hành build và deploy ứng dụng web lên GitHub Pages:

```bash
npm run build
npm run deploy
```

---

## Chi tiết API Endpoints

### 1. `GET /images`
- **Mục đích**: Proxy tải ảnh thẻ Yu-Gi-Oh!.
- **Query params**:
  - `url` *(bắt buộc)*: URL ảnh đã được encode (`encodeURIComponent`).
- **Ví dụ**:
  ```bash
  curl -I "https://yugioh-image-proxy.<your-subdomain>.workers.dev/images?url=https%3A%2F%2Fimages.ygoprodeck.com%2Fimages%2Fcards%2F46986414.jpg"
  ```
- **Response**: Image data với `Access-Control-Allow-Origin: *` và `Cache-Control: public, max-age=86400`.

### 2. `GET /search`
- **Mục đích**: Proxy tìm kiếm thẻ từ YGOPRODeck Search API.
- **Query params**: Hỗ trợ đầy đủ các tham số của YGOPRODeck Search:
  - `name`: Tên thẻ (hỗ trợ fuzzy / partial match).
  - `num`: Số lượng thẻ trả về (mặc định 18).
  - `offset`: Phân trang offset (mặc định 0).
  - `sort`: Kiểu sắp xếp (vd: `new`, `name`).
- **Ví dụ**:
  ```bash
  curl "https://yugioh-image-proxy.<your-subdomain>.workers.dev/search?name=Blue-Eyes&num=5&sort=new"
  ```
- **Response**: JSON danh sách thẻ kèm pagination data.

### 3. `GET /`
- **Mục đích**: Health check và hướng dẫn endpoint.

---

## Xử lý sự cố thường gặp (Troubleshooting)

| Mã lỗi / Hiện tượng | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| **`429 Too Many Requests`** | Vượt quá 20 req/s từ cùng một client hoặc isolate. | Giảm tần suất gửi request hoặc tăng giá trị `RATE_LIMIT_RPS` trong `src/index.js` nếu cần. |
| **`403 Host is not allowed`** | Tải ảnh từ domain ngoài whitelist. | Kiểm tra URL ảnh có thuộc `images.ygoprodeck.com` không. Nếu cần domain khác, bổ sung vào `ALLOWED_IMAGE_HOSTS`. |
| **`502 Upstream fetch failed`** | Server YGOPRODeck bị chậm hoặc không phản hồi. | Kiểm tra trạng thái máy chủ YGOPRODeck hoặc thử lại sau vài giây. |
| **Lỗi CORS trên browser** | Endpoint chưa trả về CORS headers. | Đảm bảo gọi đúng URL Worker đã deploy và worker phản hồi header `Access-Control-Allow-Origin: *`. |
