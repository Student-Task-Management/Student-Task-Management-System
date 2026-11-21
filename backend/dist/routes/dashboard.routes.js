"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notImplemented_1 = require("../utils/notImplemented");
const router = (0, express_1.Router)();
router.get('/stats', notImplemented_1.notImplemented);
router.get('/activity', notImplemented_1.notImplemented);
exports.default = router;
