<template>
  <!-- Floating button -->
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

  <!-- Slide-in panel -->
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
      <!-- Header -->
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

      <!-- Input -->
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
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{
  submissionId: string
  namedInsured: string | null
}>()

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const chatOpen = ref(false)
const messages = ref<ChatMessage[]>([])
const chatInput = ref('')
const isThinking = ref(false)
const chatError = ref<string | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const chatInputEl = ref<HTMLTextAreaElement | null>(null)

function renderMarkdown(content: string): string {
  return DOMPurify.sanitize(marked.parse(content, { breaks: true }) as string)
}

watch(chatOpen, async (open) => {
  if (open && messages.value.length === 0) await loadChatHistory()
  if (open) nextTick(() => scrollToBottom())
})

async function loadChatHistory() {
  const label = props.namedInsured || 'this submission'
  try {
    const { messages: history } = await $fetch<{ messages: ChatMessage[] }>(
      `/api/chat/history?submissionId=${props.submissionId}`
    )
    messages.value = history.length > 0
      ? history
      : [{ role: 'assistant', content: `Ask me anything about ${label} — I can search the web for business info, loss history, news, and more.` }]
  } catch {
    messages.value = [{ role: 'assistant', content: `Ask me anything about ${label} — I can search the web for business info, loss history, news, and more.` }]
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
      body: { message: text, submissionId: props.submissionId, history: messages.value.slice(0, -1) },
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
.chat-assistant-msg :deep(p) { line-height: 1.6; margin-bottom: 8px; }
.chat-assistant-msg :deep(p:last-child) { margin-bottom: 0; }
.chat-assistant-msg :deep(ul),
.chat-assistant-msg :deep(ol) { padding-left: 1.25em; margin-bottom: 8px; }
.chat-assistant-msg :deep(li) { margin-bottom: 4px; line-height: 1.6; }
.chat-assistant-msg :deep(li:last-child) { margin-bottom: 0; }
.chat-assistant-msg :deep(strong) { display: inline-block; margin-top: 12px; color: #374151; }
.chat-assistant-msg :deep(strong:first-child) { margin-top: 0; }
</style>
