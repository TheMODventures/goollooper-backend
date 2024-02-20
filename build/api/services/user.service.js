"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const lodash_1 = __importDefault(require("lodash"));
const enums_1 = require("../../database/interfaces/enums");
const user_repository_1 = require("../repository/user/user.repository");
const schedule_repository_1 = require("../repository/schedule/schedule.repository");
const constant_1 = require("../../constant");
const reponseapi_helper_1 = require("../helpers/reponseapi.helper");
const date_helper_1 = require("../helpers/date.helper");
const upload_helper_1 = require("../helpers/upload.helper");
const token_service_1 = __importDefault(require("./token.service"));
class UserService {
    constructor() {
        this.getByFilter = async (filter) => {
            try {
                const response = await this.userRepository.getOne(filter);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.getCount = async (filter) => {
            try {
                const getDocCount = await this.userRepository.getCount(filter);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, getDocCount.toString());
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.index = async (page, limit = 10, filter) => {
            try {
                const getDocCount = await this.userRepository.getCount(filter);
                let pipeline = [
                    { $match: filter },
                    {
                        $lookup: {
                            from: "tasks",
                            let: { userId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ["$postedBy", "$$userId"] },
                                    },
                                },
                                {
                                    $project: {
                                        title: 1,
                                        description: 1,
                                    },
                                },
                            ],
                            as: "tasks",
                        },
                    },
                ];
                const response = await this.userRepository.getAllWithAggregatePagination(pipeline, "", "", {
                    createdAt: "desc",
                }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, getDocCount);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.list = async (selectField) => {
            try {
                const filter = {
                    isDeleted: false,
                    $or: [{ role: enums_1.EUserRole.user }, { role: enums_1.EUserRole.serviceProvider }],
                };
                const response = await this.userRepository.getAll(filter, undefined, selectField);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.show = async (_id) => {
            try {
                const filter = {
                    _id: _id,
                    isDeleted: false,
                    $or: [
                        { role: enums_1.EUserRole.user },
                        { role: enums_1.EUserRole.serviceProvider },
                        { role: enums_1.EUserRole.subAdmin },
                    ],
                };
                const response = await this.userRepository.getOne(filter, "", "", [
                    {
                        path: "volunteer",
                        model: "Service",
                        select: "title type parent",
                    },
                    {
                        path: "services",
                        model: "Service",
                        select: "title type parent",
                    },
                    {
                        path: "subscription.subscription",
                        model: "Subscription",
                    },
                ]);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                const schedules = await this.scheduleRepository.getAll({
                    user: _id,
                    isActive: true,
                });
                const res = { ...response, schedule: schedules };
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_SHOW_PASSED, res);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.update = async (_id, dataset, req) => {
            var _a;
            try {
                let body = { ...req?.body };
                let userResponse = await this.userRepository.getOne({
                    _id: _id,
                });
                dataset.company = { ...userResponse?.company, ...dataset.company };
                if (req && lodash_1.default.isArray(req.files)) {
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "profileImage")) {
                        const image = req.files?.filter((file) => file.fieldname === "profileImage");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        dataset.profileImage = path[0];
                    }
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "gallery")) {
                        const image = req.files?.filter((file) => file.fieldname === "gallery");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        body.galleryImages?.push(...path);
                        dataset.gallery = body.galleryImages || path;
                    }
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "visuals")) {
                        const image = req.files?.filter((file) => file.fieldname === "visuals");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        body.visualFiles?.push(...path);
                        dataset.visuals = body.visualFiles || path;
                    }
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "companyLogo")) {
                        const image = req.files?.filter((file) => file.fieldname === "companyLogo");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        dataset.company.logo = path[0];
                    }
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "companyResume")) {
                        const image = req.files?.filter((file) => file.fieldname === "companyResume");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        dataset.company.resume = path[0];
                    }
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "certificates")) {
                        const image = req.files?.filter((file) => file.fieldname === "certificates");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        body.certificateFiles?.push(...path);
                        dataset.certificates = body.certificateFiles || path;
                    }
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "licenses")) {
                        const image = req.files?.filter((file) => file.fieldname === "licenses");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        body.licenseFiles?.push(...path);
                        dataset.licenses = body.licenseFiles || path;
                    }
                    if (req.files.length &&
                        req.files?.find((file) => file.fieldname === "insurances")) {
                        const image = req.files?.filter((file) => file.fieldname === "insurances");
                        let path = await this.uploadHelper.uploadFileFromBuffer(image);
                        body.insuranceFiles?.push(...path);
                        dataset.insurances = body.insuranceFiles || path;
                    }
                }
                // checking if subscription is bsp then location should be local
                // removing condition because of frontend
                // if (dataset.subscription?.subscription) {
                // let subscription =
                //   await this.subscriptionRepository.getById<ISubscription>(
                //     dataset.subscription.subscription
                //   );
                // if (
                //   subscription &&
                //   subscription.name.toLowerCase() === Subscription.bsl &&
                //   dataset?.locationType !== EUserLocationType.local
                // )
                //   return ResponseHelper.sendResponse(
                //     422,
                //     "Location should be local while subscribing to BSL"
                //   );
                // }
                // checking if location is local then all location details should be provided
                if (dataset.locationType &&
                    dataset.locationType === enums_1.EUserLocationType.local &&
                    (!dataset.location || !dataset.location.length)) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(422, "Provide all location details");
                }
                else if (dataset.locationType &&
                    dataset.locationType === enums_1.EUserLocationType.local &&
                    dataset.location &&
                    dataset.location.length) {
                    for (let i = 0; i < dataset.location.length; i++) {
                        const element = dataset.location[i];
                        if (element.coordinates.length < 2 ||
                            !element.state ||
                            !element.city ||
                            !element.county ||
                            (dataset.zipCode && !dataset.zipCode.length)) {
                            return reponseapi_helper_1.ResponseHelper.sendResponse(422, "Provide all location details");
                        }
                        dataset.location[i].coordinates?.map((e) => parseFloat(e.toString()));
                        (_a = dataset.location[i]).type ?? (_a.type = "Point");
                        if (element.isSelected === "true")
                            dataset.selectedLocation = dataset.location[i];
                    }
                }
                // schedule creation
                if (dataset.schedule) {
                    let schedule = dataset.schedule;
                    let noOfDays = 60;
                    const daysInWeek = 7;
                    let startDate = new Date(schedule.startDate);
                    const currentDate = new Date();
                    let daysRemaining = noOfDays -
                        Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
                    if (schedule.repetition === enums_1.Repetition.none) {
                        const scheduleStartDate = new Date(startDate);
                        scheduleStartDate.setDate(startDate.getDate());
                        await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                        await this.scheduleRepository.create({
                            date: scheduleStartDate,
                            day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                            slots: schedule.slots,
                            user: _id,
                        });
                    }
                    else if (schedule.repetition === enums_1.Repetition.day) {
                        for (let i = 0; i < daysRemaining; i++) {
                            const scheduleStartDate = new Date(startDate);
                            scheduleStartDate.setDate(startDate.getDate() + i);
                            await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                            await this.scheduleRepository.create({
                                date: scheduleStartDate,
                                day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                slots: schedule.slots,
                                user: _id,
                            });
                        }
                    }
                    else if (schedule.repetition === enums_1.Repetition.week) {
                        const noOfWeeks = Math.ceil(daysRemaining / daysInWeek);
                        for (let i = 0; i < noOfWeeks; i++) {
                            const scheduleStartDate = new Date(startDate);
                            scheduleStartDate.setDate(startDate.getDate() + i * daysInWeek);
                            await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                            await this.scheduleRepository.create({
                                date: scheduleStartDate,
                                day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                slots: schedule.slots,
                                user: _id,
                            });
                        }
                    }
                    else if (schedule.repetition === enums_1.Repetition.month) {
                        const scheduleStartDate = new Date(startDate);
                        while (daysRemaining > 0) {
                            await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                            await this.scheduleRepository.create({
                                date: scheduleStartDate,
                                day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                slots: schedule.slots,
                                user: _id,
                            });
                            // Move to the next month
                            scheduleStartDate.setMonth(scheduleStartDate.getMonth() + 1);
                            // Subtract the actual number of days in the month from the remaining days
                            daysRemaining -= this.dateHelper.getDaysInMonth(scheduleStartDate);
                        }
                    }
                    else if (schedule.repetition === enums_1.Repetition.year) {
                        const scheduleStartDate = new Date(startDate);
                        while (daysRemaining > 0) {
                            await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                            await this.scheduleRepository.create({
                                date: scheduleStartDate,
                                day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                slots: schedule.slots,
                                user: _id,
                            });
                            // Move to the next year
                            scheduleStartDate.setFullYear(scheduleStartDate.getFullYear() + 1);
                            // Subtract the actual number of days in the year from the remaining days
                            daysRemaining -= this.dateHelper.getDaysInYear(scheduleStartDate);
                        }
                    }
                    else if (schedule.repetition === enums_1.Repetition.custom) {
                        if (!schedule.repeatsEvery ||
                            !schedule.repeatsOn ||
                            !schedule.repeatsAfter) {
                            return reponseapi_helper_1.ResponseHelper.sendResponse(422, "Provide all schedule details required");
                        }
                        let daysDifference = 0;
                        // check if end date is provided
                        if (schedule.endDate) {
                            daysDifference = this.dateHelper.isDateDifferenceGreaterThan(schedule.startDate, schedule.endDate);
                        }
                        else if (schedule.occurrence) {
                            let endDate = startDate;
                            endDate.setDate(startDate.getDate() + +schedule.occurrence * 7);
                            daysDifference = daysDifference =
                                this.dateHelper.isDateDifferenceGreaterThan(schedule.startDate, endDate.toString());
                        }
                        else if (!schedule.endDate && !schedule.occurrence) {
                            daysDifference = daysRemaining + 1;
                        }
                        // if schedule is greater than {noOfDays} days
                        if (daysDifference > daysRemaining) {
                            if (schedule.repeatsEvery === enums_1.RepetitionEvery.week) {
                                const selectedDays = schedule.repeatsOn;
                                const noOfWeeks = Math.ceil(daysRemaining / daysInWeek);
                                let repeatsAfter = schedule.repeatsAfter || 1;
                                for (let i = 0; i < noOfWeeks; i += +repeatsAfter) {
                                    // iterate through selected days and create schedules
                                    for (const day of selectedDays) {
                                        // calculating next occurrence of the selected day
                                        const scheduleStartDate = this.dateHelper.getNextWeekdayByDay(schedule.startDate, day, i);
                                        await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                                        await this.scheduleRepository.create({
                                            date: scheduleStartDate,
                                            day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                            slots: schedule.slots,
                                            user: _id,
                                        });
                                    }
                                }
                            }
                            else if (schedule.repeatsEvery === enums_1.RepetitionEvery.month) {
                                const selectedDays = schedule.repeatsOn;
                                const daysInMonth = this.dateHelper.getDaysInMonth(new Date(schedule.startDate));
                                const repeatsAfter = schedule.repeatsAfter || 1; // Default to 1 if repeatsAfter is not provided
                                // Calculate the number of months needed based on the total number of days
                                const totalMonths = Math.ceil(daysRemaining / (daysInMonth * +repeatsAfter));
                                for (let i = 0; i < totalMonths; i++) {
                                    // Iterate through selected days and create schedules
                                    for (const day of selectedDays) {
                                        // Calculate the next occurrence of the selected day in the current month
                                        const scheduleStartDate = this.dateHelper.getNextMonthdayByDay(schedule.startDate, day, i * +repeatsAfter);
                                        await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                                        await this.scheduleRepository.create({
                                            date: scheduleStartDate,
                                            day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                            slots: schedule.slots,
                                            user: _id,
                                        });
                                    }
                                }
                            }
                        }
                        else {
                            // schedule is less than {noOfDays} days
                            if (schedule.repeatsEvery === enums_1.RepetitionEvery.week) {
                                const selectedDays = schedule.repeatsOn;
                                const noOfWeeks = Math.ceil(daysDifference / daysInWeek);
                                let repeatsAfter = schedule.repeatsAfter || 1;
                                for (let i = 0; i < noOfWeeks; i += +repeatsAfter) {
                                    // iterate through selected days and create schedules
                                    for (const day of selectedDays) {
                                        // calculating next occurrence of the selected day
                                        const scheduleStartDate = this.dateHelper.getNextWeekdayByDay(schedule.startDate, day, i);
                                        await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                                        await this.scheduleRepository.create({
                                            date: scheduleStartDate,
                                            day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                            slots: schedule.slots,
                                            user: _id,
                                        });
                                    }
                                }
                            }
                            else if (schedule.repeatsEvery === enums_1.RepetitionEvery.month) {
                                const selectedDays = schedule.repeatsOn;
                                const daysInMonth = this.dateHelper.getDaysInMonth(new Date(schedule.startDate));
                                const repeatsAfter = schedule.repeatsAfter || 1; // Default to 1 if repeatsAfter is not provided
                                // Calculate the number of months needed based on the total number of days
                                const totalMonths = Math.ceil(daysDifference / (daysInMonth * +repeatsAfter));
                                for (let i = 0; i < totalMonths; i++) {
                                    // Iterate through selected days and create schedules
                                    for (const day of selectedDays) {
                                        // Calculate the next occurrence of the selected day in the current month
                                        const scheduleStartDate = this.dateHelper.getNextMonthdayByDay(schedule.startDate, day, i * +repeatsAfter);
                                        await this.scheduleRepository.updateCollidingSchedules(scheduleStartDate, schedule.slots, _id);
                                        await this.scheduleRepository.create({
                                            date: scheduleStartDate,
                                            day: this.dateHelper.getDayOfWeek(scheduleStartDate),
                                            slots: schedule.slots,
                                            user: _id,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                if (dataset.phoneCode && dataset.phone) {
                    dataset.completePhone = dataset.phoneCode + dataset.phone;
                }
                const response = await this.userRepository.updateById(_id, dataset);
                if (response === null) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                if (dataset.profileImage && userResponse?.profileImage) {
                    this.uploadHelper.deleteFile(userResponse.profileImage);
                }
                if (userResponse?.gallery?.length) {
                    const imagesToDelete = userResponse.gallery.filter((image) => !body.galleryImages?.includes(image));
                    for (const imageToDelete of imagesToDelete) {
                        this.uploadHelper.deleteFile(imageToDelete);
                    }
                    let updatedGallery = [];
                    if (dataset.galleryImages?.length) {
                        updatedGallery = dataset.galleryImages.filter((image) => !imagesToDelete.includes(image));
                    }
                    else {
                        updatedGallery = userResponse.gallery.filter((image) => !imagesToDelete.includes(image));
                    }
                    dataset.gallery = updatedGallery;
                }
                if (userResponse?.visuals?.length) {
                    const imagesToDelete = userResponse.visuals.filter((image) => !body.visualFiles?.includes(image));
                    for (const imageToDelete of imagesToDelete) {
                        this.uploadHelper.deleteFile(imageToDelete);
                    }
                    let updatedFiles = [];
                    if (dataset.visualFiles?.length) {
                        updatedFiles = dataset.visualFiles.filter((image) => !imagesToDelete.includes(image));
                    }
                    else {
                        updatedFiles = userResponse.visuals.filter((image) => !imagesToDelete.includes(image));
                    }
                    dataset.visuals = updatedFiles;
                }
                if (lodash_1.default.isArray(req?.files) &&
                    req?.files?.find((file) => file.fieldname === "companyLogo") &&
                    dataset.company?.logo &&
                    userResponse?.company?.logo) {
                    this.uploadHelper.deleteFile(userResponse?.company?.logo);
                }
                if (lodash_1.default.isArray(req?.files) &&
                    req?.files?.find((file) => file.fieldname === "companyResume") &&
                    dataset.company?.resume &&
                    userResponse?.company?.resume) {
                    this.uploadHelper.deleteFile(userResponse?.company?.resume);
                }
                if (userResponse?.certificates?.length) {
                    const imagesToDelete = userResponse.certificates.filter((image) => !body.certificateFiles?.includes(image));
                    for (const imageToDelete of imagesToDelete) {
                        this.uploadHelper.deleteFile(imageToDelete);
                    }
                    let updatedFiles = [];
                    if (dataset.certificateFiles?.length) {
                        updatedFiles = dataset.certificateFiles.filter((image) => !imagesToDelete.includes(image));
                    }
                    else {
                        updatedFiles = userResponse.certificates.filter((image) => !imagesToDelete.includes(image));
                    }
                    dataset.certificates = updatedFiles;
                }
                if (userResponse?.licenses?.length) {
                    const imagesToDelete = userResponse.licenses.filter((image) => !body.licenseFiles?.includes(image));
                    for (const imageToDelete of imagesToDelete) {
                        this.uploadHelper.deleteFile(imageToDelete);
                    }
                    let updatedFiles = [];
                    if (dataset.licenseFiles?.length) {
                        updatedFiles = dataset.licenseFiles.filter((image) => !imagesToDelete.includes(image));
                    }
                    else {
                        updatedFiles = userResponse.licenses.filter((image) => !imagesToDelete.includes(image));
                    }
                    dataset.licenses = updatedFiles;
                }
                if (userResponse?.insurances?.length) {
                    const imagesToDelete = userResponse.insurances.filter((image) => !body.insuranceFiles?.includes(image));
                    for (const imageToDelete of imagesToDelete) {
                        this.uploadHelper.deleteFile(imageToDelete);
                    }
                    let updatedFiles = [];
                    if (dataset.insuranceFiles?.length) {
                        updatedFiles = dataset.insuranceFiles.filter((image) => !imagesToDelete.includes(image));
                    }
                    else {
                        updatedFiles = userResponse.insurances.filter((image) => !imagesToDelete.includes(image));
                    }
                    dataset.insurances = updatedFiles;
                }
                await this.userRepository.updateById(_id, dataset);
                userResponse = await this.userRepository.getOne({
                    _id: _id,
                }, "", "", [
                    {
                        path: "volunteer",
                        model: "Service",
                        select: "title type parent",
                    },
                    {
                        path: "services",
                        model: "Service",
                        select: "title type parent",
                    },
                    {
                        path: "subscription.subscription",
                        model: "Subscription",
                    },
                ]);
                const schedules = await this.scheduleRepository.getAll({
                    user: _id,
                    isActive: true,
                });
                const res = { ...userResponse, schedule: schedules };
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_UPDATION_PASSED, res);
            }
            catch (error) {
                if (error?.code === 11000)
                    return reponseapi_helper_1.ResponseHelper.sendResponse(409, `This ${Object.keys(error.keyValue)[0]} already exist`);
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.trashIndex = async (page, limit = 10) => {
            try {
                const filter = {
                    isDeleted: false,
                    $or: [{ role: enums_1.EUserRole.user }, { role: enums_1.EUserRole.serviceProvider }],
                };
                const getDocCount = await this.userRepository.getCount(filter);
                const response = await this.userRepository.getAll(filter, "", "", {
                    deletedAt: "desc",
                }, undefined, true, page, limit);
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, getDocCount);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.delete = async (_id) => {
            try {
                const response = await this.userRepository.updateById(_id, {
                    isDeleted: true,
                });
                if (!response) {
                    return reponseapi_helper_1.ResponseHelper.sendResponse(404);
                }
                return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_DELETION_PASSED);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.getDataByAggregate = async (page, limit = 10, pipeline) => {
            const countPipeline = (await this.userRepository.getDataByAggregate([
                ...(pipeline ?? []),
                { $sort: { distance: -1 } },
                { $count: "totalCount" },
            ]));
            const response = await this.userRepository.getDataByAggregate([
                ...(pipeline ?? []),
                { $sort: { distance: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
            ]);
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse(constant_1.SUCCESS_DATA_LIST_PASSED, response, countPipeline.length > 0 ? countPipeline[0].totalCount : 0);
        };
        this.addSubAdmin = async (payload) => {
            try {
                if (payload.phoneCode && payload.phone) {
                    payload.completePhone = payload.phoneCode + payload.phone;
                }
                const user = {
                    ...payload,
                    role: enums_1.EUserRole.subAdmin,
                };
                const data = await this.userRepository.create(user);
                const userId = new mongoose_1.default.Types.ObjectId(data._id);
                const tokenResponse = await this.tokenService.create(userId, enums_1.EUserRole.subAdmin);
                return reponseapi_helper_1.ResponseHelper.sendSignTokenResponse(201, constant_1.SUCCESS_DATA_INSERTION_PASSED, data, tokenResponse);
            }
            catch (error) {
                return reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
            }
        };
        this.userRepository = new user_repository_1.UserRepository();
        this.scheduleRepository = new schedule_repository_1.ScheduleRepository();
        this.uploadHelper = new upload_helper_1.UploadHelper("user");
        this.tokenService = new token_service_1.default();
        this.dateHelper = new date_helper_1.DateHelper();
    }
}
exports.default = UserService;
//# sourceMappingURL=user.service.js.map