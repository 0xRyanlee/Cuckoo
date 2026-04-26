# Cuckoo 餐飲系統 - 開發計劃 v0.5.0

> 更新日期：2026-04-23
> 當前版本：v0.5.0（菜單更新 + 打印模塊啟動）
> 技術棧：React 18 + TypeScript + Tauri 2 (Rust) + SQLite + shadcn/ui

---

## 一、當前狀態總覽

### 已完成模組（v0.1.0 → v0.5.0）

| 模組 | 狀態 | 後端 API | 前端 UI | 數據庫 | 備註 |
|------|------|----------|---------|--------|------|
| 基礎資料 | ✅ 完成 | 16 命令 | 完整 CRUD | 23 材料 + 9 標籤 + 4 分類 | 含標籤綁定 |
| 配方系統 | ✅ 完成 | 8 命令 | 列表/詳情/成本 | 22 配方 + 44 明細 | 麻辣系列菜單 |
| 庫存系統 | ✅ 完成 | 8 命令 | 批次/調整/損耗/流水 | 23 批次 + 23 流水 | FIFO/FEFO 引擎 |
| 菜單管理 | ✅ 完成 | 12 命令 | 完整 CRUD + 編輯/刪除 | 22 商品 + 4 分類 | 含配方綁定 |
| POS 點餐 | ✅ 完成 | 6 命令 | 商品網格/購物車/規格/備註 | 訂單創建/提交 | 一鍵提交 |
| 訂單管理 | ✅ 完成 | 6 命令 | 列表/詳情/提交/取消 | 訂單 + 明細 | 含預扣邏輯 |
| KDS 廚顯 | ✅ 完成 | 6 命令 | 小票卡片/開始/完成 | 4 工作站 | 含菜品明細 |
| 供應商 | ✅ 完成 | 4 命令 | 列表/創建 | 表已建 | 編輯/刪除 API 已有 |
| 屬性系統 | ✅ 完成 | 3 命令 | 只讀列表 | 18 模板 | 實體屬性 API 已有 |
| 儀表板 | ✅ 完成 | -- | 統計/訂單/庫存預警 | -- | 4 張統計卡 |

### 進行中

| 模組 | 進度 | 下一步 |
|------|------|--------|
| 打印系統 | 0% → 啟動中 | 飛鵝 SDK 整合 + 設置頁 UI |
| 設置頁擴展 | 0% → 啟動中 | 打印機掃描/綁定/測試 |

### 待開發（按優先級排序）

| 優先級 | 模組 | 預估工作量 | 依賴 |
|--------|------|------------|------|
| P0 | 打印模塊（飛鵝 + 局域網） | 3-4 天 | 無 |
| P0 | 設置頁擴展（打印機管理） | 2 天 | 打印模塊 |
| P1 | POS 打印觸發（下單自動出票） | 1 天 | 打印模塊 |
| P1 | 入庫打印觸發（批次標籤） | 1 天 | 打印模塊 |
| P1 | 配方編輯 UI（添加/刪除材料項） | 2 天 | 無 |
| P2 | 材料創建 UI（分類/標籤選擇） | 1 天 | select.tsx 組件 |
| P2 | 供應商編輯 UI | 1 天 | 無 |
| P2 | 商品規格管理 UI | 2 天 | 無 |
| P3 | 採購單 CRUD + 收貨入庫 | 4-5 天 | 無 |
| P3 | 生產單 CRUD + 執行 | 4-5 天 | 採購系統 |
| P3 | 盤點系統 | 3 天 | 庫存系統 |
| P4 | 報表系統（銷售/毛利/消耗/熱銷） | 5-7 天 | 訂單 + 庫存數據 |
| P4 | 搜索功能（Header 搜索） | 1 天 | 無 |
| P4 | 通知系統 | 2 天 | 無 |

---

## 二、打印模塊詳細設計

### 2.1 架構

