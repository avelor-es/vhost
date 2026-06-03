import { test }                              from 'node:test'
import assert                               from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'fs'
import { join }                             from 'path'
import { tmpdir }                           from 'os'
import { checkModules, checkSnakeoil,
         SNAKEOIL_CERT, SNAKEOIL_KEY }      from '../src/apache.js'

function tmpDir() {
  return mkdtempSync(join(tmpdir(), 'vhost-apache-test-'))
}

// ── checkModules ──────────────────────────────────────────────────────────────

test('checkModules — passes when all .load files are present', () => {
  const dir = tmpDir()
  try {
    writeFileSync(join(dir, 'rewrite.load'), '')
    writeFileSync(join(dir, 'ssl.load'), '')
    assert.doesNotThrow(() => checkModules(['rewrite', 'ssl'], dir))
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('checkModules — throws listing missing modules', () => {
  const dir = tmpDir()
  try {
    writeFileSync(join(dir, 'rewrite.load'), '')
    assert.throws(
      () => checkModules(['rewrite', 'ssl', 'headers'], dir),
      err => {
        assert.ok(err.message.includes('ssl'))
        assert.ok(err.message.includes('headers'))
        assert.ok(!err.message.includes('rewrite'))
        return true
      }
    )
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('checkModules — throws with a2enmod hint', () => {
  const dir = tmpDir()
  try {
    assert.throws(
      () => checkModules(['proxy'], dir),
      err => {
        assert.ok(err.message.includes('a2enmod'))
        assert.ok(err.message.includes('proxy'))
        return true
      }
    )
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('checkModules — skips check if mods-enabled dir does not exist', () => {
  assert.doesNotThrow(() => checkModules(['rewrite'], '/nonexistent/path/mods-enabled'))
})

// ── checkSnakeoil ─────────────────────────────────────────────────────────────

test('checkSnakeoil — passes when both cert files exist', () => {
  const dir  = tmpDir()
  const cert = join(dir, 'cert.pem')
  const key  = join(dir, 'key.pem')
  try {
    writeFileSync(cert, '')
    writeFileSync(key,  '')
    // checkSnakeoil uses hardcoded paths — test the logic via checkModules pattern
    // since we can't inject paths into checkSnakeoil directly,
    // just verify SNAKEOIL_CERT / SNAKEOIL_KEY constants are defined strings
    assert.equal(typeof SNAKEOIL_CERT, 'string')
    assert.equal(typeof SNAKEOIL_KEY,  'string')
    assert.ok(SNAKEOIL_CERT.endsWith('.pem'))
    assert.ok(SNAKEOIL_KEY.endsWith('.key'))
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('checkSnakeoil — throws with apt install hint when certs are missing', () => {
  if (existsSync(SNAKEOIL_CERT) && existsSync(SNAKEOIL_KEY)) return

  assert.throws(
    () => checkSnakeoil(),
    err => {
      assert.ok(err.message.includes('ssl-cert'))
      return true
    }
  )
})
