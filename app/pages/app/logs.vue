<template>
  <div class="logs-root">

    <div class="logs-toolbar">
      <div class="logs-toolbar-left">
        <img src="/PelorusLogo.png" width="20" height="20" alt="Pelorus mark" />
        <span class="logs-title">Server Logs</span>
        <span class="logs-dot" :class="connected ? 'logs-dot--live' : 'logs-dot--dead'" />
        <span class="logs-status">{{ connected ? 'Live' : 'Disconnected' }}</span>
      </div>
      <div class="logs-toolbar-right">
        <div class="logs-filters">
          <button
            v-for="l in LEVELS"
            :key="l"
            class="logs-filter-btn"
            :class="{ active: levels.has(l) }"
            :data-level="l"
            @click="toggleLevel(l)"
          >{{ l }}</button>
        </div>
        <input v-model="search" class="logs-search" placeholder="Filter…" />
        <button class="logs-btn" @click="clear">Clear</button>
        <button class="logs-btn" :class="{ active: pinBottom }" @click="pinBottom = !pinBottom">
          {{ pinBottom ? '↓ Pinned' : '↓ Pin' }}
        </button>
      </div>
    </div>

    <div ref="viewport" class="logs-viewport" @scroll="onScroll">
      <div
        v-for="e in visible"
        :key="e.id"
        class="logs-row"
        :class="`logs-row--${e.level}`"
      >
        <span class="logs-ts">{{ fmt(e.ts) }}</span>
        <span class="logs-badge" :class="`logs-badge--${e.level}`">{{ e.level }}</span>
        <span class="logs-msg" v-html="highlight(e.msg)" />
      </div>
      <div v-if="!visible.length" class="logs-empty">No entries match the current filter.</div>
    </div>

    <div class="logs-footer">
      <span>{{ visible.length }} / {{ entries.length }} entries</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

definePageMeta({ layout: 'logs' })

type Level = 'log' | 'warn' | 'error'
type Entry = { id: number; ts: number; level: Level; msg: string }

const LEVELS: Level[] = ['log', 'warn', 'error']

const entries   = ref<Entry[]>([])
const levels    = ref(new Set<Level>(LEVELS))
const search    = ref('')
const pinBottom = ref(true)
const connected = ref(false)
const viewport  = ref<HTMLElement | null>(null)

let es: EventSource | null = null
let lastId = 0

const visible = computed(() => {
  const q = search.value.toLowerCase()
  return entries.value.filter(e =>
    levels.value.has(e.level) &&
    (!q || e.msg.toLowerCase().includes(q))
  )
})

function toggleLevel(l: Level) {
  const s = new Set(levels.value)
  s.has(l) ? s.delete(l) : s.add(l)
  levels.value = s
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })
}

function highlight(msg: string) {
  const q = search.value
  if (!q) return esc(msg)
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return esc(msg).replace(re, '<mark>$1</mark>')
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clear() {
  entries.value = []
}

function onScroll() {
  if (!viewport.value) return
  const { scrollTop, scrollHeight, clientHeight } = viewport.value
  pinBottom.value = scrollHeight - scrollTop - clientHeight < 40
}

async function scrollToBottom() {
  await nextTick()
  if (pinBottom.value && viewport.value) {
    viewport.value.scrollTop = viewport.value.scrollHeight
  }
}

watch(visible, scrollToBottom)

function connect() {
  es?.close()
  es = new EventSource(`/api/logs/stream?since=${lastId}`)
  es.onopen = () => { connected.value = true }
  es.onmessage = (ev) => {
    try {
      const entry: Entry = JSON.parse(ev.data)
      entries.value.push(entry)
      if (entries.value.length > 5000) entries.value.splice(0, entries.value.length - 5000)
      lastId = Math.max(lastId, entry.id)
    } catch {}
  }
  es.onerror = () => {
    connected.value = false
    es?.close()
    setTimeout(connect, 3000)
  }
}

onMounted(connect)
onUnmounted(() => es?.close())
</script>

<style scoped>
.logs-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0B1829;
  font-family: 'DM Mono', 'Fira Code', monospace;
  color: #C8D8E8;
  font-size: 12px;
}

.logs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  background: #0D1F33;
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.logs-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logs-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  letter-spacing: .04em;
}

.logs-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.logs-dot--live  { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
.logs-dot--dead  { background: #ef4444; }

.logs-status {
  font-size: 11px;
  color: rgba(255,255,255,.4);
}

.logs-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.logs-filters {
  display: flex;
  gap: 4px;
}

.logs-filter-btn {
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.12);
  background: transparent;
  color: rgba(255,255,255,.35);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
}
.logs-filter-btn.active[data-level="log"]   { background: rgba(100,160,255,.15); color: #7CB8FF; border-color: rgba(100,160,255,.3); }
.logs-filter-btn.active[data-level="warn"]  { background: rgba(250,180,60,.15);  color: #F5B942; border-color: rgba(250,180,60,.3); }
.logs-filter-btn.active[data-level="error"] { background: rgba(240,80,80,.15);   color: #F87171; border-color: rgba(240,80,80,.3); }

.logs-search {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  color: #C8D8E8;
  font-family: inherit;
  font-size: 11px;
  padding: 4px 10px;
  outline: none;
  width: 160px;
  transition: border-color .15s;
}
.logs-search:focus { border-color: rgba(100,160,255,.5); }
.logs-search::placeholder { color: rgba(255,255,255,.25); }

.logs-btn {
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.1);
  background: transparent;
  color: rgba(255,255,255,.5);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.logs-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
.logs-btn.active { background: rgba(100,160,255,.2); color: #7CB8FF; border-color: rgba(100,160,255,.3); }

.logs-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.12) transparent;
}
.logs-viewport::-webkit-scrollbar { width: 6px; }
.logs-viewport::-webkit-scrollbar-track { background: transparent; }
.logs-viewport::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px; }

.logs-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 2px 16px;
  border-bottom: 1px solid transparent;
  line-height: 1.6;
}
.logs-row:hover { background: rgba(255,255,255,.03); }
.logs-row--warn  { background: rgba(250,180,60,.04); }
.logs-row--error { background: rgba(240,80,80,.06); }

.logs-ts {
  flex-shrink: 0;
  color: rgba(255,255,255,.25);
  font-size: 10.5px;
  letter-spacing: .02em;
}

.logs-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 4px;
  min-width: 38px;
  text-align: center;
}
.logs-badge--log   { background: rgba(100,160,255,.12); color: #7CB8FF; }
.logs-badge--warn  { background: rgba(250,180,60,.15);  color: #F5B942; }
.logs-badge--error { background: rgba(240,80,80,.18);   color: #F87171; }

.logs-msg {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
  color: #C8D8E8;
}
.logs-row--warn  .logs-msg { color: #F5D89A; }
.logs-row--error .logs-msg { color: #FCA5A5; }

/* mark highlight — injected via v-html */

.logs-empty {
  padding: 48px;
  text-align: center;
  color: rgba(255,255,255,.2);
  font-size: 13px;
}

.logs-footer {
  padding: 6px 16px;
  border-top: 1px solid rgba(255,255,255,.06);
  color: rgba(255,255,255,.25);
  font-size: 10px;
  flex-shrink: 0;
  text-align: right;
}
</style>
