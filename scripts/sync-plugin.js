import fs from 'node:fs'
import path from 'node:path'

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------
const projectRoot = process.cwd()

// Configurable static source location for plugins
const pluginSourceRootDir = path.resolve(
  process.env.PLUGIN_ROOT_DIR ??
    path.join(projectRoot, '..', '..', 'payload-plugin', 'create-custom-plugin')
)

// Base directory in your project where synced plugins will be copied
const projectPluginsBaseDir = path.join(projectRoot, 'src', 'plugins')

// Scope prefix for path aliases (e.g. "@payload-pln/plugin-name")
const packageScope = '@payload-pln'

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
const copyRecursive = (source, destination) => {
  fs.cpSync(source, destination, { recursive: true, force: true })
}

const replaceInFile = (file, replacements) => {
  if (!fs.existsSync(file)) return
  let content = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) content = content.replace(from, to)
  fs.writeFileSync(file, content)
}

const getAvailablePlugins = () => {
  if (!fs.existsSync(pluginSourceRootDir)) {
    throw new Error(`Plugin root directory does not exist: ${pluginSourceRootDir}`)
  }

  return fs
    .readdirSync(pluginSourceRootDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
}

const syncPlugin = (pluginName) => {
  const pluginSourceDir = path.join(pluginSourceRootDir, pluginName, 'src')
  const projectPluginTargetDir = path.join(projectPluginsBaseDir, pluginName)

  if (!fs.existsSync(pluginSourceDir)) {
    throw new Error(`Source 'src' folder not found for plugin '${pluginName}' at ${pluginSourceDir}`)
  }

  // 1. Copy source code locally
  copyRecursive(pluginSourceDir, projectPluginTargetDir)

  // 2. Perform path adjustments dynamically
  const indexPath = path.join(projectPluginTargetDir, 'index.ts')
  replaceInFile(indexPath, [
    [
      new RegExp(`${packageScope}/${pluginName}/client`, 'g'),
      `@/plugins/${pluginName}/exports/client`,
    ],
  ])

  // Strips any relative `.js` import extensions dynamically (e.g., from './components/Foo.js' to './components/Foo')
  const clientExportPath = path.join(projectPluginTargetDir, 'exports', 'client.ts')
  replaceInFile(clientExportPath, [
    [/from\s+['"](\.\.\/[^'"]+)\.js['"]/g, "from '$1'"],
  ])

  console.log(`Successfully synced '${pluginName}' to ${projectPluginTargetDir}`)
  console.log('Run: pnpm generate:importmap')
}

// -----------------------------------------------------------------------------
// EXECUTION & CLI HANDLER
// -----------------------------------------------------------------------------
const showHelp = (availablePlugins) => {
  console.log(`Usage: node scripts/sync-plugin.js <plugin-name>\n`)
  console.log(`Source Location: ${pluginSourceRootDir}\n`)
  console.log(`Available Plugins:`)
  if (availablePlugins.length === 0) {
    console.log(`  (No plugins found in source location)`)
  } else {
    availablePlugins.forEach((name) => console.log(`  - ${name}`))
  }
}

try {
  const availablePlugins = getAvailablePlugins()
  const targetPlugin = process.argv[2]

  if (!targetPlugin || targetPlugin === '--help' || targetPlugin === '-h') {
    showHelp(availablePlugins)
    process.exit(0)
  }

  if (!availablePlugins.includes(targetPlugin)) {
    console.error(`Error: Plugin '${targetPlugin}' not found.`)
    showHelp(availablePlugins)
    process.exit(1)
  }

  syncPlugin(targetPlugin)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}