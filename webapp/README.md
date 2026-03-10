# 企业出海与投资评估分析系统 - 部署说明

## 项目结构

```
webapp/
├── src/
│   ├── app/
│   │   ├── api/               # 后端 API Routes
│   │   │   ├── auth/          # 用户认证（注册/登录/OTP验证/登出）
│   │   │   ├── deepseek/verify/  # DeepSeek API Key 管理
│   │   │   ├── evaluate/      # 108项指标评估计算
│   │   │   ├── ai-analyze/    # AI 深度分析
│   │   │   ├── usage/         # 使用次数查询
│   │   │   ├── subscription/  # 付款码兑换订阅
│   │   │   ├── admin/payment-codes/  # 管理员：生成付款码
│   │   │   └── demo/[id]/     # 免费示例数据
│   │   ├── app/               # 主应用页面（需登录）
│   │   │   ├── page.tsx       # 应用首页（功能入口）
│   │   │   ├── demo/          # 示例报告查看
│   │   │   ├── evaluate/      # 企业评估（付费功能）
│   │   │   ├── history/       # 历史记录
│   │   │   └── admin/         # 管理员后台
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页（营销页）
│   ├── components/
│   │   └── Navbar.tsx         # 导航组件（含用户信息/API Key/付款码弹窗）
│   └── lib/
│       ├── supabase/          # Supabase 客户端
│       ├── deepseek.ts        # DeepSeek API 加密工具
│       ├── calculator.ts      # 108项指标计算引擎
│       └── usage.ts           # 使用次数限制中间件
├── supabase-schema.sql        # 数据库 Schema（在 Supabase 执行）
├── .env.local                 # 环境变量（需填写后部署）
└── .env.example               # 环境变量示例
```

---

## 部署步骤

### 第一步：配置 Supabase

1. 登录 [supabase.com](https://supabase.com)，创建新项目
2. 进入 **SQL Editor**，粘贴并执行 `supabase-schema.sql` 内容
3. 进入 **Settings → API**，复制以下信息：
   - `Project URL` → 对应 `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → 对应 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → 对应 `SUPABASE_SERVICE_ROLE_KEY`
4. 进入 **Authentication → Email templates**，确认 OTP 邮件模板已启用
5. 进入 **Authentication → Providers →Email**，关闭"Confirm email"，启用 OTP 方式

### 第二步：设置管理员账号

1. 先用系统注册一个账号
2. 在 Supabase SQL Editor 执行：
   ```sql
   UPDATE public.profiles SET is_admin = TRUE WHERE email = '你的邮箱@xxx.com';
   ```

### 第三步：部署到 Vercel

1. 登录 [vercel.com](https://vercel.com)，点击 **Add New Project**
2. 导入 GitHub 仓库。
3. **关键设置：** 在 **Framework Preset** 下方的 **Root Directory**，点击 **Edit** 并选择 **`webapp`** 文件夹。
4. 在 **Environment Variables** 中填写以下变量：

   | 变量名 | 值 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
   | `ENCRYPTION_SECRET` | 随机字符串（32位以上，用于加密API Key） |
   | `ADMIN_EMAIL` | 管理员邮箱 |
   | `NEXT_PUBLIC_APP_URL` | 部署后的域名（如 https://yourapp.vercel.app） |

4. 点击 **Deploy**，等待完成

### 第四步：配置 Supabase 重定向 URL

1. 进入 **Supabase → Authentication → URL Configuration**
2. 添加 `Site URL`：`https://yourapp.vercel.app`
3. 添加 `Redirect URLs`：`https://yourapp.vercel.app/**`

---

## 本地开发运行

```bash
cd webapp
# 填写 .env.local 中的环境变量
npm run dev
# 访问 http://localhost:3000
```

---

## 会员管理流程

### 用户升级订阅

1. 用户选择方案，向管理员支付相应金额
2. 管理员登录系统 → `/app/admin` 后台
3. 选择订阅类型，填写金额和备注，点击 **生成付款码**
4. 将生成的付款码发送给用户
5. 用户点击导航右上角用户信息 → **输入付款码升级** → 输入码后自动升级

### 价格方案

| 等级 | 年费 | 功能限制 |
|---|---|---|
| 免费会员 | 免费 | 仅看3个示例报告 |
| 标准会员 | ¥888/年 | 100次/年 AI分析+评估 |
| 高级会员 | ¥1,688/年 | 无限次使用 |

---

## DeepSeek API Key 申请

1. 用户访问 [platform.deepseek.com](https://platform.deepseek.com)，注册账号
2. 创建 API Key（以 `sk-` 开头）
3. 充值余额（按实际调用量计费）
4. 在系统内点击右上角用户信息 → **设置 API Key** → 粘贴后点击验证保存

> 注意：API Key 由用户自行管理，系统会加密存储，不会明文记录。

---

## 注意事项

- `ENCRYPTION_SECRET` 一旦设置后不要修改，否则已存储的 API Key 无法解密
- Supabase 免费版限制：500MB 数据库、50,000 月活用户
- Vercel 免费版限制：100GB 带寬/月，Serverless 冷启动延迟约 1-2 秒
