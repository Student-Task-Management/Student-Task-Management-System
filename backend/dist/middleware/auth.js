"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
exports.currentUserId = currentUserId;
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const jwt_1 = require("../utils/jwt");
// Protects a route: the request must carry "Authorization: Bearer <token>".
// The user is loaded from the database on every request, so disabling or
// deleting an account takes effect immediately, even with a valid token.
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
    const user = await User_1.User.findById(userId).select('role disabled');
    if (!user)
        throw new ApiError_1.ApiError(401, 'User no longer exists');
    if (user.disabled)
        throw new ApiError_1.ApiError(401, 'This account has been disabled');
    req.userId = userId;
    req.userRole = user.role === 'admin' ? 'admin' : 'user';
    next();
};
exports.requireAuth = requireAuth;
// Use after requireAuth on routes that only administrators may call
const requireAdmin = (req, _res, next) => {
    if (req.userRole !== 'admin')
        throw new ApiError_1.ApiError(403, 'Admin access required');
    next();
};
exports.requireAdmin = requireAdmin;
// Use inside controllers to get the logged-in user's id
function currentUserId(req) {
    if (!req.userId)
        throw new ApiError_1.ApiError(401, 'Authentication required');
    return req.userId;
}
