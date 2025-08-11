"use client"

import { useEffect, useState } from "react"
import { listRoles, createRole, createUser } from "@/lib/api"
import { getAuthToken } from "@/lib/api"
import { hasPermission } from "@/lib/auth"

export default function AdminUsersPage() {
  const token = getAuthToken()
  const canManageUsers = hasPermission(token, "users.manage")
  const canManageRoles = hasPermission(token, "roles.manage")

  const [roles, setRoles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (canManageRoles || canManageUsers) {
          const rs = await listRoles()
          setRoles(rs as any[])
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load roles")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [canManageRoles, canManageUsers])

  if (!token) {
    return <div className="p-6">Please login.</div>
  }

  if (!(canManageRoles || canManageUsers)) {
    return <div className="p-6">You do not have access to this page.</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">User Management</h1>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0c0c14]/80 border border-gray-800/50 rounded-xl p-4">
            <h2 className="font-medium mb-3">Existing Roles</h2>
            <ul className="space-y-2 text-sm">
              {roles.map((r) => (
                <li key={r.id} className="flex flex-col border border-gray-800 rounded-md p-2">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-gray-400">{(r.permissions || []).map((p: any) => p.key).join(", ") || "-"}</div>
                </li>
              ))}
            </ul>
          </div>

          {canManageRoles && <CreateRoleForm onCreated={(role) => setRoles((prev) => [...prev, role])} />}
          {canManageUsers && <CreateUserForm roles={roles} />}
        </div>
      )}
    </div>
  )
}

function CreateRoleForm({ onCreated }: { onCreated: (role: any) => void }) {
  const [name, setName] = useState("")
  const [permissionKeys, setPermissionKeys] = useState("crm.read,analytics.view")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const keys = permissionKeys.split(",").map((s) => s.trim()).filter(Boolean)
      const role = await createRole({ name, permissionKeys: keys })
      onCreated(role)
      setName("")
    } catch (err: any) {
      setError(err?.message || "Failed to create role")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0c0c14]/80 border border-gray-800/50 rounded-xl p-4">
      <h2 className="font-medium mb-3">Create Role</h2>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div>
          <label className="text-gray-400">Name</label>
          <input className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-gray-400">Permissions (comma separated)</label>
          <input className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={permissionKeys} onChange={(e) => setPermissionKeys(e.target.value)} />
        </div>
        {error && <div className="text-red-400">{error}</div>}
        <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-md py-2 px-3" disabled={loading}>{loading ? "Creating..." : "Create Role"}</button>
      </form>
    </div>
  )
}

function CreateUserForm({ roles }: { roles: any[] }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState(roles[0]?.id || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (roles.length && !roleId) setRoleId(roles[0].id)
  }, [roles, roleId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await createUser({ email, name, password, roleId })
      setEmail("")
      setName("")
      setPassword("")
      setSuccess("User created")
    } catch (err: any) {
      setError(err?.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0c0c14]/80 border border-gray-800/50 rounded-xl p-4">
      <h2 className="font-medium mb-3">Create User</h2>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div>
          <label className="text-gray-400">Email</label>
          <input type="email" className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-gray-400">Name</label>
          <input className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-gray-400">Password</label>
          <input type="password" className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="text-gray-400">Role</label>
          <select className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-400">{error}</div>}
        {success && <div className="text-green-400">{success}</div>}
        <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-md py-2 px-3" disabled={loading}>{loading ? "Creating..." : "Create User"}</button>
      </form>
    </div>
  )
}
