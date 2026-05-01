<template>
  <Transition
    enter-active-class="transition-opacity duration-150 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-100 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-[480px] flex flex-col max-h-[85vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <p class="text-[15px] font-semibold text-gray-900 tracking-[-0.2px]">
            {{ displayTitle ?? (fieldKey ? formatKey(fieldKey) : 'Source') }}
          </p>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
            aria-label="Close"
            @click="$emit('close')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          <!-- Loading -->
          <template v-if="isLoading">
            <div class="flex flex-col items-center justify-center py-8 gap-3">
              <svg class="w-5 h-5 animate-spin text-navy/30" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-dashoffset="12"/>
              </svg>
              <p class="text-[13px] text-gray-400">Locating source passage...</p>
            </div>
          </template>

          <!-- Content -->
          <template v-else>
            <div v-if="sourceDoc || sourceLocation || sourceTier" class="flex flex-col gap-1">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Source</p>
              <div class="flex items-center gap-2 flex-wrap">
                <p v-if="sourceDoc" class="text-[14px] font-semibold text-gray-800">{{ sourceDoc }}</p>
                <span
                  v-if="sourceTier && sourceTier !== 'Not Confirmed'"
                  class="text-[10px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full border"
                  :class="tierBadgeClass"
                >{{ sourceTier }}</span>
              </div>
              <p v-if="sourceLocation" class="text-[13px] text-gray-600">{{ sourceLocation }}</p>
            </div>
            <div v-if="rawText" class="flex flex-col gap-1">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Extracted text</p>
              <pre class="text-[13px] leading-[1.6] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 whitespace-pre-wrap font-mono overflow-x-auto">{{ rawText }}</pre>
            </div>
            <div v-if="context" class="flex flex-col gap-1">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Context</p>
              <p class="text-[13px] leading-[1.6] text-gray-600 italic">{{ context }}</p>
            </div>
            <p v-if="!sourceDoc && !rawText && !context" class="text-[14px] text-gray-500">No source information available.</p>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            class="text-[13px] font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$emit('close')"
          >Close</button>
          <button
            v-if="amendable !== false"
            class="text-[13px] font-bold text-[#050A18] bg-accent-500 hover:bg-accent-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            @click="$emit('amend')"
          >Edit value</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatKey } from '~/utils/submission'

const props = defineProps<{
  isOpen: boolean
  isLoading?: boolean
  fieldKey: string
  displayTitle?: string | null
  sourceDoc: string | null
  sourceLocation: string | null
  sourceTier?: string | null
  rawText: string | null
  context: string | null
  amendable?: boolean
}>()

defineEmits<{
  close: []
  amend: []
}>()

const tierBadgeClass = computed(() => {
  const t = props.sourceTier
  if (t === 'Inspector Confirmed') return 'bg-green-50 text-green-800 border-green-200'
  if (t === 'Application Stated')  return 'bg-blue-50 text-blue-700 border-blue-200'
  if (t === 'Broker Represented')  return 'bg-amber-50 text-amber-700 border-amber-200'
  if (t === 'Owner Stated')        return 'bg-red-50 text-red-600 border-red-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
})
</script>
