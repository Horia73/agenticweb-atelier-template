import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { once } from 'node:events'
import { build } from 'esbuild'
import { chromium } from 'playwright-core'
import { browserExecutable } from '../scripts/browser-executable.mjs'

test('multi-step lead validates, preserves answers, prevents concurrent submits and retries the same request', { timeout: 45_000 }, async () => {
  const bundle = await build({ entryPoints: ['tests/lead-form.fixture.tsx'], bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_AWOS_URL': '"https://os.example.test"',
    'process.env.NEXT_PUBLIC_AWOS_SITE_KEY': '"qa-site-key"',
  } })
  const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/fixture.js' ? 'application/javascript' : 'text/html')
    response.end(request.url === '/fixture.js' ? bundle.outputFiles[0].text : '<!doctype html><html lang="ro"><title>QA</title><div id="root"></div><script src="/fixture.js"></script></html>')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  let browser
  try {
    browser = await chromium.launch({ executablePath: browserExecutable(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const page = await browser.newPage()
    page.setDefaultTimeout(5000)
    const browserErrors: string[] = []
    page.on('pageerror', error => browserErrors.push(error.message))
    const submissions: { externalId: string; name: string; email: string; channel: string }[] = []
    await page.route('https://os.example.test/**', async route => {
      submissions.push(route.request().postDataJSON())
      await new Promise(resolve => setTimeout(resolve, 150))
      await route.fulfill({ status: submissions.length === 1 ? 503 : 200, contentType: 'application/json', body: '{}' })
    })
    await page.goto(`http://127.0.0.1:${address.port}`)
    await page.getByRole('button', { name: 'Continuă' }).click()
    assert.equal(await page.getByRole('textbox', { name: 'Nume', exact: true }).getAttribute('aria-invalid'), 'true')
    await page.getByRole('textbox', { name: 'Nume', exact: true }).fill('Client QA')
    await page.getByRole('button', { name: 'Continuă' }).click()
    await page.getByRole('button', { name: 'Înapoi' }).click()
    assert.equal(await page.getByRole('textbox', { name: 'Nume', exact: true }).inputValue(), 'Client QA')
    await page.getByRole('button', { name: 'Continuă' }).click()
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('qa@example.test')
    await page.locator('form').evaluate(form => { (form as HTMLFormElement).requestSubmit(); (form as HTMLFormElement).requestSubmit() })
    await page.getByText('Nu am putut trimite cererea. Încearcă din nou.').waitFor()
    assert.equal(submissions.length, 1)
    await page.getByRole('button', { name: 'Trimite cererea' }).click()
    await page.getByText('Cerere trimisă', { exact: true }).waitFor()
    assert.deepEqual(browserErrors, [])
    assert.equal(submissions.length, 2)
    assert.match(submissions[0].externalId, /^form_/)
    assert.equal(submissions[0].externalId, submissions[1].externalId)
    assert.equal(submissions[1].name, 'Client QA')
    assert.equal(submissions[1].channel, 'form:qa')
    assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] })
  } finally {
    await browser?.close()
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})
