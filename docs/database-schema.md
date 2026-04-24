# Cuckoo 餐飲系統 - 數據模型詳細設計

> 版本：v0.2  
> 更新日期：2026-04-23  
> 適用範圍：單店 / 本地優先 / 配方驅動

---

## 1. 設計原則

### 1.1 核心原則

| 原則 | 說明 |
|------|------|
| 配方驅動扣料 | 菜單商品不直接扣庫存，必須通過配方展開 |
| 批次級追蹤 | 所有庫存變動必須能追溯到 lot_id |
| 成本動態計算 | 成本 = f(批次, 狀態, 損耗率, 季節係數) |
| 審計完整性 | inventory_txns 為唯一審計主表，任何數量變化不得繞過 |
| 本地優先 | SQLite 存儲，斷網可用，預留多店擴展 |

### 1.2 分類系統

```
主分類（業務狀態）：原材料 → 半成品 → 成品 → 耗材
副分類（標籤，可多選）：海鮮 / 肉類 / 下水 / 滷味 / 蔬菜 / 主食 / 調味料 ...
```

### 1.3 命名規範

- 表名：小寫蛇形命名，複數形式（如 `inventory_batches`）
- 字段：小寫蛇形命名
- 主鍵：`id INTEGER PRIMARY KEY AUTOINCREMENT`
- 外鍵：`{table}_id INTEGER REFERENCES {table}(id)`
- 時間戳：`created_at`, `updated_at` 使用 `datetime('now')`

---

## 2. ER 關係圖（文字版）

```
material_categories ─┐
                     ├─ materials ─┬─ material_tags ── tags
                     │             ├─ material_states ── units
                     │             └─ attribute_templates ── entity_attributes
                     │
                     ├─ inventory_batches ── inventory_txns
                     │
                     ├─ recipes ── recipe_items ─┬─ materials
                     │                           ├─ material_states
                     │                           └─ semi_finished_products
                     │
suppliers ── purchase_orders ── purchase_order_items
                     │
                     ├─ production_orders ── production_order_items
                     │
                     ├─ menu_categories ── menu_items ── menu_item_specs
                     │
                     ├─ orders ── order_items ── order_item_modifiers
                     │
                     ├─ kitchen_stations ── kitchen_tickets
                     │
                     └─ print_tasks
```

---

## 3. 材料與分類系統

### 3.1 `material_categories` - 材料分類表（主分類）

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | TEXT | UNIQUE NOT NULL | 分類代碼（raw/semi/finished/consumable） |
| name | TEXT | NOT NULL | 分類名稱（原材料/半成品/成品/耗材） |
| sort_no | INTEGER | DEFAULT 0 | 排序號 |
| is_active | INTEGER | DEFAULT 1 | 是否啟用 |
| created_at | TEXT | DEFAULT now | |

**預置數據：**

```sql
INSERT INTO material_categories (code, name, sort_no) VALUES
  ('raw', '原材料', 1),
  ('semi', '半成品', 2),
  ('finished', '成品', 3),
  ('consumable', '耗材', 4);
```

### 3.2 `tags` - 標籤表（副分類）

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | TEXT | UNIQUE NOT NULL | 標籤代碼（seafood/meat/offal/braised/veg/staple/seasoning） |
| name | TEXT | NOT NULL | 標籤名稱 |
| color | TEXT | | 顯示顏色（#hex） |
| is_active | INTEGER | DEFAULT 1 | |
| created_at | TEXT | DEFAULT now | |

**預置數據：**

```sql
INSERT INTO tags (code, name, color) VALUES
  ('seafood', '海鮮', '#3B82F6'),
  ('meat', '肉類', '#EF4444'),
  ('offal', '下水', '#F59E0B'),
  ('braised', '滷味', '#8B5CF6'),
  ('vegetable', '蔬菜', '#10B981'),
  ('staple', '主食', '#6B7280'),
  ('seasoning', '調味料', '#EC4899'),
  ('frozen', '冷凍', '#06B6D4'),
  ('fresh', '鮮活', '#84CC16');
```

