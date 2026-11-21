"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonOptions = void 0;
// Shared by all models: send "id" instead of "_id", and never send the password.
exports.jsonOptions = {
    versionKey: false,
    transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.password;
        return ret;
    },
};
