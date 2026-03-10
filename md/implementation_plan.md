# 個人設置與密碼優化計劃

## 用戶審查要求
> [!IMPORTANT]
> **目標**：解決老用戶每次登錄都需要接收驗證碼的問題。
> [!NOTE]
> **方案**：增加「個人設置」頁面，允許用戶在登錄狀態下自主設置或更新登錄密碼。

## 擬議變更

### 1. 後端接口擴展
#### [NEW] [update-password](file:///Users/joseph/Downloads/oversea%20pf/webapp/src/app/api/auth/update-password/route.ts)
- 調用 Supabase 的 `supabase.auth.updateUser({ password: new_password })` 接口。
- 增加安全性校驗，確保只有已登錄用戶可操作。

---

### 2. 前端界面新增
#### [NEW] [SettingsPage](file:///Users/joseph/Downloads/oversea%20pf/webapp/src/app/app/settings/page.tsx)
- 提供簡約、高級感的設置界面。
- 核心功能：設置/修改密碼。
- 顯示當前賬號信息與會員等級。

#### [MODIFY] [Navbar](file:///Users/joseph/Downloads/oversea%20pf/webapp/src/components/Navbar.tsx)
- 在用戶下拉菜單中新增「⚙️ 個人設置」鏈接。

---

## 驗證計劃
### 手動驗證
1. 使用驗證碼登錄一個老賬號。
2. 進入「個人設置」頁面，設置新密碼。
3. 退出登錄，嘗試使用剛設置的密碼直接進入系統。
4. 驗證密碼更改後的生效情況。
