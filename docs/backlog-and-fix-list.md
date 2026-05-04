# Cuckoo 待開發與修復清單 (Backlog & Fix List)

> **最後更新日期**: 2026-04-29
> **當前審計版本**: v1.2.2

## 🔴 P0 - 嚴重/數據安全 (High Priority)
- [ ] **配方刪除防呆補全**: 在 `onDeleteRecipe` 前調用 `get_recipe_usage_count`。若有引用，應攔截並提示具體引用數量。
- [ ] **遙測安全強化**: 
    - [ ] `report_telemetry` 命令增加 Webhook URL 白名單校驗，防止 SSRF。
    - [ ] 傳輸敏感數據（銷售額）前應進行加密或使用固定的雲端公鑰。
- [ ] **配方計算防死循環**: 在 Rust `calculate_recipe_cost` 中增加遞歸深度計數器（如 max 10），防止循環依賴導致 Stack Overflow。
- [ ] **打印預覽注入面收斂**:
    - [ ] `print-page.tsx` 的 `result.html_preview` 改為先 sanitize 再渲染。
    - [ ] `print-templates-page.tsx` 的 `previewHtml`（預覽 Dialog）改為 sanitize 渲染。
    - [ ] `printer.rs` 中 HTML 拼接字段（材料名/供應商/批次）輸出前做 escaping。
- [ ] **調試打印檔案寫入邊界**:
    - [ ] 禁止 `filename` 含路徑分隔符與 `..`。
    - [ ] 強制落地到受控 debug 目錄，不允許任意相對路徑寫檔。
    - [ ] 回傳路徑時只回傳受控目錄內路徑。
- [ ] **遙測出口控制**:
    - [ ] Rust `report_telemetry` 停止接受任意 `webhook_url`，改固定端點或白名單。
    - [ ] metadata 增加脫敏策略（堆疊、業務字段分級上報）。

## 🟡 P1 - 功能修復/體驗 (Medium Priority)
- [ ] **刪除語義對齊**: 修正 `recipes-page.tsx` UI 提示，明確區分「邏輯刪除（不啟用）」與「物理刪除（清空明細）」。
- [ ] **循環引用前端攔截**: 在 `add_recipe_item` 時檢查目標子配方是否已反向引用當前配方。
- [ ] **庫存搜索功能**: 為 Inventory 頁面補全搜索過濾器（對齊 Phase 5 需求）。
- [ ] **菜品可售狀態 API 語義對齊**:
    - [ ] 單項切換命令從「toggle」改為「顯式設定 is_available」。
    - [ ] 前後端參數命名統一（`is_available` vs `isAvailable`）並補回歸測試。
- [ ] **錯誤日誌治理**:
    - [ ] `appLogger` context 欄位做敏感字段遮罩（單號、電話、URL 等）。
    - [ ] 設定頁「複製報告」增加隱私提示與脫敏選項。

## 🔵 P2 - 優化/架構 (Low Priority)
- [ ] **Shadcn 元件替換**: 將 `recipes-page.tsx` 中的原生 `confirm()` 替換為 `AlertDialog`。
- [ ] **單位兼容性校驗**: 在配方編輯時，限制只能選擇與材料基準單位相同類型的單位（如重量類只能選 kg/g）。
- [ ] **CSP 收斂**:
    - [ ] 評估並移除非必要 `unsafe-eval`。
    - [ ] 逐步收斂 `unsafe-inline`，避免未來注入擴大化。

---
*本清單由 AI 審計代理根據代碼庫現狀自動生成。*
