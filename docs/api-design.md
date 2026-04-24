# Cuckoo 餐飲系統 - API 設計文檔

> 版本：v0.2  
> 更新日期：2026-04-23  
> 基礎路徑：`/api/v1`（Tauri invoke 命令）

---

## 1. API 規範

### 1.1 調用方式

本系統使用 Tauri 2.0 架構，前端通過 `invoke()` 調用 Rust 後端命令，而非傳統 HTTP REST API。

```typescript
// 前端調用示例
import { invoke } from "@tauri-apps/api/core";

// GET 等效
const materials = await invoke("get_materials", { params: { category: "raw" } });

// POST 等效
const newMaterial = await invoke("create_material", { data: { code: "MAT001", name: "五花肉" } });
```

### 1.2 命名規範

| 操作 | 命令前綴 | 示例 |
|------|----------|------|
| 查詢列表 | `get_*` | `get_materials`, `get_orders` |
| 查詢單項 | `get_*_by_id` | `get_material_by_id` |
| 創建 | `create_*` | `create_material` |
| 更新 | `update_*` | `update_material` |
| 刪除 | `delete_*` | `delete_material` |
| 業務操作 | `*_*` | `submit_order`, `finish_ticket` |

### 1.3 錯誤碼規範

```typescript
interface ApiError {
  code: string;      // 錯誤代碼
  message: string;   // 用戶可讀信息
  details?: object;  // 詳細信息（開發調試用）
}
```

| 錯誤碼 | 說明 |
|--------|------|
| `NOT_FOUND` | 資源不存在 |
| `VALIDATION_ERROR` | 參數驗證失敗 |
| `INSUFFICIENT_STOCK` | 庫存不足 |
| `DUPLICATE_ENTRY` | 重複數據 |
| `INVALID_STATE` | 狀態轉換不合法 |
| `FORMULA_ERROR` | 公式計算錯誤 |

---

## 2. 基礎資料 API

### 2.1 單位管理

```
get_units()
```

**返回：**

```typescript
interface Unit {
  id: number;
  code: string;
  name: string;
  unit_type: "piece" | "weight" | "volume";
  ratio_to_base: number;
}
```

---

### 2.2 材料分類

```
get_material_categories()
create_material_category(data: CreateCategoryRequest)
update_material_category(id: number, data: UpdateCategoryRequest)
```

**請求體：**

```typescript
interface CreateCategoryRequest {
  code: string;       // raw/semi/finished/consumable
  name: string;       // 原材料/半成品/成品/耗材
  sort_no?: number;
}
```

---

### 2.3 標籤管理

```
get_tags()
create_tag(data: CreateTagRequest)
update_tag(id: number, data: UpdateTagRequest)
delete_tag(id: number)
```

**請求體：**

```typescript
interface CreateTagRequest {
  code: string;       // seafood/meat/offal/braised/...
  name: string;       // 海鮮/肉類/下水/滷味/...
  color?: string;     // #hex
}
```

---

### 2.4 材料管理

```
get_materials(params?: GetMaterialsParams)
get_material_by_id(id: number)
create_material(data: CreateMaterialRequest)
update_material(id: number, data: UpdateMaterialRequest)
delete_material(id: number)
get_material_states(material_id: number)
add_material_tags(material_id: number, tag_ids: number[])
remove_material_tag(material_id: number, tag_id: number)
```

**查詢參數：**

```typescript
interface GetMaterialsParams {
  category_id?: number;
  tag_ids?: number[];     // 多選標籤
  is_active?: boolean;
  search?: string;        // 名稱/編碼模糊搜索
}
```

**創建請求：**

```typescript
interface CreateMaterialRequest {
  code: string;
  name: string;
  category_id: number;
  base_unit_id: number;
  shelf_life_days?: number;
  tag_ids?: number[];     // 初始標籤
}
```

---

### 2.5 材料狀態管理

```
get_material_states(material_id: number)
create_material_state(data: CreateMaterialStateRequest)
update_material_state(id: number, data: UpdateMaterialStateRequest)
```

**請求體：**

```typescript
interface CreateMaterialStateRequest {
  material_id: number;
  state_code: string;     // fresh/frozen/thawed/cut/cooked/braised
  state_name: string;     // 鮮/凍/退冰/切丁/熟製/滷製
  unit_id: number;
  yield_rate?: number;    // 出成率
  cost_multiplier?: number; // 成本係數
}
```

---

### 2.6 供應商管理

```
get_suppliers()
create_supplier(data: CreateSupplierRequest)
update_supplier(id: number, data: UpdateSupplierRequest)
```

