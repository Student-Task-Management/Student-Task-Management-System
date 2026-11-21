"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
// All settings come from environment variables (the .env file locally).
const schema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(5000),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173'),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:');
    parsed.error.issues.forEach((i) => console.error(`- ${i.path.join('.')}: ${i.message}`));
    process.exit(1);
}
exports.env = parsed.data;
