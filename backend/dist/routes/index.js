"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const subject_routes_1 = __importDefault(require("./subject.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const router = (0, express_1.Router)();
// Used by Docker and monitoring tools to check that the API is alive
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: { status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
    });
});
router.use('/auth', auth_routes_1.default);
router.use('/tasks', task_routes_1.default);
router.use('/subjects', subject_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/users', user_routes_1.default);
exports.default = router;
