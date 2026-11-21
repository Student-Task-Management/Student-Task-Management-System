"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = void 0;
const zod_1 = require("zod");
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title must be 100 characters or less'),
    description: zod_1.z.string().trim().max(500, 'Description must be 500 characters or less').default(''),
    subjectId: zod_1.z.string().min(1, 'Please choose a subject'),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']),
    status: zod_1.z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
    dueDate: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Due date is not a valid date'),
});
