import { test } from 'node:test'
import assert   from 'node:assert/strict'
import { generateErrorPages, ERROR_CODES } from '../src/error-pages.js'

const pages = generateErrorPages()

test('generates 48 files — 11 codes + catchall, × 4 formats', () => {
  assert.equal(pages.length, 48)
})

test('every code has html, json, xml and txt variant', () => {
  for (const code of [...ERROR_CODES.map(String), 'catchall']) {
    assert.ok(pages.find(p => p.file === `${code}.html`), `missing ${code}.html`)
    assert.ok(pages.find(p => p.file === `${code}.json`), `missing ${code}.json`)
    assert.ok(pages.find(p => p.file === `${code}.xml`),  `missing ${code}.xml`)
    assert.ok(pages.find(p => p.file === `${code}.txt`),  `missing ${code}.txt`)
  }
})

test('ERROR_CODES contains expected HTTP error codes', () => {
  for (const code of [400, 401, 403, 404, 405, 408, 429, 500, 502, 503, 504]) {
    assert.ok(ERROR_CODES.includes(code), `missing code ${code}`)
  }
})

test('ERROR_CODES does not contain success codes', () => {
  assert.ok(!ERROR_CODES.includes(200))
  assert.ok(!ERROR_CODES.includes(301))
})

// ── HTML ──────────────────────────────────────────────────────────────────────

test('html pages — all include @avelor/vhost branding', () => {
  for (const page of pages.filter(p => p.file.endsWith('.html'))) {
    assert.ok(page.content.includes('@avelor/vhost'), `${page.file} missing branding`)
  }
})

test('html pages — all include the status code visibly', () => {
  for (const page of pages.filter(p => p.file.endsWith('.html') && p.file !== 'catchall.html')) {
    const code = page.file.replace('.html', '')
    assert.ok(page.content.includes(`>${code}<`), `${page.file} missing visible code`)
  }
})

test('catchall html — shows dash instead of numeric code', () => {
  const p = pages.find(p => p.file === 'catchall.html')
  assert.ok(p.content.includes('>—<'))
  assert.ok(!p.content.includes('>catchall<'))
})

test('html pages — are valid HTML documents', () => {
  for (const page of pages.filter(p => p.file.endsWith('.html'))) {
    assert.ok(page.content.includes('<!DOCTYPE html>'), `${page.file} missing doctype`)
    assert.ok(page.content.includes('<html'), `${page.file} missing html tag`)
    assert.ok(page.content.includes('</html>'), `${page.file} missing closing html tag`)
    assert.ok(page.content.includes('<meta charset="utf-8">'), `${page.file} missing charset`)
  }
})

// ── JSON ──────────────────────────────────────────────────────────────────────

test('json pages — all parse as valid JSON', () => {
  for (const page of pages.filter(p => p.file.endsWith('.json'))) {
    assert.doesNotThrow(
      () => JSON.parse(page.content),
      `${page.file} is not valid JSON`
    )
  }
})

test('json pages — all have code, message and source fields', () => {
  for (const page of pages.filter(p => p.file.endsWith('.json'))) {
    const parsed = JSON.parse(page.content)
    assert.ok('code' in parsed,    `${page.file} missing code`)
    assert.ok('message' in parsed, `${page.file} missing message`)
    assert.ok(typeof parsed.message === 'string' && parsed.message.length > 0)
    assert.equal(parsed.source, '@avelor/vhost', `${page.file} missing source`)
  }
})

test('json pages — numeric codes are numbers, not strings', () => {
  for (const page of pages.filter(p => p.file.endsWith('.json') && p.file !== 'catchall.json')) {
    const parsed = JSON.parse(page.content)
    assert.equal(typeof parsed.code, 'number', `${page.file} code should be number`)
  }
})

test('catchall json — code is string "catchall"', () => {
  const parsed = JSON.parse(pages.find(p => p.file === 'catchall.json').content)
  assert.equal(parsed.code, 'catchall')
  assert.equal(typeof parsed.code, 'string')
})

// ── XML ───────────────────────────────────────────────────────────────────────

test('xml pages — all have XML declaration', () => {
  for (const page of pages.filter(p => p.file.endsWith('.xml'))) {
    assert.ok(page.content.startsWith('<?xml version="1.0"'), `${page.file} missing XML declaration`)
  }
})

test('xml pages — all have error root element with code and message', () => {
  for (const page of pages.filter(p => p.file.endsWith('.xml'))) {
    assert.ok(page.content.includes('<error>'),    `${page.file} missing <error>`)
    assert.ok(page.content.includes('<code>'),     `${page.file} missing <code>`)
    assert.ok(page.content.includes('<message>'),  `${page.file} missing <message>`)
    assert.ok(page.content.includes('</error>'),   `${page.file} missing </error>`)
  }
})

test('xml pages — messages are properly escaped', () => {
  for (const page of pages.filter(p => p.file.endsWith('.xml'))) {
    assert.ok(!page.content.includes(' & '), `${page.file} has unescaped &`)
  }
})

test('xml pages — all include Avelor · vhost comment', () => {
  for (const page of pages.filter(p => p.file.endsWith('.xml'))) {
    assert.ok(page.content.includes('<!-- Avelor · vhost -->'), `${page.file} missing branding comment`)
  }
})

// ── plain text ────────────────────────────────────────────────────────────────

test('txt pages — all include Avelor · vhost signature', () => {
  for (const page of pages.filter(p => p.file.endsWith('.txt'))) {
    assert.ok(page.content.includes('— Avelor · vhost'), `${page.file} missing branding`)
  }
})

test('txt pages — all include the status code', () => {
  for (const page of pages.filter(p => p.file.endsWith('.txt') && p.file !== 'catchall.txt')) {
    const code = page.file.replace('.txt', '')
    assert.ok(page.content.startsWith(code), `${page.file} does not start with code`)
  }
})

test('catchall txt — starts with "catchall"', () => {
  const p = pages.find(p => p.file === 'catchall.txt')
  assert.ok(p.content.startsWith('catchall'))
})
