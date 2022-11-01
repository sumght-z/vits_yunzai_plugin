
import matplotlib.pyplot as plt

import os
import json
import math

import scipy
import torch
from torch import nn
from torch.nn import functional as F
from torch.utils.data import DataLoader

import commons
import utils
from data_utils import TextAudioLoader, TextAudioCollate, TextAudioSpeakerLoader, TextAudioSpeakerCollate
from models import SynthesizerTrn
from text.symbols import symbols
from text import text_to_sequence
#from transforms import Translate

from scipy.io.wavfile import write
import argparse
parser = argparse.ArgumentParser(description='查看传参')
parser.add_argument("--text",type=str,default="你好。")
parser.add_argument("--character",type=int,default=0)
args = parser.parse_args()
#调用用args.text调用
#args.character


def get_text(text, hps):
    text_norm = text_to_sequence(text, hps.data.text_cleaners)
    if hps.data.add_blank:
        text_norm = commons.intersperse(text_norm, 0)
    text_norm = torch.LongTensor(text_norm)
    return text_norm

hps = utils.get_hparams_from_file("C:/Users/Administrator/Desktop/vits/configs/ys.json")



net_g = SynthesizerTrn(
    len(symbols),
    hps.data.filter_length // 2 + 1,
    hps.train.segment_size // hps.data.hop_length,
    n_speakers=hps.data.n_speakers,#
    **hps.model)
_ = net_g.eval()

#
# model3 = "D:/vits/cleaner/drive/MyDrive/bh3/BH3.pth"
# config3 = "./configs/bh3.json"
# hps_ms3 = utils.get_hparams_from_file(config3)
# net_g_ms3 = SynthesizerTrn(
#     len(hps_ms3.symbols),
#     hps_ms3.data.filter_length // 2 + 1,
#     hps_ms3.train.segment_size // hps_ms3.data.hop_length,
#     n_speakers=hps_ms3.data.n_speakers,
#     **hps_ms3.model)
# _ = net_g_ms3.eval()
# utils.load_checkpoint(model3, net_g_ms3)
#
# stn_tst = get_text("舰长大人", hps_ms3)
# with torch.no_grad():
#     x_tst = stn_tst.cuda().unsqueeze(0)
#     x_tst_lengths = torch.LongTensor([stn_tst.size(0)]).cuda()
#     sid=torch.LongTensor([0]).cuda()#指定第几个人说话
#     audio = net_g.infer(x_tst, x_tst_lengths, noise_scale=.667, noise_scale_w=0.8, length_scale=1)[0][0,0].data.cpu().float().numpy()
# #ipd.display(ipd.Audio(audio, rate=, normalize=False))
#     #write("example.wav", hps.data.sampling_rate, audio)
#     scipy.io.wavfile.write("example.wav", hps.data.sampling_rate, audio)
#


_ = utils.load_checkpoint("C:/Users/Administrator/Desktop/vits/ys/G_809000.pth", net_g, None)#G_389000.pth
text=args.text
stn_tst = get_text(text, hps)
with torch.no_grad():
    x_tst = stn_tst.unsqueeze(0)
    x_tst_lengths = torch.LongTensor([stn_tst.size(0)])
    character=args.character
    sid=torch.LongTensor([character])#指定第几个人说话
    audio = net_g.infer(x_tst, x_tst_lengths, noise_scale=.667, sid = sid, noise_scale_w=0.8, length_scale=1.2)[0][0,0].data.cpu().float().numpy()
#ipd.display(ipd.Audio(audio, rate=, normalize=False))
    #write("example.wav", hps.data.sampling_rate, audio)
    scipy.io.wavfile.write("example.wav", hps.data.sampling_rate, audio)
#丽塔0伊甸1八重樱2刻晴3卡莲4卡萝尔5姬子6布洛妮娅7希儿8帕朵菲莉丝9幽兰黛尔10德丽莎11格蕾修12梅比乌斯13渡鸦14爱莉希雅15琪亚娜16符华17维尔薇18芽衣19菲谢尔2阿波尼亚21空律22识律23乐乐24猫猫25
