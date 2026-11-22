"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.setUserStatus = setUserStatus;
exports.setUserRole = setUserRole;
exports.deleteUser = deleteUser;
const bcryptjs_1 = require("bcryptjs");
const auth_1 = require("../middleware/auth");
const Subject_1 = require("../models/Subject");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const adminMetrics_1 = require("../services/adminMetrics");
const subjectCatalog_1 = require("../services/subjectCatalog");
const ApiError_1 = require("../utils/ApiError");
const dates_1 = require("../utils/dates");
const objectId_1 = require("../utils/objectId");
const query_1 = require("../utils/query");
const admin_1 = require("../validators/admin");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Task and completed-task counts, grouped by student or by subject
async function taskCountsBy(field, match = {}) {
    const rows = await Task_1.Task.aggregate([
        { $match: match },
        {
            $group: {
                _id: `$${field}`,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            },
        },
    ]);
    return new Map(rows.map((r) => [String(r._id), r]));
}
// Which accounts may the logged-in admin change?
//  - Yourself: edit name, email and password only (never role, status or deletion)
//  - Students: everything
//  - Other admins: only the role (demote to Student first, then manage)
async function findManaged(req, action) {
    const user = await User_1.User.findById((0, objectId_1.requireObjectId)(req.params.id, 'User'));
    if (!user)
        throw new ApiError_1.ApiError(404, 'User not found');
    const isSelf = user.id === (0, auth_1.currentUserId)(req);
    if (isSelf && action !== 'update')
        throw new ApiError_1.ApiError(400, 'You cannot do this to your own account');
    if (!isSelf && user.role === 'admin' && action !== 'role') {
        throw new ApiError_1.ApiError(403, 'This is an administrator account. Change its role to Student first.');
    }
    return user;
}
async function listUsers(req, res) {
    const { q, role, status } = admin_1.adminUserQuerySchema.parse((0, query_1.cleanQuery)(req));
    const filter = {};
    if (role === 'admin')
        filter.role = 'admin';
    else if (role === 'user')
        filter.role = { $ne: 'admin' };
    if (status === 'disabled')
        filter.disabled = true;
    if (status === 'active')
        filter.disabled = { $ne: true };
    if (q) {
        const rx = { $regex: escapeRegex(q), $options: 'i' };
        filter.$or = [{ name: rx }, { email: rx }];
    }
    const [users, counts] = await Promise.all([
        User_1.User.find(filter).sort({ createdAt: -1 }).limit(500),
        taskCountsBy('userId'),
    ]);
    res.json({
        success: true,
        data: {
            users: users.map((u) => ({
                ...u.toJSON(),
                taskCount: counts.get(u.id)?.total ?? 0,
                completedCount: counts.get(u.id)?.completed ?? 0,
            })),
        },
    });
}
// One account with its task totals, subjects and latest activity
async function getUser(req, res) {
    const user = await User_1.User.findById((0, objectId_1.requireObjectId)(req.params.id, 'User'));
    if (!user)
        throw new ApiError_1.ApiError(404, 'User not found');
    const today = (0, dates_1.todayFrom)(req.query.today);
    const [totals, subjects, counts, recent] = await Promise.all([
        (0, adminMetrics_1.taskTotals)(today, user._id),
        Subject_1.Subject.find({ userId: user._id }).sort({ createdAt: 1, _id: 1 }),
        taskCountsBy('subjectId', { userId: user._id }),
        Task_1.Task.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(10),
    ]);
    const bySubject = new Map(subjects.map((s) => [s.id, { name: s.name, color: s.color }]));
    res.json({
        success: true,
        data: {
            user,
            totals,
            subjects: subjects.map((s) => ({
                ...s.toJSON(),
                taskCount: counts.get(s.id)?.total ?? 0,
                completedCount: counts.get(s.id)?.completed ?? 0,
            })),
            recentTasks: recent.map((t) => ({
                ...t.toJSON(),
                subject: bySubject.get(String(t.subjectId)) ?? null,
                overdue: t.status !== 'Completed' && t.dueDate < today,
            })),
        },
    });
}
async function createUser(req, res) {
    const { name, email, password, role } = req.body;
    if (await User_1.User.exists({ email }))
        throw new ApiError_1.ApiError(409, 'An account with this email already exists');
    const user = await User_1.User.create({ name, email, password: await (0, bcryptjs_1.hash)(password, 12), role });
    if (role !== 'admin')
        await (0, subjectCatalog_1.seedUserSubjects)(user._id);
    res.status(201).json({
        success: true,
        data: { user: { ...user.toJSON(), taskCount: 0, completedCount: 0 } },
    });
}
async function updateUser(req, res) {
    const user = await findManaged(req, 'update');
    const { name, email, password } = req.body;
    if (email !== user.email && (await User_1.User.exists({ email, _id: { $ne: user._id } }))) {
        throw new ApiError_1.ApiError(409, 'An account with this email already exists');
    }
    user.name = name;
    user.email = email;
    if (password)
        user.password = await (0, bcryptjs_1.hash)(password, 12);
    await user.save();
    res.json({ success: true, data: { user } });
}
async function setUserStatus(req, res) {
    const user = await findManaged(req, 'status');
    user.disabled = req.body.disabled;
    await user.save();
    res.json({ success: true, data: { user } });
}
// Takes effect immediately, because requireAuth reads the role from the database on every request
async function setUserRole(req, res) {
    const user = await findManaged(req, 'role');
    user.role = req.body.role;
    await user.save();
    res.json({ success: true, data: { user } });
}
// Deleting a user also deletes all of their tasks and subjects
async function deleteUser(req, res) {
    const user = await findManaged(req, 'delete');
    const tasks = await Task_1.Task.deleteMany({ userId: user._id });
    await Subject_1.Subject.deleteMany({ userId: user._id });
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted', data: { deletedTasks: tasks.deletedCount } });
}
