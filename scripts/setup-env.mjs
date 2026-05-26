import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { configStore } from '../services/config.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const pluginRoot = path.resolve(scriptDir, '..')
const isWindows = process.platform === 'win32'
const dryRun = process.argv.includes('--dry-run')
const standaloneReleaseApi = 'https://api.github.com/repos/astral-sh/python-build-standalone/releases/latest'

const paths = {
  pluginRoot,
  venvDir: path.join(pluginRoot, '.venv'),
  venvPython: path.join(pluginRoot, '.venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  requirementsFile: path.join(pluginRoot, 'python', 'requirements-cpu.txt'),
  configFile: path.join(pluginRoot, 'config', 'config.json'),
  standaloneRoot: path.join(pluginRoot, '.python-runtime'),
  standaloneHome: path.join(pluginRoot, '.python-runtime', 'python'),
  standaloneArchiveDir: path.join(pluginRoot, '.python-runtime', 'downloads'),
  standaloneExtractDir: path.join(pluginRoot, '.python-runtime', '.extract-tmp')
}

paths.standalonePython = isWindows
  ? path.join(paths.standaloneHome, 'python.exe')
  : path.join(paths.standaloneHome, 'bin', 'python3.11')

function log(message) {
  console.log(`[setup-env] ${message}`)
}

function fail(message) {
  console.error(`[setup-env] ${message}`)
  process.exit(1)
}

function exists(targetPath) {
  return fs.existsSync(targetPath)
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function removeDir(targetPath) {
  if (exists(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true })
  }
}

function run(command, args, options = {}) {
  const printable = [command, ...args].join(' ')
  log(`执行：${printable}`)

  if (dryRun) {
    return { status: 0 }
  }

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: pluginRoot,
    env: process.env,
    ...options
  })

  if (result.status !== 0) {
    fail(`命令执行失败：${printable}`)
  }

  return result
}

function request(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error(`重定向次数过多：${url}`))
      return
    }

    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'vits-yunzai-plugin/setup-env',
          Accept: 'application/vnd.github+json'
        }
      },
      (res) => {
        const { statusCode = 0, headers } = res

        if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
          const redirectedUrl = new URL(headers.location, url).toString()
          res.resume()
          resolve(request(redirectedUrl, redirectCount + 1))
          return
        }

        if (statusCode < 200 || statusCode >= 300) {
          const chunks = []
          res.on('data', (chunk) => chunks.push(chunk))
          res.on('end', () => {
            reject(
              new Error(
                `请求失败（${statusCode}）：${Buffer.concat(chunks)
                  .toString('utf8')
                  .slice(0, 300)}`
              )
            )
          })
          return
        }

        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      }
    )

    req.on('error', reject)
  })
}

async function fetchJson(url) {
  const body = await request(url)
  return JSON.parse(body.toString('utf8'))
}

async function downloadFile(url, destination) {
  const body = await request(url)
  fs.writeFileSync(destination, body)
}

