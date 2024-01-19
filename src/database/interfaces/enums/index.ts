import { EncodingType } from "@aws-sdk/client-s3";

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

export enum ERating {
  lowest = 1,
  highest = -1,
}

export enum ELiability {
  yes = 1,
  no = 2,
  all = 3,
}

export enum TaskType {
  normal = "normal",
  megablast = "megablast",
  event = "megablast",
}

export enum ETaskStatus {
  pending = "pending",
  assigned = "assigned",
  completed = "completed",
}

export enum ETaskUserStatus {
  PENDING = 1,
  REJECTED = 2,
  STANDBY = 3,
  ACCEPTED = 4,
}

export enum ECALENDARTaskType {
  request = "request",
  accepted = "accepted",
}

export enum Request {
  REQUEST = 1,
  PAUSE = 2,
  RELIEVE = 3,
  PROCEED = 4,
  INVOICE = 5,
}

export enum RequestStatus {
  CLIENT_REQUEST = 1,
  SERVICE_PROVIDER_REQUEST = 2,
  CLIENT_INVOICE_REQUEST = 3,
  SERVICE_PROVIDER_INVOICE_REQUEST = 4,
}

export enum MessageType {
  message = "message",
  request = "request",
  pause = "pause",
  relieve = "relieve",
  proceed = "proceed",
  invoice = "invoice",
}

export enum EChatType {
  GROUP = "group",
  ONE_TO_ONE = "one-to-one",
}

export enum EMessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  SEEN = "seen",
}

export enum EParticipantStatus {
  ACTIVE = "active",
}

export enum ENOTIFICATION_TYPES {
  SHARE_PROVIDER = 1,
  FRIEND_REQUEST = 2,
  MESSAGE_REQUEST = 3,
  MESSAGE_REQUEST_ACCEPT = 4,
  TASK_ACCEPTED = 5,
}

export enum EGUIDELINE {
  PRIVACY_POLICY = 1,
  TERMS_AND_CONDITIONS = 2,
  FAQS = 3,
  ABOUT = 4,
}
