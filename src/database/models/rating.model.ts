import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

import { IRatingDoc } from "../interfaces/rating.interface";
import { User } from "./user.model";
import { IUserDoc } from "../interfaces/user.interface";

const schemaOptions = {
  timestamps: true,
};
const ratingModel: Schema = new Schema(
  {
    star: { type: Number, required: true },
    description: { type: String, default: null },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
  },
  schemaOptions
);

ratingModel.plugin(mongoosePaginate);
ratingModel.plugin(aggregatePaginate);

ratingModel.index({ _id: 1, to: 1, by: 1 });

ratingModel.pre("save", async function (next) {
  try {
    const user = await User.findById(this.to).select(
      "ratingCount averageRating"
    );

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
  } catch (e) {
    next(e as Error);
  }
});
export const Rating = model<IRatingDoc>("Rating", ratingModel);
