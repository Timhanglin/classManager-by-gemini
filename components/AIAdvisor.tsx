
import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { getScheduleAdvice } from '../services/geminiService';
import { ICONS } from '../constants';

interface AIAdvisorProps {
  courses: Course[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ courses }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await getScheduleAdvice(courses);
    setAdvice(result || "Error fetching advice");
    setLoading(false);
  };

  useEffect(() => {
    if (courses.length > 0 && !advice) {
      fetchAdvice();
    }
  }, [courses]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ICONS.Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Academic Advisor</h2>
              <p className="opacity-80">Personalized schedule analysis powered by Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={fetchAdvice}
            disabled={loading}
            className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-indigo-50 transition-colors"
          >
            {loading ? 'Analyzing...' : 'Refresh Insights'}
          </button>
        </div>

        <div className="p-10">
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse"></div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none">
              <div className="flex gap-4 items-start mb-6">
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <ICONS.Sparkles className="text-indigo-600 w-5 h-5" />
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                  {advice || "Add some courses to get personalized scheduling advice from our AI counselor."}
                </div>
              </div>
              
              {courses.length > 0 && (
                <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ICONS.Dashboard className="w-4 h-4 text-slate-400" />
                    Key Observations
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-2">
                      <span className="text-indigo-500 font-bold">•</span>
                      {courses.length > 5 ? 'High workload semester' : 'Well-distributed credit load'}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-500 font-bold">•</span>
                      Friday schedule looks {courses.some(c => c.slots.some(s => s.day === 'Friday')) ? 'active' : 'clear for study'}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
