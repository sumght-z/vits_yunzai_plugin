import fs from 'node:fs'
import path from 'node:path'
import { defaultConfig, pluginPaths } from '../config/defaults.js'

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function mergeDeep(base, extra) {
  if (!isObject(base) || !isObject(extra)) {
    return extra === undefined ? base : extra
  }

  const output = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    output[key] = key in base ? mergeDeep(base[key], value) : value
  }
  return output
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function replaceObject(target, source) {
  for (const key of Object.keys(target)) {
    delete target[key]
  }
  Object.assign(target, source)
  return target
}

function normalizePathLike(value) {
  return typeof value === 'string' ? value.replace(/\\/g, '/').toLowerCase() : ''
}

function normalizePortablePath(value) {
  return typeof value === 'string' ? value.replace(/\\/g, '/').trim() : ''
}

function isExplicitPluginRelative(value) {
  return typeof value === 'string' && /^(\.\/|\.\.\/)/.test(normalizePortablePath(value))
}

function relativeIfInside(basePath, targetPath) {
  const relative = path.relative(basePath, targetPath)
  if (relative === '') return ''
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null
  return normalizePortablePath(relative)
}

function makePluginRootPortablePath(value, fallback) {
  const nextValue = typeof value === 'string' ? value.trim() : ''
  if (!nextValue) return fallback
  if (!path.isAbsolute(nextValue)) return normalizePortablePath(nextValue)

  const relative = relativeIfInside(pluginPaths.root, nextValue)
  return relative ?? path.normalize(nextValue)
}

