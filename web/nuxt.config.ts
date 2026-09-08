export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@clerk/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      clerkPublishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
    }
  },

  clerk: {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up'
  },

  colorMode: {
    preference: 'light'
  },

  routeRules: {
    '/reservar': { proxy: 'http://app:8080/reservar' },
    '/reservar/**': { proxy: 'http://app:8080/reservar/**' }
  },

  compatibilityDate: '2026-06-30'
})
