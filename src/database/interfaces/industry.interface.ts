import mongoose, { Document, Schema } from "mongoose";

// Define the Industry interface
export interface IIndustry {
  name: string;
  isDeleted: boolean;
}

export interface IIndustryDoc extends IIndustry, Document {
  _id: mongoose.Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}
