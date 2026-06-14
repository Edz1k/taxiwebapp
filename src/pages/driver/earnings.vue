<script setup lang="ts">
import { useDriverStore } from '~/stores/driver'

const driver = useDriverStore()

definePage({
  meta: {
    authRedirect: '/driver/login',
    layout: 'driver',
    requiresAuth: true,
    requiredRole: 'driver',
  },
})

useHead({
  title: 'Заработок | EdTaxi',
})

onMounted(async () => {
  await driver.loadEarnings().catch(() => {})
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'KZT',
  }).format(value)
}
</script>

<template>
  <main class="tg-safe-x h-full overflow-y-auto bg-secondary-900 pb-[calc(var(--app-safe-area-bottom)+7.25rem)] pt-[calc(var(--app-safe-area-top)+1.35rem)] text-white">
    <section class="mx-auto max-w-sm">
      <header>
        <p class="text-xs text-main-300 font-900 uppercase">
          Водитель
        </p>
        <h1 class="mt-1 text-3xl font-950">
          Заработок
        </h1>
      </header>

      <section class="mt-6 border border-main-500/20 rounded-3xl bg-white/6 p-5">
        <p class="text-xs text-slate-400 font-800 uppercase">
          Всего заработано
        </p>
        <p class="mt-2 text-4xl text-main-200 font-950">
          {{ formatMoney(driver.earnings?.total_earned ?? 0) }}
        </p>
      </section>

      <div class="grid grid-cols-2 mt-4 gap-3">
        <article class="rounded-2xl bg-white/5 p-4">
          <p class="text-xs text-slate-400 font-800">
            Поездок
          </p>
          <p class="mt-1 text-2xl font-950">
            {{ driver.earnings?.trip_count ?? 0 }}
          </p>
        </article>

        <article class="rounded-2xl bg-white/5 p-4">
          <p class="text-xs text-slate-400 font-800">
            Средний чек
          </p>
          <p class="mt-1 text-2xl font-950">
            {{ formatMoney(driver.earnings?.trip_count ? (driver.earnings.total_earned / driver.earnings.trip_count) : 0) }}
          </p>
        </article>
      </div>

      <button
        :disabled="driver.isLoadingEarnings"
        class="mt-4 h-13 w-full rounded-2xl bg-white/8 text-sm font-900 disabled:opacity-60"
        type="button"
        @click="driver.loadEarnings()"
      >
        {{ driver.isLoadingEarnings ? 'Обновляем...' : 'Обновить' }}
      </button>
    </section>
  </main>
</template>
