import {
  IToken,
  ITokenDoc,
} from "../../../database/interfaces/token.interface";
import { Token } from "../../../database/models/token.model";
import { BaseRepository } from "../base.repository";
import { ITokenRepository } from "./token.repository.interface";

export class TokenRepository
  extends BaseRepository<IToken, ITokenDoc>
  implements ITokenRepository
{
  constructor() {
    super(Token);
  }
}
