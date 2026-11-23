"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.updateAvatar = updateAvatar;
exports.removeAvatar = removeAvatar;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const upload_1 = require("../middleware/upload");
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
// ---------- Profile picture ----------
async function looksLikeImage(file) {
    const fh = await node_fs_1.promises.open(file, 'r');
    try {
        const buf = Buffer.alloc(12);
        await fh.read(buf, 0, 12, 0);
        const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
        const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
        return jpeg || png || webp;
    }
    finally {
        await fh.close();
    }
}
async function deleteAvatarFile(url) {
    if (!url)
        return;
    await node_fs_1.promises.unlink(node_path_1.default.join(upload_1.AVATAR_DIR, node_path_1.default.basename(url))).catch(() => { });
}
async function updateAvatar(req, res) {
    const file = req.file;
    if (!file)
        throw new ApiError_1.ApiError(400, 'Please choose an image to upload');
    // The browser's file type can be faked, so check the real file signature too
    if (!(await looksLikeImage(file.path))) {
        await node_fs_1.promises.unlink(file.path).catch(() => { });
        throw new ApiError_1.ApiError(400, 'Only JPG, PNG or WebP images are allowed');
    }
    const user = await User_1.User.findById((0, auth_1.currentUserId)(req));
    if (!user) {
        await node_fs_1.promises.unlink(file.path).catch(() => { });
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    }
    const previous = user.avatar;
    user.avatar = `/api/uploads/avatars/${file.filename}`;
    await user.save();
    await deleteAvatarFile(previous);
    res.json({ success: true, data: { user } });
}
async function removeAvatar(req, res) {
    const user = await User_1.User.findById((0, auth_1.currentUserId)(req));
    if (!user)
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    const previous = user.avatar;
    user.avatar = '';
    await user.save();
    await deleteAvatarFile(previous);
    res.json({ success: true, data: { user } });
}
