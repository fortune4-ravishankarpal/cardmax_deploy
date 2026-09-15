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

// Recursively fetches all source files (.ts, .tsx, .js, .jsx) in a folder
const getAllSourceFiles = (dirPath, arrayOfFiles = []) => {
  if (!fs.existsSync(dirPath)) return arrayOfFiles

  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllSourceFiles(fullPath, arrayOfFiles)
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

// Automatically cleans relative .js imports across all files in the synced plugin folder
const cleanRelativeJsImports = (targetDir) => {
  const files = getAllSourceFiles(targetDir)

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8')

    // Matches relative imports ending with .js (e.g., from './tasks/anonymizeTask.js' -> from './tasks/anonymizeTask')
    const updatedContent = content.replace(
      /from\s+(['"])(\.\.?\/[^'"]+)\.js\1/g,
      'from $1$2$1'
    )

    if (content !== updatedContent) {
      fs.writeFileSync(file, updatedContent)
    }
  })
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

  // 2. Adjust package path mapping if index.ts exists
  const indexPath = path.join(projectPluginTargetDir, 'index.ts')
  replaceInFile(indexPath, [
    [
      new RegExp(`${packageScope}/${pluginName}/client`, 'g'),
      `@/plugins/${pluginName}/exports/client`,
    ],
  ])

  // 3. Remove all explicit .js extensions from relative imports across ALL .ts/.tsx files
  cleanRelativeJsImports(projectPluginTargetDir)

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