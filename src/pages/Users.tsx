import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchAllData, 
  selectAllUsers, 
  selectIsLoading, 
  selectError 
} from '../store/slices/analyticsSlice';
import { format } from 'date-fns';
import { safeParseDate } from '../utils/dateHelpers';

const Users = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAllUsers);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  useEffect(() => {
    // Only fetch if we don't already have data
    if (users.length === 0) {
      dispatch(fetchAllData());
    }
  }, [dispatch, users.length]);

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

  return (
    <div className="users-page">
      <h1>All Users</h1>
      
      <div className="users-stats">
        <div className="stats-card">
          <h3>Total Users</h3>
          <div className="stats-value">{users.length}</div>
        </div>
      </div>
      
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Visit Count</th>
              <th>First Visit</th>
              <th>Last Visit</th>
              <th>Sessions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email}>
                <td>{user.email}</td>
                <td>{user.visitCount}</td>
                <td>
                  {(() => {
                    const date = safeParseDate(user.firstVisit);
                    if (!date) {
                      return 'Unknown';
                    }
                    try {
                      return format(date, 'MMM dd, yyyy');
                    } catch (error) {
                      console.error(`Error formatting first visit date for ${user.email}:`, error);
                      return 'Invalid date';
                    }
                  })()}
                </td>
                <td>
                  {(() => {
                    const date = safeParseDate(user.lastVisit);
                    if (!date) {
                      return 'Unknown';
                    }
                    try {
                      return format(date, 'MMM dd, yyyy');
                    } catch (error) {
                      console.error(`Error formatting last visit date for ${user.email}:`, error);
                      return 'Invalid date';
                    }
                  })()}
                </td>
                <td>{user.sessions.length}</td>
                <td>
                  <Link 
                    to={`/users/${encodeURIComponent(user.email)}`}
                    className="action-button"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && !isLoading && (
        <div className="no-data">
          <p>No users found.</p>
          <button onClick={() => dispatch(fetchAllData())}>Refresh Data</button>
        </div>
      )}
    </div>
  );
};

export default Users;
