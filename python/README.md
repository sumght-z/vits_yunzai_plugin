# Python Environment

## Goal

为 `vits-yunzai-plugin` 提供一套可在项目目录内复现的 Python 运行环境方案。

## Confirmed

- 当前直接可见 Python 解释器为 3.13 系列，不适合旧版 VITS 依赖直接安装。
- 项目需要实际在仓库目录下创建独立 Python 环境，并将其写入部署文档。

## Chosen Strategy

- 环境管理工具：`venv`
- 环境位置：`vits-yunzai-plugin/.venv`
- Python 版本：`3.11`
- 依赖拆分：
  - `requirements-common.txt`：与平台无关的公共依赖
  - `requirements-cpu.txt`：CPU 版本推理依赖

## Recommended Create Commands

### 一键脚本

#### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\vits-yunzai-plugin\scripts\setup-env.ps1
```

#### Linux / macOS

```bash
bash ./vits-yunzai-plugin/scripts/setup-env.sh
```

脚本会自动执行：

- 若本机找不到 Python 3.11，则自动下载项目内可用的 Python 3.11 运行时到 `.python-runtime/`
- 创建 `.venv`
- 升级 `pip / setuptools / wheel`
- 安装 `requirements-cpu.txt`
- 初始化 `config/config.json`

补充说明：

- 自动下载源为 `astral-sh/python-build-standalone`
- `.python-runtime/` 仅用于给当前项目自举出可用的 Python 3.11，不替代最终 `.venv`

### Windows PowerShell

```powershell
<python311> -m venv .\vits-yunzai-plugin\.venv
.\vits-yunzai-plugin\.venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
.\vits-yunzai-plugin\.venv\Scripts\python.exe -m pip install -r .\vits-yunzai-plugin\python\requirements-cpu.txt
```

### Linux / macOS

```bash
python3.11 -m venv ./vits-yunzai-plugin/.venv
./vits-yunzai-plugin/.venv/bin/python -m pip install --upgrade pip setuptools wheel
./vits-yunzai-plugin/.venv/bin/python -m pip install -r ./vits-yunzai-plugin/python/requirements-cpu.txt
```

## Notes

- 这里优先固化 **CPU 可复现基线**，后续如需 CUDA 版本，可在此基础上增加 `requirements-cuda.txt`。
- 原始仓库中的 `vits/requirements.txt` 依赖版本过老，直接绑定 `torch==1.6.0`，不适合当前机器环境与复现目标，因此这里采用可在 Python 3.11 上管理的新依赖清单。
- 由于其他开发者机器上未必有 conda，复现基线统一改为 Python 自带的 `venv`。
