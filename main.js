
import { dbInstance, schoolDocRef } from './config.js';
import { DB_KEY, DEFAULT_DB } from './data.js';
import { views, modals, toast } from './views.js';
import { actions, helpers } from './actions.js';
import { getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = {
    db: {},
    useLocalStorage: false,
    state: {
        currentView: 'dashboard',
        selectedCatId: null,
        calendarDate: new Date(),
        filters: { studentSearch: '', studentSort: 'name_asc', attendanceSearch: '', attendanceSort: 'remaining_desc' },
        historyStudentId: null,
        historyFilter: { search: '', status: 'all' }
    },
    // 掛載模組
    views,
    modals,
    toast,
    actions,
    helpers,

    async init() {
        console.log("App Initializing...");
        let loadSuccess = false;
        if (dbInstance && schoolDocRef) {
            try {
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
                await Promise.race([this.loadData(), timeout]);
                loadSuccess = true;
            } catch (e) { console.warn("Cloud load failed:", e); }
        }
        if (!loadSuccess) {
            this.toast.show('切換至本機模式', 'info');
            this.loadLocalFallback();
        } else {
            this.renderSidebar();
            this.renderView();
        }
        document.getElementById('loading-overlay').classList.add('hidden');
    },

    async loadData() {
        const docSnap = await getDoc(schoolDocRef);
        if (docSnap.exists()) {
            this.db = docSnap.data();
            this.toast.show('雲端資料載入成功', 'info');
        } else {
            this.db = JSON.parse(JSON.stringify(DEFAULT_DB));
            await setDoc(schoolDocRef, this.db);
            this.toast.show('初始化雲端資料庫', 'success');
        }
        this.ensureDbStructure();
    },

    loadLocalFallback() {
        this.useLocalStorage = true;
        const stored = localStorage.getItem(DB_KEY);
        this.db = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_DB));
        this.ensureDbStructure();
        this.renderSidebar();
        this.renderView();
    },

    ensureDbStructure() {
        if(!this.db.sessions) this.db.sessions = [];
        if(!this.db.students) this.db.students = [];
        if(!this.db.categories) this.db.categories = [];
        if(!this.db.topics) this.db.topics = [];
        this.db.categories.forEach(c => {
            if(!c.defaultCredits) c.defaultCredits = 10;
        });
    },

    async saveData() {
        if (this.useLocalStorage) {
            localStorage.setItem(DB_KEY, JSON.stringify(this.db));
        } else if (dbInstance && schoolDocRef) {
            try { await setDoc(schoolDocRef, this.db); } 
            catch (e) { console.error(e); this.toast.show('儲存失敗', 'error'); }
        }
        // 更新畫面
        if(!['students', 'attendance'].includes(this.state.currentView)) this.renderView();
        else {
            if(this.state.currentView === 'students') this.views.renderStudentList();
            if(this.state.currentView === 'attendance') this.views.renderAttendanceList();
        }
    },

    resetData() {
        this.modals.confirm('確定重置資料嗎？', async () => {
            this.db = JSON.parse(JSON.stringify(DEFAULT_DB));
            await this.saveData();
            this.renderView();
            this.toast.show('資料已重置');
        });
    },

    setView(view, params = {}) {
        this.state.currentView = view;
        if(params.catId) this.state.selectedCatId = params.catId;
        this.renderSidebar();
        this.renderView();
    },

    renderSidebar() {
        const menu = [
            { id: 'dashboard', icon: 'fa-chart-pie', label: '總覽' },
            { id: 'categories', icon: 'fa-layer-group', label: '課程類別' },
            { id: 'students', icon: 'fa-users', label: '學生管理' },
            { id: 'calendar', icon: 'fa-calendar-days', label: '課程行事曆' },
            { id: 'attendance', icon: 'fa-clipboard-check', label: '出缺席表' },
        ];
        const html = menu.map(item => `
            <button onclick="app.setView('${item.id}')" 
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${this.state.currentView === item.id ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-50'}">
                <i class="fa-solid ${item.icon} w-5 text-center"></i> ${item.label}
            </button>
        `).join('');
        const nav = document.getElementById('nav-menu');
        if(nav) nav.innerHTML = html;
    },

    renderView() {
        const container = document.getElementById('view-container');
        if(!container) return;
        container.innerHTML = ''; 
        container.className = "p-8 pb-24 max-w-7xl mx-auto min-h-full fade-in";
        switch(this.state.currentView) {
            case 'dashboard': this.views.dashboard(container); break;
            case 'categories': this.views.categories(container); break;
            case 'students': this.views.students(container); break;
            case 'calendar': this.views.calendar(container); break;
            case 'attendance': this.views.attendance(container); break;
            case 'topics': this.views.topics(container); break;
        }
    }
};

// ★ 關鍵：將 app 掛載到全域，讓 HTML 中的 onclick="app.actions..." 可以運作
window.app = app;

// 啟動 App
app.init();
