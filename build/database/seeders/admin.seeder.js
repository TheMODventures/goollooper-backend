"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../database");
const enums_1 = require("../interfaces/enums");
const user_model_1 = require("../models/user.model");
new database_1.Database(); //connect database
user_model_1.User.findOne({ role: enums_1.EUserRole.admin })
    .exec()
    .then((result) => {
    console.log("Admin Seeder Successfully Started");
    if (!result) {
        const Admindata = new user_model_1.User({
            _id: new mongoose_1.default.Types.ObjectId(),
            role: enums_1.EUserRole.admin,
            firstName: "dummy",
            lastName: "dummy",
            email: "admin@fund.pk",
            phoneNumber: "+81XXXXXXXXXXX",
            emailVerifiedAt: (0, moment_1.default)(),
            password: "123456",
        });
        Admindata.save()
            .then(async (user) => {
            console.log(`${user} users created`);
        })
            .catch((err) => {
            console.log(err);
        })
            .finally(() => {
            console.log("Admin Seeder Successfully Executed");
            mongoose_1.default.connection.close();
        });
    }
    else {
        console.log("Admin Data already exist", result);
        mongoose_1.default.connection.close();
    }
});
//# sourceMappingURL=admin.seeder.js.map