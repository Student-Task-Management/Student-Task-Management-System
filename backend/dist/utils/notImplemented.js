"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notImplemented = notImplemented;
const ApiError_1 = require("./ApiError");
// Placeholder handler used until the real controllers are written in Phase 4.
function notImplemented(_req, _res, next) {
    next(new ApiError_1.ApiError(501, 'This endpoint is not implemented yet'));
}
