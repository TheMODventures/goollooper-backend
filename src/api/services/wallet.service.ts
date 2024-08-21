import { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import { IWallet } from "../../database/interfaces/wallet.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { WalletRepository } from "../repository/wallet/wallet.repository";
import { UserRepository } from "../repository/user/user.repository";
import StripeService from "./stripe.service";
import { IUser } from "../../database/interfaces/user.interface";
import Stripe from "stripe";
import { Request } from "express";
import _ from "lodash";
import { stripeHelper } from "../helpers/stripe.helper";

class WalletService {
  private walletRepository: WalletRepository;
  protected userRepository: UserRepository;
  protected stripeService: StripeService;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.userRepository = new UserRepository();
    this.stripeService = new StripeService();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IWallet>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.walletRepository.getCount(filter);
      const response = await this.walletRepository.getAll<IWallet>(
        filter,
        "",
        "",
        {
          createdAt: "desc",
        },
        undefined,
        true,
        page,
        limit
      );
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_LIST_PASSED,
        response,
        getDocCount
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  create = async (payload: IWallet, req: Request): Promise<ApiResponse> => {
    const {
      idNumber,
      ssnLast4,
      dob,
      countryCode,
      city,
      line1,
      line2,
      country,
      state,
      postal_code,
    } = req.body;
    payload.user = req.locals.auth?.userId as string;
    try {
      const user: IUser | null = await this.userRepository.getById(
        req.locals.auth?.userId as string
      );
      if (user?.wallet)
        return ResponseHelper.sendResponse(
          409,
          "Wallet already created for this user"
        );

      if (!user?.isProfileCompleted) {
        return ResponseHelper.sendResponse(
          400,
          "Complete your profile to create wallet"
        );
      }
      if (
        !user.stripeConnectId &&
        countryCode == "US" &&
        !idNumber &&
        !ssnLast4
      ) {
        return ResponseHelper.sendResponse(
          400,
          "idNumber or ssnLast4 is required for US country"
        );
      }

      let stripeDataset: Stripe.AccountCreateParams = {
        default_currency: "usd",
      };

      stripeDataset = {
        email: user.email,
        country: countryCode,
        individual: {
          ssn_last_4: countryCode == "US" ? ssnLast4 : undefined,
          id_number: country == "US" ? idNumber : undefined,
          address: {
            line1,
            line2,
            country,
            state,
            city,
            postal_code,
          },

          email: user.email,
          gender: user.gender,
          phone: `${user.phoneCode}${user.phone}`,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        external_account: {
          account_number: req.body.account_number,
          routing_number: req.body.routing_number,
          currency: "usd",
          account_holder_name: req.body.account_holder_name,
          country: countryCode,
          account_holder_type: "individual",
          object: "bank_account",
        },
      };

      if (dob && stripeDataset.individual) {
        const a = (dob as string).split("-").map((e) => parseInt(e));
        stripeDataset.individual.dob = { year: a[0], month: a[1], day: a[2] };
      }

      const stripeWallets = await this.stripeService.createWallet(
        user?.email,
        stripeDataset
      );

      if (stripeWallets.code !== 200) return stripeWallets;

      const uploaded = await this.uploadDocuments(
        stripeWallets.data.stripeConnect.id,
        req.files
      );
      if (!uploaded)
        return ResponseHelper.sendResponse(
          500,
          "Error while uploading documents"
        );
      const data = await this.walletRepository.create<IWallet>(payload);
      await this.userRepository.updateById(payload.user as string, {
        stripeConnectId: stripeWallets.data.stripeConnect.id,
        stripeCustomerId: stripeWallets.data.stripeCustomer.id,
        wallet: data._id,
      });
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      console.log(error);
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        user: _id,
      };
      const response = await this.walletRepository.getOne<IWallet>(filter);
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_SHOW_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  update = async (
    _id: string,
    dataset: Partial<IWallet>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.walletRepository.updateByOne<IWallet>(
        { user: _id },
        dataset
      );
      if (response === null) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(
        SUCCESS_DATA_UPDATION_PASSED,
        response
      );
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  delete = async (_id: string): Promise<ApiResponse> => {
    try {
      const response = await this.walletRepository.delete<IWallet>({ _id });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  uploadDocuments = async (
    stripeConnectId: string,
    files: any
  ): Promise<Boolean> => {
    let documentFront, documentBack;

    if (
      files &&
      _.isArray(files) &&
      files?.find((file) => file.fieldname === "identityDocumentFront")
    ) {
      const file = files?.find(
        (file) => file.fieldname === "identityDocumentFront"
      ) as Express.Multer.File;

      documentFront = await stripeHelper.uploadFile({
        file: {
          data: file.buffer,
        },
        purpose: "identity_document",
      });
    }

    if (
      files &&
      _.isArray(files) &&
      files?.find((file) => file.fieldname === "identityDocumentBack")
    ) {
      const file = files?.find(
        (file) => file.fieldname === "identityDocumentBack"
      ) as Express.Multer.File;

      documentBack = await stripeHelper.uploadFile({
        file: {
          data: file.buffer,
        },
        purpose: "identity_document",
      });
    }

    if (documentFront && documentBack) {
      await stripeHelper.updateConnect(stripeConnectId, {
        individual: {
          verification: {
            document: { front: documentFront?.id, back: documentBack?.id },
          },
        },
      });
      return true;
    }
    return false;
  };
}

export default WalletService;
