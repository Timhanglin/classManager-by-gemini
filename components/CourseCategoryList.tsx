
import React, { useState } from 'react';
import { Database, CourseCategory } from '../types';
import { ICONS, THEME_COLORS } from '../constants';
import { dataService } from '../services/dataService';
import CourseTopicList from './CourseTopicList';

const CourseCategoryList: React.FC<{ db: Database, onRefresh: () => void }> = ({ db, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  
  const initialFormState = { name: '', description: '', color: THEME_COLORS[0] };
  const [formState, setFormState] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormState(initialFormState);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: CourseCategory) => {
    setEditingCategory(cat);
    setFormState({ name: cat.name, description: cat.description, color: cat.color });
    setShowModal(true);
  };
  
  const handleDelete = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除這個課程類別嗎？所有相關的主題、場次和學生註冊資料將會一併刪除。')) {
      dataService.deleteCategory(catId);
      onRefresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name) return;
    if (editingCategory) {
      dataService.updateCategory({ ...editingCategory, ...formState });
    } else {
      dataService.addCategory(formState);
    }
    setShowModal(false);
    onRefresh();
  };

  if (selectedCategory) {
    return (
      <CourseTopicList 
        category={selectedCategory} 
        db={db} 
        onBack={() => setSelectedCategory(null)} 
        onRefresh={onRefresh} 
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">課程類別管理</h2>
          <p className="text-slate-400 text-sm">建立課程大分類（如：花藝、舞蹈）</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-[#4F46E5] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 transition-transform active:scale-95"
        >
          <ICONS.Plus className="w-5 h-5" />
          新增類別
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.categories.map(cat => {
          const topicCount = db.topics.filter(t => t.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer" onClick={() => setSelectedCategory(cat)}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 ${cat.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  <ICONS.Classes className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button className="text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); handleOpenEdit(cat); }}><ICONS.Edit className="w-4 h-4" /></button>
                  <button className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors" onClick={(e) => handleDelete(e, cat.id)}><ICONS.Trash className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{cat.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{cat.description}</p>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-6 mt-auto">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {topicCount}個主題
                </span>
                <span className="text-indigo-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  管理主題 <ICONS.ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
         {db.categories.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <ICONS.Classes className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">尚未建立任何課程類別，點擊「新增類別」開始。</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">{editingCategory ? '編輯' : '新增'}課程類別</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400"><ICONS.Close className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">類別名稱 *</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"
                  value={formState.name}
                  onChange={e => setFormState({...formState, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">類別說明</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 h-32 resize-none"
                  value={formState.description}
                  onChange={e => setFormState({...formState, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-4">代表顏色</label>
                <div className="flex flex-wrap gap-3">
                  {THEME_COLORS.map(c => (
                    <button 
                      key={c} 
                      type="button"
                      onClick={() => setFormState({...formState, color: c})}
                      className={`w-8 h-8 rounded-full ${c} ${formState.color === c ? 'ring-4 ring-offset-2 ring-indigo-500' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold">取消</button>
                <button type="submit" className="flex-1 py-4 bg-[#4F46E5] text-white rounded-2xl font-bold">{editingCategory ? '儲存變更' : '新增類別'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CourseCategoryList;
