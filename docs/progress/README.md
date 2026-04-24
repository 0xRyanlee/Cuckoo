# Cuckoo 餐飲系統 - 開發進度追蹤

> 更新日期：2026-04-23
> 當前版本：v0.7.0（採購/生產/盤點/報表全模塊上線）
> 技術棧：React 18 + TypeScript + Tauri 2 (Rust) + SQLite + shadcn/ui

---

## 總體進度儀表板

| 模組 | 狀態 | 進度 | 備註 |
|------|------|------|------|
| 基礎架構 | ✅ 完成 | 100% | Tauri 2 + SQLite + shadcn/ui |
| 基礎資料 | ✅ 完成 | 98% | 材料狀態 UI 完成 |
| 配方系統 | ✅ 完成 | 95% | 配方編輯 UI 完整 |
| 庫存系統 | ✅ 完成 | 95% | 盤點系統上線 |
| 菜單管理 | ✅ 完成 | 95% | 規格管理完整 |
| POS 點餐 | ✅ 完成 | 88% | 搜索待補 |
| 訂單管理 | ✅ 完成 | 92% | 搜索+篩選完成 |
| KDS 廚顯 | ✅ 完成 | 88% | 穩定 |
| 供應商 | ✅ 完成 | 92% | CRUD 完整 |
| 打印系統 | ✅ 完成 | 85% | 自動觸發部分完成 |
| 採購系統 | ✅ 完成 | 90% | 全流程 + 自動入庫 |
| 生產系統 | ✅ 完成 | 90% | 全流程 + 自動扣料 |
| 盤點系統 | ✅ 完成 | 90% | 全流程 + 差異調整 |
| 報表系統 | ✅ 完成 | 85% | 四大報表上線 |
| 加料/去料 | 🟡 開發中 | 70% | API 完成，待 UI |
| 小程序 | 🔴 未開始 | 0% | |

**整體完成度：~82%**

---

## 功能矩陣

### Phase 1：核心基礎（MVP）

| # | 功能 | 狀態 | 前端 | 後端 | 數據庫 | 備註 |
|---|------|------|------|------|--------|------|
| 1.1 | 單位管理 | ✅ | 隱式 | 1 命令 | 8 種子數據 | |
| 1.2 | 材料分類 CRUD | ✅ | 內聯編輯 | 4 命令 | 4 種子數據 | |
| 1.3 | 標籤管理 CRUD | ✅ | 列表/創建 | 4 命令 | 9 種子數據 | 多對多 |
| 1.4 | 材料 CRUD + 標籤 | ✅ | 完整 CRUD | 6 命令 | 23 種子數據 | 搜索支持 |
| 1.5 | 材料狀態 | ✅ | 完整 CRUD | 4 命令 | 表已建 | v0.7.0 完成 |
| 1.6 | 供應商 CRUD | ✅ | 完整 CRUD | 4 命令 | 表已建 | 搜索支持 |
| 1.7 | 屬性模板 | ✅ | 只讀列表 | 3 命令 | 18 種子數據 | |
| 1.8 | 實體屬性值 | ⚠️ | 無 UI | 2 命令 | 表已建 | |
| 1.9 | 配方 CRUD | ✅ | 完整 CRUD | 8 命令 | 22 種子數據 | 搜索支持 |
| 1.10 | 配方明細 | ✅ | 添加/刪除 | 2 命令 | 44 種子數據 | |
| 1.11 | 配方成本計算 | ✅ | 詳情展示 | 1 命令 | -- | |
| 1.12 | 菜單分類 CRUD | ✅ | 內聯編輯/刪除 | 4 命令 | 4 種子數據 | |
| 1.13 | 菜單商品 CRUD | ✅ | 完整 CRUD | 6 命令 | 22 種子數據 | |
| 1.14 | 商品規格 | ✅ | 完整管理 UI | 4 命令 | 表已建 | |
| 1.15 | 訂單創建 | ✅ | POS 創建 | 2 命令 | 表已建 | |
| 1.16 | 訂單提交 | ✅ | 一鍵提交 | 1 命令 | -- | 含預扣/事務 |
| 1.17 | 訂單取消 | ✅ | 取消按鈕 | 1 命令 | -- | 含回補 |

