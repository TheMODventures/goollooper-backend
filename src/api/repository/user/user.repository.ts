import mongoose, { FilterQuery, ObjectId, QueryOptions } from "mongoose";

import { IUser, IUserDoc } from "../../../database/interfaces/user.interface";
import { IUserRepository } from "./user.repository.interface";
import { BaseRepository } from "../base.repository";
import { User } from "../../../database/models/user.model";

export class UserRepository
  extends BaseRepository<IUser, IUserDoc>
  implements IUserRepository
{
  constructor() {
    super(User);
  }
  async create<T>(entity: IUserDoc | IUser): Promise<T> {
    entity._id = new mongoose.Types.ObjectId();
    const newEntity = new this.model(entity);
    await newEntity.save();
    delete entity.password;
    return entity as T;
  }

  async updateByOne<T>(
    filter: FilterQuery<T>,
    updateQuery: QueryOptions<T>
  ): Promise<T | null> {
    const data = await this.model.findOneAndUpdate(filter, updateQuery, {
      new: true,
    });
    if (data) {
      delete data.password;
    }
    return (data as T) || null;
  }

  getCallToken = async (user: string | ObjectId) => {
    return await this.model.findById(user).select("callToken callDeviceType");
  };

  getUserCallStatus = async (user: string | ObjectId) => {
    return await this.model.findById(user).select("userCallStatus");
  };
}
