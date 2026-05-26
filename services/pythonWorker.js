import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { getLogger } from './logger.js'

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

export class PythonWorker {
  constructor({ engineKey, config }) {
    this.engineKey = engineKey
    this.config = config
    this.logger = getLogger()
    this.process = null
    this.ready = false
    this.pending = new Map()
    this.queue = Promise.resolve()
    this.stdoutBuffer = ''
    this.stderrBuffer = ''
    this.startPromise = null
  }

  async start() {
    if (this.ready && this.process) return
    if (this.startPromise) return this.startPromise

    const deferred = createDeferred()
    this.startPromise = deferred.promise

    const pythonExecutable = this.config.python.executable
    const workerScript = this.config.python.workerScript
    const modelConfig = this.config.models[this.engineKey]

    if (!fs.existsSync(pythonExecutable)) {
      deferred.reject(new Error(`Python 不存在：${pythonExecutable}`))
      this.startPromise = null
      return deferred.promise
    }

    if (!fs.existsSync(workerScript)) {
      deferred.reject(new Error(`Worker 脚本不存在：${workerScript}`))
      this.startPromise = null
      return deferred.promise
    }

    this.process = spawn(
      pythonExecutable,
      [
        '-X',
        'utf8',
        workerScript,
        '--engine',
        this.engineKey,
        '--text-profile',
        modelConfig.textProfile,
        '--config',
        modelConfig.configPath,
        '--checkpoint',
        modelConfig.checkpointPath,
        '--noise-scale',
        String(this.config.synthesis.noiseScale),
        '--noise-scale-w',
        String(this.config.synthesis.noiseScaleW),
        '--length-scale',
        String(this.config.synthesis.lengthScale)
      ],
      {
        cwd: modelConfig.cwd,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1'
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      }
    )

    this.process.stdout.setEncoding('utf8')
    this.process.stderr.setEncoding('utf8')

    this.process.stdout.on('data', chunk => this.handleStdout(chunk, deferred))
    this.process.stderr.on('data', chunk => {
      this.stderrBuffer += chunk
      this.logger.error?.(`[vits-worker:${this.engineKey}] ${chunk.trim()}`)
    })

    this.process.on('exit', (code) => {
      const message = this.stderrBuffer.trim() || `Python Worker 已退出，code=${code}`
      const error = new Error(message)
      if (!this.ready) deferred.reject(error)
      this.ready = false
      this.process = null
      this.startPromise = null
      for (const item of this.pending.values()) {
        item.reject(error)
      }
      this.pending.clear()
    })

    return deferred.promise
  }

  handleStdout(chunk, startDeferred) {
    this.stdoutBuffer += chunk
    const lines = this.stdoutBuffer.split(/\r?\n/)
    this.stdoutBuffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      let payload
      try {
        payload = JSON.parse(line)
      } catch (error) {
        this.logger.warn?.(`[vits-worker:${this.engineKey}] 无法解析输出：${line}`)
        continue
      }

      if (payload.type === 'ready') {
        this.ready = true
        startDeferred.resolve(true)
        continue
      }

      if (payload.type === 'fatal') {
        startDeferred.reject(new Error(payload.error || 'Python Worker 启动失败'))
        continue
      }

      const pending = this.pending.get(payload.id)
      if (!pending) continue
      this.pending.delete(payload.id)

      if (payload.ok) {
        pending.resolve(payload)
      } else {
        pending.reject(new Error(payload.error || '语音合成失败'))
      }
    }
  }

  async synthesize({ text, speakerId, outputPath }) {
    await this.start()

    const id = randomUUID()
    return this.enqueue(() => new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.process.stdin.write(`${JSON.stringify({ id, text, speaker_id: speakerId, output_path: outputPath })}\n`, 'utf8')
    }))
  }

  enqueue(task) {
    this.queue = this.queue.then(task, task)
    return this.queue
  }

  getState() {
    return {
      engine: this.engineKey,
      ready: this.ready,
      queueActive: this.pending.size,
      pid: this.process?.pid || null
    }
  }
}
