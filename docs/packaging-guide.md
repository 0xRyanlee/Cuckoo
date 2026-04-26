# Cuckoo 應用封裝規範

## 概述

本文檔定義 Cuckoo 餐飲管理系統的桌面應用封裝標準，涵蓋 macOS 和 Windows 平台的最佳實踐。

## 平台要求

### macOS

- **最低版本**: macOS 10.13 (High Sierra)
- **架構**: Universal (Intel + Apple Silicon)
- **簽名**: Apple Developer 證書（分發時必需）
- **公證**: Notarization（分發時必需）

### Windows

- **最低版本**: Windows 10 (1809+)
- **架構**: x64
- **簽名**: EV 證書（分發時推薦）
- **安裝程序**: MSI 或 NSIS

## 圖標規範

### 設計原則

1. **圓角**: macOS Dock 圖標需使用圓角設計（20px 圓角）
2. **陰影**: 建議添加微妙陰影增加立體感
3. **安全範圍**: 確保關鍵內容在安全範圍內（邊緣保留 10% 內邊距）
4. **背景**: 支持透明背景或與系統主題融合的淺色背景

### 尺寸要求

| 平台 | 尺寸 | 用途 |
|------|------|------|
| macOS | 16x16 @1x/2x | 菜單欄 |
| macOS | 32x32 @1x/2x | Dock, Finder |
| macOS | 128x128 @1x/2x | 大圖標預覽 |
| macOS | 256x256 @1x/2x | Spotlight |
| macOS | 512x512 @1x/2x | App Store |
| Windows | 16x16 | 任務欄 |
| Windows | 32x32 | 任務欄 |
| Windows | 48x48 | 大圖標 |
| Windows | 256x256 | 高 DPI |
| Windows | ICO 多層 | 所有尺寸 |

### 當前圖標文件

位置: `src-tauri/icons/`

```
icons/
├── 32x32.png           # 32x32
├── 128x128.png         # 128x128
├── 128x128@2x.png     # 256x256 Retina
├── icon.icns           # macOS
├── icon.ico            # Windows
├── icon.png            # 主圖標
└── favicon.png         # 網頁 favicon
```

## 窗口配置

### 當前配置

```json
{
  "productName": "Cuckoo",
  "version": "1.0.0",
  "identifier": "com.cuckoo.ops",
  "app": {
    "windows": [{
      "title": "Cuckoo 餐飲作業系統",
      "width": 1280,
      "height": 800,
      "minWidth": 1024,
      "minHeight": 600,
      "resizable": true,
      "center": true,
      "titleBarStyle": "Overlay",
      "hiddenTitle": true
    }]
  }
}
```

### macOS 窗口樣式

使用自定義標題欄實現圓角窗口：

```json
{
  "decorations": false,
  "transparent": false,
  "titleBarStyle": "Overlay",
  "hiddenTitle": true
}
```

## 圓角窗口實現

### 方案 A: 系統原生圓角（推薦）

macOS 原生支持圓角，無需額外配置。確保：
- 使用非透明窗口
- 避免設置 `transparent: true`

### 方案 B: 插件方案（可選）

如需自定義圓角效果，可使用：

```toml
# Cargo.toml
[dependencies]
tauri-plugin-mac-rounded-corners = "1.1"
```

## 分發配置

### Bundle 目標

```json
{
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "nsis"],
    "category": "Business",
    "shortDescription": "Cuckoo Restaurant Operations System",
    "longDescription": "A recipe-driven, local-first restaurant management system..."
  }
}
```

### macOS 分發配置

```json
{
  "macOS": {
    "frameworks": [],
    "minimumSystemVersion": "10.13",
    "hardenedRuntime": true,
    "signingIdentity": "Developer ID Application: Your Name",
    "entitlements": "./entitlements.plist"
  }
}
```

### Windows 分發配置

```json
{
  "windows": {
    "certificateThumbprint": "YOUR-CERT-THUMBPRINT",
    "digestAlgorithm": "sha256",
    "webviewInstallMode": {
      "type": "downloadBootstrapper"
    }
  }
}
```

## 簽名與公證

### macOS 證書要求

1. **開發簽名**: Apple Development Certificate
2. **分發簽名**: Apple Distribution Certificate
3. **公證**: Notarization via `xcrun notarytool`

### Windows 證書要求

1. **代碼簽名**: EV 或 OV 代碼簽名證書
2. **時間戳**: 建議添加時間戳伺服器

### CI/CD 自動化

```yaml
# .github/workflows/build.yml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: macos-latest
            target: dmg
          - platform: windows-latest
            target: msi

    steps:
      - uses: actions/checkout@v4
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        with:
          tagName: ${{ github.ref_name }}
          target: ${{ matrix.target }}
```

## 圖標生成流程

### 使用 Tauri CLI

```bash
# 1. 準備源圖標 (1240x1240 PNG)
cp app-icon-source.png ./app-icon.png

# 2. 生成所有尺寸
npm run tauri icon ./app-icon.png

# 3. 檢查輸出
ls src-tauri/icons/
```

### 手動生成（如需要自定義）

需要生成的文件：

```
# macOS (.icns)
icon.icns (16, 32, 128, 256, 512 @1x/2x)

# Windows (.ico)
icon.ico (16, 24, 32, 48, 64, 256)

# PNG
32x32.png
128x128.png
128x128@2x.png
icon.png (用於網頁)
```

## 維護清單

### 發布新版本時

- [ ] 更新 version (tauri.conf.json)
- [ ] 生成/更新圖標文件
- [ ] 測試窗口圓角效果
- [ ] 驗證 macOS 簽名
- [ ] 驗證 Windows 簽名
- [ ] 執行公證流程 (macOS)
- [ ] 構建生產版本
- [ ] 測試安裝程序

### 圖標更新時

- [ ] 準備 1240x1240 源文件
- [ ] 運行 `npm run tauri icon`
- [ ] 驗證所有尺寸正確生成
- [ ] 測試 Dock/任務欄顯示效果

## 參考資源

- [Tauri Icons Documentation](https://v2.tauri.app/develop/icons/)
- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Microsoft Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons)
- [tauri-plugin-mac-rounded-corners](https://github.com/cloudworxx/tauri-plugin-mac-rounded-corners)

## 版本歷史

| 版本 | 日期 | 變更 |
|------|------|------|
| 1.0.0 | 2026-04-26 | 初始規範 |