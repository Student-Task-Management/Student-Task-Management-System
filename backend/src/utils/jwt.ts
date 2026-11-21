import jwt from 'jsonwebtoken'
import { env } from '../config/env'

const DAY = 60 * 60 * 24

// "Remember me" keeps the token valid for 30 days instead of 1 day.
export function signToken(userId: string, remember = false): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: remember ? DAY * 30 : DAY })
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_SECRET)
  if (typeof payload === 'string' || !payload.sub) throw new Error('Invalid token')
  return payload.sub
}
