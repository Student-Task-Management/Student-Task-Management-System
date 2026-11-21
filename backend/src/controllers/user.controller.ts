import type { Request, Response } from 'express'
import { compare, hash } from 'bcryptjs'
import { currentUserId } from '../middleware/auth'
import { User } from '../models/User'
import { ApiError } from '../utils/ApiError'

export async function getProfile(req: Request, res: Response) {
  const user = await User.findById(currentUserId(req))
  if (!user) throw new ApiError(401, 'User no longer exists')
  res.json({ success: true, data: { user } })
}

export async function updateProfile(req: Request, res: Response) {
  const { name, email } = req.body
  const user = await User.findByIdAndUpdate(
    currentUserId(req),
    { name, email },
    { new: true, runValidators: true },
  )
  if (!user) throw new ApiError(401, 'User no longer exists')
  res.json({ success: true, data: { user } })
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(currentUserId(req)).select('+password')
  if (!user) throw new ApiError(401, 'User no longer exists')

  // 400, not 401: a wrong current password must not look like an expired session
  if (!(await compare(currentPassword, user.password))) {
    throw new ApiError(400, 'Current password is incorrect')
  }

  user.password = await hash(newPassword, 12)
  await user.save()
  res.json({ success: true, message: 'Password changed' })
}
