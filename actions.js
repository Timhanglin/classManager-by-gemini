
export const actions = {
    saveCategory(e, id) {
        e.preventDefault();
        const app = window.app;
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
        const app = window.app;
        app.modals.confirm('確定刪除此類別？相關的主題也會被移除。', () => {
            app.db.categories = app.db.categories.filter(c => c.id !== id);
            app.db.topics = app.db.topics.filter(t => t.categoryId !== id);
            app.saveData();
            app.toast.show('類別已刪除');
        });
    },
    saveTopic(e, catId, id) {
        e.preventDefault();
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
        app.modals.confirm('確定刪除此學生？所有的紀錄將無法復原。', () => {
            app.db.students = app.db.students.filter(s => s.id !== id);
            app.saveData();
            app.toast.show('學生已刪除');
        });
    },
    addEnrollment(studentId) {
        const app = window.app;
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
         const app = window.app;
         const s = app.db.students.find(s => s.id === studentId);
         if(s && s.enrollments[idx]) {
             s.enrollments[idx].totalPurchased = Number(value);
             app.saveData();
         }
    },
    removeEnrollment(studentId, idx, name) {
        const app = window.app;
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
        const app = window.app;
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
        const app = window.app;
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
         const app = window.app;
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
        const app = window.app;
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
};

export const helpers = {
    changeMonth(delta) { 
        const app = window.app;
        const d = app.state.calendarDate; 
        if(delta === 0) app.state.calendarDate = new Date(); 
        else app.state.calendarDate = new Date(d.getFullYear(), d.getMonth() + delta, 1); 
        app.renderView(); 
    },
    updateTopicSelect(catId) { 
        const app = window.app;
        const select = document.getElementById('topic-select'); 
        const topics = app.db.topics.filter(t => t.categoryId === catId); 
        select.innerHTML = topics.length ? topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('') : `<option value="">此類別無主題</option>`; 
    },
    updateDefaultCredits(catId) { 
        const app = window.app;
        if(!catId) return; 
        const cat = app.db.categories.find(c => c.id === catId); 
        const input = document.getElementById('new-enroll-credits'); 
        if(input && cat) { input.value = String(cat.defaultCredits || 10); } 
    }
};
