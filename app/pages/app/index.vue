<template>
  <div class="h-screen flex flex-col bg-surface-50 font-sans overflow-hidden">
    <!-- Header -->
    <AppHeader variant="app">
      <div
        class="mx-auto max-w-5xl px-8 py-4 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <img src="/PelorusLogo.png" width="34" height="34" alt="Pelorus" />
          <span class="font-sans text-[19px] text-white tracking-[-0.3px]">Pelorus</span>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/app/settings"
            class="text-[13px] font-medium text-white/75 hover:text-white transition-colors"
            >Guidelines</NuxtLink
          >
          <button
            class="text-[13px] font-medium text-white/75 hover:text-white transition-colors"
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
    </AppHeader>

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
                  :class="ingestFiles.length ? 'text-primary-800 font-medium' : 'text-black/50'"
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

      <!-- Admin: underwriter list -->
      <div v-if="isAdmin && !selectedUser" class="submission-inbox flex-1 min-h-0 bg-white rounded-2xl border border-black/[0.07] shadow-card overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
          <p class="text-[13px] text-black/55">{{ orgUsers.length }} underwriter{{ orgUsers.length !== 1 ? 's' : '' }}</p>
        </div>
        <div v-if="isLoading" class="px-6 py-12 text-center text-[13px] text-black/30">Loading...</div>
        <div v-else-if="!orgUsers.length" class="px-6 py-12 text-center text-[13px] text-black/30">No users found.</div>
        <div v-else class="divide-y divide-black/[0.04]">
          <div
            class="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-surface-50 transition-colors"
            @click="selectUser({ id: '__all__', email: 'All Submissions', role: 'admin' })"
          >
            <p class="text-[14px] font-semibold text-primary-800">All Submissions</p>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="text-black/20 flex-shrink-0">
              <path d="M5 2.5l4 4.5-4 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div
            v-for="u in orgUsers"
            :key="u.id"
            class="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer hover:bg-surface-50 transition-colors"
            @click="selectUser(u)"
          >
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold text-primary-800">{{ u.email }}</p>
              <p class="text-[12px] text-black/40">{{ u.role }}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="text-black/20 flex-shrink-0">
              <path d="M5 2.5l4 4.5-4 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Submissions list (underwriter own, or admin drill-down) -->
      <div v-else class="submission-inbox flex-1 min-h-0 bg-white rounded-2xl border border-black/[0.07] shadow-card overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
          <div class="flex items-center gap-3">
            <button v-if="isAdmin && selectedUser" class="text-[13px] text-black/45 hover:text-primary-800 transition-colors" @click="clearUser">← Back</button>
            <p class="text-[13px] text-black/55">
              <span v-if="isAdmin && selectedUser" class="font-medium text-primary-800">{{ selectedUser.email }}</span>
              <span v-else>{{ submissions.length }} submission{{ submissions.length !== 1 ? 's' : '' }}</span>
            </p>
          </div>
          <button
            class="border border-black/10 hover:border-primary-800 text-[12px] font-medium text-black/55 hover:text-primary-800 px-3 py-1.5 rounded-md transition-all disabled:opacity-40"
            :disabled="isLoading"
            @click="load"
          >
            {{ isLoading ? "Refreshing..." : "Refresh" }}
          </button>
        </div>
        <div v-if="isLoading && !submissions.length" class="px-6 py-12 text-center text-[13px] text-black/30">Loading...</div>
        <div v-else-if="!submissions.length" class="px-6 py-12 text-center text-[13px] text-black/30">
          No submissions yet. Click <strong class="text-primary-800">+ New Submission</strong> to get started.
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
            @click="sub.status !== 'processing' && sub.status !== 'pending' && go(sub.id)"
          >
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold text-primary-800 truncate">
                {{ sub.named_insured || sub.broker_email || "Unnamed submission" }}
              </p>
              <p class="mt-0.5 text-[12px] text-black/55">
                <span v-if="sub.broker">{{ sub.broker }}</span>
                <span v-if="sub.broker && sub.prior_carrier" class="mx-1">·</span>
                <span v-if="sub.prior_carrier">{{ sub.prior_carrier }}</span>
                <span v-if="!sub.broker && !sub.prior_carrier">{{ formatDate(sub.created_at) }}</span>
              </p>
              <p class="mt-0.5 text-[11px] text-black/25">{{ formatDate(sub.created_at) }}</p>
            </div>
            <div class="flex items-center gap-2.5 flex-shrink-0">
              <span v-if="sub.status === 'processing' || sub.status === 'pending'" class="flex items-center gap-1.5 text-[12px] text-accent-500 font-medium">
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
              >{{ sub.decision }}</span>
              <span v-if="sub.composite_score != null" class="text-[15px] font-bold text-primary-800 min-w-[28px] text-right">{{ (sub.composite_score > 10 ? Math.round(sub.composite_score) / 10 : sub.composite_score).toFixed(1) }}<span class="text-[11px] font-normal text-primary-800">/10</span></span>
              <span
                v-if="!(sub.status === 'complete' && sub.decision)"
                class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                :class="{
                  'bg-black/5 text-black/55': sub.status === 'pending',
                  'bg-accent-500/15 text-accent-600': sub.status === 'processing',
                  'bg-success-500/10 text-success-700': sub.status === 'complete',
                  'bg-danger-500/10 text-danger-700': sub.status === 'error',
                }"
              >{{ sub.status }}</span>
              <svg v-if="sub.status !== 'processing' && sub.status !== 'pending'" width="14" height="14" viewBox="0 0 14 14" fill="none" class="text-black/20 flex-shrink-0">
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
import { computed, onMounted, onUnmounted, ref } from "vue";

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

