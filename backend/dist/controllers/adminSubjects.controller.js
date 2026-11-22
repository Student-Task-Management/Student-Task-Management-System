"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCatalog = listCatalog;
exports.createSubject = createSubject;
exports.updateSubject = updateSubject;
exports.deleteSubject = deleteSubject;
const Subject_1 = require("../models/Subject");
const SubjectTemplate_1 = require("../models/SubjectTemplate");
const ApiError_1 = require("../utils/ApiError");
const objectId_1 = require("../utils/objectId");
const sameName = { locale: 'en', strength: 2 };
// The catalog, with how many student accounts currently have a subject with that name
async function listCatalog(_req, res) {
    const [templates, usage] = await Promise.all([
        SubjectTemplate_1.SubjectTemplate.find().collation(sameName).sort({ name: 1 }),
        Subject_1.Subject.aggregate([
            { $group: { _id: { $toLower: '$name' }, count: { $sum: 1 } } },
        ]),
    ]);
    const used = new Map(usage.map((u) => [u._id, u.count]));
    res.json({
        success: true,
        data: {
            subjects: templates.map((t) => ({ ...t.toJSON(), studentCount: used.get(t.name.toLowerCase()) ?? 0 })),
        },
    });
}
async function createSubject(req, res) {
    if (await SubjectTemplate_1.SubjectTemplate.exists({ name: req.body.name }).collation(sameName)) {
        throw new ApiError_1.ApiError(409, 'A subject with this name already exists');
    }
    const subject = await SubjectTemplate_1.SubjectTemplate.create(req.body);
    res.status(201).json({ success: true, data: { subject } });
}
async function updateSubject(req, res) {
    const subject = await SubjectTemplate_1.SubjectTemplate.findById((0, objectId_1.requireObjectId)(req.params.id, 'Subject'));
    if (!subject)
        throw new ApiError_1.ApiError(404, 'Subject not found');
    if (await SubjectTemplate_1.SubjectTemplate.exists({ name: req.body.name, _id: { $ne: subject._id } }).collation(sameName)) {
        throw new ApiError_1.ApiError(409, 'A subject with this name already exists');
    }
    subject.set(req.body);
    await subject.save();
    res.json({ success: true, data: { subject } });
}
// Removes the subject from the catalog only. Students who already have it keep their copy.
async function deleteSubject(req, res) {
    const subject = await SubjectTemplate_1.SubjectTemplate.findByIdAndDelete((0, objectId_1.requireObjectId)(req.params.id, 'Subject'));
    if (!subject)
        throw new ApiError_1.ApiError(404, 'Subject not found');
    res.json({ success: true, message: 'Subject removed from the catalog' });
}
