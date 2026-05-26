import fs from 'node:fs'
import { Version } from './components/index.js'
import { ensureRuntime } from './services/runtime.js'

if (!global.core) {
  if (Version.isTrss) {
    global.core = Bot?.core
  } else {
    try {
      core = (await import('icqq' || 'oicq')).core
    } catch (error) {
      global.core = null
    }
  }
}

if (!global.segment) global.segment = (await import('icqq' || 'oicq')).segment
global.uploadRecord = (await import('./model/uploadRecord.js')).default

const files = fs.readdirSync('./plugins/vits-yunzai-plugin/apps').filter(file => file.endsWith('.js'))
let ret = []

logger.info('---------=.=---------')
logger.info(`AI语音生成插件${Version.version}载入成功~qwq`)
logger.info(`作者-sumght 2022.11.3`)
logger.info(`---------------------`)

try {
  await ensureRuntime()
} catch (error) {
  logger.error?.('[vits-yunzai-plugin] 初始化运行时失败')
  logger.error?.(error)
}

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}

export { apps }