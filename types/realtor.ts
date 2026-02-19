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
