import { segment } from "oicq";
import fetch from "node-fetch";
import plugin from '../../lib/plugins/plugin.js'
import gsCfg from '../genshin/model/gsCfg.js'
import { createRequire } from 'module'
import uploadRecord from '../uploadRecord.js'

const require = createRequire(import.meta.url)
const { exec } = require('child_process')




const genshinSpeakers = ['派蒙', '凯亚', '安柏', '丽莎', '琴', '香菱', '枫原万叶', '迪卢克', '温迪', '可莉', '早柚', '托马', '芭芭拉', '优菈', '云堇', '钟离', '魈', '凝光', '雷电将军', '北斗', '甘雨', '七七', '刻晴', '神里绫华', '戴因斯雷布', '雷泽', '神里绫人', '罗莎莉亚', '阿贝多', '八重神子', '宵宫', '荒泷一斗', '九条裟罗', '夜兰', '珊瑚宫心海', '五郎', '散兵', '女士', '达达利亚', '莫娜', '班尼特', '申鹤', '行秋', '烟绯', '久岐忍', '辛焱', '砂糖', '胡桃', '重云', '菲谢尔', '诺艾尔', '迪奥娜', '鹿野院平藏']

const otherSpeakers = { "星爷": "zxcmp", "鬼": "juyinf_guigushi", "葛优": "geyoump", "四川话": "ppangf_csn", "粤语": "lunaif_ctn", "loli": "xbekef", "东北话": "xjingf_cdb", "然然": "qianranfa" }

const youziSpeakers = { '绫地宁宁': 0, '因幡巡': 1, '朝武芳乃': 2, '常陆茉子': 3, '丛雨': 4, '鞍马小春': 5, '在原七海': 6 }


// 生成时使用的 noise_factor，可用于控制感情等变化程度。默认为0.667。
const noise = 0.667
// 生成时使用的 noise_factor_w，可用于控制音素发音长度变化程度。默认为0.8。
const noisew = 0.8
// 生成时使用的 length_factor，可用于控制整体语速。默认为1.2。
const length = 1.2

function sleep(ms) {
    return new Promise(resolve=>setTimeout(resolve, ms))
}



export class genshinSpeak extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '文字转语音',
      /** 功能描述 */
      dsc: '简单开发示例',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 6000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#*(.*)说(.*)$",  //匹配消息正则，命令正则
          /** 执行方法 */
          fnc: 'genshinSpeak'
        },
        {
          /** 命令正则匹配 */
          reg: '^#*音色列表$',
          /** 执行方法 */
          fnc: 'speakerList'
        }
      ]


    })
  }

  async genshinSpeak(e) {
    // 提取发言人和发言内容
    let data = e.msg.split("#").slice(-1)[0].split("说")
    while (data.length > 2) {
      data[1] = data[1].concat("说").concat(data[2])
      data.splice(2, 1)
    }

    // 如果发言内容或发言人为空则返回
    if (!data[1] || !data[0])
      return false

    let nameArr = gsCfg.getAllAbbr()
    for (let rolename of Object.values(nameArr)) {
      // console.log(rolename)
      if (rolename.includes(data[0])) {
        data[0] = rolename[0]
        break
      }
    }

    // 原神音色
    if (genshinSpeakers.includes(data[0])) {
      // 原神语音接口不支持阿拉伯数字,所以将数字转为汉字
      let text = data[1].split("")
      const num = { "1": "一", "2": "二", "3": "三", "4": "四", "5": "五", "6": "六", "7": "七", "8": "八", "9": "九", "0": "零" }
      for (let i = 0; i < text.length; i++) {
        if ((/\d/g).test(text[i]))
          text[i] = num[text[i]]
      }
      data[1] = text.join("")

        console.log("【语音合成】 \n【音色】:", data[0], "\n【内容】:", data[1])
        for (let i = 0; i < genshinSpeakers.length; i++) {
            if (data[0] == genshinSpeakers[i]) {
                var characternum = i;
                break;
            }
        }
        console.log("输出角色序号:"+characternum)
        var cmdStr = 'python .\\vits\\run_new.py --character=' + characternum + ' --text=' + data[1];
        exec(cmdStr, async function (error, stdout, stderr) {
            if (error) {
                console.log("生成失败", stderr);
                e.reply(["生成失败，失败原因:" + stderr])
            } else if (stdout) {
                console.log("生成成功", stdout);
                e.reply(segment.record("example.wav"))
            }
        })
        if (data[1].length) {
            var sleep_time = 60000;
            if (data[1].length <= 30) {
                sleep_time = 40000;
                if (data[1].length <= 20) {
                    sleep_time = 30000;
                    if (data[1].length <= 10) {
                        sleep_time = 20000;
                    }
                }
            }
        }
        if (data[1].length > 60) { 
            sleep_time = sleep_time + (data[1].length - 30)*400
        }
        await e.reply("生成字数：" + data[1].length + " 预计将花费" + sleep_time /1000 + "秒，" + data[0] + "爱你哟~")
        
        return true;
    }

    // 其他音色
    else if (Object.keys(otherSpeakers).includes(data[0])) {
        console.log("【语音合成】 \n【音色】:", data[0], "\n【内容】:", data[1]);
        e.reply([segment.record(`https://dds.dui.ai/runtime/v1/synthesize?voiceId=${otherSpeakers[data[0]]}&text=${encodeURI(data[1])}&speed=1&volume=150&audioType=wav`)])
        return true;
    }

    // 柚子社音色
    else if (Object.keys(youziSpeakers).includes(data[0])) {
      // 翻译为日语
      let jptxt = await fetch(`http://www.iinside.cn:7001/api_req?reqmode=nmt_mt5_jez&password=3652&text=${encodeURI(data[1])}&order=zh2ja`)
      jptxt = await jptxt.json();
      console.log("【语音合成】 \n【音色】:", data[0], "\n【原文】:", data[1], "\n【译文】:", jptxt.data)

      let url = `https://moegoe.azurewebsites.net/api/speak?text=${encodeURI(jptxt.data)}&id=${youziSpeakers[data[0]]}&format=mp3`;
      console.log(url)
      e.reply(["正在转换,请稍等~"]);

      try {
        let res = await fetch(url);
        // console.log(res)
        if (res.status == 400) {
          e.reply("转换失败")
          return true
        }
        console.log(res.url)
        e.reply(segment.record(res.url))
      } catch (error) {
        e.reply([segment.text(error)])
      }
      return true
    }
	
	
	// 未匹配到则放行指令
      return false
  }

  async speakerList(e) {
      e.reply(["原神音色，支持别称:\n", segment.text(genshinSpeakers),  "\n\n柚子社音色:\n", segment.text(Object.keys(youziSpeakers)), "\n\n其他音色:\n", segment.text(Object.keys(otherSpeakers)), "\n\n格式: 音色+说+要说的话"])
    return true
  }
}





