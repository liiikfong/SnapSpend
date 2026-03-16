# iPhone Shortcut 快速记账（全流程）

目标路径：

`停留在付款信息页面 -> 触发快捷指令 -> 自动截图 -> 上传识别 -> 打开预填网页`

## 前置条件

- 已部署网站（例如 `https://snapspend-liii.vercel.app`）
- Vercel 环境变量已配置：`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- 网页可正常打开 `https://你的域名/record`

## Shortcut 配置步骤（推荐）

1. 新建快捷指令，命名：`SnapSpend 快速记账`
2. 添加动作：`截取屏幕快照`（Take Screenshot）
3. 添加动作：`Base64 编码`（输入为上一步截图）
4. 添加动作：`文本`，内容：

```json
{"image":"[Base64 编码结果]","mimeType":"image/png"}
```

5. 添加动作：`获取 URL 内容`
   - URL：`https://你的域名/api/recognize`
   - 方法：`POST`
   - 请求体：`JSON`
   - JSON 内容：使用第 4 步的文本结果
6. 添加动作：`从字典中获取值`
   - 键名：`token`
7. 添加动作：`文本`
   - 内容：`https://你的域名/record?token=[token]`
8. 添加动作：`打开 URL`

## 体验建议

- 建议把快捷指令添加到 `控制中心` 或 `桌面`，付款页一键触发
- 第一次使用前，先在网页端登录，避免中途输入账号
- 如果当时未登录，系统会先打开登录页；登录后会自动回到带 `token` 的地址

## 常见问题

- `识别失败`：截图信息不完整，重新截取包含金额与商户区域
- `429`：Gemini 免费配额用尽，隔天重试或切到 `gemini-2.5-flash-lite`
- `token 无效`：token 是一次性且短时有效，需重新触发快捷指令
