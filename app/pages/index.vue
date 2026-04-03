<template>
  <div class="min-h-screen bg-[#faf8f3] font-sans overflow-x-hidden">

    <!-- NAV -->
    <AppHeader variant="marketing" />

    <!-- HERO -->
    <section class="min-h-screen flex items-center pt-16 px-6 md:px-12 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse 60% 50% at 70% 40%, rgba(201,168,76,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(15,25,35,0.03) 0%, transparent 60%)"/>
      <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px); background-size: 60px 60px"/>
      <div class="absolute pointer-events-none hidden md:block" style="width: 600px; height: 600px; top: 5%; right: 10%; background: radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%); animation: gradient-drift 14s ease-in-out infinite; border-radius: 50%;"/>

      <div class="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 w-full py-16 md:py-20">
        <!-- Left -->
        <div>
          <h1 class="text-[clamp(36px,8vw,62px)] font-bold text-primary-800 leading-[1.1] tracking-[-0.5px] mb-6">
            Know your bearing<br>on <em class="not-italic text-accent-500">every risk</em>
          </h1>
          <p class="text-[17px] md:text-[18px] text-black/60 leading-[1.7] mb-10 max-w-[480px]">
            Pelorus reads any insurance submission and delivers a complete triage verdict, severity-ranked concerns, and underwriting insights faster than any manual first pass — calibrated to your specific guidelines, not industry averages.
          </p>
          <div class="flex items-center gap-4 flex-wrap">
            <a href="#contact" class="bg-primary-800 hover:bg-primary-700 text-white px-7 py-3.5 rounded-lg text-[15px] font-medium no-underline inline-flex items-center gap-2 transition-all hover:-translate-y-px hover:shadow-lg">
              Contact Sales
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <a href="#how" class="text-black/65 hover:text-primary-800 text-[15px] font-medium no-underline inline-flex items-center gap-1.5 transition-colors">
              See how it works
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
          <div class="flex gap-6 md:gap-8 mt-10 pt-10 border-t border-black/[0.07]">
            <div><span class="block text-[24px] md:text-[28px] font-bold text-primary-800 tracking-[-0.5px]">~80 sec</span><span class="text-[11px] text-black/55 uppercase tracking-[0.08em] font-medium">Full triage turnaround</span></div>
            <div><span class="block text-[24px] md:text-[28px] font-bold text-primary-800 tracking-[-0.5px]">Any line</span><span class="text-[11px] text-black/55 uppercase tracking-[0.08em] font-medium">Property, GL, casualty & more</span></div>
            <div><span class="block text-[24px] md:text-[28px] font-bold text-primary-800 tracking-[-0.5px]">XX%</span><span class="text-[11px] text-black/55 uppercase tracking-[0.08em] font-medium">Extraction accuracy</span></div>
          </div>
        </div>

        <!-- Right — App Mockup (hidden on small screens) -->
        <div class="relative hidden lg:block">
          <div class="bg-surface-50 rounded-2xl shadow-[0_24px_64px_rgba(10,22,40,0.2)] border border-black/[0.07] overflow-hidden" style="animation: float 6s ease-in-out infinite; transform: rotate(-1deg)">
            <!-- Nav bar with named insured -->
            <div class="bg-primary-800 px-4 py-3">
              <span class="block text-[8px] text-white/60 tracking-[0.04em] mb-0.5">← Inbox</span>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-accent-500 rounded-full flex-shrink-0"/>
                <span class="text-[13px] font-semibold text-white leading-tight">Harborlight Marina &amp; Boat Storage</span>
              </div>
              <span class="text-[9px] text-white/60 ml-3">Submission Review</span>
            </div>

            <!-- Decision banner -->
            <div class="mx-3 mt-3 rounded-xl p-4 flex items-start justify-between gap-3 bg-danger-500/[0.04] border border-danger-500/15">
              <div class="flex-1">
                <span class="block text-[8px] font-bold tracking-[0.12em] uppercase text-black/55 mb-1">Decision</span>
                <span class="block text-[20px] font-bold text-danger-700 tracking-[-0.5px] mb-1">DECLINE</span>
                <span class="block text-[10px] text-black/65 leading-relaxed mb-2">Two hard stops triggered. Federal Pacific panel confirmed in certified loss runs.</span>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-black/55">TIV: $20,975,000</span>
                  <span class="bg-black/[0.06] text-[9px] text-black/55 font-medium px-2 py-0.5 rounded-full">45.2s</span>
                </div>
              </div>
              <div class="flex-shrink-0 flex items-baseline gap-0.5">
                <span class="text-[30px] font-bold text-danger-700 tracking-[-1.5px] leading-none">2.5</span>
                <span class="text-[13px] font-medium text-danger-700">/ 10</span>
              </div>
            </div>

            <!-- Tabs -->
            <div class="mx-3 mt-3 flex gap-0.5 bg-white rounded-lg border border-black/[0.06] p-0.5">
              <span class="flex-1 py-1.5 rounded-md text-[9px] font-semibold text-center bg-primary-800 text-white">Summary</span>
              <span class="flex-1 py-1.5 rounded-md text-[9px] font-semibold text-center text-black/55">Guidelines</span>
              <span class="flex-1 py-1.5 rounded-md text-[9px] font-semibold text-center text-black/55">Insights</span>
              <span class="flex-1 py-1.5 rounded-md text-[9px] font-semibold text-center text-black/55">Risk Profile</span>
            </div>

            <!-- Summary tab body -->
            <div class="mx-3 mt-3 mb-3 flex flex-col gap-2.5">
              <!-- Recommended Next Action card -->
              <div class="bg-primary-800 rounded-xl p-4">
                <p class="text-[8px] font-bold tracking-[0.12em] uppercase text-white/60 mb-1.5">Recommended Next Action</p>
                <p class="text-[10px] text-white/85 leading-relaxed mb-2.5">Decline — two confirmed hard stops. Issue formal declination citing Section 4.4.1 and Section 4.2.</p>
                <div class="flex flex-col gap-1.5">
                  <div class="flex gap-1.5 text-[9px] text-white/70 leading-relaxed">
                    <span class="text-accent-500 font-bold flex-shrink-0">1.</span>Issue formal declination citing FP Stab-Lok panel confirmed in loss runs
                  </div>
                  <div class="flex gap-1.5 text-[9px] text-white/70 leading-relaxed">
                    <span class="text-accent-500 font-bold flex-shrink-0">2.</span>Advise broker Location 4 requires complete gut rehab documentation
                  </div>
                </div>
              </div>

              <!-- Concerns & Flags card -->
              <div class="rounded-xl border border-black/[0.07] bg-white overflow-hidden">
                <div class="px-3 py-2 border-b border-black/[0.05] flex items-center justify-between">
                  <span class="text-[9px] font-semibold text-primary-800">Concerns &amp; Flags</span>
                  <span class="text-[8px] text-black/55">2 items</span>
                </div>
                <div class="divide-y divide-black/[0.04]">
                  <div class="p-3 bg-danger-500/[0.02]">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <span class="text-[9px] font-semibold text-primary-800">Federal Pacific Stab-Lok Panel — Confirmed</span>
                      <span class="text-[7px] font-bold bg-danger-500/10 text-danger-700 px-1.5 py-0.5 rounded-full flex-shrink-0">CONDITION</span>
                    </div>
                    <p class="text-[8px] text-black/65 leading-relaxed">Certified loss runs confirm FP panel caused 2021 fire. Hard stop applies.</p>
                  </div>
                  <div class="p-3 bg-accent-500/[0.02]">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <span class="text-[9px] font-semibold text-primary-800">Location 4 — Roof Age 22 Years</span>
                      <span class="text-[7px] font-bold bg-accent-500/15 text-accent-600 px-1.5 py-0.5 rounded-full flex-shrink-0">VERIFY</span>
                    </div>
                    <p class="text-[8px] text-black/65 leading-relaxed">BUR roof approaching 25-year hard stop threshold. Senior UW referral required.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="absolute -bottom-4 -left-6 bg-white rounded-xl px-4 py-2.5 shadow-[0_8px_24px_rgba(10,22,40,0.15)] border border-black/[0.07] flex items-center gap-2.5" style="animation: float2 5s cubic-bezier(0.45,0.05,0.55,0.95) infinite">
            <div class="w-8 h-8 bg-success-500/10 rounded-lg flex items-center justify-center text-sm">✓</div>
            <div>
              <div class="text-[12px] font-semibold text-primary-800">All checks evaluated</div>
              <div class="text-[11px] text-black/55">Against your guidelines</div>
            </div>
          </div>
          <div class="absolute -top-3 -right-6 bg-white rounded-xl px-4 py-2.5 shadow-[0_8px_24px_rgba(10,22,40,0.12)] border border-black/[0.07] flex items-center gap-2.5" style="animation: float3 7s cubic-bezier(0.45,0.05,0.55,0.95) infinite">
            <div class="w-8 h-8 bg-accent-500/10 rounded-lg flex items-center justify-center text-sm">📋</div>
            <div>
              <div class="text-[12px] font-semibold text-primary-800">12 fields extracted</div>
              <div class="text-[11px] text-black/55">Risk profile ready</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- BUILT FOR -->
    <div class="border-t border-b border-black/[0.06] bg-white py-8 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-12">
        <span class="text-[11px] uppercase tracking-[0.1em] text-black/55 font-semibold whitespace-nowrap flex-shrink-0">Built for</span>
        <div class="flex items-center gap-6 md:gap-12 flex-wrap">
          <span v-for="type in ['Regional Carriers', 'Mutual Companies', 'MGAs', 'Program Administrators', 'Specialty Lines']" :key="type" class="text-[14px] md:text-[15px] font-semibold text-black/30">{{ type }}</span>
        </div>
      </div>
    </div>

    <!-- FEATURES -->
    <section id="features" class="py-16 md:py-24 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto">
        <p class="text-[11px] uppercase tracking-[0.12em] text-accent-500 font-semibold mb-4">Platform</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-primary-800 leading-[1.15] tracking-[-0.5px] mb-4">Everything your underwriters need<br class="hidden md:block">to triage and underwrite deals faster</h2>
        <p class="text-[16px] md:text-[17px] text-black/65 leading-[1.7] mb-12 max-w-[540px]">No implementation burden. No enterprise contract. Upload your guidelines once and start triaging in minutes.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 rounded-2xl overflow-hidden border border-black/[0.06]" style="background: rgba(0,0,0,0.06)">
          <div v-for="feature in features" :key="feature.title" class="bg-white hover:bg-[#faf8f3] transition-colors p-7 md:p-9">
            <div class="w-11 h-11 bg-accent-500/10 rounded-xl flex items-center justify-center text-xl mb-5">{{ feature.icon }}</div>
            <h3 class="text-[15px] font-semibold text-primary-800 mb-2.5 leading-snug">{{ feature.title }}</h3>
            <p class="text-[14px] text-black/65 leading-[1.7]">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="bg-primary-800 py-16 md:py-24 px-6 md:px-12 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse 50% 60% at 80% 50%, rgba(201,168,76,0.04) 0%, transparent 60%)"/>
      <div class="max-w-[1200px] mx-auto relative z-10">
        <p class="text-[11px] uppercase tracking-[0.12em] text-accent-500 font-semibold mb-4">Process</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-white leading-[1.15] tracking-[-0.5px] mb-4">From submission to verdict<br class="hidden md:block">in under two minutes</h2>
        <p class="text-[16px] md:text-[17px] text-white/70 leading-[1.7] mb-12 max-w-[540px]">No manual data entry. No formatting requirements. Upload the broker's documents and let Pelorus do the first-pass work.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          <div v-for="step in steps" :key="step.num">
            <div class="text-[48px] md:text-[56px] font-bold text-accent-500/20 leading-none mb-3">{{ step.num }}</div>
            <h3 class="text-[17px] font-semibold text-white mb-2.5">{{ step.title }}</h3>
            <p class="text-[14px] text-white/70 leading-[1.7]">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- METRICS -->
    <section class="py-16 md:py-24 px-6 md:px-12 bg-surface-100">
      <div class="max-w-[1200px] mx-auto">
        <p class="text-[11px] uppercase tracking-[0.12em] text-accent-500 font-semibold mb-4">Impact</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-primary-800 leading-[1.15] tracking-[-0.5px] mb-12">The numbers that matter</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-0.5 rounded-2xl overflow-hidden border border-black/[0.06]" style="background: rgba(0,0,0,0.06)">
          <div v-for="metric in metrics" :key="metric.num" class="bg-white px-6 md:px-8 py-8 md:py-10 text-center">
            <span class="block text-[36px] md:text-[44px] font-bold text-primary-800 leading-none mb-2 tracking-[-1px]">{{ metric.num }}</span>
            <span class="text-[13px] text-black/65 leading-relaxed">{{ metric.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="pricing" class="py-16 md:py-24 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto">
        <p class="text-[11px] uppercase tracking-[0.12em] text-accent-500 font-semibold mb-4">Pricing</p>
        <h2 class="text-[clamp(28px,4vw,46px)] font-bold text-primary-800 leading-[1.15] tracking-[-0.5px] mb-4">Simple, transparent pricing</h2>
        <p class="text-[16px] md:text-[17px] text-black/65 leading-[1.7] mb-12">Priced based on your submission volume and lines of business. No implementation fees, no long-term contracts.</p>
        <div class="flex justify-center">
          <div class="bg-primary-800 rounded-2xl p-8 md:p-9 border border-transparent shadow-[0_12px_48px_rgba(10,22,40,0.2)] w-full max-w-[420px]">
            <div class="text-[12px] font-semibold uppercase tracking-[0.1em] mb-3 text-white/60">Custom</div>
            <div class="text-[26px] md:text-[28px] font-bold leading-tight mb-2 tracking-[-0.5px] text-white">Contact us for pricing</div>
            <p class="text-[14px] leading-relaxed mb-7 pb-7 border-b text-white/70 border-white/10">We'll put together a number based on your volume, lines of business, and team size.</p>
            <ul class="flex flex-col gap-3 mb-8 list-none">
              <li v-for="f in ['Unlimited guideline uploads', 'Full hard stop detection', 'Underwriting insights & risk extraction', 'Multi-document parsing', 'Dedicated onboarding', 'Cancel anytime']" :key="f" class="flex items-start gap-2 text-[14px] text-white/80">
                <span class="text-accent-500 font-bold flex-shrink-0">✓</span>{{ f }}
              </li>
            </ul>
            <a href="#contact" class="block w-full text-center py-3 rounded-lg text-[14px] font-semibold no-underline transition-all bg-accent-500 hover:bg-accent-400 text-primary-800">Request a Demo</a>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTACT -->
    <section id="contact" class="py-16 md:py-24 px-6 md:px-12 bg-surface-100">
      <div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
        <!-- Left -->
        <div>
          <p class="text-[11px] uppercase tracking-[0.12em] text-accent-500 font-semibold mb-4">Contact Sales</p>
          <h2 class="text-[clamp(26px,3.5vw,42px)] font-bold text-primary-800 leading-[1.15] tracking-[-0.5px] mb-4">Let's find the right fit<br class="hidden md:block">for your team</h2>
          <p class="text-[16px] md:text-[17px] text-black/65 leading-[1.7] mb-10">Tell us about your submission volume and current process. We'll walk you through a live demo using your actual guidelines.</p>
          <div class="flex flex-col gap-6">
            <div v-for="point in contactPoints" :key="point.title" class="flex gap-4">
              <div class="w-10 h-10 bg-white border border-black/[0.07] rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm">{{ point.icon }}</div>
              <div>
                <div class="text-[14px] font-semibold text-primary-800 mb-1">{{ point.title }}</div>
                <div class="text-[13px] text-black/65 leading-relaxed">{{ point.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right — Form -->
        <div class="bg-white rounded-2xl border border-black/[0.07] shadow-[0_4px_24px_rgba(10,22,40,0.08)] overflow-hidden">
          <div v-if="!formSubmitted" class="p-6 md:p-8">
            <h3 class="text-[20px] font-bold text-primary-800 tracking-[-0.3px] mb-1">Request a demo</h3>
            <p class="text-[13px] text-black/65 mb-6">We typically respond within one business day.</p>
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">First name</label>
                  <input v-model="form.firstName" type="text" placeholder="James" class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/40"/>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Last name</label>
                  <input v-model="form.lastName" type="text" placeholder="Callahan" class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/40"/>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Work email</label>
                <input v-model="form.email" type="email" placeholder="james@carrier.com" class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/40"/>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Company</label>
                <input v-model="form.company" type="text" placeholder="Granite Ridge Insurance" class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/40"/>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Your role</label>
                <select v-model="form.role" class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 appearance-none">
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
                <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Monthly submission volume</label>
                <select v-model="form.volume" class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 appearance-none">
                  <option value="">Estimate submissions per month</option>
                  <option>Under 50</option>
                  <option>50 – 200</option>
                  <option>200 – 500</option>
                  <option>500 – 1,000</option>
                  <option>Over 1,000</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-primary-800 uppercase tracking-[0.04em] mb-1.5">Anything else? <span class="normal-case font-normal text-black/55 tracking-normal">(optional)</span></label>
                <textarea v-model="form.message" rows="3" placeholder="Lines of business, current process, specific challenges..." class="w-full border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/40 resize-none"/>
              </div>
              <button @click="submitForm" class="w-full bg-primary-800 hover:bg-primary-700 text-white py-3 rounded-lg text-[14px] font-semibold transition-colors mt-2">Request Demo →</button>
              <p class="text-[12px] text-black/55 text-center">No sales pressure. We'll reach out to schedule a call.</p>
            </div>
          </div>
          <div v-else class="p-8 flex flex-col items-center justify-center text-center py-16">
            <div class="text-[40px] mb-4">✉️</div>
            <h3 class="text-[20px] font-bold text-primary-800 tracking-[-0.3px] mb-2">We'll be in touch</h3>
            <p class="text-[14px] text-black/65 leading-relaxed max-w-[280px]">Thanks for reaching out. We typically respond within one business day to schedule a demo call.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="bg-primary-800 px-6 md:px-12 py-12 md:py-16">
      <div class="max-w-[1200px] mx-auto">
        <div class="flex flex-col md:flex-row justify-between gap-10 mb-10 md:mb-12">
          <div>
            <div class="text-[20px] font-bold text-white tracking-[-0.3px] mb-1">Pelorus</div>
            <div class="text-[13px] text-white/60 italic">'Know your bearing on every risk'</div>
          </div>
          <div class="flex gap-12 md:gap-16">
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55 mb-4">Product</div>
              <ul class="flex flex-col gap-3 list-none">
                <li v-for="link in ['Features', 'How it works', 'Pricing']" :key="link">
                  <a :href="`#${link.toLowerCase().replace(' ', '')}`" class="text-[13px] text-white/70 hover:text-white no-underline transition-colors">{{ link }}</a>
                </li>
              </ul>
            </div>
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55 mb-4">Company</div>
              <ul class="flex flex-col gap-3 list-none">
                <li v-for="link in ['Contact Sales', 'Privacy Policy', 'Terms of Service']" :key="link">
                  <a href="#contact" class="text-[13px] text-white/70 hover:text-white no-underline transition-colors">{{ link }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-8 border-t border-white/[0.06]">
          <span class="text-[12px] text-white/55">© 2026 Pelorus LLC. All rights reserved.</span>
          <div class="flex gap-6">
            <a href="#" class="text-[12px] text-white/55 hover:text-white no-underline transition-colors">Privacy</a>
            <a href="#" class="text-[12px] text-white/55 hover:text-white no-underline transition-colors">Terms</a>
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
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap' }]
})

const formSubmitted = ref(false)
const form = ref({ firstName: '', lastName: '', email: '', company: '', role: '', volume: '', message: '' })

function submitForm() {
  if (!form.value.firstName || !form.value.email || !form.value.company) return
  formSubmitted.value = true
}

const features = [
  { icon: '⚡', title: 'Instant Triage Decision', desc: 'Every submission returns a clear PROCEED, REFER, or DECLINE verdict with a composite score — not a generic AI opinion, but a specific comparison against your carrier\'s guidelines.' },
  { icon: '🛑', title: 'Hard Stop Detection', desc: 'Every automatic-decline rule in your guidelines is checked against every submission, every time. No similarity cutoffs. No missed exclusions. Every hard stop, every run.' },
  { icon: '📄', title: 'Multi-Document Parsing', desc: 'Upload the full broker package — ACORD forms, loss runs, inspection reports, Schedule of Values. Pelorus reads all of them and cross-references facts across documents.' },
  { icon: '🎯', title: 'Carrier-Specific Calibration', desc: 'Upload your guidelines once. Every evaluation runs against your rules — not industry averages. Two carriers with identical submissions can get completely different verdicts.' },
  { icon: '🔍', title: 'Underwriting Insights', desc: 'Pattern recognition, market context, cross-document consistency checks, and coverage gap analysis — what a senior underwriter notices that a junior one might miss.' },
  { icon: '📊', title: 'Risk Profile Extraction', desc: 'Every underwriting-relevant variable structured and surfaced: TIV, roof age, electrical systems, loss history, protection class — everything you need to build a quote.' },
]

const steps = [
  { num: '01', title: 'Upload your guidelines once', desc: 'Upload your underwriting guidelines as a PDF. Pelorus extracts your hard stops, risk appetite rules, and key data fields. This happens once — not on every submission.' },
  { num: '02', title: 'Submit the broker package', desc: 'Upload the full submission — ACORD forms, loss runs, inspection reports, Schedule of Values. Pelorus parses every document in parallel and cross-references all data.' },
  { num: '03', title: 'Review the structured verdict', desc: 'Get a PROCEED / REFER / DECLINE decision with all guideline checks, severity-flagged concerns, underwriting insights, and a risk summary ready for quoting.' },
]

const metrics = [
  { num: 'X–Xh', label: 'Saved per submission on first-pass review' },
  { num: 'Any line', label: 'Property, GL, casualty, workers comp & more' },
  { num: 'XX%', label: 'Data extraction accuracy on real submissions' },
  { num: '~80 sec', label: 'Average time from upload to full triage verdict' },
]

const contactPoints = [
  { icon: '🎯', title: 'Live demo with your guidelines', desc: 'We run a real submission through Pelorus using your carrier\'s actual underwriting guidelines.' },
  { icon: '⚡', title: 'Up and running in days, not months', desc: 'No implementation project. Upload your guidelines and start triaging immediately.' },
  { icon: '🔒', title: 'Your data stays yours', desc: 'Guidelines and submission data are isolated per organization and never used for model training.' },
]

// Scroll animations
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => (entry.target as HTMLElement).style.opacity = '1', i * 80)
        setTimeout(() => (entry.target as HTMLElement).style.transform = 'translateY(0)', i * 80)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })
  document.querySelectorAll('[data-fade]').forEach(el => {
    ;(el as HTMLElement).style.opacity = '0'
    ;(el as HTMLElement).style.transform = 'translateY(20px)'
    ;(el as HTMLElement).style.transition = 'opacity 0.6s ease, transform 0.6s ease'
    observer.observe(el)
  })
})
</script>

<style>
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
@keyframes gradient-drift {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
  33% { transform: translate(-30px, 20px) scale(1.05); opacity: 0.8; }
  66% { transform: translate(20px, -15px) scale(0.97); opacity: 0.6; }
}
html { scroll-behavior: smooth; }
</style>