import { test }                           from 'node:test'
import assert                             from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs'
import { join }                           from 'path'
import { tmpdir }                         from 'os'
import { init }                           from '../src/init.js'

function tmpDir() {
  return mkdtempSync(join(tmpdir(), 'vhost-init-test-'))
}

test('creates sites.yml in the target directory', () => {
  const dir = tmpDir()
  try {
    init(dir)
    assert.ok(existsSync(join(dir, 'sites.yml')))
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('created sites.yml contains a "sites" key', () => {
  const dir = tmpDir()
  try {
    init(dir)
    const content = readFileSync(join(dir, 'sites.yml'), 'utf8')
    assert.ok(content.includes('sites:'))
  } finally {
    rmSync(dir, { recursive: true })
  }
})

test('created sites.yml includes a static and proxy example', () => {
  const dir = tmpDir()
  try {
    init(dir)
    const content = readFileSync(join(dir, 'sites.yml'), 'utf8')
    assert.ok(content.includes('mode: static'))
    assert.ok(content.includes('mode: proxy'))
  } finally {
    rmSync(dir, { recursive: true })
  }
})
