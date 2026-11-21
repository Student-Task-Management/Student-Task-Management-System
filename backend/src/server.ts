import app from './app'
import { env } from './config/env'

const server = app.listen(env.PORT, () => {
  console.log(`StudyFlow API running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

// Stop cleanly when Docker or the terminal asks the process to end
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`)
  server.close(() => process.exit(0))
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
