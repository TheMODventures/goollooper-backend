import { ResponseHelper } from "../helpers/reponseapi.helper";
import { IIndustry } from "../../database/interfaces/industry.interface";
import { IndustryRepository } from "../repository/industry/industry.repository";
import { SUCCESS_DATA_DELETION_PASSED } from "../../constant";

class IndustryService {
  private industryRepository: IndustryRepository;
  constructor() {
    this.industryRepository = new IndustryRepository();
  }
  index = async () => {
    try {
      const industries = await this.industryRepository.getAll<IIndustry>({
        isDeleted: false,
      });
      if (industries.length == 0) {
        return ResponseHelper.sendResponse(404, "No industries found");
      }
      return ResponseHelper.sendResponse(200, industries);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };

  create = async (payload: IIndustry): Promise<ApiResponse> => {
    try {
      const isIndustryExist = await this.industryRepository.getOne<IIndustry>({
        name: payload.name,
        isDeleted: false,
      });
      if (isIndustryExist)
        return ResponseHelper.sendResponse(409, "Industry already exist");

      const industry = await this.industryRepository.create<IIndustry>(payload);
      return ResponseHelper.sendResponse(201, industry);
    } catch (error) {
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
  delete = async (id: string): Promise<ApiResponse> => {
    try {
      const industry = await this.industryRepository.updateById<IIndustry>(id, {
        isDeleted: true,
      });
      if (!industry)
        return ResponseHelper.sendResponse(404, "Industry not found");
      return ResponseHelper.sendSuccessResponse(SUCCESS_DATA_DELETION_PASSED);
    } catch (error) {
      console.log(error);
      return ResponseHelper.sendResponse(500, (error as Error).message);
    }
  };
}

export default IndustryService;
