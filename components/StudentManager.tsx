
import React, { useState, useEffect, useMemo } from 'react';
import { Database, Student, Enrollment } from '../types';
import { ICONS } from '../constants';
import { dataService } from '../services/dataService';

const StudentManager: React.FC<{ db: Database, onRefresh: () => void }> = ({ db, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  // Derive viewing student directly from props to prevent stale state
  const viewingStudent = useMemo(() => 
    db.students.find(s => s.id === viewingStudentId),
    [db.students, viewingStudentId]
  );
  
  // Effect to close modal if the student being viewed is deleted
  useEffect(() => {
    if (viewingStudentId && !viewingStudent) {
      setViewingStudentId(null);
    }
  }, [viewingStudentId, viewingStudent]);

  const handleDeleteStudent = (e: React.MouseEvent, studentId: string, studentName: string) => {
    e.stopPropagation(); // Stop event from triggering the card's open modal action
    if (window.confirm(`確定要刪除學生 ${studentName} 嗎？此操作將無法復原。`)) {
      dataService.deleteStudent(studentId);
      onRefresh();
    }
  };
  
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">學生管理</h2>
          <p className="text-slate-400 text-sm">管理學生資料與課程購買記錄</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-[#4F46E5] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 transition-transform active:scale-95">
          <ICONS.Plus className="w-5 h-5" />新增學生
        </button>
      </div>

      <div className="space-y-4">
        {db.students.map(student => (
          <div key={student.id} className="bg-white rounded-[2rem] p-6 border border-slate-50 flex items-center justify-between group hover:shadow-lg transition-all">
             <div onClick={() => setViewingStudentId(student.id)} className="flex items-center gap-6 flex-grow cursor-pointer">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center font-black text-slate-300 text-2xl border-4 border-white shadow-sm group-hover:border-indigo-100 transition-colors">
                {student.name[0]}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">{student.name}</h4>
                <div className="flex items-center gap-4 mt-1">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student.phone}</p>
                   <p className="text-xs text-slate-300">{student.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">已購買項目</p>
                <div className="flex gap-2">
                  {student.enrollments.map(e => {
                    const cat = db.categories.find(c => c.id === e.categoryId);
                    return (<div key={e.categoryId} className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-indigo-600">{cat?.name} ({e.totalPurchased - e.used}堂)</div>);
                  })}
                </div>
              </div>
              {/* Delete Button - Now always visible */}
              <button
                onClick={(e) => handleDeleteStudent(e, student.id, student.name)}
                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                title={`刪除 ${student.name}`}
              >
                <ICONS.Trash className="w-5 h-5" />
              </button>
              <button onClick={() => setViewingStudentId(student.id)} className="cursor-pointer p-3 hover:bg-slate-50 rounded-xl">
                <ICONS.ChevronRight className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>
          </div>
        ))}
         {db.students.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <ICONS.Students className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">尚未新增任何學生，點擊「新增學生」開始。</p>
          </div>
        )}
      </div>

      {showAddModal && <AddEditStudentModal db={db} onRefresh={onRefresh} onClose={() => setShowAddModal(false)} />}
      {viewingStudent && <AddEditStudentModal student={viewingStudent} db={db} onRefresh={onRefresh} onClose={() => setViewingStudentId(null)} />}
    </div>
  );
};

// --- Sub-component for Add/Edit Modal ---
interface AddEditModalProps {
  student?: Student;
  db: Database;
  onRefresh: () => void;
  onClose: () => void;
}

const AddEditStudentModal: React.FC<AddEditModalProps> = ({ student, db, onRefresh, onClose }) => {
  const [formData, setFormData] = useState<Omit<Student, 'id'>>(() => 
    student 
      ? { ...student } 
      : { name: '', phone: '', email: '', note: '', enrollments: [] }
  );

  const [newEnrollmentCat, setNewEnrollmentCat] = useState('');
  const [newEnrollmentCredits, setNewEnrollmentCredits] = useState(10);
  
  const isEditing = !!student;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (isEditing) {
      dataService.updateStudent({ ...formData, id: student.id });
    } else {
      dataService.addStudent(formData);
    }
    onRefresh();
    onClose();
  };

  const handleEnrollmentChange = (index: number, newTotal: number) => {
    const newEnrollments = [...formData.enrollments];
    newEnrollments[index].totalPurchased = newTotal;
    setFormData({ ...formData, enrollments: newEnrollments });
  };
  
  const handleRemoveEnrollment = (index: number) => {
    const catName = db.categories.find(c => c.id === formData.enrollments[index].categoryId)?.name || 'this course';
    if(window.confirm(`確定要移除 ${catName} 嗎？`)) {
        const newEnrollments = formData.enrollments.filter((_, i) => i !== index);
        setFormData({ ...formData, enrollments: newEnrollments });
    }
  };

  const handleAddEnrollment = () => {
    if (newEnrollmentCat) {
      const newEnrollment: Enrollment = { categoryId: newEnrollmentCat, totalPurchased: newEnrollmentCredits, used: 0 };
      setFormData({ ...formData, enrollments: [...formData.enrollments, newEnrollment] });
      setNewEnrollmentCat('');
      setNewEnrollmentCredits(10);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl scale-in-center overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800">{isEditing ? `編輯 ${student.name}` : '新增學生'}</h3>
            <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-600"><ICONS.Close className="w-8 h-8" /></button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase">姓名 *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 mt-1 bg-slate-50 rounded-xl" required/>
            </div>
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase">電話</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 mt-1 bg-slate-50 rounded-xl"/>
            </div>
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 mt-1 bg-slate-50 rounded-xl"/>
            </div>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 mb-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">購買課程管理</h4>
            <div className="space-y-3">
                {formData.enrollments.map((e, index) => {
                    const cat = db.categories.find(c => c.id === e.categoryId);
                    return (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg">
                            <span className="font-bold text-slate-600 flex-1">{cat?.name}</span>
                            <input type="number" value={e.totalPurchased} onChange={ev => handleEnrollmentChange(index, parseInt(ev.target.value))} className="w-20 bg-slate-100 p-1 rounded text-center" /> 堂
                            <button type="button" onClick={() => handleRemoveEnrollment(index)} className="p-1 text-rose-400 hover:text-rose-600"><ICONS.Trash className="w-4 h-4" /></button>
                        </div>
                    );
                })}
                {formData.enrollments.length === 0 && <p className="text-slate-400 text-sm text-center py-2">無購買記錄</p>}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                <select value={newEnrollmentCat} onChange={e => setNewEnrollmentCat(e.target.value)} className="flex-1 bg-slate-100 p-2 rounded-lg">
                    <option value="">-- 新增課程 --</option>
                    {db.categories.filter(c => !formData.enrollments.some(e => e.categoryId === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" value={newEnrollmentCredits} onChange={e => setNewEnrollmentCredits(parseInt(e.target.value))} className="w-20 bg-slate-100 p-2 rounded text-center"/> 堂
                <button type="button" onClick={handleAddEnrollment} className="p-2 bg-indigo-500 text-white rounded-lg"><ICONS.Plus className="w-4 h-4"/></button>
            </div>
        </div>

        <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-colors">取消</button>
            <button type="submit" className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl">{isEditing ? '儲存變更' : '新增學生'}</button>
        </div>
      </form>
    </div>
  );
};

export default StudentManager;
