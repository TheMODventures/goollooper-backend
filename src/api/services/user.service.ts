import { EUserRole } from "../../database/interfaces/enums";
import { IUser } from "../../database/interfaces/user.interface";
import { UserRepository } from "../repository/user/user.repository";
import {
  SUCCESS_DATA_DELETION_PASSED,
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
} from "../../constant";
import { ResponseHelper } from "../helpers/reponseapi.helper";

class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  index = async (page: number, limit = 10): Promise<ApiResponse> => {
    try {
      const filter = {
        role: EUserRole.user,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
      };
      const getDocCount = await this.userRepository.getCount(filter);
      const response = await this.userRepository.getAll<IUser>(
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
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  list = async (selectField: string) => {
    try {
      const filter = {
        role: EUserRole.user,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
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
      const filter = {
        role: EUserRole.user,
        _id: _id,
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: { $eq: null } }],
      };
      const response = await this.userRepository.getOne<IUser>(filter);
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
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
    dataset: Partial<IUser>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.updateById<IUser>(
        _id,
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

  trashIndex = async (page: number, limit = 10): Promise<ApiResponse> => {
    try {
      const filter = {
        role: EUserRole.user,
        $and: [{ deletedAt: { $exists: true } }, { deletedAt: { $ne: null } }],
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
      const response = await this.userRepository.delete({ _id: _id });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default UserService;
