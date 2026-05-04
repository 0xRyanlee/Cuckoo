# Cuckoo 對抗性全局審計報告 v5.0 (UI/UX 與業務流程專項)

> **審計日期**: 2026-04-28  
> **重點範圍**: 業務流程一致性、UI/UX 體驗、Shadcn 組件規範  
> **審計方法**: 靜態代碼掃描 + 模式匹配分析

---

## ⚠️ 執行摘要

本次審計聚焦於系統的「視覺規範」與「業務流程狀態管理」。我們發現系統中仍殘留多處原生 HTML 交互組件，未全面使用 Shadcn UI，導致視覺不統一。同時，部分業務頁面繞過統一的 Hooks 層直接調用 `invoke`，可能導致前端狀態與後端數據脫節。

---

## 一、UI/UX 與組件一致性缺陷 (Shadcn 規範)

在審計中發現多處未遵循 Shadcn UI 規範，直接使用原生 HTML 標籤（`<button>`, `<input>`）的問題，這會導致 Focus 狀態、Hover 動效、禁用狀態與全局主題（如暗黑模式）不一致。

### 🔴 1.1 原生 `<button>` 殘留
以下位置使用了原生 `<button>`，應替換為 Shadcn 的 `<Button>` 組件：

1. **`src/pages/pos-page.tsx:561`**
   - **代碼**: `<button onClick={() => removeModifier(currentCartItemIndex, idx)} className="ml-1 hover:text-destructive">`
   - **問題**: 刪除規格按鈕缺乏統一的 IconButton 樣式。
   - **修復**: 改用 `<Button variant="ghost" size="icon" className="h-6 w-6">` 搭配 Lucide 圖標。

2. **`src/pages/reports-page.tsx:96`** & **`print-settings-page.tsx:223`**
   - **代碼**: `<button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">关闭</button>`
   - **問題**: 錯誤提示框內的關閉操作不規範。
   - **修復**: 應使用 `Alert` 組件或帶 `variant="link"` 的 Shadcn Button。

3. **`src/pages/attributes-page.tsx:32`**
   - **代碼**: `<button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border...">`
   - **問題**: 自定義的圓形按鈕，覆蓋了大量 Tailwind 類。
   - **修復**: 改用 `<Button variant="outline" size="icon" className="h-7 w-7 rounded-full">`。

### 🔴 1.2 原生 `<input>` 殘留
1. **`src/pages/purchase-orders-page.tsx:290`**
   - **代碼**: `<input ...>` 
   - **問題**: 採購單頁面內存在原生輸入框，邊框、聚焦（Ring）效果與其他 Shadcn `<Input>` 不一致。
   - **修復**: 引入並替換為 `import { Input } from "@/components/ui/input"`。

---

## 二、業務流程與狀態管理隱患

### 🟠 2.1 繞過 Hooks 直接調用 Tauri `invoke`
系統目前的架構方向是統一通過 `useAppActions` 與 `useAppData` 管理狀態，但審計發現多個頁面仍存在「組件內直接調用 `invoke`」的行為，破壞了單向數據流與局部刷新機制。

**波及文件**:
- `print-templates-page.tsx`
- `print-settings-page.tsx`
- `reports-page.tsx`
- `inventory-page.tsx`
- `orders-page.tsx`

**風險**: 
頁面各自為戰發起請求，如果訂單在 `orders-page` 中被更新，`App.tsx` 頂層持有的全局狀態可能沒有同步被更新，導致切換回 Dashboard 時看到舊數據。
**建議**: 
所有與業務實體（Inventory, Orders）相關的寫操作，必須收斂到 `useAppActions` 內部。

### 🟠 2.2 數值輸入與浮點數精度靜默吞噬 (Silent Failure)
在 `purchase-orders-page.tsx`、`stocktakes-page.tsx`、`production-orders-page.tsx` 等涉及實體數量與成本的地方，頻繁出現以下模式：
```typescript
cost_per_unit: parseFloat(addItemCost) || 0,
```
**業務風險**:
如果用戶在採購成本中不小心輸入非數字（例如 `10.5元`），`parseFloat` 失敗返回 `NaN`，系統會自動 fallback 到 `0` 並靜默提交到數據庫。這會導致成本核算出現 0 元進貨的嚴重財務失真，且 UI 上沒有任何表單驗證報錯。
**修復建議**:
使用 `Zod` 或手動驗證，遇到 `NaN` 應阻斷提交流程並通過 `sonner` / `toast` 提示用戶，絕不能妥協為 `0`。

### 🟡 2.3 模板渲染的 XSS 風險
**位置**: `print-templates-page.tsx:420, 442`
**代碼**: `<div dangerouslySetInnerHTML={{ __html: previewHtml }} />`
**問題**: 雖然在桌面端 Tauri 環境中風險較 Web 低，但如果模板名稱、打印備註中包含惡意腳本，仍會被 WebView 執行。
**修復**: 使用 `DOMPurify` 處理 `previewHtml` 後再渲染。

---

## 三、修復行動計畫 (Action Items)

### 📌 UI/UX 一致性修復 (MVP: 1h)
1. 全局搜索 `<button` 並替換為 Shadcn `<Button>`，確保引入 `variant`。
2. 替換 `purchase-orders-page.tsx` 的 `<input>` 為 Shadcn `<Input>`。
3. 統一所有表單的 focus-visible 樣式為 Shadcn 的默認 `ring-ring`。

### 📌 業務安全修復 (MVP: 2h)
1. 封裝一個 `parseSafeFloat(val: string): number | null` 函數。
2. 在採購、盤點、生產表單提交前，若返回 `null` 則攔截並彈出 `toast.error("格式錯誤")`。
3. 將 `inventory-page` 和 `orders-page` 內的直接 `invoke` 遷移到 `useAppActions` 統一管理。
