<template>
  <div class="min-h-screen bg-white text-gray-900 overflow-x-hidden">

    <!-- NAV -->
    <AppHeader variant="marketing" />

    <!-- ── HERO ──────────────────────────────────────────────── -->
    <section class="min-h-screen flex items-center pt-16 px-6 md:px-12 relative overflow-hidden">
      <!-- Subtle grid -->
      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px); background-size: 60px 60px"/>

      <div class="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 w-full py-16 md:py-20">

        <!-- Left -->
        <div>
          <div class="inline-flex items-center gap-2 bg-accent-500/[0.08] border border-accent-500/20 rounded-full px-3.5 py-1.5 mb-7">
            <span class="w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0"/>
            <span class="text-[13px] font-semibold text-[#92700A] tracking-[0.05em]">AI-Powered Underwriting Triage</span>
          </div>
          <h1 class="text-[clamp(36px,7vw,60px)] font-bold text-gray-900 leading-[1.08] tracking-[-1.5px] mb-6">
            Know your bearing<br>on <em class="not-italic text-[#92700A]">every risk</em>
          </h1>
          <p class="text-[16px] md:text-[17px] text-gray-700 leading-[1.75] mb-10 max-w-[480px]">
            Pelorus reads any insurance submission and delivers a complete triage verdict, severity-ranked concerns, and underwriting insights faster than any manual first pass — calibrated to your specific guidelines, not industry averages.
          </p>
          <div class="flex items-center gap-4 flex-wrap">
            <a href="#contact" class="bg-accent-500 hover:bg-accent-400 text-[#050A18] px-6 py-3 rounded-xl text-[16px] font-bold no-underline inline-flex items-center gap-2 transition-all duration-150 hover:-translate-y-px">
              Contact Sales
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <a href="#how" class="text-gray-700 hover:text-gray-900 text-[16px] font-medium no-underline inline-flex items-center gap-1.5 transition-colors duration-150">
              See how it works
              <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>

          <!-- Stats row -->
          <div class="flex gap-6 md:gap-10 mt-10 pt-8 border-t border-gray-100">
            <div>
              <span class="block text-[22px] md:text-[26px] font-bold text-gray-900 tracking-[-0.5px]">~80 sec</span>
              <span class="text-[12px] text-gray-600 uppercase tracking-[0.08em] font-semibold">Full triage turnaround</span>
            </div>
            <div>
              <span class="block text-[22px] md:text-[26px] font-bold text-gray-900 tracking-[-0.5px]">Any line</span>
              <span class="text-[12px] text-gray-600 uppercase tracking-[0.08em] font-semibold">Property, GL, casualty &amp; more</span>
            </div>
            <div>
              <span class="block text-[22px] md:text-[26px] font-bold text-gray-900 tracking-[-0.5px]">30 min</span>
              <span class="text-[12px] text-gray-600 uppercase tracking-[0.08em] font-semibold">Saved per submission</span>
            </div>
          </div>
        </div>

        <!-- Right — App Mockup -->
        <div class="relative hidden lg:block">
          <div class="rounded-2xl overflow-hidden border border-gray-200 bg-white" style="animation:float 6s ease-in-out infinite;transform:rotate(-1deg);box-shadow:0 32px 80px rgba(0,0,0,0.12)">
            <!-- Mini nav -->
            <div class="bg-gray-50 border-b border-gray-100">
              <!-- Inbox list -->
              <div class="px-4 pt-3 pb-1">
                <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em]">Inbox</span>
              </div>
              <div class="flex flex-col">
                <div class="px-3 py-2 flex items-center gap-2 opacity-50">
                  <span class="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"/>
                  <span class="text-[11px] text-gray-700 truncate">Northgate Cold Storage LLC</span>
                  <span class="ml-auto text-[9px] text-gray-400 flex-shrink-0">6m</span>
                </div>
                <div class="px-3 py-2 flex items-center gap-2 opacity-50">
                  <span class="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"/>
                  <span class="text-[11px] text-gray-700 truncate">Lakewood Auto Dealerships Inc.</span>
                  <span class="ml-auto text-[9px] text-gray-400 flex-shrink-0">11m</span>
                </div>
                <div class="px-3 py-2 flex items-center gap-2 bg-white border-l-2 border-accent-500 rounded-r-sm">
                  <span class="w-1.5 h-1.5 bg-accent-500 rounded-full flex-shrink-0"/>
                  <span class="text-[11px] font-semibold text-gray-900 truncate">Clearwater Medical Plaza</span>
                  <span class="ml-auto text-[9px] text-accent-600 font-medium flex-shrink-0">Now</span>
                </div>
                <div class="px-3 py-2 flex items-center gap-2 opacity-40">
                  <span class="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0"/>
                  <span class="text-[11px] text-gray-500 truncate">Blue Harbor Hospitality Group</span>
                  <span class="ml-auto text-[9px] text-gray-400 flex-shrink-0">58m</span>
                </div>
              </div>
              <div class="px-4 pt-2 pb-2 border-t border-gray-100 mt-1">
                <span class="text-[11px] text-gray-600 font-medium">Clearwater Medical Plaza</span>
                <span class="text-[10px] text-gray-500 ml-2">· Submission Review</span>
              </div>
            </div>
            <!-- Simulated notice -->
            <div class="mx-3 mt-2.5 px-3 py-1.5 rounded-lg bg-accent-500/[0.07] border border-accent-500/20 flex items-center gap-2">
              <span class="text-[9px] font-black tracking-[0.1em] uppercase bg-accent-500/20 text-[#92700A] px-1.5 py-0.5 rounded flex-shrink-0">Demo</span>
              <span class="text-[10px] text-[#92700A]/80 font-medium">Simulated submission — mirrors real-world commercial property triage</span>
            </div>
            <!-- Decision banner -->
            <div class="mx-3 mt-2 rounded-xl p-4 flex items-start justify-between gap-3 bg-green-50 border border-green-200">
              <div class="flex-1">
                <span class="block text-[11px] font-bold tracking-[0.12em] uppercase text-gray-600 mb-1">Decision</span>
                <span class="block text-[20px] font-bold text-green-700 tracking-[-0.5px] mb-1">PROCEED TO QUOTE</span>
                <span class="block text-[12px] text-gray-800 leading-relaxed mb-2">No hard stops triggered. Class A medical office, zero losses in 5 years.</span>
                <div class="flex items-center gap-2">
                  <span class="text-[12px] text-gray-600">TIV: $4,200,000</span>
                  <span class="bg-green-100 text-[11px] text-green-700 font-medium px-2 py-0.5 rounded-full">71s</span>
                </div>
              </div>
              <div class="flex-shrink-0 flex items-baseline gap-0.5">
                <span class="text-[30px] font-bold text-green-700 tracking-[-1.5px] leading-none">8.7</span>
                <span class="text-[15px] font-medium text-green-400">/ 10</span>
              </div>
            </div>
            <!-- Tabs -->
            <div class="mx-3 mt-3 flex gap-0.5 bg-gray-100 rounded-xl border border-gray-200 p-0.5">
              <span class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-center bg-white text-gray-900 shadow-sm">Summary</span>
              <span class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-center text-gray-600">Guidelines</span>
              <span class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-center text-gray-600">Insights</span>
              <span class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-center text-gray-600">Risk Profile</span>
            </div>
            <!-- Summary body -->
            <div class="mx-3 mt-3 mb-3 flex flex-col gap-2.5">
              <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p class="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-600 mb-1.5">Recommended Next Action</p>
                <p class="text-[12px] text-gray-800 leading-relaxed mb-2.5">Proceed to quote. All guideline checks passed. Obtain roof inspection for the 16-year membrane prior to binding.</p>
                <div class="flex flex-col gap-1.5">
                  <div class="flex gap-1.5 text-[11px] text-gray-700 leading-relaxed">
                    <span class="text-green-700 font-bold flex-shrink-0">1.</span>Issue quote per standard commercial property terms
                  </div>
                  <div class="flex gap-1.5 text-[11px] text-gray-700 leading-relaxed">
                    <span class="text-green-700 font-bold flex-shrink-0">2.</span>Request roof inspection report prior to binding
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-gray-100 bg-white overflow-hidden">
                <div class="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span class="text-[11px] font-semibold text-gray-800">Concerns &amp; Flags</span>
                  <span class="text-[11px] text-gray-600">2 items</span>
                </div>
                <div class="divide-y divide-gray-100">
                  <div class="p-3 bg-amber-50/30">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <span class="text-[11px] font-semibold text-gray-900">Roof Age — 16-Year TPO Membrane</span>
                      <span class="text-[7px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">VERIFY</span>
                    </div>
                    <p class="text-[11px] text-gray-700 leading-relaxed">Within 4 years of 20-year guideline threshold. Inspection required before binding.</p>
                  </div>
                  <div class="p-3">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <span class="text-[11px] font-semibold text-gray-900">Co-Insurance — Confirm Replacement Cost</span>
                      <span class="text-[7px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-full flex-shrink-0">INFO</span>
                    </div>
                    <p class="text-[11px] text-gray-700 leading-relaxed">TIV at $4.2M. Verify replacement cost valuation reflects current construction costs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Floating badge 1 -->
          <div class="absolute -bottom-4 -left-6 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5" style="animation:float2 5s cubic-bezier(0.45,0.05,0.55,0.95) infinite;box-shadow:0 8px 32px rgba(0,0,0,0.08)">
            <div class="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div class="text-[14px] font-semibold text-gray-900">All checks evaluated</div>
              <div class="text-[13px] text-gray-600">Against your guidelines</div>
            </div>
          </div>

          <!-- Floating badge 2 -->
          <div class="absolute -top-3 -right-6 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5" style="animation:float3 7s cubic-bezier(0.45,0.05,0.55,0.95) infinite;box-shadow:0 8px 32px rgba(0,0,0,0.08)">
            <div class="w-8 h-8 bg-accent-500/10 border border-accent-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-[#92700A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <div class="text-[14px] font-semibold text-gray-900">12 fields extracted</div>
              <div class="text-[13px] text-gray-600">Risk profile ready</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── BUILT FOR ──────────────────────────────────────────── -->
    <div class="bg-navy py-7 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-12" data-fade>
        <span class="text-[12px] uppercase tracking-[0.12em] text-white/40 font-semibold whitespace-nowrap flex-shrink-0">Built for</span>
        <div class="w-px h-4 bg-white/10 flex-shrink-0 hidden md:block"/>
        <div class="flex items-center gap-6 md:gap-12 flex-wrap">
          <span v-for="type in ['Regional Carriers', 'Mutual Companies', 'MGAs', 'Program Administrators', 'Specialty Lines']" :key="type" class="text-[15px] md:text-[15px] font-semibold text-white/70">{{ type }}</span>
        </div>
      </div>
    </div>

    <!-- ── FEATURES ───────────────────────────────────────────── -->
    <section id="features" class="py-16 md:py-24 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto">
        <p class="text-[13px] uppercase tracking-[0.12em] text-[#92700A] font-semibold mb-4" data-fade>Platform</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-gray-900 leading-[1.12] tracking-[-1px] mb-4" data-fade data-fade-delay="60">Everything your underwriters need<br class="hidden md:block"> to triage and underwrite deals faster</h2>
        <p class="text-[16px] md:text-[17px] text-gray-700 leading-[1.75] mb-12 max-w-[540px]" data-fade data-fade-delay="120">No implementation burden. No enterprise contract. Upload your guidelines once and start triaging in minutes.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-100">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="bg-white hover:bg-gray-50 transition-colors duration-200 p-7 md:p-9 cursor-default"
            data-fade
          >
            <div class="w-10 h-10 bg-accent-500/10 border border-accent-500/20 rounded-xl flex items-center justify-center mb-5">
              <svg class="w-5 h-5 text-[#92700A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path :d="feature.icon" />
              </svg>
            </div>
            <h3 class="text-[15px] font-semibold text-gray-900 mb-2.5 leading-snug">{{ feature.title }}</h3>
            <p class="text-[16px] text-gray-700 leading-[1.75]">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── HOW IT WORKS ───────────────────────────────────────── -->
    <section id="how" class="bg-gray-50 border-t border-b border-gray-100 py-16 md:py-24 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto">
        <p class="text-[13px] uppercase tracking-[0.12em] text-[#92700A] font-semibold mb-4" data-fade>Process</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-gray-900 leading-[1.12] tracking-[-1px] mb-4" data-fade data-fade-delay="60">From submission to verdict<br class="hidden md:block"> in under two minutes</h2>
        <p class="text-[16px] md:text-[17px] text-gray-700 leading-[1.75] mb-14 max-w-[540px]" data-fade data-fade-delay="120">No manual data entry. No formatting requirements. Upload the broker's documents and let Pelorus do the first-pass work.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          <div v-for="step in steps" :key="step.num" data-fade>
            <div class="text-[52px] md:text-[60px] font-bold text-accent-500 leading-none mb-4 tracking-[-2px]">{{ step.num }}</div>
            <h3 class="text-[17px] font-semibold text-gray-900 mb-2.5">{{ step.title }}</h3>
            <p class="text-[16px] text-gray-700 leading-[1.75]">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── METRICS ─────────────────────────────────────────────── -->
    <section class="py-16 md:py-24 px-6 md:px-12 bg-navy">
      <div class="max-w-[1200px] mx-auto">
        <p class="text-[13px] uppercase tracking-[0.12em] text-accent-500 font-semibold mb-4" data-fade>Impact</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-white leading-[1.12] tracking-[-1px] mb-12" data-fade data-fade-delay="60">The numbers that matter</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-white/10">
          <div v-for="metric in metrics" :key="metric.num" class="bg-navy px-6 md:px-8 py-8 md:py-10 text-center" data-fade>
            <span class="block text-[34px] md:text-[42px] font-bold text-white leading-none mb-2 tracking-[-1.5px]">{{ metric.num }}</span>
            <span class="text-[14px] text-white/55 leading-relaxed">{{ metric.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── PRICING ────────────────────────────────────────────── -->
    <section id="pricing" class="py-16 md:py-24 px-6 md:px-12 bg-gray-50 border-t border-gray-100">
      <div class="max-w-[1200px] mx-auto">
        <p class="text-[13px] uppercase tracking-[0.12em] text-[#92700A] font-semibold mb-4" data-fade>Pricing</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-gray-900 leading-[1.12] tracking-[-1px] mb-4" data-fade data-fade-delay="60">Simple, transparent pricing</h2>
        <p class="text-[16px] md:text-[17px] text-gray-700 leading-[1.75] mb-12" data-fade data-fade-delay="120">Priced based on your submission volume and lines of business. No implementation fees, no long-term contracts.</p>
        <div class="flex justify-center">
          <div class="bg-white border border-gray-200 rounded-2xl p-8 md:p-9 w-full max-w-[440px]" style="box-shadow:0 24px 64px rgba(0,0,0,0.06)" data-fade data-fade-delay="180">
            <div class="text-[13px] font-semibold uppercase tracking-[0.1em] mb-3 text-gray-600">Custom</div>
            <div class="text-[24px] md:text-[26px] font-bold leading-tight mb-2 tracking-[-0.5px] text-gray-900">Contact us for pricing</div>
            <p class="text-[16px] leading-relaxed mb-7 pb-7 border-b border-gray-100 text-gray-700">We'll put together a number based on your volume, lines of business, and team size.</p>
            <ul class="flex flex-col gap-3.5 mb-8 list-none">
              <li
                v-for="f in ['Unlimited guideline uploads', 'Full hard stop detection', 'Underwriting insights & risk extraction', 'Multi-document parsing', 'Dedicated onboarding', 'Cancel anytime']"
                :key="f"
                class="flex items-start gap-2.5 text-[16px] text-gray-800"
              >
                <svg class="w-4 h-4 text-[#92700A] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                {{ f }}
              </li>
            </ul>
            <a href="#contact" class="block w-full text-center py-3 rounded-xl text-[16px] font-bold no-underline transition-colors duration-150 bg-accent-500 hover:bg-accent-400 text-[#050A18]">Request a Demo</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CONTACT ────────────────────────────────────────────── -->
    <section id="contact" class="py-16 md:py-24 px-6 md:px-12 border-t border-gray-100">
      <div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
        <!-- Left -->
        <div>
          <p class="text-[13px] uppercase tracking-[0.12em] text-[#92700A] font-semibold mb-4" data-fade>Contact Sales</p>
          <h2 class="text-[clamp(26px,3.5vw,42px)] font-bold text-gray-900 leading-[1.12] tracking-[-1px] mb-4" data-fade data-fade-delay="60">Let's find the right fit<br class="hidden md:block"> for your team</h2>
          <p class="text-[16px] md:text-[17px] text-gray-700 leading-[1.75] mb-10" data-fade data-fade-delay="120">Tell us about your submission volume and current process. We'll walk you through a live demo using your actual guidelines.</p>
          <div class="flex flex-col gap-6">
            <div v-for="point in contactPoints" :key="point.title" class="flex gap-4" data-fade>
              <div class="w-10 h-10 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-4.5 h-4.5 text-[#92700A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="point.icon" />
                </svg>
              </div>
              <div>
                <div class="text-[16px] font-semibold text-gray-900 mb-1">{{ point.title }}</div>
                <div class="text-[15px] text-gray-700 leading-relaxed">{{ point.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right — Form -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card" data-fade data-fade-delay="100">
          <div v-if="!formSubmitted" class="p-6 md:p-8">
            <h3 class="text-[18px] font-bold text-gray-900 tracking-[-0.3px] mb-1">Request a demo</h3>
            <p class="text-[15px] text-gray-700 mb-6">We typically respond within one business day.</p>
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="form-label">First name</label>
                  <input id="firstName" v-model="form.firstName" type="text" placeholder="James" class="form-input"/>
                </div>
                <div>
                  <label for="lastName" class="form-label">Last name</label>
                  <input id="lastName" v-model="form.lastName" type="text" placeholder="Callahan" class="form-input"/>
                </div>
              </div>
              <div>
                <label for="workEmail" class="form-label">Work email</label>
                <input id="workEmail" v-model="form.email" type="email" placeholder="james@carrier.com" class="form-input"/>
              </div>
              <div>
                <label for="company" class="form-label">Company</label>
                <input id="company" v-model="form.company" type="text" placeholder="Granite Ridge Insurance" class="form-input"/>
              </div>
              <div>
                <label for="role" class="form-label">Your role</label>
                <select id="role" v-model="form.role" class="form-input appearance-none cursor-pointer">
                  <option value="">Select your role</option>
                  <option>Chief Underwriting Officer</option>
                  <option>VP Underwriting</option>
                  <option>Senior Underwriter</option>
                  <option>Underwriter</option>
                  <option>Operations / Technology</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label for="volume" class="form-label">Monthly submission volume</label>
                <select id="volume" v-model="form.volume" class="form-input appearance-none cursor-pointer">
                  <option value="">Estimate submissions per month</option>
                  <option>Under 50</option>
                  <option>50 – 200</option>
                  <option>200 – 500</option>
                  <option>500 – 1,000</option>
                  <option>Over 1,000</option>
                </select>
              </div>
              <div>
                <label for="message" class="form-label">Anything else? <span class="normal-case font-normal text-gray-600 tracking-normal">(optional)</span></label>
                <textarea id="message" v-model="form.message" rows="3" placeholder="Lines of business, current process, specific challenges…" class="form-input resize-none"/>
              </div>
              <button class="w-full bg-accent-500 hover:bg-accent-400 text-[#050A18] py-3 rounded-xl text-[16px] font-bold transition-colors duration-150 mt-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50" @click="submitForm">
                Request Demo →
              </button>
              <p class="text-[14px] text-gray-600 text-center">No sales pressure. We'll reach out to schedule a call.</p>
            </div>
          </div>

          <div v-else class="p-8 flex flex-col items-center justify-center text-center py-16">
            <div class="w-12 h-12 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-5">
              <svg class="w-5 h-5 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="text-[18px] font-bold text-gray-900 tracking-[-0.3px] mb-2">We'll be in touch</h3>
            <p class="text-[16px] text-gray-700 leading-relaxed max-w-[280px]">Thanks for reaching out. We typically respond within one business day to schedule a demo call.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ────────────────────────────────────────────── -->
    <footer class="border-t border-gray-100 px-6 md:px-12 py-12 md:py-16">
      <div class="max-w-[1200px] mx-auto">
        <div class="flex flex-col md:flex-row justify-between gap-10 mb-10 md:mb-12">
          <div>
            <div class="flex items-center gap-2.5 mb-2">
              <img src="/PelorusLogo.png" width="28" height="28" alt="Pelorus mark" />
              <img src="/PelorusWordmark.png" height="18" alt="Pelorus" class="h-[18px] w-auto" />
            </div>
            <div class="text-[15px] text-gray-600 italic">'Know your bearing on every risk'</div>
          </div>
          <div class="flex gap-12 md:gap-16">
            <div>
              <div class="text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-600 mb-4">Product</div>
              <ul class="flex flex-col gap-3 list-none">
                <li v-for="link in ['Features', 'How it works', 'Pricing']" :key="link">
                  <a :href="`#${link.toLowerCase().replace(' ', '')}`" class="text-[15px] text-gray-700 hover:text-gray-900 no-underline transition-colors duration-150">{{ link }}</a>
                </li>
              </ul>
            </div>
            <div>
              <div class="text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-600 mb-4">Company</div>
              <ul class="flex flex-col gap-3 list-none">
                <li><a href="#contact" class="text-[15px] text-gray-700 hover:text-gray-900 no-underline transition-colors duration-150">Contact Sales</a></li>
                <li><NuxtLink to="/privacy" class="text-[15px] text-gray-700 hover:text-gray-900 no-underline transition-colors duration-150">Privacy Policy</NuxtLink></li>
                <li><span class="text-[15px] text-gray-400 cursor-default">Terms of Service</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-8 border-t border-gray-100">
          <span class="text-[14px] text-gray-600">© 2026 Pelorus LLC. All rights reserved.</span>
          <div class="flex gap-6">
            <NuxtLink to="/privacy" class="text-[14px] text-gray-600 hover:text-gray-800 no-underline transition-colors duration-150">Privacy</NuxtLink>
            <span class="text-[14px] text-gray-400 cursor-default">Terms</span>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  title: 'Pelorus — Know Your Bearing on Every Risk',
  meta: [{ name: 'description', content: 'AI-powered underwriting triage for commercial carriers. PROCEED / REFER / DECLINE in under two minutes, calibrated to your specific guidelines.' }],
})

const formSubmitted = ref(false)
const form = ref({ firstName: '', lastName: '', email: '', company: '', role: '', volume: '', message: '' })

function submitForm() {
  if (!form.value.firstName || !form.value.email || !form.value.company) return
  formSubmitted.value = true
}

const features = [
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Rapid Triage Decision',
    desc: 'Every submission returns a clear PROCEED, REFER, or DECLINE verdict with a composite score — not a generic AI opinion, but a specific comparison against your carrier\'s guidelines.',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Hard Stop Detection',
    desc: 'Every automatic-decline rule in your guidelines is checked against every submission, every time. No similarity cutoffs. No missed exclusions. Every hard stop, every run.',
  },
  {
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    title: 'Multi-Document Parsing',
    desc: 'Upload the full broker package — ACORD forms, loss runs, inspection reports, Schedule of Values. Pelorus reads all of them and cross-references facts across documents.',
  },
  {
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    title: 'Carrier-Specific Calibration',
    desc: 'Upload your guidelines once. Every evaluation runs against your rules — not industry averages. Two carriers with identical submissions can get completely different verdicts.',
  },
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    title: 'Underwriting Insights',
    desc: 'Pattern recognition, market context, cross-document consistency checks, and coverage gap analysis — what a senior underwriter notices that a junior one might miss.',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Risk Profile Extraction',
    desc: 'Every underwriting-relevant variable structured and surfaced: TIV, roof age, electrical systems, loss history, protection class — everything you need to build a quote.',
  },
]

