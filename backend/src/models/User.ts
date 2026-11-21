import { Schema, model } from 'mongoose'
import { jsonOptions } from '../utils/modelJson'

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // select:false = hidden unless asked for
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonOptions },
)

export const User = model('User', userSchema)
