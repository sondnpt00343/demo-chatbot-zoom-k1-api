const { PrismaClient } = require('../../generated/prisma/client/index.js')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')

function parseDatabaseUrl(url) {
  if (!url) throw new Error('DATABASE_URL is required')
  const parsed = new URL(url)
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '3306', 10),
    user: parsed.username || 'root',
    password: parsed.password || '',
    database: parsed.pathname?.slice(1) || '',
  }
}

const config = parseDatabaseUrl(process.env.DATABASE_URL)
const adapter = new PrismaMariaDb({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
})

const prisma = new PrismaClient({ adapter })

module.exports = { prisma }