---

## 3. 屬性模板與自定義屬性

### 3.1 屬性模板

```
get_attribute_templates(params?: GetTemplatesParams)
create_attribute_template(data: CreateTemplateRequest)
```

**查詢參數：**

```typescript
interface GetTemplatesParams {
  entity_type?: "material" | "batch" | "recipe";
  category?: "yield" | "loss" | "cost" | "quality";
}
```

**創建請求：**

```typescript
interface CreateTemplateRequest {
  entity_type: string;
  category?: string;
  attr_code: string;
  attr_name: string;
  data_type: "number" | "percent" | "currency" | "text";
  unit?: string;
  default_value?: number;
  formula?: string;       // 計算公式
}
```

### 3.2 實體屬性值

```
get_entity_attributes(entity_type: string, entity_id: number)
set_entity_attribute(data: SetAttributeRequest)
calculate_attribute(entity_type: string, entity_id: number, attr_code: string)
```

**請求體：**

```typescript
interface SetAttributeRequest {
  entity_type: string;
  entity_id: number;
  attr_code: string;
  value?: number;
  value_text?: string;
}
```

---

## 4. 批次與庫存 API

### 4.1 批次管理

```
get_inventory_batches(params?: GetBatchesParams)
get_batch_by_id(id: number)
create_batch(data: CreateBatchRequest)
update_batch(id: number, data: UpdateBatchRequest)
```

**查詢參數：**

```typescript
interface GetBatchesParams {
  material_id?: number;
  state_id?: number;
  supplier_id?: number;
  brand?: string;
  is_expired?: boolean;   // 是否已過期
  expiry_before?: string; // 過期日期之前
  expiry_after?: string;  // 過期日期之後
}
```

**創建請求：**

```typescript
interface CreateBatchRequest {
  material_id: number;
  state_id?: number;
  lot_no: string;
  supplier_id?: number;
  brand?: string;
  spec?: string;
  quantity: number;
  cost_per_unit: number;
  production_date?: string;
  expiry_date?: string;
  ice_coating_rate?: number;
  quality_rate?: number;
  seasonal_factor?: number;
  attributes?: Record<string, number | string>; // 自定義屬性
}
```

### 4.2 庫存交易

```
get_inventory_txns(params?: GetTxnsParams)
get_inventory_summary(params?: GetSummaryParams)
```

**查詢參數：**

```typescript
interface GetTxnsParams {
  material_id?: number;
  lot_id?: number;
  txn_type?: string;
  ref_type?: string;
  date_from?: string;
  date_to?: string;
}

interface GetSummaryParams {
  material_id?: number;
  include_reserved?: boolean; // 是否包含預扣量
}
```

**返回：**

```typescript
interface InventorySummary {
  material_id: number;
  material_name: string;
  total_qty: number;        // 總庫存
  reserved_qty: number;     // 預扣量
  available_qty: number;    // 可用量
  batches: BatchSummary[];  // 按批次明細
}

interface BatchSummary {
  lot_id: number;
  lot_no: string;
  quantity: number;
  cost_per_unit: number;
  expiry_date?: string;
}
```

### 4.3 庫存操作

```
reserve_inventory(data: ReserveRequest)      // 預扣
confirm_inventory(data: ConfirmRequest)      // 實扣
release_inventory(data: ReleaseRequest)      // 回補
adjust_inventory(data: AdjustRequest)        // 調整
record_wastage(data: WastageRequest)         // 損耗記錄
```

**請求體：**

```typescript
interface ReserveRequest {
  ref_type: string;       // order/production
  ref_id: number;
  items: ReserveItem[];
}

interface ReserveItem {
  material_id: number;
  qty: number;
  strategy?: "fifo" | "fefo"; // 默認 fefo
}

interface ConfirmRequest {
  ref_type: string;
  ref_id: number;
}

interface ReleaseRequest {
  ref_type: string;
  ref_id: number;
}

interface AdjustRequest {
  material_id: number;
  lot_id?: number;
  qty_delta: number;
  reason: string;
  operator?: string;
}

interface WastageRequest {
  material_id: number;
  lot_id?: number;
  qty: number;
  wastage_type: string;   // rd/fail/seasonal/normal
  operator?: string;
  note?: string;
}
```

---

## 5. 配方 API

### 5.1 配方 CRUD

```
get_recipes(params?: GetRecipesParams)
get_recipe_by_id(id: number)
create_recipe(data: CreateRecipeRequest)
update_recipe(id: number, data: UpdateRecipeRequest)
delete_recipe(id: number)
```

