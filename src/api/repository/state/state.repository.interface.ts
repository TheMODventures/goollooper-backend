import {
  IState,
  IStateDoc,
} from "../../../database/interfaces/state.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface IStateRepository extends IBaseRepository<IState, IStateDoc> {}
