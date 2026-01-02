
export type AttendanceStatus = 'attended' | 'late' | 'leave' | 'absent';

export enum DayOfWeek {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday'
}

// FIX: Added missing Course and Slot types. These were being imported in several components but were not defined.
export interface Slot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface Course {
  id: string;
  name: string;
  instructor: string;
  room: string;
  credits: number;
  color: string;
  slots: Slot[];
}

export interface Topic {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  estimatedSessions: number;
}

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Enrollment {
  categoryId: string;
  totalPurchased: number;
  used: number;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  enrollments: Enrollment[];
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

export interface Session {
  id: string;
  categoryId: string;
  topicId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  attendees: AttendanceRecord[];
}

export interface Database {
  categories: CourseCategory[];
  topics: Topic[];
  students: Student[];
  sessions: Session[];
}