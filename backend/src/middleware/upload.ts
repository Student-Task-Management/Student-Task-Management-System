import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ApiError } from '../utils/ApiError'

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
export const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars')
mkdirSync(AVATAR_DIR, { recursive: true })

// The file name is random and the extension comes from the checked type, never from the user's file name
const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (_req, file, cb) => cb(null, randomUUID() + EXT[file.mimetype]),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXT[file.mimetype]) cb(null, true)
    else cb(new ApiError(400, 'Only JPG, PNG or WebP images are allowed'))
  },
})

export function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  upload.single('avatar')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2 MB or smaller' : 'Upload failed'
      return next(new ApiError(400, msg))
    }
    next(err)
  })
}