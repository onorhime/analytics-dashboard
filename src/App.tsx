import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Analytics />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:email" element={<UserDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App
