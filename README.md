# SnapSpend

通过 iPhone Shortcut 触发 → 截图 → 识别账单 → 手动补全 → 云端记账。多设备同步。

## 阶段 1：本地运行

### 1. 创建 Supabase 项目

1. 打开 [supabase.com](https://supabase.com) 注册/登录，新建项目（选区、设数据库密码）。
2. 进入 **Project Settings → API**（或 General 找 Project URL），记下 **Project URL** 和 **anon public** key。

### 2. 建表与 RLS

在 Supabase 控制台打开 **SQL Editor**，依次执行：

- **记账表**：复制 `docs/run-in-supabase-sql-editor.sql` 整段执行。
- **图片识别临时表**：复制 `docs/run-pending-recognitions.sql` 整段执行。

### 3. 本地环境

```bash
cp .env.example .env
# 编辑 .env，填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

浏览器打开 `http://localhost:5173`，注册账号后在记账页可手动记一笔；换设备登录同一账号可看到同一份数据。

---

## 通过图片记账（阶段 2 + 3）

### 部署到 Vercel（识别 API 需要）

1. 将项目推到 GitHub，在 [vercel.com](https://vercel.com) 导入该仓库。
2. 在 Vercel 项目 **Settings → Environment Variables** 里添加：

| 变量名 | 说明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_URL` | 同上（API 用） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **Project Settings → API** 里的 **service_role** key（仅服务端，勿泄露） |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) 的 API Key（用于 Gemini 识别账单截图） |

3. 重新部署一次，使环境变量生效。

### 使用方式

- **网页「从图片识别」**：在记账页点击「从图片识别」，选一张账单/转账/付款截图，自动识别金额、商户、日期等并预填表单，改完点「记一笔」。
- **带 token 的链接**：若从 Shortcut 打开 `https://你的域名/record?token=xxx`，页面会先拉取该 token 对应的识别结果并预填（token 一次有效，用完即删）。

### 本地测「从图片识别」

本地 `npm run dev` 时，前端没有 `/api`，需指向已部署的 API：在 `.env` 里增加一行（把域名换成你的 Vercel 域名）：

```env
VITE_API_BASE=https://你的项目.vercel.app
```

---

## iPhone Shortcut 串联（阶段 4）

1. 打开「快捷指令」App，新建快捷指令。
2. 添加操作：
   - **获取剪贴板** 或 **选择照片** / **截屏**（按你习惯：先截图再运行、或运行后选图）。
3. **脚本 →  Base64 编码**：对图片做 Base64 编码（若 Shortcut 无直接「请求体 JSON」传图，可先「获取 URL 内容」用 GET 带 base64 的 data URL 或改用「请求体」里放 base64；具体以你当前 iOS 版本为准）。
4. **获取 URL 内容**：
   - URL：`https://你的域名/api/recognize`
   - 方法：POST
   - 请求体：JSON，如 `{"image": "这里填上一步的 Base64 字符串", "mimeType": "image/png"}`
   - 从返回 JSON 里取 `token`。
5. **打开 URL**：`https://你的域名/record?token=上一步的 token`。
6. 保存并运行：应会打开记账页并预填识别结果，补全后点「记一笔」即可。

（若你的 Shortcut 版本支持「请求体」里直接选「文件」而不是 Base64，可改为 multipart 上传，届时需在 API 中开放对应解析。）

---

## 项目结构

```
SnapSpend/
├── api/recognize.ts         # 识别 API（POST 图 → 返回 token+结果；GET ?token= → 返回结果并删除）
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── run-in-supabase-sql-editor.sql
│   ├── run-pending-recognitions.sql
│   └── 环境变量配置步骤.md
├── supabase/migrations/
├── src/
│   ├── components/          # RecordForm, RecordList
│   ├── contexts/            # AuthContext
│   ├── pages/               # Login, Register, RecordPage（含「从图片识别」与 token 预填）
│   └── ...
├── .env.example
├── package.json
├── vercel.json
└── README.md
```
