# Cuckoo 黑屏問題事後分析（修訂版）
## 修訂時間: 2026-04-29 | 版本: v1.2.2

> ⚠️ **重要修訂**：本檔案先前版本將根因錯誤歸咎於「macOS 26 Beta 與 Tauri WebView 兼容性問題」，並建議等待系統更新或遷移到 Electron。經重新審計後確認該結論完全錯誤。實際根因為前端 React 程式碼錯誤，與 Tauri、WebView、macOS 版本無關。本檔案保留作為「錯誤診斷路徑」教訓記錄。

---

## 真正的根因

**`src/App.tsx`** 違反 React Rules of Hooks。

修訂前的關鍵程式碼結構：

```tsx
function App() {
  // ...諸多 useState / 自訂 hook 呼叫

  if (loading) {
    return (<Skeleton 載入畫面 />);   // 早退出
  }

  useEffect(() => {                   // ← 條件之後的 Hook，違規
    // telemetry + 全局錯誤監聽
  }, [orders, appStartTime]);

  return (
    <ErrorBoundary>                   // ← 包在 App 內部，無法捕捉 App 自身崩潰
      <TooltipProvider>...</TooltipProvider>
    </ErrorBoundary>
  );
}
```

### 失敗序列

| 渲染次序 | `loading` | 實際呼叫的 Hook 數 |
|---|---|---|
| 第 1 次 | `true` | N（早退出，跳過 telemetry useEffect） |
| 第 2 次 | `false`（資料載入完） | N + 1 |

React 偵測到「Rendered more hooks than during the previous render」立即拋錯。`<React.StrictMode>`（`src/main.tsx:8`）讓錯誤更早、更嚴格地暴露。

由於 `<ErrorBoundary>` 是 App **內部回傳的 JSX**，當 App 自身崩潰時整個樹（含 ErrorBoundary）被一起卸載，`<div id="root">` 變成空，使用者看到 body 預設背景色：

- 淺色模式 → 白屏
- 暗黑模式 → 黑屏

跨平台症狀（macOS app / Windows exe / Tauri dev / 純瀏覽器 dev）一致，因為這是純前端 JavaScript 邏輯錯誤。

---

## 修復內容（已套用）

### 1. `src/App.tsx`

把 telemetry `useEffect` 從 `if (loading) return ...` **之後**搬到**之前**，確保所有 Hook 都在條件 return 前呼叫。

同時移除 App 內層的 `<ErrorBoundary>` 包裹（連同 import），改放到 `main.tsx`。

### 2. `src/main.tsx`

把 `<ErrorBoundary>` 包到 `<HashRouter><App/>` 外層：

```tsx
<React.StrictMode>
  <ErrorBoundary>
    <HashRouter>
      <App />
    </HashRouter>
  </ErrorBoundary>
</React.StrictMode>
```

如此 App 自身崩潰時，使用者會看到錯誤頁而非空白屏。

### 驗證

- `npx tsc --noEmit` 通過
- `npm run dev`、`npm run tauri dev`、Release 構建應全部恢復

---

## 為何先前的審計誤判

先前審計步驟：

1. 觀察到 macOS app 黑屏 → 假設是 WebView 問題
2. Google 搜尋「macOS 26 Tauri 黑屏」→ 命中 [tauri#15271](https://github.com/tauri-apps/tauri/issues/15271) 等 issue
3. 確認版本相符 → 結案歸咎兼容性

**遺漏的關鍵證據**：

- 使用者訊息明確指出「dev 網頁端、本地端」也黑屏。**dev browser 與 Tauri/WebView 完全無關**，只要這條成立，平台兼容性假設就站不住腳。
- 沒有開瀏覽器 DevTools Console 觀察前端錯誤。React 拋出的「Rendered more hooks」錯誤訊息會直接指向元件名稱與行號。
- 沒有檢查程式碼層的 React 規則違反 — 即使在 build 階段，eslint-plugin-react-hooks 也能在 lint 時直接警告此類錯誤。

---

## 教訓：除錯流程的執行順序

修訂後建議的診斷管線（pipeline）：

1. **症狀邊界判定**：問題出現在哪些執行環境？
   - 跨平台（含瀏覽器 dev）→ 純應用層 bug，**先排除所有 native／平台假設**
   - 僅 native 出現 → 才進入 WebView／OS／驅動層調查
2. **最薄重現環境優先**：能在 `npm run dev` + Chrome 重現的問題，永遠不要從 macOS app 開始查。瀏覽器 DevTools 提供的訊號比 native log 多一個量級。
3. **打開 Console 與 React DevTools**：黑/白屏 + Console 一片紅 ≠ 黑/白屏 + Console 安靜，兩者根因截然不同。
4. **lint / typecheck 是免費的**：執行 `eslint --plugin react-hooks` 應作為診斷的第 0 步。
5. **網路搜尋的證據強度評估**：搜尋到的 issue 必須能解釋**所有**已知症狀。若假設無法解釋「dev browser 也壞」，就不能採信。
6. **ErrorBoundary 不能裝在自己會崩潰的元件內部**：必須在更外層才有捕獲意義。

---

## 系統環境（僅作參考，與本根因無關）

```
macOS: 26.2 (25C56)
Tauri: 2.10.3
wry: 0.54.x
React: 18.x（StrictMode 已啟用）
```

---

*本檔案修訂於 2026-04-29，前次錯誤結論留存於 git log 以利溯源。*
