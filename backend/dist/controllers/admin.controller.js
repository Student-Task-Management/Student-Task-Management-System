"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stats = stats;
exports.listUsers = listUsers;
exports.setUserStatus = setUserStatus;
exports.deleteUser = deleteUser;
const auth_1 = require("../middleware/auth");
const Subject_1 = require("../models/Subject");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const objectId_1 = require("../utils/objectId");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Admin screens deal with students only (accounts that are not administrators)
const studentFilter = { role: { $ne: 'admin' } };
// Finds a student account the admin is allowed to change
async function findStudent(req) {
    const id = (0, objectId_1.requireObjectId)(req.params.id, 'User');
    const user = await User_1.User.findById(id);
    if (!user)
        throw new ApiError_1.ApiError(404, 'User not found');
    if (user.id === (0, auth_1.currentUserId)(req))
        throw new ApiError_1.ApiError(400, 'You cannot change your own account here');
    if (user.role === 'admin')
        throw new ApiError_1.ApiError(403, 'Administrator accounts cannot be changed here');
    return user;
}
async function stats(_req, res) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeUsers, newThisWeek, totalTasks, completedTasks, recentUsers] = await Promise.all([
        User_1.User.countDocuments(studentFilter),
        User_1.User.countDocuments({ ...studentFilter, disabled: { $ne: true } }),
        User_1.User.countDocuments({ ...studentFilter, createdAt: { $gte: weekAgo } }),
        Task_1.Task.countDocuments(),
        Task_1.Task.countDocuments({ status: 'Completed' }),
        User_1.User.find(studentFilter).sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({
        success: true,
        data: {
            totalUsers,
            activeUsers,
            newThisWeek,
            totalTasks,
            completedTasks,
            completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
            recentUsers,
        },
    });
}
async function listUsers(req, res) {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const filter = { ...studentFilter };
    if (q) {
        const rx = { $regex: escapeRegex(q), $options: 'i' };
        filter.$or = [{ name: rx }, { email: rx }];
    }
    const [users, counts] = await Promise.all([
        User_1.User.find(filter).sort({ createdAt: -1 }),
        Task_1.Task.aggregate([
            {
                $group: {
                    _id: '$userId',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                },
            },
        ]),
    ]);
    const byUser = new Map(counts.map((c) => [String(c._id), c]));
    res.json({
        success: true,
        data: {
            users: users.map((u) => ({
                ...u.toJSON(),
                taskCount: byUser.get(u.id)?.total ?? 0,
                completedCount: byUser.get(u.id)?.completed ?? 0,
            })),
        },
    });
}
async function setUserStatus(req, res) {
    const user = await findStudent(req);
    user.disabled = req.body.disabled;
    await user.save();
    res.json({ success: true, data: { user } });
}
// Deleting a user also deletes all of their tasks and subjects
async function deleteUser(req, res) {
    const user = await findStudent(req);
    const tasks = await Task_1.Task.deleteMany({ userId: user._id });
    await Subject_1.Subject.deleteMany({ userId: user._id });
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted', data: { deletedTasks: tasks.deletedCount } });
}
