import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

/**
 * User document. Password is bcrypt-hashed (12 rounds) and never returned by REST.
 */
const userSchema = new Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    username: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role:     { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true, versionKey: false }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const UserModel: Model<UserDoc> = model<UserDoc>('User', userSchema);