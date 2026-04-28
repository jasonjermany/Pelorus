<template>
  <div v-if="lines.length" class="antialiased font-sans">

    <!-- Header -->
    <div class="bg-navy rounded-t-[10px] px-4 pt-4">
      <div class="flex items-center gap-3 mb-3.5">
        <div class="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center text-[10px] font-bold tracking-[.06em] text-white/80 flex-shrink-0">
          {{ lineMeta(activeLine).icon }}
        </div>
        <div>
          <p class="text-[12px] text-white/60 tracking-[.04em] uppercase mb-0.5">{{ report?.named_insured || '' }}</p>
          <p class="text-[17px] font-semibold text-white tracking-[-0.01em]">{{ activeLineData.label || activeLine }}</p>
        </div>
      </div>

      <div v-if="lines.length > 1" class="flex overflow-x-auto border-t border-white/[0.08] -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style="scrollbar-width:none">
        <button
          v-for="line in lines"
          :key="line.line_type"
          class="px-3.5 py-[11px] text-[13px] text-white/60 bg-transparent border-0 border-b-2 border-b-transparent cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors duration-150"
          :class="activeLine === line.line_type ? 'font-semibold border-b-2' : 'font-normal'"
          :style="activeLine === line.line_type ? { color: lineMeta(line.line_type).color, borderBottomColor: lineMeta(line.line_type).color } : {}"
          @click="switchLine(line.line_type)"
        >
          <span>{{ lineMeta(line.line_type).icon }}</span>
          <span>{{ line.label || line.line_type }}</span>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-3.5 flex flex-col gap-2">

      <!-- Location pills + address -->
      <template v-if="hasLocations">
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="(loc, i) in activeLineData.locations"
            :key="i"
            class="px-3.5 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors duration-150 border"
            :class="locIdx === i
              ? 'font-semibold text-white bg-navy border-navy shadow-[0_2px_8px_rgba(11,24,41,.18)]'
              : 'font-normal text-[#2C4060] bg-white border-navy/[0.08]'"
            @click="locIdx = i"
          >
            <span
              v-if="locIdx !== i"
              class="w-[5px] h-[5px] rounded-full inline-block flex-shrink-0"
              :style="{ background: STATUS_META[worstForLoc(loc)].color }"
            />
            {{ loc.id || `LOC ${String(i + 1).padStart(3, '0')}` }}
          </button>
        </div>

        <div v-if="activeLoc?.address || activeLoc?.tiv" class="px-3 py-2.5 bg-white rounded-[10px] border border-navy/[0.08] flex items-center justify-between gap-3">
          <span class="text-[14px] text-navy font-medium">{{ activeLoc.address || 'Address not provided' }}</span>
          <span v-if="activeLoc.tiv" class="text-[11px] font-mono text-[#5A7290] bg-[#F6F3EE] px-2 py-0.5 rounded-md flex-shrink-0">TIV {{ activeLoc.tiv }}</span>
        </div>
      </template>

      <!-- Sections -->
      <template v-if="activeSections.length">
        <div
          v-for="(sec, si) in activeSections"
          :key="sectionKey(si)"
          class="rounded-[10px] overflow-hidden border bg-white"
          :class="{
            'border-red-800/20': worstForSection(sec) === 'fail',
            'border-amber-800/[0.12]': worstForSection(sec) === 'warn',
            'border-navy/[0.08]': !['fail','warn'].includes(worstForSection(sec)),
          }"
        >
          <button class="w-full flex items-center gap-2.5 px-3.5 py-[11px] bg-navy border-0 cursor-pointer text-left" @click="toggleSection(si)">
            <span class="text-[11px] tracking-[.1em] uppercase text-white font-bold flex-1">{{ sec.title }}</span>
            <span
              v-if="flagCount(sec) > 0"
              class="text-[11px] px-[9px] py-0.5 rounded-full font-semibold"
              :style="{ color: STATUS_META[worstForSection(sec)].color, background: STATUS_META[worstForSection(sec)].bg }"
            >
              {{ flagCount(sec) }} {{ worstForSection(sec) === 'fail' ? 'hard stop' : 'flag' }}{{ flagCount(sec) > 1 ? 's' : '' }}
            </span>
            <span class="text-[10px] text-white/60">{{ isSectionOpen(si) ? '▲' : '▼' }}</span>
          </button>

          <div v-if="isSectionOpen(si)" class="px-3.5 pb-2.5">
            <div
              v-for="(field, fi) in sec.fields"
              :key="fi"
              class="group py-2 flex items-start gap-2.5 border-b border-navy/[0.05] [&:last-child]:border-b-0 rounded-md transition-colors duration-100"
              :class="editingKey !== amendKey(si, fi) ? 'cursor-pointer hover:bg-navy/[0.04]' : ''"
              @click="editingKey !== amendKey(si, fi) && openFieldSource(amendKey(si, fi), field)"
            >
              <div
                class="w-[3px] rounded-sm flex-shrink-0 self-stretch min-h-4 mt-0.5"
                :style="{ background: isFlagged(field) ? STATUS_META[field.status].color : 'transparent' }"
              />

              <div class="flex-1 min-w-0">
                <p class="text-[11px] tracking-[.05em] uppercase text-[#1E3A50] font-bold mb-[3px]">{{ field.label }}</p>

                <!-- Editing -->
                <template v-if="editingKey === amendKey(si, fi)">
                  <input
                    ref="editInputRef"
                    v-model="editDraft"
                    type="text"
                    class="w-full bg-[#F6F3EE] border border-[#ccc] focus:border-[#2E5FA3] focus:bg-white rounded-lg px-2.5 py-1.5 text-[14px] text-navy outline-none transition-colors box-border"
                    @keydown.enter="saveEdit(amendKey(si, fi), field.value)"
                    @keydown.escape="cancelEdit"
                  />
                  <div class="flex gap-1.5 mt-1.5">
                    <button class="text-[13px] font-bold text-[#050A18] bg-accent-500 hover:bg-accent-400 px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-colors" @click="saveEdit(amendKey(si, fi), field.value)">Save</button>
                    <button class="text-[13px] font-medium text-[#5A7290] bg-transparent hover:bg-[#F6F3EE] px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-colors" @click="cancelEdit">Cancel</button>
                  </div>
                </template>

                <!-- Display -->
                <template v-else>
                  <span v-if="amendments[amendKey(si, fi)]" class="inline-block text-[11px] font-bold tracking-[.06em] uppercase px-1.5 py-[1px] rounded-full bg-[#FFF6E8] text-[#9A5C00] border border-[#F5D09A] mb-[3px]">Amended</span>
                  <p
                    class="text-[15px] leading-[1.5] text-[#060E1A]"
                    :class="{
                      'font-medium italic': isFlagged(field),
                      'line-clamp-2': isLong(field) && !isExpanded(si, fi),
                    }"
                    :style="isFlagged(field) ? { color: STATUS_META[field.status].color } : {}"
                  >
                    <template v-if="field.status === 'unconfirmed'">Not confirmed — source document required</template>
                    <template v-else>{{ amendments[amendKey(si, fi)]?.amendedValue ?? field.value }}</template>
                  </p>
                  <button
                    v-if="isLong(field) && field.status !== 'unconfirmed'"
                    class="text-[11px] font-semibold text-white bg-navy border-0 cursor-pointer px-2.5 py-0.5 rounded-full mt-1"
                    @click.stop="toggleExpand(si, fi)"
                  >{{ isExpanded(si, fi) ? 'show less ▲' : 'show more ▼' }}</button>
                  <p v-if="amendments[amendKey(si, fi)]" class="text-[12px] text-[#1E3A50] mt-0.5">Original: {{ field.value }}</p>
                  <p v-if="field.note" class="text-[12px] text-[#1E3A50] mt-1 leading-[1.4]">{{ field.note }}</p>
                </template>
              </div>

              <svg
                v-if="editingKey !== amendKey(si, fi)"
                class="w-3 h-3 flex-shrink-0 mt-[5px] text-navy/20 group-hover:text-navy/60 transition-colors duration-100"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M7 17L17 7M7 7h10v10"/>
              </svg>

            </div>
          </div>
        </div>
      </template>
      <p v-else class="p-6 text-center text-[#1E3A50] text-[14px]">No sections extracted for this line of business.</p>
    </div>
  </div>
  <div v-else class="p-12 text-center text-[15px] text-[#1E3A50]">No risk profile data available.</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { AMENDMENTS_KEY } from '~/composables/useAmendments'
