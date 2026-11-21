"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubjects = listSubjects;
exports.createSubject = createSubject;
exports.updateSubject = updateSubject;
exports.deleteSubject = deleteSubject;
const mongoose_1 = require("mongoose");
const auth_1 = require("../middleware/auth");
const Subject_1 = require("../models/Subject");
const Task_1 = require("../models/Task");
const ApiError_1 = require("../utils/ApiError");
const objectId_1 = require("../utils/objectId");
async function findOwnedSubject(req) {
    const id = (0, objectId_1.requireObjectId)(req.params.id, 'Subject');
    const subject = await Subject_1.Subject.findOne({ _id: id, userId: (0, auth_1.currentUserId)(req) });
    if (!subject)
        throw new ApiError_1.ApiError(404, 'Subject not found');
    return subject;
}
// Subjects come with live task counts, so the Subjects page needs only one request
async function listSubjects(req, res) {
    const userId = (0, auth_1.currentUserId)(req);
    const [subjects, counts] = await Promise.all([
        Subject_1.Subject.find({ userId }).sort({ createdAt: 1, _id: 1 }),
        Task_1.Task.aggregate([
            { $match: { userId: new mongoose_1.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$subjectId',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                },
            },
        ]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c]));
    res.json({
        success: true,
        data: {
            subjects: subjects.map((s) => ({
                ...s.toJSON(),
                taskCount: byId.get(s.id)?.total ?? 0,
                completedCount: byId.get(s.id)?.completed ?? 0,
            })),
        },
    });
}
async function createSubject(req, res) {
    const subject = await Subject_1.Subject.create({ ...req.body, userId: (0, auth_1.currentUserId)(req) });
    res.status(201).json({ success: true, data: { subject } });
}
async function updateSubject(req, res) {
    const subject = await findOwnedSubject(req);
    subject.set(req.body);
    await subject.save();
    res.json({ success: true, data: { subject } });
}
// Deleting a subject also deletes its tasks
async function deleteSubject(req, res) {
    const userId = (0, auth_1.currentUserId)(req);
    const subject = await findOwnedSubject(req);
    const { deletedCount } = await Task_1.Task.deleteMany({ userId, subjectId: subject._id });
    await subject.deleteOne();
    res.json({ success: true, message: 'Subject deleted', data: { deletedTasks: deletedCount } });
}
