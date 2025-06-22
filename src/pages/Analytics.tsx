import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchAllData, 
  selectAnalyticsSummary, 
  selectIsLoading, 
  selectError,
  selectAllPageVisits
} from '../store/slices/analyticsSlice';
import { format } from 'date-fns';
import { safeParseDate } from '../utils/dateHelpers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const Analytics = () => {
  const dispatch = useAppDispatch();
  const summary = useAppSelector(selectAnalyticsSummary);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const recentVisits = useAppSelector(selectAllPageVisits).slice(0, 10);

  useEffect(() => {
    dispatch(fetchAllData());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
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

  if (!summary) {
    return (
      <div className="no-data">
        <h2>No Data Available</h2>
        <p>There is no analytics data to display.</p>
        <button onClick={() => dispatch(fetchAllData())}>Refresh Data</button>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="analytics-page">
      <h1>Analytics Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Visits</h3>
          <div className="card-value">{summary.totalVisits}</div>
        </div>
        <div className="summary-card">
          <h3>Unique Users</h3>
          <div className="card-value">{summary.uniqueUsers}</div>
        </div>
        <div className="summary-card">
          <h3>Unique Pages</h3>
          <div className="card-value">{summary.uniquePages}</div>
        </div>
        <div className="summary-card">
          <h3>Unique Sessions</h3>
          <div className="card-value">{summary.uniqueSessions}</div>
        </div>
      </div>
      
      {/* Visits Over Time Chart */}
      {summary.visitsByDay && summary.visitsByDay.length > 0 ? (
        <div className="chart-container">
          <h2>Visits Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={summary.visitsByDay}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => {
                  try {
                    return format(new Date(date), 'MM/dd');
                  } catch {
                    return date;
                  }
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => {
                  try {
                    return format(new Date(date), 'MMM dd, yyyy');
                  } catch {
                    return date;
                  }
                }}
              />
              <Legend />
              <Bar dataKey="visits" fill="#8884d8" name="Page Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-container">
          <h2>Visits Over Time</h2>
          <p>No visit data available for the chart.</p>
        </div>
      )}
      
      <div className="charts-row">
        {/* Top Pages Chart */}
        {summary.topPages && summary.topPages.length > 0 ? (
          <div className="chart-container half-width">
            <h2>Top Pages</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={summary.topPages}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="url" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" fill="#82ca9d" name="Page Visits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container half-width">
            <h2>Top Pages</h2>
            <p>No page data available for the chart.</p>
          </div>
        )}
        
        {/* Referrers Chart */}
        {summary.referrerData && summary.referrerData.length > 0 ? (
          <div className="chart-container half-width">
            <h2>Top Referrers</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary.referrerData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="visits"
                  nameKey="source"
                  label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                >
                  {summary.referrerData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, _, props) => [`${value} visits`, props.payload.source]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container half-width">
            <h2>Top Referrers</h2>
            <p>No referrer data available for the chart.</p>
          </div>
        )}
      </div>
      
      {/* Recent Visits Table */}
      <div className="recent-visits">
        <h2>Recent Page Visits</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Page</th>
                <th>Visit Time</th>
                <th>Referrer</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.map((visit) => {
                const date = safeParseDate(visit.visited_at);
                const formattedDate = date ? format(date, 'MMM dd, yyyy HH:mm') : 'Unknown';
                
                return (
                  <tr key={visit.id}>
                    <td>{visit.email}</td>
                    <td title={visit.page_title}>{visit.page_url}</td>
                    <td>{formattedDate}</td>
                    <td>{visit.referrer || 'Direct'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
