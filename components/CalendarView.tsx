
import React, { useState } from 'react';
import { Database, Session, AttendanceStatus, Student } from '../types';
import { ICONS } from '../constants';
import { dataService } from '../services/dataService';

const CalendarView: React.FC<{ db: Database, onRefresh: () => void }> = ({ db, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [showAddSession, setShowAddSession] = useState(false);
  const [agendaForDate, setAgendaForDate] = useState<string | null>(null);
  const [attendanceForSession, setAttendanceForSession] = useState<Session | null>(null);

  // Form states
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [time, setTime] = useState('14:00');
  const [occurrences, setOccurrences] = useState(1);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Adjust padding for Sunday start
  const padding = Array.from({ length: firstDay }, (_, i) => i);


  const handleCellClick = (d: number) => {
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setAgendaForDate(formattedDate);
  };
  
  const handleAddSession = () => {
    const date = agendaForDate;
    if (!selectedCat || !selectedTopic || !date) return;
    dataService.addSessions({ categoryId: selectedCat, topicId: selectedTopic, date, time }, occurrences);
    setShowAddSession(false);
    setSelectedCat('');
    setSelectedTopic('');
    setOccurrences(1);
    setTime('14:00');
    onRefresh();
  };
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!attendanceForSession) return;
    dataService.updateAttendance(attendanceForSession.id, studentId, status);
    onRefresh();
    // Refresh session data in modal
    const newDb = dataService.getDb();
    setAttendanceForSession(newDb.sessions.find(s => s.id === attendanceForSession.id) || null);
  };

  const filteredTopics = db.topics.filter(t => t.categoryId === selectedCat);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">課程行事曆</h2>
          <p className="text-slate-400 text-sm">點選日期查看或安排場次，並可直接點名</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-slate-800">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h3>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 bg-slate-50 rounded-2xl"><ICONS.ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 bg-slate-50 rounded-2xl"><ICONS.ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="bg-slate-50/50 p-4 text-center text-xs font-black text-slate-300 uppercase">{d}</div>)}
          {padding.map(p => <div key={`p-${p}`} className="bg-white h-36" />)}
          {days.map(d => {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const daySessions = db.sessions.filter(s => s.date === dateStr);
            return (
              <div key={d} onClick={() => handleCellClick(d)} className="bg-white h-36 p-4 border-t border-l border-slate-50 relative group cursor-pointer hover:bg-indigo-50/20">
                <span className="text-sm font-bold text-slate-300">{d}</span>
                <div className="mt-2 space-y-1.5 overflow-y-auto max-h-24 no-scrollbar">
                  {daySessions.map(s => {
                    const cat = db.categories.find(c => c.id === s.categoryId);
                    return (<div key={s.id} className={`${cat?.color} text-[8px] font-black text-white px-2 py-1.5 rounded-lg truncate`}>{s.time} {cat?.name}</div>);
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Agenda Modal */}
      {agendaForDate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAgendaForDate(null)}>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl scale-in-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-slate-800 text-xl mb-6">{agendaForDate} 日程</h3>
            <div className="space-y-4 mb-8 max-h-80 overflow-y-auto">
              {db.sessions.filter(s => s.date === agendaForDate).length === 0 && (
                <p className="text-center text-slate-400 py-8">本日無課程安排</p>
              )}
              {db.sessions.filter(s => s.date === agendaForDate).map(session => {
                const cat = db.categories.find(c => c.id === session.categoryId);
                const topic = db.topics.find(t => t.id === session.topicId);
                return (
                    <div key={session.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <span className={`px-2 py-1 text-white text-[9px] font-bold rounded ${cat?.color}`}>{session.time}</span>
                            <p className="font-bold text-slate-700 mt-1">{cat?.name} - {topic?.name}</p>
                        </div>
                        <button onClick={() => setAttendanceForSession(session)} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-sm">點名</button>
                    </div>
                )
              })}
            </div>
            <button onClick={() => setShowAddSession(true)} className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-bold">安排新課程</button>
          </div>
        </div>
      )}

      {/* Add Session Modal (nested inside Agenda) */}
      {showAddSession && agendaForDate && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
                <h3 className="font-black text-slate-800 text-xl mb-1">安排新課程</h3>
                <p className="text-slate-400 text-sm mb-6">日期: {agendaForDate}</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">課程類別</label>
                        <select value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setSelectedTopic(''); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">
                            <option value="">-- 選擇類別 --</option>
                            {db.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {selectedCat && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">課程主題</label>
                            <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">
                                <option value="">-- 選擇主題 --</option>
                                {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">上課時間</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"/>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">重複週數 (選填)</label>
                        <input type="number" min="1" value={occurrences} onChange={e => setOccurrences(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"/>
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <button onClick={() => setShowAddSession(false)} className="flex-1 py-4 text-slate-400 font-bold">取消</button>
                    <button onClick={handleAddSession} className="flex-1 py-4 bg-[#4F46E5] text-white rounded-2xl font-bold">確認新增</button>
                </div>
            </div>
         </div>
      )}

      {/* Attendance Taking Modal */}
      {attendanceForSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setAttendanceForSession(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl scale-in-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-slate-800 text-xl mb-6">點名單: {attendanceForSession.date}</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {db.students.filter(s => s.enrollments.some(e => e.categoryId === attendanceForSession.categoryId)).map(student => {
                    const record = attendanceForSession.attendees.find(a => a.studentId === student.id);
                    return (
                        <div key={student.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                            <p className="font-bold text-slate-700">{student.name}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleStatusChange(student.id, 'attended')} className={`px-4 py-2 rounded-lg text-xs font-bold ${record?.status === 'attended' ? 'bg-emerald-500 text-white' : 'bg-white'}`}>出席</button>
                                <button onClick={() => handleStatusChange(student.id, 'leave')} className={`px-4 py-2 rounded-lg text-xs font-bold ${record?.status === 'leave' ? 'bg-amber-500 text-white' : 'bg-white'}`}>請假</button>
                                <button onClick={() => handleStatusChange(student.id, 'absent')} className={`px-4 py-2 rounded-lg text-xs font-bold ${record?.status === 'absent' ? 'bg-rose-500 text-white' : 'bg-white'}`}>缺席</button>
                            </div>
                        </div>
                    )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
