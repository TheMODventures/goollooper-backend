import { ObjectId } from "bson";
import { Server } from "socket.io";

import {
  IChat,
  IChatDoc,
  IChatPayload,
  IMessage,
  IParticipant,
} from "../../../database/interfaces/chat.interface";
import { IChatRepository } from "./chat.repository.interface";
import { IUser } from "../../../database/interfaces/user.interface";
import { Chat } from "../../../database/models/chat.model";
import { ModelHelper } from "../../helpers/model.helper";
import { BaseRepository } from "../base.repository";
import { UserRepository } from "../user/user.repository";
import { ResponseHelper } from "../../helpers/reponseapi.helper";
export class ChatRepository
  extends BaseRepository<IChat, IChatDoc>
  implements IChatRepository
{
  private io?: Server;
  private userRepo: UserRepository;
  private userRepository: UserRepository;

  constructor(io?: Server) {
    super(Chat);
    this.io = io;
    this.userRepo = new UserRepository();
    this.userRepository = new UserRepository();
  }

  async getChats(
    user: string,
    page = 1,
    pageSize = 20,
    chatSupport = false,
    chatId = null
  ) {
    try {
      const skip = (page - 1) * pageSize;
      const currentUserId = new ObjectId(user);
      const chatSupportPip: any = {
        isChatSupport: chatSupport == true,
      };
      if (chatId) chatSupportPip._id = new ObjectId(chatId);
      const result = await Chat.aggregate([
        {
          $match: {
            ...chatSupportPip,
            $or: [
              {
                $and: [
                  { "participants.user": currentUserId },
                  { "participants.status": "active" },
                  { chatType: "one-to-one" },
                ],
              },
              {
                $and: [
                  {
                    $or: [
                      { "participants.user": currentUserId },
                      { "messages.receivedBy.user": currentUserId },
                      { "messages.sentBy": currentUserId },
                    ],
                  },
                  { chatType: "group" },
                ],
              },
            ],
          },
        },
        { $sort: { lastUpdatedAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(pageSize.toString()) },
        {
          $lookup: {
            from: "users",
            let: { participantIds: "$participants.user" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$participantIds"],
                  },
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                  photo: 1,
                },
              },
            ],
            as: "participantsData",
          },
        },
        {
          $unwind: { path: "$messages", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$_id", // Unique identifier for the chat
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
            groupName: { $first: "$groupName" },
            participantUsernames: { $first: "$participantUsernames" },
            totalMessages: { $first: "$totalMessages" },
            messages: { $push: "$messages" }, // Push the messages into an array again
            lastMessage: { $last: "$messages" }, // Get the last message as before
            participants: { $first: "$participantsData" },
            totalCount: { $first: "$totalCount" },
            unReadCount: { $first: "$unReadCount" },
          },
        },
        {
          $addFields: {
            messages: {
              // $slice: [
              //   {
              $filter: {
                input: "$messages",
                cond: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$$this.sentBy", currentUserId] },
                        { $ne: ["$$this.deleted", true] },
                      ],
                    },
                    {
                      $and: [
                        { $ne: ["$$this.sentBy", currentUserId] },
                        {
                          $in: [currentUserId, "$$this.receivedBy.user"],
                        },
                        {
                          $not: {
                            $in: [true, "$$this.receivedBy.deleted"],
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            participants: {
              $map: {
                input: "$participants",
                as: "participant",
                in: {
                  $mergeObjects: [
                    "$$participant",
                    {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$participantsData",
                            cond: {
                              $eq: ["$$this._id", "$$participant.user"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
            lastMessage: { $last: "$messages" },
            totalCount: { $size: "$messages" },
            unReadCount: {
              $size: {
                $filter: {
                  input: "$messages",
                  cond: {
                    $and: [
                      { $ne: ["$$this.sentBy", currentUserId] },
                      { $in: [currentUserId, "$$this.receivedBy.user"] },
                      {
                        $not: {
                          $in: ["seen", "$$this.receivedBy.status"],
                        },
                      },
                    ],
                  },
                },
              },
            },
            messages: { $reverseArray: { $slice: ["$messages", -40] } },
          },
        },
        {
          $match: {
            $or: [
              { chatType: "group" },
              { $and: [{ chatType: "one-to-one", messages: { $ne: [] } }] },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lastMessage.sentBy",
            foreignField: "_id",
            as: "sender",
          },
        },
        { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }, // Unwind the sender array
        {
          $addFields: {
            "lastMessage.firstName": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.firstName"] },
                "Unknown User",
              ],
            },
            "lastMessage.lastName": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.lastName"] },
                "Unknown User",
              ],
            },
            "lastMessage.photo": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.photo"] },
                "Unknown User",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id", // Unique identifier for the chat
            chatType: { $first: "$chatType" },
            isTicketClosed: { $first: "$isTicketClosed" },
            isChatSupport: { $first: "$isChatSupport" },
            groupName: { $first: "$groupName" },
            participantUsernames: { $first: "$participantUsernames" },
            totalMessages: { $first: "$totalMessages" },
            messages: { $first: "$messages" },
            lastMessage: { $first: "$lastMessage" },
            participants: { $first: "$participants" },
            totalCount: { $first: "$totalCount" },
            unReadCount: { $first: "$unReadCount" },
          },
        },
        {
          $sort: {
            "lastMessage.createdAt": -1,
          },
        },
        {
          $project: {
            chatType: 1,
            groupName: 1,
            isTicketClosed: 1,
            isChatSupport: 1,
            // messages: 1,
            lastMessage: 1,
            participants: 1,
            totalCount: 1,
            unReadCount: 1,
          },
        },
      ]);
      if (this.io) this.io?.emit(`getChats/${user}`, result);
      return result;
    } catch (error) {
      // Handle error
      // console.error("Error retrieving user chats:", error);
      throw error;
    }
  }

  // Get chat messages with pagination (50 per page)
  async getChatMessages(
    chatId: string,
    user: string,
    pageNumber: number,
    pageSize = 20
  ) {
    // Step 1: Convert the page number to skip value
    const skip = (pageNumber - 1) * parseInt(pageSize.toString());

    const result = await Chat.aggregate([
      { $match: { _id: new ObjectId(chatId) } }, // Match the chat ID
      { $unwind: "$messages" }, // Unwind the messages array
      { $sort: { "messages.createdAt": -1 } }, // Sort messages by latest createdAt date
      { $skip: skip }, // Skip the specified number of messages
      { $limit: parseInt(pageSize.toString()) }, // Limit the number of messages per page
      {
        $match: {
          $or: [
            {
              "messages.sentBy": new ObjectId(user),
              "messages.deleted": { $ne: true },
            },
            {
              // "messages.receivedBy.user": { $ne: null },
              "messages.receivedBy": {
                $elemMatch: {
                  user: new ObjectId(user),
                  deleted: { $ne: true },
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "messages.sentBy",
          foreignField: "_id",
          as: "sender",
        },
      },
      { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } }, // Unwind the sender array
      {
        $addFields: {
          "messages.senderId": "$sender._id",
          "messages.firstName": "$sender.firstName",
          "messages.lastName": "$sender.lastName",
          "messages.image": "$sender.image",
        },
      },
      {
        $group: {
          _id: "$_id",
          messages: { $push: "$messages" },
          // totalCount: { $sum: 1 }, // Calculate the total count of messages in the chat
          // unReadCount: { $sum: "$unReadCount" }, // Calculate the total count of unread messages in the chat
        },
      },
    ]);

    // Step 3: Extract the messages, total count, and unread count from the result
    const messages = result.length > 0 ? result[0].messages : [];
    const totalCount = result.length > 0 ? result[0].totalCount : 0;
    const unReadCount = result.length > 0 ? result[0].unReadCount : 0;

    // console.log("Messages:", messages);
    // console.log("Total Count:", totalCount);
    // console.log("Unread Count:", unReadCount);
    if (this.io)
      this.io?.emit(`getChatMessages/${user}`, {
        messages,
        totalCount,
        unReadCount,
      });
    return { messages, totalCount, unReadCount };
  }

  async createMessage(
    chatId: string,
    senderId: string,
    messageBody: string,
    urls?: string[],
    name?: string
  ) {
    try {
      const chat = await Chat.findById(chatId).select("-messages");

      if (!chat) {
        // Handle error: Chat not found
        throw new Error("Chat not found");
      }

      const id = new ObjectId();
      let newMessage = {
        _id: id,
        body: messageBody,
        mediaUrls: urls,
        sentBy: senderId,
        receivedBy: [],
        deleted: false,
        // Add other message properties if needed
      } as any;
      if (chat.participants.some((e: IParticipant) => e.isBlocked)) {
        if (this.io)
          this.io?.emit(
            `newMessage/${chatId}/${senderId}`,
            "cannot send message due to block"
          );
        return "cannot send message due to block";
      }
      chat.participants.forEach((participant: IParticipant) => {
        if (participant.status == "active" && participant.user != senderId) {
          newMessage.receivedBy.push({
            user: new ObjectId(participant.user),
            status: "sent",
            deleted: false,
          });
        }
      });
      // chat.messages.push(newMessage);
      // // console.log(newMessage);
      const lastMessage = {
        body: newMessage.body,
      };
      const updatedChat = await Chat.updateOne(
        { _id: chatId },
        {
          $push: { messages: newMessage },
          lastMessage,
          lastUpdatedAt: new Date(),
        },
        { new: true }
      );
      const userIds: any[] = [];
      chat.participants.forEach(async (participant: IParticipant) => {
        if (participant.status == "active" && participant.user != senderId) {
          if (!participant.isMuted) userIds.push(participant.user);
          // // console.log(`newMessage/${chatId}/${participant.user}`)
          if (this.io) {
            this.io?.emit(`newMessage/${chatId}/${participant.user}`, {
              ...newMessage,
              name,
              firstName: name,
              createdAt: new Date(),
            });
            // this.io?.emit(
            //   `getChats/${participant.user}`, await this.getChats(participant.user)
            // );
            await this.getChats(participant.user.toString());
          }
        }
      });
      // console.log(userIds);
      this.sendNotificationMsg(
        {
          userIds,
          title: name,
          body: messageBody,
          chatId,
        },
        chat
      );
      return updatedChat;
    } catch (error) {
      // Handle error
      // console.error("Error creating message:", error);
      throw error;
    }
  }

  // Mark all messages as read for a user
  async readAllMessages(chatId: string, user: string) {
    try {
      // const filter = {
      //   _id: chatId,
      //   "messages.receivedBy.user": user,
      //   "messages.receivedBy.status": { $ne: "seen" },
      //   "messages.receivedBy.deleted": { $ne: true },
      // };
      const filter = {
        _id: chatId,
        messages: {
          $elemMatch: {
            "receivedBy.user": user,
            "receivedBy.status": { $ne: "seen" },
            "receivedBy.deleted": { $ne: true },
          },
        },
      };
      const update = {
        $set: { "messages.$[msgElem].receivedBy.$[recElem].status": "seen" },
      };

      const options = {
        arrayFilters: [
          { "msgElem.receivedBy.user": user },
          { "recElem.user": user },
        ],
      };

      const result = await Chat.updateMany(filter, update, options);
      // console.log("Update result:", result);
      if (this.io)
        this.io?.emit(`readMessages/${chatId}/${user}`, {
          message:
            result.modifiedCount > 0
              ? "messages read"
              : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      // console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  // Delete a message for a user
  async deleteAllMessage(chatId: string, user: string) {
    try {
      const filter = {
        _id: chatId,
        // $or: [
        //   {
        //     "messages.receivedBy.user": user,
        //     "messages.receivedBy.deleted": { $ne: true },
        //   },
        //   {
        //     "messages.sentBy": user,
        //     "messages.deleted": { $ne: true },
        //   },
        // ],
      };

      const update = {
        $set: {
          "messages.$[msgElem].receivedBy.$[recElem].deleted": true,
          "messages.$[msgElem2].deleted": true,
        },
      };

      const options = {
        arrayFilters: [
          { "msgElem.receivedBy.user": user },
          { "recElem.user": user },
          { "msgElem2.sentBy": user },
        ],
      };
      const result = await Chat.updateMany(filter, update, options);
      // console.log(result);
      if (this.io)
        this.io?.emit(`deleteMessages/${chatId}/${user}`, {
          message:
            result.modifiedCount > 0
              ? "messages deleted"
              : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      // console.error("Error deleting messages:", error);
      throw error;
    }
  }

  async deleteSelectedMessage(chatId: string, user: string, msgIds?: string[]) {
    try {
      const filter = {
        _id: chatId,
        $or: [
          {
            "messages.receivedBy.user": user,
            "messages.receivedBy.deleted": { $ne: true },
            "messages.receivedBy._id": { $in: msgIds },
          },
          {
            "messages.sentBy": user,
            "messages.deleted": { $ne: true },
            "messages._id": { $in: msgIds },
          },
        ],
      };

      const update = {
        $set: {
          "messages.$[msgElem].receivedBy.$[recElem].deleted": true,
          "messages.$[msgElem2].deleted": true,
        },
      };

      const options = {
        arrayFilters: [
          { "msgElem.receivedBy.user": user },
          { "recElem.user": user },
          { "msgElem2.sentBy": user },
        ],
      };
      const result = await Chat.updateMany(filter, update, options);
      if (this.io)
        this.io?.emit(`deleteSelectedMessages/${chatId}/${user}`, {
          // message:
          //   result.modifiedCount > 0
          //     ? "selected messages deleted"
          //     : "operation unsuccessful",
          result,
        });
      return result;
    } catch (error) {
      // console.error("Error deleting messages:", error);
      throw error;
    }
  }

  // Add participants to a chat
  async addParticipants(
    chatId: string,
    user: string,
    participantIds: string[]
  ) {
    try {
      // console.log({ chatId, participantIds });
      const filter = { _id: chatId };
      const participantsToAdd: any[] = await this.userRepo.getAll(
        { _id: participantIds },
        undefined,
        ModelHelper.userSelect,
        undefined,
        undefined,
        true,
        1,
        200
      );
      let username = "";
      participantsToAdd.map(
        (e: IUser) => (username += `${e.firstName ?? ""} ${e.lastName ?? ""}, `)
      );

      const update = {
        $addToSet: {
          participants: {
            $each: participantIds.map((user) => ({
              user,
              status: "active",
            })),
          },
        },
      };

      let result: any = await Chat.findOneAndUpdate(filter, update)
        .select("-messages")
        .populate({
          path: "participants.user",
          select: "username firstName lastName _id photo",
        });

      const msg = {
        _id: new ObjectId(),
        body: `${username}joined the group`,
        addedUsers: participantIds,
        groupName: result.groupName,
        sentBy: null,
        receivedBy: result.participants.map((e: IParticipant) => ({
          user: e.user,
          status: "seen",
        })),
      };

      await result.update({
        $push: {
          messages: msg,
        },
      });

      await result.save();

      if (this.io) {
        result.participants.forEach(async (participant: any) => {
          if (participant.status == "active") {
            this.io?.emit(
              `newMessage/${chatId}/${participant.user._id.toString()}`,
              msg
            );
            // this.io?.emit(
            //   `getChats/${participant.user._id}`, await this.getChats(participant.user)
            // );
            await this.getChats(participant.user);
          }
        });

        this.io?.emit(`addParticipants/${chatId}`, {
          message: "added participants",
          result,
        });
      }

      return result;
    } catch (error) {
      // console.error("Error adding participants:", error);
      throw error;
    }
  }

  // Remove participants from a chat
  async removeParticipants(chatId: string, /*user,*/ participantIds: string[]) {
    try {
      // console.log({ chatId, participantIds });
      const filter = { _id: chatId /*admins: user*/ };
      const u: any[] = await this.userRepo.getAll(
        { _id: participantIds },
        undefined,
        ModelHelper.userSelect,
        undefined,
        undefined,
        true,
        1,
        200
      );
      let username = "";
      u.map(
        (e: IUser) => (username += `${e.firstName ?? ""} ${e.lastName ?? ""}, `)
      );
      // // console.log(username)
      const update = {
        $pull: { participants: { user: { $in: participantIds } } },
      };
      let result: any = await Chat.findOneAndUpdate(filter, update)
        .select("-messages")
        .populate({
          path: "participants.user",
          select: "username firstName lastName _id  photo",
        });
      // // console.log(result)
      const msg = {
        _id: new ObjectId(),
        body: `${username}leave the group`,
        removedUsers: participantIds,
        groupName: result.groupName,
        sentBy: null,
        receivedBy: result.participants.map((e: IParticipant) => ({
          user: e.user,
          status: "seen",
        })),
      };
      await result.update({
        $push: {
          messages: msg,
        },
      });
      const userIds: string[] = [];
      // // console.log(result)
      await result.save();
      if (participantIds.includes(result.createdBy.toString()))
        result = await Chat.findOneAndUpdate(filter, {
          createdBy: result.participants[0].user._id,
        }).populate({
          path: "participants.user",
          select: "username firstName lastName _id  photo status",
        });
      // // console.log(result.participants);
      if (this.io) {
        result.participants.forEach(async (participant: any) => {
          if (participant.status == "active") {
            // // console.log(participant.user._id.toString())
            if (
              participantIds[0] !== participant.user._id &&
              !participant.isMuted
            )
              userIds.push(participant.user._id);
            // // console.log(`newMessage/${chatId}/${participant.user}`)
            // if (this.io) {
            this.io?.emit(
              `newMessage/${chatId}/${participant.user._id.toString()}`,
              msg
            );
            // this.io?.emit(
            //   `getChats/${participant.user._id}`, await this.getChats(participant.user)
            // );
            await this.getChats(participant.user);
            // }
          }
        });
        this.io?.emit(`removeParticipants/${chatId}`, {
          message:
            result == null
              ? "you are not allowed to remove participants"
              : "removed participants",
          result,
        });
      }
      this.sendNotificationMsg(
        {
          userIds,
          title: result.groupName,
          body: `${username}leave the group`,
          chatId,
        },
        result
      );

      return result;
    } catch (error) {
      // console.error("Error removing participants:", error);
      throw error;
    }
  }

  //   // Add admins to a group chat
  //   async addAdmins(chatId: string, user: string, adminIds: string[]) {
  //     try {
  //       const filter = {
  //         _id: chatId,
  //         chatType: "group",
  //         admins: user,
  //       };
  //       const update = {
  //         $addToSet: { admins: { $each: adminIds } },
  //       };

  //       const result = await Chat.findOneAndUpdate(filter, update, {
  //         new: true,
  //       }).select("-messages");
  //       if (this.io)
  //         this.io?.emit(`addAdmins/${chatId}`, {
  //           message:
  //             result === null
  //               ? "you are not allowed to add admins"
  //               : "admin added",
  //           result,
  //         });
  //       return result;
  //     } catch (error) {
  //       // console.error("Error adding admins:", error);
  //       throw error;
  //     }
  //   }

  //   // Remove admins from a group chat
  //   async removeAdmins(chatId: string, user: string, adminIds: string[]) {
  //     try {
  //       const filter = {
  //         _id: chatId,
  //         admins: user,
  //         chatType: "group",
  //         createdBy: { $nin: adminIds },
  //       };
  //       const update = {
  //         $pull: { admins: { $in: adminIds } },
  //       };

  //       const result = await Chat.findOneAndUpdate(filter, update).select(
  //         "-messages"
  //       );
  //       const admins = result?.admins.filter(
  //         (value: IA) => !adminIds.includes(value.toString())
  //       );
  //       if (this.io)
  //         this.io?.emit(`removeAdmins/${chatId}`, {
  //           message:
  //             result === null
  //               ? "you are not allowed to remove admins"
  //               : "removed admins",
  //           result: { ...result, admins },
  //         });
  //       return result;
  //     } catch (error) {
  //       // console.error("Error removing admins:", error);
  //       throw error;
  //     }
  //   }

  async createChatSupport(user: string, topic = "new topic") {
    const check = await Chat.findOne({
      isChatSupport: true,
      isTicketClosed: false,
      createdBy: user,
    }).select("-messages -participants");
    if (check && this.io) {
      this.io?.emit(`createChatSupport/${user}`, {
        message:
          "you already have an open tickets. Please close those tickets to create new one",
      });
      return check;
    }
    const u = (await this.userRepo.getAll(
      { role: "admin", isActive: true },
      undefined,
      ModelHelper.userSelect,
      undefined,
      undefined,
      true,
      1,
      200
    )) as IUser[];
    // // console.log(u)
    let data: any = await Chat.create({
      groupName: topic,
      chatType: "group",
      isChatSupport: true,
      // groupImageUrl,
      participants: [
        {
          user: user,
          status: "active",
        },
        ...u.map((e: IUser) => ({ user: e._id, status: "active" })),
      ],
      createdBy: user,
      messages: [
        {
          body: "welcome to chat support.",
          sentBy: u[0]._id,
          receivedBy: [
            {
              user,
            }, //...u.map((e) => ({ user: e._id }))
          ],
          deleted: false,
        },
      ],
      // admins: chatType == "one-to-one" ? [] : [user],
    });
    data = await Chat.aggregate(findUserpipeline({ _id: data._id }));
    if (this.io)
      data[0].participants.forEach((e: IParticipant) => {
        // if(e!=user)
        this.io?.emit(`createChatSupport/${e.user}`, {
          message: "chat support created",
          data: data[0],
        });
      });
    return data[0];
  }

  async closeChatSupport(chatId: string, user: string) {
    const data: any = await Chat.findOneAndUpdate(
      { _id: chatId, isChatSupport: true },
      { isTicketClosed: true }
    ).select("-messages");
    if (this.io) {
      data.participants.forEach((e: IParticipant) => {
        // if(e!=user)
        this.io?.emit(`closeChatSupportTicket/${e.user}`, {
          message: "ticket closed",
          data: data,
        });
      });
    }
  }

  async createChat(
    user: string,
    participantIds: string[],
    chatType: string,
    groupName: string,
    groupImageUrl?: string
  ) {
    try {
      let match: any = {
        "participants.user": { $all: participantIds },
        deleted: false,
      };
      let check: any = null;
      if (chatType == "one-to-one") {
        match.chatType = "one-to-one";
        check = await Chat.findOne(match);
      }
      if (check) {
        check = await Chat.aggregate(findUserpipeline({ _id: check._id }));
        if (this.io)
          participantIds.forEach((e) => {
            this.io?.emit(`createChat/${e}`, {
              message: "chat already exits",
              data: check[0],
            });
          });
        return check[0];
      }
      const data = await Chat.create({
        groupName,
        chatType,
        groupImageUrl,
        participants: participantIds.map((e) => ({
          user: e,
          status: "active",
        })),
        createdBy: chatType == "one-to-one" ? null : user,
        admins: chatType == "one-to-one" ? [] : [user],
      });
      const d = await Chat.aggregate(findUserpipeline({ _id: data._id }));
      if (this.io)
        participantIds.forEach((e) => {
          // if(e!=user)
          this.io?.emit(`createChat/${e}`, {
            message: "chat created",
            data: d[0],
          });
        });
      if (chatType === "group") {
        this.sendNotificationMsg(
          {
            userIds: participantIds.filter((item) => item !== user),
            title: groupName,
            body: "You are added to a group",
            chatId: d[0]._id,
          },
          d[0]
        );
      }
      return d[0];
    } catch (e) {
      // console.log(e);
      return e;
    }
  }

  async createChatForTask(payload: IChatPayload) {
    try {
      let payloadData: any = payload;
      let messages: IMessage[] = [];
      if (payload.participants.length && payload.participants.length === 1) {
        delete payload.groupName;
        let user = await this.userRepo.getById<IUser>(
          payload.participants[0] as string
        );
        if (!user)
          return ResponseHelper.sendResponse(
            404,
            `Participant with Id ${payload.participants[0]} not found`
          );
        payload.chatType = "one-to-one";
        let msg: IMessage = {
          body: `Hey ${
            user?.username || user?.firstName
          }, I think you are a good candidate for this task. I am looking forward in working with you on this task.`,
          sentBy: payload.user,
        };
        messages.push(msg);
      } else if (payload.participants.length) {
        payload.chatType = "group";
        let msg: IMessage = {
          body: `Hey, I think you guys are good candidates for this task. I am looking forward in working with you all this task.`,
          sentBy: payload.user,
        };
        messages.push(msg);
      }

      const data = await Chat.create({
        ...payload,
        participants: payload.participants.map((e) => ({
          user: e,
          status: "active",
        })),
        messages: messages,
        createdBy: payload.user,
      });

      const d = await Chat.aggregate(findUserpipeline({ _id: data._id }));
      if (this.io)
        payload.participants.forEach((e) => {
          this.io?.emit(`createChat/${e}`, {
            message: "chat created",
            data: d[0],
          });
        });
      if (payload.chatType === "group") {
        this.sendNotificationMsg(
          {
            userIds: payloadData.participants.filter(
              (item: any) => item !== payload.user
            ),
            title: payload.groupName,
            body: "You are added to a group",
            chatId: d[0]._id,
          },
          d[0]
        );
      }
      return d[0];
    } catch (error) {
      console.log({ error });
      throw ResponseHelper.sendResponse(500, (error as Error).message);
    }
  }

  async getChatMedia(chatId: string, user: string) {
    // Assuming you have the chatId or any other identifier for the desired chat
    // const chatId = 'your_chat_id_here';

    const mediaFiles = await Chat.aggregate([
      // Match the desired chat using its ID or any other criteria
      {
        $match: {
          _id: new ObjectId(chatId),
        },
      },
      // Unwind the messages array to create separate documents for each message
      {
        $unwind: "$messages",
      },
      // Match only the messages with non-empty mediaUrls
      {
        $match: {
          "messages.mediaUrls": { $exists: true, $ne: null },
          $or: [
            {
              "messages.sentBy": new ObjectId(user),
              "messages.deleted": { $ne: true },
            },
            {
              "messages.receivedBy.user": new ObjectId(user),
              "messages.receivedBy.deleted": { $ne: true },
            },
          ],
        },
      },
      // Group the mediaUrls from all matching messages into a single array
      {
        $group: {
          _id: null,
          messages: {
            $push: {
              messageId: "$messages._id",
              mediaUrls: "$messages.mediaUrls",
            },
          },
        },
      },
      // Project the result to show messageId instead of _id
      {
        $project: {
          _id: 0,
          mediaUrls: {
            $reduce: {
              input: "$messages.mediaUrls",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
          messages: {
            $map: {
              input: "$messages",
              as: "msg",
              in: {
                messageId: "$$msg.messageId",
                mediaUrls: "$$msg.mediaUrls",
              },
            },
          },
        },
      },
    ]);
    return mediaFiles;
  }

  async updateChat(chatId: string, groupName?: string, image?: string) {
    const data: any = {};
    if (groupName) data.groupName = groupName;
    if (image) data.groupImageUrl = image;
    let m: any = await Chat.updateOne(
      { _id: chatId, chatType: "group" },
      { ...data }
    );
    m = null;
    m = (
      await Chat.aggregate([
        { $match: { _id: new ObjectId(chatId) } },
        ...findUserpipeline({}),
      ])
    )[0];
    // // console.log(m)
    this.io?.emit(`updateChat/${chatId}`, m);
    m.participants.forEach(async (e: IParticipant) => {
      if (e.status == "active")
        // this.io?.emit(`getChats/${e.user.toString()}`, await this.getChats(e.user))
        await this.getChats(e.user.toString());
    });
    return m;
  }

  async updateMuteStatus(data: any) {
    const chat: IChat = await Chat.findOne({
      _id: data.chatId,
      "participants.user": data.user,
    }).select("participants");
    chat.participants.forEach((e: IParticipant) => {
      if (e.user.toString() == data.user) {
        e.isMuted = data.isMuted;
        return;
      }
    });
    return await chat.save();
  }

  async updateBlockStatus(data: any) {
    const chat: IChat = await Chat.findOne({
      _id: data.chatId,
      "participants.user": data.user,
    }).select("participants");
    chat.participants.forEach((e: IParticipant) => {
      if (e.user.toString() == data.user) {
        e.isBlocked = data.isBlocked;
        return;
      }
    });
    if (this.io)
      this.io?.emit(
        `updateBlockStatus/${data.user}`,
        "user block status updated"
      );
    return await chat.save();
  }

  async sendNotificationMsg(data: any, chat = {}) {
    const users = await this.userRepo.getAll(
      { _id: data.userIds },
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
  }
}

function findUserpipeline(match: any) {
  return [
    { $match: match },
    {
      $lookup: {
        from: "users",
        let: { participantIds: "$participants.user" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$_id", "$$participantIds"],
              },
            },
          },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              photo: 1,
            },
          },
        ],
        as: "participantsData",
      },
    },
    {
      $addFields: {
        participants: {
          $map: {
            input: "$participants",
            as: "participant",
            in: {
              $mergeObjects: [
                "$$participant",
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$participantsData",
                        cond: { $eq: ["$$this._id", "$$participant.user"] },
                      },
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        chatType: { $first: "$chatType" },
        groupName: { $first: "$groupName" },
        groupImageUrl: { $first: "$groupImageUrl" },
        // groupName: 1,
        participants: { $first: "$participants" },
        // Add other fields you want to include
      },
    },
    {
      $project: {
        // id: '$_id',
        chatType: 1,
        groupName: 1,
        groupImageUrl: 1,
        // participantUsernames: 1,
        // totalMessages: 1,
        // messages: { $reverseArray: { $slice: ["$messages", -40] } },
        // lastMessage: { $last: "$messages" },
        participants: 1,
        // totalCount: 1,
        // unReadCount: 1,
      },
    },
  ];
}