### Phase 2：庫存與 KDS

| # | 功能 | 狀態 | 前端 | 後端 | 數據庫 | 備註 |
|---|------|------|------|------|--------|------|
| 2.1 | 批次管理 | ✅ | 列表/創建/刪除 | 3 命令 | 23 種子數據 | |
| 2.2 | 庫存交易流水 | ✅ | 流水日誌 | 2 命令 | 23 種子數據 | |
| 2.3 | 庫存預扣 | ✅ | -- | submit_order_full | -- | 事務支持 |
| 2.4 | 庫存實扣 | ✅ | -- | finish_ticket | -- | |
| 2.5 | 庫存回補 | ✅ | -- | release_inventory | -- | |
| 2.6 | FIFO/FEFO 策略 | ✅ | -- | select_batches | -- | |
| 2.7 | 庫存匯總查詢 | ✅ | 匯總表格 | 1 命令 | -- | |
| 2.8 | 庫存調整 | ✅ | 調整對話框 | 1 命令 | -- | |
| 2.9 | 損耗記錄 | ✅ | 損耗對話框 | 1 命令 | -- | |
| 2.10 | 工作站管理 | ✅ | 隱式 | 1 命令 | 4 種子數據 | |
| 2.11 | 廚房小票 | ✅ | 小票卡片 | 4 命令 | 表已建 | |
| 2.12 | KDS 狀態流轉 | ✅ | 開始/完成按鈕 | 2 命令 | -- | |
| 2.13 | 後廚單打印 | ✅ | 自動觸發 | 3 命令 | print_tasks | |

### Phase 3：打印系統

| # | 功能 | 狀態 | 前端 | 後端 | 數據庫 | 備註 |
|---|------|------|------|------|--------|------|
| 3.1 | 飛鵝雲 API | ✅ | -- | 3 函數 | -- | 添加/打印/查詢 |
| 3.2 | 局域網 TCP 打印 | ✅ | -- | 3 函數 | -- | ESC/POS + TSPL |
| 3.3 | 局域網掃描 | ✅ | 掃描 UI | 1 命令 | -- | TCP 9100 |
| 3.4 | 打印機配置 | ✅ | 完整管理 UI | 5 命令 | printer_configs | |
| 3.5 | 設置頁打印機管理 | ✅ | 3 Tab UI | -- | -- | |
| 3.6 | 廚房小票打印 | ✅ | 自動觸發 | 1 命令 | -- | POS 提交時 |
| 3.7 | 批次標籤打印 | ✅ | 自動觸發 | 1 命令 | -- | 入庫時 |
| 3.8 | 打印任務隊列 | ✅ | 任務歷史 | 2 命令 | print_tasks | |
| 3.9 | ESC/POS 構建器 | ✅ | -- | 完整 | -- | 對齊/加粗/切紙 |
| 3.10 | TSPL 構建器 | ✅ | -- | 完整 | -- | 文字/條碼/邊框 |

### Phase 4：採購與生產

| # | 功能 | 狀態 | 前端 | 後端 | 數據庫 | 備註 |
|---|------|------|------|------|--------|------|
| 4.1 | 採購單 CRUD | ✅ | 完整 UI | 7 命令 | 表已建 | v0.7.0 新增 |
| 4.2 | 採購收貨 | ✅ | 一鍵收貨 | receive_purchase_order | -- | 自動入庫 |
| 4.3 | 生產單 CRUD | ✅ | 完整 UI | 6 命令 | 表已建 | v0.7.0 新增 |
| 4.4 | 生產執行 | ✅ | 開始/完成 | start/complete | -- | 扣料+入庫 |
| 4.5 | 盤點單 | ✅ | 完整 UI | 6 命令 | 表已建 | v0.7.0 新增 |

### Phase 5：報表與擴展

