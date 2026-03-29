<template>
  <div class="h-screen flex flex-col bg-surface-50 font-sans overflow-hidden">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-primary-800 border-b border-white/5">
      <div
        class="mx-auto max-w-5xl px-8 py-4 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="white" stroke-opacity="0.3" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="6" stroke="white" stroke-opacity="0.3" stroke-width="1.5"/>
            <line x1="16" y1="1" x2="16" y2="7" stroke="white" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="16" y1="25" x2="16" y2="31" stroke="white" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="1" y1="16" x2="7" y2="16" stroke="white" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="25" y1="16" x2="31" y2="16" stroke="white" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="16" y1="10" x2="20" y2="16" stroke="#c9a84c" stroke-width="2" stroke-linecap="round"/>
            <circle cx="16" cy="16" r="2" fill="#c9a84c"/>
          </svg>
          <span class="font-sans text-[19px] text-white tracking-[-0.3px]">Pelorus</span>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/app/settings"
            class="text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors"
            >Guidelines</NuxtLink
          >
          <button
            class="text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors"
            @click="logout"
          >
            Sign out
          </button>
          <button
            class="bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-white text-[13px] font-semibold px-4 py-2 rounded-md transition-colors"
            :disabled="isIngesting"
            @click="showIngest = true"
          >
            + New Submission
          </button>
        </div>
      </div>
    </header>

    <!-- Ingest Modal -->
    <div
      v-if="showIngest"
      class="fixed inset-0 z-50 flex items-center justify-center bg-primary-800/50 backdrop-blur-sm p-6"
      @click.self="closeIngest"
    >
      <div
        class="w-full max-w-[460px] bg-white rounded-2xl shadow-banner overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]"
        >
          <h2 class="font-sans text-[19px] text-primary-800 tracking-[-0.3px]">
            New Submission
          </h2>
          <button
            class="text-black/30 hover:text-black/60 transition-colors leading-none"
            @click="closeIngest"
          >
            ✕
          </button>
        </div>
        <div class="px-6 py-5 flex flex-col gap-4">
          <div>
            <label
              class="block text-[11px] font-semibold text-primary-800 tracking-[0.04em] uppercase mb-2"
              >Upload files</label
            >
            <div
              class="relative border-[1.5px] border-dashed border-black/15 rounded-lg bg-surface-50 hover:border-primary-800 transition-colors cursor-pointer"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.docx,.txt,.xlsx,.xls"
                multiple
                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                @change="onFileSelected"
              />
              <div
                class="flex flex-col items-center gap-2 py-6 pointer-events-none"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  :class="ingestFiles.length ? 'text-primary-800' : 'text-black/25'"
                >
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span
                  class="text-[13px]"
                  :class="ingestFiles.length ? 'text-primary-800 font-medium' : 'text-black/35'"
                >
                  {{
                    ingestFiles.length
                      ? `${ingestFiles.length} file${ingestFiles.length !== 1 ? "s" : ""} selected`
                      : "PDF, XLSX, DOCX — click to browse"
                  }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="!ingestFiles.length">
            <label
              class="block text-[11px] font-semibold text-primary-800 tracking-[0.04em] uppercase mb-2"
              >Or paste text</label
            >
            <textarea
              v-model="ingestText"
              rows="4"
              placeholder="Paste submission text here..."
              class="w-full border-[1.5px] border-black/15 rounded-lg px-3.5 py-2.5 text-[13px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors resize-none font-sans text-primary-800 placeholder:text-black/25"
            />
          </div>
          <div>
            <label
              class="block text-[11px] font-semibold text-primary-800 tracking-[0.04em] uppercase mb-2"
              >Broker email
              <span class="normal-case font-normal text-black/30 tracking-normal">(optional)</span>
            </label>
            <input
              v-model="ingestBrokerEmail"
              type="email"
              placeholder="broker@example.com"
              class="w-full border-[1.5px] border-black/15 rounded-lg px-3.5 py-2.5 text-[13px] bg-surface-50 focus:outline-none focus:border-primary-800 focus:bg-white transition-colors font-sans text-primary-800 placeholder:text-black/25"
            />
          </div>
          <p v-if="ingestError" class="text-[13px] text-danger-700">
            {{ ingestError }}
          </p>
        </div>
        <div
          class="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-black/[0.06] bg-surface-50"
        >
          <button
            class="border border-black/15 hover:border-primary-800 text-black/50 hover:text-primary-800 px-4 py-2 rounded-md text-[13px] font-medium transition-all"
            @click="closeIngest"
          >
            Cancel
          </button>
          <button
            class="bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-primary-800 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
            :disabled="isIngesting || (!ingestFiles.length && !ingestText.trim())"
            @click="submitIngest"
          >
            {{ isIngesting ? "Submitting..." : "Submit" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main -->
    <main class="flex-1 flex flex-col overflow-hidden mx-auto w-full max-w-5xl px-8 py-10 min-h-0">
      <p v-if="errorMessage" class="mb-4 text-[13px] text-danger-700">
        {{ errorMessage }}
      </p>
      <div
        class="submission-inbox flex-1 min-h-0 bg-white rounded-2xl border border-black/[0.07] shadow-card overflow-y-auto"
      >
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]"
        >
          <p class="text-[13px] text-black/40">
            {{ submissions.length }} submission{{
              submissions.length !== 1 ? "s" : ""
            }}
          </p>
          <button
            class="border border-black/10 hover:border-primary-800 text-[12px] font-medium text-black/40 hover:text-primary-800 px-3 py-1.5 rounded-md transition-all disabled:opacity-40"
            :disabled="isLoading"
            @click="load"
          >
            {{ isLoading ? "Refreshing..." : "Refresh" }}
          </button>
        </div>
        <div
          v-if="isLoading && !submissions.length"
          class="px-6 py-12 text-center text-[13px] text-black/30"
        >
          Loading...
        </div>
        <div
          v-else-if="!submissions.length"
          class="px-6 py-12 text-center text-[13px] text-black/30"
        >
          No submissions yet. Click
          <strong class="text-primary-800">+ New Submission</strong> to get
          started.
        </div>
        <div v-else class="divide-y divide-black/[0.04]">
          <div
            v-for="sub in submissions"
            :key="sub.id"
            class="flex items-center justify-between gap-4 px-6 py-4 transition-colors"
            :class="
              sub.status === 'processing' || sub.status === 'pending'
                ? 'opacity-60 cursor-default'
                : 'cursor-pointer hover:bg-surface-50'
            "
            @click="
              sub.status !== 'processing' &&
              sub.status !== 'pending' &&
              go(sub.id)
            "
          >
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold text-primary-800 truncate">
                {{ sub.named_insured || sub.broker_email || "Unnamed submission" }}
              </p>
              <p class="mt-0.5 text-[12px] text-black/40">
                <span v-if="sub.broker">{{ sub.broker }}</span>
                <span v-if="sub.broker && sub.prior_carrier" class="mx-1">·</span>
                <span v-if="sub.prior_carrier">{{ sub.prior_carrier }}</span>
                <span v-if="!sub.broker && !sub.prior_carrier">{{ formatDate(sub.created_at) }}</span>
              </p>
              <p class="mt-0.5 text-[11px] text-black/25">
                {{ formatDate(sub.created_at) }}
              </p>
            </div>
            <div class="flex items-center gap-2.5 flex-shrink-0">
              <span
                v-if="sub.status === 'processing' || sub.status === 'pending'"
                class="flex items-center gap-1.5 text-[12px] text-accent-500 font-medium"
              >
                <span class="inline-block w-3 h-3 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin"/>
                Analyzing...
              </span>
              <span
                v-if="sub.decision"
                class="text-[11px] font-bold tracking-[0.05em] px-2.5 py-1 rounded-full"
                :class="{
                  'bg-success-500/10 text-success-700': sub.decision === 'PROCEED',
                  'bg-accent-500/15 text-accent-600': sub.decision === 'REFER',
                  'bg-danger-500/10 text-danger-700': sub.decision === 'DECLINE',
                }"
                >{{ sub.decision }}</span
              >
              <span
                v-if="sub.composite_score != null"
                class="text-[15px] font-bold text-primary-800 min-w-[28px] text-right"
                >{{ sub.composite_score }}</span
              >
              <span
                v-if="!(sub.status === 'complete' && sub.decision)"
                class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                :class="{
                  'bg-black/5 text-black/40': sub.status === 'pending',
                  'bg-accent-500/15 text-accent-600': sub.status === 'processing',
                  'bg-success-500/10 text-success-700': sub.status === 'complete',
                  'bg-danger-500/10 text-danger-700': sub.status === 'error',
                }"
                >{{ sub.status }}</span
              >
              <svg
                v-if="sub.status !== 'processing' && sub.status !== 'pending'"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                class="text-black/20 flex-shrink-0"
              >
                <path d="M5 2.5l4 4.5-4 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

