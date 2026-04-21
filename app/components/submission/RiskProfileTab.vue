<template>
  <div v-if="lines.length" class="rp-root">

    <!-- Header -->
    <div class="rp-header">
      <div class="rp-header-top">
        <div class="rp-line-icon-wrap">
          <span class="rp-line-icon">{{ lineMeta(activeLine).icon }}</span>
        </div>
        <div>
          <p class="rp-insured-label">{{ report?.risk_summary?.named_insured || '' }}</p>
          <p class="rp-line-title">{{ activeLineData.label || activeLine }}</p>
        </div>
      </div>

      <div v-if="lines.length > 1" class="rp-tabs">
        <button
          v-for="line in lines"
          :key="line.line_type"
          class="rp-tab"
          :class="{ 'rp-tab--active': activeLine === line.line_type }"
          :style="activeLine === line.line_type ? { color: lineMeta(line.line_type).color, borderBottomColor: lineMeta(line.line_type).color } : {}"
          @click="switchLine(line.line_type)"
        >
          <span>{{ lineMeta(line.line_type).icon }}</span>
          <span>{{ line.label || line.line_type }}</span>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="rp-body">

      <!-- Location pills + address (property / multi-location) -->
      <template v-if="hasLocations">
        <div class="rp-loc-pills">
          <button
            v-for="(loc, i) in activeLineData.locations"
            :key="i"
            class="rp-loc-pill"
            :class="{ 'rp-loc-pill--active': locIdx === i }"
            @click="locIdx = i"
          >
            <span
              v-if="locIdx !== i"
              class="rp-loc-dot"
              :style="{ background: STATUS_META[worstForLoc(loc)].color }"
            />
            {{ loc.id || `LOC ${String(i + 1).padStart(3, '0')}` }}
          </button>
        </div>

        <div v-if="activeLoc?.address || activeLoc?.tiv" class="rp-address-bar">
          <div class="rp-address-left">
            <span class="rp-address-text">{{ activeLoc.address || 'Address not provided' }}</span>
          </div>
          <span v-if="activeLoc.tiv" class="rp-tiv">TIV {{ activeLoc.tiv }}</span>
        </div>
      </template>

      <!-- Sections -->
      <template v-if="activeSections.length">
        <div
          v-for="(sec, si) in activeSections"
          :key="sectionKey(si)"
          class="rp-section"
          :class="`rp-section--${worstForSection(sec)}`"
        >
          <button class="rp-section-header" @click="toggleSection(si)">
            <span class="rp-section-title">{{ sec.title }}</span>
            <span
              v-if="flagCount(sec) > 0"
              class="rp-flag-badge"
              :style="{ color: STATUS_META[worstForSection(sec)].color, background: STATUS_META[worstForSection(sec)].bg }"
            >
              {{ flagCount(sec) }} {{ worstForSection(sec) === 'fail' ? 'hard stop' : 'flag' }}{{ flagCount(sec) > 1 ? 's' : '' }}
            </span>
            <span class="rp-chevron">{{ isSectionOpen(si) ? '▲' : '▼' }}</span>
          </button>

          <div v-if="isSectionOpen(si)" class="rp-section-body">
            <div
              v-for="(field, fi) in sec.fields"
              :key="fi"
              class="rp-field-row"
            >
              <div
                class="rp-indicator"
                :style="{ background: isFlagged(field) ? STATUS_META[field.status].color : 'transparent' }"
              />

              <div class="rp-field-content">
                <p class="rp-field-label">{{ field.label }}</p>

                <!-- Editing -->
                <template v-if="editingKey === amendKey(si, fi)">
                  <input
                    ref="editInputRef"
                    v-model="editDraft"
                    type="text"
                    class="rp-edit-input"
                    @keydown.enter="saveEdit(amendKey(si, fi), field.value)"
                    @keydown.escape="cancelEdit"
                  />
                  <div class="rp-edit-actions">
                    <button class="rp-btn-save" @click="saveEdit(amendKey(si, fi), field.value)">Save</button>
                    <button class="rp-btn-cancel" @click="cancelEdit">Cancel</button>
                  </div>
                </template>

                <!-- Display -->
                <template v-else>
                  <span v-if="amendments[amendKey(si, fi)]" class="rp-amended-badge">Amended</span>
                  <p
                    class="rp-field-value"
                    :class="{
                      'rp-field-value--flagged': isFlagged(field),
                      'rp-field-value--clipped': isLong(field) && !isExpanded(si, fi),
                    }"
                    :style="isFlagged(field) ? { color: STATUS_META[field.status].color } : {}"
                  >
                    <template v-if="field.status === 'unconfirmed'">Not confirmed — source document required</template>
                    <template v-else>{{ amendments[amendKey(si, fi)]?.amendedValue ?? field.value }}</template>
                  </p>
                  <button
                    v-if="isLong(field) && field.status !== 'unconfirmed'"
                    class="rp-expand-btn"
                    @click="toggleExpand(si, fi)"
                  >{{ isExpanded(si, fi) ? 'show less ▲' : 'show more ▼' }}</button>
                  <p v-if="amendments[amendKey(si, fi)]" class="rp-field-original">Original: {{ field.value }}</p>
                  <p v-if="field.note" class="rp-field-note">{{ field.note }}</p>
                </template>
              </div>

              <button
                v-if="editingKey !== amendKey(si, fi)"
                class="rp-inspect-btn"
                title="Inspect source"
                @click="openSourceModal(
                  amendKey(si, fi),
                  {
                    value: amendments[amendKey(si, fi)]?.amendedValue ?? field.value,
                    source_doc: field.source?.source_doc,
                    source_location: field.source?.source_location,
                    raw_text: field.source?.raw_text,
                    context: field.source?.context,
                  },
                  field.label
                )"
              >↗</button>
            </div>
          </div>
        </div>
      </template>
      <p v-else class="rp-empty">No sections extracted for this line of business.</p>
    </div>
  </div>
  <div v-else class="rp-empty-state">No risk profile data available.</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { AMENDMENTS_KEY } from '~/composables/useAmendments'
