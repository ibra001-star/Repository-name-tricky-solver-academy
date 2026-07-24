export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profilePictureUrl: string | null;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  _count?: { questions: number; exams: number };
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  subjectId: string;
  parentId: string | null;
  curriculum: 'CBC' | 'KCSE';
  form: number | null;
  subtopics?: Topic[];
}

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'STRUCTURED'
  | 'FILL_IN_BLANK'
  | 'MATCHING'
  | 'ESSAY'
  | 'CALCULATION'
  | 'GRAPH'
  | 'IMAGE_BASED';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean; // stripped for students before an attempt is submitted
}

export interface QuestionContent {
  text: string;
  latex?: string;
  imageUrls?: string[];
  options?: QuestionOption[];
  blanks?: string[];
  matchPairs?: { left: string; right: string }[];
}

export interface QuestionSolution {
  steps: string[];
  finalAnswer: string;
  markingScheme?: string;
  explanationLatex?: string;
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  curriculum: 'CBC' | 'KCSE';
  form: number | null;
  year: number | null;
  tags: string[];
  marks: number;
  content: QuestionContent;
  solution?: QuestionSolution;
  isApproved: boolean;
  topic?: Topic;
  subject?: Subject;
}

export type ExamType =
  | 'TOPICAL'
  | 'CAT'
  | 'MIDTERM'
  | 'END_TERM'
  | 'KCSE_MOCK'
  | 'KCSE_PREDICTION'
  | 'CBC_ASSESSMENT'
  | 'HOLIDAY_ASSIGNMENT'
  | 'PAST_PAPER';

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  subject: Subject;
  examType: ExamType;
  curriculum: 'CBC' | 'KCSE';
  form: number | null;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: boolean;
  randomizeOrder: boolean;
  isPremium: boolean;
  priceKes: number | null;
  isPublished: boolean;
  _count?: { examQuestions: number; attempts: number };
}

export interface ExamTakingQuestion {
  id: string;
  order: number;
  type: QuestionType;
  marks: number;
  difficulty: DifficultyLevel;
  content: QuestionContent;
}

export interface ExamForTaking {
  id: string;
  title: string;
  description: string | null;
  subject: Subject;
  examType: ExamType;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: boolean;
  questions: ExamTakingQuestion[];
}

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'MARKED' | 'ABANDONED';

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  status: AttemptStatus;
  answers: Record<string, { response: unknown; autoSavedAt?: string; awarded?: number; isCorrect?: boolean | null }>;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface AttemptResultQuestion {
  id: string;
  order: number;
  type: QuestionType;
  marks: number;
  content: QuestionContent;
  solution: QuestionSolution;
  studentAnswer: unknown;
  awarded: number;
  isCorrect: boolean | null;
}

export interface AttemptResult {
  id: string;
  status: AttemptStatus;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  startedAt: string;
  submittedAt: string | null;
  exam: { id: string; title: string; subject: Subject };
  questions: AttemptResultQuestion[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  school: string | null;
  score: number | null;
  percentage: number | null;
  submittedAt: string | null;
}

export type SubscriptionPlan = 'MONTHLY' | 'YEARLY' | 'LIFETIME';
export type PaymentProviderName = 'MPESA' | 'STRIPE' | 'PAYPAL';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  provider: PaymentProviderName;
  purpose: 'SUBSCRIPTION' | 'PAPER_PURCHASE' | 'BUNDLE_PURCHASE';
  status: PaymentStatus;
  amountKes: number;
  currency: string;
  createdAt: string;
  subscription?: { plan: SubscriptionPlan; status: string; expiresAt: string | null } | null;
  paperPurchase?: { exam: { title: string } } | null;
}

export interface InitiatePaymentResponse {
  method: 'mpesa' | 'stripe' | 'paypal';
  paymentId: string;
  // mpesa
  checkoutRequestId?: string;
  customerMessage?: string;
  // stripe
  checkoutUrl?: string;
  // paypal
  orderId?: string;
  approveUrl?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  discountPercent: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  school: string | null;
  form: number | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PlatformStats {
  totalStudents: number;
  totalTeachers: number;
  totalQuestions: number;
  pendingQuestions: number;
  totalExams: number;
  totalAttempts: number;
  pendingUploads: number;
}

export interface RevenueSummary {
  totalRevenueKes: number;
  totalTransactions: number;
  byProvider: { provider: PaymentProviderName; revenueKes: number; count: number }[];
  byPurpose: { purpose: string; revenueKes: number; count: number }[];
  recentPayments: Array<{
    id: string;
    amountKes: number;
    provider: PaymentProviderName;
    createdAt: string;
    user: { firstName: string; lastName: string; email: string };
  }>;
  subscriptionCounts: { plan: SubscriptionPlan; status: string; count: number }[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export type UploadStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface TeacherUpload {
  id: string;
  title: string;
  subjectArea: string;
  fileUrl: string;
  fileType: string;
  status: UploadStatus;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  teacher?: { firstName: string; lastName: string; email?: string; school?: string | null };
}

export interface Certificate {
  id: string;
  fileUrl: string;
  createdAt: string;
}

export interface ForumAuthor {
  firstName: string;
  lastName: string;
  role: Role;
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  author: ForumAuthor;
  subject: Subject | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number };
}

export interface ForumPost {
  id: string;
  threadId: string;
  author: ForumAuthor;
  body: string;
  createdAt: string;
}

export interface ForumThreadDetail extends ForumThread {
  posts: ForumPost[];
}

export interface ConversationPartner {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface Conversation {
  partner: ConversationPartner;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  author: { firstName: string; lastName: string };
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
}

export interface ReferralStats {
  totalReferred: number;
  rewardsEarned: number;
  referrals: Array<{
    id: string;
    rewardGranted: boolean;
    createdAt: string;
    referee: { firstName: string; lastName: string; createdAt: string };
  }>;
}

export type LiveClassType = 'ZOOM' | 'YOUTUBE';

export interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  type: LiveClassType;
  subject: Subject | null;
  joinUrl: string;
  scheduledStart: string | null;
  durationMinutes: number | null;
  isPublished: boolean;
  host: { firstName: string; lastName: string };
}

export interface StudyPlanItem {
  id: string;
  title: string;
  subject: Subject | null;
  scheduledFor: string;
  isCompleted: boolean;
  notes: string | null;
}

export interface PlatformLeaderboardEntry {
  rank: number;
  name: string;
  school: string | null;
  averagePercentage: number;
  examsCompleted: number;
}
