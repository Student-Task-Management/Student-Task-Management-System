import { promises as fsp } from 'node:fs'
import nodePath from 'node:path'
import { AVATAR_DIR } from '../middleware/upload'
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

// ---------- Profile picture ----------
async function looksLikeImage(file: string) {
  const fh = await fsp.open(file, 'r')
  try {
    const buf = Buffer.alloc(12)
    await fh.read(buf, 0, 12, 0)
    const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP'
    return jpeg || png || webp
  } finally {
    await fh.close()
  }
}

async function deleteAvatarFile(url?: string) {
  if (!url) return
  await fsp.unlink(nodePath.join(AVATAR_DIR, nodePath.basename(url))).catch(() => {})
}

export async function updateAvatar(req: Request, res: Response) {
  const file = req.file
  if (!file) throw new ApiError(400, 'Please choose an image to upload')

  // The browser's file type can be faked, so check the real file signature too
  if (!(await looksLikeImage(file.path))) {
    await fsp.unlink(file.path).catch(() => {})
    throw new ApiError(400, 'Only JPG, PNG or WebP images are allowed')
  }

  const user = await User.findById(currentUserId(req))
  if (!user) {
    await fsp.unlink(file.path).catch(() => {})
    throw new ApiError(401, 'User no longer exists')
  }

  const previous = user.avatar
  user.avatar = `/api/uploads/avatars/${file.filename}`
  await user.save()
  await deleteAvatarFile(previous)
  res.json({ success: true, data: { user } })
}

export async function removeAvatar(req: Request, res: Response) {
  const user = await User.findById(currentUserId(req))
  if (!user) throw new ApiError(401, 'User no longer exists')
  const previous = user.avatar
  user.avatar = ''
  await user.save()
  await deleteAvatarFile(previous)
  res.json({ success: true, data: { user } })
}