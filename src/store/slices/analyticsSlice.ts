import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AnalyticsState, PageVisit, AnalyticsSummary, User } from '../../types';
import xanoService from '../../api/xanoApi';
import { format, subDays } from 'date-fns';
import { safeParseDate } from '../../utils/dateHelpers';

// Initial state
const initialState: AnalyticsState = {
  pageVisits: [],
  isLoading: false,
  error: null,
  summary: null,
  users: []
};

// Async thunk for fetching all data from the Xano API
export const fetchAllData = createAsyncThunk(
  'analytics/fetchAllData',
  async () => {
    const data = await xanoService.getAllPageVisits();
    return data;
  }
);

// Helper functions for computing derived data
const computeAnalyticsSummary = (pageVisits: PageVisit[]): AnalyticsSummary => {
  // Count unique users, pages, sessions
  const uniqueUsers = new Set(pageVisits.map(visit => visit.email)).size;
  const uniquePages = new Set(pageVisits.map(visit => visit.page_url)).size;
  const uniqueSessions = new Set(pageVisits.map(visit => visit.session_id)).size;
  
  // Calculate top pages
  const pageCounter: Record<string, { title: string, count: number }> = {};
  pageVisits.forEach(visit => {
    if (pageCounter[visit.page_url]) {
      pageCounter[visit.page_url].count++;
    } else {
      pageCounter[visit.page_url] = { title: visit.page_title, count: 1 };
    }
  });
  
  const topPages = Object.entries(pageCounter)
    .map(([url, { title, count }]) => ({ url, title, visits: count }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);
  
  // Calculate visits by day (last 30 days)
  // Create a fresh date object with today's year, month, day and no time component
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  console.log('Today is:', format(today, 'yyyy-MM-dd')); // Log today's date for debugging
  
  const dayVisits: Record<string, number> = {};
  
  // Create a new array with the last 30 days INCLUDING today
  const dateArray = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    dayVisits[formattedDate] = 0;
    dateArray.push(formattedDate);
  }
  
  // Log the first and last dates in our range for debugging
  console.log('First date in range:', dateArray[0]);
  console.log('Last date in range:', dateArray[dateArray.length-1]);
  
  // Count visits per day
  pageVisits.forEach(visit => {
    try {
      const parsedDate = safeParseDate(visit.visited_at);
      if (parsedDate) {
        const visitDate = format(parsedDate, 'yyyy-MM-dd');
        if (dayVisits[visitDate] !== undefined) {
          dayVisits[visitDate]++;
        }
      }
    } catch (error) {
      console.error(`Error parsing date for visit ID ${visit.id}:`, visit.visited_at, error);
    }
  });
  
  // Format data for chart display, ensuring we include all dates including today
  let visitsByDay = dateArray.map(date => ({
    date,
    visits: dayVisits[date] || 0
  }));
  
  // Calculate referrer data
  const referrerCounter: Record<string, number> = {};
  pageVisits.forEach(visit => {
    const referrer = visit.referrer || 'Direct';
    referrerCounter[referrer] = (referrerCounter[referrer] || 0) + 1;
  });
  
  const referrerData = Object.entries(referrerCounter)
    .map(([source, visits]) => ({ source, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);
  
  return {
    totalVisits: pageVisits.length,
    uniqueUsers,
    uniquePages,
    uniqueSessions,
    topPages,
    visitsByDay,
    referrerData
  };
};

// Compute users from page visits
const computeUsers = (pageVisits: PageVisit[]): User[] => {
  const userMap = new Map<string, User>();
  
  pageVisits.forEach(visit => {
    try {
      const { email, visited_at, session_id } = visit;
      
      if (!email || !visited_at || !session_id) {
        console.warn('Invalid visit data:', visit);
        return; // Skip this record
      }
      
      if (!userMap.has(email)) {
        userMap.set(email, {
          email,
          visitCount: 1,
          lastVisit: visited_at,
          firstVisit: visited_at,
          sessions: [session_id]
        });
      } else {
        const user = userMap.get(email)!;
        user.visitCount++;
        
        // Update first and last visit times - safely compare dates
        try {
          const visitDate = safeParseDate(visited_at);
          const lastVisitDate = safeParseDate(user.lastVisit);
          const firstVisitDate = safeParseDate(user.firstVisit);
          
          if (visitDate) {
            if (lastVisitDate && visitDate.getTime() > lastVisitDate.getTime()) {
              user.lastVisit = visited_at;
            }
            
            if (firstVisitDate && visitDate.getTime() < firstVisitDate.getTime()) {
              user.firstVisit = visited_at;
            }
          }
        } catch (error) {
          console.error(`Error comparing dates for user ${email}:`, error);
        }
      }
      
      // Add session if not already tracked
      if (!userMap.get(email)?.sessions.includes(session_id)) {
        userMap.get(email)?.sessions.push(session_id);
      }
    } catch (error) {
      console.error('Error processing visit:', visit, error);
    }
  });
  
  // Convert map to array and sort by visit count (descending)
  return Array.from(userMap.values())
    .sort((a, b) => b.visitCount - a.visitCount);
};

// Redux slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // Additional reducers can be added here as needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllData.fulfilled, (state, action: PayloadAction<PageVisit[]>) => {
        state.isLoading = false;
        state.pageVisits = action.payload;
        state.summary = computeAnalyticsSummary(action.payload);
        state.users = computeUsers(action.payload);
      })
      .addCase(fetchAllData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch data';
      });
  }
});

// Export selectors
export const selectAllPageVisits = (state: { analytics: AnalyticsState }) => state.analytics.pageVisits;
export const selectAnalyticsSummary = (state: { analytics: AnalyticsState }) => state.analytics.summary;
export const selectAllUsers = (state: { analytics: AnalyticsState }) => state.analytics.users;
export const selectIsLoading = (state: { analytics: AnalyticsState }) => state.analytics.isLoading;
export const selectError = (state: { analytics: AnalyticsState }) => state.analytics.error;

// Selector for getting user by email
export const selectUserByEmail = (state: { analytics: AnalyticsState }, email: string) => 
  state.analytics.users.find(user => user.email === email);

// Selector for getting user's page visits
export const selectUserPageVisits = (state: { analytics: AnalyticsState }, email: string) =>
  state.analytics.pageVisits.filter(visit => visit.email === email);

export default analyticsSlice.reducer;
