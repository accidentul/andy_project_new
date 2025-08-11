export type LoginResponse = {
  accessToken: string
  user: { id: string; email: string; name: string; tenantId: string; role: string }
}

const getBaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!base) throw new Error('NEXT_PUBLIC_API_BASE_URL is not set')
  return base.replace(/\/$/, '')
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('andi_token')
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('andi_token', token)
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('andi_token')
}

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const base = getBaseUrl()
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as any),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${base}${path}`, { ...init, headers })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  if (!res.ok) {
    const body = isJson ? await res.json().catch(() => ({})) : await res.text()
    const message = (body as any)?.message || (typeof body === 'string' ? body : 'Request failed')
    throw new Error(message)
  }
  return (isJson ? await res.json() : (await res.text())) as any
}

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAuthToken(data.accessToken)
  return data
}

export async function registerAdmin(input: {
  companyName: string
  companySlug: string
  adminEmail: string
  adminName: string
  adminPassword: string
  plan?: string
}) {
  return apiFetch('/api/auth/register-admin', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getMe() {
  return apiFetch('/api/users/me')
}

export type Role = { id: string; name: string; permissions: Array<{ id: string; key: string }> }

export async function listRoles(): Promise<Role[]> {
  return apiFetch('/api/users/roles')
}

export async function createRole(input: { name: string; permissionKeys: string[] }) {
  return apiFetch('/api/users/roles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function createUser(input: { email: string; name: string; password: string; roleId: string }) {
  return apiFetch('/api/users/create', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export type Connector = {
  id: string
  provider: 'salesforce' | 'hubspot'
  active: boolean
  createdAt: string
}

export async function listConnectors(): Promise<Connector[]> {
  return apiFetch('/api/connectors')
}

export async function createConnector(input: { provider: 'salesforce' | 'hubspot'; credentials: any; active?: boolean }) {
  return apiFetch('/api/connectors', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export type SuggestedWidget = {
  id: string
  title: string
  size: 'tiny' | 'small' | 'medium' | 'large'
  type: 'line' | 'bar' | 'area' | 'kpi'
  description: string
  data: any
}

export async function getAiSuggestions(): Promise<{ suggestions: SuggestedWidget[] }> {
  return apiFetch('/api/ai/suggestions')
}

export async function seedDemoCrm(connectorId: string, provider: 'salesforce' | 'hubspot') {
  return apiFetch('/api/ai/seed', {
    method: 'POST',
    body: JSON.stringify({ connectorId, provider }),
  })
}

export function logout() {
  console.log('Logout function called')
  
  // Clear auth token
  clearAuthToken()
  
  // Clear any cached user data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('andi_user')
    localStorage.removeItem('andi_token')
    sessionStorage.removeItem('fromLogin')
    
    console.log('Cleared auth data, redirecting to login...')
    
    // Force redirect to login page
    window.location.replace('/login')
  }
}
