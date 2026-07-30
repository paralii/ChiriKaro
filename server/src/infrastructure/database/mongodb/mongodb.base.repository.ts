import type { Model, QueryFilter , UpdateQuery, Document } from "mongoose";

export abstract class BaseRepository<
  T extends Document,> {
  protected constructor(protected readonly model: Model<T>) {}

  public async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  // public async findById(id: string): Promise<T | null> {
  //   return this.model.findById(id).exec();
  // }

  public async findOne(filter: QueryFilter<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  public async find(filter: QueryFilter<T>): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  public async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  public async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
