import { Router } from "express";

abstract class BaseRoutes {
  public router: Router;

  constructor() {}
  protected initializeRoutes(): void {
    this.router = Router();
    this.routes();
  }

  protected abstract routes(): void;
}

export default BaseRoutes;
