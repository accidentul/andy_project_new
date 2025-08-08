"use client"

import { useEffect, useState } from "react"
import { createConnector, listConnectors } from "@/lib/api"
import { getAuthToken } from "@/lib/api"
import { hasPermission } from "@/lib/auth"

export default function AdminConnectorsPage() {
  const token = getAuthToken()
  const canCreate = hasPermission(token, "crm.write")
  const canView = hasPermission(token, "crm.read") || canCreate
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!canView) {
        setLoading(false)
        return
      }
      try {
        const res = await listConnectors()
        setItems(res as any[])
      } catch (e: any) {
        setError(e?.message || "Failed to load connectors")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [canView])

  if (!token) return <div className="p-6">Please login.</div>
  if (!canView) return <div className="p-6">You do not have access to this page.</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Connectors</h1>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0c0c14]/80 border border-gray-800/50 rounded-xl p-4">
            <h2 className="font-medium mb-3">Existing Connectors</h2>
            <ul className="space-y-2 text-sm">
              {items.map((c) => (
                <li key={c.id} className="flex justify-between items-center border border-gray-800 rounded-md p-2">
                  <div>
                    <div className="font-medium capitalize">{c.provider}</div>
                    <div className="text-gray-400 text-xs">Created {new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={`text-xs rounded px-2 py-0.5 ${c.active ? 'bg-green-600/30 text-green-300' : 'bg-gray-700 text-gray-300'}`}>{c.active ? 'Active' : 'Inactive'}</span>
                </li>
              ))}
              {!items.length && <li className="text-gray-400">No connectors yet.</li>}
            </ul>
          </div>

          {canCreate && <CreateConnectorForm onCreated={(conn) => setItems((prev) => [conn, ...prev])} />}
        </div>
      )}
    </div>
  )
}

function CreateConnectorForm({ onCreated }: { onCreated: (c: any) => void }) {
  const [provider, setProvider] = useState<'salesforce' | 'hubspot'>('hubspot')
  const [credentials, setCredentials] = useState('{"apiKey":""}')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const creds = JSON.parse(credentials)
      const created = await createConnector({ provider, credentials: creds })
      onCreated(created)
      setSuccess('Connector created')
    } catch (err: any) {
      setError(err?.message || 'Failed to create connector (check JSON)')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0c0c14]/80 border border-gray-800/50 rounded-xl p-4">
      <h2 className="font-medium mb-3">Create Connector</h2>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div>
          <label className="text-gray-400">Provider</label>
          <select className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={provider} onChange={(e) => setProvider(e.target.value as any)}>
            <option value="hubspot">HubSpot</option>
            <option value="salesforce">Salesforce</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400">Credentials (JSON)</label>
          <textarea rows={6} className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={credentials} onChange={(e) => setCredentials(e.target.value)} />
          <div className="text-xs text-gray-500 mt-1">Example HubSpot: {`{"apiKey":"..."}`}. Example Salesforce OAuth: {`{"clientId":"...","clientSecret":"...","refreshToken":"...","instanceUrl":"..."}`}</div>
        </div>
        {error && <div className="text-red-400">{error}</div>}
        {success && <div className="text-green-400">{success}</div>}
        <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-md py-2 px-3" disabled={loading}>{loading ? 'Creating...' : 'Create Connector'}</button>
      </form>
    </div>
  )
}
