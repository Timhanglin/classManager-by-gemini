
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// Firebase 配置
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBnu_W2I5kIEDNx66bZxRw94fzZsKvs3hY",
    authDomain: "classmanager-2c72b.firebaseapp.com",
    projectId: "classmanager-2c72b",
    storageBucket: "classmanager-2c72b.firebasestorage.app",
    messagingSenderId: "136976447218",
    appId: "1:136976447218:web:68a7edb1e294537ca0826b",
    measurementId: "G-TKZ9L1NP21"
};

// Initialize Firebase
let dbInstance = null;
let schoolDocRef = null;

try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        const firebaseApp = initializeApp(firebaseConfig);
        dbInstance = getFirestore(firebaseApp);
        schoolDocRef = doc(dbInstance, "schools", "default_school_data");
    }
} catch (error) {
    console.warn("Firebase Init Skipped (Network or Config issue):", error);
}

const DB_KEY = 'edu_vanilla_db_v8_ux_enhanced';
const COLORS = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];

const DEFAULT_DB = {
    categories: [
        { id: 'c1', name: '花藝設計', description: '包含乾燥花與鮮花製作', color: 'bg-rose-500', defaultCredits: 10 },
        { id: 'c2', name: '商業攝影', description: '商品與人像攝影技巧', color: 'bg-indigo-500', defaultCredits: 8 }
    ],
    topics: [
        { id: 't1', categoryId: 'c1', name: '基礎捧花製作', description: '圓形捧花技巧', estimatedSessions: 2 },
        { id: 't2', categoryId: 'c2', name: '自然光運用', description: '室內自然光拍攝', estimatedSessions: 1 }
    ],
    students: [
        { id: 's1', name: '張小美', phone: '0912-345-678', email: 'mei@test.com', carrierId: '/AB1234', note: '喜歡紫色系花材', enrollments: [{ categoryId: 'c1', totalPurchased: 10, used: 1 }] }
    ],
    sessions: [] 
};

