import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

// Checks req.body against a zod schema. Bad input becomes a 400 error.
export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return next(result.error)
    req.body = result.data // cleaned data: trimmed strings, defaults applied
    next()
  }
