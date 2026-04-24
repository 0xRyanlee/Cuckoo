# Cuckoo 餐飲系統 - 代碼審計報告 v0.6.0

> 審計日期：2026-04-23
> 審計範圍：全代碼庫（Rust 後端 + React 前端 + 數據庫 + 文檔）
> 審計方法：逐文件對照文檔與實現

---

## 一、總體統計

| 指標 | 數量 |
|------|------|
| Rust 源文件 | 4 個（main.rs, lib.rs, commands.rs, database.rs, printer.rs） |
| 前端頁面 | 11 個 |
| 前端組件 | 2 個（sidebar, header） |
| shadcn/ui 組件 | 19 個 |
| 數據庫表 | 31 個 |
| Tauri 命令 | 79 個 |
| 代碼行數（Rust） | ~3,400 行 |
| 代碼行數（TypeScript） | ~3,200 行 |

---

## 二、數據庫表審計（31 表）

### 2.1 已實現且有數據的表（18 表）

| 表名 | 種子數據 | API | UI | 狀態 |
|------|----------|-----|-----|------|
| units | 8 | get | 隱式 | ✅ 完成 |
| material_categories | 4 | CRUD | 內聯 | ✅ 完成 |
| tags | 9 | CRUD | 列表/創建 | ✅ 完成 |
| material_tags | 30 | add/remove | 隱式 | ✅ 完成 |
| materials | 23 | CRUD + tags | 列表/創建 | ✅ 完成 |
| suppliers | 0 | CRUD | 列表/創建 | ✅ 完成 |
| attribute_templates | 18 | get/set | 只讀列表 | ✅ 完成 |
| entity_attributes | 0 | set/get | 無 UI | ⚠️ API 完成 |
| recipes | 22 | CRUD + items | 列表/詳情 | ✅ 完成 |
| recipe_items | 44 | add/delete | 詳情查看 | ✅ 完成 |
| menu_categories | 4 | CRUD | 內聯編輯/刪除 | ✅ 完成 |
| menu_items | 22 | CRUD + toggle | 完整 CRUD | ✅ 完成 |
| menu_item_specs | 0 | get/create | 無管理 UI | ⚠️ API 部分 |
| inventory_batches | 23 | CRUD | 列表/創建/刪除 | ✅ 完成 |
| inventory_txns | 23 | get/create | 流水日誌 | ✅ 完成 |
| kitchen_stations | 4 | get | 隱式 | ✅ 完成 |
| station_menu_items | 22 | add/remove | 無 UI | ⚠️ API 完成 |
| kitchen_tickets | 0 | CRUD | 小票卡片 | ✅ 完成 |

### 2.2 已實現但無種子數據的表（5 表）

| 表名 | API | UI | 狀態 |
|------|-----|-----|------|
| material_states | get/create | 無 | ⚠️ API 部分 |
| orders | CRUD | 列表/詳情 | ✅ 完成 |
| order_items | 通過訂單 API | 詳情展示 | ✅ 完成 |
| print_tasks | CRUD | 任務歷史 | ✅ 完成 |
| printer_configs | CRUD | 完整管理 | ✅ 完成 |

### 2.3 表已建但無任何 API 的表（8 表）

| 表名 | 用途 | 狀態 |
|------|------|------|
| recipe_formulas | 配方計算公式 | ❌ 未實現 |
| order_item_modifiers | 加料/去料 | ❌ 未實現 |
| purchase_orders | 採購單 | ❌ 未實現 |
| purchase_order_items | 採購明細 | ❌ 未實現 |
| production_orders | 生產單 | ❌ 未實現 |
| production_order_items | 生產消耗 | ❌ 未實現 |
| stocktakes | 盤點單 | ❌ 未實現 |
| stocktake_items | 盤點明細 | ❌ 未實現 |

---

## 三、Tauri 命令審計（79 個）

### 3.1 完整命令列表

