"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const auth_2 = require("../validators/auth");
const router = (0, express_1.Router)();
// Slows down password guessing: at most 30 attempts per 15 minutes per IP address
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
router.post('/register', authLimiter, (0, validate_1.validate)(auth_2.registerSchema), auth_controller_1.register);
router.post('/login', authLimiter, (0, validate_1.validate)(auth_2.loginSchema), auth_controller_1.login);
router.get('/me', auth_1.requireAuth, auth_controller_1.me);
exports.default = router;
