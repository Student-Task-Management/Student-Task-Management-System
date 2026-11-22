"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const bcryptjs_1 = require("bcryptjs");
const db_1 = require("../config/db");
const User_1 = require("../models/User");
// Usage: npm run create-admin -- <email> [name] [password]
// or set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD in the environment.
async function main() {
    const [emailArg, nameArg, passwordArg] = process.argv.slice(2);
    const email = (emailArg ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase();
    const name = (nameArg ?? process.env.ADMIN_NAME)?.trim() || 'Administrator';
    const password = passwordArg ?? process.env.ADMIN_PASSWORD;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error('A valid email is required.');
        process.exit(1);
    }
    if (password && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
        console.error('The password must be at least 8 characters and contain a letter and a number.');
        process.exit(1);
    }
    await (0, db_1.connectDb)();
    const existing = await User_1.User.findOne({ email });
    if (existing) {
        existing.role = 'admin';
        existing.disabled = false;
        if (password)
            existing.password = await (0, bcryptjs_1.hash)(password, 12);
        await existing.save();
        console.log(`${email} is now an administrator.${password ? ' The password was updated.' : ' The password was not changed.'}`);
    }
    else {
        // No password given: generate a random one and show it once
        const finalPassword = password ?? (0, node_crypto_1.randomBytes)(9).toString('base64url');
        await User_1.User.create({ name, email, password: await (0, bcryptjs_1.hash)(finalPassword, 12), role: 'admin' });
        console.log(`Administrator created: ${email}`);
        if (!password)
            console.log(`Generated password: ${finalPassword}\nSave it now. It cannot be shown again.`);
    }
    await (0, db_1.disconnectDb)();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
