import moment from "moment";
import mongoose from "mongoose";

import { Database } from "../database";
import { EUserRole } from "../interfaces/enums";
import { IUserDoc } from "../interfaces/user.interface";
import { User } from "../models/user.model";

new Database(); //connect database

User.findOne({ role: EUserRole.admin })
  .exec()
  .then((result) => {
    console.log("Admin Seeder Successfully Started");

    if (!result) {
      const Admindata: IUserDoc = new User({
        _id: new mongoose.Types.ObjectId(),
        role: EUserRole.admin,
        firstName: "dummy",
        lastName: "dummy",
        email: "admin@fund.pk",
        phoneNumber: "+81XXXXXXXXXXX",
        emailVerifiedAt: moment(),
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
          mongoose.connection.close();
        });
    } else {
      console.log("Admin Data already exist", result);
      mongoose.connection.close();
    }
  });
