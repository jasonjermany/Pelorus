export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { loggedIn } = useUserSession()

  const publicRoutes = ['/', '/login']
  const isPublic = publicRoutes.includes(to.path)

  if (!isPublic && !loggedIn.value) {
    return navigateTo('/login')
  }

  if (to.path === '/login' && loggedIn.value) {
    return navigateTo('/app', { replace: true })
  }
})
