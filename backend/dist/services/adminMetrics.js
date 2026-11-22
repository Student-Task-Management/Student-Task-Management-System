"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskTotals = taskTotals;
const Task_1 = require("../models/Task");
// Task counts for the whole platform, or for one student when userId is given
async function taskTotals(today, userId) {
    const own = userId ? { userId } : {};
    const [total, pending, inProgress, completed, overdue] = await Promise.all([
        Task_1.Task.countDocuments({ ...own }),
        Task_1.Task.countDocuments({ ...own, status: 'Pending' }),
        Task_1.Task.countDocuments({ ...own, status: 'In Progress' }),
        Task_1.Task.countDocuments({ ...own, status: 'Completed' }),
        Task_1.Task.countDocuments({ ...own, status: { $ne: 'Completed' }, dueDate: { $lt: today } }),
    ]);
    return { total, pending, inProgress, completed, overdue };
}
