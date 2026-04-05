import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Building2, Globe, Shield, TrendingUp, Users } from 'lucide-react';
import { useApp, UserRole } from '../context/AppContext';
import { clearPendingHomeAction, readPendingHomeAction } from '../utils/homeLeadFlow';
import { translateText } from '../utils/localization';

const roles: {
  id: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  homeRoute: string;
}[] = [
  {
    id: 'investor',
    title: 'Investor',
    subtitle: 'Explore & Invest',
    description: 'Discover investment opportunities, submit intake forms, and manage your portfolio.',
    icon: <TrendingUp size={28} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400',
    homeRoute: '/investor/explorer',
  },
  {
    id: 'gov_operator',
    title: 'Project Management Authority',
    subtitle: 'Manage & Govern',
    description: 'Create and manage the projects your agency is responsible for, then coordinate delivery from one project workspace.',
    icon: <Building2 size={28} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
    homeRoute: '/gov/projects',
  },
  {
    id: 'agency',
    title: 'ITPC Portal',
    subtitle: 'View & Coordinate',
    description: 'View the full city project portfolio and work with the same project pages as the Project Management Authority.',
    icon: <Shield size={28} />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200 hover:border-green-400',
    homeRoute: '/agency/projects',
  },
  {
    id: 'admin',
    title: 'System Admin',
    subtitle: 'Configure & Control',
    description: 'Manage user roles, permissions, and agency configurations for the platform.',
    icon: <Users size={28} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
    homeRoute: '/admin/roles',
  },
  {
    id: 'executive',
    title: 'Executive / Leader',
    subtitle: 'Analyze & Decide',
    description: 'View high-level KPIs, investment funnel analytics, and risk monitoring dashboards.',
    icon: <Globe size={28} />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200 hover:border-red-400',
    homeRoute: '/executive/dashboard',
  },
];

function amountFromInvestmentSize(investmentSize: string) {
  switch (investmentSize) {
    case '< $10M':
      return 8;
    case '$10M - $50M':
      return 30;
    case '$50M - $200M':
      return 120;
    case '>$200M':
      return 250;
    default:
      return 25;
  }
}

function dueDate(daysFromNow: number) {
  const next = new Date();
  next.setDate(next.getDate() + daysFromNow);
  return next.toISOString().split('T')[0];
}

