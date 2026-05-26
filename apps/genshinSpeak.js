import plugin from '../../../lib/plugins/plugin.js'
import { ensureRuntime, updateRuntimeConfig } from '../services/runtime.js'
import { configStore } from '../services/config.js'
import { formatSpeakerList } from '../data/speakers.js'



export class genshinSpeak extends plugin {
  constructor() {
    super({
      name: '文字转语音',
      dsc: '中文本地语音合成',
      event: 'message',
      priority: 6000,
      rule: [
        {
          reg: '^#*(.+)说([\\s\\S]+)$',
          fnc: 'genshinSpeak'
        },
        {
          reg: '^#*音色列表$',
          fnc: 'speakerList'
        },
        {
          reg: '^#*语音状态$',
          fnc: 'status'
        },
        {
          reg: '^(开启语音|关闭语音)$',
          fnc: 'toggleVoice'
        },
        {
          reg: '^#*(开启|关闭)(API|api|Api)$',
          fnc: 'toggleApi'
        },
        {
          reg: '^#*(开启|关闭)(Web|WEB|web)$',
          fnc: 'toggleWeb'
        }
      ]
    })
  }

  async genshinSpeak(e) {
    const runtime = await ensureRuntime()
    const message = e.msg.replace(/^#*/, '')
    const splitIndex = message.indexOf('说')
    if (splitIndex <= 0) return false

    if (!runtime.config.enabled) {
      await e.reply('当前语音功能已关闭')
      return true
    }

    const speaker = message.slice(0, splitIndex).trim()
    const text = message.slice(splitIndex + 1).trim()

    try {
      if (runtime.config.reply.sendCommandAck) {
        await e.reply('正在生成语音，请稍候...')
      }
      const result = await runtime.ttsService.synthesizeBySpeakerName(speaker, text)
      if (runtime.config.reply.sendStatusText) {
        await e.reply(`生成成功：${result.speaker.name}（${result.text.length} 字）`)
      }
      await e.reply(segment.record(result.outputPath))
    } catch (error) {
      await e.reply(`生成失败：${error.message}`)
    }

    return true
  }

  async speakerList(e) {
    await e.reply(formatSpeakerList())
    return true
  }

  async status(e) {
    const runtime = await ensureRuntime()
    const health = runtime.ttsService.getHealth()
    const statusLines = [
      `语音功能：${runtime.config.enabled ? '开启' : '关闭'}`,
      `API：${runtime.config.server.apiEnabled ? '开启' : '关闭'} (${runtime.config.server.host}:${runtime.config.server.port})`,
      `Web：${runtime.config.server.webEnabled ? '开启' : '关闭'}`,
      `字数上限：${runtime.config.limits.maxTextLength}`,
      ...health.workers.map(item => `${item.engine} worker：${item.ready ? `已就绪(pid=${item.pid})` : '未启动'}`)
    ]
    await e.reply(statusLines.join('\n'))
    return true
  }

  async toggleVoice(e) {
    if (!e.isMaster) return false
    const enable = e.msg.includes('开启')
    const nextConfig = configStore.update({ enabled: enable })
    await e.reply(`语音功能已${nextConfig.enabled ? '开启' : '关闭'}`)
    return true
  }

  async toggleApi(e) {
    if (!e.isMaster) return false
    const enable = e.msg.includes('开启')
    const runtime = await updateRuntimeConfig({
      server: {
        apiEnabled: enable
      }
    })
    await e.reply(`API 已${runtime.config.server.apiEnabled ? '开启' : '关闭'}（${runtime.config.server.host}:${runtime.config.server.port}）`)
    return true
  }

  async toggleWeb(e) {
    if (!e.isMaster) return false
    const enable = e.msg.includes('开启')
    const runtime = await updateRuntimeConfig({
      server: {
        webEnabled: enable
      }
    })
    await e.reply(`Web 已${runtime.config.server.webEnabled ? '开启' : '关闭'}（${runtime.config.server.host}:${runtime.config.server.port}）`)
    return true
  }
}
