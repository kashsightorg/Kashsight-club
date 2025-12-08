import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { User, Course, Resource, PaymentRequest, Channel, ChatMessage, Notification, CourseModule } from './types';
import { subscribeToData, DBService, AuthService } from './services/store';
import { getBusinessAdvice, generateResourceContent, generateCurriculum, generateLesson } from './services/geminiService';
import { Button, Input, Modal, Card, Badge } from './components/UI';
import { 
  HomeIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  WalletIcon, 
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  PencilIcon,
  CameraIcon,
  XMarkIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  Bars3Icon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  CheckIcon,
  XCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ClipboardDocumentListIcon,
  PaperAirplaneIcon,
  HashtagIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  PlayCircleIcon,
  ArrowPathIcon,
  VideoCameraIcon,
  TrashIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// --- Localization ---
const translations = {
  en: {
    dashboard: "Dashboard",
    courses: "Gigs & Courses",
    resources: "Downloads",
    community: "Community",
    ai_coach: "Mwalimu",
    logout: "Logout",
    points: "Points",
    maintenance: "System Under Maintenance",
    join_club: "Unlock Pro Club",
    pay_fee: "Subscribe ($1 USD/mo)",
    admin_login: "Login as Admin",
    welcome: "Welcome",
    get_started: "Get Started",
    login: "Login",
    register: "Register",
    learner: "Learner",
    coach: "Coach",
    wallet: "Wallet",
    features: "Features",
    landing_hero_title: "Pan-African Business Academy",
    landing_hero_subtitle: "Smart learning for real-world skills. No shortcuts, just business.",
    download: "Download",
    buy_for: "Buy for",
    free_for_pro: "Free for Pro",
    payment_pending: "Verification Pending",
    upgrade_pro: "Upgrade to Pro"
  },
  sw: {
    dashboard: "Dashibodi",
    courses: "Soko la Ujuzi",
    resources: "Vipakuliwa",
    community: "Jamii",
    ai_coach: "Mwalimu",
    logout: "Ondoka",
    points: "Pointi",
    maintenance: "Mifumo Inafanyiwa Kazi",
    join_club: "Jiunge na Pro Club",
    pay_fee: "Jiunge ($1 USD/mwezi)",
    admin_login: "Ingia kama Admin",
    welcome: "Karibu",
    get_started: "Anza Sasa",
    login: "Ingia",
    register: "Jisajili",
    learner: "Mwanafunzi",
    coach: "Mkufunzi",
    wallet: "Pochi",
    features: "Vipengele",
    landing_hero_title: "Chuo cha Biashara cha Afrika",
    landing_hero_subtitle: "Jifunze biashara halisi kwa msaada wa Mwalimu. Hakuna mkato, ni kazi tu.",
    download: "Pakua",
    buy_for: "Nunua kwa",
    free_for_pro: "Bure kwa Pro",
    payment_pending: "Malipo Yanasubiriwa",
    upgrade_pro: "Pandisha uwe Pro"
  }
};

const CURRENCY_RATES: { [key: string]: number } = {
    USD: 1,
    KES: 130,  // Kenyan Shilling
    NGN: 1600, // Nigerian Naira
    GHS: 15,   // Ghanaian Cedi
    ZAR: 19,   // South African Rand
    TZS: 2550, // Tanzanian Shilling
    UGX: 3800, // Ugandan Shilling
    RWF: 1280, // Rwandan Franc
    XAF: 600,  // Central African CFA
    XOF: 600,  // West African CFA
    EGP: 48,   // Egyptian Pound
    GBP: 0.79, // British Pound
    EUR: 0.92  // Euro
};

// --- Context & State ---

interface AppContextType {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  resources: Resource[];
  paymentRequests: PaymentRequest[];
  channels: Channel[];
  messages: ChatMessage[];
  systemStatus: { maintenance: boolean };
  language: 'en' | 'sw';
  setLanguage: (lang: 'en' | 'sw') => void;
  t: (key: keyof typeof translations['en']) => string;
  submitPaymentRequest: (type: 'CLUB_SUBSCRIPTION'|'COURSE_PURCHASE', method: 'SELAR'|'PAYPAL'|'MPESA', code: string, courseId?: string) => void;
  approvePayment: (req: PaymentRequest) => void;
  rejectPayment: (reqId: string) => void;
  downgradeUser: (userId: string) => void;
  chatWithAI: (msg: string) => Promise<string>;
  login: (e: string, p: string) => boolean;
  register: (u: string, n: string, e: string, p: string, ph: string, role: 'LEARNER'|'COACH'|'ADMIN') => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  recordDownload: () => Promise<void>;
  convertPoints: (pts: number) => string;
  notify: (msg: string, type?: 'SUCCESS'|'ERROR'|'INFO') => void;
  addPoints: (amount: number) => void;
  removeUserFromCourse: (userId: string, courseId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Initials Avatar ---
const InitialsAvatar = ({ name, url, className = "w-10 h-10" }: { name: string, url: string, className?: string }) => {
    return (
        <img 
            src={url || `https://ui-avatars.com/api/?name=${name ? name.substring(0,2) : 'User'}&background=random&color=000&bold=true`} 
            alt={name} 
            className={`${className} rounded-full object-cover border border-slate-200 bg-slate-100 grayscale`} 
        />
    );
};

// --- Loading Screen ---
const LoadingScreen = () => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
        <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200 stroke-current stroke-[0.5] fill-none">
                 <path d="M50 25 C30 25 20 40 20 60 C20 80 40 90 50 90 C60 90 80 80 80 60 C80 40 70 25 50 25 Z" />
            </svg>
            <div className="absolute top-20 right-20 w-3 h-3 bg-black rounded-full animate-[bounce_3s_infinite]"></div>
        </div>
        <p className="mt-4 text-black font-mono tracking-widest text-xs animate-pulse">LOADING KASHSIGHT</p>
    </div>
);

// --- Notification Toast ---
const NotificationsDisplay = ({ notifications, remove }: { notifications: Notification[], remove: (id: string) => void }) => {
    return (
        <div className="fixed bottom-4 left-0 w-full flex flex-col items-center pointer-events-none z-[9999] space-y-2">
            {notifications.map(n => (
                <div key={n.id} className={`pointer-events-auto max-w-sm w-full mx-4 shadow-2xl rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${n.type === 'ERROR' ? 'bg-black text-white border-2 border-red-500' : 'bg-black text-white'}`}>
                    {n.type === 'SUCCESS' && <CheckIcon className="w-6 h-6 text-green-400" />}
                    {n.type === 'ERROR' && <XCircleIcon className="w-6 h-6 text-red-400" />}
                    {n.type === 'INFO' && <SparklesIcon className="w-6 h-6 text-blue-400" />}
                    <p className="text-sm font-medium flex-1">{n.message}</p>
                    <button onClick={() => remove(n.id)} className="text-slate-400 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
                </div>
            ))}
        </div>
    )
}

// --- Page Components ---

const DashboardHome = () => {
    const { currentUser, t, courses, convertPoints } = useApp();
    const enrolled = courses.filter(c => currentUser?.purchasedCourseIds?.includes(c.id));
    
    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black">{t('welcome')}, {currentUser?.username}</h1>
                    <p className="text-slate-500">Let's build your business empire today.</p>
                </div>
                <div className="text-right hidden sm:block">
                     <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('wallet')}</p>
                     <p className="text-2xl font-black">{convertPoints(currentUser?.points || 0)}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-black text-white border-black">
                     <h3 className="font-bold text-lg mb-2">Pro Club Status</h3>
                     <p className="text-sm text-slate-400 mb-4">{currentUser?.isClubMember ? 'Active Member' : 'Free Tier'}</p>
                     {currentUser?.isClubMember ? <Badge status="ACTIVE" /> : <Button variant="secondary" className="!py-2 !px-4 text-xs">Upgrade</Button>}
                </Card>
                <Card>
                    <h3 className="font-bold text-lg mb-2">Active Gigs</h3>
                    <p className="text-3xl font-black">{enrolled.length}</p>
                </Card>
                <Card>
                    <h3 className="font-bold text-lg mb-2">Skills Earned</h3>
                    <div className="flex flex-wrap gap-1">
                        {currentUser?.skills.map(s => <span key={s} className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">{s}</span>)}
                        {currentUser?.skills.length === 0 && <span className="text-slate-400 text-xs">No skills yet.</span>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const CoursesPage = () => {
    const { courses, currentUser, submitPaymentRequest, notify } = useApp();
    const [filter, setFilter] = useState('All');
    
    const handleEnroll = (course: Course) => {
        if(course.price === 0) {
            submitPaymentRequest('COURSE_PURCHASE', 'FREE', 'FREE_CODE', course.id);
            notify("Enrolled in free course!", "SUCCESS");
        } else {
            const code = prompt("Enter M-Pesa/Payment Code:");
            if(code) {
                submitPaymentRequest('COURSE_PURCHASE', 'MPESA', code, course.id);
                notify("Payment verification sent.", "INFO");
            }
        }
    };

    const filtered = filter === 'All' ? courses : courses.filter(c => c.category === filter);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-black">Vocational Gigs</h1>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['All', 'Agriculture', 'Technology', 'Manufacturing', 'Services'].map(c => (
                        <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === c ? 'bg-black text-white' : 'bg-white border border-slate-200 hover:border-black'}`}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(course => {
                    const isOwned = currentUser?.purchasedCourseIds?.includes(course.id);
                    return (
                        <Card key={course.id} className="flex flex-col h-full p-0 overflow-hidden group">
                             <div className="h-40 bg-slate-200 relative overflow-hidden">
                                 <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                 {course.isPremium && <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded">PRO</div>}
                             </div>
                             <div className="p-6 flex-1 flex flex-col">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{course.category}</span>
                                     <div className="flex items-center gap-1">
                                         <StarIcon className="w-4 h-4 text-yellow-400" />
                                         <span className="text-xs font-bold">{course.rating.toFixed(1)}</span>
                                     </div>
                                 </div>
                                 <h3 className="font-bold text-lg leading-tight mb-2">{course.title}</h3>
                                 <p className="text-sm text-slate-500 mb-4 flex-1 line-clamp-3">{course.description}</p>
                                 
                                 <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                     <span className="font-black text-lg">{course.price === 0 ? 'FREE' : `$${course.price}`}</span>
                                     {isOwned ? (
                                         <Link to={`/dashboard/courses/${course.id}`}><Button variant="outline" className="!py-2 !px-4 text-xs">Resume</Button></Link>
                                     ) : (
                                         <Button onClick={() => handleEnroll(course)} className="!py-2 !px-4 text-xs">Enroll</Button>
                                     )}
                                 </div>
                             </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

const CoursePlayer = () => {
    const { courseId } = useParams();
    const { courses, currentUser, addPoints } = useApp();
    const [activeModuleIndex, setActiveModuleIndex] = useState(0);
    const [lessonContent, setLessonContent] = useState<any>(null);
    const [loadingLesson, setLoadingLesson] = useState(false);
    const [quizSelected, setQuizSelected] = useState<string | null>(null);
    const [quizResult, setQuizResult] = useState<'correct'|'incorrect'|null>(null);

    const course = courses.find(c => c.id === courseId);
    
    useEffect(() => {
        const loadLesson = async () => {
            if(!course || !course.modules) return;
            setLoadingLesson(true);
            const module = course.modules[activeModuleIndex];
            
            // If content is missing, generate it (AI Simulation)
            if(!module.content || module.content.length < 10) {
                 const gen = await generateLesson(course.title, module.title);
                 setLessonContent(gen);
            } else {
                 setLessonContent(module);
            }
            setLoadingLesson(false);
            setQuizSelected(null);
            setQuizResult(null);
        };
        loadLesson();
    }, [courseId, activeModuleIndex, course]);

    if(!course) return <div>Course not found</div>;
    const isOwner = currentUser?.purchasedCourseIds?.includes(course.id);
    if(!isOwner && currentUser?.role !== 'ADMIN') return <Navigate to="/dashboard/courses" />;

    return (
        <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in h-[calc(100vh-6rem)]">
            <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto pr-2">
                <div className="mb-6">
                    <Link to="/dashboard/courses" className="text-xs font-bold text-slate-400 hover:text-black mb-2 block">&larr; Back to Courses</Link>
                    <h1 className="text-3xl font-black">{course.title}</h1>
                    <p className="text-slate-500">{course.modules?.[activeModuleIndex].title}</p>
                </div>

                <Card className="flex-1 overflow-y-auto mb-6">
                    {loadingLesson ? (
                        <div className="flex items-center justify-center h-40"><ArrowPathIcon className="w-8 h-8 animate-spin" /></div>
                    ) : (
                        <div className="prose prose-slate max-w-none">
                            {/* Render content plainly */}
                            {lessonContent?.content?.split('\n').map((line: string, i: number) => <p key={i} className="mb-4">{line}</p>)}
                            
                            {/* Task Section */}
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
                                <h4 className="font-bold text-yellow-800">Practical Task</h4>
                                <p className="text-sm text-yellow-700">{lessonContent?.task || "Complete the module quiz to proceed."}</p>
                            </div>

                            {/* Quiz Section */}
                            <div className="mt-8 pt-8 border-t border-slate-200">
                                <h4 className="font-bold mb-4">Quick Quiz</h4>
                                <p className="mb-4 font-medium">{lessonContent?.quizQuestion}</p>
                                <div className="space-y-2">
                                    {lessonContent?.quizOptions?.map((opt: string) => (
                                        <button 
                                            key={opt}
                                            onClick={() => setQuizSelected(opt)}
                                            disabled={!!quizResult}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                quizSelected === opt 
                                                ? (quizResult === 'correct' ? 'border-green-500 bg-green-50' : (quizResult === 'incorrect' ? 'border-red-500 bg-red-50' : 'border-black'))
                                                : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {quizSelected && !quizResult && (
                                    <Button className="mt-4" onClick={() => {
                                        const correct = lessonContent?.quizAnswer === quizSelected;
                                        setQuizResult(correct ? 'correct' : 'incorrect');
                                        if(correct) addPoints(50);
                                    }}>Submit Answer</Button>
                                )}
                                {quizResult === 'correct' && <p className="mt-2 text-green-600 font-bold">Correct! +50 Points</p>}
                                {quizResult === 'incorrect' && <p className="mt-2 text-red-600 font-bold">Incorrect. Try again.</p>}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-black text-white h-fit">
                     <h3 className="font-bold text-lg mb-4">Course Modules</h3>
                     <div className="space-y-2">
                         {course.modules?.map((m, i) => (
                             <button 
                                key={i}
                                onClick={() => setActiveModuleIndex(i)}
                                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${i === activeModuleIndex ? 'bg-white text-black' : 'hover:bg-slate-800'}`}
                             >
                                 <span className="text-sm font-bold">0{i+1}. {m.title}</span>
                                 {i < activeModuleIndex && <CheckBadgeIcon className="w-5 h-5 text-green-500" />}
                             </button>
                         ))}
                     </div>
                </Card>
                {course.whatsappLink && (
                    <a href={course.whatsappLink} target="_blank" rel="noreferrer" className="block p-4 bg-green-500 text-white rounded-xl font-bold text-center hover:bg-green-600 transition-colors">
                        Join WhatsApp Class
                    </a>
                )}
            </div>
        </div>
    );
};

