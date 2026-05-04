# Cuckoo 文档索引 (Documentation Index)

> **更新日期**: 2026-05-05  
> **当前版本**: v1.2.2

---

## 📁 文档结构

```
Cuckoo/
├── README.md                      # 项目简介
├── ROADMAP.md                     # 版本路线图
├── TODOs.md                       # 开发任务清单 (P0-P2)
├── PAGE_PLAN.md                   # 页面结构规划
├── RELEASE_NOTES_v1.2.2.md       # 发布说明
├── RELEASE_INSTALL_GUIDE.md      # 安装指南
│
├── docs/
│   ├── 📋 索引与指南
│   │   ├── DOCS_INDEX.md          # 本文档 - 文档总索引
│   │   ├── api-design.md          # API 设计文档
│   │   ├── database-schema.md     # 数据库架构
│   │   ├── packaging-guide.md     # 打包指南
│   │
│   ├── 🔍 审计报告 (按版本)
│   │   ├── comprehensive-audit-report-v1.2.2.md   # 综合审计 v1.2.2 (最新)
│   │   ├── info-flow-audit-2026-04-30.md          # 信息流安全审计
│   │   ├── recipe-management-audit-2026-05-05.md # 配方管理审计
│   │   ├── recipe-multi-role-roadmap-2026-05-05.md # 配方多角色路线图
│   │   ├── implementation-audit-report-v1.2.2.md  # 实现审计
│   │   ├── backlog-and-fix-list.md                 # 待修复清单
│   │   ├── audit-report-v1.2.1.md                  # 旧版审计 (已归档)
│   │   └── dev-handoff-v1.2.1.md                   # 旧版交接 (已归档)
│   │
│   ├── 🧪 测试计划
│   │   ├── test-plan-user-journey-v1.2.2.md        # 用户旅程测试
│   │   └── test-plan-atomic-v1.2.2.md              # 原子测试
│   │
│   ├── 🔧 运维指南
│   │   ├── debug-pipeline.md        # 调试流水线
│   │   ├── audit-black-screen-macos26.md  # 黑屏问题修复
│   │   └── remote-assistance-guide.md      # 远程协助指南
│   │
│   ├── 📊 历史归档 (已归档)
│   │   └── archived/
│   │       ├── audit-report-v7.md
│   │       ├── audit-report-v6.md
│   │       ├── audit-report-v5.md
│   │       ├── audit-report-v4.md
│   │       ├── audit-report-v3.md
│   │       ├── audit-report.md
│   │       ├── dev-progress.md
│   │       ├── FEATURE_STATUS.md
│   │       ├── AUDIT.md
│   │       ├── dev-plan-v0.8.0.md
│   │       ├── dev-plan-v0.5.0.md
│   │       ├── test-report-v0.9.0.md
│   │       ├── test-plan-v0.9.0.md
│   │       └── 開發文檔參考.md
│   │
│   └── 📈 开发进度
│       └── progress/
│           └── README.md            # 开发进度追踪
│
└── 其他 (根目录)
    └── AGENTS.md                    # Agent 专用指南
```

---

## 📖 文档使用指南

### 快速导航

| 需求 | 推荐文档 |
|------|---------|
| 当前开发任务 | `TODOs.md` |
| 版本规划 | `ROADMAP.md` |
| 最新综合审计 | `docs/comprehensive-audit-report-v1.2.2.md` |
| 待修复问题 | `docs/backlog-and-fix-list.md` |
| API 设计参考 | `docs/api-design.md` |
| 数据库结构 | `docs/database-schema.md` |
| 安装部署 | `RELEASE_INSTALL_GUIDE.md` |
| 发布说明 | `RELEASE_NOTES_v1.2.2.md` |

### 版本对应

| 文档版本 | 对应应用版本 |
|---------|-------------|
| v1.2.2 审计报告 | v1.2.2 |
| v1.2.1 审计报告 | v1.2.1 |
| v0.7.x 审计报告 | v0.7.x |
| v0.5.x 开发计划 | v0.5.x |

### 归档说明

旧版审计报告和开发文档已移至 `docs/archived/` 目录。这些文档保留了历史版本记录，供回溯参考，但不再维护。

---

## 🔄 更新日志

| 日期 | 操作 |
|------|------|
| 2026-05-05 | 创建文档索引，整理文档结构 |
| 2026-05-05 | 新增配方管理专项审计文档 |
| 2026-04-30 | 新增信息流安全审计 |
| 2026-04-28 | v1.2.2 综合审计报告 |

---

*本索引由 AI 文档管理员自动维护*