import { configStore } from '../services/config.js'
import { TtsService } from '../services/ttsService.js'
import { PluginHttpServer } from '../services/httpServer.js'
import { getLogger } from '../services/logger.js'

const modeArg = String(process.argv[2] || 'all').toLowerCase()

const modeMap = {
  api: {
    apiEnabled: true,
    webEnabled: false,
    label: 'API'
  },
  web: {
    apiEnabled: true,
    webEnabled: true,
    label: 'Web（含 API 依赖）'
  },
  all: {
    apiEnabled: true,
    webEnabled: true,
    label: 'API + Web'
  }
}

function printUsage() {
  console.log([
    '用法：',
    '  node vits-yunzai-plugin/scripts/start-standalone.mjs api',
    '  node vits-yunzai-plugin/scripts/start-standalone.mjs web',
    '  node vits-yunzai-plugin/scripts/start-standalone.mjs all',
    '',
    '说明：',
    '  api  仅启动 HTTP API',
    '  web  启动 Web 页面；由于页面依赖 /api/*，会同时启动 API',
    '  all  同时启动 API 与 Web'
  ].join('\n'))
}

const selectedMode = modeMap[modeArg]

if (!selectedMode) {
  printUsage()
  process.exit(1)
}

const logger = getLogger()
const config = structuredClone(configStore.load())
config.server.apiEnabled = selectedMode.apiEnabled
config.server.webEnabled = selectedMode.webEnabled

const ttsService = new TtsService(config)
const httpServer = new PluginHttpServer({ config, ttsService, logger })

async function shutdown(signal) {
  logger.info?.(`[vits-yunzai-plugin] 收到 ${signal}，正在关闭独立服务...`)

  try {
    await httpServer.stop()
  } catch (error) {
    logger.error?.(`[vits-yunzai-plugin] 关闭 HTTP 服务失败：${error.message}`)
  }

  try {
    for (const worker of ttsService.workers.values()) {
      worker.process?.kill()
    }
  } catch (error) {
    logger.error?.(`[vits-yunzai-plugin] 关闭 Python Worker 失败：${error.message}`)
  }

  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await httpServer.start()

  const baseUrl = `http://${config.server.host}:${config.server.port}`
  logger.info?.(`[vits-yunzai-plugin] 独立模式已启动：${selectedMode.label}`)
  logger.info?.(`[vits-yunzai-plugin] 服务地址：${baseUrl}`)

  if (config.server.apiEnabled) {
    logger.info?.(`[vits-yunzai-plugin] API 健康检查：${baseUrl}/api/health`)
  }

  if (config.server.webEnabled) {
    logger.info?.(`[vits-yunzai-plugin] Web 页面：${baseUrl}/`)
  }

  logger.info?.('[vits-yunzai-plugin] 按 Ctrl+C 可停止独立服务')
} catch (error) {
  logger.error?.(`[vits-yunzai-plugin] 独立服务启动失败：${error.message}`)
  process.exit(1)
}