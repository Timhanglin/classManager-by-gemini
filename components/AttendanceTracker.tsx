
import React, { useState, useMemo } from 'react';
import { Database, Student } from '../types';
import { ICONS } from '../constants';

// Re-purposed component, now named AttendanceReport internally
const AttendanceReport: React.FC<{ db: Database, onRefresh: () => void }> = ({ db, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMethod, setSortMethod] = useState('remaining_desc');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const studentStats = useMemo(() => {
    return db.students.map(student => {
      let attended = 0, leave = 0, absent = 0, totalRemaining = 0;

      db.sessions.forEach(session => {
        const record = session.attendees.find(a => a.studentId === student.id);
        if (record) {
          if (record.status === 'attended') attended++;
          if (record.status === 'leave') leave++;
          if (record.status === 'absent') absent++;
        }
      });
      
      student.enrollments.forEach(e => {
        totalRemaining += (e.totalPurchased - e.used);
      });

      return { ...student, attended, leave, absent, totalRemaining };
    });
  }, [db]);

  const filteredAndSortedStudents = useMemo(() => {
    let students = studentStats.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    students.sort((a, b) => {
        if (sortMethod === 'remaining_desc') return b.totalRemaining - a.totalRemaining;
        if (sortMethod === 'remaining_asc') return a.totalRemaining - b.totalRemaining;
        if (sortMethod === 'attended_desc') return b.attended - a.attended;
        if (sortMethod === 'absent_desc') return b.absent - a.absent;
        return 0;
    });

    return students;
  }, [studentStats, searchTerm, sortMethod]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attended': return <span className="text-emerald-500">✓</span>;
      case 'leave': return <span className="text-amber-500">!</span>;
      case 'absent': return <span className="text-rose-500">✕</span>;
      default: return null;
    }
  }
  // FIX: Added getStatusLabel function to return the correct label for attendance status.
  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'attended':
        return '出席';
      case 'leave':
        return '請假';
      case 'absent':
        return '缺席';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">出缺席名單</h2>
        <p className="text-slate-400 text-sm">查詢學生出席紀錄與剩餘堂數</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm mb-8 flex gap-6">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-400">搜尋學生</label>
          <input type="text" placeholder="輸入學生姓名..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl"/>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-400">排序方式</label>
          <select value={sortMethod} onChange={e => setSortMethod(e.target.value)} className="w-full mt-1 p-3 bg-slate-50 rounded-xl">
            <option value="remaining_desc">剩餘堂數：多到少</option>
            <option value="remaining_asc">剩餘堂數：少到多</option>
            <option value="attended_desc">出席次數：多到少</option>
            <option value="absent_desc">缺席次數：多到少</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedStudents.map(student => (
          <div key={student.id} onClick={() => setViewingStudent(student)} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-400 text-lg">{student.name[0]}</div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">{student.name}</h4>
                        <div className="flex gap-2 mt-1">
                            {student.enrollments.map(e => {
                                const cat = db.categories.find(c => c.id === e.categoryId);
                                return <span key={e.categoryId} className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md">{cat?.name}: 剩餘{e.totalPurchased-e.used}堂</span>
                            })}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 text-center">
                    <div className="bg-emerald-50 p-3 rounded-xl w-24"><p className="text-xs text-emerald-700 font-bold">出席</p><p className="text-2xl font-black text-emerald-600">{student.attended}</p></div>
                    <div className="bg-amber-50 p-3 rounded-xl w-24"><p className="text-xs text-amber-700 font-bold">請假</p><p className="text-2xl font-black text-amber-600">{student.leave}</p></div>
                    <div className="bg-rose-50 p-3 rounded-xl w-24"><p className="text-xs text-rose-700 font-bold">缺席</p><p className="text-2xl font-black text-rose-600">{student.absent}</p></div>
                    <div className="bg-indigo-50 p-3 rounded-xl w-24"><p className="text-xs text-indigo-700 font-bold">總剩餘</p><p className="text-2xl font-black text-indigo-600">{student.totalRemaining}</p></div>
                </div>
            </div>
          </div>
        ))}
      </div>

        {/* Student Detail Modal */}
        {viewingStudent && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingStudent(null)}>
                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl scale-in-center max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewingStudent(null)} className="absolute top-8 right-8 text-slate-400"><ICONS.Close/></button>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-400 text-2xl">{viewingStudent.name[0]}</div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">{viewingStudent.name}</h3>
                            <p className="text-sm text-slate-400">{viewingStudent.phone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {/* Summary Cards */}
                    </div>

                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-slate-800 mb-4">課程分項剩餘堂數</h4>
                        <div className="space-y-4">
                            {viewingStudent.enrollments.map(e => {
                                const cat = db.categories.find(c => c.id === e.categoryId);
                                const progress = e.totalPurchased > 0 ? (e.used / e.totalPurchased) * 100 : 0;
                                return (
                                    <div key={e.categoryId} className="bg-slate-50 p-4 rounded-xl">
                                        <div className="flex justify-between items-center text-xs font-bold mb-2">
                                            <span className="text-slate-700">{cat?.name}</span>
                                            <span className="text-indigo-600">已上: {e.used} / 已購買: {e.totalPurchased}</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full"><div className="h-2 bg-indigo-500 rounded-full" style={{width: `${progress}%`}}></div></div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                     <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-4">出缺席記錄</h4>
                        <div className="space-y-3">
                            {db.sessions.filter(s => s.attendees.some(a => a.studentId === viewingStudent.id)).map(s => {
                                const cat = db.categories.find(c => c.id === s.categoryId);
                                const record = s.attendees.find(a => a.studentId === viewingStudent.id);
                                return (
                                    <div key={s.id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-10 rounded-full ${cat?.color}`}></div>
                                            <div>
                                                <p className="font-bold text-xs text-slate-700">{s.date} {s.time}</p>
                                                <p className="text-[10px] text-slate-500">{cat?.name}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${record?.status === 'attended' ? 'bg-emerald-100 text-emerald-600' : record?.status === 'leave' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {getStatusLabel(record?.status)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default AttendanceReport;