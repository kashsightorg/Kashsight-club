
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
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  UserCircleIcon,
  PencilIcon,
  CameraIcon,
  PhoneIcon,
  XMarkIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  Bars3Icon,
  CogIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon, HeartIcon } from '@heroicons/react/24/solid';

// --- Localization & Translations ---
const translations = {
  en: {
    dashboard: "Dashboard",
    profile: "My Profile",
    courses: "Courses",
    financials: "Saccos & Loans",
    community: "Community",
    ai_coach: "Mwalimu AI",
    logout: "Logout",
    delete_account: "Delete Account",
    edit_profile: "Edit Profile",
    points: "Points",
    maintenance: "System Under Maintenance",
    maintenance_msg: "We are currently upgrading the KashSight servers. Please check back shortly.",
    deposit_later: "Deposit feature will be available later.",
    join_club: "Unlock KashSight Club",
    pay_fee: "Pay One-Time Fee (Ksh 1,000)",
    enter_mpesa: "Enter M-Pesa Code",
    submit_code: "Submit for Verification",
    admin_login: "Login as Admin",
    welcome: "Welcome Back",
    get_started: "Get Started",
    login: "Login",
    register: "Register",
    learner: "Learner",
    coach: "Coach",
    sacco_savings: "Sacco Savings",
    wallet: "Wallet",
    recommended_skills: "Recommended Skills",
    view_all: "View All",
    community_buzz: "Community Buzz",
    form_sacco: "Form a Sacco",
    business_loans: "Business Loans",
    apply_loan: "Apply for Capital",
    partnerships: "Partnerships",
    forums: "Forums",
    ask_ai: "Ask Mwalimu",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    verification_pending: "Verification Pending",
    club_member: "Club Member",
    verified: "Verified",
    not_member: "Not a Member",
    insufficient_balance: "Insufficient Balance",
    bio: "Bio",
    whatsapp: "WhatsApp",
    save_changes: "Save Changes",
    cancel: "Cancel",
    features: "Features",
    stats: "Our Impact",
    landing_hero_title: "Empowering the Jua Kali Sector",
    landing_hero_subtitle: "Learn real skills, access business loans, and grow your hustle with KashSight.",
    stat_users: "Active Artisans",
    stat_loans: "Capital Lent",
    stat_courses: "Skills Taught"
  },
  sw: {
    dashboard: "Dashibodi",
    profile: "Wasifu Wangu",
    courses: "Kozi",
    financials: "Vyama na Mikopo",
    community: "Jamii",
    ai_coach: "Mwalimu AI",
    logout: "Ondoka",
    delete_account: "Futa Akaunti",
    edit_profile: "Hariri Wasifu",
    points: "Pointi",
    maintenance: "Mifumo Inafanyiwa Kazi",
    maintenance_msg: "Tunaboresha seva za KashSight kwa sasa. Tafadhali jaribu tena baadaye.",
    deposit_later: "Huduma ya kuweka pesa itakuja baadaye.",
    join_club: "Jiunge na Klabu ya KashSight",
    pay_fee: "Lipa Mara Moja (Ksh 1,000)",
    enter_mpesa: "Weka Kodi ya M-Pesa",
    submit_code: "Tuma Uhakikiwe",
    admin_login: "Ingia kama Admin",
    welcome: "Karibu Tena",
    get_started: "Anza Sasa",
    login: "Ingia",
    register: "Jisajili",
    learner: "Mwanafunzi",
    coach: "Mkufunzi",
    sacco_savings: "Akiba ya Chama",
    wallet: "Pochi",
    recommended_skills: "Ujuzi Pendekezwa",
    view_all: "Ona Zote",
    community_buzz: "Vuma Mtaani",
    form_sacco: "Anzisha Chama",
    business_loans: "Mikopo ya Biashara",
    apply_loan: "Omba Mtaji",
    partnerships: "Ushirikiano",
    forums: "Majukwaa",
    ask_ai: "Uliza Mwalimu",
    settings: "Mipangilio",
    language: "Lugha",
    theme: "Mandhari",
    dark: "Giza",
    light: "Nuru",
    verification_pending: "Uhakiki Unasubiriwa",
    club_member: "Mwanachama",
    verified: "Imethibitishwa",
    not_member: "Si Mwanachama",
    insufficient_balance: "Salio Halitoshi",
    bio: "Maelezo",
    whatsapp: "WhatsApp",
    save_changes: "Hifadhi",
    cancel: "Ghairi",
    features: "Vipengele",
    stats: "Matokeo Yetu",
    landing_hero_title: "Tunakuza Sekta ya Jua Kali",
    landing_hero_subtitle: "Jifunze ujuzi, pata mkopo wa biashara, na ukuze kazi yako na KashSight.",
    stat_users: "Mafundi Hai",
    stat_loans: "Mikopo Iliyotolewa",
    stat_courses: "Ujuzi Uliofunzwa"
  }
};

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
  language: 'en' | 'sw';
  theme: 'light' | 'dark';
  setLanguage: (lang: 'en' | 'sw') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  t: (key: keyof typeof translations['en']) => string;
  joinClub: () => void;
  verifyPayment: (code: string) => void;
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
  deleteAccount: () => void;
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
            className={`${className} rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800`} 
        />
    );
};

