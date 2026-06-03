import { writeFileSync, mkdirSync } from 'fs'
import { resolve }                  from 'path'
import { loadConfig }               from './config.js'
import { staticVhost, proxyVhost, catchallVhost, errorsConf, securityConf } from './templates.js'
import { generateErrorPages, ERROR_CODES }                    from './error-pages.js'
import {
  a2ensite, a2enconf, configtest, reload,
  checkModules, checkSnakeoil,
  enabledSites, confEnabled,
  SITES_AVAILABLE, CONF_AVAILABLE, ERRORS_DIR,
} from './apache.js'
import { ok, fail, dim } from './format.js'

export function apply(args) {
  if (process.getuid?.() !== 0) {
    console.error('vhost: apply requires sudo — run: sudo vhost apply')
    process.exit(1)
  }

  const target = args.find(a => !a.startsWith('-'))

  let config
  try {
    config = loadConfig()
  } catch (err) {
    console.error(`vhost: ${err.message}`)
    process.exit(1)
  }

  const sites = target
    ? filterSite(config.sites, target)
    : config.sites

  if (target) {
    const active = new Set(enabledSites())
    if (!active.has('000-catchall') || !confEnabled('vhost-errors')) {
      console.log('')
      console.log('  warning: infrastructure not configured — run "sudo vhost apply" (no domain) first')
      console.log('           catch-all and error pages won\'t protect this server')
    }
  }

  // Verify required Apache modules before writing anything
  const requiredModules = ['rewrite', 'ssl', 'headers']
  const hasProxy = Object.values(sites).some(s => s.mode === 'proxy')
  if (hasProxy) requiredModules.push('proxy', 'proxy_http')

  try {
    checkModules(requiredModules)
  } catch (err) {
    console.error(`vhost: ${err.message}`)
    process.exit(1)
  }

  console.log('')

  // Error pages + catch-all + global conf (only on full apply)
  if (!target) {
    try {
      checkSnakeoil()
    } catch (err) {
      console.error(`vhost: ${err.message}`)
      process.exit(1)
    }

    step('error pages', () => {
      mkdirSync(ERRORS_DIR, { recursive: true })
      for (const { file, content } of generateErrorPages()) {
        writeFileSync(resolve(ERRORS_DIR, file), content, 'utf8')
      }
    }, dim(ERRORS_DIR))

    step('catch-all', () => {
      writeFileSync(
        resolve(SITES_AVAILABLE, '000-catchall.conf'),
        catchallVhost(ERRORS_DIR),
        'utf8'
      )
      a2ensite('000-catchall')
    }, dim('000-catchall.conf'))

    step('errors conf', () => {
      writeFileSync(
        resolve(CONF_AVAILABLE, 'vhost-errors.conf'),
        errorsConf(ERRORS_DIR, ERROR_CODES),
        'utf8'
      )
      a2enconf('vhost-errors')
    }, dim('vhost-errors.conf'))

    step('security conf', () => {
      writeFileSync(
        resolve(CONF_AVAILABLE, 'vhost-security.conf'),
        securityConf(),
        'utf8'
      )
      a2enconf('vhost-security')
    }, dim('vhost-security.conf'))

    console.log('')
  }

  // Site configs
  for (const [domain, cfg] of Object.entries(sites)) {
    const detail = cfg.mode === 'proxy' ? `:${cfg.port}` : cfg.root
    step(domain, () => {
      const content = cfg.mode === 'proxy'
        ? proxyVhost(domain, cfg)
        : staticVhost(domain, cfg)
      writeFileSync(resolve(SITES_AVAILABLE, `${domain}.conf`), content, 'utf8')
      a2ensite(domain)
    }, dim(detail))
  }

  // Validate + reload
  console.log('')
  step('apache configtest', () => configtest())
  step('apache reload',     () => reload())
  console.log('')
}

export function filterSite(sites, target) {
  if (!sites[target]) {
    console.error(`vhost: "${target}" not found in sites.yml`)
    process.exit(1)
  }
  return { [target]: sites[target] }
}

function step(label, fn, suffix = '') {
  try {
    fn()
    console.log(ok(`${label}${suffix ? '   ' + suffix : ''}`))
  } catch (err) {
    console.error(fail(`${label}   ${err.message}`))
    process.exit(1)
  }
}