### 3.3 `material_tags` - 材料標籤關聯表（多對多）

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| material_id | INTEGER | FK materials, NOT NULL | |
| tag_id | INTEGER | FK tags, NOT NULL | |

```sql
CREATE UNIQUE INDEX idx_material_tag_unique ON material_tags(material_id, tag_id);
```

### 3.4 `materials` - 材料主表

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | TEXT | UNIQUE NOT NULL | 材料編碼 |
| name | TEXT | NOT NULL | 材料名稱 |
| category_id | INTEGER | FK material_categories | 主分類 |
| base_unit_id | INTEGER | FK units, NOT NULL | 基準單位 |
| shelf_life_days | INTEGER | | 保質期（天） |
| is_active | INTEGER | DEFAULT 1 | |
| created_at | TEXT | DEFAULT now | |
| updated_at | TEXT | DEFAULT now | |

### 3.5 `units` - 單位表

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | TEXT | UNIQUE NOT NULL | 單位代碼 |
| name | TEXT | NOT NULL | 單位名稱 |
| unit_type | TEXT | NOT NULL | 類型：piece/weight/volume |
| ratio_to_base | REAL | DEFAULT 1.0 | 與基準單位換算比例 |
| created_at | TEXT | DEFAULT now | |

**預置數據：**

```sql
INSERT INTO units (code, name, unit_type, ratio_to_base) VALUES
  ('pc', '個', 'piece', 1.0),
  ('kg', '千克', 'weight', 1.0),
  ('g', '克', 'weight', 1000.0),
  ('L', '升', 'volume', 1.0),
  ('ml', '毫升', 'volume', 1000.0),
  ('jin', '斤', 'weight', 2.0),
  ('liang', '兩', 'weight', 20.0),
  ('portion', '份', 'piece', 1.0);
```

### 3.6 `material_states` - 材料狀態定義表

**用途：** 定義同一材料在不同加工狀態下的屬性和轉換關係。

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| material_id | INTEGER | FK materials, NOT NULL | 所屬材料 |
| state_code | TEXT | NOT NULL | 狀態代碼（fresh/frozen/thawed/cut/cooked/braised） |
| state_name | TEXT | NOT NULL | 狀態名稱（鮮/凍/退冰/切丁/熟製/滷製） |
| unit_id | INTEGER | FK units | 該狀態下的計量單位 |
| yield_rate | REAL | DEFAULT 1.0 | 出成率（相對於原材料） |
| cost_multiplier | REAL | DEFAULT 1.0 | 成本係數 |
| is_active | INTEGER | DEFAULT 1 | |
| created_at | TEXT | DEFAULT now | |

**示例數據：**

```sql
-- 蝦的狀態定義
INSERT INTO material_states (material_id, state_code, state_name, unit_id, yield_rate, cost_multiplier) VALUES
  (1, 'frozen', '凍蝦', 2, 1.0, 1.0),        -- 凍蝦，基準
  (1, 'thawed', '退冰蝦', 2, 0.92, 1.087),    -- 退冰後損耗8%
  (1, 'peeled', '蝦仁', 2, 0.65, 1.538),      -- 去殼後損耗35%
  (1, 'cooked', '熟蝦', 2, 0.55, 1.818);      -- 熟製後損耗45%
```

### 3.7 `suppliers` - 供應商表

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| name | TEXT | NOT NULL | 供應商名稱 |
| phone | TEXT | | 聯繫電話 |
| contact_person | TEXT | | 聯繫人 |
| address | TEXT | | 地址 |
| note | TEXT | | 備註 |
| is_active | INTEGER | DEFAULT 1 | |
| created_at | TEXT | DEFAULT now | |

---

## 4. 批次與屬性系統

