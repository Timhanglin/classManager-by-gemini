
import { Database, CourseCategory, Student, Session, Topic, AttendanceStatus } from '../types';

const STORAGE_KEY = 'edu_schedule_v2_data';

// Cleared default database for a clean testing environment
const DEFAULT_DB: Database = {
  categories: [],
  topics: [],
  students: [],
  sessions: []
};

// --- Helper Functions ---
const getDb = (): Database => {
  const data = localStorage.getItem(STORAGE_KEY);
  try {
    if (data) {
      const parsed = JSON.parse(data);
      // Basic validation to ensure all keys exist
      return {
        categories: parsed.categories || [],
        topics: parsed.topics || [],
        students: parsed.students || [],
        sessions: parsed.sessions || [],
      };
    }
    return DEFAULT_DB;
  } catch (e) {
    console.error("Failed to parse DB from localStorage, returning default DB.", e);
    return DEFAULT_DB;
  }
};

const saveDb = (db: Database) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};


// --- Public Data Service ---
export const dataService = {
  getDb,
  
  // Category Actions
  addCategory: (cat: Omit<CourseCategory, 'id'>) => {
    const db = getDb();
    const newCategory: CourseCategory = { ...cat, id: `cat_${Date.now()}`};
    const newDb = { ...db, categories: [...db.categories, newCategory] };
    saveDb(newDb);
  },

  updateCategory: (updatedCat: CourseCategory) => {
    const db = getDb();
    const newDb = {
      ...db,
      categories: db.categories.map(c => c.id === updatedCat.id ? updatedCat : c)
    };
    saveDb(newDb);
  },

  deleteCategory: (catId: string) => {
    const db = getDb();
    // Identify topics to remove first
    const topicsToDelete = new Set(db.topics.filter(t => t.categoryId === catId).map(t => t.id));
    
    const newDb: Database = {
      categories: db.categories.filter(c => c.id !== catId),
      topics: db.topics.filter(t => t.categoryId !== catId),
      // Remove sessions linked to the deleted topics
      sessions: db.sessions.filter(s => !topicsToDelete.has(s.topicId)),
      // Remove this category from student enrollments
      students: db.students.map(s => ({
        ...s,
        enrollments: s.enrollments.filter(e => e.categoryId !== catId),
      })),
    };
    saveDb(newDb);
  },

  // Topic Actions
  addTopic: (topic: Omit<Topic, 'id'>) => {
    const db = getDb();
    const newTopic: Topic = { ...topic, id: `topic_${Date.now()}`};
    const newDb = { ...db, topics: [...db.topics, newTopic] };
    saveDb(newDb);
  },

  updateTopic: (updated: Topic) => {
    const db = getDb();
    const newDb = { ...db, topics: db.topics.map(t => t.id === updated.id ? updated : t) };
    saveDb(newDb);
  },

  deleteTopic: (topicId: string) => {
    const db = getDb();
    const newDb: Database = {
        ...db,
        topics: db.topics.filter(t => t.id !== topicId),
        sessions: db.sessions.filter(s => s.topicId !== topicId),
    };
    saveDb(newDb);
  },

  // Student Actions
  addStudent: (student: Omit<Student, 'id'>) => {
    const db = getDb();
    const newStudent: Student = { ...student, id: `stu_${Date.now()}` };
    const newDb = { ...db, students: [...db.students, newStudent] };
    saveDb(newDb);
  },

  updateStudent: (updatedStudent: Student) => {
    const db = getDb();
    const newDb = { ...db, students: db.students.map(s => s.id === updatedStudent.id ? updatedStudent : s) };
    saveDb(newDb);
  },

  deleteStudent: (studentId: string) => {
    const db = getDb();
    const newDb: Database = {
      ...db,
      students: db.students.filter(s => s.id !== studentId),
      // Also remove the student from any session attendance records
      sessions: db.sessions.map(session => ({
        ...session,
        attendees: session.attendees.filter(a => a.studentId !== studentId),
      })),
    };
    saveDb(newDb);
  },

  // Session Actions
  addSessions: (sessionData: Omit<Session, 'id' | 'attendees'>, occurrences: number = 1) => {
    const db = getDb();
    const newSessions: Session[] = [];
    
    // STRICT UTC DATE HANDLING
    // We split the date string (YYYY-MM-DD) and construct a UTC date object directly.
    // This avoids local timezone interference which was shifting dates by one day.
    const [year, month, day] = sessionData.date.split('-').map(Number);
    // Note: month is 0-indexed in Date constructor
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    
    for (let i = 0; i < occurrences; i++) {
      const nextDate = new Date(baseDate);
      // Add 7 days per occurrence in UTC
      nextDate.setUTCDate(baseDate.getUTCDate() + (i * 7));
      
      const isoDate = nextDate.toISOString().split('T')[0];
      
      newSessions.push({
        ...sessionData,
        id: `ses_${Date.now()}_${i}`,
        date: isoDate,
        attendees: []
      });
    }
    
    const newDb = { ...db, sessions: [...db.sessions, ...newSessions] };
    saveDb(newDb);
  },

  updateAttendance: (sessionId: string, studentId: string, status: AttendanceStatus) => {
    const db = getDb();
    
    const session = db.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const student = db.students.find(s => s.id === studentId);
    if (!student) return;

    const enrollment = student.enrollments.find(e => e.categoryId === session.categoryId);
    const oldAttendee = session.attendees.find(a => a.studentId === studentId);
    
    const wasAttended = oldAttendee?.status === 'attended';
    const isAttended = status === 'attended';
    
    let usageChange = 0;
    if (wasAttended && !isAttended) {
      usageChange = -1; // Was attended, now is not -> decrease usage
    } else if (!wasAttended && isAttended) {
      usageChange = 1; // Was not attended, now is -> increase usage
    }

    const newDb: Database = {
      ...db,
      sessions: db.sessions.map(s => {
        if (s.id !== sessionId) return s;
        
        const newAttendees = [...s.attendees];
        const attendeeIdx = newAttendees.findIndex(a => a.studentId === studentId);

        if (attendeeIdx > -1) {
          // Update existing record
          newAttendees[attendeeIdx] = { ...newAttendees[attendeeIdx], status };
        } else {
          // Add new record
          newAttendees.push({ studentId, status });
        }
        return { ...s, attendees: newAttendees };
      }),
      students: db.students.map(stud => {
        if (stud.id !== studentId || !enrollment || usageChange === 0) return stud;
        return {
          ...stud,
          enrollments: stud.enrollments.map(e => 
            e.categoryId === session.categoryId 
            ? { ...e, used: Math.max(0, e.used + usageChange) } 
            : e
          )
        };
      })
    };
    
    saveDb(newDb);
  }
};
