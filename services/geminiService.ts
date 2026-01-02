
import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getScheduleAdvice(courses: Course[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `I have the following courses in my schedule: ${JSON.stringify(courses)}. 
      Can you analyze this schedule for any potential issues (like back-to-back heavy classes, poor study-life balance, or missing lunch breaks) and suggest improvements or advice? 
      Keep it professional and concise.`,
      config: {
        systemInstruction: "You are an expert academic advisor helping university students optimize their course schedules.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "I'm currently unable to analyze the schedule. Please try again later.";
  }
}

export async function checkConflict(newCourse: Course, existingCourses: Course[]) {
  // Simple deterministic check for direct overlaps
  const conflicts = [];
  for (const existing of existingCourses) {
    for (const newSlot of newCourse.slots) {
      for (const existingSlot of existing.slots) {
        if (newSlot.day === existingSlot.day) {
          const newStart = parseInt(newSlot.startTime.replace(':', ''));
          const newEnd = parseInt(newSlot.endTime.replace(':', ''));
          const existStart = parseInt(existingSlot.startTime.replace(':', ''));
          const existEnd = parseInt(existingSlot.endTime.replace(':', ''));

          if ((newStart < existEnd) && (newEnd > existStart)) {
            conflicts.push(`Conflict with ${existing.name} on ${newSlot.day}`);
          }
        }
      }
    }
  }
  return conflicts;
}
