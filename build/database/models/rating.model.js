"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rating = void 0;
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const user_model_1 = require("./user.model");
const schemaOptions = {
    timestamps: true,
};
const ratingModel = new mongoose_1.Schema({
    star: { type: Number, required: true },
    description: { type: String, default: null },
    by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: mongoose_1.Schema.Types.ObjectId, ref: "Task", required: true },
}, schemaOptions);
ratingModel.plugin(mongoose_paginate_v2_1.default);
ratingModel.plugin(mongoose_aggregate_paginate_v2_1.default);
ratingModel.index({ _id: 1, to: 1, by: 1 });
ratingModel.pre("save", async function (next) {
    try {
        const user = await user_model_1.User.findById(this.to).select("ratingCount averageRating");
        if (!user) {
            // Handle the case where the user is not found
            return next(new Error("User not found"));
        }
        // Update the document fields
        user.ratingCount += 1;
        user.averageRating =
            (user.averageRating * (user.ratingCount - 1) + this.star) /
                user.ratingCount;
        // Save the updated document
        await user.save();
        next();
    }
    catch (e) {
        next(e);
    }
});
exports.Rating = (0, mongoose_1.model)("Rating", ratingModel);
//# sourceMappingURL=rating.model.js.map