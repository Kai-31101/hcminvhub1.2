import React, { useMemo, useState } from 'react';
import { Building2, Edit, Plus, Search, Shield, Users, X } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { translateText } from '../../utils/localization';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';

const roleTone: Record<string, 'info' | 'success' | 'warning' | 'default' | 'danger'> = {
  'Government Operator': 'info',
  'Agency User': 'success',
  Investor: 'warning',
  Admin: 'default',
  Executive: 'danger',
};

export default function AdminPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    users,
    agencies,
    createUser,
    updateUser,
    createAgency,
    updateAgency,
    language,
  } = useApp();
  const t = (value: string) => translateText(value, language);
  const highlightedId = searchParams.get('highlight');
  const [activeTab, setActiveTab] = useState<'roles' | 'agencies'>(location.pathname.includes('/agencies') ? 'agencies' : 'roles');
  const [search, setSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Agency User',
    organization: 'Department of Planning and Investment, Ho Chi Minh City',
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

  const filteredUsers = useMemo(() => users.filter((user) => (
    !search || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
  )), [search, users]);

  const filteredAgencies = useMemo(() => agencies.filter((agency) => (
    !search || agency.name.toLowerCase().includes(search.toLowerCase()) || agency.shortName.toLowerCase().includes(search.toLowerCase())
  )), [agencies, search]);

  function resetUserForm() {
    setUserForm({
      name: '',
      email: '',
      role: 'Agency User',
      organization: 'Department of Planning and Investment, Ho Chi Minh City',
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="section-heading">{t('Admin Console')}</h1>
          <p className="section-subheading">{t('Manage users, role assignments, and agency entities across the operating model.')}</p>
        </div>
        <button
          onClick={() => activeTab === 'roles' ? setShowUserModal(true) : setShowAgencyModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={16} />
          {t(activeTab === 'roles' ? 'Add User' : 'Add Agency')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: users.length, tone: 'text-sky-700' },
          { label: 'Active Users', value: users.filter((user) => user.status === 'active').length, tone: 'text-emerald-700' },
          { label: 'Agencies', value: agencies.length, tone: 'text-slate-700' },
          { label: 'Inactive Accounts', value: users.filter((user) => user.status === 'inactive').length, tone: 'text-amber-700' },
        ].map((metric) => (
          <div key={metric.label} className="kpi-tile">
            <div className={`text-4xl font-bold ${metric.tone}`} style={{ fontFamily: 'var(--font-heading)' }}>{metric.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t(metric.label)}</div>
          </div>
        ))}
      </div>

      <div className="flex border-b border-border">
        {[
          { id: 'roles', label: 'Users & Roles', icon: <Users size={14} /> },
          { id: 'agencies', label: 'Agency Management', icon: <Building2 size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as 'roles' | 'agencies'); setSearch(''); }}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {t(tab.label)}
          </button>
        ))}
      </div>

      <section className="filter-bar">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(`Search ${activeTab === 'roles' ? 'users' : 'agencies'}...`)}
            className="app-input pl-9"
          />
        </div>
      </section>

      {activeTab === 'roles' ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
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
                  <span>{t('Last login')} {user.lastLogin}</span>
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
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAgencies.map((agency) => (
            <DataRow key={agency.id} className={`items-start ${agency.id === highlightedId ? 'border-sky-300 ring-2 ring-sky-100' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900">{agency.name}</div>
                  <StatusPill tone="info">{agency.shortName}</StatusPill>
                  <StatusPill tone={agency.status === 'active' ? 'success' : 'warning'}>{t(agency.status)}</StatusPill>
                </div>
                <div className="text-xs text-slate-500">{agency.contactPerson}</div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                  <span>{agency.jurisdiction}</span>
                  <span>{agency.email}</span>
                  <span>{agency.phone}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">{agency.activeRequests}</div>
                <div className="text-xs text-slate-500">{t('active requests')}</div>
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
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900">{t(editingUserId ? 'Edit User' : 'Add User')}</h3>
              <button onClick={resetUserForm} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              {[
                { label: 'Full Name', key: 'name' },
                { label: 'Email', key: 'email' },
                { label: 'Role', key: 'role' },
                { label: 'Organization', key: 'organization' },
              ].map((field) => (
                <div key={field.key} className={field.key === 'organization' ? 'sm:col-span-2' : ''}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t(field.label)}</label>
                  {field.key === 'role' ? (
                    <select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))} className="app-input">
                      <option>Government Operator</option>
                      <option>Agency User</option>
                      <option>Investor</option>
                      <option>Admin</option>
                      <option>Executive</option>
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
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('Status')}</label>
                <select value={userForm.status} onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))} className="app-input">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-border px-6 py-5">
              <button onClick={resetUserForm} className="flex-1 rounded-md border border-border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {t('Cancel')}
              </button>
              <button onClick={handleSaveUser} className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]">
                {t('Save User')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAgencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-900">{t(editingAgencyId ? 'Edit Agency' : 'Add Agency')}</h3>
              <button onClick={resetAgencyForm} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              {[
                { label: 'Agency Name', key: 'name', full: true },
                { label: 'Short Name', key: 'shortName' },
                { label: 'Contact Person', key: 'contactPerson' },
                { label: 'Email', key: 'email' },
                { label: 'Phone', key: 'phone' },
              ].map((field) => (
                <div key={field.key} className={field.full ? 'sm:col-span-2' : ''}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t(field.label)}</label>
                  <input
                    value={agencyForm[field.key as keyof typeof agencyForm]}
                    onChange={(event) => setAgencyForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="app-input"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('Type')}</label>
                <select value={agencyForm.type} onChange={(event) => setAgencyForm((current) => ({ ...current, type: event.target.value }))} className="app-input">
                  <option>Government</option>
                  <option>Service Agency</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('Jurisdiction')}</label>
                <select value={agencyForm.jurisdiction} onChange={(event) => setAgencyForm((current) => ({ ...current, jurisdiction: event.target.value }))} className="app-input">
                  <option>Provincial</option>
                  <option>National</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('Status')}</label>
                <select value={agencyForm.status} onChange={(event) => setAgencyForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))} className="app-input">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-border px-6 py-5">
              <button onClick={resetAgencyForm} className="flex-1 rounded-md border border-border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {t('Cancel')}
              </button>
              <button onClick={handleSaveAgency} className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]">
                {t('Save Agency')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
