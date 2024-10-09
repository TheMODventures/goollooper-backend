import { Request, Response } from "express";

import { EUserRole } from "../../../database/interfaces/enums";
import AuthBaseController from "./auth.base.controller";

class AuthController extends AuthBaseController {
  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const response = await this.authService.login(
      email,
      password,
      EUserRole.admin || EUserRole.support
    );
    return res.status(response.code).json(response);
  };

  forgetPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const response = await this.authService.forgotPassword(email);
    return res.status(response.code).json(response);
  };

  resendOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    const response = await this.authService.resendOtp(email);
    return res.status(response.code).json(response);
  };

  verifyOtp = async (req: Request, res: Response) => {
    const userId = req?.locals?.auth?.userId!;
    const { code } = req.body;
    const response = await this.authService.verifyOtp(userId, code);
    return res.status(response.code).json(response);
  };
}

export default AuthController;
