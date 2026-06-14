<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const items = [
  {
    icon: 'i-mdi-view-grid-outline',
    label: 'Меню',
    to: '/driver/menu',
  },
  {
    icon: 'i-mdi-steering',
    label: 'Линия',
    to: '/driver',
  },
  {
    icon: 'i-mdi-cash-multiple',
    label: 'Доход',
    to: '/driver/earnings',
  },
]

function isActive(path: string) {
  return route.path.replace(/\/$/, '') === path
}
</script>

<template>
  <nav
    data-driver-tabbar
    class="tg-safe-x pointer-events-none absolute inset-x-0 bottom-[calc(var(--app-safe-area-bottom)+0.75rem)] z-40"
  >
    <div class="pointer-events-auto grid grid-cols-3 mx-auto max-w-sm border border-white/10 rounded-[2rem] bg-secondary-950/78 p-1 shadow-[0_18px_52px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="h-16 min-w-0 flex flex-col items-center justify-center rounded-[1.65rem] text-slate-300 transition active:scale-[0.97]"
        :class="isActive(item.to) ? 'bg-white/13 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'hover:bg-white/6'"
      >
        <span :class="item.icon" class="text-7" />
        <span class="mt-1 truncate text-[12px] font-850 leading-none">
          {{ item.label }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>