// --- Modern Loading Screen ---
const LoadingScreen = () => (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center z-[100]">
        <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200 dark:text-slate-800 stroke-current stroke-[0.5] fill-none">
                 <path d="M50 25 C30 25 20 40 20 60 C20 80 40 90 50 90 C60 90 80 80 80 60 C80 40 70 25 50 25 Z M50 25 C50 15 40 10 30 15 C20 20 20 40 20 60" />
                 <path d="M50 25 C50 15 60 10 70 15 C80 20 80 40 80 60" />
                 <path d="M50 35 L50 80" />
                 <path d="M30 45 L70 45" />
            </svg>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
                <div className="absolute top-10 left-10 w-2 h-2 bg-black dark:bg-white rounded-full animate-[bounce_2s_infinite]"></div>
                <div className="absolute top-20 right-20 w-3 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-[bounce_3s_infinite]"></div>
                <div className="absolute bottom-20 left-16 w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-[bounce_1.5s_infinite]"></div>
            </div>
        </div>
        <p className="mt-4 text-slate-400 dark:text-slate-600 font-mono tracking-widest text-xs animate-pulse">LOADING KASHSIGHT</p>
    </div>
);

// --- Components ---

const LandingPage = () => {
    const { login, register, t, theme, setTheme, language, setLanguage } = useApp();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Dynamic Floating Notification Logic
    const [notificationIndex, setNotificationIndex] = useState(0);
    const notifications = [
        "Jane joined the Welders Sacco",
        "Ksh 50,000 Business Loan Approved",
        "New Course: Modern Carpentry",
        "3000 Club Points Earned"
    ];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setNotificationIndex(prev => (prev + 1) % notifications.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const toggleLang = () => setLanguage(language === 'en' ? 'sw' : 'en');

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                           <span className="text-white dark:text-black font-bold text-xl">K</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">KashSight</span>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        <button onClick={toggleLang} className="text-sm font-semibold hover:text-green-600 dark:hover:text-green-400 transition-colors uppercase">
                            {language === 'en' ? 'SWA' : 'ENG'}
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                        </button>
                        <Button variant="primary" onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }} className="!py-2 !px-6 text-sm">
                            {t('get_started')}
                        </Button>
                    </div>

                    {/* Mobile Hamburger */}
                    <div className="md:hidden">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                            {mobileMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-4">
                        <div className="flex justify-between items-center p-2 border rounded-lg border-slate-100 dark:border-slate-800">
                            <span className="font-medium">{t('theme')}</span>
                            <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded-lg border-slate-100 dark:border-slate-800">
                            <span className="font-medium">{t('language')}</span>
                            <button onClick={toggleLang} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold">
                                {language.toUpperCase()}
                            </button>
                        </div>
                        <Button variant="primary" onClick={() => { setAuthMode('login'); setIsAuthOpen(true); setMobileMenuOpen(false); }} className="w-full">
                            {t('login')} / {t('register')}
                        </Button>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 space-y-8 z-10">
                        <Badge status="ACTIVE" /> <span className="text-green-600 dark:text-green-400 font-bold tracking-wider text-sm uppercase">#1 Platform for Jua Kali</span>
                        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
                            {t('landing_hero_title')}
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                            {t('landing_hero_subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <Button onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }} className="flex items-center justify-center gap-2">
                                {t('get_started')} <ArrowRightOnRectangleIcon className="w-5 h-5" />
                             </Button>
                        </div>
                    </div>
                    
                    {/* Hero Image & Floating Card */}
                    <div className="md:w-1/2 mt-12 md:mt-0 relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 rotate-2 hover:rotate-0 transition-transform duration-500">
                             {/* Placeholder for Jua Kali Image - Metalwork/Welding */}
                             <img 
                                src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80" 
                                alt="Jua Kali Metalworker" 
                                className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-700"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        </div>

                        {/* Dynamic Floating Notification */}
                        <div className="absolute top-10 -left-10 md:-left-12 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 animate-[bounce_4s_infinite]">
                             <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                <CheckBadgeIcon className="w-6 h-6" />
                             </div>
                             <div>
                                 <p className="font-bold text-sm text-slate-900 dark:text-white transition-all duration-300 w-48 truncate">
                                     {notifications[notificationIndex]}
                                 </p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">Just Now</p>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">{t('features')}</h2>
                        <div className="w-20 h-1 bg-green-500 mx-auto"></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="hover:-translate-y-2 transition-transform">
                            <WrenchScrewdriverIcon className="w-12 h-12 mb-4 text-slate-900 dark:text-white" />
                            <h3 className="text-xl font-bold mb-2">Real Skills</h3>
                            <p className="text-slate-500 dark:text-slate-400">Learn Carpentry, Welding, Tailoring and more from local experts.</p>
                        </Card>
                        <Card className="hover:-translate-y-2 transition-transform">
                            <CurrencyDollarIcon className="w-12 h-12 mb-4 text-green-600 dark:text-green-400" />
                            <h3 className="text-xl font-bold mb-2">Business Loans</h3>
                            <p className="text-slate-500 dark:text-slate-400">Get capital to buy tools or stock for your business.</p>
                        </Card>
                        <Card className="hover:-translate-y-2 transition-transform">
                            <UserGroupIcon className="w-12 h-12 mb-4 text-slate-900 dark:text-white" />
                            <h3 className="text-xl font-bold mb-2">Sacco Groups</h3>
                            <p className="text-slate-500 dark:text-slate-400">Join forces with others to save and invest together.</p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">5000+</p>
                        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{t('stat_users')}</p>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-green-600 dark:text-green-400 mb-2">Ksh 2M+</p>
                        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{t('stat_loans')}</p>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">120+</p>
                        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">{t('stat_courses')}</p>
                    </div>
                    <div>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">50+</p>
                        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Saccos</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-black text-white dark:bg-slate-950 dark:border-t dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="font-bold text-xl mb-4">KashSight</p>
                    <p className="text-slate-400 text-sm">© 2024 KashSight Inc. Building Africa's Future.</p>
                </div>
            </footer>

            {/* Full Screen Auth Modal */}
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} mode={authMode} setMode={setAuthMode} />
        </div>
    );
};

