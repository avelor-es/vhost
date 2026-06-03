import { test }         from 'node:test'
import assert           from 'node:assert/strict'
import { filterSite }   from '../src/apply.js'

const SITES = {
  'example.com': { mode: 'static', root: '/var/www/example', aliases: [], ssl: null },
  'api.example.com': { mode: 'proxy', port: 3000, aliases: [], ssl: null },
}

test('filterSite — returns a single-entry object for the matching domain', () => {
  const result = filterSite(SITES, 'example.com')
  assert.deepEqual(result, { 'example.com': SITES['example.com'] })
})

test('filterSite — works for proxy sites', () => {
  const result = filterSite(SITES, 'api.example.com')
  assert.deepEqual(result, { 'api.example.com': SITES['api.example.com'] })
})

test('filterSite — does not include other sites in the result', () => {
  const result = filterSite(SITES, 'example.com')
  assert.ok(!('api.example.com' in result))
})

test('filterSite — calls process.exit(1) when domain is not in config', () => {
  const exits = []
  const orig = process.exit
  process.exit = code => exits.push(code)
  filterSite(SITES, 'missing.com')
  process.exit = orig
  assert.deepEqual(exits, [1])
})
