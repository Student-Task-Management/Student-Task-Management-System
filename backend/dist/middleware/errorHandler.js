"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
// Runs when no route matched the request.
function notFound(req, _res, next) {
    next(new ApiError_1.ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
// Every error ends up here, so every error response has the same JSON shape.
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        });
    }
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
        });
    }
    if (err instanceof mongoose_1.default.Error.CastError) {
        return res.status(400).json({ success: false, message: `Invalid value for ${err.path}` });
    }
    // MongoDB code 11000 = a unique index was violated (duplicate email or subject name)
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
        const pattern = 'keyPattern' in err ? err.keyPattern : {};
        const message = 'email' in pattern ? 'An account with this email already exists' : 'You already have a subject with this name';
        return res.status(409).json({ success: false, message });
    }
    if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
    }
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error(err);
    const message = env_1.env.NODE_ENV === 'production' || !(err instanceof Error) ? 'Internal server error' : err.message;
    res.status(500).json({ success: false, message });
}
