import { Request, Response } from "express";

import { EUserRole } from "../../../database/interfaces/enums";
import AuthBaseController from "./auth.base.controller";

class AuthController extends AuthBaseController {
  register = async (req: Request, res: Response) => {
    const response = await this.authService.register(req, EUserRole.user);
    return res.status(response.code).json(response);
  };

  login = async (req: Request, res: Response) => {
    const { email, password, fcmToken } = req.body;
    const response = await this.authService.login(
      email,
      password,
      undefined,
      fcmToken
    );
    return res.status(response.code).json(response);
  };

  forgetPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const response = await this.authService.forgotPassword(email);
    return res.status(response.code).json(response);
  };

  verifyOtp = async (req: Request, res: Response) => {
    const userId = req?.locals?.auth?.userId!;
    const { code } = req.body;
    const response = await this.authService.verifyOtp(userId, code);
    return res.status(response.code).json(response);
  };

  resendOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    const response = await this.authService.resendOtp(email);
    return res.status(response.code).json(response);
  };
}

export default AuthController;
