import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">Correct Toes Analytics</div>
        <nav className="main-nav">
          <NavLink 
            to="/" 
            className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
            end
          >
            Analytics
          </NavLink>
          <NavLink 
            to="/users" 
            className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
          >
            Users
          </NavLink>
        </nav>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} Correct Toes Analytics</p>
      </footer>
    </div>
  );
};

export default Layout;
