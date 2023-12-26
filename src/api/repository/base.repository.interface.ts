import {
  AggregateOptions,
  PipelineStage,
  PopulateOptions,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import { FilterQuery } from "mongoose";

export interface IBaseRepository<J, D> {
  getAll<T>(
    filter?: FilterQuery<T>,
    projectField?: string,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<T[] | []>;
  getOne<T>(
    filter?: FilterQuery<T>,
    projectField?: string,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean
  ): Promise<T | null>;
  getById<T>(
    id: string,
    projectField?: string,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean
  ): Promise<T | null>;
  create<T>(entity: J | D): Promise<T>;
  createMany<T>(entity: J[] | D[]): Promise<T[]>;
  updateById<T>(id: string, updateQuery: QueryOptions<T>): Promise<T | null>;
  updateByOne<T>(
    filter: FilterQuery<T>,
    updateQuery: QueryOptions<T>
  ): Promise<T | null>;
  subDocAction<T>(
    filter: FilterQuery<T>,
    updateQuery?: QueryOptions<T>,
    option?: QueryOptions
  ): Promise<Boolean>;
  delete<T>(filter?: FilterQuery<T>): Promise<boolean>;
  deleteMany<T>(filter?: FilterQuery<T>): Promise<boolean>;
  getCount<T>(filter?: FilterQuery<T>): Promise<number>;
  getDataByAggregate<T>(
    pipeline?: PipelineStage[],
    options?: AggregateOptions
  ): Promise<T[] | []>;

  getAllWithPagination<T>(
    filter?: FilterQuery<T>,
    projectField?: string,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<T[] | []>;
}
