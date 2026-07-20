'use strict';

const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never returned by default
    },
    name: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true, versionKey: false }
);

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = model('User', userSchema);
