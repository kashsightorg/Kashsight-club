

import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { User, Course, Sacco, BusinessLoan, Partnership, ForumPost, Message } from './types';
import { subscribeToData, DBService, AuthService } from './services/store';
import { getBusinessAdvice } from './services/geminiService';
import { Button, Input, Modal, Card, Badge } from './components/UI';
import { 
  HomeIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  WalletIcon, 
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  CheckBadgeIcon,
  BuildingStorefrontIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  HandThumbUpIcon,
  BookOpenIcon,
  MapPinIcon,
  UserCircleIcon,
  PencilIcon,
  CameraIcon,
  PhoneIcon,
  ChatBubbleOvalLeftIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  PowerIcon
} from '@heroicons/react/24/outline';
import { StarIcon, HeartIcon } from '@heroicons/react/24/solid';

// --- Context & State ---

interface AppContextType {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  saccos: Sacco[];
  loans: BusinessLoan[];
  partnerships: Partnership[];
  forumPosts: ForumPost[];
  messages: Message[];
  systemStatus: { maintenance: boolean };
  joinClub: () => void;
  buyCourse: (courseId: string) => void;
  createSacco: (name: string, desc: string, contribution: number) => void;
  requestLoan: (amount: number, purpose: string) => void;
  postPartnership: (title: string, desc: string, type: 'ACADEMY_FORMATION' | 'B2B_COLLAB') => void;
  postForum: (text: string) => void;
  likeForumPost: (postId: string) => void;
  chatWithAI: (msg: string) => Promise<string>;
  login: (e: string, p: string) => boolean;
  register: (u: string, n: string, e: string, p: string, mpesa: string, whatsapp: string, role: 'LEARNER'|'COACH'|'ADMIN') => void;
  logout: () => void;
  addPoints: (pts: number) => void;
  updateProfile: (data: Partial<User>) => void;
  toggleMaintenance: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Helper for Initials Avatar ---
const InitialsAvatar = ({ name, url, className = "w-10 h-10" }: { name: string, url: string, className?: string }) => {
    return (
        <img 
            src={url || `https://ui-avatars.com/api/?name=${name ? name.substring(0,2) : 'User'}&background=random&color=000&bold=true`} 
            alt={name} 
            className={`${className} rounded-full object-cover border border-slate-200 bg-slate-100`} 
        />
    );
};

// --- Modern Loading Screen ---
const LoadingScreen = () => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
        <div className="relative w-64 h-64">
            {/* Brain Outline SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200 stroke-current stroke-[0.5] fill-none">
                 <path d="M50 25 C30 25 20 40 20 60 C20 80 40 90 50 90 C60 90 80 80 80 60 C80 40 70 25 50 25 Z M50 25 C50 15 40 10 30 15 C20 20 20 40 20 60" />
                 <path d="M50 25 C50 15 60 10 70 15 C80 20 80 40 80 60" />
                 <path d="M50 35 L50 80" />
                 <path d="M30 45 L70 45" />
            </svg>
            
            {/* Animated Nodes entering the brain */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
                <div className="absolute top-10 left-10 w-2 h-2 bg-black rounded-full animate-[bounce_2s_infinite]"></div>
                <div className="absolute top-20 right-20 w-3 h-3 bg-green-600 rounded-full animate-[bounce_2.5s_infinite]"></div>
                <div className="absolute bottom-20 left-16 w-2 h-2 bg-slate-800 rounded-full animate-[bounce_1.8s_infinite]"></div>
                <div className="absolute top-5 right-32 w-1.5 h-1.5 bg-green-400 rounded-full animate-[ping_3s_infinite]"></div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                 <WrenchScrewdriverIcon className="w-16 h-16 text-black animate-pulse" />
            </div>
        </div>
        <div className="mt-8 text-center space-y-2">
             <h2 className="text-3xl font-black text-black tracking-widest uppercase">KashSight</h2>
             <p className="text-green-600 text-sm font-medium animate-pulse">Loading African Innovation...</p>
        </div>
    </div>
);

// --- Auth Component (Full Screen Popup) ---

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { login, register } = useApp();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<'LEARNER' | 'COACH'>('LEARNER');
    const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '', whatsapp: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const success = login(formData.email, formData.password);
                if (!success) {
                     setError('Invalid credentials.');
                } else {
                    onClose();
                }
            } else {
                if (!formData.username || !formData.name || !formData.email || !formData.password || !formData.whatsapp) {
                    setError('All fields are required');
                    setLoading(false);
                    return;
                }
                
                // Admin backdoor check inside handle submit
                let assignedRole: 'LEARNER' | 'COACH' | 'ADMIN' = role;
                if(formData.email === 'admin@kashsight.learn' && formData.password === 'admin1') {
                    assignedRole = 'ADMIN';
                }

                await register(formData.username, formData.name, formData.email, formData.password, formData.whatsapp, formData.whatsapp, assignedRole);
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="w-full h-full md:h-auto md:max-w-5xl bg-white shadow-2xl md:rounded-3xl overflow-hidden flex flex-col md:flex-row relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full z-50 transition-colors">
                    <XMarkIcon className="w-6 h-6 text-black" />
                </button>

                {/* Left Side - Image & Branding */}
                <div className="hidden md:flex w-1/2 bg-black text-white relative flex-col justify-between p-12">
                     <img 
                        src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80" 
                        className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
                        alt="Background"
                     />
                     <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-4">
                             <div className="bg-white p-2 rounded rotate-3">
                                 <WrenchScrewdriverIcon className="w-6 h-6 text-black" />
                             </div>
                             <h2 className="text-3xl font-black uppercase tracking-tight">KashSight</h2>
                         </div>
                         <p className="text-green-400 font-medium">Built for the Hustlers.</p>
                     </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center overflow-y-auto bg-white">
                    <div className="max-w-md mx-auto w-full">
                        <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Join the Club'}
                        </h2>
                        <p className="text-slate-500 mb-8 font-medium">
                            {isLogin ? 'Enter your details to manage your hustle.' : 'Start your journey to financial freedom today.'}
                        </p>
                        
                        {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-lg mb-6 border border-red-100 font-medium">{error}</div>}
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div className="flex gap-4 mb-6">
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${role === 'LEARNER' ? 'border-black bg-black text-white' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="role" className="hidden" onClick={() => setRole('LEARNER')} />
                                        <span className="font-bold text-sm uppercase tracking-wide">Learner</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${role === 'COACH' ? 'border-black bg-black text-white' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="role" className="hidden" onClick={() => setRole('COACH')} />
                                        <span className="font-bold text-sm uppercase tracking-wide">Coach</span>
                                    </label>
                                </div>
                            )}
                            {!isLogin && (
                                <>
                                    <Input placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                    <Input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </>
                            )}
                            <Input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            <Input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            {!isLogin && (
                                <Input 
                                    type="tel" 
                                    placeholder="WhatsApp Number" 
                                    value={formData.whatsapp} 
                                    onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                                />
                            )}
                            
                            <Button className="w-full mt-6 bg-black hover:bg-slate-800 text-white py-4 text-lg shadow-xl" type="submit" disabled={loading}>
                                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Get Started')}
                            </Button>
                        </form>

                        <div className="mt-8 text-center text-sm">
                            <span className="text-slate-500 font-medium">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
                            <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-green-700 font-black hover:underline uppercase tracking-wide">
                                {isLogin ? 'Register' : 'Login'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Dynamic Notification Component ---
const DynamicNotification = () => {
    const notifications = [
      { icon: <CheckBadgeIcon className="w-6 h-6"/>, title: "Loan Approved", value: "Ksh 50,000", color: "text-green-600", bg: "bg-green-100" },
      { icon: <UserGroupIcon className="w-6 h-6"/>, title: "Sacco Update", value: "Metal Works Sacco Formed", color: "text-blue-600", bg: "bg-blue-100" },
      { icon: <SparklesIcon className="w-6 h-6"/>, title: "Milestone", value: "Reached 3000 Members", color: "text-amber-600", bg: "bg-amber-100" },
      { icon: <UserCircleIcon className="w-6 h-6"/>, title: "New Member", value: "Jane joined Investors Club", color: "text-purple-600", bg: "bg-purple-100" },
    ];
    const [index, setIndex] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => setIndex(i => (i + 1) % notifications.length), 3000);
      return () => clearInterval(interval);
    }, []);
  
    const current = notifications[index];
  
    return (
      <div key={index} className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-2xl z-20 flex items-center gap-4 border border-slate-100 animate-in slide-in-from-bottom duration-500 min-w-[240px]">
          <div className={`${current.bg} p-2 rounded-full ${current.color}`}>
              {current.icon}
          </div>
          <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{current.title}</p>
              <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{current.value}</p>
          </div>
      </div>
    )
}

