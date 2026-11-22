"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const adminSubjects = __importStar(require("../controllers/adminSubjects.controller"));
const adminStats_controller_1 = require("../controllers/adminStats.controller");
const adminTasks = __importStar(require("../controllers/adminTasks.controller"));
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const admin_1 = require("../validators/admin");
const subject_1 = require("../validators/subject");
const router = (0, express_1.Router)();
// Every admin route needs a logged-in administrator. A student gets 403 here,
// even if they call the API directly without using the website.
router.use(auth_1.requireAuth, auth_1.requireAdmin);
router.get('/stats', adminStats_controller_1.stats);
router.get('/users', admin_controller_1.listUsers);
router.post('/users', (0, validate_1.validate)(admin_1.createUserSchema), admin_controller_1.createUser);
router.get('/users/:id', admin_controller_1.getUser);
router.put('/users/:id', (0, validate_1.validate)(admin_1.updateUserSchema), admin_controller_1.updateUser);
router.patch('/users/:id/status', (0, validate_1.validate)(admin_1.userStatusSchema), admin_controller_1.setUserStatus);
router.patch('/users/:id/role', (0, validate_1.validate)(admin_1.userRoleSchema), admin_controller_1.setUserRole);
router.delete('/users/:id', admin_controller_1.deleteUser);
router.get('/tasks', adminTasks.listTasks);
router.delete('/tasks/:id', adminTasks.deleteTask);
router.get('/subjects', adminSubjects.listCatalog);
router.post('/subjects', (0, validate_1.validate)(subject_1.subjectSchema), adminSubjects.createSubject);
router.put('/subjects/:id', (0, validate_1.validate)(subject_1.subjectSchema), adminSubjects.updateSubject);
router.delete('/subjects/:id', adminSubjects.deleteSubject);
exports.default = router;
