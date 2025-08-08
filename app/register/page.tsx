"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerAdmin } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState("")
  const [companySlug, setCompanySlug] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await registerAdmin({ companyName, companySlug, adminEmail, adminName, adminPassword })
      setSuccess("Company created. You can now sign in.")
      setTimeout(() => router.push("/login"), 800)
    } catch (err: any) {
      setError(err?.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-[#0c0c14]/80 border border-gray-800/50 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-white mb-4">Request Access</h1>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">Company Name</label>
            <input className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-400">Company Slug</label>
            <input className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-400">Admin Name</label>
            <input className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-400">Admin Email</label>
            <input type="email" className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-400">Admin Password</label>
            <input type="password" className="w-full mt-1 bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-white" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          {success && <div className="text-sm text-green-400">{success}</div>}
          <button disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md py-2">{isLoading ? "Submitting..." : "Create Company"}</button>
        </form>
        <div className="text-sm text-gray-400 mt-3">
          Already have an account? <a href="/login" className="text-purple-400">Login</a>
        </div>
      </div>
    </div>
  )
}
