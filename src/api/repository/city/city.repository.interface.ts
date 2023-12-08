import { ICity, ICityDoc } from "../../../database/interfaces/city.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface ICityRepository extends IBaseRepository<ICity, ICityDoc> {}
