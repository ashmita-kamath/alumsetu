// PostgreSQL error codes we turn into friendly API errors.
// Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
export const isUniqueViolation = (err) => err?.code === "23505";
export const isForeignKeyViolation = (err) => err?.code === "23503";
