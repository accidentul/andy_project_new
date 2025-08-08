export type DecodedToken = {
  sub: string
  tenantId: string
  role: string
  permissions?: string[]
  exp?: number
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function hasPermission(token: string | null, required: string): boolean {
  if (!token) return false
  const decoded = decodeJwt(token)
  if (!decoded?.permissions) return false
  return decoded.permissions.includes(required)
}
