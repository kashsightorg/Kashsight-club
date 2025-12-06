
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, push, child } from 'firebase/database';
import { User, Course, Sacco, BusinessLoan, Partnership, ForumPost, Message } from "../types";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCQX7x3rXcD6OHHOUz14kGmbIpY3wn4MbY",
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

// --- Initial Mock Data for First Run Seeding ---
const MOCK_USERS: User[] = [
  { 
    id: 'u1', username: 'adminmaster', name: 'Admin Master', email: 'admin@kashsight.com', mpesaNumber: '712345678', whatsappNumber: '712345678', countryCode: '+254', passwordHash: 'c2FsdHlfcGFzc3dvcmQ=', 
    avatar: 'https://ui-avatars.com/api/?name=Admin+Master&background=000&color=fff', 
    coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    bio: 'Founder of JuaSkill. Dedicated to empowering local artisans.', location: 'Nairobi HQ',
    role: 'ADMIN', isClubMember: true, points: 5000, balance: 150000, skills: ['Management'], joinedAt: Date.now()
  }
];

// --- Store Logic ---

export const subscribeToData = (callback: (data: any) => void) => {
  const rootRef = ref(db, '/');
  return onValue(rootRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
        // Ensure arrays exist even if DB returns objects or nulls
        const parsedData = {
            users: val.users ? Object.values(val.users) : [],
            courses: val.courses ? Object.values(val.courses) : [],
            saccos: val.saccos ? Object.values(val.saccos) : [],
            loans: val.loans ? Object.values(val.loans) : [],
            partnerships: val.partnerships ? Object.values(val.partnerships) : [],
            forums: val.forums ? Object.values(val.forums).reverse() : [], // Newest first
            messages: val.messages ? Object.values(val.messages) : []
        };
        callback(parsedData);
    } else {
        // Initialize DB if empty
        set(ref(db, 'users/u1'), MOCK_USERS[0]);
    }
  });
};

export const DBService = {
    // Generic update
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
        await set(newRef, { ...data, id: newRef.key }); // Use firebase key as ID
        return newRef.key;
    }
};

export const AuthService = {
    login: (users: User[], email: string, password: string): User | null => {
        // Simple client-side hash check for this demo (Not secure for production auth, but requested "use firebase as database")
        const hash = btoa('salty_' + password);
        const user = users.find(u => u.email === email && u.passwordHash === hash) || null;
        if (user) {
            localStorage.setItem('js_current_user_id', user.id); // Keep session ID local
        }
        return user;
    },
    register: async (username: string, name: string, email: string, password: string, mpesa: string, whatsapp: string, role: 'LEARNER' | 'COACH'): Promise<User> => {
        const userId = 'u' + Date.now();
        const newUser: User = {
            id: userId,
            username,
            name, email, 
            mpesaNumber: mpesa, whatsappNumber: whatsapp, countryCode: '+254',
            passwordHash: btoa('salty_' + password),
            // Initials avatar logic: standard UI avatar service with initials
            avatar: `https://ui-avatars.com/api/?name=${username.substring(0,2).toUpperCase()}&background=random&color=fff&size=128&bold=true`,
            coverImage: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&w=1200&q=80',
            bio: 'New to JuaSkill!', location: 'Kenya',
            role, isClubMember: false, points: 10, balance: 0, skills: [],
            joinedAt: Date.now()
        };
        
        // Write to Firebase
        await set(ref(db, `users/${userId}`), newUser);
        localStorage.setItem('js_current_user_id', userId);
        return newUser;
    },
    logout: () => {
        localStorage.removeItem('js_current_user_id');
    },
    getPersistedUserId: (): string | null => {
        return localStorage.getItem('js_current_user_id');
    }
};
