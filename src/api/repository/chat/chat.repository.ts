import { ObjectId } from "bson";
import { Server } from "socket.io";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { uuid } from "uuidv4";
import { Request } from "express";
import * as apn from "apn";

import {
  IChat,
  IChatDoc,
  IChatPayload,
  IMessage,
  IParticipant,
  IReceivedBy,
} from "../../../database/interfaces/chat.interface";
import { IChatRepository } from "./chat.repository.interface";
import { IUser } from "../../../database/interfaces/user.interface";
import { Chat } from "../../../database/models/chat.model";
import { ModelHelper } from "../../helpers/model.helper";
import { BaseRepository } from "../base.repository";
import { UserRepository } from "../user/user.repository";
import { ResponseHelper } from "../../helpers/reponseapi.helper";
import {
  ECALLDEVICETYPE,
  EChatType,
  EMessageStatus,
  EParticipantStatus,
  ETICKET_STATUS,
  EUserRole,
  MessageType,
} from "../../../database/interfaces/enums";
import {
  NotificationHelper,
  PushNotification,
} from "../../helpers/notification.helper";
import {
  APP_CERTIFICATE,
  APP_ID,
  IOS_KEY,
  IOS_KEY_ID,
  IOS_TEAM_ID,
} from "../../../config/environment.config";
export class ChatRepository
  extends BaseRepository<IChat, IChatDoc>
  implements IChatRepository
{
  private io?: Server;
  private userRepository: UserRepository;

  constructor(io?: Server) {
    super(Chat);
    this.io = io;
    this.userRepository = new UserRepository();
  }

  async getChats(
    user: string,
    page = 1,
    pageSize = 20,
    chatSupport = false,
    chatId = null,
    search?: string
  ) {
    try {
      const skip = (page - 1) * pageSize;
      const currentUserId = new ObjectId(user);
      const chatSupportPip: any = {
        isChatSupport: chatSupport == true,
      };
      if (chatId) chatSupportPip._id = new ObjectId(chatId);
      const query: any = [
        {
          $match: {
            ...chatSupportPip,
            $or: [
              {
                $and: [
                  { "participants.user": currentUserId },
                  { "participants.status": EParticipantStatus.ACTIVE },
                  { chatType: EChatType.ONE_TO_ONE },
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
                  { chatType: EChatType.GROUP },
                ],
              },
            ],
          },
        },
        { $sort: { lastUpdatedAt: -1 } },
        { $skip: skip },
      ];

      const remainingQuery = [
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
                  profileImage: 1,
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
                          $in: [
                            EMessageStatus.SEEN,
                            "$$this.receivedBy.status",
                          ],
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
            $or: search
              ? [{ _id: { $ne: null } }]
              : [
                  { chatType: EChatType.GROUP, messages: { $ne: [] } },
                  {
                    $and: [
                      {
                        chatType: EChatType.ONE_TO_ONE,
                        messages: { $ne: [] },
                      },
                    ],
                  },
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
            "lastMessage.profileImage": {
              $cond: [
                { $ne: ["$sender", null] },
                { $concat: ["$sender.profileImage"] },
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
      ];
      if (search) {
        query.push(
          ...[
            {
              $lookup: {
                from: "users",
                let: {
                  participantIds: "$participants.user",
                  isMuted: "$participants.isMuted",
                },
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
                      username: 1,
                      fullName: {
                        $concat: ["$firstName", " ", "$lastName"],
                      },
                      email: 1,
                      profileImage: 1,
                      photoUrl: 1,
                      isMuted: {
                        $arrayElemAt: [
                          "$$isMuted",
                          {
                            $indexOfArray: ["$$participantIds", "$_id"],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: "participantsData",
              },
            },
            {
              $match: {
                $or: [
                  {
                    groupName: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.firstName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.lastName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.username": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "participantsData.email": { $regex: search, $options: "i" },
                  },
                  // { email: { $regex: q, $options: 'i' } },
                ],
              },
            },
          ]
        );
        remainingQuery.splice(1, 1);
      }
      query.push(...remainingQuery);
      const result = await Chat.aggregate(query);
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
        if (
          participant.status == EParticipantStatus.ACTIVE &&
          participant.user != senderId
        ) {
          newMessage.receivedBy.push({
            user: new ObjectId(participant.user),
            status: EMessageStatus.SENT,
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
        if (
          participant.status == EParticipantStatus.ACTIVE &&
          participant.user != senderId
        ) {
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
      //   "messages.receivedBy.status": { $ne: EMessageStatus.SEEN },
      //   "messages.receivedBy.deleted": { $ne: true },
      // };
      const filter = {
        _id: chatId,
        messages: {
          $elemMatch: {
            "receivedBy.user": user,
            "receivedBy.status": { $ne: EMessageStatus.SEEN },
            "receivedBy.deleted": { $ne: true },
          },
        },
      };
      const update = {
        $set: {
          "messages.$[msgElem].receivedBy.$[recElem].status":
            EMessageStatus.SEEN,
        },
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
  async deleteAllMessage(chatId: string, user: string | ObjectId) {
    try {
      user = new ObjectId(user);
      const filter = {
        _id: new ObjectId(chatId),
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
      const participantsToAdd: any[] = await this.userRepository.getAll(
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
              status: EParticipantStatus.ACTIVE,
            })),
          },
        },
      };

      let result: any = await Chat.findOneAndUpdate(filter, update)
        .select("-messages")
        .populate({
          path: "participants.user",
          select: "username firstName lastName _id profileImage",
        });

      const msg = {
        _id: new ObjectId(),
        body: `${username}joined the group`,
        addedUsers: participantIds,
        groupName: result.groupName,
        sentBy: null,
        receivedBy: result.participants.map((e: IParticipant) => ({
          user: e.user,
          status: EMessageStatus.SEEN,
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
          if (participant.status == EParticipantStatus.ACTIVE) {
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
      const u: any[] = await this.userRepository.getAll(
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
          select: "username firstName lastName _id  profileImage",
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
          status: EMessageStatus.SEEN,
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
          select: "username firstName lastName _id  profileImage status",
        });
      // // console.log(result.participants);
      if (this.io) {
        result.participants.forEach(async (participant: any) => {
          if (participant.status == EParticipantStatus.ACTIVE) {
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
  //         chatType: EChatType.GROUP,
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
  //         chatType: EChatType.GROUP,
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
    // const check = await Chat.findOne({
    //   isChatSupport: true,
    //   isTicketClosed: false,
    //   createdBy: user,
    // }).select("-messages -participants");
    // if (check && this.io) {
    //   this.io?.emit(`createChatSupport/${user}`, {
    //     message:
    //       "you already have an open tickets. Please close those tickets to create new one",
    //   });
    //   return check;
    // }
    const u = (await this.userRepository.getAll(
      { role: EUserRole.admin, isActive: true },
      undefined,
      ModelHelper.userSelect,
      undefined,
      undefined,
      true,
      1,
      200
    )) as IUser[];
    // // console.log(u)
    topic = Math.random().toString(36).substring(3, 15).toUpperCase();
    let data: any = await Chat.create({
      groupName: topic,
      chatType: EChatType.GROUP,
      ticketStatus: ETICKET_STATUS.PENDING,
      isChatSupport: true,
      // groupImageUrl,
      participants: [
        {
          user: user,
          status: EParticipantStatus.ACTIVE,
        },
        ...u.map((e: IUser) => ({
          user: e._id,
          status: EParticipantStatus.ACTIVE,
        })),
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
      // admins: chatType == EChatType.ONE_TO_ONE ? [] : [user],
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

  async changeTicketStatus(chatId: string, ticketStatus: ETICKET_STATUS) {
    if (
      ticketStatus != ETICKET_STATUS.PROGRESS &&
      ticketStatus != ETICKET_STATUS.COMPLETED
    ) {
      console.log(ticketStatus);
      if (this.io)
        this.io.emit(`changeTicketStatus/${chatId}`, {
          message: `invalid ticket Status allowed status ${ETICKET_STATUS.PROGRESS}, ${ETICKET_STATUS.COMPLETED}`,
          // data: data,
        });
      return;
    }
    const data: any = await Chat.findOneAndUpdate(
      { _id: chatId, isChatSupport: true },
      { ticketStatus },
      { new: true }
    ).select("-messages");
    if (this.io) {
      data.participants.forEach((e: IParticipant) => {
        // if(e!=userId)
        this.io?.emit(`changeTicketStatus/${e.user}`, {
          message: "ticket status updated",
          data: data,
        });
      });
    }
  }

  async closeChatSupport(chatId: string, user: string) {
    const data: any = await Chat.findOneAndUpdate(
      { _id: chatId, isChatSupport: true },
      { isTicketClosed: true, ticketStatus: ETICKET_STATUS.CLOSED },
      { new: true }
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
      if (chatType == EChatType.ONE_TO_ONE) {
        match.chatType = EChatType.ONE_TO_ONE;
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
      const messages: IMessage[] = [];
      let usernames = "";
      let createdByUsername = "";
      const users = await this.userRepository.getAll(
        {
          _id: participantIds.map((e: string) => new ObjectId(e)),
        },
        undefined,
        ModelHelper.userSelect
      );
      users.forEach((e: any) => {
        if (e._id.toString() !== user)
          usernames += `${e.firstName ?? ""} ${e.lastName ?? ""}, `;
        else createdByUsername = `${e.firstName ?? ""} ${e.lastName ?? ""}`;
      });
      participantIds.forEach(async (participant: string) => {
        const welcomeMessageBody = `you ${
          chatType == EChatType.GROUP ? "created a group" : "started a"
        } chat with ${usernames}`;

        // Add the welcome message to the chat
        const welcomeMessage: IMessage = {
          body: welcomeMessageBody.slice(0, welcomeMessageBody.length - 2),
          type: MessageType.system,
          receivedBy: [
            { user: participant, status: EMessageStatus.SENT },
          ] as IReceivedBy[],
        };

        if (participant !== user) {
          welcomeMessage.body = `${createdByUsername} started a chat with you`;
        }

        messages.push(welcomeMessage);
      });
      const data = await Chat.create({
        groupName,
        chatType,
        groupImageUrl,
        participants: participantIds.map((e) => ({
          user: e,
          status: EParticipantStatus.ACTIVE,
        })),
        createdBy: user,
        admins: chatType == EChatType.ONE_TO_ONE ? [] : [user],
        messages,
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
      if (chatType === EChatType.GROUP) {
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
      if (payload.participants.length && payload.participants.length === 2) {
        delete payload.groupName;
        let user = await this.userRepository.getById<IUser>(
          payload.participants[1] as string
        );
        if (!user)
          return ResponseHelper.sendResponse(
            404,
            `Participant with Id ${payload.participants[0]} not found`
          );
        payload.chatType = EChatType.ONE_TO_ONE;
        let msg: IMessage = {
          body: `Hey ${
            user?.username || user?.firstName
          }, I think you are a good candidate for this task. I am looking forward in working with you on this task.`,
          sentBy: payload.user,
          receivedBy: payload.participants
            .slice(1)
            .map(
              (e) => ({ user: e, status: EMessageStatus.SENT } as IReceivedBy)
            ),
        };
        messages.push(msg);
      } else if (payload.participants.length) {
        payload.chatType = EChatType.GROUP;
        let msg: IMessage = {
          body: `Hey, I think you guys are good candidates for this task. I am looking forward in working with you all this task.`,
          sentBy: payload.user,
          receivedBy: payload.participants
            .slice(1)
            .map(
              (e) => ({ user: e, status: EMessageStatus.SENT } as IReceivedBy)
            ),
        };
        messages.push(msg);
      }

      const data = await Chat.create({
        ...payload,
        participants: payload.participants.map((e) => ({
          user: e,
          status: EParticipantStatus.ACTIVE,
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
      if (payload.chatType === EChatType.GROUP) {
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
      { _id: chatId, chatType: EChatType.GROUP },
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
      if (e.status == EParticipantStatus.ACTIVE)
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
    const users = await this.userRepository.getAll(
      { _id: data.userIds },
      undefined,
      `fcmTokens _id`,
      undefined,
      undefined,
      true
    );
    users.forEach((e: any) => {
      NotificationHelper.sendNotification({
        title: data.title,
        body: data.body,
        tokens: e.fcmTokens,
        data: { chatId: data.chatId.toString(), user: e._id.toString() },
      });
    });
  }

  async getAgoraToken(req: Request) {
    if (req && req.body) {
      const userId = req.body.user;
      // TODO: move them to env in future
      const { calleeInfo, videoSDKInfo } = req.body;
      let calleeID = req.body?.calleeID;
      const channelName = req.query?.channelName;
      const uid = req.query?.uid;
      const notifyOther = req.query?.notifyOther;

      const role = RtcRole?.PUBLISHER;
      const expirationTimeInSeconds = 60 * 60;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
      const tokenA = RtcTokenBuilder?.buildTokenWithAccount(
        APP_ID as string,
        APP_CERTIFICATE as string,
        channelName as string,
        uid as string,
        role,
        privilegeExpiredTs
      );
      // const tokenA = "";

      console.log("Token with integer number Uid: " + tokenA);

      if (notifyOther) {
        if (calleeID?.length) {
          calleeID?.forEach((calleeID: string) => {
            this.userRepository.getCallToken(calleeID).then((v: any) => {
              if (v)
                this.userRepository
                  .getById(userId)
                  .then(({ firstName, lastName }: any) => {
                    if ((v as any).callDeviceType === ECALLDEVICETYPE.ios) {
                      const callerInfo = {
                        chatId: req.query.channelName,
                        title: firstName + " " + lastName,
                        isGroup: req.body?.isGroup ? true : false,
                        participants: req.body?.participants,
                      };
                      const info = JSON.stringify({
                        callerInfo,
                        videoSDKInfo: {},
                        type: "CALL_INITIATED",
                      });

                      // let deviceToken = calleeInfo.APN;

                      // TODO: change environement i.e: production or debug
                      const options: any = {
                        token: {
                          key: IOS_KEY, // path of .p8 file
                          keyId: IOS_KEY_ID,
                          teamId: IOS_TEAM_ID,
                        },
                        production: false,
                      };

                      var apnProvider = new apn.Provider({ ...options } as any);

                      var note = new apn.Notification();

                      note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                      note.badge = 1;
                      note.sound = "ping.aiff";
                      note.alert = "You have a new message";
                      note.rawPayload = {
                        callerName: callerInfo?.title ?? "hello",
                        aps: {
                          "content-available": 1,
                        },
                        handle: callerInfo?.title ?? "hello",
                        callerInfo,
                        videoSDKInfo,
                        data: { info, type: "CALL_INITIATED" },
                        type: "CALL_INITIATED",
                        uuid: uuid(),
                      };
                      // note.pushType = "voip";
                      note.topic = "org.goollooper.app.voip";
                      apnProvider
                        .send(note, v.callToken)
                        .then((result: any) => {
                          console.log("RESULT", result);
                          if (result.failed && result.failed.length > 0) {
                            console.log("FAILED", result.failed);
                          }
                        });
                    } else {
                      const info = JSON.stringify({
                        callerInfo: {
                          chatId: req.query.channelName,
                          title: firstName + " " + lastName,
                          isGroup: req.body?.isGroup ? true : false,
                          participants: req.body?.participants,
                        },
                        videoSDKInfo: {},
                        type: "CALL_INITIATED",
                      });
                      const message = {
                        data: { info },
                        android: { priority: "high" },
                        registration_ids: [v.callToken],
                      };
                      NotificationHelper.sendNotification({
                        data: message.data,
                        tokens: message.registration_ids,
                      } as PushNotification);
                      // fcm.send(message, function (err, res) {
                      //   if (err) {
                      //     console.log("Error: " + err);
                      //   } else {
                      //     console.log("Success: " + res);
                      //   }
                      // });
                    }
                  });
            });
          });
        }
      }

      return ResponseHelper.sendSuccessResponse(
        "agora user token from user id",
        tokenA
      );
    }
    return ResponseHelper.sendResponse(400, "Agora token failed");
  }

  async endCall(req: Request) {
    // const userId = req.body.user;
    const chatId = req.body.chatId;
    // const calleeId = req.body.callee;
    const { videoSDKInfo } = req.body;

    const calleeID = req.body?.calleeID;
    const notifyOther = req.query?.notifyOther;

    if (notifyOther) {
      if (calleeID?.length) {
        calleeID?.forEach((calleeId: string) => {
          this.userRepository.getCallToken(calleeId).then((v: any) => {
            if (v)
              if (v.callDeviceType === ECALLDEVICETYPE.ios) {
                const callerInfo = {
                  chatId: req.query.channelName,
                  title: "Call ended",
                  isGroup: req.body?.isGroup ? true : false,
                  participants: req.body?.participants,
                };
                const info = JSON.stringify({
                  callerInfo,
                  videoSDKInfo: {},
                  type: "CALL_DECLINED",
                });

                const options: any = {
                  token: {
                    key: IOS_KEY, // path of .p8 file
                    keyId: IOS_KEY_ID,
                    teamId: IOS_TEAM_ID,
                  },
                  production: false,
                };

                var apnProvider = new apn.Provider({ ...options });

                var note = new apn.Notification();

                note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                note.badge = 1;
                note.sound = "ping.aiff";
                note.alert = "You have a new message";
                note.rawPayload = {
                  callerName: callerInfo.title,
                  aps: {
                    "content-available": 1,
                  },
                  handle: callerInfo?.title ?? "hello",
                  callerInfo,
                  videoSDKInfo,
                  data: { info, type: "CALL_DECLINED" },
                  type: "CALL_DECLINED",
                  uuid: uuid(),
                };
                // note.pushType = "voip";
                note.topic = "org.goollooper.app.voip";
                apnProvider.send(note, v.callToken).then((result) => {
                  console.log("RESULT", result);
                  if (result.failed && result.failed.length > 0) {
                    console.log("FAILED", result.failed);
                  }
                });
              } else {
                const info = JSON.stringify({
                  callerInfo: {
                    chatId: chatId,
                    title: null,
                    isGroup: false,
                    participants: [],
                  },
                  videoSDKInfo: {},
                  type: "CALL_DECLINED",
                });
                const message = {
                  data: { info },
                  android: { priority: "high" },
                  registration_ids: [v.callToken],
                };
                NotificationHelper.sendNotification({
                  data: message.data,
                  tokens: message.registration_ids,
                } as PushNotification);
                // fcm.send(message, function (err, res) {
                //   if (err) {
                //     console.log("Error: " + err);
                //   } else {
                //     console.log("Success: " + res);
                //   }
                // });
              }
          });
        });
        // console.log(
        //   "🚀 ~ file: videoController.js:335 ~ calleeID?.forEach ~ calleeID:",
        //   calleeID
        // );
      }
    }
    return ResponseHelper.sendSuccessResponse("call ended Successfully");
  }

  async updateCallToken(req: Request) {
    const user = await this.userRepository.updateById(
      req.locals.auth?.userId as string,
      req.body
    );
    if (user)
      return ResponseHelper.sendSuccessResponse("call token updated", user);
    return ResponseHelper.sendResponse(400, "Call token update failed");
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
              profileImage: 1,
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
