import { ApiError } from './ApiError'

const OBJECT_ID = /^[a-f\d]{24}$/i

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID.test(value)

// A malformed id can never match anything, so it is simply "not found".
export function requireObjectId(value: unknown, what: string): string {
  if (!isObjectId(value)) throw new ApiError(404, `${what} not found`)
  return value
}
