import { errorResponse } from '../utils/apiResponse.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const messages = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return errorResponse(res, messages.join('; '), 'VALIDATION_ERROR', 422, error.issues);
    }
    next(error);
  }
};
