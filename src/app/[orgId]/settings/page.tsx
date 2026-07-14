'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, Users, UserPlus, Plus, X, Settings, Trash2, AlertCircle } from 'lucide-react'
import { getOrgMembers, getOrgRoles, getOrgGroups, updateMemberRole, removeMember, updateRole, createGroup, deleteGroup, addGroupMember, removeGroupMember } from '@/actions/board'
import { PERMISSION_LABELS, type Permission } from '@/actions/permissions'
import type { OrganizationRole, OrganizationGroup, OrganizationGroupMember, User } from '@prisma/client'

type Tab = 'members' | 'roles' | 'groups'

type MemberWithUser = Awaited<ReturnType<typeof getOrgMembers>>[number]
type RoleWithMeta = OrganizationRole
type GroupWithMembers = OrganizationGroup & { members: (OrganizationGroupMember & { user: User })[] }

export default function OrgSettingsPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [tab, setTab] = useState<Tab>('members')
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [roles, setRoles] = useState<RoleWithMeta[]>([])
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  // ── Role update ──
  async function handleRoleToggle(roleId: string, permission: Permission, value: boolean) {
    setSaving(roleId)
    try {
      const updated = await updateRole(roleId, { [permission]: value })
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updated } : r))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update role')
    } finally {
      setSaving(null)
    }
  }

  async function handleMemberRole(memberId: string, roleId: string) {
    setSaving(memberId)
    try {
      await updateMemberRole(orgId, memberId, roleId)
      setMembers(prev => prev.map(m => m.userId === memberId ? { ...m, roleId, role: roles.find(r => r.id === roleId)! } : m))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update member role')
    } finally {
      setSaving(null)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Remove this member from the organization?')) return
    try {
      await removeMember(orgId, userId)
      setMembers(prev => prev.filter(m => m.userId !== userId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove member')
    }
  }

  // ── Group actions ──
  const [newGroupName, setNewGroupName] = useState('')
  async function handleCreateGroup() {
    if (!newGroupName.trim()) return
    try {
      const group = await createGroup(orgId, newGroupName.trim())
      setGroups(prev => [...prev, { ...group, members: [] }])
      setNewGroupName('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create group')
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm('Delete this group?')) return
    try {
      await deleteGroup(groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete group')
    }
  }

  async function handleAddGroupMember(groupId: string, userId: string) {
    try {
      await addGroupMember(groupId, userId)
      const user = members.find(m => m.userId === userId)?.user
      if (user) {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: [...g.members, { groupId, userId, user }] } : g))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add member')
    }
  }

  async function handleRemoveGroupMember(groupId: string, userId: string) {
    try {
      await removeGroupMember(groupId, userId)
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.userId !== userId) } : g))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove member')
    }
  }

  useEffect(() => {
    let mounted = true
    Promise.all([
      getOrgMembers(orgId),
      getOrgRoles(orgId),
      getOrgGroups(orgId),
    ]).then(([m, r, g]) => {
      if (!mounted) return
      setMembers(m)
      setRoles(r)
      setGroups(g)
      setLoading(false)
    }).catch((e) => {
      if (!mounted) return
      setError(e instanceof Error ? e.message : 'Failed to load settings')
      setLoading(false)
    })
    return () => { mounted = false }
  }, [orgId])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  const nonMemberUsers = members.filter(m => !groups.some(g => g.members.some(gm => gm.userId === m.userId)))

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background/50 p-8 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings size={24} className="text-foreground/50" />
          <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {([
            { key: 'members', label: 'Members', icon: <Users size={16} /> },
            { key: 'roles', label: 'Roles', icon: <Shield size={16} /> },
            { key: 'groups', label: 'Groups', icon: <UserPlus size={16} /> },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Members Tab ── */}
        {tab === 'members' && (
          <div className="bg-white border border-border/50 rounded-md overflow-hidden">
            <div className="divide-y divide-border/50">
              {members.map(m => (
                <div key={m.userId} className="flex items-center justify-between p-4 hover:bg-panel/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(m.user.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{m.user.name || 'Unknown'}</p>
                      <p className="text-xs text-foreground/50">{m.user.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={m.roleId}
                      onChange={e => handleMemberRole(m.userId, e.target.value)}
                      disabled={saving === m.userId}
                      className="px-3 py-1.5 bg-background border border-border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1.5 text-foreground/40 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Roles Tab ── */}
        {tab === 'roles' && (
          <div className="space-y-6">
            {roles.map(role => (
              <div key={role.id} className="bg-white border border-border/50 rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{role.name}</h3>
                    {role.description && <p className="text-sm text-foreground/50 mt-0.5">{role.description}</p>}
                  </div>
                  {role.isDefault && <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded">Default</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(PERMISSION_LABELS) as Permission[]).map(perm => (
                    <label key={perm} className="flex items-center gap-3 p-2 rounded hover:bg-panel/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(role as unknown as Record<string, boolean>)[perm]}
                        onChange={e => handleRoleToggle(role.id, perm, e.target.checked)}
                        disabled={saving === role.id}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                      <span className="text-sm text-foreground/80">{PERMISSION_LABELS[perm]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Groups Tab ── */}
        {tab === 'groups' && (
          <div className="space-y-6">
            {/* Create group */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="New group name"
                className="flex-1 px-4 py-2.5 bg-white border border-border rounded-lg outline-none focus:border-primary/50 text-sm"
              />
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus size={16} /> Create
              </button>
            </div>

            {groups.map(group => (
              <div key={group.id} className="bg-white border border-border/50 rounded-md">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <h3 className="font-semibold text-foreground">{group.name} <span className="text-sm font-normal text-foreground/50">({group.members.length} members)</span></h3>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1.5 text-foreground/40 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-4">
                  {/* Current members */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {group.members.map(gm => (
                      <div key={gm.userId} className="flex items-center gap-2 px-3 py-1.5 bg-panel rounded-full text-sm">
                        <span className="font-medium text-foreground">{gm.user.name || gm.userId.slice(0, 8)}</span>
                        <button onClick={() => handleRemoveGroupMember(group.id, gm.userId)} className="text-foreground/40 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add member dropdown */}
                  <select
                    value=""
                    onChange={e => { if (e.target.value) handleAddGroupMember(group.id, e.target.value) }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Add a member...</option>
                    {nonMemberUsers.filter(m => !group.members.some(gm => gm.userId === m.userId)).map(m => (
                      <option key={m.userId} value={m.userId}>{m.user.name || m.user.email || m.userId}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {groups.length === 0 && (
              <div className="text-center py-12 text-foreground/50">
                <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No groups yet</p>
                <p className="text-sm mt-1">Create groups to organize your team members.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
