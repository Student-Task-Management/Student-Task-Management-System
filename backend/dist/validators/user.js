"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be 60 characters or less'),
    email: zod_1.z.string().trim().toLowerCase().email('Please enter a valid email address'),
});
