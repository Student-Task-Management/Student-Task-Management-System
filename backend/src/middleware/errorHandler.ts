import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { env } from '../config/env'
import { ApiError } from '../utils/ApiError'

// Runs when no route matched the request.
export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

// Every error ends up here, so every error response has the same JSON shape.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    })
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    })
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, message: `Invalid value for ${err.path}` })
  }

  // MongoDB code 11000 = a unique index was violated (duplicate email or subject name)
  if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
    const pattern = 'keyPattern' in err ? (err.keyPattern as Record<string, unknown>) : {}
    const message =
      'email' in pattern ? 'An account with this email already exists' : 'You already have a subject with this name'
    return res.status(409).json({ success: false, message })
  }

  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON' })
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message })
  }

  console.error(err)
  const message =
    env.NODE_ENV === 'production' || !(err instanceof Error) ? 'Internal server error' : err.message
  res.status(500).json({ success: false, message })
}
