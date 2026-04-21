<template>
  <div class="glass-card overflow-hidden">
    <div class="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Guideline Checks</p>
      <span class="text-[14px] text-gray-600">
        <span v-if="sortedChecks.length">{{ sortedChecks.length }} check{{ sortedChecks.length !== 1 ? 's' : '' }} require attention</span>
        <span v-else class="text-green-700 font-medium">All checks passed</span>
      </span>
    </div>
    <div class="overflow-x-auto overflow-y-auto" style="max-height:min(62vh,600px)">
      <table class="w-full text-left text-[15px]">
        <thead class="sticky top-0">
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="th-cell">Rule</th>
            <th class="th-cell">Required</th>
            <th class="th-cell">Submitted</th>
            <th class="th-cell w-20">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(check, i) in sortedChecks"
            :key="i"
            class="hover:bg-gray-50 transition-colors duration-150"
            :class="{ 'bg-red-50/40': check.status === 'fail', 'bg-amber-50/30': check.status === 'review' }"
          >
            <td class="td-cell align-top">
              <p class="font-medium text-gray-900">{{ check.rule }}</p>
              <p class="text-[13px] text-gray-600 mt-1"><span class="font-semibold text-gray-700">Ref:</span> {{ check.cited_section }}</p>
            </td>
            <td class="td-cell text-gray-800 leading-relaxed align-top">{{ check.required }}</td>
            <td class="td-cell align-top">
              <div class="flex items-start gap-2">
                <div class="flex-1 min-w-0">
                  <!-- Editing state -->
                  <template v-if="editingKey === 'check:' + i">
                    <input
                      ref="editInputRef"
                      v-model="editDraft"
                      type="text"
                      class="w-full bg-gray-50 border border-gray-300 focus:border-accent-500/70 focus:bg-white rounded-lg px-2.5 py-1.5 text-[14px] text-gray-900 outline-none transition-colors"
                      @keydown.enter="saveEdit('check:' + i, check.submitted)"
                      @keydown.escape="cancelEdit"
                    />
                    <div class="flex gap-1.5 mt-2">
                      <button
                        class="text-[12px] font-bold text-[#050A18] bg-accent-500 hover:bg-accent-400 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        @click="saveEdit('check:' + i, check.submitted)"
                      >Save</button>
                      <button
                        class="text-[12px] font-medium text-gray-700 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        @click="cancelEdit"
                      >Cancel</button>
                    </div>
                  </template>
                  <!-- Display state -->
                  <template v-else>
                    <span
                      v-if="amendments['check:' + i]"
                      class="text-[10px] font-bold tracking-[0.06em] uppercase px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap"
                    >Amended</span>
                    <p class="text-gray-800 leading-relaxed">{{ amendments['check:' + i]?.amendedValue ?? check.submitted }}</p>
                    <p v-if="amendments['check:' + i]" class="text-[11px] text-gray-500 mt-0.5 line-clamp-2">Original: {{ check.submitted }}</p>
                  </template>
                </div>
                <!-- Action buttons (hidden while editing) -->
                <div v-if="editingKey !== 'check:' + i" class="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                  <!-- Pencil: edit submitted value -->
                  <button
                    class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded"
                    title="Edit submitted value"
                    @click="startEdit('check:' + i, amendments['check:' + i]?.amendedValue ?? check.submitted)"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                    </svg>
                  </button>
                  <!-- Source ↗: always available since submitted finding is always present -->
                  <button
                    class="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded"
                    title="View source"
                    @click="openSourceModal('check:' + i, { value: amendments['check:' + i]?.amendedValue ?? check.submitted, source_doc: check.submission_source?.trim() && check.submission_source.trim() !== 'Not disclosed' ? check.submission_source.trim() : undefined, raw_text: check.raw_text ?? check.submitted, context: check.context ?? ('Guideline requires: ' + check.required) }, check.rule)"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                    </svg>
                  </button>
                </div>
              </div>
            </td>
            <td class="td-cell align-top">
              <span
                class="text-[12px] font-bold tracking-[0.05em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
                :class="{
                  'bg-green-50 text-green-800 border border-green-200': check.status === 'pass',
                  'bg-amber-50 text-amber-800 border border-amber-200': check.status === 'review',
                  'bg-red-50 text-red-800 border border-red-200': check.status === 'fail',
                }"
              >{{ check.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { AMENDMENTS_KEY } from '~/composables/useAmendments'
import type { GuidelineCheck } from '~/types/submission'

const props = defineProps<{ checks: GuidelineCheck[] }>()

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

const sortedChecks = computed(() =>
  [...props.checks].sort((a, b) => {
    if (a.status === 'fail' && b.status !== 'fail') return -1
    if (a.status !== 'fail' && b.status === 'fail') return 1
    return 0
  })
)
</script>
