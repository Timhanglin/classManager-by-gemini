
# EduSchedule Pro 專案架構與功能規格書

## 1. 技術堆疊與環境 (Tech Stack)

*   **核心語言**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3.
*   **樣式框架**: Tailwind CSS (經由 CDN).
*   **圖標庫**: FontAwesome 6.4.0 (經由 CDN).
*   **字體**: Google Fonts (Inter).
*   **資料庫**: 
    *   Primary: Google Firebase Firestore (Web SDK v10.8.0).
    *   Fallback: Browser LocalStorage (當 Firebase 連線失敗時自動切換).
*   **運行環境**: 瀏覽器 (Client-side rendering).

## 2. 資料結構 (Data Schema)

資料儲存於單一巨大的 JSON 物件結構中，主要包含四個陣列：

### 2.1 Categories (課程類別)
*   `id`: String (e.g., 'c1')
*   `name`: String (類別名稱)
*   `description`: String
*   `color`: String (Tailwind class, e.g., 'bg-rose-500')
*   `defaultCredits`: Number (預設購買堂數)

### 2.2 Topics (教學主題)
*   `id`: String (e.g., 't1')
*   `categoryId`: String (關聯 Categories.id)
*   `name`: String
*   `description`: String
*   `estimatedSessions`: Number (預設 1)

### 2.3 Students (學生)
*   `id`: String (e.g., 's1')
*   `name`: String
*   `phone`: String
*   `email`: String
*   `carrierId`: String (載具/會員編號)
*   `note`: String (備註)
*   `enrollments`: Array (購買紀錄)
    *   `categoryId`: String
    *   `totalPurchased`: Number (購買總堂數)
    *   `used`: Number (已使用堂數)

### 2.4 Sessions (課程場次/排程)
*   `id`: String (e.g., 'ses123')
*   `date`: String (YYYY-MM-DD)
*   `time`: String (HH:mm)
*   `categoryId`: String
*   `topicId`: String
*   `attendees`: Array (點名紀錄)
    *   `studentId`: String
    *   `status`: String ('attended' | 'leave' | 'absent' | 'none')
    *   `isRescheduled`: Boolean (是否已補課)

## 3. 核心架構與模式 (Core Architecture)

*   **Singleton Pattern**: 整個應用程式封裝在全域物件 `window.app` 中。
*   **State Management**: 
    *   `app.state` 管理當前視圖 (`currentView`)、篩選條件 (`filters`)、日曆日期 (`calendarDate`) 等。
    *   `app.db` 存放主要資料。
*   **Routing (View Switching)**: 
    *   透過 `app.renderView()` 根據 `currentView` 清空並重繪 `#view-container`。
    *   不使用 URL Hash 路由，為單頁應用 (SPA)。
*   **Initialization**:
    *   `init()`: 嘗試連線 Firebase -> 失敗則載入 LocalStorage (`loadLocalFallback`) -> 渲染畫面。
    *   Failsafe: HTML 中有 5 秒 timeout 機制，若初始化失敗顯示錯誤提示。

## 4. 功能清單 (Feature List)

### 4.1 側邊欄 (Sidebar)
*   導航選單：總覽、課程類別、學生管理、課程行事曆、出缺席表。
*   重置資料功能 (隱藏按鈕)。

### 4.2 總覽 (Dashboard)
*   顯示學生總數卡片。
*   顯示課程類別總數卡片。

### 4.3 課程類別 (Categories)
*   **列表**: 顯示所有類別卡片 (名稱、顏色、主題數)。
*   **新增/編輯**: 
    *   設定名稱、描述、預設堂數、代表顏色。
    *   **快速排課功能**: 在建立類別時，可直接指定開始日期、時間與重複週數，自動生成 `Sessions`。
*   **刪除**: 刪除類別時，會連帶刪除底下的 `Topics`。

### 4.4 主題管理 (Topics) - *Sub-view of Categories*
*   進入方式：點擊類別卡片。
*   功能：新增、編輯、刪除該類別下的教學主題。

### 4.5 學生管理 (Students)
*   **列表**: 
    *   搜尋：支援姓名、電話。
    *   排序：姓名 (A-Z)、剩餘堂數 (少>多 / 多>少)。
    *   顯示：姓名、電話、備註、購買課程的剩餘堂數 Badge。
*   **新增/編輯**:
    *   基本資料：姓名、電話、Email、載具編號、備註。
    *   **購買課程 (Enrollment)**:
        *   新增購買：選擇類別、自動帶入預設堂數。
        *   修改購買：調整總堂數。
        *   刪除購買：移除該類別的購買紀錄。
