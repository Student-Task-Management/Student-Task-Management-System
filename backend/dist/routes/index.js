"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const subject_routes_1 = __importDefault(require("./subject.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const router = (0, express_1.Router)();
// Used by Docker and monitoring tools: 200 only when the database is reachable too
router.get('/health', (_req, res) => {
    const dbConnected = mongoose_1.default.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({
        success: dbConnected,
        data: {
            status: dbConnected ? 'ok' : 'degraded',
            database: dbConnected ? 'connected' : 'disconnected',
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        },
    });
});
router.use('/admin', admin_routes_1.default);
router.use('/auth', auth_routes_1.default);
router.use('/tasks', task_routes_1.default);
router.use('/subjects', subject_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/users', user_routes_1.default);
exports.default = router;
