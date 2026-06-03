import { createInterface }                             from 'readline'
import { existsSync, readFileSync, unlinkSync }         from 'fs'
import { resolve }                                      from 'path'
import yaml                                             from 'js-yaml'
import { loadConfig, saveConfig }                       from './config.js'
import { a2dissite, reload, enabledSites, SITES_AVAILABLE } from './apache.js'
import { ok, warn, fail }                               from './format.js'
import { isManaged }                                    from './check.js'

export async function remove(args) {
  const domain = args.find(a => !a.startsWith('-'))

  if (!domain) {
    console.error('vhost: domain required — run: vhost remove <domain>')
    process.exit(1)
  }

  if (process.getuid?.() !== 0) {
    console.error('vhost: remove requires sudo — run: sudo vhost remove <domain>')
    process.exit(1)
  }

  let config
  try {
    config = loadConfig()
  } catch (err) {
    console.error(`vhost: ${err.message}`)
    process.exit(1)
  }

  const confPath   = resolve(SITES_AVAILABLE, `${domain}.conf`)
  const inYaml     = domain in config.sites
  const isEnabled  = new Set(enabledSites()).has(domain)
  const confExists = existsSync(confPath)
  const managed    = isManaged(confPath)

  if (!inYaml && !confExists) {
    console.error(`vhost: "${domain}" not found in sites.yml or Apache`)
    process.exit(1)
  }

  const yes = args.includes('--yes') || args.includes('-y')
  if (!yes) {
    const actions = [
      isEnabled              && 'disable site',
      confExists && managed  && 'remove conf',
      inYaml                 && 'remove from sites.yml',
    ].filter(Boolean).join(', ')

    console.log('')
    const rl  = createInterface({ input: process.stdin, output: process.stdout })
    const ans = await new Promise(res => rl.question(`  ${domain}   ${actions}\n  Continue? [y/N]: `, res))
    rl.close()
    if (!ans.trim().toLowerCase().startsWith('y')) {
      console.log('  aborted.\n')
      process.exit(0)
    }
  }

  let needsReload = false
  console.log('')

  if (isEnabled) {
    step(`disable ${domain}`, () => a2dissite(domain))
    needsReload = true
  }

  if (confExists && managed) {
    step(`remove ${domain}.conf`, () => unlinkSync(confPath))
  } else if (confExists && !managed) {
    console.log(warn(`${domain}.conf   manual config — left untouched`))
  }

  if (inYaml) {
    step('remove from sites.yml', () => {
      const raw = yaml.load(readFileSync(config.path, 'utf8')) ?? {}
      delete raw.sites?.[domain]
      saveConfig(config.path, raw.sites ?? {})
    })
  }

  if (needsReload) {
    step('apache reload', () => reload())
  }

  console.log('')
}

function step(label, fn) {
  try {
    fn()
    console.log(ok(label))
  } catch (err) {
    console.error(fail(`${label}   ${err.message}`))
    process.exit(1)
  }
}
