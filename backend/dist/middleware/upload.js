"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATAR_DIR = exports.UPLOAD_DIR = void 0;
exports.uploadAvatar = uploadAvatar;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = require("../utils/ApiError");
exports.UPLOAD_DIR = node_path_1.default.resolve(process.cwd(), 'uploads');
exports.AVATAR_DIR = node_path_1.default.join(exports.UPLOAD_DIR, 'avatars');
(0, node_fs_1.mkdirSync)(exports.AVATAR_DIR, { recursive: true });
// The file name is random and the extension comes from the checked type, never from the user's file name
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, exports.AVATAR_DIR),
        filename: (_req, file, cb) => cb(null, (0, node_crypto_1.randomUUID)() + EXT[file.mimetype]),
    }),
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (EXT[file.mimetype])
            cb(null, true);
        else
            cb(new ApiError_1.ApiError(400, 'Only JPG, PNG or WebP images are allowed'));
    },
});
function uploadAvatar(req, res, next) {
    upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2 MB or smaller' : 'Upload failed';
            return next(new ApiError_1.ApiError(400, msg));
        }
        next(err);
    });
}
