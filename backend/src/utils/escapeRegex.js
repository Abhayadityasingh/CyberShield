// Makes user search text safe to use inside a regular expression.
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');