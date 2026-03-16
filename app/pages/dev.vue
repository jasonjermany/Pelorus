<template>
  <div class="min-h-screen bg-surface-50">
    <header class="border-b border-primary-700/20 bg-primary-700">
      <div class="mx-auto max-w-6xl px-6 pt-10 pb-8">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-semibold text-white">Pelorus</h1>
              <p class="mt-2 max-w-2xl text-lg text-slate-100">
                AI-powered submission triage for underwriters.
              </p>
              <p class="mt-2 text-sm text-slate-200">
                Convert underwriting guidelines into structured rules, extract facts from submissions, and instantly see pass/fail results.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <NuxtLink to="/dashboard" class="rounded-md border border-slate-200/50 bg-white px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-slate-100">
                Dashboard
              </NuxtLink>
              <NuxtLink to="/dev" class="rounded-md border border-accent-500/40 bg-accent-500 px-3 py-1 text-xs font-semibold text-white">
                Dev Console
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 pb-16 pt-16">
      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <div class="flex items-start justify-between gap-4">
            <div class="min-h-[4.5rem]">
              <h2 class="text-xl font-semibold text-primary-700">Underwriting Guidelines</h2>
              <p class="mt-1 text-sm text-slate-600">
                Paste your underwriting guidelines below and generate structured rules.
              </p>
            </div>
            <Badge variant="info">Step 1</Badge>
          </div>

          <textarea
            v-model="guidelines"
            class="mt-4 h-40 w-full resize-y rounded-xl border border-primary-700/20 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
          />

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <Button :variant="isGeneratingRules ? 'accent' : 'primary'" :disabled="isGeneratingRules" @click="onGenerateRules">{{ isGeneratingRules ? 'Generating...' : 'Generate Rules' }}</Button>
            <Button variant="secondary" :disabled="isExtractingGuidelinesFile" @click="triggerGuidelinesFileUpload">
              {{ isExtractingGuidelinesFile ? 'Extracting...' : 'Upload File' }}
            </Button>
            <Button variant="secondary" @click="resetGuidelines">Reset</Button>
          </div>
          <input
            ref="guidelinesFileInput"
            type="file"
            class="hidden"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            @change="onGuidelinesFileSelected"
          />
          <p v-if="guidelinesUploadNote" class="mt-3 text-sm text-success-700">
            {{ guidelinesUploadNote }}
          </p>
          <p v-if="guidelinesUploadError" class="mt-3 text-sm text-danger-700">
            {{ guidelinesUploadError }}
          </p>
          <p v-if="generateError" class="mt-3 text-sm text-danger-700">
            {{ generateError }}
          </p>

          <div class="mt-6">
            <h3 class="text-sm font-semibold text-primary-700">Structured Rules</h3>
            <p class="mt-1 text-xs text-slate-500">Rules generated from your guidelines. Each rule is evaluated against extracted facts.</p>

            <div class="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="!rules.length" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                Generate rules to see them appear here.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="rule in rules"
                  :key="rule.id"
                  class="rounded-xl border border-primary-700/15 bg-white p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ rule.normalizedExpression }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ rule.sourceText }}</p>
                    </div>
                    <span class="rounded-full bg-primary-700/10 px-3 py-1 text-xs font-semibold text-primary-700">
                      {{ rule.field }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-start justify-between gap-4">
            <div class="min-h-[4.5rem]">
              <h2 class="text-xl font-semibold text-primary-700">Submission Input</h2>
              <p class="mt-1 text-sm text-slate-600">
                Paste a broker submission and extract facts for evaluation.
              </p>
            </div>
            <Badge variant="info">Step 2</Badge>
          </div>

          <textarea
            v-model="submission"
            class="mt-4 h-40 w-full resize-y rounded-xl border border-primary-700/20 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
          />

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="accent"
              :disabled="isAnalyzing || !rules.length"
              @click="onAnalyzeSubmission"
            >
              {{ isAnalyzing ? 'Analyzing...' : 'Analyze Submission' }}
            </Button>
            <Button variant="secondary" :disabled="isExtractingSubmissionFile" @click="triggerSubmissionFileUpload">
              {{ isExtractingSubmissionFile ? 'Extracting...' : 'Upload File' }}
            </Button>
            <Button variant="secondary" @click="resetSubmission">Reset</Button>
          </div>
          <input
            ref="submissionFileInput"
            type="file"
            class="hidden"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            @change="onSubmissionFileSelected"
          />
          <p v-if="submissionUploadNote" class="mt-3 text-sm text-success-700">
            {{ submissionUploadNote }}
          </p>
          <p v-if="submissionUploadError" class="mt-3 text-sm text-danger-700">
            {{ submissionUploadError }}
          </p>
          <p v-if="analyzeError" class="mt-3 text-sm text-danger-700">
            {{ analyzeError }}
          </p>
          <p v-if="saveError" class="mt-3 text-sm text-danger-700">
            {{ saveError }}
          </p>
          <p v-if="saveNote" class="mt-3 text-sm text-success-700">
            {{ saveNote }}
          </p>

          <div class="mt-6">
            <h3 class="text-sm font-semibold text-primary-700">Extracted Facts</h3>
            <p class="mt-1 text-xs text-slate-500">
              Facts extracted from the submission that are used to evaluate each rule.
            </p>

            <div class="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="!facts.length" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                Analyze a submission to see extracted facts.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="fact in facts"
                  :key="fact.field"
                  class="rounded-xl border border-primary-700/15 bg-white p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ fact.field }}</p>
                      <p class="mt-1 text-xs text-slate-500">
                        {{ fact.sourceSnippet || 'Extracted from submission' }}
                      </p>
                    </div>
                    <Badge :variant="factConfidenceVariant(fact.confidence)">
                      {{ (fact.confidence * 100).toFixed(0) }}% confidence
                    </Badge>
                  </div>
                  <p class="mt-3 text-sm text-slate-700">
                    <span class="font-medium">Value:</span> {{ displayFactValue(fact.value) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <h3 class="text-sm font-semibold text-primary-700">Additional Signals</h3>
            <p class="mt-1 text-xs text-slate-500">
              Important underwriting facts detected by AI outside the current rule set.
            </p>

            <div class="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="!additionalFacts.length" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                No additional signals detected.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="fact in additionalFacts"
                  :key="`additional-${fact.field}-${fact.sourceSnippet || ''}`"
                  class="rounded-xl border border-primary-700/15 bg-white p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ fact.field }}</p>
                      <p class="mt-1 text-xs text-slate-500">
                        {{ fact.sourceSnippet || 'Extracted from submission' }}
                      </p>
                    </div>
                    <Badge :variant="factConfidenceVariant(fact.confidence)">
                      {{ (fact.confidence * 100).toFixed(0) }}% confidence
                    </Badge>
                  </div>
                  <p class="mt-3 text-sm text-slate-700">
                    <span class="font-medium">Value:</span> {{ displayFactValue(fact.value) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div class="mt-10">
        <Card>
          <div class="flex flex-col gap-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 class="text-xl font-semibold text-primary-700">Evaluation Report</h2>
                <p class="mt-1 text-sm text-slate-600">
                  See how the submission compares to your underwriting guidelines.
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                  :class="{
                    'bg-success-500/15 text-success-700': overallStatus === 'PASS',
                    'bg-danger-500/15 text-danger-700': overallStatus === 'FAIL',
                    'bg-accent-500/15 text-accent-600': overallStatus === 'REFER',
                  }"
                >
                  <span
                    class="h-2.5 w-2.5 rounded-full"
                    :class="{
                      'bg-success-500': overallStatus === 'PASS',
                      'bg-danger-500': overallStatus === 'FAIL',
                      'bg-accent-500': overallStatus === 'REFER',
                    }"
                  />
                  Submission Result: {{ overallStatus }}
                </span>

                <Button variant="ghost" :disabled="!canCopyJson" @click="copyReport">
                  Copy JSON
                </Button>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-3">
              <div>
                <h3 class="text-sm font-semibold text-primary-700">Failed Rules</h3>
                <div class="mt-3 space-y-3">
                  <div v-if="failedResults.length === 0" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                    No failed rules.
                  </div>
                  <div v-for="result in failedResults" :key="result.ruleId" class="rounded-xl border border-danger-200 bg-danger-50 p-4">
                    <p class="text-sm font-semibold text-danger-800">{{ result.normalizedExpression }}</p>
                    <p class="mt-1 text-xs text-danger-700">Actual: {{ displayFactValue(result.actualValue) }}</p>
                    <p class="mt-1 text-xs text-danger-700">Hard decline: {{ result.isHardDecline ? 'Yes' : 'No' }}</p>
                    <p class="mt-1 text-xs text-danger-700">Reason: {{ result.reason }}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-primary-700">Unknown Rules</h3>
                <div class="mt-3 space-y-3">
                  <div v-if="unknownResults.length === 0" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                    No unknown rules.
                  </div>
                  <div v-for="result in unknownResults" :key="result.ruleId" class="rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
                    <p class="text-sm font-semibold text-accent-600">{{ result.normalizedExpression }}</p>
                    <p class="mt-1 text-xs text-accent-600">Actual: {{ displayFactValue(result.actualValue) }}</p>
                    <p class="mt-1 text-xs text-accent-600">Reason: {{ result.reason }}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-primary-700">Passed Rules</h3>
                <div class="mt-3 space-y-3">
                  <div v-if="passedResults.length === 0" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                    No rules have passed yet.
                  </div>
                  <div v-for="result in passedResults" :key="result.ruleId" class="rounded-xl border border-success-200 bg-success-50 p-4">
                    <p class="text-sm font-semibold text-success-800">{{ result.normalizedExpression }}</p>
                    <p class="mt-1 text-xs text-success-700">Actual: {{ displayFactValue(result.actualValue) }}</p>
                    <p class="mt-1 text-xs text-success-700">Reason: {{ result.reason }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Badge from '~/components/ui/Badge.vue'
import type { Rule, ExtractedFact, EvaluationResult, ProcessedSubmission, SubmissionDecision } from '~/types/models'
import { evaluateRules } from '~/utils/ruleEngine'

const defaultGuidelines = ''

const defaultSubmission = ''

const guidelines = ref(defaultGuidelines)
const submission = ref(defaultSubmission)

const rules = ref<Rule[]>([])
const facts = ref<ExtractedFact[]>([])
const additionalFacts = ref<ExtractedFact[]>([])
const evaluation = ref<EvaluationResult[]>([])

type RulesApiResponse = {
  rules: Rule[]
}

type FactsApiResponse = {
  facts: ExtractedFact[]
  additionalFacts?: ExtractedFact[]
}

type ExtractTextApiResponse = {
  text: string
}

type SaveSubmissionApiResponse = {
  submission: ProcessedSubmission
}

const isGeneratingRules = ref(false)
const isAnalyzing = ref(false)
const isExtractingGuidelinesFile = ref(false)
const isExtractingSubmissionFile = ref(false)
const generateError = ref<string | null>(null)
const analyzeError = ref<string | null>(null)
const saveError = ref<string | null>(null)
const saveNote = ref<string | null>(null)
const guidelinesUploadError = ref<string | null>(null)
const submissionUploadError = ref<string | null>(null)
const guidelinesUploadNote = ref<string | null>(null)
const submissionUploadNote = ref<string | null>(null)
const guidelinesFileInput = ref<HTMLInputElement | null>(null)
const submissionFileInput = ref<HTMLInputElement | null>(null)

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const e = error as {
      data?: { message?: string }
      statusMessage?: string
      message?: string
    }
    return e.data?.message || e.statusMessage || e.message || 'Request failed.'
  }
  return 'Request failed.'
}

const clearAnalysisState = () => {
  facts.value = []
  additionalFacts.value = []
  evaluation.value = []
}

const clearGuidelinesUploadState = () => {
  guidelinesUploadError.value = null
  guidelinesUploadNote.value = null
}

const clearSubmissionUploadState = () => {
  submissionUploadError.value = null
  submissionUploadNote.value = null
}

const summarizeEvaluation = (results: EvaluationResult[]) => {
  const failed = results.filter((item) => item.status === 'FAIL').length
  const unknown = results.filter((item) => item.status === 'UNKNOWN').length
  if (failed === 0 && unknown === 0) return 'No blocking issues.'
  return `${failed} failed, ${unknown} unknown`
}

const deriveCompanyName = (
  extractedFacts: ExtractedFact[],
  extractedAdditionalFacts: ExtractedFact[],
  submissionText: string,
) => {
  const allFacts = [...extractedFacts, ...extractedAdditionalFacts]
  const preferredFields = ['insured_name', 'dba_trade_name', 'business_name', 'entity_name']
  for (const field of preferredFields) {
    const match = allFacts.find((fact) => fact.field === field && typeof fact.value === 'string' && fact.value.trim())
    if (match && typeof match.value === 'string') return match.value.trim()
  }

  const firstLine = submissionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
  return firstLine ? firstLine.slice(0, 80) : 'Unknown Insured'
}

const computeSubmissionDecision = (results: EvaluationResult[]): SubmissionDecision => {
  const hasHardDeclineFail = results.some((result) => result.status === 'FAIL' && result.isHardDecline)
  if (hasHardDeclineFail) return 'FAIL'
  const hasUnknown = results.some((result) => result.status === 'UNKNOWN')
  const hasManualReview = results.some((result) => result.requiresManualReview)
  if (hasUnknown || hasManualReview) return 'REFER'
  return 'PASS'
}

const saveProcessedSubmission = async (
  extractedFacts: ExtractedFact[],
  extractedAdditionalFacts: ExtractedFact[],
  evaluationResults: EvaluationResult[],
) => {
  const status = computeSubmissionDecision(evaluationResults)
  const companyName = deriveCompanyName(extractedFacts, extractedAdditionalFacts, submission.value)
  const summary = summarizeEvaluation(evaluationResults)

  const payload = {
    companyName,
    status,
    summary,
    guidelinesText: guidelines.value,
    submissionText: submission.value,
    rules: rules.value,
    facts: extractedFacts,
    additionalFacts: extractedAdditionalFacts,
    evaluation: evaluationResults,
  }

  const response = await $fetch<SaveSubmissionApiResponse>('/api/submissions', {
    method: 'POST',
    body: payload,
  })
  saveNote.value = `Saved to dashboard as ${response.submission.companyName}.`
}

const extractTextFromFile = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await $fetch<ExtractTextApiResponse>('/api/extract-text', {
    method: 'POST',
    body: formData,
  })
  return response.text
}

const triggerGuidelinesFileUpload = () => {
  if (isExtractingGuidelinesFile.value) return
  guidelinesFileInput.value?.click()
}

const triggerSubmissionFileUpload = () => {
  if (isExtractingSubmissionFile.value) return
  submissionFileInput.value?.click()
}

const onGuidelinesFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  clearGuidelinesUploadState()
  isExtractingGuidelinesFile.value = true
  try {
    const extractedText = await extractTextFromFile(file)
    if (!extractedText.trim()) {
      throw new Error('No readable text was found in the file.')
    }
    guidelines.value = extractedText
    guidelinesUploadNote.value = 'Extracted text loaded from file.'
  } catch (error) {
    guidelinesUploadError.value = getErrorMessage(error)
  } finally {
    isExtractingGuidelinesFile.value = false
    if (input) input.value = ''
  }
}

const onSubmissionFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  clearSubmissionUploadState()
  isExtractingSubmissionFile.value = true
  try {
    const extractedText = await extractTextFromFile(file)
    if (!extractedText.trim()) {
      throw new Error('No readable text was found in the file.')
    }
    submission.value = extractedText
    submissionUploadNote.value = 'Extracted text loaded from file.'
  } catch (error) {
    submissionUploadError.value = getErrorMessage(error)
  } finally {
    isExtractingSubmissionFile.value = false
    if (input) input.value = ''
  }
}

const onGenerateRules = async () => {
  isGeneratingRules.value = true
  generateError.value = null
  clearAnalysisState()
  try {
    const response = await $fetch<RulesApiResponse>('/api/rules', {
      method: 'POST',
      body: { guidelineText: guidelines.value },
    })
    rules.value = response.rules
  } catch (error) {
    rules.value = []
    clearAnalysisState()
    generateError.value = getErrorMessage(error)
  } finally {
    isGeneratingRules.value = false
  }
}

const onAnalyzeSubmission = async () => {
  isAnalyzing.value = true
  analyzeError.value = null
  saveError.value = null
  saveNote.value = null
  evaluation.value = []
  try {
    const response = await $fetch<FactsApiResponse>('/api/facts', {
      method: 'POST',
      body: { submissionText: submission.value, rules: rules.value },
    })

    facts.value = response.facts
    additionalFacts.value = response.additionalFacts ?? []
    const evaluated = evaluateRules(rules.value, response.facts)
    evaluation.value = evaluated

    try {
      await saveProcessedSubmission(response.facts, response.additionalFacts ?? [], evaluated)
    } catch (saveFailure) {
      saveError.value = getErrorMessage(saveFailure)
    }
  } catch (error) {
    facts.value = []
    additionalFacts.value = []
    analyzeError.value = getErrorMessage(error)
  } finally {
    isAnalyzing.value = false
  }
}

