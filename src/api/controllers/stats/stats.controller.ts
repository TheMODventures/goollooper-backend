import { Request, Response } from "express";

import UserService from "../../services/user.service";
import TaskService from "../../services/task.service";
import { EUserRole } from "../../../database/interfaces/enums";

class StatsController {
  protected userService: UserService;
  protected taskService: TaskService;

  constructor() {
    this.userService = new UserService();
    this.taskService = new TaskService();
  }

  index = async (req: Request, res: Response) => {
    const userCount = await this.userService.getCount({
      role: { $in: [EUserRole.user, EUserRole.serviceProvider] },
    });
    const taskCount = await this.taskService.getCount();
    const response = {
      code: 200,
      data: {
        userCount: userCount.data,
        taskCount: taskCount.data,
      },
      message: "Success",
    };
    return res.status(response.code).json(response);
  };
}

export default StatsController;
