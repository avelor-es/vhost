import { writeFileSync, existsSync } from 'fs'
import { resolve }                   from 'path'

const TEMPLATE = `sites:
  example.com:
    aliases: [www.example.com]
    mode: static
    root: /var/www/example.com

  # api.example.com:
  #   mode: proxy
  #   port: 3000
`

export function init(cwd = process.cwd()) {
  const path = resolve(cwd, 'sites.yml')

  if (existsSync(path)) {
    console.error('vhost: sites.yml already exists')
    process.exit(1)
  }

  writeFileSync(path, TEMPLATE, 'utf8')
  console.log('vhost: created sites.yml')
  console.log('      edit your sites and run: sudo vhost apply')
}