### 4.1 `inventory_batches` - 庫存批次表

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| material_id | INTEGER | FK materials, NOT NULL | 材料ID |
| state_id | INTEGER | FK material_states | 當前狀態 |
| lot_no | TEXT | UNIQUE NOT NULL | 批次號 |
| supplier_id | INTEGER | FK suppliers | 供應商 |
| brand | TEXT | | 品牌 |
| spec | TEXT | | 規格說明（如：大蝦/中蝦） |
| quantity | REAL | NOT NULL DEFAULT 0 | 當前庫存數量 |
| original_qty | REAL | NOT NULL | 入庫原始數量 |
| cost_per_unit | REAL | NOT NULL DEFAULT 0 | 單位成本 |
| production_date | TEXT | | 生產/入庫日期 |
| expiry_date | TEXT | | 過期日期 |
| ice_coating_rate | REAL | | 冰衣率（海鮮專用） |
| quality_rate | REAL | | 良品率 |
| seasonal_factor | REAL | DEFAULT 1.0 | 季節係數 |
| created_at | TEXT | DEFAULT now | |
| updated_at | TEXT | DEFAULT now | |

**索引：**

```sql
CREATE INDEX idx_batch_material ON inventory_batches(material_id);
CREATE INDEX idx_batch_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_batch_lot ON inventory_batches(lot_no);
```

### 4.2 `attribute_templates` - 屬性模板表

**用途：** 定義用戶可自定義的屬性維度，提供預置模板。

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| entity_type | TEXT | NOT NULL | 適用實體：material/batch/recipe |
| category | TEXT | | 屬性分類（yield/loss/cost/quality） |
| attr_code | TEXT | UNIQUE NOT NULL | 屬性代碼 |
| attr_name | TEXT | NOT NULL | 屬性名稱 |
| data_type | TEXT | NOT NULL | number/percent/currency/text |
| unit | TEXT | | 單位（%/元/kg） |
| default_value | REAL | | 默認值 |
| formula | TEXT | | 計算公式（可選） |
| is_template | INTEGER | DEFAULT 1 | 是否為預置模板 |
| is_active | INTEGER | DEFAULT 1 | |
| created_at | TEXT | DEFAULT now | |

**預置模板 - 滷味類：**

```sql
INSERT INTO attribute_templates (entity_type, category, attr_code, attr_name, data_type, unit, default_value, formula, is_template) VALUES
  ('batch', 'yield', 'braise_yield_rate', '滷製出成率', 'percent', '%', 0.75, NULL, 1),
  ('batch', 'loss', 'braise_shrinkage', '滷製收縮率', 'percent', '%', 0.15, NULL, 1),
  ('batch', 'cost', 'spice_cost_ratio', '香料成本佔比', 'percent', '%', 0.08, NULL, 1),
  ('batch', 'quality', 'braise_grade', '滷製品級', 'text', '', NULL, NULL, 1);
```

**預置模板 - 海鮮類：**

```sql
INSERT INTO attribute_templates (entity_type, category, attr_code, attr_name, data_type, unit, default_value, formula, is_template) VALUES
  ('batch', 'yield', 'thaw_loss_rate', '退冰損耗率', 'percent', '%', 0.08, NULL, 1),
  ('batch', 'yield', 'shell_loss_rate', '去殼損耗率', 'percent', '%', 0.35, NULL, 1),
  ('batch', 'yield', 'ice_coating_rate', '冰衣率', 'percent', '%', 0.15, NULL, 1),
  ('batch', 'yield', 'net_yield_rate', '淨出成率', 'percent', '%', 0.55, '(1 - thaw_loss_rate) * (1 - shell_loss_rate)', 1),
  ('batch', 'quality', 'freshness_grade', '鮮度等級', 'text', '', NULL, NULL, 1),
  ('batch', 'cost', 'actual_cost_per_kg', '實際成本/kg', 'currency', '元', NULL, 'cost_per_unit / net_yield_rate', 1);
```

**預置模板 - 肉類/下水類：**

