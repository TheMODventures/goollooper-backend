import mongoose, { FilterQuery } from "mongoose";
import { Request } from "express";
import moment from "moment";
import crypto from "crypto";
import { compare } from "bcrypt";

import { EUserRole } from "../../database/interfaces/enums";
import { IUser, IUserDoc } from "../../database/interfaces/user.interface";
import { UserRepository } from "../repository/user/user.repository";
import {
  ERROR_LOGIN,
  ERROR_OLD_PASSWORD,
  ERROR_VERiFICATION,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_LOGIN_PASSED,
  SUCCESS_LOGOUT_PASS,
  SUCCESS_NEW_TOKEN_PASSED,
  SUCCESS_OTP_SEND_PASSED,
  SUCCESS_OTP_VERIFICATION_PASSED,
  SUCCESS_REGISTRATION_PASSED,
} from "../../constant";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import TokenService from "./token.service";

class AuthService {
  private tokenService: TokenService;
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenService = new TokenService();
  }

  myDetail = async (userId: string): Promise<IUser | null> => {
    return await this.userRepository.getById<IUser>(userId);
  };

  validateEmail = async (email: string): Promise<Boolean> => {
    const response = await this.userRepository.getOne<IUser>({
      email: email,
    });
    return response ? true : false;
  };

  register = async (req: Request, role: EUserRole): Promise<ApiResponse> => {
    try {
      const createCode = crypto.randomInt(100000, 999999);
      const user: IUserDoc = {
        ...req.body,
        role: role,
        otpCode: Number(createCode),
        otpExpiredAt: moment().add(60, "seconds").valueOf(),
      };
      const data = await this.userRepository.create<IUser>(user);
      const userId = new mongoose.Types.ObjectId(data._id!);
      const tokenResponse = await this.tokenService.create(userId, role);
      return ResponseHelper.sendSignTokenResponse(
        201,
        SUCCESS_REGISTRATION_PASSED,
        data,
        tokenResponse
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  login = async (
    email: string,
    password: string,
    role?: EUserRole
  ): Promise<ApiResponse> => {
    try {
      let filter: FilterQuery<IUser> = {
        email,
      };
      if (role) {
        filter = {
          ...filter,
          role,
        };
      } else {
        filter = {
          ...filter,
          $or: [{ role: EUserRole.user }, { role: EUserRole.serviceProvider }],
        };
      }
      let response = await this.userRepository.getOne<IUser>(
        filter,
        "+password",
        undefined
        // [
        //   {
        //     path: "package",
        //   },
        // ]
      );
      if (
        response === null ||
        (response && !(await compare(password, response.password!)))
      ) {
        return ResponseHelper.sendResponse(401, ERROR_LOGIN);
      }

      const userId = new mongoose.Types.ObjectId(response._id!);
      const tokenResponse = await this.tokenService.create(
        userId,
        response.role
      );

      return ResponseHelper.sendSignTokenResponse(
        200,
        SUCCESS_LOGIN_PASSED,
        response,
        tokenResponse
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  forgotPassword = async (email: string): Promise<ApiResponse> => {
    try {
      const responseData = await this.userRepository.getOne<IUser>({
        email: email,
      });
      if (responseData === null) {
        return ResponseHelper.sendResponse(404);
      }
      const response = await this.resendOtp(email as string);
      const userId = new mongoose.Types.ObjectId(responseData._id!);
      const tokenResponse = await this.tokenService.create(
        userId,
        responseData.role
      );
      return ResponseHelper.sendSignTokenResponse(
        200,
        SUCCESS_OTP_SEND_PASSED,
        response.data,
        tokenResponse
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  getAccessToken = async (refreshToken: string): Promise<ApiResponse> => {
    try {
      const response = await this.tokenService.validateToken(
        undefined,
        undefined,
        refreshToken
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      const resp = await this.tokenService.setNewToken(
        response._id!,
        response.userId,
        response.role,
        refreshToken
      );
      return ResponseHelper.sendSuccessResponse(SUCCESS_NEW_TOKEN_PASSED, resp);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  verifyOtp = async (userId: string, code: number): Promise<ApiResponse> => {
    try {
      const response = await this.userRepository.getOne<IUser>({
        _id: userId,
        otpCode: code,
        otpExpiredAt: { $gte: moment().valueOf() },
      });
      if (response === null) {
        return ResponseHelper.sendResponse(404, ERROR_VERiFICATION);
      }
      await this.userRepository.updateById<IUser>(userId, {
        otpCode: null,
        otpExpiredAt: null,
        isVerified: true,
      });
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_OTP_VERIFICATION_PASSED
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  resendOtp = async (email: string): Promise<ApiResponse> => {
    try {
      const createCode = crypto.randomInt(100000, 999999);
      const updateObj = {
        otpCode: Number(createCode),
        otpExpiredAt: moment().add(60, "seconds").valueOf(),
      };
      const response = await this.userRepository.updateByOne<IUser>(
        {
          email,
        },
        updateObj
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_OTP_SEND_PASSED,
        updateObj
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  logout = async (
    userId: string,
    refreshToken: string
  ): Promise<ApiResponse> => {
    try {
      await this.tokenService.loggedOut(userId, refreshToken);
      return ResponseHelper.sendSuccessResponse(SUCCESS_LOGOUT_PASS);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  updateData = async (
    userId: string,
    req: Request,
    oldPassword?: string
  ): Promise<ApiResponse> => {
    let path = undefined;
    try {
      const response = await this.userRepository.getOne<IUser>(
        {
          _id: userId,
        },
        "+password"
      );
      if (oldPassword) {
        if (
          response === null ||
          (response && !(await compare(oldPassword, response.password!)))
        ) {
          return ResponseHelper.sendResponse(404, ERROR_OLD_PASSWORD);
        }
      }

      const data: Partial<IUser> = { ...req.body };

      const resp = await this.userRepository.updateById<IUser>(userId, data);
      if (resp === null) {
        return ResponseHelper.sendResponse(404);
      }

      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        resp
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default AuthService;
