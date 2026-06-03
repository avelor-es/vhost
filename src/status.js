import { loadConfig } from './config.js'
import { enabledSites, confEnabled } from './apache.js'
import { ok, warn, fail, dim } from './format.js'

export function status() {
  let config
  try {
    config = loadConfig()
  } catch (err) {
    console.error(`vhost: ${err.message}`)
    process.exit(1)
  }

  const enabled = new Set(enabledSites())
  const { sites } = config
  const pad = Math.max(...Object.keys(sites).map(d => d.length), 9)

  console.log('')

  const catchallOk = enabled.has('000-catchall') && confEnabled('vhost-errors')
  if (catchallOk) {
    console.log(ok(`${'catch-all'.padEnd(pad)}   ${dim('protected')}`))
  } else {
    console.log(fail(`${'catch-all'.padEnd(pad)}   not configured`))
  }

  console.log('')

  for (const [domain, cfg] of Object.entries(sites)) {
    const detail  = cfg.mode === 'proxy' ? `proxy → :${cfg.port}` : `static ${cfg.root}`
    const aliases = cfg.aliases.length ? `   ${dim(cfg.aliases.join(', '))}` : ''
    if (enabled.has(domain)) {
      console.log(ok(`${domain.padEnd(pad)}   ${dim(detail)}${aliases}`))
    } else {
      console.log(warn(`${domain.padEnd(pad)}   ${dim('not applied')}   ${dim(detail)}${aliases}`))
    }
  }

  console.log('')
}
