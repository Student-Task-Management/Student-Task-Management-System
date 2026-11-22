"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanQuery = cleanQuery;
// Removes empty values (?role=&q=) so optional filters can simply be left blank
function cleanQuery(req) {
    return Object.fromEntries(Object.entries(req.query).filter(([, v]) => v !== ''));
}