const steps = [
  { num: '01', title: 'Upload your guidelines once', desc: 'Upload your underwriting guidelines as a PDF. Pelorus extracts your hard stops, risk appetite rules, and key data fields. This happens once — not on every submission.' },
  { num: '02', title: 'Submit the broker package', desc: 'Upload the full submission — ACORD forms, loss runs, inspection reports, Schedule of Values. Pelorus parses every document in parallel and cross-references all data.' },
  { num: '03', title: 'Review the structured verdict', desc: 'Get a PROCEED / REFER / DECLINE decision with all guideline checks, severity-flagged concerns, underwriting insights, and a risk summary ready for quoting.' },
]

const metrics = [
  { num: '20–40 min', label: 'Saved per submission on first-pass review' },
  { num: 'Any line', label: 'Property, GL, casualty, workers comp & more' },
  { num: '~80 sec', label: 'Average time from upload to full triage verdict' },
  { num: 'Email', label: 'Forward from Outlook directly — no portal needed' },
]

const contactPoints = [
  {
    icon: 'M15 10l4.553-2.069A1 1 0 0121 8.869V15.13a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    title: 'Live demo with your guidelines',
    desc: 'We run a real submission through Pelorus using your carrier\'s actual underwriting guidelines.',
  },
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Up and running in days, not months',
    desc: 'No implementation project. Upload your guidelines and start triaging immediately.',
  },
  {
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    title: 'Your data stays yours',
    desc: 'Guidelines and submission data are isolated per organization and never used for model training.',
  },
]

