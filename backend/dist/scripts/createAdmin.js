"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const bcryptjs_1 = require("bcryptjs");
const db_1 = require("../config/db");
const User_1 = require("../models/User");
// Usage: npm run create-admin -- <email> [name] [password]
async function main() {
    const [emailArg, nameArg, passwordArg] = process.argv.slice(2);
    const email = emailArg?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error('Usage: npm run create-admin -- <email> [name] [password]');
        process.exit(1);
    }
    await (0, db_1.connectDb)();
    const existing = await User_1.User.findOne({ email });
    if (existing) {
        existing.role = 'admin';
        existing.disabled = false;
        await existing.save();
        console.log(`${email} already existed and is now an administrator. Its password was not changed.`);
    }
    else {
        // No password given: generate a random one and show it once
        const password = passwordArg ?? (0, node_crypto_1.randomBytes)(9).toString('base64url');
        if (password.length < 8) {
            console.error('The password must be at least 8 characters.');
            process.exit(1);
        }
        await User_1.User.create({
            name: nameArg?.trim() || 'Administrator',
            email,
            password: await (0, bcryptjs_1.hash)(password, 12),
            role: 'admin',
        });
        console.log(`Administrator created.\n  Email:    ${email}\n  Password: ${password}\nSave this password now. It cannot be shown again.`);
    }
    await (0, db_1.disconnectDb)();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
