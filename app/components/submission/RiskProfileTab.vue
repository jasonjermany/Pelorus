<template>
  <div v-if="Object.keys(riskProfile).length" class="glass-card overflow-hidden">
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-100">
      <div v-for="(raw, key) in riskProfile" :key="key" class="bg-white px-4 py-3">

        <!-- Label row + buttons -->
        <div class="flex items-start justify-between gap-1 mb-1">
          <p class="text-[10px] font-black uppercase tracking-[0.13em] text-gray-600 leading-tight">{{ formatKey(key) }}</p>
          <div class="flex items-center gap-0.5 flex-shrink-0">
            <span
              v-if="amendments[key]"
              class="text-[10px] font-bold tracking-[0.06em] uppercase px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap"
            >Amended</span>
            <template v-if="editingKey !== key">
              <button
                class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded"
                title="Edit value"
                @click="startEdit(key, amendments[key]?.amendedValue ?? rpValue(raw))"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                </svg>
              </button>
              <button
                class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded"
                title="View source"
                @click="openSourceModal(key, raw)"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                </svg>
              </button>
            </template>
          </div>
        </div>

        <!-- Editing state -->
        <template v-if="editingKey === key">
          <input
            ref="editInputRef"
            v-model="editDraft"
            type="text"
            class="w-full bg-gray-50 border border-gray-300 focus:border-accent-500/70 focus:bg-white rounded-lg px-2.5 py-1.5 text-[14px] text-gray-900 outline-none transition-colors"
            @keydown.enter="saveEdit(key, rpValue(raw))"
            @keydown.escape="cancelEdit"
          />
          <div class="flex gap-1.5 mt-2">
            <button
              class="text-[12px] font-bold text-[#050A18] bg-accent-500 hover:bg-accent-400 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              @click="saveEdit(key, rpValue(raw))"
            >Save</button>
            <button
              class="text-[12px] font-medium text-gray-700 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              @click="cancelEdit"
            >Cancel</button>
          </div>
        </template>

        <!-- Display state -->
        <template v-else>
          <span v-if="amendments[key]" class="text-[15px] font-semibold text-gray-900">{{ amendments[key].amendedValue }}</span>
          <span v-else-if="!rpIsBlank(raw)" class="text-[15px] font-semibold text-gray-900">{{ rpValue(raw) }}</span>
          <span v-else class="text-[15px] text-gray-500">—</span>
          <p v-if="amendments[key]" class="text-[11px] text-gray-500 mt-0.5">Original: {{ amendments[key].originalValue || '—' }}</p>
          <p v-if="rpSource(raw)" class="text-[12px] text-gray-600 mt-0.5 truncate" :title="rpSource(raw)!">{{ rpSource(raw) }}</p>
        </template>

      </div>
    </div>
  </div>
  <div v-else class="py-12 text-center text-[15px] text-gray-600">No risk profile data available.</div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { AMENDMENTS_KEY } from '~/composables/useAmendments'
import type { RpField } from '~/types/submission'

defineProps<{ riskProfile: Record<string, RpField> }>()

const {
  amendments,
  editingKey,
  editDraft,
  editInputRef,
  startEdit,
  saveEdit,
  cancelEdit,
  openSourceModal,
} = inject(AMENDMENTS_KEY)!
</script>
