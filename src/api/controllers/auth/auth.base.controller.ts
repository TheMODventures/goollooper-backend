import { Request, Response } from "express";
import bcrypt from "bcrypt";

import AuthService from "../../services/auth.service";

class AuthBaseController {
  protected authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  getAccessToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const response = await this.authService.getAccessToken(refreshToken);
    return res.status(response.code).json(response);
  };

  logout = async (req: Request, res: Response) => {
    const userId = req?.locals?.auth?.userId!;
    const { refreshToken } = req.body;
    const response = await this.authService.logout(userId, refreshToken);
    return res.status(response.code).json(response);
  };

  updateData = async (req: Request, res: Response) => {
    const userId = req?.locals?.auth?.userId!;
    let oldPassword = undefined;
    if (req.body.confirmPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      req.body.password = hashedPassword;
      delete req.body.confirmPassword;
    }
    if (req.body.oldPassword) {
      oldPassword = req.body.oldPassword;
      delete req.body.oldPassword;
    }
    if (req.body.role) {
      delete req.body.role;
    }
    if (req.body.isBanned) {
      delete req.body.isBanned;
    }
    const response = await this.authService.updateData(
      userId,
      req,
      oldPassword
    );
    return res.status(response.code).json(response);
  };
}

export default AuthBaseController;
