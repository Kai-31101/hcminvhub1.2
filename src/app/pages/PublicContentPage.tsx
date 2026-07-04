import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ArrowLeft, ChevronDown, FileText, HelpCircle, ScrollText, ShieldCheck, User } from 'lucide-react';
import { ExplorerFooter } from '../components/ExplorerFooter';
import { LanguageDropdown } from '../components/LanguageDropdown';
import { useApp } from '../context/AppContext';
import { translateText } from '../utils/localization';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  quote: string;
  order: number;
};

type HelpdeskPdf = {
  id: string;
  title: string;
  helpdeskType: 'Privacy Policy' | 'Term of Services' | 'Support Policy';
  description: string;
  pdfUrl: string;
  order: number;
};

type ContentPageConfig = {
  title: string;
  eyebrow: string;
  description: string;
  updatedAt: string;
  icon: React.ReactNode;
  type: 'faq' | 'pdf';
  helpdeskType?: HelpdeskPdf['helpdeskType'];
};

const samplePdfUrl = '/documents/TM%20QHPK%20THI%20TRAN%20BEN%20DAU.pdf';

const faqItems: FaqItem[] = [
  {
    id: 'browse-projects',
    order: 1,
    question: 'What can I do on HCMC Investment Hub?',
    answer:
      'You can explore public investment opportunities, review project information, open the investment map, submit quick intake information, follow projects, and request support from the responsible investment desk.',
    quote: 'Platform service guidance and public investment promotion information policy.',
  },
  {
    id: 'account-required',
    order: 2,
    question: 'Do I need an account to browse projects?',
    answer:
      'Public visitors can browse available public project information. Account access may be required before submitting certain requests, managing Favorite Projects, or continuing into investor workspace features.',
    quote: 'Account access and user authentication policy.',
  },
  {
    id: 'favorite-projects',
    order: 3,
    question: 'What happens when I click the star to follow a project?',
    answer:
      'If you are logged in, the project is saved to Favorite Projects and the star becomes active. If you are not logged in, the platform asks for contact information and records the submitted email as the receiver for follow confirmation.',
    quote: 'Favorite Projects and project follow notification policy.',
  },
  {
    id: 'quick-intake',
    order: 4,
    question: 'What happens after I submit a quick intake?',
    answer:
      'The platform records the intake information and routes it to the responsible support or investor matching workflow. Downstream review and response are handled by the approved operating team.',
    quote: 'Investor support intake routing policy.',
  },
  {
    id: 'legal-binding',
    order: 5,
    question: 'Are project details legally binding?',
    answer:
      'Project information is provided for discovery and coordination. Final investment decisions, approvals, incentives, or commitments require the applicable official process and documentation.',
    quote: 'Project information disclaimer and official approval policy.',
  },
];

const helpdeskPdfs: HelpdeskPdf[] = [
  {
    id: 'privacy-data-collection',
    order: 1,
    helpdeskType: 'Privacy Policy',
    title: 'Personal Data Collection and Usage',
    description: 'Explains how submitted account, company, contact, and interaction data are used for platform services.',
    pdfUrl: samplePdfUrl,
  },
  {
    id: 'privacy-access-sharing',
    order: 2,
    helpdeskType: 'Privacy Policy',
    title: 'Data Access, Sharing, and Retention',
    description: 'Defines authorized access, internal routing, and retention guidance for submitted information.',
    pdfUrl: samplePdfUrl,
  },
  {
    id: 'terms-platform-use',
    order: 1,
    helpdeskType: 'Term of Services',
    title: 'Platform Usage Terms',
    description: 'Defines permitted usage for public visitors, investors, agencies, operators, and administrators.',
    pdfUrl: samplePdfUrl,
  },
  {
    id: 'terms-project-information',
    order: 2,
    helpdeskType: 'Term of Services',
    title: 'Project Information Disclaimer',
    description: 'Clarifies that project information is for discovery and does not replace official approval documents.',
    pdfUrl: samplePdfUrl,
  },
  {
    id: 'support-intake',
    order: 1,
    helpdeskType: 'Support Policy',
    title: 'Support Intake and Routing',
    description: 'Describes how investor questions, meeting requests, and quick-intake submissions are routed.',
    pdfUrl: samplePdfUrl,
  },
  {
    id: 'support-response',
    order: 2,
    helpdeskType: 'Support Policy',
    title: 'Response and Notification Policy',
    description: 'Defines expected receiver notifications for project follow, request response, and support updates.',
    pdfUrl: samplePdfUrl,
  },
];

const contentPages: Record<string, ContentPageConfig> = {
  '/faqs': {
    title: 'Frequently Asked Questions',
    eyebrow: 'Help Center',
    description: 'Common questions for public visitors and investors using Ho Chi Minh City Investment Hub.',
    updatedAt: 'June 03, 2026',
    icon: <HelpCircle size={22} />,
    type: 'faq',
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    description: 'Policy references for personal, company, and interaction data submitted through the platform.',
    updatedAt: 'June 03, 2026',
    icon: <ShieldCheck size={22} />,
    type: 'pdf',
    helpdeskType: 'Privacy Policy',
  },
  '/terms-of-service': {
    title: 'Term of Services',
    eyebrow: 'Legal',
    description: 'Usage rules for public visitors, investors, agencies, operators, administrators, and other authorized users.',
    updatedAt: 'June 03, 2026',
    icon: <FileText size={22} />,
    type: 'pdf',
    helpdeskType: 'Term of Services',
  },
  '/support-policy': {
    title: 'Support Policy',
    eyebrow: 'Help Center',
    description: 'Support routing, response, and notification policy references for platform requests.',
    updatedAt: 'June 03, 2026',
    icon: <ScrollText size={22} />,
    type: 'pdf',
    helpdeskType: 'Support Policy',
  },
};

