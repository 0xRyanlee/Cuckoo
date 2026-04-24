# 📋 Cuckoo TODOs — 開發任務清單

> **Last Updated**: 2026-04-24 | **Version**: v1.0.0

---

## 🔴 High Priority / 高優先級

### Bug Fixes / 錯誤修復

- [ ] **清理 Rust 編譯警告** — ~10+ unused variables in `commands.rs` and `database.rs`
- [ ] **訂單完成時實扣庫存** — `finish_ticket` 應觸發實際庫存扣減（目前僅預扣）
- [ ] **打印指令調試** — ESC/POS 指令需實機測試驗證
- [ ] **成本計算返回值類型** — `calculate_recipe_cost` 返回 `f64` 而非完整 `RecipeCostResult`

### Release Prep / 發佈準備

- [ ] **選擇並應用新 Logo** — 從 `logo-option-{a,b,c,d}.svg` 中選擇，替換 `icon.svg` 並重新生成所有圖標
- [ ] **代碼簽名 (macOS)** — 配置 Apple Developer 證書 (`signingIdentity`)
- [ ] **代碼簽名 (Windows)** — 配置 EV 證書 (`certificateThumbprint`)
- [ ] **測試構建產物** — 在乾淨環境測試 `.dmg` 和 `.msi` 安裝
- [ ] **更新版本號** — `package.json`, `Cargo.toml`, `tauri.conf.json` 保持一致

---

## 🟡 Medium Priority / 中優先級

### Features / 功能完善

- [ ] **採購入庫 UI 優化** — 完善採購單→入庫→批次生成的用戶體驗
- [ ] **半成品管理 UI** — 生產單投料/產出流程界面優化
- [ ] **訂單修改器 (Modifiers)** — POS 中加料/去料功能完善
- [ ] **庫存預警閾值** — 可配置的最低庫存提醒
- [ ] **數據導出** — CSV/JSON 導出報表和庫存數據
- [ ] **打印模板預覽** — 實時預覽打印效果

### Performance / 性能

- [ ] **前端 Bundle 優化** — 當前 >500KB，需代碼分割
- [ ] **數據庫索引優化** — 為常用查詢添加索引
- [ ] **大數據量分頁** — 訂單、庫存流水等列表分頁加載
- [ ] **KDS 自動刷新** — WebSocket 或輪詢優化

### UX / 用戶體驗

- [ ] **暗色主題切換** — UI 主題支持
- [ ] **鍵盤快捷鍵** — POS 快速操作、全局快捷鍵
- [ ] **離線狀態提示** — 數據庫連接狀態可視化
- [ ] **操作撤銷** — 刪除操作後可撤銷 (Undo)
- [ ] **批量操作** — 批量導入原材料、批量更新價格

---

## 🟢 Low Priority / 低優先級

### Future Features / 未來功能

- [ ] **微信小程序接入** — 扫码點單入口
- [ ] **多店鋪支持** — 門店數據隔離與切換
- [ ] **會員管理** — 顧客資料、積分、餘額
- [ ] **優惠券系統** — 優惠活動管理 (表結構已預留)
- [ ] **數據備份** — 自動備份 + 手動導出
- [ ] **雲端同步** — 多設備數據同步
- [ ] **多語言** — 中英文界面切換
- [ ] **員工權限** — 角色權限管理
- [ ] **營業日報** — 每日自動生成報表
- [ ] **供應商評分** — 採購質量追蹤

### DevEx / 開發體驗

- [ ] **CI/CD Pipeline** — GitHub Actions 自動構建
- [ ] **E2E 測試** — Playwright 端到端測試
- [ ] **API 文檔** — 自動生成 Tauri Command 文檔
- [ ] **Storybook** — UI 組件文檔
- [ ] **Husky + lint-staged** — 提交前代碼檢查

---

## 📊 Code Quality / 代碼質量

### Technical Debt / 技術債務

| Issue | Location | Impact |
|-------|----------|--------|
| Unused variables | `commands.rs`, `database.rs` | Compiler warnings |
| Hardcoded strings | `App.tsx` handlers | Maintainability |
| No error boundaries | React components | Crash handling |
| No loading states | Some pages | UX |
| Magic numbers | `database.rs` SQL | Readability |

### Refactoring / 重構建議

- [ ] **拆分 `App.tsx`** — 624 行過長，應按模塊拆分 state/handlers
- [ ] **提取自定義 Hooks** — `useMaterials`, `useRecipes`, `useOrders` 等
- [ ] **統一錯誤處理** — 創建 `Result<T, AppError>` 類型
- [ ] **類型共享** — 前後端類型定義統一 (可能用 `ts-rs`)
- [ ] **數據庫遷移** — 使用 `refinery` 或 `sqlx` 管理 schema 版本

---

## 🎨 Design / 設計

### Icon Selection / 圖標選擇

待選擇新 Logo（布穀鳥 負形 簡約風格）：

- [ ] `logo-option-a.svg` — 簡約鳥形剪影
- [ ] `logo-option-b.svg` — 負形圓形設計
- [ ] `logo-option-c.svg` — 幾何抽象風格
- [ ] `logo-option-d.svg` — 線條藝術風格

選擇後執行：
```bash
# 替換 icon.svg 並重新生成所有圖標
cp src-tauri/icons/logo-option-X.svg src-tauri/icons/icon.svg
npm run icons:generate
```

### Screenshots / 截圖

- [ ] 更新 `assets/screenshots/` 為應用實際截圖
- [ ] 添加截圖到 README 展示

---

## 📝 Documentation / 文檔

- [ ] **CHANGELOG.md** — 版本更新日誌
- [ ] **CONTRIBUTING.md** — 貢獻指南
- [ ] **SECURITY.md** — 安全策略
- [ ] **API Reference** — 完整 92+ Command 文檔
- [ ] **Deployment Guide** — 部署指南
- [ ] **User Manual** — 用戶手冊（中文）

---

## ✅ Completed / 已完成

- [x] 原材料管理 CRUD
- [x] 配方系統 + 成本計算
- [x] 訂單流程 (創建→提交→預扣→KDS)
- [x] POS 點單界面
- [x] KDS 廚顯看板
- [x] 庫存管理 (批次 + FIFO)
- [x] 採購訂單
- [x] 生產訂單
- [x] 盤點管理
- [x] 打印引擎 (ESC/POS + 飛鵝)
- [x] 報表分析
- [x] 通知預警系統
- [x] 項目文檔整理
- [x] Git 倉庫初始化
- [x] 中英雙語 README

---

<div align="center">

**Total Items**: ~60 | **Completed**: 17 | **In Progress**: 6 | **Backlog**: 37

[⬆ Back to Top](#-cuckoo-todos--開發任務清單)

</div>
