import React, { useMemo, useState } from 'react';
import {
  Building2,
  Database,
  Edit,
  FolderCog,
  Network,
  Plus,
  Search,
  Shield,
  Settings2,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { SeeAllButton } from '../../components/SeeAllButton';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';
import { translateText } from '../../utils/localization';
import { getProjectStatusTone, PROJECT_STAGE_OPTIONS } from '../../utils/projectStatus';

const DEFAULT_LIST_COUNT = 6;

type AdminTab = 'overview' | 'access' | 'agencies' | 'master_data';

const roleTone: Record<string, 'info' | 'success' | 'warning' | 'default' | 'danger'> = {
  'Government Operator': 'info',
  'Agency User': 'success',
  Investor: 'warning',
  Admin: 'default',
  Executive: 'danger',
};

const roleOptions = ['Government Operator', 'Agency User', 'Investor', 'Admin', 'Executive'];

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
        active ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MasterDataCard({
  title,
  subtitle,
  values,
}: {
  title: string;
  subtitle: string;
  values: Array<{ label: string; tone: 'default' | 'info' | 'success' | 'warning' | 'danger' }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,53,87,0.05)]">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.map((value) => (
          <StatusPill key={value.label} tone={value.tone}>
            {value.label}
          </StatusPill>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    users,
    agencies,
    projects,
    opportunities,
    permits,
    issues,
    milestones,
    serviceRequests,
    requiredDataAssignments,
    projectJobs,
    createUser,
    updateUser,
    createAgency,
    updateAgency,
    language,
  } = useApp();

  const t = (value: string) => translateText(value, language);
  const isVi = language === 'vi';
  const copy = (en: string, vi?: string) => {
    const localized = t(en);
    if (localized !== en) return localized;
    return isVi ? vi ?? en : en;
  };
  const highlightedId = searchParams.get('highlight');
  const defaultTab: AdminTab = location.pathname.includes('/agencies') ? 'agencies' : 'access';

  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);
  const [search, setSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllAgencies, setShowAllAgencies] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Agency User',
    organization: agencies[0]?.name ?? 'Department of Planning and Investment',
    status: 'active' as 'active' | 'inactive',
  });
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    shortName: '',
    type: 'Government',
    jurisdiction: 'Provincial',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        !search ||
        [user.name, user.email, user.role, user.organization].join(' ').toLowerCase().includes(search.toLowerCase()),
      ),
    [search, users],
  );
  const filteredAgencies = useMemo(
    () =>
      agencies.filter((agency) =>
        !search ||
        [agency.name, agency.shortName, agency.contactPerson, agency.email].join(' ').toLowerCase().includes(search.toLowerCase()),
      ),
    [agencies, search],
  );

  const visibleUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, DEFAULT_LIST_COUNT);
  const visibleAgencies = showAllAgencies ? filteredAgencies : filteredAgencies.slice(0, DEFAULT_LIST_COUNT);
  const distinctRoles = useMemo(() => Array.from(new Set(users.map((user) => user.role))), [users]);
  const distinctAgencyTypes = useMemo(() => Array.from(new Set(agencies.map((agency) => agency.type))), [agencies]);
  const agencyNameOptions = useMemo(() => Array.from(new Set(agencies.map((agency) => agency.name))).sort(), [agencies]);
  const totalPeopleInCharge = useMemo(
    () => agencies.reduce((sum, agency) => sum + (agency.peopleInCharge?.length ?? 0), 0),
    [agencies],
  );

  const masterDataCatalogs = [
    {
      title: copy('Project Statuses', 'Trạng thái dự án'),
      subtitle: copy(
        'Core lifecycle of a project record. These drive explorer visibility and executive reporting.',
        'Vòng đời cốt lõi của hồ sơ dự án. Nhóm này chi phối khả năng hiển thị và báo cáo điều hành.',
      ),
      values: PROJECT_STAGE_OPTIONS.map((value) => ({
        label: t(value),
        tone: getProjectStatusTone(value, value),
      })),
    },
    {
      title: copy('Project Job Statuses', 'Trạng thái đầu việc dự án'),
      subtitle: copy(
        'Stored statuses are simple, while operational statuses such as Upcoming and Delayed are derived from due date.',
        'Trạng thái lưu trữ đang đơn giản, còn các trạng thái vận hành như Sắp đến hạn và Trễ hạn được suy ra từ hạn xử lý.',
      ),
      values: [
        { label: copy('Incomplete', 'Chưa hoàn thành'), tone: 'default' as const },
        { label: copy('Complete', 'Hoàn thành'), tone: 'success' as const },
        { label: copy('In Progress', 'Đang xử lý'), tone: 'info' as const },
        { label: copy('Upcoming', 'Sắp đến hạn'), tone: 'warning' as const },
        { label: copy('Delayed', 'Trễ hạn'), tone: 'danger' as const },
      ],
    },
  ];

  const recommendedMasterData = [
    {
      title: copy('Coordinating unit matrix', 'Ma trận đơn vị điều phối'),
      body: copy(
        'Maintain a master list of agencies, their contact details, and which object types they can own.',
        'Quản lý danh mục cơ quan, cán bộ phụ trách, người dự phòng và loại đối tượng mỗi cơ quan được phép phụ trách.',
      ),
    },
    {
      title: copy('Status catalogs by object', 'Danh mục trạng thái theo từng đối tượng'),
      body: copy(
        'Separate master data for Project, Project Job, Required Data, Opportunity, Permit, Issue, Milestone, and Service Request.',
        'Tách riêng master data trạng thái cho Dự án, Đầu việc dự án, Dữ liệu được giao, Cơ hội đầu tư, Giấy phép, Vướng mắc, Mốc tiến độ và Yêu cầu dịch vụ.',
      ),
    },
    {
      title: copy('Sector, region, and investment taxonomies', 'Danh mục lĩnh vực, khu vực và loại hình đầu tư'),
      body: copy(
        'These should not live as free text if you want consistent reporting and filtering.',
        'Không nên để dạng nhập tự do nếu cần báo cáo và lọc dữ liệu nhất quán.',
      ),
    },
    {
      title: copy('Priority and SLA rules', 'Quy tắc ưu tiên và SLA'),
      body: copy(
        'Admin should control priority tiers, due-date defaults, reminder windows, and breach thresholds.',
        'Admin nên kiểm soát mức ưu tiên, hạn xử lý mặc định, cửa sổ nhắc việc và ngưỡng vi phạm SLA.',
      ),
    },
    {
      title: copy('Document and data-field templates', 'Mẫu tài liệu và trường dữ liệu'),
      body: copy(
        'Useful for standardizing project onboarding, permit submissions, and required data assignments.',
        'Hữu ích để chuẩn hóa khâu tạo dự án, nộp hồ sơ giấy phép và giao dữ liệu bắt buộc.',
      ),
    },
    {
      title: copy('Notification templates and routing rules', 'Mẫu thông báo và quy tắc điều phối'),
      body: copy(
        'Admin should be able to define which event notifies which role or agency.',
        'Admin n?n c?u h?nh ???c s? ki?n n?o g?i th?ng b?o t?i vai tr? ho?c c? quan t??ng ?ng.',
      ),
    },
  ];

  const ownershipRules = [
    copy('Every Project Job should require one coordinating unit.', 'M?i ??u vi?c d? ?n n?n b?t bu?c c? m?t ??n v? ?i?u ph?i.'),
    copy('Every Required Data assignment should map to the same coordinating unit matrix.', 'M?i ??u vi?c d? li?u ???c giao n?n d?ng c?ng ma tr?n ??n v? ?i?u ph?i t??ng ?ng.'),
    copy('Agency deactivation should warn if it is still assigned to open jobs, permits, or service requests.', 'Khi ngừng kích hoạt cơ quan, hệ thống nên cảnh báo nếu cơ quan đó vẫn đang được gán cho đầu việc, giấy phép hoặc yêu cầu dịch vụ đang mở.'),
    copy('Status changes should optionally trigger notifications, SLA recalculation, and audit logs.', 'Thay đổi trạng thái nên có thể kích hoạt thông báo, tính lại SLA và ghi nhận lịch sử thao tác.'),
  ];

  function resetUserForm() {
    setUserForm({
      name: '',
      email: '',
      role: 'Agency User',
      organization: agencies[0]?.name ?? 'Department of Planning and Investment',
      status: 'active',
    });
    setEditingUserId(null);
    setShowUserModal(false);
  }

  function resetAgencyForm() {
    setAgencyForm({
      name: '',
      shortName: '',
      type: 'Government',
      jurisdiction: 'Provincial',
      contactPerson: '',
      email: '',
      phone: '',
      status: 'active',
    });
    setEditingAgencyId(null);
    setShowAgencyModal(false);
  }

  function openEditUser(userId: string) {
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    setEditingUserId(userId);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      status: user.status,
    });
    setShowUserModal(true);
  }

  function openEditAgency(agencyId: string) {
    const agency = agencies.find((item) => item.id === agencyId);
    if (!agency) return;
    setEditingAgencyId(agencyId);
    setAgencyForm({
      name: agency.name,
      shortName: agency.shortName,
      type: agency.type,
      jurisdiction: agency.jurisdiction,
      contactPerson: agency.contactPerson,
      email: agency.email,
      phone: agency.phone,
      status: agency.status,
    });
    setShowAgencyModal(true);
  }

  function handleSaveUser() {
    if (editingUserId) {
      updateUser(editingUserId, userForm);
    } else {
      createUser({
        ...userForm,
        permissions: [`${userForm.role.toLowerCase().replaceAll(' ', '_')}.basic`],
      });
    }
    resetUserForm();
  }

  function handleSaveAgency() {
    if (editingAgencyId) {
      updateAgency(editingAgencyId, agencyForm);
    } else {
      createAgency(agencyForm);
    }
    resetAgencyForm();
  }

  return (
    <div className="page-shell space-y-6">
      <section className="section-panel border-sky-200 bg-sky-50/55 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
              <Settings2 size={14} />
              {copy('System Admin', 'Quản trị hệ thống')}
            </div>
            <h1 className="section-heading mb-2">{t('Admin Console')}</h1>
            <p className="section-subheading">
              {copy(
                'Control the operating model: user access, agency ownership, workflow catalogs, and the master data that keeps the platform consistent.',
                'Quản trị mô hình vận hành: phân quyền người dùng, sở hữu theo cơ quan, danh mục quy trình và master data giúp toàn hệ thống nhất quán.',
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowUserModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]"
            >
              <Plus size={16} />
              {copy('Add User', 'Thêm người dùng')}
            </button>
            <button
              onClick={() => setShowAgencyModal(true)}
              className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-3 text-sm font-semibold text-primary hover:bg-sky-50"
            >
              <Plus size={16} />
              {copy('Add Agency', 'Thêm cơ quan')}
            </button>
          </div>
        </div>
      </section>

      <div className="flex border-b border-border">
        <TabButton active={activeTab === 'overview'} icon={<FolderCog size={14} />} label={copy('Overview', 'Tổng quan')} onClick={() => setActiveTab('overview')} />
        <TabButton active={activeTab === 'access'} icon={<Users size={14} />} label={copy('Users & Roles', 'Người dùng & vai trò')} onClick={() => setActiveTab('access')} />
        <TabButton active={activeTab === 'agencies'} icon={<Building2 size={14} />} label={copy('Agency', 'Cơ quan')} onClick={() => setActiveTab('agencies')} />
        <TabButton active={activeTab === 'master_data'} icon={<Database size={14} />} label={copy('Master Data', 'Master data')} onClick={() => setActiveTab('master_data')} />
      </div>

      <section className="filter-bar">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy('Search users, agencies, or master data...', 'Tìm người dùng, cơ quan hoặc master data...')}
            className="app-input pl-9"
          />
        </div>
      </section>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <section className="section-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <Network size={16} className="text-sky-700" />
                <h2 className="section-heading mb-0">{copy('What This Admin Page Should Control', 'Trang admin này nên kiểm soát gì')}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedMasterData.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <Workflow size={16} className="text-violet-700" />
                <h2 className="section-heading mb-0">{copy('Current Governance Surface', 'Phạm vi quản trị hiện tại')}</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: copy('Projects', 'Dự án'), value: projects.length },
                  { label: copy('Project Jobs', 'Đầu việc dự án'), value: projectJobs.length },
                  { label: copy('Required Data Assignments', 'Đầu việc dữ liệu được giao'), value: requiredDataAssignments.length },
                  { label: copy('Opportunities', 'Cơ hội đầu tư'), value: opportunities.length },
                  { label: copy('Permits', 'Giấy phép'), value: permits.length },
                  { label: copy('Issues', 'Vướng mắc'), value: issues.length },
                  { label: copy('Milestones', 'Mốc tiến độ'), value: milestones.length },
                  { label: copy('Service Requests', 'Yêu cầu dịch vụ'), value: serviceRequests.length },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-lg font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="section-panel p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={16} className="text-amber-700" />
              <h2 className="section-heading mb-0">{copy('Recommended Ownership Rules', 'Quy tắc sở hữu nên áp dụng')}</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {ownershipRules.map((rule) => (
                <div key={rule} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                  {rule}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
            <section className="section-panel p-6">
              <h2 className="section-heading mb-4">{copy('Role Templates', 'Mẫu vai trò')}</h2>
              <div className="space-y-3">
                {roleOptions.map((role) => (
                  <div key={role} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={roleTone[role] || 'default'}>{t(role)}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {role === 'Government Operator' &&
                        copy('Should manage project records, publication, assignment, and execution coordination.', 'Nên quản lý hồ sơ dự án, công bố, phân công và điều phối thực thi.')}
                      {role === 'Agency User' &&
                        copy('Should receive assigned work, update progress, and submit agency-owned data or permits.', 'Nên nhận việc được giao, cập nhật tiến độ và nộp dữ liệu hoặc giấy phép thuộc cơ quan mình.')}
                      {role === 'Investor' &&
                        copy('Should discover projects, submit interest, and follow execution support for their own portfolio.', 'Nên khám phá dự án, gửi quan tâm và theo dõi hỗ trợ thực thi cho danh mục của mình.')}
                      {role === 'Admin' &&
                        copy('Should manage users, agencies, master data, and system-wide workflow settings.', 'Nên quản lý người dùng, cơ quan, master data và cấu hình quy trình toàn hệ thống.')}
                      {role === 'Executive' &&
                        copy('Should read cross-portfolio dashboards, analytics, and risk views without editing transactional data.', 'Nên xem dashboard, phân tích và rủi ro toàn danh mục mà không sửa dữ liệu giao dịch.')}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{copy('Users & Access', 'Người dùng & truy cập')}</h2>
                <StatusPill tone="info">{filteredUsers.length}</StatusPill>
              </div>
              <div className="space-y-3">
                {visibleUsers.map((user) => (
                  <DataRow key={user.id} className={user.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : ''}>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                        <StatusPill tone={roleTone[user.role] || 'default'}>{t(user.role)}</StatusPill>
                        <StatusPill tone={user.status === 'active' ? 'success' : 'warning'}>{t(user.status)}</StatusPill>
                      </div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                        <span>{user.organization}</span>
                        <span>{copy('Last login', 'Đăng nhập gần nhất')} {user.lastLogin}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditUser(user.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-primary" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' })}
                        className="rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                        title="Toggle access"
                      >
                        <Shield size={14} />
                      </button>
                    </div>
                  </DataRow>
                ))}
                {!showAllUsers && filteredUsers.length > DEFAULT_LIST_COUNT && (
                  <SeeAllButton label={t('See All')} onClick={() => setShowAllUsers(true)} />
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'agencies' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.82fr,1.18fr]">
            <section className="section-panel p-6">
              <h2 className="section-heading mb-4">{copy('Agency Ownership Model', 'Mô hình sở hữu theo cơ quan')}</h2>
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">{copy('Coordinating Unit', 'Đơn vị điều phối')}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {copy(
                      'Primary organization responsible for a project task, data request, permit, or service workflow item.',
                      'Tổ chức chính chịu trách nhiệm cho đầu việc dự án, dữ liệu được giao, giấy phép hoặc một hạng mục dịch vụ.',
                    )}
                  </p>
                </div>

              </div>
            </section>

            <section className="section-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-heading mb-0">{copy('Agency Directory', 'Danh mục cơ quan')}</h2>
                <StatusPill tone="info">{filteredAgencies.length}</StatusPill>
              </div>
              <div className="space-y-3">
                {visibleAgencies.map((agency) => (
                  <DataRow key={agency.id} className={`items-start ${agency.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{agency.name}</div>
                        <StatusPill tone="info">{agency.shortName}</StatusPill>
                        <StatusPill tone={agency.status === 'active' ? 'success' : 'warning'}>{t(agency.status)}</StatusPill>
                      </div>
                      <div className="text-xs text-slate-500">{agency.contactPerson}</div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                        <span>{agency.type}</span>
                        <span>{agency.jurisdiction}</span>
                        <span>{agency.email}</span>
                        <span>{agency.phone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{agency.activeRequests}</div>
                      <div className="text-xs text-slate-500">{copy('active requests', 'yêu cầu đang hoạt động')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditAgency(agency.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-primary">
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => updateAgency(agency.id, { status: agency.status === 'active' ? 'inactive' : 'active' })}
                        className="rounded-md p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Shield size={15} />
                      </button>
                    </div>
                  </DataRow>
                ))}
                {!showAllAgencies && filteredAgencies.length > DEFAULT_LIST_COUNT && (
                  <SeeAllButton label={t('See All')} onClick={() => setShowAllAgencies(true)} />
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'master_data' && (
        <div className="space-y-6">
          <section className="section-panel p-6">
            <div className="mb-4 flex items-center gap-2">
              <Database size={16} className="text-rose-700" />
              <h2 className="section-heading mb-0">{copy('Statuses of Each Object', 'Trạng thái của từng đối tượng')}</h2>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {masterDataCatalogs
                .filter((catalog) => !search || `${catalog.title} ${catalog.subtitle} ${catalog.values.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
                .map((catalog) => (
                  <MasterDataCard key={catalog.title} title={catalog.title} subtitle={catalog.subtitle} values={catalog.values} />
                ))}
            </div>
          </section>

        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {copy(editingUserId ? 'Edit User' : 'Add User', editingUserId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng')}
              </h3>
              <button onClick={resetUserForm} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              {[
                { label: copy('Full Name', 'Họ và tên'), key: 'name' },
                { label: 'Email', key: 'email' },
                { label: copy('Role', 'Vai trò'), key: 'role' },
                { label: copy('Organization', 'Tổ chức'), key: 'organization' },
              ].map((field) => (
                <div key={field.key} className={field.key === 'organization' ? 'sm:col-span-2' : ''}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</label>
                  {field.key === 'role' ? (
                    <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))} className="app-input">
                      {roleOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.key === 'organization' ? (
                    <select
                      value={userForm.organization}
                      onChange={(event) => setUserForm((current) => ({ ...current, organization: event.target.value }))}
                      className="app-input"
                    >
                      {agencyNameOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={userForm[field.key as keyof typeof userForm]}
                      onChange={(event) => setUserForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      className="app-input"
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{copy('Status', 'Trạng thái')}</label>
                <select value={userForm.status} onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))} className="app-input">
                  <option value="active">{copy('active', 'active')}</option>
                  <option value="inactive">{copy('inactive', 'inactive')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-border px-6 py-5">
              <button onClick={resetUserForm} className="flex-1 rounded-md border border-border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {copy('Cancel', 'Hủy')}
              </button>
              <button onClick={handleSaveUser} className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]">
                {copy('Save User', 'Lưu người dùng')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAgencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {copy(editingAgencyId ? 'Edit Agency' : 'Add Agency', editingAgencyId ? 'Chỉnh sửa cơ quan' : 'Thêm cơ quan')}
              </h3>
              <button onClick={resetAgencyForm} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              {[
                { label: copy('Agency Name', 'Tên cơ quan'), key: 'name', full: true },
                { label: copy('Short Name', 'Tên viết tắt'), key: 'shortName' },
                { label: copy('Agency Type', 'Loại cơ quan'), key: 'type' },
                { label: copy('Jurisdiction', 'Thẩm quyền'), key: 'jurisdiction' },
                { label: copy('Contact Person', 'Đầu mối liên hệ'), key: 'contactPerson' },
                { label: 'Email', key: 'email' },
                { label: copy('Phone', 'Số điện thoại'), key: 'phone' },
              ].map((field) => (
                <div key={field.key} className={field.full ? 'sm:col-span-2' : ''}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</label>
                  <input
                    value={agencyForm[field.key as keyof typeof agencyForm]}
                    onChange={(event) => setAgencyForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="app-input"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{copy('Status', 'Trạng thái')}</label>
                <select value={agencyForm.status} onChange={(event) => setAgencyForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))} className="app-input">
                  <option value="active">{copy('active', 'active')}</option>
                  <option value="inactive">{copy('inactive', 'inactive')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-border px-6 py-5">
              <button onClick={resetAgencyForm} className="flex-1 rounded-md border border-border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {copy('Cancel', 'Hủy')}
              </button>
              <button onClick={handleSaveAgency} className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]">
                {copy('Save Agency', 'Lưu cơ quan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
