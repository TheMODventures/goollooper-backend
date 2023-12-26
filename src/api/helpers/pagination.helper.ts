class PaginationHelperC {
  getMongoosePaginatedData = async ({
    model,
    page = 1,
    limit = 10,
    query = {},
    populate = "",
    select = "-password",
    sort = { createdAt: -1 },
  }: any) => {
    const options = {
      select,
      sort,
      populate,
      lean: true,
      page,
      limit,
      customLabels: {
        totalDocs: "totalItems",
        docs: "data",
        limit: "perPage",
        page: "currentPage",
        meta: "pagination",
      },
    };

    const { data, pagination } = await model.paginate(query, options);
    return { result: data, pagination };
  };

  getMongooseAggregatePaginatedData = async ({
    model,
    page = 1,
    limit = 10,
    query = [],
    populate = "",
    select = "-password",
    sort = { createdAt: -1 },
  }: any) => {
    const options = {
      select,
      sort,
      populate,
      lean: true,
      page,
      limit,
      customLabels: {
        totalDocs: "totalItems",
        docs: "data",
        limit: "perPage",
        page: "currentPage",
        meta: "pagination",
      },
    };

    const myAggregate = model.aggregate(query);
    const { data, pagination } = await model.aggregatePaginate(
      myAggregate,
      options
    );
    return { data, pagination };
  };
}

export const PaginationHelper = new PaginationHelperC();
