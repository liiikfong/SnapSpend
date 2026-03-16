# 通过图片记账 + Shortcut 配置

## 一、先让「从图片识别」在网页上能用

1. **Supabase 执行临时表**  
   在 SQL Editor 里执行 `docs/run-pending-recognitions.sql`（若还没执行过）。

2. **部署到 Vercel**  
   推送代码到 GitHub，在 Vercel 导入项目并部署。

3. **在 Vercel 配环境变量**  
   - `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（前端用）  
   - `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（API 用，service_role 在 Supabase → Project Settings → API）  
   - `OPENAI_API_KEY`（[OpenAI API Keys](https://platform.openai.com/api-keys) 创建）

4. **重新部署**  
   保存环境变量后触发一次 Redeploy。

5. **在网站测一次**  
   打开 `https://你的域名/record`，点「从图片识别」，选一张账单/转账截图，应能识别并预填表单。

## 二、Shortcut 怎么调识别 API

识别 API 约定：

- **POST** `https://你的域名/api/recognize`  
  - 请求体：JSON `{ "image": "<base64 字符串>", "mimeType": "image/png" }`（或 `image/jpeg`）  
  - 返回：`{ "token": "uuid", "amount": -88.5, "merchant": "星巴克", "date": "2025-03-10", ... }`

- **GET** `https://你的域名/api/recognize?token=xxx`  
  - 返回该 token 的识别结果（用于打开 `/record?token=xxx` 时前端拉预填数据），用一次后 token 失效。

Shortcut 里需要：

1. 拿到图片（截屏 / 相册 / 分享）。
2. 把图片转成 Base64（快捷指令里用「Base64 编码」等动作）。
3. 用「获取 URL 内容」POST 到 `/api/recognize`，Body 选 JSON，内容为 `{"image": "<上一步的 Base64>", "mimeType": "image/png"}`。
4. 从返回里取 `token`。
5. 「打开 URL」：`https://你的域名/record?token=刚拿到的 token`。

不同 iOS 版本里「获取 URL 内容」的界面可能略有差异，但思路都是：POST JSON body → 取 `token` → 用 token 打开 `/record?token=xxx`。

## 三、本地开发时测「从图片识别」

本地只跑 `npm run dev` 时，没有 `/api`，需要把请求指到已部署的 API：

在项目根目录 `.env` 里加（把域名换成你的 Vercel 域名）：

```env
VITE_API_BASE=https://你的项目.vercel.app
```

重启 `npm run dev` 后，再点「从图片识别」会请求你部署好的 API。
