import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Headset, MessageSquareWarning } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { SeeAllButton } from '../../components/SeeAllButton';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
const DEFAULT_LIST_COUNT = 6;

function getStatusTone(status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'resolved' || status === 'closed') return 'success';
  if (status === 'in_progress') return 'info';
  return 'warning';
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

export default function InvestorSupportPage() {
  const { language, issues, projects, opportunities, activeInvestorCompany } = useApp();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const t = (value: string) => translateText(value, language);

  const investorProjectIds = useMemo(
    () =>
      new Set(
        opportunities
          .filter((item) => item.investorCompany === activeInvestorCompany)
          .map((item) => item.projectId),
      ),
    [activeInvestorCompany, opportunities],
  );

  const supportRequests = useMemo(
    () =>
      issues
        .filter((item) => {
          const byProject = investorProjectIds.has(item.projectId);
          const isSupportCategory = item.category?.toLowerCase() === 'support';
          const isSupportTitle = item.title.toLowerCase().startsWith('investor support request');
          return byProject && (isSupportCategory || isSupportTitle);
        })
        .sort((left, right) => right.reportedAt.localeCompare(left.reportedAt)),
    [investorProjectIds, issues],
  );

  const groupedByProject = useMemo(() => {
    const group = new Map<string, typeof supportRequests>();
    supportRequests.forEach((item) => {
      const current = group.get(item.projectId) ?? [];
      current.push(item);
      group.set(item.projectId, current);
    });

    return Array.from(group.entries()).map(([projectId, requests]) => {
      const project = projects.find((item) => item.id === projectId);
      return { projectId, projectName: project?.name ?? projectId, requests };
    });
  }, [projects, supportRequests]);

  const openCount = supportRequests.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length;

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading">{t('Support')}</h1>
            <p className="section-subheading">
              {t('Support requests created by the investor, grouped by project for quick follow-up.')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <MessageSquareWarning size={14} />
            <span>{openCount} {t('open')}</span>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {language === 'vi'
            ? 'T\u00ednh n\u0103ng n\u00e0y s\u1ebd \u0111\u01b0\u1ee3c t\u00edch h\u1ee3p v\u1edbi C\u1ed5ng giao ti\u1ebfp ITBC hi\u1ec7n t\u1ea1i.'
            : 'This feature will be integrated with current ITBC Communication Portal.'}
        </div>
      </section>

      {groupedByProject.length === 0 ? (
        <section className="section-panel p-10 text-center">
          <Headset size={30} className="mx-auto text-slate-300" />
          <div className="mt-3 text-base font-semibold text-slate-900">{t('No support request yet')}</div>
          <div className="mt-1 text-sm text-slate-500">
            {t('Create a support request from the execution workspace and it will appear here.')}
          </div>
          <div className="mt-5">
            <Link to="/investor/execution" className="app-button">
              {t('Open execution workspace')}
            </Link>
          </div>
        </section>
      ) : (
        groupedByProject.map((group) => (
          <section key={group.projectId} className="section-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{t(group.projectName)}</h2>
              <StatusPill tone="info">{group.requests.length}</StatusPill>
            </div>
            <div className="space-y-3">
              {(expandedProjects[group.projectId] ? group.requests : group.requests.slice(0, DEFAULT_LIST_COUNT)).map((request) => (
                <DataRow key={request.id} className="items-start">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-sm font-semibold text-slate-900">{t(request.title)}</div>
                    <div className="text-sm text-slate-600">{t(request.description)}</div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{t('Reported Time')}: {request.reportedAt}</span>
                      <span>{t('PIC/Agency in charge')}: {t(request.assignedTo)}</span>
                      <span>{t('Due Date')}: {request.dueDate ?? '-'}</span>
                    </div>
                  </div>
                  <StatusPill tone={getStatusTone(request.status)}>{t(getStatusLabel(request.status))}</StatusPill>
                </DataRow>
              ))}
              {!(expandedProjects[group.projectId] ?? false) && group.requests.length > DEFAULT_LIST_COUNT && (
                <SeeAllButton
                  label={t('See All')}
                  onClick={() =>
                    setExpandedProjects((current) => ({
                      ...current,
                      [group.projectId]: true,
                    }))
                  }
                />
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