function makeCheckpointPortablePath(value, modelsRoot, fallback) {
  const nextValue = typeof value === 'string' ? value.trim() : ''
  if (!nextValue) return fallback

  if (!path.isAbsolute(nextValue)) {
    const portableValue = normalizePortablePath(nextValue)
    const normalizedModelsRoot = normalizePortablePath(modelsRoot).replace(/^\.\//, '')
    if (portableValue.startsWith(`${normalizedModelsRoot}/`)) {
      return portableValue.slice(normalizedModelsRoot.length + 1)
    }
    return portableValue
  }

  const resolvedModelsRoot = resolveFromPluginRoot(modelsRoot)
  const relativeToModelsRoot = relativeIfInside(resolvedModelsRoot, nextValue)
  if (relativeToModelsRoot) return relativeToModelsRoot

  const relativeToPluginRoot = relativeIfInside(pluginPaths.root, nextValue)
  if (relativeToPluginRoot) return `./${relativeToPluginRoot}`

  return path.normalize(nextValue)
}

function resolveFromPluginRoot(value) {
  if (path.isAbsolute(value)) return path.normalize(value)
  return path.normalize(path.resolve(pluginPaths.root, value))
}

function resolveCheckpointPath(value, modelsRoot) {
  if (path.isAbsolute(value)) return path.normalize(value)

  const portableValue = normalizePortablePath(value)
  if (isExplicitPluginRelative(portableValue)) {
    return path.normalize(path.resolve(pluginPaths.root, portableValue))
  }

  return path.normalize(path.resolve(resolveFromPluginRoot(modelsRoot), portableValue))
}

function createRuntimeConfig(rawConfig) {
  const runtimeConfig = structuredClone(rawConfig)
  runtimeConfig.storage.modelsRoot = resolveFromPluginRoot(rawConfig.storage.modelsRoot)
  runtimeConfig.python.executable = resolveFromPluginRoot(rawConfig.python.executable)
  runtimeConfig.python.workerScript = resolveFromPluginRoot(rawConfig.python.workerScript)
  runtimeConfig.synthesis.outputDir = resolveFromPluginRoot(rawConfig.synthesis.outputDir)

  runtimeConfig.models = Object.fromEntries(
    Object.entries(rawConfig.models).map(([modelKey, modelConfig]) => [
      modelKey,
      {
        ...modelConfig,
        cwd: resolveFromPluginRoot(modelConfig.cwd),
        configPath: resolveFromPluginRoot(modelConfig.configPath),
        checkpointPath: resolveCheckpointPath(modelConfig.checkpointPath, rawConfig.storage.modelsRoot)
      }
    ])
  )

  return runtimeConfig
}

function isLegacyModelPath(value, fragments) {
  const normalized = normalizePathLike(value)
  return fragments.some(fragment => normalized.includes(fragment))
}

function normalizeModelConfig(modelKey, currentModel, defaultModel, modelsRoot) {
  const nextModel = mergeDeep(defaultModel, currentModel || {})

  if (modelKey === 'genshin') {
    if (isLegacyModelPath(nextModel.checkpointPath, ['/vits/ys/ys.pth'])) {
      nextModel.checkpointPath = defaultModel.checkpointPath
    }
  }

  if (modelKey === 'bh3') {
    if (isLegacyModelPath(nextModel.cwd, ['/vits_bh3'])) {
      nextModel.cwd = defaultModel.cwd
    }
    if (isLegacyModelPath(nextModel.configPath, ['/vits_bh3/configs/bh3.json'])) {
      nextModel.configPath = defaultModel.configPath
    }
    if (isLegacyModelPath(nextModel.checkpointPath, ['/vits_bh3/bh3/bh3.pth'])) {
      nextModel.checkpointPath = defaultModel.checkpointPath
    }
  }

  nextModel.cwd = makePluginRootPortablePath(nextModel.cwd, defaultModel.cwd)
  nextModel.configPath = makePluginRootPortablePath(nextModel.configPath, defaultModel.configPath)
  nextModel.checkpointPath = makeCheckpointPortablePath(nextModel.checkpointPath, modelsRoot, defaultModel.checkpointPath)

  if (!nextModel.textProfile) {
    nextModel.textProfile = defaultModel.textProfile
  }

  return nextModel
}

function normalizeLoadedConfig(config) {
  const nextConfig = mergeDeep(defaultConfig, config || {})
  nextConfig.storage = mergeDeep(defaultConfig.storage, nextConfig.storage || {})
  nextConfig.storage.modelsRoot = makePluginRootPortablePath(nextConfig.storage.modelsRoot, defaultConfig.storage.modelsRoot)
  nextConfig.python.executable = makePluginRootPortablePath(nextConfig.python.executable, defaultConfig.python.executable)
  nextConfig.python.workerScript = makePluginRootPortablePath(nextConfig.python.workerScript, defaultConfig.python.workerScript)
  nextConfig.synthesis.outputDir = makePluginRootPortablePath(nextConfig.synthesis.outputDir, defaultConfig.synthesis.outputDir)
  nextConfig.models = Object.fromEntries(
    Object.entries(defaultConfig.models).map(([modelKey, defaultModel]) => [
      modelKey,
      normalizeModelConfig(modelKey, nextConfig.models?.[modelKey], defaultModel, nextConfig.storage.modelsRoot)
    ])
  )
  return nextConfig
}

export class PluginConfigStore {
  constructor() {
    this.filePath = pluginPaths.configFile
    this.config = null
    this.rawConfig = null
  }

  persist(rawConfig) {
    const runtimeConfig = createRuntimeConfig(rawConfig)
    ensureDirectory(path.dirname(this.filePath))
    ensureDirectory(runtimeConfig.synthesis.outputDir)
    fs.writeFileSync(this.filePath, JSON.stringify(rawConfig, null, 2), 'utf8')
    return runtimeConfig
  }

  load() {
    if (this.config) return this.config

    ensureDirectory(path.dirname(this.filePath))

    if (!fs.existsSync(this.filePath)) {
      this.rawConfig = normalizeLoadedConfig(structuredClone(defaultConfig))
      this.config = this.persist(this.rawConfig)
      return this.config
    }

    const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
    this.rawConfig = normalizeLoadedConfig(raw)
    this.config = this.persist(this.rawConfig)
    return this.config
  }

  save(nextConfig) {
    const merged = normalizeLoadedConfig(nextConfig)
    const runtimeConfig = this.persist(merged)
    if (this.rawConfig) {
      this.rawConfig = replaceObject(this.rawConfig, merged)
    } else {
      this.rawConfig = merged
    }
    if (this.config) {
      this.config = replaceObject(this.config, runtimeConfig)
    } else {
      this.config = runtimeConfig
    }
    return this.config
  }

  update(patch) {
    this.load()
    return this.save(mergeDeep(structuredClone(this.rawConfig), patch))
  }
}

export const configStore = new PluginConfigStore()
