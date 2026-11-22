import type { Request } from 'express'

// Removes empty values (?role=&q=) so optional filters can simply be left blank
export function cleanQuery(req: Request): Record<string, unknown> {
  return Object.fromEntries(Object.entries(req.query).filter(([, v]) => v !== ''))
}
