import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve }                                  from 'path'
import yaml                                         from 'js-yaml'

export function isValidDomain(d) {
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(d)
}

export function loadConfig(configPath = null) {
  const path = configPath ?? resolve(process.cwd(), 'sites.yml')

  if (!existsSync(path)) {
    throw new Error(`sites.yml not found — run: vhost init`)
  }

  const raw = yaml.load(readFileSync(path, 'utf8'))

  if (!raw?.sites || typeof raw.sites !== 'object') {
    throw new Error('sites.yml must have a "sites" key')
  }

  return { path, sites: parseSites(raw.sites) }
}

export function saveConfig(configPath, sites) {
  const existing = existsSync(configPath)
    ? yaml.load(readFileSync(configPath, 'utf8')) ?? {}
    : {}
  existing.sites = sites
  writeFileSync(configPath, yaml.dump(existing, { lineWidth: 120 }), 'utf8')
}

function parseSites(raw) {
  const sites = {}
  for (const [domain, cfg] of Object.entries(raw)) {
    if (!cfg || typeof cfg !== 'object') throw new Error(`${domain}: invalid configuration`)
    if (!isValidDomain(domain)) throw new Error(`"${domain}": invalid domain name`)

    const aliases = parseAliases(cfg.aliases, domain)

    if (cfg.mode === 'proxy') {
      if (cfg.port == null) throw new Error(`${domain}: proxy mode requires "port"`)
      const port = Number(cfg.port)
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`${domain}: port must be between 1 and 65535`)
      }
      sites[domain] = { mode: 'proxy', port, aliases, ssl: cfg.ssl ?? null }
    } else {
      if (!cfg.root) throw new Error(`${domain}: static mode requires "root"`)
      sites[domain] = { mode: 'static', root: cfg.root, aliases, ssl: cfg.ssl ?? null }
    }
  }
  return sites
}

function parseAliases(raw, domain) {
  if (raw == null) return []
  if (!Array.isArray(raw)) throw new Error(`${domain}: aliases must be an array`)
  for (const a of raw) {
    if (!isValidDomain(String(a))) throw new Error(`${domain}: invalid alias "${a}"`)
  }
  return raw
}
