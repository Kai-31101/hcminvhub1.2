import React from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ArrowLeft, FileText, HelpCircle, ShieldCheck, User } from 'lucide-react';
import { ExplorerFooter } from '../components/ExplorerFooter';
import { LanguageDropdown } from '../components/LanguageDropdown';
import { useApp } from '../context/AppContext';
import { translateText } from '../utils/localization';

type ContentSection = {
  heading: string;
  body?: string;
  items?: string[];
};

type ContentPageConfig = {
  title: string;
  eyebrow: string;
  description: string;
  updatedAt: string;
  icon: React.ReactNode;
  sections: ContentSection[];
};

const contentPages: Record<string, ContentPageConfig> = {
  '/faqs': {
    title: 'Frequently Asked Questions',
    eyebrow: 'Help Center',
    description: 'Common questions for public visitors and investors using Ho Chi Minh City Investment Hub.',
    updatedAt: 'May 27, 2026',
    icon: <HelpCircle size={22} />,
    sections: [
      {
        heading: 'What can I do on HCMC Investment Hub?',
        body:
          'You can explore public investment opportunities, review project information, open the investment map, submit quick intake information, and request support from the responsible investment desk.',
      },
      {
        heading: 'Do I need an account to browse projects?',
        body:
          'Public visitors can browse available public project information. Account access may be required before submitting certain requests, saving favorites, or continuing into investor workspace features.',
      },
      {
        heading: 'What happens after I submit a quick intake?',
        body:
          'The platform records the intake information and routes it to the responsible support or investor matching workflow. Downstream review and response are handled by the approved operating team.',
      },
      {
        heading: 'Are project details legally binding?',
        body:
          'Project information is provided for discovery and coordination. Final investment decisions, approvals, incentives, or commitments require the applicable official process and documentation.',
      },
      {
        heading: 'Who should I contact for platform support?',
        body:
          'Use the Support entry point on the platform when available. If email support is configured later, the footer mail action should open the approved support address.',
      },
    ],
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    description: 'How HCMC Investment Hub handles personal, company, and interaction data submitted through the platform.',
    updatedAt: 'May 27, 2026',
    icon: <ShieldCheck size={22} />,
    sections: [
      {
        heading: 'Information We Collect',
        items: [
          'Account and contact information such as name, email, phone number, company, country, and role.',
          'Investment interest and support request details submitted through public forms or portal workflows.',
          'Platform activity data such as login events, request history, project interactions, and notification activity.',
        ],
      },
      {
        heading: 'How We Use Information',
        items: [
          'To route investor intake, project questions, and support requests to the responsible team.',
          'To provide role-based access to public, investor, government, agency, admin, and executive workspaces.',
          'To improve platform reliability, security, reporting, and operational coordination.',
        ],
      },
      {
        heading: 'Sharing and Access',
        body:
          'Information may be visible to authorized users who need it for investment support, project coordination, administration, or compliance. Access should follow role and permission rules configured for the platform.',
      },
      {
        heading: 'Data Protection',
        body:
          'The platform should apply reasonable technical and organizational controls to protect submitted information from unauthorized access, misuse, or accidental loss.',
      },
      {
        heading: 'Questions',
        body:
          'Privacy questions should be sent through the approved platform contact or support channel once that destination is configured.',
      },
    ],
  },
  '/terms-of-service': {
    title: 'Term of Services',
    eyebrow: 'Legal',
    description: 'Usage rules for public visitors, investors, agencies, operators, administrators, and other authorized users.',
    updatedAt: 'May 27, 2026',
    icon: <FileText size={22} />,
    sections: [
      {
        heading: 'Use of the Platform',
        body:
          'Users may use HCMC Investment Hub to browse public investment information, submit requests, coordinate approved workflows, and access role-based portal features according to their permissions.',
      },
      {
        heading: 'User Responsibilities',
        items: [
          'Provide accurate information when submitting forms, creating accounts, or updating project data.',
          'Use the platform only for lawful investment discovery, support, coordination, and administration purposes.',
          'Do not upload malicious content, misuse public forms, or attempt unauthorized access to restricted areas.',
        ],
      },
      {
        heading: 'Project and Investment Information',
        body:
          'Public project information is provided for discovery and coordination. It does not guarantee project availability, approval, incentives, exclusivity, allocation, or investment outcome.',
      },
      {
        heading: 'Account and Access Control',
        body:
          'Users are responsible for maintaining the confidentiality of their account access. The platform may restrict access when required for security, compliance, or operational reasons.',
      },
      {
        heading: 'External Links and Third-Party Content',
        body:
          'The platform may link to official partner, government, or third-party websites. Those destinations are outside the platform scope and may follow their own terms and privacy practices.',
      },
    ],
  },
};

