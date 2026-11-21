import type { Request, Response } from 'express'
import { compare, hash } from 'bcryptjs'
import { currentUserId } from '../middleware/auth'
import { Subject } from '../models/Subject'
import { User } from '../models/User'
import { ApiError } from '../utils/ApiError'
import { signToken } from '../utils/jwt'

// Every new account starts with these subjects (delete the list to turn this off)
const DEFAULT_SUBJECTS = [
  { name: 'Programming', color: '#6366f1', description: 'Web development and coding labs' },
  { name: 'Database', color: '#0ea5e9', description: 'SQL, ER diagrams and MongoDB' },
  { name: 'English', color: '#f59e0b', description: 'Essays, reports and presentations' },
  { name: 'Networking', color: '#10b981', description: 'Protocols, subnetting and topology' },
  { name: 'Mathematics', color: '#ec4899', description: 'Calculus and linear algebra' },
]

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body

  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists')

  // Never store the plain password: bcrypt turns it into a one-way hash
  const user = await User.create({ name, email, password: await hash(password, 12) })
  await Subject.insertMany(DEFAULT_SUBJECTS.map((s) => ({ ...s, userId: user._id })))

  res.status(201).json({ success: true, data: { user, token: signToken(user.id) } })
}

export async function login(req: Request, res: Response) {
  const { email, password, remember } = req.body

  const user = await User.findOne({ email }).select('+password')
  const valid = user ? await compare(password, user.password) : false

  // Same message for "no such email" and "wrong password" so attackers learn nothing
  if (!user || !valid) throw new ApiError(401, 'Invalid email or password')

  res.json({ success: true, data: { user, token: signToken(user.id, remember === true) } })
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(currentUserId(req))
  if (!user) throw new ApiError(401, 'User no longer exists')
  res.json({ success: true, data: { user } })
}