**查詢參數：**

```typescript
interface GetRecipesParams {
  recipe_type?: "menu" | "production" | "modifier";
  output_material_id?: number;
  is_active?: boolean;
}
```

**創建請求：**

```typescript
interface CreateRecipeRequest {
  code: string;
  name: string;
  recipe_type: "menu" | "production" | "modifier";
  output_material_id?: number;    // 生產配方必填
  output_state_id?: number;
  output_qty: number;
  output_unit_id: number;
  items: RecipeItemRequest[];
  formulas?: RecipeFormulaRequest[];
}

interface RecipeItemRequest {
  item_type: "material" | "state" | "batch";
  ref_id: number;
  qty: number;
  unit_id: number;
  wastage_rate?: number;
  note?: string;
  sort_no?: number;
}

interface RecipeFormulaRequest {
  formula_code: string;
  formula_name: string;
  expression: string;
  result_unit?: string;
}
```

### 5.2 配方計算

```
calculate_recipe_cost(recipe_id: number)
calculate_recipe_margin(recipe_id: number, sales_price: number)
get_recipe_items(recipe_id: number)
add_recipe_item(recipe_id: number, data: RecipeItemRequest)
update_recipe_item(item_id: number, data: UpdateRecipeItemRequest)
delete_recipe_item(item_id: number)
```

**返回：**

```typescript
interface RecipeCostResult {
  recipe_id: number;
  recipe_name: string;
  total_cost: number;
  cost_per_unit: number;
  output_qty: number;
  output_unit: string;
  items: RecipeCostItem[];
}

interface RecipeCostItem {
  material_name: string;
  qty: number;
  unit: string;
  cost_per_unit: number;
  wastage_rate: number;
  line_cost: number;
}
```

---

## 6. 菜單 API

### 6.1 菜單分類

```
get_menu_categories()
create_menu_category(data: { name: string; sort_no?: number })
update_menu_category(id: number, data: { name?: string; sort_no?: number })
```

### 6.2 菜單商品

```
get_menu_items(params?: GetMenuItemsParams)
get_menu_item_by_id(id: number)
create_menu_item(data: CreateMenuItemRequest)
update_menu_item(id: number, data: UpdateMenuItemRequest)
toggle_menu_item_availability(id: number, is_available: boolean)
```

**查詢參數：**

```typescript
interface GetMenuItemsParams {
  category_id?: number;
  is_available?: boolean;
  search?: string;
}
```

**創建請求：**

```typescript
interface CreateMenuItemRequest {
  name: string;
  code?: string;
  category_id: number;
  recipe_id: number;
  sales_price: number;
  specs?: MenuItemSpecRequest[];
}

interface MenuItemSpecRequest {
  spec_code: string;
  spec_name: string;
  price_delta?: number;
  qty_multiplier?: number;
}
```

---

## 7. 訂單 API

### 7.1 訂單管理

```
create_order(data: CreateOrderRequest)
get_order_by_id(id: number)
get_orders(params?: GetOrdersParams)
submit_order(id: number)
cancel_order(id: number)
```

**創建請求：**

```typescript
interface CreateOrderRequest {
  source: "pos" | "miniapp";
  dine_type: "dine_in" | "takeout" | "delivery";
  table_no?: string;
  items: OrderItemRequest[];
  note?: string;
}

interface OrderItemRequest {
  menu_item_id: number;
  spec_code?: string;
  qty: number;
  unit_price: number;
  note?: string;
  modifiers?: OrderModifierRequest[];
}

interface OrderModifierRequest {
  modifier_type: "add" | "remove";
  material_id: number;
  qty: number;
  price_delta?: number;
}
```

**返回：**

```typescript
interface OrderResult {
  id: number;
  order_no: string;
  status: string;
  amount_total: number;
  items: OrderItemResult[];
  kitchen_tickets: KitchenTicket[];
  reserved_inventory: boolean;
}
```

### 7.2 訂單業務操作

```
submit_order(id: number)      // 提交訂單（觸發預扣+拆單+KDS）
cancel_order(id: number)      // 取消訂單（觸發回補）
```

**submit_order 服務端動作：**
1. 驗證訂單狀態（pending → submitted）
2. 按配方展開庫存需求
3. 執行庫存預扣（FEFO 策略）
4. 拆分廚房小票（按工作站）
5. 回寫訂單狀態

**cancel_order 服務端動作：**
1. 驗證可取消狀態
2. 回補預扣庫存
3. 取消相關廚房小票
4. 回寫訂單狀態為 cancelled