const app = {
    db: {},
    useLocalStorage: false,
    state: {
        currentView: 'dashboard',
        selectedCatId: null,
        calendarDate: new Date(),
        filters: {
            studentSearch: '',
            studentSort: 'name_asc',
            attendanceSearch: '',
            attendanceSort: 'remaining_desc'
        },
        historyStudentId: null,
        historyFilter: {
            search: '',
            status: 'all'
        }
    },
    
    async init() {
        console.log("App Initializing...");
        let loadSuccess = false;

        // Try to load from cloud if instance exists
        if (dbInstance && schoolDocRef) {
            try {
                // Increased timeout to 5 seconds for cloud environments
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
                
                await Promise.race([
                    this.loadData(),
                    timeout
                ]);
                loadSuccess = true;
            } catch (e) {
                console.warn("Cloud load failed or timed out, switching to local mode.", e);
            }
        }

        if (!loadSuccess) {
            this.toast.show('無法連線至雲端，已切換至本機模式', 'info');
            this.loadLocalFallback();
        } else {
            this.renderSidebar();
            this.renderView();
        }

        this.toggleLoading(false);
    },

    loadLocalFallback() {
        this.useLocalStorage = true;
        const stored = localStorage.getItem(DB_KEY);
        this.db = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_DB));
        this.ensureDbStructure();
        this.modals.close(); 
        this.renderSidebar();
        this.renderView();
    },

    toggleLoading(show) {
        const el = document.getElementById('loading-overlay');
        if(el) {
            if(show) el.classList.remove('hidden'); else el.classList.add('hidden');
        }
    },

    async loadData() {
        const docSnap = await getDoc(schoolDocRef);
        if (docSnap.exists()) {
            this.db = docSnap.data();
            this.toast.show('已從雲端載入資料', 'info');
        } else {
            // First time, initialize cloud with default
            this.db = JSON.parse(JSON.stringify(DEFAULT_DB));
            await setDoc(schoolDocRef, this.db);
            this.toast.show('雲端資料庫初始化完成', 'success');
        }
        this.ensureDbStructure();
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
        // If using local fallback
        if (this.useLocalStorage) {
            localStorage.setItem(DB_KEY, JSON.stringify(this.db));
        } else if (dbInstance && schoolDocRef) {
            // Save to Firebase
            try {
                await setDoc(schoolDocRef, this.db); 
            } catch (e) {
                console.error("Save Error", e);
                this.toast.show('儲存失敗！請檢查網路', 'error');
            }
        }

        if(!['students', 'attendance'].includes(this.state.currentView)) {
            this.renderView();
        } else {
            if(this.state.currentView === 'students') this.views.renderStudentList();
            if(this.state.currentView === 'attendance') this.views.renderAttendanceList();
        }
    },

    resetData() {
        app.modals.confirm('警告：確定要清空所有資料並恢復預設值嗎？<br>此動作將覆蓋資料，無法復原。', async () => {
            this.db = JSON.parse(JSON.stringify(DEFAULT_DB));
            await this.saveData();
            this.renderView();
            app.toast.show('資料已重置', 'info');
        });
    },

    setView(view, params = {}) {
        this.state.currentView = view;
        if(params.catId) this.state.selectedCatId = params.catId;
        this.renderSidebar();
        this.renderView();
    },

    toast: {
        show(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if(!container) return;
            const el = document.createElement('div');
            el.className = `toast ${type}`;
            let icon = 'fa-check-circle';
            if(type === 'error') icon = 'fa-circle-exclamation';
            if(type === 'info') icon = 'fa-circle-info';

            el.innerHTML = `
                <i class="fa-solid ${icon} text-xl ${type === 'success' ? 'text-emerald-500' : type === 'error' ? 'text-rose-500' : 'text-indigo-500'}"></i>
                <div><h4 class="font-bold text-slate-800 text-sm">${message}</h4></div>
            `;
            container.appendChild(el);
            setTimeout(() => {
                el.classList.add('hiding');
                el.addEventListener('animationend', () => el.remove());
            }, 3000);
        }
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
                <i class="fa-solid ${item.icon} w-5 text-center"></i>
                ${item.label}
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
    },

    views: {
        dashboard(container) {
            const { db } = app;
            container.innerHTML = `
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-slate-800">系統總覽</h2>
                    <p class="text-slate-400 text-sm">歡迎回來，查看目前的課程狀況</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><i class="fa-solid fa-users"></i></div>
                        <div><p class="text-slate-400 font-bold text-sm uppercase tracking-wide">學生總數</p><p class="text-4xl font-black text-slate-800">${db.students.length}</p></div>
                    </div>
                    <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><i class="fa-solid fa-layer-group"></i></div>
                        <div><p class="text-slate-400 font-bold text-sm uppercase tracking-wide">課程類別</p><p class="text-4xl font-black text-slate-800">${db.categories.length}</p></div>
                    </div>
                </div>
            `;
        },
        categories(container) {
            const { db } = app;
            let html = `
                <div class="flex justify-between items-center mb-8">
                    <div><h2 class="text-2xl font-bold">課程類別</h2><p class="text-slate-400 text-sm">建立與管理課程分類</p></div>
                    <button onclick="app.modals.openCategory()" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition transform active:scale-95"><i class="fa-solid fa-plus mr-2"></i>新增類別</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            `;
            if (db.categories.length === 0) html += `<div class="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">尚無類別，請點擊新增</div>`;
            db.categories.forEach(cat => {
                const topicCount = db.topics.filter(t => t.categoryId === cat.id).length;
                html += `
                    <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition group cursor-pointer flex flex-col h-full" onclick="app.setView('topics', {catId: '${cat.id}'})">
                        <div class="flex justify-between items-start mb-6">
                            <div class="w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-md"><i class="fa-solid fa-shapes"></i></div>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="event.stopPropagation(); app.modals.openCategory('${cat.id}')" class="p-2 text-slate-300 hover:text-indigo-600 bg-white rounded-lg hover:bg-indigo-50"><i class="fa-solid fa-pen"></i></button>
                                <button onclick="event.stopPropagation(); app.actions.deleteCategory('${cat.id}')" class="p-2 text-slate-300 hover:text-rose-600 bg-white rounded-lg hover:bg-rose-50"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold text-slate-800 mb-2">${cat.name}</h3>
                        <p class="text-slate-400 text-sm mb-4 flex-grow">${cat.description || '無描述'}</p>
                        <div class="mb-4"><span class="bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-100">預設 ${cat.defaultCredits} 堂</span></div>
                        <div class="pt-4 border-t border-slate-50 flex justify-between items-center">
                            <span class="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">${topicCount} 個主題</span>
                            <span class="text-indigo-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">管理主題 <i class="fa-solid fa-arrow-right"></i></span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html + `</div>`;
        },
        topics(container) {
            const catId = app.state.selectedCatId;
            const cat = app.db.categories.find(c => c.id === catId);
            if(!cat) { app.setView('categories'); return; }
            const topics = app.db.topics.filter(t => t.categoryId === catId);
            container.innerHTML = `
                 <div class="flex items-center gap-4 mb-8">
                    <button onclick="app.setView('categories')" class="w-10 h-10 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition"><i class="fa-solid fa-arrow-left"></i></button>
                    <div><h2 class="text-2xl font-bold">${cat.name} - 主題列表</h2><p class="text-slate-400 text-sm">管理此類別下的教學主題</p></div>
                    <button onclick="app.modals.openTopic('${catId}')" class="ml-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"><i class="fa-solid fa-plus mr-2"></i>新增主題</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${topics.length === 0 ? `<div class="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">此類別尚無主題</div>` : ''}
                    ${topics.map(t => `
                        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                            <div class="flex justify-between items-start mb-4">
                                <h3 class="text-lg font-bold text-slate-800">${t.name}</h3>
                                <div class="flex gap-2">
                                    <button onclick="app.modals.openTopic('${catId}', '${t.id}')" class="text-slate-300 hover:text-indigo-600"><i class="fa-solid fa-pen"></i></button>
                                    <button onclick="app.actions.deleteTopic('${t.id}')" class="text-slate-300 hover:text-rose-600"><i class="fa-solid fa-trash-can"></i></button>
                                </div>
                            </div>
                            <p class="text-slate-400 text-sm mb-4 flex-grow">${t.description || '無描述'}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        },
        students(container) {
            container.innerHTML = `
                <div class="flex justify-between items-center mb-8">
                    <div><h2 class="text-2xl font-bold">學生管理</h2><p class="text-slate-400 text-sm">管理學生與課程額度</p></div>
                    <button onclick="app.modals.openStudent()" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"><i class="fa-solid fa-plus mr-2"></i>新增學生</button>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex gap-4">
                    <div class="flex-1 relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="搜尋姓名或電話..." 
                            oninput="app.state.filters.studentSearch = this.value; app.views.renderStudentList();"
                            class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold text-slate-700">
                    </div>
                    <div class="w-48">
                        <select onchange="app.state.filters.studentSort = this.value; app.views.renderStudentList();"
                            class="w-full h-full px-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold text-slate-600 border-r-8 border-transparent">
                            <option value="name_asc">姓名 (A-Z)</option>
                            <option value="credits_asc">剩餘堂數 (少到多)</option>
                            <option value="credits_desc">剩餘堂數 (多到少)</option>
                        </select>
                    </div>
                </div>
                <div id="student-list-container" class="space-y-4"></div>
            `;
            this.renderStudentList();
        },
        renderStudentList() {
            const container = document.getElementById('student-list-container');
            if(!container) return;
            const { db } = app;
            const { studentSearch, studentSort } = app.state.filters;
            let filtered = db.students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.phone && s.phone.includes(studentSearch)));
            filtered.sort((a, b) => {
                const getRemaining = (stu) => stu.enrollments.reduce((sum, e) => sum + (e.totalPurchased - e.used), 0);
                if(studentSort === 'name_asc') return a.name.localeCompare(b.name, "zh-Hant");
                if(studentSort === 'credits_asc') return getRemaining(a) - getRemaining(b);
                if(studentSort === 'credits_desc') return getRemaining(b) - getRemaining(a);
                return 0;
            });
            if (filtered.length === 0) {
                container.innerHTML = `<div class="py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">找不到符合的學生資料</div>`;
                return;
            }
            let html = '';
            filtered.forEach(s => {
                 html += `
                    <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start gap-6 group hover:shadow-lg transition">
                        <div class="flex items-center gap-6 flex-1 w-full cursor-pointer" onclick="app.modals.openStudent('${s.id}')">
                            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center font-black text-slate-300 text-2xl border-4 border-white shadow-sm group-hover:border-indigo-100 transition-colors flex-shrink-0">${s.name[0]}</div>
                            <div class="flex-grow">
                                <h3 class="text-xl font-bold text-slate-800">${s.name}</h3>
                                <p class="text-slate-400 text-sm mb-1">${s.phone || '無電話'}</p>
                                ${s.note ? `<div class="flex items-start gap-1 mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100"><i class="fa-regular fa-note-sticky mt-0.5 text-indigo-400"></i> ${s.note}</div>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center justify-between w-full md:w-auto gap-6 self-center">
                            <div class="flex gap-2 flex-wrap justify-end">
                                ${s.enrollments.map(e => {
                                    const c = db.categories.find(cat => cat.id === e.categoryId);
                                    const remaining = e.totalPurchased - e.used;
                                    const badgeColor = remaining <= 2 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600';
                                    return c ? `<span class="px-3 py-1 ${badgeColor} rounded-lg text-xs font-bold">${c.name}: 剩 ${remaining}</span>` : '';
                                }).join('')}
                            </div>
                            <button onclick="app.actions.deleteStudent('${s.id}')" class="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"><i class="fa-solid fa-trash-can text-lg"></i></button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        },
        calendar(container) {
            const today = app.state.calendarDate;
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay();
            let html = `
                <div class="flex justify-between items-center mb-8">
                    <div><h2 class="text-2xl font-bold">課程行事曆</h2><p class="text-slate-400 text-sm">點擊日期安排課程 (支援週期排程)</p></div>
                </div>
                <div class="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="text-2xl font-black text-slate-800">${year}年 ${month + 1}月</h3>
                        <div class="flex gap-2">
                            <button onclick="app.helpers.changeMonth(-1)" class="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100"><i class="fa-solid fa-chevron-left"></i></button>
                            <button onclick="app.helpers.changeMonth(0)" class="px-4 py-3 bg-slate-50 rounded-2xl hover:bg-slate-100 font-bold text-sm">今天</button>
                            <button onclick="app.helpers.changeMonth(1)" class="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div class="grid grid-cols-7 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
                        ${['日','一','二','三','四','五','六'].map(d => `<div class="bg-slate-50/80 p-4 text-center text-xs font-black text-slate-400">${d}</div>`).join('')}
                        ${Array(firstDay).fill('<div class="bg-white h-32"></div>').join('')}
                        ${Array.from({length: daysInMonth}, (_, i) => {
                            const d = i + 1;
                            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                            const sessions = app.db.sessions.filter(s => s.date === dateStr);
                            return `
                                <div onclick="app.modals.openAgenda('${dateStr}')" class="bg-white h-32 p-3 border-t border-l border-slate-50 cursor-pointer hover:bg-indigo-50/30 group relative transition-colors">
                                    <span class="text-sm font-bold ${new Date().toDateString() === new Date(dateStr).toDateString() ? 'text-white bg-indigo-600 w-6 h-6 rounded-full inline-flex items-center justify-center' : 'text-slate-700'}">${d}</span>
                                    <div class="mt-2 space-y-1 overflow-y-auto max-h-[4.5rem] no-scrollbar">
                                        ${sessions.map(s => {
                                            const c = app.db.categories.find(cat => cat.id === s.categoryId);
                                            return `<div class="text-[9px] font-bold text-white px-2 py-1 rounded-md truncate ${c ? c.color : 'bg-gray-400'}">${s.time} ${c ? c.name : ''}</div>`;
                                        }).join('')}
                                    </div>
                                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                        <span class="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-lg">+ 安排</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            container.innerHTML = html;
        },
        attendance(container) {
            container.innerHTML = `
                 <div class="mb-8"><h2 class="text-2xl font-bold">出缺席統計</h2><p class="text-slate-400 text-sm">點擊學生列表可查看詳細課程紀錄</p></div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex gap-4">
                    <div class="flex-1 relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="搜尋學生姓名..." 
                            oninput="app.state.filters.attendanceSearch = this.value; app.views.renderAttendanceList();"
                            class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold text-slate-700">
                    </div>
                    <div class="w-48">
                        <select onchange="app.state.filters.attendanceSort = this.value; app.views.renderAttendanceList();"
                            class="w-full h-full px-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold text-slate-600 border-r-8 border-transparent">
                            <option value="remaining_desc">剩餘堂數 (多到少)</option>
                            <option value="remaining_asc">剩餘堂數 (少到多)</option>
                            <option value="absent_desc">缺席次數 (多到少)</option>
                            <option value="attended_desc">出席次數 (多到少)</option>
                        </select>
                    </div>
                </div>
                 <div class="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th class="p-6 text-xs font-bold text-slate-400 uppercase">學生姓名</th>
                                <th class="p-6 text-xs font-bold text-slate-400 uppercase text-center">出席</th>
                                <th class="p-6 text-xs font-bold text-slate-400 uppercase text-center">請假</th>
                                <th class="p-6 text-xs font-bold text-slate-400 uppercase text-center">缺席</th>
                                <th class="p-6 text-xs font-bold text-slate-400 uppercase text-right">總剩餘堂數</th>
                            </tr>
                        </thead>
                        <tbody id="attendance-list-container" class="divide-y divide-slate-50"></tbody>
                    </table>
                </div>
            `;
            this.renderAttendanceList();
        },
        renderAttendanceList() {
            const container = document.getElementById('attendance-list-container');
            if(!container) return;
            const { db } = app;
            const { attendanceSearch, attendanceSort } = app.state.filters;
            let stats = db.students.map(s => {
                let attended=0, leave=0, absent=0, remaining=0;
                db.sessions.forEach(ses => {
                    const rec = (ses.attendees || []).find(a => a.studentId === s.id);
                    if(rec) {
                        if(rec.status === 'attended') attended++;
                        if(rec.status === 'leave') leave++;
                        if(rec.status === 'absent') absent++;
                    }
                });
                s.enrollments.forEach(e => remaining += (e.totalPurchased - e.used));
                return { ...s, attended, leave, absent, remaining };
            });
            stats = stats.filter(s => s.name.toLowerCase().includes(attendanceSearch.toLowerCase()));
            stats.sort((a, b) => {
                if(attendanceSort === 'remaining_desc') return b.remaining - a.remaining;
                if(attendanceSort === 'remaining_asc') return a.remaining - b.remaining;
                if(attendanceSort === 'absent_desc') return b.absent - a.absent;
                if(attendanceSort === 'attended_desc') return b.attended - a.attended;
                return 0;
            });
            if (stats.length === 0) {
                container.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-400">找不到符合的學生資料</td></tr>`;
                return;
            }
            let html = '';
            stats.forEach(s => {
                html += `
                    <tr class="clickable-row transition" onclick="app.modals.openStudentHistory('${s.id}')">
                        <td class="p-6 font-bold text-slate-800 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">${s.name[0]}</div>
                            ${s.name} <span class="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md ml-2">查看詳情</span>
                        </td>
                        <td class="p-6 text-center text-emerald-600 font-bold">${s.attended}</td>
                        <td class="p-6 text-center text-amber-500 font-bold">${s.leave}</td>
                        <td class="p-6 text-center text-rose-500 font-bold">${s.absent}</td>
                        <td class="p-6 text-right"><span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-black">${s.remaining}</span></td>
                    </tr>
                `;
            });
            container.innerHTML = html;
        }
    },

    actions: {
        saveCategory(e, id) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Extract quick schedule fields
            const scheduleDate = data.scheduleDate;
            const scheduleTime = data.scheduleTime;
            const scheduleRepeat = Number(data.scheduleRepeat);
            
            // Remove them from data so they don't pollute the Category object
            delete data.scheduleDate;
            delete data.scheduleTime;
            delete data.scheduleRepeat;

            // 1. Save or Update Category
            let targetCatId = id;
            if(id) {
                const idx = app.db.categories.findIndex(c => c.id === id);
                if(idx !== -1) app.db.categories[idx] = { ...app.db.categories[idx], ...data };
            } else {
                targetCatId = 'c' + Date.now();
                app.db.categories.push({ id: targetCatId, ...data });
            }

            // 2. Handle Quick Schedule Generation
            if (scheduleDate && scheduleTime && scheduleRepeat > 0) {
                let currentDate = new Date(scheduleDate);
                let sessionsCreated = 0;

                for (let i = 0; i < scheduleRepeat; i++) {
                    const dStr = currentDate.toISOString().split('T')[0];
                    app.db.sessions.push({
                        id: 'ses' + Date.now() + Math.random().toString(36).substr(2, 9), // Ensure unique ID
                        date: dStr,
                        time: scheduleTime,
                        categoryId: targetCatId,
                        topicId: '', // Quick schedule usually doesn't select a topic yet
                        attendees: []
                    });
                    // Add 7 days for next session
                    currentDate.setDate(currentDate.getDate() + 7);
                    sessionsCreated++;
                }
                
                if(sessionsCreated > 0) {
                    // Show a separate toast for schedule creation, or combine with save message
                    setTimeout(() => app.toast.show(`已自動安排 ${sessionsCreated} 堂課程`, 'success'), 500);
                }
            }

            app.saveData();
            app.modals.close();
            app.toast.show('類別已儲存');
        },
        deleteCategory(id) {
            app.modals.confirm('確定刪除此類別？相關的主題也會被移除。', () => {
                app.db.categories = app.db.categories.filter(c => c.id !== id);
                app.db.topics = app.db.topics.filter(t => t.categoryId !== id);
                app.saveData();
                app.toast.show('類別已刪除');
            });
        },
        saveTopic(e, catId, id) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            if(id) {
                const idx = app.db.topics.findIndex(t => t.id === id);
                if(idx !== -1) app.db.topics[idx] = { ...app.db.topics[idx], ...data };
            } else {
                app.db.topics.push({ id: 't' + Date.now(), categoryId: catId, ...data });
            }
            app.saveData();
            app.modals.close();
            app.setView('topics', {catId});
            app.toast.show('主題已儲存');
        },
        deleteTopic(id) {
            app.modals.confirm('確定刪除此主題？', () => {
                const t = app.db.topics.find(t => t.id === id);
                const catId = t ? t.categoryId : null;
                app.db.topics = app.db.topics.filter(t => t.id !== id);
                app.saveData();
                if(catId) app.setView('topics', {catId});
                app.toast.show('主題已刪除');
            });
        },
        saveStudent(e, id) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Handle new enrollment from create form specifically
            let newEnrollment = null;
            if(data.initialCatId && data.initialCredits) {
                newEnrollment = {
                    categoryId: data.initialCatId,
                    totalPurchased: Number(data.initialCredits),
                    used: 0
                };
            }
            // Clean up temp fields
            delete data.initialCatId;
            delete data.initialCredits;

            if(id) {
                const idx = app.db.students.findIndex(s => s.id === id);
                if(idx !== -1) app.db.students[idx] = { ...app.db.students[idx], ...data };
            } else {
                const newStudent = { 
                    id: 's' + Date.now(), 
                    ...data, 
                    enrollments: newEnrollment ? [newEnrollment] : [] 
                };
                app.db.students.push(newStudent);
            }
            app.saveData();
            app.modals.close();
            app.toast.show('學生資料已儲存');
        },
        deleteStudent(id) {
            app.modals.confirm('確定刪除此學生？所有的紀錄將無法復原。', () => {
                app.db.students = app.db.students.filter(s => s.id !== id);
                app.saveData();
                app.toast.show('學生已刪除');
            });
        },
        addEnrollment(studentId) {
            const catId = document.getElementById('new-enroll-cat').value;
            const credits = document.getElementById('new-enroll-credits').value;
            if(!catId || !credits) return app.toast.show('請選擇課程並輸入堂數', 'error');
            
            const s = app.db.students.find(s => s.id === studentId);
            if(s) {
                s.enrollments.push({ categoryId: catId, totalPurchased: Number(credits), used: 0 });
                app.saveData();
                app.modals.openStudent(studentId); // Refresh
                app.toast.show('已購買課程');
            }
        },
        updateEnrollment(studentId, idx, value) {
             const s = app.db.students.find(s => s.id === studentId);
             if(s && s.enrollments[idx]) {
                 s.enrollments[idx].totalPurchased = Number(value);
                 app.saveData();
             }
        },
        removeEnrollment(studentId, idx, name) {
            if(confirm(`確定刪除 ${name} 的購買紀錄嗎？`)) {
                const s = app.db.students.find(s => s.id === studentId);
                if(s) {
                    s.enrollments.splice(idx, 1);
                    app.saveData();
                    app.modals.openStudent(studentId);
                }
            }
        },
        addSession(e, dateStr) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const repeat = Number(data.repeat) || 1;
            
            let currentDate = new Date(dateStr);
            
            for(let i=0; i<repeat; i++) {
                const dStr = currentDate.toISOString().split('T')[0];
                app.db.sessions.push({
                    id: 'ses' + Date.now() + i,
                    date: dStr,
                    time: data.time,
                    categoryId: data.categoryId,
                    topicId: data.topicId,
                    attendees: []
                });
                currentDate.setDate(currentDate.getDate() + 7);
            }
            
            app.saveData();
            app.modals.openAgenda(dateStr); // Refresh current view
            app.toast.show(`已安排 ${repeat} 堂課程`);
        },
        updateSession(e, id) {
             e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const idx = app.db.sessions.findIndex(s => s.id === id);
            if(idx !== -1) {
                app.db.sessions[idx] = { ...app.db.sessions[idx], ...data };
                app.saveData();
                app.modals.close();
                app.modals.openAgenda(data.date);
                app.toast.show('課程已更新');
            }
        },
        deleteSession(id) {
             app.modals.confirm('確定刪除此課程場次？', () => {
                const s = app.db.sessions.find(s => s.id === id);
                const d = s ? s.date : null;
                app.db.sessions = app.db.sessions.filter(x => x.id !== id);
                app.saveData();
                if(d) app.modals.openAgenda(d);
                app.toast.show('課程已刪除');
            });
        },
        updateAttendance(sessionId, studentId, status) {
            const session = app.db.sessions.find(s => s.id === sessionId);
            const student = app.db.students.find(s => s.id === studentId);
            if(!session || !student) return;

            if(!session.attendees) session.attendees = [];
            let record = session.attendees.find(a => a.studentId === studentId);
            
            // Logic to update credits
            const enrollment = student.enrollments.find(e => e.categoryId === session.categoryId);
            
            if(!record) {
                record = { studentId, status: 'none' };
                session.attendees.push(record);
            }

            const oldStatus = record.status;
            
            // Restore credit if previously deducted
            if(enrollment && (oldStatus === 'attended' || oldStatus === 'absent')) {
                enrollment.used--;
            }

            // Set new status
            record.status = status;

            // Deduct credit if new status requires it
            if(enrollment && (status === 'attended' || status === 'absent')) {
                enrollment.used++;
            }

            app.saveData();
            app.modals.openRollCall(sessionId);
        }
    },

    modals: {
        open(html, maxWidth = 'max-w-lg') {
            const content = document.getElementById('modal-content');
            if(!content) return;
            content.className = `bg-white w-full ${maxWidth} rounded-[2rem] p-8 shadow-2xl scale-in-center relative max-h-[90vh] overflow-y-auto no-scrollbar transition-all duration-300`;
            content.innerHTML = `
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition"><i class="fa-solid fa-xmark fa-xl"></i></button>
                ${html}
            `;
            const overlay = document.getElementById('modal-overlay');
            if(overlay) overlay.classList.remove('hidden');
        },
        close() {
            const overlay = document.getElementById('modal-overlay');
            if(overlay) overlay.classList.add('hidden');
        },
        confirm(message, callback, title = '確認刪除', theme = 'rose') {
            const themeColors = {
                rose: { bg: 'bg-rose-50', text: 'text-rose-500', btn: 'bg-rose-500', shadow: 'shadow-rose-100' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-500', btn: 'bg-amber-500', shadow: 'shadow-amber-100' },
                indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', btn: 'bg-indigo-600', shadow: 'shadow-indigo-100' }
            };
            const t = themeColors[theme] || themeColors.rose;
            
            this.open(`
                <div class="text-center">
                    <div class="w-20 h-20 ${t.bg} ${t.text} rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3 class="text-2xl font-bold text-slate-800 mb-2">${title}</h3>
                    <p class="text-slate-400 mb-8">${message.replace(/\n/g, '<br>')}</p>
                    <div class="flex gap-4">
                        <button onclick="app.modals.close()" class="flex-1 py-4 bg-slate-50 text-slate-400 font-bold rounded-2xl hover:bg-slate-100 transition">取消</button>
                        <button id="confirm-btn-action" class="flex-1 py-4 ${t.btn} text-white font-bold rounded-2xl shadow-xl ${t.shadow} hover:shadow-none hover:translate-y-1 transition">確定執行</button>
                    </div>
                </div>
            `);
            setTimeout(() => { const btn = document.getElementById('confirm-btn-action'); if(btn) btn.onclick = () => { callback(); app.modals.close(); }; }, 0);
        },
        openStudentHistory(studentId, catId = null) {
            const s = app.db.students.find(s => s.id === studentId);
            if(!s) return;
            
            const enrollments = s.enrollments;
            if (enrollments.length === 0) {
                 this.open(`<div class="text-center p-8 text-slate-400">此學生尚未購買任何課程</div>`);
                 return;
            }

            const activeCatId = catId || enrollments[0].categoryId;
            const activeEnrollment = enrollments.find(e => e.categoryId === activeCatId);
            const activeCategory = app.db.categories.find(c => c.id === activeCatId);

            // Filter sessions for this category to calculate stats (stats are for the whole category, unrelated to search)
            const allSessions = app.db.sessions
                .filter(ses => ses.categoryId === activeCatId);

            let stats = { attended: 0, leave: 0, absent: 0, none: 0 };
            
            allSessions.forEach(ses => {
                const rec = (ses.attendees || []).find(a => a.studentId === studentId);
                const st = rec ? rec.status : 'none';
                if(stats[st] !== undefined) stats[st]++;
            });

            const remaining = activeEnrollment ? (activeEnrollment.totalPurchased - activeEnrollment.used) : 0;
            
            // Initialize status filter
            app.state.historyFilter.status = 'all';

            this.open(`
                <div class="mb-6">
                    <h3 class="text-2xl font-bold text-slate-800">${s.name} - 上課紀錄</h3>
                    <p class="text-sm text-slate-400">詳細出缺席與補課狀況</p>
                </div>

                <!-- Tabs -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                    ${enrollments.map(e => {
                        const c = app.db.categories.find(cat => cat.id === e.categoryId);
                        const isActive = e.categoryId === activeCatId;
                        return `
                            <button onclick="app.modals.openStudentHistory('${studentId}', '${e.categoryId}')" 
                                class="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
                                ${c ? c.name : 'Unknown'}
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-3 gap-3 mb-6">
                    <div class="bg-indigo-50 p-3 rounded-xl text-center">
                        <div class="text-xs font-bold text-indigo-400 uppercase">總堂數</div>
                        <div class="text-xl font-black text-indigo-600">${activeEnrollment?.totalPurchased || 0}</div>
                    </div>
                     <div class="bg-emerald-50 p-3 rounded-xl text-center">
                        <div class="text-xs font-bold text-emerald-400 uppercase">已用</div>
                        <div class="text-xl font-black text-emerald-600">${activeEnrollment?.used || 0}</div>
                    </div>
                    <div class="bg-slate-100 p-3 rounded-xl text-center">
                        <div class="text-xs font-bold text-slate-400 uppercase">剩餘</div>
                        <div class="text-xl font-black text-slate-600">${remaining}</div>
                    </div>
                </div>

                <!-- Search Input -->
                <div class="relative mb-4">
                    <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" id="history-search-input" placeholder="搜尋主題名稱或日期..." 
                        oninput="app.modals.filterStudentHistory(this.value, null, '${studentId}', '${activeCatId}')"
                        class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold text-slate-700">
                </div>

                <!-- Status Filters -->
                <div class="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                    <button id="filter-btn-all" onclick="app.modals.filterStudentHistory(null, 'all', '${studentId}', '${activeCatId}')" class="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white shadow-md transition whitespace-nowrap">全部</button>
                    <button id="filter-btn-attended" onclick="app.modals.filterStudentHistory(null, 'attended', '${studentId}', '${activeCatId}')" class="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition whitespace-nowrap">出席</button>
                    <button id="filter-btn-leave" onclick="app.modals.filterStudentHistory(null, 'leave', '${studentId}', '${activeCatId}')" class="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition whitespace-nowrap">請假</button>
                    <button id="filter-btn-absent" onclick="app.modals.filterStudentHistory(null, 'absent', '${studentId}', '${activeCatId}')" class="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition whitespace-nowrap">缺席</button>
                </div>

                <!-- List Container -->
                <div id="history-session-list" class="space-y-3 max-h-[45vh] overflow-y-auto pr-1"></div>
            `, 'max-w-xl');

            // Populate list initially with empty search
            this.filterStudentHistory('', 'all', studentId, activeCatId);
        },

        filterStudentHistory(term = null, status = null, studentId, catId) {
            const container = document.getElementById('history-session-list');
            const inputEl = document.getElementById('history-search-input');
            if(!container) return;

            // 1. Determine current values. If argument is null, use current state/DOM
            const currentTerm = term !== null ? term : (inputEl ? inputEl.value : '');
            if(status) app.state.historyFilter.status = status;
            const currentStatus = app.state.historyFilter.status || 'all';

            // 2. Filter Logic
            let sessions = app.db.sessions
                .filter(ses => ses.categoryId === catId)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Filter by Status
            sessions = sessions.filter(ses => {
                const rec = (ses.attendees || []).find(a => a.studentId === studentId);
                const s = rec ? rec.status : 'none';
                if (currentStatus === 'all') return true;
                return s === currentStatus;
            });

            // Filter by Search Term
            if(currentTerm) {
                const lower = currentTerm.toLowerCase();
                sessions = sessions.filter(s => {
                    const t = app.db.topics.find(top => top.id === s.topicId);
                    const name = t ? t.name : '';
                    return name.toLowerCase().includes(lower) || s.date.includes(lower);
                });
            }

            // 3. Update Filter Buttons Visuals
            ['all', 'attended', 'leave', 'absent'].forEach(key => {
                const btn = document.getElementById(`filter-btn-${key}`);
                if(btn) {
                    if(key === currentStatus) {
                        btn.className = "flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white shadow-md transition whitespace-nowrap";
                    } else {
                        btn.className = "flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition whitespace-nowrap";
                    }
                }
            });

            // 4. Render List
            if(sessions.length === 0) {
                container.innerHTML = '<div class="text-center text-slate-400 py-4">查無符合的課程紀錄</div>';
                return;
            }

            container.innerHTML = sessions.map(ses => {
                const rec = (ses.attendees || []).find(a => a.studentId === studentId);
                const statusStr = rec ? rec.status : 'none';
                const isRescheduled = rec ? rec.isRescheduled : false;
                const topic = app.db.topics.find(t => t.id === ses.topicId);
                
                const statusBadge = {
                    'attended': '<span class="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold">出席</span>',
                    'leave': '<span class="bg-amber-100 text-amber-600 px-2 py-1 rounded text-xs font-bold">請假</span>',
                    'absent': '<span class="bg-rose-100 text-rose-600 px-2 py-1 rounded text-xs font-bold">缺席</span>',
                    'none': '<span class="bg-slate-100 text-slate-400 px-2 py-1 rounded text-xs font-bold">未點名</span>'
                }[statusStr];

                const showRescheduleBtn = (statusStr === 'leave' || statusStr === 'absent');

                return `
                    <div class="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-bold text-slate-500">${ses.date}</span>
                                ${statusBadge}
                                ${isRescheduled ? '<span class="bg-amber-100 text-amber-600 px-2 py-1 rounded text-xs font-bold"><i class="fa-solid fa-check mr-1"></i>已補</span>' : ''}
                            </div>
                            <div class="text-sm font-bold text-slate-700">${topic?.name || '無主題'}</div>
                        </div>
                        <div>
                            ${showRescheduleBtn ? 
                                `<button onclick="app.modals.toggleRescheduled('${ses.id}', '${studentId}', '${catId}')" class="text-xs font-bold px-3 py-1.5 rounded-lg border ${isRescheduled ? 'border-amber-200 text-amber-500 bg-amber-50' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}">
                                    ${isRescheduled ? '已補課(花)' : '尚未補課(花)'}
                                </button>` : ''
                            }
                        </div>
                    </div>
                `;
            }).join('');
        },

        openCategory(id = null) {
            const cat = id ? app.db.categories.find(c => c.id === id) : null;
            const todayStr = new Date().toISOString().split('T')[0];
            this.open(`
                <h3 class="text-2xl font-bold mb-6 text-slate-800">${cat ? '編輯' : '新增'}課程類別</h3>
                <form onsubmit="app.actions.saveCategory(event, '${id || ''}')">
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">名稱</label>
                    <input type="text" name="name" value="${cat?.name || ''}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-100">
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">描述</label>
                    <input type="text" name="description" value="${cat?.description || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-100">
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-2">課堂總數 (預設)</label>
                        <div class="relative"><input type="number" name="defaultCredits" value="${cat?.defaultCredits || 10}" min="1" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-indigo-600"><div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">堂</div></div>
                    </div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-3">代表顏色</label>
                    <div class="flex gap-3 mb-8">
                        ${COLORS.map(c => `<label class="cursor-pointer"><input type="radio" name="color" value="${c}" class="peer sr-only" ${(cat?.color === c || (!cat && c===COLORS[0])) ? 'checked' : ''}><div class="w-10 h-10 rounded-full ${c} peer-checked:ring-4 ring-offset-2 ring-indigo-200 transition-all hover:scale-110"></div></label>`).join('')}
                    </div>
                    <div class="border-t border-slate-100 pt-6 mt-6">
                        <h4 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><i class="fa-solid fa-calendar-plus text-indigo-500"></i> 快速排課 (選填)</h4>
                        <div class="bg-slate-50 p-4 rounded-xl space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">開始日期</label><input type="date" name="scheduleDate" min="${todayStr}" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none"></div>
                                <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">時間</label><input type="time" name="scheduleTime" value="14:00" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none"></div>
                            </div>
                            <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">重複週數 (1=僅單次)</label><input type="number" name="scheduleRepeat" value="1" min="1" max="24" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none"></div>
                        </div>
                    </div>
                    <button class="w-full py-4 mt-6 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-none hover:translate-y-1 transition-all">儲存類別</button>
                </form>
            `);
        },
        openTopic(catId, topicId = null) {
            const topic = topicId ? app.db.topics.find(t => t.id === topicId) : null;
            this.open(`
                <h3 class="text-2xl font-bold mb-6 text-slate-800">${topic ? '編輯' : '新增'}主題</h3>
                <form onsubmit="app.actions.saveTopic(event, '${catId}', '${topicId || ''}')">
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">主題名稱</label>
                    <input type="text" name="name" value="${topic?.name || ''}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-100">
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">內容描述</label>
                    <textarea name="description" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 h-24 resize-none outline-none focus:ring-2 focus:ring-indigo-100">${topic?.description || ''}</textarea>
                    <input type="hidden" name="estimatedSessions" value="1">
                    <button class="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-none hover:translate-y-1 transition-all">儲存主題</button>
                </form>
            `);
        },
        openStudent(id = null) {
            const stu = id ? app.db.students.find(s => s.id === id) : null;
            const cats = app.db.categories;
            let enrollmentsHtml = '';
            if(stu) {
                enrollmentsHtml = `
                    <div class="bg-slate-50 p-5 rounded-2xl mb-6">
                        <h4 class="text-xs font-bold text-slate-400 uppercase mb-4">已購買課程</h4>
                        <div class="space-y-3">
                            ${stu.enrollments.map((e, idx) => {
                                const c = cats.find(cat => cat.id === e.categoryId);
                                return `<div class="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm"><span class="font-bold text-slate-700 flex-1">${c ? c.name : 'Unknown'}</span><div class="flex items-center gap-2"><span class="text-xs text-slate-400">總數:</span><input type="number" value="${e.totalPurchased}" onchange="app.actions.updateEnrollment('${stu.id}', ${idx}, this.value)" class="w-16 bg-slate-100 rounded p-1 text-center font-bold text-indigo-600"><button type="button" onclick="app.actions.removeEnrollment('${stu.id}', ${idx}, '${c ? c.name : '未知課程'}')" class="w-8 h-8 flex items-center justify-center text-white bg-rose-400 hover:bg-rose-600 rounded-lg shadow-sm transition-colors"><i class="fa-solid fa-trash-can"></i></button></div></div>`;
                            }).join('')}
                        </div>
                        <div class="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                            <select id="new-enroll-cat" onchange="app.helpers.updateDefaultCredits(this.value)" class="flex-1 bg-white border border-slate-200 p-2 rounded-xl text-sm outline-none"><option value="">選擇課程...</option>${cats.map(c => `<option value="${c.id}" data-credits="${c.defaultCredits}">${c.name}</option>`).join('')}</select>
                            <input type="number" id="new-enroll-credits" placeholder="總數" class="w-20 bg-white border border-slate-200 p-2 rounded-xl text-center font-bold text-indigo-600">
                            <button type="button" onclick="app.actions.addEnrollment('${stu.id}')" class="bg-indigo-600 text-white px-4 rounded-xl font-bold text-sm">購買</button>
                        </div>
                    </div>
                `;
            } else {
                 enrollmentsHtml = `<div class="bg-slate-50 p-5 rounded-2xl mb-6"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">初始購買課程 (選填)</label><div class="flex gap-2"><select name="initialCatId" id="init-cat-select" onchange="const c = this.options[this.selectedIndex].dataset.credits; document.getElementById('init-credits').value = c || 10;" class="flex-1 bg-white border border-slate-200 p-3 rounded-xl outline-none"><option value="">無</option>${cats.map(c => `<option value="${c.id}" data-credits="${c.defaultCredits}">${c.name}</option>`).join('')}</select><input type="number" id="init-credits" name="initialCredits" placeholder="總數" class="w-20 bg-white border border-slate-200 p-3 rounded-xl text-center font-bold"></div></div>`;
            }
            this.open(`
                <h3 class="text-2xl font-bold mb-6 text-slate-800">${stu ? '編輯學生' : '新增學生'}</h3>
                <form onsubmit="app.actions.saveStudent(event, '${id || ''}')">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div><label class="block text-xs font-bold text-slate-400 uppercase mb-2">姓名</label><input type="text" name="name" value="${stu?.name || ''}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100"></div>
                        <div><label class="block text-xs font-bold text-slate-400 uppercase mb-2">電話</label><input type="text" name="phone" value="${stu?.phone || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100"></div>
                    </div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Email</label>
                    <input type="email" name="email" value="${stu?.email || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-100">
                    
                    <!-- 新增欄位：載具與會員 -->
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">載具與會員</label>
                    <input type="text" name="carrierId" value="${stu?.carrierId || ''}" placeholder="例如: /AB1234" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-100">
                    
                    <!-- 新增欄位：備註 -->
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">備註</label>
                    <textarea name="note" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 h-20 resize-none outline-none focus:ring-2 focus:ring-indigo-100">${stu?.note || ''}</textarea>

                    ${enrollmentsHtml}
                    <button class="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 hover:shadow-none hover:translate-y-1 transition-all">儲存資料</button>
                </form>
            `);
        },
        openAgenda(dateStr) {
            const sessions = app.db.sessions.filter(s => s.date === dateStr);
            let html = `
                <div class="flex justify-between items-center mb-6">
                     <h3 class="text-2xl font-bold text-slate-800">${dateStr}</h3>
                     <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">${sessions.length} 堂課</span>
                </div>
                <!-- 
                  Updated List Container: 
                  Increased max-height to 60vh because the form is now collapsible, saving space.
                -->
                <div class="space-y-3 mb-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                    ${sessions.length === 0 ? '<div class="text-center text-slate-400 py-4 bg-slate-50 rounded-2xl">今日無課程</div>' : ''}
                    ${sessions.map(s => {
                        const cat = app.db.categories.find(c => c.id === s.categoryId);
                        const topic = app.db.topics.find(t => t.id === s.topicId);
                        return `
                            <div class="bg-white border border-slate-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-[10px] font-bold text-white px-2 py-1 rounded ${cat?.color || 'bg-gray-400'}">${s.time}</span>
                                        <span class="text-xs font-bold text-slate-500">${cat?.name}</span>
                                    </div>
                                    <p class="text-lg font-black text-slate-800 tracking-tight">${topic?.name || '無主題'}</p>
                                </div>
                                <div class="flex gap-2">
                                    <!-- 
                                      Updated Buttons: 
                                      Increased padding (px-3 py-2.5) and adjusted font size/icons for easier touch access.
                                    -->
                                    <button onclick="app.modals.openRollCall('${s.id}')" class="bg-emerald-50 text-emerald-600 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 flex items-center gap-1"><i class="fa-solid fa-check"></i> 點名</button>
                                    <button onclick="app.modals.openEditSession('${s.id}')" class="bg-slate-100 text-slate-500 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 hover:text-slate-700"><i class="fa-solid fa-pen"></i></button>
                                    <button onclick="app.actions.deleteSession('${s.id}')" class="bg-rose-50 text-rose-500 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-100"><i class="fa-solid fa-trash-can"></i></button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <!-- 
                  Updated Footer: 
                  Collapsible "Accordion" style for Adding New Session to save space.
                -->
                <div class="pt-4 border-t border-slate-100">
                    <button onclick="document.getElementById('add-session-form').classList.toggle('hidden'); this.querySelector('.fa-chevron-down').classList.toggle('rotate-180');" class="w-full flex justify-between items-center text-left font-bold text-slate-800 hover:bg-slate-50 p-2 rounded-xl transition group">
                        <span class="flex items-center gap-2"><i class="fa-solid fa-calendar-plus text-indigo-500"></i> 安排新課程</span>
                        <i class="fa-solid fa-chevron-down transition-transform duration-300 text-slate-400 group-hover:text-slate-600"></i>
                    </button>
                    
                    <div id="add-session-form" class="hidden mt-4 transition-all">
                        <form onsubmit="app.actions.addSession(event, '${dateStr}')">
                            <div class="grid grid-cols-2 gap-3 mb-3">
                                <select name="categoryId" required onchange="app.helpers.updateTopicSelect(this.value)" class="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none"><option value="">選擇類別...</option>${app.db.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
                                <select id="topic-select" name="topicId" required class="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none"><option value="">先選類別</option></select>
                            </div>
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <input type="time" name="time" value="14:00" required class="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none">
                                <div><input type="number" name="repeat" value="1" min="1" max="12" placeholder="重複週數" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none text-center"><div class="text-[10px] text-center text-slate-400 mt-1">重複週數 (1=僅本次)</div></div>
                            </div>
                            <button class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">加入排程</button>
                        </form>
                    </div>
                </div>
            `;
            this.open(html, 'max-w-4xl');
        },
        openEditSession(sessionId) {
            const session = app.db.sessions.find(s => s.id === sessionId);
            if(!session) return;
            const cat = app.db.categories.find(c => c.id === session.categoryId);
            const topics = app.db.topics.filter(t => t.categoryId === session.categoryId);
            this.open(`
                <div class="flex items-center gap-3 mb-6"><button onclick="app.modals.openAgenda('${session.date}')" class="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500"><i class="fa-solid fa-arrow-left"></i></button><h3 class="text-xl font-bold">編輯課程場次</h3></div>
                <form onsubmit="app.actions.updateSession(event, '${sessionId}')">
                    <div class="mb-4"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">所屬類別</label><input type="text" value="${cat?.name || '未知'}" disabled class="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-500 cursor-not-allowed"></div>
                    <div class="mb-4"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">日期</label><input type="date" name="date" value="${session.date}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100"></div>
                    <div class="mb-4"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">時間</label><input type="time" name="time" value="${session.time}" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100"></div>
                    <div class="mb-8"><label class="block text-xs font-bold text-slate-400 uppercase mb-2">主題</label><select name="topicId" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100">${topics.map(t => `<option value="${t.id}" ${t.id === session.topicId ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
                    <button class="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition">儲存變更</button>
                </form>
            `);
        },
        openRollCall(sessionId) {
            const session = app.db.sessions.find(s => s.id === sessionId);
            if(!session) return;
            const students = app.db.students.filter(s => s.enrollments.some(e => e.categoryId === session.categoryId));
            let html = `<div class="flex items-center gap-3 mb-6"><button onclick="app.modals.openAgenda('${session.date}')" class="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500"><i class="fa-solid fa-arrow-left"></i></button><h3 class="text-xl font-bold">點名表 (${session.date})</h3></div><div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">`;
            if(students.length === 0) html += `<div class="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">無學生購買此類別課程</div>`;
            students.forEach(s => {
                const record = (session.attendees || []).find(a => a.studentId === s.id);
                const status = record ? record.status : null;
                html += `<div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between"><span class="font-bold text-slate-700">${s.name}</span><div class="flex gap-1"><button onclick="app.actions.updateAttendance('${sessionId}', '${s.id}', 'attended')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${status==='attended' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}">到</button><button onclick="app.actions.updateAttendance('${sessionId}', '${s.id}', 'leave')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${status==='leave' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}">假</button><button onclick="app.actions.updateAttendance('${sessionId}', '${s.id}', 'absent')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${status==='absent' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}">缺</button></div></div>`;
            });
            this.open(html + `</div>`, 'max-w-4xl');
        },
        toggleRescheduled(sessionId, studentId, catId) {
            const session = app.db.sessions.find(s => s.id === sessionId);
            if(!session) return;
            const attendee = session.attendees.find(a => a.studentId === studentId);
            if(!attendee) return;

            const isCurrentlyRescheduled = attendee.isRescheduled || false;
            // Logic: If currently rescheduled (true), we are turning it off (to '尚未').
            // If currently not (false), we are turning it on (to '已').
            const nextStateText = isCurrentlyRescheduled ? '尚未補課(花)' : '已補課(花)';

            app.modals.confirm(
                `確定將此課程狀態變更為「${nextStateText}」嗎？`,
                () => {
                    attendee.isRescheduled = !isCurrentlyRescheduled;
                    app.saveData();
                    app.modals.openStudentHistory(studentId, catId); // Refresh modal
                    app.toast.show(`已更新為：${nextStateText}`);
                },
                '補課狀態變更',
                'amber'
            );
        }
    },
    helpers: {
        changeMonth(delta) { const d = app.state.calendarDate; if(delta === 0) app.state.calendarDate = new Date(); else app.state.calendarDate = new Date(d.getFullYear(), d.getMonth() + delta, 1); app.renderView(); },
        updateTopicSelect(catId) { 
            const select = document.getElementById('topic-select'); 
            const topics = app.db.topics.filter(t => t.categoryId === catId); 
            select.innerHTML = topics.length ? topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('') : `<option value="">此類別無主題</option>`; 
        },
        updateDefaultCredits(catId) { 
            if(!catId) return; 
            const cat = app.db.categories.find(c => c.id === catId); 
            const input = document.getElementById('new-enroll-credits'); 
            if(input && cat) { input.value = String(cat.defaultCredits || 10); } 
        }
    }
};

// Important: Bind app to window so HTML inline events work
window.app = app;

// Start App
app.init();
