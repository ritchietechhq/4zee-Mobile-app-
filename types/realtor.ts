// ============================================================
// Realtor Types
// Matches: GET /realtor/activity-feed, /realtor/listings/analytics,
//          /realtor/goals, /realtor/schedule
// ============================================================

// ---- Activity Feed ----

export type ActivityFeedType =
  | 'VIEW'
  | 'FAVORITE'
  | 'INQUIRY'
  | 'SALE'
  | 'APPLICATION'
  | 'COMMISSION';

export interface ActivityFeedItem {
  id: string;
  type: ActivityFeedType;
  title: string;
  description: string;
  propertyId?: string;
  propertyTitle?: string;
  clientName?: string;
  amount?: number;
  createdAt: string;
}

export interface ActivityFeedResponse {
  items: ActivityFeedItem[];
  total: number;
}

// ---- Listing Analytics ----

export interface ListingAnalyticsItem {
  id: string;
  title: string;
  views: number;
  favorites: number;
  enquiries: number;
  lastViewedAt: string | null;
}

export interface ListingAnalyticsSummary {
  totalListings: number;
  totalViews: number;
  totalFavorites: number;
  totalEnquiries: number;
}

export interface ListingAnalyticsResponse {
  listings: ListingAnalyticsItem[];
  summary: ListingAnalyticsSummary;
}

// ---- Goals ----

export interface GoalProgress {
  target: number;
  achieved: number;
  totalRevenue: number;
  progress: number; // 0-100 percentage
}

export interface GoalsResponse {
  monthly: GoalProgress;
  quarterly: GoalProgress;
  yearly: GoalProgress;
  period: {
    currentMonth: string;
    currentQuarter: string;
    currentYear: string;
  };
}

// ---- Schedule ----

export type ScheduleItemType = 'FOLLOW_UP' | 'INQUIRY_RESPONSE';
export type SchedulePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ScheduleItem {
  id: string;
  type: ScheduleItemType;
  title: string;
  description: string;
  property?: string;
  client?: string;
  scheduledAt: string;
  priority: SchedulePriority;
}

export interface ScheduleResponse {
  items: ScheduleItem[];
  total: number;
  pendingApplications: number;
  unreadInquiries: number;
}

// ---- Messaging Unread ----

export interface UnreadMessagesResponse {
  count: number;
}

// ---- Installment Requests ----

export type InstallmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface InstallmentRequestClient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface InstallmentRequestProperty {
  id: string;
  title: string;
  price: number;
  type?: string;
  images?: string[];
}

export interface InstallmentRequestPlan {
  id: string;
  name: string;
  durationMonths: number;
  downPaymentPct: number;
  interestRate: number;
}

export interface InstallmentRequest {
  id: string;
  status: InstallmentRequestStatus;
  applicationId: string;
  client: InstallmentRequestClient;
  property: InstallmentRequestProperty;
  paymentPlan: InstallmentRequestPlan;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  // Calculated amounts
  totalAmount: number;
  downPayment: number;
  monthlyAmount: number;
  // Agreement (if approved)
  agreement?: {
    id: string;
    documentUrl?: string;
    signedAt?: string;
    status: 'PENDING_SIGNATURE' | 'SIGNED' | 'EXPIRED';
  };
}

export interface InstallmentRequestsResponse {
  items: InstallmentRequest[];
  total: number;
  pending: number;
}