---

## 8. KDS API

### 8.1 工作站管理

```
get_kitchen_stations()
create_kitchen_station(data: CreateStationRequest)
update_kitchen_station(id: number, data: UpdateStationRequest)
get_station_tickets(station_id: number, params?: GetTicketsParams)
```

**查詢參數：**

```typescript
interface GetTicketsParams {
  status?: "pending" | "started" | "finished";
  date?: string;
}
```

### 8.2 廚房小票操作

```
start_ticket(id: number, operator?: string)
finish_ticket(id: number, operator?: string)
cancel_ticket(id: number, reason?: string)
```

**finish_ticket 服務端動作：**
1. 更新小票狀態為 finished
2. 將預扣庫存轉為實扣（consume）
3. 生成出餐打印任務（如配置）
4. 檢查訂單是否全部完成，更新訂單狀態

---

## 9. 採購 API

### 9.1 採購單

```
get_purchase_orders(params?: GetPOParams)
create_purchase_order(data: CreatePORequest)
update_purchase_order(id: number, data: UpdatePORequest)
receive_purchase_order(id: number, data: ReceivePORequest)
```

**收貨請求：**

```typescript
interface ReceivePORequest {
  items: ReceiveItem[];
  operator?: string;
  note?: string;
}

interface ReceiveItem {
  po_item_id: number;
  received_qty: number;
  lot_no: string;
  production_date?: string;
  expiry_date?: string;
  attributes?: Record<string, number | string>;
}
```

**receive_purchase_order 服務端動作：**
1. 更新採購單狀態為 received
2. 為每個收貨項創建 inventory_batches
3. 生成 purchase_in 類型庫存交易
4. 應用自定義屬性到批次

---

## 10. 生產 API（半成品）

### 10.1 生產單

```
get_production_orders(params?: GetProductionParams)
create_production_order(data: CreateProductionRequest)
start_production(id: number, operator?: string)
complete_production(id: number, data: CompleteProductionRequest)
cancel_production(id: number)
```

**完成生產請求：**

```typescript
interface CompleteProductionRequest {
  actual_qty: number;
  actual_inputs?: ActualInput[];
  operator?: string;
  note?: string;
}

interface ActualInput {
  material_id: number;
  lot_id?: number;
  actual_qty: number;
}
```

**complete_production 服務端動作：**
1. 驗證生產單狀態
2. 按實際消耗扣減原料庫存（production_out）
3. 產出半成品庫存（production_in）
4. 計算實際成本
5. 更新生產單狀態為 completed

---

## 11. 盤點 API

```
create_stocktake(data?: CreateStocktakeRequest)
get_stocktake_items(stocktake_id: number)
update_stocktake_item(item_id: number, data: { actual_qty: number })
commit_stocktake(stocktake_id: number, operator?: string)
```

**commit_stocktake 服務端動作：**
1. 計算差異（actual_qty - system_qty）
2. 為每個差異項生成 adjustment 類型庫存交易
3. 更新庫存數量
4. 更新盤點單狀態為 completed

---

## 12. 小程序 API

### 12.1 菜單瀏覽

```
get_miniapp_menu()
get_miniapp_menu_item(id: number)
```

### 12.2 訂單

```
create_miniapp_order(data: CreateMiniappOrderRequest)
get_miniapp_order_status(order_no: string)
```

**請求體：**

```typescript
interface CreateMiniappOrderRequest {
  dine_type: "dine_in" | "takeout";
  table_no?: string;
  items: MiniappOrderItem[];
}

interface MiniappOrderItem {
  menu_item_id: number;
  spec_code?: string;
  qty: number;
  note?: string;
}
```

### 12.3 門店信息

```
get_miniapp_store_info()
```

---

## 13. 報表 API

### 13.1 銷售報表

```
get_sales_report(params: SalesReportParams)
```

**參數：**

```typescript
interface SalesReportParams {
  date_from: string;
  date_to: string;
  group_by?: "day" | "week" | "month" | "category" | "item";
}
```

### 13.2 毛利報表

```
get_margin_report(params: MarginReportParams)
```

### 13.3 原料消耗報表

```
get_material_usage_report(params: UsageReportParams)
```

### 13.4 損耗報表

```
get_wastage_report(params: WastageReportParams)
```

### 13.5 熱銷商品

```
get_top_selling_items(params: TopSellingParams)
```

---

## 14. 打印 API