const resetGuidelines = () => {
  guidelines.value = defaultGuidelines
  rules.value = []
  clearAnalysisState()
  clearGuidelinesUploadState()
  generateError.value = null
  analyzeError.value = null
  saveError.value = null
  saveNote.value = null
}

const resetSubmission = () => {
  submission.value = defaultSubmission
  clearAnalysisState()
  clearSubmissionUploadState()
  analyzeError.value = null
  saveError.value = null
  saveNote.value = null
}

const displayFactValue = (value: any) => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value
}

const factConfidenceVariant = (confidence: number) => {
  if (confidence > 0.8) return 'success'
  if (confidence > 0.5) return 'info'
  return 'neutral'
}

const results = computed(() => evaluation.value)
const failedResults = computed(() => results.value.filter((r) => r.status === 'FAIL'))
const unknownResults = computed(() => results.value.filter((r) => r.status === 'UNKNOWN'))
const passedResults = computed(() => results.value.filter((r) => r.status === 'PASS'))

const overallStatus = computed(() => {
  if (!results.value.length) return 'N/A'
  return computeSubmissionDecision(results.value)
})

const canCopyJson = computed(() => rules.value.length > 0 && facts.value.length > 0)

const copyReport = async () => {
  const payload = {
    guidelines: guidelines.value,
    rules: rules.value,
    submission: submission.value,
    facts: facts.value,
    additionalFacts: additionalFacts.value,
    evaluation: evaluation.value,
    overallStatus: overallStatus.value,
  }
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
}

</script>
