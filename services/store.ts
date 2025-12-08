
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, push, remove } from 'firebase/database';
import { User, Course, Resource, Channel } from "../types";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "kashsight-4cbb8.firebaseapp.com", 
  databaseURL: "https://kashsight-4cbb8-default-rtdb.firebaseio.com",
  projectId: "kashsight-4cbb8",
  storageBucket: "kashsight-4cbb8.appspot.com",
  messagingSenderId: "394824465014",
  appId: "1:394824465014:web:dummy" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- AI Course Generator ---
const generateAICourses = (): Course[] => {
    const topics = [
        "Solar Panel Installation", "Organic Poultry Farming", "Smartphone Repair", 
        "Catering & Event Management", "Soap & Detergent Manufacturing", "Digital Marketing for Local Biz",
        "Exporting Local Goods", "Fashion Design & Tailoring", "Barber Shop Management", "Waste Recycling Business"
    ];
    const locations = ["Lagos", "Nairobi", "Accra", "Johannesburg", "Dar es Salaam", "Kigali"];
    const adjectives = ["Profitable", "Modern", "Sustainable", "High-Growth", "Essential"];

    return Array.from({ length: 10 }).map((_, i) => {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const loc = locations[Math.floor(Math.random() * locations.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const isPaid = i % 2 !== 0;
        const price = isPaid ? 1500 : 0;

        return {
            id: `ai_c_${Date.now()}_${i}`,
            coachId: isPaid ? 'coach_human' : 'ai_system',
            title: `${adj} ${topic} in ${loc}`,
            description: `A complete guide to starting a ${topic} business in the ${loc} market.`,
            category: i % 2 === 0 ? 'Manufacturing' : 'Services',
            format: isPaid ? 'WHATSAPP_CLASS' : 'AI_SELF_PACED',
            price: price, 
            pricePro: isPaid ? 1000 : 0, // Pro Discount
            thumbnail: `https://source.unsplash.com/random/800x600?business,${i}`,
            enrolledCount: Math.floor(Math.random() * 500),
            rating: 4 + Math.random(),
            isPremium: isPaid,
            generatedByAI: !isPaid,
            whatsappLink: isPaid ? 'https://whatsapp.com/channel/example' : undefined,
            modules: !isPaid ? [
                {
                    title: "Market Research",
                    content: "Understanding your local customer base is key...",
                    task: "Interview 5 potential customers in your area.",
                    quizQuestion: "What is the most important factor in pricing?",
                    quizOptions: ["Cost", "Value", "Competition", "Guesswork"],
                    quizAnswer: "Value"
                },
                {
                    title: "Sourcing Materials",
                    content: "Where to find affordable raw materials in local markets...",
                    task: "Visit the nearest wholesale market and price check 3 items.",
                    quizQuestion: "Buying in bulk usually offers?",
                    quizOptions: ["Higher Price", "Lower Price", "Same Price", "Risk"],
                    quizAnswer: "Lower Price"
                }
            ] : undefined
        } as Course;
    });
};

const MOCK_CHANNELS: Channel[] = [
    { id: 'c1', name: 'general-lobby', description: 'General discussion for all entrepreneurs' },
    { id: 'c2', name: 'farming-agri', description: 'Agriculture, Poultry and Farming' },
    { id: 'c3', name: 'tech-repair', description: 'Phone, Laptop and Electronics repair' },
    { id: 'c4', name: 'manufacturing', description: 'Soap, Metalwork, and creation' },
    { id: 'c5', name: 'mwalimu-help', description: 'Ask Mwalimu for business advice' }
];

const MOCK_USERS: User[] = [
  { 
    id: 'u1', username: 'adminmaster', name: 'Admin Master', email: 'admin@kashsight.com', phone: '254712345678', country: 'Kenya', currency: 'KES',
    role: 'ADMIN', isClubMember: true, points: 9999, balance: 0, skills: ['Management'], joinedAt: Date.now(),
    avatar: 'https://ui-avatars.com/api/?name=Admin+Master&background=000&color=fff',
    lastDownloadTimestamp: 0, purchasedCourseIds: []
  }
];

const MOCK_RESOURCES: Resource[] = [
    {
        id: 'r1', title: 'Pan-African Market Penetration Framework', description: 'Step-by-step guide to entering new markets in East and West Africa.',
        type: 'FRAMEWORK', price: 1, coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
        downloadUrl: '#', author: 'KashSight Intelligence'
    },
    {
        id: 'r2', title: 'SME Growth Strategy 2025', description: 'Scaling your Jua Kali business from 1 to 10 employees.',
        type: 'STRATEGY', price: 1, coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80',
        downloadUrl: '#', author: 'KashSight Experts'
    }
];

// --- Store Logic ---

export const subscribeToData = (callback: (data: any) => void) => {
  const rootRef = ref(db, '/');
  return onValue(rootRef, (snapshot) => {
    const val = snapshot.val();
    
    // Seed Data if missing
    if (!val || !val.courses || !val.channels) {
        console.log("Seeding Database...");
        const updates: any = {};
        if (!val?.users) updates['users/u1'] = MOCK_USERS[0];
        
        if (!val?.courses) {
            const aiCourses = generateAICourses();
            aiCourses.forEach(c => updates[`courses/${c.id}`] = c);
        }
        
        if (!val?.resources) {
            MOCK_RESOURCES.forEach(r => updates[`resources/${r.id}`] = r);
        }

        if (!val?.channels) {
            MOCK_CHANNELS.forEach(c => updates[`channels/${c.id}`] = c);
        }
        
        update(ref(db, '/'), updates);
    }

    if (val) {
        const parsedData = {
            users: val.users ? Object.values(val.users) : [],
            courses: val.courses ? Object.values(val.courses) : [],
            resources: val.resources ? Object.values(val.resources) : [],
            paymentRequests: val.paymentRequests ? Object.values(val.paymentRequests) : [],
            channels: val.channels ? Object.values(val.channels) : [],
            messages: val.messages ? Object.values(val.messages) : []
        };
        callback(parsedData);
    } else {
        callback({ users: [], courses: [], resources: [], paymentRequests: [], channels: [], messages: [] });
    }
  });
};

export const DBService = {
    update: async (path: string, data: any) => {
        const dbRef = ref(db, path);
        await update(dbRef, data);
    },
    set: async (path: string, data: any) => {
        const dbRef = ref(db, path);
        await set(dbRef, data);
    },
    push: async (path: string, data: any) => {
        const listRef = ref(db, path);
        const newRef = push(listRef);
        await set(newRef, { ...data, id: newRef.key });
        return newRef.key;
    },
    remove: async (path: string) => {
        const dbRef = ref(db, path);
        await remove(dbRef);
    }
};

const SESSION_KEY = 'js_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 Hours in MS

export const AuthService = {
    login: (users: User[], email: string, password: string): User | null => {
        // Master Admin Override
        if (email === 'admin@kashsight.learn' && password === 'admin1') {
            const admin = users.find(u => u.email === 'admin@kashsight.learn') || users.find(u => u.role === 'ADMIN');
            if (admin) return admin;
        }

        const hash = btoa('salty_' + password);
        const user = users.find(u => u.email === email && u.passwordHash === hash) || null;
        if (user) {
            const session = { uid: user.id, expiry: Date.now() + SESSION_DURATION };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
        return user;
    },
    register: async (username: string, name: string, email: string, password: string, phone: string, role: 'LEARNER' | 'COACH' | 'ADMIN'): Promise<User> => {
        // Admin Pattern Check: e.g. ezra.kashsight@admin.ac
        const adminPattern = /[a-zA-Z0-9._%+-]+\.kashsight@admin\.ac$/;
        let finalRole = role;
        
        if (adminPattern.test(email)) {
            finalRole = 'ADMIN';
        }

        const userId = 'u' + Date.now();
        const newUser: User = {
            id: userId,
            username,
            name, email, 
            phone, country: 'Africa', currency: 'USD',
            passwordHash: btoa('salty_' + password),
            avatar: `https://ui-avatars.com/api/?name=${username.substring(0,2).toUpperCase()}&background=random&color=fff&size=128&bold=true`,
            role: finalRole, 
            isClubMember: false, points: 10, balance: 0, skills: [],
            joinedAt: Date.now(),
            lastDownloadTimestamp: 0, purchasedCourseIds: [],
            courseProgress: {}
        };
        await set(ref(db, `users/${userId}`), newUser);
        
        const session = { uid: userId, expiry: Date.now() + SESSION_DURATION };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        
        return newUser;
    },
    logout: () => {
        localStorage.removeItem(SESSION_KEY);
    },
    getPersistedUserId: (): string | null => {
        try {
            const sessionStr = localStorage.getItem(SESSION_KEY);
            if (!sessionStr) return null;
            const session = JSON.parse(sessionStr);
            if (Date.now() > session.expiry) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return session.uid;
        } catch (e) {
            return null;
        }
    }
};
