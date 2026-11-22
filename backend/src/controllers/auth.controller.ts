import type { Request, Response } from 'express'
import { compare, hash } from 'bcryptjs'
import { currentUserId } from '../middleware/auth'
import { User } from '../models/User'
import { seedUserSubjects } from '../services/subjectCatalog'
import { ApiError } from '../utils/ApiError'
import { signToken } from '../utils/jwt'

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body

  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists')

  // Never store the plain password: bcrypt turns it into a one-way hash.
  // The role is not read from the request: sign-ups are always students.
  const user = await User.create({ name, email, password: await hash(password, 12) })
  await seedUserSubjects(user._id)

  res.status(201).json({ success: true, data: { user, token: signToken(user.id) } })
}

export async function login(req: Request, res: Response) {
  const { email, password, remember } = req.body

  const user = await User.findOne({ email }).select('+password')
  const valid = user ? await compare(password, user.password) : false

  // Same message for "no such email" and "wrong password" so attackers learn nothing
  if (!user || !valid) throw new ApiError(401, 'Invalid email or password')
  if (user.disabled) throw new ApiError(403, 'This account has been disabled. Please contact an administrator.')

  res.json({ success: true, data: { user, token: signToken(user.id, remember === true) } })
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(currentUserId(req))
  if (!user) throw new ApiError(401, 'User no longer exists')
  res.json({ success: true, data: { user } })
}
