import mongoose, { FilterQuery, ObjectId } from "mongoose";
import { Request } from "express";
import moment from "moment";
import crypto from "crypto";
import { compare } from "bcrypt";

import { AUTH_PROVIDER, EUserRole } from "../../database/interfaces/enums";
import { IUser, IUserDoc } from "../../database/interfaces/user.interface";
import { UserRepository } from "../repository/user/user.repository";
import { ScheduleRepository } from "../repository/schedule/schedule.repository";
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
import { stripeHelper } from "../helpers/stripe.helper";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { IWallet } from "../../database/interfaces/wallet.interface";
import Mailer from "../helpers/mailer.helper";

class AuthService {
  private tokenService: TokenService;
  private userRepository: UserRepository;
  private scheduleRepository: ScheduleRepository;
  private walletRepository: WalletRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenService = new TokenService();
    this.scheduleRepository = new ScheduleRepository();
    this.walletRepository = new WalletRepository();
  }

  myDetail = async (userId: string): Promise<IUser | null> => {
    return await this.userRepository.getById<IUser>(userId);
  };

  validateEmail = async (email: string): Promise<Boolean> => {
    const response = await this.userRepository.getOne<IUser>({
      email: email,
      isDeleted: false,
    });
    return response ? true : false;
  };

  register = async (req: Request, role: EUserRole): Promise<ApiResponse> => {
    try {
      const createCode = crypto.randomInt(100000, 999999);
      const userPayload: IUserDoc = this.buildUserPayload(
        req.body,
        role,
        createCode
      );

      const newUser = await this.userRepository.create<IUser>(userPayload);
      if (!newUser) return ResponseHelper.sendResponse(400, "User not created");

      const [wallet, tokenResponse, stripeCustomer] = await Promise.all([
        this.walletRepository.create<IWallet>({ user: newUser._id } as IWallet),
        this.tokenService.create(
          new mongoose.Types.ObjectId(newUser._id),
          role
        ),
        stripeHelper.createStripeCustomer(newUser.email),
      ]);

      const updateData: Partial<IUser> = { wallet: wallet._id as string };

      if (stripeCustomer) updateData.stripeCustomerId = stripeCustomer.id;

      await this.userRepository.updateById(newUser._id as string, updateData);

      Mailer.sendEmail({
        email: newUser.email,
        subject: "Verification Code",
        message: `<h1>Your Verification Code is ${createCode}</h1>`,
      });

      return ResponseHelper.sendSignTokenResponse(
        201,
        SUCCESS_REGISTRATION_PASSED,
        newUser,
        tokenResponse
      );
    } catch (error) {
      console.error("Registration Error:", error); // Improved error logging
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  buildUserPayload = (
    body: any,
    role: EUserRole,
    otpCode: number
  ): IUserDoc => {
    return {
      ...body,
      role: role,
      otpCode: otpCode,
      otpExpiredAt: moment().add(60, "seconds").valueOf(),
      fcmTokens: body.fcmToken ? [body.fcmToken] : [],
    };
  };

  login = async (
    email: string,
    password: string,
    role?: EUserRole,
    fcmToken?: string
  ): Promise<ApiResponse> => {
    try {
      let filter: FilterQuery<IUser> = {
        email,
        isDeleted: false,
      };
      if (role === EUserRole.admin) {
        filter = {
          ...filter,
          $or: [
            { role: EUserRole.admin },
            { role: EUserRole.subAdmin },
            { role: EUserRole.support },
          ],
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
        undefined,
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
      if (
        response === null ||
        (response && !(await compare(password, response.password!)))
      ) {
        return ResponseHelper.sendResponse(401, ERROR_LOGIN);
      }

      const userId = new mongoose.Types.ObjectId(response._id!);

      const schedules = await this.scheduleRepository.getAll({
        user: userId,
        isDeleted: false,
      });

      const res = {
        ...response,
        schedule: schedules,
      };
      const tokenResponse = await this.tokenService.create(
        userId,
        response.role
      );

      if (fcmToken)
        this.userRepository.updateById(response._id?.toString() ?? "", {
          $addToSet: { fcmTokens: fcmToken },
        });

      return ResponseHelper.sendSignTokenResponse(
        200,
        SUCCESS_LOGIN_PASSED,
        res,
        tokenResponse
      );
    } catch (error) {
      console.log(error);
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

      Mailer.sendEmail({
        email: responseData.email,
        subject: "OTP",
        message: `<h1>Your OTP is ${response.data.otpCode}</h1>`,
      });

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
    refreshToken: string,
    fcmToken?: string
  ): Promise<ApiResponse> => {
    try {
      await this.tokenService.loggedOut(userId, refreshToken, fcmToken);
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
  googleAuth = async (req: Request): Promise<ApiResponse> => {
    try {
      // Extract social ID and email from request body
      const { socialAuthId, fcmToken, email } = req.body;

      // Check if the user already exists using the social ID
      let existingUser = await this.userRepository.getOne<IUser>({
        socialAuthId,
      });

      // If the user doesn't exist by social ID, check for an existing email
      if (!existingUser && email) {
        existingUser = await this.userRepository.getOne<IUser>({ email });
        // If the email is found but no socialAuthId is linked, update the user to link it
        if (existingUser && !existingUser.socialAuthId) {
          await this.userRepository.updateById(existingUser._id as string, {
            socialAuthId,
            authProvider: AUTH_PROVIDER.GOOGLE,
          });
        }
      }

      let data: IUser;
      if (existingUser) {
        // If the user exists, log them in
        data = existingUser;

        // Update FCM token if provided
        if (fcmToken && !(existingUser?.fcmTokens ?? []).includes(fcmToken)) {
          await this.userRepository.updateById(existingUser._id as string, {
            $addToSet: { fcmTokens: fcmToken }, // Add FCM token if not already present
          });
        }
      } else {
        // If the user doesn't exist, register them
        const newUser: IUser = {
          ...req.body,
          role: EUserRole.user,
          authProvider: AUTH_PROVIDER.GOOGLE,
          socialAuthId,
        };

        if (fcmToken) newUser.fcmTokens = [fcmToken];

        data = await this.userRepository.create<IUser>(newUser);

        if (!data) return ResponseHelper.sendResponse(500, "User not created");

        // Create a wallet for the new user
        const wallet = await this.walletRepository.create<IWallet>({
          user: data._id,
        } as IWallet);

        // Create a Stripe customer for the new user
        const CustomerCreate = await stripeHelper.createStripeCustomer(
          data.email || undefined
        );
        if (CustomerCreate) {
          await this.userRepository.updateById(data._id as string, {
            stripeCustomerId: CustomerCreate.id,
          });
        }

        // Update the user with the wallet ID
        await this.userRepository.updateById(data._id as string, {
          wallet: wallet._id,
        });
      }

      // Generate authentication token
      const userId = new mongoose.Types.ObjectId(data._id!);
      const tokenResponse = await this.tokenService.create(
        userId,
        EUserRole.user
      );

      return ResponseHelper.sendSignTokenResponse(
        200,
        existingUser ? "Login Successful" : SUCCESS_REGISTRATION_PASSED,
        data,
        tokenResponse
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  facebookAuth = async (req: Request): Promise<ApiResponse> => {
    try {
      // Extract social ID and email from request body
      const { socialAuthId, fcmToken, email } = req.body;

      // Check if the user already exists using the social ID
      let existingUser = await this.userRepository.getOne<IUser>({
        socialAuthId,
      });

      // If the user doesn't exist by social ID, check for an existing email
      if (!existingUser && email) {
        existingUser = await this.userRepository.getOne<IUser>({ email });

        // If the email is found but no socialAuthId is linked, update the user to link it
        if (existingUser && !existingUser.socialAuthId) {
          await this.userRepository.updateById(existingUser._id as string, {
            socialAuthId,
            authProvider: AUTH_PROVIDER.FACEBOOK,
          });
        }
      }

      let data: IUser;
      if (existingUser) {
        // If the user exists, log them in
        data = existingUser;

        // Update FCM token if provided
        if (fcmToken && !(existingUser?.fcmTokens ?? []).includes(fcmToken)) {
          await this.userRepository.updateById(existingUser._id as string, {
            $addToSet: { fcmTokens: fcmToken }, // Add FCM token if not already present
          });
        }
      } else {
        // If the user doesn't exist, register them
        const newUser: IUserDoc = {
          ...req.body,
          role: EUserRole.user,
          authProvider: AUTH_PROVIDER.FACEBOOK,
          socialAuthId,
        };

        if (fcmToken) newUser.fcmTokens = [fcmToken];

        data = await this.userRepository.create<IUser>(newUser);
        if (!data) return ResponseHelper.sendResponse(500, "User not created");

        // Create a wallet for the new user
        const wallet = await this.walletRepository.create<IWallet>({
          user: data._id,
        } as IWallet);

        // Create a Stripe customer for the new user
        const CustomerCreate = await stripeHelper.createStripeCustomer(
          data.email || ""
        );
        if (CustomerCreate) {
          await this.userRepository.updateById(data._id as string, {
            stripeCustomerId: CustomerCreate.id,
          });
        }

        // Update the user with the wallet ID
        await this.userRepository.updateById(data._id as string, {
          wallet: wallet._id,
        });
      }

      // Generate authentication token
      const userId = new mongoose.Types.ObjectId(data._id!);
      const tokenResponse = await this.tokenService.create(
        userId,
        EUserRole.user
      );

      return ResponseHelper.sendSignTokenResponse(
        200,
        existingUser ? "Login Successful" : SUCCESS_REGISTRATION_PASSED,
        data,
        tokenResponse
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  appleAuth = async (req: Request): Promise<ApiResponse> => {
    try {
      // Extract social ID, email, and fcmToken from request body
      const { socialAuthId, fcmToken, email } = req.body;

      // Initialize a variable to hold the existing user
      let existingUser: IUser | null = null;

      // First, try to find the user by socialAuthId
      if (socialAuthId) {
        existingUser = await this.userRepository.getOne<IUser>({
          socialAuthId,
        });
      }

      // If no user is found and email is provided, check by email
      if (!existingUser && email) {
        existingUser = await this.userRepository.getOne<IUser>({ email });

        // If a user is found by email but has no socialAuthId, update the record
        if (existingUser && !existingUser.socialAuthId) {
          await this.userRepository.updateById(existingUser._id as string, {
            socialAuthId,
            authProvider: AUTH_PROVIDER.APPLE,
          });
        }
      }

      let data: IUser;
      if (existingUser) {
        // If the user exists, log them in
        data = existingUser;

        // Update FCM token if provided
        if (fcmToken && !(existingUser.fcmTokens ?? []).includes(fcmToken)) {
          await this.userRepository.updateById(existingUser._id as string, {
            $addToSet: { fcmTokens: fcmToken }, // Add FCM token if not already present
          });
        }
      } else {
        // If the user doesn't exist, register them
        const newUser: IUserDoc = {
          socialAuthId,
          authProvider: AUTH_PROVIDER.APPLE,
          role: EUserRole.user,
          ...(email && { email }), // Only include email if it exists
          fcmTokens: fcmToken ? [fcmToken] : [],
        };

        data = await this.userRepository.create<IUser>(newUser);
        if (!data) return ResponseHelper.sendResponse(500, "User not created");

        // Create a wallet for the new user
        const wallet = await this.walletRepository.create<IWallet>({
          user: data._id,
        } as IWallet);

        // Create a Stripe customer for the new user
        const CustomerCreate = await stripeHelper.createStripeCustomer(
          email || undefined
        );
        if (CustomerCreate) {
          await this.userRepository.updateById(data._id as string, {
            stripeCustomerId: CustomerCreate.id,
          });
        }

        // Update the user with the wallet ID
        await this.userRepository.updateById(data._id as string, {
          wallet: wallet._id,
        });
      }

      // Generate authentication token
      const userId = new mongoose.Types.ObjectId(data._id!);
      const tokenResponse = await this.tokenService.create(
        userId,
        EUserRole.user
      );

      return ResponseHelper.sendSignTokenResponse(
        200,
        existingUser ? "Login Successful" : SUCCESS_REGISTRATION_PASSED,
        data,
        tokenResponse
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default AuthService;
