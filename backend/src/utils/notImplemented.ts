import type { NextFunction, Request, Response } from 'express'
import { ApiError } from './ApiError'

// Placeholder handler used until the real controllers are written in Phase 4.
export function notImplemented(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(501, 'This endpoint is not implemented yet'))
}