const ResourcesPage = () => {
    const { resources, recordDownload, currentUser, notify } = useApp();

    const handleDownload = (r: Resource) => {
        if(currentUser?.isClubMember || r.price === 0) {
            recordDownload();
            notify("Download Started", "SUCCESS");
            // window.open(r.downloadUrl, '_blank');
        } else {
            notify("Upgrade to Pro to download", "ERROR");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <h1 className="text-3xl font-black">Business Tools & Downloads</h1>
            <div className="grid md:grid-cols-2 gap-4">
                {resources.map(res => (
                    <Card key={res.id} className="flex gap-4">
                        <img src={res.coverImage} className="w-24 h-32 object-cover rounded-lg bg-slate-200" alt="cover" />
                        <div className="flex flex-col justify-between py-2">
                            <div>
                                <Badge status={res.type} />
                                <h3 className="font-bold text-lg mt-1">{res.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2">{res.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button onClick={() => handleDownload(res)} variant="outline" className="!py-2 !px-4 text-xs flex items-center gap-2">
                                   <ArrowRightOnRectangleIcon className="w-4 h-4" /> Download
                                </Button>
                                {!currentUser?.isClubMember && res.price > 0 && <span className="text-xs font-bold text-slate-400">Pro Only</span>}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const CommunityPage = () => {
    const { channels, messages, currentUser, notify } = useApp();
    const [activeChannelId, setActiveChannelId] = useState(channels[0]?.id || 'c1');
    const [input, setInput] = useState('');
    
    const activeChannel = channels.find(c => c.id === activeChannelId);
    const channelMessages = messages.filter(m => m.channelId === activeChannelId); 

    const sendMessage = async () => {
        if(!input.trim()) return;
        notify("Message sent (Mock)", "INFO");
        setInput('');
    };

    return (
        <div className="h-[calc(100vh-8rem)] grid md:grid-cols-4 gap-4 animate-in fade-in">
            <Card className="md:col-span-1 p-0 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-black text-lg">Channels</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {channels.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => setActiveChannelId(c.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeChannelId === c.id ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                        >
                            # {c.name}
                        </button>
                    ))}
                </div>
            </Card>
            
            <Card className="md:col-span-3 p-0 flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                     <div>
                         <h3 className="font-black text-lg"># {activeChannel?.name}</h3>
                         <p className="text-xs text-slate-400">{activeChannel?.description}</p>
                     </div>
                     <UsersIcon className="w-5 h-5 text-slate-400" />
                 </div>
                 
                 <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
                     {channelMessages.length === 0 && (
                         <div className="text-center text-slate-400 mt-10">
                             <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                             <p>No messages yet. Start the conversation!</p>
                         </div>
                     )}
                     <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">AI</div>
                         <div>
                             <div className="flex items-center gap-2">
                                 <span className="font-bold text-sm">System Bot</span>
                                 <span className="text-[10px] text-slate-400">Today</span>
                             </div>
                             <p className="text-sm bg-white p-3 rounded-tr-xl rounded-b-xl shadow-sm mt-1">
                                 Welcome to the {activeChannel?.name} channel! Be respectful and helpful.
                             </p>
                         </div>
                     </div>
                 </div>

                 <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                     <Input 
                        placeholder={`Message #${activeChannel?.name}`} 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                     />
                     <Button onClick={sendMessage} className="!px-4"><PaperAirplaneIcon className="w-5 h-5" /></Button>
                 </div>
            </Card>
        </div>
    );
};

const AICoachPage = () => {
    const { chatWithAI, currentUser } = useApp();
    const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
        { role: 'model', text: `Habari ${currentUser?.name}! I am Mwalimu. How can I help your business today?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if(!input.trim() || loading) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        const response = await chatWithAI(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
        setLoading(false);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col max-w-3xl mx-auto animate-in fade-in">
             <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                     <SparklesIcon className="w-8 h-8 text-white" />
                 </div>
                 <h1 className="text-2xl font-black">Mwalimu AI Business Coach</h1>
                 <p className="text-slate-500">Expert advice for the African market.</p>
             </div>

             <Card className="flex-1 flex flex-col overflow-hidden p-0 shadow-xl border-slate-200">
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                     {messages.map((m, i) => (
                         <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black border border-slate-200 rounded-tl-none shadow-sm'}`}>
                                 {m.text}
                             </div>
                         </div>
                     ))}
                     {loading && (
                         <div className="flex justify-start">
                             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex gap-2">
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                             </div>
                         </div>
                     )}
                 </div>
                 <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                     <Input 
                        placeholder="Ask Mwalimu about pricing, strategy, or location..." 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                     />
                     <Button onClick={handleSend} disabled={loading} className="!px-4">
                         <PaperAirplaneIcon className="w-5 h-5" />
                     </Button>
                 </div>
             </Card>
        </div>
    );
};

const UserProfile = () => {
    const { currentUser, updateProfile, logout, submitPaymentRequest, notify } = useApp();
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<Partial<User>>({});

    useEffect(() => {
        if(currentUser) setForm(currentUser);
    }, [currentUser]);

    const handleSave = () => {
        updateProfile(form);
        setEditMode(false);
        notify("Profile Updated", "SUCCESS");
    };

    const handleUpgrade = () => {
        const code = prompt("Enter Payment Code for $1 Subscription:");
        if (code) {
            submitPaymentRequest('CLUB_SUBSCRIPTION', 'MPESA', code);
            notify("Upgrade Request Sent", "INFO");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex items-center gap-6">
                <InitialsAvatar name={currentUser?.name || ''} url={currentUser?.avatar || ''} className="w-24 h-24 text-2xl" />
                <div>
                    <h1 className="text-3xl font-black">{currentUser?.name}</h1>
                    <p className="text-slate-500">@{currentUser?.username} • {currentUser?.role}</p>
                    <div className="mt-2 flex gap-2">
                        {currentUser?.isClubMember ? (
                            <Badge status="PRO MEMBER" />
                        ) : (
                            <button onClick={handleUpgrade} className="text-xs font-bold text-blue-600 underline">Upgrade to Pro</button>
                        )}
                    </div>
                </div>
            </div>

            <Card className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-lg">Personal Details</h3>
                    <button onClick={() => editMode ? handleSave() : setEditMode(true)} className="text-sm font-bold underline">
                        {editMode ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                        <Input value={form.name || ''} disabled={!editMode} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                        <Input value={form.email || ''} disabled={true} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                        <Input value={form.phone || ''} disabled={!editMode} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Country</label>
                        <Input value={form.country || ''} disabled={!editMode} onChange={e => setForm({...form, country: e.target.value})} />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <Button onClick={logout} variant="danger" className="w-full">Logout</Button>
                </div>
            </Card>
        </div>
    );
};

const AdminPanel = () => {
    const { currentUser, paymentRequests, approvePayment, rejectPayment, users, courses, notify } = useApp();
    const [view, setView] = useState<'payments'|'users'|'courses'>('payments');
    
    // User Search State
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    
    // Course Management State
    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [courseForm, setCourseForm] = useState<Partial<Course>>({ price: 0, pricePro: 0, category: 'Services', format: 'WHATSAPP_CLASS' });

    useEffect(() => {
        if(searchEmail.length > 2) {
            setSearchResults(users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase())));
        } else {
            setSearchResults([]);
        }
    }, [searchEmail, users]);

    if (currentUser?.role !== 'ADMIN') return <div className="p-4">Access Denied</div>;

    const pending = paymentRequests.filter(r => r.status === 'PENDING');

    const handlePromoteModerator = (user: User) => {
        DBService.update(`users/${user.id}`, { role: 'MODERATOR' });
        notify(`${user.name} promoted to Moderator`, "SUCCESS");
        setSearchEmail('');
        setSearchResults([]);
    };

    const handleSaveCourse = async () => {
        if(!courseForm.title || !courseForm.description) { notify("Fill title and description", "ERROR"); return; }
        
        if (isEditingCourse && courseForm.id) {
            await DBService.update(`courses/${courseForm.id}`, courseForm);
            notify("Course Updated", "SUCCESS");
        } else {
            await DBService.push('courses', {
                ...courseForm,
                id: `c_${Date.now()}`,
                coachId: currentUser.id,
                enrolledCount: 0,
                rating: 5,
                isPremium: (courseForm.price || 0) > 0,
                generatedByAI: false,
                thumbnail: courseForm.thumbnail || 'https://source.unsplash.com/random/800x600?business'
            });
            notify("Course Created", "SUCCESS");
        }
        setCourseForm({ price: 0, pricePro: 0, category: 'Services', format: 'WHATSAPP_CLASS' });
        setIsEditingCourse(false);
    }

    const deleteCourse = async (id: string) => {
        if(window.confirm("Delete this course permanently?")) {
            await DBService.remove(`courses/${id}`);
            notify("Course Deleted", "INFO");
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <h1 className="text-3xl font-black">Admin Panel</h1>
            <div className="flex gap-4 border-b border-slate-200 pb-4 overflow-x-auto">
                {['payments', 'users', 'courses'].map(v => (
                     <button key={v} onClick={() => setView(v as any)} className={`font-bold capitalize whitespace-nowrap ${view === v ? 'text-black' : 'text-slate-400'}`}>{v}</button>
                ))}
            </div>
            
            {/* Payments View */}
            {view === 'payments' && (
                <div className="grid gap-4">
                    {pending.length === 0 && <p className="text-slate-500">No pending payments.</p>}
                    {pending.map(req => (
                        <Card key={req.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="font-bold">{req.method}: {req.transactionCode}</p>
                                <p className="text-sm text-slate-500">User: {req.userName} • Type: {req.type}</p>
                                {req.courseId && <Badge status={`Course ID: ${req.courseId}`} />}
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => approvePayment(req)} className="!py-2 !px-4 text-xs">Approve</Button>
                                <Button onClick={() => rejectPayment(req.id)} variant="danger" className="!py-2 !px-4 text-xs">Reject</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Users View */}
            {view === 'users' && (
                <div className="space-y-6 max-w-xl">
                    <div className="relative">
                        <label className="text-sm font-bold block mb-2">Find User to Promote</label>
                        <Input placeholder="Search user by email..." value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-b-xl z-10 max-h-60 overflow-y-auto">
                                {searchResults.map(u => (
                                    <div key={u.id} className="p-3 hover:bg-slate-50 flex justify-between items-center border-b border-slate-100">
                                        <div>
                                            <p className="font-bold text-sm">{u.email}</p>
                                            <p className="text-xs text-slate-500">{u.name} ({u.role})</p>
                                        </div>
                                        <button onClick={() => handlePromoteModerator(u)} className="text-xs font-bold bg-black text-white px-2 py-1 rounded">
                                            Make Mod
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <p className="text-xs text-slate-400">Total Users: {users.length}</p>
                </div>
            )}

            {/* Courses View */}
            {view === 'courses' && (
                <div className="space-y-8">
                    <div className="max-w-xl space-y-4 bg-white p-6 border border-slate-200 rounded-xl">
                        <h3 className="font-bold">{isEditingCourse ? 'Edit Course' : 'Create New Course'}</h3>
                        <Input placeholder="Course Title" value={courseForm.title || ''} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                        <textarea className="w-full p-4 border-2 border-slate-200 rounded-xl" placeholder="Description" value={courseForm.description || ''} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="number" placeholder="Standard Price" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: Number(e.target.value)})} />
                            <Input type="number" placeholder="Pro Price" value={courseForm.pricePro} onChange={e => setCourseForm({...courseForm, pricePro: Number(e.target.value)})} />
                        </div>
                        <Input placeholder="Image Link (Thumbnail)" value={courseForm.thumbnail || ''} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} />
                        <Input placeholder="Payment Info/Link" value={courseForm.paymentInfo || ''} onChange={e => setCourseForm({...courseForm, paymentInfo: e.target.value})} />
                        <Input placeholder="WhatsApp Group Link" value={courseForm.whatsappLink || ''} onChange={e => setCourseForm({...courseForm, whatsappLink: e.target.value})} />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveCourse}>{isEditingCourse ? 'Update Course' : 'Create Course'}</Button>
                            {isEditingCourse && <Button variant="outline" onClick={() => { setIsEditingCourse(false); setCourseForm({ price: 0, pricePro: 0 }); }}>Cancel</Button>}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {courses.map(c => (
                            <Card key={c.id} className="flex justify-between items-start gap-4">
                                <div className="flex gap-4">
                                    <img src={c.thumbnail} className="w-16 h-16 object-cover rounded-lg bg-slate-200" alt="thumb"/>
                                    <div>
                                        <h4 className="font-bold">{c.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                                        <Badge status={c.isPremium ? 'Premium' : 'Free'} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => { setIsEditingCourse(true); setCourseForm(c); window.scrollTo(0,0); }} className="p-2 hover:bg-slate-100 rounded text-slate-600"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => deleteCourse(c.id)} className="p-2 hover:bg-red-50 rounded text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const ModeratorPanel = () => {
    const { currentUser, courses, users, removeUserFromCourse, notify } = useApp();
    const [selectedCourse, setSelectedCourse] = useState<Course|null>(null);
    const [editForm, setEditForm] = useState<Partial<Course>>({});

    if (currentUser?.role !== 'MODERATOR' && currentUser?.role !== 'ADMIN') return <div className="p-4">Access Denied</div>;

    // Filter enrolled users for selected course
    const enrolledUsers = selectedCourse ? users.filter(u => u.purchasedCourseIds?.includes(selectedCourse.id)) : [];

    const handleSave = async () => {
        if (!selectedCourse || !editForm.id) return;
        await DBService.update(`courses/${editForm.id}`, editForm);
        notify("Course Updated", "SUCCESS");
        setSelectedCourse(null);
    };

    const handleRemoveStudent = async (uid: string) => {
        if(!selectedCourse) return;
        if(window.confirm("Remove user from course? They will lose access.")) {
            await removeUserFromCourse(uid, selectedCourse.id);
            notify("User removed from course", "INFO");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <h1 className="text-3xl font-black">Moderator Portal</h1>
            
            {selectedCourse ? (
                <div className="space-y-6">
                    <button onClick={() => setSelectedCourse(null)} className="text-sm font-bold text-slate-500">&larr; Back to List</button>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Edit Course Info */}
                        <Card className="space-y-4">
                            <h3 className="font-bold text-lg">Edit Course Info</h3>
                            <Input label="Title" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                            <textarea className="w-full p-4 border border-slate-200 rounded-lg" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                            <Input label="Google Meet Link" placeholder="https://meet.google.com/..." value={editForm.googleMeetLink || ''} onChange={e => setEditForm({...editForm, googleMeetLink: e.target.value})} />
                            <Input label="WhatsApp Link" value={editForm.whatsappLink || ''} onChange={e => setEditForm({...editForm, whatsappLink: e.target.value})} />
                            <Button onClick={handleSave}>Save Changes</Button>
                        </Card>

                        {/* Manage Students */}
                        <Card className="h-fit">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UsersIcon className="w-5 h-5"/> Enrolled Students ({enrolledUsers.length})</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {enrolledUsers.length === 0 && <p className="text-slate-400 text-sm">No students enrolled.</p>}
                                {enrolledUsers.map(u => (
                                    <div key={u.id} className="flex justify-between items-center p-2 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <InitialsAvatar name={u.name} url={u.avatar} className="w-8 h-8"/>
                                            <div>
                                                <p className="font-bold text-xs">{u.name}</p>
                                                <p className="text-[10px] text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveStudent(u.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><XCircleIcon className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(c => (
                        <Card key={c.id} className="hover:border-black cursor-pointer group" onClick={() => { setSelectedCourse(c); setEditForm(c); }}>
                            <div className="flex gap-4">
                                <img src={c.thumbnail} className="w-16 h-16 object-cover rounded-lg bg-slate-200" />
                                <div>
                                    <h3 className="font-bold group-hover:underline">{c.title}</h3>
                                    <p className="text-xs text-slate-500">{c.enrolledCount} Enrolled</p>
                                    <Badge status="Manage" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

const LandingPage = () => {
    const { register, t, language, setLanguage } = useApp();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const [notificationIndex, setNotificationIndex] = useState(0);
    const notifications = [
        "New Gig: Solar Power in Lagos",
        "Framework: Exporting from Accra",
        "Guide: M-Pesa Integration 2025",
        "Strategy: Poultry Farming Nairobi"
    ];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setNotificationIndex(prev => (prev + 1) % notifications.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const toggleLang = () => setLanguage(language === 'en' ? 'sw' : 'en');

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                           <span className="text-white font-bold text-xl">K</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-black">KashSight</span>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-bold text-slate-500 hover:text-black transition-colors">{t('features')}</a>
                        <a href="#stats" className="text-sm font-bold text-slate-500 hover:text-black transition-colors">Impact</a>
                        <a href="#community" className="text-sm font-bold text-slate-500 hover:text-black transition-colors">{t('community')}</a>
                    </nav>

                    <div className="hidden md:flex items-center space-x-6">
                        <button onClick={toggleLang} className="text-sm font-bold hover:bg-slate-100 px-3 py-1 rounded transition-colors uppercase">
                            {language === 'en' ? 'SWA' : 'ENG'}
                        </button>
                        <Button variant="primary" onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }} className="!py-2 !px-6 text-sm">
                            {t('get_started')}
                        </Button>
                    </div>
                    <div className="md:hidden">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                            {mobileMenuOpen ? <XMarkIcon className="w-8 h-8 text-black" /> : <Bars3Icon className="w-8 h-8 text-black" />}
                        </button>
                    </div>
                </div>
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 p-4 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-4">
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className="font-medium text-black">{t('features')}</a>
                        <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="font-medium text-black">Impact</a>
                        <div className="flex justify-between items-center p-2 border rounded-lg border-slate-200">
                            <span className="font-medium text-black">Language</span>
                            <button onClick={toggleLang} className="px-3 py-1 bg-slate-100 rounded-lg font-bold">{language.toUpperCase()}</button>
                        </div>
                        <Button variant="primary" onClick={() => { setAuthMode('login'); setIsAuthOpen(true); setMobileMenuOpen(false); }} className="w-full">
                            {t('login')} / {t('register')}
                        </Button>
                    </div>
                )}
            </header>

            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 space-y-8 z-10">
                        <span className="text-black font-black tracking-widest text-xs uppercase border border-black px-2 py-1">Pan-African Learning</span>
                        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter text-black">
                            {t('landing_hero_title')}
                        </h1>
                        <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                            {t('landing_hero_subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <Button onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }} className="flex items-center justify-center gap-2">
                                {t('get_started')} <ArrowRightOnRectangleIcon className="w-5 h-5" />
                             </Button>
                        </div>
                    </div>
                    <div className="md:w-1/2 mt-12 md:mt-0 relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500 bg-slate-100">
                             <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80" alt="African Business" className="w-full h-auto object-cover grayscale" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        </div>
                        <div className="absolute top-10 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-200 flex items-center gap-4 animate-[bounce_4s_infinite]">
                             <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                                <CheckBadgeIcon className="w-6 h-6" />
                             </div>
                             <div>
                                 <p className="font-bold text-sm text-black transition-all duration-300 w-48 truncate">{notifications[notificationIndex]}</p>
                                 <p className="text-xs text-slate-500">Live Update</p>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Built for the Jua Kali Economy</h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">We don't teach theory. We provide tools, capital, and mentorship for real businesses.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                         {/* Feature 1 */}
                         <div className="space-y-4">
                             <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center">
                                 <WrenchScrewdriverIcon className="w-8 h-8" />
                             </div>
                             <h3 className="text-2xl font-bold">Vocational Gigs</h3>
                             <p className="text-slate-500 leading-relaxed">Access step-by-step guides for tangible businesses like welding, farming, and repairs. No digital fluff.</p>
                         </div>
                         {/* Feature 2 */}
                         <div className="space-y-4">
                             <div className="w-14 h-14 bg-white border-2 border-black text-black rounded-2xl flex items-center justify-center">
                                 <SparklesIcon className="w-8 h-8" />
                             </div>
                             <h3 className="text-2xl font-bold">Mwalimu Business Coach</h3>
                             <p className="text-slate-500 leading-relaxed">Your personal business consultant available 24/7. Ask about pricing, location, or conflict resolution.</p>
                         </div>
                         {/* Feature 3 */}
                         <div className="space-y-4">
                             <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center">
                                 <UserGroupIcon className="w-8 h-8" />
                             </div>
                             <h3 className="text-2xl font-bold">Pro Community</h3>
                             <p className="text-slate-500 leading-relaxed">Join channels dedicated to your trade. Network with other carpenters, farmers, and traders across Africa.</p>
                         </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-20 bg-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <p className="text-4xl md:text-5xl font-black mb-2">15k+</p>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Learners</p>
                        </div>
                        <div>
                            <p className="text-4xl md:text-5xl font-black mb-2">300+</p>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Verified Coaches</p>
                        </div>
                        <div>
                            <p className="text-4xl md:text-5xl font-black mb-2">$50k</p>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Value Generated</p>
                        </div>
                         <div>
                            <p className="text-4xl md:text-5xl font-black mb-2">54</p>
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Countries</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-20 pb-10 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2">
                             <div className="flex items-center space-x-2 mb-6">
                                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                   <span className="text-white font-bold text-xl">K</span>
                                </div>
                                <span className="font-bold text-xl tracking-tight text-black">KashSight</span>
                            </div>
                            <p className="text-slate-500 max-w-sm mb-6">
                                Empowering the African workforce with real-world skills and smart business intelligence.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-black uppercase tracking-widest mb-6 text-sm">Platform</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-slate-500 hover:text-black font-medium">Browse Gigs</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-black font-medium">Pricing</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-black font-medium">Mwalimu</a></li>
                                <li><a onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }} className="text-slate-500 hover:text-black font-medium cursor-pointer">Login</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-black uppercase tracking-widest mb-6 text-sm">Legal</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-slate-500 hover:text-black font-medium">Privacy Policy</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-black font-medium">Terms of Service</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-black font-medium">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-400 text-sm font-medium">© 2024 KashSight Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            {/* Social Placeholders */}
                            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </footer>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} mode={authMode} setMode={setAuthMode} />
        </div>
    );
};

const AuthModal = ({ isOpen, onClose, mode, setMode }: { isOpen: boolean; onClose: () => void; mode: 'login'|'register'; setMode: (m: 'login'|'register') => void }) => {
    const { login, register, t, notify } = useApp();
    const [formData, setFormData] = useState({ 
        username: '', name: '', email: '', password: '', phone: '', role: 'LEARNER' as 'LEARNER'|'COACH'|'ADMIN' 
    });
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'login') {
            const success = login(formData.email, formData.password);
            if (success) { notify("Login Successful", "SUCCESS"); onClose(); }
            else notify('Invalid credentials', "ERROR");
        } else {
             const finalRole = (formData.email === 'admin@kashsight.learn') ? 'ADMIN' : formData.role;
             register(formData.username, formData.name, formData.email, formData.password, formData.phone, finalRole);
             notify("Account Created Successfully", "SUCCESS");
             onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <XMarkIcon className="w-8 h-8 text-black" />
            </button>
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <div className="w-16 h-16 bg-black rounded-2xl mx-auto mb-6 flex items-center justify-center">
                        <span className="text-white font-black text-3xl">K</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-black mb-2">
                        {mode === 'login' ? t('welcome') : 'Join the Academy'}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'register' && (
                        <>
                           <Input placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                           <Input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                           <Input placeholder="WhatsApp Number" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                           {/* Removed Role Selection: Defaulting to LEARNER unless Admin pattern */}
                        </>
                    )}
                    <Input placeholder="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <Input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <Button variant="primary" className="w-full py-4 text-lg !rounded-2xl">
                        {mode === 'login' ? t('login') : t('register')}
                    </Button>
                </form>
                <div className="text-center">
                    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm font-bold underline hover:text-slate-700 transition-colors text-black">
                        {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const DashboardLayout = () => {
    const { currentUser, t, systemStatus } = useApp();
    const location = useLocation();
    const [isMobileNavOpen, setMobileNavOpen] = useState(false);

    if (systemStatus.maintenance && currentUser?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 text-white">
                <Cog6ToothIcon className="w-24 h-24 text-white mb-6 animate-spin-slow" />
                <h1 className="text-3xl font-bold mb-2">{t('maintenance')}</h1>
            </div>
        )
    }

    const navItems = [
        { path: '/dashboard', label: t('dashboard'), icon: HomeIcon },
        { path: '/dashboard/courses', label: t('courses'), icon: AcademicCapIcon },
        { path: '/dashboard/resources', label: t('resources'), icon: DocumentArrowDownIcon },
        { path: '/dashboard/community', label: t('community'), icon: ChatBubbleLeftRightIcon },
        { path: '/dashboard/ai', label: t('ai_coach'), icon: SparklesIcon },
    ];
    if (currentUser?.role === 'ADMIN') {
        navItems.push({ path: '/dashboard/admin', label: 'Admin Panel', icon: LockClosedIcon });
    }
    if (currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN') {
        navItems.push({ path: '/dashboard/moderator', label: 'Moderator Portal', icon: ShieldCheckIcon });
    }

    return (
        <div className="min-h-screen bg-slate-50 text-black flex font-sans">
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-20">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                     <div className="w-6 h-6 bg-black text-white flex items-center justify-center rounded font-bold">K</div>
                     <span className="text-xl font-black tracking-tight">KashSight</span>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map(item => (
                        <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${location.pathname === item.path ? 'bg-black text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-100">
                    <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 transition-all mb-2">
                        <InitialsAvatar name={currentUser?.name || 'User'} url={currentUser?.avatar || ''} className="w-8 h-8 grayscale" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold truncate w-32">{currentUser?.name}</span>
                            <span className="text-[10px] uppercase text-slate-400">{currentUser?.role}</span>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Mobile Nav */}
            <div className="md:hidden fixed top-0 w-full z-30 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-black text-white flex items-center justify-center rounded font-bold">K</div>
                     <span className="font-bold">KashSight</span>
                 </div>
                 <button onClick={() => setMobileNavOpen(!isMobileNavOpen)}><Bars3Icon className="w-6 h-6" /></button>
            </div>
            {isMobileNavOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-white p-4 pt-20 animate-in slide-in-from-top-10">
                    <button onClick={() => setMobileNavOpen(false)} className="absolute top-4 right-4"><XMarkIcon className="w-8 h-8" /></button>
                    <nav className="space-y-2">
                        {navItems.map(item => (
                            <Link key={item.path} to={item.path} onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-slate-100 text-lg font-medium border-b border-slate-100">
                                <item.icon className="w-6 h-6" />
                                {item.label}
                            </Link>
                        ))}
                        <Link to="/dashboard/profile" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-slate-100 text-lg font-medium border-b border-slate-100">
                            <UserCircleIcon className="w-6 h-6" /> Profile
                        </Link>
                    </nav>
                </div>
            )}

            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen overflow-x-hidden">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/:courseId" element={<CoursePlayer />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/ai" element={<AICoachPage />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/moderator" element={<ModeratorPanel />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </main>
        </div>
    );
};

// --- App Root ---
const App = () => {
    const [language, setLanguage] = useState<'en'|'sw'>('en');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{users:User[], courses:Course[], resources:Resource[], paymentRequests:PaymentRequest[], channels:Channel[], messages:ChatMessage[]}>({users:[], courses:[], resources:[], paymentRequests:[], channels:[], messages:[]});
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        return subscribeToData((val) => {
             setData(val);
             setLoading(false);
        });
    }, []);

    // Schema Migration & User Sync
    useEffect(() => {
        if (!loading && data.users.length > 0) {
            const pid = AuthService.getPersistedUserId();
            if (pid) {
                const foundUser = data.users.find(u => u.id === pid) || null;
                if (foundUser) {
                    const updates: any = {};
                    let needsUpdate = false;
                    if (foundUser.points === undefined) { updates.points = 10; needsUpdate = true; }
                    if (foundUser.balance === undefined) { updates.balance = 0; needsUpdate = true; }
                    if (foundUser.currency === undefined) { updates.currency = 'USD'; needsUpdate = true; }
                    if (foundUser.courseProgress === undefined) { updates.courseProgress = {}; needsUpdate = true; }
                    if (foundUser.purchasedCourseIds === undefined) { updates.purchasedCourseIds = []; needsUpdate = true; }
                    if (foundUser.lastDownloadTimestamp === undefined) { updates.lastDownloadTimestamp = 0; needsUpdate = true; }
                    if (foundUser.skills === undefined) { updates.skills = []; needsUpdate = true; }
                    if (foundUser.joinedAt === undefined) { updates.joinedAt = Date.now(); needsUpdate = true; }
                    if (foundUser.isClubMember === undefined) { updates.isClubMember = false; needsUpdate = true; }

                    if (needsUpdate) {
                        DBService.update(`users/${foundUser.id}`, updates);
                        setCurrentUser({ ...foundUser, ...updates });
                    } else {
                        setCurrentUser(foundUser);
                    }
                } else {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
        }
    }, [loading, data.users]);

    const notify = (message: string, type: 'SUCCESS'|'ERROR'|'INFO' = 'INFO') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000); // Auto remove
    };

    const login = (e: string, p: string) => {
        const u = AuthService.login(data.users, e, p);
        if (u) { setCurrentUser(u); return true; }
        return false;
    };
    const register = (u: string, n: string, e: string, p: string, ph: string, r: 'LEARNER'|'COACH'|'ADMIN') => {
        AuthService.register(u, n, e, p, ph, r).then(setCurrentUser);
    };
    const logout = () => { AuthService.logout(); setCurrentUser(null); };
    const t = (k: keyof typeof translations['en']) => translations[language][k] || k;
    const chatWithAI = async (msg: string) => await getBusinessAdvice(`User: ${currentUser?.name}`, msg);
    
    const convertPoints = (pts: number) => {
        const dollars = pts / 10000;
        const currency = currentUser?.currency || 'USD';
        const rate = CURRENCY_RATES[currency] || 1;
        const value = dollars * rate;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value);
    }

    const addPoints = async (amount: number) => {
        if(currentUser) {
            const newPts = (currentUser.points || 0) + amount;
            await DBService.update(`users/${currentUser.id}`, { points: newPts });
        }
    };

    const removeUserFromCourse = async (userId: string, courseId: string) => {
        const targetUser = data.users.find(u => u.id === userId);
        if (targetUser && targetUser.purchasedCourseIds) {
            const newIds = targetUser.purchasedCourseIds.filter(id => id !== courseId);
            await DBService.update(`users/${userId}`, { purchasedCourseIds: newIds });
        }
    };

    const submitPaymentRequest = async (type: 'CLUB_SUBSCRIPTION'|'COURSE_PURCHASE', m: any, c: string, cid?: string) => {
        if(!currentUser) return;
        const payload: any = { 
            userId: currentUser.id, userName: currentUser.name, amount: 1, method: m, transactionCode: c, status: 'PENDING', timestamp: Date.now(), type
        };
        if (cid) payload.courseId = cid;
        await DBService.push('paymentRequests', payload);
    };

    const approvePayment = async (req: PaymentRequest) => {
        await DBService.update(`paymentRequests/${req.id}`, { status: 'APPROVED' });
        if (req.type === 'CLUB_SUBSCRIPTION') {
             await DBService.update(`users/${req.userId}`, { isClubMember: true, subscriptionExpiry: Date.now() + 2592000000 });
        } else if (req.type === 'COURSE_PURCHASE' && req.courseId) {
             const user = data.users.find(u => u.id === req.userId);
             const currentCourses = user?.purchasedCourseIds || [];
             await DBService.update(`users/${req.userId}`, { purchasedCourseIds: [...currentCourses, req.courseId] });
        }
        notify("Payment Approved", "SUCCESS");
    };
    const rejectPayment = async (rid: string) => {
        await DBService.update(`paymentRequests/${rid}`, { status: 'REJECTED' });
        notify("Payment Rejected", "ERROR");
    };
    const downgradeUser = async (uid: string) => DBService.update(`users/${uid}`, { isClubMember: false });
    const updateProfile = (d: any) => DBService.update(`users/${currentUser?.id}`, d);
    const recordDownload = async () => {
        if (!currentUser) return;
        const ts = Date.now();
        await DBService.update(`users/${currentUser.id}`, { lastDownloadTimestamp: ts });
        setCurrentUser({...currentUser, lastDownloadTimestamp: ts});
    };

    if (loading) return <LoadingScreen />;

    return (
        <AppContext.Provider value={{
            currentUser, ...data, systemStatus: { maintenance: false },
            language, setLanguage, t,
            submitPaymentRequest, approvePayment, rejectPayment, downgradeUser, removeUserFromCourse,
            chatWithAI, login, register, logout, updateProfile, recordDownload, convertPoints, notify, addPoints
        }}>
            <NotificationsDisplay notifications={notifications} remove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
            <HashRouter>
                <Routes>
                    <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage />} />
                    <Route path="/dashboard/*" element={currentUser ? <DashboardLayout /> : <Navigate to="/" />} />
                </Routes>
            </HashRouter>
        </AppContext.Provider>
    );
};

export default App;