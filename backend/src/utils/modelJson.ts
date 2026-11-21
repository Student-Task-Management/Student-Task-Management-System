// Shared by all models: send "id" instead of "_id", and never send the password.
export const jsonOptions = {
  versionKey: false,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = String(ret._id)
    delete ret._id
    delete ret.password
    return ret
  },
}
