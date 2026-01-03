
export const DB_KEY = 'edu_vanilla_db_v8_ux_enhanced';

export const COLORS = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];

export const DEFAULT_DB = {
    categories: [
        { id: 'c1', name: '花藝設計', description: '包含乾燥花與鮮花製作', color: 'bg-rose-500', defaultCredits: 10 },
        { id: 'c2', name: '商業攝影', description: '商品與人像攝影技巧', color: 'bg-indigo-500', defaultCredits: 8 }
    ],
    topics: [
        { id: 't1', categoryId: 'c1', name: '基礎捧花製作', description: '圓形捧花技巧', estimatedSessions: 2 },
        { id: 't2', categoryId: 'c2', name: '自然光運用', description: '室內自然光拍攝', estimatedSessions: 1 }
    ],
    students: [
        { id: 's1', name: '張小美', phone: '0912-345-678', email: 'mei@test.com', carrierId: '/AB1234', note: '喜歡紫色系花材', enrollments: [{ categoryId: 'c1', totalPurchased: 10, used: 1 }] }
    ],
    sessions: [] 
};
