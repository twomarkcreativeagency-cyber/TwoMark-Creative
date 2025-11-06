import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

// Import pages
import AnaAkis from './AnaAkis';
import Yetkilendirme from './Yetkilendirme';
import Firmalar from './Firmalar';
import FirmaAkisi from './FirmaAkisi';
import FirmaOdemeleri from './FirmaOdemeleri';
import FirmaTakvimi from './FirmaTakvimi';
import KazancTablosu from './KazancTablosu';
import OrtakTakvim from './OrtakTakvim';
import Gorsellik from './Gorsellik';
import Ayarlar from './Ayarlar';

const Dashboard = () => {
  return (
    <WebSocketProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/ana-akis" replace />} />
              <Route path="/ana-akis" element={<AnaAkis />} />
              <Route path="/yetkilendirme" element={<Yetkilendirme />} />
              <Route path="/firmalar" element={<Firmalar />} />
              <Route path="/firma-akisi" element={<FirmaAkisi />} />
              <Route path="/firma-odemeleri" element={<FirmaOdemeleri />} />
              <Route path="/firma-takvimi" element={<FirmaTakvimi />} />
              <Route path="/kazanc-tablosu" element={<KazancTablosu />} />
              <Route path="/ortak-takvim" element={<OrtakTakvim />} />
              <Route path="/gorsellik" element={<Gorsellik />} />
              <Route path="/ayarlar" element={<Ayarlar />} />
              <Route path="*" element={<Navigate to="/ana-akis" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Dashboard;
