const { ZodError } = require('zod');

/**
 * Middleware for validating request data using Zod schemas.
 * @param {object} schemas - An object potentially containing Zod schemas for 'body', 'query', and 'params'.
 * @param {import('zod').ZodSchema} [schemas.body] - Zod schema for req.body.
 * @param {import('zod').ZodSchema} [schemas.query] - Zod schema for req.query.
 * @param {import('zod').ZodSchema} [schemas.params] - Zod schema for req.params.
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code, // Include Zod error code for more specific client-side handling if needed
          })),
        },
      });
    }
    // For other non-Zod errors, pass them to the default Express error handler
    next(error);
  }
};

module.exports = { validate }; 