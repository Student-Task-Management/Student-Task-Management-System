"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObjectId = void 0;
exports.requireObjectId = requireObjectId;
const ApiError_1 = require("./ApiError");
const OBJECT_ID = /^[a-f\d]{24}$/i;
const isObjectId = (value) => typeof value === 'string' && OBJECT_ID.test(value);
exports.isObjectId = isObjectId;
// A malformed id can never match anything, so it is simply "not found".
function requireObjectId(value, what) {
    if (!(0, exports.isObjectId)(value))
        throw new ApiError_1.ApiError(404, `${what} not found`);
    return value;
}
