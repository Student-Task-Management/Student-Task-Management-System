"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
const bcryptjs_1 = require("bcryptjs");
const auth_1 = require("../middleware/auth");
const Subject_1 = require("../models/Subject");
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const jwt_1 = require("../utils/jwt");
// Every new account starts with these subjects (delete the list to turn this off)
const DEFAULT_SUBJECTS = [
    { name: 'Programming', color: '#6366f1', description: 'Web development and coding labs' },
    { name: 'Database', color: '#0ea5e9', description: 'SQL, ER diagrams and MongoDB' },
    { name: 'English', color: '#f59e0b', description: 'Essays, reports and presentations' },
    { name: 'Networking', color: '#10b981', description: 'Protocols, subnetting and topology' },
    { name: 'Mathematics', color: '#ec4899', description: 'Calculus and linear algebra' },
];
async function register(req, res) {
    const { name, email, password } = req.body;
    if (await User_1.User.exists({ email }))
        throw new ApiError_1.ApiError(409, 'An account with this email already exists');
    // Never store the plain password: bcrypt turns it into a one-way hash
    const user = await User_1.User.create({ name, email, password: await (0, bcryptjs_1.hash)(password, 12) });
    await Subject_1.Subject.insertMany(DEFAULT_SUBJECTS.map((s) => ({ ...s, userId: user._id })));
    res.status(201).json({ success: true, data: { user, token: (0, jwt_1.signToken)(user.id) } });
}
async function login(req, res) {
    const { email, password, remember } = req.body;
    const user = await User_1.User.findOne({ email }).select('+password');
    const valid = user ? await (0, bcryptjs_1.compare)(password, user.password) : false;
    // Same message for "no such email" and "wrong password" so attackers learn nothing
    if (!user || !valid)
        throw new ApiError_1.ApiError(401, 'Invalid email or password');
    if (user.disabled)
        throw new ApiError_1.ApiError(403, 'This account has been disabled. Please contact an administrator.');
    res.json({ success: true, data: { user, token: (0, jwt_1.signToken)(user.id, remember === true) } });
}
async function me(req, res) {
    const user = await User_1.User.findById((0, auth_1.currentUserId)(req));
    if (!user)
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    res.json({ success: true, data: { user } });
}
