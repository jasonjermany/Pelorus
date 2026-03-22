<template>
  <div class="min-h-screen bg-surface-50">
    <header class="border-b border-primary-700/20 bg-primary-700">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <div>
          <h1 class="text-2xl font-semibold text-white">Pelorus</h1>
          <p class="mt-1 text-sm text-slate-200">Underwriting submission inbox.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
            :disabled="isIngesting"
            @click="showIngest = true"
          >
            + New Submission
          </button>
        </div>
      </div>
    </header>

    <!-- Ingest modal -->
    <div v-if="showIngest" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-primary-700">New Submission</h2>

        <div class="mt-4 space-y-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Upload PDF / DOCX (or paste text below)</label>
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              class="w-full text-sm text-slate-600"
              @change="onFileSelected"
            />
          </div>
          <div v-if="!ingestFiles.length">
            <label class="mb-1 block text-xs font-semibold text-slate-600">Submission text</label>
            <textarea
              v-model="ingestText"
              rows="5"
              placeholder="Paste submission text here..."
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Broker email (optional)</label>
            <input
              v-model="ingestBrokerEmail"
              type="email"
              placeholder="broker@example.com"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <p v-if="ingestError" class="mt-3 text-sm text-danger-700">{{ ingestError }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button class="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="closeIngest">Cancel</button>
          <button
            class="rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
            :disabled="isIngesting"
            @click="submitIngest"
          >
            {{ isIngesting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>

    <main class="mx-auto max-w-6xl px-6 py-10">
      <p v-if="errorMessage" class="mb-4 text-sm text-danger-700">{{ errorMessage }}</p>

      <section class="overflow-hidden rounded-2xl border border-primary-700/15 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-primary-700/10 px-6 py-4">
          <p class="text-sm text-slate-500">{{ submissions.length }} submission{{ submissions.length !== 1 ? 's' : '' }}</p>
          <button
            class="rounded-md border border-primary-700/30 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-700/5 disabled:opacity-40"
            :disabled="isLoading"
            @click="load"
          >
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <div v-if="isLoading && !submissions.length" class="px-6 py-10 text-sm text-slate-500">Loading...</div>

        <div v-else-if="!submissions.length" class="px-6 py-10 text-sm text-slate-500">
          No submissions yet. Click <strong>+ New Submission</strong> to get started.
        </div>

        <div v-else class="divide-y divide-primary-700/10">
          <div
            v-for="sub in submissions"
            :key="sub.id"
            class="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 transition hover:bg-surface-100"
            @click="go(sub.id)"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900">
                {{ sub.extracted_fields?.insured_name || sub.broker_email || sub.id.slice(0, 12) + '...' }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">{{ formatDate(sub.created_at) }}</p>
            </div>

            <div class="flex shrink-0 items-center gap-3">
              <!-- Evaluation decision badge if complete -->
              <span
                v-if="sub.status === 'complete' && sub.decision"
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-success-500/15 text-success-700': sub.decision === 'PROCEED',
                  'bg-accent-500/15 text-accent-600': sub.decision === 'REFER',
                  'bg-danger-500/15 text-danger-700': sub.decision === 'DECLINE',
                }"
              >
                {{ sub.decision }}
              </span>

              <!-- Status badge -->
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-slate-100 text-slate-600': sub.status === 'pending',
                  'bg-accent-500/15 text-accent-600': sub.status === 'processing',
                  'bg-success-500/15 text-success-700': sub.status === 'complete',
                  'bg-danger-500/15 text-danger-700': sub.status === 'error',
                }"
              >
                {{ sub.status }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div class="mt-6 text-right">
        <NuxtLink to="/settings" class="text-xs font-semibold text-accent-600 hover:underline">Guidelines &amp; Settings →</NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Submission = {
  id: string
  status: string
  source: string
  broker_email: string | null
  created_at: string
  extracted_fields: Record<string, unknown> | null
  decision?: string
}

const router = useRouter()
const submissions = ref<Submission[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

// Ingest modal
const showIngest = ref(false)
const ingestText = ref('')
const ingestBrokerEmail = ref('')
const ingestFiles = ref<File[]>([])
const ingestError = ref<string | null>(null)
const isIngesting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const formatDate = (iso: string) => new Date(iso).toLocaleDateString()

function go(id: string) {
  router.push(`/submissions/${id}`)
}

async function load() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<{ submissions: Submission[] }>('/api/submissions')
    submissions.value = res.submissions
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Failed to load'
  } finally {
    isLoading.value = false
  }
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  ingestFiles.value = target.files ? Array.from(target.files) : []
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
    if (ingestFiles.value.length) {
      const fd = new FormData()
      for (const file of ingestFiles.value) fd.append('file', file, file.name)
      if (ingestBrokerEmail.value) fd.append('brokerEmail', ingestBrokerEmail.value)
      await $fetch('/api/submissions/ingest', { method: 'POST', body: fd })
    } else {
      await $fetch('/api/submissions/ingest', {
        method: 'POST',
        body: {
          text: ingestText.value,
          brokerEmail: ingestBrokerEmail.value || undefined,
        },
      })
    }
    closeIngest()
    await load()
  } catch (e: any) {
    ingestError.value = e?.data?.message || e?.message || 'Submission failed'
  } finally {
    isIngesting.value = false
  }
}

onMounted(load)
</script>
