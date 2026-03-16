# SnapSpend 实现方案

## 你的选择

| 问题 | 选择 |
|------|------|
| 服务器 | 无自建服务器 |
| 端 | 仅 Web |
| 数据 | 云端数据库 + 登录，多设备同步 |
| 账单来源 | 银行推送、付款成功页截图、微信转账等多样式 |

---

## 总体架构（无 VPS，用 BaaS + 云函数）

```
┌──────────────────────────────────────────────────────────────────┐
│  iPhone Shortcut                                                  │
│  1. 截屏 / 选图 / 分享传入图片                                     │
│  2. POST 图片 → 识别 API（云函数）                                 │
│  3. 拿到返回的 token（或直接拿到金额等）                            │
│  4. 打开 https://你的Web域名/record?token=xxx                      │
└──────────────────────────────────────────────────────────────────┘
                    │                              │
                    ▼                              ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  识别 API（云函数）          │    │  记账 Web 应用               │
│  · 接收图片                  │    │  · 登录/注册（Supabase Auth） │
│  · 调用 OCR/大模型 解析      │    │  · /record?token=xxx 预填表单 │
│  · 返回 JSON + 写临时记录    │    │  · 手动改分类、备注、日期     │
│  · 返回 token 给 Shortcut   │    │  · 保存 → 写入 Supabase       │
└─────────────────────────────┘    └─────────────────────────────┘
                    │                              │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │  Supabase（云端）            │
                    │  · 用户认证                  │
                    │  · 记账记录表（多设备同步）   │
                    │  · 可选：临时识别结果表       │
                    └─────────────────────────────┘
```

- **不买 VPS**：用 Supabase（认证+数据库）+ 一家「云函数」做识别 API。
- **多设备同步**：所有记录存 Supabase，用户登录后任意设备打开 Web 都能看到并编辑。

---

## 技术选型

| 模块 | 方案 | 说明 |
|------|------|------|
| 认证 + 数据库 | **Supabase** | 免费额度够用，Postgres + 自带 Auth，多端同步 |
| 识别 API | **Vercel 云函数** 或 **Supabase Edge Function** | 只做一件事：收图 → 调 OCR/大模型 → 返回结构化结果 |
| 前端 | 单页 Web（如 React + Vite） | 部署在 Vercel/Netlify，免费 |
| 账单识别 | **大模型 Vision API**（推荐） 或 OCR + 规则 | 银行推送/付款页/微信转账格式不一，用「看图理解」更稳 |

---

## 账单识别为什么用「大模型看图」

- 银行推送：一条通知，金额+商户+时间挤在一小块文字里。
- 付款成功页：大字号金额、商户名、订单号等布局各异。
- 微信转账：聊天气泡、头像、金额、备注混在一起。

用传统 OCR（如 Tesseract）+ 正则，每种格式都要写规则，维护成本高。用 **GPT-4 Vision / Claude 等「看图并按要求返回 JSON」**，一段 prompt 就能覆盖多种样式，你只需要定义好要的字段（金额、日期、对方/商户、类型等）。

**成本**：按次数计费，个人记账调用量很小，月费可控制在很低甚至免费额度内。需要你在 OpenAI/Anthropic 等开一个 API Key，放在云函数环境变量里，不暴露给前端。

---

## 数据与接口设计（概要）

### Supabase 表结构

- **auth.users**：由 Supabase Auth 管理，不自己建表。
- **records**（记账记录，按用户隔离）  
  - `id` (uuid), `user_id` (uuid, 关联 auth.users)  
  - `amount` (numeric), `currency` (text, 默认 CNY)  
  - `merchant` (text), `category` (text), `date` (date), `note` (text)  
  - `image_url` (text, 可选，若以后要存原图可接 Supabase Storage)  
  - `created_at`, `updated_at`  
  - 行级安全：只允许当前用户读/写自己的记录。

（若用「token 预填」方案，可加一张临时表 `pending_recognitions`：token、JSON 结果、过期时间，供 Web 用 token 取一次即删。）

### 识别 API（云函数）

- **输入**：POST multipart 或 base64 图片。
- **输出**：JSON，例如：  
  `{ "amount": 88.5, "merchant": "星巴克", "date": "2025-03-10", "type": "支出", "raw_text": "..." }`  
  以及可选 `token`（若采用「Shortcut 只拿 token，Web 用 token 拉结果」）。
- **内部**：调大模型 Vision API，prompt 要求「从截图里提取：金额、日期、对方/商户、收支类型」，并严格输出 JSON。

### Shortcut 与 Web 的衔接

- **方式 A（推荐）**：  
  - Shortcut：上传图片 → 识别 API 返回 `token`。  
  - 打开 `https://你的域名/record?token=xxx`。  
  - Web：若 URL 带 `token`，先调后端「用 token 取识别结果」（或从 Supabase 临时表读），再预填表单；用户补充/修改后点保存，写入 `records`。
