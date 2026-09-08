<template>
  <div>
    <UPageHero
      title="La academia, en un solo sistema"
      description="Viborea gestiona la grilla de pádel: sede, pista, entrenador y horario. Packs o clase suelta, cobro adelantado, sin doble reserva."
      :links="[{
        label: 'Reservar una clase',
        to: '/reservar',
        external: true,
        trailingIcon: 'i-lucide-arrow-right',
        size: 'xl'
      }, {
        label: 'Entrar',
        to: '/sign-in',
        size: 'xl',
        color: 'neutral',
        variant: 'outline'
      }]"
    />

    <UPageSection
      title="Operación, no alquiler"
      description="No es un marketplace de pistas. No es una agenda de 30 minutos. Es el software que vende una academia a sus alumnos."
      :features="[{
        icon: 'i-lucide-calendar-days',
        title: 'Grilla fija',
        description: 'Planilla madre y excepciones de la semana. Sede, cancha y profe en el mismo intervalo.'
      }, {
        icon: 'i-lucide-users',
        title: 'Alumnos y packs',
        description: 'Individual, dual o grupal. Pack de clases con saldo. Categoría y lado de juego.'
      }, {
        icon: 'i-lucide-wallet',
        title: 'Cobro adelantado',
        description: 'La reserva existe; la clase se confirma cuando está pagada, o con una cortesía explícita.'
      }]"
    />

    <UPageSection>
      <div class="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
        <UCard>
          <template #header>
            <p class="font-medium">Área de cliente</p>
          </template>
          <p class="text-sm text-muted mb-4">
            Reservas, packs y próximos horarios. Independiente de la administración.
          </p>
          <UButton to="/cliente" color="neutral" variant="soft" block>
            Entrar como alumno
          </UButton>
        </UCard>
        <UCard>
          <template #header>
            <p class="font-medium">Administración</p>
          </template>
          <p class="text-sm text-muted mb-4">
            Grilla, roster y estado de pago. Rutas propias, sin mezclar con el portal.
          </p>
          <UButton to="/admin" color="neutral" block>
            Entrar como academia
          </UButton>
        </UCard>
      </div>
    </UPageSection>
  </div>
</template>
