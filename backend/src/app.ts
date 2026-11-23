import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler, notFound } from './middleware/errorHandler'
import routes from './routes'

const app = express()

// Behind Nginx the real visitor address is in X-Forwarded-For.
// Without this, the login rate limit would count all visitors as one.
app.set('trust proxy', env.TRUST_PROXY)

app.use(helmet()) // safe HTTP headers
app.use(cors({ origin: env.CLIENT_URL, credentials: true })) // only our frontend may call the API
app.use(express.json({ limit: '1mb' })) // read JSON request bodies
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev')) // request logging

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
