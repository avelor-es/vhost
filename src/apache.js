import { spawnSync }                      from 'child_process'
import { existsSync, readdirSync }         from 'fs'

export const SITES_AVAILABLE = '/etc/apache2/sites-available'
export const SITES_ENABLED   = '/etc/apache2/sites-enabled'
export const CONF_AVAILABLE  = '/etc/apache2/conf-available'
export const CONF_ENABLED    = '/etc/apache2/conf-enabled'
export const ERRORS_DIR      = '/var/www/vhost-errors'

export const SNAKEOIL_CERT = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
export const SNAKEOIL_KEY  = '/etc/ssl/private/ssl-cert-snakeoil.key'

export function checkModules(names, dir = '/etc/apache2/mods-enabled') {
  if (!existsSync(dir)) return
  const missing = names.filter(n => !existsSync(`${dir}/${n}.load`))
  if (missing.length) {
    throw new Error(
      `Apache modules not enabled: ${missing.join(', ')}\n` +
      `       run: sudo a2enmod ${missing.join(' ')}`
    )
  }
}

export function checkSnakeoil() {
  if (!existsSync(SNAKEOIL_CERT) || !existsSync(SNAKEOIL_KEY)) {
    throw new Error(
      'snakeoil certificates not found\n' +
      '       run: sudo apt install ssl-cert'
    )
  }
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' })
  if (r.error?.code === 'ENOENT') throw new Error(`${cmd} not found — is Apache2 installed?`)
  if (r.status !== 0) throw new Error((r.stderr || r.stdout).trim())
  return r.stdout
}

export const a2ensite  = name => run('a2ensite',  [name])
export const a2dissite = name => run('a2dissite', [name])
export const a2enconf  = name => run('a2enconf',  [name])
export const configtest = ()  => run('apache2ctl', ['configtest'])
export const reload     = ()  => run('apache2ctl', ['graceful'])

export function enabledSites() {
  if (!existsSync(SITES_ENABLED)) return []
  return readdirSync(SITES_ENABLED)
    .filter(f => f.endsWith('.conf'))
    .map(f => f.replace(/\.conf$/, ''))
}

export function confEnabled(name) {
  return existsSync(`${CONF_ENABLED}/${name}.conf`)
}