import type { RiskReport, RpLine, RpSection, RpLocation, RpReportField } from '~/types/submission'

const props = defineProps<{ report?: RiskReport | null }>()

const { amendments, editingKey, editDraft, editInputRef, saveEdit, cancelEdit, sourceModal, openSourceModal, openSourceModalLoading } = inject(AMENDMENTS_KEY)!

const route = useRoute()
const submissionId = route.params.id as string

type SourceResult = { source_doc: string | null; source_location: string | null; raw_text: string | null; context: string | null }
const sourceCache = ref<Record<string, SourceResult>>({})

async function openFieldSource(fieldKey: string, field: RpReportField) {
  const cached = sourceCache.value[fieldKey]
  if (cached) {
    openSourceModal(fieldKey, { value: field.value, source_doc: cached.source_doc ?? undefined, source_location: cached.source_location ?? undefined, raw_text: cached.raw_text ?? undefined, context: cached.context ?? undefined }, field.label)
    return
  }

  openSourceModalLoading(fieldKey, field.label)
  try {
    const result = await $fetch<SourceResult>(`/api/submissions/${submissionId}/field-source`, {
      method: 'POST',
      body: { field_key: fieldKey, label: field.label, value: field.value },
    })
    sourceCache.value = { ...sourceCache.value, [fieldKey]: result }
    if (sourceModal.value?.key === fieldKey) {
      openSourceModal(fieldKey, { value: field.value, source_doc: result.source_doc ?? undefined, source_location: result.source_location ?? undefined, raw_text: result.raw_text ?? undefined, context: result.context ?? undefined }, field.label)
    }
  } catch (e: any) {
    console.error('[field-source] fetch failed:', e?.message)
  }
}