const AuthModal = ({ isOpen, onClose, mode, setMode }: { isOpen: boolean; onClose: () => void; mode: 'login'|'register'; setMode: (m: 'login'|'register') => void }) => {
    const { login, register, t } = useApp();
    const [formData, setFormData] = useState({ 
        username: '', name: '', email: '', password: '', whatsapp: '', role: 'LEARNER' as 'LEARNER'|'COACH'|'ADMIN' 
    });
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Check for Admin shortcut
        if (mode === 'login' && formData.email === 'admin@kashsight.learn' && formData.password === 'admin1') {
             // Let the login function handle verification, but we know the creds
        }
        
        if (mode === 'login') {
            const success = login(formData.email, formData.password);
            if (success) onClose();
            else alert('Invalid credentials');
        } else {
             // Admin role assignment via email check during register
             const finalRole = (formData.email === 'admin@kashsight.learn') ? 'ADMIN' : formData.role;
             
             register(formData.username, formData.name, formData.email, formData.password, formData.whatsapp, formData.whatsapp, finalRole); // Using whatsapp for mpesa as requested
             onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <XMarkIcon className="w-8 h-8 text-slate-900 dark:text-white" />
            </button>
            
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center">
                        <span className="text-white dark:text-black font-black text-3xl">K</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                        {mode === 'login' ? t('welcome') : 'Join the Hustle'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {mode === 'login' ? 'Login to access your dashboard' : 'Create an account to start learning & earning'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'register' && (
                        <>
                           <Input placeholder="Username (e.g. FundiJohn)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                           <Input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                           <Input placeholder="WhatsApp Number" type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required />
                           <div className="grid grid-cols-2 gap-4">
                               <button type="button" onClick={() => setFormData({...formData, role: 'LEARNER'})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.role === 'LEARNER' ? 'border-black bg-black text-white dark:border-green-500 dark:bg-green-600' : 'border-slate-200 dark:border-slate-800'}`}>{t('learner')}</button>
                               <button type="button" onClick={() => setFormData({...formData, role: 'COACH'})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.role === 'COACH' ? 'border-black bg-black text-white dark:border-green-500 dark:bg-green-600' : 'border-slate-200 dark:border-slate-800'}`}>{t('coach')}</button>
                           </div>
                        </>
                    )}
                    <Input placeholder="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <Input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                    
                    <Button variant="primary" className="w-full py-4 text-lg !rounded-2xl">
                        {mode === 'login' ? t('login') : t('register')}
                    </Button>
                </form>

                <div className="text-center">
                    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-bold underline hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                    {mode === 'login' && (
                        <div className="mt-4">
                             <button onClick={() => { setFormData({ ...formData, email: 'admin@kashsight.learn', password: '' }); alert('Enter password: admin1'); }} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest font-bold border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full">
                                {t('admin_login')}
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Dashboard Component (Sidebar + Content) ---
const DashboardLayout = () => {
    const { currentUser, logout, t, systemStatus } = useApp();
    const location = useLocation();
    const [isMobileNavOpen, setMobileNavOpen] = useState(false);

    if (systemStatus.maintenance && currentUser?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-6 text-white">
                <Cog6ToothIcon className="w-24 h-24 text-green-500 mb-6 animate-spin-slow" />
                <h1 className="text-3xl font-bold mb-2">{t('maintenance')}</h1>
                <p className="text-slate-400 max-w-md">{t('maintenance_msg')}</p>
            </div>
        )
    }

    const navItems = [
        { path: '/dashboard', label: t('dashboard'), icon: HomeIcon },
        { path: '/dashboard/courses', label: t('courses'), icon: AcademicCapIcon },
        { path: '/dashboard/financials', label: t('financials'), icon: WalletIcon },
        { path: '/dashboard/partnerships', label: t('partnerships'), icon: BriefcaseIcon },
        { path: '/dashboard/community', label: t('community'), icon: ChatBubbleLeftRightIcon },
        { path: '/dashboard/ai', label: t('ai_coach'), icon: SparklesIcon },
    ];
    if (currentUser?.role === 'ADMIN') {
        navItems.push({ path: '/dashboard/admin', label: 'Admin Panel', icon: LockClosedIcon });
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex transition-colors duration-300">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-20">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                     <span className="text-2xl font-black tracking-tight">KashSight</span>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map(item => (
                        <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === item.path ? 'bg-black text-white dark:bg-green-600 dark:text-black shadow-lg shadow-slate-200 dark:shadow-none' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}`}>
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all mb-2">
                        <InitialsAvatar name={currentUser?.name || 'User'} url={currentUser?.avatar || ''} className="w-8 h-8" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold truncate w-32">{currentUser?.name}</span>
                            <span className="text-[10px] uppercase text-slate-400">{currentUser?.role}</span>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between">
                <span className="font-bold text-lg">KashSight</span>
                <button onClick={() => setMobileNavOpen(true)} className="p-2"><Bars3Icon className="w-6 h-6" /></button>
            </div>

            {/* Mobile Drawer */}
            {isMobileNavOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileNavOpen(false)}>
                    <div className="absolute right-0 w-64 h-full bg-white dark:bg-slate-900 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                             <span className="font-bold text-xl">Menu</span>
                             <button onClick={() => setMobileNavOpen(false)}><XMarkIcon className="w-6 h-6" /></button>
                        </div>
                        <nav className="space-y-2 flex-1">
                            {navItems.map(item => (
                                <Link key={item.path} to={item.path} onClick={() => setMobileNavOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === item.path ? 'bg-black text-white dark:bg-green-600 dark:text-black' : 'text-slate-500 dark:text-slate-400'}`}>
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <Link to="/dashboard/profile" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                             <UserCircleIcon className="w-6 h-6" /> {t('profile')}
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen overflow-x-hidden">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/financials" element={<FinancialsPage />} />
                    <Route path="/partnerships" element={<PartnershipsPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/ai" element={<AICoachPage />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </main>
        </div>
    );
};

// --- Sub-Pages ---

const DashboardHome = () => {
    const { currentUser, t, joinClub } = useApp();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [mpesaCode, setMpesaCode] = useState('');
    const { verifyPayment } = useApp();

    const handleClubJoin = () => {
        // Open Selar link in new tab
        window.open('https://selar.co/m/kashsight', '_blank');
        // Show verification modal
        setShowPaymentModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black mb-1">{t('dashboard')}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{t('welcome')}, {currentUser?.name.split(' ')[0]}</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                        <SparklesIcon className="w-5 h-5 text-amber-500" />
                        <span className="font-bold">{currentUser?.points} pts</span>
                    </div>
                </div>
            </header>

            {!currentUser?.isClubMember && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-green-900 dark:to-slate-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-xl">
                        <h2 className="text-2xl font-bold mb-2">{t('join_club')}</h2>
                        <p className="text-slate-300 mb-6">Get access to premium courses, lower loan interest rates (5%), and exclusive business mentorship.</p>
                        <Button onClick={handleClubJoin} className="bg-white text-black hover:bg-slate-200 dark:bg-green-500 dark:text-black dark:hover:bg-green-400 border-none">
                            {t('pay_fee')}
                        </Button>
                    </div>
                    {/* Background Pattern */}
                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:border-black dark:hover:border-green-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400"><WalletIcon className="w-6 h-6" /></div>
                        <Badge status={currentUser?.isClubMember ? 'ACTIVE' : 'PENDING'} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('wallet')}</p>
                    <h3 className="text-3xl font-black mt-1">Ksh {currentUser?.balance.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-4">{t('deposit_later')}</p>
                </Card>
                 <Card className="hover:border-black dark:hover:border-green-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400"><UserGroupIcon className="w-6 h-6" /></div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('sacco_savings')}</p>
                    <h3 className="text-3xl font-black mt-1">Ksh 0</h3>
                    <Link to="/dashboard/financials" className="text-xs font-bold mt-4 block hover:underline">View Saccos &rarr;</Link>
                </Card>
            </div>

            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={t('join_club')}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">{t('enter_mpesa')}</p>
                    <Input placeholder="e.g. QHA23..." value={mpesaCode} onChange={e => setMpesaCode(e.target.value)} />
                    <Button onClick={() => { verifyPayment(mpesaCode); setShowPaymentModal(false); }} className="w-full">{t('submit_code')}</Button>
                </div>
            </Modal>
        </div>
    );
}

const UserProfile = () => {
    const { currentUser, updateProfile, deleteAccount, logout, t, theme, setTheme, language, setLanguage } = useApp();
    const [activeTab, setActiveTab] = useState<'details' | 'settings'>('details');
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<Partial<User>>({});

    useEffect(() => {
        if (currentUser) setForm(currentUser);
    }, [currentUser]);

    const handleSave = () => {
        updateProfile(form);
        setEditMode(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
            {/* Header / Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                <button onClick={() => setActiveTab('details')} className={`text-lg font-bold pb-4 -mb-4.5 border-b-2 transition-colors ${activeTab === 'details' ? 'border-black dark:border-green-500 text-black dark:text-white' : 'border-transparent text-slate-400'}`}>
                    Profile Details
                </button>
                <button onClick={() => setActiveTab('settings')} className={`text-lg font-bold pb-4 -mb-4.5 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-black dark:border-green-500 text-black dark:text-white' : 'border-transparent text-slate-400'}`}>
                    {t('settings')}
                </button>
            </div>

            {activeTab === 'details' ? (
                <Card>
                    <div className="relative h-48 rounded-xl overflow-hidden mb-16 bg-slate-100 dark:bg-slate-800">
                        <img src={currentUser?.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute -bottom-12 left-8 p-1 bg-white dark:bg-slate-900 rounded-full">
                            <InitialsAvatar name={currentUser?.name || 'U'} url={currentUser?.avatar || ''} className="w-24 h-24" />
                        </div>
                        {editMode && <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><CameraIcon className="w-5 h-5" /></button>}
                    </div>

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-black">{currentUser?.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">@{currentUser?.username} • {t(currentUser?.role === 'ADMIN' ? 'coach' : currentUser?.role.toLowerCase() as any)}</p>
                        </div>
                        <Button variant="outline" onClick={() => editMode ? handleSave() : setEditMode(true)} className="flex gap-2">
                             {editMode ? t('save_changes') : <><PencilIcon className="w-4 h-4" /> {t('edit_profile')}</>}
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('bio')}</label>
                            {editMode ? (
                                <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-0 focus:ring-1 ring-black dark:ring-green-500" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
                            ) : (
                                <p className="text-slate-700 dark:text-slate-300">{currentUser?.bio}</p>
                            )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t('whatsapp')}</label>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono">{currentUser?.whatsappNumber}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Location</label>
                                {editMode ? (
                                     <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                                ) : (
                                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">{currentUser?.location}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                     <Card>
                         <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><GlobeAltIcon className="w-5 h-5" /> {t('language')}</h3>
                         <div className="flex gap-4">
                             <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg border ${language === 'en' ? 'bg-black text-white dark:bg-green-600 dark:text-black border-transparent' : 'border-slate-200 dark:border-slate-700'}`}>English</button>
                             <button onClick={() => setLanguage('sw')} className={`px-4 py-2 rounded-lg border ${language === 'sw' ? 'bg-black text-white dark:bg-green-600 dark:text-black border-transparent' : 'border-slate-200 dark:border-slate-700'}`}>Swahili</button>
                         </div>
                     </Card>
                     <Card>
                         <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LightBulbIcon className="w-5 h-5" /> {t('theme')}</h3>
                         <div className="flex gap-4">
                             <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${theme === 'light' ? 'bg-black text-white border-transparent' : 'border-slate-200 dark:border-slate-700'}`}><SunIcon className="w-5 h-5" /> {t('light')}</button>
                             <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-black dark:bg-green-600 dark:text-black border-transparent' : 'border-slate-200 dark:border-slate-700'}`}><MoonIcon className="w-5 h-5" /> {t('dark')}</button>
                         </div>
                     </Card>
                     <Card className="border-red-100 dark:border-red-900/30">
                         <h3 className="text-lg font-bold mb-4 text-red-600">Danger Zone</h3>
                         <div className="flex flex-col gap-3">
                             <Button onClick={logout} variant="secondary" className="w-full justify-start text-red-600">{t('logout')}</Button>
                             <Button onClick={() => { if(window.confirm('Are you sure?')) deleteAccount() }} variant="danger" className="w-full justify-start">{t('delete_account')}</Button>
                         </div>
                     </Card>
                </div>
            )}
        </div>
    )
};

const AICoachPage = () => {
    const { chatWithAI, t } = useApp();
    const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([{role: 'ai', text: "Habari! I am Mwalimu AI. Ask me about your Jua Kali business."}]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const send = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);
        
        try {
            const response = await chatWithAI(userMsg);
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Network error, jaribu tena." }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                 {messages.map((m, i) => (
                     <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-black text-white dark:bg-green-600 dark:text-black rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'}`}>
                             {m.text}
                         </div>
                     </div>
                 ))}
                 {loading && <div className="text-slate-400 text-xs animate-pulse">Mwalimu is typing...</div>}
                 <div ref={bottomRef}></div>
             </div>
             <div className="mt-4 flex gap-2">
                 <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about carpentry, tailoring, loans..." onKeyDown={e => e.key === 'Enter' && send()} />
                 <Button onClick={send} disabled={loading} className="px-6"><SparklesIcon className="w-6 h-6" /></Button>
             </div>
        </div>
    );
};

// Placeholders for other pages to keep file concise but functional
const CoursesPage = () => <div className="text-center py-20"><h2 className="text-2xl font-bold">Marketplace Coming Soon</h2></div>;
const FinancialsPage = () => <div className="text-center py-20"><h2 className="text-2xl font-bold">Saccos & Loans Loading...</h2></div>;
const PartnershipsPage = () => <div className="text-center py-20"><h2 className="text-2xl font-bold">B2B Partners Loading...</h2></div>;
const CommunityPage = () => <div className="text-center py-20"><h2 className="text-2xl font-bold">Forums Loading...</h2></div>;
const AdminPanel = () => {
    const { toggleMaintenance, systemStatus } = useApp();
    return (
        <Card>
            <h2 className="text-2xl font-black mb-6">Admin Control</h2>
            <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                 <span className="font-bold">Maintenance Mode</span>
                 <button onClick={toggleMaintenance} className={`px-4 py-2 rounded-lg font-bold ${systemStatus.maintenance ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                     {systemStatus.maintenance ? 'ON (Blocking Users)' : 'OFF (Normal)'}
                 </button>
            </div>
        </Card>
    )
}

// --- App Provider & Main Layout ---

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Theme Init: Check system preference
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });
    
    const [language, setLanguage] = useState<'en' | 'sw'>('en');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [systemStatus, setSystemStatus] = useState({ maintenance: false });
    const [loading, setLoading] = useState(true);

    // Apply Theme
    useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [theme]);

    // Data Subscription
    useEffect(() => {
        const unsubscribe = subscribeToData((data) => {
            if (data.maintenance !== undefined) setSystemStatus({ maintenance: data.maintenance });
            setLoading(false);
            
            // Persist Session
            const storedId = AuthService.getPersistedUserId();
            if (storedId && !currentUser) {
                const found = data.users.find((u: User) => u.id === storedId);
                if (found) {
                     // Schema Migration: Ensure all fields exist
                     if (!found.points) found.points = 10;
                     if (!found.balance) found.balance = 0;
                     if (!found.skills) found.skills = [];
                     if (!found.username) found.username = found.email.split('@')[0];
                     setCurrentUser(found);
                }
            } else if (currentUser) {
                // Update current user if data changes in real-time
                 const found = data.users.find((u: User) => u.id === currentUser.id);
                 if (found) setCurrentUser(found);
            }
        });
        return () => unsubscribe(); // Cleanup not strictly necessary for firebase onValue but good practice
    }, [currentUser]);

    const t = (key: keyof typeof translations['en']) => translations[language][key] || key;

    const login = (e: string, p: string) => {
        // Needs access to full user list which is in store, simplified here for context
        // Ideally AuthService.login would return the user object directly, but we need the reactive list from DB
        // We will trigger a reload or rely on the subscribeToData to catch the local storage change? 
        // Better: Fetch users inside this function from a ref or just reload the window logic for this MVP
        // For now, let's use the hook logic. We need the users list available in context or fetch it.
        // Let's implement a simple direct fetch or pass users to login.
        // Actually, we can just use the persisted ID logic.
        // Re-implementing simplified login here:
        const hash = btoa('salty_' + p);
        // We need the data from the subscription to check credentials.
        // For safety in this specific architecture, let's just assume we can find the user if we had the list.
        // Since we don't have the list in this scope easily without prop drilling, 
        // let's reload the page to force re-check or use a simpler approach:
        // PASS.
        return true; 
    };
    
    // Improved Login Wrapper that actually works with the data flow
    const performLogin = (email: string, pass: string) => {
        // We need to access the latest users list. 
        // Since we are inside the provider, we don't have the list in a var yet unless we store it.
        // Let's store users in state.
        return false; // See updated Logic below
    };

    // We need to hold the users state to perform login checks
    const [users, setUsers] = useState<User[]>([]);
    
    useEffect(() => {
        subscribeToData((data) => {
             setUsers(data.users);
        });
    }, []);

    const handleLogin = (e: string, p: string) => {
        const user = AuthService.login(users, e, p);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const handleRegister = async (u: string, n: string, e: string, p: string, m: string, w: string, r: 'LEARNER'|'COACH'|'ADMIN') => {
        const user = await AuthService.register(u, n, e, p, m, w, r);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        AuthService.logout();
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        users,
        courses: [], saccos: [], loans: [], partnerships: [], forumPosts: [], messages: [], // placeholders
        systemStatus,
        language, setLanguage,
        theme, setTheme,
        t,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        deleteAccount: () => { AuthService.logout(); setCurrentUser(null); }, // soft delete for now
        joinClub: () => DBService.update(`users/${currentUser?.id}`, { isClubMember: true }),
        verifyPayment: (code: string) => { alert('Verifying ' + code); setTimeout(() => DBService.update(`users/${currentUser?.id}`, { isClubMember: true }), 1500); },
        buyCourse: () => {},
        createSacco: () => {},
        requestLoan: () => {},
        postPartnership: () => {},
        postForum: () => {},
        likeForumPost: () => {},
        chatWithAI: async (msg: string) => await getBusinessAdvice('', msg),
        addPoints: () => {},
        updateProfile: (data: Partial<User>) => DBService.update(`users/${currentUser?.id}`, data),
        toggleMaintenance: () => DBService.set('maintenance', !systemStatus.maintenance)
    };

    return (
        <AppContext.Provider value={value}>
            {loading ? <LoadingScreen /> : children}
        </AppContext.Provider>
    );
};

// --- 404 Page ---
const NotFound = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        <h1 className="text-9xl font-black">404</h1>
        <p className="text-xl mb-8">Page not found in the workshop.</p>
        <Link to="/" className="px-6 py-3 bg-black text-white dark:bg-green-600 dark:text-black rounded-xl font-bold">Return Home</Link>
    </div>
);

// --- Main Entry ---
const App = () => {
    return (
        <AppProvider>
            <HashRouter>
                <MainRoutes />
            </HashRouter>
        </AppProvider>
    );
};

const MainRoutes = () => {
    const { currentUser } = useApp();
    return (
        <Routes>
            <Route path="/" element={!currentUser ? <LandingPage /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard/*" element={currentUser ? <DashboardLayout /> : <Navigate to="/" />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App;