import type { RiskReport, RpLine, RpSection, RpLocation, RpReportField } from '~/types/submission'

const props = defineProps<{ report?: RiskReport | null }>()

const { amendments, editingKey, editDraft, editInputRef, saveEdit, cancelEdit, openSourceModal } = inject(AMENDMENTS_KEY)!

type StatusKey = 'ok' | 'warn' | 'fail' | 'na' | 'unconfirmed'

const STATUS_META: Record<StatusKey, { color: string; bg: string; label: string }> = {
  ok:          { color: '#1A6E3C', bg: '#EDF7F2', label: 'Confirmed'     },
  warn:        { color: '#9A5C00', bg: '#FFF6E8', label: 'Review'        },
  fail:        { color: '#9B1C1C', bg: '#FEF2F2', label: 'Hard Stop'     },
  na:          { color: '#9AAABB', bg: '#F4F5F6', label: 'N/A'           },
  unconfirmed: { color: '#9B1C1C', bg: '#FEF2F2', label: 'Not Confirmed' },
}

const LINE_META: Record<string, { icon: string; color: string }> = {
  property: { icon: 'PRP', color: '#A8C0E0' },
  gl:       { icon: 'GL',  color: '#7FD1C8' },
  auto:     { icon: 'AUT', color: '#90B4E0' },
  wc:       { icon: 'WC',  color: '#C4A0E0' },
  im:       { icon: 'IM',  color: '#C4A080' },
  umbrella: { icon: 'UMB', color: '#80B0D0' },
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
  secs.slice(0, 2).forEach((_, i) => initial.add(sectionKey(i)))
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
  if (openSections.value.has(k)) openSections.value.delete(k)
  else openSections.value.add(k)
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

// Show more / show less
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
  if (expandedFields.value.has(k)) expandedFields.value.delete(k)
  else expandedFields.value.add(k)
}
</script>

<style scoped>
.rp-root {
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Header */
.rp-header {
  background: #0B1829;
  border-radius: 10px 10px 0 0;
  padding: 16px 16px 0;
}

.rp-header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.rp-line-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  color: rgba(255,255,255,.8);
  flex-shrink: 0;
}

.rp-insured-label {
  font-size: 12px;
  color: rgba(255,255,255,.6);
  letter-spacing: .04em;
  text-transform: uppercase;
  margin: 0 0 2px;
}

.rp-line-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -.01em;
  margin: 0;
}

/* Tabs (inside header) */
.rp-tabs {
  display: flex;
  overflow-x: auto;
  border-top: 1px solid rgba(255,255,255,.08);
  margin: 0 -16px;
  padding: 0 16px;
  scrollbar-width: none;
}
.rp-tabs::-webkit-scrollbar { display: none; }