const navLinks = [
  { label: 'FAQs', to: '/faqs' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Term of Services', to: '/terms-of-service' },
  { label: 'Support Policy', to: '/support-policy' },
];

function HomeStyleHeader() {
  const { language } = useApp();
  const t = (value: string) => translateText(value, language);
  const navItems = [
    { label: 'Home', to: '/home', active: true },
    { label: 'Projects map view', to: '/home' },
    { label: 'Projects', to: '/home' },
    { label: 'Quick Request', to: '/home' },
    { label: 'Support', to: '/support-policy' },
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

function FaqContent() {
  const { language } = useApp();
  const t = (value: string) => translateText(value, language);
  const [openId, setOpenId] = useState(faqItems[0]?.id ?? '');
  const sortedFaqs = [...faqItems].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      <div className="mb-4 border-b border-[#d9e2ec] pb-4">
        <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">{t('Admin-managed fields')}</div>
        <p className="mt-2 text-[14px] leading-6 text-[#455f87]">{t('Question | Answer | Quote | Order')}</p>
      </div>
      {sortedFaqs.map((item) => {
        const expanded = item.id === openId;
        return (
          <section key={item.id} className="border border-[#d9e2ec] bg-white">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={expanded}
              onClick={() => setOpenId(expanded ? '' : item.id)}
            >
              <span className="text-[17px] font-bold leading-6 text-[#0b2447]">{t(item.question)}</span>
              <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-[#ed6203] transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded ? (
              <div className="border-t border-[#eef2f6] px-5 pb-5 pt-4">
                <p className="text-[15px] leading-7 text-[#374151]">{t(item.answer)}</p>
                <p className="mt-3 text-[13px] font-medium leading-6 text-[#6b7280]">({t(item.quote)})</p>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function PdfPolicyContent({ helpdeskType }: { helpdeskType: HelpdeskPdf['helpdeskType'] }) {
  const { language } = useApp();
  const t = (value: string) => translateText(value, language);
  const documents = useMemo(
    () => helpdeskPdfs.filter((item) => item.helpdeskType === helpdeskType).sort((a, b) => a.order - b.order),
    [helpdeskType],
  );
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? '');

  useEffect(() => {
    setSelectedId(documents[0]?.id ?? '');
  }, [documents]);

  const selectedDocument = documents.find((item) => item.id === selectedId) ?? documents[0];

  if (!selectedDocument) {
    return (
      <section className="border border-[#d9e2ec] bg-white p-6">
        <h2 className="text-[20px] font-bold text-[#0b2447]">{t('No PDF configured')}</h2>
        <p className="mt-2 text-[14px] leading-6 text-[#455f87]">{t('Admin Portal can import PDF files and select Helpdesk Type for this page.')}</p>
      </section>
    );
  }

  return (
    <div className="grid min-h-[680px] gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="border border-[#d9e2ec] bg-white">
        <div className="border-b border-[#e5e7eb] px-4 py-4">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">{t('Related PDF')}</div>
          <p className="mt-2 text-[13px] leading-5 text-[#455f87]">{t('Managed in Admin Portal: import PDF and select Helpdesk Type.')}</p>
        </div>
        <nav className="flex flex-col" aria-label={t(`${helpdeskType} documents`)}>
          {documents.map((document) => {
            const active = document.id === selectedDocument.id;
            return (
              <button
                key={document.id}
                type="button"
                className={`border-b border-[#eef2f6] px-4 py-4 text-left transition-colors ${
                  active ? 'bg-[#fff7ed]' : 'bg-white hover:bg-[#f8fafc]'
                }`}
                onClick={() => setSelectedId(document.id)}
              >
                <span className={`block text-[15px] font-bold leading-6 ${active ? 'text-[#c2410c]' : 'text-[#0b2447]'}`}>{t(document.title)}</span>
                <span className="mt-1 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">{t(document.helpdeskType)}</span>
                <span className="mt-2 block text-[13px] leading-5 text-[#455f87]">{t(document.description)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 border border-[#d9e2ec] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#e5e7eb] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[20px] font-bold leading-7 text-[#0b2447]">{t(selectedDocument.title)}</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#455f87]">{t(selectedDocument.description)}</p>
          </div>
          <a
            href={selectedDocument.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#ed6203] px-3 text-[13px] font-bold text-[#ed6203] hover:bg-[#fff1e7]"
          >
            {t('Open PDF')}
          </a>
        </div>
        <iframe
          title={selectedDocument.title}
          src={selectedDocument.pdfUrl}
          className="h-[620px] w-full bg-[#f8fafc]"
        />
      </section>
    </div>
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
          <div className="mx-auto max-w-[1180px]">
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
                <p className="mt-4 max-w-[760px] text-[16px] leading-7 text-[#455f87]">{t(page.description)}</p>
              </div>
              <div className="text-[13px] font-medium text-[#6b7280]">
                {t('Last updated')}: {page.updatedAt}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 md:px-[78px]">
          <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[240px_1fr]">
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

            {page.type === 'faq' ? <FaqContent /> : <PdfPolicyContent helpdeskType={page.helpdeskType ?? 'Privacy Policy'} />}
          </div>
        </section>
      </main>

      <ExplorerFooter />
    </div>
  );
}
