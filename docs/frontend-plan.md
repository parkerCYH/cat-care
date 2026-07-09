# cat-care 前台規劃

## 背景

`cat-care` 是記錄家貓(腎臟有問題、需飲食控制)排便時間與體重的個人健康追蹤 app。後端已定案(見 parker-api repo 的 [`docs/services/cat-care.md`](https://github.com/parkerCYH/parker-api/blob/main/docs/services/cat-care.md)、[issue #4](https://github.com/parkerCYH/parker-api/issues/4)):

- 貓為獨立實體 `cats`,與 `auth.players` 多對多關聯(`cat_players`,不分角色)
- `bowel_movements`:時間、形狀/異常旗標、備註
- `weight_records`:時間、重量(固定公克)、量測方式、備註
- 登入驗證依賴 `auth` service(全域 Player 帳號)

前台是獨立新專案,透過 `/api/v1/cat-care/*`、`/api/v1/auth/*` 呼叫 parker-api 後端。

## 核心使用情境決定技術選型

這是**每天要打開好幾次的快速記錄工具**,不是資訊密集的後台系統。真正決定體驗好壞的是「打開 app 到記錄完成」中間的步驟數,而不是畫面精緻度。因此整份建議圍繞一個原則:**把「記一筆」這件事的摩擦力壓到最低**,其他都是次要的。

## 技術棧建議

| 項目 | 建議 | 理由 |
|---|---|---|
| 框架 | React + Vite | 單人開發、生態成熟、你在 parker-api README 已經預期會有 Vite 前端 |
| 型態 | PWA(可加到手機主畫面、離線 fallback) | 不用上架 App Store/Play Store 就能有「像 app」的體驗;離線時仍可暫存一筆記錄,連線後同步 |
| 樣式 | Tailwind CSS | 單人開發不需要設計系統,原子化 CSS 上手快、改版不綁死 |
| 狀態/資料層 | TanStack Query | 後端已有 Swagger/OpenAPI,可直接用 `openapi-typescript` 產生型別,搭配 TanStack Query 處理 cache、重試、離線隊列 |
| 表單 | React Hook Form + Zod | 前後端共用同一套 Zod schema 概念(後端本來就用 Zod),欄位驗證邏輯不用重寫 |
| 圖表 | Recharts 或 visx | 體重趨勢線圖用得到,套件輕量、社群成熟 |
| 部署 | Vercel / Netlify 或跟後端同 Docker | 純前端靜態站,選你 side project 慣用的方式即可 |

**不建議** React Native / Flutter:多一層原生打包維護成本,而 PWA 已經能滿足「主畫面圖示 + 快速開啟」的核心需求,對單人開發的 CRUD 記錄型 app 不划算。

## 資訊架構(IA)

```
┌─ 登入(Google OAuth,走 auth service)
│
├─ 首頁(Home)— 唯一預設進入點
│   ├─ 貓咪切換器(若只有一隻貓可隱藏,多貓時顯示 tab/dropdown)
│   ├─ 兩個大按鈕:「記一筆排便」「記一筆體重」— 最短路徑,不進二級頁面
│   └─ 最近 N 筆紀錄摘要(今天/昨天,一眼看出貓咪今天狀況)
│
├─ 排便歷史(Bowel History)
│   ├─ 時間軸列表,異常筆記錄視覺標示(如紅點/圖示)
│   └─ 篩選:日期區間、是否異常
│
├─ 體重歷史(Weight History)
│   ├─ 趨勢折線圖(腎臟病追蹤最需要的視圖——體重是否持續下降)
│   └─ 列表 + 篩選
│
└─ 貓咪管理(Cat Settings)— 低頻,藏在設定選單
    ├─ 新增/編輯貓咪(name、birthdate、notes)
    └─ 管理共同照護者(cat_players 邀請/移除)
```

## 首頁快速記錄的具體設計

這是整個 app 的關鍵畫面,細節建議:

- **記排便**:預設時間 = 現在,一鍵送出;點開才需要選形狀/異常/備註(漸進式揭露,預設路徑是「時間到、按送出」兩步完成)
- **記體重**:輸入公斤/公克數字鍵盤直接跳出,量測方式用最近用過的選項記憶(下拉預設上次選的值)
- 兩個按鈕都用 **Optimistic UI**:按下去立刻顯示「已記錄」,背景才送 API,失敗才提示重試——避免使用者因為網路延遲而重複按或懷疑有沒有記到
- PWA 離線時仍可記錄,存本地佇列,連線後自動同步(TanStack Query 的 mutation queue 或簡單的 IndexedDB 佇列都可以)

## 體重趨勢圖的取捨

因為是腎臟病追蹤,體重的**變化方向**比單筆數字重要。折線圖上建議：

- X 軸時間、Y 軸公克,預設顯示近 3 個月
- 可疊加「排便異常」的標記點在同一時間軸上,方便肉眼對照「異常排便前後體重是否有波動」——這是這個 app 對比一般記帳/記錄 app 唯一需要的「跨資料表關聯視覺化」,值得花時間做好

## 權限/多人共管的前台影響

`cat_players` 是多對多、不分角色,代表前台不需要做權限分級 UI(不用判斷「你能不能刪除這筆記錄」),簡化了很多——任何登入且被列在 `cat_players` 的 Player 都能完整操作。前台唯一要處理的是「邀請其他 Player 加入這隻貓的共同照護」的簡單畫面(輸入 email 或既有 Player 名稱)。

## 新專案的建議起手式

1. `npm create vite@latest cat-care-web -- --template react-ts`
2. 裝 Tailwind、TanStack Query、React Hook Form + Zod、Recharts
3. 從 parker-api 的 Swagger JSON 跑 `openapi-typescript` 產生 API 型別,確保跟後端 schema(`cats` / `bowel_movements` / `weight_records`)同步
4. 先做首頁的兩個快速記錄按鈕 + optimistic UI,其他頁面之後再補——這是驗證「摩擦力夠不夠低」最快的方式
5. PWA manifest + service worker 留到核心記錄流程穩定後再加,避免一開始就處理離線同步的複雜度

## 待你決定的開放問題

- Google OAuth 走哪個套件(Auth.js / 自己接 auth service 的 API)?取決於 `auth` service 前台整合方式,建議先確認 `auth.md` 的規劃
- 是否需要 App icon/推播提醒(例如「該量體重了」)?若要,PWA 的 Web Push 在 iOS Safari 支援度有限,可能得另外評估
