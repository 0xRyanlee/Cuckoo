# 📋 Cuckoo TODOs — 開發任務清單

> **Last Updated**: 2026-04-26 | **Version**: v1.1.0
>
> 本清單基於 2026-04-26 對抗性審計 v4.0，反映當前真實狀態。

---

## 🔴 P0 — 生產阻斷（已全部修復）

- [x] **採購單狀態 SQL `?1→?2`** — `database.rs:2666` ✅
- [x] **POS orderId 提取錯誤** — 前端使用實際 row ID ✅
- [x] **submit_order 不創建廚房工單** — 調用 `create_kitchen_tickets` ✅
- [x] **calculate_recipe_cost 返回 f64** — 改返回完整 `RecipeCostResult` ✅
- [x] **adjust_inventory 語義錯誤** — delta → 絕對值混淆，加負庫存防護 ✅
- [x] **order_no 毫秒精度** — `%Y%m%d%H%M%S%3f` ✅

---

## 🟠 P1 — 重要功能缺陷（已全部修復）

### Bug Fixes

- [x] **POS 雙 ¥ 符號** — 移除多餘前綴 ✅
- [x] **廚房單硬編碼「堂食」** — 動態讀取 dineType ✅
- [x] **批次標籤硬編碼「kg」** — 讀取材料 base_unit ✅
- [x] **Dashboard 最近訂單不受時間篩選影響** — 改用 filteredOrders ✅
- [x] **record_wastage 無負庫存保護** — 加 `qty > current_qty` 檢查 ✅
- [x] **訂單列表硬限 100 筆** — 改為分頁參數，預設 200 ✅
- [x] **KDS 工單不顯示菜品名** — menuItemNames prop 傳入 ✅
- [x] **KDS 無超時視覺警告** — 超 15 分鐘紅色邊框 + AlertCircle ✅
- [x] **入庫表單允許零或負數** — 加 `quantity > 0` 驗證 ✅
- [x] **規格選擇必填無法跳過** — 移除 disabled 限制 ✅
- [x] **批次號無自動生成** — 開啟對話框時自動填充 ✅
- [x] **POS localStorage 購物車價格陳舊** — 還原時重新水合 ✅

### 安全與數據完整性

- [x] **廢棄無負庫存保護** — 加數量檢查 ✅
- [x] **盤點實際數量清空後靜默為 0** — 加 NaN 保護 ✅
- [x] **生產完工數量清空後靜默為 0** — 加數量檢查 ✅
- [x] **飛鵝 HTTP 請求無超時** — 加 10s timeout ✅
- [x] **batch_cancel_orders 非事務性** — 改為任意失敗返回 Err ✅

---

## 🟡 P2 — 中優先級改進

### 架構優化（v4.0 審計）

- [x] **React Router 路由化** — 替代 activeTab 條件渲染 ✅ **v1.1.0 已實現**
- [x] **統一類型定義** — `src/types/index.ts` ✅ **v1.1.0 已實現**
- [x] **Hooks 框架基礎** — `useAppData` / `useAppActions` ✅ **v1.1.0 已實現**
- [x] **usePartialLoadData** — 局部刷新鉤子 ✅ **2026-04-26 新增**
- [x] **useAppContext** — Context + 便捷鉤子 ✅ **2026-04-26 新增**
- [ ] **Hooks 集成到 App.tsx** — 使用新鉤子重構 ⏳ 待重構

### 功能完善

- [ ] **低庫存閾值可配置** — 現為硬編碼 10
- [x] **KDS 音效提示** — 新工單到達時播放提示音 ✅ **已存在**
- [x] **KDS 工作站篩選** — 多工作站場景下按站點過濾 ✅ **已存在**
- [x] **採購單條目成本/數量輸入驗證** — qty <= 0 和 cost < 0 均阻止 ✅
- [ ] **採購入庫 UI 優化** — 採購單→入庫→批次生成流程
- [ ] **訂單修改器 (Modifiers)** — POS 中加料/去料功能完善
- [x] **配方明細只能添加原材料** — 新增類型切換按鈕 ✅
- [x] **數據庫索引** — 已完善（24 個索引）✅
- [x] **React Router** — 啟用 code splitting ✅

### 安全監控

- [x] **打印模板 XSS** — dangerouslySetInnerHTML 無 sanitization 🟡 監控中
- [x] **Mutex 中毒風險** — 140 個 lock().unwrap() 🟡 監控中

---

## 🔵 Release Prep

- [ ] **代碼簽名 (macOS)** — 配置 Apple Developer 證書
- [ ] **代碼簽名 (Windows)** — 配置 EV 證書
- [ ] **版本號同步** — `package.json`, `Cargo.toml`, `tauri.conf.json`
- [x] **Rust 編譯警告清理** — 全部清零 ✅
- [x] **TypeScript 編譯** — `tsc && vite build` ✅

---

## 🚫 已知不做（暫緩）

- 微信小程序接入、多店鋪、會員管理、優惠券 — 超出 v1.x 範圍
- WebSocket KDS — 輪詢已夠用，暫不引入複雜度
- 權限系統 — v2.x 規劃

---

## ✅ 已完成

- [x] 原材料管理 CRUD + 標籤 + 分類
- [x] 配方系統 + 成本計算
- [x] 訂單流程完整閉環
- [x] POS 點單
- [x] KDS 廚顯看板（15s 自動刷新 + 音效 + 工作站）
- [x] 庫存管理批次
- [x] 採購 / 生產 / 盤點訂單
- [x] 打印引擎（ESC/POS + 飛鵝）
- [x] 報表分析（5 維度）
- [x] 通知預警系統
- [x] Dashboard 時間篩選 + 最近訂單同步篩選
- [x] React Router 路由化
- [x] 統一類型定義
- [x] Hooks 框架基礎

---

## 📊 v4.0 審計統計

| 嚴重度 | 數量 | 狀態 |
|--------|------|------|
| 🔴 P0 | 13 | ✅ 全部修復 |
| 🟠 P1 | 28 | ✅ 全部修復 |
| 🟡 P2 | 18 | 🔵 15 待處理 |

---

*審計報告: `docs/ui-ux-audit-report.md` (v4.0)*
