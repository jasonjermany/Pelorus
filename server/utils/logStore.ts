import { EventEmitter } from 'events'

export type LogLevel = 'log' | 'warn' | 'error'

export type LogEntry = {
  id: number
  ts: number
  level: LogLevel
  msg: string
}

const MAX_ENTRIES = 2000
const emitter = new EventEmitter()
emitter.setMaxListeners(50)

let seq = 0
const entries: LogEntry[] = []

function capture(level: LogLevel, args: unknown[]) {
  const msg = args
    .map(a => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ')
  const entry: LogEntry = { id: ++seq, ts: Date.now(), level, msg }
  entries.push(entry)
  if (entries.length > MAX_ENTRIES) entries.shift()
  emitter.emit('entry', entry)
}

const _log   = console.log.bind(console)
const _warn  = console.warn.bind(console)
const _error = console.error.bind(console)

console.log   = (...a) => { _log(...a);   capture('log',   a) }
console.warn  = (...a) => { _warn(...a);  capture('warn',  a) }
console.error = (...a) => { _error(...a); capture('error', a) }

export function getEntries(since = 0): LogEntry[] {
  return entries.filter(e => e.id > since)
}

export function onEntry(cb: (e: LogEntry) => void) {
  emitter.on('entry', cb)
  return () => emitter.off('entry', cb)
}
