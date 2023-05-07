import path from "path"

//支持锅巴
export function supportGuoba() {
    return {
    // 插件信息，将会显示在前端页面
    // 如果你的插件没有在插件库里，那么需要填上补充信息
    // 如果存在的话，那么填不填就无所谓了，填了就以你的信息为准
    pluginInfo: {
        name: 'AI语音本地生成(vits_yunzai_plugin)',
        title: 'vits-yunzai-plugin',
        author: '@sumght',
        authorlink: 'https://gitee.com/sumght',
        link: 'https://gitee.com/sumght/vits_yunzai_plugin',
        isV3: true,
        isV2: false,
        description: '基于vits本地生成原神/崩三语音'
    }
    }
}