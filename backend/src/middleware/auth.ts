import type { Request, RequestHandler } from 'express'
import { User } from '../models/User'
import { ApiError } from '../utils/ApiError'
import { verifyToken } from '../utils/jwt'

// Protects a route: the request must carry "Authorization: Bearer <token>".
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required')

  let userId: string
  try {
    userId = verifyToken(header.slice(7))
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  if (!(await User.exists({ _id: userId }))) throw new ApiError(401, 'User no longer exists')

  req.userId = userId
  next()
}

// Use inside controllers to get the logged-in user's id
export function currentUserId(req: Request): string {
  if (!req.userId) throw new ApiError(401, 'Authentication required')
  return req.userId
}
