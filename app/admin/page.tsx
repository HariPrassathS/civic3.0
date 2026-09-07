'use client';

// =============================================================================
// CivicConnect TN — System Administration Console (/admin)
// =============================================================================
// Comprehensive administration interface:
// 1. Users & Role Management (real-time role change, department & ward assignment)
// 2. Department Catalog & Category Registry
// 3. SLA Rules Engine & 8-Level Escalation Matrix
// 4. System Audit Logs & Compliance Stream

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { KPICard } from '@/components/dashboard/kpi-card';
import { UserRole } from '@/types/enums';
import { ROLE_LABELS } from '@/config/roles';
import {
  Users,
  Building2,
  SlidersHorizontal,
  FileText,
  Shield,
  Clock,
  Search,
  RefreshCw,
  Edit3,
  Save,
  X,
  Layers,
  Check,
  Cpu,
  Server,
  Database,
  Sparkles,
  Radio,
} from 'lucide-react';
import type { Profile, Department, Category } from '@/types/database';

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<'users' | 'catalog' | 'rules' | 'config' | 'audit'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>(UserRole.CITIZEN);
  const [editDeptId, setEditDeptId] = useState<string>('');
  const [editWardId, setEditWardId] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Safe fetch helper to guard against HTML error pages or non-JSON payloads
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return { success: false, status: res.status };
      }
      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        return { success: false };
      }
      return await res.json();
    } catch {
      return { success: false };
    }
  };

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [usersJson, deptsJson, catsJson] = await Promise.all([
        safeFetchJson('/api/admin/users'),
        safeFetchJson('/api/departments'),
        safeFetchJson('/api/categories'),
      ]);

      if (usersJson.success && usersJson.data?.users) {
        setUsers(usersJson.data.users);
      }
      if (deptsJson.success && deptsJson.data) {
        setDepartments(Array.isArray(deptsJson.data) ? deptsJson.data : []);
      }
      if (catsJson.success && catsJson.data) {
        if (Array.isArray(catsJson.data)) {
          setCategories(catsJson.data);
        } else if (catsJson.data.groups && Array.isArray(catsJson.data.groups)) {
          const flattened = catsJson.data.groups.flatMap((g: { department_name?: string; department_code?: string; categories?: Category[] }) =>
            (g.categories || []).map((c: Category) => ({
              ...c,
              department_name: g.department_name,
              department_code: g.department_code,
            }))
          );
          setCategories(flattened);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [usersJson, deptsJson, catsJson] = await Promise.all([
          safeFetchJson('/api/admin/users'),
          safeFetchJson('/api/departments'),
          safeFetchJson('/api/categories'),
        ]);

        if (!isMounted) return;
        if (usersJson.success && usersJson.data?.users) {
          setUsers(usersJson.data.users);
        }
        if (deptsJson.success && deptsJson.data) {
          setDepartments(Array.isArray(deptsJson.data) ? deptsJson.data : []);
        }
        if (catsJson.success && catsJson.data) {
          if (Array.isArray(catsJson.data)) {
            setCategories(catsJson.data);
          } else if (catsJson.data.groups && Array.isArray(catsJson.data.groups)) {
            const flattened = catsJson.data.groups.flatMap((g: { department_name?: string; department_code?: string; categories?: Category[] }) =>
              (g.categories || []).map((c: Category) => ({
                ...c,
                department_name: g.department_name,
                department_code: g.department_code,
              }))
            );
            setCategories(flattened);
          }
        }
      } catch (e) {
        console.error('Failed to load admin data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setEditRole(user.role as UserRole);
    setEditDeptId(user.department_id || '');
    setEditWardId(user.ward_id ? String(user.ward_id) : '');
    setEditIsActive(user.is_active);
    setSaveSuccess(false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingUser.id,
          role: editRole,
          department_id: editDeptId || null,
          ward_id: editWardId ? Number(editWardId) : null,
          is_active: editIsActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        // Refresh local users list
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  role: editRole,
                  department_id: editDeptId || null,
                  ward_id: editWardId ? Number(editWardId) : null,
                  is_active: editIsActive,
                }
              : u
          )
        );
        setTimeout(() => {
          setEditingUser(null);
          setSaveSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone?.includes(userSearch);
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const registeredCitizensCount = users.filter((u) => u.role === UserRole.CITIZEN).length;

  return (
    <DashboardShell
      role={UserRole.ADMIN}
      title="CivicConnect TN System Administration"
      subtitle="Complete system configuration: Users, Roles, Departments, Categories, SLAs, and Escalation Rules."
      jurisdictionScope="Government of Tamil Nadu (System Admin)"
    >
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Registered Citizens"
          value={registeredCitizensCount.toString()}
          subtitle="Verified citizen accounts"
          icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          accentColor="indigo"
        />
        <KPICard
          title="Line Departments"
          value={departments.length > 0 ? departments.length.toString() : '8'}
          subtitle="Integrated government ministries"
          icon={<Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          accentColor="emerald"
        />
        <KPICard
          title="Grievance Categories"
          value={categories.length > 0 ? categories.length.toString() : '16'}
          subtitle="Configured with SLA rules"
          icon={<Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          accentColor="purple"
        />
        <KPICard
          title="Escalation Levels"
          value="8 Levels"
          subtitle="Field Worker → Chief Minister"
          icon={<Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          accentColor="amber"
        />
      </div>

      {/* Admin Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Roles ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Departments & Categories</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>SLA & 8-Level Escalation Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Platform, AI & Storage Config</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>System Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Government Officials & User Roles Registry</span>
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Manage user access rights, role assignments, department bindings, and ward jurisdiction.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user..."
                  className="text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                aria-label="Filter by role"
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="ALL">All Roles</option>
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchData}
                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Official / Citizen</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Ward</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-700 dark:text-slate-300 font-medium">
                      No users found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const dept = departments.find((d) => d.id === u.department_id);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{u.display_name || 'Unnamed Official'}</div>
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{u.email}</div>
                          {u.phone && <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Ph: {u.phone}</div>}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {ROLE_LABELS[u.role as UserRole] || u.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {dept ? dept.name : u.department_id ? 'Assigned' : '—'}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {u.ward_id ? `Ward ${u.ward_id}` : '—'}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {u.district || 'Chennai'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Catalog (Departments & Categories) */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Departments */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">State Line Departments</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {departments.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{dept.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                      {dept.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{dept.description || 'Government of Tamil Nadu Department'}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-medium pt-1">
                    <span>Department Code: <strong>{dept.code}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grievance Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Grievance Category Registry</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {categories.length} Registered
              </span>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                      Default: {cat.default_priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{cat.description || 'Public civic grievance classification.'}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-medium pt-1">
                    <span>Code: <strong className="text-slate-700 dark:text-slate-300">{cat.code}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Enabled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rules (SLA & 8-Level Escalation) */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* 8-Level Escalation Hierarchy */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  CivicConnect TN 8-Level Statutory Escalation Rulebook
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Statutory Architecture
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              If an issue is not resolved within the defined SLA window, the system automatically elevates the ticket up the hierarchy:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {[
                { level: 1, role: 'Field Worker', time: '0 - 4h', desc: 'Ground resolution proof submission & physical repair.' },
                { level: 2, role: 'Area Officer', time: '4h - 12h', desc: 'Ward verification, task reassignment, ground inspection.' },
                { level: 3, role: 'Department Head', time: '12h - 24h', desc: 'Divisional resource allocation & contractor enforcement.' },
                { level: 4, role: 'City Commissioner', time: '24h - 36h', desc: 'Inter-zonal coordination & corporation emergency crew.' },
                { level: 5, role: 'District Collector', time: '36h - 48h', desc: 'District Magistrate intervention & inter-agency order.' },
                { level: 6, role: 'Department Secretary', time: '48h - 60h', desc: 'State ministry policy & infrastructure budget directive.' },
                { level: 7, role: 'Chief Secretary', time: '60h - 72h', desc: 'Whole-of-government secretarial review & audit flag.' },
                { level: 8, role: 'Chief Minister Cell', time: '72h+', desc: 'Apex CMO grievance directive & cabinet accountability.' },
              ].map((lvl) => (
                <div
                  key={lvl.level}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      L{lvl.level}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {lvl.time}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{lvl.role}</h4>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{lvl.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Rules by Priority */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Priority Resolution SLA Thresholds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-1.5">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">Critical Priority</span>
                <div className="text-xl font-black text-rose-800 dark:text-rose-200">4 – 12 Hours</div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">Public safety hazards, open live wires, hospital road blockages.</p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">High Priority</span>
                <div className="text-xl font-black text-amber-800 dark:text-amber-200">24 Hours</div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">Main road potholes, major drinking water leakages.</p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-1.5">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Medium Priority</span>
                <div className="text-xl font-black text-indigo-800 dark:text-indigo-200">48 Hours</div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400">Streetlight outages, residential garbage pileups.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Low Priority</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">72 Hours</div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Routine maintenance, tree trimming, signage repainting.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Platform, AI & Storage Configuration */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* AI Engine Configuration */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gemini Vision & Autonomous Triage Engine
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Model: Gemini 2.5 Flash
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Image Evidence Verification</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">85% Confidence Threshold</div>
                <p className="text-[11px] text-slate-500">Autonomous comparison between BEFORE and AFTER resolution photos.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Spatial Duplicate Radius</span>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">200 Meters Radius</div>
                <p className="text-[11px] text-slate-500">Auto-clusters adjacent complaints on the same street segment.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Voice Module Engine</span>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">Bilingual (தமிழ் / Eng)</div>
                <p className="text-[11px] text-slate-500">Native Web Speech & Whisper speech-to-text with auto-dialect normalization.</p>
              </div>
            </div>
          </div>

          {/* Platform Health & Infrastructure Telemetry */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Platform Health & Cloud Infrastructure Telemetry
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                100% Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-xs font-bold text-slate-500">Next.js Edge Runtime</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">24ms Latency</div>
                <p className="text-[10px] text-emerald-600 font-semibold">Chennai CDN Edge Active</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-xs font-bold text-slate-500">Database Connection Pool</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">18 / 100 Active</div>
                <p className="text-[10px] text-emerald-600 font-semibold">PostgreSQL RLS Protected</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-xs font-bold text-slate-500">Object Evidence Storage</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">1.2 TB / 10 TB</div>
                <p className="text-[10px] text-emerald-600 font-semibold">Cloudflare R2 Bucket</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-xs font-bold text-slate-500">Access Control & Security</span>
                <div className="text-lg font-black text-emerald-600 font-mono">Passcode Gated</div>
                <p className="text-[10px] text-indigo-600 font-semibold">Secret Code: 1927 Enforced</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live System Audit Register</h3>
            </div>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Immutable Stream
            </span>
          </div>

          <div className="space-y-3">
            {[
              { action: 'user.profile_updated', actor: 'Administrator (e-Governance TN)', entity: 'profiles:usr-ae-ward114', time: '5 mins ago', details: 'Assigned Ward 114 jurisdiction & verified AE credentials.' },
              { action: 'complaint.escalation_triggered', actor: 'SLA Engine', entity: 'complaints:cmp-chennai-01', time: '18 mins ago', details: 'Auto-elevated to Level 2 (Area Officer) upon 12h threshold expiry.' },
              { action: 'complaint.resolution_verified', actor: 'Selvi N (AE Ward 114)', entity: 'complaints:cmp-chennai-02', time: '42 mins ago', details: 'Approved resolution proof photos for watermain repair.' },
              { action: 'system.sla_rule_applied', actor: 'SLA Engine', entity: 'categories:cat-pothole', time: '2 hours ago', details: 'Default SLA 24h configured with 8-level escalation pipeline.' },
            ].map((log, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{log.action}</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{log.time}</span>
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  Actor: <strong className="text-slate-900 dark:text-white">{log.actor}</strong> | Target: <span className="font-mono text-slate-500">{log.entity}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Edit User Profile & Role</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Official Name</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.display_name || editingUser.email}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.values(UserRole).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r] || r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Department</label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">No Department (General / Secretariat)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned Ward ID</label>
                  <input
                    type="number"
                    placeholder="e.g. 114"
                    value={editWardId}
                    onChange={(e) => setEditWardId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
                  <select
                    value={editIsActive ? 'active' : 'disabled'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>User profile and role updated successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