export default function LoginPage() {
  const {
    language,
    setLanguage,
    setRole,
    projects,
    setActiveInvestorCompany,
    createOpportunity,
    createIssue,
    addNotification,
  } = useApp();
  const navigate = useNavigate();
  const t = (value: string) => translateText(value, language);

  function handleSelectRole(roleId: UserRole, homeRoute: string) {
    const pendingAction = readPendingHomeAction();
    setRole(roleId);

    if (!pendingAction) {
      navigate(homeRoute);
      return;
    }

    if (pendingAction.type === 'fast_track') {
      const preferredSector = pendingAction.payload.sector.toLowerCase();
      const preferredLocation = pendingAction.payload.locationNeed.toLowerCase();
      const matchedProject =
        projects.find(
          (project) =>
            project.sector.toLowerCase().includes(preferredSector.split(' & ')[0] ?? '') ||
            project.location.toLowerCase().includes(preferredLocation),
        ) ?? projects[0];

      setActiveInvestorCompany(pendingAction.payload.companyName);
      createOpportunity({
        projectId: matchedProject.id,
        projectName: matchedProject.name,
        investorName: pendingAction.payload.contactName,
        investorCompany: pendingAction.payload.companyName,
        investorCountry: pendingAction.payload.country,
        investorType: 'Strategic',
        amount: amountFromInvestmentSize(pendingAction.payload.investmentSize),
        stage: 'new',
        notes: `Homepage fast-track request. Preferred sector: ${pendingAction.payload.sector}. Preferred location: ${pendingAction.payload.locationNeed}. Notes: ${pendingAction.payload.notes || 'No extra note.'}`,
        intakeData: {
          investmentStructure: pendingAction.payload.investmentType,
          timeline: 'Submitted through homepage fast-track entry',
          fundSource: 'To be confirmed after login',
          experience: pendingAction.payload.notes || 'Captured from homepage fast-track form.',
          contactEmail: pendingAction.payload.email,
          contactPhone: pendingAction.payload.phone || 'To be confirmed',
        },
      });

      createIssue({
        projectId: matchedProject.id,
        projectName: matchedProject.name,
        title: `Fast-track matching request - ${pendingAction.payload.companyName}`,
        description: `Investor needs support to identify a suitable project. Preferred sector: ${pendingAction.payload.sector}. Preferred location: ${pendingAction.payload.locationNeed}. Preferred size: ${pendingAction.payload.investmentSize}. Notes: ${pendingAction.payload.notes || 'No extra note.'}`,
        priority: 'high',
        status: 'open',
        assignedTo: 'Investor Relations Desk',
        dueDate: dueDate(2),
        reportedBy: pendingAction.payload.contactName,
        category: 'Support',
      });

      addNotification({
        title: 'Fast-track lead captured',
        message: 'Fast-track request routed to the investor matching queue.',
        type: 'success',
        path: roleId === 'agency' ? `/agency/projects/${matchedProject.id}` : `/gov/projects/${matchedProject.id}`,
      });
    }

    if (pendingAction.type === 'support') {
      const selectedProject = projects.find((project) => project.id === pendingAction.payload.projectId) ?? projects[0];
      setActiveInvestorCompany(pendingAction.payload.companyName);

      createIssue({
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        title: `Investor support desk request - ${pendingAction.payload.topic}`,
        description: pendingAction.payload.message,
        priority: pendingAction.payload.urgent ? 'high' : 'medium',
        status: 'open',
        assignedTo: 'Investor Support Desk',
        dueDate: dueDate(pendingAction.payload.urgent ? 1 : 3),
        reportedBy: pendingAction.payload.contactName,
        category: 'Support',
      });

      addNotification({
        title: 'Support request submitted',
        message: 'Support request routed to the responsible desk.',
        type: pendingAction.payload.urgent ? 'warning' : 'info',
        path: roleId === 'agency' ? '/agency/projects' : '/gov/projects',
      });
    }

    clearPendingHomeAction();
    navigate(`/home?submitted=${pendingAction.type === 'fast_track' ? 'fast-track' : 'support'}`);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#ffffff_32%,#f7fbff_100%)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-8">
        <div />

        <div className="flex items-center overflow-hidden rounded-lg border border-[#d8e2ef] bg-white shadow-sm">
          {(['vi', 'en'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLanguage(option)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                language === option ? 'bg-[#0B2447] text-white' : 'text-[#5f7696] hover:bg-[#f6f9fc]'
              }`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-12 pt-8 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#fdba74] bg-[#fff1e7] px-4 py-1.5 text-sm text-[#c2410c]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#f97316]" />
            Platform v2.4 - 2024
          </div>
          <div className="mb-5 inline-flex items-center rounded-full border border-[#dbe6f2] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7696] shadow-sm">
            {t('Select your portal')}
          </div>
          <h1 className="mb-4 text-[#0B2447]" style={{ fontSize: '2.75rem', fontWeight: 700, lineHeight: 1.15 }}>
            {t('Welcome to the Investment')}
            <br />
            <span className="text-[#f97316]">{t('Management Platform')}</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-[#5f7696]">
            {t('Choose the role-based workspace that matches the way you work with Vietnam\'s B2G investment pipeline.')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleSelectRole(role.id, role.homeRoute)}
              className={`group rounded-2xl border-2 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,53,87,0.12)] focus:outline-none focus:ring-2 focus:ring-[#cbd9ea] ${role.borderColor}`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${role.bgColor} ${role.color}`}>{role.icon}</div>
              <div className="mb-1">
                <div className="text-sm font-semibold text-slate-900">{t(role.title)}</div>
                <div className={`text-xs font-medium ${role.color}`}>{t(role.subtitle)}</div>
              </div>
              <div className={`mt-5 flex items-center gap-1.5 text-xs font-medium ${role.color} transition-all group-hover:gap-2.5`}>
                {t('Enter Portal')}
                <ArrowRight size={13} />
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
