# VALORANT 特務幣儲值計算器

輸入現有 VP 與想買的商品價格，計算台灣商店面額的儲值組合。結果會列出花費最少的方案；只有加價不超過 NT$200、也不超過最低花費的 10%，且每元可得 VP 至少增加 5% 時，才會顯示加價最少的另一種方案。

## 分享連結

輸入後按「複製分享連結」，網址會帶入目前 VP、商品價格、數量與選填的名稱。也可以自行組合參數：`vp` 是目前 VP；每個 `item` 是 `價格,數量,名稱`，數量預設為 1，名稱可以省略。例如：`?vp=500&item=1775&item=2175,2,幻象`。多件商品就重複使用 `item`。

## 本機執行

```bash
bun install
bun run dev
```

正式版建置：`bun run build`。檢查程式：`bun run lint`。

## 部署

網站發佈在 `gh-pages` 分支。更新網站時執行 `bun run build`，將 `dist` 內容推送到 `gh-pages` 分支，並在儲存庫 Settings → Pages 將來源設為 **Deploy from a branch**、分支選擇 `gh-pages` 的根目錄。

VP 面額取自需求中提供的台灣商店資料；價格若有變動，請更新 `src/lib/calculator.ts`。此網站與 Riot Games 無關。
