"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const mongoose_1 = require("mongoose");
const modelJson_1 = require("../utils/modelJson");
const subjectSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
    color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    description: { type: String, default: '', trim: true, maxlength: 200 },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: modelJson_1.jsonOptions });
// One user cannot have two subjects with the same name (case-insensitive)
subjectSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
exports.Subject = (0, mongoose_1.model)('Subject', subjectSchema);
