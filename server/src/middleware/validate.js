export default function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        const parsedQuery = query.parse(req.query);
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export { validate };
