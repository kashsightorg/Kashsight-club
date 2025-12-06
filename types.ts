
export interface User {
  id: string;
  username: string; // Added username
  name: string;
  email: string;
  passwordHash?: string;
  mpesaNumber: string; 
  whatsappNumber: string; 
  countryCode: string; 
  avatar: string;
  coverImage?: string; 
  bio?: string; 
  location?: string; 
  role: 'LEARNER' | 'COACH' | 'ADMIN';
  isClubMember: boolean; 
  points: number; 
  balance: number;
  skills: string[]; 
  joinedAt: number;
}

export interface Course {
  id: string;
  coachId: string;
  title: string;
  description: string;
  category: 'Carpentry' | 'Tailoring' | 'Beauty' | 'Farming' | 'Welding' | 'Mechanic' | 'Cyber' | 'Other';
  format: 'VIDEO' | 'PHYSICAL_COACHING' | 'EBOOK';
  price: number;
  location?: string; 
  whatsappGroupLink?: string;
  thumbnail: string;
  enrolledCount: number;
  rating: number;
}

export interface Sacco {
  id: string;
  name: string;
  description: string;
  members: string[]; 
  totalSavings: number;
  monthlyContribution: number;
  chairmanId: string;
}

export interface BusinessLoan {
  id: string;
  borrowerId: string;
  amount: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  interestRate: number;
  dueDate: number;
}

export interface Partnership {
  id: string;
  initiatorId: string;
  type: 'ACADEMY_FORMATION' | 'B2B_COLLAB';
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string; 
  text: string;
  timestamp: number;
}