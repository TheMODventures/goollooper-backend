import { IUser, IUserDoc } from "../../../database/interfaces/user.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IUserRepository extends IBaseRepository<IUser, IUserDoc> {}
