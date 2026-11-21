"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const email = zod_1.z.string().trim().toLowerCase().email('Please enter a valid email address');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be 60 characters or less'),
    email,
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must be 72 characters or less')
        .regex(/[A-Za-z]/, 'Password must contain at least one letter')
        .regex(/\d/, 'Password must contain at least one number'),
});
exports.loginSchema = zod_1.z.object({
    email,
    password: zod_1.z.string().min(1, 'Password is required'),
    remember: zod_1.z.boolean().optional(),
});
