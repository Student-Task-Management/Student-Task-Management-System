"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const DAY = 60 * 60 * 24;
// "Remember me" keeps the token valid for 30 days instead of 1 day.
function signToken(userId, remember = false) {
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_SECRET, { expiresIn: remember ? DAY * 30 : DAY });
}
function verifyToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    if (typeof payload === 'string' || !payload.sub)
        throw new Error('Invalid token');
    return payload.sub;
}