type Submission = {
  id: string;
  status: string;
  source: string;
  broker_email: string | null;
  created_at: string;
  decision: string | null;
  composite_score: number | null;
  named_insured: string | null;
  broker: string | null;
  prior_carrier: string | null;
};

const router = useRouter();
const submissions = ref<Submission[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const showIngest = ref(false);
const ingestText = ref("");
const ingestBrokerEmail = ref("");
const ingestFiles = ref<File[]>([]);
const ingestError = ref<string | null>(null);
const isIngesting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

function go(id: string) {
  router.push(`/app/submissions/${id}`);
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

async function load() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await $fetch<{ submissions: Submission[] }>("/api/submissions");
    submissions.value = res.submissions;
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || "Failed to load";
  } finally {
    isLoading.value = false;
  }
}

function onFileSelected(e: Event) {
  const t = e.target as HTMLInputElement;
  ingestFiles.value = t.files ? Array.from(t.files) : [];
}

function closeIngest() {
  showIngest.value = false;
  ingestText.value = "";
  ingestFiles.value = [];
  ingestBrokerEmail.value = "";
  ingestError.value = null;
}

async function submitIngest() {
  isIngesting.value = true;
  ingestError.value = null;
  try {
    if (ingestFiles.value.length) {
      const fd = new FormData();
      for (const f of ingestFiles.value) fd.append("file", f, f.name);
      if (ingestBrokerEmail.value) fd.append("brokerEmail", ingestBrokerEmail.value);
      await $fetch("/api/submissions/ingest", { method: "POST", body: fd });
    } else {
      await $fetch("/api/submissions/ingest", {
        method: "POST",
        body: { text: ingestText.value, brokerEmail: ingestBrokerEmail.value || undefined },
      });
    }
    closeIngest();
    await load();
  } catch (e: any) {
    ingestError.value = e?.data?.message || e?.message || "Submission failed";
  } finally {
    isIngesting.value = false;
  }
}

const hasProcessing = computed(() =>
  submissions.value.some((s) => s.status === "processing" || s.status === "pending"),
);

let pollInterval: ReturnType<typeof setInterval> | null = null;
watch(
  hasProcessing,
  (val) => {
    if (val && !pollInterval) {
      pollInterval = setInterval(load, 5000);
    } else if (!val && pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

onMounted(load);
</script>
