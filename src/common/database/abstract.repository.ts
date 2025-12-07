import { Logger, NotFoundException } from '@nestjs/common';
import { AbstractEntity } from './abstract.entity';
import { Model, Types, QueryFilter, UpdateQuery } from 'mongoose';

export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<T>) {}

  async create(document: Omit<T, '_id'>): Promise<T> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (await createdDocument.save()).toJSON() as unknown as T;
  }

  async findOne(filterQuery: QueryFilter<T>): Promise<T> {
    const document = await this.model.findOne(filterQuery).lean<T>();

    if (!document) {
      this.logger.warn(
        'Document was not found with given filter query ',
        filterQuery,
      );
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async findOneAndUpdate(
    filterQuery: QueryFilter<T>,
    update: UpdateQuery<T>,
  ): Promise<T> {
    const document = await this.model
      .findOneAndUpdate(filterQuery, update, {
        new: true,
      })
      .lean<T>();

    if (!document) {
      this.logger.warn(
        'Document to update was not found with given filter query ',
        filterQuery,
      );
      throw new NotFoundException('Document not found for update');
    }
    return document;
  }

  async find(filterQuery: QueryFilter<T>): Promise<T[]> {
    return this.model.find(filterQuery).lean<T[]>();
  }

  async findOneAndDelete(filterQuery: QueryFilter<T>): Promise<T> {
    const document = await this.model.findOneAndDelete(filterQuery).lean<T>();

    if (!document) {
      this.logger.warn(
        'Document to delete was not found with given filter query ',
        filterQuery,
      );
      throw new NotFoundException('Document not found for deletion');
    }

    return document;
  }
}
