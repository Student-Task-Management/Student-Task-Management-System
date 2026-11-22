"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const modelJson_1 = require("../utils/modelJson");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // select:false = hidden unless asked for
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    disabled: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: modelJson_1.jsonOptions });
exports.User = (0, mongoose_1.model)('User', userSchema);
