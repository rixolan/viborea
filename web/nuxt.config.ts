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

  compatibilityDate: '2026-06-30'
})
