import { ensureRuntime } from '../services/runtime.js'

const results = []
const runtime = await ensureRuntime()

try {
  const directGenshin = await runtime.ttsService.synthesizeBySpeakerName('派蒙', '你好，旅行者。')
  results.push({ step: 'direct-genshin', ok: true, file: directGenshin.outputPath })

  const directBh3 = await runtime.ttsService.synthesizeBySpeakerName('丽塔', '舰长，你好。')
  results.push({ step: 'direct-bh3', ok: true, file: directBh3.outputPath })

  const baseUrl = `http://${runtime.config.server.host}:${runtime.config.server.port}`

  const healthRes = await fetch(`${baseUrl}/api/health`)
  const healthJson = await healthRes.json()
  results.push({ step: 'api-health', ok: healthRes.ok, workers: healthJson.data?.workers })

  const speakersRes = await fetch(`${baseUrl}/api/speakers`)
  const speakersJson = await speakersRes.json()
  results.push({ step: 'api-speakers', ok: speakersRes.ok, count: Array.isArray(speakersJson.data) ? speakersJson.data.length : null })

  const synthRes = await fetch(`${baseUrl}/api/synthesize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ speaker: '派蒙', text: '这是接口测试。' })
  })
  const synthJson = await synthRes.json()
  results.push({ step: 'api-synthesize', ok: synthRes.ok && synthJson.ok, file: synthJson.data?.file, audioUrl: synthJson.data?.audioUrl })

  if (synthJson?.data?.audioUrl) {
    const audioRes = await fetch(`${baseUrl}${synthJson.data.audioUrl}`)
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer())
    results.push({ step: 'api-audio', ok: audioRes.ok, bytes: audioBuffer.byteLength })
  }

  const webRes = await fetch(`${baseUrl}/`)
  const webText = await webRes.text()
  results.push({ step: 'web-index', ok: webRes.ok, hasHtml: webText.includes('<!DOCTYPE html>') || webText.includes('<html') })

  console.log(JSON.stringify({ ok: true, results }, null, 2))
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: String(error), stack: error?.stack, results }, null, 2))
  process.exitCode = 1
} finally {
  try {
    await new Promise(resolve => runtime.httpServer?.server?.close(resolve) ?? resolve())
  } catch {}

  try {
    for (const worker of runtime.ttsService.workers.values()) {
      worker.process?.kill()
    }
  } catch {}
}