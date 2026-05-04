# 黑/白屏 & 渲染失敗診斷管線（Debug Pipeline v1）

> 目標：把「症狀模糊、易誤判平台層」這類前端應用故障的調查流程**降級到便宜 LLM 也能執行**。減少推理需求、增加結構化證據收集，讓 GPT-4o-mini / Sonnet-mini / Gemini-Flash 等模型可以直接照表操課。

> 適用：React / Vue / Svelte 等 SPA 前端，搭配 Tauri / Electron / WKWebView 原生殼，或純 Web 部署。
> 不適用：純後端錯誤、純 OS 驅動問題（除非通過本管線**Phase 1**確認導向 Phase 3b）。

---

## 設計原則（對 LLM）

1. **不要假設、只看證據**。所有結論必須有對應的證據引用（行號、命令輸出、錯誤訊息）。
2. **跨平台症狀必先排除平台層**。這條規則違反成本極高，永遠優先驗證。
3. **每個 Phase 必須產出明確的工件**（見 §Templates）。下一階段不能在沒有上一階段工件時啟動。
4. **遇到不確定就 STOP**，列出缺失的證據請使用者補齊，**不要自行猜測**。
5. **平台層調查永遠是最後手段**，因為成本最高且容易陷入兼容性陷阱。

---

## Pipeline 總覽

```
[使用者報告症狀]
        ↓
   Phase 0: 症狀邊界調查（強制）
        ↓
   Phase 1: 邊界判定 ───→ 純應用層 ───→ Phase 2: 廉價優先檢查
        │                                    ↓
        │                              Phase 3a: 應用層深掘
        │                                    ↓
        └──→ 平台層 ──────────────→  Phase 3b: 平台層深掘
                                             ↓
                                       Phase 4: 證據包 & 交付
```

---

## Phase 0：症狀邊界調查（INTAKE）

**目的**：在動任何一行程式碼前，先把「在哪些環境壞掉」精確到二元矩陣。

### LLM 須執行

向使用者收集以下資訊，**全部填完才能進 Phase 1**：

```
[症狀矩陣]
- macOS 編譯產物（Release）：✅ / ❌ / 未測
- Windows 編譯產物（Release）：✅ / ❌ / 未測
- Linux 編譯產物（Release）：✅ / ❌ / 未測
- npm run dev + Tauri/Electron 殼：✅ / ❌ / 未測
- npm run dev + 純瀏覽器（Chrome/Safari/Firefox）：✅ / ❌ / 未測
- 不同帳號 / 不同機器是否都重現：是 / 否 / 未測

[視覺症狀]
- 完全黑屏 / 完全白屏 / 部分渲染 / 元件閃爍 / 凍結
- 是否有任何文字或元件出現過（哪怕一瞬）

[時序]
- 一啟動就壞 / 操作 N 步後壞 / 隨機 / 特定動作觸發

[Console / DevTools]
- 是否打開過開發者工具
- 是否有紅色錯誤訊息（必須貼原文）
- Network 是否有 4xx/5xx
```

**STOP 條件**：若使用者不知道怎麼開 DevTools 或無法測 dev browser，先教學或請其補齊，**不要進 Phase 1**。

---

## Phase 1：邊界判定（BOUNDARY）

根據 Phase 0 的矩陣應用以下規則。**規則之間互斥**，命中一個立即分流，不再往下評估。

| 規則 | 條件 | 結論 | 下一步 |
|---|---|---|---|
| R1 | dev browser ❌ | **純應用層 bug**（JS/CSS/狀態） | Phase 2 |
| R2 | dev browser ✅ + Tauri/Electron dev ❌ | 殼整合層 bug（IPC、CSP、preload） | Phase 3a 子分支 |
| R3 | 所有 dev ✅ + Release ❌ | 構建 / 打包 / 簽名問題 | Phase 3a 子分支 |
| R4 | 僅單一 OS Release ❌，其他全 ✅ | **平台層**（OS API、WebView 版本、權限） | Phase 3b |
| R5 | 一台機器 ❌，其他同 OS ✅ | 環境問題（緩存、權限、driver） | Phase 3b |

**錯誤示範**：跳過此步直接 Google「macOS 26 黑屏」並結案 → 高機率把 R1 誤診成 R4。