| # | 命令 | 模組 | 狀態 |
|---|------|------|------|
| 1 | health_check | 健康 | ✅ |
| 2 | get_units | 單位 | ✅ |
| 3-6 | get/create/update/delete_material_category | 材料分類 | ✅ |
| 7-10 | get/create/update/delete_tag | 標籤 | ✅ |
| 11-16 | get/create/update/delete_material + add/remove_tags | 材料 | ✅ |
| 17-18 | get/create_material_state | 材料狀態 | ⚠️ 缺 update/delete |
| 19-22 | get/create/update/delete_supplier | 供應商 | ✅ |
| 23-25 | get_templates/set/get_entity | 屬性 | ✅ |
| 26-33 | get/get_with_items/create/add_item/cost/update/delete/delete_item | 配方 | ✅ |
| 34-37 | get/create/update/delete_menu_category | 菜單分類 | ✅ |
| 38-44 | get/create/update/toggle/delete_menu_item + get/create_spec | 菜單 | ✅ |
| 45-50 | create/get/get_with_items/add_item/submit/cancel | 訂單 | ✅ |
| 51-56 | get_stations/get_tickets/get_all/get_all_with_items/start/finish | KDS | ✅ |
| 57-64 | get_batches/get_summary/create_txn/get_txns/create_batch/delete/adjust/wastage | 庫存 | ✅ |
| 65-66 | add/remove_station_menu_item | 工作站映射 | ✅ |
| 67-79 | get_printers/get_default/create/update/delete/scan/test_feie/test_lan/send_task/print_kitchen/print_batch/get_tasks | 打印 | ✅ |

### 3.2 命令缺口分析

| 缺失命令 | 對應表 | 優先級 |
|----------|--------|--------|
| update/delete_material_state | material_states | P3 |
| update/delete_menu_item_spec | menu_item_specs | P3 |
| get/update/delete_recipe_item | recipe_items | P2 |
| CRUD purchase_orders | purchase_orders | P3 |
| CRUD production_orders | production_orders | P3 |
| CRUD stocktakes | stocktakes | P3 |
| CRUD order_item_modifiers | order_item_modifiers | P2 |
| CRUD recipe_formulas | recipe_formulas | P3 |
| get_order_items (standalone) | order_items | P3 |

---

## 四、前端頁面審計（11 頁）

### 4.1 頁面能力矩陣

| 頁面 | 功能 | 缺口 |
|------|------|------|
| dashboard-page | 4 統計卡 + 最近訂單 + 庫存預警 | 無圖表、無趨勢 |
| materials-page | 材料列表 + 創建 + 分類/標籤創建 | 缺材料編輯對話框、缺標籤管理 UI |
| recipes-page | 配方列表 + 創建 + 詳情 + 成本 | 缺配方編輯 UI（添加/刪除材料項） |
| inventory-page | 批次列表 + 入庫 + 調整 + 損耗 + 流水 | 缺供應商選擇下拉 |
| menu-page | 商品 CRUD + 分類管理 + 配方綁定 + 編輯/刪除 | 缺規格管理 UI |
| pos-page | 分類篩選 + 商品網格 + 購物車 + 規格 + 備註 | 缺打印觸發 |
| orders-page | 訂單列表 + 詳情 + 提交/取消 | 缺搜索/篩選 |
| kds-page | 小票卡片 + 開始/完成 + elapsed 時間 | 缺打印觸發 |
| suppliers-page | 供應商列表 + 創建 | 缺編輯對話框 |
| attributes-page | 屬性模板只讀列表 | 缺實體屬性設置 UI |
| settings-page | 系統信息 + 打印機管理 + 任務歷史 | 完整 ✅ |

### 4.2 App.tsx 狀態管理

