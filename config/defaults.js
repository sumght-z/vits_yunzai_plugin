import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = fileURLToPath(new URL('..', import.meta.url))
const isWindows = process.platform === 'win32'

export const defaultRelativePaths = {
  pythonExecutable: isWindows ? '.venv/Scripts/python.exe' : '.venv/bin/python',
  pythonWorker: 'python/tts_worker.py',
  vitsCwd: 'vits',
  modelsRoot: 'vits/models',
  outputDir: 'data/audio'
}

export const pluginPaths = {
  root: pluginRoot,
  configDir: path.join(pluginRoot, 'config'),
  configFile: path.join(pluginRoot, 'config', 'config.json'),
  webDir: path.join(pluginRoot, 'web'),
  outputDir: path.join(pluginRoot, defaultRelativePaths.outputDir),
  pythonWorker: path.join(pluginRoot, defaultRelativePaths.pythonWorker),
  pythonExecutable: path.join(pluginRoot, defaultRelativePaths.pythonExecutable),
  vitsCwd: path.join(pluginRoot, defaultRelativePaths.vitsCwd),
  modelsDir: path.join(pluginRoot, defaultRelativePaths.modelsRoot)
}

export const defaultConfig = {
  enabled: true,
  reply: {
    sendCommandAck: true,
    sendStatusText: true
  },
  limits: {
    maxTextLength: 200
  },
  server: {
    host: '127.0.0.1',
    port: 5091,
    apiEnabled: true,
    webEnabled: true
  },
  storage: {
    modelsRoot: defaultRelativePaths.modelsRoot
  },
  python: {
    executable: defaultRelativePaths.pythonExecutable,
    workerScript: defaultRelativePaths.pythonWorker
  },
  synthesis: {
    noiseScale: 0.667,
    noiseScaleW: 0.8,
    lengthScale: 1.2,
    outputDir: defaultRelativePaths.outputDir
  },
  models: {
    genshin: {
      key: 'genshin',
      label: '原神中文',
      cwd: defaultRelativePaths.vitsCwd,
      configPath: 'vits/configs/ys.json',
      checkpointPath: 'genshin/ys.pth',
      textProfile: 'genshin'
    },
    bh3: {
      key: 'bh3',
      label: '崩三中文',
      cwd: defaultRelativePaths.vitsCwd,
      configPath: 'vits/configs/bh3.json',
      checkpointPath: 'bh3/bh3.pth',
      textProfile: 'bh3'
    }
  }
}
