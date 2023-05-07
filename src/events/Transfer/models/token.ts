import mongoose, { Schema } from "mongoose";
import { IToken } from "../interfaces";

export const TokenSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    contractAddress: { type: String, required: true },
    tokenId: { type: String, required: true },
    owner: { type: String, required: true },
  },
  {
    collection: "tokens",
    timestamps: true,
  }
);

TokenSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true });

export const TokenModel = mongoose.model<IToken>("tokens", TokenSchema);
