<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <AppHeader variant="app">
      <div class="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-14">
        <div class="flex items-center gap-4 min-w-0">
          <NuxtLink
            to="/app"
            class="flex items-center gap-1.5 text-[14px] text-gray-600 hover:text-gray-800 transition-colors duration-150 flex-shrink-0"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Dashboard
          </NuxtLink>
          <span class="text-gray-500 flex-shrink-0">·</span>
          <div class="flex items-center gap-2 min-w-0">
            <img src="/PelorusLogo.png" width="22" height="22" alt="Pelorus" class="flex-shrink-0" />
            <span class="text-[16px] font-semibold text-gray-900 tracking-[-0.3px] truncate">
              {{ namedInsured || 'Submission Review' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Download PDF -->
          <button
            v-if="verdict"
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200/70 hover:border-gray-300 text-gray-800 hover:text-gray-900 text-[14px] font-medium transition-all duration-150 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            :disabled="isDownloading"
            @click="downloadPdf"
          >
            <svg v-if="!isDownloading" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            {{ isDownloading ? 'Generating…' : 'Download PDF' }}
          </button>
        </div>
      </div>
    </AppHeader>

    <!-- ── Main ────────────────────────────────────────────────── -->
    <main
      class="mx-auto px-4 sm:px-6 py-7 flex flex-col gap-5 transition-all duration-200"
      :class="activeTab === 'Risk Profile' && verdict ? 'max-w-[1400px]' : 'max-w-4xl'"
    >
      <div v-if="isLoading" class="py-20 text-center text-[15px] text-gray-600">Loading…</div>
      <div v-else-if="loadError" class="py-20 text-center text-[15px] text-red-600">{{ loadError }}</div>

      <template v-else>

        <!-- Decision Card -->
        <div
          v-if="verdict"
          class="rounded-2xl p-6 sm:p-7 border"
          :style="decisionCardStyle"
        >
          <div class="flex items-start justify-between gap-6">
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-bold tracking-[0.12em] uppercase mb-3" :style="{ color: decisionColors.label }">Decision</p>
              <span
                class="inline-flex items-center px-3.5 py-1 rounded-full text-[14px] font-bold tracking-[0.04em] uppercase mb-4"
                :style="{ background: decisionColors.pillBg, color: decisionColors.pillText }"
              >{{ verdict.decision }}</span>
              <p class="text-[16px] leading-[1.7] mb-4 text-gray-800">{{ verdict.recommendation?.summary }}</p>
              <div class="flex items-center flex-wrap gap-2">
                <span v-if="portfolioTiv" class="text-[14px] text-gray-700">TIV: {{ portfolioTiv }}</span>
                <span v-if="verdict.analyzed_in_seconds" class="text-[13px] font-medium px-2.5 py-1 rounded-full" :style="{ background: decisionColors.metaBg, color: decisionColors.meta }">
                  Analyzed in {{ verdict.analyzed_in_seconds }}s
                </span>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end">
              <span class="leading-none tracking-[-3px]" style="font-size:68px;font-weight:300" :style="{ color: decisionColors.score }">
                {{ normalizeScore(verdict.composite_score).toFixed(1) }}
              </span>
              <span class="text-[14px] font-medium -mt-1" :style="{ color: decisionColors.scoreLabel }">out of 10</span>
            </div>
          </div>
        </div>

        <!-- Dimension Scores -->
        <div v-if="dimGroups.length" class="glass-card p-5 sm:p-6">
          <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900 mb-5">Dimension Scores</p>
          <div v-for="(group, gi) in dimGroups" :key="group.locationId || gi">
            <!-- Location header — only when grouped by location -->
            <div
              v-if="dimGroups.length > 1"
              class="flex items-center gap-2 mb-3"
              :class="gi > 0 ? 'mt-5 pt-5 border-t border-gray-100' : ''"
            >
              <span class="text-[12px] font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded tracking-[0.04em]">{{ group.locationId }}</span>
              <span v-if="group.address" class="text-[13px] text-gray-600 truncate">{{ group.address }}</span>
            </div>
            <div class="flex flex-col divide-y divide-gray-100">
              <!-- Numeric fields → bar chart -->
              <div v-for="f in group.numericFields" :key="f.label" class="flex items-center gap-4 py-2.5">
                <span class="text-[10px] font-black uppercase tracking-[0.13em] text-gray-700 w-36 flex-shrink-0">{{ f.label }}</span>
                <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-1.5 rounded-full transition-all duration-700"
                    :class="f.score >= 7.5 ? 'bg-green-500' : f.score >= 5.0 ? 'bg-accent-500' : 'bg-red-500'"
                    :style="{ width: `${f.score * 10}%` }"
                  />
                </div>
                <span class="text-[15px] font-semibold text-gray-800 w-8 text-right flex-shrink-0">{{ f.score.toFixed(1) }}</span>
              </div>
              <!-- Text fields → stacked label / value -->
              <div v-for="f in group.textFields" :key="f.label" class="py-2 border-b border-gray-100 last:border-0">
                <p class="text-[10px] font-black uppercase tracking-[0.13em] text-gray-600 mb-0.5">{{ f.label }}</p>
                <span class="text-[15px] text-gray-900">{{ f.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="verdict">
          <div class="bg-gray-100 border border-gray-200 rounded-xl p-1 mb-5 flex gap-0.5">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="flex-1 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 cursor-pointer"
              :class="activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:text-gray-800'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- ── Summary tab ──────────────────────────────────── -->
          <div v-if="activeTab === 'Summary'" class="flex flex-col gap-4">

            <!-- Recommended Next Action -->
            <div class="glass-card p-5 sm:p-6">
              <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900 mb-3">Recommended Next Action</p>
              <ol class="flex flex-col gap-2.5 list-none">
                <li v-for="(item, i) in verdict.recommendation?.action_items" :key="i" class="flex gap-3 text-[15px] text-gray-800 leading-relaxed">
                  <span class="text-[#92700A] font-bold flex-shrink-0 w-4">{{ i + 1 }}.</span>{{ item }}
                </li>
              </ol>
            </div>

            <!-- Concerns & Flags -->
            <div v-if="sortedFlags.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Concerns &amp; Flags</p>
                <span class="text-[14px] text-gray-600">{{ sortedFlags.length }} item{{ sortedFlags.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="flex flex-col divide-y divide-gray-100 overflow-y-auto" style="max-height:min(50vh,480px)">
                <div v-for="(flag, i) in sortedFlags" :key="i" class="px-5 sm:px-6 py-5 flex gap-4"
                  :class="flag.type === 'CONDITION' ? 'bg-red-50/40' : 'bg-amber-50/30'">
                  <div class="w-[3px] rounded-full flex-shrink-0 mt-0.5" :class="flag.type === 'CONDITION' ? 'bg-red-500' : 'bg-amber-500'" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start gap-2 mb-1.5">
                      <p class="text-[15px] font-semibold text-gray-900 flex-1 min-w-0">{{ flag.title }}</p>
                      <span
                        class="text-[11px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                        :class="flag.type === 'CONDITION' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'"
                      >{{ flag.type }}</span>
                    </div>
                    <p class="text-[15px] text-gray-800 leading-relaxed mb-2.5">{{ flag.explanation }}</p>
                    <p class="text-[14px] text-gray-700 mb-1.5"><span class="font-semibold text-gray-800">Action:</span> {{ flag.action_required }}</p>
                    <p class="text-[13px] text-gray-600"><span class="font-semibold text-gray-700">Ref:</span> {{ flag.cited_section }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Favorable Factors -->
            <div v-if="verdict.favorable_factors?.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Favorable Factors</p>
              </div>
              <ul class="flex flex-col divide-y divide-gray-100 list-none">
                <li v-for="(f, i) in verdict.favorable_factors" :key="i" class="flex items-start gap-3 px-5 sm:px-6 py-4 text-[15px] text-gray-800 leading-relaxed">
                  <svg class="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ f }}
                </li>
              </ul>
            </div>

          </div>

          <!-- ── Guidelines tab ───────────────────────────────── -->
          <div v-else-if="activeTab === 'Guidelines'">
            <div class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Guideline Checks</p>
                <span class="text-[14px] text-gray-600">
                  <span v-if="verdict.guideline_checks?.length">{{ verdict.guideline_checks.length }} check{{ verdict.guideline_checks.length !== 1 ? 's' : '' }} require attention</span>
                  <span v-else class="text-green-700 font-medium">All checks passed</span>
                </span>
              </div>
              <div class="overflow-x-auto overflow-y-auto" style="max-height:min(62vh,600px)">
                <table class="w-full text-left text-[15px]">
                  <thead class="sticky top-0 z-10">
                    <tr class="border-b border-gray-100 bg-gray-50">
                      <th class="th-cell">Rule</th>
                      <th class="th-cell">Required</th>
                      <th class="th-cell">Submitted</th>
                      <th class="th-cell w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="(check, i) in verdict.guideline_checks"
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
                        <p class="text-gray-800 leading-relaxed">{{ check.submitted }}</p>
                        <p v-if="check.submission_source && check.submission_source !== 'Not disclosed'" class="text-[13px] text-gray-600 mt-1"><span class="font-semibold text-gray-700">Source:</span> {{ check.submission_source }}</p>
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
          </div>

          <!-- ── Insights tab ─────────────────────────────────── -->
          <div v-else-if="activeTab === 'Insights'" class="flex flex-col gap-4">
            <div v-if="verdict.insights" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Underwriting Insights</p>
              </div>
              <div class="divide-y divide-gray-100 overflow-y-auto" style="max-height:min(55vh,520px)">
                <div v-for="(value, key) in verdict.insights" :key="key" class="px-5 sm:px-6 py-5">
                  <p class="text-[11px] font-black uppercase tracking-[0.13em] text-gray-900 mb-2">{{ formatKey(key) }}</p>
                  <p class="text-[15px] text-gray-800 leading-relaxed">{{ value }}</p>
                </div>
              </div>
            </div>
            <div v-if="verdict.missing_info?.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Missing Information</p>
              </div>
              <div class="flex flex-col divide-y divide-gray-100">
                <div v-for="(item, i) in verdict.missing_info" :key="i" class="px-5 sm:px-6 py-4">
                  <div class="flex items-center gap-2 mb-1.5">
                    <p class="text-[15px] font-semibold text-gray-900">{{ item.label }}</p>
                    <span
                      v-if="item.priority"
                      class="text-[11px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                      :class="item.priority === 'BINDING' ? 'bg-red-50 text-red-700 border border-red-200' : item.priority === 'PRE_BIND' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-800'"
                    >{{ item.priority }}</span>
                  </div>
                  <p class="text-[15px] text-gray-800 leading-relaxed">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Risk Profile tab ─────────────────────────────── -->
          <div v-else-if="activeTab === 'Risk Profile'">
            <div v-if="verdict.risk_profile && Object.keys(verdict.risk_profile).length" class="glass-card overflow-hidden">
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-100">
                <div v-for="(raw, key) in verdict.risk_profile" :key="key" class="bg-white px-4 py-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.13em] text-gray-600 mb-0.5">{{ formatKey(key) }}</p>
                  <span v-if="!rpIsBlank(raw)" class="text-[15px] font-semibold text-gray-900">{{ rpValue(raw) }}</span>
                  <span v-else class="text-[15px] text-gray-500">—</span>
                  <p v-if="rpSource(raw)" class="text-[12px] text-gray-600 mt-0.5 truncate" :title="rpSource(raw)!">{{ rpSource(raw) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="py-12 text-center text-[15px] text-gray-600">No risk profile data available.</div>
          </div>
        </div>

        <!-- No verdict -->
        <div v-else class="glass-card p-12 sm:p-16 text-center">
          <template v-if="submission?.status === 'error'">
            <div class="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <svg class="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-[16px] font-medium text-red-600 mb-4">Evaluation failed</p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-[#050A18] px-5 py-2.5 rounded-xl text-[15px] font-bold transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >{{ isEvaluating ? 'Evaluating…' : 'Retry Evaluation' }}</button>
          </template>
          <template v-else>
            <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p class="text-[16px] text-gray-700 mb-4">
              {{ submission?.status === 'processing' ? 'Analysis in progress…' : 'Not yet evaluated' }}
            </p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-[#050A18] px-5 py-2.5 rounded-xl text-[15px] font-bold transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >{{ isEvaluating ? 'Evaluating…' : 'Run Evaluation' }}</button>
          </template>
          <p v-if="evalError" class="mt-3 text-[14px] text-red-600">{{ evalError }}</p>
        </div>

      </template>
    </main>

    <!-- ── Floating Chat Button ───────────────────────────────── -->
    <button
      class="fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full bg-accent-500 hover:bg-accent-400 text-[#050A18] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      style="width:52px;height:52px;box-shadow:0 4px 20px rgba(201,168,76,0.35)"
      aria-label="Open Research Assistant"
      @click="chatOpen = !chatOpen"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    </button>

    <!-- ── Chat Panel ───────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="chatOpen"
        class="fixed top-0 right-0 z-50 flex flex-col bg-white border-l border-gray-200 h-screen"
        style="width:min(680px,100vw)"
      >
        <!-- Chat header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-[#92700A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <span class="text-[16px] font-semibold text-gray-900 tracking-[-0.2px]">Research Assistant</span>
          </div>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
            aria-label="Close"
            @click="chatOpen = false"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-gray-50">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="px-3.5 py-2.5 text-[15px] leading-relaxed break-words"
              :class="
                msg.role === 'user'
                  ? 'bg-accent-500/10 border border-accent-500/20 text-gray-900 rounded-2xl rounded-tr-sm max-w-[80%] whitespace-pre-wrap'
                  : 'chat-assistant-msg bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm max-w-[85%]'
              "
              v-html="msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content"
            />
          </div>
          <div v-if="isThinking" class="flex justify-start">
            <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style="animation-delay:0ms"/>
              <span class="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style="animation-delay:160ms"/>
              <span class="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" style="animation-delay:320ms"/>
            </div>
          </div>
        </div>

        <p v-if="chatError" class="mx-4 mb-1 text-[14px] text-red-600 text-center">{{ chatError }}</p>

        <!-- Input area -->
        <div class="px-4 pb-4 pt-2 border-t border-gray-100 bg-white flex-shrink-0">
          <div class="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 focus-within:border-accent-500/50 transition-colors duration-150">
            <textarea
              ref="chatInputEl"
              v-model="chatInput"
              rows="1"
              placeholder="Ask about this submission…"
              class="flex-1 bg-transparent resize-none text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed"
              style="max-height:72px;overflow-y:auto"
              :disabled="isThinking"
              @keydown.enter.exact.prevent="sendMessage"
              @input="autoGrowTextarea"
            />
            <button
              class="flex-shrink-0 w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center transition-opacity cursor-pointer"
              :class="(!chatInput.trim() || isThinking) ? 'opacity-30' : 'opacity-100 hover:opacity-80'"
              :disabled="!chatInput.trim() || isThinking"
              aria-label="Send"
              @click="sendMessage"
            >
              <svg class="w-3.5 h-3.5 text-[#050A18]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p class="text-[12px] text-gray-600 text-center mt-2">Shift+Enter for new line · Enter to send</p>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

function renderMarkdown(content: string): string {
  return DOMPurify.sanitize(marked.parse(content, { breaks: true }) as string)
}

type RpField = string | { value: string; source?: string }

type Verdict = {
  decision: 'PROCEED' | 'REFER' | 'DECLINE'
  composite_score: number
  dimension_scores: Record<string, number>
  recommendation: { summary: string; action_items: string[] }
  flags: Array<{ title: string; type: string; explanation: string; action_required: string; cited_section: string }>
  favorable_factors: string[]
  guideline_checks: Array<{ rule: string; required: string; submitted: string; submission_source?: string; status: string; cited_section: string }>
  insights: Record<string, string>
  missing_info: Array<{ label: string; description: string; priority?: string }>
  risk_profile?: Record<string, { value: string; source?: string } | string>
  analyzed_in_seconds?: string
}

type SubmissionResponse = {
  id: string
  org_id: string
  status: string
  source: string
  broker_email: string | null
  created_at: string
  extracted_fields?: Record<string, any> | null
  verdict: Verdict | null
}

const route = useRoute()
const id = route.params.id as string
const submission = ref<SubmissionResponse | null>(null)
const verdict = computed(() => submission.value?.verdict ?? null)

const namedInsured = computed(() => {
  const raw = verdict.value?.risk_profile?.named_insured
  if (raw === undefined) return null
  return rpValue(raw) || null
})

const portfolioTiv = computed(() => {
  const raw = verdict.value?.risk_profile?.tiv
  if (!raw) return null
  const v = rpValue(raw)
  return v && v !== 'Not disclosed' ? v : null
})

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const isEvaluating = ref(false)
const evalError = ref<string | null>(null)
const isDownloading = ref(false)
const tabs = ['Summary', 'Guidelines', 'Insights', 'Risk Profile'] as const
const activeTab = ref<(typeof tabs)[number]>('Summary')

const sortedFlags = computed(() => {
  if (!verdict.value?.flags) return []
  return [...verdict.value.flags].sort((a, b) => {
    if (a.type === 'CONDITION' && b.type !== 'CONDITION') return -1
    if (a.type !== 'CONDITION' && b.type === 'CONDITION') return 1
    return 0
  })
})

// Light-mode decision card colors — solid mid-tint backgrounds for clear contrast
const decisionColors = computed(() => {
  const d = verdict.value?.decision
  if (d === 'PROCEED') return {
    bg: '#dcfce7', border: '#86efac',
    label: '#15803d', meta: '#15803d',
    metaBg: '#bbf7d0', score: '#15803d', scoreLabel: 'rgba(21,128,61,0.5)',
    pillBg: '#bbf7d0', pillText: '#166534',
  }
  if (d === 'REFER') return {
    bg: '#fef3c7', border: '#fbbf24',
    label: '#92700A', meta: '#92700A',
    metaBg: '#fde68a', score: '#92700A', scoreLabel: 'rgba(146,112,10,0.5)',
    pillBg: '#fde68a', pillText: '#78580A',
  }
  return {
    bg: '#fee2e2', border: '#fca5a5',
    label: '#dc2626', meta: '#dc2626',
    metaBg: '#fecaca', score: '#dc2626', scoreLabel: 'rgba(220,38,38,0.5)',
    pillBg: '#fecaca', pillText: '#991b1b',
  }
})

const decisionCardStyle = computed(() => ({
  background: decisionColors.value.bg,
  borderColor: decisionColors.value.border,
}))

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function rpValue(v: RpField | undefined | null): string {
  if (v == null) return ''
  return typeof v === 'object' ? (v.value ?? '') : v
}
function rpSource(v: RpField | undefined | null): string | null {
  if (!v || typeof v !== 'object') return null
  return v.source && v.source !== 'Not disclosed' ? v.source : null
}

function rpIsBlank(v: RpField | undefined | null): boolean {
  const val = rpValue(v)
  return !val || val === 'null' || val === 'N/A' || val === 'Not disclosed'
}
function normalizeScore(score: number): number {
  return score > 10 ? Math.round(score) / 10 : score
}

// ── Dimension score groups ────────────────────────────────────
type DimGroup = {
  locationId: string
  address?: string
  numericFields: Array<{ label: string; score: number }>
  textFields: Array<{ label: string; value: string }>
}

const dimGroups = computed<DimGroup[]>(() => {
  if (verdict.value?.dimension_scores) {
    return [{
      locationId: '',
      address: undefined,
      numericFields: Object.entries(verdict.value.dimension_scores).map(([key, score]) => ({
        label: formatKey(key),
        score: normalizeScore(score as number),
      })),
      textFields: [],
    }]
  }
  return []
})

// ── Data loading ──────────────────────────────────────────────
async function load() {
  isLoading.value = true
  loadError.value = null
  try {
    submission.value = await $fetch<SubmissionResponse>(`/api/submissions/${id}`)
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Failed to load'
  } finally {
    isLoading.value = false
  }
}
async function runEvaluation() {
  isEvaluating.value = true
  evalError.value = null
  try {
    await $fetch(`/api/submissions/${id}/evaluate`, { method: 'POST' })
    await load()
  } catch (e: any) {
    evalError.value = e?.data?.message || e?.message || 'Evaluation failed'
  } finally {
    isEvaluating.value = false
  }
}
async function downloadPdf() {
  isDownloading.value = true
  try {
    const blob = await $fetch<Blob>(`/api/submissions/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'submission_review.pdf'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    console.error('PDF download failed:', e?.message)
  } finally {
    isDownloading.value = false
  }
}
onMounted(load)

// ── Chat ──────────────────────────────────────────────────────
type ChatMessage = { role: 'user' | 'assistant'; content: string }

const chatOpen = ref(false)
const messages = ref<ChatMessage[]>([])
const chatInput = ref('')
const isThinking = ref(false)
const chatError = ref<string | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const chatInputEl = ref<HTMLTextAreaElement | null>(null)

watch(chatOpen, async (open) => {
  if (open && messages.value.length === 0) await loadChatHistory()
  if (open) nextTick(() => scrollToBottom())
})

async function loadChatHistory() {
  const label = namedInsured.value || 'this submission'
  try {
    const { messages: history } = await $fetch<{ messages: ChatMessage[] }>(
      `/api/chat/history?submissionId=${id}`
    )
    if (history.length > 0) {
      messages.value = history
    } else {
      messages.value = [{ role: 'assistant', content: `Ask me anything about ${label} — I can search the web for business info, loss history, news, and more.` }]
    }
  } catch {
    messages.value = [{ role: 'assistant', content: `Ask me anything about ${namedInsured.value || 'this submission'} — I can search the web for business info, loss history, news, and more.` }]
  }
}

function scrollToBottom() {
  const el = messagesContainer.value
  if (el) el.scrollTop = el.scrollHeight
}
function autoGrowTextarea() {
  const el = chatInputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 72) + 'px'
}
async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || isThinking.value) return
  chatError.value = null
  chatInput.value = ''
  if (chatInputEl.value) chatInputEl.value.style.height = 'auto'
  messages.value.push({ role: 'user', content: text })
  await nextTick()
  scrollToBottom()
  isThinking.value = true
  try {
    const { reply } = await $fetch<{ reply: string }>('/api/chat/message', {
      method: 'POST',
      body: { message: text, submissionId: id, history: messages.value.slice(0, -1) },
    })
    messages.value.push({ role: 'assistant', content: reply })
  } catch (e: any) {
    chatError.value = e?.data?.statusMessage || e?.data?.message || e?.message || 'Something went wrong.'
  } finally {
    isThinking.value = false
    await nextTick()
    scrollToBottom()
  }
}
</script>

<style scoped>
.glass-card {
  @apply bg-white border border-gray-200 rounded-2xl;
}
.th-cell {
  @apply px-5 sm:px-6 py-2.5 text-left text-[11px] font-black text-gray-800 uppercase tracking-[0.1em];
}
.td-cell {
  @apply px-5 sm:px-6 py-3.5 text-[15px] text-gray-900;
}
.chat-assistant-msg :deep(p) { line-height: 1.6; margin-bottom: 8px; }
.chat-assistant-msg :deep(p:last-child) { margin-bottom: 0; }
.chat-assistant-msg :deep(ul),
.chat-assistant-msg :deep(ol) { padding-left: 1.25em; margin-bottom: 8px; }
.chat-assistant-msg :deep(li) { margin-bottom: 4px; line-height: 1.6; }
.chat-assistant-msg :deep(li:last-child) { margin-bottom: 0; }
.chat-assistant-msg :deep(strong) { display: inline-block; margin-top: 12px; color: #374151; }
.chat-assistant-msg :deep(strong:first-child) { margin-top: 0; }
</style>
