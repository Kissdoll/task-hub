import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = fileURLToPath(new URL('../', import.meta.url))
const indexFile = join(projectDirectory, 'dist', 'index.html')
const viteEntry = join(projectDirectory, 'node_modules', 'vite', 'bin', 'vite.js')
const preferredPort = 4173

function runNpm(...args) {
  const command = ['npm.cmd', ...args]
  const result = spawnSync('cmd.exe', ['/d', '/c', ...command], {
    cwd: projectDirectory,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(command.join(' ') + ' 执行失败')
}

function ensureDependencies() {
  if (existsSync(viteEntry)) return
  console.log('正在安装依赖…')
  runNpm('ci')
}

function localUrl(port) {
  return 'http://localhost:' + port + '/'
}

async function matchesBuild(url, indexHtml) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(1000),
    })
    return response.ok && (await response.text()).trim() === indexHtml
  } catch {
    return false
  }
}

async function findRunningPreview(indexHtml) {
  const urls = Array.from({ length: 10 }, (_, offset) => localUrl(preferredPort + offset))
  const matches = await Promise.all(urls.map(url => matchesBuild(url, indexHtml)))
  return urls[matches.indexOf(true)]
}

function openBrowser(url) {
  if (process.env.BROWSER === 'none') return
  const result = spawnSync('cmd.exe', ['/d', '/c', 'start', '""', url], {
    windowsHide: true,
    windowsVerbatimArguments: true,
  })
  if (result.error || result.status !== 0) {
    console.log('请在浏览器地址栏打开上面的网址。')
  }
}

async function start() {
  if (!existsSync(indexFile)) {
    ensureDependencies()
    console.log('正在打包 TaskHub…')
    runNpm('run', 'build')
  }

  const indexHtml = readFileSync(indexFile, 'utf8').trim()
  const existing = await findRunningPreview(indexHtml)
  if (existing) {
    console.log('TaskHub 正在运行  ' + existing)
    openBrowser(existing)
    return
  }

  ensureDependencies()
  const { preview } = await import('vite')
  const server = await preview({
    root: projectDirectory,
    preview: { host: 'localhost', port: preferredPort },
  })
  const url = localUrl(server.httpServer.address().port)
  console.log('TaskHub 已启动  ' + url)
  console.log('关闭此窗口或按 Ctrl+C 可停止服务。')
  openBrowser(url)
}

start().catch(error => {
  console.error('TaskHub 启动失败。' + error.message)
  process.exitCode = 1
})
