import {
  IService,
  IServiceDoc,
} from "../../../database/interfaces/service.interface";
import { Service } from "../../../database/models/service.model";
import { BaseRepository } from "../base.repository";
import { IServiceRepository } from "./service.repository.interface";

export class ServiceRepository
  extends BaseRepository<IService, IServiceDoc>
  implements IServiceRepository
{
  constructor() {
    super(Service);
  }
}