| # | 功能 | 狀態 | 前端 | 後端 | 數據庫 | 備註 |
|---|------|------|------|------|--------|------|
| 5.1 | 銷售報表 | ✅ | 日期範圍 | 1 命令 | -- | v0.7.0 新增 |
| 5.2 | 毛利報表 | ✅ | 收入/成本/毛利 | 1 命令 | -- | v0.7.0 新增 |
| 5.3 | 原料消耗報表 | 🔴 | -- | -- | 可從 txns 計算 | |
| 5.4 | 熱銷商品排行 | ✅ | Top 10 | 1 命令 | -- | v0.7.0 新增 |
| 5.5 | 搜索功能 | 🟡 | 3/16 頁面 | -- | -- | 8 頁面待補 |
| 5.6 | 通知系統 | 🔴 | Bell 圖標 | -- | -- | |
| 5.7 | 加料/去料 | 🟡 | API 完成 | 3 命令 | 表已建 | 待 UI |
| 5.8 | 配方公式 | 🔴 | -- | -- | 表已建 | |
| 5.9 | 小程序接入 | 🔴 | -- | -- | -- | |

---

## Tauri 命令統計（110 個）

| 模組 | 命令數 | 列表 |
|------|--------|------|
| 健康檢查 | 1 | health_check |
| 單位 | 1 | get_units |
| 材料分類 | 4 | get/create/update/delete |
| 標籤 | 4 | get/create/update/delete |
| 材料 | 6 | get/create/update/delete + add/remove tags |
| 材料狀態 | 4 | get/create/update/delete |
| 供應商 | 4 | get/create/update/delete |
| 屬性 | 3 | get_templates/set/get_entity |
| 配方 | 9 | get/get_with_items/create/add_item/cost/update/delete/delete_item |
| 菜單 | 12 | categories(4) + items(6) + specs(4) |
| 訂單 | 7 | create/get/get_with_items/add_item/submit/cancel |
| KDS | 7 | get_stations/get_tickets/get_all/get_all_with_items/start/finish |
| 庫存 | 10 | get_batches/get_summary/create_txn/get_txns/create_batch/delete_batch/adjust/wastage |
| 工作站映射 | 2 | add/remove |
| 打印 | 13 | get_printers/get_default/create/update/delete/scan/test_feie/test_lan/send_task/print_kitchen/print_batch/get_tasks |
| 採購 | 7 | get/get_with_items/create/add_item/update_status/delete/receive |
| 生產 | 6 | get/get_with_items/create/start/complete/delete |
| 盤點 | 6 | get/get_with_items/create/update_item/complete/delete |
| 加料/去料 | 3 | add/get/delete |
| 報表 | 4 | sales/category/profit/top |
| 更新/刪除 | 14 | 各實體 update/delete |
| **總計** | **110** | |

---

## 數據庫狀態（31 表）

### 有 API + 有 UI（26 表）

| 表 | API | UI | 種子數據 |
|---|-----|-----|----------|
| units | ✅ | 隱式 | 8 |
| material_categories | ✅ | 內聯 | 4 |
| tags | ✅ | 列表 | 9 |
| material_tags | ✅ | 隱式 | 23 |
| materials | ✅ | 完整 CRUD | 23 |
| material_states | ✅ | 完整 CRUD | -- |
| suppliers | ✅ | 完整 CRUD | -- |
| attribute_templates | ✅ | 只讀 | 18 |
| entity_attributes | ✅ | 無 UI | -- |
| recipes | ✅ | 完整 CRUD | 22 |
| recipe_items | ✅ | 添加/刪除 | 44 |
| menu_categories | ✅ | 內聯 | 4 |
| menu_items | ✅ | 完整 CRUD | 22 |
| menu_item_specs | ✅ | 管理 UI | -- |
| inventory_batches | ✅ | 列表/創建 | 23 |
| inventory_txns | ✅ | 流水日誌 | 23 |
| orders | ✅ | 列表/詳情 | -- |
| order_items | ✅ | 詳情展示 | -- |
| order_item_modifiers | ✅ | API 完成 | -- |
| kitchen_stations | ✅ | 隱式 | 4 |
| station_menu_items | ✅ | 隱式 | 22 |
| kitchen_tickets | ✅ | KDS 卡片 | -- |
| purchase_orders | ✅ | 完整 UI | -- |
| purchase_order_items | ✅ | 詳情展示 | -- |
| production_orders | ✅ | 完整 UI | -- |
| production_order_items | ✅ | 詳情展示 | -- |
| stocktakes | ✅ | 完整 UI | -- |
| stocktake_items | ✅ | 詳情展示 | -- |

