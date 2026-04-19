<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 flex flex-col">

    <!-- ── Top Nav ─────────────────────────────────────────────── -->
    <nav class="sticky top-0 z-50 h-14 flex items-center border-b border-gray-200 bg-white shadow-sm">
      <div class="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <!-- Left: logo + nav -->
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2.5 flex-shrink-0">
            <img src="/PelorusLogo.png" width="26" height="26" alt="Pelorus" />
            <span class="text-[15px] font-semibold text-gray-900 tracking-[-0.3px]">Pelorus</span>
          </div>
          <div class="hidden md:flex items-center gap-0.5">
            <span class="nav-link nav-link--active">Dashboard</span>
            <NuxtLink to="/app/settings" class="nav-link">Guidelines</NuxtLink>
          </div>
        </div>

        <!-- Right: bell + new sub + avatar -->
        <div class="flex items-center gap-2">
          <!-- Bell -->
          <button
            aria-label="Notifications"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <!-- New Submission -->
          <button
            class="hidden sm:flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-[#050A18] text-[12px] font-bold px-3.5 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            :disabled="isIngesting"
            @click="showIngest = true"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Submission
          </button>

          <!-- Mobile new -->
          <button
            aria-label="New submission"
            class="sm:hidden w-8 h-8 rounded-lg bg-accent-500 hover:bg-accent-400 flex items-center justify-center text-[#050A18] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            @click="showIngest = true"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <!-- Avatar + dropdown -->
          <div class="relative" ref="avatarMenuRef">
            <button
              class="w-8 h-8 rounded-full bg-accent-500/15 border border-accent-500/25 flex items-center justify-center text-[#92700A] text-[11px] font-bold hover:bg-accent-500/25 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
              :title="user?.email"
              @click="showAvatarMenu = !showAvatarMenu"
            >
              {{ userInitials }}
            </button>

            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="showAvatarMenu"
                class="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden z-[100] origin-top-right"
              >
                <!-- Email header -->
                <div class="px-3.5 py-2.5 border-b border-gray-100">
                  <p class="text-[11px] text-gray-500 truncate">{{ user?.email }}</p>
                </div>
                <!-- Menu items -->
                <div class="py-1">
                  <NuxtLink
                    to="/app/settings"
                    class="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors duration-100 cursor-pointer"
                    @click="showAvatarMenu = false"
                  >
                    <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Settings
                  </NuxtLink>
                </div>
                <!-- Divider + sign out -->
                <div class="border-t border-gray-100 py-1">
                  <button
                    class="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors duration-100 cursor-pointer"
                    @click="logout"
                  >
                    <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </nav>

    <!-- ── Main ────────────────────────────────────────────────── -->
    <main class="flex-1 overflow-y-auto">
      <div class="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <!-- Page heading -->
        <div class="flex items-start justify-between mb-6 sm:mb-8">
          <div>
            <h1 class="text-[20px] sm:text-[22px] font-semibold text-gray-900 tracking-[-0.4px]">
              Submission Queue
            </h1>
            <p class="text-[13px] text-gray-500 mt-0.5">AI-powered underwriting triage</p>
          </div>
          <div v-if="errorMessage" class="text-[12px] text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
            {{ errorMessage }}
          </div>
        </div>

        <!-- ── Metric Cards ─────────────────────────────────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div
            v-for="metric in metrics"
            :key="metric.label"
            class="glass-card p-4 sm:p-5 hover:shadow-md transition-all duration-200 cursor-default"
          >
            <div class="flex items-start justify-between mb-3 sm:mb-4">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="metric.iconBg">
                <svg class="w-4 h-4" :class="metric.iconColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="metric.iconPath" />
                </svg>
              </div>
              <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.07em] hidden sm:block">{{ metric.label }}</span>
            </div>
            <p class="text-[28px] sm:text-[32px] font-bold tracking-[-1.5px] leading-none" :class="metric.valueColor">
              {{ metric.value }}
            </p>
            <div class="flex items-center justify-between mt-2">
              <p class="text-[11px] text-gray-500 leading-tight">{{ metric.sub }}</p>
              <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.07em] sm:hidden">{{ metric.label }}</span>
            </div>
          </div>
        </div>

        <!-- ── Content Grid ─────────────────────────────────────── -->
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_296px] gap-5 sm:gap-6">

          <!-- ── Submission Table ────────────────────────────────── -->
          <div class="glass-card overflow-hidden">

            <!-- Table toolbar -->
            <div class="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <!-- Admin back button -->
                <button
                  v-if="isAdmin && selectedUser"
                  class="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                  @click="clearUser"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  Back
                </button>

                <span class="text-[13px] text-gray-500">
                  <span v-if="isAdmin && selectedUser" class="text-gray-800 font-medium">{{ selectedUser.email }}</span>
                  <span v-else-if="isAdmin && !selectedUser">Select an underwriter</span>
                  <span v-else>{{ submissions.length }} submission{{ submissions.length !== 1 ? 's' : '' }}</span>
                </span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Admin user selector -->
                <div v-if="isAdmin && !selectedUser && orgUsers.length" class="hidden sm:flex items-center gap-1.5">
                  <button
                    class="table-btn"
                    @click="selectUser({ id: '__all__', email: 'All Submissions', role: 'admin' })"
                  >
                    All Users
                  </button>
                  <button
                    v-for="u in orgUsers.slice(0, 3)"
                    :key="u.id"
                    class="table-btn"
                    @click="selectUser(u)"
                  >
                    {{ u.email.split('@')[0] }}
                  </button>
                </div>

                <button
                  class="table-btn flex items-center gap-1.5"
                  :disabled="isLoading"
                  @click="load"
                >
                  <svg
                    class="w-3.5 h-3.5 transition-transform duration-300"
                    :class="{ 'animate-spin': isLoading }"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  >
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span class="hidden sm:inline">{{ isLoading ? 'Refreshing…' : 'Refresh' }}</span>
                </button>
              </div>
            </div>

            <!-- Admin underwriter list (before drill-down) -->
            <div v-if="isAdmin && !selectedUser">
              <div v-if="isLoading && !orgUsers.length" class="px-5 py-12 text-center text-[13px] text-gray-400">
                Loading…
              </div>
              <div v-else-if="!orgUsers.length" class="px-5 py-12 text-center text-[13px] text-gray-400">
                No underwriters found.
              </div>
              <div v-else class="divide-y divide-gray-50">
                <button
                  class="w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150 text-left cursor-pointer"
                  @click="selectUser({ id: '__all__', email: 'All Submissions', role: 'admin' })"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full bg-accent-500/15 flex items-center justify-center text-[#92700A] text-[11px] font-bold flex-shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p class="text-[13px] font-semibold text-gray-800">All Submissions</p>
                  </div>
                  <svg class="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  v-for="u in orgUsers"
                  :key="u.id"
                  class="w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150 text-left cursor-pointer"
                  @click="selectUser(u)"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[11px] font-bold flex-shrink-0">
                      {{ u.email.slice(0, 2).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-[13px] font-medium text-gray-700 truncate">{{ u.email }}</p>
                      <p class="text-[11px] text-gray-400 capitalize">{{ u.role }}</p>
                    </div>
                  </div>
                  <svg class="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Submissions table -->
            <div v-else>
              <div v-if="isLoading && !submissions.length" class="px-5 py-12 text-center text-[13px] text-gray-400">
                Loading…
              </div>
              <div v-else-if="!submissions.length" class="px-5 py-16 flex flex-col items-center gap-3 text-center">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p class="text-[13px] text-gray-500 font-medium">No submissions yet</p>
                  <p class="text-[12px] text-gray-400 mt-0.5">Click <strong class="text-[#92700A]">+ New Submission</strong> to get started</p>
                </div>
              </div>

              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-100">
                      <th class="th-cell pl-5">Company</th>
                      <th class="th-cell hidden sm:table-cell">Coverage</th>
                      <th class="th-cell hidden lg:table-cell">Carrier</th>
                      <th class="th-cell">Score</th>
                      <th class="th-cell">Decision</th>
                      <th class="th-cell hidden md:table-cell">Date</th>
                      <th class="th-cell w-8 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr
                      v-for="sub in submissions"
                      :key="sub.id"
                      class="group transition-colors duration-150"
                      :class="
                        sub.status === 'processing' || sub.status === 'pending'
                          ? 'opacity-50 cursor-default'
                          : 'hover:bg-gray-50 cursor-pointer'
                      "
                      @click="sub.status !== 'processing' && sub.status !== 'pending' && go(sub.id)"
                    >
                      <!-- Company -->
                      <td class="td-cell pl-5">
                        <div class="flex items-center gap-2.5">
                          <div class="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold flex-shrink-0">
                            {{ (sub.named_insured || sub.broker_email || '?').slice(0, 2).toUpperCase() }}
                          </div>
                          <div class="min-w-0">
                            <p class="text-[13px] font-medium text-gray-800 truncate max-w-[180px]">
                              {{ sub.named_insured || sub.broker_email || 'Unnamed' }}
                            </p>
                            <p v-if="sub.broker" class="text-[11px] text-gray-400 truncate max-w-[180px]">{{ sub.broker }}</p>
                          </div>
                        </div>
                      </td>

                      <!-- Coverage type -->
                      <td class="td-cell hidden sm:table-cell">
                        <span class="inline-flex items-center text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {{ coverageLabel(sub.source) }}
                        </span>
                      </td>

                      <!-- Carrier -->
                      <td class="td-cell hidden lg:table-cell">
                        <span class="text-[12px] text-gray-400">{{ sub.prior_carrier || '—' }}</span>
                      </td>

                      <!-- Score -->
                      <td class="td-cell">
                        <span v-if="sub.composite_score != null" class="text-[13px] font-bold" :class="scoreColor(sub.composite_score)">
                          {{ normalizeScore(sub.composite_score).toFixed(1) }}<span class="text-[10px] font-normal text-gray-400">/10</span>
                        </span>
                        <span v-else class="text-[13px] text-gray-300">
                          <svg v-if="sub.status === 'processing' || sub.status === 'pending'" class="w-3.5 h-3.5 animate-spin text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span v-else>—</span>
                        </span>
                      </td>

                      <!-- Decision -->
                      <td class="td-cell">
                        <span v-if="sub.decision" class="decision-pill" :class="decisionClass(sub.decision)">
                          {{ sub.decision }}
                        </span>
                        <span v-else-if="sub.status === 'processing' || sub.status === 'pending'" class="decision-pill bg-amber-50 text-amber-800 border border-amber-200">
                          Analyzing
                        </span>
                        <span v-else-if="sub.status === 'error'" class="decision-pill bg-red-50 text-red-700 border border-red-200">
                          Error
                        </span>
                        <span v-else class="text-[12px] text-gray-300">—</span>
                      </td>

                      <!-- Date -->
                      <td class="td-cell hidden md:table-cell">
                        <span class="text-[12px] text-gray-400">{{ formatDate(sub.created_at) }}</span>
                      </td>

                      <!-- Arrow -->
                      <td class="td-cell pr-4 w-8">
                        <svg
                          v-if="sub.status !== 'processing' && sub.status !== 'pending'"
                          class="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors duration-150"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                        >
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── Right Sidebar ─────────────────────────────────── -->
          <div class="flex flex-col gap-4">

            <!-- Stat cards -->
            <div class="grid grid-cols-2 gap-3">
              <div class="glass-card p-4 text-center hover:shadow-md transition-all duration-200 cursor-default">
                <p class="text-[26px] font-bold tracking-[-1px] text-green-700">{{ approvalRate }}<span class="text-[14px] text-green-600/60">%</span></p>
                <p class="text-[11px] text-gray-500 mt-1 font-medium">Approval Rate</p>
              </div>
              <div class="glass-card p-4 text-center hover:shadow-md transition-all duration-200 cursor-default">
                <p class="text-[26px] font-bold tracking-[-1px] text-amber-700">{{ referRate }}<span class="text-[14px] text-amber-600/60">%</span></p>
                <p class="text-[11px] text-gray-500 mt-1 font-medium">Refer Rate</p>
              </div>
            </div>

            <!-- Activity feed -->
            <div class="glass-card flex flex-col min-h-0">
              <div class="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
                <p class="text-[13px] font-semibold text-gray-800">Recent Activity</p>
                <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Live</span>
              </div>

              <div class="p-3 space-y-0.5 overflow-y-auto max-h-[420px] xl:max-h-[520px]">
                <div v-if="!activityFeed.length" class="py-8 text-center text-[12px] text-gray-400">
                  No activity yet
                </div>
                <div
                  v-for="event in activityFeed"
                  :key="event.id"
                  class="flex gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-150 cursor-default"
                >
                  <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" :class="event.dotBg">
                    <svg class="w-3.5 h-3.5" :class="event.dotColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path :d="event.iconPath" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[12px] text-gray-700 font-medium leading-tight truncate">
                      {{ event.name }}
                    </p>
                    <p class="text-[11px] text-gray-500 mt-0.5 leading-tight">{{ event.description }}</p>
                    <p class="text-[10px] text-gray-400 mt-1">{{ formatDate(event.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>

    <!-- ── Ingest Modal ─────────────────────────────────────────── -->
    <div
      v-if="showIngest"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      @click.self="closeIngest"
    >
      <div class="w-full max-w-[460px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <!-- Modal header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 class="text-[16px] font-semibold text-gray-900 tracking-[-0.3px]">New Submission</h2>
          <button
            aria-label="Close"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
            @click="closeIngest"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal body -->
        <div class="px-6 py-5 flex flex-col gap-4">
          <!-- File upload -->
          <div>
            <label class="modal-label">Upload files</label>
            <div
              class="relative border border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-accent-500/50 hover:bg-gray-100/70 transition-all duration-150 cursor-pointer"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.docx,.txt,.xlsx,.xls"
                multiple
                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                @change="onFileSelected"
              />
              <div class="flex flex-col items-center gap-2 py-7 pointer-events-none">
                <svg class="w-6 h-6" :class="ingestFiles.length ? 'text-accent-500' : 'text-gray-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <span class="text-[13px]" :class="ingestFiles.length ? 'text-accent-600 font-medium' : 'text-gray-500'">
                  {{ ingestFiles.length ? `${ingestFiles.length} file${ingestFiles.length !== 1 ? 's' : ''} selected` : 'PDF, XLSX, DOCX — click to browse' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Paste text -->
          <div v-if="!ingestFiles.length">
            <label class="modal-label">Or paste text</label>
            <textarea
              v-model="ingestText"
              rows="4"
              placeholder="Paste submission text here…"
              class="modal-input resize-none"
            />
          </div>

          <!-- Broker email -->
          <div>
            <label class="modal-label">Broker email <span class="normal-case font-normal text-gray-400 tracking-normal">(optional)</span></label>
            <input
              v-model="ingestBrokerEmail"
              type="email"
              placeholder="broker@example.com"
              class="modal-input"
            />
          </div>

          <p v-if="ingestError" class="text-[12px] text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            {{ ingestError }}
          </p>
        </div>

        <!-- Modal footer -->
        <div class="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button class="modal-btn-secondary" @click="closeIngest">Cancel</button>
          <button
            class="modal-btn-primary"
            :disabled="isIngesting || (!ingestFiles.length && !ingestText.trim())"
            @click="submitIngest"
          >
            {{ isIngesting ? 'Submitting…' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type Submission = {
  id: string
  status: string
  source: string
  broker_email: string | null
  created_at: string
  decision: string | null
  composite_score: number | null
  named_insured: string | null
  broker: string | null
  prior_carrier: string | null
  coverage_type?: string | null
  premium?: number | null
}

type OrgUser = { id: string; email: string; role: string }

type AppUser = { id: string; email: string; org_id: string; role: 'admin' | 'underwriter' }

const router = useRouter()
const { user: _sessionUser } = useUserSession()
const user = computed(() => _sessionUser.value as AppUser | undefined)
const isAdmin = computed(() => user.value?.role === 'admin')

const userInitials = computed(() => {
  const email = user.value?.email || ''
  return email.slice(0, 2).toUpperCase()
})

// ── Avatar dropdown ────────────────────────────────────────────
const showAvatarMenu = ref(false)
const avatarMenuRef = ref<HTMLElement | null>(null)

function handleOutsideClick(e: MouseEvent) {
  if (avatarMenuRef.value && !avatarMenuRef.value.contains(e.target as Node)) {
    showAvatarMenu.value = false
  }
}

const submissions = ref<Submission[]>([])
const orgUsers = ref<OrgUser[]>([])
const selectedUser = ref<OrgUser | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const showIngest = ref(false)
const ingestText = ref('')
const ingestBrokerEmail = ref('')
const ingestFiles = ref<File[]>([])
const ingestError = ref<string | null>(null)
const isIngesting = ref(false)

// ── Helpers ────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function go(id: string) {
  router.push(`/app/submissions/${id}`)
}

function normalizeScore(score: number): number {
  return score > 10 ? Math.round(score) / 10 : score
}

function scoreColor(score: number): string {
  const n = normalizeScore(score)
  if (n >= 7.5) return 'text-green-700'
  if (n >= 5) return 'text-amber-700'
  return 'text-red-600'
}

function decisionClass(decision: string): string {
  if (decision === 'PROCEED') return 'bg-green-50 text-green-800 border border-green-200'
  if (decision === 'REFER') return 'bg-amber-50 text-amber-800 border border-amber-200'
  if (decision === 'DECLINE') return 'bg-red-50 text-red-800 border border-red-200'
  return 'bg-gray-100 text-gray-600 border border-gray-200'
}

const coverageSourceMap: Record<string, string> = {
  upload: 'File Upload',
  text: 'Manual Entry',
  api: 'API',
  email: 'Email',
}
function coverageLabel(source: string): string {
  return coverageSourceMap[source] ?? source ?? '—'
}

// ── Computed metrics ───────────────────────────────────────────
const metrics = computed(() => {
  const total = submissions.value.length
  const approved = submissions.value.filter((s) => s.decision === 'PROCEED').length
  const declined = submissions.value.filter((s) => s.decision === 'DECLINE').length
  const scores = submissions.value
    .filter((s) => s.composite_score != null)
    .map((s) => normalizeScore(s.composite_score!))
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  return [
    {
      label: 'In Queue',
      value: total,
      sub: `${submissions.value.filter((s) => s.status === 'processing' || s.status === 'pending').length} analyzing`,
      iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-gray-900',
    },
    {
      label: 'Approved',
      value: approved,
      sub: total ? `${Math.round((approved / total) * 100)}% of total` : 'no submissions',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-700',
      valueColor: 'text-green-700',
    },
    {
      label: 'Avg Score',
      value: scores.length ? avg.toFixed(1) : '—',
      sub: `across ${scores.length} scored`,
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Flagged',
      value: declined,
      sub: total ? `${Math.round((declined / total) * 100)}% decline rate` : 'no submissions',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
    },
  ]
})

const approvalRate = computed(() => {
  const decided = submissions.value.filter((s) => s.decision)
  if (!decided.length) return 0
  return Math.round((decided.filter((s) => s.decision === 'PROCEED').length / decided.length) * 100)
})

const referRate = computed(() => {
  const decided = submissions.value.filter((s) => s.decision)
  if (!decided.length) return 0
  return Math.round((decided.filter((s) => s.decision === 'REFER').length / decided.length) * 100)
})

const activityFeed = computed(() => {
  return [...submissions.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)
    .map((s) => {
      const name = s.named_insured || s.broker_email || 'Unnamed submission'
      let description = 'Submission received'
      let iconPath = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      let dotBg = 'bg-gray-100'
      let dotColor = 'text-gray-500'

      if (s.decision === 'PROCEED') {
        description = 'Approved for underwriting'
        iconPath = 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        dotBg = 'bg-green-100'
        dotColor = 'text-green-700'
      } else if (s.decision === 'REFER') {
        description = 'Referred to senior underwriter'
        iconPath = 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        dotBg = 'bg-amber-100'
        dotColor = 'text-amber-700'
      } else if (s.decision === 'DECLINE') {
        description = 'Declined — risk threshold exceeded'
        iconPath = 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        dotBg = 'bg-red-100'
        dotColor = 'text-red-600'
      } else if (s.status === 'processing' || s.status === 'pending') {
        description = 'AI analysis in progress'
        iconPath = 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
        dotBg = 'bg-amber-100'
        dotColor = 'text-amber-700'
      } else if (s.status === 'error') {
        description = 'Analysis failed'
        iconPath = 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        dotBg = 'bg-red-100'
        dotColor = 'text-red-600'
      }

      return { id: s.id, name, description, created_at: s.created_at, iconPath, dotBg, dotColor }
    })
})

// ── Auth ───────────────────────────────────────────────────────
const { fetch: refreshSession } = useUserSession()

async function logout() {
  showAvatarMenu.value = false
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login', { replace: true })
}

// ── Data loading ───────────────────────────────────────────────
async function load() {
  isLoading.value = true
  errorMessage.value = null
  try {
    if (isAdmin.value && !selectedUser.value) {
      const res = await $fetch<{ users: OrgUser[] }>('/api/users')
      orgUsers.value = res.users
    } else {
      const params =
        isAdmin.value && selectedUser.value && selectedUser.value.id !== '__all__'
          ? { userId: selectedUser.value.id }
          : {}
      const res = await $fetch<{ submissions: Submission[] }>('/api/submissions', { params })
      submissions.value = res.submissions
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Failed to load'
  } finally {
    isLoading.value = false
  }
}

async function selectUser(u: OrgUser) {
  selectedUser.value = u
  submissions.value = []
  await load()
}

async function clearUser() {
  selectedUser.value = null
  submissions.value = []
  await load()
}

// ── Ingest ─────────────────────────────────────────────────────
function onFileSelected(e: Event) {
  const t = e.target as HTMLInputElement
  ingestFiles.value = t.files ? Array.from(t.files) : []
}

function closeIngest() {
  showIngest.value = false
  ingestText.value = ''
  ingestFiles.value = []
  ingestBrokerEmail.value = ''
  ingestError.value = null
}

async function submitIngest() {
  isIngesting.value = true
  ingestError.value = null
  try {
    const files = ingestFiles.value.length
      ? ingestFiles.value
      : [new File([ingestText.value], 'submission.txt', { type: 'text/plain' })]
    const fd = new FormData()
    for (const f of files) fd.append('file', f, f.name)
    if (ingestBrokerEmail.value) fd.append('brokerEmail', ingestBrokerEmail.value)
    await $fetch('/api/submissions/ingest', { method: 'POST', body: fd })
    closeIngest()
    await load()
  } catch (e: any) {
    ingestError.value = e?.data?.message || e?.message || 'Submission failed'
  } finally {
    isIngesting.value = false
  }
}

// ── Realtime ───────────────────────────────────────────────────
const { $supabase } = useNuxtApp() as any
let channel: ReturnType<typeof $supabase.channel> | null = null

function subscribeRealtime() {
  if (!user.value?.org_id) return
  channel = $supabase
    .channel('submissions-inbox')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'submissions', filter: `org_id=eq.${user.value.org_id}` },
      () => load(),
    )
    .subscribe()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  load()
  subscribeRealtime()
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
  if (channel) $supabase.removeChannel(channel)
})
</script>

<style scoped>
.glass-card {
  @apply bg-white border border-gray-200 rounded-2xl shadow-card;
}

.nav-link {
  @apply text-[13px] font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all duration-150 cursor-pointer;
}

.nav-link--active {
  @apply text-gray-900 bg-gray-100;
}

.th-cell {
  @apply px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.07em];
}

.td-cell {
  @apply px-4 py-3.5;
}

.decision-pill {
  @apply inline-flex items-center text-[10px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full;
}

.table-btn {
  @apply text-[11px] font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default;
}

.modal-label {
  @apply block text-[11px] font-semibold text-gray-500 uppercase tracking-[0.07em] mb-2;
}

.modal-input {
  @apply w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-accent-500/70 focus:bg-white rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150;
}

.modal-btn-secondary {
  @apply text-[13px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer;
}

.modal-btn-primary {
  @apply bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#050A18] text-[13px] font-bold px-5 py-2 rounded-xl transition-colors duration-150 cursor-pointer;
}
</style>
