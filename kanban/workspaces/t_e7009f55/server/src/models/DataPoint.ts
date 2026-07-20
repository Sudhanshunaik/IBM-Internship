import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

/**
 * Time-series-ish collection of data points. In production this should be backed
 * by a MongoDB time-series collection; we use a regular collection here for portability.
 */
const dataPointSchema = new Schema(
  {
    dataSourceId: { type: Schema.Types.ObjectId, ref: 'DataSource', required: true, index: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
    value: { type: Number },
    meta: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false }
);

dataPointSchema.index({ dataSourceId: 1, timestamp: -1 });

export type DataPointDoc = InferSchemaType<typeof dataPointSchema> & { _id: Types.ObjectId };
export const DataPointModel: Model<DataPointDoc> = model<DataPointDoc>('DataPoint', dataPointSchema);