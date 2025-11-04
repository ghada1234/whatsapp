import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Bell
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/campaigns', icon: MessageSquare, label: 'Campaigns' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>📱 WhatsApp Business</h1>
      </div>
      <nav>
        <ul className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link to={item.path} className={isActive ? 'active' : ''}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/campaigns" element={<Campaigns />} />
            <Route path="/admin/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

