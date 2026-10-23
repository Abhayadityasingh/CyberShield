import { AppError } from '../utils/AppError.js';

// Validates ?query=params. Result goes to req.validatedQuery (req.query is read-only in Express 5).
export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new AppError('Invalid query parameters', 400, details));
  }
  req.validatedQuery = result.data;
  next();
};