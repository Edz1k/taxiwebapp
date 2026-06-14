<script setup lang="ts">
import AuthButton from '~/components/auth/AuthButton.vue'
import AuthScreen from '~/components/auth/AuthScreen.vue'
import PhoneInput from '~/components/auth/PhoneInput.vue'
import { isKazakhstanPhoneComplete, toKazakhstanE164 } from '~/composables/auth/phone'
import { getTelegramInitData, readyTelegramWebApp } from '~/composables/auth/telegram'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const phoneInput = ref('')

const canSubmit = computed(() => isKazakhstanPhoneComplete(phoneInput.value))

definePage({
  meta: {
    guestOnly: true,
    guestOnlyRole: 'passenger',
    guestRedirect: '/passenger',
  },
})

useHead({
  title: 'Вход | Telegram Taxi',
})

onMounted(() => {
  readyTelegramWebApp()
})

async function submitPhone() {
  if (!canSubmit.value || auth.isLoading)
    return

  try {
    await auth.requestPassengerOtp(toKazakhstanE164(phoneInput.value))
    await router.push('/passenger/login/verify')
  }
  catch {}
}

async function submitTelegram() {
  const initData = getTelegramInitData()

  if (!initData) {
    auth.errorMessage = 'Вход через Telegram доступен только внутри Telegram.'
    toast.warning('Откройте в Telegram', auth.errorMessage)
    return
  }

  try {
    await auth.signInPassengerWithTelegram(initData)
    await router.replace('/passenger')
  }
  catch {}
}
</script>

<template>
  <AuthScreen
    description="Быстрый заказ такси прямо через Telegram. Введите номер телефона, чтобы получить код подтверждения."
    icon="i-mdi-taxi"
    title="Telegram Taxi"
  >
    <form class="mt-8 space-y-5" @submit.prevent="submitPhone">
      <PhoneInput v-model="phoneInput" />

      <AuthButton
        :disabled="auth.isLoading || !canSubmit"
        :loading="auth.isLoading"
        loading-text="Отправляем код..."
        text="Получить код"
      />

      <button
        class="h-14 w-full flex items-center justify-center border border-white/10 rounded-2xl bg-white/5 text-base text-white font-700 transition active:scale-[0.98]"
        type="button"
        @click="submitTelegram"
      >
        <span class="i-mdi-telegram mr-2 text-2xl text-main-400" />
        Войти через Telegram
      </button>
    </form>

    <template #footer>
      Продолжая, вы соглашаетесь с условиями сервиса
    </template>
  </AuthScreen>
</template>
