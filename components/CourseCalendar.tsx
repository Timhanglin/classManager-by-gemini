
import React from 'react';
import { Course, DayOfWeek } from '../types';
import { DAYS, HOURS } from '../constants';

interface CourseCalendarProps {
  courses: Course[];
}

const CourseCalendar: React.FC<CourseCalendarProps> = ({ courses }) => {
  const renderSlots = (day: string) => {
    return HOURS.map((hour) => {
      const activeSlot = courses.find(course => 
        course.slots.some(slot => 
          slot.day === (day as DayOfWeek) && 
          parseInt(slot.startTime.split(':')[0]) === hour
        )
      );

      return (
        <div key={hour} className="h-20 border-b border-slate-100 relative group transition-colors hover:bg-slate-50/50">
          {activeSlot && (
            <div className={`absolute inset-x-1 top-1 bottom-1 rounded-lg ${activeSlot.color} p-2 text-white shadow-lg z-10 overflow-hidden transform transition-transform hover:scale-[1.02] cursor-pointer`}>
              <p className="text-[10px] font-bold uppercase opacity-80 truncate">{activeSlot.instructor}</p>
              <p className="text-xs font-bold leading-tight truncate">{activeSlot.name}</p>
              <p className="text-[10px] mt-1 opacity-90">{activeSlot.room}</p>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/80">
        <div className="p-4 border-r border-slate-200"></div>
        {DAYS.map(day => (
          <div key={day} className="p-4 text-center border-r last:border-0 border-slate-200">
            <span className="text-sm font-bold text-slate-700">{day}</span>
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8">
          {/* Time column */}
          <div className="border-r border-slate-200 bg-slate-50/30">
            {HOURS.map(hour => (
              <div key={hour} className="h-20 p-2 text-right border-b border-slate-100">
                <span className="text-xs font-medium text-slate-400">{hour}:00</span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          {DAYS.map(day => (
            <div key={day} className="border-r last:border-0 border-slate-100">
              {renderSlots(day)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseCalendar;
