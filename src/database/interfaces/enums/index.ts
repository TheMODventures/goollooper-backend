export enum EUserRole {
  admin = 1,
  user = 2,
  serviceProvider = 3,
}

export enum UserRole {
  user = 2,
  serviceProvider = 3,
}

export enum EUserLocationType {
  global = "global",
  local = "local",
}

export enum ServiceType {
  volunteer = "volunteer",
  interest = "interest",
}

export enum SubscriptionType {
  day = "day",
  month = "month",
  annum = "annum",
}

export enum Subscription {
  bsp = "bsp",
  mbs = "mbs",
  bsl = "bsl",
  iw = "iw",
}

export enum Days {
  monday = "monday",
  tuesday = "tuesday",
  wednesday = "wednesday",
  thursday = "thursday",
  friday = "friday",
  saturday = "saturday",
  sunday = "sunday",
}

export enum Repetition {
  none = "none",
  day = "day",
  week = "week",
  month = "month",
  year = "year",
  custom = "custom",
}

export enum RepetitionEvery {
  week = "week",
  month = "month",
}

export enum EList {
  goList = 1,
  myList = 2,
}
