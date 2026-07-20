import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

const dataSourceSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:    { type: String, required: true, trim: true, maxlength: 80 },
    kind:    { type: String, enum: ['sensor', 'api-poll', 'manual'], required: true },
    pollIntervalMs: { type: Number, min: 100, max: 3_600_000 },
    endpoint:       { type: String },
  },
  { timestamps: true, versionKey: false }
);

export type DataSourceDoc = InferSchemaType<typeof dataSourceSchema> & { _id: Types.ObjectId };
export const DataSourceModel: Model<DataSourceDoc> = model<DataSourceDoc>('DataSource', dataSourceSchema);