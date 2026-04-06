import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useApp, UserRole } from '../context/AppContext';
import { translateText } from '../utils/localization';
import {
  LayoutDashboard, Search, FileText, ClipboardList,
  Settings, Users, Building2, Bell, ChevronDown, LogOut, Menu, X,
  FolderOpen, BarChart3, Wrench, Shield, MapPin, Package,
  HardHat, Milestone, Globe, ChevronRight,
  Home, Activity,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const navConfig: Record<UserRole, { label: string; items: NavItem[] }> = {
  investor: {
    label: 'Investor Portal',
    items: [
      { label: 'Project Explorer', path: '/investor/explorer', icon: <Search size={18} /> },
      { label: 'Execution Workspace', path: '/investor/execution', icon: <Activity size={18} /> },
    ],
  },
  gov_operator: {
    label: 'Project Management Authority',
    items: [
      { label: 'Project Management', path: '/gov/projects', icon: <FolderOpen size={18} /> },
    ],
  },
  agency: {
    label: 'ITPC Portal',
    items: [
      { label: 'Project Management', path: '/agency/projects', icon: <FolderOpen size={18} /> },
    ],
  },
  admin: {
    label: 'Admin Console',
    items: [
      { label: 'User & Roles', path: '/admin/roles', icon: <Users size={18} /> },
      { label: 'Agency Management', path: '/admin/agencies', icon: <Building2 size={18} /> },
    ],
  },
  executive: {
    label: 'Executive View',
    items: [
      { label: 'Executive Dashboard', path: '/executive/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'Analytics', path: '/executive/analytics', icon: <BarChart3 size={18} /> },
      { label: 'Risk Monitor', path: '/executive/risks', icon: <Shield size={18} /> },
    ],
  },
};

const roleInfo: Record<UserRole, { name: string; org: string; avatar: string; color: string }> = {
  investor: { name: 'Kim Jae-won', org: 'Korea Infrastructure Partners', avatar: 'KJ', color: 'bg-amber-500' },
  gov_operator: { name: 'Nguyen Van Anh', org: 'Ministry of Planning & Investment', avatar: 'NA', color: 'bg-blue-600' },
  agency: { name: 'Pham Gia Huy', org: 'Department of Planning and Investment', avatar: 'PG', color: 'bg-green-600' },
  admin: { name: 'System Admin', org: 'Ministry of Planning & Investment', avatar: 'SA', color: 'bg-purple-600' },
  executive: { name: 'Hoang Minh Duc', org: 'Ministry of Planning & Investment', avatar: 'HD', color: 'bg-red-600' },
};

const brandSubtitle: Record<UserRole, string> = {
  investor: 'Investor Portal',
  gov_operator: 'Project Management Authority',
  agency: 'ITPC Portal',
  admin: 'Admin Console',
  executive: 'Executive View',
};

const roleHomeRoute: Record<UserRole, string> = {
  investor: '/investor/explorer',
  gov_operator: '/gov/projects',
  agency: '/agency/projects',
  admin: '/admin/roles',
  executive: '/executive/dashboard',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { role, setRole, language, setLanguage, notifications, unreadCount, markNotificationRead, resetDemoData, projects, agencies, activeAgency, activeUserId, setActiveUserId, setActiveAgencyId, projectJobs, users } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEnvironmentMenu, setShowEnvironmentMenu] = useState(false);

  if (!role) return null;

  const nav = navConfig[role];
  const t = (value: string) => translateText(value, language);
  const primaryProjectAssignmentKeys = Array.from(
    new Set(
      projects
        .map((project) => {
          const projectJobItems = projectJobs.filter((job) => job.projectId === project.id);
          const primaryJob = projectJobItems.find((job) => job.status !== 'complete') ?? projectJobItems[0];
          return primaryJob ? `${primaryJob.agencyId}:${primaryJob.userId}` : null;
        })
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const availableUserOptions = role === 'gov_operator'
    ? primaryProjectAssignmentKeys
        .map((assignmentKey) => {
          const [agencyId, userId] = assignmentKey.split(':');
          const agency = agencies.find((item) => item.id === agencyId || item.peopleInCharge?.some((person) => person.id === userId));
          const person = agency?.peopleInCharge?.find((item) => item.id === userId);
          const fallbackUser = users.find((item) => item.id === userId);
          const displayName = person?.name ?? fallbackUser?.name ?? userId;
          const organization = agency?.name ?? fallbackUser?.organization ?? '';

          return {
            id: assignmentKey,
            name: displayName,
            org: organization,
            avatar: displayName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join(''),
            color: 'bg-blue-600',
          };
        })
        .filter((option) => option.org || option.name)
    : role === 'agency' && activeAgency
      ? (activeAgency.peopleInCharge ?? []).map((person) => ({
          id: `${activeAgency.id}:${person.id}`,
          name: person.name,
          org: activeAgency.name,
          avatar: person.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join(''),
          color: 'bg-green-600',
        }))
      : [];
  const selectedRoleUser = availableUserOptions.find((item) => item.id === activeUserId);
  const user = selectedRoleUser ?? roleInfo[role];

  const handleLogout = () => {
    setRole(null);
    navigate('/login');
  };

  const handleGoHome = () => {
    setSidebarOpen(false);
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowEnvironmentMenu(false);
    navigate('/');
  };

  const handleSwitchEnvironment = (nextRole: UserRole) => {
    setRole(nextRole);
    setSidebarOpen(false);
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowEnvironmentMenu(false);
    navigate(roleHomeRoute[nextRole]);
  };

  const handleNotificationClick = (id: string, path?: string) => {
    markNotificationRead(id);
    setShowNotifications(false);
    if (path) {
      navigate(path);
    }
  };

  const handleSwitchAgency = (agencyId: string) => {
    setActiveAgencyId(agencyId);
    setShowUserMenu(false);
  };

  const handleSwitchUser = (userId: string) => {
    setActiveUserId(userId);
    setShowUserMenu(false);
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex h-full flex-col justify-between bg-[#ECEEF0] ${mobile ? 'w-full' : 'w-64'}`}>
      <div className="flex flex-col gap-1 px-6 pb-0 pt-6">
        <div className="pb-6">
          <button
            type="button"
            onClick={handleGoHome}
            className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center bg-[#E0E3E5] text-[#455F87]">
              <Globe size={20} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[18px] font-bold leading-7 text-[#1E3A5F]">{t(nav.label)}</div>
              <div className="truncate text-[10px] uppercase tracking-[0.05em] text-[#455F87]/70">
                {t(brandSubtitle[role])}
              </div>
            </div>
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.items.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex h-[45px] items-center gap-3 px-4 transition-colors ${
                  isActive
                    ? 'border-l-4 border-[#9D4300] bg-white font-bold text-[#9D4300] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-[#455F87] hover:bg-white/70'
                }`}
              >
                <span className={isActive ? 'text-[#9D4300]' : 'text-[#455F87]'}>
                  {item.icon}
                </span>
                <span className="truncate text-[14px] leading-[21px]">{t(item.label)}</span>
                {item.badge && (
                  <span className="ml-auto min-w-[18px] bg-[#9D4300] px-1.5 py-0.5 text-center text-[11px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 flex-1" />

      <div className="border-t border-[rgba(224,192,177,0.1)] px-6 py-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 w-full items-center justify-center gap-2 bg-[linear-gradient(39.81deg,#9D4300_0%,#F97316_100%)] px-4 text-[14px] font-bold text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
        >
          <LogOut size={12} />
          {t('Switch Role')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-[#ECEEF0]">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#ECEEF0] flex flex-col">
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="text-[#455F87]">
                <X size={20} />
              </button>
            </div>
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="relative flex h-16 flex-shrink-0 items-center justify-between gap-6 border-b border-[rgba(224,192,177,0.12)] bg-[#F7F9FB] px-4 lg:px-8 z-[80]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#455F87] transition-colors hover:text-[#1E3A5F] lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-8">
            <div className="min-w-0 shrink-0">
              <h1 className="truncate text-[20px] font-bold uppercase tracking-[-0.5px] text-[#1E3A5F]">
                {t(nav.label)}
              </h1>
            </div>

            <nav className="hidden items-center gap-6 lg:flex">
              {nav.items.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-[14px] font-medium leading-5 transition-colors ${
                      isActive ? 'text-[#9D4300]' : 'text-[#455F87] hover:text-[#1E3A5F]'
                    }`}
                  >
                    {t(item.label)}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleGoHome}
                className="text-[14px] font-medium leading-5 text-[#455F87] transition-colors hover:text-[#1E3A5F]"
              >
                {t('Home')}
              </button>
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden h-9 items-center border border-[rgba(69,95,135,0.16)] bg-white p-1 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] sm:inline-flex">
              {(['vi', 'en'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  className={`inline-flex h-7 min-w-[44px] items-center justify-center px-3 text-[13px] font-semibold leading-5 transition-colors ${
                    language === option
                      ? 'bg-[linear-gradient(22.81deg,#9D4300_0%,#F97316_100%)] text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]'
                      : 'text-[#455F87] hover:bg-[#eef2f6]'
                  }`}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEnvironmentMenu(!showEnvironmentMenu);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="flex h-9 items-center gap-2 rounded-[4px] bg-[linear-gradient(22.81deg,#9D4300_0%,#F97316_100%)] px-6 text-[14px] font-bold text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition-opacity hover:opacity-95"
              >
                <Wrench size={14} />
                <span className="hidden md:inline">{t('Module')}</span>
                <ChevronDown size={14} className="text-white/80" />
              </button>

              {showEnvironmentMenu && (
                <div
                  className="absolute right-0 top-full z-[70] mt-2 w-64 border border-gray-200 bg-white py-2 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Switch Module / Environment
                  </div>
                  {(Object.keys(navConfig) as UserRole[]).map((roleKey) => (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => handleSwitchEnvironment(roleKey)}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                        role === roleKey ? 'bg-blue-50 text-[#0B2447]' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{t(navConfig[roleKey].label)}</span>
                      {role === roleKey && <span className="text-xs font-semibold text-blue-700">Current</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                className="relative p-2 text-[#455F87] transition-colors hover:text-[#1E3A5F]"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="absolute right-0 top-full z-[70] mt-2 w-80 border border-gray-200 bg-white shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">{t('Notifications')}</span>
                    <span className="text-xs text-blue-600 cursor-pointer">{unreadCount} {t('unread')}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id, n.path)}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            n.type === 'success' ? 'bg-green-500' :
                            n.type === 'warning' ? 'bg-amber-500' :
                            n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800">{t(n.title)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{t(n.message)}</div>
                            <div className="text-xs text-gray-400 mt-1">{t(n.time)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowEnvironmentMenu(false); }}
                className="flex items-center gap-2 p-1.5 transition-colors hover:bg-white/70"
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${user.color} text-xs font-semibold text-white`}>
                  {user.avatar}
                </div>
                <div className="hidden sm:block max-w-[180px] text-left">
                  <div className="truncate text-sm font-medium text-[#1E3A5F]">{user.name}</div>
                  <div className="truncate text-xs text-[#455F87]">{t(user.org)}</div>
                </div>
                <ChevronDown size={14} className="text-[#455F87]" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-full z-[70] mt-2 w-72 border border-gray-200 bg-white py-1 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-800">{user.name}</div>
                    <div className="text-xs text-gray-500">{t(user.org)}</div>
                  </div>
                  {availableUserOptions.length > 0 && (
                    <div className="border-b border-gray-100 py-1">
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {t('Switch User')}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {availableUserOptions.map((option) => {
                          const isCurrentUser = option.id === activeUserId;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleSwitchUser(option.id)}
                              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                isCurrentUser ? 'bg-blue-50 text-[#0B2447]' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium">{option.name}</div>
                                <div className="truncate text-xs text-gray-500">{option.org}</div>
                              </div>
                              {isCurrentUser && <span className="shrink-0 text-xs font-semibold text-blue-700">{t('Current')}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {role === 'agency' && (
                    <div className="border-b border-gray-100 py-1">
                      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {t('Switch Agency')}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {agencies.filter((agency) => agency.status === 'active').map((agency) => {
                          const isCurrentAgency = agency.id === activeAgency?.id;
                          return (
                            <button
                              key={agency.id}
                              type="button"
                              onClick={() => handleSwitchAgency(agency.id)}
                              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                isCurrentAgency ? 'bg-blue-50 text-[#0B2447]' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium">{agency.name}</div>
                                <div className="truncate text-xs text-gray-500">{agency.contactPerson}</div>
                              </div>
                              {isCurrentAgency && <span className="shrink-0 text-xs font-semibold text-blue-700">{t('Current')}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      resetDemoData();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#0B2447] transition-colors"
                  >
                    <Settings size={15} />
                    {t('Reset Demo Data')}
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors">
                    <LogOut size={15} />
                    {t('Switch Role / Logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu || showEnvironmentMenu) && (
        <div className="fixed inset-0 z-[60]" onClick={() => { setShowNotifications(false); setShowUserMenu(false); setShowEnvironmentMenu(false); }} />
      )}
    </div>
  );
}
