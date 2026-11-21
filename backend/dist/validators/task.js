"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskQuerySchema = exports.taskSchema = void 0;
const zod_1 = require("zod");
const objectId_1 = require("../utils/objectId");
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title must be 100 characters or less'),
    description: zod_1.z.string().trim().max(500, 'Description must be 500 characters or less').default(''),
    subjectId: zod_1.z.string().refine((v) => (0, objectId_1.isObjectId)(v), 'Please choose a valid subject'),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']),
    status: zod_1.z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
    dueDate: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Due date is not a valid date'),
});
// Optional filters for GET /api/tasks
exports.taskQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(100).optional(),
    status: zod_1.z.enum(['Pending', 'In Progress', 'Completed']).optional(),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']).optional(),
    subjectId: zod_1.z.string().refine((v) => (0, objectId_1.isObjectId)(v), 'Invalid subject id').optional(),
    sort: zod_1.z.enum(['dueDate', 'createdAt']).default('dueDate'),
});
