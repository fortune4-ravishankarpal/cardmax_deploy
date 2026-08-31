import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { pathToFileURL } from 'url'

const SEEDERS_DIR = path.resolve(process.cwd(), 'src/seed/seeders')

async function main() {
  if (!fs.existsSync(SEEDERS_DIR)) {
    console.error(`Seeders directory not found at ${SEEDERS_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(SEEDERS_DIR).filter((file) => file.endsWith('.ts'))

  if (files.length === 0) {
    console.log('No seeders found.')
    process.exit(0)
  }

  console.log('\nAvailable Seeders:')
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`)
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  let selectedFile = null

  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question('\nSelect a seeder to run (number): ', resolve)
    })

    rl.close()

    const index = parseInt(answer) - 1
    if (isNaN(index) || index < 0 || index >= files.length) {
      console.error('Invalid selection.')
      process.exit(1)
    }

    selectedFile = files[index]
    const filePath = path.join(SEEDERS_DIR, selectedFile)

    console.log(`\nRunning seeder: ${selectedFile}...`)
    console.time(`\nRunning seeder: ${selectedFile}...`)
    const { getPayloadClient } = await import('@/lib/client')
    const payload = await getPayloadClient()

    try {
      // Dynamic import the selected seeder
      // We use the full path for import
      const seederModule = await import(pathToFileURL(filePath).href)

      // Find the exported function (assuming it's either default or a named export)
      const seedFunction =
        seederModule.default || Object.values(seederModule).find((val) => typeof val === 'function')

      if (typeof seedFunction !== 'function') {
        throw new Error(`Could not find a seed function in ${selectedFile}`)
      }

      await seedFunction(payload)
      console.log(`\n✅ Successfully ran seeder: ${selectedFile}`)
      process.exit(0)
    } catch (error) {
      console.error(`\n❌ Error running seeder ${selectedFile}:`, error)
      process.exit(1)
    }
  } catch (err) {
    console.error('\nAn error occurred:', err)
    rl.close()
    process.exit(1)
  } finally {
    console.timeEnd(`\nRunning seeder: ${selectedFile}...`)
  }
}

void main()
