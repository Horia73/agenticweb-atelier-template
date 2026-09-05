import test from 'node:test'
import assert from 'node:assert/strict'

process.env.NEXT_PUBLIC_AWOS_SITE_KEY = 'test-site-key'
process.env.NEXT_PUBLIC_AWOS_URL = 'https://os.example.test'

test('lead preserves commercial semantics, retry identity and abort signal without browser storage', async () => {
  const { awosLead, awosEmbedUrl } = await import('../src/lib/awos')
  const originalFetch = globalThis.fetch
  const controller = new AbortController()
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location')
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { pathname: '/contact' } })
  try {
    let payload: Record<string, unknown> = {}
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://os.example.test/api/embed/v1/lead')
      assert.equal(init?.signal, controller.signal)
      payload = JSON.parse(String(init?.body))
      return new Response('{}', { status: 200 })
    }
    const fields = [{ key: 'total', value: 1200, unit: 'RON', kind: 'money' as const, primary: true }]
    await awosLead({ name: 'Test', externalId: 'form_stable', channel: 'form:contact', fields }, controller.signal)
    assert.equal(payload.externalId, 'form_stable')
    assert.equal(payload.channel, 'form:contact')
    assert.equal(payload.page, '/contact')
    assert.deepEqual(payload.fields, fields)
    globalThis.fetch = async () => new Response('{"error":"rate_limited"}', { status: 429 })
    await assert.rejects(awosLead({ name: 'Test' }), /rate_limited/)
    globalThis.fetch = async () => { throw new DOMException('aborted', 'AbortError') }
    await assert.rejects(awosLead({ name: 'Test' }), { name: 'AbortError' })
    assert.match(awosEmbedUrl('booking', 'key with space'), /key%20with%20space\?embed=1$/)
  } finally {
    globalThis.fetch = originalFetch
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation)
    else Reflect.deleteProperty(globalThis, 'location')
  }
})
