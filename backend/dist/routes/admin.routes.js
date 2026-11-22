"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const admin_1 = require("../validators/admin");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, auth_1.requireAdmin); // every admin route needs a logged-in administrator
router.get('/stats', admin_controller_1.stats);
router.get('/users', admin_controller_1.listUsers);
router.patch('/users/:id/status', (0, validate_1.validate)(admin_1.userStatusSchema), admin_controller_1.setUserStatus);
router.delete('/users/:id', admin_controller_1.deleteUser);
exports.default = router;
