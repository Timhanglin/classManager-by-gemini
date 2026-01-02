
import React, { useState } from 'react';
import { Course, DayOfWeek } from '../types';
import { COLORS, DAYS, ICONS } from '../constants';

interface CourseListProps {
  courses: Course[];
  onAddCourse: (course: Course) => void;
  onRemoveCourse: (id: string) => void;
}

const CourseList: React.FC<CourseListProps> = ({ courses, onAddCourse, onRemoveCourse }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    name: '',
    instructor: '',
    room: '',
    credits: 3,
    color: COLORS[0],
    slots: [{ day: DayOfWeek.Monday, startTime: '09:00', endTime: '10:30' }]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourse.name && newCourse.instructor) {
      onAddCourse({
        ...newCourse as Course,
        id: Math.random().toString(36).substr(2, 9),
      });
      setShowAdd(false);
      setNewCourse({
        name: '',
        instructor: '',
        room: '',
        credits: 3,
        color: COLORS[0],
        slots: [{ day: DayOfWeek.Monday, startTime: '09:00', endTime: '10:30' }]
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Courses</h2>
          <p className="text-slate-500">Manage your enrolled subjects and schedules</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-200"
        >
          <ICONS.Plus className="w-5 h-5" />
          Add Course
        </button>
      </div>

      {showAdd && (
        <div className="mb-8 bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Course Name (e.g. Data Science)" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20"
                value={newCourse.name}
                onChange={e => setNewCourse({...newCourse, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Instructor" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20"
                value={newCourse.instructor}
                onChange={e => setNewCourse({...newCourse, instructor: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Room / Building" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20"
                value={newCourse.room}
                onChange={e => setNewCourse({...newCourse, room: e.target.value})}
              />
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={newCourse.slots?.[0].day}
                onChange={e => {
                  const slots = [...(newCourse.slots || [])];
                  slots[0].day = e.target.value as DayOfWeek;
                  setNewCourse({...newCourse, slots});
                }}
              >
                {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={newCourse.color}
                onChange={e => setNewCourse({...newCourse, color: e.target.value})}
              >
                {COLORS.map(c => <option key={c} value={c}>{c.split('-')[1]}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 text-slate-500 font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save Course</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 transition-all shadow-sm group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl ${course.color} flex items-center justify-center text-white`}>
                <ICONS.Book className="w-5 h-5" />
              </div>
              <button 
                onClick={() => onRemoveCourse(course.id)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ICONS.Trash className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{course.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{course.instructor} • {course.room}</p>
            <div className="flex flex-wrap gap-2 mt-auto">
              {course.slots.map((slot, i) => (
                <span key={i} className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600">
                  {slot.day.substring(0, 3)} {slot.startTime}-{slot.endTime}
                </span>
              ))}
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <ICONS.Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No courses added yet. Get started by clicking the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
