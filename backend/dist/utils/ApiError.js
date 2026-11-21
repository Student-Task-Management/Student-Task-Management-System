"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
// An error we throw on purpose, with the HTTP status code to send back.
class ApiError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
