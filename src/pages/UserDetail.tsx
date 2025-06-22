import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchAllData, 
  selectUserByEmail, 
  selectUserPageVisits,
  selectIsLoading, 
  selectError 
} from '../store/slices/analyticsSlice';
import { format } from 'date-fns';
import { safeParseDate } from '../utils/dateHelpers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import type { PageVisit } from '../types';

const UserDetail = () => {
  const { email = '' } = useParams<{ email: string }>();
  const decodedEmail = decodeURIComponent(email);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const user = useAppSelector(state => selectUserByEmail(state, decodedEmail));
  const userPageVisits = useAppSelector(state => selectUserPageVisits(state, decodedEmail));
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  useEffect(() => {
    // Fetch data if we don't have the user
    if (!user) {
      dispatch(fetchAllData());
    }
  }, [dispatch, user]);

  // Prepare page view data
  const preparePageViewData = (visits: PageVisit[]) => {
    const pageCounter: Record<string, number> = {};
    
    visits.forEach(visit => {
      pageCounter[visit.page_url] = (pageCounter[visit.page_url] || 0) + 1;
    });
    
    return Object.entries(pageCounter)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Prepare referrer data
  const prepareReferrerData = (visits: PageVisit[]) => {
    const referrerCounter: Record<string, number> = {};
    
    visits.forEach(visit => {
      const referrer = visit.referrer || 'Direct';
      referrerCounter[referrer] = (referrerCounter[referrer] || 0) + 1;
    });
    
    return Object.entries(referrerCounter)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={() => dispatch(fetchAllData())}>Retry</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="not-found">
        <h2>User Not Found</h2>
        <p>The user with email {decodedEmail} was not found.</p>
        <button onClick={() => navigate('/users')}>Back to Users List</button>
      </div>
    );
  }

  const pageViewData = preparePageViewData(userPageVisits);
  const referrerData = prepareReferrerData(userPageVisits);

  return (
    <div className="user-detail-page">
      <div className="back-link">
        <button onClick={() => navigate('/users')}>← Back to Users</button>
      </div>
      
      <h1>User Profile: {user.email}</h1>
      
      {/* User Stats Cards */}
      <div className="user-stats">
        <div className="stat-card">
          <h3>Total Visits</h3>
          <div className="stat-value">{user.visitCount}</div>
        </div>
        <div className="stat-card">
          <h3>First Visit</h3>
          <div className="stat-value">
            {(() => {
              const date = safeParseDate(user.firstVisit);
              if (!date) {
                return 'Unknown';
              }
              try {
                return format(date, 'MMM dd, yyyy');
              } catch (error) {
                console.error('Error formatting first visit date:', error);
                return 'Invalid date';
              }
            })()}
          </div>
        </div>
        <div className="stat-card">
          <h3>Last Visit</h3>
          <div className="stat-value">
            {(() => {
              const date = safeParseDate(user.lastVisit);
              if (!date) {
                return 'Unknown';
              }
              try {
                return format(date, 'MMM dd, yyyy');
              } catch (error) {
                console.error('Error formatting last visit date:', error);
                return 'Invalid date';
              }
            })()}
          </div>
        </div>
        <div className="stat-card">
          <h3>Unique Sessions</h3>
          <div className="stat-value">{user.sessions.length}</div>
        </div>
      </div>
      
      <div className="charts-row">
        {/* Pages Visited Chart */}
        <div className="chart-container half-width">
          <h2>Pages Visited</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={pageViewData.slice(0, 5)}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="page" 
                type="category" 
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Referrers Chart */}
        <div className="chart-container half-width">
          <h2>Traffic Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={referrerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="source"
                label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
              >
                {referrerData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, _, props) => [`${value} visits`, props.payload.source]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Visit History Table */}
      <div className="visit-history">
        <h2>Visit History</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Page</th>
                <th>Title</th>
                <th>Visit Time</th>
                <th>Referrer</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {userPageVisits.map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.page_url}</td>
                  <td>{visit.page_title}</td>
                  <td>
                    {(() => {
                      const date = safeParseDate(visit.visited_at);
                      if (!date) {
                        return 'Unknown';
                      }
                      try {
                        return format(date, 'MMM dd, yyyy HH:mm');
                      } catch (error) {
                        console.error(`Error formatting date for visit ${visit.id}:`, error);
                        return 'Invalid date';
                      }
                    })()}
                  </td>
                  <td>{visit.referrer || 'Direct'}</td>
                  <td title={visit.session_id}>{visit.session_id?.substring(0, 10) ?? 'Unknown'}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
