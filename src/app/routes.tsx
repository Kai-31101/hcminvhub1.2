import React, { useEffect } from 'react';
import { createHashRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { useApp, UserRole } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

// Investor
import ExplorerPage from './pages/investor/ExplorerPage';
import ProjectDetailPage from './pages/investor/ProjectDetailPage';
import IntakeFormPage from './pages/investor/IntakeFormPage';
import InvestorExecutionListPage from './pages/investor/InvestorExecutionListPage';
import ExecutionWorkspacePage from './pages/investor/ExecutionWorkspacePage';

// Gov Operator
import ProjectManagementPage from './pages/gov/ProjectManagementPage';
import ProjectViewPage from './pages/gov/ProjectViewPage';
import ProjectEditPage from './pages/gov/ProjectEditPage';

// Admin
import AdminPage from './pages/admin/AdminPage';

// Executive
import ExecutiveDashboardPage from './pages/executive/ExecutiveDashboardPage';
import ExecutiveAnalyticsPage from './pages/executive/ExecutiveAnalyticsPage';
import ExecutiveRiskMonitorPage from './pages/executive/ExecutiveRiskMonitorPage';

function ProtectedLayout({ children, defaultRole }: { children: React.ReactNode; defaultRole: UserRole }) {
  const { role, setRole } = useApp();

  useEffect(() => {
    if (role !== defaultRole) {
      setRole(defaultRole);
    }
  }, [defaultRole, role, setRole]);

  return <Layout>{children}</Layout>;
}

export const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Investor routes
  {
    path: '/investor/explorer',
    element: <ProtectedLayout defaultRole="investor"><ExplorerPage /></ProtectedLayout>,
  },
  {
    path: '/investor/project/:id',
    element: <ProtectedLayout defaultRole="investor"><ProjectDetailPage /></ProtectedLayout>,
  },
  {
    path: '/investor/intake/:projectId',
    element: <ProtectedLayout defaultRole="investor"><IntakeFormPage /></ProtectedLayout>,
  },
  {
    path: '/investor/execution',
    element: <ProtectedLayout defaultRole="investor"><InvestorExecutionListPage /></ProtectedLayout>,
  },
  {
    path: '/investor/execution/:id',
    element: <ProtectedLayout defaultRole="investor"><ExecutionWorkspacePage /></ProtectedLayout>,
  },
  {
    path: '/investor/executionz',
    element: <Navigate to="/investor/execution" replace />,
  },
  {
    path: '/investor/watchlist',
    element: <Navigate to="/investor/explorer" replace />,
  },
  {
    path: '/investor/opportunities',
    element: <Navigate to="/investor/execution" replace />,
  },
  {
    path: '/investor/services',
    element: <Navigate to="/investor/execution" replace />,
  },
  {
    path: '/investor/service-requests',
    element: <Navigate to="/investor/execution" replace />,
  },

  // Gov Operator routes
  {
    path: '/gov/projects',
    element: <ProtectedLayout defaultRole="gov_operator"><ProjectManagementPage /></ProtectedLayout>,
  },
  {
    path: '/gov/projects/:id',
    element: <ProtectedLayout defaultRole="gov_operator"><ProjectViewPage /></ProtectedLayout>,
  },
  {
    path: '/gov/projects/:id/edit',
    element: <ProtectedLayout defaultRole="gov_operator"><ProjectEditPage /></ProtectedLayout>,
  },
  {
    path: '/gov/data-quality',
    element: <Navigate to="/gov/projects" replace />,
  },
  {
    path: '/gov/opportunities',
    element: <Navigate to="/gov/projects" replace />,
  },
  {
    path: '/gov/opportunities/:id',
    element: <Navigate to="/gov/projects" replace />,
  },
  {
    path: '/gov/execution',
    element: <Navigate to="/gov/projects" replace />,
  },

  // Agency routes
  {
    path: '/agency/projects',
    element: <ProtectedLayout defaultRole="agency"><ProjectManagementPage /></ProtectedLayout>,
  },
  {
    path: '/agency/request-management',
    element: <ProtectedLayout defaultRole="agency"><ProjectManagementPage /></ProtectedLayout>,
  },
  {
    path: '/agency/projects/:id',
    element: <ProtectedLayout defaultRole="agency"><ProjectViewPage /></ProtectedLayout>,
  },
  {
    path: '/agency/projects/:id/edit',
    element: <ProtectedLayout defaultRole="agency"><ProjectEditPage /></ProtectedLayout>,
  },
  {
    path: '/agency/data-quality',
    element: <Navigate to="/agency/projects" replace />,
  },
  {
    path: '/agency/opportunities',
    element: <Navigate to="/agency/projects" replace />,
  },
  {
    path: '/agency/opportunities/:id',
    element: <Navigate to="/agency/projects" replace />,
  },
  {
    path: '/agency/execution',
    element: <Navigate to="/agency/projects" replace />,
  },
  {
    path: '/agency/permits',
    element: <Navigate to="/agency/projects" replace />,
  },
  {
    path: '/agency/issues',
    element: <Navigate to="/agency/projects" replace />,
  },
  {
    path: '/agency/milestones',
    element: <Navigate to="/agency/projects" replace />,
  },
  {
    path: '/agency/service-workflow',
    element: <Navigate to="/agency/projects" replace />,
  },

  // Admin routes
  {
    path: '/admin/roles',
    element: <ProtectedLayout defaultRole="admin"><AdminPage /></ProtectedLayout>,
  },
  {
    path: '/admin/agencies',
    element: <ProtectedLayout defaultRole="admin"><AdminPage /></ProtectedLayout>,
  },

  // Executive routes
  {
    path: '/executive/dashboard',
    element: <ProtectedLayout defaultRole="executive"><ExecutiveDashboardPage /></ProtectedLayout>,
  },
  {
    path: '/executive/analytics',
    element: <ProtectedLayout defaultRole="executive"><ExecutiveAnalyticsPage /></ProtectedLayout>,
  },
  {
    path: '/executive/risks',
    element: <ProtectedLayout defaultRole="executive"><ExecutiveRiskMonitorPage /></ProtectedLayout>,
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]);
