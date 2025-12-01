## Bước 1: Cấu hình vite.config.js (Quan trọng)

Mặc định Vite sẽ build ra đường dẫn gốc (/). Vì bạn đang deploy lên GitHub Pages dưới dạng project (ví dụ: https://nqtpopcorn.github.io/deploy-react/), bạn cần set base trùng với tên repository.

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tên repo của bạn là 'deploy-react' (dựa theo package.json)
  // Dấu gạch chéo đầu và cuối là bắt buộc
  base: "/",
});
```

## Bước 2: Kiểm tra lại package.json

Phải có trong package.json:

- "homepage": "https://nqtpopcorn.github.io/deploy-react"
- "scripts": { "deploy": "gh-pages -d dist", ... }
- gh-pages trong devDependencies.

Bước 3: Cấu hình Router (Nếu có dùng)

```js
import { BrowserRouter } from "react-router-dom";

<BrowserRouter basename="/deploy-react">
  <App />
</BrowserRouter>;
```