```
┌─────────────────────────────────────────────────┐
│                   前端 (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ 設置頁    │  │ POS 頁    │  │ 庫存頁         │  │
│  │ 打印機管理│  │ 下單打印  │  │ 入庫打印       │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │            │
│       └──────────────┼───────────────┘            │
│                      ▼                            │
│              Tauri Invoke API                     │
└──────────────────────┬────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│                 後端 (Rust)                      │
│  ┌───────────────────────────────────────────┐  │
│  │              printer.rs                    │  │
│  │  ┌────────────┐  ┌─────────────────────┐  │  │
│  │  │ 飛鵝雲 API   │  │ 局域網 TCP 打印      │  │  │
│  │  │ - 添加打印機 │  │ - ESC/POS (熱敏)     │  │  │
│  │  │ - 發送任務   │  │ - TSPL (標籤)        │  │  │
│  │  │ - 查詢狀態   │  │ - UDP 掃描發現       │  │  │
│  │  └────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                       │                          │
│  ┌────────────────────┴───────────────────────┐  │
│  │              database.rs                    │  │
│  │  print_tasks 表（打印任務隊列）               │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 2.2 飛鵝雲打印 API

| API | 端點 | 說明 |
|-----|------|------|
| 簽名 | `SHA1(user + UKEY + stime)` | 10 位 UNIX 時間戳 |
| 添加打印機 | `Open_printerAddlist` | SN + KEY 添加到開發者帳戶 |
| 打印任務 | `Open_printMsg` | 發送 ESC/POS 指令 |
| 查詢狀態 | `Open_queryPrinterStatus` | 在線/離線/缺紙 |

### 2.3 ESC/POS 指令集（熱敏小票 58mm/80mm）

| 指令 | 說明 |
|------|------|
| `<ESC>@` | 初始化 |
| `<ESC>a0/1/2` | 左/中/右對齊 |
| `<ESC>E` | 加粗 |
| `<ESC>d<n>` | 走紙 n 行 |
| `<GS>V` | 切紙 |

### 2.4 TSPL 指令集（標籤打印）

| 指令 | 說明 |
|------|------|
| `SIZE w,h` | 標籤尺寸 |
| `CLS` | 清除緩衝區 |
| `TEXT x,y,font,rotation,xmul,ymul,"text"` | 打印文字 |
| `BARCODE x,y,type,height,readable,rotation,xmul,ymul,"code"` | 條碼 |
| `PRINT n` | 打印 n 份 |

### 2.5 打印任務類型

| 類型 | 觸發時機 | 打印機類型 | 指令集 |
|------|----------|------------|--------|
| `kitchen_ticket` | POS 下單提交 | 熱敏小票機 | ESC/POS |
| `batch_label` | 進貨入庫 | 標籤機 | TSPL |
| `production_label` | 半成品生產完成 | 標籤機 | TSPL |

### 2.6 Tauri 命令設計

| 命令 | 參數 | 返回值 | 說明 |
|------|------|--------|------|
| `add_feie_printer` | user, ukey, sn, key, name | Printer | 添加飛鵝打印機 |
| `remove_printer` | printer_id | () | 移除打印機 |
| `get_printers` | -- | Vec<Printer> | 獲取所有打印機 |
| `scan_lan_printers` | timeout_ms | Vec<LanPrinter> | 局域網掃描 |
| `send_print_task` | printer_id, content, task_type | String | 發送打印任務 |
| `test_printer` | printer_id | String | 打印測試頁 |
| `query_printer_status` | printer_id | PrinterStatus | 查詢狀態 |
| `get_print_tasks` | limit | Vec<PrintTask> | 獲取打印任務歷史 |

### 2.7 數據庫擴展（print_tasks 表已存在）

```sql
CREATE TABLE IF NOT EXISTS printer_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    printer_type TEXT NOT NULL DEFAULT 'thermal',  -- thermal / label
    connection_type TEXT NOT NULL DEFAULT 'feie',  -- feie / lan
    feie_user TEXT,
    feie_ukey TEXT,
    feie_sn TEXT,
    feie_key TEXT,
    lan_ip TEXT,
    lan_port INTEGER DEFAULT 9100,
    paper_width TEXT DEFAULT '80mm',  -- 58mm / 80mm / custom
    is_default INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 三、接下來開發項目清單

