import { createInterface }           from 'readline'
import { readFileSync, existsSync }  from 'fs'
import { resolve }                   from 'path'
import yaml                          from 'js-yaml'
import { isValidDomain, saveConfig } from './config.js'

export function parseAliases(str) {
  if (!str) return []
  return str.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
}

export async function newSite(args) {
  const domainArg   = args.find(a => !a.startsWith('-'))
  const modeFlag    = flag(args, '--mode')
  const portFlag    = flag(args, '--port')
  const rootFlag    = flag(args, '--root')
  const aliasesFlag = flag(args, '--aliases')

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ask = q => new Promise(res => rl.question(q, res))

  console.log('')

  const domain = domainArg ?? (await ask('  Domain: ')).trim()
  if (!domain) { rl.close(); die('domain is required') }
  if (!isValidDomain(domain)) { rl.close(); die(`"${domain}": invalid domain name`) }

  const sitesPath = resolve(process.cwd(), 'sites.yml')
  const existing  = existsSync(sitesPath) ? (yaml.load(readFileSync(sitesPath, 'utf8')) ?? {}) : {}

  if (existing.sites?.[domain]) {
    const overwrite = await yesno(ask, `"${domain}" already exists in sites.yml. Overwrite?`, false)
    if (!overwrite) { rl.close(); console.log('  aborted.\n'); process.exit(0) }
  }

  let aliases
  if (aliasesFlag !== null) {
    aliases = parseAliases(aliasesFlag)
  } else {
    const aliasesRaw = (await ask('  Aliases (comma or space-separated, optional): ')).trim()
    aliases = parseAliases(aliasesRaw)
  }

  for (const a of aliases) {
    if (!isValidDomain(a)) { rl.close(); die(`"${a}": invalid alias domain name`) }
  }

  const mode = modeFlag ?? await pickMode(rl, ask)

  let root, port
  if (mode === 'static') {
    root = rootFlag ?? (await ask('  Document root: ')).trim()
    if (!root) { rl.close(); die('root is required for static mode') }
  } else {
    const raw = portFlag ?? (await ask('  Proxy port: ')).trim()
    port = parseInt(raw, 10)
    if (!port || port < 1 || port > 65535) { rl.close(); die('port must be between 1 and 65535') }
  }

  const certbot = await yesno(ask, 'SSL via certbot?', true)
  let ssl = null
  if (!certbot) {
    const cert = (await ask('  SSL cert path: ')).trim()
    const key  = (await ask('  SSL key path: ')).trim()
    ssl = { cert, key }
  }

  rl.close()

  // Build entry
  const entry = mode === 'static'
    ? { mode: 'static', root, ...(aliases.length && { aliases }), ...(ssl && { ssl }) }
    : { mode: 'proxy',  port, ...(aliases.length && { aliases }), ...(ssl && { ssl }) }

  // Persist to sites.yml
  saveConfig(sitesPath, { ...(existing.sites ?? {}), [domain]: entry })

  const allDomains = [domain, ...aliases].map(d => `-d ${d}`).join(' ')

  console.log('')
  console.log(`  \x1b[32m✓\x1b[0m  ${domain} added to sites.yml`)
  console.log('')
  console.log('  Next steps:')
  console.log(`    sudo vhost apply ${domain}`)
  if (certbot) console.log(`    sudo certbot --apache ${allDomains}`)
  console.log('')
}

async function pickMode(rl, ask) {
  while (true) {
    const a = (await ask('  Mode: [1] static  [2] proxy → ')).trim()
    if (a === '1' || a === 'static') return 'static'
    if (a === '2' || a === 'proxy')  return 'proxy'
    if (!a) return 'static'
  }
}

async function yesno(ask, question, defaultYes) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]'
  const a    = (await ask(`  ${question} ${hint}: `)).trim().toLowerCase()
  if (!a) return defaultYes
  return a.startsWith('y')
}

function flag(args, name) {
  const i = args.indexOf(name)
  return i !== -1 ? args[i + 1] : null
}

function die(msg) {
  console.error(`vhost: ${msg}`)
  process.exit(1)
}
