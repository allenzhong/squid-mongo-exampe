import mongoose, { Schema } from "mongoose";
import { IOwner } from "../interfaces";

export const OwnerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    address: { type: String, required: true, unique: true },
  },
  {
    collection: "owners",
    timestamps: true,
  }
);

OwnerSchema.index(
  { address: 1 },
  { unique: true }
);

export const OwnerModel = mongoose.model<IOwner>(
  "owners",
  OwnerSchema
);
