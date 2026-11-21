"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const task_1 = require("../validators/task");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth); // every task route needs a logged-in user
router.get('/', task_controller_1.listTasks);
router.post('/', (0, validate_1.validate)(task_1.taskSchema), task_controller_1.createTask);
router.get('/:id', task_controller_1.getTask);
router.put('/:id', (0, validate_1.validate)(task_1.taskSchema), task_controller_1.updateTask);
router.delete('/:id', task_controller_1.deleteTask);
exports.default = router;
