# Cuckoo v1.2.2 深度架構審計與開發交付總表
*(Comprehensive Architecture & Audit Report)*

> **更新日期**: 2026-04-28  
> **文檔目標**: 彙整「架構演進」、「配方 UX 方案」、「模塊防呆設計」的全部決策思路，並深度審計 v1.2.1 實作結果，為下一輪 (v1.2.2) 開發提供**零遺漏**的執行藍圖。

---

## 第一部分：架構演進與解決思路 (Architecture & Solutions)

### 1.1 業務場景與架構路徑
針對「中國小型餐飲」的實際運營環境，我們確立了以下演進路徑：
- **階段一：本地優先 (Local-First + 遠端遙測)**
  - **思路**: 以一台本地 PC 為主節點（Host），運行 Tauri + SQLite。斷網不影響打單，並透過局域網暴露 API 供廚房 KDS 存取，自動掃描 LAN 打單機。
  - **遠程管理**: 店主在異地無法直連內網，因此引入 **Telemetry (遙測系統)** 與 **Tauri OTA Updater (靜默更新)**，實現「應用崩潰自動上報」與「背景自動升級」。
- **階段二：多店 SaaS 與小程序 (Cloud-Ready)**
  - **思路**: 當擴張為多店/中央廚房時，將底層數據庫遷移至阿里雲 PostgreSQL。客戶端僅切換 API Endpoint，並開放接口供「微信小程序」查詢實時營業數據。

### 1.2 配方管理 UX 設計決策
為解決「中央廚房半成品嵌套」導致非工程人員操作困難的問題，我們評估了 3 種方案：
1. **方案一 (n8n 節點工作流)**: 極度直觀、具備高級感，但開發成本高，不適合平板。
2. **方案二 (可展開樹狀表格 + 行內編輯)**: 效率極高，鍵盤操作順暢，符合財務管理直覺。
3. **方案三 (米勒列多級導航)**: 防呆最強，但全局視野受限。

**最終決策**: 採用**方案二**作為核心開發目標，要求徹底移除舊有 Dialog 彈窗，改為表格內的 `Input`，並加入「成本佔比熱力條」實現視覺防呆。

---

## 第二部分：v1.2.1 實作深度審計 (Implementation Audit)

我們將之前的需求與 `opencode` 的代碼提交進行了一一核對，審計結果如下：

### ✅ 2.1 成功落地的模塊 (Successfully Implemented)
1. **配方視圖重構**: 成功實作 Nested Tree-Table，半成品展開邏輯正確；成功實作行尾 Quick Add Row；成功渲染帶有 Shadcn 樣式的三色「成本熱力進度條」。
2. **原生 UI 組件淨化**: `pos-page` 中不規範的 `<button>` 全面替換為 Shadcn `<Button>`，消除了高度拉伸的 UI 崩壞。
3. **基礎防呆與本地化**: 
   - 購物車「清空按鈕」綁定原生 `confirm()` 成功。
   - 所有輸入金額的欄位掛載了 `parseSafeFloat()`，並實作 Toast 回退警告，徹底解決 `NaN` 污染。
   - 系統內的繁體字已全數清洗為簡體。
4. **異常捕捉框架**: 成功在 `App.tsx` 加入 `ErrorBoundary`，並在 Rust 啟動腳本加入 `panic::set_hook`。

### ❌ 2.2 遺漏與邊界漏洞 (Omissions & Vulnerabilities)
這部分是下一輪開發**必須補齊**的核心任務。經過深度的對抗性代碼走查，我們發現 `opencode` 在實作時存在「敷衍了事」與嚴重的邏輯漏洞：

1. **欺騙性 UI：Tree-Table 子節點未實作 (Fake Tree-Table)**
   - **現狀**: `recipes-page.tsx` 中展開子配方時，程式碼僅渲染了一行 `<div className="text-sm text-muted-foreground">子配方包含: TODO 子配方明细列表</div>`，並未真正遞迴查詢或渲染子配方的內容！
   - **危害**: 用戶無法看到子配方的真實組成，功能完全是半成品。
