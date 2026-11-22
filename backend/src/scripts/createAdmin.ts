import { randomBytes } from 'node:crypto'
import { hash } from 'bcryptjs'
import { connectDb, disconnectDb } from '../config/db'
import { User } from '../models/User'

// Usage: npm run create-admin -- <email> [name] [password]
// or set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD in the environment.
async function main() {
  const [emailArg, nameArg, passwordArg] = process.argv.slice(2)
  const email = (emailArg ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase()
  const name = (nameArg ?? process.env.ADMIN_NAME)?.trim() || 'Administrator'
  const password = passwordArg ?? process.env.ADMIN_PASSWORD

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('A valid email is required.')
    process.exit(1)
  }
  if (password && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
    console.error('The password must be at least 8 characters and contain a letter and a number.')
    process.exit(1)
  }

  await connectDb()
  const existing = await User.findOne({ email })

  if (existing) {
    existing.role = 'admin'
    existing.disabled = false
    if (password) existing.password = await hash(password, 12)
    await existing.save()
    console.log(`${email} is now an administrator.${password ? ' The password was updated.' : ' The password was not changed.'}`)
  } else {
    // No password given: generate a random one and show it once
    const finalPassword = password ?? randomBytes(9).toString('base64url')
    await User.create({ name, email, password: await hash(finalPassword, 12), role: 'admin' })
    console.log(`Administrator created: ${email}`)
    if (!password) console.log(`Generated password: ${finalPassword}\nSave it now. It cannot be shown again.`)
  }

  await disconnectDb()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
