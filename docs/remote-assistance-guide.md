# Cuckoo v1.2.2 远程协助与日志获取指南

> **版本**: 1.2.2  
> **更新日期**: 2026-04-28

---

## 一、日志文件位置

### 1.1 应用日志
- **macOS**: `~/Library/Application Support/Cuckoo/logs/`
- **Windows**: `%LOCALAPPDATA%\Cuckoo\logs\`

### 1.2 崩溃日志 (Panic)
- **路径**: `{数据目录}/logs/crash.log`
- 当 Rust 后端发生崩溃时自动写入

### 1.3 前端错误
- 通过浏览器的开发者工具 (F12) → Console 查看
- React ErrorBoundary 会捕获渲染错误并显示错误堆栈

---

## 二、获取日志的命令

### 2.1 获取崩溃日志
```bash
# macOS
cat ~/Library/Application\ Support/Cuckoo/logs/crash.log

# 或实时监控
tail -f ~/Library/Application\ Support/Cuckoo/logs/crash.log
```

### 2.2 获取应用日志
```bash
# 列出日志目录
ls -la ~/Library/Application\ Support/Cuckoo/logs/
```

### 2.3 数据库位置
```bash
# macOS
~/Library/Application\ Support/Cuckoo/cuckoo.db

# Windows
%LOCALAPPDATA%\Cuckoo\cuckoo.db
```

---

## 三、版本信息

| 组件 | 版本 |
|------|------|
| 前端 | 1.2.2 |
| Tauri | 2.x |
| SQLite | 0.32 |

检测版本:
```javascript
// 在应用中查看版本
// 通常在 Settings 页面或关于对话框
```

---

## 四、远程协助检查清单

用户报告问题时，请先收集:

1. **崩溃日志**: 运行上述 `cat crash.log` 命令
2. **截图**: 问题截图
3. **操作步骤**: 复现问题的步骤
4. **版本号**: 应用显示的版本

---

## 五、核心 API (用于调试)

```rust
// 遥测心跳包 (如果配置了远程服务器)
invoke("report_telemetry", { 
  payload: {
    client_id: "...",
    version: "1.2.2",
    uptime_hours: 12.5,
    today_sales: 1500.00,
    today_orders: 45
  }
})
```

---

*本指南帮助远程协助人员快速定位和解决问题*