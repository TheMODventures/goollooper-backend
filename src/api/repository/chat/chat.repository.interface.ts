import { IChat, IChatDoc } from "../../../database/interfaces/chat.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IChatRepository extends IBaseRepository<IChat, IChatDoc> {}
