export const genshinSpeakers = [
  '派蒙', '凯亚', '安柏', '丽莎', '琴', '香菱', '枫原万叶', '迪卢克', '温迪', '可莉', '早柚', '托马', '芭芭拉', '优菈',
  '云堇', '钟离', '魈', '凝光', '雷电将军', '北斗', '甘雨', '七七', '刻晴', '神里绫华', '戴因斯雷布', '雷泽',
  '神里绫人', '罗莎莉亚', '阿贝多', '八重神子', '宵宫', '荒泷一斗', '九条裟罗', '夜兰', '珊瑚宫心海', '五郎',
  '流浪者', '女士', '达达利亚', '莫娜', '班尼特', '申鹤', '行秋', '烟绯', '久岐忍', '辛焱', '砂糖', '胡桃',
  '重云', '菲谢尔', '诺艾尔', '迪奥娜', '鹿野院平藏'
]

export const bh3Speakers = [
  '丽塔', '伊甸', '八重樱', '刻晴bh3', '卡莲', '卡萝尔', '姬子', '布洛妮娅', '希儿', '帕朵菲莉丝', '幽兰黛尔',
  '德丽莎', '格蕾修', '梅比乌斯', '渡鸦', '爱莉希雅', '琪亚娜', '符华', '维尔薇', '芽衣', '菲谢尔bh3', '阿波尼亚',
  '空律', '识律'
]

const explicitAliases = new Map([
  ['散兵', '流浪者'],
  ['将军', '雷电将军'],
  ['绫华', '神里绫华'],
  ['绫人', '神里绫人'],
  ['心海', '珊瑚宫心海'],
  ['一斗', '荒泷一斗'],
  ['八重', '八重神子'],
  ['菲谢尔', '菲谢尔'],
  ['菲谢尔bh3', '菲谢尔bh3']
])

export const speakerCatalog = [
  ...genshinSpeakers.map((name, speakerId) => ({ name, speakerId, engine: 'genshin', group: '原神中文' })),
  ...bh3Speakers.map((name, speakerId) => ({ name, speakerId, engine: 'bh3', group: '崩三中文' }))
]

export function findSpeaker(rawName) {
  const normalized = String(rawName || '').trim()
  if (!normalized) return null

  const alias = explicitAliases.get(normalized)
  const exactName = alias || normalized

  let speaker = speakerCatalog.find(item => item.name === exactName)
  if (speaker) return speaker

  const partialMatches = speakerCatalog.filter(item => item.name.includes(normalized))
  if (partialMatches.length === 1) return partialMatches[0]

  return null
}

export function formatSpeakerList() {
  const genshin = genshinSpeakers.join('、')
  const bh3 = bh3Speakers.join('、')
  return [
    '【可用中文音色】',
    '',
    `原神：${genshin}`,
    '',
    `崩三：${bh3}`,
    '',
    '命令格式：#角色说要说的话'
  ].join('\n')
}
