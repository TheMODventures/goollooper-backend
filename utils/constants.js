exports.ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
  SERVICE_PROVIDER: "service_provider",
});

exports.STATUS_CODES = Object.freeze({
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
});

exports.GENDERS = Object.freeze({
  MALE: 'male',
  FEMALE: 'female'
});

exports.SERVICE_TYPES = Object.freeze({
  VOLUNTEER: "volunteer",
  INTEREST: "interest",
});