import React, { useEffect } from 'react';
import { createHashRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { useApp, UserRole } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PublicContentPage from './pages/PublicContentPage';

// Investor
import ExplorerPage from './pages/investor/ExplorerPage';
import ProjectDetailPage from './pages/investor/ProjectDetailPage';
import ChairmanReportPage from './pages/investor/ChairmanReportPage';
import IntakeFormPage from './pages/investor/IntakeFormPage';
import InvestorExecutionListPage from './pages/investor/InvestorExecutionListPage';
import InvestorJoinedExecutionPage from './pages/investor/InvestorJoinedExecutionPage';
import ExecutionWorkspacePage from './pages/investor/ExecutionWorkspacePage';

// Gov Operator
import ProjectManagementPage from './pages/gov/ProjectManagementPage';
import ProjectViewPage from './pages/gov/ProjectViewPage';
import ProjectEditPage from './pages/gov/ProjectEditPage';
import ItpcIntakePage from './pages/agency/ItpcIntakePage';
import AgencyLitePage from './pages/agency/AgencyLitePage';
import ItpcLitePortalPage from './pages/itpc-lite/ItpcLitePortalPage';

// Admin
import AdminPage from './pages/admin/AdminPage';

// Executive
import ExecutiveDashboardPage from './pages/executive/ExecutiveDashboardPage';
import UbndOversightPage from './pages/executive/UbndOversightPage';
import ExecutiveSlaMonitoringPage from './pages/executive/ExecutiveSlaMonitoringPage';
import ExecutiveDirectReportPage from './pages/executive/ExecutiveDirectReportPage';

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
  {
    path: '/faqs',
    element: <PublicContentPage />,
  },
  {
    path: '/faq',
    element: <Navigate to="/faqs" replace />,
  },
  {
    path: '/privacy-policy',
    element: <PublicContentPage />,
  },
  {
    path: '/privacy',
    element: <Navigate to="/privacy-policy" replace />,
  },
  {
    path: '/terms-of-service',
    element: <PublicContentPage />,
  },
  {
    path: '/terms',
    element: <Navigate to="/terms-of-service" replace />,
  },
  {
    path: '/support-policy',
    element: <PublicContentPage />,
  },
  {
    path: '/support',
    element: <Navigate to="/support-policy" replace />,
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
    path: '/investor/report-chairman/:projectId',
    element: <ProtectedLayout defaultRole="investor"><ChairmanReportPage /></ProtectedLayout>,
  },
  {
    path: '/investor/intake/:projectId',
    element: <ProtectedLayout defaultRole="investor"><IntakeFormPage /></ProtectedLayout>,
  },
  {
    path: '/investor/execution',
    element: <ProtectedLayout defaultRole="investor"><InvestorJoinedExecutionPage /></ProtectedLayout>,
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
    element: <ProtectedLayout defaultRole="investor"><InvestorExecutionListPage /></ProtectedLayout>,
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
    path: '/gov/projects/new/edit',
    element: <ProtectedLayout defaultRole="gov_operator"><ProjectEditPage /></ProtectedLayout>,
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
    path: '/agency/intake',
    element: <ProtectedLayout defaultRole="agency"><ItpcIntakePage /></ProtectedLayout>,
  },
  {
    path: '/agency/lite',
    element: <ProtectedLayout defaultRole="agency"><AgencyLitePage /></ProtectedLayout>,
  },
  {
    path: '/agency/projects/:id',
    element: <ProtectedLayout defaultRole="agency"><ProjectViewPage /></ProtectedLayout>,
  },
  {
    path: '/agency/projects/new/edit',
    element: <ProtectedLayout defaultRole="agency"><ProjectEditPage /></ProtectedLayout>,
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

  // ITPC Lite routes
  {
    path: '/itpc-lite',
    element: <Navigate to="/itpc-lite/interest" replace />,
  },
  {
    path: '/itpc-lite/intake',
    element: <Navigate to="/itpc-lite/interest" replace />,
  },
  {
    path: '/itpc-lite/interest',
    element: <ProtectedLayout defaultRole="itpc_lite"><ItpcLitePortalPage tab="interest" /></ProtectedLayout>,
  },
  {
    path: '/itpc-lite/request-meeting',
    element: <ProtectedLayout defaultRole="itpc_lite"><ItpcLitePortalPage tab="meeting" /></ProtectedLayout>,
  },
  {
    path: '/itpc-lite/question',
    element: <ProtectedLayout defaultRole="itpc_lite"><ItpcLitePortalPage tab="question" /></ProtectedLayout>,
  },
  {
    path: '/itpc-lite/support',
    element: <ProtectedLayout defaultRole="itpc_lite"><ItpcLitePortalPage tab="support" /></ProtectedLayout>,
  },

  // Admin routes
  {
    path: '/admin',
    element: <ProtectedLayout defaultRole="admin"><AdminPage /></ProtectedLayout>,
  },

  // Executive routes
  {
    path: '/executive/dashboard',
    element: <ProtectedLayout defaultRole="executive"><ExecutiveDashboardPage /></ProtectedLayout>,
  },
  {
    path: '/executive/oversight',
    element: <ProtectedLayout defaultRole="executive"><UbndOversightPage /></ProtectedLayout>,
  },
  {
    path: '/executive/sla-monitoring',
    element: <ProtectedLayout defaultRole="executive"><ExecutiveSlaMonitoringPage /></ProtectedLayout>,
  },
  {
    path: '/executive/direct-report',
    element: <ProtectedLayout defaultRole="executive"><ExecutiveDirectReportPage /></ProtectedLayout>,
  },
  {
    path: '/executive/analytics',
    element: <Navigate to="/executive/dashboard" replace />,
  },
  {
    path: '/executive/risks',
    element: <Navigate to="/executive/sla-monitoring" replace />,
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]);