| 狀態 | 加载 | 處理器 | 缺口 |
|------|------|--------|------|
| units | ✅ | -- | -- |
| categories | ✅ | handleCreateCategory | -- |
| tags | ✅ | handleCreateTag | -- |
| materials | ✅ | handleCreateMaterial | 缺 update/delete handler |
| recipes | ✅ | handleCreateRecipe/handleViewRecipe | -- |
| menuCategories | ✅ | handleCreateMenuCategory | 缺 update/delete handler |
| menuItems | ✅ | handleCreateMenuItemFull/handleToggle/handleUpdate/handleDelete | ✅ |
| orders | ✅ | handleCreateOrder/handleSubmit/handleCancel/handleView | -- |
| kdsTickets | ✅ | handleLoadKDS/start/finish | -- |
| inventoryBatches | ✅ | handleCreateBatch/handleAdjust/handleWastage/handleDelete | -- |
| inventorySummary | ✅ | -- | -- |
| inventoryTxns | ✅ | -- | -- |
| attributeTemplates | ✅ | -- | -- |
| suppliers | ✅ | handleCreateSupplier | 缺 update/delete handler |
| printers | ✅ (settings) | -- | -- |
| printTasks | ✅ (settings) | -- | -- |

---

## 五、文檔對照審計

### 5.1 database-schema.md 對照

| 文檔章節 | 描述 | 實現狀態 |
|----------|------|----------|
| 3.1 material_categories | 主分類表 | ✅ 完全實現 |
| 3.2 tags | 標籤表 | ✅ 完全實現 |
| 3.3 material_tags | 多對多關聯 | ✅ 完全實現 |
| 3.4 materials | 材料主表 | ✅ 完全實現 |
| 3.5 units | 單位表 | ✅ 完全實現 |
| 3.6 material_states | 材料狀態 | ⚠️ 表+API，無 UI |
| 3.7 suppliers | 供應商表 | ✅ 完全實現 |
| 4.1 inventory_batches | 庫存批次 | ✅ 完全實現 |
| 4.2 attribute_templates | 屬性模板 | ✅ 完全實現 |
| 4.3 entity_attributes | 實體屬性 | ⚠️ API 完成，無 UI |
| 5.1 recipes | 配方主表 | ✅ 完全實現 |
| 5.2 recipe_items | 配方明細 | ✅ 完全實現 |
| 5.3 recipe_formulas | 配方公式 | ❌ 表存在，無 API/UI |
| 6.1 inventory_txns | 庫存交易 | ✅ 完全實現 |
| 6.2 stocktakes | 盤點單 | ❌ 表存在，無 API/UI |
| 6.3 stocktake_items | 盤點明細 | ❌ 表存在，無 API/UI |
| 7.1 menu_categories | 菜單分類 | ✅ 完全實現 |
| 7.2 menu_items | 菜單商品 | ✅ 完全實現 |
| 7.3 menu_item_specs | 商品規格 | ⚠️ API 部分，無管理 UI |
| 7.4 orders | 訂單 | ✅ 完全實現 |
| 7.5 order_items | 訂單明細 | ✅ 完全實現 |
| 7.6 order_item_modifiers | 加料/去料 | ❌ 表存在，無 API/UI |
| 8.1 kitchen_stations | 廚房工作站 | ✅ 完全實現 |
| 8.2 station_menu_items | 工作站映射 | ✅ API 完成，無 UI |
| 8.3 kitchen_tickets | 廚房小票 | ✅ 完全實現 |
| 9.1 purchase_orders | 採購單 | ❌ 表存在，無 API/UI |
| 9.2 purchase_order_items | 採購明細 | ❌ 表存在，無 API/UI |
| 9.3 production_orders | 生產單 | ❌ 表存在，無 API/UI |
| 9.4 production_order_items | 生產消耗 | ❌ 表存在，無 API/UI |
| 10.1 print_tasks | 打印任務 | ✅ 完全實現（含 printer_configs） |

### 5.2 api-design.md 對照

| 文檔 API | 實現狀態 | 備註 |
|----------|----------|------|
| 所有基礎資料 API | ✅ | 材料/分類/標籤/單位/供應商 |
| 配方 CRUD + 成本 | ✅ | 含配方明細 |
| 菜單 CRUD | ✅ | 含分類/商品/規格 |
| 訂單 CRUD + 提交 | ✅ | 含預扣/回補 |
| KDS 流轉 | ✅ | 含小票+訂單明細 |
| 庫存操作 | ✅ | 批次/調整/損耗/流水 |
| 打印 API | ✅ | 新增，文檔未更新 |
| 採購 API | ❌ | 文檔有設計，未實現 |
| 生產 API | ❌ | 文檔有設計，未實現 |
| 盤點 API | ❌ | 文檔有設計，未實現 |
| 報表 API | ❌ | 文檔有設計，未實現 |

