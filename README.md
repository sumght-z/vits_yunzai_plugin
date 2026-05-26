# vits-yunzai-plugin

一个聚焦 **中文本地语音推理** 的 Yunzai 插件二开版本。方便快捷，自带一键环境安装，适配网页api调用。

项目生成效果演示：https://www.bilibili.com/video/BV1ke4y1p7qq

qq群：433567006

当前版本仅保留：

- 原神中文语音
- 崩三中文语音
- 内置 HTTP API
- 最小 Web 试听页

不再保留旧版远程接口音色链路。

## 当前状态

- 已完成原神 / 崩三统一运行入口收敛
- 已完成常驻 Python Worker 改造，避免每次请求重新加载模型
- 已完成独立端到端验证：直连合成、API、音频获取、Web 首页均已通过
- 已支持通过相对路径配置进行可移植部署

## 目录约定

默认模型目录：

- `vits/models/genshin/ys.pth`
- `vits/models/bh3/bh3.pth`

默认 Python 环境：

- Windows：`.venv/Scripts/python.exe`
- Linux：`.venv/bin/python`

默认配置文件：

- `config/config.json`

## 配置说明

当前配置已支持 **相对路径持久化**。

默认配置示例：

```json
{
  "enabled": true,
  "server": {
    "host": "127.0.0.1",
    "port": 5091,
    "apiEnabled": true,
    "webEnabled": true
  },
  "storage": {
    "modelsRoot": "vits/models"
  },
  "python": {
    "executable": ".venv/Scripts/python.exe",
    "workerScript": "python/tts_worker.py"
  },
  "synthesis": {
    "outputDir": "data/audio"
  },
  "models": {
    "genshin": {
      "cwd": "vits",
      "configPath": "vits/configs/ys.json",
      "checkpointPath": "genshin/ys.pth"
    },
    "bh3": {
      "cwd": "vits",
      "configPath": "vits/configs/bh3.json",
      "checkpointPath": "bh3/bh3.pth"
    }
  }
}
```

说明：

- `storage.modelsRoot` 是模型挂载根目录
- `checkpointPath` 默认相对 `storage.modelsRoot` 解析
- 若你需要把模型放到插件目录外，也可以把 `checkpointPath` 改成绝对路径或显式 `./` 相对插件根目录的路径
- 配置落盘时会优先保留可移植的相对路径形式

## 安装步骤

### 1. 放置插件

将插件放到 Yunzai 的插件目录中。

### 2. 创建项目内 Python 环境

推荐直接使用一键脚本（在yunzai插件目录使用powershell输入）：

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\vits-yunzai-plugin\scripts\setup-env.ps1
```

Linux：

```bash
bash ./vits-yunzai-plugin/scripts/setup-env.sh
```

脚本默认会完成：

- 若本机找不到 Python 3.11，则自动下载一份项目内可用的 Python 3.11 运行时（缓存到 `.python-runtime/`）
- 创建 `.venv`
- 升级 `pip / setuptools / wheel`
- 安装 `python/requirements-cpu.txt`
- 初始化 `config/config.json`（若不存在）

说明：

- 自动下载的 Python 运行时来自 `astral-sh/python-build-standalone` 发布包
- 当前脚本会按当前平台 / 架构自动匹配对应安装包；若你已经自行安装了 Python 3.11，则优先复用系统解释器
- `.python-runtime/` 仅作为项目内自举运行时缓存，不影响最终 `.venv` 的使用方式

如需手动执行，也可以继续使用下面的命令：

Windows：

```powershell
py -3.11 -m venv .\vits-yunzai-plugin\.venv
.\vits-yunzai-plugin\.venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
.\vits-yunzai-plugin\.venv\Scripts\python.exe -m pip install -r .\vits-yunzai-plugin\python\requirements-cpu.txt
```

Linux：

```bash
python3.11 -m venv ./vits-yunzai-plugin/.venv
./vits-yunzai-plugin/.venv/bin/python -m pip install --upgrade pip setuptools wheel
./vits-yunzai-plugin/.venv/bin/python -m pip install -r ./vits-yunzai-plugin/python/requirements-cpu.txt
```

### 3. 放置模型权重

- 原神：`vits/models/genshin/ys.pth`
- 崩三：`vits/models/bh3/bh3.pth`

### 4. 启动并验证

如果你希望先脱离 Yunzai 验证完整链路，可直接运行：

```bash
node vits-yunzai-plugin/scripts/verify-standalone.mjs
```

验证通过后，再接回 Yunzai 侧联调。

如果你希望**不启动 Yunzai，直接独立启动服务**，可运行：

```bash
node vits-yunzai-plugin/scripts/start-standalone.mjs api
node vits-yunzai-plugin/scripts/start-standalone.mjs web
node vits-yunzai-plugin/scripts/start-standalone.mjs all
```

说明：

- `api`：仅启动 HTTP API
- `web`：启动 Web 页面；由于当前 Web 页面依赖 `/api/*`，因此会同时启动 API
- `all`：同时启动 API 与 Web
- 停止方式：在当前终端按 `Ctrl + C`

## 使用说明

### Yunzai 命令

- `音色列表`：查看当前可用音色
- `语音状态`：查看语音 / API / Web / worker 状态
- `角色名说文本`：生成语音
- `开启语音`
- `关闭语音`
- `开启API` / `关闭API`
- `开启Web` / `关闭Web`

### HTTP API

默认地址：`http://127.0.0.1:5091`

- `GET /api/health`
- `GET /api/speakers`
- `POST /api/synthesize`
- `GET /api/audio/:filename`

### Web 页面

- `GET /`

### 独立启动命令

- `node vits-yunzai-plugin/scripts/start-standalone.mjs api`
- `node vits-yunzai-plugin/scripts/start-standalone.mjs web`
- `node vits-yunzai-plugin/scripts/start-standalone.mjs all`

## 独立验证结果

当前已确认以下链路可用：

- 原神直连合成
- 崩三直连合成
- `GET /api/health`
- `GET /api/speakers`
- `POST /api/synthesize`
- `GET /api/audio/:filename`
- `GET /`

## 已知说明

- Python Worker 首次真实合成时按模型懒加载
- Windows 下已通过 `-X utf8`、`PYTHONIOENCODING=utf-8`、`PYTHONUTF8=1` 修复 Node → Python 中文管道编码问题
- `jieba`、checkpoint 等日志当前仍会输出到 Worker 日志，但不影响功能
- 历史 `vits_bh3/` 目录已从当前仓库清理；崩三能力现统一由 `vits/` 运行核心承载

## 参考文档

- `用户使用.md`
- `python/README.md`
- `../docs/DEPLOY.md`
- `../docs/HANDOFF.md`
- `../docs/API.md`
