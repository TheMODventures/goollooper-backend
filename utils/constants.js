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

exports.LOCATIONS_TYPES = Object.freeze({
  GLOBAL: "global",
  LOCAL: "local",
});

exports.SCHEDULE_TYPES = Object.freeze({
  DATE: "date",
  DAY: "day",
});

exports.REPETITION = Object.freeze({
  NONE: "none",
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
});

exports.DAYS = Object.freeze({
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "driday",
  SATURDAY: "saturday",
  SUNDAY: "sunday"
});

exports.SERVICE_TYPES = Object.freeze({
  VOLUNTEER: "volunteer",
  INTEREST: "interest",
});

exports.SUBSCRIPTION_DURATION = Object.freeze({
  DAY: "day",
  MONTH: "month",
  ANNUM: "annum",
});