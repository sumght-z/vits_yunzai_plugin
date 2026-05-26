import re

import jieba
from pypinyin import Style, lazy_pinyin, load_phrases_dict, pinyin
from pypinyin.style._utils import get_finals, get_initials
from pypinyin_dict.phrase_pinyin_data import cc_cedict
from pypinyin_dict.pinyin_data import kmandarin_8105


kmandarin_8105.load()
cc_cedict.load()

PHRASE_LIST = [
    '琴', '安柏', '丽莎', '凯亚', '芭芭拉', '迪卢克', '雷泽', '温迪', '可莉', '班尼特', '诺艾尔', '菲谢尔',
    '砂糖', '莫娜', '迪奥娜', '阿贝多', '罗莎莉亚', '优菈', '魈', '北斗', '凝光', '香菱', '行秋', '重云',
    '七七', '刻晴', '达达利亚', '钟离', '辛焱', '甘雨', '胡桃', '烟绯', '申鹤', '云堇', '夜兰', '神里绫华',
    '神里', '绫华', '枫原万叶', '枫原', '万叶', '宵宫', '早柚', '雷电将军', '九条裟罗', '九条', '裟罗', '珊瑚宫心海',
    '珊瑚宫', '心海', '托马', '荒泷', '一斗', '荒泷派', '五郎', '八重神子', '神子', '神里绫人', '绫人',
    '久岐忍', '鹿野院平藏', '平藏', '蒙德', '璃月', '稻妻', '北风的王狼', '风魔龙', '特瓦林', '若陀龙王', '龙脊雪山',
    '金苹果群岛', '渊下宫', '层岩巨渊', '奥赛尔', '七天神像', '钩钩果', '落落莓', '塞西莉亚花', '风车菊', '尘歌壶',
    '提瓦特', '明冠山地', '风龙废墟', '明冠峡', '坠星山谷', '果酒湖', '望风山地', '坎瑞亚', '须弥', '枫丹', '纳塔',
    '至冬', '丘丘人', '丘丘暴徒', '深渊法师', '深渊咏者', '盗宝团', '愚人众', '深渊教团', '骗骗花', '急冻树', '龙蜥',
    '鸣神岛', '神无冢', '八酝岛', '海祇岛', '清籁岛', '鹤观', '绝云间', '群玉阁', '南十字', '死兆星', '木漏茶室', '神樱',
    '鸣神大社', '天使的馈赠', '社奉行', '勘定奉行', '天领奉行', '夜叉', '风神', '岩神', '雷神', '风之神', '岩之神', '雷之神',
    '风神瞳', '岩神瞳', '雷神瞳', '摩拉克斯', '契约之神', '雷电影', '雷电真', '八重宫司', '宫司大人', '巴巴托斯', '玉衡星',
    '天权星', '璃月七星', '留云借风', '削月筑阳', '理水叠山', '请仙典仪'
]

for phrase in PHRASE_LIST:
    jieba.add_word(phrase)

load_phrases_dict({
    '若陀': [['rě'], ['tuó']],
    '平藏': [['píng'], ['zàng']],
    '派蒙': [['pài'], ['méng']],
    '安柏': [['ān'], ['bó']],
    '一斗': [['yī'], ['dǒu']],
})

