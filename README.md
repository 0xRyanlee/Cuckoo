# Cuckoo — 配方驅動餐飲作業系統

> **Recipe-Driven Restaurant Operations System** — Local-first, offline-capable, desktop app built with Tauri 2.0

<div align="center">

[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-2021-CE422B?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.2.2-blue?style=for-the-badge)](https://github.com/your-org/cuckoo/releases)

**[English](#english) · [中文](#中文)**

</div>

---

## Table of Contents / 目錄

- [Features / 功能亮點](#features--功能亮點)
- [Architecture / 架構](#architecture--架構)
- [Docs Index / 文檔索引](#docs-index--文檔索引)
- [Core Workflow / 核心流程](#core-workflow--核心流程)
- [Tech Stack / 技術棧](#tech-stack--技術棧)
- [Quick Start / 快速開始](#quick-start--快速開始)
- [Project Structure / 項目結構](#project-structure--項目結構)
- [Testing / 測試](#testing--測試)
- [Build & Release / 構建與發佈](#build--release--構建與發佈)
- [Database Schema / 數據庫結構](#database-schema--數據庫結構)
- [API Overview / API 概覽](#api-overview--api-概覽)
- [Roadmap / 開發路線](#roadmap--開發路線)
- [Contributing / 貢獻](#contributing--貢獻)
- [License / 許可](#license--許可)

---

## Features / 功能亮點

| English | 中文 |
|---------|------|
| **Recipe-Driven Inventory** — Auto-deduct ingredients via BOM recipes | **配方驅動庫存** — 通過 BOM 配方自動扣料 |
| **Batch Tracking** — FIFO/FEFO with expiry management | **批次追蹤** — FIFO/FEFO 效期管理 |
| **Semi-finished Products** — Production orders with yield tracking | **半成品管理** — 生產單與產出追蹤 |
| **POS System** — Cart, specs, modifiers, order submission | **POS 點單** — 購物車、規格、加料、提交 |
| **Kitchen Display (KDS)** — Station-based ticket workflow | **廚房顯示 (KDS)** — 工作站工單流程 |
| **Real-time Analytics** — Sales, gross profit, and consumption | **實時報表** — 銷售、毛利、消耗分析 |
| **Dependency Guard** — Prevent deletion of recipes in use (v1.2.2) | **引用保護** — 防止刪除/修改使用中的配方 (v1.2.2) |
| **Remote Telemetry** — Heartbeat & Error tracking for owners (v1.2.2) | **遠程監測** — 支持心跳與報錯遠程追蹤 (v1.2.2) |

---

## Architecture / 架構

```mermaid
graph TB
    subgraph Desktop["Cuckoo Desktop App"]
        subgraph Frontend["Frontend (React + TypeScript)"]
            UI[UI Components<br/>shadcn/ui + Tailwind]
            Pages[17 Pages<br/>Dashboard, POS, KDS...]
            State[State Management<br/>React Hooks]
        end
        
        subgraph Backend["Backend (Rust + Tauri 2)"]
            Commands[92+ Tauri Commands]
            DB[(SQLite<br/>18 Tables)]
            Printer[Print Engine<br/>ESC/POS + Feie]
        end
        
        UI --> Pages
        Pages --> State
        State -->|"invoke()"| Commands
        Commands --> DB
        Commands --> Printer
        Commands --> Telemetry[Telemetry & OTA Updater]
    end
    
    subgraph External["External"]
        Feie[Feie Cloud Printer]
        LAN[LAN Printers]
        Cloud[Cloud Server / Webhook]
    end
    
    Printer -->|HTTP| Feie
    Printer -->|TCP| LAN
    Telemetry -->|HTTPS| Cloud
    
    style Desktop fill:#0f172a,color:#fff
    style Frontend fill:#1e293b,color:#fff
    style Backend fill:#1e293b,color:#fff
    style External fill:#334155,color:#fff
```

> **Arch Evolution Strategy (v1.2.1+)**: Cuckoo operates as a robust **Local-First** application (unaffected by internet outages). It includes a built-in Telemetry/Heartbeat system and Tauri Auto-Updater to allow remote owners to track operations and push silent updates. Future versions (v2.0) will introduce an optional Cloud SaaS sync.

---

## Docs Index / 文檔索引

| 文档 | 说明 | 更新日期 |
|------|------|----------|
| [docs/backlog-and-fix-list.md](docs/backlog-and-fix-list.md) | 待开发与修复清单 (P0/P1/P2) | 2026-04-30 |
| [docs/test-plan-atomic-v1.2.2.md](docs/test-plan-atomic-v1.2.2.md) | 原子性功能测试方案 | 2026-04-30 |
| [docs/test-plan-user-journey-v1.2.2.md](docs/test-plan-user-journey-v1.2.2.md) | 用户旅程测试方案 | 2026-04-30 |
| [docs/api-design.md](docs/api-design.md) | API 设计文档 | - |
| [docs/comprehensive-audit-report-v1.2.2.md](docs/comprehensive-audit-report-v1.2.2.md) | v1.2.2 审计报告 | 2026-04-29 |

---

## Core Workflow / 核心流程

### Inventory Flow / 庫存流程

```mermaid
flowchart LR
    A[Purchase Order<br/>採購單] --> B[Receive<br/>入庫]
    B --> C[Generate Batch<br/>生成批次]
    C --> D[Inventory<br/>庫存]
    D --> E[Reserve<br/>預扣]
    E --> F[Deduct<br/>實扣]
    F --> G[Report<br/>報表]
    
    style A fill:#0f172a,color:#fff
    style B fill:#1e40af,color:#fff
    style C fill:#7c3aed,color:#fff
    style D fill:#059669,color:#fff
    style E fill:#d97706,color:#fff
    style F fill:#dc2626,color:#fff
    style G fill:#4f46e5,color:#fff
```

### Order-to-Kitchen Flow / 訂單到廚房流程

```mermaid
sequenceDiagram
    participant POS as POS
    participant API as Rust API
    participant DB as SQLite
    participant KDS as KDS
    participant Printer as Printer

    POS->>API: create_order()
    API->>DB: INSERT orders
    API-->>POS: order_no
    
    POS->>API: add_order_item()
    API->>DB: INSERT order_items
    
    POS->>API: submit_order()
    API->>DB: Reserve inventory (FIFO)
    API->>DB: Create kitchen tickets
    API->>Printer: Print kitchen ticket
    API-->>POS: OK
    
    KDS->>API: get_all_tickets()
    API-->>KDS: pending tickets
    KDS->>API: start_ticket()
    KDS->>API: finish_ticket()
    API->>DB: Deduct inventory
```

---

## Tech Stack / 技術棧

| Layer / 層 | Technology / 技術 | Version / 版本 |
|------------|-------------------|----------------|
| **Desktop Framework** | Tauri | 2.0 |
| **Frontend** | React | 18.3 |
| **Language** | TypeScript | 5.6 |
| **Styling** | Tailwind CSS + shadcn/ui | 4.2 |
| **Icons** | Lucide React | 1.8 |
| **Charts** | Recharts | 3.8 |
| **Routing** | React Router | 7.1 |
| **Backend** | Rust | 2021 Edition |
| **Database** | SQLite (rusqlite) | 0.32 |
| **Build** | Vite | 6.0 |
| **Testing** | Vitest + React Testing Library | 4.1 |

---

## Quick Start / 快速開始

### Prerequisites / 前置要求

- **Node.js** >= 18
- **Rust** >= 1.70 ([rustup](https://rustup.rs/))
- **Platform dependencies**: See [Tauri docs](https://tauri.app/start/prerequisites/)

### Development / 開發

```bash
# Clone repository
git clone https://github.com/your-org/cuckoo.git
cd cuckoo

# Install dependencies
npm install

# Start dev mode (Tauri + Vite HMR)
npm run tauri dev

# Or frontend only
npm run dev
```

---

## Testing / 測試

### Test Plans / 測試方案

本项目提供两套互补的测试方案：

| 文档 | 用途 | 覆盖范围 |
|------|------|----------|
| [docs/test-plan-atomic-v1.2.2.md](docs/test-plan-atomic-v1.2.2.md) | **原子性测试** - 功能点验证 | P0 核心安全、功能修复 |
| [docs/test-plan-user-journey-v1.2.2.md](docs/test-plan-user-journey-v1.2.2.md) | **用户旅程测试** - 角色操作验证 | 6 种角色、34 个完整场景 |

#### 原子性测试 (Atomic Tests)

针对已修复的 bug 和安全功能：

- **配方删除防呆**: T-001, T-002 — 删除前检查引用
- **成本计算递归保护**: T-003~T-006 — 深度计数、循环检测
- **遥测白名单**: T-007~T-009 — URL 校验
- **调试打印安全**: T-010~T-013 — 文件名过滤
- **循环引用拦截**: T-014~T-015 — 前端检测

详细见 [`docs/test-plan-atomic-v1.2.2.md`](docs/test-plan-atomic-v1.2.2.md)

#### 用户旅程测试 (User Journey Tests)

按角色划分的端到端测试：

| 角色 | 简称 | 测试用例 |
|------|------|----------|
| 店长 | UC-O | UC-O-001 ~ UC-O-008 |
| 收银员 | UC-C | UC-C-001 ~ UC-C-006 |
| 后厨 | UC-K | UC-K-001 ~ UC-K-005 |
| 仓管 | UC-S | UC-S-001 ~ UC-S-006 |
| 采购 | UC-B | UC-B-001 ~ UC-B-004 |
| 维护 | UC-A | UC-A-001 ~ UC-A-004 |

详细见 [`docs/test-plan-user-journey-v1.2.2.md`](docs/test-plan-user-journey-v1.2.2.md)

### 执行测试

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run once
npm run test:run
```

---

## Project Structure / 項目結構

```
cuckoo/
├── src/                          # React Frontend
│   ├── components/               #    UI Components
│   │   ├── ui/                   #       shadcn/ui primitives
│   │   ├── app-sidebar.tsx       #       Navigation sidebar
│   │   └── app-header.tsx        #       Top header bar
│   ├── pages/                    #    Page Components (17)
│   ├── hooks/                    #    Custom hooks
│   ├── lib/                      #    Utilities
│   ├── App.tsx                   #    Main app component
│   └── main.tsx                  #    Entry point
│
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── main.rs               #    Tauri entry point
│   │   ├── lib.rs                #    App builder + commands
│   │   ├── commands.rs           #    92+ Tauri commands
│   │   └── database.rs           #    SQLite operations
│   ├── tauri.conf.json           #    Tauri config
│   └── Cargo.toml                #    Rust dependencies
```

---

## Build & Release / 構建與發佈

### macOS / macOS 構建

```bash
# Build for macOS (universal: Intel + Apple Silicon)
npm run tauri build -- --target universal-apple-darwin
```

**Output / 輸出**: `src-tauri/target/release/bundle/macos/Cuckoo.app`<br/>
**DMG**: `src-tauri/target/release/bundle/dmg/Cuckoo_*.dmg`

### Windows / Windows 構建

```bash
# Build for Windows (x64)
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**Output / 輸出**: `src-tauri/target/release/bundle/msi/Cuckoo_*.msi`

---

## Database Schema / 數據庫結構

```mermaid
erDiagram
    materials ||--o{ inventory_batches : "has"
    materials ||--o{ recipe_items : "used_in"
    materials ||--o{ material_tags : "has"
    materials }o--|| material_categories : "belongs_to"
    materials }o--|| units : "measured_in"
    materials ||--o{ material_states : "has_states"
    
    suppliers ||--o{ inventory_batches : "supplies"
    suppliers ||--o{ purchase_orders : "receives"
    
    recipes ||--o{ recipe_items : "contains"
    recipes ||--o{ menu_items : "defines"
    recipes ||--o{ production_orders : "used_by"
    
    menu_items ||--o{ menu_item_specs : "has_specs"
    menu_items ||--o{ order_items : "ordered_as"
    menu_items }o--|| menu_categories : "belongs_to"
    
    orders ||--o{ order_items : "contains"
    orders ||--o{ kitchen_tickets : "generates"
    order_items ||--o{ order_item_modifiers : "has"
    
    kitchen_tickets }o--|| stations : "assigned_to"
    
    inventory_batches ||--o{ inventory_txns : "generates"
    
    purchase_orders ||--o{ purchase_order_items : "contains"
    
    stocktakes ||--o{ stocktake_items : "contains"
    
    materials {
        i64 id PK
        string code
        string name
        i64 category_id FK
        i64 base_unit_id FK
        i32 shelf_life_days
    }
    
    recipes {
        i64 id PK
        string code
        string name
        string recipe_type
        f64 output_qty
    }
    
    orders {
        i64 id PK
        string order_no
        string source
        string dine_type
        string status
        f64 amount_total
    }
```

---

## Roadmap / 開發路線

```mermaid
gantt
    title Cuckoo Development Roadmap
    dateFormat  YYYY-MM
    axisFormat  %Y-%m
    
    section v1.0 - v1.2 (Current)
    Core CRUD              :done,    d1, 2026-01, 2026-03
    Recipe System          :done,    d2, 2026-02, 2026-03
    POS + Orders           :done,    d3, 2026-02, 2026-04
    KDS System             :done,    d4, 2026-03, 2026-04
    Inventory + Batches    :done,    d5, 2026-03, 2026-04
    Print Engine           :done,    d7, 2026-04, 2026-04
    Tree-Table Recipes     :done,    r1, 2026-04, 2026-04
    Telemetry System       :done,    r2, 2026-04, 2026-04
    
    section Future
    Mini Program API       :         m3, 2026-05, 2026-06
    Multi-store Support    :         m4, 2026-06, 2026-07
    Member System          :         f1, 2026-07, 2026-08
    Cloud Sync             :         f3, 2026-08, 2026-10
```

### Version Plan / 版本計劃

| Version / 版本 | Focus / 重點 | ETA / 預計 |
|---------------|-------------|-----------|
| **v1.0** | Core features complete | 2026-03 |
| **v1.2.1** | Tree-Table Recipes & UI Refactoring | 2026-04 |
| **v1.2.2** | Telemetry, Fool-proofing & Dependency Guard | 2026-04 |
| **v1.3** | Mini program, Multi-store Alpha | 2026-07 |
| **v2.0** | Cloud sync, mobile apps | 2026-Q4 |

---

## Contributing / 貢獻

### How to Contribute / 如何貢獻

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## License / 許可

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

本項目採用 **MIT 許可證** — 詳情請參閱 [LICENSE](LICENSE) 文件。

---

<div align="center">

**Made with love by the Cuckoo Team**

[Back to Top](#cuckoo--配方驅動餐飲作業系統)

</div>
