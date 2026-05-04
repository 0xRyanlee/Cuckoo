# Cuckoo 信息流審計報告（只讀）
## 日期: 2026-04-30 | 範圍: Frontend + Tauri Commands + Printer + DB 邊界

> 本報告僅包含審計與風險記錄，不包含任何修復代碼。

---

## 1) 審計範圍與路徑

- 前端入口與錯誤流：`src/main.tsx`、`src/App.tsx`、`src/lib/logger.ts`、`src/components/error-boundary.tsx`
- 前端業務命令層：`src/hooks/useAppData.ts`、`src/hooks/useAppActions.ts`
- 高風險頁面：`src/pages/print-page.tsx`、`src/pages/print-templates-page.tsx`、`src/pages/pos-page.tsx`、`src/pages/settings-page.tsx`
- Rust 命令與對外傳輸：`src-tauri/src/commands.rs`
- Rust 打印與文件落地：`src-tauri/src/printer.rs`
- 應用安全配置：`src-tauri/tauri.conf.json`
- 資料庫層抽樣檢查：`src-tauri/src/database.rs`

---

## 2) 信息流總覽（現狀）

1. UI 行為由 `useAppActions` 觸發 `invoke(...)`
2. Tauri `commands.rs` 接收參數並路由到 `database.rs` / `printer.rs`
3. 前端錯誤由 `appLogger` 寫入 `localStorage`，設定頁可匯出
4. 全局 runtime error 會觸發 telemetry 上報
5. 打印調試命令會生成檔案並把 html 預覽字串回傳前端渲染

---

## 3) 風險發現（按嚴重度）

### P0-1: DOM 注入風險（未消毒的 HTML 直渲染）

- `src/pages/print-page.tsx` 直接渲染 `result.html_preview`
- `src/pages/print-templates-page.tsx` 的「打印预览」視圖直接渲染 `previewHtml`
- `src-tauri/src/printer.rs` 的調試預覽 HTML 由字串拼接，包含可控內容（如 `material_name`、`supplier_name`）

**影響**: 若輸入被注入惡意標記，可能在前端執行非預期 HTML/腳本載荷（取決於容器策略與 CSP）。

### P0-2: 遙測端點可由前端覆寫（資料外送風險）

- `report_telemetry(payload, webhook_url)` 接受可選 URL
- 前端 `handleReportTelemetry` 允許傳入 `webhookUrl`

**影響**: 若前端被濫用或誤配置，營運指標與錯誤 metadata 可送往非受控端點。

### P0-3: 調試打印檔案寫入存在路徑穿越面

- `save_escpos_to_file` / `save_batch_label_to_file` 直接使用 `filename` 組路徑
- 前端 `print-page` 提供自由輸入 filename

**影響**: 在桌面端可嘗試透過 `../` 寫入非預期位置（依實際執行權限而定）。

### P1-1: 命令語義漂移（單項切換 API 忽略前端期望值）

- 前端呼叫 `toggle_menu_item_availability({ id, isAvailable })`
- Rust 命令實作為「純 toggle」，僅接收 `id`，不使用期望狀態值

**影響**: 在高併發或重試場景中可能出現狀態反轉與 UI 期望不一致。

### P1-2: 錯誤與業務上下文長期落地 localStorage

- 錯誤記錄（含 operation/context）最多保留 60 條
- 設定頁可一鍵複製完整 JSON 報告

**影響**: 本機共享環境中存在資訊暴露面（單號、材料、行為軌跡等）。

### P2-1: 安全策略偏寬，放大注入後果

- CSP 含 `script-src 'unsafe-eval'`、`style-src 'unsafe-inline'`

**影響**: 一旦存在 HTML/腳本注入點，防護深度降低。

---

## 4) 已覆蓋審計清單（本輪）

- [x] 前端 invoke 主路徑與錯誤捕獲鏈路
- [x] Rust 命令入口、對外傳輸、打印與文件寫入
- [x] 高風險 `dangerouslySetInnerHTML` 使用點
- [x] localStorage 內錯誤資料持久化路徑
- [x] Tauri 安全配置（CSP）
- [x] DB 層 SQL 參數化抽樣（未見直接字串拼接 SQL 注入模式）

---

## 5) 建議修復方向（待確認後實作）

1. 前端所有 HTML 預覽統一做嚴格 sanitize（含 `print-page`、`print-templates-page` 的 preview dialog）
2. `report_telemetry` 端點固定化（或白名單）並在 Rust 側拒絕任意 URL
3. 調試打印文件寫入改為受控目錄 + filename 白名單（拒絕路徑分隔符）
4. 單項菜品上下架 API 改成「顯式設值」而非 toggle
5. 錯誤日誌分級脫敏，敏感欄位不落地，並增加到期清理策略
6. 收斂 CSP（至少去除非必要 `unsafe-eval`）

---

## 6) 審計結論

本輪信息流審計已覆蓋目前主要資料入口、IPC 命令層、對外傳輸與本地落地路徑。  
最優先處理項為：`HTML 注入面`、`telemetry 出口控制`、`調試文件寫入邊界`。