_pad = '_'
_punctuation = ';:,.!?¡¿—…”«»“” '
_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
_letters_ipa = "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ"
_numbers = '0123456789'
_zhpunc = '！，、。？—…“”《》：+（）「」~；·・'
_py = ['sh', 'uo1', 'i3', 'ai2', 'i4', 'en2', 'en4', 'zh', 'eng3', 'ing4', 'i1', 'ia4', 'uo3', 'en', 'u2', 'e3', 'i2', 'üan2', 'ong1', 'ü2', 'u4', 'iong4', 'ai4', 'uang1', 'ie3', 'uei1', 'an2', 'iang3', 'e4', 'üe4', 'an4', 'ian4', 'iou3', 'uei4', 'ei2', 'ua4', 'iou4', 'ch', 'u1', 'a1', 'iong1', 'ian3', 'ou1', 'ong4', 'ü4', 'ian1', 'iang4', 'uo4', 'ü3', 'eng2', 'e2', 'ou4', 'an', 'ao3', 'ua1', 'in3', 'ou2', 'ie4', 'eng1', 'ou3', 'an3', 'er2', 'ai1', 'ie2', 'ing3', 'iou2', 'o1', 'ong3', 'an1', 'in4', 'ang1', 'ing2', 'ao4', 'iao4', 'a4', 'ing1', 'a3', 'ong2', 'iao1', 'in1', 'en3', 'uan2', 'uai4', 'ian2', 'e1', 'uei2', 'ang4', 'uang4', 'eng4', 'uan3', 'ai', 'iang', 'üe2', 'iao3', 'ei3', 'iou1', 'üan4', 'uan4', 'ou', 'o2', 'ei4', 'ei', 'ia', 'u3', 'ia1', 'en1', 'uan1', 'in2', 'ing', 'ün2', 'ie1', 'uo2', 'iang1', 'ei1', 'ang2', 'iao2', 'üan3', 'a2', 'ao1', 'iou', 'uen1', 'iang2', 'ang3', 'ua3', 'uen2', 'ie', 'ai3', 'uo', 'iong2', 'uen4', 'uang3', 'o4', 'ang', 'uei3', 'üan1', 'uang', 'ua', 'ian', 'uang2', 'er3', 'eng', 'ü1', 'ao2', 'ün1', 'uan', 'üe1', 'uen3', 'ia3', 'er4', 'uai2', 'er', 'ua2', 'uai3', 'ao', 'uen', 'ün4', 'in', 'iong3', 'ong', 'ün3', 'ün', 'ia2', 'uai1', 'üe3', 'iao', 'o3', 'uai', 'ueng1', 'uei', 'ü', 'iong']

symbols = [_pad] + list(_punctuation) + list(_letters) + list(_letters_ipa) + list(_numbers) + list(_zhpunc) + _py
_symbol_to_id = {s: i for i, s in enumerate(symbols)}
_id_to_symbol = {i: s for i, s in enumerate(symbols)}
_whitespace_re = re.compile(r'\s+')


def chinese_cleaners(text):
    return ' '.join(lazy_pinyin(jieba.cut(text), style=Style.TONE3, errors='ignore'))


def chinese_cleaners2(text):
    return ' '.join([
        p
        for phone in pinyin(text, style=Style.TONE3, v_to_u=True)
        for p in [
            get_initials(phone[0], strict=True),
            get_finals(phone[0][:-1], strict=True) + phone[0][-1]
            if phone[0][-1].isdigit()
            else get_finals(phone[0], strict=True)
            if phone[0][-1].isalnum()
            else phone[0],
        ]
        if len(p) != 0 and not p.isdigit()
    ])


def _clean_text(text, cleaner_names):
    for name in cleaner_names:
        cleaner = globals().get(name)
        if not cleaner:
            raise Exception(f'Unknown cleaner: {name}')
        text = cleaner(text)
    return text


def cleaned_text_to_sequence(cleaned_text):
    sequence = []
    for symbol in cleaned_text.split(' '):
        if symbol in _symbol_to_id:
            sequence.append(_symbol_to_id[symbol])
        else:
            for item in symbol:
                sequence.append(_symbol_to_id[item])
        sequence.append(_symbol_to_id[' '])
    if sequence and sequence[-1] == _symbol_to_id[' ']:
        sequence = sequence[:-1]
    return sequence


def text_to_sequence(text, cleaner_names):
    return cleaned_text_to_sequence(_clean_text(text, cleaner_names))


def sequence_to_text(sequence):
    return ''.join(_id_to_symbol[symbol_id] for symbol_id in sequence)