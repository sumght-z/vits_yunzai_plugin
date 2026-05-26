import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'node:http'
import { URL } from 'node:url'
import { pluginPaths } from '../config/defaults.js'

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload, null, 2))
}

function sendText(res, statusCode, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': type })
  res.end(text)
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export class PluginHttpServer {
  constructor({ config, ttsService, logger }) {
    this.config = config
    this.ttsService = ttsService
    this.logger = logger
    this.server = null
  }

  shouldListen() {
    return Boolean(this.config.server.apiEnabled || this.config.server.webEnabled)
  }

  async start() {
    if (this.server) return
    if (!this.shouldListen()) return

    const server = createServer(async (req, res) => {
      try {
        await this.handleRequest(req, res)
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error.message })
      }
    })

    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(this.config.server.port, this.config.server.host, resolve)
    })

    this.server = server

    this.logger.info?.(`[vits-yunzai-plugin] HTTP 服务已启动：http://${this.config.server.host}:${this.config.server.port}`)
  }

  async stop() {
    if (!this.server) return

    const server = this.server
    this.server = null

    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })

    this.logger.info?.('[vits-yunzai-plugin] HTTP 服务已停止')
  }

  async reconcile(previousServerConfig = {}, nextServerConfig = this.config.server) {
    const wasEnabled = Boolean(previousServerConfig.apiEnabled || previousServerConfig.webEnabled)
    const isEnabled = Boolean(nextServerConfig.apiEnabled || nextServerConfig.webEnabled)
    const hostChanged = previousServerConfig.host && previousServerConfig.host !== nextServerConfig.host
    const portChanged = previousServerConfig.port && previousServerConfig.port !== nextServerConfig.port

    if (!wasEnabled && isEnabled) {
      await this.start()
      return
    }

    if (wasEnabled && !isEnabled) {
      await this.stop()
      return
    }

    if (this.server && (hostChanged || portChanged)) {
      await this.stop()
      await this.start()
      return
    }

    if (!this.server && isEnabled) {
      await this.start()
    }
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`)

    if (url.pathname.startsWith('/api/')) {
      if (!this.config.server.apiEnabled) {
        return sendJson(res, 503, { ok: false, error: 'API 未开启' })
      }

      if (req.method === 'GET' && url.pathname === '/api/health') {
        return sendJson(res, 200, { ok: true, data: this.ttsService.getHealth() })
      }

      if (req.method === 'GET' && url.pathname === '/api/speakers') {
        return sendJson(res, 200, { ok: true, data: this.ttsService.getSpeakers() })
      }

      if (req.method === 'POST' && url.pathname === '/api/synthesize') {
        const body = await readJsonBody(req)
        const result = await this.ttsService.synthesizeBySpeakerName(body.speaker, body.text)
        return sendJson(res, 200, {
          ok: true,
          data: {
            speaker: result.speaker,
            text: result.text,
            file: result.filename,
            audioUrl: `/api/audio/${encodeURIComponent(result.filename)}`
          }
        })
      }

      if (req.method === 'GET' && url.pathname.startsWith('/api/audio/')) {
        const filename = decodeURIComponent(url.pathname.replace('/api/audio/', ''))
        const filePath = path.join(this.config.synthesis.outputDir, filename)
        if (!fs.existsSync(filePath)) {
          return sendJson(res, 404, { ok: false, error: '音频不存在' })
        }

        res.writeHead(200, { 'Content-Type': 'audio/wav' })
        fs.createReadStream(filePath).pipe(res)
        return
      }

      return sendJson(res, 404, { ok: false, error: 'Not Found' })
    }

    if (req.method === 'GET' && this.config.server.webEnabled && (url.pathname === '/' || url.pathname === '/index.html')) {
      const indexPath = path.join(pluginPaths.webDir, 'index.html')
      return sendText(res, 200, fs.readFileSync(indexPath, 'utf8'), 'text/html; charset=utf-8')
    }

    return sendJson(res, 404, { ok: false, error: 'Not Found' })
  }
}
