
import React from 'react';
import { ICONS } from '../constants';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: '總覽', icon: ICONS.Dashboard },
    { id: 'categories', label: '課程類別', icon: ICONS.Classes },
    { id: 'students', label: '學生管理', icon: ICONS.Students },
    { id: 'calendar', label: '課程履歷', icon: ICONS.Calendar },
    { id: 'attendance', label: '出席缺名單', icon: ICONS.Attendance },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-slate-100 flex flex-col z-30">
      <div className="p-6 mb-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
          <ICONS.Classes className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-800">課程管理系統</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
              activeView === item.id 
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold shadow-sm' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-[#4F46E5]' : ''}`} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-50">
        <div className="flex items-center gap-3">
          <img src="https://picsum.photos/40/40?random=user" className="w-10 h-10 rounded-full border-2 border-slate-100" alt="Admin" />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate">系統管理員</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
