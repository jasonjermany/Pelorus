import { type InjectionKey, ref, computed, nextTick } from 'vue'
import type { RpAmendment } from '~/types/submission'

type SourceRaw = {
  value?: string
  source?: string
  source_doc?: string
  source_location?: string
  source_tier?: string
  raw_text?: string
  context?: string
}

export type AmendmentsApi = ReturnType<typeof useAmendments>
export const AMENDMENTS_KEY: InjectionKey<AmendmentsApi> = Symbol.for('amendments')

export function useAmendments(submissionId: string) {
  const amendments = ref<Record<string, RpAmendment>>({})
  const editingKey = ref<string | null>(null)
  const editDraft = ref('')
  const editInputRef = ref<HTMLInputElement | null>(null)

  function startEdit(key: string, currentValue: string) {
    editingKey.value = key
    editDraft.value = currentValue
    nextTick(() => editInputRef.value?.focus())
  }

  function saveEdit(key: string, originalValue: string) {
    const clean = sanitizeFieldValue(editDraft.value)
    if (!clean) {
      delete amendments.value[key]
      persistAmendment(key, '', originalValue)
    } else if (clean !== originalValue) {
      amendments.value[key] = { amendedValue: clean, originalValue, amendedAt: new Date().toISOString() }
      persistAmendment(key, clean, originalValue)
    }
    editingKey.value = null
    editDraft.value = ''
  }

  async function persistAmendment(key: string, amendedValue: string, originalValue: string) {
    try {
      await $fetch(`/api/submissions/${submissionId}/amendments`, {
        method: 'PATCH',
        body: { key, amendedValue, originalValue },
      })
    } catch (e: any) {
      console.error('[amendments] persist failed:', e?.message)
    }
  }

  function cancelEdit() {
    editingKey.value = null
    editDraft.value = ''
  }

  type SourceModalState = {
    key: string
    raw: SourceRaw
    title?: string
    amendable: boolean
    loading?: boolean
  }
  const sourceModal = ref<SourceModalState | null>(null)

  const sourceModalTitle = computed(() => sourceModal.value?.title ?? null)
  const sourceModalAmendable = computed(() => sourceModal.value?.amendable ?? true)
  const sourceModalLoading = computed(() => sourceModal.value?.loading ?? false)

  const sourceModalDoc = computed(() => {
    const r = sourceModal.value?.raw
    return r ? (r.source_doc ?? r.source ?? null) : null
  })
  const sourceModalLocation = computed(() => {
    const r = sourceModal.value?.raw
    return r?.source_doc ? (r.source_location ?? null) : null
  })
  const sourceModalTier = computed(() => sourceModal.value?.raw?.source_tier ?? null)
  const sourceModalRawText = computed(() => sourceModal.value?.raw?.raw_text ?? null)
  const sourceModalContext = computed(() => sourceModal.value?.raw?.context ?? null)

  function openSourceModal(key: string, raw: SourceRaw, title?: string, amendable = true) {
    sourceModal.value = { key, raw, title, amendable }
  }

  function openSourceModalLoading(key: string, title?: string) {
    sourceModal.value = { key, raw: {}, title, amendable: true, loading: true }
  }

  function closeSourceModal() {
    sourceModal.value = null
  }

  function amendFromModal() {
    if (!sourceModal.value) return
    if (!sourceModal.value.amendable) {
      closeSourceModal()
      return
    }
    const { key, raw } = sourceModal.value
    startEdit(key, amendments.value[key]?.amendedValue ?? raw.value ?? '')
    closeSourceModal()
  }

  return {
    amendments,
    editingKey,
    editDraft,
    editInputRef,
    startEdit,
    saveEdit,
    cancelEdit,
    sourceModal,
    sourceModalTitle,
    sourceModalAmendable,
    sourceModalLoading,
    sourceModalDoc,
    sourceModalLocation,
    sourceModalTier,
    sourceModalRawText,
    sourceModalContext,
    openSourceModal,
    openSourceModalLoading,
    closeSourceModal,
    amendFromModal,
  }
}