```sql
INSERT INTO attribute_templates (entity_type, category, attr_code, attr_name, data_type, unit, default_value, formula, is_template) VALUES
  ('batch', 'yield', 'trim_loss_rate', '修整損耗率', 'percent', '%', 0.10, NULL, 1),
  ('batch', 'yield', 'cook_yield_rate', '熟製出成率', 'percent', '%', 0.65, NULL, 1),
  ('batch', 'loss', 'rd_loss_rate', '研發損耗率', 'percent', '%', 0.05, NULL, 1),
  ('batch', 'loss', 'fail_loss_rate', '失敗損耗率', 'percent', '%', 0.03, NULL, 1),
  ('batch', 'loss', 'seasonal_loss', '季節性損耗', 'percent', '%', 0.02, NULL, 1),
  ('batch', 'quality', 'quality_rate', '良品率', 'percent', '%', 0.92, NULL, 1),
  ('batch', 'cost', 'effective_cost', '有效成本', 'currency', '元', NULL, 'cost_per_unit / (quality_rate * (1 - trim_loss_rate))', 1);
```

### 4.3 `entity_attributes` - 實體屬性值表

**用途：** 存儲批次/材料/配方的實際屬性值。

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| entity_type | TEXT | NOT NULL | material/batch/recipe |
| entity_id | INTEGER | NOT NULL | 對應實體ID |
| attr_code | TEXT | NOT NULL | 屬性代碼 |
| value | REAL | | 數值 |
| value_text | TEXT | | 文本值 |
| calculated | INTEGER | DEFAULT 0 | 是否為計算值 |
| updated_at | TEXT | DEFAULT now | |

```sql
CREATE UNIQUE INDEX idx_entity_attr ON entity_attributes(entity_type, entity_id, attr_code);
```

---

## 5. 配方系統

### 5.1 `recipes` - 配方主表

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | TEXT | UNIQUE NOT NULL | 配方編碼 |
| name | TEXT | NOT NULL | 配方名稱 |
| recipe_type | TEXT | NOT NULL | menu/production/modifier |
| output_material_id | INTEGER | FK materials | 產出材料（半成品生產用） |
| output_state_id | INTEGER | FK material_states | 產出狀態 |
| output_qty | REAL | NOT NULL DEFAULT 1.0 | 產出數量 |
| output_unit_id | INTEGER | FK units | 產出單位 |
| cost | REAL | | 計算成本（自動） |
| is_active | INTEGER | DEFAULT 1 | |
| created_at | TEXT | DEFAULT now | |
| updated_at | TEXT | DEFAULT now | |

### 5.2 `recipe_items` - 配方明細表

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| recipe_id | INTEGER | FK recipes, NOT NULL | |
| item_type | TEXT | NOT NULL | material/state/batch |
| ref_id | INTEGER | NOT NULL | 根據 item_type 指向不同表 |
| qty | REAL | NOT NULL | 用量 |
| unit_id | INTEGER | FK units, NOT NULL | 單位 |
| wastage_rate | REAL | DEFAULT 0.0 | 損耗率 |
| note | TEXT | | 備註 |
| sort_no | INTEGER | DEFAULT 0 | 排序 |

**item_type 說明：**

| item_type | ref_id 指向 | 示例 |
|-----------|-------------|------|
| material | materials.id | 直接使用原材料 |
| state | material_states.id | 使用特定狀態的材料 |
| batch | inventory_batches.id | 指定批次（精確成本） |

### 5.3 `recipe_formulas` - 配方公式表

**用途：** 存儲配方級別的計算公式。

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| recipe_id | INTEGER | FK recipes, NOT NULL | |
| formula_code | TEXT | NOT NULL | 公式代碼 |
| formula_name | TEXT | NOT NULL | 公式名稱 |
| expression | TEXT | NOT NULL | 公式表達式 |
| result_unit | TEXT | | 結果單位 |
| is_active | INTEGER | DEFAULT 1 | |

**示例：**

```sql
-- 麻辣小龍蝦配方成本計算
INSERT INTO recipe_formulas (recipe_id, formula_code, formula_name, expression) VALUES
  (101, 'total_cost', '總成本', 'SUM(item_cost * qty * (1 + wastage_rate))'),
  (101, 'cost_per_portion', '每份成本', 'total_cost / output_qty'),
  (101, 'gross_margin', '毛利率', '(sales_price - cost_per_portion) / sales_price');
```

