import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

const sceneSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:   { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 2000 },
    dataSourceIds: [{ type: Schema.Types.ObjectId, ref: 'DataSource' }],
    camera: {
      position: { type: [Number], default: [0, 0, 5] },
      target:   { type: [Number], default: [0, 0, 0] },
      fov:      { type: Number, default: 60 },
    },
    isPublic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

export type SceneDoc = InferSchemaType<typeof sceneSchema> & { _id: Types.ObjectId };
export const SceneModel: Model<SceneDoc> = model<SceneDoc>('Scene', sceneSchema);