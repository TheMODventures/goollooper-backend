import { FilterQuery } from "mongoose";

import {
  SUCCESS_DATA_LIST_PASSED,
  SUCCESS_DATA_SHOW_PASSED,
  SUCCESS_DATA_UPDATION_PASSED,
  SUCCESS_DATA_DELETION_PASSED,
} from "../../constant";
import { IState } from "../../database/interfaces/state.interface";
import { ICity } from "../../database/interfaces/city.interface";
import { ICounty } from "../../database/interfaces/county.interface";
import { ResponseHelper } from "../helpers/reponseapi.helper";
import { StateRepository } from "../repository/state/state.repository";
import { CityRepository } from "../repository/city/city.repository";
import { CountyRepository } from "../repository/county/county.repository";

class StateService {
  private stateRepository: StateRepository;
  private cityRepository: CityRepository;
  private countyRepository: CountyRepository;

  constructor() {
    this.stateRepository = new StateRepository();
    this.cityRepository = new CityRepository();
    this.countyRepository = new CountyRepository();
  }

  index = async (
    page: number,
    limit = 10,
    filter: FilterQuery<IState>
  ): Promise<ApiResponse> => {
    try {
      const getDocCount = await this.stateRepository.getCount(filter);
      const response = await this.stateRepository.getAll<IState>(
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

  getOneByFilter = async (
    filter: FilterQuery<IState>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.stateRepository.getOne<IState>(filter);
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

  create = async (payload: IState): Promise<ApiResponse> => {
    try {
      const data = await this.stateRepository.create<IState>(payload);
      return ResponseHelper.sendResponse(201, data);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  show = async (_id: string): Promise<ApiResponse> => {
    try {
      const filter = {
        _id,
      };
      const response = await this.stateRepository.getOne<IState>(filter);
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
    dataset: Partial<IState>
  ): Promise<ApiResponse> => {
    try {
      const response = await this.stateRepository.updateById<IState>(
        _id,
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
      const response = await this.stateRepository.delete<IState>({ _id });
      if (!response) {
        return ResponseHelper.sendResponse(404);
      }
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  // populateAllData = async (payload: { name: string; class: string }[]) => {
  //   try {
  //     for (let i = 0; i < payload?.length; i++) {
  //       let element = payload[i];
  //       const exists = await this.stateRepository.getOne<IState>({
  //         name: element?.name,
  //       });
  //       let data: IState | null = exists;

  //       // if state not exists create
  //       if (!exists) {
  //         const payloadObj: any = { name: element.name };
  //         data = await this.stateRepository.create<IState>(payloadObj);
  //       }

  //       // fetching cities
  //       const cityresponse = await fetch(
  //         `https://parseapi.back4app.com/classes/${element.class}?count=1&limit=10000&order=name&keys=name`,
  //         {
  //           headers: {
  //             "X-Parse-Application-Id":
  //               "YV6GTTBZe2seEMboA5c44F9eXledturUyBFmQwkD",
  //             "X-Parse-Master-Key": "WCx4AtqgKzDpQllBdBqeBqlpEzlr5EhfRWSbeI0n",
  //           },
  //         }
  //       );
  //       const cityData = await cityresponse.json();
  //       // saving cities in db
  //       cityData?.results?.forEach(async (field: any) => {
  //         let cityExists = await this.cityRepository.getOneByFilter({
  //           name: field?.name,
  //         });
  //         if (!cityExists) {
  //           const cityPayload: any = {
  //             name: field?.name,
  //             state: data?._id,
  //           };
  //           this.cityRepository.create<ICity>(cityPayload);
  //         }
  //       });

  //       // fetching counties
  //       const where = encodeURIComponent(
  //         JSON.stringify({
  //           stateAbbreviation: element.class,
  //         })
  //       );
  //       const countyResponse = await fetch(
  //         `https://parseapi.back4app.com/classes/Area?count=1&limit=10000&keys=countyName,state,stateAbbreviation&where=${where}`,
  //         {
  //           headers: {
  //             "X-Parse-Application-Id":
  //               "VWAH9UbFty9tuCJVHIJPjYvH8OGcNyUTMkHH3UvL",
  //             "X-Parse-Master-Key": "UsYwiuputxOcEcYTZqWKshopMgEjElqA4U4Mcy9V",
  //           },
  //         }
  //       );
  //       const countyData = await countyResponse.json();
  //       // saving counties in db
  //       countyData?.results?.forEach(async (field: any) => {
  //         let countyExists = await this.countyRepository.getOneByFilter({
  //           name: field?.countyName,
  //         });
  //         if (!countyExists) {
  //           const countyPayload: any = {
  //             name: field?.countyName,
  //             state: data?._id,
  //           };
  //           this.countyRepository.create<ICounty>(countyPayload);
  //         }
  //       });
  //     }
  //     return ResponseHelper.sendResponse(201);
  //   } catch (error) {
  //     return ResponseHelper.sendResponse(500, (error as Error).message);
  //   }
  // };
}

export default StateService;
