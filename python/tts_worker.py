import argparse
import importlib
import json
import os
import sys
import traceback

import numpy as np
import scipy.io.wavfile
import torch


def parse_args():
    parser = argparse.ArgumentParser(description='Persistent VITS worker')
    parser.add_argument('--engine', required=True)
    parser.add_argument('--text-profile', required=True)
    parser.add_argument('--config', required=True)
    parser.add_argument('--checkpoint', required=True)
    parser.add_argument('--noise-scale', type=float, default=0.667)
    parser.add_argument('--noise-scale-w', type=float, default=0.8)
    parser.add_argument('--length-scale', type=float, default=1.2)
    return parser.parse_args()


def emit(payload):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + '\n')
    sys.stdout.flush()


def build_model(args):
    engine_dir = os.getcwd()
    if engine_dir not in sys.path:
        sys.path.insert(0, engine_dir)

    import commons  # noqa: F401
    import utils
    from models import SynthesizerTrn

    profile = importlib.import_module(f'text_profiles.{args.text_profile}')
    symbols = profile.symbols
    text_to_sequence = profile.text_to_sequence

    hps = utils.get_hparams_from_file(args.config)
    net_g = SynthesizerTrn(
        len(symbols),
        hps.data.filter_length // 2 + 1,
        hps.train.segment_size // hps.data.hop_length,
        n_speakers=hps.data.n_speakers,
        **hps.model,
    )
    _ = net_g.eval()
    _ = utils.load_checkpoint(args.checkpoint, net_g, None)

    def get_text(text):
        text_norm = text_to_sequence(text, hps.data.text_cleaners)
        if hps.data.add_blank:
            import commons as commons_module

            text_norm = commons_module.intersperse(text_norm, 0)
        return torch.LongTensor(text_norm)

    return hps, net_g, get_text


def synthesize(hps, net_g, get_text, text, speaker_id, output_path, args):
    stn_tst = get_text(text)
    with torch.no_grad():
        x_tst = stn_tst.unsqueeze(0)
        x_tst_lengths = torch.LongTensor([stn_tst.size(0)])
        sid = torch.LongTensor([speaker_id])
        audio = net_g.infer(
            x_tst,
            x_tst_lengths,
            noise_scale=args.noise_scale,
            sid=sid,
            noise_scale_w=args.noise_scale_w,
            length_scale=args.length_scale,
        )[0][0, 0].data.cpu().float().numpy()

    audio = np.asarray(audio)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    scipy.io.wavfile.write(output_path, hps.data.sampling_rate, audio)


def main():
    args = parse_args()
    try:
        hps, net_g, get_text = build_model(args)
        emit({'type': 'ready', 'engine': args.engine})
    except Exception as error:  # noqa: BLE001
        emit({'type': 'fatal', 'error': f'{error}\n{traceback.format_exc()}'})
        raise

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            payload = json.loads(line)
            synthesize(
                hps,
                net_g,
                get_text,
                payload['text'],
                int(payload['speaker_id']),
                payload['output_path'],
                args,
            )
            emit({
                'id': payload['id'],
                'ok': True,
                'engine': args.engine,
                'output_path': payload['output_path'],
            })
        except Exception as error:  # noqa: BLE001
            emit({
                'id': payload.get('id') if 'payload' in locals() and isinstance(payload, dict) else None,
                'ok': False,
                'error': f'{error}\n{traceback.format_exc()}',
            })


if __name__ == '__main__':
    main()
