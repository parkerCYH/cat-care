# 路由總覽

彙整目前所有 UI 規格中定義的路由,供實作時對照。導覽原則:除登入頁外,所有頁面共用同一套頂部列(返回箭頭 + 標題 + 漢堡選單);表單/編輯類操作一律是獨立路由,不使用彈出式面板。

| 路由 | 頁面 | 說明 | 規格文件 |
|---|---|---|---|
| `/login` | 登入頁 | 未登入時的唯一畫面,不套用共用導覽 | [login.md](./login.md) |
| `/` | 首頁 | 唯一預設進入點,快速記錄按鈕 + 最近紀錄摘要;若尚未加入任何貓咪則顯示空狀態引導 | [home.md](./home.md) |
| `/bowel/new` | 新增排便紀錄(進階欄位) | 從首頁「記一筆排便」的展開箭頭進入,送出後返回首頁 | [home.md](./home.md) |
| `/bowel/calendar` | 排便歷史 · 日曆檢視(預設) | 月曆呈現,一次看一個月,狀態圓點標示正常/異常 | [bowel-history.md](./bowel-history.md) |
| `/bowel/table` | 排便歷史 · 表格檢視 | 依日期分組的列表,含篩選列(是否異常/日期區間) | [bowel-history.md](./bowel-history.md) |
| `/bowel/:id` | 單筆排便紀錄詳情 | 從表格頁點擊單筆進入 | [bowel-history.md](./bowel-history.md) |
| `/weight/new` | 新增體重紀錄 | 從首頁「記一筆體重」進入,送出後返回首頁 | [home.md](./home.md) |
| `/weight/chart` | 體重歷史 · 折線圖檢視(預設) | 趨勢線圖,預設顯示全部歷史,點資料點彈出 tooltip | [weight-history.md](./weight-history.md) |
| `/weight/table` | 體重歷史 · 表格檢視 | 只顯示日期時間 + 體重,點列進入詳情 | [weight-history.md](./weight-history.md) |
| `/weight/:id` | 單筆體重紀錄詳情 | 從表格頁點擊單筆進入,顯示量測方式、備註 | [weight-history.md](./weight-history.md) |
| `/cats` | 貓咪列表 | 貓咪管理的第一層,卡片列表 | [cat-management.md](./cat-management.md) |
| `/cats/:id` | 單一貓咪詳情 | 基本資料 + 共同照護者列表 | [cat-management.md](./cat-management.md) |
| `/cats/new` | 新增貓咪 | 送出後導向新貓咪的 `/cats/:id` | [cat-management.md](./cat-management.md) |
| `/cats/:id/edit` | 編輯貓咪基本資料 | 送出後返回 `/cats/:id` | [cat-management.md](./cat-management.md) |
| `/cats/:id/invite` | 邀請共同照護者 | 輸入 email,送出後返回 `/cats/:id` | [cat-management.md](./cat-management.md) |

## 導向規則備忘

- 未登入時存取任何路由 → 導向 `/login`,登入成功後導回原本想進入的路由(見 [login.md](./login.md))
- 登入後若尚未加入任何 `cat_players` → 一律進入 `/`,由首頁自行顯示「還沒有任何貓咪」空狀態,不做額外的路由導向
- `/bowel/calendar` 與 `/bowel/table` 互為切換(頂部列右上角 ⇄ icon);`/weight/chart` 與 `/weight/table` 同理
- 唯一仍用對話框(非獨立路由)處理的操作:`/cats/:id` 頁面上「移除共同照護者」的二次確認,因為只是單一是/否決定,不涉及輸入欄位

## 尚未涵蓋的路由

以下操作在各規格文件中被列為「待確認/開放問題」,尚未定案是否需要獨立路由:

- 刪除貓咪(封存 vs. 硬刪除,待定)
- `/bowel/:id`、`/weight/:id` 是否需要「編輯」而不只是唯讀顯示(目前規格只寫「顯示完整內容」)
