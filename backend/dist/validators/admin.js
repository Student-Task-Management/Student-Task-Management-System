"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTaskQuerySchema = exports.adminUserQuerySchema = exports.updateUserSchema = exports.createUserSchema = exports.userRoleSchema = exports.userStatusSchema = void 0;
const zod_1 = require("zod");
const objectId_1 = require("../utils/objectId");
const auth_1 = require("./auth");
const nameRule = zod_1.z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be 60 characters or less');
const emailRule = zod_1.z.string().trim().toLowerCase().email('Please enter a valid email address');
const roleRule = zod_1.z.enum(['user', 'admin']);
const dateKey = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
exports.userStatusSchema = zod_1.z.object({ disabled: zod_1.z.boolean() });
exports.userRoleSchema = zod_1.z.object({ role: roleRule });
// An admin can create students and other administrators. The default is a student.
exports.createUserSchema = zod_1.z.object({
    name: nameRule,
    email: emailRule,
    password: auth_1.passwordRule,
    role: roleRule.default('user'),
});
// The password is optional when editing: empty or missing means "keep the current one"
exports.updateUserSchema = zod_1.z.object({
    name: nameRule,
    email: emailRule,
    password: zod_1.z.union([zod_1.z.literal(''), auth_1.passwordRule]).optional(),
});
// Filters for GET /api/admin/users
exports.adminUserQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(100).optional(),
    role: roleRule.optional(),
    status: zod_1.z.enum(['active', 'disabled']).optional(),
});
// Filters for GET /api/admin/tasks
exports.adminTaskQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(100).optional(),
    userId: zod_1.z.string().refine((v) => (0, objectId_1.isObjectId)(v), 'Invalid student id').optional(),
    subject: zod_1.z.string().trim().max(30).optional(),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']).optional(),
    status: zod_1.z.enum(['Pending', 'In Progress', 'Completed']).optional(),
    overdue: zod_1.z.enum(['true', 'false']).optional(),
    today: dateKey.optional(),
    sort: zod_1.z.enum(['dueDate', 'createdAt']).default('dueDate'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
