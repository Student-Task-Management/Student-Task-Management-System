"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
// Checks req.body against a zod schema. Bad input becomes a 400 error.
const validate = (schema) => (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
        return next(result.error);
    req.body = result.data; // cleaned data: trimmed strings, defaults applied
    next();
};
exports.validate = validate;
