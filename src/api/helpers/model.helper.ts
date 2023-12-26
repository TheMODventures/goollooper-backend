import { PopulateOptions } from "mongoose";

class ModelHelperC {
  populateData = (
    path: string,
    select?: string,
    model?: String | any,
    populate?: string | any[]
  ): string | PopulateOptions => {
    return {
      path,
      model,
      select,
      populate,
    };
  };

  readonly userSelect: string =
    "username firstName lastName email phone profileImage";
  readonly subscriptionSelect: string = "name";
}

export const ModelHelper = new ModelHelperC();