- **方式 B**：  
  - 识别 API 直接返回金额、商户、日期等。  
  - Shortcut 拼成 query：`/record?amount=88.5&merchant=星巴克&date=2025-03-10`（注意 URL 编码）。  
  - 简单，但内容一多或含特殊字符就容易超长或出错，所以更推荐用 token。

---

## 实现步骤（分阶段）

### 阶段 1：基础 Web + 云端同步（先不接 Shortcut）

1. 创建 Supabase 项目，开 Auth（邮箱或手机号登录）、建 `records` 表与 RLS。
2. 本地起一个前端项目（如 React + Vite），接 Supabase 登录/注册。
3. 做「记账」页：表单（金额、商户、分类、日期、备注）+ 列表；增删改查都走 Supabase，保证登录后多设备能看到同一份数据。
4. 部署到 Vercel/Netlify，用自定义域名或默认域名均可。

目标：先能用浏览器登录、记一笔、换设备再登录能看到，把「云端 + 多设备同步」打通。

### 阶段 2：识别 API（云函数）

1. 在同一个仓库里加「识别」接口：  
   - Vercel：`/api/recognize`（Serverless Function）；或  
   - Supabase：Edge Function `recognize`。
2. 接口内：接收图片 → 调大模型 Vision API（你提供 API Key 放环境变量）→ 解析成固定 JSON 结构返回；若用 token 方案，则再写一次 Supabase 临时表并返回 `token`。
3. 用 Postman/curl 或简单 HTML 表单上传一张截图，确认返回的 JSON 正确（金额、日期、商户等）。

目标：不依赖 Shortcut，先保证「传图 → 得到结构化结果」稳定。

### 阶段 3：Web 接「识别结果」并预填

1. 记账页支持两种进入方式：  
   - 直接打开：空白表单；  
   - 带 `?token=xxx` 打开：用 token 调接口或 Supabase 取识别结果，预填表单。
2. 用户可修改任何字段，选分类，点保存写入 `records`。
3. 若用临时表，取完一次后删除或标记过期。

目标：浏览器里「上传图 → 得到识别结果 → 预填 → 改一改保存」全流程跑通。

### 阶段 4：Shortcut 串联

1. 在 iPhone 上新建快捷指令：  
   - 获取截图/相册/分享的图片；  
   - 「获取 URL 内容」：POST 到你的 `https://你的域名/api/recognize`（或 Edge Function URL），body 为图片；  
   - 从返回 JSON 里取 `token`（或直接取 amount、merchant、date 拼 URL）；  
   - 「打开 URL」：`https://你的域名/record?token=xxx`。
2. 若未登录：打开后先登录再自动跳回带 token 的 record 页（或刷新带 token 的 URL），再预填。
3. 测试：从通知/付款页/微信转账各截一张图，跑 Shortcut，确认能打开 Web 并预填、保存后能在列表里看到。

目标：实现你要的「触发 Shortcut → 自动截图/选图 → 自动识别 → 手动加细节 → 完成记账」。

### 阶段 5（可选）：体验与安全

- 存原图：识别时把图上传到 Supabase Storage，`records.image_url` 存链接，方便以后查看凭证。
- 分类/标签：在 `records` 里加 `category` 或 tag 表，前端做筛选与统计。
- 安全：识别 API 可加简单限流或短期 token（如 10 分钟有效），避免 token 被滥用。

---

## 你需要准备的东西

| 用途 | 需要 |
|------|------|
| Supabase | 注册 [supabase.com](https://supabase.com)，新建项目，记下 Project URL 和 anon key |
| 部署前端 + 云函数 | 注册 Vercel 或 Netlify，关联 GitHub 仓库 |
| 账单识别 | OpenAI 或 Anthropic 等 API Key（仅放在云函数环境变量里） |
| Shortcut | 无需付费，用系统「快捷指令」即可 |

---

## 小结

- **无服务器**：用 Supabase（认证+数据库）+ 一个云函数（识别 API），不买 VPS。
- **只要 Web**：所有「手动添加细节 + 完成记账」都在 Web 完成；Shortcut 只负责传图、拿 token、打开带 token 的 record 页。
- **多设备同步**：全部记录在 Supabase，登录即同步。
- **多种账单**：用大模型 Vision 看图输出固定 JSON，适配银行推送、付款页、微信转账等。

如果你认可这个方案，下一步可以从 **阶段 1** 开始：建 Supabase 项目 + 前端登录与记账页，需要的话我可以按「阶段 1」一步步写出具体代码（项目结构、Supabase 配置、前端页面与 API 调用）。
