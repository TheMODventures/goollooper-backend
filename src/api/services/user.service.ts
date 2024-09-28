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
import { RatingRepository } from "../repository/rating/rating.repository";
import { IService } from "../../database/interfaces/service.interface";

class UserService {
  private userRepository: UserRepository;
  private scheduleRepository: ScheduleRepository;
  private uploadHelper: UploadHelper;
  private tokenService: TokenService;
  private ratingRepository: RatingRepository;
  constructor() {
    this.userRepository = new UserRepository();
    this.scheduleRepository = new ScheduleRepository();
    this.uploadHelper = new UploadHelper("user");
    this.tokenService = new TokenService();
    this.ratingRepository = new RatingRepository();
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
      const pipeline: PipelineStage[] = [];

      pipeline.push({
        $match: { isDeleted: false, _id: new mongoose.Types.ObjectId(_id) },
      });

      pipeline.push({
        $lookup: {
          from: "services",
          localField: "services",
          foreignField: "_id",
          as: "services",
        },
      });

      pipeline.push({
        $lookup: {
          from: "services",
          localField: "volunteer",
          foreignField: "_id",
          as: "volunteer",
        },
      });

      pipeline.push({
        $graphLookup: {
          from: "services",
          startWith: "$services._id",
          connectFromField: "parent",
          connectToField: "_id",
          as: "services",
          maxDepth: 10,
          depthField: "level",
        },
      });

      pipeline.push({
        $addFields: {
          services: {
            $map: {
              input: "$services",
              as: "service",
              in: {
                _id: "$$service._id",
                title: "$$service.title",
                parent: "$$service.parent",
                level: "$$service.level",
                isSelected: { $in: ["$$service._id", "$services"] }, // Check if selected

                hasSubCategory: {
                  $cond: {
                    if: {
                      $gt: [
                        { $size: { $ifNull: ["$$service.subCategories", []] } },
                        0,
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
          },
        },
      });

      pipeline.push({
        $addFields: {
          services: {
            $map: {
              input: "$services",
              as: "service",
              in: {
                _id: "$$service._id",
                title: "$$service.title",
                parent: "$$service.parent",
                level: "$$service.level",
                isSelected: { $in: ["$$service._id", "$services"] },

                subCategories: {
                  $filter: {
                    input: "$services",
                    as: "subService",
                    cond: { $eq: ["$$subService.parent", "$$service._id"] },
                  },
                },

                hasSubCategory: {
                  $gt: [
                    {
                      $size: {
                        $ifNull: [
                          {
                            $filter: {
                              input: "$services",
                              as: "subService",
                              cond: {
                                $eq: ["$$subService.parent", "$$service._id"],
                              },
                            },
                          },
                          [],
                        ],
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      });

      pipeline.push({
        $project: {
          authProvider: 0,
          password: 0,
          "services.keyWords": 0,
          "services.__v": 0,
        },
      });

      const response = await this.userRepository.getDataByAggregate<IUser>([
        ...pipeline,
      ]);

      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }

      const service = this.buildServiceTree(response[0].services as IService[]);
      if (Array.isArray(service) && service.length > 0)
        response[0].services = service;
      const schedules = await this.scheduleRepository.getAll({
        user: _id,
        isDeleted: false,
      });
      const rating = await this.ratingRepository.getAll(
        { to: _id },
        "",
        "",
        { createdAt: "desc" },
        {
          path: "by",
          model: "Users",
          select: "firstName lastName profileImage username email",
        },
        true,
        1,
        2
      );

      const res = {
        ...response[0],
        schedules,
        rating,
      };
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

      let isBSL = false;
      if (dataset?.subscription?.subscription) {
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

          // Ensure type is set to "Point"
          element.type = "Point";

          // Check if the element is selected
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

      if (dataset.taskLocation && dataset.taskLocation.length > 0) {
        if (dataset.taskLocation.length > 3) {
          return ResponseHelper.sendResponse(
            422,
            "can add upto 3 locations Max"
          );
        }

        for (let i = 0; i < dataset.taskLocation.length; i++) {
          const element = dataset.taskLocation[i];

          if (element.isSelected === "true") {
            dataset.taskSelectedLocation = element;
          }
        }
      }

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
      { $sort: { createdAt: -1 } },
      { $count: "totalCount" },
    ])) as any[];
    const response = await this.userRepository.getDataByAggregate([
      ...(pipeline ?? []),
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    console.log("response", response);

    return ResponseHelper.sendSuccessResponse(
      SUCCESS_DATA_LIST_PASSED,
      response,
      countPipeline.length > 0 ? countPipeline[0].totalCount : 0
    );
  };

  buildServiceTree = (services: IService[]): IService[] => {
    const serviceMap: {
      [key: string]: IService & { subCategories: IService[] };
    } = {}; // A map to keep track of all services by _id

    // Initialize the map with services and add a children array to each
    services.forEach((service) => {
      if (service._id) {
        serviceMap[service._id.toString()] = { ...service, subCategories: [] };
      }
    });

    const tree: IService[] = [];

    // Loop over the services and build the tree
    services.forEach((service) => {
      if (service.parent) {
        // If the service has a parent, push it to the parent's subCategories array
        if (serviceMap[service.parent.toString()]) {
          if (service._id) {
            serviceMap[service.parent.toString()].subCategories.push(
              serviceMap[service._id.toString()]
            );
          }
        }
      } else {
        // If the service has no parent, it's a top-level service, so push it to the tree
        if (service._id) {
          tree.push(serviceMap[service._id.toString()]);
        }
      }
    });

    return tree; // The tree contains all the services in hierarchical order
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
