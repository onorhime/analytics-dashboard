// Types based on Xano database structure

// Page Visit from Xano database
export interface PageVisit {
  id: number;
  email: string;
  page_url: string;
  page_title: string;
  visited_at: string | number;  // Can be ISO string or Unix timestamp
  session_id: string;
  referrer: string | null;
  created_at: string | number;  // Can be ISO string or Unix timestamp
}

// User derived from page visits (grouped by email)
export interface User {
  email: string;
  visitCount: number;
  lastVisit: string | number;  // Can be ISO string or Unix timestamp
  firstVisit: string | number;  // Can be ISO string or Unix timestamp
  sessions: string[];
}

// Analytics summary derived from page visits
export interface AnalyticsSummary {
  totalVisits: number;
  uniqueUsers: number;
  uniquePages: number;
  uniqueSessions: number;
  topPages: {
    url: string;
    title: string;
    visits: number;
  }[];
  visitsByDay: {
    date: string;
    visits: number;
  }[];
  referrerData: {
    source: string;
    visits: number;
  }[];
}

// Redux state types
export interface AnalyticsState {
  pageVisits: PageVisit[];
  isLoading: boolean;
  error: string | null;
  summary: AnalyticsSummary | null;
  users: User[];
}

export interface RootState {
  analytics: AnalyticsState;
}
