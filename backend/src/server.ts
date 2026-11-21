import app from './app'
import { connectDb, disconnectDb } from './config/db'
import { env } from './config/env'

async function start() {
  try {
    await connectDb()
  } catch (err) {
    console.error('Could not connect to MongoDB:', err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const server = app.listen(env.PORT, () => {
    console.log(`StudyFlow API running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })

  // Stop cleanly when Docker or the terminal asks the process to end
  function shutdown(signal: string) {
    console.log(`${signal} received, shutting down`)
    server.close(async () => {
      await disconnectDb()
      process.exit(0)
    })
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

void start()
