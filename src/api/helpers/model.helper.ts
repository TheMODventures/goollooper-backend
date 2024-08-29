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
    "username firstName lastName email phone profileImage ratingCount averageRating selectedLocation";
  readonly subscriptionSelect: string = "name";
  readonly taskSelect: string = "title description status postedBy";
}

export const ModelHelper = new ModelHelperC();