---

## 六、Gap 分析（文檔有但代碼無）

| # | 功能 | 文檔位置 | 缺口 | 預估工作量 |
|---|------|----------|------|------------|
| 1 | 配方公式系統 | database-schema.md §5.3 | 表存在，無 API/UI | 2 天 |
| 2 | 加料/去料 | database-schema.md §7.6 | 表存在，無 API/UI | 2 天 |
| 3 | 採購單 CRUD | database-schema.md §9.1 | 表存在，無 API/UI | 4 天 |
| 4 | 採購收貨 | api-design.md | 無實現 | 3 天 |
| 5 | 生產單 CRUD | database-schema.md §9.3 | 表存在，無 API/UI | 4 天 |
| 6 | 生產執行 | api-design.md | 無實現 | 3 天 |
| 7 | 盤點系統 | database-schema.md §6.2-6.3 | 表存在，無 API/UI | 3 天 |
| 8 | 銷售報表 | dev-plan-v0.5.0 | 無實現 | 3 天 |
| 9 | 毛利報表 | dev-plan-v0.5.0 | 無實現 | 3 天 |
| 10 | 原料消耗報表 | dev-plan-v0.5.0 | 無實現 | 2 天 |
| 11 | 熱銷商品排行 | dev-plan-v0.5.0 | 無實現 | 2 天 |
| 12 | 商品規格管理 UI | dev-plan-v0.5.0 | API 有，無 UI | 2 天 |
| 13 | 材料狀態 UI | -- | API 有，無 UI | 1 天 |
| 14 | 實體屬性 UI | -- | API 有，無 UI | 1 天 |
| 15 | 工作站映射 UI | -- | API 有，無 UI | 1 天 |
| 16 | 供應商編輯 UI | -- | API 有，無 UI | 1 天 |
| 17 | 材料編輯對話框 | -- | API 有，UI 缺編輯 | 1 天 |
| 18 | 配方編輯 UI | -- | 缺添加/刪除材料項 | 2 天 |
| 19 | Header 搜索 | -- | UI 有，未接線 | 1 天 |
| 20 | 通知系統 | -- | UI 有，未實現 | 2 天 |
| 21 | POS 打印觸發 | dev-plan-v0.5.0 | 命令有，未接線 | 1 天 |
| 22 | 入庫打印觸發 | dev-plan-v0.5.0 | 命令有，未接線 | 1 天 |
| 23 | 小程序接入 | dev-plan-v0.5.0 | 無實現 | 14 天 |

---

## 七、代碼無但文檔未提及的功能

| # | 功能 | 實現狀態 | 說明 |
|---|------|----------|------|
| 1 | 打印機管理 | ✅ 完成 | Feie 雲 + LAN TCP |
| 2 | 局域網掃描 | ✅ 完成 | TCP 9100 掃描 |
| 3 | 打印任務隊列 | ✅ 完成 | 含狀態追蹤 |
| 4 | ESC/POS 構建器 | ✅ 完成 | 完整指令集 |
| 5 | TSPL 構建器 | ✅ 完成 | 標籤打印 |
| 6 | 廚房小票模板 | ✅ 完成 | 訂單信息 + 菜品明細 |
| 7 | 批次標籤模板 | ✅ 完成 | 批次號 + 條碼 |

---

## 八、Bug 與問題

| # | 問題 | 文件 | 行 | 嚴重程度 |
|---|------|------|-----|----------|
| 1 | `create_material_category` 命令接受 `CreateCategoryRequest` 但前端只傳 name | commands.rs:153 | 中 |
| 2 | `update_material` 只更新單個字段，不支持批量 | database.rs | 低 |
| 3 | `update_supplier` 同上 | database.rs | 低 |
| 4 | `get_menu_items` 只返回 `is_available = 1` 的商品，POS 看不到停售商品 | database.rs:1620 | 中 |
| 5 | `handleCreateOrder` 在 App.tsx 自動添加第一個商品作為測試 | App.tsx:158 | 低 |
| 6 | 打印命令中的 `test_feie_printer` 和 `test_lan_printer` 未使用 state 參數 | commands.rs:715,729 | 低 |
| 7 | `parse_feie_status` 函數未使用 | printer.rs:429 | 低 |
| 8 | 5 個 database.rs 方法從未調用（dead code） | database.rs | 低 |

