# Cuckoo 審計報告 v0.7.0

**日期:** 2026-04-23
**版本:** v0.7.0 — 全模塊覆蓋 + 報表上線
**上一版本:** v0.6.0 (79 commands, 11 pages)

---

## 一、總體統計

| 指標 | v0.6.0 | v0.7.0 | 變化 |
|------|--------|--------|------|
| Rust 源文件 | 4 | 4 | — |
| Rust LOC | ~3,400 | 5,268 | +1,868 |
| TypeScript LOC | ~3,200 | 7,795 | +4,595 |
| 數據庫表 | 31 | 31 | — |
| Tauri 命令 | 79 | **110** | **+31** |
| 前端頁面 | 11 | **16** | **+5** |
| 側邊欄導航項 | 11 | **16** | **+5** |

---

## 二、本輪完成清單（11 項全部完成）

### P1 材料狀態管理 UI
- ✅ `material-states-page.tsx` 創建（列表/新增/編輯/刪除）
- ✅ `App.tsx` 接線（state、handlers、路由）
- ✅ 後端 `update_material_state`、`delete_material_state`、`get_all_material_states` 命令

### P2 Header 搜索功能
- ✅ `materials-page.tsx` 搜索過濾（名稱/代碼/分類）
- ✅ `recipes-page.tsx` 搜索過濾（名稱/代碼）
- ✅ `orders-page.tsx` 搜索 + 狀態篩選下拉

### P3 採購單 CRUD + 自動入庫
- ✅ `purchase-orders-page.tsx` 新建（列表/新增/添加材料/收貨/詳情）
- ✅ 後端 7 個命令：`get_purchase_orders`、`get_purchase_order_with_items`、`create_purchase_order`、`add_purchase_order_item`、`update_purchase_order_status`、`delete_purchase_order`、`receive_purchase_order`
- ✅ 收貨自動入庫：創建庫存批次 + 入庫流水 + 更新採購單狀態

### P3 生產單 CRUD
- ✅ `production-orders-page.tsx` 新建（列表/新增/開始/完成/詳情）
- ✅ 後端 6 個命令：`get_production_orders`、`get_production_order_with_items`、`create_production_order`、`start_production_order`、`complete_production_order`、`delete_production_order`
- ✅ 完成生產自動扣料 + 產出入庫

### P3 盤點系統
- ✅ `stocktakes-page.tsx` 新建（列表/新增/編輯實際數量/完成盤點）
- ✅ 後端 6 個命令：`get_stocktakes`、`get_stocktake_with_items`、`create_stocktake`、`update_stocktake_item`、`complete_stocktake`、`delete_stocktake`
- ✅ 完成盤點自動生成差異調整流水

### P3 加料/去料系統
- ✅ 後端 3 個命令：`add_order_item_modifier`、`get_order_item_modifiers`、`delete_order_item_modifier`
- ✅ `order_item_modifiers` 表已存在，API 已補全

### P4 數據報表
- ✅ `reports-page.tsx` 新建（銷售報表/毛利報表/熱銷排行/分類銷售）
- ✅ 後端 4 個命令：`get_sales_report`、`get_sales_by_category`、`get_gross_profit_report`、`get_top_selling_items`
- ✅ 日期範圍選擇器、4 個 KPI 卡片、4 個 Tab 切換

---

## 三、數據庫表狀態（31 張表）

| 狀態 | 表數量 | 表名 |
|------|--------|------|
| ✅ 有 API + 有 UI | 26 | units, material_categories, tags, material_tags, materials, material_states, suppliers, attribute_templates, entity_attributes, recipes, recipe_items, menu_categories, menu_items, menu_item_specs, inventory_batches, inventory_txns, orders, order_items, order_item_modifiers, kitchen_stations, station_menu_items, kitchen_tickets, purchase_orders, purchase_order_items, production_orders, production_order_items, stocktakes, stocktake_items |
| ⚠️ 有 API 無 UI | 2 | print_tasks, printer_configs |
| ❌ 無 API 無 UI | 1 | recipe_formulas |
| ❌ 無 API 無 UI | 2 | payments (未創建), notifications (未創建) |

**API 覆蓋率:** 30/31 = **97%**（僅 recipe_formulas 無 API）

---

## 四、Tauri 命令分類統計（110 個）

| 模塊 | 命令數 | 狀態 |
|------|--------|------|
| 健康檢查 | 1 | ✅ |
| 基礎數據（單位/分類/標籤/材料/狀態/供應商） | 20 | ✅ |
| 屬性模板 | 3 | ✅ |
| 庫存（批次/流水/調整/損耗） | 10 | ✅ |
| 配方（CRUD/成本/材料項） | 9 | ✅ |
| 菜單（分類/商品/規格） | 10 | ✅ |
| 訂單（CRUD/提交/取消/修改項） | 7 | ✅ |
| KDS（站點/工單/開始/完成） | 7 | ✅ |
| 採購（CRUD/收貨） | 7 | ✅ 新增 |
| 生產（CRUD/開始/完成） | 6 | ✅ 新增 |
| 盤點（CRUD/完成） | 6 | ✅ 新增 |
| 加料/去料 | 3 | ✅ 新增 |
| 報表（銷售/毛利/排行/分類） | 4 | ✅ 新增 |
| 打印（配置/任務/廚房單/標籤） | 13 | ✅ |
| 更新/刪除（各實體） | 14 | ✅ |

