"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const subjectCatalog_1 = require("./services/subjectCatalog");
async function start() {
    try {
        await (0, db_1.connectDb)();
        await (0, subjectCatalog_1.ensureCatalog)();
    }
    catch (err) {
        console.error('Could not start:', err instanceof Error ? err.message : err);
        process.exit(1);
    }
    const server = app_1.default.listen(env_1.env.PORT, () => {
        console.log(`StudyFlow API running on http://localhost:${env_1.env.PORT} (${env_1.env.NODE_ENV})`);
    });
    // Stop cleanly when Docker or the terminal asks the process to end
    function shutdown(signal) {
        console.log(`${signal} received, shutting down`);
        server.close(async () => {
            await (0, db_1.disconnectDb)();
            process.exit(0);
        });
    }
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
void start();
