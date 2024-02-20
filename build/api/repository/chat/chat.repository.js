"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const axios_1 = __importDefault(require("axios"));
const bson_1 = require("bson");
const agora_access_token_1 = require("agora-access-token");
const uuidv4_1 = require("uuidv4");
const apn = __importStar(require("apn"));
const chat_model_1 = require("../../../database/models/chat.model");
const model_helper_1 = require("../../helpers/model.helper");
const base_repository_1 = require("../base.repository");
const user_repository_1 = require("../user/user.repository");
const reponseapi_helper_1 = require("../../helpers/reponseapi.helper");
const enums_1 = require("../../../database/interfaces/enums");
const notification_helper_1 = require("../../helpers/notification.helper");
const environment_config_1 = require("../../../config/environment.config");
class ChatRepository extends base_repository_1.BaseRepository {
    constructor(io) {
        super(chat_model_1.Chat);
        this.io = io;
        this.userRepository = new user_repository_1.UserRepository();
    }
    async getChats(user, page = 1, pageSize = 20, chatSupport = false, chatId = null, search) {
        try {
            const skip = (page - 1) * pageSize;
            const currentUserId = new bson_1.ObjectId(user);
            const chatSupportPip = {
                isChatSupport: chatSupport == true,
            };
            if (chatId)
                chatSupportPip._id = new bson_1.ObjectId(chatId);
            const query = [
                {
                    $match: {
                        ...chatSupportPip,
                        $or: [
                            {
                                $and: [
                                    { "participants.user": currentUserId },
                                    { "participants.status": enums_1.EParticipantStatus.ACTIVE },
                                    { chatType: enums_1.EChatType.ONE_TO_ONE },
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
                                    { chatType: enums_1.EChatType.GROUP },
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
                        _id: "$_id",
                        chatType: { $first: "$chatType" },
                        isTicketClosed: { $first: "$isTicketClosed" },
                        isChatSupport: { $first: "$isChatSupport" },
                        groupName: { $first: "$groupName" },
                        participantUsernames: { $first: "$participantUsernames" },
                        totalMessages: { $first: "$totalMessages" },
                        messages: { $push: "$messages" },
                        lastMessage: { $last: "$messages" },
                        participants: { $first: "$participantsData" },
                        totalCount: { $first: "$totalCount" },
                        unReadCount: { $first: "$unReadCount" },
                        createdBy: { $first: "$createdBy" },
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
                                                        enums_1.EMessageStatus.SEEN,
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
                                { chatType: enums_1.EChatType.GROUP, messages: { $ne: [] } },
                                {
                                    $and: [
                                        {
                                            chatType: enums_1.EChatType.ONE_TO_ONE,
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
                { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
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
                        _id: "$_id",
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
                        createdBy: { $first: "$createdBy" },
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
                        createdBy: 1,
                    },
                },
            ];
            if (search) {
                query.push(...[
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
                ]);
                remainingQuery.splice(1, 1);
            }
            query.push(...remainingQuery);
            const result = await chat_model_1.Chat.aggregate(query);
            if (this.io)
                this.io?.emit(`getChats/${user}`, result);
            return result;
        }
        catch (error) {
            // Handle error
            // console.error("Error retrieving user chats:", error);
            throw error;
        }
    }
    // Get chat messages with pagination (50 per page)
    async getChatMessages(chatId, user, pageNumber, pageSize = 20) {
        // Step 1: Convert the page number to skip value
        const skip = (pageNumber - 1) * parseInt(pageSize.toString());
        const result = await chat_model_1.Chat.aggregate([
            { $match: { _id: new bson_1.ObjectId(chatId) } },
            { $unwind: "$messages" },
            { $sort: { "messages.createdAt": -1 } },
            { $skip: skip },
            { $limit: parseInt(pageSize.toString()) },
            {
                $match: {
                    $or: [
                        {
                            "messages.sentBy": new bson_1.ObjectId(user),
                            "messages.deleted": { $ne: true },
                        },
                        {
                            // "messages.receivedBy.user": { $ne: null },
                            "messages.receivedBy": {
                                $elemMatch: {
                                    user: new bson_1.ObjectId(user),
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
            { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    "messages.senderId": "$sender._id",
                    "messages.firstName": "$sender.firstName",
                    "messages.lastName": "$sender.lastName",
                    "messages.image": "$sender.image",
                },
            },
            {
                $lookup: {
                    from: "tasks",
                    localField: "task",
                    foreignField: "_id",
                    as: "task",
                },
            },
            { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$_id",
                    messages: { $push: "$messages" },
                    requests: { $first: "$requests" },
                    task: { $first: "$task" },
                    // totalCount: { $sum: 1 }, // Calculate the total count of messages in the chat
                    // unReadCount: { $sum: "$unReadCount" }, // Calculate the total count of unread messages in the chat
                },
            },
        ]);
        // Step 3: Extract the messages, total count, and unread count from the result
        const messages = result.length > 0
            ? processChatMessages(result[0].messages)
            : [];
        const totalCount = result.length > 0 ? result[0].totalCount : 0;
        const unReadCount = result.length > 0 ? result[0].unReadCount : 0;
        const requests = result.length > 0 ? result[0].requests : 0;
        const task = result.length > 0 ? result[0].task : 0;
        // console.log("Messages:", messages);
        // console.log("Total Count:", totalCount);
        // console.log("Unread Count:", unReadCount);
        if (this.io)
            this.io?.emit(`getChatMessages/${user}`, {
                messages,
                totalCount,
                unReadCount,
            });
        return { messages, totalCount, unReadCount, requests, task };
    }
    async createMessage(chatId, senderId, messageBody, urls, name) {
        try {
            const chat = await chat_model_1.Chat.findById(chatId).select("-messages");
            if (!chat) {
                // Handle error: Chat not found
                throw new Error("Chat not found");
            }
            const id = new bson_1.ObjectId();
            let newMessage = {
                _id: id,
                body: messageBody,
                mediaUrls: urls,
                sentBy: senderId,
                receivedBy: [],
                deleted: false,
                // Add other message properties if needed
            };
            if (chat.participants.some((e) => e.isBlocked)) {
                if (this.io)
                    this.io?.emit(`newMessage/${chatId}/${senderId}`, "cannot send message due to block");
                return "cannot send message due to block";
            }
            chat.participants.forEach((participant) => {
                if (participant.status == enums_1.EParticipantStatus.ACTIVE &&
                    participant.user != senderId) {
                    newMessage.receivedBy.push({
                        user: new bson_1.ObjectId(participant.user),
                        status: enums_1.EMessageStatus.SENT,
                        deleted: false,
                    });
                }
            });
            // chat.messages.push(newMessage);
            // // console.log(newMessage);
            const lastMessage = {
                body: newMessage.body,
            };
            const updatedChat = await chat_model_1.Chat.updateOne({ _id: chatId }, {
                $push: { messages: newMessage },
                lastMessage,
                lastUpdatedAt: new Date(),
            }, { new: true });
            const userIds = [];
            chat.participants.forEach(async (participant) => {
                if (participant.status == enums_1.EParticipantStatus.ACTIVE &&
                    participant.user != senderId) {
                    if (!participant.isMuted)
                        userIds.push(participant.user);
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
            this.sendNotificationMsg({
                userIds,
                title: name,
                body: messageBody,
                chatId,
                urls,
                chatType: chat.chatType,
                groupName: chat?.groupName,
            }, chat);
            return updatedChat;
        }
        catch (error) {
            // Handle error
            // console.error("Error creating message:", error);
            throw error;
        }
    }
    // Mark all messages as read for a user
    async readAllMessages(chatId, user) {
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
                        "receivedBy.status": { $ne: enums_1.EMessageStatus.SEEN },
                        "receivedBy.deleted": { $ne: true },
                    },
                },
            };
            const update = {
                $set: {
                    "messages.$[msgElem].receivedBy.$[recElem].status": enums_1.EMessageStatus.SEEN,
                },
            };
            const options = {
                arrayFilters: [
                    { "msgElem.receivedBy.user": user },
                    { "recElem.user": user },
                ],
            };
            const result = await chat_model_1.Chat.updateMany(filter, update, options);
            // console.log("Update result:", result);
            if (this.io)
                this.io?.emit(`readMessages/${chatId}/${user}`, {
                    message: result.modifiedCount > 0
                        ? "messages read"
                        : "operation unsuccessful",
                    result,
                });
            return result;
        }
        catch (error) {
            // console.error("Error marking messages as read:", error);
            throw error;
        }
    }
    // Delete a message for a user
    async deleteAllMessage(chatId, user) {
        try {
            user = new bson_1.ObjectId(user);
            const filter = {
                _id: new bson_1.ObjectId(chatId),
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
            const result = await chat_model_1.Chat.updateMany(filter, update, options);
            // console.log(result);
            if (this.io)
                this.io?.emit(`deleteMessages/${chatId}/${user}`, {
                    message: result.modifiedCount > 0
                        ? "messages deleted"
                        : "operation unsuccessful",
                    result,
                });
            return result;
        }
        catch (error) {
            // console.error("Error deleting messages:", error);
            throw error;
        }
    }
    async deleteSelectedMessage(chatId, user, msgIds) {
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
            const result = await chat_model_1.Chat.updateMany(filter, update, options);
            if (this.io)
                this.io?.emit(`deleteSelectedMessages/${chatId}/${user}`, {
                    // message:
                    //   result.modifiedCount > 0
                    //     ? "selected messages deleted"
                    //     : "operation unsuccessful",
                    result,
                });
            return result;
        }
        catch (error) {
            // console.error("Error deleting messages:", error);
            throw error;
        }
    }
    // Add participants to a chat
    async addParticipants(chatId, user, participantIds) {
        try {
            // console.log({ chatId, participantIds });
            const filter = { _id: chatId };
            const participantsToAdd = await this.userRepository.getAll({ _id: participantIds }, undefined, model_helper_1.ModelHelper.userSelect, undefined, undefined, true, 1, 200);
            let username = "";
            participantsToAdd.map((e) => (username += `${e.firstName ?? ""} ${e.lastName ?? ""}, `));
            const update = {
                $addToSet: {
                    participants: {
                        $each: participantIds.map((user) => ({
                            user,
                            status: enums_1.EParticipantStatus.ACTIVE,
                        })),
                    },
                },
            };
            let result = await chat_model_1.Chat.findOneAndUpdate(filter, update)
                .select("-messages")
                .populate({
                path: "participants.user",
                select: "username firstName lastName _id profileImage",
            });
            const msg = {
                _id: new bson_1.ObjectId(),
                body: `${username}joined the group`,
                addedUsers: participantIds,
                groupName: result.groupName,
                sentBy: null,
                receivedBy: result.participants.map((e) => ({
                    user: e.user,
                    status: enums_1.EMessageStatus.SEEN,
                })),
            };
            await result.update({
                $push: {
                    messages: msg,
                },
            });
            await result.save();
            if (this.io) {
                result.participants.forEach(async (participant) => {
                    if (participant.status == enums_1.EParticipantStatus.ACTIVE) {
                        this.io?.emit(`newMessage/${chatId}/${participant.user._id.toString()}`, msg);
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
        }
        catch (error) {
            // console.error("Error adding participants:", error);
            throw error;
        }
    }
    // Remove participants from a chat
    async removeParticipants(chatId, /*user,*/ participantIds) {
        try {
            // console.log({ chatId, participantIds });
            const filter = { _id: chatId /*admins: user*/ };
            const u = await this.userRepository.getAll({ _id: participantIds }, undefined, model_helper_1.ModelHelper.userSelect, undefined, undefined, true, 1, 200);
            let username = "";
            u.map((e) => (username += `${e.firstName ?? ""} ${e.lastName ?? ""}, `));
            // // console.log(username)
            const update = {
                $pull: { participants: { user: { $in: participantIds } } },
            };
            let result = await chat_model_1.Chat.findOneAndUpdate(filter, update)
                .select("-messages")
                .populate({
                path: "participants.user",
                select: "username firstName lastName _id  profileImage",
            });
            // // console.log(result)
            const msg = {
                _id: new bson_1.ObjectId(),
                body: `${username}leave the group`,
                removedUsers: participantIds,
                groupName: result.groupName,
                sentBy: null,
                receivedBy: result.participants.map((e) => ({
                    user: e.user,
                    status: enums_1.EMessageStatus.SEEN,
                })),
            };
            await result.update({
                $push: {
                    messages: msg,
                },
            });
            const userIds = [];
            // // console.log(result)
            await result.save();
            if (participantIds.includes(result.createdBy.toString()))
                result = await chat_model_1.Chat.findOneAndUpdate(filter, {
                    createdBy: result.participants[0].user._id,
                }).populate({
                    path: "participants.user",
                    select: "username firstName lastName _id  profileImage status",
                });
            // // console.log(result.participants);
            if (this.io) {
                result.participants.forEach(async (participant) => {
                    if (participant.status == enums_1.EParticipantStatus.ACTIVE) {
                        // // console.log(participant.user._id.toString())
                        if (participantIds[0] !== participant.user._id &&
                            !participant.isMuted)
                            userIds.push(participant.user._id);
                        // // console.log(`newMessage/${chatId}/${participant.user}`)
                        // if (this.io) {
                        this.io?.emit(`newMessage/${chatId}/${participant.user._id.toString()}`, msg);
                        // this.io?.emit(
                        //   `getChats/${participant.user._id}`, await this.getChats(participant.user)
                        // );
                        await this.getChats(participant.user);
                        // }
                    }
                });
                this.io?.emit(`removeParticipants/${chatId}`, {
                    message: result == null
                        ? "you are not allowed to remove participants"
                        : "removed participants",
                    result,
                });
            }
            this.sendNotificationMsg({
                userIds,
                title: result.groupName,
                body: `${username}leave the group`,
                chatId,
            }, result);
            return result;
        }
        catch (error) {
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
    async createChatSupport(user, topic = "new topic") {
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
        const u = (await this.userRepository.getAll({ role: enums_1.EUserRole.admin, isActive: true }, undefined, model_helper_1.ModelHelper.userSelect, undefined, undefined, true, 1, 200));
        // // console.log(u)
        topic = Math.random().toString(36).substring(3, 15).toUpperCase();
        let data = await chat_model_1.Chat.create({
            groupName: topic,
            chatType: enums_1.EChatType.GROUP,
            ticketStatus: enums_1.ETICKET_STATUS.PENDING,
            isChatSupport: true,
            // groupImageUrl,
            participants: [
                {
                    user: user,
                    status: enums_1.EParticipantStatus.ACTIVE,
                },
                ...u.map((e) => ({
                    user: e._id,
                    status: enums_1.EParticipantStatus.ACTIVE,
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
        data = await chat_model_1.Chat.aggregate(findUserpipeline({ _id: data._id }));
        if (this.io)
            data[0].participants.forEach((e) => {
                // if(e!=user)
                this.io?.emit(`createChatSupport/${e.user}`, {
                    message: "chat support created",
                    data: data[0],
                });
            });
        return data[0];
    }
    async changeTicketStatus(chatId, ticketStatus) {
        if (ticketStatus != enums_1.ETICKET_STATUS.PROGRESS &&
            ticketStatus != enums_1.ETICKET_STATUS.COMPLETED) {
            console.log(ticketStatus);
            if (this.io)
                this.io.emit(`changeTicketStatus/${chatId}`, {
                    message: `invalid ticket Status allowed status ${enums_1.ETICKET_STATUS.PROGRESS}, ${enums_1.ETICKET_STATUS.COMPLETED}`,
                    // data: data,
                });
            return;
        }
        const data = await chat_model_1.Chat.findOneAndUpdate({ _id: chatId, isChatSupport: true }, { ticketStatus }, { new: true }).select("-messages");
        if (this.io) {
            data.participants.forEach((e) => {
                // if(e!=userId)
                this.io?.emit(`changeTicketStatus/${e.user}`, {
                    message: "ticket status updated",
                    data: data,
                });
            });
        }
    }
    async closeChatSupport(chatId, user) {
        const data = await chat_model_1.Chat.findOneAndUpdate({ _id: chatId, isChatSupport: true }, { isTicketClosed: true, ticketStatus: enums_1.ETICKET_STATUS.CLOSED }, { new: true }).select("-messages");
        if (this.io) {
            data.participants.forEach((e) => {
                // if(e!=user)
                this.io?.emit(`closeChatSupportTicket/${e.user}`, {
                    message: "ticket closed",
                    data: data,
                });
            });
        }
    }
    async createChat(user, participantIds, chatType, groupName, groupImageUrl) {
        try {
            let match = {
                "participants.user": { $all: participantIds },
                deleted: false,
            };
            let check = null;
            if (chatType == enums_1.EChatType.ONE_TO_ONE) {
                match.chatType = enums_1.EChatType.ONE_TO_ONE;
                check = await chat_model_1.Chat.findOne(match);
            }
            if (check) {
                check = await chat_model_1.Chat.aggregate(findUserpipeline({ _id: check._id }));
                if (this.io)
                    participantIds.forEach((e) => {
                        this.io?.emit(`createChat/${e}`, {
                            message: "chat already exits",
                            data: check[0],
                        });
                    });
                return check[0];
            }
            const messages = [];
            let usernames = "";
            let createdByUsername = "";
            const users = await this.userRepository.getAll({
                _id: participantIds.map((e) => new bson_1.ObjectId(e)),
            }, undefined, model_helper_1.ModelHelper.userSelect);
            users.forEach((e) => {
                if (e._id.toString() !== user)
                    usernames += `${e.firstName ?? ""}, `;
                else
                    createdByUsername = `${e.firstName ?? ""}`;
            });
            participantIds.forEach(async (participant) => {
                const welcomeMessageBody = `you ${chatType == enums_1.EChatType.GROUP ? "created a group" : "started a"} chat with ${usernames}`;
                // Add the welcome message to the chat
                const welcomeMessage = {
                    body: welcomeMessageBody.slice(0, welcomeMessageBody.length - 2),
                    type: enums_1.MessageType.system,
                    receivedBy: [
                        { user: participant, status: enums_1.EMessageStatus.SENT },
                    ],
                };
                if (participant !== user) {
                    welcomeMessage.body = `you started a chat with ${users
                        .map((e) => e?._id.toString() === participant ? "" : e.firstName ?? "")
                        .filter((e) => e !== "")
                        .join(", ")}`;
                }
                messages.push(welcomeMessage);
            });
            const data = await chat_model_1.Chat.create({
                groupName,
                chatType,
                groupImageUrl,
                participants: participantIds.map((e) => ({
                    user: e,
                    status: enums_1.EParticipantStatus.ACTIVE,
                })),
                createdBy: user,
                admins: chatType == enums_1.EChatType.ONE_TO_ONE ? [] : [user],
                messages,
            });
            const d = await chat_model_1.Chat.aggregate(findUserpipeline({ _id: data._id }));
            if (this.io)
                participantIds.forEach((e) => {
                    // if(e!=user)
                    this.io?.emit(`createChat/${e}`, {
                        message: "chat created",
                        data: d[0],
                    });
                });
            if (chatType === enums_1.EChatType.GROUP) {
                this.sendNotificationMsg({
                    userIds: participantIds.filter((item) => item !== user),
                    title: groupName,
                    body: "You are added to a group",
                    chatId: d[0]._id,
                }, d[0]);
            }
            return d[0];
        }
        catch (e) {
            // console.log(e);
            return e;
        }
    }
    async getAllChats(user, page = 1, pageSize = 20, chatSupport = false, chatId = null, search) {
        try {
            const skip = (page - 1) * pageSize;
            const currentUserId = new bson_1.ObjectId(user);
            const chatSupportPip = {
                isChatSupport: chatSupport == true,
            };
            if (chatId)
                chatSupportPip._id = new bson_1.ObjectId(chatId);
            const query = [
                {
                    $match: {
                        ...chatSupportPip,
                        $or: [
                            {
                                $and: [
                                    { "participants.user": currentUserId },
                                    { "participants.status": enums_1.EParticipantStatus.ACTIVE },
                                    { chatType: enums_1.EChatType.ONE_TO_ONE },
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
                                    { chatType: enums_1.EChatType.GROUP },
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
                        _id: "$_id",
                        chatType: { $first: "$chatType" },
                        isTicketClosed: { $first: "$isTicketClosed" },
                        isChatSupport: { $first: "$isChatSupport" },
                        groupName: { $first: "$groupName" },
                        participantUsernames: { $first: "$participantUsernames" },
                        totalMessages: { $first: "$totalMessages" },
                        messages: { $push: "$messages" },
                        lastMessage: { $last: "$messages" },
                        participants: { $first: "$participantsData" },
                        totalCount: { $first: "$totalCount" },
                        unReadCount: { $first: "$unReadCount" },
                        createdBy: { $first: "$createdBy" },
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
                                                        enums_1.EMessageStatus.SEEN,
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
                                { chatType: enums_1.EChatType.GROUP, messages: { $ne: [] } },
                                {
                                    $and: [
                                        {
                                            chatType: enums_1.EChatType.ONE_TO_ONE,
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
                { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
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
                        _id: "$_id",
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
                        createdBy: { $first: "$createdBy" },
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
                        createdBy: 1,
                    },
                },
            ];
            if (search) {
                query.push(...[
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
                ]);
                remainingQuery.splice(1, 1);
            }
            query.push(...remainingQuery);
            const result = await chat_model_1.Chat.aggregate(query);
            return result;
        }
        catch (error) {
            throw reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async addChatForTask(payload) {
        try {
            let messages = [];
            let user = await this.userRepository.getById(payload.participant);
            if (!user)
                return reponseapi_helper_1.ResponseHelper.sendResponse(404, `Participant with Id ${payload.participant} not found`);
            const isExist = await chat_model_1.Chat.exists({
                task: payload.task,
                participants: {
                    $elemMatch: { user: new bson_1.ObjectId(payload.participant) },
                },
            });
            if (isExist)
                return reponseapi_helper_1.ResponseHelper.sendResponse(422, `User ${user.firstName} already in chat`);
            if (payload.noOfServiceProvider === 1) {
                delete payload.groupName;
                payload.chatType = enums_1.EChatType.ONE_TO_ONE;
                let msg = {
                    body: `Hey ${user?.username || user?.firstName}, I think you are a good candidate for this task. I am looking forward in working with you on this task.`,
                    sentBy: payload.user,
                    receivedBy: [
                        {
                            user: payload.participant,
                            status: enums_1.EMessageStatus.SENT,
                        },
                    ],
                };
                messages.push(msg);
            }
            else {
                payload.chatType = enums_1.EChatType.GROUP;
                let msg = {
                    body: `Hey, I think you guys are good candidates for this task. I am looking forward in working with you all this task.`,
                    sentBy: payload.user,
                    receivedBy: [
                        {
                            user: payload.participant,
                            status: enums_1.EMessageStatus.SENT,
                        },
                    ],
                };
                messages.push(msg);
            }
            const isChatExist = await chat_model_1.Chat.exists({
                task: payload.task,
            });
            let data;
            if (isChatExist) {
                data = await chat_model_1.Chat.updateOne({ _id: isChatExist._id }, {
                    $push: {
                        participants: {
                            user: payload.participant,
                            status: enums_1.EParticipantStatus.ACTIVE,
                        },
                        "messages.$[].receivedBy": {
                            user: payload.participant,
                            status: enums_1.EMessageStatus.SENT,
                        },
                    },
                    lastMessage: messages[0].body,
                    lastUpdatedAt: new Date(),
                }, { new: true });
            }
            else {
                data = await chat_model_1.Chat.create({
                    ...payload,
                    participants: [
                        {
                            user: payload.participant,
                            status: enums_1.EParticipantStatus.ACTIVE,
                        },
                        {
                            user: payload.user,
                            status: enums_1.EParticipantStatus.ACTIVE,
                        },
                    ],
                    messages: messages,
                    lastMessage: messages[0].body,
                    createdBy: payload.user,
                });
            }
            const d = await chat_model_1.Chat.aggregate(findUserpipeline({ _id: data?._id || isChatExist?._id }));
            if (this.io)
                this.io?.emit(`createChat/${payload.participant}`, {
                    message: "chat created",
                    data: d[0],
                });
            if (payload.chatType === enums_1.EChatType.GROUP) {
                this.sendNotificationMsg({
                    userIds: payload.participant,
                    title: payload.groupName,
                    body: "You are added to a group",
                    chatId: d[0]._id,
                }, d[0]);
            }
            return d[0];
        }
        catch (error) {
            console.log({ error });
            throw reponseapi_helper_1.ResponseHelper.sendResponse(500, error.message);
        }
    }
    async getChatMedia(chatId, user) {
        // Assuming you have the chatId or any other identifier for the desired chat
        // const chatId = 'your_chat_id_here';
        const mediaFiles = await chat_model_1.Chat.aggregate([
            // Match the desired chat using its ID or any other criteria
            {
                $match: {
                    _id: new bson_1.ObjectId(chatId),
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
                            "messages.sentBy": new bson_1.ObjectId(user),
                            "messages.deleted": { $ne: true },
                        },
                        {
                            "messages.receivedBy.user": new bson_1.ObjectId(user),
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
    async updateChat(chatId, groupName, image) {
        const data = {};
        if (groupName)
            data.groupName = groupName;
        if (image)
            data.groupImageUrl = image;
        let m = await chat_model_1.Chat.updateOne({ _id: chatId, chatType: enums_1.EChatType.GROUP }, { ...data });
        m = null;
        m = (await chat_model_1.Chat.aggregate([
            { $match: { _id: new bson_1.ObjectId(chatId) } },
            ...findUserpipeline({}),
        ]))[0];
        // // console.log(m)
        this.io?.emit(`updateChat/${chatId}`, m);
        m.participants.forEach(async (e) => {
            if (e.status == enums_1.EParticipantStatus.ACTIVE)
                // this.io?.emit(`getChats/${e.user.toString()}`, await this.getChats(e.user))
                await this.getChats(e.user.toString());
        });
        return m;
    }
    async updateMuteStatus(data) {
        const chat = await chat_model_1.Chat.findOne({
            _id: data.chatId,
            "participants.user": data.user,
        }).select("participants");
        chat.participants.forEach((e) => {
            if (e.user.toString() == data.user) {
                e.isMuted = data.isMuted;
                return;
            }
        });
        return await chat.save();
    }
    async updateBlockStatus(data) {
        const chat = await chat_model_1.Chat.findOne({
            _id: data.chatId,
            "participants.user": data.user,
        }).select("participants");
        chat.participants.forEach((e) => {
            if (e.user.toString() == data.user) {
                e.isBlocked = data.isBlocked;
                return;
            }
        });
        if (this.io)
            this.io?.emit(`updateBlockStatus/${data.user}`, "user block status updated");
        return await chat.save();
    }
    async sendNotificationMsg(data, chat = {}) {
        const users = await this.userRepository.getAll({ _id: data.userIds }, undefined, `fcmTokens _id`, undefined, undefined, true);
        users.forEach((e) => {
            notification_helper_1.NotificationHelper.sendNotification({
                title: data.title,
                body: data.urls?.length !== 0 && !data.body ? "sent a photo" : data.body,
                tokens: e.fcmTokens,
                data: {
                    chatId: data.chatId.toString(),
                    user: e._id.toString(),
                    chatType: data?.chatType,
                    groupName: data?.groupName,
                },
            });
        });
    }
    async getAgoraToken(req) {
        if (req && req.body) {
            const userId = req.body.user;
            // TODO: move them to env in future
            const { calleeInfo, videoSDKInfo } = req.body;
            let calleeID = req.body?.calleeID;
            const channelName = req.query?.channelName;
            const uid = req.query?.uid;
            const notifyOther = req.query?.notifyOther;
            const role = agora_access_token_1.RtcRole?.PUBLISHER;
            const expirationTimeInSeconds = 60 * 60;
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
            const tokenA = agora_access_token_1.RtcTokenBuilder?.buildTokenWithAccount(environment_config_1.APP_ID, environment_config_1.APP_CERTIFICATE, channelName, 
            // convertTo32BitInt(uid as string).toString(),
            uid, role, privilegeExpiredTs);
            // const tokenA = "";
            console.log("Token with integer number Uid: " + tokenA);
            const chat = await chat_model_1.Chat.findById(channelName).select("-messages");
            if (notifyOther) {
                if (calleeID?.length) {
                    calleeID?.forEach((calleeID) => {
                        this.userRepository.getCallToken(calleeID).then(async (v) => {
                            if (v) {
                                const isInCall = await this.checkInChannelStatus(convertTo32BitInt(calleeID), channelName);
                                if (!isInCall)
                                    this.userRepository
                                        .getById(userId)
                                        .then(({ firstName, lastName }) => {
                                        if (v.callDeviceType === enums_1.ECALLDEVICETYPE.ios) {
                                            const callerInfo = {
                                                chatId: req.query.channelName,
                                                title: chat?.chatType === enums_1.EChatType.GROUP
                                                    ? chat?.groupName
                                                    : firstName + " " + lastName,
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
                                            const options = {
                                                token: {
                                                    key: environment_config_1.IOS_KEY,
                                                    keyId: environment_config_1.IOS_KEY_ID,
                                                    teamId: environment_config_1.IOS_TEAM_ID,
                                                },
                                                production: false,
                                            };
                                            var apnProvider = new apn.Provider({
                                                ...options,
                                            });
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
                                                uuid: (0, uuidv4_1.uuid)(),
                                            };
                                            // note.pushType = "voip";
                                            note.topic = "org.goollooper.app.voip";
                                            apnProvider
                                                .send(note, v.callToken)
                                                .then((result) => {
                                                console.log("RESULT", result);
                                                if (result.failed && result.failed.length > 0) {
                                                    console.log("FAILED", result.failed);
                                                }
                                            });
                                        }
                                        else {
                                            const info = JSON.stringify({
                                                callerInfo: {
                                                    chatId: req.query.channelName,
                                                    title: chat?.chatType === enums_1.EChatType.GROUP
                                                        ? chat?.groupName
                                                        : firstName + " " + lastName,
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
                                            notification_helper_1.NotificationHelper.sendNotification({
                                                data: message.data,
                                                tokens: message.registration_ids,
                                            });
                                            // fcm.send(message, function (err, res) {
                                            //   if (err) {
                                            //     console.log("Error: " + err);
                                            //   } else {
                                            //     console.log("Success: " + res);
                                            //   }
                                            // });
                                        }
                                    });
                            }
                        });
                    });
                }
            }
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("agora user token from user id", tokenA);
        }
        return reponseapi_helper_1.ResponseHelper.sendResponse(400, "Agora token failed");
    }
    async endCall(req) {
        // const userId = req.body.user;
        const chatId = req.body.chatId;
        // const calleeId = req.body.callee;
        const { videoSDKInfo } = req.body;
        const calleeID = req.body?.calleeID;
        const notifyOther = req.query?.notifyOther;
        if (notifyOther) {
            if (calleeID?.length) {
                calleeID?.forEach((calleeId) => {
                    this.userRepository.getCallToken(calleeId).then((v) => {
                        if (v)
                            if (v.callDeviceType === enums_1.ECALLDEVICETYPE.ios) {
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
                                const options = {
                                    token: {
                                        key: environment_config_1.IOS_KEY,
                                        keyId: environment_config_1.IOS_KEY_ID,
                                        teamId: environment_config_1.IOS_TEAM_ID,
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
                                    uuid: (0, uuidv4_1.uuid)(),
                                };
                                // note.pushType = "voip";
                                note.topic = "org.goollooper.app.voip";
                                apnProvider.send(note, v.callToken).then((result) => {
                                    console.log("RESULT", result);
                                    if (result.failed && result.failed.length > 0) {
                                        console.log("FAILED", result.failed);
                                    }
                                });
                            }
                            else {
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
                                notification_helper_1.NotificationHelper.sendNotification({
                                    data: message.data,
                                    tokens: message.registration_ids,
                                });
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
        return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("call ended Successfully");
    }
    async updateCallToken(req) {
        const user = await this.userRepository.updateById(req.locals.auth?.userId, { ...req.body, $addToSet: { fcmTokens: req.body.callToken } });
        if (user)
            return reponseapi_helper_1.ResponseHelper.sendSuccessResponse("Call token updated", user);
        return reponseapi_helper_1.ResponseHelper.sendResponse(400, "Call token update failed");
    }
    async checkInChannelStatus(user, channel) {
        try {
            const apiUrl = `https://api.agora.io/dev/v1/channel/user/property/${environment_config_1.APP_ID}/${user}/${channel}`;
            const response = await axios_1.default.get(apiUrl, {
                headers: {
                    Authorization: `Basic ${environment_config_1.AGORA_HEADER_TOKEN}`,
                },
            });
            console.log(response.data);
            if (response.data.success) {
                return response.data.data.in_channel;
            }
            else {
                // Handle API response error
                console.error("API request unsuccessful:", response.data);
                return false;
            }
        }
        catch (error) {
            // Handle Axios request error
            console.error("Axios request error:", error);
            return false;
        }
    }
}
exports.ChatRepository = ChatRepository;
function convertTo32BitInt(hexValue) {
    try {
        const originalInt64 = BigInt(`0x${hexValue}`);
        const lower32Bits = originalInt64 & BigInt(0xffffffff);
        return Number(lower32Bits);
    }
    catch (error) {
        console.error("Error converting to 32-bit integer:", error);
        return NaN; // Indicate an error by returning NaN
    }
}
function processChatMessages(messages) {
    let processedMessages = [];
    for (let i = 0; i < messages.length; i++) {
        const currentMessage = { ...messages[i] };
        {
            if (currentMessage.createdAt &&
                messages[i - 1]?.createdAt &&
                currentMessage.createdAt.toISOString().slice(0, 16) ===
                    messages[i - 1]?.createdAt?.toISOString().slice(0, 16)) {
                delete currentMessage.createdAt;
            }
        }
        processedMessages.push(currentMessage);
    }
    return processedMessages;
}
function findUserpipeline(match) {
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
                createdBy: { $first: "$createdBy" },
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
                createdBy: 1,
                // totalCount: 1,
                // unReadCount: 1,
            },
        },
    ];
}
//# sourceMappingURL=chat.repository.js.map