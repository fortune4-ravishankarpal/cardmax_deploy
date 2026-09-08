import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const projectRoot = process.cwd()
const pluginRoot = path.resolve(
  process.env.SOFT_DELETE_PLUGIN_ROOT ??
    path.join(projectRoot, '..', '..', 'payload-plugin', 'create-custom-plugin', 'soft-delete'),
)
const projectPluginDir = path.join(projectRoot, 'src', 'plugins', 'soft-delete')
const pluginSourceDir = path.join(pluginRoot, 'src')
const localWrapper = path.join(projectRoot, 'src', 'plugins', 'softDelete.ts')
const packageName = '@payload-pln/soft-delete'

const usage = `Usage:
  node scripts/sync-plugin.js local    Copy plugin source into this app
  node scripts/sync-plugin.js package  Use the installed npm package

Environment:
  SOFT_DELETE_PLUGIN_ROOT  Override the plugin repository path
`

const copyRecursive = (source, destination) => {
  fs.cpSync(source, destination, { recursive: true, force: true })
}

const replaceInFile = (file, replacements) => {
  let content = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) content = content.replace(from, to)
  fs.writeFileSync(file, content)
}

const setLocalMode = () => {
  if (!fs.existsSync(pluginSourceDir)) {
    throw new Error(`Plugin source directory does not exist: ${pluginSourceDir}`)
  }

  copyRecursive(pluginSourceDir, projectPluginDir)
  replaceInFile(path.join(projectPluginDir, 'index.ts'), [
    [
      "return `@payload-pln/soft-delete/client#${componentName}`",
      "return `@/plugins/soft-delete/exports/client#${componentName}`",
    ],
  ])
  replaceInFile(path.join(projectPluginDir, 'exports', 'client.ts'), [
    ["'../components/SoftDeleteCell.js'", "'../components/SoftDeleteCell'"],
    ["'../components/SoftDeleteButton.js'", "'../components/SoftDeleteButton'"],
  ])

  console.log(`Synced plugin source to ${projectPluginDir}`)
  console.log('Run: pnpm generate:importmap')
}

const setPackageMode = () => {
  replaceInFile(localWrapper, [
    ["from './soft-delete/index'", `from '${packageName}'`],
  ])

  const require = createRequire(import.meta.url)
  try {
    require.resolve(`${packageName}/client`)
  } catch {
    throw new Error(
      `${packageName} is not installed. Install it first with: pnpm add ${packageName}`,
    )
  }

  console.log(`Configured this app to use ${packageName}`)
  console.log('Run: pnpm generate:importmap')
}


const mode = process.argv[2]

if (!mode || !['local','package'].includes(mode)) {
  console.error(usage)
  process.exit(1)
}

try {
  if (mode === 'local') setLocalMode()
  if (mode === 'package') setPackageMode()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}