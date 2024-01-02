import mongoose, { ObjectId } from "mongoose";

export interface IRating extends JwtToken {
  star: number;
  description: string;
  by: string | ObjectId;
  to: string | ObjectId;
}

export interface IRatingDoc extends IRating, Document {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