// --- Landing Page ---

const LandingPage = ({ onAuthRequest }: { onAuthRequest: () => void }) => {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">
            {/* Header */}
            <header className="fixed top-0 w-full z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-black p-2 rounded-lg rotate-3">
                            <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight uppercase text-black">KashSight</h1>
                    </div>
                    <nav className="hidden md:flex gap-8 text-sm font-bold text-slate-600">
                        <a href="#features" className="hover:text-black">Features</a>
                        <a href="#how-it-works" className="hover:text-black">How it Works</a>
                        <a href="#community" className="hover:text-black">Community</a>
                    </nav>
                    <div className="flex gap-4">
                        <Button onClick={onAuthRequest} variant="outline" className="hidden md:block border-slate-200 text-black hover:border-black">Login</Button>
                        <Button onClick={onAuthRequest} className="bg-black text-white hover:bg-slate-800 shadow-xl shadow-slate-200">Get Started</Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-8 animate-in slide-in-from-left duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-wider">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        The #1 Jua Kali Platform
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black leading-tight text-slate-900 tracking-tight">
                        Learn a Trade. <br/>
                        <span className="text-green-600 decoration-4 decoration-black underline-offset-4">Build an Empire.</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
                        Skip the online fluff. Master real skills like <span className="text-black font-bold">Welding, Carpentry & Mechanics</span>. Connect with Saccos and grow your workshop.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={onAuthRequest} className="bg-black hover:bg-slate-800 text-white px-8 py-4 text-lg border-none w-full sm:w-auto shadow-2xl shadow-green-900/20">Join the Club</Button>
                        <Button onClick={onAuthRequest} variant="outline" className="px-8 py-4 text-lg w-full sm:w-auto">Explore Trades</Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500 pt-4">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                            <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>
                            <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white"></div>
                        </div>
                        <p>Join 2,000+ Kenyan Artisans</p>
                    </div>
                </div>
                
                {/* Image Section - Jua Kali Themed */}
                <div className="flex-1 relative animate-in slide-in-from-right duration-700 delay-200 w-full max-w-md mx-auto">
                    <div className="absolute inset-0 bg-black rounded-[2rem] transform rotate-3 scale-105 opacity-10"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80" 
                        alt="Kenyan Welder Jua Kali" 
                        className="rounded-[2rem] shadow-2xl relative z-10 w-full object-cover h-[450px] border-4 border-white bg-slate-100"
                    />
                    
                    {/* Dynamic Floating Card */}
                    <DynamicNotification />
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Everything You Need to Succeed</h2>
                        <p className="text-slate-500">We don't just teach you a skill; we give you the tools, capital, and network to turn that skill into a profitable business.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-black">
                            <div className="bg-slate-100 w-12 h-12 rounded-lg flex items-center justify-center text-black mb-6">
                                <WrenchScrewdriverIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Vocational Training</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Learn from experienced coaches in your area. Physical meetups for practicals and video guides for theory.
                            </p>
                        </Card>
                        <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-green-600">
                            <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-6">
                                <UserGroupIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Saccos & Chama</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Join forces with other artisans. Save together to buy expensive machinery or bulk materials.
                            </p>
                        </Card>
                        <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-slate-500">
                            <div className="bg-slate-100 w-12 h-12 rounded-lg flex items-center justify-center text-slate-600 mb-6">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Mwalimu AI Coach</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                24/7 business advice tailored for the Kenyan market. Ask about pricing, suppliers, or permits.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-slate-400 py-16 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6 text-white">
                            <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
                            <span className="text-2xl font-black uppercase tracking-tight">KashSight</span>
                        </div>
                        <p className="text-sm max-w-sm leading-relaxed text-slate-500">
                            Empowering the Jua Kali sector through technology, community, and capital. Built for Kenya 🇰🇪.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-green-500 transition-colors">Find a Coach</a></li>
                            <li><a href="#" className="hover:text-green-500 transition-colors">Browse Courses</a></li>
                            <li><a href="#" className="hover:text-green-500 transition-colors">Business Loans</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Support</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-green-500 transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-green-500 transition-colors">For Coaches</a></li>
                            <li><a href="#" className="hover:text-green-500 transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
                    &copy; 2024 KashSight Inc. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

// --- User Profile Component ---

const UserProfile = () => {
    const { currentUser, updateProfile } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<User>>({});

    // Fix: Only update editData when STARTING edit or if data is empty. 
    // Do NOT rely on currentUser changes to reset this while editing.
    useEffect(() => {
        if(currentUser && !isEditing) {
            setEditData({
                name: currentUser.name,
                username: currentUser.username,
                bio: currentUser.bio,
                location: currentUser.location,
                mpesaNumber: currentUser.mpesaNumber,
                whatsappNumber: currentUser.whatsappNumber,
                skills: currentUser.skills
            });
        }
    }, [currentUser, isEditing]);

    if (!currentUser) return null;

    const handleSave = () => {
        updateProfile(editData);
        setIsEditing(false);
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cover & Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="h-48 bg-slate-100 relative group">
                    <img src={currentUser.coverImage || 'https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&w=1200&q=80'} className="w-full h-full object-cover grayscale opacity-80" />
                    <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CameraIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col md:flex-row items-end -mt-16 mb-4 gap-4">
                         <div className="relative">
                            <InitialsAvatar name={currentUser.username || currentUser.name} url={currentUser.avatar} className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white" />
                            <button className="absolute bottom-2 right-2 bg-black text-white p-1.5 rounded-full hover:bg-slate-800 border border-white">
                                <CameraIcon className="w-4 h-4" />
                            </button>
                         </div>
                         <div className="flex-1 mb-2">
                             <h1 className="text-2xl font-black text-slate-800">{currentUser.name}</h1>
                             <p className="text-slate-500 text-sm font-bold">@{currentUser.username}</p>
                             <p className="text-slate-500 flex items-center gap-1 text-sm mt-1">
                                <MapPinIcon className="w-4 h-4" /> {currentUser.location || 'Location not set'}
                             </p>
                         </div>
                         <div className="flex gap-2 mb-2">
                             {isEditing ? (
                                 <>
                                    <Button onClick={() => setIsEditing(false)} variant="secondary" className="text-xs px-4 py-2">Cancel</Button>
                                    <Button onClick={handleSave} className="text-xs px-4 py-2 bg-black text-white border-none hover:bg-green-700">Save Changes</Button>
                                 </>
                             ) : (
                                 <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2 text-xs px-4 py-2 hover:border-black">
                                     <PencilIcon className="w-4 h-4" /> Edit Profile
                                 </Button>
                             )}
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                        {/* Left Column: Intro */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4 text-lg uppercase tracking-wider">About</h3>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <Input placeholder="Username" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} />
                                        <textarea 
                                            className="w-full p-4 border-b-2 border-slate-200 bg-slate-50 focus:bg-slate-100 focus:border-black outline-none text-slate-900 rounded-t-lg transition-all" 
                                            rows={4}
                                            value={editData.bio} 
                                            placeholder="Tell us about your business..."
                                            onChange={e => setEditData({...editData, bio: e.target.value})} 
                                        />
                                        <Input placeholder="Location" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} />
                                    </div>
                                ) : (
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4 font-medium">
                                        {currentUser.bio || "No bio added yet."}
                                    </p>
                                )}
                                
                                <div className="space-y-3 text-sm mt-4">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <BriefcaseIcon className="w-5 h-5 text-slate-400" />
                                        <span>Role: <strong className="uppercase text-slate-800">{currentUser.role}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <SparklesIcon className="w-5 h-5 text-green-600" />
                                        <span>Points: <strong className="text-green-600">{currentUser.points}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <PhoneIcon className="w-5 h-5 text-slate-400" />
                                        {isEditing ? (
                                            <div className="flex-1">
                                                <Input placeholder="WhatsApp" value={editData.whatsappNumber} onChange={e => setEditData({...editData, whatsappNumber: e.target.value})} />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span>{currentUser.whatsappNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                             <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-3 uppercase tracking-wider">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentUser.skills.map(skill => (
                                        <span key={skill} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                                            {skill}
                                        </span>
                                    ))}
                                    {isEditing && <button className="text-xs text-green-600 font-bold px-2 hover:underline">+ Add Skill</button>}
                                </div>
                             </div>
                        </div>

                        {/* Right Column: Activity Feed */}
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Recent Activity</h3>
                            <Card className="flex items-center gap-4 py-4 border-l-4 border-l-green-500">
                                <div className="p-2 bg-green-50 rounded-full text-green-600">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">You earned <span className="text-green-600">50 points!</span></p>
                                    <p className="text-xs text-slate-500">Joined "Carpentry Basics" class.</p>
                                </div>
                                <span className="ml-auto text-xs text-slate-400">2h ago</span>
                            </Card>
                            <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-400">No recent posts or shares.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- App Pages ---

const Dashboard = () => {
  const { currentUser, courses, joinClub, systemStatus, toggleMaintenance } = useApp();
  if (!currentUser) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Admin Maintenance Panel */}
      {currentUser.role === 'ADMIN' && (
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 flex items-center justify-between">
              <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                      <Cog6ToothIcon className="w-5 h-5" /> Admin Controls
                  </h2>
                  <p className="text-slate-400 text-sm">System Status: <span className={systemStatus.maintenance ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{systemStatus.maintenance ? 'UNDER MAINTENANCE' : 'OPERATIONAL'}</span></p>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase text-slate-500">Maintenance Mode</span>
                  <button 
                    onClick={toggleMaintenance}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${systemStatus.maintenance ? 'bg-red-500' : 'bg-slate-700'}`}
                  >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${systemStatus.maintenance ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
              </div>
          </div>
      )}

      {/* Club Status Banner */}
      {!currentUser.isClubMember ? (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 text-white shadow-lg relative overflow-hidden border border-slate-700 group">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">Unlock KashSight Club</h2>
                      <p className="text-slate-300 max-w-xl text-sm mt-2">
                          Pay a one-time fee of <strong>Ksh 1,000</strong> to get full access: join Saccos, apply for business loans, and get verified badges.
                      </p>
                  </div>
                  <Button onClick={joinClub} className="bg-white text-black hover:bg-green-400 hover:text-black font-bold px-8 shadow-xl border-none">
                      Join Club Now
                  </Button>
              </div>
              <SparklesIcon className="absolute -top-4 -right-4 w-48 h-48 text-slate-700 opacity-20 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
          </div>
      ) : (
          <div className="bg-white rounded-xl p-6 text-slate-900 shadow-sm border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="bg-black p-2 rounded-lg">
                      <CheckBadgeIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                      <h2 className="font-bold text-lg">Club Member</h2>
                      <p className="text-green-600 text-sm font-bold">Status: Verified</p>
                  </div>
              </div>
              <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Points</p>
                  <p className="text-3xl font-black text-black">{currentUser.points}</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-t-4 border-t-black">
              <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5" /> My Learning
              </h3>
              <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="h-12 w-12 bg-slate-200 rounded overflow-hidden">
                          <img src="https://images.unsplash.com/photo-1622295023576-e413346834d9?auto=format&fit=crop&w=100&h=100" className="object-cover w-full h-full grayscale" />
                      </div>
                      <div>
                          <p className="font-bold text-slate-800 text-sm">Carpentry Basics</p>
                          <p className="text-xs text-slate-500">Progress: 45%</p>
                      </div>
                  </div>
                  <Button variant="outline" className="w-full text-xs py-3 border-slate-200 hover:border-black">Browse More Skills</Button>
              </div>
          </Card>

          <Card className="border-t-4 border-t-green-600">
               <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <BriefcaseIcon className="w-5 h-5" /> Business Hub
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase">Wallet</p>
                      <p className="text-xl font-bold text-slate-800">Ksh {currentUser.balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase">Sacco Savings</p>
                      <p className="text-xl font-bold text-green-600">Ksh 0</p>
                  </div>
              </div>
          </Card>
      </div>
      {/* Recommended Skills etc */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">Recommended Skills</h3>
                    <Link to="/courses" className="text-green-600 text-sm font-bold hover:underline">View All</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.slice(0, 2).map(c => (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-all">
                            <div className="h-32 bg-slate-200 relative">
                                <img src={c.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                <span className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                                    {c.format.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                                <h4 className="font-bold text-slate-800 mb-1 leading-tight">{c.title}</h4>
                                <p className="text-xs text-slate-500 mb-2">{c.category}</p>
                                <div className="mt-auto flex justify-between items-center">
                                    <span className="font-bold text-green-600">Ksh {c.price}</span>
                                    <div className="flex items-center text-xs text-slate-400">
                                        <StarIcon className="w-3 h-3 text-black mr-1" /> {c.rating}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                <h3 className="font-bold text-slate-800 text-lg mb-4">Community Buzz</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 h-full">
                    <p className="text-sm font-medium text-slate-800 mb-2">Did you know?</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        Carpenters in Nairobi are forming 'Digital Saccos' to import tools directly from manufacturers. Join the conversation in the forums!
                    </p>
                    <Link to="/community" className="block w-full text-center bg-white border border-slate-300 py-3 rounded text-sm font-bold text-slate-700 hover:bg-black hover:text-white transition-colors">
                        Go to Forums
                    </Link>
                </div>
            </div>
      </div>
    </div>
  );
};

const CourseMarketplace = () => {
    const { courses, users, buyCourse } = useApp();
    const [filter, setFilter] = useState<'ALL' | 'PHYSICAL' | 'VIDEO' | 'EBOOK'>('ALL');
    
    const filtered = courses.filter(c => {
        if (filter === 'ALL') return true;
        if (filter === 'PHYSICAL') return c.format === 'PHYSICAL_COACHING';
        if (filter === 'VIDEO') return c.format === 'VIDEO';
        if (filter === 'EBOOK') return c.format === 'EBOOK';
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Skill Marketplace</h2>
                    <p className="text-slate-500 text-sm">Learn trades that pay. No online fluff.</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
                    {(['ALL', 'PHYSICAL', 'VIDEO', 'EBOOK'] as const).map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs font-bold rounded ${filter === f ? 'bg-black text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(course => {
                    const coach = users.find(u => u.id === course.coachId);
                    return (
                        <Card key={course.id} className="p-0 overflow-hidden flex flex-col h-full group hover:shadow-xl transition-shadow duration-300">
                            <div className="h-48 relative overflow-hidden bg-slate-100">
                                <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0" />
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-3 left-3 text-white">
                                    <span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded uppercase mb-1 inline-block">{course.category}</span>
                                    <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                                </div>
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <InitialsAvatar name={coach?.username || coach?.name || 'Coach'} url={coach?.avatar || ''} className="w-10 h-10 rounded-full border border-slate-200" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Coach</p>
                                        <p className="text-sm font-bold text-slate-800">{coach?.name}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="flex items-center text-slate-900 text-sm font-bold">
                                            <StarIcon className="w-4 h-4 mr-1 text-black" /> {course.rating}
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                                
                                <div className="mt-auto space-y-3">
                                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                        <span className="flex items-center gap-1">
                                            <UserGroupIcon className="w-3 h-3" /> {course.enrolledCount} Enrolled
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {course.format === 'PHYSICAL_COACHING' ? <MapPinIcon className="w-3 h-3" /> : <BookOpenIcon className="w-3 h-3" />}
                                            {course.format === 'PHYSICAL_COACHING' ? 'On-Site' : 'Online'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 font-black text-xl text-green-600">
                                            Ksh {course.price}
                                        </div>
                                        {course.format === 'PHYSICAL_COACHING' && (
                                            <div className="text-[10px] text-black bg-slate-100 px-2 py-1 rounded font-bold border border-slate-200">
                                                INCLUDES MATERIALS
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button className="text-sm py-2 bg-black hover:bg-slate-800" onClick={() => buyCourse(course.id)}>Enroll Now</Button>
                                        <Button variant="outline" className="text-sm py-2 hover:border-black" onClick={() => alert("Voucher functionality coming soon!")}>Use Voucher</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

const Financials = () => {
    const { saccos, currentUser, createSacco, loans, requestLoan, joinClub } = useApp();
    const [tab, setTab] = useState<'SACCO' | 'LOANS'>('SACCO');
    const [loanAmount, setLoanAmount] = useState('');
    const [loanPurpose, setLoanPurpose] = useState('');
    const [saccoName, setSaccoName] = useState('');
    const [saccoDesc, setSaccoDesc] = useState('');

    if (!currentUser?.isClubMember) {
        return (
            <div className="text-center py-20 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <LockClosedIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Club Membership Required</h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">Access to Saccos and Business Loans is exclusive to club members. This ensures our community remains high-quality and trusted.</p>
                <Button onClick={joinClub} className="bg-black hover:bg-slate-800 border-none text-white px-8">Join Club (Ksh 1000)</Button>
            </div>
        )
    }

    const handleLoan = (e: React.FormEvent) => {
        e.preventDefault();
        requestLoan(Number(loanAmount), loanPurpose);
        setLoanAmount(''); setLoanPurpose('');
    }

    const handleSacco = (e: React.FormEvent) => {
        e.preventDefault();
        createSacco(saccoName, saccoDesc, 2000);
        setSaccoName(''); setSaccoDesc('');
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
                <button onClick={() => setTab('SACCO')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${tab === 'SACCO' ? 'border-black text-black' : 'border-transparent text-slate-500'}`}>Saccos</button>
                <button onClick={() => setTab('LOANS')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${tab === 'LOANS' ? 'border-black text-black' : 'border-transparent text-slate-500'}`}>Business Loans</button>
            </div>

            {tab === 'SACCO' && (
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-4 rounded-lg flex justify-between items-center shadow-sm">
                        <div>
                            <h3 className="font-bold text-slate-900">Form a KashSight Sacco</h3>
                            <p className="text-xs text-slate-500">Pool funds with other artisans to buy expensive machinery.</p>
                        </div>
                        <Button onClick={() => alert('Modal for Sacco creation')} className="text-xs bg-black text-white px-4 py-2">Start Sacco</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {saccos.map(s => (
                            <Card key={s.id}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800">{s.name}</h3>
                                    <span className="bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded font-bold uppercase border border-green-100">Active</span>
                                </div>
                                <p className="text-sm text-slate-600 mb-4 h-10">{s.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-center mb-4 bg-slate-50 p-2 rounded">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Total Saved</p>
                                        <p className="font-bold text-green-600">Ksh {s.totalSavings.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Contribution</p>
                                        <p className="font-bold text-slate-800">Ksh {s.monthlyContribution}/mo</p>
                                    </div>
                                </div>
                                <Button className="w-full text-sm bg-black text-white py-2">Join Group</Button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'LOANS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-bold text-slate-800">Your Business Loans</h3>
                        {loans.filter(l => l.borrowerId === currentUser?.id).length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                <p className="text-slate-400 mb-2">No active business loans.</p>
                                <p className="text-xs text-slate-400">Apply for capital to expand your workshop.</p>
                            </div>
                        ) : (
                            loans.filter(l => l.borrowerId === currentUser?.id).map(l => (
                                <div key={l.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800">Ksh {l.amount.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">{l.purpose}</p>
                                    </div>
                                    <Badge status={l.status} />
                                </div>
                            ))
                        )}
                    </div>
                    <div>
                        <Card>
                            <h3 className="font-bold text-slate-800 mb-4">Apply for Capital</h3>
                            <form onSubmit={handleLoan} className="space-y-4">
                                <Input type="number" placeholder="Amount (Max 50k)" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
                                <Input placeholder="Business Purpose (e.g. Buy Timber)" value={loanPurpose} onChange={e => setLoanPurpose(e.target.value)} />
                                <Button type="submit" className="w-full bg-black py-3">Submit Application</Button>
                            </form>
                            <p className="text-[10px] text-slate-400 mt-4 text-center">
                                Loans are subject to credit score analysis by our AI risk engine.
                            </p>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

const Community = () => {
    const { currentUser, partnerships, postPartnership, forumPosts, postForum, likeForumPost } = useApp();
    const [view, setView] = useState<'FORUM' | 'COLLAB'>('FORUM');
    const [postText, setPostText] = useState('');

    const handlePost = (e: React.FormEvent) => {
        e.preventDefault();
        if(!postText) return;
        postForum(postText);
        setPostText('');
    }

    return (
        <div className="space-y-6">
            <div className="bg-black text-white p-6 rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                     <h2 className="text-2xl font-bold">KashSight Network</h2>
                     <p className="text-slate-400">Connect, Collaborate, and Scale.</p>
                     <div className="flex gap-4 mt-4">
                         <button onClick={() => setView('FORUM')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'FORUM' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                             Forums
                         </button>
                         <button onClick={() => setView('COLLAB')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'COLLAB' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                             Partner (B2B)
                         </button>
                     </div>
                </div>
            </div>

            {view === 'FORUM' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <form onSubmit={handlePost} className="flex gap-2">
                                <Input placeholder="Ask a question or share a tip..." value={postText} onChange={e => setPostText(e.target.value)} className="border-none bg-slate-50" />
                                <Button type="submit" className="bg-black text-white px-6">Post</Button>
                            </form>
                        </Card>
                        {forumPosts.map(post => {
                            const isLiked = post.likedBy?.includes(currentUser?.id || '');
                            return (
                                <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-black">U</div>
                                        <span className="text-xs font-bold text-slate-600">User {post.authorId.substring(0,4)}</span>
                                        <span className="text-[10px] text-slate-400 ml-auto">{new Date(post.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-800 text-sm mb-3">{post.content}</p>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <button 
                                            onClick={() => likeForumPost(post.id)}
                                            className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-black'}`}
                                        >
                                            <HeartIcon className="w-4 h-4" /> {post.likes}
                                        </button>
                                        <button className="flex items-center gap-1 hover:text-black"><ChatBubbleLeftRightIcon className="w-4 h-4" /> {post.comments}</button>
                                    </div>
                                </div>
                            )
                        })}
                     </div>
                     <div className="space-y-4">
                         <div className="bg-white p-4 rounded-xl border border-slate-200">
                             <h3 className="font-bold text-slate-800 mb-2">Hot Topics</h3>
                             <ul className="text-sm space-y-2 text-green-600 font-medium cursor-pointer">
                                 <li className="hover:underline hover:text-black">#SokoPriceUpdates</li>
                                 <li className="hover:underline hover:text-black">#KanjoPermits</li>
                                 <li className="hover:underline hover:text-black">#CheapMaterials</li>
                             </ul>
                         </div>
                     </div>
                </div>
            )}

            {view === 'COLLAB' && (
                <div>
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-slate-800">Partnership Opportunities</h3>
                         <Button onClick={() => alert("Post Request")} className="text-xs bg-black text-white px-4 py-2">Post Request</Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {partnerships.map(p => (
                             <Card key={p.id} className="border-l-4 border-l-black">
                                 <div className="flex justify-between mb-2">
                                     <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{p.type.replace('_', ' ')}</span>
                                     <span className="text-[10px] text-slate-400">Open</span>
                                 </div>
                                 <h4 className="font-bold text-slate-800 mb-1">{p.title}</h4>
                                 <p className="text-sm text-slate-600 mb-4">{p.description}</p>
                                 <Button variant="outline" className="w-full text-xs hover:border-black py-2">Connect</Button>
                             </Card>
                         ))}
                     </div>
                </div>
            )}
        </div>
    )
}

