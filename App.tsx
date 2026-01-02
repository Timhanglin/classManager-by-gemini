
import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CourseCategoryList from './components/CourseCategoryList';
import StudentManager from './components/StudentManager';
import CalendarView from './components/CalendarView';
import AttendanceReport from './components/AttendanceTracker';
import { Database } from './types';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [db, setDb] = useState<Database>(dataService.getDb());
  // Version key to force re-renders on deep updates
  const [version, setVersion] = useState(0);

  const refreshData = useCallback(() => {
    // Increment version to force UI updates that might depend on deep changes
    setVersion(v => v + 1);
    setDb(dataService.getDb());
  }, []);

  const renderContent = () => {
    // Pass version as key to force component remounting if necessary for clean state
    const commonProps = { db, onRefresh: refreshData };
    
    switch (activeView) {
      case 'dashboard': 
        return <Dashboard db={db} setActiveView={setActiveView} />;
      case 'categories': 
        return <CourseCategoryList {...commonProps} />;
      case 'students': 
        return <StudentManager {...commonProps} />;
      case 'calendar': 
        return <CalendarView {...commonProps} />;
      case 'attendance': 
        return <AttendanceReport {...commonProps} />;
      default: 
        return <Dashboard db={db} setActiveView={setActiveView}/>;
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFF] overflow-hidden text-slate-700">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto relative bg-[#F8F9FE]">
        <div className="p-8 pb-20">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
