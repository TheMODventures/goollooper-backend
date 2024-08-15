import mongoose, {
  FilterQuery,
  PipelineStage,
  PopulateOptions,
} from "mongoose";

import { IGolist } from "../../database/interfaces/golist.interface";
import { GolistRepository } from "../repository/golist/golist.repository";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_INSERTION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import UserService from "./user.service";
import { GoogleMapHelper } from "../helpers/googleMapApi.helper";
import { NotificationRepository } from "../repository/notification/notification.repository";
import { INotification } from "../../database/interfaces/notification.interface";
import {
  ERating,
  EUserRole,
  ENOTIFICATION_TYPES,
} from "../../database/interfaces/enums";
import { NotificationHelper } from "../helpers/notification.helper";
import { UserRepository } from "../repository/user/user.repository";

class GolistService {
  private golistRepository: GolistRepository;
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.golistRepository = new GolistRepository();
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }
  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IGolist>
  ): Promise<ApiResponse> => {
    try {
      // const getDocCount = await this.golistRepository.getCount(filter);
      const response =
        await this.golistRepository.getAllWithPagination<IGolist>(
          filter,
          "",
          "",
          {
            createdAt: "desc",
          },
          undefined,
          true,
          page,
          limit
        );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        response.pagination.totalItems as number
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  create = async (payload: IGolist): Promise<ApiResponse> => {
    try {
      const data = await this.golistRepository.create<IGolist>(payload);
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_INSERTION_PASSED,
        data
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (
    _id: string,
    coordinates?: [number, number],
    populate?: PopulateOptions | (PopulateOptions | string)[]
  ): Promise<ApiResponse> => {
    try {
      const filter = {
        _id: new mongoose.Types.ObjectId(_id),
      };
      const response: any = await this.golistRepository.getOne<IGolist>(
        filter,
        undefined,
        undefined,
        undefined
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      const query: PipelineStage[] = [];
      // if (coordinates) {
      //   query.push({
      //     $geoNear: {
      //       near: {
      //         type: "Point",
      //         coordinates: coordinates ?? ([67.0, 24.0] as [number, number]),
      //       },
      //       distanceField: "distance",
      //       spherical: true,
      //       // maxDistance: 10000,
      //       query: { _id: { $in: response?.serviceProviders } },
      //     },
      //   });
      // }
      query.push(
        ...[
          { $match: { _id: { $in: response?.serviceProviders } } },
          {
            $project: {
              username: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
              profileImage: 1,
              location: {
                city: 1,
                town: 1,
              },
              distance: 1,
            },
          },
        ]
      );
      const serviceProviders = await this.userRepository.getDataByAggregate(
        query
      );

      response.serviceProviders = serviceProviders;
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    _id: string,
    dataset: Partial<IGolist>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.golistRepository.updateByOne<IGolist>(
        { _id },
        dataset
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.golistRepository.updateById<IGolist>(_id, {
        isDeleted: true,
      });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  checkPostalCode = async (zipCode: string): Promise<ApiResponse> => {
    const googleCoordinates = (await GoogleMapHelper.searchLocation(
      zipCode,
      ""
    )) as Number[] | null;
    if (!googleCoordinates)
      return ResponseHelper.sendResponse(404, "postal code is invalid");
    return ResponseHelper.sendSuccessResponse("Valid postal code", {
      latitude: googleCoordinates[1],
      longitude: googleCoordinates[0],
    });
  };

  getNearestServiceProviders = async (
    page: number,
    limit = 10,
    userId: string | undefined,
    city: string,
    town: string,
    coordinates: Number[],
    serviceId?: string[],
    volunteerIds?: string[],
    subscription?: string[] | mongoose.Types.ObjectId[],
    zipCode?: string | null,
    rating?: ERating | undefined,
    companyLogo?: boolean | undefined,
    companyRegistration?: boolean | undefined,
    companyWebsite?: boolean | undefined,
    companyAffilation?: boolean | undefined,
    companyPublication?: boolean | undefined,
    companyResume?: boolean | undefined,
    certificate?: boolean | undefined,
    license?: boolean | undefined,
    reference?: boolean | undefined,
    insurance?: boolean | undefined,
    search?: string,
    visualPhotos?: boolean | undefined,
    visualVideos?: boolean | undefined
  ) => {
    try {
      const query: PipelineStage[] = [];
      // if (zipCode) {
      //   // coordinates = []
      //   const googleCoordinates = (await GoogleMapHelper.searchLocation(
      //     zipCode,
      //     ""
      //   )) as Number[] | null;
      //   if (!googleCoordinates)
      //     return ResponseHelper.sendResponse(404, "postal code is invalid");
      //   coordinates = googleCoordinates;
      // }
      // if (coordinates?.length !== 0 && !isNaN(coordinates[0] as number)) {
      //   query.push({
      //     $geoNear: {
      //       near: {
      //         type: "Point",
      //         coordinates: coordinates as [number, number],
      //       },
      //       distanceField: "distance",
      //       spherical: true,
      //       maxDistance: 2000,
      //     },
      //   });
      // }
      const match = {
        _id: { $ne: new mongoose.Types.ObjectId(userId) },
        isDeleted: false,
        role: EUserRole.serviceProvider,

        // isActive: true,
        // isVerified: true,
        isProfileCompleted: true,
      } as any;
      if (town) {
        match["location"] = {
          $elemMatch: { town: { $regex: town, $options: "i" } },
        };
      }
      if (city) {
        match["location"] = {
          $elemMatch: { city: { $regex: city, $options: "i" } },
        };
      }
      if (companyLogo) match["company.logo"] = { $ne: null };
      if (companyRegistration) match["company.name"] = { $ne: null };
      if (companyWebsite) match["company.website"] = { $ne: null };
      if (companyAffilation) match["company.affiliation"] = { $ne: null };
      if (companyPublication) match["company.publication"] = { $ne: null };
      if (companyResume) match["company.resume"] = { $ne: null };

      if (insurance) match["insurances"] = { $ne: [] };
      else if (insurance === false) match["insurances"] = [];

      if (certificate) match["certificates"] = { $ne: [] };
      else if (certificate === false) match["certificates"] = [];

      if (reference) match["reference.name"] = { $ne: null };
      else if (reference === false) match["reference.name"] = null;

      if (license) match["licenses"] = { $ne: [] };
      else if (license === false) match["licenses"] = [];

      if (visualPhotos)
        match["visuals"] = { $regex: /\.(jpg|jpeg|png|gif|bmp)$/i };
      else if (visualPhotos === false && visualVideos === false)
        match["visuals"] = [];

      if (visualVideos) match["visuals"] = { $regex: /\.(mp4|avi|mov|mkv)$/i };
      else if (visualPhotos === false && visualVideos === false)
        match["visuals"] = [];

      if (visualPhotos && visualVideos)
        match["visuals"] = {
          $regex: /\.(mp4|avi|mov|mkv|jpg|jpeg|png|gif|bmp)$/i,
        };

      // if (subscription) {
      //   match["subscription.subscription"] = new mongoose.Types.ObjectId(
      //     subscription
      //   );
      // }
      if (subscription && subscription?.length > 0) {
        // const subscriptionIds = subscription.map((e: any) => e);
        // match["subscription.subscription"] = { $in: subscriptionIds };
        query.push({
          $match: {
            "subscription.name": { $in: subscription },
          },
        });
      }
      if (serviceId && serviceId?.length > 0) {
        const services = serviceId.map(
          (e: string) => new mongoose.Types.ObjectId(e)
        );
        match["$or"] = [
          {
            services: {
              $in: services,
            },
          },
        ];
      }
      if (volunteerIds && volunteerIds?.length > 0) {
        const volunteers = volunteerIds.map(
          (e: string) => new mongoose.Types.ObjectId(e)
        );
        match["$or"] = [
          {
            volunteer: {
              $in: volunteers,
            },
          },
        ];
      }
      query.push({
        $match: match,
      });
      query.push({
        $addFields: {
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
        },
      });
      if (search) {
        query.push({
          $match: {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { username: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          },
        });
      }
      if (rating) {
        query.push({ $sort: { averageRating: rating } });
      }
      query.push(
        ...[
          {
            $project: {
              _id: 1,
              username: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
              ratingCount: 1,
              averageRating: 1,
              profileImage: 1,
              role: 1,
              subscription: 1,
              distance: 1,
            },
          },
        ]
      );
      const users = await new UserService().getDataByAggregate(
        page,
        limit,
        query
      );
      return users;
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  getNearestUsers = async (
    page: number,
    limit = 10,
    userId: string | undefined,
    coordinates: Number[],
    serviceId?: string[],
    volunteerIds?: string[],
    subscription?: string[] | mongoose.Types.ObjectId[],
    zipCode?: string | null,
    rating?: ERating | undefined,
    companyLogo?: boolean | undefined,
    companyRegistration?: boolean | undefined,
    companyWebsite?: boolean | undefined,
    companyAffilation?: boolean | undefined,
    companyPublication?: boolean | undefined,
    companyResume?: boolean | undefined,
    certificate?: boolean | undefined,
    license?: boolean | undefined,
    reference?: boolean | undefined,
    insurance?: boolean | undefined,
    search?: string,
    visualPhotos?: boolean | undefined,
    visualVideos?: boolean | undefined,
    userRole?: EUserRole | undefined
  ) => {
    try {
      const query: PipelineStage[] = [];
      if (zipCode) {
        const googleCoordinates = (await GoogleMapHelper.searchLocation(
          zipCode,
          ""
        )) as Number[] | null;
        if (!googleCoordinates)
          return ResponseHelper.sendResponse(404, "postal code is invalid");
        coordinates = googleCoordinates;
      }
      if (coordinates?.length !== 0 && !isNaN(coordinates[0] as number)) {
        query.push({
          $geoNear: {
            near: {
              type: "Point",
              coordinates: coordinates as [number, number],
            },
            distanceField: "distance",
            spherical: true,
            maxDistance: 10000,
          },
        });
      }
      const match = {
        _id: { $ne: new mongoose.Types.ObjectId(userId) },
        isDeleted: false,
        // role: EUserRole.serviceProvider,
        // isActive: true,
        // isVerified: true,
        isProfileCompleted: true,
      } as any;

      if (companyLogo) match["company.logo"] = { $ne: null };
      if (companyRegistration) match["company.name"] = { $ne: null };
      if (companyWebsite) match["company.website"] = { $ne: null };
      if (companyAffilation) match["company.affiliation"] = { $ne: null };
      if (companyPublication) match["company.publication"] = { $ne: null };
      if (companyResume) match["company.resume"] = { $ne: null };

      if (insurance) match["insurances"] = { $ne: [] };
      else if (insurance === false) match["insurances"] = [];

      if (certificate) match["certificates"] = { $ne: [] };
      else if (certificate === false) match["certificates"] = [];

      if (reference) match["reference.name"] = { $ne: null };
      else if (reference === false) match["reference.name"] = null;

      if (license) match["licenses"] = { $ne: [] };
      else if (license === false) match["licenses"] = [];

      if (visualPhotos)
        match["visuals"] = { $regex: /\.(jpg|jpeg|png|gif|bmp)$/i };
      else if (visualPhotos === false && visualVideos === false)
        match["visuals"] = [];

      if (visualVideos) match["visuals"] = { $regex: /\.(mp4|avi|mov|mkv)$/i };
      else if (visualPhotos === false && visualVideos === false)
        match["visuals"] = [];

      if (visualPhotos && visualVideos)
        match["visuals"] = {
          $regex: /\.(mp4|avi|mov|mkv|jpg|jpeg|png|gif|bmp)$/i,
        };

      if (subscription && subscription?.length > 0) {
        const subscriptionIds = subscription.map(
          (e: any) => new mongoose.Types.ObjectId(e)
        );
        match["subscription.subscription"] = { $in: subscriptionIds };
      }
      if (serviceId && serviceId?.length > 0) {
        const services = serviceId.map(
          (e: string) => new mongoose.Types.ObjectId(e)
        );
        match["$or"] = [
          {
            services: {
              $in: services,
            },
          },
        ];
      }
      if (volunteerIds && volunteerIds?.length > 0) {
        const volunteers = volunteerIds.map(
          (e: string) => new mongoose.Types.ObjectId(e)
        );
        match["$or"] = [
          {
            volunteer: {
              $in: volunteers,
            },
          },
        ];
      }
      query.push({
        $match: match,
      });
      query.push({
        $addFields: {
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
        },
      });
      if (search) {
        query.push({
          $match: {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { username: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          },
        });
      }
      if (rating) {
        query.push({ $sort: { averageRating: rating } });
      }
      query.push(
        ...[
          {
            $lookup: {
              as: "subscription",
              from: "subscriptions",
              localField: "subscription.subscription",
              foreignField: "_id",
            },
          },
          {
            $addFields: {
              subscription: { $first: "$subscription" },
            },
          },
          {
            $lookup: {
              from: "golists",
              localField: "_id",
              foreignField: "serviceProviders",
              as: "golistData",
            },
          },
          {
            $match: {
              "golistData.createdBy": new mongoose.Types.ObjectId(userId),
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
              ratingCount: 1,
              averageRating: 1,
              profileImage: 1,
              subscriptionName: {
                $ifNull: ["$subscription.name", null],
              },
              distance: 1,
            },
          },
        ]
      );
      const users = await new UserService().getDataByAggregate(
        page,
        limit,
        query
      );
      return users;
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  shareToMyList = async (
    sender: string,
    serviceProviderId: string,
    myList: string[]
  ): Promise<ApiResponse> => {
    const list = myList.map((e) => {
      return {
        sender,
        receiver: e,
        type: ENOTIFICATION_TYPES.SHARE_PROVIDER,
        content: "#sender Shared A Service Provider",
        data: {
          serviceProvider: new mongoose.Types.ObjectId(serviceProviderId),
        },
      } as INotification;
    });
    const result = await this.notificationRepository.createMany(list);
    const users = await this.userRepository.getAll(
      { _id: myList },
      undefined,
      "fcmTokens"
    );
    users.forEach((e: any) => {
      if (e.fcmTokens && e.fcmTokens.length > 0)
        NotificationHelper.sendNotification({
          title: "",
          tokens: e?.fcmTokens,
          body: "#sender Shared A Service Provider",
          data: {
            serviceProvider: serviceProviderId,
            type: ENOTIFICATION_TYPES.SHARE_PROVIDER,
          },
        });
    });
    return ResponseHelper.sendSuccessResponse(
      SUCCESS_DATA_INSERTION_PASSED,
      result
    );
  };
}

export default GolistService;