function probePython(command, baseArgs = []) {
  const result = spawnSync(command, [...baseArgs, '-c', 'import sys; print(sys.version.split()[0])'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (result.status !== 0) {
    return null
  }

  const version = String(result.stdout || '').trim()
  if (!version.startsWith('3.11.')) {
    return null
  }

  return { command, baseArgs, version }
}

function resolveStandaloneTarget() {
  const overrides = {
    win32: {
      x64: 'x86_64-pc-windows-msvc',
      arm64: 'aarch64-pc-windows-msvc',
      ia32: 'i686-pc-windows-msvc'
    },
    linux: {
      x64: 'x86_64-unknown-linux-gnu',
      arm64: 'aarch64-unknown-linux-gnu'
    }
  }

  const target = overrides[process.platform]?.[process.arch]
  if (!target) {
    fail(
      `当前平台暂未内置自动下载 Python 3.11 的发行包映射：platform=${process.platform}, arch=${process.arch}。` +
        ' 请手动准备 Python 3.11，或后续为该平台补充下载映射。'
    )
  }

  return target
}

function findStandaloneExecutable(rootDir) {
  const candidates = [
    path.join(rootDir, 'python', 'python.exe'),
    path.join(rootDir, 'python', 'bin', 'python3.11'),
    path.join(rootDir, 'python', 'bin', 'python3'),
    path.join(rootDir, 'bin', 'python3.11'),
    path.join(rootDir, 'bin', 'python3'),
    path.join(rootDir, 'python.exe')
  ]

  return candidates.find((candidate) => exists(candidate)) || null
}

function detectStandalonePython311() {
  const executable = findStandaloneExecutable(paths.standaloneRoot)
  if (!executable) {
    return null
  }

  const matched = probePython(executable)
  if (!matched) {
    return null
  }

  return {
    ...matched,
    source: 'standalone'
  }
}

async function resolveStandaloneAsset() {
  if (process.env.SETUP_ENV_PYTHON_DOWNLOAD_URL) {
    const browserDownloadUrl = process.env.SETUP_ENV_PYTHON_DOWNLOAD_URL
    const parsed = new URL(browserDownloadUrl)
    return {
      name: path.basename(parsed.pathname),
      browser_download_url: browserDownloadUrl
    }
  }

  const target = resolveStandaloneTarget()
  const release = await fetchJson(standaloneReleaseApi)
  const matcher = new RegExp(`^cpython-3\\.11\\.\\d+\\+\\d{8}-${target}-install_only\\.tar\\.gz$`)
  const asset = release.assets?.find((item) => matcher.test(item.name))

  if (!asset) {
    fail(
      `未能在 ${release.tag_name || 'latest'} 中找到适用于 ${target} 的 Python 3.11 安装包。`
    )
  }

  return asset
}

async function ensureStandalonePython311() {
  const cached = detectStandalonePython311()
  if (cached) {
    log(`检测到项目内已缓存 Python 3.11：${cached.command} -> ${cached.version}`)
    return cached
  }

  log('未检测到系统 Python 3.11，准备下载项目内 Python 3.11 运行时')
  const asset = await resolveStandaloneAsset()
  const archivePath = path.join(paths.standaloneArchiveDir, asset.name)

  log(`匹配到发行包：${asset.name}`)
  log(`缓存目录：${paths.standaloneRoot}`)

  if (dryRun) {
    log(`dry-run：将下载 ${asset.browser_download_url}`)
    log(`dry-run：将解压到 ${paths.standaloneHome}`)
    return {
      command: paths.standalonePython,
      baseArgs: [],
      version: '3.11.x',
      source: 'standalone-dry-run'
    }
  }

  ensureDir(paths.standaloneArchiveDir)

  if (!exists(archivePath)) {
    log(`下载 Python 3.11 安装包到：${archivePath}`)
    await downloadFile(asset.browser_download_url, archivePath)
  } else {
    log(`复用已下载安装包：${archivePath}`)
  }

  removeDir(paths.standaloneExtractDir)
  ensureDir(paths.standaloneExtractDir)
  run('tar', ['-xzf', archivePath, '-C', paths.standaloneExtractDir])

  const extractedPythonDir = path.join(paths.standaloneExtractDir, 'python')
  if (!exists(extractedPythonDir)) {
    fail(`解压完成后未找到预期目录：${extractedPythonDir}`)
  }

  ensureDir(paths.standaloneRoot)
  removeDir(paths.standaloneHome)
  fs.renameSync(extractedPythonDir, paths.standaloneHome)
  removeDir(paths.standaloneExtractDir)

  const standalonePython = detectStandalonePython311()
  if (!standalonePython) {
    fail('已下载 Python 3.11，但启动探测失败，请检查解压结果是否完整。')
  }

  log(`项目内 Python 3.11 已就绪：${standalonePython.command} -> ${standalonePython.version}`)
  return standalonePython
}

function detectPython311() {
  const candidates = isWindows
    ? [
        ['py', ['-3.11']],
        ['python3.11', []],
        ['python', []]
      ]
    : [
        ['python3.11', []],
        ['python3', []],
        ['python', []]
      ]

  for (const [command, baseArgs] of candidates) {
    const matched = probePython(command, baseArgs)
    if (matched) {
      return {
        ...matched,
        source: 'system'
      }
    }
  }

  return null
}

function ensureConfigInitialized() {
  if (dryRun) {
    log(`将初始化配置文件：${paths.configFile}`)
    return
  }

  configStore.load()
  log(`配置文件已就绪：${paths.configFile}`)
}

async function main() {
  log(`项目根目录：${pluginRoot}`)
  if (dryRun) {
    log('当前为 dry-run 模式：只打印计划执行的步骤，不实际改动环境')
  }

  let python = detectPython311()
  if (python) {
    log(`检测到系统 Python 3.11：${python.command} ${python.baseArgs.join(' ')} -> ${python.version}`.trim())
  } else {
    python = await ensureStandalonePython311()
  }

  if (!exists(paths.venvPython)) {
    run(python.command, [...python.baseArgs, '-m', 'venv', paths.venvDir])
  } else {
    log(`已存在虚拟环境，跳过创建：${paths.venvDir}`)
  }

  run(paths.venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'])
  run(paths.venvPython, ['-m', 'pip', 'install', '-r', paths.requirementsFile])
  ensureConfigInitialized()

  log('环境初始化完成')
  log(`虚拟环境 Python：${paths.venvPython}`)
  log(`配置文件：${paths.configFile}`)
  if (python.source?.startsWith('standalone')) {
    log(`项目内 Python 运行时：${paths.standalonePython}`)
  }
  log('下一步：放置模型权重后，可运行独立启动命令或 verify-standalone 脚本继续验证')
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error))
})