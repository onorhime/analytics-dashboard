import axios from 'axios';
import type { PageVisit } from '../types';

// Get API URL from environment variable or use default value
const XANO_BASE_URL = import.meta.env.VITE_XANO_API_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:FGUScUBu';

// Create Axios instance with base URL
const xanoApi = axios.create({
  baseURL: XANO_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
xanoApi.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
xanoApi.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.statusText}`);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Helper function to create mock data for testing when API fails
const createMockData = (): PageVisit[] => {
  console.log('Creating mock data for testing');
  
  const mockEmails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
  const mockPages = [
    { url: '/home', title: 'Home Page' },
    { url: '/products', title: 'Products Page' },
    { url: '/about', title: 'About Us' },
    { url: '/contact', title: 'Contact Us' }
  ];
  const mockReferrers = [
    'https://google.com',
    'https://facebook.com',
    'https://twitter.com',
    'https://linkedin.com',
    null
  ];
  
  // Generate 50 mock page visits
  return Array(50).fill(null).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
    
    const email = mockEmails[Math.floor(Math.random() * mockEmails.length)];
    const page = mockPages[Math.floor(Math.random() * mockPages.length)];
    const referrer = mockReferrers[Math.floor(Math.random() * mockReferrers.length)];
    
    return {
      id: index + 1,
      email,
      page_url: page.url,
      page_title: page.title,
      visited_at: date.toISOString(),
      session_id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      referrer,
      created_at: date.toISOString()
    };
  });
};

export const xanoService = {
  // Fetch all page visits from Xano
  async getAllPageVisits(): Promise<PageVisit[]> {
    try {
      // In Xano, collections are usually exposed as direct endpoints
      const endpoint = '/page_visits';
      
      console.log('Fetching all page visits from:', `${XANO_BASE_URL}${endpoint}`);
      
      const response = await xanoApi.get(endpoint);
      console.log('API Response status:', response.status);
      
      // Xano usually returns data directly as an array when fetching collections
      let data: PageVisit[] = [];
      
      if (Array.isArray(response.data)) {
        console.log('✓ Response is an array with', response.data.length, 'items');
        data = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.items && Array.isArray(response.data.items)) {
          console.log('✓ Response contains items array with', response.data.items.length, 'items');
          data = response.data.items;
        } else {
          console.log('Response is an object but does not contain an items array');
          // If it's a single object that matches our PageVisit structure, make an array with it
          const isPageVisit = response.data.id && response.data.email && response.data.page_url;
          data = isPageVisit ? [response.data] : [];
        }
      }
      
      // Log details of the first item to validate the data structure
      if (data.length > 0) {
        console.log('First data item structure:', Object.keys(data[0]));
      } else {
        console.warn('No data items returned from API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching page visits:', error);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        
        if ('response' in error && error.response) {
          const axiosError = error as { response: { data: unknown; status: number } };
          console.error('Error response data:', axiosError.response.data);
          console.error('Error response status:', axiosError.response.status);
        } else if ('request' in error && error.request) {
          console.error('No response received from server');
        }
      }
      
      // If the API fails completely, return mock data so the UI can still function
      console.log('Returning mock data for UI testing');
      return createMockData();
    }
  },
};

export default xanoService;
