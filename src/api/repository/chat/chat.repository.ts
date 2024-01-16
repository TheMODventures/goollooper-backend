import { FilterQuery } from "mongoose";

import { IChat, IChatDoc } from "../../../database/interfaces/chat.interface";
import { Chat } from "../../../database/models/chat.model";
import { BaseRepository } from "../base.repository";
import { IChatRepository } from "./chat.repository.interface";
import { UserRepository } from "../user/user.repository";

export class ChatRepository
  extends BaseRepository<IChat, IChatDoc>
  implements IChatRepository
{
  private userRepository: UserRepository;

  constructor() {
    super(Chat);

    this.userRepository = new UserRepository();
  }

  getOneByFilter = async (filter: FilterQuery<IChat>) => {
    const response = await this.model.findOne<IChat>(filter);
    return response;
  };

  sendNotificationMsg = async (data: any, chat = {}) => {
    const users = await this.userRepository.getAll(
      { _id: data.userId },
      undefined,
      `fcmToken _id`,
      undefined,
      undefined,
      true,
      1,
      200
    );
    // console.log(users);
    // users.forEach((e: IUser) => {
    //   sendNotification({
    //     title: data.title,
    //     body: data.body,
    //     fcmToken: e.fcmToken,
    //     data: { chatId: data.chatId, user: e._id },
    //   });
    // });
  };
}
