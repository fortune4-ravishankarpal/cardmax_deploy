import fs from 'node:fs'
import path from 'node:path'

// CONFIGURATION: Adjust these paths for any plugin or project
const CONFIG = {
  // Source: Local plugin repository source directory
  pluginSrcDir: 'C:\\Users\\Developer\\Desktop\\project\\payload-plugin\\create-custom-plugin\\soft-delete\\src',
  // Target: Payload project destination directory
  projectTargetDir: 'C:\\Users\\Developer\\Desktop\\project\\card-max\\cardmax-payload\\src\\plugins\\soft-delete',
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = stats && stats.isDirectory()

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName))
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

try {
  console.log(` Syncing plugin code...`)
  console.log(`  From: ${CONFIG.pluginSrcDir}`)
  console.log(`  To:   ${CONFIG.projectTargetDir}`)

  copyRecursiveSync(CONFIG.pluginSrcDir, CONFIG.projectTargetDir)

  console.log(' Sync completed successfully!')
} catch (error) {
  console.error(' Failed to sync plugin files:', error)
  process.exit(1)
}