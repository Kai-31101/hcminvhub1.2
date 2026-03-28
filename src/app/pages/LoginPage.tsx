import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Building2, CheckCircle, Globe, Shield, TrendingUp, Users } from 'lucide-react';
import { useApp, UserRole } from '../context/AppContext';
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
  features: string[];
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
    features: ['Project Explorer', 'Intake Submission', 'Execution Workspace', 'B2G Services'],
  },
  {
    id: 'gov_operator',
    title: 'Government Operator',
    subtitle: 'Manage & Govern',
    description: 'Create and publish projects, manage investment pipeline, and oversee execution.',
    icon: <Building2 size={28} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
    homeRoute: '/gov/projects',
    features: ['Project Management', 'Opportunity Pipeline', 'Approved Deals', 'Execution Monitor'],
  },
  {
    id: 'agency',
    title: 'Agency User',
    subtitle: 'Process & Execute',
    description: 'Handle permits, resolve issues, track milestones, and process service requests.',
    icon: <Shield size={28} />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200 hover:border-green-400',
    homeRoute: '/agency/permits',
    features: ['Permit Tracker', 'Issue Management', 'Milestone Tracking', 'Service Workflow'],
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
    features: ['User & Roles', 'Agency Management', 'Support', 'Data Quality'],
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
    features: ['Executive Dashboard', 'Analytics', 'Risk Monitor', 'Investment Pipeline'],
  },
];

const stats = [
  { label: 'Active Projects', value: '4' },
  { label: 'Investment Pipeline', value: '$455M' },
  { label: 'Approved Deals', value: '12' },
  { label: 'In Execution', value: '2' },
];

export default function LoginPage() {
  const { language, setLanguage, setRole } = useApp();
  const navigate = useNavigate();
  const t = (value: string) => translateText(value, language);

  function handleSelectRole(roleId: UserRole, homeRoute: string) {
    setRole(roleId);
    navigate(homeRoute);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1b4f8a_0%,#0f3460_35%,#0b2447_100%)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400">
            <Globe size={22} className="text-[#0B2447]" />
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight text-white">{t('Vietnam Investment Agency')}</div>
            <div className="text-xs text-blue-300">{t('B2G Investment Platform')}</div>
          </div>
        </div>

        <div className="flex items-center overflow-hidden rounded-lg border border-white/20">
          {(['vi', 'en'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLanguage(option)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                language === option ? 'bg-white text-[#0B2447]' : 'text-white hover:bg-white/10'
              }`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-12 pt-8 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/15 px-4 py-1.5 text-sm text-amber-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Platform v2.4 - 2024
          </div>
          <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
            {t('Select your portal')}
          </div>
          <h1 className="mb-4 text-white" style={{ fontSize: '2.75rem', fontWeight: 700, lineHeight: 1.15 }}>
            {t('Welcome to the Investment')}
            <br />
            <span className="text-amber-400">{t('Management Platform')}</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-blue-200">
            {t('Choose the role-based workspace that matches the way you work with Vietnam\'s B2G investment pipeline.')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleSelectRole(role.id, role.homeRoute)}
              className={`group rounded-2xl border-2 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 ${role.borderColor}`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${role.bgColor} ${role.color}`}>{role.icon}</div>
              <div className="mb-1">
                <div className="text-sm font-semibold text-slate-900">{t(role.title)}</div>
                <div className={`text-xs font-medium ${role.color}`}>{t(role.subtitle)}</div>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-slate-500">{t(role.description)}</p>
              <div className="mb-5 space-y-1.5">
                {role.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle size={11} className={`${role.color} flex-shrink-0`} />
                    {t(feature)}
                  </div>
                ))}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${role.color} transition-all group-hover:gap-2.5`}>
                {t('Enter Portal')}
                <ArrowRight size={13} />
              </div>
            </button>
          ))}
        </div>

        <section className="mt-12">
          <div className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
            {t('Operational at a glance')}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-sm">
                <div className="text-amber-400 font-bold" style={{ fontSize: '1.75rem' }}>{stat.value}</div>
                <div className="mt-1 text-xs text-blue-300">{t(stat.label)}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-6 py-5 text-center text-xs text-blue-400">
        © 2024 {t('Ministry of Planning & Investment, Vietnam. All rights reserved.')}
      </footer>
    </div>
  );
}