const navLinks = [
  { label: 'FAQs', to: '/faqs' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Term of Services', to: '/terms-of-service' },
];

function HomeStyleHeader() {
  const { language } = useApp();
  const t = (value: string) => translateText(value, language);
  const navItems = [
    { label: 'Home', to: '/home', active: true },
    { label: 'Projects map view', to: '/home' },
    { label: 'Projects', to: '/home' },
    { label: 'Quick Request', to: '/home' },
    { label: 'Support', to: '/home' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-[84px] w-full items-center gap-3 border-b border-[#e5e7eb] bg-[#f7f9fb] px-6 py-3 md:px-[78px]">
      <Link to="/home" className="relative h-[60px] w-[60px] shrink-0" aria-label={t('HCMC Investment Hub home')}>
        <img src="/figma-homepage/header-logo.png" alt="" className="h-full w-full object-contain" />
      </Link>

      <nav className="ml-auto hidden items-center gap-8 lg:flex" aria-label={t('Main navigation')}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`h-[31px] border-b-2 px-2 text-[18px] leading-7 transition-colors ${
              item.active ? 'border-[#ed6203] font-bold text-[#ed6203]' : 'border-transparent font-normal text-[#0b2447] hover:text-[#ed6203]'
            }`}
          >
            {t(item.label)}
          </Link>
        ))}
        <LanguageDropdown />
        <Link to="/login" className="inline-flex h-10 w-[151px] items-center justify-center gap-2 rounded-md bg-[#ed6203] px-4 text-[14px] font-medium text-white">
          <User size={20} />
          {t('Login')}
        </Link>
      </nav>
    </header>
  );
}

export default function PublicContentPage() {
  const { language } = useApp();
  const location = useLocation();
  const t = (value: string) => translateText(value, language);
  const page = contentPages[location.pathname];

  if (!page) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fb]">
      <HomeStyleHeader />

      <main className="flex-1">
        <section className="border-b border-[#e5e7eb] bg-white px-6 py-10 md:px-[78px]">
          <div className="mx-auto max-w-[1120px]">
            <Link to="/home" className="mb-8 inline-flex items-center gap-2 text-[14px] font-semibold text-[#455f87] hover:text-[#1e3a5f]">
              <ArrowLeft size={16} />
              {t('Back to Home')}
            </Link>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[760px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fff1e7] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#c2410c]">
                  {page.icon}
                  {t(page.eyebrow)}
                </div>
                <h1 className="text-[34px] font-bold leading-[1.12] text-[#0b2447] md:text-[46px]">{t(page.title)}</h1>
                <p className="mt-4 max-w-[680px] text-[16px] leading-7 text-[#455f87]">{t(page.description)}</p>
              </div>
              <div className="text-[13px] font-medium text-[#6b7280]">
                {t('Last updated')}: {page.updatedAt}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 md:px-[78px]">
          <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="h-fit border-l-4 border-[#ed6203] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">{t('Reference Pages')}</div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((item) => {
                  const active = item.to === location.pathname;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 text-[14px] font-semibold transition-colors ${
                        active ? 'bg-[#fff1e7] text-[#c2410c]' : 'text-[#1f2937] hover:bg-[#eef2f6]'
                      }`}
                    >
                      {t(item.label)}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <div className="space-y-5">
              {page.sections.map((section) => (
                <section key={section.heading} className="bg-white px-6 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] md:px-8">
                  <h2 className="text-[20px] font-bold leading-7 text-[#0b2447]">{t(section.heading)}</h2>
                  {section.body ? <p className="mt-3 text-[15px] leading-7 text-[#374151]">{t(section.body)}</p> : null}
                  {section.items ? (
                    <ul className="mt-3 space-y-2 text-[15px] leading-7 text-[#374151]">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#ed6203]" />
                          <span>{t(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>

      <ExplorerFooter />
    </div>
  );
}
