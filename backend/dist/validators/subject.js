"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectSchema = void 0;
const zod_1 = require("zod");
exports.subjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters').max(30, 'Name must be 30 characters or less'),
    color: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #6366f1'),
    description: zod_1.z.string().trim().max(200, 'Description must be 200 characters or less').default(''),
});
