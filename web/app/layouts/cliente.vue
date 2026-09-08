<template>
  <div class="min-h-dvh bg-default">
    <UHeader>
      <template #left>
        <NuxtLink to="/cliente" class="font-semibold tracking-tight">
          Viborea · Cliente
        </NuxtLink>
      </template>
      <template #right>
        <UButton to="/" color="neutral" variant="ghost" size="sm">
          Inicio
        </UButton>
        <UserButton v-if="clerkEnabled" />
      </template>
    </UHeader>
    <UMain class="mx-auto w-full max-w-5xl px-4 py-8">
      <slot />
    </UMain>
  </div>
</template>

<script setup lang="ts">
const clerkEnabled = !!useRuntimeConfig().public.clerkPublishableKey
</script>