**輸出工件**：一行結論，例：「依 R1 → 純應用層，進 Phase 2」。

---

## Phase 2：廉價優先檢查（CHEAP FIRST）

只在 Phase 1 命中 R1 / R2 / R3 時執行。**全部命令零成本，必須跑完。**

### 2.1 型別與 lint（並行）

```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx --no-error-on-unmatched-pattern
```

特別關注 `react-hooks/rules-of-hooks` 與 `react-hooks/exhaustive-deps`。

### 2.2 瀏覽器 Console（強制）

```
1. npm run dev
2. 打開 Chrome → 訪問 dev URL
3. F12 → Console tab
4. 重整頁面
5. 截圖 + 複製所有紅色錯誤
```

**最常命中根因**：
- `Rendered more hooks than during the previous render` → React Hooks 條件呼叫
- `Cannot read properties of undefined` → 資料未到位就解構
- `Failed to fetch` / CORS → 後端或 IPC 連線問題
- `Refused to ... because it violates ... CSP` → CSP 設定過嚴

### 2.3 React 元件樹（若 console 無錯仍黑屏）

```
React DevTools → Components → 看 root 是否有元件
- 有元件但畫面空白 → CSS 問題（z-index、display、color = bg）
- 連 root 都沒元件 → render 階段崩潰，回 §2.2 重看 console
```

### 2.4 ErrorBoundary 位置稽核

```bash
grep -rn "ErrorBoundary" src/
```

確認 ErrorBoundary **不是**裝在會崩潰的元件內部。正確位置：`main.tsx` / `index.tsx` 包在 `<App/>` 外層。

**輸出工件**：填入 §Templates 的「Phase 2 證據卡」。任一格未填不可進 Phase 3。

---

## Phase 3a：應用層深掘（APP DIVE）

僅在 Phase 2 未直接定位根因時進入。按下列子分支對應 Phase 1 規則。

### 3a-R1：純前端 bug

依 Phase 2 console 訊息，定位到具體檔案與行號。常見模式：

| Console 訊息特徵 | 對應 bug 模式 | 排查命令 |
|---|---|---|
| `Rendered more hooks` | 條件式 Hook | `grep -nE "if.*\{[^}]*return" src/**/*.tsx` 找早退出 |
| `Maximum update depth` | useEffect 死循環 | 檢查 useEffect deps 是否包含每次 render 都變的物件 |
| `Cannot read properties of undefined` | 資料未到 | 檢查 loading state 與初始值 |
| 無錯誤但白屏 | CSS / z-index / 條件渲染 | React DevTools 看 props |

### 3a-R2：殼整合 bug（Tauri/Electron）

```bash
# Tauri
cat src-tauri/tauri.conf.json | grep -A2 csp
# Electron
grep -rn "contextIsolation\|nodeIntegration" .
```

檢查項：
- CSP 是否阻擋 dev server WebSocket（HMR 失效會渲染但無更新）
- IPC 通道（`invoke` / `ipcRenderer`）是否在 dev/prod 行為一致
- preload script 是否被 sandbox 限制

### 3a-R3：構建/打包 bug

```bash
npm run build && npx serve dist
```

若 `serve dist` 也壞 → 構建產物本身有問題（base path、靜態資源路徑、code splitting）。

特別檢查 `vite.config.ts` 的 `base` 是否與部署路徑相符（Tauri 通常用 `"./"`）。

---

## Phase 3b：平台層深掘（PLATFORM DIVE）

僅在 Phase 1 命中 R4 / R5 才執行。**這是最昂貴的分支，不要過早進入**。

### 3b 操作

1. 蒐集系統日誌：
   ```bash
   # macOS
   log show --predicate 'process == "YourAppName"' --last 5m
   # Windows
   eventvwr.msc → Windows Logs → Application
   ```
2. 確認 WebView/Runtime 版本：
   - macOS: `WKWebView` 由系統提供，看 macOS 版本
   - Windows: `WebView2` 看 Edge 版本
3. 搜尋相關 issue **必須驗證假設能解釋全部已知症狀**。若無法解釋 dev browser 為何也壞 → 假設無效，回 Phase 1 重判。

### 3b 終止條件

- 找到對應的 upstream issue + workaround → 套用並驗證
- 三個工作小時內未定位 → 升級給人類工程師，附 §Phase 4 證據包

