import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { plugins } from './plugins'
import { env } from './lib/env'
import { emailConfig } from './configs/payload/email'
import { collectionsConfigs } from './collections'
import { adminConfig } from './configs/payload/admin'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: adminConfig,
  email: emailConfig,
  collections: collectionsConfigs,
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    idType: "uuidv7"
  }),
  sharp,
  plugins: plugins,
})
