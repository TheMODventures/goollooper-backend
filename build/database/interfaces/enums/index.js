"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOPUP_METHOD = exports.ETICKET_STATUS = exports.TransactionType = exports.ECALLDEVICETYPE = exports.EGUIDELINE = exports.ENOTIFICATION_TYPES = exports.EParticipantStatus = exports.EMessageStatus = exports.EChatType = exports.MessageType = exports.RequestStatus = exports.Request = exports.ECALENDARTaskType = exports.ETaskUserStatus = exports.ETaskStatus = exports.TaskType = exports.ELiability = exports.ERating = exports.EList = exports.RepetitionEvery = exports.Repetition = exports.Days = exports.Subscription = exports.SubscriptionType = exports.ServiceType = exports.EUserLocationType = exports.UserRole = exports.EUserRole = void 0;
var EUserRole;
(function (EUserRole) {
    EUserRole[EUserRole["admin"] = 1] = "admin";
    EUserRole[EUserRole["user"] = 2] = "user";
    EUserRole[EUserRole["serviceProvider"] = 3] = "serviceProvider";
    EUserRole[EUserRole["subAdmin"] = 4] = "subAdmin";
})(EUserRole = exports.EUserRole || (exports.EUserRole = {}));
var UserRole;
(function (UserRole) {
    UserRole[UserRole["user"] = 2] = "user";
    UserRole[UserRole["serviceProvider"] = 3] = "serviceProvider";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
var EUserLocationType;
(function (EUserLocationType) {
    EUserLocationType["global"] = "global";
    EUserLocationType["local"] = "local";
})(EUserLocationType = exports.EUserLocationType || (exports.EUserLocationType = {}));
var ServiceType;
(function (ServiceType) {
    ServiceType["volunteer"] = "volunteer";
    ServiceType["interest"] = "interest";
})(ServiceType = exports.ServiceType || (exports.ServiceType = {}));
var SubscriptionType;
(function (SubscriptionType) {
    SubscriptionType["day"] = "day";
    SubscriptionType["month"] = "month";
    SubscriptionType["annum"] = "annum";
})(SubscriptionType = exports.SubscriptionType || (exports.SubscriptionType = {}));
var Subscription;
(function (Subscription) {
    Subscription["bsp"] = "bsp";
    Subscription["mbs"] = "mbs";
    Subscription["bsl"] = "bsl";
    Subscription["iw"] = "iw";
})(Subscription = exports.Subscription || (exports.Subscription = {}));
var Days;
(function (Days) {
    Days["monday"] = "monday";
    Days["tuesday"] = "tuesday";
    Days["wednesday"] = "wednesday";
    Days["thursday"] = "thursday";
    Days["friday"] = "friday";
    Days["saturday"] = "saturday";
    Days["sunday"] = "sunday";
})(Days = exports.Days || (exports.Days = {}));
var Repetition;
(function (Repetition) {
    Repetition["none"] = "none";
    Repetition["day"] = "day";
    Repetition["week"] = "week";
    Repetition["month"] = "month";
    Repetition["year"] = "year";
    Repetition["custom"] = "custom";
})(Repetition = exports.Repetition || (exports.Repetition = {}));
var RepetitionEvery;
(function (RepetitionEvery) {
    RepetitionEvery["week"] = "week";
    RepetitionEvery["month"] = "month";
})(RepetitionEvery = exports.RepetitionEvery || (exports.RepetitionEvery = {}));
var EList;
(function (EList) {
    EList[EList["goList"] = 1] = "goList";
    EList[EList["myList"] = 2] = "myList";
})(EList = exports.EList || (exports.EList = {}));
var ERating;
(function (ERating) {
    ERating[ERating["lowest"] = 1] = "lowest";
    ERating[ERating["highest"] = -1] = "highest";
})(ERating = exports.ERating || (exports.ERating = {}));
var ELiability;
(function (ELiability) {
    ELiability[ELiability["yes"] = 1] = "yes";
    ELiability[ELiability["no"] = 2] = "no";
    ELiability[ELiability["all"] = 3] = "all";
})(ELiability = exports.ELiability || (exports.ELiability = {}));
var TaskType;
(function (TaskType) {
    TaskType["normal"] = "normal";
    TaskType["megablast"] = "megablast";
    TaskType["event"] = "megablast";
})(TaskType = exports.TaskType || (exports.TaskType = {}));
var ETaskStatus;
(function (ETaskStatus) {
    ETaskStatus["pending"] = "pending";
    ETaskStatus["assigned"] = "assigned";
    ETaskStatus["completed"] = "completed";
})(ETaskStatus = exports.ETaskStatus || (exports.ETaskStatus = {}));
var ETaskUserStatus;
(function (ETaskUserStatus) {
    ETaskUserStatus[ETaskUserStatus["PENDING"] = 1] = "PENDING";
    ETaskUserStatus[ETaskUserStatus["REJECTED"] = 2] = "REJECTED";
    ETaskUserStatus[ETaskUserStatus["STANDBY"] = 3] = "STANDBY";
    ETaskUserStatus[ETaskUserStatus["ACCEPTED"] = 4] = "ACCEPTED";
})(ETaskUserStatus = exports.ETaskUserStatus || (exports.ETaskUserStatus = {}));
var ECALENDARTaskType;
(function (ECALENDARTaskType) {
    ECALENDARTaskType["request"] = "request";
    ECALENDARTaskType["accepted"] = "accepted";
})(ECALENDARTaskType = exports.ECALENDARTaskType || (exports.ECALENDARTaskType = {}));
var Request;
(function (Request) {
    Request[Request["REQUEST"] = 1] = "REQUEST";
    Request[Request["PAUSE"] = 2] = "PAUSE";
    Request[Request["RELIEVE"] = 3] = "RELIEVE";
    Request[Request["PROCEED"] = 4] = "PROCEED";
    Request[Request["INVOICE"] = 5] = "INVOICE";
})(Request = exports.Request || (exports.Request = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus[RequestStatus["CLIENT_REQUEST"] = 1] = "CLIENT_REQUEST";
    RequestStatus[RequestStatus["SERVICE_PROVIDER_REQUEST"] = 2] = "SERVICE_PROVIDER_REQUEST";
    RequestStatus[RequestStatus["CLIENT_INVOICE_REQUEST"] = 3] = "CLIENT_INVOICE_REQUEST";
    RequestStatus[RequestStatus["SERVICE_PROVIDER_INVOICE_REQUEST"] = 4] = "SERVICE_PROVIDER_INVOICE_REQUEST";
})(RequestStatus = exports.RequestStatus || (exports.RequestStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["message"] = "message";
    MessageType["request"] = "request";
    MessageType["pause"] = "pause";
    MessageType["relieve"] = "relieve";
    MessageType["proceed"] = "proceed";
    MessageType["invoice"] = "invoice";
    MessageType["system"] = "system";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var EChatType;
(function (EChatType) {
    EChatType["GROUP"] = "group";
    EChatType["ONE_TO_ONE"] = "one-to-one";
})(EChatType = exports.EChatType || (exports.EChatType = {}));
var EMessageStatus;
(function (EMessageStatus) {
    EMessageStatus["SENT"] = "sent";
    EMessageStatus["DELIVERED"] = "delivered";
    EMessageStatus["SEEN"] = "seen";
})(EMessageStatus = exports.EMessageStatus || (exports.EMessageStatus = {}));
var EParticipantStatus;
(function (EParticipantStatus) {
    EParticipantStatus["ACTIVE"] = "active";
})(EParticipantStatus = exports.EParticipantStatus || (exports.EParticipantStatus = {}));
var ENOTIFICATION_TYPES;
(function (ENOTIFICATION_TYPES) {
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["SHARE_PROVIDER"] = 1] = "SHARE_PROVIDER";
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["FRIEND_REQUEST"] = 2] = "FRIEND_REQUEST";
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["MESSAGE_REQUEST"] = 3] = "MESSAGE_REQUEST";
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["MESSAGE_REQUEST_ACCEPT"] = 4] = "MESSAGE_REQUEST_ACCEPT";
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["TASK_ACCEPTED"] = 5] = "TASK_ACCEPTED";
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["ANNOUNCEMENT"] = 5] = "ANNOUNCEMENT";
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["TASK_REQUEST"] = 6] = "TASK_REQUEST";
    ENOTIFICATION_TYPES[ENOTIFICATION_TYPES["TASK_REJECTED"] = 7] = "TASK_REJECTED";
})(ENOTIFICATION_TYPES = exports.ENOTIFICATION_TYPES || (exports.ENOTIFICATION_TYPES = {}));
var EGUIDELINE;
(function (EGUIDELINE) {
    EGUIDELINE[EGUIDELINE["PRIVACY_POLICY"] = 1] = "PRIVACY_POLICY";
    EGUIDELINE[EGUIDELINE["TERMS_AND_CONDITIONS"] = 2] = "TERMS_AND_CONDITIONS";
    EGUIDELINE[EGUIDELINE["FAQS"] = 3] = "FAQS";
    EGUIDELINE[EGUIDELINE["ABOUT"] = 4] = "ABOUT";
})(EGUIDELINE = exports.EGUIDELINE || (exports.EGUIDELINE = {}));
var ECALLDEVICETYPE;
(function (ECALLDEVICETYPE) {
    ECALLDEVICETYPE[ECALLDEVICETYPE["ios"] = 0] = "ios";
    ECALLDEVICETYPE[ECALLDEVICETYPE["android"] = 1] = "android";
})(ECALLDEVICETYPE = exports.ECALLDEVICETYPE || (exports.ECALLDEVICETYPE = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["subscription"] = "Subscription";
    TransactionType["taskAddRequest"] = "Task Add Request";
    TransactionType["megablast"] = "Megablast";
    TransactionType["topUp"] = "Top Up";
    TransactionType["withdraw"] = "Withdraw";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));
var ETICKET_STATUS;
(function (ETICKET_STATUS) {
    ETICKET_STATUS["PENDING"] = "pending";
    ETICKET_STATUS["PROGRESS"] = "progress";
    ETICKET_STATUS["COMPLETED"] = "completed";
    ETICKET_STATUS["CLOSED"] = "closed";
})(ETICKET_STATUS = exports.ETICKET_STATUS || (exports.ETICKET_STATUS = {}));
var TOPUP_METHOD;
(function (TOPUP_METHOD) {
    TOPUP_METHOD["CARD"] = "card";
    TOPUP_METHOD["PAYPAL"] = "paypal";
    TOPUP_METHOD["GOOGLE_PAY"] = "google-pay";
    TOPUP_METHOD["APPLE_PAY"] = "apple-pay";
})(TOPUP_METHOD = exports.TOPUP_METHOD || (exports.TOPUP_METHOD = {}));
//# sourceMappingURL=index.js.map