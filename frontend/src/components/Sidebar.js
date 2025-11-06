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

  // Define hasAccess first - before it's used in getMenuItems
  const hasAccess = (roles) => {
    if (!user) return true; // Show during loading
    return roles?.includes(user.role);
  };

  // Define menu items with role-based submenu filtering
  const getMenuItems = () => {
    const items = [
      { name: t('anaAkis'), path: '/ana-akis', icon: LayoutDashboard, roles: ['Yönetici', 'Editör'] },
      { name: t('yetkilendirme'), path: '/yetkilendirme', icon: Users, roles: ['Yönetici'] },
      { 
        name: t('firmalar'), 
        path: '/firmalar', 
        icon: Building2, 
        roles: ['Yönetici', 'Editör'],
        submenu: [
          { name: t('firmaAkisi'), path: '/firma-akisi', icon: FileText, roles: ['Yönetici', 'Editör'] },
          { name: t('firmaOdemeleri'), path: '/firma-odemeleri', icon: CreditCard, roles: ['Yönetici'] }, // Admin only
          { name: t('firmaTakvimi'), path: '/firma-takvimi', icon: Calendar, roles: ['Yönetici', 'Editör'] },
        ]
      },
      { name: t('kazancTablosu'), path: '/kazanc-tablosu', icon: DollarSign, roles: ['Yönetici'] },
      { name: t('ortakTakvim'), path: '/ortak-takvim', icon: CalendarDays, roles: ['Yönetici', 'Editör'] },
      { name: t('gorsellik'), path: '/gorsellik', icon: Palette, roles: ['Yönetici'] },
      { name: t('ayarlar'), path: '/ayarlar', icon: Settings, roles: ['Yönetici', 'Editör'] },
    ];

    // Filter submenu items based on user role
    return items.map(item => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(subItem => hasAccess(subItem.roles))
        };
      }
      return item;
    });
  };

  const menuItems = getMenuItems();

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
                    {/* Main item with link + dropdown toggle */}
                    <div className={cn(
                      'flex items-center gap-1',
                      collapsed && 'justify-center'
                    )}>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          'hover:bg-gray-100 text-gray-700',
                          location.pathname === item.path && 'bg-accent/10 text-accent',
                          collapsed && 'justify-center'
                        )}
                      >
                        <Icon className={cn('w-5 h-5 shrink-0', location.pathname === item.path && 'text-accent')} />
                        {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
                      </Link>
                      {!collapsed && (
                        <button
                          onClick={() => setFirmalarExpanded(!firmalarExpanded)}
                          className={cn(
                            'p-2 rounded-lg hover:bg-gray-100 transition-all',
                            'text-gray-600'
                          )}
                          aria-label="Toggle submenu"
                        >
                          {firmalarExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {firmalarExpanded && !collapsed && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                'hover:bg-gray-100 text-gray-600',
                                isSubActive && 'bg-accent/10 text-accent'
                              )}
                            >
                              <SubIcon className={cn('w-4 h-4', isSubActive && 'text-accent')} />
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
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      'hover:bg-gray-100 text-gray-700',
                      isActive && 'bg-accent/10 text-accent',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-accent')} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar - Simplified version */}
      <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-50 hidden" id="mobile-sidebar-overlay">
        <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="p-4 border-b border-gray-200">
            <img
              src={process.env.REACT_APP_BACKEND_URL + theme.logo_url}
              alt="Logo"
              style={logoStyle}
              className="object-contain"
            />
          </div>
          <nav className="py-4 px-2">
            {menuItems.map((item) => {
              if (!hasAccess(item.roles)) return null;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
