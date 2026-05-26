import re

import cn2an
import jieba
from pypinyin import BOPOMOFO, lazy_pinyin


_pad = '_'
_punctuation = '，。！？—…'
_letters = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩˉˊˇˋ˙ '
symbols = [_pad] + list(_punctuation) + list(_letters)

_symbol_to_id = {s: i for i, s in enumerate(symbols)}
_id_to_symbol = {i: s for i, s in enumerate(symbols)}
_whitespace_re = re.compile(r'\s+')
_chinese_re = re.compile('[\u4e00-\u9fff]')
_bopomofo_re = re.compile('[\u3105-\u3129]')

_latin_to_bopomofo = [
    (re.compile('%s' % src, re.IGNORECASE), target)
    for src, target in [
        ('a', 'ㄟˉ'), ('b', 'ㄅㄧˋ'), ('c', 'ㄙㄧˉ'), ('d', 'ㄉㄧˋ'), ('e', 'ㄧˋ'), ('f', 'ㄝˊㄈㄨˋ'),
        ('g', 'ㄐㄧˋ'), ('h', 'ㄝˇㄑㄩˋ'), ('i', 'ㄞˋ'), ('j', 'ㄐㄟˋ'), ('k', 'ㄎㄟˋ'), ('l', 'ㄝˊㄛˋ'),
        ('m', 'ㄝˊㄇㄨˋ'), ('n', 'ㄣˉ'), ('o', 'ㄡˉ'), ('p', 'ㄆㄧˉ'), ('q', 'ㄎㄧㄡˉ'), ('r', 'ㄚˋ'),
        ('s', 'ㄝˊㄙˋ'), ('t', 'ㄊㄧˋ'), ('u', 'ㄧㄡˉ'), ('v', 'ㄨㄧˉ'), ('w', 'ㄉㄚˋㄅㄨˋㄌㄧㄡˋ'),
        ('x', 'ㄝˉㄎㄨˋㄙˋ'), ('y', 'ㄨㄞˋ'), ('z', 'ㄗㄟˋ')
    ]
]


def number_to_chinese(text):
    numbers = re.findall(r'\d+(?:\.?\d+)?', text)
    for number in numbers:
        text = text.replace(number, cn2an.an2cn(number), 1)
    return text


def chinese_to_bopomofo(text):
    text = text.replace('、', '，').replace('；', '，').replace('：', '，')
    words = jieba.lcut(text, cut_all=False)
    output = ''
    for word in words:
        bopomofos = lazy_pinyin(word, BOPOMOFO)
        if not re.search(_chinese_re, word):
            output += word
            continue
        for index in range(len(bopomofos)):
            if re.match(_bopomofo_re, bopomofos[index][-1]):
                bopomofos[index] += 'ˉ'
        if output:
            output += ' '
        output += ''.join(bopomofos)
    return output


def latin_to_bopomofo(text):
    for regex, replacement in _latin_to_bopomofo:
        text = re.sub(regex, replacement, text)
    return text


def chinese_cleaners(text):
    text = number_to_chinese(text)
    text = chinese_to_bopomofo(text)
    text = latin_to_bopomofo(text)
    if text and re.match('[ˉˊˇˋ˙]', text[-1]):
        text += '。'
    return text


def _clean_text(text, cleaner_names):
    for name in cleaner_names:
        cleaner = globals().get(name)
        if not cleaner:
            raise Exception(f'Unknown cleaner: {name}')
        text = cleaner(text)
    return text


def cleaned_text_to_sequence(cleaned_text):
    return [_symbol_to_id[symbol] for symbol in cleaned_text if symbol in _symbol_to_id]


def text_to_sequence(text, cleaner_names):
    clean_text = _clean_text(text, cleaner_names)
    sequence = []
    for symbol in clean_text:
        if symbol not in _symbol_to_id:
            continue
        sequence.append(_symbol_to_id[symbol])
    return sequence


def sequence_to_text(sequence):
    return ''.join(_id_to_symbol[symbol_id] for symbol_id in sequence)