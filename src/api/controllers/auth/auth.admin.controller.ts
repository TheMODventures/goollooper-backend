import { Request, Response } from "express";

import { EUserRole } from "../../../database/interfaces/enums";
import AuthBaseController from "./auth.base.controller";

class AuthController extends AuthBaseController {
  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const response = await this.authService.login(
      email,
      password,
      EUserRole.admin
    );
    return res.status(response.code).json(response);
  };
}

export default AuthController;