type StatusKey = 'ok' | 'warn' | 'fail' | 'na' | 'unconfirmed'

const STATUS_META: Record<StatusKey, { color: string; bg: string; label: string }> = {
  ok:          { color: '#1A6E3C', bg: '#EDF7F2', label: 'Confirmed'     },
  warn:        { color: '#9A5C00', bg: '#FFF6E8', label: 'Review'        },
  fail:        { color: '#9B1C1C', bg: '#FEF2F2', label: 'Hard Stop'     },
  na:          { color: '#9AAABB', bg: '#F4F5F6', label: 'N/A'           },
  unconfirmed: { color: '#9B1C1C', bg: '#FEF2F2', label: 'Not Confirmed' },
}

const LINE_META: Record<string, { icon: string; color: string }> = {
  property:     { icon: 'PRP', color: '#A8C0E0' },
  gl:           { icon: 'GL',  color: '#7FD1C8' },
  auto:         { icon: 'AUT', color: '#90B4E0' },
  wc:           { icon: 'WC',  color: '#C4A0E0' },
  im_transit:   { icon: 'TRN', color: '#C4A080' },
  im_equipment: { icon: 'EQP', color: '#B4906A' },
  im_br:        { icon: 'BR',  color: '#A47860' },
  im:           { icon: 'IM',  color: '#C4A080' },
  umbrella:     { icon: 'UMB', color: '#80B0D0' },
}

const lineMeta = (type: string) => LINE_META[type] ?? { icon: type.slice(0, 3).toUpperCase(), color: '#A8C0E0' }

const lines = computed<RpLine[]>(() => props.report?.lines ?? [])
const activeLine = ref(lines.value[0]?.line_type ?? '')
const locIdx = ref(0)

const activeLineData = computed<RpLine>(() =>
  lines.value.find(l => l.line_type === activeLine.value) ?? lines.value[0] ?? ({} as RpLine)
)

const hasLocations = computed(() =>
  Array.isArray(activeLineData.value.locations) && (activeLineData.value.locations?.length ?? 0) > 0
)

const activeLoc = computed<RpLocation | null>(() =>
  hasLocations.value ? (activeLineData.value.locations?.[locIdx.value] ?? null) : null
)

const activeSections = computed<RpSection[]>(() =>
  hasLocations.value ? (activeLoc.value?.sections ?? []) : (activeLineData.value.sections ?? [])
)

const openSections = ref(new Set<string>())

watch(activeSections, (secs) => {
  const initial = new Set<string>()
  if (secs.length) initial.add(sectionKey(0))
  openSections.value = initial
}, { immediate: true })

function sectionKey(si: number) {
  return `${activeLine.value}:${locIdx.value}:${si}`
}

function isSectionOpen(si: number) {
  return openSections.value.has(sectionKey(si))
}

function toggleSection(si: number) {
  const k = sectionKey(si)
  const next = new Set(openSections.value)
  next.has(k) ? next.delete(k) : next.add(k)
  openSections.value = next
}

function switchLine(type: string) {
  activeLine.value = type
  locIdx.value = 0
}

function amendKey(si: number, fi: number) {
  return `rp:${activeLine.value}:${locIdx.value}:${si}:${fi}`
}

function isFlagged(field: RpReportField) {
  return ['fail', 'warn', 'unconfirmed'].includes(field.status)
}

function worstForFields(fields: RpReportField[]): StatusKey {
  if (fields.some(f => ['fail', 'unconfirmed'].includes(f.status))) return 'fail'
  if (fields.some(f => f.status === 'warn')) return 'warn'
  return 'ok'
}

function worstForSection(sec: RpSection): StatusKey {
  return worstForFields(sec.fields ?? [])
}

function worstForLoc(loc: RpLocation): StatusKey {
  return worstForFields((loc.sections ?? []).flatMap(s => s.fields ?? []))
}

function flagCount(sec: RpSection) {
  return (sec.fields ?? []).filter(isFlagged).length
}

const expandedFields = ref(new Set<string>())

function expandKey(si: number, fi: number) {
  return `${activeLine.value}:${locIdx.value}:${si}:${fi}`
}

function isLong(field: RpReportField) {
  return (field.value?.length ?? 0) > 80
}

function isExpanded(si: number, fi: number) {
  return expandedFields.value.has(expandKey(si, fi))
}

function toggleExpand(si: number, fi: number) {
  const k = expandKey(si, fi)
  const next = new Set(expandedFields.value)
  next.has(k) ? next.delete(k) : next.add(k)
  expandedFields.value = next
}
</script>
