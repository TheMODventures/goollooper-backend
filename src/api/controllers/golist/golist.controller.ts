import { FilterQuery } from "mongoose";
import { Request, Response } from "express";

import GolistService from "../../services/golist.service";
import UserService from "../../services/user.service";
import { EList, ERating, EUserRole } from "../../../database/interfaces/enums";
import { IUser } from "../../../database/interfaces/user.interface";
import { IGolist } from "../../../database/interfaces/golist.interface";
import { ModelHelper } from "../../helpers/model.helper";
class GolistController {
  protected golistService: GolistService;
  protected userService: UserService;

  constructor() {
    this.golistService = new GolistService();
    this.userService = new UserService();
  }

  index = async (req: Request, res: Response) => {
    const { limit, page, title = "", type = "" } = req.query;
    const limitNow = limit ? limit : 10;
    const filter: FilterQuery<IGolist> = {
      title: { $regex: title, $options: "i" },
      createdBy: req.locals.auth?.userId,
      isDeleted: false,
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
    };
    if (type) filter.type = type;
    const response = await this.golistService.index(
      Number(page),
      Number(limitNow),
      filter
    );
    return res.status(response.code).json(response);
  };

  create = async (req: Request, res: Response) => {
    const user = req.locals.auth?.userId;
    const payload: IGolist = {
      ...req.body,
      createdBy: user,
    };
    if (payload.type === EList.myList) {
      payload.title = "My List";
      const phoneContacts = req.body.phoneContacts as string[];
      const users = await this.userService.index(1, 10000, {
        _id: { $ne: payload.createdBy },
        phone: { $in: phoneContacts },
      });
      console.log("~ USER_DATA", users);
      const mylist = await this.golistService.index(1, 1, {
        type: EList.myList,
        createdBy: user,
      });
      console.log("~ MYLIST", mylist.data.result);
      if (mylist.total && mylist.total !== 0) {
        const item = mylist.data.result[0] as IGolist;
        const response = await this.golistService.update(
          item._id?.toString() ?? "",
          {
            serviceProviders: users?.data?.result?.map((e: IUser) => e?._id),
            createdBy: user,
          }
        );
        return res.status(response.code).json(response);
      }
      if (users.status)
        payload.serviceProviders = users?.data?.result?.map(
          (e: IUser) => e?._id
        );
    }
    const response = await this.golistService.create(payload);
    return res.status(response.code).json(response);
  };

  show = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.golistService.show(id, [
      ModelHelper.populateData(
        "serviceProviders",
        ModelHelper.userSelect,
        "Users"
      ),
      ModelHelper.populateData("taskInterests"),
    ]);
    return res.status(response.code).json(response);
  };

  showMyList = async (req: Request, res: Response) => {
    const list = await this.golistService.index(1, 1, {
      createdBy: req.locals.auth?.userId,
      type: EList.myList,
    });
    if (list.data.pagination.totalItems === 0)
      return res
        .status(404)
        .json({ data: null, status: false, msg: "Not found" });
    const response = await this.golistService.show(
      list.data.result[0]._id.toString(),
      [
        ModelHelper.populateData(
          "serviceProviders",
          ModelHelper.userSelect,
          "Users"
        ),
        ModelHelper.populateData("taskInterests"),
      ]
    );
    return res.status(response.code).json(response);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dataset: Partial<IGolist> = { ...req.body };

    const response = await this.golistService.update(id, dataset);
    return res.status(response.code).json(response);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const response = await this.golistService.delete(id);
    return res.status(response.code).json(response);
  };

  checkPostalCode = async (req: Request, res: Response) => {
    const { zipCode } = req.query;
    const response = await this.golistService.checkPostalCode(
      zipCode as string
    );
    return res.status(response.code).json(response);
  };

  getNearestServiceProviders = async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    const {
      latitude,
      longitude,
      zipCode,
      taskInterests = [],
      volunteers,
      subscription,
      rating,
      companyLogo,
      companyRegistration,
      companyWebsite,
      companyAffilation,
      companyPublication,
      companyResume,
      certificate,
      license,
      reference,
      insurance,
      city,
      town,
      search,
      visualPhotos,
      visualVideos,
    } = req.body;
    const limitNow = limit ? limit : 10;
    const coordinates = [Number(longitude), Number(latitude)];
    const response = await this.golistService.getNearestServiceProviders(
      Number(page),
      Number(limitNow),
      req.locals.auth?.userId,
      city,
      town,
      coordinates,
      taskInterests as string[],
      volunteers as undefined | string[],
      subscription as undefined | string[],
      zipCode?.toString(),
      rating ? (parseInt(rating.toString()) as ERating) : undefined,
      companyLogo as boolean | undefined,
      companyRegistration as boolean | undefined,
      companyWebsite as boolean | undefined,
      companyAffilation as boolean | undefined,
      companyPublication as boolean | undefined,
      companyResume as boolean | undefined,
      certificate as boolean | undefined,
      license as boolean | undefined,
      reference as boolean | undefined,
      insurance as boolean | undefined,
      search as string,
      visualPhotos as boolean | undefined,
      visualVideos as boolean | undefined
    );

    // console.log(response);
    return res.status(response.code).json(response);
  };

  getNearestUsers = async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    const {
      latitude,
      longitude,
      zipCode,
      taskInterests = [],
      volunteers,
      subscription,
      rating,
      companyLogo,
      companyRegistration,
      companyWebsite,
      companyAffilation,
      companyPublication,
      companyResume,
      certificate,
      license,
      reference,
      insurance,
      search,
      visualPhotos,
      visualVideos,
      userRole,
    } = req.body;
    const limitNow = limit ? limit : 10;
    const coordinates = [Number(longitude), Number(latitude)];
    const response = await this.golistService.getNearestUsers(
      Number(page),
      Number(limitNow),
      req.locals.auth?.userId,
      coordinates,
      taskInterests as string[],
      volunteers as undefined | string[],
      subscription as undefined | string[],
      zipCode?.toString(),
      rating ? (parseInt(rating.toString()) as ERating) : undefined,
      companyLogo as boolean | undefined,
      companyRegistration as boolean | undefined,
      companyWebsite as boolean | undefined,
      companyAffilation as boolean | undefined,
      companyPublication as boolean | undefined,
      companyResume as boolean | undefined,
      certificate as boolean | undefined,
      license as boolean | undefined,
      reference as boolean | undefined,
      insurance as boolean | undefined,
      search as string,
      visualPhotos as boolean | undefined,
      visualVideos as boolean | undefined,
      userRole as EUserRole | undefined
    );
    return res.status(response.code).json(response);
  };

  shareToMyList = async (req: Request, res: Response) => {
    const { serviceProviderId, myList } = req.body;
    const response = await this.golistService.shareToMyList(
      req.locals.auth?.userId as string,
      serviceProviderId,
      myList
    );
    return res.status(response.code).json(response);
  };
}
export default GolistController;
