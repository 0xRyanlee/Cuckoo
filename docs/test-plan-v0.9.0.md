# Cuckoo 測試計劃

**版本:** v0.9.0
**日期:** 2026-04-23
**目標:** 建立完整的 Rust 後端單元測試覆蓋，確保核心業務邏輯正確性

---

## 一、測試基礎設施

### Rust 測試
- **框架:** 內建 `#[cfg(test)]` + `cargo test`
- **依賴:** `tempfile` (臨時 SQLite 數據庫)
- **配置:** `Cargo.toml` 已添加 `[dev-dependencies] tempfile = "3"`

### 前端測試（待設置）
- **框架:** Vitest + @testing-library/react
- **狀態:** 待安裝

---

## 二、測試覆蓋範圍

### Phase 1: 數據庫 CRUD（18 個測試）

| # | 測試名稱 | 測試目標 | 狀態 |
|---|----------|----------|------|
| 1 | `test_init_tables_creates_all_tables` | 驗證所有表正確創建 | ✅ |
| 2 | `test_seed_data_populates_units` | 驗證單位種子數據 | ✅ |
| 3 | `test_seed_data_populates_materials` | 驗證材料種子數據 | ✅ |
| 4 | `test_material_crud` | 材料增刪改 | ✅ |
| 5 | `test_category_crud` | 分類增刪改 | ✅ |
| 6 | `test_tag_crud` | 標籤增刪改 | ✅ |
| 7 | `test_recipe_crud` | 配方增刪改 | ✅ |
| 8 | `test_calculate_recipe_cost` | 配方成本計算 | ✅ |
| 9 | `test_add_delete_recipe_item` | 配方材料項增刪 | ✅ |
| 10 | `test_update_recipe_item` | 配方材料項更新 | ✅ |
| 11 | `test_menu_item_crud` | 菜單商品增刪改 | ✅ |
| 12 | `test_toggle_menu_item_availability` | 菜單商品上下架 | ✅ |
| 13 | `test_create_inventory_batch` | 庫存批次創建 | ✅ |
| 14 | `test_adjust_inventory` | 庫存調整 | ✅ |
| 15 | `test_record_wastage` | 損耗記錄 | ✅ |
| 16 | `test_delete_inventory_batch` | 庫存批次刪除 | ✅ |
| 17 | `test_create_order` | 訂單創建 | ✅ |
| 18 | `test_order_lifecycle` | 訂單完整生命周期 | ✅ |

### Phase 2: 採購/生產/盤點（6 個測試）

| # | 測試名稱 | 測試目標 | 狀態 |
|---|----------|----------|------|
| 19 | `test_purchase_order_crud` | 採購單增刪改 | ✅ |
| 20 | `test_production_order_crud` | 生產單增刪改 | ✅ |
| 21 | `test_stocktake_crud` | 盤點單增刪改 | ✅ |
| 22 | `test_order_item_modifiers` | 加料/去料 | ✅ |
| 23 | `test_supplier_crud` | 供應商增刪改 | ✅ |
| 24 | `test_station_menu_items` | 工作站菜單映射 | ✅ |

### Phase 3: 報表與打印（6 個測試）

| # | 測試名稱 | 測試目標 | 狀態 |
|---|----------|----------|------|
| 25 | `test_sales_report_empty` | 銷售報表空數據 | ✅ |
| 26 | `test_top_selling_items_empty` | 熱銷排行空數據 | ✅ |
| 27 | `test_esc_pos_builder` | ESC/POS 構建器 | ✅ |
| 28 | `test_tspl_builder` | TSPL 構建器 | ✅ |
| 29 | `test_kitchen_ticket_content` | 廚房單內容生成 | ✅ |
| 30 | `test_batch_label_content` | 批次標籤內容生成 | ✅ |

### Phase 4: 材料狀態（1 個測試）

| # | 測試名稱 | 測試目標 | 狀態 |
|---|----------|----------|------|
| 31 | `test_material_state_crud` | 材料狀態增刪改 | ✅ |

---

## 三、執行測試

```bash
# 執行所有 Rust 測試
cd cuckoo/src-tauri && cargo test

# 執行特定測試
cargo test test_material_crud
cargo test test_order_lifecycle
cargo test test_esc_pos_builder

# 顯示測試輸出
cargo test -- --nocapture
```

---

## 四、測試結果總結

| 指標 | 數值 |
|------|------|
| 總測試數 | 31 |
| 通過 | 待執行 |
| 失敗 | 待執行 |
| 覆蓋模塊 | 數據庫 CRUD、配方、菜單、庫存、訂單、採購、生產、盤點、加料/去料、供應商、報表、打印構建器 |

---

## 五、後續測試計劃

### Phase 5: 前端組件測試
- [ ] 安裝 Vitest + @testing-library/react
- [ ] 測試 utils.ts (cn 函數)
- [ ] 測試 UI 組件渲染
- [ ] 測試表單交互

### Phase 6: 集成測試
- [ ] POS 完整流程測試
- [ ] 訂單生命周期集成測試
- [ ] 庫存流水集成測試

### Phase 7: CI/CD
- [ ] GitHub Actions 配置
- [ ] 自動執行 `cargo test` + `vitest run`
- [ ] 測試覆蓋率報告
