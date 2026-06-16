<script setup lang="ts">
import WebPageShell from '~/components/app/WebPageShell.vue'
import { useParkStore } from '~/stores/park'

const parkStore = useParkStore()

definePage({
  meta: {
    authRedirect: '/park/login',
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
</script>

<template>
  <WebPageShell
    back-label="Кабинет"
    back-to="/dashboard"
    description="Рабочая зона таксопарка: статус карточки, приглашения водителей и операционные показатели."
    title="Кабинет таксопарка"
  >
    <template v-if="parkStore.park" #actions>
      <button
        :disabled="parkStore.isLoading"
        class="h-11 inline-flex items-center gap-2 border border-white/12 rounded-full bg-white/8 px-4 text-sm font-900 transition hover:bg-white/12 disabled:opacity-60"
        type="button"
        @click="loadParkData()"
      >
        <span class="i-mdi-refresh text-5 text-cyan-200" :class="{ 'animate-spin': parkStore.isLoading }" />
        {{ parkStore.isLoading ? 'Обновляем...' : 'Обновить' }}
      </button>
    </template>

    <section v-if="parkStore.isLoading && !parkStore.park" class="mt-5 border border-white/10 rounded-3xl bg-white/8 p-5 text-sm text-white/50 backdrop-blur">
      Загружаем кабинет таксопарка...
    </section>

    <section v-else-if="!parkStore.park" class="mt-5 border border-amber-300/18 rounded-3xl bg-amber-300/8 p-6 backdrop-blur">
      <div class="max-w-2xl flex flex-col gap-4">
        <span class="h-13 w-13 flex items-center justify-center rounded-2xl bg-amber-300/12 text-amber-200">
          <span class="i-mdi-office-building-alert text-7" />
        </span>
        <div>
          <h2 class="text-2xl font-950">
            Таксопарк еще не привязан
          </h2>
          <p class="mt-2 text-sm text-white/60 leading-6">
            Кабинет открывается после того, как менеджер проверит заявку и создаст таксопарк. Новую заявку можно оставить на публичной странице регистрации.
          </p>
        </div>
        <RouterLink
          class="h-11 w-fit inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 text-sm text-#06142f font-900"
          to="/park/register"
        >
          Подать заявку
          <span class="i-mdi-arrow-right text-5" />
        </RouterLink>
      </div>
    </section>

    <div v-else class="grid mt-6 gap-5">
      <section class="border border-white/10 rounded-3xl bg-white/8 p-5 backdrop-blur">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs text-white/42 font-900 uppercase">
              Парк
            </p>
            <h2 class="mt-1 text-2xl font-950">
              {{ parkStore.park.name }}
            </h2>
            <p class="mt-1 text-sm text-white/50">
              {{ parkStore.park.bin || parkStore.park.phone || parkStore.park.owner_id }}
            </p>
          </div>

          <span class="rounded-xl px-3 py-2 text-xs font-900" :class="parkStore.park.is_verified ? 'bg-emerald-500/12 text-emerald-300' : 'bg-amber-500/12 text-amber-300'">
            {{ parkStore.park.is_verified ? 'Проверен' : 'На проверке' }}
          </span>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <div class="border border-white/10 rounded-3xl bg-white/8 p-5 backdrop-blur">
          <p class="text-xs text-white/42 font-900 uppercase">
            Водители
          </p>
          <p class="mt-2 text-3xl font-950">
            {{ parkStore.analytics?.driver_count ?? 0 }}
          </p>
        </div>
        <div class="border border-white/10 rounded-3xl bg-white/8 p-5 backdrop-blur">
          <p class="text-xs text-white/42 font-900 uppercase">
            Поездки
          </p>
          <p class="mt-2 text-3xl font-950">
            {{ parkStore.analytics?.trip_count ?? 0 }}
          </p>
        </div>
        <div class="border border-white/10 rounded-3xl bg-white/8 p-5 backdrop-blur">
          <p class="text-xs text-white/42 font-900 uppercase">
            Выручка
          </p>
          <p class="mt-2 text-3xl font-950">
            {{ Math.round(parkStore.analytics?.total_revenue ?? 0).toLocaleString('ru-RU') }} ₸
          </p>
        </div>
      </section>

      <section class="border border-white/10 rounded-3xl bg-white/8 p-5 backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-xl font-950">
            Приглашения
          </h2>
          <button
            :disabled="parkStore.isMutating"
            class="h-10 rounded-xl bg-cyan-300 px-4 text-sm text-#06142f font-900 disabled:opacity-60"
            type="button"
            @click="parkStore.createInvite()"
          >
            Создать
          </button>
        </div>

        <div class="grid mt-4 gap-2">
          <p v-if="!parkStore.invites.length" class="text-sm text-white/50">
            Приглашений нет.
          </p>
          <div v-for="invite in parkStore.invites" :key="invite.id ?? invite.token" class="rounded-xl bg-black/14 p-3">
            <p class="break-all text-sm font-900">
              {{ invite.token }}
            </p>
            <p class="mt-1 text-xs text-white/38">
              {{ invite.used_by ? 'Использовано' : 'Активно' }}
            </p>
          </div>
        </div>
      </section>

      <section class="border border-white/10 rounded-3xl bg-white/8 p-5 backdrop-blur">
        <h2 class="text-xl font-950">
          Водители
        </h2>

        <div class="mt-4 overflow-hidden rounded-2xl bg-black/14">
          <div v-if="!parkStore.drivers.length" class="p-4 text-sm text-white/50">
            Водителей нет.
          </div>
          <div
            v-for="driver in parkStore.drivers"
            v-else
            :key="driver.id"
            class="grid gap-3 border-b border-white/6 px-4 py-4 md:grid-cols-[minmax(180px,1fr)_90px_100px_120px] md:items-center last:border-b-0"
          >
            <span class="truncate text-sm font-900">{{ driver.user_id }}</span>
            <span class="text-sm" :class="driver.is_online ? 'text-emerald-300' : 'text-white/45'">
              {{ driver.is_online ? 'Онлайн' : 'Офлайн' }}
            </span>
            <span class="text-sm text-white/62">{{ driver.rating.toFixed(1) }}</span>
            <button
              :disabled="parkStore.isMutating"
              class="h-9 rounded-xl bg-red-500/12 px-3 text-sm text-red-300 font-900 disabled:opacity-50"
              type="button"
              @click="parkStore.removeDriver(driver.id)"
            >
              Удалить
            </button>
          </div>
        </div>
      </section>
    </div>
  </WebPageShell>
</template>