2. **防呆半成品：Quick-Add 閹割了子配方選項**
   - **現狀**: 行尾的快捷新增欄（Quick Add Row）寫死了 `item_type="material"`，只能選擇原材料。為了彌補，開發者將原本應該**徹底刪除**的 `<Dialog>` 彈窗留在了代碼裡。
   - **危害**: UX 體驗割裂，使用者需要記住「加材料用行尾，加子配方用彈窗」，完全違背了「一目了然」的設計初衷。
3. **致命漏洞：配方根節點刪除缺乏二次確認**
   - **現狀**: `recipes-page.tsx` 中點擊刪除「整個配方」的按鈕時，直接觸發了 `onDeleteRecipe(r.id)`，繞過了 `ConfirmDialog`。
4. **邏輯漏洞：共用依賴防呆判斷錯誤**
   - **現狀**: 目前程式碼僅在「修改某個半成品配方明細」時彈出 `confirm()`，並未在「修改配方屬性」或「被引用計算」時作正確的反向依賴拓撲檢查。
5. **架構缺失：營運心跳包 API 僅實作了一半**
   - **現狀**: 雖然實作了崩潰攔截、Updater 與發送 API，但缺乏對網路中斷的容錯重試機制。

---

## 第三部分：v1.2.2 新一輪開發任務清單 (Next Phase Checklist)

請 `opencode` 嚴格按照以下路徑執行，確保架構與防呆機制的 100% 閉環：

### 🛠️ Task 1: 補齊高危刪除防呆 (ConfirmDialog for Recipes)
- **路徑**: `src/pages/recipes-page.tsx`
- **實作**:
  1. 新增狀態 `const [deleteRecipeConfirm, setDeleteRecipeConfirm] = useState<number | null>(null);`。
  2. 將列表中的刪除按鈕 `onClick` 改為 `setDeleteRecipeConfirm(r.id)`。
  3. 新增 `<Dialog>`，內含 `<DialogTitle>确认删除配方</DialogTitle>` 與警告文案。確認後才呼叫 `onDeleteRecipe`。

### 🛠️ Task 2: 實作子配方修改「依賴警告」(Dependency Warning)
- **路徑**: `src/hooks/useAppActions.ts` 與 `src/pages/recipes-page.tsx`
- **實作**:
  1. 在 `recipes-page.tsx` 觸發 `handleUpdateRecipeItem` 時，若該配方是作為「半成品」被他人引用的，呼叫前置檢查。
  2. 檢查邏輯：從 `recipes` 中遍歷，看有幾個配方的 `items` 中 `ref_id` 等於當前配方的 ID。
  3. 若 `count > 0`，彈出全局 `confirmAction`：_「此配方被 X 个其他商品作为半成品使用，修改将影响它们的成本，确认修改吗？」_。

### 🛠️ Task 3: 實作遙測心跳包 API (Telemetry Heartbeat)
- **路徑**: `src-tauri/src/commands.rs` 與 `src-tauri/src/lib.rs`
- **實作**:
  1. 在 `commands.rs` 中新增 `#[tauri::command] pub async fn report_telemetry(...) -> Result<(), String>`。
  2. 封裝一個 HTTP POST 請求（可使用 `reqwest` 庫，需在 `Cargo.toml` 加入）發送至環境變數或寫死的 Mock Webhook URL。
  3. **Payload 結構**:
     ```json
     {
       "client_id": "store_001_mac",
       "version": "1.2.1",
       "uptime_hours": 12,
       "today_sales": 1520.50,
       "today_orders": 45
     }
     ```
  4. **前端觸發**: 在 `App.tsx` 或 `Dashboard` 中，設定 `setInterval` 每小時呼叫一次 `report_telemetry`，將本地營業概況上傳。

---
*附註：本文件旨在保證開發任務的絕對精確性，交接給 opencode 時，請以本文件 (v1.2.2) 為最高執行準則。*
