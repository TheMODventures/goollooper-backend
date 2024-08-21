import mongoose, { FilterQuery, PipelineStage } from "mongoose";
import { Request } from "express";
import _ from "lodash";

import { EUserRole, Subscription } from "../../database/interfaces/enums";

import {
  IUser,
  IUserWithSchedule,
} from "../../database/interfaces/user.interface";
import { ISchedule } from "../../database/interfaces/schedule.interface";
import { UserRepository } from "../repository/user/user.repository";
import { ScheduleRepository } from "../repository/schedule/schedule.repository";
import { SubscriptionRepository } from "../repository/subscription/subscription.repository";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_INSERTION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { UploadHelper } from "../helpers/upload.helper";
import TokenService from "./token.service";
import { stripeHelper } from "../helpers/stripe.helper";

class UserService {
  private userRepository: UserRepository;
  private scheduleRepository: ScheduleRepository;
  private uploadHelper: UploadHelper;
  private tokenService: TokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.scheduleRepository = new ScheduleRepository();
    this.uploadHelper = new UploadHelper("user");
    this.tokenService = new TokenService();
  }

  getByFilter = async (filter: FilterQuery<IUser>): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.getOne<IUser>(filter);
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        response || ""
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  getCount = async (filter?: FilterQuery<IUser>): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.userRepository.getCount(filter);
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        getDocCount.toString()
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IUser>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.userRepository.getCount(filter);
      let pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "tasks",
            let: { userId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$postedBy", "$$userId"] },
                },
              },
              {
                $project: {
                  title: 1,
                  description: 1,
                },
              },
            ],
            as: "tasks",
          },
        },
      ];

      const response =
        await this.userRepository.getAllWithAggregatePagination<IUser>(
          pipeline,
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
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  list = async (selectField: string) => {
    try {
      const filter = {
        isDeleted: false,
        $or: [{ role: EUserRole.user }, { role: EUserRole.serviceProvider }],
      };
      const response = await this.userRepository.getAll<IUser>(
        filter,
        undefined,
        selectField
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter: FilterQuery<IUser> = {
        _id: _id,
        isDeleted: false,
        $or: [
          { role: EUserRole.user },
          { role: EUserRole.serviceProvider },
          { role: EUserRole.subAdmin },
        ],
      };
      const response = await this.userRepository.getOne<IUser>(filter, "", "", [
        {
          path: "volunteer",
          model: "Service",
          select: "title type parent",
        },
        {
          path: "services",
          model: "Service",
          select: "title type parent",
        },
        // {
        //   path: "subscription.subscription",
        //   model: "Subscription",
        // },
      ]);

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }

      const schedules = await this.scheduleRepository.getAll({
        user: _id,
        isDeleted: false,
      });
      const res = { ...response, schedule: schedules };
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_SHOW_PASSED, res);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    _id: string | mongoose.Types.ObjectId,
    dataset: Partial<IUserWithSchedule>,
    req?: Request
  ): Promise<ApiResponse> => {
    try {
      let body: Partial<IUser> = { ...req?.body };

      let userResponse = await this.userRepository.getOne<IUser>({
        _id: _id,
      });

      dataset.company = { ...userResponse?.company, ...dataset.company };
      if (req && _.isArray(req.files)) {
        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "profileImage")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "profileImage"
          );
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          dataset.profileImage = path[0];
        }

        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "gallery")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "gallery"
          );
          let path: any = await this.uploadHelper.uploadFileFromBuffer(image);
          body.galleryImages?.push(...path);
          dataset.gallery = body.galleryImages || path;
        }

        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "visuals")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "visuals"
          );
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          body.visualFiles?.push(...path);
          dataset.visuals = body.visualFiles || path;
        }

        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "companyLogo")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "companyLogo"
          );
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          dataset.company.logo = path[0];
        }

        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "companyResume")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "companyResume"
          );
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          dataset.company.resume = path[0];
        }

        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "certificates")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "certificates"
          );
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          body.certificateFiles?.push(...path);
          dataset.certificates = body.certificateFiles || path;
        }

        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "licenses")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "licenses"
          );
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          body.licenseFiles?.push(...path);
          dataset.licenses = body.licenseFiles || path;
        }

        if (
          req.files.length &&
          req.files?.find((file) => file.fieldname === "insurances")
        ) {
          const image = req.files?.filter(
            (file) => file.fieldname === "insurances"
          );
          let path = await this.uploadHelper.uploadFileFromBuffer(image);
          body.insuranceFiles?.push(...path);
          dataset.insurances = body.insuranceFiles || path;
        }
      }
      let isBSL = false;
      if (dataset?.subscription?.subscription) {
        // let response = await stripeHelper.subscriptions(dataset.subscription.subscription);
        // console.log("response", response);
        let subscription = dataset.subscription.name;
        console.log("dataset.subscription", dataset.subscription);
        if (subscription) {
          isBSL =
            subscription.toLocaleLowerCase() ===
            Subscription.bsl.toLocaleLowerCase();

          console.log("isBSL", isBSL);

          // service provider can add upto 3 location max
          if (dataset.location && dataset.location.length > 3) {
            return ResponseHelper.sendResponse(
              422,
              "Service Provider can add upto 3 locations Max"
            );
          }

          // Validate location details
        }
      }
      if (dataset.location && dataset.location.length) {
        for (let i = 0; i < dataset.location.length; i++) {
          const element = dataset.location[i];
          if (isBSL) {
            // BSL subscription: no country or zip code allowed
            if (element.county || element.zipCode) {
              return ResponseHelper.sendResponse(
                422,
                "Country and zipcode are forbidden for BSL subscription"
              );
            }

            // Ensure coordinates, city, and town are present
            // town is optional for all service providers
            if ((element?.coordinates?.length ?? 0) < 2 || !element.city) {
              return ResponseHelper.sendResponse(
                422,
                "Provide coordinates, city, and town for BSL subscription"
              );
            }
          } else {
            // Non-BSL subscription: no coordinates allowed
            if (element?.coordinates?.length ?? 0 > 0) {
              return ResponseHelper.sendResponse(
                422,
                "Coordinates are forbidden for non-BSL subscription"
              );
            }

            // Ensure city, are present
            if (!element.city) {
              return ResponseHelper.sendResponse(
                422,
                "Provide  city, town, for non-BSL subscription"
              );
            }
          }

          // Convert coordinates to float if they exist
          dataset.location[i].coordinates?.map((e) => parseFloat(e.toString()));
          dataset.location[i].type ??= "Point";

          // Ensure `type` is set to "Point"
          element.type = "Point";

          // Check if the element is selected
          console.log("element.isSelected", element.isSelected);
          if (element.isSelected === "true") {
            // Ensure that the element.coordinates follows the schema definition
            if (!element.coordinates || element.coordinates.length !== 2) {
              // If coordinates are missing or not in the expected format, set default coordinates
              element.coordinates = [0, 0];
            }
            // Assign the element to selectedLocation
            dataset.selectedLocation = element;
          }
        }
      }

      if (dataset.taskLocation) {
        if (dataset.taskLocation.length === 3) {
          dataset.taskLocation.shift();
        }
        console.log("~ dataset.taskLocation", dataset.taskLocation);
        dataset.taskLocation.push(
          ...(userResponse?.taskLocation ?? []),
          ...dataset?.taskLocation
        );
      }

      // Check if locationType is local and all location details are provided
      // if (
      //   dataset.locationType === EUserLocationType.local &&
      //   (!dataset.location || !dataset.location.length)
      // ) {
      //   return ResponseHelper.sendResponse(422, "Provide all location details");
      // }

      // if (
      //   dataset.locationType === EUserLocationType.local &&
      //   dataset.location &&
      //   dataset.location.length
      // ) {
      //   for (let i = 0; i < dataset.location.length; i++) {
      //     const element = dataset.location[i];
      //     if (dataset.role == 3) {
      //       if (element.county || element.city || element.state || (dataset.zipCode && dataset.zipCode.length)) {
      //         return ResponseHelper.sendResponse(422, "Country, city, state, and zipcode are forbidden for this role");
      //       }
      //     } else {
      //       if (element.coordinates.length < 2 || !element.state || !element.city || !element.county || (dataset.zipCode && !dataset.zipCode.length)) {
      //         return ResponseHelper.sendResponse(422, "Provide all location details");
      //       }
      //     }

      //     // Convert coordinates to float if they exist
      //     dataset.location[i].coordinates?.map(e => parseFloat(e.toString()));
      //     dataset.location[i].type ??= "Point";

      //     if (element.isSelected === "true") {
      //       dataset.selectedLocation = dataset.location[i];
      //     }
      //   }
      // }

      if (dataset.schedule?.length) {
        for (let i = 0; i < dataset.schedule.length; i++) {
          const element = dataset.schedule[i];
          const schedule = await this.scheduleRepository.getOne<ISchedule>({
            user: _id,
            day: element.day,
            isDeleted: false,
          });
          if (schedule) {
            await this.scheduleRepository.updateById(
              schedule._id as string,
              element
            );
          } else {
            await this.scheduleRepository.create<ISchedule>({
              ...element,
              user: new mongoose.Types.ObjectId(_id),
            });
          }
        }
      }

      if (dataset.phoneCode && dataset.phone) {
        dataset.completePhone = dataset.phoneCode + dataset.phone;
      }

      const response = await this.userRepository.updateById<IUserWithSchedule>(
        _id as string,
        dataset
      );

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }

      if (dataset.profileImage && userResponse?.profileImage) {
        this.uploadHelper.deleteFile(userResponse.profileImage);
      }

      if (userResponse?.gallery?.length) {
        const imagesToDelete = userResponse.gallery.filter(
          (image) => !body.galleryImages?.includes(image)
        );
        for (const imageToDelete of imagesToDelete) {
          this.uploadHelper.deleteFile(imageToDelete);
        }
        let updatedGallery = [];
        if (dataset.galleryImages?.length) {
          updatedGallery = dataset.galleryImages.filter(
            (image) => !imagesToDelete.includes(image)
          );
        } else {
          updatedGallery = userResponse.gallery.filter(
            (image) => !imagesToDelete.includes(image)
          );
        }
        dataset.gallery = updatedGallery;
      }

      if (userResponse?.visuals?.length) {
        const imagesToDelete = userResponse.visuals.filter(
          (image) => !body.visualFiles?.includes(image)
        );
        for (const imageToDelete of imagesToDelete) {
          this.uploadHelper.deleteFile(imageToDelete);
        }
        let updatedFiles = [];
        if (dataset.visualFiles?.length) {
          updatedFiles = dataset.visualFiles.filter(
            (image) => !imagesToDelete.includes(image)
          );
        } else {
          updatedFiles = userResponse.visuals.filter(
            (image) => !imagesToDelete.includes(image)
          );
        }
        dataset.visuals = updatedFiles;
      }

      if (
        _.isArray(req?.files) &&
        req?.files?.find((file) => file.fieldname === "companyLogo") &&
        dataset.company?.logo &&
        userResponse?.company?.logo
      ) {
        this.uploadHelper.deleteFile(userResponse?.company?.logo);
      }

      if (
        _.isArray(req?.files) &&
        req?.files?.find((file) => file.fieldname === "companyResume") &&
        dataset.company?.resume &&
        userResponse?.company?.resume
      ) {
        this.uploadHelper.deleteFile(userResponse?.company?.resume);
      }

      if (userResponse?.certificates?.length) {
        const imagesToDelete = userResponse.certificates.filter(
          (image) => !body.certificateFiles?.includes(image)
        );
        for (const imageToDelete of imagesToDelete) {
          this.uploadHelper.deleteFile(imageToDelete);
        }
        let updatedFiles = [];
        if (dataset.certificateFiles?.length) {
          updatedFiles = dataset.certificateFiles.filter(
            (image) => !imagesToDelete.includes(image)
          );
        } else {
          updatedFiles = userResponse.certificates.filter(
            (image) => !imagesToDelete.includes(image)
          );
        }
        dataset.certificates = updatedFiles;
      }

      if (userResponse?.licenses?.length) {
        const imagesToDelete = userResponse.licenses.filter(
          (image) => !body.licenseFiles?.includes(image)
        );
        for (const imageToDelete of imagesToDelete) {
          this.uploadHelper.deleteFile(imageToDelete);
        }
        let updatedFiles = [];
        if (dataset.licenseFiles?.length) {
          updatedFiles = dataset.licenseFiles.filter(
            (image) => !imagesToDelete.includes(image)
          );
        } else {
          updatedFiles = userResponse.licenses.filter(
            (image) => !imagesToDelete.includes(image)
          );
        }
        dataset.licenses = updatedFiles;
      }

      if (userResponse?.insurances?.length) {
        const imagesToDelete = userResponse.insurances.filter(
          (image) => !body.insuranceFiles?.includes(image)
        );
        for (const imageToDelete of imagesToDelete) {
          this.uploadHelper.deleteFile(imageToDelete);
        }
        let updatedFiles = [];
        if (dataset.insuranceFiles?.length) {
          updatedFiles = dataset.insuranceFiles.filter(
            (image) => !imagesToDelete.includes(image)
          );
        } else {
          updatedFiles = userResponse.insurances.filter(
            (image) => !imagesToDelete.includes(image)
          );
        }
        dataset.insurances = updatedFiles;
      }

      await this.userRepository.updateById<IUserWithSchedule>(
        _id as string,
        dataset
      );

      userResponse = await this.userRepository.getOne<IUser>(
        {
          _id: _id,
        },
        "",
        "",
        [
          {
            path: "volunteer",
            model: "Service",
            select: "title type parent",
          },
          {
            path: "services",
            model: "Service",
            select: "title type parent",
          },
        ]
      );
      const schedules = await this.scheduleRepository.getAll({
        user: _id,
        isDeleted: false,
      });
      const res = { ...userResponse, schedule: schedules };

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        res
      );
    } catch (error: any) {
      if (error?.code === 11000)
        return ResponseHelper.sendResponse(
          409,
          `This ${Object.keys(error.keyValue)[0]} already exist`
        );
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  trashIndex = async (page: number, limit = 10): Promise<ApiResponse> => {
    try {
      const filter = {
        isDeleted: false,
        $or: [{ role: EUserRole.user }, { role: EUserRole.serviceProvider }],
      };
      const getDocCount = await this.userRepository.getCount(filter);
      const response = await this.userRepository.getAll<IUser>(
        filter,
        "",
        "",
        {
          deletedAt: "desc",
        },
        undefined,
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.updateById<IUser>(_id, {
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

  getDataByAggregate = async (
    page: number,
    limit = 10,
    pipeline?: PipelineStage[]
  ) => {
    const countPipeline = (await this.userRepository.getDataByAggregate([
      ...(pipeline ?? []),
      { $sort: { distance: -1 } },
      { $count: "totalCount" },
    ])) as any[];
    const response = await this.userRepository.getDataByAggregate([
      ...(pipeline ?? []),
      { $sort: { distance: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    return ResponseHelper.sendSuccessResponse(
      SUCCESS_DATA_LIST_PASSED,
      response,
      countPipeline.length > 0 ? countPipeline[0].totalCount : 0
    );
  };

  addSubAdmin = async (payload: IUser): Promise<ApiResponse> => {
    try {
      if (payload.phoneCode && payload.phone) {
        payload.completePhone = payload.phoneCode + payload.phone;
      }
      const user: IUser = {
        ...payload,
        role: EUserRole.subAdmin,
      };
      const data = await this.userRepository.create<IUser>(user);
      const userId = new mongoose.Types.ObjectId(data._id!);
      const tokenResponse = await this.tokenService.create(
        userId,
        EUserRole.subAdmin
      );
      return ResponseHelper.sendSignTokenResponse(
        201,
        SUCCESS_DATA_INSERTION_PASSED,
        data,
        tokenResponse
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default UserService;
