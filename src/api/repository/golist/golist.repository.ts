import {
  IGolist,
  IGolistDoc,
} from "../../../database/interfaces/golist.interface";
import { Golist } from "../../../database/models/golist.model";
import { BaseRepository } from "../base.repository";
import { IGolistRepository } from "./golist.repository.interface";

export class GolistRepository
  extends BaseRepository<IGolist, IGolistDoc>
  implements IGolistRepository
{
  constructor() {
    super(Golist);
  }
}
