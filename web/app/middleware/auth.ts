export default defineNuxtRouteMiddleware(() => {
  const key = useRuntimeConfig().public.clerkPublishableKey
  if (!key) return
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded.value) return
  if (!isSignedIn.value) return navigateTo('/entrar')
})
