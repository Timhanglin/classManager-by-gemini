
import { COLORS } from './data.js';

export const toast = {
    show(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        let icon = 'fa-check-circle';
        if(type === 'error') icon = 'fa-circle-exclamation';
        if(type === 'info') icon = 'fa-circle-info';
        el.innerHTML = `<i class="fa-solid ${icon} text-xl ${type==='success'?'text-emerald-500':type==='error'?'text-rose-500':'text-indigo-500'}"></i><div><h4 class="font-bold text-slate-800 text-sm">${message}</h4></div>`;
        container.appendChild(el);
        setTimeout(() => { el.classList.add('hiding'); el.addEventListener('animationend', () => el.remove()); }, 3000);
    }
};

export const modals = {
    open(html, maxWidth = 'max-w-lg') {
        const content = document.getElementById('modal-content');
        if(!content) return;
        content.className = `bg-white w-full ${maxWidth} rounded-[2rem] p-8 shadow-2xl scale-in-center relative max-h-[90vh] overflow-y-auto no-scrollbar transition-all duration-300`;
        content.innerHTML = `<button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition"><i class="fa-solid fa-xmark fa-xl"></i></button>${html}`;
        document.getElementById('modal-overlay').classList.remove('hidden');
    },
    close() { document.getElementById('modal-overlay').classList.add('hidden'); },
    confirm(message, callback, title = '確認刪除', theme = 'rose') {
        const themeColors = { rose: { bg: 'bg-rose-50', text: 'text-rose-500', btn: 'bg-rose-500', shadow: 'shadow-rose-100' }, amber: { bg: 'bg-amber-50', text: 'text-amber-500', btn: 'bg-amber-500', shadow: 'shadow-amber-100' }, indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', btn: 'bg-indigo-600', shadow: 'shadow-indigo-100' } };
        const t = themeColors[theme] || themeColors.rose;
        this.open(`<div class="text-center"><div class="w-20 h-20 ${t.bg} ${t.text} rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"><i class="fa-solid fa-triangle-exclamation"></i></div><h3 class="text-2xl font-bold text-slate-800 mb-2">${title}</h3><p class="text-slate-400 mb-8">${message.replace(/\n/g, '<br>')}</p><div class="flex gap-4"><button onclick="window.app.modals.close()" class="flex-1 py-4 bg-slate-50 text-slate-400 font-bold rounded-2xl hover:bg-slate-100 transition">取消</button><button id="confirm-btn-action" class="flex-1 py-4 ${t.btn} text-white font-bold rounded-2xl shadow-xl ${t.shadow} hover:shadow-none hover:translate-y-1 transition">確定執行</button></div></div>`);
        setTimeout(() => { const btn = document.getElementById('confirm-btn-action'); if(btn) btn.onclick = () => { callback(); window.app.modals.close(); }; }, 0);
    },
    
    openCategory(id = null) {
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
        const sessions = app.db.sessions.filter(s => s.date === dateStr);
        let html = `
            <div class="flex justify-between items-center mb-6">
                 <h3 class="text-2xl font-bold text-slate-800">${dateStr}</h3>
                 <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">${sessions.length} 堂課</span>
            </div>
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
                                <button onclick="app.modals.openRollCall('${s.id}')" class="bg-emerald-50 text-emerald-600 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 flex items-center gap-1"><i class="fa-solid fa-check"></i> 點名</button>
                                <button onclick="app.modals.openEditSession('${s.id}')" class="bg-slate-100 text-slate-500 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 hover:text-slate-700"><i class="fa-solid fa-pen"></i></button>
                                <button onclick="app.actions.deleteSession('${s.id}')" class="bg-rose-50 text-rose-500 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-100"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
        const session = app.db.sessions.find(s => s.id === sessionId);
        if(!session) return;
        const attendee = session.attendees.find(a => a.studentId === studentId);
        if(!attendee) return;

        const isCurrentlyRescheduled = attendee.isRescheduled || false;
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
    },

    openStudentHistory(studentId, catId = null) {
        const app = window.app;
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

        const allSessions = app.db.sessions
            .filter(ses => ses.categoryId === activeCatId);

        let stats = { attended: 0, leave: 0, absent: 0, none: 0 };
        
        allSessions.forEach(ses => {
            const rec = (ses.attendees || []).find(a => a.studentId === studentId);
            const st = rec ? rec.status : 'none';
            if(stats[st] !== undefined) stats[st]++;
        });

        const remaining = activeEnrollment ? (activeEnrollment.totalPurchased - activeEnrollment.used) : 0;
        
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
        const app = window.app;
        const container = document.getElementById('history-session-list');
        const inputEl = document.getElementById('history-search-input');
        if(!container) return;

        const currentTerm = term !== null ? term : (inputEl ? inputEl.value : '');
        if(status) app.state.historyFilter.status = status;
        const currentStatus = app.state.historyFilter.status || 'all';

        let sessions = app.db.sessions
            .filter(ses => ses.categoryId === catId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sessions = sessions.filter(ses => {
            const rec = (ses.attendees || []).find(a => a.studentId === studentId);
            const s = rec ? rec.status : 'none';
            if (currentStatus === 'all') return true;
            return s === currentStatus;
        });

        if(currentTerm) {
            const lower = currentTerm.toLowerCase();
            sessions = sessions.filter(s => {
                const t = app.db.topics.find(top => top.id === s.topicId);
                const name = t ? t.name : '';
                return name.toLowerCase().includes(lower) || s.date.includes(lower);
            });
        }

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
    }
};

export const views = {
    dashboard(container) {
        const { db } = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
};