type OrgUser = { id: string; email: string; role: string };

const router = useRouter();
const { user } = useUserSession();
const isAdmin = computed(() => user.value?.role === 'admin');

const submissions = ref<Submission[]>([]);
const orgUsers = ref<OrgUser[]>([]);
const selectedUser = ref<OrgUser | null>(null);
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

const { fetch: refreshSession } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login', { replace: true })
}

async function load() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    if (isAdmin.value && !selectedUser.value) {
      const res = await $fetch<{ users: OrgUser[] }>("/api/users");
      orgUsers.value = res.users;
    } else {
      const params = isAdmin.value && selectedUser.value && selectedUser.value.id !== '__all__' ? { userId: selectedUser.value.id } : {};
      const res = await $fetch<{ submissions: Submission[] }>("/api/submissions", { params });
      submissions.value = res.submissions;
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || "Failed to load";
  } finally {
    isLoading.value = false;
  }
}

async function selectUser(u: OrgUser) {
  selectedUser.value = u;
  submissions.value = [];
  await load();
}

async function clearUser() {
  selectedUser.value = null;
  submissions.value = [];
  await load();
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
    const files = ingestFiles.value.length
      ? ingestFiles.value
      : [new File([ingestText.value], "submission.txt", { type: "text/plain" })];
    const fd = new FormData();
    for (const f of files) fd.append("file", f, f.name);
    if (ingestBrokerEmail.value) fd.append("brokerEmail", ingestBrokerEmail.value);
    await $fetch("/api/submissions/ingest", { method: "POST", body: fd });
    closeIngest();
    await load();
  } catch (e: any) {
    ingestError.value = e?.data?.message || e?.message || "Submission failed";
  } finally {
    isIngesting.value = false;
  }
}

const { $supabase } = useNuxtApp() as any;

let channel: ReturnType<typeof $supabase.channel> | null = null;

function subscribeRealtime() {
  if (!user.value?.org_id) return;
  channel = $supabase
    .channel("submissions-inbox")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "submissions",
        filter: `org_id=eq.${user.value.org_id}`,
      },
      () => load(),
    )
    .subscribe();
}

onUnmounted(() => {
  if (channel) $supabase.removeChannel(channel);
});

onMounted(() => {
  load();
  subscribeRealtime();
});
</script>
