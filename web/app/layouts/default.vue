<template>
  <div>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="font-semibold tracking-tight text-lg">
          Viborea
        </NuxtLink>
      </template>
      <template #right>
        <UButton to="/cliente" color="neutral" variant="ghost">
          Área de cliente
        </UButton>
        <UButton to="/admin" color="neutral" variant="ghost">
          Administración
        </UButton>
        <Show when="signed-out">
          <UButton to="/sign-in" color="neutral">
            Entrar
          </UButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </template>
    </UHeader>
    <UMain>
      <slot />
    </UMain>
    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Viborea
        </p>
      </template>
    </UFooter>
  </div>
</template>
