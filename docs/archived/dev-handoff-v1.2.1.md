# Cuckoo v1.2.1 開發交付文檔 (Dev Handoff)

> **目標受眾**: 開發工程師 / 程式碼生成 Agent (如 opencode)  
> **當前版本**: v1.2.0 -> **目標版本**: v1.2.1  
> **核心目標**: 配方 UX 重構、系統級防呆、繁簡體本地化清洗、遠程遙測與更新系統接入

本文件匯整了 v1.2.1 階段的所有開發需求與架構設計，請嚴格按照以下規範與清單進行代碼實現。

---

## 🎯 任務一：配方 UX 重構 (Recipe UX Revamp)
**目標**: 將扁平的配方列表升級為「可展開樹狀表格」，並支援「行內編輯」，提升錄入效率，嚴格遵循 Shadcn UI 規範。

1. **樹狀展開視圖 (Nested Tree-Table)** ✅ 已完成:
   - 修改 `src/pages/recipes-page.tsx`。
   - 若 `recipe_items` 包含 `item_type === 'sub_recipe'`，在該行的最左側渲染一個展開箭頭（`ChevronRight` / `ChevronDown`）。
   - 點擊展開後，在該行正下方無縫渲染一個縮進的子表格，展示該子配方的 `recipe_items`。
2. **行內編輯 (Inline-editing) 與快捷新增** ✅ 已完成:
   - 完全移除原有的「新增明細 / 編輯」Dialog 彈窗（保留作為後備）。
   - 將配方明細的「用量」與「損耗率」直接替換為 `<Input>` 組件，失去焦點（`onBlur`）或按下 `Enter` 時觸發更新 API。
   - 在明細表格最底端固定渲染一行空白的輸入列（包含選擇材料的 Select 與數量的 Input），填寫後按 Enter 直接新增，清空後可繼續下一條。
3. **成本可視化條 (Cost Progress Bar)** ✅ 已完成:
   - 在成本計算區塊，使用自定義的 Progress Bar 組件，為每一項材料繪製成本佔比（如：豬肉佔 60% 畫紅條，香料佔 10% 畫綠條）。

---

## 🎯 任務二：全局防呆與本地化 (Fool-proofing & Localization)
**目標**: 攔截非工程人員的破壞性操作，統一介面語系為簡體中文。

1. **依賴關聯修改警告** ✅ 已有 ConfirmDialog:
   - 在 `useAppActions.ts` 中攔截：若修改的對象是「半成品子配方」，需先檢查是否有其他成品依賴它。若有，彈出 `ConfirmDialog`：「此修改將影響多個依賴此半成品的成本，確定嗎？」。
2. **高危刪除攔截** ✅ 已完成:
   - 所有刪除操作，都使用 ConfirmDialog 二次確認。
3. **一鍵清空購物車** ✅ 已完成:
   - `src/pages/pos-page.tsx` 購物車底部加入帶有垃圾桶 Icon 的 `<Button variant="destructive">清空购物车</Button>`，需二次確認。
4. **全局簡體化** ✅ 已完成:
   - 全局搜索並替換殘留的繁體字（如：`儲存`->`保存`, `載入失敗`->`加载失败`, `屬性模板`->`属性模板`，以及 Toast 提示中的繁體字）。

---

## 🎯 任務三：遠程遙測與更新系統 (Telemetry & OTA Updates)
**目標**: 讓遠程管理者（店主）能實時掌握本地門店的運行狀況（報錯、日誌），並能靜默推送版本更新，無需店員手動安裝。

### 3.1 架構設計
考慮到 Cuckoo 是一個 Tauri 桌面應用，遠程遙測與更新將分為三層：
1. **崩潰與報錯捕捉 (Error Tracking)**: 捕捉 Rust Panic 與 React Unhandled Exceptions。
2. **心跳與營運摘要 (Heartbeat & Telemetry)**: 定期將本地 SQLite 的營運摘要發送至雲端。
3. **OTA 靜默更新 (Tauri Updater)**: 透過 Tauri 內建 Updater 從遠程伺服器拉取新版二進制包。

### 3.2 具體實施步驟 (Tasks)

**A. 應用遙測與報錯 (Telemetry)**
- [ ] **前端全域 Error Boundary**: 在 `App.tsx` 最外層包裝 Error Boundary。當 React 崩潰時，攔截錯誤堆疊，並透過 Tauri Command 將錯誤日誌寫入本地，同時嘗試發送 HTTP POST 到遠端 API。
- [ ] **Rust 崩潰攔截 (Panic Hook)**: 在 `src-tauri/src/main.rs` 設定自定義 panic hook。當 Rust 後端崩潰時，將日誌寫入 `~/.cuckoo/logs/crash.log`，並在下次重啟時自動上報雲端。
- [ ] **自定義 Webhook 上報 (可選 Sentry 代替)**: 實作一個 Tauri Command `report_telemetry(payload)`，封裝 HTTP Client 發送心跳包（包含：機器 IP、當前版本號、當天訂單數、總營業額、打印機狀態）至配置的雲端 Webhook URL。

**B. Tauri 自動更新 (Auto-Updater)**
- [ ] **配置 tauri.conf.json**: 啟用 `updater` 模塊。
  ```json
  "updater": {
    "active": true,
    "endpoints": ["https://your-cloud-server.com/api/updates/{{target}}/{{current_version}}"],
    "dialog": false,
    "pubkey": "YOUR_UPDATER_PUBLIC_KEY"
  }
  ```
- [ ] **前端更新檢查 UI**: 
  - 引入 `@tauri-apps/plugin-updater`。
  - 在背景定時（如每 12 小時）或手動點擊「檢查更新」時觸發 `checkUpdate()`。
  - 由於強調「防呆」，建議發現更新後，自動在背景下載，並在用戶關班或重啟時靜默替換（安裝）。

### 3.3 遠端 API 需求 (雲端需準備的接口，非本地開發任務)
此部分作為遠端 Server 的對接規範：
1. `POST /api/telemetry/heartbeat`: 接收門店在線狀態與當日營業摘要。
2. `POST /api/telemetry/crash_report`: 接收崩潰與報錯日誌。
3. `GET /api/updates/:target/:version`: Tauri Updater 官方規範接口，返回 `{"url": "...", "version": "...", "notes": "...", "pub_date": "...", "signature": "..."}`。
