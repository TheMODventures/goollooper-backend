import {
  IState,
  IStateDoc,
} from "../../../database/interfaces/state.interface";
import { State } from "../../../database/models/state.model";
import { BaseRepository } from "../base.repository";
import { IStateRepository } from "./state.repository.interface";

export class StateRepository
  extends BaseRepository<IState, IStateDoc>
  implements IStateRepository
{
  constructor() {
    super(State);
  }
}
