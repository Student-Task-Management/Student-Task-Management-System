"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
exports.currentUserId = currentUserId;
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const jwt_1 = require("../utils/jwt");
// Protects a route: the request must carry "Authorization: Bearer <token>".
const requireAuth = async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
        throw new ApiError_1.ApiError(401, 'Authentication required');
    let userId;
    try {
        userId = (0, jwt_1.verifyToken)(header.slice(7));
    }
    catch {
        throw new ApiError_1.ApiError(401, 'Invalid or expired token');
    }
    if (!(await User_1.User.exists({ _id: userId })))
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    req.userId = userId;
    next();
};
exports.requireAuth = requireAuth;
// Use inside controllers to get the logged-in user's id
function currentUserId(req) {
    if (!req.userId)
        throw new ApiError_1.ApiError(401, 'Authentication required');
    return req.userId;
}
