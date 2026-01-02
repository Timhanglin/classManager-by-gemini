
import React, { useState } from 'react';
import { Database, CourseCategory, Topic } from '../types';
import { ICONS } from '../constants';
import { dataService } from '../services/dataService';

interface CourseTopicListProps {
  category: CourseCategory;
  db: Database;
  onBack: () => void;
  onRefresh: () => void;
}

const CourseTopicList: React.FC<CourseTopicListProps> = ({ category, db, onBack, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  
  const initialFormData = { name: '', description: '', estimatedSessions: 1 };
  const [formData, setFormData] = useState(initialFormData);

  const categoryTopics = db.topics.filter(t => t.categoryId === category.id);

  const handleOpenAdd = () => {
    setEditingTopic(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({ name: topic.name, description: topic.description, estimatedSessions: topic.estimatedSessions });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingTopic) {
      dataService.updateTopic({ ...editingTopic, ...formData });
    } else {
      dataService.addTopic({ categoryId: category.id, ...formData });
    }
    
    setShowModal(false);
    onRefresh();
  };
  
  const handleDelete = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除這個主題嗎？所有相關的課程場次將會一併刪除。')) {
      dataService.deleteTopic(topicId);
      onRefresh();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 transition-colors">
          <ICONS.ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">{category.name}</h2>
          <p className="text-slate-400 text-sm">管理該類別下的具體教學內容</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="ml-auto bg-[#4F46E5] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-transform active:scale-95"
        >
          <ICONS.Plus className="w-5 h-5" />
          新增主題
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoryTopics.map(topic => {
          const scheduledCount = db.sessions.filter(s => s.topicId === topic.id).length;
          return (
            <div key={topic.id} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{topic.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{topic.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(topic)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><ICONS.Edit className="w-4 h-4" /></button>
                  <button onClick={(e) => handleDelete(e, topic.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><ICONS.Trash className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-slate-50 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase">
                  預計 {topic.estimatedSessions} 堂
                </span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase">
                  已排 {scheduledCount} 場
                </span>
              </div>
            </div>
          );
        })}
         {categoryTopics.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <ICONS.Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">此類別下尚無課程主題。</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl scale-in-center">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">{editingTopic ? '編輯' : '新增'}課程主題</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400"><ICONS.Close className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">主題名稱 *</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">主題說明</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 h-32 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">預計總堂數</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"
                  value={formData.estimatedSessions}
                  onChange={e => setFormData({...formData, estimatedSessions: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors">取消</button>
                <button type="submit" className="flex-1 py-4 bg-[#4F46E5] text-white rounded-2xl font-bold shadow-xl shadow-indigo-100">{editingTopic ? '儲存修改' : '建立主題'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CourseTopicList;
