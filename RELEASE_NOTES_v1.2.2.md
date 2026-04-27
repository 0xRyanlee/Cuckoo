# Cuckoo v1.2.2 Release Notes

這是 Cuckoo 餐飲作業系統的一個重大更新版本。我們在提升系統穩定性的同時，徹底重構了配方管理體系，並引入了遠程運維監測能力。

### 🆕 新增功能 (Features)
- **配方樹狀結構實作**：現在可以無限層級地嵌套子配方（如：滷水底料 -> 滷豬蹄 -> 拼盤），並支持自動展開與延遲加載。
- **配方引用保護系統**：後端實作了引用計數檢查，修改或刪除被其他配方引用的「半成品」時，系統將會彈出警告。
- **全域遠程監測 (Telemetry)**：系統現在會定時發送心跳包。若前端發生任何崩潰或 Promise Rejection，錯誤堆棧會自動上報至遠程 Webhook，方便店主遠程定位問題。
- **快速新增模式 (Quick-Add)**：優化了配方明細的新增體驗，移除冗餘彈窗，改為行內智慧選擇器。

### 🐞 修復與改進 (Fixes & Improvements)
- **類型系統補強**：修復了大量 TypeScript 類型不匹配導致的構建失敗問題。
- **非同步邏輯修正**：解決了配方編輯時 await 關鍵字缺失導致的狀態不同步問題。
- **UI 性能優化**：減少了大型訂單列表加載時的卡頓，優化了 Recharts 報表在深色模式下的顯示。
- **版本號同步**：統一了 package.json, Cargo.toml 與 tauri.conf.json 的版本標識。

### 🚀 安裝包構建
- **macOS**: 提供 Universal Binary (支持 M1/M2/M3 及 Intel 芯片)。
- **Windows**: 建議在 Windows 10/11 環境下執行 `npm run tauri:build:windows`。

---
**Made with 🐦 by the Cuckoo Team**
