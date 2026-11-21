"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stats = stats;
exports.activity = activity;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const Task_1 = require("../models/Task");
const dateKey = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
// The browser sends its own local date (?today=2026-11-21) so "today" is right in any timezone
function getToday(req) {
    const parsed = dateKey.safeParse(req.query.today);
    return parsed.success ? parsed.data : new Date().toISOString().slice(0, 10);
}
function shiftDay(key, days) {
    const d = new Date(`${key}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}
async function stats(req, res) {
    const userId = (0, auth_1.currentUserId)(req);
    const today = getToday(req);
    const weekStart = shiftDay(today, -6);
    const [byStatus, weekTasks, todayTasks, upcoming] = await Promise.all([
        Task_1.Task.aggregate([
            { $match: { userId: new mongoose_1.Types.ObjectId(userId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Task_1.Task.find({ userId, dueDate: { $gte: weekStart, $lte: today } }).select('dueDate status').lean(),
        Task_1.Task.find({ userId, dueDate: today }).sort({ createdAt: -1 }),
        Task_1.Task.find({ userId, status: { $ne: 'Completed' }, dueDate: { $ne: today } })
            .sort({ dueDate: 1 })
            .limit(5),
    ]);
    const count = (status) => byStatus.find((s) => s._id === status)?.count ?? 0;
    const pending = count('Pending');
    const inProgress = count('In Progress');
    const completed = count('Completed');
    const total = pending + inProgress + completed;
    const weekly = Array.from({ length: 7 }, (_, i) => {
        const key = shiftDay(today, i - 6);
        const day = weekTasks.filter((t) => t.dueDate === key);
        return {
            date: key,
            label: new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
            completed: day.filter((t) => t.status === 'Completed').length,
            pending: day.filter((t) => t.status !== 'Completed').length,
        };
    });
    res.json({
        success: true,
        data: {
            total,
            pending,
            inProgress,
            completed,
            completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
            weekly,
            todayTasks,
            upcoming,
        },
    });
}
async function activity(req, res) {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
    const tasks = await Task_1.Task.find({ userId: (0, auth_1.currentUserId)(req) })
        .sort({ updatedAt: -1 })
        .limit(limit);
    res.json({ success: true, data: { activity: tasks } });
}
