// Lets TypeScript know that our auth middleware adds userId and userRole to the request.
declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: 'user' | 'admin'
    }
  }
}

export {}