const AI_Coach = () => {
    const { messages, currentUser, chatWithAI, addPoints } = useApp();
     const [input, setInput] = useState('');
     const [thinking, setThinking] = useState(false);
 
     // Messages for AI context
     const thread = messages.filter(m => 
         (m.senderId === currentUser?.id && m.receiverId === 'AI') || 
         (m.senderId === 'AI' && m.receiverId === currentUser?.id)
     ).sort((a,b) => a.timestamp - b.timestamp);
 
     const handleSend = async (e: React.FormEvent) => {
         e.preventDefault();
         if(!input.trim()) return;
         
         const userText = input;
         setInput('');
         setThinking(true);
         
         await chatWithAI(userText);
         
         setThinking(false);
         addPoints(5); // Gamification
     }
 
     return (
         <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
             <div className="bg-black text-white p-4 flex items-center gap-3">
                 <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">M</div>
                 <div>
                     <h3 className="font-bold">Mwalimu AI</h3>
                     <p className="text-xs text-slate-300">Your KashSight Business Coach</p>
                 </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                 {thread.length === 0 && (
                     <div className="text-center text-slate-400 mt-10 p-8">
                         <SparklesIcon className="w-12 h-12 mx-auto mb-2 text-black" />
                         <p className="font-medium text-slate-600">Ask me anything!</p>
                         <p className="text-sm">"How do I price my sofa sets?"</p>
                         <p className="text-sm">"Where to buy cheap metal in Nairobi?"</p>
                     </div>
                 )}
                 {thread.map(m => (
                     <div key={m.id} className={`flex ${m.senderId === 'AI' ? 'justify-start' : 'justify-end'}`}>
                         <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.senderId === 'AI' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-black text-white rounded-tr-none'}`}>
                             {m.text}
                         </div>
                     </div>
                 ))}
                 {thinking && (
                     <div className="flex justify-start">
                         <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-xs text-slate-500 italic flex items-center gap-1">
                             <SparklesIcon className="w-3 h-3 animate-spin" /> Mwalimu is thinking...
                         </div>
                     </div>
                 )}
             </div>
 
             <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                 <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your business..." />
                 <Button type="submit" disabled={!input || thinking} className="bg-black hover:bg-slate-800 text-white border-none px-6">
                     Ask
                 </Button>
             </form>
         </div>
     )
}

