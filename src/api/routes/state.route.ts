import { Validation } from "../../middleware/validation.middleware";
import StateController from "../controllers/state/state.controller";
import BaseRoutes from "./base.route";

class StateRoutes extends BaseRoutes {
  private stateController: StateController;
  private validateRequest;

  constructor() {
    super();
    this.stateController = new StateController();
    this.validateRequest = new Validation().reporter(true, "auth");
    this.initializeRoutes();
  }

  protected routes(): void {
    this.router.get(
      "/states",
      this.validateRequest,
      this.stateController.index
    );
    // this.router.get(
    //   "/cities",
    //   this.validateRequest,
    //   this.StateController.getCities
    // );
    // this.router.get(
    //   "/counties",
    //   this.validateRequest,
    //   this.StateController.getCounties
    // );
  }
}

export default StateRoutes;
