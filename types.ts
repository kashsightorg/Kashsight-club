
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash?: string;
  phone: string; 
  country: string; 
  currency: string; // Changed to string to support more currencies
  avatar: string;
  coverImage?: string; 
  bio?: string; 
  role: 'LEARNER' | 'COACH' | 'ADMIN' | 'MODERATOR'; 
  isClubMember: boolean; 
  subscriptionExpiry?: number;
  points: number; 
  balance: number;
  skills: string[]; 
  joinedAt: number;
  lastDownloadTimestamp?: number;
  purchasedCourseIds?: string[]; 
  courseProgress?: { [courseId: string]: number }; // Track completed module count
}

export interface CourseModule {
  title: string;
  content: string; 
  task: string;
  quizQuestion: string;
  quizAnswer: string; 
  quizOptions: string[];
}

export interface Course {
  id: string;
  coachId: string; 
  title: string;
  description: string;
  category: 'Agriculture' | 'Technology' | 'Manufacturing' | 'Services' | 'Creative' | 'Trade';
  format: 'AI_SELF_PACED' | 'WHATSAPP_CLASS'; 
  price: number;
  pricePro: number; 
  thumbnail: string;
  enrolledCount: number;
  rating: number;
  isPremium: boolean;
  generatedByAI: boolean;
  modules?: CourseModule[]; 
  whatsappLink?: string;
  googleMeetLink?: string; // Added Google Meet Link
  paymentInfo?: string; // Added: Link or instructions for payment (Selar/PayPal)
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'GUIDE' | 'FRAMEWORK' | 'TEMPLATE' | 'STRATEGY';
  price: number; 
  coverImage: string;
  downloadUrl: string;
  author: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'CLUB_SUBSCRIPTION' | 'COURSE_PURCHASE'; 
  courseId?: string; 
  method: 'SELAR' | 'PAYPAL' | 'MPESA';
  transactionCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: number;
}

export interface ForumPost {
  id: string;
  authorId: string;
  content: string;
  likes: number;
  likedBy: string[]; 
  comments: number;
  timestamp: number;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isLocked?: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Notification {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
  message: string;
}