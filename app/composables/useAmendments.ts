import { type InjectionKey, ref, computed, nextTick } from 'vue'
import type { RpField, RpAmendment } from '~/types/submission'

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
    raw: RpField
    title?: string
    amendable: boolean
  }
  const sourceModal = ref<SourceModalState | null>(null)

  const sourceModalTitle = computed(() => sourceModal.value?.title ?? null)
  const sourceModalAmendable = computed(() => sourceModal.value?.amendable ?? true)

  const sourceModalDoc = computed(() => {
    const r = sourceModal.value?.raw
    if (!r || typeof r !== 'object') return null
    return r.source_doc ?? r.source ?? null
  })
  const sourceModalLocation = computed(() => {
    const r = sourceModal.value?.raw
    if (!r || typeof r !== 'object') return null
    // source_doc present means source_location is a separate field; otherwise source already covers both
    return r.source_doc ? (r.source_location ?? null) : null
  })
  const sourceModalRawText = computed(() => {
    const r = sourceModal.value?.raw
    return r && typeof r === 'object' ? (r.raw_text ?? null) : null
  })
  const sourceModalContext = computed(() => {
    const r = sourceModal.value?.raw
    return r && typeof r === 'object' ? (r.context ?? null) : null
  })

  function openSourceModal(key: string, raw: RpField, title?: string, amendable = true) {
    sourceModal.value = { key, raw, title, amendable }
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
    startEdit(key, amendments.value[key]?.amendedValue ?? rpValue(raw))
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
    sourceModalDoc,
    sourceModalLocation,
    sourceModalRawText,
    sourceModalContext,
    openSourceModal,
    closeSourceModal,
    amendFromModal,
  }
}
