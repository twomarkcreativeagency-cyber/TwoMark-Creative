import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, Users, DollarSign, Building2, FileText, Calendar, CalendarDays, CreditCard, Palette, Settings, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [firmalarExpanded, setFirmalarExpanded] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();

  // Always show sidebar skeleton during load
  const menuItems = [
    { name: t('anaAkis'), path: '/ana-akis', icon: LayoutDashboard, roles: ['Yönetici', 'Editör'] },
    { name: t('yetkilendirme'), path: '/yetkilendirme', icon: Users, roles: ['Yönetici'] },
    { 
      name: t('firmalar'), 
      path: '/firmalar', 
      icon: Building2, 
      roles: ['Yönetici'],
      submenu: [
        { name: t('firmaAkisi'), path: '/firma-akisi', icon: FileText },
        { name: t('firmaOdemeleri'), path: '/firma-odemeleri', icon: CreditCard },
        { name: t('firmaTakvimi'), path: '/firma-takvimi', icon: Calendar },
      ]
    },
    { name: t('kazancTablosu'), path: '/kazanc-tablosu', icon: DollarSign, roles: ['Yönetici'] },
    { name: t('ortakTakvim'), path: '/ortak-takvim', icon: CalendarDays, roles: ['Yönetici', 'Editör'] },
    { name: t('gorsellik'), path: '/gorsellik', icon: Palette, roles: ['Yönetici'] },
    { name: t('ayarlar'), path: '/ayarlar', icon: Settings, roles: ['Yönetici'] },
  ];

  const hasAccess = (roles) => {
    if (!user) return true; // Show during loading
    return roles?.includes(user.role);
  };

  const logoStyle = {
    width: theme.preserve_aspect_ratio ? 'auto' : `${theme.logo_width}px`,
    height: `${theme.logo_height}px`,
    maxWidth: `${theme.logo_width}px`,
    objectFit: theme.preserve_aspect_ratio ? 'contain' : 'cover',
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          collapsed ? 'w-20' : 'w-64'
        )}
        data-testid="sidebar"
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between h-20">
          {!collapsed && (
            <div className="flex items-center justify-center flex-1">
              <img
                src={process.env.REACT_APP_BACKEND_URL + theme.logo_url}
                alt="Logo"
                style={logoStyle}
                className="object-contain"
                onError={(e) => {
                  console.error('[Sidebar] Logo load error');
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuItems.map((item) => {
            if (!hasAccess(item.roles)) return null;

            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.submenu && item.submenu.some(sub => location.pathname === sub.path));
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            return (
              <div key={item.path}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => setFirmalarExpanded(!firmalarExpanded)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 mb-1 rounded-lg transition-all',
                        isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-600 hover:bg-gray-100',
                        collapsed && 'justify-center'
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left text-sm">{item.name}</span>
                          {firmalarExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </>
                      )}
                    </button>
                    {firmalarExpanded && !collapsed && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subIsActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                                subIsActive ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-600 hover:bg-gray-100'
                              )}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 mb-1 rounded-lg transition-all',
                      isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-600 hover:bg-gray-100',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <nav className="flex items-center justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            if (!hasAccess(item.roles)) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
                  isActive ? 'text-accent' : 'text-gray-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
