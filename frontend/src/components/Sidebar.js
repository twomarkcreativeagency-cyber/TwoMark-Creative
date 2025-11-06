import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVisuals } from '../contexts/VisualsContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Building2,
  FileText,
  Calendar,
  CalendarDays,
  CreditCard,
  Palette,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  const { visuals } = useVisuals();
  const { t } = useLanguage();
  const location = useLocation();

  const menuItems = [
    { name: t('mainFeed'), path: '/main-feed', icon: LayoutDashboard, permission: 'Main Feed' },
    { name: t('authorization'), path: '/authorization', icon: Users, permission: 'Authorization', adminOnly: true },
    { name: t('profitTable'), path: '/profit-table', icon: DollarSign, permission: 'Profit Table', adminOnly: true },
    { name: t('companyCreate'), path: '/company-create', icon: Building2, permission: 'Company Create', adminOnly: true },
    { name: t('companyFeed'), path: '/company-feed', icon: FileText, permission: 'Company Feed' },
    { name: t('companyCalendar'), path: '/company-calendar', icon: Calendar, permission: 'Company Calendar' },
    { name: t('sharedCalendar'), path: '/shared-calendar', icon: CalendarDays, permission: 'Shared Calendar' },
    { name: t('payments'), path: '/payments', icon: CreditCard, permission: 'Payments' },
    { name: t('visuals'), path: '/visuals', icon: Palette, permission: 'Visuals', adminOnly: true },
  ];

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions?.includes(permission);
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && user?.role !== 'Admin') return false;
    return hasPermission(item.permission);
  });

  const logoStyle = {
    width: visuals.preserve_aspect_ratio ? 'auto' : `${visuals.logo_width}px`,
    height: visuals.preserve_aspect_ratio ? `${visuals.logo_height}px` : `${visuals.logo_height}px`,
    maxWidth: `${visuals.logo_width}px`,
    objectFit: visuals.preserve_aspect_ratio ? 'contain' : 'fill',
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out',
          collapsed ? 'w-20' : 'w-64'
        )}
        data-testid="sidebar"
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between h-20">
          {!collapsed && (
            <div className="flex items-center justify-center w-full">
              <img
                src={process.env.REACT_APP_BACKEND_URL + visuals.logo_url}
                alt="TwoMark Creative"
                style={logoStyle}
                className="object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
            data-testid="sidebar-toggle-button"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`sidebar-${item.path.replace('/', '')}-link`}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 mb-1 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  collapsed && 'justify-center'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <nav className="flex items-center justify-around py-2 px-2">
          {filteredMenuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-slate-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
