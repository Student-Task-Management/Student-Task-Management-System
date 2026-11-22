"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectTemplate = void 0;
const mongoose_1 = require("mongoose");
const modelJson_1 = require("../utils/modelJson");
// The subject catalog: the subjects every new student receives at sign-up
const templateSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
    color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    description: { type: String, default: '', trim: true, maxlength: 200 },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: modelJson_1.jsonOptions });
// No two catalog subjects with the same name (case-insensitive)
templateSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
exports.SubjectTemplate = (0, mongoose_1.model)('SubjectTemplate', templateSchema);