---

## Phase 4：證據包 & 交付（HANDOFF）

無論是修好交差還是升級給其他人，都必須產出以下標準包：

```markdown
## 故障摘要
- 觸發環境：
- 視覺症狀：
- 影響範圍：

## 根因
- 檔案：path/to/file.tsx:LINE
- 機制：（一句話描述）
- 證據：（console 截圖 / 命令輸出 / 程式碼引用）

## 修復
- diff 連結 / commit hash
- 變更說明（一段）

## 驗證
- [ ] dev browser 恢復
- [ ] dev shell 恢復
- [ ] release 構建恢復
- [ ] 型別檢查通過
- [ ] 既有測試通過

## 教訓 / 後續行動
- 是否需要新增 lint rule？
- 是否需要新增測試？
- 是否需要更新 CLAUDE.md / README？
```

---

## §Templates：可直接餵給便宜 LLM 的提示詞

### T1：Phase 0 收集

```
你是前端故障分流助手。請用以下表格詢問使用者，全部填完才回覆。
不要猜測未提供的欄位，缺項請追問。

[症狀矩陣]
- macOS Release：
- Windows Release：
- Linux Release：
- npm run dev (Tauri/Electron)：
- npm run dev (純瀏覽器)：

[視覺]
- 黑屏 / 白屏 / 部分渲染 / 其他：

[Console 錯誤原文]
（請複製紅色錯誤）

填完後請輸出「Phase 0 完成」並等待下一指令。
```

### T2：Phase 1 邊界判定

```
給定以下症狀矩陣（從 T1 收集），請套用 R1–R5 規則判定故障層級：
{paste matrix}

只能輸出：
- 命中規則：R?
- 結論：純應用層 / 殼整合 / 構建 / 平台層 / 環境
- 下一步：Phase 2 / Phase 3a-R? / Phase 3b

禁止額外推測。
```

### T3：Phase 2 console 解讀

```
給定瀏覽器 console 錯誤原文：
{paste errors}

對照下表分類：
- "Rendered more hooks" → A
- "Cannot read properties of undefined" → B
- "Failed to fetch" → C
- "violates ... CSP" → D
- 其他 → E（需人工判斷）

輸出格式：
- 分類：?
- 涉及檔案（從 stack trace 取第一條應用程式碼幀）：
- 建議排查命令：
```

### T4：Phase 4 報告

```
請依下列證據生成標準故障報告：
- Phase 0 矩陣：{...}
- Phase 1 結論：{...}
- Phase 2 console：{...}
- 修復 diff：{...}

依本管線 §Phase 4 模板格式輸出，禁止編造任何欄位。
```

---

## §Anti-Patterns（禁止行為）

| 反模式 | 為什麼錯 | 正確做法 |
|---|---|---|
| 一聽到「macOS 黑屏」就 Google 平台 issue | 未經 Phase 1 判定，高機率誤診 R1 為 R4 | 先看 dev browser |
| Console 沒看就改程式碼 | 浪費修改成本，且可能掩蓋真正錯誤 | Phase 2.2 必跑 |
| 把 ErrorBoundary 裝在會崩潰的元件內部 | 自身崩潰連帶卸載，等於沒裝 | 包在 root render 處 |
| 「等系統更新」當解法 | 等同放棄調查 | 必須有 upstream issue 證據才能採信 |
| 條件 return 之後寫 useEffect | 違反 Rules of Hooks | 所有 Hook 必須在所有 return 之前 |
| 用 mock 跳過真實重現 | 掩蓋真正路徑 | dev browser 是最便宜的真實重現 |

---

## §版本歷程

- **v1（2026-04-29）**：初版，源自 Cuckoo v1.2.2 黑屏故障的事後分析。對應根因案例見 `docs/audit-black-screen-macos26.md`。

---

## §使用建議（給人類）

- 把 §Templates 的 T1–T4 各自存成 prompt 檔案，配合便宜 LLM 走完前 3 個 Phase
- Phase 3a 深掘可選擇升級到較強模型（Claude Opus / GPT-5）
- Phase 3b 平台層深掘建議交給人類工程師
- 本管線完成一次完整故障後，務必更新 §Anti-Patterns 與 §版本歷程
