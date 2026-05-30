import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Activity,
  Ban,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  History,
  KeyRound,
  Mail,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DataRow } from '../../components/ui/data-row';
import { StatusPill } from '../../components/ui/status-pill';

type AdminPortalType = 'Admin Portal' | 'Agency Portal';
type PlatformAccessType = 'Investor' | AdminPortalType;
type InvitationStatus = 'Pending' | 'Accepted' | 'Expired' | 'Revoked';
type AccountStatus = 'Invited' | 'Active' | 'Inactive';
type MembershipStatus = 'Pending' | 'Active' | 'Inactive' | 'Removed';
type PermissionMode = 'direct' | 'role-derived';
type InvestorProfileStatus = 'Not applicable' | 'Incomplete' | 'Pending review' | 'Complete';

interface PortalOption {
  id: string;
  name: string;
  type: AdminPortalType;
}

interface RoleOption {
  id: string;
  name: string;
  portalType: AdminPortalType;
  permissions: string[];
  permissionMode: PermissionMode;
}

interface AdminInvitation {
  id: string;
  email: string;
  portalId: string;
  roleId: string;
  status: InvitationStatus;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  accountPath: 'First access sign-up' | 'Existing account' | 'Existing investor account';
}

interface PortalMembership {
  id: string;
  userId: string;
  portalId: string;
  roleId: string;
  status: MembershipStatus;
  featurePermissions: string[];
}

interface AdminUserAccess {
  id: string;
  name: string;
  email: string;
  accountStatus: AccountStatus;
  lastActivity: string;
  source: 'Admin/Agency' | 'Investor account + Admin/Agency access' | 'Investor only';
  investorProfileStatus: InvestorProfileStatus;
  investorOrganization?: string;
  investorIntakeCount?: number;
  joinedProjectCount?: number;
}

interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  target: string;
  detail: string;
  at: string;
}

const portalTypeOptions: AdminPortalType[] = ['Admin Portal', 'Agency Portal'];
const invitationStatusOptions: Array<'All' | InvitationStatus> = ['All', 'Pending', 'Accepted', 'Expired', 'Revoked'];
const accountStatusOptions: Array<'All' | AccountStatus> = ['All', 'Invited', 'Active', 'Inactive'];
const portalTypeFilterOptions: Array<'All' | AdminPortalType> = ['All', 'Admin Portal', 'Agency Portal'];
const accessTypeFilterOptions: Array<'All' | PlatformAccessType> = ['All', 'Investor', 'Admin Portal', 'Agency Portal'];
const membershipStatusOptions: MembershipStatus[] = ['Pending', 'Active', 'Inactive', 'Removed'];
const directPermissionOptions = [
  'admin.dashboard.view',
  'user.view',
  'user.invite',
  'user.edit',
  'user.status.manage',
  'portal_membership.view',
  'portal_membership.manage',
  'role.view',
  'role.manage',
  'role.assign',
  'permission_matrix.view',
  'permission_matrix.manage',
  'audit_log.view',
  'agency.member.view',
  'agency.member.invite',
  'agency.member.role.assign',
  'project.view',
  'project.create',
  'project.update',
  'project.submit',
  'project.review',
  'project.approve',
  'project.publish',
  'agency.audit.view',
];

const adminPortal: PortalOption = {
  id: 'admin-portal',
  name: 'Admin Portal',
  type: 'Admin Portal',
};

const roleOptions: RoleOption[] = [
  {
    id: 'platform-admin',
    name: 'Platform Admin',
    portalType: 'Admin Portal',
    permissions: [
      'admin.dashboard.view',
      'user.view',
      'user.invite',
      'user.edit',
      'user.status.manage',
      'portal_membership.view',
      'portal_membership.manage',
      'role.view',
      'role.manage',
      'role.assign',
      'permission_matrix.view',
      'permission_matrix.manage',
      'audit_log.view',
    ],
    permissionMode: 'direct',
  },
  {
    id: 'platform-operator',
    name: 'Platform Operator',
    portalType: 'Admin Portal',
    permissions: ['admin.dashboard.view', 'user.view', 'portal_membership.view', 'role.view', 'permission_matrix.view', 'audit_log.view'],
    permissionMode: 'direct',
  },
  {
    id: 'agency-owner',
    name: 'Agency Owner',
    portalType: 'Agency Portal',
    permissions: [
      'agency.member.view',
      'agency.member.invite',
      'agency.member.role.assign',
      'project.view',
      'project.create',
      'project.update',
      'project.submit',
      'agency.audit.view',
    ],
    permissionMode: 'direct',
  },
  {
    id: 'agency-operator',
    name: 'Agency Operator',
    portalType: 'Agency Portal',
    permissions: ['agency.member.view', 'project.view', 'project.create', 'project.update', 'project.submit', 'agency.audit.view'],
    permissionMode: 'direct',
  },
  {
    id: 'agency-editor',
    name: 'Agency Editor',
    portalType: 'Agency Portal',
    permissions: ['project.view', 'project.create', 'project.update'],
    permissionMode: 'role-derived',
  },
  {
    id: 'agency-viewer',
    name: 'Agency Viewer',
    portalType: 'Agency Portal',
    permissions: ['project.view'],
    permissionMode: 'role-derived',
  },
  {
    id: 'project-authority-reviewer',
    name: 'Project Authority Reviewer',
    portalType: 'Agency Portal',
    permissions: ['project.view', 'project.review', 'project.approve', 'project.publish', 'agency.audit.view'],
    permissionMode: 'role-derived',
  },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateTime(date: Date) {
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status: InvitationStatus | AccountStatus | MembershipStatus): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'Active' || status === 'Accepted') return 'success';
  if (status === 'Pending' || status === 'Invited') return 'info';
  if (status === 'Inactive' || status === 'Expired') return 'warning';
  if (status === 'Removed' || status === 'Revoked') return 'danger';
  return 'default';
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