### Sprint 1：打印模塊核心（v0.5.1）

- [ ] `printer.rs` - 飛鵝雲 API 客戶端
- [ ] `printer.rs` - 局域網 TCP 打印（ESC/POS）
- [ ] `printer.rs` - 局域網 UDP/TCP 掃描
- [ ] `database.rs` - printer_configs 表 + CRUD
- [ ] `commands.rs` - 8 個打印命令
- [ ] `lib.rs` - 註冊打印命令
- [ ] `Cargo.toml` - 添加 reqwest + sha1
- [ ] `settings-page.tsx` - 打印機管理 UI
- [ ] `select.tsx` - shadcn Select 組件

### Sprint 2：打印觸發集成（v0.5.2）

- [ ] POS 提交 → 自動創建 kitchen_ticket 打印任務
- [ ] 庫存入庫 → 自動創建 batch_label 打印任務
- [ ] KDS 完成 → 可選打印出餐標籤
- [ ] 打印任務隊列處理（異步）

### Sprint 3：UI 完善（v0.6.0）

- [ ] 配方編輯 UI（添加/刪除材料項、拖拽排序）
- [ ] 材料創建 UI（分類下拉、標籤多選）
- [ ] 供應商編輯 UI
- [ ] 商品規格管理 UI（CRUD）
- [ ] Header 搜索功能
- [ ] 通知系統

### Sprint 4：採購與生產（v0.7.0）

- [ ] 採購單 CRUD
- [ ] 採購收貨 → 自動入庫
- [ ] 生產單 CRUD
- [ ] 生產執行 → 扣原料 + 產半成品
- [ ] 盤點系統

### Sprint 5：報表系統（v0.8.0）

- [ ] 銷售報表（日/週/月）
- [ ] 毛利報表（菜品維度）
- [ ] 原料消耗報表
- [ ] 熱銷商品排行
- [ ] 庫存預警報表

---

## 四、需要新建的文件清單

| 文件 | 說明 | 優先級 |
|------|------|--------|
| `src-tauri/src/printer.rs` | 打印模塊核心 | P0 |
| `src/components/ui/select.tsx` | shadcn Select 組件 | P0 |
| `src-tauri/src/printer_commands.rs` | 打印命令（可選，或合併到 commands.rs） | P0 |
| `docs/printer-design.md` | 打印模塊設計文檔 | P1 |
| `docs/changelog.md` | 版本變更日誌 | P1 |

---

## 五、需要修改的文件清單

| 文件 | 修改內容 |
|------|----------|
| `src-tauri/Cargo.toml` | 添加 reqwest, sha1, tokio |
| `src-tauri/src/database.rs` | 添加 printer_configs 表 + CRUD |
| `src-tauri/src/commands.rs` | 添加 8 個打印命令 |
| `src-tauri/src/lib.rs` | 註冊打印命令 + mod printer |
| `src/pages/settings-page.tsx` | 重寫為打印機管理頁 |
| `src/pages/pos-page.tsx` | 添加打印回調 |
| `src/pages/inventory-page.tsx` | 添加打印回調 |
| `src/App.tsx` | 添加打印相關 handler |
| `docs/progress/README.md` | 更新進度 |

---

## 六、技術決策記錄

| 決策 | 選擇 | 原因 |
|------|------|------|
| HTTP 客戶端 | reqwest | Rust 生態最成熟 |
| 簽名算法 | sha1 crate | 飛鵝 API 要求 |
| 局域網掃描 | std::net::TcpStream | 簡單可靠，無需額外依賴 |
| 異步處理 | tokio | Tauri 2 內置支持 |
| 打印任務隊列 | database.rs print_tasks 表 | 持久化，斷電不丟失 |
| 打印機配置 | 新增 printer_configs 表 | 支持多打印機、多類型 |
