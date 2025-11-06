import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { VisualsProvider } from '../contexts/VisualsContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import MainFeed from './MainFeed';
import Authorization from './Authorization';
import ProfitTable from './ProfitTable';
import CompanyCreate from './CompanyCreate';
import CompanyFeed from './CompanyFeed';
import CompanyCalendar from './CompanyCalendar';
import SharedCalendar from './SharedCalendar';
import Payments from './Payments';
import Visuals from './Visuals';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions?.includes(permission);
  };

  return (
    <VisualsProvider>
      <WebSocketProvider token={token}>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            
            <main className="flex-1 overflow-auto p-6">
              <Routes>
                <Route path="/" element={<Navigate to="/main-feed" replace />} />
                
                {hasPermission('Main Feed') && (
                  <Route path="/main-feed" element={<MainFeed />} />
                )}
                
                {hasPermission('Authorization') && (
                  <Route path="/authorization" element={<Authorization />} />
                )}
                
                {hasPermission('Profit Table') && (
                  <Route path="/profit-table" element={<ProfitTable />} />
                )}
                
                {hasPermission('Company Create') && (
                  <Route path="/company-create" element={<CompanyCreate />} />
                )}
                
                {hasPermission('Company Feed') && (
                  <Route path="/company-feed" element={<CompanyFeed />} />
                )}
                
                {hasPermission('Company Calendar') && (
                  <Route path="/company-calendar" element={<CompanyCalendar />} />
                )}
                
                {hasPermission('Shared Calendar') && (
                  <Route path="/shared-calendar" element={<SharedCalendar />} />
                )}
                
                {hasPermission('Payments') && (
                  <Route path="/payments" element={<Payments />} />
                )}
                
                {hasPermission('Visuals') && (
                  <Route path="/visuals" element={<Visuals />} />
                )}
                
                <Route path="*" element={<Navigate to="/main-feed" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </WebSocketProvider>
    </VisualsProvider>
  );
};

export default Dashboard;
