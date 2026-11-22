import type { Request, RequestHandler } from 'express'
import { User } from '../models/User'
import { ApiError } from '../utils/ApiError'
import { verifyToken } from '../utils/jwt'

// Protects a route: the request must carry "Authorization: Bearer <token>".
// The user is loaded from the database on every request, so disabling or
// deleting an account takes effect immediately, even with a valid token.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required')

  let userId: string
  try {
    userId = verifyToken(header.slice(7))
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  const user = await User.findById(userId).select('role disabled')
  if (!user) throw new ApiError(401, 'User no longer exists')
  if (user.disabled) throw new ApiError(401, 'This account has been disabled')

  req.userId = userId
  req.userRole = user.role === 'admin' ? 'admin' : 'user'
  next()
}

// Use after requireAuth on routes that only administrators may call
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.userRole !== 'admin') throw new ApiError(403, 'Admin access required')
  next()
}

// Use inside controllers to get the logged-in user's id
export function currentUserId(req: Request): string {
  if (!req.userId) throw new ApiError(401, 'Authentication required')
  return req.userId
}