// --- Main Layout & Provider ---

const AppContent = () => {
    const location = useLocation();
    const { currentUser, logout, systemStatus } = useApp();
    const [showAuthModal, setShowAuthModal] = useState(false);
    
    // If NOT logged in, show Landing Page (unless already in auth flow, handled by modal)
    if (!currentUser) {
        return (
            <>
                <LandingPage onAuthRequest={() => setShowAuthModal(true)} />
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            </>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
            {/* Sidebar Navigation */}
            <nav className="hidden md:flex flex-col w-64 bg-black text-slate-300 h-screen sticky top-0 p-4">
                <div className="flex items-center gap-2 mb-8 px-2 text-white">
                    <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
                    <h1 className="text-xl font-black tracking-tight uppercase">KashSight</h1>
                </div>
                
                <div className="space-y-1">
                    <Link to="/" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-white text-black font-bold' : 'hover:bg-white/10 hover:text-white'}`}>
                        <HomeIcon className="w-5 h-5 mr-3" /> Dashboard
                    </Link>
                    <Link to="/profile" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/profile' ? 'bg-white text-black font-bold' : 'hover:bg-white/10 hover:text-white'}`}>
                        <UserCircleIcon className="w-5 h-5 mr-3" /> My Profile
                    </Link>
                    <Link to="/courses" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/courses' ? 'bg-white text-black font-bold' : 'hover:bg-white/10 hover:text-white'}`}>
                        <AcademicCapIcon className="w-5 h-5 mr-3" /> Courses
                    </Link>
                    <Link to="/financials" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/financials' ? 'bg-white text-black font-bold' : 'hover:bg-white/10 hover:text-white'}`}>
                        <WalletIcon className="w-5 h-5 mr-3" /> Saccos & Loans
                    </Link>
                    <Link to="/community" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/community' ? 'bg-white text-black font-bold' : 'hover:bg-white/10 hover:text-white'}`}>
                        <UserGroupIcon className="w-5 h-5 mr-3" /> Community
                    </Link>
                    <Link to="/ai-coach" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === '/ai-coach' ? 'bg-white text-black font-bold' : 'hover:bg-white/10 hover:text-white'}`}>
                        <SparklesIcon className="w-5 h-5 mr-3" /> Mwalimu AI
                    </Link>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800 px-2">
                    <div className="flex items-center gap-3 mb-4">
                         <InitialsAvatar name={currentUser.username} url={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-800" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-green-500 flex items-center font-bold uppercase">
                                {currentUser.points} Points
                            </p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center justify-center px-4 py-2 text-xs text-red-400 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors">
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" /> Logout
                    </button>
                </div>
            </nav>

            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 w-full bg-black border-t border-slate-800 z-50 flex justify-around p-3 text-slate-400">
                 <Link to="/" className={location.pathname === '/' ? 'text-white' : ''}><HomeIcon className="w-6 h-6" /></Link>
                 <Link to="/profile" className={location.pathname === '/profile' ? 'text-white' : ''}><UserCircleIcon className="w-6 h-6" /></Link>
                 <Link to="/courses" className={location.pathname === '/courses' ? 'text-white' : ''}><AcademicCapIcon className="w-6 h-6" /></Link>
                 <Link to="/financials" className={location.pathname === '/financials' ? 'text-white' : ''}><WalletIcon className="w-6 h-6" /></Link>
                 <Link to="/community" className={location.pathname === '/community' ? 'text-white' : ''}><UserGroupIcon className="w-6 h-6" /></Link>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0 max-w-7xl mx-auto w-full">
                {/* Maintenance Banner for Non-Admins */}
                {systemStatus.maintenance && currentUser.role !== 'ADMIN' ? (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                         <Cog6ToothIcon className="w-24 h-24 text-slate-300 animate-spin-slow mb-6" />
                         <h2 className="text-3xl font-black text-slate-900 mb-2">System Under Maintenance</h2>
                         <p className="text-slate-500 max-w-md">We are currently upgrading the KashSight servers to serve you better. Please check back shortly.</p>
                     </div>
                ) : (
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<UserProfile />} />
                        <Route path="/courses" element={<CourseMarketplace />} />
                        <Route path="/financials" element={<Financials />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/ai-coach" element={<AI_Coach />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                )}
            </main>
        </div>
    );
};

const App = () => {
  const [data, setData] = useState({ users: [], courses: [], saccos: [], loans: [], partnerships: [], forums: [], messages: [], system: { maintenance: false } });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Helper: Migrate/Ensure User Schema
  const ensureUserSchema = (user: User) => {
      if(!user || !user.id) return;

      const updates: Partial<User> = {};
      let changed = false;
      
      // Strict parameter checking to ensure DB matches expectations
      if (typeof user.points !== 'number') { updates.points = 10; changed = true; }
      if (typeof user.balance !== 'number') { updates.balance = 0; changed = true; }
      if (typeof user.isClubMember !== 'boolean') { updates.isClubMember = false; changed = true; }
      if (!Array.isArray(user.skills)) { updates.skills = []; changed = true; }
      if (!user.role) { updates.role = 'LEARNER'; changed = true; }
      if (!user.username) { updates.username = user.name?.split(' ')[0].toLowerCase() || 'user'; changed = true; }
      if (!user.joinedAt) { updates.joinedAt = Date.now(); changed = true; }
      if (!user.whatsappNumber) { updates.whatsappNumber = ''; changed = true; }

      if (changed) {
          console.log(`Migrating user schema for ${user.id}`, updates);
          DBService.update(`users/${user.id}`, updates);
      }
  };

  // Initialize and check for existing session
  useEffect(() => {
     const unsubscribe = subscribeToData((val) => {
         setData(val);
         setLoading(false);
         
         // Restore session if user exists in new data
         const persistedId = AuthService.getPersistedUserId();
         if (persistedId) {
             const user = val.users.find((u: User) => u.id === persistedId);
             if (user) {
                 ensureUserSchema(user);
                 setCurrentUser(user);
             } else {
                 // User ID exists in local storage but not in DB (cleared DB?), logout.
                 AuthService.logout();
                 setCurrentUser(null);
             }
         }
     });
     return () => unsubscribe();
  }, []);

  if (loading) {
      return <LoadingScreen />;
  }

  // Auth Methods
  const login = (email: string, pass: string): boolean => {
      const user = AuthService.login(data.users, email, pass);
      if (user) {
          ensureUserSchema(user);
          setCurrentUser(user);
          return true;
      }
      return false;
  };

  const register = async (username: string, name: string, email: string, pass: string, mpesa: string, whatsapp: string, role: 'LEARNER' | 'COACH' | 'ADMIN') => {
      // Logic uses whatsapp for both payment and contact for now as per instructions
      const newUser = await AuthService.register(username, name, email, pass, whatsapp, whatsapp, role);
      setCurrentUser(newUser);
  };

  const logout = () => {
      AuthService.logout();
      setCurrentUser(null);
  };

  // --- Wrapper for DB Updates (Optimistic UI or Direct Writes) ---
  
  const addPoints = async (pts: number) => {
      if(!currentUser) return;
      const newPoints = currentUser.points + pts;
      await DBService.update(`users/${currentUser.id}`, { points: newPoints });
  };

  const updateProfile = async (profileData: Partial<User>) => {
      if(!currentUser) return;
      await DBService.update(`users/${currentUser.id}`, profileData);
  };

  const toggleMaintenance = async () => {
      const newState = !data.system?.maintenance;
      await DBService.update('system', { maintenance: newState });
  }

  const joinClub = async () => {
      if(!currentUser) return;
      if(currentUser.balance < 1000) {
          alert("Insufficient balance. Please deposit funds to wallet first.");
          return;
      }
      await DBService.update(`users/${currentUser.id}`, { 
          balance: currentUser.balance - 1000, 
          isClubMember: true,
          points: currentUser.points + 100 
      });
      alert("Welcome to the Club!");
  };

  const buyCourse = async (courseId: string) => {
      if(!currentUser) return;
      const course = data.courses.find((c: Course) => c.id === courseId);
      if(course) {
          await DBService.update(`courses/${course.id}`, { enrolledCount: course.enrolledCount + 1 });
          addPoints(50);
          alert(`Enrolled in course!`);
      }
  };

  const createSacco = async (name: string, desc: string, contribution: number) => {
      if(!currentUser) return;
      await DBService.push('saccos', {
          name, description: desc,
          members: [currentUser.id],
          totalSavings: 0,
          monthlyContribution: contribution,
          chairmanId: currentUser.id
      });
      addPoints(20);
  };

  const requestLoan = async (amount: number, purpose: string) => {
      if(!currentUser) return;
      await DBService.push('loans', {
          borrowerId: currentUser.id,
          amount, purpose,
          status: 'PENDING',
          interestRate: 10,
          dueDate: Date.now() + 86400000 * 30
      });
  };

  const postPartnership = async (title: string, desc: string, type: 'ACADEMY_FORMATION' | 'B2B_COLLAB') => {
      if(!currentUser) return;
      await DBService.push('partnerships', {
          initiatorId: currentUser.id,
          title, description: desc, type,
          status: 'OPEN'
      });
      addPoints(30);
  };

  const postForum = async (text: string) => {
      if(!currentUser) return;
      await DBService.push('forums', {
          authorId: currentUser.id,
          content: text,
          likes: 0, likedBy: [], comments: 0,
          timestamp: Date.now()
      });
      addPoints(10);
  };

  const likeForumPost = async (postId: string) => {
      if(!currentUser) return;
      const post = data.forumPosts.find((p: ForumPost) => p.id === postId);
      if(post && !post.likedBy?.includes(currentUser.id)) {
          const newLikedBy = [...(post.likedBy || []), currentUser.id];
          await DBService.update(`forums/${postId}`, { 
              likes: post.likes + 1,
              likedBy: newLikedBy
          });
          addPoints(2);
      }
  };

  const chatWithAI = async (msg: string): Promise<string> => {
      if(!currentUser) return "Error";
      
      const history = data.messages
        .filter((m: Message) => (m.receiverId === 'AI' && m.senderId === currentUser.id) || (m.senderId === 'AI' && m.receiverId === currentUser.id))
        .map((m: Message) => `${m.senderId === 'AI' ? 'Mwalimu' : 'Student'}: ${m.text}`)
        .join('\n');
      
      const userMsg = { senderId: currentUser.id, receiverId: 'AI', text: msg, timestamp: Date.now() };
      await DBService.push('messages', userMsg);
      
      const response = await getBusinessAdvice(history, msg);
      
      const aiMsg = { senderId: 'AI', receiverId: currentUser.id, text: response, timestamp: Date.now() };
      await DBService.push('messages', aiMsg);

      return response;
  }

  return (
    <AppContext.Provider value={{
      currentUser, users: data.users, courses: data.courses, saccos: data.saccos,
      loans: data.loans, partnerships: data.partnerships, forumPosts: data.forums, messages: data.messages,
      systemStatus: data.system || { maintenance: false },
      joinClub, buyCourse, createSacco, requestLoan, postPartnership, postForum, likeForumPost, chatWithAI,
      login, register, logout, addPoints, updateProfile, toggleMaintenance
    }}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;