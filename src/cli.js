import { createRequire } from 'module'

export async function run(argv) {
  const cmd = argv.find(a => !a.startsWith('-'))

  if (argv.includes('--version') || argv.includes('-v')) {
    const { version } = createRequire(import.meta.url)('../package.json')
    console.log(version)
    process.exit(0)
  }

  if (!cmd || cmd === 'help' || argv.includes('--help') || argv.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  const args = argv.filter(a => a !== cmd)

  switch (cmd) {
    case 'init': {
      const { init } = await import('./init.js')
      init()
      break
    }
    case 'new': {
      const { newSite } = await import('./new-site.js')
      await newSite(args)
      break
    }
    case 'apply': {
      const { apply } = await import('./apply.js')
      apply(args)
      break
    }
    case 'check': {
      const { check } = await import('./check.js')
      check()
      break
    }
    case 'status': {
      const { status } = await import('./status.js')
      status()
      break
    }
    case 'remove': {
      const { remove } = await import('./remove.js')
      await remove(args)
      break
    }
    default:
      console.error(`vhost: unknown command "${cmd}"`)
      console.error('       run vhost --help for usage')
      process.exit(1)
  }
}

function printHelp() {
  console.log(`
  @avelor/vhost — Apache virtual host manager

  Usage
    vhost <command> [options]

  Commands
    init                      create sites.yml in current directory
    new [domain] [flags]      add a site (interactive when flags are omitted)
    apply [domain]            generate configs, enable sites, reload Apache
    remove <domain>           disable and remove a site
    check                     diff sites.yml vs Apache state
    status                    show enabled sites

  Flags for "new"
    --mode <static|proxy>     site mode
    --port <n>                upstream port (proxy mode)
    --root <path>             document root (static mode)
    --aliases <a,b,...>       comma-separated aliases

  Flags for "remove"
    -y, --yes                 skip confirmation prompt

  Global
    -v, --version
    -h, --help

  Examples
    vhost init
    vhost new
    vhost new api.example.com --mode proxy --port 3000
    vhost new blog.example.com --mode static --root /var/www/blog
    sudo vhost apply
    sudo vhost apply example.com
    sudo vhost remove example.com
    vhost check
    vhost status
  `)
}
