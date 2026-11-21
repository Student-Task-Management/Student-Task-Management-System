"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
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
