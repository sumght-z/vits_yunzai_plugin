import importlib


def load_text_profile(name):
    return importlib.import_module(f'{__name__}.{name}')