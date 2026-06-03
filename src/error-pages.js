const CODES = {
  400: 'Bad request.',
  401: 'Authentication required.',
  403: 'Access denied.',
  404: 'Page not found.',
  405: 'Method not allowed.',
  408: 'Request timeout.',
  429: 'Too many requests.',
  500: 'Internal server error.',
  502: 'Bad gateway.',
  503: 'Service unavailable.',
  504: 'Gateway timeout.',
}

const CATCHALL_MESSAGE = 'This domain is not configured.'

function htmlPage(code, message) {
  const label = code === 'catchall' ? '—' : String(code)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${label}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Georgia, 'Times New Roman', serif;
      background: #fff;
      color: #111;
      border-top: 3px solid #111;
    }
    .code {
      font-size: clamp(5rem, 18vw, 9rem);
      font-weight: 400;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .message {
      margin-top: 1.25rem;
      font-size: 0.875rem;
      color: #aaa;
      letter-spacing: 0.01em;
    }
    footer {
      position: fixed;
      bottom: 1.75rem;
      left: 0; right: 0;
      text-align: center;
      font-size: 0.7rem;
      color: #999;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  </style>
</head>
<body>
  <span class="code">${label}</span>
  <p class="message">${message}</p>
  <footer>@avelor/vhost</footer>
</body>
</html>
`
}

function jsonPage(code, message) {
  const c = code === 'catchall' ? 'catchall' : code
  return JSON.stringify({ code: c, message, source: '@avelor/vhost' }, null, 2) + '\n'
}

function textPage(code, message) {
  const label = code === 'catchall' ? 'catchall' : String(code)
  return `${label} ${message}\n\n— Avelor · vhost\n`
}

function xmlPage(code, message) {
  const c   = code === 'catchall' ? 'catchall' : String(code)
  const msg = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <code>${c}</code>
  <message>${msg}</message>
</error>
<!-- Avelor · vhost -->
`
}

export function generateErrorPages() {
  const pages = []

  for (const [code, message] of Object.entries(CODES)) {
    const n = Number(code)
    pages.push({ file: `${code}.html`, content: htmlPage(n, message) })
    pages.push({ file: `${code}.json`, content: jsonPage(n, message) })
    pages.push({ file: `${code}.xml`,  content: xmlPage(n, message) })
    pages.push({ file: `${code}.txt`,  content: textPage(n, message) })
  }

  pages.push({ file: 'catchall.html', content: htmlPage('catchall', CATCHALL_MESSAGE) })
  pages.push({ file: 'catchall.json', content: jsonPage('catchall', CATCHALL_MESSAGE) })
  pages.push({ file: 'catchall.xml',  content: xmlPage('catchall', CATCHALL_MESSAGE) })
  pages.push({ file: 'catchall.txt',  content: textPage('catchall', CATCHALL_MESSAGE) })

  return pages
}

export const ERROR_CODES = Object.keys(CODES).map(Number)
