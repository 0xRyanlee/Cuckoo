# Cuckoo v0.8.0 開發計劃

**目標版本:** v0.8.0
**基礎版本:** v0.7.0（110 commands, 16 pages, ~82% 完成度）
**目標完成度:** ~90%

---

## Sprint 1：搜索全覆蓋（P1）

### 任務清單（8 個頁面添加 searchQuery 支持）

| # | 頁面 | 過濾字段 | 預估時間 |
|---|------|----------|----------|
| 1 | inventory-page | 材料名稱、批次號、交易類型 | 10 min |
| 2 | menu-page | 商品名稱、分類 | 10 min |
| 3 | pos-page | 商品名稱 | 10 min |
| 4 | suppliers-page | ✅ 已完成 | -- |
| 5 | material-states-page | 材料名稱、狀態代碼 | 10 min |
| 6 | purchase-orders-page | 單號、供應商 | 10 min |
| 7 | production-orders-page | 單號、配方名稱 | 10 min |
| 8 | stocktakes-page | 單號、操作人 | 10 min |

### App.tsx 接線
- 將 `searchQuery` prop 傳遞到上述 7 個頁面（suppliers 已完成）

---

## Sprint 2：Dashboard 圖表（P1）

### 任務清單
- [ ] 安裝 `recharts` 或輕量級圖表庫
- [ ] 銷售趨勢圖（折線圖）
- [ ] 庫存預警圖（柱狀圖）
- [ ] 分類銷售餅圖

---

## Sprint 3：加料/去料 UI（P1）

### 任務清單
- [ ] 訂單詳情頁添加 modifier 管理
- [ ] POS 下單時支持加料/去料選擇
- [ ] 材料選擇器 + 數量輸入 + 價格調整

---

## Sprint 4：功能補全（P2）

### 任務清單
- [ ] recipe_formulas API
- [ ] 打印自動觸發完善（收貨/生產完成）
- [ ] Attributes 頁面編輯功能
- [ ] 通知系統基礎框架

---

## 執行順序

1. **立即執行:** Sprint 1（搜索全覆蓋）— 最快見效
2. **其次:** Sprint 3（加料/去料 UI）— 完善核心流程
3. **然後:** Sprint 2（Dashboard 圖表）— 視覺提升
4. **最後:** Sprint 4（功能補全）— 收尾工作
