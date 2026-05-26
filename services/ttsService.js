import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { PythonWorker } from './pythonWorker.js'
import { findSpeaker, speakerCatalog } from '../data/speakers.js'

function normalizeText(text) {
  const value = String(text || '')
    .replace(/\\n/g, '。')
    .replace(/\\r/g, '。')
    .replace(/[\r\n]+/g, '。')
    .replace(/\s+/g, '，')
    .replace(/[“”"']/g, '，')
    .replace(/[()（）]/g, '，')
    .replace(/[~,，]{2,}/g, '，')
    .trim()

  const numMap = { '0': '零', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九' }
  return value.replace(/\d/g, num => numMap[num] || num)
}

export class TtsService {
  constructor(config) {
    this.config = config
    this.workers = new Map()
  }

  getWorker(engineKey) {
    if (!this.workers.has(engineKey)) {
      this.workers.set(engineKey, new PythonWorker({ engineKey, config: this.config }))
    }
    return this.workers.get(engineKey)
  }

  validateText(text) {
    const normalized = normalizeText(text)
    if (!normalized) {
      throw new Error('请输入要合成的文本')
    }
    if (normalized.length > this.config.limits.maxTextLength) {
      throw new Error(`当前字数 ${normalized.length} 超过限制 ${this.config.limits.maxTextLength}`)
    }
    return normalized
  }

  async synthesizeBySpeakerName(name, text) {
    const speaker = findSpeaker(name)
    if (!speaker) {
      throw new Error('未匹配到可用中文音色，请先发送“音色列表”查看')
    }
    return this.synthesize({ speaker, text })
  }

  async synthesize({ speaker, text }) {
    const normalizedText = this.validateText(text)
    const outputDir = this.config.synthesis.outputDir
    fs.mkdirSync(outputDir, { recursive: true })

    const jobId = randomUUID()
    const filename = `${speaker.engine}-${Date.now()}-${jobId.slice(0, 8)}.wav`
    const outputPath = path.join(outputDir, filename)
    const worker = this.getWorker(speaker.engine)
    const result = await worker.synthesize({
      text: normalizedText,
      speakerId: speaker.speakerId,
      outputPath
    })

    return {
      ...result,
      speaker,
      text: normalizedText,
      filename,
      outputPath
    }
  }

  getHealth() {
    return {
      enabled: this.config.enabled,
      maxTextLength: this.config.limits.maxTextLength,
      workers: ['genshin', 'bh3'].map(engine => this.getWorker(engine).getState())
    }
  }

  getSpeakers() {
    return speakerCatalog
  }
}
