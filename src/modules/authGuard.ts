import type { UserModule } from '~/types'
import type { AuthRole } from '~/types/auth'
import { useAuthStore } from '~/stores/auth'

type RouteRole = AuthRole | AuthRole[]

declare module 'vue-router' {
  interface RouteMeta {
    authRedirect?: string
    guestRedirect?: string
    guestOnly?: boolean
    guestOnlyRole?: RouteRole
    requiresAuth?: boolean
    requiresPendingPhone?: boolean
    requiredRole?: RouteRole
    roleRedirect?: string
  }
}

function toRoleList(role: RouteRole | undefined) {
  if (!role)
    return []

  return Array.isArray(role) ? role : [role]
}

function canAccessRole(currentRole: AuthRole | null, requiredRole: RouteRole | undefined) {
  const required = toRoleList(requiredRole)

  if (!required.length)
    return true

  if (!currentRole)
    return false

  if (required.includes(currentRole))
    return true

  return currentRole === 'superadmin' && required.includes('admin')
}

export const install: UserModule = ({ router }) => {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    auth.loadSession()

    if (to.meta.requiresAuth || to.meta.requiredRole || to.meta.guestOnly || to.meta.requiresPendingPhone)
      await auth.restoreSession()

    if (to.meta.requiresPendingPhone && !auth.pendingPhone)
      return to.meta.authRedirect ?? '/passenger/login'

    if (to.meta.guestOnly && auth.isAuthenticated && canAccessRole(auth.role, to.meta.guestOnlyRole))
      return to.meta.guestRedirect ?? '/'

    if (to.meta.requiresAuth && !auth.isAuthenticated)
      return to.meta.authRedirect ?? '/passenger/login'

    if (to.meta.requiredRole && !canAccessRole(auth.role, to.meta.requiredRole))
      return to.meta.roleRedirect ?? to.meta.authRedirect ?? '/'
  })
}
