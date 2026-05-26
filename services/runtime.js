import { configStore } from './config.js'
import { TtsService } from './ttsService.js'
import { PluginHttpServer } from './httpServer.js'
import { getLogger } from './logger.js'

let runtimePromise = null
let runtimeRef = null

export async function ensureRuntime() {
  if (runtimeRef) return runtimeRef
  if (runtimePromise) return runtimePromise

  runtimePromise = (async () => {
    const logger = getLogger()
    const config = configStore.load()
    const ttsService = new TtsService(config)
    const httpServer = new PluginHttpServer({ config, ttsService, logger })
    await httpServer.start()

    runtimeRef = {
      logger,
      configStore,
      config,
      ttsService,
      httpServer
    }

    return runtimeRef
  })()

  return runtimePromise
}

export async function updateRuntimeConfig(patch) {
  const runtime = await ensureRuntime()
  const previousServerConfig = structuredClone(runtime.config.server)
  const nextConfig = configStore.update(patch)
  await runtime.httpServer.reconcile(previousServerConfig, nextConfig.server)
  return runtime
}

export function getRuntimeSync() {
  return runtimeRef
}
