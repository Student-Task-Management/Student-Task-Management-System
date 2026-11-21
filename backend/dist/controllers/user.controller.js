"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const bcryptjs_1 = require("bcryptjs");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
async function getProfile(req, res) {
    const user = await User_1.User.findById((0, auth_1.currentUserId)(req));
    if (!user)
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    res.json({ success: true, data: { user } });
}
async function updateProfile(req, res) {
    const { name, email } = req.body;
    const user = await User_1.User.findByIdAndUpdate((0, auth_1.currentUserId)(req), { name, email }, { new: true, runValidators: true });
    if (!user)
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    res.json({ success: true, data: { user } });
}
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const user = await User_1.User.findById((0, auth_1.currentUserId)(req)).select('+password');
    if (!user)
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    // 400, not 401: a wrong current password must not look like an expired session
    if (!(await (0, bcryptjs_1.compare)(currentPassword, user.password))) {
        throw new ApiError_1.ApiError(400, 'Current password is incorrect');
    }
    user.password = await (0, bcryptjs_1.hash)(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed' });
}
