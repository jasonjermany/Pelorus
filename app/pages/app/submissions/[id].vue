<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <AppHeader variant="app">
      <div class="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-14">
        <div class="flex items-center gap-4 min-w-0">
          <NuxtLink
            to="/app"
            class="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors duration-150 flex-shrink-0"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Dashboard
          </NuxtLink>
          <span class="text-gray-300 flex-shrink-0">·</span>
          <div class="flex items-center gap-2 min-w-0">
            <img src="/PelorusLogo.png" width="22" height="22" alt="Pelorus" class="flex-shrink-0" />
            <span class="text-[14px] font-semibold text-gray-800 tracking-[-0.3px] truncate">
              {{ namedInsured || 'Submission Review' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Download PDF -->
          <button
            v-if="verdict"
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200/70 hover:border-gray-300 text-gray-600 hover:text-gray-900 text-[12px] font-medium transition-all duration-150 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
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
      <div v-if="isLoading" class="py-20 text-center text-[13px] text-gray-400">Loading…</div>
      <div v-else-if="loadError" class="py-20 text-center text-[13px] text-red-600">{{ loadError }}</div>

      <template v-else>

        <!-- Decision Card -->
        <div
          v-if="verdict"
          class="rounded-2xl p-6 sm:p-7 border"
          :style="decisionCardStyle"
        >
          <div class="flex items-start justify-between gap-6">
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-bold tracking-[0.12em] uppercase mb-3" :style="{ color: decisionColors.label }">Decision</p>
              <span
                class="inline-flex items-center px-3.5 py-1 rounded-full text-[12px] font-bold tracking-[0.04em] uppercase mb-4"
                :style="{ background: decisionColors.pillBg, color: decisionColors.pillText }"
              >{{ verdict.decision }}</span>
              <p class="text-[14px] leading-[1.7] mb-4 text-gray-700">{{ verdict.recommendation?.summary }}</p>
              <div class="flex items-center flex-wrap gap-2">
                <span v-if="portfolioTiv" class="text-[12px] text-gray-500">TIV: {{ portfolioTiv }}</span>
                <span v-if="verdict.analyzed_in_seconds" class="text-[11px] font-medium px-2.5 py-1 rounded-full" :style="{ background: decisionColors.metaBg, color: decisionColors.meta }">
                  Analyzed in {{ verdict.analyzed_in_seconds }}s
                </span>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end">
              <span class="leading-none tracking-[-3px]" style="font-size:68px;font-weight:300" :style="{ color: decisionColors.score }">
                {{ normalizeScore(verdict.composite_score).toFixed(1) }}
              </span>
              <span class="text-[12px] font-medium -mt-1" :style="{ color: decisionColors.scoreLabel }">out of 10</span>
            </div>
          </div>
        </div>

        <!-- Dimension Scores -->
        <div v-if="dimGroups.length" class="glass-card p-5 sm:p-6">
          <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-5">Dimension Scores</p>
          <div v-for="(group, gi) in dimGroups" :key="group.locationId || gi">
            <!-- Location header — only when grouped by location -->
            <div
              v-if="dimGroups.length > 1"
              class="flex items-center gap-2 mb-3"
              :class="gi > 0 ? 'mt-5 pt-5 border-t border-gray-100' : ''"
            >
              <span class="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded tracking-[0.04em]">{{ group.locationId }}</span>
              <span v-if="group.address" class="text-[11px] text-gray-400 truncate">{{ group.address }}</span>
            </div>
            <div class="flex flex-col divide-y divide-gray-100">
              <!-- Numeric fields → bar chart -->
              <div v-for="f in group.numericFields" :key="f.label" class="flex items-center gap-4 py-3.5">
                <span class="text-[12px] text-gray-500 w-36 flex-shrink-0">{{ f.label }}</span>
                <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-1.5 rounded-full transition-all duration-700"
                    :class="f.score >= 7.5 ? 'bg-green-500' : f.score >= 5.0 ? 'bg-accent-500' : 'bg-red-500'"
                    :style="{ width: `${f.score * 10}%` }"
                  />
                </div>
                <span class="text-[13px] font-semibold text-gray-700 w-8 text-right flex-shrink-0">{{ f.score.toFixed(1) }}</span>
              </div>
              <!-- Text fields → label / value pairs -->
              <div v-for="f in group.textFields" :key="f.label" class="flex items-center gap-4 py-3.5">
                <span class="text-[12px] text-gray-500 w-36 flex-shrink-0">{{ f.label }}</span>
                <span class="text-[13px] text-gray-700 flex-1">{{ f.value }}</span>
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
              class="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 cursor-pointer"
              :class="activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- ── Summary tab ──────────────────────────────────── -->
          <div v-if="activeTab === 'Summary'" class="flex flex-col gap-4">

            <!-- Recommended Next Action -->
            <div class="glass-card p-5 sm:p-6">
              <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 mb-3">Recommended Next Action</p>
              <ol class="flex flex-col gap-2.5 list-none">
                <li v-for="(item, i) in verdict.recommendation?.action_items" :key="i" class="flex gap-3 text-[13px] text-gray-700 leading-relaxed">
                  <span class="text-[#92700A] font-bold flex-shrink-0 w-4">{{ i + 1 }}.</span>{{ item }}
                </li>
              </ol>
            </div>

            <!-- Concerns & Flags -->
            <div v-if="sortedFlags.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Concerns &amp; Flags</p>
                <span class="text-[12px] text-gray-400">{{ sortedFlags.length }} item{{ sortedFlags.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="flex flex-col divide-y divide-gray-100 overflow-y-auto" style="max-height:min(50vh,480px)">
                <div v-for="(flag, i) in sortedFlags" :key="i" class="px-5 sm:px-6 py-5 flex gap-4"
                  :class="flag.type === 'CONDITION' ? 'bg-red-50/40' : 'bg-amber-50/30'">
                  <div class="w-[3px] rounded-full flex-shrink-0 mt-0.5" :class="flag.type === 'CONDITION' ? 'bg-red-500' : 'bg-amber-500'" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start gap-2 mb-1.5">
                      <p class="text-[13px] font-semibold text-gray-800 flex-1 min-w-0">{{ flag.title }}</p>
                      <span
                        class="text-[9px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                        :class="flag.type === 'CONDITION' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'"
                      >{{ flag.type }}</span>
                    </div>
                    <p class="text-[13px] text-gray-600 leading-relaxed mb-2.5">{{ flag.explanation }}</p>
                    <p class="text-[12px] text-gray-500 mb-1.5"><span class="font-semibold text-gray-700">Action:</span> {{ flag.action_required }}</p>
                    <p class="text-[11px] text-gray-400"><span class="font-semibold text-gray-500">Ref:</span> {{ flag.cited_section }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Favorable Factors -->
            <div v-if="verdict.favorable_factors?.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Favorable Factors</p>
              </div>
              <ul class="flex flex-col divide-y divide-gray-100 list-none">
                <li v-for="(f, i) in verdict.favorable_factors" :key="i" class="flex items-start gap-3 px-5 sm:px-6 py-4 text-[13px] text-gray-600 leading-relaxed">
                  <svg class="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ f }}
                </li>
              </ul>
            </div>

            <!-- Portfolio Risk Summary -->
            <div v-if="verdict.portfolio" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Risk Summary</p>
              </div>
              <div class="divide-y divide-gray-100">
                <div v-for="(raw, key) in portfolioSummaryFields" :key="key" class="flex gap-4 px-5 sm:px-6 py-3.5 hover:bg-gray-50 transition-colors duration-150">
                  <span class="text-[10px] font-semibold uppercase tracking-[0.07em] text-gray-400 w-40 flex-shrink-0 pt-0.5">{{ formatKey(key) }}</span>
                  <div class="flex-1 min-w-0">
                    <span v-if="!rpIsBlank(raw)" class="text-[13px] text-gray-600">{{ rpValue(raw) }}</span>
                    <span v-else class="text-gray-300">—</span>
                    <p v-if="rpSource(raw)" class="text-[11px] text-gray-400 mt-0.5"><span class="font-semibold text-gray-500">Source:</span> {{ rpSource(raw) }}</p>
                    <p v-if="rpContext(raw)" class="text-[11px] text-gray-400 italic mt-0.5 truncate" :title="rpContext(raw) ?? undefined">"{{ rpContext(raw) }}"</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Legacy risk_profile fallback -->
            <div v-else-if="verdict.risk_profile" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Risk Summary</p>
              </div>
              <div class="divide-y divide-gray-100">
                <div v-for="(raw, key) in verdict.risk_profile" :key="key" class="flex gap-4 px-5 sm:px-6 py-3.5 hover:bg-gray-50 transition-colors duration-150">
                  <span class="text-[10px] font-semibold uppercase tracking-[0.07em] text-gray-400 w-40 flex-shrink-0 pt-0.5">{{ formatKey(key) }}</span>
                  <div class="flex-1 min-w-0">
                    <span v-if="!rpIsBlank(raw)" class="text-[13px] text-gray-600">{{ rpValue(raw) }}</span>
                    <span v-else class="text-gray-300">—</span>
                    <p v-if="rpSource(raw)" class="text-[11px] text-gray-400 mt-0.5"><span class="font-semibold text-gray-500">Source:</span> {{ rpSource(raw) }}</p>
                    <p v-if="rpContext(raw)" class="text-[11px] text-gray-400 italic mt-0.5 truncate" :title="rpContext(raw) ?? undefined">"{{ rpContext(raw) }}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Guidelines tab ───────────────────────────────── -->
          <div v-else-if="activeTab === 'Guidelines'">
            <div class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Guideline Checks</p>
                <span class="text-[12px] text-gray-400">
                  <span v-if="verdict.guideline_checks?.length">{{ verdict.guideline_checks.length }} check{{ verdict.guideline_checks.length !== 1 ? 's' : '' }} require attention</span>
                  <span v-else class="text-green-700 font-medium">All checks passed</span>
                </span>
              </div>
              <div class="overflow-x-auto overflow-y-auto" style="max-height:min(62vh,600px)">
                <table class="w-full text-left text-[13px]">
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
                        <p class="font-medium text-gray-800">{{ check.rule }}</p>
                        <p class="text-[11px] text-gray-400 mt-1"><span class="font-semibold text-gray-500">Ref:</span> {{ check.cited_section }}</p>
                      </td>
                      <td class="td-cell text-gray-600 leading-relaxed align-top">{{ check.required }}</td>
                      <td class="td-cell align-top">
                        <p class="text-gray-600 leading-relaxed">{{ check.submitted }}</p>
                        <p v-if="check.submission_source && check.submission_source !== 'Not disclosed'" class="text-[11px] text-gray-400 mt-1"><span class="font-semibold text-gray-500">Source:</span> {{ check.submission_source }}</p>
                      </td>
                      <td class="td-cell align-top">
                        <span
                          class="text-[10px] font-bold tracking-[0.05em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
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
                <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Underwriting Insights</p>
              </div>
              <div class="divide-y divide-gray-100 overflow-y-auto" style="max-height:min(55vh,520px)">
                <div v-for="(value, key) in verdict.insights" :key="key" class="px-5 sm:px-6 py-5">
                  <p class="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-2">{{ formatKey(key) }}</p>
                  <p class="text-[13px] text-gray-600 leading-relaxed">{{ value }}</p>
                </div>
              </div>
            </div>
            <div v-if="verdict.missing_info?.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Missing Information</p>
              </div>
              <div class="flex flex-col divide-y divide-gray-100">
                <div v-for="(item, i) in verdict.missing_info" :key="i" class="px-5 sm:px-6 py-4">
                  <div class="flex items-center gap-2 mb-1.5">
                    <p class="text-[13px] font-semibold text-gray-800">{{ item.label }}</p>
                    <span
                      v-if="item.priority"
                      class="text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                      :class="item.priority === 'BINDING' ? 'bg-red-50 text-red-700 border border-red-200' : item.priority === 'PRE_BIND' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-600'"
                    >{{ item.priority }}</span>
                  </div>
                  <p class="text-[13px] text-gray-600 leading-relaxed">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Risk Profile tab ─────────────────────────────── -->
          <div v-else-if="activeTab === 'Risk Profile'">

            <!-- v5: lines → locations → sections → fields -->
            <template v-if="v5RiskLocations.length">
              <div class="flex flex-col gap-2.5 overflow-y-auto" style="max-height:min(60vh,580px)">
                <div
                  v-for="loc in v5RiskLocations"
                  :key="loc.id"
                  :ref="(el) => { if (el) locationCardEls[loc.id] = el as HTMLElement }"
                  class="glass-card overflow-hidden"
                >
                  <!-- Card header -->
                  <button
                    class="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    @click="toggleLocation(loc.id)"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded flex-shrink-0 tracking-[0.04em]">{{ loc.id }}</span>
                      <span v-if="loc.address" class="text-[13px] text-gray-800 font-medium truncate">{{ loc.address }}</span>
                    </div>
                    <svg
                      class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0"
                      :class="expandedLocations.has(loc.id) ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    ><polyline points="6 9 12 15 18 9"/></svg>
                  </button>

                  <!-- Expanded: sections → fields -->
                  <div v-if="expandedLocations.has(loc.id)" class="border-t border-gray-100 divide-y divide-gray-100">
                    <div v-for="section in loc.sections" :key="section.name" class="px-5 py-4">
                      <p class="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-2.5">{{ section.name }}</p>
                      <div class="flex flex-col">
                        <div
                          v-for="field in section.fields"
                          :key="field.label"
                          class="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0"
                          :class="severityRowClass(field.severity)"
                        >
                          <span class="text-[11px] text-gray-500 flex-shrink-0 pt-0.5">{{ field.label }}</span>
                          <div class="flex flex-col items-end gap-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                              <span class="text-[12px] text-gray-700 text-right leading-snug">{{ field.value }}</span>
                              <span
                                v-if="field.severity"
                                class="text-[8px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                                :class="severityBadgeClass(field.severity)"
                              >{{ field.severity }}</span>
                            </div>
                            <p v-if="field.description" class="text-[11px] text-gray-400 text-right leading-relaxed max-w-[280px]">{{ field.description }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Legacy: per-location structure -->
            <template v-else-if="verdict.locations?.length">

              <!-- Portfolio Summary Bar -->
              <div class="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-4">
                <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200">
                  <div class="px-5 py-5">
                    <p class="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-1.5">Portfolio TIV</p>
                    <p class="text-[16px] font-semibold text-gray-900 tracking-[-0.3px] leading-tight">{{ verdict.portfolio?.total_tiv || '—' }}</p>
                  </div>
                  <div class="px-5 py-5">
                    <p class="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-1.5">Locations</p>
                    <p class="text-[16px] font-semibold text-gray-900 tracking-[-0.3px] leading-tight">{{ verdict.portfolio?.location_count || verdict.locations.length }}</p>
                  </div>
                  <div class="px-5 py-5">
                    <p class="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-1.5">Total SF</p>
                    <p class="text-[16px] font-semibold text-gray-900 tracking-[-0.3px] leading-tight">{{ verdict.portfolio?.total_sf || '—' }}</p>
                  </div>
                  <div class="px-5 py-5">
                    <p class="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-1.5">5yr Losses</p>
                    <p class="text-[16px] font-semibold text-gray-900 tracking-[-0.3px] leading-tight">{{ truncateLosses(rpValue(verdict.portfolio?.losses_5yr as RpField)) }}</p>
                  </div>
                </div>
                <!-- Location status strip -->
                <div class="px-5 py-3 border-t border-gray-200 flex items-center gap-2 flex-wrap">
                  <span class="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400 mr-1">Locations</span>
                  <button
                    v-for="loc in verdict.locations"
                    :key="loc.id"
                    class="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[0.03em] transition-all duration-150 hover:opacity-80 cursor-pointer"
                    :class="locStatusPillClass(loc.status)"
                    @click="scrollToLocation(loc.id)"
                  >{{ loc.id }}</button>
                </div>
              </div>

              <!-- Filter Tabs -->
              <div v-if="visibleFilterTabs.length > 1" class="flex gap-2 mb-4 flex-wrap">
                <button
                  v-for="ft in visibleFilterTabs"
                  :key="ft.value"
                  class="px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer"
                  :class="locationFilter === ft.value ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'"
                  @click="locationFilter = ft.value"
                >{{ ft.label }}</button>
              </div>

              <!-- Location Cards -->
              <div class="flex flex-col gap-2.5 overflow-y-auto" style="max-height:min(60vh,580px)">
                <div
                  v-for="loc in filteredLocations"
                  :key="loc.id"
                  :ref="(el) => { if (el) locationCardEls[loc.id] = el as HTMLElement }"
                  class="glass-card overflow-hidden"
                >
                  <!-- Card Header -->
                  <button
                    class="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    @click="toggleLocation(loc.id)"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded flex-shrink-0 tracking-[0.04em]">{{ loc.id }}</span>
                      <span class="text-[13px] text-gray-800 font-medium truncate">{{ loc.address }}</span>
                      <span class="text-[12px] text-gray-500 flex-shrink-0">{{ loc.city_state_zip }}</span>
                      <span v-if="loc.source_doc" class="text-[10px] text-gray-400 italic flex-shrink-0 hidden sm:block">{{ loc.source_doc }}</span>
                    </div>
                    <div class="flex items-center gap-2.5 flex-shrink-0 ml-4">
                      <span class="text-[13px] font-semibold text-gray-700">{{ loc.tiv }}</span>
                      <span
                        class="text-[9px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
                        :class="locStatusClass(loc.status)"
                      >{{ locStatusLabel(loc.status) }}</span>
                      <svg
                        class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0"
                        :class="expandedLocations.has(loc.id) ? 'rotate-180' : ''"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                      ><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </button>

                  <!-- Expanded Content -->
                  <div v-if="expandedLocations.has(loc.id)" class="border-t border-gray-100 px-5 py-5">
                    <div class="grid grid-cols-2 gap-x-10 gap-y-5">
                      <div class="flex flex-col gap-5">
                        <div v-for="sec in leftSections" :key="sec.key">
                          <p class="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-2">{{ sec.label }}</p>
                          <div class="flex flex-col overflow-y-auto" style="max-height:200px">
                            <div
                              v-for="(value, fkey) in (loc as any)[sec.key]"
                              :key="fkey"
                              class="flex items-baseline justify-between py-1.5 gap-4 border-b border-gray-100 last:border-0"
                            >
                              <span class="text-[11px] text-gray-500 flex-shrink-0">{{ fieldLabel(String(fkey)) }}</span>
                              <span
                                class="text-[12px] text-right font-normal leading-snug"
                                :class="isFlaggedValue(String(fkey), value) ? 'text-amber-700 font-medium' : isBlankField(value) ? 'text-gray-300' : 'text-gray-600'"
                              >{{ isBlankField(value) ? '—' : value }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="flex flex-col gap-5">
                        <div v-for="sec in rightSections" :key="sec.key">
                          <p class="text-[9px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-2">{{ sec.label }}</p>
                          <div class="flex flex-col overflow-y-auto" style="max-height:200px">
                            <div
                              v-for="(value, fkey) in (loc as any)[sec.key]"
                              :key="fkey"
                              class="flex items-baseline justify-between py-1.5 gap-4 border-b border-gray-100 last:border-0"
                            >
                              <span class="text-[11px] text-gray-500 flex-shrink-0">{{ fieldLabel(String(fkey)) }}</span>
                              <span
                                class="text-[12px] text-right font-normal leading-snug"
                                :class="isFlaggedValue(String(fkey), value) ? 'text-amber-700 font-medium' : isBlankField(value) ? 'text-gray-300' : 'text-gray-600'"
                              >{{ isBlankField(value) ? '—' : value }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Legacy flat risk_profile fallback -->
            <template v-else-if="verdict.risk_profile">
              <div class="glass-card overflow-hidden">
                <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                  <p class="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400">Extracted Risk Profile</p>
                </div>
                <div class="divide-y divide-gray-100 overflow-y-auto" style="max-height:min(60vh,580px)">
                  <div v-for="(raw, key) in verdict.risk_profile" :key="key" class="flex gap-4 px-5 sm:px-6 py-3.5 hover:bg-gray-50 transition-colors duration-150">
                    <span class="text-[10px] font-semibold uppercase tracking-[0.07em] text-gray-400 w-44 flex-shrink-0 pt-0.5">{{ formatKey(key) }}</span>
                    <div class="flex-1 min-w-0">
                      <span v-if="!rpIsBlank(raw)" class="text-[13px] text-gray-600">{{ rpValue(raw) }}</span>
                      <span v-else class="text-gray-300">—</span>
                      <p v-if="rpSource(raw)" class="text-[11px] text-gray-400 mt-0.5"><span class="font-semibold text-gray-500">Source:</span> {{ rpSource(raw) }}</p>
                      <p v-if="rpContext(raw)" class="text-[11px] text-gray-400 italic mt-0.5 truncate" :title="rpContext(raw) ?? undefined">"{{ rpContext(raw) }}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="py-12 text-center text-[13px] text-gray-400">No risk profile data available.</div>
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
            <p class="text-[14px] font-medium text-red-600 mb-4">Evaluation failed</p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-[#050A18] px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >{{ isEvaluating ? 'Evaluating…' : 'Retry Evaluation' }}</button>
          </template>
          <template v-else>
            <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p class="text-[14px] text-gray-500 mb-4">
              {{ submission?.status === 'processing' ? 'Analysis in progress…' : 'Not yet evaluated' }}
            </p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-[#050A18] px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >{{ isEvaluating ? 'Evaluating…' : 'Run Evaluation' }}</button>
          </template>
          <p v-if="evalError" class="mt-3 text-[12px] text-red-600">{{ evalError }}</p>
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
            <span class="text-[14px] font-semibold text-gray-800 tracking-[-0.2px]">Research Assistant</span>
          </div>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
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
              class="px-3.5 py-2.5 text-[13px] leading-relaxed break-words"
              :class="
                msg.role === 'user'
                  ? 'bg-accent-500/10 border border-accent-500/20 text-gray-800 rounded-2xl rounded-tr-sm max-w-[80%] whitespace-pre-wrap'
                  : 'chat-assistant-msg bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-tl-sm max-w-[85%]'
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

        <p v-if="chatError" class="mx-4 mb-1 text-[12px] text-red-600 text-center">{{ chatError }}</p>

        <!-- Input area -->
        <div class="px-4 pb-4 pt-2 border-t border-gray-100 bg-white flex-shrink-0">
          <div class="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 focus-within:border-accent-500/50 transition-colors duration-150">
            <textarea
              ref="chatInputEl"
              v-model="chatInput"
              rows="1"
              placeholder="Ask about this submission…"
              class="flex-1 bg-transparent resize-none text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed"
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
          <p class="text-[10px] text-gray-400 text-center mt-2">Shift+Enter for new line · Enter to send</p>
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

type RpField = string | { value: string; source?: string; context?: string }

type Location = {
  id: string
  source_doc?: string
  address: string
  city_state_zip: string
  status: 'clean' | 'prior_loss_remediated' | 'conditions_required' | 'hard_stop'
  tiv: string
  cope: Record<string, string>
  valuation: Record<string, string>
  roof: Record<string, string>
  electrical: Record<string, string>
  fire_protection: Record<string, string>
  cat_flood: Record<string, string>
}

type Portfolio = {
  named_insured: RpField
  broker: RpField
  prior_carrier: RpField
  total_tiv: RpField
  location_count: RpField
  total_sf: RpField
  losses_5yr: RpField
}

// ── v5 data model ────────────────────────────────────────────
type V5Field = {
  label: string
  value: string
  severity?: 'high' | 'medium' | 'low' | null
  description?: string
}
type V5Section = { name: string; fields: V5Field[] }
type V5Location = { id: string; address?: string; city_state_zip?: string; sections: V5Section[] }
type V5Line = { name?: string; locations: V5Location[] }

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
  portfolio?: Portfolio
  locations?: Location[]
  risk_profile?: Record<string, { value: string; source?: string } | string>
  analyzed_in_seconds?: string
  // v5
  lines?: V5Line[]
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
  const p = verdict.value?.portfolio?.named_insured
  const pv = rpValue(p as RpField)
  if (pv && pv !== 'Not disclosed') return pv
  const raw = verdict.value?.risk_profile?.named_insured
  if (raw === undefined) return null
  return rpValue(raw) || null
})

const portfolioTiv = computed(() => {
  const t = rpValue(verdict.value?.portfolio?.total_tiv as RpField)
  if (t && t !== 'Not disclosed' && !t.startsWith('NOT CONFIRMED')) return t
  const raw = verdict.value?.risk_profile?.tiv
  if (!raw) return null
  const v = rpValue(raw)
  return v && v !== 'Not disclosed' ? v : null
})

const portfolioSummaryFields = computed(() => {
  const p = verdict.value?.portfolio
  if (!p) return {} as Record<string, RpField>
  return {
    named_insured: p.named_insured,
    broker: p.broker,
    total_tiv: p.total_tiv,
    location_count: p.location_count,
    total_sf: p.total_sf,
    losses_5yr: p.losses_5yr,
  }
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
function rpContext(v: RpField | undefined | null): string | null {
  if (!v || typeof v !== 'object') return null
  return v.context && v.context !== 'Not disclosed' ? v.context : null
}
function rpIsBlank(v: RpField | undefined | null): boolean {
  const val = rpValue(v)
  return !val || val === 'null' || val === 'N/A' || val === 'Not disclosed'
}
function normalizeScore(score: number): number {
  return score > 10 ? Math.round(score) / 10 : score
}

// ── Risk Profile helpers ──────────────────────────────────────
const leftSections = [
  { key: 'cope', label: 'COPE' },
  { key: 'roof', label: 'Roof' },
  { key: 'fire_protection', label: 'Fire Protection' },
]
const rightSections = [
  { key: 'valuation', label: 'Valuation' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'cat_flood', label: 'Cat / Flood' },
]

const FIELD_LABELS: Record<string, string> = {
  construction: 'Construction', year_built: 'Year Built', sq_footage: 'Sq. Footage',
  occupancy: 'Occupancy', tenants: 'Tenants', protection_class: 'Prot. Class',
  type: 'Type', age: 'Age', condition: 'Condition', last_inspected: 'Last Inspected',
  sprinklers: 'Sprinklers', nfpa_25: 'NFPA 25', fire_alarm: 'Fire Alarm',
  building_rc: 'Building RC', bpp: 'BPP', bi_ee: 'BI / EE', ord_law: 'Ord & Law',
  equip_brkdwn: 'Equip Breakdown', deductible: 'Deductible', total_tiv: 'Location TIV',
  panel_type: 'Panel Type', panel_age: 'Panel Age', wiring: 'Wiring',
  permit_status: 'Permit Status', flood_zone: 'Flood Zone', named_storm: 'Named Storm',
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? formatKey(key)
}
function isBlankField(v: string | undefined): boolean {
  if (!v) return true
  return v === 'Not disclosed' || v === 'null' || v === 'N/A'
}
function isFlaggedValue(fieldKey: string, value: string): boolean {
  if (!value || isBlankField(value)) return false
  if (fieldKey === 'year_built') {
    const m = value.match(/\b(1[5-9]\d{2}|20[01]\d)\b/)
    if (m) return parseInt(m[0]) < 2000
  }
  if (fieldKey === 'tenants') {
    const m = value.match(/\b(\d+)\b/)
    if (m) return parseInt(m[1]) > 3
  }
  return false
}

// ── v5 Panel 1: dimension score groups ───────────────────────
type DimGroup = {
  locationId: string
  address?: string
  numericFields: Array<{ label: string; score: number }>
  textFields: Array<{ label: string; value: string }>
}

const dimGroups = computed<DimGroup[]>(() => {
  // v5 path: pull numeric 0–10 fields per location
  if (verdict.value?.lines?.length) {
    const groups: DimGroup[] = []
    for (const line of verdict.value.lines) {
      for (const loc of line.locations ?? []) {
        const numericFields: DimGroup['numericFields'] = []
        const textFields: DimGroup['textFields'] = []
        for (const section of loc.sections ?? []) {
          for (const field of section.fields ?? []) {
            const trimmed = (field.value ?? '').trim()
            const n = parseFloat(trimmed)
            if (!isNaN(n) && n >= 0 && n <= 10 && /^\d+(\.\d+)?$/.test(trimmed)) {
              numericFields.push({ label: field.label, score: n })
            } else if (trimmed && trimmed !== 'Not disclosed') {
              textFields.push({ label: field.label, value: trimmed })
            }
          }
        }
        if (numericFields.length || textFields.length) {
          groups.push({ locationId: loc.id, address: loc.address, numericFields, textFields })
        }
      }
    }
    return groups
  }
  // Legacy path: flat dimension_scores object
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

// ── v5 Panel 2: risk profile locations ───────────────────────
type V5RenderLocation = { id: string; address?: string; sections: Array<{ name: string; fields: V5Field[] }> }

const v5RiskLocations = computed<V5RenderLocation[]>(() => {
  if (!verdict.value?.lines?.length) return []
  const locs: V5RenderLocation[] = []
  for (const line of verdict.value.lines) {
    for (const loc of line.locations ?? []) {
      const sections = (loc.sections ?? [])
        .map(sec => ({ name: sec.name, fields: (sec.fields ?? []).filter(f => f.label && f.value != null) }))
        .filter(sec => sec.fields.length > 0)
      if (sections.length) locs.push({ id: loc.id, address: loc.address, sections })
    }
  }
  return locs
})

function severityBadgeClass(severity?: string | null): string {
  if (severity === 'high') return 'bg-red-50 text-red-700 border border-red-200'
  if (severity === 'medium') return 'bg-amber-50 text-amber-800 border border-amber-200'
  if (severity === 'low') return 'bg-green-50 text-green-700 border border-green-200'
  return 'bg-gray-100 text-gray-500'
}
function severityRowClass(severity?: string | null): string {
  if (severity === 'high') return 'bg-red-50/30'
  if (severity === 'medium') return 'bg-amber-50/20'
  return ''
}

function locStatusClass(status: string): string {
  switch (status) {
    case 'hard_stop': return 'bg-red-50 text-red-700 border border-red-200'
    case 'conditions_required': return 'bg-amber-50 text-amber-800 border border-amber-200'
    case 'prior_loss_remediated': return 'bg-blue-50 text-blue-700 border border-blue-200'
    default: return 'bg-green-50 text-green-700 border border-green-200'
  }
}
function locStatusLabel(status: string): string {
  switch (status) {
    case 'hard_stop': return 'Hard Stop'
    case 'conditions_required': return 'Conditions Required'
    case 'prior_loss_remediated': return 'Prior Loss — Remediated'
    default: return 'Clean'
  }
}
function truncateLosses(v: string | undefined): string {
  if (!v || v === 'Not disclosed') return '—'
  return v.replace(/\s*\(.*\)$/, '').trim()
}
function locStatusPillClass(status: string): string {
  switch (status) {
    case 'hard_stop': return 'bg-red-600 text-white'
    case 'conditions_required': return 'bg-orange-500 text-white'
    case 'prior_loss_remediated': return 'bg-amber-400 text-black'
    default: return 'bg-green-500 text-white'
  }
}

const expandedLocations = ref<Set<string>>(new Set())
const locationCardEls: Record<string, HTMLElement> = {}

watch(
  () => verdict.value?.locations,
  (locs) => {
    if (!locs?.length) return
    expandedLocations.value = locs.length <= 2 ? new Set(locs.map((l) => l.id)) : new Set()
  },
  { immediate: true },
)
watch(
  v5RiskLocations,
  (locs) => {
    if (!locs.length) return
    expandedLocations.value = locs.length <= 2 ? new Set(locs.map((l) => l.id)) : new Set()
  },
  { immediate: true },
)

function toggleLocation(locId: string) {
  const s = new Set(expandedLocations.value)
  if (s.has(locId)) s.delete(locId)
  else s.add(locId)
  expandedLocations.value = s
}
function scrollToLocation(locId: string) {
  if (!expandedLocations.value.has(locId)) toggleLocation(locId)
  nextTick(() => {
    const el = locationCardEls[locId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

type StatusFilter = 'ALL' | 'clean' | 'prior_loss_remediated' | 'conditions_required' | 'hard_stop'
const locationFilter = ref<StatusFilter>('ALL')

const ALL_FILTER_TABS = [
  { label: 'All', value: 'ALL' as StatusFilter },
  { label: 'Clean', value: 'clean' as StatusFilter },
  { label: 'Prior Loss — Remediated', value: 'prior_loss_remediated' as StatusFilter },
  { label: 'Conditions Required', value: 'conditions_required' as StatusFilter },
  { label: 'Hard Stop', value: 'hard_stop' as StatusFilter },
]

const visibleFilterTabs = computed(() => {
  const statuses = new Set(verdict.value?.locations?.map((l) => l.status) ?? [])
  return ALL_FILTER_TABS.filter((t) => t.value === 'ALL' || statuses.has(t.value))
})

const filteredLocations = computed(() => {
  const locs = verdict.value?.locations ?? []
  if (locationFilter.value === 'ALL') return locs
  return locs.filter((l) => l.status === locationFilter.value)
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
  @apply px-5 sm:px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.07em];
}
.td-cell {
  @apply px-5 sm:px-6 py-4 text-[13px];
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
