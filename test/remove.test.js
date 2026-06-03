import { test }   from 'node:test'
import assert     from 'node:assert/strict'
import { remove } from '../src/remove.js'

async function runRemove(args) {
  let exitCode
  const orig = process.exit
  process.exit = code => {
    exitCode = code
    throw Object.assign(new Error('exit'), { isExit: true })
  }
  try {
    await remove(args)
  } catch (e) {
    if (!e.isExit) throw e
  } finally {
    process.exit = orig
  }
  return exitCode
}

test('remove — exits 1 when no domain argument is given', async () => {
  assert.equal(await runRemove([]), 1)
})

test('remove — exits 1 when only flag args given (--yes, no domain)', async () => {
  assert.equal(await runRemove(['--yes']), 1)
})

test('remove — exits 1 when process is not root', async () => {
  if (process.getuid?.() === 0) return
  assert.equal(await runRemove(['example.com']), 1)
})