---

## 6. 庫存交易系統

### 6.1 `inventory_txns` - 庫存交易流水表（審計核心）

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| txn_no | TEXT | UNIQUE NOT NULL | 交易編號 |
| txn_type | TEXT | NOT NULL | 交易類型（見下表） |
| ref_type | TEXT | | 引用類型（order/production/purchase/adjustment） |
| ref_id | INTEGER | | 引用ID |
| lot_id | INTEGER | FK inventory_batches | 批次ID |
| material_id | INTEGER | FK materials, NOT NULL | 材料ID |
| state_id | INTEGER | FK material_states | 狀態ID |
| qty_delta | REAL | NOT NULL | 數量變化（正=入，負=出） |
| cost_delta | REAL | DEFAULT 0.0 | 成本變化 |
| operator | TEXT | | 操作人 |
| note | TEXT | | 備註 |
| created_at | TEXT | DEFAULT now | |

**txn_type 列表：**

| 類型 | 說明 | qty_delta |
|------|------|-----------|
| purchase_in | 採購入庫 | + |
| production_in | 生產入庫 | + |
| production_out | 生產消耗 | - |
| reserve | 訂單預扣 | - |
| consume | 訂單實扣 | - |
| release | 預扣回補 | + |
| wastage | 損耗記錄 | - |
| adjustment | 庫存調整 | +/- |
| transfer | 狀態轉換 | +/- |

**索引：**

```sql
CREATE INDEX idx_txn_material ON inventory_txns(material_id);
CREATE INDEX idx_txn_lot ON inventory_txns(lot_id);
CREATE INDEX idx_txn_ref ON inventory_txns(ref_type, ref_id);
CREATE INDEX idx_txn_created ON inventory_txns(created_at);
```

### 6.2 `stocktakes` - 盤點單

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| stocktake_no | TEXT | UNIQUE NOT NULL | 盤點單號 |
| status | TEXT | NOT NULL | draft/completed |
| operator | TEXT | | 操作人 |
| note | TEXT | | 備註 |
| created_at | TEXT | DEFAULT now | |
| completed_at | TEXT | | 完成時間 |

### 6.3 `stocktake_items` - 盤點明細

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| stocktake_id | INTEGER | FK stocktakes, NOT NULL | |
| lot_id | INTEGER | FK inventory_batches | 批次ID |
| material_id | INTEGER | FK materials, NOT NULL | |
| system_qty | REAL | NOT NULL | 系統數量 |
| actual_qty | REAL | NOT NULL | 實際數量 |
| diff_qty | REAL | | 差異（自動計算） |
| note | TEXT | | 備註 |

---

## 7. 菜單與訂單系統

### 7.1 `menu_categories` - 菜單分類

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| name | TEXT | NOT NULL | 分類名稱（海鮮/肉類/素食/主食） |
| sort_no | INTEGER | DEFAULT 0 | 排序 |
| is_active | INTEGER | DEFAULT 1 | |

### 7.2 `menu_items` - 菜單商品

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| name | TEXT | NOT NULL | 商品名稱 |
| code | TEXT | UNIQUE | 商品編碼 |
| category_id | INTEGER | FK menu_categories | 分類 |
| recipe_id | INTEGER | FK recipes | 綁定配方 |
| sales_price | REAL | NOT NULL DEFAULT 0 | 售價 |
| cost | REAL | | 成本（自動計算） |
| is_available | INTEGER | DEFAULT 1 | 是否可售 |
| created_at | TEXT | DEFAULT now | |

### 7.3 `menu_item_specs` - 商品規格

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| menu_item_id | INTEGER | FK menu_items, NOT NULL | |
| spec_code | TEXT | NOT NULL | 規格代碼（small/medium/large） |
| spec_name | TEXT | NOT NULL | 規格名稱（小份/中份/大份） |
| price_delta | REAL | DEFAULT 0 | 價格差異 |
| qty_multiplier | REAL | DEFAULT 1.0 | 用量倍數 |
| sort_no | INTEGER | DEFAULT 0 | |

