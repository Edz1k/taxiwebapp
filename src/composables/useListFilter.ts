import { computed, ref } from 'vue'

export function useListFilter<T extends string>(initial: T | '' = '') {
  const value = ref<T | ''>(initial)
  const model = computed({
    get: () => value.value,
    set: (v: T | '') => {
      value.value = v
    },
  })
  return { value, model }
}
