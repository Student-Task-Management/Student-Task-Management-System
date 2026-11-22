"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTasks = listTasks;
exports.deleteTask = deleteTask;
const Subject_1 = require("../models/Subject");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const adminMetrics_1 = require("../services/adminMetrics");
const ApiError_1 = require("../utils/ApiError");
const dates_1 = require("../utils/dates");
const objectId_1 = require("../utils/objectId");
const query_1 = require("../utils/query");
const admin_1 = require("../validators/admin");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Every student's tasks, with filters and pages
async function listTasks(req, res) {
    const query = admin_1.adminTaskQuerySchema.parse((0, query_1.cleanQuery)(req));
    const today = (0, dates_1.todayFrom)(query.today);
    const and = [];
    if (query.userId)
        and.push({ userId: query.userId });
    if (query.priority)
        and.push({ priority: query.priority });
    if (query.status)
        and.push({ status: query.status });
    if (query.q)
        and.push({ title: { $regex: escapeRegex(query.q), $options: 'i' } });
    if (query.overdue === 'true')
        and.push({ status: { $ne: 'Completed' } }, { dueDate: { $lt: today } });
    if (query.subject) {
        // Subjects belong to each student, so they are matched by name
        const ids = await Subject_1.Subject.find({ name: { $regex: `^${escapeRegex(query.subject)}$`, $options: 'i' } }).distinct('_id');
        and.push({ subjectId: { $in: ids } });
    }
    const filter = and.length ? { $and: and } : {};
    const sort = query.sort === 'createdAt' ? { createdAt: -1 } : { dueDate: 1, createdAt: -1 };
    const [tasks, total, summary, subjectNames] = await Promise.all([
        Task_1.Task.find(filter).sort(sort).skip((query.page - 1) * query.limit).limit(query.limit),
        Task_1.Task.countDocuments(filter),
        (0, adminMetrics_1.taskTotals)(today),
        Subject_1.Subject.distinct('name'),
    ]);
    const [users, subjects] = await Promise.all([
        User_1.User.find({ _id: { $in: [...new Set(tasks.map((t) => String(t.userId)))] } }).select('name email'),
        Subject_1.Subject.find({ _id: { $in: [...new Set(tasks.map((t) => String(t.subjectId)))] } }).select('name color'),
    ]);
    const userById = new Map(users.map((u) => [u.id, { id: u.id, name: u.name, email: u.email }]));
    const subjectById = new Map(subjects.map((s) => [s.id, { name: s.name, color: s.color }]));
    // One entry per name, ignoring upper/lower case
    const names = [...new Map(subjectNames.map((n) => [n.toLowerCase(), n])).values()].sort((a, b) => a.localeCompare(b));
    res.json({
        success: true,
        data: {
            tasks: tasks.map((t) => ({
                ...t.toJSON(),
                user: userById.get(String(t.userId)) ?? null,
                subject: subjectById.get(String(t.subjectId)) ?? null,
                overdue: t.status !== 'Completed' && t.dueDate < today,
            })),
            pagination: { page: query.page, limit: query.limit, total, pages: Math.max(1, Math.ceil(total / query.limit)) },
            summary,
            subjectNames: names,
        },
    });
}
async function deleteTask(req, res) {
    const task = await Task_1.Task.findByIdAndDelete((0, objectId_1.requireObjectId)(req.params.id, 'Task'));
    if (!task)
        throw new ApiError_1.ApiError(404, 'Task not found');
    res.json({ success: true, message: 'Task deleted' });
}
