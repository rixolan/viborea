export default defineNuxtRouteMiddleware(() => {
  const key = useRuntimeConfig().public.clerkPublishableKey
  if (!key) return
  const { user } = useUser()
  const role = user.value?.publicMetadata?.role
  if (role !== 'admin') return navigateTo('/cliente')
})
