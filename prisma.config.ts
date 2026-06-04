import { defineConfig } from 'prisma/config'
import { configDotenv } from 'dotenv'

configDotenv({ path: '.env' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
