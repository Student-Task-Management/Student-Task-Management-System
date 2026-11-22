"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userStatusSchema = void 0;
const zod_1 = require("zod");
exports.userStatusSchema = zod_1.z.object({
    disabled: zod_1.z.boolean(),
});