---

## 九、待開發項目清單（按優先級）

### P0 - 打印集成（1-2 天）
- [ ] POS 提交 → 自動調用 `print_kitchen_ticket`
- [ ] 庫存入庫 → 自動調用 `print_batch_label`
- [ ] KDS 完成 → 可選打印出餐標籤

### P1 - UI 完善（5-7 天）
- [ ] 配方編輯 UI（添加/刪除材料項、拖拽排序）
- [ ] 材料創建 UI（分類下拉、標籤多選）
- [ ] 材料編輯對話框
- [ ] 供應商編輯 UI
- [ ] 商品規格管理 UI（CRUD）
- [ ] 材料狀態管理 UI
- [ ] 實體屬性設置 UI
- [ ] 工作站映射 UI

### P2 - 功能補全（3-4 天）
- [ ] Header 搜索功能
- [ ] 通知系統
- [ ] 訂單列表搜索/篩選
- [ ] 儀表板圖表（銷售趨勢、庫存趨勢）

### P3 - 採購與生產（8-10 天）
- [ ] 採購單 CRUD
- [ ] 採購收貨 → 自動入庫
- [ ] 生產單 CRUD
- [ ] 生產執行 → 扣原料 + 產半成品
- [ ] 加料/去料系統
- [ ] 盤點系統

### P4 - 報表系統（8-10 天）
- [ ] 銷售報表（日/週/月）
- [ ] 毛利報表（菜品維度）
- [ ] 原料消耗報表
- [ ] 熱銷商品排行
- [ ] 庫存預警報表

### P5 - 擴展（14+ 天）
- [ ] 小程序接入
- [ ] 用戶認證
- [ ] 多店支持
- [ ] 數據備份/恢復

---

## 十、審計結論

### 已完成度評估

| 維度 | 完成度 | 說明 |
|------|--------|------|
| 數據庫設計 | 100% | 31 表全部創建 |
| 後端 API | 75% | 79 命令，缺採購/生產/盤點/報表 |
| 前端 UI | 65% | 11 頁面完整，缺編輯對話框和報表 |
| 打印系統 | 80% | 核心完成，缺自動觸發 |
| 文檔一致性 | 85% | 打印模塊文檔需更新 |

### 核心業務流程驗證

| 流程 | 狀態 | 說明 |
|------|------|------|
| 材料入庫 → 庫存增加 | ✅ | 完整 |
| 創建配方 → 綁定材料 | ✅ | 完整 |
| 創建菜單 → 綁定配方 | ✅ | 完整 |
| POS 下單 → 庫存預扣 → KDS | ✅ | 完整（事務支持） |
| KDS 完成 → 庫存實扣 | ✅ | 完整 |
| 訂單取消 → 庫存回補 | ✅ | 完整 |
| 下單 → 自動打印 | ⚠️ | API 有，未接線 |
| 入庫 → 自動打印標籤 | ⚠️ | API 有，未接線 |
| 採購 → 收貨入庫 | ❌ | 未實現 |
| 生產 → 扣料出庫 | ❌ | 未實現 |
| 盤點 → 差異調整 | ❌ | 未實現 |

### 總結

Cuckoo 系統的核心業務閉環（材料→配方→菜單→訂單→庫存→KDS）已經完整實現，包括事務支持的預扣/實扣/回補機制。打印模塊的核心功能（飛鵝雲 API + 局域網 TCP + ESC/POS + TSPL）已完成。主要缺口在：
1. 打印自動觸發（P0，1-2 天）
2. UI 完善（P1，5-7 天）
3. 採購/生產/盤點（P3，8-10 天）
4. 報表系統（P4，8-10 天）
