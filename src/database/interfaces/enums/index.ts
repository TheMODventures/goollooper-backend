import { EncodingType } from "@aws-sdk/client-s3";

export enum EUserRole {
  admin = 1,
  user = 2,
  serviceProvider = 3,
  subAdmin = 4,
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
  monthly = "monthly",
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
  cancelled = "cancelled",
  pause = "pause",
}
export enum ETaskUserStatus {
  PENDING = 1,
  REJECTED = 2,
  STANDBY = 3,
  ACCEPTED = 4,
  IDLE = 5,
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
  COMPLETE = 6,
  TOUR = 7,
  RESCHEDULE = 8,
}

export enum RequestStatus {
  CLIENT_REQUEST = 1,
  SERVICE_PROVIDER_REQUEST = 2,
  CLIENT_INVOICE_REQUEST = 3,
  SERVICE_PROVIDER_INVOICE_REQUEST = 4,
  SERVICE_PROVIDER_TOUR_REQUEST = 5,
  CLIENT_TOUR_REQUEST_ACCEPT = 6,
  CLIENT_TOUR_REQUEST_DECLINE = 7,
  CLIENT_TASK_RESCHEDULE = 8,
}

export enum MessageType {
  message = "message",
  request = "request",
  pause = "pause",
  relieve = "relieve",
  proceed = "proceed",
  invoice = "invoice",
  complete = "complete",
  system = "system",
  tour = "tour",
  reschedule = "reschedule",
  bill = "bill",
  pay = "pay",
  addWorkers = "workers-added",
  removeWorkers = "workers-removed",
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
  ANNOUNCEMENT = 5,
  TASK_REQUEST = 6,
  TASK_REJECTED = 7,
  ACTION_REQUEST = 8,
  TASK_CANCELLED = 9,
}

export enum EGUIDELINE {
  PRIVACY_POLICY = 1,
  TERMS_AND_CONDITIONS = 2,
  FAQS = 3,
  ABOUT = 4,
}

export enum ECALLDEVICETYPE {
  ios = "ios",
  android = "android",
}

export enum TransactionType {
  subscription = "Subscription",
  taskAddRequest = "Task Add Request",
  megablast = "Megablast",
  topUp = "Top Up",
  withdraw = "Withdraw",
  task = "Task Completed",
  applicationFee = "Application Fee",
  serviceInitiationFee = "Service Initiation Fee",
}

export enum ETransactionStatus {
  pending = "pending",
  completed = "completed",
  cancelled = "cancelled",
}

export enum ETICKET_STATUS {
  PENDING = "pending",
  PROGRESS = "progress",
  COMPLETED = "completed",
  CLOSED = "closed",
}

export enum TOPUP_METHOD {
  CARD = "card",
  PAYPAL = "paypal",
  GOOGLE_PAY = "google-pay",
  APPLE_PAY = "apple-pay",
}

export enum AUTH_PROVIDER {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
  MANUAL = "manual",
}
