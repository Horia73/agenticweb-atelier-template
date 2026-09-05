import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { launch } from 'chrome-launcher'
import { browserExecutable } from './browser-executable.mjs'

const mode = process.argv[2]
if (!['accessibility', 'performance'].includes(mode)) throw new Error('Expected accessibility or performance')
const configuration = JSON.parse(fs.readFileSync('studio.audit.json', 'utf8'))
if (!configuration.routes?.length || !configuration.viewports?.length) throw new Error('Audit scope cannot be empty')
if (configuration.routes.some(route => typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//'))) throw new Error('Audit routes must be local paths')
const output = path.resolve('artifacts/validation')
fs.mkdirSync(output, { recursive: true })
const distDir = '.next-studio-audit'
const ignored = new Set(['node_modules', '.git', 'artifacts', 'coverage', 'next-env.d.ts'])
function fingerprint(directory = '.', hash = createHash('sha256')) {
  for (const file of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignored.has(file.name) || file.name.startsWith('.next') || file.name.endsWith('.tsbuildinfo')) continue
    const name = path.join(directory, file.name)
    if (file.isDirectory()) fingerprint(name, hash)
    else if (file.isFile()) hash.update(name).update('\0').update(fs.readFileSync(name)).update('\0')
  }
  return hash
}
const source = fingerprint().digest('hex')
const stamp = path.join(distDir, '.audit-source')
const next = path.resolve('node_modules/next/dist/bin/next')
const env = { ...process.env, NODE_ENV: 'production', NEXT_DIST_DIR: distDir, NEXT_TELEMETRY_DISABLED: '1' }
let child
let browser
let chrome
const stop = () => { if (child && child.exitCode === null) child.kill('SIGTERM') }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
try {
  if (!fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf8') !== source || !fs.existsSync(path.join(distDir, 'BUILD_ID'))) {
    child = spawn(process.execPath, [next, 'build', '--webpack'], { env, stdio: 'inherit' })
    const [code] = await once(child, 'exit')
    if (code !== 0) throw new Error('Audit production build failed: ' + code)
    if (fingerprint().digest('hex') !== source) throw new Error('Source changed during audit build; rerun on the final source')
    fs.writeFileSync(stamp, source)
  }
  const reservation = net.createServer()
  reservation.listen(0, '127.0.0.1')
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  const origin = `http://127.0.0.1:${port}`
  child = spawn(process.execPath, [next, 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverLog = ''
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { serverLog = (serverLog + data).slice(-8000) })
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error(serverLog)
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok } catch { /* startup */ }
    if (ready) break
    await delay(500)
  }
  if (!ready) throw new Error('Audit server did not become healthy: ' + serverLog)
  const executablePath = browserExecutable()
  const results = []
  let failed = false
  if (mode === 'accessibility') {
    browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    for (const route of configuration.routes) {
      for (const width of configuration.viewports) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        const response = await page.goto(origin + route, { waitUntil: 'networkidle' })
        if (!response?.ok()) throw new Error(`Route ${route}: HTTP ${response?.status()}`)
        await page.addScriptTag({ path: path.resolve('node_modules/axe-core/axe.min.js') })
        const evidence = await page.evaluate(async () => {
          const axe = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
          return { violations: axe.violations, incomplete: axe.incomplete, horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, h1Count: document.querySelectorAll('h1').length }
        })
        const screenshot = `accessibility-${results.length}-${width}.png`
        await page.screenshot({ path: path.join(output, screenshot), fullPage: true })
        const blockers = evidence.violations.filter(v => ['serious', 'critical'].includes(v.impact))
        failed ||= blockers.length > 0 || errors.length > 0 || evidence.horizontalOverflow || evidence.h1Count !== 1
        results.push({ route, width, ...evidence, errors, screenshot })
        await page.close()
      }
    }
  } else {
    chrome = await launch({ chromePath: executablePath, chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'], handleSIGINT: false })
    for (const route of configuration.routes) {
      for (const profile of ['mobile', 'desktop']) {
        const result = await lighthouse(origin + route, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'], }, profile === 'desktop' ? desktopConfig : undefined)
        if (!result || result.lhr.runtimeError) throw new Error('Lighthouse could not measure: ' + JSON.stringify(result?.lhr.runtimeError))
        const file = `lighthouse-${results.length}-${profile}.json`
        fs.writeFileSync(path.join(output, file), JSON.stringify(result.lhr))
        results.push({ route, profile, score: result.lhr.categories.performance.score, lcpMs: result.lhr.audits['largest-contentful-paint'].numericValue, cls: result.lhr.audits['cumulative-layout-shift'].numericValue, tbtMs: result.lhr.audits['total-blocking-time'].numericValue, report: file })
      }
    }
  }
  if (fingerprint().digest('hex') !== source) throw new Error('Source changed during audit')
  fs.writeFileSync(path.join(output, mode + '.json'), JSON.stringify({ source, at: new Date().toISOString(), mode, results }, null, 2))
  console.log(JSON.stringify(results.map(row => ({ route: row.route, width: row.width, profile: row.profile, score: row.score, errors: row.errors, violations: row.violations?.map(v => ({ id: v.id, impact: v.impact })), horizontalOverflow: row.horizontalOverflow }))))
  if (failed) throw new Error('Accessibility or functional audit failed; see artifacts/validation/accessibility.json')
} finally {
  await Promise.allSettled([browser?.close(), chrome?.kill()])
  stop()
  if (child && child.exitCode === null) {
    await Promise.race([once(child, 'exit'), delay(5000)])
    if (child.exitCode === null) child.kill('SIGKILL')
  }
}
