import {
  IToken,
  ITokenDoc,
} from "../../../database/interfaces/token.interface";
import { IBaseRepository } from "../base.repository.interface";

export interface ITokenRepository extends IBaseRepository<IToken, ITokenDoc> {}