### 7.4 `orders` - 訂單

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| order_no | TEXT | UNIQUE NOT NULL | 訂單號 |
| source | TEXT | NOT NULL | pos/miniapp |
| dine_type | TEXT | NOT NULL | dine_in/takeout/delivery |
| table_no | TEXT | | 桌號 |
| status | TEXT | NOT NULL | pending/submitted/preparing/ready/completed/cancelled |
| amount_total | REAL | DEFAULT 0 | 總金額 |
| note | TEXT | | 備註 |
| created_at | TEXT | DEFAULT now | |
| updated_at | TEXT | DEFAULT now | |

### 7.5 `order_items` - 訂單明細

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| order_id | INTEGER | FK orders, NOT NULL | |
| menu_item_id | INTEGER | FK menu_items, NOT NULL | |
| spec_code | TEXT | | 規格 |
| qty | REAL | NOT NULL DEFAULT 1 | 數量 |
| unit_price | REAL | NOT NULL | 單價 |
| note | TEXT | | 備註 |

### 7.6 `order_item_modifiers` - 加料/去料

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| order_item_id | INTEGER | FK order_items, NOT NULL | |
| modifier_type | TEXT | NOT NULL | add/remove |
| material_id | INTEGER | FK materials | 材料ID |
| qty | REAL | NOT NULL | 數量 |
| price_delta | REAL | DEFAULT 0 | 價格變化 |

---

## 8. KDS 工作站系統

### 8.1 `kitchen_stations` - 廚房工作站

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | TEXT | UNIQUE NOT NULL | 工作站代碼 |
| name | TEXT | NOT NULL | 工作站名稱 |
| station_type | TEXT | NOT NULL | hot/cold/drink/pack |
| is_active | INTEGER | DEFAULT 1 | |
| sort_no | INTEGER | DEFAULT 0 | |

**預置數據：**

```sql
INSERT INTO kitchen_stations (code, name, station_type) VALUES
  ('hot', '熱菜站', 'hot'),
  ('cold', '涼菜站', 'cold'),
  ('drink', '飲品站', 'drink'),
  ('pack', '打包站', 'pack');
```

### 8.2 `station_menu_items` - 工作站與菜單關聯

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| station_id | INTEGER | FK kitchen_stations, NOT NULL | |
| menu_item_id | INTEGER | FK menu_items, NOT NULL | |

### 8.3 `kitchen_tickets` - 廚房小票

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| order_id | INTEGER | FK orders, NOT NULL | |
| station_id | INTEGER | FK kitchen_stations, NOT NULL | |
| status | TEXT | NOT NULL | pending/started/finished/cancelled |
| priority | INTEGER | DEFAULT 0 | 優先級 |
| printed_at | TEXT | | 打印時間 |
| started_at | TEXT | | 開始製作時間 |
| finished_at | TEXT | | 完成時間 |
| created_at | TEXT | DEFAULT now | |

---

## 9. 採購與生產系統

### 9.1 `purchase_orders` - 採購單

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| po_no | TEXT | UNIQUE NOT NULL | 採購單號 |
| supplier_id | INTEGER | FK suppliers | 供應商 |
| status | TEXT | NOT NULL | draft/confirmed/received/cancelled |
| expected_date | TEXT | | 預計到貨日期 |
| total_cost | REAL | DEFAULT 0 | 總成本 |
| created_at | TEXT | DEFAULT now | |

### 9.2 `purchase_order_items` - 採購明細

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| po_id | INTEGER | FK purchase_orders, NOT NULL | |
| material_id | INTEGER | FK materials, NOT NULL | |
| qty | REAL | NOT NULL | 採購數量 |
| unit_id | INTEGER | FK units | 單位 |
| cost_per_unit | REAL | NOT NULL | 單價 |
| received_qty | REAL | DEFAULT 0 | 實際收貨數量 |

