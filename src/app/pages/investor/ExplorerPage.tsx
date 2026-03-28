import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { MapPin, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { StatusPill } from '../../components/ui/status-pill';
import { DataRow } from '../../components/ui/data-row';

const ALL_SECTORS = '__all__';

export default function ExplorerPage() {
  const location = useLocation();
  const { language, projects, watchlist, toggleWatchlist } = useApp();
  const [selectedSector, setSelectedSector] = useState(ALL_SECTORS);
  const t = (value: string) => translateText(value, language);
  const watchlistOnly = location.pathname === '/investor/watchlist';

  const sectorOptions = useMemo(
    () => [
      { value: ALL_SECTORS, label: t('All') },
              ...Array.from(new Set(projects.map((project) => project.sector))).map((sector) => ({
                value: sector,
                label: t(sector),
              })),
    ],
    [language, projects],
  );

  const filtered = useMemo(
    () =>
      projects.filter((project) => {
        const matchSector = selectedSector === ALL_SECTORS || project.sector === selectedSector;
        const matchWatchlist = !watchlistOnly || watchlist.includes(project.id);
        return matchSector && matchWatchlist;
      }),
    [projects, selectedSector, watchlist, watchlistOnly],
  );

  function handleToggleWatchlist(id: string, event: React.MouseEvent) {
    event.preventDefault();
    toggleWatchlist(id);
  }

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel overflow-hidden border-sky-200 bg-[linear-gradient(135deg,#dbeafe_0%,#eef6ff_45%,#f8fbff_100%)] text-slate-900 shadow-[0_24px_60px_rgba(15,76,129,0.08)]">
        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
              <TrendingUp size={14} />
              {t(watchlistOnly ? 'My Watchlist' : 'HCMC Investment Explorer')}
            </div>
            <h1 className="mb-3 text-slate-900" style={{ fontSize: 'var(--text-3xl)' }}>
              {t(watchlistOnly ? 'Followed projects ready for the next investor action' : 'Discover investment-ready projects with verified public-sector data')}
            </h1>
            <p className="text-sm leading-7 text-slate-600 break-words">
              {t(
                watchlistOnly
                  ? 'Review the projects you are following, then go straight to project detail or submit the next intake when you are ready.'
                  : 'Evaluate projects through a structured public-investment lens: readiness, scale, location, incentives, and verified operating context.',
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Open Projects', value: `${projects.filter((item) => item.status === 'published').length}` },
              { label: 'Total Value', value: '$1.38B' },
              { label: 'Sectors', value: '6' },
              { label: 'Average IRR', value: '12-15%' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-sky-100 bg-white px-4 py-4 shadow-sm">
                <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>{item.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">{t(item.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {t('Showing')} <span className="font-semibold text-slate-900">{filtered.length}</span> {t('projects')}
        </div>
        <div className="flex flex-wrap gap-2">
          {sectorOptions.map((sector) => (
            <button
              key={sector.value}
              onClick={() => setSelectedSector(sector.value)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                selectedSector === sector.value
                  ? 'bg-primary text-white'
                  : 'border border-border bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sector.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((project) => (
          <Link key={project.id} to={`/investor/project/${project.id}`} className="block">
            <DataRow className="group items-start gap-5 overflow-hidden p-0">
              <div className="h-full w-full max-w-64 self-stretch overflow-hidden border-r border-border bg-slate-100">
                <img src={project.image} alt={t(project.name)} className="h-full min-h-52 w-full object-cover" />
              </div>

              <div className="flex-1 px-5 py-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone={project.status === 'published' ? 'success' : project.status === 'review' ? 'warning' : 'default'}>
                    {t(project.stage)}
                  </StatusPill>
                  <StatusPill tone="info">{t(project.sector)}</StatusPill>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(project.province)}</span>
                </div>

                <h2 className="mb-2 text-xl font-semibold text-slate-900">{t(project.name)}</h2>
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} />
                  {t(project.location)}
                </div>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">{t(project.description)}</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-4">
                  {[
                    ['Investment scale', `$${project.budget}M`],
                    ['Minimum ticket', `$${project.minInvestment}M`],
                    ['IRR', t(project.returnRate)],
                    ['Timeline', t(project.timeline)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(label)}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(project.highlights ?? []).slice(0, 4).map((highlight) => (
                    <span key={highlight} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {t(highlight)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex min-h-full w-full max-w-44 flex-col justify-between bg-transparent px-4 py-5 transition-colors group-hover:bg-slate-50">
                <div className="flex h-full flex-col justify-center gap-3">
                  <button
                    onClick={(event) => handleToggleWatchlist(project.id, event)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold ${
                      watchlist.includes(project.id)
                        ? 'bg-amber-100 text-amber-800'
                        : 'border border-border bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star size={14} fill={watchlist.includes(project.id) ? 'currentColor' : 'none'} />
                    {t('Follow')}
                  </button>

                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white">
                    {t('View detail')}
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </DataRow>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="section-panel px-6 py-12 text-center">
          <div className="text-base font-semibold text-slate-900">{t('No projects found')}</div>
          <div className="mt-2 text-sm text-slate-500">
            {t(watchlistOnly ? 'Follow a project from the explorer and it will appear here.' : 'Try adjusting your filters to explore other projects.')}
          </div>
        </div>
      )}
    </div>
  );
}
