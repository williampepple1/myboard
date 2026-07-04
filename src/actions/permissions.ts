export const PERMISSIONS = [
  'canManageSettings',
  'canManageRoles',
  'canManageGroups',
  'canInviteMembers',
  'canRemoveMembers',
  'canCreateProject',
  'canDeleteProject',
  'canCreateTask',
  'canDeleteTask',
  'canEditTask',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_TEMPLATES = {
  Admin: {
    name: 'Admin',
    description: 'Full access to everything',
    canManageSettings: true,
    canManageRoles: true,
    canManageGroups: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canCreateProject: true,
    canDeleteProject: true,
    canCreateTask: true,
    canDeleteTask: true,
    canEditTask: true,
  },
  Member: {
    name: 'Member',
    description: 'Can create and edit tasks and projects',
    canManageSettings: false,
    canManageRoles: false,
    canManageGroups: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canCreateProject: true,
    canDeleteProject: false,
    canCreateTask: true,
    canDeleteTask: true,
    canEditTask: true,
  },
  Viewer: {
    name: 'Viewer',
    description: 'Read-only access',
    canManageSettings: false,
    canManageRoles: false,
    canManageGroups: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canCreateProject: false,
    canDeleteProject: false,
    canCreateTask: false,
    canDeleteTask: false,
    canEditTask: false,
  },
} as const

export type RolePermissions = { [K in Permission]: boolean }

export const PERMISSION_LABELS: Record<Permission, string> = {
  canManageSettings: 'Manage organization settings',
  canManageRoles: 'Manage roles and permissions',
  canManageGroups: 'Manage groups',
  canInviteMembers: 'Invite new members',
  canRemoveMembers: 'Remove members',
  canCreateProject: 'Create projects',
  canDeleteProject: 'Delete projects',
  canCreateTask: 'Create tasks',
  canDeleteTask: 'Delete tasks',
  canEditTask: 'Edit tasks',
}
