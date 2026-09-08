<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">
        Administración
      </h1>
      <p class="text-muted mt-1">
        Grilla, alumnos y pagos. Ruta aparte del portal de cliente.
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">Hoy</p>
        <p class="mt-2 font-medium">Sin sesiones cargadas</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Pendiente de pago</p>
        <p class="mt-2 font-medium">—</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Área</p>
        <p class="mt-2 font-medium">Admin</p>
      </UCard>
    </div>
  </div>
</template>
