<template>
  <div class="min-h-screen bg-surface-50">
    <header class="border-b border-primary-700/20 bg-primary-700">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6"
      >
        <div>
          <h1 class="text-2xl font-semibold text-white">Pelorus Dashboard</h1>
          <p class="mt-1 text-sm text-slate-200">
            Processed submissions and underwriting outcomes.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/dashboard"
            class="rounded-md border border-accent-500/40 bg-accent-500 px-3 py-1 text-xs font-semibold text-white"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/dev"
            class="rounded-md border border-slate-200/50 bg-white px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-slate-100"
          >
            Dev Console
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-10">
      <section
        class="overflow-hidden rounded-2xl border border-primary-700/15 bg-white shadow-card"
      >
        <div
          class="flex items-center justify-between border-b border-primary-700/10 px-6 py-4"
        >
          <div>
            <h2 class="text-2xl font-semibold text-primary-700">
              All Submissions
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Click a case to open its full underwriting detail view.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink
              to="/dev"
              class="rounded-full border border-accent-500/40 bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              + Add Case
            </NuxtLink>
            <button
              class="rounded-full border border-primary-700/30 bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-700/5"
              :disabled="isLoading"
              @click="loadSubmissions"
            >
              {{ isLoading ? "Refreshing..." : "Refresh" }}
            </button>
          </div>
        </div>

        <p v-if="errorMessage" class="px-6 pt-4 text-sm text-danger-700">
          {{ errorMessage }}
        </p>

        <div
          v-if="isLoading && !submissions.length"
          class="px-6 py-10 text-sm text-slate-600"
        >
          Loading submissions...
        </div>

        <div
          v-else-if="!submissions.length"
          class="px-6 py-10 text-sm text-slate-600"
        >
          No processed submissions yet. Use the
          <NuxtLink to="/dev" class="text-accent-600 underline"
            >Dev Console</NuxtLink
          >
          to run an analysis.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead>
              <tr
                class="border-b border-primary-700/10 text-xs uppercase tracking-wide text-primary-700/70"
              >
                <th class="px-6 py-3 font-semibold">Company</th>
                <th class="px-6 py-3 font-semibold">Outcome</th>
                <th class="px-6 py-3 font-semibold">Rule Health</th>
                <th class="px-6 py-3 font-semibold">Next Step</th>
                <th class="px-6 py-3 font-semibold">Date Added</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in pagedSubmissions"
                :key="item.id"
                class="cursor-pointer border-b border-primary-700/10 text-sm transition hover:bg-surface-100"
                @click="goToSubmission(item.id)"
              >
                <td class="px-6 py-4">
                  <p class="font-semibold text-slate-900">
                    {{ item.companyName }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">{{ item.summary }}</p>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="{
                      'bg-success-500/15 text-success-700':
                        item.status === 'PASS',
                      'bg-accent-500/15 text-accent-600':
                        item.status === 'REFER',
                      'bg-danger-500/15 text-danger-700':
                        item.status === 'FAIL',
                    }"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-slate-700">
                    <p>
                      <span class="font-semibold text-danger-700">{{
                        failedCount(item)
                      }}</span>
                      failed
                    </p>
                    <p>
                      <span class="font-semibold text-accent-600">{{
                        unknownCount(item)
                      }}</span>
                      unknown
                    </p>
                    <p>
                      <span class="font-semibold text-success-700">{{
                        passedCount(item)
                      }}</span>
                      passed
                    </p>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold text-primary-700">
                    {{ nextStepLabel(item) }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ issueSummary(item) }}
                  </p>
                </td>
                <td class="px-6 py-4 text-slate-600">
                  {{ formatDate(item.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="submissions.length > pageSize"
          class="flex items-center justify-between border-t border-primary-700/10 px-6 py-4"
        >
          <button
            class="rounded-md border border-primary-700/30 px-3 py-1 text-sm font-semibold text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <div class="flex items-center gap-2">
            <button
              v-for="page in totalPages"
              :key="page"
              class="h-8 w-8 rounded-md text-sm font-semibold"
              :class="
                page === currentPage
                  ? 'bg-accent-500/20 text-accent-600'
                  : 'text-primary-700 hover:bg-primary-700/10'
              "
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </div>
          <button
            class="rounded-md border border-primary-700/30 px-3 py-1 text-sm font-semibold text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { ProcessedSubmission } from "~/types/models";

type ListSubmissionsResponse = {
  submissions: ProcessedSubmission[];
};

const submissions = ref<ProcessedSubmission[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = 8;
const router = useRouter();

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const e = error as {
      data?: { message?: string };
      statusMessage?: string;
      message?: string;
    };
    return e.data?.message || e.statusMessage || e.message || "Request failed.";
  }
  return "Request failed.";
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString();
};

const failedCount = (item: ProcessedSubmission) =>
  item.evaluation.filter((entry) => entry.status === "FAIL").length;
const unknownCount = (item: ProcessedSubmission) =>
  item.evaluation.filter((entry) => entry.status === "UNKNOWN").length;

const passedCount = (item: ProcessedSubmission) =>
  item.evaluation.filter((entry) => entry.status === "PASS").length;

const nextStepLabel = (item: ProcessedSubmission) => {
  if (item.status === "FAIL") return "Do Not Bind";
  if (item.status === "REFER") return "Underwriter Review";
  return "Ready to Quote";
};

const issueSummary = (item: ProcessedSubmission) => {
  const failed = failedCount(item);
  const unknown = unknownCount(item);
  if (item.status === "PASS") return "No blocking issues detected.";
  if (item.status === "FAIL") return `${failed} blocking rule issue(s).`;
  if (unknown > 0) return `${unknown} unknown item(s) need clarification.`;
  return `${failed} rule variance(s) need review.`;
};

const totalPages = computed(() =>
  Math.max(1, Math.ceil(submissions.value.length / pageSize)),
);
const pagedSubmissions = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return submissions.value.slice(start, start + pageSize);
});

const goToSubmission = (id: string) => {
  router.push(`/submissions/${id}`);
};

const loadSubmissions = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const response = await $fetch<ListSubmissionsResponse>("/api/submissions");
    submissions.value = response.submissions;
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadSubmissions);
</script>
