<script setup lang="ts">
import { useParkStore } from '~/stores/park'

const parkStore = useParkStore()
const form = reactive({
  bin: '',
  name: '',
  phone: '',
})

definePage({
  meta: {
    authRedirect: '/login',
    requiresAuth: true,
    requiredRole: ['park', 'admin', 'superadmin'],
  },
})

useHead({
  title: 'Таксопарк | EdTaxi',
})

onMounted(() => {
  loadParkData().catch(() => {})
})

async function loadParkData() {
  const park = await parkStore.loadPark({ silentNotFound: true })

  if (park)
    await parkStore.loadDashboard()
}

async function registerPark() {
  await parkStore.register({
    bin: form.bin || undefined,
    name: form.name,
    phone: form.phone || undefined,
  })
  await parkStore.loadDashboard()
}
</script>

<template>
  <main class="min-h-screen bg-secondary-900 px-4 py-6 text-white">
    <section class="mx-auto max-w-6xl">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <RouterLink class="text-sm text-main-300 font-800" to="/">
            EdTaxi
          </RouterLink>
          <h1 class="mt-2 text-3xl font-950">
            Таксопарк
          </h1>
        </div>

        <button
          v-if="parkStore.park"
          :disabled="parkStore.isLoading"
          class="h-11 rounded-2xl bg-white/8 px-4 text-sm font-900 disabled:opacity-60"
          type="button"
          @click="loadParkData()"
        >
          {{ parkStore.isLoading ? 'Обновляем...' : 'Обновить' }}
        </button>
      </header>

      <form v-if="!parkStore.park" class="mt-6 max-w-xl rounded-2xl bg-white/5 p-5" @submit.prevent="registerPark">
        <h2 class="text-xl font-950">
          Регистрация парка
        </h2>

        <div class="grid mt-5 gap-4">
          <label class="grid gap-2 text-sm text-slate-300 font-800">
            Название
            <input v-model="form.name" required class="h-12 border border-white/10 rounded-2xl bg-white/5 px-4 text-white outline-none focus:border-main-400">
          </label>
          <label class="grid gap-2 text-sm text-slate-300 font-800">
            БИН
            <input v-model="form.bin" class="h-12 border border-white/10 rounded-2xl bg-white/5 px-4 text-white outline-none focus:border-main-400">
          </label>
          <label class="grid gap-2 text-sm text-slate-300 font-800">
            Телефон
            <input v-model="form.phone" class="h-12 border border-white/10 rounded-2xl bg-white/5 px-4 text-white outline-none focus:border-main-400">
          </label>
        </div>

        <AuthError class="mt-4" :message="parkStore.errorMessage" />

        <button
          :disabled="parkStore.isMutating || !form.name"
          class="mt-5 h-12 rounded-2xl bg-main-500 px-5 text-sm font-900 disabled:opacity-60"
          type="submit"
        >
          {{ parkStore.isMutating ? 'Сохраняем...' : 'Зарегистрировать' }}
        </button>
      </form>

      <div v-else class="grid mt-6 gap-5">
        <section class="rounded-2xl bg-white/5 p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs text-slate-500 font-900 uppercase">
                Парк
              </p>
              <h2 class="mt-1 text-2xl font-950">
                {{ parkStore.park.name }}
              </h2>
              <p class="mt-1 text-sm text-slate-400">
                {{ parkStore.park.bin || parkStore.park.phone || parkStore.park.owner_id }}
              </p>
            </div>

            <span class="rounded-xl px-3 py-2 text-xs font-900" :class="parkStore.park.is_verified ? 'bg-emerald-500/12 text-emerald-300' : 'bg-amber-500/12 text-amber-300'">
              {{ parkStore.park.is_verified ? 'Проверен' : 'На проверке' }}
            </span>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl bg-white/5 p-5">
            <p class="text-xs text-slate-500 font-900 uppercase">
              Водители
            </p>
            <p class="mt-2 text-3xl font-950">
              {{ parkStore.analytics?.driver_count ?? 0 }}
            </p>
          </div>
          <div class="rounded-2xl bg-white/5 p-5">
            <p class="text-xs text-slate-500 font-900 uppercase">
              Поездки
            </p>
            <p class="mt-2 text-3xl font-950">
              {{ parkStore.analytics?.trip_count ?? 0 }}
            </p>
          </div>
          <div class="rounded-2xl bg-white/5 p-5">
            <p class="text-xs text-slate-500 font-900 uppercase">
              Выручка
            </p>
            <p class="mt-2 text-3xl font-950">
              {{ Math.round(parkStore.analytics?.total_revenue ?? 0).toLocaleString('ru-RU') }} ₸
            </p>
          </div>
        </section>

        <section class="rounded-2xl bg-white/5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-950">
              Приглашения
            </h2>
            <button
              :disabled="parkStore.isMutating"
              class="h-10 rounded-xl bg-main-500 px-4 text-sm font-900 disabled:opacity-60"
              type="button"
              @click="parkStore.createInvite()"
            >
              Создать
            </button>
          </div>

          <div class="grid mt-4 gap-2">
            <p v-if="!parkStore.invites.length" class="text-sm text-slate-400">
              Приглашений нет.
            </p>
            <div v-for="invite in parkStore.invites" :key="invite.id ?? invite.token" class="rounded-xl bg-black/14 p-3">
              <p class="break-all text-sm font-900">
                {{ invite.token }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ invite.used_by ? 'Использовано' : 'Активно' }}
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white/5 p-5">
          <h2 class="text-xl font-950">
            Водители
          </h2>

          <div class="mt-4 overflow-hidden rounded-xl bg-black/14">
            <div v-if="!parkStore.drivers.length" class="p-4 text-sm text-slate-400">
              Водителей нет.
            </div>
            <div
              v-for="driver in parkStore.drivers"
              v-else
              :key="driver.id"
              class="grid grid-cols-[1fr_90px_100px_120px] items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
            >
              <span class="truncate text-sm font-900">{{ driver.user_id }}</span>
              <span class="text-sm" :class="driver.is_online ? 'text-emerald-300' : 'text-slate-400'">
                {{ driver.is_online ? 'Онлайн' : 'Офлайн' }}
              </span>
              <span class="text-sm text-slate-300">{{ driver.rating.toFixed(1) }}</span>
              <button
                :disabled="parkStore.isMutating"
                class="h-9 rounded-xl bg-red-500/12 text-sm text-red-300 font-900 disabled:opacity-50"
                type="button"
                @click="parkStore.removeDriver(driver.id)"
              >
                Удалить
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
