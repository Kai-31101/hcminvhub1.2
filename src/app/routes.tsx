import React, { useEffect } from 'react';
import { createHashRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { useApp, UserRole } from './context/AppContext';
import LoginPage from './pages/LoginPage';

// Investor
import ExplorerPage from './pages/investor/ExplorerPage';
import ProjectDetailPage from './pages/investor/ProjectDetailPage';
import IntakeFormPage from './pages/investor/IntakeFormPage';
import ExecutionWorkspacePage from './pages/investor/ExecutionWorkspacePage';
import InvestorSupportPage from './pages/investor/InvestorSupportPage';
import InvestorOpportunityListPage from './pages/investor/OpportunityListPage';
import ServiceCatalogPage from './pages/investor/ServiceCatalogPage';

// Gov Operator
import ProjectManagementPage from './pages/gov/ProjectManagementPage';
import ProjectViewPage from './pages/gov/ProjectViewPage';
import ProjectEditPage from './pages/gov/ProjectEditPage';
import OpportunityListPage from './pages/gov/OpportunityListPage';
import OpportunityDetailPage from './pages/gov/OpportunityDetailPage';
import ExecutionDashboardPage from './pages/gov/ExecutionDashboardPage';

// Agency
import PermitTrackerPage from './pages/agency/PermitTrackerPage';
import IssueManagementPage from './pages/agency/IssueManagementPage';
import MilestoneTrackingPage from './pages/agency/MilestoneTrackingPage';
import ServiceWorkflowPage from './pages/agency/ServiceWorkflowPage';

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
    element: <Navigate to="/investor/explorer" replace />,
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
    element: <ProtectedLayout defaultRole="investor"><InvestorOpportunityListPage /></ProtectedLayout>,
  },
  {
    path: '/investor/services',
    element: <ProtectedLayout defaultRole="investor"><ServiceCatalogPage /></ProtectedLayout>,
  },
  {
    path: '/investor/service-requests',
    element: <Navigate to="/investor/support" replace />,
  },
  {
    path: '/investor/support',
    element: <ProtectedLayout defaultRole="investor"><InvestorSupportPage /></ProtectedLayout>,
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
    element: <ProtectedLayout defaultRole="gov_operator"><ProjectManagementPage /></ProtectedLayout>,
  },
  {
    path: '/gov/opportunities',
    element: <ProtectedLayout defaultRole="gov_operator"><OpportunityListPage /></ProtectedLayout>,
  },
  {
    path: '/gov/opportunities/:id',
    element: <ProtectedLayout defaultRole="gov_operator"><OpportunityDetailPage /></ProtectedLayout>,
  },
  {
    path: '/gov/execution',
    element: <ProtectedLayout defaultRole="gov_operator"><ExecutionDashboardPage /></ProtectedLayout>,
  },

  // Agency routes
  {
    path: '/agency/permits',
    element: <ProtectedLayout defaultRole="agency"><PermitTrackerPage /></ProtectedLayout>,
  },
  {
    path: '/agency/issues',
    element: <ProtectedLayout defaultRole="agency"><IssueManagementPage /></ProtectedLayout>,
  },
  {
    path: '/agency/milestones',
    element: <ProtectedLayout defaultRole="agency"><MilestoneTrackingPage /></ProtectedLayout>,
  },
  {
    path: '/agency/service-workflow',
    element: <ProtectedLayout defaultRole="agency"><ServiceWorkflowPage /></ProtectedLayout>,
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
    element: <Navigate to="/investor/explorer" replace />,
  },
]);
