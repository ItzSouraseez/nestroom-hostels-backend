const { sendError } = require("../utils/responseHelper");

/**
 * Validate request body/query/params against a Joi schema.
 * Usage: validate(schema, 'body' | 'query' | 'params')
 */
const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,    // collect ALL errors, not just first
    stripUnknown: true,   // remove fields not in schema
    allowUnknown: false,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join("."),
      message: d.message.replace(/['"]/g, ""),
    }));
    return sendError(res, "Validation failed", 400, "VALIDATION_ERROR", details);
  }

  // Replace with sanitised value (strips unknown fields)
  req[source] = value;
  next();
};

module.exports = validate;
