import { ZodError } from "zod";

/**
 * Express middleware to validate request bodies using Zod schemas.
 * Usage: router.post('/', validateRequest(userCreateSchema), controller.createUser)
 */
export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Strip out unknown keys strictly or let zod handle it
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(422).json({
                    success: false,
                    message: "Validation Error",
                    code: "VALIDATION_FAILED",
                    errors: formattedErrors
                });
            }
            next(error);
        }
    };
};