// Scroll pop-in animations
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        const el = entry.target as HTMLElement
        if (entry.isIntersecting) {
          const baseDelay = parseInt(el.dataset.fadeDelay ?? '0')
          setTimeout(() => {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0) scale(1)'
          }, baseDelay + i * 75)
        } else {
          // Reset when scrolled out so it re-animates on the way back
          el.style.opacity = '0'
          el.style.transform = 'translateY(30px) scale(0.97)'
        }
      })
    },
    { threshold: 0.1 }
  )

  document.querySelectorAll('[data-fade]').forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.opacity = '0'
    htmlEl.style.transform = 'translateY(30px) scale(0.97)'
    htmlEl.style.transition = 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)'
    observer.observe(htmlEl)
  })
})
</script>

<style scoped>
.form-label {
  @apply block text-[13px] font-semibold text-gray-700 uppercase tracking-[0.07em] mb-2;
}
.form-input {
  @apply w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-accent-500/70 focus:bg-white rounded-xl px-3.5 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-600 outline-none transition-all duration-150 font-[inherit];
}

@keyframes float {
  0%, 100% { transform: rotate(-1deg) translateY(0) scale(1); }
  50% { transform: rotate(-1deg) translateY(-12px) scale(1.005); }
}
@keyframes float2 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes float3 {
  0%, 100% { transform: translateY(0) rotate(0.5deg); }
  50% { transform: translateY(-10px) rotate(-0.5deg); }
}
</style>
