import mongoose, {
  AggregateOptions,
  FilterQuery,
  Model,
  PipelineStage,
  PopulateOptions,
  QueryOptions,
  ProjectionType,
  UpdateQuery,
} from "mongoose";

import { IBaseRepository } from "./base.repository.interface";
import { PaginationHelper } from "../helpers/pagination.helper";

export abstract class BaseRepository<J, D> implements IBaseRepository<J, D> {
  public readonly model: Model<D>;

  constructor(model: Model<D>) {
    this.model = model;
  }

  async getAll<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<T[] | []> {
    let result = this.model.find(filter || {}, projectField || "");
    select && result.select(select);
    sort && result.sort(sort);
    populate && result.populate(populate);
    if (page && limit) {
      const skip = (page - 1) * limit;
      result.skip(skip).limit(limit);
    }

    lean && result.lean(lean);
    return ((await result.exec()) as T[]) || [];
  }

  async getOne<T>(
    filter?: FilterQuery<T>,
    projectField?: string,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean = true
  ): Promise<T | null> {
    const query = this.model.findOne(filter || {}, projectField || {});
    select && query.select(select);
    populate && query.populate(populate);
    lean && query.lean();
    return ((await query.exec()) as T) || null;
  }

  async getById<T>(
    id: string,
    projectField?: string,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean = true
  ): Promise<T | null> {
    const query = this.model.findById(id, projectField || {});
    select && query.select(select);
    populate && query.populate(populate);
    lean && query.lean();
    return ((await query.exec()) as T) || null;
  }

  async create<T>(entity: J | D, options: QueryOptions<T> = {}): Promise<T> {
    const dataset = {
      ...entity,
      _id: new mongoose.Types.ObjectId(),
    };
    const createdEntity = new this.model(dataset, options);
    return (await createdEntity.save()) as T;
  }
  async createMany<T>(entity: J[] | D[]): Promise<T[]> {
    const createdEntity = await this.model.insertMany(entity);
    return createdEntity as T[];
  }

  async updateById<T>(
    id: string,
    updateQuery: UpdateQuery<D>,
    options: QueryOptions<T> = {}
  ): Promise<T | null> {
    return (
      ((await this.model.findByIdAndUpdate(
        id,
        { ...updateQuery },
        { new: true, ...options }
      )) as T) || null
    );
  }

  async updateByOne<T>(
    filter: FilterQuery<T>,
    updateQuery: UpdateQuery<D>,
    options: QueryOptions<T> = {}
  ): Promise<T | null> {
    return (
      ((await this.model.findOneAndUpdate(filter, updateQuery, {
        new: true,
        ...options,
      })) as T) || null
    );
  }

  async updateMany<T>(
    filter: FilterQuery<T>,
    updateQuery: UpdateQuery<D>,
    options: QueryOptions<T> = {}
  ): Promise<T | null> {
    return (
      ((await this.model.updateMany(filter, updateQuery, {
        ...options,
      })) as T) || null
    );
  }

  async delete<T>(filter?: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter).exec();
    return result.deletedCount === 1 ? true : false;
  }

  async deleteMany<T>(filter?: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteMany(filter).exec();
    return result.deletedCount > 1 ? true : false;
  }

  async getCount<T>(filter?: FilterQuery<T>): Promise<number> {
    return (await this.model.countDocuments(filter || {})) || 0;
  }

  async subDocAction<T>(
    filter: FilterQuery<T>,
    updateQuery?: QueryOptions<T>,
    option?: QueryOptions
  ): Promise<Boolean> {
    const response = await this.model.updateOne(filter, updateQuery, {
      new: true,
      ...option,
    });
    return response.matchedCount === 0 ? false : true;
  }

  async getDataByAggregate<T>(
    pipeline?: PipelineStage[],
    options?: AggregateOptions
  ): Promise<T[] | []> {
    const result = await this.model.aggregate(pipeline, options).exec();
    return result as T[] | [];
  }

  async getAllWithPagination<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<[] | T[] | any> {
    const result = await PaginationHelper.getMongoosePaginatedData({
      model: this.model,
      query: filter,
      populate,
      page,
      limit,
      select,
      sort,
    });
    return result;
  }

  async getAllWithAggregatePagination<T>(
    pipeline?: PipelineStage[],
    projectField?: string | ProjectionType<T>,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<[] | T[] | any> {
    const result = await PaginationHelper.getMongooseAggregatePaginatedData({
      model: this.model,
      query: pipeline,
      populate,
      lean,
      page,
      limit,
      select,
      sort,
    });
    return result;
  }
}
