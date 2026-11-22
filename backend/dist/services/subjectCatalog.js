"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCatalog = ensureCatalog;
exports.seedUserSubjects = seedUserSubjects;
const Subject_1 = require("../models/Subject");
const SubjectTemplate_1 = require("../models/SubjectTemplate");
const DEFAULTS = [
    { name: 'Programming', color: '#6366f1', description: 'Web development and coding labs' },
    { name: 'Database', color: '#0ea5e9', description: 'SQL, ER diagrams and MongoDB' },
    { name: 'English', color: '#f59e0b', description: 'Essays, reports and presentations' },
    { name: 'Networking', color: '#10b981', description: 'Protocols, subnetting and topology' },
    { name: 'Mathematics', color: '#ec4899', description: 'Calculus and linear algebra' },
];
// Runs at server start. The default subjects are added only while the catalog is empty.
async function ensureCatalog() {
    if ((await SubjectTemplate_1.SubjectTemplate.estimatedDocumentCount()) === 0) {
        await SubjectTemplate_1.SubjectTemplate.insertMany(DEFAULTS);
        console.log('Subject catalog created with the default subjects');
    }
}
// Gives a new student a copy of every catalog subject
async function seedUserSubjects(userId) {
    const templates = await SubjectTemplate_1.SubjectTemplate.find().sort({ _id: 1 });
    if (templates.length === 0)
        return;
    await Subject_1.Subject.insertMany(templates.map((t) => ({ userId, name: t.name, color: t.color, description: t.description })));
}