.rp-tab {
  padding: 11px 14px;
  font-size: 13px;
  font-weight: 400;
  color: rgba(255,255,255,.6);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  transition: color .15s, border-color .15s;
}
.rp-tab--active { font-weight: 600; }

/* Body */
.rp-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }

/* Location pills */
.rp-loc-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.rp-loc-pill {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 400;
  color: #2C4060;
  background: #fff;
  border: 1px solid rgba(11,24,41,.08);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: inherit;
  transition: background .15s, color .15s;
}
.rp-loc-pill--active {
  font-weight: 600;
  color: #fff;
  background: #0B1829;
  border-color: #0B1829;
  box-shadow: 0 2px 8px rgba(11,24,41,.18);
}
.rp-loc-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

.rp-address-bar {
  padding: 10px 12px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid rgba(11,24,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rp-address-left { display: flex; align-items: center; gap: 8px; }
.rp-address-text { font-size: 14px; color: #0B1829; font-weight: 500; }
.rp-tiv {
  font-size: 11px;
  font-family: monospace;
  color: #5A7290;
  background: #F6F3EE;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

/* Sections */
.rp-section {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(11,24,41,.08);
  background: #fff;
}
.rp-section--fail { border-color: rgba(155,28,28,.2); }
.rp-section--warn { border-color: rgba(154,92,0,.12); }

.rp-section-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.rp-section-title {
  font-size: 11px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #0B1829;
  font-weight: 700;
  flex: 1;
}
.rp-flag-badge {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 20px;
  font-weight: 600;
}
.rp-chevron { font-size: 10px; color: #1E3A50; }

.rp-section-body { padding: 0 14px 10px; }

/* Field rows */
.rp-field-row {
  padding: 8px 0;
  border-bottom: 1px solid rgba(11,24,41,.05);
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.rp-field-row:last-child { border-bottom: none; }

.rp-indicator {
  width: 3px;
  border-radius: 2px;
  flex-shrink: 0;
  align-self: stretch;
  min-height: 16px;
  margin-top: 2px;
}
.rp-field-content { flex: 1; min-width: 0; }

.rp-field-label {
  font-size: 11px;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: #1E3A50;
  font-weight: 700;
  margin: 0 0 3px;
}
.rp-field-value {
  font-size: 15px;
  line-height: 1.5;
  color: #060E1A;
  margin: 0;
}
.rp-field-value--flagged { font-weight: 500; font-style: italic; }
.rp-field-value--clipped {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rp-expand-btn {
  font-size: 12px;
  color: #1E3A50;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 0;
  font-family: inherit;
}
.rp-field-original { font-size: 12px; color: #1E3A50; margin: 2px 0 0; }
.rp-field-note { font-size: 12px; color: #1E3A50; margin: 4px 0 0; line-height: 1.4; }

.rp-amended-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 20px;
  background: #FFF6E8;
  color: #9A5C00;
  border: 1px solid #F5D09A;
  margin-bottom: 3px;
}

/* Inline edit */
.rp-edit-input {
  width: 100%;
  background: #F6F3EE;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 14px;
  color: #0B1829;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color .15s, background .15s;
}
.rp-edit-input:focus { border-color: #2E5FA3; background: #fff; }
.rp-edit-actions { display: flex; gap: 6px; margin-top: 6px; }
.rp-btn-save {
  font-size: 13px;
  font-weight: 700;
  color: #050A18;
  background: #C8A84B;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.rp-btn-cancel {
  font-size: 13px;
  font-weight: 500;
  color: #5A7290;
  background: transparent;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background .1s;
}
.rp-btn-cancel:hover { background: #F6F3EE; }

/* Inspect button */
.rp-inspect-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid rgba(11,24,41,.15);
  background: #E8EDF2;
  color: #1E3A50;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-family: inherit;
  transition: background .1s, color .1s;
}
.rp-inspect-btn:hover { background: #0B1829; color: #fff; }


/* Footer */
.rp-footer-label {
  text-align: center;
  font-size: 10px;
  color: #5A7290;
  letter-spacing: .1em;
  margin: 6px 0 0;
}

/* Empty states */
.rp-empty { padding: 24px; text-align: center; color: #1E3A50; font-size: 14px; }
.rp-empty-state { padding: 48px; text-align: center; font-size: 15px; color: #1E3A50; }
</style>
