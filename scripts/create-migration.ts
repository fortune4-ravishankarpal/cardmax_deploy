import { execSync } from 'child_process'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const getMigrationName = (): Promise<string> => {
  return new Promise((resolve) => {
    rl.question('Enter a summary for this migration (e.g. add_users_table): ', (answer) => {
      resolve(answer.trim().replace(/\s+/g, '_'))
      rl.close()
    })
  })
}

async function run() {
  try {
    let name = process.argv[2]

    if (!name) {
      name = await getMigrationName()
    }

    if (!name) {
      console.error('❌ Migration name is required.')
      process.exit(1)
    }

    console.log(`\n🚀 Creating migration: ${name}...\n`)

    // execSync inherits stdio so the user can see the output/prompts from Payload
    execSync(`npx payload migrate:create ${name}`, { stdio: 'inherit' })

    console.log('\n✅ Migration created successfully!')
  } catch (error) {
    console.error('\n❌ Failed to create migration.')
    process.exit(1)
  }
}

run()
