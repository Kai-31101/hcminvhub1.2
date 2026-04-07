import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowRight, BarChart3, Clock3, FileText, Filter, MapPin, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { administrativeLocationOptions, getAdministrativeLocationLabel, getProjectAdministrativeLocation } from '../../data/administrativeLocations';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';
import { getProjectStageLabel } from '../../utils/projectStatus';

const UPCOMING_WINDOW_DAYS = 14;
const selectClassName =
  'h-11 w-full rounded-xl border border-[#d9e3ec] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#0f3557]';

type DashboardJobStatus = 'completed' | 'delayed' | 'upcoming' | 'in_progress';

type DashboardJobItem = {
  id: string;
  title: string;
  description: string;
  note?: string;
  dueDate: string;
  daysUntilDue: number;
  projectId: string;
  projectName: string;
  agencyName: string;
  status: 'complete' | 'incomplete';
  latestAttachmentName?: string;
  latestAttachmentDate?: string;
};

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDaysUntilDue(dueDate: string) {
  const today = startOfToday();
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildCountGroups(values: string[]) {
  const total = values.length || 1;
  return Object.entries(
    values.reduce<Record<string, number>>((accumulator, value) => {
      accumulator[value] = (accumulator[value] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export default function ExecutiveDashboardPage() {
  const { language, projects, projectJobs, agencies } = useApp();
  const t = (value: string) => translateText(value, language);
  const isVi = language === 'vi';
  const copy = (en: string, vi?: string) => {
    const localized = t(en);
    if (localized !== en) return localized;
    return isVi ? vi ?? en : en;
  };

  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<DashboardJobItem | null>(null);

  function getJobStatusKey(job: DashboardJobItem): DashboardJobStatus {
    if (job.status === 'complete') return 'completed';
    if (job.daysUntilDue < 0) return 'delayed';
    if (job.daysUntilDue <= UPCOMING_WINDOW_DAYS) return 'upcoming';
    return 'in_progress';
  }

  function getJobStatusLabel(status: DashboardJobStatus) {
    switch (status) {
      case 'completed':
        return copy('Completed', 'Hoàn thành');
      case 'delayed':
        return copy('Delayed', 'Chậm tiến độ');
      case 'upcoming':
        return copy('Upcoming', 'Sắp đến hạn');
      case 'in_progress':
      default:
        return copy('In progress', 'Đang xử lý');
    }
  }

  function getJobStatusTone(status: DashboardJobStatus): 'success' | 'warning' | 'info' | 'danger' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'delayed':
        return 'danger';
      case 'upcoming':
        return 'warning';
      case 'in_progress':
      default:
        return 'info';
    }
  }

  function getDueLabel(daysUntilDue: number) {
    if (daysUntilDue < 0) return copy(`${Math.abs(daysUntilDue)} days overdue`, `Quá hạn ${Math.abs(daysUntilDue)} ngày`);
    if (daysUntilDue === 0) return copy('Due today', 'Đến hạn hôm nay');
    if (daysUntilDue === 1) return copy('Due tomorrow', 'Đến hạn ngày mai');
    return copy(`Due in ${daysUntilDue} days`, `Đến hạn sau ${daysUntilDue} ngày`);
  }

  const locationOptions = useMemo(
    () => administrativeLocationOptions,
    [],
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(projects.map((project) => project.sector))).sort((left, right) => left.localeCompare(right)),
    [projects],
  );
  const timelineOptions = useMemo(
    () => Array.from(new Set(projects.map((project) => project.timeline))).sort((left, right) => left.localeCompare(right)),
    [projects],
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesName =
          !nameFilter.trim() ||
          [project.name, project.location, project.sector, project.description]
            .join(' ')
            .toLowerCase()
            .includes(nameFilter.trim().toLowerCase());
        const matchesLocation = locationFilter === 'all' || getProjectAdministrativeLocation(project) === locationFilter;
        const matchesType = typeFilter === 'all' || project.sector === typeFilter;
        const matchesTimeline = timelineFilter === 'all' || project.timeline === timelineFilter;
        return matchesName && matchesLocation && matchesType && matchesTimeline;
      }),
    [locationFilter, nameFilter, projects, timelineFilter, typeFilter],
  );

  const filteredProjectIds = useMemo(() => new Set(filteredProjects.map((project) => project.id)), [filteredProjects]);

  const dashboardJobs = useMemo<DashboardJobItem[]>(
    () =>
      projectJobs
        .filter((job) => filteredProjectIds.has(job.projectId))
        .map((job) => {
          const project = projects.find((item) => item.id === job.projectId);
          const agency = agencies.find((item) => item.id === job.agencyId);

          return {
            id: job.id,
            title: job.title,
            description: job.description,
            note: job.note,
            dueDate: job.dueDate,
            daysUntilDue: getDaysUntilDue(job.dueDate),
            projectId: job.projectId,
            projectName: project?.name ?? job.projectId,
            agencyName: isVi ? agency?.nameVi ?? agency?.name ?? '-' : agency?.nameEn ?? agency?.name ?? '-',
            status: job.status,
            latestAttachmentName: job.attachments?.[0]?.fileName,
            latestAttachmentDate: job.attachments?.[0]?.lastUploadDate,
          };
        })
        .sort((left, right) => left.daysUntilDue - right.daysUntilDue),
    [agencies, filteredProjectIds, isVi, projectJobs, projects],
  );

  const delayedJobs = useMemo(
    () => dashboardJobs.filter((job) => job.status !== 'complete' && job.daysUntilDue < 0),
    [dashboardJobs],
  );
  const upcomingJobs = useMemo(
    () => dashboardJobs.filter((job) => job.status !== 'complete' && job.daysUntilDue >= 0 && job.daysUntilDue <= UPCOMING_WINDOW_DAYS),
    [dashboardJobs],
  );
  const activeJobs = dashboardJobs.filter((job) => job.status !== 'complete').length;

  const groupedByLocation = useMemo(
    () => buildCountGroups(filteredProjects.map((project) => getProjectAdministrativeLocation(project))),
    [filteredProjects],
  );
  const groupedByType = useMemo(
    () => buildCountGroups(filteredProjects.map((project) => project.sector)),
    [filteredProjects],
  );
  const groupedByProjectStatus = useMemo(
    () => buildCountGroups(filteredProjects.map((project) => getProjectStageLabel(project.status, project.stage))),
    [filteredProjects],
  );
  const groupedByProjectJobStatus = useMemo(
    () => buildCountGroups(dashboardJobs.map((job) => getJobStatusKey(job))),
    [dashboardJobs],
  );

  const topBusyAgency = useMemo(() => {
    const activeJobCounts = dashboardJobs
      .filter((job) => job.status !== 'complete')
      .reduce<Record<string, number>>((accumulator, job) => {
        accumulator[job.agencyName] = (accumulator[job.agencyName] ?? 0) + 1;
        return accumulator;
      }, {});

    return Object.entries(activeJobCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)[0] ?? null;
  }, [dashboardJobs]);

  const topLocation = groupedByLocation[0] ?? null;
  const readyProjects = filteredProjects.filter((project) => ['published', 'processing'].includes(project.status));

  const suggestionCards = [
    {
      title: delayedJobs.length
        ? copy('Clear delayed execution blockers', 'Gỡ điểm nghẽn chậm tiến độ')
        : copy('Maintain on-time execution discipline', 'Duy trì kỷ luật đúng hạn'),
      body: delayedJobs.length
        ? `${delayedJobs.length} ${copy('active jobs are overdue. Start with', 'đầu việc đang quá hạn. Ưu tiên')} ${delayedJobs[0]?.projectName ?? copy('the highest-risk project', 'dự án rủi ro nhất')} ${copy('and unblock', 'và tháo gỡ cho')} ${delayedJobs[0]?.agencyName ?? copy('the coordinating unit', 'đơn vị điều phối')}.`
        : copy(
            'No delayed jobs are currently open in the filtered portfolio. Keep agency follow-up focused on the upcoming window.',
            'Không có đầu việc chậm tiến độ nào trong danh mục đã lọc. Hãy giữ nhịp theo dõi cơ quan phụ trách cho các đầu việc sắp đến hạn.',
          ),
      tone: 'border-rose-200 bg-rose-50 text-rose-900',
    },
    {
      title: upcomingJobs.length
        ? copy('Prepare the next 14-day delivery wave', 'Chuẩn bị đợt thực thi 14 ngày tới')
        : copy('Build the next coordination wave', 'Chuẩn bị đợt phối hợp tiếp theo'),
      body: upcomingJobs.length
        ? `${upcomingJobs.length} ${copy('jobs are due within', 'đầu việc sẽ đến hạn trong')} ${UPCOMING_WINDOW_DAYS} ${copy('days. Prioritize pre-briefing for', 'ngày. Ưu tiên làm việc trước với')} ${topBusyAgency?.label ?? copy('the lead agency', 'cơ quan đầu mối')} ${copy('to avoid new delays.', 'để tránh phát sinh chậm tiến độ mới.')}`
        : copy(
            'No near-term job deadlines match the current filters. This is a good window to validate future dependencies and agency readiness.',
            'Không có đầu việc ngắn hạn nào khớp với bộ lọc hiện tại. Đây là lúc phù hợp để rà soát các phụ thuộc sắp tới và mức độ sẵn sàng của cơ quan.',
          ),
      tone: 'border-amber-200 bg-amber-50 text-amber-900',
    },
    {
      title: copy('Watch portfolio concentration', 'Theo dõi mức độ tập trung danh mục'),
      body: topLocation
        ? `${getAdministrativeLocationLabel(topLocation.label, language)} ${copy('currently carries the highest share of projects in this view at', 'hiện chiếm tỷ trọng dự án cao nhất trong màn hình này với')} ${topLocation.percentage}%. ${copy('Balance leadership attention across locations, types, and execution load.', 'Nên cân đối sự tập trung điều hành giữa địa bàn, loại dự án và khối lượng thực thi.')}`
        : copy(
            'No project concentration signal is available for the current filters.',
            'Chưa có tín hiệu tập trung danh mục nào trong bộ lọc hiện tại.',
          ),
      tone: 'border-sky-200 bg-sky-50 text-sky-900',
    },
  ];

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading">{t('Executive Dashboard')}</h1>
            <p className="section-subheading">
              {copy(
                'Portfolio command view with grouped project distribution, execution filters, and agency-level delivery attention points.',
                'Góc nhìn điều hành danh mục với phân nhóm dự án, bộ lọc thực thi và các điểm cần chú ý ở cấp cơ quan phụ trách.',
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/executive/analytics" className="app-button-secondary">
              <BarChart3 size={14} />
              {t('Analytics')}
            </Link>
            <Link to="/executive/risks" className="app-button-secondary">
              <ShieldAlert size={14} />
              {t('Risk Monitor')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-panel p-6">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <div className="text-sm font-semibold text-slate-900">{copy('Portfolio Filters', 'Bộ lọc danh mục')}</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{copy('Filter by Name', 'Lọc theo tên')}</span>
            <input
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              className="app-input"
              placeholder={copy('Search project name, location, or sector', 'Tìm theo tên dự án, địa điểm hoặc loại dự án')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{copy('Location', 'Địa điểm')}</span>
            <select className={selectClassName} value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              <option value="all">{copy('All locations', 'Tất cả địa điểm')}</option>
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {getAdministrativeLocationLabel(option, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{copy('Type', 'Loại dự án')}</span>
            <select className={selectClassName} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">{copy('All types', 'Tất cả loại dự án')}</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {t(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{copy('Timeline', 'Tiến độ thời gian')}</span>
            <select className={selectClassName} value={timelineFilter} onChange={(event) => setTimelineFilter(event.target.value)}>
              <option value="all">{copy('All timelines', 'Tất cả tiến độ')}</option>
              {timelineOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: copy('Total Projects', 'Tổng số dự án'), value: filteredProjects.length, tone: 'text-sky-700' },
          { label: copy('Active Project Jobs', 'Số đầu việc đang xử lý'), value: activeJobs, tone: 'text-indigo-700' },
          { label: copy('Upcoming Project Jobs', 'Số đầu việc sắp đến hạn'), value: upcomingJobs.length, tone: 'text-amber-700' },
          { label: copy('Delayed Project Jobs', 'Số đầu việc chậm tiến độ'), value: delayedJobs.length, tone: 'text-rose-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {metric.value}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {[
          { key: 'location', title: copy('Group by Location', 'Nhóm theo địa điểm'), rows: groupedByLocation, accent: 'bg-sky-600' },
          { key: 'type', title: copy('Group by Type', 'Nhóm theo loại dự án'), rows: groupedByType, accent: 'bg-violet-600' },
          { key: 'project_status', title: copy('Group by Project Status', 'Nhóm theo trạng thái dự án'), rows: groupedByProjectStatus, accent: 'bg-emerald-600' },
          { key: 'job_status', title: copy('Group by Project Jobs Status', 'Nhóm theo trạng thái đầu việc'), rows: groupedByProjectJobStatus, accent: 'bg-amber-600' },
        ].map((section) => (
          <section key={section.key} className="section-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-heading mb-0">{section.title}</h2>
              <StatusPill tone="default">{section.rows.length}</StatusPill>
            </div>
            <div className="space-y-3">
              {section.rows.length ? (
                section.rows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-800">
                        {section.key === 'job_status'
                          ? getJobStatusLabel(row.label as DashboardJobStatus)
                          : section.key === 'location'
                            ? getAdministrativeLocationLabel(row.label, language)
                            : t(row.label)}
                      </span>
                      <span className="text-slate-500">
                        {row.count} ({row.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${section.accent}`} style={{ width: `${row.percentage}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-slate-500">
                  {copy('No grouped data matches the current filters.', 'Không có dữ liệu phân nhóm phù hợp với bộ lọc hiện tại.')}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading mb-0">{copy('Upcoming Project Jobs', 'Các đầu việc sắp đến hạn')}</h2>
            <StatusPill tone="warning">{upcomingJobs.length}</StatusPill>
          </div>
          <div className="space-y-3">
            {upcomingJobs.length ? (
              upcomingJobs.map((job) => {
                const jobStatus = getJobStatusKey(job);
                return (
                  <DataRow key={job.id}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">{t(job.title)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill tone={getJobStatusTone(jobStatus)}>{getJobStatusLabel(jobStatus)}</StatusPill>
                      <button
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                        aria-label={copy('View job details', 'Xem chi tiết đầu việc')}
                        title={copy('View job details', 'Xem chi tiết đầu việc')}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </DataRow>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                {copy('No upcoming jobs fall within the next two weeks for the current filters.', 'Không có đầu việc nào đến hạn trong hai tuần tới theo bộ lọc hiện tại.')}
              </div>
            )}
          </div>
        </section>

        <section className="section-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading mb-0">{copy('Delayed Project Jobs', 'Các đầu việc chậm tiến độ')}</h2>
            <StatusPill tone="danger">{delayedJobs.length}</StatusPill>
          </div>
          <div className="space-y-3">
            {delayedJobs.length ? (
              delayedJobs.map((job) => {
                const jobStatus = getJobStatusKey(job);
                return (
                <DataRow key={job.id}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{t(job.title)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={getJobStatusTone(jobStatus)}>{getJobStatusLabel(jobStatus)}</StatusPill>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                      aria-label={copy('View job details', 'Xem chi tiết đầu việc')}
                      title={copy('View job details', 'Xem chi tiết đầu việc')}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </DataRow>
              );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
                {copy('No delayed jobs are open for the current filters.', 'Không có đầu việc chậm tiến độ nào theo bộ lọc hiện tại.')}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="section-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading mb-0">{copy('Suggested Executive Focus', 'Gợi ý trọng tâm điều hành')}</h2>
          <StatusPill tone="info">{suggestionCards.length}</StatusPill>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {suggestionCards.map((card) => (
            <div key={card.title} className={`rounded-xl border px-4 py-4 ${card.tone}`}>
              <div className="text-sm font-semibold">{card.title}</div>
              <div className="mt-2 text-sm leading-6">{card.body}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link to="/executive/analytics" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sky-900 transition-colors hover:bg-sky-100">
            <div className="text-sm font-semibold">{copy('Open Analytics', 'Mở phân tích')}</div>
            <div className="mt-1 text-xs text-sky-700">
              {copy('Review trend movement, sector mix, and broader funnel behavior.', 'Xem xu hướng biến động, cơ cấu loại dự án và diễn biến tổng thể của phễu.')}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
              {t('Open')} <ArrowRight size={12} />
            </div>
          </Link>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
            <div className="text-sm font-semibold">{copy('Ready-to-advance projects', 'Dự án sẵn sàng thúc đẩy')}</div>
            <div className="mt-1 text-xs text-emerald-700">
              {readyProjects.length
                ? `${readyProjects.length} ${copy('projects are showing strong processing progress without delayed jobs.', 'dự án đang có tiến độ xử lý tốt và không có đầu việc chậm tiến độ.')}`
                : copy('No projects currently meet the ready-to-advance criteria in this filtered view.', 'Hiện chưa có dự án nào đạt tiêu chí sẵn sàng thúc đẩy trong góc nhìn đã lọc này.')}
            </div>
            {topBusyAgency ? (
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                <MapPin size={12} />
                {copy('Most active agency', 'Cơ quan hoạt động nhiều nhất')}: {t(topBusyAgency.label)} ({topBusyAgency.count})
              </div>
            ) : null}
          </div>
        </div>
      </section>
      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <div className="text-base font-semibold text-slate-900">{t(selectedJob.title)}</div>
                <div className="mt-1 text-sm text-slate-500">{t(selectedJob.projectName)}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={copy('Close', 'Đóng')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={getJobStatusTone(getJobStatusKey(selectedJob))}>{getJobStatusLabel(getJobStatusKey(selectedJob))}</StatusPill>
                <StatusPill tone={selectedJob.daysUntilDue < 0 ? 'danger' : 'warning'}>
                  {getDueLabel(selectedJob.daysUntilDue)}
                </StatusPill>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {copy('Job description', 'Mô tả đầu việc')}
                </div>
                <div className="text-sm leading-7 text-slate-700">{t(selectedJob.description)}</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DataRow>
                  <div className="text-sm text-slate-500">{copy('Coordinating Unit', 'Đơn vị điều phối')}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(selectedJob.agencyName)}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{copy('Due date', 'Ngày đến hạn')}</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedJob.dueDate}</div>
                </DataRow>
                <DataRow>
                  <div className="text-sm text-slate-500">{copy('Project', 'Dự án')}</div>
                  <div className="text-sm font-semibold text-slate-900">{t(selectedJob.projectName)}</div>
                </DataRow>
              </div>

              {selectedJob.note ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                    {copy('Executive note', 'Ghi chú điều hành')}
                  </div>
                  <div className="text-sm leading-7 text-amber-900">{t(selectedJob.note)}</div>
                </div>
              ) : null}

              {selectedJob.latestAttachmentName ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                    <FileText size={14} />
                    {copy('Latest attachment', 'Tệp đính kèm gần nhất')}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{t(selectedJob.latestAttachmentName)}</div>
                  {selectedJob.latestAttachmentDate ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {copy('Updated', 'Cập nhật')}: {selectedJob.latestAttachmentDate}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