### 有 API 無 UI（2 表）

| 表 | API | UI |
|---|-----|-----|
| print_tasks | ✅ | 任務歷史（Settings 中） |
| printer_configs | ✅ | 管理 UI（Settings 中） |

### 無 API 無 UI（1 表）

| 表 | 用途 |
|---|------|
| recipe_formulas | 配方計算公式 |

---

## UI 完善度

| 頁面 | 狀態 | 缺口 |
|------|------|------|
| dashboard-page | ⚠️ | 無圖表 |
| materials-page | ✅ | 完整 + 搜索 |
| recipes-page | ✅ | 完整 + 搜索 |
| inventory-page | ⚠️ | 缺搜索 |
| menu-page | ⚠️ | 缺搜索 |
| pos-page | ⚠️ | 缺搜索 |
| orders-page | ✅ | 完整 + 搜索 + 篩選 |
| kds-page | ✅ | 完整 |
| suppliers-page | ⚠️ | 缺搜索 |
| material-states-page | ⚠️ | 缺搜索 |
| purchase-orders-page | ⚠️ | 缺搜索 |
| production-orders-page | ⚠️ | 缺搜索 |
| stocktakes-page | ⚠️ | 缺搜索 |
| reports-page | ✅ | 完整 |
| attributes-page | ⚠️ | 只讀 |
| settings-page | ✅ | 完整 |

---

## 待開發項目清單（按優先級）

### P1 - 體驗優化（2-3 天）
- [ ] 8 個頁面添加搜索過濾（inventory, menu, pos, suppliers, material-states, purchase-orders, production-orders, stocktakes）
- [ ] Dashboard 圖表（銷售趨勢、庫存趨勢）
- [ ] 加料/去料 UI（訂單詳情中添加/刪除 modifier）

### P2 - 功能補全（3-4 天）
- [ ] recipe_formulas API + UI
- [ ] 打印自動觸發完善（收貨/生產完成）
- [ ] Attributes 頁面編輯功能
- [ ] 通知系統（庫存預警、訂單提醒）

### P3 - 擴展（14+ 天）
- [ ] 用戶認證與權限控制
- [ ] 多門店支持
- [ ] 數據備份/恢復
- [ ] 小程序接入

---

## 最近更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|----------|
| 2026-04-23 | **v0.7.0** | **採購/生產/盤點/報表全模塊上線：+31 命令、+5 頁面、+1,868 Rust LOC、+4,595 TS LOC** |
| 2026-04-23 | v0.6.0 | 代碼審計 v6：79 命令、31 表、完整功能矩陣 |
| 2026-04-23 | v0.5.1 | 打印模塊核心：Feie API + LAN TCP + ESC/POS + TSPL + 設置頁 |
| 2026-04-23 | v0.5.0 | 菜單更新：22 款麻辣系列菜品 + 完整 CRUD |
| 2026-04-23 | v0.4.0 | 代碼審計修復：事務支持 + 配方成本 + Seed 數據完善 |
| 2026-04-23 | v0.3.0 | 前端 UI 完善：所有模組頁面 |
| 2026-04-23 | v0.2.0 | 核心 API 實現：67 個 Tauri 命令 |
| 2026-04-22 | v0.1.0 | 項目初始化：Tauri + React + SQLite |

---

## 文檔索引

| 文檔 | 路徑 | 說明 |
|------|------|------|
| 代碼審計 v7 | `/docs/audit-report-v7.md` | v0.7.0 完整審計報告 |
| 代碼審計 v6 | `/docs/audit-report-v6.md` | v0.6.0 完整審計報告 |
| 開發計劃 | `/docs/dev-plan-v0.5.0.md` | 詳細開發計劃 + 打印模塊設計 |
| 數據模型 | `/docs/database-schema.md` | 完整數據庫設計 |
| API 設計 | `/docs/api-design.md` | 接口設計文檔 |
| 開發進度 | `/docs/progress/README.md` | 本文檔 |
