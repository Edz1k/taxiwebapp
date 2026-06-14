<script setup lang="ts">
import AuthButton from '~/components/auth/AuthButton.vue'
import AuthScreen from '~/components/auth/AuthScreen.vue'
import OtpInput from '~/components/auth/OtpInput.vue'
import PhoneInput from '~/components/auth/PhoneInput.vue'
import { isKazakhstanPhoneComplete, toKazakhstanE164 } from '~/composables/auth/phone'
import { useDriverStore } from '~/stores/driver'

const router = useRouter()
const driver = useDriverStore()

const phoneInput = ref('')
const code = ref('')
const isCodeSent = ref(false)
const shouldShake = ref(false)

const canSend = computed(() => isKazakhstanPhoneComplete(phoneInput.value))
const canVerify = computed(() => code.value.length === 6)

definePage({
  meta: {
    authRedirect: '/driver/login',
    requiresAuth: true,
    requiredRole: 'driver',
  },
})

useHead({
  title: 'Телефон водителя | EdTaxi Driver',
})

onMounted(async () => {
  try {
    await driver.ensureProfile()
  }
  catch {}
})

async function submitPhone() {
  if (!canSend.value || driver.isLoading)
    return

  try {
    await driver.requestPhoneOtp(toKazakhstanE164(phoneInput.value))
    isCodeSent.value = true
  }
  catch {}
}

async function submitCode() {
  if (!canVerify.value || driver.isLoading)
    return

  try {
    await driver.confirmPhone(code.value)
    await router.replace('/driver/menu/vehicle')
  }
  catch {
    shouldShake.value = false
    requestAnimationFrame(() => {
      shouldShake.value = true
      window.setTimeout(() => {
        shouldShake.value = false
      }, 380)
    })
  }
}
</script>

<template>
  <AuthScreen
    description="Подтвердите рабочий номер телефона. Он будет привязан к водительскому аккаунту."
    icon="i-mdi-cellphone-check"
    title="Телефон водителя"
  >
    <form v-if="!isCodeSent" class="mt-8 space-y-5" @submit.prevent="submitPhone">
      <PhoneInput v-model="phoneInput" />

      <AuthButton
        :disabled="driver.isLoading || !canSend"
        :loading="driver.isLoading"
        loading-text="Отправляем код..."
        text="Получить код"
      />
    </form>

    <form v-else class="mt-8 space-y-5" @submit.prevent="submitCode">
      <OtpInput v-model="code" :shake="shouldShake" />

      <AuthButton
        :disabled="driver.isLoading || !canVerify"
        icon="i-mdi-check"
        :loading="driver.isLoading"
        loading-text="Проверяем код..."
        text="Подтвердить"
      />

      <button
        class="h-14 w-full flex items-center justify-center border border-white/10 rounded-2xl bg-white/5 text-base text-slate-300 font-700 transition active:scale-[0.98]"
        type="button"
        @click="isCodeSent = false"
      >
        Изменить номер телефона
      </button>
    </form>

    <template #footer>
      После подтверждения добавьте автомобиль
    </template>
  </AuthScreen>
</template>
