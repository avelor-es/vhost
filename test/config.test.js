import { test }                        from 'node:test'
import assert                          from 'node:assert/strict'
import { writeFileSync, mkdirSync }    from 'fs'
import { join }                        from 'path'
import { tmpdir }                      from 'os'
import { loadConfig, isValidDomain }   from '../src/config.js'

const tmp = join(tmpdir(), 'avelor-vhost-test')
mkdirSync(tmp, { recursive: true })

let counter = 0
function yml(content) {
  const path = join(tmp, `sites-${counter++}.yml`)
  writeFileSync(path, content, 'utf8')
  return path
}

// ── Static sites ──────────────────────────────────────────────────────────────

test('parses a static site with required fields', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
`))
  assert.equal(sites['example.com'].mode, 'static')
  assert.equal(sites['example.com'].root, '/var/www/example')
})

test('static site defaults — aliases empty, ssl null', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
`))
  assert.deepEqual(sites['example.com'].aliases, [])
  assert.equal(sites['example.com'].ssl, null)
})

test('static site — parses aliases array', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
    aliases: [www.example.com, old.example.com]
`))
  assert.deepEqual(sites['example.com'].aliases, ['www.example.com', 'old.example.com'])
})

test('static site — no php field in parsed output', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
`))
  assert.ok(!('php' in sites['example.com']))
})

test('static site — parses manual SSL config', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
    ssl:
      cert: /etc/ssl/cert.pem
      key: /etc/ssl/key.pem
`))
  assert.equal(sites['example.com'].ssl.cert, '/etc/ssl/cert.pem')
  assert.equal(sites['example.com'].ssl.key,  '/etc/ssl/key.pem')
})

// ── Proxy sites ───────────────────────────────────────────────────────────────

test('parses a proxy site with required fields', () => {
  const { sites } = loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
    port: 3000
`))
  assert.equal(sites['api.example.com'].mode, 'proxy')
  assert.equal(sites['api.example.com'].port, 3000)
})

test('proxy site defaults — aliases empty, ssl null', () => {
  const { sites } = loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
    port: 3000
`))
  assert.deepEqual(sites['api.example.com'].aliases, [])
  assert.equal(sites['api.example.com'].ssl, null)
})

// ── Multiple sites ────────────────────────────────────────────────────────────

test('parses multiple sites in a single file', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
  api.example.com:
    mode: proxy
    port: 4000
`))
  assert.equal(Object.keys(sites).length, 2)
  assert.equal(sites['example.com'].mode, 'static')
  assert.equal(sites['api.example.com'].mode, 'proxy')
})

// ── Error cases ───────────────────────────────────────────────────────────────

test('throws if file does not exist', () => {
  assert.throws(
    () => loadConfig('/nonexistent/path/sites.yml'),
    /sites\.yml not found/
  )
})

test('throws if no sites key', () => {
  assert.throws(() => loadConfig(yml('foo: bar\n')), /must have a "sites" key/)
})

test('throws if sites is not an object', () => {
  assert.throws(() => loadConfig(yml('sites: "hello"\n')), /must have a "sites" key/)
})

test('throws if proxy site missing port', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
`)),
    /requires "port"/
  )
})

test('throws if static site missing root', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  example.com:
    mode: static
`)),
    /requires "root"/
  )
})

test('returns the config file path', () => {
  const path = yml(`
sites:
  example.com:
    mode: static
    root: /var/www
`)
  const { path: returned } = loadConfig(path)
  assert.equal(returned, path)
})

// ── Domain validation ─────────────────────────────────────────────────────────

test('isValidDomain — accepts simple domain', () => {
  assert.ok(isValidDomain('example.com'))
})

test('isValidDomain — accepts subdomain', () => {
  assert.ok(isValidDomain('api.example.com'))
})

test('isValidDomain — accepts multi-level subdomain', () => {
  assert.ok(isValidDomain('a.b.example.com'))
})

test('isValidDomain — rejects domain with no dot', () => {
  assert.ok(!isValidDomain('localhost'))
})

test('isValidDomain — rejects empty string', () => {
  assert.ok(!isValidDomain(''))
})

test('isValidDomain — rejects domain with spaces', () => {
  assert.ok(!isValidDomain('my domain.com'))
})

test('isValidDomain — rejects domain with slash', () => {
  assert.ok(!isValidDomain('example.com/path'))
})

test('parseSites — throws on invalid domain name', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  not a domain:
    mode: static
    root: /var/www
`)),
    /invalid domain name/
  )
})

// ── Port validation ───────────────────────────────────────────────────────────

test('parseSites — throws on port 0', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
    port: 0
`)),
    /port must be between 1 and 65535/
  )
})

test('parseSites — throws on port above 65535', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
    port: 99999
`)),
    /port must be between 1 and 65535/
  )
})

test('parseSites — accepts port 1', () => {
  const { sites } = loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
    port: 1
`))
  assert.equal(sites['api.example.com'].port, 1)
})

test('parseSites — accepts port 65535', () => {
  const { sites } = loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
    port: 65535
`))
  assert.equal(sites['api.example.com'].port, 65535)
})

test('parseSites — coerces string port to number', () => {
  const { sites } = loadConfig(yml(`
sites:
  api.example.com:
    mode: proxy
    port: "3000"
`))
  assert.equal(sites['api.example.com'].port, 3000)
  assert.equal(typeof sites['api.example.com'].port, 'number')
})

// ── Alias validation ──────────────────────────────────────────────────────────

test('parseSites — accepts valid aliases', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
    aliases: [www.example.com, old.example.com]
`))
  assert.deepEqual(sites['example.com'].aliases, ['www.example.com', 'old.example.com'])
})

test('parseSites — throws on invalid alias domain', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
    aliases: [not a domain]
`)),
    /invalid alias/
  )
})

test('parseSites — throws when aliases is not an array', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
    aliases: www.example.com
`)),
    /aliases must be an array/
  )
})

test('parseSites — accepts empty aliases array', () => {
  const { sites } = loadConfig(yml(`
sites:
  example.com:
    mode: static
    root: /var/www/example
    aliases: []
`))
  assert.deepEqual(sites['example.com'].aliases, [])
})

test('parseSites — throws on alias with invalid characters', () => {
  assert.throws(
    () => loadConfig(yml(`
sites:
  example.com:
    mode: proxy
    port: 3000
    aliases: ["bad alias!"]
`)),
    /invalid alias/
  )
})
