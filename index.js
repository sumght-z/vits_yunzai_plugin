import fs from 'node:fs'

logger.info('---------=.=---------')
logger.info(`AI语音生成插件载入成功~qwq`)
logger.info(`作者-sumght 2022.11.3`)
logger.info(`---------------------`);

const files = fs
  .readdirSync('./plugins/vits-yunzai-Plugin/apps')
  .filter((file) => file.endsWith('.js'))

let apps = {}
for (let file of files) {
  let name = file.replace('.js', '')
  apps[name] = (await import(`./apps/${file}`))[name]
}
export { apps }