```
create_print_task(data: CreatePrintTaskRequest)
get_print_tasks(params?: GetPrintTasksParams)
retry_print_task(id: number)
```

**請求體：**

```typescript
interface CreatePrintTaskRequest {
  task_type: "kitchen_label" | "batch_label" | "cup_label";
  ref_type?: string;
  ref_id?: number;
  content: Record<string, any>;
  printer_name?: string;
}
```

---

## 15. 關鍵業務流程時序

### 15.1 訂單創建流程

```
前端                    後端
 |                       |
 |-- create_order ------>|
 |                       |-- 驗證菜單項
 |                       |-- 計算總金額
 |                       |-- 創建訂單 + 明細
 |<-- OrderResult --------|
 |                       |
 |-- submit_order ------>|
 |                       |-- 展開配方需求
 |                       |-- reserve_inventory (FEFO)
 |                       |-- 拆分 kitchen_tickets
 |                       |-- 更新訂單狀態
 |<-- OrderResult --------|
```

### 15.2 KDS 完成出餐流程

```
KDS 前端                後端
 |                       |
 |-- finish_ticket ----->|
 |                       |-- 更新 ticket 狀態
 |                       |-- confirm_inventory (預扣→實扣)
 |                       |-- 生成打印任務
 |                       |-- 檢查訂單完成狀態
 |<-- TicketResult -------|
```

### 15.3 採購入庫流程

```
前端                    後端
 |                       |
 |-- create_purchase_order>|
 |<-- POResult ------------|
 |                       |
 |-- receive_purchase_order>|
 |                       |-- 創建 inventory_batches
 |                       |-- purchase_in 庫存交易
 |                       |-- 應用自定義屬性
 |                       |-- 更新 PO 狀態
 |<-- POResult ------------|
```

### 15.4 半成品生產流程

```
前端                    後端
 |                       |
 |-- create_production_order>|
 |<-- ProductionResult ----|
 |                       |
 |-- start_production -->|
 |                       |-- 更新狀態
 |                       |
 |-- complete_production>|
 |                       |-- 扣原料 (production_out)
 |                       |-- 入半成品 (production_in)
 |                       |-- 計算實際成本
 |<-- ProductionResult ----|
```

---

## 16. Tauri 命令映射表

| 前端 invoke 命令 | Rust 函數 | 說明 |
|------------------|-----------|------|
| `get_units` | `commands::get_units` | 獲取單位列表 |
| `get_materials` | `commands::get_materials` | 獲取材料列表 |
| `create_material` | `commands::create_material` | 創建材料 |
| `get_material_categories` | `commands::get_material_categories` | 獲取分類 |
| `get_tags` | `commands::get_tags` | 獲取標籤 |
| `get_recipes` | `commands::get_recipes` | 獲取配方 |
| `create_recipe` | `commands::create_recipe` | 創建配方 |
| `calculate_recipe_cost` | `commands::calculate_recipe_cost` | 計算配方成本 |
| `create_order` | `commands::create_order` | 創建訂單 |
| `submit_order` | `commands::submit_order` | 提交訂單 |
| `cancel_order` | `commands::cancel_order` | 取消訂單 |
| `get_kitchen_stations` | `commands::get_kitchen_stations` | 獲取工作站 |
| `get_station_tickets` | `commands::get_station_tickets` | 獲取小票 |
| `start_ticket` | `commands::start_ticket` | 開始製作 |
| `finish_ticket` | `commands::finish_ticket` | 完成出餐 |
| `get_inventory_batches` | `commands::get_inventory_batches` | 獲取批次 |
| `get_inventory_summary` | `commands::get_inventory_summary` | 庫存匯總 |
| `reserve_inventory` | `commands::reserve_inventory` | 預扣庫存 |
| `confirm_inventory` | `commands::confirm_inventory` | 實扣庫存 |
| `release_inventory` | `commands::release_inventory` | 回補庫存 |
| `get_purchase_orders` | `commands::get_purchase_orders` | 獲取採購單 |
| `receive_purchase_order` | `commands::receive_purchase_order` | 收貨入庫 |
| `get_production_orders` | `commands::get_production_orders` | 獲取生產單 |
| `complete_production` | `commands::complete_production` | 完成生產 |
| `get_attribute_templates` | `commands::get_attribute_templates` | 獲取屬性模板 |
| `set_entity_attribute` | `commands::set_entity_attribute` | 設置屬性值 |
| `get_sales_report` | `commands::get_sales_report` | 銷售報表 |
| `get_margin_report` | `commands::get_margin_report` | 毛利報表 |
