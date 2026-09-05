import fs from 'node:fs'
export function browserExecutable() {
  const candidates = [process.env.CHROME_PATH, process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean)
  const found = candidates.find(file => fs.existsSync(file))
  if (!found) throw new Error('Chromium is required for browser checks. Set CHROME_PATH to an installed executable.')
  return found
}