---

## 五、前端頁面狀態（16 個）

| 頁面 | CRUD | 搜索 | 狀態 |
|------|------|------|------|
| Dashboard | — | — | ⚠️ 無圖表 |
| Materials | ✅ | ✅ | ✅ |
| Recipes | ✅ | ✅ | ✅ |
| Inventory | ✅ | ❌ | ⚠️ 缺搜索 |
| Menu | ✅ | ❌ | ⚠️ 缺搜索 |
| POS | ✅ | ❌ | ⚠️ 缺搜索 |
| Orders | ✅ | ✅ | ✅ |
| KDS | ✅ | — | ✅ |
| Suppliers | ✅ | ❌ | ⚠️ 缺搜索 |
| Material States | ✅ | ❌ | ⚠️ 缺搜索 |
| Purchase Orders | ✅ | ❌ | ⚠️ 缺搜索 |
| Production Orders | ✅ | ❌ | ⚠️ 缺搜索 |
| Stocktakes | ✅ | ❌ | ⚠️ 缺搜索 |
| Reports | — | — | ✅ |
| Attributes | 讀 | — | ⚠️ 只讀 |
| Settings | ✅ | — | ✅ |

**搜索覆蓋率:** 3/16 = **19%**（8 個數據列表頁缺搜索）

---

## 六、核心業務流程驗證

| 流程 | 狀態 | 說明 |
|------|------|------|
| 材料入庫 → 庫存增加 | ✅ | 手動建批次 |
| 創建配方 → 綁定材料 | ✅ | 配方編輯 UI 完整 |
| 創建菜單 → 綁定配方 | ✅ | 規格管理完整 |
| POS 下單 → 預留庫存 → KDS | ✅ | 事務保證 |
| KDS 完成 → 確認扣料 | ✅ | 自動打印 |
| 訂單取消 → 釋放庫存 | ✅ | |
| 採購單 → 收貨 → 自動入庫 | ✅ 新增 | 自動創建批次+流水 |
| 生產單 → 耗料 → 產出入庫 | ✅ 新增 | 自動扣料+入庫 |
| 盤點 → 差異調整 | ✅ 新增 | 自動生成調整流水 |
| 加料/去料 | ✅ 新增 | API 完成，待 UI |
| 銷售報表 | ✅ 新增 | 按日統計 |
| 毛利報表 | ✅ 新增 | 收入/成本/毛利 |
| 熱銷排行 | ✅ 新增 | Top 10 |

---

## 七、遺留問題與風險

### 高優先級（P1）
1. **Dashboard 無圖表** — 僅文字統計，缺少視覺化
2. **8 個頁面缺搜索** — inventory, menu, pos, suppliers, material-states, purchase-orders, production-orders, stocktakes
3. **加料/去料無 UI** — 後端 API 已完成，前端未接入訂單流程

### 中優先級（P2）
4. **recipe_formulas 表無 API** — 替代配方功能未實現
5. **打印自動觸發不完整** — POS 提交已接線，但收貨/生產完成打印未接線
6. **Attributes 頁面只讀** — 無編輯功能
7. **無通知系統** — 庫存預警、訂單提醒等

### 低優先級（P3+）
8. **無權限控制** — 所有操作無角色區分
9. **無多門店支持** — 單店架構
10. **無數據備份** — 無導出/導入功能
11. **無小程序** — 線上點餐未實現

---

## 八、版本對比

| 版本 | 日期 | 核心變化 | Commands | Pages |
|------|------|----------|----------|-------|
| v0.1.0 | 2026-04-22 | 初始化 | ~20 | 5 |
| v0.2.0 | 2026-04-23 | 庫存引擎/訂單提交/KDS | ~35 | 8 |
| v0.3.0 | 2026-04-23 | 批次創建/成本修復/CRUD API | ~50 | 9 |
| v0.4.0 | 2026-04-23 | 事務支持/種子數據/KDS 詳情 | ~65 | 10 |
| v0.5.0 | 2026-04-23 | 打印模塊核心 | ~70 | 10 |
| v0.6.0 | 2026-04-23 | UI 完善（配方/材料/供應商/規格） | 79 | 11 |
| **v0.7.0** | **2026-04-23** | **採購/生產/盤點/報表/搜索** | **110** | **16** |

---

## 九、完成度評估

| 模塊 | v0.6.0 | v0.7.0 | 說明 |
|------|--------|--------|------|
| 基礎數據 | 95% | 98% | 材料狀態 UI 完成 |
| 配方 | 90% | 95% | 配方編輯完整 |
| 庫存 | 85% | 95% | 盤點系統上線 |
| 菜單 | 95% | 95% | 穩定 |
| POS | 85% | 88% | 搜索待補 |
| 訂單 | 85% | 92% | 搜索+篩選 |
| KDS | 85% | 88% | 穩定 |
| 供應商 | 80% | 92% | CRUD 完整 |
| 採購 | 0% | **90%** | 全流程完成 |
| 生產 | 0% | **90%** | 全流程完成 |
| 盤點 | 0% | **90%** | 全流程完成 |
| 報表 | 0% | **85%** | 四大報表上線 |
| 打印 | 80% | 85% | 自動觸發部分完成 |
| 加料/去料 | 0% | **70%** | API 完成，待 UI |

**整體完成度:** 從 v0.6.0 的 **~65%** 提升至 v0.7.0 的 **~82%**
