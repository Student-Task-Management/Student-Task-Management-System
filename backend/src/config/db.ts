import mongoose from 'mongoose'
import { env } from './env'

export async function connectDb() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  console.log('MongoDB connected')
}

export async function disconnectDb() {
  await mongoose.disconnect()
}