### 9.3 `production_orders` - 生產單（半成品）

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| production_no | TEXT | UNIQUE NOT NULL | 生產單號 |
| recipe_id | INTEGER | FK recipes, NOT NULL | 使用配方 |
| status | TEXT | NOT NULL | draft/in_progress/completed/cancelled |
| planned_qty | REAL | NOT NULL | 計劃產量 |
| actual_qty | REAL | | 實際產量 |
| operator | TEXT | | 操作人 |
| started_at | TEXT | | 開始時間 |
| completed_at | TEXT | | 完成時間 |
| created_at | TEXT | DEFAULT now | |

### 9.4 `production_order_items` - 生產消耗明細

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| production_id | INTEGER | FK production_orders, NOT NULL | |
| material_id | INTEGER | FK materials, NOT NULL | |
| lot_id | INTEGER | FK inventory_batches | 使用批次 |
| planned_qty | REAL | NOT NULL | 計劃用量 |
| actual_qty | REAL | | 實際用量 |

---

## 10. 打印系統

### 10.1 `print_tasks` - 打印任務

| 字段 | 類型 | 約束 | 說明 |
|------|------|------|------|
| id | INTEGER | PK | |
| task_type | TEXT | NOT NULL | kitchen_label/batch_label/cup_label |
| ref_type | TEXT | | 引用類型 |
| ref_id | INTEGER | | 引用ID |
| content | TEXT | | 打印內容（JSON） |
| status | TEXT | NOT NULL | pending/printed/failed |
| printer_name | TEXT | | 打印機名稱 |
| created_at | TEXT | DEFAULT now | |
| printed_at | TEXT | | 打印時間 |

---

## 11. 成本計算邏輯

### 11.1 出成率/損耗率

```
實際可用量 = 採購量 × (1 - 損耗率) × 出成率 × 季節係數 × 良品率
```

### 11.2 多單位轉換

```
基準單位數量 = 原始數量 × (原始單位 ratio_to_base / 目標單位 ratio_to_base)
```

### 11.3 配方成本計算

```
配方總成本 = Σ(配方項成本 × 用量 × (1 + 損耗率))
每份成本 = 配方總成本 / 產出數量
毛利率 = (售價 - 每份成本) / 售價
```

### 11.4 批次成本計算（海鮮示例）

```
實際成本/kg = 採購單價 / 淨出成率
淨出成率 = (1 - 退冰損耗率) × (1 - 去殼損耗率) × (1 - 冰衣率)
```

---

## 12. 索引設計建議

```sql
-- 材料相關
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_materials_active ON materials(is_active);

-- 配方相關
CREATE INDEX idx_recipes_type ON recipes(recipe_type);
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);

-- 庫存相關
CREATE INDEX idx_batches_material ON inventory_batches(material_id);
CREATE INDEX idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX txns_material ON inventory_txns(material_id);
CREATE INDEX idx_txns_lot ON inventory_txns(lot_id);
CREATE INDEX idx_txns_ref ON inventory_txns(ref_type, ref_id);

-- 訂單相關
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- KDS 相關
CREATE INDEX idx_tickets_station ON kitchen_tickets(station_id);
CREATE INDEX idx_tickets_status ON kitchen_tickets(status);
```

---

## 13. 數據完整性約束

### 13.1 外鍵約束

所有外鍵均使用 `REFERENCES` 定義，SQLite 需在連接時啟用：

```sql
PRAGMA foreign_keys = ON;
```

### 13.2 業務規則約束

| 規則 | 實現方式 |
|------|----------|
| 菜單商品必須綁定配方 | 插入時檢查 recipe_id |
| 庫存不得為負 | 業務層檢查 |
| 訂單取消必須冪等 | 狀態機控制 |
| 庫存交易不可刪除 | 只允許新增，不允許 DELETE |

---

## 14. 預置數據匯總

| 表 | 預置內容 |
|----|----------|
| units | pc/kg/g/L/ml/jin/liang/portion |
| material_categories | raw/semi/finished/consumable |
| tags | seafood/meat/offal/braised/vegetable/staple/seasoning/frozen/fresh |
| kitchen_stations | hot/cold/drink/pack |
| attribute_templates | 滷味/海鮮/肉類/下水 各類預置模板 |
