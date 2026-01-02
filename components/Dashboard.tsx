
import React from 'react';
import { Database } from '../types';
import { ICONS } from '../constants';

const Dashboard: React.FC<{ db: Database, setActiveView: (view: string) => void }> = ({ db, setActiveView }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">總覽</h2>
        <p className="text-slate-400 text-sm">課程管理系統資料看板</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500">
            <ICONS.Students className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">學生人數</p>
            <h4 className="text-4xl font-black text-slate-800">{db.students.length}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500">
            <ICONS.Classes className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">課程類別</p>
            <h4 className="text-4xl font-black text-slate-800">{db.categories.length}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">課程類別</h3>
            <button onClick={() => setActiveView('categories')} className="text-indigo-600 text-sm font-semibold">看全部</button>
          </div>
          <div className="space-y-4">
            {db.categories.slice(0, 3).map(cat => (
              <div key={cat.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center text-white`}>
                  <ICONS.Classes className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{cat.name}</p>
                  <p className="text-xs text-slate-400">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">學生列表</h3>
            <button onClick={() => setActiveView('students')} className="text-indigo-600 text-sm font-semibold">看全部</button>
          </div>
          <div className="space-y-4">
            {db.students.slice(0, 3).map(student => (
              <div key={student.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  {student.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.enrollments.length} 課程項目</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