export default function AdminPage() {
  const { agencies, users } = useApp();
  const [searchParams] = useSearchParams();
  const agencyPortals: PortalOption[] = useMemo(
    () =>
      agencies.slice(0, 7).map((agency) => ({
        id: agency.id,
        name: agency.name,
        type: 'Agency Portal',
      })),
    [agencies],
  );
  const portals = useMemo(() => [adminPortal, ...agencyPortals], [agencyPortals]);
  const initialAgencyPortal = agencyPortals[0]?.id ?? adminPortal.id;
  const initialSecondAgencyPortal = agencyPortals[1]?.id ?? initialAgencyPortal;
  const existingInvestorEmail = users.find((user) => user.role === 'Investor')?.email ?? 'kjw@kip.co.kr';

  const requestedTab = searchParams.get('tab');
  const activeTab: 'invitations' | 'users' | 'audit' =
    requestedTab === 'users' || requestedTab === 'audit' || requestedTab === 'invitations' ? requestedTab : 'invitations';
  const [search, setSearch] = useState('');
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<'All' | InvitationStatus>('All');
  const [accountStatusFilter, setAccountStatusFilter] = useState<'All' | AccountStatus>('All');
  const [accessTypeFilter, setAccessTypeFilter] = useState<'All' | PlatformAccessType>('All');
  const [userInvitationStatusFilter, setUserInvitationStatusFilter] = useState<'All' | InvitationStatus>('All');
  const [userPortalTypeFilter, setUserPortalTypeFilter] = useState<'All' | AdminPortalType>('All');
  const [userPortalFilter, setUserPortalFilter] = useState('All');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    portalType: 'Agency Portal' as AdminPortalType,
    portalId: initialAgencyPortal,
    roleId: 'agency-owner',
  });
  const [membershipForm, setMembershipForm] = useState({
    portalType: 'Agency Portal' as AdminPortalType,
    portalId: initialAgencyPortal,
    roleId: 'agency-operator',
  });

  const [adminUsers, setAdminUsers] = useState<AdminUserAccess[]>([
    {
      id: 'admin-user-1',
      name: 'Admin System',
      email: 'admin@mpi.gov.vn',
      accountStatus: 'Active',
      lastActivity: '28/05/2026 09:15',
      source: 'Admin/Agency',
      investorProfileStatus: 'Not applicable',
    },
    {
      id: 'admin-user-2',
      name: 'Pham Gia Huy',
      email: 'pghuy.skhdt@hcmc.gov.vn',
      accountStatus: 'Active',
      lastActivity: '28/05/2026 08:40',
      source: 'Admin/Agency',
      investorProfileStatus: 'Not applicable',
    },
    {
      id: 'admin-user-3',
      name: 'Kim Jae-won',
      email: existingInvestorEmail,
      accountStatus: 'Active',
      lastActivity: '27/05/2026 17:20',
      source: 'Investor account + Admin/Agency access',
      investorProfileStatus: 'Complete',
      investorOrganization: 'Korea Infrastructure Partners',
      investorIntakeCount: 3,
      joinedProjectCount: 2,
    },
    {
      id: 'investor-user-1',
      name: 'Maria Santos',
      email: 'maria.santos@globalcapital.com',
      accountStatus: 'Active',
      lastActivity: '26/05/2026 14:12',
      source: 'Investor only',
      investorProfileStatus: 'Pending review',
      investorOrganization: 'Global Capital Partners',
      investorIntakeCount: 1,
      joinedProjectCount: 0,
    },
  ]);

  const [memberships, setMemberships] = useState<PortalMembership[]>([
    {
      id: 'mem-admin-1',
      userId: 'admin-user-1',
      portalId: adminPortal.id,
      roleId: 'platform-admin',
      status: 'Active',
      featurePermissions: [
        'admin.dashboard.view',
        'user.view',
        'user.invite',
        'user.edit',
        'user.status.manage',
        'portal_membership.view',
        'portal_membership.manage',
        'role.view',
        'role.manage',
        'role.assign',
        'permission_matrix.view',
        'permission_matrix.manage',
        'audit_log.view',
      ],
    },
    {
      id: 'mem-agency-1',
      userId: 'admin-user-2',
      portalId: initialAgencyPortal,
      roleId: 'agency-owner',
      status: 'Active',
      featurePermissions: [
        'agency.member.view',
        'agency.member.invite',
        'agency.member.role.assign',
        'project.view',
        'project.create',
        'project.update',
        'project.submit',
        'agency.audit.view',
      ],
    },
    {
      id: 'mem-agency-1b',
      userId: 'admin-user-2',
      portalId: initialSecondAgencyPortal,
      roleId: 'agency-operator',
      status: 'Active',
      featurePermissions: ['agency.member.view', 'project.view', 'project.create', 'project.update', 'project.submit', 'agency.audit.view'],
    },
    {
      id: 'mem-admin-2',
      userId: 'admin-user-2',
      portalId: adminPortal.id,
      roleId: 'platform-operator',
      status: 'Inactive',
      featurePermissions: ['admin.dashboard.view', 'user.view', 'portal_membership.view', 'role.view', 'permission_matrix.view', 'audit_log.view'],
    },
    {
      id: 'mem-agency-2',
      userId: 'admin-user-3',
      portalId: initialSecondAgencyPortal,
      roleId: 'agency-viewer',
      status: 'Active',
      featurePermissions: ['project.view'],
    },
  ]);

  const [invitations, setInvitations] = useState<AdminInvitation[]>([
    {
      id: 'invite-1',
      email: 'new.member@hcmc.gov.vn',
      portalId: initialAgencyPortal,
      roleId: 'agency-operator',
      status: 'Pending',
      invitedBy: 'System Admin',
      invitedAt: '28/05/2026 09:00',
      expiresAt: '31/05/2026 09:00',
      accountPath: 'First access sign-up',
    },
    {
      id: 'invite-2',
      email: existingInvestorEmail,
      portalId: initialSecondAgencyPortal,
      roleId: 'agency-viewer',
      status: 'Accepted',
      invitedBy: 'System Admin',
      invitedAt: '27/05/2026 15:20',
      expiresAt: '30/05/2026 15:20',
      accountPath: 'Existing investor account',
    },
  ]);

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      id: 'audit-1',
      action: 'Invitation accepted',
      actor: 'System Admin',
      target: existingInvestorEmail,
      detail: 'Activated Agency Portal membership; Investor Portal remains isolated.',
      at: '27/05/2026 15:28',
    },
    {
      id: 'audit-2',
      action: 'Role assigned',
      actor: 'System Admin',
      target: 'Pham Gia Huy',
      detail: 'Assigned Agency Owner in selected Agency Portal.',
      at: '28/05/2026 08:40',
    },
  ]);

  const selectedUser = adminUsers.find((user) => user.id === selectedUserId) ?? null;

  const availablePortals = useMemo(() => portals.filter((portal) => portal.type === inviteForm.portalType), [inviteForm.portalType, portals]);
  const availableRoles = useMemo(() => roleOptions.filter((role) => role.portalType === inviteForm.portalType), [inviteForm.portalType]);
  const membershipPortals = useMemo(() => portals.filter((portal) => portal.type === membershipForm.portalType), [membershipForm.portalType, portals]);
  const membershipRoles = useMemo(() => roleOptions.filter((role) => role.portalType === membershipForm.portalType), [membershipForm.portalType]);
  const userPortalFilterOptions = useMemo(
    () => portals.filter((portal) => userPortalTypeFilter === 'All' || portal.type === userPortalTypeFilter),
    [portals, userPortalTypeFilter],
  );
  const userRoleFilterOptions = useMemo(
    () => roleOptions.filter((role) => userPortalTypeFilter === 'All' || role.portalType === userPortalTypeFilter),
    [userPortalTypeFilter],
  );

  const getPortal = (portalId: string) => portals.find((portal) => portal.id === portalId) ?? adminPortal;
  const getRole = (roleId: string) => roleOptions.find((role) => role.id === roleId) ?? roleOptions[0];
  const userMemberships = (userId: string) => memberships.filter((membership) => membership.userId === userId && membership.status !== 'Removed');
  const latestInvitationFor = (email: string) => invitations.find((invitation) => invitation.email.toLowerCase() === email.toLowerCase());
  const userAccessTypes = (user: AdminUserAccess): PlatformAccessType[] => {
    const accessTypes: PlatformAccessType[] = [];
    if (user.investorProfileStatus !== 'Not applicable') accessTypes.push('Investor');
    userMemberships(user.id).forEach((membership) => {
      const portalType = getPortal(membership.portalId).type;
      if (!accessTypes.includes(portalType)) accessTypes.push(portalType);
    });
    return accessTypes;
  };

  const filteredInvitations = invitations.filter((invitation) => {
    const portal = getPortal(invitation.portalId);
    const role = getRole(invitation.roleId);
    const text = `${invitation.email} ${portal.name} ${role.name} ${invitation.status}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (invitationStatusFilter === 'All' || invitation.status === invitationStatusFilter);
  });

  const filteredUsers = adminUsers.filter((user) => {
    const relatedMemberships = userMemberships(user.id);
    const latestInvitation = latestInvitationFor(user.email);
    const accessTypes = userAccessTypes(user);
    const matchesPortalType =
      userPortalTypeFilter === 'All' || relatedMemberships.some((membership) => getPortal(membership.portalId).type === userPortalTypeFilter);
    const matchesAccessType = accessTypeFilter === 'All' || accessTypes.includes(accessTypeFilter);
    const matchesPortal = userPortalFilter === 'All' || relatedMemberships.some((membership) => membership.portalId === userPortalFilter);
    const matchesRole = userRoleFilter === 'All' || relatedMemberships.some((membership) => membership.roleId === userRoleFilter);
    const matchesInvitationStatus = userInvitationStatusFilter === 'All' || latestInvitation?.status === userInvitationStatusFilter;
    const userText = [
      user.name,
      user.email,
      user.accountStatus,
      user.source,
      accessTypes.join(' '),
      user.investorOrganization ?? '',
      user.investorProfileStatus,
      relatedMemberships
        .map((membership) => `${getPortal(membership.portalId).name} ${getRole(membership.roleId).name}`)
        .join(' '),
    ]
      .join(' ')
      .toLowerCase();
    return (
      (!search || userText.includes(search.toLowerCase())) &&
      (accountStatusFilter === 'All' || user.accountStatus === accountStatusFilter) &&
      matchesAccessType &&
      matchesPortalType &&
      matchesPortal &&
      matchesRole &&
      matchesInvitationStatus
    );
  });

  const addAudit = (action: string, target: string, detail: string) => {
    setAuditEvents((current) => [
      {
        id: id('audit'),
        action,
        actor: 'System Admin',
        target,
        detail,
        at: formatDateTime(new Date()),
      },
      ...current,
    ]);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const handlePortalTypeChange = (portalType: AdminPortalType) => {
    const nextPortalId = portals.find((portal) => portal.type === portalType)?.id ?? adminPortal.id;
    const nextRoleId = roleOptions.find((role) => role.portalType === portalType)?.id ?? roleOptions[0].id;
    setInviteForm((current) => ({ ...current, portalType, portalId: nextPortalId, roleId: nextRoleId }));
  };

  const handleMembershipPortalTypeChange = (portalType: AdminPortalType) => {
    const nextPortalId = portals.find((portal) => portal.type === portalType)?.id ?? adminPortal.id;
    const nextRoleId = roleOptions.find((role) => role.portalType === portalType)?.id ?? roleOptions[0].id;
    setMembershipForm({ portalType, portalId: nextPortalId, roleId: nextRoleId });
  };

  const handleUserPortalTypeFilterChange = (portalType: 'All' | AdminPortalType) => {
    setUserPortalTypeFilter(portalType);
    setUserPortalFilter('All');
    setUserRoleFilter('All');
  };

  const createInvitation = () => {
    const email = inviteForm.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      showToast('Enter a valid email before sending invitation.');
      return;
    }
    if (invitations.some((invitation) => invitation.email.toLowerCase() === email && invitation.portalId === inviteForm.portalId && invitation.status === 'Pending')) {
      showToast('A Pending invitation already exists for this email and portal.');
      return;
    }

    const now = new Date();
    const existingUser = adminUsers.find((user) => user.email.toLowerCase() === email);
    const isInvestorAccount = users.some((user) => user.email.toLowerCase() === email && user.role === 'Investor');
    const invitation: AdminInvitation = {
      id: id('invite'),
      email,
      portalId: inviteForm.portalId,
      roleId: inviteForm.roleId,
      status: 'Pending',
      invitedBy: 'System Admin',
      invitedAt: formatDateTime(now),
      expiresAt: formatDateTime(addDays(now, 3)),
      accountPath: isInvestorAccount ? 'Existing investor account' : existingUser ? 'Existing account' : 'First access sign-up',
    };

    setInvitations((current) => [invitation, ...current]);
    if (!existingUser) {
      setAdminUsers((current) => [
        {
          id: id('user'),
          name: email.split('@')[0].replace(/[._-]/g, ' '),
          email,
          accountStatus: 'Invited',
          lastActivity: 'No login yet',
          source: isInvestorAccount ? 'Investor account + Admin/Agency access' : 'Admin/Agency',
          investorProfileStatus: isInvestorAccount ? 'Complete' : 'Not applicable',
          investorOrganization: isInvestorAccount ? users.find((item) => item.email.toLowerCase() === email && item.role === 'Investor')?.organization : undefined,
          investorIntakeCount: isInvestorAccount ? 1 : undefined,
          joinedProjectCount: isInvestorAccount ? 1 : undefined,
        },
        ...current,
      ]);
    }
    addAudit('Invitation sent', email, `Assigned ${getRole(inviteForm.roleId).name} in ${getPortal(inviteForm.portalId).name}; expiry defaults to 3 days.`);
    setInviteForm((current) => ({ ...current, email: '' }));
    showToast('Invitation created with 3-day expiry.');
  };

  const resendInvitation = (invitationId: string) => {
    const now = new Date();
    setInvitations((current) =>
      current.map((invitation) =>
        invitation.id === invitationId
          ? { ...invitation, status: 'Pending', invitedAt: formatDateTime(now), expiresAt: formatDateTime(addDays(now, 3)) }
          : invitation,
      ),
    );
    const invitation = invitations.find((item) => item.id === invitationId);
    if (invitation) addAudit('Invitation resent', invitation.email, 'Invitation reset to Pending with a new 3-day expiry.');
    showToast('Invitation resent.');
  };

  const revokeInvitation = (invitationId: string) => {
    const invitation = invitations.find((item) => item.id === invitationId);
    setInvitations((current) => current.map((item) => (item.id === invitationId ? { ...item, status: 'Revoked' } : item)));
    if (invitation) addAudit('Invitation revoked', invitation.email, 'Pending invitation was revoked before acceptance.');
    showToast('Invitation revoked.');
  };

  const acceptInvitation = (invitationId: string) => {
    const invitation = invitations.find((item) => item.id === invitationId);
    if (!invitation || invitation.status === 'Revoked' || invitation.status === 'Expired') return;
    const user = adminUsers.find((item) => item.email.toLowerCase() === invitation.email.toLowerCase());
    const userId = user?.id ?? id('user');

    if (!user) {
      setAdminUsers((current) => [
        {
          id: userId,
          name: invitation.email.split('@')[0].replace(/[._-]/g, ' '),
          email: invitation.email,
          accountStatus: 'Active',
          lastActivity: formatDateTime(new Date()),
          source: invitation.accountPath === 'Existing investor account' ? 'Investor account + Admin/Agency access' : 'Admin/Agency',
          investorProfileStatus: invitation.accountPath === 'Existing investor account' ? 'Complete' : 'Not applicable',
          investorOrganization:
            invitation.accountPath === 'Existing investor account'
              ? users.find((item) => item.email.toLowerCase() === invitation.email.toLowerCase() && item.role === 'Investor')?.organization
              : undefined,
          investorIntakeCount: invitation.accountPath === 'Existing investor account' ? 1 : undefined,
          joinedProjectCount: invitation.accountPath === 'Existing investor account' ? 1 : undefined,
        },
        ...current,
      ]);
    } else {
      setAdminUsers((current) =>
        current.map((item) => (item.id === userId ? { ...item, accountStatus: 'Active', lastActivity: formatDateTime(new Date()) } : item)),
      );
    }

    setInvitations((current) => current.map((item) => (item.id === invitationId ? { ...item, status: 'Accepted' } : item)));
    setMemberships((current) => [
      {
        id: id('mem'),
        userId,
        portalId: invitation.portalId,
        roleId: invitation.roleId,
        status: 'Active',
        featurePermissions: getRole(invitation.roleId).permissions,
      },
      ...current.filter((item) => !(item.userId === userId && item.portalId === invitation.portalId)),
    ]);
    addAudit('Invitation accepted', invitation.email, `${invitation.accountPath}; routed to ${getPortal(invitation.portalId).name}.`);
    showToast('Invitation accepted in prototype.');
  };

  const updateUserStatus = (userId: string, status: AccountStatus) => {
    const user = adminUsers.find((item) => item.id === userId);
    setAdminUsers((current) => current.map((item) => (item.id === userId ? { ...item, accountStatus: status, lastActivity: formatDateTime(new Date()) } : item)));
    if (user) addAudit('User status updated', user.email, `Account status changed to ${status}.`);
  };

  const removeUserAccess = (userId: string) => {
    const user = adminUsers.find((item) => item.id === userId);
    setMemberships((current) => current.map((membership) => (membership.userId === userId ? { ...membership, status: 'Removed' } : membership)));
    setAdminUsers((current) => current.map((item) => (item.id === userId ? { ...item, accountStatus: 'Inactive' } : item)));
    if (user) addAudit('User access removed', user.email, 'All Admin/Agency memberships marked as Removed; audit history retained.');
    showToast('Access removed in prototype.');
  };

  const addMembership = () => {
    if (!selectedUser) return;
    if (memberships.some((membership) => membership.userId === selectedUser.id && membership.portalId === membershipForm.portalId && membership.status !== 'Removed')) {
      showToast('This user already has active or pending membership in that portal.');
      return;
    }
    const role = getRole(membershipForm.roleId);
    setMemberships((current) => [
      {
        id: id('mem'),
        userId: selectedUser.id,
        portalId: membershipForm.portalId,
        roleId: membershipForm.roleId,
        status: 'Active',
        featurePermissions: role.permissions,
      },
      ...current,
    ]);
    addAudit('Membership added', selectedUser.email, `Added ${role.name} in ${getPortal(membershipForm.portalId).name}.`);
    showToast('Membership added.');
  };

  const updateMembershipStatus = (membershipId: string, status: MembershipStatus) => {
    const membership = memberships.find((item) => item.id === membershipId);
    const user = membership ? adminUsers.find((item) => item.id === membership.userId) : null;
    setMemberships((current) => current.map((item) => (item.id === membershipId ? { ...item, status } : item)));
    if (membership && user) addAudit('Membership status updated', user.email, `${getPortal(membership.portalId).name} membership changed to ${status}.`);
  };

  const updateMembershipRole = (membershipId: string, roleId: string) => {
    const role = getRole(roleId);
    const membership = memberships.find((item) => item.id === membershipId);
    const user = membership ? adminUsers.find((item) => item.id === membership.userId) : null;
    setMemberships((current) =>
      current.map((item) => (item.id === membershipId ? { ...item, roleId, featurePermissions: role.permissions } : item)),
    );
    if (membership && user) addAudit('Role updated', user.email, `${getPortal(membership.portalId).name} role changed to ${role.name}.`);
  };

  const togglePermission = (membershipId: string, permission: string) => {
    const membership = memberships.find((item) => item.id === membershipId);
    if (!membership) return;
    const role = getRole(membership.roleId);
    if (role.permissionMode !== 'direct') {
      showToast('Permissions are display-only for role-derived roles.');
      return;
    }
    setMemberships((current) =>
      current.map((item) =>
        item.id === membershipId
          ? {
              ...item,
              featurePermissions: item.featurePermissions.includes(permission)
                ? item.featurePermissions.filter((value) => value !== permission)
                : [...item.featurePermissions, permission],
            }
          : item,
      ),
    );
    const user = adminUsers.find((item) => item.id === membership.userId);
    if (user) addAudit('Permission updated', user.email, `${permission} toggled for ${getPortal(membership.portalId).name}.`);
  };

  const kpis = [
    { label: 'Pending invitations', value: invitations.filter((item) => item.status === 'Pending').length, icon: <Clock size={18} /> },
    { label: 'Active users', value: adminUsers.filter((item) => item.accountStatus === 'Active').length, icon: <UserCheck size={18} /> },
    { label: 'Active memberships', value: memberships.filter((item) => item.status === 'Active').length, icon: <Shield size={18} /> },
    { label: 'Audit events', value: auditEvents.length, icon: <History size={18} /> },
  ];

  return (
    <div className="page-shell space-y-6">
      {toast && (
        <div className="fixed right-5 top-20 z-[90] border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl">
          {toast}
        </div>
      )}

      <section className="section-panel border-[#e5e7eb] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 border border-[rgba(69,95,135,0.16)] bg-[#eef3f8] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#455f87]">
              <Shield size={14} />
              Admin Portal Prototype
            </div>
            <h1 className="section-heading mb-2">User Invitation, Portal Access, and Role Control</h1>
            <p className="section-subheading">
              Interactive TSX prototype for Admin managing all platform users, inviting users to one Admin/Agency portal role, editing portal
              memberships, and reviewing audit events. Investor access is visible as a separate access domain.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="min-w-[132px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <div className="flex items-center justify-between text-[#455f87]">
                  {kpi.icon}
                  <span className="text-xl font-bold text-[#191c1e]">{kpi.value}</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-[#455f87]">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-6">
          <section className="filter-bar">
            {activeTab === 'invitations' && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative min-w-[260px] flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search invitation email, portal, role, or status..."
                    className="app-input pl-9"
                  />
                </div>
                <select value={invitationStatusFilter} onChange={(event) => setInvitationStatusFilter(event.target.value as 'All' | InvitationStatus)} className="app-input md:w-[220px] md:shrink-0">
                  {invitationStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      Invitation status: {status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr),170px,170px,170px,minmax(180px,1fr),190px,190px]">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search user name, email, portal, or role..."
                    className="app-input pl-9"
                  />
                </div>
                <select value={accountStatusFilter} onChange={(event) => setAccountStatusFilter(event.target.value as 'All' | AccountStatus)} className="app-input">
                  {accountStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      Account: {status}
                    </option>
                  ))}
                </select>
                <select value={accessTypeFilter} onChange={(event) => setAccessTypeFilter(event.target.value as 'All' | PlatformAccessType)} className="app-input">
                  {accessTypeFilterOptions.map((type) => (
                    <option key={type} value={type}>
                      Access: {type}
                    </option>
                  ))}
                </select>
                <select value={userPortalTypeFilter} onChange={(event) => handleUserPortalTypeFilterChange(event.target.value as 'All' | AdminPortalType)} className="app-input">
                  {portalTypeFilterOptions.map((type) => (
                    <option key={type} value={type}>
                      Portal type: {type}
                    </option>
                  ))}
                </select>
                <select value={userPortalFilter} onChange={(event) => setUserPortalFilter(event.target.value)} className="app-input">
                  <option value="All">Portal: All</option>
                  {userPortalFilterOptions.map((portal) => (
                    <option key={portal.id} value={portal.id}>
                      Portal: {portal.name}
                    </option>
                  ))}
                </select>
                <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)} className="app-input">
                  <option value="All">Role: All</option>
                  {userRoleFilterOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      Role: {role.name}
                    </option>
                  ))}
                </select>
                <select value={userInvitationStatusFilter} onChange={(event) => setUserInvitationStatusFilter(event.target.value as 'All' | InvitationStatus)} className="app-input">
                  {invitationStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      Invitation: {status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search audit action, target, or detail..."
                  className="app-input pl-9"
                />
              </div>
            )}
          </section>

          {activeTab === 'invitations' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
          <section className="section-panel p-6">
            <div className="mb-5 flex items-center gap-2">
              <Mail size={18} className="text-[#9D4300]" />
              <h2 className="section-heading mb-0">Invite and Assign User</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#455f87]">Email</label>
                <input
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                  className="app-input"
                  placeholder="new.member@hcmc.gov.vn"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#455f87]">Portal Type</label>
                  <select value={inviteForm.portalType} onChange={(event) => handlePortalTypeChange(event.target.value as AdminPortalType)} className="app-input">
                    {portalTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-[#6b7280]">Investor Portal is isolated and not selectable.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#455f87]">Portal</label>
                  <select value={inviteForm.portalId} onChange={(event) => setInviteForm((current) => ({ ...current, portalId: event.target.value }))} className="app-input">
                    {availablePortals.map((portal) => (
                      <option key={portal.id} value={portal.id}>
                        {portal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#455f87]">Role</label>
                <select value={inviteForm.roleId} onChange={(event) => setInviteForm((current) => ({ ...current, roleId: event.target.value }))} className="app-input">
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#455f87]">
                Invitation email includes expiry time. Default expiry is generated as <strong>created time + 3 days</strong>.
              </div>
              <button type="button" onClick={createInvitation} className="app-button w-full">
                <Plus size={16} />
                Send Invitation
              </button>
            </div>
          </section>

          <section className="section-panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[#455f87]" />
                <h2 className="section-heading mb-0">Invitation List</h2>
              </div>
              <StatusPill tone="info">{filteredInvitations.length} shown</StatusPill>
            </div>
            <div className="overflow-x-auto border border-[#e5e7eb] bg-white">
              <table className="min-w-[980px] w-full border-collapse text-left text-sm">
                <thead className="bg-[#f9fafb] text-xs font-bold uppercase tracking-[0.08em] text-[#455f87]">
                  <tr>
                    <th className="border-b border-[#e5e7eb] px-3 py-3">Email</th>
                    <th className="border-b border-[#e5e7eb] px-3 py-3">Portal</th>
                    <th className="border-b border-[#e5e7eb] px-3 py-3">Role</th>
                    <th className="border-b border-[#e5e7eb] px-3 py-3">Status</th>
                    <th className="border-b border-[#e5e7eb] px-3 py-3">Account Path</th>
                    <th className="border-b border-[#e5e7eb] px-3 py-3">Invited</th>
                    <th className="border-b border-[#e5e7eb] px-3 py-3">Expires</th>
                    <th className="border-b border-[#e5e7eb] px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvitations.map((invitation) => {
                    const portal = getPortal(invitation.portalId);
                    const role = getRole(invitation.roleId);
                    return (
                      <tr key={invitation.id} className="align-top hover:bg-[#fbfcfd]">
                        <td className="border-b border-[#eef2f7] px-3 py-3 font-semibold text-[#191c1e]">{invitation.email}</td>
                        <td className="border-b border-[#eef2f7] px-3 py-3 text-[#455f87]">
                          <div className="font-semibold text-[#191c1e]">{portal.name}</div>
                          <div className="mt-1 text-xs text-[#6b7280]">{portal.type}</div>
                        </td>
                        <td className="border-b border-[#eef2f7] px-3 py-3 text-[#455f87]">{role.name}</td>
                        <td className="border-b border-[#eef2f7] px-3 py-3"><StatusPill tone={statusTone(invitation.status)}>{invitation.status}</StatusPill></td>
                        <td className="border-b border-[#eef2f7] px-3 py-3"><StatusPill tone="default">{invitation.accountPath}</StatusPill></td>
                        <td className="border-b border-[#eef2f7] px-3 py-3 text-xs text-[#455f87]">{invitation.invitedAt}</td>
                        <td className="border-b border-[#eef2f7] px-3 py-3 text-xs text-[#455f87]">{invitation.expiresAt}</td>
                        <td className="border-b border-[#eef2f7] px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => acceptInvitation(invitation.id)} disabled={invitation.status !== 'Pending'} className="app-button-secondary px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50" title="Accept">
                              <CheckCircle2 size={14} />
                            </button>
                            <button type="button" onClick={() => resendInvitation(invitation.id)} disabled={invitation.status === 'Accepted'} className="app-button-secondary px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50" title="Resend">
                              <RefreshCcw size={14} />
                            </button>
                            <button type="button" onClick={() => revokeInvitation(invitation.id)} disabled={invitation.status !== 'Pending'} className="app-button-secondary px-3 py-2 text-red-700 disabled:cursor-not-allowed disabled:opacity-50" title="Revoke">
                              <Ban size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvitations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#6b7280]">No invitations match the current filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
            </div>
          )}

          {activeTab === 'users' && (
            <section className="section-panel p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCog size={18} className="text-[#9D4300]" />
              <h2 className="section-heading mb-0">Users and Portal Access</h2>
            </div>
            <StatusPill tone="info">{filteredUsers.length} users</StatusPill>
          </div>
          <div className="overflow-x-auto border border-[#e5e7eb] bg-white">
            <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
              <thead className="bg-[#f9fafb] text-xs font-bold uppercase tracking-[0.08em] text-[#455f87]">
                <tr>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Name</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Email</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Access Types</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Account Status</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Portal Memberships</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Assigned Roles</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Invitation Status</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3">Last Activity</th>
                  <th className="border-b border-[#e5e7eb] px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const relatedMemberships = userMemberships(user.id);
                  const invitation = latestInvitationFor(user.email);
                  const accessTypes = userAccessTypes(user);
                  return (
                    <tr key={user.id} className="align-top hover:bg-[#fbfcfd]">
                      <td className="border-b border-[#eef2f7] px-3 py-3">
                        <div className="font-semibold text-[#191c1e]">{user.name}</div>
                        {user.investorProfileStatus !== 'Not applicable' && <div className="mt-1 text-xs font-semibold text-[#9D4300]">Investor access section available</div>}
                      </td>
                      <td className="border-b border-[#eef2f7] px-3 py-3 text-[#455f87]">{user.email}</td>
                      <td className="border-b border-[#eef2f7] px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {accessTypes.length ? (
                            accessTypes.map((type) => (
                              <StatusPill key={type} tone={type === 'Investor' ? 'warning' : 'info'}>{type}</StatusPill>
                            ))
                          ) : (
                            <StatusPill tone="default">No access</StatusPill>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-[#eef2f7] px-3 py-3"><StatusPill tone={statusTone(user.accountStatus)}>{user.accountStatus}</StatusPill></td>
                      <td className="border-b border-[#eef2f7] px-3 py-3">
                        {relatedMemberships.length ? (
                          <div className="space-y-2">
                            {relatedMemberships.map((membership, index) => {
                              const portal = getPortal(membership.portalId);
                              return (
                                <div key={membership.id} className="grid grid-cols-[24px,minmax(0,1fr),90px] items-center gap-2 border border-[#eef2f7] bg-[#f9fafb] px-2 py-1.5">
                                  <span className="text-xs font-bold text-[#6b7280]">{index + 1}</span>
                                  <span className="min-w-0">
                                    <span className="block truncate font-semibold text-[#191c1e]">{portal.name}</span>
                                    <span className="block text-xs text-[#6b7280]">{portal.type}</span>
                                  </span>
                                  <StatusPill tone={statusTone(membership.status)} className="justify-center">{membership.status}</StatusPill>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-[#6b7280]">No active portal</span>
                        )}
                      </td>
                      <td className="border-b border-[#eef2f7] px-3 py-3">
                        {relatedMemberships.length ? (
                          <div className="space-y-2">
                            {relatedMemberships.map((membership, index) => (
                              <div key={membership.id} className="grid grid-cols-[24px,minmax(0,1fr)] gap-2 px-2 py-1.5">
                                <span className="text-xs font-bold text-[#6b7280]">{index + 1}</span>
                                <span className="font-semibold text-[#455f87]">{getRole(membership.roleId).name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[#6b7280]">Not assigned</span>
                        )}
                      </td>
                      <td className="border-b border-[#eef2f7] px-3 py-3">
                        {invitation ? <StatusPill tone={statusTone(invitation.status)}>{invitation.status}</StatusPill> : <span className="text-xs text-[#6b7280]">No invitation</span>}
                      </td>
                      <td className="border-b border-[#eef2f7] px-3 py-3 text-xs text-[#455f87]">{user.lastActivity}</td>
                      <td className="border-b border-[#eef2f7] px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setSelectedUserId(user.id)} className="app-button-secondary px-3 py-2" title="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateUserStatus(user.id, user.accountStatus === 'Active' ? 'Inactive' : 'Active')}
                            className="app-button-secondary px-3 py-2"
                            title={user.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            <Shield size={14} />
                          </button>
                          <button type="button" onClick={() => removeUserAccess(user.id)} className="app-button-secondary px-3 py-2 text-red-700" title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#6b7280]">No users match the current filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            </section>
          )}

          {activeTab === 'audit' && (
            <section className="section-panel p-6">
          <div className="mb-5 flex items-center gap-2">
            <History size={18} className="text-[#9D4300]" />
            <h2 className="section-heading mb-0">Read-only Audit Log</h2>
          </div>
          <div className="space-y-3">
            {auditEvents
              .filter((event) => !search || `${event.action} ${event.target} ${event.detail}`.toLowerCase().includes(search.toLowerCase()))
              .map((event) => (
                <DataRow key={event.id} className="items-start">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <StatusPill tone="info">{event.action}</StatusPill>
                      <span className="text-sm font-bold text-[#191c1e]">{event.target}</span>
                    </div>
                    <div className="text-sm text-[#455f87]">{event.detail}</div>
                    <div className="mt-2 text-xs text-[#6b7280]">By {event.actor} at {event.at}</div>
                  </div>
                </DataRow>
              ))}
          </div>
            </section>
          )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-slate-950/45">
          <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#e5e7eb] px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Edit User Access</h3>
                <p className="mt-1 text-sm text-[#455f87]">{selectedUser.name} Â· {selectedUser.email}</p>
              </div>
              <button type="button" onClick={() => setSelectedUserId(null)} className="p-2 text-[#455f87] hover:bg-[#f3f4f6]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <section className="border border-[#e5e7eb] bg-[#f9fafb] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone={statusTone(selectedUser.accountStatus)}>{selectedUser.accountStatus}</StatusPill>
                  <StatusPill tone={selectedUser.source.includes('Investor') ? 'warning' : 'default'}>{selectedUser.source}</StatusPill>
                </div>
                <div className="grid gap-3 text-sm text-[#455f87] sm:grid-cols-2">
                  <span>Invitation: {latestInvitationFor(selectedUser.email)?.status ?? 'No invitation record'}</span>
                  <span>Last activity: {selectedUser.lastActivity}</span>
                </div>
              </section>

              {selectedUser.investorProfileStatus !== 'Not applicable' && (
                <section className="border border-[#f4d0b1] bg-[#fff8f2] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#9D4300]" />
                      <h4 className="text-base font-bold text-[#191c1e]">Investor Access</h4>
                    </div>
                    <StatusPill tone="warning">Separate access domain</StatusPill>
                  </div>
                  <div className="grid gap-3 text-sm text-[#455f87] sm:grid-cols-2">
                    <span>Organization: {selectedUser.investorOrganization ?? 'Not provided'}</span>
                    <span>Profile status: {selectedUser.investorProfileStatus}</span>
                    <span>Submitted intakes: {selectedUser.investorIntakeCount ?? 0}</span>
                    <span>Joined projects: {selectedUser.joinedProjectCount ?? 0}</span>
                  </div>
                  <p className="mt-3 text-sm text-[#6b7280]">
                    Admin can see the Investor account in the unified platform user record. Investor profile and Investor Portal authorization stay
                    separated from Admin/Agency role and permission controls.
                  </p>
                </section>
              )}

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Plus size={16} className="text-[#9D4300]" />
                  <h4 className="text-base font-bold text-[#191c1e]">Add Portal Membership</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-[160px,minmax(0,1fr),190px,auto]">
                  <select value={membershipForm.portalType} onChange={(event) => handleMembershipPortalTypeChange(event.target.value as AdminPortalType)} className="app-input">
                    {portalTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select value={membershipForm.portalId} onChange={(event) => setMembershipForm((current) => ({ ...current, portalId: event.target.value }))} className="app-input">
                    {membershipPortals.map((portal) => (
                      <option key={portal.id} value={portal.id}>{portal.name}</option>
                    ))}
                  </select>
                  <select value={membershipForm.roleId} onChange={(event) => setMembershipForm((current) => ({ ...current, roleId: event.target.value }))} className="app-input">
                    {membershipRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addMembership} className="app-button px-4">
                    Add
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#6b7280]">Allowed portal types are Admin Portal and Agency Portal. Investor Portal membership is blocked in this prototype.</p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-[#9D4300]" />
                  <h4 className="text-base font-bold text-[#191c1e]">Memberships, Roles, and Permissions</h4>
                </div>
                {userMemberships(selectedUser.id).map((membership) => {
                  const portal = getPortal(membership.portalId);
                  const role = getRole(membership.roleId);
                  const roleChoices = roleOptions.filter((item) => item.portalType === portal.type);
                  const permissions = Array.from(new Set([...directPermissionOptions, ...role.permissions]));
                  return (
                    <div key={membership.id} className="border border-[#e5e7eb] bg-white p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-[#191c1e]">{portal.name}</div>
                          <div className="mt-1 text-xs text-[#455f87]">{portal.type}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={statusTone(membership.status)}>{membership.status}</StatusPill>
                          <StatusPill tone={role.permissionMode === 'direct' ? 'success' : 'default'}>
                            {role.permissionMode === 'direct' ? 'Direct permissions' : 'Role-derived permissions'}
                          </StatusPill>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),170px,170px]">
                        <select value={membership.roleId} onChange={(event) => updateMembershipRole(membership.id, event.target.value)} className="app-input">
                          {roleChoices.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                        <select value={membership.status} onChange={(event) => updateMembershipStatus(membership.id, event.target.value as MembershipStatus)} className="app-input">
                          {membershipStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => updateMembershipStatus(membership.id, 'Removed')} className="app-button-secondary text-red-700">
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {permissions.map((permission) => {
                          const checked = membership.featurePermissions.includes(permission);
                          const disabled = role.permissionMode !== 'direct';
                          return (
                            <button
                              key={permission}
                              type="button"
                              onClick={() => togglePermission(membership.id, permission)}
                              disabled={disabled}
                              className={`flex items-center justify-between border px-3 py-2 text-left text-xs font-semibold ${
                                checked ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#e5e7eb] bg-[#f9fafb] text-[#455f87]'
                              } ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-[#ed6203]'}`}
                            >
                              {permission}
                              {checked && <CheckCircle2 size={14} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <History size={16} className="text-[#9D4300]" />
                  <h4 className="text-base font-bold text-[#191c1e]">User Audit Summary</h4>
                </div>
                <div className="space-y-2">
                  {auditEvents
                    .filter((event) => event.target.toLowerCase().includes(selectedUser.email.toLowerCase()) || event.target.toLowerCase().includes(selectedUser.name.toLowerCase()))
                    .slice(0, 5)
                    .map((event) => (
                      <div key={event.id} className="border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm text-[#455f87]">
                        <strong>{event.action}</strong> Â· {event.detail}
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

