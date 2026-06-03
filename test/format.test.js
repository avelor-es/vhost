import { test } from 'node:test'
import assert   from 'node:assert/strict'
import { ok, warn, fail, dim, bold } from '../src/format.js'

test('ok — contains green ANSI code and the message', () => {
  const out = ok('all good')
  assert.ok(out.includes('all good'))
  assert.ok(out.includes('\x1b[32m'))
})

test('warn — contains yellow ANSI code and the message', () => {
  const out = warn('check this')
  assert.ok(out.includes('check this'))
  assert.ok(out.includes('\x1b[33m'))
})

test('fail — contains red ANSI code and the message', () => {
  const out = fail('something broke')
  assert.ok(out.includes('something broke'))
  assert.ok(out.includes('\x1b[31m'))
})

test('dim — wraps message with dim ANSI codes', () => {
  const out = dim('muted')
  assert.ok(out.includes('muted'))
  assert.ok(out.includes('\x1b[2m'))
  assert.ok(out.includes('\x1b[0m'))
})

test('bold — wraps message with bold ANSI codes', () => {
  const out = bold('strong')
  assert.ok(out.includes('strong'))
  assert.ok(out.includes('\x1b[1m'))
  assert.ok(out.includes('\x1b[0m'))
})

test('formatters preserve embedded spaces and punctuation', () => {
  const msg = 'domain.com   managed   /var/www'
  assert.ok(ok(msg).includes(msg))
  assert.ok(warn(msg).includes(msg))
  assert.ok(fail(msg).includes(msg))
})
