<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'es' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
})

useSeoMeta({
  title: 'Viborea',
  description: 'Software para gestionar academias de pádel: grilla, packs y cobro adelantado.',
  ogTitle: 'Viborea',
  ogDescription: 'La operación de una academia de pádel, en un solo sistema.'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
