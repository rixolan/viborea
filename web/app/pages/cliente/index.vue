<script setup lang="ts">
definePageMeta({
  layout: 'cliente',
  middleware: ['auth']
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Tu academia
        </h1>
        <p class="text-muted mt-1">
          Próximas clases, saldo del pack y reservas.
        </p>
      </div>
      <UButton to="/reservar" trailing-icon="i-lucide-arrow-right">
        Reservar clase
      </UButton>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">Próxima clase</p>
        <p class="mt-2 font-medium">Todavía no hay reservas</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Pack</p>
        <p class="mt-2 font-medium">Sin pack activo</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Área</p>
        <p class="mt-2 font-medium">Cliente</p>
      </UCard>
    </div>
  </div>
</template>
