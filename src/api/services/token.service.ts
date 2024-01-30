import { sign } from "jsonwebtoken";
import mongoose, { FilterQuery } from "mongoose";

import { EUserRole } from "../../database/interfaces/enums";
import { IToken, ITokenDoc } from "../../database/interfaces/token.interface";
import { TokenRepository } from "../repository/token/token.repository";
import {
  JWT_REFRESH_SECRET_KEY,
  JWT_REFRESH_SECRET_EXPIRE_IN,
  JWT_SECRET_EXPIRE_IN,
  JWT_SECRET_KEY,
} from "../../config/environment.config";

class TokenService {
  private tokenRepository: TokenRepository;

  constructor() {
    this.tokenRepository = new TokenRepository();
  }

  create = async (
    userId: mongoose.Types.ObjectId,
    role: EUserRole
  ): Promise<JwtToken> => {
    try {
      const accessToken = this.generateJwtToken(
        userId,
        role,
        JWT_SECRET_KEY!,
        JWT_SECRET_EXPIRE_IN!
      );
      const refreshToken = this.generateJwtToken(
        userId,
        role,
        JWT_REFRESH_SECRET_KEY!,
        JWT_REFRESH_SECRET_EXPIRE_IN!
      );
      const token: IToken = {
        userId: userId,
        role: role,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
      const response = await this.tokenRepository.create<IToken>(token);
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } catch (err) {
      throw new Error("Something went wrong while creating token");
    }
  };

  private generateJwtToken(
    userId: mongoose.Types.ObjectId,
    role: EUserRole,
    jwtKey: string,
    jwtExpire: string
  ): string {
    const payload = {
      userId: userId,
      role: role,
    };
    const token = sign(payload, jwtKey, {
      expiresIn: jwtExpire,
    });
    return token;
  }

  loggedOut = async (
    userId: string,
    refreshToken: string
  ): Promise<boolean> => {
    return await this.tokenRepository.deleteMany<IToken>({
      userId: userId,
      refreshToken: refreshToken,
    });
  };

  setNewToken = async (
    tokenId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    role: EUserRole,
    refreshToken: string
  ): Promise<JwtToken> => {
    try {
      const newTokenId = tokenId.toString();
      const newAccessToken = this.generateJwtToken(
        userId,
        role,
        JWT_SECRET_KEY!,
        JWT_SECRET_EXPIRE_IN!
      );
      this.tokenRepository.updateById(newTokenId, {
        accessToken: newAccessToken,
      });
      return {
        accessToken: newAccessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      throw new Error("Something went wrong");
    }
  };

  validateToken = async (
    userId?: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<ITokenDoc | null> => {
    let tokenFilter: FilterQuery<ITokenDoc> = {};
    userId && (tokenFilter.userId = userId);
    accessToken && (tokenFilter.accessToken = accessToken);
    refreshToken && (tokenFilter.refreshToken = refreshToken);
    const response = await this.tokenRepository.getOne<ITokenDoc>(tokenFilter);
    return response;
  };
}

export default TokenService;