*   **刪除**: 刪除學生資料。
*   **上課紀錄 (History)** (點擊列表觸發):
    *   **分頁**: 依據學生購買的課程類別切換分頁。
    *   **統計**: 顯示該類別的總堂數、已用、剩餘。
    *   **搜尋**: 支援搜尋「主題名稱」或「日期」(由 `filterStudentHistory` 實作)。
    *   **狀態篩選**: 支援切換「全部」、「出席」、「請假」、「缺席」篩選器，可與文字搜尋同時作用。
    *   **列表**: 顯示日期、出席狀態、主題。
    *   **補課操作**: 針對「請假」或「缺席」的紀錄，可切換「已補課(花)」/「尚未補課(花)」。

### 4.6 課程行事曆 (Calendar)
*   **月曆視圖**: 
    *   切換月份。
    *   顯示每日課程小圓點/條目 (顏色對應類別)。
*   **每日議程 (Agenda Modal)** (點擊日期觸發):
    *   列表：顯示當日所有課程。
    *   操作：點名、編輯場次、刪除場次。
    *   **新增排程**: 選擇類別 -> 選擇主題 (連動) -> 時間 -> 重複週數 (批次建立)。

### 4.7 出缺席表 (Attendance)
*   **統計列表**: 
    *   搜尋：學生姓名。
    *   排序：剩餘堂數、缺席次數、出席次數。
    *   欄位：姓名、出席數、請假數、缺席數、總剩餘堂數。
    *   點擊列可開啟「上課紀錄」視窗。

### 4.8 點名功能 (Roll Call)
*   介面：列出所有購買該類別課程的學生。
*   狀態：到 (Attended)、假 (Leave)、缺 (Absent)。
*   **連動邏輯**: 更改狀態時，會自動計算學生的 `used` (已使用) 堂數。

## 5. 關鍵業務邏輯與注意事項 (Critical Logic)

1.  **扣課機制 (Credit Deduction)**:
    *   位置：`app.actions.updateAttendance`。
    *   邏輯：
        *   狀態為 `attended` (到) 或 `absent` (缺) -> **扣除** 1 堂額度 (`used++`)。
        *   狀態為 `leave` (假) -> **不扣除** 額度 (或是若從 '到' 改為 '假'，則退回額度)。
        *   程式碼會先判斷「舊狀態」是否已扣除，若是則先補回，再依據「新狀態」決定是否扣除。

2.  **搜尋過濾器 (Search Filters)**:
    *   學生列表與出缺席表使用 `app.state.filters` 進行即時過濾。
    *   學生歷史紀錄視窗使用獨立的 `filterStudentHistory` 函式進行 DOM 操作過濾。

3.  **補課狀態 (Rescheduled Status)**:
    *   僅存於 `attendees` 陣列中的物件屬性 `isRescheduled`。
    *   不影響扣課邏輯，僅作為標記。

4.  **HTML Inline Events**:
    *   專案大量使用 `onclick="app.actions..."`。
    *   **注意**: 必須確保 `window.app = app;` 在 `index.js` 底部執行，否則 HTML 無法存取模組內的 `app` 物件。

5.  **Firebase vs LocalStorage**:
    *   初始化時優先嘗試 Firebase。若 config 錯誤或網路超時 (5秒)，自動降級為 LocalStorage。
    *   **注意**: 兩種模式資料**不互通**。

## 6. UI/UX 規範 (UI/UX Standards)

*   **Modal (彈跳視窗)**:
    *   不使用瀏覽器原生 `alert`/`confirm`。
    *   使用 `app.modals.open()` 與 `app.modals.confirm()`。
    *   Confirm Dialog 支援主題色 (rose/red, amber/yellow, indigo/blue)。
*   **Toast (提示訊息)**:
    *   操作成功/失敗需呼叫 `app.toast.show(msg, type)`。
    *   類型：`success` (綠), `error` (紅), `info` (藍)。
*   **Loading**:
    *   全螢幕遮罩 `#loading-overlay` 用於初始化或長時操作。
*   **RWD**:
    *   主要佈局為 Desktop 優先 (Sidebar + Main)，但在 Mobile 上需確保 Grid 系統切換為單欄 (使用 Tailwind `grid-cols-1 md:grid-cols-2`)。
    *   表格與列表在小螢幕需支援橫向捲動或卡片式呈現。
