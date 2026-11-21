"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTasks = listTasks;
exports.getTask = getTask;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
const auth_1 = require("../middleware/auth");
const Subject_1 = require("../models/Subject");
const Task_1 = require("../models/Task");
const ApiError_1 = require("../utils/ApiError");
const objectId_1 = require("../utils/objectId");
const task_1 = require("../validators/task");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Finds a task only if it belongs to the logged-in user
async function findOwnedTask(req) {
    const id = (0, objectId_1.requireObjectId)(req.params.id, 'Task');
    const task = await Task_1.Task.findOne({ _id: id, userId: (0, auth_1.currentUserId)(req) });
    if (!task)
        throw new ApiError_1.ApiError(404, 'Task not found');
    return task;
}
// A task may only use one of the user's own subjects
async function assertSubjectOwned(subjectId, userId) {
    if (!(await Subject_1.Subject.exists({ _id: subjectId, userId })))
        throw new ApiError_1.ApiError(400, 'Subject not found');
}
async function listTasks(req, res) {
    const userId = (0, auth_1.currentUserId)(req);
    const { q, status, priority, subjectId, sort } = task_1.taskQuerySchema.parse(req.query);
    const filter = { userId };
    if (status)
        filter.status = status;
    if (priority)
        filter.priority = priority;
    if (subjectId)
        filter.subjectId = subjectId;
    if (q)
        filter.title = { $regex: escapeRegex(q), $options: 'i' };
    const tasks = await Task_1.Task.find(filter).sort(sort === 'createdAt' ? { createdAt: -1 } : { dueDate: 1, createdAt: -1 });
    res.json({ success: true, data: { tasks } });
}
async function getTask(req, res) {
    const task = await findOwnedTask(req);
    res.json({ success: true, data: { task } });
}
async function createTask(req, res) {
    const userId = (0, auth_1.currentUserId)(req);
    const input = req.body;
    await assertSubjectOwned(input.subjectId, userId);
    const task = await Task_1.Task.create({
        ...input,
        userId,
        completedAt: input.status === 'Completed' ? new Date() : null,
    });
    res.status(201).json({ success: true, data: { task } });
}
async function updateTask(req, res) {
    const userId = (0, auth_1.currentUserId)(req);
    const task = await findOwnedTask(req);
    const input = req.body;
    await assertSubjectOwned(input.subjectId, userId);
    const wasCompleted = task.status === 'Completed';
    task.set(input);
    if (input.status !== 'Completed')
        task.set('completedAt', null);
    else if (!wasCompleted)
        task.set('completedAt', new Date());
    await task.save();
    res.json({ success: true, data: { task } });
}
async function deleteTask(req, res) {
    const task = await findOwnedTask(req);
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
}
